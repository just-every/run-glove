// Only Intuit's network boundary is fake; application routes and D1 are real.
export function quickbooksEdge() {
  const records = new Map(), companies = new Map(), calls = [], identities = new Map()
  const edge = { records, calls, reject: null, uncertain: false, beforeReply: null, afterPost: null,
    record(entity, row, realm = '123') {
      if (!companies.has(realm)) companies.set(realm, realm === '123' ? records : new Map())
      companies.get(realm).set(`${entity}/${row.Id}`, structuredClone(row)); return row
    },
    async answer(request) {
      const url = new URL(request.url)
      if (!['sandbox-quickbooks.api.intuit.com', 'quickbooks.api.intuit.com'].includes(url.hostname)) return null
      const [, realm, entity, id] = url.pathname.match(/^\/v3\/company\/(\d+)\/([a-z]+)(?:\/(\d+))?$/) ?? []
      if (!entity) throw new Error('Unexpected QuickBooks request path')
      if (!companies.has(realm)) companies.set(realm, realm === '123' ? records : new Map())
      const companyRecords = companies.get(realm)
      const body = request.method === 'POST' ? await request.json() : null
      calls.push({ realm, entity, id, method: request.method, requestId: url.searchParams.get('requestid'), body, authorization: request.headers.get('authorization') })
      if (edge.beforeReply) {
        const response = await edge.beforeReply(calls.at(-1))
        if (response instanceof Response) return response
      }
      if (entity === 'query') {
        const query = url.searchParams.get('query') ?? ''
        const selected = query.match(/FROM (Customer|Item|Invoice)(?: WHERE Active IN \(true, false\))? STARTPOSITION (\d+) MAXRESULTS (\d+)/)
        if (selected) {
          const [, name, start, count] = selected
          const rows = [...companyRecords.entries()].filter(([key]) => key.startsWith(name.toLowerCase() + '/')).map(([, row]) => row)
          return Response.json({ QueryResponse: { [name]: rows.slice(Number(start) - 1, Number(start) - 1 + Number(count)) } })
        }
        const number = url.searchParams.get('query')?.match(/DocNumber = '([^']+)'/)?.[1]
        return Response.json({ QueryResponse: { Invoice: [...companyRecords.entries()].filter(([key, row]) => key.startsWith('invoice/') && row.DocNumber === number).map(([, row]) => row) } })
      }
      if (!body) {
        const row = companyRecords.get(`${entity}/${id}`)
        return row ? Response.json({ [entity[0].toUpperCase() + entity.slice(1)]: row }) : Response.json({ Fault: { type: 'ValidationFault', Error: [{ code: '610', Message: 'Object Not Found' }] } }, { status: 400 })
      }
      const identity = `${realm}:${url.searchParams.get('requestid')}`
      if (identities.has(identity)) return Response.json(identities.get(identity))
      if (edge.reject) return Response.json({ Fault: { type: 'ValidationFault', Error: [{ code: '2500', Message: edge.reject }] } }, { status: 400 })
      const total = body.Line?.reduce((n, l) => n + (l.DetailType === 'DiscountLineDetail' ? -Number(l.Amount) : Number(l.Amount)), 0) + Number(body.TxnTaxDetail?.TotalTax ?? 0)
      const row = { ...(body.sparse && body.Id ? companyRecords.get(`${entity}/${body.Id}`) : {}), ...body, Id: body.Id ?? String(1000 + companyRecords.size), SyncToken: String(Number(body.SyncToken ?? -1) + 1), ...(body.TotalAmt === undefined && Number.isFinite(total) ? { TotalAmt: Math.round(total * 100) / 100 } : {}) }
      const name = ({ refundreceipt: 'RefundReceipt' })[entity] ?? entity[0].toUpperCase() + entity.slice(1)
      const response = { [name]: row }; companyRecords.set(`${entity}/${row.Id}`, row); identities.set(identity, response)
      if (edge.afterPost) await edge.afterPost(calls.at(-1), row)
      if (edge.uncertain) return new Response('not confirmed', { status: 503 })
      return Response.json(response)
    },
  }
  return edge
}

/** Interrupt the real Worker after Intuit accepts a public invoice sync. */
export async function interruptInvoiceSend(h, invoiceId, phase = 'sending') {
  const commandId = crypto.randomUUID()
  let accepted, release
  const posted = new Promise(resolve => { accepted = resolve })
  const paused = new Promise(resolve => { release = resolve })
  let remote
  h.quickbooks.afterPost = async (call, row) => {
    if (call.entity !== 'invoice') return
    remote = structuredClone(row)
    if (phase === 'sending') { accepted(remote); await paused }
  }
  if (phase === 'complete') {
    h.checkpoints.qboComplete = async () => { accepted(remote); await paused }
    await h.request('/__test/qbo-completion', { method: 'POST' })
  }
  // The interrupted HTTP connection must not turn into an unhandled rejection.
  const pending = h.command('qbo.sync', { kind: 'invoice', id: invoiceId }, { commandId }).then(result => ({ result }), () => ({ interrupted: true }))
  try {
    const remote = await Promise.race([posted, pending.then(() => { throw new Error('Invoice sync ended before the provider accepted its POST.') })])
    await h.restart()
    release()
    await pending
    return { commandId, remote }
  } finally { h.quickbooks.afterPost = null; h.checkpoints.qboComplete = null; release() }
}
