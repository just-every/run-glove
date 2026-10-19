import { fail, text, find, expectVersion, put, bump, event, newId, nextNumber, business, type Context, type Row } from '../model'
import { dayLabel, instant, overlaps } from '../time'
import { approval } from './quotes'
import { equipmentAt } from './equipment'
import { formsFor } from '../forms'
import { callbackOf } from '../callbacks'
import { eligibility } from '../eligibility'
import { grantLabel, openSlotOnly } from './grants'
import { lines, totals, type Line } from '../money'
import type { Handler } from './types'

// An accepted quote becomes a job; a dispatcher books visits on it for a
// technician in the business timezone. Every booking or change that collides
// with something (another visit for that technician, evidence already
// captured on the visit) is refused until the dispatcher reviews those exact
// conflicts and confirms them.

export const who = (c: Context) => ({ id: c.actor.id, name: c.actor.name, role: c.actor.role })

export type Slot = { technicianId: string; startAt: string; endAt: string; local: { date: string; start: string; end: string } }

export function slot(c: Context, p: any): Slot {
  const zone = business(c.s).timezone, technician = find(c.s, 'technicians', p.technicianId)
  if (!technician.active) fail('TECHNICIAN', `${technician.name} is not an active technician.`)
  const startAt = instant(p.date, p.start, zone, 'start'), endAt = instant(p.date, p.end, zone, 'end')
  if (endAt <= startAt) fail('TIME', 'A visit ends after it starts.', null, 400)
  return { technicianId: technician.id, startAt, endAt, local: { date: p.date, start: p.start, end: p.end } }
}

const visitLabel = (c: Context, v: Row) => `${find(c.s, 'jobs', v.jobId).number} ${v.local.start}–${v.local.end}`

/** Everything a dispatcher must see before this booking stands (eligibility the owner set to refuse fails here). */
export function conflicts(c: Context, job: Row, next: Slot, visit: Row | null) {
  const found: { code: string; message: string }[] = eligibility(c, job, next)
  const tech = find(c.s, 'technicians', next.technicianId)
  for (const other of c.s.visits) {
    if (other.id === visit?.id || other.status === 'cancelled' || other.technicianId !== next.technicianId) continue
    if (overlaps(next, other)) found.push({ code: `overlap:${other.id}`, message: `${tech.name} already has ${visitLabel(c, other)} on ${dayLabel(other.local.date)}.` })
  }
  if (visit) {
    const captured = c.s.captures.filter(x => x.visitId === visit.id && x.kind !== 'arrival')
    if (visit.arrival || captured.length) {
      const by = find(c.s, 'technicians', visit.technicianId).name
      found.push({ code: 'evidence', message: `${by} has already recorded ${[visit.arrival ? 'arrival' : '', captured.length ? `${captured.length} field item${captured.length === 1 ? '' : 's'}` : ''].filter(Boolean).join(' and ')} on this visit. That evidence stays with this visit.` })
    }
  }
  return found
}

export function reviewed(found: { code: string; message: string }[], acknowledge: unknown) {
  const given = new Set(Array.isArray(acknowledge) ? acknowledge : [])
  const missing = found.filter(f => !given.has(f.code))
  if (missing.length) fail('CONFLICT_REVIEW', 'Review these dispatch conflicts, then confirm the change.', { conflicts: found })
  return found
}

