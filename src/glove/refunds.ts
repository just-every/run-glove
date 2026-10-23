import { wisetackRefundAfterCommit } from './financing'
import { authority } from './access'
import { load, commit } from './storage'
import { bump, event, type Context, type Actor } from './model'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { cents } from './money'
import { stripeRequest } from './payments'
import { providerEvent } from './timeline'

/** Durable reservation precedes the one network attempt. Replay never resends an uncertain refund. */
export async function refundAfterCommit(db: D1Database, c: Context, result: any) {
  if (!c.refundId) return result
  const row = c.s.payments.find(r => r.id === c.refundId)!
  if (row.method === 'wisetack') return wisetackRefundAfterCommit(db, c, result)
  const a = authority(c.actor)
  const key = await db.prepare(`SELECT value FROM glove_provider_keys WHERE provider='stripe-payments' AND (${a.sql}) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND json_extract(data,'$.stripe.connectionId')=?)`).bind(...a.params, row.connectionId).first<{value: string}>()
  if (!key) return result
  try {
    const form = new URLSearchParams({ payment_intent: row.intentId, amount: String(cents(row.amount, 'amount')), 'metadata[glove_refund_id]': row.id })
    const response = await stripeRequest(key.value, c.refundRefresh ? `refunds/${encodeURIComponent(row.providerReference)}` : 'refunds', c.refundRefresh ? undefined : form, c.refundRefresh ? undefined : `glove-refund-${row.id}`)
    if (typeof response.id !== 'string' || response.payment_intent !== row.intentId || response.amount !== cents(row.amount, 'amount') || response.currency !== row.currency.toLowerCase() || response.metadata?.glove_refund_id !== row.id || !['succeeded', 'pending', 'failed', 'canceled', 'requires_action'].includes(response.status)) throw Error('Unconfirmed refund')
    for (let retry = 0; retry < 6; retry++) {
      const before = await load(db), current = before.payments.find(r => r.id === row.id)
      if (!current || current.erasedAt || current.connectionId !== before.business[0]?.stripe?.connectionId) return result
      if (current.status === 'paid') return current
      const status = response.status === 'succeeded' ? 'paid' : ['failed', 'canceled'].includes(response.status) ? 'failed' : 'pending'
      const actor: Actor = { id: 'provider:Stripe', name: 'Stripe', role: 'owner', sessionId: '', operatorVersion: 0, paymentProvider: row.connectionId }
      const next: Context = { s: structuredClone(before), actor, commandId: `refund-result:${c.commandId}`, now: new Date().toISOString(), events: [], sql: [], files: [] }
      const confirmed = bump(next.s, 'payments', current, { status, providerReference: response.id, confirmedAt: status === 'paid' ? next.now : null, effects: status === 'paid' ? [{ at: next.now, invoiceId: row.invoiceId, amountCents: -response.amount, tipCents: 0 }] : [] })
      event(next, { jobId: row.jobId, subjectKind: 'payment', subjectId: row.id, kind: `refund.${status}`, summary: `Stripe test mode refund ${status}: $${row.amount} through the original ${row.method}`, data: { refundId: row.id, paymentId: row.paymentId, provider: 'Stripe', providerReference: response.id, status, amount: row.amount } })
      next.events[0].actor.role = 'provider' as any
      try { await commit(db, next, before, 'refund.providerResult', sha256(canonicalJson({ id: c.commandId, status })), confirmed); return confirmed }
      catch (error) { if ((await load(db)).version !== before.version) continue; throw error }
    }
  } catch { /* Unknown stays reserved; it never becomes a fabricated success or automatic retry. */ }
  await providerEvent(db, { id: `${c.commandId}:refund-unknown`, at: c.now, commandId: c.commandId, provider: 'Stripe', jobId: row.jobId, subjectKind: 'payment', subjectId: row.id, kind: 'refund.unconfirmed', summary: 'Refund outcome unknown; inspect Stripe before any further refund request', data: { refundId: row.id, paymentId: row.paymentId } }).run()
  return result
}
