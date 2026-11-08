const ts=require(process.cwd()+'/node_modules/typescript'), fs=require('node:fs'), cp=require('node:child_process');
const packet='/home/agent/rer-consolidation/work/sx-glove-suite-cap-1/packet';
const baseline=cp.execSync('git rev-parse origin/main').toString().trim();
const changed=[...new Set(JSON.parse(fs.readFileSync(packet+'/merge-map.json')).map(row=>row.file))];
function assertions(text,file){
 const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true), rows=[];
 function visit(n){
  if(ts.isCallExpression(n)){
   const name=n.expression.getText(ast);
   if(/^assert(?:\.|$)/.test(name)||name==='assertTrail'||name==='refuse'||(ts.isPropertyAccessExpression(n.expression)&&['run','command'].includes(n.expression.name.text)&&n.arguments.some(a=>ts.isObjectLiteralExpression(a)&&a.properties.some(p=>p.name?.getText(ast)==='error'))))
    rows.push(n.getText(ast));
  }
  ts.forEachChild(n,visit);
 }
 visit(ast);return rows;
}
const key=rows=>JSON.stringify(rows.slice().sort());
const results=[];
for(const file of changed){
 const before=assertions(cp.execFileSync('git',['show',baseline+':'+file]).toString(),file),after=assertions(fs.readFileSync(file,'utf8'),file);
 if(key(before)!==key(after))throw Error('Assertion text differs '+file);
 results.push({file,before:before.length,after:after.length,identical:true,assertions:before});
}
const mappings=JSON.parse(fs.readFileSync(packet+'/merge-map.json'));
for(const map of mappings){
 const original=cp.execFileSync('git',['show',baseline+':'+map.file]).toString();
 const ast=ts.createSourceFile(map.file,original,ts.ScriptTarget.Latest,true);
 function v(n){if(ts.isCallExpression(n)&&['test','t.test'].includes(n.expression.getText(ast))){const [name,cb]=n.arguments;if((name?.text??name?.getText(ast))===map.original&&cb?.body)map.body=cb.body.getText(ast);}ts.forEachChild(n,v);}
 v(ast);
 const source=fs.readFileSync(map.file,'utf8');
 if(!source.includes(map.body))throw Error('Body missing '+map.original);
 map.assertions=assertions(map.body,map.file);
}
fs.writeFileSync(packet+'/assertion-proof.json',JSON.stringify({baseline,files:results,callbacks:mappings.map(({body,...r})=>r)},null,2)+'\n');
console.log('Identical assertion expressions:',results.reduce((n,r)=>n+r.before,0),'in',results.length,'files; complete original callback bodies:',mappings.length);
