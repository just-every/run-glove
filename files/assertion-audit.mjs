// Run from the product checkout: node /path/to/packet/assertion-audit.mjs [baseline-sha]
import { createRequire } from 'node:module'
const require = createRequire(process.cwd() + '/package.json')
const ts = require('typescript')
import fs from 'node:fs'
import crypto from 'node:crypto'
import {execFileSync} from 'node:child_process'
const base=process.argv[2]??'a81e93dc401029a20f3bf38570b4b2fefd637246'
const packet=process.env.HOME+'/rer-consolidation/work/sx-glove-suite-cap-2/packet'
const docs=['CONTRACT.md','ACCEPTANCE.md','docs/CLAIMS.md'].map(x=>fs.readFileSync(x,'utf8')).join('\n')
const names=[...new Set(JSON.parse(fs.readFileSync(packet+'/consolidations.json')).map(x=>x.file))]
const canonical=text=>{
 const scan=ts.createScanner(ts.ScriptTarget.Latest,true,ts.LanguageVariant.Standard,text), tokens=[]
 for(let kind=scan.scan();kind!==ts.SyntaxKind.EndOfFileToken;kind=scan.scan())tokens.push([kind,scan.getTokenText()])
 return JSON.stringify(tokens)
}
const summarize=(file,text)=>{
 const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true), assertions=[],refusals=[],registrations=[]
 function visit(n){
 if(ts.isCallExpression(n)){
 const call=n.expression.getText(source)
 if(call==='assert'||call.startsWith('assert.'))assertions.push(canonical(n.getText(source)))
 if(n.arguments.some(a=>ts.isObjectLiteralExpression(a)&&a.properties.some(p=>p.name?.getText(source)==='error')))refusals.push(canonical(n.getText(source)))
 if(call==='test'||call==='t.test')registrations.push(n.arguments[0].text)
 }
 ts.forEachChild(n,visit)
 }visit(source)
 return {assertions:assertions.sort(),refusals:refusals.sort(),registrations}
}
const rows=names.map(file=>{
 const before=summarize(file,execFileSync('git',['show',base+':'+file],{encoding:'utf8',maxBuffer:10e6}))
 const after=summarize(file,fs.readFileSync(file,'utf8'))
 const expressionsUnchanged=JSON.stringify(before.assertions)===JSON.stringify(after.assertions)
 const refusalsUnchanged=JSON.stringify(before.refusals)===JSON.stringify(after.refusals)
 const cited=before.registrations.filter(n=>docs.includes(n))
 const citedNamesKept=cited.every(n=>after.registrations.includes(n))
 if(!expressionsUnchanged||!refusalsUnchanged||!citedNamesKept)throw Error('preservation failed '+file)
 return {file,assertionsBefore:before.assertions.length,assertionsAfter:after.assertions.length,refusalsBefore:before.refusals.length,refusalsAfter:after.refusals.length,expressionsUnchanged,refusalsUnchanged,citedNamesKept,citedRegistrations:cited,assertionsSha256:crypto.createHash('sha256').update(JSON.stringify(after.assertions)).digest('hex'),refusalsSha256:crypto.createHash('sha256').update(JSON.stringify(after.refusals)).digest('hex')}
})
fs.writeFileSync(packet+'/assertion-preservation.json',JSON.stringify({base,rows},null,2)+'\n')
console.log('| File | Assertion expressions before → after | Refusal expectations before → after |')
console.log('| --- | ---: | ---: |')
for(const r of rows)console.log('| '+r.file+' | '+r.assertionsBefore+' → '+r.assertionsAfter+' | '+r.refusalsBefore+' → '+r.refusalsAfter+' |')
console.log('Exact token multisets match; all cited names remain registrations.')
