import { allow } from '../access'
import { callbackAuth, hash, password, snsSettings } from '../mail-callbacks'
import { sesKey } from '../mail-send'
import { address, connection, mailProviders, providerName, queueEmail } from '../mail'
import { optionsOf } from './quotes'
import { bump, business, event, expectVersion, fail, find, newId, oneOf, text, type Context, type Row } from '../model'
import type { Handler } from './types'

// COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018: the owner connects customer email (mail.connect) and may turn on the
// owner's morning brief email (mail.morning); the desk emails
// an approved quote or invoice to the customer and a draft purchase order to
// its supplier (email.send), each person only for the kind they may already
// record as sent. Booking links are emailed by agreement.offer (PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011).

const who = (c: Context) => ({ id: c.actor.id, name: c.actor.name, role: c.actor.role })
const lines = (rows: Row[]) => rows.map(l => `- ${l.description} × ${l.quantity}${l.unitPrice ? ` at $${l.unitPrice}` : ''}`).join('\n')

function quoteText(b: Row, quote: Row, rev: Row) {
  const options = optionsOf(rev)
  const body = options.length > 1 ? options.map(o => `${o.name}: $${o.totals.total} including tax\n${lines(o.lines)}`).join('\n\n') : `${lines(rev.lines)}\n\nTotal: $${rev.totals.total} including tax`
  return `${b.name} quote ${quote.number} (revision ${rev.n}): ${quote.title}\n\n${body}\n\nReply to this email or call ${b.phone || 'us'} to accept or ask a question.\n\n${b.name}${b.address ? `\n${b.address}` : ''}`
}

