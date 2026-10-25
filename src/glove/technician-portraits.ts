import { allow, roleSql } from './access'
import { image } from './commands/field'
import type { Handler } from './commands/types'
import { stripImageMetadata } from './image-metadata'
import { bump, business, event, expectVersion, fail, type Context, type Row } from './model'
import { sha256 } from '../modules/import-kit/src/d1/index'

const tokenHash = (token: string) => sha256(`glove-technician-portrait:${token}`)
const headers = { 'cache-control': 'no-store, private', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow', vary: 'Authorization, Accept' }
const unavailable = () => Response.json({ error: { code: 'PORTRAIT_LINK', message: 'This technician photo is unavailable or has expired.' } }, { status: 404, headers })

async function portraitImage(c: Context, photo: any, technicianId: string) {
  if (!['image/png', 'image/jpeg'].includes(photo?.mediaType) || typeof photo?.base64 !== 'string' || photo.base64.length > 2_000_000 || photo.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(photo.base64)) fail('FILE', 'Choose a PNG or JPEG photo up to 1.5 MB.', null, 400)
  const bytes = Uint8Array.from(atob(photo.base64), ch => ch.charCodeAt(0))
  const clean = stripImageMetadata(bytes, photo.mediaType)
  let encoded = ''
  for (let i = 0; i < clean.length; i += 8192) encoded += String.fromCharCode(...clean.subarray(i, i + 8192))
  return image(c, { mediaType: photo.mediaType, base64: btoa(encoded) }, technicianId, 'portrait')
}

/** Only the subject can upload and consent. Every replacement or withdrawal
 * removes the previous original and immediately closes all issued links. */
export const technicianPortraits: Handler = async (c, type, p) => {
  if (type !== 'technician.portrait') return undefined
  allow(c.actor, type)
  if (c.actor.role !== 'technician' || !c.actor.sessionId || c.actor.token || c.actor.custom) fail('FORBIDDEN', 'Only the signed-in technician manages their own customer photo.', null, 403)
  const tech = c.s.technicians.find(t => t.operatorId === c.actor.id && t.active) ?? fail('TECHNICIAN', 'Your sign-in must be linked to an active technician.', null, 403)
  if (p.technicianId !== undefined && p.technicianId !== tech.id) fail('FORBIDDEN', 'You manage only your own photo.', null, 403)
  expectVersion(tech, p.version)
  if (typeof p.enabled !== 'boolean' || p.enabled && p.consent !== true || !p.enabled && p.photo !== undefined) fail('CONSENT', 'Explicitly consent to sharing your own photo, or stop sharing.', null, 400)
  if (p.enabled && !p.photo) fail('FILE', 'Choose your PNG or JPEG photo before consenting.', null, 400)
  const file = p.enabled ? await portraitImage(c, p.photo, tech.id) : null
  c.sql.push({ sql: 'DELETE FROM glove_status_photo_links WHERE technician_id=?', params: [tech.id] })
  if (tech.portrait?.file?.fileId) c.sql.push({ sql: 'DELETE FROM glove_files WHERE id=? AND capture_id=?', params: [tech.portrait.file.fileId, tech.id] })
  const row = bump(c.s, 'technicians', tech, { portrait: { enabled: p.enabled, file, at: c.now, by: c.actor.id, disclosure: 'customer-portrait-v1' } })
  event(c, { jobId: null, subjectKind: 'technician', subjectId: tech.id, kind: type, summary: p.enabled ? `${tech.name} uploaded their photo and consented to two-hour customer sharing in on-my-way texts` : `${tech.name} withdrew customer photo sharing and removed their photo`, data: { enabled: p.enabled, disclosure: 'customer-portrait-v1' } })
  return { id: row.id, version: row.version, portrait: row.portrait }
}

/** The bearer exists only in the caller's SMS body, never a record or outcome.
 * The caller supplies the very same message ID to queueSms in this commit. */
export function reservePortraitLink(c: Context, tech: Row, visit: Row, messageId: string): string {
  const portrait = tech.portrait, policy = business(c.s).visitNotices
  if (c.actor.role !== 'technician' || !c.actor.sessionId || c.actor.token || c.actor.custom || tech.operatorId !== c.actor.id || !tech.active || !portrait?.enabled || portrait.by !== tech.operatorId || !portrait.file?.fileId) fail('PORTRAIT', 'Upload your own photo and consent to customer sharing before sending on my way.')
  if (visit.technicianId !== tech.id || visit.status !== 'booked' || visit.arrival || !policy?.onMyWay || !policy.approvedAt || !c.origin) fail('PORTRAIT', 'A customer photo link requires your current booked visit and owner-approved on-my-way texts.')
  const token = 'gtp_' + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  c.sql.push({ sql: 'INSERT INTO glove_status_photo_links(message_id,hash,technician_id,visit_id,file_id,expires_at,status_approved_at,assignment_count) VALUES(?,?,?,?,?,?,?,?)', params: [messageId, tokenHash(token), tech.id, visit.id, portrait.file.fileId, new Date(Date.parse(c.now) + 2 * 3600000).toISOString(), policy.approvedAt, visit.assignments.length] })
  return `\n\nYour technician’s photo (available for two hours):\n${c.origin}/technician-photo#token=${token}`
}

/** The page and image repeat the identical live SQL gate. Possession reveals
 * only the current consented photo and first name, never the visit or customer. */
export async function publicTechnicianPortrait(request: Request, db: D1Database): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/api/glove/public/technician-photo' && url.pathname !== '/api/glove/public/technician-photo/image') return null
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { ...headers, allow: 'GET' } })
  const token = /^Bearer (gtp_[A-Za-z0-9_-]{43})$/.exec(request.headers.get('authorization') ?? '')?.[1]
  if (!token || url.search) return unavailable()
  const j = (alias: string, path: string) => `json_extract(${alias}.data,'$.${path}')`
  const techOperator = j('tech', 'operatorId'), ownerId = j('b', 'visitNotices.by.id')
  const row = await db.prepare(`SELECT ${j('tech', 'name')} AS name, original.media_type AS mediaType,original.bytes AS bytes
    FROM glove_status_photo_links link
    JOIN glove_records tech ON tech.kind='technicians' AND tech.id=link.technician_id
    JOIN oa_operators operator ON operator.id=${techOperator} AND operator.status='active'
    JOIN glove_records visit ON visit.kind='visits' AND visit.id=link.visit_id
    JOIN glove_records job ON job.kind='jobs' AND job.id=${j('visit', 'jobId')}
    JOIN glove_records customer ON customer.kind='customers' AND customer.id=${j('job', 'customerId')}
    JOIN glove_records message ON message.kind='messages' AND message.id=link.message_id
    JOIN glove_records b ON b.kind='business'
    JOIN oa_operators owner ON owner.id=${ownerId} AND owner.status='active'
    JOIN glove_files original ON original.id=link.file_id AND original.capture_id=tech.id
    WHERE link.hash=? AND link.expires_at>?
    AND ${j('tech', 'active')}=1 AND ${j('tech', 'portrait.enabled')}=1
    AND ${j('tech', 'portrait.by')}=${techOperator} AND ${j('tech', 'portrait.file.fileId')}=link.file_id
    AND ${roleSql(techOperator)}='technician'
    AND ${j('visit', 'technicianId')}=tech.id AND ${j('visit', 'status')} IN ('booked','arrived')
    AND json_array_length(visit.data,'$.assignments')=link.assignment_count
    AND ${j('visit', 'onMyWay.messageId')}=message.id AND ${j('visit', 'erasedAt')} IS NULL AND ${j('job', 'erasedAt')} IS NULL
    AND ${j('message', 'kind')}='onMyWay' AND ${j('message', 'subjectId')}=visit.id AND ${j('message', 'customerId')}=customer.id
    AND ${j('message', 'to')}=${j('customer', 'phone')} AND ${j('message', 'visitTechnicianId')}=tech.id
    AND ${j('message', 'visitStartAt')}=${j('visit', 'startAt')} AND ${j('message', 'visitEndAt')}=${j('visit', 'endAt')}
    AND ${j('customer', 'automaticSms.visits.enabled')}=1 AND ${j('customer', 'automaticSms.visits.address')}=${j('customer', 'phone')}
    AND ${j('customer', 'automaticSms.visits.source')} IS NOT NULL AND ${j('customer', 'automaticSms.visits.wording')} IS NOT NULL
    AND ${j('customer', 'automaticSms.visits.timezone')} IS NOT NULL
    AND ${j('customer', 'erasedAt')} IS NULL AND ${j('customer', 'mergedInto')} IS NULL
    AND COALESCE(${j('customer', 'doNotContact')},0)=0 AND COALESCE(${j('customer', 'marketingOptOut')},0)=0
    AND NOT(COALESCE(${j('customer', 'smsOptOut.blocked')},0)=1 AND COALESCE(${j('customer', 'smsOptOut.address')},'')=${j('customer', 'phone')})
    AND NOT EXISTS(SELECT 1 FROM json_each(customer.data,'$.tags') WHERE lower(value)='do not contact')
    AND ${j('b', 'sms.enabled')}=1 AND ${j('b', 'visitNotices.onMyWay')}=1 AND ${j('b', 'visitNotices.approvedAt')}=link.status_approved_at
    AND ${roleSql(ownerId)}='owner' AND owner.version=${j('b', 'visitNotices.operatorVersion')}
    AND COALESCE((SELECT version FROM glove_records WHERE kind='branchAccess' AND id=${ownerId}),0)=COALESCE(${j('b', 'visitNotices.branchRevision')},0)
    AND NOT EXISTS(SELECT 1 FROM glove_records scope WHERE scope.kind='branchAccess' AND scope.id=${ownerId} AND COALESCE(json_extract(scope.data,'$.limited'),1)!=0)
  `).bind(tokenHash(token), new Date().toISOString()).first<{ name: string; mediaType: string; bytes: ArrayBuffer }>()
  if (!row || !['image/png', 'image/jpeg'].includes(row.mediaType)) return unavailable()
  if (url.pathname.endsWith('/image')) return new Response(new Uint8Array(row.bytes), { headers: { ...headers, 'content-type': row.mediaType, 'content-disposition': 'inline', 'content-security-policy': "default-src 'none'" } })
  return Response.json({ firstName: row.name.trim().split(/\s+/)[0] }, { headers })
}
