import { useEffect, useState, type ReactNode } from 'react'
import { dateLabel, type Glove } from './api'
import { Badge, Empty, money } from './controls'

// The owner's home (REPORT-001): today's jobs and their state, what was booked
// today, open quotes and completed jobs waiting for an invoice, from
// GET /api/glove/dashboard. Each figure links to the screen holding its records.

type Dashboard = {
  date: string
  jobs: { count: number; states: Record<'open' | 'completed' | 'invoiced', number>; list: { id: string; number: string; title: string; customer: string; status: string; visits: { id: string; start: string; end: string; technician: string; status: string }[] }[] }
  booked: { count: number; total: string; quotes: { id: string; number: string; customer: string }[] }
  openQuotes: { count: number; total: string }
  unbilled: { count: number; list: { id: string; number: string; customer: string; invoiceId: string | null }[] }
}

const tone = { open: 'gold', completed: 'green', invoiced: 'grey' } as const
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function Tile({ id, title, figure, href, children }: { id: string; title: string; figure: string; href: string; children?: ReactNode }) {
  return <section className="panel tile" aria-labelledby={id}>
    <h2 id={id}>{title}</h2>
    <p className="tile-figure"><a href={href}>{figure}</a></p>
    {children}
  </section>
}

export function Today({ s }: { s: Glove }) {
  const [board, setBoard] = useState<{ data: Dashboard | null; error: string }>({ data: null, error: '' })
  useEffect(() => {
    let live = true
    fetch('/api/glove/dashboard', { credentials: 'same-origin', cache: 'no-store' })
      .then(async response => { const body: any = await response.json(); if (!response.ok) throw new Error(body?.error?.message ?? 'Today could not load.'); return body as Dashboard })
      .then(data => { if (live) setBoard({ data, error: '' }) }, (error: Error) => { if (live) setBoard(b => ({ ...b, error: error.message })) })
    return () => { live = false }
  }, [s.version])
  const d = board.data
  return <div className="page">
    <section className="titlebar"><div><h1>Today</h1><p className="subtitle">{d ? dateLabel(d.date) : 'Your business today'}</p></div></section>
    {board.error && <div className="problem" role="alert"><strong>{board.error}</strong></div>}
    {!d ? !board.error && <p role="status">Loading today…</p> : <div className="tiles">
      <Tile id="tile-jobs" title="Today's jobs" figure={plural(d.jobs.count, 'job')} href="#jobs">
        <p className="muted">{d.jobs.states.open} open · {d.jobs.states.completed} completed · {d.jobs.states.invoiced} invoiced</p>
        {d.jobs.list.length ? <ul className="rows">{d.jobs.list.map(j => <li key={j.id}><span><a href={`#jobs/${j.id}`}>{j.number}</a> · {j.customer}<br /><span className="muted">{j.visits.map(v => `${v.start}–${v.end} ${v.technician}`).join(', ')}</span></span><Badge tone={tone[j.status as keyof typeof tone] ?? 'grey'}>{j.status}</Badge></li>)}</ul> : <Empty title="No visits today" glyph="calendar" />}
      </Tile>
      <Tile id="tile-booked" title="Booked today" figure={money(d.booked.total)} href="#quotes">
        <p className="muted">{plural(d.booked.count, 'quote')} accepted today</p>
      </Tile>
      <Tile id="tile-quotes" title="Open quotes" figure={plural(d.openQuotes.count, 'quote')} href="#quotes">
        <p className="muted">{money(d.openQuotes.total)} waiting on an answer or a price</p>
      </Tile>
      <Tile id="tile-unbilled" title="Completed, not invoiced" figure={plural(d.unbilled.count, 'job')} href="#invoices">
        {d.unbilled.list.length > 0 && <ul className="rows">{d.unbilled.list.map(j => <li key={j.id}><span><a href={`#jobs/${j.id}`}>{j.number}</a> · {j.customer}</span><span className="muted">{j.invoiceId ? 'Invoice prepared' : 'No invoice yet'}</span></li>)}</ul>}
      </Tile>
    </div>}
  </div>
}
