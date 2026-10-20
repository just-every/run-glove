import { fail, text } from './model'

// Money is integer cents; quantities are integer thousandths. Multiplication
// uses integers throughout, including the intermediate quantity × unit price.

export const taxCodes = ['TAXABLE', 'GST', 'FREE'] as const
export type TaxCode = (typeof taxCodes)[number]

export function cents(value: unknown, name: string): number {
  if (typeof value !== 'string' || !/^\d{1,13}(\.\d{1,2})?$/.test(value)) return fail('MONEY', `${name} must be a dollar amount such as 120 or 120.50.`, { field: name }, 400)
  const [whole, part = ''] = value.split('.')
  return Number(whole) * 100 + Number(part.padEnd(2, '0'))
}

/** QUOTE-007: a discount line's unit price may be negative, such as -50.00. */
export function signedCents(value: unknown, name: string): number {
  if (typeof value === 'string' && value.startsWith('-')) return -cents(value.slice(1), name)
  return cents(value, name)
}

export function thousandths(value: unknown, name: string, { zero = false } = {}): number {
  if (typeof value !== 'string' || !/^\d{1,7}(\.\d{1,3})?$/.test(value)) return fail('QUANTITY', `${name} must be a quantity such as 1, 2.5 or 0.125.`, { field: name }, 400)
  const [whole, part = ''] = value.split('.')
  const n = Number(whole) * 1000 + Number(part.padEnd(3, '0'))
  return n > 0 || zero ? n : fail('QUANTITY', `${name} must be more than zero.`, { field: name }, 400)
}

export const dollars = (n: number | bigint) => {
  if (typeof n === 'number' && !Number.isSafeInteger(n)) fail('MONEY', 'The amount exceeds the supported exact-cent range.', null, 400)
  const value = BigInt(n), absolute = value < 0n ? -value : value
  if (absolute > 999999999999999n) fail('MONEY', 'The amount exceeds the supported dollar range.', null, 400)
  return `${value < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`
}
export const quantity = (n: number) => `${Math.floor(n / 1000)}${n % 1000 ? '.' + String(n % 1000).padStart(3, '0').replace(/0+$/, '') : ''}`

export type Line = { description: string; quantity: string; unitPrice: string; tax: TaxCode; serviceId: string | null; total: string; unitCost?: string; discount?: true }
/** QUOTE-007: a document discount, a percentage of the subtotal or a fixed amount, with its reason. */
export type DocumentDiscount = { kind: 'percent' | 'amount'; value: string; reason: string }
export type DiscountAllocation = DocumentDiscount & { amount: string; nonTaxable: string; taxable: string; lines: { line: number; amount: string }[] }
export type Totals = { subtotal: string; gst: string; total: string; discount?: DiscountAllocation }

export function documentDiscount(value: unknown, name = 'discount'): DocumentDiscount | null {
  const p = value as any
  if (p === undefined || p === null) return null
  const kind = p.kind === 'percent' || p.kind === 'amount' ? p.kind : fail('INPUT', `${name}.kind is percent or amount.`, { field: `${name}.kind` }, 400)
  const reason = text(p.reason, `${name}.reason`, { max: 100 })
  if (kind === 'amount') { const n = cents(p.value, `${name}.value`); return n > 0 ? { kind, value: dollars(n), reason } : fail('INPUT', `${name}.value must be more than zero.`, { field: `${name}.value` }, 400) }
  if (typeof p.value !== 'string' || !/^\d{1,3}(\.\d{1,2})?$/.test(p.value) || Number(p.value) <= 0 || Number(p.value) > 100) fail('INPUT', `${name}.value is a percentage above 0 and at most 100, with up to two decimal places.`, { field: `${name}.value` }, 400)
  return { kind, value: String(Number(p.value)), reason }
}

/** Revenue figures are the subtotal less any document discount, before tax. */
export const netCents = (t: { subtotal: string; discount?: { amount: string } }) => cents(t.subtotal, 'subtotal') - (t.discount ? cents(t.discount.amount, 'discount') : 0)

/** Validate document lines from a payload and price each one. */
export function lines(value: unknown, name = 'lines'): Line[] {
  if (!Array.isArray(value) || !value.length || value.length > 100) return fail('INPUT', `Add between 1 and 100 ${name}.`, { field: name }, 400)
  return value.map((line, index) => {
    const label = `${name}[${index}]`
    const q = thousandths(line?.quantity, `${label}.quantity`), unit = signedCents(line?.unitPrice, `${label}.unitPrice`)
    const tax: TaxCode = line?.tax === undefined ? 'TAXABLE' : taxCodes.includes(line.tax) ? line.tax : fail('INPUT', `${label}.tax must be TAXABLE, GST or FREE.`, { field: `${label}.tax` }, 400)
    return { description: text(line?.description, `${label}.description`, { max: 500 }), quantity: quantity(q), unitPrice: dollars(unit), tax, serviceId: typeof line?.serviceId === 'string' ? line.serviceId : null, total: dollars(lineCents(q, unit)), ...(unit < 0 ? { discount: true as const } : {}) }
  })
}

// Half a cent rounds away from zero, so a discount line mirrors the same charge.
const lineCents = (q: number, unit: number) => {
  const product = BigInt(q) * BigInt(unit), value = product < 0n ? -((-product + 500n) / 1000n) : (product + 500n) / 1000n
  if (value > 999999999999999n || value < -999999999999999n) fail('MONEY', 'The line total exceeds the supported dollar amount.', null, 400)
  return value
}

export function totals(rows: Line[]): Totals {
  let subtotal = 0n, taxable = 0n
  for (const line of rows) {
    const amount = BigInt(cents(line.total, 'total'))
    subtotal += amount
    if (line.tax !== 'FREE') taxable += amount
  }
  const gst = (taxable + 5n) / 10n
  return { subtotal: dollars(subtotal), gst: dollars(gst), total: dollars(subtotal + gst) }
}
