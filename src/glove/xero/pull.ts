import { business, event, fail, newId, put, type Context, type Row } from '../model'
import { cents, dollars } from '../money'
import { invoiceBalance } from '../balances'

/** Read an explicitly selected set of existing applications as one remittance. */
export async function xeroPull(c: Context, p: any, secret: { token: string; tenant: string }) {
  if (!Array.isArray(p.paymentIds) || !p.paymentIds.length || p.paymentIds.length > 20 || p.paymentIds.some((id: any) => typeof id !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(id)) || new Set(p.paymentIds).size !== p.paymentIds.length) fail('INPUT', 'Choose distinct Xero payment identities.')
  if (typeof p.reference !== 'string' || !p.reference.trim() || p.reference.length > 255 || !Number.isSafeInteger(p.amountCents) || p.amountCents <= 0) fail('INPUT', 'Explicitly confirm the remittance reference and total USD cents.')
  const connectionId = business(c.s).xeroInspection.connectionId
  const remotes: any[] = []
  for (const id of [...p.paymentIds].sort()) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000)
    try {
      let response: Response
      try { response = await fetch(`https://api.xero.com/api.xro/2.0/Payments/${id}`, { redirect: 'manual', signal: controller.signal, headers: { authorization: `Bearer ${secret.token}`, 'xero-tenant-id': secret.tenant, accept: 'application/json' } }) } catch { return fail('XERO_PROVIDER', 'Xero payment read failed; no balance changed.') }
      if (!response.ok) fail('XERO_PROVIDER', `Xero payment read failed (HTTP ${response.status}); no balance changed.`)
      let body: any
      try { body = await response.json() } catch { return fail('XERO_PROVIDER', 'Xero returned unreadable payment data; no balance changed.') }
      if (body?.Payments?.length !== 1 || body.Payments[0].PaymentID !== id) fail('XERO_PAYMENT', 'Xero must return the exact selected payment.')
      remotes.push(body.Payments[0])
    } finally { clearTimeout(timer) }
  }
  if (remotes.some(r => r.Reference !== p.reference) || remotes.reduce((n, r) => n + cents(String(r.Amount), 'payment amount'), 0) !== p.amountCents) fail('XERO_PAYMENT', 'The selected applications must match the confirmed remittance reference and total cents.')
  const fingerprint = JSON.stringify(remotes.map(r => ({ id: r.PaymentID, invoice: r.Invoice?.InvoiceID, amount: r.Amount, date: r.Date, reference: r.Reference, account: r.Account?.AccountID, status: r.Status, type: r.PaymentType, currency: r.Invoice?.CurrencyCode, contact: r.Invoice?.Contact?.ContactID })))
  const prior = c.s.payments.filter(r => r.xeroImported?.connectionId === connectionId && r.xeroImported.paymentIds.some((id: string) => p.paymentIds.includes(id)))
  if (prior.length) {
    if (prior.length !== 1 || prior[0].xeroImported.fingerprint !== fingerprint) fail('XERO_PAYMENT_CHANGED', 'These payment applications already belong to a different or changed remittance; review their existing allocations.')
    event(c, { jobId: prior[0].jobId, subjectKind: 'payment', subjectId: prior[0].id, kind: 'xero.paymentReplayed', summary: 'Xero remittance already imported; no balance changed', data: { paymentIds: p.paymentIds } }); return prior[0]
  }
  let customerId: string | undefined, branchId: string | null | undefined
  const effects: { at: string; invoiceId: string; amountCents: number; tipCents: number; taxTotalAmount: string; taxBreakdown: any[] }[] = []
  for (const remote of remotes) {
    if (remote.Status !== 'AUTHORISED' || remote.PaymentType !== 'ACCRECPAYMENT' || remote.Invoice?.CurrencyCode !== 'USD' || !remote.Account?.AccountID || !remote.Date || remotes.some(r => r.Reference !== remote.Reference || r.Date !== remote.Date || r.Account?.AccountID !== remote.Account.AccountID)) fail('XERO_PAYMENT', 'Select authorized USD receipt applications with the same reference, date and bank account.')
    const invoice = c.s.invoices.find(r => !r.erasedAt && (r.xeroSync?.connectionId === connectionId && r.xeroSync.phase === 'complete' && r.xeroSync.remoteId === remote.Invoice.InvoiceID || r.xero?.connectionId === connectionId && r.xero.confirmedAt && r.xero.remoteId === remote.Invoice.InvoiceID)) ?? fail('XERO_MAPPING', 'Every application needs an existing reviewed invoice.')
    const customer = c.s.customers.find(r => r.id === invoice.customerId && !r.erasedAt)
    if (!customer || customer.xero?.connectionId !== connectionId || customer.xero.remoteId !== remote.Invoice.Contact?.ContactID || customerId && customerId !== customer.id || branchId !== undefined && branchId !== (invoice.branchId ?? null)) fail('XERO_MAPPING', 'A remittance cannot cross billing customers or branches.')
    customerId = customer!.id; branchId = invoice.branchId ?? null
    const amount = cents(String(remote.Amount), 'payment allocation'), previous = effects.filter(e => e.invoiceId === invoice.id).reduce((n, e) => n + e.amountCents, 0)
    if (amount <= 0 || amount + previous > (invoiceBalance(c.s, invoice) ?? 0)) fail('XERO_PAYMENT', 'A payment allocation must fit the unpaid invoice balance.')
    const rev = invoice.revisions?.findLast((r: Row) => r.approval)
    if (!rev) fail('XERO_PAYMENT', 'This invoice needs its original frozen tax snapshot before readback.')
    effects.push({ at: c.now, invoiceId: invoice.id, amountCents: amount, tipCents: 0, taxTotalAmount: rev.totals.total, taxBreakdown: structuredClone(rev.totals.taxBreakdown ?? []) })
  }
  const first = c.s.invoices.find(i => i.id === effects[0].invoiceId)!
  const row = put(c.s, 'payments', { id: newId(), version: 1, createdAt: c.now, confirmedAt: c.now, invoiceId: first.id, invoiceNumber: first.number, customerId, jobId: first.jobId, branchId, amount: dollars(effects.reduce((n, e) => n + e.amountCents, 0)), currency: 'USD', tip: '0.00', fee: null, method: 'Xero', kind: 'payment', status: 'paid', effects, providerReference: remotes[0].Reference || p.paymentIds.join(', '), by: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, xeroImported: { connectionId, paymentIds: [...p.paymentIds].sort(), fingerprint, bankReconciled: remotes.every(r => r.IsReconciled === true) } })
  event(c, { jobId: first.jobId, subjectKind: 'payment', subjectId: row.id, kind: 'xero.paymentImported', summary: `Xero receipt applied to ${effects.length} invoice allocations`, data: { paymentIds: p.paymentIds, effects, bankReconciled: row.xeroImported.bankReconciled } }); return row
}
