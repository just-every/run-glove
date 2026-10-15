// Leave with everything: a real installation (rer setup + rer preview) runs a
// job from quote to field evidence and a ServiceM8 move-in, `rer export`
// writes the archive, `rer import` restores it into a fresh checkout, and the
// restored installation has the same records, timeline, photos, command
// outcomes and move-in journal, and keeps working. Every child process and
// scratch folder is owned here and removed in finally.
import assert from 'node:assert/strict'
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
  const runtime = child(root, ['preview', '--port', String(port)])
  try {
    const deadline = Date.now() + 120000
    while (!runtime.output().includes('RER_READY') && Date.now() < deadline) {
      if (runtime.proc.exitCode !== null) throw Error(clean(runtime.output()).slice(-3000))
      await new Promise(r => setTimeout(r, 200))
    }
    assert.ok(runtime.output().includes('RER_READY'), clean(runtime.output()).slice(-3000))
    const origin = `http://127.0.0.1:${port}`
    const request = (path, method = 'GET', body, cookie = '') => fetch(origin + path, { method, redirect: 'manual', headers: { origin, 'content-type': 'application/json', cookie }, ...(body ? { body: JSON.stringify(body) } : {}) })
    // Preview serves production output and has no automatic owner-entry link.
    // This owned fixture uses setup's private checkout key for local mail only.
    const key = (await readFile(join(root, '.rer/local/dev-key.env'), 'utf8')).match(/^RER_DEV_KEY=([^\s]+)\s*$/)?.[1]
    if (!key) throw new Error('The preview fixture has no private checkout key')
    const exchanged = await request('/__dev/key', 'POST', { key })
    assert.ok(exchanged.ok, 'the private fixture key opens the preview mail gate')
    const gate = cookiesOf(exchanged)
    /** Follow the newest sign-in link in the local outbox. */
    async function confirmLatest() {
      const listing = await (await request('/__dev/outbox', 'GET', undefined, gate)).text()
      const message = listing.match(/href="(\/__dev\/outbox\?message=[^"]+)"/)?.[1]
      const body = await (await request(message.replaceAll('&amp;', '&'), 'GET', undefined, gate)).text()
      const href = body.match(/href="([^"]*\/auth\/confirm\?token=[^"]+)"/)?.[1]
      const confirmed = await request('/auth/confirm', 'POST', { token: new URL(href.replaceAll('&amp;', '&'), origin).searchParams.get('token') })
      assert.equal(confirmed.status, 303)
      return cookiesOf(confirmed)
    }
    await request('/auth/magic-link', 'POST', { email: 'owner@example.test' })
    const owner = await confirmLatest()
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
      request, owner: as(owner),
      async invite(name, email) { assert.equal((await request('/auth/invite', 'POST', { email, displayName: name, role: 'member' }, owner)).status, 202); return as(await confirmLatest()) },
      async close() { await command(root, ['preview', '--stop']); if (runtime.proc.exitCode === null) runtime.proc.kill('SIGTERM'); await runtime.done },
    }
  } catch (error) {
    await command(root, ['preview', '--stop']).catch(() => {})
    if (runtime.proc.exitCode === null) runtime.proc.kill('SIGTERM')
    await runtime.done
    throw error
  }
}

let running
try {
  const source = await copy('source'), destination = await copy('destination'), port = await freePort()
  await command(source, ['setup', '--owner-email', 'owner@example.test', '--port', String(port), '--non-interactive'])
  running = await start(source, port)
  const owner = running.owner
  await owner.cmd('business.save', { name: 'Harbour Air & Electrical', timezone: 'Australia/Sydney' })
  const service = await owner.cmd('service.save', { code: 'SVC', name: 'Split system service', unitPrice: '189.00', checklist: [{ label: 'Clean filters', required: true }] })
  const customer = await owner.cmd('customer.save', { name: 'Harbourview Dental' })
  const site = await owner.cmd('site.save', { customerId: customer.id, address: '14 Harbour St, Balmain NSW 2041' })
  const priya = await running.invite('Priya Nair', 'priya@example.test')
  const operators = (await owner.get('/api/glove/state')).operators
  await owner.cmd('role.set', { operatorId: operators.find(o => o.email === 'priya@example.test').id, role: 'technician' })
  const tech = await owner.cmd('technician.save', { name: 'Priya N.', operatorId: operators.find(o => o.email === 'priya@example.test').id })
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
  const before = await owner.get('/api/glove/export')
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
  for (const key of ['business', 'customers', 'sites', 'services', 'technicians', 'quotes', 'jobs', 'visits', 'captures', 'approvals', 'imports', 'timeline', 'files']) assert.deepEqual(after[key], before[key], `${key} restored exactly`)
  const bytes = await running.request(`/api/glove/files/${photo.file.fileId}`, 'GET', undefined, running.owner.cookie)
  assert.equal(Buffer.from(await bytes.arrayBuffer()).toString('base64'), jpeg, 'photo bytes restored')
  // The restored installation keeps working, including undo of the restored move-in journal.
  await running.owner.cmd('customer.save', { name: 'After restore' })
  const restored = (await running.owner.get('/api/glove/state')).imports.find(i => i.id === batch.id)
  const undone = await running.owner.cmd('import.undo', { batchId: batch.id, version: restored.version, reason: 'Restore proof' })
  assert.equal(undone.status, 'undone')
  console.log('Glove portability passed: export, import into a fresh checkout, identical records, timeline, photo bytes and move-in journal, and undo after restore')
} finally {
  if (running) await running.close().catch(() => {})
  for (const proc of children) if (proc.exitCode === null) proc.kill('SIGTERM')
  await rm(parent, { recursive: true, force: true })
}
