import { fail, text, oneOf, find, expectVersion, put, bump, event, newId, type Context, type Row } from '../model'
import { thousandths } from '../money'
import { count, quantity0 } from '../stock'
import type { Handler } from './types'

// Van and warehouse stock (STOCK-001): the desk keeps locations with par
// levels, counts stock, receives restocks and transfers between locations;
// materials a technician records on a visit come off their van (field.ts).
// Every movement is a stockMoves record and a timeline entry.

const material = (c: Context, id: unknown) => {
  const item = find(c.s, 'services', id)
  return item.kind === 'material' ? item : fail('INPUT', `${item.name} is not a material; only materials are stocked.`, { field: 'serviceId' }, 400)
}
const location = (c: Context, id: unknown, name = 'locationId') => { const l = find(c.s, 'stock', id); return l.archived ? fail('INPUT', `${l.name} is archived.`, { field: name }, 400) : l }

/** Move stock and record it: a positive delta adds to the location. */
export function move(c: Context, loc: Row, item: Row, delta: number, kind: string, detail: Record<string, unknown>, summary: string) {
  const fresh = c.s.stock.find(l => l.id === loc.id)!
  const row = bump(c.s, 'stock', fresh, { counts: { ...fresh.counts, [item.id]: count(fresh, item.id) + delta } })
  put(c.s, 'stockMoves', { id: newId(), version: 1, createdAt: c.now, by: { id: c.actor.id, name: c.actor.name }, kind, locationId: loc.id, serviceId: item.id, delta: quantity0(delta), after: quantity0(count(row, item.id)), ...detail })
  event(c, { jobId: (detail.jobId as string) ?? null, subjectKind: 'stock', subjectId: loc.id, kind: `stock.${kind}`, summary: `${summary}; ${loc.name} now holds ${quantity0(count(row, item.id))} ${item.unit}`, data: null })
  return row
}

export const stock: Handler = async (c, type, p) => {
  switch (type) {
    case 'stock.location': {
      const kind = oneOf(p.kind, ['van', 'warehouse'] as const, 'kind')
      const technicianId = kind === 'van' ? find(c.s, 'technicians', p.technicianId).id : null
      if (technicianId && c.s.stock.some(l => l.id !== p.id && !l.archived && l.technicianId === technicianId)) fail('DUPLICATE', 'This technician already has a van.')
      const pars = Object.fromEntries((Array.isArray(p.pars) ? p.pars : []).map((x: any, i: number) => [material(c, x?.serviceId).id, thousandths(x?.par, `pars[${i}].par`, { zero: true })]))
      const fields = { kind, name: text(p.name, 'name', { max: 100 }), technicianId, pars, archived: p.archived === true }
      let row: Row
      if (p.id === undefined) row = put(c.s, 'stock', { id: newId(), version: 1, createdAt: c.now, counts: {}, ...fields })
      else { const old = find(c.s, 'stock', p.id); expectVersion(old, p.version); row = bump(c.s, 'stock', old, fields) }
      event(c, { jobId: null, subjectKind: 'stock', subjectId: row.id, kind: 'stock.location', summary: `${c.actor.name} saved stock location ${row.name}`, data: { technicianId: row.technicianId, archived: row.archived } })
      return row
    }
    case 'stock.count': {
      const loc = location(c, p.locationId), item = material(c, p.serviceId), next = thousandths(p.quantity, 'quantity', { zero: true })
      return move(c, loc, item, next - count(loc, item.id), 'count', { reason: text(p.reason, 'reason', { optional: true, max: 300 }) }, `${c.actor.name} counted ${item.name} in ${loc.name}`)
    }
    case 'stock.restock': {
      const loc = location(c, p.locationId), item = material(c, p.serviceId), q = thousandths(p.quantity, 'quantity')
      return move(c, loc, item, q, 'restock', { note: text(p.note, 'note', { optional: true, max: 300 }) }, `${c.actor.name} restocked ${quantity0(q)} ${item.unit} ${item.name} into ${loc.name}`)
    }
    case 'stock.transfer': {
      const from = location(c, p.fromId, 'fromId'), to = location(c, p.toId, 'toId'), item = material(c, p.serviceId), q = thousandths(p.quantity, 'quantity')
      if (from.id === to.id) fail('INPUT', 'Transfer between two different locations.', { field: 'toId' }, 400)
      if (count(from, item.id) < q) fail('STOCK', `${from.name} holds ${quantity0(count(from, item.id))} ${item.unit} of ${item.name}.`, { available: quantity0(count(from, item.id)) })
      const transferId = newId()
      move(c, from, item, -q, 'transfer', { transferId, toId: to.id }, `${c.actor.name} moved ${quantity0(q)} ${item.unit} ${item.name} from ${from.name} to ${to.name}`)
      return move(c, to, item, q, 'transfer', { transferId, fromId: from.id }, `${c.actor.name} moved ${quantity0(q)} ${item.unit} ${item.name} into ${to.name} from ${from.name}`)
    }
  }
}
