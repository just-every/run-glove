import { planD1Import, createD1ImportJob, applyD1ImportBatches, undoD1Import, canonicalJson, type D1TargetAdapter, type D1ImportContext, type D1Sql, type TargetRow, type ImportPlan } from '../../modules/import-kit/src/d1/index'
import { authority } from '../access'
import { fail, text, find, expectVersion, put, bump, event, newId, business, collections, type Context, type Row, type Collection, type State } from '../model'
import { readBundle, mapping, MAPPING_VERSION, NAMESPACE, JOB_TARGET } from './servicem8'

// Glove's side of Base's import kit: a dry-run preview of a ServiceM8 move-in,
// then a journaled commit (each batch writes Glove records, source identities,
// provenance and exact original files together), then undo that removes exactly
// what the move-in wrote and refuses when Glove work now depends on it.

const DESTINATION = 'glove'
const sql = (text: string, ...params: unknown[]): D1Sql => ({ sql: text, params })
// Base's kit refuses target kinds named like background jobs ("jobs"), so field
// jobs travel through the journal as "workorders" and are stored as Glove jobs.
const kindOf = (target: string) => target === JOB_TARGET ? 'jobs' : target
const targetOf = (kind: string) => kind === 'jobs' ? JOB_TARGET : kind

/** Imported records live in glove_records with the journal's applied revision. */
const targets: D1TargetAdapter = {
  async read(db, destination, kind, id) {
    const row = await db.prepare('SELECT data,revision,version FROM glove_records WHERE kind=? AND id=?').bind(kindOf(kind), id).first<any>()
    if (!row) return undefined
    return { destination, targetKind: kind, targetId: id, value: JSON.parse(row.data), revision: row.revision ?? `glove:${row.version}` }
  },
  matches(row, _destination, kind, id) {
    if (!row) return sql('NOT EXISTS(SELECT 1 FROM glove_records WHERE kind=? AND id=?)', kindOf(kind), id)
    return sql('EXISTS(SELECT 1 FROM glove_records WHERE kind=? AND id=? AND revision=? AND data=?)', kindOf(kind), id, row.revision, canonicalJson(row.value))
  },
  write(row) {
    const value = row.value as Row
    return [sql('INSERT INTO glove_records(kind,id,version,data,revision) VALUES(?,?,?,?,?)', kindOf(row.targetKind), row.targetId, value.version, canonicalJson(row.value), row.revision), sql('UPDATE glove_meta SET version=version+1 WHERE id=1')]
  },
  remove(_destination, kind, id) {
    return [sql('DELETE FROM glove_records WHERE kind=? AND id=?', kindOf(kind), id), sql('UPDATE glove_meta SET version=version+1 WHERE id=1')]
  },
  async list(db, destination) {
    const rows = (await db.prepare('SELECT kind,id,data,revision FROM glove_records WHERE revision IS NOT NULL ORDER BY kind,id').all<any>()).results
    return rows.map((r): TargetRow => ({ destination, targetKind: targetOf(r.kind), targetId: r.id, value: JSON.parse(r.data), revision: r.revision }))
  },
  matchesCount(count) { return sql('(SELECT COUNT(*) FROM glove_records WHERE revision IS NOT NULL)=?', count) },
}

/** Who may write: a command's live session and role, as a scalar SQL predicate. */
export type Guard = { sql: string; params: unknown[] }

function kitContext(db: D1Database, batch: Row, guard: Guard): D1ImportContext {
  return {
    destination: DESTINATION, namespace: NAMESPACE, mappingVersion: MAPPING_VERSION, operationKey: `glove-movein:${batch.id}`, batchSize: 50,
    storage: { database: db, targets },
    // Restored installations get a new owner operator row; the role survives.
    authorization: { principalId: 'role:owner', predicate: () => ({ sql: guard.sql, params: guard.params }) },
  }
}

async function plan(db: D1Database, batch: Row, guard: Guard) {
  const bundle = readBundle(batch.files)
  return planD1Import(bundle, mapping(bundle, { timezone: batch.timezone }), kitContext(db, batch, guard))
}

