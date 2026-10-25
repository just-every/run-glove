import { authority } from './access'
import { stripeRequest } from './payments'
import { cents } from './money'
import { providerEvent } from './timeline'
import type { Context, Row } from './model'

const attempts = new WeakMap<Context, string>()
export const reserveSavedCardAttempt = (c: Context, paymentId: string) => { attempts.set(c, paymentId) }

/** The committed reservation is claimed once under live session, branch and record guards. */
export async function savedCardAfterCommit(db: D1Database, c: Context, result: unknown) {
  const id = attempts.get(c); attempts.delete(c)
  if (!id) return result
  const payment = c.s.payments.find(p => p.id === id)!, customer = c.s.customers.find(r => r.id === payment.customerId)!, invoice = c.s.invoices.find(r => r.id === payment.invoiceId)!, b = c.s.business[0]
  const a = authority(c.actor), snapshots: [string, Row][] = [['business', b], ['customers', customer], ['invoices', invoice], ['payments', payment]]
  const key = await db.prepare(`SELECT value FROM glove_provider_keys WHERE provider='stripe-payments' AND (${a.sql})`).bind(...a.params).first<{ value: string }>()
  if (!key) return result
  const claim = await db.prepare(`UPDATE glove_payment_attempts SET session_id='saved-card-attempted' WHERE payment_id=? AND session_id IS NULL AND (${a.sql}) AND EXISTS(SELECT 1 FROM glove_provider_keys WHERE provider='stripe-payments' AND value=?) AND ${snapshots.map(() => "EXISTS(SELECT 1 FROM glove_records WHERE kind=? AND id=? AND version=? AND data=?)").join(' AND ')}`).bind(id, ...a.params, key.value, ...snapshots.flatMap(([kind, row]) => [kind, row.id, row.version, JSON.stringify(row)])).run()
  if (!claim.meta.changes) return result
  const form = new URLSearchParams({ amount: String(cents(payment.amount, 'amount')), currency: 'usd', customer: payment.savedCard.stripeCustomerId, payment_method: payment.savedCard.stripeMethodId, 'payment_method_types[0]': 'card', confirm: 'true', off_session: 'true', 'metadata[glove_payment_id]': id, 'metadata[glove_connection_id]': payment.connectionId })
  let accepted = false, reference: string | null = null
  try {
    const intent = await stripeRequest(key.value, 'payment_intents', form, `glove-saved-card-${id}`)
    accepted = intent.livemode === false && /^pi_[A-Za-z0-9_-]+$/.test(intent.id ?? '') && intent.customer === payment.savedCard.stripeCustomerId && intent.payment_method === payment.savedCard.stripeMethodId && intent.amount === cents(payment.amount, 'amount') && intent.currency === 'usd' && intent.metadata?.glove_payment_id === id && intent.metadata?.glove_connection_id === payment.connectionId
    if (accepted) {
      reference = intent.id
      await db.prepare("UPDATE glove_payment_attempts SET session_id=? WHERE payment_id=? AND session_id='saved-card-attempted'").bind(intent.id, id).run()
    }
  } catch { /* A lost or rejected provider answer never permits a fresh charge. */ }
  await providerEvent(db, { id: `${id}:saved-card`, at: new Date().toISOString(), commandId: c.commandId, provider: 'Stripe', jobId: payment.jobId, subjectKind: 'payment', subjectId: id, kind: accepted ? 'payment.savedCardAccepted' : 'payment.savedCardUnconfirmed', summary: accepted ? 'Stripe accepted the test saved-card request; awaiting an authenticated confirmation event' : 'Saved-card outcome unknown; inspect Stripe before any further payment attempt', data: { paymentId: id, provider: 'Stripe', providerReference: reference, status: accepted ? 'awaiting_confirmation' : 'uncertain' } }).run()
  return result
}

/** Only enumerated provider reasons enter domain records; never retain raw error payloads. */
export function savedCardFailure(intent: any): string | null {
  const code = intent.last_payment_error?.decline_code ?? intent.last_payment_error?.code
  const reasons: Record<string, string> = { insufficient_funds: 'Insufficient funds', expired_card: 'Card expired', incorrect_cvc: 'Card security check failed', card_declined: 'Card declined', generic_decline: 'Card declined', do_not_honor: 'Card declined by issuer', authentication_required: 'Customer authentication required. Ask the owner to review the existing test Checkout controls.', lost_card: 'Card declined by issuer', stolen_card: 'Card declined by issuer', processing_error: 'Card processing failed' }
  return typeof code === 'string' ? reasons[code] ?? 'Stripe declined the payment; inspect Stripe for details.' : intent.status === 'requires_action' ? reasons.authentication_required : null
}
