import { test, expect, type Page, type Locator } from '@playwright/test'
// @ts-expect-error Production Worker doors, native sessions and persistent D1.
import { installation } from '../api/harness.mjs'
import { action, deskPage, origin, phoneScreen } from './desk-fixture'

test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })

async function screens(page: Page, name: string, anchor: Locator) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    await phoneScreen(page, width, `custom-role-${name}`, anchor)
  }
  await page.setViewportSize({ width: 1440, height: 1050 })
}

test('TEAM-001 Owner builds and assigns a narrow CSR role, then withdraws its existing session permission', async ({ browser }) => {
  const createdAt = '2026-10-20T14:00:00.000Z', assignedAt = '2026-10-20T14:01:00.000Z'
  const contactedAt = '2026-10-20T14:02:00.000Z', withdrawnAt = '2026-10-20T14:03:00.000Z'
  const h = await installation({ at: createdAt })
  const contexts: Awaited<ReturnType<typeof deskPage>>[] = []
  try {
    await h.command('business.save', { name: 'synthetic-glove-100', currency: 'USD', timezone: 'America/Chicago', paymentTermsDays: 14 })
    const customer = await h.command('customer.save', { name: 'synthetic-glove-101' })
    const request = await h.command('enquiry.create', { customerId: customer.id, description: 'synthetic-glove-102', source: 'phone' })
    // This native person and session already exist when the Owner opens Team.
    // Only fixture authentication mail reaches the existing provider fake.
    const person = await h.person('synthetic-glove-103')
    const owner = (await h.state()).actor
    expect(owner.name).toBe('Olivia Owner')
    expect(owner.role).toBe('owner')
    expect((await person.state()).actor.commands).toEqual([])
    const fixtureMailCount = h.mails.length
    const ownerDesk = await deskPage(browser, h, 1440), csrDesk = await deskPage(browser, h, 1440, person.cookie)
    contexts.push(ownerDesk, csrDesk)
    const page = ownerDesk.page, csr = csrDesk.page
    const sends: { commandId: string; type: string; payload: any }[] = []
    page.on('request', r => { if (r.url() === `${origin}/api/glove/commands` && r.method() === 'POST') sends.push(r.postDataJSON()) })
    await page.goto(`${origin}/app#team`)
    const roles = page.locator('section.panel').filter({ has: page.getByRole('heading', { name: 'Custom roles', exact: true }) })
    await roles.getByLabel('Role name', { exact: true }).fill('Narrow CSR')
    await roles.getByRole('checkbox', { name: 'enquiry.contact', exact: true }).check()
    const role = await action(page, roles.getByRole('button', { name: 'Add role', exact: true }))
    // Independent saved-role and assignment assertions: neither is inferred
    // from a selected option or the other command's response.
    expect(sends[0].type).toBe('role.save')
    expect(sends[0].payload).toEqual({ name: 'Narrow CSR', permissions: ['enquiry.contact'] })
    expect(role.permissions).toEqual(['enquiry.contact'])
    expect((await h.state()).roles).toEqual([expect.objectContaining({ id: role.id, name: 'Narrow CSR', permissions: ['enquiry.contact'], version: 1 })])
    expect((await person.state()).actor.role).toBe('viewer')
    expect((await person.state()).actor.commands).toEqual([])

    await h.setTime(assignedAt)
    const assignment = page.getByLabel(`Role for ${person.name}`, { exact: true })
    const assigned = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
    await assignment.selectOption(`custom:${role.id}`)
    expect((await (await assigned).json()).result).toEqual({ operatorId: person.id, role: `custom:${role.id}` })
    await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
    expect(sends[1].type).toBe('role.set')
    expect(sends[1].payload).toEqual({ operatorId: person.id, role: `custom:${role.id}` })
    await expect(assignment).toHaveValue(`custom:${role.id}`)
    expect((await h.state()).operators.find((o: any) => o.id === person.id).role).toBe(`custom:${role.id}`)
    const effective = (await person.state()).actor
    expect(effective).toMatchObject({ id: person.id, role: `custom:${role.id}`, roleName: 'Narrow CSR', commands: ['enquiry.contact'] })
    expect(effective.commands).not.toContain('role.save')
    expect(effective.commands).not.toContain('role.set')
    await screens(page, 'assigned', assignment)

    await h.setTime(contactedAt)
    await csr.goto(`${origin}/app#quotes`)
    const pipeline = csr.getByRole('region', { name: 'Request pipeline', exact: true })
    await expect(pipeline).toContainText('synthetic-glove-102')
    await expect(pipeline.getByRole('button', { name: 'Lost', exact: true })).toHaveCount(0)
    const contacted = await action(csr, pipeline.getByRole('button', { name: 'Contacted', exact: true }))
    expect(contacted).toMatchObject({ id: request.id, version: 2, status: 'contacted', stageAt: contactedAt,
      contacts: [{ note: '', by: { id: person.id, name: person.name, role: `custom:${role.id}` }, at: contactedAt }] })
    expect((await h.state()).enquiries).toEqual([contacted])
    await csr.reload()
    await expect(pipeline).toContainText('Contacted')
    await screens(csr, 'contacted', pipeline)

    // A valid request and version make this an authority refusal rather than
    // a malformed-input or missing-record refusal. Read all records and the
    // business download, including the timeline, before and after each denial.
    const snapshot = async () => ({ state: await h.state(), exported: await (await h.request('/api/glove/export')).json() })
    const refused = async (type: string, payload: object) => {
      const before = await snapshot()
      const result = await csr.evaluate(async ({ type, payload }) => {
        const response = await fetch('/api/glove/commands', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ commandId: crypto.randomUUID(), type, payload }) })
        return { status: response.status, body: await response.json() }
      }, { type, payload })
      expect(result).toMatchObject({ status: 403, body: { ok: false, error: { code: 'FORBIDDEN' } } })
      expect(await snapshot()).toEqual(before)
    }
    await refused('enquiry.close', { enquiryId: request.id, version: contacted.version, reason: 'synthetic-glove-104' })
    await refused('role.save', { id: role.id, version: role.version, name: role.name, permissions: ['enquiry.contact', 'enquiry.close'] })
    await refused('role.set', { operatorId: person.id, role: 'office' })

    await h.setTime(withdrawnAt)
    await roles.getByRole('button', { name: 'Edit', exact: true }).click()
    await expect(roles.getByLabel('Role name', { exact: true })).toHaveValue('Narrow CSR')
    await roles.getByRole('checkbox', { name: 'enquiry.contact', exact: true }).uncheck()
    const withdrawn = await action(page, roles.getByRole('button', { name: 'Save role', exact: true }))
    expect(sends[2].type).toBe('role.save')
    expect(sends[2].payload).toEqual({ id: role.id, version: 1, name: 'Narrow CSR', permissions: [] })
    expect(withdrawn).toMatchObject({ id: role.id, version: 2, permissions: [] })
    expect((await h.state()).roles).toEqual([withdrawn])
    expect((await h.state()).operators.find((o: any) => o.id === person.id).role).toBe(`custom:${role.id}`)
    const contactAgain = { enquiryId: request.id, version: contacted.version, note: 'synthetic-glove-105' }
    await refused('enquiry.contact', contactAgain)
    await screens(page, 'withdrawn', roles)
    await csr.reload()
    await expect(pipeline).toContainText('synthetic-glove-102')
    await expect(pipeline.getByRole('button', { name: 'Contacted', exact: true })).toHaveCount(0)
    expect((await person.state()).actor.commands).toEqual([])
    await refused('enquiry.contact', contactAgain)
    const retained = await snapshot()
    await h.restart()
    expect(await snapshot()).toEqual(retained)
    await csr.reload()
    await expect(pipeline).toContainText('synthetic-glove-102')
    expect((await person.state()).actor).toMatchObject({ id: person.id, role: `custom:${role.id}`, commands: [] })
    await refused('enquiry.contact', contactAgain)
    await screens(csr, 'refused-after-restart', pipeline)

    const activityResponse = await h.request('/api/glove/activity')
    expect(activityResponse.status).toBe(200)
    const activity = (await activityResponse.json()).events
    const exported = retained.exported
    const expected = [
      { commandId: sends[0].commandId, kind: 'role.saved', subjectId: role.id, at: createdAt, actorId: owner.id, actorName: 'Olivia Owner', actorRole: 'owner' },
      { commandId: sends[1].commandId, kind: 'role.set', subjectId: person.id, at: assignedAt, actorId: owner.id, actorName: 'Olivia Owner', actorRole: 'owner' },
      { kind: 'enquiry.contacted', subjectId: request.id, at: contactedAt, actorId: person.id, actorName: person.name, actorRole: `custom:${role.id}` },
      { commandId: sends[2].commandId, kind: 'role.saved', subjectId: role.id, at: withdrawnAt, actorId: owner.id, actorName: 'Olivia Owner', actorRole: 'owner' },
    ]
    const events = activity.filter((e: any) => e.subjectId === role.id || e.subjectId === person.id || e.kind === 'enquiry.contacted')
    expect(events).toHaveLength(4)
    for (const wanted of expected) {
      const event = events.find((e: any) => e.kind === wanted.kind && e.at === wanted.at)
      expect(event).toMatchObject(wanted)
      expect(exported.timeline.find((e: any) => e.id === event.id)).toMatchObject({ kind: wanted.kind, subject_id: wanted.subjectId, at: wanted.at,
        actor_id: wanted.actorId, actor_name: wanted.actorName, actor_role: wanted.actorRole, command_id: event.commandId })
    }
    expect(h.mails).toHaveLength(fixtureMailCount)
  } finally {
    for (const { page, context } of contexts) { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
    await h.close()
  }
})
