import type { Glove } from './api'
import { Field } from './controls'

// Price lines for quotes and invoices. Amounts are entered and sent as exact
// decimal text; the server prices each line and the GST total.
export type LineDraft = { description: string; quantity: string; unitPrice: string; tax: string; serviceId: string }
export const blankLine = (): LineDraft => ({ description: '', quantity: '1', unitPrice: '', tax: 'GST', serviceId: '' })

export function LinesEditor({ s, lines, setLines }: { s: Glove; lines: LineDraft[]; setLines: (l: LineDraft[]) => void }) {
  const update = (i: number, change: Partial<LineDraft>) => setLines(lines.map((l, j) => j === i ? { ...l, ...change } : l))
  const pick = (i: number, id: string) => {
    const service = s.services.find(x => x.id === id)
    update(i, service ? { serviceId: id, description: service.name, unitPrice: service.unitPrice, tax: service.tax } : { serviceId: '' })
  }
  return <fieldset className="lines"><legend>Price lines (before tax)</legend>
    {lines.map((l, i) => <div className="line" key={i}>
      <Field label="From the price book">{p => <select {...p} value={l.serviceId} onChange={e => pick(i, e.target.value)}><option value="">Custom line</option>{s.services.filter(x => !x.archived).map(x => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select>}</Field>
      <Field label="Description">{p => <input {...p} value={l.description} onChange={e => update(i, { description: e.target.value })} required />}</Field>
      <Field label="Quantity">{p => <input {...p} inputMode="decimal" value={l.quantity} onChange={e => update(i, { quantity: e.target.value })} required />}</Field>
      <Field label="Unit price">{p => <input {...p} inputMode="decimal" value={l.unitPrice} onChange={e => update(i, { unitPrice: e.target.value })} required />}</Field>
      <Field label="Tax">{p => <select {...p} value={l.tax} onChange={e => update(i, { tax: e.target.value })}><option value="GST">Taxable (10%)</option><option value="FREE">Tax-exempt</option></select>}</Field>
      {lines.length > 1 && <button type="button" className="remove" onClick={() => setLines(lines.filter((_, j) => j !== i))}>Remove line</button>}
    </div>)}
    <button type="button" onClick={() => setLines([...lines, blankLine()])}>Add line</button>
  </fieldset>
}

export const payloadLines = (lines: LineDraft[]) => lines.map(l => ({ ...l, serviceId: l.serviceId || undefined }))
