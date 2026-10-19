import { Problem, fail, text, oneOf, find, put, bump, event, newId, business, type Context, type Row } from '../model'
import { providerEvent } from '../timeline'
import { members } from '../segments'
import type { Handler } from './types'

// Pushing a segment to Mango or Mailchimp as an audience (CUST-004). The owner
// connects a provider with its key, kept in glove_provider_keys (never in
// records, exports, logs or the archive). Glove holds no marketing consent, so
// a push never subscribes anyone: Mango's integration API syncs the contact
// without `subscribe`, Mailchimp adds new members as "transactional"; existing
// unsubscribes stay the provider's. Members without an email, and members
// tagged "do not contact", are skipped and counted (opt-out records come with
// COMM-002); every push is recorded with its counts and the provider's answers.

export const providers = ['mango', 'mailchimp'] as const
type Provider = (typeof providers)[number]

const https = (v: unknown, name: string) => { try { const u = new URL(String(v)); return u.protocol === 'https:' && !u.username && !u.password ? u.origin : fail('INPUT', `${name} is an https address.`, { field: name }, 400) } catch { return fail('INPUT', `${name} is an https address.`, { field: name }, 400) } }

async function md5(email: string) {
  const digest = await crypto.subtle.digest('MD5', new TextEncoder().encode(email.toLowerCase()))
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function send(provider: Provider, settings: Row, key: string, segment: Row, c: Row): Promise<number> {
  if (provider === 'mango') {
    const res = await fetch(`${settings.url}/api/integrations/v1/contacts`, { method: 'PUT', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ email: c.email, displayName: c.name, segmentName: segment.name, tags: c.tags ?? [] }) })
    return res.status
  }
  const dc = key.split('-').pop(), base = `https://${dc}.api.mailchimp.com/3.0/lists/${settings.listId}/members/${await md5(c.email)}`, auth = `Basic ${btoa(`glove:${key}`)}`
  const member = await fetch(base, { method: 'PUT', headers: { authorization: auth, 'content-type': 'application/json' }, body: JSON.stringify({ email_address: c.email, status_if_new: 'transactional', merge_fields: { FNAME: c.name } }) })
  if (!member.ok) return member.status
  const tags = await fetch(`${base}/tags`, { method: 'POST', headers: { authorization: auth, 'content-type': 'application/json' }, body: JSON.stringify({ tags: [segment.name, ...(c.tags ?? [])].map(name => ({ name, status: 'active' })) }) })
  return tags.ok ? 200 : tags.status
}

export const marketing: Handler = async (c, type, p, db) => {
  switch (type) {
    case 'marketing.connect': {
      const provider = oneOf(p.provider, providers, 'provider'), b = business(c.s)
      if (p.key === null) {
        c.sql.push({ sql: 'DELETE FROM glove_provider_keys WHERE provider=?', params: [provider] })
        event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'marketing.disconnected', summary: `${c.actor.name} disconnected ${provider === 'mango' ? 'Mango' : 'Mailchimp'}`, data: null })
        return bump(c.s, 'business', b, { marketing: { ...(b.marketing ?? {}), [provider]: null } })
      }
      const key = text(p.key, 'key', { max: 200 })
      if (provider === 'mailchimp' && !/-[a-z]{2}\d{1,3}$/.test(key)) fail('INPUT', 'A Mailchimp API key ends with its data center, such as -us21.', { field: 'key' }, 400)
      const settings = provider === 'mango' ? { url: https(p.url, 'url') } : { listId: text(p.listId, 'listId', { max: 40 }) }
      c.sql.push({ sql: 'INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES(?,?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at', params: [provider, key, c.actor.id, c.now] })
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'marketing.connected', summary: `${c.actor.name} connected ${provider === 'mango' ? 'Mango' : 'Mailchimp'}`, data: null })
      return bump(c.s, 'business', b, { marketing: { ...(b.marketing ?? {}), [provider]: { ...settings, connectedAt: c.now, by: c.actor.name } } })
    }
    case 'segment.push': {
      const provider = oneOf(p.provider, providers, 'provider'), segment = find(c.s, 'segments', p.segmentId), settings = business(c.s).marketing?.[provider]
      const key = settings && (await db.prepare('SELECT value FROM glove_provider_keys WHERE provider=?').bind(provider).first<{ value: string }>())?.value
      if (!settings || !key) fail('MARKETING', `Connect ${provider === 'mango' ? 'Mango' : 'Mailchimp'} first.`)
      const list = members(c.s, segment), withEmail = list.filter(x => x.email)
      const doNotContact = (x: Row) => (x.tags ?? []).some((t: string) => t.toLowerCase() === 'do not contact')
      const sendable = withEmail.filter(x => !doNotContact(x))
      const answers: { customerId: string; status: number }[] = []
      for (const customer of sendable) {
        // The key is a credential: a failure records the HTTP status only.
        try { answers.push({ customerId: customer.id, status: await send(provider, settings, key!, segment, customer) }) }
        catch (error) { if (error instanceof Problem) throw error; answers.push({ customerId: customer.id, status: 0 }) }
      }
      for (const answer of answers) await providerEvent(db, { id: `${c.commandId}:marketing:${answer.customerId}`, at: c.now, commandId: c.commandId, provider: provider === 'mango' ? 'Mango' : 'Mailchimp', subjectKind: 'segment', subjectId: segment.id, kind: 'marketing.outcome', summary: `${provider === 'mango' ? 'Mango' : 'Mailchimp'} audience sync: ${answer.status ? `HTTP ${answer.status}` : 'outcome not confirmed'}`, data: { segmentId: segment.id, customerId: answer.customerId, status: answer.status } }).run()
      const pushed = answers.filter(a => a.status >= 200 && a.status < 300).length
      const row = put(c.s, 'pushes', { id: newId(), version: 1, createdAt: c.now, by: { id: c.actor.id, name: c.actor.name }, segmentId: segment.id, segment: segment.name, provider, members: list.length, pushed, skippedNoEmail: list.length - withEmail.length, skippedDoNotContact: withEmail.length - sendable.length, failed: answers.filter(a => a.status < 200 || a.status >= 300) })
      event(c, { jobId: null, subjectKind: 'segment', subjectId: segment.id, kind: 'segment.pushed', summary: `${c.actor.name} pushed "${segment.name}" to ${provider === 'mango' ? 'Mango' : 'Mailchimp'}: ${pushed} of ${list.length} member${list.length === 1 ? '' : 's'} sent, none subscribed${row.skippedNoEmail ? `, ${row.skippedNoEmail} without an email skipped` : ''}${row.skippedDoNotContact ? `, ${row.skippedDoNotContact} tagged do not contact skipped` : ''}${row.failed.length ? `, ${row.failed.length} refused by the provider` : ''}`, data: null })
      return row
    }
  }
}
