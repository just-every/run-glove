import { gloveResponse } from '../../src/glove/api'
import { authResponse } from '../../src/auth.server'
import { scheduled } from '../../src/glove/morning-email'

// A test-only clock controls time at the runtime boundary; production code
// still uses ordinary Date and every assertion uses its real HTTP doors.
const SystemDate = Date
let testNow: number | null = null
globalThis.Date = new Proxy(SystemDate, {
  construct(target, args) { return Reflect.construct(target, args.length ? args : [testNow ?? SystemDate.now()]) },
  get(target, property) { return property === 'now' ? () => testNow ?? SystemDate.now() : Reflect.get(target, property) },
})
// The production Glove and auth doors, without the TanStack document layer.
export default {
  async fetch(request: Request, env: any) {
    if (new URL(request.url).pathname === '/__test/clock') {
      const value = await request.json() as { at: string | null }
      testNow = value.at === null ? null : new SystemDate(value.at).getTime()
      return Response.json({ ok: true })
    }
    return (await gloveResponse(request, env)) ?? (await authResponse(request, env)) ?? new Response('Not found', { status: 404 })
  },
  scheduled,
}
