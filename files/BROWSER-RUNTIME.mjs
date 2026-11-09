import { child, stopDev, command } from '/workspace/glove-candidate/tests/browser/runtime.mjs'
import { requireDevKey, resolvePersona, openUrl } from '/workspace/glove-candidate/node_modules/@runeditrun/rer/cli/dev-identity.mjs'
import { developmentTarget } from '/workspace/glove-candidate/node_modules/@runeditrun/rer/onboarding/operator-installer.mjs'
import { writeFile } from 'node:fs/promises'
const root='/workspace/glove-candidate', origin='http://127.0.0.1:8787'
const key=await requireDevKey(root)
const [executable,args,options]=developmentTarget({root,origin,devKey:key})
args[args.indexOf('--port')+1]='8787'
let runtime
try {
 runtime=child(executable,args,root,options.env)
 const deadline=Date.now()+300_000
 let healthy=false
 while(Date.now()<deadline) {
  if(runtime.process.exitCode!==null) throw Error('Owned pinned development runtime stopped before health')
  try {
   const r=await fetch(origin+'/health',{signal:AbortSignal.timeout(1000)})
   if(r.ok&&(await r.json()).status==='ok'){healthy=true;break}
  } catch {}
  await new Promise(r=>setTimeout(r,500))
 }
 if(!healthy) throw Error('Owned pinned development runtime failed its health check within five minutes')
 const persona=await resolvePersona(origin,key,'owner')
 await writeFile('/tmp/glove-candidate-dev.log','RER_OPEN '+openUrl(origin,key,{path:'/__dev/key',as:persona.as})+'\n',{mode:0o600})
 console.log('Pinned development runtime health and current owner persona confirmed')
 console.log(await command(process.execPath,['/tmp/glove-delay-proof.mjs'],root))
} finally {
 if(runtime) await stopDev(root,runtime)
}
