import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { child, stopDev, redact } from '/workspace/run-glove/tests/browser/runtime.mjs'
const root='/workspace/run-glove'
const packet=join(homedir(),'rer-consolidation/work/sx-glove-f201fix1/packet')
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()
const runtime=child(join(root,'node_modules/.bin/rer'),['dev','--foreground','--port','8787'],root)
let failure
try {
  let ready,entry
  const deadline=Date.now()+10*60*1000
  while(Date.now()<deadline){
    ready=runtime.output().match(/^RER_READY\s+(\S+)/m)?.[1]
    entry=runtime.output().match(/^RER_OPEN\s+(\S+)/m)?.[1]
    if(ready&&entry)break
    if(runtime.process.exitCode!==null)throw new Error(redact(runtime.output()))
    await new Promise(resolve=>setTimeout(resolve,200))
  }
  if(!ready||!entry)throw new Error('Dev did not announce readiness.')
  execFileSync('git',['restore','src/routeTree.gen.ts'],{cwd:root})
  console.log('Owned dev ready; native private entry retained only in process memory.')
  for(let run=1;run<=10;run++){
    const name='spec-run-'+String(run).padStart(2,'0')
    const command=[join(root,'node_modules/.bin/playwright'),'test','--config',join(root,'tests/browser/playwright.config.ts'),'tests/browser/conversation.spec.ts','--retries=0','--workers=1','--max-failures=1']
    const started=new Date().toISOString(),start=Date.now()
    const task=child(command[0],command.slice(1),root,{
      GLOVE_BASE_URL:new URL(ready).origin,GLOVE_OPEN:entry,GLOVE_PRODUCT_HEAD:head,
      GLOVE_SCREENSHOTS:run===1?process.env.GLOVE_SCREENSHOTS:'',
      GLOVE_BROWSER_OUTPUT:join(process.env.GLOVE_BROWSER_OUTPUT,name)
    })
    const code=await task.done
    const output=redact(task.output())
    await writeFile(join(packet,name+'.log'),output)
    const row={run,head,command,started,ended:new Date().toISOString(),seconds:(Date.now()-start)/1000,exit:code,log:name+'.log',proofScreenshots:run===1}
    await writeFile(join(packet,name+'.json'),JSON.stringify(row,null,2)+'\n')
    console.log(JSON.stringify(row))
    console.log(output)
    if(code!==0)throw new Error('Spec run '+run+' failed; stopped without retry.')
  }
} catch(error) {
  failure=error
  console.error('Dev output:\n'+redact(runtime.output()).slice(-5000))
} finally {
  try{await stopDev(root,runtime)}catch(error){failure||=error}
}
if(failure){console.error(redact(failure.message));process.exitCode=1}
