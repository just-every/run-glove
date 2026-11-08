import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, morningBriefFixture, morningBriefAt, mailEvents, assertTrail } from './harness.mjs'

const read = async (h, at = morningBriefAt, options = {}) => {
  const response = await h.request(`/api/glove/brief?at=${at}`, options)
  assert.equal(response.status, 200)
  return response.json()
}
const ordered = rows => [...rows].sort((a, b) => a.id.localeCompare(b.id))
const normalized = sections => Object.fromEntries(Object.entries(sections).map(([key, rows]) => [key, ordered(rows)]))
const item = (kind, id, text, label, href) => ({ kind, id, text, action: { label, href } })
const expected = f => ({
  atRisk: [
    item('atRisk', f.arrived.visit.id, `${f.arrived.job.number} at 6:00 AM for Still Open: Tom Brooks is still on site after the planned end`, 'Open dispatch', '#dispatch'),
    item('atRisk', f.late.visit.id, `${f.late.job.number} at 7:00 AM for Late Arrival: Priya Nair has not arrived 15 minutes after the start`, 'Open dispatch', '#dispatch'),
  ],
  unbilled: [
    item('unbilled', f.noInvoice.job.id, `${f.noInvoice.job.number} for No Invoice is complete with no invoice`, 'Prepare invoice', '#invoices'),
    item('unbilled', f.draftInvoice.job.id, `${f.draftInvoice.job.number} for Draft Invoice is complete and ${f.draft.number} awaits approval`, 'Approve invoice', '#invoices'),
  ],
  overEstimate: [item('overEstimate', f.late.job.id, `${f.late.job.number} for Late Arrival has cost $150.00 against a $100.00 estimate`, 'Review job costs', '#jobs')],
  leads: [
    item('leadWaiting', f.waiting.id, "Waiting Lead's google request has been new for 24 hours", 'Contact the customer', '#quotes'),
    item('leadWaiting', f.contacted.id, "Contacted Lead's google request has been contacted for 24 hours", 'Quote the request', '#quotes'),
  ], agreements: [], overdue: [],
})
const snapshot = async h => ({
  state: await h.state(),
  commands: (await h.db.prepare('SELECT * FROM glove_commands ORDER BY id').all()).results,
  events: (await h.db.prepare('SELECT * FROM glove_events ORDER BY id').all()).results,
})

// Native commands create the normal records. These three retained edge states
// have no current creation command; seed their storage shape, then exercise
// only the production HTTP reader, including its actual Worker restart.
async function retainedEdges(h, f) {
  const visit = { ...f.later.visit, id: 'synthetic-glove-unassigned', technicianId: null }
  const requests = ['scheduled', 'assessed'].map(status => ({ ...f.waiting, id: `synthetic-glove-${status}`, status }))
  for (const [kind, row] of [['visits', visit], ...requests.map(row => ['enquiries', row])]) await h.db.prepare('INSERT INTO glove_records (kind,id,version,data) VALUES (?,?,?,?)').bind(kind, row.id, row.version, JSON.stringify(row)).run()
  return visit
}

async function recordsJourney() {
  const h = await installation({ at: '2026-11-07T12:00:00.000Z' })
  try {
    const f = await morningBriefFixture(h), unassigned = await retainedEdges(h, f)
    const want = expected(f)
    want.atRisk.push(item('atRisk', unassigned.id, `${f.later.job.number} at 4:00 PM for Later Today: no technician is assigned`, 'Open dispatch', '#dispatch'))
    const before = await snapshot(h), outbound = h.outbound.attempts
    for (const restarted of [false, true]) {
      if (restarted) await h.restart()
      const brief = await read(h)
      assert.deepEqual([brief.date, brief.timezone, brief.at, brief.preparedBy, brief.notTracked], ['2026-11-09', 'America/Chicago', morningBriefAt, 'Glove, from your records', []])
      for (const section of ['atRisk', 'unbilled', 'overEstimate', 'leads', 'agreements', 'overdue']) assert.deepEqual(ordered(brief.sections[section]), ordered(want[section]), `point ${ { atRisk: 5, unbilled: 6, overEstimate: 7, leads: 8 }[section] ?? 1}: complete ${section} identities, text and links`)
      const early = await read(h, '2026-11-09T13:14:00.000Z')
      assert.deepEqual(early.sections.atRisk, [want.atRisk[2]], 'one minute before both thresholds only the unassigned visit is at risk')
      assert.deepEqual(early.sections.leads, [], 'new and contacted leads just before 24 hours are absent')
      assert.deepEqual(await snapshot(h), before, 'every read preserves state version, domain records, events and saved command outcomes')
    }
    assert.equal(h.outbound.attempts, outbound, 'brief reads make no outbound request, including email, push or model')
    assert.deepEqual([h.email.sent.length, h.pushes.sent.length, h.models.calls.length], [0, 0, 0])
  } finally { await h.close() }
}

