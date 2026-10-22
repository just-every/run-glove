import { fail, text, find, expectVersion, put, bump, event, newId, business, type Context, type Row } from '../model'
import { askModel, modelBase } from '../provider'
import { image, assigned } from './field'
import { equipmentAt } from './equipment'
import type { Handler } from './types'

// FIELD-006: the technician photographs an equipment nameplate on a visit;
// the owner's model provider reads make, model, serial and manufacture date
// from the photo alone (no customer, site or job details go with it). The
// reading is a proposal on the visit: the equipment record changes only when
// the same technician confirms the fields, correcting any first, and the
// reading keeps what the model proposed and which fields the technician
// corrected. A manufacture date is kept as printed to the precision given
// (YYYY, YYYY-MM or YYYY-MM-DD); anything else is left unread. The
// manufacturer's manual is attached on confirmation when the owner's manual
// library holds one for that make and model (compared ignoring case and
// surrounding spaces); Glove never invents or fetches a manual.

const fields = ['make', 'model', 'serial', 'manufactured'] as const
const schema = { type: 'object', additionalProperties: false, required: [...fields], properties: { make: { type: 'string' }, model: { type: 'string' }, serial: { type: 'string' }, manufactured: { type: 'string', description: 'Manufacture date as printed: YYYY, YYYY-MM or YYYY-MM-DD; empty when not shown' } } }
const instructions = 'You read the nameplate in this photo of HVAC, plumbing or electrical equipment. Answer only what is printed on it: the manufacturer (make), model number, serial number and manufacture date. Leave a field empty when it is not legible or not printed. Never guess.'

