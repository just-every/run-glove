import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Badge, Empty, Field, Problem, money, useAction } from './controls'
import { can } from './roles'
import { shrink } from './photos'

// MONEY-003 on the Team screen: services, materials and flat-rate tasks with
// their cost, fixed or category-markup price, supplier part numbers, the
// customer's description, images and checklists; category markups, bulk
// price changes, and the price book as CSV.

const blank = { code: '', name: '', kind: 'service', category: '', unit: 'each', unitCost: '', pricing: 'fixed', unitPrice: '', tax: 'TAXABLE', description: '', parts: '', components: '', checklist: '', requiredSkills: '' }
const list = (v: string) => v.split(/[;\n]/).map(x => x.trim()).filter(Boolean)

export function PriceBook({ s, run }: { s: Glove; run: Run }) {
  const categories: Rec[] = s.business[0]?.priceCategories ?? []
  const owner = can(s.actor, 'service.save')
  const code = (id: string) => s.services.find(x => x.id === id)?.code ?? id
  return <section className="panel"><h2>Price book</h2>
    {s.actor.reads.includes('export') && <div className="actions"><a className="button" href="/api/glove/pricebook.csv" download>Export price book CSV</a></div>}
    {!s.services.length ? <Empty title="No services yet">Add the services, materials and flat-rate tasks you charge for.</Empty> : <table className="table"><thead><tr><th>Code</th><th>Item</th><th>Cost</th><th>Price before tax</th><th>Inside or checklist</th></tr></thead><tbody>{s.services.map(x => <tr key={x.id}>
      <td className="nowrap">{x.code}</td>
      <td>{x.name} {x.kind && x.kind !== 'service' && <Badge tone="blue">{x.kind === 'task' ? 'Flat rate' : 'Material'}</Badge>}{x.category && <span className="muted"> · {x.category}</span>}{x.parts?.length > 0 && <span className="muted"> · {x.parts.map((p: Rec) => `${p.supplier} ${p.partNumber}`).join(', ')}</span>}</td>
      <td data-label="Cost">{x.unitCost !== undefined ? money(x.unitCost) : '—'}</td>
      <td data-label="Price before tax">{money(x.unitPrice)} / {x.unit}{x.pricing === 'markup' && <span className="muted"> (markup)</span>}</td>
      <td data-label="Inside or checklist">{x.components?.length ? x.components.map((c: Rec) => `${code(c.serviceId)} × ${c.quantity}`).join(', ') : x.checklist.length ? `${x.checklist.length} checklist items` : '—'}</td>
    </tr>)}</tbody></table>}
    {owner && <ItemForm s={s} run={run} categories={categories} />}
    {owner && <Categories run={run} categories={categories} />}
    {can(s.actor, 'pricebook.import') && <ImportCsv run={run} />}
  </section>
}

function ItemForm({ s, run, categories }: { s: Glove; run: Run; categories: Rec[] }) {
  const [form, setForm] = useState(blank)
  const [image, setImage] = useState<{ mediaType: string; base64: string } | null>(null)
  const { error, act } = useAction()
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const byCode = (c: string) => s.services.find(x => x.code === c)?.id ?? c
  const payload = () => ({
    code: form.code, name: form.name, kind: form.kind, category: form.category, unit: form.unit, tax: form.tax, pricing: form.pricing, description: form.description,
    ...(form.kind === 'task' ? { components: list(form.components).map(l => { const [c = '', q = '1'] = l.split(/\s+x\s+/i); return { serviceId: byCode(c.trim()), quantity: q.trim() } }) } : { unitCost: form.unitCost || '0' }),
    ...(form.pricing === 'fixed' ? { unitPrice: form.unitPrice } : {}),
    parts: list(form.parts).map(l => { const i = l.indexOf(':'); return { supplier: i < 0 ? '' : l.slice(0, i).trim(), partNumber: l.slice(i + 1).trim() } }),
    requiredSkills: form.requiredSkills.split(',').map(x => x.trim()).filter(Boolean),
    checklist: form.checklist.split('\n').map(l => l.trim()).filter(Boolean).map(l => ({ label: l.replace(/^\*\s*/, ''), required: l.startsWith('*') })),
    ...(image ? { image } : {}),
  })
  return <form onSubmit={e => { e.preventDefault(); void act(run('service.save', payload()), () => { setForm(blank); setImage(null) }) }}>
    <h3>Add to the price book</h3>
    <div className="form-grid">
      <Field label="Code">{p => <input {...p} value={form.code} onChange={set('code')} required />}</Field>
      <Field label="Name">{p => <input {...p} value={form.name} onChange={set('name')} required />}</Field>
      <Field label="Kind">{p => <select {...p} value={form.kind} onChange={set('kind')}><option value="service">Service</option><option value="material">Material</option><option value="task">Flat-rate task</option></select>}</Field>
      <Field label="Category (optional)">{p => <><input {...p} list="price-categories" value={form.category} onChange={set('category')} /><datalist id="price-categories">{categories.map(c => <option key={c.name} value={c.name} />)}</datalist></>}</Field>
      <Field label="Unit">{p => <input {...p} value={form.unit} onChange={set('unit')} />}</Field>
      {form.kind !== 'task' && <Field label="Unit cost">{p => <input {...p} inputMode="decimal" value={form.unitCost} onChange={set('unitCost')} />}</Field>}
      <Field label="Pricing">{p => <select {...p} value={form.pricing} onChange={set('pricing')}><option value="fixed">Fixed price</option><option value="markup">Category markup on cost</option></select>}</Field>
      {form.pricing === 'fixed' && <Field label="Price before tax">{p => <input {...p} inputMode="decimal" value={form.unitPrice} onChange={set('unitPrice')} required />}</Field>}
      <Field label="Tax treatment">{p => <select {...p} value={form.tax} onChange={set('tax')}><option value="TAXABLE">{s.business[0]?.currency === 'AUD' ? 'GST (10%)' : 'Taxable (site jurisdiction)'}</option><option value="FREE">Not taxable</option></select>}</Field>
      <Field label="Required skills (optional)" hint="Comma-separated, such as gas">{p => <input {...p} value={form.requiredSkills} onChange={set('requiredSkills')} />}</Field>
      <Field label="Image (optional)">{p => <input {...p} type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; setImage(f ? await shrink(f) : null) }} />}</Field>
    </div>
    <Field label="Description the customer sees (optional)">{p => <textarea {...p} value={form.description} onChange={set('description')} />}</Field>
    <Field label="Supplier part numbers (optional)" hint="One per line: Ferguson: FG-1001">{p => <textarea {...p} value={form.parts} onChange={set('parts')} />}</Field>
    {form.kind === 'task' && <Field label="What the task includes" hint="One per line: LAB-HR x 1.5">{p => <textarea {...p} value={form.components} onChange={set('components')} required />}</Field>}
    <Field label="Checklist, one item per line" hint="Start a line with * to make it required before the job can be completed.">{p => <textarea {...p} value={form.checklist} onChange={set('checklist')} />}</Field>
    <Problem error={error} />
    <div className="actions"><button type="submit">Add to price book</button></div>
  </form>
}

