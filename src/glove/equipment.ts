import type { Row, State } from './model'
import { localParts } from './time'
import { quantity } from './money'

// Reads about installed equipment: each unit's warranty state and service
// history (CUST-002), the warranties expiring across the business, and the
// refrigerant log per unit and per period (FIELD-007).

/** A warranty ending within this many days is expiring. */
export const expiringDays = 90
const day = 86_400_000

function warranty(until: string, today: string) {
  if (!until) return { until: null, state: 'none', daysLeft: null }
  const daysLeft = Math.round((Date.parse(`${until}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / day)
  return { until, state: daysLeft < 0 ? 'expired' : daysLeft <= expiringDays ? 'expiring' : 'active', daysLeft }
}

export const today = (s: State, now: string) => localParts(now, s.business[0]?.timezone ?? 'UTC').date

export function warranties(e: Row, today: string) {
  return { manufacturer: warranty(e.manufacturerWarrantyUntil, today), labor: warranty(e.laborWarrantyUntil, today) }
}

const touched = (s: State, e: Row) => (job: Row) => (job.equipmentIds ?? []).includes(e.id) || s.captures.some(x => x.jobId === job.id && x.equipmentId === e.id)

/** Every job that touched the unit, oldest first, with its visits and the field items recorded against the unit. */
export function serviceHistory(s: State, e: Row, jobs: Row[]) {
  const technician = (id: string) => s.technicians.find(t => t.id === id)?.name ?? ''
  return jobs.filter(touched(s, e)).map(job => ({
    jobId: job.id, number: job.number, title: job.title, status: job.status,
    visits: s.visits.filter(v => v.jobId === job.id).map(v => ({ visitId: v.id, date: v.local.date, start: v.local.start, technician: technician(v.technicianId), status: v.status })),
    captures: s.captures.filter(x => x.jobId === job.id && x.equipmentId === e.id).map(({ id, kind, deviceTime, visitId, label, result, note, text, caption, description, quantity, unit, refrigerant, formName, answers, flagged }) => ({ id, kind, deviceTime, visitId, label, result, note, text, caption, description, quantity, unit, refrigerant, formName, answers, flagged })),
  }))
}

/** Refrigerant entries (pounds in integer thousandths) and their totals. */
function refrigerantLog(s: State, entries: Row[]) {
  const zone = s.business[0]?.timezone ?? 'UTC'
  const rows = entries.map(x => ({ captureId: x.id, equipmentId: x.equipmentId, jobId: x.jobId, visitId: x.visitId, date: localParts(x.deviceTime, zone).date, technician: s.technicians.find(t => t.id === x.technicianId)?.name ?? '', ...x.refrigerant }))
  const sum = (key: 'added' | 'recovered', list: Row[]) => quantity(list.reduce((n, r) => n + Number(r[`${key}Thousandths`]), 0))
  const byType = [...new Set(rows.map(r => r.type))].sort().map(type => { const list = rows.filter(r => r.type === type); return { type, added: sum('added', list), recovered: sum('recovered', list) } })
  return { entries: rows.map(({ addedThousandths: _a, recoveredThousandths: _r, ...rest }) => rest), byType, added: sum('added', rows), recovered: sum('recovered', rows) }
}

export function equipmentRecord(s: State, e: Row, jobs: Row[], now: string) {
  const site = s.sites.find(x => x.id === e.siteId)
  const visibleJobs = new Set(jobs.map(j => j.id))
  return {
    equipment: e, site: site ? { id: site.id, address: site.address } : null, warranty: warranties(e, today(s, now)),
    history: serviceHistory(s, e, jobs),
    refrigerant: refrigerantLog(s, s.captures.filter(x => x.kind === 'refrigerant' && x.equipmentId === e.id && visibleJobs.has(x.jobId))),
  }
}

export function warrantyReport(s: State, now: string) {
  const asOf = today(s, now)
  const site = (id: string) => s.sites.find(x => x.id === id)?.address ?? ''
  const rows = s.equipment.flatMap(e => Object.entries(warranties(e, asOf)).filter(([, w]) => w.state === 'expiring' || w.state === 'expired').map(([kind, w]) => ({ equipmentId: e.id, siteId: e.siteId, site: site(e.siteId), customerId: e.customerId, label: [e.type, e.make, e.model].filter(Boolean).join(' '), serial: e.serial, warranty: kind, ...w })))
  rows.sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
  return { asOf, expiringDays, expiring: rows.filter(r => r.state === 'expiring'), expired: rows.filter(r => r.state === 'expired') }
}

export function refrigerantReport(s: State, from: string, to: string) {
  const zone = s.business[0]?.timezone ?? 'UTC'
  const inPeriod = s.captures.filter(x => x.kind === 'refrigerant' && (d => d >= from && d <= to)(localParts(x.deviceTime, zone).date))
  const log = refrigerantLog(s, inPeriod)
  const byEquipment = [...new Set(inPeriod.map(x => x.equipmentId))].map(id => { const e = s.equipment.find(x => x.id === id)!; const one = refrigerantLog(s, inPeriod.filter(x => x.equipmentId === id)); return { equipmentId: id, label: [e.type, e.make, e.model].filter(Boolean).join(' '), serial: e.serial, added: one.added, recovered: one.recovered } })
  return { from, to, ...log, byEquipment }
}
