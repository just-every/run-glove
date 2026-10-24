// Only the Google and Microsoft network boundary is faked.
export function calendarEdge() {
  const edge = { calls: [], busy: [], events: new Map(), status: 200, async answer(request) {
    const u = new URL(request.url)
    if (u.hostname === 'login.microsoftonline.com') return Response.json({ access_token: 'synthetic-glove-301' })
    if (!['www.googleapis.com', 'graph.microsoft.com'].includes(u.hostname) || !/\/calendars\//.test(u.pathname)) return null
    const provider = u.hostname === 'www.googleapis.com' ? 'google' : 'microsoft'
    const body = ['POST', 'PATCH'].includes(request.method) ? await request.json() : null
    edge.calls.push({ provider, method: request.method, url: request.url, body })
    if (edge.status !== 200) return new Response('Provider failure', { status: edge.status })
    if (request.method === 'GET') return Response.json(provider === 'google' ? { items: edge.busy.map(x => ({ start: { dateTime: x.start }, end: { dateTime: x.end } })) } : { value: edge.busy.map(x => ({ start: { dateTime: x.start, timeZone: 'UTC' }, end: { dateTime: x.end, timeZone: 'UTC' }, showAs: 'busy' })) })
    const id = request.method === 'POST' ? body.id ?? `synthetic-glove-${edge.calls.length}` : decodeURIComponent(u.pathname.split('/').at(-1))
    if (request.method === 'DELETE') { edge.events.delete(id); return new Response(null, { status: 204 }) }
    edge.events.set(id, body)
    return Response.json({ ...body, id })
  } }
  return edge
}
