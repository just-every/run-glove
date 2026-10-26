import { fieldInvoiceCustodyPath } from './field-invoices'
import { operatorAuth, type Bindings } from '../auth.server'
import { Problem, fail, roles, type Actor, type Role } from './model'
import { bearer, tokenAuthority, tokenNever } from './tokens'

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
  'invoice.text': ['owner'],
  'invoice.textConsent': ['owner'],
  'xero.connect': ['owner'],
  'xero.inspect': ['owner'],
  'invoice.chase': ['owner', 'office', 'agent'],
  'reconciliation.prepare': ['owner', 'office', 'agent'],
  'reconciliation.decide': ['owner', 'office'],
  'qbo.createCustomer': ['owner'],
  'qbo.discover': ['owner'],
  'qbo.connect': ['owner'],
  'qbo.reconcile': ['owner'],
  'qbo.confirmLinks': ['owner'],
  'qbo.configure': ['owner'],
  'qbo.map': ['owner'],
  'qbo.sync': ['owner'],
  'qbo.pull': ['owner'],
  'payment.autopayAuthorize': ['owner'],
  'payment.autopayRevoke': ['owner'],
  'payment.autopayCharge': ['owner'],
  'customer.hubPreview': ['owner'],
  'payment.savedCardRegister': ['owner'],
  'payment.savedCardRevoke': ['owner'],
  'payment.savedCardCharge': ['owner', 'office'],
  'sms.reply': ['owner', 'dispatcher', 'office'],
  'sms.inboxConfigure': ['owner'],
  'visitNotice.configure': ['owner'],
  'visitNotice.preview': ['owner'],
  'visit.onMyWay': ['technician'],
  'sms.thread': ['owner', 'dispatcher', 'office'],
  'sms.assign': ['owner', 'dispatcher', 'office'],
  'sms.connect': ['owner'],
  'sms.configure': ['owner'],
  'sms.consent': ['owner'],
  'quote.followupComplete': ['owner', 'dispatcher', 'office'],
  'visit.replyLink': ['owner'],
  'fieldQuote.configure': ['owner'],
  'fieldQuote.apply': ['owner'],
  'fieldQuote.draft': ['technician'],
  'reminder.preview': ['owner'],
  'reminder.configure': ['owner'],
  'reminder.consent': ['owner'],
  'invoice.dispute': ['owner'],
  'payout.instantPreview': ['owner'],
  'payout.instantConfirm': ['owner'],
  'financing.connect': ['owner'],
  'financing.refresh': ['owner'],
  'payout.allocate': ['owner'],
  'payout.reconcile': ['owner'],
  'payout.feeSchedule': ['owner'],
  'payment.depositBatch': ['owner', 'office'],
  'payment.connect': ['owner'],
  'payment.preferences': ['owner'],
  'payment.checkout': ['owner'],
  'payment.receipt': ['owner', 'office'],
  'quote.deposit': ['owner'],
  'service.deposit': ['owner'],
  'payment.depositCheckout': ['owner'],
  'payment.record': ['owner', 'office'],
  'payment.credit': ['owner'],
  'payment.allocate': ['owner', 'office'],
  'payment.refund': ['owner'],
  'payment.refundRefresh': ['owner'],
  'intake.configure': ['owner'],
  'intake.withdrawPhotos': ['owner'],
  'document.template': ['owner'],
  'document.photo': ['owner'],
  'quote.consent': ['owner'],
  'series.billing': ['owner'],
  'series.billingRun': ['owner', 'office'],
  'route.optimize': ['owner', 'dispatcher'],
  'route.accept': ['owner', 'dispatcher'],
  'route.discard': ['owner', 'dispatcher'],
  'privacy.preview': ['owner'],
  'privacy.export': ['owner'],
  'privacy.erase': ['owner'],
  'business.save': ['owner'],
  'branch.save': ['owner'],
  'branch.limit': ['owner'],
  'tax.connect': ['owner'],
  'tax.lookup': ['owner'],
  'companycam.connect': ['owner'],
  'companycam.link': ['owner', 'dispatcher'],
  'companycam.pull': ['owner', 'dispatcher'],
  'companycam.send': ['owner', 'dispatcher'],
  'companycam.reconcile': ['owner'],
  'role.set': ['owner'],
  'role.save': ['owner'],
  // API-002: only the owner issues and revokes integration tokens.
  'token.issue': ['owner'],
  'token.revoke': ['owner'],
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
  // DISP-002: the owner connects Google Maps and draws each technician's zones; the desk places sites on the map.
  'maps.connect': ['owner'],
  'technician.zones': ['owner'],
  'site.locate': desk,
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
  'calendar.connect': ['owner'],
  'calendar.read': ['owner', 'dispatcher'],
  'technician.calendar': ['owner', 'technician'],
  'technician.calendarRead': ['owner', 'dispatcher', 'technician'],
  'customer.save': desk,
  'customer.certificate': desk,
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
  // COMM-001: the owner connects the customer-email provider; the desk emails what it may already record as sent (checked per kind in commands/mail.ts).
  'mail.connect': ['owner'],
  'mail.callback': ['owner'],
  'mail.morning': ['owner'],
  'email.send': desk,
  'enquiry.create': [...desk, 'agent'],
  // COMM-007: whoever handles customer messages logs a call or note on the customer or one of their jobs.
  'conversation.log': desk,
  // PLAN-002: the owner defines plans; the desk sells and ends agreements.
  'plan.save': ['owner'],
  'agreement.sell': desk,
  'agreement.end': desk,
  // PLAN-004: the desk records a customer's explicit decline of one included visit.
  'agreement.decline': desk,
  'booking.offer': ['owner'],
  'agreement.offer': desk,
  'agreement.offerRevoke': desk,
  'agreement.offerSent': desk,
  'enquiry.contact': desk,
  // BOOK-004: the owner connects lead sources; the owner and office set a lead's cost; the desk reads Google's leads now and records an acknowledgment sent.
  'lead.connect': ['owner'],
  'lead.pull': desk,
  'enquiry.cost': ['owner', 'office'],
  'enquiry.acknowledged': desk,
  'enquiry.reply': ['owner'],
  'enquiry.close': desk,
  // Agents prepare quote drafts; only a person approves the price or records the customer's answer.
  // QUOTE-001: the owner keeps reusable quote templates beside the price book.
  'template.save': ['owner'],
  'quote.draft': ['owner', 'dispatcher', 'agent'],
  'quote.revise': ['owner', 'dispatcher', 'agent'],
  'quote.approve': ['owner', 'dispatcher'],
  'quote.validity': ['owner'],
  'quote.link': desk,
  'quote.linkRevoke': desk,
  'quote.markSent': ['owner', 'dispatcher', 'office'],
  'quote.accept': ['owner', 'dispatcher'],
  'quote.decline': ['owner', 'dispatcher'],
  // BOOK-005: the office makes service calls too; a job from an accepted quote stays the dispatcher's (dispatch.ts).
  'job.create': ['owner', 'dispatcher', 'office'],
  // PLAN-004: Office books only jobs under a real agreement (checked in dispatch.ts).
  'visit.book': ['owner', 'dispatcher', 'office'],
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
  'technician.portrait': ['technician'],
  'review.configure': ['owner'],
  'review.consent': ['owner'],
  'review.request': ['owner'],
  'location.delegate': ['owner'],
  'location.consent': ['technician'],
  'location.phone': ['technician'],
  'location.fleetConnect': ['owner'],
  'location.fleetRead': ['owner'],
  'clock.in': ['technician'],
  'clock.out': ['technician'],
  'timer.start': ['technician'],
  'timer.stop': ['technician'],
  'time.correct': desk,
  // COST-002: the owner sets the workweek, daily overtime rule and ADP RUN codes, and approves each weekly timesheet.
  'payroll.settings': ['owner'],
  'timesheet.approve': ['owner'],
  // Technicians record expenses on their visits; the office sets billable and markup.
  'expense.record': ['owner', 'office', 'technician'],
  'expense.price': ['owner', 'office'],
  'report.link': ['owner', 'dispatcher', 'office'],
  'report.revoke': ['owner', 'dispatcher', 'office'],
  'report.quote': ['owner', 'dispatcher'],
  'invoice.fieldConfigure': ['owner'],
  'invoice.fieldPrepare': ['technician'],
  'invoice.prepare': ['owner', 'office', 'agent'],
  'invoice.prepareBatch': ['owner', 'office', 'agent'],
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
const ownerOnly = new Set(['invoice.fieldConfigure', 'booking.offer', 'review.configure', 'review.consent', 'review.request', 'location.delegate', 'location.fleetConnect', 'location.fleetRead', 'calendar.connect', 'sms.connect', 'sms.configure', 'sms.consent', 'visit.replyLink', 'fieldQuote.apply', 'fieldQuote.configure', 'enquiry.reply', 'reminder.preview', 'reminder.configure', 'reminder.consent', 'invoice.dispute', 'intake.configure', 'intake.withdrawPhotos', 'quote.consent', 'series.billing', 'lead.connect', 'maps.connect', 'technician.zones', 'document.template', 'document.photo', 'privacy.preview', 'privacy.export', 'privacy.erase', 'mail.callback', 'mail.connect', 'mail.morning', 'token.issue', 'token.revoke', 'business.save', 'branch.save', 'branch.limit', 'tax.connect', 'tax.lookup', 'companycam.connect', 'companycam.reconcile', 'marketing.connect', 'model.connect', 'role.set', 'role.save', 'grant.create', 'grant.revoke', 'agents.pause', 'import.stage', 'import.commit', 'import.undo', 'technician.calendar', 'push.setup', 'visit.agree', 'crew.save', 'payroll.settings', 'timesheet.approve', 'plan.save'])
const fieldOnly = new Set(['invoice.fieldPrepare', 'location.consent', 'location.phone', 'fieldQuote.draft', 'visit.arrive', 'visit.capture', 'visit.complete', 'nameplate.read', 'nameplate.confirm', 'nameplate.discard', 'clock.in', 'clock.out', 'timer.start', 'timer.stop', 'push.subscribe', 'push.unsubscribe'])
// First saved-card and inbox slices authorize named signed-in desk people only.
const personOnly = new Set(['reconciliation.decide', 'payment.autopayAuthorize', 'payment.autopayRevoke', 'payment.autopayCharge', 'customer.hubPreview', 'payment.savedCardRegister', 'payment.savedCardRevoke', 'payment.savedCardCharge', 'sms.reply', 'sms.thread', 'sms.assign', 'sms.inboxConfigure', 'visitNotice.configure', 'visitNotice.preview', 'visit.onMyWay'])
for (const type of ['invoice.text', 'invoice.textConsent']) { ownerOnly.add(type); personOnly.add(type); tokenNever.add(type) }
export const grantable = [...Object.keys(permissions).filter(t => t !== 'invoice.prepareBatch' && !ownerOnly.has(t) && !fieldOnly.has(t) && !personOnly.has(t)), 'reports.read', 'export.read']

