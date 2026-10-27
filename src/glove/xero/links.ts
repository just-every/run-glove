import { canonicalJson, sha256 } from '../../modules/import-kit/src/d1/index'
import { bump, business, event, expectVersion, fail, find, oneOf, text, type Context, type Row } from '../model'
import { xeroRead } from './client'

const collection = (kind: string) => kind === 'customer' ? 'customers' as const : kind === 'invoice' ? 'invoices' as const : 'services' as const
const active = (kind: string, row: Row) => !row.erasedAt && !row.archived && !(kind === 'customer' && row.mergedInto)

async function records(secret: { token: string; tenant: string }, known?: { contacts: any[]; items: any[]; invoices?: any[] }) {
  const [contacts, items, accounts, taxes, invoices] = await Promise.all([known ? Promise.resolve(known.contacts) : xeroRead(secret, 'Contacts', true), known ? Promise.resolve(known.items) : xeroRead(secret, 'Items', true), xeroRead(secret, 'Accounts', true), xeroRead(secret, 'TaxRates', true), known?.invoices ? Promise.resolve(known.invoices) : xeroRead(secret, 'Invoices', true)])
  return { contacts, items, accounts, taxes, invoices }
}

function verified(kind: string, id: string, remote: Awaited<ReturnType<typeof records>>, c: Context, local: Row) {
  const row = (kind === 'customer' ? remote.contacts : kind === 'invoice' ? remote.invoices : remote.items).find((r: any) => r[kind === 'customer' ? 'ContactID' : kind === 'invoice' ? 'InvoiceID' : 'ItemID'] === id)
  if (!row || (kind === 'customer' && row.ContactStatus !== 'ACTIVE')) fail('XERO_MAPPING', 'Choose an active existing Xero billing contact or sales item.')
  if (kind === 'customer') return { remoteId: id, name: row.Name, email: row.EmailAddress ?? null }
  if (kind === 'invoice') {
    const link = find(c.s, 'customers', local.customerId).xeroLink
    const total = local.openingBalance?.sourceTotal ?? local.revisions?.findLast((r: Row) => r.approval)?.totals.total
    if (link?.connectionId !== business(c.s).xeroInspection.connectionId || row.Contact?.ContactID !== link.remoteId || row.Type !== 'ACCREC' || !['AUTHORISED', 'PAID'].includes(row.Status) || row.CurrencyCode !== 'USD' || row.InvoiceNumber !== (local.importedInvoiceNumber ?? local.number) || total === undefined || Number(row.Total) !== Number(total)) fail('XERO_MAPPING', 'The Xero sales invoice must match the linked customer, number and approved USD total exactly.')
    return { remoteId: id, number: row.InvoiceNumber, total: row.Total, currency: row.CurrencyCode, status: row.Status, contactId: row.Contact.ContactID }
  }
  const sales = row.SalesDetails
  if (typeof sales?.AccountCode !== 'string' || !sales.AccountCode || typeof sales?.TaxType !== 'string' || !sales.TaxType) fail('XERO_MAPPING', 'The Xero sales item requires an explicit income account and revenue tax type.')
  const account = remote.accounts.find((a: any) => a.Code === sales?.AccountCode && a.Status === 'ACTIVE' && ['REVENUE', 'SALES', 'OTHERINCOME'].includes(a.Type))
  const tax = remote.taxes.find((t: any) => t.TaxType === sales?.TaxType && t.Status === 'ACTIVE' && t.CanApplyToRevenue === true)
  if (row.IsSold !== true || !account || !tax) fail('XERO_MAPPING', 'The Xero sales item requires an active income account and an active revenue tax type.')
  return { remoteId: id, code: row.Code, name: row.Name ?? row.Code, accountCode: account.Code, taxType: tax.TaxType, taxRate: tax.EffectiveRate }
}

