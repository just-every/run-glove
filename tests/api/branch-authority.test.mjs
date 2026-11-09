import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { installation } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'

const at = '2026-11-05T12:00:00.000Z'
const period = 'from=2026-01-01&to=2026-12-31'
const photo = { mediaType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=' }
const line = price => ({ description: 'Inspection', quantity: '1', unitPrice: price, tax: 'FREE' })
const ids = rows => rows.map(row => row.id).sort()
const read = async (h, path, who) => {
  const response = await h.request('/api/glove' + path, who ? { as: who.cookie } : {})
  assert.equal(response.status, 200, `${path}: ${await response.clone().text()}`)
  return response.json()
}
const exported = h => read(h, '/export')
async function refused(h, who, type, payload, error = 'FORBIDDEN', opts = {}) {
  const before = await exported(h)
  await (who ? who.run(type, payload, { error, ...opts }) : h.command(type, payload, { error, ...opts }))
  assert.deepEqual(await exported(h), before, `${type}: refused with every record, counter, file and audit event unchanged`)
}

// One public-door authority journey, with each acceptance point named separately.
// The checkpoint delays execution only: production reads, handlers and SQL guards remain intact.
test('TEAM-005 current branch authority fences every read, shared write, replay and commit across restart', async t => {
  const source = await readFile('src/glove/api.ts', 'utf8')
  const checkpoint = 'try { committed = await commit(env.DB, c, before, type, digest, result) }'
  assert.ok(source.includes(checkpoint))
  const h = await installation({ at, workerPlugins: [{ name: 'branch-commit-checkpoint', setup(build) {
    build.onLoad({ filter: /\/glove\/api\.ts$/ }, args => ({
      contents: source.replace(checkpoint, `if (commandId === 'synthetic-glove-authority-race' && attempt === 0) await fetch('https://worker-checkpoint.example.test/qbo-complete');\n    ${checkpoint}`),
      loader: 'ts', resolveDir: dirname(args.path),
    }))
  } }] })
  t.after(() => h.close())
  const owner = (await h.request('/auth/session').then(r => r.json())).operator
  await h.command('business.save', { name: 'Independent branch service', currency: 'AUD', timezone: 'UTC', paymentTermsDays: 14 })
  const dispatcher = await h.person('Branch Dispatcher', 'dispatcher'), office = await h.person('Main Office', 'office')
  const second = await h.person('Second Owner', 'owner'), mainOwner = await h.person('Main Owner', 'owner')
  const agent = await h.person('Branch Agent', 'agent')
  const customRole = await h.command('role.save', { name: 'Scoped customer desk', permissions: ['customer.save', 'reports.read', 'export.read'] })
  const custom = await h.person('Custom Desk', `custom:${customRole.id}`)
  const east = await h.command('branch.save', { name: 'East', prefix: 'EAS', timezone: 'UTC', zips: ['27601'] })
  const west = await h.command('branch.save', { name: 'West', prefix: 'WES', timezone: 'UTC', zips: ['85001'] })
  const service = await h.command('service.save', { code: 'INSPECT', name: 'Shared inspection', unitPrice: '31.00', tax: 'FREE', category: 'Inspection' })
  const plan = await h.command('plan.save', { name: 'Shared annual care', price: '120.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id })
  const roots = []
  for (const [branch, name, price, zip, prefix, leadSource] of [[null, 'Main', '31.00', '60601', '', 'phone'], [east.id, 'East', '47.00', '27601', 'EAS-', 'website'], [west.id, 'West', '83.00', '85001', 'WES-', 'referral']]) {
    const person = await h.person(`${name} Field`, 'technician')
    const tech = await h.command('technician.save', { name: `${name} Field`, operatorId: person.id, branchId: branch })
    const customer = await h.command('customer.save', { name: `${name} independent customer` })
    const site = await h.command('site.save', { customerId: customer.id, address: `10 ${name} Street ${zip}`, branchId: branch })
    const enquiry = await h.command('enquiry.create', { customerId: customer.id, siteId: site.id, description: `${name} independent request`, source: leadSource })
    const quote = await h.command('quote.draft', { customerId: customer.id, siteId: site.id, enquiryId: enquiry.id, title: `${name} independent quote`, lines: [line(price)] })
    const approved = await h.command('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    await h.command('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: `${name} customer` })
    const job = await h.command('job.create', { quoteId: quote.id })
    const equipment = await h.command('equipment.save', { siteId: site.id, type: `${name} condenser`, serial: `${name}-unit`, refrigerant: 'R-410A', manufacturerWarrantyUntil: '2026-11-20', photo })
    const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date: '2026-11-05', start: '09:00', end: '10:00' })
    await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await person.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'refrigerant', equipmentId: equipment.id, added: '1.25', recovered: '0.25', certification: 'synthetic-glove-608' })
    await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: `${name} inspection complete`, signoff: { absentReason: 'Customer away' } })
    const draft = await h.command('invoice.prepare', { jobId: job.id })
    const invoice = await h.command('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
    const conversation = await h.command('conversation.log', { customerId: customer.id, jobId: job.id, kind: 'note', text: `${name} private desk note` })
    const agreement = await h.command('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, startDate: '2026-01-01', via: 'phone' })
    roots.push({ branch, name, price, prefix, leadSource, person, tech, customer, site, enquiry, quote, job, visit, invoice, equipment, conversation, agreement })
  }

  await scenario(t, 'TEAM-005 point 1: only the unscoped Owner limits named and main branches and removes limits with exact versions and attributable facts', async () => {
    const changes = []
    for (const [who, branchId, version, summary] of [[dispatcher, east.id, 1, 'East'], [office, 'main', 1, 'main business branch'], [dispatcher, null, 2, 'all branches'], [office, null, 2, 'all branches']]) {
      const commandId = `synthetic-glove-limit-${changes.length + 1}`
      const result = await h.command('branch.limit', { operatorId: who.id, branchId }, { commandId })
      assert.deepEqual(result, { operatorId: who.id, branchId: branchId === 'main' ? null : branchId, limited: branchId !== null })
      const access = (await h.state()).branchAccess.find(row => row.id === who.id)
      assert.deepEqual(access, { id: who.id, version, branchId: branchId === 'main' ? null : branchId, limited: branchId !== null, createdAt: at })
      changes.push({ who, branchId, commandId, summary, version })
      const view = await who.state()
      assert.equal(view.customers.length, branchId === null ? 3 : 1)
    }
    await h.command('branch.limit', { operatorId: second.id, branchId: east.id })
    const issued = await h.command('token.issue', { name: 'Authority test', role: 'dispatcher' })
    const token = { run: async (type, payload, opts) => {
      const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${issued.token}` }, body: { commandId: 'synthetic-glove-token-limit', type, payload } })
      const body = await response.json(); assert.equal(response.status, 403); assert.equal(body.error.code, opts.error)
    } }
    for (const who of [dispatcher, office, second, custom, token]) await refused(h, who, 'branch.limit', { operatorId: agent.id, branchId: west.id })
    const activity = await read(h, '/activity'), archive = await exported(h)
    for (const change of changes) {
      const event = activity.events.find(e => e.commandId === change.commandId)
      assert.ok(event)
      assert.deepEqual([event.kind, event.actorId, event.actorName, event.actorRole, event.at, event.subjectId, event.summary], ['branch.limited', owner.id, owner.displayName, 'owner', at, change.who.id, `${change.who.name}: ${change.summary}`])
      const eventExport = archive.timeline.find(e => e.command_id === change.commandId)
      assert.deepEqual([eventExport.kind, eventExport.actor_id, eventExport.actor_name, eventExport.actor_role, eventExport.at, eventExport.subject_id, eventExport.summary], ['branch.limited', owner.id, owner.displayName, 'owner', at, change.who.id, `${change.who.name}: ${change.summary}`])
      const data = JSON.parse(eventExport.data)
      assert.equal(data.branchId, change.branchId === 'main' ? null : change.branchId)
      assert.equal(data.limited, change.branchId !== null)
    }
    await h.command('token.revoke', { tokenId: issued.id })
  })

  await scenario(t, 'TEAM-005 point 2: the installation owner cannot be limited by either Owner and retains every branch while another Owner is scoped', async () => {
    await refused(h, null, 'branch.limit', { operatorId: owner.id, branchId: east.id }, 'OWNER_ROLE')
    await h.command('branch.limit', { operatorId: second.id, branchId: null })
    await refused(h, second, 'branch.limit', { operatorId: owner.id, branchId: 'main' }, 'OWNER_ROLE')
    await refused(h, second, 'branch.limit', { operatorId: second.id, branchId: west.id }, 'OWNER_ROLE')
    await h.command('branch.limit', { operatorId: second.id, branchId: east.id })
    assert.deepEqual(ids((await second.state()).customers), [roots[1].customer.id])
    assert.deepEqual(ids((await h.state()).customers), ids(roots.map(r => r.customer)))
    assert.equal((await h.state()).branchAccess.some(r => r.id === owner.id), false)
  })

  await scenario(t, 'TEAM-005 point 3: independent main and branch records are fenced at every read door and live authority governs replay, rules and the commit guard', async () => {
    await h.command('branch.limit', { operatorId: dispatcher.id, branchId: east.id })
    await h.command('branch.limit', { operatorId: office.id, branchId: 'main' })
    const cases = [[null, roots], [dispatcher, [roots[1]]], [office, [roots[0]]], [second, [roots[1]]]]
    const mappings = { customers: 'customer', sites: 'site', enquiries: 'enquiry', quotes: 'quote', jobs: 'job', visits: 'visit', invoices: 'invoice', technicians: 'tech', equipment: 'equipment', agreements: 'agreement', conversations: 'conversation' }
    for (const [who, expected] of cases) {
      const selected = new Set(expected), hidden = roots.filter(root => !selected.has(root))
      const view = await (who ? who.state() : h.state())
      for (const [collection, key] of Object.entries(mappings)) assert.deepEqual(ids(view[collection]), ids(expected.map(r => r[key])), `${who?.name ?? 'installation Owner'} ${collection}`)
      const noHidden = (value, door) => {
        const text = JSON.stringify(value)
        for (const other of hidden) for (const key of Object.values(mappings)) assert.ok(!text.includes(other[key].id), `${door} conceals ${other.name} ${key}`)
      }
      noHidden(view.events, 'state Activity')
      const activity = await read(h, '/activity', who)
      noHidden(activity, 'Activity')
      for (const root of expected) assert.ok(activity.events.some(e => e.subjectId === root.equipment.id), 'own equipment Activity is present')
      for (const root of roots) {
        const doors = [
          [`/files/${root.equipment.photos[0].fileId}`, null],
          [`/jobs/${root.job.id}/timeline`, result => assert.ok(result.events.some(e => e.subjectId === root.visit.id))],
          [`/sites/${root.site.id}/history`, result => assert.equal(result.site.id, root.site.id)],
          [`/conversation?customerId=${root.customer.id}`, result => assert.ok(result.entries.some(e => e.text === `${root.name} private desk note`))],
          [`/conversation?jobId=${root.job.id}`, result => assert.ok(result.entries.some(e => e.text === `${root.name} private desk note`))],
          [`/equipment/${root.equipment.id}`, result => assert.equal(result.equipment.id, root.equipment.id)],
          [`/jobs/${root.job.id}/cost`, result => assert.ok(JSON.stringify(result).includes(root.job.id))],
          [`/jobs/${root.job.id}/callback`, result => assert.equal(result.callback, null)],
          [`/customers/${root.customer.id}/duplicates`, result => assert.ok(JSON.stringify(result).includes(root.customer.id))],
          [`/documents/invoice/${root.invoice.id}`, result => assert.ok(JSON.stringify(result).includes(root.invoice.number))],
        ]
        if (!who || who === dispatcher || who === second) doors.push([`/jobs/${root.job.id}/companycam`, result => assert.deepEqual(result.uploads, [])])
        for (const [door, check] of doors) {
          const response = await h.request('/api/glove' + door, who ? { as: who.cookie } : {})
          assert.equal(response.status, selected.has(root) ? 200 : 404, `${who?.name ?? 'Owner'} ${door}`)
          if (selected.has(root)) {
            if (check) { const result = await response.json(); check(result); noHidden(result, door) }
            else assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(photo.base64, 'base64'))
          } else assert.equal((await response.json()).error.code, 'NOT_FOUND')
        }
      }
      const balance = await read(h, '/balances', who)
      assert.deepEqual(ids(balance.invoices), ids(expected.map(r => r.invoice)))
      assert.deepEqual(balance.invoices.map(i => i.due).sort(), expected.map(r => r.price).sort())
      const dashboard = await read(h, '/dashboard', who)
      assert.deepEqual(ids(dashboard.jobs.list), ids(expected.map(r => r.job)))
      assert.equal(dashboard.booked.count, expected.length)
      const due = await read(h, '/due-visits?through=2026-12-31', who)
      assert.equal(due.visits.length, expected.length * 2)
      assert.deepEqual([...new Set(due.visits.map(v => v.agreementId))].sort(), expected.map(r => r.agreement.id).sort())
      const agreements = await read(h, '/agreements', who)
      assert.deepEqual(ids(agreements.agreements), ids(expected.map(r => r.agreement)))
      for (const [door, result] of [['balances', balance], ['dashboard', dashboard], ['due visits', due], ['agreements', agreements]]) noHidden(result, door)
      for (const kind of ['revenue', 'technicians', 'sources', 'quotes', 'margins', 'tax', 'agreements']) {
        const report = await read(h, `/reports/${kind}.json?${period}`, who)
        const sum = expected.reduce((n, r) => n + Number(r.price), 0).toFixed(2)
        if (kind === 'revenue') { assert.deepEqual(report.total, { invoices: expected.length, revenue: sum }); assert.deepEqual(report.byBranch.map(r => r.branch).sort(), expected.map(r => r.name === 'Main' ? 'Main business' : r.name).sort()) }
        if (kind === 'technicians') assert.deepEqual(report.technicians.map(r => [r.technicianId, r.revenue, r.visitsCompleted]).sort(), expected.map(r => [r.tech.id, r.price, 1]).sort())
        if (kind === 'sources') { assert.equal(report.total.requests, expected.length); assert.deepEqual(report.sources.map(r => r.source).sort(), expected.map(r => r.leadSource).sort()) }
        if (kind === 'quotes') assert.deepEqual([report.won, report.wonValue], [expected.length, sum])
        if (kind === 'margins') assert.equal(report.total.revenue, sum)
        if (kind === 'tax') assert.equal(report.jurisdictions.reduce((n, row) => n + row.invoices, 0), expected.length)
        if (kind === 'agreements') assert.deepEqual([report.sold, report.soldValue], [expected.length, (expected.length * 120).toFixed(2)])
        noHidden(report, kind)
        const response = await h.request(`/api/glove/reports/${kind}.csv?${period}`, who ? { as: who.cookie } : {})
        assert.equal(response.status, 200)
        const csv = await response.text()
        assert.ok(csv.split('\n').length > 2, `${kind} has actual report rows`)
        assert.ok(csv.includes(kind === 'agreements' ? String(expected.length * 120) : kind === 'tax' ? ',0.00' : kind === 'technicians' ? expected[0].tech.name : kind === 'sources' ? expected[0].leadSource : sum), `${kind} CSV contains its independent scoped figure`)
        for (const other of hidden) {
          if (kind === 'technicians') assert.ok(!csv.includes(other.tech.name))
          if (kind === 'sources') assert.ok(!csv.includes(other.leadSource))
          if (kind === 'revenue') assert.ok(!csv.includes(other.name))
        }
      }
      const warranties = await read(h, '/reports/warranties', who)
      assert.deepEqual(warranties.expiring.map(r => r.serial).sort(), expected.map(r => `${r.name}-unit`).sort())
      const refrigerant = await read(h, `/reports/refrigerant?${period}`, who)
      assert.equal(refrigerant.added, (expected.length * 1.25).toFixed(2))
      for (const door of [`/reports/costing?${period}`, '/reports/sources', '/reports/receivables.json?asOf=2026-11-05']) {
        const result = await read(h, door, who); noHidden(result, door)
        assert.ok(JSON.stringify(result).includes(expected.reduce((n, r) => n + Number(r.price), 0).toFixed(2)), `${door} contains its independently summed scoped amount`)
      }
      if (who === dispatcher) {
        for (const door of ['/export', '/customers.csv']) assert.equal((await h.request('/api/glove' + door, { as: who.cookie })).status, 403)
      } else {
        const archive = await read(h, '/export', who)
        for (const [collection, key] of Object.entries(mappings)) assert.deepEqual(ids(archive[collection]), ids(expected.map(r => r[key])), `export ${collection}`)
        assert.deepEqual(archive.files.map(f => f.id).sort(), expected.map(r => r.equipment.photos[0].fileId).sort())
        noHidden(archive, 'business export')
        const response = await h.request('/api/glove/customers.csv', who ? { as: who.cookie } : {})
        assert.equal(response.status, 200)
        const csv = await response.text()
        for (const root of roots) assert.equal(csv.includes(root.customer.name), selected.has(root))
      }
    }
    const payload = { customerId: roots[1].customer.id, jobId: roots[1].job.id, kind: 'note', text: 'Earlier East authority' }
    const commandId = 'synthetic-glove-saved-before-limit'
    await dispatcher.run('conversation.log', payload, { commandId })
    await h.command('branch.limit', { operatorId: dispatcher.id, branchId: west.id })
    await refused(h, dispatcher, 'conversation.log', payload, 'NOT_FOUND', { commandId })
    await h.restart()
    await refused(h, dispatcher, 'conversation.log', payload, 'NOT_FOUND', { commandId })

    // A branch-rooted rule also requires its creator's current scope.
    const creator = await h.person('Workflow Office', 'office')
    await h.command('branch.limit', { operatorId: creator.id, branchId: east.id })
    const rule = await creator.run('rule.save', { name: 'Current scope notice', trigger: 'enquiry.created', action: { kind: 'notify', to: 'office', message: 'Review the scoped request' } })
    for (const [branchId, allowed] of [[east.id, [roots[1]]], ['main', []], [west.id, []], [east.id, [roots[1]]]]) {
      await h.command('branch.limit', { operatorId: creator.id, branchId })
      const before = await exported(h)
      const triggered = []
      for (const root of roots) triggered.push({ root, enquiry: await h.command('enquiry.create', { customerId: root.customer.id, siteId: root.site.id, description: 'Workflow scope probe', source: root.leadSource }) })
      const after = await exported(h), runs = after.ruleRuns.filter(r => r.ruleId === rule.id && !before.ruleRuns.some(old => old.id === r.id))
      assert.deepEqual(runs.map(r => [r.trigger.subjectId, r.outcome, r.executedBy.id]).sort(), triggered.filter(x => allowed.includes(x.root)).map(x => [x.enquiry.id, 'done', creator.id]).sort())
      const notices = after.notices.filter(n => !before.notices.some(old => old.id === n.id))
      assert.deepEqual(notices.map(n => n.subjectId).sort(), runs.map(r => r.trigger.subjectId).sort())
      assert.equal(after.timeline.filter(e => e.kind === 'rule.ran').length - before.timeline.filter(e => e.kind === 'rule.ran').length, allowed.length)
    }

    await h.command('branch.limit', { operatorId: dispatcher.id, branchId: east.id })
    let release, entered
    const waiting = new Promise(resolve => { release = resolve }), reached = new Promise(resolve => { entered = resolve })
    h.checkpoints.qboComplete = async () => { entered(); await waiting }
    let inflight
    try {
      inflight = dispatcher.run('customer.save', { name: 'Must never commit under old authority' }, { commandId: 'synthetic-glove-authority-race', error: 'AUTH' })
      await reached
      await h.command('branch.limit', { operatorId: dispatcher.id, branchId: west.id })
      const changed = await exported(h)
      release()
      await inflight
      assert.deepEqual(await exported(h), changed, 'a real limit command between read and SQL commit leaves no customer, counter, audit or saved outcome')
      assert.equal(await h.db.prepare('SELECT COUNT(*) AS n FROM glove_commands WHERE id=?').bind('synthetic-glove-authority-race').first('n'), 0, 'the refused commit saved no replay outcome')
    } finally { release(); h.checkpoints.qboComplete = null; if (inflight) await inflight }
  })

  await scenario(t, 'TEAM-005 point 4: shared references remain readable and immutable while cross-branch operational edits answer NOT_FOUND', async () => {
    const form = await h.command('form.save', { name: 'Shared form', questions: [{ id: 'checked', label: 'Checked', type: 'yesno' }] })
    const template = await h.command('template.save', { name: 'Shared template', options: [{ name: 'Inspection', lines: [line('31.00')] }] })
    const field = await h.command('field.save', { record: 'customers', label: 'Shared field', type: 'text' })
    const manual = await h.command('manual.save', { make: 'Independent', model: 'One', title: 'Shared manual', url: 'https://manual.example.test/one' })
    const grantPayload = { agentId: agent.id, action: 'visit.book' }
    const grant = await h.command('grant.create', grantPayload)
    const shared = { services: service, forms: form, templates: template, customFields: field, manuals: manual, plans: plan, roles: customRole, grants: grant }
    await h.command('branch.limit', { operatorId: second.id, branchId: east.id })
    await h.command('branch.limit', { operatorId: mainOwner.id, branchId: 'main' })
    const business = (await h.state()).business[0]
    const commands = [
      ['service.save', { ...service, name: 'Changed shared service' }], ['form.save', { ...form, name: 'Changed shared form' }],
      ['template.save', { ...template, name: 'Changed shared template' }], ['field.save', { ...field, label: 'Changed shared field' }],
      ['manual.save', { ...manual, title: 'Changed shared manual' }], ['plan.save', { ...plan, price: '999.00' }],
      ['business.save', { ...business, name: 'Changed business' }], ['role.save', { ...customRole, permissions: [] }], ['grant.create', grantPayload],
      ['pricebook.category', { name: 'Inspection', markupPercent: '10' }], ['pricebook.adjust', { category: 'Inspection', percent: '10' }],
      ['pricebook.import', { file: { name: 'inspection.csv', text: 'code,name,unitPrice\nNEW,Changed inspection,999.00\n' } }],
    ]
    for (const [who, own, hidden] of [[second, roots[1], roots[0]], [mainOwner, roots[0], roots[2]]]) {
      const view = await who.state()
      assert.equal(view.business[0].name, business.name)
      for (const [key, row] of Object.entries(shared)) assert.ok(view[key].some(x => x.id === row.id), `${key} stays readable`)
      for (const [type, payload] of commands) await refused(h, who, type, payload)
      const current = (await h.state()).customers.find(c => c.id === own.customer.id)
      const edited = await who.run('customer.save', { ...current, contact: 'Branch contact' })
      assert.equal(edited.contact, 'Branch contact')
      for (const [type, payload] of [
        ['customer.save', { ...hidden.customer, name: 'Hidden edit' }], ['site.save', { ...hidden.site, address: 'Hidden address' }],
        ['enquiry.close', { enquiryId: hidden.enquiry.id, version: hidden.enquiry.version, reason: 'Hidden close' }],
        ['quote.revise', { quoteId: hidden.quote.id, version: hidden.quote.version, lines: [line('1.00')] }],
        ['visit.cancel', { visitId: hidden.visit.id, version: hidden.visit.version, reason: 'Hidden cancel' }],
        ['equipment.save', { ...hidden.equipment, type: 'Hidden unit' }],
      ]) await refused(h, who, type, payload, 'NOT_FOUND')
    }
  })

  await scenario(t, 'TEAM-005 point 5: scoped operational creations inherit their branch and matching numbers and survive actual Worker restart and replay', async () => {
    const recorded = []
    const run = async (who, type, payload) => {
      const commandId = `synthetic-glove-scoped-create-${recorded.length + 1}`
      const result = await who.run(type, payload, { commandId })
      recorded.push({ who, type, payload, commandId, result })
      return result
    }
    const before = await h.state()
    for (const [who, root] of [[second, roots[1]], [mainOwner, roots[0]]]) {
      const customer = await run(who, 'customer.save', { name: `${root.name} scoped creation` })
      const site = await run(who, 'site.save', { customerId: customer.id, address: `20 ${root.name} Street`, ...(root.branch ? { branchId: root.branch } : {}) })
      const enquiry = await run(who, 'enquiry.create', { customerId: customer.id, siteId: site.id, description: 'Scoped new request', source: 'phone' })
      const quote = await run(who, 'quote.draft', { customerId: customer.id, siteId: site.id, enquiryId: enquiry.id, title: 'Scoped new quote', lines: [line('19.00')] })
      const job = await run(who, 'job.create', { customerId: customer.id, siteId: site.id, title: 'Scoped new job', lines: [line('19.00')] })
      const visit = await run(who, 'visit.book', { jobId: job.id, technicianId: root.tech.id, date: '2026-11-06', start: '11:00', end: '12:00' })
      const equipment = await run(who, 'equipment.save', { siteId: site.id, type: 'Scoped new equipment', photo })
      for (const row of [customer, site, enquiry, quote, job, visit, equipment]) assert.equal(row.branchId, root.branch)
      assert.deepEqual([quote.number, job.number], [`${root.prefix}Q-102`, `${root.prefix}J-1002`])
    }
    const after = await h.state()
    assert.deepEqual(after.branches.find(b => b.id === west.id).counters, before.branches.find(b => b.id === west.id).counters)
    assert.deepEqual(after.branches.find(b => b.id === east.id).counters, { job: 1002, quote: 102, invoice: 1, export: 0, po: 0 })
    assert.deepEqual(after.business[0].counters, { job: 1002, quote: 102, invoice: 1, export: 0, po: 0 })
    const archive = await exported(h)
    await h.restart()
    assert.deepEqual(await h.state(), after)
    assert.deepEqual(await exported(h), archive)
    for (const entry of recorded) {
      assert.deepEqual(await entry.who.run(entry.type, entry.payload, { commandId: entry.commandId }), entry.result)
      assert.deepEqual(await exported(h), archive, `${entry.type} replay neither duplicates nor reassigns records or numbers`)
    }
  })
})
