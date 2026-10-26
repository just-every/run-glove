// Synthetic saved responses use the same documented Jobber parent and CSV shapes as jobber-movein.
// No source accounting-ID or optional child encoding is invented by this fixture.
export async function quickbooksMoveIn(h) {
  await h.command('business.save', { name: 'Synthetic Glove', currency: 'USD', timezone: 'America/Chicago' })
  const nodes = (name, rows) => ({ name: `${name}.json`, text: JSON.stringify({ data: { [name]: { nodes: rows, pageInfo: { hasNextPage: false } } } }) })
  const clients = Array.from({ length: 50 }, (_, i) => ({ id: `synthetic-glove-client-${i + 1}`, name: `Synthetic customer ${i + 1}`, email: `synthetic-glove-${i + 1}@example.test`, phone: `512555${String(i + 1).padStart(4, '0')}`, isCompany: false }))
  const files = [nodes('clients', clients), nodes('properties', clients.map((client, i) => ({ id: `synthetic-glove-property-${i + 1}`, client: { id: client.id }, address: { street1: `${i + 1} Synthetic Street`, city: 'Austin', province: 'TX', postalCode: '78704', country: 'US' } }))), nodes('jobs', clients.map((client, i) => ({ id: `synthetic-glove-job-${i + 1}`, client: { id: client.id }, property: { id: `synthetic-glove-property-${i + 1}` }, title: 'Synthetic service', jobNumber: String(i + 1), jobStatus: 'ARCHIVED' }))), nodes('invoices', clients.slice(0, 48).map((client, i) => ({ id: `synthetic-glove-invoice-${i + 1}`, client: { id: client.id }, jobs: { nodes: [{ id: `synthetic-glove-job-${i + 1}` }], pageInfo: { hasNextPage: false } }, invoiceNumber: String(300 + i), issuedDate: '2026-10-01', dueDate: '2026-10-31' }))), { name: 'products-services.csv', text: 'Name,Description,Unit Price,Taxable,Category,Active\n' + Array.from({ length: 20 }, (_, i) => `Synthetic item ${i + 1},Synthetic service,100.00,TRUE,Service,TRUE`).join('\n') }, { name: 'invoice-balances.csv', text: 'Invoice #,Total ($),Balance ($),Tax amount ($),Issued date,Due date\n' + clients.slice(0, 48).map((_, i) => `${300 + i},108.25,76.50,8.25,2026-10-01,2026-10-31`).join('\n') }]
  const stage = await h.command('import.stage', { format: 'jobber', files, balanceAsOf: '2026-11-01' })
  if (stage.preview.rejections.length) throw Error(JSON.stringify(stage.preview.rejections))
  let completed = false
  for (let attempt = 0; attempt < 10; attempt++) {
    const response = await h.request('/api/glove/commands', { method: 'POST', body: { commandId: crypto.randomUUID(), type: 'import.commit', payload: { batchId: stage.id, version: stage.version, fingerprint: stage.preview.fingerprint } } })
    const result = await response.json()
    if (result.ok) { completed = true; break }
    if (result.error?.code !== 'IMPORT_INCOMPLETE') throw Error(JSON.stringify(result))
  }
  if (!completed) throw Error('Synthetic Jobber move-in did not finish after ten public-door resumptions')
  const s = await h.state(), customers = s.customers.filter(r => r.source?.system === 'Jobber'), services = s.services.filter(r => r.source?.system === 'Jobber'), invoices = s.invoices.filter(r => r.source?.system === 'Jobber')
  for (let i = 1; i <= 48; i++) {
    const source = clients[i - 1]
    h.quickbooks.record('customer', { Id: String(i), SyncToken: '0', Active: true, DisplayName: source.name, PrimaryEmailAddr: { Address: i % 2 ? source.email.toUpperCase() : '' }, PrimaryPhone: { FreeFormNumber: i % 2 ? '' : source.phone } })
    h.quickbooks.record('invoice', { Id: String(500 + i), SyncToken: '0', DocNumber: String(299 + i), CustomerRef: { value: String(i) }, TotalAmt: 108.25, Balance: 76.50, CurrencyRef: { value: 'USD' } })
  }
  h.quickbooks.record('customer', { Id: '99', SyncToken: '0', Active: true, DisplayName: clients[47].name, PrimaryEmailAddr: { Address: clients[47].email } })
  h.quickbooks.record('customer', { Id: '100', SyncToken: '0', Active: true, DisplayName: 'Provider-only parent' })
  h.quickbooks.record('customer', { Id: '101', SyncToken: '0', Active: true, DisplayName: 'Provider-only property', Job: true, ParentRef: { value: '100' }, BillWithParent: true })
  for (let i = 0; i < services.length; i++) h.quickbooks.record('item', { Id: String(200 + i), SyncToken: '0', Active: true, Name: services[i].name, Type: 'Service', IncomeAccountRef: { value: '30' }, ...(i < 10 ? { Sku: services[i].code } : {}) })
  return { customers, services, invoices }
}
