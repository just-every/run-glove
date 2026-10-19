// A CompanyCam Public API v1 network edge, from its published OpenAPI shape.
// The production client and command doors are unchanged by this fixture.
export function companycamEdge() {
  const edge = { projects: new Map(), photos: new Map(), files: new Map(), calls: [], pageSize: 100, loseUploadResponse: false, nextId: 1000 }
  const envelope = (data, meta = {}) => Response.json({ data, errors: [], meta })
  edge.photo = (id, projectId, bytes, caption = '') => {
    const url = `https://static.companycam.com/photos/${id}.jpg`
    const photo = { id, project_id: projectId, status: 'active', processing_status: 'processed', captured_at: '2026-10-19T13:00:00Z', description: caption ? { id: `desc-${id}`, plain_text_content: caption, html_content: caption } : null, uris: [{ type: 'original', uri: url, url }] }
    edge.photos.set(id, photo); edge.files.set(url, bytes)
    return photo
  }
  edge.answer = async request => {
    const url = new URL(request.url)
    if (url.origin === 'https://static.companycam.com') {
      edge.calls.push({ method: request.method, path: url.pathname, authorization: request.headers.get('authorization') })
      return edge.files.has(request.url) ? new Response(edge.files.get(request.url), { headers: { 'content-type': 'image/jpeg' } }) : new Response(null, { status: 404 })
    }
    if (url.origin !== 'https://api.companycam.com') return null
    const path = url.pathname.replace('/public_api/v1', '')
    const call = { method: request.method, path, query: url.search, authorization: request.headers.get('authorization') }
    edge.calls.push(call)
    const project = /^\/projects\/(\d+)$/.exec(path)
    if (project) return edge.projects.has(project[1]) ? envelope(edge.projects.get(project[1])) : new Response(null, { status: 404 })
    const photos = /^\/projects\/(\d+)\/photos$/.exec(path)
    if (photos && request.method === 'GET') {
      const all = [...edge.photos.values()].filter(p => p.project_id === photos[1])
      const start = Number(url.searchParams.get('after') || 0), end = start + edge.pageSize
      return envelope(all.slice(start, end), { has_next: end < all.length, next_cursor: end < all.length ? String(end) : null })
    }
    if (photos && request.method === 'POST') {
      const form = await request.formData(), file = form.get('photo[photo_data]')
      call.fields = [...form.keys()]; call.bytes = new Uint8Array(await file.arrayBuffer())
      const photo = edge.photo(String(++edge.nextId), photos[1], call.bytes)
      if (edge.loseUploadResponse) throw new Error('Test network edge: provider accepted bytes but response was lost')
      return envelope(photo)
    }
    const description = /^\/photos\/(\d+)\/descriptions$/.exec(path)
    if (description && request.method === 'POST') {
      call.body = await request.json()
      const photo = edge.photos.get(description[1]); photo.description = { id: 'fixture-description', plain_text_content: call.body.description.content, html_content: call.body.description.content }
      return envelope(photo)
    }
    const photo = /^\/photos\/(\d+)$/.exec(path)
    if (photo && edge.photos.has(photo[1])) return envelope(edge.photos.get(photo[1]))
    return new Response(null, { status: 404 })
  }
  return edge
}
