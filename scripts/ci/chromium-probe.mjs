import { chromium } from '@playwright/test'

const browser = await chromium.launch({
  headless: true,
  // Keep local Mac checks away from the login keychain.
  ...(process.platform === 'darwin' ? { args: ['--use-mock-keychain', '--password-store=basic'] } : {}),
})
await browser.close()
