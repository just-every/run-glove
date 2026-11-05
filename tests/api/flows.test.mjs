// One flow per first-release clause (ACCEPTANCE.md), through the public doors
// of a real Glove Worker and D1: the command endpoint, state, files and exports.
import { connectPayments, paidInvoice, paymentEvent } from '../fixtures/payment-journey.mjs'
import { quickbooksBusiness } from '../fixtures/quickbooks-business.mjs'
import { reminderTemplates } from '../fixtures/collection.mjs'
import test, { after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { installation, business, acceptedQuote, completedJob, assertTrail, mailEvents } from './harness.mjs'

const jpeg = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex').toString('base64')
const png = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex').toString('base64')
const fixture = 'tests/fixtures/servicem8-small-hvac/'
async function moveInFiles() {
  const files = []
  for (const kind of ['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment']) files.push({ name: `${kind}.json`, text: await readFile(`${fixture}${kind}.json`, 'utf8') })
  files.push({ name: 'attachments/8b9c0d1e-0001-4f2a-9b3c-4d5e6f7a8b01', base64: (await readFile(`${fixture}attachment-8b9c0d1e-0001-4f2a-9b3c-4d5e6f7a8b01.jpg`)).toString('base64') })
  return files
}

describe('API-001 Glove first release: quote to booked visit to field evidence to invoice export', async (t) => {
  const h = await installation()
  after(() => h.close())
  let b, quote, job, visit

  test('01 owner sets up the business, price book, team and roles', async () => {
    assert.equal((await h.state()).jobs.length, 0, 'a new installation starts empty')
    b = await business(h)
    const s = await h.state()
    assert.equal(s.business[0].timezone, 'Australia/Sydney')
    assert.deepEqual(s.operators.filter(o => o.role).map(o => o.role).sort(), ['agent', 'dispatcher', 'office', 'technician', 'technician'])
    await b.dispatcher.run('business.save', { name: 'Taken over', timezone: 'UTC' }, { error: 'FORBIDDEN' })
    await b.dispatcher.run('role.set', { operatorId: b.office.id, role: 'owner' }, { error: 'FORBIDDEN' })
    await h.command('business.save', { name: 'x', timezone: 'Mars/Olympus', version: s.business[0].version }, { error: 'TIMEZONE' })
  })

  test('02 desk records a customer and the sites where work happens', async () => {
    const extra = await b.office.run('site.save', { customerId: b.customer.id, address: 'Level 2, 14 Harbour St, Balmain NSW 2041', accessNotes: 'Lift to level 2' })
    const s = await b.dispatcher.state()
    assert.equal(s.sites.filter(x => x.customerId === b.customer.id).length, 2)
    const records = state => ({ customer: state.customers.find(x => x.id === b.customer.id), sites: state.sites.filter(x => x.customerId === b.customer.id).sort((a, z) => a.id.localeCompare(z.id)) })
    const initial = records(s)
    assert.deepEqual([initial.customer.name, initial.customer.contact, initial.customer.email, initial.customer.phone, initial.customer.billingAddress], ['Harbourview Dental', 'Dr Mei Lin', ['accounts', 'harbourview.example'].join('@'), '02 9555 0101', '14 Harbour St, Balmain NSW 2041'])
    assert.deepEqual(initial.sites.map(x => [x.id, x.customerId, x.address, x.accessNotes]).sort(), [
      [b.site.id, b.customer.id, '14 Harbour St, Balmain NSW 2041', 'Gate code at reception'],
      [extra.id, b.customer.id, 'Level 2, 14 Harbour St, Balmain NSW 2041', 'Lift to level 2'],
    ].sort())
    await b.office.run('site.save', { customerId: randomUUID(), address: 'Nowhere' }, { error: 'NOT_FOUND' })
    const customerCommand = randomUUID(), siteCommand = randomUUID()
    const customerEdit = { id: b.customer.id, version: b.customer.version, name: 'Harbourview Dental Group', contact: 'Mei Lin, accounts contact', email: ['accounts', 'harbourview.example'].join('@'), phone: '02 9555 0199', billingAddress: 'PO Box 25, Balmain NSW 2041' }
    const siteEdit = { id: extra.id, version: extra.version, customerId: b.customer.id, address: 'Level 3, 14 Harbour St, Balmain NSW 2041', accessNotes: 'Call reception for the level 3 lift key' }
    const edited = await b.office.run('customer.save', customerEdit, { commandId: customerCommand })
    const editedSite = await b.dispatcher.run('site.save', siteEdit, { commandId: siteCommand })
    const newer = records(await b.dispatcher.state())
    assert.deepEqual([newer.customer.name, newer.customer.contact, newer.customer.email, newer.customer.phone, newer.customer.billingAddress, newer.customer.version, newer.customer.updatedBy], ['Harbourview Dental Group', 'Mei Lin, accounts contact', ['accounts', 'harbourview.example'].join('@'), '02 9555 0199', 'PO Box 25, Balmain NSW 2041', 2, b.office.id])
    assert.deepEqual(newer.sites.map(x => [x.id, x.customerId, x.address, x.accessNotes, x.version]).sort(), [
      [b.site.id, b.customer.id, '14 Harbour St, Balmain NSW 2041', 'Gate code at reception', 1],
      [extra.id, b.customer.id, 'Level 3, 14 Harbour St, Balmain NSW 2041', 'Call reception for the level 3 lift key', 2],
    ].sort())
    assert.equal(newer.sites.find(x => x.id === extra.id).updatedBy, b.dispatcher.id)
    await b.dispatcher.run('customer.save', { id: b.customer.id, version: b.customer.version, name: 'Stale edit' }, { error: 'STALE' })
    assert.deepEqual(records(await b.dispatcher.state()), newer, 'a stale customer edit preserves every newer customer and site field')
    await b.office.run('site.save', { ...siteEdit, version: extra.version, address: 'Stale address', accessNotes: 'Stale access notes' }, { error: 'STALE' })
    assert.deepEqual(records(await b.dispatcher.state()), newer, 'a stale site edit preserves every newer customer and site field')
    assert.equal(edited.version, 2)
    assert.equal(editedSite.version, 2)
    assert.ok(extra.id)
    await h.restart()
    assert.deepEqual(records(await b.dispatcher.state()), newer, 'the exact customer and both sites survive a real Worker restart')
    assert.deepEqual(await b.office.run('customer.save', customerEdit, { commandId: customerCommand }), edited)
    assert.deepEqual(await b.dispatcher.run('site.save', siteEdit, { commandId: siteCommand }), editedSite)
    assert.deepEqual(records(await b.dispatcher.state()), newer, 'replaying either saved edit cannot add a version or replace current data')

    const customerAttempt = { ...customerEdit, version: edited.version, name: 'Unauthorized customer' }
    const siteAttempt = { ...siteEdit, version: editedSite.version, accessNotes: 'Unauthorized notes' }
    await b.priyaPerson.run('customer.save', customerAttempt, { error: 'FORBIDDEN' })
    await b.priyaPerson.run('site.save', siteAttempt, { error: 'FORBIDDEN' })
    await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
    await b.office.run('customer.save', customerAttempt, { error: 'FORBIDDEN' })
    await b.office.run('site.save', siteAttempt, { error: 'FORBIDDEN' })
    await b.office.run('customer.save', customerEdit, { commandId: customerCommand, error: 'FORBIDDEN' })
    assert.deepEqual(records(await b.dispatcher.state()), newer, 'the existing session loses write and replay authority immediately without changing records')
    await h.command('role.set', { operatorId: b.office.id, role: 'office' })
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' })
    await b.dispatcher.run('site.save', siteEdit, { commandId: siteCommand, error: 'FORBIDDEN' })
    assert.deepEqual(records(await h.state()), newer, 'withdrawing the site recorder role also refuses replay without changing either record')
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'dispatcher' })

    const { activity, exported } = await assertTrail(h, ['customer.saved', 'site.saved'])
    assert.deepEqual(records(exported), newer, 'the business export retains the same customer and both sites after refused edits')
    for (const [commandId, kind, subjectId, actorId, actorName, actorRole] of [
      [customerCommand, 'customer.saved', b.customer.id, b.office.id, 'Olu Office', 'office'],
      [siteCommand, 'site.saved', extra.id, b.dispatcher.id, 'Sam Ortiz', 'dispatcher'],
    ]) {
      const events = activity.filter(e => e.commandId === commandId)
      assert.equal(events.length, 1, 'the retained save has exactly one attributable Activity event after restart and replay')
      assert.deepEqual([events[0].kind, events[0].subjectKind, events[0].subjectId, events[0].actorId, events[0].actorName, events[0].actorRole], [kind, kind === 'customer.saved' ? 'customer' : 'site', subjectId, actorId, actorName, actorRole])
      assert.ok(Number.isFinite(Date.parse(events[0].at)))
      const kept = exported.timeline.filter(e => e.command_id === commandId)
      assert.equal(kept.length, 1)
      assert.deepEqual([kept[0].id, kept[0].kind, kept[0].subject_id, kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].at, kept[0].summary], [events[0].id, kind, subjectId, actorId, actorName, actorRole, events[0].at, events[0].summary])
    }
  })

  test('03 an enquiry becomes a quote whose exact revision a person prices and approves', async t => {
    const clock = async at => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
    t.after(() => clock(null))
    const recorder = { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }
    const times = ['2026-10-14T08:00:00.000Z', '2026-10-14T08:01:00.000Z', '2026-10-14T08:02:00.000Z', '2026-10-14T08:03:00.000Z', '2026-10-14T08:04:00.000Z']
    const commandIds = times.map(() => randomUUID())
    await clock(times[0])
    const enquiry = await b.dispatcher.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Surgery 2 split system blowing warm air', source: 'phone' }, { commandId: commandIds[0] })
    assert.deepEqual([enquiry.customerId, enquiry.siteId, enquiry.description, enquiry.source, enquiry.createdBy, enquiry.createdAt], [b.customer.id, b.site.id, 'Surgery 2 split system blowing warm air', 'phone', recorder, times[0]])
    await clock(times[1])
    const draftPayload = { enquiryId: enquiry.id, title: 'Split system service', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }, { description: 'R32 refrigerant', quantity: '0.5', unitPrice: '95.00', serviceId: b.refrigerant.id }] }
    quote = await b.dispatcher.run('quote.draft', draftPayload, { commandId: commandIds[1] })
    assert.deepEqual([quote.enquiryId, quote.customerId, quote.siteId, quote.title, quote.createdAt, quote.status], [enquiry.id, b.customer.id, b.site.id, 'Split system service', times[1], 'draft'])
    const bookLines = [
      { description: 'Split system service', quantity: '1', unitPrice: '189.00', tax: 'GST', serviceId: b.service.id, total: '189.00', unitCost: '0.00', customerDescription: '', images: [] },
      { description: 'R32 refrigerant', quantity: '0.5', unitPrice: '95.00', tax: 'GST', serviceId: b.refrigerant.id, total: '47.50', unitCost: '0.00', customerDescription: '', images: [] },
    ]
    assert.deepEqual(quote.revisions[0].lines, bookLines)
    // 18,900 + (9,500 × 0.5) = 23,650 cents; 10% tax = 2,365 cents.
    assert.deepEqual(quote.revisions[0].totals, { subtotal: '236.50', gst: '23.65', total: '260.15' })
    assert.deepEqual([quote.revisions[0].n, quote.revisions[0].preparedBy, quote.revisions[0].preparedAt, quote.revisions[0].approval], [1, recorder, times[1], null])
    const retained = async () => {
      const s = await h.state()
      const { followupState: _liveReminderSummary, ...record } = s.quotes.find(q => q.id === quote.id)
      return { quote: record, enquiry: s.enquiries.find(e => e.id === enquiry.id), approvals: s.approvals.filter(a => a.subjectId === quote.id), events: s.events.filter(e => [quote.id, enquiry.id].includes(e.subjectId)) }
    }
    const refuse = async (run, type, payload, error, opts = {}) => {
      const before = await retained()
      await run(type, payload, { ...opts, error })
      assert.deepEqual(await retained(), before, `${error} changes no retained quote, request, approval or event`)
    }
    const firstApproval = { quoteId: quote.id, version: quote.version, revision: 1 }
    await refuse(b.agent.run, 'quote.approve', firstApproval, 'FORBIDDEN')
    await refuse(b.office.run, 'quote.approve', firstApproval, 'FORBIDDEN')
    await clock(times[2])
    let approved = await b.dispatcher.run('quote.approve', firstApproval, { commandId: commandIds[2] })
    const firstRevision = structuredClone(approved.revisions[0])
    assert.deepEqual(firstRevision.lines, bookLines)
    assert.deepEqual(firstRevision.approval, { ...recorder, at: times[2] })
    assert.deepEqual(firstRevision.totals, { subtotal: '236.50', gst: '23.65', total: '260.15' })
    await clock(times[3])
    const revisionPayload = { quoteId: quote.id, version: approved.version, lines: [{ description: 'Split system service', quantity: '1', unitPrice: '199.00', serviceId: b.service.id }, { description: 'R32 refrigerant', quantity: '0.5', unitPrice: '95.00' }] }
    const revised = await b.dispatcher.run('quote.revise', revisionPayload, { commandId: commandIds[3] })
    assert.equal(revised.status, 'draft', 'a price change needs a fresh approval')
    assert.equal(revised.revisions.length, 2)
    assert.deepEqual(revised.revisions[0], firstRevision, 'every earlier line, total, preparation and approval remains unchanged')
    const revisedLines = [
      { description: 'Split system service', quantity: '1', unitPrice: '199.00', tax: 'GST', serviceId: b.service.id, total: '199.00', unitCost: '0.00', customerDescription: '', images: [] },
      { description: 'R32 refrigerant', quantity: '0.5', unitPrice: '95.00', tax: 'GST', serviceId: null, total: '47.50' },
    ]
    assert.deepEqual(revised.revisions[1].lines, revisedLines, 'the revision retains both the edited price-book line and the independently priced custom line')
    // 19,900 + 4,750 = 24,650 cents; tax 2,465; gross 27,115.
    assert.deepEqual(revised.revisions[1].totals, { subtotal: '246.50', gst: '24.65', total: '271.15' })
    assert.deepEqual([revised.revisions[1].n, revised.revisions[1].preparedBy, revised.revisions[1].preparedAt, revised.revisions[1].approval], [2, recorder, times[3], null])
    assert.equal((await retained()).approvals.length, 1, 'editing a price creates no decision for the new revision')
    await refuse(b.dispatcher.run, 'quote.markSent', { quoteId: quote.id, version: revised.version, channel: 'email' }, 'NOT_APPROVED')
    await refuse(b.dispatcher.run, 'quote.approve', { quoteId: quote.id, version: revised.version, revision: 1 }, 'REVISION')
    await refuse(b.dispatcher.run, 'quote.approve', { quoteId: quote.id, version: approved.version, revision: 2 }, 'STALE')
    await refuse(b.dispatcher.run, 'quote.revise', { ...revisionPayload, lines: [{ description: 'Stale price edit', quantity: '1', unitPrice: '1.00' }] }, 'STALE')
    await clock(times[4])
    const secondApproval = { quoteId: quote.id, version: revised.version, revision: 2 }
    approved = await b.dispatcher.run('quote.approve', secondApproval, { commandId: commandIds[4] })
    assert.equal(approved.revisions[1].approval.name, 'Sam Ortiz')
    assert.equal(approved.revisions[0].approval.name, 'Sam Ortiz', 'the earlier approval stays on its own revision')
    assert.deepEqual(approved.revisions[0], firstRevision)
    assert.deepEqual(approved.revisions[1], { ...revised.revisions[1], approval: { ...recorder, at: times[4] } })
    const expected = await retained()
    assert.deepEqual(expected.quote, approved)
    assert.deepEqual([expected.enquiry.customerId, expected.enquiry.siteId, expected.enquiry.quoteId, expected.enquiry.status], [b.customer.id, b.site.id, quote.id, 'quoted'])
    assert.equal(expected.approvals.length, 2)
    assert.notEqual(expected.approvals[0].id, expected.approvals[1].id, 'each revision has a distinct retained decision')
    assert.deepEqual(expected.approvals.map(({ id, ...decision }) => decision), [
      { version: 1, createdAt: times[2], subjectKind: 'quote', subjectId: quote.id, subjectLabel: `${quote.number} revision 1 · $260.15 incl. tax`, revision: 1, preparedBy: recorder, approvedBy: recorder, decision: 'approved', note: '' },
      { version: 1, createdAt: times[4], subjectKind: 'quote', subjectId: quote.id, subjectLabel: `${quote.number} revision 2 · $271.15 incl. tax`, revision: 2, preparedBy: recorder, approvedBy: recorder, decision: 'approved', note: '' },
    ])
    await h.restart()
    await clock('2026-10-14T09:00:00.000Z')
    assert.deepEqual(await retained(), expected, 'both exact revisions, decisions and the linked request survive a real Worker restart')
    assert.deepEqual(await b.dispatcher.run('quote.approve', firstApproval, { commandId: commandIds[2] }), { ...quote, version: 2, status: 'approved', revisions: [firstRevision] })
    assert.deepEqual(await b.dispatcher.run('quote.approve', secondApproval, { commandId: commandIds[4] }), approved)
    assert.deepEqual(await retained(), expected, 'replaying either decision cannot replace the current price or create another approval')
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' })
    await refuse(b.dispatcher.run, 'quote.approve', secondApproval, 'FORBIDDEN', { commandId: commandIds[4] })
    await refuse(b.dispatcher.run, 'quote.revise', { ...revisionPayload, version: approved.version }, 'FORBIDDEN')
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'dispatcher' })
    const { activity, exported } = await assertTrail(h, ['enquiry.created', 'quote.drafted', 'quote.approved', 'quote.revised'])
    assert.deepEqual(exported.quotes.find(q => q.id === quote.id), approved)
    assert.deepEqual(exported.enquiries.find(e => e.id === enquiry.id), expected.enquiry)
    assert.deepEqual(exported.approvals.filter(a => a.subjectId === quote.id), expected.approvals)
    const kinds = ['enquiry.created', 'quote.drafted', 'quote.approved', 'quote.revised', 'quote.approved']
    const data = [{ source: 'phone' }, { revision: 1 }, { revision: 1, total: '260.15' }, { revision: 2 }, { revision: 2, total: '271.15' }]
    const summaries = [
      'Request from Harbourview Dental Group (phone): Surgery 2 split system blowing warm air',
      `${quote.number} drafted by Sam Ortiz (dispatcher): $260.15 incl. tax`,
      `${quote.number} revision 1 price approved by Sam Ortiz`,
      `${quote.number} revision 2 by Sam Ortiz: $271.15 incl. tax (needs approval)`,
      `${quote.number} revision 2 price approved by Sam Ortiz`,
    ]
    for (const [i, commandId] of commandIds.entries()) {
      const shown = activity.filter(e => e.commandId === commandId)
      assert.equal(shown.length, 1, 'each successful command has exactly one attributable Activity event after replay')
      assert.deepEqual([shown[0].kind, shown[0].subjectKind, shown[0].subjectId, shown[0].actorId, shown[0].actorName, shown[0].actorRole, shown[0].at, shown[0].summary], [kinds[i], i ? 'quote' : 'enquiry', i ? quote.id : enquiry.id, recorder.id, recorder.name, recorder.role, times[i], summaries[i]])
      const kept = exported.timeline.filter(e => e.command_id === commandId)
      assert.equal(kept.length, 1)
      assert.deepEqual([kept[0].id, kept[0].kind, kept[0].subject_id, kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].at, kept[0].summary], [shown[0].id, kinds[i], i ? quote.id : enquiry.id, recorder.id, recorder.name, recorder.role, times[i], summaries[i]])
      const detail = JSON.parse(kept[0].data)
      assert.deepEqual(Object.fromEntries(Object.keys(data[i]).map(key => [key, detail[key]])), data[i])
    }
    quote = approved
    {
      const clock = async at => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
      t.after(() => clock(null))
      await clock('2026-10-14T20:00:00.000Z')
      const request = await b.dispatcher.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Native request for two services and custom inspection', source: 'phone' })
      const lineInput = price => [
        { description: 'Split system service', quantity: '2', unitPrice: price, serviceId: b.service.id },
        { description: 'R32 refrigerant', quantity: '0.375', unitPrice: '95.00', serviceId: b.refrigerant.id },
        { description: 'Manual condensate line inspection', quantity: '0.25', unitPrice: '17.90', tax: 'FREE' },
      ]
      const draftId = randomUUID(), approveOneId = randomUUID(), reviseId = randomUUID(), approveTwoId = randomUUID()
      const draft = await b.dispatcher.run('quote.draft', { enquiryId: request.id, title: 'Priced request with custom inspection', lines: lineInput('189.00') }, { commandId: draftId })
      assert.deepEqual([draft.enquiryId, draft.customerId, draft.siteId], [request.id, b.customer.id, b.site.id])
      const lineValues = revision => revision.lines.map(l => [l.serviceId, l.description, l.quantity, l.unitPrice, l.tax, l.total])
      assert.deepEqual(lineValues(draft.revisions[0]), [
        [b.service.id, 'Split system service', '2', '189.00', 'GST', '378.00'],
        [b.refrigerant.id, 'R32 refrigerant', '0.375', '95.00', 'GST', '35.63'],
        [null, 'Manual condensate line inspection', '0.25', '17.90', 'FREE', '4.48'],
      ])
      // 37800 + 3563 + 448 cents; only the first two lines are taxable.
      assert.deepEqual(draft.revisions[0].totals, { subtotal: '418.11', gst: '41.36', total: '459.47' })
      assert.equal(draft.revisions[0].approval, null)
      await clock('2026-10-14T20:01:00.000Z')
      const one = await b.dispatcher.run('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 }, { commandId: approveOneId })
      assert.deepEqual(one.revisions[0].approval, { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher', at: '2026-10-14T20:01:00.000Z' })
      await clock('2026-10-14T20:02:00.000Z')
      const two = await b.dispatcher.run('quote.revise', { quoteId: draft.id, version: one.version, lines: lineInput('199.00') }, { commandId: reviseId })
      assert.equal(two.status, 'draft')
      assert.equal(two.revisions.length, 2)
      assert.deepEqual(two.revisions[0], one.revisions[0], 'a new price cannot alter any earlier line, total or approval')
      assert.deepEqual(lineValues(two.revisions[1]), [
        [b.service.id, 'Split system service', '2', '199.00', 'GST', '398.00'],
        [b.refrigerant.id, 'R32 refrigerant', '0.375', '95.00', 'GST', '35.63'],
        [null, 'Manual condensate line inspection', '0.25', '17.90', 'FREE', '4.48'],
      ])
      assert.deepEqual(two.revisions[1].totals, { subtotal: '438.11', gst: '43.36', total: '481.47' })
      assert.equal(two.revisions[1].approval, null)
      const records = s => { const { followupState, ...quote } = s.quotes.find(q => q.id === draft.id); return { quote, approvals: s.approvals.filter(a => a.subjectId === draft.id), request: s.enquiries.find(e => e.id === request.id) } }
      const before = records(await h.state())
      assert.deepEqual([before.request.quoteId, before.request.customerId, before.request.siteId, before.request.description], [draft.id, b.customer.id, b.site.id, 'Native request for two services and custom inspection'])
      await b.dispatcher.run('quote.approve', { quoteId: draft.id, version: two.version, revision: 1 }, { error: 'REVISION' })
      assert.deepEqual(records(await h.state()), before, 'wrong-revision approval changes neither revision nor its decision')
      await b.dispatcher.run('quote.revise', { quoteId: draft.id, version: one.version, lines: lineInput('1.00') }, { error: 'STALE' })
      assert.deepEqual(records(await h.state()), before, 'a stale edit cannot replace the newer price or earlier approval')
      await clock('2026-10-14T20:03:00.000Z')
      const final = await h.command('quote.approve', { quoteId: draft.id, version: two.version, revision: 2 }, { commandId: approveTwoId })
      assert.equal(final.status, 'approved')
      assert.deepEqual(final.revisions[0], one.revisions[0])
      const owner = { id: (await h.state()).actor.id, name: 'Olivia Owner', role: 'owner' }
      assert.deepEqual(final.revisions[1].approval, { ...owner, at: '2026-10-14T20:03:00.000Z' })
      const kept = records(await h.state())
      assert.deepEqual(kept.approvals.map(a => [a.revision, a.approvedBy, a.createdAt, a.decision]).sort((a, z) => a[0] - z[0]), [
        [1, { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }, '2026-10-14T20:01:00.000Z', 'approved'],
        [2, owner, '2026-10-14T20:03:00.000Z', 'approved'],
      ])
      await h.restart()
      assert.deepEqual(records(await h.state()), kept, 'both separately approved prices and their request survive a real Worker restart')
      const { activity, exported } = await assertTrail(h, ['enquiry.created', 'quote.drafted', 'quote.revised', 'quote.approved'])
      assert.deepEqual(records(exported), kept)
      for (const [id, kind, who, at] of [
        [draftId, 'quote.drafted', { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }, '2026-10-14T20:00:00.000Z'],
        [approveOneId, 'quote.approved', { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }, '2026-10-14T20:01:00.000Z'],
        [reviseId, 'quote.revised', { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }, '2026-10-14T20:02:00.000Z'],
        [approveTwoId, 'quote.approved', owner, '2026-10-14T20:03:00.000Z'],
      ]) {
        const e = activity.filter(e => e.commandId === id)
        assert.equal(e.length, 1)
        assert.deepEqual([e[0].kind, e[0].subjectId, e[0].actorId, e[0].actorName, e[0].actorRole, e[0].at], [kind, draft.id, who.id, who.name, who.role, at])
        assert.equal(exported.timeline.filter(e => e.command_id === id).length, 1)
      }
    }
  })

  test('04 recorded sends and customer answers retain exact provenance and freeze accepted revisions', async t => {
    const clock = async at => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
    t.after(() => clock(null))
    const office = { id: b.office.id, name: 'Olu Office', role: 'office' }
    const dispatcher = { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }
    const owner = { id: (await h.state()).actor.id, name: 'Olivia Owner', role: 'owner' }
    const readQuote = async id => {
      const { followupState: _liveReminderSummary, ...record } = (await h.state()).quotes.find(q => q.id === id)
      return record
    }
    const facts = [], sentRecords = [], answers = []
    const initialMessages = (await h.state()).messages
    const providerCalls = [h.email.sent.length, h.twilio.calls.length]

    for (const [i, channel] of ['email', 'printed', 'in person', 'phone'].entries()) {
      const at = `2026-10-15T09:0${i}:00.000Z`, commandId = randomUUID()
      await clock(at)
      const payload = { quoteId: quote.id, version: quote.version, channel, note: `synthetic-glove-${i + 1}` }
      const sent = await b.office.run('quote.markSent', payload, { commandId })
      sentRecords.push({ revision: 2, channel, note: `synthetic-glove-${i + 1}`, recordedBy: office, at })
      assert.equal(sent.status, 'sent')
      assert.deepEqual(sent.sent, sentRecords, 'each recorded method keeps its own recorder and time')
      assert.deepEqual(await readQuote(quote.id), sent)
      facts.push({ quoteId: quote.id, commandId, kind: 'quote.sent', actor: office, at, data: sentRecords[i], summary: `${quote.number} revision 2 recorded as sent by ${channel} (by Olu Office; delivery is not confirmed)` })
      quote = sent
    }

    // A distinct native customer makes the retained answer and erasure checks independent of the booked work below.
    const customer = await h.command('customer.save', { name: 'synthetic-glove-5', contact: 'synthetic-glove-6' })
    const site = await h.command('site.save', { customerId: customer.id, address: '1400 Main St, Phoenix AZ 85001' })
    for (const [i, method] of ['phone', 'signed', 'email reply', 'in person'].entries()) {
      for (const decision of ['accept', 'decline']) {
        const primary = i === 0 && decision === 'accept'
        let current = primary ? quote : await b.dispatcher.run('quote.draft', { customerId: customer.id, siteId: site.id, title: `synthetic-glove-${i + 7}`, lines: [{ description: 'Inspection', quantity: '1', unitPrice: '100.00' }] })
        if (!primary) {
          current = await b.dispatcher.run('quote.revise', { quoteId: current.id, version: current.version, lines: [{ description: 'Revised inspection', quantity: '1', unitPrice: '125.00' }] })
          current = await b.dispatcher.run('quote.approve', { quoteId: current.id, version: current.version, revision: 2 })
        }
        const at = `2026-10-15T10:0${i}:${decision === 'accept' ? '00' : '30'}.000Z`
        await clock(at)
        const recorder = decision === 'accept' ? dispatcher : owner
        const run = decision === 'accept' ? b.dispatcher.run : h.command
        const payload = { quoteId: current.id, version: current.version, revision: 2, method, customerName: primary ? 'Dr Mei Lin' : `synthetic-glove-${i + 11}`, note: primary ? 'Approved by phone 9:12' : `synthetic-glove-${i + 15}` }
        const beforeEvents = (await h.state()).events.filter(e => e.subjectId === current.id)
        await run(`quote.${decision}`, { ...payload, revision: 1 }, { error: 'REVISION' })
        await b.office.run(`quote.${decision}`, payload, { error: 'FORBIDDEN' })
        await b.agent.run(`quote.${decision}`, payload, { error: 'FORBIDDEN' })
        assert.deepEqual(await readQuote(current.id), current, 'wrong revision and excluded roles change no quote fields')
        assert.deepEqual((await h.state()).events.filter(e => e.subjectId === current.id), beforeEvents)
        const commandId = randomUUID(), decided = await run(`quote.${decision}`, payload, { commandId })
        const expected = { revision: 2, method, customerName: payload.customerName, note: payload.note, recordedBy: recorder, at }
        const answer = decision === 'accept' ? decided.acceptance : decided.declined
        assert.deepEqual(Object.fromEntries(Object.keys(expected).map(key => [key, answer[key]])), expected)
        assert.equal(decided.status, decision === 'accept' ? 'accepted' : 'declined')
        assert.equal(decided.customerId, primary ? b.customer.id : customer.id)
        assert.deepEqual(decided.revisions, current.revisions, 'recording an answer cannot edit the approved revisions')
        assert.equal(decision === 'accept' ? decided.declined : decided.acceptance, null)
        if (primary) assert.equal(decided.acceptance.recordedBy.name, 'Sam Ortiz')
        facts.push({ quoteId: current.id, commandId, kind: `quote.${decision === 'accept' ? 'accepted' : 'declined'}`, actor: recorder, at, data: expected, summary: `${current.number} revision 2 ${decision === 'accept' ? 'accepted' : 'declined'} by ${payload.customerName} (${method}), recorded by ${recorder.name}` })
        answers.push({ quote: decided, run, payload, commandId, expected, decision })
        if (decision === 'accept') {
          for (const type of ['quote.accept', 'quote.decline']) {
            await h.command(type, { ...payload, version: decided.version, customerName: 'synthetic-glove-19', method: 'in person', note: 'Conflicting fresh answer' }, { error: 'QUOTE_STATE' })
            assert.deepEqual(await readQuote(current.id), decided, 'a fresh conflicting answer cannot replace the accepted revision')
          }
          await b.dispatcher.run('quote.revise', { quoteId: decided.id, version: decided.version, lines: [{ description: 'x', quantity: '1', unitPrice: '1' }] }, { error: 'QUOTE_CLOSED' })
          assert.deepEqual(await readQuote(current.id), decided, 'a refused price revision leaves the accepted record byte-for-byte unchanged')
        }
        if (primary) quote = decided
      }
    }

    await h.restart()
    await clock('2026-10-16T12:00:00.000Z')
    for (const item of answers) {
      assert.deepEqual(await readQuote(item.quote.id), item.quote, 'the full answer and approved revisions survive a real Worker restart')
      assert.deepEqual(await item.run(`quote.${item.decision}`, item.payload, { commandId: item.commandId }), item.quote, 'a lost answer replays the original recorder and time')
      assert.deepEqual(await readQuote(item.quote.id), item.quote, 'replay cannot make another decision or revise the quote')
    }
    assert.deepEqual((await readQuote(quote.id)).sent, sentRecords, 'all four send records survive restart')
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' })
    const accepted = answers[0]
    await accepted.run('quote.accept', accepted.payload, { commandId: accepted.commandId, error: 'FORBIDDEN' })
    assert.deepEqual(await readQuote(quote.id), quote, 'withdrawn authority cannot replay a decision')
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'dispatcher' })

    const activity = []
    let before = null
    do {
      const response = await h.request(`/api/glove/activity${before ? `?before=${before}` : ''}`)
      assert.equal(response.status, 200)
      const page = await response.json()
      activity.push(...page.events); before = page.next
    } while (before)
    const response = await h.request('/api/glove/export')
    assert.equal(response.status, 200)
    const exported = await response.json()
    for (const fact of facts) {
      const shown = activity.filter(e => e.commandId === fact.commandId && e.kind === fact.kind)
      assert.equal(shown.length, 1, 'Activity keeps exactly one fact per successful decision or recorded send')
      assert.deepEqual([shown[0].subjectId, shown[0].actorId, shown[0].actorName, shown[0].actorRole, shown[0].at, shown[0].summary], [fact.quoteId, fact.actor.id, fact.actor.name, fact.actor.role, fact.at, fact.summary])
      const kept = exported.timeline.filter(e => e.command_id === fact.commandId && e.kind === fact.kind)
      assert.equal(kept.length, 1, 'the business export retains each attributable fact exactly once')
      assert.deepEqual([kept[0].subject_id, kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].at, kept[0].summary], [fact.quoteId, fact.actor.id, fact.actor.name, fact.actor.role, fact.at, fact.summary])
      const data = JSON.parse(kept[0].data)
      assert.deepEqual(Object.fromEntries(Object.keys(fact.data).map(key => [key, data[key]])), fact.data)
    }
    for (const item of answers) assert.deepEqual(exported.quotes.find(q => q.id === item.quote.id), item.quote)
    for (const customerId of [b.customer.id, customer.id]) {
      const response = await h.request(`/api/glove/conversation?customerId=${customerId}`)
      assert.equal(response.status, 200)
      const { entries } = await response.json()
      if (customerId === b.customer.id) assert.deepEqual(entries.filter(e => e.kind === 'quote sent').map(e => [e.channel, e.recordedBy, e.at, e.delivery]), sentRecords.map(s => [s.channel, 'Olu Office', s.at, 'Not confirmed: sent outside Glove']))
      for (const item of answers.filter(a => a.quote.customerId === customerId)) {
        const entry = entries.find(e => e.id === `quote-answer:${item.quote.id}`)
        assert.ok(entry, 'the customer conversation shows the recorded answer')
        assert.deepEqual([entry.kind, entry.channel, entry.author, entry.recordedBy, entry.at, entry.text], [`quote ${item.decision === 'accept' ? 'accepted' : 'declined'}`, item.expected.method, item.expected.customerName, item.expected.recordedBy.name, item.expected.at, `${item.quote.number} revision 2 ${item.decision === 'accept' ? 'accepted' : 'declined'}: ${item.expected.note}`])
      }
    }
    assert.deepEqual((await h.state()).messages, initialMessages)
    assert.deepEqual([h.email.sent.length, h.twilio.calls.length], providerCalls, 'recorded sends and answers never send a customer message')

    const erasure = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await h.command('privacy.erase', { customerId: customer.id, version: customer.version, fingerprint: erasure.fingerprint, confirm: 'ERASE' })
    for (const item of answers.filter(a => a.quote.customerId === customer.id)) await item.run(`quote.${item.decision}`, item.payload, { commandId: item.commandId, error: 'ERASED' })
    const afterErasure = await h.request('/api/glove/export').then(r => r.json())
    for (const item of answers.filter(a => a.quote.customerId === customer.id)) assert.equal(JSON.stringify(afterErasure).includes(item.expected.customerName), false, 'erased personal answers cannot return through replay or export')
    assert.deepEqual(await readQuote(quote.id), quote, 'erasure leaves another customer’s accepted work unchanged')
  })

  test('05 the accepted quote becomes a job and a visit booked for a technician in the business timezone', async () => {
    job = await b.dispatcher.run('job.create', { quoteId: quote.id })
    assert.deepEqual(job.checklist.map(i => [i.label, i.required]), [['Isolate power', true], ['Clean filters', true], ['Check refrigerant pressure', true], ['Test run 10 minutes', false]])
    assert.equal(job.totals.total, '271.15')
    await b.dispatcher.run('job.create', { quoteId: quote.id }, { error: 'DUPLICATE' })
    visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-15', start: '09:00', end: '10:30' })
    assert.equal(visit.startAt, '2026-10-14T22:00:00.000Z', '09:00 in Sydney (AEDT) is 22:00 UTC the day before')
    const other = await acceptedQuote(h, b, 'Second surgery')
    const otherJob = await b.dispatcher.run('job.create', { quoteId: other.id })
    const clash = await b.dispatcher.run('visit.book', { jobId: otherJob.id, technicianId: b.priya.id, date: '2026-10-15', start: '10:00', end: '11:00' }, { error: 'CONFLICT_REVIEW' })
    assert.equal(clash.details.conflicts[0].code, `overlap:${visit.id}`)
    const reviewed = await b.dispatcher.run('visit.book', { jobId: otherJob.id, technicianId: b.priya.id, date: '2026-10-15', start: '10:00', end: '11:00', acknowledge: [`overlap:${visit.id}`] })
    assert.equal(reviewed.assignments[0].reviewedConflicts.length, 1)
    await b.dispatcher.run('visit.book', { jobId: otherJob.id, technicianId: b.tom.id, date: '2026-10-04', start: '02:30', end: '03:00' }, { error: 'TIME' })
  })

  test('06 the technician captures arrival, checklist answers, notes, photos and materials through a connectivity interruption', async () => {
    const mine = await b.priyaPerson.state()
    assert.equal(mine.visits.length, 2, 'Priya sees only the visits assigned to her')
    assert.equal(mine.quotes.length, 0)
    assert.equal(mine.jobs[0].totals, undefined, 'prices stay on the desk')
    const tomView = await b.tomPerson.state()
    assert.equal(tomView.visits.length, 0)
    await b.tomPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-14T22:02:00Z' }, { error: 'FORBIDDEN' })
    // The phone queued these offline; the first send lost its response, so it resends the same identities.
    const queued = [
      ['visit.arrive', { visitId: visit.id, deviceTime: '2026-10-14T22:04:00Z' }],
      ['visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T22:09:00Z', kind: 'checklist', itemId: job.checklist[3].id, result: 'not applicable', note: 'No test run: isolator locked for the follow-up visit' }],
      ['visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T22:10:00Z', kind: 'checklist', itemId: job.checklist[0].id, result: 'done' }],
      ['visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T22:20:00Z', kind: 'photo', caption: 'Indoor unit before clean', photo: { mediaType: 'image/jpeg', base64: jpeg } }],
      ['visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T22:25:00Z', kind: 'material', serviceId: b.refrigerant.id, quantity: '0.5' }],
      ['visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T22:30:00Z', kind: 'note', text: 'Filters heavily clogged; recommend 6-monthly service' }],
    ].map(([type, payload]) => ({ type, payload, commandId: randomUUID() }))
    const receivedFrom = Date.now(), first = []
    for (const item of queued) first.push(await b.priyaPerson.run(item.type, item.payload, { commandId: item.commandId }))
    for (const [i, item] of queued.entries()) assert.deepEqual(await b.priyaPerson.run(item.type, item.payload, { commandId: item.commandId }), first[i], 'a resend returns the recorded outcome')
    const receivedThrough = Date.now()
    const captures = state => state.captures.filter(x => x.visitId === visit.id).sort((a, z) => a.deviceTime.localeCompare(z.deviceTime))
    const s = await h.state(), retained = captures(s)
    assert.equal(retained.length, 6, 'arrival and every other capture land once')
    assert.deepEqual(retained.map(x => [x.kind, x.deviceTime]), [
      ['arrival', '2026-10-14T22:04:00.000Z'],
      ['checklist', '2026-10-14T22:09:00.000Z'],
      ['checklist', '2026-10-14T22:10:00.000Z'],
      ['photo', '2026-10-14T22:20:00.000Z'],
      ['material', '2026-10-14T22:25:00.000Z'],
      ['note', '2026-10-14T22:30:00.000Z'],
    ])
    assert.deepEqual(retained.filter(x => x.kind === 'checklist').map(x => [x.itemId, x.label, x.result, x.note]), [
      [job.checklist[3].id, 'Test run 10 minutes', 'not applicable', 'No test run: isolator locked for the follow-up visit'],
      [job.checklist[0].id, 'Isolate power', 'done', ''],
    ])
    const material = retained.find(x => x.kind === 'material')
    assert.deepEqual([material.serviceId, material.description, material.quantity, material.unit], [b.refrigerant.id, 'R32 refrigerant', '0.5', 'kg'])
    assert.equal(retained.find(x => x.kind === 'note').text, 'Filters heavily clogged; recommend 6-monthly service')
    const photo = retained.find(x => x.kind === 'photo')
    assert.equal(photo.caption, 'Indoor unit before clean')
    for (const capture of retained) {
      assert.deepEqual([capture.jobId, capture.visitId, capture.technicianId, capture.late], [job.id, visit.id, b.priya.id, false])
      assert.ok(Date.parse(capture.receivedAt) >= receivedFrom && Date.parse(capture.receivedAt) <= receivedThrough, 'receipt time belongs to the server send interval')
      assert.notEqual(capture.receivedAt, capture.deviceTime, 'receipt never replaces the original phone time')
    }
    const arrival = s.visits.find(x => x.id === visit.id).arrival
    assert.deepEqual(arrival, { technicianId: b.priya.id, captureId: retained[0].id, deviceTime: '2026-10-14T22:04:00.000Z', receivedAt: retained[0].receivedAt })
    await h.restart()
    assert.deepEqual(captures(await b.priyaPerson.state()), retained, 'all exact field records survive a Worker restart with the same D1')
    assert.deepEqual((await h.state()).visits.find(x => x.id === visit.id).arrival, arrival)
    for (const [i, item] of queued.entries()) assert.deepEqual(await b.priyaPerson.run(item.type, item.payload, { commandId: item.commandId }), first[i], 'replay after restart returns the original receipt')
    assert.deepEqual(captures(await h.state()), retained, 'replay after restart neither adds nor rewrites evidence')
    const bytes = await h.request(`/api/glove/files/${photo.file.fileId}`, { as: b.priyaPerson.cookie })
    assert.equal(bytes.status, 200)
    assert.equal(Buffer.from(await bytes.arrayBuffer()).toString('base64'), jpeg)
    assert.equal((await h.request(`/api/glove/files/${photo.file.fileId}`, { as: b.tomPerson.cookie })).status, 404, 'another technician cannot read it')
    assert.equal((await h.request(`/api/glove/files/${photo.file.fileId}`, { as: '' })).status, 401, 'signed-out readers cannot read it')
    const { activity, exported } = await assertTrail(h, ['capture.arrival', 'capture.checklist', 'capture.note', 'capture.photo', 'capture.material'])
    assert.deepEqual(captures(exported), retained, 'business export keeps every capture value and both clocks')
    for (const capture of retained) {
      const events = activity.filter(e => e.commandId === capture.id)
      assert.equal(events.length, 1)
      assert.deepEqual([events[0].kind, events[0].actorId, events[0].actorName, events[0].actorRole, events[0].subjectId, events[0].at], [`capture.${capture.kind}`, b.priyaPerson.id, 'Priya Nair', 'technician', capture.id, capture.receivedAt])
      assert.equal(exported.timeline.filter(e => e.command_id === capture.id).length, 1)
    }
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T22:31:00Z', kind: 'photo', photo: { mediaType: 'image/jpeg', base64: png } }, { error: 'FILE' })
  })

  test('07 a dispatch change needs conflict review and keeps late evidence for review', async t => {
    let s = await h.state(), current = s.visits.find(v => v.id === visit.id)
    await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, technicianId: b.tom.id, reason: 'Priya called in sick' }, { error: 'STALE' })
    const review = await b.dispatcher.run('visit.change', { visitId: visit.id, version: current.version, technicianId: b.tom.id, start: '10:30', end: '12:00', reason: 'Priya called in sick' }, { error: 'CONFLICT_REVIEW' })
    assert.deepEqual(review.details.conflicts.map(x => x.code), ['evidence'])
    assert.match(review.details.conflicts[0].message, /arrival and 5 field items/)
    const moved = await b.dispatcher.run('visit.change', { visitId: visit.id, version: current.version, technicianId: b.tom.id, start: '10:30', end: '12:00', reason: 'Priya called in sick', acknowledge: ['evidence'] })
    assert.equal(moved.technicianId, b.tom.id)
    assert.equal(moved.assignments.length, 2)
    // Priya's phone was offline during the change; her queued note arrives afterwards.
    const lateCapture = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T22:40:00Z', kind: 'note', text: 'Left drain line cleaning for next tech' })
    s = await h.state()
    current = s.visits.find(v => v.id === visit.id)
    assert.equal(current.lateEvidence.length, 1)
    assert.equal(current.lateEvidence[0].reviewed, null)
    assert.ok((await b.tomPerson.state()).visits.some(v => v.id === visit.id), 'Tom now sees the visit')
    const cleared = await b.dispatcher.run('visit.reviewLateEvidence', { visitId: visit.id, version: current.version, note: 'Passed to Tom' })
    assert.equal(cleared.lateEvidence[0].reviewed.by.name, 'Sam Ortiz')
    assert.deepEqual([lateCapture.visitId, lateCapture.jobId, lateCapture.technicianId, lateCapture.kind, lateCapture.deviceTime, lateCapture.text, lateCapture.late], [visit.id, job.id, b.priya.id, 'note', '2026-10-14T22:40:00.000Z', 'Left drain line cleaning for next tech', true])
    assert.equal(cleared.arrival, null, 'the new assignee must record a separate arrival')
    assert.deepEqual([cleared.lateEvidence[0].captureId, cleared.lateEvidence[0].technicianId, cleared.lateEvidence[0].receivedAt, cleared.lateEvidence[0].reviewed.note], [lateCapture.id, b.priya.id, lateCapture.receivedAt, 'Passed to Tom'])
    const oldArrival = s.captures.find(c => c.visitId === visit.id && c.kind === 'arrival')
    assert.deepEqual([oldArrival.technicianId, oldArrival.deviceTime, oldArrival.late], [b.priya.id, '2026-10-14T22:04:00.000Z', false])
    await h.restart()
    const restored = await h.state()
    assert.deepEqual(restored.visits.find(v => v.id === visit.id), cleared)
    assert.deepEqual(restored.captures.find(c => c.id === oldArrival.id), oldArrival)
    assert.deepEqual(restored.captures.find(c => c.id === lateCapture.id), lateCapture)
    assert.deepEqual(await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T22:40:00Z', kind: 'note', text: 'Left drain line cleaning for next tech' }, { commandId: lateCapture.id }), lateCapture)
    assert.equal((await h.state()).captures.filter(c => c.id === lateCapture.id).length, 1)
    visit = cleared
    const clock = async at => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
    t.after(() => clock(null))
    await clock('2026-10-15T20:00:00.000Z')
    const nativeJob = title => b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title, lines: [] })
    const movingJob = await nativeJob('Move history proof')
    const original = await b.dispatcher.run('visit.book', { jobId: movingJob.id, technicianId: b.priya.id, date: '2026-10-16', start: '09:00', end: '10:00', reason: 'Original customer window' })
    const firstJob = await nativeJob('First independently booked overlap')
    const firstOverlap = await b.dispatcher.run('visit.book', { jobId: firstJob.id, technicianId: b.tom.id, date: '2026-10-17', start: '11:00', end: '11:30' })
    const change = { visitId: original.id, version: original.version, technicianId: b.tom.id, date: '2026-10-17', start: '10:30', end: '12:00', reason: 'Customer requested a later day and another technician' }
    const data = s => ({ visits: s.visits, captures: s.captures, events: s.events })
    let unchanged = data(await h.state())
    const inspected = await b.dispatcher.run('visit.change', change, { error: 'CONFLICT_REVIEW' })
    assert.deepEqual(inspected.details.conflicts.map(c => c.code), [`overlap:${firstOverlap.id}`])
    assert.deepEqual(data(await h.state()), unchanged, 'unreviewed overlapping work changes no visit, capture or Activity event')
    const secondJob = await nativeJob('Overlap added after inspection')
    const secondOverlap = await b.dispatcher.run('visit.book', { jobId: secondJob.id, technicianId: b.tom.id, date: '2026-10-17', start: '11:45', end: '12:15' })
    unchanged = data(await h.state())
    const incomplete = await b.dispatcher.run('visit.change', { ...change, acknowledge: [`overlap:${firstOverlap.id}`] }, { error: 'CONFLICT_REVIEW' })
    assert.deepEqual(incomplete.details.conflicts.map(c => c.code).sort(), [`overlap:${firstOverlap.id}`, `overlap:${secondOverlap.id}`].sort())
    assert.deepEqual(data(await h.state()), unchanged, 'an earlier inspection cannot authorize a newly added overlap')
    await clock('2026-10-15T20:05:00.000Z')
    const moveId = randomUUID(), acknowledgment = [`overlap:${firstOverlap.id}`, `overlap:${secondOverlap.id}`]
    const changed = await b.dispatcher.run('visit.change', { ...change, acknowledge: acknowledgment }, { commandId: moveId })
    const beforeSlot = { technicianId: b.priya.id, startAt: '2026-10-15T22:00:00.000Z', endAt: '2026-10-15T23:00:00.000Z', local: { date: '2026-10-16', start: '09:00', end: '10:00', timezone: 'Australia/Sydney' } }
    const afterSlot = { technicianId: b.tom.id, startAt: '2026-10-16T23:30:00.000Z', endAt: '2026-10-17T01:00:00.000Z', local: { date: '2026-10-17', start: '10:30', end: '12:00', timezone: 'Australia/Sydney' } }
    const dispatcher = { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }
    assert.deepEqual([changed.technicianId, changed.startAt, changed.endAt, changed.local], [b.tom.id, afterSlot.startAt, afterSlot.endAt, afterSlot.local])
    assert.deepEqual(changed.assignments, [
      { ...beforeSlot, by: dispatcher, at: '2026-10-15T20:00:00.000Z', reason: 'Original customer window', reviewedConflicts: [], proposalId: null, grantId: null },
      { ...afterSlot, by: dispatcher, at: '2026-10-15T20:05:00.000Z', reason: change.reason, reviewedConflicts: incomplete.details.conflicts, grantId: null },
    ])
    unchanged = data(await h.state())
    await b.dispatcher.run('visit.change', change, { error: 'STALE' })
    assert.deepEqual(data(await h.state()), unchanged, 'a stale move leaves the newer assignment and full history unchanged')
    await b.office.run('visit.change', { ...change, version: changed.version }, { error: 'FORBIDDEN' })
    assert.deepEqual(data(await h.state()), unchanged)
    const arrival = await b.tomPerson.run('visit.arrive', { visitId: original.id, deviceTime: '2026-10-16T23:31:12.123Z' })
    const arrivedVisit = (await h.state()).visits.find(v => v.id === original.id)
    unchanged = data(await h.state())
    const evidence = await b.dispatcher.run('visit.change', { visitId: original.id, version: arrivedVisit.version, date: '2026-10-18', reason: 'Proposed move after arrival' }, { error: 'CONFLICT_REVIEW' })
    assert.deepEqual(evidence.details.conflicts.map(c => c.code), ['evidence'])
    assert.deepEqual(data(await h.state()), unchanged, 'existing arrival requires fresh evidence review and cannot be silently moved')
    await h.restart()
    assert.deepEqual(data(await h.state()), unchanged, 'all assignments, refusals and original arrival survive a real Worker restart')
    const reloaded = (await h.state()).visits.find(v => v.id === original.id)
    assert.deepEqual(reloaded.assignments, changed.assignments)
    assert.deepEqual(reloaded.arrival, { technicianId: b.tom.id, captureId: arrival.id, deviceTime: '2026-10-16T23:31:12.123Z', receivedAt: '2026-10-15T20:05:00.000Z' })
    assert.deepEqual(await b.dispatcher.run('visit.change', { ...change, acknowledge: acknowledgment }, { commandId: moveId }), changed)
    assert.deepEqual(data(await h.state()), unchanged, 'replay cannot append another assignment or erase later arrival')
    const { activity, exported } = await assertTrail(h, ['visit.booked', 'visit.changed', 'visit.lateEvidenceReviewed'])
    assert.deepEqual(exported.visits.find(v => v.id === original.id), reloaded)
    const movedEvents = activity.filter(e => e.commandId === moveId)
    assert.equal(movedEvents.length, 1)
    assert.deepEqual([movedEvents[0].kind, movedEvents[0].actorId, movedEvents[0].actorName, movedEvents[0].actorRole, movedEvents[0].at], ['visit.changed', b.dispatcher.id, 'Sam Ortiz', 'dispatcher', '2026-10-15T20:05:00.000Z'])
    for (const conflict of incomplete.details.conflicts) assert.ok(movedEvents[0].summary.includes(conflict.message), 'Activity names every conflict the dispatcher confirmed')
    assert.ok(movedEvents[0].summary.includes(change.reason))
    const { before: from, after: to, reviewedConflicts } = JSON.parse(exported.timeline.find(e => e.command_id === moveId).data)
    assert.deepEqual({ before: from, after: to, reviewedConflicts }, { before: { technicianId: b.priya.id, ...beforeSlot.local }, after: { technicianId: b.tom.id, ...afterSlot.local }, reviewedConflicts: incomplete.details.conflicts })
    assert.equal(exported.timeline.filter(e => e.command_id === moveId).length, 1)
  })

  test('08 completion needs arrival, the required checklist and the customer sign-off or why it is missing', async () => {
    await b.tomPerson.run('visit.complete', { visitId: visit.id, deviceTime: '2026-10-15T00:30:00Z', summary: 'Serviced', signoff: { customerName: 'Dr Mei Lin', signature: { mediaType: 'image/png', base64: png } } }, { error: 'NO_ARRIVAL' })
    await b.tomPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-14T23:31:00Z' })
    await b.tomPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-14T23:32:00Z' }, { error: 'ARRIVED' })
    const s = await h.state()
    assert.equal(s.visits.find(v => v.id === visit.id).arrival.technicianId, b.tom.id)
    assert.deepEqual(s.captures.filter(x => x.visitId === visit.id && x.kind === 'arrival').map(x => x.technicianId), [b.priya.id, b.tom.id], 'each arrival stays as evidence of who arrived when')
    const open = await b.tomPerson.run('visit.complete', { visitId: visit.id, deviceTime: '2026-10-15T00:30:00Z', summary: 'Serviced', signoff: { customerName: 'Dr Mei Lin', signature: { mediaType: 'image/png', base64: png } } }, { error: 'CHECKLIST' })
    assert.deepEqual(open.details.open, ['Clean filters', 'Check refrigerant pressure'])
    await b.tomPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T23:40:00Z', kind: 'checklist', itemId: job.checklist[1].id, result: 'done' })
    await b.tomPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T23:45:00Z', kind: 'checklist', itemId: job.checklist[2].id, result: 'not applicable' }, { error: 'INPUT' })
    await b.tomPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-14T23:45:00Z', kind: 'checklist', itemId: job.checklist[2].id, result: 'not applicable', note: 'Gauges at the van; pressures checked at commissioning last month' })
    const done = await b.tomPerson.run('visit.complete', { visitId: visit.id, deviceTime: '2026-10-15T00:30:00Z', summary: 'Cleaned filters and coil; unit cooling to 12°C', signoff: { customerName: 'Dr Mei Lin', signature: { mediaType: 'image/png', base64: png } } })
    assert.equal(done.status, 'completed')
    assert.equal(done.completion.signoff.customerName, 'Dr Mei Lin')
    const signature = await h.request(`/api/glove/files/${done.completion.signoff.signature.fileId}`)
    assert.equal(signature.headers.get('content-type'), 'image/png')
    assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'completed')
  })

  test('09 office prepares the invoice, approves it, exports it once and corrects it with a trail', async () => {
    let inv = await b.office.run('invoice.prepare', { jobId: job.id })
    assert.deepEqual(inv.revisions[0].lines.map(l => [l.description, l.total]), [['Split system service', '199.00'], ['R32 refrigerant', '47.50'], ['R32 refrigerant (used on site)', '47.50']])
    assert.deepEqual(inv.revisions[0].totals, { subtotal: '294.00', gst: '29.40', total: '323.40' })
    await b.office.run('invoice.prepare', { jobId: job.id }, { error: 'DUPLICATE' })
    await b.office.run('invoice.export', {}, { error: 'NOTHING_TO_EXPORT' })
    inv = await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
    const exported = await b.office.run('invoice.export', {})
    assert.deepEqual(exported.invoices.map(i => [i.invoiceNumber, i.total]), [['INV-0001', '323.40']])
    await b.office.run('invoice.export', {}, { error: 'NOTHING_TO_EXPORT' })
    const csv = await (await h.request(`/api/glove/exports/${exported.id}.csv`, { as: b.office.cookie })).text()
    const rows = csv.trim().split('\r\n')
    assert.equal(rows.length, 4)
    assert.match(rows[1], /^Harbourview Dental Group,accounts@harbourview\.example,.*,INV-0001,J-1001,\d\d\/\d\d\/2026,\d\d\/\d\d\/2026,Split system service,1,199\.00,200,GST on Income,AUD$/)
    assert.equal((await h.request(`/api/glove/exports/${exported.id}.csv`, { as: b.priyaPerson.cookie })).status, 403)
    inv = (await h.state()).invoices.find(i => i.id === inv.id)
    await b.office.run('invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'x', lines: [{ description: 'x', quantity: '1', unitPrice: '1' }] }, { error: 'INVOICE_STATE' })
    inv = await b.office.run('invoice.correct', { invoiceId: inv.id, version: inv.version, reason: 'Refrigerant charged twice', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '199.00' }, { description: 'R32 refrigerant (used on site)', quantity: '0.5', unitPrice: '95.00' }] })
    assert.deepEqual(inv.revisions[1].corrects, { revision: 1, exportNumber: 'EXP-0001', total: '323.40' })
    inv = await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 2 })
    const second = await b.office.run('invoice.export', {})
    assert.deepEqual(second.invoices.map(i => [i.invoiceNumber, i.total]), [['INV-0001-R2', '271.15']])
    const s = await h.state()
    assert.equal(s.exports.length, 2)
    assert.equal(s.exports[0].csv, undefined, 'CSV bytes are served by their own door')
    assert.equal(s.invoices[0].revisions[0].export.number, 'EXP-0001', 'the exported revision is unchanged')
  })

  test('10 an agent prepares quotes, dispatch and invoices; a person approves each and the approval is recorded', async () => {
    const draft = await b.agent.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Agent-prepared service', lines: [{ description: 'Split system service', quantity: '2', unitPrice: '189.00' }] })
    assert.equal(draft.revisions[0].preparedBy.role, 'agent')
    await b.agent.run('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 }, { error: 'FORBIDDEN' })
    await b.agent.run('quote.accept', { quoteId: draft.id, version: draft.version, revision: 1, method: 'phone', customerName: 'x' }, { error: 'FORBIDDEN' })
    const approved = await b.dispatcher.run('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
    const accepted = await b.dispatcher.run('quote.accept', { quoteId: draft.id, version: approved.version, revision: 1, method: 'signed', customerName: 'Dr Mei Lin' })
    const agentJob = await b.dispatcher.run('job.create', { quoteId: accepted.id })
    await b.agent.run('visit.book', { jobId: agentJob.id, technicianId: b.tom.id, date: '2026-10-16', start: '14:00', end: '15:30' }, { error: 'FORBIDDEN' })
    const proposal = await b.agent.run('proposal.prepare', { kind: 'dispatch', plan: { jobId: agentJob.id, technicianId: b.tom.id, date: '2026-10-16', start: '14:00', end: '15:30' }, rationale: 'Tom is free Friday afternoon and closest to Balmain', evidence: ['Tom has no visits 16 Oct after 12:00'] })
    await b.agent.run('proposal.approve', { proposalId: proposal.id, version: proposal.version }, { error: 'FORBIDDEN' })
    const decided = await b.dispatcher.run('proposal.approve', { proposalId: proposal.id, version: proposal.version })
    assert.equal(decided.status, 'approved')
    const s = await h.state()
    const booked = s.visits.find(v => v.id === decided.visitId)
    assert.equal(booked.assignments[0].proposalId, proposal.id)
    assert.deepEqual(s.approvals.filter(a => a.preparedBy.role === 'agent').map(a => [a.subjectKind, a.approvedBy.name, a.decision]), [['quote', 'Sam Ortiz', 'approved'], ['proposal', 'Sam Ortiz', 'approved']])
    const second = await b.agent.run('proposal.prepare', { kind: 'dispatch', plan: { jobId: agentJob.id, technicianId: b.tom.id, date: '2026-10-17', start: '08:00', end: '09:00' }, rationale: 'Follow-up' })
    const declined = await b.dispatcher.run('proposal.decline', { proposalId: second.id, version: second.version, reason: 'Customer closed on Saturday' })
    assert.equal(declined.status, 'declined')
  })

  test('11 owner moves in from ServiceM8 with a dry run, a journaled commit and undo', async () => {
    const files = await moveInFiles()
    const before = await h.state()
    const staged = await h.command('import.stage', { label: 'ServiceM8 export 14 Oct', files })
    assert.equal(staged.status, 'previewed')
    assert.deepEqual(staged.preview.byKind.job, { input: 4, mapped: 3, merged: 0, rejected: 1 })
    assert.match(staged.preview.rejections[0].reason, /not in company\.json/)
    assert.deepEqual(staged.preview.missingAttachments.map(a => a.name), ['Customer signoff.pdf'])
    assert.ok(staged.preview.unmappedFields.company.includes('website'))
    assert.equal((await h.state()).customers.length, before.customers.length, 'the dry run writes no business records')
    await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: 'not-what-was-reviewed' }, { error: 'IMPORT_REVIEW' })
    await b.dispatcher.run('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint }, { error: 'FORBIDDEN' })
    const committed = await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
    assert.equal(committed.status, 'committed')
    let s = await h.state()
    const imported = s.jobs.find(j => j.source?.id === '3e4f5a6b-aaaa-4c7d-8e9f-0a1b2c3d4e01')
    assert.equal(imported.number, 'SM8-1012')
    assert.equal(imported.status, 'invoiced')
    assert.equal(imported.totals.total, '201.85')
    assert.equal(s.sites.filter(x => x.customerId === 'sm8-6b1f3a52-1c2e-4d8a-9a5e-0d3c2b7f0a11').length, 1, 'two jobs at one address share a site')
    assert.equal(s.visits.find(v => v.id === 'sm8-5a6b7c8d-0002-4e9f-8a0b-1c2d3e4f5a02').local.start, '09:00')
    assert.equal(s.quotes.find(q => q.number === 'SM8-1034').status, 'draft')
    assert.equal(s.customers.find(c => c.name === 'Former Tenant Pty Ltd').archived, true)
    assert.deepEqual(s.captures.filter(x => x.kind === 'attachment').map(x => x.bytes.status).sort(), ['missing', 'retained'])
    const journal = await h.db.prepare("SELECT COUNT(*) AS n FROM ik_originals WHERE kind='artifact'").first()
    assert.equal(journal.n, 8, 'every received file is retained exactly')
    const undone = await h.command('import.undo', { batchId: staged.id, version: committed.version, reason: 'Wrong export date range' })
    assert.equal(undone.status, 'undone')
    s = await h.state()
    assert.equal(s.customers.length, before.customers.length)
    assert.equal(s.jobs.length, before.jobs.length)
    assert.ok(s.events.some(e => e.kind === 'import.committed') && s.events.some(e => e.kind === 'import.undone'), 'the timeline keeps both')
  })

  test('12 the job timeline names every step and person, and the business export carries it', async () => {
    const s = await h.state()
    const timeline = s.events.filter(e => e.jobId === job.id).reverse().map(e => e.kind)
    for (const kind of ['job.created', 'visit.booked', 'capture.arrival', 'capture.photo', 'visit.changed', 'visit.lateEvidenceReviewed', 'capture.completion', 'job.completed', 'invoice.prepared', 'invoice.exported', 'invoice.corrected']) assert.ok(timeline.includes(kind), `timeline has ${kind}`)
    assert.ok(s.events.filter(e => e.jobId === job.id).every(e => e.actorName && e.commandId))
    const exported = await (await h.request('/api/glove/export', { as: b.office.cookie })).json()
    assert.equal(exported.format, 'glove-business-v1')
    assert.equal(exported.timeline.length, (await h.db.prepare('SELECT COUNT(*) AS n FROM glove_events').first()).n)
    assert.equal(exported.files.length, 2)
    assert.equal((await h.request('/api/glove/export', { as: b.priyaPerson.cookie })).status, 403)
    const tech = await b.priyaPerson.state()
    assert.ok(tech.events.every(e => e.jobId), 'a technician sees only their jobs\' timeline')
  })
})


