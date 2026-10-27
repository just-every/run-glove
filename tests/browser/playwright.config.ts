import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  // The mock keychain and basic password store keep headless Chromium away from the macOS login keychain.
  use: { headless: true, trace: 'off', video: 'off', screenshot: 'off', launchOptions: { ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), args: ['--use-mock-keychain', '--password-store=basic', '--no-sandbox'] } },
  reporter: [['list']],
  outputDir: process.env.GLOVE_BROWSER_OUTPUT || '/tmp/glove-browser-results',
})
