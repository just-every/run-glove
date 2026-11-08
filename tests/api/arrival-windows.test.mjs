import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

const at = '2026-11-02T00:00:00.000Z'
const window = { start: '08:00', end: '10:00' }
async function refuse(h, run, type, payload, code, options = {}) {
  const before = await h.state()
  const error = await run(type, payload, { ...options, error: code })
  assert.deepEqual(await h.state(), before, `${code} leaves all business records unchanged`)
  return error
}
async function job(h, b, title = 'Arrival window service') {
  return b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title })
}

test('Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const b = await business(h), j = await job(h, b)
  for (const technicianId of [b.priya.id, 'auto']) {
    for (const [start, end, promised] of [
      ['07:59', '09:00', window], ['10:01', '11:00', window],
      ['09:00', '10:30', { start: '8:00', end: '10:00' }],
      ['09:00', '10:30', { start: '08:60', end: '10:00' }],
      ['09:00', '10:30', { start: '08:00', end: '24:00' }],
      ['09:00', '10:30', { start: '10:00', end: '10:00' }],
      ['09:00', '10:30', { start: '11:00', end: '08:00' }],
    ]) {
      await refuse(h, b.dispatcher.run, 'visit.book', { jobId: j.id, technicianId, date: '2026-11-03', start, end, window: promised }, 'WINDOW')
      const enquiry = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Assessment arrival promise' })
      await refuse(h, b.dispatcher.run, 'assessment.book', { enquiryId: enquiry.id, technicianId, date: '2026-11-03', start, end, window: promised }, 'WINDOW')
    }
    for (const [date, start, end] of [['2026-11-04','08:00','09:00'], ['2026-11-05','10:00','11:00']]) {
      const v = await b.dispatcher.run('visit.book', { jobId: j.id, technicianId, date, start, end, window })
      assert.deepEqual(v.arrivalWindow, window)
      assert.deepEqual([v.local.start, v.local.end, v.local.timezone], [start, end, 'Australia/Sydney'])
      const enquiry = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Assessment at the promised boundary' })
      const assessment = await b.dispatcher.run('assessment.book', { enquiryId: enquiry.id, technicianId, date: date === '2026-11-04' ? '2026-11-12' : '2026-11-13', start, end, window })
      assert.deepEqual([assessment.visit.arrivalWindow, assessment.visit.local.start, assessment.visit.local.end, assessment.visit.local.timezone], [window, start, end, 'Australia/Sydney'])
    }
  }
})