test('PAY-001, PAY-010, PAY-011, PAY-012, PAY-013, PAY-014, PAY-015, PAY-016 selected completed jobs prepare independent invoice drafts with replay, refusals and branch isolation', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h)
  const jobs = []
  for (const date of ['2026-10-21', '2026-10-22', '2026-10-23']) jobs.push(await completedJob(h, b, date))
  const unpriced = await completedJob(h, b, '2026-10-24')
  await b.priyaPerson.run('visit.capture', { visitId: unpriced.visit.id, kind: 'material', description: 'Uncatalogued valve', quantity: '1', deviceTime: '2026-10-24T23:01:00Z' })
  const expense = await b.office.run('expense.record', { jobId: jobs[0].job.id, category: 'permit', vendor: 'City', description: 'Permit', amount: '10.00', billable: true, markupPercent: '20', tax: 'GST' })
  const open = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Not completed')).id })
  const missing = randomUUID()
  const jobIds = [jobs[0].job.id, unpriced.job.id, jobs[1].job.id, open.id, missing, jobs[2].job.id]
  for (const person of [b.dispatcher, b.priyaPerson]) await person.run('invoice.prepareBatch', { jobIds }, { error: 'FORBIDDEN' })
  for (const ids of [[], [jobs[0].job.id, jobs[0].job.id], Array.from({ length: 51 }, () => randomUUID()), ['']]) await b.office.run('invoice.prepareBatch', { jobIds: ids }, { error: 'INPUT' })
  const commandId = randomUUID()
  const batch = await b.office.run('invoice.prepareBatch', { jobIds }, { commandId })
  assert.deepEqual(batch.results.map(r => [r.jobId, r.ok, r.error?.code]), jobIds.map((id, n) => [id, [0, 2, 5].includes(n), ({ 1: 'UNPRICED_MATERIALS', 3: 'JOB_STATE', 4: 'NOT_FOUND' })[n]]))
  const invoices = batch.results.filter(r => r.ok).map(r => r.invoice)
  assert.equal(new Set(invoices.map(i => i.id)).size, 3)
  assert.deepEqual(invoices.map(i => [i.status, i.revisions[0].totals.total, i.revisions[0].approval]), [['draft', '221.10', null], ['draft', '207.90', null], ['draft', '207.90', null]])
  assert.equal((await h.state()).expenses.find(e => e.id === expense.id).invoiceId, invoices[0].id)
  assert.deepEqual(await b.office.run('invoice.prepareBatch', { jobIds }, { commandId }), batch)
  const again = await b.office.run('invoice.prepareBatch', { jobIds: jobs.map(j => j.job.id) })
  assert.deepEqual(again.results.map(r => r.error.code), ['DUPLICATE', 'DUPLICATE', 'DUPLICATE'])
  assert.equal((await h.state()).invoices.length, 3)
  const { exported } = await assertTrail(h, ['invoice.prepared', 'invoice.batchPrepared'])
  assert.deepEqual(exported.invoices.map(i => i.id).sort(), invoices.map(i => i.id).sort())
  assert.ok(exported.timeline.some(e => e.kind === 'invoice.batchPrepared' && JSON.parse(e.data).prepared === 3))
  // Existing single preparation and its exact approval boundary stay intact.
  const single = await b.office.run('invoice.prepare', { jobId: unpriced.job.id, lines: [{ description: 'Reviewed repair', quantity: '1', unitPrice: '50.00', tax: 'GST' }] })
  assert.equal(single.revisions[0].totals.total, '55.00')
  const role = await h.command('role.save', { name: 'Invoice preparer', permissions: ['invoice.prepare'] })
  await h.command('role.set', { operatorId: b.office.id, role: `custom:${role.id}` })
  assert.ok((await b.office.state()).actor.commands.includes('invoice.prepareBatch'))
  assert.equal((await b.office.run('invoice.prepareBatch', { jobIds: [jobs[0].job.id] })).results[0].error.code, 'DUPLICATE')
  const branch = await h.command('branch.save', { name: 'Other branch', prefix: 'OTHER', timezone: 'America/Phoenix', zips: ['85001'] })
  await h.command('branch.limit', { operatorId: b.office.id, branchId: branch.id })
  await b.office.run('invoice.prepareBatch', { jobIds }, { commandId, error: 'NOT_FOUND' })
  const hidden = await b.office.run('invoice.prepareBatch', { jobIds: [jobs[0].job.id, missing] })
  assert.deepEqual(hidden.results.map(r => r.error.code), ['NOT_FOUND', 'NOT_FOUND'])
  assert.ok(!JSON.stringify(hidden).includes(invoices[0].number))
  assert.equal((await h.state()).invoices.length, 4)
})

