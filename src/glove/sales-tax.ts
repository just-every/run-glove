import { branchIdOf, branchZone } from './branches'
import { business, fail, find, text, type Row, type State } from './model'
import { cents, dollars, totals, type Line, type Totals } from './money'
import { localParts } from './time'

export type TaxJurisdiction = { id: string; name: string; rate: string; zips: string[]; taxLabor: boolean }
export type TaxSettings = { jurisdictions: TaxJurisdiction[]; defaultJurisdictionId?: string }
export type TaxContext = {
  currency: 'USD' | 'AUD'; branchId: string | null; jurisdictionId: string | null; jurisdiction: string
  rate: string; taxLabor: boolean; laborServiceIds: string[]; exempt: boolean
  exemption: { certificateNumber: string; expires: string; fileId: string | null } | null
}
export type TaxBreakdown = { branchId: string | null; jurisdictionId: string; jurisdiction: string; rate: string; taxable: string; tax: string }
export type TaxTotals = Totals & { currency: 'USD' | 'AUD'; taxBreakdown: TaxBreakdown[]; taxContext: TaxContext }

/** Percentages are decimal text with up to four places; 8.25 means 8.25%. */
const rateUnits = (value: unknown): bigint => {
  if (typeof value !== 'string' || !/^\d{1,3}(\.\d{1,4})?$/.test(value)) fail('INPUT', 'A tax rate is a percentage such as 8.25, with up to four decimal places.', null, 400)
  const [whole, fraction = ''] = (value as string).split('.')
  const units = BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, '0'))
  return units <= 1000000n ? units : fail('INPUT', 'A tax rate cannot exceed 100%.', null, 400)
}
const rateText = (units: bigint) => `${units / 10000n}${units % 10000n ? '.' + String(units % 10000n).padStart(4, '0').replace(/0+$/, '') : ''}`

/** Shared by business.save and branch.save; no provider keys belong here. */
export function normalizeTaxSettings(value: unknown): TaxSettings {
  const p = value as any
  if (!p || !Array.isArray(p.jurisdictions) || p.jurisdictions.length > 100) fail('INPUT', 'taxSettings.jurisdictions lists up to 100 jurisdictions.', null, 400)
  const ids = new Set<string>()
  const jurisdictions: TaxJurisdiction[] = p.jurisdictions.map((j: any) => {
    const id = text(j?.id, 'jurisdiction.id', { max: 80 })
    if (!/^[A-Za-z0-9_-]+$/.test(id) || ids.has(id)) fail('INPUT', 'Tax jurisdiction IDs must be unique letters, digits, underscores or hyphens.', null, 400)
    ids.add(id)
    if (!Array.isArray(j.zips) || j.zips.length > 200 || j.zips.some((zip: unknown) => typeof zip !== 'string' || !/^\d{5}$/.test(zip))) fail('INPUT', 'A tax jurisdiction lists up to 200 five-digit ZIP codes.', null, 400)
    if (j.taxLabor !== undefined && typeof j.taxLabor !== 'boolean') fail('INPUT', 'taxLabor is true or false.', null, 400)
    return { id, name: text(j.name, 'jurisdiction.name', { max: 200 }), rate: rateText(rateUnits(j.rate)), zips: [...new Set<string>(j.zips)], taxLabor: j.taxLabor !== false }
  })
  const defaultJurisdictionId = p.defaultJurisdictionId === undefined || p.defaultJurisdictionId === '' ? undefined : text(p.defaultJurisdictionId, 'defaultJurisdictionId', { max: 80 })
  if (defaultJurisdictionId && !ids.has(defaultJurisdictionId)) fail('INPUT', 'Choose an existing default tax jurisdiction.', null, 400)
  return { jurisdictions, ...(defaultJurisdictionId ? { defaultJurisdictionId } : {}) }
}

