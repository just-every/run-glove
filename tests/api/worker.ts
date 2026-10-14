import { gloveResponse } from '../../src/glove/api'
import { authResponse } from '../../src/auth.server'

// The production Glove and auth doors, without the TanStack document layer.
export default {
  async fetch(request: Request, env: any) {
    return (await gloveResponse(request, env)) ?? (await authResponse(request, env)) ?? new Response('Not found', { status: 404 })
  },
}
