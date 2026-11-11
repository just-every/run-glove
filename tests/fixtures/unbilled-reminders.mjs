// PAY-012: the internal uninvoiced-work reminder, through real cron passes on the
// runtime clock. Every step owns its installation; no state is seeded through SQL.
import { scenario } from './scenario.mjs'
import { connectPayments } from './payment-journey.mjs'
import { reminderTemplates } from './collection.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { installation, business, mailEvents } from '../api/harness.mjs'

const KIND = 'invoice.officeReminder'
const source = 'src/glove/unbilled-reminders.ts'
const anchor = 'const id = `unbilled:${job.id}:${date}`'
const checkpoint = "await fetch('https://worker-checkpoint.example.test/qbo-complete')"

/** The Worker with a pause between a pass's state load and its guarded insert. */
async function pausedWorker() {
  const text = await readFile(source, 'utf8')
  assert.ok(text.includes(anchor), 'the pass reads state, then inserts')
  return { name: 'pause-before-reminder-insert', setup(build) {
    build.onLoad({ filter: /\/glove\/unbilled-reminders\.ts$/ }, args => ({ contents: text.replace(anchor, `${checkpoint};\n    ${anchor}`), loader: 'ts', resolveDir: dirname(args.path) }))
  } }
}

let day = 0
/** A completed job through the field doors, in the branch of its new site. */
async function completed(h, { tech, person, branchId = null, label }) {
  const customer = await h.command('customer.save', { name: `${label} customer` })
  const site = await h.command('site.save', { customerId: customer.id, address: `${label} Street`, ...(branchId ? { branchId } : {}) })
  const job = await h.command('job.create', { customerId: customer.id, siteId: site.id, title: label, lines: [{ description: 'Repair work', quantity: '1', unitPrice: '100.00', tax: 'FREE' }] })
  const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date: `2026-10-${String(10 + day++ % 20)}`, start: '09:00', end: '10:00' })
  await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Repaired', signoff: { absentReason: 'Customer away' } })
  return { job, customer, site }
}

/** A UTC business with a main technician and an America/Chicago branch with its own. */
async function zoned(h) {
  const b = await business(h, { currency: 'USD', timezone: 'UTC' })
  const chicago = await h.command('branch.save', { name: 'Chicago', prefix: 'CHI', timezone: 'America/Chicago', zips: [] })
  const person = await h.person('Chi Field', 'technician')
  const tech = await h.command('technician.save', { name: 'Chi Field', operatorId: person.id, branchId: chicago.id })
  const utc = label => completed(h, { tech: b.priya, person: b.priyaPerson, label })
  const chi = label => completed(h, { tech, person, branchId: chicago.id, label })
  return { b, chicago, chicagoField: person, utc, chi }
}

const reminders = async h => (await h.state()).events.filter(e => e.kind === KIND)
const mine = async (h, job) => (await reminders(h)).filter(e => e.jobId === job.id)
const stamps = async (h, job) => (await mine(h, job)).map(e => e.at)
async function pass(h, at) { await h.setTime(at); return h.scheduled(at) }

/** What a pass must never create: mail, push, text, provider requests, messages or invoices. */
async function quiet(h) {
  const s = await h.state()
  assert.ok(Array.isArray(s.messages), 'message rows are part of the state read')
  const before = { email: h.email.sent.length, pushes: h.pushes.sent.length, twilio: h.twilio.calls.length, stripe: h.stripePayments.calls.length, outbound: h.outbound.attempts, messages: s.messages, invoices: s.invoices }
  return async (allowedOutbound = 0) => {
    const now = await h.state()
    assert.deepEqual([h.email.sent.length, h.pushes.sent.length, h.twilio.calls.length, h.stripePayments.calls.length, h.outbound.attempts - allowedOutbound], [before.email, before.pushes, before.twilio, before.stripe, before.outbound], 'passes send no email, push, text or provider request')
    assert.deepEqual(now.messages, before.messages, 'passes create no message row')
    assert.deepEqual(now.invoices, before.invoices, 'passes create no invoice')
  }
}

