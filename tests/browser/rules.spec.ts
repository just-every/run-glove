import { test, expect, type Browser, type Page } from '@playwright/test'
import { phoneDesk } from './phone-desk'
import { deskPage, action, phoneScreen, origin } from './desk-fixture'
// @ts-expect-error Production Worker, native sessions and durable D1 fixture.
import { installation, business } from '../api/harness.mjs'

// The focused Rules step runs before the broader desk journey. Assertions run
// at 1440; the same screens are recorded at 390 without a duplicate journey.
export async function rulesBrowser(browser: Browser) {
  const h = await installation({ at: '2026-11-05T12:00:00Z' })
  const contexts = []
  try {
    const b = await business(h)
    const owner = await deskPage(browser, h, 1440)
    contexts.push(owner)
    const office = await deskPage(browser, h, 1440, b.office.cookie)
    contexts.push(office)
    const outbound = () => [h.mails.length, h.email.sent.length, h.twilio.calls.length, h.stripePayments.calls.length, h.quickbooks.calls.length, h.models.calls.length, h.marketing.length, h.pushes.sent.length]
    const outboundBefore = outbound()
    const ownerId = (await h.state()).actor.id
    const open = async (page: Page) => {
      await page.goto(`${origin}/app#rules`)
      // Settle the hash route before testing its persistence across a reload.
      await expect(page.getByRole('heading', { name: 'Rules', exact: true })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('heading', { name: 'Rules', exact: true })).toBeVisible()
    }
    const row = (page: Page, name: string) => page.getByRole('region', { name: 'Your rules' }).getByRole('listitem', { name, exact: true })
    const make = async (page: Page, name: string, to: string, message: string) => {
      await open(page)
      const form = page.getByRole('form', { name: 'New rule', exact: true })
      await form.getByLabel('Rule name', { exact: true }).fill(name)
      await form.getByLabel('When', { exact: true }).selectOption('enquiry.created')
      await form.getByLabel('Only from source (optional)', { exact: true }).fill('website')
      await form.getByLabel('Notice for', { exact: true }).selectOption(to)
      await form.getByLabel('Notice', { exact: true }).fill(message)
      return action(page, form.getByRole('button', { name: 'Save rule', exact: true }))
    }
    const edit = async (page: Page, name: string, to: string, message: string) => {
      await open(page)
      await row(page, name).getByRole('button', { name: 'Edit rule', exact: true }).click()
      const form = page.getByRole('form', { name: `Edit ${name}`, exact: true })
      await form.getByLabel('Notice for', { exact: true }).selectOption(to)
      await form.getByLabel('Notice', { exact: true }).fill(message)
      return action(page, form.getByRole('button', { name: 'Save changes', exact: true }))
    }
    const request = async (description: string) => {
      await owner.page.goto(`${origin}/app#quotes`)
      const form = owner.page.locator('form').filter({ has: owner.page.getByRole('heading', { name: 'Record a request', exact: true }) })
      await form.getByLabel('Customer', { exact: true }).selectOption(b.customer.id)
      await form.getByLabel('Site', { exact: true }).selectOption(b.site.id)
      await form.getByLabel('Source', { exact: true }).selectOption('website')
      await form.getByLabel('What the customer needs', { exact: true }).fill(description)
      return action(owner.page, form.getByRole('button', { name: 'Record request', exact: true }))
    }
    const proof = async (name: string, anchor: ReturnType<Page['locator']>) => {
      await phoneScreen(owner.page, 1440, `rules-${name}`, anchor)
      if (process.env.GLOVE_SCREENSHOTS) {
        await owner.page.setViewportSize({ width: 390, height: 1050 })
        await anchor.scrollIntoViewIfNeeded()
        const { mkdir } = await import('node:fs/promises'), { join } = await import('node:path')
        await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
        await owner.page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `390-desk-rules-${name}.png`) })
        await owner.page.setViewportSize({ width: 1440, height: 1050 })
      }
    }
    const inspect = async (name: string, version: number, source: any, by: string, outcome: string, reason: string, audience: string, message: string) => {
      const log = owner.page.getByRole('region', { name: 'Run log' }).getByRole('listitem', { name: `${name} version ${version}`, exact: true })
      await expect(log).toContainText(`${name} (version ${version})`)
      await expect(log).toContainText(by)
      await expect(log.getByText(outcome[0].toUpperCase() + outcome.slice(1), { exact: true })).toBeVisible()
      await expect(log).toContainText(reason)
      await expect(log).toContainText(`Configured notice for ${audience}: ${message}`)
      await log.getByText(`Inspect request ${source.id}`, { exact: true }).click()
      await expect(log.getByText(source.description, { exact: true })).toBeVisible()
      await expect(log.getByRole('link', { name: 'Harbourview Dental', exact: true })).toHaveAttribute('href', `#customers/${b.customer.id}`)
      await expect(log.getByText('14 Harbour St, Balmain NSW 2041', { exact: true })).toBeVisible()
      await expect(log.getByText('website', { exact: true })).toBeVisible()
    }
    let own = await make(owner.page, 'Owner intake', 'owner', 'Owner checks the request')
    let officeRule = await make(office.page, 'Office intake', 'dispatcher', 'Dispatch checks the request')
    expect([own.version, own.createdBy.id, own.createdBy.role]).toEqual([1, ownerId, 'owner'])
    expect([officeRule.version, officeRule.createdBy.id, officeRule.createdBy.role]).toEqual([1, b.office.id, 'office'])
    await expect(row(office.page, 'Owner intake').getByRole('button')).toHaveCount(0)
    const first = await request('First source: replace the upstairs filter')
    await open(owner.page)
    await inspect('Owner intake', 1, first, 'By Olivia Owner (owner); created by Olivia Owner (owner)', 'done', 'notice to owner', 'owner', 'Owner checks the request')
    await inspect('Office intake', 1, first, 'By Olu Office (office); created by Olu Office (office)', 'done', 'notice to dispatcher', 'dispatcher', 'Dispatch checks the request')
    await expect(owner.page.getByRole('region', { name: 'Rule notices' })).toContainText('Owner intake: Owner checks the request')
    await expect(owner.page.getByRole('region', { name: 'Rule notices' })).not.toContainText('Dispatch checks the request')
    officeRule = await edit(office.page, 'Office intake', 'office', 'Office prepares the request')
    expect(officeRule.version).toBe(2)
    own = await edit(owner.page, 'Owner intake', 'dispatcher', 'Owner asks Dispatch to inspect')
    expect(own.version).toBe(2)
    const second = await request('Second source: inspect the downstairs coil')
    await open(owner.page)
    await inspect('Office intake', 2, second, 'By Olu Office (office); created by Olu Office (office)', 'done', 'notice to office', 'office', 'Office prepares the request')
    await inspect('Owner intake', 2, second, 'By Olivia Owner (owner); created by Olivia Owner (owner)', 'done', 'notice to dispatcher', 'dispatcher', 'Owner asks Dispatch to inspect')
    await open(office.page)
    const officeNotices = office.page.getByRole('region', { name: 'Rule notices' })
    await expect(officeNotices).toContainText('Office intake: Office prepares the request')
    await expect(officeNotices).not.toContainText('Owner checks the request')
    await expect(officeNotices).not.toContainText('Dispatch checks the request')
    officeRule = await edit(owner.page, 'Office intake', 'office', 'Owner reviewed office instructions')
    expect([officeRule.version, officeRule.createdBy.id]).toEqual([3, b.office.id])
    await open(office.page)
    const disabledOffice = await action(office.page, row(office.page, 'Office intake').getByRole('button', { name: 'Turn off', exact: true }))
    expect([disabledOffice.version, disabledOffice.enabled]).toEqual([4, false])
    await open(owner.page)
    const disabledOwner = await action(owner.page, row(owner.page, 'Owner intake').getByRole('button', { name: 'Turn off', exact: true }))
    expect([disabledOwner.version, disabledOwner.enabled]).toEqual([3, false])
    await request('Disabled rules must not notify')
    expect((await h.state()).ruleRuns).toHaveLength(4)
    await open(office.page)
    officeRule = await action(office.page, row(office.page, 'Office intake').getByRole('button', { name: 'Turn on', exact: true }))
    expect(officeRule.version).toBe(5)
    await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
    const refused = await request('Downgraded creator must not notify')
    const beforeRestart = await h.request('/api/glove/export').then((r: Response) => r.json())
    expect(beforeRestart.ruleRuns).toHaveLength(5)
    expect(beforeRestart.notices).toHaveLength(4)
    await h.restart()
    await open(owner.page)
    await inspect('Office intake', 5, refused, 'By Olu Office (viewer); created by Olu Office (office)', 'not allowed', 'Olu Office no longer holds a desk role', 'office', 'Owner reviewed office instructions')
    await inspect('Owner intake', 1, first, 'By Olivia Owner (owner); created by Olivia Owner (owner)', 'done', 'notice to owner', 'owner', 'Owner checks the request')
    await inspect('Office intake', 2, second, 'By Olu Office (office); created by Olu Office (office)', 'done', 'notice to office', 'office', 'Office prepares the request')
    await expect(row(owner.page, 'Owner intake')).toContainText('Off')
    await expect(owner.page.getByRole('listitem', { name: 'Owner intake version 1', exact: true })).toContainText('Owner checks the request')
    await expect(owner.page.getByRole('listitem', { name: 'Office intake version 1', exact: true })).toContainText('Dispatch checks the request')
    await proof('retained-log', owner.page.getByRole('region', { name: 'Run log' }))
    await open(office.page)
    await expect(office.page.getByRole('button', { name: 'Edit rule', exact: true })).toHaveCount(0)
    await expect(office.page.getByRole('form', { name: 'New rule', exact: true })).toHaveCount(0)
    const retained = await h.request('/api/glove/export').then((r: Response) => r.json())
    expect(retained.ruleRuns).toEqual(beforeRestart.ruleRuns)
    expect(retained.notices).toEqual(beforeRestart.notices)
    expect(outbound()).toEqual(outboundBefore)
  } finally {
    for (const { page, context } of contexts) { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
    await h.close()
  }
}

test('The Owner runs the whole phone desk and Office repeats its permitted steps with exact role refusals at 390 and 1440', async ({ browser }) => {
  await test.step('Request notice rules retain exact sources, versions and current authority', () => rulesBrowser(browser))
  await test.step('Owner and Office phone desk', () => phoneDesk(browser))
})