test('Approved dispatch and move proposals retain exact windows and changed promises require a person', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const b = await business(h), j = await job(h, b)
  const proposal = await b.agent.run('proposal.prepare', { kind: 'dispatch', plan: { jobId: j.id, technicianId: b.priya.id, date: '2026-11-03', start: '09:00', end: '10:30', window }, rationale: 'Requested morning visit' })
  const dispatchDecision = { proposalId: proposal.id, version: proposal.version }
  const viewer = await h.person('Proposal Window Viewer', 'viewer')
  await h.command('grant.create', { agentId: b.agent.id, action: 'visit.book', dailyLimit: 10 })
  for (const run of [b.office.run, b.priyaPerson.run, viewer.run, b.agent.run]) {
    await refuse(h, run, 'proposal.approve', dispatchDecision, 'FORBIDDEN')
  }
  const approved = await b.dispatcher.run('proposal.approve', dispatchDecision, { commandId: 'synthetic-glove-window-proposal' })
  const visit = (await h.state()).visits.find(v => v.id === approved.visitId)
  assert.deepEqual(visit.arrivalWindow, window)
  const afternoon = { start: '12:00', end: '14:00' }
  const move = await b.agent.run('proposal.prepare', { kind: 'move', visitId: visit.id, plan: { technicianId: b.priya.id, date: '2026-11-03', start: '13:00', end: '14:30', window: afternoon }, rationale: 'Review the new afternoon promise' })
  assert.equal(move.customer, 'customer not yet asked')
  const moveDecision = { proposalId: move.id, version: move.version }
  await b.dispatcher.run('proposal.approve', moveDecision, { commandId: 'synthetic-glove-window-move' })
  let moved = (await h.state()).visits.find(v => v.id === visit.id)
  assert.deepEqual(moved.arrivalWindow, afternoon)
  assert.deepEqual([moved.local.start, moved.local.end], ['13:00', '14:30'])
  assert.match(moved.assignments.at(-1).reason, /customer not yet asked/)
  const retained = await h.state()
  await h.restart()
  assert.deepEqual(await h.state(), retained)
  assert.deepEqual(await b.dispatcher.run('proposal.approve', dispatchDecision, { commandId: 'synthetic-glove-window-proposal' }), approved)
  await b.dispatcher.run('proposal.approve', moveDecision, { commandId: 'synthetic-glove-window-move' })
  assert.deepEqual(await h.state(), retained)
  const sameTime = await b.agent.run('proposal.prepare', { kind: 'move', visitId: moved.id, plan: { technicianId: b.priya.id, date: '2026-11-03', start: '13:00', end: '14:30', window: { start: '12:30', end: '14:30' } }, rationale: 'Same planned time with a changed customer promise' })
  assert.equal(sameTime.customer, 'customer not yet asked')
  await b.dispatcher.run('proposal.approve', { proposalId: sameTime.id, version: sameTime.version })
  moved = (await h.state()).visits.find(v => v.id === visit.id)
  assert.deepEqual(moved.arrivalWindow, { start: '12:30', end: '14:30' })
  await h.command('grant.create', { agentId: b.agent.id, action: 'visit.change', dailyLimit: 10 })
  await refuse(h, b.agent.run, 'visit.change', { visitId: moved.id, version: moved.version, window, start: '09:00', end: '10:30', reason: 'Try to execute the changed promise' }, 'GRANT_SCOPE')
  const pending = await b.agent.run('proposal.prepare', { kind: 'move', visitId: moved.id, plan: { technicianId: b.priya.id, date: '2026-11-03', start: '13:00', end: '14:30', window: afternoon }, rationale: 'A changed window requires the dispatcher again' })
  assert.equal(pending.customer, 'customer not yet asked')
  await refuse(h, b.agent.run, 'proposal.approve', { proposalId: pending.id, version: pending.version }, 'FORBIDDEN')
  const kept = await h.state()
  await h.restart()
  assert.deepEqual(await h.state(), kept)
  const exported = await h.request('/api/glove/export').then(r => r.json())
  const saved = exported.visits.find(v => v.id === moved.id)
  assert.deepEqual([saved.arrivalWindow, saved.assignments], [moved.arrivalWindow, moved.assignments])
  const changedEvent = exported.timeline.find(e => e.kind === 'visit.changed' && e.subject_id === moved.id && e.summary.includes('12:30 PM'))
  assert.ok(changedEvent.summary.includes('customer not yet asked'))
  assert.deepEqual([changedEvent.actor_id, changedEvent.actor_name, changedEvent.actor_role, changedEvent.at], [b.dispatcher.id, b.dispatcher.name, 'dispatcher', at])
})

