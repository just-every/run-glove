import { useEffect, useState } from 'react'
import { send, when, type Failure, type Glove, type Rec, type Run } from './api'
import { Problem, useAction } from './controls'
import { can } from './roles'

// FIELD-004, FIELD-009, FIELD-010: phone notifications. The owner turns them on (Team); a
// technician subscribes this phone, sees their own phones and each one's last
// outcome, and removes any of them. Sign-out removes this phone's subscription.

const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
const deviceLabel = () => /iPhone|iPad/.test(navigator.userAgent) ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android phone' : 'This browser'
const keyBytes = (v: string) => Uint8Array.from(atob(v.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - v.length % 4) % 4)), ch => ch.charCodeAt(0))
const registration = () => navigator.serviceWorker.register('/glove-sw.js').then(() => navigator.serviceWorker.ready)

/** Sign-out: this browser's subscription is deleted on the server and in the browser. */
export async function forgetPush() {
  try {
    if (!supported()) return
    const subscription = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription()
    if (!subscription) return
    await send(crypto.randomUUID(), 'push.unsubscribe', { endpoint: subscription.endpoint })
    await subscription.unsubscribe()
  } catch { /* the server also deletes a signed-out session's subscriptions */ }
}

export function PhonePush({ s }: { s: Glove }) {
  const publicKey: string | undefined = s.business[0]?.webPush?.publicKey
  const [devices, setDevices] = useState<Rec[] | null>(null)
  const [here, setHere] = useState(false)
  const [error, setError] = useState<Failure | null>(null)
  const load = async () => {
    const response = await fetch('/api/glove/push', { credentials: 'same-origin', cache: 'no-store' }).catch(() => null)
    if (!response?.ok) return
    const body = await response.json() as { devices: Rec[] }
    const subscription = supported() ? await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription() : null
    setDevices(body.devices)
    setHere(!!subscription && body.devices.some(d => d.thisSession))
  }
  useEffect(() => { if (publicKey) void load() }, [publicKey])
  const command = async (type: string, payload: object) => {
    const { body } = await send(crypto.randomUUID(), type, payload)
    setError(body.ok ? null : body.error)
    return body.ok
  }
  const turnOn = async () => {
    if (await Notification.requestPermission() !== 'granted') { setError({ code: 'PERMISSION', message: 'Allow notifications for Glove in this phone\'s settings, then try again.' }); return }
    const reg = await registration()
    await (await reg.pushManager.getSubscription())?.unsubscribe()
    const subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey!) })
    const { endpoint, keys } = subscription.toJSON()
    if (await command('push.subscribe', { endpoint, keys, device: deviceLabel() })) await load()
  }
  const remove = async (d: Rec) => {
    const subscription = d.thisSession && supported() ? await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription() : null
    if (await command('push.unsubscribe', { id: d.id })) { await subscription?.unsubscribe(); await load() }
  }
  const zone = s.business[0]?.timezone ?? 'America/New_York'
  return <section className="card" aria-labelledby="push-title">
    <h2 id="push-title" className="section-title">Notifications</h2>
    {!publicKey ? <p className="muted">The owner has not turned on phone notifications.</p>
      : !supported() ? <p className="muted">This browser cannot show notifications. On an iPhone, add Glove to your Home Screen (Share, then Add to Home Screen) and open it from there.</p>
      : <>
        <p role="status">{here ? 'On for this phone: new, moved and canceled visits.' : 'Off for this phone.'}</p>
        {!here && <button onClick={() => void turnOn()}>Turn on notifications</button>}
        {!!devices?.length && <ul className="rows" aria-label="Your phones">{devices.map(d => <li key={d.id}><div><strong>{d.device}{d.thisSession ? ' (this phone)' : ''}</strong><p className="muted">{d.lastOutcome ? `${d.lastOutcome} · ${when(d.lastAt, zone)}` : 'Nothing sent yet'}</p></div><button className="quiet" onClick={() => void remove(d)}>Remove</button></li>)}</ul>}
      </>}
    <Problem error={error} />
  </section>
}

/** The owner's switch: a new key pair each time it is turned on; turning off deletes every phone's subscription. */
export function OwnerPush({ s, run }: { s: Glove; run: Run }) {
  const { error, act } = useAction()
  if (!can(s.actor, 'push.setup') || !s.business.length) return null
  const on = s.business[0].webPush, zone = s.business[0].timezone
  return <section className="panel" aria-labelledby="owner-push-title">
    <h2 id="owner-push-title">Phone notifications</h2>
    <p className="muted">{on ? `On since ${when(on.since, zone)} (turned on by ${on.by}).` : 'Off.'} Technicians who turn them on get a push for their new, moved and canceled visits. A push says only what changed, never the customer, address or time.</p>
    <Problem error={error} />
    <div className="actions">{on ? <button type="button" className="quiet" onClick={() => void act(run('push.setup', { off: true }))}>Turn off phone notifications</button> : <button type="button" onClick={() => void act(run('push.setup', {}))}>Turn on phone notifications</button>}</div>
  </section>
}
