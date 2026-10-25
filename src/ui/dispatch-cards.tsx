import { IconButton } from './icon-button'
import { useState } from 'react'
import { ampm, byId, dateLabel, timeRange, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, money, useAction } from './controls'
import { can } from './roles'
import { Glyph } from './glyphs'
import { jobDrag, type Slot } from './dispatch-board'

// The dispatch screen's cards: the agent strip over the board, the waiting
// queue, the selected technician's stops, a dragged or keyed move's reason,
// agent proposals to decide and the Book a visit form.

export type Attempt = (type: string, payload: Record<string, unknown>, label: string, done: () => void) => Promise<any>
export type Proposed = { visit: Rec; slot: Slot; label: string }

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const town = (address = '') => address.split(',').slice(1).join(',').trim() || address

/** The agent's place: what it prepared for this board, and how many of its changes wait for a person. */
export function AgentStrip({ s, proposals, open }: { s: Glove; proposals: Rec[]; open: (id: string) => void }) {
  if (!proposals.length) return null
  const names = [...new Set(proposals.map(p => p.preparedBy.name))].join(', ')
  const first = proposals[0], job = byId(s.jobs, first.jobId), tech = byId(s.technicians, first.plan.technicianId)
  return <section className="agent-strip" aria-label="Agent">
    <img className="agent-mark" src="/brand/mark.svg" alt="" width="34" height="34" />
    <h2>{names}</h2>
    <p>Prepared {plural(proposals.length, 'dispatch proposal')}: {job?.number} → {tech?.name}, {dateLabel(first.plan.date, 'short')} {ampm(first.plan.start)}{proposals.length > 1 ? ` and ${plural(proposals.length - 1, 'more')}` : ''}.</p>
    <button className="approval-pill" onClick={() => open(first.id)}><i aria-hidden="true" />{plural(proposals.length, 'change')} {proposals.length === 1 ? 'needs' : 'need'} your approval<Glyph name="chevronRight" /></button>
  </section>
}

/** Accepted quotes and open jobs with no visit yet; jobs drag onto a technician. */
export function Waiting({ s, run, quotes, jobs, book }: { s: Glove; run: Run; quotes: Rec[]; jobs: Rec[]; book: (jobId: string) => void }) {
  const canBook = can(s.actor, 'visit.book')
  return <section className="waiting" aria-labelledby="waiting-title">
    <h2 id="waiting-title">Waiting to book <span className="count">{quotes.length + jobs.length}</span></h2>
    <p className="muted">Accepted quotes and open jobs without a visit</p>
    {!quotes.length && !jobs.length && <Empty title="Nothing waiting" glyph="calendar">Accepted quotes appear here until they are booked.</Empty>}
    <ul className="queue">
      {quotes.map(q => <WaitingQuote key={q.id} s={s} quote={q} run={run} />)}
      {jobs.map(j => { const c = byId(s.customers, j.customerId), site = byId(s.sites, j.siteId), kind = j.kind === 'assessment' ? ['Assessment', 'blue'] : j.serviceCall ? ['Service call', 'red'] : j.quoteId ? ['From quote', 'green'] : ['Moved in', 'grey']
        return <li key={j.id} className={`tone-${kind[1]}`} {...(canBook ? jobDrag(j.id) : {})} aria-label={`${j.number} ${j.title}, unscheduled`}>
          <span className="queue-icon" aria-hidden="true"><Glyph name={j.serviceCall ? 'alert' : j.kind === 'assessment' ? 'calendar' : 'doc'} /></span>
          <div className="queue-body">
            <strong>{j.title}</strong>
            <span>{c?.name}</span>
            <span className="muted">{town(site?.address)}{j.totals && Number(j.totals.total) > 0 ? <> · <span className="num">{money(j.totals.total)}</span></> : null}</span>
            <span className="queue-meta"><span className="num">{j.number}</span><span className={`tag tag-${kind[1]}`}>{kind[0]}</span></span>
          </div>
          {canBook && <IconButton className="icon-button queue-go" aria-label="Book a visit" tooltip="Book a visit" onClick={() => book(j.id)}><Glyph name="chevronRight" /></IconButton>}
        </li> })}
    </ul>
  </section>
}

