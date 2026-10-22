import { Buffer } from 'node:buffer'
import { allow } from './access'
import { optionsOf, quotes } from './commands/quotes'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { address, queueEmail } from './mail'
import { totals } from './money'
import { priceTax } from './sales-tax'
import { bump, business, event, expectVersion, fail, find, text, type Context, type Row, type State } from './model'

const digest = (value: unknown) => sha256(canonicalJson(value))
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const who = (c: Context) => ({ id: c.actor.id, name: c.actor.name, role: c.actor.role })

/** There is deliberately no default disclosure and no environment bypass. */
export function signingDisclosure(s: State) {
  const d = s.business[0]?.quoteConsent
  return d?.active === true && d.acceptedAt && d.acceptedBy && typeof d.text === 'string' && d.hash === sha256(d.text) ? d : null
}

export function configureQuoteConsent(c: Context, p: any) {
  if (c.actor.role !== 'owner' || c.actor.token || c.actor.branch || !c.actor.sessionId) fail('FORBIDDEN', 'Only the signed-in owner without branch limits accepts a quote-signing disclosure.', null, 403)
  allow(c.actor, 'quote.consent')
  const b = business(c.s); expectVersion(b, p.version)
  if (p.disable === true) {
    const current = b.quoteConsent
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'quote.consentDisabled', summary: `${c.actor.name} disabled customer quote signing`, data: { disclosureVersion: current?.version ?? null, hash: current?.hash ?? null } })
    return bump(c.s, 'business', b, { quoteConsent: current ? { ...current, active: false, disabledAt: c.now, disabledBy: who(c) } : null })
  }
  if (p.accept !== true) fail('CONSENT', 'Explicitly accept the concrete disclosure you entered.', null, 400)
  const disclosure = text(p.text, 'text', { max: 12000 })
  const value = { version: (b.quoteConsent?.version ?? 0) + 1, text: disclosure, hash: sha256(disclosure), acceptedAt: c.now, acceptedBy: who(c), active: true }
  event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'quote.consentAccepted', summary: `${c.actor.name} entered and accepted quote-signing disclosure version ${value.version}; no legal-validity claim is made`, data: { disclosureVersion: value.version, hash: value.hash } })
  return bump(c.s, 'business', b, { quoteConsent: value, quoteConsentHistory: [...(b.quoteConsentHistory ?? []), value] })
}

const customerLines = (items: Row[]) => items.map(l => ({ description: l.description, customerDescription: l.customerDescription ?? '', images: structuredClone(l.images ?? []), quantity: l.quantity, unitPrice: l.unitPrice, tax: l.tax, total: l.total }))

/** The same native option, add-on and tax calculation as quote.accept, without
 * changing anything. A server-computed selection hash binds the displayed
 * chosen document to the signature, including its one tax calculation. */
export function quoteSelection(c: Context, link: Row, value: any) {
  const q = find(c.s, 'quotes', link.quoteId), r = q.revisions.at(-1)
  const options = optionsOf(r), option = options.find(o => o.id === value?.optionId) ?? fail('CHOICE', 'Choose one option from this revision.', null, 400)
  if (!Array.isArray(value?.addOnIds) || value.addOnIds.length > 10 || value.addOnIds.some((id: unknown) => typeof id !== 'string') || new Set(value.addOnIds).size !== value.addOnIds.length) fail('CHOICE', 'Choose add-ons from this revision once each.', null, 400)
  const extras: Row[] = r.addOns ?? []
  if (value.addOnIds.some((id: string) => !extras.some(a => a.id === id))) fail('CHOICE', 'Choose add-ons from this revision.', null, 400)
  const chosen = extras.filter(a => value.addOnIds.includes(a.id)), lines = [...option.lines, ...chosen.flatMap(a => a.lines)], discount = option.discount ?? null
  const priced = r.totals.taxContext || discount ? priceTax(c.s, q, lines, c.now, r.totals.taxContext, discount) : totals(lines)
  const choice = { optionId: option.id, optionName: option.name, addOnIds: chosen.map(a => a.id), addOnNames: chosen.map(a => a.name) }
  const { options: _options, addOns: _addOns, files: _files, ...revisionDocument } = link.document
  const projectedLines = customerLines(lines)
  const files = [...new Set([revisionDocument.business.logo?.fileId, ...(revisionDocument.photos ?? []).map((p: Row) => p.file.fileId), ...projectedLines.flatMap(l => l.images.map((i: Row) => i.fileId))].filter(Boolean))]
  const document = { ...revisionDocument, choice, lines: projectedLines, discount, totals: { subtotal: priced.subtotal, tax: priced.gst, total: priced.total, currency: link.document.options[0].totals.currency }, files }
  return { choice, document, hash: digest(document) }
}

