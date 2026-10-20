import { addMonths, agreementVisits } from './agreement-due'
import { fail, text, oneOf, find, expectVersion, put, bump, event, newId, business, type Row, type State } from './model'
import { cents, dollars, type DocumentDiscount } from './money'
import { localParts } from './time'
import type { Handler } from './commands/types'

// PLAN-002 maintenance agreements. The owner defines plans (price, term in
// whole months, included visits of one price-book service, member repair
// discount percent, priority booking, inspection forms). A plan is sold to a
// customer at one of their sites by the desk, recorded as sold by phone, in
// person or on an accepted quote, and the agreement keeps a copy of the plan
// as sold. Its term runs from the start date for the plan's months, the last
// day being the day before the same date that many months later (local dates
// in the business time zone, inclusive). The k-th of n included visits is due
// on the start date plus floor(k × months ÷ n) months (k from 0). An included
// visit is used when a visit on a job booked under the agreement is completed;
// a job under the agreement can be made only while one is left. While an
// agreement is active (today inside its term, not ended), every quote revision
// and service call for that customer without an explicit discount takes the
// member discount as a QUOTE-007 percent document discount, which no role
// limit refuses; jobs booked under the agreement are priced at $0.00.

export const viaKinds = ['phone', 'in person', 'quote'] as const
// PLAN-004: how the customer gave their decline of one included visit.
export const declineMethods = ['phone', 'email reply', 'text reply', 'in person'] as const

const dayBefore = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10)
const dateOk = (v: unknown, name: string) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? v : fail('INPUT', `Give ${name} as YYYY-MM-DD.`, { field: name }, 400)
const whole = (v: unknown, name: string, min: number, max: number) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? v as number : fail('INPUT', `${name} is a whole number from ${min} to ${max}.`, { field: name }, 400)
const percent = (v: unknown) => typeof v === 'string' && /^\d{1,2}(\.\d{1,2})?$/.test(v) && Number(v) < 100 ? String(Number(v)) : fail('INPUT', 'repairDiscountPercent is a percent from 0 to 99.99.', { field: 'repairDiscountPercent' }, 400)

/** The business's local date for an instant. */
export const localDate = (s: State, iso: string) => localParts(iso, business(s).timezone).date

export const active = (a: Row, date: string) => !a.endedAt && a.startDate <= date && date <= a.endDate

/** The customer's active agreement on a date (the earliest sold), if any. */
export const activeAgreement = (s: State, customerId: string, date: string) => s.agreements.find(a => a.customerId === customerId && active(a, date)) ?? null

/** Included visits: used, booked and not yet completed, left, and the next due date. */
export function entitlements(s: State, a: Row) {
  const rows = agreementVisits(s, a), n = rows.length
  const used = rows.filter(v => v.completed).length, declined = rows.filter(v => v.declined).length, booked = rows.filter(v => v.jobId && !v.completed && !v.declined).length
  return { included: n, used, booked, declined, left: n - used - declined, next: rows.find(v => !v.completed && !v.declined)?.due ?? null, due: rows.map(v => v.due) }
}

/** PLAN-002 → QUOTE-007: the member repair discount an active agreement gives a document drafted now. */
export function memberDiscount(s: State, customerId: string, now: string): DocumentDiscount | null {
  const a = activeAgreement(s, customerId, localDate(s, now))
  return a && Number(a.plan.repairDiscountPercent) > 0 ? { kind: 'percent', value: a.plan.repairDiscountPercent, reason: `${a.plan.name} member` } : null
}

/** A document discount is the member's when it is exactly the active agreement's. */
export const isMemberDiscount = (s: State, customerId: string, now: string, d: DocumentDiscount | null) => { const m = memberDiscount(s, customerId, now); return !!m && !!d && JSON.stringify(m) === JSON.stringify(d) }

