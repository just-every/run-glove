import { fail } from './model'

// Visits are booked in the business's one operating timezone. A local date and
// clock time become an exact instant (stored as UTC ISO text); screens show the
// local wall time again. Times that do not exist (a daylight-saving gap) fail.

export function validZone(zone: unknown): string {
  if (typeof zone !== 'string' || !zone) return fail('TIMEZONE', 'Choose an IANA timezone such as America/Chicago.', null, 400)
  try { new Intl.DateTimeFormat('en-AU', { timeZone: zone }).format(0) } catch { return fail('TIMEZONE', `${zone} is not a timezone this runtime knows.`, null, 400) }
  return zone
}

function parts(instant: number, zone: string) {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(instant).map(p => [p.type, p.value]))
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` }
}

/** The local date and HH:MM of an instant in the zone. */
export const localParts = (iso: string, zone: string) => parts(Date.parse(iso), zone)

/** A local YYYY-MM-DD date as people read it in timeline text: "Thu 15 Oct". */
export const dayLabel = (date: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(Date.parse(`${date}T00:00:00Z`)).filter(p => p.type !== 'literal').map(p => p.value).join(' ')

/** A local HH:MM as US screens read it: "2:30 PM". */
export const wallTime = (hhmm: string) => { const h = Number(hhmm.slice(0, 2)); return `${h % 12 || 12}:${hhmm.slice(3, 5)} ${h < 12 ? 'AM' : 'PM'}` }
/** A local span: "2:30 PM – 4:00 PM". */
export const wallRange = (start: string, end: string) => `${wallTime(start)} – ${wallTime(end)}`

/** An instant's wall-clock time in the zone ("9:04 am"), with its day ("Thu 15 Oct, 9:04 am") when it is not on `sameDayAs`. */
export function clockLabel(iso: string, zone: string, sameDayAs?: string) {
  const time = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' }).format(Date.parse(iso))
  const day = localParts(iso, zone).date
  return sameDayAs && localParts(sameDayAs, zone).date === day ? time : `${dayLabel(day)}, ${time}`
}

export function instant(date: unknown, time: unknown, zone: string, name: string): string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return fail('TIME', `${name} needs a date (YYYY-MM-DD) and a time (HH:MM).`, { field: name }, 400)
  const guess = Date.parse(`${date}T${time}:00Z`)
  if (Number.isNaN(guess)) return fail('TIME', `${name} is not a real date and time.`, { field: name }, 400)
  // Two passes settle the zone offset around a daylight-saving change.
  let result = guess
  for (let i = 0; i < 2; i++) {
    const shown = parts(result, zone), shownMs = Date.parse(`${shown.date}T${shown.time}:00Z`)
    result += guess - shownMs
  }
  const check = parts(result, zone)
  if (check.date !== date || check.time !== time) return fail('TIME', `${date} ${time} does not exist in ${zone} (a daylight-saving change).`, { field: name }, 400)
  return new Date(result).toISOString()
}

type Span = { [key: string]: any }
export const overlaps = (a: Span, b: Span) => a.startAt < b.endAt && b.startAt < a.endAt