function Categories({ run, categories }: { run: Run; categories: Rec[] }) {
  const [markup, setMarkup] = useState({ name: '', markupPercent: '' })
  const [bulk, setBulk] = useState({ category: '', percent: '' })
  const { error, act } = useAction()
  return <div>
    <h3>Categories and bulk prices</h3>
    {categories.length > 0 && <p className="muted">{categories.map(c => `${c.name}: ${c.markupPercent}% on cost`).join(' · ')}</p>}
    <form className="inline-form" onSubmit={e => { e.preventDefault(); void act(run('pricebook.category', markup), () => setMarkup({ name: '', markupPercent: '' })) }}>
      <Field label="Category">{p => <input {...p} value={markup.name} onChange={e => setMarkup({ ...markup, name: e.target.value })} required />}</Field>
      <Field label="Markup % on cost">{p => <input {...p} inputMode="decimal" value={markup.markupPercent} onChange={e => setMarkup({ ...markup, markupPercent: e.target.value })} required />}</Field>
      <button type="submit">Set markup</button>
    </form>
    <form className="inline-form" onSubmit={e => { e.preventDefault(); void act(run('pricebook.adjust', bulk), () => setBulk({ category: '', percent: '' })) }}>
      <Field label="Change fixed prices in category">{p => <input {...p} value={bulk.category} onChange={e => setBulk({ ...bulk, category: e.target.value })} required />}</Field>
      <Field label="By %" hint="Negative lowers">{p => <input {...p} inputMode="decimal" value={bulk.percent} onChange={e => setBulk({ ...bulk, percent: e.target.value })} required />}</Field>
      <button type="submit">Change prices</button>
    </form>
    <Problem error={error} />
  </div>
}

function ImportCsv({ run }: { run: Run }) {
  const [file, setFile] = useState<{ name: string; text: string } | null>(null)
  const [preview, setPreview] = useState<Rec | null>(null)
  const { error, act } = useAction()
  return <form aria-label="Import a price book CSV" onSubmit={e => { e.preventDefault(); if (file) void act(run('pricebook.import', { file, ...(preview ? { fingerprint: preview.fingerprint } : {}) }), r => { if (r.committed) { setFile(null); setPreview(null) } else setPreview(r.preview) }) }}>
    <h3>Import a price book CSV</h3>
    <p className="muted">Columns headed like the export (Code, Name, Kind, Category, Category markup %, Unit, Unit cost, Pricing, Price, Tax, Customer description, Supplier part numbers, Task contents, Archived). Rows match by Code. Preview first; nothing changes until you commit it.</p>
    <Field label="Price book CSV">{p => <input {...p} type="file" accept=".csv,text/csv" onChange={async e => { const f = e.target.files?.[0]; setPreview(null); setFile(f ? { name: f.name, text: await f.text() } : null) }} />}</Field>
    {preview && <><p>{preview.rows.total} rows: {preview.rows.new} new, {preview.rows.updated} updated, {preview.rows.unchanged} unchanged, {preview.rows.rejected} rejected.{preview.categories.length > 0 && ` Markups: ${preview.categories.map((c: Rec) => `${c.name} ${c.markupPercent}%`).join(', ')}.`}</p>
      {preview.rejected.length > 0 && <ul>{preview.rejected.map((r: Rec) => <li key={r.row}>Row {r.row}: {r.reason}</li>)}</ul>}
      {preview.changes.some((c: Rec) => c.status === 'updated') && <details className="details"><summary>Updated items</summary><ul>{preview.changes.filter((c: Rec) => c.status === 'updated').map((c: Rec) => <li key={c.code}>{c.code}: {c.changes.join(', ')}</li>)}</ul></details>}</>}
    <Problem error={error} />
    <div className="actions"><button className={preview ? 'primary' : undefined} type="submit" disabled={!file}>{preview ? 'Commit exactly this preview' : 'Preview'}</button></div>
  </form>
}
