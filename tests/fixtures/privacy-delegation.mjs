import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { scenario } from './scenario.mjs'
import { installation, business } from '../api/harness.mjs'

const email = name => [name, 'example.test'].join('@')

async function tables(h) {
  const names = (await h.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name GLOB 'glove_*' OR name GLOB 'rer_*') ORDER BY name").all()).results.map(r => r.name)
  const stores = Object.fromEntries(await Promise.all(names.map(async name => [name, (await h.db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all()).results])))
  // Presenting a token stamps its last use; that is not a privacy record.
  stores.glove_tokens = stores.glove_tokens.map(({ last_used_at, ...token }) => token)
  return stores
}

/** A customer with personal values on the customer, site, request and conversation. */
async function group(h, n) {
  const street = ['Alpha', 'Bravo'][n - 1]
  const customer = await h.command('customer.save', { name: `Synthetic delegation customer ${n}`, email: email(`synthetic-glove-delegation-${n}`), phone: `02 9555 07${n}0`, contact: `Synthetic delegation contact ${n}`, billingAddress: `${n}0 Synthetic ${street} Road` })
  const site = await h.command('site.save', { customerId: customer.id, address: `${n}1 Synthetic ${street} Lane`, contact: `Synthetic delegation site contact ${n}` })
  const enquiry = await h.command('enquiry.create', { customerId: customer.id, siteId: site.id, description: `Synthetic delegation request ${n}`, source: 'phone' })
  const conversation = await h.command('conversation.log', { customerId: customer.id, kind: 'note', text: `Synthetic delegation conversation ${n}` })
  return { customer, site, enquiry, conversation, values: [customer.name, customer.email, customer.phone, customer.contact, customer.billingAddress, site.address, site.contact, `Synthetic delegation request ${n}`, `Synthetic delegation conversation ${n}`] }
}

const current = async (h, id) => (await h.state()).customers.find(c => c.id === id)
const send = (h, who, type, payload, commandId = randomUUID()) => h.request('/api/glove/commands', { method: 'POST', as: who.cookie ?? '', ...(who.token ? { headers: { authorization: `Bearer ${who.token}` } } : {}), body: { commandId, type, payload } })
const outcome = async response => ({ status: response.status, code: (await response.json()).error?.code ?? null })

