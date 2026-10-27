import { useEffect, useState } from 'react'
import { shiftDate, today, type Glove, type Rec, type Run } from './api'
import { Field } from './controls'

export function DispatchReadiness({ s, run, branchId }: { s: Glove; run: Run; branchId: string }) {
  const [date, setDate] = useState(shiftDate(today(s.business[0]?.timezone ?? 'America/Chicago'), 1))
  const [board, setBoard] = useState<any>(null), [error, setError] = useState(''), [refresh, setRefresh] = useState(0), [busy, setBusy] = useState(false)
  const permitted = ['owner', 'dispatcher', 'office', 'agent'].includes(s.actor.role)
  useEffect(() => {
    setBoard(null)
    if (!permitted) return
    let live = true
    const query = new URLSearchParams({ date, branchId: branchId || 'main' })
    fetch(`/api/glove/readiness?${query}`, { credentials: 'same-origin', cache: 'no-store' }).then(async r => {
      const b = await r.json() as any
      if (!r.ok) throw new Error(b.error?.message ?? 'Readiness could not load.')
      return b
    }).then(b => { if (live) { setBoard(b); setError('') } }, e => { if (live) setError(e.message) })
    return () => { live = false }
  }, [s.version, date, branchId, refresh, permitted])
  if (!permitted) return null
  async function prepare() {
    setBusy(true)
    try {
      const result = await run('readiness.prepare', { date, branchId: branchId || 'main', fingerprint: board.fingerprint })
      if (!result.ok) setError(result.error.message)
      else { setError(''); setRefresh(n => n + 1) }
    } finally { setBusy(false) }
  }
  return <section className="panel" aria-labelledby="readiness-title">
    <header><h2 id="readiness-title">Next-day readiness</h2></header>
    <p>Review parts and receipt evidence before dispatch. Customer access remains unknown.</p>
    <Field label="Readiness date">{p => <input {...p} type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} />}</Field>
    <div className="actions"><button onClick={() => setRefresh(n => n + 1)}>Refresh evidence</button><button disabled={!board?.rows.length || busy} onClick={() => void prepare()}>Prepare internal proposals</button></div>
    {error && <p className="problem" role="alert">{error}</p>}
    {board && <>
      <p role="status">{board.rows.length} visits · Overall readiness unconfirmed</p>
      <ul className="rows" aria-label="Visit readiness">{board.rows.map((r: Rec) => <li key={r.visitId}>
        <div><a href={`#jobs/${r.jobId}`}><strong>{r.number} · {r.title}</strong></a><p>{r.date} at {r.start} · {r.partsStatus} · {r.orderStatus}</p>
          <p>Access unknown · Readiness unconfirmed · Preparation {r.preparation}</p>
          {r.parts.map((p: Rec) => <p key={p.serviceId}>{p.name}: needs {p.needed}, van {p.onVan}, allocated through this job {p.allocatedThrough}; {p.onBoard ? 'allocated' : 'short after earlier visits'}</p>)}
          {r.orders.map((o: Rec) => <p key={o.id}>{o.number}: {o.lines.map((l: Rec) => `${l.received} of ${l.ordered} received`).join(', ')} · {o.receipts.length} recorded receipts</p>)}
          {r.preparedBy && <p>Prepared by {r.preparedBy.name} · {new Date(r.preparedAt).toLocaleString('en-US', { timeZone: s.business[0]?.timezone ?? 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })}</p>}</div>
      </li>)}</ul>
      <h3>Dispatcher proposals</h3>
      <p>{board.advisory}</p>
      <ul className="rows" aria-label="Internal fix proposals">{board.proposals.map((p: Rec) => <li key={p.kind}><div><strong>{p.title}</strong><p>Advisory only · {board.rows.every((r: Rec) => r.preparation === 'current') ? 'Prepared from current evidence' : 'Refresh and prepare before review'}</p>
        <ul>{p.sources.map((source: Rec) => <li key={source.visitId}><a href={`#jobs/${source.jobId}`}>{board.rows.find((r: Rec) => r.visitId === source.visitId)?.number}</a>{source.orderIds?.length ? ` · Orders: ${source.orderIds.map((id: string) => board.rows.flatMap((r: Rec) => r.orders).find((o: Rec) => o.id === id)?.number ?? 'Order unavailable').join(', ')}` : ''}</li>)}</ul></div></li>)}</ul>
    </>}
  </section>
}
