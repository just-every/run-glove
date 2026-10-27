import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, acceptedQuote, assertTrail } from './harness.mjs'

// The same signed-scope review must retain an unapproved proposal or correction.
export async function draftProgressScope() {
  for (const kind of ['draft', 'correction']) {
    const h = await installation({ at: '2026-10-20T12:00:00Z' })
    try {
      const b = await business(h, { currency: 'USD', timezone: 'UTC', taxSettings: { jurisdictions: [{ id: 'city', name: 'City tax', rate: '8.25', zips: [] }], defaultJurisdictionId: 'city' } })
      const job = await h.command('job.create', { quoteId: (await acceptedQuote(h, b)).id })
      const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-20', start: '09:00', end: '10:00' })
      const lines = [{ description: 'Rough in', quantity: '1', unitPrice: '60.00', serviceId: b.service.id }]
      let stage = await b.office.run('invoice.prepare', { jobId: job.id, progress: { name: 'Rough in', final: false }, lines })
      if (kind === 'correction') {
        stage = await b.office.run('invoice.approve', { invoiceId: stage.id, version: stage.version, revision: 1 })
        await b.office.run('invoice.export', {})
        stage = (await h.state()).invoices.find(i => i.id === stage.id)
        stage = await b.office.run('invoice.correct', { invoiceId: stage.id, version: stage.version, reason: 'Clarify the proposed description', lines })
      }
      await h.command('fieldQuote.configure', { technicianId: b.priya.id, version: b.priya.version, enabled: true, minPercent: 0, maxPercent: 1000 })
      let change = await b.priyaPerson.run('fieldQuote.draft', { visitId: visit.id, changeOrder: true, title: `synthetic-glove-${kind}`, options: [{ name: 'Added work', lines: [{ serviceId: b.service.id, quantity: '1', unitPrice: '100.00' }] }] })
      change = await h.command('quote.approve', { quoteId: change.id, version: change.version, revision: 1 })
      await h.command('quote.consent', { version: (await h.state()).business[0].version, text: 'synthetic-glove-105 electronic signature disclosure accepted by the Owner.', accept: true })
      const link = await h.command('quote.link', { quoteId: change.id, version: change.version })
      const post = body => h.request('/api/glove/public/quote', { as: '', method: 'POST', headers: { authorization: `Bearer ${link.token}` }, body })
      const choice = { optionId: 'option-1', addOnIds: [] }
      const selection = await (await post({ action: 'choose', choice })).json()
      assert.equal((await post({ action: 'approve', name: 'Mei Lin', capacity: 'Property owner', choice, documentHash: selection.documentHash, selectionHash: selection.selection.hash, consent: { version: selection.disclosure.version, hash: selection.disclosure.hash, affirmed: true }, signature: { kind: 'typed', text: 'Mei Lin' } })).status, 200)
      change = (await h.state()).quotes.find(q => q.id === change.id)
      const review = row => ({ sourceTotal: '204.59', total: '312.84', stages: [{ id: row.id, version: row.version }] })
      const apply = { quoteId: change.id, version: change.version, jobVersion: job.version }
      await h.command('fieldQuote.apply', apply, { error: 'PROGRESS_REVIEW' })
      await b.office.run('fieldQuote.apply', { ...apply, progressReview: review(stage) }, { error: 'FORBIDDEN' })
      const stale = review(stage)
      stage = await b.office.run('invoice.revise', { invoiceId: stage.id, version: stage.version, reason: 'Review current wording', lines: [{ ...lines[0], description: 'Rough in completed' }] })
      await h.command('fieldQuote.apply', { ...apply, progressReview: stale }, { error: 'STALE' })
      const before = await h.state(), id = randomUUID(), payload = { ...apply, progressReview: review(stage) }
      const result = await h.command('fieldQuote.apply', payload, { commandId: id })
      assert.deepEqual(await h.command('fieldQuote.apply', payload, { commandId: id }), result)
      const after = await h.state()
      assert.deepEqual(after.invoices, before.invoices, 'review changes no draft, approved snapshot or correction')
      for (const collection of ['approvals', 'payments', 'messages', 'exports']) assert.deepEqual(after[collection], before[collection])
      assert.equal(after.jobs.find(j => j.id === job.id).totals.total, '312.84')
      assert.deepEqual(result.progressReconciliation.stages, [{ id: stage.id, version: stage.version }])
      assert.equal(stage.status, 'draft')
      assert.equal(stage.revisions.at(-1).approval, null)
      if (kind === 'correction') assert.deepEqual(stage.revisions[0], before.invoices[0].revisions[0])
      await b.office.run('invoice.prepare', { jobId: job.id, progress: { name: 'Next', final: false }, lines }, { error: 'PROGRESS_APPROVAL' })
      stage = await b.office.run('invoice.approve', { invoiceId: stage.id, version: stage.version, revision: stage.revisions.at(-1).n })
      const next = await b.office.run('invoice.prepare', { jobId: job.id, progress: { name: 'Next', final: false }, lines })
      assert.equal(next.progress.sourceTotal, '312.84')
      const { activity, exported } = await assertTrail(h, ['progress.reconciled'])
      assert.equal(activity.filter(e => e.kind === 'progress.reconciled').length, 1)
      assert.deepEqual(exported.jobs.find(j => j.id === job.id).progressReconciliations, after.jobs.find(j => j.id === job.id).progressReconciliations)
      assert.equal(h.email.sent.length, 0)
    } finally { await h.close() }
  }
}
