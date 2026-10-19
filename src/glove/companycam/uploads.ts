import { providerEvent } from '../timeline'
import { authority } from '../access'
import { fail, newId, type Context, type Row } from '../model'
import { api, CompanyCamError, digest, photoBytes, providerId } from './client'

export const uploadsFor = async (db: D1Database, jobId: string) => (await db.prepare('SELECT id,project_id AS projectId,capture_id AS captureId,phase,remote_id AS photoId,caption_state AS captionState,created_at AS createdAt,updated_at AS updatedAt FROM glove_companycam_uploads WHERE job_id=? ORDER BY created_at').bind(jobId).all<Row>()).results

const existing = (db: D1Database, jobId: string, projectId: string, captureId: string) => db.prepare('SELECT * FROM glove_companycam_uploads WHERE job_id=? AND project_id=? AND capture_id=?').bind(jobId, projectId, captureId).first<Row>()
const result = (r: Row) => ({ id: r.id, captureId: r.capture_id, projectId: r.project_id, photoId: r.remote_id, phase: r.phase, captionState: r.caption_state })

/** The only POST of image bytes: a durable, authority-checked winner reserves it first. */
export async function upload(c: Context, db: D1Database, key: string, job: Row, capture: Row) {
  const projectId = job.companycam.projectId
  const prior = await existing(db, job.id, projectId, capture.id)
  if (prior) return result(prior)
  const file = await db.prepare('SELECT bytes,media_type AS mediaType,sha256 FROM glove_files WHERE id=? AND capture_id=?').bind(capture.file.fileId, capture.id).first<any>()
  if (!file) fail('NOT_FOUND', 'This job photo has no retained image bytes.', null, 404)
  const id = newId(), a = authority(c.actor)
  await db.batch([
    db.prepare(`INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN (${a.sql}) AND (SELECT version FROM glove_meta WHERE id=1)=? THEN 1 ELSE 0 END)`).bind(newId(), ...a.params, c.s.version),
    db.prepare("INSERT INTO glove_companycam_uploads(id,job_id,project_id,capture_id,sha256,phase,actor_id,created_at,updated_at) VALUES(?,?,?,?,?,'sending',?,?,?) ON CONFLICT(job_id,project_id,capture_id) DO NOTHING").bind(id, job.id, projectId, capture.id, file.sha256, c.actor.id, c.now, c.now),
    db.prepare('DELETE FROM glove_guard'),
  ])
  let row = (await existing(db, job.id, projectId, capture.id))!
  if (row.id !== id) return result(row)
  let photoId: string | null = null, captionState = 'not sent', phase = 'unknown'
  try {
    const body = new FormData()
    body.append('photo[photo_data]', new Blob([new Uint8Array(file.bytes)], { type: file.mediaType }), `glove-${capture.id}.${file.mediaType === 'image/png' ? 'png' : file.mediaType === 'image/webp' ? 'webp' : 'jpg'}`)
    const photo = (await api(key, `/projects/${projectId}/photos`, body)).data
    photoId = providerId(String(photo?.id ?? ''))
    if (String(photo.project_id) !== projectId) throw new CompanyCamError(0)
    await db.prepare("UPDATE glove_companycam_uploads SET remote_id=?,phase='uploaded',updated_at=? WHERE id=?").bind(photoId, c.now, id).run()
    if (capture.caption) {
      captionState = 'outcome unknown'
      await db.prepare("UPDATE glove_companycam_uploads SET phase='captioning',caption_state=?,updated_at=? WHERE id=?").bind(captionState, c.now, id).run()
      const authorityNow = authority(c.actor)
      const live = await db.prepare(`SELECT CASE WHEN (${authorityNow.sql}) THEN 1 ELSE 0 END AS ok`).bind(...authorityNow.params).first<{ ok: number }>()
      if (!live?.ok) throw new CompanyCamError(0)
      await api(key, `/photos/${photoId}/descriptions`, { description: { content: capture.caption } })
      captionState = 'confirmed'
    }
    phase = 'complete'
  } catch { /* A lost or refused outcome is never retried. Its reservation remains. */ }
  await db.batch([
    db.prepare('UPDATE glove_companycam_uploads SET remote_id=?,phase=?,caption_state=?,updated_at=? WHERE id=?').bind(photoId, phase, captionState, c.now, id),
    providerEvent(db, { id: `${id}:outcome`, at: c.now, commandId: c.commandId, provider: 'CompanyCam', jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'companycam.uploadOutcome', summary: `CompanyCam photo upload: ${phase}; caption ${captionState}`, data: { projectId, captureId: capture.id, photoId, phase, captionState } }),
  ])
  row = (await existing(db, job.id, projectId, capture.id))!
  return result(row)
}

/** Owner-only reconciliation is checked by the command door, then proves exact original bytes. */
export async function reconcile(c: Context, db: D1Database, key: string, job: Row, capture: Row, photoId: string) {
  const row = await existing(db, job.id, job.companycam.projectId, capture.id) ?? fail('NOT_FOUND', 'No reserved upload exists for this photo.', null, 404)
  const photo = (await api(key, `/photos/${providerId(photoId)}`)).data
  if (String(photo?.project_id) !== job.companycam.projectId) fail('COMPANYCAM_PHOTO', 'That photo belongs to a different CompanyCam project.')
  const original = await photoBytes(photo)
  if (await digest(original.bytes) !== row.sha256) fail('COMPANYCAM_PHOTO', 'That CompanyCam photo does not match the original Glove photo bytes.')
  c.sql.push({ sql: "UPDATE glove_companycam_uploads SET remote_id=?,phase='confirmed by owner',updated_at=? WHERE id=?", params: [photoId, c.now, row.id] })
  return { ...result(row), photoId, phase: 'confirmed by owner' }
}
