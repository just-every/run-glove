import { canonicalJson, sha256, type SourceBundle, type SourceRecord, type ImportMapping, type MappingResult } from '../../modules/import-kit/src/d1/index'
import { Problem, fail, type Row } from '../model'
import { cents, signedCents, dollars, lines } from '../money'
import { instant, localParts } from '../time'
import { calendarDate } from '../receivables'
import { JOB_TARGET } from './servicem8'

export type Entity = { kind: string; id: string; value: Record<string, any>; refs?: Record<string, [string, string]>; reason?: string }
export type Normalize = (record: SourceRecord, used: Set<string>) => Entity[]
export const str = (value: unknown): string => value === undefined || value === null ? '' : String(value).trim()
export const list = (value: any): any[] => Array.isArray(value) ? value : []
/** Decimal strings pass through Glove's exact-cent validator; never round a malformed amount to zero. */
export const amount = (value: unknown): string => dollars(cents(str(value), 'source amount'))
export const address = (...values: unknown[]) => values.map(str).filter(Boolean).join(', ')

export function exportMapping(bundle: SourceBundle, system: string, version: string, normalize: Normalize, batch: { timezone: string }): ImportMapping {
  const importer = { id: 'import', name: `${system} move-in`, role: 'import' }
  const id = (kind: string, value: string) => `${bundle.records[0]?.namespace ?? system.toLowerCase()}-${kind}-` + sha256(value).slice(0, 24)
  const entities = new Map<string, { record: SourceRecord; entity: Entity }>(), errors = new Map<string, string>(), used = new Map<string, Set<string>>()
  const recordKey = (r: SourceRecord) => canonicalJson([r.kind, r.sourceId, r.payloadHash])
  const key = (kind: string, sourceId: string) => canonicalJson([kind, sourceId])
  for (const record of bundle.records) {
    const fields = new Set<string>(); used.set(recordKey(record), fields)
    try {
      for (const entity of normalize(record, fields)) {
        const k = key(entity.kind, entity.id), previous = entities.get(k)
        if (previous && canonicalJson(previous.entity) !== canonicalJson(entity)) { errors.set(recordKey(previous.record), `Source identity ${entity.kind} ${entity.id} has conflicting definitions.`); errors.set(recordKey(record), `Source identity ${entity.kind} ${entity.id} has conflicting definitions.`) }
        else if (!previous) entities.set(k, { record, entity })
      }
    } catch (error) { if (!(error instanceof Problem)) throw error; errors.set(recordKey(record), error.message) }
  }
  const converted = new Map<string, Row>(), converting = new Set<string>()
  function resolve(kind: string, sourceId: string): Row {
    const k = key(kind, sourceId), entry = entities.get(k)
    if (!entry) return fail('IMPORT_PARENT', `${kind} ${sourceId || '(missing id)'} is not in this export.`, null, 400)
    if (errors.has(recordKey(entry.record))) return fail('IMPORT_PARENT', `${kind} ${sourceId} is rejected: ${errors.get(recordKey(entry.record))}`, null, 400)
    if (converted.has(k)) return converted.get(k)!
    if (converting.has(k)) return fail('IMPORT_PARENT', `${kind} ${sourceId} has a circular parent reference.`, null, 400)
    converting.add(k)
    try {
      const e = entry.entity, value: Row = { id: id(kind, sourceId), version: 1, ...structuredClone(e.value), source: { system, kind: entry.record.kind, id: entry.record.sourceId, ...(entry.record.sourceId !== sourceId ? { childId: sourceId } : {}) } }
      for (const [field, [parentKind, parentId]] of Object.entries(e.refs ?? {})) {
        const path = field.split('.'), leaf = path.pop()!, object = path.reduce((v, part) => v[part], value)
        object[leaf] = resolve(parentKind, parentId).id
      }
      const customer = value.customerId && [...converted.values()].find(r => r.id === value.customerId)
      if (value.siteId) {
        const site = [...converted.values()].find(r => r.id === value.siteId)!
        if (customer && site.customerId !== customer.id) fail('IMPORT_PARENT', 'The site belongs to a different customer.', null, 400)
        value.customerId = site.customerId
      }
      const job = value.jobId && [...converted.values()].find(r => r.id === value.jobId)
      if (job) {
        if (value.customerId && job.customerId !== value.customerId) fail('IMPORT_PARENT', 'The job belongs to a different customer.', null, 400)
        value.customerId = job.customerId
      }
      if (kind === 'visits') {
        const time = (v: unknown) => {
          const s = str(v)
          if (/^\d{4}-\d\d-\d\d[T ]\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(s) && Number.isFinite(Date.parse(s))) return new Date(s).toISOString()
          const m = /^(\d{4}-\d\d-\d\d)[T ](\d\d:\d\d)(?::\d\d)?$/.exec(s)
          if (m) return instant(m[1], m[2], batch.timezone, 'source visit')
          return fail('IMPORT_TIME', 'A source visit needs a valid start and end timestamp.', null, 400)
        }
        value.startAt = time(value.startAt); value.endAt = time(value.endAt)
        if (value.startAt >= value.endAt) fail('IMPORT_TIME', 'The source visit must end after it starts.', null, 400)
        const start = localParts(value.startAt, batch.timezone), end = localParts(value.endAt, batch.timezone)
        if (start.date !== end.date) fail('IMPORT_TIME', 'Split an overnight visit into local-day visits before importing.', null, 400)
        value.local = { date: start.date, start: start.time, end: end.time }
        value.assignments = [{ technicianId: value.technicianId, startAt: value.startAt, endAt: value.endAt, local: value.local, by: importer, at: null, reason: `Imported from ${system}`, reviewedConflicts: [] }]
        if (value.status === 'cancelled') value.cancelled = { by: importer, at: null, reason: `Canceled in ${system}; no Glove cancellation is claimed.` }
        value.arrival = null; value.completion = value.status === 'completed' ? { imported: true, note: `Completed in ${system}; no Glove arrival or sign-off is claimed.` } : null; value.lateEvidence = []
      }
      if (kind === 'sites' && !value.address) fail('IMPORT_SITE', 'A site needs a service address.', null, 400)
      if (kind === 'agreements') {
        calendarDate(value.startDate); if (value.endDate) calendarDate(value.endDate)
        if (value.endDate && value.endDate < value.startDate) fail('IMPORT_DATE', 'A source membership ends before it starts.', null, 400)
        for (const siteId of value.siteIds ?? []) if ([...converted.values()].find(r => r.id === siteId)?.customerId !== value.customerId) fail('IMPORT_PARENT', 'A membership location belongs to another customer.', null, 400)
        for (const entitlement of value.importedEntitlements ?? []) calendarDate(entitlement.due)
      }
      if (kind === 'invoices' && value.openingBalance) {
        calendarDate(value.dates.issuedOn); calendarDate(value.dates.dueOn); calendarDate(value.openingBalance.asOf)
        value.dates.termsDays = Math.round((Date.parse(value.dates.dueOn + 'T00:00:00Z') - Date.parse(value.dates.issuedOn + 'T00:00:00Z')) / 86_400_000)
        if (cents(value.openingBalance.amount, 'balance') > cents(value.openingBalance.sourceTotal, 'invoice total')) fail('IMPORT_BALANCE', 'The opening balance exceeds the source invoice total.', null, 400)
      }
      if (kind === 'quotes' || kind === 'invoices') {
        value.revisions = [{ n: 1, lines: value.lines ?? [], totals: value.totals, preparedBy: importer, preparedAt: null, approval: null, export: null, notes: value.notes ?? '' }]
        delete value.lines; delete value.totals; delete value.notes
      }
      if (kind === 'enquiries') { value.importSource = value.source; value.source = e.value.source ?? 'other' }
      converted.set(k, value)
      return value
    } finally { converting.delete(k) }
  }
  // Validate the complete parent graph before any plan entry can emit an effect.
  // If a parent later fails validation, its dependents are rejected too.
  let previousErrors = -1
  while (previousErrors !== errors.size) {
    previousErrors = errors.size
    converted.clear()
    for (const { record, entity } of entities.values()) {
      try { resolve(entity.kind, entity.id) } catch (error) { if (!(error instanceof Problem)) throw error; errors.set(recordKey(record), error.message) }
    }
  }
  return { version, map(record) {
    if (errors.has(recordKey(record))) return { effects: [], rejection: errors.get(recordKey(record)) }
    const effects: MappingResult['effects'] = []
    for (const { record: owner, entity } of entities.values()) if (recordKey(owner) === recordKey(record)) effects.push({ targetKind: entity.kind === 'jobs' ? JOB_TARGET : entity.kind, targetId: id(entity.kind, entity.id), value: resolve(entity.kind, entity.id) })
    const unmapped = Object.keys(record.payload as object).filter(field => !used.get(recordKey(record))!.has(field)).map(field => ({ field, reason: 'Retained in the original export; not mapped to a Glove field.' }))
    if (!effects.length) unmapped.push({ field: '', reason: 'No native record for this source kind; retained for owner review.' })
    return { effects, unmapped }
  } }
}

