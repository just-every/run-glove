import { useState } from 'react'
import { today, type Glove, type Rec, type Run } from './api'
import { Field, Problem, money, useAction } from './controls'
import { can } from './roles'

// DISP-007, DISP-013, DISP-014 crews and subcontractors: the owner names crews (booked, moved and
// canceled as one on the dispatch board), marks a technician record as a 1099
// payee (name and the TIN's last 4 digits only), agrees an amount on each of
// their visits, and the owner and office download a year's 1099-NEC totals.

export function Payee({ s, t, run }: { s: Glove; t: Rec; run: Run }) {
  const [v, setV] = useState({ payeeName: t.subcontractor?.payeeName ?? '', tinLast4: t.subcontractor?.tinLast4 ?? '' })
  const [open, setOpen] = useState(false)
  const { error, act } = useAction()
  if (!can(s.actor, 'technician.save')) return t.subcontractor ? <p className="muted">Subcontractor · 1099 payee {t.subcontractor.payeeName}</p> : null
  const save = (subcontractor: object | null) => act(run('technician.save', { id: t.id, version: t.version, name: t.name, operatorId: t.operatorId ?? undefined, active: t.active, subcontractor }), () => setOpen(false))
  return <>
    {t.subcontractor && <p className="muted">Subcontractor · 1099 payee {t.subcontractor.payeeName} · TIN ending {t.subcontractor.tinLast4}</p>}
    {!open ? <button type="button" className="quiet" onClick={() => setOpen(true)}>{t.subcontractor ? 'Edit 1099 payee' : 'Mark as subcontractor'}</button>
      : <form onSubmit={e => { e.preventDefault(); void save(v) }} aria-label={`1099 payee for ${t.name}`}>
        <div className="form-grid">
          <Field label="1099 payee name">{p => <input {...p} value={v.payeeName} onChange={e => setV({ ...v, payeeName: e.target.value })} required />}</Field>
          <Field label="TIN, last 4 digits" hint="Glove never keeps a full TIN.">{p => <input {...p} inputMode="numeric" pattern="\d{4}" maxLength={4} value={v.tinLast4} onChange={e => setV({ ...v, tinLast4: e.target.value })} required />}</Field>
        </div>
        <Problem error={error} />
        <div className="actions"><button type="submit">Save payee</button>{t.subcontractor && <button type="button" className="quiet" onClick={() => void save(null)}>Not a subcontractor</button>}<button type="button" className="quiet" onClick={() => setOpen(false)}>Cancel</button></div>
      </form>}
  </>
}

export function AgreedAmount({ s, visit, run }: { s: Glove; visit: Rec; run: Run }) {
  const tech = s.technicians.find(t => t.id === visit.technicianId)
  const [amount, setAmount] = useState(visit.agreed?.amount ?? '')
  const { error, act } = useAction()
  if (!tech?.subcontractor || !can(s.actor, 'visit.agree') || visit.status === 'cancelled') return null
  return <form className="inline-form" onSubmit={e => { e.preventDefault(); void act(run('visit.agree', { visitId: visit.id, version: visit.version, amount })) }}>
    <Field label={`Agreed with ${tech.name}`} hint={visit.agreed ? `Now ${money(visit.agreed.amount)}` : 'Counts toward their 1099 totals once the visit is completed.'}>{p => <input {...p} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} required />}</Field>
    <button type="submit">Save amount</button>
    <Problem error={error} />
  </form>
}

export function NecTotals({ s }: { s: Glove }) {
  const [year, setYear] = useState(today(s.business[0]?.timezone ?? 'UTC').slice(0, 4))
  if (!s.actor.reads.includes('export') || !s.technicians.some(t => t.subcontractor)) return null
  return <section className="panel" aria-labelledby="nec-title">
    <h2 id="nec-title">Subcontractor 1099-NEC totals</h2>
    <p className="muted">Totals for your filing, not a filed 1099: each subcontractor's agreed amounts on visits completed in the year, flagged at $600 or more.</p>
    <div className="form-grid"><Field label="Year">{p => <input {...p} inputMode="numeric" value={year} onChange={e => setYear(e.target.value)} />}</Field></div>
    <p><a href={`/api/glove/reports/1099.csv?year=${encodeURIComponent(year)}`} download>Download 1099-NEC totals CSV</a></p>
  </section>
}

export function Crews({ s, run }: { s: Glove; run: Run }) {
  const [name, setName] = useState(''), [members, setMembers] = useState<string[]>([])
  const { error, act } = useAction()
  const crews = s.crews ?? []
  if (!can(s.actor, 'crew.save') && !crews.length) return null
  const nameOf = (id: string) => s.technicians.find(t => t.id === id)?.name ?? 'Removed'
  return <section className="panel" aria-labelledby="crews-title">
    <h2 id="crews-title">Crews</h2>
    <ul className="rows">{crews.map(c => <li key={c.id}><div><strong>{c.name}</strong><p className="muted">{c.memberIds.map(nameOf).join(', ')}</p></div></li>)}</ul>
    {can(s.actor, 'crew.save') && <form onSubmit={e => { e.preventDefault(); void act(run('crew.save', { name, memberIds: members }), () => { setName(''); setMembers([]) }) }}>
      <h3>Add a crew</h3>
      <Field label="Crew name">{p => <input {...p} value={name} onChange={e => setName(e.target.value)} required />}</Field>
      <fieldset><legend>Members</legend>{s.technicians.filter(t => t.active).map(t => <label key={t.id} className="check-line"><input type="checkbox" checked={members.includes(t.id)} onChange={e => setMembers(e.target.checked ? [...members, t.id] : members.filter(x => x !== t.id))} /> {t.name}</label>)}</fieldset>
      <Problem error={error} />
      <div className="actions"><button type="submit">Save crew</button></div>
    </form>}
  </section>
}
