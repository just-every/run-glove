import { authority, allow } from './access'
import { load, commit } from './storage'
import { business, bump, event, expectVersion, fail, find, newId, put, text, type Context, type Row } from './model'
import { cents, dollars } from './money'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { providerId } from './payouts'
import { calendarDate } from './receivables'
import type { Handler } from './commands/types'

const endpoint = 'https://api.wisetack-sec.us/api'
export async function wisetackRequest(key: string, path: string, body?: object) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000)
  try {
    const r = await fetch(`${endpoint}/${path}`, { method: body ? 'POST' : 'GET', redirect: 'manual', signal: controller.signal, headers: { authorization: `Basic ${key}`, ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
    if (!r.ok) fail('FINANCING_PROVIDER', 'Wisetack test response was not confirmed; inspect the provider before another application.')
    return await r.json() as any
  } finally { clearTimeout(timer) }
}
const credential = async (db: D1Database) => (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='wisetack'").first<{value:string}>())?.value
const transactionPath = (b: Row, id?: string) => `merchants/${providerId(b.wisetack.merchantId)}/transactions${id ? '/' + providerId(id) : ''}`
const statuses = ['Incomplete Information', 'Refunded', 'Paid', 'Confirmed', 'Actions Required', 'Expired', 'Pending', 'Offer Locked', 'Approved', 'Declined', 'Rejected', 'Canceled']

/** Minimal, explicitly consented customer initiation; no credit/personal fields are accepted or forwarded. */
export async function applyFinancing(c: Context, link: Row, choice: { document: any; hash: string }, p: any, db: D1Database) {
  const b = business(c.s), q = find(c.s, 'quotes', link.quoteId)
  if (c.actor.role !== 'owner' || c.actor.branch || !b.wisetack || !(await credential(db))) fail('FINANCING_SETUP', 'Financing needs a current unscoped owner-issued quote link and configured Wisetack test account.')
  const old = c.s.financings.find(f => f.quoteId === q.id && f.quoteRevision === link.revision)
  if (old) { if (old.chosenDocumentHash !== choice.hash) fail('FINANCING_CHOICE', 'An application already exists for another choice; contact the business.'); return old }
  if (p.financingConsent !== true) fail('CONSENT', 'Explicitly agree to send only the chosen amount, completion date and opaque purchase reference to Wisetack test mode.', null, 400)
  const amount = choice.document.totals.total
  if (choice.document.totals.currency !== 'USD' || cents(amount, 'chosen total') <= cents(b.wisetack.minimumAmount, 'minimum')) fail('FINANCING_AMOUNT', 'The chosen USD total must exceed the owner-set financing minimum.')
  const row = put(c.s, 'financings', { id: newId(), version: 1, createdAt: c.now, quoteId: q.id, quoteRevision: link.revision, customerId: q.customerId, siteId: q.siteId, branchId: q.branchId ?? null, chosenDocumentHash: choice.hash, amount, currency: 'USD', connectionId: b.wisetack.connectionId, serviceCompletedOn: calendarDate(text(p.serviceCompletedOn, 'completion date', { max: 10 })), status: 'reserved', consent: { affirmed: true, at: c.now, linkId: link.id, scope: 'Chosen amount, completion date and opaque purchase reference only; personal and credit information is entered on Wisetack.' } })
  c.financeId = row.id
  event(c, { jobId: null, subjectKind: 'quote', subjectId: q.id, kind: 'financing.applicationRequested', summary: 'Customer explicitly requested Wisetack test financing; no underwriting or approval by Glove', data: { financingId: row.id, quoteId: q.id, amount, consentScope: row.consent.scope } })
  return row
}
export async function financingAfterCommit(db: D1Database, c: Context, result: any) {
  const f = c.s.financings.find(f => f.id === c.financeId)!, a = authority(c.actor), b = business(c.s)
  const key = await db.prepare(`SELECT value FROM glove_provider_keys WHERE provider='wisetack' AND (${a.sql}) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND json_extract(data,'$.wisetack.connectionId')=?)`).bind(...a.params, f.connectionId).first<{value:string}>()
  if (!key) return result
  let outcome: any, link: string | null = null
  try {
    const r = await wisetackRequest(key.value, transactionPath(b), { transactionAmount: f.amount, serviceCompletedOn: f.serviceCompletedOn, transactionPurpose: 'Service work quoted by Glove', purchaseId: f.id })
    const u = new URL(r.paymentLink)
    if (typeof r.transactionId !== 'string' || u.origin !== 'https://wisetack-sec.us' || !u.hash || u.username || u.password || cents(String(r.transactionAmount), 'provider amount') !== cents(f.amount, 'amount') || r.purchaseId !== f.id) throw Error('Unconfirmed financing')
    outcome = { providerReference: providerId(r.transactionId), status: 'application-ready' }; link = r.paymentLink
  } catch { outcome = { status: 'unknown' } }
  for (let retry = 0; retry < 6; retry++) {
    const before = await load(db), current = before.financings.find(r => r.id === f.id)
    if (!current || current.providerReference || current.connectionId !== before.business[0]?.wisetack?.connectionId) return result
    const next: Context = { s: structuredClone(before), actor: c.actor, commandId: `financing-result:${f.id}`, now: new Date().toISOString(), events: [], files: [], sql: [] }
    bump(next.s, 'financings', current, outcome)
    event(next, { jobId: null, subjectKind: 'quote', subjectId: f.quoteId, kind: outcome.status === 'unknown' ? 'financing.applicationUnknown' : 'financing.applicationReady', summary: outcome.status === 'unknown' ? 'Wisetack application outcome unknown; inspect provider before another request' : 'Wisetack test application link prepared; no approval or funding is claimed', data: { financingId: f.id, provider: 'Wisetack', providerReference: outcome.providerReference ?? null, status: outcome.status } }); next.events[0].actor = { id: 'provider:Wisetack', name: 'Wisetack', role: 'provider' as any }
    try { await commit(db, next, before, 'financing.providerApplication', sha256(f.id), { financingId: f.id, status: outcome.status }); return { ...result, ...(link ? { financingUrl: link } : {}), financing: { id: f.id, status: outcome.status, amount: f.amount } } }
    catch (error) { if ((await load(db)).version !== before.version) continue; throw error }
  }
  return result
}
export const financing: Handler = async (c, type, p, db) => {
  if (!['financing.connect', 'financing.refresh'].includes(type)) return undefined
  allow(c.actor, type)
  if (c.actor.token || c.actor.branch || c.actor.role !== 'owner') fail('FORBIDDEN', 'Only the signed-in unscoped owner configures or refreshes financing.', null, 403)
  const b = business(c.s)
  if (type === 'financing.connect') {
    expectVersion(b, p.version)
    let settings = null
    if (p.authToken === null) c.sql.push({ sql: "DELETE FROM glove_provider_keys WHERE provider='wisetack'", params: [] })
    else {
      if (p.mode !== 'test') fail('FINANCING_MODE', 'Only the Wisetack test endpoint is enabled.')
      const key = text(p.authToken, 'Wisetack test auth token', { max: 4000 })
      if (/[^\x21-\x7e]/.test(key)) fail('INPUT', 'Auth token contains no spaces or control characters.', null, 400)
      c.sql.push({ sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('wisetack',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [key, c.actor.id, c.now] })
      settings = { mode: 'test', merchantId: providerId(p.merchantId), minimumAmount: dollars(cents(p.minimumAmount, 'minimum')), connectionId: newId() }
    }
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'financing.connectionChanged', summary: 'Owner changed Wisetack test configuration; no application was sent', data: { connected: !!settings, mode: 'test' } })
    return bump(c.s, 'business', b, { wisetack: settings })
  }
  const f = find(c.s, 'financings', p.financingId); expectVersion(f, p.version)
  const key = await credential(db)
  if (!key || !b.wisetack || f.connectionId !== b.wisetack.connectionId || !f.providerReference) fail('FINANCING_SETUP', 'Reconnect the original test account; unknown applications must be inspected with Wisetack.')
  event(c, { jobId: null, subjectKind: 'quote', subjectId: f.quoteId, kind: 'financing.statusRequested', summary: 'Owner requested the current Wisetack test transaction status; no loan approval or funding is inferred', data: { financingId: f.id, provider: 'Wisetack' } })
  const r = await wisetackRequest(key!, transactionPath(b, f.providerReference))
  if (r.applicationId !== f.providerReference || r.purchaseId !== f.id || cents(r.requestedLoanAmount, 'provider requested amount') !== cents(f.amount, 'amount') || !statuses.includes(r.status)) fail('FINANCING_PROVIDER', 'Wisetack returned a mismatched transaction.')
  const offer = r.offers ? { aprRange: text(r.offers.minMaxApr, 'provider APR range', { optional: true, max: 80 }), monthRange: text(r.offers.minMaxMonths, 'provider month range', { optional: true, max: 80 }) } : null
  const row = bump(c.s, 'financings', f, { status: r.status, offer, inspectedAt: c.now, approvedAmount: r.approvedLoanAmount ? dollars(cents(r.approvedLoanAmount, 'approved amount')) : null })
  if (r.status === 'Paid' && !c.s.payments.some(p => p.financingId === f.id)) {
    const q = find(c.s, 'quotes', f.quoteId), amount = cents(r.settledLoanAmount, 'settled amount'), fee = cents(r.processingFeeAmount, 'provider processing fee')
    if (amount !== cents(f.amount, 'amount') || fee > amount || q.status !== 'accepted' || !q.jobId || q.acceptance?.revision !== f.quoteRevision || q.acceptance.signing?.chosenDocumentHash !== f.chosenDocumentHash) fail('FINANCING_ALLOCATION', 'Funding cannot be applied until the exact chosen quote is signed and its job exists, with the full matching funded amount.')
    const inv = c.s.invoices.find(i => i.jobId === q.jobId)
    put(c.s, 'payments', { id: newId(), version: 1, createdAt: c.now, kind: 'financing', financingId: f.id, financeConnectionId: f.connectionId, quoteId: q.id, jobId: q.jobId, customerId: q.customerId, branchId: q.branchId ?? null, invoiceId: inv?.id ?? null, invoiceNumber: inv?.number ?? `Financing ${q.number}`, currency: 'USD', amount: f.amount, tip: '0.00', technicianIds: [], fee: dollars(fee), method: 'wisetack', mode: 'test', providerReference: f.providerReference, status: 'paid', confirmedAt: c.now, effects: [{ at: c.now, amountCents: amount, tipCents: 0 }], taxTotalAmount: q.acceptance.totals.total, taxBreakdown: q.acceptance.totals.taxBreakdown ?? [] })
  }
  event(c, { jobId: c.s.quotes.find(q => q.id === f.quoteId)?.jobId ?? null, subjectKind: 'quote', subjectId: f.quoteId, kind: 'financing.providerStatus', summary: `Wisetack test mode reports ${r.status}; Glove never underwrites or lends`, data: { financingId: f.id, provider: 'Wisetack', providerReference: f.providerReference, status: r.status, amount: f.amount, offer } }); c.events[c.events.length - 1].actor = { id: 'provider:Wisetack', name: 'Wisetack', role: 'provider' as any }
  return row
}

/** One original-method refund request after reservation, with only the provider's refund receipt retained. */
export async function wisetackRefundAfterCommit(db: D1Database, c: Context, result: any) {
  const row = c.s.payments.find(r => r.id === c.refundId)!, b = business(c.s), a = authority(c.actor)
  const key = await db.prepare(`SELECT value FROM glove_provider_keys WHERE provider='wisetack' AND (${a.sql}) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND json_extract(data,'$.wisetack.connectionId')=?)`).bind(...a.params, row.financeConnectionId).first<{value:string}>()
  if (!key) return result
  let receipt: any
  try {
    const response = await wisetackRequest(key.value, transactionPath(b, row.financeTransactionId) + '/refund', { refundAmount: row.amount })
    if (response.transactionId !== row.financeTransactionId || response.merchantId !== b.wisetack.merchantId || typeof response.refund?.id !== 'string' || cents(response.refund.amount, 'provider refund') !== cents(row.amount, 'refund')) throw Error('Unconfirmed refund')
    receipt = { status: 'paid', providerReference: providerId(response.refund.id) }
  } catch { receipt = { status: 'unknown' } }
  for (let retry = 0; retry < 6; retry++) {
    const before = await load(db), current = before.payments.find(r => r.id === row.id)
    if (!current || current.erasedAt || current.status === 'paid' || current.financeConnectionId !== before.business[0]?.wisetack?.connectionId) return result
    const next: Context = { s: structuredClone(before), actor: c.actor, commandId: `wisetack-refund:${row.id}`, now: new Date().toISOString(), events: [], files: [], sql: [] }
    const updated = bump(next.s, 'payments', current, { ...receipt, effects: receipt.status === 'paid' ? [{ at: next.now, amountCents: -cents(row.amount, 'amount'), tipCents: 0 }] : [] })
    event(next, { jobId: row.jobId, subjectKind: 'payment', subjectId: row.id, kind: receipt.status === 'paid' ? 'refund.paid' : 'refund.unconfirmed', summary: receipt.status === 'paid' ? 'Wisetack test mode recorded the original-method refund; no bank settlement claim' : 'Wisetack refund outcome unknown; inspect provider before another request', data: { refundId: row.id, paymentId: row.paymentId, provider: 'Wisetack', providerReference: receipt.providerReference ?? null, status: receipt.status, amount: row.amount } }); next.events[0].actor = { id: 'provider:Wisetack', name: 'Wisetack', role: 'provider' as any }
    try { await commit(db, next, before, 'financing.refundOutcome', sha256(row.id), updated); return updated } catch (error) { if ((await load(db)).version !== before.version) continue; throw error }
  }
  return result
}
