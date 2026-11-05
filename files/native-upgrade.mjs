// One-off FIELD-003 A evidence. Run from the product checkout. No registration.
// Full emitted Workers, real native auth/D1, mail faked only at its provider edge.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { mkdtemp, readdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join, dirname } from 'node:path'
import { once } from 'node:events'
import { execFileSync } from 'node:child_process'

const require = createRequire(join(process.cwd(), 'package.json'))
const { Miniflare, convertV4MiniflareOptions } = require('miniflare')
const { unstable_splitSqlQuery } = require('wrangler')
const packet = dirname(new URL(import.meta.url).pathname)
const main = '/workspace/glove-main', candidate = process.cwd()
const sourceSha = '46c9593e83723388e134dfa7a38733ba982ad5ba'
const mainSha = 'e0bb7c6b8489e3ffc51b26a7601764be9a870f99'
const persist = await mkdtemp(join(tmpdir(), 'glove-native-upgrade-'))
const origin = 'https://127.0.0.1', mails = []
const at = '2026-11-05T21:51:00.000Z'
const bindings = { AUTH_LOCAL: 'false', AUTH_ORIGIN: origin, OWNER_EMAIL: 'synthetic-glove-1@example.test', SESSION_SECRET: randomBytes(32).toString('hex'), SETUP_TOKEN: randomBytes(32).toString('hex'), MAIL_PROVIDER: 'resend', MAIL_FROM: 'auth@example.test', MAIL_API_KEY: 'synthetic-glove-mail-edge' }
let mf, db, listener, owner = '', office = '', technician = ''
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const cookies = response => response.headers.getSetCookie().map(line => line.split(';')[0]).join('; ')
const receipt = { schema: 1, clause: 'FIELD-003', blocker: 'A', lifetimeFix: 'FIX1of2', mainSha, beforeSha: sourceSha, at, phases: [], controls: {} }
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const photo = { mediaType: 'image/png', base64: png.toString('base64') }

