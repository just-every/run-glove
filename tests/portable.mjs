// Leave with everything: a real installation (rer setup + rer dev) runs a
// job from quote to field evidence and a ServiceM8 move-in, `rer export`
// writes the archive, `rer import` restores it into a fresh checkout, and the
// restored installation has the same records, timeline, photos, command
// outcomes and move-in journal, and keeps working. Every child process and
// scratch folder is owned here and removed in finally.
import assert from 'node:assert/strict'
import { stopOwnedRuntime } from './owned-processes.mjs'
import { spawn } from 'node:child_process'
import { mkdtemp, cp, rm, readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'

const workspace = resolve('.'), parent = await mkdtemp(join(tmpdir(), 'glove-portable-')), children = new Set()
const excluded = new Set(['.git', 'node_modules', '.wrangler', '.rer', '.seed', '.cache', '.tanstack', 'dist', 'exports', 'test-results', 'playwright-report'])
const clean = s => s.replace(/RER_OPEN[^\n]*/g, 'RER_OPEN [private]').replace(/token=[^\s"&<>]+/g, 'token=[private]').replace(/rer-dev=[^\s"&<>]+/g, 'rer-dev=[private]')
const fixture = 'tests/fixtures/servicem8-small-hvac/'
const jpeg = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex').toString('base64')

async function copy(name) {
  const root = join(parent, name)
  await cp(workspace, root, { recursive: true, filter: path => { const rel = path.slice(workspace.length + 1); return !excluded.has(rel.split('/')[0]) && !rel.startsWith('.dev.vars') && !rel.startsWith('.env') } })
  // Each installation owns its dependencies, so setup cannot touch the source checkout.
  await command(root, ['pnpm', 'install', '--frozen-lockfile'], 'corepack')
  return root
}
function child(root, args, executable = join(root, 'node_modules/.bin/rer')) {
  const environment = { ...process.env }
  delete environment.RER_LOCAL_OPERATION
  delete environment.RER_ONBOARDING_PROCESS_OWNER
  const proc = spawn(executable, args, { cwd: root, env: { ...environment, CI: 'true', RER_SERVER_JOURNEY: '1', WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] })
  children.add(proc)
  let output = ''
  for (const pipe of [proc.stdout, proc.stderr]) pipe.on('data', chunk => (output += chunk))
  const done = new Promise((resolve, reject) => { proc.once('error', reject); proc.once('close', code => { children.delete(proc); resolve(code) }) })
  return { proc, done, output: () => output }
}
async function command(root, args, executable) {
  const p = child(root, args, executable), code = await p.done
  assert.equal(code, 0, clean(p.output()).slice(-5000))
}
async function freePort() {
  const server = createServer()
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  const p = server.address().port
  await new Promise(r => server.close(r))
  return p
}
const cookiesOf = res => res.headers.getSetCookie().map(x => x.split(';')[0]).join('; ')

async function start(root, port) {
  const runtime = child(root, ['dev', '--port', String(port), '--no-queue'])
  try {
    const deadline = Date.now() + 120000
    while (!runtime.output().includes('RER_READY') && Date.now() < deadline) {
      if (runtime.proc.exitCode !== null) throw Error(clean(runtime.output()).slice(-3000))
      await new Promise(r => setTimeout(r, 200))
    }
    assert.ok(runtime.output().includes('RER_READY'), clean(runtime.output()).slice(-3000))
    const origin = `http://127.0.0.1:${port}`
    let gate = ''
    const request = (path, method = 'GET', body, cookie = '') => fetch(origin + path, { method, redirect: 'manual', headers: { origin, 'content-type': 'application/json', cookie: [gate, cookie].filter(Boolean).join('; ') }, ...(body ? { body: JSON.stringify(body) } : {}) })
    // rer dev's private one-click link: trade its key for the gate cookie, then enter as a persona.
    const open = runtime.output().match(/RER_OPEN (\S+)/)?.[1]
    assert.ok(open, 'rer dev supplies the private one-click sign-in link')
    const link = new URL(open), fragment = new URLSearchParams(link.hash.slice(1))
    const exchanged = await request(link.pathname, 'POST', { key: fragment.get('rer-dev') })
    assert.ok(exchanged.ok, await exchanged.text())
    gate = cookiesOf(exchanged)
    async function enter(persona) {
      const entered = await request(`/auth/dev/enter?as=${persona}`)
      assert.equal(entered.status, 303, await entered.text())
      return cookiesOf(entered)
    }
    const as = cookie => ({
      cookie,
      async cmd(type, payload) {
        const response = await request('/api/glove/commands', 'POST', { commandId: randomUUID(), type, payload }, cookie)
        const result = await response.json()
        assert.equal(response.status, 200, JSON.stringify(result))
        return result.result
      },
      get: async path => (await request(path, 'GET', undefined, cookie)).json(),
    })
    return {
      request, owner: as(await enter(fragment.get('as'))),
      quote: token => fetch(origin + '/api/glove/public/quote', { headers: { authorization: `Bearer ${token}`, cookie: gate }, redirect: 'manual' }),
      booking: token => fetch(origin + '/api/glove/public/booking', { headers: { authorization: `Bearer ${token}`, cookie: gate }, redirect: 'manual' }),
      report: token => fetch(origin + '/api/glove/public/reports', { headers: { authorization: `Bearer ${token}`, cookie: gate }, redirect: 'manual' }),
      async persona(name) { return as(await enter(name)) },
      async close() { await stopOwnedRuntime(runtime) },
    }
  } catch (error) {
    await stopOwnedRuntime(runtime)
    throw error
  }
}

let running
try {
  const source = await copy('source'), destination = await copy('destination'), port = await freePort()
  await command(source, ['setup', '--owner-email', 'owner@example.test', '--port', String(port), '--non-interactive'])
  running = await start(source, port)
  const owner = running.owner
  await owner.cmd('business.save', { name: 'Harbour Air & Electrical', currency: 'AUD', timezone: 'Australia/Sydney' })
  const service = await owner.cmd('service.save', { code: 'SVC', name: 'Split system service', unitPrice: '189.00', checklist: [{ label: 'Clean filters', required: true }] })
  const customer = await owner.cmd('customer.save', { name: 'Harbourview Dental' })
  const site = await owner.cmd('site.save', { customerId: customer.id, address: '14 Harbour St, Balmain NSW 2041' })
  // The local member persona is the technician on the visit.
  const priya = await running.persona('member')
  const member = (await owner.get('/api/glove/state')).operators.find(o => o.email === 'member@dev.localhost')
  await owner.cmd('role.set', { operatorId: member.id, role: 'technician' })
  const tech = await owner.cmd('technician.save', { name: 'Priya N.', operatorId: member.id })
  // DISP-004: the secret calendar address is a credential and never travels in the archive.
  await owner.cmd('technician.calendar', { technicianId: tech.id, url: 'https://calendar.google.com/calendar/ical/priya/private-portable-secret/basic.ics' })
  let quote = await owner.cmd('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Service', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: service.id }] })
  quote = await owner.cmd('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  quote = await owner.cmd('quote.accept', { quoteId: quote.id, version: quote.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  const job = await owner.cmd('job.create', { quoteId: quote.id })
  const visit = await owner.cmd('visit.book', { jobId: job.id, technicianId: tech.id, date: '2026-10-15', start: '09:00', end: '10:30' })
  await priya.cmd('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-14T22:03:00Z' })
  const photo = await priya.cmd('visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T22:10:00Z', kind: 'photo', photo: { mediaType: 'image/jpeg', base64: jpeg } })
  const files = await Promise.all(['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment'].map(async k => ({ name: `${k}.json`, text: await readFile(`${fixture}${k}.json`, 'utf8') })))
  let batch = await owner.cmd('import.stage', { files })
  batch = await owner.cmd('import.commit', { batchId: batch.id, version: batch.version, fingerprint: batch.preview.fingerprint })
  // MONEY-001 private exemption originals belong to the customer archive.
  let certCustomer = (await owner.get('/api/glove/state')).customers.find(c => c.id === customer.id)
  certCustomer = await owner.cmd('customer.save', { ...certCustomer, taxExemption: { certificateNumber: 'PORTABLE-SCHOOL', expires: '2099-12-31' } })
  const certificateBytes = Buffer.from('%PDF-1.7\nPrivate exemption certificate\n%%EOF')
  certCustomer = await owner.cmd('customer.certificate', { customerId: customer.id, version: certCustomer.version, file: { mediaType: 'application/pdf', base64: certificateBytes.toString('base64') } })
  await priya.cmd('visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T22:20:00Z', kind: 'checklist', itemId: job.checklist[0].id, result: 'done' })
  await priya.cmd('visit.complete', { visitId: visit.id, deviceTime: '2026-10-14T23:30:00Z', summary: 'Cleaned filters', findings: 'Coil clean', recommendations: [{ title: 'Annual tune-up' }], signoff: { absentReason: 'Customer away' } })
  const report = (await owner.get('/api/glove/state')).serviceReports.find(r => r.visitId === visit.id)
  const reportLink = await owner.cmd('report.link', { reportId: report.id })
  assert.equal((await running.report(reportLink.token)).status, 200, 'FIELD-003 link opens before export')
  // PLAN-004 link metadata is portable; its bearer credential is not.
  const plan = await owner.cmd('plan.save', { name: 'Maintenance', price: '228.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id })
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
  const agreement = await owner.cmd('agreement.sell', { planId: plan.id, customerId: customer.id, siteId: site.id, via: 'phone', startDate: today })
  const offerPayload = { agreementId: agreement.id, index: 0, slots: [{ technicianId: tech.id, date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), start: '11:00', end: '11:30' }] }
  const bookingLink = await owner.cmd('agreement.offer', offerPayload)
  assert.equal((await running.booking(bookingLink.token)).status, 200, 'PLAN-004 source booking link works')
  // QUOTE-002: retain the exact revision document and hash, require a new bearer after restore.
  let customerQuote = await owner.cmd('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Annual tune-up proposal', lines: [{ description: 'Annual tune-up', quantity: '1', unitPrice: '189.00', serviceId: service.id }] })
  customerQuote = await owner.cmd('quote.approve', { quoteId: customerQuote.id, version: customerQuote.version, revision: 1 })
  const quoteLink = await owner.cmd('quote.link', { quoteId: customerQuote.id, version: customerQuote.version })
  assert.equal((await running.quote(quoteLink.token)).status, 200, 'QUOTE-002 source customer link works')
  const before = await owner.get('/api/glove/export')
  assert.ok(!JSON.stringify(before).includes(quoteLink.token), 'QUOTE-002 bearer never enters the export')
  assert.ok(!JSON.stringify(before).includes(bookingLink.token), 'PLAN-004 bearer never enters the export')
  assert.ok(!JSON.stringify(before).includes(reportLink.token), 'FIELD-003 bearer never enters the export')
  await running.close()
  running = null

  const archive = join(parent, 'installation.rer')
  await command(source, ['export', '--output', archive])
  await command(destination, ['import', '--input', archive, '--yes'])
  const port2 = await freePort()
  await command(destination, ['setup', '--owner-email', 'owner@example.test', '--port', String(port2), '--non-interactive'])
  running = await start(destination, port2)
  assert.equal((await running.request('/api/glove/state', 'GET', undefined, owner.cookie)).status, 401, 'a source session does not open the restored installation')
  const after = await running.owner.get('/api/glove/export')
  for (const key of ['business', 'customers', 'sites', 'services', 'technicians', 'quotes', 'jobs', 'visits', 'captures', 'approvals', 'imports', 'timeline', 'files', 'serviceReports', 'serviceReportLinks', 'plans', 'agreements', 'bookingOffers', 'quoteLinks']) assert.deepEqual(after[key], before[key], `${key} restored exactly`)
  assert.equal((await running.report(reportLink.token)).status, 404, 'FIELD-003 source bearer is not restored')
  assert.equal((await running.booking(bookingLink.token)).status, 404, 'PLAN-004 source bearer is not restored')
  assert.equal((await running.quote(quoteLink.token)).status, 404, 'QUOTE-002 source bearer is not restored')
  const freshQuoteLink = await running.owner.cmd('quote.link', { quoteId: customerQuote.id, version: customerQuote.version })
  assert.equal((await running.quote(freshQuoteLink.token)).status, 200, 'QUOTE-002 restored revision accepts a newly issued link')
  assert.equal(freshQuoteLink.documentHash, quoteLink.documentHash, 'QUOTE-002 restored document hash is unchanged')
  const freshBookingLink = await running.owner.cmd('agreement.offer', offerPayload)
  assert.equal((await running.booking(freshBookingLink.token)).status, 200, 'PLAN-004 restored entitlement accepts a newly issued booking link')
  const freshReportLink = await running.owner.cmd('report.link', { reportId: report.id })
  assert.equal((await running.report(freshReportLink.token)).status, 200, 'FIELD-003 restored snapshot accepts a new link')
  assert.equal((await running.owner.get(`/api/glove/technicians/${tech.id}/calendar`)).url, null, 'the calendar address is not restored')
  const bytes = await running.request(`/api/glove/files/${photo.file.fileId}`, 'GET', undefined, running.owner.cookie)
  assert.equal(Buffer.from(await bytes.arrayBuffer()).toString('base64'), jpeg, 'photo bytes restored')
  const restoredCertificate = await running.request(`/api/glove/files/${certCustomer.taxExemption.certificate.fileId}`, 'GET', undefined, running.owner.cookie)
  assert.equal(restoredCertificate.status, 200, 'MONEY-001 private certificate remains readable after restore')
  assert.deepEqual(Buffer.from(await restoredCertificate.arrayBuffer()), certificateBytes, 'MONEY-001 original certificate bytes restored')
  // The restored installation keeps working, including undo of the restored move-in journal.
  await running.owner.cmd('customer.save', { name: 'After restore' })
  const restored = (await running.owner.get('/api/glove/state')).imports.find(i => i.id === batch.id)
  const undone = await running.owner.cmd('import.undo', { batchId: batch.id, version: restored.version, reason: 'Restore proof' })
  assert.equal(undone.status, 'undone')
  console.log('Glove portability passed: export, import into a fresh checkout, identical records, timeline, photo bytes and move-in journal, and undo after restore')
} finally {
  if (running) await running.close().catch(() => {})
  for (const proc of children) if (proc.exitCode === null) proc.kill('SIGTERM')
  await rm(parent, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}
