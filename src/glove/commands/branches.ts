import { normalizeTaxSettings } from '../sales-tax'
import { business, text, find, expectVersion, put, bump, event, newId, fail } from '../model'
import { validZone } from '../time'
import type { Handler } from './types'

/** TEAM-002: the owner keeps branch settings; counters advance with numbered work. */
export const branches: Handler = async (c, type, p, db) => {
  if (type === 'branch.limit') {
    const person = await db.prepare('SELECT id,role,display_name AS name FROM oa_operators WHERE id=?').bind(text(p.operatorId, 'operatorId', { max: 100 })).first<any>()
    if (!person) fail('NOT_FOUND', 'Invite this person first.', null, 404)
    if (person.role === 'owner' || person.id === c.actor.id) fail('OWNER_ROLE', 'The installation owner retains all-branch access.')
    const existing = c.s.branchAccess.find(r => r.id === person.id)
    const branchId = p.branchId === 'main' ? null : p.branchId === null ? undefined : find(c.s, 'branches', p.branchId).id
    put(c.s, 'branchAccess', { id: person.id, version: (existing?.version ?? 0) + 1, branchId: branchId ?? null, limited: branchId !== undefined, createdAt: c.now })
    event(c, { jobId: null, subjectKind: 'operator', subjectId: person.id, kind: 'branch.limited', summary: `${person.name}: ${branchId === undefined ? 'all branches' : branchId === null ? 'main business branch' : find(c.s, 'branches', branchId).name}`, data: { branchId: branchId ?? null, limited: branchId !== undefined } })
    return { operatorId: person.id, branchId: branchId ?? null, limited: branchId !== undefined }
  }
  if (type !== 'branch.save') return undefined
  business(c.s)
  const existing = p.id ? find(c.s, 'branches', p.id) : null
  if (existing) expectVersion(existing, p.version)
  const prefix = text(p.prefix, 'prefix', { max: 12 }).toUpperCase()
  if (!/^[A-Z][A-Z0-9]{0,11}$/.test(prefix)) fail('INPUT', 'A branch prefix starts with a letter and contains only letters and digits.', null, 400)
  if (c.s.branches.some(b => b.id !== existing?.id && b.prefix === prefix)) fail('DUPLICATE', 'Another branch already uses that prefix.')
  if (existing && existing.prefix !== prefix && Object.keys(existing.counters ?? {}).length) fail('BRANCH', 'A branch prefix cannot change after it has issued a number.')
  const zips = Array.isArray(p.zips) && p.zips.length <= 200 ? [...new Set(p.zips.map((z: unknown) => typeof z === 'string' && /^\d{5}$/.test(z) ? z : fail('INPUT', 'Service areas use five-digit ZIP codes.', null, 400)))] : fail('INPUT', 'zips is a list of up to 200 ZIP codes.', null, 400)
  const fields = { name: text(p.name, 'name', { max: 100 }), timezone: validZone(p.timezone), prefix, zips, ...(p.taxSettings !== undefined ? { taxSettings: normalizeTaxSettings(p.taxSettings) } : {}) }
  const row = existing ? bump(c.s, 'branches', existing, { ...fields, updatedAt: c.now }) : put(c.s, 'branches', { id: newId(), version: 1, createdAt: c.now, counters: {}, ...fields })
  event(c, { jobId: null, subjectKind: 'branch', subjectId: row.id, kind: 'branch.saved', summary: `Branch ${row.name}: ${row.timezone}, number prefix ${row.prefix}`, data: fields })
  return row
}
