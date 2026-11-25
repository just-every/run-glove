import test from 'node:test'
import assert from 'node:assert/strict'
import { installation } from './harness.mjs'

// Cloudflare Workers Free gives every tool on an account 5 million D1 rows read a
// day. The */15 cron and the desk's 30-second polls must cost the same few rows
// whether the business holds a week of history or a year: this plays the real
// cron and the real polled door over 30 days of work (10 jobs a day) and over
// twice that, and holds both to one generous ceiling.
const at = '2026-11-20T15:00:00.000Z' // 09:00 in Chicago: past the office-reminder hour
const iso = day => new Date(Date.parse('2026-10-21T10:00:00Z') + day * 86_400_000).toISOString()

/** `days` of history through the database itself: finished jobs with visits, invoices, payments and timeline events, and five jobs awaiting an invoice. */
async function addHistory(db, first, days) {
  const insert = (kind, id, row) => db.prepare('INSERT INTO glove_records(kind,id,version,data) VALUES(?,?,1,?)').bind(kind, id, JSON.stringify({ id, version: 1, createdAt: iso(first), ...row }))
  const statements = []
  for (let day = first; day < first + days; day++) for (let n = 0; n < 10; n++) {
    const id = `${day}-${n}`, start = iso(day), end = new Date(Date.parse(start) + 7_200_000).toISOString(), waiting = day === 0 && n < 5
    statements.push(
      insert('customers', `c${id}`, { name: `Customer ${id}`, email: `c${id}@example.test` }),
      insert('sites', `s${id}`, { customerId: `c${id}`, address: `${n} Elm St` }),
      insert('jobs', `j${id}`, { number: `H-${id}`, customerId: `c${id}`, siteId: `s${id}`, status: waiting ? 'completed' : 'invoiced', title: 'Repair' }),
      insert('visits', `v${id}`, { jobId: `j${id}`, status: 'completed', startAt: start, endAt: end, local: { date: start.slice(0, 10), start: '05:00', timezone: 'America/Chicago' } }),
      insert('invoices', `i${id}`, { jobId: `j${id}`, customerId: `c${id}`, status: 'approved', number: `I-${id}`, revisions: [{ n: 1, lines: [], totals: { total: '100.00', currency: 'USD' }, approval: { at: start, by: { id: 'o', name: 'Owner' } } }] }),
      ...Array.from({ length: 12 }, (_, e) => db.prepare("INSERT INTO glove_events(id,sequence,at,actor_id,actor_name,actor_role,command_id,job_id,subject_kind,subject_id,kind,summary,data) VALUES(?,(SELECT COALESCE(MAX(sequence),0)+1 FROM glove_events),?,'o','Owner',?,?,?,'job',?,?,'Update','{}')").bind(`e${id}-${e}`, start, e === 11 ? 'provider' : 'owner', `cmd${id}-${e}`, `j${id}`, `j${id}`, e === 11 ? 'email.delivered' : 'job.update')),
    )
  }
  for (let i = 0; i < statements.length; i += 90) await db.batch(statements.slice(i, i + 90))
}

test('the cron and the desk poll read a flat number of rows however much history there is', async t => {
  const h = await installation({ at })
  t.after(() => h.close())
  await h.command('business.save', { name: 'Pacheco Plumbing', currency: 'USD', timezone: 'America/Chicago' })
  const meter = async on => (await (await h.request('/__test/meter', { method: 'POST', body: { on } })).json())
  const read = async () => (await (await h.request('/__test/meter')).json()).rows
  const cron = async () => { await meter(true); await h.scheduled(at); const rows = await read(); await meter(false); return rows }
  const poll = async etag => {
    await meter(true)
    const response = await h.request('/api/glove/state', { headers: etag ? { 'if-none-match': etag } : {} })
    const rows = await read()
    await meter(false)
    return { response, rows }
  }

  await addHistory(h.db, 0, 30)
  const month = await cron()
  t.diagnostic(`cron rows read: ${month} (30 days)`)
  assert.ok(month < 500, `a cron run read ${month} rows over 30 days of history`)
  await addHistory(h.db, 30, 30)
  const two = await cron()
  t.diagnostic(`cron rows read: ${two} (60 days)`)
  assert.ok(two < 500 && two <= month + 20, `a cron run read ${two} rows over 60 days of history (${month} over 30)`)

  // The desk's poll: the first answer carries an ETag; asking again unchanged reads a handful of rows and returns nothing.
  const first = await poll()
  assert.equal(first.response.status, 200, await first.response.clone().text())
  const etag = first.response.headers.get('etag')
  assert.ok(etag, 'the state answer names its version')
  const again = await poll(etag)
  t.diagnostic(`poll rows read: ${first.rows} changed, ${again.rows} unchanged`)
  assert.equal(again.response.status, 304)
  assert.equal(await again.response.text(), '')
  assert.ok(again.rows < 50, `an unchanged poll read ${again.rows} rows`)
  // Any change to the records makes the same question return the new state.
  await h.command('customer.save', { name: 'Ellen Brooks' })
  const changed = await poll(etag)
  assert.equal(changed.response.status, 200)
  assert.notEqual(changed.response.headers.get('etag'), etag)
})
