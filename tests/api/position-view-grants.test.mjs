import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, liveLocationFixture, assertTrail } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'

const at = '2026-11-09T08:00:00.000Z'
const path = '/api/glove/map?date=2026-11-09&branch=main'
async function fixture(t) {
  const h = await installation({ at })
  t.after(() => h.close())
  const f = await liveLocationFixture(h), { b } = f
  await f.start()
  await f.start(b.tomPerson, f.visits[1])
  await b.priyaPerson.run('location.phone', f.point())
  await h.command('location.fleetConnect', { technicianId: b.tom.id, vehicleId: '12345', key: 'synthetic-glove-709' })
  h.fleet.data = [{ id: '12345', gps: { time: f.now(), latitude: 41.89172, longitude: -87.63172 } }]
  await h.command('location.fleetRead', { technicianId: b.tom.id })
  const shift = async tech => (await h.state()).times.find(t => t.technicianId === tech.id && t.kind === 'shift' && !t.endAt)
  const payload = async (tech = b.priya, person = b.dispatcher, enabled = true) => ({ technicianId: tech.id, operatorId: person.id, shiftId: (await shift(tech)).id, enabled })
  const grant = async (tech = b.priya, person = b.dispatcher, enabled = true, owner = null) => h.command('location.delegate', await payload(tech, person, enabled), owner ? { as: owner.cookie } : {})
  const board = async (person = b.dispatcher) => {
    const response = await h.request(path, { as: person.cookie })
    assert.equal(response.status, 200, await response.clone().text())
    return (await response.json()).technicians
  }
  const grants = async () => (await h.db.prepare('SELECT * FROM glove_location_delegates ORDER BY technician_id,operator_id').all()).results
  const audits = async () => (await h.db.prepare("SELECT * FROM glove_events WHERE kind='location.viewed' ORDER BY sequence").all()).results
  const notice = async person => {
    const response = await h.request('/api/glove/location', { as: person.cookie })
    assert.equal(response.status, 200)
    return (await response.json()).delegates
  }
  const ended = async (person, status = 200) => {
    const before = await audits()
    const response = await h.request(path, { as: person.cookie })
    assert.equal(response.status, status, await response.clone().text())
    if (status === 200) assert.ok((await response.json()).technicians.every(t => !t.live?.position && !t.live?.eta))
    else assert.equal((await response.json()).error.code, 'AUTH')
    assert.deepEqual(await audits(), before, 'ended authority produces no further delegated read audit')
  }
  return { ...f, h, shift, payload, grant, board, grants, audits, notice, ended }
}

