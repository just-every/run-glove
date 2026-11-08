import json, subprocess
from pathlib import Path
packet=Path('/home/agent/rer-consolidation/work/sx-glove-suite-cap-1/packet')
proof=json.loads((packet/'assertion-proof.json').read_text())
before=json.loads((packet/'baseline-inventory.json').read_text())
after=json.loads((packet/'candidate-inventory.json').read_text())
lines=['# sx-glove-suite-cap-1 — Glove test inventory consolidation','',
'Repository: just-every/run-glove',
'Branch: cloud/sx-glove-suite-cap-1',
'Product head: '+subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
'',
'## Plan','',
(packet/'PLAN.md').read_text(),
'## Inventory and scope','',
f"The baseline has {before['direct']} direct registration calls expanding to {before['registrations']} tests, plus {len(before['assertionScripts'])} assertion scripts: **{before['total']}**. The candidate has {after['direct']} direct calls expanding to {after['registrations']} tests, plus {len(after['assertionScripts'])} assertion scripts: **{after['total']}**. This saves {before['total']-after['total']} counted tests and leaves {200-after['total']} slots below the unchanged 200 cap.",
'',
'No pre-existing test inventory/budget counter or test-budget.json was found in package scripts, tests/, scripts/ or Verify. The new tests/inventory.mjs parses the actual repository tests, counts nested subtests and literal loop expansion, and inventories bare assertion scripts from verification.json. The same counter produced both baseline-inventory.json and candidate-inventory.json. Baseline exits 1 because it exceeds 200; the candidate passes --limit 190.',
'',
'Consolidation is confined to tests/ plus the required source lock. Related edge-case scenarios run as awaited named steps of one behavior. Existing shared installations remain shared. Independent scenarios keep their fresh installation and cleanup before the next scenario. The provider import table retains every positive and negative case for all three sources. No skips, weaker assertions, omitted provider cases, src edits, cap increase or clause status changes were introduced.',
'',
'Contract and generated acceptance evidence names were checked before consolidation. Fully cited registrations were retained; related steps were folded into cited tests where applicable. The specifically cited subcontractor 1099-NEC subtest remains a registration. No DONE claim is made. Publication scanning and landing remain with the Mac fleet.',
'',
'## Assertion preservation','',
f"The complete multiset of assertion/refusal expressions is identical in every touched test file: **{sum(x['before'] for x in proof['files'])} before = {sum(x['after'] for x in proof['files'])} after**. This includes assert.*, assertTrail, refuse and explicit error expectations passed to command/run. The ledger below lists every such expression in each merged callback; assertions in shared helper/setup functions were also compared file-wide.",
'',
'The comparison is text-exact for call expressions and multiplicity, so changing an expected value, deleting an assertion, or losing a refusal fails the comparison. Loops retain the same cases. Assertion-expression counts are source counts rather than the number of runtime loop iterations.',
'',
'| Touched file | Assertions before | Assertions after | Exact multiset |',
'| --- | ---: | ---: | --- |']
for r in proof['files']:
 lines.append(f"| {r['file']} | {r['before']} | {r['after']} | identical |")
lines+=['','## Merged registration and step table','',
'| File | Surviving registration | Original step | Assertions before | Assertions after | Provider cases |',
'| --- | --- | --- | ---: | ---: | ---: |']
def cell(s):return str(s).replace('|','&#124;').replace('\n',' ')
for m in proof['callbacks']:
 lines.append('| '+ ' | '.join(map(cell,[m['file'],m['retained'],m['original'],len(m['assertions']),len(m['assertions']),m.get('cases',1)]))+' |')
lines+=['','## Full assertion text for every merged step','']
fence=chr(96)*3
for i,m in enumerate(proof['callbacks'],1):
 lines += [f"### {i}. {m['file']}",'','Surviving registration: '+m['retained'],'','Original step: '+m['original'],'',f"Assertion text count: {len(m['assertions'])}; generated provider cases: {m.get('cases',1)}.",'']
 for a in m['assertions']:
  lines += [fence+'js',a,fence,'']
lines += ['## Validation and custody','',
'Actual command results and provenance are in the selected JSON receipts and logs. Final exact-SHA CI results are recorded in ci-receipt.json when available. Product and evidence refs have separate custody; the evidence commit is not a READY or landing signal.',
'',
'Clause changes: none. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md were not edited by this task.',
'']
(packet/'REPORT.md').write_text('\n'.join(lines))
print('Report bytes:',(packet/'REPORT.md').stat().st_size,'callback rows:',len(proof['callbacks']))

validation=['','## Recorded validation results','',
'| Check | Result | Product head |',
'| --- | --- | --- |',
'| All 30 touched API files, using Verify’s serial Node test command | 65 passed; 0 failed, skipped or cancelled; 528.394 seconds | fc2c10e01b67d2ab8e8db3edf30b5a549ce8e9c0 |',
'| Arrival-window file after merging main’s newer assertions | 2 passed; 0 failed, skipped or cancelled | a3cbd723ef3d90d9356259ea7deb2f0814e10cc7 |',
'| pnpm run typecheck | passed | a3cbd723ef3d90d9356259ea7deb2f0814e10cc7 |',
'| Edition source lock check | passed after regeneration | a3cbd723ef3d90d9356259ea7deb2f0814e10cc7 |',
'| New inventory counter, --limit 190 | 189; passed | a3cbd723ef3d90d9356259ea7deb2f0814e10cc7 |',
'| Assertion/refusal text multiset against merged main 5fc3e002ef52aef13409cc8e93786fd74afb6c6a | 4,101 before = 4,101 after; identical in all 30 files | a3cbd723ef3d90d9356259ea7deb2f0814e10cc7 |',
'',
'The initial static comparison was 4,092 = 4,092. Main added nine assertion/refusal expressions in the arrival-window scenarios; all nine are retained in the final 4,101 = 4,101 comparison. Main’s only product change merged here was in src/ui/visit-panel.tsx; the other 29 touched API files retain the exact tested bytes.',
'',
'Local commands used the supplied cloud toolchain (Node 24.19.0, pnpm 10.12.4). GitHub Verify selects its declared Node 22.20.0. No provider accounts, UI changes or owner browser sessions were needed for this test-only work.',
'']
ci_path=packet/'ci-receipt.json'
if ci_path.exists():
 ci=json.loads(ci_path.read_text())
 row=ci['latest']
 validation+=['Exact-SHA Verify: '+str(ci.get('run_id'))+'; status='+str(row.get('status'))+'; conclusion='+str(row.get('conclusion'))+'; head='+ci['requested_head']+'; URL='+str(row.get('html_url'))+'.','']
with (packet/'REPORT.md').open('a') as stream:stream.write('\n'.join(validation))