export const mail: Handler = async (c, type, p, db) => {
  if (type === 'mail.connect') {
    allow(c.actor, type)
    const b = business(c.s)
    if (p.provider === null) {
      c.sql.push({ sql: "DELETE FROM glove_provider_keys WHERE provider IN ('mail','mail-events')", params: [] })
      c.sql.push({ sql: "DELETE FROM glove_mail_callback_auth", params: [] })
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'mail.disconnected', summary: `${c.actor.name} disconnected customer email; Glove emails nothing until it is connected again`, data: { provider: b.mail?.provider ?? null } })
      return bump(c.s, 'business', b, { mail: null })
    }
    const provider = oneOf(p.provider, Object.keys(mailProviders) as (keyof typeof mailProviders)[], 'provider')
    const fromEmail = address(p.fromEmail, 'fromEmail'), fromName = text(p.fromName, 'fromName', { optional: true, max: 100 })
    if (/[<>"\\\r\n]/.test(fromName)) fail('INPUT', 'fromName is a plain name without quotes or angle brackets.', { field: 'fromName' }, 400)
    const apiKey = text(p.apiKey, 'apiKey', { max: 8000 }), signed = ['sendgrid', 'resend'].includes(provider)
    const eventKey = signed ? text(p.eventKey, 'eventKey', { max: 4000 }) : ''
    if (signed && (provider === 'resend' ? !/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(eventKey) : !/^[A-Za-z0-9+/]+={0,2}$/.test(eventKey))) fail('INPUT', 'eventKey is the provider webhook verification key.', { field: 'eventKey' }, 400)
    let sns: ReturnType<typeof snsSettings> | undefined
    if (provider === 'ses') {
      try { sns = snsSettings(p.sns); sesKey(apiKey) } catch { fail('INPUT', 'SES needs AWS credentials as JSON (accessKeyId, secretAccessKey, optional sessionToken), region, TopicArn and configuration set.', null, 400) }
    }
    if (p.postmarkAllowlist !== undefined && typeof p.postmarkAllowlist !== 'boolean') fail('INPUT', 'postmarkAllowlist is true or false.', null, 400)
    const upsert = "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES(?,?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at"
    c.sql.push({ sql: upsert, params: ['mail', apiKey, c.actor.id, c.now] })
    if (signed) c.sql.push({ sql: upsert, params: ['mail-events', eventKey, c.actor.id, c.now] })
    else c.sql.push({ sql: "DELETE FROM glove_provider_keys WHERE provider='mail-events'", params: [] })
    // Preserve replay identities through credential rotations; disconnect and
    // provider/source changes start a new connection and revoke old passwords.
    const same = b.mail?.provider === provider && (provider !== 'ses' || JSON.stringify(b.mail.sns) === JSON.stringify(sns))
    const namespace = same ? b.mail.namespace : newId()
    if (!same) c.sql.push({ sql: 'DELETE FROM glove_mail_callback_auth', params: [] })
    if (provider === 'postmark') {
      const old = same ? await callbackAuth(db, namespace) : null, value = password()
      c.sql.push({ sql: 'INSERT INTO glove_mail_callback_auth(namespace,current_hash,previous_hash,previous_until) VALUES(?,?,?,?) ON CONFLICT(namespace) DO UPDATE SET current_hash=excluded.current_hash,previous_hash=excluded.previous_hash,previous_until=excluded.previous_until', params: [namespace, await hash(value), old?.current_hash ?? null, old?.current_hash ? new Date(Date.parse(c.now) + 86_400_000).toISOString() : null] })
      c.reveal = { callbackPassword: value }
    }
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'mail.connected', summary: `${c.actor.name} connected ${providerName(provider)} for customer email from ${fromEmail}; Glove does not check the domain itself, and ${providerName(provider)} refuses mail from a domain it has not verified`, data: { provider, fromEmail, fromName } })
    return bump(c.s, 'business', b, { mail: { provider, fromEmail, fromName, namespace, ...(sns ? { sns } : {}), ...(provider === 'postmark' ? { postmarkAllowlist: p.postmarkAllowlist ?? (same ? b.mail.postmarkAllowlist ?? false : false) } : {}), connectedAt: c.now, connectedBy: c.actor.name, ...(b.mail?.morning ? { morning: b.mail.morning } : {}) } })
  }
  if (type === 'mail.callback') {
    allow(c.actor, type)
    const b = business(c.s), mail = connection(c.s)
    if (mail.provider !== 'postmark') fail('INPUT', 'Postmark is not connected.', null, 400)
    const action = oneOf(p.action, ['rotate', 'revokePrevious', 'allowlist'] as const, 'action')
    if (action === 'rotate') {
      const old = await callbackAuth(db, mail.namespace), value = password()
      c.sql.push({ sql: 'UPDATE glove_mail_callback_auth SET previous_hash=current_hash,previous_until=?,current_hash=? WHERE namespace=?', params: [new Date(Date.parse(c.now) + 86_400_000).toISOString(), await hash(value), mail.namespace] })
      if (!old?.current_hash) fail('MAIL', 'Reconnect Postmark to create a callback credential.')
      c.reveal = { callbackPassword: value }
    } else if (action === 'revokePrevious') c.sql.push({ sql: 'UPDATE glove_mail_callback_auth SET previous_hash=NULL,previous_until=NULL WHERE namespace=?', params: [mail.namespace] })
    else if (typeof p.enabled !== 'boolean') fail('INPUT', 'enabled is true or false.', null, 400)
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: `mail.callback.${action}`, summary: `${c.actor.name} ${action === 'rotate' ? 'rotated the Postmark callback credential; the previous credential works for 24 hours unless revoked' : action === 'revokePrevious' ? 'revoked the previous Postmark callback credential' : `${p.enabled ? 'enabled' : 'disabled'} the optional Postmark IP allowlist; Basic authentication remains required`}`, data: { provider: 'postmark', action, ...(action === 'allowlist' ? { enabled: p.enabled } : {}) } })
    return bump(c.s, 'business', b, { mail: { ...mail, ...(action === 'allowlist' ? { postmarkAllowlist: p.enabled } : {}) } })
  }
  if (type === 'mail.morning') {
    allow(c.actor, type)
    const b = business(c.s), mail = connection(c.s)
    if (typeof p.enabled !== 'boolean') fail('INPUT', 'enabled is true or false.', { field: 'enabled' }, 400)
    const time = p.time === undefined ? mail.morning?.time ?? '07:00' : /^([01]\d|2[0-3]):[0-5]\d$/.test(p.time) ? p.time : fail('INPUT', 'time is a business-local time such as 07:00.', { field: 'time' }, 400)
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'mail.morning', summary: p.enabled ? `${c.actor.name} turned on the morning brief email to the owner at ${time} business time; Glove sends it once per local date and does not retry` : `${c.actor.name} turned off the morning brief email`, data: { enabled: p.enabled, time } })
    return bump(c.s, 'business', b, { mail: { ...mail, morning: { enabled: p.enabled, time } } })
  }
  if (type !== 'email.send') return undefined
  allow(c.actor, type)
  const b = business(c.s); connection(c.s)
  const kind = oneOf(p.kind, ['quote', 'invoice', 'purchaseOrder'] as const, 'kind')
  if (kind === 'quote') {
    allow(c.actor, 'quote.markSent')
    const quote = find(c.s, 'quotes', p.id); expectVersion(quote, p.version)
    const rev = quote.revisions[quote.revisions.length - 1]
    if (!rev.approval) fail('NOT_APPROVED', 'A person approves this revision\'s price before it goes to the customer.')
    if (!['approved', 'sent'].includes(quote.status)) fail('QUOTE_STATE', `This quote is ${quote.status}.`)
    const customer = find(c.s, 'customers', quote.customerId)
    const to = customer.email ? address(customer.email, 'the customer\'s email') : fail('EMAIL', `${customer.name} has no email address; add it on the customer first.`)
    const message = queueEmail(c, { kind, subjectKind: 'quote', subjectId: quote.id, customerId: customer.id, jobId: null, to, subject: `Quote ${quote.number} from ${b.name}`, text: quoteText(b, quote, rev), label: `${quote.number} revision ${rev.n}` })
    bump(c.s, 'quotes', quote, { status: 'sent', sent: [...quote.sent, { revision: rev.n, channel: 'email', note: '', recordedBy: who(c), at: c.now, messageId: message.id }] })
    return message
  }
  if (kind === 'invoice') {
    allow(c.actor, 'invoice.approve')
    const inv = find(c.s, 'invoices', p.id); expectVersion(inv, p.version)
    if (!['approved', 'exported'].includes(inv.status)) fail('INVOICE_STATE', 'Approve this invoice before emailing it.')
    const rev = inv.revisions[inv.revisions.length - 1], customer = find(c.s, 'customers', inv.customerId), job = find(c.s, 'jobs', inv.jobId)
    // A business customer's invoices go to its accounts-payable address (CUST-001).
    const on = customer.apEmail || customer.email
    const to = on ? address(on, 'the customer\'s email') : fail('EMAIL', `${customer.name} has no email address; add it on the customer first.`)
    const due = inv.dates ? `\nIssued ${inv.dates.issuedOn}, due ${inv.dates.dueOn}.` : ''
    return queueEmail(c, { kind, subjectKind: 'invoice', subjectId: inv.id, customerId: customer.id, jobId: inv.jobId, to, subject: `Invoice ${inv.number} from ${b.name}`, text: `${b.name} invoice ${inv.number} for ${job.number} ${job.title}${inv.poNumber ? `\nYour PO: ${inv.poNumber}` : ''}${due}\n\n${lines(rev.lines)}\n\nTotal: $${rev.totals.total} including tax\n\nReply to this email or call ${b.phone || 'us'} with any question.\n\n${b.name}${b.address ? `\n${b.address}` : ''}`, label: `invoice ${inv.number} revision ${rev.n}` })
  }
  allow(c.actor, 'po.send')
  const po = find(c.s, 'purchaseOrders', p.id); expectVersion(po, p.version)
  if (po.status !== 'draft') fail('PO_STATE', `${po.number} is already ${po.status}.`)
  // The supplier's address on the order unless the person names another.
  const to = address(p.to ?? po.supplierEmail, 'to')
  const message = queueEmail(c, { kind, subjectKind: 'purchaseOrder', subjectId: po.id, customerId: null, jobId: po.jobId ?? null, to, subject: `Purchase order ${po.number} from ${b.name}`, text: `${b.name} purchase order ${po.number} for ${po.supplier}\n\n${lines(po.lines.map((l: Row) => ({ description: l.description, quantity: `${l.quantity} ${l.unit ?? ''}`.trim() })))}\n\nPlease confirm by replying to this email.\n\n${b.name}${b.address ? `\n${b.address}` : ''}`, label: `${po.number} to ${po.supplier}` })
  bump(c.s, 'purchaseOrders', po, { status: 'sent', sent: { method: 'email', reference: '', by: { id: c.actor.id, name: c.actor.name }, at: c.now, messageId: message.id, to } })
  return message
}
