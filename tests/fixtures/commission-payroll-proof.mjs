import assert from 'node:assert/strict'
import { scenario } from './scenario.mjs'
import { installation } from '../api/harness.mjs'
import { commissionFixture, commissionKinds, commissionRange, commissionFile, commissionJson, commissionRows, commissionSummary } from './payroll-commissions.mjs'

export async function commissionPayrollProof(t, assertRows) {
  const h = await installation({ at: '2026-11-23T02:00:00Z' })
  try {
    const f = await commissionFixture(h)
    const read = async kind => {
      const r = await h.request(commissionFile(kind))
      assert.equal(r.status, 200, await r.clone().text())
      return r.text()
    }
    const json = async () => {
      const r = await h.request(commissionJson)
      assert.equal(r.status, 200)
      return r.json()
    }
    const sheet = async () => (await h.request('/api/glove/timesheets?week=2026-11-02').then(r => r.json())).timesheets.find(x => x.technicianId === f.priya.id)
    await scenario(t, 'TEAM-006 point 1: reads recompute earnings after hours approval under the rule on each sale date', async () => {
      const approval = await sheet()
      const before = await read('gusto')
      assert.equal((await json()).people.find(x => x.technicianId === f.priya.id).commission.total, '0.00')
      await f.sold('2026-11-04', f.priya, '1234.50', '5%', '61.73')
      assert.notEqual(await read('gusto'), before)
      assert.equal((await json()).people.find(x => x.technicianId === f.priya.id).commission.total, '61.73')
      assert.deepEqual(await sheet(), approval, 'a credited sale neither changes approved hours nor reapproves the sheet')
      assert.equal((await sheet()).status, 'approved')
      await h.command('payroll.settings', { commissions: { from: '2026-11-09', soldPercent: '10', completedPercent: '25', agreementSpiff: '40' } })
      assert.equal((await json()).people.find(x => x.technicianId === f.priya.id).commission.total, '61.73', 'the new dated rule leaves the earlier sale unchanged')
      await f.finish()
      assert.deepEqual(await sheet(), approval)
      const p = (await json()).people.find(x => x.technicianId === f.priya.id)
      assert.deepEqual(p.commission.items.filter(x => x.kind === 'sold').map(x => [x.date, x.rate, x.amount]), [['2026-11-04', '5%', '61.73'], ['2026-11-09', '10%', '30.01'], ['2026-11-16', '10%', '40.00']])
    })

    await scenario(t, 'TEAM-006 point 2: every provider row matches two technicians over three workweeks with both ADP commission codes', async () => {
      for (const kind of commissionKinds) assertRows(await read(kind), commissionRows()[kind])
      await h.command('payroll.settings', { adp: { companyCode: 'GLOVE23', payFrequency: 'B', commission: 'SALESOWN' } })
      for (const kind of commissionKinds) assertRows(await read(kind), commissionRows('SALESOWN')[kind])
    })

    await scenario(t, 'TEAM-006 point 3: credited people without approved time and subcontractors never enter any file', async () => {
      const run = await json()
      assert.deepEqual(run.people.map(x => x.technicianId).sort(), [f.priya.id, f.tom.id].sort())
      assert.deepEqual(run.left, [
        { technicianId: f.excluded.id, name: f.excluded.name, reason: 'commissions of $60.00 but no approved time in the period' },
        { technicianId: f.sub.id, name: f.sub.name, reason: '1099 subcontractor: paid through the 1099-NEC totals, not payroll' },
      ])
      const state = await h.state()
      for (const tech of [f.excluded, f.sub]) assert.ok(state.quotes.some(x => x.acceptance?.soldByTechnicianId === tech.id), 'excluded person really has an accepted credited sale')
      for (const kind of commissionKinds) {
        const text = await read(kind)
        assert.doesNotMatch(text, /Synthetic Glove|306|307|9876/)
        assertRows(text, commissionRows('SALESOWN')[kind])
      }
    })

    await scenario(t, 'TEAM-006 point 4: JSON enumerates sold, completed and agreement credits including the shared invoice cent remainder', async () => {
      const run = await json()
      for (const tech of [f.priya, f.tom]) assert.deepEqual(run.people.find(x => x.technicianId === tech.id).commission, commissionSummary(f, tech))
    })

    await scenario(t, 'TEAM-006 point 5: reads make no payment or provider confirmation and remain identical after actual Worker restart', async () => {
      const before = await h.state(), exported = await h.request('/api/glove/export').then(r => r.json())
      const files = Object.fromEntries(await Promise.all(commissionKinds.map(async kind => [kind, await read(kind)])))
      const run = await json()
      for (const body of [...Object.values(files), JSON.stringify(run)]) assert.doesNotMatch(body, /confirmed|verified|accepted layout|payment|settled|filed|submitted/i)
      assert.deepEqual(before.payments, [])
      assert.deepEqual(await h.state(), before, 'file and JSON reads change no business data')
      assert.deepEqual(await h.request('/api/glove/export').then(r => r.json()), exported)
      await h.restart()
      assert.deepEqual(await json(), run)
      for (const kind of commissionKinds) assert.equal(await read(kind), files[kind])
      assert.deepEqual(await h.state(), before)
      t.diagnostic('TEAM-006 provider account acceptance remains unrun; Glove pays no one and files nothing. Period ' + commissionRange)
    })
  } finally { await h.close() }
}