test('PAY-001, PAY-010, PAY-011, PAY-012, PAY-013, PAY-014, PAY-015, PAY-016 named progress drafts preserve the contract cap, exact final remainder, tax, approval and correction trail', async t => {
  const h = await installation({ at: '2026-10-20T12:00:00Z' }); t.after(() => h.close())
  const b = await business(h, { currency: 'USD', timezone: 'UTC', taxSettings: { jurisdictions: [{ id: 'city', name: 'City tax', rate: '8.25', zips: [] }], defaultJurisdictionId: 'city' } })
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Long installation')).id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-20', start: '09:00', end: '10:00' })
  const line = amount => [{ description: 'Installation stage', quantity: '1', unitPrice: amount, serviceId: b.service.id }]
  const firstPayload = { jobId: job.id, progress: { name: 'Rough in', final: false }, lines: line('60.00') }, commandId = randomUUID()
  await b.dispatcher.run('invoice.prepare', firstPayload, { error: 'FORBIDDEN' })
  await b.office.run('invoice.prepare', { ...firstPayload, lines: line('200.00') }, { error: 'PROGRESS_AMOUNT' })
  let first = await b.office.run('invoice.prepare', firstPayload, { commandId })
  assert.equal(first.revisions[0].totals.total, '64.95')
  assert.equal(first.revisions[0].approval, null)
  assert.deepEqual(await b.office.run('invoice.prepare', firstPayload, { commandId }), first)
  await b.office.run('invoice.prepare', { ...firstPayload, progress: { name: 'Second stage', final: false } }, { error: 'PROGRESS_APPROVAL' })
  await h.command('customer.save', { ...b.customer, requirePo: true })
  await b.office.run('invoice.approve', { invoiceId: first.id, version: first.version, revision: 1 }, { error: 'PO_REQUIRED' })
  first = await b.office.run('invoice.approve', { invoiceId: first.id, version: first.version, revision: 1, poNumber: 'PO-LONG-1' })
  const firstDates = structuredClone(first.dates)
  await h.command('business.save', { ...(await h.state()).business[0], paymentTermsDays: 30 })
  await b.office.run('invoice.prepare', { ...firstPayload, progress: { name: 'ROUGH IN', final: false } }, { error: 'DUPLICATE' })
  await b.office.run('invoice.export', {})
  assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'open')
  await b.office.run('invoice.prepare', { jobId: job.id, progress: { name: 'Final', final: true }, lines: line('129.00') }, { error: 'JOB_STATE' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-20T09:00:00Z' })
  for (const item of job.checklist.filter(i => i.required)) await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T09:10:00Z', kind: 'checklist', itemId: item.id, result: 'done' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: '2026-10-20T10:00:00Z', summary: 'Installation completed', signoff: { absentReason: 'Customer out' } })
  await b.office.run('invoice.prepare', { jobId: job.id }, { error: 'DUPLICATE' })
  const secondPayload = { jobId: job.id, progress: { name: 'Commissioning', final: false }, lines: line('40.00') }
  let second = await b.office.run('invoice.prepare', secondPayload)
  second = await b.office.run('invoice.approve', { invoiceId: second.id, version: second.version, revision: 1, poNumber: 'PO-LONG-1' })
  await b.office.run('invoice.export', {})
  assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'completed', 'a progress export does not finish invoicing the job')
  await b.office.run('invoice.prepare', { jobId: job.id, progress: { name: 'Final', final: true }, lines: line('80.00') }, { error: 'PROGRESS_REMAINDER' })
  let final = await b.office.run('invoice.prepare', { jobId: job.id, progress: { name: 'Final', final: true }, lines: line('89.00') })
  assert.equal(final.revisions[0].totals.total, '96.34')
  await b.office.run('invoice.revise', { invoiceId: final.id, version: final.version, reason: 'Over contract', lines: line('100.00') }, { error: 'PROGRESS_AMOUNT' })
  final = await b.office.run('invoice.approve', { invoiceId: final.id, version: final.version, revision: 1, poNumber: 'PO-LONG-1' })
  await b.office.run('invoice.export', {})
  assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'invoiced')
  await b.office.run('invoice.prepare', secondPayload, { error: 'JOB_STATE' })
  first = (await h.state()).invoices.find(i => i.id === first.id)
  await b.office.run('invoice.correct', { invoiceId: first.id, version: first.version, reason: 'Exceeds contract', lines: line('61.00') }, { error: 'PROGRESS_AMOUNT' })
  first = await b.office.run('invoice.correct', { invoiceId: first.id, version: first.version, reason: 'Clarify stage description', lines: [{ ...line('60.00')[0], description: 'Rough-in completed and inspected' }] })
  assert.equal(first.revisions[1].corrects.revision, 1)
  first = await b.office.run('invoice.approve', { invoiceId: first.id, version: first.version, revision: 2 })
  assert.deepEqual(first.dates, firstDates, 'later terms and a correction retain the first stage’s issued and due dates')
  const statement = await h.request(`/api/glove/customers/${b.customer.id}/statement.json?asOf=2099-01-01`).then(r => r.json())
  assert.ok(JSON.stringify(statement).includes('204.59'))
  const { exported } = await assertTrail(h, ['invoice.prepared', 'invoice.approved', 'invoice.exported', 'invoice.corrected'])
  assert.equal(exported.invoices.filter(i => i.jobId === job.id).length, 3)
  assert.equal(exported.invoices.find(i => i.id === final.id).progress.final, true)
  const other = await h.command('branch.save', { name: 'Outside', prefix: 'OUT', timezone: 'UTC', zips: ['10001'] })
  await h.command('branch.limit', { operatorId: b.office.id, branchId: other.id })
  await b.office.run('invoice.prepare', firstPayload, { commandId, error: 'NOT_FOUND' })
})

