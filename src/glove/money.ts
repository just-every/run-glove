import { fail, text } from './model'

// Money is integer cents (AUD); quantities are integer thousandths. Inputs and
// outputs are decimal strings, never floating point. GST is 10% of the taxable
// subtotal, rounded half up once per document.

export const taxCodes = ['GST', 'FREE'] as const
export type TaxCode = (typeof taxCodes)[number]

export function cents(value: unknown, name: string): number {
  if (typeof value !== 'string' || !/^\d{1,9}(\.\d{1,2})?$/.test(value)) return fail('MONEY', `${name} must be a dollar amount such as 120 or 120.50.`, { field: name }, 400)
  const [whole, part = ''] = value.split('.')
  return Number(whole) * 100 + Number(part.padEnd(2, '0'))
}

export function thousandths(value: unknown, name: string, { zero = false } = {}): number {
  if (typeof value !== 'string' || !/^\d{1,7}(\.\d{1,3})?$/.test(value)) return fail('QUANTITY', `${name} must be a quantity such as 1, 2.5 or 0.125.`, { field: name }, 400)
  const [whole, part = ''] = value.split('.')
  const n = Number(whole) * 1000 + Number(part.padEnd(3, '0'))
  return n > 0 || zero ? n : fail('QUANTITY', `${name} must be more than zero.`, { field: name }, 400)
}

export const dollars = (n: number) => `${n < 0 ? '-' : ''}${Math.floor(Math.abs(n) / 100)}.${String(Math.abs(n) % 100).padStart(2, '0')}`
export const quantity = (n: number) => `${Math.floor(n / 1000)}${n % 1000 ? '.' + String(n % 1000).padStart(3, '0').replace(/0+$/, '') : ''}`

export type Line = { description: string; quantity: string; unitPrice: string; tax: TaxCode; serviceId: string | null; total: string; unitCost?: string }
export type Totals = { subtotal: string; gst: string; total: string }

/** Validate document lines from a payload and price each one. */
export function lines(value: unknown, name = 'lines'): Line[] {
  if (!Array.isArray(value) || !value.length || value.length > 100) return fail('INPUT', `Add between 1 and 100 ${name}.`, { field: name }, 400)
  return value.map((line, index) => {
    const label = `${name}[${index}]`
    const q = thousandths(line?.quantity, `${label}.quantity`), unit = cents(line?.unitPrice, `${label}.unitPrice`)
    const tax = line?.tax === 'FREE' ? 'FREE' : 'GST'
    return { description: text(line?.description, `${label}.description`, { max: 500 }), quantity: quantity(q), unitPrice: dollars(unit), tax, serviceId: typeof line?.serviceId === 'string' ? line.serviceId : null, total: dollars(lineCents(q, unit)) }
  })
}

const lineCents = (q: number, unit: number) => Math.floor((q * unit + 500) / 1000)

export function totals(rows: Line[]): Totals {
  let subtotal = 0, taxable = 0
  for (const line of rows) {
    const amount = cents(line.total, 'total')
    subtotal += amount
    if (line.tax === 'GST') taxable += amount
  }
  const gst = Math.floor((taxable + 5) / 10)
  return { subtotal: dollars(subtotal), gst: dollars(gst), total: dollars(subtotal + gst) }
}
