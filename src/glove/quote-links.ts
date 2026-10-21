import { documentIdentity, documentTemplate } from './documents'
import { allow } from './access'
import { optionsOf } from './commands/quotes'
import { sha256, canonicalJson } from '../modules/import-kit/src/d1/index'
import { address, connection, queueEmail } from './mail'
import { business, bump, event, expectVersion, fail, find, newId, put, type Context, type Row } from './model'
import type { Handler } from './commands/types'

export const quoteHash = (token: string) => sha256(`glove-quote-link:${token}`)
export const quoteHeaders = { 'cache-control': 'no-store, private', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow', vary: 'Authorization' }
export const unavailableQuote = (): never => fail('QUOTE_LINK', 'This quote link is unavailable. Ask the business for a new link.', null, 404)

/** Only customer document fields: no costs, internal evidence or other records. */
export function quoteDocument(c: Context, q: Row, r: Row) {
  const b = business(c.s)
  const lines = (items: Row[]) => items.map(l => ({ description: l.description, customerDescription: l.customerDescription ?? '', images: structuredClone(l.images ?? []), quantity: l.quantity, unitPrice: l.unitPrice, tax: l.tax }))
  const totals = (t: Row) => ({ subtotal: t.subtotal, tax: t.gst, total: t.total, currency: t.currency ?? b.currency })
  const block = (o: Record<string, any>) => ({ id: o.id, name: o.name, lines: lines(o.lines), totals: totals(o.totals) })
  const identity = documentIdentity(c.s), photos = structuredClone(q.documentPhotos ?? [])
  const files = [...new Set([identity.logo?.fileId, ...photos.map((p: any) => p.file.fileId), ...[...optionsOf(r), ...(r.addOns ?? [])].flatMap(o => o.lines.flatMap((l: Row) => (l.images ?? []).map((i: Row) => i.fileId)))].filter(Boolean))]
  return { business: identity, template: documentTemplate(c.s, 'quote'), photos, files, date: r.preparedAt.slice(0, 10), number: q.number, title: q.title, revision: r.n, site: { address: find(c.s, 'sites', q.siteId).address }, options: optionsOf(r).map(block), addOns: (r.addOns ?? []).map(block), notes: r.notes, terms: r.terms, validUntil: r.validUntil, validityZone: r.validityZone }
}

export const quoteLinks: Handler = async (c, type, p) => {
  if (!['quote.link', 'quote.linkRevoke', 'quote.validity'].includes(type)) return undefined
  allow(c.actor, type)
  if (c.actor.token) fail('FORBIDDEN', 'A signed-in person manages customer quote links.', null, 403)
  if (type === 'quote.validity') {
    const days = p.days
    if (!Number.isInteger(days) || days < 1 || days > 3650) fail('INPUT', 'days is a whole number from 1 to 3650.', null, 400)
    const b = business(c.s)
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'quote.validity', summary: `${c.actor.name} set new quote revisions to be valid for ${days} calendar days`, data: { days } })
    return bump(c.s, 'business', b, { quoteValidityDays: days })
  }
  allow(c.actor, 'quote.markSent')
  if (type === 'quote.linkRevoke') {
    const link = find(c.s, 'quoteLinks', p.linkId); expectVersion(link, p.version)
    const row = bump(c.s, 'quoteLinks', link, { revokedAt: c.now })
    event(c, { jobId: null, subjectKind: 'quote', subjectId: link.quoteId, kind: 'quote.linkRevoked', summary: `${c.actor.name} revoked the customer link for revision ${link.revision}`, data: { linkId: link.id } })
    return row
  }
  const q = find(c.s, 'quotes', p.quoteId); expectVersion(q, p.version)
  const r = q.revisions.at(-1)
  if (!r.approval || !['approved', 'sent'].includes(q.status)) fail('NOT_APPROVED', 'Issue a link only for the current price-approved revision.')
  if (!r.validUntil) fail('VALIDITY', 'Create and approve a new revision with a validity date before issuing a customer link.')
  if (r.linkExpiresAt <= c.now) fail('EXPIRED', 'This revision is too old for a link; prepare an updated quote.')
  const customer = find(c.s, 'customers', q.customerId)
  const emailTo = p.email === true ? (connection(c.s), address(customer.email, 'customer email')) : null
  for (const old of c.s.quoteLinks.filter(l => l.quoteId === q.id && l.revision === r.n && !l.revokedAt)) bump(c.s, 'quoteLinks', old, { revokedAt: c.now })
  const token = 'glq_' + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const document = quoteDocument(c, q, r)
  const row = put(c.s, 'quoteLinks', { id: newId(), version: 1, createdAt: c.now, quoteId: q.id, customerId: q.customerId, siteId: q.siteId, revision: r.n, issuedBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, document, documentHash: sha256(canonicalJson(document)), expiresAt: r.linkExpiresAt, revokedAt: null, authenticationBasis: 'link handed out by staff, recipient unverified' })
  c.sql.push({ sql: 'INSERT INTO glove_quote_secrets(link_id,hash) VALUES(?,?)', params: [row.id, quoteHash(token)] })
  c.reveal = { token }
  event(c, { jobId: null, subjectKind: 'quote', subjectId: q.id, kind: 'quote.linkIssued', summary: `${c.actor.name} issued a customer link for ${q.number} revision ${r.n}; ${emailTo ? 'queued to the address on record' : 'recipient unverified'}; online signing is unavailable pending owner consent disclosure`, data: { linkId: row.id, revision: r.n, documentHash: row.documentHash, authenticationBasis: row.authenticationBasis } })
  if (emailTo) {
    const message = queueEmail(c, { kind: 'quoteLink', subjectKind: 'quote', subjectId: q.id, customerId: q.customerId, jobId: null, to: emailTo, subject: `Quote ${q.number} from ${business(c.s).name}`, text: `${business(c.s).name} quote ${q.number}, revision ${r.n}: ${q.title}\nValid through ${r.validUntil} (${r.validityZone}).\n\nRead the quote and request changes or decline here:\n${c.origin}/quote#token=${token}\n\nOnline signing is unavailable. Contact us to accept.`, label: `${q.number} customer link` })
    bump(c.s, 'quoteLinks', row, { emailMessageId: message.id })
    bump(c.s, 'quotes', q, { status: 'sent', sent: [...q.sent, { revision: r.n, channel: 'email', note: 'Customer quote link', recordedBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, at: c.now, messageId: message.id }] })
  }
  return c.s.quoteLinks.find(l => l.id === row.id)!
}