test('PAY-001, PAY-010, PAY-011, PAY-012, PAY-013, PAY-014, PAY-015, PAY-016 owner-granted technician draft requests replay once and expose only approved invoices under current assignment and permission', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h, { currency: 'USD', timezone: 'UTC' })
  const work = await completedJob(h, b)
  const payload = { visitId: work.visit.id, deviceTime: '2026-10-20T23:05:00Z' }, commandId = randomUUID()
  await b.priyaPerson.run('invoice.fieldPrepare', payload, { error: 'FORBIDDEN' })
  await b.office.run('invoice.fieldConfigure', { technicianId: b.priya.id, version: b.priya.version, enabled: true }, { error: 'FORBIDDEN' })
  let tech = await h.command('invoice.fieldConfigure', { technicianId: b.priya.id, version: b.priya.version, enabled: true })
  await h.command('invoice.fieldConfigure', { technicianId: b.tom.id, version: b.tom.version, enabled: true })
  await b.tomPerson.run('invoice.fieldPrepare', payload, { error: 'FORBIDDEN' })
  await b.priyaPerson.run('invoice.prepare', { jobId: work.job.id }, { error: 'FORBIDDEN' })
  await b.priyaPerson.run('invoice.fieldPrepare', { ...payload, lines: [{ unitPrice: '1.00' }] }, { error: 'INPUT' })
  const outcomes = await Promise.all([b.priyaPerson.run('invoice.fieldPrepare', payload, { commandId }), b.priyaPerson.run('invoice.fieldPrepare', payload, { commandId })])
  assert.deepEqual(outcomes[0], outcomes[1])
  assert.equal(outcomes[0].deskApprovalRequired, true)
  assert.equal(JSON.stringify(outcomes[0]).includes('189.00'), false)
  assert.equal((await h.state()).invoices.length, 1)
  assert.equal((await b.priyaPerson.state()).invoices.length, 0, 'unapproved invoice prices never reach the phone')
  await b.priyaPerson.run('invoice.fieldPrepare', payload, { error: 'DUPLICATE' })
  let invoice = (await h.state()).invoices[0]
  await b.priyaPerson.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'FORBIDDEN' })
  invoice = await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
  let phone = await b.priyaPerson.state()
  assert.equal(phone.invoices[0].revisions[0].totals.total, '189.00')
  assert.equal(phone.invoices[0].revisions[0].approval.name, 'Olu Office')
  assert.equal(phone.invoices[0].revisions[0].totals.taxContext, undefined)
  assert.equal(phone.invoices[0].revisions[0].preparedBy, undefined)
  assert.equal((await b.tomPerson.state()).invoices.length, 0)
  invoice = await b.office.run('invoice.revise', { invoiceId: invoice.id, version: invoice.version, reason: 'Office-only correction draft', lines: [{ description: 'New draft', quantity: '1', unitPrice: '200.00', tax: 'FREE' }] })
  phone = await b.priyaPerson.state()
  assert.equal(phone.invoices[0].revisions[0].n, 1, 'presentation keeps the exact approved revision while the replacement is unapproved')
  assert.equal(phone.invoices[0].revisions[0].totals.total, '189.00')
  tech = await h.command('invoice.fieldConfigure', { technicianId: b.priya.id, version: tech.version, enabled: false })
  await b.priyaPerson.run('invoice.fieldPrepare', payload, { commandId, error: 'FORBIDDEN' })
  assert.equal((await b.priyaPerson.state()).invoices.length, 0)
  await h.command('invoice.fieldConfigure', { technicianId: b.priya.id, version: tech.version, enabled: true })
  const { exported } = await assertTrail(h, ['invoice.fieldConfigured', 'invoice.prepared', 'invoice.approved'])
  assert.equal(exported.timeline.filter(e => e.kind === 'invoice.prepared' && e.subject_id === invoice.id).length, 1)
  assert.equal(exported.invoices[0].fieldPreparation.visitId, work.visit.id)
  assert.equal(h.email.sent.length, 0, 'reconnection preparation never sends a customer message')
  const subject = (await h.state()).customers.find(customer => customer.id === b.customer.id)
  const erasure = await h.command('privacy.preview', { customerId: subject.id, version: subject.version })
  await h.command('privacy.erase', { customerId: subject.id, version: subject.version, fingerprint: erasure.fingerprint, confirm: 'ERASE' })
  assert.equal((await b.priyaPerson.state()).invoices.length, 0, 'erasure removes the approved customer invoice projection')
  await b.priyaPerson.run('invoice.fieldPrepare', payload, { commandId, error: 'NOT_FOUND' })

})

