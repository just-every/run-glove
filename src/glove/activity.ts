import { collections, fail, type Row } from './model'

export const eventColumns = `id,sequence,at,actor_id AS actorId,actor_name AS actorName,actor_role AS actorRole,command_id AS commandId,job_id AS jobId,subject_kind AS subjectKind,subject_id AS subjectId,kind,summary,json_extract(data,'$.recordChanges') AS recordChanges`

/** DATA-002, DATA-009, DATA-010: every older event remains reachable from Activity, without an offset race. */
export async function activityPage(db: D1Database, before: string | null) {
  if (before !== null && !/^[1-9]\d*$/.test(before)) fail('INPUT', 'before is a positive event sequence.', null, 400)
  const rows = before === null ? (await db.prepare(`SELECT ${eventColumns} FROM glove_events ORDER BY sequence DESC LIMIT 100`).all<any>()).results : (await db.prepare(`SELECT ${eventColumns} FROM glove_events WHERE sequence<? ORDER BY sequence DESC LIMIT 100`).bind(Number(before)).all<any>()).results
  const oldest = rows.at(-1)?.sequence
  return { events: rows, next: oldest && oldest > 1 ? oldest : null }
}

/** Audit metadata follows the same current record visibility as the underlying read. */
export function visibleChanges(events: Row[], view: object, owner: boolean) {
  const allowed = new Map(collections.map(k => [k, new Set(((view as any)[k] ?? []).map((r: Row) => r.id))]))
  return events.map(e => ({ ...e, recordChanges: (e.recordChanges ? JSON.parse(e.recordChanges) : []).filter((r: any) => owner || allowed.get(r.kind)?.has(r.id)) }))
}
