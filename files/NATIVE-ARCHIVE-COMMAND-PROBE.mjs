import { twilioEdge } from '../tests/fixtures/twilio.mjs'
// Leave with everything: a real installation (rer setup + rer dev) runs a
// job from quote to field evidence and a ServiceM8 move-in, `rer export`
// writes the archive, `rer import` restores it into a fresh checkout, and the
// restored installation has the same records, timeline, photos, command
// outcomes and move-in journal, and keeps working. Every child process and
// scratch folder is owned here and removed in finally.
import assert from 'node:assert/strict'
import { stopOwnedRuntime } from '../tests/owned-processes.mjs'
import { spawn } from 'node:child_process'
import { mkdtemp, cp, rm, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { devInstallation } from '../tests/dev-installation.mjs'
import { exportedFixture } from '../tests/fixtures/movein.mjs'
import { randomUUID, createHash, createHmac } from 'node:crypto'
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { editionArchivePolicy } from '../tests/fixtures/edition-archive-policy.mjs'

const workspace = resolve('.'), parent = await mkdtemp(join(tmpdir(), 'glove-portable-')), children = new Set()
const excluded = new Set(['.git', 'node_modules', '.wrangler', '.rer', '.seed', '.cache', '.tanstack', 'dist', 'exports', 'test-results', 'playwright-report'])
const clean = s => s.replace(/RER_OPEN[^\n]*/g, 'RER_OPEN [private]').replace(/token=[^\s"&<>]+/g, 'token=[private]').replace(/rer-dev=[^\s"&<>]+/g, 'rer-dev=[private]')
const fixture = 'tests/fixtures/servicem8-small-hvac/'
const jpeg = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex').toString('base64')
// Keep transport counts outside every installation and its temporary setup
// Worker; an import or startup attempt must not disappear on the next start.
const stripePosts = new Map(), marketingCalls = new Map(), calendarCalls = new Map()
const recorder = createServer((request, response) => {
  const name = new URL(request.url, 'http://localhost').pathname.slice(1)
  if (name.startsWith('calendar-')) {
    let data = ''
    request.on('data', chunk => { data += chunk })
    request.on('end', () => {
      if (request.method === 'POST') calendarCalls.set(name, [...(calendarCalls.get(name) ?? []), JSON.parse(data)])
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({ calls: calendarCalls.get(name) ?? [] }))
    })
    return
  }
  if (name.startsWith('marketing-')) {
    let data = ''
    request.on('data', chunk => { data += chunk })
    request.on('end', () => {
      if (request.method === 'POST') marketingCalls.set(name, [...(marketingCalls.get(name) ?? []), JSON.parse(data)])
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({ calls: marketingCalls.get(name) ?? [] }))
    })
    return
  }
  if (request.method === 'POST') stripePosts.set(name, (stripePosts.get(name) ?? 0) + 1)
  response.setHeader('content-type', 'application/json')
  response.end(JSON.stringify({ posts: stripePosts.get(name) ?? 0 }))
})
await new Promise((resolve, reject) => { recorder.once('error', reject); recorder.listen(0, '127.0.0.1', resolve) })
recorder.unref()
const recorderOrigin = `http://127.0.0.1:${recorder.address().port}`

