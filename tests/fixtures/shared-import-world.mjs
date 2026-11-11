// Independent installations for DATA-006: documented-shape CSV files and the
// ServiceM8 small-HVAC fixture staged and committed through the Owner doors.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { installation, business } from '../api/harness.mjs'

export const email = name => [name, 'example.test'].join('@')
export const sha = value => createHash('sha256').update(value).digest('hex')
const root = './tests/fixtures/servicem8-small-hvac/'

/** One installation per step; closed when the step ends. */
export async function open(t) {
  const h = await installation()
  t.after(() => h.close())
  await business(h)
  return h
}

const send = (h, type, payload, as) => h.request('/api/glove/commands', { method: 'POST', body: { commandId: crypto.randomUUID(), type, payload }, ...(as ? { as } : {}) }).then(r => r.json())
export const batchOf = async (h, id) => (await h.state()).imports.find(i => i.id === id)

/** Stage a documented-shape customer CSV through Owner import.stage. */
export const stageCsv = (h, name, text, mapping = { name: 'Name', email: 'Email', siteAddress: 'Address' }) => h.command('import.stage', { format: 'csv', files: [{ name, text }], mapping })

/** Run the same Owner commit or undo until the batch finishes, reading the batch's current version each pass. */
export async function finish(h, type, batch, extra = {}) {
  let first, result
  for (let pass = 1; ; pass++) {
    const current = await batchOf(h, batch.id)
    result = await send(h, type, { batchId: batch.id, version: current.version, ...(type === 'import.commit' ? { fingerprint: batch.preview.fingerprint } : { reason: 'Peer batch withdrawn' }), ...extra })
    if (pass === 1) first = result
    if (result.ok || result.error.code !== 'IMPORT_INCOMPLETE') return { first, result, passes: pass }
  }
}
export async function commit(h, staged) {
  const { result } = await finish(h, 'import.commit', staged)
  assert.equal(result.ok, true, JSON.stringify(result))
  return result.result
}
export async function undo(h, batch) {
  const { result } = await finish(h, 'import.undo', batch)
  assert.equal(result.ok, true, JSON.stringify(result))
  return result.result
}

export const csvText = rows => rows.map(r => r.join(',')).join('\n') + '\n'
const withSite = (name, who, street) => [name, email(who), street]

/** Three CSV files: a survivor-and-peer batch, a duplicate-and-peer batch and a peer-only batch.
 * Every subject row carries a customer and a site; the duplicate is merged into the survivor. */
export async function csvWorld(h) {
  const files = {
    first: { name: 'synthetic-glove-d6-first.csv', text: csvText([['Name', 'Email', 'Address'], withSite('Synthetic Alpha', 'synthetic-glove-d6-alpha', '11 Alpha Road'), withSite('Synthetic Peer One', 'synthetic-glove-d6-one', '12 Peer Road')]) },
    second: { name: 'synthetic-glove-d6-second.csv', text: csvText([['Name', 'Email', 'Address'], withSite('Synthetic Alpha Duplicate', 'synthetic-glove-d6-dup', '21 Duplicate Road'), withSite('Synthetic Peer Two', 'synthetic-glove-d6-two', '22 Peer Road')]) },
    peers: { name: 'synthetic-glove-d6-peers.csv', text: csvText([['Name', 'Email', 'Address'], withSite('Synthetic Peer Three', 'synthetic-glove-d6-three', '31 Peer Road'), withSite('Synthetic Peer Four', 'synthetic-glove-d6-four', '32 Peer Road')]) },
  }
  const batches = {}
  for (const key of ['first', 'second', 'peers']) {
    const staged = await stageCsv(h, files[key].name, files[key].text)
    batches[key] = { staged, committed: await commit(h, staged) }
  }
  const s = await h.state(), by = name => s.customers.find(c => c.name === name)
  const people = { alpha: by('Synthetic Alpha'), dup: by('Synthetic Alpha Duplicate'), one: by('Synthetic Peer One'), two: by('Synthetic Peer Two'), three: by('Synthetic Peer Three'), four: by('Synthetic Peer Four') }
  for (const [key, c] of Object.entries(people)) assert.ok(c, `${key} was imported`)
  await h.command('customer.merge', { survivorId: people.alpha.id, mergedIds: [people.dup.id], versions: { [people.alpha.id]: people.alpha.version, [people.dup.id]: people.dup.version } })
  return { files, batches, people, subject: async () => (await h.state()).customers.find(c => c.id === people.alpha.id) }
}

/** Subject values of the CSV world's merged group, written out independently of the application. */
export const csvSubjectValues = () => ['Synthetic Alpha', 'Synthetic Alpha Duplicate', email('synthetic-glove-d6-alpha'), email('synthetic-glove-d6-dup'), '11 Alpha Road', '21 Duplicate Road']

