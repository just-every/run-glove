import { bump, business, event, fail, type Context, type State } from '../model'

export const requiredLinks = (s: State) => ({ customers: s.customers.filter(r => !r.erasedAt && !r.mergedInto).map(r => r.id), services: s.services.filter(r => !r.archived && r.kind !== 'discount').map(r => r.id), invoices: s.invoices.filter(r => !r.erasedAt).map(r => r.id) })
export function confirmLinks(c: Context, confirm: unknown) {
  if (confirm !== true) fail('QBO_REVIEW', 'Explicitly confirm the reviewed QuickBooks links before the first post.')
  const b = business(c.s), connection = b.qbo
  const missing = Object.entries(connection.requiredLinks ?? {}).flatMap(([kind, ids]) => (ids as string[]).filter(id => {
    const row = c.s[kind as 'customers'].find(r => r.id === id)
    return row && !row.erasedAt && !row.archived && row.qbo?.connectionId !== connection.connectionId
  }).map(id => ({ kind, id })))
  if (missing.length) fail('QBO_REVIEW', 'Verify and link every pre-existing customer, sales item and invoice before confirming.', { missing })
  const row = bump(c.s, 'business', b, { qbo: { ...connection, linksConfirmedAt: c.now, linksConfirmedBy: c.actor.id } })
  event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'qbo.linksConfirmed', summary: 'Owner confirmed verified existing QuickBooks links before posting', data: { connectionId: connection.connectionId, requiredLinks: connection.requiredLinks } })
  return row
}
