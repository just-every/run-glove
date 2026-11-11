/** DATA-002, DATA-009, DATA-010: provider facts survive even when the originating command loses
 * authority before its final commit. Never put credentials or payloads here. */
export function providerEvent(db: D1Database, e: { id: string; at: string; commandId: string; provider: string; jobId?: string | null; subjectKind: string; subjectId: string; kind: string; summary: string; data: unknown; recipientGuard?: string }) {
  return db.prepare("INSERT INTO glove_events(id,sequence,at,actor_id,actor_name,actor_role,command_id,job_id,subject_kind,subject_id,kind,summary,data) SELECT ?,(SELECT COALESCE(MAX(sequence),0)+1 FROM glove_events),?,?,?,'provider',?,?,?,?,?,?,? WHERE ?=0 OR EXISTS(SELECT 1 FROM glove_records WHERE kind='messages' AND id=? AND json_extract(data,'$.to')=?) ON CONFLICT(id) DO NOTHING")
    .bind(e.id, e.at, `provider:${e.provider}`, e.provider, e.commandId, e.jobId ?? null, e.subjectKind, e.subjectId, e.kind, e.summary, JSON.stringify(e.data), e.recipientGuard === undefined ? 0 : 1, e.subjectId, e.recipientGuard ?? '')
}

import { collections, type State, type Collection } from './model'

export type RecordChange = { kind: Collection; id: string; fromVersion: number | null; toVersion: number | null; fields: string[] }

/** Field names and record versions explain a change without copying private values. */
export function recordChanges(before: State, after: State) {
  return collections.flatMap(kind => {
    const old = new Map(before[kind].map(r => [r.id, r])), next = new Map(after[kind].map(r => [r.id, r]))
    return [...new Set([...old.keys(), ...next.keys()])].flatMap(id => {
      const a = old.get(id), b = next.get(id)
      const fields = [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])].filter(k => JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k]))
      return fields.length ? [{ kind, id, fromVersion: a?.version ?? null, toVersion: b?.version ?? null, fields }] : []
    })
  })
}

/** Two changes to one record in a command read as one: the first starting version, the last ending version, every field either touched. */
export function mergeChanges(first: RecordChange[], second: RecordChange[]): RecordChange[] {
  const merged = new Map<string, RecordChange>()
  for (const change of [...first, ...second]) {
    const key = `${change.kind}:${change.id}`, seen = merged.get(key)
    merged.set(key, seen ? { ...seen, toVersion: change.toVersion, fields: [...new Set([...seen.fields, ...change.fields])] } : change)
  }
  return [...merged.values()]
}
