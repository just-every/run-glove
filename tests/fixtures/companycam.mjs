// A CompanyCam Public API v1 network edge, from its published OpenAPI shape.
// The production client and command doors are unchanged by this fixture.
export function companycamEdge() {
  const edge = { projects: new Map(), photos: new Map(), files: new Map(), mediaTypes: new Map(), calls: [], pageSize: 100, loseUploadResponse: false, refuseCaption: false, loseCaptionResponse: false, beforeUpload: null, afterUpload: null, nextId: 1000 }
  const envelope = (data, meta = {}) => Response.json({ data, errors: [], meta })
  edge.photo = (id, projectId, bytes, caption = '', mediaType = 'image/jpeg') => {
    const url = `https://static.companycam.com/photos/${id}.jpg`
    const photo = { id, project_id: projectId, status: 'active', processing_status: 'processed', captured_at: '2026-10-19T13:00:00Z', description: caption ? { id: `desc-${id}`, plain_text_content: caption, html_content: caption } : null, uris: [{ type: 'original', uri: url, url }] }
    edge.photos.set(id, photo); edge.files.set(url, bytes); edge.mediaTypes.set(url, mediaType)
    return photo
  }
  edge.answer = async request => {
    const url = new URL(request.url)
    if (url.origin === 'https://static.companycam.com') {
      edge.calls.push({ method: request.method, path: url.pathname, authorization: request.headers.get('authorization') })
      return edge.files.has(request.url) ? new Response(edge.files.get(request.url), { headers: { 'content-type': edge.mediaTypes.get(request.url) } }) : new Response(null, { status: 404 })
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
      call.mediaType = file.type; call.fileName = file.name
      if (edge.beforeUpload) await edge.beforeUpload(call)
      const photo = edge.photo(String(++edge.nextId), photos[1], call.bytes)
      if (edge.afterUpload) await edge.afterUpload(call)
      if (edge.loseUploadResponse) throw new Error('Test network edge: provider accepted bytes but response was lost')
      return envelope(photo)
    }
    const description = /^\/photos\/(\d+)\/descriptions$/.exec(path)
    if (description && request.method === 'POST') {
      call.body = await request.json()
      if (edge.refuseCaption) return new Response(null, { status: 403 })
      const photo = edge.photos.get(description[1]); photo.description = { id: 'fixture-description', plain_text_content: call.body.description.content, html_content: call.body.description.content }
      if (edge.loseCaptionResponse) throw new Error('Test network edge: caption accepted but response was lost')
      return envelope(photo)
    }
    const photo = /^\/photos\/(\d+)$/.exec(path)
    if (photo && edge.photos.has(photo[1])) return envelope(edge.photos.get(photo[1]))
    return new Response(null, { status: 404 })
  }
  return edge
}

// Genuine encoded images, interleaved with refused records across five cursor pages.
// Padding preserves the original image while exercising the inclusive byte limit.
export function companycamImportMatrix(edge, jpeg) {
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000030000000208020000001216f14d0000001549444154789c6394ec096060606060606062800100113f00f945f2fc7b0000000049454e44ae426082', 'hex')
  const webp = Buffer.from('524946463800000057454250565038202c0000007001009d012a0300020001402625a0027401400000feee767eaaa7afc6effe8c3fffc691fff4d23e1cc00000', 'hex')
  const gif = Buffer.from('47494638376103000200810000198c500000000000000000002c00000000030002000008060001081c1810003b', 'hex')
  const padded = (bytes, size) => Buffer.concat([bytes, Buffer.alloc(size - bytes.length)])
  const originals = {
    jpeg: padded(jpeg, 1_500_000), png: padded(png, 1_500_000),
    webp: padded(webp, 1_500_000), later: Buffer.concat([jpeg, Buffer.from('Later CompanyCam original')]),
  }
  edge.pageSize = 3
  edge.photo('501', '42', originals.jpeg, 'Nameplate before service')
  edge.photo('502', '42', gif, 'Unsupported animation', 'image/gif')
  edge.photo('503', '42', padded(jpeg, 1_500_001), 'Oversized JPEG')
  edge.photo('504', '42', originals.png, 'Roof access', 'image/png').captured_at = '2026-10-19T13:01:00Z'
  edge.photo('505', '42', jpeg, 'Still processing').processing_status = 'processing'
  edge.photo('506', '42', jpeg, 'Inactive original').status = 'inactive'
  edge.photo('507', '42', originals.webp, 'Panel before service', 'image/webp').captured_at = '2026-10-19T13:02:00Z'
  edge.photo('508', '42', jpeg, 'Original unavailable').uris = []
  edge.photo('509', '42', png, 'Incorrect image type')
  edge.photo('510', '42', padded(png, 1_500_001), 'Oversized PNG', 'image/png')
  edge.photo('511', '42', jpeg, 'Capture time unavailable').captured_at = null
  edge.photo('512', '42', padded(webp, 1_500_001), 'Oversized WebP', 'image/webp')
  edge.photo('513', '42', originals.later, 'Later valid original').captured_at = '2026-10-19T13:03:00Z'
  return originals
}
