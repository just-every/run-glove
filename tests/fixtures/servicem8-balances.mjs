import { readFile } from 'node:fs/promises'

// Authored from the ServiceM8 Job and JobPayment resource schemas. The
// payment list includes inactive history and a peer whose bytes must not leak.
export async function serviceM8Balances() {
  const names = ['company', 'companycontact', 'job', 'jobmaterial']
  const files = await Promise.all(names.map(async kind => ({ name: `${kind}.json`, text: await readFile(`tests/fixtures/servicem8-small-hvac/${kind}.json`, 'utf8') })))
  const job = files.find(f => f.name === 'job.json'), jobs = JSON.parse(job.text)
  const target = jobs[0]
  Object.assign(target, { invoice_date: '2026-08-14 15:20:00', total_invoice_amount: '201.85', payment_received: 0 })
  job.text = JSON.stringify(jobs.slice(0, 3))
  files.push({ name: 'jobpayment.json', text: JSON.stringify([
    { uuid: 'synthetic-glove-payment-1', active: 1, job_uuid: target.uuid, timestamp: '2026-08-15 10:00:00', amount: '125.35', method: 'Cash', attachment_uuid: '8f8f8f8f-1111-4222-8333-444444444444', note: 'Synthetic retained payment note' },
    { uuid: 'synthetic-glove-payment-inactive', active: 0, job_uuid: target.uuid, amount: '999.00', note: 'Synthetic inactive payment note' },
    { uuid: 'synthetic-glove-payment-peer', active: 1, job_uuid: jobs[2].uuid, amount: '25.00', note: 'Synthetic peer payment note', customer_mention: 'Balmain Bakehouse' },
  ]) })
  files.push({ name: 'attachments/8f8f8f8f-1111-4222-8333-444444444444', base64: Buffer.from('Synthetic retained payment attachment bytes').toString('base64') })
  return files
}

// Asset and AssetType fields follow the official ServiceM8 references. The
// equipment-map list is an owner-authored Glove crosswalk, not a provider export.
export async function serviceM8Equipment() {
  const files = await serviceM8Balances(), jobs = JSON.parse(files.find(f => f.name === 'job.json').text)
  const fields = { make: 'Synthetic maker', model: 'Synthetic unit', serial: 'synthetic-glove-serial-1', installedOn: '2025-10-01', manufacturerWarrantyUntil: '2028-10-01', laborWarrantyUntil: '2027-10-01', location: 'Synthetic plant room' }
  files.push({ name: 'assettype.json', text: JSON.stringify([{ uuid: 'synthetic-glove-type-1', active: 1, name: 'Heat pump' }]) })
  files.push({ name: 'asset.json', text: JSON.stringify([0, 2].map((i, n) => ({ uuid: `synthetic-glove-asset-${n + 1}`, active: 1, company_uuid: jobs[i].company_uuid, asset_type_uuid: 'synthetic-glove-type-1', name: n ? 'Synthetic peer asset' : 'Synthetic owned asset', asset_code: `synthetic-glove-label-${n + 1}`, field_data: Object.entries(fields).map(([field, value], index) => ({ uuid: `synthetic-glove-field-${index + 1}`, fieldType: 'Text', fieldName: `Owner custom label ${index + 1}`, fieldValue: n && field === 'serial' ? 'synthetic-glove-peer-serial' : value, sortOrder: index })) }))) })
  files.push({ name: 'equipment-map.json', text: JSON.stringify([0, 2].map((i, n) => ({ uuid: `synthetic-glove-asset-${n + 1}`, job_uuid: jobs[i].uuid, fields: Object.fromEntries(Object.keys(fields).map((field, index) => [field, `synthetic-glove-field-${index + 1}`])) }))) })
  return files
}
