import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { business, completedJob } from '../api/harness.mjs'
import { connectPayments } from './payment-journey.mjs'

// DATA-007: a merged subject group holding every typed identifier kind, an independent
// peer that mentions each exact value, and shared rows that only look similar.
const mail = name => [name, 'example.test'].join('@')
const jpeg = Buffer.from('ffd8ffe000104a4649460001010000010000010000ffd9', 'hex').toString('base64')
const pdf = Buffer.from('%PDF-1.4 synthetic-glove-peer-redaction certificate').toString('base64')
const embed = 'https://synthetic-glove-peer.example.test'

export const subjectValues = {
  name: 'Harbourview Dental', contact: 'Dr Mei Lin', email: mail('synthetic-glove-subject'), apEmail: mail('synthetic-glove-subject-ap'),
  phone: '02 9555 0101', billingAddress: '14 Harbour St, Balmain NSW 2041', billingContact: 'Beatrice Ledger', abn: '12 345 678 901',
  contactName: 'Quentin Contact', contactPhone: '02 9555 0505', contactEmail: mail('synthetic-glove-subject-contact'),
  certificate: 'EXM-synthetic-glove-7731',
  siteAddress: '14 Harbour St, Balmain NSW 2041', siteContact: 'Ann', siteContactPhone: '02 9555 0606', siteContactEmail: mail('synthetic-glove-subject-site'),
  intakeName: 'Casey Intake',
  duplicateName: 'Lee', duplicateEmail: 'synthetic-glove-lee-mailbox', duplicatePhone: '02 9555 0707',
}
export const values = () => [...new Set(Object.values(subjectValues))]

// Mentions that are not one of the typed identifiers stay exactly as written.
const nearMiss = { phone: '(02) 9555-0101', title: 'Facilities manager', annual: 'Annual maintenance', leeds: 'Leeds supplier' }

const fileBytes = async (h, fileId) => {
  const response = await h.request(`/api/glove/files/${fileId}`)
  return response.status === 200 ? Buffer.from(await response.arrayBuffer()).toString('base64') : response.status
}