test('PAY-001, PAY-010, PAY-011, PAY-012, PAY-013, PAY-014, PAY-015, PAY-016 customer statements retain approved dated balances, confirmed payments, credits and corrections without cross-customer or branch disclosure', async t => {
  const h = await installation({ at: '2026-11-01T10:00:00Z' }); t.after(() => h.close())
  const b = await business(h, { currency: 'USD', timezone: 'UTC' })
  const inv = await paidInvoice(h, b, '2026-10-21')
  const draft = await b.office.run('invoice.prepare', { jobId: (await completedJob(h, b, '2026-10-22')).job.id })
  const total = inv.revisions[0].totals.total
  await b.office.run('payment.record', { invoiceId: inv.id, version: inv.version, method: 'check', amount: '50.00', reference: 'synthetic-glove-1' })
  const path = `/api/glove/customers/${b.customer.id}/statement.json`
  const read = async date => { const response = await h.request(`${path}?asOf=${date}`); assert.equal(response.status, 200); return response.json() }
  let report = await read('2026-11-01')
  assert.deepEqual(report.invoices.map(i => [i.id, i.total, i.paid, i.due, i.credit]), [[inv.id, total, '50.00', '139.00', '0.00']])
  assert.equal(report.customer.email, b.customer.email)
  await Promise.all([h.scheduled('2026-11-01T10:00:00Z'), h.scheduled('2026-11-01T10:00:00Z')])
  let reminders = (await h.state()).events.filter(e => e.kind === 'invoice.officeReminder')
  assert.deepEqual(reminders.map(e => e.jobId), [draft.jobId], 'the office is reminded only about work still awaiting preparation or approval')
  assert.equal(h.email.sent.length, 0, 'office reminders are internal, with no customer send')
  await h.scheduled('2026-11-02T10:00:00Z')
  reminders = (await h.state()).events.filter(e => e.kind === 'invoice.officeReminder')
  assert.equal(reminders.length, 2, 'one reminder on each branch-local day')
  await assertTrail(h, ['invoice.officeReminder'])
  assert.deepEqual((await read('2026-10-31')).invoices, [], 'future approvals and drafts are absent')
  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-02T10:00:00Z' } })
  await h.command('payment.credit', { invoiceId: inv.id, version: inv.version, amount: '150.00', reference: 'Owner-approved allowance' })
  report = await read('2026-11-02')
  assert.deepEqual(report.totals, [{ currency: 'USD', total, paid: '200.00', due: '0.00', credit: '11.00', balance: '-11.00' }])
  assert.equal((await read('2026-11-01')).invoices[0].paid, '50.00', 'later credits do not rewrite an earlier statement')
  const csv = await (await h.request(path.replace('.json', '.csv') + '?asOf=2026-11-02')).text()
  assert.ok(csv.includes(inv.number) && csv.includes('-11.00') && !csv.includes(draft.number))
  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-03T10:00:00Z' } })
  await b.office.run('invoice.export', {})
  let live = (await h.state()).invoices.find(i => i.id === inv.id)
  const correction = await b.office.run('invoice.correct', { invoiceId: inv.id, version: live.version, reason: 'Corrected accepted repair quantity', lines: [{ description: 'Reviewed repair', quantity: '1', unitPrice: '239.00', tax: 'FREE' }] })
  assert.equal((await read('2026-11-03')).invoices[0].total, total, 'an unapproved correction does not replace the approved balance')
  await b.office.run('invoice.approve', { invoiceId: inv.id, version: correction.version, revision: 2 })
  assert.deepEqual((await read('2026-11-03')).invoices.map(i => [i.revision, i.total, i.balance]), [[2, '239.00', '39.00']])
  assert.equal((await read('2026-11-02')).invoices[0].revision, 1, 'the corrected revision is not backdated into an earlier statement')
  await b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
  live = (await h.state()).invoices.find(i => i.id === draft.id)
  await connectPayments(h)
  const pending = await h.command('payment.checkout', { invoiceId: live.id, version: live.version, method: 'ach' })
  const pi = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
  const eventAt = Math.floor(Date.parse('2026-11-03T10:00:00Z') / 1000)
  Object.assign(pi, { status: 'processing' })
  assert.equal((await paymentEvent(h, pi, 'payment_intent.processing', { at: eventAt })).status, 200)
  assert.equal((await read('2026-11-03')).invoices.find(i => i.id === draft.id).paid, '0.00', 'pending bank payment reduces nothing')
  Object.assign(pi, { status: 'succeeded', amount_received: pi.amount, latest_charge: { id: 'synthetic-glove-statement-1', created: eventAt, status: 'succeeded', balance_transaction: { fee: 100 } } })
  assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded', { at: eventAt })).status, 200)
  assert.equal((await read('2026-11-03')).invoices.find(i => i.id === draft.id).balance, '0.00')
  Object.assign(pi, { status: 'requires_payment_method', last_payment_error: { code: 'bank_account_unusable' } })
  assert.equal((await paymentEvent(h, pi, 'payment_intent.payment_failed', { at: eventAt })).status, 200)
  assert.equal((await read('2026-11-03')).invoices.find(i => i.id === draft.id).balance, total, 'returned bank funds reopen the statement balance')
  const other = await h.command('customer.save', { name: 'Other customer', email: 'other@example.test' })
  const isolated = await h.request(`/api/glove/customers/${other.id}/statement.json`).then(r => r.json())
  assert.deepEqual(isolated.invoices, []); assert.ok(!JSON.stringify(isolated).includes(inv.number))
  assert.equal((await h.request(path, { as: '' })).status, 401)
  assert.equal((await h.request(path, { as: b.priyaPerson.cookie })).status, 403)
  assert.equal((await h.request(path + '?asOf=2026-02-30')).status, 400)
  const branch = await h.command('branch.save', { name: 'Other', prefix: 'OTHER', timezone: 'UTC', zips: [] })
  await h.command('branch.limit', { operatorId: b.office.id, branchId: branch.id })
  assert.equal((await h.request(path, { as: b.office.cookie })).status, 404)
  assert.equal((await h.state()).invoices.length, 2, 'statement reads create no documents or charges')
})

