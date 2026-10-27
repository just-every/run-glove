import { expect, type Browser } from '@playwright/test'
// @ts-expect-error Production HTTP and provider-edge fixtures.
import { voiceFlow } from '../api/voice-flow.mjs'
import { deskPage, phoneScreen, origin } from './desk-fixture'

export async function voiceBrowser(browser: Browser) {
  const cleanup: (() => Promise<void>)[] = []
  try {
    await voiceFlow({ after: (close: () => Promise<void>) => cleanup.push(close) }, async (h: any, b: any) => {
      for (const [label, cookie] of [['owner', undefined], ['office', b.office.cookie]] as const) {
        const { context, page } = await deskPage(browser, h, 1440, cookie)
        try {
          await page.goto(`${origin}/app#customers`)
          await page.getByRole('button', { name: b.customer.name, exact: true }).click()
          const conversation = page.getByRole('region', { name: 'Customer conversation', exact: true })
          if (label === 'owner') {
            await expect(conversation).toContainText('answered, 83 seconds · Not recorded')
            await expect(conversation).toContainText('missed, 0 seconds · Not recorded')
            await expect(conversation.getByText('business phone', { exact: false })).toHaveCount(2)
          } else {
            await expect(conversation).not.toContainText('business phone')
            await expect(conversation).not.toContainText('83 seconds')
          }
          await expect(conversation).toContainText('missed call reply')
          await expect(conversation).toContainText('Delivered, as reported by Twilio')
          for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 1050 })
            await phoneScreen(page, width, `voice-${label}`, conversation)
          }
        } finally { await context.close() }
      }
    })
  } finally { for (const close of cleanup.reverse()) await close() }
}
