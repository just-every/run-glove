import { twilioEdge } from './fixtures/twilio.mjs'
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
import { devInstallation } from './dev-installation.mjs'
import { serviceM8Equipment } from './fixtures/servicem8-balances.mjs'
import { exportedFixture } from './fixtures/movein.mjs'
import { randomUUID, createHash } from 'node:crypto'

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
  const proc = spawn(executable, args, { cwd: root, env: { ...environment, CI: 'true', RER_SERVER_JOURNEY: '1', WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
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
const cookiesOf = res => res.headers.getSetCookie().map(x => x.split(';')[0]).join('; ')

async function start(root, port) {
  const runtime = child(root, ['dev', '--foreground', '--port', String(port), '--no-queue'])
  try {
    const deadline = Date.now() + 120000
    while ((!runtime.output().includes('RER_READY') || !runtime.output().includes('RER_OPEN')) && Date.now() < deadline) {
      if (runtime.proc.exitCode !== null) throw Error(clean(runtime.output()).slice(-3000))
      await new Promise(r => setTimeout(r, 200))
    }
    assert.ok(runtime.output().includes('RER_READY'), clean(runtime.output()).slice(-3000))
    const origin = new URL(runtime.output().match(/^RER_READY\s+(\S+)/m)?.[1]).origin
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
      callback: password => fetch(origin + '/api/glove/mail/events', { method: 'POST', headers: { 'content-type': 'application/json', cookie: gate, authorization: `Basic ${Buffer.from(`glove:${password}`).toString('base64')}` }, body: '{}' }),
      quoteRespond: (token, body) => fetch(origin + '/api/glove/public/quote', { method: 'POST', headers: { origin, 'content-type': 'application/json', authorization: `Bearer ${token}`, cookie: gate }, body: JSON.stringify(body) }),
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

const install = root => devInstallation(
  port => command(root, ['setup', '--owner-email', 'owner@example.test', '--port', String(port), '--non-interactive']),
  port => start(root, port),
)

let running
try {
  const source = await copy('source'), destination = await copy('destination')
  running = await install(source)
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
  const files = await serviceM8Equipment()
  files.push(...await Promise.all(['staff', 'jobactivity', 'attachment'].map(async k => ({ name: `${k}.json`, text: await readFile(`${fixture}${k}.json`, 'utf8') }))))
  let batch = await owner.cmd('import.stage', { files, balanceAsOf: '2026-10-22' })
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
  // QUOTE-002: the signed artifact and its evidence must survive the actual
  // archive boundary byte for byte, independently of the revocable bearer.
  await owner.cmd('quote.consent', { version: (await owner.get('/api/glove/state')).business[0].version, text: 'synthetic-glove-50 disclosure entered and accepted by the portability test owner.', accept: true })
  let signedQuote = await owner.cmd('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Signed maintenance proposal', lines: [{ description: 'Signed maintenance work', quantity: '1', unitPrice: '249.00' }], terms: 'synthetic-glove-51 terms retained in the signed artifact.' })
  signedQuote = await owner.cmd('quote.approve', { quoteId: signedQuote.id, version: signedQuote.version, revision: 1 })
  const signedLink = await owner.cmd('quote.link', { quoteId: signedQuote.id, version: signedQuote.version })
  const choice = { optionId: 'option-1', addOnIds: [] }
  const selected = await (await running.quoteRespond(signedLink.token, { action: 'choose', choice })).json()
  const signedResponse = await running.quoteRespond(signedLink.token, { action: 'approve', name: 'Dr Mei Lin', capacity: 'Practice owner', choice, documentHash: selected.documentHash, selectionHash: selected.selection.hash, consent: { version: selected.disclosure.version, hash: selected.disclosure.hash, affirmed: true }, signature: { kind: 'typed', text: 'Dr Mei Lin' } })
  assert.equal(signedResponse.status, 200, await signedResponse.clone().text())
  signedQuote = (await owner.get('/api/glove/state')).quotes.find(q => q.id === signedQuote.id)
  const signedFile = await running.request(`/api/glove/quotes/${signedQuote.id}/signed`, 'GET', undefined, owner.cookie)
  assert.equal(signedFile.status, 200)
  const signedBytes = Buffer.from(await signedFile.arrayBuffer())
  assert.equal(createHash('sha256').update(signedBytes).digest('hex'), signedQuote.acceptance.signing.signedCopy.sha256)
  const peerCustomer = await owner.cmd('customer.save', { name: 'Synthetic kept peer' })
  const peerSite = await owner.cmd('site.save', { customerId: peerCustomer.id, address: '55 Synthetic Road' })
  let peerQuote = await owner.cmd('quote.draft', { customerId: peerCustomer.id, siteId: peerSite.id, title: 'Peer service', terms: `Access coordinated by ${customer.name}`, lines: [{ description: 'Peer service', quantity: '1', unitPrice: '25.00' }] })
  peerQuote = await owner.cmd('quote.approve', { quoteId: peerQuote.id, version: peerQuote.version, revision: 1 })
  const peerLink = await owner.cmd('quote.link', { quoteId: peerQuote.id, version: peerQuote.version })
  const peerSelection = await (await running.quoteRespond(peerLink.token, { action: 'choose', choice })).json()
  const peerAnswer = await running.quoteRespond(peerLink.token, { action: 'approve', name: 'Synthetic kept peer', capacity: 'Owner', choice, documentHash: peerSelection.documentHash, selectionHash: peerSelection.selection.hash, consent: { version: peerSelection.disclosure.version, hash: peerSelection.disclosure.hash, affirmed: true }, signature: { kind: 'typed', text: 'Synthetic kept peer' } })
  assert.equal(peerAnswer.status, 200)
  // COMM-001: a backup never carries even a callback credential hash.
  const postmark = await owner.cmd('mail.connect', { provider: 'postmark', apiKey: 'synthetic-glove-52', fromEmail: 'office@example.test' })
  const callbackHash = createHash('sha256').update(postmark.callbackPassword).digest('hex')
  const smsFixture = twilioEdge()
  const smsConnection = await owner.cmd('sms.connect', { version: (await owner.get('/api/glove/state')).business[0].version, provider: 'twilio', accountSid: smsFixture.accountSid, authToken: smsFixture.authToken, fromNumber: smsFixture.fromNumber, registration: 'a2p10dlc', registered: true, live: true })
  assert.equal(smsConnection.sms.enabled, false)
  const sourceBatches = []
  for (const format of ['fieldpulse','workiz','servicetitan','jobber']) {
    const staged = await owner.cmd('import.stage', { format, files: await exportedFixture(format), balanceAsOf: '2026-10-22' })
    assert.deepEqual(staged.preview.rejections, [])
    sourceBatches.push(await owner.cmd('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint }))
  }
  // DISP-005: populated transient custody must not cross the real archive boundary.
  const locationNow = () => new Date().toISOString()
  const fleetKey = 'synthetic-glove-601'
  const locationJob = await owner.cmd('job.create', { customerId: customer.id, siteId: site.id, title: 'Location custody at backup' })
  const locationVisit = await owner.cmd('visit.book', { jobId: locationJob.id, technicianId: tech.id, date: '2026-10-16', start: '13:00', end: '14:00' })
  await priya.cmd('location.consent', { enabled: true })
  await owner.cmd('location.fleetConnect', { technicianId: tech.id, vehicleId: '12345', key: fleetKey })
  await priya.cmd('clock.in', { deviceTime: locationNow() })
  await priya.cmd('timer.start', { visitId: locationVisit.id, kind: 'job', deviceTime: locationNow() })
  await priya.cmd('location.phone', { lat: 41.89067, lng: -87.63067, observedAt: locationNow() })
  const sourcePosition = (await owner.get('/api/glove/map?date=2026-10-16')).technicians.find(t => t.id === tech.id).live
  assert.deepEqual([sourcePosition.position.lat, sourcePosition.position.lng], [41.89067, -87.63067])
  const before = await owner.get('/api/glove/export')
  assert.deepEqual(before.equipment.filter(e => e.source?.system === 'ServiceM8').map(e => e.serial).sort(), ['synthetic-glove-peer-serial', 'synthetic-glove-serial-1'])
  assert.equal(before.equipment.find(e => e.source?.system === 'FieldPulse').manufacturerWarrantyUntil, '2028-01-01')
  assert.deepEqual(before.invoices.find(i => i.source?.system === 'ServiceM8').openingBalance, { amount: '76.50', sourceTotal: '201.85', asOf: '2026-10-22', notForPosting: true })
  for (const value of [fleetKey, '41.89067', '-87.63067']) assert.ok(!JSON.stringify(before).includes(value), 'DISP-005 business export excludes coordinates and fleet key')
  assert.ok(!JSON.stringify(before).includes(quoteLink.token), 'QUOTE-002 bearer never enters the export')
  assert.ok(!JSON.stringify(before).includes(bookingLink.token), 'PLAN-004 bearer never enters the export')
  assert.ok(!JSON.stringify(before).includes(reportLink.token), 'FIELD-003 bearer never enters the export')
  await running.close()
  running = null

  const archive = join(parent, 'installation.rer')
  await command(source, ['export', '--output', archive])
  const archiveBytes = await readFile(archive)
  assert.ok(!archiveBytes.includes(Buffer.from(postmark.callbackPassword)) && !archiveBytes.includes(Buffer.from(callbackHash)), 'COMM-001 archive excludes the Postmark callback password and its hash')
  assert.ok(!archiveBytes.includes(Buffer.from(smsFixture.authToken)), 'SMS archive never carries the Twilio auth credential')
  for (const value of [fleetKey, '41.89067', '-87.63067']) assert.ok(!archiveBytes.includes(Buffer.from(value)), 'DISP-005 archive excludes coordinates and fleet key')
  await command(destination, ['import', '--input', archive, '--yes'])
  running = await install(destination)
  assert.equal((await running.request('/api/glove/state', 'GET', undefined, owner.cookie)).status, 401, 'a source session does not open the restored installation')
  // COMM-001: the restored installation has no callback credentials and the
  // old password cannot authenticate, even though ordinary records survived.
  const oldCallback = await running.callback(postmark.callbackPassword)
  assert.equal(oldCallback.status, 404, 'COMM-001 restored email must be reconnected')
  assert.equal((await running.owner.get('/api/glove/state')).mailCallbacks.verifiedAt, null)
  assert.equal((await running.owner.get('/api/glove/state')).smsConnected, false, 'restored SMS metadata grants no provider authority before reconnect')
  const restoredPosition = (await running.owner.get('/api/glove/map?date=2026-10-16')).technicians.find(t => t.id === tech.id).live
  assert.equal(restoredPosition.position, null, 'DISP-005 restored installation has no captured position')
  const restoredFleet = await running.request('/api/glove/commands', 'POST', { commandId: randomUUID(), type: 'location.fleetRead', payload: { technicianId: tech.id } }, running.owner.cookie)
  assert.equal((await restoredFleet.json()).error.code, 'FLEET', 'DISP-005 restored installation requires explicit fleet reconnection')
  const after = await running.owner.get('/api/glove/export')
  for (const key of ['business', 'customers', 'sites', 'services', 'technicians', 'quotes', 'jobs', 'invoices', 'visits', 'captures', 'approvals', 'imports', 'timeline', 'files', 'serviceReports', 'serviceReportLinks', 'plans', 'agreements', 'bookingOffers', 'quoteLinks', 'enquiries', 'equipment']) assert.deepEqual(after[key], before[key], `${key} restored exactly`)
  for (const batch of sourceBatches) {
    await running.owner.cmd('import.undo', { batchId: batch.id, version: batch.version, reason: 'Restore preserved source journal and original custody' })
  }
  const afterSourceUndo = await running.owner.get('/api/glove/export')
  assert.deepEqual(afterSourceUndo.invoices.filter(i => i.openingBalance).map(i => [i.source.system, i.openingBalance.amount]), [['ServiceM8', '76.50']], 'only the separately restored ServiceM8 batch remains to undo')
  console.log('MOVE-003 / MOVE-004 source records, balances, membership entitlements and original custody restore exactly and undo through the normal command door')
  assert.equal((await running.report(reportLink.token)).status, 404, 'FIELD-003 source bearer is not restored')
  assert.equal((await running.booking(bookingLink.token)).status, 404, 'PLAN-004 source bearer is not restored')
  assert.equal((await running.quote(quoteLink.token)).status, 404, 'QUOTE-002 source bearer is not restored')
  const freshQuoteLink = await running.owner.cmd('quote.link', { quoteId: customerQuote.id, version: customerQuote.version })
  assert.equal((await running.quote(freshQuoteLink.token)).status, 200, 'QUOTE-002 restored revision accepts a newly issued link')
  assert.equal(freshQuoteLink.documentHash, quoteLink.documentHash, 'QUOTE-002 restored document hash is unchanged')
  assert.equal((await running.quote(signedLink.token)).status, 404, 'signed quote bearer is not restored')
  const restoredSigned = await running.request(`/api/glove/quotes/${signedQuote.id}/signed`, 'GET', undefined, running.owner.cookie)
  assert.equal(restoredSigned.status, 200)
  assert.deepEqual(Buffer.from(await restoredSigned.arrayBuffer()), signedBytes, 'QUOTE-002 signed HTML, disclosure and signature survive rer export/import byte for byte')
  const restoredSignedQuote = after.quotes.find(q => q.id === signedQuote.id)
  assert.deepEqual(restoredSignedQuote.acceptance.signing, signedQuote.acceptance.signing, 'QUOTE-002 all signature evidence survives the archive')
  const restoredSignedLink = await running.owner.cmd('quote.link', { quoteId: signedQuote.id, version: restoredSignedQuote.version })
  assert.equal((await (await running.quote(restoredSignedLink.token)).json()).decision, 'accepted', 'fresh bearer opens the frozen signed decision after restore')
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
  const afterMoveInUndo = await running.owner.get('/api/glove/export')
  assert.equal(afterMoveInUndo.invoices.filter(i => i.openingBalance).length, 0, 'all restored opening balances undo cleanly')
  assert.equal(afterMoveInUndo.equipment.filter(e => ['ServiceM8', 'FieldPulse'].includes(e.source?.system)).length, 0, 'restored installed equipment and journal undo together')
  console.log('MOVE-005 ServiceM8 opening balance and installed equipment restore exactly and undo through the owner command')
  // DATA-001: exercise the seed's actual rer import policy, not just a database
  // service. The latest backup is the trusted later erasure journal.
  let invoice = await running.owner.cmd('invoice.prepare', { jobId: job.id })
  invoice = await running.owner.cmd('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
  const currentCustomer = (await running.owner.get('/api/glove/state')).customers.find(c => c.id === customer.id)
  const receipt = await running.owner.cmd('privacy.erase', { customerId: customer.id, version: currentCustomer.version, confirm: 'ERASE', fingerprint: (await running.owner.cmd('privacy.preview', { customerId: customer.id, version: currentCustomer.version })).fingerprint })
  assert.equal(receipt.outcome, 'complete')
  assert.equal((await running.request(`/api/glove/quotes/${peerQuote.id}/signed`, 'GET', undefined, running.owner.cookie)).status, 404, 'shared signed original is withdrawn without deleting its peer quote')
  assert.equal((await running.owner.get('/api/glove/state')).quotes.find(q => q.id === peerQuote.id).status, 'accepted')
  assert.equal((await running.request(`/api/glove/quotes/${signedQuote.id}/signed`, 'GET', undefined, running.owner.cookie)).status, 404, 'DATA-001 erasure withdraws the signed copy')
  await running.close(); running = null
  const latest = join(parent, 'post-erasure.rer')
  await command(destination, ['export', '--output', latest])
  const olderTarget = await copy('older-backup')
  await cp(latest, join(olderTarget, 'post-erasure.rer'))
  await assert.rejects(command(olderTarget, ['import', '--input', archive, '--journal', 'post-erasure.rer', '--yes']), /erasure_epoch/, 'DATA-001 older backup cannot resurrect erased personal data with the trusted later journal')
  await command(olderTarget, ['import', '--input', latest, '--yes'])
  running = await install(olderTarget)
  const anonymous = await running.owner.get('/api/glove/export')
  assert.equal(anonymous.customers.find(c => c.id === customer.id).name, 'Erased customer')
  assert.deepEqual(anonymous.invoices.find(i => i.id === invoice.id).revisions[0].totals, invoice.revisions[0].totals)
  assert.equal((await running.request(`/api/glove/files/${certCustomer.taxExemption.certificate.fileId}`, 'GET', undefined, running.owner.cookie)).status, 404)
  assert.equal((await running.request(`/api/glove/files/${photo.file.fileId}`, 'GET', undefined, running.owner.cookie)).status, 404)
  assert.equal((await running.request(`/api/glove/quotes/${signedQuote.id}/signed`, 'GET', undefined, running.owner.cookie)).status, 404, 'erased signed-copy bytes stay erased across backup/restore')
  assert.equal(anonymous.customers.find(c => c.id === peerCustomer.id).name, peerCustomer.name)
  assert.equal(anonymous.quotes.find(q => q.id === peerQuote.id).acceptance.signing.signedCopy, null)
  assert.equal((await running.request(`/api/glove/quotes/${peerQuote.id}/signed`, 'GET', undefined, running.owner.cookie)).status, 404, 'peer signed-original withdrawal survives rer restore')
  assert.ok(!JSON.stringify(anonymous).includes('PORTABLE-SCHOOL'))
  assert.ok(!JSON.stringify(anonymous).includes('Private exemption certificate'))
  console.log('DATA-001 real rer import passed: older backup refused; anonymous invoice/tax totals restore and originals stay erased')
  console.log('Glove portability passed: export, import into a fresh checkout, identical records, timeline, photo bytes and move-in journal, and undo after restore')
} finally {
  if (running) await running.close().catch(() => {})
  for (const proc of children) if (proc.exitCode === null) proc.kill('SIGTERM')
  await rm(parent, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}
