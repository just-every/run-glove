import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { harnessRoute, gotoHarness, closeHarnessContext } from './browser/harness-route.ts'

const kinds = { 'glove.pricebook.update': 'service.saved', 'glove.pricebook.category': 'pricebook.category', 'glove.pricebook.adjust': 'pricebook.adjusted' }
const label = agent => `${agent.name} for ${agent.sponsor.name}`
const dataOf = row => JSON.parse(row.data)

async function doors({ request, origin, cookie }) {
  const get = async path => {
    const response = await request(origin + path, { headers: { Cookie: cookie } })
    assert.equal(response.status, 200, path)
    return response.json()
  }
  const state = await get('/api/glove/state')
  const activity = await get('/api/glove/activity')
  const exported = await get('/api/glove/export')
  const roster = await get('/agents/api/agents')
  assert.equal(state.actor.role, 'owner')
  assert.equal(exported.format, 'glove-business-v1')
  return { state, events: activity.events, exported, agents: roster.agents }
}

async function desk(context, type, payload) {
  const { request, origin, cookie } = context
  const response = await request(origin + '/api/glove/commands', { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ commandId: crypto.randomUUID(), type, payload }) })
  assert.equal(response.status, 200, type)
  const body = await response.json()
  assert.equal(body.ok, true)
  return body.result
}

/** Native actorId and updatedBy retain the sponsor's native foreign key. The
 * agent is a distinct identity in preparedBy, never a fabricated native person. */
function agentEvent(snapshot, event) {
  assert.ok(event, 'the price-book act appears in Activity')
  const owner = snapshot.state.actor
  const agent = snapshot.agents.find(agent => label(agent) === event.actorName)
  assert.ok(agent, 'Activity names the registered agent and sponsor')
  assert.ok(agent.id && agent.name)
  assert.notEqual(agent.id, owner.id)
  assert.deepEqual(agent.sponsor, { id: owner.id, name: owner.name })
  assert.equal(event.actorRole, 'agent')
  assert.equal(event.actorId, owner.id)
  assert.notEqual(event.actorName, owner.name)
  const preparedBy = { agent: { id: agent.id, name: agent.name }, for: agent.sponsor, label: label(agent) }
  assert.deepEqual(event.preparedBy, preparedBy, 'Activity preserves the separate registered agent and native sponsor')
  assert.deepEqual(event.approvers, [], 'autonomy and standard review fabricate no company approver')
  const exported = snapshot.exported.timeline.find(row => row.id === event.id)
  assert.ok(exported, 'business export contains the same act')
  assert.deepEqual([exported.actor_id, exported.actor_name, exported.actor_role], [owner.id, label(agent), 'agent'])
  assert.deepEqual(dataOf(exported).preparedBy, preparedBy)
  assert.deepEqual(dataOf(exported).approvers, [])
  assert.deepEqual(dataOf(exported).recordChanges, event.recordChanges)
  return agent
}

function exportedItem(snapshot, id, event) {
  const native = snapshot.state.services.find(row => row.id === id)
  const exported = snapshot.exported.services.find(row => row.id === id)
  assert.ok(native && exported, 'the changed item is present in the business export')
  assert.deepEqual(exported, native)
  assert.equal(exported.updatedBy, snapshot.state.actor.id, 'updatedBy remains the sponsoring native person id')
  if (event) assert.ok(event.recordChanges.some(change => change.kind === 'services' && change.id === id && change.toVersion === exported.version), 'the attributed act identifies this exported item revision')
}

async function ownerEdit(context, id) {
  const before = await doors(context)
  const item = before.state.services.find(row => row.id === id)
  const saved = await desk(context, 'service.save', { ...item, name: 'Owner reviewed catalogue item' })
  const after = await doors(context)
  const event = after.events.find(row => row.kind === 'service.saved' && row.subjectId === id)
  const owner = after.state.actor
  assert.deepEqual([event.actorId, event.actorName, event.actorRole], [owner.id, owner.name, 'owner'])
  assert.equal(event.preparedBy ?? null, null)
  assert.equal(event.approvers ?? null, null)
  const exported = after.exported.timeline.find(row => row.id === event.id)
  assert.deepEqual([exported.actor_id, exported.actor_name, exported.actor_role], [owner.id, owner.name, 'owner'])
  assert.equal(dataOf(exported).preparedBy, undefined)
  assert.equal(dataOf(exported).approvers, undefined)
  assert.equal(saved.updatedBy, owner.id)
  exportedItem(after, id, event)
  // A later human edit must not relabel or remove the agent's earlier acts.
  for (const earlier of before.events.filter(row => row.actorRole === 'agent' && (row.subjectId === id || row.recordChanges.some(change => change.id === id)))) {
    agentEvent(after, after.events.find(row => row.id === earlier.id))
  }
  return after
}

/** Additive readback for the harness's autonomous and held standard-review
 * sequence. No MCP calls bypass the harness tool helper or its audit count. */
