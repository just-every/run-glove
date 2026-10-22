import { sharedSignedQuotes } from './privacy-signed-quotes'
import { Buffer } from 'node:buffer'
import { loadPlans } from '../modules/import-kit/src/d1/plans'
import { retirementScope } from '../modules/import-kit/src/d1/retirement-scope'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import type { privacyScope } from './privacy-scope'
import { collections, type State } from './model'

/** Preview the exact kit decisions, including its multi-target refusal. No
 * content is changed or held in a saved privacy-request record. */
export async function erasurePreview(db: D1Database, s: State, scope: ReturnType<typeof privacyScope>, version: number) {
  const rows = (await db.prepare("SELECT * FROM ik_jobs WHERE destination='glove' ORDER BY id").all<any>()).results
  const plans = await loadPlans(rows, db)
  const values = [...scope.personal]
  const refusal = rows.filter(row => plans.get(row.id)!.entries.some(e => !e.erased && (e.effects.some(f => f.targetKind === 'customers' && f.targetId === [...scope.customers][0]) && e.effects.length !== 1 || e.effects.some(f => scope.ids.has(f.targetId) && f.attachment))))
  const retiring = await retirementScope(db, 'glove', [...values, ...refusal.map(row => row.operation_key)])
  const retiredBatches = rows.filter(row => retiring.jobs.includes(row.id)).map(row => ({ jobId: row.id, operationKey: row.operation_key, name: s.imports.find(r => r.jobId === row.id)?.system ?? row.namespace, reason: refusal.includes(row) ? 'The import kit cannot tombstone this multi-target or attached source record.' : 'An exact subject identifier is in the batch header or its dependent custody.' }))
  const fields = new Map<string, { path: (string | number)[]; value: string; optional: boolean }>()
  const discover = (v: any, path: (string | number)[] = []) => {
    if (typeof v === 'string' && scope.matches(v) && path.length) fields.set(canonicalJson([path, v]), { path, value: v, optional: true })
    else if (Array.isArray(v)) v.forEach(x => discover(x, [...path, '*']))
    else if (v && typeof v === 'object') for (const [key, value] of Object.entries(v)) discover(value, [...path, key])
  }
  const sharedOriginals: { jobId: string; name: string; peers: number; peerIds: string[]; sha256: string }[] = []
  const peers = new Set<string>()
  for (const row of rows) {
    const plan = plans.get(row.id)!
    for (const entry of plan.entries) { discover(entry.source.payload); for (const effect of entry.effects) discover(effect.value) }
    for (const artifact of plan.source.artifacts) {
      if (artifact.original?.status !== 'available') continue
      const affected = retiring.jobs.includes(row.id) || plan.entries.some(e => !e.erased && e.source.artifactHash === artifact.sha256 && e.effects.some(f => scope.ids.has(f.targetId))) || scope.matches(artifact.name) || scope.matches(Buffer.from(artifact.original.base64, 'base64').toString('utf8'))
      if (!affected) continue
      const affectedPeers = new Set(plan.entries.filter(e => !e.erased && e.source.artifactHash === artifact.sha256).flatMap(e => e.effects.filter(f => f.targetKind === 'customers' && !scope.customers.has(f.targetId)).map(f => f.targetId)))
      for (const id of affectedPeers) peers.add(id)
      sharedOriginals.push({ jobId: row.id, name: artifact.name, sha256: artifact.sha256, peers: affectedPeers.size, peerIds: [...affectedPeers].sort() })
    }
  }
  for (const table of ['ik_provenance', 'ik_d1_history']) for (const row of (await db.prepare(`SELECT record_json FROM ${table}`).all<any>()).results) discover(JSON.parse(row.record_json).before?.value)
  const sharedSignedCopies = sharedSignedQuotes(s, scope)
  for (const copy of sharedSignedCopies) for (const id of copy.peerIds) peers.add(id)
  const signedQuoteIds = new Set([...scope.records.quotes.map(q => q.id), ...sharedSignedCopies.map(q => q.quoteId)])
  const counts: Record<string, number> = Object.fromEntries(collections.map(k => [k, scope.records[k].length + s[k].filter(r => !scope.selected.has(`${k}:${r.id}`) && scope.matches(r)).length]).filter(([, n]) => Number(n) > 0))
  const certificateIds = new Set((await db.prepare('SELECT id,customer_id FROM glove_tax_certificates').all<any>()).results.filter(r => scope.customers.has(r.customer_id)).map(r => r.id))
  for (const table of ['glove_quote_signed_chunks', 'glove_files', 'glove_tax_certificates', 'glove_tax_certificate_chunks', 'glove_events', 'glove_commands', 'glove_companycam_uploads', 'rer_mail_event_states', 'rer_mail_event_receipts']) {
    const data = (await db.prepare(`SELECT * FROM ${table}`).all<any>()).results
    counts[table] = data.filter(r => table === 'glove_quote_signed_chunks' ? signedQuoteIds.has(r.quote_id) : scope.matches(r) || table === 'glove_tax_certificate_chunks' && certificateIds.has(r.file_id)).length
  }
  counts.importBatches = rows.filter(row => retiring.jobs.includes(row.id) || scope.matches(plans.get(row.id))).length
  const visible = { customerIds: [...scope.customers].sort(), counts, retiredBatches, sharedOriginals, sharedSignedCopies, peersAffected: peers.size }
  return { ...visible, fields: [...fields.values()], fingerprint: sha256(canonicalJson({ version, customerIds: visible.customerIds, retiredBatches, sharedOriginals, sharedSignedCopies, imports: rows.map(r => [r.id, r.fingerprint]) })) }
}
