import { operatorAuth, type Bindings } from '../auth.server'
import { Problem, fail, roles, type Actor, type Role } from './model'

// Who may do what. Every command and every read checks the actor's current
// role here, and storage.ts re-checks the same session and role inside the
// atomic D1 batch that commits the change, so a role removed mid-request
// cannot slip a write through.

const all: Role[] = ['owner', 'dispatcher', 'technician', 'subcontractor', 'office', 'agent', 'viewer']
/** DISP-007: a Subcontractor records arrival, captures and completion on their own visits like a Technician. */
const field: Role[] = ['technician', 'subcontractor']
export const fieldRole = (actor: { role: string }) => (field as string[]).includes(actor.role)
const desk: Role[] = ['owner', 'dispatcher', 'office']

export const permissions: Record<string, Role[]> = {
  'business.save': ['owner'],
  'branch.save': ['owner'],
  'branch.limit': ['owner'],
  'companycam.connect': ['owner'],
  'companycam.link': ['owner', 'dispatcher'],
  'companycam.pull': ['owner', 'dispatcher'],
  'companycam.send': ['owner', 'dispatcher'],
  'companycam.reconcile': ['owner'],
  'role.set': ['owner'],
  'role.save': ['owner'],
  // AGENT-009: only the owner grants, revokes and pauses agents.
  'grant.create': ['owner'],
  'grant.revoke': ['owner'],
  'agents.pause': ['owner'],
  'service.save': ['owner'],
  // FIELD-002: the owner builds forms and attaches them to services and equipment types.
  'form.save': ['owner'],
  // MONEY-003: category markups, bulk price changes and the price-book CSV.
  'pricebook.category': ['owner'],
  'pricebook.adjust': ['owner'],
  'pricebook.import': ['owner'],
  'technician.save': ['owner'],
  // STOCK-001: the owner and office keep stock locations, counts, restocks and transfers.
  'stock.location': ['owner', 'office'],
  'stock.count': ['owner', 'office'],
  'stock.restock': ['owner', 'office'],
  'stock.transfer': ['owner', 'office'],
  // CUST-004: the owner defines custom fields; the desk sets values and tags and saves segments.
  'field.save': ['owner'],
  'record.custom': ['owner', 'dispatcher', 'office'],
  'customer.tags': ['owner', 'dispatcher', 'office'],
  'segment.save': ['owner', 'dispatcher', 'office'],
  // CUST-004: the owner connects Mango or Mailchimp with a key; the owner and office push a segment.
  'marketing.connect': ['owner'],
  'segment.push': ['owner', 'office'],
  // API-005: the owner and office keep workflow rules; each run acts as its creator's current role (rules.ts).
  'rule.save': ['owner', 'office'],
  // STOCK-002: the owner and office raise, record sent and receive purchase orders.
  'po.save': ['owner', 'office'],
  'po.send': ['owner', 'office'],
  'po.receive': ['owner', 'office'],
  // DISP-004: the owner, or the technician for their own record (checked in the command).
  'technician.calendar': ['owner', 'technician'],
  'technician.calendarRead': ['owner', 'dispatcher', 'technician'],
  'customer.save': desk,
  'site.save': desk,
  // CUST-005: the desk reviews and merges duplicate customers, and undoes a merge.
  'customer.merge': desk,
  'customer.unmerge': desk,
  // The desk, or the technician on a visit at that site (checked against the visit).
  'equipment.save': [...desk, 'technician'],
  // FIELD-006: the owner connects the model provider and the desk keeps the manual library; the technician reads and confirms nameplates on their visit.
  'model.connect': ['owner'],
  'manual.save': desk,
  'nameplate.read': ['technician'],
  'nameplate.confirm': ['technician'],
  'nameplate.discard': ['technician'],
  // AGENT-006: the agent (or the owner or a dispatcher) prepares an advisory callback checklist.
  'callback.prepare': ['agent', 'owner', 'dispatcher'],
  // AGENT-005: the agent (or the owner or a dispatcher) has the model draft a quote from a request; a person approves its prices.
  'quote.suggest': ['agent', 'owner', 'dispatcher'],
  // FIELD-004: the owner turns phone notifications on or off; a technician subscribes or removes their own phones. No door sends a push on demand.
  'push.setup': ['owner'],
  'push.subscribe': ['technician'],
  'push.unsubscribe': ['technician'],
  'enquiry.create': [...desk, 'agent'],
  'enquiry.contact': desk,
  'enquiry.close': desk,
  // Agents prepare quote drafts; only a person approves the price or records the customer's answer.
  // QUOTE-001: the owner keeps reusable quote templates beside the price book.
  'template.save': ['owner'],
  'quote.draft': ['owner', 'dispatcher', 'agent'],
  'quote.revise': ['owner', 'dispatcher', 'agent'],
  'quote.approve': ['owner', 'dispatcher'],
  'quote.markSent': ['owner', 'dispatcher', 'office'],
  'quote.accept': ['owner', 'dispatcher'],
  'quote.decline': ['owner', 'dispatcher'],
  // BOOK-005: the office makes service calls too; a job from an accepted quote stays the dispatcher's (dispatch.ts).
  'job.create': ['owner', 'dispatcher', 'office'],
  'visit.book': ['owner', 'dispatcher'],
  'visit.change': ['owner', 'dispatcher'],
  // BOOK-006: an assessment visit on a request is booked like any visit.
  'assessment.book': ['owner', 'dispatcher'],
  // PLAN-001: recurring jobs are booked like visits.
  'series.create': ['owner', 'dispatcher'],
  'series.change': ['owner', 'dispatcher'],
  'visit.cancel': ['owner', 'dispatcher'],
  'visit.reviewLateEvidence': ['owner', 'dispatcher'],
  'proposal.prepare': ['agent', 'owner', 'dispatcher'],
  'proposal.approve': ['owner', 'dispatcher'],
  'proposal.decline': ['owner', 'dispatcher'],
  // Field capture is the assigned technician's (checked against the visit).
  'visit.arrive': field,
  'visit.capture': field,
  'visit.complete': field,
  // DISP-007: the owner sets a subcontractor's agreed amount on their visit (for 1099 totals).
  'visit.agree': ['owner'],
  // DISP-007: the owner names crews; a crew is booked, moved and canceled as one by whoever books visits.
  'crew.save': ['owner'],
  // COST-001: the technician clocks in and out and runs timers on their own visits; the desk corrects time with a reason.
  'clock.in': ['technician'],
  'clock.out': ['technician'],
  'timer.start': ['technician'],
  'timer.stop': ['technician'],
  'time.correct': desk,
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
const ownerOnly = new Set(['business.save', 'branch.save', 'branch.limit', 'companycam.connect', 'companycam.reconcile', 'marketing.connect', 'model.connect', 'role.set', 'role.save', 'grant.create', 'grant.revoke', 'agents.pause', 'import.stage', 'import.commit', 'import.undo', 'technician.calendar', 'push.setup', 'visit.agree', 'crew.save'])
const fieldOnly = new Set(['visit.arrive', 'visit.capture', 'visit.complete', 'nameplate.read', 'nameplate.confirm', 'nameplate.discard', 'clock.in', 'clock.out', 'timer.start', 'timer.stop', 'push.subscribe', 'push.unsubscribe'])
export const grantable = [...Object.keys(permissions).filter(t => !ownerOnly.has(t) && !fieldOnly.has(t)), 'reports.read', 'export.read']

const branchReadOnly = new Set(['business.save', 'branch.save', 'branch.limit', 'role.set', 'role.save', 'service.save', 'form.save', 'field.save', 'template.save', 'manual.save', 'pricebook.category', 'pricebook.adjust', 'pricebook.import', 'marketing.connect', 'model.connect', 'push.setup', 'companycam.connect', 'grant.create', 'grant.revoke', 'agents.pause', 'import.stage', 'import.commit', 'import.undo'])

const holds = (actor: Actor, type: string) => !(actor.branch && branchReadOnly.has(type)) && (actor.custom ? actor.custom.permissions.includes(type) : permissions[type].includes(actor.role as Role))

export function allow(actor: Actor, type: string) {
  if (actor.branch && branchReadOnly.has(type)) fail('FORBIDDEN', 'A branch-limited person changes only their branch’s records.', null, 403)
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
  const limit = await env.DB.prepare("SELECT version,data FROM glove_records WHERE kind='branchAccess' AND id=?").bind(session.operator.id).first<{ version: number; data: string }>()
  const branch = limit && JSON.parse(limit.data).limited !== false ? { id: JSON.parse(limit.data).branchId, version: limit.version } : undefined
  const base = { branch, branchRevision: limit?.version ?? 0, id: session.operator.id, name: session.operator.displayName, sessionId: session.id, operatorVersion: session.operator.version }
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
    sql: `EXISTS(SELECT 1 FROM oa_sessions s JOIN oa_operators o ON o.id=s.operator_id WHERE s.id=? AND o.id=? AND o.version=? AND s.operator_version=o.version AND o.status='active' AND s.revoked_at IS NULL AND s.expires_at>?) AND ${roleSql('?')}=? AND COALESCE((SELECT version FROM glove_records WHERE kind='roles' AND id=?),0)=? AND COALESCE((SELECT version FROM glove_records WHERE kind='branchAccess' AND id=?),0)=?`,
    params: [actor.sessionId, actor.id, actor.operatorVersion, Date.now(), actor.id, actor.id, actor.role, actor.custom?.id ?? '', actor.custom?.version ?? 0, actor.id, actor.branchRevision ?? 0] as unknown[],
  }
}
