// Real HTTP bytes for the real app and fixture Worker. Native attachment
// downloads bypass Playwright routing, so they need a listening transport.
import { createServer, request as forward } from 'node:http'
import { connect, type Socket } from 'node:net'

export async function nativeTransport(h: any, frontend: string, as?: string) {
  const target = new URL(frontend), sockets = new Set<Socket>(), pending = new Set<Promise<void>>()
  const failures: Error[] = []
  const server = createServer((req, res) => {
    const task = (async () => {
      if (req.url!.startsWith('/api/glove/')) {
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(Buffer.from(chunk))
        const raw = Buffer.concat(chunks).toString()
        const response = await h.request(req.url, { method: req.method, ...(as ? { as } : {}), ...(raw ? { body: JSON.parse(raw) } : {}) })
        const bytes = Buffer.from(await response.arrayBuffer())
        const headers = Object.fromEntries(response.headers)
        delete headers['transfer-encoding']; delete headers.connection
        headers['content-length'] = String(bytes.length)
        res.writeHead(response.status, headers); res.end(bytes)
      } else {
        await new Promise<void>((resolve, reject) => {
          const upstream = forward(new URL(req.url!, target), { method: req.method, headers: { ...req.headers, host: target.host } }, response => {
            res.writeHead(response.statusCode!, response.headers); response.pipe(res)
            response.on('end', resolve); response.on('error', reject)
          })
          upstream.on('error', reject); req.pipe(upstream)
        })
      }
    })().catch(error => { if (!res.destroyed) { failures.push(error); res.destroy(error) } })
    pending.add(task); void task.finally(() => pending.delete(task))
  })
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)) })
  // Keep Vite's real development connection on the same forwarded origin.
  server.on('upgrade', (req, socket, head) => {
    const upstream = connect(Number(target.port), target.hostname, () => {
      const headers = Object.entries({ ...req.headers, host: target.host }).map(([key, value]) => `${key}: ${value}`).join('\r\n')
      const protocol = ['HTTP', req.httpVersion].join('/')
      upstream.write(`${req.method} ${req.url} ${protocol}\r\n${headers}\r\n\r\n`)
      if (head.length) upstream.write(head)
      upstream.pipe(socket); socket.pipe(upstream)
    })
    upstream.on('error', () => socket.destroy()); socket.on('close', () => upstream.destroy())
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  return {
    origin,
    async idle() { await Promise.all([...pending]); if (failures.length) throw failures[0] },
    async close() {
      for (const socket of sockets) socket.destroy()
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
      await Promise.all([...pending]); if (failures.length) throw failures[0]
    },
  }
}
