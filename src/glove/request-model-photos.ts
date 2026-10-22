import { authority, roleSql } from './access'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { stripImageMetadata } from './image-metadata'
import { fail, newId, type Context, type Row } from './model'
import { requestPhotoDisclosure } from './request-photo-policy'
import { providerEvent } from './timeline'

/** Transient derivatives only: no filenames, captions, customer fields or file URLs. */
export async function requestModelPhotos(c: Context, db: D1Database, enquiry: Row) {
  const b = c.s.business[0], disclosure = b && requestPhotoDisclosure(b), consent = enquiry.intake?.photoConsent
  if (!disclosure || !consent || consent.withdrawnAt || consent.id !== disclosure.id) return null
  const ids: string[] = consent.fileIds
  if (!Array.isArray(ids) || !ids.length || ids.length > 2) fail('PHOTO_CONSENT', 'This request has no valid photo permission.')
  const images: { content: { type: 'image_url'; image_url: { url: string } }; hash: string }[] = []
  for (const id of ids) {
    const photo = enquiry.photos?.find((p: Row) => p.file.fileId === id)
    const file = photo && await db.prepare('SELECT capture_id AS captureId,media_type AS mediaType,bytes FROM glove_files WHERE id=?').bind(id).first<any>()
    if (!file || file.captureId !== enquiry.id || file.mediaType !== photo.file.mediaType) fail('PHOTO_CONSENT', 'A consented request photo is no longer available.')
    const bytes = stripImageMetadata(new Uint8Array(file.bytes), file.mediaType)
    let binary = ''
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
    images.push({ content: { type: 'image_url', image_url: { url: `data:${file.mediaType};base64,${btoa(binary)}` } }, hash: sha256(bytes) })
  }
  // The atomic authorization is the start of this transmission attempt.
  // A completed withdrawal/switch/role change wins before every later attempt.
  // An already authorized in-flight request cannot be recalled from a provider.
  const authorize = async () => {
    const guard = newId(), person = authority(c.actor), owner = b.intake.by.id
    const sql = `${person.sql} AND EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND id=? AND version=?) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='enquiries' AND id=? AND version=?) AND EXISTS(SELECT 1 FROM oa_operators WHERE id=? AND status='active') AND ${roleSql('?')}='owner' AND NOT EXISTS(SELECT 1 FROM glove_records WHERE kind='branchAccess' AND id=? AND COALESCE(json_extract(data,'$.limited'),1)<>0)`
    const fact = { id: `${c.commandId}:request-photos`, at: c.now, commandId: c.commandId, provider: 'Model provider', subjectKind: 'enquiry', subjectId: enquiry.id, kind: 'intake.photoUseAuthorized', summary: `${images.length} metadata-stripped request photos authorized for one model attempt`, data: { disclosureId: disclosure.id, count: images.length, sentHashes: images.map(i => i.hash), evidenceHash: sha256(canonicalJson(consent)) } }
    try {
      await db.batch([
        db.prepare(`INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN (${sql}) THEN 1 ELSE 0 END)`).bind(guard, ...person.params, b.id, b.version, enquiry.id, enquiry.version, owner, owner, owner, owner),
        providerEvent(db, fact), db.prepare('DELETE FROM glove_guard WHERE id=?').bind(guard),
      ])
    } catch { fail('PHOTO_CONSENT_CHANGED', 'Photo permission or authority changed before dispatch. Refresh the request before drafting again.') }
  }
  return { content: images.map(i => i.content), authorize, disclosureId: disclosure.id }
}
