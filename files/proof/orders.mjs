import { readFile, writeFile, unlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import ts from '/home/agent/rer-consolidation/work/sx-glove-browserflake-1/run-glove/node_modules/typescript/lib/typescript.js'
const packet = '../packet'
const journey = await readFile('tests/browser/journey.spec.ts', 'utf8')
const ast = ts.createSourceFile('journey.spec.ts', journey, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const target = ast.statements.find(s => ts.isExpressionStatement(s) && s.getText(ast).startsWith("test('DATA-001") && s.getText(ast).includes('a technician reconnects'))?.getText(ast)
if(!target) throw Error('Reconnect registration not found')
const reconnect = `import {test,expect} from '@playwright/test'\nimport {mkdir} from 'node:fs/promises'\nimport {join} from 'node:path'\nconst origin=process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'\nconst shots=process.env.GLOVE_SCREENSHOTS\nasync function shot(page: any,width: number,name: string) {if(!shots)return;await mkdir(shots,{recursive:true});await page.screenshot({path:join(shots,\`\${width}-\${name}.png\`),fullPage:true})}\n${target}\n`
const sources={reconnect}
for(const name of ['rules','email','morning-brief','recurring-billing']) sources[name]=await readFile(`tests/browser/${name}.spec.ts`,'utf8')
sources.dummy=await readFile('tests/browser/aaa-order-dummy.spec.ts','utf8')
const orders={first:['rules','email','dummy','morning-brief','recurring-billing','reconnect'],middle:['email','rules','dummy','morning-brief','reconnect','recurring-billing'],last:['reconnect','email','dummy','morning-brief','recurring-billing','rules']}
await writeFile(`${packet}/order-plan.json`,JSON.stringify({sourceSha256:Object.fromEntries(Object.entries(sources).map(([name,s])=>[name,createHash('sha256').update(s).digest('hex')])),orders,reconnectExtraction:'Exact full test registration from journey.spec.ts, with its unchanged origin and screenshot dependencies. No assertion removed or rewritten.'},null,2)+'\n')
await writeFile(`${packet}/reconnect-order-source.ts`,reconnect)
for(const [label,names] of Object.entries(orders)) {
  const files=[]
  try {
    for(const [i,name] of names.entries()) {
      const path=`tests/browser/sx-order-${i}-${name}.spec.ts`
      files.push(path)
      await writeFile(path,sources[name])
    }
    console.log('ORDER_START',label,JSON.stringify(names))
    const child=spawn(process.execPath,['/tmp/sx-glove-playwright.mjs',`order-${label}`,'sx-order-'],{stdio:'inherit',env:{...process.env,...(label==='first'?{SX_SCREENSHOTS:'1'}:{})}})
    const exit=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)})
    console.log('ORDER_EXIT',label,exit)
    if(exit!==0) {process.exitCode=exit;break}
  } finally { await Promise.all(files.map(file=>unlink(file))) }
}
