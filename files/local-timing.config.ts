import config from '/home/agent/rer-consolidation/work/sx-glove-quote015-cause-1/run-glove/tests/browser/playwright.config'
export default {
  ...config,
  testDir: '/home/agent/rer-consolidation/work/sx-glove-quote015-cause-1/run-glove/tests/browser',
  timeout: 600_000,
  expect: { timeout: 30_000 },
}