export function book(c: Context, job: Row, next: Slot, acknowledge: unknown, reason: string, proposalId: string | null = null) {
  if (job.status !== 'open') fail('JOB_STATE', `${job.number} is ${job.status}.`)
  const found = conflicts(c, job, next, null)
  openSlotOnly(c, found)
  const accepted = reviewed(found, acknowledge)
  const tech = find(c.s, 'technicians', next.technicianId), grantId = c.grant?.id ?? null
  const visit = put(c.s, 'visits', { id: newId(), version: 1, createdAt: c.now, jobId: job.id, ...next, status: 'booked', assignments: [{ ...next, by: who(c), at: c.now, reason, reviewedConflicts: accepted, proposalId, grantId }], arrival: null, completion: null, lateEvidence: [] })
  event(c, { jobId: job.id, subjectKind: 'visit', subjectId: visit.id, kind: 'visit.booked', summary: `${job.number} booked for ${tech.name} ${dayLabel(next.local.date)} ${next.local.start}–${next.local.end}${accepted.length ? ` after reviewing ${accepted.length} conflict${accepted.length === 1 ? '' : 's'}` : ''}${c.grant ? ` by ${c.actor.name} under the owner's grant to ${grantLabel(c.s, c.grant)}` : ''}`, data: { reviewedConflicts: accepted, proposalId, grantId } })
  return visit
}

/** AGENT-006: a new job naming a unit serviced within the callback window is a callback. */
const withCallback = (c: Context, job: Row): Row => ({ ...job, callback: callbackOf(c.s, job) })

function callbackEvent(c: Context, job: Row) {
  if (!job.callback) return
  const units = job.callback.equipment.map((h: Row) => { const e = c.s.equipment.find(x => x.id === h.equipmentId)!; return [e.type, e.make, e.model].filter(Boolean).join(' ') })
  event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'job.callback', summary: `${job.number} is a callback: ${units.join(', ')} serviced in the last ${job.callback.days} days`, data: job.callback })
}

/**
 * BOOK-005: a service call is a job made straight from a request or the
 * customer record, with zero or more lines (a diagnostic or trip fee); none of
 * its prices counts as approved until its invoice revision is approved.
 */
function serviceCall(c: Context, p: any) {
  const enquiry = p.enquiryId ? find(c.s, 'enquiries', p.enquiryId) : null
  const customer = find(c.s, 'customers', p.customerId ?? enquiry?.customerId), site = find(c.s, 'sites', p.siteId ?? enquiry?.siteId, 'sites')
  if (site.customerId !== customer.id) fail('SITE', 'That site belongs to another customer.')
  if (enquiry && enquiry.customerId !== customer.id) fail('ENQUIRY', 'That request belongs to another customer.')
  if (enquiry && ['won', 'lost'].includes(enquiry.status)) fail('ENQUIRY_STATE', `This request is already ${enquiry.status}.`)
  const priced: Line[] = Array.isArray(p.lines) && p.lines.length ? lines(p.lines).map(l => { const item = l.serviceId ? c.s.services.find(x => x.id === l.serviceId) : undefined; return item ? { ...l, unitCost: item.unitCost ?? '0.00' } : l }) : []
  const checklist = priced.flatMap(line => c.s.services.find(s => s.id === line.serviceId)?.checklist ?? []).map((item: { label: string; required: boolean }) => ({ id: newId(), ...item }))
  // AGENT-006: a service call can name the site's equipment the customer is calling about.
  const equipmentIds = Array.isArray(p.equipmentIds) ? [...new Set(p.equipmentIds.map((id: unknown) => equipmentAt(c, { ...site, siteId: site.id }, id).id))] as string[] : []
  const job = put(c.s, 'jobs', withCallback(c, { id: newId(), version: 1, createdAt: c.now, number: nextNumber(c, 'job'), quoteId: null, quoteRevision: null, customerId: customer.id, siteId: site.id, title: text(p.title ?? enquiry?.description?.slice(0, 120), 'title', { max: 200 }), lines: priced, totals: totals(priced), checklist, forms: formsFor(c.s, priced.map(l => l.serviceId).filter((id): id is string => !!id), equipmentIds), equipmentIds, status: 'open', source: null, serviceCall: { enquiryId: enquiry?.id ?? null, by: who(c), at: c.now } }))
  if (enquiry) bump(c.s, 'enquiries', enquiry, { status: 'won', stageAt: c.now, wonAt: c.now, wonJobId: job.id })
  event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'job.created', summary: `${job.number} created as a service call without a quote by ${c.actor.name}${priced.length ? ` with ${priced.map(l => l.description).join(', ')}` : ''}; no price is approved until its invoice is`, data: { serviceCall: true, enquiryId: enquiry?.id ?? null } })
  callbackEvent(c, job)
  return job
}

