import { instant, localParts } from './time'

// DISP-004: busy time read from a technician's calendar feed (the secret iCal
// address Google Calendar, Outlook and most calendars publish). Only start and
// end are kept, never titles. An event marked free (TRANSP:TRANSPARENT) or
// cancelled is not busy. Times in UTC (Z) or with a TZID are exact; floating
// times and all-day dates are read in the business time zone (an all-day event
// is busy from its date's midnight to its end date's midnight). A DAILY or
// WEEKLY rule (INTERVAL, COUNT, UNTIL, BYDAY) is expanded; any other rule is
// read as its first occurrence only and counted in `unexpanded`.

export type Busy = { start: string; end: string }
const DAY = 86_400_000
const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function when(prop: string, value: string, zone: string): { at: string; allDay: boolean; zone: string } | null {
  const tzid = /;TZID=("?)([^;:"]+)\1/.exec(prop)?.[2]
  const date = /^(\d{4})(\d{2})(\d{2})$/.exec(value)
  if (date) return { at: instant(`${date[1]}-${date[2]}-${date[3]}`, '00:00', zone, 'DTSTART'), allDay: true, zone }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value)
  if (!m) return null
  const day = `${m[1]}-${m[2]}-${m[3]}`, time = `${m[4]}:${m[5]}`
  if (m[7]) return { at: new Date(`${day}T${time}:${m[6]}Z`).toISOString(), allDay: false, zone: 'UTC' }
  try { return { at: instant(day, time, tzid ?? zone, 'DTSTART'), allDay: false, zone: tzid ?? zone } } catch { return null }
}

/** Busy spans overlapping [from, to), sorted, from the feed's text. */
export function busyFrom(ics: string, zone: string, from: string, to: string) {
  const lines = ics.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  const busy: Busy[] = []
  let event: Record<string, { prop: string; value: string }> | null = null, unexpanded = 0
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { event = {}; continue }
    if (line === 'END:VEVENT' && event) {
      const e = event; event = null
      if (e.TRANSP?.value === 'TRANSPARENT' || e.STATUS?.value === 'CANCELLED' || !e.DTSTART) continue
      const start = when(e.DTSTART.prop, e.DTSTART.value, zone)
      if (!start) continue
      const end = e.DTEND ? when(e.DTEND.prop, e.DTEND.value, zone) : null
      const length = end ? Date.parse(end.at) - Date.parse(start.at) : start.allDay ? DAY : 0
      if (length <= 0) continue
      const rule = e.RRULE ? Object.fromEntries(e.RRULE.value.split(';').map(p => p.split('='))) : null
      const starts: number[] = []
      const first = Date.parse(start.at), limit = Date.parse(to)
      if (rule && ['DAILY', 'WEEKLY'].includes(rule.FREQ)) {
        const interval = Math.max(1, Number(rule.INTERVAL ?? 1)), count = rule.COUNT ? Number(rule.COUNT) : Infinity
        const until = rule.UNTIL ? Date.parse(when('UNTIL', rule.UNTIL, zone)?.at ?? to) : Infinity
        const byDay = rule.FREQ === 'WEEKLY' && rule.BYDAY ? new Set(String(rule.BYDAY).split(',').map(d => weekdays.indexOf(d.slice(-2)))) : null
        // Step a calendar day at a time on the event's own wall clock, so occurrences keep their local time across daylight saving.
        const local = localParts(start.at, start.zone), base = Date.parse(`${local.date}T00:00:00Z`)
        for (let k = 0, n = 0; n < count && k < 400 * interval; k++) {
          const date = new Date(base + k * DAY).toISOString().slice(0, 10), weekday = new Date(base + k * DAY).getUTCDay()
          const hit = rule.FREQ === 'DAILY' ? k % interval === 0 : Math.floor(k / 7) % interval === 0 && (byDay ? byDay.has(weekday) : k % 7 === 0)
          if (!hit) continue
          let t: number
          try { t = Date.parse(instant(date, local.time, start.zone, 'RRULE')) } catch { continue }
          if (t > Math.min(until, limit)) break
          starts.push(t); n++
        }
      } else { starts.push(first); if (rule) unexpanded++ }
      for (const t of starts) if (t < limit && t + length > Date.parse(from)) busy.push({ start: new Date(t).toISOString(), end: new Date(t + length).toISOString() })
      continue
    }
    if (!event) continue
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const prop = line.slice(0, colon), name = prop.split(';')[0].toUpperCase()
    event[name] = { prop, value: line.slice(colon + 1).trim() }
  }
  busy.sort((a, b) => a.start.localeCompare(b.start))
  return { busy: busy.slice(0, 2000), unexpanded }
}
