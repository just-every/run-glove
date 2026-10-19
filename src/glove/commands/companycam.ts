import { Buffer } from 'node:buffer'
import { fail, text, find, expectVersion, bump, put, event, newId, business, Problem, type Context, type Row } from '../model'
import { image } from './field'
import { api, addressText, addressKey, photoBytes, providerId, digest, CompanyCamError } from '../companycam/client'
import { upload, reconcile } from '../companycam/uploads'
import type { Handler } from './types'

const photoCaption = (photo: any) => typeof photo.description?.plain_text_content === 'string' ? photo.description.plain_text_content.slice(0, 2000) : ''
const linked = (job: Row) => job.companycam?.projectId ?? fail('COMPANYCAM', 'Link this job to its CompanyCam project first.')
const keyFor = async (db: D1Database, s: Context['s']) => {
  const key = s.business[0]?.companycam && (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='companycam'").first<{ value: string }>())?.value
  return key || fail('COMPANYCAM', 'The owner connects a CompanyCam access token first.')
}
const log = (c: Context, job: Row, kind: string, summary: string, data: unknown) => event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: `companycam.${kind}`, summary, data })

async function pull(c: Context, db: D1Database, key: string, job: Row) {
  const projectId = linked(job), imported: string[] = [], errors: { photoId: string; message: string }[] = []
  const exported = new Set((await db.prepare('SELECT remote_id FROM glove_companycam_uploads WHERE job_id=? AND remote_id IS NOT NULL').bind(job.id).all<any>()).results.map(r => r.remote_id))
  const uncertainHashes = new Set((await db.prepare("SELECT sha256 FROM glove_companycam_uploads WHERE job_id=? AND phase NOT IN ('complete','confirmed by owner')").bind(job.id).all<any>()).results.map(r => r.sha256))
  let cursor = ''; const cursors = new Set<string>()
  do {
    const page = await api(key, `/projects/${projectId}/photos?limit=100${cursor ? `&after=${encodeURIComponent(cursor)}` : ''}`)
    if (!Array.isArray(page.data)) fail('COMPANYCAM', 'CompanyCam returned an invalid photo list.')
    for (const photo of page.data) {
      const photoId = String(photo?.id ?? '')
      if (exported.has(photoId) || c.s.captures.some(x => x.jobId === job.id && x.origin?.system === 'CompanyCam' && x.origin.photoId === photoId)) continue
      try {
        providerId(photoId)
        if (String(photo.project_id) !== projectId) fail('COMPANYCAM_PHOTO', 'The photo belongs to a different project.')
        if (photo.status !== 'active' || photo.processing_status !== 'processed') fail('COMPANYCAM_PHOTO', 'The photo is not an active, processed image yet.')
        const capturedAt = typeof photo.captured_at === 'string' && Number.isFinite(Date.parse(photo.captured_at)) ? new Date(photo.captured_at).toISOString() : fail('COMPANYCAM_PHOTO', 'CompanyCam supplied no valid capture time.')
        const source = await photoBytes(photo), id = newId()
        if (uncertainHashes.has(await digest(source.bytes))) fail('COMPANYCAM_PHOTO', 'These bytes match an upload with an unknown outcome. Reconcile that Glove photo before importing it.')
        const file = await image(c, { mediaType: source.mediaType, base64: Buffer.from(source.bytes).toString('base64') }, id, 'CompanyCam photo')
        put(c.s, 'captures', { id, version: 1, createdAt: c.now, jobId: job.id, visitId: null, technicianId: null, kind: 'photo', deviceTime: capturedAt, receivedAt: c.now, late: false, caption: photoCaption(photo), file, origin: { system: 'CompanyCam', projectId, photoId, capturedAt } })
        imported.push(photoId)
      } catch (error) {
        if (!(error instanceof Problem)) throw error
        errors.push({ photoId, message: error.message })
      }
    }
    cursor = page.meta?.has_next ? text(page.meta.next_cursor, 'CompanyCam next cursor', { max: 1000 }) : ''
    if (cursor && cursors.has(cursor)) fail('COMPANYCAM', 'CompanyCam repeated a pagination cursor; no partial import was committed.')
    cursors.add(cursor)
  } while (cursor)
  const outcome = { imported, errors, at: c.now }
  bump(c.s, 'jobs', job, { companycam: { ...job.companycam, lastPull: outcome } })
  log(c, job, 'imported', `CompanyCam: imported ${imported.length} photo${imported.length === 1 ? '' : 's'}; ${errors.length} photo error${errors.length === 1 ? '' : 's'}`, { projectId, ...outcome })
  return outcome
}

export const companycam: Handler = async (c, type, p, db) => {
  if (!type.startsWith('companycam.')) return undefined
  try {
    if (type === 'companycam.connect') {
      const b = business(c.s)
      c.sql.push(p.key === null ? { sql: "DELETE FROM glove_provider_keys WHERE provider='companycam'", params: [] } : { sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('companycam',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [text(p.key, 'key', { max: 4000 }), c.actor.id, c.now] })
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: p.key === null ? 'companycam.disconnected' : 'companycam.configured', summary: p.key === null ? 'CompanyCam disconnected' : 'CompanyCam token saved; not yet verified', data: null })
      return bump(c.s, 'business', b, { companycam: p.key === null ? null : { configuredAt: c.now, by: c.actor.name } })
    }
    const job = find(c.s, 'jobs', p.jobId)
    expectVersion(job, p.version)
    const key = await keyFor(db, c.s)
    if (type === 'companycam.link') {
      const projectId = providerId(p.projectId), project = (await api(key, `/projects/${projectId}`)).data
      const address = addressText(project?.address), site = find(c.s, 'sites', job.siteId)
      if (String(project?.id) !== projectId || !address || addressKey(address) !== addressKey(site.address)) fail('COMPANYCAM_ADDRESS', 'The CompanyCam project address does not match this job’s site address.', { projectAddress: address, siteAddress: site.address })
      const row = bump(c.s, 'jobs', job, { companycam: { projectId, name: text(project.name, 'CompanyCam project name', { max: 200 }), address, linkedAt: c.now, linkedBy: c.actor.id } })
      log(c, job, 'linked', `Linked CompanyCam project ${projectId}; its recorded address matches this job’s site`, { projectId, address })
      return row
    }
    linked(job)
    if (type === 'companycam.pull') return pull(c, db, key, job)
    const capture = find(c.s, 'captures', p.captureId)
    if (capture.jobId !== job.id || capture.kind !== 'photo' || !capture.file || capture.origin?.system === 'CompanyCam') fail('COMPANYCAM_PHOTO', 'Choose an original Glove photo on this job.')
    const outcome = type === 'companycam.send' ? await upload(c, db, key, job, capture) : type === 'companycam.reconcile' ? await reconcile(c, db, key, job, capture, providerId(p.photoId)) : fail('COMMAND', 'Unknown CompanyCam command.', null, 400)
    log(c, job, 'export', outcome.phase === 'complete' || outcome.phase === 'confirmed by owner' ? `CompanyCam photo ${outcome.photoId}: ${outcome.phase}; caption ${outcome.captionState}` : 'CompanyCam upload outcome unknown; check CompanyCam. This photo will not be uploaded again.', outcome)
    return outcome
  } catch (error) {
    if (error instanceof CompanyCamError) return fail('COMPANYCAM', error.message, { status: error.status }, 502)
    throw error
  }
}
