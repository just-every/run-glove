import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
const root = process.cwd()
const { startDev, stopDev, command } = await import(pathToFileURL(join(root, 'tests/browser/runtime.mjs')))
const packet = join(process.env.HOME, 'rer-consolidation/work/sx-glove-c-f180/packet')
const scratch = await mkdtemp(join(tmpdir(), 'glove-nameplate-archive-'))
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
let runtime
try {
  runtime = await startDev(root, 8787)
  const link = new URL(runtime.entry)
  const request = (path, cookie = '', method = 'GET', body) => fetch(runtime.origin + path, { method, redirect: 'manual', headers: { origin: runtime.origin, 'content-type': 'application/json', cookie }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const cookies = response => response.headers.getSetCookie().map(x => x.split(';')[0]).join('; ')
  const exchanged = await request(link.pathname, '', 'POST', { key: new URLSearchParams(link.hash.slice(1)).get('rer-dev') })
  assert.equal(exchanged.status, 204)
  const gate = cookies(exchanged)
  const entered = await request('/auth/dev/enter?as=owner', gate)
  assert.equal(entered.status, 303)
  const cookie = [gate, cookies(entered)].join('; ')
  const cmd = async (type, payload) => {
    const response = await request('/api/glove/commands', cookie, 'POST', { commandId: randomUUID(), type, payload })
    const body = await response.json()
    assert.equal(response.status, 200, JSON.stringify(body))
    assert.equal(body.ok, true)
    return body.result
  }
  await cmd('business.save', { name: 'Synthetic Glove archive proof', currency: 'AUD', abn: '51 824 753 556', timezone: 'Australia/Sydney', paymentTermsDays: 14 })
  const key = 'synthetic-glove-117'
  const connected = await cmd('model.connect', { url: 'https://models.example.test/v1', model: 'archive-vision-test', key })
  assert.equal(connected.model.model, 'archive-vision-test')
  for (const path of ['/api/glove/state', '/api/glove/activity', '/api/glove/export']) {
    const response = await request(path, cookie)
    assert.equal(response.status, 200)
    assert.ok(!(await response.text()).includes(key))
  }
  await stopDev(root, runtime)
  runtime = null
  const archive = join(scratch, 'installation.rer')
  await command(join(root, 'node_modules/.bin/rer'), ['export', '--output', archive], root)
  const bytes = await readFile(archive)
  const manifest = JSON.parse(bytes.toString('utf8').split('\n')[0])
  assert.ok(manifest.tables.some(table => table.name === 'glove_records'))
  assert.ok(!manifest.tables.some(table => table.name === 'glove_provider_keys'))
  assert.ok(!bytes.includes(Buffer.from(key)))
  const receipt = { head, command: 'temporary public-command and real rer export probe', exit: 0, modelConnectionCreated: true, stateActivityExportExcludeKey: true, archiveBytes: bytes.length, archiveSha256: createHash('sha256').update(bytes).digest('hex'), archiveExcludesProviderKeyTable: true, archiveExcludesSyntheticKey: true, scriptSha256: createHash('sha256').update(await readFile('/tmp/glove-nameplate-archive-probe.mjs')).digest('hex') }
  await writeFile(join(packet, 'archive-probe.json'), JSON.stringify(receipt, null, 2) + '\n')
  console.log(JSON.stringify(receipt))
} finally {
  if (runtime) await stopDev(root, runtime)
  await rm(scratch, { recursive: true, force: true })
}
