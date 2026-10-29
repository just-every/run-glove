export { MailRejections } from './glove/mail-rejections'
import { runBackground } from './glove/background'
import { withDemo } from './modules/demo/index.mjs'
import { seedDemo } from './demo'
import start from '@tanstack/react-start/server-entry'
import { Hono } from 'hono'
import { dispatch } from './base/dispatch'
import { staticAssetResponse } from './base/static-assets'
import { deploymentHealth } from './base/deployment-health'
import { lobbyResponse } from './base/lobby'
import { setupStateResponse } from './base/setup-state'
import { authResponse, runtimeBindings, type Bindings } from './auth.server'
import { identity } from './identity'
import { gloveAgentDoor, gloveBusinessSettings } from './glove/agent-door'
import { gloveResponse } from './glove/api'
import { scheduled as morningScheduled } from './glove/morning-email'

const api = new Hono<{ Bindings: Bindings }>()
api.get('/health', (context) => context.json({ status: 'ok', ...deploymentHealth(context.env) }))

// Start documents keep their own cache policy and add no-transform, so no proxy
// rewrites the HTML React hydrates (Cloudflare's email address obfuscation
// honours it; src/base/hydration/README.md).
function noTransform(response: Response): Response {
  const headers = new Headers(response.headers), policy = headers.get('cache-control')
  headers.set('cache-control', policy ? `${policy}, no-transform` : 'no-transform')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export default withDemo({
  async fetch(request, env, execution) {
    const settings = await gloveBusinessSettings(env).handle(request)
    if (settings) return settings
    const agent = await gloveAgentDoor(env).handle(request)
    if (agent) return agent
    const asset = await staticAssetResponse(request, env)
    if (asset) return asset
    const glove = await gloveResponse(request, env)
    if (glove) return glove
    const auth = await authResponse(request, env)
    if (auth) return auth
    // The installed variant: the Lobby at / and the public claim state it reads.
    // Local dev serves the saved origin's data at its own port (RER_DEV_ORIGIN).
    const state = await setupStateResponse(request, runtimeBindings(env))
    if (state) return state
    const lobby = await lobbyResponse(request, runtimeBindings(env), identity)
    if (lobby) return lobby
    return dispatch(request, () => api.fetch(request, env, execution), async () => noTransform(await start.fetch(request)))
  },
  scheduled(controller: { scheduledTime: number }, env: Bindings, execution: { waitUntil(p: Promise<unknown>): void }) {
    morningScheduled(controller, env, execution)
    execution.waitUntil(runBackground(env, new Date(controller.scheduledTime).toISOString()))
  },
} satisfies ExportedHandler<Bindings>, { seed: seedDemo })
