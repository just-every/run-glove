import { branchZone } from '../branches'
import { Problem, fail, text, find, expectVersion, put, bump, event, newId, business, type Context, type Row } from '../model'
import { dayLabel, localParts } from '../time'
import { rule as parseRule, occurrences, addDays, ruleLabel } from '../recurrence'
import { openSlotOnly } from './grants'
import { conflicts, reviewed, slot, who } from './dispatch'
import type { Handler } from './types'

// Recurring jobs (PLAN-001). A job's series is a list of rule revisions, each
// from a local date: a rule, the visit's local start and end time and the
// technician. Visits are generated for every occurrence through the earlier of
// the series' end date and today plus its rolling horizon (in days), at create,
// at a change, and after every later command, so the horizon rolls forward.
// Each generated visit is an ordinary visit carrying its revision and
// occurrence date: moving it (visit.change) or skipping it (visit.cancel)
// leaves the series as it is, and an occurrence that has a visit is never
// booked again. Changing the series from a date adds a revision there: the
// visits on or after that date that are still booked and untouched (no arrival,
// never moved) are canceled and booked again under the new revision; earlier
// visits, and moved, skipped or started ones, stay as they are.

const date = (v: unknown, name: string) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? v : fail('INPUT', `${name} is a date (YYYY-MM-DD).`, { field: name }, 400)
const horizon = (v: unknown) => v === undefined ? 365 : Number.isInteger(v) && (v as number) >= 7 && (v as number) <= 730 ? v as number : fail('INPUT', 'horizonDays is a whole number of days from 7 to 730.', { field: 'horizonDays' }, 400)

type Planned = { rev: Row; occurrence: string; next: ReturnType<typeof slot>; found: { code: string; message: string }[] }

/** Book every occurrence not yet booked. With `acknowledge` (a person's create or change) conflicts must be reviewed; the rolling pass books and notes them. */
function generate(c: Context, job: Row, review: { acknowledge: unknown } | null) {
  const series = job.series, today = localParts(c.now, branchZone(c.s, job)).date
  const end = addDays(today, series.horizonDays), to = series.until && series.until < end ? series.until : end
  const revs = [...series.revisions].sort((a: Row, b: Row) => a.from < b.from ? -1 : 1)
  const planned: Planned[] = [], missed: { rev: number; occurrence: string; reason: string }[] = []
  revs.forEach((rev: Row, i: number) => {
    const until = revs[i + 1]?.from
    for (const occurrence of occurrences(rev.rule, rev.from, to)) {
      if (until && occurrence >= until) break
      if (c.s.visits.some(v => v.jobId === job.id && v.series?.rev === rev.n && v.series.occurrence === occurrence) || series.missed.some((m: Row) => m.rev === rev.n && m.occurrence === occurrence)) continue
      try {
        const next = slot(c, { technicianId: rev.technicianId, date: occurrence, start: rev.start, end: rev.end })
        planned.push({ rev, occurrence, next, found: conflicts(c, job, next, null) })
      } catch (error) {
        // A person's create or change hears why; the rolling pass records the date it could not book, once.
        if (review || !(error instanceof Problem)) throw error
        missed.push({ rev: rev.n, occurrence, reason: error.message })
      }
    }
  })
  const found = planned.flatMap(x => x.found)
  if (review) { openSlotOnly(c, found); reviewed(found, review.acknowledge) }
  for (const x of planned) put(c.s, 'visits', { id: newId(), version: 1, createdAt: c.now, jobId: job.id, ...x.next, status: 'booked', series: { rev: x.rev.n, occurrence: x.occurrence }, assignments: [{ ...x.next, by: who(c), at: c.now, reason: `Series ${ruleLabel(x.rev.rule, x.rev.from)}`, reviewedConflicts: review ? x.found : [], unreviewedConflicts: review ? [] : x.found, proposalId: null, grantId: c.grant?.id ?? null }], arrival: null, completion: null, lateEvidence: [] })
  const current = c.s.jobs.find(j => j.id === job.id)!
  // The job changes only when the series booked, missed or rolled to a new date.
  if (!planned.length && !missed.length && series.through === to) return current
  const row = bump(c.s, 'jobs', current, { series: { ...series, through: to, missed: [...series.missed, ...missed] } })
  const flagged = planned.filter(x => !review && x.found.length)
  if (planned.length || missed.length) event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'series.generated', summary: `${job.number}'s series booked ${planned.length} visit${planned.length === 1 ? '' : 's'}${planned.length ? ` (${planned.map(x => dayLabel(x.occurrence)).join(', ')})` : ''} through ${to}${found.length && review ? ` after reviewing ${found.length} conflict${found.length === 1 ? '' : 's'}` : ''}${flagged.length ? `; to review on Dispatch: ${flagged.flatMap(x => x.found.map(f => f.message)).join(' ')}` : ''}${missed.length ? `; could not book ${missed.map(m => `${m.occurrence} (${m.reason})`).join(', ')}` : ''}`, data: { visits: planned.length } })
  return row
}

