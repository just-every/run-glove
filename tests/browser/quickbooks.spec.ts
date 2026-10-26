import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker harness is a JavaScript test fixture.
import { installation } from '../api/harness.mjs'
// @ts-expect-error Business setup runs through the production command door.
import { quickbooksBusiness, qboInvoice } from '../fixtures/quickbooks-business.mjs'
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
async function send(page: Page, control: Locator) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await control.click(); const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body.result
}
async function shots(page: Page, control: Locator, name: string) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 }); await control.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const icons = await page.locator('button:visible,a:visible').evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).innerText.trim() && !n.querySelector('img[alt]:not([alt=""])') && !n.getAttribute('aria-describedby')).map(n => n.getAttribute('aria-label')))
    expect(icons).toEqual([])
    if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-quickbooks-${name}.png`) }) }
  }
}

test('QuickBooks owner connects and maps existing records, repairs a rejected invoice, syncs once and reads its payment at 1440 and 390', async ({ browser }) => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
  try {
    const b = await quickbooksBusiness(h), secondSite = await h.command('site.save', { customerId: b.customer.id, address: '28 Congress Avenue, Austin TX 78704', zip: '78704' })
    for (const [site, remoteId] of [[b.site, '11'], [secondSite, '12']]) {
      h.quickbooks.record('customer', { Id: remoteId, SyncToken: '0', Active: true, Job: true, ParentRef: { value: '10' }, BillWithParent: true })
      await h.command('qbo.map', { kind: 'site', id: site.id, remoteId })
    }
    await h.command('qbo.confirmLinks', { confirm: true })
    const invoice = await qboInvoice(h, b), secondInvoice = await qboInvoice(h, b, secondSite, 'Second property')
    await h.command('qbo.connect', { key: null })
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry from rer dev is required.')
    await page.goto(process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url())
      const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
    })
    await page.goto(`${origin}/app#team`)
    const settings = page.getByRole('heading', { name: 'QuickBooks Online sandbox', exact: true }).locator('..')
    await settings.getByLabel('QuickBooks sandbox company ID', { exact: true }).fill('123')
    await settings.getByLabel('QuickBooks sandbox access token', { exact: true }).fill('synthetic-glove-901')
    await send(page, settings.getByRole('button', { name: 'Connect QuickBooks sandbox', exact: true }))
    expect(await page.evaluate(() => JSON.stringify(sessionStorage))).not.toContain('synthetic-glove-901')
    await shots(page, settings.getByRole('heading', { name: 'QuickBooks Online sandbox', exact: true }), 'connected')
    await settings.getByText('Link a record by QuickBooks ID', { exact: true }).click()
    for (const [kind, id, remoteId] of [['customer', b.customer.id, '10'], ['service', b.service.id, '20']]) {
      await settings.getByLabel('Record type', { exact: true }).selectOption(kind)
      await settings.getByLabel('Glove record', { exact: true }).selectOption(id)
      await settings.getByLabel('Existing QuickBooks record ID', { exact: true }).fill(remoteId)
      await send(page, settings.getByRole('button', { name: 'Verify and link QuickBooks record', exact: true }))
    }
    await send(page, settings.getByRole('button', { name: 'Confirm existing QuickBooks links', exact: true }))
    await settings.getByLabel('QuickBooks tax code ID', { exact: true }).fill('40')
    await send(page, settings.getByRole('button', { name: 'Verify and save accounting references', exact: true }))
    await shots(page, settings.getByRole('heading', { name: 'Invoice accounting references', exact: true }), 'mapped')
    await page.goto(`${origin}/app#invoices/${invoice.id}`)
    const panel = page.getByRole('heading', { name: 'QuickBooks Online sandbox', exact: true }).locator('..')
    h.quickbooks.reject = 'Sales tax account is inactive'
    await send(page, panel.getByRole('button', { name: 'Sync QuickBooks invoice', exact: true }))
    await expect(panel).toContainText('Sales tax account is inactive')
    await shots(page, panel, 'rejected')
    h.quickbooks.reject = null
    const posted = await send(page, panel.getByRole('button', { name: 'Retry QuickBooks invoice', exact: true }))
    await expect(panel).toContainText(`QuickBooks ID ${posted.remoteId}`)
    await shots(page, panel, 'confirmed')
    const writes = h.quickbooks.calls.filter((r: any) => r.entity === 'invoice' && r.body).length
    await send(page, panel.getByRole('button', { name: 'Sync QuickBooks invoice', exact: true }))
    expect(h.quickbooks.calls.filter((r: any) => r.entity === 'invoice' && r.body)).toHaveLength(writes)
    await page.goto(`${origin}/app#invoices/${secondInvoice.id}`)
    const secondPosted = await send(page, panel.getByRole('button', { name: 'Sync QuickBooks invoice', exact: true }))
    h.quickbooks.record('payment', { Id: '90', CustomerRef: { value: '10' }, TotalAmt: Number(invoice.revisions[0].totals.total) + Number(secondInvoice.revisions[0].totals.total), UnappliedAmt: 0, Line: [invoice, secondInvoice].map((inv, i) => ({ Amount: Number(inv.revisions[0].totals.total), LinkedTxn: [{ TxnId: [posted, secondPosted][i].remoteId, TxnType: 'Invoice' }] })) })
    await page.goto(`${origin}/app#team`)
    await settings.getByLabel('QuickBooks payment ID', { exact: true }).fill('90')
    await send(page, settings.getByRole('button', { name: 'Read QuickBooks payment', exact: true }))
    await expect(settings).toContainText('Read QuickBooks payment 90.')
    await shots(page, settings.getByRole('heading', { name: 'Read a QuickBooks payment', exact: true }), 'payment-read')
    await settings.getByText('Link a record by QuickBooks ID', { exact: true }).click()
    await settings.getByLabel('Record type', { exact: true }).selectOption('customer')
    await settings.getByLabel('Glove record', { exact: true }).selectOption(b.customer.id)
    h.quickbooks.uncertain = true
    await send(page, settings.getByRole('button', { name: 'Sync QuickBooks customer', exact: true }))
    await expect(settings).toContainText('The outcome is unknown.')
    await shots(page, settings.getByLabel('QuickBooks reference to reconcile', { exact: true }), 'unknown')
    h.quickbooks.uncertain = false
    const beforeReconcile = h.quickbooks.calls.filter((r: any) => r.body).length
    await send(page, settings.getByRole('button', { name: 'Verify QuickBooks outcome', exact: true }))
    expect(h.quickbooks.calls.filter((r: any) => r.body)).toHaveLength(beforeReconcile)
    await expect(settings).toContainText('Owner verified the existing QuickBooks record')
    await shots(page, settings.getByRole('button', { name: 'Sync QuickBooks customer', exact: true }), 'reconciled')
    await page.goto(`${origin}/app#invoices/${invoice.id}`)
    await expect(page.getByRole('region', { name: 'Payments and balance', exact: true })).toContainText('Amount due $0.00')
    for (const [inv, name] of [[invoice, 'paid-invoice'], [secondInvoice, 'paid-second-property']] as const) {
      await page.goto(`${origin}/app#invoices/${inv.id}`)
      const payments = page.getByRole('region', { name: 'Payments and balance', exact: true })
      await expect(payments).toContainText('Amount due $0.00')
      const allocation = payments.getByText(`Payment · QuickBooks · $${inv.revisions[0].totals.total}`, { exact: true })
      await expect(allocation).toBeVisible()
      await shots(page, allocation, name)
    }
    const liveInvoice = (await h.state()).invoices.find((r: any) => r.id === invoice.id)
    const legacyPayment = await h.command('payment.record', { invoiceId: invoice.id, version: liveInvoice.version, amount: '1.00', method: 'check', reference: 'Prior company adjustment' })
    await page.goto(`${origin}/app#invoices/${invoice.id}`)
    const legacyOutcome = await send(page, panel.getByRole('button', { name: 'Sync QuickBooks payment', exact: true }))
    const legacyBody = h.quickbooks.calls.find((r: any) => r.entity === 'payment' && r.body).body
    const originalConnection = (await h.state()).business[0].qbo.connectionId
    const changedCustomer = (await h.state()).customers.find((r: any) => r.id === b.customer.id)
    await h.command('customer.save', { ...changedCustomer, email: 'billing@cedar.example.test' })
    await page.goto(`${origin}/app#team`)
    await settings.getByText('Link a record by QuickBooks ID', { exact: true }).click()
    await settings.getByLabel('Glove record', { exact: true }).selectOption(b.customer.id)
    h.quickbooks.uncertain = true
    await send(page, settings.getByRole('button', { name: 'Sync QuickBooks customer', exact: true }))
    h.quickbooks.uncertain = false
    const custodyWrites = h.quickbooks.calls.filter((r: any) => r.body).length
    const connectCompany = async (realm: string) => {
      await settings.getByLabel('QuickBooks sandbox company ID', { exact: true }).fill(realm)
      await settings.getByLabel('QuickBooks sandbox access token', { exact: true }).fill('synthetic-glove-905')
      await send(page, settings.getByRole('button', { name: 'Connect QuickBooks sandbox', exact: true }))
    }
    await connectCompany('456')
    await expect(settings).toContainText('Reconnect the original QuickBooks company')
    await settings.getByLabel('Existing QuickBooks record ID', { exact: true }).fill('110')
    const refusedMapping = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
    await settings.getByRole('button', { name: 'Verify and link QuickBooks record', exact: true }).click()
    expect((await (await refusedMapping).json()).error.code).toBe('QBO_UNCERTAIN')
    await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
    await shots(page, settings.getByRole('alert').filter({ hasText: 'Reconnect the original QuickBooks company' }), 'previous-company-unresolved')
    await connectCompany('123')
    expect((await h.state()).business[0].qbo.connectionId).toBe(originalConnection)
    await settings.getByLabel('QuickBooks reference to reconcile', { exact: true }).fill('10')
    await send(page, settings.getByRole('button', { name: 'Verify QuickBooks outcome', exact: true }))
    await expect(settings).toContainText('Owner verified the existing QuickBooks record')
    await shots(page, settings.getByRole('button', { name: 'Sync QuickBooks customer', exact: true }), 'original-company-reconciled')
    await connectCompany('456')
    const companyReview = page.getByRole('region', { name: 'QuickBooks company review', exact: true })
    await companyReview.getByRole('button', { name: 'Read company review', exact: true }).click()
    await expect(companyReview.locator('fieldset')).toHaveAttribute('aria-busy', 'false', { timeout: 120_000 })
    await expect(companyReview).toContainText('Glove records with no match')
    const maps: [string, string, string][] = [['customer', b.customer.id, '110'], ['service', b.service.id, '120'], ['service', b.refrigerant.id, '121'], ['site', b.site.id, '111'], ['site', secondSite.id, '112'], ['invoice', invoice.id, '1501'], ['invoice', secondInvoice.id, '1502']]
    for (const [kind, id, remoteId] of maps) {
      if (kind === 'customer' || kind === 'service') {
        const entity = kind === 'service' ? 'item' : 'customer', originalId = kind === 'service' ? remoteId.slice(1) : '10'
        h.quickbooks.record(entity, { ...h.quickbooks.records.get(`${entity}/${originalId}`), Id: remoteId }, '456')
      } else if (kind === 'site') h.quickbooks.record('customer', { Id: remoteId, SyncToken: '0', Active: true, Job: true, ParentRef: { value: '110' }, BillWithParent: true }, '456')
      else {
        const inv = id === invoice.id ? invoice : secondInvoice
        h.quickbooks.record('invoice', { Id: remoteId, SyncToken: '0', DocNumber: inv.number, CustomerRef: { value: id === invoice.id ? '111' : '112' }, TotalAmt: Number(inv.revisions[0].totals.total), CurrencyRef: { value: 'USD' } }, '456')
      }
      await settings.getByLabel('Record type', { exact: true }).selectOption(kind)
      await settings.getByLabel('Glove record', { exact: true }).selectOption(id)
      await settings.getByLabel('Existing QuickBooks record ID', { exact: true }).fill(remoteId)
      await send(page, settings.getByRole('button', { name: 'Verify and link QuickBooks record', exact: true }))
    }
    await send(page, settings.getByRole('button', { name: 'Confirm existing QuickBooks links', exact: true }))
    h.quickbooks.record('payment', { ...legacyBody, Id: '190', CustomerRef: { value: '110' }, Line: [{ ...legacyBody.Line[0], LinkedTxn: [{ TxnId: '1501', TxnType: 'Invoice' }] }] }, '456')
    await page.goto(`${origin}/app#invoices/${invoice.id}`)
    await expect(panel.getByRole('button', { name: 'Sync QuickBooks payment', exact: true })).toHaveCount(0)
    await expect(panel.getByLabel('QuickBooks reference to reconcile', { exact: true })).toHaveValue('')
    await panel.getByLabel('QuickBooks reference to reconcile', { exact: true }).fill('190')
    await shots(page, panel.getByRole('button', { name: 'Verify QuickBooks outcome', exact: true }), 'existing-new-company-payment')
    await send(page, panel.getByRole('button', { name: 'Verify QuickBooks outcome', exact: true }))
    await expect(panel).toContainText('Owner verified the existing payment in this QuickBooks company')
    await expect(panel).toContainText(`Previous company outcome: complete · QuickBooks ID ${legacyOutcome.remoteId}`)
    await send(page, panel.getByRole('button', { name: 'Sync QuickBooks payment', exact: true }))
    await shots(page, panel.getByRole('button', { name: 'Sync QuickBooks payment', exact: true }), 'new-company-payment-reconciled')
    expect(h.quickbooks.calls.filter((r: any) => r.body)).toHaveLength(custodyWrites)
    const migrated = (await h.state()).payments.find((r: any) => r.id === legacyPayment.id)
    expect(migrated.qboSyncHistory).toEqual([legacyOutcome])
    expect(migrated.qboSync.remoteId).toBe('190')
    const exported = await (await h.request('/api/glove/export')).json()
    expect(exported.payments.find((r: any) => r.id === legacyPayment.id).qboSyncHistory).toEqual([legacyOutcome])
    expect(JSON.stringify(exported)).not.toContain('synthetic-glove-905')
  } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
})

