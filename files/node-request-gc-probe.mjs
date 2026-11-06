// One-off native runtime diagnosis; no repository file or assertion changes.
const request = new Request('https://example.test/callback', { method: 'POST', body: new URLSearchParams({ value: 'synthetic-glove-1' }) })
await request.clone().text()
console.log(JSON.stringify({phase:'after cloned body read',bodyUsed:request.bodyUsed,locked:request.body.locked}))
global.gc()
await new Promise(resolve => setTimeout(resolve, 25))
console.log(JSON.stringify({phase:'after native finalizers',bodyUsed:request.bodyUsed,locked:request.body.locked}))
try { await request.clone().text(); console.log('second clone usable') }
catch (error) { console.log(error.stack); process.exitCode=1 }
