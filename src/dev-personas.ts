import { env } from 'cloudflare:workers'
import type { DevPersona } from './modules/operator-auth/dev/index.mjs'

// Local dev personas: real operators at <as>@dev.localhost, created only by
// local dev sign-in and suspended in exports. Only src/server.dev.ts uses them.
// Under `rer demo` none are offered: Pacheco Plumbing & HVAC's own technicians
// sign in as themselves instead (src/demo.ts).
export function devPersonas(): DevPersona[] {
 if ((env as { RER_DEMO?: string }).RER_DEMO === '1') return []
 return [
  { as: 'admin', role: 'admin', displayName: 'Dev admin' },
  { as: 'member', role: 'member', displayName: 'Dev member' },
 ]
}
