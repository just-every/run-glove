import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'
import { StatusNoticeSettings } from './visit-status-notices'

const messageKinds = [
  ['confirmation', 'Visit confirmation'], ['moved', 'Visit moved'],
  ['cancelled', 'Visit cancelled'], ['visitReminder', 'Visit reminder'],
  ['paymentReminder', 'Payment reminder'], ['quoteFollowup', 'Quote follow-up'],
  ['reportReady', 'Service report ready'],
] as const
type Kind = typeof messageKinds[number][0]
type Templates = Record<Kind, string>
const sequences = [
  { key: 'visitHours', label: 'Visit reminder hours', min: 1, max: 168, hint: 'Hours before the visit, from 1 to 168.' },
  { key: 'paymentDays', label: 'Payment reminder days', min: -30, max: 90, hint: 'Calendar days from the invoice due date, from -30 to 90. Negative is before due; 0 is the due date.' },
  { key: 'quoteTextDays', label: 'Quote text follow-up days', min: 1, max: 90, hint: 'Elapsed days after sending. Requires a connected SMS channel and customer text consent.' },
  { key: 'quoteCallDays', label: 'Quote call-task days', min: 1, max: 90, hint: 'Creates an internal task for a person to call. Glove never places the call.' },
  { key: 'quoteDays', label: 'Quote follow-up days', min: 1, max: 90, hint: 'Elapsed days after the quote revision was recorded sent, from 1 to 90.' },
] as const
type Sequence = typeof sequences[number]['key']

function draftOf(b?: Rec) {
  const policy = b?.messageAutomation
  return {
    version: b?.version,
    templates: Object.fromEntries(messageKinds.map(([kind]) => [kind, policy?.templates?.[kind] ?? ''])) as Templates,
    schedules: Object.fromEntries(sequences.map(({ key }) => [key, (policy?.[key] ?? []).join(', ')])) as Record<Sequence, string>,
  }
}

function templateError(value: string) {
  if (!value.trim()) return 'Enter the message text.'
  if (value.trim().length > 2000) return 'Use at most 2,000 characters.'
  if (/https?:|www\.|[<>]/i.test(value) || [...value.matchAll(/{{(.*?)}}/g)].some(m => !['customer', 'date', 'time', 'number', 'amount', 'title'].includes(m[1])) || /[{}]/.test(value.replace(/{{(.*?)}}/g, ''))) return 'Use plain text and the supported fields. Links and markup are unavailable.'
  return undefined
}

function offsets(value: string, min: number, max: number) {
  const parts = value.trim() ? value.trim().split(/[\s,]+/) : []
  const values = parts.map(Number)
  const error = parts.length > 6 || parts.some(p => !/^-?\d+$/.test(p)) || values.some(n => n < min || n > max) || new Set(values).size !== values.length
    ? `Use at most six distinct whole numbers from ${min} to ${max}.` : undefined
  return { values, error }
}

