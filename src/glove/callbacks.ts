import type { Row, State } from './model'
import { CALLBACK_DAYS } from './reports'
import { touched, warranties, today } from './equipment'
import { localParts } from './time'

// AGENT-006 callback detection and the evidence the agent gathers. A job is a
// callback when it names a unit that a visit on another job completed within
// the 30 days before the job was created (REPORT-002, REPORT-004's callback window, on the
// visit's received completion time). The pack is the unit's record and every
// earlier completed visit on it, oldest first, each with its form readings,
// refrigerant, notes, materials and photos; each visit and reading carries a
// short reference (V1, R1…) the prepared checklist cites.

const day = 86_400_000

/** The units of `job` serviced within the callback window, with the visits that make it a callback. */
export function callbackOf(s: State, job: Row) {
  const created = Date.parse(job.createdAt)
  const units = (job.equipmentIds ?? []).map((id: string) => s.equipment.find(e => e.id === id)).filter(Boolean) as Row[]
  const hits = units.map(unit => {
    const jobs = new Set(s.jobs.filter(j => j.id !== job.id && touched(s, unit)(j)).map(j => j.id))
    const recent = s.visits.filter(v => jobs.has(v.jobId) && v.status === 'completed' && v.completion && (at => at < created && created - at <= CALLBACK_DAYS * day)(Date.parse(v.completion.receivedAt)))
    return { equipmentId: unit.id, visitIds: recent.map(v => v.id) }
  }).filter(h => h.visitIds.length)
  return hits.length ? { days: CALLBACK_DAYS, equipment: hits } : null
}

/** Everything recorded on one unit at earlier completed visits, with citation references. */
export function callbackPack(s: State, job: Row, now: string) {
  const zone = s.business[0]?.timezone ?? 'UTC', created = Date.parse(job.createdAt)
  const technician = (id: string) => s.technicians.find(t => t.id === id)?.name ?? ''
  let v = 0, r = 0
  const hits: Row[] = job.callback?.equipment ?? []
  const units = hits.map(hit => {
    const unit = s.equipment.find(e => e.id === hit.equipmentId)!
    const jobs = new Set(s.jobs.filter(j => j.id !== job.id && touched(s, unit)(j)).map(j => j.id))
    const visits = s.visits.filter(x => jobs.has(x.jobId) && x.status === 'completed' && x.completion && Date.parse(x.completion.receivedAt) < created)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .map(visit => {
        const got = s.captures.filter(x => x.visitId === visit.id)
        const onUnit = got.filter(x => x.equipmentId === unit.id)
        const readings = onUnit.filter(x => x.kind === 'form').flatMap(x => x.answers.filter((a: Row) => a.type === 'reading' || a.type === 'number').map((a: Row) => ({ ref: `R${++r}`, form: x.formName, label: a.label, value: a.value, unit: a.unit ?? '', ...(a.type === 'reading' ? { min: a.min, max: a.max, flagged: a.flagged } : {}) })))
        return {
          ref: `V${++v}`, visitId: visit.id, jobId: visit.jobId, number: s.jobs.find(j => j.id === visit.jobId)?.number ?? '', date: visit.local.date, technician: technician(visit.technicianId),
          summary: visit.completion.summary ?? '', completedOn: localParts(visit.completion.receivedAt, zone).date,
          readings,
          refrigerant: onUnit.filter(x => x.kind === 'refrigerant').map(x => ({ type: x.refrigerant.type, added: x.refrigerant.added, recovered: x.refrigerant.recovered })),
          notes: onUnit.filter(x => x.kind === 'note').map(x => x.text),
          materials: got.filter(x => x.kind === 'material').map(x => ({ description: x.description, quantity: x.quantity, unit: x.unit })),
          photos: got.filter(x => x.kind === 'photo' && (!x.equipmentId || x.equipmentId === unit.id)).map(x => ({ fileId: x.file?.fileId, caption: x.caption ?? '' })),
        }
      })
    return {
      equipment: { id: unit.id, type: unit.type, make: unit.make, model: unit.model, serial: unit.serial, installedOn: unit.installedOn, manufacturedOn: unit.manufacturedOn ?? '', refrigerant: unit.refrigerant, location: unit.location },
      warranty: warranties(unit, today(s, now)), manual: unit.manual ?? null, photos: unit.photos ?? [], visits,
    }
  })
  return { jobId: job.id, number: job.number, days: CALLBACK_DAYS, units }
}
