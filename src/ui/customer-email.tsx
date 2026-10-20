import { useState } from 'react'
import type { Glove, Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'

/** COMM-001: the owner connects customer email; the keys are installation secrets, never shown again. */
export function CustomerEmailConnect({ s, run }: { s: Glove; run: Run }) {
  const action = useAction(), [form, setForm] = useState({ provider: 'sendgrid', apiKey: '', eventKey: '', fromEmail: '', fromName: '' })
  if (!can(s.actor, 'mail.connect') || !s.business.length) return null
  const mail = s.business[0].mail, set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })
  return <section className="panel"><h2>Customer email</h2>
    <p className="muted">{mail ? `Emails go through ${mail.provider === 'resend' ? 'Resend' : 'SendGrid'} from ${mail.fromEmail}. Point its event webhook at ${typeof window === 'undefined' ? '' : window.location.origin}/api/glove/mail/events so deliveries and bounces show here.` : 'Connect SendGrid or Resend to email quotes, invoices, purchase orders and booking links. Glove does not check your domain itself; the provider refuses mail from a domain it has not verified.'}</p>
    <form onSubmit={e => { e.preventDefault(); void action.act(run('mail.connect', form), () => setForm({ ...form, apiKey: '', eventKey: '' })) }}>
      <div className="form-grid">
        <Field label="Email provider">{p => <select {...p} value={form.provider} onChange={set('provider')}><option value="sendgrid">SendGrid</option><option value="resend">Resend</option></select>}</Field>
        <Field label="From address" hint="On your verified sending domain.">{p => <input {...p} type="email" value={form.fromEmail} onChange={set('fromEmail')} required />}</Field>
        <Field label="From name">{p => <input {...p} value={form.fromName} onChange={set('fromName')} />}</Field>
        <Field label="API key" hint="Kept as an installation secret; never included in exports.">{p => <input {...p} type="password" value={form.apiKey} onChange={set('apiKey')} autoComplete="off" required />}</Field>
        <Field label="Event webhook verification key" hint={form.provider === 'resend' ? 'The webhook signing secret (whsec_…).' : 'The Signed Event Webhook public key.'}>{p => <input {...p} type="password" value={form.eventKey} onChange={set('eventKey')} autoComplete="off" required />}</Field>
      </div>
      <div className="actions"><button type="submit">Save customer email</button>{mail && <button type="button" onClick={() => action.act(run('mail.connect', { provider: null }))}>Disconnect customer email</button>}</div>
    </form><Problem error={action.error} />
  </section>
}
