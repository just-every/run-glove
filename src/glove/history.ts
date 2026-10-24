import type { Row } from './model'
import type { StreamEntry } from './conversation'

// One property's history (CUST-001): every request, quote, job, visit, field
// item (photo, form, note, material, refrigerant), invoice, job purchase order
// (STOCK-002) and equipment record at the site, newest first, from what this person may see.
// Agreements (PLAN-002), their declines and booking links (PLAN-004) and the
// property's messages (COMM-007: the conversation stream of its jobs, requests
// and quotes, so calls, notes, emails, quote and purchase-order sends, push
// notices and agent actions) join with their own clauses. A call or note logged
// on a customer without a job belongs to no property and stays in the customer's
// Conversation.

type View = Record<'financings' | 'payments' | 'enquiries' | 'quotes' | 'jobs' | 'visits' | 'captures' | 'invoices' | 'equipment' | 'purchaseOrders' | 'serviceReports' | 'agreements' | 'bookingOffers', Row[]>
export type HistoryEntry = { at: string; kind: string; id: string; jobId: string | null; label: string; status: string | null }

const captureKinds: Record<string, string> = { checklist: 'form', photo: 'photo', note: 'note', material: 'material', refrigerant: 'refrigerant', form: 'form', line: 'line', arrival: 'arrival', completion: 'completion' }

function captureLabel(x: Row) {
  switch (x.kind) {
    case 'checklist': return `${x.label}: ${x.result}${x.note ? ` (${x.note})` : ''}`
    case 'photo': return x.caption ? `Photo: ${x.caption}` : 'Photo'
    case 'note': return x.text
    case 'material': return `${x.description} × ${x.quantity}${x.unit ? ` ${x.unit}` : ''}`
    case 'refrigerant': return `Refrigerant ${x.refrigerant?.type ?? ''}`.trim()
    case 'form': return `${x.formName}${x.flagged ? `: ${x.flagged} out of range` : ''}`
    case 'line': return `Added on site: ${x.description} × ${x.quantity}`
    case 'arrival': return 'Arrived on site'
    case 'completion': return x.summary ? `Completed: ${x.summary}` : 'Completed'
    default: return x.kind
  }
}

const message = (x: StreamEntry): HistoryEntry => ({ at: x.at, kind: 'message', id: x.id, jobId: x.jobId, label: `${x.kind} (${x.direction}, ${x.channel}, ${x.author}${x.to ? ` to ${x.to}` : ''}): ${x.text}`, status: x.delivery })

function agreementEntries(v: View, site: Row): HistoryEntry[] {
  const mine = v.agreements.filter(a => a.siteId === site.id), plan = new Map(mine.map(a => [a.id, a.plan.name as string]))
  const entry = (at: string, kind: string, id: string, label: string, status: string | null = null): HistoryEntry => ({ at, kind, id, jobId: null, label, status })
  return [
    ...mine.map(a => entry(a.createdAt, 'agreement', a.id, `${a.plan.name} sold (${a.via}): ${a.startDate} to ${a.endDate}, ${a.plan.includedVisits} included visits`, a.endedAt ? 'ended' : 'sold')),
    ...mine.filter(a => a.endedAt).map(a => entry(a.endedAt, 'agreement', `${a.id}:ended`, `${a.plan.name} ended by ${a.endedBy?.name ?? 'staff'}: ${a.endReason}`, 'ended')),
    ...mine.flatMap(a => (a.declines ?? []).map((d: Row) => entry(d.at, 'agreement decline', `${a.id}:${d.index}`, `${a.plan.name} visit ${d.index + 1} (due ${d.due}) declined by ${d.customerName} (${d.method}), recorded by ${d.recordedBy.name}: ${d.reason}`, 'declined'))),
    ...v.bookingOffers.filter(o => plan.has(o.agreementId)).flatMap((o): HistoryEntry[] => [
      entry(o.createdAt, 'booking link', o.id, `${plan.get(o.agreementId)} visit ${o.index + 1}: ${o.slots.length} slot${o.slots.length === 1 ? '' : 's'} offered by ${o.offeredBy.name}`, 'offered'),
      ...(o.sentOutside ? [entry(o.sentOutside.at, 'booking link', `${o.id}:sent`, `${plan.get(o.agreementId)} visit ${o.index + 1}: recorded by ${o.sentOutside.by.name} as sent by ${o.sentOutside.method}`, 'delivery not verified')] : []),
      ...(o.usedAt ? [entry(o.usedAt, 'booking link', `${o.id}:used`, `${plan.get(o.agreementId)} visit ${o.index + 1}: the customer chose a slot`, 'used')] : o.revokedAt ? [entry(o.revokedAt, 'booking link', `${o.id}:revoked`, `${plan.get(o.agreementId)} visit ${o.index + 1}: revoked`, 'revoked')] : []),
    ]),
  ]
}

