import assert from 'node:assert/strict'

/** Only public native and shared doors. No account writer or substituted authority. */
export default async function ({ request, origin, cookie, tool }) {
  const read = await tool('glove.pricebook.read', {})
  assert.equal(read.result.isError, undefined)
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
  const activity = await request(origin + '/api/glove/activity', { headers: { Cookie: cookie } })
  const events = (await activity.json()).events
  const attributed = events.filter(event => event.kind === 'service.saved' && event.actorRole === 'agent')
  assert.ok(attributed.length)
  assert.ok(attributed.every(event => event.actorName.includes(' for ')))
  console.log('Native price-book journey: revision conflict, argument conflict, once-only replay, native Pause and attributable Activity passed.')
}
