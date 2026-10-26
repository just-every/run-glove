import { bump, business, event, fail, type Context, type Row, type State } from '../model'

// Previously linked properties must be reviewed again when the company changes.
export const requiredLinks = (s: State) => ({ customers: s.customers.filter(r => !r.erasedAt && !r.mergedInto).map(r => r.id), sites: s.sites.filter(r => !r.erasedAt && r.qbo?.remoteId).map(r => r.id), services: s.services.filter(r => !r.archived && r.kind !== 'discount').map(r => r.id), invoices: s.invoices.filter(r => !r.erasedAt).map(r => r.id) })

/** A company switch cannot discard the identities needed to resolve an earlier send. */
export function assertPriorCompanyResolved(c: Context) {
  const connectionId = business(c.s).qbo.connectionId
  for (const kind of ['customers', 'services', 'invoices', 'payments'] as const) {
    const row = c.s[kind].find(r => r.qboSync && r.qboSync.connectionId !== connectionId && ['reserved', 'sending', 'unknown'].includes(r.qboSync.phase))
    if (row) fail('QBO_UNCERTAIN', 'Reconnect the original QuickBooks company and reconcile its outstanding operation before changing accounting links.', { kind, id: row.id, connectionId: row.qboSync.connectionId })
  }
}

/** Keep provider facts when the current accounting reference moves to another company. */
export function priorOutcomes(row: Row, connectionId: string) {
  const history = row.qboSyncHistory ?? [], previous = row.qboSync
  if (!previous || previous.connectionId === connectionId || history.some((outcome: Row) => outcome.connectionId === previous.connectionId && outcome.remoteId === previous.remoteId && outcome.operationId === previous.operationId)) return history
  return [...history, previous]
}
export function confirmLinks(c: Context, confirm: unknown) {
  if (confirm !== true) fail('QBO_REVIEW', 'Explicitly confirm the reviewed QuickBooks links before the first post.')
  const b = business(c.s), connection = b.qbo
  const missing = Object.entries(connection.requiredLinks ?? {}).flatMap(([kind, ids]) => (ids as string[]).filter(id => {
    const row = c.s[kind as 'customers'].find(r => r.id === id)
    return row && !row.erasedAt && !row.archived && row.qbo?.connectionId !== connection.connectionId
  }).map(id => ({ kind, id })))
  if (missing.length) fail('QBO_REVIEW', 'Verify and link every pre-existing customer, sales item and invoice before confirming.', { missing })
  for (const kind of ['customers', 'sites', 'services', 'invoices'] as const) for (const linked of c.s[kind]) {
    if (linked.qbo?.connectionId === connection.connectionId && !linked.qbo.confirmedAt) bump(c.s, kind, linked, { qbo: { ...linked.qbo, confirmedAt: c.now, confirmedBy: c.actor.id } })
  }
  const row = bump(c.s, 'business', b, { qbo: { ...connection, linksConfirmedAt: c.now, linksConfirmedBy: c.actor.id } })
  event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'qbo.linksConfirmed', summary: 'Owner confirmed verified existing QuickBooks links before posting', data: { connectionId: connection.connectionId, requiredLinks: connection.requiredLinks } })
  return row
}

/** Once a dependent send is reserved, changing its accounting identity would split the books. */
export function assertLinkChange(c: Context, kind: string, row: Row, remoteId: string) {
  assertPriorCompanyResolved(c)
  const connectionId = business(c.s).qbo.connectionId
  if (row.qboSync?.connectionId === connectionId && ['reserved', 'sending', 'unknown'].includes(row.qboSync.phase)) fail('QBO_UNCERTAIN', 'Reconcile this outstanding QuickBooks operation before changing its link.')
  const link = row.qbo?.connectionId === connectionId ? row.qbo : row.qboSync?.connectionId === connectionId ? row.qboSync : null
  if (!link || link.remoteId === remoteId) return
  const sent = (r: Row) => r.qboSync?.connectionId === connectionId && (r.qboSync.operationId || r.qboSync.reconciledAt) && r.qboSync.phase !== 'rejected'
  const invoices = c.s.invoices.filter(invoice => kind === 'invoice' ? invoice.id === row.id : kind === 'customer' ? invoice.customerId === row.id : kind === 'site' ? c.s.jobs.find(j => j.id === invoice.jobId)?.siteId === row.id : invoice.revisions?.some((revision: Row) => revision.lines.some((line: Row) => line.serviceId === row.id)))
  if (sent(row) || invoices.some(sent) || c.s.payments.some(payment => sent(payment) && (kind === 'customer' && payment.customerId === row.id || invoices.some(invoice => invoice.id === payment.invoiceId || payment.effects?.some((effect: Row) => effect.invoiceId === invoice.id))))) fail('QBO_LINK_USED', 'This link has a dependent QuickBooks post and cannot be changed.')
}