export function propertyHistory(v: View, site: Row, messages: StreamEntry[] = []): HistoryEntry[] {
  const jobs = v.jobs.filter(j => j.siteId === site.id), number = new Map(jobs.map(j => [j.id, j.number as string]))
  const entry = (at: string, kind: string, id: string, jobId: string | null, label: string, status: string | null = null): HistoryEntry => ({ at, kind, id, jobId, label, status })
  return [
    ...v.enquiries.filter(e => e.siteId === site.id).map(e => entry(e.createdAt, 'request', e.id, null, `Request (${e.source}): ${e.description}`, e.status)),
    ...v.quotes.filter(q => q.siteId === site.id).map(q => entry(q.createdAt, 'quote', q.id, null, `${q.number} ${q.title}`, q.status)),
    ...v.quotes.filter(q => q.siteId === site.id).flatMap(q => (q.customerRequests ?? []).map((x: Row, i: number) => entry(x.at, 'quote response', `${q.id}:${i}`, null, `${q.number} revision ${x.revision}: ${x.name} (claimed) ${x.action}${x.message ? ` — ${x.message}` : ''}`))),
    ...jobs.map(j => entry(j.createdAt, 'job', j.id, j.id, `${j.number} ${j.title}`, j.status)),
    ...v.visits.filter(x => number.has(x.jobId)).map(x => entry(x.createdAt, 'visit', x.id, x.jobId, `${number.get(x.jobId)} visit ${x.local.date} ${x.local.start}–${x.local.end}`, x.status)),
    ...v.captures.filter(x => number.has(x.jobId)).map(x => entry(x.createdAt, captureKinds[x.kind] ?? x.kind, x.id, x.jobId, `${number.get(x.jobId)} ${captureLabel(x)}`)),
    ...v.invoices.filter(i => number.has(i.jobId)).map(i => entry(i.createdAt, 'invoice', i.id, i.jobId, `${i.number} for ${number.get(i.jobId)}`, i.status)),
    ...v.financings.filter(f => f.siteId === site.id).map(f => entry(f.inspectedAt ?? f.createdAt, 'financing', f.id, null, `Wisetack test financing for ${v.quotes.find(q => q.id === f.quoteId)?.number ?? 'quote'}: $${f.amount}`, f.status)),
    ...v.payments.filter(p => number.has(p.jobId)).map(p => entry(p.createdAt, 'payment', p.id, p.jobId, `Stripe test-mode ${p.method} payment for ${p.invoiceNumber}: $${p.amount}, tip $${p.tip}`, p.status)),
    ...v.purchaseOrders.filter(o => number.has(o.jobId)).map(o => entry(o.createdAt, 'purchase order', o.id, o.jobId, `${o.number} to ${o.supplier} for ${number.get(o.jobId)}`, o.status)),
    ...v.serviceReports.filter(r => r.siteId === site.id).map(r => entry(r.createdAt, 'service report', r.id, r.jobId, `${number.get(r.jobId)} service report`, 'prepared')),
    ...agreementEntries(v, site),
    ...messages.map(message),
    ...v.equipment.filter(e => e.siteId === site.id).map(e => entry(e.createdAt, 'equipment', e.id, null, [e.type, e.make, e.model].filter(Boolean).join(' '))),
  ].sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))
}