/** The revision keeps all facts that select its tax; later settings do not reprice it. */
export function taxContext(s: State, record: Row, now: string): TaxContext {
  const b = business(s), job = record.jobId ? find(s, 'jobs', record.jobId) : record
  const site = job.siteId ? find(s, 'sites', job.siteId) : record.customerId && record.address ? record : null
  const branchId = branchIdOf(s, job), branch = branchId ? find(s, 'branches', branchId) : null
  const currency = b.currency === 'AUD' ? 'AUD' : 'USD'
  const base: TaxContext = { currency, branchId, jurisdictionId: null, jurisdiction: '', rate: '0', taxLabor: true, laborServiceIds: s.services.filter(x => x.kind !== 'material' && x.kind !== 'task').map(x => x.id), exempt: false, exemption: null }
  if (currency === 'AUD') return { ...base, jurisdictionId: 'GST', jurisdiction: 'GST', rate: '10' }
  const settings: TaxSettings = branch?.taxSettings ?? b.taxSettings ?? { jurisdictions: [] }
  const explicit = site?.taxJurisdictionId
  let jurisdiction: TaxJurisdiction | undefined
  if (explicit) {
    jurisdiction = settings.jurisdictions.find(j => j.id === explicit)
    if (!jurisdiction) fail('TAX_JURISDICTION', 'The site’s tax jurisdiction is not configured for its branch.', null, 400)
  } else {
    const zip = site?.zip || String(site?.address ?? '').match(/\b(\d{5})(?:-\d{4})?\s*$/)?.[1]
    const matches = settings.jurisdictions.filter(j => j.zips.includes(zip))
    if (matches.length > 1) fail('TAX_JURISDICTION', 'More than one jurisdiction matches this ZIP. Select the site’s tax jurisdiction.', null, 400)
    jurisdiction = matches[0] ?? settings.jurisdictions.find(j => j.id === settings.defaultJurisdictionId)
    if (!jurisdiction && settings.jurisdictions.length) fail('TAX_JURISDICTION', 'Select a tax jurisdiction for the service address.', null, 400)
  }
  const customer = job.customerId ? find(s, 'customers', job.customerId) : site?.customerId ? find(s, 'customers', site.customerId) : null
  const exemption = customer?.taxExemption ?? null
  const exempt = !!exemption?.certificate?.fileId && !!exemption.certificateNumber && /^\d{4}-\d{2}-\d{2}$/.test(exemption.expires ?? '') && exemption.expires >= localParts(now, branchZone(s, job)).date
  return { ...base, ...(jurisdiction ? { jurisdictionId: jurisdiction.id, jurisdiction: jurisdiction.name, rate: jurisdiction.rate, taxLabor: jurisdiction.taxLabor } : {}), exempt, exemption: exemption ? { certificateNumber: exemption.certificateNumber, expires: exemption.expires, fileId: exemption.certificate?.fileId ?? null } : null }
}

/** Round the combined jurisdiction rate once on the document's taxable cents. */
export function priceTax(s: State, record: Row, rows: Line[], now: string, snapshot?: TaxContext): TaxTotals | Totals {
  const context = snapshot ?? taxContext(s, record, now)
  // Existing Australian documents keep their original public totals shape.
  if (context.currency === 'AUD') return totals(rows)
  let subtotal = 0n, taxable = 0n
  for (const line of rows) {
    const amount = BigInt(cents(line.total, 'total'))
    subtotal += amount
    if (line.tax !== 'FREE' && !context.exempt && (context.taxLabor || !line.serviceId || !context.laborServiceIds.includes(line.serviceId))) taxable += amount
  }
  const tax = context.jurisdictionId ? (taxable * rateUnits(context.rate) + 500000n) / 1000000n : 0n
  const taxBreakdown = context.jurisdictionId ? [{ branchId: context.branchId, jurisdictionId: context.jurisdictionId, jurisdiction: context.jurisdiction, rate: context.rate, taxable: dollars(taxable), tax: dollars(tax) }] : []
  return { subtotal: dollars(subtotal), gst: dollars(tax), total: dollars(subtotal + tax), currency: context.currency, taxBreakdown, taxContext: context }
}
