import { spawn, execFileSync } from 'node:child_process'
import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { redact } from '/workspace/run-glove/tests/browser/runtime.mjs'
const root='/workspace/run-glove'
const packet=join(process.env.HOME,'rer-consolidation/work/sx-glove-browserflake-2/packet')
const destination=join(packet,'cpu-6')
await mkdir(destination,{recursive:true})
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()
const start=Date.now()
const child=spawn('node',['tests/browser/run.mjs','tests/browser/fresh-install.spec.ts'],{cwd:root,env:{...process.env,
  NODE_OPTIONS:[process.env.NODE_OPTIONS,'--require=/tmp/sx-glove-cpu.cjs'].filter(Boolean).join(' '),
  SX_CPU_RECEIPT:join(destination,'throttle.jsonl'),
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:'/usr/bin/chromium',
  GLOVE_BROWSER_OUTPUT:destination,GLOVE_SCREENSHOTS:join(destination,'screenshots')},
  stdio:['ignore','pipe','pipe']})
let output=''
for(const pipe of [child.stdout,child.stderr]) pipe.on('data',data=>output+=data)
const exit=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)})
output=redact(output)
await writeFile(join(destination,'command.log'),output)
let throttled=[]
try { throttled=(await readFile(join(destination,'throttle.jsonl'),'utf8')).trim().split('\n').map(line=>JSON.parse(line)) } catch {}
const receipt={head,command:'node tests/browser/run.mjs tests/browser/fresh-install.spec.ts',
  preload:'/tmp/sx-glove-cpu.cjs',exit,seconds:(Date.now()-start)/1000,
  method:'Emulation.setCPUThrottlingRate',rate:6,throttledPages:throttled,
  machineStress:false}
await copyFile('/tmp/sx-glove-cpu.cjs',join(packet,'cpu-throttle.cjs'))
await writeFile(join(packet,'cpu-receipt.json'),JSON.stringify(receipt,null,2)+'\n')
console.log(JSON.stringify(receipt))
console.log(output.slice(-4000))
if(exit!==0 || throttled.length!==4) process.exit(exit||1)