function WaitingQuote({ s, quote, run }: { s: Glove; quote: Rec; run: Run }) {
  const { error, act } = useAction()
  const c = byId(s.customers, quote.customerId), site = byId(s.sites, quote.siteId), rev = quote.revisions.find((r: Rec) => r.n === quote.acceptance.revision)
  return <li className="tone-blue">
    <span className="queue-icon" aria-hidden="true"><Glyph name="doc" /></span>
    <div className="queue-body">
      <strong>{quote.title}</strong>
      <span>{c?.name}</span>
      <span className="muted">{town(site?.address)}</span>
      <span className="queue-meta"><span className="num">{quote.number}</span><span className="tag tag-blue">Quote accepted</span><span className="num">{money((quote.acceptance.totals ?? rev.totals).total)}</span></span>
      <p className="accepted">Accepted {new Date(quote.acceptance.at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} by {quote.acceptance.method}, recorded by {quote.acceptance.recordedBy.name}</p>
      {can(s.actor, 'job.create') && s.actor.role !== 'office' && <button className="link-button" onClick={() => act(run('job.create', { quoteId: quote.id }))}>Create job<Glyph name="arrow" /></button>}
      <Problem error={error} />
    </div>
  </li>
}

/** The selected technician's stops for the day, numbered in visit order (Glove draws no map). */
export function Stops({ s, tech, date, select }: { s: Glove; tech: Rec; date: string; select: (id: string) => void }) {
  const visits = s.visits.filter(v => v.technicianId === tech.id && v.local.date === date && v.status !== 'cancelled').sort((a, b) => a.startAt.localeCompare(b.startAt))
  const van = s.stock.find(l => l.kind === 'van' && l.technicianId === tech.id && !l.archived)
  const onClock = s.times.some(x => x.kind === 'shift' && !x.endAt && x.technicianId === tech.id)
  return <section className="stops" aria-label={`${tech.name}'s stops`}>
    <h2><i className={onClock ? 'on' : ''} aria-hidden="true" />{tech.name}{van && <span className="muted"> — {van.name}</span>}</h2>
    {!visits.length ? <p className="muted">No stops this day.</p> : <ol>{visits.map(v => { const job = byId(s.jobs, v.jobId), site = byId(s.sites, job?.siteId)
      return <li key={v.id} className={v.status}><button className="stop" onClick={() => select(v.id)}><span className="num">{ampm(v.local.start)}</span><strong>{site?.address?.split(',')[0]}</strong><span className="muted">{job?.number} · {v.status === 'completed' ? 'Completed' : v.status === 'arrived' ? 'On site' : 'Booked'}</span></button></li> })}</ol>}
  </section>
}

/** A dragged or keyed move: the reason every change keeps (GLOVE-07), then the conflict review if any. */
export function MoveCard({ proposed, attempt, close }: { proposed: Proposed; attempt: Attempt; close: () => void }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<any>(null)
  const { visit, slot } = proposed
  return <section className="notice prepared" aria-labelledby="move-title">
    <h2 id="move-title">Move visit</h2>
    <p>{proposed.label}</p>
    <form onSubmit={async e => { e.preventDefault(); const o = await attempt('visit.change', { visitId: visit.id, version: visit.version, ...slot, reason }, `Moving ${proposed.label}`, close); if (!o.ok && o.error.code === 'CONFLICT_REVIEW') close(); else setError(o.ok ? null : o.error) }}>
      <Field label="Reason for the move">{p => <input {...p} value={reason} onChange={e => setReason(e.target.value)} required />}</Field>
      <Problem error={error} />
      <div className="notice-actions"><button className="primary" type="submit">Move visit</button><button type="button" onClick={close}>Keep it where it is</button></div>
    </form>
  </section>
}

export function Proposal({ s, p, run, attempt, focused }: { s: Glove; p: Rec; run: Run; attempt: Attempt; focused: boolean }) {
  const [reason, setReason] = useState('')
  const { error, act } = useAction()
  const job = byId(s.jobs, p.jobId), tech = byId(s.technicians, p.plan.technicianId)
  const decide = can(s.actor, 'proposal.approve')
  return <section id={`proposal-${p.id}`} tabIndex={-1} className={`notice prepared${focused ? ' focused' : ''}`} aria-label="Agent-prepared dispatch proposal">
    <p className="notice-kicker"><img src="/brand/mark.svg" alt="" width="18" height="18" />{p.preparedBy.role === 'agent' ? 'Agent prepared' : `Prepared by ${p.preparedBy.name}`}</p>
    <h2>{job?.number} → {tech?.name}</h2>
    <p>{p.kind === 'move' ? 'Move the booked visit to ' : ''}{dateLabel(p.plan.date, 'short')} {timeRange(p.plan.start, p.plan.end)} · {job?.title}. Waiting for your approval.</p>
    {p.kind === 'move' && <p><Badge tone={p.customer === 'unchanged' ? 'green' : 'gold'}>{p.customer === 'unchanged' ? 'Customer\'s window kept' : 'Customer not yet asked'}</Badge></p>}
    <p className="muted">{p.rationale}</p>
    {p.evidence.length > 0 && <ul className="evidence">{p.evidence.map((e: string) => <li key={e}>{e}</li>)}</ul>}
    {decide ? <>
      <div className="notice-actions">
        <button className="primary" onClick={() => attempt('proposal.approve', { proposalId: p.id, version: p.version }, `Approving ${p.preparedBy.name}'s proposal for ${job?.number}`, () => {})}>Approve</button>
        <button onClick={() => act(run('proposal.decline', { proposalId: p.id, version: p.version, reason }))} disabled={!reason.trim()}>Decline</button>
      </div>
      <Field label="Reason to decline">{props => <input {...props} value={reason} onChange={e => setReason(e.target.value)} />}</Field>
      <Problem error={error} />
    </> : <p className="muted">A dispatcher or the owner decides.</p>}
  </section>
}

export function BookForm({ s, jobId, date, attempt, close }: { s: Glove; jobId: string; date: string; attempt: Attempt; close: () => void }) {
  const open = s.jobs.filter(j => j.status === 'open')
  const [form, setForm] = useState({ jobId: jobId || open[0]?.id || '', technicianId: s.technicians.find(t => t.active)?.id ?? '', date, start: '09:00', end: '10:30', windowStart: '', windowEnd: '', reason: '' })
  const [error, setError] = useState<any>(null)
  const set = (key: string) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  if (!open.length) return <section className="panel"><h2>Book a visit</h2><Empty title="No open jobs">Create a job from an accepted quote first.</Empty><button onClick={close}>Close</button></section>
  return <form className="panel book-form" onSubmit={async e => { e.preventDefault(); const job = byId(s.jobs, form.jobId); const crew = form.technicianId.startsWith('crew:') ? byId(s.crews ?? [], form.technicianId.slice(5)) : null; const { windowStart, windowEnd, ...rest } = form, booking = { ...rest, ...(windowStart && windowEnd ? { window: { start: windowStart, end: windowEnd } } : {}) }; const o = await attempt('visit.book', crew ? { ...booking, technicianId: undefined, crewId: crew.id } : booking, `Booking ${job?.number} for ${crew ? `crew ${crew.name}` : form.technicianId === 'auto' ? 'the best free technician' : byId(s.technicians, form.technicianId)?.name} ${timeRange(form.start, form.end)}`, close); setError(o.ok || o.error.code === 'CONFLICT_REVIEW' ? null : o.error) }}>
    <h2>Book a visit</h2><p className="muted">Times are in {s.branches.find(b => b.id === byId(s.jobs, form.jobId)?.branchId)?.timezone ?? s.business[0]?.timezone}.</p>
    <div className="form-grid">
      <Field label="Job">{p => <select {...p} value={form.jobId} onChange={set('jobId')}>{open.map(j => <option key={j.id} value={j.id}>{j.number} · {j.title} · {byId(s.customers, j.customerId)?.name}</option>)}</select>}</Field>
      <Field label="Technician">{p => <select {...p} value={form.technicianId} onChange={set('technicianId')}><option value="auto">Assign automatically</option>{s.technicians.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}{(s.crews ?? []).length > 0 && <optgroup label="Crews">{(s.crews ?? []).map(c => <option key={c.id} value={`crew:${c.id}`}>Crew {c.name}</option>)}</optgroup>}</select>}</Field>
      <Field label="Date">{p => <input {...p} type="date" value={form.date} onChange={set('date')} required />}</Field>
      <Field label="Starts">{p => <input {...p} type="time" value={form.start} onChange={set('start')} required />}</Field>
      <Field label="Ends">{p => <input {...p} type="time" value={form.end} onChange={set('end')} required />}</Field>
      <Field label="Arrival window from (optional)">{p => <input {...p} type="time" value={form.windowStart} onChange={set('windowStart')} required={!!form.windowEnd} />}</Field>
      <Field label="Arrival window until (optional)">{p => <input {...p} type="time" value={form.windowEnd} onChange={set('windowEnd')} required={!!form.windowStart} />}</Field>
      <Field label="Note for the record (optional)">{p => <input {...p} value={form.reason} onChange={set('reason')} />}</Field>
    </div>
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit">Book visit</button><button type="button" onClick={close}>Cancel</button></div>
  </form>
}
