import { fail, text, find, expectVersion, put, bump, event, newId, nextNumber, business, type Context, type Row } from '../model'
import { dayLabel, instant, overlaps, wallRange, wallTime } from '../time'
import { approval } from './quotes'
import { equipmentAt } from './equipment'
import { branchIdOf, branchZone, sameBranch } from '../branches'
import { priceTax } from '../sales-tax'
import { checkDiscount, givenCents } from '../discounts'
import { agreementVisits } from '../agreement-due'
import { agreementVisit, isMemberDiscount, memberDiscount, planForms } from '../agreements'
import { formsFor } from '../forms'
import { callbackOf } from '../callbacks'
import { eligibility } from '../eligibility'
import { grantLabel, openSlotOnly, useGrant } from './grants'
import { documentDiscount, lines, type Line } from '../money'
import type { Handler } from './types'
import { allow } from '../access'
import { driveTimes, mapsKey, placed } from '../maps'
import type { LatLng } from '../mercator'

// An accepted quote becomes a job; a dispatcher books visits on it for a
// technician in the business timezone. Every booking or change that collides
// with something (another visit for that technician, evidence already
// captured on the visit) is refused until the dispatcher reviews those exact
// conflicts and confirms them.

export const who = (c: Context) => ({ id: c.actor.id, name: c.actor.name, role: c.actor.role })

export type Slot = { technicianId: string; startAt: string; endAt: string; local: { date: string; start: string; end: string; timezone: string }; arrivalWindow?: { start: string; end: string } }

/**
 * DISP-006: the arrival window promised to the customer (wall-clock times on
 * the visit's date in its booking zone), separate from the planned time; the
 * planned start falls inside it, both ends included.
 */
function arrivalWindow(v: unknown, start: string) {
  if (v === undefined || v === null) return {}
  const w = v as { start?: unknown; end?: unknown }, clock = /^([01]\d|2[0-3]):[0-5]\d$/
  if (typeof w !== 'object' || typeof w.start !== 'string' || typeof w.end !== 'string' || !clock.test(w.start) || !clock.test(w.end) || w.start >= w.end) fail('WINDOW', 'An arrival window is {start, end} as HH:MM, start before end.', { field: 'window' }, 400)
  if (start < w.start! || start > w.end!) fail('WINDOW', `The planned start ${wallTime(start)} is outside the arrival window ${wallRange(w.start as string, w.end as string)}.`, { field: 'window' }, 400)
  return { arrivalWindow: { start: w.start as string, end: w.end as string } }
}
const windowLabel = (s: Slot) => s.arrivalWindow ? ` (arrival window ${wallRange(s.arrivalWindow.start, s.arrivalWindow.end)})` : ''

export function slot(c: Context, p: any): Slot {
  const technician = find(c.s, 'technicians', p.technicianId), zone = branchZone(c.s, technician)
  if (!technician.active) fail('TECHNICIAN', `${technician.name} is not an active technician.`)
  const startAt = instant(p.date, p.start, zone, 'start'), endAt = instant(p.date, p.end, zone, 'end')
  if (endAt <= startAt) fail('TIME', 'A visit ends after it starts.', null, 400)
  return { technicianId: technician.id, startAt, endAt, local: { date: p.date, start: p.start, end: p.end, timezone: zone }, ...arrivalWindow(p.window, p.start) }
}

/**
 * DISP-006: technicianId "auto" picks among active technicians with no
 * conflict at that time (branch, skills, areas, time off, calendars, other
 * visits and the owner's warn/refuse rules) the one with the fewest booked
 * minutes on that local date, then by name. With Google Maps connected
 * (DISP-002) each one's drive from their previous visit that day (the latest
 * ending by the new start; none, no drive) to the job's site joins their
 * booked minutes, and the fewest booked-plus-drive minutes wins.
 */
