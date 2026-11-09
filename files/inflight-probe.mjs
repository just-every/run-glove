import { installation, business } from '/home/agent/rer-consolidation/work/sx-glove-quote015-cause-1/run-glove/tests/api/harness.mjs'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const h = await installation({ workerPlugins: [{
  name: 'delay-original-for-restart-diagnosis',
  setup(build) {
    build.onLoad({ filter: /tests\/api\/worker\.ts$/ }, async ({ path }) => ({
      loader: 'ts',
      contents: (await readFile(path, 'utf8')).replace(
        'return (await gloveResponse(request, env))',
        "if (new URL(request.url).pathname.startsWith('/api/glove/files/')) await new Promise(resolve => setTimeout(resolve, 500));\n    return (await gloveResponse(request, env))",
      ),
    }))
  },
}] })
try {
  const { documentLogo } = await import('/home/agent/rer-consolidation/work/sx-glove-quote015-cause-1/run-glove/tests/fixtures/document-images.mjs')
  await business(h, { logo: { mediaType: 'image/png', base64: documentLogo } })
  const id = (await h.state()).business[0].logo.fileId
  const pending = h.request('/api/glove/files/' + id).then(async r => ({ status: r.status, bytes: (await r.arrayBuffer()).byteLength }), e => ({ error: e.message, code: e.cause?.code }))
  await new Promise(resolve => setTimeout(resolve, 100))
  await h.restart()
  console.log(JSON.stringify({ experiment: 'real delayed original request interrupted by explicit fixture restart', result: await pending }))
  const retained = await h.request('/api/glove/files/' + id)
  assert.equal(retained.status, 200)
  assert.equal((await retained.arrayBuffer()).byteLength, 199)
  console.log('Restarted Worker still serves the unchanged retained original.')
} finally { await h.close() }
