// The technician's phone works with no signal (FIELD-001). This worker keeps
// the app shell the phone has loaded (pages, scripts, styles, fonts) and
// answers from it only when the network fails; the technician app asks it to
// keep the shell and its own visits' photos. It never keeps records or any
// other /api/ or /auth/ answer: the day itself lives in the page's storage,
// only for a technician, and sign-out clears both.
// FIELD-004: a push shows its generic line; tapping it opens the signed-in
// app on that job. The payload carries nothing else.
const SHELL = 'glove-shell-v1', FILES = 'glove-day-files'
let fileEpoch = 0

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('message', event => {
  const { type, urls } = event.data || {}
  if (type === 'keep-shell') event.waitUntil(caches.open(SHELL).then(cache => Promise.all(urls.filter(sameOriginShell).map(url => cache.add(url).catch(() => {})))))
  if (type === 'keep-files') { const epoch = fileEpoch; event.waitUntil(caches.open(FILES).then(async cache => { for (const url of urls) if (epoch === fileEpoch && !(await cache.match(url))) { const response = await fetch(url).catch(() => null); if (epoch === fileEpoch && response?.ok) await cache.put(url, response) } })) }
  if (type === 'forget-files') { fileEpoch++; event.waitUntil(caches.delete(FILES).finally(() => event.ports[0]?.postMessage({ complete: true }))) }
  if (type === 'forget') { fileEpoch++; event.waitUntil(Promise.all([caches.delete(SHELL), caches.delete(FILES)])) }
})

function sameOriginShell(url) {
  const u = new URL(url, self.location.origin)
  return u.origin === self.location.origin && !u.pathname.startsWith('/api/') && !u.pathname.startsWith('/auth/') && !u.pathname.startsWith('/__')
}

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/glove/files/')) { event.respondWith(fetch(request).catch(() => caches.open(FILES).then(c => c.match(request)).then(hit => hit || Response.error()))); return }
  if (!sameOriginShell(request.url)) return
  // Network first; the kept shell answers only when the network fails.
  event.respondWith(fetch(request).then(response => {
    if (response.ok && response.type === 'basic') { const copy = response.clone(); caches.open(SHELL).then(c => c.match(request).then(hit => hit && c.put(request, copy))) }
    return response
  }).catch(() => caches.open(SHELL).then(c => c.match(request, { ignoreVary: true })).then(hit => hit || Response.error())))
})

self.addEventListener('push', event => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = {} }
  const jobId = typeof data.jobId === 'string' ? data.jobId : null
  event.waitUntil(self.registration.showNotification(String(data.title || 'Glove'), { body: String(data.body || 'Your schedule changed'), tag: jobId ? `job-${jobId}` : 'schedule', data: { jobId } }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const jobId = event.notification.data && event.notification.data.jobId
  const target = new URL(jobId ? `/app?job=${encodeURIComponent(jobId)}` : '/app', self.location.origin).href
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => new URL(c.url).pathname === '/app')
    return open ? open.navigate(target).then(c => (c || open).focus()) : self.clients.openWindow(target)
  }))
})
