import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { phoneScreen } from './desk-fixture'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
type Command = { commandId: string; type: string; payload: Record<string, any> }
type Capture = { request: Command; status: number; response: any }
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })

// No route interception: the screen and direct calls share the native session
// and the actual dev Worker's migrated D1.
test('API-001 customer and two sites agree through real controls, HTTP edits and captured replay', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
  const page = await context.newPage(), captures: Capture[] = []
  const state = async () => {
    const response = await page.request.get(origin + '/api/glove/state')
    expect(response.status()).toBe(200)
    return response.json()
  }
  const screen = async (name: string, anchor: Locator) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      await phoneScreen(page, width, 'http-customers-' + name, anchor)
    }
    await page.setViewportSize({ width: 1440, height: 1050 })
  }
  const send = async (button: Locator, type: string, fields: Record<string, any>) => {
    const pending = page.waitForResponse(r => r.url() === origin + '/api/glove/commands' && r.request().method() === 'POST')
    await button.click()
    const response = await pending, request = response.request().postDataJSON() as Command, body = await response.json()
    expect(response.status()).toBe(200)
    expect(request.commandId).toBeTruthy()
    expect(request.type).toBe(type)
    expect(request.payload).toMatchObject(fields)
    expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
    const { version, ...retained } = fields
    expect(body.result).toMatchObject(retained)
    if (version !== undefined) expect(body.result.version).toBe(version + 1)
    captures.push({ request, status: response.status(), response: body })
    await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
    return body.result
  }
  const fill = async (form: Locator, fields: Record<string, string>) => {
    for (const [label, value] of Object.entries(fields)) await form.getByLabel(label, { exact: true }).fill(value)
  }
  const check = async (form: Locator, fields: Record<string, string>) => {
    for (const [label, value] of Object.entries(fields)) await expect(form.getByLabel(label, { exact: true })).toHaveValue(value)
  }
  try {
    if (!process.env.GLOVE_OPEN) throw new Error('Native owner entry required.')
    await page.goto(process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
      await page.waitForURL(u => u.pathname === '/app')
    }
    await page.goto(origin + '/app#customers')
    await page.getByRole('button', { name: 'New customer', exact: true }).click()
    const customer = {
      name: 'synthetic-glove-1', contact: 'Casey Customer',
      email: ['synthetic-glove-1', 'example.test'].join('@'),
      phone: '312 555 0101', billingAddress: '100 Billing Lane, Austin TX 78701',
    }
    const labels = (c: typeof customer) => ({
      Name: c.name, 'Contact person': c.contact, 'Email for quotes and invoices': c.email,
      Phone: c.phone, 'Billing address': c.billingAddress,
    })
    const customerForm = () => page.locator('form.panel').filter({ has: page.getByRole('button', { name: /^(Add customer|Save changes)$/ }) })
    await fill(customerForm(), labels(customer))
    const created = await send(customerForm().getByRole('button', { name: 'Add customer', exact: true }), 'customer.save', customer)
    expect((await state()).customers.filter((c: any) => c.id === created.id)).toEqual([expect.objectContaining(customer)])
    const edited = { ...customer, name: 'synthetic-glove-1 revised', email: ['synthetic-glove-2', 'example.test'].join('@'), contact: 'Morgan Customer', phone: '312 555 0102', billingAddress: '200 Billing Lane, Austin TX 78702' }
    await fill(customerForm(), labels(edited))
    await send(customerForm().getByRole('button', { name: 'Save changes', exact: true }), 'customer.save', { ...edited, id: created.id, version: created.version })
    await check(customerForm(), labels(edited))

    const sites = [
      { address: '10 First Site Road, Austin TX 78703', accessNotes: 'Ask reception for the blue gate', contact: 'First Caretaker', contactPhone: '312 555 0111' },
      { address: '20 Second Site Road, Austin TX 78704', accessNotes: 'Use the south service entrance', contact: 'Second Caretaker', contactPhone: '312 555 0122' },
    ]
    const siteFields = (s: typeof sites[number]) => ({
      'Site address': s.address, 'Access notes (optional)': s.accessNotes,
      'Site contact (optional)': s.contact, 'Site contact phone (optional)': s.contactPhone,
    })
    const sitePanel = page.locator('section.panel').filter({ has: page.getByRole('heading', { name: 'Sites', exact: true }) })
    const added = []
    for (const site of sites) {
      const form = sitePanel.locator('form').filter({ has: page.getByRole('button', { name: 'Add site', exact: true }) })
      await fill(form, siteFields(site))
      added.push(await send(form.getByRole('button', { name: 'Add site', exact: true }), 'site.save', { customerId: created.id, ...site }))
    }
    const expected = sites.map((site, i) => ({ ...site, id: added[i].id, customerId: created.id }))
    expect(new Set(added.map(s => s.id)).size).toBe(2)
    expect((await state()).sites.filter((s: any) => s.customerId === created.id)).toEqual(expected.map(s => expect.objectContaining(s)))
    const beforeCancel = await state()
    const firstRow = sitePanel.locator('li').filter({ has: page.getByText(sites[0].address, { exact: true }) })
    await firstRow.getByRole('button', { name: 'Edit site', exact: true }).click()
    await sitePanel.getByRole('form', { name: 'Edit site', exact: true }).getByLabel('Access notes (optional)', { exact: true }).fill('Unsaved access')
    await sitePanel.getByRole('button', { name: 'Cancel edit', exact: true }).click()
    await expect(sitePanel.getByRole('form', { name: 'Edit site', exact: true })).toHaveCount(0)
    const afterCancel = await state()
    expect(afterCancel.sites).toEqual(beforeCancel.sites)
    expect(afterCancel.events).toEqual(beforeCancel.events)
    for (let i = 0; i < sites.length; i++) {
      const row = sitePanel.locator('li').filter({ has: page.getByText(sites[i].address, { exact: true }) })
      await row.getByRole('button', { name: 'Edit site', exact: true }).click()
      const form = sitePanel.getByRole('form', { name: 'Edit site', exact: true })
      await check(form, siteFields(sites[i]))
      const next = { address: (i === 0 ? '11 First' : '21 Second') + ' Site Road, Austin TX 78705', accessNotes: 'Revised access ' + (i + 1), contact: 'Revised caretaker ' + (i + 1), contactPhone: '312 555 013' + i }
      await fill(form, siteFields(next))
      if (i === 0) await screen('site-edit', form)
      await send(form.getByRole('button', { name: 'Save site', exact: true }), 'site.save', { id: added[i].id, version: added[i].version, customerId: created.id, ...next })
      expected[i] = { ...next, id: added[i].id, customerId: created.id }
    }
    await page.goto(origin + '/app#customers/' + created.id)
    await page.reload()
    await check(customerForm(), labels(edited))
    for (const site of expected) {
      const row = sitePanel.locator('li').filter({ has: page.getByText(site.address, { exact: true }) })
      await expect(row).toContainText(site.accessNotes)
      await expect(row).toContainText(site.contact)
      await expect(row).toContainText(site.contactPhone)
    }
    expect((await state()).sites.filter((s: any) => s.customerId === created.id)).toEqual(expected.map(s => expect.objectContaining(s)))

    const current = (await state()).customers.find((c: any) => c.id === created.id)
    const direct = { ...edited, contact: 'Taylor HTTP', billingAddress: '300 Direct Avenue, Austin TX 78706' }
    const request = { commandId: crypto.randomUUID(), type: 'customer.save', payload: { ...current, ...direct } }
    const response = await page.request.post(origin + '/api/glove/commands', { headers: { origin }, data: request })
    const body = await response.json()
    expect(response.status()).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.result).toMatchObject({ id: created.id, ...direct })
    captures.push({ request, status: response.status(), response: body })
    await page.reload()
    await check(customerForm(), labels(direct))
    expect((await state()).customers.find((c: any) => c.id === created.id)).toMatchObject(direct)
    await screen('customer', customerForm())
    await screen('persisted', sitePanel)

    const beforeReplay = await state(), captured = captures.find(c => c.request.type === 'site.save')!
    const replay = await page.request.post(origin + '/api/glove/commands', { headers: { origin }, data: captured.request })
    const replayBody = await replay.json()
    expect(replay.status()).toBe(200)
    expect(replayBody).toEqual(captured.response)
    const afterReplay = await state()
    expect(afterReplay.customers).toEqual(beforeReplay.customers)
    expect(afterReplay.sites).toEqual(beforeReplay.sites)
    expect(afterReplay.events).toEqual(beforeReplay.events)
    expect(afterReplay.version).toBe(beforeReplay.version)
    if (process.env.GLOVE_BROWSER_OUTPUT) {
      await mkdir(process.env.GLOVE_BROWSER_OUTPUT, { recursive: true })
      await writeFile(join(process.env.GLOVE_BROWSER_OUTPUT, 'http-customers-receipt.json'), JSON.stringify({
        captures, replay: { request: captured.request, status: replay.status(), response: replayBody },
        customerId: created.id, sites: expected, persistedCustomer: afterReplay.customers.find((c: any) => c.id === created.id),
        recordAndEventReplayUnchanged: true, assertionsWidth: 1440, proofWidths: [1440, 390],
      }, null, 2) + '\n')
    }
  } finally { await context.close() }
})
