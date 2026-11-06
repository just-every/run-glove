import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const repo = process.cwd(), packet = process.env.GLOVE_PACKET, phase = process.argv[2] || 'after'
if (!packet) throw new Error('GLOVE_PACKET is required')
const { chromium, expect } = await import(pathToFileURL(join(repo, 'node_modules/@playwright/test/index.mjs')))
const { installation, business, branchActivityHistory } = await import(pathToFileURL(join(repo, 'tests/api/harness.mjs')))
const { startDev, stopDev, redact } = await import(pathToFileURL(join(repo, 'tests/browser/runtime.mjs')))
const receipt = { phase, head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sourceMode: phase === 'before' ? 'Activity source from main before the supplied fix' : 'candidate working tree', widths: [1440, 390], assertionsAt: 1440, checks: [] }
let runtime, browser, context, h
try {
  runtime = await startDev(repo, 8787)
  console.log('DEV_STARTED: owned Activity runtime ready')
  h = await installation({ at: '2026-10-20T00:00:00.000Z' })
  await business(h)
  const { reader, branchA, branchB, jobA, jobB, at, commandId } = await branchActivityHistory(h)
  const exportDomain = async () => {
    const response = await h.request('/api/glove/export')
    assert.equal(response.status, 200)
    const { exportedAt, ...domain } = await response.json()
    return domain
  }
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] })
  context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  await page.goto(runtime.entry)
  await page.waitForURL(url => ['/app', '/setup'].includes(url.pathname) && !url.hash.includes('rer-dev'))
  if (new URL(page.url()).pathname === '/setup') {
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
    await page.waitForURL(url => url.pathname === '/app')
  }
  // As in the existing CompanyCam browser journey, forward transport to real
  // authenticated production API handlers and migrated persistent D1. No API
  // answer, state projection, event, cursor or authority result is mocked.
  await page.route(`${runtime.origin}/api/glove/**`, async route => {
    const request = route.request(), url = new URL(request.url())
    const response = await h.request(url.pathname + url.search, { method: request.method(), as: reader.cookie, ...(request.postData() ? { body: JSON.parse(request.postData()) } : {}) })
    await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') || 'application/json', body: Buffer.from(await response.arrayBuffer()) })
  })
  const beforeReads = await exportDomain()
  const stateResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/glove/state')
  await page.goto(`${runtime.origin}/app#activity`)
  const initial = await (await stateResponse).json()
  assert.equal(initial.actor.id, reader.id)
  assert.equal(initial.events.length, 0)
  await expect(page.getByRole('heading', { name: 'Activity', exact: true })).toBeVisible()
  await expect(page.getByText('Nothing recorded yet', { exact: true })).toBeVisible()
  const older = page.getByRole('button', { name: 'Load earlier activity', exact: true })
  await expect(older, 'an empty initial branch window must still offer sequence traversal').toBeVisible()
  receipt.checks.push('empty initial window has an enabled earlier-page control')
  const screenshots = join(packet, 'screenshots')
  await mkdir(screenshots, { recursive: true })
  const shot = async name => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      await page.screenshot({ path: join(screenshots, `${phase}-${width}-${name}.png`) })
    }
    await page.setViewportSize({ width: 1440, height: 1050 })
  }
  await shot('empty-activity')
  const rows = page.locator('.timeline-list > li')
  const aRow = rows.filter({ hasText: `${jobA.number} created as a service call` })
  const bRow = rows.filter({ hasText: jobB.number })
  const traverse = async () => {
    let empty = 0, reached = null, previous = (await reader.state()).activityNext
    const cursors = []
    for (let count = 0; count < 20 && !reached; count++) {
      await expect(older).toBeEnabled()
      const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/glove/activity')
      await older.click()
      const response = await responsePromise, body = await response.json()
      assert.equal(response.status(), 200)
      const before = Number(new URL(response.url()).searchParams.get('before'))
      assert.equal(before, previous)
      assert.ok(!cursors.includes(before))
      cursors.push(before)
      assert.ok(body.next === null || body.next < before)
      assert.ok(body.events.every(event => event.jobId !== jobB.id))
      await expect(bRow).toHaveCount(0)
      if (!body.events.length) {
        empty++
        previous = body.next
        await expect(older).toBeEnabled()
        continue
      }
      assert.ok(empty >= 2)
      assert.equal(body.events.length, 1)
      const event = body.events[0]
      assert.deepEqual(Object.fromEntries(['kind', 'subjectKind', 'subjectId', 'jobId', 'actorId', 'actorName', 'actorRole', 'commandId', 'at'].map(key => [key, event[key]])), { kind: 'job.created', subjectKind: 'job', subjectId: jobA.id, jobId: jobA.id, actorId: reader.id, actorName: 'Synthetic Glove Reader', actorRole: 'office', commandId, at })
      assert.deepEqual(event.recordChanges.map(({ kind, id, fromVersion, toVersion }) => ({ kind, id, fromVersion, toVersion })), [{ kind: 'branches', id: branchA.id, fromVersion: 1, toVersion: 2 }, { kind: 'jobs', id: jobA.id, fromVersion: null, toVersion: 1 }])
      await expect(aRow).toHaveCount(1)
      await expect(aRow).toContainText('Synthetic Glove Reader (Office)')
      await expect(aRow.locator('time')).toHaveText('Oct 21, 2:45 AM')
      await aRow.getByText('Changed records', { exact: true }).click()
      await expect(aRow.locator('details')).toContainText(`jobs · ${jobA.id} · version new → 1`)
      await expect(aRow.locator('details')).toContainText('Fields:')
      await expect(aRow.locator('details')).toContainText('title')
      reached = { event, before, emptyPages: empty, cursors }
    }
    assert.ok(reached, 'the older A event must become reachable')
    return reached
  }
  const first = await traverse()
  await shot('loaded-activity')
  assert.deepEqual(await exportDomain(), beforeReads)
  receipt.checks.push(`crossed ${first.emptyPages} empty pages to exactly A with actor, time and changed-record metadata; B hidden on each page; reads unchanged`)
  await h.restart()
  const refresh = async () => {
    const pending = page.waitForResponse(response => new URL(response.url()).pathname === '/api/glove/state')
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await pending
  }
  // A fresh mount after a real Worker restart replays only reads and the same
  // native session against the surviving D1, with no SQL-seeded events.
  await page.reload()
  await expect(aRow).toHaveCount(0)
  const restarted = await traverse()
  assert.deepEqual(restarted, first)
  assert.deepEqual(await exportDomain(), beforeReads)
  receipt.checks.push('same event, sequence and metadata reached after actual Worker restart; domain and timeline unchanged')
  await h.command('branch.limit', { operatorId: reader.id, branchId: branchB.id })
  const afterWithdrawal = await exportDomain()
  await refresh()
  await expect(aRow).toHaveCount(0)
  await expect(page.locator('.timeline-list')).not.toContainText(jobA.id)
  await expect(page.locator('.timeline-list')).not.toContainText(jobA.number)
  const withdrawn = await h.request(`/api/glove/activity?before=${first.before}`, { as: reader.cookie })
  assert.equal(withdrawn.status, 200)
  const withdrawnPage = await withdrawn.json()
  assert.ok(withdrawnPage.events.some(event => event.jobId === jobB.id))
  assert.ok(withdrawnPage.events.every(event => event.jobId !== jobA.id && !event.recordChanges.some(record => record.kind === 'jobs' && record.id === jobA.id)))
  assert.deepEqual(await exportDomain(), afterWithdrawal)
  await shot('withdrawn-activity')
  receipt.checks.push('current branch withdrawal discards loaded A history and metadata; old cursor now serves permitted B work; reads unchanged')
  receipt.status = 'passed'
  receipt.probe = 'PROBE DATA-009 point 5: native branch A reader opens Activity with no visible initial events, crosses two empty pages, reaches exactly A with actor, time and record metadata; B hidden, loaded A discarded after branch withdrawal, Worker restart retained and reads unchanged'
  console.log(receipt.probe)
} catch (error) {
  receipt.status = 'failed'
  receipt.failure = redact(error.message)
  console.error(receipt.failure)
  process.exitCode = 1
} finally {
  await context?.close()
  await browser?.close()
  if (runtime) await stopDev(repo, runtime)
  await h?.close()
  await writeFile(join(packet, `browser-${phase}.json`), JSON.stringify(receipt, null, 2) + '\n')
}