/** Seed one installation: the subject group and its history, a peer, and shared rows. */
export async function peerWorld(h) {
  const b = await business(h), v = subjectValues
  const duplicate = await h.command('customer.save', { name: v.duplicateName, email: v.duplicateEmail, phone: v.duplicatePhone })
  let subject = await h.command('customer.save', { ...b.customer, contact: v.contact, email: v.email, apEmail: v.apEmail, phone: v.phone, billingAddress: v.billingAddress, billingContact: v.billingContact, abn: v.abn, kind: 'business',
    contacts: [{ name: v.contactName, phone: v.contactPhone, email: v.contactEmail, role: nearMiss.title }], taxExemption: { certificateNumber: v.certificate, expires: '2028-12-31' } })
  subject = await h.command('customer.certificate', { customerId: subject.id, version: subject.version, file: { mediaType: 'application/pdf', base64: pdf } })
  const site = await h.command('site.save', { ...b.site, customerId: subject.id, address: v.siteAddress, contact: v.siteContact, contactPhone: v.siteContactPhone, contactEmail: v.siteContactEmail, accessNotes: 'Gate code at reception' })

  const peer = await h.command('customer.save', { name: 'Peer Plumbing', email: mail('synthetic-glove-peer'), phone: '02 9555 0909' })
  const peerSite = await h.command('site.save', { customerId: peer.id, address: '77 Peer Road, Epping NSW 2121', accessNotes: `Gate code from ${v.email}; spare key with reception` })
  const peerEquipment = await h.command('equipment.save', { siteId: peerSite.id, type: 'Boiler', make: 'Synthetic', serial: 'synthetic-glove-peer-unit', location: `Plant room; certificate ${v.certificate} on file`, photo: { mediaType: 'image/jpeg', base64: jpeg } })
  const peerConversation = await h.command('conversation.log', { customerId: peer.id, kind: 'note', text: `Neighbour ${v.duplicateName} at ${v.siteAddress} asked about a quote; ${nearMiss.leeds} also rang` })

  // One peer note mentions every typed identifier kind, each standing alone between separators.
  const peerRoster = await h.command('conversation.log', { customerId: peer.id, kind: 'note', text: values().join(' | ') })
  const subjectWork = await completedJob(h, b, '2026-10-20')
  const peerB = { ...b, customer: peer, site: peerSite }
  const peerWork = await completedJob(h, peerB, '2026-10-21')
  const subjectPhoto = await b.priyaPerson.run('visit.capture', { visitId: subjectWork.visit.id, deviceTime: '2026-10-20T23:05:00Z', kind: 'photo', caption: 'Subject front door', photo: { mediaType: 'image/jpeg', base64: jpeg } })
  const subjectEquipment = await h.command('equipment.save', { siteId: site.id, type: 'Heat pump', make: 'Synthetic', serial: 'synthetic-glove-subject-unit', location: 'Subject plant room', photo: { mediaType: 'image/jpeg', base64: jpeg } })
  await h.command('conversation.log', { customerId: subject.id, kind: 'note', text: `Subject note from ${v.contact}` })
  const peerNote = await b.priyaPerson.run('visit.capture', { visitId: peerWork.visit.id, deviceTime: '2026-10-21T23:05:00Z', kind: 'note', text: `Rang ${v.phone} to book; alternate ${nearMiss.phone}; ${nearMiss.title}; ${nearMiss.annual} due` })
  const peerPhoto = await b.priyaPerson.run('visit.capture', { visitId: peerWork.visit.id, deviceTime: '2026-10-21T23:06:00Z', kind: 'photo', caption: `Boiler room for ${v.contact}`, photo: { mediaType: 'image/jpeg', base64: jpeg } })

  const invoices = []
  for (const work of [subjectWork, peerWork]) {
    let invoice = await b.office.run('invoice.prepare', { jobId: work.job.id })
    invoice = await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
    const payment = await h.command('payment.record', { invoiceId: invoice.id, version: invoice.version, method: 'check', reference: `synthetic-glove-check-${invoices.length}`, amount: invoice.revisions.at(-1).totals.total })
    invoices.push({ invoice, payment })
  }

  // Shared rows: one names the subject's contact, others merely resemble short values.
  const template = await h.command('template.save', { name: `Priority plan for ${v.contact}`, options: [{ name: 'Standard', lines: [{ description: 'Service', quantity: '1', unitPrice: '10.00' }] }] })
  const annual = await h.command('service.save', { code: 'ANNUAL-TUNE', name: 'Annual tune-up', unitPrice: '10.00', tax: 'GST' })
  const annabel = await h.command('technician.save', { name: 'Annabel Leeds' })

  // The subject's own website request: its intake contact name is one more typed value.
  const intake = await h.command('intake.configure', { version: (await h.state()).business[0].version, enabled: true, siteKey: 'synthetic-glove-site', secret: 'synthetic-glove-turnstile', allowedOrigins: [embed] })
  h.turnstile.answer = () => ({ success: true, action: 'glove-request', hostname: new URL(embed).hostname, challenge_ts: new Date().toISOString() })
  const received = await h.request('/api/glove/public/intake', { method: 'POST', as: '', headers: { origin: embed }, body: { submissionId: randomUUID(), turnstileToken: 'synthetic-glove-challenge', consent: true, name: v.intakeName, phone: v.phone, email: v.email, address: v.siteAddress, service: 'Heat pump service', description: 'Synthetic website request', photos: [] } })
  assert.equal(received.status, 200, await received.clone().text())

  // Command identities admit letters, digits, hyphen and underscore, so the embedded email is a typed one without an at sign.
  const commandId = `note-${v.duplicateEmail}-request`
  const echoed = await h.command('conversation.log', { customerId: subject.id, kind: 'note', text: 'Client-chosen command identity' }, { commandId })

  // Customer email, Stripe test and Maps connections are present, and the subject has been emailed once.
  await h.command('mail.connect', { provider: 'postmark', apiKey: 'synthetic-glove-mail', fromEmail: mail('synthetic-glove-office') })
  await connectPayments(h)
  await h.command('maps.connect', { key: 'synthetic-glove-maps' })
  const emailed = await b.office.run('email.send', { kind: 'invoice', id: invoices[0].invoice.id, version: (await h.state()).invoices.find(i => i.id === invoices[0].invoice.id).version })
  // A paid job's review request carries a stop link, which saves the unkeyed address digest this edition must erase.
  await h.command('review.configure', { version: (await h.state()).business[0].version, enabled: true, approved: true, trigger: 'payment', periodDays: 3650, postalAddress: '1 Synthetic Street, Epping NSW 2121', template: 'Please share your experience with our service.', url: 'https://g.page/r/synthetic-glove-peer/review' })
  const consenting = (await h.state()).customers.find(c => c.id === subject.id)
  await h.command('review.consent', { customerId: subject.id, version: consenting.version, enabled: true, reference: 'Explicit in-person permission for review email' })
  const current = (await h.state()).customers.find(c => c.id === subject.id)
  const review = await h.command('review.request', { jobId: subjectWork.job.id, confirmation: { businessVersion: (await h.state()).business[0].version, customerVersion: current.version, address: current.email } })
  assert.equal(review.sent, true, JSON.stringify(review))

  const merged = await h.command('customer.merge', { survivorId: subject.id, mergedIds: [duplicate.id], versions: { [subject.id]: (await h.state()).customers.find(c => c.id === subject.id).version, [duplicate.id]: duplicate.version } })
  return { b, merged, subject, duplicate, site, emailed, peer, peerSite, peerEquipment, peerConversation, peerRoster, peerWork, peerNote, peerPhoto, subjectWork, subjectPhoto, subjectEquipment, invoices, template, annual, annabel, intake, echoed, commandId,
    originals: { subject: [subjectPhoto.file.fileId, subjectEquipment.photos[0].fileId, subject.taxExemption.certificate.fileId], peer: [peerPhoto.file.fileId, peerEquipment.photos[0].fileId] } }
}

