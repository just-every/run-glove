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