async function copy(name) {
  const root = join(parent, name)
  await cp(workspace, root, { recursive: true, filter: path => { const rel = path.slice(workspace.length + 1); return !excluded.has(rel.split('/')[0]) && !rel.startsWith('.dev.vars') && !rel.startsWith('.env') } })
  // Replace only Stripe transport in the scratch entry; never ship a fake.
  if (name.startsWith('payment-')) {
    for (const file of ['portable-stripe.mjs', 'stripe-payments.mjs', 'saved-cards-edge.mjs']) await cp(join(root, 'tests/fixtures', file), join(root, 'src', file))
    const entry = join(root, 'src/server.ts')
    const code = await readFile(entry, 'utf8')
    await writeFile(entry, "import { portableStripe } from './portable-stripe.mjs'\n" + code.replace('export default withDemo({', 'export default portableStripe(withDemo({').replace('} satisfies ExportedHandler<Bindings>, { seed: seedDemo })', `} satisfies ExportedHandler<Bindings>, { seed: seedDemo }), ${JSON.stringify(recorderOrigin + '/' + name)})`))
  }
  if (!name.startsWith('payment-')) {
    for (const file of ['portable-maps.mjs', 'maps.mjs']) await cp(join(root, 'tests/fixtures', file), join(root, 'src', file))
    const entry = join(root, 'src/server.ts'), code = await readFile(entry, 'utf8')
    await writeFile(entry, "import { portableMaps } from './portable-maps.mjs'\n" + code.replace('export default withDemo({', 'export default portableMaps(withDemo({').replace('} satisfies ExportedHandler<Bindings>, { seed: seedDemo })', '} satisfies ExportedHandler<Bindings>, { seed: seedDemo }))'))
  }
  if (!name.startsWith('payment-')) {
    // Only Mango and Mailchimp transport changes in these owned scratch Workers.
    const entry = join(root, 'src/server.ts'), code = await readFile(entry, 'utf8')
    await writeFile(join(root, 'src/portable-marketing.mjs'), `
export function portableMarketing(worker) {
  const upstream = globalThis.fetch
  globalThis.fetch = async (input, options) => {
    const request = new Request(input, options)
    if (new URL(request.url).origin !== 'https://mango.example.test' && new URL(request.url).origin !== 'https://us21.api.mailchimp.com') return upstream(input, options)
    await upstream(${JSON.stringify(recorderOrigin + '/marketing-' + name)}, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: request.url, method: request.method, body: await request.json() }) })
    return Response.json({ ok: true })
  }
  return worker
}
`)
    await writeFile(entry, "import { portableMarketing } from './portable-marketing.mjs'\n" + code.replace('export default portableMaps(', 'export default portableMarketing(portableMaps(').replace('} satisfies ExportedHandler<Bindings>, { seed: seedDemo }))', '} satisfies ExportedHandler<Bindings>, { seed: seedDemo })))'))
  }
  if (!name.startsWith('payment-')) {
    // The real archive journey replaces only calendar network transport in its owned Worker.
    await cp(join(root, 'tests/fixtures/calendars.mjs'), join(root, 'src/calendars.mjs'))
    await writeFile(join(root, 'src/portable-calendars.mjs'), `
import { calendarEdge } from './calendars.mjs'
export function portableCalendars(worker) {
  const upstream = globalThis.fetch, edge = calendarEdge()
  let uncertain = false
  edge.writeReply = ({ body, id }) => uncertain ? Response.json({}) : Response.json({ ...body, id })
  globalThis.fetch = async (input, options) => {
    const request = new Request(input, options), host = new URL(request.url).hostname
    if (!['www.googleapis.com', 'graph.microsoft.com', 'oauth2.googleapis.com', 'login.microsoftonline.com'].includes(host)) return upstream(input, options)
    await upstream(${JSON.stringify(recorderOrigin + '/calendar-' + name)}, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ host, method: request.method }) })
    if (host === 'oauth2.googleapis.com') return Response.json({ access_token: 'synthetic-glove-711' })
    return await edge.answer(request) ?? upstream(input, options)
  }
  return { ...worker, async fetch(request, env, context) {
    if (new URL(request.url).pathname === '/__portable/calendars') {
      if (request.method === 'POST') uncertain = (await request.json()).uncertain === true
      const counts = {}
      for (const table of ['glove_calendar_credentials', 'glove_calendar_work', 'glove_calendar_events']) counts[table] = (await env.DB.prepare('SELECT COUNT(*) AS n FROM ' + table).first()).n
      return Response.json({ counts, calls: edge.calls.map(({ provider, method }) => ({ provider, method })) })
    }
    return worker.fetch(request, env, context)
  } }
}
`)
    const entry = join(root, 'src/server.ts'), code = await readFile(entry, 'utf8')
    await writeFile(entry, "import { portableCalendars } from './portable-calendars.mjs'\n" + code.replace('export default portableMarketing(', 'export default portableCalendars(portableMarketing(').replace('} satisfies ExportedHandler<Bindings>, { seed: seedDemo })))', '} satisfies ExportedHandler<Bindings>, { seed: seedDemo }))))'))
  }
  // Each installation owns its dependencies, so setup cannot touch the source checkout.
  await command(root, ['pnpm', 'install', '--frozen-lockfile'], 'corepack')
  return root
}
function child(root, args, executable = join(root, 'node_modules/.bin/rer')) {
  const environment = { ...process.env }
  delete environment.RER_LOCAL_OPERATION
  delete environment.RER_ONBOARDING_PROCESS_OWNER
  const proc = spawn(executable, args, { cwd: root, env: { ...environment, CI: 'true', RER_SERVER_JOURNEY: '1', WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
  children.add(proc)
  let output = ''
  for (const pipe of [proc.stdout, proc.stderr]) pipe.on('data', chunk => (output += chunk))
  const done = new Promise((resolve, reject) => { proc.once('error', reject); proc.once('close', code => { children.delete(proc); resolve(code) }) })
  return { proc, done, output: () => output }
}
async function command(root, args, executable) {
  const p = child(root, args, executable), code = await p.done
  assert.equal(code, 0, clean(p.output()).slice(-5000))
}
const cookiesOf = res => res.headers.getSetCookie().map(x => x.split(';')[0]).join('; ')
const orderedJson = value => value === null || typeof value !== 'object' ? JSON.stringify(value)
  : Array.isArray(value) ? `[${value.map(orderedJson).join(',')}]`
    : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${orderedJson(value[key])}`).join(',')}}`
const documentHash = document => createHash('sha256').update(orderedJson(document)).digest('hex')

async function start(root, port) {
  const runtime = child(root, ['dev', '--foreground', '--port', String(port), '--no-queue'])
  try {
    const deadline = Date.now() + 120000
    while ((!runtime.output().includes('RER_READY') || !runtime.output().includes('RER_OPEN')) && Date.now() < deadline) {
      if (runtime.proc.exitCode !== null) throw Error(clean(runtime.output()).slice(-3000))
      await new Promise(r => setTimeout(r, 200))
    }
    assert.ok(runtime.output().includes('RER_READY'), clean(runtime.output()).slice(-3000))
    const origin = new URL(runtime.output().match(/^RER_READY\s+(\S+)/m)?.[1]).origin
    let gate = ''
    const request = (path, method = 'GET', body, cookie = '', headers = {}) => fetch(origin + path, { method, redirect: 'manual', headers: { origin, 'content-type': 'application/json', cookie: [gate, cookie].filter(Boolean).join('; '), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) })
    // rer dev's private one-click link: trade its key for the gate cookie, then enter as a persona.
    const open = runtime.output().match(/RER_OPEN (\S+)/)?.[1]
    assert.ok(open, 'rer dev supplies the private one-click sign-in link')
    const link = new URL(open), fragment = new URLSearchParams(link.hash.slice(1))
    const exchanged = await request(link.pathname, 'POST', { key: fragment.get('rer-dev') })
    assert.ok(exchanged.ok, await exchanged.text())
    gate = cookiesOf(exchanged)
    async function enter(persona) {
      const entered = await request(`/auth/dev/enter?as=${persona}`)
      assert.equal(entered.status, 303, await entered.text())
      return cookiesOf(entered)
    }
    const as = cookie => ({
      cookie,
      async cmd(type, payload, commandId = randomUUID()) {
        const response = await request('/api/glove/commands', 'POST', { commandId, type, payload }, cookie)
        const result = await response.json()
        assert.equal(response.status, 200, JSON.stringify(result))
        return result.result
      },
      get: async path => (await request(path, 'GET', undefined, cookie)).json(),
    })
    return {
      request, owner: as(await enter(fragment.get('as'))),
      callback: password => fetch(origin + '/api/glove/mail/events', { method: 'POST', headers: { 'content-type': 'application/json', cookie: gate, authorization: `Basic ${Buffer.from(`glove:${password}`).toString('base64')}` }, body: '{}' }),
      quoteRespond: (token, body) => fetch(origin + '/api/glove/public/quote', { method: 'POST', headers: { origin, 'content-type': 'application/json', authorization: `Bearer ${token}`, cookie: gate }, body: JSON.stringify(body) }),
      quote: token => fetch(origin + '/api/glove/public/quote', { headers: { authorization: `Bearer ${token}`, cookie: gate }, redirect: 'manual' }),
      booking: token => fetch(origin + '/api/glove/public/booking', { headers: { authorization: `Bearer ${token}`, cookie: gate }, redirect: 'manual' }),
      report: token => fetch(origin + '/api/glove/public/reports', { headers: { authorization: `Bearer ${token}`, cookie: gate }, redirect: 'manual' }),
      async persona(name) { return as(await enter(name)) },
      async close() { await stopOwnedRuntime(runtime) },
    }
  } catch (error) {
    await stopOwnedRuntime(runtime)
    throw error
  }
}

const install = root => devInstallation(
  port => command(root, ['setup', '--owner-email', 'owner@example.test', '--port', String(port), '--non-interactive']),
  port => start(root, port),
)

let running

import { installation, business, completedJob } from '../tests/api/harness.mjs'
import { createPortability as sourcePortability } from '@runeditrun/rer/modules/portability'

let h
try {
  h=await installation({captureLogs:true,at:'2026-11-09T02:00:00Z'})
  const b=await business(h),owner={cmd:(...args)=>h.command(...args)}
  let customer=await h.command('customer.save',{...b.customer,name:'Synthetic native erased customer'})
  const job=await h.command('job.create',{customerId:customer.id,siteId:b.site.id,title:'Synthetic native private job'})
  const visit=await h.command('visit.book',{jobId:job.id,technicianId:b.priya.id,date:'2026-11-20',start:'09:00',end:'10:00'})
  await b.priyaPerson.run('visit.arrive',{visitId:visit.id,deviceTime:visit.startAt})
  const material=await h.command('service.save',{code:'SYNTHETIC-NATIVE-ARCHIVE',name:'Synthetic native material',kind:'material',unit:'each',unitCost:'7.00',unitPrice:'14.00',tax:'GST'})
  const photo=await b.priyaPerson.run('visit.capture',{visitId:visit.id,deviceTime:visit.startAt,kind:'photo',caption:'Synthetic native private photo',photo:{mediaType:'image/jpeg',base64:jpeg}})
  await b.priyaPerson.run('visit.capture',{visitId:visit.id,deviceTime:visit.startAt,kind:'material',serviceId:material.id,quantity:'2',description:'Synthetic native private capture'})
  const pdf=Buffer.from('%PDF-1.4 synthetic-glove-native-private-certificate')
  customer=await h.command('customer.save',{...customer,taxExemption:{certificateNumber:'synthetic-glove-native-certificate',expires:'2028-12-31'}})
  customer=await h.command('customer.certificate',{customerId:customer.id,version:customer.version,file:{mediaType:'application/pdf',base64:pdf.toString('base64')}})
  async function archive(path){
    const policy=await editionArchivePolicy(workspace),service=await sourcePortability({db:h.db,policy}),id=await service.exports.create('owner')
    try{while((await service.exports.advance(id,{maxParts:16})).phase==='building'){}
      await writeFile(path,Buffer.from(await new Response(await service.exports.download(id)).arrayBuffer()))
    }finally{await service.exports.abort(id)}
  }
  const old=join(parent,'older.rer'),later=join(parent,'later.rer')
  await archive(old);console.log('NATIVE actual edition-policy older archive created from production Worker data')
  const preview=await h.command('privacy.preview',{customerId:customer.id,version:customer.version})
  assert.equal((await h.command('privacy.erase',{customerId:customer.id,version:customer.version,confirm:'ERASE',fingerprint:preview.fingerprint})).outcome,'complete')
  const cost=await (await h.request(`/api/glove/jobs/${job.id}/cost`)).json();assert.equal(cost.costing.actual.materials,'14.00')
  const anonymous=await h.state(),anonymousMaterial=anonymous.captures.filter(c=>c.jobId===job.id&&c.kind==='material');assert.equal(anonymousMaterial.length,1)
  await archive(later);console.log('NATIVE actual edition-policy later archive created after public erasure')
  const before=JSON.parse((await readFile(old,'utf8')).split('\n')[0]),after=JSON.parse((await readFile(later,'utf8')).split('\n')[0]);assert.equal(before.sourceIdentity,after.sourceIdentity);assert.ok(after.epoch>before.epoch)
  for(const value of ['Synthetic native erased customer','synthetic-glove-native-certificate','Synthetic native private capture'])assert.ok(!(await readFile(later)).includes(Buffer.from(value)))
  const offline=await copy('native-offline'),destination=await copy('native-newer')
  await cp(later,join(destination,'journal.rer'))
  await assert.rejects(command(destination,['import','--input',old,'--journal','journal.rer','--yes']),/erasure_epoch/)
  console.log('NATIVE old CLI archive refused with later journal')
  await command(destination,['import','--input',later,'--yes'])
  const {getPlatformProxy}=await import('wrangler'),{selectLocalState}=await import('@runeditrun/rer/local/state'),{createPortability,readArchive}=await import('@runeditrun/rer/modules/portability')
  async function inspect(root,fn){const proxy=await getPlatformProxy({configPath:join(root,'wrangler.jsonc'),persist:{path:await selectLocalState(root)}});try{return await fn(proxy.env.DB)}finally{await proxy.dispose()}}
  await inspect(destination,async db=>{
    const rows=(await db.prepare('SELECT * FROM glove_records ORDER BY kind,id').all()).results
    assert.equal(JSON.parse(rows.find(r=>r.kind==='customers'&&r.id===customer.id).data).name,'Erased customer')
    assert.deepEqual(rows.filter(r=>r.kind==='captures').map(r=>JSON.parse(r.data)).filter(r=>r.jobId===job.id&&r.kind==='material'),anonymousMaterial)
    assert.equal((await db.prepare('SELECT count(*) AS n FROM glove_tax_certificate_chunks').first()).n,0)
    const service=await createPortability({db,policy:await editionArchivePolicy(destination)})
    const records=[];for await(const r of readArchive(createReadStream(old)))records.push(r)
    const attempt=await service.imports.create(records[0],'owner')
    try{for(const[i,part]of records.filter(r=>r.kind==='part').entries())await service.imports.uploadPart(attempt,i,part)
      await assert.rejects(service.imports.finalize(attempt,{archiveHash:records.at(-1).archiveHash,contentHash:records.at(-1).contentHash}),/erasure_epoch/)
    }finally{await service.imports.abort(attempt)}
    assert.deepEqual((await db.prepare('SELECT * FROM glove_records ORDER BY kind,id').all()).results,rows)
  })
  console.log('NATIVE newer destination independently refused old checkpoint; anonymous material rows exact')
  await command(offline,['import','--input',old,'--yes'])
  await inspect(offline,async db=>{
    const rows=(await db.prepare('SELECT * FROM glove_records ORDER BY kind,id').all()).results
    assert.equal(JSON.parse(rows.find(r=>r.kind==='customers'&&r.id===customer.id).data).name,'Synthetic native erased customer')
    const chunks=(await db.prepare('SELECT bytes FROM glove_tax_certificate_chunks ORDER BY ordinal').all()).results
    assert.deepEqual(Buffer.concat(chunks.map(r=>Buffer.from(r.bytes))),pdf)
  })
  const offlineExport=join(parent,'offline-roundtrip.rer'),newerExport=join(parent,'newer-roundtrip.rer')
  await command(offline,['export','--output',offlineExport]);await command(destination,['export','--output',newerExport])
  assert.ok((await readFile(offlineExport)).includes(Buffer.from('Synthetic native erased customer')))
  for(const value of ['Synthetic native erased customer','synthetic-glove-native-certificate','Synthetic native private capture'])assert.ok(!(await readFile(newerExport)).includes(Buffer.from(value)))

  console.log('DATA-001 actual CLI import and export probe PASS: actual edition-policy archives from production Worker data; later journal and destination checkpoint refusals; fresh offline older import with exact original certificate; anonymous latest import and CLI re-export preserve material costs and exclude erased values')
}finally{
  if(h)await h.close()
  for(const proc of children)if(proc.exitCode===null)proc.kill('SIGTERM')
  await new Promise((resolve,reject)=>recorder.close(error=>error?reject(error):resolve()))
  await rm(parent,{recursive:true,force:true,maxRetries:10,retryDelay:100})
}
