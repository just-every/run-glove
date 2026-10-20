import { authority } from '../access'
import { avataxKey, avataxLookup } from '../avatax'
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

// Each provider's key row; Stripe stays the default for existing callers.
const providerOf = (p: any) => p.provider === undefined || p.provider === 'stripe' ? 'stripe-tax' : p.provider === 'avatax' ? 'avatax' : fail('INPUT', 'Choose Stripe Tax or Avalara AvaTax.', null, 400)

export const taxLookup: Handler = async (c, type, p, db) => {
  if (type === 'tax.connect') {
    const b = business(c.s), provider = providerOf(p)
    if (provider === 'avatax') {
      // The account ID, license key, company code and environment are one sealed secret.
      c.sql.push(p.key === null ? { sql: "DELETE FROM glove_provider_keys WHERE provider='avatax'", params: [] } : { sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('avatax',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [JSON.stringify(avataxKey(p.key)), c.actor.id, c.now] })
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: p.key === null ? 'tax.disconnected' : 'tax.connected', summary: `${c.actor.name} ${p.key === null ? 'disconnected' : 'connected'} the optional Avalara AvaTax rate lookup`, data: { provider: 'avatax' } })
      return bump(c.s, 'business', b, { avataxLookup: { connected: p.key !== null, at: c.now } })
    }
    c.sql.push(p.key === null ? { sql: "DELETE FROM glove_provider_keys WHERE provider='stripe-tax'", params: [] } : { sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('stripe-tax',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [text(p.key, 'key', { max: 4000 }), c.actor.id, c.now] })
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: p.key === null ? 'tax.disconnected' : 'tax.connected', summary: `${c.actor.name} ${p.key === null ? 'disconnected' : 'connected'} the optional Stripe Tax rate lookup`, data: null })
    return bump(c.s, 'business', b, { taxLookup: { connected: p.key !== null, at: c.now } })
  }
  if (type !== 'tax.lookup') return undefined
  const site = find(c.s, 'sites', p.siteId), provider = providerOf(p)
  if (provider === 'stripe-tax' && !codes.includes(p.serviceTaxCode)) fail('INPUT', 'Choose the Stripe classification that describes this service.', null, 400)
  if (provider === 'avatax' && !/^[A-Z0-9]{2,25}$/.test(String(p.serviceTaxCode ?? ''))) fail('INPUT', 'Enter the AvaTax tax code your Avalara account uses for this service.', null, 400)
  const address = { line1: text(p.address?.line1, 'Service street', { max: 300 }), city: text(p.address?.city, 'Service city', { max: 100 }), state: text(p.address?.state, 'Service state', { max: 2 }).toUpperCase(), postal_code: text(p.address?.postal_code, 'Service ZIP', { max: 5 }), country: 'US' }
  if (!/^[A-Z]{2}$/.test(address.state) || !/^\d{5}$/.test(address.postal_code)) fail('INPUT', 'Use a two-letter US state and five-digit ZIP.', null, 400)
  const auth = authority(c.actor)
  const key = (await db.prepare(`SELECT value FROM glove_provider_keys WHERE provider=? AND (${auth.sql})`).bind(provider, ...auth.params).first<{ value: string }>())?.value
  if (provider === 'avatax') {
    if (!key) fail('TAX_PROVIDER', 'Connect your Avalara AvaTax account and its nexus first.')
    const { transactionCode, parts, labor } = await avataxLookup(c, db, JSON.parse(key!), site.id, address, p.serviceTaxCode)
    // Only a fully taxed positive parts rate, with the service either taxed at that
    // same rate or wholly non-taxable, becomes a proposal; anything else is unavailable.
    let proposal = null
    if (parts.treatment === 'taxable' && (labor.treatment === 'nonTaxable' || (labor.treatment === 'taxable' && labor.combined === parts.combined))) {
      proposal = normalizeTaxSettings({ jurisdictions: [{ id: site.id, name: `${address.city}, ${address.state} combined`, rate: parts.combined, zips: [address.postal_code], taxLabor: labor.treatment === 'taxable' }] }).jurisdictions[0]
    }
    event(c, { jobId: null, subjectKind: 'site', subjectId: site.id, kind: 'tax.lookedUp', summary: `Avalara AvaTax lookup for a service address: ${proposal ? 'proposal prepared' : 'rate unavailable'}`, data: { siteId: site.id, provider: 'avatax', transactionCode, serviceTaxCode: p.serviceTaxCode } })
    return { provider: 'avatax', siteId: site.id, parts, labor, proposal, label: proposal ? 'Avalara AvaTax lookup proposal; review and apply the jurisdiction settings yourself' : 'Rate unavailable for automatic application; inspect the provider reasons, your AvaTax nexus and the service tax code' }
  }
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
