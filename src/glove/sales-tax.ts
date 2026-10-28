import { branchIdOf, branchZone } from './branches'
import { business, fail, find, text, type Row, type State } from './model'
import { cents, dollars, signedCents, type DiscountAllocation, type DocumentDiscount, type Line, type Totals } from './money'
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
  const base: TaxContext = { currency, branchId, jurisdictionId: null, jurisdiction: '', rate: '0', taxLabor: true, laborServiceIds: s.services.filter(x => !['material', 'task', 'discount'].includes(x.kind)).map(x => x.id), exempt: false, exemption: null }
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

/**
 * QUOTE-007, QUOTE-019: the document discount comes off non-taxable lines first, then
 * taxable lines in line order; each line gives at most its own amount.
 */
function allocate(rows: Line[], taxed: (l: Line) => boolean, d: DocumentDiscount, subtotal: bigint, nonTaxable: bigint): DiscountAllocation {
  const amount = d.kind === 'amount' ? BigInt(cents(d.value, 'discount.value')) : (subtotal * BigInt(Math.round(Number(d.value) * 100)) + 5000n) / 10000n
  if (amount > subtotal) fail('DISCOUNT', 'The discount cannot exceed the subtotal.', null, 400)
  const fromNonTaxable = amount < nonTaxable ? amount : nonTaxable, lines: DiscountAllocation['lines'] = []
  for (const [pool, wanted] of [[false, fromNonTaxable], [true, amount - fromNonTaxable]] as const) {
    let rest = wanted
    rows.forEach((line, i) => {
      const value = BigInt(signedCents(line.total, 'total'))
      if (rest <= 0n || value <= 0n || taxed(line) !== pool) return
      const take = rest < value ? rest : value
      rest -= take
      lines.push({ line: i + 1, amount: dollars(take) })
    })
  }
  return { ...d, amount: dollars(amount), nonTaxable: dollars(fromNonTaxable), taxable: dollars(amount - fromNonTaxable), lines }
}

/** Round the combined jurisdiction rate once on the document's discounted taxable cents. */
export function priceTax(s: State, record: Row, rows: Line[], now: string, snapshot?: TaxContext, discount?: DocumentDiscount | null): TaxTotals | Totals {
  const context = snapshot ?? taxContext(s, record, now), aud = context.currency === 'AUD'
  const taxed = (line: Line) => line.tax !== 'FREE' && (aud || (!context.exempt && (context.taxLabor || !line.serviceId || !context.laborServiceIds.includes(line.serviceId))))
  let nonTaxable = 0n, taxable = 0n
  for (const line of rows) {
    const amount = BigInt(signedCents(line.total, 'total'))
    if (taxed(line)) taxable += amount; else nonTaxable += amount
  }
  // A discount line reduces only lines that share its tax treatment.
  if (nonTaxable < 0n || taxable < 0n) fail('DISCOUNT', 'Discount lines cannot exceed the lines that share their tax treatment.', null, 400)
  const subtotal = nonTaxable + taxable, allocation = discount ? allocate(rows, taxed, discount, subtotal, nonTaxable) : null
  const base = taxable - (allocation ? BigInt(cents(allocation.taxable, 'taxable')) : 0n), net = subtotal - (allocation ? BigInt(cents(allocation.amount, 'discount')) : 0n)
  // Existing Australian documents keep their original public totals shape and 10% GST.
  const rate = aud ? 100000n : context.jurisdictionId ? rateUnits(context.rate) : 0n, tax = (base * rate + 500000n) / 1000000n
  const plain = { subtotal: dollars(subtotal), gst: dollars(tax), total: dollars(net + tax), ...(allocation ? { discount: allocation } : {}) }
  if (aud) return plain
  const taxBreakdown = context.jurisdictionId ? [{ branchId: context.branchId, jurisdictionId: context.jurisdictionId, jurisdiction: context.jurisdiction, rate: context.rate, taxable: dollars(base), tax: dollars(tax) }] : []
  return { ...plain, currency: context.currency, taxBreakdown, taxContext: context }
}
