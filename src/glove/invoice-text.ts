import { allow } from './access'
import { bump, event, expectVersion, fail, find, newId, text } from './model'
import { queueSms } from './sms-delivery'
import { actorRef, connected, owner, phone, zone } from './sms-shared'
import { invoiceTextContent } from './invoice-text-content'
import type { Handler } from './commands/types'

/** This permission discloses one approved invoice only; it authorizes no collection. */
export const invoiceTexts: Handler = async (c, type, p) => {
  if (!['invoice.textConsent', 'invoice.text'].includes(type)) return undefined
  allow(c.actor, type); owner(c)
  if (!c.actor.sessionId || c.actor.reminderRun || c.actor.billingRun) fail('FORBIDDEN', 'Only a signed-in Owner explicitly approves an invoice text.', null, 403)
  const invoice = find(c.s, 'invoices', p.invoiceId), customer = find(c.s, 'customers', invoice.customerId)
  expectVersion(invoice, p.version); expectVersion(customer, p.customerVersion)
  if (customer.erasedAt || customer.mergedInto) fail('ERASED', 'This customer is no longer available for invoice texts.')
  const revision = invoice.revisions.at(-1)
  if (invoice.openingBalance || !['approved', 'exported'].includes(invoice.status) || !revision?.approval || !invoice.dates) fail('NOT_APPROVED', 'Approve the current Glove invoice revision before texting it.')
  if (p.revision !== revision.n) fail('REVISION', 'Review the current approved invoice revision before texting it.', { current: revision.n })
  const to = phone(customer.phone)
  if (p.address !== to) fail('CONSENT', 'Explicit approval must name the current customer number.')
  const reserved = c.s.messages.find(message => message.channel === 'sms' && message.kind === 'invoice' && message.subjectId === invoice.id && message.invoiceRevision === revision.n)
  if (type === 'invoice.textConsent') {
    if (typeof p.enabled !== 'boolean' || p.enabled && p.confirm !== true) fail('CONSENT', 'Explicitly confirm the customer requested this exact invoice by text.')
    if (p.enabled && customer.smsOptOut?.blocked && customer.smsOptOut.address === to) fail('CONSENT', 'The customer must send START before new invoice text permission is recorded.')
    if (p.enabled && reserved) fail('INVOICE_TEXT_RESERVED', 'This invoice revision already has a reserved text. Inspect its delivery outcome; it cannot be sent again.', { messageId: reserved.id, revision: revision.n })
    const consent = { id: newId(), enabled: p.enabled, invoiceId: invoice.id, invoiceRevision: revision.n, address: to, at: c.now, source: text(p.source, 'consent source', { max: 300 }), wording: text(p.wording, 'consent wording', { max: 2000 }), timezone: zone(p.timezone), by: actorRef(c) }
    bump(c.s, 'customers', customer, { automaticSms: { ...customer.automaticSms, payments: consent } })
    event(c, { jobId: invoice.jobId, subjectKind: 'invoice', subjectId: invoice.id, kind: 'invoice.textConsent', summary: `Owner recorded customer ${p.enabled ? 'permission' : 'withdrawal'} to text ${invoice.number} revision ${revision.n}`, data: { customerId: customer.id, consentId: consent.id, revision: revision.n, enabled: p.enabled } })
    return { invoiceId: invoice.id, revision: revision.n, consentId: consent.id, enabled: p.enabled }
  }
  if (p.confirm !== true) fail('CONSENT', 'Explicitly approve sending this exact invoice revision by text.')
  if (reserved) fail('INVOICE_TEXT_RESERVED', 'This invoice revision already has a reserved text. Inspect its delivery outcome; it cannot be sent again.', { messageId: reserved.id, revision: revision.n })
  connected(c.s)
  const message = queueSms(c, { kind: 'invoice', subjectKind: 'invoice', subjectId: invoice.id, customerId: customer.id, jobId: invoice.jobId, to, text: invoiceTextContent(invoice), label: `${invoice.number} revision ${revision.n}` })
  bump(c.s, 'customers', customer, { automaticSms: { ...customer.automaticSms, payments: { ...customer.automaticSms.payments, reservedMessageId: message.id, reservedAt: c.now } } })
  event(c, { jobId: invoice.jobId, subjectKind: 'invoice', subjectId: invoice.id, kind: 'invoice.textApproved', summary: `Owner explicitly approved text of ${invoice.number} revision ${revision.n}; provider delivery is not reported`, data: { messageId: message.id, revision: revision.n, invoiceVersion: invoice.version, consentId: message.invoiceConsentId } })
  return message
}
