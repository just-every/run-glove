import { useState } from 'react'
import type { Glove, Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'
const providerName = (value: string) => ({ sendgrid: 'SendGrid', resend: 'Resend', postmark: 'Postmark', ses: 'Amazon SES' }[value] ?? 'The email provider')

/** COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018: the owner connects customer email; the keys are installation secrets, never shown again. */
export function CustomerEmailConnect({ s, run }: { s: Glove; run: Run }) {
  const action = useAction(), [credential, setCredential] = useState(''), [form, setForm] = useState({ provider: 'sendgrid', apiKey: '', eventKey: '', fromEmail: '', fromName: '', region: '', topicArn: '', configurationSet: '' })
  if (!can(s.actor, 'mail.connect') || !s.business.length) return null
  const mail = s.business[0].mail, set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })
  return <section className="panel"><h2>Customer email</h2>
    <p className="muted">{mail ? `Emails go through ${providerName(mail.provider)} from ${mail.fromEmail}. Point its event webhook at ${typeof window === 'undefined' ? '' : window.location.origin}/api/glove/mail/events so deliveries and bounces show here.` : 'Connect SendGrid, Resend, Postmark or Amazon SES to email quotes, invoices, purchase orders and booking links. Glove does not check your domain itself; the provider refuses mail from a domain it has not verified.'}</p>
    <form onSubmit={e => { e.preventDefault(); setCredential(''); void action.act(run('mail.connect', { ...form, ...(form.provider === 'ses' ? { sns: { region: form.region, topicArn: form.topicArn, configurationSet: form.configurationSet } } : {}) }).then(r => { if (r.ok) setCredential(r.result.callbackPassword ?? ''); return r }), () => setForm({ ...form, apiKey: '', eventKey: '' })) }}>
      <div className="form-grid">
        <Field label="Email provider">{p => <select {...p} value={form.provider} onChange={set('provider')}><option value="sendgrid">SendGrid</option><option value="resend">Resend</option><option value="postmark">Postmark</option><option value="ses">Amazon SES</option></select>}</Field>
        <Field label="From address" hint="On your verified sending domain.">{p => <input {...p} type="email" value={form.fromEmail} onChange={set('fromEmail')} required />}</Field>
        <Field label="From name">{p => <input {...p} value={form.fromName} onChange={set('fromName')} />}</Field>
        <Field label="API key" hint={form.provider === 'ses' ? 'AWS credential JSON: accessKeyId, secretAccessKey and optional sessionToken. Kept as an installation secret.' : 'Kept as an installation secret; never included in exports.'}>{p => <input {...p} type="password" value={form.apiKey} onChange={set('apiKey')} autoComplete="off" required />}</Field>
        {['sendgrid', 'resend'].includes(form.provider) && <Field label="Event webhook verification key" hint={form.provider === 'resend' ? 'The webhook signing secret (whsec_…).' : 'The Signed Event Webhook public key.'}>{p => <input {...p} type="password" value={form.eventKey} onChange={set('eventKey')} autoComplete="off" required />}</Field>}
        {form.provider === 'ses' && <><Field label="AWS region">{p => <input {...p} value={form.region} onChange={set('region')} required />}</Field><Field label="SNS topic ARN">{p => <input {...p} value={form.topicArn} onChange={set('topicArn')} required />}</Field><Field label="SES configuration set" hint="Use SNS signature version 2 and turn raw-message delivery off.">{p => <input {...p} value={form.configurationSet} onChange={set('configurationSet')} required />}</Field></>}
      </div>
      <div className="actions"><button type="submit">Save customer email</button>{mail && <button type="button" onClick={() => { setCredential(''); void action.act(run('mail.connect', { provider: null })) }}>Disconnect customer email</button>}</div>
    </form><Problem error={action.error} />
    {mail && <p>{s.mailCallbacks?.verifiedAt ? `Last verified event at ${s.mailCallbacks.verifiedAt}` : 'No verified delivery event yet.'}</p>}
    {mail && s.mailCallbacks?.warning && <p role="alert">{s.mailCallbacks.warning}</p>}
    {credential && <div role="status"><p>Postmark callback password — shown once. Use HTTP Basic username glove. Save it in Postmark before leaving this screen.</p><output style={{ overflowWrap: 'anywhere' }}>{credential}</output><button type="button" onClick={() => setCredential('')}>Hide callback password</button></div>}
    {mail?.provider === 'postmark' && <div><p>Basic authentication is required. The optional IP allowlist is {mail.postmarkAllowlist ? 'on' : 'off'}. {s.mailCallbacks?.previousUntil ? `Previous credential valid until ${s.mailCallbacks.previousUntil}.` : 'No previous credential is active.'}</p><div className="actions"><button type="button" onClick={() => { setCredential(''); void action.act(run('mail.callback', { action: 'rotate' }).then(r => { if (r.ok) setCredential(r.result.callbackPassword ?? ''); return r })) }}>Rotate callback credential</button><button type="button" onClick={() => action.act(run('mail.callback', { action: 'revokePrevious' }))}>Revoke previous credential</button><button type="button" onClick={() => action.act(run('mail.callback', { action: 'allowlist', enabled: !mail.postmarkAllowlist }))}>{mail.postmarkAllowlist ? 'Turn off IP allowlist' : 'Turn on IP allowlist'}</button></div></div>}
    {mail && <MorningEmail mail={mail} run={run} />}
  </section>
}

/** COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 / AGENT-008, AGENT-016: the owner's opt-in morning brief email, once per business-local date. */
function MorningEmail({ mail, run }: { mail: { morning?: { enabled: boolean; time: string } }; run: Run }) {
  const action = useAction(), on = !!mail.morning?.enabled, [time, setTime] = useState(mail.morning?.time ?? '07:00')
  return <form aria-label="Morning brief email" onSubmit={e => { e.preventDefault(); void action.act(run('mail.morning', { enabled: true, time })) }}>
    <h3>Morning brief email</h3>
    <p className="muted">{on ? `The morning brief is emailed to your sign-in address once each day, at the first scheduled check at or after ${mail.morning!.time} business time.` : 'Off: the brief is only shown when you open Glove. Turn it on to have it emailed to your sign-in address once each day.'} Glove does not retry a failed send.</p>
    <div className="form-grid"><Field label="Send at (business time)">{p => <input {...p} type="time" value={time} onChange={e => setTime(e.target.value)} required />}</Field></div>
    <div className="actions"><button type="submit">{on ? 'Save time' : 'Email me the morning brief'}</button>{on && <button type="button" onClick={() => action.act(run('mail.morning', { enabled: false }))}>Turn off</button>}</div>
    <Problem error={action.error} />
  </form>
}