test('AGENT-004, AGENT-011, AGENT-012, AGENT-013 prepares unbilled work, chases only approved reminder steps and proposes reconciliation without posting or moving money', async t => {
  const h = await installation({ at: '2026-11-01T10:00:00Z' }); t.after(() => h.close())
  const b = await quickbooksBusiness(h)
  await h.command('business.save', { ...(await h.state()).business[0], timezone: 'UTC', paymentTermsDays: 0, address: '1 Synthetic Street, Austin TX' })
  const inv = await paidInvoice(h, b, '2026-10-21')
  const work = await completedJob(h, b, '2026-10-22')
  const draft = await b.agent.run('invoice.prepare', { jobId: work.job.id })
  assert.equal(draft.status, 'draft'); assert.equal(draft.revisions[0].approval, null)
  await b.agent.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 }, { error: 'FORBIDDEN' })
  await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-1', eventKey: mailEvents('sendgrid').eventKey, fromEmail: 'office@example.test' })
  await h.command('reminder.configure', { version: (await h.state()).business[0].version, enabled: true, approved: true, templates: reminderTemplates, visitHours: [], paymentDays: [0, 3], quoteDays: [] })
  let customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('reminder.consent', { customerId: customer.id, version: customer.version, purpose: 'payments', enabled: true, reference: 'Customer requested payment notices' })
  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-01T10:00:00Z' } })
  await b.agent.run('invoice.chase', { invoiceId: inv.id, version: inv.version })
  assert.equal(h.email.sent.length, 1)
  await b.agent.run('invoice.chase', { invoiceId: inv.id, version: inv.version })
  assert.equal(h.email.sent.length, 1, 'fresh agent requests cannot repeat a reserved step')
  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-04T19:00:00Z' } })
  await b.agent.run('invoice.chase', { invoiceId: inv.id, version: inv.version })
  assert.equal(h.email.sent.length, 1, 'agent requests preserve quiet hours')
  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-05T10:00:00Z' } })
  await b.agent.run('invoice.chase', { invoiceId: inv.id, version: inv.version })
  assert.equal(h.email.sent.length, 2)
  assert.ok(h.email.sent.every(m => !JSON.stringify(m.body).includes('checkout.stripe.com')), 'reminders contain no customer pay link')
  await connectPayments(h)
  const checkout = await h.command('payment.checkout', { invoiceId: inv.id, version: inv.version, method: 'card' })
  const pi = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
  Object.assign(pi, { status: 'succeeded', amount_received: pi.amount, latest_charge: { id: 'synthetic-glove-collection-1', created: Math.floor(Date.parse('2026-11-05T10:00:00Z') / 1000), status: 'succeeded', balance_transaction: { fee: 100 } } })
  assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded', { at: Math.floor(Date.parse('2026-11-05T10:00:00Z') / 1000) })).status, 200)
  const payment = (await h.state()).payments.find(p => p.id === checkout.id)
  await h.command('qbo.sync', { kind: 'invoice', id: inv.id })
  const before = await h.state(), calls = h.quickbooks.calls.length, stripeCalls = h.stripePayments.calls.length
  const proposal = await b.agent.run('reconciliation.prepare', { paymentId: payment.id, version: payment.version })
  assert.equal(proposal.issueKind, 'paymentPostingReview'); assert.equal(proposal.kind, 'reconciliation')
  assert.equal(proposal.comparison.invoiceTotal, inv.revisions[0].totals.total); assert.ok(proposal.comparison.fieldEvidence.some(e => e.kind === 'completion'))
  assert.equal(proposal.amount, payment.amount); assert.equal(proposal.paymentId, payment.id)
  assert.deepEqual(await b.agent.run('reconciliation.prepare', { paymentId: payment.id, version: payment.version }), proposal, 'one current discrepancy creates one proposal')
  await b.agent.run('reconciliation.decide', { proposalId: proposal.id, version: proposal.version, decision: 'approved', reason: 'Looks right' }, { error: 'FORBIDDEN' })
  await h.command('proposal.approve', { proposalId: proposal.id, version: proposal.version }, { error: 'PROPOSAL_STATE' })
  const decided = await b.office.run('reconciliation.decide', { proposalId: proposal.id, version: proposal.version, decision: 'approved', reason: 'Owner must verify links before any post' })
  assert.equal(decided.status, 'approved')
  assert.equal(h.quickbooks.calls.length, calls); assert.equal(h.stripePayments.calls.length, stripeCalls)
  assert.deepEqual((await h.state()).payments, before.payments)
  const posted = await h.command('qbo.sync', { kind: 'payment', id: payment.id })
  assert.equal(posted.phase, 'complete', 'only the explicit authorized owner command posts the payment')
  assert.equal(h.quickbooks.calls.filter(c => c.entity === 'payment' && c.body).length, 1)
  const postedPayment = (await h.state()).payments.find(p => p.id === payment.id)
  await b.agent.run('reconciliation.prepare', { paymentId: payment.id, version: postedPayment.version }, { error: 'RECONCILIATION_STATE' })
  await h.command('qbo.sync', { kind: 'payment', id: payment.id })
  assert.equal(h.quickbooks.calls.filter(c => c.entity === 'payment' && c.body).length, 1, 'a confirmed accounting post never duplicates')
  await b.agent.run('payment.credit', { invoiceId: inv.id }, { error: 'FORBIDDEN' })
  await b.agent.run('payment.refund', { invoiceId: inv.id }, { error: 'FORBIDDEN' })
  await b.agent.run('qbo.sync', { kind: 'payment', id: payment.id }, { error: 'FORBIDDEN' })
  const stopped = await b.agent.run('invoice.chase', { invoiceId: inv.id, version: (await h.state()).invoices.find(i => i.id === inv.id).version })
  assert.equal(stopped.requested, false); assert.equal(stopped.state, 'Stopped: zero balance'); assert.equal(h.email.sent.length, 2)
  await assertTrail(h, ['invoice.chaseRequested', 'reconciliation.prepared', 'reconciliation.decided'])
  const amountCents = Math.round(Number(payment.amount) * 100)
  const payoutId = 'synthetic-glove-collection-payout-1'
  h.stripePayments.payouts.set(payoutId, { id: payoutId, livemode: false, automatic: true, currency: 'usd', amount: amountCents - 100, status: 'paid', method: 'standard', balance_transaction: { fee: 0 } })
  h.stripePayments.transactions.set(payoutId, { data: [{ id: 'synthetic-glove-collection-balance-1', type: 'charge', source: payment.providerReference, currency: 'usd', amount: amountCents, fee: 100, net: amountCents - 100 }], has_more: false })
  const payout = await h.command('payout.reconcile', { providerId: payoutId })
  assert.equal(payout.reconciled, true)
  const beforeInspection = await h.state(), payoutCalls = h.stripePayments.calls.length, booksCalls = h.quickbooks.calls.length
  const payoutProposal = await h.command('reconciliation.prepare', { payoutId: payout.id, version: payout.version })
  assert.equal(payoutProposal.issueKind, 'payoutBooksReview')
  assert.equal(payoutProposal.comparison.difference, '0.00')
  assert.deepEqual(payoutProposal.comparison.issues.map(i => i.kind), ['deposit', 'feePosting'], 'confirmed payment and invoice postings are distinguished from unproved bank and fee postings')
  assert.match(payoutProposal.comparison.issues[0].reason, /not proof of a missing deposit/)
  assert.deepEqual(await h.command('reconciliation.prepare', { payoutId: payout.id, version: payout.version }), payoutProposal)
  await h.command('reconciliation.decide', { proposalId: payoutProposal.id, version: payoutProposal.version, decision: 'approved', reason: 'Self review' }, { error: 'SELF_APPROVAL' })
  await b.agent.run('reconciliation.prepare', { payoutId: payout.id, version: payout.version }, { error: 'FORBIDDEN' })
  await b.office.run('reconciliation.prepare', { payoutId: payout.id, version: payout.version }, { error: 'FORBIDDEN' })
  assert.ok(!(await b.office.state()).proposals.some(p => p.id === payoutProposal.id), 'provider-wide inspection details remain Owner-only')
  assert.ok(!(await b.agent.state()).proposals.some(p => p.id === payoutProposal.id))
  assert.equal(h.stripePayments.calls.length, payoutCalls); assert.equal(h.quickbooks.calls.length, booksCalls)
  assert.deepEqual((await h.state()).payments, beforeInspection.payments)
  assert.deepEqual((await h.state()).invoices, beforeInspection.invoices)
  h.stripePayments.transactions.get(payoutId).data[0].fee = 101
  h.stripePayments.transactions.get(payoutId).data[0].net = amountCents - 101
  const changedPayout = await h.command('payout.reconcile', { providerId: payoutId })
  const changedProposal = await h.command('reconciliation.prepare', { payoutId: payout.id, version: changedPayout.version })
  assert.notEqual(changedProposal.id, payoutProposal.id)
  assert.ok(changedProposal.comparison.issues.some(i => i.kind === 'sourceChanged'))
  assert.ok(changedProposal.comparison.issues.some(i => i.kind === 'provider'))
  const otherOwner = await h.person('Second Owner', 'owner')
  await otherOwner.run('reconciliation.decide', { proposalId: payoutProposal.id, version: payoutProposal.version, decision: 'approved', reason: 'Changed snapshot' }, { error: 'STALE' })
  const reviewedPayout = await otherOwner.run('reconciliation.decide', { proposalId: changedProposal.id, version: changedProposal.version, decision: 'approved', reason: 'Inspect bank and fees outside Glove; no posting approved' })
  assert.equal(reviewedPayout.status, 'approved')
  const mismatchId = 'synthetic-glove-collection-payout-2'
  h.stripePayments.payouts.set(mismatchId, { id: mismatchId, livemode: false, automatic: true, currency: 'usd', amount: amountCents - 90, status: 'pending', method: 'standard', balance_transaction: { fee: 0 } })
  h.stripePayments.transactions.set(mismatchId, { data: [{ id: 'synthetic-glove-missing-balance-1', type: 'charge', source: 'synthetic-glove-missing-payment-1', currency: 'usd', amount: amountCents, fee: 90, net: amountCents - 90 }], has_more: false })
  const unmatched = await h.command('payout.reconcile', { providerId: mismatchId })
  const mismatch = await h.command('reconciliation.prepare', { payoutId: unmatched.id, version: unmatched.version })
  assert.ok(mismatch.comparison.issues.some(i => i.kind === 'total'))
  assert.ok(mismatch.comparison.issues.some(i => i.kind === 'provider' && i.reason === 'missing payment'))
  assert.ok(mismatch.comparison.issues.some(i => i.kind === 'status'))
  const beforeReplay = await h.state()
  const id = crypto.randomUUID()
  const preparedByOther = await otherOwner.run('reconciliation.prepare', { payoutId: unmatched.id, version: unmatched.version }, { commandId: id })
  assert.equal(preparedByOther.id, mismatch.id)
  await h.command('role.set', { operatorId: otherOwner.id, role: 'office' })
  await otherOwner.run('reconciliation.prepare', { payoutId: unmatched.id, version: unmatched.version }, { commandId: id, error: 'FORBIDDEN' })
  assert.equal((await h.state()).proposals.length, beforeReplay.proposals.length)
  const payoutTrail = await assertTrail(h, ['reconciliation.prepared', 'reconciliation.decided'])
  const inspectedEvent = payoutTrail.activity.find(e => e.subjectId === changedProposal.id && e.kind === 'reconciliation.decided')
  assert.ok(inspectedEvent && inspectedEvent.actorId === otherOwner.id)
  const exportedProposal = payoutTrail.exported.proposals.find(p => p.id === changedProposal.id)
  assert.deepEqual(exportedProposal.comparison.sourcePaymentIds, [payment.id])
  assert.ok(payoutTrail.exported.timeline.some(e => e.id === inspectedEvent.id))
  const officeExport = await (await h.request('/api/glove/export', { as: b.office.cookie })).json()
  const agentActivity = await (await h.request('/api/glove/activity', { as: b.agent.cookie })).json()
  for (const protectedId of [payoutProposal.id, changedProposal.id, mismatch.id]) {
    assert.ok(!JSON.stringify(officeExport).includes(protectedId), 'provider-wide proposal data and audit changes are excluded from Office export')
    assert.ok(!JSON.stringify(agentActivity).includes(protectedId), 'provider-wide proposal events are excluded from Agent Activity')
  }
  const liveInvoice = (await h.state()).invoices.find(i => i.id === inv.id)
  const refund = await h.command('payment.refund', { invoiceId: inv.id, version: liveInvoice.version, paymentId: payment.id, paymentVersion: postedPayment.version, amount: payment.amount, reason: 'Owner-approved correction' })
  const refundRow = (await h.state()).payments.find(p => p.id === refund.id)
  const refundProposal = await b.agent.run('reconciliation.prepare', { paymentId: refund.id, version: refundRow.version })
  assert.equal(refundProposal.issueKind, 'refundCreditReview')
  assert.match(refundProposal.action, /prepare any missing credit for owner approval/)
  h.quickbooks.uncertain = true
  const unknown = await h.command('qbo.sync', { kind: 'payment', id: refund.id })
  assert.equal(unknown.phase, 'unknown')
  await b.office.run('reconciliation.decide', { proposalId: refundProposal.id, version: refundProposal.version, decision: 'approved', reason: 'Stale provider state' }, { error: 'STALE' })
  const uncertainRefund = (await h.state()).payments.find(p => p.id === refund.id)
  const inspection = await b.agent.run('reconciliation.prepare', { paymentId: refund.id, version: uncertainRefund.version })
  assert.match(inspection.action, /uncertain accounting operation; do not resend/)
  const writes = h.quickbooks.calls.filter(c => c.body).length
  await b.agent.run('qbo.sync', { kind: 'payment', id: refund.id }, { error: 'FORBIDDEN' })
  await h.command('qbo.sync', { kind: 'payment', id: refund.id }, { error: 'QBO_UNCERTAIN' })
  assert.equal(h.quickbooks.calls.filter(c => c.body).length, writes)
  await b.office.run('reconciliation.decide', { proposalId: refundProposal.id, version: refundProposal.version, decision: 'declined', reason: 'Already covered by the accounting adjustment' })
  await b.office.run('reconciliation.decide', { proposalId: refundProposal.id, version: refundProposal.version, decision: 'approved', reason: 'Second decision' }, { error: 'STALE' })
  const branch = await h.command('branch.save', { name: 'Other', prefix: 'OTHER', timezone: 'UTC', zips: [] })
  await h.command('branch.limit', { operatorId: b.agent.id, branchId: branch.id })
  await b.agent.run('reconciliation.prepare', { paymentId: payment.id, version: payment.version }, { error: 'NOT_FOUND' })
  await b.agent.run('invoice.chase', { invoiceId: inv.id, version: inv.version }, { error: 'NOT_FOUND' })
  const subject = (await h.state()).customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: subject.id, version: subject.version })
  await h.command('privacy.erase', { customerId: subject.id, version: subject.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
  const erased = await h.state()
  assert.ok(!erased.proposals.some(p => [proposal.id, refundProposal.id, payoutProposal.id, changedProposal.id].includes(p.id)), 'erasure removes personal reconciliation proposals')
  assert.equal((await h.request(`/api/glove/customers/${subject.id}/statement.json`)).status, 409)

})
