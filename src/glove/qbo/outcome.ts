import { postedMatches } from './reconcile'
import { authority } from '../access'
import { load, commit } from '../storage'
import { bump, event, type Context } from '../model'
import { collection } from './payload'
import { QboError, qboRequest } from './client'
import { accessToken } from './oauth-secrets'

/** Reserve and commit first; an interrupted send is never a fresh provider attempt. */
export async function quickbooksAfterCommit(db: D1Database, original: Context, result: any) {
  const op = original.qboOperation
  if (!op) return result
  const a = authority(original.actor), connection = original.s.business[0].qbo
  const key = await db.prepare(`SELECT value FROM glove_provider_keys WHERE provider IN ('quickbooks','quickbooks-oauth') AND (${a.sql}) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND json_extract(data,'$.qbo.connectionId')=?) AND EXISTS(SELECT 1 FROM glove_records WHERE id=? AND json_extract(data,'$.qboSync.operationId')=? AND json_extract(data,'$.erasedAt') IS NULL)`).bind(...a.params, connection.connectionId, op.id, op.operationId).first<{ value: string }>()
  if (!key) return result
  const token = await accessToken(db, original)
  const claim = await db.prepare(`UPDATE glove_qbo_operations SET phase='sending' WHERE id=? AND phase='reserved' AND (${a.sql})`).bind(op.operationId, ...a.params).run()
  if (!claim.meta.changes) return result
  let phase = 'unknown', remoteId: string | null = null, syncToken: string | null = null, message = 'QuickBooks outcome unknown; reconcile the provider record before sending again.'
  try {
    const response = await qboRequest(connection, token, op.resource, op.body, op.operationId)
    const remote = response[Object.keys(response).find(k => k.toLowerCase() === op.resource) ?? '']
    if (!/^\d{1,30}$/.test(String(remote?.Id))) throw new QboError('QuickBooks returned no record reference; reconcile before sending again.', 0, false)
    remoteId = String(remote.Id); syncToken = remote.SyncToken ?? null
    if (op.resource === 'invoice' || op.resource === 'refundreceipt') {
      if (Number(remote.TxnTaxDetail?.TotalTax) !== Number(op.body.TxnTaxDetail.TotalTax) || Number(remote.TotalAmt) !== Number(original.s.invoices.find(i => i.id === (op.kind === 'invoice' ? op.id : original.s.payments.find(p => p.id === op.id)?.invoiceId))?.revisions.findLast((r: any) => r.approval)?.totals.total)) throw new QboError('QuickBooks posted a different tax or total; reconcile this provider reference before sending again.', 0, false)
    }
    if (!postedMatches(op.body, remote)) throw new QboError('QuickBooks returned different posted fields; verify this reference before sending again.', 0, false)
    phase = 'complete'; message = 'QuickBooks confirmed this record.'
  } catch (error) {
    if (error instanceof QboError) { phase = error.rejected ? 'rejected' : 'unknown'; message = error.message }
  }
  // An exact-reference Owner read may already have settled an interrupted send.
  // The late sender keeps its provider fact, but cannot replace that settlement.
  await db.prepare("UPDATE glove_qbo_operations SET phase=?,remote_id=? WHERE id=? AND phase='sending'").bind(phase, remoteId, op.operationId).run()
  const outcome = { phase, remoteId, message, operationId: op.operationId, connectionId: connection.connectionId, fingerprint: op.fingerprint, contentFingerprint: op.contentFingerprint }
  let retained: any = outcome
  // The provider fact is durable even if the initiating owner's session is withdrawn.
  for (let attempt = 0; attempt < 6; attempt++) {
    const before = await load(db), row = before[collection(op.kind)].find(r => r.id === op.id)
    if (!row || row.erasedAt) return { phase: 'unknown', operationId: op.operationId, message: 'The subject was erased; provider details were discarded.' }
    const c: Context = { ...original, actor: { ...original.actor, qboProvider: op.operationId }, qboOperation: undefined, commandId: `${original.commandId}:qbo`, now: new Date().toISOString(), s: structuredClone(before), events: [], sql: [], files: [] }
    const current = c.s[collection(op.kind)].find(r => r.id === op.id)!
    const reconciled = current.qboSync?.operationId === op.operationId && current.qboSync.phase === 'complete' && current.qboSync.reconciledAt
    retained = reconciled ? current.qboSync : outcome
    if (!reconciled) bump(c.s, collection(op.kind), current, { qboSync: outcome, ...(syncToken && current.qbo?.connectionId === connection.connectionId ? { qbo: { ...current.qbo, syncToken } } : phase === 'complete' && op.kind === 'customer' && current.qboCreate?.connectionId === connection.connectionId ? { qbo: { remoteId, syncToken, connectionId: connection.connectionId, confirmedAt: current.qboCreate.approvedAt, confirmedBy: current.qboCreate.approvedBy } } : {}) })
    event(c, { jobId: row.jobId ?? null, subjectKind: op.kind, subjectId: row.id, kind: reconciled ? 'qbo.lateOutcome' : `qbo.${phase}`, summary: reconciled ? `QuickBooks returned ${phase}${remoteId ? ` ${remoteId}` : ''} after Owner reconciliation; verified reference ${current.qboSync.remoteId} retained without another post` : `QuickBooks ${phase}${remoteId ? ` ${remoteId}` : ''}: ${message}`, data: { provider: 'QuickBooks', connectionId: connection.connectionId, remoteId, operationId: op.operationId, phase, ...(reconciled ? { reconciledRemoteId: current.qboSync.remoteId } : {}) } })
    try { await commit(db, c, before, 'qbo.sync', op.fingerprint, retained); break } catch (error) {
      if ((await load(db)).version === before.version) throw error
    }
  }
  await db.prepare('UPDATE glove_commands SET result=json_set(result,\'$.result\',json(?)) WHERE id=? AND EXISTS(SELECT 1 FROM glove_records WHERE id=? AND json_extract(data,\'$.erasedAt\') IS NULL)').bind(JSON.stringify(retained), original.commandId, op.id).run()
  return retained
}
