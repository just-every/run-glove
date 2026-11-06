import datetime,json,os,subprocess
from pathlib import Path
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
packet=Path.home()/'rer-consolidation/work/sx-glove-c-f102/packet'
reports=Path('src/glove/reports.ts')
costing=Path('src/glove/costing.ts')
originals={reports:reports.read_text(),costing:costing.read_text()}
cases=[
 ('M1-draft-inclusion',reports,'const approved = inv.revisions.filter((r: Row) => r.approval)','const approved = inv.revisions','Prepared correction must remain excluded'),
 ('M2-latest-approval-date',reports,'localParts(approved[0].approval.at,','localParts(approved[approved.length - 1].approval.at,','Correction must stay on first local approval date'),
 ('M3-original-revision',reports,'rev: approved[approved.length - 1]','rev: approved[0]','Latest approved subtotal replaces original'),
 ('M4-last-pricebook-line',costing,'for (const line of job.lines ?? [])','for (const line of [...(job.lines ?? [])].reverse())','First price-book line determines category'),
 ('M5-invented-category',costing,"return item.category || 'Uncategorized'","return item.category || 'Repair'",'Missing first category remains Uncategorized'),
]
rows=[]
node=str(Path.home()/'.rer/node/node-v22.20.0-linux-x64/bin/node')
try:
 for ident,path,old,new,outcome in cases:
  assert originals[path].count(old)==1,(ident,'mutation must match one expression')
  path.write_text(originals[path].replace(old,new,1))
  command=[node,'--test','--test-name-pattern=REPORT-002, REPORT-004 a month','tests/api/reports.test.mjs']
  result=subprocess.run(command,capture_output=True,text=True,timeout=90)
  log=result.stdout+result.stderr
  (packet/(ident+'.log')).write_text(log)
  rows.append({'id':ident,'head':head,'file':str(path),'original':old,'mutation':new,'outcome':outcome,'command':command,'exit':result.returncode,'detected':result.returncode!=0,'log':ident+'.log'})
  print(ident,'exit='+str(result.returncode),'detected='+str(result.returncode!=0),flush=True)
  path.write_text(originals[path])
finally:
 for path,text in originals.items():path.write_text(text)
 (packet/'MUTATION-RECEIPT.json').write_text(json.dumps({'head':head,'cases':rows,'product_sources_restored':all(p.read_text()==v for p,v in originals.items())},indent=2)+'\n')
subprocess.run(['git','diff','--exit-code'],check=True)
assert len(rows)==len(cases) and all(r['detected'] for r in rows)
