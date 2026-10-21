import { branchIdOf } from './branches'
import { fail, oneOf, text, type Context, type Row } from './model'
import { inZones } from './maps'

// DISP-004: whether a technician may take a visit. A job needs the skills its
// price-book services require; a technician works set hours, takes time off
// and serves ZIP codes. Each kind of mismatch is refused or only warned (the
// dispatcher reviews it like any conflict), by the owner's setting.

export const ruleKinds = ['skills', 'availability', 'area'] as const
type Rule = (typeof ruleKinds)[number]
export const defaultRules: Record<Rule, 'refuse' | 'warn'> = { skills: 'refuse', availability: 'refuse', area: 'warn' }
export const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const clock = (v: unknown, name: string) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : fail('INPUT', `${name} is a time (HH:MM).`, { field: name }, 400)
const date = (v: unknown, name: string) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : fail('INPUT', `${name} is a date (YYYY-MM-DD).`, { field: name }, 400)
const list = (v: unknown, name: string, max: number) => Array.isArray(v) && v.length <= max ? v : fail('INPUT', `${name} is a list of at most ${max}.`, { field: name }, 400)

/** Skill names compare without case: "Gas" and "gas" are one skill. */
export const skills = (v: unknown, name: string) => [...new Set(list(v, name, 30).map((s, i) => text(s, `${name}[${i}]`, { max: 60 }).toLowerCase()))]

export const rules = (v: unknown) => Object.fromEntries(ruleKinds.map(k => [k, oneOf((v as any)?.[k] ?? defaultRules[k], ['refuse', 'warn'] as const, `eligibility.${k}`)])) as Record<Rule, 'refuse' | 'warn'>

/** A technician's working hours, time off and service ZIP codes; a field left out keeps its current value. */
export function availability(p: any, current: Row | null) {
  const keep = (key: string, parse: () => unknown) => ({ [key]: p[key] !== undefined ? parse() : current?.[key] ?? [] })
  return {
    ...keep('skills', () => skills(p.skills, 'skills')),
    ...keep('hours', () => list(p.hours, 'hours', 14).map((h: any, i: number) => {
      const span = { day: oneOf(h?.day, days, `hours[${i}].day`), start: clock(h?.start, `hours[${i}].start`), end: clock(h?.end, `hours[${i}].end`) }
      return span.end > span.start ? span : fail('INPUT', `hours[${i}] ends after it starts.`, null, 400)
    })),
    ...keep('timeOff', () => list(p.timeOff, 'timeOff', 100).map((t: any, i: number) => {
      const span = { from: date(t?.from, `timeOff[${i}].from`), to: date(t?.to, `timeOff[${i}].to`), reason: text(t?.reason, `timeOff[${i}].reason`, { optional: true, max: 200 }) }
      return span.to >= span.from ? span : fail('INPUT', `timeOff[${i}] ends on or after it starts.`, null, 400)
    })),
    ...keep('zips', () => [...new Set(list(p.zips, 'zips', 200).map((z: unknown, i: number) => typeof z === 'string' && /^\d{5}$/.test(z.trim()) ? z.trim() : fail('INPUT', `zips[${i}] is a 5-digit ZIP code.`, null, 400)))]),
  }
}

/** A site's ZIP code: the one given, else the last 5-digit ZIP (or ZIP+4) in its address. */
export const siteZip = (zip: unknown, address: string) => typeof zip === 'string' && zip.trim() ? (/^\d{5}$/.test(zip.trim()) ? zip.trim() : fail('INPUT', 'zip is a 5-digit ZIP code.', { field: 'zip' }, 400)) : ([...address.matchAll(/\b(\d{5})(?:-\d{4})?\b/g)].at(-1)?.[1] ?? '')

type Slot = { technicianId: string; startAt: string; endAt: string; local: { date: string; start: string; end: string } }

/** The warnings a dispatcher reviews for this booking; a mismatch the owner set to refuse fails here. */
export function eligibility(c: Context, job: Row, next: Slot) {
  const tech = c.s.technicians.find(t => t.id === next.technicianId)!, site = c.s.sites.find(x => x.id === job.siteId)
  const set = rules(c.s.business[0]?.eligibility)
  const found: { kind: Rule; code: string; message: string }[] = []
  const needed = [...new Set(job.lines.flatMap((l: Row) => c.s.services.find(s => s.id === l.serviceId)?.requiredSkills ?? []))] as string[]
  const lacking = needed.filter(s => !(tech.skills ?? []).includes(s))
  if (lacking.length) found.push({ kind: 'skills', code: `skill:${lacking.join(',')}`, message: `${tech.name} does not have the ${lacking.join(', ')} skill${lacking.length === 1 ? '' : 's'} ${job.number} needs.` })
  const { date: day, start, end } = next.local
  const off = (tech.timeOff ?? []).find((t: Row) => t.from <= day && day <= t.to)
  if (off) found.push({ kind: 'availability', code: `off:${day}`, message: `${tech.name} is off on ${day}${off.reason ? ` (${off.reason})` : ''}.` })
  const hours: Row[] = tech.hours ?? [], weekday = days[new Date(`${day}T00:00:00Z`).getUTCDay()]
  if (!off && hours.length && !hours.some(h => h.day === weekday && h.start <= start && end <= h.end)) found.push({ kind: 'availability', code: `hours:${day}`, message: `${start}–${end} on ${day} is outside ${tech.name}'s working hours.` })
  // Busy time read from the technician's calendar, as of when it was read.
  const busy = (tech.calendar?.busy ?? []).find((b: Row) => b.start < next.endAt && next.startAt < b.end)
  if (busy) found.push({ kind: 'availability', code: `calendar:${busy.start}`, message: `${tech.name}'s calendar shows busy time during ${start}–${end} on ${day} (calendar read ${tech.calendar.readAt}).` })
  const branchId = branchIdOf(c.s, job), branch = c.s.branches.find(b => b.id === branchId)
  const zip = site ? site.zip ?? siteZip('', site.address) : ''
  // DISP-002: the service area is the technician's ZIP codes and the zones drawn for them on the map together.
  const zones: Row[] = tech.zones ?? []
  if (!zones.length && (tech.zips ?? []).length && zip && !tech.zips.includes(zip)) found.push({ kind: 'area', code: `area:${zip}`, message: `${site!.address} (${zip}) is outside ${tech.name}'s service area.` })
  if (zones.length && site && !(zip && (tech.zips ?? []).includes(zip)) && !inZones(site, zones as any)) found.push({ kind: 'area', code: `area:${zip || site.id}`, message: `${tech.name}'s drawn zones${(tech.zips ?? []).length ? ' and ZIP codes' : ''} do not include ${site.address}${zip ? ` (${zip})` : ''}${site.location ? '' : ', which is not on the map yet'}.` })
  if (branch?.zips?.length && zip && !branch.zips.includes(zip)) found.push({ kind: 'area', code: `branch-area:${zip}`, message: `${site!.address} (${zip}) is outside ${branch.name}'s service area.` })
  const refused = found.filter(f => set[f.kind] === 'refuse')
  if (refused.length) fail('ELIGIBILITY', refused.map(f => f.message).join(' '), { refused: refused.map(({ code, message }) => ({ code, message })) })
  return found.map(({ code, message }) => ({ code, message }))
}
