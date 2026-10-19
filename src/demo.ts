import type { Bindings } from './auth.server'
import { load } from './glove/storage'
import { demoClock, demoRecords } from './demo/records'
import { demoMoveIn } from './demo/movein'
import { DEMO_TECHNICIANS } from './demo/servicem8'

/** Real, versioned Glove records. Fixed identities preserve visitors' edits on re-entry. */
export async function seedDemo(env: Bindings, { ownerEmail, now }: { ownerEmail: string; now: Date }) {
 const db = env.DB
 // A demo owner claimed under the generic name reads as the business's owner.
 await db.prepare("UPDATE oa_operators SET display_name='Daniel Pacheco' WHERE email=? AND role='owner' AND display_name='Owner'").bind(ownerEmail).run()
 const owner = await db.prepare("SELECT id,display_name AS name FROM oa_operators WHERE email=? AND role='owner' AND status='active'").bind(ownerEmail).first<{ id: string; name: string }>()
 if (!owner) throw new Error('Demo owner is not ready')
 const person = { ...owner, role: 'owner' }, clock = demoClock(now)
 const moved = await demoMoveIn(db, person, now, clock.zone, clock.at)
 const s = await load(db), pick = <T extends { id: string }>(rows: T[], ids: string[]) => ids.map(id => rows.find(r => r.id === id)!)
 const customers = pick(s.customers, moved.customers.map(c => c.customerId))
 const { records, updates, events } = await demoRecords(person, clock, { customers, sites: s.sites.filter(site => customers.some(c => c.id === site.customerId)), technicians: pick(s.technicians, moved.technicians) })
 const statements: D1PreparedStatement[] = []
 // The six technicians sign in on their phones; the agent prepares dispatch proposals.
 const people = [...DEMO_TECHNICIANS.map(([first, last], i) => ({ id: `demo-person-${i}`, name: `${first} ${last}`, email: `${first.toLowerCase()}@pachecoplumbing.example`, role: 'technician' })), { id: 'demo-assistant', name: 'Glove agent', email: 'agent@pachecoplumbing.example', role: 'agent' }]
 for (const p of people) {
  statements.push(db.prepare("INSERT INTO oa_operators(id,email,display_name,role,status,created_at) VALUES(?,?,?,'member','active',?) ON CONFLICT(id) DO NOTHING").bind(p.id, p.email, p.name, now.getTime() - 30 * 86400000), db.prepare('INSERT INTO glove_roles(operator_id,role,assigned_by,assigned_at) VALUES(?,?,?,?) ON CONFLICT(operator_id) DO NOTHING').bind(p.id, p.role, owner.id, now.toISOString()))
 }
 statements.push(...[...records, ['imports', moved.batch] as const].map(([kind, row]) => db.prepare('INSERT INTO glove_records(kind,id,version,data) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO NOTHING').bind(kind, row.id, row.version, JSON.stringify(row))))
 // Edits made in Glove after the move-in, as a command commits them (storage.ts).
 statements.push(...updates.map(([kind, row]) => db.prepare('UPDATE glove_records SET version=?,data=?,revision=NULL WHERE kind=? AND id=? AND version=?').bind(row.version, JSON.stringify(row), kind, row.id, row.version - 1)))
 for (const e of [...moved.events, ...events]) statements.push(db.prepare("INSERT INTO glove_events(id,sequence,at,actor_id,actor_name,actor_role,command_id,job_id,subject_kind,subject_id,kind,summary,data) VALUES(?,(SELECT COALESCE(MAX(sequence),0)+1 FROM glove_events),?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(e.id, e.at, e.by.id, e.by.name, e.by.role, e.id, e.jobId, e.subjectKind, e.subjectId, e.kind, e.summary, 'null'))
 statements.push(db.prepare('UPDATE glove_meta SET version=version+1 WHERE id=1'))
 statements.push(db.prepare('INSERT INTO oa_first_run(singleton,completed_by,completed_at) VALUES(1,?,?) ON CONFLICT(singleton) DO NOTHING').bind(owner.id, now.getTime()))
 await db.batch(statements)
}
