// DATA-002 points 5 to 7, proved through the real command door, Activity and the
// business export of a Worker on Miniflare. Each function owns one installation
// and registers its cleanup with the scenario step that calls it.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { installation, business, acceptedQuote, completedJob } from '../api/harness.mjs'

const join = (a, b) => [a, b].join('@')
const sorted = list => [...list].sort()
const bySubject = (a, z) => `${a.kind}:${a.id}`.localeCompare(`${z.kind}:${z.id}`)

async function activityEvents(h) {
  const response = await h.request('/api/glove/activity')
  assert.equal(response.status, 200)
  const page = await response.json()
  assert.equal(page.next, null, 'the whole trail fits one Activity page')
  return page.events.sort((a, z) => a.sequence - z.sequence)
}
async function exportRead(h) {
  const response = await h.request('/api/glove/export')
  assert.equal(response.status, 200)
  const { exportedAt, ...rest } = await response.json()
  return rest
}
const rows = async (h, sql) => (await h.db.prepare(sql).all()).results

/** Every durable surface a command could touch, read through D1 and the public readers. */
async function snapshot(h) {
  return {
    version: (await h.db.prepare('SELECT version FROM glove_meta WHERE id=1').first()).version,
    records: await rows(h, 'SELECT * FROM glove_records ORDER BY kind,id'),
    files: await rows(h, 'SELECT id,capture_id,media_type,size,sha256,created_at FROM glove_files ORDER BY id'),
    events: await rows(h, 'SELECT * FROM glove_events ORDER BY sequence'),
    commands: await rows(h, 'SELECT * FROM glove_commands ORDER BY id'),
    activity: await activityEvents(h),
    exported: await exportRead(h),
  }
}

const shape = e => [e.kind, e.actorId, e.actorName, e.actorRole, e.at, e.commandId, e.subjectKind, e.subjectId, e.summary]
const exportedShape = e => shape({ kind: e.kind, actorId: e.actor_id, actorName: e.actor_name, actorRole: e.actor_role, at: e.at, commandId: e.command_id, subjectKind: e.subject_kind, subjectId: e.subject_id, summary: e.summary })

/** The events one command raised, in Activity and in the business export, in the order they were raised. */
async function trailOf(h, commandId) {
  const activity = (await activityEvents(h)).filter(e => e.commandId === commandId)
  const exported = (await exportRead(h)).timeline.filter(e => e.command_id === commandId)
  assert.deepEqual(exported.map(e => e.id), activity.map(e => e.id), 'Activity and the export hold the same events of the command')
  return { activity, exported }
}

/** DATA-002 point 5: a command that raised no timeline event is refused before it commits anything. */
export async function eventlessCommandRefused({ after }) {
  const source = await readFile('src/glove/conversation.ts', 'utf8')
  const raised = "  event(c, { jobId: row.jobId, subjectKind: 'conversation'"
  assert.ok(source.includes(raised))
  let eventless = false
  // The Worker differs only in that conversation.log no longer raises its event.
  const h = await installation({ at: '2026-11-01T10:00:00.000Z', workerPlugins: [{ name: 'conversation-log-without-event', setup(build) {
    build.onLoad({ filter: /\/glove\/conversation\.ts$/ }, args => eventless
      ? { contents: source.replace(raised, "  void ({ jobId: row.jobId, subjectKind: 'conversation'"), loader: 'ts', resolveDir: dirname(args.path) }
      : undefined)
  } }] })
  after(() => h.close())
  const b = await business(h)
  eventless = true
  await h.restart({ rebuild: true })

  const commandId = randomUUID(), payload = { customerId: b.customer.id, kind: 'note', text: 'Gate code changed' }
  const before = await snapshot(h)
  const refused = await b.office.run('conversation.log', payload, { commandId, error: 'AUDIT' })
  assert.match(refused.message, /no timeline event/)
  assert.deepEqual(await snapshot(h), before, 'the refused command changes no version, record, file, event, Activity, export or command row')
  assert.equal(before.commands.some(row => row.id === commandId), false)
  const retry = await h.request('/api/glove/commands', { method: 'POST', as: b.office.cookie, body: { commandId, type: 'conversation.log', payload } })
  assert.equal(retry.ok, false)
  assert.equal((await retry.json()).error.code, 'AUDIT', 'an identical retry is refused the same way')
  assert.deepEqual(await snapshot(h), before, 'the retry changes nothing either')

  eventless = false
  await h.restart({ rebuild: true })
  const note = await b.office.run('conversation.log', payload, { commandId })
  const { activity, exported } = await trailOf(h, commandId)
  assert.deepEqual(activity.map(shape), [['note.logged', b.office.id, 'Olu Office', 'office', '2026-11-01T10:00:00.000Z', commandId, 'conversation', note.id, 'Olu Office logged a note on Harbourview Dental']])
  assert.equal(exported.length, 1)
  assert.equal((await snapshot(h)).version, before.version + 1)
  assert.deepEqual(await b.office.run('conversation.log', payload, { commandId }), note, 'replay returns the earlier result')
  assert.equal((await trailOf(h, commandId)).activity.length, 1, 'replay adds no event')
}

