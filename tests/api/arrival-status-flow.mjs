import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation } from './harness.mjs'
import { statusFixture, statusTemplates } from './visit-status-fixture.mjs'

const postSms = async (h, request) => h.mf.dispatchFetch(request.url, { method: request.method, headers: Object.fromEntries(request.headers), body: await request.text() })

/** Arrival uses the actual command and delivery doors, including offline evidence. */
export async function arrivalStatusFlow(t) {
  const h = await installation(); t.after(() => h.close())
  const { b, job, visit, at, day } = await statusFixture(h, { configure: false })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: at })
  assert.equal((await h.state()).visits.find(v => v.id === visit.id).status, 'arrived')
  assert.equal(h.twilio.calls.length, 0)

  const templates = { ...statusTemplates, arrival: '{{technician}} arrived for {{title}}.' }
  await h.command('visitNotice.configure', { version: (await h.state()).business[0].version, onMyWay: false, arrival: true, reportReady: false, templates, approved: true })
  const book = start => b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: day, start: `${start}:00`, end: `${start + 1}:00` })
  const current = await book(15), stale = await book(16), quiet = await book(17)
  const arrival = { visitId: current.id, deviceTime: at }, commandId = randomUUID()
  await b.office.run('visit.arrive', arrival, { error: 'FORBIDDEN' })
  await b.tomPerson.run('visit.arrive', arrival, { error: 'FORBIDDEN' })
  await b.priyaPerson.run('visit.arrive', arrival, { commandId })
  await b.priyaPerson.run('visit.arrive', arrival, { commandId })
  assert.equal(h.twilio.calls.length, 1)
  const sent = [...h.twilio.messages.values()][0]
  assert.equal(sent.body, `Priya arrived for ${job.title}.\n\nPacheco Plumbing & HVAC\nReply STOP to stop texts, HELP for help, START to request texts again.`)
  let state = await h.state()
  const message = state.messages.find(m => m.kind === 'arrival')
  assert.equal(message.subjectId, current.id)
  assert.equal(message.subjectKind, 'visit')
  assert.equal(state.messageStates[message.id].status, 'accepted')
  assert.equal((await postSms(h, h.twilio.delivery(sent.sid))).status, 200)
  assert.equal((await postSms(h, h.twilio.delivery(sent.sid))).status, 200)
  assert.equal((await h.state()).messageStates[message.id].status, 'delivered')

  await b.priyaPerson.run('visit.arrive', { visitId: stale.id, deviceTime: new Date(Date.parse(at) - 121_000).toISOString() })
  await h.request('/__test/clock', { method: 'POST', body: { at: `${day}T20:00:00.000Z` } })
  await b.priyaPerson.run('visit.arrive', { visitId: quiet.id, deviceTime: `${day}T20:00:00.000Z` })
  state = await h.state()
  for (const recorded of [stale, quiet]) {
    assert.equal(state.visits.find(v => v.id === recorded.id).status, 'arrived')
    assert.equal(state.captures.filter(c => c.visitId === recorded.id && c.kind === 'arrival').length, 1)
  }
  assert.equal(state.captures.filter(c => c.visitId === current.id && c.kind === 'arrival').length, 1)
  assert.equal(h.twilio.calls.length, 1)
  assert.equal(state.messages.filter(m => m.kind === 'arrival').length, 1)
  const events = (await h.request('/api/glove/activity').then(r => r.json())).events
  assert.ok(events.some(e => e.kind === 'arrival.notice.suppressed' && e.subjectId === stale.id))
  assert.ok(events.some(e => e.kind === 'arrival.notice.suppressed' && e.subjectId === quiet.id))
}