async function authorityJourney() {
  const h = await installation({ at: '2026-11-07T12:00:00.000Z' })
  try {
    const f = await morningBriefFixture(h)
    const excluded = []
    for (const role of ['office', 'dispatcher', 'technician']) excluded.push(await h.person(`Excluded ${role}`, role))
    const custom = await h.command('role.save', { name: 'Brief reader', permissions: ['customer.save'] })
    excluded.push(await h.person('Excluded Custom', `custom:${custom.id}`))
    const token = await h.command('token.issue', { name: 'Brief integration', role: 'dispatcher' })
    const branch = await h.command('branch.save', { name: 'North', prefix: 'NTH', timezone: 'America/Chicago', zips: [] })
    const scoped = await h.person('North Owner', 'owner')
    const own = await f.job('North Only', f.labor, branch.id)
    const tech = await h.command('technician.save', { name: 'North Technician', branchId: branch.id })
    await h.command('visit.book', { jobId: own.job.id, technicianId: tech.id, date: '2026-11-09', start: '06:00', end: '07:00' })
    await h.command('expense.record', { jobId: own.job.id, category: 'permit', vendor: 'North permit', amount: '175.00', billable: false })
    await h.command('branch.limit', { operatorId: scoped.id, branchId: branch.id })
    // Prime the shared integration-token usage timestamp before comparing domain reads.
    await h.mf.dispatchFetch(h.origin + '/api/glove/brief', { headers: { authorization: `Bearer ${token.token}` } })
    const before = await snapshot(h), outbound = h.outbound.attempts
    for (const person of excluded) {
      const response = await h.request('/api/glove/brief', { as: person.cookie })
      assert.equal(response.status, 403, person.name)
      assert.equal((await response.json()).error.code, 'FORBIDDEN')
      assert.deepEqual(await snapshot(h), before)
    }
    assert.equal((await h.request('/api/glove/brief', { as: '' })).status, 401)
    const tokenRead = await h.mf.dispatchFetch(h.origin + '/api/glove/brief', { headers: { authorization: `Bearer ${token.token}` } })
    assert.equal(tokenRead.status, 403)
    assert.deepEqual(await snapshot(h), before)
    const limited = await read(h, morningBriefAt, { as: scoped.cookie })
    assert.equal(limited.sections.atRisk.length, 1)
    assert.equal(limited.sections.atRisk[0].text, `${own.job.number} at 6:00 AM for North Only: North Technician has not arrived 15 minutes after the start`)
    assert.deepEqual(limited.sections.overEstimate, [item('overEstimate', own.job.id, `${own.job.number} for North Only has cost $175.00 against a $100.00 estimate`, 'Review job costs', '#jobs')])
    for (const section of ['unbilled', 'leads', 'agreements', 'overdue']) assert.deepEqual(limited.sections[section], [])
    const prior = await read(h, '2026-11-09T05:59:00.000Z'), next = await read(h, '2026-11-09T06:00:00.000Z')
    assert.deepEqual([prior.date, next.date], ['2026-11-08', '2026-11-09'])
    assert.deepEqual(prior.sections.atRisk.map(x => x.id), [f.yesterday.visit.id])
    assert.deepEqual(next.sections.atRisk, [], 'at midnight today no assigned visit is late')
    assert.equal((await h.request('/api/glove/brief?at=tomorrow')).status, 400)
    assert.deepEqual(await snapshot(h), before)
    assert.equal(h.outbound.attempts, outbound)
    await h.restart()
    assert.deepEqual(await read(h, morningBriefAt, { as: scoped.cookie }), limited, 'branch-scoped brief survives actual Worker restart')
    const current = await h.request('/api/glove/brief').then(r => r.json())
    assert.deepEqual(current, await read(h), 'an ordinary read uses the pinned runtime instant')
    assert.deepEqual(await snapshot(h), before)
    await h.command('role.set', { operatorId: scoped.id, role: 'office' })
    const revoked = await snapshot(h)
    assert.equal((await h.request('/api/glove/brief', { as: scoped.cookie })).status, 403)
    assert.deepEqual(await snapshot(h), revoked, 'the next read after owner withdrawal is refused without effects')
  } finally { await h.close() }
}

