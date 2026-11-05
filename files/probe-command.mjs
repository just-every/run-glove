import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
const { installation, business, id } = await import(pathToFileURL(process.cwd() + '/tests/api/harness.mjs'))
const h = await installation({ at: '2026-11-05T12:00:00Z' })
try {
  const b = await business(h)
  const creator = (await b.office.state()).actor
  const providers = () => [h.mails.length, h.email.sent.length, h.twilio.calls.length, h.stripePayments.calls.length, h.quickbooks.calls.length, h.models.calls.length, h.marketing.length, h.pushes.sent.length]
  const baseline = providers()
  const definition = { name: 'Native request probe', trigger: 'enquiry.created', condition: { source: 'website' }, action: { kind: 'notify', to: 'office', message: 'Inspect native request' } }
  let rule = await b.office.run('rule.save', definition)
  rule = await h.command('rule.save', { ...rule, name: 'Owner reviewed native request' })
  rule = await b.office.run('rule.save', { ...rule, enabled: false })
  assert.deepEqual([rule.version,rule.createdBy.id,rule.enabled], [3,creator.id,false])
  console.log(`PROBE API-005 2: rule.save by native Office, Owner edit, creator disable -> version=${rule.version}, original creator retained, enabled=false`)
  await b.dispatcher.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'website', description: 'Disabled native rule probe' })
  assert.equal((await h.state()).ruleRuns.filter(r => r.ruleId === rule.id).length,0)
  rule = await h.command('rule.save', { ...rule, enabled: true })
  await b.dispatcher.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Unrelated source native rule probe' })
  assert.equal((await h.state()).ruleRuns.filter(r => r.ruleId === rule.id).length,0)
  const commandId = id(), input = { customerId: b.customer.id, siteId: b.site.id, source: 'website', description: 'Exact source for retained native rule probe' }
  const request = await b.dispatcher.run('enquiry.create', input, { commandId })
  let state = await h.state(), run = state.ruleRuns.find(r => r.ruleId === rule.id)
  assert.deepEqual([run.ruleVersion,run.trigger.subjectId,run.outcome,run.detail,run.executedBy.id], [4,request.id,'done','notice to office',creator.id])
  await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
  const refused = await b.dispatcher.run('enquiry.create', { ...input, description: 'Current authority withdrawn' })
  state = await h.state()
  const denied = state.ruleRuns.find(r => r.trigger.subjectId === refused.id)
  assert.deepEqual([denied.outcome,denied.noticeId,denied.executedBy.role], ['not allowed',null,'viewer'])
  const exported = await h.request('/api/glove/export').then(r=>r.json())
  assert.equal(exported.notices.filter(n => n.ruleId === rule.id).length,1)
  console.log('PROBE API-005 4: role.set downgrades creator to viewer, then enquiry.create -> retained not allowed run, no notice; disabled and unrelated commands cause no run')
  const before = state.ruleRuns.filter(r => r.ruleId === rule.id)
  await h.restart()
  assert.deepEqual(await b.dispatcher.run('enquiry.create',input,{commandId}),request)
  state=await h.state()
  assert.deepEqual(state.ruleRuns.filter(r=>r.ruleId===rule.id),before)
  assert.deepEqual(providers(),baseline)
  console.log(`PROBE API-005 5: enquiry.create source=${request.id}, rule version=4, restart and exact command replay -> same source, audience=office, 2 unchanged runs and 1 notice, zero outbound provider attempts`)
} finally { await h.close() }
