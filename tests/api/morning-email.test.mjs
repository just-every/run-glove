import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, morningBriefFixture, morningBriefAt, mailEvents, postEvents, assertTrail } from './harness.mjs'

const ownerAddress = ['owner', 'example.test'].join('@')
const officeAddress = ['synthetic-glove-office', 'example.test'].join('@')
const apiKey = 'synthetic-glove-162'
const read = async (h, at) => {
  const response = await h.request(`/api/glove/brief?at=${at}`)
  assert.equal(response.status, 200)
  return response.json()
}
const facts = async h => (await h.request('/api/glove/export').then(r => r.json())).timeline.filter(e => e.subject_kind === 'brief')
const snapshot = async h => ({ state: await h.state(), facts: await facts(h) })
const connect = async h => {
  const signer = mailEvents('sendgrid')
  await h.command('mail.connect', { provider: 'sendgrid', apiKey, eventKey: signer.eventKey, fromEmail: officeAddress })
  return signer
}
const scheduled = async (h, at) => { await h.setTime(at); await h.scheduled(at) }
const event = (date, at, details = {}) => ({ email: ownerAddress, timestamp: Math.floor(Date.parse(at) / 1000), event: 'delivered', sg_event_id: randomUUID(), sg_message_id: 'sg-receipt-1.filter0001', rer_delivery_id: `brief:${date}`, ...details })
const callback = (h, signer, body, at) => postEvents(h, signer.signed([body], { at: Math.floor(Date.parse(at) / 1000) }))
const titles = [['overdue', 'Overdue invoices'], ['atRisk', 'At risk today'], ['unbilled', 'Unbilled work'], ['overEstimate', 'Over their cost estimate'], ['leads', 'Leads waiting'], ['agreements', 'Agreement visits due']]
const briefText = (name, brief) => `${name} morning brief for ${brief.date}, prepared by ${brief.preparedBy}. It is read only; open Glove to act on any item.\n\n${titles.map(([key, title]) => `${title}\n${brief.sections[key].map(x => `- ${x.text} (${x.action.label})`).join('\n') || 'Nothing here.'}`).join('\n\n')}\n\n${brief.notTracked.join('\n')}`

async function onceAndContent() {
  const h = await installation({ at: '2026-11-07T12:00:00.000Z' })
  try {
    const fixture = await morningBriefFixture(h), signer = await connect(h)
    await h.command('mail.morning', { enabled: true, time: '07:15' })
    const brief = await read(h, morningBriefAt)
    assert.ok(brief.sections.unbilled.some(x => x.id === fixture.noInvoice.job.id), 'points 1 and 7: nonempty native work is in the public brief')
    const before = await snapshot(h)
    assert.equal(h.email.sent.length, 0, 'point 2: reading an enabled brief sends nothing')
    assert.deepEqual(await snapshot(h), before)
    await Promise.all([h.scheduled(morningBriefAt), h.scheduled(morningBriefAt)])
    assert.equal(h.email.sent.length, 1, 'point 1: simultaneous first-due runs submit exactly once')
    const sent = h.email.sent[0]
    assert.equal(sent.body.content[0].value, briefText('Pacheco Plumbing & HVAC', brief), 'points 1 and 7: complete mail text equals the public brief prepared for the scheduled instant')
    assert.deepEqual(sent.body.content.map(x => x.type), ['text/plain'])
    assert.doesNotMatch(JSON.stringify(sent.body), /unsubscribe|marketing|promotion|list-unsubscribe/i, 'point 7: transactional text has no marketing or unsubscribe content')
    assert.deepEqual([sent.to, sent.body.custom_args.rer_delivery_id, sent.body.subject], [ownerAddress, 'brief:2026-11-09', 'Morning brief for 2026-11-09 from Pacheco Plumbing & HVAC'])
    assert.equal((await read(h, morningBriefAt)).emailed.status, 'accepted')
    const deliveredAt = '2026-11-09T13:16:00.000Z'
    await h.setTime(deliveredAt)
    const delivered = event('2026-11-09', deliveredAt)
    assert.equal((await callback(h, signer, delivered, deliveredAt)).status, 200)
    const folded = (await read(h, morningBriefAt)).emailed
    assert.deepEqual([folded.status, folded.to], ['delivered', ownerAddress], 'point 1: the signed delivery folds only this date to delivered')
    assert.match(folded.text, /mail server/)
    const retained = await snapshot(h)
    assert.equal((await callback(h, signer, delivered, deliveredAt)).status, 200)
    assert.deepEqual(await snapshot(h), retained, 'point 1: callback replay adds no fact')
    await scheduled(h, '2026-11-09T14:00:00.000Z')
    await Promise.all([h.scheduled('2026-11-09T14:00:00.000Z'), h.scheduled('2026-11-09T14:00:00.000Z')])
    await h.restart()
    await h.scheduled('2026-11-09T14:00:00.000Z')
    assert.equal(h.email.sent.length, 1, 'point 1: later runs, concurrency and actual Worker restart never resubmit the date')
    assert.deepEqual((await read(h, morningBriefAt)).emailed, folded)
    assert.equal(h.pushes.sent.length, 0)
  } finally { await h.close() }
}

