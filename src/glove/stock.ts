import type { Row, State } from './model'
import { quantity, thousandths } from './money'

// Van and warehouse stock (STOCK-001). Counts are integer thousandths of a
// price-book material's unit, per location; a count may go below zero when more
// is used than was counted, and shows so. An item is low when its count is at
// or below the location's par level for it. The parts a job needs are its lines'
// price-book materials, and a task line's material contents, at quantity ×
// the line's quantity. The day's parts check walks one technician's visits on a
// local date in start order: a part is on board for a job when the van holds
// enough for that job and every earlier job that day.

export const count = (loc: Row, serviceId: string) => Number(loc.counts?.[serviceId] ?? 0)

export function locationView(s: State, loc: Row) {
  const name = (id: string) => s.services.find(x => x.id === id)
  const ids = [...new Set([...Object.keys(loc.counts ?? {}), ...Object.keys(loc.pars ?? {})])]
  return {
    ...loc,
    items: ids.map(id => ({ serviceId: id, code: name(id)?.code ?? '', name: name(id)?.name ?? '', unit: name(id)?.unit ?? 'each', count: quantity0(count(loc, id)), par: loc.pars?.[id] === undefined ? null : quantity0(loc.pars[id]), low: loc.pars?.[id] !== undefined && count(loc, id) <= loc.pars[id] })),
  }
}

/** A signed thousandths count as a decimal string. */
export const quantity0 = (n: number) => `${n < 0 ? '-' : ''}${quantity(Math.abs(n))}`

export function partsNeeded(s: State, job: Row) {
  const need = new Map<string, number>()
  const add = (serviceId: string, q: number) => need.set(serviceId, (need.get(serviceId) ?? 0) + q)
  for (const line of job.lines ?? []) {
    const item = s.services.find(x => x.id === line.serviceId)
    if (!item) continue
    const q = thousandths(line.quantity, 'quantity')
    if (item.kind === 'material') add(item.id, q)
    if (item.kind === 'task') for (const part of item.components ?? []) {
      const inner = s.services.find(x => x.id === part.serviceId)
      if (inner?.kind === 'material') add(inner.id, Math.floor((thousandths(part.quantity, 'quantity') * q + 500) / 1000))
    }
  }
  return need
}

export function partsCheck(s: State, technicianId: string, date: string) {
  const van = s.stock.find(l => l.kind === 'van' && l.technicianId === technicianId && !l.archived) ?? null
  const visits = s.visits.filter(v => v.technicianId === technicianId && v.status !== 'cancelled' && v.local?.date === date).sort((a, b) => a.startAt.localeCompare(b.startAt) || a.id.localeCompare(b.id))
  const used = new Map<string, number>(), seen = new Set<string>()
  const jobs = visits.flatMap(v => {
    if (seen.has(v.jobId)) return []
    seen.add(v.jobId)
    const job = s.jobs.find(j => j.id === v.jobId)
    if (!job) return []
    const parts = [...partsNeeded(s, job)].map(([serviceId, q]) => {
      used.set(serviceId, (used.get(serviceId) ?? 0) + q)
      const item = s.services.find(x => x.id === serviceId)!, have = van ? count(van, serviceId) : 0
      return { serviceId, code: item.code, name: item.name, unit: item.unit, needed: quantity(q), onVan: quantity0(have), allocatedThrough: quantity(used.get(serviceId)!), remainingAfter: quantity0(have - used.get(serviceId)!), onBoard: have >= used.get(serviceId)! }
    })
    return [{ jobId: job.id, number: job.number, title: job.title, start: v.local.start, parts, ready: parts.every(p => p.onBoard) }]
  })
  return { date, technicianId, van: van ? { id: van.id, name: van.name } : null, jobs }
}
