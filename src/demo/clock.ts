import { instant, localParts } from '../glove/time'

// The demo's clock. Every demo time is set from the moment the demo starts, in
// the business's zone: today's visits that have ended are done, the ones under
// way are on site, and every stamp (a booking, a call, a clock-in, an
// acceptance) lies before now, whatever time of day the demo opens.

export const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
export const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay()

/** Demo dates in the business's zone, relative to the moment the demo starts. */
export function demoClock(now: Date) {
 const zone = 'America/Chicago', local = localParts(now.toISOString(), zone)
 const day = (offset: number) => new Date(Date.parse(local.date + 'T12:00:00Z') + offset * 86400000).toISOString().slice(0, 10)
 const at = (offset: number, time = '09:00') => instant(day(offset), time, zone, 'demo date')
 /** `n` minutes before the demo started, to the minute. */
 const ago = (n: number) => new Date(Math.floor(now.getTime() / 60000 - n) * 60000).toISOString()
 const working = (offset: number) => ![0, 6].includes(weekday(day(offset)))
 /** The working day (Monday to Friday) before today, as a day offset. */
 const previous = () => { let k = -1; while (!working(k)) k--; return k }
 /** The next `count` working days (Monday to Friday) after today, as day offsets. */
 const workdays = (count: number) => { const out: number[] = []; for (let k = 1; out.length < count; k++) if (working(k)) out.push(k); return out }
 const minute = toMinutes(local.time)
 /** Where a visit of today stands at the demo's start. */
 const state = (start: string, end: string) => toMinutes(end) <= minute ? 'completed' : toMinutes(start) <= minute ? 'arrived' : 'booked'
 return { zone, day, at, ago, minute, working, previous, workdays, state }
}
export type DemoClock = ReturnType<typeof demoClock>

/** The technicians' booked time by day, and the first free slot ahead of now within their 8:00–16:00 hours. */
export function diary(clock: DemoClock, hours: [number, number] = [8 * 60, 16 * 60]) {
 const busy = new Map<string, [number, number][]>()
 const spans = (tech: number, offset: number) => busy.get(`${tech}:${offset}`) ?? []
 return {
  hold(tech: number, offset: number, start: string, end: string) { busy.set(`${tech}:${offset}`, [...spans(tech, offset), [toMinutes(start), toMinutes(end)]]) },
  /** The earliest `length`-minute slot from `from` today (quarter hours), else the technician's next working day. */
  firstFree(tech: number, length: number, from: number) {
   for (let offset = 0; offset < 21; offset++) {
    if (!clock.working(offset)) continue
    const taken = spans(tech, offset)
    for (let m = offset ? hours[0] : Math.max(hours[0], Math.ceil(Math.max(from, clock.minute) / 15) * 15); m + length <= hours[1]; m += 15) {
     if (taken.some(([a, b]) => m < b && a < m + length)) continue
     const until = Math.min(hours[1], ...taken.filter(([a]) => a >= m + length).map(([a]) => a))
     return { offset, start: toTime(m), end: toTime(m + length), freeFrom: toTime(Math.max(hours[0], ...taken.filter(([, b]) => b <= m).map(([, b]) => b))), freeUntil: toTime(until) }
    }
   }
   throw new Error('The demo found no free slot in three weeks')
  },
 }
}