export async function unbilledReminderPoints(t) {
  await scenario(t, 'PAY-012 point 1: UTC and Chicago jobs get nothing at 07:59 local, one on the first pass at or after 08:00 even across a UTC date change, nothing more that local date or after restart, and one more the next local date', async step => {
    const h = await installation({ at: '2026-11-03T06:00:00Z' }); step.after(() => h.close())
    const { utc, chi } = await zoned(h)
    const u = (await utc('UTC repair')).job, c = (await chi('Chicago repair')).job
    const unchanged = await quiet(h)
    await pass(h, '2026-11-03T07:59:00Z')
    assert.deepEqual([await stamps(h, u), await stamps(h, c)], [[], []], '07:59 UTC and 01:59 Chicago')
    await pass(h, '2026-11-03T08:00:00Z')
    assert.deepEqual([await stamps(h, u), await stamps(h, c)], [['2026-11-03T08:00:00.000Z'], []], '08:00 UTC reminds the UTC job; Chicago is at 02:00')
    await pass(h, '2026-11-03T13:59:00Z')
    assert.deepEqual(await stamps(h, c), [], '07:59 Chicago')
    await Promise.all([pass(h, '2026-11-03T14:00:00Z'), h.scheduled('2026-11-03T14:00:00Z')])
    assert.deepEqual([await stamps(h, u), await stamps(h, c)], [['2026-11-03T08:00:00.000Z'], ['2026-11-03T14:00:00.000Z']], 'two simultaneous passes at 08:00 Chicago leave one reminder')
    await pass(h, '2026-11-03T20:00:00Z')
    await h.restart(); await pass(h, '2026-11-03T20:30:00Z')
    assert.deepEqual([(await mine(h, u)).length, (await mine(h, c)).length], [1, 1], 'later passes and a Worker restart add nothing that local date')
    // A job completed after those passes meets its first pass at 20:30 Chicago on Nov 3, already Nov 4 in UTC.
    const late = (await chi('Late Chicago repair')).job
    await pass(h, '2026-11-04T02:30:00Z')
    const first = await mine(h, late)
    assert.deepEqual(first.map(e => [e.at, e.id.split(':').at(-1)]), [['2026-11-04T02:30:00.000Z', '2026-11-03']], 'the first pass at or after 08:00 local carries the branch-local date, not the UTC date')
    assert.deepEqual([(await mine(h, u)).length, (await mine(h, c)).length], [1, 1], 'the same Chicago date adds nothing, and 02:30 UTC is before 08:00 for the UTC job')
    await pass(h, '2026-11-04T07:59:00Z'); await h.restart()
    assert.deepEqual([(await mine(h, u)).length, (await mine(h, c)).length], [1, 1])
    await pass(h, '2026-11-04T08:00:00Z')
    assert.deepEqual([(await mine(h, u)).length, (await mine(h, c)).length, (await mine(h, late)).length], [2, 1, 1], 'the next UTC date reminds the UTC job once')
    await pass(h, '2026-11-04T13:59:00Z')
    assert.deepEqual([(await mine(h, c)).length, (await mine(h, late)).length], [1, 1])
    await Promise.all([pass(h, '2026-11-04T14:00:00Z'), h.scheduled('2026-11-04T14:00:00Z')])
    assert.deepEqual([(await mine(h, u)).length, (await mine(h, c)).length, (await mine(h, late)).length], [2, 2, 2], 'the next Chicago date reminds each Chicago job once')
    assert.deepEqual((await mine(h, c)).map(e => e.id.split(':').at(-1)).sort(), ['2026-11-03', '2026-11-04'])
    assert.equal(new Set((await reminders(h)).map(e => e.id)).size, 6, 'six reminders, each with its own job and date')
    await unchanged()
  })

  await scenario(t, 'PAY-012 point 1: a draft-only job stays reminded each day, an approved or exported job never is, and each reminder is one internal Activity fact linked to its job, readable and exported only for that job\'s branch', async step => {
    const h = await installation({ at: '2026-11-03T06:00:00Z' }); step.after(() => h.close())
    const { b, chicago, chicagoField, utc, chi } = await zoned(h)
    const draftUtc = (await utc('Draft UTC')).job, approvedUtc = (await utc('Approved UTC')).job, exportedUtc = (await utc('Exported UTC')).job
    const draftChi = (await chi('Draft Chicago')).job, approvedChi = (await chi('Approved Chicago')).job
    const prepare = async job => b.office.run('invoice.prepare', { jobId: job.id })
    const approve = async draft => b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
    const prepared = {}
    for (const job of [draftUtc, approvedUtc, exportedUtc, draftChi, approvedChi]) prepared[job.id] = await prepare(job)
    await approve(prepared[exportedUtc.id]); await b.office.run('invoice.export', {})
    await approve(prepared[approvedUtc.id]); await approve(prepared[approvedChi.id])
    assert.equal((await h.state()).invoices.find(i => i.jobId === exportedUtc.id).status, 'exported')
    const northOnly = await h.person('Chicago Desk', 'office'), mainOnly = await h.person('Main Desk', 'office')
    await h.command('branch.limit', { operatorId: northOnly.id, branchId: chicago.id }); await h.command('branch.limit', { operatorId: mainOnly.id, branchId: 'main' })
    const unchanged = await quiet(h)
    await pass(h, '2026-11-03T14:00:00Z'); await pass(h, '2026-11-04T14:00:00Z')
    const counts = async () => Object.fromEntries(await Promise.all([draftUtc, approvedUtc, exportedUtc, draftChi, approvedChi].map(async j => [j.title, (await mine(h, j)).length])))
    assert.deepEqual(await counts(), { 'Draft UTC': 2, 'Approved UTC': 0, 'Exported UTC': 0, 'Draft Chicago': 2, 'Approved Chicago': 0 })
    await unchanged()
    await approve(prepared[draftChi.id])
    await pass(h, '2026-11-05T14:00:00Z')
    assert.deepEqual(await counts(), { 'Draft UTC': 3, 'Approved UTC': 0, 'Exported UTC': 0, 'Draft Chicago': 2, 'Approved Chicago': 0 }, 'approving the Chicago draft ends its reminders; the UTC draft is still reminded')
    // Activity and the business export: once each, from Glove, linked to the job, branch-scoped.
    const read = async (path, as) => { const r = await h.request(path, { as }); assert.equal(r.status, 200, `${path}: ${await r.clone().text()}`); return r.json() }
    const all = await reminders(h)
    for (const who of [{ name: 'owner', cookie: undefined, jobs: [draftUtc.id, draftChi.id] }, { name: 'Chicago-limited office', cookie: northOnly.cookie, jobs: [draftChi.id] }, { name: 'main-limited office', cookie: mainOnly.cookie, jobs: [draftUtc.id] }]) {
      const expected = all.filter(e => who.jobs.includes(e.jobId)).map(e => e.id).sort()
      const activity = (await read('/api/glove/activity', who.cookie)).events.filter(e => e.kind === KIND)
      const exported = (await read('/api/glove/export', who.cookie)).timeline.filter(e => e.kind === KIND)
      assert.deepEqual(activity.map(e => e.id).sort(), expected, `${who.name} reads exactly their branch's reminders once each in Activity`)
      assert.deepEqual(exported.map(e => e.id).sort(), expected, `${who.name} exports exactly their branch's reminders once each`)
      for (const e of activity) {
        assert.deepEqual([e.actorId, e.actorName, e.actorRole, e.subjectKind, e.subjectId], ['provider:Glove', 'Glove', 'provider', 'job', e.jobId])
        assert.match(e.summary, /^Office reminder: .* is completed and awaits invoice preparation or approval\. Review Invoices\.$/)
      }
    }
    for (const [cookie, job] of [[b.priyaPerson.cookie, draftUtc], [chicagoField.cookie, draftChi]]) {
      const seen = (await read('/api/glove/activity', cookie)).events.filter(e => e.kind === KIND)
      assert.deepEqual(seen.map(e => e.jobId), Array(seen.length).fill(job.id), 'a technician reads reminders only for a job of their own branch')
    }
  })

  await scenario(t, 'PAY-012 point 1: an invoice approval committed between a pass\'s state load and its insert stops that job\'s reminder on that and every later pass', async step => {
    const h = await installation({ at: '2026-11-03T06:00:00Z', workerPlugins: [await pausedWorker()] }); step.after(() => h.close())
    const { b, utc } = await zoned(h)
    const job = (await utc('Raced approval')).job
    const draft = await b.office.run('invoice.prepare', { jobId: job.id })
    let release, entered
    const waiting = new Promise(resolve => { release = resolve }), reached = new Promise(resolve => { entered = resolve })
    h.checkpoints.qboComplete = async () => { entered(); await waiting }
    await h.setTime('2026-11-03T08:00:00Z')
    let running
    try {
      running = h.scheduled('2026-11-03T08:00:00Z')
      await Promise.race([reached, running.then(() => { throw new Error('The pass did not reach its insert') })])
      assert.equal((await mine(h, job)).length, 0)
      await b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
      release(); await running
    } finally { release(); h.checkpoints.qboComplete = null; if (running) await running }
    assert.equal((await mine(h, job)).length, 0, 'the pass that loaded a draft inserts nothing once the invoice is approved')
    await pass(h, '2026-11-03T09:00:00Z'); await h.restart(); await pass(h, '2026-11-04T08:00:00Z')
    assert.equal((await mine(h, job)).length, 0, 'later passes the same and next day stay silent')
  })

  await scenario(t, 'PAY-012 point 1: Owner privacy erasure, committed between a pass\'s load and insert or before a later pass, stops that job\'s reminder on that and every later pass', async step => {
    const h = await installation({ at: '2026-11-03T06:00:00Z', workerPlugins: [await pausedWorker()] }); step.after(() => h.close())
    const { utc } = await zoned(h)
    const erase = async customer => {
      const subject = (await h.state()).customers.find(c => c.id === customer.id)
      const preview = await h.command('privacy.preview', { customerId: subject.id, version: subject.version })
      await h.command('privacy.erase', { customerId: subject.id, version: subject.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
    }
    const racing = await utc('Erased while paused')
    let release, entered
    const waiting = new Promise(resolve => { release = resolve }), reached = new Promise(resolve => { entered = resolve })
    h.checkpoints.qboComplete = async () => { entered(); await waiting }
    await h.setTime('2026-11-03T08:00:00Z')
    let running
    try {
      running = h.scheduled('2026-11-03T08:00:00Z')
      await Promise.race([reached, running.then(() => { throw new Error('The pass did not reach its insert') })])
      await erase(racing.customer)
      release(); await running
    } finally { release(); h.checkpoints.qboComplete = null; if (running) await running }
    assert.equal((await mine(h, racing.job)).length, 0, 'erasure between load and insert leaves no reminder')
    const later = await utc('Erased after one reminder')
    await pass(h, '2026-11-03T09:00:00Z')
    assert.equal((await mine(h, later.job)).length, 1, 'an unerased completed job is reminded on the first pass')
    const kept = (await mine(h, later.job)).length
    await erase(later.customer)
    await pass(h, '2026-11-04T08:00:00Z'); await h.restart(); await pass(h, '2026-11-05T08:00:00Z')
    assert.ok((await mine(h, later.job)).length <= kept, 'no pass after erasure adds a reminder for the erased job')
    assert.ok((await mine(h, later.job)).every(e => e.at < '2026-11-04'), 'nothing is written on any pass after the erasure')
    assert.equal((await mine(h, racing.job)).length, 0, 'every later pass leaves the erased customer\'s job alone')
  })

  await scenario(t, 'PAY-012 point 2: with mail, reminders, payments and consent connected, passes send no customer or office email, push, text, provider request, message row or invoice', async step => {
    const h = await installation({ at: '2026-11-03T06:00:00Z' }); step.after(() => h.close())
    const { b, utc, chi } = await zoned(h)
    await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-1', eventKey: mailEvents('sendgrid').eventKey, fromEmail: ['office', 'example.test'].join('@') })
    await h.command('reminder.configure', { version: (await h.state()).business[0].version, enabled: true, approved: true, templates: reminderTemplates, visitHours: [], paymentDays: [], quoteDays: [] })
    const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
    await h.command('reminder.consent', { customerId: customer.id, version: customer.version, purpose: 'payments', enabled: true, reference: 'Customer requested payment notices' })
    await connectPayments(h)
    const jobs = [(await utc('Quiet UTC')).job, (await chi('Quiet Chicago')).job]
    const unchanged = await quiet(h)
    await Promise.all([pass(h, '2026-11-03T14:00:00Z'), h.scheduled('2026-11-03T14:00:00Z')]); await pass(h, '2026-11-04T14:00:00Z')
    assert.deepEqual(await Promise.all(jobs.map(async j => (await mine(h, j)).length)), [2, 2], 'the reminders were written')
    await unchanged()
    assert.equal(h.email.sent.length, 0)
  })
}
