import { recordBranch } from '../branch-access'
import { fail, find, expectVersion, bump, put, event, newId, type Row } from '../model'
import { holders } from '../duplicates'
import type { Handler } from './types'

// CUST-005: merging duplicate customers is one journaled change. The survivor
// takes the chosen values and every property, request, quote, job and
// invoice of the merged customers, who are kept as merged (not deleted); the
// merge record keeps exactly what moved so the merge can be undone while
// nothing it touched has changed since.

const fields = ['name', 'kind', 'abn', 'email', 'phone', 'contact', 'billingAddress', 'billingContact', 'apEmail', 'requirePo'] as const

export const merge: Handler = async (c, type, p) => {
  switch (type) {
    case 'customer.merge': {
      const survivor = find(c.s, 'customers', p.survivorId)
      expectVersion(survivor, p.versions?.[survivor.id])
      const ids = Array.isArray(p.mergedIds) ? [...new Set(p.mergedIds as unknown[])] : []
      if (!ids.length || ids.length > 50 || ids.includes(survivor.id)) fail('INPUT', 'mergedIds lists 1 to 50 other customers.', null, 400)
      const merged = ids.map(id => find(c.s, 'customers', id))
      if (merged.some(m => recordBranch(c.s, m) !== recordBranch(c.s, survivor))) fail('BRANCH', 'Customers from different branches cannot be merged.')
      for (const m of [survivor, ...merged]) if (m.mergedInto) fail('MERGED', `${m.name} was already merged.`)
      for (const m of merged) expectVersion(m, p.versions?.[m.id])
      // Values default to the survivor's; `values` names which customer each field comes from.
      const chosen: Record<string, unknown> = {}
      for (const [field, from] of Object.entries(p.values ?? {})) {
        if (!(fields as readonly string[]).includes(field)) fail('INPUT', `values.${field} is not a customer field.`, null, 400)
        const source = [survivor, ...merged].find(m => m.id === from) ?? fail('INPUT', `values.${field} names a customer in this merge.`, null, 400)
        chosen[field] = source[field]
      }
      const contacts = [...(survivor.contacts ?? []), ...merged.flatMap(m => [...(m.contact ? [{ name: m.contact, phone: m.phone ?? '', email: m.email ?? '', role: `from ${m.name}` }] : []), ...(m.contacts ?? [])])]
      const id = newId(), moved: { kind: string; id: string; from: string }[] = []
      for (const kind of holders) for (const r of c.s[kind]) if (ids.includes(r.customerId)) { moved.push({ kind, id: r.id, from: r.customerId }); bump(c.s, kind, r, { customerId: survivor.id }) }
      const before = Object.fromEntries([...fields, 'contacts'].map(f => [f, survivor[f] ?? null]))
      const after = bump(c.s, 'customers', survivor, { ...chosen, contacts })
      const gone = merged.map(m => bump(c.s, 'customers', m, { mergedInto: survivor.id, mergeId: id }))
      const row = put(c.s, 'merges', { id, version: 1, createdAt: c.now, by: { id: c.actor.id, name: c.actor.name }, survivorId: survivor.id, mergedIds: ids, before, moved, versions: Object.fromEntries([after, ...gone, ...moved.map(m => c.s[m.kind as typeof holders[number]].find(r => r.id === m.id)!)].map(r => [r.id, r.version])), status: 'merged' })
      event(c, { jobId: null, subjectKind: 'customer', subjectId: survivor.id, kind: 'customer.merged', summary: `${c.actor.name} merged ${merged.map(m => m.name).join(', ')} into ${after.name}: ${moved.length} record${moved.length === 1 ? '' : 's'} moved`, data: { mergeId: id } })
      return row
    }
    case 'customer.unmerge': {
      const record = find(c.s, 'merges', p.mergeId)
      expectVersion(record, p.version)
      if (record.status !== 'merged') fail('MERGE_STATE', 'This merge was already undone.')
      const touched = Object.entries(record.versions as Record<string, number>).map(([rid, version]) => {
        const kind = rid === record.survivorId || record.mergedIds.includes(rid) ? 'customers' : record.moved.find((m: Row) => m.id === rid).kind
        const row = find(c.s, kind, rid)
        if (row.version !== version) fail('CHANGED_SINCE', `${kind === 'customers' ? row.name : `A ${kind.replace(/s$/, '')}`} changed after the merge; review it before undoing.`, { kind, id: rid })
        return [rid, { kind, row }] as const
      })
      const at = new Map(touched)
      for (const m of record.moved) bump(c.s, m.kind, at.get(m.id)!.row, { customerId: m.from })
      for (const mid of record.mergedIds) { const { mergedInto: _m, mergeId: _i, ...rest } = at.get(mid)!.row; put(c.s, 'customers', { ...rest, version: rest.version + 1 }) }
      const survivor = bump(c.s, 'customers', at.get(record.survivorId)!.row, record.before)
      const row = bump(c.s, 'merges', record, { status: 'undone', undoneAt: c.now, undoneBy: { id: c.actor.id, name: c.actor.name } })
      event(c, { jobId: null, subjectKind: 'customer', subjectId: survivor.id, kind: 'customer.unmerged', summary: `${c.actor.name} undid the merge into ${survivor.name}: ${record.moved.length} record${record.moved.length === 1 ? '' : 's'} moved back`, data: { mergeId: record.id } })
      return row
    }
  }
}