// One public-door journey, with independently named outcomes for both points.
test('DISP-009 current-shift grants retain attributable custody and fence every delegated position read', async t => {
  await scenario(t, 'point 1: exact named grants, withdrawal, Activity, export, refusals, replay and Worker restart', async step => {
    const f = await fixture(step), { h, b } = f
    const owner = (await h.state()).actor
    const facts = []
    for (const tech of [b.priya, b.tom]) for (const person of [b.dispatcher, b.agent]) {
      const payload = await f.payload(tech, person), commandId = randomUUID()
      const result = await h.command('location.delegate', payload, { commandId })
      assert.deepEqual(await h.command('location.delegate', payload, { commandId }), result)
      facts.push({ tech, person, payload, commandId })
    }
    assert.equal((await f.grants()).length, 4, 'replays retain one grant each')
    for (const person of [b.priyaPerson, b.tomPerson]) assert.deepEqual((await f.notice(person)).sort((a,b) => a.name.localeCompare(b.name)), [
      { name: b.agent.name, role: 'agent' }, { name: b.dispatcher.name, role: 'dispatcher' },
    ].sort((a,b) => a.name.localeCompare(b.name)))
    const payload = await f.payload(b.tom, b.agent, false), commandId = randomUUID()
    await h.command('location.delegate', payload, { commandId })
    facts.push({ tech: b.tom, person: b.agent, payload, commandId })
    assert.deepEqual(await f.notice(b.tomPerson), [{ name: b.dispatcher.name, role: 'dispatcher' }])
    const retained = await f.grants()
    assert.equal(retained.length, 3)
    for (const row of retained) {
      const fact = facts.find(f => f.payload.enabled && f.tech.id === row.technician_id && f.person.id === row.operator_id)
      assert.ok(fact)
      assert.deepEqual(row, { technician_id: fact.tech.id, shift_id: fact.payload.shiftId, operator_id: fact.person.id, role: fact.person === b.agent ? 'agent' : 'dispatcher', owner_id: owner.id, owner_branch_revision: 0 })
    }
    await h.restart()
    assert.deepEqual(await f.grants(), retained)
    assert.equal((await f.notice(b.priyaPerson)).length, 2)
    assert.deepEqual(await f.notice(b.tomPerson), [{ name: b.dispatcher.name, role: 'dispatcher' }])
    const { activity, exported } = await assertTrail(h, ['location.delegated'])
    assert.equal(activity.filter(e => e.kind === 'location.delegated').length, facts.length)
    for (const fact of facts) {
      const event = activity.find(e => e.commandId === fact.commandId)
      assert.deepEqual([event.kind, event.actorId, event.actorName, event.actorRole, event.at, event.subjectKind, event.subjectId], ['location.delegated', owner.id, owner.name, 'owner', at, 'technician', fact.tech.id])
      for (const name of [owner.name, fact.person.name, fact.tech.name]) assert.ok(event.summary.includes(name))
      assert.ok(event.summary.includes(fact.payload.enabled ? 'granted' : 'withdrew'))
      const row = exported.timeline.find(e => e.id === event.id)
      assert.deepEqual(JSON.parse(row.data), { operatorId: fact.person.id, shiftId: fact.payload.shiftId, enabled: fact.payload.enabled, recordChanges: [] })
    }
    for (const value of ['41.89071', '-87.63071', '41.89172', '-87.63172']) {
      assert.ok(!JSON.stringify(activity).includes(value))
      assert.ok(!JSON.stringify(exported).includes(value))
    }
    const customRole = await h.command('role.save', { name: 'Synthetic position helper', permissions: ['customer.save'] })
    const custom = await h.person('Synthetic Custom', `custom:${customRole.id}`)
    const limited = await h.person('Synthetic Limited Owner', 'owner')
    const other = await h.command('branch.save', { name: 'Synthetic other branch', prefix: 'SYN', timezone: 'UTC', zips: [] })
    await h.command('branch.limit', { operatorId: limited.id, branchId: other.id })
    const token = await h.command('token.issue', { name: 'Synthetic location integration', role: 'dispatcher' })
    const refuse = async (payload, error, as = h.owner(), headers = {}) => {
      const before = await f.grants(), events = (await h.state()).version
      const response = await h.request('/api/glove/commands', { method: 'POST', as, headers, body: { commandId: randomUUID(), type: 'location.delegate', payload } })
      const body = await response.json()
      assert.equal(body.ok, false, JSON.stringify(body))
      assert.equal(body.error.code, error)
      assert.deepEqual(await f.grants(), before)
      assert.equal((await h.state()).version, events, 'refusal changes no domain state')
    }
    const choice = await f.payload()
    for (const person of [b.office, b.dispatcher, b.agent, b.priyaPerson, custom, limited]) await refuse(choice, 'FORBIDDEN', person.cookie)
    await refuse(choice, 'FORBIDDEN', '', { authorization: `Bearer ${token.token}` })
    const inactive = await h.person('Synthetic Inactive', 'dispatcher')
    const response = await h.request('/auth/operator/status', { method: 'POST', body: { operatorId: inactive.id, status: 'inactive' } })
    assert.equal(response.status, 200, await response.text())
    for (const operatorId of [b.office.id, b.priyaPerson.id, inactive.id, 'synthetic-glove-unknown']) await refuse({ ...choice, operatorId }, 'INPUT')
    await refuse({ ...choice, shiftId: (await f.shift(b.tom)).id }, 'SHIFT')
    await refuse({ ...choice, enabled: 'true' }, 'INPUT')
    const closed = (await f.shift(b.tom)).id
    await b.tomPerson.run('clock.out', { deviceTime: f.now() })
    await refuse({ ...choice, technicianId: b.tom.id, shiftId: closed }, 'SHIFT')
    await f.tick()
    await f.start(b.tomPerson, f.visits[1])
    assert.notEqual((await f.shift(b.tom)).id, closed)
    await refuse({ ...choice, technicianId: b.tom.id, shiftId: closed }, 'SHIFT')
    assert.deepEqual(await f.notice(b.tomPerson), [])
  })

  await scenario(t, 'point 2: only granted fresh phone and fleet positions, exact Maps ETAs, per-technician audits, stale and missing estimates', async step => {
    const f = await fixture(step), { h, b } = f
    const thirdPerson = await h.person('Synthetic Third Technician', 'technician')
    const third = await h.command('technician.save', { name: 'Synthetic Third', operatorId: thirdPerson.id })
    const visit = await b.dispatcher.run('visit.book', { jobId: f.job.id, technicianId: third.id, date: '2026-11-09', start: '08:00', end: '09:00' })
    await f.start(thirdPerson, visit)
    await thirdPerson.run('location.phone', { ...f.point(), lat: 41.89999 })
    for (const person of [b.dispatcher, b.office, b.agent]) assert.ok((await f.board(person)).every(t => t.live === null))
    await f.grant(); await f.grant(b.tom)
    const before = (await f.audits()).length, fleetCalls = h.fleet.calls.length
    for (let read = 1; read <= 2; read++) {
      const board = await f.board()
      for (const [tech, source, lat, lng, seconds, arrival] of [
        [b.priya, 'phone', 41.89071, -87.63071, 163, '2026-11-09T08:02:43.000Z'],
        [b.tom, 'Samsara', 41.89172, -87.63172, 169, '2026-11-09T08:02:49.000Z'],
      ]) {
        const live = board.find(t => t.id === tech.id).live
        assert.deepEqual(live.position, { lat, lng, source, observedAt: at })
        const next = (await h.state()).visits.find(v => v.technicianId === tech.id && v.local.start === '10:00')
        assert.deepEqual(live.eta, { visitId: next.id, seconds, arrivalAt: arrival })
      }
      assert.equal(board.find(t => t.id === third.id)?.live, null, 'the ungranted technician is present without a live view')
      assert.ok(board.filter(t => ![b.priya.id, b.tom.id].includes(t.id)).every(t => t.live === null))
      const audits = (await f.audits()).slice(before)
      assert.equal(audits.length, read * 2)
      for (const tech of [b.priya, b.tom]) {
        const rows = audits.filter(e => e.subject_id === tech.id)
        assert.equal(rows.length, read)
        for (const row of rows) {
          assert.deepEqual([row.actor_id, row.actor_name, row.actor_role, row.at], [b.dispatcher.id, b.dispatcher.name, 'dispatcher', at])
          assert.deepEqual(JSON.parse(row.data), { shiftId: (await f.shift(tech)).id, date: '2026-11-09' })
        }
      }
    }
    assert.equal(h.fleet.calls.length, fleetCalls, 'a map read does not poll fleet')
    h.maps.routeSeconds = () => null
    for (const tech of (await f.board()).filter(t => [b.priya.id, b.tom.id].includes(t.id))) {
      assert.ok(tech.live.position)
      assert.equal(tech.live.eta, null)
    }
    await h.command('maps.connect', { key: null })
    for (const tech of (await f.board()).filter(t => [b.priya.id, b.tom.id].includes(t.id))) {
      assert.ok(tech.live.position)
      assert.equal(tech.live.eta, null)
    }
    await f.tick(120_001)
    const stale = await f.board()
    for (const id of [b.priya.id, b.tom.id]) assert.deepEqual(stale.find(t => t.id === id).live, { technicianId: id, status: 'Location stale', position: null, eta: null })
    const beforePause = (await f.audits()).length
    await b.priyaPerson.run('timer.stop', { visitId: f.visits[0].id, deviceTime: f.now() })
    assert.deepEqual((await f.board()).find(t => t.id === b.priya.id).live, { technicianId: b.priya.id, status: 'Location stopped or unavailable', position: null, eta: null })
    assert.equal((await f.audits()).length, beforePause + 2, 'each retained consented grant still audits a read while a timer is paused')
    const { activity, exported } = await assertTrail(h, ['location.viewed'])
    for (const value of ['41.89071', '-87.63071', '41.89172', '-87.63172', '41.89999']) {
      assert.ok(!JSON.stringify(activity).includes(value))
      assert.ok(!JSON.stringify(exported).includes(value))
    }
  })

  for (const ending of ['staff revocation', 'clock-out', 'consent withdrawal', 'new shift', 'recipient role', 'recipient deactivation', 'recipient branch', 'granting Owner deactivation', 'granting Owner branch']) {
    await scenario(t, `point 2: ${ending} ends positions and further audit`, async step => {
      const f = await fixture(step), { h, b } = f
      const secondOwner = ending.startsWith('granting Owner') ? await h.person('Synthetic Second Owner', 'owner') : null
      const originalGrant = await f.payload(), commandId = randomUUID()
      await h.command('location.delegate', originalGrant, { commandId, ...(secondOwner ? { as: secondOwner.cookie } : {}) })
      const agentEnding = ['staff revocation', 'clock-out', 'consent withdrawal'].includes(ending)
      if (agentEnding) {
        await f.grant(b.priya, b.agent)
        const agent = (await f.grants()).find(d => d.operator_id === b.agent.id)
        assert.equal(agent.shift_id, (await f.shift(b.priya)).id)
        assert.equal(agent.role, 'agent')
      }
      assert.equal((await f.board()).find(t => t.id === b.priya.id).live.position.lat, 41.89071)
      if (ending === 'staff revocation') {
        await f.grant(b.priya, b.dispatcher, false)
        await f.grant(b.priya, b.agent, false)
      } else if (ending === 'clock-out' || ending === 'new shift') {
        const oldShift = (await f.shift(b.priya)).id
        await b.priyaPerson.run('clock.out', { deviceTime: f.now() })
        if (ending === 'new shift') {
          await f.tick()
          await f.start()
          await b.priyaPerson.run('location.phone', f.point())
          assert.notEqual((await f.shift(b.priya)).id, oldShift)
          assert.equal((await f.rows()).length, 2, 'new shift has a genuine fresh fix')
        }
        assert.deepEqual(await f.notice(b.priyaPerson), [])
      } else if (ending === 'consent withdrawal') await b.priyaPerson.run('location.consent', { enabled: false })
      else if (ending === 'recipient role') await h.command('role.set', { operatorId: b.dispatcher.id, role: 'office' })
      else if (ending.endsWith('deactivation')) {
        const response = await h.request('/auth/operator/status', { method: 'POST', body: { operatorId: secondOwner?.id ?? b.dispatcher.id, status: 'inactive' } })
        assert.equal(response.status, 200, await response.text())
      } else {
        const branch = await h.command('branch.save', { name: 'Synthetic foreign branch', prefix: 'SYN', timezone: 'UTC', zips: [] })
        await h.command('branch.limit', { operatorId: secondOwner?.id ?? b.dispatcher.id, branchId: branch.id })
      }
      if (agentEnding || ending === 'new shift') {
        const retained = await f.grants(), positions = await f.rows()
        const events = (await (await h.request('/api/glove/export')).json()).timeline
        assert.deepEqual(await h.command('location.delegate', originalGrant, { commandId }), { enabled: true })
        assert.deepEqual(await f.grants(), retained, 'replaying the original command cannot restore an ended grant')
        assert.deepEqual(await f.rows(), positions, 'replay cannot restore a prior capture')
        assert.deepEqual((await (await h.request('/api/glove/export')).json()).timeline, events)
      }
      await f.ended(b.dispatcher, ending === 'recipient deactivation' ? 401 : 200)
      if (agentEnding) await f.ended(b.agent)
    })
  }
})
