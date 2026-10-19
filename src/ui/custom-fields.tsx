import { useState } from 'react'
import { type Glove, type Rec, type Run } from './api'
import { Badge, Field, Problem, useAction } from './controls'
import { can } from './roles'

// Custom fields, customer tags and segments (CUST-004): the owner's field
// definitions, the values on a customer, site, job or unit, a customer's tags,
// and saved segments with their members and CSV.

type Kind = 'customers' | 'sites' | 'jobs' | 'equipment'
const kindLabel: Record<Kind, string> = { customers: 'Customers', sites: 'Sites', jobs: 'Jobs', equipment: 'Equipment' }

function Input({ field, value, set, id }: { field: Rec; value: string; set: (v: string) => void; id: string }) {
  if (field.type === 'choice' || field.type === 'yes/no') return <select id={id} value={value} onChange={e => set(e.target.value)}><option value="">—</option>{(field.type === 'choice' ? field.choices : ['yes', 'no']).map((c: string) => <option key={c} value={c}>{c}</option>)}</select>
  return <input id={id} type={field.type === 'date' ? 'date' : 'text'} inputMode={field.type === 'number' ? 'decimal' : undefined} value={value} onChange={e => set(e.target.value)} />
}

/** The custom values on one record, editable by the desk. */
export function CustomValues({ s, run, kind, row, title }: { s: Glove; run: Run; kind: Kind; row: Rec; title: string }) {
  const fields = (s.customFields ?? []).filter(f => f.record === kind && !f.archived)
  const [v, setV] = useState<Record<string, string>>(Object.fromEntries(fields.map(f => [f.id, row.custom?.[f.id] ?? ''])))
  const { error, act } = useAction()
  if (!fields.length) return null
  const editable = can(s.actor, 'record.custom')
  return <form className="custom-values" aria-label={title} onSubmit={e => { e.preventDefault(); void act(run('record.custom', { record: kind, id: row.id, version: row.version, values: v })) }}>
    <div className="form-grid">{fields.map(f => <Field key={f.id} label={f.label}>{p => editable ? <Input id={p.id} field={f} value={v[f.id] ?? ''} set={x => setV({ ...v, [f.id]: x })} /> : <span id={p.id}>{row.custom?.[f.id] ?? '—'}</span>}</Field>)}</div>
    <Problem error={error} />
    {editable && <div className="actions"><button type="submit">Save {title.toLowerCase()}</button></div>}
  </form>
}

export function CustomerTags({ s, run, customer }: { s: Glove; run: Run; customer: Rec }) {
  const [text, setText] = useState((customer.tags ?? []).join(', '))
  const { error, act } = useAction()
  if (!can(s.actor, 'customer.tags')) return (customer.tags ?? []).length ? <p>{customer.tags.map((t: string) => <Badge key={t} tone="grey">{t}</Badge>)}</p> : null
  return <form className="panel" aria-label="Tags" onSubmit={e => { e.preventDefault(); void act(run('customer.tags', { customerId: customer.id, version: customer.version, tags: text.split(',').map((t: string) => t.trim()).filter(Boolean) })) }}>
    <Field label="Tags (comma separated)">{p => <input {...p} value={text} onChange={e => setText(e.target.value)} />}</Field>
    <Problem error={error} />
    <div className="actions"><button type="submit">Save tags</button></div>
  </form>
}

