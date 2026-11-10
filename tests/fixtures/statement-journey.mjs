// PAY-010: shared world and readers for the customer statement steps in the
// PAY-001 family registration of tests/api/flows.test.mjs. Every number a step
// asserts is enumerated independently in the step, never computed from a
// statement. Mail, Stripe and the clock are the harness's own doors.
import assert from 'node:assert/strict'
import { csvRows } from './branch-projections.mjs'
import { installation } from '../api/harness.mjs'
import { paymentEvent } from './payment-journey.mjs'

export const csvHeader = ['Customer', 'As of', 'Currency', 'Invoice', 'Revision', 'Issued', 'Due', 'Total', 'Confirmed net payments', 'Amount due', 'Credit', 'Balance', 'Basis']
export const statementPath = (customerId, format = 'json') => `/api/glove/customers/${customerId}/statement.${format}`

/** One statement as JSON and as CSV through the HTTP doors, with the CSV parsed against the JSON rows. */
export async function readStatement(h, customerId, asOf, who = {}) {
  const query = asOf ? `?asOf=${asOf}` : ''
  const options = who.cookie !== undefined ? { as: who.cookie } : who.headers ? { as: '', headers: who.headers } : {}
  const jsonResponse = await h.request(statementPath(customerId) + query, options)
  assert.equal(jsonResponse.status, 200, await jsonResponse.clone().text())
  const csvResponse = await h.request(statementPath(customerId, 'csv') + query, options)
  assert.equal(csvResponse.status, 200)
  assert.match(csvResponse.headers.get('content-type'), /^text\/csv/)
  const json = await jsonResponse.json(), rows = csvRows(await csvResponse.text())
  assertCsvMatchesJson(json, rows)
  return json
}

/** Every CSV column parses back to the JSON row it came from, in the same order. */
export function assertCsvMatchesJson(json, rows) {
  assert.deepEqual(rows[0], csvHeader)
  assert.equal(rows.length - 1, json.invoices.length, 'one CSV row per JSON invoice row')
  // The CSV writer prefixes a cell a spreadsheet would run as a formula (a negative balance) with an apostrophe.
  const cell = value => /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  json.invoices.forEach((i, n) => assert.deepEqual(rows[n + 1], [json.customer.name, json.asOf, i.currency, i.number, String(i.revision), i.issuedOn, i.dueOn, i.total, i.paid, i.due, i.credit, i.balance, i.basis].map(cell)))
}

/** A refused statement read: status and code, with no statement body. */
export async function refusedStatement(h, customerId, status, who = {}, format = 'json') {
  const options = who.cookie !== undefined ? { as: who.cookie } : who.headers ? { as: '', headers: who.headers } : {}
  const response = await h.request(statementPath(customerId, format) + '?asOf=2026-11-30', options)
  const text = await response.text()
  assert.equal(response.status, status, text)
  assert.ok(!text.includes('"invoices"') && !text.startsWith('Customer,'), 'a refused read carries no statement')
  return JSON.parse(text).error?.code
}

/** What a read must leave exactly as it was: state version, Activity, every Glove table row count, mail and provider calls. */
async function footprint(h) {
  const state = await h.state(), activity = await (await h.request('/api/glove/activity')).json()
  const tables = (await h.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'glove\\_%' ESCAPE '\\' OR name LIKE 'ik\\_%' ESCAPE '\\') ORDER BY name").all()).results.map(r => r.name)
  const counts = {}
  for (const name of tables) counts[name] = (await h.db.prepare(`SELECT COUNT(*) AS n FROM ${name}`).first()).n
  return { version: state.version, invoices: state.invoices.length, payments: state.payments.length, events: activity.events.length, counts, sent: h.email.sent.length, stripe: h.stripePayments.calls.length, sessions: h.stripePayments.sessions.length }
}
export async function untouched(h, read) {
  const before = await footprint(h)
  await read()
  assert.deepEqual(await footprint(h), before, 'a statement read changes no state, creates no credential, link, invoice or message and calls no payment provider')
}

/** A USD business in UTC plus an America/Chicago branch, each with its own customer, site and technician. */
export async function statementWorld(h, { currency = 'USD' } = {}) {
  await h.command('business.save', { name: 'Statement Service Co', currency, timezone: 'UTC', paymentTermsDays: 14, address: '1 Synthetic Street, Austin TX' })
  const chicago = await h.command('branch.save', { name: 'Chicago', prefix: 'CHI', timezone: 'America/Chicago', zips: ['60601'] })
  const world = { chicago, people: {} }
  for (const [key, name, branchId, address] of [['utc', 'Utc statement customer', null, '10 Main Street 78701'], ['chi', 'Chicago statement customer', chicago.id, '20 Lake Street 60601'], ['peer', 'Peer statement customer', null, '30 Peer Street 78702']]) {
    const person = await h.person(`${name} tech`, 'technician')
    const tech = await h.command('technician.save', { name: `${name} tech`, operatorId: person.id, branchId })
    const customer = await h.command('customer.save', { name, email: [`${key}-statement`, 'example.test'].join('@') })
    const site = await h.command('site.save', { customerId: customer.id, address, branchId })
    world[key] = { person, tech, customer, site, branchId }
  }
  return world
}

