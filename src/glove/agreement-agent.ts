import { allow } from './access'
import { agreementVisits } from './agreement-due'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { business, bump, event, fail, find, newId, put, type Row, type State } from './model'
import type { Handler } from './commands/types'

/** Recorded, attributable evidence only. Late captures count after desk review. */
function accepted(s: State, visit: Row, jobId: string, capture: Row) {
  return capture.jobId === jobId && capture.visitId === visit.id && !!capture.receivedAt &&
    visit.assignments.some((a: Row) => a.technicianId === capture.technicianId) &&
    (!capture.late || visit.lateEvidence.some((e: Row) => e.captureId === capture.id && e.reviewed))
}

export function maintenanceChecks(s: State, agreement: Row) {
  return agreementVisits(s, agreement).filter(v => v.completed).map(v => {
    const job = s.jobs.find(j => j.id === v.jobId), visit = s.visits.find(x => x.id === v.visitId)
    const completion = job && visit?.completion && s.captures.find(x => x.kind === 'completion' && accepted(s, visit, job.id, x) && x.technicianId === visit.completion.technicianId)
    const base = { entitlementId: v.id, index: v.index, due: v.due, jobId: job?.id ?? null, visitId: visit?.id ?? null }
    if (!job || !visit || !completion || !Array.isArray(job.forms)) return { ...base, status: 'unavailable', completionCaptureId: null, forms: [] }
    const forms = job.forms.map((f: Row) => {
      const captures = s.captures.filter(x => {
        const sourceVisit = s.visits.find(v => v.id === x.visitId && v.jobId === job.id)
        return x.kind === 'form' && x.formId === f.id && !!sourceVisit && accepted(s, sourceVisit, job.id, x)
      }).sort((a, b) => a.id.localeCompare(b.id))
      return { copyId: f.id, formId: f.formId, formVersion: f.formVersion, name: f.name, equipmentId: f.equipmentId ?? null, captureIds: captures.map(x => x.id) }
    })
    return { ...base, status: forms.some(f => !f.captureIds.length) ? 'missing' : forms.length ? 'recorded' : 'not-required', completionCaptureId: completion.id, forms }
  })
}

const fingerprint = (checks: unknown) => sha256(canonicalJson(checks))

/** Current evidence is compared with the retained preparation; old flags are never presented as current. */
export function maintenanceVisits(s: State) {
  return s.agreements.filter(a => !a.erasedAt).flatMap(a => {
    const checks = maintenanceChecks(s, a), prepared = s.agreementChecks.find(r => r.agreementId === a.id)
    return checks.map(check => ({ ...check, agreementId: a.id, customerId: a.customerId, customer: s.customers.find(c => c.id === a.customerId)?.name ?? '', plan: a.plan.name,
      preparation: prepared ? { id: prepared.id, at: prepared.preparedAt, by: prepared.preparedBy, current: prepared.fingerprint === fingerprint(checks) } : null }))
  })
}

export const agreementAgent: Handler = async (c, type, p) => {
  if (type !== 'agreement.prepare') return undefined
  allow(c.actor, type)
  if (c.actor.role === 'agent' && business(c.s).agentsPaused) fail('PAUSED', 'The owner has paused every agent.', null, 403)
  const agreement = find(c.s, 'agreements', p.agreementId)
  const checks = maintenanceChecks(c.s, agreement), digest = fingerprint(checks)
  const prior = c.s.agreementChecks.find(r => r.agreementId === agreement.id)
  const fields = { agreementId: agreement.id, customerId: agreement.customerId, siteId: agreement.siteId, checks, fingerprint: digest,
    preparedAt: c.now, preparedBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, effect: 'Internal inspection only; no sending, booking, price or term changes.' }
  const row = prior?.fingerprint === digest ? prior : prior ? bump(c.s, 'agreementChecks', prior, fields) : put(c.s, 'agreementChecks', { id: newId(), version: 1, createdAt: c.now, ...fields })
  event(c, { jobId: null, subjectKind: 'agreementCheck', subjectId: row.id, kind: 'agreement.maintenancePrepared',
    summary: `${c.actor.name} checked completed agreement visits: ${checks.filter(x => x.status === 'missing').length} visits missing maintenance forms, ${checks.filter(x => x.status === 'unavailable').length} evidence unavailable; internal inspection only`,
    data: { agreementId: agreement.id, checkId: row.id, checks, effect: fields.effect, reused: prior?.fingerprint === digest } })
  return row
}