export type QuoteSignature = { kind: 'typed'; text: string } | { kind: 'drawn'; width: 600; height: 200; strokes: number[][][] }
function signature(value: any): QuoteSignature {
  if (value?.kind === 'typed') return { kind: 'typed', text: text(value.text, 'signature.text', { max: 200 }) }
  if (value?.kind !== 'drawn' || value.width !== 600 || value.height !== 200 || !Array.isArray(value.strokes) || !value.strokes.length || value.strokes.length > 40) return fail('SIGNATURE', 'Type your signature or draw it in the signature area.', null, 400)
  let count = 0
  const strokes = value.strokes.map((stroke: unknown) => {
    if (!Array.isArray(stroke) || stroke.length < 2 || (count += stroke.length) > 3000) return fail('SIGNATURE', 'Draw a signature with at least one stroke (up to 3000 points).', null, 400)
    return stroke.map((p: unknown) => {
      if (!Array.isArray(p) || p.length !== 2 || !p.every(n => typeof n === 'number' && Number.isFinite(n)) || p[0] < 0 || p[0] > 600 || p[1] < 0 || p[1] > 200) return fail('SIGNATURE', 'The drawn signature is outside its signature area.', null, 400)
      return p.map(n => Math.round(n * 10) / 10)
    })
  })
  const points = strokes.flat()
  if (Math.max(...points.map(p => p[0])) - Math.min(...points.map(p => p[0])) < 2 && Math.max(...points.map(p => p[1])) - Math.min(...points.map(p => p[1])) < 2) fail('SIGNATURE', 'Draw your signature, or use the typed option.', null, 400)
  return { kind: 'drawn', width: 600, height: 200, strokes }
}

export type SignedQuoteManifest = { format: 'html'; sha256: string; size: number; chunks: number }
export async function readSignedQuote(db: D1Database, quoteId: string, revision: number, manifest: SignedQuoteManifest): Promise<string> {
  const parts = (await db.prepare('SELECT ordinal,bytes FROM glove_quote_signed_chunks WHERE quote_id=? AND revision=? ORDER BY ordinal').bind(quoteId, revision).all<{ ordinal: number; bytes: ArrayBuffer }>()).results
  if (parts.length !== manifest.chunks || parts.some((p, i) => p.ordinal !== i)) fail('SIGNED_COPY', 'The stored signed copy is incomplete.', null, 500)
  const bytes = Buffer.concat(parts.map(p => Buffer.from(p.bytes)))
  if (bytes.length !== manifest.size || sha256(bytes.toString('utf8')) !== manifest.sha256) fail('SIGNED_COPY', 'The stored signed copy did not match its hash.', null, 500)
  return bytes.toString('utf8')
}