/** A manufacture date at the precision printed, or '' when it is not one. */
export function manufactured(v: unknown): string {
  if (typeof v !== 'string') return ''
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(v.trim())
  if (!m) return ''
  if (m[2] && (Number(m[2]) < 1 || Number(m[2]) > 12)) return ''
  if (m[3] && new Date(`${m[0]}T00:00:00Z`).toISOString().slice(0, 10) !== m[0]) return ''
  return m[0]
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
const label = (e: Row) => [e.type, e.make, e.model].filter(Boolean).join(' ')

/** A reading the signed-in technician took, on a visit still assigned to them. */
function own(c: Context, p: any) {
  const reading = find(c.s, 'nameplates', p.readingId)
  if (reading.by.id !== c.actor.id) fail('FORBIDDEN', 'Only the technician who photographed the nameplate confirms it.', null, 403)
  expectVersion(reading, p.version)
  if (reading.status !== 'proposed') fail('READING_STATE', `This reading is already ${reading.status}.`)
  assigned(c, reading.visitId)
  return reading
}

export const nameplates: Handler = async (c, type, p, db) => {
  switch (type) {
    case 'model.connect': {
      const b = business(c.s)
      if (p.key === null) {
        c.sql.push({ sql: "DELETE FROM glove_provider_keys WHERE provider='model'", params: [] })
        event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'model.disconnected', summary: `${c.actor.name} disconnected the model provider`, data: null })
        return bump(c.s, 'business', b, { model: null })
      }
      const settings = { url: modelBase(p.url), model: text(p.model, 'model', { max: 100 }) }
      c.sql.push({ sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('model',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [text(p.key, 'key', { max: 400 }), c.actor.id, c.now] })
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'model.connected', summary: `${c.actor.name} connected the model provider at ${new URL(settings.url).host} (${settings.model})`, data: null })
      return bump(c.s, 'business', b, { model: { ...settings, connectionId: newId(), connectedAt: c.now, by: c.actor.name } })
    }
    case 'manual.save': {
      const existing = p.id === undefined ? null : find(c.s, 'manuals', p.id)
      if (existing) expectVersion(existing, p.version)
      const make = text(p.make, 'make', { max: 100 }), model = text(p.model, 'model', { max: 100 }), title = text(p.title, 'title', { max: 200 })
      let url = ''
      try { const u = new URL(String(p.url)); url = u.protocol === 'https:' && !u.username && !u.password ? u.href : '' } catch { /* refused below */ }
      if (!url) fail('INPUT', 'url is the manual\'s https address.', { field: 'url' }, 400)
      if (c.s.manuals.some(m => m.id !== existing?.id && same(m.make, make) && same(m.model, model))) fail('DUPLICATE', `The library already has a manual for ${make} ${model}.`)
      const row = existing ? bump(c.s, 'manuals', existing, { make, model, title, url, updatedAt: c.now }) : put(c.s, 'manuals', { id: newId(), version: 1, createdAt: c.now, make, model, title, url })
      event(c, { jobId: null, subjectKind: 'manual', subjectId: row.id, kind: 'manual.saved', summary: `${c.actor.name} saved the manual "${title}" for ${make} ${model}`, data: null })
      return row
    }
    case 'nameplate.read': {
      const { visit, current } = assigned(c, p.visitId)
      if (!current) fail('VISIT_STATE', 'Read nameplates on a visit you are working.')
      const job = find(c.s, 'jobs', visit.jobId)
      const unit = p.equipmentId === undefined ? null : equipmentAt(c, job, p.equipmentId)
      const id = newId(), photo = await image(c, p.photo, id, 'photo')
      const { answer, model } = await askModel(c, db, business(c.s), 'nameplate', [
        { role: 'system', content: instructions },
        { role: 'user', content: [{ type: 'text', text: 'Read this equipment nameplate.' }, { type: 'image_url', image_url: { url: `data:${photo.mediaType};base64,${p.photo.base64}` } }] },
      ], schema)
      const proposed = { make: '', model: '', serial: '', manufactured: '' }
      for (const f of fields) {
        const v = answer[f]
        if (v !== undefined && typeof v !== 'string') fail('MODEL', 'The model answered outside the requested form.', null, 502)
        proposed[f] = f === 'manufactured' ? manufactured(v) : String(v ?? '').trim().slice(0, 100)
      }
      const reading = put(c.s, 'nameplates', { id, version: 1, createdAt: c.now, visitId: visit.id, jobId: job.id, siteId: job.siteId, equipmentId: unit?.id ?? null, photo, proposed, unread: fields.filter(f => !proposed[f]), model, status: 'proposed', by: { id: c.actor.id, name: c.actor.name } })
      event(c, { jobId: job.id, subjectKind: 'nameplate', subjectId: id, kind: 'nameplate.read', summary: `${c.actor.name} photographed a nameplate${unit ? ` on ${label(unit)}` : ''}; the model proposed ${[proposed.make, proposed.model, proposed.serial && `serial ${proposed.serial}`].filter(Boolean).join(' ') || 'nothing legible'}, not saved until the technician confirms`, data: null })
      return reading
    }
    case 'nameplate.confirm': {
      const reading = own(c, p), job = find(c.s, 'jobs', reading.jobId)
      const confirmed = { make: text(p.make, 'make', { optional: true, max: 100 }), model: text(p.model, 'model', { optional: true, max: 100 }), serial: text(p.serial, 'serial', { optional: true, max: 100 }), manufactured: p.manufactured ? manufactured(p.manufactured) || fail('INPUT', 'manufactured is YYYY, YYYY-MM or YYYY-MM-DD.', { field: 'manufactured' }, 400) : '' }
      const corrected = fields.filter(f => confirmed[f] !== reading.proposed[f])
      const book = confirmed.make && confirmed.model ? c.s.manuals.find(m => same(m.make, confirmed.make) && same(m.model, confirmed.model)) : undefined
      const manual = book ? { manualId: book.id, title: book.title, url: book.url } : null
      const by = { id: c.actor.id, name: c.actor.name, role: c.actor.role }
      const changes = { make: confirmed.make, model: confirmed.model, serial: confirmed.serial, manufacturedOn: confirmed.manufactured, nameplate: { readingId: reading.id, confirmedAt: c.now }, ...(manual ? { manual } : {}) }
      const existing = reading.equipmentId ? equipmentAt(c, job, reading.equipmentId) : null
      const unit = existing
        ? bump(c.s, 'equipment', existing, { ...changes, photos: [...(existing.photos ?? []), reading.photo], updatedAt: c.now, updatedBy: by })
        : put(c.s, 'equipment', { id: newId(), version: 1, createdAt: c.now, createdBy: by, siteId: job.siteId, customerId: job.customerId, type: text(p.type, 'type', { max: 100 }), installedOn: '', refrigerant: '', location: text(p.location, 'location', { optional: true, max: 200 }), manufacturerWarrantyUntil: '', laborWarrantyUntil: '', manual: null, ...changes, photos: [reading.photo] })
      bump(c.s, 'nameplates', reading, { status: 'confirmed', confirmed, corrected, equipmentId: unit.id, confirmedAt: c.now })
      event(c, { jobId: job.id, subjectKind: 'equipment', subjectId: unit.id, kind: existing ? 'equipment.updated' : 'equipment.added', summary: `${label(unit)} ${existing ? 'updated' : 'added'} from its nameplate by ${c.actor.name}${corrected.length ? `, correcting ${corrected.join(', ')}` : ''}${manual ? `; manual "${manual.title}" attached` : ''}`, data: { readingId: reading.id } })
      return unit
    }
    case 'nameplate.discard': {
      const reading = own(c, p)
      event(c, { jobId: reading.jobId, subjectKind: 'nameplate', subjectId: reading.id, kind: 'nameplate.discarded', summary: `${c.actor.name} discarded a nameplate reading; nothing was saved`, data: null })
      return bump(c.s, 'nameplates', reading, { status: 'discarded', discardedAt: c.now })
    }
  }
}
