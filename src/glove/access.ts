import { operatorAuth, type Bindings } from '../auth.server'
import { Problem, fail, roles, type Actor, type Role } from './model'

// Who may do what. Every command and every read checks the actor's current
// role here, and storage.ts re-checks the same session and role inside the
// atomic D1 batch that commits the change, so a role removed mid-request
// cannot slip a write through.

const all: Role[] = ['owner', 'dispatcher', 'technician', 'office', 'agent', 'viewer']
const desk: Role[] = ['owner', 'dispatcher', 'office']

export const permissions: Record<string, Role[]> = {
  'business.save': ['owner'],
  'role.set': ['owner'],
  'role.save': ['owner'],
  // AGENT-009: only the owner grants, revokes and pauses agents.
  'grant.create': ['owner'],
  'grant.revoke': ['owner'],
  'agents.pause': ['owner'],
  'service.save': ['owner'],
  'technician.save': ['owner'],
  'customer.save': desk,
  'site.save': desk,
  // The desk, or the technician on a visit at that site (checked against the visit).
  'equipment.save': [...desk, 'technician'],
  'enquiry.create': [...desk, 'agent'],
  'enquiry.contact': desk,
  'enquiry.close': desk,
  // Agents prepare quote drafts; only a person approves the price or records the customer's answer.
  'quote.draft': ['owner', 'dispatcher', 'agent'],
  'quote.revise': ['owner', 'dispatcher', 'agent'],
  'quote.approve': ['owner', 'dispatcher'],
  'quote.markSent': ['owner', 'dispatcher', 'office'],
  'quote.accept': ['owner', 'dispatcher'],
  'quote.decline': ['owner', 'dispatcher'],
  'job.create': ['owner', 'dispatcher'],
  'visit.book': ['owner', 'dispatcher'],
  'visit.change': ['owner', 'dispatcher'],
  'visit.cancel': ['owner', 'dispatcher'],
  'visit.reviewLateEvidence': ['owner', 'dispatcher'],
  'proposal.prepare': ['agent', 'owner', 'dispatcher'],
  'proposal.approve': ['owner', 'dispatcher'],
  'proposal.decline': ['owner', 'dispatcher'],
  // Field capture is the assigned technician's (checked against the visit).
  'visit.arrive': ['technician'],
  'visit.capture': ['technician'],
  'visit.complete': ['technician'],
  // Technicians record expenses on their visits; the office sets billable and markup.
  'expense.record': ['owner', 'office', 'technician'],
  'expense.price': ['owner', 'office'],
  'invoice.prepare': ['owner', 'office', 'agent'],
  'invoice.revise': ['owner', 'office', 'agent'],
  'invoice.approve': ['owner', 'office'],
  'invoice.export': ['owner', 'office'],
  'invoice.correct': ['owner', 'office'],
  'import.stage': ['owner'],
  'import.commit': ['owner'],
  'import.undo': ['owner'],
}

export type Door = 'state' | 'file' | 'reports' | 'export'
const reads: Record<Door, Role[]> = { state: all, export: ['owner', 'office'], file: all, reports: ['owner', 'dispatcher', 'office', 'agent', 'viewer'] }

// Custom roles (TEAM-001) are built by the owner from named permissions: any
// desk command below except the owner's own (business, roles, move-in) and the
// technician's field capture, plus "reports.read" (job costs, margins and
// reports) and "export.read" (business export and invoice CSVs). Every custom
// role reads the desk's records and files, like a Viewer.
const ownerOnly = new Set(['business.save', 'role.set', 'role.save', 'grant.create', 'grant.revoke', 'agents.pause', 'import.stage', 'import.commit', 'import.undo'])
const fieldOnly = new Set(['visit.arrive', 'visit.capture', 'visit.complete'])
export const grantable = [...Object.keys(permissions).filter(t => !ownerOnly.has(t) && !fieldOnly.has(t)), 'reports.read', 'export.read']

const holds = (actor: Actor, type: string) => actor.custom ? actor.custom.permissions.includes(type) : permissions[type].includes(actor.role as Role)

export function allow(actor: Actor, type: string) {
  if (!permissions[type]) fail('COMMAND', 'Unknown command type.', { type }, 400)
  if (!holds(actor, type)) fail('FORBIDDEN', `Your role (${actor.custom?.name ?? actor.role}) cannot ${type}.`, { type, role: actor.role }, 403)
}

export const mayRead = (actor: Actor, door: Door) => actor.custom ? door === 'state' || door === 'file' || actor.custom.permissions.includes(`${door}.read`) : reads[door].includes(actor.role as Role)

/** What the screens may offer this person: the commands and read doors they hold. */
export const grants = (actor: Actor) => ({ commands: Object.keys(permissions).filter(t => holds(actor, t)), reads: (Object.keys(reads) as Door[]).filter(d => mayRead(actor, d)) })

/** The edition role of an operator: an assigned Glove role, else owner for the native owner, else viewer. */
export const roleSql = (operator: string) => `COALESCE((SELECT role FROM glove_roles WHERE operator_id=${operator}), (SELECT CASE WHEN role='owner' THEN 'owner' ELSE 'viewer' END FROM oa_operators WHERE id=${operator}))`

export async function currentActor(request: Request, env: Bindings): Promise<Actor> {
  const session = await operatorAuth(env).getSession(request)
  if (!session) throw new Problem('AUTH', 'Sign in with a current session.', null, 401)
  const row = await env.DB.prepare(`SELECT ${roleSql('?')} AS role`).bind(session.operator.id, session.operator.id).first<{ role: string }>()
  const base = { id: session.operator.id, name: session.operator.displayName, sessionId: session.id, operatorVersion: session.operator.version }
  const customId = row?.role?.startsWith('custom:') ? row.role.slice(7) : null
  if (customId) {
    const record = await env.DB.prepare("SELECT version,data FROM glove_records WHERE kind='roles' AND id=?").bind(customId).first<{ version: number; data: string }>()
    const data = record ? JSON.parse(record.data) : { name: 'Removed role', permissions: [] }
    return { ...base, role: `custom:${customId}`, custom: { id: customId, version: record?.version ?? 0, name: data.name, permissions: data.permissions } }
  }
  return { ...base, role: roles.find(r => r === row?.role) ?? 'viewer' }
}

/** Scalar SQL: this exact session is live, the operator still holds the actor's role, and a custom role's permissions are unchanged. */
export function authority(actor: Actor) {
  return {
    sql: `EXISTS(SELECT 1 FROM oa_sessions s JOIN oa_operators o ON o.id=s.operator_id WHERE s.id=? AND o.id=? AND o.version=? AND s.operator_version=o.version AND o.status='active' AND s.revoked_at IS NULL AND s.expires_at>?) AND ${roleSql('?')}=? AND COALESCE((SELECT version FROM glove_records WHERE kind='roles' AND id=?),0)=?`,
    params: [actor.sessionId, actor.id, actor.operatorVersion, Date.now(), actor.id, actor.id, actor.role, actor.custom?.id ?? '', actor.custom?.version ?? 0] as unknown[],
  }
}
