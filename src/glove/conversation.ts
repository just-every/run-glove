import { fail, text, oneOf, find, put, newId, event, type Row, type State } from './model'
import type { Handler } from './commands/types'
import type { MailState } from './mail'

// COMM-007: one conversation history per customer and per job. The stream
// merges every message Glove sends or receives today and the records of
// messages people exchanged outside it: staff-logged calls and notes, requests
// as they arrived, quotes recorded as sent and the customer's recorded answer,
// request follow-ups, purchase orders recorded as sent to a supplier for the
// job, Web Push notices to technicians about the job (with the push service's
// answer), and agent actions. Each entry has its direction, channel, author,
// recipient and delivery outcome, and nothing claims a delivery the provider
// did not report. Entries are ordered by the moment Glove recorded them (UTC,
// oldest first). Emails Glove sends (COMM-001) carry the provider-reported
// state. Texts, calls on the business number, portal actions and agent
// conversations join as COMM-002/005/006/009 and AGENT-001 ship.

export const callOutcomes = ['answered', 'voicemail', 'no answer'] as const

export type StreamEntry = {
  id: string; at: string; jobId: string | null; kind: string
  direction: 'inbound' | 'outbound' | 'internal'; channel: string
  author: string; to: string | null; recordedBy: string | null; text: string; delivery: string
}

/** A provider-written or agent event the stream reads from the timeline. */
export type StreamEvent = { id: string; at: string; actorName: string; actorRole: string; jobId: string | null; subjectKind: string; subjectId: string; kind: string; summary: string; jobIds: string | null; technicianId: string | null; status: number | null }