export async function autoAssign(c: Context, job: Row, p: any, db: D1Database): Promise<{ p: any; reason: string }> {
  if (p.technicianId !== 'auto') return { p, reason: '' }
  const booked = (id: string) => c.s.visits.filter(v => v.technicianId === id && v.status !== 'cancelled' && v.local.date === p.date).reduce((n, v) => n + (Date.parse(v.endAt) - Date.parse(v.startAt)) / 60_000, 0)
  const free = c.s.technicians.filter(t => t.active).flatMap(t => {
    try { return conflicts(c, job, slot(c, { ...p, technicianId: t.id }), null).length ? [] : [t] } catch { return [] }
  })
  if (!free.length) fail('NO_TECHNICIAN', 'No technician is free without a conflict at that time; choose one and review the conflicts.', null)
  const drives = await driveFromPrevious(c, db, job, p, free)
  const ranked = free.map(t => ({ t, minutes: booked(t.id), drive: drives?.get(t.id) ?? 0 })).sort((a, b) => a.minutes + a.drive - (b.minutes + b.drive) || a.t.name.localeCompare(b.t.name))
  return { p: { ...p, technicianId: ranked[0].t.id }, reason: drives ? `Assigned automatically: ${ranked[0].t.name} had the fewest booked and drive minutes that day (${ranked.map(x => `${x.t.name} ${x.minutes} booked + ${x.drive} drive`).join(', ')})` : `Assigned automatically: ${ranked[0].t.name} had the fewest booked minutes that day (${ranked.map(x => `${x.t.name} ${x.minutes}`).join(', ')})` }
}

/** DISP-002: each candidate's drive minutes from their previous visit that day to the job's site; null while Google Maps is not connected. */
async function driveFromPrevious(c: Context, db: D1Database, job: Row, p: any, candidates: Row[]) {
  const key = await mapsKey(db, c.s)
  if (!key) return null
  const site = find(c.s, 'sites', job.siteId, 'sites'), to = await placed(c, key, site) ?? fail('MAP_LOCATION', `Google Maps found no place for ${site.address}; correct the address or choose a technician.`)
  const previous = candidates.map(t => {
    const startAt = slot(c, { ...p, technicianId: t.id }).startAt
    return { t, visit: c.s.visits.filter(v => v.technicianId === t.id && v.status !== 'cancelled' && v.local.date === p.date && v.endAt <= startAt).sort((a, b) => b.endAt.localeCompare(a.endAt))[0] as Row | undefined }
  })
  const from: (LatLng | null)[] = []
  for (const x of previous) {
    const at = x.visit ? find(c.s, 'sites', find(c.s, 'jobs', x.visit.jobId).siteId, 'sites') : null
    from.push(at ? await placed(c, key, at) ?? fail('MAP_LOCATION', `Google Maps found no place for ${at.address}; correct the address or choose a technician.`) : null)
  }
  const legs = previous.flatMap((x, i) => from[i] ? [{ id: x.t.id, from: from[i]!, to }] : [])
  const times = await driveTimes(key, legs.map(({ from, to }) => ({ from, to })))
  return new Map(legs.map((l, i) => [l.id, times[i] ? Math.round(times[i]!.seconds / 60) : fail('ROUTING', `Google Maps found no driving route to ${site.address}; choose a technician.`)]))
}

const visitLabel = (c: Context, v: Row) => `${find(c.s, 'jobs', v.jobId).number} ${wallRange(v.local.start, v.local.end)}`