/** A service call booked as one of the agreement's included visits. */
export function agreementVisit(s: State, agreementId: unknown, customerId: string, siteId: string, now: string, index?: unknown) {
  const a = find(s, 'agreements', agreementId)
  if (a.customerId !== customerId || a.siteId !== siteId) fail('AGREEMENT', 'That agreement covers another customer or site.')
  if (!active(a, localDate(s, now))) fail('AGREEMENT', `This agreement is ${a.endedAt ? 'ended' : 'outside its term'}.`)
  const e = entitlements(s, a)
  if (index !== undefined && (!Number.isInteger(index) || !agreementVisits(s, a).some(v => v.index === index && !v.jobId && !v.declined))) fail('ENTITLEMENT', 'Choose an included visit not already used, reserved or declined.')
  if (e.used + e.booked + e.declined >= e.included) fail('ENTITLEMENT', `Every included visit of ${a.plan.name} is used, booked or declined.`)
  return a
}

/** REPORT-002 agreements: sold in the period by plan, active on its last day, and churn: agreements ended, or whose term ended, in the period (renewals arrive with PLAN-003). */
export function agreementReport(s: State, from: string, to: string) {
  const inPeriod = (d: string | null) => !!d && d >= from && d <= to
  const sold = s.agreements.filter(a => inPeriod(a.soldOn))
  const churned = s.agreements.filter(a => a.endedAt ? inPeriod(a.endedOn) : inPeriod(a.endDate))
  const plans = [...new Set(sold.map(a => a.plan.name as string))].sort()
  return { sold: sold.length, active: s.agreements.filter(a => active(a, to)).length, churn: churned.length, soldValue: dollars(sold.reduce((n, a) => n + cents(a.plan.price, 'price'), 0)), byPlan: plans.map(plan => ({ plan, sold: sold.filter(a => a.plan.name === plan).length })) }
}