/** The ServiceM8 small-HVAC export plus two payments naming one attachment and three attachment originals. */
export const IDS = {
  balmain: '6b1f3a52-1c2e-4d8a-9a5e-0d3c2b7f0a11', rozelle: '9d0e4c71-5b2a-4f39-8e61-7a4b3c2d1e22', tenant: '2c7a9e13-8f4d-4b6e-a1c0-5e9f8d7c6b33',
  balmainJob: '3e4f5a6b-aaaa-4c7d-8e9f-0a1b2c3d4e01', rozelleJob: '3e4f5a6b-cccc-4c7d-8e9f-0a1b2c3d4e03',
  jobAttachment: '8b9c0d1e-0001-4f2a-9b3c-4d5e6f7a8b01', sharedAttachment: '8b9c0d1e-0002-4f2a-9b3c-4d5e6f7a8b02', companyAttachment: '8b9c0d1e-0003-4f2a-9b3c-4d5e6f7a8b03',
}
export async function servicem8Files() {
  const kinds = ['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment']
  const files = await Promise.all(kinds.map(async kind => ({ name: `${kind}.json`, text: await readFile(root + kind + '.json', 'utf8') })))
  const payments = [
    { uuid: '7b9c0d1e-0001-4f2a-9b3c-4d5e6f7a8b01', job_uuid: IDS.balmainJob, amount: '10.00', attachment_uuid: IDS.sharedAttachment, private_source_note: 'Synthetic subject payment source' },
    { uuid: '7b9c0d1e-0002-4f2a-9b3c-4d5e6f7a8b02', job_uuid: IDS.rozelleJob, amount: '20.00', attachment_uuid: IDS.sharedAttachment, private_source_note: 'Synthetic peer payment source' },
  ]
  const originals = [
    { name: `attachments/${IDS.jobAttachment}`, base64: (await readFile(root + `attachment-${IDS.jobAttachment}.jpg`)).toString('base64') },
    { name: `attachments/${IDS.sharedAttachment}`, base64: Buffer.from('Synthetic signoff naming two customers\n').toString('base64') },
    { name: `attachments/${IDS.companyAttachment}`, base64: Buffer.from('Synthetic client terms\n').toString('base64') },
  ]
  return [...files, { name: 'jobpayment.json', text: JSON.stringify(payments) }, ...originals]
}
export async function servicem8World(h) {
  const files = await servicem8Files()
  const staged = await h.command('import.stage', { files })
  const committed = await commit(h, staged)
  const s = await h.state(), by = uuid => s.customers.find(c => c.id === `sm8-${uuid}`)
  return { files, staged, committed, people: { balmain: by(IDS.balmain), rozelle: by(IDS.rozelle), tenant: by(IDS.tenant) } }
}

/** Every glove record and every import-kit row, decoded: the state a refusal or a preview must leave alone. */
export async function stored(h) {
  const names = (await h.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'ik_%' OR name='glove_records') ORDER BY name").all()).results.map(r => r.name)
  const out = {}
  for (const name of names) out[name] = (await h.db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all()).results
  return out
}
const text = value => value instanceof ArrayBuffer ? Buffer.from(value).toString('latin1') : Array.isArray(value) && value.length && value.every(n => Number.isInteger(n) && n >= 0 && n <= 255) ? Buffer.from(value).toString('latin1') : Array.isArray(value) ? value.map(text).join('\n') : value && typeof value === 'object' ? Object.values(value).map(text).join('\n') : String(value ?? '')
/** Decoded text of every ik table (blob bytes included) for a value search. */
export async function importKitText(h) {
  const tables = await stored(h)
  return Object.fromEntries(Object.entries(tables).filter(([name]) => name.startsWith('ik_')).map(([name, rows]) => [name, rows.map(text).join('\n')]))
}
/** Decoded text of every glove record: the batch records of imports, with any uploaded file text or base64, are in here. */
export async function recordsText(h) {
  return (await stored(h)).glove_records.map(text).join('\n')
}
/** The retained bytes of one original: its chunks, in order, hold the file as base64 text. */
export async function originalBytes(h, jobId, name, digest) {
  const key = JSON.stringify([name, digest])
  const chunks = (await h.db.prepare('SELECT bytes FROM ik_d1_original_chunks WHERE job_id=? AND original_key=? ORDER BY ordinal').bind(jobId, key).all()).results
  return Buffer.from(Buffer.concat(chunks.map(r => Buffer.from(r.bytes))).toString(), 'base64')
}
export const originalsOf = async (h, jobId) => ({
  rows: (await h.db.prepare('SELECT * FROM ik_originals WHERE job_id=?').bind(jobId).all()).results.length,
  chunks: (await h.db.prepare('SELECT * FROM ik_d1_original_chunks WHERE job_id=?').bind(jobId).all()).results.length,
})

export const preview = (h, c) => h.command('privacy.preview', { customerId: c.id, version: c.version })
export const erase = (h, c, fingerprint, opts = {}) => h.command('privacy.erase', { customerId: c.id, version: c.version, confirm: 'ERASE', fingerprint }, opts)
export const exportOf = async (h, c) => { const r = await h.command('privacy.export', { customerId: c.id, version: c.version }); return { outcome: r.outcome, data: JSON.parse(r.download) } }