/** Source records an earlier move-in already brought in (the kit reuses them unchanged). */
async function claimed(db: D1Database, p: ImportPlan) {
  const ids = p.entries.map(e => e.identity), found = new Set<string>()
  for (let i = 0; i < ids.length; i += 90) for (const row of (await db.prepare(`SELECT identity FROM ik_sources WHERE identity IN (${ids.slice(i, i + 90).map(() => '?').join(',')})`).bind(...ids.slice(i, i + 90)).all<{ identity: string }>()).results) found.add(row.identity)
  return found
}

function preview(p: ImportPlan, already: Set<string>) {
  const byKind: Record<string, { input: number; mapped: number; merged: number; rejected: number }> = {}
  const rejections: { kind: string; sourceId: string; reason: string; location: unknown }[] = []
  const unmappedFields = new Map<string, Set<string>>()
  const missingAttachments: { sourceId: string; name: string }[] = []
  let alreadyMovedIn = 0
  for (const e of p.entries) {
    if (already.has(e.identity)) alreadyMovedIn++
    const k = (byKind[e.source.kind] ??= { input: 0, mapped: 0, merged: 0, rejected: 0 })
    k.input++
    if (e.rejection) { k.rejected++; rejections.push({ kind: e.source.kind, sourceId: e.source.sourceId, reason: e.rejection, location: e.source.location }) }
    else if (e.effects.length) k.mapped++
    else k.merged++
    for (const u of e.unmapped) if (u.field) (unmappedFields.get(e.source.kind) ?? unmappedFields.set(e.source.kind, new Set()).get(e.source.kind)!).add(u.field)
    for (const effect of e.effects) { const v = effect.value as any; if (effect.targetKind === 'captures' && v.bytes?.status === 'missing') missingAttachments.push({ sourceId: e.source.sourceId, name: v.name }) }
  }
  return { fingerprint: p.fingerprint, counts: p.counts, alreadyMovedIn, byKind, effects: p.counts.byKind, rejections, unmappedFields: Object.fromEntries([...unmappedFields].map(([k, v]) => [k, [...v].sort()])), missingAttachments, diagnostics: p.diagnostics.map(d => ({ severity: d.severity, code: d.code, message: d.message, sourceId: d.sourceId })) }
}

/** The dry run of a staged batch: what it would write, already moved in, rejected or unmapped. */
export async function previewMoveIn(db: D1Database, batch: Row, guard: Guard) {
  const planned = await plan(db, batch, guard)
  return preview(planned, await claimed(db, planned))
}

/** Journal and apply the reviewed plan, resuming the kit job an earlier run of this batch started. */
export async function applyMoveIn(db: D1Database, batch: Row, guard: Guard, fingerprint: string) {
  const context = kitContext(db, batch, guard)
  const existing = await db.prepare('SELECT id FROM ik_jobs WHERE operation_key=?').bind(context.operationKey).first<{ id: string }>()
  let jobId = existing?.id
  if (!jobId) {
    const reviewed = await plan(db, batch, guard)
    if (reviewed.fingerprint !== fingerprint) fail('IMPORT_STALE', 'The move-in plans differently now (Glove records changed since the preview). Stage it again.')
    jobId = (await createD1ImportJob(reviewed, { ...context, reviewedFingerprint: reviewed.fingerprint })).id
  }
  const done = await applyD1ImportBatches(jobId, context)
  if (done.state !== 'completed') fail('IMPORT_INCOMPLETE', 'The move-in has not finished; run the same commit again to resume it.', { state: done.state, checkpoint: done.checkpoint, total: done.total })
  return jobId
}

