import { useState } from 'react'
import { type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'
import { DocumentImage } from './document-image'

export function WebsiteRequests({ s, run }: { s: Glove; run: Run }) {
  const b = s.business[0], configured = b?.intake
  const [enabled, setEnabled] = useState(!!configured?.enabled), [siteKey, setSiteKey] = useState(configured?.siteKey ?? ''), [secret, setSecret] = useState(''), [origins, setOrigins] = useState((configured?.allowedOrigins ?? []).join('\n'))
  const [modelPhotos, setModelPhotos] = useState(!!configured?.modelPhotos?.enabled), [providerName, setProviderName] = useState(configured?.modelPhotos?.providerName ?? ''), [terms, setTerms] = useState(configured?.modelPhotos?.noTrainingTerms ?? ''), [confirmed, setConfirmed] = useState(false)
  const { error, act } = useAction()
  if (!b || !s.actor.commands.includes('intake.configure')) return null
  const origin = typeof window === 'undefined' ? '' : location.origin
  return <section className="panel" aria-label="Website requests" style={{ overflowWrap: 'anywhere' }}><h2>Website requests</h2>
    <p>Accept service requests on your site with Cloudflare Turnstile. Your office receives an in-app notice. Requests never book a visit or send a reply automatically.</p>
    <form onSubmit={e => { e.preventDefault(); void act(run('intake.configure', { version: b.version, enabled, siteKey, ...(secret ? { secret } : {}), allowedOrigins: origins.split(/\n/).map((v: string) => v.trim()).filter(Boolean), modelPhotosEnabled: modelPhotos, photoProviderName: providerName, noTrainingTerms: terms, confirmNoTraining: confirmed }), () => { setSecret(''); setConfirmed(false) }) }}>
      <label className="check-line"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Accept website requests</label>
      <Field label="Turnstile public site key">{p => <input {...p} value={siteKey} onChange={e => setSiteKey(e.target.value)} autoComplete="off" required={enabled} />}</Field>
      <Field label="Turnstile secret" hint="Stored privately in this installation; never shown or included in business exports. Enter it again after restoring to a new installation.">{p => <input {...p} type="password" value={secret} onChange={e => setSecret(e.target.value)} autoComplete="new-password" required={enabled && !configured?.enabled} />}</Field>
      <Field label="Additional website origins" hint="One exact HTTPS origin per line, for a website posting directly to the request API. The embedded form runs on this installation.">{p => <textarea {...p} value={origins} onChange={e => setOrigins(e.target.value)} placeholder="https://www.example.com" />}</Field>
      <p>Configure Turnstile for this installation’s hostname. Originals stay private to the office.</p>
      <fieldset><legend>Request photos for AI quote drafting</legend>
        <label className="check-line"><input type="checkbox" checked={modelPhotos} disabled={!enabled || !b.model} onChange={e => { setModelPhotos(e.target.checked); setConfirmed(false) }} /> Allow separately consented request photos in model drafts</label>
        <p className="muted">Off by default. Only the unscoped owner can change this setting. Each sender must choose a separate consent naming your configured provider. Sent copies have EXIF and location metadata removed; contact, address, identity fields and captions are never added with them.</p>
        {!b.model && <p>Connect your model provider before enabling photo sharing.</p>}
        {modelPhotos && <>
          <p>Configured recipient: {b.model ? new URL(b.model.url).host : 'not connected'}. A provider change or saving these settings invalidates earlier photo permissions. Store-off alone does not prohibit training. Reconfirm the agreement before each save while photo sharing is on.</p>
          <Field label="Model provider name shown to senders">{p => <input {...p} value={providerName} onChange={e => setProviderName(e.target.value)} required={enabled && modelPhotos} maxLength={120} />}</Field>
          <Field label="Agreed provider terms prohibiting photo training" hint="Enter the applicable prohibition under your provider agreement. Do not enter credentials or customer information.">{p => <textarea {...p} value={terms} onChange={e => { setTerms(e.target.value); setConfirmed(false) }} required={enabled && modelPhotos} maxLength={4000} />}</Field>
          <label className="check-line"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} required={enabled && modelPhotos} /> I confirm these agreed terms bind this provider account and prohibit training on request photos.</label>
        </>}
      </fieldset>
      <Problem error={error} /><div className="actions"><button className="primary">Save website request settings</button></div>
    </form>
    {configured?.enabled && <><p><a href="/request" target="_blank" rel="noopener noreferrer">Open request form</a></p><Field label="Embed on your website">{p => <textarea {...p} readOnly rows={3} value={`<script src="${origin}/glove-request.js" data-source="website" defer></script>`} />}</Field><p>For Pane, WordPress, Squarespace or another site, paste the script where requests belong, or link directly to <code>{origin}/request</code>.</p></>}
  </section>
}

export function RequestPhotos({ enquiry, s, run }: { enquiry: Rec; s: Glove; run: Run }) {
  const [reason, setReason] = useState(''), [confirmed, setConfirmed] = useState(false)
  const { error, act } = useAction()
  if (!enquiry.intake) return null
  const consent = enquiry.intake.photoConsent
  return <section aria-label="Website request details"><p>Preferred times: {enquiry.intake.preferredTimes || 'Not specified'}</p><p>Contact supplied: {enquiry.intake.contact.name} · {enquiry.intake.contact.phone || enquiry.intake.contact.email}</p>
    <p>Website source: {enquiry.intake.source || 'website'}</p>
    {!!enquiry.photos?.length && <details><summary>{enquiry.photos.length} request photos · office only</summary><div className="form-grid two">{enquiry.photos.map((photo: Rec) => <figure key={photo.file.fileId} style={{ margin: 0 }}><DocumentImage file={photo.file} alt={photo.caption || 'Customer request photo'} />{photo.caption && <figcaption>{photo.caption}</figcaption>}</figure>)}</div></details>}
    <p className="muted">Submitted with permission to contact the sender about this work. {!consent ? 'Request photos are excluded from AI quote drafting.' : consent.withdrawnAt ? `Model photo permission withdrawn on ${consent.withdrawnAt}. Originals remain private to the office.` : `Separate photo permission recorded for ${consent.providerName} (${consent.providerHost}). Current owner and provider permissions are checked before every call.`}</p>
    {consent && !consent.withdrawnAt && s.actor.commands.includes('intake.withdrawPhotos') && <form aria-label="Withdraw model photo permission" onSubmit={e => { e.preventDefault(); void act(run('intake.withdrawPhotos', { enquiryId: enquiry.id, version: enquiry.version, senderRequested: confirmed, reason })) }}>
      <Field label="Sender withdrawal request" hint="Record how the sender asked the office to stop sharing these photos.">{p => <textarea {...p} value={reason} onChange={e => setReason(e.target.value)} required maxLength={1000} />}</Field>
      <label className="check-line"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} required /> The sender requested withdrawal from future model calls.</label>
      <Problem error={error} /><button>Withdraw model photo permission</button>
    </form>}
  </section>
}

export function WebsiteRequestNotices({ s }: { s: Glove }) {
  const notices = (s.notices ?? []).filter(n => n.enquiryId).slice(-5).reverse()
  if (!notices.length) return null
  return <section className="notice prepared" aria-label="Website request notices"><strong>New website requests</strong><ul>{notices.map(n => <li key={n.id}><a href="#quotes">{n.message}</a></li>)}</ul></section>
}