async function deliveryJourney() {
  const h = await installation({ at: '2026-11-07T12:00:00.000Z' })
  try {
    const f = await morningBriefFixture(h), signer = mailEvents('sendgrid')
    await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-brief-mail', eventKey: signer.eventKey, fromEmail: ['synthetic-glove-office', 'example.test'].join('@') })
    await h.command('mail.morning', { enabled: true, time: '07:15' })
    const brief = await read(h)
    assert.deepEqual(normalized(brief.sections), normalized(expected(f)))
    assert.equal(h.email.sent.length, 0, 'reading with morning mail enabled sends nothing')
    await h.scheduled('2026-11-09T13:14:00.000Z')
    assert.equal(h.email.sent.length, 0)
    await Promise.all([h.scheduled(morningBriefAt), h.scheduled(morningBriefAt)])
    assert.equal(h.email.sent.length, 1)
    const sent = h.email.sent[0], titles = [['overdue', 'Overdue invoices'], ['atRisk', 'At risk today'], ['unbilled', 'Unbilled work'], ['overEstimate', 'Over their cost estimate'], ['leads', 'Leads waiting'], ['agreements', 'Agreement visits due']]
    const text = `Pacheco Plumbing & HVAC morning brief for 2026-11-09, prepared by Glove, from your records. It is read only; open Glove to act on any item.\n\n${titles.map(([key, title]) => `${title}\n${brief.sections[key].map(x => `- ${x.text} (${x.action.label})`).join('\n') || 'Nothing here.'}`).join('\n\n')}\n\n`
    assert.equal(sent.body.content[0].value, text, 'complete email text equals the independently checked public brief at this instant')
    assert.deepEqual([sent.provider, sent.body.custom_args.rer_delivery_id, sent.body.subject], ['sendgrid', 'brief:2026-11-09', 'Morning brief for 2026-11-09 from Pacheco Plumbing & HVAC'])
    assert.equal(sent.to, ['owner', 'example.test'].join('@'))
    assert.equal((await read(h)).emailed.status, 'accepted', 'provider acceptance is not claimed as delivery')
    const trail = await assertTrail(h, ['email.queued', 'email.accepted'])
    const facts = trail.exported.timeline.filter(e => e.subject_kind === 'brief')
    assert.deepEqual(facts.map(e => [e.kind, e.subject_id, JSON.parse(e.data).date]), [['email.queued', 'brief:2026-11-09', '2026-11-09'], ['email.accepted', 'brief:2026-11-09', '2026-11-09']])
    assert.equal(JSON.parse(facts[1].data).providerMessageId, 'sg-receipt-1')
    await h.restart()
    await h.scheduled('2026-11-09T14:00:00.000Z')
    assert.equal(h.email.sent.length, 1, 'later cron after actual Worker restart cannot duplicate this local date')
    assert.deepEqual((await read(h)).sections, brief.sections)
    assert.equal(h.pushes.sent.length, 0)
  } finally { await h.close() }
}

test('AGENT-008 points 1–8: fixed-date owner brief, authority, cron delivery and Worker restart', async () => {
  await recordsJourney()
  await authorityJourney()
  await deliveryJourney()
})
