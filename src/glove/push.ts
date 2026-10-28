import { providerEvent } from './timeline'
import type { Bindings } from '../auth.server'
import { roleSql } from './access'
import { fail, type Context, type Row, type State } from './model'

// FIELD-004, FIELD-009, FIELD-010: Web Push to the technician app (as ct approved, 19 Oct 10:50Z).
// The owner's VAPID private key is kept in glove_provider_keys and never
// leaves the server. A subscription belongs to one person on one device and
// to the signed-in session that made it (glove_push_subscriptions, never in
// records, exports or the archive); it is used only while that session is
// live and the person is still a Technician, and is deleted otherwise. A push
// carries only a generic line and the job's opaque id, encrypted for the
// device (RFC 8291 aes128gcm) and signed with the VAPID key (RFC 8292); no
// customer, site, time or note goes with it. Each push is sent once, never
// retried; its outcome is kept on the subscription in plain words.

const subtle = crypto.subtle
type Bytes = Uint8Array<ArrayBuffer>
const enc = new TextEncoder()
export const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64url = (v: string): Bytes => Uint8Array.from(atob(v.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - v.length % 4) % 4)), ch => ch.charCodeAt(0))
const concat = (...parts: Bytes[]): Bytes => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let at = 0; for (const p of parts) { out.set(p, at); at += p.length } return out }

/** A fresh VAPID key pair: the private JWK stays on the server, the raw public key goes to phones. */
export async function vapidKeys() {
  const pair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair
  return { privateJwk: JSON.stringify(await subtle.exportKey('jwk', pair.privateKey)), publicKey: b64url(new Uint8Array(await subtle.exportKey('raw', pair.publicKey) as ArrayBuffer)) }
}

/** A subscription's keys as the browser gives them: a P-256 public point and a 16-byte secret. */
export async function deviceKeys(p256dh: unknown, auth: unknown) {
  try {
    const point = unb64url(String(p256dh)), secret = unb64url(String(auth))
    if (point.length === 65 && point[0] === 4 && secret.length === 16) {
      await subtle.importKey('raw', point, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
      return { p256dh: b64url(point), auth: b64url(secret) }
    }
  } catch { /* refused below */ }
  return fail('INPUT', 'keys are the browser subscription\'s p256dh and auth.', { field: 'keys' }, 400)
}

/** The push service address the browser gave: https, or plain http on this computer for a local installation only. */
export function pushEndpoint(v: unknown, local: boolean): string {
  try {
    const u = new URL(String(v))
    const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname)
    if (String(v).length <= 1000 && !u.username && !u.password && !u.hash && (u.protocol === 'https:' || (local && loopback && u.protocol === 'http:'))) return u.href
  } catch { /* refused below */ }
  return fail('INPUT', 'endpoint is the push service address the browser gave.', { field: 'endpoint' }, 400)
}

async function hkdf(salt: Bytes, ikm: Bytes, info: Bytes, bytes: number) {
  const key = await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return new Uint8Array(await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8))
}

/** RFC 8291: one aes128gcm record for the device's keys, from a fresh sender key and salt. */
export async function encrypt(payload: string, p256dh: string, auth: string) {
  const device = unb64url(p256dh), secret = unb64url(auth)
  const sender = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair
  const senderPublic = new Uint8Array(await subtle.exportKey('raw', sender.publicKey) as ArrayBuffer)
  const devicePublic = await subtle.importKey('raw', device, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const shared = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: devicePublic } as EcdhKeyDeriveParams, sender.privateKey, 256))
  const ikm = await hkdf(secret, shared, concat(enc.encode('WebPush: info\0'), device, senderPublic), 32)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)
  const key = await subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const sealed = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, concat(enc.encode(payload), new Uint8Array([2]))))
  const header = new Uint8Array(21); header.set(salt); new DataView(header.buffer).setUint32(16, 4096); header[20] = senderPublic.length
  return concat(header, senderPublic, sealed)
}

