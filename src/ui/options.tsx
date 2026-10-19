import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, money, useAction } from './controls'
import { LinesEditor, blankLine, payloadLines, type LineDraft } from './lines'

// Good, better and best options and add-ons (QUOTE-001): the editor for a
// draft or revision, the read-only view, the choice the customer made, and
// saving a revision's options as a reusable template.

export type Block = { name: string; lines: LineDraft[] }
const draftLines = (lines: Rec[]): LineDraft[] => lines.map(l => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, tax: l.tax, serviceId: l.serviceId ?? '' }))
export const blocksOf = (rev: Rec | null): { options: Block[]; addOns: Block[] } => rev
  ? { options: (rev.options ?? [{ name: '', lines: rev.lines }]).map((o: Rec) => ({ name: o.name, lines: draftLines(o.lines) })), addOns: (rev.addOns ?? []).map((a: Rec) => ({ name: a.name, lines: draftLines(a.lines) })) }
  : { options: [{ name: '', lines: [blankLine()] }], addOns: [] }

/** A one-option quote without add-ons keeps the plain `lines` payload. */
export const optionsPayload = (options: Block[], addOns: Block[]) => options.length === 1 && !addOns.length
  ? { lines: payloadLines(options[0].lines) }
  : { options: options.map(o => ({ name: o.name, lines: payloadLines(o.lines) })), addOns: addOns.map(a => ({ name: a.name, lines: payloadLines(a.lines) })) }

export function OptionsEditor({ s, options, setOptions, addOns, setAddOns }: { s: Glove; options: Block[]; setOptions: (b: Block[]) => void; addOns: Block[]; setAddOns: (b: Block[]) => void }) {
  const set = (list: Block[], put: (b: Block[]) => void, i: number, change: Partial<Block>) => put(list.map((b, j) => j === i ? { ...b, ...change } : b))
  const many = options.length > 1 || addOns.length > 0
  return <div className="options-editor">
    {options.map((o, i) => many ? <fieldset key={`o${i}`} className="option"><legend>Option {i + 1}</legend>
      <Field label="Option name">{p => <input {...p} value={o.name} onChange={e => set(options, setOptions, i, { name: e.target.value })} placeholder={['Good', 'Better', 'Best', 'Premium', 'Ultimate'][i]} />}</Field>
      <LinesEditor s={s} lines={o.lines} setLines={l => set(options, setOptions, i, { lines: l })} />
      {options.length > 1 && <button type="button" className="quiet" onClick={() => setOptions(options.filter((_, j) => j !== i))}>Remove option</button>}
    </fieldset> : <LinesEditor key={`o${i}`} s={s} lines={o.lines} setLines={l => set(options, setOptions, i, { lines: l })} />)}
    {addOns.map((a, i) => <fieldset key={`a${i}`} className="option"><legend>Add-on {i + 1}</legend>
      <Field label="Add-on name">{p => <input {...p} value={a.name} onChange={e => set(addOns, setAddOns, i, { name: e.target.value })} required />}</Field>
      <LinesEditor s={s} lines={a.lines} setLines={l => set(addOns, setAddOns, i, { lines: l })} />
      <button type="button" className="quiet" onClick={() => setAddOns(addOns.filter((_, j) => j !== i))}>Remove add-on</button>
    </fieldset>)}
    <div className="actions">
      {options.length < 5 && <button type="button" onClick={() => setOptions([...options, { name: '', lines: [blankLine()] }])}>Add an option</button>}
      {addOns.length < 10 && <button type="button" onClick={() => setAddOns([...addOns, { name: '', lines: [blankLine()] }])}>Add an add-on</button>}
    </div>
  </div>
}

function LinesTable({ block }: { block: Rec }) {
  return <table className="table"><thead><tr><th>Item</th><th>Qty</th><th>Unit before tax</th><th>Line</th></tr></thead><tbody>{block.lines.map((l: Rec, i: number) => <tr key={i}><td>{l.description}</td><td data-label="Qty">{l.quantity}</td><td data-label="Unit before tax">{money(l.unitPrice)}</td><td>{money(l.total)}</td></tr>)}</tbody>
    <tfoot><tr><td colSpan={3}>Subtotal</td><td>{money(block.totals.subtotal)}</td></tr><tr><td colSpan={3}>Tax (10%)</td><td>{money(block.totals.gst)}</td></tr><tr><td colSpan={3}><strong>Total incl. tax</strong></td><td><strong>{money(block.totals.total)}</strong></td></tr></tfoot></table>
}

/** A revision's options and add-ons; a one-option quote reads as one price table. */
export function OptionsView({ rev }: { rev: Rec }) {
  const options = rev.options ?? [{ id: 'option-1', name: '', lines: rev.lines, totals: rev.totals }], addOns = rev.addOns ?? []
  if (options.length === 1 && !addOns.length) return <LinesTable block={options[0]} />
  return <>{options.map((o: Rec) => <section key={o.id} className="option-view" aria-label={o.name}><h4>{o.name}</h4><LinesTable block={o} /></section>)}
    {addOns.length > 0 && <h4>Optional add-ons</h4>}{addOns.map((a: Rec) => <p key={a.id}>{a.name}: {money(a.totals.subtotal)} before tax ({money(a.totals.total)} incl. tax)</p>)}</>
}

export type Choice = { optionId: string; addOnIds: string[] }
/** Which option and add-ons the customer chose, recorded with their answer. */
export function ChoiceFields({ rev, choice, setChoice }: { rev: Rec; choice: Choice; setChoice: (c: Choice) => void }) {
  const options = rev.options ?? [], addOns = rev.addOns ?? []
  if (options.length <= 1 && !addOns.length) return null
  return <fieldset className="choice"><legend>What the customer chose</legend>
    {options.map((o: Rec) => <label key={o.id} className="check-line"><input type="radio" name={`choice-${rev.n}`} checked={choice.optionId === o.id} onChange={() => setChoice({ ...choice, optionId: o.id })} /> {o.name} · {money(o.totals.total)}</label>)}
    {addOns.map((a: Rec) => <label key={a.id} className="check-line"><input type="checkbox" checked={choice.addOnIds.includes(a.id)} onChange={e => setChoice({ ...choice, addOnIds: e.target.checked ? [...choice.addOnIds, a.id] : choice.addOnIds.filter(x => x !== a.id) })} /> Add-on: {a.name}</label>)}
  </fieldset>
}

/** Save a revision's options and add-ons as a template: price-book lines follow the price book, custom lines keep their price. */
export function SaveTemplate({ quote, rev, run }: { quote: Rec; rev: Rec; run: Run }) {
  const [name, setName] = useState(quote.title)
  const { error, act } = useAction()
  const lines = (list: Rec[]) => list.map(l => l.serviceId ? { serviceId: l.serviceId, description: l.description, quantity: l.quantity } : { description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, tax: l.tax })
  const options = rev.options ?? [{ name: '', lines: rev.lines }]
  return <form className="inline-form" onSubmit={e => { e.preventDefault(); void act(run('template.save', { name, options: options.map((o: Rec) => ({ name: o.name, lines: lines(o.lines) })), addOns: (rev.addOns ?? []).map((a: Rec) => ({ name: a.name, lines: lines(a.lines) })), notes: rev.notes, terms: rev.terms })) }}>
    <Field label="Template name">{p => <input {...p} value={name} onChange={e => setName(e.target.value)} required />}</Field>
    <button type="submit">Save as template</button>
    <Problem error={error} />
  </form>
}
