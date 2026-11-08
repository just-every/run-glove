import { installation, business } from './upgrade-harness.mjs'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
const h = await installation()
const digest = data => createHash('sha256').update(JSON.stringify(data)).digest('hex')
const snapshot = async () => {
  const { version, actor, events, imports, ...business } = await h.state()
  const tables = ['ik_sources', 'ik_provenance']
  return { business: digest(business), ...Object.fromEntries(await Promise.all(tables.map(async table => [table, digest((await h.db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all()).results)]))) }
}
try {
  console.log('PROBE business'); await business(h)
  const root = 'tests/fixtures/servicem8-small-hvac/'
  const files = [...await Promise.all(['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment'].map(async kind => ({ name: `${kind}.json`, text: await readFile(root + kind + '.json', 'utf8') }))), { name: 'attachments/8b9c0d1e-0001-4f2a-9b3c-4d5e6f7a8b01', base64: (await readFile(root + 'attachment-8b9c0d1e-0001-4f2a-9b3c-4d5e6f7a8b01.jpg')).toString('base64') }]
  const stage = () => h.command('import.stage', { files, balanceAsOf: '2026-10-22' })
  const commit = batch => h.command('import.commit', { batchId: batch.id, version: batch.version, fingerprint: batch.preview.fingerprint })
  console.log('PROBE import'); const imported = await commit(await stage())
  console.log('PROBE main repeat'); const onMain = await stage(), beforeMainRepeat = await snapshot()
  await commit(onMain)
  const mainRepeatUnchanged = JSON.stringify(await snapshot()) === JSON.stringify(beforeMainRepeat)
  console.log('PROBE upgrade'); await h.restart(); console.log('PROBE upgraded')
  const repeated = await stage(), before = await snapshot()
  const response = await h.request('/api/glove/commands', { method: 'POST', body: { commandId: randomUUID(), type: 'import.commit', payload: { batchId: repeated.id, version: repeated.version, fingerprint: repeated.preview.fingerprint } } })
  const result = await response.json(), after = await snapshot()
  const receipt = { initialRuntime: 'origin/main c993c94', records: imported.preview.counts.input, mainRepeatUnchanged, upgradedPreviewAlreadyMovedIn: repeated.preview.alreadyMovedIn, status: response.status, error: result.error?.code ?? null, resultStatus: result.result?.status ?? null, unchangedBusinessAndOriginalJournal: JSON.stringify(before) === JSON.stringify(after), before, after }
  await writeFile(process.env.PROBE_RECEIPT, JSON.stringify(receipt, null, 2) + '\n')
  console.log(JSON.stringify(receipt, null, 2))
} catch(error) { console.error('PROBE_ERROR', error); throw error } finally { await h.close().catch(error => console.error('PROBE_CLOSE', String(error))) }
