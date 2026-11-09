import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { commissionInstallation } from '/workspace/run-glove/tests/fixtures/payroll-installation.mjs'
import { commissionFixture, commissionKinds, commissionFile, commissionJson } from '/workspace/run-glove/tests/fixtures/payroll-commissions.mjs'
const h = await commissionInstallation()
const result = { schema: 1, clause: 'TEAM-006', probes: [] }
const hash = x => createHash('sha256').update(x).digest('hex')
try {
 const f = await commissionFixture(h)
 const json = () => h.request(commissionJson).then(r => r.json())
 const sheet = () => h.request('/api/glove/timesheets?week=2026-11-02').then(r => r.json()).then(x => x.timesheets.find(x => x.technicianId === f.priya.id))
 const approval = await sheet()
 const before = (await json()).people.find(x => x.technicianId === f.priya.id).commission.total
 await f.sold('2026-11-04', f.priya, '1234.50', '5%', '61.73')
 const after = (await json()).people.find(x => x.technicianId === f.priya.id).commission.total
 assert.equal(before, '0.00'); assert.equal(after,'61.73'); assert.deepEqual(await sheet(),approval)
 await h.command('payroll.settings', { commissions: { from:'2026-11-09', soldPercent:'10', completedPercent:'25', agreementSpiff:'40' } })
 await f.finish()
 const run = await json(), p = run.people.find(x => x.technicianId === f.priya.id), t = run.people.find(x => x.technicianId === f.tom.id)
 result.probes.push({ point:1, door:commissionJson, observed:{before,after,approvalUnchanged:true,sold:p.commission.items.filter(x=>x.kind==='sold').map(x=>({date:x.date,rate:x.rate,amount:x.amount}))} })
 const files={}
 for (const kind of commissionKinds) { const r=await h.request(commissionFile(kind)); assert.equal(r.status,200); files[kind]=await r.text() }
 assert.ok(files.gusto.includes('2026-11-16 - 2026-11-22,0.00,0.00,0.00,80.00'))
 assert.ok(files['adp-run'].includes('304,COMM,,221.75'))
 assert.ok(files.quickbooks.includes('Priya N.,11/04/2026,Commission,,111.74'))
 result.probes.push({ point:2, door:'three payroll CSV routes', observed:{rows:Object.fromEntries(Object.entries(files).map(([kind,text])=>[kind,text.trimEnd().split('\r\n').length])),commissionOnlyWeek:'80.00',adpDefault:'COMM',blankPayHours:true} })
 assert.deepEqual(run.left.map(x=>x.reason).sort(),['1099 subcontractor: paid through the 1099-NEC totals, not payroll','commissions of $60.00 but no approved time in the period'].sort())
 result.probes.push({point:3,door:commissionJson,observed:{people:run.people.map(x=>x.name).sort(),left:run.left.map(({name,reason})=>({name,reason}))}})
 assert.equal(p.commission.total,'221.75'); assert.equal(t.commission.total,'135.02')
 assert.equal(p.commission.completed.amount,'25.01'); assert.equal(t.commission.completed.amount,'25.00')
 result.probes.push({point:4,door:commissionJson,observed:run.people.map(x=>({name:x.name,sold:x.commission.sold,completed:x.commission.completed,agreements:x.commission.agreements,total:x.commission.total,items:x.commission.items.length}))})
 const state=await h.state(); assert.deepEqual(state.payments,[])
 await h.restart(); assert.deepEqual(await json(),run)
 for(const kind of commissionKinds) assert.equal(await h.request(commissionFile(kind)).then(r=>r.text()),files[kind])
 assert.deepEqual(await h.state(),state)
 result.probes.push({point:5,door:'payroll reads and actual Worker restart',observed:{payments:0,businessStateUnchanged:true,jsonIdentical:true,files:Object.fromEntries(Object.entries(files).map(([kind,text])=>[kind,{sha256:hash(text),bytes:Buffer.byteLength(text)}])),providerAcceptance:'not run'}})
 result.exit=0
} finally { await h.close() }
await writeFile('/home/agent/rer-consolidation/work/sx-glove-c-f215/packet/probes.json',JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result))
