import { canonicalJson, sha256, type SourceBundle, type SourceRecord, type ImportMapping, type MappingResult, type TargetEffect } from '../../modules/import-kit/src/d1/index'
import { Problem, fail, type Row, type State } from '../model'
import { address as sameAddress, batchDuplicates } from '../duplicates'
import { customerFields, siteFields } from '../commands/setup'
import { columns, autoMapping, parseCsv, formatCsv, unguard, type CsvField, type ColumnMapping } from '../csv-format'

// CUST-003: customers, contacts and properties from a CSV, through the same
// import kit journal as a move-in (movein/kit.ts). Rows sharing a Customer ID
// (or, without one, identical customer details) are one customer, each adding
// its site and other contact. A row is new, matched or rejected:
// - matched: its Customer ID is a Glove customer's ID, or it repeats a customer
//   an earlier CSV import created. Glove keeps that customer's details as they
//   are (the preview lists which differ); only site addresses it lacks are added.
// - rejected: a reason per row; nothing from it is written.
// - new: everything else. A new customer sharing a phone, email or address with
//   a Glove customer or another new one is flagged for merge review (CUST-005).
// Glove's own export carries every customer's ID, so it re-imports as all matched.

export const CSV_NAMESPACE = 'csv'
export const CSV_MAPPING_VERSION = 'glove-csv-v1'
const MAX_BYTES = 2_000_000, MAX_ROWS = 5000

const customerKeys = ['name', 'kind', 'abn', 'email', 'phone', 'contact', 'billingAddress', 'billingContact', 'apEmail', 'requirePo'] as const
const contactKeys = { contactName: 'name', contactRole: 'role', contactPhone: 'phone', contactEmail: 'email' } as const
const siteKeys = { siteAddress: 'address', siteZip: 'zip', siteAccessNotes: 'accessNotes', siteContact: 'contact', siteContactPhone: 'contactPhone', siteContactEmail: 'contactEmail' } as const
const hash = (v: unknown) => sha256(canonicalJson(v as any)).slice(0, 24)
const yes = (v: string) => /^(yes|y|true|1)$/i.test(v) ? true : /^(no|n|false|0|)$/i.test(v) ? false : fail('INPUT', 'Requires PO is yes or no.', { field: 'requirePo' }, 400)
const comparable = (field: string, v: unknown) => field === 'requirePo' ? v === true : field === 'kind' ? String(v || 'residential') : String(v ?? '')

/** The file's columns for each Glove field: the one chosen, else the one remembered from the last commit if it fits, else Glove's own headers. */
export function columnMapping(headers: string[], given: unknown, remembered: unknown): ColumnMapping {
  const shaped = (m: unknown): m is ColumnMapping => !!m && typeof m === 'object' && !Array.isArray(m) && Object.entries(m).every(([f, h]) => f in columns && (typeof h === 'string' || h === null))
  let chosen: ColumnMapping
  if (given !== undefined && given !== null) {
    if (!shaped(given)) return fail('INPUT', 'mapping names a CSV column for Glove fields.', { fields: columns }, 400)
    const absent = Object.values(given).filter(h => h && !headers.includes(h))
    if (absent.length) fail('IMPORT_MAPPING', `This file has no column ${absent.join(', ')}.`, { headers }, 400)
    chosen = given
  } else if (shaped(remembered) && Object.values(remembered).filter(Boolean).every(h => headers.includes(h!))) chosen = remembered
  else chosen = autoMapping(headers)
  const mapping = Object.fromEntries(Object.entries(chosen).filter(([, h]) => h)) as ColumnMapping
  if (!mapping.name) fail('IMPORT_MAPPING', "Choose the column that holds each customer's name.", { headers, fields: columns }, 400)
  return mapping
}

type Values = Partial<Record<CsvField, string>>
type Fields = Record<string, any>
type Group = { key: string; customerId: string; first: number; customer: Fields; rows: number[]; seen: Map<string, number>; contacts: Fields[]; sites: Map<string, { row: number; fields: Fields }> }