// DATA-008 point 1: the confirming person is a signed-in Owner without a branch limit.
export async function ownerConfirmationQualification(t) {
  const h = await installation({ at: '2026-11-09T02:00:00Z' })
  t.after(() => h.close())
  await business(h)
  const target = await group(h, 1), peer = await group(h, 2)
  const installationOwner = (await (await h.request('/auth/session')).json()).operator
  const second = await h.person('Synthetic second owner', 'owner')
  assert.notEqual(second.id, installationOwner.id)
  await scenario(t, 'DATA-008 point 1: a second unscoped Owner previews, exports and confirms erasure, and every record names that Owner', async () => {
    const version = (await current(h, target.customer.id)).version
    const preview = await second.run('privacy.preview', { customerId: target.customer.id, version })
    const exported = await second.run('privacy.export', { customerId: target.customer.id, version })
    const download = JSON.parse(exported.download)
    assert.deepEqual(download.customerIds, [target.customer.id])
    for (const value of target.values) assert.ok(JSON.stringify(download).includes(value), `the Owner's export carries ${value}`)
    const refused = await send(h, second, 'privacy.erase', { customerId: target.customer.id, version, confirm: 'NO', fingerprint: preview.fingerprint })
    assert.equal((await outcome(refused)).code, 'CONSENT')
    const fresh = await second.run('privacy.preview', { customerId: target.customer.id, version })
    const receipt = await second.run('privacy.erase', { customerId: target.customer.id, version, confirm: 'ERASE', fingerprint: fresh.fingerprint })
    assert.equal(receipt.outcome, 'complete')
    assert.deepEqual(receipt.by, { id: second.id, name: second.name })
    const activity = (await (await h.request('/api/glove/activity')).json()).events.filter(e => e.kind.startsWith('privacy.'))
    for (const kind of ['privacy.preview', 'privacy.export', 'privacy.erase']) {
      const entries = activity.filter(e => e.kind === kind)
      assert.ok(entries.length, `${kind} is in Activity`)
      assert.ok(entries.every(e => e.actorId === second.id && e.actorName === second.name && e.actorId !== installationOwner.id), `${kind} names the confirming Owner`)
    }
    const exportRows = JSON.parse(await (await h.request('/api/glove/export')).text())
    const row = exportRows.privacyRequests.find(r => r.id === receipt.id)
    assert.deepEqual(row.by, { id: second.id, name: second.name })
    assert.ok(exportRows.privacyRequests.every(r => r.by.id === second.id), 'no privacy request names the installation owner')
    const after = await h.state()
    assert.equal(after.customers.find(c => c.id === target.customer.id).erasedAt, receipt.createdAt)
    assert.ok(!JSON.stringify(after).includes(target.customer.email))
    assert.equal(after.customers.find(c => c.id === peer.customer.id).name, peer.customer.name, 'the peer keeps its record')
  })
  const refusals = [
    ['branch.limit', 'limited', async who => { await h.command('branch.limit', { operatorId: who.id, branchId: 'main' }) }, 403],
    ['role.set away from Owner between preview and commit', 'demoted', async who => { await h.command('role.set', { operatorId: who.id, role: 'dispatcher' }) }, 403],
    ['sign-out', 'departed', async who => { assert.equal((await h.request('/auth/signout', { method: 'POST', as: who.cookie, body: {} })).status, 204) }, 401],
  ]
  for (const [name, label, change, status] of refusals) await scenario(t, `DATA-008 point 1: an Owner's confirmation after ${name} is refused with every record unchanged`, async () => {
    const who = await h.person(`Synthetic ${label} owner`, 'owner')
    const version = (await current(h, peer.customer.id)).version
    await who.run('privacy.preview', { customerId: peer.customer.id, version })
    await change(who)
    // The installation owner's preview supplies the current fingerprint, so only authority can refuse.
    const fresh = await h.command('privacy.preview', { customerId: peer.customer.id, version })
    const before = await tables(h)
    for (const type of ['privacy.erase', 'privacy.export', 'privacy.preview']) {
      const response = await send(h, who, type, { customerId: peer.customer.id, version, confirm: 'ERASE', fingerprint: fresh.fingerprint })
      assert.equal(response.status, status, `${type} after ${name}`)
      assert.deepEqual(await tables(h), before, 'the refused command changes no stored record')
    }
    const record = await current(h, peer.customer.id)
    assert.equal(record.erasedAt, undefined)
    const dump = JSON.stringify(await h.state()); for (const value of peer.values) assert.ok(dump.includes(value), `${value} remains ${JSON.stringify((await h.state()).sites)}`)
  })
}

