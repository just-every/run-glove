import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, cp, rm, readFile, symlink } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID, createHash } from 'node:crypto'
import { stopOwnedRuntime } from '/workspace/run-glove/tests/owned-processes.mjs'
import { devInstallation } from '/workspace/run-glove/tests/dev-installation.mjs'
const workspace=resolve('.'), parent=await mkdtemp(join(tmpdir(),'f221-native-archive-')), children=new Set()
const clean=s=>s.replace(/RER_OPEN[^\n]*/g,'RER_OPEN [private]').replace(/(?:token|rer-dev)=[^\s"&<>]+/g,'credential=[private]')
const excluded=new Set(['.git','node_modules','.wrangler','.rer','.seed','.cache','.tanstack','dist','exports','test-results','playwright-report'])
async function copy(name) {
 const root=join(parent,name)
 await cp(workspace,root,{recursive:true,filter:path=>{const rel=path.slice(workspace.length+1);return !excluded.has(rel.split('/')[0])&&!rel.startsWith('.dev.vars')&&!rel.startsWith('.env')}})
 await command(root,['install','--offline','--frozen-lockfile'],process.env.F221_PNPM)
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
  port => command(root, ['setup', '--owner-email', 'fleet@runeditrun.com', '--port', String(port), '--non-interactive']),
  port => start(root, port),
)


let running
try {
 const source=await copy('source'), destination=await copy('destination'), offline=await copy('offline')
 console.log('Native DATA-001 archive probe: starting unwrapped edition installation')
 running=await install(source)
 const owner=running.owner
 await owner.cmd('business.save',{name:'Synthetic privacy archive',currency:'AUD',timezone:'Australia/Sydney'})
 const customer=await owner.cmd('customer.save',{name:'synthetic-glove-archive-person',taxExemption:{certificateNumber:'synthetic-glove-archive-number',expires:'2028-12-31'}})
 const peer=await owner.cmd('customer.save',{name:'synthetic-glove-archive-peer'})
 const site=await owner.cmd('site.save',{customerId:customer.id,address:'42 Synthetic Archive Street'})
 const material=await owner.cmd('service.save',{code:'SYNTHETIC-F221',name:'Synthetic archive material',kind:'material',unit:'each',unitCost:'7.00',unitPrice:'14.00',tax:'GST'})
 const member=await running.persona('member')
 const operator=(await owner.get('/api/glove/state')).operators.find(o=>o.email===['member','dev.localhost'].join('@'))
 await owner.cmd('role.set',{operatorId:operator.id,role:'technician'})
 const tech=await owner.cmd('technician.save',{name:'Synthetic archive technician',operatorId:operator.id})
 const job=await owner.cmd('job.create',{customerId:customer.id,siteId:site.id,title:'Synthetic archive job'})
 const visit=await owner.cmd('visit.book',{jobId:job.id,technicianId:tech.id,date:'2026-10-15',start:'09:00',end:'10:30'})
 await member.cmd('visit.arrive',{visitId:visit.id,deviceTime:'2026-10-14T22:03:00Z'})
 await member.cmd('visit.capture',{visitId:visit.id,deviceTime:'2026-10-14T22:11:00Z',kind:'material',serviceId:material.id,quantity:'2',description:'synthetic-glove-private-material'})
 const pdf=Buffer.from('%PDF-1.4 synthetic-glove-private-certificate')
 const cert=await owner.cmd('customer.certificate',{customerId:customer.id,version:customer.version,file:{mediaType:'application/pdf',base64:pdf.toString('base64')}})
 const certificateId=cert.taxExemption.certificate.fileId
 assert.equal((await owner.get('/api/glove/jobs/'+job.id+'/cost')).costing.actual.materials,'14.00')
 await running.close();running=null
 const older=join(parent,'older.rer'),latest=join(parent,'latest.rer')
 await command(source,['export','--output',older])
 console.log('Native pre-erasure archive exported')
 running=await install(source)
 const current=(await running.owner.get('/api/glove/state')).customers.find(c=>c.id===customer.id)
 const preview=await running.owner.cmd('privacy.preview',{customerId:current.id,version:current.version})
 await running.owner.cmd('privacy.erase',{customerId:current.id,version:current.version,confirm:'ERASE',fingerprint:preview.fingerprint})
 assert.equal((await running.owner.get('/api/glove/jobs/'+job.id+'/cost')).costing.actual.materials,'14.00')
 assert.deepEqual((await running.owner.get('/api/glove/state')).captures,[])
 await running.close();running=null
 await command(source,['export','--output',latest])
 console.log('Native post-erasure archive exported with material costs and no captures')
 await assert.rejects(command(destination,['import','--input',older,'--journal',latest,'--yes']),/erasure_epoch/)
 await command(destination,['import','--input',latest,'--yes'])
 running=await install(destination)
 const restored=await running.owner.get('/api/glove/export')
 assert.equal(restored.customers.find(c=>c.id===customer.id).name,'Erased customer')
 assert.equal(restored.customers.find(c=>c.id===peer.id).name,peer.name)
 assert.equal((await running.owner.get('/api/glove/jobs/'+job.id+'/cost')).costing.actual.materials,'14.00')
 assert.deepEqual((await running.owner.get('/api/glove/state')).captures,[])
 assert.equal((await running.request('/api/glove/files/'+certificateId,'GET',undefined,running.owner.cookie)).status,404)
 for(const value of ['synthetic-glove-archive-person','42 Synthetic Archive Street','synthetic-glove-private-material','synthetic-glove-private-certificate'])assert.ok(!JSON.stringify(restored).includes(value))
 await running.close();running=null
 console.log('Native latest archive restored: exact anonymous costs, peer retained, no erased original')
 await command(offline,['import','--input',older,'--yes'])
 running=await install(offline)
 const old=await running.owner.get('/api/glove/state')
 assert.equal(old.customers.find(c=>c.id===customer.id).name,'synthetic-glove-archive-person')
 const bytes=await running.request('/api/glove/files/'+certificateId,'GET',undefined,running.owner.cookie)
 assert.equal(bytes.status,200);assert.deepEqual(Buffer.from(await bytes.arrayBuffer()),pdf)
 console.log('Native offline old-only archive restored: personal records and exact original demonstrate the journal limit')
 console.log('DATA-001 native archive focused probe PASS')
} finally {
 if(running)await running.close()
 for(const proc of children)if(proc.exitCode===null)proc.kill('SIGTERM')
 await rm(parent,{recursive:true,force:true})
}