async function review(c: Context, secret: { token: string; tenant: string }, known?: { contacts: any[]; items: any[]; invoices?: any[] }) {
  const b = business(c.s), remote = await records(secret, known), links: any[] = [], missing: any[] = []
  for (const kind of ['customer', 'service', 'invoice']) for (const row of c.s[collection(kind)].filter(r => active(kind, r))) {
    if (row.xeroLink?.connectionId !== b.xeroInspection.connectionId) { missing.push({ kind, id: row.id }); continue }
    const provider = verified(kind, row.xeroLink.remoteId, remote, c, row)
    if (kind === 'service' && (provider.accountCode !== row.xeroLink.accountCode || provider.taxType !== row.xeroLink.taxType)) fail('XERO_MAPPING', 'The Xero sales item mapping changed; review and map it again.')
    links.push({ kind, id: row.id, version: row.version, ...provider })
  }
  links.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id))
  missing.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id))
  const fingerprint = sha256(canonicalJson({ connectionId: b.xeroInspection.connectionId, links, missing }))
  return { fingerprint, links, missing, effect: 'Local link review only; no posting or payment authority.' }
}

export async function linkReview(c: Context, secret: { token: string; tenant: string }, known: { contacts: any[]; items: any[]; invoices?: any[] }) {
  return review(c, secret, known)
}

/** A separate explicit local mapping door. It sends no accounting writes. */
export async function reviewLinks(c: Context, type: string, p: any, secret: { token: string; tenant: string }) {
  const b = business(c.s)
  if (type === 'xero.confirmLinks') {
    expectVersion(b, p.version)
    if (p.confirm !== true) fail('XERO_REVIEW', 'Explicitly confirm the current Xero link review.')
    const current = await review(c, secret)
    if (p.fingerprint !== current.fingerprint || current.missing.length || !current.links.length) fail('XERO_REVIEW', 'Read and complete the current Xero link review before confirming.')
    for (const link of current.links) {
      const local = find(c.s, collection(link.kind), link.id)
      bump(c.s, collection(link.kind), local, { xeroLink: { ...local.xeroLink, confirmedBy: c.actor.id, confirmedAt: c.now } })
    }
    const row = bump(c.s, 'business', b, { xeroInspection: { ...b.xeroInspection, linkReview: { fingerprint: current.fingerprint, by: c.actor.id, at: c.now }, linksConfirmedAt: c.now, linksConfirmedBy: c.actor.id } })
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'xero.linksReviewed', summary: 'Owner confirmed existing Xero links locally; no accounting write', data: { connectionId: b.xeroInspection.connectionId, count: current.links.length, effect: current.effect } })
    return { confirmed: true, reviewed: true, version: row.version, effect: current.effect }
  }
  const kind = oneOf(p.kind, ['customer', 'service', 'invoice'] as const, 'kind'), rows = collection(kind), row = find(c.s, rows, p.id)
  expectVersion(row, p.version)
  if (!active(kind, row)) fail('XERO_MAPPING', 'Choose a current Glove customer or price-book item.')
  if (p.confirm !== true) fail('XERO_REVIEW', 'Explicitly approve linking this existing Xero record.')
  const id = text(p.remoteId, 'Xero record ID', { max: 80 })
  if (!/^[a-zA-Z0-9-]+$/.test(id)) fail('INPUT', 'Use the existing Xero record ID.', null, 400)
  if (c.s[rows].some(r => r.id !== row.id && r.xeroLink?.connectionId === b.xeroInspection.connectionId && r.xeroLink.remoteId === id)) fail('XERO_MAPPING', 'This Xero record is already linked to another Glove record.')
  if (kind === 'customer' && row.xeroLink?.remoteId !== id) for (const invoice of c.s.invoices.filter(r => r.customerId === row.id && r.xeroLink?.connectionId === b.xeroInspection.connectionId)) bump(c.s, 'invoices', invoice, { xeroLink: null })
  const provider = verified(kind, id, await records(secret), c, row)
  const result = bump(c.s, rows, row, { xeroLink: { remoteId: id, connectionId: b.xeroInspection.connectionId, by: c.actor.id, at: c.now, ...(kind === 'service' ? { accountCode: provider.accountCode, taxType: provider.taxType } : {}) } })
  bump(c.s, 'business', b, { xeroInspection: { ...b.xeroInspection, linkReview: null, linksConfirmedAt: null, linksConfirmedBy: null } })
  event(c, { jobId: null, subjectKind: kind, subjectId: row.id, kind: 'xero.mapped', summary: `Owner verified existing Xero link ${id} locally; no accounting write`, data: { remoteId: id, connectionId: b.xeroInspection.connectionId, effect: 'local link only' } })
  return { id: result.id, version: result.version, linked: true, effect: 'Local link only; no posting or payment authority.' }
}