async function authorityAndDefaults() {
  const h = await installation({ at: '2026-11-09T06:00:00.000Z' })
  try {
    await h.command('business.save', { name: 'Morning service', timezone: 'Australia/Sydney', email: officeAddress })
    let before = await snapshot(h)
    await h.command('mail.morning', { enabled: true }, { error: 'MAIL' })
    assert.deepEqual(await snapshot(h), before, 'point 2: enabling before connection changes no business or facts')
    await connect(h)
    await h.scheduled('2026-11-09T06:00:00.000Z')
    assert.deepEqual((await read(h, '2026-11-09T06:00:00.000Z')).emailed, { enabled: false })
    assert.equal(h.email.sent.length, 0, 'point 2: connection alone leaves morning mail off')
    for (const time of ['7am', '7:00', '24:00', '07:60', '']) {
      before = await snapshot(h)
      await h.command('mail.morning', { enabled: true, time }, { error: 'INPUT' })
      assert.deepEqual(await snapshot(h), before, `point 2: invalid time ${JSON.stringify(time)} changes nothing`)
    }
    const people = []
    for (const role of ['office', 'dispatcher', 'technician']) people.push(await h.person(`Morning ${role}`, role))
    const custom = await h.command('role.save', { name: 'Morning desk', permissions: ['customer.save'] })
    people.push(await h.person('Morning Custom', `custom:${custom.id}`))
    const branch = await h.command('branch.save', { name: 'North', prefix: 'NTH', timezone: 'Australia/Sydney', zips: [] })
    const limited = await h.person('Morning Limited', 'owner')
    await h.command('branch.limit', { operatorId: limited.id, branchId: branch.id })
    people.push(limited)
    const integration = await h.command('token.issue', { name: 'Morning integration', role: 'office' })
    await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${integration.token}` } })
    for (const payload of [{ enabled: true }, { enabled: false }, { enabled: true, time: '08:15' }]) {
      before = await snapshot(h)
      for (const person of people) {
        await person.run('mail.morning', payload, { error: 'FORBIDDEN' })
        assert.deepEqual(await snapshot(h), before, `point 2: ${person.name} cannot enable, disable or change the time`)
      }
      const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${integration.token}` }, body: { commandId: randomUUID(), type: 'mail.morning', payload } })
      assert.equal(response.status, 403)
      assert.equal((await response.json()).error.code, 'FORBIDDEN')
      assert.deepEqual(await snapshot(h), before, 'point 2: integration tokens cannot configure morning mail')
      const signedOut = await h.request('/api/glove/commands', { method: 'POST', as: '', body: { commandId: randomUUID(), type: 'mail.morning', payload } })
      assert.equal(signedOut.status, 401)
      assert.deepEqual(await snapshot(h), before)
    }
    await h.command('mail.morning', { enabled: true })
    assert.deepEqual((await h.state()).business[0].mail.morning, { enabled: true, time: '07:00' }, 'point 2: the owner enable defaults to 07:00')
    await h.command('mail.morning', { enabled: true, time: '08:15' })
    assert.deepEqual((await h.state()).business[0].mail.morning, { enabled: true, time: '08:15' })
    await h.command('mail.morning', { enabled: false })
    assert.deepEqual((await h.state()).business[0].mail.morning, { enabled: false, time: '08:15' })
    const trail = await assertTrail(h, ['mail.morning'])
    const changes = trail.activity.filter(x => x.kind === 'mail.morning')
    assert.deepEqual(trail.exported.timeline.filter(x => x.kind === 'mail.morning').map(x => { const { enabled, time } = JSON.parse(x.data); return { enabled, time } }), [{ enabled: true, time: '07:00' }, { enabled: true, time: '08:15' }, { enabled: false, time: '08:15' }])
    assert.ok(changes.every(x => x.actorRole === 'owner' && x.actorName === 'Olivia Owner'))
    const former = await h.person('Former Morning Owner', 'owner')
    const captured = randomUUID(), capturedPayload = { enabled: true, time: '09:00' }
    await former.run('mail.morning', capturedPayload, { commandId: captured })
    await h.command('role.set', { operatorId: former.id, role: 'office' })
    before = await snapshot(h)
    await former.run('mail.morning', capturedPayload, { commandId: captured, error: 'FORBIDDEN' })
    assert.deepEqual(await snapshot(h), before, 'point 2: replaying a formerly authorized command cannot restore withdrawn owner authority')
    await former.run('mail.morning', { enabled: true }, { error: 'FORBIDDEN' })
    assert.deepEqual(await snapshot(h), before, 'point 2: current authority, rather than the signed-in session role, controls the next request')
    await h.command('token.revoke', { tokenId: integration.id })
    before = await snapshot(h)
    const revoked = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${integration.token}` }, body: { commandId: randomUUID(), type: 'mail.morning', payload: { enabled: false } } })
    assert.equal(revoked.status, 401)
    assert.deepEqual(await snapshot(h), before, 'point 2: a revoked integration credential changes no morning setting or delivery fact')
  } finally { await h.close() }
}

async function localScheduleAndInterruption() {
  const h = await installation({ at: '2026-11-08T19:45:00.000Z' })
  let release
  try {
    await h.command('business.save', { name: 'Morning service', timezone: 'Australia/Sydney', email: officeAddress })
    await connect(h)
    await h.command('mail.morning', { enabled: true, time: '07:30' })
    for (const at of ['2026-11-08T19:45:00.000Z', '2026-11-08T20:00:00.000Z', '2026-11-08T20:15:00.000Z']) {
      await scheduled(h, at)
      assert.deepEqual(await facts(h), [], 'points 3 and 4: every 15-minute run before 07:30 local claims nothing')
      assert.equal(h.email.sent.length, 0)
    }
    await scheduled(h, '2026-11-08T20:30:00.000Z')
    assert.deepEqual([h.email.sent.length, h.email.sent[0].to, h.email.sent[0].body.custom_args.rer_delivery_id], [1, ownerAddress, 'brief:2026-11-09'], 'point 3: local November 9 differs from UTC November 8; recipient is the account, not business email')
    await scheduled(h, '2026-11-09T20:45:00.000Z')
    assert.equal(h.email.sent[1].body.custom_args.rer_delivery_id, 'brief:2026-11-10', 'point 3: the first check after the chosen time also qualifies')
    let entered
    const paused = new Promise(resolve => { release = resolve })
    const posted = new Promise(resolve => { entered = resolve })
    h.email.beforeRespond = async () => { entered(); await paused }
    const at = '2026-11-10T20:30:00.000Z'
    await h.setTime(at)
    const pending = h.scheduled(at).then(result => ({ result }), () => ({ interrupted: true }))
    await Promise.race([posted, pending.then(() => { throw new Error('Cron ended before reaching the provider boundary') })])
    const claimed = await facts(h)
    assert.deepEqual(claimed.filter(x => x.subject_id === 'brief:2026-11-11').map(x => x.kind), ['email.queued'], 'point 3: a durable claim precedes the provider answer')
    await h.restart()
    release()
    await pending
    h.email.beforeRespond = null
    await h.scheduled(at)
    const after = await facts(h)
    assert.equal(h.email.sent.length, 3, 'point 3: interrupted submission is never repeated after an actual Worker restart')
    assert.deepEqual(after.filter(x => x.subject_id === 'brief:2026-11-11').map(x => x.kind), ['email.queued'], 'point 3: no accepted or delivered fact is fabricated after interruption')
    assert.equal((await read(h, at)).emailed.status, 'queued')
  } finally { release?.(); await h.close() }
}

async function disabledAndUnavailable() {
  const h = await installation({ at: '2026-11-09T13:00:00.000Z' })
  try {
    await h.command('business.save', { name: 'Morning service', timezone: 'America/Chicago' })
    await connect(h)
    await h.command('mail.morning', { enabled: false })
    await h.scheduled('2026-11-09T13:00:00.000Z')
    assert.deepEqual([h.email.sent.length, await facts(h)], [0, []], 'point 4: off claims and sends nothing')
    await h.command('mail.morning', { enabled: true })
    // A restored domain setting can lack its non-exported credential.
    await h.db.prepare("DELETE FROM glove_provider_keys WHERE provider='mail'").run()
    await h.scheduled('2026-11-09T13:00:00.000Z')
    assert.deepEqual([h.email.sent.length, await facts(h)], [0, []], 'point 4: absent provider credentials claim and send nothing')
    await connect(h)
    await h.command('mail.connect', { provider: null })
    await h.scheduled('2026-11-09T13:00:00.000Z')
    assert.deepEqual([h.email.sent.length, await facts(h)], [0, []], 'point 4: explicit disconnection after enabling claims and sends nothing')
    await connect(h)
    await h.command('mail.morning', { enabled: true })
    const owner = (await h.request('/auth/session').then(r => r.json())).operator
    // A retained owner account without a usable address has no normal
    // creation command. Seed only that account edge; exercise the real cron.
    await h.db.prepare("UPDATE oa_operators SET email='' WHERE id=?").bind(owner.id).run()
    await h.scheduled('2026-11-09T13:00:00.000Z')
    assert.equal(h.email.sent.length, 0, 'point 4: no usable active owner sign-in address sends nothing')
    assert.equal(await h.db.prepare("SELECT count(*) AS n FROM glove_events WHERE subject_kind='brief'").first('n'), 0)
  } finally { await h.close() }
}

async function outcomesAndCustody() {
  const h = await installation({ at: '2026-11-09T13:00:00.000Z' })
  try {
    await h.command('business.save', { name: 'Morning service', timezone: 'America/Chicago' })
    const signer = await connect(h)
    await h.command('mail.morning', { enabled: true })
    const expected = []
    for (const [index, http, status] of [[0, 202, 'accepted'], [1, 400, 'rejected'], [2, 429, 'rate_limited'], [3, 503, 'uncertain'], [4, 599, 'uncertain']]) {
      const date = `2026-11-${String(9 + index).padStart(2, '0')}`, at = `${date}T13:00:00.000Z`
      h.email.status[ownerAddress] = http
      await scheduled(h, at)
      const folded = (await read(h, at)).emailed
      assert.deepEqual([folded.date, folded.status], [date, status], 'point 5: the brief shows the honest provider answer for the local date')
      if (status !== 'accepted') assert.match(folded.next, /does not retry.*next business-local date/)
      if (http === 599) {
        const answer = (await facts(h)).find(x => x.subject_id === `brief:${date}` && x.kind === 'email.uncertain')
        assert.equal(JSON.parse(answer.data).code, 'transport_uncertain', 'point 5: unreachable transport is not a provider refusal')
      }
      const retained = await facts(h)
      await scheduled(h, `${date}T14:00:00.000Z`)
      await h.restart()
      await h.scheduled(`${date}T14:00:00.000Z`)
      assert.equal(h.email.sent.length, index + 1, 'point 6: later runs and restart do not retry failed or unknown dates')
      assert.deepEqual(await facts(h), retained)
      assert.equal((await read(h, at)).emailed.status, status, 'point 6: retained date never changes merely because cron ran again')
      expected.push([`brief:${date}`, status])
    }
    h.email.status[ownerAddress] = 202
    const at = '2026-11-14T13:00:00.000Z'
    await scheduled(h, at)
    assert.equal(h.email.sent.length, 6, 'point 6: the next local date sends its own brief')
    assert.equal(h.email.sent[5].body.custom_args.rer_delivery_id, 'brief:2026-11-14')
    const before = await snapshot(h)
    const wrongRecipient = event('2026-11-09', at, { email: officeAddress })
    assert.equal((await callback(h, signer, wrongRecipient, at)).status, 401)
    assert.deepEqual(await snapshot(h), before, 'point 5: signed event for another recipient changes no business or brief fact')
    const wrongDate = event('2026-11-30', at)
    assert.equal((await callback(h, signer, wrongDate, at)).status, 200)
    assert.deepEqual(await snapshot(h), before, 'point 5: signed event for another date changes no business or brief fact')
    for (const [date, outcome, receipt] of [['2026-11-09', 'delivered', 1], ['2026-11-14', 'bounce', 6]]) {
      const body = event(date, at, { event: outcome, sg_message_id: `sg-receipt-${receipt}.filter0001` })
      assert.equal((await callback(h, signer, body, at)).status, 200)
      const folded = (await read(h, `${date}T13:00:00.000Z`)).emailed
      assert.equal(folded.status, outcome === 'bounce' ? 'bounced' : 'delivered', 'point 5: signed provider delivery and bounce fold on their exact dates')
      if (outcome === 'bounce') assert.match(folded.next, /owner's sign-in address.*Today/)
      else assert.match(folded.text, /mail server/)
    }
    const { activity, exported } = await assertTrail(h, ['email.queued', 'email.accepted', 'email.rejected', 'email.rate_limited', 'email.uncertain', 'email.delivered', 'email.bounced'])
    const kept = exported.timeline.filter(x => x.subject_kind === 'brief')
    for (const [subject, status] of expected) assert.ok(kept.some(x => x.subject_id === subject && x.kind === `email.${status}`))
    for (const row of kept) {
      const shown = activity.find(x => x.id === row.id)
      assert.ok(shown, `point 5: ${row.kind} for ${row.subject_id} is in Activity and export`)
      assert.equal(row.actor_role, 'provider')
      assert.equal(shown.summary, row.summary)
      assert.equal(shown.subjectId, row.subject_id)
    }
    assert.equal(JSON.parse(kept.find(x => x.kind === 'email.delivered').data).providerMessageId, 'sg-receipt-1.filter0001')
    assert.equal(JSON.parse(kept.find(x => x.kind === 'email.bounced').data).providerMessageId, 'sg-receipt-6.filter0001')
    const publicData = JSON.stringify({ activity, exported })
    assert.ok(!publicData.includes(apiKey) && !publicData.includes(signer.eventKey), 'point 5: neither provider credential nor signing key is exposed')
    for (const sent of h.email.sent) assert.ok(!publicData.includes(JSON.stringify(sent.body.content[0].value).slice(1, -1)), 'point 5: the brief body is absent from Activity and business export')
  } finally { await h.close() }
}

test('COMM-012 points 1–7: morning delivery, owner authority, local clock, interruption, provider facts and no retries', async () => {
  await onceAndContent()
  await authorityAndDefaults()
  await localScheduleAndInterruption()
  await disabledAndUnavailable()
  await outcomesAndCustody()
})