test('QuickBooks company review resolves ambiguous links, approves two creations and preserves moved invoices at 1440 and 390', async ({ browser }) => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
  try {
    // @ts-expect-error Saved documented-shape fixture uses the production move-in commands.
    const { quickbooksMoveIn } = await import('../fixtures/quickbooks-movein.mjs')
    const b = await quickbooksMoveIn(h)
    await h.command('qbo.connect', { realmId: '123', key: 'synthetic-glove-901', mode: 'sandbox' })
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry from rer dev is required.')
    await page.goto(process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url())
      const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
    })
    await page.goto(`${origin}/app#team`)
    const settings = page.getByRole('heading', { name: 'QuickBooks Online sandbox', exact: true }).locator('..')
    const review = page.getByRole('region', { name: 'QuickBooks company review', exact: true })
    const reviewAction = async (button: Locator) => { await button.click(); await expect(review.locator('fieldset')).toHaveAttribute('aria-busy', 'false', { timeout: 120_000 }); await expect(review.getByRole('button', { name: 'Refresh company review', exact: true })).toBeEnabled() }
    await reviewAction(review.getByRole('button', { name: 'Read company review', exact: true }))
    const matched = review.getByText('Matched records · 114', { exact: true })
    await matched.click()
    await expect(review.getByRole('region', { name: 'matched customers', exact: true })).toContainText('47 customers')
    await expect(review.getByRole('region', { name: 'matched items', exact: true })).toContainText('20 items')
    await expect(review).toContainText('Name and email or phone')
    await expect(review).toContainText('SKU')
    await expect(review.getByRole('button', { name: 'Create approved customer', exact: true }).first()).toBeDisabled()
    await shots(page, matched, 'review-matched')
    const ambiguous = review.getByRole('region', { name: 'ambiguous customers', exact: true })
    await ambiguous.getByLabel('QuickBooks choice for Synthetic customer 48', { exact: true }).selectOption('none')
    await expect(ambiguous).toContainText('this record remains unresolved')
    await shots(page, ambiguous, 'review-ambiguous-none')
    await ambiguous.getByLabel('QuickBooks choice for Synthetic customer 48', { exact: true }).selectOption('48')
    await expect(ambiguous.getByRole('option', { name: /ID 48 · 5125550048/ })).toHaveCount(1)
    await expect(ambiguous.locator('p').filter({ hasText: 'Synthetic customer 48 · ID 48 · 5125550048' })).toBeVisible()
    await shots(page, ambiguous, 'review-ambiguous-choice')
    const refusalResponse = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
    await settings.getByRole('button', { name: 'Confirm existing QuickBooks links', exact: true }).click()
    expect((await (await refusalResponse).json()).error.code).toBe('QBO_REVIEW')
    await expect(settings.getByRole('alert').filter({ hasText: 'Verify and link every pre-existing' })).toBeVisible()
    await shots(page, settings.getByRole('alert').filter({ hasText: 'Verify and link every pre-existing' }), 'review-refused-confirmation')
    expect(h.quickbooks.calls.filter((r: any) => r.body)).toHaveLength(0)
    await reviewAction(ambiguous.getByRole('button', { name: 'Verify selected link', exact: true }))
    for (const kind of ['customers', 'items', 'invoices']) await reviewAction(review.getByRole('button', { name: `Verify matched ${kind}`, exact: true }))
    expect(h.quickbooks.calls.filter((r: any) => r.body)).toHaveLength(0)
    h.quickbooks.record('customer', { Id: '102', SyncToken: '0', Active: true, DisplayName: 'Synthetic customer 49' })
    await reviewAction(review.getByRole('button', { name: 'Refresh company review', exact: true }))
    const unmatched = review.getByRole('region', { name: 'unmatched customers', exact: true })
    const customer49 = unmatched.getByRole('listitem').filter({ has: page.getByText('Synthetic customer 49', { exact: true }) })
    await expect(customer49).toContainText('Name clash')
    await expect(customer49.getByRole('checkbox')).toBeDisabled()
    await shots(page, customer49, 'review-name-clash')
    await review.getByText('QuickBooks records left untouched · 4', { exact: true }).click()
    await expect(review.getByRole('region', { name: 'Untouched customers', exact: true })).toContainText('Provider-only property')
    await shots(page, review.getByRole('region', { name: 'Untouched customers', exact: true }), 'review-provider-only')
    h.quickbooks.records.delete(['customer', '102'].join('/'))
    await reviewAction(review.getByRole('button', { name: 'Refresh company review', exact: true }))
    for (const name of ['Synthetic customer 49', 'Synthetic customer 50']) {
      const row = unmatched.getByRole('listitem').filter({ has: page.getByText(name, { exact: true }) })
      await row.getByRole('checkbox').check()
      await shots(page, row, `review-approved-${name.endsWith('49') ? '49' : '50'}`)
      await reviewAction(row.getByRole('button', { name: 'Create approved customer', exact: true }))
      expect([...h.quickbooks.records.values()].filter((r: any) => r.DisplayName === name)).toHaveLength(1)
    }
    expect(h.quickbooks.calls.filter((r: any) => r.body)).toHaveLength(2)
    await send(page, settings.getByRole('button', { name: 'Confirm existing QuickBooks links', exact: true }))
    await expect(settings).toContainText('Existing links confirmed.')
    await shots(page, settings.getByText('Existing links confirmed.', { exact: true }), 'review-confirmed')
    const linked = await h.state(), invoice = linked.invoices.find((r: any) => r.id === b.invoices[0].id)
    expect(linked.invoices.filter((r: any) => r.openingBalance && r.qbo?.confirmedBy)).toHaveLength(48)
    await h.command('payment.record', { invoiceId: invoice.id, version: invoice.version, amount: '76.50', method: 'check', reference: 'Synthetic reviewed payment' })
    await page.goto(`${origin}/app#invoices/${invoice.id}`)
    const accounting = page.getByRole('heading', { name: 'QuickBooks Online sandbox', exact: true }).locator('..')
    await send(page, accounting.getByRole('button', { name: 'Sync QuickBooks payment', exact: true }))
    await send(page, accounting.getByRole('button', { name: 'Sync QuickBooks payment', exact: true }))
    await expect(page.getByRole('region', { name: 'Payments and balance', exact: true })).toContainText('Amount due $0.00')
    await shots(page, accounting, 'review-linked-payment')
    expect(h.quickbooks.calls.filter((r: any) => r.entity === 'invoice' && r.body)).toHaveLength(0)
    const payments = h.quickbooks.calls.filter((r: any) => r.entity === 'payment' && r.body)
    expect(payments).toHaveLength(1)
    expect(payments[0].body.Line[0].LinkedTxn[0].TxnId).toBe(invoice.qbo.remoteId)
    const person = await h.person('Avery Chen', 'technician')
    const technician = await h.command('technician.save', { name: 'Avery Chen', operatorId: person.id })
    const customer = linked.customers.find((r: any) => r.id === invoice.customerId), site = linked.sites.find((r: any) => r.customerId === customer.id), service = linked.services[0]
    h.quickbooks.record('taxcode', { Id: '40', SyncToken: '0', Name: 'Austin combined', Active: true })
    await h.command('qbo.configure', { taxCodeRef: '40' })
    const next = await qboInvoice(h, { customer, site, service, priya: technician, priyaPerson: person }, site, 'Next service after move-in')
    await page.goto(`${origin}/app#invoices/${next.id}`)
    await send(page, accounting.getByRole('button', { name: 'Sync QuickBooks invoice', exact: true }))
    await shots(page, accounting, 'review-next-invoice')
    const nextPosts = h.quickbooks.calls.filter((r: any) => r.entity === 'invoice' && r.body)
    expect(nextPosts).toHaveLength(1)
    expect(nextPosts[0].body.CustomerRef.value).toBe(customer.qbo.remoteId)

    const activity = await (await h.request('/api/glove/export')).json()
    expect(JSON.stringify(activity)).toContain('qbo.linksConfirmed')
    expect(JSON.stringify(activity)).not.toContain('synthetic-glove-901')
  } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
})
