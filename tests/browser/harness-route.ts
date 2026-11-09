import type { BrowserContext, Page, Route } from '@playwright/test'

export type HarnessRoute = Route
type Target = Page | BrowserContext
type Handler = (route: Route) => Promise<void>
type Pattern = Parameters<Page['route']>[0]
type Registration = { pattern: Pattern; handler: Handler; stop(): Promise<void>; pause(): Promise<() => void> }
const registrations = new WeakMap<Target, Registration[]>()
const live = new Set<Registration>()

// Keep the actual browser request, response URL, abort semantics and Worker
// answer intact. A Playwright interceptor may continue an outstanding route
// when removed: draining after removal is too late for an async Worker reply.
export async function harnessRoute(target: Target, pattern: Pattern, handler: Handler) {
  const active = new Set<Promise<void>>(), pending = new Set<Promise<void>>()
  const failures: unknown[] = []
  let closing = false, paused = false, resume = () => {}
  let resumed = Promise.resolve()
  const dispatch = (route: Route) => {
    const invocation = (async () => {
      while (paused && !closing) await resumed
      if (closing) { await route.abort('aborted'); return }
      const reply = handler(route)
      active.add(reply)
      try { await reply } finally { active.delete(reply) }
    })()
    pending.add(invocation)
    // Return the rejection to Playwright and retain it for cleanup as well;
    // no handler/fulfilment errors are suppressed, including cancelled pages.
    return invocation.catch(error => { failures.push(error); throw error }).finally(() => pending.delete(invocation))
  }
  await target.route(pattern, dispatch)
  const owned = registrations.get(target) ?? []
  const registration: Registration = { pattern, handler, async pause() {
    paused = true
    resumed = new Promise<void>(resolve => { resume = () => { paused = false; resolve() } })
    await Promise.allSettled([...active])
    return resume
  }, async stop() {
    // Close admission before draining. Callbacks already on their way from
    // Chromium abort immediately instead of starting another Worker request
    // between a snapshot of active handlers and interceptor removal.
    closing = true; resume()
    while (pending.size) await Promise.allSettled([...pending])
    try { if (!target.isClosed()) await target.unroute(pattern, dispatch) } finally { live.delete(registration) }
    if (failures.length) throw failures[0]
  } }
  owned.push(registration); live.add(registration)
  registrations.set(target, owned)
}

export async function unrouteHarness(target: Target, pattern?: Pattern, handler?: Handler) {
  const owned = registrations.get(target) ?? []
  const selected = owned.filter(route => pattern === undefined || (route.pattern === pattern && (!handler || route.handler === handler)))
  registrations.set(target, owned.filter(route => !selected.includes(route)))
  // Finish every owner's cleanup even when one failed. Page and context routes
  // are separate owners, and both must drain before closing their Worker.
  const results = await Promise.allSettled(selected.map(route => route.stop()))
  if (pattern === undefined && !target.isClosed()) await target.unrouteAll({ behavior: 'wait' })
  const failure = results.find(result => result.status === 'rejected')
  if (failure?.status === 'rejected') throw failure.reason
}

export async function closeHarnessContext(context: BrowserContext) {
  try {
    const results = await Promise.allSettled([...context.pages().map(page => unrouteHarness(page)), unrouteHarness(context)])
    const failure = results.find(result => result.status === 'rejected')
    if (failure?.status === 'rejected') throw failure.reason
  } finally { await context.close() }
}

// New reads wait on the same route while the actual Worker restarts. Existing
// replies (including response bodies and route.fulfill) finish before disposal.
// Serial browser specs can have several live pages/roles for one installation.
export async function restartHarness(h: { restart(): Promise<void> }) {
  const resumes: (() => void)[] = []
  try {
    for (const route of live) resumes.push(await route.pause())
    await h.restart()
  } finally { for (const resume of resumes) resume() }
}

async function initialReadReady(page: Page) {
  if (new URL(page.url()).pathname !== '/app') return
  // The document load event does not wait for the app's initial Worker read.
  // Match the navigation deadline, then let each journey assert its business
  // outcome. Offline/error screens count as settled, never as successful data.
  await page.waitForFunction(() => location.pathname !== '/app'
    || !!document.querySelector('.glove-app:not(.loading), .tech-app, .glove-app.loading button'), undefined, { timeout: 30_000 })
}

export async function gotoHarness(page: Page, ...args: Parameters<Page['goto']>) {
  const response = await page.goto(...args)
  // Owner entry deliberately precedes attachment in some journeys. Preserve
  // that handoff so its first app read belongs to the installation under test.
  if (args[0] !== process.env.GLOVE_OPEN && !new URL(args[0], page.url()).hash.startsWith('#rer-dev')) await initialReadReady(page)
  return response
}

export async function reloadHarness(page: Page, ...args: Parameters<Page['reload']>) {
  const response = await page.reload(...args)
  await initialReadReady(page)
  return response
}
