import { fail, text, bump, event, newId, business } from '../model'
import { vapidKeys, deviceKeys, pushEndpoint } from '../push'
import type { Handler } from './types'

// FIELD-004: the owner turns phone notifications on (a fresh VAPID key pair;
// the private key is an owner-only secret) or off; a Technician subscribes
// this phone in this signed-in session, or removes one of their own phones.
// Turning on again replaces the key, so every phone subscribes afresh.

export const push: Handler = async (c, type, p, db) => {
  switch (type) {
    case 'push.setup': {
      const b = business(c.s)
      c.sql.push({ sql: 'DELETE FROM glove_push_subscriptions', params: [] })
      if (p.off === true) {
        c.sql.push({ sql: "DELETE FROM glove_provider_keys WHERE provider='vapid'", params: [] })
        event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'push.disabled', summary: `${c.actor.name} turned off phone notifications; every phone's subscription was deleted`, data: null })
        return bump(c.s, 'business', b, { webPush: null })
      }
      const keys = await vapidKeys()
      c.sql.push({ sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('vapid',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [keys.privateJwk, c.actor.id, c.now] })
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'push.enabled', summary: `${c.actor.name} turned on phone notifications for technicians${b.webPush ? ' with a new key; phones subscribe again' : ''}`, data: null })
      return bump(c.s, 'business', b, { webPush: { publicKey: keys.publicKey, since: c.now, by: c.actor.name } })
    }
    case 'push.subscribe': {
      if (!business(c.s).webPush) fail('PUSH', 'The owner has not turned on phone notifications.')
      const endpoint = pushEndpoint(p.endpoint, !!c.local), keys = await deviceKeys(p.keys?.p256dh, p.keys?.auth)
      const id = newId(), device = text(p.device, 'device', { optional: true, max: 100 }) || 'Phone'
      c.sql.push({ sql: 'INSERT INTO glove_push_subscriptions(id,operator_id,session_id,device,endpoint,p256dh,auth,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET id=excluded.id,operator_id=excluded.operator_id,session_id=excluded.session_id,device=excluded.device,p256dh=excluded.p256dh,auth=excluded.auth,created_at=excluded.created_at,last_at=NULL,last_outcome=NULL', params: [id, c.actor.id, c.actor.sessionId, device, endpoint, keys.p256dh, keys.auth, c.now] })
      event(c, { jobId: null, subjectKind: 'push', subjectId: id, kind: 'push.subscribed', summary: `${c.actor.name} subscribed a phone to notifications`, data: { subscriptionId: id } })
      return { id, device }
    }
    case 'push.unsubscribe': {
      if (p.id === undefined && p.endpoint === undefined) fail('INPUT', 'Name the phone (id) or this browser\'s endpoint.', null, 400)
      const subscription = await db.prepare('SELECT id FROM glove_push_subscriptions WHERE operator_id=? AND (id=? OR endpoint=?)').bind(c.actor.id, String(p.id ?? ''), String(p.endpoint ?? '')).first<{ id: string }>()
      event(c, { jobId: null, subjectKind: 'push', subjectId: subscription?.id ?? c.actor.id, kind: 'push.unsubscribed', summary: `${c.actor.name} removed a phone notification subscription${subscription ? '' : ' (already absent)'}`, data: { subscriptionId: subscription?.id ?? null } })
      c.sql.push({ sql: 'DELETE FROM glove_push_subscriptions WHERE operator_id=? AND (id=? OR endpoint=?)', params: [c.actor.id, String(p.id ?? ''), String(p.endpoint ?? '')] })
      return { removed: true }
    }
  }
}
