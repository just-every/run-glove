import { fail } from '../model'

// API-004: CompanyCam's current Public API, not the retired /v2 protocol.
// https://developers.companycam.com/openapi/public_api_v1.yaml
const base = 'https://api.companycam.com/public_api/v1'
export const providerId = (value: unknown) => typeof value === 'string' && /^\d{1,30}$/.test(value) ? value : fail('INPUT', 'Use the numeric CompanyCam project or photo ID.', null, 400)

export class CompanyCamError extends Error {
  constructor(public status: number) { super(status ? `CompanyCam refused the request (HTTP ${status}).` : 'CompanyCam could not confirm the request.') }
}

export async function api(key: string, path: string, body?: object | FormData) {
  let response: Response
  try {
    response = await fetch(base + path, { method: body ? 'POST' : 'GET', redirect: 'manual', headers: { authorization: `Bearer ${key}`, accept: 'application/json', ...(body && !(body instanceof FormData) ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}) })
  } catch { throw new CompanyCamError(0) }
  if (!response.ok) throw new CompanyCamError(response.status)
  let value: any
  try { value = await response.json() } catch { throw new CompanyCamError(0) }
  if (!value || !('data' in value) || value.errors?.length) throw new CompanyCamError(0)
  return value
}

export const addressText = (a: any) => [a?.street_address_1, a?.street_address_2, a?.city, a?.state, a?.postal_code, a?.country && !['us', 'usa', 'united states'].includes(String(a.country).toLowerCase()) ? a.country : ''].filter(Boolean).join(', ')
export const addressKey = (v: string) => v.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Only a URL the authenticated photo response supplied; no key travels to the image host. */
export async function photoBytes(photo: any) {
  const original = photo?.uris?.find((u: any) => u.type === 'original')
  let url: URL
  try { url = new URL(original?.url ?? original?.uri) } catch { return fail('COMPANYCAM_PHOTO', 'CompanyCam supplied no original image URL.') }
  if (url.protocol !== 'https:' || url.username || url.password) fail('COMPANYCAM_PHOTO', 'CompanyCam supplied an unsupported image URL.')
  let response: Response
  try { response = await fetch(url, { redirect: 'manual' }) } catch { return fail('COMPANYCAM_PHOTO', 'The CompanyCam image could not be downloaded.') }
  if (!response.ok) fail('COMPANYCAM_PHOTO', `The CompanyCam image download failed (HTTP ${response.status}).`)
  const type = response.headers.get('content-type')?.split(';')[0] ?? ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) fail('COMPANYCAM_PHOTO', 'The original must be JPEG, PNG or WebP, as for Glove photos.')
  const reader = response.body?.getReader() ?? fail('COMPANYCAM_PHOTO', 'CompanyCam returned an empty image.')
  const chunks: Uint8Array[] = []; let size = 0
  for (;;) {
    const next = await reader.read()
    if (next.done) break
    size += next.value.length
    if (size > 1_500_000) { await reader.cancel(); fail('COMPANYCAM_PHOTO', 'This original exceeds Glove’s 1.5 MB photo limit; resize it in CompanyCam before importing.') }
    chunks.push(next.value)
  }
  const bytes = new Uint8Array(size); let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  return { bytes, mediaType: type }
}

export const digest = async (bytes: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer))].map(n => n.toString(16).padStart(2, '0')).join('')
