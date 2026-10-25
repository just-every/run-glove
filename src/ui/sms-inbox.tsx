import { useState } from 'react'
import { byId, when, type Glove, type Rec, type Run } from './api'
import { Empty, Field, Problem, useAction } from './controls'
import { can } from './roles'

export function TextInbox({ s, run }: { s: Glove; run: Run }) {
  const [open, setOpen] = useState('')
  const incoming = (s.messages ?? []).filter(m => m.channel === 'sms' && m.direction === 'inbound')
  const message = incoming.find(m => m.id === open)
  return <div className="page text-inbox"><section className="titlebar"><h1>Text inbox</h1></section>
    <div className="two-col"><section className="panel"><h2>Customer texts</h2>
      {!incoming.length ? <Empty title="No incoming texts" /> : <ul className="rows">{[...incoming].reverse().map(m => <li key={m.id}><div><button className="link-button" onClick={() => setOpen(m.id)}>{byId(s.customers, m.customerId)?.name ?? 'Customer'}</button><p>{m.readAt ? '' : 'Unread · '}{m.assignedTo?.name ?? 'Unassigned'} · {when(m.createdAt, s.business[0]?.timezone ?? 'UTC')}</p><p>{m.body ?? `Received ${m.reply}; message text was not retained.`}</p></div></li>)}</ul>}
    </section>{message ? <TextThread key={message.id} s={s} run={run} message={message} /> : <Empty title="Choose a customer text" />}</div>
  </div>
}

function TextThread({ s, run, message, }: { s: Glove; run: Run; message: Rec }) {
  const [body, setBody] = useState(''), [jobId, setJobId] = useState(message.jobId ?? '')
  const { error, act } = useAction()
  const customer = byId(s.customers, message.customerId)
  const replies = (s.messages ?? []).filter(m => m.inReplyTo === message.id)
  return <section className="panel" aria-label="Text conversation"><h2>{customer?.name}</h2>
    <p>{message.body ?? `Received ${message.reply}; message text was not retained.`}</p>
    <p>{message.assignedTo ? `Assigned to ${message.assignedTo.name}` : 'Unassigned'}</p>
    <Problem error={error} />
    {can(s.actor, 'sms.assign') && <button onClick={() => act(run('sms.assign', { messageId: message.id, version: message.version }))}>Take conversation</button>}
    {can(s.actor, 'sms.thread') && <form aria-label="Link text to job" onSubmit={e => { e.preventDefault(); void act(run('sms.thread', { messageId: message.id, version: message.version, jobId: jobId || null })) }}>
      <Field label="Related job">{p => <select {...p} value={jobId} onChange={e => setJobId(e.target.value)}><option value="">Customer only</option>{s.jobs.filter(j => j.customerId === message.customerId).map(j => <option key={j.id} value={j.id}>{j.number} · {j.title}</option>)}</select>}</Field><button>Link job</button>
    </form>}
    <ul className="timeline-list plain">{replies.map(m => <li key={m.id}><p>{m.by.name}: {m.body}</p><p role="status">{s.messageStates?.[m.id]?.text ?? 'Queued; no provider answer yet'}</p></li>)}</ul>
    {can(s.actor, 'sms.reply') && !message.ambiguousSender && <form aria-label="Reply to customer text" onSubmit={e => { e.preventDefault(); void act(run('sms.reply', { messageId: message.id, version: message.version, text: body }), () => setBody('')) }}>
      <Field label="Reply template">{p => <select {...p} defaultValue="" onChange={e => setBody(e.target.value)}><option value="">Write a reply</option><option value="Thank you. The office will call you to confirm the details.">Office will call</option><option value="Thank you. We have added your note to the job.">Note received</option></select>}</Field>
      <Field label="Text reply">{p => <textarea {...p} value={body} onChange={e => setBody(e.target.value)} maxLength={1200} required />}</Field><button>Send text reply</button>
    </form>}
  </section>
}

export function InboxSettings({ s, run }: { s: Glove; run: Run }) {
  const { error, act } = useAction(), [approved, setApproved] = useState(false), b = s.business[0]
  if (!b?.sms || !can(s.actor, 'sms.inboxConfigure')) return null
  return <section className="panel" aria-label="Text inbox settings"><h2>Text inbox</h2><p>Keep incoming customer text for the desk conversation. Turning this off stops retaining new text; existing messages remain until customer erasure.</p><Problem error={error} />
    {!b.sms.inboxEnabled && <label className="check-line"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} />I approve keeping incoming text for the desk.</label>}
    <div className="actions"><button disabled={!b.sms.inboxEnabled && !approved} onClick={() => act(run('sms.inboxConfigure', { version: b.version, enabled: !b.sms.inboxEnabled, approved }))}>{b.sms.inboxEnabled ? 'Stop retaining incoming text' : 'Enable text inbox'}</button></div>
  </section>
}
