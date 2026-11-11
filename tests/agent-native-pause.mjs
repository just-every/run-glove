import assert from 'node:assert/strict'

const errorCode = answer => answer.result?._meta?.['com.runeditrun/error']?.code ?? answer.body?.error?.data?.code
const succeeded = answer => {
  assert.equal(answer.result?.isError, false, `Price-book call refused: ${errorCode(answer)}`)
  return answer.result.structuredContent
}

/** Person doors control Pause; every agent call uses the conformance audit tracker. */
export async function pricebookPause({ request, origin, cookie, tool }) {
  const personHeaders = { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }
  const command = async (type, payload, headers = personHeaders) => {
    const response = await request(origin + '/api/glove/commands', { method: 'POST', headers,
      body: JSON.stringify({ commandId: crypto.randomUUID(), type, payload }) })
    return { status: response.status, body: await response.json() }
  }
  const must = async (type, payload) => {
    const answer = await command(type, payload)
    assert.equal(answer.status, 200, `${type}: ${answer.body.error?.code}`)
    assert.equal(answer.body.ok, true)
    return answer.body.result
  }
  const json = async path => {
    const response = await request(origin + path, { headers: { Cookie: cookie } })
    assert.equal(response.status, 200, path)
    return response.json()
  }
  const snapshot = async () => {
    const state = await json('/api/glove/state')
    const events = (await json('/api/glove/activity')).events
    const shared = await json('/agents/api/state')
    return { version: state.version, services: state.services, business: state.business,
      eventIds: events.map(event => event.id), paused: shared.paused }
  }
  const unchanged = async action => {
    const before = await snapshot()
    await action()
    assert.deepEqual(await snapshot(), before, 'Refusal changed native records, Activity or shared Pause flags')
  }
  const localPause = async (paused, headers = personHeaders) => {
    const response = await request(origin + '/agents/api/pause', { method: 'POST', headers, body: JSON.stringify({ paused }) })
    return { status: response.status, body: await response.json() }
  }
  const set = async (control, paused) => {
    if (control === 'native') assert.equal((await must('agents.pause', { paused })).agentsPaused, paused)
    else {
      const answer = await localPause(paused)
      assert.equal(answer.status, 200)
      assert.equal(answer.body.paused.local, paused)
    }
  }
  const flags = async (native, local) => {
    const now = await snapshot()
    assert.equal(now.business[0].agentsPaused, native)
    assert.deepEqual(now.paused, { business: false, local })
  }
  const issued = await must('token.issue', { name: 'Synthetic Pause integration', role: 'agent' })
  assert.equal(typeof issued.token, 'string')
  // Include the valid Owner cookie: Authorization must never fall back to that session.
  const tokenHeaders = { ...personHeaders, Authorization: `Bearer ${issued.token}` }
  const tokenCannotSet = async paused => {
    await unchanged(async () => {
      const answer = await command('agents.pause', { paused }, tokenHeaders)
      assert.equal(answer.status, 403)
      assert.equal(answer.body.error.code, 'FORBIDDEN')
    })
    await unchanged(async () => {
      const answer = await localPause(paused, tokenHeaders)
      assert.equal(answer.status, 403)
      assert.equal(answer.body.code, 'person_session_required')
    })
  }
  try {
    await set('native', false)
    await set('local', false)
    await flags(false, false)
    await tokenCannotSet(true)
    for (const controls of [['native'], ['local'], ['native', 'local']]) {
      const label = controls.join('-'), category = `Pause ${label}`
      await must('pricebook.category', { name: category, markupPercent: '25' })
      const fixed = await must('service.save', { code: `PAUSE-${label}-FIXED`, name: 'Pause fixed item',
        category, unitCost: '4.00', unitPrice: '20.00' })
      const markup = await must('service.save', { code: `PAUSE-${label}-MARKUP`, name: 'Pause markup item',
        kind: 'material', category, pricing: 'markup', unitCost: '10.00', unitPrice: '0.00' })
      assert.equal(markup.unitPrice, '12.50')
      const prepared = await snapshot()
      const update = { id: fixed.id, code: fixed.code, name: 'Pause item resumed', category,
        unitCost: '4.00', unitPrice: '30.00', expected_revision: fixed.version, idempotency_key: crypto.randomUUID() }
      const categoryChange = { name: category, markupPercent: '45', expected_revision: prepared.business[0].version,
        idempotency_key: crypto.randomUUID() }
      const adjust = { category, percent: '10', expected_revision: prepared.business[0].version, idempotency_key: crypto.randomUUID() }
      const refused = async () => {
        for (const [name, args] of [['glove.pricebook.read', {}], ['glove.pricebook.update', update],
          ['glove.pricebook.category', categoryChange], ['glove.pricebook.adjust', adjust]]) {
          await unchanged(async () => {
            const answer = await tool(name, args)
            assert.equal(errorCode(answer), 'agents_paused', `${label}: ${name}`)
            assert.equal(answer.result?.structuredContent, undefined, 'Pause exposed cached native content')
          })
        }
      }
      try {
        for (const control of controls) await set(control, true)
        await flags(controls.includes('native'), controls.includes('local'))
        await refused()
        await tokenCannotSet(false)
        if (controls.length === 2) {
          await set('native', false)
          await flags(false, true)
          await refused()
          // Exercise the other release order as well: local resume cannot clear native Pause.
          await set('native', true)
          await set('local', false)
          await flags(true, false)
          await refused()
          await set('native', false)
        } else await set(controls[0], false)
        await flags(false, false)

        const completeOnce = async (name, args, kind, check) => {
          const before = await snapshot()
          const result = succeeded(await tool(name, args))
          const after = await snapshot()
          assert.equal(after.version, before.version + 1, `${label}: one native version step`)
          assert.deepEqual(after.paused, before.paused)
          const added = (await json('/api/glove/activity')).events.filter(event => !before.eventIds.includes(event.id))
          assert.equal(added.length, 1, `${label}: one native Activity event`)
          assert.equal(added[0].kind, kind)
          assert.equal(added[0].actorRole, 'agent')
          const state = await json('/api/glove/state')
          assert.equal(added[0].actorId, state.actor.id)
          assert.ok(added[0].actorName.endsWith(` for ${state.actor.name}`))
          check(before, after, result, added[0])
          assert.deepEqual(succeeded(await tool(name, args)), result, 'Replay changed its saved result')
          assert.deepEqual(await snapshot(), after, 'Replay applied the admitted change again')
        }
        // This is the exact item request refused above, including its original revision and key.
        await completeOnce('glove.pricebook.update', update, 'service.saved', (before, after, result, event) => {
          const item = after.services.find(row => row.id === fixed.id)
          assert.deepEqual([item.name, item.unitPrice, item.version], ['Pause item resumed', '30.00', fixed.version + 1])
          assert.deepEqual(result, item)
          assert.equal(event.subjectId, fixed.id)
          assert.deepEqual(after.business, before.business)
          assert.deepEqual(after.services.filter(row => row.id !== fixed.id), before.services.filter(row => row.id !== fixed.id))
        })
        // Native Pause is itself a business write. Preserve its revision fence: a person
        // toggling it invalidates the old business revision, even though the category intent is unchanged.
        const current = await snapshot()
        if (controls.includes('native')) {
          await unchanged(async () => assert.equal(errorCode(await tool('glove.pricebook.category', categoryChange)), 'revision_conflict'))
          categoryChange.expected_revision = current.business[0].version
        }
        await completeOnce('glove.pricebook.category', categoryChange, 'pricebook.category', (before, after, result) => {
          assert.equal(after.business[0].version, before.business[0].version + 1)
          assert.equal(after.business[0].priceCategories.find(row => row.name === category).markupPercent, '45')
          assert.deepEqual([result.name, result.markupPercent], [category, '45'])
          const item = after.services.find(row => row.id === markup.id)
          assert.deepEqual([item.unitPrice, item.version], ['14.50', markup.version + 1])
          assert.deepEqual(result.repriced, [{ id: markup.id, code: markup.code, unitPrice: '14.50' }])
          assert.deepEqual(after.services.filter(row => row.id !== markup.id), before.services.filter(row => row.id !== markup.id))
        })
      } finally {
        // Both are person doors, including when a preceding assertion failed.
        try { await set('native', false) } finally { await set('local', false) }
      }
    }
  } finally {
    try { await set('native', false) } finally {
      try { await set('local', false) } finally { await must('token.revoke', { tokenId: issued.id }) }
    }
  }
  console.log('Native price-book Pause: native and shared local controls, both release orders, four refused tools with unchanged records and flags, token refusals and once-only resumed item and category effects passed.')
}
