// Glove's record model: one business, its customers and sites, quotes, jobs,
// visits, field captures and invoice preparations. Records are JSON rows with a
// per-record version; every change commits atomically with its command outcome
// and its timeline events (storage.ts).

export const roles = ['owner', 'dispatcher', 'technician', 'office', 'agent', 'viewer'] as const
export type Role = (typeof roles)[number]

export const collections = [
  'business', 'customers', 'sites', 'services', 'technicians', 'enquiries', 'quotes', 'jobs', 'visits',
  'captures', 'invoices', 'exports', 'proposals', 'approvals', 'imports', 'equipment', 'expenses', 'roles',
] as const
export type Collection = (typeof collections)[number]

export type Row = { id: string; version: number; [key: string]: any }
export type State = { version: number } & Record<Collection, Row[]>

/** A custom role's actor carries role "custom:<id>" and the role's permissions at the version read. */
export type CustomRole = { id: string; version: number; name: string; permissions: string[] }
export type Actor = { id: string; name: string; role: Role | `custom:${string}`; custom?: CustomRole; sessionId: string; operatorVersion: number }

export type TimelineEvent = {
  id: string; jobId: string | null; subjectKind: string; subjectId: string
  kind: string; summary: string; data: unknown
}

export type Context = {
  s: State; actor: Actor; commandId: string; now: string
  events: TimelineEvent[]
  /** Photo or signature bytes stored with this command's commit. */
  files: { id: string; sha256: string; mediaType: string; size: number; bytes: Uint8Array; captureId: string }[]
  /** Other inert SQL committed in the same batch (role assignments). */
  sql: { sql: string; params: unknown[] }[]
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

export function event(c: Context, e: Omit<TimelineEvent, 'id'>) {
  c.events.push({ id: newId(), ...e })
}

/** The singleton business settings record. */
export function business(s: State): Row {
  return s.business[0] ?? fail('BUSINESS', 'The owner sets up the business (name and timezone) first.')
}

/** Business-scoped sequential numbers such as J-1001 and INV-0001. */
export function nextNumber(c: Context, counter: 'job' | 'quote' | 'invoice' | 'export'): string {
  const b = business(c.s), counters = { job: 1000, quote: 100, invoice: 0, export: 0, ...(b.counters ?? {}) }
  const n = counters[counter] + 1
  bump(c.s, 'business', b, { counters: { ...counters, [counter]: n } })
  const prefix = { job: 'J-', quote: 'Q-', invoice: 'INV-', export: 'EXP-' }[counter]
  return prefix + String(n).padStart(counter === 'invoice' || counter === 'export' ? 4 : 0, '0')
}
