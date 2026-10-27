import { allow } from '../access'
import { business, bump, event, expectVersion, fail, find, newId, text } from '../model'
import { mapLink, confirmLinks, requiredLinks } from './links'
import { xeroRead } from './client'
import type { Handler } from '../commands/types'

export const xero: Handler = async (c, type, p, db) => {
  if (!['xero.connect', 'xero.inspect', 'xero.map', 'xero.confirmLinks'].includes(type)) return undefined
  allow(c.actor, type)
  if (c.actor.role !== 'owner' || c.actor.branch || c.actor.token || c.actor.custom) fail('FORBIDDEN', 'An Owner without branch limits must sign in to inspect Xero.', null, 403)
  const b = business(c.s)
  if (type === 'xero.connect') {
    expectVersion(b, p.version)
    if (p.token === null) {
      c.sql.push({ sql: "DELETE FROM glove_provider_keys WHERE provider='xero'", params: [] })
      const row = bump(c.s, 'business', b, { xeroInspection: null })
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'xero.disconnected', summary: 'Owner disconnected Xero inspection; no accounting write', data: { effect: 'inspection disconnected' } })
      return { connected: false, version: row.version }
    }
    const token = text(p.token, 'Xero access token', { max: 4000 }), tenant = text(p.tenant, 'Xero tenant', { max: 36 })
    if (/[\r\n]/.test(token) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenant)) fail('INPUT', 'Use a valid Xero tenant and single-line access token.', null, 400)
    const secret = { token, tenant }
    // Verify access before saving. These network calls cannot post, change a balance or authorize a sync.
    await xeroRead(secret, 'Contacts')
    const old = await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='xero'").first<{ value: string }>()
    const sameTenant = old && JSON.parse(old.value).tenant === tenant
    const connectionId = sameTenant ? b.xeroInspection?.connectionId ?? newId() : newId()
    c.sql.push({ sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('xero',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [JSON.stringify(secret), c.actor.id, c.now] })
    const row = bump(c.s, 'business', b, { xeroInspection: { ...(sameTenant ? b.xeroInspection : {}), connectionId, configuredAt: c.now, mode: 'read-only', requiredLinks: sameTenant ? b.xeroInspection?.requiredLinks ?? requiredLinks(c) : requiredLinks(c) } })
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'xero.connected', summary: 'Owner verified Xero read access; posting remains unavailable', data: { effect: 'read-only inspection', sameTenant: !!sameTenant } })
    return { connected: true, version: row.version, mode: 'read-only' }
  }
  const stored = await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='xero'").first<{ value: string }>()
  if (!stored || !b.xeroInspection) fail('XERO_SETUP', 'Connect Xero inspection after installing or restoring; restored history grants no provider access.')
  const secret = JSON.parse(stored!.value)
  if (type === 'xero.map') return mapLink(c, secret, p)
  if (type === 'xero.confirmLinks') return confirmLinks(c, secret, p.confirm)
  const customer = find(c.s, 'customers', p.customerId)
  if (customer.erasedAt) fail('XERO_CUSTOMER', 'Customer inspection unavailable.')
  const [contacts, items, invoices] = await Promise.all(['Contacts', 'Items', 'Invoices'].map(resource => xeroRead(secret, resource)))
  // Explicit whitelist: no tenant, token, account bank details or provider payload is retained.
  const review = {
    customerId: customer.id,
    contacts: contacts.filter((r: any) => r.ContactStatus === 'ACTIVE').map((r: any) => ({ id: r.ContactID, name: r.Name, email: r.EmailAddress ?? null })),
    items: items.map((r: any) => ({ id: r.ItemID, code: r.Code, name: r.Name ?? r.Code })),
    invoices: invoices.filter((r: any) => r.Type === 'ACCREC' && !['DELETED', 'VOIDED'].includes(r.Status)).map((r: any) => ({ id: r.InvoiceID, number: r.InvoiceNumber, contactId: r.Contact?.ContactID, currency: r.CurrencyCode, total: r.Total, amountDue: r.AmountDue, status: r.Status })),
    effect: 'Inspection only; no match is confirmed, customer created, invoice posted or payment applied.',
  }
  c.reveal = { review: JSON.stringify(review) }
  event(c, { jobId: null, subjectKind: 'customer', subjectId: customer.id, kind: 'xero.inspected', summary: 'Owner inspected Xero contact, item and invoice summaries; no accounting write', data: { customerId: customer.id, counts: { contacts: review.contacts.length, items: review.items.length, invoices: review.invoices.length }, effect: 'inspection only' } })
  return { inspected: true, effect: review.effect }
}
