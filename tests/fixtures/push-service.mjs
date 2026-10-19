// FIELD-004 push service fake (tests only): a phone's subscription keys, and
// what a push service and the phone's browser do with a push: check the VAPID
// signature (RFC 8292) and decrypt the aes128gcm record (RFC 8291).
const { subtle } = globalThis.crypto
const b64url = bytes => Buffer.from(bytes).toString('base64url')
const enc = new TextEncoder()

/** A subscribing phone's ECDH key pair and auth secret, as PushManager.subscribe makes them. */
export async function phoneKeys() {
  const pair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const publicRaw = new Uint8Array(await subtle.exportKey('raw', pair.publicKey)), secret = globalThis.crypto.getRandomValues(new Uint8Array(16))
  return { pair, publicRaw, secret, keys: { p256dh: b64url(publicRaw), auth: b64url(secret) } }
}

const hkdf = async (salt, ikm, info, bytes) => new Uint8Array(await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), bytes * 8))

/** The VAPID token's claims when its ES256 signature verifies under k; throws otherwise. */
export async function vapid(authorization) {
  const m = /^vapid t=([\w-]+\.[\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(authorization ?? '')
  if (!m) throw new Error(`not a VAPID authorization: ${authorization}`)
  const key = await subtle.importKey('raw', Buffer.from(m[3], 'base64url'), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
  if (!await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, Buffer.from(m[2], 'base64url'), enc.encode(m[1]))) throw new Error('VAPID signature does not verify')
  return { k: m[3], header: JSON.parse(Buffer.from(m[1].split('.')[0], 'base64url')), claims: JSON.parse(Buffer.from(m[1].split('.')[1], 'base64url')) }
}

/** Decrypt one aes128gcm push body with the phone's keys. */
export async function decrypt(body, phone) {
  const bytes = new Uint8Array(body), salt = bytes.slice(0, 16), idlen = bytes[20], sender = bytes.slice(21, 21 + idlen)
  const shared = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: await subtle.importKey('raw', sender, { name: 'ECDH', namedCurve: 'P-256' }, false, []) }, phone.pair.privateKey, 256))
  const ikm = await hkdf(phone.secret, shared, new Uint8Array([...enc.encode('WebPush: info\0'), ...phone.publicRaw, ...sender]), 32)
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16), nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)
  const plain = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: nonce }, await subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']), bytes.slice(21 + idlen)))
  let end = plain.length - 1
  while (end >= 0 && plain[end] === 0) end--
  if (plain[end] !== 2) throw new Error('not a final aes128gcm record')
  return new TextDecoder().decode(plain.slice(0, end))
}