const branchReadOnly = new Set(['invoice.fieldConfigure', 'booking.offer', 'location.fleetConnect', 'location.fleetRead', 'sms.connect', 'sms.configure', 'sms.consent', 'visit.replyLink', 'fieldQuote.apply', 'fieldQuote.configure', 'enquiry.reply', 'reminder.preview', 'reminder.configure', 'reminder.consent', 'invoice.dispute', 'intake.configure', 'intake.withdrawPhotos', 'quote.consent', 'lead.connect', 'maps.connect', 'document.template', 'privacy.preview', 'privacy.export', 'privacy.erase', 'mail.callback', 'mail.connect', 'mail.morning', 'token.issue', 'token.revoke', 'business.save', 'payroll.settings', 'plan.save', 'branch.save', 'branch.limit', 'tax.connect', 'tax.lookup', 'role.set', 'role.save', 'service.save', 'form.save', 'field.save', 'template.save', 'manual.save', 'pricebook.category', 'pricebook.adjust', 'pricebook.import', 'marketing.connect', 'model.connect', 'push.setup', 'companycam.connect', 'grant.create', 'grant.revoke', 'agents.pause', 'import.stage', 'import.commit', 'import.undo'])

for (const type of ['xero.connect', 'xero.inspect', 'payment.autopayAuthorize', 'payment.autopayRevoke', 'payment.autopayCharge', 'customer.hubPreview', 'qbo.createCustomer', 'qbo.discover', 'qbo.reconcile', 'qbo.confirmLinks', 'qbo.connect', 'qbo.configure', 'qbo.map', 'qbo.sync', 'qbo.pull', 'payment.savedCardRegister', 'payment.savedCardRevoke', 'sms.inboxConfigure', 'visitNotice.configure', 'visitNotice.preview']) {
  ownerOnly.add(type)
  branchReadOnly.add(type)
}
for (const type of ['invoice.text', 'invoice.textConsent']) branchReadOnly.add(type)
fieldOnly.add('visit.onMyWay')
fieldOnly.add('technician.portrait')