/** The reason a field refusal gives, named by its column. */
const reasonOf = (error: unknown, mapping: ColumnMapping) => {
  if (!(error instanceof Problem)) throw error
  const field = String((error.details as any)?.field ?? '').replace(/^contacts\[0\]\./, 'contact.')
  const csvField = (Object.entries(contactKeys).find(([, k]) => `contact.${k}` === field)?.[0] ?? (customerKeys as readonly string[]).find(k => k === field) ?? Object.entries(siteKeys).find(([, k]) => k === field)?.[0]) as CsvField | undefined
  return csvField && mapping[csvField] ? `${mapping[csvField]}: ${error.message}` : error.message
}

/** A row's customer, other contact and site, or the reason it is refused. */
function readRow(v: Values) {
  const any = (keys: readonly string[]) => keys.some(k => v[k as CsvField])
  const continuation = !!v.customerId && !any(customerKeys)
  const customer = continuation ? null : customerFields({ ...Object.fromEntries(customerKeys.map(k => [k, v[k] ?? ''])), kind: v.kind ? v.kind.toLowerCase() : undefined, requirePo: yes(v.requirePo ?? '') })
  const contact = any(Object.keys(contactKeys)) ? customerFields({ name: 'x', contacts: [Object.fromEntries(Object.entries(contactKeys).map(([f, k]) => [k, v[f as CsvField] ?? '']))] }).contacts![0] : null
  const site = any(Object.keys(siteKeys)) ? siteFields(Object.fromEntries(Object.entries(siteKeys).map(([f, k]) => [k, v[f as CsvField] ?? '']))) : null
  return { customer, contact, site }
}

/**
 * The batch's source bundle, the kit mapping and the review. Deterministic over
 * the file, the mapping and the Glove records it is read against, so the commit
 * plans exactly what the preview showed or refuses as stale.
 */
