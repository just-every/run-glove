import { mapsEdge } from './maps.mjs'

// Installed only in the portability journey's owned scratch Worker. Native
// commands, authentication, scheduled handling and archive policy are intact.
export function portableMaps(worker) {
  const upstream = globalThis.fetch, edge = mapsEdge()
  globalThis.fetch = async (input, options) => await edge.answer(new Request(input, options)) ?? upstream(input, options)
  return { ...worker, async fetch(request, env, context) {
    if (new URL(request.url).pathname === '/__portable/maps') {
      if (request.method === 'POST') {
        const { places, scheduledAt } = await request.json()
        for (const [address, location] of places ?? []) edge.places.set(address, location)
        if (scheduledAt) {
          const work = []
          worker.scheduled({ scheduledTime: Date.parse(scheduledAt) }, env, { waitUntil(promise) { work.push(promise) } })
          await Promise.all(work)
        }
      }
      return Response.json({ calls: edge.calls.map(({ key: _key, ...call }) => call) })
    }
    return worker.fetch(request, env, context)
  } }
}
