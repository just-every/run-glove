import { customerMailSender } from './mail-send'
import { foldedFacts, isAddress, label, providerName } from './mail'
import { morningBrief } from './morning-brief'
import { load } from './storage'
import { localParts } from './time'
import { providerEvent } from './timeline'
import type { Bindings } from '../auth.server'
import { runtimeBindings } from '../auth.server'
import { Problem, type Row } from './model'
import { pullGoogle } from './leads'

// COMM-001 inherits AGENT-008's morning email. When the owner turns it on
// (mail.morning), the scheduled run that first finds the business-local time at
// or past the owner's chosen time on a local date emails that date's brief to
// the owner's sign-in address through the connected provider. The date's queued
// fact is claimed once in the timeline (a replayed or concurrent run changes
// nothing and sends nothing), the provider's answer and its signed delivery
// events are provider facts on that date (DATA-002), and nothing is retried:
// a failed date stays failed. Opening the brief still sends nothing.

const lineOf = (x: { text: string; action: { label: string; href: string } }) => `- ${x.text} (${x.action.label})`
const titles: [string, string][] = [['atRisk', 'At risk today'], ['unbilled', 'Unbilled work'], ['overEstimate', 'Over their cost estimate'], ['leads', 'Leads waiting'], ['agreements', 'Agreement visits due']]

function briefText(name: string, brief: ReturnType<typeof morningBrief>) {
  const sections = titles.map(([key, title]) => `${title}\n${(brief.sections as Record<string, any[]>)[key].map(lineOf).join('\n') || 'Nothing here.'}`).join('\n\n')
  return `${name} morning brief for ${brief.date}, prepared by ${brief.preparedBy}. It is read only; open Glove to act on any item.\n\n${sections}\n\n${brief.notTracked.join('\n')}`
}

/** The result of one scheduled run: what it did and why, for tests and logs. */
export type Delivery = 'off' | 'not_connected' | 'early' | 'no_owner' | 'already' | 'sent'

export async function deliverMorningBrief(db: D1Database, at: string): Promise<Delivery> {
  const s = await load(db), b = s.business[0], mail = b?.mail
  if (!mail?.morning?.enabled) return 'off'
  const key = (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='mail'").first<{ value: string }>())?.value
  if (!key) return 'not_connected'
  const { date, time } = localParts(at, b.timezone)
  if (time < mail.morning.time) return 'early'
  const owner = (await db.prepare("SELECT email FROM oa_operators WHERE role='owner' AND status='active' ORDER BY created_at LIMIT 1").first<{ email: string }>())?.email
  if (!owner || !isAddress(owner)) return 'no_owner'
  const id = `brief:${date}`, subject = `Morning brief for ${date} from ${b.name}`
  const claim = await providerEvent(db, { id: `${id}:queued`, at: new Date().toISOString(), commandId: id, provider: 'Glove', subjectKind: 'brief', subjectId: id, kind: 'email.queued', summary: `Glove emailed the ${date} morning brief to the owner at ${owner} through ${providerName(mail.provider)}; delivery is not yet reported`, data: { date, to: owner, provider: mail.provider, subject } }).run()
  if (!claim.meta.changes) return 'already'
  let status = 'rejected', providerMessageId: string | null = null, code: string | null = null
  try {
    const sender = customerMailSender(mail, key)
    const result = await sender.send({ deliveryId: id, from: mail.fromName ? `${mail.fromName} <${mail.fromEmail}>` : mail.fromEmail, to: [owner], subject, text: briefText(b.name, morningBrief(s, at)) })
    status = result.status; providerMessageId = result.providerMessageId ?? null; code = result.code ?? null
  } catch (error) { code = typeof (error as { code?: unknown })?.code === 'string' ? (error as { code: string }).code : 'invalid_message' }
  const said: Record<string, string> = { accepted: 'accepted the email; delivery is not yet reported', rejected: 'refused the email', rate_limited: 'is limiting sends and did not take the email', uncertain: 'did not confirm the email', development: 'suppressed the email (development mode)' }
  await providerEvent(db, { id: `${id}:send`, at: new Date().toISOString(), commandId: id, provider: providerName(mail.provider), subjectKind: 'brief', subjectId: id, kind: `email.${status}`, summary: `${providerName(mail.provider)} ${said[status] ?? 'answered'} (the ${date} morning brief to ${owner})`, data: { date, provider: mail.provider, providerMessageId, status, code } }).run()
  return 'sent'
}

/** Cloudflare cron entry: every run delivers what is due for the instant it was scheduled. */
export function scheduled(controller: { scheduledTime: number }, env: Bindings, execution: { waitUntil(p: Promise<unknown>): void }) {
  const db = runtimeBindings(env).DB, at = new Date(controller.scheduledTime).toISOString()
  execution.waitUntil(deliverMorningBrief(db, at))
  // BOOK-004: Google's Local Services leads have no push; each run reads the new ones, and a failed read is on the record.
  execution.waitUntil(pullGoogle(db).catch(error => providerEvent(db, { id: `leads:google:${at}`, at, commandId: `leads:google:${at}`, provider: 'Google Local Services', subjectKind: 'business', subjectId: 'business', kind: 'lead.readFailed', summary: `Google Local Services leads could not be read: ${error instanceof Problem ? error.message : 'unexpected error'}`, data: { provider: 'google' } }).run()))
}

/** The owner's morning email for a business-local date, as the provider's facts say it stands. */
export async function emailedBrief(db: D1Database, mail: Row | null | undefined, date: string) {
  if (!mail?.morning?.enabled) return { enabled: false as const }
  const queued = await db.prepare("SELECT data FROM glove_events WHERE id=?").bind(`brief:${date}:queued`).first<{ data: string }>()
  const base = { enabled: true as const, time: mail.morning.time as string, date }
  if (!queued) return { ...base, status: 'scheduled', text: `Scheduled for ${mail.morning.time} business time; not yet sent`, next: null }
  const data = JSON.parse(queued.data), fact = (await foldedFacts(db, 'brief')).get(`brief:${date}`)
  return { ...base, to: data.to as string, at: fact?.at ?? null, ...label(fact?.status ?? 'queued', { id: `brief:${date}`, version: 1, kind: 'morningBrief', provider: data.provider, to: data.to }) }
}
