import { useState } from 'react'
import type { Glove, Run } from './api'
import { Field, Problem, useAction } from './controls'

export function QuickBooksOAuth({ s, run }: { s: Glove; run: Run }) {
  const [mode, setMode] = useState('sandbox'), [clientId, setClientId] = useState(''), [clientSecret, setClientSecret] = useState(''), [approved, setApproved] = useState(false), [authorize, setAuthorize] = useState(false)
  const action = useAction(), configured = s.qboStatus?.appConfigured
  const labels: Record<string, string> = { disconnected: 'No company is connected.', manual: 'Sandbox uses the manually supplied token.', authorized: 'Company authorization is current.', 'refresh-required': 'Access token expired or nearing expiry. The next explicit Owner request refreshes it; no accounting action runs automatically.', expired: 'Authorization expired. Authorize the company again.', reconnect: 'Private authorization is unavailable or unresolved. Authorize again; restore grants no provider access.' }
  const notice = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('qbo')
  return <section aria-label="QuickBooks app authorization"><h3>Intuit app authorization</h3>
    <p>{labels[s.qboStatus?.state ?? 'disconnected']}</p>
    {notice && <p role="status">{notice === 'authorized' ? 'Company authorized. Review existing records before posting.' : 'Authorization did not complete. Review the app configuration and explicitly authorize again.'}</p>}
    {!configured && s.business[0]?.qboOAuth && <p>Saved app metadata has no private credentials. Configure the app again after restore.</p>}
    <details><summary>Configure your Intuit app</summary><form onSubmit={e => { e.preventDefault(); void action.act(run('qbo.connect', { version: s.business[0].version, confirm: approved, oauth: { mode, clientId, clientSecret } }), () => { setClientId(''); setClientSecret(''); setApproved(false) }) }}>
      <Field label="Intuit app environment">{p => <select {...p} value={mode} onChange={e => setMode(e.target.value)}><option value="sandbox">Sandbox</option><option value="production">Production</option></select>}</Field>
      <Field label="Intuit app client ID">{p => <input {...p} value={clientId} onChange={e => setClientId(e.target.value)} autoComplete="off" required />}</Field>
      <Field label="Intuit app client secret">{p => <input {...p} type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} autoComplete="off" required />}</Field>
      <p>Register this installation’s callback in the matching Intuit app environment: {typeof window !== 'undefined' ? `${window.location.origin}/api/glove/qbo/callback` : '/api/glove/qbo/callback'}. Production requires HTTPS.</p>
      <label className="check-line"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} /> I approve this Intuit app configuration and environment.</label>
      <button type="submit" disabled={!approved}>Save private Intuit app settings</button>
    </form></details>
    {configured && <form method="post" action="/api/glove/qbo/authorize"><label className="check-line"><input type="checkbox" name="confirm" value="yes" checked={authorize} onChange={e => setAuthorize(e.target.checked)} required /> I approve continuing to Intuit to select and authorize a company.</label><button type="submit" disabled={!authorize}>Authorize QuickBooks company</button></form>}
    <p className="muted">Only accounting access is requested. Company authorization creates no accounting post. Existing record review and explicit posting approvals remain required.</p>
    <Problem error={action.error} />
  </section>
}