export function MessageTemplates({ s, run }: { s: Glove; run: Run }) {
  const b = s.business[0]
  const [draft, setDraft] = useState(() => draftOf(b))
  const [preview, setPreview] = useState<{ source: string; texts: Templates & { sms?: Partial<Templates> } } | null>(null)
  const [approved, setApproved] = useState(false), [pending, setPending] = useState(false)
  const [validate, setValidate] = useState(false), [notice, setNotice] = useState('')
  const action = useAction()
  if (!b || s.actor.role !== 'owner' || !can(s.actor, 'reminder.configure') || !can(s.actor, 'reminder.preview') || s.branchAccess.some(a => a.id === s.actor.id && a.limited !== false)) return null

  const source = JSON.stringify({ templates: draft.templates, name: b.name, address: b.address })
  const currentPreview = preview?.source === source
  const stale = b.version !== draft.version
  const parsed = Object.fromEntries(sequences.map(({ key, min, max }) => [key, offsets(draft.schedules[key], min, max)])) as Record<Sequence, ReturnType<typeof offsets>>
  const invalidTemplates = messageKinds.some(([kind]) => !!templateError(draft.templates[kind]))
  const invalidSchedules = sequences.some(({ key }) => !!parsed[key].error)
  const edited = () => { setApproved(false); setNotice(''); action.setError(null) }

  async function showPreview() {
    setValidate(true); setApproved(false); setNotice('')
    if (invalidTemplates) return
    setPending(true)
    try {
      const result = await action.act(run('reminder.preview', { templates: draft.templates }))
      if (result.ok) setPreview({ source, texts: result.result })
    } finally { setPending(false) }
  }

  async function enable() {
    setValidate(true)
    if (!approved || !currentPreview || stale || invalidTemplates || invalidSchedules || (!s.mailConnected && !s.smsConnected)) return
    setPending(true); setNotice('')
    try {
      const result = await action.act(run('reminder.configure', {
        version: draft.version, enabled: true, approved: true, templates: draft.templates,
        ...Object.fromEntries(sequences.map(({ key }) => [key, parsed[key].values])),
      }))
      if (result.ok) {
        setDraft(draftOf(result.result)); setApproved(false)
        setPreview({ source, texts: result.result.preview }); setNotice('Saved. Automatic customer email is enabled.')
      }
    } finally { setPending(false) }
  }

  async function disable() {
    setPending(true); setNotice('')
    try {
      const result = await action.act(run('reminder.configure', { version: b.version, enabled: false }))
      if (result.ok) {
        setDraft(d => ({ ...d, version: stale ? d.version : result.result.version })); setApproved(false)
        setNotice('Saved. Automatic customer email is off.')
      }
    } finally { setPending(false) }
  }

  return <><section className="panel" aria-label="Automatic customer email" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <h2>Automatic customer email</h2>
    <p>{b.messageAutomation?.enabled ? 'Enabled' : 'Off'} · Sends only to customers with separately recorded consent for that purpose and their current email address.</p>
    {(!s.mailConnected && !s.smsConnected) && <p>Connect customer email or registered texts to enable automatic messages.</p>}
    {b.messageAutomation?.enabled && <div className="actions"><button type="button" disabled={pending} onClick={() => void disable()}>Turn off automatic email</button></div>}
    <details className="details"><summary>Edit templates and reminder schedules</summary>
      <form aria-label="Automatic email templates and schedules" onSubmit={e => { e.preventDefault(); void enable() }}>
        <fieldset disabled={pending} style={{ minWidth: 0, border: 0, padding: 0, margin: '16px 0' }}><legend>Message templates</legend>
          <p>Plain text only, up to 2,000 characters each. Available fields: {'{{customer}}, {{date}}, {{time}}, {{number}}, {{amount}}, {{title}}'}.</p>
          {messageKinds.map(([kind, label]) => <Field key={kind} label={label} error={validate ? templateError(draft.templates[kind]) : undefined}>{p => <textarea {...p} rows={3} maxLength={2000} required value={draft.templates[kind]} onChange={e => { edited(); setDraft({ ...draft, templates: { ...draft.templates, [kind]: e.target.value } }) }} />}</Field>)}
        </fieldset>
        <fieldset disabled={pending} style={{ minWidth: 0, border: 0, padding: 0, margin: '16px 0' }}><legend>Reminder schedules</legend>
          <p>Enter up to six distinct whole numbers separated by commas. Leave a list empty to disable that sequence. Visit confirmations, moves and cancellations remain enabled.</p>
          {sequences.map(({ key, label, hint }) => <Field key={key} label={label} hint={hint} error={parsed[key].error}>{p => <input {...p} type="text" value={draft.schedules[key]} onChange={e => { edited(); setDraft({ ...draft, schedules: { ...draft.schedules, [key]: e.target.value } }) }} />}</Field>)}
          <p className="muted">Quiet hours are 18:00 to 08:00 in the record branch time zone. Payment reminders stop at zero balance or during a dispute. Quote follow-ups stop when the customer answers, the quote closes or it expires.</p>
        </fieldset>
        <div className="actions"><button type="button" disabled={pending} onClick={() => void showPreview()}>{pending ? 'Working…' : 'Preview all messages'}</button></div>
        {currentPreview && preview && <section aria-label="Automatic email previews"><h3>Message previews</h3><p className="muted">Example field values from Glove. Every message includes the business and office stop instructions below. Previewing sends no email.</p>{messageKinds.map(([kind, label]) => <details className="details" key={kind}><summary>{label} preview</summary><p style={{ whiteSpace: 'pre-wrap' }}>{preview.texts[kind]}</p>{preview.texts.sms?.[kind] && <><h4>Text message preview</h4><p style={{ whiteSpace: 'pre-wrap' }}>{preview.texts.sms[kind]}</p></>}</details>)}</section>}
        {!currentPreview && <p>Preview all messages before approving them.</p>}
        {stale && <p role="status">Business settings changed. Reload the current settings before approving; this replaces your unsaved edits.</p>}
        <label className="check-line"><input type="checkbox" checked={approved} disabled={pending || !currentPreview || stale || invalidTemplates || invalidSchedules || (!s.mailConnected && !s.smsConnected)} onChange={e => setApproved(e.target.checked)} /> I approve these exact templates and reminder schedules.</label>
        <div className="actions"><button type="submit" className="primary" disabled={pending || !approved || !currentPreview || stale || invalidTemplates || invalidSchedules || (!s.mailConnected && !s.smsConnected)}>{b.messageAutomation?.enabled ? 'Approve changes to automatic email' : 'Approve and enable automatic email'}</button><button type="button" disabled={pending} onClick={() => { setDraft(draftOf(b)); setPreview(null); setValidate(false); edited() }}>Reload current settings</button></div>
      </form>
    </details>
    <Problem error={action.error} />{notice && <p role="status">{notice}</p>}
  </section><StatusNoticeSettings s={s} run={run} /></>
}
