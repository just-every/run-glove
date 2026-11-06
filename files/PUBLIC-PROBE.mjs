import { installation } from '/home/agent/rer-consolidation/work/sx-glove-c-f115/run-glove/tests/api/harness.mjs'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
console.error('PROBE_STAGE installation'); const h = await installation(); console.error('PROBE_STAGE installed'); await h.setTime('2026-11-06T15:00:00.000Z')
const receipt={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),point:'MONEY-001 point 5',door:['business.save','site.save','quote.draft','quote.approve','quote.revise','state','activity','export'],refusals:[],choices:[]}
try {
 await h.command('business.save',{name:'Synthetic Glove Tax Probe',timezone:'America/Chicago',taxSettings:{jurisdictions:[{id:'city',name:'City combined',rate:'8.25',zips:['78704'],taxLabor:false},{id:'district',name:'District combined',rate:'6.5',zips:['78704'],taxLabor:true}]}})
 const material=await h.command('service.save',{code:'synthetic-glove-1',name:'Probe part',kind:'material',unitPrice:'100.01',tax:'TAXABLE'})
 const labor=await h.command('service.save',{code:'synthetic-glove-2',name:'Probe labor',kind:'service',unitPrice:'50.03',tax:'TAXABLE'})
 const lines=[material,labor].map(x=>({description:x.name,serviceId:x.id,quantity:'1',unitPrice:x.unitPrice}))
 const customer=await h.command('customer.save',{name:'Synthetic Glove Probe Customer'})
 for(const [zip,why] of [['78704','overlap'],['99999','unmatched']]) {
  let site=await h.command('site.save',{customerId:customer.id,address:`20 Service St, Austin TX ${zip}`})
  const before=await h.state()
  const refusal=await h.command('quote.draft',{customerId:customer.id,siteId:site.id,title:'Synthetic tax choice',lines},{error:'TAX_JURISDICTION'})
  const after=await h.state()
  for(const key of ['quotes','sites','business','approvals','events']) assert.deepEqual(after[key],before[key])
  receipt.refusals.push({zip,why,code:refusal.code,message:refusal.message,unchanged:true,savedQuotes:after.quotes.length-before.quotes.length})
  site=await h.command('site.save',{...site,taxJurisdictionId:'city'})
  let quote=await h.command('quote.draft',{customerId:customer.id,siteId:site.id,title:'Synthetic tax choice',lines})
  quote=await h.command('quote.approve',{quoteId:quote.id,version:quote.version,revision:1})
  const original=structuredClone(quote.revisions[0])
  assert.deepEqual([original.totals.taxContext.jurisdictionId,original.totals.taxContext.rate,original.totals.gst,original.totals.total],['city','8.25','8.25','158.29'])
  site=await h.command('site.save',{...site,taxJurisdictionId:'district'})
  quote=await h.command('quote.revise',{quoteId:quote.id,version:quote.version,lines})
  assert.deepEqual(quote.revisions[0],original)
  assert.deepEqual([quote.revisions[1].totals.taxContext.jurisdictionId,quote.revisions[1].totals.taxContext.rate,quote.revisions[1].totals.gst,quote.revisions[1].totals.total],['district','6.5','9.75','159.79'])
  receipt.choices.push({zip,siteId:site.id,quoteId:quote.id,first:original.totals,second:quote.revisions[1].totals,earlierRevisionUnchanged:true})
 }
 console.error('PROBE_STAGE restart'); const before=await h.state()
 await h.restart()
 const after=await h.state()
 for(const key of ['quotes','sites','business','approvals','events']) assert.deepEqual(after[key],before[key])
 receipt.restartUnchanged=true
 const activity=await h.request('/api/glove/activity').then(r=>r.json())
 const exported=await h.request('/api/glove/export').then(r=>r.json())
 for(const row of receipt.choices) {
  const events=activity.events.filter(e=>e.kind==='site.saved'&&e.subjectId===row.siteId)
  assert.equal(events.length,3)
  for(const e of events) {
   assert.equal(e.actorName,'Olivia Owner'); assert.equal(e.actorRole,'owner'); assert.equal(e.at,'2026-11-06T15:00:00.000Z'); assert.ok(e.commandId)
   const out=exported.timeline.find(x=>x.id===e.id)
   assert.deepEqual([out.actor_id,out.actor_name,out.actor_role,out.at,out.command_id,out.subject_id],[e.actorId,e.actorName,e.actorRole,e.at,e.commandId,e.subjectId])
  }
 }
 receipt.attributedSiteEvents=6
 assert.equal(h.stripeTax.calls.length+h.avatax.calls.length,0)
 receipt.taxProviderRequests=0; receipt.result='pass'
 console.log(JSON.stringify(receipt,null,2))
} finally {await h.close()}