/** DATA-002 point 6: each event keeps who acted, in what role, when, for which command and what it did. */
export async function eventsKeepIdentity({ after }) {
  const T = { owner: '2026-11-01T10:00:00.000Z', office: '2026-11-01T11:30:00.000Z', agent: '2026-11-01T13:15:00.000Z', technician: '2026-11-02T09:05:00.000Z' }
  const h = await installation({ at: T.owner }); after(() => h.close())
  const b = await business(h)
  const owner = (await h.state()).actor
  const rule = await h.command('rule.save', { name: 'Owner intake', trigger: 'enquiry.created', condition: { source: 'website' }, action: { kind: 'notify', to: 'owner', message: 'Review new intake' } })
  const quote = await acceptedQuote(h, b)
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-02', start: '09:00', end: '10:00' })
  const who = { id: owner.id, name: 'Olivia Owner', role: 'owner' }, as = person => (type, payload, opts) => person ? person.run(type, payload, opts) : h.command(type, payload, opts)
  const person = (p, role) => ({ id: p.id, name: p.name, role })
  const actors = { owner: who, office: person(b.office, 'office'), technician: person(b.priyaPerson, 'technician'), agent: person(b.agent, 'agent') }
  const ruleActor = { id: owner.id, name: 'Olivia Owner (rule "Owner intake")', role: 'owner' }

  const commands = [
    { at: T.owner, by: actors.owner, run: as(null), type: 'customer.save', payload: { name: 'Owner Added Customer' },
      events: r => [['customer.saved', actors.owner, 'customer', r.id, 'Customer Owner Added Customer']] },
    { at: T.office, by: actors.office, run: as(b.office), type: 'enquiry.create', payload: { customerId: b.customer.id, siteId: b.site.id, source: 'website', description: 'Leaking unit' },
      events: r => [['enquiry.created', actors.office, 'enquiry', r.id, 'Request from Harbourview Dental (website): Leaking unit'], ['rule.ran', ruleActor, 'rule', rule.id, 'Rule Owner intake: done; notice to owner']] },
    { at: T.agent, by: actors.agent, run: as(b.agent), type: 'quote.draft', payload: { customerId: b.customer.id, siteId: b.site.id, title: 'Agent drafted quote', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] },
      events: r => [['quote.drafted', actors.agent, 'quote', r.id, `${r.number} drafted by Ada Agent (agent): $207.90 incl. tax`]] },
    { at: T.technician, by: actors.technician, run: as(b.priyaPerson), type: 'visit.arrive', payload: { visitId: visit.id, deviceTime: '2026-11-02T09:01:00Z' },
      events: () => [['capture.arrival', actors.technician, 'capture', null, 'Priya N.: recorded arrival on site (phone time 8:01 PM)']] },
  ]
  const ran = []
  for (const c of commands) {
    await h.setTime(c.at)
    const commandId = randomUUID(), result = await c.run(c.type, c.payload, { commandId })
    ran.push({ ...c, commandId, result })
  }
  const arrival = (await h.state()).captures.find(x => x.visitId === visit.id && x.kind === 'arrival')
  assert.ok(arrival, 'the arrival capture is the arrival event\'s subject')
  const expectedOf = c => c.events(c.result).map(([kind, actor, subjectKind, subjectId, summary]) => [kind, actor.id, actor.name, actor.role, c.at, c.commandId, subjectKind, subjectId ?? arrival.id, summary])
  const check = async stage => {
    for (const c of ran) {
      const { activity, exported } = await trailOf(h, c.commandId)
      assert.deepEqual(activity.map(shape), expectedOf(c), `${stage}: ${c.type} in Activity`)
      assert.deepEqual(exported.map(exportedShape), expectedOf(c), `${stage}: ${c.type} in the business export`)
    }
  }
  await check('at commit')
  assert.equal(new Set(ran.map(c => c.at)).size, 4, 'each command committed at its own runtime clock instant')
  // Later role changes rewrite no earlier event.
  await h.setTime('2026-11-03T08:00:00.000Z')
  for (const p of [b.office, b.priyaPerson, b.agent]) await h.command('role.set', { operatorId: p.id, role: 'viewer' })
  await check('after role.set')
  await h.restart()
  await check('after Worker restart')
}