/** One visit's change to `next`, recorded with its reason and reviewed conflicts (GLOVE-07). */
function change(c: Context, visit: Row, next: Slot, accepted: { code: string; message: string }[], reason: string) {
  const from = find(c.s, 'technicians', visit.technicianId), to = find(c.s, 'technicians', next.technicianId)
  // A new technician records their own arrival; the earlier one stays as evidence in the captures.
  const handover = next.technicianId !== visit.technicianId ? { arrival: null, status: 'booked' } : {}
  const row = bump(c.s, 'visits', visit, { ...next, ...handover, assignments: [...visit.assignments, { ...next, by: who(c), at: c.now, reason, reviewedConflicts: accepted, grantId: c.grant?.id ?? null }] })
  event(c, { jobId: visit.jobId, subjectKind: 'visit', subjectId: visit.id, kind: 'visit.changed', summary: `Visit moved from ${from.name} ${dayLabel(visit.local.date)} ${visit.local.start} to ${to.name} ${dayLabel(next.local.date)} ${next.local.start}–${next.local.end}${visit.crew ? ` with crew ${visit.crew.name}` : ''}: ${reason}${accepted.length ? ` (reviewed: ${accepted.map(a => a.message).join(' ')})` : ''}${c.grant ? ` (by ${c.actor.name} under the owner's grant)` : ''}`, data: { before: { technicianId: visit.technicianId, ...visit.local }, after: { technicianId: next.technicianId, ...next.local }, reviewedConflicts: accepted } })
  return row
}

const uniq = (found: { code: string; message: string }[]) => found.filter((f, i) => found.findIndex(g => g.code === f.code && g.message === f.message) === i)

/** DISP-007: a crew books one visit per active member at the same time, in one command, after one review of every member's conflicts. */
function bookCrew(c: Context, job: Row, p: any) {
  const crew = find(c.s, 'crews', p.crewId)
  const slots = crew.memberIds.map((technicianId: string) => slot(c, { ...p, technicianId }))
  const found = uniq(slots.flatMap((next: Slot) => conflicts(c, job, next, null)))
  openSlotOnly(c, found)
  reviewed(found, p.acknowledge)
  const reason = text(p.reason, 'reason', { optional: true, max: 500 }), groupId = newId()
  const visits = slots.map((next: Slot) => bump(c.s, 'visits', book(c, job, next, p.acknowledge, reason), { crew: { crewId: crew.id, name: crew.name, groupId } }))
  return { id: groupId, crewId: crew.id, visits }
}

export const dispatch: Handler = async (c, type, p) => {
  switch (type) {
    case 'job.create': {
      if (p.quoteId === undefined) return serviceCall(c, p)
      if (c.actor.role === 'office') fail('FORBIDDEN', 'The office makes service calls; a job from an accepted quote is the dispatcher\'s.', { type, role: c.actor.role }, 403)
      const quote = find(c.s, 'quotes', p.quoteId)
      if (quote.status !== 'accepted') fail('NOT_ACCEPTED', 'Only a quote the customer accepted becomes a job.')
      if (quote.jobId) fail('DUPLICATE', 'This quote already has a job.', { jobId: quote.jobId })
      const rev = quote.revisions.find((r: Row) => r.n === quote.acceptance.revision)
      // QUOTE-001: the job carries exactly the chosen option and add-ons.
      const chosen: Row[] = quote.acceptance.lines ?? rev.lines, chosenTotals = quote.acceptance.totals ?? rev.totals
      const fromServices = chosen.flatMap((line: Row) => c.s.services.find(s => s.id === line.serviceId)?.checklist ?? [])
      const extra = Array.isArray(p.checklist) ? p.checklist.map((item: any, i: number) => ({ label: text(item?.label, `checklist[${i}].label`, { max: 200 }), required: item?.required === true })) : []
      const checklist = [...fromServices, ...extra].map(item => ({ id: newId(), ...item }))
      const equipmentIds = Array.isArray(p.equipmentIds) ? [...new Set(p.equipmentIds.map((id: unknown) => equipmentAt(c, quote, id).id))] : []
      const forms = formsFor(c.s, chosen.map((l: Row) => l.serviceId).filter(Boolean), equipmentIds as string[])
      const job = put(c.s, 'jobs', withCallback(c, { id: newId(), version: 1, createdAt: c.now, number: nextNumber(c, 'job'), quoteId: quote.id, quoteRevision: rev.n, customerId: quote.customerId, siteId: quote.siteId, title: quote.title, lines: chosen, totals: chosenTotals, checklist, forms, equipmentIds, status: 'open', source: null }))
      bump(c.s, 'quotes', quote, { jobId: job.id })
      event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'job.created', summary: `${job.number} created from ${quote.number} revision ${rev.n} (accepted by ${quote.acceptance.customerName})`, data: { quoteId: quote.id, revision: rev.n } })
      callbackEvent(c, job)
      return job
    }
    case 'visit.book': {
      const job = find(c.s, 'jobs', p.jobId)
      if (p.crewId !== undefined) return bookCrew(c, job, p)
      return book(c, job, slot(c, p), p.acknowledge, text(p.reason, 'reason', { optional: true, max: 500 }))
    }
    case 'visit.change': {
      const visit = find(c.s, 'visits', p.visitId)
      expectVersion(visit, p.version)
      if (['completed', 'cancelled'].includes(visit.status)) fail('VISIT_STATE', `This visit is ${visit.status}.`)
      // DISP-007: a crew's visit moves with every member's open visit in its group, after one review of all their conflicts.
      if (visit.crew && p.technicianId !== undefined && p.technicianId !== visit.technicianId) fail('CREW', 'A crew visit moves as one; it cannot change technician. Book members separately instead.')
      const group = visit.crew ? c.s.visits.filter(v => v.crew?.groupId === visit.crew.groupId && !['completed', 'cancelled'].includes(v.status)) : [visit]
      const when = { date: p.date ?? visit.local.date, start: p.start ?? visit.local.start, end: p.end ?? visit.local.end }
      const moves = group.map(v => ({ v, next: slot(c, { technicianId: v.id === visit.id ? p.technicianId ?? v.technicianId : v.technicianId, ...when }) }))
      const found = uniq(moves.flatMap(({ v, next }) => conflicts(c, find(c.s, 'jobs', v.jobId), next, v)))
      openSlotOnly(c, found)
      const accepted = reviewed(found, p.acknowledge)
      const reason = text(p.reason, 'reason', { max: 500 })
      const rows = moves.map(({ v, next }) => change(c, v, next, accepted, reason))
      return rows.find(r => r.id === visit.id)
    }
    case 'visit.cancel': {
      const visit = find(c.s, 'visits', p.visitId)
      expectVersion(visit, p.version)
      if (visit.status !== 'booked') fail('VISIT_STATE', `A visit that is ${visit.status} keeps its evidence and cannot be canceled.`)
      // DISP-007: canceling a crew's visit cancels every member's visit in its group, all still booked.
      const group = visit.crew ? c.s.visits.filter(v => v.crew?.groupId === visit.crew.groupId && v.status !== 'cancelled') : [visit]
      const started = group.filter(v => v.status !== 'booked')
      if (started.length) fail('VISIT_STATE', `${started.map(v => find(c.s, 'technicians', v.technicianId).name).join(', ')} already ${started.length === 1 ? 'has' : 'have'} evidence on this crew visit; it cannot be canceled as one.`)
      const cancelled = { by: who(c), at: c.now, reason: text(p.reason, 'reason', { max: 500 }) }
      const rows = group.map(v => {
        const row = bump(c.s, 'visits', v, { status: 'cancelled', cancelled })
        // PLAN-001: canceling one visit of a series skips it; the series is unchanged and never books that date again.
        event(c, { jobId: v.jobId, subjectKind: 'visit', subjectId: v.id, kind: 'visit.cancelled', summary: `Visit ${dayLabel(v.local.date)} ${v.local.start} ${v.series ? 'skipped in the series' : 'canceled'}${v.crew ? ` for ${find(c.s, 'technicians', v.technicianId).name} of crew ${v.crew.name}` : ''}: ${cancelled.reason}`, data: null })
        return row
      })
      return rows.find(r => r.id === visit.id)
    }
    case 'visit.reviewLateEvidence': {
      const visit = find(c.s, 'visits', p.visitId)
      expectVersion(visit, p.version)
      const pending = visit.lateEvidence.filter((x: Row) => !x.reviewed)
      if (!pending.length) fail('NOTHING_TO_REVIEW', 'No late evidence is waiting on this visit.')
      const row = bump(c.s, 'visits', visit, { lateEvidence: visit.lateEvidence.map((x: Row) => x.reviewed ? x : { ...x, reviewed: { by: who(c), at: c.now, note: text(p.note, 'note', { optional: true, max: 500 }) } }) })
      event(c, { jobId: visit.jobId, subjectKind: 'visit', subjectId: visit.id, kind: 'visit.lateEvidenceReviewed', summary: `${c.actor.name} reviewed ${pending.length} field item${pending.length === 1 ? '' : 's'} that arrived after the visit changed`, data: null })
      return row
    }
    case 'proposal.prepare': {
      if (p.kind !== 'dispatch') fail('INPUT', 'Agents prepare dispatch proposals here; quotes and invoices are prepared as drafts.', null, 400)
      const job = find(c.s, 'jobs', p.plan?.jobId), next = slot(c, p.plan ?? {})
      const evidence = Array.isArray(p.evidence) ? p.evidence.slice(0, 20).map((e: unknown, i: number) => text(e, `evidence[${i}]`, { max: 500 })) : []
      const row = put(c.s, 'proposals', { id: newId(), version: 1, createdAt: c.now, kind: 'dispatch', status: 'pending', jobId: job.id, plan: { jobId: job.id, technicianId: next.technicianId, ...next.local }, rationale: text(p.rationale, 'rationale', { max: 2000 }), evidence, preparedBy: who(c), conflictsWhenPrepared: conflicts(c, job, next, null) })
      event(c, { jobId: job.id, subjectKind: 'proposal', subjectId: row.id, kind: 'proposal.prepared', summary: `${c.actor.name} (${c.actor.role}) proposed ${job.number} → ${find(c.s, 'technicians', next.technicianId).name} ${dayLabel(next.local.date)} ${next.local.start}–${next.local.end}; waiting for approval`, data: null })
      return row
    }
    case 'proposal.approve':
    case 'proposal.decline': {
      const proposal = find(c.s, 'proposals', p.proposalId)
      expectVersion(proposal, p.version)
      if (proposal.status !== 'pending') fail('PROPOSAL_STATE', `This proposal is ${proposal.status}.`)
      if (proposal.preparedBy.id === c.actor.id) fail('SELF_APPROVAL', 'Someone other than the preparer approves a proposal.')
      const job = find(c.s, 'jobs', proposal.jobId)
      if (type === 'proposal.decline') {
        const reason = text(p.reason, 'reason', { max: 500 })
        const row = bump(c.s, 'proposals', proposal, { status: 'declined', decidedAt: c.now })
        approval(c, 'proposal', row, `Dispatch ${job.number}`, proposal.version, proposal.preparedBy, 'declined', reason)
        event(c, { jobId: job.id, subjectKind: 'proposal', subjectId: row.id, kind: 'proposal.declined', summary: `${c.actor.name} declined the dispatch proposal: ${reason}`, data: null })
        return row
      }
      const visit = book(c, job, slot(c, proposal.plan), p.acknowledge, `Approved proposal from ${proposal.preparedBy.name}`, proposal.id)
      const row = bump(c.s, 'proposals', proposal, { status: 'approved', decidedAt: c.now, visitId: visit.id })
      approval(c, 'proposal', row, `Dispatch ${job.number} → ${dayLabel(visit.local.date)} ${visit.local.start}`, proposal.version, proposal.preparedBy, 'approved')
      event(c, { jobId: job.id, subjectKind: 'proposal', subjectId: row.id, kind: 'proposal.approved', summary: `${c.actor.name} approved ${proposal.preparedBy.name}'s dispatch proposal`, data: { visitId: visit.id } })
      return row
    }
  }
}
