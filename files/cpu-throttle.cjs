const { chromium } = require('/workspace/run-glove/node_modules/@playwright/test')
const { appendFileSync } = require('node:fs')
const originalLaunch = chromium.launch.bind(chromium)
chromium.launch = async function (...args) {
  const browser = await originalLaunch(...args)
  const originalNewContext = browser.newContext.bind(browser)
  browser.newContext = async function (...options) {
    const context = await originalNewContext(...options)
    const originalNewPage = context.newPage.bind(context)
    context.newPage = async function (...pageOptions) {
      const page = await originalNewPage(...pageOptions)
      const session = await context.newCDPSession(page)
      await session.send('Emulation.setCPUThrottlingRate', { rate: 6 })
      const receipt = { method: 'Emulation.setCPUThrottlingRate', rate: 6,
        viewport: page.viewportSize(), appliedBeforeReturningPage: true }
      console.log('CPU_THROTTLE ' + JSON.stringify(receipt))
      if (process.env.SX_CPU_RECEIPT) appendFileSync(process.env.SX_CPU_RECEIPT, JSON.stringify(receipt) + '\n')
      return page
    }
    return context
  }
  return browser
}
