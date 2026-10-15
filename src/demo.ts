import type { Bindings } from './auth.server'
import { demoRecords } from './demo/records'

/** Real, versioned Glove records. Fixed identities preserve visitors' edits on re-entry. */
export async function seedDemo(env: Bindings, { ownerEmail, now }: { ownerEmail: string; now: Date }) {
 const owner = await env.DB.prepare("SELECT id,display_name AS name FROM oa_operators WHERE email=? AND role='owner' AND status='active'").bind(ownerEmail).first<{ id: string; name: string }>()
 if (!owner) throw new Error('Demo owner is not ready')
 const { records, events } = demoRecords({ ...owner, role: 'owner' }, now)
 const statements: D1PreparedStatement[] = []
 const people = ['Priya Nair', 'Tom Brooks', 'Alex Nguyen', 'Ada · planning assistant']
 for (const [i, name] of people.entries()) {
  const id = i === 3 ? 'demo-assistant' : `demo-person-${i}`, role = i === 3 ? 'agent' : 'technician'
  statements.push(env.DB.prepare("INSERT INTO oa_operators(id,email,display_name,role,status,created_at) VALUES(?,?,?,'member','active',?) ON CONFLICT(id) DO NOTHING").bind(id, `${['priya','tom','alex','ada'][i]}@harbourair.example`, name, now.getTime() - 30 * 86400000), env.DB.prepare('INSERT INTO glove_roles(operator_id,role,assigned_by,assigned_at) VALUES(?,?,?,?) ON CONFLICT(operator_id) DO NOTHING').bind(id, role, owner.id, now.toISOString()))
 }
 statements.push(...records.map(([kind, row]) => env.DB.prepare('INSERT INTO glove_records(kind,id,version,data) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO NOTHING').bind(kind, row.id, row.version, JSON.stringify(row))))
 for (const e of events) statements.push(env.DB.prepare("INSERT INTO glove_events(id,sequence,at,actor_id,actor_name,actor_role,command_id,job_id,subject_kind,subject_id,kind,summary,data) VALUES(?,(SELECT COALESCE(MAX(sequence),0)+1 FROM glove_events),?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(e.id, e.at, e.by.id, e.by.name, e.by.role, e.id, e.jobId, e.subjectKind, e.subjectId, e.kind, e.summary, 'null'))
 statements.push(env.DB.prepare('INSERT INTO oa_first_run(singleton,completed_by,completed_at) VALUES(1,?,?) ON CONFLICT(singleton) DO NOTHING').bind(owner.id, now.getTime()))
 await env.DB.batch(statements)
}
