import { fieldInvoiceProjection } from './field-invoices'
import { allow, mayRead } from './access'
import { collections, fail, type Actor, type Row, type State } from './model'

// What each role may read. A technician sees only visits that were ever
// assigned to them, with those jobs' customers, sites, checklists and field
// evidence; prices, quotes, invoices and other people's work stay on the desk.
// Raw move-in files and export CSV bytes never travel in state.

const savedCardDisplay = ({ stripeCustomerId: _customer, stripeMethodId: _method, authorization, authorizedAt: _at, revokedBy: _by, reason: _reason, ...card }: Row): Row => ({
  ...card, ...(authorization ? { authorization: { scope: authorization.scope } } : {}),
})
const withoutFiles = (r: Row) => { const { files: _files, ...rest } = r; return rest }
const withoutCsv = (r: Row) => { const { csv: _csv, ...rest } = r; return rest }
/** A price-book item's or line's cost is a margin figure (MONEY-003), like an expense's markup. */
const uncosted = <T extends Row>({ unitCost: _c, ...rest }: T) => rest
/** Every unit cost inside a quote or job: lines, each revision's options and add-ons, and the accepted choice. */
const uncostedLines = (r: Row): Row => strip(r) as Row
const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'unitCost' && k !== 'costRate').map(([k, x]) => [k, strip(x)])) : v
/** A technician's loaded cost per hour is a margin figure too (COST-004). */
const unrated = ({ costRate: _r, fieldPricing: _f, fieldInvoicing: _i, fleet: _fleet, locationConsent: _consent, portrait: _portrait, ...rest }: Row) => rest
const unpriced = (job: Row) => { const { lines, totals: _totals, series, ...rest } = job; const { billing: _billing, ...schedule } = series ?? {}; return { ...rest, ...(series ? { series: schedule } : {}), lines: lines.map((l: Row) => ({ description: l.description, quantity: l.quantity })) } }

/**
 * DISP-007 (as ct approved 19 Oct 11:36Z): a Subcontractor sees only the
 * visits now assigned to them and, for those, the job title, checklist and
 * forms, the site's address and access notes, the customer's name and phone,
 * and their own captures; never money, other people's work or other visits.
 */
function subcontracted(s: State, actor: Actor) {
  const me = s.technicians.find(t => t.operatorId === actor.id)
  const visits = me ? s.visits.filter(v => v.technicianId === me.id && v.status !== 'cancelled').map(({ id, version, jobId, technicianId, startAt, endAt, local, status, arrival, completion, lateEvidence }) => ({ id, version, jobId, technicianId, startAt, endAt, local, status, arrival, completion, lateEvidence: lateEvidence.filter((x: Row) => x.technicianId === me.id), assignments: [] })) : []
  const jobIds = new Set(visits.map(v => v.jobId))
  const jobs = s.jobs.filter(j => jobIds.has(j.id)).map(({ id, version, number, title, customerId, siteId, checklist, forms, status }) => ({ id, version, number, title, customerId, siteId, checklist, forms, status, lines: [] }))
  const customerIds = new Set(jobs.map(j => j.customerId)), siteIds = new Set(jobs.map(j => j.siteId))
  const empty = Object.fromEntries(collections.map(k => [k, []])) as unknown as Record<(typeof collections)[number], Row[]>
  const b = s.business[0]
  return {
    ...empty, version: s.version, business: b ? [{ id: b.id, version: b.version, name: b.name, timezone: b.timezone }] : [], technicians: me ? [unrated(me)] : [],
    customers: s.customers.filter(c => customerIds.has(c.id)).map(({ id, version, name, phone }) => ({ id, version, name, phone })),
    sites: s.sites.filter(x => siteIds.has(x.id)).map(({ id, version, customerId, address, accessNotes }) => ({ id, version, customerId, address, accessNotes })),
    jobs, visits, captures: me ? s.captures.filter(x => x.technicianId === me.id && jobIds.has(x.jobId)) : [],
  }
}

/** Provider-wide account facts are for the unscoped owner on every read door,
 * including Activity/export; branch staff keep only their cash/check batches. */
