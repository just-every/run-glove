import { authority } from '../access'
import { normalizeTaxSettings } from '../sales-tax'
import { bump, business, event, fail, find, text, type Context } from '../model'
import { providerEvent } from '../timeline'
import type { Handler } from './types'

// Stripe Tax calculations require the owner's active registrations. An
// uncollected or partial result is never promoted to a zero rate/exemption.
const codes = ['txcd_20080007', 'txcd_20020010', 'txcd_20020018', 'txcd_20030000']
async function calculate(c: Context, db: D1Database, key: string, siteId: string, address: Record<string,string>, code: string, label: string) {
  const form = new URLSearchParams({ currency: 'usd', 'customer_details[address_source]': 'shipping', 'line_items[0][amount]': '10000', 'line_items[0][quantity]': '1', 'line_items[0][reference]': 'address-rate-lookup', 'line_items[0][tax_behavior]': 'exclusive', 'line_items[0][tax_code]': code })
  for (const [k,v] of Object.entries(address)) form.set(`customer_details[address][${k}]`, v)
  let status = 0, body: any = null
  try {
    const response = await fetch('https://api.stripe.com/v1/tax/calculations', { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded', 'idempotency-key': `${c.commandId}:${label}` }, body: form.toString() })
    status = response.status
    if (response.ok) body = await response.json()
  } catch { /* An unconfirmed lookup is reported, never invented as zero tax. */ }
  const breakdown = Array.isArray(body?.tax_breakdown) ? body.tax_breakdown.map((x: any) => ({ reason: x.taxability_reason, rate: x.tax_rate_details?.percentage_decimal })) : []
  const answer = { calculationId: typeof body?.id === 'string' ? body.id : null, status, breakdown }
  await providerEvent(db, { id: `${c.commandId}:stripe-tax:${label}`, at: c.now, commandId: c.commandId, provider: 'Stripe Tax', subjectKind: 'site', subjectId: siteId, kind: 'tax.lookupOutcome', summary: `Stripe Tax ${label} lookup: ${status || 'outcome unconfirmed'}`, data: { siteId, calculationId: answer.calculationId, status, classification: code } }).run()
  return answer
}

export const taxLookup: Handler = async (c, type, p, db) => {
  if (type === 'tax.connect') {
    const b = business(c.s)
    c.sql.push(p.key === null ? { sql: "DELETE FROM glove_provider_keys WHERE provider='stripe-tax'", params: [] } : { sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('stripe-tax',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [text(p.key, 'key', { max: 4000 }), c.actor.id, c.now] })
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: p.key === null ? 'tax.disconnected' : 'tax.connected', summary: `${c.actor.name} ${p.key === null ? 'disconnected' : 'connected'} the optional Stripe Tax rate lookup`, data: null })
    return bump(c.s, 'business', b, { taxLookup: { connected: p.key !== null, at: c.now } })
  }
  if (type !== 'tax.lookup') return undefined
  const site = find(c.s, 'sites', p.siteId)
  if (!codes.includes(p.serviceTaxCode)) fail('INPUT', 'Choose the Stripe classification that describes this service.', null, 400)
  const address = { line1: text(p.address?.line1, 'Service street', { max: 300 }), city: text(p.address?.city, 'Service city', { max: 100 }), state: text(p.address?.state, 'Service state', { max: 2 }).toUpperCase(), postal_code: text(p.address?.postal_code, 'Service ZIP', { max: 5 }), country: 'US' }
  if (!/^[A-Z]{2}$/.test(address.state) || !/^\d{5}$/.test(address.postal_code)) fail('INPUT', 'Use a two-letter US state and five-digit ZIP.', null, 400)
  const auth = authority(c.actor)
  const key = (await db.prepare(`SELECT value FROM glove_provider_keys WHERE provider='stripe-tax' AND (${auth.sql})`).bind(...auth.params).first<{ value: string }>())?.value
  if (!key) fail('TAX_PROVIDER', 'Connect your Stripe Tax key and active registrations first.')
  const [parts, labor] = await Promise.all([calculate(c, db, key!, site.id, address, 'txcd_99999999', 'parts'), calculate(c, db, key!, site.id, address, p.serviceTaxCode, 'service')])
  const normal = parts.breakdown.length === 1 && parts.breakdown[0].reason === 'standard_rated'
  const laborStandard = labor.breakdown.length === 1 && labor.breakdown[0].reason === 'standard_rated' && labor.breakdown[0].rate === parts.breakdown[0]?.rate
  const laborExempt = labor.breakdown.length === 1 && ['product_exempt', 'not_subject_to_tax'].includes(labor.breakdown[0].reason)
  let proposal = null
  if (normal && (laborStandard || laborExempt)) {
    // Reuse the same strict decimal-rate parser as manually entered settings.
    const validated = normalizeTaxSettings({ jurisdictions: [{ id: site.id, name: `${address.city}, ${address.state} combined`, rate: parts.breakdown[0].rate, zips: [address.postal_code], taxLabor: laborStandard }] })
    proposal = validated.jurisdictions[0]
  }
  const result = { siteId: site.id, parts, labor, proposal, label: proposal ? 'Stripe Tax lookup proposal; review and apply the jurisdiction settings yourself' : 'Rate unavailable for automatic application; inspect the provider reasons and your Stripe Tax registrations' }
  event(c, { jobId: null, subjectKind: 'site', subjectId: site.id, kind: 'tax.lookedUp', summary: `Stripe Tax lookup for a service address: ${proposal ? 'proposal prepared' : 'rate unavailable'}`, data: { siteId: site.id, calculationIds: [parts.calculationId, labor.calculationId], serviceTaxCode: p.serviceTaxCode } })
  return result
}