export async function preview(h, w) {
  const customer = (await h.state()).customers.find(c => c.id === w.subject.id)
  return h.command('privacy.preview', { customerId: customer.id, version: customer.version })
}

export async function erase(h, w, { commandId } = {}) {
  const customer = (await h.state()).customers.find(c => c.id === w.subject.id), p = await preview(h, w)
  return h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: p.fingerprint }, commandId ? { commandId } : {})
}

/** The records a peer or shared owner holds before erasure, keyed for before-and-after comparison. */
export async function peerRecords(h, w) {
  const s = await h.state(), pick = (kind, id) => structuredClone(s[kind].find(r => r.id === id))
  const jobId = w.peerWork.job.id
  return {
    sites: [pick('sites', w.peerSite.id)], equipment: [pick('equipment', w.peerEquipment.id)], conversations: [pick('conversations', w.peerConversation.id), pick('conversations', w.peerRoster.id)],
    captures: [pick('captures', w.peerNote.id), pick('captures', w.peerPhoto.id)], templates: [pick('templates', w.template.id)],
    services: [pick('services', w.annual.id)], technicians: [pick('technicians', w.annabel.id)],
    customers: [pick('customers', w.peer.id)], jobs: [pick('jobs', jobId)], visits: [pick('visits', w.peerWork.visit.id)],
    invoices: [pick('invoices', w.invoices[1].invoice.id)], payments: [pick('payments', w.invoices[1].payment.id)],
  }
}

