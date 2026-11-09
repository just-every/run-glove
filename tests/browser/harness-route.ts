import { createServer, type Server } from 'node:http'
import type { BrowserContext, Page, Request, Route } from '@playwright/test'

// A Playwright route is a single-use interception, not a transport socket.
// Hand it back to Chromium before awaiting the Worker. In particular, removing
// an interceptor can continue its outstanding routes (Playwright 1.63), making
// a later route.fulfill invalid. Delayed replies now belong to an HTTP response.
export type HarnessRoute = {
  request(): Pick<Request, 'url' | 'method' | 'postData' | 'postDataJSON' | 'headers'>
  fulfill(options: { status?: number; headers?: Record<string, string>; contentType?: string; body?: string | Buffer }): Promise<void>
  abort(errorCode?: string): Promise<void>
}
type Target = Page | BrowserContext
type Handler = (route: HarnessRoute) => Promise<void>
type Pattern = Parameters<Page['route']>[0]
type Ticket = { request: Request; started: boolean; done: Promise<void>; finish(): void }
type Registration = { pattern: Pattern; handler: Handler; stop(): Promise<void>; pause(): Promise<() => void> }
const registrations = new WeakMap<Target, Registration[]>()
const live = new Set<Registration>()

export async function harnessRoute(target: Target, pattern: Pattern, handler: Handler) {
  const tickets = new Map<string, Ticket>(), pending = new Set<Promise<void>>(), failures: unknown[] = []
  let next = 0, stopping = false, paused = false
  let resumed: Promise<void> = Promise.resolve()
  const active = new Set<Promise<void>>()
  const server: Server = createServer((incoming, outgoing) => {
    const id = new URL(incoming.url!, 'http://localhost').searchParams.get('ticket')!
    const ticket = tickets.get(id)
    if (!ticket) { outgoing.destroy(); return } // Chromium cancelled before delivery.
    ticket.started = true
    const task = (async () => {
      const chunks: Buffer[] = []
      for await (const chunk of incoming) chunks.push(Buffer.from(chunk))
      const bytes = Buffer.concat(chunks), request = ticket.request
      let answered = false
      const answer = () => {
        if (answered) throw new Error('Harness request answered twice')
        answered = true
      }
      while (paused) await resumed
      const reply = handler({
        request: () => ({
          url: () => request.url(), method: () => incoming.method!,
          postData: () => bytes.length ? bytes.toString() : null,
          postDataJSON: () => bytes.length ? JSON.parse(bytes.toString()) : null,
          headers: () => request.headers(),
        }),
        async fulfill({ status = 200, headers = {}, contentType, body = '' }) {
          answer()
          // A navigation/closed tab may have dropped this socket. The real
          // Worker still finishes and is drained before restart/teardown;
          // there is no Playwright route left to answer a second time.
          if (outgoing.destroyed) return
          const result = Buffer.isBuffer(body) ? body : Buffer.from(body)
          const responseHeaders = { ...headers }
          delete responseHeaders['transfer-encoding']; delete responseHeaders.connection
          responseHeaders['content-length'] = String(result.length)
          if (contentType) responseHeaders['content-type'] = contentType
          outgoing.writeHead(status, responseHeaders); outgoing.end(result)
        },
        async abort() { answer(); outgoing.destroy() },
      })
      active.add(reply)
      try { await reply } finally { active.delete(reply) }
      if (!answered) throw new Error('Harness handler returned without answering its request')
    })().catch(error => { failures.push(error); outgoing.destroy() }).finally(() => {
      tickets.delete(id); ticket.finish(); pending.delete(task)
    })
    pending.add(task)
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject); server.listen(0, '127.0.0.1', resolve)
  })
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  const failed = (request: Request) => {
    for (const [id, ticket] of tickets) {
      if (ticket.request === request && !ticket.started) { tickets.delete(id); ticket.finish() }
    }
  }
  target.on('requestfailed', failed)
  const dispatch = async (route: Route) => {
    if (stopping) { await route.abort('aborted'); return }
    const id = String(++next)
    let finish!: () => void
    const done = new Promise<void>(resolve => { finish = resolve })
    tickets.set(id, { request: route.request(), started: false, done, finish })
    try {
      // The only terminal Playwright operation; no Worker await precedes it.
      await route.continue({ url: `${origin}/?ticket=${id}` })
    } catch (error) {
      tickets.delete(id); finish(); throw error
    }
  }
  try { await target.route(pattern, dispatch) } catch (error) {
    target.off('requestfailed', failed)
    await new Promise<void>(resolve => server.close(() => resolve()))
    throw error
  }
  const owned = registrations.get(target) ?? []
  const registration: Registration = { pattern, handler, async pause() {
    let resume!: () => void
    paused = true
    resumed = new Promise<void>(resolve => { resume = () => { paused = false; resolve() } })
    await Promise.allSettled([...active])
    return resume
  }, async stop() {
    stopping = true
    // Remove admission first; each already-continued HTTP request retains a
    // ticket until delivered or failed. A snapshot of callbacks alone misses
    // requests between Chromium's continue and the server's request event.
    // Teardown must still drain and close the server if the target itself
    // failed/closed. Preserve that error instead of masking it with cleanup.
    try { await target.unroute(pattern, dispatch) } catch (error) { failures.push(error) }
    while (tickets.size) await Promise.all([...tickets.values()].map(ticket => ticket.done))
    while (pending.size) await Promise.all([...pending])
    target.off('requestfailed', failed)
    const closed = new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    server.closeIdleConnections()
    await closed
    live.delete(registration)
    if (failures.length) throw failures[0]
  } }
  owned.push(registration); live.add(registration)
  registrations.set(target, owned)
}

export async function unrouteHarness(target: Target, pattern?: Pattern, handler?: Handler) {
  const owned = registrations.get(target) ?? []
  const selected = owned.filter(route => pattern === undefined || (route.pattern === pattern && (!handler || route.handler === handler)))
  registrations.set(target, owned.filter(route => !selected.includes(route)))
  // Drain all registrations even if one handler has failed; never let one
  // cleanup error leave another Worker request running after h.close().
  const results = await Promise.allSettled(selected.map(route => route.stop()))
  if (pattern === undefined) await target.unrouteAll({ behavior: 'wait' })
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

// Stop new Worker dispatches while every existing reply/body finishes. Requests
// arriving during restart retain their HTTP socket and resume on the new Worker.
// Browser specs run serially; pausing all live proxies also covers multi-page
// and multi-role journeys without depending on which page issued the read.
export async function restartHarness(h: { restart(): Promise<void> }) {
  const resumes: (() => void)[] = []
  try {
    for (const route of live) resumes.push(await route.pause())
    await h.restart()
  } finally { for (const resume of resumes) resume() }
}
