import { business } from '../api/harness.mjs'
const tenant = '00000000-0000-4000-8000-000000000001'
const token = 'synthetic-glove-51'
const current = async (h, kind, id) => (await h.state())[kind].find(r => r.id === id)
const connect = async h => h.command('xero.connect', { version: (await h.state()).business[0].version, tenant, token })
export const xeroBusiness = async (h, { policy = true } = {}) => {
  const b = await business(h, { currency: 'USD', timezone: 'America/Chicago', taxSettings: { jurisdictions: [{ id: 'austin', name: 'Austin combined', rate: '8.25', zips: [], taxLabor: true }], defaultJurisdictionId: 'austin' } })
  h.xero.data.Contacts = [{ ContactID: 'synthetic-glove-contact-1', Name: b.customer.name, ContactStatus: 'ACTIVE' }]
  h.xero.data.Accounts = [{ AccountID: 'synthetic-glove-income', Code: '200', Status: 'ACTIVE', Type: 'REVENUE' }]
  h.xero.data.TaxRates = [{ TaxType: 'OUTPUT', Status: 'ACTIVE' }]
  h.xero.data.Items = [b.service, b.refrigerant].map((r, i) => ({ ItemID: `synthetic-glove-item-${i}`, Code: r.code, IsSold: true, SalesDetails: { AccountCode: '200', TaxType: 'OUTPUT' } }))
  await connect(h)
  if (policy) await enableXeroPolicy(h)
  for (const [kind, row, remoteId] of [['customer', b.customer, 'synthetic-glove-contact-1'], ['service', b.service, 'synthetic-glove-item-0'], ['service', b.refrigerant, 'synthetic-glove-item-1']]) await h.command('xero.map', { kind, id: row.id, version: (await current(h, kind === 'customer' ? 'customers' : 'services', row.id)).version, remoteId })
  await h.command('xero.confirmLinks', { version: (await h.state()).business[0].version, confirm: true })
  return b
}
export const xeroSync = async (h, kind, id, opts = {}, type = 'xero.sync') => h.command(type, { kind, id, version: (await current(h, { customer: 'customers', service: 'services', invoice: 'invoices' }[kind], id)).version, ...opts.payload }, opts)

export async function enableXeroPolicy(h, decision = 'allow', companyId) {
  const company = (await h.state()).business[0]
  await h.db.prepare("INSERT OR REPLACE INTO glove_company_action_policy(company_id,connection_id,risk_class,decision) VALUES(?,?,'provider-write',?)").bind(companyId ?? company.id, company.xeroInspection.connectionId, decision).run()
}
