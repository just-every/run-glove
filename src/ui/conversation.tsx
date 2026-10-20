import { useEffect, useState } from 'react'
import { when, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, useAction } from './controls'
import { can } from './roles'

// COMM-007: the customer's or the job's one conversation stream, oldest first
// (GET /api/glove/conversation), with direction, channel, author and delivery,
// and the desk's "log a call or note" form (conversation.log).

const tone = { inbound: 'green', outbound: 'gold', internal: 'grey' } as const
const blank = { kind: 'call', direction: 'inbound', outcome: 'answered', minutes: '', text: '' }

export function Conversation({ s, run, customerId, jobId }: { s: Glove; run: Run; customerId: string; jobId?: string }) {
  const [entries, setEntries] = useState<Rec[] | null>(null), [failure, setFailure] = useState('')
  const [form, setForm] = useState(blank)
  const { error, act } = useAction()
  const query = jobId ? `jobId=${encodeURIComponent(jobId)}` : `customerId=${encodeURIComponent(customerId)}`
  useEffect(() => {
    let live = true
    fetch(`/api/glove/conversation?${query}`, { credentials: 'same-origin', cache: 'no-store' })
      .then(async r => { const body: any = await r.json(); if (!r.ok) throw new Error(body?.error?.message ?? 'The conversation could not load.'); return body.entries as Rec[] })
      .then(list => { if (live) { setEntries(list); setFailure('') } }, (e: Error) => { if (live) setFailure(e.message) })
    return () => { live = false }
  }, [query, s.version])
  const zone = s.business[0]?.timezone ?? 'UTC', call = form.kind === 'call'
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })
  const log = () => act(run('conversation.log', { customerId, ...(jobId ? { jobId } : {}), kind: form.kind, text: form.text, ...(call ? { direction: form.direction, outcome: form.outcome, ...(form.minutes ? { minutes: Number(form.minutes) } : {}) } : {}) }), () => setForm(blank))
  return <section className="panel conversation" aria-label={jobId ? 'Job conversation' : 'Customer conversation'}>
    <h3>Conversation</h3>
    {failure && <p className="problem" role="alert">{failure}</p>}
    {entries && (!entries.length ? <Empty title="No messages yet">Calls, notes, requests, quotes sent and answered, and notices appear here in order.</Empty>
      : <ol className="timeline-list plain">{entries.map(e => <li key={e.id}>
        <div className="conversation-entry">
          <p><time>{when(e.at, zone)}</time> <Badge tone={tone[e.direction as keyof typeof tone]}>{e.direction}</Badge> <strong>{e.kind}</strong> · {e.channel} · {e.author}{e.to ? ` to ${e.to}` : ''}{e.recordedBy && e.recordedBy !== e.author ? ` · recorded by ${e.recordedBy}` : ''}</p>
          {e.text && <p>{e.text}</p>}
          <p className="muted">{e.delivery}</p>
        </div>
      </li>)}</ol>)}
    {can(s.actor, 'conversation.log') && <form onSubmit={e => { e.preventDefault(); void log() }} aria-label="Log a call or note">
      <div className="form-grid">
        <Field label="Log">{p => <select {...p} value={form.kind} onChange={set('kind')}><option value="call">Call</option><option value="note">Note</option></select>}</Field>
        {call && <Field label="Direction">{p => <select {...p} value={form.direction} onChange={set('direction')}><option value="inbound">Customer called us</option><option value="outbound">We called the customer</option></select>}</Field>}
        {call && <Field label="Outcome">{p => <select {...p} value={form.outcome} onChange={set('outcome')}><option value="answered">Answered</option><option value="voicemail">Voicemail</option><option value="no answer">No answer</option></select>}</Field>}
        {call && <Field label="Minutes (optional)">{p => <input {...p} inputMode="numeric" value={form.minutes} onChange={set('minutes')} />}</Field>}
      </div>
      <Field label={call ? 'What was said (optional)' : 'Note'}>{p => <textarea {...p} value={form.text} onChange={set('text')} required={!call} />}</Field>
      <Problem error={error} />
      <div className="actions"><button type="submit">{call ? 'Log call' : 'Log note'}</button></div>
    </form>}
  </section>
}
