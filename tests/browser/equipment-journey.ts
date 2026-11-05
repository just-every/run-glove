import { expect, type Page, type Locator, type BrowserContext } from '@playwright/test'

// Warranty dates are fixed; the phone clock is October 20 in Sydney and October 19 in UTC.
export async function addSiteUnits(form: Locator, send: (control: Locator) => Promise<any>, site: string, tag: string) {
  await form.getByLabel('Site', { exact: true }).selectOption({ label: site })
  let condenser: any
  for (const unit of [
    { type: 'AC condenser', make: 'Trane', model: 'XR14', serial: `C-${tag}`, installed: '2019-06-11', refrigerant: 'R-410A', location: 'Roof, north side', manufacturer: '2026-11-19', labor: '2026-10-10' },
    { type: 'Furnace', make: 'Carrier', model: '59TP6', serial: `F-${tag}`, installed: '2014-05-02', refrigerant: '', location: 'Basement plant room', manufacturer: '2027-11-24', labor: '2027-11-24' },
  ]) {
    for (const [label, value] of [['Type', unit.type], ['Make', unit.make], ['Model', unit.model], ['Serial', unit.serial], ['Installed', unit.installed], ['Refrigerant', unit.refrigerant], ['Location in the building', unit.location], ['Manufacturer warranty until', unit.manufacturer], ['Labor warranty until', unit.labor]]) await form.getByLabel(label, { exact: true }).fill(value)
    const result = await send(form.getByRole('button', { name: 'Add equipment' }))
    if (unit.type === 'AC condenser') condenser = result.result
    await expect(form.getByText(`Serial ${unit.serial}`, { exact: false })).toBeVisible()
    await expect(form.getByLabel('Type', { exact: true })).toHaveValue('')
  }
  return condenser
}

/** Native accepted job and actual technician completion; no seeded history projections. */
export async function serviceCondenser(desk: Page, phone: Page, command: (type: string, payload: object) => Promise<any>, s: any, condenser: any, techName: string) {
  const origin = new URL(desk.url()).origin
  const quote = await command('quote.draft', { customerId: condenser.customerId, siteId: condenser.siteId, title: 'Condenser maintenance', lines: [{ description: 'Condenser coil clean', quantity: '1', unitPrice: '50.00' }] })
  const approved = await command('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  await command('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  const job = await command('job.create', { quoteId: quote.id, equipmentIds: [condenser.id] })
  const visit = await command('visit.book', { jobId: job.id, technicianId: s.technicians.find((t: any) => t.name === techName).id, date: '2026-10-18', start: '09:00', end: '10:00' })
  const run = async (type: string, payload: object) => {
    const response = await phone.request.post(`${origin}/api/glove/commands`, { headers: { origin }, data: { commandId: crypto.randomUUID(), type, payload } })
    const body = await response.json()
    expect(body.ok, JSON.stringify(body.error)).toBe(true)
    return body.result
  }
  await run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-17T22:00:00Z' })
  await run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-17T22:20:00Z', kind: 'note', equipmentId: condenser.id, text: 'Condenser coil cleaned and rinsed' })
  // A same-site furnace note must not appear in the condenser's history.
  const furnace = s.equipment.find((e: any) => e.siteId === condenser.siteId && e.type === 'Furnace')
  await run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-17T22:21:00Z', kind: 'note', equipmentId: furnace.id, text: 'Furnace filter inspected' })
  const completed = await run('visit.complete', { visitId: visit.id, deviceTime: '2026-10-17T23:00:00Z', summary: 'Condenser service finished', signoff: { absentReason: 'Customer out' } })
  expect(completed.status).toBe('completed')
  return job
}

/** Reload with the network genuinely disconnected, then read the actual equipment screen. */
export async function readEquipmentOffline(phone: Page, context: BrowserContext, tag: string, job: any, techName: string) {
  await phone.clock.setFixedTime(new Date('2026-10-19T13:30:00Z'))
  await expect.poll(() => phone.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  await expect.poll(() => phone.evaluate(async () => (await caches.open('glove-shell-v1')).match('/app').then(Boolean))).toBe(true)
  await context.setOffline(true)
  await phone.reload()
  expect(await phone.evaluate(() => navigator.onLine)).toBe(false)
  await expect(phone.getByText(/^No signal: showing your day as of/)).toBeVisible()
  await phone.getByRole('button', { name: / 9:00 AM – 10:30 AM/ }).click()
  const equipment = phone.getByRole('region', { name: 'Equipment', exact: true })
  const condenser = equipment.locator('.material-row').filter({ has: equipment.getByText('AC condenser Trane XR14', { exact: true }) })
  const furnace = equipment.locator('.material-row').filter({ has: equipment.getByText('Furnace Carrier 59TP6', { exact: true }) })
  await expect(equipment.locator('.material-row')).toHaveCount(2)
  await expect(condenser).toContainText(`Serial C-${tag} · installed 2019-06-11 · R-410A · Roof, north side`)
  await expect(condenser.getByText('Manufacturer warranty expiring 2026-11-19', { exact: true })).toBeVisible()
  await expect(condenser.getByText('Labor warranty expired 2026-10-10', { exact: true })).toBeVisible()
  await expect(furnace).toContainText(`Serial F-${tag} · installed 2014-05-02 · Basement plant room`)
  await expect(furnace.getByText('Manufacturer warranty until 2027-11-24', { exact: true })).toBeVisible()
  await expect(furnace.getByText('Labor warranty until 2027-11-24', { exact: true })).toBeVisible()
  await condenser.getByText('Service history', { exact: true }).click()
  await expect(condenser.getByText(`${job.number} · Condenser maintenance`, { exact: true })).toBeVisible()
  await expect(condenser.getByText(`2026-10-18 09:00 · ${techName} · completed`, { exact: true })).toBeVisible()
  await expect(condenser.getByText('Condenser coil cleaned and rinsed', { exact: true })).toBeVisible()
  await expect(condenser.getByText('Furnace filter inspected', { exact: true })).toHaveCount(0)
  await expect(equipment.getByText('Furnace Carrier', { exact: true })).toHaveCount(0)
  return equipment
}
