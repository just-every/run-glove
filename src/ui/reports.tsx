import { useEffect, useState } from 'react'
import { NecTotals } from './subcontract'
import { today, type Glove, type Rec } from './api'
import { Empty, Field, money } from './controls'

// Job, revenue, technician, lead, quote, margin and tax reports (REPORT-002):
// one report for a period with its one filter, as a table and a CSV download
// of the same figures from GET /api/glove/reports/<kind>.(json|csv).

const kinds = [['revenue', 'Revenue'], ['technicians', 'Technicians'], ['sources', 'Lead sources'], ['quotes', 'Quote win rate'], ['margins', 'Job margins'], ['tax', 'Sales tax']] as const
const filterOf: Record<string, 'jobType' | 'technicianId' | 'source' | null> = { revenue: 'jobType', technicians: 'technicianId', sources: 'source', quotes: 'source', margins: 'jobType', tax: null }
const pct = (v: string | null) => v === null ? '—' : `${v}%`

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return <div className="table-wrap"><table className="table"><thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j ? 'num' : undefined}>{c}</td>)}</tr>)}</tbody></table></div>
}

function Figures({ r }: { r: Rec }) {
  switch (r.kind) {
    case 'revenue': return <Table head={['Month, job type or branch', 'Invoices', 'Revenue before tax']} rows={[...r.byMonth.map((x: Rec) => [x.month, x.invoices, money(x.revenue)]), ...r.byJobType.map((x: Rec) => [x.type, x.invoices, money(x.revenue)]), ...r.byBranch.map((x: Rec) => [x.branch, x.invoices, money(x.revenue)]), ['All', r.total.invoices, money(r.total.revenue)]]} />
    case 'technicians': return <Table head={['Technician', 'Revenue', 'Visits completed', 'Callbacks', 'Callback rate', 'Hours']} rows={r.technicians.map((x: Rec) => [x.technician, money(x.revenue), x.visitsCompleted, x.callbacks, pct(x.callbackRate), x.hours])} />
    case 'sources': return <Table head={['Source', 'Requests', 'Won', 'Conversion', 'Won value', 'Invoiced']} rows={[...r.sources.map((x: Rec) => [x.source, x.requests, x.won, pct(x.conversion), money(x.wonValue), money(x.invoiced)]), ['All', r.total.requests, r.total.won, pct(r.total.conversion), money(r.total.wonValue), money(r.total.invoiced)]]} />
    case 'quotes': return <Table head={['Answered', 'Won', 'Lost', 'Win rate', 'Won value']} rows={[[r.answered, r.won, r.lost, pct(r.winRate), money(r.wonValue)]]} />
    case 'margins': return <Table head={['Job type', 'Jobs', 'Revenue', 'Estimated cost', 'Actual cost', 'Estimated margin', 'Actual margin']} rows={[...r.byJobType.map((x: Rec) => [x.type, x.jobs, money(x.revenue), money(x.estimatedCost), money(x.actualCost), pct(x.estimatedMargin), pct(x.actualMargin)]), ['All', r.total.jobs, money(r.total.revenue), money(r.total.estimatedCost), money(r.total.actualCost), pct(r.total.estimatedMargin), pct(r.total.actualMargin)]]} />
    default: return <><p className="muted">Basis: {r.basis}.</p><Table head={['Jurisdiction', 'Month', 'Invoices', 'Tax']} rows={r.jurisdictions.flatMap((j: Rec) => [...j.byMonth.map((m: Rec) => [j.jurisdiction, m.month, m.invoices, money(m.tax)]), [j.jurisdiction, 'All', j.invoices, money(j.tax)]])} /></>
  }
}

export function Reports({ s }: { s: Glove }) {
  const now = today(s.business[0]?.timezone ?? 'Australia/Sydney')
  const [q, setQ] = useState({ kind: 'revenue', from: `${now.slice(0, 8)}01`, to: now, filter: '', branchId: '' })
  const [r, setR] = useState<Rec | null>(null)
  const key = filterOf[q.kind]
  const query = `from=${q.from}&to=${q.to}${q.branchId ? `&branchId=${encodeURIComponent(q.branchId)}` : ''}${key && q.filter ? `&${key}=${encodeURIComponent(q.filter)}` : ''}`
  useEffect(() => {
    let live = true
    void fetch(`/api/glove/reports/${q.kind}.json?${query}`, { credentials: 'same-origin', cache: 'no-store' }).then(x => x.ok ? x.json() as Promise<Rec> : null).then(b => { if (live) setR(b) })
    return () => { live = false }
  }, [query, q.kind, s.version])
  if (!s.actor.reads.includes('reports')) return <Empty title="Reports are the desk's">Your role does not read the business's figures.</Empty>
  const types = [...new Set(s.services.map(x => x.category || 'Uncategorized'))].sort()
  const options = key === 'jobType' ? types.map(t => [t, t]) : key === 'technicianId' ? s.technicians.map(t => [t.id, t.name]) : key === 'source' ? [...new Set(s.enquiries.map(e => e.source as string))].sort().map(x => [x, x]) : []
  return <div className="page">
    <section className="titlebar"><div><h1>Reports</h1><p className="subtitle">Local dates, both ends included</p></div></section>
    <section className="panel" aria-labelledby="report-title">
      <h2 id="report-title">{kinds.find(([k]) => k === q.kind)?.[1]}</h2>
      <div className="form-grid">
        <Field label="Report">{p => <select {...p} value={q.kind} onChange={e => setQ({ ...q, kind: e.target.value, filter: '' })}>{kinds.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}</Field>
        <Field label="From">{p => <input {...p} type="date" value={q.from} onChange={e => setQ({ ...q, from: e.target.value })} />}</Field>
        <Field label="To">{p => <input {...p} type="date" value={q.to} onChange={e => setQ({ ...q, to: e.target.value })} />}</Field>
        {s.branches.length > 0 && <Field label="Report branch">{p => <select {...p} value={q.branchId} onChange={e => setQ({ ...q, branchId: e.target.value })}><option value="">All branches</option><option value="main">Main business</option>{s.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}</Field>}
        {key && <Field label="Filter">{p => <select {...p} value={q.filter} onChange={e => setQ({ ...q, filter: e.target.value })}><option value="">All</option>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>}
      </div>
      {r ? <Figures r={r} /> : <p className="muted">Loading…</p>}
      <p><a href={`/api/glove/reports/${q.kind}.csv?${query}`} download>Download CSV</a></p>
    </section>
    <NecTotals s={s} />
  </div>
}
