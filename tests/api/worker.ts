export { MailRejections } from '../../src/glove/mail-rejections'
import { runBackground } from '../../src/glove/background'
import { gloveResponse } from '../../src/glove/api'
import { authResponse } from '../../src/auth.server'
import { scheduled as morningScheduled } from '../../src/glove/morning-email'
import { metered, type Tally } from './d1-meter'

// A test-only clock controls time at the runtime boundary; production code
// still uses ordinary Date and every assertion uses its real HTTP doors.
const SystemDate = Date
let testNow: number | null = null
let pauseQboCompletion = false
// POST /__test/meter {on} starts or stops counting rows read; GET reads the tally.
const tally: Tally = { on: false, rows: 0, statements: 0 }
const counting = (env: any) => tally.on ? { ...env, DB: metered(env.DB, tally) } : env
globalThis.Date = new Proxy(SystemDate, {
  construct(target, args) { return Reflect.construct(target, args.length ? args : [testNow ?? SystemDate.now()]) },
  get(target, property) { return property === 'now' ? () => testNow ?? SystemDate.now() : Reflect.get(target, property) },
})
// The production Glove and auth doors, without the TanStack document layer.
export default {
  async fetch(request: Request, env: any) {
    if (new URL(request.url).pathname === '/__test/qbo-completion') {
      pauseQboCompletion = true
      return Response.json({ ok: true })
    }
    if (new URL(request.url).pathname === '/__test/clock') {
      const value = await request.json() as { at: string | null }
      testNow = value.at === null ? null : new SystemDate(value.at).getTime()
      return Response.json({ ok: true })
    }
    if (new URL(request.url).pathname === '/__test/meter') {
      if (request.method === 'POST') { const value = await request.json() as { on: boolean }; Object.assign(tally, { on: value.on, rows: 0, statements: 0 }) }
      return Response.json({ rows: tally.rows, statements: tally.statements })
    }
    env = counting(env)
    // Pause only after the real D1 write, so a restart retains the provider
    // fact while interrupting the later invoice and command-outcome commit.
    if (pauseQboCompletion) {
      const db = env.DB
      env = { ...env, DB: new Proxy(db, { get(target, key) {
        if (key === 'prepare') return (sql: string) => {
          const statement = target.prepare(sql)
          if (!sql.startsWith('UPDATE glove_qbo_operations SET phase=?')) return statement
          return { bind(...values: any[]) {
            const bound = statement.bind(...values)
            return { async run() {
              const result = await bound.run()
              if (values[0] === 'complete') {
                pauseQboCompletion = false
                await fetch('https://worker-checkpoint.example.test/qbo-complete')
              }
              return result
            } }
          } }
        }
        const value = Reflect.get(target, key)
        return typeof value === 'function' ? value.bind(target) : value
      } }) }
    }
    // Miniflare names its own listener as Host; the edge names the host the
    // request's URL addresses, so the doors see that Host as in production.
    const headers = new Headers(request.headers)
    headers.set('host', new URL(request.url).host)
    request = new Request(request, { headers })
    return (await gloveResponse(request, env)) ?? (await authResponse(request, env)) ?? new Response('Not found', { status: 404 })
  },
  scheduled(controller: { scheduledTime: number }, env: any, execution: { waitUntil(p: Promise<unknown>): void }) {
    env = counting(env)
    morningScheduled(controller, env, execution)
    execution.waitUntil(runBackground(env, new Date(controller.scheduledTime).toISOString()))
  },
}
