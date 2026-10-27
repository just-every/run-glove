import { authority } from '../access'
import { load, commit } from '../storage'
import { bump, event, type Context } from '../model'
import { xeroCollection, xeroMatches } from './payload'
import { XeroWriteError, xeroWrite } from './write'

export async function xeroAfterCommit(db: D1Database, original: Context, result: any) {
  const op = original.xeroOperation
  if (!op) return result
  const a = authority(original.actor), connection = original.s.business[0].xeroInspection
  const key = await db.prepare(`SELECT value FROM glove_provider_keys WHERE provider='xero' AND (${a.sql}) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND json_extract(data,'$.xeroInspection.connectionId')=?) AND EXISTS(SELECT 1 FROM glove_records WHERE id=? AND json_extract(data,'$.xeroSync.operationId')=? AND json_extract(data,'$.erasedAt') IS NULL)`).bind(...a.params, connection.connectionId, op.id, op.operationId).first<{ value: string }>()
  if (!key) return result
  const claimed = await db.prepare(`UPDATE glove_xero_operations SET phase='sending' WHERE id=? AND phase='reserved' AND (${a.sql})`).bind(op.operationId, ...a.params).run()
  if (!claimed.meta.changes) return result
  let phase = 'unknown', remoteId: string | null = null, message = 'Xero outcome unknown; inspect the provider record before sending again.'
  try {
    const remote = await xeroWrite(JSON.parse(key.value), op.resource, op.body, op.operationId)
    if (typeof remote?.[op.identity] !== 'string' || !remote[op.identity]) throw new XeroWriteError('Xero returned no record identity; reconcile before sending again.')
    remoteId = remote[op.identity]
    if (!xeroMatches(op.body, remote) || op.kind === 'invoice' && (remote.Total !== op.total || remote.TotalTax !== op.tax)) throw new XeroWriteError('Xero returned different posted fields, tax or total; reconcile this provider identity.')
    phase = 'complete'; message = 'Xero confirmed this record.'
  } catch (error) {
    if (error instanceof XeroWriteError) { phase = error.rejected ? 'rejected' : 'unknown'; message = error.message }
  }
  const outcome = { id: op.id, phase, remoteId, message, operationId: op.operationId, connectionId: connection.connectionId, fingerprint: op.fingerprint }
  for (let attempt = 0; attempt < 6; attempt++) {
    const before = await load(db), row = before[xeroCollection(op.kind)].find(r => r.id === op.id)
    if (!row || row.erasedAt) return { phase: 'unknown', message: 'The subject was erased; provider details were discarded.' }
    const c: Context = { ...original, actor: { ...original.actor, xeroProvider: op.operationId }, xeroOperation: undefined, commandId: `${original.commandId}:xero`, now: new Date().toISOString(), s: structuredClone(before), events: [], sql: [], files: [] }
    c.sql.push({ sql: 'UPDATE glove_xero_operations SET phase=?,remote_id=? WHERE id=?', params: [phase, remoteId, op.operationId] })
    bump(c.s, xeroCollection(op.kind), c.s[xeroCollection(op.kind)].find(r => r.id === op.id)!, { xeroSync: outcome })
    event(c, { jobId: row.jobId ?? null, subjectKind: op.kind, subjectId: row.id, kind: `xero.${phase}`, summary: `Xero ${phase}${remoteId ? ` ${remoteId}` : ''}: ${message}`, data: { provider: 'Xero', remoteId, operationId: op.operationId, phase } })
    try {
      await commit(db, c, before, 'xero.sync', op.fingerprint, outcome)
      await db.prepare("UPDATE glove_commands SET result=json_set(result,'$.result',json(?)) WHERE id=? AND EXISTS(SELECT 1 FROM glove_records WHERE id=? AND json_extract(data,'$.erasedAt') IS NULL)").bind(JSON.stringify(outcome), original.commandId, op.id).run()
      return outcome
    } catch (error) { if ((await load(db)).version === before.version) throw error }
  }
  return { phase: 'unknown', operationId: op.operationId, message: 'Provider outcome needs reconciliation after concurrent changes.' }
}