export const conversations: Handler = async (c, type, p) => {
  if (type !== 'conversation.log') return undefined
  const customer = find(c.s, 'customers', p.customerId)
  if (customer.mergedInto) fail('MERGED', `${customer.name} was merged into another customer; log on that customer.`)
  const job = p.jobId ? find(c.s, 'jobs', p.jobId) : null
  if (job && job.customerId !== customer.id) fail('CUSTOMER', 'That job belongs to another customer.')
  const kind = oneOf(p.kind, ['call', 'note'] as const, 'kind'), call = kind === 'call'
  const minutes = !call || p.minutes === undefined || p.minutes === null ? null : Number.isInteger(p.minutes) && p.minutes >= 0 && p.minutes <= 600 ? p.minutes as number : fail('INPUT', 'minutes is whole minutes from 0 to 600.', { field: 'minutes' }, 400)
  const row = put(c.s, 'conversations', {
    id: newId(), version: 1, createdAt: c.now, customerId: customer.id, jobId: job?.id ?? null, kind,
    direction: call ? oneOf(p.direction, ['inbound', 'outbound'] as const, 'direction') : null,
    outcome: call ? oneOf(p.outcome, callOutcomes, 'outcome') : null, minutes,
    text: text(p.text, 'text', { optional: call, max: 4000 }) ?? '', by: { id: c.actor.id, name: c.actor.name, role: c.actor.role },
  })
  event(c, { jobId: row.jobId, subjectKind: 'conversation', subjectId: row.id, kind: call ? 'call.logged' : 'note.logged', summary: call ? `${c.actor.name} logged an ${row.direction} call ${row.direction === 'inbound' ? 'from' : 'to'} ${customer.name} (${row.outcome}${minutes !== null ? `, ${minutes} min` : ''})${job ? ` on ${job.number}` : ''}` : `${c.actor.name} logged a note on ${customer.name}${job ? `'s job ${job.number}` : ''}`, data: { customerId: customer.id, kind, direction: row.direction, outcome: row.outcome, minutes } })
  return row
}

const pushDelivery = (status: number | null) => !status ? 'Not sent: the push service could not be reached'
  : status >= 200 && status < 300 ? `Handed to the push service (HTTP ${status}); arrival on the phone is not confirmed` : `Not sent: the push service answered HTTP ${status}`

/** The ordered stream for one customer (all their jobs), one job or one property (CUST-001: the jobs, requests and quotes at the site), from what the reader may see. */
export function stream(v: State, events: StreamEvent[], scope: { customerId: string } | { jobId: string } | { site: Row }, mail: Map<string, MailState> = new Map()): StreamEntry[] {
  const job = 'jobId' in scope ? v.jobs.find(j => j.id === scope.jobId) ?? fail('NOT_FOUND', 'No such job for you.', null, 404) : null
  const site = 'site' in scope ? scope.site : null
  const customer = v.customers.find(x => x.id === (job ? job.customerId : site ? site.customerId : (scope as { customerId: string }).customerId)) ?? fail('NOT_FOUND', 'No such customer for you.', null, 404)
  // A merged-away customer's records keep their own customerId until moved, so the survivor reads them too.
  const customerIds = new Set([customer.id, ...v.customers.filter(x => x.mergedInto === customer.id).map(x => x.id)])
  const jobs = job ? [job] : v.jobs.filter(j => site ? j.siteId === site.id : customerIds.has(j.customerId)), jobIds = new Set(jobs.map(j => j.id)), number = new Map(jobs.map(j => [j.id, j.number as string]))
  const quotes = job ? v.quotes.filter(q => q.id === job.quoteId) : v.quotes.filter(q => site ? q.siteId === site.id : customerIds.has(q.customerId))
  const enquiries = job ? v.enquiries.filter(e => quotes.some(q => q.enquiryId === e.id)) : v.enquiries.filter(e => site ? e.siteId === site.id : customerIds.has(e.customerId))
  const jobOf = (q: Row) => v.jobs.find(j => j.quoteId === q.id && jobIds.has(j.id))?.id ?? null
  const on = (jobId: string | null) => jobId && number.has(jobId) ? ` (${number.get(jobId)})` : ''
  const related = new Set<string>([...(site ? [] : [customer.id]), ...jobIds, ...quotes.map(q => q.id), ...enquiries.map(e => e.id), ...v.visits.filter(x => jobIds.has(x.jobId)).map(x => x.id), ...v.invoices.filter(i => jobIds.has(i.jobId)).map(i => i.id), ...v.proposals.filter(x => jobIds.has(x.jobId)).map(x => x.id)])
  const technician = (id: string | null) => v.technicians.find(t => t.id === id)?.name ?? 'a technician'
  const entries: StreamEntry[] = [
    ...v.conversations.filter(x => job || site ? x.jobId && jobIds.has(x.jobId) : customerIds.has(x.customerId)).map((x): StreamEntry => x.kind === 'call'
      ? { id: `call:${x.id}`, at: x.createdAt, jobId: x.jobId, kind: 'call', direction: x.direction, channel: 'phone call (logged)', author: x.direction === 'inbound' ? customer.name : x.by.name, to: x.direction === 'inbound' ? x.by.name : customer.name, recordedBy: x.by.name, text: x.text, delivery: `${x.outcome}${x.minutes !== null ? `, ${x.minutes} min` : ''}` }
      : { id: `note:${x.id}`, at: x.createdAt, jobId: x.jobId, kind: 'note', direction: 'internal', channel: 'note', author: x.by.name, to: null, recordedBy: x.by.name, text: x.text, delivery: 'Internal note: not sent to the customer' }),
    ...enquiries.map((e): StreamEntry => ({ id: `request:${e.id}`, at: e.createdAt, jobId: null, kind: 'request', direction: 'inbound', channel: e.source, author: customer.name, to: null, recordedBy: e.createdBy?.name ?? null, text: e.description, delivery: 'Received' })),
    ...enquiries.flatMap(e => (e.contacts ?? []).map((x: Row, i: number): StreamEntry => ({ id: `request-contact:${e.id}:${i}`, at: x.at, jobId: null, kind: 'request follow-up', direction: 'outbound', channel: 'recorded contact', author: x.by.name, to: customer.name, recordedBy: x.by.name, text: x.note ?? 'Contacted about their request', delivery: 'Not confirmed: contact made outside Glove' }))),
    ...quotes.flatMap(q => (q.sent ?? []).flatMap((x: Row, i: number): StreamEntry[] => x.messageId ? [] : [{ id: `quote-sent:${q.id}:${i}`, at: x.at, jobId: jobOf(q), kind: 'quote sent', direction: 'outbound', channel: x.channel, author: x.recordedBy.name, to: customer.name, recordedBy: x.recordedBy.name, text: `${q.number} revision ${x.revision}${x.note ? `: ${x.note}` : ''}`, delivery: 'Not confirmed: sent outside Glove' }])),
    ...quotes.flatMap(q => (q.customerRequests ?? []).filter((x: Row) => x.action !== 'decline').map((x: Row, i: number): StreamEntry => ({ id: `quote-request:${q.id}:${i}`, at: x.at, jobId: jobOf(q), kind: x.action === 'update' ? 'updated quote requested' : 'quote changes requested', direction: 'inbound', channel: 'customer link', author: `${x.name} (claimed)`, to: null, recordedBy: 'Customer quote link', text: `${q.number} revision ${x.revision}${x.message ? `: ${x.message}` : ''}`, delivery: 'Received' }))),
    ...quotes.flatMap(q => [q.acceptance, q.declined].filter(Boolean).map((x: Row): StreamEntry => ({ id: `quote-answer:${q.id}`, at: x.at, jobId: jobOf(q), kind: q.acceptance === x ? 'quote accepted' : 'quote declined', direction: 'inbound', channel: x.method, author: x.customerName, to: null, recordedBy: x.recordedBy.name, text: `${q.number} revision ${x.revision} ${q.acceptance === x ? 'accepted' : 'declined'}${x.note ? `: ${x.note}` : ''}`, delivery: 'Received' }))),
    ...v.purchaseOrders.filter(o => o.sent && !o.sent.messageId && jobIds.has(o.jobId)).map((o): StreamEntry => ({ id: `po-sent:${o.id}`, at: o.sent.at, jobId: o.jobId, kind: 'purchase order sent', direction: 'outbound', channel: o.sent.method, author: o.sent.by.name, to: o.supplier, recordedBy: o.sent.by.name, text: `${o.number} for${on(o.jobId)}`, delivery: 'Not confirmed: sent outside Glove' })),
    // COMM-001: every email Glove sent about this customer, their jobs or quotes (and a job's purchase orders), with its provider-reported state.
    ...v.messages.filter(m => job || site ? (m.jobId && jobIds.has(m.jobId)) || quotes.some(q => q.id === m.subjectId) : customerIds.has(m.customerId) || (m.jobId && jobIds.has(m.jobId))).map((m): StreamEntry => {
      const quote = quotes.find(q => q.id === m.subjectId), jobId = m.jobId && jobIds.has(m.jobId) ? m.jobId : quote ? jobOf(quote) : null
      return { id: `email:${m.id}`, at: m.createdAt, jobId, kind: `${{ quote: 'quote', invoice: 'invoice', purchaseOrder: 'purchase order', bookingLink: 'booking link', quoteLink: 'customer quote link' }[m.kind as string] ?? m.kind} emailed`, direction: 'outbound', channel: 'email', author: m.by.name, to: m.to, recordedBy: m.by.name, text: m.subject, delivery: mail.get(m.id)?.text ?? 'Queued: no answer from the provider yet' }
    }),
    ...events.flatMap((e): StreamEntry[] => {
      if (e.kind === 'push.outcome') {
        const about = (e.jobIds ? JSON.parse(e.jobIds) as string[] : []).filter(id => jobIds.has(id))
        return about.length ? [{ id: `push:${e.id}`, at: e.at, jobId: about.length === 1 ? about[0] : null, kind: 'push notice', direction: 'outbound', channel: 'Web Push', author: 'Glove', to: technician(e.technicianId), recordedBy: null, text: `Visit notice about ${about.map(id => number.get(id)).join(', ')}`, delivery: pushDelivery(e.status) }] : []
      }
      return e.actorRole === 'agent' && ((e.jobId && jobIds.has(e.jobId)) || related.has(e.subjectId)) ? [{ id: `agent:${e.id}`, at: e.at, jobId: e.jobId && jobIds.has(e.jobId) ? e.jobId : null, kind: 'agent action', direction: 'internal', channel: 'agent', author: e.actorName, to: null, recordedBy: null, text: e.summary, delivery: 'Prepared in Glove: nothing sent to the customer' }] : []
    }),
  ]
  return entries.map((x, i) => ({ x, i })).sort((a, b) => a.x.at.localeCompare(b.x.at) || a.i - b.i).map(({ x }) => x)
}
