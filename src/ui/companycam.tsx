import { useEffect, useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'

export function CompanyCamConnect({ s, run }: { s: Glove; run: Run }) {
  const [key, setKey] = useState(''), action = useAction()
  if (!can(s.actor, 'companycam.connect') || !s.business.length) return null
  return <section className="panel"><h2>CompanyCam</h2><p className="muted">{s.companycamConfigured ? 'Access token saved. Link a job to check its project and import or send photos.' : 'Connect your CompanyCam account, then link a job to its existing project.'}</p>
    <form onSubmit={e => { e.preventDefault(); void action.act(run('companycam.connect', { key }), () => setKey('')) }}>
      <Field label="CompanyCam access token" hint="Kept as an installation secret; never included in exports.">{p => <input {...p} type="password" value={key} onChange={e => setKey(e.target.value)} autoComplete="off" required />}</Field>
      <div className="actions"><button type="submit">Save CompanyCam token</button>{s.companycamConfigured && <button type="button" onClick={() => action.act(run('companycam.connect', { key: null }))}>Disconnect CompanyCam</button>}</div>
    </form><Problem error={action.error} />
  </section>
}

const known = (phase: string) => ['complete', 'confirmed by owner'].includes(phase)

export function CompanyCamJob({ s, job, run }: { s: Glove; job: Rec; run: Run }) {
  const [projectId, setProjectId] = useState(''), [uploads, setUploads] = useState<Rec[]>([]), [result, setResult] = useState<any>(null)
  const action = useAction(), [revision, setRevision] = useState(0)
  const enabled = can(s.actor, 'companycam.link')
  useEffect(() => {
    if (!enabled || !job.companycam) return
    let live = true
    void fetch(`/api/glove/jobs/${job.id}/companycam`, { credentials: 'same-origin', cache: 'no-store' }).then(r => r.ok ? r.json() as Promise<{ uploads: Rec[] }> : null).then(body => { if (live && body) setUploads(body.uploads) })
    return () => { live = false }
  }, [enabled, job.id, s.version, revision])
  if (!enabled) return null
  if (!s.companycamConfigured) return <section className="job-time"><h3>CompanyCam</h3><p className="muted">The owner connects CompanyCam under Team to exchange job photos.</p></section>
  const photos = s.captures.filter(c => c.jobId === job.id && c.kind === 'photo' && c.origin?.system !== 'CompanyCam')
  const sent = (captureId: string) => uploads.find(u => u.projectId === job.companycam?.projectId && u.captureId === captureId)
  const finish = (value: any) => { setResult(value); setRevision(v => v + 1) }
  return <section className="job-time companycam-photos" aria-label="CompanyCam photos"><h3>CompanyCam photos</h3>
    {job.companycam ? <><p><strong>{job.companycam.name}</strong> · project {job.companycam.projectId}</p><p className="muted">{job.companycam.address} · recorded address matches this site</p>
      <button onClick={() => action.act(run('companycam.pull', { jobId: job.id, version: job.version }), finish)}>Import CompanyCam photos</button>
      <p className="muted">Imports retain CompanyCam’s capture time and label. Glove’s JPEG, PNG or WebP and 1.5 MB limits apply; each refused photo is listed below.</p>
      {job.companycam.lastPull && <p>Last import: {job.companycam.lastPull.imported.length} new photos; {job.companycam.lastPull.errors.length} errors.</p>}
      {(result?.errors ?? job.companycam.lastPull?.errors ?? []).map((e: any) => <p key={e.photoId} className="problem">CompanyCam photo {e.photoId}: {e.message}</p>)}
      {photos.length > 0 && <><h4>Send a Glove photo</h4><p className="muted">Sends only this photo and caption to the linked project.</p><ul className="rows">{photos.map(photo => { const transfer = sent(photo.id); return <li key={photo.id}><div><strong>{photo.caption || 'Job photo'}</strong>{transfer && <p>{known(transfer.phase) ? `CompanyCam photo ${transfer.photoId} · ${transfer.phase}; caption ${transfer.captionState}` : 'Upload outcome unknown; check CompanyCam. This photo will not be uploaded again.'}</p>}{transfer && !known(transfer.phase) && can(s.actor, 'companycam.reconcile') && <Reconcile job={job} photo={photo} run={run} done={finish} />}</div>{!transfer && <button onClick={() => action.act(run('companycam.send', { jobId: job.id, version: job.version, captureId: photo.id }), finish)}>Send photo</button>}</li> })}</ul></>}
    </> : <form onSubmit={e => { e.preventDefault(); void action.act(run('companycam.link', { jobId: job.id, version: job.version, projectId }), finish) }}>
      <Field label="CompanyCam project ID" hint="Use an existing project at exactly this site’s recorded address.">{p => <input {...p} value={projectId} onChange={e => setProjectId(e.target.value)} inputMode="numeric" pattern="[0-9]+" required />}</Field><button type="submit">Link CompanyCam project</button>
    </form>}
    <Problem error={action.error} />
  </section>
}

function Reconcile({ job, photo, run, done }: { job: Rec; photo: Rec; run: Run; done: (r: any) => void }) {
  const [photoId, setPhotoId] = useState(''), action = useAction()
  return <form onSubmit={e => { e.preventDefault(); void action.act(run('companycam.reconcile', { jobId: job.id, version: job.version, captureId: photo.id, photoId }), done) }}>
    <Field label="Existing CompanyCam photo ID" hint="Checks the same project and exact original bytes. Does not upload again or claim an unconfirmed caption.">{p => <input {...p} value={photoId} onChange={e => setPhotoId(e.target.value)} inputMode="numeric" pattern="[0-9]+" required />}</Field><button type="submit">Reconcile existing photo</button><Problem error={action.error} />
  </form>
}