/** Only the exact typed values change; every other field and character stays as before. */
export function expectedPeer(w, before) {
  const v = subjectValues, edit = (kind, change) => before[kind].map(r => ({ ...r, ...change(r), version: r.version + 1 }))
  const same = kind => before[kind]
  return {
    sites: edit('sites', () => ({ accessNotes: 'Gate code from [erased]; spare key with reception' })),
    equipment: edit('equipment', () => ({ location: 'Plant room; certificate [erased] on file' })),
    conversations: [
      { ...before.conversations[0], text: `Neighbour [erased] at [erased] asked about a quote; ${nearMiss.leeds} also rang`, version: before.conversations[0].version + 1 },
      { ...before.conversations[1], text: values().map(() => '[erased]').join(' | '), version: before.conversations[1].version + 1 },
    ],
    captures: [
      { ...before.captures[0], text: `Rang [erased] to book; alternate ${nearMiss.phone}; ${nearMiss.title}; ${nearMiss.annual} due`, version: before.captures[0].version + 1 },
      { ...before.captures[1], caption: 'Boiler room for [erased]', version: before.captures[1].version + 1 },
    ],
    templates: edit('templates', () => ({ name: 'Priority plan for [erased]' })),
    services: same('services'), technicians: same('technicians'), customers: same('customers'), jobs: same('jobs'), visits: same('visits'), invoices: same('invoices'), payments: same('payments'),
  }
}

export const unchanged = ['services', 'technicians', 'customers', 'jobs', 'visits', 'invoices', 'payments']

/** Subject values in a text; a value counts only where it stands as that value. */
const holds = (text, value) => new RegExp(`(?<![A-Za-z0-9])${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9])`).test(text)

/** Raw, lowercased and the edition's fixed-prefix unkeyed digests of every subject value. */
export function digests() {
  const out = []
  for (const value of values()) for (const text of [value, value.toLowerCase(), `glove-email-stop-address:${value}`, `glove-email-stop-address:${value.toLowerCase()}`]) {
    const digest = createHash('sha256').update(text).digest()
    out.push([`sha256 of ${JSON.stringify(text)}`, digest.toString('hex')], [`sha256 (base64) of ${JSON.stringify(text)}`, digest.toString('base64')])
  }
  return out
}

const stored = value => value instanceof ArrayBuffer || ArrayBuffer.isView(value) ? Buffer.from(value instanceof ArrayBuffer ? value : value.buffer, value.byteOffset ?? 0, value.byteLength).toString('utf8')
  : Array.isArray(value) ? value.length && value.every(n => Number.isInteger(n) && n >= 0 && n <= 255) ? Buffer.from(value).toString('utf8') : value.map(stored).join('\n')
    : value && typeof value === 'object' ? Object.values(value).map(stored).join('\n') : typeof value === 'string' ? value : String(value ?? '')

/** Every retained place a subject value could remain, as named text. */
export async function stores(h) {
  const names = (await h.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name GLOB 'glove_*' OR name GLOB 'rer_*' OR name GLOB 'ik_*') ORDER BY name").all()).results.map(r => r.name)
  const out = {}
  for (const name of names) out[`table ${name}`] = stored((await h.db.prepare(`SELECT * FROM "${name}"`).all()).results)
  out['saved command outcomes'] = stored((await h.db.prepare('SELECT result FROM glove_commands').all()).results)
  out['Activity'] = await h.request('/api/glove/activity').then(r => r.text())
  out['business export'] = await h.request('/api/glove/export').then(r => r.text())
  out['Worker log'] = (h.logs ?? []).map(entry => typeof entry === 'string' ? entry : JSON.stringify(entry)).join('\n')
  return out
}

export function assertNoSubject(places) {
  const hashes = digests()
  for (const [place, text] of Object.entries(places)) {
    for (const value of values()) assert.ok(!holds(text, value), `${place} holds ${JSON.stringify(value)}`)
    for (const [label, digest] of hashes) assert.ok(!text.includes(digest), `${place} holds ${label}`)
  }
}

export { fileBytes, nearMiss }
