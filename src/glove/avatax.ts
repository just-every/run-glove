import { fail, text, type Context } from './model'
import { providerEvent } from './timeline'

// Optional Avalara AvaTax rate lookup (MONEY-001). One uncommitted SalesOrder
// prices two $100 sample lines at the service address: general tangible goods
// and the owner's AvaTax service tax code. A SalesOrder is never recorded in
// AvaTax. Nothing about the customer is sent; the customer code is fixed.
export type AvataxKey = { accountId: string; licenseKey: string; companyCode: string; environment: 'production' | 'sandbox' }
export type AvataxLine = { status: number; breakdown: { reason: string; rate: string | null }[]; combined: string | null; treatment: 'taxable' | 'nonTaxable' | 'unavailable' }

const hosts = { production: 'https://rest.avatax.com', sandbox: 'https://sandbox-rest.avatax.com' }
export const avataxPartsCode = 'P0000000'

export function avataxKey(p: any): AvataxKey {
  const accountId = text(p?.accountId, 'AvaTax account ID', { max: 20 })
  if (!/^\d+$/.test(accountId)) fail('INPUT', 'The AvaTax account ID is a number.', null, 400)
  const environment = p?.environment === 'sandbox' ? 'sandbox' : p?.environment === 'production' ? 'production' : fail('INPUT', 'Choose the AvaTax production or sandbox environment.', null, 400)
  return { accountId, licenseKey: text(p?.licenseKey, 'AvaTax license key', { max: 200 }), companyCode: text(p?.companyCode, 'AvaTax company code', { max: 25 }), environment }
}

// AvaTax rates are decimal fractions; combine them in millionths so 0.0625 +
// 0.02 reads exactly 8.25 (percent, four places).
const millionths = (rate: unknown) => typeof rate === 'number' && Number.isFinite(rate) && rate >= 0 ? Math.round(rate * 1e6) : null
const percent = (m: number) => (m / 1e4).toFixed(4).replace(/\.?0+$/, '')

function line(answer: any, number: string, status: number): AvataxLine {
  const details: any[] = Array.isArray(answer?.lines) ? answer.lines.find((l: any) => l?.lineNumber === number)?.details ?? [] : []
  const breakdown = details.map(d => {
    const m = millionths(d?.rate)
    const reason = d?.taxableAmount === 100 && !d?.nonTaxableAmount && !d?.exemptAmount ? 'taxable' : d?.nonTaxableAmount === 100 && !d?.taxableAmount && !d?.exemptAmount ? 'non-taxable' : 'partial or exempt'
    return { reason: `${typeof d?.jurisName === 'string' ? d.jurisName.slice(0, 80) : 'jurisdiction'} ${reason}`, rate: m === null ? null : percent(m), m, kind: reason }
  })
  let treatment: AvataxLine['treatment'] = 'unavailable', combined: string | null = null
  if (breakdown.length && breakdown.every(b => b.kind === 'taxable' && b.m !== null)) {
    const sum = breakdown.reduce((n, b) => n + b.m!, 0)
    if (sum > 0) { treatment = 'taxable'; combined = percent(sum) }
  } else if (breakdown.length && breakdown.every(b => b.kind === 'non-taxable')) treatment = 'nonTaxable'
  return { status, breakdown: breakdown.map(({ reason, rate }) => ({ reason, rate })), combined, treatment }
}

export async function avataxLookup(c: Context, db: D1Database, key: AvataxKey, siteId: string, address: { line1: string; city: string; state: string; postal_code: string }, serviceTaxCode: string) {
  const body = {
    type: 'SalesOrder', commit: false, companyCode: key.companyCode, date: c.now.slice(0, 10), customerCode: 'glove-address-rate-lookup', currencyCode: 'USD',
    addresses: { singleLocation: { line1: address.line1, city: address.city, region: address.state, postalCode: address.postal_code, country: 'US' } },
    lines: [{ number: 'parts', quantity: 1, amount: 100, taxCode: avataxPartsCode, description: 'Sample tangible goods' }, { number: 'service', quantity: 1, amount: 100, taxCode: serviceTaxCode, description: 'Sample service' }],
  }
  let status = 0, answer: any = null
  try {
    const response = await fetch(`${hosts[key.environment]}/api/v2/transactions/create`, { method: 'POST', headers: { authorization: `Basic ${btoa(`${key.accountId}:${key.licenseKey}`)}`, 'content-type': 'application/json', 'x-avalara-client': 'Glove; 0.1.0; REST; v2; glove' }, body: JSON.stringify(body) })
    status = response.status
    if (response.ok) answer = await response.json()
  } catch { /* An unconfirmed lookup is reported, never invented as zero tax. */ }
  const transactionCode = typeof answer?.code === 'string' ? answer.code.slice(0, 100) : null
  await providerEvent(db, { id: `${c.commandId}:avatax`, at: c.now, commandId: c.commandId, provider: 'Avalara AvaTax', subjectKind: 'site', subjectId: siteId, kind: 'tax.lookupOutcome', summary: `Avalara AvaTax lookup: ${status || 'outcome unconfirmed'}`, data: { siteId, transactionCode, status, classifications: [avataxPartsCode, serviceTaxCode] } }).run()
  return { transactionCode, parts: line(answer, 'parts', status), labor: line(answer, 'service', status) }
}