const holds = (actor: Actor, type: string) => !(actor.branch && branchReadOnly.has(type)) && (actor.custom ? actor.custom.permissions.includes(type === 'invoice.prepareBatch' ? 'invoice.prepare' : type) : permissions[type].includes(actor.role as Role))

export function allow(actor: Actor, type: string) {
  if (actor.token && tokenNever.has(type)) fail('FORBIDDEN', 'Integration tokens never manage tokens, roles, grants, branch limits or keys.', { type }, 403)
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
  // API-002: an integration token acts as its own role and branch, never as a person.
  const token = await bearer(request, env.DB)
  if (token) return withRole(env.DB, { branch: token.branchId === null ? undefined : { id: token.branchId === 'main' ? null : token.branchId, version: 0 }, id: `token:${token.id}`, name: `${token.name} (integration token)`, sessionId: '', operatorVersion: 0, token: token.id }, token.role)
  const session = await operatorAuth(env).getSession(request)
  if (!session) throw new Problem('AUTH', 'Sign in with a current session.', null, 401)
  const row = await env.DB.prepare(`SELECT ${roleSql('?')} AS role`).bind(session.operator.id, session.operator.id).first<{ role: string }>()
  const limit = await env.DB.prepare("SELECT version,data FROM glove_records WHERE kind='branchAccess' AND id=?").bind(session.operator.id).first<{ version: number; data: string }>()
  const branch = limit && JSON.parse(limit.data).limited !== false ? { id: JSON.parse(limit.data).branchId, version: limit.version } : undefined
  const actor = await withRole(env.DB, { branch, branchRevision: limit?.version ?? 0, id: session.operator.id, name: session.operator.displayName, sessionId: session.id, operatorVersion: session.operator.version }, row?.role)
  if (actor.role === 'technician') actor.fieldInvoiceGrant = (await env.DB.prepare("SELECT json_extract(value,?) AS value FROM glove_provider_keys WHERE provider='field-invoices'").bind(fieldInvoiceCustodyPath(actor.id)).first<{ value: string }>())?.value
  return actor
}

