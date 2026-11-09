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


/** Documented V2 variations for the focused ServiceTitan owner journey. */
export async function serviceTitanQualification() {
  const { readdir } = await import('node:fs/promises')
  const files = await exportedFixture('servicetitan')
  const root = 'tests/fixtures/servicetitan-movein/qualification/'
  for (const name of (await readdir(root)).filter(n => n.endsWith('.json'))) {
    const file = { name, text: await readFile(root + name, 'utf8') }
    const index = files.findIndex(f => f.name === name)
    if (index < 0) files.push(file)
    else files[index] = file
  }
  return files
}
