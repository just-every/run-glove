import { fail } from './model'

// Recurring-job rules (PLAN-001, PLAN-006), on local calendar dates in the business time
// zone. A rule repeats every N weeks (on the anchor date's weekday) or every N
// months, optionally only in named months (N is then 1): on a day of the month
// (the anchor's day unless given; a day the month lacks becomes its last day) or
// on the nth weekday of the month (1st–4th, or -1 for the last). Intervals count
// from the anchor: the first date of the rule's revision.

export const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
export type Rule = { unit: 'week' | 'month'; interval: number; months: number[] | null; day: number | null; nth: number | null; weekday: (typeof weekdays)[number] | null }

const int = (v: unknown, min: number, max: number, name: string) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? v as number : fail('INPUT', `${name} must be a whole number from ${min} to ${max}.`, { field: name }, 400)

export function rule(p: any): Rule {
  if (!p || typeof p !== 'object') return fail('INPUT', 'Give the series a rule.', { field: 'rule' }, 400)
  const unit = p.unit === 'week' || p.unit === 'month' ? p.unit : fail('INPUT', 'rule.unit is week or month.', { field: 'rule.unit' }, 400)
  const interval = p.interval === undefined ? 1 : int(p.interval, 1, 52, 'rule.interval')
  if (unit === 'week') return { unit, interval, months: null, day: null, nth: null, weekday: null }
  const months = p.months === undefined || p.months === null ? null : Array.isArray(p.months) && p.months.length ? [...new Set<number>(p.months.map((m: unknown, i: number) => int(m, 1, 12, `rule.months[${i}]`)))].sort((a, b) => a - b) : fail('INPUT', 'rule.months lists months 1 to 12.', { field: 'rule.months' }, 400)
  if (months && interval !== 1) fail('INPUT', 'A rule in named months repeats every year in those months (interval 1).', { field: 'rule.interval' }, 400)
  const nth = p.nth === undefined || p.nth === null ? null : p.nth === -1 ? -1 : int(p.nth, 1, 4, 'rule.nth')
  const weekday = nth === null ? null : weekdays.includes(p.weekday) ? p.weekday : fail('INPUT', `rule.weekday is one of ${weekdays.join(', ')}.`, { field: 'rule.weekday' }, 400)
  const day = nth !== null || p.day === undefined || p.day === null ? null : int(p.day, 1, 31, 'rule.day')
  return { unit, interval, months, day, nth, weekday }
}

const utc = (date: string) => Date.parse(`${date}T00:00:00Z`)
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)
export const addDays = (date: string, days: number) => iso(utc(date) + days * 86400000)
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate()

function dayIn(r: Rule, y: number, m: number, anchorDay: number) {
  if (r.nth === null) return Math.min(r.day ?? anchorDay, lastDay(y, m))
  const want = weekdays.indexOf(r.weekday!)
  if (r.nth === -1) { const last = lastDay(y, m), wd = new Date(Date.UTC(y, m, last)).getUTCDay(); return last - ((wd - want + 7) % 7) }
  const first = new Date(Date.UTC(y, m, 1)).getUTCDay()
  return 1 + ((want - first + 7) % 7) + 7 * (r.nth - 1)
}

/** Every date of the rule anchored at `anchor`, from the anchor through `to` (inclusive). */
export function occurrences(r: Rule, anchor: string, to: string): string[] {
  const out: string[] = []
  if (r.unit === 'week') { for (let d = anchor; d <= to; d = addDays(d, 7 * r.interval)) out.push(d); return out }
  const [ay, am, ad] = anchor.split('-').map(Number)
  for (let k = 0; ; k++) {
    const y = ay + Math.floor((am - 1 + k) / 12), m = (am - 1 + k) % 12
    const first = `${y}-${String(m + 1).padStart(2, '0')}-01`
    if (first > to) return out
    if (r.months ? !r.months.includes(m + 1) : k % r.interval !== 0) continue
    const date = `${first.slice(0, 8)}${String(dayIn(r, y, m, ad)).padStart(2, '0')}`
    if (date >= anchor && date <= to) out.push(date)
  }
}

/** The rule as people read it: "every 3 months on day 15", "the first Monday of every month", "in April and October on day 10". */
export function ruleLabel(r: Rule, anchor: string) {
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  if (r.unit === 'week') return r.interval === 1 ? `every week on ${weekdays[new Date(utc(anchor)).getUTCDay()]}` : `every ${r.interval} weeks on ${weekdays[new Date(utc(anchor)).getUTCDay()]}`
  const on = r.nth === null ? `on day ${r.day ?? Number(anchor.slice(8))}` : `on the ${r.nth === -1 ? 'last' : ['first', 'second', 'third', 'fourth'][r.nth - 1]} ${r.weekday}`
  if (r.months) return `in ${r.months.map(m => names[m - 1]).join(' and ')} ${on}`
  return `${r.interval === 1 ? 'every month' : `every ${r.interval} months`} ${on}`
}