// DATA-008 point 4: a token or agent never records a person's confirmation.
export async function tokenAgentQualification(t) {
  const h = await installation({ at: '2026-11-09T02:00:00Z' })
  t.after(() => h.close())
  const b = await business(h)
  const done = await group(h, 1), held = await group(h, 2)
  const role = await h.command('role.save', { name: 'Synthetic privacy deputy', permissions: ['customer.save'] })
  const custom = await h.person('Synthetic privacy deputy', `custom:${role.id}`)
  const tokens = []
  for (const [name, kind] of [['agent', 'agent'], ['office', 'office'], ['custom', `custom:${role.id}`]]) tokens.push({ name: `${name} token`, token: (await h.command('token.issue', { name: `Synthetic ${name} privacy token`, role: kind })).token })
  const callers = [...tokens, { name: 'native Agent person', ...b.agent }, { name: 'custom-role person', ...custom }]
  // An unscoped Owner passes the role door, so only the stored command identity stops that person.
  const otherOwner = await h.person('Synthetic other owner', 'owner'), limitedOwner = await h.person('Synthetic limited owner', 'owner')
  await h.command('branch.limit', { operatorId: limitedOwner.id, branchId: 'main' })
  const owners = [{ name: 'second Owner', ...otherOwner }]
  callers.push({ name: 'branch-limited Owner', ...limitedOwner })
  const erase = { customerId: done.customer.id, version: (await current(h, done.customer.id)).version, confirm: 'ERASE' }
  const commandId = randomUUID()
  let before, results, preview
  await scenario(t, 'DATA-008 point 4: Agent, Office and custom tokens, the native Agent and a branch-limited Owner are refused every privacy command and nothing is recorded', async () => {
    const heldVersion = (await current(h, held.customer.id)).version
    const preview = await h.command('privacy.preview', { customerId: held.customer.id, version: heldVersion })
    before = await tables(h)
    results = []
    for (const who of callers) for (const type of ['privacy.preview', 'privacy.export', 'privacy.erase']) {
      const response = await send(h, who, type, { customerId: held.customer.id, version: heldVersion + 1, confirm: 'ERASE', fingerprint: preview.fingerprint })
      const result = await outcome(response)
      assert.deepEqual(result, { status: 403, code: 'FORBIDDEN' }, `${who.name} ${type}`)
      results.push(result)
    }
    assert.deepEqual(await tables(h), before, 'no receipt, event, saved command outcome or erased value')
    const state = await h.state()
    assert.equal(state.privacyRequests?.length ?? 0, 0)
    for (const value of held.values) assert.ok(JSON.stringify(state).includes(value), `${value} remains`)
  })
  await scenario(t, "DATA-008 point 4: reusing the Owner's committed erasure command identity is refused and records nothing; the role door stops a token or Agent first and the stored identity stops another Owner", async () => {
    preview = await h.command('privacy.preview', { customerId: done.customer.id, version: erase.version })
    const receipt = await h.command('privacy.erase', { ...erase, fingerprint: preview.fingerprint }, { commandId })
    assert.equal(receipt.by.id, (await (await h.request('/auth/session')).json()).operator.id)
    before = await tables(h)
    results = []
    for (const who of callers) {
      const response = await send(h, who, 'privacy.erase', { ...erase, fingerprint: preview.fingerprint }, commandId)
      const result = await outcome(response)
      assert.deepEqual(result, { status: 403, code: 'FORBIDDEN' }, `${who.name} is stopped before the identity is read`)
      results.push(result)
    }
    for (const who of owners) {
      const result = await outcome(await send(h, who, 'privacy.erase', { ...erase, fingerprint: preview.fingerprint }, commandId))
      assert.equal(result.code, 'IDEMPOTENCY', `${who.name} reusing the identity`)
      results.push(result)
    }
    assert.deepEqual(await tables(h), before, 'the replays record nothing')
    assert.equal((await h.state()).privacyRequests.filter(r => r.action === 'erase').length, 1)
  })
  await scenario(t, 'DATA-008 point 4: refusals are identical after an actual Worker restart', async () => {
    const first = results
    await h.restart()
    assert.deepEqual(await tables(h), before, 'stored records survive the restart')
    results = []
    for (const who of [...callers, ...owners]) results.push(await outcome(await send(h, who, 'privacy.erase', { ...erase, fingerprint: preview.fingerprint }, commandId)))
    assert.deepEqual(results, first, 'the committed identity is still refused after restart')
    const heldVersion = (await current(h, held.customer.id)).version
    for (const who of callers) for (const type of ['privacy.preview', 'privacy.export', 'privacy.erase']) assert.deepEqual(await outcome(await send(h, who, type, { customerId: held.customer.id, version: heldVersion, confirm: 'ERASE', fingerprint: 'stale' })), { status: 403, code: 'FORBIDDEN' }, `${who.name} ${type} after restart`)
    assert.deepEqual(await tables(h), before)
  })
}
