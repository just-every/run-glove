import { business, event, fail, find, Problem, type Context, type Row } from './model'
import { queueSms } from './sms-delivery'
import { approvedStatusNotice } from './visit-status-notices'
import { guardStatusOwner } from './visit-status-policy'

/** Called only after this command records the current technician's arrival. */
export async function queueArrivalNotice(c: Context, visit: Row, db: D1Database): Promise<void> {
  if (!business(c.s).visitNotices?.arrival) return
  const tech = c.s.technicians.find(t => t.id === visit.technicianId)
  if (c.actor.role !== 'technician' || !tech?.active || tech.operatorId !== c.actor.id || visit.status !== 'arrived' || visit.arrival?.technicianId !== tech.id) return
  try {
    // An offline arrival remains evidence, but cannot tell a customer it just happened.
    if (Date.parse(c.now) - Date.parse(visit.arrival.deviceTime) > 120_000 || Date.parse(visit.arrival.deviceTime) - Date.parse(c.now) > 10_000) fail('ARRIVAL_STALE', 'This arrival was recorded more than two minutes ago.')
    const job = find(c.s, 'jobs', visit.jobId), customer = find(c.s, 'customers', job.customerId)
    const policy = await approvedStatusNotice(c, db, 'arrival', customer)
    const values: Record<string, string> = { customer: customer.name, technician: tech.name.trim().split(/\s+/)[0], eta: '', title: job.title, number: job.number }
    queueSms(c, { kind: 'arrival', subjectKind: 'visit', subjectId: visit.id, customerId: customer.id, jobId: job.id, to: customer.phone, text: policy.templates.arrival.replace(/{{(.*?)}}/g, (_: string, key: string) => values[key] ?? ''), label: 'arrival notice' })
    guardStatusOwner(c, policy)
  } catch (error) {
    if (!(error instanceof Problem)) throw error
    event(c, { jobId: visit.jobId, subjectKind: 'visit', subjectId: visit.id, kind: 'arrival.notice.suppressed', summary: 'Arrival was recorded without a text; a fresh arrival, customer consent, quiet hours, connection and owner authority must permit it', data: { reason: error.code } })
  }
}
