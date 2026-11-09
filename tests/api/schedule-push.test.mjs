import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { scenario } from '../fixtures/scenario.mjs'
import { installation, business, assertTrail } from './harness.mjs'
import { phoneKeys, decrypt, vapid } from '../fixtures/push-service.mjs'

const initial = '2026-11-09T12:00:00.000Z'
const newLine = 'New visit on your schedule'

async function fixture(t) {
  const h = await installation({ at: initial })
  t.after(() => h.close())
  const b = await business(h, { timezone: 'UTC' })
  await h.command('push.setup', {})
  const phones = []
  for (const [name, person] of [['priya-one', b.priyaPerson], ['priya-two', b.priyaPerson], ['tom', b.tomPerson]]) {
    const phone = await phoneKeys(), endpoint = `https://push.example.test/send/${name}`
    const subscription = await person.run('push.subscribe', { endpoint, keys: phone.keys, device: name })
    phones.push({ name, person, phone, endpoint, subscription })
  }
  const job = title => b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title, lines: [{ description: 'Private service note', quantity: '1', unitPrice: '50.00' }] })
  return { h, b, phones, job }
}

// One journey follows the committed schedule through its producers and phone outcomes.
test('FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control', async t => {
  await scenario(t, 'point 1: later move-in and undo notify the already linked technician', async step => {
    const { h, b, phones } = await fixture(step)
    const kinds = ['company', 'staff', 'job', 'jobactivity']
    const data = Object.fromEntries(await Promise.all(kinds.map(async k => [k, JSON.parse(await readFile(`tests/fixtures/servicem8-small-hvac/${k}.json`, 'utf8'))])))
    // The first batch establishes source identities; no visit is being imported yet.
    const source = rows => Object.entries(rows).map(([k, v]) => ({ name: `${k}.json`, text: JSON.stringify(v) }))
    const stage = rows => h.command('import.stage', { files: source(rows) })
    const commit = (batch, commandId = randomUUID()) => h.command('import.commit', { batchId: batch.id, version: batch.version, fingerprint: batch.preview.fingerprint }, { commandId })
    await commit(await stage({ company: data.company, staff: data.staff, job: data.job, jobactivity: [] }))
    const tech = (await h.state()).technicians.find(x => x.source?.id === data.staff[1].uuid)
    assert.ok(tech)
    const future = { ...data.jobactivity[1], start_date: '2026-11-12 09:00:00', end_date: '2026-11-12 11:00:00' }
    const batch = await stage({ ...data, jobactivity: [future] })
    const id = randomUUID(), committed = await commit(batch, id)
    assert.ok((await h.state()).visits.some(v => v.id === `sm8-${future.uuid}`))
    assert.equal(h.pushes.sent.length, 0, 'unlinked source technician has no subscribed identity')
    await h.command('technician.save', { ...b.tom, operatorId: null })
    await h.command('technician.save', { ...tech, operatorId: b.tomPerson.id })
    await commit(batch, id)
    assert.equal(h.pushes.sent.length, 0, 'import replay sends nothing')
    await h.command('import.undo', { batchId: batch.id, version: committed.version, reason: 'Wrong future booking' })
    assert.equal(h.pushes.sent.length, 1, 'undo removal reaches that technician once')
    assert.deepEqual(JSON.parse(await decrypt(h.pushes.sent[0].body, phones[2].phone)), { title: 'Glove', body: 'Visit canceled', jobId: `sm8-${future.job_uuid}` })
  })
  await scenario(t, 'point 1 and point 3: scheduled billed series extend the horizon once across repeated passes and Worker restart', async step => {
    const { h, b, phones, job } = await fixture(step)
    const j = await job('Private recurring service')
    await h.command('series.create', { jobId: j.id, version: j.version, date: '2026-11-10', rule: { unit: 'week' }, technicianId: b.priya.id, start: '09:00', end: '10:00', horizonDays: 7, billing: { mode: 'per-visit' } })
    assert.equal(h.pushes.sent.length, 2, 'series creation reaches both phones')
    await h.setTime('2026-11-10T12:00:00.000Z')
    await h.scheduled('2026-11-10T12:00:00.000Z')
    assert.deepEqual((await h.state()).visits.filter(v => v.jobId === j.id).map(v => v.local.date), ['2026-11-10', '2026-11-17'])
    assert.equal(h.pushes.sent.length, 4, 'new cron occurrence reaches both subscribed phones after commit')
    for (const p of phones.slice(0, 2)) assert.deepEqual(await Promise.all(h.pushes.sent.filter(s => s.endpoint === p.endpoint).map(async s => JSON.parse(await decrypt(s.body, p.phone)))), [{ title: 'Glove', body: newLine, jobId: j.id }, { title: 'Glove', body: newLine, jobId: j.id }])
    await h.scheduled('2026-11-10T12:00:00.000Z')
    await h.restart()
    await h.scheduled('2026-11-10T12:00:00.000Z')
    assert.equal(h.pushes.sent.length, 4, 'repeated cron and actual restart send nothing again')
  })


})