test('Desk requests, crew moves and assessments keep attributable promises through review, replay and Worker restart', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const b = await business(h)
  const viewer = await h.person('Window Viewer', 'viewer')
  const quoted = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const quotedPayload = { jobId: quoted.id, technicianId: b.priya.id, date: '2026-11-03', start: '09:00', end: '10:30', window }
  const replayId = 'synthetic-glove-window-book'
  const booked = await b.dispatcher.run('visit.book', quotedPayload, { commandId: replayId })
  assert.deepEqual(booked.arrivalWindow, window)
  const exactText = '9:00 AM – 10:30 AM (arrival window 8:00 AM – 10:00 AM)'
  assert.ok((await h.state()).events.find(e => e.subjectId === booked.id && e.kind === 'visit.booked').summary.includes(exactText))
  let changed = await b.dispatcher.run('visit.change', { visitId: booked.id, version: booked.version, start: '10:00', end: '11:00', reason: 'Keep morning promise' })
  assert.deepEqual(changed.arrivalWindow, window)
  await refuse(h, b.dispatcher.run, 'visit.change', { visitId: changed.id, version: changed.version, start: '10:01', end: '11:00', reason: 'Outside kept promise' }, 'WINDOW')
  const afternoon = { start: '12:00', end: '14:00' }
  changed = await b.dispatcher.run('visit.change', { visitId: changed.id, version: changed.version, start: '13:00', end: '14:30', window: afternoon, reason: 'New agreed window' })
  assert.deepEqual(changed.arrivalWindow, afternoon)
  changed = await b.dispatcher.run('visit.change', { visitId: changed.id, version: changed.version, window: null, reason: 'Remove promise' })
  assert.equal(changed.arrivalWindow, undefined)

  const crew = await h.command('crew.save', { name: 'Window crew', memberIds: [b.priya.id, b.tom.id] })
  const crewJob = await job(h, b, 'Crew service call')
  await b.dispatcher.run('visit.book', { jobId: crewJob.id, crewId: crew.id, date: '2026-11-04', start: '09:00', end: '10:30', window })
  const crewVisits = () => h.state().then(s => s.visits.filter(v => v.jobId === crewJob.id))
  assert.equal((await crewVisits()).length, 2)
  for (const v of await crewVisits()) assert.deepEqual([v.arrivalWindow, v.local.start, v.local.end], [window, '09:00', '10:30'])
  let lead = (await crewVisits())[0]
  lead = await b.dispatcher.run('visit.change', { visitId: lead.id, version: lead.version, start: '10:00', end: '11:00', reason: 'Move crew within promise' })
  for (const v of await crewVisits()) assert.deepEqual([v.arrivalWindow, v.local.start], [window, '10:00'])
  await refuse(h, b.dispatcher.run, 'visit.change', { visitId: lead.id, version: lead.version, start: '10:01', end: '11:00', reason: 'Outside crew promise' }, 'WINDOW')
  lead = await b.dispatcher.run('visit.change', { visitId: lead.id, version: lead.version, start: '13:00', end: '14:30', window: afternoon, reason: 'New crew promise' })
  for (const v of await crewVisits()) assert.deepEqual([v.arrivalWindow, v.local.start], [afternoon, '13:00'])
  await b.dispatcher.run('visit.change', { visitId: lead.id, version: lead.version, window: null, reason: 'Remove crew promise' })
  for (const v of await crewVisits()) assert.equal(v.arrivalWindow, undefined)

  const day = '2026-11-06'
  const loadJob = await job(h, b, 'Priya existing load')
  await b.dispatcher.run('visit.book', { jobId: loadJob.id, technicianId: b.priya.id, date: day, start: '07:00', end: '09:00' })
  const autos = [], payloads = []
  for (const [i, start, end, promised] of [[1,'10:00','11:00',window], [2,'10:00','11:00',{ start:'10:00',end:'12:00' }], [3,'12:00','13:00',{ start:'12:00',end:'14:00' }]]) {
    const enquiry = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: `Desk request ${i}` })
    const j = await b.office.run('job.create', { enquiryId: enquiry.id, title: `Desk request ${i}` })
    const payload = { jobId: j.id, technicianId: 'auto', date: day, start, end, window: promised }
    const v = await b.dispatcher.run('visit.book', payload, { commandId: `synthetic-glove-window-auto-${i}` })
    assert.deepEqual([v.arrivalWindow,v.local.start,v.local.end], [promised,start,end])
    assert.equal((await h.state()).enquiries.find(e => e.id === enquiry.id).wonJobId, j.id)
    autos.push(v); payloads.push(payload)
  }
  assert.deepEqual(autos.map(v => v.technicianId), [b.tom.id, b.priya.id, b.tom.id])
  assert.equal(autos[0].assignments[0].reason, 'Assigned automatically: Tom B. had the fewest booked minutes that day (Tom B. 0, Priya N. 120)')
  const override = { visitId: autos[2].id, version: autos[2].version, technicianId: b.priya.id, start:'10:30', end:'11:30', window:{ start:'10:00', end:'12:00' }, reason: 'Dispatcher override for known equipment' }
  const review = await refuse(h,b.dispatcher.run,'visit.change',override,'CONFLICT_REVIEW')
  const moved = await b.dispatcher.run('visit.change',{ ...override,acknowledge:review.details.conflicts.map(c=>c.code) })
  assert.deepEqual([moved.technicianId,moved.assignments.at(-1).reason,moved.assignments.at(-1).reviewedConflicts], [b.priya.id,override.reason,review.details.conflicts])
  const enquiry = await b.office.run('enquiry.create', { customerId:b.customer.id,siteId:b.site.id,source:'phone',description:'Assess replacement' })
  const assessmentPayload = { enquiryId:enquiry.id,technicianId:'auto',date:day,start:'15:00',end:'16:00',window:{ start:'14:00',end:'16:00' } }
  for (const run of [b.office.run,b.priyaPerson.run,viewer.run]) {
    await refuse(h,run,'visit.book',quotedPayload,'FORBIDDEN')
    await refuse(h,run,'assessment.book',assessmentPayload,'FORBIDDEN')
    await refuse(h,run,'visit.change',{ visitId:moved.id,version:moved.version,reason:'Unauthorized change' },'FORBIDDEN')
  }
  for (const technicianId of [b.tom.id, 'auto']) await refuse(h, b.dispatcher.run, 'assessment.book', { ...assessmentPayload, technicianId, start: '13:59' }, 'WINDOW')
  const assessment = await b.dispatcher.run('assessment.book',assessmentPayload,{ commandId:'synthetic-glove-window-assessment' })
  assert.deepEqual([assessment.visit.technicianId,assessment.visit.arrivalWindow,assessment.visit.local.start,assessment.visit.local.end],[b.tom.id,assessmentPayload.window,'15:00','16:00'])
  assert.deepEqual((await b.tomPerson.state()).visits.find(v=>v.id===assessment.visit.id).arrivalWindow,assessmentPayload.window)
  const before = await h.state()
  await h.restart()
  assert.deepEqual(await h.state(),before)
  assert.deepEqual(await b.dispatcher.run('visit.book',quotedPayload,{ commandId:replayId }),booked)
  for (let i=0;i<autos.length;i++) assert.deepEqual(await b.dispatcher.run('visit.book',payloads[i],{ commandId:`synthetic-glove-window-auto-${i+1}` }),autos[i])
  assert.deepEqual(await b.dispatcher.run('assessment.book',assessmentPayload,{ commandId:'synthetic-glove-window-assessment' }),assessment)
  assert.deepEqual(await h.state(),before)
  await h.command('role.set',{ operatorId:b.dispatcher.id,role:'viewer' })
  await refuse(h,b.dispatcher.run,'visit.book',quotedPayload,'FORBIDDEN',{ commandId:replayId })
  await h.command('role.set',{ operatorId:b.dispatcher.id,role:'dispatcher' })
  const activity=[]; let cursor
  do {
    const page=await h.request(`/api/glove/activity${cursor ? `?before=${cursor}`:''}`).then(r=>r.json())
    activity.push(...page.events); cursor=page.next
  } while(cursor)
  const exported=await h.request('/api/glove/export').then(r=>r.json())
  for (const v of [...autos,assessment.visit,booked]) {
    const event=activity.find(e=>e.subjectId===v.id && e.kind==='visit.booked')
    assert.deepEqual([event.actorId,event.actorName,event.actorRole,event.at],[b.dispatcher.id,b.dispatcher.name,'dispatcher',at])
    assert.ok(event.summary.includes('arrival window'))
    if (v.assignments[0].reason.startsWith('Assigned automatically')) assert.ok(event.summary.includes(v.assignments[0].reason.split('; ')[0].toLowerCase()))
    const trail=exported.timeline.find(e=>e.id===event.id)
    assert.deepEqual([trail.summary,trail.actor_id,trail.actor_name,trail.actor_role,trail.at],[event.summary,b.dispatcher.id,b.dispatcher.name,'dispatcher',at])
  }
  for (const v of before.visits) {
    const saved=exported.visits.find(x=>x.id===v.id)
    assert.deepEqual(saved.arrivalWindow,v.arrivalWindow)
    assert.deepEqual(saved.assignments,v.assignments)
  }
  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
  await h.restart()
  await refuse(h,b.dispatcher.run,'visit.book',quotedPayload,'ERASED',{ commandId:replayId })
  await refuse(h,b.dispatcher.run,'assessment.book',assessmentPayload,'ERASED',{ commandId:'synthetic-glove-window-assessment' })
  const signedOut = await h.request('/auth/signout', { method:'POST',as:b.dispatcher.cookie,body:{} })
  assert.equal(signedOut.status,204)
  const afterSignout = await h.state()
  const revoked = await h.request('/api/glove/commands', { method:'POST',as:b.dispatcher.cookie,body:{ commandId:'synthetic-glove-window-revoked',type:'visit.book',payload:quotedPayload } })
  assert.equal(revoked.status,401)
  assert.deepEqual(await h.state(),afterSignout)
})