async function start(root, now = at) {
  if (mf) await mf.dispose()
  const server = join(root, 'dist/server')
  const config = JSON.parse(await readFile(join(server, 'wrangler.json'), 'utf8'))
  const modules = [config.main, ...(await readdir(join(server, 'assets'))).filter(f => f.endsWith('.js')).map(f => `assets/${f}`)]
    .map(file => ({ type: 'ESModule', path: join(server, file) }))
  // Only the runtime clock boundary is controlled. All production exports,
  // routes, storage and authority implementations are emitted, unchanged code.
  modules.unshift({ type: 'ESModule', path: join(server, 'upgrade-clock.mjs'), contents: `
    import worker from './index.js'; export { MailRejections } from './index.js';
    const SystemDate = Date; const now = ${JSON.stringify(now)};
    globalThis.Date = new Proxy(SystemDate, {
      construct(target,args) { return Reflect.construct(target,args.length?args:[now]); },
      get(target,key) { return key==='now'?()=>SystemDate.parse(now):Reflect.get(target,key); }
    }); export default worker;` })
  const options = convertV4MiniflareOptions({
    host: '127.0.0.1', port: 0, upstream: origin, modulesRoot: server, modules,
    compatibilityDate: config.compatibility_date, compatibilityFlags: config.compatibility_flags,
    d1Databases: { DB: 'glove-native-upgrade' },
    durableObjects: { MAIL_REJECTIONS: { className: 'MailRejections', scriptName: 'app', useSQLite: true } },
    bindings,
    outboundService: async request => {
      assert.equal(request.url, 'https://api.resend.com/emails', 'only native auth mail reaches the edge fake')
      mails.push(await request.json())
      return Response.json({ id: `synthetic-glove-${mails.length}` })
    },
  })
  options.workers[0].config.name = 'app'
  options.workers[0].config.exports = { MailRejections: { type: 'durable-object', storage: 'sqlite' } }
  mf = new Miniflare({ ...options, resourcePersistencePath: persist })
  listener = await mf.ready
  db = await mf.getD1Database('DB')
}
function request(path, { body, as = owner, headers = {}, method = body === undefined ? 'GET' : 'POST' } = {}) {
  return fetch(new URL(path, listener), { method, redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { origin, 'content-type': 'application/json', ...(as ? { cookie: as } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
}
async function command(type, payload, as = owner) {
  const response = await request('/api/glove/commands', { as, body: { commandId: randomUUID(), type, payload } })
  const value = await response.json()
  // Never include command responses in assertion errors: link responses carry secrets.
  assert.equal(response.status, 200, `${type}: HTTP status`)
  assert.equal(value.ok, true, `${type}: outcome`)
  return value.result
}
const state = async () => (await request('/api/glove/state')).json()
async function person(name, role) {
  const email = `${name.toLowerCase()}@example.test`
  assert.equal((await request('/auth/invite', { body: { email, displayName: name, role: 'member' } })).status, 202)
  const mail = mails.findLast(m => m.to?.includes(email))
  const link = String(mail?.text).match(/https:[^\s]+\/auth\/confirm\?token=([^\s]+)/)
  assert.equal(Boolean(link), true, 'native invitation mail')
  const confirmed = await request('/auth/confirm', { as: '', body: { token: decodeURIComponent(link[1]) } })
  assert.equal(confirmed.status, 303)
  const cookie = cookies(confirmed)
  const session = await (await request('/auth/session', { as: cookie })).json()
  await command('role.set', { operatorId: session.operator.id, role })
  return { id: session.operator.id, cookie }
}
async function persistence() {
  // These stay in memory and are never written or printed.
  return {
    records: (await db.prepare('SELECT * FROM glove_records ORDER BY kind,id').all()).results,
    secrets: (await db.prepare('SELECT * FROM glove_report_secrets ORDER BY link_id').all()).results,
    operators: (await db.prepare('SELECT * FROM oa_operators ORDER BY id').all()).results,
    sessions: (await db.prepare('SELECT * FROM oa_sessions ORDER BY id').all()).results,
    events: (await db.prepare('SELECT * FROM glove_events ORDER BY sequence').all()).results,
  }
}
function samePersistence(a, b) {
  for (const key of Object.keys(a)) assert.equal(JSON.stringify(a[key]) === JSON.stringify(b[key]), true, `unchanged ${key} across upgrade`)
  return Object.fromEntries(Object.keys(a).map(key => [key, true]))
}
let report, link, original, unrelated, officeId
const customer = (path = '', bearer = link.token) => request('/api/glove/public/reports' + path, { as: '', headers: { authorization: `Bearer ${bearer}` } })
async function readPair(label, expected) {
  const page = await customer(), file = await customer(`/files/${original.file.fileId}`)
  const row = { label, reportStatus: page.status, originalStatus: file.status }
  assert.equal(page.status, expected, `${label}: report`)
  assert.equal(file.status, expected, `${label}: original`)
  if (expected === 200) {
    const bytes = Buffer.from(await page.arrayBuffer()), originalBytes = Buffer.from(await file.arrayBuffer())
    assert.equal(bytes.equals(reportBytes), true, `${label}: exact main response bytes`)
    assert.equal(originalBytes.equals(png), true, `${label}: exact original input bytes`)
    row.exactSnapshotBytes = true; row.exactOriginalBytes = true
    row.snapshotSha256 = sha256(bytes); row.originalSha256 = sha256(originalBytes)
  } else {
    assert.equal((await page.json()).error.code, 'REPORT_LINK')
    assert.equal((await file.json()).error.code, 'REPORT_LINK')
    row.errorCode = 'REPORT_LINK'
  }
  receipt.phases.push(row)
  console.log(`${label}: report=${row.reportStatus} original=${row.originalStatus}`)
}
let reportBytes, frozen
try {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sourceSha)
  await start(main)
  for (const file of (await readdir(join(main, 'migrations/core'))).filter(f => f.endsWith('.sql')).sort())
    await db.batch(unstable_splitSqlQuery(await readFile(join(main, 'migrations/core', file), 'utf8')).map(sql => db.prepare(sql)))
  const boot = await request('/auth/bootstrap', { as: '', body: { token: bindings.SETUP_TOKEN, displayName: 'Synthetic Glove Owner' } })
  assert.equal(boot.status, 303); owner = cookies(boot)
  const o = await person('SyntheticOffice', 'office'), techPerson = await person('SyntheticTechnician', 'technician')
  office = o.cookie; officeId = o.id; technician = techPerson.cookie
  await command('business.save', { name: 'Synthetic Glove Upgrade', currency: 'USD', timezone: 'America/Chicago' })
  const service = await command('service.save', { code: 'SVC', name: 'Upgrade inspection', unitPrice: '100.00', checklist: [{ label: 'Isolate power', required: true }] })
  const customerRecord = await command('customer.save', { name: 'Synthetic Glove Customer' })
  const site = await command('site.save', { customerId: customerRecord.id, address: '24 Synthetic Lane, Austin TX 78701' })
  const tech = await command('technician.save', { name: 'Synthetic Technician', operatorId: techPerson.id })
  let quote = await command('quote.draft', { customerId: customerRecord.id, siteId: site.id, title: 'Prior-installation inspection', lines: [{ description: 'Inspect system', quantity: '1', unitPrice: '100.00', serviceId: service.id }] })
  quote = await command('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  quote = await command('quote.accept', { quoteId: quote.id, version: quote.version, revision: 1, method: 'phone', customerName: customerRecord.name })
  const job = await command('job.create', { quoteId: quote.id })
  const visit = await command('visit.book', { jobId: job.id, technicianId: tech.id, date: '2026-11-05', start: '09:00', end: '10:00' })
  await command('visit.arrive', { visitId: visit.id, deviceTime: '2026-11-05T15:00:00Z' }, technician)
  for (const item of job.checklist.filter(x => x.required)) await command('visit.capture', { visitId: visit.id, deviceTime: '2026-11-05T15:01:00Z', kind: 'checklist', itemId: item.id, result: 'done' }, technician)
  original = await command('visit.capture', { visitId: visit.id, deviceTime: '2026-11-05T15:02:00Z', kind: 'photo', photo, caption: 'Main-issued original' }, technician)
  await command('visit.complete', { visitId: visit.id, deviceTime: '2026-11-05T16:00:00Z', summary: 'Inspected and cleaned filters', findings: 'Filters now clear', signoff: { absentReason: 'Customer left for work' }, recommendations: [{ title: 'Annual inspection' }] }, technician)
  report = (await state()).serviceReports.find(r => r.visitId === visit.id)
  link = await command('report.link', { reportId: report.id }, office)
  assert.equal(Object.hasOwn(link, 'issuedBy'), false, 'legitimate main-issued legacy record')
  assert.equal(link.createdAt, at); assert.equal(link.expiresAt, '2026-11-12T21:51:00.000Z'); assert.equal(link.revokedAt, null)
  const other = await command('customer.save', { name: 'Synthetic Glove Other Customer' })
  const otherSite = await command('site.save', { customerId: other.id, address: '99 Unrelated Lane' })
  const equipment = await command('equipment.save', { siteId: otherSite.id, type: 'Unrelated unit', photo })
  unrelated = equipment.photos[0].fileId
  const opened = await customer()
  assert.equal(opened.status, 200)
  reportBytes = Buffer.from(await opened.arrayBuffer())
  assert.equal(JSON.stringify(JSON.parse(reportBytes).report) === JSON.stringify(report.snapshot), true)
  await writeFile(join(packet, 'main-report.json'), reportBytes)
  await writeFile(join(packet, 'original.png'), png)
  receipt.linkMetadata = Object.fromEntries(Object.entries(link).filter(([key]) => key !== 'token'))
  receipt.reportId = report.id; receipt.originalFileId = original.file.fileId
  const issue = (await db.prepare("SELECT actor_id,actor_role,subject_id,job_id,at,data FROM glove_events WHERE kind='report.link.created' AND subject_id=?").bind(link.id).all()).results
  assert.equal(issue.length, 1); assert.equal(issue[0].actor_id, officeId); assert.equal(issue[0].actor_role, 'office')
  receipt.nativeIssuance = issue[0]
  frozen = await persistence()
  await readPair('main-before-upgrade', 200)
  await start(candidate)
  receipt.unchangedBefore = samePersistence(frozen, await persistence())
  await readPair('original-candidate-before-fix', 404)
  receipt.unchangedAfterFailingReads = samePersistence(frozen, await persistence())
  await writeFile(join(packet, 'before-receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
  console.log('BEFORE_REPRODUCED; waiting for fixed emitted Worker (send after)')
  process.stdin.resume()
  await once(process.stdin, 'data')
  await start(candidate)
  receipt.afterSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  receipt.unchangedAfter = samePersistence(frozen, await persistence())
  await readPair('fixed-candidate-after-upgrade', 200)
  receipt.unchangedAfterPassingReads = samePersistence(frozen, await persistence())
  assert.equal((await customer(`/files/${unrelated}`)).status, 404)
  assert.equal((await customer(`?reportId=${report.id}`)).status, 404)
  assert.equal((await request(`/api/glove/files/${original.file.fileId}`, { as: '', headers: { authorization: `Bearer ${link.token}` } })).status, 401)
  receipt.controls.isolation = { unrelatedOriginal: 404, recordSelectionQuery: 404, privateOriginalDoor: 401 }
  const branch = await command('branch.save', { name: 'Other branch', prefix: 'OTH', timezone: 'America/Phoenix', zips: [] })
  await command('branch.limit', { operatorId: officeId, branchId: 'main' }); await readPair('matching-current-branch', 200)
  await command('branch.limit', { operatorId: officeId, branchId: branch.id }); await readPair('withdrawn-current-branch', 404)
  await command('branch.limit', { operatorId: officeId, branchId: null }); await readPair('restored-current-branch', 200)
  await command('role.set', { operatorId: officeId, role: 'viewer' }); await readPair('withdrawn-current-role', 404)
  await command('role.set', { operatorId: officeId, role: 'office' }); await readPair('restored-current-role', 200)
  assert.equal((await request('/auth/operator/status', { body: { operatorId: officeId, status: 'inactive' } })).status, 200)
  await readPair('inactive-native-issuer', 404)
  assert.equal((await request('/auth/operator/status', { body: { operatorId: officeId, status: 'active' } })).status, 200)
  await readPair('reactivated-native-issuer', 200)
  await start(candidate, '2026-11-12T21:50:59.999Z'); await readPair('one-ms-before-expiry', 200)
  await start(candidate, link.expiresAt); await readPair('at-expiry', 404)
  await start(candidate); await readPair('unexpired-again', 200)
  const liveForErase = await command('report.link', { reportId: report.id })
  await command('report.revoke', { linkId: link.id, version: link.version }); await readPair('explicit-revocation', 404)
  const c = (await state()).customers.find(x => x.id === customerRecord.id)
  const preview = await command('privacy.preview', { customerId: c.id, version: c.version })
  await command('privacy.erase', { customerId: c.id, version: c.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  assert.equal((await customer('', liveForErase.token)).status, 404)
  assert.equal((await customer(`/files/${original.file.fileId}`, liveForErase.token)).status, 404)
  receipt.controls.erasure = { reportStatus: 404, originalStatus: 404, reportsRemaining: (await state()).serviceReports.length }
  assert.equal(receipt.controls.erasure.reportsRemaining, 0)
  receipt.exit = 0
  await writeFile(join(packet, 'upgrade-receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
  console.log('PROBE FIELD-003 A: main-created valid report/original links before upgrade -> 200/200; original candidate -> 404/404 REPORT_LINK; fixed candidate -> 200/200 exact bytes over unchanged prior data')
} catch (error) {
  console.error(`UPGRADE_PROBE_FAILED ${error.name}: ${error.message}`)
  process.exitCode = 1
} finally {
  if (mf) await mf.dispose()
  await rm(persist, { recursive: true, force: true })
  process.stdin.pause()
}