function revision(c: Context, p: any, n: number, from: string, base: Row | null) {
  const r = p.rule === undefined && base ? base.rule : parseRule(p.rule)
  // The technician, start and end are checked as a visit on the first date would be.
  const first = slot(c, { technicianId: p.technicianId ?? base?.technicianId, date: from, start: p.start ?? base?.start, end: p.end ?? base?.end })
  return { n, from, rule: r, start: first.local.start, end: first.local.end, technicianId: first.technicianId, by: who(c), at: c.now }
}

/** After every command: open recurring jobs book their next occurrences as the horizon rolls forward. */
export function extendSeries(c: Context) {
  for (const job of c.s.jobs.filter(j => j.series && j.status === 'open')) generate(c, job, null)
}

export const series: Handler = async (c, type, p) => {
  switch (type) {
    case 'series.create': {
      const job = find(c.s, 'jobs', p.jobId); expectVersion(job, p.version)
      if (job.status !== 'open') fail('JOB_STATE', `${job.number} is ${job.status}.`)
      if (job.series) fail('SERIES_EXISTS', `${job.number} already repeats; change its series from a date.`)
      const from = date(p.date, 'date'), until = p.until === undefined || p.until === null || p.until === '' ? null : date(p.until, 'until')
      if (until && until < from) fail('INPUT', 'The series ends on or after its first date.', { field: 'until' }, 400)
      const rev = revision(c, p, 1, from, null)
      const row = bump(c.s, 'jobs', job, { series: { revisions: [rev], until, horizonDays: horizon(p.horizonDays), through: null, missed: [] } })
      event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'series.created', summary: `${c.actor.name} made ${job.number} repeat ${ruleLabel(rev.rule, from)} from ${from}${until ? ` until ${until}` : ''}, ${rev.start}–${rev.end} with ${find(c.s, 'technicians', rev.technicianId).name}`, data: null })
      return generate(c, row, { acknowledge: p.acknowledge })
    }
    case 'series.change': {
      const job = find(c.s, 'jobs', p.jobId); expectVersion(job, p.version)
      if (!job.series) fail('NOT_SERIES', `${job.number} does not repeat.`)
      if (job.status !== 'open') fail('JOB_STATE', `${job.number} is ${job.status}.`)
      const revs = job.series.revisions as Row[], from = date(p.from, 'from'), reason = text(p.reason, 'reason', { max: 500 })
      if (from < revs[0].from) fail('INPUT', `The series starts on ${revs[0].from}; change it from that date or later.`, { field: 'from' }, 400)
      const base = [...revs].sort((a, b) => a.from < b.from ? -1 : 1).filter(r => r.from <= from).pop()!
      const rev = revision(c, p, Math.max(...revs.map(r => r.n)) + 1, from, base)
      const until = p.until === undefined ? job.series.until : p.until === null || p.until === '' ? null : date(p.until, 'until')
      // The past stays: only booked, untouched visits from the date are replaced.
      const replaced = c.s.visits.filter(v => v.jobId === job.id && v.series && v.series.occurrence >= from && v.status === 'booked' && !v.arrival && v.assignments.length === 1)
      for (const v of replaced) bump(c.s, 'visits', v, { status: 'cancelled', cancelled: { by: who(c), at: c.now, reason: `Series changed from ${from}: ${reason}` } })
      const row = bump(c.s, 'jobs', job, { series: { ...job.series, revisions: [...revs.filter(r => r.from < from), rev], until, horizonDays: p.horizonDays === undefined ? job.series.horizonDays : horizon(p.horizonDays) } })
      event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'series.changed', summary: `${c.actor.name} changed ${job.number}'s series from ${from} to repeat ${ruleLabel(rev.rule, from)}${until ? ` until ${until}` : ''}, ${rev.start}–${rev.end} with ${find(c.s, 'technicians', rev.technicianId).name}: ${reason}; ${replaced.length} untouched visit${replaced.length === 1 ? '' : 's'} replaced`, data: { replaced: replaced.map(v => v.id) } })
      return generate(c, row, { acknowledge: p.acknowledge })
    }
  }
}
