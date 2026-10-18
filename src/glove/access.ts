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

export const reads = { state: all, export: ['owner', 'office'] as Role[], file: all, reports: ['owner', 'dispatcher', 'office', 'agent', 'viewer'] as Role[] }

export function allow(actor: Actor, type: string) {
  const allowed = permissions[type] ?? fail('COMMAND', 'Unknown command type.', { type }, 400)
  if (!allowed.includes(actor.role)) fail('FORBIDDEN', `Your role (${actor.role}) cannot ${type}.`, { type, role: actor.role, allowed }, 403)
}

/** The edition role of an operator: an assigned Glove role, else owner for the native owner, else viewer. */
export const roleSql = (operator: string) => `COALESCE((SELECT role FROM glove_roles WHERE operator_id=${operator}), (SELECT CASE WHEN role='owner' THEN 'owner' ELSE 'viewer' END FROM oa_operators WHERE id=${operator}))`

export async function currentActor(request: Request, env: Bindings): Promise<Actor> {
  const session = await operatorAuth(env).getSession(request)
  if (!session) throw new Problem('AUTH', 'Sign in with a current session.', null, 401)
  const row = await env.DB.prepare(`SELECT ${roleSql('?')} AS role`).bind(session.operator.id, session.operator.id).first<{ role: string }>()
  const role = roles.find(r => r === row?.role) ?? 'viewer'
  return { id: session.operator.id, name: session.operator.displayName, role, sessionId: session.id, operatorVersion: session.operator.version }
}

/** Scalar SQL: this exact session is live and the operator still holds the actor's role. */
export function authority(actor: Actor) {
  return {
    sql: `EXISTS(SELECT 1 FROM oa_sessions s JOIN oa_operators o ON o.id=s.operator_id WHERE s.id=? AND o.id=? AND o.version=? AND s.operator_version=o.version AND o.status='active' AND s.revoked_at IS NULL AND s.expires_at>?) AND ${roleSql('?')}=?`,
    params: [actor.sessionId, actor.id, actor.operatorVersion, Date.now(), actor.id, actor.id, actor.role] as unknown[],
  }
}
