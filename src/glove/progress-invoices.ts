import { cents, dollars } from './money'
import { fail, text, type Context, type Row } from './model'

/** Explicit, human-reviewed stages reserve part of the accepted contract.
 * No percentage, remaining materials or final charge is inferred. */
export function progressStage(c: Context, job: Row, value: any) {
  if (!job.quoteId || !job.totals || job.kind === 'assessment') fail('PROGRESS_SCOPE', 'Progress invoicing requires a job with an accepted quoted amount.')
  if (!value || typeof value !== 'object' || typeof value.final !== 'boolean') fail('INPUT', 'Name the stage and explicitly choose whether it is final.', null, 400)
  const name = text(value.name, 'progress.name', { max: 100 })
  const stages = c.s.invoices.filter(i => i.jobId === job.id)
  if (stages.some(i => !i.progress)) fail('DUPLICATE', 'This job already has a job-wide invoice; revise or correct it.')
  if (stages.some(i => i.progress.final)) fail('PROGRESS_FINAL', 'This job already has a final stage; revise or correct its invoice.')
  if (stages.some(i => i.progress.name.toLocaleLowerCase('en-US') === name.toLocaleLowerCase('en-US'))) fail('DUPLICATE', 'This progress stage already has an invoice; revise or correct it.')
  if (stages.some(i => !['approved', 'exported'].includes(i.status))) fail('PROGRESS_APPROVAL', 'Approve each existing stage before preparing another.')
  if (value.final && job.status !== 'completed') fail('JOB_STATE', 'Complete the job before preparing its final stage.')
  return { name, final: value.final, sequence: stages.length + 1, sourceTotal: stages[0]?.progress.sourceTotal ?? job.totals.total, sourceJobVersion: stages[0]?.progress.sourceJobVersion ?? job.version }
}

/** Every stage revision and approval respects the same frozen contract cap.
 * Drafts reserve their current amounts, including correction drafts. */
export function checkProgress(c: Context, invoice: Row, total: string) {
  if (!invoice.progress) return
  const others = c.s.invoices.filter(i => i.jobId === invoice.jobId && i.id !== invoice.id)
  const used = others.reduce((n, i) => n + BigInt(cents(i.revisions.at(-1).totals.total, 'stage total')), 0n)
  const remaining = BigInt(cents(invoice.progress.sourceTotal, 'source amount')) - used
  const proposed = BigInt(cents(total, 'stage total'))
  if (proposed <= 0n || proposed > remaining) fail('PROGRESS_AMOUNT', `The stage must be above zero and at most the remaining contract amount of $${dollars(remaining < 0n ? 0n : remaining)}.`)
  if ((invoice.progress.final || others.some(i => i.progress?.final)) && proposed !== remaining) fail('PROGRESS_REMAINDER', `The final plan must account for exactly the remaining contract amount of $${dollars(remaining)}. Review the stage lines and tax.`)
}
