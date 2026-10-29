import assert from 'node:assert/strict'
import { browserProof } from './agent-browser-proof.mjs'

/** Only public native and shared doors. No account writer or substituted authority. */
export default async function ({ request, origin, cookie, tool }) {
  const read = await tool('glove.pricebook.read', {})
  assert.equal(read.result.isError, false)
  const item = read.result.structuredContent.services[0]
  const args = { id: item.id, code: item.code, name: item.name, unitPrice: item.unitPrice, unitCost: item.unitCost, category: item.category, expected_revision: item.version, idempotency_key: crypto.randomUUID() }
  const first = await tool('glove.pricebook.update', args)
  assert.ok(!first.result.isError)
  const replay = await tool('glove.pricebook.update', args)
  assert.deepEqual(replay.result.structuredContent, first.result.structuredContent)
  const conflict = await tool('glove.pricebook.update', { ...args, name: 'Changed arguments' })
  assert.equal(conflict.result._meta['com.runeditrun/error'].code, 'idempotency_conflict')
  const stale = await tool('glove.pricebook.update', { ...args, idempotency_key: crypto.randomUUID() })
  assert.equal(stale.result._meta['com.runeditrun/error'].code, 'revision_conflict')
  const pause = async paused => {
    const result = await request(origin + '/api/glove/commands', { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ commandId: crypto.randomUUID(), type: 'agents.pause', payload: { paused } }) })
    assert.equal(result.status, 200)
    await result.body?.cancel()
  }
  await pause(true)
  try {
    const stopped = await tool('glove.pricebook.update', { ...args, expected_revision: first.result.structuredContent.version, idempotency_key: crypto.randomUUID() })
    assert.equal(stopped.result._meta['com.runeditrun/error'].code, 'agents_paused')
  } finally { await pause(false) }
  const extra = await request(origin + '/api/glove/commands', { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ commandId: crypto.randomUUID(), type: 'service.save', payload: { code: crypto.randomUUID(), name: 'Replace return grille', category: 'Parts', unitCost: '8.00', unitPrice: '20.00', tax: 'TAXABLE' } }) })
  assert.equal(extra.status, 200)
  await extra.body?.cancel()
  const beforeBulk = (await tool('glove.pricebook.read', {})).result.structuredContent.services
  const bulk = await tool('glove.pricebook.adjust', { category: 'Parts', percent: '3', idempotency_key: crypto.randomUUID() })
  assert.equal(bulk.result.isError, false)
  const afterBulk = (await tool('glove.pricebook.read', {})).result.structuredContent.services
  const actualChanges = afterBulk.filter(row => row.version !== beforeBulk.find(before => before.id === row.id)?.version).length
  assert.equal(bulk.decision.classes.find(item => item.class === 'standard').facts.measure, actualChanges)
  const activity = await request(origin + '/api/glove/activity', { headers: { Cookie: cookie } })
  const events = (await activity.json()).events
  const attributed = events.filter(event => event.kind === 'service.saved' && event.actorRole === 'agent')
  assert.ok(attributed.length)
  assert.ok(attributed.every(event => event.actorName.includes(' for ')))
  await browserProof({ request, origin, cookie })
  console.log('Native price-book journey: revision conflict, argument conflict, once-only replay, native Pause, measured bulk effects and attributable Activity passed.')
}

/** The person and agent read back the same production records in both policies. */
export async function afterStep({ request, origin, cookie, phase, step, args, result }) {
  if (!['autonomous', 'held'].includes(phase)) return
  const response = await request(origin + '/api/glove/state', { headers: { Cookie: cookie } })
  assert.equal(response.status, 200)
  const state = await response.json()
  if (step.tool === 'glove.pricebook.read') {
    assert.deepEqual(result.services, state.services)
    assert.equal(result.businessRevision, state.business[0].version)
  } else if (step.tool === 'glove.pricebook.update') {
    if (phase === 'held') await browserProof({ request, origin, cookie, state: 'review' })
    const current = state.services.find(row => row.id === args.id)
    // The injection probe legitimately repeats this update before afterStep,
    // advancing native metadata. Its proposed business fields must be identical.
    for (const field of Object.keys(args).filter(key => !['idempotency_key', 'expected_revision'].includes(key))) {
      assert.deepEqual(current[field], result[field])
    }
  } else if (step.tool === 'glove.pricebook.category') {
    assert.ok(state.business[0].priceCategories.some(row => row.name === args.name && row.markupPercent === args.markupPercent))
  } else if (step.tool === 'glove.pricebook.adjust') {
    for (const item of result.items) assert.equal(item.unitPrice, state.services.find(row => row.id === item.id)?.unitPrice)
  }
}