export function financialReadState(s: State, actor: Actor): State {
  const wide = actor.role === 'owner' && !actor.branch
  if (!wide || actor.token || actor.custom) s = withoutXero(s)
  if (!(wide && !actor.token && !actor.custom)) s = { ...s,
    conversations: s.conversations.filter(call => call.provider !== 'twilio'),
    messages: s.messages.map(({ voiceCallId: _call, bookingOfferId: _offer, ...message }) => message as Row),
    business: s.business.map(({ voice: _voice, ...b }) => b as Row),
  }
  const withoutAutopay = () => s.jobs.map(job => {
    if (!job.series?.billing) return job
    const { autopay: _autopay, autopayHistory: _history, ...billing } = job.series.billing
    return { ...job, series: { ...job.series, billing } }
  })
  if (wide) return actor.token || actor.custom ? { ...s, jobs: withoutAutopay(), proposals: s.proposals.filter(p => !p.payoutId) } : s
  return { ...s,
    conversations: s.conversations.filter(call => call.provider !== 'twilio'),
    proposals: s.proposals.filter(p => !p.payoutId),
    jobs: withoutAutopay(),
    customers: s.customers.map(({ savedCards, ...customer }) => ({ ...customer, ...(['owner', 'office'].includes(actor.role) && !actor.token && !actor.custom ? { savedCards: (savedCards ?? []).map(savedCardDisplay) } : {}) })),
    messages: ['owner', 'office', 'dispatcher'].includes(actor.role) && !actor.token && !actor.custom ? s.messages : s.messages.map(({ body: _body, ...message }) => message as Row),
    business: s.business.map(({ voice: _voice, sms: _sms, wisetack: _w, payoutFeeSchedule: _f, qbo: _qbo, qboPrevious: _qboPrevious, xeroInspection: _xero, ...b }) => b as Row),
    payouts: s.payouts.filter(p => p.kind === 'depositBatch'),
    financings: actor.role === 'owner' ? s.financings : [],
    payments: s.payments.map(({ payoutAllocationId: _p, savedCard, autopay: _autopay, ...payment }) => ({ ...payment, ...(savedCard && ['owner', 'office'].includes(actor.role) && !actor.token && !actor.custom ? { savedCard: savedCardDisplay(savedCard) } : {}) }) as Row),
  }
}

export function visible(s: State, actor: Actor) {
  s = { ...s, technicians: s.technicians.map(({ portrait, ...tech }) => ({ ...tech, ...(tech.operatorId === actor.id && actor.role === 'technician' && !actor.token && !actor.custom && portrait ? { portrait } : {}) })) }
  const businessView = actor.role === 'owner' && !actor.branch ? s.business : s.business.map(({ voice: _voice, sms: _sms, wisetack: _w, payoutFeeSchedule: _f, qbo: _qbo, qboPrevious: _qboPrevious, xeroInspection: _xero, ...b }) => b as Row)
  if (actor.role === 'subcontractor') return subcontracted(s, actor)
  if (actor.role !== 'technician') {
    // Expense costs and markups are margins, like purchase orders' unit costs: a custom role sees them only with reports.read.
    const margins = mayRead(actor, 'reports')
    // COST-005: margin warnings go to the owner and the dispatchers.
    const warnings = s.warnings.filter(w => w.to.includes(actor.role))
    // API-005: a rule's notice goes to the role or the person it names.
    const notices = s.notices.filter(n => n.to.includes(actor.role) || n.to.includes(`person:${actor.id}`))
    return { ...s, proposals: actor.role === 'owner' && !actor.branch ? s.proposals : s.proposals.filter(p => !p.payoutId), business: businessView, payouts: actor.role === 'owner' && !actor.branch ? s.payouts : s.payouts.filter(p => p.kind === 'depositBatch'), financings: actor.role === 'owner' ? s.financings : [], privacyRequests: actor.role === 'owner' ? s.privacyRequests : [], warnings, notices, imports: s.imports.map(withoutFiles), exports: s.exports.map(withoutCsv), expenses: margins ? s.expenses : [], purchaseOrders: margins ? s.purchaseOrders : [], messages: margins ? s.messages : s.messages.filter(m => m.kind !== 'purchaseOrder'), ...(margins ? {} : { services: s.services.map(uncosted), quotes: s.quotes.map(uncostedLines), jobs: s.jobs.map(uncostedLines), technicians: s.technicians.map(unrated) }) }
  }
  const me = s.technicians.find(t => t.operatorId === actor.id)
  const visits = me ? s.visits.filter(v => v.assignments.some((a: Row) => a.technicianId === me.id)) : []
  const jobIds = new Set(visits.map(v => v.jobId))
  const jobs = s.jobs.filter(j => jobIds.has(j.id))
  const customerIds = new Set(jobs.map(j => j.customerId)), siteIds = new Set(jobs.map(j => j.siteId))
  // A linked technician can clock a shift before their first visit is assigned.
  const technicianIds = new Set([...(me ? [me.id] : []), ...visits.flatMap(v => v.assignments.map((a: Row) => a.technicianId))])
  return {
    version: s.version, business: businessView, branches: s.branches, services: s.services.filter(x => !x.archived).map(({ unitPrice: _p, unitCost: _c, ...rest }) => rest),
    technicians: s.technicians.filter(t => technicianIds.has(t.id)).map(t => ({ ...unrated(t), ...(t.operatorId === actor.id && t.portrait ? { portrait: t.portrait } : {}), ...(t.operatorId === actor.id && t.fieldInvoicing ? { fieldInvoicing: t.fieldInvoicing } : {}) })), customers: s.customers.filter(c => customerIds.has(c.id)).map(({ id, version, name, phone, contact }) => ({ id, version, name, phone, contact })),
    sites: s.sites.filter(x => siteIds.has(x.id)), jobs: jobs.map(unpriced), visits,
    captures: s.captures.filter(x => jobIds.has(x.jobId)), equipment: s.equipment.filter(x => siteIds.has(x.siteId)),
    expenses: s.expenses.filter(x => jobIds.has(x.jobId) && x.recordedBy.id === actor.id),
    times: me ? s.times.filter(x => x.technicianId === me.id) : [], timesheets: me ? s.timesheets.filter(x => x.technicianId === me.id) : [], forms: [],
    warnings: [], templates: [], stock: me ? s.stock.filter(l => l.technicianId === me.id) : [], stockMoves: me ? s.stockMoves.filter(m => s.stock.some(l => l.id === m.locationId && l.technicianId === me.id)) : [],
    payments: [], payouts: [], financings: [], routes: [], privacyRequests: [], serviceReports: [], serviceReportLinks: [], bookingOffers: [], quoteLinks: [], messages: [], enquiries: [], quotes: [], invoices: fieldInvoiceProjection(s, actor, jobs), purchaseOrders: [], rules: [], ruleRuns: [], notices: [], segments: [], pushes: [], conversations: [], plans: [], agreements: [], agreementChecks: [], customFields: s.customFields.filter(x => x.record !== 'customers'),
    // FIELD-006 and AGENT-006: the manual library, their own nameplate readings, and callback checklists on their jobs.
    manuals: s.manuals, nameplates: s.nameplates.filter(x => x.by.id === actor.id), diagnoses: s.diagnoses.filter(x => jobIds.has(x.jobId)), crews: [], exports: [], proposals: [], approvals: [], imports: [], roles: [], grants: [], merges: [],
  }
}