async function frozenCopy(c: Context, db: D1Database, q: Row, document: any, evidence: any) {
  const images = new Map<string, string>()
  for (const id of document.files) {
    const file = await db.prepare('SELECT media_type AS mediaType,sha256,bytes FROM glove_files WHERE id=?').bind(id).first<{ mediaType: string; sha256: string; bytes: ArrayBuffer }>()
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.mediaType)) fail('SIGNED_COPY', 'A frozen document image is unavailable. Ask the business for a new link.')
    images.set(id, `data:${file.mediaType};base64,${Buffer.from(file.bytes).toString('base64')}`)
  }
  const image = (file: any, caption: string) => file ? `<figure><img alt="${escape(caption)}" src="${images.get(file.fileId)}"><figcaption>${escape(caption)} · original SHA-256 ${escape(file.sha256)}</figcaption></figure>` : ''
  const d = document, b = d.business, e = evidence, sig = e.signature
  const sigHtml = sig.kind === 'typed' ? `<p style="font:italic 28px Georgia,serif">${escape(sig.text)}</p>` : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200" role="img" aria-label="Drawn signature">${sig.strokes.map((s: number[][]) => `<polyline points="${s.map(p => p.join(',')).join(' ')}" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`
  const linesText = d.lines.map((l: any) => `${l.description}${l.customerDescription ? `\n${l.customerDescription}` : ''}\n${l.quantity} × ${l.unitPrice} = ${l.total}`).join('\n\n')
  const copyText = `${b.legalName || b.name}${b.dba ? ` (DBA ${b.dba})` : ''}\n${b.address}\n${b.phone} ${b.email}${b.ein ? `\nEIN: ${b.ein}` : ''}${(b.licenses ?? []).map((l: any) => `\n${l.trade} · ${l.state} license ${l.number}`).join('')}${b.insurance ? `\nInsurance: ${b.insurance.carrier} · ${b.insurance.policy} · expires ${b.insurance.expires}` : ''}\n${d.template?.heading || 'Quote'} ${d.number}, revision ${d.revision}\nPrepared ${d.date}\n${d.title}\n${d.site.address}\nValid through ${d.validUntil} (${d.validityZone})\n\nChosen option: ${d.choice.optionName || 'Quoted work'}\nAdd-ons: ${d.choice.addOnNames.join(', ') || 'None'}\n\n${linesText}\n\nSubtotal: ${d.totals.subtotal}\n${d.discount ? `Discount: ${canonicalJson(d.discount)}\n` : ''}Tax: ${d.totals.tax}\nTotal: ${d.totals.total} ${d.totals.currency}\n\n${d.notes}\n${d.terms}\n${d.template?.terms || ''}\n${d.template?.footer || ''}\n\nSigner: ${e.name} (CLAIMED)\nCapacity: ${e.capacity} (CLAIMED)\nAuthentication: ${e.authenticationBasis}\nSigned at: ${e.at}\nSignature (${sig.kind}): ${sig.kind === 'typed' ? sig.text : canonicalJson(sig)}\n\nAffirmed disclosure version ${e.consent.version}:\n${e.consent.text}\nConsent SHA-256: ${e.consent.hash}\nRevision SHA-256: ${e.revisionDocumentHash}\nChosen document SHA-256: ${e.chosenDocumentHash}\nLink ID: ${e.linkId}\nIP: ${e.ip ?? 'Unavailable'} (${e.ipSource})\nBrowser: ${e.browser || 'Unavailable'}\nIdentity is claimed, not verified. No legal-validity claim is made.`
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(d.number)} signed revision ${d.revision}</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#111;background:white;max-width:760px;margin:auto;padding:24px;overflow-wrap:anywhere}img,svg{max-width:100%;height:auto}figure{margin:16px 0}pre{white-space:pre-wrap;font:inherit}li{break-inside:avoid}h1,h2{line-height:1.3}@media print{body{padding:0}}</style><main>${image(b.logo, `${b.name} logo`)}<h1>${escape(d.template?.heading || 'Quote')} ${escape(d.number)}</h1><h2>${escape(d.title)}</h2><pre>${escape(copyText)}</pre><section aria-label="Signature">${sigHtml}</section>${d.lines.flatMap((l: any) => l.images.map((f: any) => image(f, l.description))).join('')}${(d.photos ?? []).map((p: any) => image(p.file, p.caption || 'Attached quote photo')).join('')}</main></html>`
  const bytes = Buffer.from(html, 'utf8'), chunkSize = 500_000, chunks = Math.ceil(bytes.length / chunkSize)
  for (let ordinal = 0; ordinal < chunks; ordinal++) c.sql.push({ sql: 'INSERT INTO glove_quote_signed_chunks(quote_id,revision,ordinal,bytes) VALUES(?,?,?,?)', params: [q.id, d.revision, ordinal, new Uint8Array(bytes.subarray(ordinal * chunkSize, (ordinal + 1) * chunkSize))] })
  return { manifest: { format: 'html', sha256: sha256(html), size: bytes.length, chunks } as SignedQuoteManifest, html, text: copyText }
}

