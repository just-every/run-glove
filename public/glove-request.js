// Embed the real request page in a site's chosen position. No parent-page
// customer fields, cookies or storage are read or copied into the iframe.
(() => {
  const script = document.currentScript
  if (!script?.src) return
  const page = new URL('/request', script.src)
  page.searchParams.set('source', script.dataset.source || 'website')
  const frame = document.createElement('iframe')
  frame.src = page.href
  frame.title = 'Request service'
  frame.loading = 'lazy'
  frame.referrerPolicy = 'no-referrer'
  frame.style.cssText = 'display:block;width:100%;height:1400px;border:0;max-width:100%;'
  script.after(frame)
})()
