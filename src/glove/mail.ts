import { customerMailSender } from './mail-send'
import { providerEvent } from './timeline'
import { business, event, fail, newId, put, type Context, type Row, type State } from './model'

// COMM-001: customer email through the owner's own provider, sent by Base's
// mail adapter from the owner's from-address. A message record keeps what was
// emailed, to whom and by whom; the body travels only in the request that
// sends it, so a booking link's bearer is never stored. The provider's answer
// to the send and every signed delivery event it reports later are provider
// facts on the timeline (DATA-002); a message's state is read from them and
// never claimed without them.

export const mailProviders = { sendgrid: 'SendGrid', resend: 'Resend', postmark: 'Postmark', ses: 'Amazon SES' } as const
export type MailProvider = keyof typeof mailProviders
export const providerName = (provider: unknown) => mailProviders[provider as MailProvider] ?? 'The email provider'

const mailbox = /^[^\s@<>()",;:\\[\]]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/
export const isAddress = (value: unknown): value is string => typeof value === 'string' && value.length <= 254 && mailbox.test(value)
export function address(value: unknown, field: string): string {
  const v = typeof value === 'string' ? value.trim() : ''
  return isAddress(v) ? v : fail('INPUT', `${field} is one email address.`, { field }, 400)
}

export function connection(s: State): Row {
  return business(s).mail ?? fail('MAIL', 'The owner connects customer email (SendGrid, Resend, Postmark or Amazon SES) first.')
}

export type Email = { kind: 'leadReply' | 'confirmation' | 'moved' | 'cancelled' | 'visitReminder' | 'paymentReminder' | 'quoteFollowup' | 'paymentReceipt' | 'quote' | 'invoice' | 'purchaseOrder' | 'bookingLink' | 'quoteLink' | 'quoteConfirmation'; subjectKind: string; subjectId: string; customerId: string | null; jobId: string | null; to: string; subject: string; text: string; html?: string; label: string }

/** Queue one email with this command; it goes to the provider once the command commits. */
export function queueEmail(c: Context, m: Email): Row {
  const mail = connection(c.s)
  const row = put(c.s, 'messages', { id: newId(), version: 1, createdAt: c.now, kind: m.kind, subjectKind: m.subjectKind, subjectId: m.subjectId, customerId: m.customerId, jobId: m.jobId, to: m.to, subject: m.subject, provider: mail.provider, from: mail.fromEmail, by: { id: c.actor.id, name: c.actor.name, role: c.actor.role } })
  ;(c.mail ??= []).push({ messageId: row.id, to: m.to, subject: m.subject, text: m.text, ...(m.html ? { html: m.html } : {}) })
  event(c, { jobId: m.jobId, subjectKind: 'message', subjectId: row.id, kind: 'email.queued', summary: `${c.actor.name} emailed ${m.label} to ${m.to} through ${providerName(mail.provider)}; delivery is not yet reported`, data: { messageId: row.id, kind: m.kind, subjectKind: m.subjectKind, subjectId: m.subjectId, to: m.to, provider: mail.provider } })
  return row
}

const sentSummary: Record<string, string> = { accepted: 'accepted the email; delivery is not yet reported', rejected: 'refused the email', rate_limited: 'is limiting sends and did not take the email', uncertain: 'did not confirm the email', development: 'suppressed the email (development mode)' }

/** After the command commits: one attempt per queued email, its answer recorded as a provider fact. No retry. */
export async function deliverMail(db: D1Database, c: Context) {
  if (!c.mail?.length) return
  const mail = c.s.business[0]?.mail
  const key = mail && (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='mail'").first<{ value: string }>())?.value
  const office = c.s.business[0]?.email
  for (const m of c.mail) {
    const row = c.s.messages.find(x => x.id === m.messageId)
    let status = 'rejected', providerMessageId: string | null = null, code: string | null = null
    if (!mail || !key) code = 'not_connected'
    else {
      try {
        const sender = customerMailSender(mail, key)
        const result = await sender.send({ deliveryId: m.messageId, from: mail.fromName ? `${mail.fromName} <${mail.fromEmail}>` : mail.fromEmail, to: [m.to], subject: m.subject, text: m.text, ...(m.html ? { html: m.html } : {}), ...(isAddress(office) ? { replyTo: office } : {}) })
        status = result.status; providerMessageId = result.providerMessageId ?? null; code = result.code ?? null
      } catch (error) { code = typeof (error as { code?: unknown })?.code === 'string' ? (error as { code: string }).code : 'invalid_message' }
    }
    await providerEvent(db, { id: `${m.messageId}:send`, at: new Date().toISOString(), commandId: c.commandId, provider: providerName(mail?.provider), jobId: row?.jobId ?? null, subjectKind: 'message', subjectId: m.messageId, ...(c.actor.reminderRun ? { recipientGuard: m.to } : {}), kind: `email.${status}`, summary: `${providerName(mail?.provider)} ${sentSummary[status] ?? 'answered'} (to ${m.to})`, data: { messageId: m.messageId, provider: mail?.provider ?? null, providerMessageId, status, code } }).run()
  }
}

const terminal = new Set(['delivered', 'bounced', 'complained', 'failed', 'rejected'])
export type MailState = { status: string; at: string; text: string; next: string | null; providerMessageId: string | null }

/** Each subject's provider facts folded in Base's terminal-state order (messages, and the owner's morning brief). */
export async function foldedFacts(db: D1Database, subjectKind: 'message' | 'brief') {
  const facts = (await db.prepare("SELECT subject_id AS id,kind,at,data FROM glove_events WHERE subject_kind=? AND actor_role='provider' AND kind LIKE 'email.%' AND kind<>'email.queued' ORDER BY sequence").bind(subjectKind).all<{ id: string; kind: string; at: string; data: string }>()).results
  const folded = new Map<string, { status: string; terminal: boolean; ms: number; at: string; providerMessageId: string | null }>()
  for (const f of facts) {
    const data = JSON.parse(f.data ?? '{}'), status = f.kind.replace(/^email\./, ''), at = data.occurredAt ?? f.at
    const next = { status, terminal: terminal.has(status), ms: Date.parse(at), at, providerMessageId: data.providerMessageId ?? null }
    const now = folded.get(f.id)
    if (!now) folded.set(f.id, next)
    else {
      const winner = (next.terminal && !now.terminal) || (next.ms > now.ms && (!now.terminal || next.terminal)) ? next : now
      folded.set(f.id, { ...winner, providerMessageId: now.providerMessageId ?? next.providerMessageId })
    }
  }
  return folded
}

/** The current state of every message, folded from its provider facts in Base's terminal-state order. */
export async function messageStates(db: D1Database, messages: Row[]): Promise<Map<string, MailState>> {
  const folded = await foldedFacts(db, 'message')
  return new Map(messages.map(m => {
    const f = folded.get(m.id)
    return [m.id, { ...label(f?.status ?? 'queued', m), at: f?.at ?? m.createdAt, providerMessageId: f?.providerMessageId ?? null }]
  }))
}

/** What the message's state says and what to do next; nothing beyond what the provider reported. */
export function label(status: string, m: Row) {
  const p = providerName(m.provider), link = ['bookingLink', 'quoteLink'].includes(m.kind), brief = m.kind === 'morningBrief'
  const again = m.kind === 'quoteLink' ? 'Revoke this link and issue a new customer quote link; Glove keeps no copy of the link to send again.' : link ? 'Revoke this link and make a new offer; Glove keeps no copy of the link to send again.' : brief ? 'Check the email connection; Glove does not retry, and sends the next brief on the next business-local date.' : null
  const texts: Record<string, [string, string | null]> = {
    queued: [`Queued: no answer from ${p} yet`, link ? again : `Check ${p}'s activity before sending again.`],
    accepted: [`Accepted by ${p}; delivery not yet reported`, null],
    deferred: [`Delayed: ${p} is still trying ${m.to}`, null],
    delivered: [`Delivered to ${m.to}'s mail server (reported by ${p})`, null],
    bounced: [`Bounced: ${m.to} did not accept it (reported by ${p})`, brief ? 'Check the owner\'s sign-in address; the brief is on the Today screen.' : link ? `Check the address with the customer, correct it, then ${again!.charAt(0).toLowerCase()}${again!.slice(1)}` : m.kind === 'purchaseOrder' ? 'Check the supplier\'s address and send the order again.' : 'Check the address with the customer, correct it on their record and send again.'],
    complained: [`Marked as spam by ${m.to} (reported by ${p})`, 'Do not email them again until they ask for it; call them instead.'],
    failed: [`Not delivered: ${p} gave up on ${m.to}`, again ?? 'Check the address and send again.'],
    rejected: [`Not sent: ${p} refused it`, again ?? `Check the email connection and the address, then send again.`],
    rate_limited: [`Not sent: ${p} is limiting sends`, again ?? 'Send again in a few minutes.'],
    uncertain: [`Outcome unknown: ${p} did not confirm it`, again ?? `Check ${p}'s activity before sending again.`],
    development: ['Not sent: suppressed in development', again ?? null],
  }
  const [text, next] = texts[status] ?? [`${p} reported ${status}`, null]
  return { status, text, next }
}

/** A customer whose latest finished email to an address on their record bounced or was marked as spam. */
export function emailWarnings(s: State, states: Map<string, MailState>) {
  const warnings: Record<string, { messageId: string; to: string; status: string; at: string; text: string; next: string | null }> = {}
  for (const customer of s.customers) {
    const addresses = new Set([customer.email, customer.apEmail].filter(Boolean).map((a: string) => a.toLowerCase()))
    const last = s.messages.filter(m => m.customerId === customer.id && addresses.has(m.to.toLowerCase()) && terminal.has(states.get(m.id)?.status ?? ''))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)
    const state = last && states.get(last.id)
    if (last && state && ['bounced', 'complained'].includes(state.status)) warnings[customer.id] = { messageId: last.id, to: last.to, status: state.status, at: state.at, text: state.text, next: state.next }
  }
  return warnings
}