test('Automatic assignment excludes every conflict under owner warn and refuse rules and breaks equal load by name', async t => {
  const h=await installation({ at }); t.after(()=>h.close())
  const b=await business(h)
  const site=await h.command('site.save',{ customerId:b.customer.id,address:'100 Window Street, Chicago IL 60601' })
  const service=await h.command('service.save',{ code:'WINDOW-GAS',name:'Gas inspection',unitPrice:'20.00',tax:'GST',requiredSkills:['gas'] })
  const j=await b.dispatcher.run('job.create',{ customerId:b.customer.id,siteId:site.id,title:'Eligible automatic gas inspection',lines:[{ serviceId:service.id,description:'Gas inspection',quantity:'1',unitPrice:'20.00' }] })
  // The earlier-created eligible technician sorts last, so insertion order cannot satisfy the tie.
  for (const tech of [b.priya,b.tom]) await h.command('technician.save',{ ...tech,name:tech.id===b.priya.id ? 'Zoe eligible' : 'Bea eligible',skills:['gas'],zips:['60601'] })
  const base={ skills:['gas'],zips:['60601'] }
  const wrongBranch=await h.command('branch.save',{ name:'Other branch',prefix:'OTH',timezone:'America/Chicago',zips:[] })
  const excluded=[]
  for (const [name,extra] of [
    ['A inactive',{ active:false }], ['A other branch',{ branchId:wrongBranch.id }],
    ['A no skill',{ skills:[] }], ['A out of area',{ zips:['60602'] }],
    ['A time off',{ timeOff:[{ from:'2026-11-10',to:'2026-11-10',reason:'Away' }] }],
    ['A outside hours',{ hours:[{ day:'tue',start:'13:00',end:'17:00' }] }],
    ['A calendar busy',{}], ['A existing visit',{}],
  ]) excluded.push(await h.command('technician.save',{ name,...base,...extra }))
  const calendar=excluded.find(x=>x.name==='A calendar busy')
  const url='https://calendar.google.com/calendar/ical/synthetic-glove-601/basic.ics'
  h.calendars.set(url,['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','DTSTART:20261109T220000Z','DTEND:20261109T230000Z','END:VEVENT','END:VCALENDAR'].join('\r\n'))
  await h.command('technician.calendar',{ technicianId:calendar.id,url })
  await b.dispatcher.run('technician.calendarRead',{ technicianId:calendar.id })
  await b.dispatcher.run('visit.book',{ jobId:j.id,technicianId:excluded.at(-1).id,date:'2026-11-10',start:'09:00',end:'10:00' })
  const payload={ jobId:j.id,technicianId:'auto',date:'2026-11-10',start:'09:00',end:'10:00',window }
  for (const mode of ['warn','refuse']) {
    await h.command('business.save',{ ...(await h.state()).business[0],eligibility:{ skills:mode,area:mode,availability:mode } })
    const first=await b.dispatcher.run('visit.book',payload)
    assert.equal(first.technicianId,b.tom.id,'exact zero-minute tie is resolved by name rather than creation order, excluding every earlier invalid name')
    assert.equal(first.assignments[0].reason,'Assigned automatically: Bea eligible had the fewest booked minutes that day (Bea eligible 0, Zoe eligible 0)')
    const second=await b.dispatcher.run('visit.book',payload)
    assert.equal(second.technicianId,b.priya.id)
    assert.equal(second.assignments[0].reason,'Assigned automatically: Zoe eligible had the fewest booked minutes that day (Zoe eligible 0)')
    const unavailable=await refuse(h,b.dispatcher.run,'visit.book',payload,'NO_TECHNICIAN')
    assert.equal(unavailable.message,'No technician is free without a conflict at that time; choose one and review the conflicts.')
    for (const v of [first,second]) await b.dispatcher.run('visit.cancel',{ visitId:v.id,version:v.version,reason:'Release test appointment' })
  }
  const before=await h.state(); await h.restart(); assert.deepEqual(await h.state(),before)
  const again=await b.dispatcher.run('visit.book',payload)
  assert.equal(again.technicianId,b.tom.id)
  assert.equal(again.assignments[0].reason,'Assigned automatically: Bea eligible had the fewest booked minutes that day (Bea eligible 0, Zoe eligible 0)')
})

