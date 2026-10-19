// The technician's phone works with no signal (FIELD-001). This worker keeps
// the app shell the phone has loaded (pages, scripts, styles, fonts) and
// answers from it only when the network fails; the technician app asks it to
// keep the shell and its own visits' photos. It never keeps records or any
// other /api/ or /auth/ answer: the day itself lives in the page's storage,
// only for a technician, and sign-out clears both.
const SHELL = 'glove-shell-v1', FILES = 'glove-day-files'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('message', event => {
  const { type, urls } = event.data || {}
  if (type === 'keep-shell') event.waitUntil(caches.open(SHELL).then(cache => Promise.all(urls.filter(sameOriginShell).map(url => cache.add(url).catch(() => {})))))
  if (type === 'keep-files') event.waitUntil(caches.open(FILES).then(async cache => { for (const url of urls) if (!(await cache.match(url))) await cache.add(url).catch(() => {}) }))
  if (type === 'forget') event.waitUntil(Promise.all([caches.delete(SHELL), caches.delete(FILES)]))
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
