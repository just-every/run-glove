import { cents, dollars } from './money'
import { expectVersion, fail, newId, text, type Context, type Row } from './model'

/** Reconciliations change the current cap without rewriting document snapshots. */
export function progressCap(job: Row, stages: Row[]) {
  return job.progressReconciliations?.at(-1)?.newCap ?? stages[0]?.progress?.sourceTotal ?? job.totals.total
}

/** The owner reviews every existing stage and both exact gross amounts. */
export function reconcileProgress(c: Context, job: Row, quote: Row, total: string, review: any) {
  const stages = c.s.invoices.filter(i => i.jobId === job.id)
  if (!stages.length) {
    if (review !== undefined) fail('PROGRESS_REVIEW', 'This job has no progress stages to reconcile.')
    return null
  }
  if (stages.some(i => !i.progress || i.progress.final || !['draft', 'approved', 'exported'].includes(i.status))) fail('INVOICE_STATE', 'Reconciliation requires nonfinal progress stages. Review every current draft, approved invoice and correction.')
  const priorCap = progressCap(job, stages)
  if (!review || !Array.isArray(review.stages) || review.stages.length !== stages.length || new Set(review.stages.map((i: any) => i?.id)).size !== stages.length) fail('PROGRESS_REVIEW', 'Explicitly review the current cap, amended total and every current progress stage.')
  if (review.sourceTotal !== priorCap || review.total !== total) fail('STALE', 'The contract amounts changed. Review the current cap and amended total.', { sourceTotal: priorCap, total })
  for (const stage of stages) {
    const reviewed = review.stages.find((i: any) => i?.id === stage.id)
    if (!reviewed) fail('PROGRESS_REVIEW', 'Review every current progress stage, with its exact version.')
    expectVersion(stage, reviewed.version)
  }
  const reserved = stages.reduce((n, i) => n + BigInt(cents(i.revisions.at(-1).totals.total, 'stage total')), 0n)
  if (reserved > BigInt(cents(total, 'amended total'))) fail('PROGRESS_AMOUNT', 'The amended contract cannot be less than its approved progress stages.')
  return { id: newId(), quoteId: quote.id, revision: quote.acceptance.revision, signatureHash: quote.acceptance.signing.signedCopy.sha256, priorCap, newCap: total, sourceJobVersion: job.version, stages: stages.map(i => ({ id: i.id, version: i.version })), by: c.actor.id, at: c.now }
}

/** Explicit, human-reviewed stages reserve part of the accepted contract.
 * No percentage, remaining materials or final charge is inferred. */
export function progressStage(c: Context, job: Row, value: any) {
  if (!job.quoteId || !job.totals || job.kind === 'assessment') fail('PROGRESS_SCOPE', 'Progress invoicing requires a job with an accepted quoted amount.')
  if (!value || typeof value !== 'object' || typeof value.final !== 'boolean') fail('INPUT', 'Name the stage and explicitly choose whether it is final.', null, 400)
  const name = text(value.name, 'progress.name', { max: 100 })
  const stages = c.s.invoices.filter(i => i.jobId === job.id)
  if (stages.length && c.s.quotes.some(q => q.fieldQuote?.kind === 'changeOrder' && q.fieldQuote.jobId === job.id && !q.jobId && q.status === 'accepted' && q.acceptance?.signing?.signedCopy)) fail('PROGRESS_REVIEW', 'The owner must explicitly reconcile the signed change order before preparing another progress stage.')
  if (stages.some(i => !i.progress)) fail('DUPLICATE', 'This job already has a job-wide invoice; revise or correct it.')
  if (stages.some(i => i.progress.final)) fail('PROGRESS_FINAL', 'This job already has a final stage; revise or correct its invoice.')
  if (stages.some(i => i.progress.name.toLocaleLowerCase('en-US') === name.toLocaleLowerCase('en-US'))) fail('DUPLICATE', 'This progress stage already has an invoice; revise or correct it.')
  if (stages.some(i => !['approved', 'exported'].includes(i.status))) fail('PROGRESS_APPROVAL', 'Approve each existing stage before preparing another.')
  if (value.final && job.status !== 'completed') fail('JOB_STATE', 'Complete the job before preparing its final stage.')
  return { name, final: value.final, sequence: stages.length + 1, sourceTotal: progressCap(job, stages), sourceJobVersion: job.progressReconciliations?.length ? job.version : stages[0]?.progress.sourceJobVersion ?? job.version }
}

/** Every stage revision and approval respects the current reviewed contract cap.
 * Drafts reserve their current amounts, including correction drafts. */
export function checkProgress(c: Context, invoice: Row, total: string) {
  if (!invoice.progress) return
  const others = c.s.invoices.filter(i => i.jobId === invoice.jobId && i.id !== invoice.id)
  const used = others.reduce((n, i) => n + BigInt(cents(i.revisions.at(-1).totals.total, 'stage total')), 0n)
  const job = c.s.jobs.find(j => j.id === invoice.jobId) ?? fail('NOT_FOUND', 'Choose the progress job.', null, 404)
  const remaining = BigInt(cents(progressCap(job, [invoice, ...others]), 'source amount')) - used
  const proposed = BigInt(cents(total, 'stage total'))
  if (proposed <= 0n || proposed > remaining) fail('PROGRESS_AMOUNT', `The stage must be above zero and at most the remaining contract amount of $${dollars(remaining < 0n ? 0n : remaining)}.`)
  if ((invoice.progress.final || others.some(i => i.progress?.final)) && proposed !== remaining) fail('PROGRESS_REMAINDER', `The final plan must account for exactly the remaining contract amount of $${dollars(remaining)}. Review the stage lines and tax.`)
}
