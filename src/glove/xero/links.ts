import { bump, business, event, expectVersion, fail, find, oneOf, type Context, type Row, type State } from '../model'
import { xeroRead } from './client'

export const requiredXeroLinks = (s: State) => ({
  customers: s.customers.filter(r => !r.erasedAt && !r.mergedInto).map(r => r.id),
  services: s.services.filter(r => !r.archived).map(r => r.id),
  invoices: s.invoices.filter(r => !r.erasedAt).map(r => r.id),
})
const kinds = { customer: 'customers', service: 'services', invoice: 'invoices' } as const
const resources = { customer: 'Contacts', service: 'Items', invoice: 'Invoices' } as const
const identities = { customer: 'ContactID', service: 'ItemID', invoice: 'InvoiceID' } as const

async function validate(c: Context, secret: { token: string; tenant: string }, kind: keyof typeof kinds, row: Row, remoteId: string, lists?: Record<string, any[]>) {
  const connectionId = business(c.s).xeroInspection.connectionId
  const list = lists?.[resources[kind]] ?? await xeroRead(secret, resources[kind])
  const remote = list.find(r => r[identities[kind]] === remoteId)
  if (!remote || remote.ContactStatus === 'ARCHIVED' || ['DELETED', 'VOIDED'].includes(remote.Status)) fail('XERO_MAPPING', 'Choose an active existing Xero record.')
  if (c.s[kinds[kind]].some(r => r.id !== row.id && !r.erasedAt && r.xero?.connectionId === connectionId && r.xero.remoteId === remoteId)) fail('XERO_MAPPING', 'This Xero record is already linked to another Glove record.')
  if (kind === 'service') {
    const accounts = lists?.Accounts ?? await xeroRead(secret, 'Accounts')
    const taxes = lists?.TaxRates ?? await xeroRead(secret, 'TaxRates')
    if (remote.IsSold !== true || !accounts.some(a => a.Code === remote.SalesDetails?.AccountCode && a.Status === 'ACTIVE' && ['REVENUE', 'SALES', 'OTHERINCOME'].includes(a.Type)) || !taxes.some(t => t.TaxType === remote.SalesDetails?.TaxType && t.Status === 'ACTIVE')) fail('XERO_MAPPING', 'Choose a sales item with an active income account and tax mapping.')
    return { code: remote.Code, incomeAccountCode: remote.SalesDetails.AccountCode, taxType: remote.SalesDetails.TaxType }
  }
  if (kind === 'invoice') {
    const customer = find(c.s, 'customers', row.customerId), link = customer.xero
    const total = row.openingBalance?.sourceTotal ?? row.revisions?.findLast((r: Row) => r.approval)?.totals.total
    if (!link || link.connectionId !== connectionId || remote.Type !== 'ACCREC' || !['AUTHORISED', 'PAID'].includes(remote.Status) || remote.Contact?.ContactID !== link.remoteId || remote.InvoiceNumber !== (row.importedInvoiceNumber ?? row.number) || remote.CurrencyCode !== 'USD' || total === undefined || !Number.isFinite(Number(remote.Total)) || Number(remote.Total) !== Number(total)) fail('XERO_MAPPING', 'The existing USD invoice must match its reviewed billing contact, number and original total.')
    const propertyId = c.s.jobs.find(j => j.id === row.jobId)?.siteId ?? row.siteId ?? null
    if (propertyId) {
      const property = find(c.s, 'sites', propertyId)
      if (property.customerId !== customer.id || (property.branchId ?? null) !== (customer.branchId ?? null)) fail('XERO_MAPPING', 'The property must belong to this billing customer and branch.')
    }
    return { customerId: customer.id, contactId: link.remoteId, propertyId }
  }
  return {}
}

