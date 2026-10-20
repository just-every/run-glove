import { collections, fail, type Actor, type Collection, type Context, type Row, type State } from './model'

// TEAM-002: shared business reference data remains readable; operational
// records follow their branch root, including legacy records in the main branch.
const shared = new Set<Collection>(['business', 'services', 'roles', 'grants', 'forms', 'templates', 'customFields', 'manuals'])
const links = ['jobId', 'siteId', 'customerId', 'visitId', 'technicianId', 'equipmentId', 'locationId', 'ruleId', 'survivorId', 'enquiryId', 'quoteId', 'subjectId']

export function recordBranch(s: State, row: Row, seen = new Set<string>()): string | null {
  if (Object.hasOwn(row, 'branchId')) return row.branchId ?? null
  if (seen.has(row.id)) return null
  seen.add(row.id)
  for (const key of links) if (row[key]) {
    const parent = collections.flatMap(k => s[k]).find(r => r.id === row[key])
    if (parent) return recordBranch(s, parent, seen)
  }
  const invoiceIds = row.invoices?.map((x: Row) => x.invoiceId) ?? []
  if (invoiceIds.length) {
    const roots = new Set(invoiceIds.map((id: string) => { const inv = s.invoices.find(r => r.id === id); return inv ? recordBranch(s, inv, new Set(seen)) : '__unknown' }))
    return roots.size === 1 ? [...roots][0] as string | null : '__mixed'
  }
  const id = row.memberIds?.[0] ?? row.invoiceIds?.[0] ?? row.trigger?.subjectId
  const parent = id && collections.flatMap(k => s[k]).find(r => r.id === id)
  return parent ? recordBranch(s, parent, seen) : null
}

export function branchState(s: State, actor: Actor): State {
  if (!actor.branch) return s
  const branchId = actor.branch.id
  return { ...s, ...Object.fromEntries(collections.map(k => [k, k === 'branchAccess' ? s[k].filter(r => r.id === actor.id) : shared.has(k) ? s[k] : s[k].filter(r => k === 'branches' ? r.id === branchId : recordBranch(s, r) === branchId)])) }
}

/** Run the real handler with only its branch's records, then merge its writes
 * back without deleting hidden records. Shared reference data is read-only. */
export async function inBranch<T>(c: Context, perform: () => Promise<T>): Promise<T> {
  if (!c.actor.branch) return perform()
  const full = c.s, scoped = branchState(full, c.actor)
  c.s = structuredClone(scoped)
  try {
    const result = await perform()
    for (const kind of collections) {
      const old = new Map(scoped[kind].map(r => [r.id, r]))
      for (const row of c.s[kind]) {
        const before = old.get(row.id)
        if (JSON.stringify(before) === JSON.stringify(row)) continue
        if (shared.has(kind)) {
          // Number allocation is the sole incidental business write.
          const { counters: _a, version: _v, ...a } = (before ?? {}) as Row
          const { counters: _b, version: _w, ...b } = row
          if (kind !== 'business' || JSON.stringify(a) !== JSON.stringify(b)) fail('FORBIDDEN', 'A branch-limited person changes only their branch’s records.', null, 403)
        } else if (kind === 'branches') {
          const { counters: _a, version: _v, ...a } = (before ?? {}) as Row
          const { counters: _b, version: _w, ...b } = row
          if (JSON.stringify(a) !== JSON.stringify(b)) fail('FORBIDDEN', 'Only an unscoped owner changes branch settings.', null, 403)
        } else {
          if (!before && !Object.hasOwn(row, 'branchId')) row.branchId = c.actor.branch.id
          if (recordBranch(c.s, row) !== c.actor.branch.id) fail('NOT_FOUND', 'No such record in your branch.', null, 404)
        }
      }
      if (shared.has(kind) && scoped[kind].some(r => !c.s[kind].some(x => x.id === r.id))) fail('FORBIDDEN', 'Shared business data is read-only for a branch-limited person.', null, 403)
    }
    const stamp = (value: any): void => {
      if (!value || typeof value !== 'object') return
      const record = value.id && collections.flatMap(k => c.s[k]).find(r => r.id === value.id)
      if (record && Object.hasOwn(record, 'branchId')) value.branchId = record.branchId
      for (const nested of Object.values(value)) if (nested && typeof nested === 'object') stamp(nested)
    }
    stamp(result)
    c.s = { ...full, ...Object.fromEntries(collections.map(k => [k, [...full[k].filter(r => !scoped[k].some(x => x.id === r.id)), ...c.s[k]]])) }
    return result
  } catch (error) { c.s = full; throw error }
}

export function branchEvent(s: State, actor: Actor, e: { jobId: string | null; subjectId: string; subjectKind: string }) {
  if (!actor.branch) return true
  const row = e.jobId ? s.jobs.find(r => r.id === e.jobId) : collections.filter(k => !shared.has(k)).flatMap(k => s[k]).find(r => r.id === e.subjectId)
  return !!row && (e.subjectKind === 'branch' ? row.id === actor.branch.id : recordBranch(s, row) === actor.branch.id)
}
