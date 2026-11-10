import type { BrowserContext, Page, Request, Response, Route } from '@playwright/test'

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
  // A fixture attached after native owner entry must start a new document.
  // Otherwise the native installation's initial state read can finish after
  // the fixture read and overwrite it in the same app. Existing proxy owners
  // identify deliberate overrides; those retain the current document.
  const pages = 'pages' in target ? target.pages() : [target]
  for (const page of pages) {
    if (new URL(page.url()).pathname === '/app'
      && !registrations.get(page)?.length && !registrations.get(page.context())?.length) {
      await page.goto('about:blank')
    }
  }
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

const navigationEvents = new WeakMap<Page, string[]>()
function observeNavigation(page: Page) {
  const events: string[] = []
  navigationEvents.set(page, events)
  const note = (event: string) => { events.push(event); if (events.length > 30) events.shift() }
  const path = (url: string) => { const parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.pathname : parsed.protocol }
  const response = (response: Response) => { if (response.status() >= 400 || path(response.url()) === '/api/glove/state') note(`response ${response.status()} ${path(response.url())}`) }
  const finished = (request: Request) => { if (path(request.url()) === '/api/glove/state') note(`finished ${path(request.url())}`) }
  const failed = (request: Request) => note(`failed ${path(request.url())} ${request.failure()?.errorText}`)
  const error = (error: Error) => note(`pageerror ${error.name}: ${error.message.replace(/https?:\/\/[^\s]+/g, '[URL]').slice(0, 240)}`)
  page.on('response', response); page.on('requestfinished', finished); page.on('requestfailed', failed); page.on('pageerror', error)
  return () => { page.off('response', response); page.off('requestfinished', finished); page.off('requestfailed', failed); page.off('pageerror', error) }
}

async function initialReadReady(page: Page) {
  if (new URL(page.url()).pathname !== '/app') return
  // The document load event does not wait for the app's initial Worker read.
  // Match the navigation deadline, then let each journey assert its business
  // outcome. Offline/error screens count as settled, never as successful data.
  try {
    await page.locator('.glove-app:not(.loading), .tech-app, .glove-app.loading button').first().waitFor({ state: 'attached', timeout: 30_000 })
  } catch (error) {
    const observation = await page.evaluate(() => ({ pathname: location.pathname, readyState: document.readyState, title: document.title, app: document.querySelector('.glove-app, .tech-app')?.className ?? null, busy: document.querySelector('.glove-app')?.getAttribute('aria-busy'), elements: document.querySelectorAll('*').length })).catch(() => ({ unavailable: true }))
    console.error('Harness navigation did not settle:', JSON.stringify({ document: observation, events: navigationEvents.get(page) ?? [] }))
    throw error
  }
}

export async function gotoHarness(page: Page, ...args: Parameters<Page['goto']>) {
  const stop = observeNavigation(page)
  try {
    const response = await page.goto(...args)
    // Preserve the private owner entry's original attachment handoff.
    if ((!response || response.status() < 400) && args[0] !== process.env.GLOVE_OPEN && !new URL(args[0], page.url()).hash.startsWith('#rer-dev')) await initialReadReady(page)
    return response
  } finally { stop() }
}

export async function reloadHarness(page: Page, ...args: Parameters<Page['reload']>) {
  const stop = observeNavigation(page)
  try {
    const response = await page.reload(...args)
    if (!response || response.status() < 400) await initialReadReady(page)
    return response
  } finally { stop() }
}

// Setup's submit action and its resulting document navigation have distinct
// existing deadlines. Do not charge a cold app document to the action timeout.
export async function finishHarnessSetup(page: Page, options: Parameters<ReturnType<Page['getByRole']>['click']>[0] = {}) {
  await page.getByRole('button', { name: 'Finish setup', exact: true }).click({ ...options, noWaitAfter: true })
  // Keep an explicit setup timeout (the fresh-owner journey supplies 60 s).
  await page.waitForURL(url => url.pathname === '/app', { timeout: options?.timeout })
  await initialReadReady(page)
}
