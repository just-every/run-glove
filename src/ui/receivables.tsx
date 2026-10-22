import { useEffect, useState } from 'react'
import { today, type Glove, type Rec } from './api'
import { Empty, Field, money } from './controls'

const labels = [['current', 'Current'], ['1-30', '1–30 days'], ['31-60', '31–60 days'], ['61-90', '61–90 days'], ['over90', 'Over 90 days']] as const
export function Receivables({ s }: { s: Glove }) {
  const [asOf, setAsOf] = useState(today(s.business[0]?.timezone ?? 'America/Chicago'))
  const [branch, setBranch] = useState(''), [report, setReport] = useState<Rec | null>(null), [error, setError] = useState('')
  const query = `asOf=${asOf}${branch ? `&branchId=${encodeURIComponent(branch)}` : ''}`
  useEffect(() => {
    let live = true; setReport(null); setError('')
    void fetch(`/api/glove/reports/receivables.json?${query}`, { credentials: 'same-origin', cache: 'no-store' }).then(async r => {
      const data = await r.json() as Rec
      if (!r.ok) throw new Error(data.error?.message ?? 'Receivables could not load.')
      if (live) setReport(data)
    }).catch(e => { if (live) setError(e.message) })
    return () => { live = false }
  }, [query, s.version])
  return <section className="panel" aria-labelledby="aging-title">
    <h2 id="aging-title">Receivables aging</h2>
    <div className="form-grid">
      <Field label="Aging as of">{p => <input {...p} type="date" value={asOf} onChange={e => setAsOf(e.target.value)} required />}</Field>
      {s.branches.length > 0 && <Field label="Aging branch">{p => <select {...p} value={branch} onChange={e => setBranch(e.target.value)}><option value="">All branches</option><option value="main">Main business</option>{s.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}</Field>}
    </div>
    <p className="muted">No payments recorded yet. Balances are approved invoice totals and imported opening balances. Imported balances are not new sales. No reminders scheduled.</p>
    {error && <p role="alert" className="problem">{error}</p>}
    {!report && !error && <p role="status">Loading receivables…</p>}
    {report?.totals.map((total: Rec) => <div key={total.currency} aria-label={`${total.currency} aging totals`}><h3>{total.currency} · {money(total.total)} open</h3><dl className="form-grid">{labels.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{money(total.buckets[key])}</dd></div>)}</dl></div>)}
    {report?.customers.length === 0 && <Empty title="No open approved invoices" />}
    {report?.customers.map((c: Rec) => <section key={`${c.customerId}-${c.currency}`} aria-label={`Aging for ${c.customer}`}>
      <h3>{c.customer} · {c.currency} {money(c.total)}</h3>
      <ul className="rows">{c.invoices.map((i: Rec) => <li key={i.id}><div><a href={i.href}>{i.number}</a> · {money(i.balance)}<p>Due {i.dueOn} · {labels.find(([key]) => key === i.bucket)?.[1]}{i.daysPastDue ? ` (${i.daysPastDue} days past due)` : ''}</p><p className="muted">{i.reminderState}{i.basis !== 'terms frozen at first approval' ? ` · ${i.basis}` : ''}</p></div></li>)}</ul>
    </section>)}
    {report && <p><a href={`/api/glove/reports/receivables.csv?${query}`} download>Download aging CSV</a></p>}
  </section>
}