export async function withRole(db: D1Database, base: Omit<Actor, 'role'>, role: string | undefined): Promise<Actor> {
  const customId = role?.startsWith('custom:') ? role.slice(7) : null
  if (customId) {
    const record = await db.prepare("SELECT version,data FROM glove_records WHERE kind='roles' AND id=?").bind(customId).first<{ version: number; data: string }>()
    const data = record ? JSON.parse(record.data) : { name: 'Removed role', permissions: [] }
    return { ...base, role: `custom:${customId}`, custom: { id: customId, version: record?.version ?? 0, name: data.name, permissions: data.permissions } }
  }
  return { ...base, role: roles.find(r => r === role) ?? 'viewer' }
}

/** Scalar SQL: this exact session is live, the operator still holds the actor's role, and a custom role's permissions are unchanged. */
export function authority(actor: Actor) {
  if (actor.qboProvider) return { sql: 'EXISTS(SELECT 1 FROM glove_qbo_operations WHERE id=?)', params: [actor.qboProvider] as unknown[] }
  if (actor.paymentProvider) return { sql: `EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND json_extract(data,'$.stripe.connectionId')=?) AND EXISTS(SELECT 1 FROM glove_provider_keys WHERE provider='stripe-webhook')`, params: [actor.paymentProvider] as unknown[] }
  if (actor.token) return tokenAuthority(actor)
  // The dedicated website receiver has only the configuring owner's fixed
  // intake authority; a changed owner, branch or configuration aborts commit.
  if (actor.websiteIntake) return {
    sql: `EXISTS(SELECT 1 FROM oa_operators WHERE id=? AND version=? AND status='active') AND ${roleSql('?')}='owner' AND COALESCE((SELECT version FROM glove_records WHERE kind='branchAccess' AND id=?),0)=? AND EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND json_extract(data,'$.intake.configId')=? AND json_extract(data,'$.intake.enabled')=1 AND json_extract(data,'$.intake.by.id')=?) AND EXISTS(SELECT 1 FROM glove_provider_keys WHERE provider='turnstile')`,
    params: [actor.id, actor.operatorVersion, actor.id, actor.id, actor.id, actor.branchRevision ?? 0, actor.websiteIntake.configId, actor.id] as unknown[],
  }
  // PLAN-005: an explicit owner billing rule delegates only its due draft /
  // fixed approval pass. The scheduler builds this actor internally and fences
  // the owner's live role, branch limit and the full installation snapshot.
  if (actor.billingRun || actor.reminderRun) return {
    sql: `EXISTS(SELECT 1 FROM oa_operators WHERE id=? AND version=? AND status='active') AND ${roleSql('?')}='owner' AND COALESCE((SELECT version FROM glove_records WHERE kind='branchAccess' AND id=?),0)=?`,
    params: [actor.id, actor.operatorVersion, actor.id, actor.id, actor.id, actor.branchRevision ?? 0] as unknown[],
  }
  if (actor.emailStop) return {
    sql: `EXISTS(SELECT 1 FROM glove_email_stop_secrets WHERE hash=? AND customer_id=? AND expires_at>?)`,
    params: [actor.emailStop.hash, actor.emailStop.customerId, new Date().toISOString()] as unknown[],
  }
  if (actor.visitReply) return {
    sql: `EXISTS(SELECT 1 FROM oa_operators WHERE id=? AND version=? AND status='active') AND ${roleSql('?')}='owner' AND COALESCE((SELECT version FROM glove_records WHERE kind='branchAccess' AND id=?),0)=? AND EXISTS(SELECT 1 FROM glove_visit_reply_secrets WHERE link_id=? AND hash=? AND visit_id=? AND notice_key=? AND issuer_id=? AND expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
    params: [actor.id, actor.operatorVersion, actor.id, actor.id, actor.id, actor.branchRevision ?? 0, actor.visitReply.id, actor.visitReply.hash, actor.visitReply.visitId, actor.visitReply.noticeKey, actor.id] as unknown[],
  }
  if (actor.quoteLink) return {
    sql: `EXISTS(SELECT 1 FROM oa_operators WHERE id=? AND version=? AND status='active') AND ${roleSql('?')}=? AND COALESCE((SELECT version FROM glove_records WHERE kind='roles' AND id=?),0)=? AND COALESCE((SELECT version FROM glove_records WHERE kind='branchAccess' AND id=?),0)=? AND EXISTS(SELECT 1 FROM glove_quote_secrets secret JOIN glove_records link ON link.kind='quoteLinks' AND link.id=secret.link_id WHERE secret.hash=? AND link.id=? AND link.version=? AND json_extract(link.data,'$.revokedAt') IS NULL AND json_extract(link.data,'$.expiresAt')>strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
    params: [actor.id, actor.operatorVersion, actor.id, actor.id, actor.role, actor.custom?.id ?? '', actor.custom?.version ?? 0, actor.id, actor.branchRevision ?? 0, actor.quoteLink.hash, actor.quoteLink.id, actor.quoteLink.version] as unknown[],
  }
  // BOOK-004: a lead feed writes only while its provider is still connected.
  if (actor.leadFeed) return { sql: 'EXISTS(SELECT 1 FROM glove_lead_secrets WHERE provider=?)', params: [actor.leadFeed] as unknown[] }
  if (actor.bookingLink) return {
    sql: `EXISTS(SELECT 1 FROM oa_operators WHERE id=? AND version=? AND status='active') AND ${roleSql('?')}=? AND COALESCE((SELECT version FROM glove_records WHERE kind='roles' AND id=?),0)=? AND COALESCE((SELECT version FROM glove_records WHERE kind='branchAccess' AND id=?),0)=? AND EXISTS(SELECT 1 FROM glove_booking_secrets secret JOIN glove_records link ON link.kind='bookingOffers' AND link.id=secret.link_id WHERE secret.hash=? AND link.id=? AND link.version=? AND json_extract(link.data,'$.revokedAt') IS NULL AND json_extract(link.data,'$.expiresAt')>strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
    params: [actor.id, actor.operatorVersion, actor.id, actor.id, actor.role, actor.custom?.id ?? '', actor.custom?.version ?? 0, actor.id, actor.branchRevision ?? 0, actor.bookingLink.hash, actor.bookingLink.id, actor.bookingLink.version] as unknown[],
  }
  const fieldGrant = actor.fieldInvoiceGrant ? " AND EXISTS(SELECT 1 FROM glove_provider_keys WHERE provider='field-invoices' AND json_extract(value,?)=?)" : ''
  return {
    sql: `EXISTS(SELECT 1 FROM oa_sessions s JOIN oa_operators o ON o.id=s.operator_id WHERE s.id=? AND o.id=? AND o.version=? AND s.operator_version=o.version AND o.status='active' AND s.revoked_at IS NULL AND s.expires_at>?) AND ${roleSql('?')}=? AND COALESCE((SELECT version FROM glove_records WHERE kind='roles' AND id=?),0)=? AND COALESCE((SELECT version FROM glove_records WHERE kind='branchAccess' AND id=?),0)=?${fieldGrant}`,
    params: [actor.sessionId, actor.id, actor.operatorVersion, Date.now(), actor.id, actor.id, actor.role, actor.custom?.id ?? '', actor.custom?.version ?? 0, actor.id, actor.branchRevision ?? 0, ...(actor.fieldInvoiceGrant ? [fieldInvoiceCustodyPath(actor.id), actor.fieldInvoiceGrant] : [])] as unknown[],
  }
}
