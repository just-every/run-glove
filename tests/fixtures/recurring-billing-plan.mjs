import assert from 'node:assert/strict'
import { installation } from '../api/harness.mjs'

// PLAN-005 public-door fixture: a Chicago business, genuine signed-in people
// and an integration token, then the harness runtime clock moves to 2025.
export const line = (unitPrice = '50.00', description = 'Preventive maintenance', tax = 'FREE') => ({ description, quantity: '1', unitPrice, tax })
export const cents = value => Math.round(Number(value) * 100)

export async function shop(opts = {}) {
  const h = await installation({ at: '2026-11-08T12:00:00.000Z', ...opts })
  try {
    await h.command('business.save', { name: 'Glove recurring service', currency: 'USD', timezone: 'America/Chicago', paymentTermsDays: 14 })
    const customer = await h.command('customer.save', { name: 'Recurring customer' })
    const site = await h.command('site.save', { customerId: customer.id, address: '120 Main Street, Austin TX 78701' })
    const people = {}
    for (const [key, name, role] of [['office', 'Riley Office', 'office'], ['dispatcher', 'Morgan Dispatch', 'dispatcher'], ['field', 'Robin Field', 'technician']]) people[key] = await h.person(name, role)
    const customRole = await h.command('role.save', { name: 'Billing viewer', permissions: ['reports.read', 'series.create'] })
    people.custom = await h.person('Casey Custom', `custom:${customRole.id}`)
    const issued = await h.command('token.issue', { name: 'Synthetic billing integration', role: 'dispatcher' })
    const token = { run: async (type, payload, { error }) => {
      const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${issued.token}` }, body: { commandId: crypto.randomUUID(), type, payload } })
      const body = await response.json(); assert.equal(body.ok, false, JSON.stringify(body)); assert.equal(body.error.code, error, JSON.stringify(body))
    } }
    const technician = await h.command('technician.save', { name: 'Robin Field', operatorId: people.field.id })
    const material = await h.command('service.save', { code: 'synthetic-glove-filter', name: 'Replacement filter', kind: 'material', unitPrice: '7.00', tax: 'FREE' })
    const coil = await h.command('service.save', { code: 'synthetic-glove-extra', name: 'Extra coil clean', kind: 'service', unitPrice: '30.00', tax: 'FREE' })
    const expense = (visit, { vendor, description, amount, billable = true }) => people.field.run('expense.record', { visitId: visit.id, category: 'permit', vendor, description, amount, billable, deviceTime: visit.startAt })
    await h.setTime('2025-01-01T16:00:00.000Z')
    const job = (title, price = '50.00') => h.command('job.create', { customerId: customer.id, siteId: site.id, title, lines: [line(price)] })
    const repeat = (j, billing, extra = {}) => h.command('series.create', { jobId: j.id, version: j.version, date: '2025-01-29', rule: { unit: 'week' }, technicianId: technician.id, start: '09:00', end: '10:00', horizonDays: 365, until: '2025-02-19', billing, ...extra })
    const visits = async jobId => (await h.state()).visits.filter(v => v.jobId === jobId).sort((a, b) => a.startAt.localeCompare(b.startAt))
    const visitOn = async (jobId, date) => { const v = (await visits(jobId)).find(x => x.local.date === date); assert.ok(v, `visit on ${date}`); return v }
    /** The technician arrives, records materials and completes the visit at its end, on the harness runtime clock. */
    const serve = async (jobId, date, { materials = [], lines = [], expenses = [] } = {}) => {
      const visit = await visitOn(jobId, date)
      await h.setTime(visit.endAt)
      await people.field.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      for (const quantity of materials) await people.field.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'material', serviceId: material.id, quantity })
      for (const quantity of lines) await people.field.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'line', serviceId: coil.id, quantity, approval: { customerName: 'Pat Manager', method: 'verbal' } })
      for (const item of expenses) await expense(visit, item)
      await people.field.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Maintenance complete', signoff: { absentReason: 'Property manager away' } })
      return visit
    }
    const drafts = async jobId => (await h.state()).invoices.filter(i => i.jobId === jobId && i.recurring).sort((a, b) => a.recurring.dueDate.localeCompare(b.recurring.dueDate) || a.recurring.key.localeCompare(b.recurring.key))
    const cron = async at => { await h.setTime(at); await h.scheduled(at) }
    return { h, ...people, token, customer, site, technician, material, coil, expense, job, repeat, visits, visitOn, serve, drafts, cron }
  } catch (error) { await h.close(); throw error }
}