export function FieldSettings({ s, run }: { s: Glove; run: Run }) {
  const [v, setV] = useState({ record: 'customers', label: '', type: 'text', choices: '' })
  const { error, act } = useAction()
  if (!can(s.actor, 'field.save')) return null
  return <form className="panel" aria-labelledby="fields-title" onSubmit={e => { e.preventDefault(); void act(run('field.save', { record: v.record, label: v.label, type: v.type, ...(v.type === 'choice' ? { choices: v.choices.split(',').map(x => x.trim()).filter(Boolean) } : {}) }), () => setV({ ...v, label: '', choices: '' })) }}>
    <h2 id="fields-title">Custom fields</h2>
    <ul className="rows">{(s.customFields ?? []).filter(f => !f.archived).map(f => <li key={f.id}><span>{f.label}</span><span className="muted">{kindLabel[f.record as Kind]} · {f.type}{f.choices.length ? ` (${f.choices.join(', ')})` : ''}</span></li>)}</ul>
    <div className="form-grid">
      <Field label="On">{p => <select {...p} value={v.record} onChange={e => setV({ ...v, record: e.target.value })}>{Object.entries(kindLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}</Field>
      <Field label="Field name">{p => <input {...p} value={v.label} onChange={e => setV({ ...v, label: e.target.value })} required />}</Field>
      <Field label="Type">{p => <select {...p} value={v.type} onChange={e => setV({ ...v, type: e.target.value })}>{['text', 'number', 'date', 'yes/no', 'choice'].map(t => <option key={t} value={t}>{t}</option>)}</select>}</Field>
      {v.type === 'choice' && <Field label="Choices (comma separated)">{p => <input {...p} value={v.choices} onChange={e => setV({ ...v, choices: e.target.value })} required />}</Field>}
    </div>
    <Problem error={error} />
    <div className="actions"><button type="submit">Add field</button></div>
  </form>
}

function SegmentMembers({ s, run, segment }: { s: Glove; run: Run; segment: Rec }) {
  const [members, setMembers] = useState<Rec[] | null>(null)
  const push = useAction()
  const connected = (['mango', 'mailchimp'] as const).filter(p => s.business[0]?.marketing?.[p])
  const last = [...(s.pushes ?? [])].reverse().find(x => x.segmentId === segment.id)
  return <li><span><strong>{segment.name}</strong>{members && ` · ${members.length} member${members.length === 1 ? '' : 's'}: ${members.map(m => m.name).join(', ')}`}</span>
    <span><button type="button" onClick={() => void fetch(`/api/glove/segments/${segment.id}`, { credentials: 'same-origin', cache: 'no-store' }).then(r => r.ok ? r.json() as Promise<Rec> : null).then(b => setMembers(b?.members ?? []))}>Show members</button>{s.actor.reads.includes('export') && <a href={`/api/glove/segments/${segment.id}.csv`} download>CSV</a>}{can(s.actor, 'segment.push') && connected.map(p => <button key={p} type="button" onClick={() => void push.act(run('segment.push', { segmentId: segment.id, provider: p }))}>Push to {p === 'mango' ? 'Mango' : 'Mailchimp'}</button>)}</span>{last && <p className="muted">Last push to {last.provider === 'mango' ? 'Mango' : 'Mailchimp'}: {last.pushed} of {last.members} sent, none subscribed{last.skippedNoEmail ? `, ${last.skippedNoEmail} without an email` : ''}{last.skippedDoNotContact ? `, ${last.skippedDoNotContact} do not contact` : ''}{last.failed.length ? `, ${last.failed.length} refused` : ''}</p>}<Problem error={push.error} /></li>
}

export function Segments({ s, run }: { s: Glove; run: Run }) {
  const fields = (s.customFields ?? []).filter(f => ['customers', 'sites'].includes(f.record) && !f.archived)
  const [v, setV] = useState({ name: '', tagsAll: '', tagsNone: '', fieldId: '', value: '', years: '' })
  const { error, act } = useAction()
  if (!can(s.actor, 'segment.save') && !(s.segments ?? []).length) return null
  const list = (t: string) => t.split(',').map(x => x.trim()).filter(Boolean)
  const filter = { tagsAll: list(v.tagsAll), tagsNone: list(v.tagsNone), fields: v.fieldId ? [{ fieldId: v.fieldId, op: v.value ? 'is' : 'set', value: v.value }] : [], ...(v.years ? { equipmentOlderThanYears: Number(v.years) } : {}), noAgreement: true }
  return <section className="panel" aria-labelledby="segments-title"><h2 id="segments-title">Segments</h2>
    <ul className="rows">{(s.segments ?? []).map(x => <SegmentMembers key={x.id + x.version} s={s} run={run} segment={x} />)}</ul>
    {can(s.actor, 'segment.save') && <form aria-label="New segment" onSubmit={e => { e.preventDefault(); void act(run('segment.save', { name: v.name, filter }), () => setV({ name: '', tagsAll: '', tagsNone: '', fieldId: '', value: '', years: '' })) }}>
      <div className="form-grid">
        <Field label="Segment name">{p => <input {...p} value={v.name} onChange={e => setV({ ...v, name: e.target.value })} required />}</Field>
        <Field label="Has all tags">{p => <input {...p} value={v.tagsAll} onChange={e => setV({ ...v, tagsAll: e.target.value })} />}</Field>
        <Field label="Has none of the tags">{p => <input {...p} value={v.tagsNone} onChange={e => setV({ ...v, tagsNone: e.target.value })} />}</Field>
        <Field label="Field">{p => <select {...p} value={v.fieldId} onChange={e => setV({ ...v, fieldId: e.target.value })}><option value="">Any</option>{fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select>}</Field>
        {v.fieldId && <Field label="Field value (blank = any value)">{p => <input {...p} value={v.value} onChange={e => setV({ ...v, value: e.target.value })} />}</Field>}
        <Field label="Equipment older than (years)">{p => <input {...p} inputMode="numeric" value={v.years} onChange={e => setV({ ...v, years: e.target.value })} />}</Field>
      </div>
      <p className="muted">No customer has an agreement yet, so "no agreement" holds for everyone.</p>
      <Problem error={error} />
      <div className="actions"><button type="submit">Save segment</button></div>
    </form>}
  </section>
}

/** The owner connects Mango or Mailchimp; the key is kept as a secret and never shown again. */
export function MarketingConnect({ s, run }: { s: Glove; run: Run }) {
  const [v, setV] = useState({ provider: 'mango', url: '', key: '', listId: '' })
  const { error, act } = useAction()
  if (!can(s.actor, 'marketing.connect')) return null
  const m = s.business[0]?.marketing ?? {}
  return <form className="panel" aria-labelledby="marketing-title" onSubmit={e => { e.preventDefault(); void act(run('marketing.connect', v.provider === 'mango' ? { provider: 'mango', url: v.url, key: v.key } : { provider: 'mailchimp', key: v.key, listId: v.listId }), () => setV({ ...v, key: '' })) }}>
    <h2 id="marketing-title">Audiences in Mango or Mailchimp</h2>
    <p className="muted">{['mango', 'mailchimp'].map(p => m[p] ? `${p === 'mango' ? 'Mango' : 'Mailchimp'} connected by ${m[p].by}` : `${p === 'mango' ? 'Mango' : 'Mailchimp'} not connected`).join(' · ')}. A push sends a segment's names, emails and tags and never subscribes anyone.</p>
    <div className="form-grid">
      <Field label="Provider">{p => <select {...p} value={v.provider} onChange={e => setV({ ...v, provider: e.target.value })}><option value="mango">Mango</option><option value="mailchimp">Mailchimp</option></select>}</Field>
      {v.provider === 'mango' ? <Field label="Mango address">{p => <input {...p} type="url" value={v.url} onChange={e => setV({ ...v, url: e.target.value })} required />}</Field> : <Field label="Mailchimp audience ID">{p => <input {...p} value={v.listId} onChange={e => setV({ ...v, listId: e.target.value })} required />}</Field>}
      <Field label={v.provider === 'mango' ? 'Integration credential (contacts:write)' : 'API key'}>{p => <input {...p} type="password" autoComplete="off" value={v.key} onChange={e => setV({ ...v, key: e.target.value })} required />}</Field>
    </div>
    <Problem error={error} />
    <div className="actions"><button type="submit">Connect</button></div>
  </form>
}
