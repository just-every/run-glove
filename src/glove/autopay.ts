import { allow } from './access'
import { bump, event, expectVersion, fail, find, newId, text, type Context, type Row } from './model'
import { cents, dollars } from './money'
import type { Handler } from './commands/types'

// Older installations have one permission; retain it when first writing history.
const history = (billing: Row): Row[] => billing.autopayHistory ?? (billing.autopay ? [billing.autopay] : [])

const owner = (c: Context) => {
  if (!c.actor.sessionId || c.actor.role !== 'owner' || c.actor.branch || c.actor.token || c.actor.custom) fail('FORBIDDEN', 'Owner access required', null, 403)
}
const evidence = (value: unknown, name: string) => {
  const result = text(value, name, { max: 2000 })
  if (/(?:\d[ -]?){13,19}/.test(result)) fail('INPUT', 'Record authorization evidence, never card details.', null, 400)
  return result
}

/** Consent is for one fixed billing rule, not all of a customer's future work. */
export const autopayCommands: Handler = async (c, type, p) => {
  if (!['payment.autopayAuthorize', 'payment.autopayRevoke'].includes(type)) return undefined
  allow(c.actor, type); owner(c)
  const revoke = type === 'payment.autopayRevoke'
  const allowed = revoke ? ['jobId', 'version', 'reason'] : ['jobId', 'version', 'cardId', 'maxAmount', 'source', 'wording', 'confirmed']
  if (Object.keys(p).some(k => !allowed.includes(k))) fail('INPUT', 'Use only recurring authorization fields.', null, 400)
  const job = find(c.s, 'jobs', p.jobId); expectVersion(job, p.version)
  if (!job.series?.billing) fail('AUTOPAY', 'Configure this recurring job billing first.')
  const old = job.series.billing.autopay
  if (revoke) {
    if (!old || old.revokedAt) fail('AUTOPAY', 'No active recurring authorization exists.')
    const authorization = { ...old, revokedAt: c.now, revokedBy: c.actor.id, reason: evidence(p.reason, 'withdrawal reason') }
    const result = bump(c.s, 'jobs', job, { series: { ...job.series, billing: { ...job.series.billing, autopay: authorization, autopayHistory: history(job.series.billing).map(a => a.id === old.id ? authorization : a) } } })
    event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'autopay.revoked', summary: 'Owner recorded withdrawal of recurring-card permission; no charge or send', data: { authorizationId: old.id } })
    return result
  }
  if (old && !old.revokedAt) fail('AUTOPAY', 'Withdraw the existing authorization before replacing it.')
  const rule = job.series.billing.revisions.at(-1)
  if (rule.mode !== 'fixed-monthly' || rule.paused) fail('AUTOPAY', 'This preparatory door supports an unpaused fixed-monthly billing rule only.')
  if (c.s.business[0]?.currency !== 'USD' || c.s.business[0]?.stripe?.mode !== 'test') fail('PAYMENT_SETUP', 'Use a USD business connected to Stripe test mode.')
  const customer = find(c.s, 'customers', job.customerId)
  const card = (customer.savedCards ?? []).find((m: Row) => m.id === p.cardId)
  if (customer.mergedInto || !card || card.revokedAt || card.authorization?.scope !== 'autopay' || card.connectionId !== c.s.business[0]?.stripe?.connectionId) fail('CARD_AUTHORIZATION', 'Choose this customer’s active, verified test card with autopay permission.')
  if (p.confirmed !== true) fail('CONSENT', 'Explicitly affirm the customer’s permission for this rule and maximum amount.')
  const maximum = cents(p.maxAmount, 'maxAmount')
  if (maximum <= 0) fail('AMOUNT', 'The recurring maximum must be positive.')
  const authorization = { id: newId(), ruleId: job.id, cadence: 'monthly', connectionId: card.connectionId, cardId: card.id, customerId: customer.id, ruleRevision: rule.n, maxAmount: dollars(maximum), currency: 'USD', source: evidence(p.source, 'authorization source'), wording: evidence(p.wording, 'authorization wording'), at: c.now, by: { id: c.actor.id, name: c.actor.name }, execution: 'explicit-owner-only' }
  const result = bump(c.s, 'jobs', job, { series: { ...job.series, billing: { ...job.series.billing, autopay: authorization, autopayHistory: [...history(job.series.billing), authorization] } } })
  event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'autopay.authorized', summary: 'Owner recorded customer permission for one monthly billing rule; automatic execution remains disabled', data: { authorizationId: authorization.id, cardId: card.id, ruleRevision: rule.n, maxAmount: authorization.maxAmount, currency: 'USD' } })
  return result
}

export function authorizedAutopay(c: Context, invoice: Row, card: Row) {
  owner(c)
  const job = find(c.s, 'jobs', invoice.jobId), rule = job.series?.billing?.revisions.at(-1), grant = job.series?.billing?.autopay
  if (rule?.paused) fail('CARD_AUTHORIZATION', 'Billing is paused; no charge was requested')
  if (!grant || grant.revokedAt || grant.customerId !== invoice.customerId || grant.cardId !== card.id || card.authorization?.scope !== 'autopay' || grant.connectionId !== card.connectionId || grant.ruleId !== job.id || grant.cadence !== 'monthly' || !rule || rule.mode !== 'fixed-monthly' || rule.n !== grant.ruleRevision || invoice.recurring?.ruleRevision !== grant.ruleRevision || invoice.recurring?.mode !== 'fixed-monthly') fail('CARD_AUTHORIZATION', 'Fresh customer permission is required for this card and billing rule')
  if (cents(invoice.revisions.findLast((r: Row) => r.approval)?.totals.total, 'total') > cents(grant.maxAmount, 'maxAmount')) fail('CARD_AUTHORIZATION', 'The invoice exceeds the authorized USD maximum')
  return { authorizationId: grant.id, ruleRevision: grant.ruleRevision, authorizedAt: grant.at, maxAmount: grant.maxAmount, execution: grant.execution }
}