export const visibleJobIds = (view: { jobs: Row[] }) => new Set(view.jobs.map(j => j.id))

/** Write permissions do not grant margin-record reads (STOCK-002 / TEAM-001).
 * Keep the durable outcome intact; project both first responses and replays
 * using the person's current report permission.
 */
export function visibleOutcome<T extends { result: unknown }>(outcome: T, type: string, actor: Actor): T {
  if (type === 'customer.hubPreview') allow(actor, type)
  if (actor.role !== 'owner' || actor.branch || actor.token || actor.custom) outcome = withoutPaymentEvidence(withoutXero(outcome))
  if ((type.startsWith('voice.') || type.startsWith('xero.') || (outcome.result as Row | null)?.payoutId && ['reconciliation.prepare', 'reconciliation.decide'].includes(type)) && (actor.role !== 'owner' || actor.branch || actor.token || actor.custom)) fail('FORBIDDEN', 'Current Owner access without branch limits is required for this inspection outcome.', null, 403)
  if (mayRead(actor, 'reports')) return outcome
  const hiddenRecord = ['po.save', 'po.send', 'po.receive'].includes(type) || (actor.role !== 'technician' && ['expense.record', 'expense.price'].includes(type))
  return hiddenRecord
    ? { ...outcome, result: visibleCostRecord(outcome.result as Row, actor) }
    : visibleCosts(outcome, actor)
}

/** Stale-version errors are read responses too. */
export const visibleCostRecord = (row: Row, actor: Actor): Row => visibleCosts(mayRead(actor, 'reports') ? row : { id: row.id, version: row.version }, actor)

/** Existing margin visibility also applies to nested command and error records. */
const withoutPaymentEvidence = <T,>(value: T): T => {
  if (Array.isArray(value)) return value.map(withoutPaymentEvidence) as T
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['autopay', 'autopayHistory'].includes(key))
    .map(([key, entry]) => [key, key === 'savedCards' ? (entry as Row[]).map(savedCardDisplay) : key === 'savedCard' && entry ? savedCardDisplay(entry as Row) : withoutPaymentEvidence(entry)])) as T
}
const withoutXero = <T,>(value: T): T => (Array.isArray(value) ? value.map(withoutXero) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([key]) => !['xero', 'xeroLink', 'xeroSync', 'xeroInspection'].includes(key)).map(([key, entry]) => [key, key === 'xeroImported' ? { source: 'Xero' } : withoutXero(entry)])) : value) as T
export const visibleCosts = <T,>(value: T, actor: Actor): T => {
  if (actor.role !== 'owner' || actor.branch || actor.token || actor.custom) value = withoutPaymentEvidence(withoutXero(value))
  return mayRead(actor, 'reports') ? value : strip(value) as T
}
