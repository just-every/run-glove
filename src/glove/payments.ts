// PAY-002: Stripe-hosted entry. No card, bank-account or wallet credentials enter Glove.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { authority } from './access'
import { load, commit, saved } from './storage'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { bump, event, fail, find, type Context, type Row, type State, type Actor } from './model'
import { cents, dollars } from './money'
import { localParts } from './time'
import { branchZone } from './branches'
import { providerEvent } from './timeline'

export const stripeKey = async (db: D1Database) => (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='stripe-payments'").first<{ value: string }>())?.value

/** A bounded request to Stripe's fixed API. Never retain or return provider error payloads. */
export async function stripeRequest(key: string, path: string, form?: URLSearchParams, identity?: string) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000)
  try {
    const r = await fetch(`https://api.stripe.com/v1/${path}`, { method: form ? 'POST' : 'GET', redirect: 'manual', signal: controller.signal, headers: { authorization: `Bearer ${key}`, ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}), ...(identity ? { 'idempotency-key': identity } : {}) }, ...(form ? { body: form.toString() } : {}) })
    if (!r.ok) throw new Error('Stripe request not confirmed')
    return await r.json() as any
  } finally { clearTimeout(timer) }
}

/** Confirmed net invoice contribution. Pending/failed/returned payments never reduce a balance. */
export const paidCents = (p: Row) => (p.effects ?? []).reduce((n: number, e: Row) => n + e.amountCents, 0)
export const invoicePaid = (s: State, id: string, through?: string) => s.payments.reduce((n, p) => n + (p.effects ?? []).filter((e: Row) => (e.invoiceId ?? p.invoiceId) === id && (!through || localParts(e.at, branchZone(s, p)).date <= through)).reduce((n: number, e: Row) => n + e.amountCents, 0), 0)

