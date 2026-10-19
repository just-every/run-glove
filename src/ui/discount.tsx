import type { Rec } from './api'
import { Field, money } from './controls'

// QUOTE-007: a document discount on a quote option or an invoice, and the
// allocation the server computed (non-taxable lines first, then taxable lines).
export type DiscountDraft = { kind: string; value: string; reason: string }
export const noDiscount: DiscountDraft = { kind: '', value: '', reason: '' }
export const discountDraft = (d?: Rec | null): DiscountDraft => d ? { kind: d.kind, value: d.value, reason: d.reason } : noDiscount
export const discountPayload = (d?: DiscountDraft) => d?.kind ? { kind: d.kind, value: d.value, reason: d.reason } : null

export function DiscountFields({ value, onChange }: { value: DiscountDraft; onChange: (d: DiscountDraft) => void }) {
  return <fieldset className="discount"><legend>Document discount</legend><div className="form-grid two">
    <Field label="Discount">{p => <select {...p} value={value.kind} onChange={e => onChange({ ...value, kind: e.target.value })}><option value="">No document discount</option><option value="percent">Percent of subtotal</option><option value="amount">Fixed dollar amount</option></select>}</Field>
    {value.kind && <Field label={value.kind === 'percent' ? 'Discount percent' : 'Discount amount'}>{p => <input {...p} inputMode="decimal" value={value.value} onChange={e => onChange({ ...value, value: e.target.value })} required />}</Field>}
    {value.kind && <Field label="Discount reason" hint="Such as senior, military or first-time customer.">{p => <input {...p} value={value.reason} onChange={e => onChange({ ...value, reason: e.target.value })} required />}</Field>}
  </div><p className="muted">Comes off non-taxable lines first, then taxable lines in line order; sales tax is on the taxable amount that remains. A discount line is a line with a negative unit price.</p></fieldset>
}

/** The discount row below the subtotal, naming the lines it came from. */
export function DiscountRows({ totals, lines }: { totals: Rec; lines: Rec[] }) {
  const d = totals.discount
  if (!d) return null
  const from = d.lines.map((x: Rec) => `${lines[x.line - 1]?.description ?? `line ${x.line}`} ${money(x.amount)}`).join(', ')
  return <tr><td colSpan={3}>Discount · {d.reason} ({d.kind === 'percent' ? `${d.value}%` : money(d.value)}) · non-taxable {money(d.nonTaxable)}, taxable {money(d.taxable)} · from {from}</td><td>{money(`-${d.amount}`)}</td></tr>
}
