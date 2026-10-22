import type { SourceBundle } from '../../modules/import-kit/src/d1/index'
import { Problem, fail } from '../model'
import { rule, weekdays } from '../recurrence'
import { calendarDate } from '../receivables'
import { localParts } from '../time'
import { str } from './export-mapping'

export const recurringColumns = ['Recurring Job ID', 'Title', 'Recurring Time - Frequency', 'No End Date', 'End Date', 'First Occurrence Date', 'Last Occurrence Date']

/** The report's last occurrence is the last generated date, never the series end. */
export function fieldpulseRecurrence(source: Record<string, any>, bundle: SourceBundle, timezone: string) {
  const id = str(source['Recurring Job ID'])
  const jobs = bundle.records.filter(r => r.kind === 'jobs' && str((r.payload as any).recurring_parent_id) === id).map(r => r.payload as any)
  if (!jobs.length) fail('IMPORT_PARENT', 'Include a detailed FieldPulse job with this recurring_parent_id to identify the recurring job customer and location.', null, 400)
  const parent = jobs[0]
  if (jobs.some(j => str(j.customer_id) !== str(parent.customer_id) || str(j.location_id) !== str(parent.location_id))) fail('IMPORT_PARENT', 'The recurring group has conflicting customers or locations; review it in FieldPulse before importing.', null, 400)
  const sourceFields = Object.fromEntries(recurringColumns.map(k => [k, source[k]]))
  let proposal = null, unmapped = null
  try {
    const from = calendarDate(str(source['First Occurrence Date']))
    const noEnd = str(source['No End Date']).toLowerCase()
    if (!['yes', 'no', 'true', 'false', '1', '0'].includes(noEnd)) fail('IMPORT_DATE', 'No End Date must explicitly say Yes or No.', null, 400)
    const until = ['yes', 'true', '1'].includes(noEnd) ? null : calendarDate(str(source['End Date']))
    if (until && until < from) fail('IMPORT_DATE', 'The source schedule ends before it starts.', null, 400)
    // Only the documented weekly wording has an exact native interpretation.
    // FieldPulse skips absent monthly dates; native month rules can clamp them.
    const frequency = /^every week on (sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.exec(str(source['Recurring Time - Frequency']))
    if (!frequency || frequency[1].toLowerCase() !== weekdays[new Date(`${from}T00:00:00Z`).getUTCDay()]) fail('IMPORT_RECURRENCE', 'This FieldPulse frequency has no exact native mapping; the original frequency and dates are retained for review.', null, 400)
    const dates = [calendarDate(str(source['Last Occurrence Date']))]
    for (const job of jobs) for (const event of Array.isArray(job.visits) && job.visits.length ? job.visits : [job]) {
      if (!event.start_time) continue
      const value = event.start_time, raw = str(value)
      if (/^\d{4}-\d\d-\d\d[T ]\d\d:\d\d(?::\d\d)?$/.test(raw)) { dates.push(calendarDate(raw.slice(0, 10))); continue }
      const milliseconds = /^\d{10,13}$/.test(raw) ? Number(raw) * (raw.length <= 10 ? 1000 : 1) : Date.parse(raw)
      if (!Number.isFinite(milliseconds) || Math.abs(milliseconds) >= 8.64e15) fail('IMPORT_TIME', 'A source occurrence has an invalid timestamp; review it before activating the schedule.', null, 400)
      const timestamp = new Date(milliseconds).toISOString()
      dates.push(localParts(timestamp, timezone).date)
    }
    proposal = { rule: rule({ unit: 'week', interval: 1 }), from, until, coveredThrough: dates.sort().at(-1)! }
  } catch (error) { if (!(error instanceof Problem)) throw error; unmapped = error.message }
  return { parent, recurrence: { parentId: id, active: false, source: sourceFields, proposal, unmapped, reason: 'Source schedule retained; review and explicitly create a Glove series before generating new bookings.' } }
}
