import { bump, business, event, fail, find, oneOf, type Context, type Row } from '../model'
import { xeroRead, type XeroSecret } from './client'

const collections = { customer: 'customers', service: 'services', invoice: 'invoices' } as const
const resources = { customer: 'Contacts', service: 'Items', invoice: 'Invoices' } as const
const fields = { customer: 'ContactID', service: 'ItemID', invoice: 'InvoiceID' } as const
export const requiredLinks = (c: Context) => ({
  customers: c.s.customers.filter(r => !r.erasedAt && !r.mergedInto).map(r => r.id),
  services: c.s.services.filter(r => !r.archived).map(r => r.id),
  invoices: c.s.invoices.filter(r => !r.erasedAt).map(r => r.id),
})

async function verify(c: Context, secret: XeroSecret, kind: keyof typeof collections, row: Row, remoteId: string) {
  const remote = (await xeroRead(secret, resources[kind], remoteId))[0]
  if (remote?.[fields[kind]] !== remoteId) fail('XERO_MAPPING', 'Choose an existing Xero record with the exact identity.')
  if (kind === 'customer' && remote.ContactStatus !== 'ACTIVE') fail('XERO_MAPPING', 'Choose an active Xero contact.')
  if (kind === 'service' && (remote.IsSold !== true || !remote.SalesDetails?.AccountCode)) fail('XERO_MAPPING', 'Choose a Xero sales item with an income account.')
  if (kind === 'invoice') {
    const link = find(c.s, 'customers', row.customerId).xero
    const total = row.openingBalance?.sourceTotal ?? row.revisions?.findLast((r: Row) => r.approval)?.totals.total
    if (link?.connectionId !== business(c.s).xeroInspection.connectionId || remote.Contact?.ContactID !== link.remoteId || remote.Type !== 'ACCREC' || !['AUTHORISED', 'PAID'].includes(remote.Status) || remote.CurrencyCode !== 'USD' || remote.InvoiceNumber !== (row.importedInvoiceNumber ?? row.number) || total === undefined || Number(remote.Total) !== Number(total)) fail('XERO_MAPPING', 'The Xero sales invoice must match the linked customer, number and approved USD total exactly.')
  }
  return remote
}

export async function mapLink(c: Context, secret: XeroSecret, p: Record<string, any>) {
  const kind = oneOf(p.kind, ['customer', 'service', 'invoice'] as const, 'kind'), collection = collections[kind]
  const row = find(c.s, collection, p.id), connection = business(c.s).xeroInspection
  if (row.erasedAt || row.mergedInto || row.archived) fail('XERO_MAPPING', 'This record is unavailable for linking.')
  const remoteId = String(p.remoteId)
  await verify(c, secret, kind, row, remoteId)
  if (c.s[collection].some(r => r.id !== row.id && r.xero?.connectionId === connection.connectionId && r.xero.remoteId === remoteId)) fail('XERO_MAPPING', 'This Xero record is already linked.')
  // Replacing the billing contact invalidates dependent invoice links for review.
  if (kind === 'customer' && row.xero?.remoteId !== remoteId) for (const invoice of c.s.invoices.filter(r => r.customerId === row.id && r.xero?.connectionId === connection.connectionId)) bump(c.s, 'invoices', invoice, { xero: null })
  const updated = bump(c.s, collection, row, { xero: { remoteId, connectionId: connection.connectionId, verifiedBy: c.actor.id, verifiedAt: c.now } })
  const b = business(c.s)
  bump(c.s, 'business', b, { xeroInspection: { ...connection, linksConfirmedAt: null, linksConfirmedBy: null } })
  event(c, { jobId: row.jobId ?? null, subjectKind: kind, subjectId: row.id, kind: 'xero.mapped', summary: `Owner verified existing Xero link ${remoteId}; no accounting write`, data: { remoteId, connectionId: connection.connectionId, effect: 'link recorded only' } })
  return { id: updated.id, version: updated.version }
}

export async function confirmLinks(c: Context, secret: XeroSecret, confirm: unknown) {
  if (confirm !== true) fail('XERO_REVIEW', 'Explicitly confirm the verified existing Xero links.')
  const b = business(c.s), connection = b.xeroInspection
  const missing = Object.entries(connection.requiredLinks ?? {}).flatMap(([collection, ids]) => (ids as string[]).filter(id => {
    const row = c.s[collection as 'customers'].find(r => r.id === id)
    return row && !row.erasedAt && !row.mergedInto && !row.archived && row.xero?.connectionId !== connection.connectionId
  }).map(id => ({ kind: collection, id })))
  if (missing.length) fail('XERO_REVIEW', 'Verify every pre-existing customer, sales item and invoice before confirming.', { missing })
  // Re-read all links: a contact archived or under an erasure request since mapping cannot be confirmed.
  for (const kind of ['customer', 'service', 'invoice'] as const) for (const row of c.s[collections[kind]]) {
    if (!row.erasedAt && !row.mergedInto && !row.archived && row.xero?.connectionId === connection.connectionId) {
      await verify(c, secret, kind, row, row.xero.remoteId)
      bump(c.s, collections[kind], row, { xero: { ...row.xero, confirmedAt: c.now, confirmedBy: c.actor.id } })
    }
  }
  bump(c.s, 'business', b, { xeroInspection: { ...connection, linksConfirmedAt: c.now, linksConfirmedBy: c.actor.id } })
  event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'xero.linksConfirmed', summary: 'Owner confirmed existing Xero links; posting remains unavailable', data: { connectionId: connection.connectionId, effect: 'links reviewed only' } })
  return { confirmed: true, effect: 'Links reviewed only; no accounting write is authorized.' }
}