/** Everything a dispatcher must see before this booking stands (eligibility the owner set to refuse fails here). */
export function conflicts(c: Context, job: Row, next: Slot, visit: Row | null) {
  sameBranch(c.s, job, find(c.s, 'technicians', next.technicianId))
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
  event(c, { jobId: job.id, subjectKind: 'visit', subjectId: visit.id, kind: 'visit.booked', summary: `${job.number} booked for ${tech.name} ${dayLabel(next.local.date)} ${wallRange(next.local.start, next.local.end)}${windowLabel(next)}${reason.startsWith('Assigned automatically') ? `; ${reason.split('; ')[0].toLowerCase()}` : ''}${accepted.length ? ` after reviewing ${accepted.length} conflict${accepted.length === 1 ? '' : 's'}` : ''}${c.grant ? ` by ${c.actor.name} under the owner's grant to ${grantLabel(c.s, c.grant)}` : ''}`, data: { reviewedConflicts: accepted, proposalId, grantId } })
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
  // PLAN-002: an included visit under an agreement is booked at $0.00 for the plan's service; any other service call for a member takes the member discount.
  const agreement = p.agreementId !== undefined ? agreementVisit(c.s, p.agreementId, customer.id, site.id, c.now, p.agreementVisitIndex) : null
  if (agreement && !p.lines) p = { ...p, lines: [{ description: `${agreement.plan.visitServiceName} (included in ${agreement.plan.name})`, serviceId: agreement.plan.visitServiceId, quantity: '1', unitPrice: '0.00' }] }
  const discount = agreement ? null : p.discount !== undefined ? documentDiscount(p.discount) : memberDiscount(c.s, customer.id, c.now)
  const priced: Line[] = Array.isArray(p.lines) && p.lines.length ? lines(p.lines.map((l: any) => ({ ...l, tax: l?.tax ?? c.s.services.find(x => x.id === l?.serviceId)?.tax ?? (c.s.business[0]?.currency === 'AUD' ? 'GST' : 'TAXABLE') }))).map(l => { const item = l.serviceId ? c.s.services.find(x => x.id === l.serviceId) : undefined; return item ? { ...l, unitCost: item.unitCost ?? '0.00' } : l }) : []
  // QUOTE-007: a discount line on a service call is held to the owner's limit like any other.
  const totals = priceTax(c.s, { ...site, siteId: site.id }, priced, c.now, undefined, discount)
  checkDiscount(c, priced, totals, isMemberDiscount(c.s, customer.id, c.now, discount) ? givenCents([], totals) : 0)
  const checklist = priced.flatMap(line => c.s.services.find(s => s.id === line.serviceId)?.checklist ?? []).map((item: { label: string; required: boolean }) => ({ id: newId(), ...item }))
  // AGENT-006: a service call can name the site's equipment the customer is calling about.
  const equipmentIds = Array.isArray(p.equipmentIds) ? [...new Set(p.equipmentIds.map((id: unknown) => equipmentAt(c, { ...site, siteId: site.id }, id).id))] as string[] : []
  const serviceForms = formsFor(c.s, priced.map(l => l.serviceId).filter((id): id is string => !!id), equipmentIds), forms = agreement ? [...serviceForms, ...planForms(c.s, agreement, serviceForms)] : serviceForms
  const job = put(c.s, 'jobs', withCallback(c, { id: newId(), version: 1, createdAt: c.now, number: nextNumber(c, 'job', branchIdOf(c.s, site)), branchId: branchIdOf(c.s, site), quoteId: null, quoteRevision: null, customerId: customer.id, siteId: site.id, title: text(p.title ?? enquiry?.description?.slice(0, 120), 'title', { max: 200 }), lines: priced, totals, checklist, forms, equipmentIds, status: 'open', source: null, serviceCall: { enquiryId: enquiry?.id ?? null, by: who(c), at: c.now }, discount, agreementId: agreement?.id ?? null, ...(agreement ? { agreementVisitIndex: p.agreementVisitIndex ?? agreementVisits(c.s, agreement).find(v => !v.jobId && !v.completed && !v.declined && !('sourceClosed' in v && v.sourceClosed) && (!('siteId' in v) || v.siteId === site.id))!.index } : {}) }))
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
  const row = bump(c.s, 'visits', visit, { ...next, arrivalWindow: next.arrivalWindow, ...handover, assignments: [...visit.assignments, { ...next, by: who(c), at: c.now, reason, reviewedConflicts: accepted, grantId: c.grant?.id ?? null }] })
  event(c, { jobId: visit.jobId, subjectKind: 'visit', subjectId: visit.id, kind: 'visit.changed', summary: `Visit moved from ${from.name} ${dayLabel(visit.local.date)} ${wallTime(visit.local.start)} to ${to.name} ${dayLabel(next.local.date)} ${wallRange(next.local.start, next.local.end)}${windowLabel(next)}${visit.crew ? ` with crew ${visit.crew.name}` : ''}: ${reason}${accepted.length ? ` (reviewed: ${accepted.map(a => a.message).join(' ')})` : ''}${c.grant ? ` (by ${c.actor.name} under the owner's grant)` : ''}`, data: { before: { technicianId: visit.technicianId, ...visit.local }, after: { technicianId: next.technicianId, ...next.local }, reviewedConflicts: accepted } })
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

export const dispatch: Handler = async (c, type, p, db) => {
  if (!['job.create', 'visit.book', 'visit.change', 'visit.cancel', 'visit.reviewLateEvidence', 'proposal.prepare', 'proposal.approve', 'proposal.decline'].includes(type)) return undefined
  // Check direct calls as well as HTTP and workflow-rule calls. Agent grants
  // are validated afresh rather than trusting a supplied context's grant.
  if (c.actor.role === 'agent' && ['visit.book', 'visit.change'].includes(type)) {
    if (business(c.s).agentsPaused) fail('PAUSED', 'The owner has paused every agent.', null, 403)
    c.grant = useGrant(c, type, p)
  } else allow(c.actor, type)
  switch (type) {
    case 'job.create': {
      if (p.quoteId === undefined) return serviceCall(c, p)
      if (c.actor.role === 'office') fail('FORBIDDEN', 'The office makes service calls; a job from an accepted quote is the dispatcher\'s.', { type, role: c.actor.role }, 403)
      const quote = find(c.s, 'quotes', p.quoteId)
      if (quote.status !== 'accepted') fail('NOT_ACCEPTED', 'Only a quote the customer accepted becomes a job.')
      if (quote.jobId) fail('DUPLICATE', 'This quote already has a job.', { jobId: quote.jobId })
      const rev = quote.revisions.find((r: Row) => r.n === quote.acceptance.revision)
      if (!rev?.approval || rev.n !== quote.revisions.at(-1)?.n) fail('NOT_APPROVED', 'The accepted current revision must still carry its price approval before a job is created.')
      // QUOTE-001: the job carries exactly the chosen option and add-ons.
      const chosen: Row[] = quote.acceptance.lines ?? rev.lines, chosenTotals = quote.acceptance.totals ?? rev.totals, discount = quote.acceptance.discount ?? null
      const fromServices = chosen.flatMap((line: Row) => c.s.services.find(s => s.id === line.serviceId)?.checklist ?? [])
      const extra = Array.isArray(p.checklist) ? p.checklist.map((item: any, i: number) => ({ label: text(item?.label, `checklist[${i}].label`, { max: 200 }), required: item?.required === true })) : []
      const checklist = [...fromServices, ...extra].map(item => ({ id: newId(), ...item }))
      const equipmentIds = Array.isArray(p.equipmentIds) ? [...new Set(p.equipmentIds.map((id: unknown) => equipmentAt(c, quote, id).id))] : []
      const forms = formsFor(c.s, chosen.map((l: Row) => l.serviceId).filter(Boolean), equipmentIds as string[])
      const job = put(c.s, 'jobs', withCallback(c, { id: newId(), version: 1, createdAt: c.now, number: nextNumber(c, 'job', branchIdOf(c.s, quote)), branchId: branchIdOf(c.s, quote), quoteId: quote.id, quoteRevision: rev.n, customerId: quote.customerId, siteId: quote.siteId, title: quote.title, lines: chosen, totals: chosenTotals, discount, checklist, forms, equipmentIds, status: 'open', source: null }))
      bump(c.s, 'quotes', quote, { jobId: job.id })
      event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'job.created', summary: `${job.number} created from ${quote.number} revision ${rev.n} (accepted by ${quote.acceptance.customerName})`, data: { quoteId: quote.id, revision: rev.n } })
      callbackEvent(c, job)
      return job
    }
    case 'visit.book': {
      const job = find(c.s, 'jobs', p.jobId)
      if (c.actor.role === 'office' && !c.actor.custom && !c.s.agreements.some(a => a.id === job.agreementId && a.customerId === job.customerId && (a.siteId === job.siteId || (a.siteIds ?? []).includes(job.siteId)))) fail('FORBIDDEN', 'Your role (office) cannot visit.book for a job without an agreement; the dispatcher books other jobs.', { type, role: c.actor.role }, 403)
      if (p.crewId !== undefined) return bookCrew(c, job, p)
      const auto = await autoAssign(c, job, p, db)
      return book(c, job, slot(c, auto.p), p.acknowledge, [auto.reason, text(p.reason, 'reason', { optional: true, max: 500 })].filter(Boolean).join('; '))
    }
    case 'visit.change': {
      const visit = find(c.s, 'visits', p.visitId)
      expectVersion(visit, p.version)
      if (['completed', 'cancelled'].includes(visit.status)) fail('VISIT_STATE', `This visit is ${visit.status}.`)
      // DISP-007: a crew's visit moves with every member's open visit in its group, after one review of all their conflicts.
      if (visit.crew && p.technicianId !== undefined && p.technicianId !== visit.technicianId) fail('CREW', 'A crew visit moves as one; it cannot change technician. Book members separately instead.')
      const group = visit.crew ? c.s.visits.filter(v => v.crew?.groupId === visit.crew.groupId && !['completed', 'cancelled'].includes(v.status)) : [visit]
      // DISP-006: a move keeps the visit's arrival window unless it names a new one (null removes it).
      const when = { date: p.date ?? visit.local.date, start: p.start ?? visit.local.start, end: p.end ?? visit.local.end, window: p.window !== undefined ? p.window : visit.arrivalWindow }
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
      const started = group.filter(v => v.status !== 'booked' || c.s.captures.some(capture => capture.visitId === v.id))
      if (started.length) fail('VISIT_STATE', `${started.map(v => find(c.s, 'technicians', v.technicianId).name).join(', ')} already ${started.length === 1 ? 'has' : 'have'} evidence on this crew visit; it cannot be canceled as one.`)
      const cancelled = { by: who(c), at: c.now, reason: text(p.reason, 'reason', { max: 500 }) }
      const rows = group.map(v => {
        const row = bump(c.s, 'visits', v, { status: 'cancelled', cancelled })
        // PLAN-001: canceling one visit of a series skips it; the series is unchanged and never books that date again.
        event(c, { jobId: v.jobId, subjectKind: 'visit', subjectId: v.id, kind: 'visit.cancelled', summary: `Visit ${dayLabel(v.local.date)} ${wallTime(v.local.start)} ${v.series ? 'skipped in the series' : 'canceled'}${v.crew ? ` for ${find(c.s, 'technicians', v.technicianId).name} of crew ${v.crew.name}` : ''}: ${cancelled.reason}`, data: null })
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
      if (p.kind === 'move') return prepareMove(c, p)
      if (p.kind !== 'dispatch') fail('INPUT', 'Agents prepare dispatch proposals here; quotes and invoices are prepared as drafts.', null, 400)
      const job = find(c.s, 'jobs', p.plan?.jobId), next = slot(c, p.plan ?? {})
      const evidence = Array.isArray(p.evidence) ? p.evidence.slice(0, 20).map((e: unknown, i: number) => text(e, `evidence[${i}]`, { max: 500 })) : []
      const row = put(c.s, 'proposals', { id: newId(), version: 1, createdAt: c.now, kind: 'dispatch', status: 'pending', jobId: job.id, plan: { jobId: job.id, technicianId: next.technicianId, ...next.local }, rationale: text(p.rationale, 'rationale', { max: 2000 }), evidence, preparedBy: who(c), conflictsWhenPrepared: conflicts(c, job, next, null) })
      event(c, { jobId: job.id, subjectKind: 'proposal', subjectId: row.id, kind: 'proposal.prepared', summary: `${c.actor.name} (${c.actor.role}) proposed ${job.number} → ${find(c.s, 'technicians', next.technicianId).name} ${dayLabel(next.local.date)} ${wallRange(next.local.start, next.local.end)}; waiting for approval`, data: null })
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
      if (proposal.kind === 'move') return approveMove(c, proposal, job, p.acknowledge)
      const visit = book(c, job, slot(c, proposal.plan), p.acknowledge, `Approved proposal from ${proposal.preparedBy.name}`, proposal.id)
      const row = bump(c.s, 'proposals', proposal, { status: 'approved', decidedAt: c.now, visitId: visit.id })
      approval(c, 'proposal', row, `Dispatch ${job.number} → ${dayLabel(visit.local.date)} ${visit.local.start}`, proposal.version, proposal.preparedBy, 'approved')
      event(c, { jobId: job.id, subjectKind: 'proposal', subjectId: row.id, kind: 'proposal.approved', summary: `${c.actor.name} approved ${proposal.preparedBy.name}'s dispatch proposal`, data: { visitId: visit.id } })
      return row
    }
  }
}

/**
 * AGENT-003: a proposal to move a booked visit around a delay. A move that
 * keeps the planned time, or keeps the start inside the visit's arrival window
 * (DISP-006), keeps that window; any other move drops it and is labelled
 * "customer not yet asked" until the customer confirms (COMM-002/COMM-005).
 */
function moveSlot(c: Context, visit: Row, plan: { technicianId: string; date: string; start: string; end: string }) {
  const keeps = (plan.start === visit.local.start && plan.date === visit.local.date) || (!!visit.arrivalWindow && plan.date === visit.local.date && plan.start >= visit.arrivalWindow.start && plan.start <= visit.arrivalWindow.end)
  const next = slot(c, { technicianId: plan.technicianId, date: plan.date, start: plan.start, end: plan.end, window: keeps ? visit.arrivalWindow : null })
  return { next, customer: keeps ? 'unchanged' : 'customer not yet asked' }
}

function prepareMove(c: Context, p: any) {
  const visit = find(c.s, 'visits', p.visitId)
  if (visit.status !== 'booked' || visit.arrival) fail('VISIT_STATE', 'Only a booked visit not yet arrived is moved around a delay.')
  const job = find(c.s, 'jobs', visit.jobId), plan = { technicianId: p.plan?.technicianId, date: p.plan?.date ?? visit.local.date, start: p.plan?.start, end: p.plan?.end }
  const { next, customer } = moveSlot(c, visit, plan)
  const evidence = Array.isArray(p.evidence) ? p.evidence.slice(0, 20).map((e: unknown, i: number) => text(e, `evidence[${i}]`, { max: 500 })) : []
  const row = put(c.s, 'proposals', { id: newId(), version: 1, createdAt: c.now, kind: 'move', status: 'pending', jobId: job.id, visitId: visit.id, visitVersion: visit.version, plan: { jobId: job.id, technicianId: next.technicianId, ...next.local }, customer, rationale: text(p.rationale, 'rationale', { max: 2000 }), evidence, preparedBy: who(c), conflictsWhenPrepared: conflicts(c, job, next, visit) })
  event(c, { jobId: job.id, subjectKind: 'proposal', subjectId: row.id, kind: 'proposal.prepared', summary: `${c.actor.name} (${c.actor.role}) proposed moving ${job.number} from ${find(c.s, 'technicians', visit.technicianId).name} ${wallTime(visit.local.start)} to ${find(c.s, 'technicians', next.technicianId).name} ${dayLabel(next.local.date)} ${wallRange(next.local.start, next.local.end)}; ${customer === 'unchanged' ? 'the customer\'s window is kept' : 'customer not yet asked'}; waiting for approval`, data: { visitId: visit.id, customer } })
  return row
}

function approveMove(c: Context, proposal: Row, job: Row, acknowledge: unknown) {
  const visit = find(c.s, 'visits', proposal.visitId)
  if (visit.version !== proposal.visitVersion) fail('STALE', 'The visit changed after this proposal was prepared; prepare a new one.', { visit })
  const { next, customer } = moveSlot(c, visit, proposal.plan)
  const accepted = reviewed(conflicts(c, job, next, visit), acknowledge)
  const moved = change(c, visit, next, accepted, `Approved delay proposal from ${proposal.preparedBy.name}${customer === 'unchanged' ? '' : '; customer not yet asked'}`)
  const row = bump(c.s, 'proposals', proposal, { status: 'approved', decidedAt: c.now })
  approval(c, 'proposal', row, `Move ${job.number} → ${dayLabel(moved.local.date)} ${moved.local.start}`, proposal.version, proposal.preparedBy, 'approved')
  event(c, { jobId: job.id, subjectKind: 'proposal', subjectId: row.id, kind: 'proposal.approved', summary: `${c.actor.name} approved ${proposal.preparedBy.name}'s proposal to move ${job.number}`, data: { visitId: visit.id, customer } })
  return row
}
