// Glove's record model: one business, its customers and sites, quotes, jobs,
// visits, field captures and invoice preparations. Records are JSON rows with a
// per-record version; every change commits atomically with its command outcome
// and its timeline events (storage.ts).

export const roles = ['owner', 'dispatcher', 'technician', 'subcontractor', 'office', 'agent', 'viewer'] as const
export type Role = (typeof roles)[number]

export const collections = [
  'business', 'branches', 'branchAccess', 'customers', 'sites', 'services', 'technicians', 'enquiries', 'quotes', 'jobs', 'visits',
  'payments', 'payouts', 'financings', 'captures', 'invoices', 'exports', 'proposals', 'approvals', 'imports', 'equipment', 'expenses', 'roles', 'grants', 'merges', 'times', 'forms', 'stock', 'stockMoves', 'warnings', 'templates', 'purchaseOrders', 'rules', 'ruleRuns', 'notices', 'customFields', 'segments', 'pushes', 'manuals', 'nameplates', 'diagnoses', 'crews', 'serviceReports', 'serviceReportLinks', 'timesheets', 'conversations', 'plans', 'agreements', 'agreementChecks', 'bookingOffers', 'quoteLinks', 'messages', 'privacyRequests', 'routes',
] as const
export type Collection = (typeof collections)[number]

export type Row = { id: string; version: number; [key: string]: any }
export type State = { version: number } & Record<Collection, Row[]>

/** A custom role's actor carries role "custom:<id>" and the role's permissions at the version read. */
export type CustomRole = { id: string; version: number; name: string; permissions: string[] }
export type Actor = { agentDoor?: import('./agent-door/native').DoorAdmission; id: string; name: string; role: Role | `custom:${string}`; custom?: CustomRole; sessionId: string; operatorVersion: number; branchRevision?: number; branch?: { id: string | null; version: number }; token?: string; quoteLink?: { id: string; version: number; hash: string }; bookingLink?: { id: string; version: number; hash: string }; emailStop?: { hash: string; customerId: string }; visitReply?: { id: string; hash: string; visitId: string; noticeKey: string }; leadFeed?: string; billingRun?: boolean; reminderRun?: boolean; websiteIntake?: { configId: string }; paymentProvider?: string; qboProvider?: string; xeroProvider?: string }

export type TimelineEvent = {
  id: string; actor: Pick<Actor, 'id' | 'name' | 'role'>; jobId: string | null; subjectKind: string; subjectId: string
  kind: string; summary: string; data: unknown
}

export type Context = {
  xeroOperation?: { operationId: string; kind: string; id: string; fingerprint: string; resource: string; identity: string; body: Record<string, any>; total?: number; tax?: number }
  qboOperation?: { operationId: string; kind: string; id: string; fingerprint: string; contentFingerprint: string; resource: string; body: Record<string, any> }
  reminderInvoiceId?: string
  checkoutId?: string
  financeId?: string
  payoutId?: string
  refundId?: string
  refundRefresh?: boolean
  s: State; actor: Actor; commandId: string; now: string
  events: TimelineEvent[]
  /** Photo or signature bytes stored with this command's commit. */
  files: { id: string; sha256: string; mediaType: string; size: number; bytes: Uint8Array; captureId: string }[]
  privacy?: { customerId: string; ids: string[]; values: string[]; sourceIds: string[]; sourceOriginalHashes: string[]; fields: { path: (string | number)[]; value: string; optional: boolean }[]; checkpoint: { sql: string; params: unknown[] }[] }
  /** Other inert SQL committed in the same batch (role assignments). */
  sql: { sql: string; params: unknown[] }[]
  /** The owner's grant an agent is acting under (AGENT-009). */
  grant?: Row
  /** A local installation served from this computer (FIELD-004 accepts its loopback push service). */
  local?: boolean
  /** Shown once in this command's response and never stored with its outcome (API-002 tokens). */
  reveal?: Record<string, string>
  /** This installation's own origin, for links in customer email (COMM-001). */
  origin?: string
  /** COMM-001: email bodies handed to the owner's provider after this command commits; never stored. */
  mail?: { messageId: string; to: string; subject: string; text: string; html?: string }[]
}

export class Problem extends Error {
  constructor(public code: string, message: string, public details: unknown = null, public status = 409) { super(message) }
}
export const fail = (code: string, message: string, details: unknown = null, status = 409): never => { throw new Problem(code, message, details, status) }

export const newId = () => crypto.randomUUID()

export function text(value: unknown, name: string, { optional = false, max = 2000 } = {}): string {
  if ((value === undefined || value === null || value === '') && optional) return ''
  if (typeof value !== 'string' || !value.trim() || value.length > max) return fail('INPUT', `${name} is required (at most ${max} characters).`, { field: name }, 400)
  return value.trim()
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], name: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) return fail('INPUT', `${name} must be one of: ${allowed.join(', ')}.`, { field: name }, 400)
  return value as T
}

export function find(s: State, kind: Collection, id: unknown, label = kind): Row {
  const row = typeof id === 'string' ? s[kind].find(r => r.id === id) : undefined
  if (row?.erasedAt) fail('ERASED', 'This record was erased for customer privacy.')
  return row ?? fail('NOT_FOUND', `Choose an existing ${label.replace(/s$/, '')}.`, { kind, id }, 404)
}

export function expectVersion(row: Row, version: unknown) {
  if (version !== row.version) fail('STALE', 'This record changed since you opened it. Review the current version and try again.', { id: row.id, expected: version, current: row.version, record: row })
}

/** Replace a record with a new version, keeping the collection order. */
export function put(s: State, kind: Collection, row: Row): Row {
  const index = s[kind].findIndex(r => r.id === row.id)
  if (index < 0) s[kind].push(row)
  else s[kind][index] = row
  return row
}

export function bump(s: State, kind: Collection, row: Row, changes: Record<string, unknown>): Row {
  return put(s, kind, { ...row, ...changes, version: row.version + 1 })
}

export function event(c: Context, e: Omit<TimelineEvent, 'id' | 'actor'>) {
  const agent = c.actor.agentDoor
  c.events.push({ id: newId(), actor: { id: c.actor.id, name: c.actor.name, role: agent ? 'agent' : c.actor.role }, ...e, ...(agent ? { data: { ...(e.data && typeof e.data === 'object' ? e.data : {}), preparedBy: { agent: { id: agent.agentId, name: agent.agentName }, for: { id: c.actor.id, name: agent.sponsorName }, label: c.actor.name }, approvers: agent.approvers } } : {}) })
}

/** The singleton business settings record. */
export function business(s: State): Row {
  return s.business[0] ?? fail('BUSINESS', 'The owner sets up the business (name and timezone) first.')
}

/** Business-scoped sequential numbers such as J-1001 and INV-0001. */
export function nextNumber(c: Context, counter: 'job' | 'quote' | 'invoice' | 'export' | 'po', branchId?: string | null): string {
  const b = branchId ? find(c.s, 'branches', branchId) : business(c.s), counters = { job: 1000, quote: 100, invoice: 0, export: 0, po: 0, ...(b.counters ?? {}) }
  const n = counters[counter] + 1
  bump(c.s, branchId ? 'branches' : 'business', b, { counters: { ...counters, [counter]: n } })
  const prefix = { job: 'J-', quote: 'Q-', invoice: 'INV-', export: 'EXP-', po: 'PO-' }[counter]
  return (branchId ? `${b.prefix}-` : '') + prefix + String(n).padStart(counter === 'job' || counter === 'quote' ? 0 : 4, '0')
}