/** RFC 8292: a 12-hour ES256 token for the push service's origin. */
async function vapidToken(endpoint: string, privateJwk: string, subject: string) {
  const key = await subtle.importKey('jwk', JSON.parse(privateJwk), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const part = (v: object) => b64url(enc.encode(JSON.stringify(v)))
  const unsigned = `${part({ typ: 'JWT', alg: 'ES256' })}.${part({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })}`
  return `${unsigned}.${b64url(new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned))))}`
}

export type Notice = { kind: 'new' | 'moved' | 'cancelled' | 'away'; jobId: string }
const lines: Record<Notice['kind'], string> = { new: 'New visit on your schedule', moved: 'Visit moved', cancelled: 'Visit canceled', away: 'Visit moved off your schedule' }

/** What changed on each technician's schedule between two states: visits that have not ended yet, booked, moved, canceled or handed to someone else. */
export function notices(before: State, after: State, now: string) {
  const out = new Map<string, Notice[]>()
  const add = (technicianId: string, n: Notice) => out.set(technicianId, [...(out.get(technicianId) ?? []), n])
  const was = new Map(before.visits.map(v => [v.id, v]))
  for (const v of after.visits) {
    const b = was.get(v.id)
    if (v.endAt <= now && (!b || b.endAt <= now)) continue
    if (!b) { if (v.status === 'booked') add(v.technicianId, { kind: 'new', jobId: v.jobId }); continue }
    if (b.status === 'cancelled') continue
    if (v.status === 'cancelled') { add(b.technicianId, { kind: 'cancelled', jobId: v.jobId }); continue }
    if (b.technicianId !== v.technicianId) { add(b.technicianId, { kind: 'away', jobId: v.jobId }); add(v.technicianId, { kind: 'new', jobId: v.jobId }); continue }
    if (b.startAt !== v.startAt || b.endAt !== v.endAt) add(v.technicianId, { kind: 'moved', jobId: v.jobId })
  }
  return out
}

/** One push per technician per change: its line and job id, or a count when several visits changed. */
export const message = (list: Notice[]) => list.length === 1 ? { title: 'Glove', body: lines[list[0].kind], jobId: list[0].jobId } : { title: 'Glove', body: `${list.length} changes to your schedule`, jobId: null }

/** A subscription is usable while its session is live and its person is still an active Technician. */
const live = `EXISTS(SELECT 1 FROM oa_sessions s JOIN oa_operators o ON o.id=s.operator_id WHERE s.id=p.session_id AND o.id=p.operator_id AND o.status='active' AND s.operator_version=o.version AND s.revoked_at IS NULL AND s.expires_at>?) AND ${roleSql('p.operator_id')}='technician'`

/** Delete every subscription whose session ended (sign-out, revocation, expiry) or whose person is no longer an active Technician. */
export const sweep = (db: D1Database) => db.prepare(`DELETE FROM glove_push_subscriptions AS p WHERE NOT (${live})`).bind(Date.now()).run()

/** The signed-in person's own subscriptions, without endpoints or keys. */
export async function ownDevices(db: D1Database, actor: { id: string; sessionId: string }) {
  await sweep(db)
  const rows = (await db.prepare('SELECT id,device,session_id AS sessionId,created_at AS createdAt,last_at AS lastAt,last_outcome AS lastOutcome FROM glove_push_subscriptions WHERE operator_id=? ORDER BY created_at').bind(actor.id).all<Row>()).results
  return rows.map(({ sessionId, ...r }) => ({ ...r, thisSession: sessionId === actor.sessionId }))
}

/** After a committed change: send each affected technician's devices one push, once, and keep each outcome. */
export async function notify(env: Bindings, before: State, c: Context) {
  const changed = notices(before, c.s, c.now), b = c.s.business[0]
  if (!changed.size || !b?.webPush) return
  try {
    const privateJwk = (await env.DB.prepare("SELECT value FROM glove_provider_keys WHERE provider='vapid'").first<{ value: string }>())?.value
    if (!privateJwk) return
    await sweep(env.DB)
    const subject = b.email ? `mailto:${b.email}` : new URL(env.AUTH_ORIGIN).origin
    const sends: Promise<void>[] = []
    for (const [technicianId, list] of changed) {
      const operatorId = c.s.technicians.find(t => t.id === technicianId)?.operatorId
      if (!operatorId) continue
      const devices = (await env.DB.prepare('SELECT id,endpoint,p256dh,auth FROM glove_push_subscriptions WHERE operator_id=?').bind(operatorId).all<Row>()).results
      const body = JSON.stringify(message(list))
      for (const d of devices) sends.push(deliver(env.DB, d, body, privateJwk, b.webPush.publicKey, subject, c, technicianId, list.map(n => n.jobId)))
    }
    await Promise.all(sends)
  } catch (error) {
    console.error('glove push not sent', error instanceof Error ? error.name : 'error')
  }
}

async function deliver(db: D1Database, d: Row, body: string, privateJwk: string, publicKey: string, subject: string, c: Context, technicianId: string, jobIds: string[]) {
  let outcome: string, status = 0
  try {
    const res = await fetch(d.endpoint, { method: 'POST', signal: AbortSignal.timeout(5000), headers: { authorization: `vapid t=${await vapidToken(d.endpoint, privateJwk, subject)}, k=${publicKey}`, 'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', ttl: '86400', urgency: 'normal' }, body: await encrypt(body, d.p256dh, d.auth) })
    status = res.status
    // 404 and 410: the push service no longer knows this subscription, so it is deleted.
    if (res.status === 404 || res.status === 410) outcome = `Not sent: the push service answered HTTP ${res.status}; subscription removed`
    else
    outcome = res.ok ? 'Handed to the push service' : `Not sent: the push service answered HTTP ${res.status}`
  } catch { outcome = 'Not sent: the push service could not be reached' }
  const at = new Date().toISOString()
  await db.batch([
    status === 404 || status === 410 ? db.prepare('DELETE FROM glove_push_subscriptions WHERE id=?').bind(d.id) : db.prepare('UPDATE glove_push_subscriptions SET last_at=?,last_outcome=? WHERE id=?').bind(at, outcome, d.id),
    providerEvent(db, { id: `${c.commandId}:push:${d.id}`, at, commandId: c.commandId, provider: 'Web Push', jobId: jobIds.length === 1 ? jobIds[0] : null, subjectKind: 'push', subjectId: d.id, kind: 'push.outcome', summary: `Web Push: ${status ? `HTTP ${status}` : 'outcome not confirmed'}`, data: { subscriptionId: d.id, technicianId, jobIds, status } }),
  ])
}