/** A reservation is durable before the single provider attempt. A crash is uncertain, never a fresh charge. */
export async function checkoutAfterCommit(db: D1Database, c: Context, result: any) {
  if (!c.checkoutId) return result
  const p = c.s.payments.find(p => p.id === c.checkoutId)!, a = authority(c.actor)
  const key = await db.prepare(`SELECT value FROM glove_provider_keys WHERE provider='stripe-payments' AND (${a.sql}) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND json_extract(data,'$.stripe.connectionId')=?)`).bind(...a.params, p.connectionId).first<{ value: string }>()
  if (!key) return result
  const form = new URLSearchParams({ mode: 'payment', 'payment_method_types[0]': p.method === 'ach' ? 'us_bank_account' : 'card', 'line_items[0][price_data][currency]': p.currency.toLowerCase(), 'line_items[0][price_data][product_data][name]': `Invoice ${p.invoiceNumber}`, 'line_items[0][price_data][unit_amount]': String(cents(p.amount, 'amount')), 'line_items[0][quantity]': '1', client_reference_id: p.id, 'metadata[glove_payment_id]': p.id, 'payment_intent_data[metadata][glove_payment_id]': p.id, 'payment_intent_data[metadata][glove_connection_id]': p.connectionId, success_url: `${c.origin}/payment-return?result=submitted`, cancel_url: `${c.origin}/payment-return?result=cancelled` })
  if (cents(p.tip, 'tip') > 0) {
    form.set('line_items[1][price_data][currency]', p.currency.toLowerCase()); form.set('line_items[1][price_data][product_data][name]', 'Tip (no sales tax)'); form.set('line_items[1][price_data][unit_amount]', String(cents(p.tip, 'tip'))); form.set('line_items[1][quantity]', '1')
  }
  if (p.method === 'ach') form.set('payment_method_options[us_bank_account][verification_method]', 'automatic')
  try {
    const session = await stripeRequest(key.value, 'checkout/sessions', form, `glove-checkout-${p.id}`)
    if (session.livemode !== false || typeof session.id !== 'string' || typeof session.url !== 'string' || !/^https:\/\/checkout\.stripe\.com\//.test(session.url)) throw new Error('Invalid session')
    // The hosted URL is bearer material: first response only, never state, saved outcome or archive.
    await db.prepare('UPDATE glove_payment_attempts SET session_id=? WHERE payment_id=?').bind(session.id, p.id).run()
    await providerEvent(db, { id: `${p.id}:checkout`, at: c.now, commandId: c.commandId, provider: 'Stripe', jobId: p.jobId, subjectKind: 'payment', subjectId: p.id, kind: 'payment.checkoutAccepted', summary: 'Stripe test mode created hosted Checkout; no payment is confirmed', data: { paymentId: p.id, provider: 'Stripe', referenceHash: sha256(session.id) } }).run()
    return { ...result, checkoutUrl: session.url }
  } catch {
    await providerEvent(db, { id: `${p.id}:checkout`, at: c.now, commandId: c.commandId, provider: 'Stripe', jobId: p.jobId, subjectKind: 'payment', subjectId: p.id, kind: 'payment.checkoutUnconfirmed', summary: 'Checkout outcome unknown; inspect Stripe before creating another request', data: { paymentId: p.id } }).run()
    return result
  }
}

/** Authenticate the exact raw body before JSON parsing or business lookups. */
export async function paymentWebhook(request: Request, db: D1Database): Promise<Response | null> {
  if (new URL(request.url).pathname !== '/api/glove/payments/events') return null
  const json = (b: unknown, status = 200) => Response.json(b, { status, headers: { 'cache-control': 'no-store' } })
  if (request.method !== 'POST') return json({ ok: false }, 405)
  const secret = (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='stripe-webhook'").first<{ value: string }>())?.value
  if (!secret) return json({ ok: false }, 404)
  const raw = await request.text(), header = request.headers.get('stripe-signature') ?? '', t = /(?:^|,)t=(\d+)(?:,|$)/.exec(header)?.[1]
  const signatures = [...header.matchAll(/(?:^|,)v1=([a-f0-9]{64})(?=,|$)/g)].map(m => Buffer.from(m[1], 'hex'))
  const expected = createHmac('sha256', secret).update(`${t}.${raw}`).digest()
  if (raw.length > 256_000 || !t || Math.abs(Date.now() / 1000 - Number(t)) > 300 || !signatures.some(s => timingSafeEqual(s, expected))) return json({ ok: false }, 401)
  let e: any
  try { e = JSON.parse(raw) } catch { return json({ ok: false }, 401) }
  if (typeof e.id !== 'string' || e.id.length > 200 || !Number.isSafeInteger(e.created) || !e.data?.object) return json({ ok: false }, 401)
  if (!['payment_intent.processing', 'payment_intent.succeeded', 'payment_intent.payment_failed', 'charge.dispute.created', 'charge.failed'].includes(e.type)) return json({ ok: true })
  const o = e.data.object
  const paymentId = o.metadata?.glove_payment_id
  const intentId = e.type.startsWith('payment_intent.') ? o.id : o.payment_intent
  if (typeof paymentId !== 'string' || typeof intentId !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(intentId)) return json({ ok: true })
  const key = await stripeKey(db)
  if (!key) return json({ ok: false }, 404)
  // Fetch the current provider object: an old callback cannot regress a settled payment.
  let pi: any
  try { pi = await stripeRequest(key, `payment_intents/${intentId}?expand[]=latest_charge.balance_transaction`) } catch { return json({ ok: false }, 503) }
  for (let retry = 0; retry < 6; retry++) {
    const before = await load(db), p = before.payments.find(p => p.id === paymentId)
    if (!p || p.erasedAt || p.connectionId !== before.business[0]?.stripe?.connectionId) return json({ ok: true })
    const commandId = `stripe:${e.id}`, digest = sha256(canonicalJson({ event: e.id }))
    const actor: Actor = { id: 'provider:Stripe', name: 'Stripe', role: 'owner', sessionId: '', operatorVersion: 0, paymentProvider: p.connectionId }
    if (await saved(db, commandId, digest, actor)) return json({ ok: true })
    const charge = pi.latest_charge
    const amount = cents(p.amount, 'amount') + cents(p.tip, 'tip')
    if (pi.id !== intentId || pi.metadata?.glove_payment_id !== p.id || pi.metadata?.glove_connection_id !== p.connectionId || pi.currency !== p.currency.toLowerCase() || pi.amount !== amount || pi.livemode !== false || (p.intentId && p.intentId !== pi.id)) return json({ ok: false }, 401)
    const returned = charge?.disputed === true || (!!p.confirmedAt && charge?.status === 'failed')
    const status = returned || p.status === 'returned' ? 'returned' : charge?.status === 'failed' ? 'failed' : pi.status === 'succeeded' && pi.amount_received === amount ? 'paid' : pi.status === 'processing' ? 'pending' : ['requires_payment_method', 'canceled'].includes(pi.status) ? 'failed' : 'pending'
    const c: Context = { s: structuredClone(before), actor, commandId, now: new Date().toISOString(), events: [], sql: [], files: [] }
    const fee = charge?.balance_transaction?.fee
    const refunded = before.payments.filter(r => r.kind === 'refund' && r.paymentId === p.id && r.status === 'paid').reduce((n, r) => n + cents(r.amount, 'amount'), 0)
    const delta = (status === 'paid' ? cents(p.amount, 'amount') : status === 'returned' ? refunded : 0) - paidCents(p)
    const effects = [...(p.effects ?? []), ...(delta ? [{ at: c.now, amountCents: delta, tipCents: delta > 0 ? cents(p.tip, 'tip') : -cents(p.tip, 'tip'), eventId: e.id }] : [])]
    const next = bump(c.s, 'payments', find(c.s, 'payments', p.id), { effects, intentId: pi.id, status, fee: Number.isSafeInteger(fee) && fee >= 0 ? dollars(fee) : null, confirmedAt: status === 'paid' ? p.confirmedAt ?? new Date((charge?.created ?? e.created) * 1000).toISOString() : p.confirmedAt ?? null, providerReference: charge?.id ?? pi.id, lastEvent: e.id })
    event(c, { jobId: p.jobId, subjectKind: 'payment', subjectId: p.id, kind: `payment.${status}`, summary: `Stripe test mode reports ${status}: $${p.amount}, tip $${p.tip}`, data: { paymentId: p.id, provider: 'Stripe', providerReference: next.providerReference, eventId: e.id, status, amount: p.amount, tip: p.tip, fee: next.fee } })
    c.events[c.events.length - 1].actor.role = 'provider' as any
    try { await commit(db, c, before, 'payment.providerEvent', digest, { paymentId: p.id, status }); return json({ ok: true }) }
    catch (error) { if ((await load(db)).version !== before.version) continue; if (await saved(db, commandId, digest, actor)) return json({ ok: true }); throw error }
  }
  return json({ ok: false }, 503)
}

/** Stripe can redirect here before a webhook. Query parameters never prove a payment. */
export function paymentReturn(request: Request): Response | null {
  if (new URL(request.url).pathname !== '/payment-return') return null
  const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'" }
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { ...headers, allow: 'GET, HEAD' } })
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Checkout closed</title><style>body{font:1.125rem/1.6 system-ui,sans-serif;color:#182136;background:#fff;margin:0}main{box-sizing:border-box;max-width:42rem;margin:3rem auto;padding:1.5rem}h1{font-size:1.75rem;line-height:1.2}</style></head><body><main><h1>Checkout closed</h1><p>This page does not confirm a payment. Stripe must confirm it to the business before it is recorded as paid.</p><p>Bank payments can remain pending. Contact the business for your payment status or receipt, and check with them before starting another payment.</p></main></body></html>'
  return new Response(request.method === 'HEAD' ? null : html, { headers })
}
