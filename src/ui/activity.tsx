import { roleName, when, type Glove } from './api'
import { Badge, Empty } from './controls'

// Everything recorded, newest first, and every human decision on prepared work.
export function Activity({ s }: { s: Glove }) {
  const zone = s.business[0]?.timezone ?? 'Australia/Sydney'
  return <div className="page">
    <section className="titlebar"><div><h1>Activity</h1><p className="subtitle">Who did what, and who approved it</p></div>{s.actor.reads.includes('export') ? <div className="date-actions"><a className="button" href="/api/glove/export" download="glove-business.json">Download business export</a></div> : null}</section>
    <div className="two-col">
      <section className="panel"><h2>Timeline</h2>
        {!s.events.length ? <Empty title="Nothing recorded yet" /> : <ol className="timeline-list">{s.events.map(e => <li key={e.id}><time>{when(e.at, zone)}</time> <span>{e.summary}</span> <span className="muted">— {e.actorName} ({roleName(e.actorRole, s.roles)})</span></li>)}</ol>}
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
