import { readFile, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { chromium } from '/workspace/glove-candidate/node_modules/@playwright/test/index.mjs'
import { installation, business } from '/workspace/glove-candidate/tests/api/harness.mjs'
import { execFileSync } from 'node:child_process'
const packet = process.env.HOME + '/rer-consolidation/work/sx-glove-c-f219-pc1/packet'
const at = '2026-10-22T10:20:00.000Z', day = at.slice(0,10)
const head = execFileSync('git',['rev-parse','HEAD'],{cwd:'/workspace/glove-candidate',encoding:'utf8'}).trim()
const runtimeLog = await readFile('/tmp/glove-candidate-dev.log','utf8')
const entry = runtimeLog.match(/^RER_OPEN\s+(\S+)/m)?.[1]
assert.ok(entry, 'The owned dev runtime supplied its private owner entry')
const origin = new URL(entry).origin
const h = await installation({ at })
let browser, context, currentPage
try {
 const b = await business(h, { timezone: 'UTC' })
 h.maps.places.set(b.site.address, { lat: 41.8789, lng: -87.6359 })
 await h.command('maps.connect', { key: 'synthetic-glove-219' })
 await b.dispatcher.run('site.locate', { siteIds: [b.site.id] })
 const job = async title => b.dispatcher.run('job.create', { customerId:b.customer.id,siteId:b.site.id,title })
 const earlierJob = await job('Long-running morning service'), nextJob = await job('Next customer visit')
 const earlier = await b.dispatcher.run('visit.book',{jobId:earlierJob.id,technicianId:b.priya.id,date:day,start:'09:00',end:'10:00'})
 const next = await b.dispatcher.run('visit.book',{jobId:nextJob.id,technicianId:b.priya.id,date:day,start:'10:20',end:'11:20',window:{start:'10:00',end:'12:00'}})
 await b.priyaPerson.run('visit.arrive',{visitId:earlier.id,deviceTime:earlier.startAt})
 const before = await h.state()
 const watch = await h.request('/api/glove/delays?at='+at).then(r=>r.json())
 const risk = watch.risks.find(r=>r.visitId===next.id)
 assert.ok(risk)
 assert.equal(risk.options.at(-1).start,'10:45')
 assert.deepEqual(await h.state(),before)
 browser = await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-mock-keychain','--password-store=basic']})
 context = await browser.newContext({viewport:{width:1440,height:1000}})
 const page = await context.newPage(); currentPage = page
 page.on('response',response=>{if(new URL(response.url()).pathname==='/__dev/key')console.log('Owner exchange response',response.status())})
 await page.goto(entry)
 await page.waitForURL(u=>u.pathname!=='/__dev/key'&&!u.hash.includes('rer-dev'))
 if(!['/app','/setup'].includes(new URL(page.url()).pathname)) await page.goto(origin+'/app')
 await page.waitForURL(u=>['/app','/setup'].includes(u.pathname))
 if(new URL(page.url()).pathname==='/setup') {
  await page.getByRole('checkbox').check()
  await page.getByRole('button',{name:'Finish setup',exact:true}).click()
  await page.waitForURL(u=>u.pathname==='/app')
 }
 await page.clock.install({time:new Date(at)})
 await context.route(origin+'/api/glove/**', async route=>{
  const req=route.request(),url=new URL(req.url())
  const path=url.pathname==='/api/glove/delays'?url.pathname+'?at='+at:url.pathname+url.search
  const response=await h.request(path,{method:req.method(),...(req.postData()?{body:JSON.parse(req.postData())}:{})})
  await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())})
 })
 await page.goto(origin+'/app#dispatch')
 await page.reload()
 await page.getByLabel('Day',{exact:true}).fill(day)
 const card=page.getByRole('region',{name:'Location delay watch',exact:true})
 await card.waitFor({state:'visible'})
 assert.match(await card.innerText(),/20 min past its booked end; expected free about 10:40/)
 assert.match(await card.innerText(),/Tom B\. is free at the same time/)
 assert.match(await card.innerText(),/Priya N\. later, inside the arrival window/)
 const samples=[]
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:1000})
  await card.scrollIntoViewIfNeeded()
  await page.screenshot({path:packet+'/'+width+'-dispatch-delay-card.png'})
  samples.push({width,file:width+'-dispatch-delay-card.png',cardText:await card.innerText()})
 }
 await writeFile(packet+'/browser-receipt.json',JSON.stringify({head,at,door:'/app#dispatch',read:'/api/glove/delays?at='+at,visitId:next.id,expectedFree:'10:40',offeredOwnStart:'10:45',assertionWidth:1440,samples},null,2)+'\n')
 console.log('Dispatch delay card proof passed at 1440; captured at 1440 and 390. head='+head)
} catch(error) {
 if(currentPage) { console.log('Failure page path',new URL(currentPage.url()).pathname);console.log('Failure page text',(await currentPage.locator('body').innerText()).slice(0,1800)) }
 throw error
} finally {
 if(context) {await context.unrouteAll({behavior:'wait'});await context.close()}
 if(browser) await browser.close()
 await h.close()
}