const slots = new Map()
/** An approved single-stage invoice for one explicit price, approved at an exact instant. */
export async function approvedInvoice(h, who, { price, title, approveAt, desk }) {
  const job = await h.command('job.create', { customerId: who.customer.id, siteId: who.site.id, title, lines: [{ description: title, quantity: '1', unitPrice: price, tax: 'FREE' }] })
  const date = approveAt.slice(0, 10)
  const slot = String(7 + (slots.get(who.tech.id) ?? 0)).padStart(2, '0'), next = String(8 + (slots.get(who.tech.id) ?? 0)).padStart(2, '0')
  slots.set(who.tech.id, (slots.get(who.tech.id) ?? 0) + 1)
  const visit = await h.command('visit.book', { jobId: job.id, technicianId: who.tech.id, date, start: `${slot}:00`, end: `${next}:00` })
  await who.person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  await who.person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Completed', signoff: { absentReason: 'Customer away' } })
  await h.setTime(approveAt)
  const draft = await desk.run('invoice.prepare', { jobId: job.id })
  return desk.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
}


/** An owner-requested TEST Checkout moved to its outcome by signed provider events at one exact instant. */
export async function checkoutPayment(h, invoice, { at, method = 'card', amount, tip, outcome = 'paid', fee = 100 }) {
  await h.setTime(at)
  const live = (await h.state()).invoices.find(i => i.id === invoice.id)
  const payment = await h.command('payment.checkout', { invoiceId: invoice.id, version: live.version, method, ...(amount ? { amount } : {}), ...(tip ? { tip } : {}) })
  const pi = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId), when = Math.floor(Date.parse(at) / 1000)
  const send = async type => assert.equal((await paymentEvent(h, pi, type, { at: when })).status, 200)
  const charge = status => ({ id: `synthetic-glove-statement-${payment.id}`, created: when, status, balance_transaction: { fee } })
  if (outcome === 'processing' || outcome === 'returned') { Object.assign(pi, { status: 'processing' }); await send('payment_intent.processing') }
  if (outcome === 'paid' || outcome === 'returned') { Object.assign(pi, { status: 'succeeded', amount_received: pi.amount, latest_charge: charge('succeeded') }); await send('payment_intent.succeeded') }
  if (outcome === 'failed') { Object.assign(pi, { status: 'requires_payment_method', last_payment_error: { code: 'card_declined' } }); await send('payment_intent.payment_failed') }
  if (outcome === 'returned') { Object.assign(pi, { status: 'requires_payment_method', last_payment_error: { code: 'bank_account_unusable' }, latest_charge: charge('failed') }); await send('payment_intent.payment_failed') }
  return (await h.state()).payments.find(p => p.id === payment.id)
}

/** Everyone who holds the desk's report authority, and every role or token that does not, each as a way to call the statement door. */
export async function statementReaders(h) {
  const issue = async (role, extra = {}) => ({ headers: { authorization: `Bearer ${(await h.command('token.issue', { name: `Statement ${role}`, role, ...extra })).token}` } })
  const reportsRole = await h.command('role.save', { name: 'Statement reader', permissions: ['customer.save', 'reports.read'] })
  const plainRole = await h.command('role.save', { name: 'Statement blind', permissions: ['customer.save'] })
  const people = {}
  for (const role of ['dispatcher', 'office', 'agent', 'viewer', 'technician', 'subcontractor']) people[role] = await h.person(`Statement ${role}`, role)
  people.custom = await h.person('Statement custom reader', `custom:${reportsRole.id}`)
  people.blind = await h.person('Statement custom blind', `custom:${plainRole.id}`)
  const allowed = [['owner', {}], ...['dispatcher', 'office', 'agent', 'viewer', 'custom'].map(k => [k, people[k]]), ['token dispatcher', await issue('dispatcher')], ['token office', await issue('office')], ['token agent', await issue('agent')], ['token viewer', await issue('viewer')], ['token custom reports', await issue(`custom:${reportsRole.id}`)]]
  const denied = [['technician', people.technician], ['subcontractor', people.subcontractor], ['custom without reports', people.blind], ['token custom without reports', await issue(`custom:${plainRole.id}`)]]
  return { allowed: allowed.map(([name, who]) => ({ name, who })), denied: denied.map(([name, who]) => ({ name, who })), people, issue }
}