/** Existing native shapes, with imported prices retained rather than recalculated at today's tax rate. */
export function priced(raw: any[], total?: unknown, tax?: unknown) {
  const rows = raw.length ? lines(raw) : []
  const subtotal = dollars(rows.reduce((n, r) => n + signedCents(r.total, 'source line'), 0)), gst = amount(tax ?? '0')
  return { lines: rows, totals: { subtotal, gst, total: total === undefined ? dollars(cents(subtotal, 'subtotal') + cents(gst, 'tax')) : amount(total), currency: 'USD' } }
}
export const customerFields = (name: string, email = '', phone = '', billingAddress = '') => ({ name: name || 'Unnamed imported customer', email, phone, billingAddress, kind: 'residential', contact: '', contacts: [], archived: false, abn: '' })
export const jobFields = (number: string, title: string, status: string, pricing?: ReturnType<typeof priced>) => ({ number, title: title || 'Imported job', status, ...(pricing ?? priced([])), ...(!pricing ? { sourcePriceUnavailable: true } : {}), checklist: [], forms: [], quoteId: null, quoteRevision: null })
export const quoteFields = (number: string, title: string, pricing = priced([])) => ({ number, title: title || 'Imported quote', status: 'draft', ...pricing, sent: [], acceptance: null, declined: null, jobId: null, enquiryId: null, imported: true })