/** Separate explicit local review commands. These never authorize an accounting write. */
export async function xeroLinks(c: Context, type: string, p: Record<string, any>, secret: { token: string; tenant: string }) {
  const b = business(c.s), connection = b.xeroInspection
  if (type === 'xero.map') {
    const kind = oneOf(p.kind, ['customer', 'service', 'invoice'] as const, 'kind')
    const row = find(c.s, kinds[kind], p.id); expectVersion(row, p.version)
    if (typeof p.remoteId !== 'string' || !p.remoteId.trim() || p.remoteId.length > 80) fail('INPUT', 'Choose an existing Xero record identity.', null, 400)
    if (c.s.invoices.some(i => i.xeroSync && i.xeroSync.phase !== 'rejected' && (kind !== 'invoice' || i.id === row.id)) || row.xeroSync && row.xeroSync.phase !== 'rejected') fail('XERO_LOCKED', 'Posted or unresolved dependencies lock Xero identities; reconcile them before changing links.')
    const extra = await validate(c, secret, kind, row, p.remoteId)
    // Replacing a customer choice invalidates every dependent invoice choice.
    if (kind === 'customer' && row.xero?.remoteId !== p.remoteId) for (const invoice of c.s.invoices.filter(i => i.customerId === row.id && i.xero)) bump(c.s, 'invoices', invoice, { xero: null })
    const linked = bump(c.s, kinds[kind], row, { xero: { remoteId: p.remoteId, connectionId: connection.connectionId, verifiedBy: c.actor.id, verifiedAt: c.now, ...extra } })
    bump(c.s, 'business', b, { xeroInspection: { ...connection, linksConfirmedAt: null, linksConfirmedBy: null } })
    event(c, { jobId: row.jobId ?? null, subjectKind: kind, subjectId: row.id, kind: 'xero.mapped', summary: 'Owner verified an existing Xero link; no accounting write', data: { kind, remoteId: p.remoteId, connectionId: connection.connectionId, ...extra } })
    return { id: row.id, version: linked.version, remoteId: p.remoteId }
  }
  expectVersion(b, p.version)
  if (p.confirm !== true) fail('XERO_REVIEW', 'Explicitly confirm the reviewed existing Xero links.')
  const required = connection.requiredLinks ?? requiredXeroLinks(c.s)
  const missing = Object.entries(required).flatMap(([kind, ids]) => (ids as string[]).filter(id => {
    const row = c.s[kind as 'customers'].find(r => r.id === id)
    return row && !row.erasedAt && !row.archived && !row.mergedInto && row.xero?.connectionId !== connection.connectionId
  }).map(id => ({ kind, id })))
  if (missing.length) fail('XERO_REVIEW', 'Verify every pre-existing customer, sales item and invoice before confirming.', { missing })
  const lists = Object.fromEntries(await Promise.all(['Contacts', 'Items', 'Invoices', 'Accounts', 'TaxRates'].map(async r => [r, await xeroRead(secret, r)])))
  for (const kind of Object.keys(kinds) as (keyof typeof kinds)[]) for (const row of c.s[kinds[kind]].filter(r => !r.erasedAt && !r.archived && r.xero?.connectionId === connection.connectionId)) {
    const extra = await validate(c, secret, kind, row, row.xero.remoteId, lists)
    // A changed provider account or tax choice needs a fresh explicit mapping.
    if (Object.entries(extra).some(([key, value]) => row.xero[key] !== value)) fail('XERO_REVIEW', 'A linked Xero record changed; review and verify its mapping again.')
    bump(c.s, kinds[kind], row, { xero: { ...row.xero, confirmedBy: c.actor.id, confirmedAt: c.now } })
  }
  const result = bump(c.s, 'business', b, { xeroInspection: { ...connection, linksConfirmedAt: c.now, linksConfirmedBy: c.actor.id } })
  event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'xero.linksConfirmed', summary: 'Owner confirmed verified Xero links; no posting authority', data: { connectionId: connection.connectionId, requiredLinks: required } })
  return { confirmed: true, version: result.version, effect: 'Local links reviewed; accounting writes remain unavailable.' }
}