export async function afterAttributionStep(context) {
  const { phase, step, args, result } = context
  if (!['autonomous', 'held'].includes(phase) || !kinds[step.tool]) return
  const snapshot = await doors(context)
  const event = snapshot.events.find(row => row.kind === kinds[step.tool] && (step.tool === 'glove.pricebook.update' ? row.subjectId === args.id : row.summary.includes(step.tool === 'glove.pricebook.category' ? args.name : args.category)))
  agentEvent(snapshot, event)
  for (const retained of snapshot.events.filter(row => row.actorRole === 'agent' && Object.values(kinds).includes(row.kind))) agentEvent(snapshot, retained)
  if (step.tool === 'glove.pricebook.update') exportedItem(snapshot, args.id, event)
  if (step.tool === 'glove.pricebook.category') {
    assert.deepEqual(snapshot.exported.business, snapshot.state.business)
    assert.ok(event.recordChanges.some(change => change.kind === 'business' && change.id === 'business' && change.toVersion === snapshot.exported.business[0].version))
    for (const item of result.repriced) exportedItem(snapshot, item.id, event)
  }
  if (step.tool === 'glove.pricebook.adjust') {
    assert.ok(result.items.length, 'adjustment readback is not empty')
    for (const item of result.items) exportedItem(snapshot, item.id, event)
    await ownerEdit(context, result.items[0].id)
  }
  console.log(`Price-book attribution: ${phase} ${step.tool} Activity, export and registry agree; no approver fabricated.`)
}

async function activityProof(context, agent) {
  const { request, origin, cookie } = context
  // Complete the disposable Owner's native first-run confirmation before app navigation.
  const ready = await request(origin + '/setup', { method: 'POST', redirect: 'manual', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'confirm=yes' })
  assert.equal(ready.status, 303)
  await ready.body?.cancel()
  const directory = join(tmpdir(), 'glove-agent-attribution')
  await mkdir(directory, { recursive: true })
  const browser = await chromium.launch({ ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}), args: ['--no-sandbox'] })
  try {
    for (const width of [1440, 390]) {
      const browserContext = await browser.newContext({ viewport: { width, height: 1000 } })
      const page = await browserContext.newPage()
      try {
        await harnessRoute(page, origin + '/**', async route => {
          const req = route.request()
          const response = await request(req.url(), { method: req.method(), headers: { ...req.headers(), Cookie: cookie }, ...(req.postDataBuffer() ? { body: req.postDataBuffer() } : {}) })
          const headers = Object.fromEntries(response.headers)
          delete headers['set-cookie']
          await route.fulfill({ status: response.status, headers, body: Buffer.from(await response.arrayBuffer()) })
        })
        await gotoHarness(page, origin + '/app', { waitUntil: 'networkidle' })
        await page.evaluate(() => { location.hash = 'activity' })
        await page.getByRole('heading', { name: 'Activity', exact: true }).waitFor()
        await page.getByText(`— ${label(agent)} (Agent)`, { exact: true }).first().waitFor()
        if (width === 1440) assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
        await page.screenshot({ path: join(directory, `activity-${width}.png`), fullPage: true })
      } finally { await closeHarnessContext(browserContext) }
    }
  } finally { await browser.close() }
  console.log('Price-book attribution browser proof: Owner Activity at 1440 and 390; /tmp/glove-agent-attribution.')
}

/** SURFACE-021: registered identities survive all three agent mutations and
 * a later Owner edit, in Activity, timeline and the exported business records. */
export async function pricebookAttribution(context) {
  const { tool } = context
  const category = 'Attribution parts'
  await desk(context, 'pricebook.category', { name: category, markupPercent: '50' })
  const fixed = await desk(context, 'service.save', { code: 'ATTR-FIXED', name: 'Attribution fixed item', category, unitCost: '4.00', unitPrice: '20.00' })
  const marked = await desk(context, 'service.save', { code: 'ATTR-MARKED', name: 'Attribution markup item', category, pricing: 'markup', unitCost: '10.00', unitPrice: '0.00' })
  await desk(context, 'service.save', { ...marked, description: 'Owner prepared markup item' })
  const call = async (name, args, revision) => {
    const answer = await tool(name, { ...args, expected_revision: revision, idempotency_key: crypto.randomUUID() })
    assert.equal(answer.result.isError, false)
    return answer.result.structuredContent
  }
  await call('glove.pricebook.update', { id: fixed.id, code: fixed.code, name: 'Agent revised catalogue item', category, unitCost: '4.00', unitPrice: '22.00' }, fixed.version)
  let snapshot = await doors(context)
  let event = snapshot.events.find(row => row.kind === 'service.saved' && row.subjectId === fixed.id)
  const agent = agentEvent(snapshot, event)
  exportedItem(snapshot, fixed.id, event)
  assert.equal(snapshot.exported.services.find(row => row.id === fixed.id).unitPrice, '22.00')
  await call('glove.pricebook.category', { name: category, markupPercent: '80' }, snapshot.state.business[0].version)
  snapshot = await doors(context)
  event = snapshot.events.find(row => row.kind === 'pricebook.category')
  agentEvent(snapshot, event)
  assert.deepEqual(snapshot.exported.business, snapshot.state.business)
  const repriced = snapshot.exported.services.find(row => row.id === marked.id)
  assert.equal(repriced.unitPrice, '18.00')
  exportedItem(snapshot, marked.id, event)
  assert.ok(event.recordChanges.some(change => change.id === marked.id && change.toVersion === repriced.version))
  await call('glove.pricebook.adjust', { category, percent: '10' }, snapshot.state.business[0].version)
  snapshot = await doors(context)
  event = snapshot.events.find(row => row.kind === 'pricebook.adjusted')
  agentEvent(snapshot, event)
  exportedItem(snapshot, fixed.id, event)
  assert.equal(snapshot.exported.services.find(row => row.id === fixed.id).unitPrice, '24.20')
  await ownerEdit(context, fixed.id)
  await activityProof(context, agent)
  console.log('Price-book attribution: all agent mutations and the same-item Owner edit preserve separate registered identities in native Activity and business export.')
}
