import { readFile } from 'node:fs/promises'
export async function exportedFixture(system) {
  const { readdir } = await import('node:fs/promises')
  const root = `tests/fixtures/${system}-movein/`
  const files = await Promise.all((await readdir(root)).filter(n => /\.(json|csv)$/.test(n)).map(async name => ({ name, text: await readFile(root + name, 'utf8') })))
  if (system !== 'jobber') files.push({ name: `attachments/${system === 'workiz' ? 'synthetic-glove-6' : system === 'servicetitan' ? 'synthetic-glove-attachment.txt' : '9'}`, base64: Buffer.from('synthetic-glove-attachment\n').toString('base64') })
  return files
}

