import { fail, text, find, expectVersion, put, bump, event, newId, type Context, type Row } from '../model'
import { image, assigned } from './field'
import type { Handler } from './types'

// Installed equipment at a site (CUST-002): type, make, model, serial, install
// date, refrigerant, where it is in the building, photos and the manufacturer
// and labor warranty end dates. The desk records it, and the technician adds
// or updates it from the phone on a visit at that site.

/** A calendar date (YYYY-MM-DD) that exists, or '' when optional and absent. */
export function calendarDate(value: unknown, name: string): string {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) return fail('INPUT', `${name} is a date (YYYY-MM-DD).`, { field: name }, 400)
  return value
}

/** The site a person may record equipment at: any for the desk, the visit's site for its technician. */
function siteFor(c: Context, p: any): Row {
  if (c.actor.role !== 'technician') return find(c.s, 'sites', p.siteId)
  const { visit } = assigned(c, p.visitId)
  return find(c.s, 'sites', find(c.s, 'jobs', visit.jobId).siteId)
}

export const equipment: Handler = async (c, type, p) => {
  if (type !== 'equipment.save') return undefined
  const site = siteFor(c, p)
  const existing = p.id === undefined ? null : find(c.s, 'equipment', p.id)
  if (existing) {
    expectVersion(existing, p.version)
    if (existing.siteId !== site.id) fail('SITE', 'This equipment is at another site.')
  }
  const id = existing?.id ?? newId()
  const photo = p.photo ? await image(c, p.photo, id, 'photo') : null
  const fields = {
    siteId: site.id, customerId: site.customerId,
    type: text(p.type, 'type', { max: 100 }), make: text(p.make, 'make', { optional: true, max: 100 }), model: text(p.model, 'model', { optional: true, max: 100 }), serial: text(p.serial, 'serial', { optional: true, max: 100 }),
    installedOn: calendarDate(p.installedOn, 'installedOn'), refrigerant: text(p.refrigerant, 'refrigerant', { optional: true, max: 40 }), location: text(p.location, 'location', { optional: true, max: 200 }),
    manufacturerWarrantyUntil: calendarDate(p.manufacturerWarrantyUntil, 'manufacturerWarrantyUntil'), laborWarrantyUntil: calendarDate(p.laborWarrantyUntil, 'laborWarrantyUntil'),
    photos: [...(existing?.photos ?? []), ...(photo ? [photo] : [])],
  }
  const by = { id: c.actor.id, name: c.actor.name, role: c.actor.role }
  const row = existing ? bump(c.s, 'equipment', existing, { ...fields, updatedAt: c.now, updatedBy: by }) : put(c.s, 'equipment', { id, version: 1, createdAt: c.now, createdBy: by, ...fields })
  const label = [row.type, row.make, row.model].filter(Boolean).join(' ')
  event(c, { jobId: null, subjectKind: 'equipment', subjectId: row.id, kind: existing ? 'equipment.updated' : 'equipment.added', summary: `${label} ${existing ? 'updated' : 'added'} at ${site.address} by ${c.actor.name}${c.actor.role === 'technician' ? ' on the phone' : ''}`, data: null })
  return row
}

/** The equipment a visit's capture or a new job names, which must be at the job's site. */
export function equipmentAt(c: Context, job: Row, id: unknown): Row {
  const row = find(c.s, 'equipment', id)
  if (row.siteId !== job.siteId) fail('EQUIPMENT', 'That equipment is at another site.')
  return row
}
