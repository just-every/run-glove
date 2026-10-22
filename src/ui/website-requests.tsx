import { useState } from 'react'
import { type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'
import { DocumentImage } from './document-image'

export function WebsiteRequests({ s, run }: { s: Glove; run: Run }) {
  const b = s.business[0], configured = b?.intake
  const [enabled, setEnabled] = useState(!!configured?.enabled), [siteKey, setSiteKey] = useState(configured?.siteKey ?? ''), [secret, setSecret] = useState(''), [origins, setOrigins] = useState((configured?.allowedOrigins ?? []).join('\n'))
  const { error, act } = useAction()
  if (!b || !s.actor.commands.includes('intake.configure')) return null
  const origin = typeof window === 'undefined' ? '' : location.origin
  return <section className="panel" aria-label="Website requests" style={{ overflowWrap: 'anywhere' }}><h2>Website requests</h2>
    <p>Accept service requests on your site with Cloudflare Turnstile. Your office receives an in-app notice. Requests never book a visit or send a reply automatically.</p>
    <form onSubmit={e => { e.preventDefault(); void act(run('intake.configure', { version: b.version, enabled, siteKey, ...(secret ? { secret } : {}), allowedOrigins: origins.split(/\n/).map((v: string) => v.trim()).filter(Boolean) }), () => setSecret('')) }}>
      <label className="check-line"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Accept website requests</label>
      <Field label="Turnstile public site key">{p => <input {...p} value={siteKey} onChange={e => setSiteKey(e.target.value)} autoComplete="off" required={enabled} />}</Field>
      <Field label="Turnstile secret" hint="Stored privately in this installation; never shown or included in business exports. Enter it again after restoring to a new installation.">{p => <input {...p} type="password" value={secret} onChange={e => setSecret(e.target.value)} autoComplete="new-password" required={enabled && !configured?.enabled} />}</Field>
      <Field label="Additional website origins" hint="One exact HTTPS origin per line, for a website posting directly to the request API. The embedded form runs on this installation.">{p => <textarea {...p} value={origins} onChange={e => setOrigins(e.target.value)} placeholder="https://www.example.com" />}</Field>
      <p>Configure Turnstile for this installation’s hostname. Photos stay with the office and are excluded from model quote drafting while the request-photo policy awaits approval.</p>
      <Problem error={error} /><div className="actions"><button className="primary">Save website request settings</button></div>
    </form>
    {configured?.enabled && <><p><a href="/request" target="_blank" rel="noopener noreferrer">Open request form</a></p><Field label="Embed on your website">{p => <textarea {...p} readOnly rows={3} value={`<script src="${origin}/glove-request.js" data-source="website" defer></script>`} />}</Field><p>For Pane, WordPress, Squarespace or another site, paste the script where requests belong, or link directly to <code>{origin}/request</code>.</p></>}
  </section>
}

export function RequestPhotos({ enquiry }: { enquiry: Rec }) {
  if (!enquiry.intake) return null
  return <section aria-label="Website request details"><p>Preferred times: {enquiry.intake.preferredTimes || 'Not specified'}</p><p>Contact supplied: {enquiry.intake.contact.name} · {enquiry.intake.contact.phone || enquiry.intake.contact.email}</p>
    <p>Website source: {enquiry.intake.source || 'website'}</p>
    {!!enquiry.photos?.length && <details><summary>{enquiry.photos.length} request photos · office only</summary><div className="form-grid two">{enquiry.photos.map((photo: Rec) => <figure key={photo.file.fileId} style={{ margin: 0 }}><DocumentImage file={photo.file} alt={photo.caption || 'Customer request photo'} />{photo.caption && <figcaption>{photo.caption}</figcaption>}</figure>)}</div></details>}
    <p className="muted">Submitted with permission to contact the sender about this work. Request photos are excluded from AI quote drafting.</p>
  </section>
}

export function WebsiteRequestNotices({ s }: { s: Glove }) {
  const notices = (s.notices ?? []).filter(n => n.enquiryId).slice(-5).reverse()
  if (!notices.length) return null
  return <section className="notice prepared" aria-label="Website request notices"><strong>New website requests</strong><ul>{notices.map(n => <li key={n.id}><a href="#quotes">{n.message}</a></li>)}</ul></section>
}