export const agreements: Handler = async (c, type, p) => {
  switch (type) {
    case 'plan.save': {
      const service = find(c.s, 'services', p.visitServiceId, 'services')
      const formIds: string[] = Array.isArray(p.formIds) ? [...new Set<string>(p.formIds.map((id: unknown) => find(c.s, 'forms', id).id))] : []
      const fields = { name: text(p.name, 'name', { max: 100 }), price: dollars(cents(p.price, 'price')), termMonths: whole(p.termMonths, 'termMonths', 1, 60), includedVisits: whole(p.includedVisits, 'includedVisits', 0, 24), visitServiceId: service.id, visitServiceName: service.name, repairDiscountPercent: percent(p.repairDiscountPercent ?? '0'), priorityBooking: p.priorityBooking === true, formIds, archived: p.archived === true }
      let row
      if (p.id === undefined) row = put(c.s, 'plans', { id: newId(), version: 1, createdAt: c.now, ...fields })
      else { const old = find(c.s, 'plans', p.id); expectVersion(old, p.version); row = bump(c.s, 'plans', old, { ...fields, updatedAt: c.now }) }
      event(c, { jobId: null, subjectKind: 'plan', subjectId: row.id, kind: 'plan.saved', summary: `${c.actor.name} saved the plan ${row.name}: $${row.price} for ${row.termMonths} months, ${row.includedVisits} × ${service.name}, ${row.repairDiscountPercent}% off repairs${row.priorityBooking ? ', priority booking' : ''}`, data: { termMonths: row.termMonths, includedVisits: row.includedVisits } })
      return row
    }
    case 'agreement.sell': {
      const plan = find(c.s, 'plans', p.planId)
      if (plan.archived) fail('PLAN', 'That plan is archived.')
      const customer = find(c.s, 'customers', p.customerId), site = find(c.s, 'sites', p.siteId, 'sites')
      if (customer.mergedInto) fail('MERGED', `${customer.name} was merged into another customer.`)
      if (site.customerId !== customer.id) fail('SITE', 'That site belongs to another customer.')
      const via = oneOf(p.via, viaKinds, 'via')
      const quote = via === 'quote' ? find(c.s, 'quotes', p.quoteId) : null
      if (quote && (quote.customerId !== customer.id || quote.status !== 'accepted')) fail('QUOTE', 'Sell on a quote this customer accepted.')
      const startDate = dateOk(p.startDate ?? localDate(c.s, c.now), 'startDate')
      const endDate = dayBefore(addMonths(startDate, plan.termMonths))
      if (c.s.agreements.some(a => a.siteId === site.id && !a.endedAt && a.startDate <= endDate && startDate <= a.endDate)) fail('AGREEMENT', 'This site already has an agreement in that term.')
      const { id: _i, version: _v, createdAt: _c, updatedAt: _u, archived: _a, ...snapshot } = plan
      const row = put(c.s, 'agreements', { id: newId(), version: 1, createdAt: c.now, customerId: customer.id, siteId: site.id, planId: plan.id, plan: snapshot, startDate, endDate, soldOn: localDate(c.s, c.now), via, quoteId: quote?.id ?? null, soldBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, soldByTechnicianId: p.soldByTechnicianId ? find(c.s, 'technicians', p.soldByTechnicianId).id : null, endedAt: null, endedOn: null, endReason: null })
      event(c, { jobId: null, subjectKind: 'agreement', subjectId: row.id, kind: 'agreement.sold', summary: `${c.actor.name} sold ${plan.name} to ${customer.name} (${via}${quote ? ` ${quote.number}` : ''}), ${startDate} to ${endDate}`, data: { planId: plan.id, via, startDate, endDate } })
      return row
    }
    case 'agreement.end': {
      const a = find(c.s, 'agreements', p.agreementId); expectVersion(a, p.version)
      if (a.endedAt) fail('AGREEMENT', 'This agreement has already ended.')
      const row = bump(c.s, 'agreements', a, { endedAt: c.now, endedOn: localDate(c.s, c.now), endReason: text(p.reason, 'reason', { max: 500 }), endedBy: { id: c.actor.id, name: c.actor.name } })
      event(c, { jobId: null, subjectKind: 'agreement', subjectId: a.id, kind: 'agreement.ended', summary: `${c.actor.name} ended ${a.plan.name} for ${find(c.s, 'customers', a.customerId).name}: ${row.endReason}`, data: null })
      return row
    }
    // PLAN-004: a person records the customer's explicit decline of one included
    // visit (who answered, how, why), as GLOVE-04 records a quote's answer. It
    // removes only that visit from the due list; a live booking is cancelled first.
    case 'agreement.decline': {
      const a = find(c.s, 'agreements', p.agreementId); expectVersion(a, p.version)
      const v = agreementVisits(c.s, a).find(x => x.index === p.index) ?? fail('ENTITLEMENT', `Choose an included visit from 0 to ${a.plan.includedVisits - 1}.`, { field: 'index' }, 400)
      if (v.completed) fail('ENTITLEMENT', 'That included visit is already completed.')
      if (v.declined) fail('ENTITLEMENT', 'The customer has already declined that included visit.')
      if (v.booked) fail('BOOKED', 'That included visit is booked; cancel the booking before recording a decline.')
      const decline = { index: v.index, due: v.due, method: oneOf(p.method, declineMethods, 'method'), customerName: text(p.customerName, 'customerName', { max: 200 }), reason: text(p.reason, 'reason', { max: 500 }), at: c.now, recordedBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role } }
      const row = bump(c.s, 'agreements', a, { declines: [...(a.declines ?? []), decline] })
      event(c, { jobId: v.jobId, subjectKind: 'agreement', subjectId: a.id, kind: 'agreement.visitDeclined', summary: `${c.actor.name} recorded that ${decline.customerName} declined ${a.plan.name} visit ${v.index + 1} (due ${v.due}) by ${decline.method}: ${decline.reason}`, data: { index: v.index, due: v.due, method: decline.method } })
      return row
    }
  }
}

/** The plan's inspection forms copied onto a job booked under the agreement, besides the service's own. */
export const planForms = (s: State, a: Row, already: { formId: string }[]) => (a.plan.formIds as string[]).filter(id => !already.some(f => f.formId === id)).map(id => s.forms.find(f => f.id === id)).filter((f): f is Row => !!f && !f.archived)
  .map(f => ({ id: newId(), formId: f.id, formVersion: f.version, name: f.name, questions: f.questions, equipmentId: null }))