/** DATA-002 point 7: the first event lists the changed records by kind, id, versions and field names, never values. */
export async function firstEventListsChangedRecords({ after }) {
  const h = await installation({ at: '2026-11-01T10:00:00.000Z' }); after(() => h.close())
  const b = await business(h)
  const oldEmail = join('accounts', 'harbourview.example'), newEmail = join('billing', 'harbourview.example')
  const csvEmails = [0, 1].map(i => join(`csv${i}`, 'example.test'))
  const { job } = await completedJob(h, b, '2026-10-20')
  const draft = await b.office.run('invoice.prepare', { jobId: job.id })
  await h.command('rule.save', { name: 'Owner intake', trigger: 'enquiry.created', condition: { source: 'website' }, action: { kind: 'notify', to: 'owner', message: 'Review new intake' } })
  const cell = v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
  const file = { name: 'clients.csv', text: ['Name,Phone,Email,Address', ...[0, 1].map(i => [`CSV Customer ${i}`, `(415) 600-100${i}`, csvEmails[i], `${i + 1} Oak Ave, Austin, TX 73301`].map(cell).join(','))].join('\n') }
  const mapping = { name: 'Name', phone: 'Phone', email: 'Email', siteAddress: 'Address' }
  const staged = await h.command('import.stage', { format: 'csv', files: [file], mapping })
  const priorState = await h.state()

  const ran = []
  const send = async (label, run, type, payload) => {
    const commandId = randomUUID(), result = await run(type, payload, { commandId })
    ran.push({ label, run, type, payload, commandId, result })
    return result
  }
  const office = (type, payload, opts) => b.office.run(type, payload, opts), owner = (type, payload, opts) => h.command(type, payload, opts)
  await send('customer.save', office, 'customer.save', { id: b.customer.id, version: 1, name: 'Harbourview Dental', email: newEmail, phone: '02 9555 0199', contact: 'Dr Mei Lin', billingAddress: '14 Harbour St, Balmain NSW 2041' })
  await send('site.save', office, 'site.save', { id: b.site.id, version: 1, customerId: b.customer.id, address: '15 Harbour St, Balmain NSW 2041', accessNotes: 'Gate code at reception' })
  await send('invoice.approve', office, 'invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
  await send('enquiry.create', office, 'enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'website', description: 'Leaking unit' })
  await send('import.commit', owner, 'import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const state = await h.state()
  const created = collection => state[collection].filter(r => !priorState[collection].some(x => x.id === r.id))
  const batch = state.imports.find(i => i.id === staged.id)
  await send('import.undo', owner, 'import.undo', { batchId: batch.id, version: batch.version, reason: 'Wrong client list' })

  const approval = state.approvals.find(a => a.subjectId === draft.id)
  const enquiry = ran.find(c => c.label === 'enquiry.create').result
  const removed = { customers: created('customers'), sites: created('sites') }
  assert.equal(removed.customers.length, 2)
  assert.equal(removed.sites.length, 2)
  const change = (kind, id, fromVersion, toVersion, fields) => ({ kind, id, fromVersion, toVersion, fields: sorted(fields) })
  const expected = {
    'customer.save': [change('customers', b.customer.id, 1, 2, ['email', 'phone', 'updatedAt', 'updatedBy', 'version'])],
    'site.save': [change('sites', b.site.id, 1, 2, ['address', 'updatedAt', 'updatedBy', 'version'])],
    'invoice.approve': [
      change('invoices', draft.id, 1, 2, ['dates', 'revisions', 'status', 'version']),
      change('approvals', approval.id, null, 1, ['approvedBy', 'createdAt', 'decision', 'id', 'note', 'preparedBy', 'revision', 'subjectId', 'subjectKind', 'subjectLabel', 'version']),
    ],
    'import.commit': [...removed.customers.map(r => change('customers', r.id, null, 1, Object.keys(r))), ...removed.sites.map(r => change('sites', r.id, null, 1, Object.keys(r)))],
    'import.undo': [
      ...removed.customers.map(r => change('customers', r.id, r.version, null, Object.keys(r))),
      ...removed.sites.map(r => change('sites', r.id, r.version, null, Object.keys(r))),
      change('imports', batch.id, batch.version, batch.version + 2, ['status', 'undoReason', 'undoStartedAt', 'undoneAt', 'undoneBy', 'version']),
    ],
  }
  const values = [oldEmail, newEmail, '02 9555 0101', '02 9555 0199', '14 Harbour St', '15 Harbour St', 'Split system service', '189.00', '207.90', 'Leaking unit', 'CSV Customer', '(415) 600-100', 'Oak Ave', ...csvEmails]
  const recordChangesOf = event => JSON.parse(event.data).recordChanges
  const check = async stage => {
    for (const c of ran) {
      const { activity, exported } = await trailOf(h, c.commandId)
      assert.ok(activity.length >= 1)
      assert.deepEqual(exported.map(e => e.id), activity.map(e => e.id))
      const [first, ...later] = activity, [firstExport, ...laterExports] = exported
      for (const changes of [first.recordChanges, recordChangesOf(firstExport)]) {
        assert.equal(JSON.stringify(changes).includes('"fields":[]'), false)
        for (const value of values) assert.equal(JSON.stringify(changes).includes(value), false, `${stage}: ${c.label} recordChanges never carry ${value}`)
        // A commit's batch and business-setting records also change; its created customers and sites are what the clause names.
        const listed = changes.filter(x => c.label !== 'import.commit' || ['customers', 'sites'].includes(x.kind)).map(x => ({ ...x, fields: sorted(x.fields) }))
        if (expected[c.label]) assert.deepEqual(listed.sort(bySubject), [...expected[c.label]].sort(bySubject), `${stage}: ${c.label} lists exactly its changed records`)
      }
      assert.deepEqual(first.recordChanges, recordChangesOf(firstExport), `${stage}: ${c.label} Activity and export agree`)
      for (const e of later) assert.deepEqual(e.recordChanges, [], `${stage}: ${c.label} later event carries no recordChanges in Activity`)
      for (const e of laterExports) assert.equal(JSON.parse(e.data)?.recordChanges, undefined, `${stage}: ${c.label} later event carries no recordChanges in the export`)
    }
    const request = ran.find(c => c.label === 'enquiry.create')
    const raised = (await trailOf(h, request.commandId)).activity
    assert.deepEqual(raised.map(e => e.kind), ['enquiry.created', 'rule.ran'], 'the enquiry command raised a second event')
    assert.deepEqual(raised[0].recordChanges.map(r => [r.kind, r.fromVersion, r.toVersion]).sort(), [['enquiries', null, 1], ['notices', null, 1], ['ruleRuns', null, 1]])
    assert.ok(raised[0].recordChanges.some(r => r.kind === 'enquiries' && r.id === enquiry.id))
  }
  await check('at commit')
  const trails = async () => Promise.all(ran.map(c => trailOf(h, c.commandId)))
  const eventCount = async () => (await h.db.prepare('SELECT COUNT(*) AS n FROM glove_events').first()).n
  const kept = await trails(), total = await eventCount()
  await h.restart()
  assert.deepEqual(await trails(), kept, 'the same trails after an actual Worker restart')
  await check('after Worker restart')
  for (const c of ran) assert.deepEqual(await c.run(c.type, c.payload, { commandId: c.commandId }), c.result, `${c.label} replays its earlier result`)
  assert.equal(await eventCount(), total, 'replay adds no event')
  assert.deepEqual(await trails(), kept, 'replay leaves every trail as it was')
}
