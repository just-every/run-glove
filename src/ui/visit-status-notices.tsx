import { useState } from 'react'
import { send, type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'

const defaults = { arrival: '{{technician}} has arrived for {{title}}.', onMyWay: '{{technician}} is on the way for {{title}}. Estimated arrival {{eta}}.', reportReady: 'Your completed service report for {{title}} is ready.' }

export function StatusNoticeSettings({ s, run }: { s: Glove; run: Run }) {
  const b = s.business[0], policy = b?.visitNotices
  const [templates, setTemplates] = useState(() => ({ ...defaults, ...policy?.templates }))
  const [onMyWay, setOnMyWay] = useState(policy?.onMyWay === true), [arrival, setArrival] = useState(policy?.arrival === true), [reportReady, setReportReady] = useState(policy?.reportReady === true)
  const [preview, setPreview] = useState<{ source: string; texts: Record<string, string> } | null>(null), [approved, setApproved] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  const action = useAction(), source = JSON.stringify({ templates, name: b?.name })
  if (!b || s.actor.role !== 'owner' || !can(s.actor, 'visitNotice.configure') || s.branchAccess.some(a => a.id === s.actor.id && a.limited !== false)) return null
  const edit = () => { setApproved(false); setNotice(''); action.setError(null) }
  async function previewTexts() {
    setBusy(true); edit()
    try {
      const outcome = await action.act(run('visitNotice.preview', { templates }))
      if (outcome.ok) setPreview({ source, texts: outcome.result })
    } finally { setBusy(false) }
  }
  async function save() {
    if (!approved || preview?.source !== source) return
    setBusy(true); setNotice('')
    try {
      const outcome = await action.act(run('visitNotice.configure', { version: b.version, onMyWay, arrival, reportReady, templates, approved: true }))
      if (outcome.ok) { setApproved(false); setNotice('Saved. Visit status text settings now apply to future actions.') }
    } finally { setBusy(false) }
  }
  return <section className="panel" aria-label="Visit status texts" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <h2>Visit status texts</h2><p>On-my-way texts: {policy?.onMyWay ? 'Enabled' : 'Off'} · Arrival texts: {policy?.arrival ? 'Enabled' : 'Off'} · Completed report texts: {policy?.reportReady ? 'Enabled' : 'Off'}</p>
    <p>Each text requires current visit text consent and the customer’s 08:00–18:00 time window. On-my-way uses your technician’s consented photo and a fresh on-clock driving estimate. Arrival texts send only for an arrival recorded within two minutes. A completion text shares the frozen report with a seven-day link.</p>
    <details><summary>Edit visit status settings</summary><form onSubmit={e => { e.preventDefault(); void save() }}>
      <fieldset disabled={busy} style={{ minWidth: 0, border: 0, padding: 0 }}><legend>Owner-approved notices</legend>
        <label className="check-line"><input type="checkbox" checked={onMyWay} onChange={e => { edit(); setOnMyWay(e.target.checked) }} /> Allow the assigned technician to send an on-my-way text</label>
        <label className="check-line"><input type="checkbox" checked={arrival} onChange={e => { edit(); setArrival(e.target.checked) }} /> Send an arrival text when the assigned technician records a fresh arrival</label>
        <label className="check-line"><input type="checkbox" checked={reportReady} onChange={e => { edit(); setReportReady(e.target.checked) }} /> Send the service report link when a technician completes a visit</label>
        <p>Plain text fields: {'{{customer}}, {{technician}}, {{eta}}, {{title}}, {{number}}'}. On-my-way must include technician and ETA. The business and STOP instructions are always added.</p>
        <Field label="On-my-way text">{p => <textarea {...p} maxLength={800} required value={templates.onMyWay} onChange={e => { edit(); setTemplates({ ...templates, onMyWay: e.target.value }) }} />}</Field>
        <Field label="Arrival text">{p => <textarea {...p} maxLength={800} required value={templates.arrival} onChange={e => { edit(); setTemplates({ ...templates, arrival: e.target.value }) }} />}</Field>
        <Field label="Completed report text">{p => <textarea {...p} maxLength={800} required value={templates.reportReady} onChange={e => { edit(); setTemplates({ ...templates, reportReady: e.target.value }) }} />}</Field>
        <button type="button" onClick={() => void previewTexts()}>Preview visit status texts</button>
        {preview?.source === source && <section aria-label="Visit status text previews"><h3>Exact text previews</h3><p>Example values. Private photo and report credentials are generated only for the actual notice.</p>{Object.entries(preview.texts).map(([kind, value]) => <div key={kind}><h4>{kind === 'onMyWay' ? 'On my way' : kind === 'arrival' ? 'Arrival' : 'Report ready'}</h4><p style={{ whiteSpace: 'pre-wrap' }}>{value}</p></div>)}</section>}
        <label className="check-line"><input type="checkbox" checked={approved} disabled={preview?.source !== source} onChange={e => setApproved(e.target.checked)} /> I approve these exact templates and authorize the selected technician-triggered texts and seven-day report sharing.</label>
        <button type="submit" disabled={!approved || preview?.source !== source}>Approve visit status settings</button>
      </fieldset>
    </form></details><Problem error={action.error} />{notice && <p role="status">{notice}</p>}
  </section>
}

/** No offline outbox: a delayed departure text would carry an obsolete ETA. */
export function PhoneOnMyWay({ s, visit, online, refresh }: { s: Glove; visit: Rec; online: boolean; refresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState('')
  const [pending, setPending] = useState<{ commandId: string; payload: { visitId: string; version: number } } | null>(null)
  const reserved = visit.onMyWay?.startAt === visit.startAt && visit.onMyWay?.endAt === visit.endAt && visit.onMyWay?.technicianId === visit.technicianId
  if (s.actor.role !== 'technician' || !can(s.actor, 'visit.onMyWay') || visit.status !== 'booked' || visit.arrival) return null
  async function submit() {
    const attempt = pending ?? { commandId: crypto.randomUUID(), payload: { visitId: visit.id, version: visit.version } }
    setBusy(true); setError(''); setNotice('')
    try {
      const { body } = await send(attempt.commandId, 'visit.onMyWay', attempt.payload)
      if (!body.ok) { setError(body.error.message); if (body.error.code !== 'BUSY') setPending(null); return }
      setPending(null); setNotice('On-my-way text submitted. The office can check the provider outcome.'); await refresh()
    } catch { setPending(attempt); setError('The connection dropped. Recover this action to check its first outcome; it will not send twice.') }
    finally { setBusy(false) }
  }
  return <section aria-label="On-my-way text"><p>Choose your customer photo, clock in, allow on-clock location sharing and start this visit’s travel timer for a current driving estimate.</p>
    <button type="button" disabled={busy || !online || reserved && !pending} onClick={() => void submit()}>{busy ? 'Submitting…' : pending ? 'Recover on-my-way result' : reserved ? 'On-my-way text reserved' : 'On my way'}</button>
    {!online && <p>Reconnect to send a current ETA.</p>}{notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
  </section>
}
