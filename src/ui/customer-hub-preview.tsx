import { useEffect, useRef, useState, type ReactNode } from 'react'
import { dateLabel, timeRange, type Glove, type Rec, type Run } from './api'
import { money, Problem } from './controls'
import type { Failure } from './api'

const authorityMessage = 'An Owner without branch limits must sign in to inspect this customer preview'
type Preview = {
  customer: { id: string; name: string }
  quotes: Rec[]; invoices: Rec[]; receipts: Rec[]; visits: Rec[]; reports: Rec[]; equipment: Rec[]; agreements: Rec[]
}

/** Content comes only from the restricted command, never from the desk's records. */
export function CustomerHubPreview({ s, run, customer }: { s: Glove; run: Run; customer: Rec }) {
  const [preview, setPreview] = useState<{ content: Preview; authority: string } | null>(null)
  const [attempted, setAttempted] = useState(false)
  const [error, setError] = useState<Failure | null>(null), [busy, setBusy] = useState(false)
  const generation = useRef(0)
  const allowed = s.actor.role === 'owner' && !s.actor.branch && s.actor.commands.includes('customer.hubPreview')
  const authority = JSON.stringify([s.actor.id, s.actor.role, s.actor.branch, s.actor.commands])
  const current = useRef(authority)
  current.current = authority
  useEffect(() => () => { generation.current++ }, [])
  useEffect(() => { generation.current++; setPreview(null); setBusy(false) }, [authority, customer.id, customer.erasedAt])
  const content = allowed && !customer.erasedAt && preview?.authority === authority && preview.content.customer.id === customer.id ? preview.content : null
  async function inspect() {
    const request = ++generation.current, acting = authority
    setAttempted(true); setPreview(null); setError(null); setBusy(true)
    try {
      const result = await run('customer.hubPreview', { customerId: customer.id })
      if (request !== generation.current || acting !== current.current) return
      if (result.ok) setPreview({ content: result.result, authority: acting })
      else setError(result.error)
    } finally { if (request === generation.current) setBusy(false) }
  }
  if (!allowed && !attempted) return null
  return <section className="panel" aria-label="Customer hub preview" aria-busy={busy}>
    <h2>Customer hub preview</h2>
    <p>Inspect proposed customer content. This preview grants no customer access and sends nothing.</p>
    {allowed && <button onClick={() => void inspect()} disabled={busy}>{busy ? 'Inspecting…' : 'Inspect customer preview'}</button>}
    <Problem error={!allowed ? { code: 'FORBIDDEN', message: authorityMessage } : attempted && customer.erasedAt ? { code: 'NOT_FOUND', message: 'Customer preview unavailable' } : error} />
    {content && <div aria-label={`Preview for ${content.customer.name}`} role="region">
      <h3>{content.customer.name}</h3>
      <PreviewRows title="Quotes" rows={content.quotes}>{q => <><strong>{q.number} · {q.title}</strong><p>{q.status} · Revision {q.revision}</p>
        {q.status === 'accepted' ? <><h4>Accepted work · {money(q.totals.total)}</h4><DocumentLines lines={q.lines} /></> : <QuoteOptions quote={q} />}
      </>}</PreviewRows>
      <PreviewRows title="Approved invoices" rows={content.invoices}>{i => <><strong>{i.number}</strong><p>Revision {i.revision} · {money(i.totals.total)}</p><DocumentLines lines={i.lines} /></>}</PreviewRows>
      <PreviewRows title="Confirmed payments" rows={content.receipts}>{r => <><strong>{money(r.amount)} {r.currency}</strong><p>Confirmed {new Date(r.confirmedAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p></>}</PreviewRows>
      <PreviewRows title="Visits" rows={content.visits}>{v => <><strong>{v.title}</strong><p>{dateLabel(v.date, 'short')} · {timeRange(v.start, v.end)} · {v.timezone} · {v.status}</p></>}</PreviewRows>
      <PreviewRows title="Completed report summaries" rows={content.reports}>{r => <><strong>{r.title}</strong><p>{r.summary}</p><p className="muted">Summary only. Report files are unavailable in this preview.</p></>}</PreviewRows>
      <PreviewRows title="Equipment" rows={content.equipment}>{e => <><strong>{e.type}</strong><p>{[e.make, e.model].filter(Boolean).join(' · ')}{e.installedOn ? ` · Installed ${dateLabel(e.installedOn, 'short')}` : ''}</p></>}</PreviewRows>
      <PreviewRows title="Agreements" rows={content.agreements}>{a => <><strong>{a.name}</strong><p>{dateLabel(a.startDate, 'short')} – {dateLabel(a.endDate, 'short')}{a.endedAt ? ' · Ended' : ''}</p></>}</PreviewRows>
    </div>}
  </section>
}

function PreviewRows({ title, rows, children }: { title: string; rows: Rec[]; children: (row: Rec) => ReactNode }) {
  return <section aria-label={title}><h3>{title}</h3>{rows.length ? <ul className="rows">{rows.map(row => <li key={row.id}><div>{children(row)}</div></li>)}</ul> : <p className="muted">None to preview.</p>}</section>
}
function DocumentLines({ lines }: { lines: Rec[] }) {
  return <ul>{lines.map((line, index) => <li key={index}>{line.description}{line.customerDescription && <p>{line.customerDescription}</p>}<p>{line.quantity} × {money(line.unitPrice)} · {money(line.total)}</p></li>)}</ul>
}

function QuoteOptions({ quote }: { quote: Rec }) {
  const options = quote.options ?? [{ id: quote.id, lines: quote.lines, totals: quote.totals }]
  const addOns = quote.addOns ?? []
  return <>{options.map((option: Rec) => <div key={option.id}><h4>{option.name || 'Quoted work'} · {money(option.totals.total)}</h4><DocumentLines lines={option.lines} /></div>)}
    {addOns.length > 0 && <div><h4>Optional additions</h4>{addOns.map((addOn: Rec) => <div key={addOn.id}><strong>{addOn.name} · {money(addOn.totals.total)}</strong><DocumentLines lines={addOn.lines} /></div>)}</div>}
  </>
}
