import { queueCalendarSync } from './calendar-sync'
import { stopQuoteCallTasks } from './followups'
import { visitNotices } from './visit-notices'
import { commitPrivacy } from './privacy'
import { branchState } from './branch-access'
import { recordChanges } from './timeline'
import { authority } from './access'
import { visibleOutcome } from './view'
import { collections, fail, type Collection, type Context, type State, type Actor } from './model'

export async function load(db: D1Database): Promise<State> {
  const [meta, records] = await db.batch<any>([
    db.prepare('SELECT version FROM glove_meta WHERE id=1'),
    db.prepare("SELECT kind,data FROM glove_records ORDER BY kind,json_extract(data,'$.createdAt'),id"),
  ])
  const s = { version: meta.results[0].version } as State
  for (const kind of collections) s[kind] = []
  for (const row of records.results) if ((collections as readonly string[]).includes(row.kind)) s[row.kind as Collection].push(JSON.parse(row.data))
  return s
}

/** The durable outcome of an earlier command with this identity, if any. */
export async function saved(db: D1Database, commandId: string, digest: string, actor: Actor) {
  const row = await db.prepare('SELECT actor_id,type,digest,result FROM glove_commands WHERE id=?').bind(commandId).first<any>()
  if (!row) return null
  if (row.digest !== digest || row.actor_id !== actor.id) fail('IDEMPOTENCY', 'This command identity was already used with different content or by another person.')
  const result = JSON.parse(row.result)
  if (actor.branch) {
    const s = branchState(await load(db), actor)
    const ids = new Set(collections.flatMap(k => s[k]).map(r => r.id))
    const check = (v: any): void => {
      if (!v || typeof v !== 'object') return
      if (v.id && !ids.has(v.id)) fail('NOT_FOUND', 'That earlier command is outside your current branch.', null, 404)
      for (const x of Object.values(v)) if (x && typeof x === 'object') check(x)
    }
    // Check the top-level record and referenced result records, not line-item ids.
    if (result.result?.id && !ids.has(result.result.id)) fail('NOT_FOUND', 'That earlier command is outside your current branch.', null, 404)
    for (const key of ['job', 'visit', 'quote', 'invoice']) if (result.result?.[key]) check({ id: result.result[key].id })
    // PAY-001 batch outcomes include both invoices and job-specific refusals.
    // Re-check their roots before returning a result after a branch change.
    if (Array.isArray(result.result?.results)) for (const item of result.result.results) {
      if (item.jobId) check({ id: item.jobId })
      if (item.invoice?.id) check({ id: item.invoice.id })
    }
  }
  return visibleOutcome(result, row.type, actor)
}

/**
 * One atomic D1 batch: the actor's live session and role and the installation
 * version are asserted first (a false guard aborts the batch), then every
 * changed record, new timeline event and file, the version advance and the
 * command outcome. Nothing partial can commit.
 */
export async function commit(db: D1Database, c: Context, before: State, type: string, digest: string, result: unknown) {
  queueCalendarSync(c, before)
  visitNotices(c, before)
  stopQuoteCallTasks(c)
  if (!c.events.length) fail('AUDIT', 'This command has no timeline event; it was not committed.')
  const statements: D1PreparedStatement[] = []
  const a = authority(c.actor)
  statements.push(db.prepare(`INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN (${a.sql}) AND (SELECT version FROM glove_meta WHERE id=1)=? THEN 1 ELSE 0 END)`).bind(crypto.randomUUID(), ...a.params, before.version))
  for (const kind of collections) {
    const old = new Map(before[kind].map(r => [r.id, JSON.stringify(r)])), next = new Set(c.s[kind].map(r => r.id))
    for (const r of c.s[kind]) if (old.get(r.id) !== JSON.stringify(r)) statements.push(db.prepare('INSERT INTO glove_records(kind,id,version,data) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET version=excluded.version,data=excluded.data,revision=NULL').bind(kind, r.id, r.version, JSON.stringify(r)))
    for (const r of before[kind]) if (!next.has(r.id)) statements.push(db.prepare('DELETE FROM glove_records WHERE kind=? AND id=?').bind(kind, r.id))
  }
  for (const q of c.sql) statements.push(db.prepare(q.sql).bind(...q.params))
  statements.push(db.prepare(`DELETE FROM glove_live_locations WHERE received_at < strftime('%Y-%m-%dT%H:%M:%fZ','now','-2 minutes') OR NOT EXISTS (SELECT 1 FROM glove_records tech WHERE tech.kind='technicians' AND tech.id=technician_id AND json_extract(tech.data,'$.active')=1 AND json_extract(tech.data,'$.locationConsent.enabled')=1 AND json_extract(tech.data,'$.locationConsent.by')=json_extract(tech.data,'$.operatorId')) OR NOT EXISTS (SELECT 1 FROM glove_records shift WHERE shift.kind='times' AND json_extract(shift.data,'$.technicianId')=technician_id AND json_extract(shift.data,'$.kind')='shift' AND json_extract(shift.data,'$.endAt') IS NULL) OR NOT EXISTS (SELECT 1 FROM glove_records timer JOIN glove_records visit ON visit.kind='visits' AND visit.id=json_extract(timer.data,'$.visitId') WHERE timer.kind='times' AND json_extract(timer.data,'$.technicianId')=technician_id AND json_extract(timer.data,'$.kind') IN ('job','travel') AND json_extract(timer.data,'$.endAt') IS NULL AND visit.id=visit_id AND json_extract(visit.data,'$.technicianId')=technician_id AND json_extract(visit.data,'$.status') IN ('booked','arrived'))`))
  for (const f of c.files) statements.push(db.prepare('INSERT INTO glove_files(id,capture_id,media_type,size,sha256,bytes,created_at) VALUES(?,?,?,?,?,?,?)').bind(f.id, f.captureId, f.mediaType, f.size, f.sha256, f.bytes, c.now))
  const changes = recordChanges(before, c.s)
  for (const [index, e] of c.events.entries()) statements.push(db.prepare("INSERT INTO glove_events(id,sequence,at,actor_id,actor_name,actor_role,command_id,job_id,subject_kind,subject_id,kind,summary,data) VALUES(?,(SELECT COALESCE(MAX(sequence),0)+1 FROM glove_events),?,?,?,?,?,?,?,?,?,?,?)").bind(e.id, c.now, e.actor.id, e.actor.name, e.actor.role, c.commandId, e.jobId, e.subjectKind, e.subjectId, e.kind, e.summary, JSON.stringify(index === 0 ? { ...(e.data && typeof e.data === 'object' && !Array.isArray(e.data) ? e.data : { detail: e.data ?? null }), recordChanges: changes } : e.data ?? null)))
  statements.push(db.prepare('UPDATE glove_meta SET version=version+1 WHERE id=1 AND version=?').bind(before.version))
  statements.push(db.prepare('INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN changes()=1 THEN 1 ELSE 0 END)').bind(crypto.randomUUID()))
  const response = { ok: true, result, version: before.version + 1 }
  statements.push(db.prepare('INSERT INTO glove_commands(id,actor_id,type,digest,result,created_at) VALUES(?,?,?,?,?,?)').bind(c.commandId, c.actor.id, type, digest, JSON.stringify(response), c.now))
  statements.push(db.prepare('DELETE FROM glove_guard'))
  if (c.privacy) await commitPrivacy(db, c, statements)
  else await db.batch(statements)
  return response
}