test('Series creation, dated revisions and the clock-pinned rolling horizon never create arrival promises', async t => {
  const h=await installation({ at }); t.after(()=>h.close())
  const b=await business(h), j=await job(h,b,'Recurring visits without promises')
  let series=await b.dispatcher.run('series.create',{ jobId:j.id,version:j.version,technicianId:b.priya.id,date:'2026-11-02',start:'09:00',end:'10:00',rule:{ unit:'week' },horizonDays:10,window })
  const visits=()=>h.state().then(s=>s.visits.filter(v=>v.jobId===j.id))
  assert.deepEqual((await visits()).map(v=>v.local.date).sort(),['2026-11-02','2026-11-09'])
  for (const v of await visits()) assert.equal(v.arrivalWindow,undefined)
  series=await b.dispatcher.run('series.change',{ jobId:j.id,version:series.version,from:'2026-11-09',start:'11:00',end:'12:00',reason:'Dated series revision',window:{ start:'10:00',end:'12:00' } })
  const revised=(await visits()).filter(v=>v.status==='booked')
  assert.deepEqual(revised.map(v=>[v.local.date,v.local.start]).sort(),[['2026-11-02','09:00'],['2026-11-09','11:00']])
  for (const v of await visits()) assert.equal(v.arrivalWindow,undefined)
  await h.setTime('2026-11-08T00:00:00.000Z')
  await b.office.run('customer.save',{ name:'Roll horizon through a real later command' })
  assert.deepEqual((await visits()).filter(v=>v.status==='booked').map(v=>v.local.date).sort(),['2026-11-02','2026-11-09','2026-11-16'])
  for (const v of await visits()) {
    assert.equal(v.arrivalWindow,undefined)
    assert.ok(v.assignments.every(a=>a.arrivalWindow===undefined))
  }
  const before=await h.state(); await h.restart(); assert.deepEqual(await h.state(),before)
})
