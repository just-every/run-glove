import { Buffer } from 'node:buffer'
import { sha256 } from '../../modules/import-kit/src/d1/index'
import { bump, event, expectVersion, fail, find, newId } from '../model'
import type { Handler } from './types'

const MAX = 10 * 1024 * 1024
/** MONEY-001, MONEY-004, MONEY-005: a private certificate is evidence, never a claimed verification. */
export const taxCertificates: Handler = async (c, type, p) => {
  if (type !== 'customer.certificate') return undefined
  const customer = find(c.s, 'customers', p.customerId)
  expectVersion(customer, p.version)
  if (!customer.taxExemption) fail('INPUT', 'Save the certificate number and expiry first.', null, 400)
  const file = p.file
  if (!file || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.mediaType) || typeof file.base64 !== 'string' || file.base64.length > Math.ceil(MAX / 3) * 4 || file.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64)) fail('INPUT', 'Upload a PDF, JPEG or PNG certificate up to 10 MB.', null, 400)
  let bytes: Uint8Array
  try { bytes = Buffer.from(file.base64, 'base64') } catch { return fail('INPUT', 'The certificate is not valid base64.', null, 400) }
  if (!bytes.length || bytes.length > MAX) fail('SIZE', 'A certificate is at most 10 MB.', null, 413)
  const signature = file.mediaType === 'application/pdf' ? String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-' : file.mediaType === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)
  if (!signature) fail('INPUT', 'The certificate bytes do not match the selected file type.', null, 400)
  const id = newId(), hash = sha256(bytes)
  c.sql.push({ sql: 'INSERT INTO glove_tax_certificates(id,customer_id,media_type,size,sha256,created_at) VALUES(?,?,?,?,?,?)', params: [id, customer.id, file.mediaType, bytes.length, hash, c.now] })
  for (let offset = 0, ordinal = 0; offset < bytes.length; offset += 512 * 1024, ordinal++) c.sql.push({ sql: 'INSERT INTO glove_tax_certificate_chunks(file_id,ordinal,bytes) VALUES(?,?,?)', params: [id, ordinal, bytes.slice(offset, offset + 512 * 1024)] })
  const row = bump(c.s, 'customers', customer, { taxExemption: { ...customer.taxExemption, certificate: { fileId: id, mediaType: file.mediaType, size: bytes.length, sha256: hash, uploadedAt: c.now } } })
  event(c, { jobId: null, subjectKind: 'customer', subjectId: customer.id, kind: 'customer.certificate', summary: `${c.actor.name} filed an exemption certificate for ${customer.name}; not verified by a provider`, data: { fileId: id, mediaType: file.mediaType, size: bytes.length } })
  return row
}