export function readCsv(s: State, batch: Row) {
  const file = Array.isArray(batch.files) && batch.files.length === 1 ? batch.files[0] : fail('IMPORT_FILES', 'Add one CSV file.', null, 400)
  const name = typeof file?.name === 'string' && file.name.trim() ? file.name.trim().slice(0, 200) : 'customers.csv'
  if (typeof file.text !== 'string' || !file.text.trim()) fail('IMPORT_FILES', `${name} is empty.`, null, 400)
  const bytes = new TextEncoder().encode(file.text)
  if (bytes.length > MAX_BYTES) fail('IMPORT_SIZE', 'A customer CSV is at most 2 MB. Split it into several files.', null, 400)
  let records: string[][]
  try { records = parseCsv(file.text) } catch (error) { return fail('IMPORT_PARSE', `${name}: ${(error as Error).message}`, null, 400) }
  const headers = records[0].map(h => h.trim())
  const body = records.slice(1).map((cells, i) => ({ row: i + 2, cells })).filter(r => r.cells.some(c => c.trim()))
  if (!body.length) fail('IMPORT_PARSE', `${name} has a header row but no customers.`, null, 400)
  if (body.length > MAX_ROWS) fail('IMPORT_SIZE', `A customer CSV has at most ${MAX_ROWS} rows.`, null, 400)
  const mapping: ColumnMapping = batch.mapping
  const at = Object.fromEntries(Object.entries(mapping).map(([f, h]) => [f, headers.indexOf(h!)])) as Record<CsvField, number>
  const artifactHash = sha256(bytes)
  const source = (kind: string, sourceId: string, payload: any, row: number): SourceRecord => ({ namespace: CSV_NAMESPACE, kind, sourceId, payload, payloadHash: sha256(canonicalJson(payload)), artifactHash, location: { artifact: name, row } })
  const stamp = { createdAt: batch.stagedAt, createdBy: batch.stagedBy.id }

  const rejected: { row: number; reason: string }[] = [], groups = new Map<string, Group>()
  for (const { row, cells } of body) {
    if (cells.length > headers.length) { rejected.push({ row, reason: `Row has ${cells.length} cells; the header has ${headers.length}.` }); continue }
    const v: Values = Object.fromEntries(Object.entries(at).map(([f, i]) => [f, unguard((cells[i] ?? '').trim()).trim()]))
    if (v.customerId && v.customerId.length > 100) { rejected.push({ row, reason: `${mapping.customerId}: at most 100 characters.` }); continue }
    let read
    try { read = readRow(v) } catch (error) { rejected.push({ row, reason: reasonOf(error, mapping) }); continue }
    const key = v.customerId ? `id:${v.customerId}` : `fields:${hash(read.customer)}`
    const group = groups.get(key)
    if (!group && !read.customer) { rejected.push({ row, reason: `${mapping.name}: the first row for Customer ID ${v.customerId} names the customer.` }); continue }
    const repeat = group?.seen.get(canonicalJson(v as any))
    if (repeat) { rejected.push({ row, reason: `Repeats row ${repeat} exactly.` }); continue }
    if (group && read.customer && canonicalJson(read.customer) !== canonicalJson(group.customer)) { rejected.push({ row, reason: `Customer details differ from row ${group.first}, which has the same Customer ID.` }); continue }
    const siteKey = read.site ? sameAddress(read.site.address) : ''
    const earlier = group?.sites.get(siteKey)
    if (read.site && earlier && canonicalJson(earlier.fields) !== canonicalJson(read.site)) { rejected.push({ row, reason: `Site ${read.site.address} differs from row ${earlier.row}.` }); continue }
    const g = group ?? groups.set(key, { key, customerId: v.customerId ?? '', first: row, customer: read.customer!, rows: [], seen: new Map(), contacts: [], sites: new Map() }).get(key)!
    g.rows.push(row)
    g.seen.set(canonicalJson(v as any), row)
    if (read.contact && !g.contacts.some(x => canonicalJson(x) === canonicalJson(read.contact))) g.contacts.push(read.contact)
    if (read.site && !earlier) g.sites.set(siteKey, { row, fields: read.site })
  }

  const fresh: { group: Group; value: Row; sites: Row[] }[] = [], matched: { rows: number[]; customerId: string; name: string; newSites: number; differs: string[] }[] = []
  const results = new Map<string, MappingResult>(), bundle: SourceBundle = { records: [], diagnostics: [], artifacts: [{ name, sha256: artifactHash, size: bytes.length, original: { status: 'available', base64: btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')) } }] }
  for (const g of groups.values()) {
    const native = g.customerId ? s.customers.find(c => c.id === g.customerId) : undefined
    const id = native?.id ?? `csv-${hash(g.key)}`, existing = native ?? s.customers.find(c => c.id === id)
    if (existing?.mergedInto) { for (const row of g.rows) rejected.push({ row, reason: `${existing.name} was merged into another customer; use that customer's ID.` }); continue }
    const sitesHeld = new Set(s.sites.filter(x => x.customerId === id).map(x => sameAddress(x.address)))
    const sites = [...g.sites.values()].filter(x => !sitesHeld.has(sameAddress(x.fields.address))).map((x): Row => ({ ...x.fields, id: `csv-site-${hash([id, sameAddress(x.fields.address)])}`, version: 1, ...stamp, customerId: id, source: { system: 'CSV', file: name, row: x.row } }))
    const effects: TargetEffect[] = sites.map(x => ({ targetKind: 'sites', targetId: x.id, value: x }))
    if (existing) {
      const ownSites = s.sites.filter(x => x.customerId === id)
      const differs = [
        ...customerKeys.filter(k => k in mapping && comparable(k, existing[k]) !== comparable(k, g.customer[k])),
        ...(g.contacts.some(x => !(existing.contacts ?? []).some((y: Row) => ['name', 'phone', 'email'].every(k => String(y[k] ?? '') === x[k]))) ? ['contacts'] : []),
        ...[...g.sites.values()].filter(x => { const held = ownSites.find(y => sameAddress(y.address) === sameAddress(x.fields.address)); return held && Object.entries(siteKeys).some(([f, k]) => f in mapping && String(held[k] ?? '') !== x.fields[k]) }).map(x => `site ${x.fields.address}`),
      ]
      matched.push({ rows: g.rows, customerId: id, name: existing.name, newSites: sites.length, differs })
    } else {
      const value: Row = { ...g.customer, id, version: 1, ...stamp, ...(g.contacts.length ? { contacts: g.contacts } : {}), source: { system: 'CSV', file: name, row: g.first, ...(g.customerId ? { id: g.customerId } : {}) } }
      effects.unshift({ targetKind: 'customers', targetId: id, value })
      fresh.push({ group: g, value, sites })
    }
    const payload = { rows: g.rows, customer: g.customer, contacts: g.contacts, sites: [...g.sites.values()].map(x => x.fields), effects: effects.map(e => e.targetId) }
    const record = source('customer', `c-${hash({ payload, effects })}`, payload, g.first)
    bundle.records.push(record)
    results.set(record.sourceId, { effects })
  }
  for (const r of rejected) {
    const record = source('row', `r-${r.row}-${hash(body.find(b => b.row === r.row)!.cells)}`, { row: r.row, cells: body.find(b => b.row === r.row)!.cells }, r.row)
    bundle.records.push(record)
    results.set(record.sourceId, { effects: [], rejection: r.reason })
  }

  const flagged = batchDuplicates(s, fresh.map(x => ({ customer: x.value, addresses: x.sites.map(y => y.address) })))
  const review = {
    file: name, headers, mapping, unusedColumns: headers.filter(h => !Object.values(mapping).includes(h)),
    rows: { total: body.length, new: fresh.reduce((n, x) => n + x.group.rows.length, 0), matched: matched.reduce((n, x) => n + x.rows.length, 0), rejected: rejected.length },
    new: fresh.map(x => ({ rows: x.group.rows, customerId: x.value.id, name: x.value.name, sites: x.sites.length, contacts: x.group.contacts.length })),
    matched, rejected: rejected.sort((a, b) => a.row - b.row),
    possibleDuplicates: fresh.map((x, i) => ({ rows: x.group.rows, name: x.value.name, duplicates: flagged[i] })).filter(x => x.duplicates.length),
  }
  const map: ImportMapping = { version: CSV_MAPPING_VERSION, map: record => results.get(record.sourceId)! }
  return { bundle, mapping: map, review }
}

/** Every live customer as CSV: one row per site or other contact (at least one), customer details on each. */
export function customersCsv(s: State) {
  const out = [Object.values(columns) as string[]]
  for (const c of s.customers) {
    if (c.mergedInto) continue
    const sites = s.sites.filter(x => x.customerId === c.id), contacts: Row[] = c.contacts ?? []
    for (let i = 0; i < Math.max(1, sites.length, contacts.length); i++) {
      const site = sites[i], contact = contacts[i]
      const v: Record<CsvField, unknown> = {
        customerId: c.id, name: c.name, kind: c.kind || 'residential', abn: c.abn, email: c.email, phone: c.phone, contact: c.contact, billingAddress: c.billingAddress, billingContact: c.billingContact, apEmail: c.apEmail, requirePo: c.requirePo ? 'yes' : 'no',
        contactName: contact?.name, contactRole: contact?.role ?? contact?.type, contactPhone: contact?.phone, contactEmail: contact?.email,
        siteAddress: site?.address, siteZip: site?.zip, siteAccessNotes: site?.accessNotes, siteContact: site?.contact, siteContactPhone: site?.contactPhone, siteContactEmail: site?.contactEmail,
      }
      out.push((Object.keys(columns) as CsvField[]).map(f => String(v[f] ?? '')))
    }
  }
  return formatCsv(out)
}
