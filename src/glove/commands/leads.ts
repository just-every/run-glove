import { fail, text, oneOf, find, expectVersion, bump, event, business } from '../model'
import { address, queueEmail } from '../mail'
import { cents, dollars } from '../money'
import { password, hash } from '../mail-callbacks'
import { providers, providerLabel, googleLeads, land } from '../leads'
import { who } from './dispatch'
import type { Handler } from './types'

// BOOK-004: the owner connects each lead source; the desk reads Google's new
// leads on demand (the scheduled run reads them every 15 minutes), sets or
// corrects a lead's cost, and records an acknowledgment sent outside Glove.

const DEFAULT_ACK = 'Thanks for contacting {business}! We received your request and will be in touch shortly.'
const upsertKey = "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES(?,?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at"

export const leads: Handler = async (c, type, p, db) => {
  switch (type) {
    case 'lead.connect': {
      const provider = oneOf(p.provider, providers, 'provider'), b = business(c.s), label = providerLabel[provider]
      if (p.disconnect === true) {
        c.sql.push({ sql: 'DELETE FROM glove_lead_secrets WHERE provider=?', params: [provider] }, { sql: 'DELETE FROM glove_provider_keys WHERE provider=?', params: [`leads-${provider}`] })
        const { [provider]: _gone, ...rest } = b.leads ?? {}
        event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'lead.disconnected', summary: `${label} leads disconnected by ${c.actor.name}`, data: { provider } })
        bump(c.s, 'business', b, { leads: rest })
        return { provider, connected: false }
      }
      const minutes = p.respondWithinMinutes ?? 60
      if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1440) fail('INPUT', 'respondWithinMinutes is a whole number of minutes from 5 to 1440.', { field: 'respondWithinMinutes' }, 400)
      const acknowledgment = text(p.acknowledgment ?? DEFAULT_ACK, 'acknowledgment', { max: 600 })
      let secret = '-', customerId: string | undefined
      if (provider === 'google') {
        customerId = String(p.customerId ?? '').replace(/-/g, '')
        if (!/^\d{10}$/.test(customerId)) fail('INPUT', 'customerId is the 10-digit Google Ads customer ID.', { field: 'customerId' }, 400)
        const credentials = { customerId, developerToken: text(p.developerToken, 'developerToken', { max: 200 }), clientId: text(p.clientId, 'clientId', { max: 300 }), clientSecret: text(p.clientSecret, 'clientSecret', { max: 300 }), refreshToken: text(p.refreshToken, 'refreshToken', { max: 1000 }) }
        c.sql.push({ sql: upsertKey, params: ['leads-google', JSON.stringify(credentials), c.actor.id, c.now] })
      } else {
        if (provider === 'yelp') c.sql.push({ sql: upsertKey, params: ['leads-yelp', text(p.apiKey, 'apiKey', { max: 500 }), c.actor.id, c.now] })
        // The lead door's password: shown in this response only, kept as its SHA-256 hash.
        const shown = password()
        secret = await hash(shown)
        c.reveal = { password: shown }
      }
      c.sql.push({ sql: 'INSERT INTO glove_lead_secrets(provider,hash,set_by,set_at) VALUES(?,?,?,?) ON CONFLICT(provider) DO UPDATE SET hash=excluded.hash,set_by=excluded.set_by,set_at=excluded.set_at', params: [provider, secret, c.actor.id, c.now] })
      bump(c.s, 'business', b, { leads: { ...(b.leads ?? {}), [provider]: { connectedAt: c.now, by: c.actor.name, respondWithinMinutes: minutes, acknowledgment, ...(customerId ? { customerId } : {}) } } })
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'lead.connected', summary: `${label} leads connected by ${c.actor.name}; acknowledgments due within ${minutes} minutes`, data: { provider, respondWithinMinutes: minutes } })
      return { provider, connected: true, callback: provider === 'google' ? null : { url: `${c.origin}/api/glove/leads/${provider}`, user: 'glove' } }
    }
    case 'lead.pull': {
      if (oneOf(p.provider, ['google'] as const, 'provider') && !business(c.s).leads?.google) fail('LEADS', 'The owner connects Google Local Services first.', null, 404)
      const landed = []
      for (const lead of await googleLeads(db)) { const row = await land(c, db, lead); if (row) landed.push(row.id) }
      event(c, { jobId: null, subjectKind: 'business', subjectId: business(c.s).id, kind: 'lead.read', summary: `${c.actor.name} read Google Local Services: ${landed.length} new lead${landed.length === 1 ? '' : 's'}`, data: { provider: 'google', landed: landed.length } })
      return { provider: 'google', landed }
    }
    case 'enquiry.cost': {
      const request = find(c.s, 'enquiries', p.enquiryId)
      expectVersion(request, p.version)
      const amount = dollars(cents(p.amount, 'amount'))
      if (cents(amount, 'amount') <= 0) fail('INPUT', 'A lead cost is more than $0.00.', { field: 'amount' }, 400)
      const row = bump(c.s, 'enquiries', request, { leadCost: { amount, by: 'person', person: who(c), at: c.now } })
      event(c, { jobId: null, subjectKind: 'enquiry', subjectId: row.id, kind: 'enquiry.cost', summary: `${c.actor.name} set the lead cost to $${amount}${request.leadCost ? ` (was $${request.leadCost.amount})` : ''}`, data: { amount } })
      return row
    }
    case 'enquiry.reply': {
      const request = find(c.s, 'enquiries', p.enquiryId)
      expectVersion(request, p.version)
      if (p.confirm !== true) fail('CONSENT', 'Explicitly approve this acknowledgment before sending it.', null, 400)
      if (request.acknowledgment?.status !== 'queued') fail('ACKNOWLEDGMENT', 'This request has no queued acknowledgment.')
      if (request.lead?.provider !== 'yelp' || !business(c.s).leads?.yelp) fail('LEADS', 'Only a connected Yelp lead has this reply path.', null, 400)
      const reply = request.lead.reply
      if (!reply?.expiresAt || Date.parse(reply.expiresAt) <= Date.parse(c.now)) fail('LEAD_REPLY', 'Yelp has no unexpired reply address for this request. Reply in Yelp instead.', null, 400)
      const to = address(reply.address, 'Yelp reply address')
      const message = queueEmail(c, { kind: 'leadReply', subjectKind: 'enquiry', subjectId: request.id, customerId: request.customerId, jobId: null, to, subject: `Reply from ${business(c.s).name}`, text: request.acknowledgment.text, label: 'the approved Yelp acknowledgment' })
      const row = bump(c.s, 'enquiries', request, { acknowledgment: { ...request.acknowledgment, status: 'emailQueued', messageId: message.id, approvedAt: c.now, by: who(c) } })
      event(c, { jobId: null, subjectKind: 'enquiry', subjectId: row.id, kind: 'enquiry.replyApproved', summary: `${c.actor.name} explicitly approved one Yelp acknowledgment through its masked email channel; delivery is not confirmed`, data: { messageId: message.id, provider: 'yelp', approvedWithinWindow: c.now <= request.acknowledgment.dueBy } })
      return row
    }
    case 'enquiry.acknowledged': {
      const request = find(c.s, 'enquiries', p.enquiryId)
      expectVersion(request, p.version)
      if (request.acknowledgment?.status !== 'queued') fail('ACKNOWLEDGMENT', 'This request has no queued acknowledgment.')
      const row = bump(c.s, 'enquiries', request, { acknowledgment: { ...request.acknowledgment, status: 'sent', sentAt: c.now, by: who(c), how: text(p.how, 'how', { optional: true, max: 200 }) } })
      event(c, { jobId: null, subjectKind: 'enquiry', subjectId: row.id, kind: 'enquiry.acknowledged', summary: `${c.actor.name} recorded the ${request.acknowledgment.channel} acknowledgment as sent outside Glove${c.now > request.acknowledgment.dueBy ? ', after its response window' : ''}`, data: { onTime: c.now <= request.acknowledgment.dueBy } })
      return row
    }
  }
}
