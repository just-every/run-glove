import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
export async function exportedFixture(system) {
  const { readdir } = await import('node:fs/promises')
  const root = `tests/fixtures/${system}-movein/`
  const files = await Promise.all((await readdir(root)).filter(n => /\.(json|csv)$/.test(n)).map(async name => ({ name, text: await readFile(root + name, 'utf8') })))
  if (system === 'jobber') {
    files.push({ name: `attachments/${createHash('sha256').update('synthetic-glove-client-attachment').digest('hex').slice(0, 24)}`, base64: (await readFile(root + 'client-attachment.txt')).toString('base64') })
    files.push({ name: `attachments/${createHash('sha256').update('synthetic-glove-attachment').digest('hex').slice(0, 24)}`, base64: Buffer.from('synthetic-glove-attachment\n').toString('base64') })
  } else files.push({ name: `attachments/${system === 'housecallpro' ? 'synthetic-glove-file' : system === 'workiz' ? 'synthetic-glove-6' : system === 'servicetitan' ? 'synthetic-glove-attachment.txt' : '9'}`, base64: Buffer.from('synthetic-glove-attachment\n').toString('base64') })
  return files
}

// Saved ServiceM8 Job and JobPayment response fields from the official reference.
// The deprecated job.payment_amount is deliberately wrong: it is not a balance source.
export async function servicem8BalanceFiles() {
  const root = 'tests/fixtures/servicem8-small-hvac/'
  const files = await Promise.all(['company','companycontact','staff','job','jobactivity','jobmaterial','attachment'].map(async kind => ({ name: `${kind}.json`, text: await readFile(root + kind + '.json', 'utf8') })))
  const file = files.find(f => f.name === 'job.json'), jobs = JSON.parse(file.text).slice(0, 3)
  Object.assign(jobs[0], { total_invoice_amount: '201.85', invoice_date: '2026-08-14 00:00:00', payment_amount: '999.00', payment_received: 0 })
  file.text = JSON.stringify(jobs)
  files.push({ name: 'jobpayment.json', text: JSON.stringify([
    { uuid: 'synthetic-glove-payment-1', job_uuid: jobs[0].uuid, active: 1, amount: '100.00', timestamp: '2026-08-15 10:00:00' },
    { uuid: 'synthetic-glove-payment-2', job_uuid: jobs[0].uuid, active: 1, amount: '25.35', timestamp: '2026-08-16 10:00:00' },
    { uuid: 'synthetic-glove-payment-3', job_uuid: jobs[0].uuid, active: 0, amount: '50.00', timestamp: '2026-08-16 10:00:00' },
  ]) })
  return files
}

