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
import { mkdtemp, cp, rm, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { devInstallation } from './dev-installation.mjs'
import { exportedFixture } from './fixtures/movein.mjs'
import { randomUUID, createHash, createHmac } from 'node:crypto'
import { createServer } from 'node:http'

const workspace = resolve('.'), parent = await mkdtemp(join(tmpdir(), 'glove-portable-')), children = new Set()
const excluded = new Set(['.git', 'node_modules', '.wrangler', '.rer', '.seed', '.cache', '.tanstack', 'dist', 'exports', 'test-results', 'playwright-report'])
const clean = s => s.replace(/RER_OPEN[^\n]*/g, 'RER_OPEN [private]').replace(/token=[^\s"&<>]+/g, 'token=[private]').replace(/rer-dev=[^\s"&<>]+/g, 'rer-dev=[private]')
const fixture = 'tests/fixtures/servicem8-small-hvac/'
const jpeg = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex').toString('base64')
// Keep transport counts outside every installation and its temporary setup
// Worker; an import or startup attempt must not disappear on the next start.
const stripePosts = new Map()
const recorder = createServer((request, response) => {
  const name = new URL(request.url, 'http://localhost').pathname.slice(1)
  if (request.method === 'POST') stripePosts.set(name, (stripePosts.get(name) ?? 0) + 1)
  response.setHeader('content-type', 'application/json')
  response.end(JSON.stringify({ posts: stripePosts.get(name) ?? 0 }))
})
await new Promise((resolve, reject) => { recorder.once('error', reject); recorder.listen(0, '127.0.0.1', resolve) })
recorder.unref()
const recorderOrigin = `http://127.0.0.1:${recorder.address().port}`

async function copy(name) {
  const root = join(parent, name)
  await cp(workspace, root, { recursive: true, filter: path => { const rel = path.slice(workspace.length + 1); return !excluded.has(rel.split('/')[0]) && !rel.startsWith('.dev.vars') && !rel.startsWith('.env') } })
  // Replace only Stripe transport in the scratch entry; never ship a fake.
  if (name.startsWith('payment-')) {
    for (const file of ['portable-stripe.mjs', 'stripe-payments.mjs', 'saved-cards-edge.mjs']) await cp(join(root, 'tests/fixtures', file), join(root, 'src', file))
    const entry = join(root, 'src/server.ts')
    const code = await readFile(entry, 'utf8')
    await writeFile(entry, "import { portableStripe } from './portable-stripe.mjs'\n" + code.replace('export default withDemo({', 'export default portableStripe(withDemo({').replace('} satisfies ExportedHandler<Bindings>, { seed: seedDemo })', `} satisfies ExportedHandler<Bindings>, { seed: seedDemo }), ${JSON.stringify(recorderOrigin + '/' + name)})`))
  }
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
    const request = (path, method = 'GET', body, cookie = '', headers = {}) => fetch(origin + path, { method, redirect: 'manual', headers: { origin, 'content-type': 'application/json', cookie: [gate, cookie].filter(Boolean).join('; '), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) })
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
      async cmd(type, payload, commandId = randomUUID()) {
        const response = await request('/api/glove/commands', 'POST', { commandId, type, payload }, cookie)
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
  const service = await owner.cmd('service.save', { code: 'SVC', name: 'Split system service', description: 'Customer-facing restored inspection', unitPrice: '189.00', checklist: [{ label: 'Clean filters', required: true }] })
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
  // COMM-006: populated inspection crosses the real archive boundary as business records only.
  let choiceQuote = await owner.cmd('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Restored chosen inspection', options: [{ name: 'Basic inspection', lines: [{ description: 'Basic service', quantity: '1', unitPrice: '100.00', tax: 'FREE' }] }, { name: 'Complete inspection', lines: [{ description: 'Complete service', quantity: '1', unitPrice: '200.00', tax: 'FREE' }] }], addOns: [{ name: 'Filter', lines: [{ description: 'Restored filter', quantity: '1', unitPrice: '25.00', tax: 'FREE' }] }] })
  choiceQuote = await owner.cmd('quote.approve', { quoteId: choiceQuote.id, version: choiceQuote.version, revision: 1 })
  await owner.cmd('quote.accept', { quoteId: choiceQuote.id, version: choiceQuote.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin', choice: { optionId: 'option-2', addOnIds: ['addon-1'] } })
  await owner.cmd('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Private restored draft', lines: [{ description: 'Private restored draft work', quantity: '1', unitPrice: '15.00' }] })
  await owner.cmd('conversation.log', { customerId: customer.id, kind: 'note', text: 'Private restored conversation' })
  await owner.cmd('equipment.save', { siteId: site.id, type: 'Restored heat pump', model: 'Permitted restored model', serial: 'Private restored serial' })
  const inspectionCommandId = randomUUID()
  const inspection = await owner.cmd('customer.hubPreview', { customerId: customer.id }, inspectionCommandId)
  assert.ok(inspection.quotes.some(q => q.lines.some(l => l.customerDescription === 'Customer-facing restored inspection')))
  assert.ok(inspection.reports.some(r => r.summary === 'Cleaned filters'))
  assert.ok(inspection.equipment.some(e => e.model === 'Permitted restored model'))
  assert.ok(inspection.agreements.some(a => a.id === agreement.id))
  const chosenInspection = inspection.quotes.find(q => q.id === choiceQuote.id)
  assert.deepEqual(chosenInspection.lines.map(l => l.description), ['Complete service', 'Restored filter'])
  assert.equal(chosenInspection.totals.total, '225.00')
  assert.deepEqual(chosenInspection.options.map(o => o.totals.total), ['100.00', '200.00'])
  assert.deepEqual(chosenInspection.addOns.map(a => a.totals.total), ['25.00'])
  assert.doesNotMatch(JSON.stringify(inspection), /Private restored|accessNotes|files|signature|savedCards/)
  const previewToken = await owner.cmd('token.issue', { name: 'Portable preview refusal', role: 'office' })
  const before = await owner.get('/api/glove/export')
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
  for (const key of ['business', 'customers', 'sites', 'services', 'technicians', 'quotes', 'jobs', 'visits', 'captures', 'approvals', 'imports', 'timeline', 'files', 'serviceReports', 'serviceReportLinks', 'plans', 'agreements', 'bookingOffers', 'quoteLinks', 'enquiries', 'equipment']) assert.deepEqual(after[key], before[key], `${key} restored exactly`)
  const oldInspection = await running.request('/api/glove/commands', 'POST', { commandId: randomUUID(), type: 'customer.hubPreview', payload: { customerId: customer.id } }, owner.cookie)
  assert.equal(oldInspection.status, 403)
  assert.equal((await oldInspection.json()).error.message, 'An Owner without branch limits must sign in to inspect this customer preview')
  const restoredInspection = await running.owner.cmd('customer.hubPreview', { customerId: customer.id })
  assert.deepEqual(restoredInspection, inspection, 'COMM-006 reconstructs only the permitted projection under a new current Owner session')
  assert.ok(Object.values(restoredInspection.actions).every(value => value === false), 'restore creates no customer action authority')
  const oldTokenInspection = await running.request('/api/glove/commands', 'POST', { commandId: randomUUID(), type: 'customer.hubPreview', payload: { customerId: customer.id } }, '', { authorization: `Bearer ${previewToken.token}` })
  assert.equal(oldTokenInspection.status, 403, 'restore imports no token authority')
  const suspendedMember = (await running.owner.get('/api/glove/state')).operators.find(o => o.id === member.id)
  assert.equal(suspendedMember.status, 'inactive', 'restoration does not silently reactivate staff')
  const reactivated = await running.request('/auth/operator/status', 'POST', { operatorId: member.id, status: 'active' }, running.owner.cookie)
  assert.equal(reactivated.status, 200, 'a current Owner explicitly reactivates the restored staff member')
  const restoredMember = await running.persona('member')
  const refusedInspection = await running.request('/api/glove/commands', 'POST', { commandId: randomUUID(), type: 'customer.hubPreview', payload: { customerId: customer.id } }, restoredMember.cookie)
  assert.equal(refusedInspection.status, 403, 'restored staff authority never becomes Owner inspection authority')
  for (const batch of sourceBatches) {
    await running.owner.cmd('import.undo', { batchId: batch.id, version: batch.version, reason: 'Restore preserved source journal and original custody' })
  }
  const afterSourceUndo = await running.owner.get('/api/glove/export')
  assert.ok(!afterSourceUndo.invoices.some(i => i.openingBalance), 'restored source balances undo cleanly')
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
  // DATA-001: exercise the seed's actual rer import policy, not just a database
  // service. The latest backup is the trusted later erasure journal.
  let invoice = await running.owner.cmd('invoice.prepare', { jobId: job.id })
  invoice = await running.owner.cmd('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
  const currentCustomer = (await running.owner.get('/api/glove/state')).customers.find(c => c.id === customer.id)
  const receipt = await running.owner.cmd('privacy.erase', { customerId: customer.id, version: currentCustomer.version, confirm: 'ERASE', fingerprint: (await running.owner.cmd('privacy.preview', { customerId: customer.id, version: currentCustomer.version })).fingerprint })
  assert.equal(receipt.outcome, 'complete')
  const erasedPreview = await running.request('/api/glove/commands', 'POST', { commandId: randomUUID(), type: 'customer.hubPreview', payload: { customerId: customer.id } }, running.owner.cookie)
  assert.equal(erasedPreview.status, 404)
  assert.equal((await erasedPreview.json()).error.message, 'Customer preview unavailable')
  const erasedInspectionReplay = await running.request('/api/glove/commands', 'POST', { commandId: inspectionCommandId, type: 'customer.hubPreview', payload: { customerId: customer.id } }, running.owner.cookie)
  const erasedOutcome = await erasedInspectionReplay.json()
  assert.equal(erasedOutcome.ok, false)
  assert.equal(erasedOutcome.error.code, 'ERASED', 'restored personal command outcomes are erased too')


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
  const laterErasedPreview = await running.request('/api/glove/commands', 'POST', { commandId: randomUUID(), type: 'customer.hubPreview', payload: { customerId: customer.id } }, running.owner.cookie)
  assert.equal(laterErasedPreview.status, 404, 'COMM-006 later erasure fence prevents reconstruction after restore')
  const peerPreview = await running.owner.cmd('customer.hubPreview', { customerId: peerCustomer.id })
  assert.equal(peerPreview.customer.name, peerCustomer.name)
  assert.doesNotMatch(JSON.stringify(peerPreview), /Harbourview Dental|Customer-facing restored inspection|Permitted restored model/)

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
  await running.close(); running = null
  // PAY-008: the real archive retains permission versions, never execution authority.
  const paySource = await copy('payment-source'), payDestination = await copy('payment-destination')
  running = await install(paySource)
  const payOwner = running.owner
  const fixtureClock = at => running.request('/__portable/stripe', 'POST', { at })
  const providerPosts = async () => (await (await running.request('/__portable/stripe')).json()).posts
  await payOwner.cmd('business.save', { name: 'Synthetic payment portability', currency: 'USD', timezone: 'UTC' })
  const payCustomer = await payOwner.cmd('customer.save', { name: 'Synthetic payment customer' })
  const paySite = await payOwner.cmd('site.save', { customerId: payCustomer.id, address: '80 Synthetic Avenue' })
  const payMember = await running.persona('member')
  const payOperator = (await payOwner.get('/api/glove/state')).operators.find(o => o.nativeRole === 'member')
  await payOwner.cmd('role.set', { operatorId: payOperator.id, role: 'technician' })
  const payTech = await payOwner.cmd('technician.save', { name: 'Synthetic payment technician', operatorId: payOperator.id })
  await fixtureClock('2025-01-01T12:00:00Z')
  const connect = async () => payOwner.cmd('payment.connect', { version: (await payOwner.get('/api/glove/state')).business[0].version, mode: 'test', key: 'synthetic-glove-81', webhookSecret: 'synthetic-glove-82' })
  await connect()
  const enroll = async owner => {
    const c = (await owner.get('/api/glove/state')).customers.find(c => c.id === payCustomer.id)
    const result = await owner.cmd('payment.savedCardRegister', { customerId: c.id, version: c.version, stripeCustomerId: 'cus_' + c.id, stripeMethodId: 'pm_' + c.id, scope: 'autopay', source: 'synthetic-glove-83', wording: 'Recorded permission for this verified test card.', confirmed: true })
    return result.savedCards.at(-1)
  }
  const payCard = await enroll(payOwner)
  let payJob = await payOwner.cmd('job.create', { customerId: payCustomer.id, siteId: paySite.id, title: 'Portable monthly permission', lines: [{ description: 'Maintenance', quantity: '1', unitPrice: '240.00', tax: 'FREE' }] })
  payJob = await payOwner.cmd('series.create', { jobId: payJob.id, version: payJob.version, date: '2025-01-01', rule: { unit: 'month' }, technicianId: payTech.id, start: '10:00', end: '11:00', horizonDays: 90, until: '2025-02-28', billing: { mode: 'fixed-monthly', autoApprove: true } })
  const permission = { jobId: payJob.id, cardId: payCard.id, maxAmount: '240.00', source: 'synthetic-glove-84', wording: 'First monthly permission exact wording.', confirmed: true }
  payJob = await payOwner.cmd('payment.autopayAuthorize', { ...permission, version: payJob.version })
  payJob = await payOwner.cmd('payment.autopayRevoke', { jobId: payJob.id, version: payJob.version, reason: 'synthetic-glove-85 withdrawal' })
  payJob = await payOwner.cmd('payment.autopayAuthorize', { ...permission, version: payJob.version, source: 'synthetic-glove-86', wording: 'Replacement monthly permission exact wording.' })
  const payHistory = structuredClone(payJob.series.billing.autopayHistory)
  await fixtureClock('2025-03-01T12:00:00Z')
  await payOwner.cmd('series.billingRun', {})
  const payInvoices = (await payOwner.get('/api/glove/state')).invoices.filter(i => i.jobId === payJob.id).sort((a, b) => a.recurring.periodEnd.localeCompare(b.recurring.periodEnd))
  assert.equal(payInvoices.length, 2)
  assert.equal(await providerPosts(), 0, 'billing never invokes preparatory collection')
  const chargePayload = invoice => ({ invoiceId: invoice.id, version: invoice.version, cardId: payCard.id, amount: '240.00', confirmed: true })
  const pending = await payOwner.cmd('payment.autopayCharge', chargePayload(payInvoices[0]))
  assert.equal(await providerPosts(), 1)
  // PAY-002: create real approved invoices and reserve through the public door.
  // Stripe alone simulates settlement, pending ACH and a lost Checkout response.
  const checkoutCases = []
  for (const [index, amount, method, outcome] of [[0, '100.00', 'card', 'succeeded'], [1, '200.00', 'ach', 'processing'], [2, '300.00', 'card', 'unknown']]) {
    const work = await payOwner.cmd('job.create', { customerId: payCustomer.id, siteId: paySite.id, title: `Portable Checkout ${outcome}`, lines: [{ description: 'Synthetic repair', quantity: '1', unitPrice: amount, tax: 'FREE' }] })
    const visit = await payOwner.cmd('visit.book', { jobId: work.id, technicianId: payTech.id, date: '2025-03-01', start: `${14 + index}:00`, end: `${15 + index}:00` })
    await payMember.cmd('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await payMember.cmd('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Synthetic repair complete', signoff: { absentReason: 'Customer away' } })
    let invoice = await payOwner.cmd('invoice.prepare', { jobId: work.id })
    invoice = await payOwner.cmd('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
    const commandId = randomUUID(), payload = { invoiceId: invoice.id, version: invoice.version, method }
    await running.request('/__portable/stripe', 'POST', { checkoutResponseLost: outcome === 'unknown' })
    const payment = await payOwner.cmd('payment.checkout', payload, commandId)
    if (outcome === 'unknown') assert.equal(payment.checkoutUrl, undefined)
    else assert.match(payment.checkoutUrl, /^https:\/\/checkout\.stripe\.com\//)
    checkoutCases.push({ invoice, payment, commandId, payload })
  }
  const postSettlement = async (checkout, secret = 'synthetic-glove-82') => {
    const at = Date.parse('2025-03-01T12:00:00Z') / 1000
    const body = { id: `synthetic-glove-event-${checkout.paymentId}`, created: at, type: checkout.intent.status === 'succeeded' ? 'payment_intent.succeeded' : 'payment_intent.processing', data: { object: checkout.intent } }
    const signature = createHmac('sha256', secret).update(`${at}.${JSON.stringify(body)}`).digest('hex')
    return running.request('/api/glove/payments/events', 'POST', body, '', { 'stripe-signature': `t=${at},v1=${signature}` })
  }
  for (const [index, outcome] of [[0, 'succeeded'], [1, 'processing']]) {
    const response = await running.request('/__portable/stripe', 'POST', { paymentId: checkoutCases[index].payment.id, outcome })
    const checkout = (await response.json()).checkouts[index]
    assert.equal((await postSettlement(checkout)).status, 200)
    assert.equal((await postSettlement(checkout)).status, 200, 'authenticated replay does not duplicate a financial effect')
  }
  const stripeSource = await (await running.request('/__portable/stripe')).json()
  assert.equal(stripeSource.checkouts.length, 3)
  assert.equal(await providerPosts(), 4, 'one saved-card request and three Checkout attempts')
  const assertCheckoutMoney = async owner => {
    const state = await owner.get('/api/glove/state'), balances = await owner.get('/api/glove/balances')
    for (const [index, status, due, net, effects] of [[0, 'paid', '0.00', 0, 10000], [1, 'pending', '200.00', 20000, 0], [2, 'reserved', '300.00', 30000, 0]]) {
      const payment = state.payments.find(p => p.id === checkoutCases[index].payment.id)
      assert.equal(payment.status, status)
      assert.equal(payment.amount, ['100.00', '200.00', '300.00'][index])
      assert.equal(payment.effects.reduce((sum, e) => sum + e.amountCents, 0), effects)
      assert.equal(payment.effects.length, index === 0 ? 1 : 0, 'only confirmed funds have one financial effect')
      const balance = balances.invoices.find(i => i.id === checkoutCases[index].invoice.id)
      assert.deepEqual([balance.due, balance.netCents], [due, net])
    }
    assert.equal(balances.customers.find(c => c.customerId === payCustomer.id).balance, '980.00')
    const aging = await owner.get('/api/glove/reports/receivables.json?asOf=2025-03-20')
    const rows = aging.customers.flatMap(c => c.invoices).filter(i => checkoutCases.some(c => c.invoice.id === i.id))
    assert.deepEqual(rows.map(i => [i.id, i.balance, i.bucket, i.href]), checkoutCases.slice(1).map((c, index) => [c.invoice.id, ['200.00', '300.00'][index], '1-30', `#invoices/${c.invoice.id}`]))
  }
  await assertCheckoutMoney(payOwner)
  const payBefore = await payOwner.get('/api/glove/export')
  const sourceActivity = await payOwner.get('/api/glove/activity')
  for (const [index, kinds] of [[0, ['payment.requested', 'payment.checkoutAccepted', 'payment.paid']], [1, ['payment.requested', 'payment.checkoutAccepted', 'payment.pending']], [2, ['payment.requested', 'payment.checkoutUnconfirmed']]]) {
    for (const kind of kinds) {
      const e = sourceActivity.events.find(e => e.subjectId === checkoutCases[index].payment.id && e.kind === kind)
      assert.ok(e, `${kind} appears in Activity for the selected payment`)
      assert.equal(e.actorRole, kind === 'payment.requested' ? 'owner' : 'provider')
      assert.ok(e.actorId && e.actorName && e.commandId && e.at && e.summary)
      const exported = payBefore.timeline.find(row => row.id === e.id)
      assert.deepEqual([exported.actor_id, exported.actor_name, exported.at, exported.summary], [e.actorId, e.actorName, e.at, e.summary])
    }
  }
  assert.doesNotMatch(JSON.stringify(payBefore), /checkout\.stripe\.com|synthetic-glove-session-|synthetic-glove-8[12]/)
  await running.close(); running = null
  const paymentArchive = join(parent, 'payment-history.rer')
  await command(paySource, ['export', '--output', paymentArchive])
  assert.equal(stripePosts.get('payment-source'), 4, 'export does not make another provider request')
  const paymentBytes = await readFile(paymentArchive)
  const paymentManifest = JSON.parse(paymentBytes.toString('utf8').split('\n')[0])
  assert.ok(!paymentManifest.tables.some(t => ['glove_provider_keys', 'glove_payment_attempts'].includes(t.name)), 'archive contains neither payment credentials nor execution reservations')
  for (const secret of ['synthetic-glove-81', 'synthetic-glove-82', ...stripeSource.checkouts.flatMap(c => [c.sessionId, c.url])]) assert.ok(!paymentBytes.includes(Buffer.from(secret)), 'payment credentials are absent from the archive')
  await command(payDestination, ['import', '--input', paymentArchive, '--yes'])
  assert.equal(stripePosts.get('payment-destination') ?? 0, 0, 'actual import makes no provider POST')
  running = await install(payDestination)
  const restoredOwner = running.owner
  await fixtureClock('2025-03-01T12:00:00Z')
  assert.equal((await running.request('/api/glove/state', 'GET', undefined, payOwner.cookie)).status, 401)
  assert.equal(await providerPosts(), 0, 'import and setup do not charge')
  const payAfter = await restoredOwner.get('/api/glove/export')
  assert.deepEqual(payAfter.jobs.find(j => j.id === payJob.id).series.billing.autopayHistory, payHistory)
  assert.deepEqual(payAfter.payments.find(p => p.id === pending.id), payBefore.payments.find(p => p.id === pending.id))
  assert.deepEqual(payAfter.timeline, payBefore.timeline, 'attributable permission and provider history survive')
  await assertCheckoutMoney(restoredOwner)
  for (const c of checkoutCases) {
    assert.deepEqual(payAfter.payments.find(p => p.id === c.payment.id), payBefore.payments.find(p => p.id === c.payment.id))
    const replay = await restoredOwner.cmd('payment.checkout', c.payload, c.commandId)
    assert.equal(replay.id, c.payment.id)
    assert.equal(replay.checkoutUrl, undefined, 'a restored saved outcome never reissues its bearer')
    const timeline = await restoredOwner.get(`/api/glove/payments/${c.payment.id}/timeline`)
    assert.ok(timeline.events.some(e => e.kind === 'payment.requested' && e.actorRole === 'owner'))
  }
  assert.equal(await providerPosts(), 0, 'restored command replay never calls Stripe')
  assert.equal((await postSettlement(stripeSource.checkouts[0])).status, 404, 'old provider credentials are not restored')
  const refusedCheckout = async (c, code) => {
    const before = await restoredOwner.get('/api/glove/balances'), posts = await providerPosts()
    const response = await running.request('/api/glove/commands', 'POST', { commandId: randomUUID(), type: 'payment.checkout', payload: c.payload }, restoredOwner.cookie)
    assert.equal((await response.json()).error.code, code)
    assert.equal(await providerPosts(), posts)
    assert.deepEqual(await restoredOwner.get('/api/glove/balances'), before)
  }
  await refusedCheckout(checkoutCases[1], 'PAYMENT_SETUP')
  const refuseCharge = async (payload, code, message) => {
    const before = await restoredOwner.get('/api/glove/balances'), posts = await providerPosts()
    const response = await running.request('/api/glove/commands', 'POST', { commandId: randomUUID(), type: 'payment.autopayCharge', payload }, restoredOwner.cookie)
    const body = await response.json()
    assert.equal(body.error.code, code)
    if (message) assert.equal(body.error.message, message)
    assert.equal(await providerPosts(), posts)
    assert.deepEqual(await restoredOwner.get('/api/glove/balances'), before)
  }
  await refuseCharge(chargePayload(payInvoices[1]), 'PAYMENT_SETUP')
  await restoredOwner.cmd('payment.connect', { version: payAfter.business[0].version, mode: 'test', key: 'synthetic-glove-87', webhookSecret: 'synthetic-glove-88' })
  await running.request('/__portable/stripe', 'POST', { intent: stripeSource.checkouts[0].intent })
  assert.equal((await postSettlement(stripeSource.checkouts[0])).status, 401, 'old signature cannot authenticate after reconnection')
  assert.equal((await postSettlement(stripeSource.checkouts[0], 'synthetic-glove-88')).status, 200)
  for (const c of checkoutCases.slice(1)) await refusedCheckout(c, 'PAYMENT_PENDING')
  await refusedCheckout(checkoutCases[0], 'PAID')
  await assertCheckoutMoney(restoredOwner)
  await restoredOwner.cmd('series.billingRun', {})
  assert.equal(await providerPosts(), 0, 'reconnection and scheduled billing restore no automatic execution')
  await refuseCharge(chargePayload(payInvoices[1]), 'SAVED_CARD')
  const freshCard = await enroll(restoredOwner)
  await refuseCharge({ ...chargePayload(payInvoices[1]), cardId: freshCard.id }, 'CARD_AUTHORIZATION', 'Fresh customer permission is required for this card and billing rule')
  payJob = (await restoredOwner.get('/api/glove/state')).jobs.find(j => j.id === payJob.id)
  payJob = await restoredOwner.cmd('payment.autopayRevoke', { jobId: payJob.id, version: payJob.version, reason: 'Fresh installation requires fresh permission' })
  payJob = await restoredOwner.cmd('payment.autopayAuthorize', { ...permission, cardId: freshCard.id, version: payJob.version })
  await refuseCharge({ ...chargePayload(payInvoices[1]), cardId: freshCard.id, confirmed: false }, 'CONSENT')
  assert.equal(await providerPosts(), 0, 'fresh card and permission still require explicit invoice confirmation')
  await restoredOwner.cmd('payment.autopayCharge', { ...chargePayload(payInvoices[1]), cardId: freshCard.id })
  assert.equal(await providerPosts(), 1, 'a new explicit confirmation permits one current test request')
  const erasedCustomer = (await restoredOwner.get('/api/glove/state')).customers.find(c => c.id === payCustomer.id)
  const erasePreview = await restoredOwner.cmd('privacy.preview', { customerId: erasedCustomer.id, version: erasedCustomer.version })
  await restoredOwner.cmd('privacy.erase', { customerId: erasedCustomer.id, version: erasedCustomer.version, confirm: 'ERASE', fingerprint: erasePreview.fingerprint })
  const anonymousPayments = await restoredOwner.get('/api/glove/export')
  assert.equal(anonymousPayments.jobs.find(j => j.id === payJob.id).series, undefined)
  const anonymousText = JSON.stringify(anonymousPayments)
  assert.doesNotMatch(anonymousText, /Synthetic payment customer|synthetic-glove-intent-|synthetic-glove-portable-charge|synthetic-glove-session-|checkout\.stripe\.com/)
  for (const c of checkoutCases) {
    const anonymous = anonymousPayments.payments.find(p => p.id === c.payment.id)
    assert.ok(anonymous.erasedAt)
    assert.equal(anonymous.intentId, undefined)
    assert.equal(anonymous.providerReference, undefined)
    assert.equal(anonymous.by, undefined)
    assert.equal(anonymous.effects.reduce((sum, e) => sum + e.amountCents, 0), c === checkoutCases[0] ? 10000 : 0)
    const replay = await running.request('/api/glove/commands', 'POST', { commandId: c.commandId, type: 'payment.checkout', payload: c.payload }, restoredOwner.cookie)
    assert.equal((await replay.json()).error.code, 'ERASED')
  }
  assert.equal(await providerPosts(), 1, 'erasure and replay cause no additional provider attempt')
  assert.ok(!anonymousText.includes(permission.wording))
  assert.ok(!JSON.stringify(anonymousPayments).includes('Replacement monthly permission exact wording.'))
  await running.close(); running = null
  const paymentJournal = join(parent, 'payment-erasure.rer')
  await command(payDestination, ['export', '--output', paymentJournal])
  const payOlder = await copy('payment-older')
  await cp(paymentJournal, join(payOlder, 'payment-erasure.rer'))
  await assert.rejects(command(payOlder, ['import', '--input', paymentArchive, '--journal', 'payment-erasure.rer', '--yes']), /erasure_epoch/, 'later trusted erasure journal refuses old permission evidence')
  await command(payOlder, ['import', '--input', paymentJournal, '--yes'])
  running = await install(payOlder)
  const fenced = await running.owner.get('/api/glove/export')
  assert.equal(fenced.customers.find(c => c.id === payCustomer.id).savedCards, undefined)
  assert.equal(fenced.jobs.find(j => j.id === payJob.id).series, undefined)
  assert.ok(!JSON.stringify(fenced).includes(permission.wording))
  assert.doesNotMatch(JSON.stringify(fenced), /Synthetic payment customer|synthetic-glove-intent-|synthetic-glove-portable-charge|synthetic-glove-session-|checkout\.stripe\.com/)
  for (const c of checkoutCases) {
    const payment = fenced.payments.find(p => p.id === c.payment.id)
    assert.ok(payment.erasedAt)
    assert.equal(payment.amount, c.payment.amount)
    assert.equal(payment.effects.reduce((sum, e) => sum + e.amountCents, 0), c === checkoutCases[0] ? 10000 : 0)
  }
  assert.equal(await providerPosts(), 0)
  console.log('PAY-002 real archive passed: confirmed funds, pending ACH, uncertain reservations, balances, aging and attributable history retained; keys and private Checkout material excluded; sessions, replay, reconnection and later-erasure journal fenced')
  console.log('PAY-008 real archive passed: distinct permission history retained, credentials absent, reconnection grants no authority, fresh confirmation required, later erasure journal fences old evidence')
  console.log('Glove portability passed: export, import into a fresh checkout, identical records, timeline, photo bytes and move-in journal, and undo after restore')
} finally {
  if (running) await running.close().catch(() => {})
  for (const proc of children) if (proc.exitCode === null) proc.kill('SIGTERM')
  await new Promise((resolve, reject) => recorder.close(error => error ? reject(error) : resolve()))
  await rm(parent, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}
