// A three-week native installation: people sign in again as their seven-day
// sessions end. Only delivery of their real emailed links is a network fake.
import assert from 'node:assert/strict'
import { installation } from '../api/harness.mjs'

export async function commissionInstallation() {
  const native = await installation({ at: '2026-11-01T13:05:00Z' })
  let owner = native.owner()
  const ownerEmail = (await native.request('/auth/session').then(r => r.json())).operator.email
  const h = Object.create(native)
  h.request = (path, opts = {}) => native.request(path, { as: owner, ...opts })
  h.command = (type, payload, opts = {}) => native.command(type, payload, { as: owner, ...opts })
  h.state = (as = owner) => native.state(as)
  h.owner = () => owner
  const signIn = async email => {
    const sent = await native.request('/auth/magic-link', { as: '', method: 'POST', body: { email } })
    assert.equal(sent.status, 202)
    const mail = native.mails.findLast(m => m.to?.includes(email))
    const token = String(mail?.text).match(/https:[^\s]+\/auth\/confirm\?token=([^\s]+)/)?.[1]
    assert.ok(token, 'a native sign-in link was delivered')
    const confirmed = await native.request('/auth/confirm', { as: '', method: 'POST', body: { token: decodeURIComponent(token) } })
    assert.equal(confirmed.status, 303)
    return confirmed.headers.getSetCookie().map(v => v.split(';')[0]).join('; ')
  }
  h.renewSessions = async b => {
    owner = await signIn(ownerEmail)
    for (const key of ['dispatcher', 'office', 'priyaPerson', 'tomPerson']) {
      const person = b[key], cookie = await signIn(person.session.operator.email)
      b[key] = { ...person, cookie, run: (type, payload, opts = {}) => h.command(type, payload, { as: cookie, ...opts }), state: () => h.state(cookie) }
    }
  }
  return h
}
