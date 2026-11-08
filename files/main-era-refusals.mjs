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
  const sendCommit = async batch => {
    const response = await h.request('/api/glove/commands', { method: 'POST', body: { commandId: randomUUID(), type: 'import.commit', payload: { batchId: batch.id, version: batch.version, fingerprint: batch.preview.fingerprint } } })
    const body = await response.json()
    return { status: response.status, error: body.error?.code ?? null }
  }
  const changed = structuredClone(files), material = changed.find(f => f.name === 'jobmaterial.json'), rows = JSON.parse(material.text)
  rows[0].price = String(Number(rows[0].price) + 1)
  material.text = JSON.stringify(rows)
  const changedBatch = await h.command('import.stage', { files: changed, balanceAsOf: '2026-10-22' })
  const changedBefore = await snapshot(), changedReply = await sendCommit(changedBatch)
  const changedAfter = await snapshot()
  const customer = (await h.state()).customers.find(c => c.source?.system === 'ServiceM8')
  await h.command('customer.save', { id: customer.id, version: customer.version, name: 'synthetic-glove-native-edit' })
  const editedBatch = await stage(), editedBefore = await snapshot(), editedReply = await sendCommit(editedBatch)
  const editedAfter = await snapshot()
  receipt.regressions = { changedSource: { ...changedReply, unchangedOnRefusal: JSON.stringify(changedBefore) === JSON.stringify(changedAfter) }, nativeEdit: { ...editedReply, unchangedOnRefusal: JSON.stringify(editedBefore) === JSON.stringify(editedAfter) } }
  await writeFile(process.env.PROBE_RECEIPT, JSON.stringify(receipt, null, 2) + '\n')
  console.log(JSON.stringify(receipt, null, 2))
} catch(error) { console.error('PROBE_ERROR', error); throw error } finally { await h.close().catch(error => console.error('PROBE_CLOSE', String(error))) }
