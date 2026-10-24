import { useId, useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'
import { zones } from './branches'

const owner = (s: Glove, command: string) => s.actor.role === 'owner' && can(s.actor, command) && !s.branchAccess.some(a => a.id === s.actor.id && a.limited !== false)

export function CustomerSmsConnect({ s, run }: { s: Glove; run: Run }) {
  const b = s.business[0], sms = b?.sms
  const [form, setForm] = useState({ accountSid: '', authToken: '', fromNumber: '', registration: 'a2p10dlc' })
  const [affirmed, setAffirmed] = useState(false), [enableApproval, setEnableApproval] = useState('')
  const [pending, setPending] = useState(false), [notice, setNotice] = useState('')
  const action = useAction()
  if (!b || !owner(s, 'sms.connect') || !owner(s, 'sms.configure')) return null
  const connected = !!sms && s.smsConnected === true
  const approved = connected && enableApproval === sms.connectionId
  const set = (key: keyof typeof form, value: string) => { setForm({ ...form, [key]: value }); setAffirmed(false); setNotice(''); action.setError(null) }

  async function connect() {
    if (!affirmed) return
    setPending(true); setNotice('')
    try {
      const result = await action.act(run('sms.connect', { version: b.version, provider: 'twilio', ...form, registered: true, live: true }))
      if (result.ok) {
        setForm({ accountSid: '', authToken: '', fromNumber: '', registration: 'a2p10dlc' }); setAffirmed(false); setEnableApproval('')
        setNotice('Connection stored. Customer texts remain disabled until you explicitly enable them.')
      }
    } finally { setPending(false) }
  }

  async function configure(enabled: boolean) {
    if (enabled && !approved) return
    setPending(true); setNotice('')
    try {
      const result = await action.act(run('sms.configure', { version: b.version, enabled, ...(enabled ? { approved: true } : {}) }))
      if (result.ok) { setEnableApproval(''); setNotice(enabled ? 'Saved. The text channel is enabled; approved sequences and customer consent are still required.' : 'Saved. Customer texts are disabled.') }
    } finally { setPending(false) }
  }

  async function disconnect() {
    setPending(true); setNotice('')
    try {
      const result = await action.act(run('sms.connect', { version: b.version, provider: null }))
      if (result.ok) { setForm({ ...form, authToken: '' }); setAffirmed(false); setEnableApproval(''); setNotice('Customer texts disconnected.') }
    } finally { setPending(false) }
  }

  return <section className="panel" aria-label="Customer texts" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <h2>Customer texts</h2>
    <p>{sms ? `${sms.fromNumber} · ${!connected ? 'Reconnect required' : sms.enabled ? 'Channel enabled' : 'Channel disabled'}` : 'No Twilio number connected.'}</p>
    {sms && !connected && <p>The stored connection has no installation credential. Reconnect Twilio before enabling customer texts.</p>}
    {sms?.enabled && <div className="actions"><button type="button" disabled={pending} onClick={() => void configure(false)}>Disable customer texts</button></div>}
    <details className="details"><summary>Manage Twilio connection</summary>
      <p>Use an existing registered US Twilio number. Registration is your affirmation; Glove does not verify registration or live delivery here.</p>
      {sms && <>
        <Field label="Twilio incoming message webhook" hint="Set this URL on the connected number, and configure its actual HELP response in Twilio before enabling texts.">{p => <input {...p} readOnly value={`${sms.origin}/api/glove/sms/inbound`} />}</Field>
        <p className="muted">The channel requires approved message templates and schedules plus separate customer consent for visits or quotes. Texts send only between 08:00 and 18:00 in the recorded customer time zone. STOP blocks texts; START alone does not restore consent.</p>
        {connected && !sms.enabled && <>
          <label className="check-line"><input type="checkbox" checked={approved} disabled={pending} onChange={e => setEnableApproval(e.target.checked ? sms.connectionId : '')} /> I approve enabling customer texts from this registered number.</label>
          <div className="actions"><button type="button" disabled={pending || !approved} onClick={() => void configure(true)}>Enable customer texts</button></div>
        </>}
        <div className="actions"><button type="button" disabled={pending} onClick={() => void disconnect()}>Disconnect Twilio</button></div>
      </>}
      <form aria-label="Connect Twilio number" onSubmit={e => { e.preventDefault(); void connect() }}>
        <h3>{sms ? connected ? 'Replace Twilio connection' : 'Reconnect Twilio' : 'Connect Twilio'}</h3>
        <fieldset disabled={pending} className="field-grid">
          <Field label="Twilio account SID">{p => <input {...p} autoComplete="off" value={form.accountSid} onChange={e => set('accountSid', e.target.value)} pattern="AC[0-9a-fA-F]{32}" maxLength={34} required />}</Field>
          <Field label="Twilio auth token" hint="Kept privately in this installation. Enter it again after restoring an archive.">{p => <input {...p} type="password" autoComplete="new-password" value={form.authToken} onChange={e => set('authToken', e.target.value)} pattern="[0-9a-fA-F]{32}" maxLength={32} required />}</Field>
          <Field label="Registered US Twilio number" hint="International format beginning with +1, followed by ten digits.">{p => <input {...p} type="tel" autoComplete="off" value={form.fromNumber} onChange={e => set('fromNumber', e.target.value)} pattern="\+1[2-9][0-9]{9}" required />}</Field>
          <Field label="Number registration">{p => <select {...p} value={form.registration} onChange={e => set('registration', e.target.value)}><option value="a2p10dlc">A2P 10DLC registration</option><option value="tollFree">Toll-free verification</option></select>}</Field>
        </fieldset>
        <label className="check-line"><input type="checkbox" checked={affirmed} disabled={pending} required onChange={e => setAffirmed(e.target.checked)} /> I confirm this number is live and its registration or toll-free verification is complete.</label>
        <div className="actions"><button type="submit" disabled={pending || !affirmed}>{sms && !connected ? 'Reconnect registered number' : 'Connect registered number'}</button></div>
      </form>
    </details>
    <Problem error={action.error} />{notice && <p role="status">{notice}</p>}
  </section>
}

export function CustomerSmsConsent({ s, customer, run }: { s: Glove; customer: Rec; run: Run }) {
  if (!owner(s, 'sms.consent') || customer.erasedAt || customer.mergedInto) return null
  return <section className="panel" aria-label="Customer text consent" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <h2>Customer text consent</h2>
    <p>Consent is separate for visits and quotes, and binds the exact current phone number. Changing that number requires new consent.</p>
    <SmsPurposeConsent customer={customer} purpose="visits" run={run} />
    <SmsPurposeConsent customer={customer} purpose="quotes" run={run} />
  </section>
}

function SmsPurposeConsent({ customer, purpose, run }: { customer: Rec; purpose: 'visits' | 'quotes'; run: Run }) {
  const current = customer.automaticSms?.[purpose]
  const [address, setAddress] = useState(customer.phone ?? '')
  const [form, setForm] = useState({ source: '', wording: '', timezone: current?.timezone ?? '' })
  const [enabled, setEnabled] = useState(true), [affirmed, setAffirmed] = useState(false)
  const [pending, setPending] = useState(false), [notice, setNotice] = useState('')
  const timeZonesId = useId()
  const action = useAction(), label = purpose === 'visits' ? 'Visit' : 'Quote'
  const changed = address !== (customer.phone ?? ''), validPhone = /^\+[1-9]\d{7,14}$/.test(address)
  const blocked = customer.smsOptOut?.blocked && customer.smsOptOut.address === customer.phone
  const active = current?.enabled && current.address === customer.phone && !blocked
  const set = (key: keyof typeof form, value: string) => { setForm({ ...form, [key]: value }); setAffirmed(false); setNotice(''); action.setError(null) }

  async function record() {
    if (!affirmed || changed || !validPhone || enabled && blocked) return
    setPending(true); setNotice('')
    try {
      const result = await action.act(run('sms.consent', { customerId: customer.id, version: customer.version, purpose, enabled, address, ...form }))
      if (result.ok) { setForm({ ...form, source: '', wording: '' }); setAffirmed(false); setNotice(enabled ? `${label} text consent recorded for ${address}.` : `${label} text consent withdrawn for ${address}.`) }
    } finally { setPending(false) }
  }

  return <details className="details"><summary>{label} text consent · {active ? 'Recorded for current phone' : 'No active consent'}</summary>
    {current && <><p className="muted">Last recorded {current.at} for {current.address} by {current.by?.name}. {current.address !== customer.phone && 'The phone has changed; this consent no longer applies.'}</p><dl><dt>Recorded source</dt><dd>{current.source}</dd><dt>Recorded wording</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{current.wording}</dd><dt>Customer time zone</dt><dd>{current.timezone}</dd></dl></>}
    {blocked && <p>The customer sent STOP. They must send START before you can record new consent; START alone does not restore consent.</p>}
    <form aria-label={`${label} text consent`} onSubmit={e => { e.preventDefault(); void record() }}>
      <fieldset disabled={pending} className="field-grid">
        <Field label={`${label} consent phone`} hint="The exact recorded customer number. Edit the customer’s phone first if it needs correcting.">{p => <input {...p} type="tel" readOnly value={address} />}</Field>
        <Field label={`${label} consent decision`}>{p => <select {...p} value={enabled ? 'consent' : 'withdrawal'} onChange={e => { setEnabled(e.target.value === 'consent'); setAffirmed(false); setNotice(''); action.setError(null) }}><option value="consent">Record customer consent</option><option value="withdrawal">Record customer withdrawal</option></select>}</Field>
        <Field label={`${label} consent source`} hint="Record where and how the customer gave consent or asked to withdraw it.">{p => <input {...p} required maxLength={300} value={form.source} onChange={e => set('source', e.target.value)} />}</Field>
        <Field label={`${label} consent wording`} hint="Record the actual wording the customer accepted, or their withdrawal request.">{p => <textarea {...p} required maxLength={2000} rows={3} value={form.wording} onChange={e => set('wording', e.target.value)} />}</Field>
        <Field label={`${label} customer time zone`} hint="Enter the customer’s confirmed IANA time zone. Quiet hours are 18:00 to 08:00 there.">{p => <><input {...p} list={timeZonesId} required maxLength={100} value={form.timezone} onChange={e => set('timezone', e.target.value)} /><datalist id={timeZonesId}>{[...new Set([...zones, ...(current?.timezone ? [current.timezone] : [])])].map(zone => <option key={zone} value={zone} />)}</datalist></>}</Field>
      </fieldset>
      {!validPhone && <p>Record the customer phone in international format beginning with + and its country code before recording consent.</p>}
      {changed && <><p role="status">The customer phone changed. Clear this evidence and use the current phone before recording a new decision.</p><button type="button" disabled={pending} onClick={() => { setAddress(customer.phone ?? ''); setForm({ source: '', wording: '', timezone: '' }); setAffirmed(false); setNotice(''); action.setError(null) }}>Use current phone and clear evidence</button></>}
      <label className="check-line"><input type="checkbox" required checked={affirmed} disabled={pending || changed || !validPhone || enabled && blocked} onChange={e => setAffirmed(e.target.checked)} /> {enabled ? `The customer gave consent for ${purpose} texts to the number shown.` : `I am recording the customer’s withdrawal from ${purpose} texts to the number shown.`}</label>
      <div className="actions"><button type="submit" disabled={pending || !affirmed || changed || !validPhone || enabled && blocked}>Record {purpose} text {enabled ? 'consent' : 'withdrawal'}</button></div>
      <Problem error={action.error} />{notice && <p role="status">{notice}</p>}
    </form>
  </details>
}
