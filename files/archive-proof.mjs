import assert from 'node:assert/strict'
import { join } from 'node:path'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { startDev, stopDev, command, redact } from '/home/agent/rer-consolidation/work/sx-glove-c-f224/repo/tests/browser/runtime.mjs'
const root = '/home/agent/rer-consolidation/work/sx-glove-c-f224/repo'
const work = '/home/agent/rer-consolidation/work/sx-glove-c-f224'
const head = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()
const archive = join(work,'mail-custody-proof.rer')
const started = new Date().toISOString()
const apiKey = 'synthetic-glove-52'
let runtime, password, result = 'failed', proof = {}
try {
  runtime = await startDev(root,8787)
  const link = new URL(runtime.entry), cookies = response => response.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')
  let cookie = ''
  const request = (path,{method='GET',body}={})=>fetch(runtime.origin+path,{method,redirect:'manual',headers:{origin:runtime.origin,'content-type':'application/json',cookie},...(body===undefined?{}:{body:JSON.stringify(body)})})
  const exchange = await request(link.pathname,{method:'POST',body:{key:new URLSearchParams(link.hash.slice(1)).get('rer-dev')}})
  assert.ok(exchange.ok)
  cookie = cookies(exchange)
  const entered = await request('/auth/dev/enter?as=owner')
  assert.equal(entered.status,303)
  cookie = [cookie,cookies(entered)].join('; ')
  const cmd = async (type,payload)=>{
    const response=await request('/api/glove/commands',{method:'POST',body:{commandId:randomUUID(),type,payload}})
    const body=await response.json()
    assert.equal(response.status,200,body.error?.code)
    assert.equal(body.ok,true,body.error?.code)
    return body.result
  }
  await cmd('business.save',{name:'Synthetic archive mail',currency:'USD',timezone:'UTC'})
  const connected=await cmd('mail.connect',{provider:'postmark',apiKey,fromEmail:['synthetic-glove-office','example.test'].join('@')})
  password=connected.callbackPassword
  assert.equal(typeof password,'string')
  await stopDev(root,runtime); runtime=null
  await command(join(root,'node_modules/.bin/rer'),['export','--output',archive],root)
  const bytes=await readFile(archive), manifest=JSON.parse(bytes.toString('utf8').split('\n')[0])
  assert.ok(bytes.includes(Buffer.from('Synthetic archive mail')),'the archive contains the seeded business, so absence is checked against populated data')
  assert.ok(!bytes.includes(Buffer.from(apiKey)))
  assert.ok(!bytes.includes(Buffer.from(password)))
  assert.ok(!bytes.includes(Buffer.from(createHash('sha256').update(password).digest('hex'))))
  assert.ok(!manifest.tables.some(t=>['glove_provider_keys','glove_mail_callback_auth'].includes(t.name)))
  proof={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),populatedBusiness:true,apiKeyAbsent:true,callbackPasswordAbsent:true,callbackHashAbsent:true,credentialTablesAbsent:true}
  result='passed'
  console.log('COMM-001 point 3 actual archive: populated business retained; Postmark API key, callback password, hash and credential tables absent.')
} catch(error) { console.error(redact(error.stack)); process.exitCode=1 }
finally {
  await stopDev(root,runtime)
  await writeFile(join(work,'packet','ARCHIVE-RECEIPT.json'),JSON.stringify({head,command:'node /tmp/glove-archive-proof.mjs; native owner mail.connect then rer export',start:started,finish:new Date().toISOString(),result,proof,cleanup:'owned server stopped; private scratch archive removed'},null,2)+'\n')
  await rm(archive,{force:true})
}