/** import.stage: the dry run. Nothing but the batch record is written. */
export async function stage(db: D1Database, c: Context, p: any) {
  const b = business(c.s)
  const batch: Row = { id: newId(), version: 1, createdAt: c.now, stagedAt: c.now, system: 'ServiceM8', label: text(p.label, 'label', { optional: true, max: 200 }) || 'ServiceM8 move-in', timezone: b.timezone, files: p.files, status: 'previewed', stagedBy: { id: c.actor.id, name: c.actor.name } }
  const reviewed = await previewMoveIn(db, batch, authority(c.actor))
  put(c.s, 'imports', { ...batch, preview: reviewed, fileSummary: readBundle(p.files).artifacts.map(a => ({ name: a.name, sha256: a.sha256, size: a.size })) })
  event(c, { jobId: null, subjectKind: 'import', subjectId: batch.id, kind: 'import.previewed', summary: `ServiceM8 move-in previewed: ${reviewed.counts.input} source records (${reviewed.alreadyMovedIn} already moved in), ${reviewed.counts.effects} Glove records, ${reviewed.rejections.length} rejected, ${reviewed.missingAttachments.length} attachment${reviewed.missingAttachments.length === 1 ? '' : 's'} missing`, data: { fingerprint: reviewed.fingerprint } })
  const { files: _files, ...visible } = c.s.imports.find(i => i.id === batch.id)!
  return visible
}

/** Whether a record refers to one of `ids` anywhere in it (top level, visit assignments, approvals, captures). */
function refersTo(value: unknown, ids: Set<string>): string | undefined {
  if (typeof value === 'string') return ids.has(value) ? value : undefined
  if (value && typeof value === 'object') for (const v of Object.values(value)) { const hit = refersTo(v, ids); if (hit) return hit }
  return undefined
}
const scanned = collections.filter(kind => kind !== 'imports')

/** The records a move-in wrote that are still in Glove. */
async function written(db: D1Database, jobId: string) {
  return new Set((await db.prepare('SELECT target_id AS id FROM ik_provenance WHERE job_id=? AND reversed=0').bind(jobId).all<{ id: string }>()).results.map(r => r.id))
}

/** Glove records outside this move-in that refer to a record it wrote. */
async function dependents(db: D1Database, c: Context, batch: Row) {
  const imported = await written(db, batch.jobId)
  const found: { kind: Collection; id: string; refersTo: string }[] = []
  for (const kind of scanned) for (const r of c.s[kind]) if (!imported.has(r.id)) { const { id: _id, ...rest } = r; const hit = refersTo(rest, imported); if (hit) found.push({ kind, id: r.id, refersTo: hit }) }
  return found
}

/**
 * While an undo is part-way (it runs in passes), the records it has not yet
 * removed are held: a command may neither edit one nor make a record that
 * refers to one. The undo marks its batch 'undoing' under the installation
 * version, so a command that read the records before then is retried.
 */
export async function refuseUndoing(db: D1Database, before: State, c: Context) {
  const undoing = before.imports.filter(i => i.status === 'undoing')
  if (!undoing.length) return
  const held = new Set<string>()
  for (const batch of undoing) for (const id of await written(db, batch.jobId)) held.add(id)
  for (const kind of scanned) {
    const old = new Map(before[kind].map(r => [r.id, JSON.stringify(r)]))
    for (const r of c.s[kind]) {
      if (old.get(r.id) === JSON.stringify(r)) continue
      const { id, ...rest } = r
      const hit = held.has(id) ? id : refersTo(rest, held)
      if (hit) fail('IMPORT_UNDOING', 'This record is being removed by a move-in undo that has not finished. Finish the undo first, or leave this record alone.', { kind, id, record: hit })
    }
  }
}

/** Write the batch record outside a command commit; `version` guards that nothing changed since the records were read. */
async function writeBatch(db: D1Database, c: Context, row: Row, version: number | null) {
  const a = authority(c.actor), unchanged = version === null ? '' : ' AND (SELECT version FROM glove_meta WHERE id=1)=?'
  await db.batch([
    db.prepare(`INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN (${a.sql})${unchanged} THEN 1 ELSE 0 END)`).bind(crypto.randomUUID(), ...a.params, ...(version === null ? [] : [version])),
    db.prepare("UPDATE glove_records SET version=?,data=?,revision=NULL WHERE kind='imports' AND id=?").bind(row.version, JSON.stringify(row), row.id),
    db.prepare('UPDATE glove_meta SET version=version+1 WHERE id=1'),
    db.prepare('DELETE FROM glove_guard'),
  ]).catch(() => fail('BUSY', 'Records changed while the undo started. Send the same undo again.'))
  return row
}

