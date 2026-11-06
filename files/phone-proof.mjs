import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
const root = '/workspace/run-glove'
const require = createRequire(join(root, 'package.json'))
const { chromium } = require('@playwright/test')
const { Miniflare, convertV4MiniflareOptions } = require('miniflare')
const { unstable_splitSqlQuery } = require('wrangler')
const { installation, business, acceptedQuote } = await import(pathToFileURL(join(root, 'tests/api/harness.mjs')))
const packet = join(process.env.HOME, 'rer-consolidation/work/sx-glove-c-f111-pc1/packet')
const h = await installation()
let worker, server, browser
const outputs = []
try {
 const b = await business(h)
 const quote = await acceptedQuote(h,b,'Synthetic nameplate service')
 const job = await b.dispatcher.run('job.create',{quoteId:quote.id})
 const visit = await b.dispatcher.run('visit.book',{jobId:job.id,technicianId:b.priya.id,date:'2026-10-20',start:'09:00',end:'10:00'})
 await b.priyaPerson.run('visit.arrive',{visitId:visit.id,deviceTime:'2026-10-19T22:05:00Z'})
 await h.command('model.connect',{url:'https://models.example.test/v1',model:'synthetic-glove-111',key:'synthetic-glove-112'})
 h.models.answer = () => ({make:'Synthetic make',model:'Synthetic model',serial:'',manufactured:'2026-02-99'})
 const config=JSON.parse(await readFile(join(root,'dist/server/wrangler.json'),'utf8'))
 worker=new Miniflare(convertV4MiniflareOptions({host:'127.0.0.1',upstream:'https://127.0.0.1',modulesRoot:join(root,'dist/server'),modules:[config.main,...(await readdir(join(root,'dist/server/assets'))).filter(f=>f.endsWith('.js')).map(f=>'assets/'+f)].map(file=>({type:'ESModule',path:join(root,'dist/server',file)})),compatibilityDate:config.compatibility_date,compatibilityFlags:config.compatibility_flags,d1Databases:{DB:'synthetic-glove-doc'},bindings:{AUTH_LOCAL:'false',AUTH_ORIGIN:'https://127.0.0.1',OWNER_EMAIL:['synthetic-glove-1','example.test'].join('@'),SESSION_SECRET:'synthetic-glove-114-synthetic-glove-115',SETUP_TOKEN:'synthetic-glove-116-synthetic-glove-117'},outboundService:()=>{throw Error('Unexpected document provider request')}}))
 const docOrigin=await worker.ready
 const db=await worker.getD1Database('DB')
 for(const file of (await readdir(join(root,'migrations/core'))).filter(f=>f.endsWith('.sql')).sort()) await db.batch(unstable_splitSqlQuery(await readFile(join(root,'migrations/core',file),'utf8')).map(q=>db.prepare(q)))
 const boot=await fetch(new URL('/auth/bootstrap',docOrigin),{redirect:'manual',method:'POST',headers:{origin:'https://127.0.0.1','content-type':'application/json'},body:JSON.stringify({token:'synthetic-glove-116-synthetic-glove-117',displayName:'Synthetic owner'})})
 assert.equal(boot.status,303)
 const docCookie=boot.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ')
 const setupResponse=await fetch(new URL('/setup',docOrigin),{redirect:'manual',method:'POST',headers:{origin:'https://127.0.0.1','content-type':'application/x-www-form-urlencoded',cookie:docCookie},body:'confirm=yes'})
 assert.equal(setupResponse.status,303)
 const types={'.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.webmanifest':'application/manifest+json'}
 server=createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://127.0.0.1')
  if(url.pathname.startsWith('/api/glove/') || url.pathname.startsWith('/auth/')) {
   const chunks=[];for await(const chunk of req)chunks.push(chunk)
   const text=Buffer.concat(chunks).toString()
   const result=await h.request(url.pathname+url.search,{method:req.method,as:b.priyaPerson.cookie,...(text?{body:JSON.parse(text)}:{})})
   res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return
  }
  if(extname(url.pathname)) {const bytes=await readFile(join(root,'dist/client',url.pathname));res.writeHead(200,{'content-type':types[extname(url.pathname)]??'application/octet-stream'});res.end(bytes);return}
  console.log('DOC_START',url.pathname)
  const result=await fetch(new URL(url.pathname,docOrigin),{redirect:'manual',headers:{cookie:docCookie}})
  console.log('DOC_STATUS',result.status)
  const html=await result.text()
  console.log('DOC_BODY_BYTES',html.length)
  const responseHeaders=new Headers(result.headers)
  for(const name of ['content-encoding','content-length','transfer-encoding']) responseHeaders.delete(name)
  res.writeHead(result.status,Object.fromEntries(responseHeaders));res.end(html)
 }catch(error){console.error(error.message);res.writeHead(500);res.end('Synthetic proof server error')}})
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
 const origin=`http://127.0.0.1:${server.address().port}`
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']})
 await mkdir(join(packet,'screenshots'),{recursive:true})
 for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:1050}}),page=await context.newPage()
  page.setDefaultTimeout(15000)
  page.on('pageerror',e=>console.error('PAGE_ERROR',e.message))
  await page.goto(origin+'/app',{waitUntil:'domcontentloaded'})
  console.log('PHONE_INITIAL',page.url(),(await page.locator('body').innerText()).slice(0,500))
  await page.screenshot({path:join(packet,`screenshots/${width}-initial.png`)})
  await page.getByRole('button',{name:new RegExp(job.number)}).click()
  const card=page.getByRole('region',{name:'Nameplate',exact:true})
  const canvas=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=32;c.height=32;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,32,32);x.fillStyle='black';x.fillText('MFG',0,20);return c.toDataURL('image/png').split(',')[1]})
  const response=page.waitForResponse(r=>r.url()===origin+'/api/glove/commands'&&r.request().postDataJSON()?.type==='nameplate.read')
  await card.locator('input[type=file]').setInputFiles({name:'synthetic-glove-113.png',mimeType:'image/png',buffer:Buffer.from(canvas,'base64')})
  const body=await(await response).json();assert.equal(body.ok,true,JSON.stringify(body.error))
  await card.getByLabel('Manufactured (YYYY, YYYY-MM or YYYY-MM-DD)',{exact:true}).waitFor()
  assert.equal(await card.getByLabel('Manufactured (YYYY, YYYY-MM or YYYY-MM-DD)',{exact:true}).inputValue(),'')
  assert.match(await card.innerText(),/Not legible on the photo: serial, manufactured/)
  await card.scrollIntoViewIfNeeded()
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  await card.screenshot({path:join(packet,`screenshots/${width}-nameplate-unread.png`)})
  outputs.push(`PROBE FIELD-011 date normalization ${width}: native nameplate.read with model date 2026-02-99 -> successful review, manufactured blank and labelled unread; no equipment created`)
  const before=(await h.state()).equipment
  await card.getByLabel('Equipment type',{exact:true}).fill('Synthetic unit')
  await card.getByLabel('Manufactured (YYYY, YYYY-MM or YYYY-MM-DD)',{exact:true}).fill('2026-02-99')
  const refused=page.waitForResponse(r=>r.url()===origin+'/api/glove/commands'&&r.request().postDataJSON()?.type==='nameplate.confirm')
  await card.getByRole('button',{name:'Confirm nameplate',exact:true}).click()
  const refusal=await(await refused).json();assert.equal(refusal.error.code,'INPUT')
  await card.getByRole('alert').waitFor()
  assert.deepEqual((await h.state()).equipment,before)
  outputs.push(`PROBE FIELD-011 corrective refusal ${width}: real review controls submit 2026-02-99 -> INPUT with equipment unchanged`)
  await card.getByLabel('Manufactured (YYYY, YYYY-MM or YYYY-MM-DD)',{exact:true}).fill('2024-02-29')
  const confirmed=page.waitForResponse(r=>r.url()===origin+'/api/glove/commands'&&r.request().postDataJSON()?.type==='nameplate.confirm')
  await card.getByRole('button',{name:'Confirm nameplate',exact:true}).click()
  const confirmation=await(await confirmed).json();assert.equal(confirmation.ok,true)
  assert.equal(confirmation.result.manufacturedOn,'2024-02-29')
  await h.restart()
  assert.equal((await h.state()).equipment.find(e=>e.id===confirmation.result.id).manufacturedOn,'2024-02-29')
  outputs.push(`PROBE FIELD-011 confirmation ${width}: real review controls submit 2024-02-29 -> exact saved date retained after Worker restart`)
  await context.close()
 }
 const state=await h.state()
 assert.equal(state.equipment.length,2)
 assert.ok(h.models.calls.every(call=>call.body.store===false&&!JSON.stringify(call.body).includes(b.customer.name)))
 console.log(outputs.join('\n'))
 console.log('PHONE_PROOF passed')
}finally{
 await browser?.close()
 if(server)await new Promise(resolve=>server.close(resolve))
 await worker?.dispose()
 await h.close()
}
