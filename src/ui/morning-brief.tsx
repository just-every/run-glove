import { useEffect, useState } from 'react'
import type { Glove, Rec } from './api'

// AGENT-008: the owner's read-only morning brief. Each item opens the screen
// where a person acts on it; nothing here changes a record.
const sections: [string, string][] = [['atRisk', 'At risk today'], ['unbilled', 'Unbilled work'], ['overEstimate', 'Over their cost estimate'], ['leads', 'Leads waiting'], ['agreements', 'Agreement visits due'] ]

export function MorningBrief({ s }: { s: Glove }) {
  const [brief, setBrief] = useState<{ data: Rec | null; error: string }>({ data: null, error: '' })
  const owner = s.actor.role === 'owner'
  useEffect(() => {
    if (!owner) return
    let live = true
    fetch('/api/glove/brief', { credentials: 'same-origin', cache: 'no-store' })
      .then(async response => { const body: any = await response.json(); if (!response.ok) throw new Error(body?.error?.message ?? 'The morning brief could not load.'); return body })
      .then(data => { if (live) setBrief({ data, error: '' }) }, (error: Error) => { if (live) setBrief(b => ({ ...b, error: error.message })) })
    return () => { live = false }
  }, [s.version, owner])
  if (!owner) return null
  const d = brief.data
  return <section className="panel" aria-labelledby="brief-title"><h2 id="brief-title">Morning brief</h2>
    {brief.error && <div className="problem" role="alert"><strong>{brief.error}</strong></div>}
    {d && <><p className="muted">Prepared by {d.preparedBy}; read only. Each item opens the screen where you act.</p>
      {sections.map(([key, title]) => <section key={key} aria-label={title}><h3>{title}</h3>
        {d.sections[key].length ? <ul className="rows">{d.sections[key].map((x: Rec) => <li key={x.id}><span>{x.text}{x.agreementHref && <> · <a href={x.agreementHref}>View agreement</a></>}</span><a href={x.action.href}>{x.action.label}</a></li>)}</ul> : <p className="muted">Nothing here.</p>}
      </section>)}
      {d.emailed?.enabled && <p className="muted" role="status">Morning email for {d.emailed.date}: {d.emailed.text}.{d.emailed.next ? ` ${d.emailed.next}` : ''}</p>}
      {d.notTracked.map((note: string) => <p key={note} className="muted">{note}</p>)}</>}
  </section>
}
