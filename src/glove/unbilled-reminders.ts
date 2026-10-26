import { load } from './storage'
import { localParts } from './time'
import { branchZone } from './branches'

/** An internal Activity reminder, once per unbilled job and branch-local day.
 * No customer message, payment credential or provider request is created. */
export async function remindUnbilled(db: D1Database, at: string) {
  const s = await load(db)
  for (const job of s.jobs.filter(j => j.status === 'completed' && !j.erasedAt)) {
    const { date, time } = localParts(at, branchZone(s, job))
    if (time < '08:00') continue
    const id = `unbilled:${job.id}:${date}`
    // Recheck the durable job and invoice state inside the insert: approval,
    // erasure and concurrent cron passes cannot leave a stale new reminder.
    await db.prepare(`INSERT INTO glove_events(id,sequence,at,actor_id,actor_name,actor_role,command_id,job_id,subject_kind,subject_id,kind,summary,data)
      SELECT ?,(SELECT COALESCE(MAX(sequence),0)+1 FROM glove_events),?,'provider:Glove','Glove','provider',?,?,'job',?,'invoice.officeReminder',?,?
      WHERE EXISTS(SELECT 1 FROM glove_records WHERE kind='jobs' AND id=? AND json_extract(data,'$.status')='completed' AND json_extract(data,'$.erasedAt') IS NULL)
      AND NOT EXISTS(SELECT 1 FROM glove_records WHERE kind='invoices' AND json_extract(data,'$.jobId')=? AND json_extract(data,'$.status') IN ('approved','exported','imported') AND (json_extract(data,'$.progress') IS NULL OR json_extract(data,'$.progress.final')=1))
      ON CONFLICT(id) DO NOTHING`).bind(id, at, id, job.id, job.id, `Office reminder: ${job.number} is completed and awaits invoice preparation or approval. Review Invoices.`, JSON.stringify({ date, jobId: job.id, effect: 'internal Activity reminder only' }), job.id, job.id).run()
  }
}
