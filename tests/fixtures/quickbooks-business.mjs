import { business } from '../api/harness.mjs'
export async function quickbooksBusiness(h) {
  const b = await business(h, { currency: 'USD', timezone: 'America/Chicago', taxSettings: { jurisdictions: [{ id: 'austin', name: 'Austin combined', rate: '8.25', zips: ['78704'], taxLabor: true }], defaultJurisdictionId: 'austin' } })
  h.quickbooks.record('customer', { Id: '10', SyncToken: '0', DisplayName: b.customer.name, Active: true, Job: false })
  h.quickbooks.record('item', { Id: '20', SyncToken: '0', Name: b.service.code, Active: true, Type: 'Service', IncomeAccountRef: { value: '30' } })
  h.quickbooks.record('item', { Id: '21', SyncToken: '0', Name: b.refrigerant.code, Active: true, Type: 'NonInventory', IncomeAccountRef: { value: '30' } })
  h.quickbooks.record('taxcode', { Id: '40', SyncToken: '0', Name: 'Austin combined', Active: true })
  await h.command('qbo.connect', { realmId: '123', key: 'synthetic-glove-901', mode: 'sandbox' })
  await h.command('qbo.map', { kind: 'customer', id: b.customer.id, remoteId: '10' })
  await h.command('qbo.map', { kind: 'service', id: b.service.id, remoteId: '20' })
  await h.command('qbo.map', { kind: 'service', id: b.refrigerant.id, remoteId: '21' })
  await h.command('qbo.confirmLinks', { confirm: true })
  await h.command('qbo.configure', { taxCodeRef: '40' })
  return b
}
export async function qboInvoice(h, b, site = b.site, title = 'HVAC service', discount, extraLines = []) {
  const job = await h.command('job.create', { customerId: b.customer.id, siteId: site.id, title, lines: [{ description: b.service.name, serviceId: b.service.id, quantity: '1', unitPrice: '189.00', tax: 'TAXABLE' }, ...extraLines], ...(discount ? { discount } : {}) })
  const visit = await h.command('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-10', start: title === 'Second property' ? '11:00' : '09:00', end: title === 'Second property' ? '12:00' : '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  for (const item of job.checklist.filter(i => i.required)) await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'checklist', itemId: item.id, result: 'done' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'HVAC service complete', signoff: { absentReason: 'Property manager away' } })
  const draft = await h.command('invoice.prepare', { jobId: job.id })
  if (discount) {
    const revised = await h.command('invoice.revise', { invoiceId: draft.id, version: draft.version, lines: draft.revisions[0].lines, reason: 'Approved service discount', discount })
    return h.command('invoice.approve', { invoiceId: draft.id, version: revised.version, revision: revised.revisions.at(-1).n })
  }
  return h.command('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
}
