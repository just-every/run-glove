import json,os,shlex,subprocess,time
from pathlib import Path
packet=Path('../packet')
plan=json.loads((packet/'shard-plan.json').read_text())
for s in plan['shifted']:
    if s['name'] not in ('browser-2','browser-4'):continue
    label='shifted-'+s['name']
    directory=packet/label
    directory.mkdir(exist_ok=True)
    command=shlex.split(s['commands'][1])
    env={**os.environ,'PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH':'/usr/bin/chromium','GLOVE_BROWSER_OUTPUT':str(directory.resolve()/'results'),'GLOVE_SCREENSHOTS':str(directory.resolve()/'screenshots')}
    print('SHARD_START',label,flush=True)
    p=subprocess.run(command,env=env,capture_output=True,text=True)
    text=p.stdout+p.stderr
    (directory/'shard.log').write_text(text)
    (directory/'receipt.json').write_text(json.dumps({'command':command,'label':label,'exit':p.returncode,'timestamp':time.time()},indent=2)+'\n')
    print(text[-11000:],flush=True)
    print('SHARD_EXIT',label,p.returncode,flush=True)
