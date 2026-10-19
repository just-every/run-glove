import { event, fail, newId, put, type Context, type Row } from './model'
import { cents, dollars } from './money'
import { costing, margin, revenueOf } from './costing'

// Live margin warnings (COST-005). The owner sets a cost threshold (actual cost
// at or past this percentage of the estimate) and a margin floor (projected
// margin below this percentage); either can be off. After every command, each
// open job is checked: its projected cost is the larger of actual and estimated
// cost (COST-004). A crossing warns the owner and the dispatchers in Glove once
// (on their screens; nothing is sent), keyed by the job, the kind and the
// setting, so the same crossing never repeats; a new setting can warn again.

const percent = (value: unknown, name: string) => {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !/^\d{1,4}(\.\d)?$/.test(value)) return fail('INPUT', `${name} is a percentage such as 100 or 32.5.`, { field: name }, 400)
  return value
}

export const watchSettings = (value: any) => value ? { costPercent: percent(value.costPercent, 'marginWatch.costPercent'), marginFloor: percent(value.marginFloor, 'marginWatch.marginFloor') } : { costPercent: null, marginFloor: null }
const tenths = (v: string) => Math.round(Number(v) * 10)

export function watchMargins(c: Context) {
  const settings = c.s.business[0]?.marginWatch
  if (!settings?.costPercent && !settings?.marginFloor) return
  for (const job of c.s.jobs.filter(j => j.status === 'open')) {
    const k = costing(c.s, job), estimate = cents(k.estimate.cost, 'estimate'), actual = cents(k.actual.cost, 'actual'), revenue = revenueOf(c.s, job)
    const projected = Math.max(actual, estimate)
    const projectedMargin = margin(revenue, projected)
    const crossings: { kind: string; setting: string; text: string }[] = []
    if (settings.costPercent && estimate > 0 && actual * 1000 >= estimate * tenths(settings.costPercent)) crossings.push({ kind: 'cost', setting: settings.costPercent, text: `actual cost $${dollars(actual)} reached ${settings.costPercent}% of the $${dollars(estimate)} estimate` })
    if (settings.marginFloor && projectedMargin !== null && tenths(projectedMargin) < tenths(settings.marginFloor)) crossings.push({ kind: 'margin', setting: settings.marginFloor, text: `projected margin ${projectedMargin}% is below the ${settings.marginFloor}% floor` })
    for (const x of crossings) {
      const key = `${job.id}:${x.kind}:${x.setting}`
      if (c.s.warnings.some((w: Row) => w.key === key)) continue
      const row = put(c.s, 'warnings', { id: newId(), version: 1, createdAt: c.now, key, jobId: job.id, number: job.number, kind: x.kind, setting: x.setting, estimate: dollars(estimate), actual: dollars(actual), projectedMargin, to: ['owner', 'dispatcher'] })
      event(c, { jobId: job.id, subjectKind: 'warning', subjectId: row.id, kind: `margin.${x.kind}`, summary: `Margin warning on ${job.number}: ${x.text} (shown to the owner and dispatchers in Glove)`, data: null })
    }
  }
}