/** import.commit and import.undo run the kit journal, then the caller commits the batch record. */
export async function journal(db: D1Database, c: Context, type: 'import.commit' | 'import.undo', p: any) {
  const batch = find(c.s, 'imports', p.batchId)
  // Resuming an undo that is part-way repeats a decision already taken.
  if (!(type === 'import.undo' && batch.status === 'undoing')) expectVersion(batch, p.version)
  const guard = authority(c.actor), context = kitContext(db, batch, guard)
  if (type === 'import.commit') {
    if (batch.status !== 'previewed') fail('IMPORT_STATE', `This move-in is ${batch.status}.`)
    if (p.fingerprint !== batch.preview.fingerprint) fail('IMPORT_REVIEW', 'Confirm the exact preview you reviewed (its fingerprint).', { fingerprint: batch.preview.fingerprint })
    const jobId = await applyMoveIn(db, batch, guard, batch.preview.fingerprint)
    return { batch, jobId, summary: committedSummary(batch) }
  }
  if (batch.status !== 'committed' && batch.status !== 'undoing') fail('IMPORT_STATE', `Only a committed move-in can be undone; this one is ${batch.status}.`)
  const blocking = await dependents(db, c, batch)
  if (blocking.length) fail('IMPORT_DEPENDENTS', 'Glove work now refers to records from this move-in. Undo would leave it pointing at nothing.', { dependents: blocking.slice(0, 50), total: blocking.length })
  const reason = batch.status === 'undoing' ? batch.undoReason : text(p.reason, 'reason', { max: 500 })
  // Mark the batch 'undoing' only if nothing changed since the dependents check read the records.
  const starting = batch.status === 'committed', remaining = (await written(db, batch.jobId)).size
  const held = starting ? await writeBatch(db, c, { ...batch, version: batch.version + 1, status: 'undoing', undoStartedAt: c.now, undoReason: reason }, c.s.version) : batch
  let done
  try { done = await undoD1Import(batch.jobId, context) }
  catch (error) {
    // A refusal before anything was removed (an edited record) leaves the move-in committed.
    if (starting && (await written(db, batch.jobId)).size === remaining) { const { undoStartedAt: _a, undoReason: _r, ...rest } = held; await writeBatch(db, c, { ...rest, version: held.version + 1, status: 'committed' }, null) }
    throw error
  }
  if (done.state !== 'undone') fail('IMPORT_INCOMPLETE', 'Undo has not finished; run the same undo again to resume it.', { state: done.state })
  return { batch, jobId: batch.jobId, summary: `ServiceM8 move-in undone: ${reason}`, reason }
}

export const committedSummary = (batch: Row) => `ServiceM8 move-in committed: ${batch.preview.counts.input} source records journaled (${batch.preview.alreadyMovedIn} already moved in earlier and left as they were); every record keeps its ServiceM8 ID`

/** After the journal ran: the batch record and its timeline event, committed normally. */
export function settle(c: Context, type: 'import.commit' | 'import.undo', outcome: { batch: Row; jobId: string; summary: string; reason?: string }) {
  const batch = find(c.s, 'imports', outcome.batch.id)
  const row = bump(c.s, 'imports', batch, type === 'import.commit' ? { status: 'committed', jobId: outcome.jobId, committedAt: c.now, committedBy: { id: c.actor.id, name: c.actor.name } } : { status: 'undone', undoneAt: c.now, undoneBy: { id: c.actor.id, name: c.actor.name }, undoReason: outcome.reason })
  event(c, { jobId: null, subjectKind: 'import', subjectId: row.id, kind: type === 'import.commit' ? 'import.committed' : 'import.undone', summary: outcome.summary, data: { importJob: outcome.jobId } })
  const { files: _files, ...visible } = row
  return visible
}
