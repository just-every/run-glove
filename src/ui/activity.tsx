import { useRef, useState } from 'react'
import { roleName, when, type Glove, type Rec } from './api'
import { Badge, Empty } from './controls'

// Everything recorded, newest first, and every human decision on prepared work.
export function Activity({ s }: { s: Glove }) {
  const scope = `${s.actor.id}:${s.version}`, current = useRef(scope); current.current = scope
  const [cache, setCache] = useState<{ scope: string; rows: Rec[]; next: number | null }>({ scope: '', rows: [], next: null })
  const [loading, setLoading] = useState(false), [error, setError] = useState('')
  const seen = new Map([...s.events, ...(cache.scope === scope ? cache.rows : [])].map(e => [e.id, e]))
  const events = [...seen.values()].sort((a, b) => b.sequence - a.sequence)
  const next = cache.scope === scope ? cache.next : s.events.at(-1)?.sequence ?? null
  async function older() {
    if (!next || loading) return
    setLoading(true); setError('')
    try {
      const r = await fetch(`/api/glove/activity?before=${next}`, { credentials: 'same-origin', cache: 'no-store' })
      const body = await r.json() as { events: Rec[]; next: number | null; error?: { message: string } }
      if (!r.ok) throw new Error(body.error?.message ?? 'Earlier activity could not load.')
      if (current.current === scope) setCache({ scope, rows: [...events, ...body.events], next: body.next })
    } catch (e) { if (current.current === scope) setError(e instanceof Error ? e.message : 'Earlier activity could not load.') }
    finally { setLoading(false) }
  }
  const zone = s.business[0]?.timezone ?? 'America/Chicago'
  return <div className="page">
    <section className="titlebar"><div><h1>Activity</h1><p className="subtitle">Who did what, and who approved it</p></div>{s.actor.reads.includes('export') ? <div className="date-actions"><a className="button" href="/api/glove/export" download="glove-business.json">Download business export</a></div> : null}</section>
    <div className="two-col">
      <section className="panel"><h2>Timeline</h2>
        {!events.length ? <Empty title="Nothing recorded yet" /> : <ol className="timeline-list">{events.map(e => <li key={e.id}><time>{when(e.at, zone)}</time> <span>{e.summary}</span> <span className="muted">— {e.actorName} ({roleName(e.actorRole, s.roles)})</span>{e.recordChanges?.length > 0 && <details className="audit-changes"><summary>Changed records</summary><ul>{e.recordChanges.map((r: any) => <li key={`${r.kind}:${r.id}`}>{r.kind} · {r.id} · version {r.fromVersion ?? 'new'} → {r.toVersion ?? 'removed'}<br />Fields: {r.fields.join(', ')}</li>)}</ul></details>}</li>)}</ol>}
        {next !== null && next > 1 && <button disabled={loading} onClick={() => void older()}>{loading ? 'Loading earlier activity…' : 'Load earlier activity'}</button>}
        {error && <p className="problem" role="alert">{error}</p>}
      </section>
      <section className="panel"><h2>Approvals</h2>
        {!s.approvals.length ? <Empty title="No approvals yet">Quote prices, invoices and agent proposals appear here once a person decides them.</Empty> :
          <table className="table"><thead><tr><th>What</th><th>Prepared by</th><th>Decided by</th><th>When</th></tr></thead><tbody>
            {[...s.approvals].reverse().map(a => <tr key={a.id}><td>{a.subjectLabel}</td><td>{a.preparedBy.name} ({roleName(a.preparedBy.role, s.roles)})</td><td><Badge tone={a.decision === 'approved' ? 'green' : 'red'}>{a.decision}</Badge> {a.approvedBy.name}{a.note ? ` — ${a.note}` : ''}</td><td>{when(a.createdAt, zone)}</td></tr>)}
          </tbody></table>}
      </section>
    </div>
  </div>
}