/** Called only after the public door checked the current revision, expiry,
 * issuer and first-decision state. Commit repeats issuer authority atomically. */
export async function signQuote(c: Context, db: D1Database, link: Row, payload: any, request: Request) {
  const disclosure = signingDisclosure(c.s) ?? fail('CONSENT_GATE', 'Online signing is unavailable until the owner accepts their concrete disclosure.')
  if (payload.documentHash !== link.documentHash) fail('DOCUMENT_CHANGED', 'Reopen this revision before signing it.')
  if (payload.consent?.affirmed !== true || payload.consent.version !== disclosure.version || payload.consent.hash !== disclosure.hash) fail('CONSENT_CHANGED', 'Read and affirm the current disclosure before signing.', null, 409)
  const selected = quoteSelection(c, link, payload.choice)
  if (payload.selectionHash !== selected.hash) fail('CHOICE_CHANGED', 'Review the chosen option, add-ons and exact total before signing.')
  const q = find(c.s, 'quotes', link.quoteId), name = text(payload.name, 'name', { max: 200 }), capacity = text(payload.capacity, 'capacity', { max: 200 }), signed = signature(payload.signature)
  const ip = request.headers.get('cf-connecting-ip')
  const evidence = { name, capacity, identity: 'CLAIMED', authenticationBasis: link.authenticationBasis, linkId: link.id, revision: link.revision, revisionDocumentHash: link.documentHash, chosenDocumentHash: selected.hash, signature: signed, consent: { version: disclosure.version, text: disclosure.text, hash: disclosure.hash, affirmed: true, ownerAcceptedAt: disclosure.acceptedAt }, at: c.now, ip: ip && /^[0-9a-fA-F:.]{3,45}$/.test(ip) ? ip : null, ipSource: ip ? 'Cloudflare connecting-IP header' : 'unavailable', browser: (request.headers.get('user-agent') ?? '').slice(0, 1000) }
  await quotes(c, 'quote.accept', { quoteId: q.id, version: q.version, revision: link.revision, method: 'customer link', customerName: name, choice: selected.choice }, db)
  const copy = await frozenCopy(c, db, q, selected.document, evidence)
  const accepted = find(c.s, 'quotes', q.id)
  let confirmation: any = { status: 'not_connected', messageId: null, to: null }
  if (business(c.s).mail) {
    const customer = find(c.s, 'customers', q.customerId), to = address(customer.email, 'customer email')
    const message = queueEmail(c, { kind: 'quoteConfirmation', subjectKind: 'quote', subjectId: q.id, customerId: q.customerId, jobId: null, to, subject: `Signed quote ${q.number}, revision ${link.revision}`, text: `${copy.text}\n\nSigned HTML copy SHA-256: ${copy.manifest.sha256}`, html: copy.html, label: `${q.number} signed revision ${link.revision} confirmation copy` })
    confirmation = { status: 'queued', messageId: message.id, to }
  }
  const signing = { ...evidence, document: selected.document, signedCopy: copy.manifest, confirmation }
  const row = bump(c.s, 'quotes', accepted, { acceptance: { ...accepted.acceptance, identity: 'CLAIMED', capacity, authenticationBasis: link.authenticationBasis, signing } })
  event(c, { jobId: null, subjectKind: 'quote', subjectId: q.id, kind: 'quote.customer.approve', summary: `${q.number} revision ${link.revision} signed by ${name} (claimed), capacity ${capacity} (claimed); exact chosen document frozen`, data: { revision: link.revision, linkId: link.id, identity: 'CLAIMED', consentVersion: disclosure.version, consentHash: disclosure.hash, documentHash: link.documentHash, chosenDocumentHash: selected.hash, signedCopyHash: copy.manifest.sha256, signatureKind: signed.kind, confirmationMessageId: confirmation.messageId } })
  return row
}
