import { fail, text, oneOf, find, put, bump, event, business, type Context, type Row } from '../model'
import { clockLabel, instant, localParts } from '../time'
import { assigned } from './field'
import type { Handler } from './types'

// Clock-ins and job timers (COST-001). A technician clocks in and out for the
// day and runs one timer at a time, travel or on the job, on a visit of theirs.
// Each entry keeps the phone's clock times; the phone queues them offline with
// the identity it gave them, so a resend lands once. Starting a timer stops the
// one running; clocking out and completing the visit stop it too. The desk
// corrects an entry's times with a reason, and the entry keeps its original.

export const timeKinds = ['shift', 'travel', 'job'] as const
const label = { shift: 'shift', travel: 'travel timer', job: 'job timer' } as const

const deviceTime = (value: unknown) => typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : fail('INPUT', 'deviceTime is the phone\'s clock time when this was recorded.', null, 400)
const me = (c: Context) => c.s.technicians.find(t => t.operatorId === c.actor.id) ?? fail('TECHNICIAN', 'Your sign-in is not linked to a technician yet. Ask the dispatcher to link it.', null, 403)
const openShift = (c: Context, tech: Row) => c.s.times.find(x => x.technicianId === tech.id && x.kind === 'shift' && !x.endAt)
const running = (c: Context, tech: Row) => c.s.times.find(x => x.technicianId === tech.id && x.kind !== 'shift' && !x.endAt)

/** Whole minutes between two instants, rounded half up. */
export const minutes = (startAt: string, endAt: string) => Math.floor((Date.parse(endAt) - Date.parse(startAt) + 30_000) / 60_000)

function close(c: Context, entry: Row, at: string, why: string) {
  const endAt = at < entry.startAt ? entry.startAt : at
  const row = bump(c.s, 'times', entry, { endAt, endReceivedAt: c.now })
  const tech = find(c.s, 'technicians', entry.technicianId), zone = business(c.s).timezone
  event(c, { jobId: entry.jobId, subjectKind: 'time', subjectId: entry.id, kind: `time.${entry.kind}.stop`, summary: `${tech.name} stopped the ${label[entry.kind as keyof typeof label]}${why} (phone time ${clockLabel(endAt, zone, c.now)}; ${minutes(entry.startAt, endAt)} min)`, data: null })
  return row
}

function open(c: Context, tech: Row, kind: string, at: string, visit: Row | null) {
  const row = put(c.s, 'times', { id: c.commandId, version: 1, createdAt: c.now, technicianId: tech.id, kind, visitId: visit?.id ?? null, jobId: visit?.jobId ?? null, startAt: at, endAt: null, startReceivedAt: c.now, endReceivedAt: null, original: null, corrections: [] })
  const job = visit ? find(c.s, 'jobs', visit.jobId) : null
  event(c, { jobId: row.jobId, subjectKind: 'time', subjectId: row.id, kind: `time.${kind}.start`, summary: `${tech.name} ${kind === 'shift' ? 'clocked in' : `started the ${label[kind as keyof typeof label]} on ${job!.number}`} (phone time ${clockLabel(at, business(c.s).timezone, c.now)})`, data: null })
  return row
}

/** Stop the technician's running timer on a visit when the visit is completed. */
export function stopTimerOn(c: Context, tech: Row, visitId: string, at: string) {
  const timer = running(c, tech)
  if (timer?.visitId === visitId) close(c, timer, at, ' on completing the visit')
}

export const time: Handler = async (c, type, p) => {
  switch (type) {
    case 'clock.in': {
      const tech = me(c), at = deviceTime(p.deviceTime)
      if (openShift(c, tech)) fail('CLOCKED_IN', 'You are already on the clock.')
      return open(c, tech, 'shift', at, null)
    }
    case 'clock.out': {
      const tech = me(c), at = deviceTime(p.deviceTime), shift = openShift(c, tech) ?? fail('NOT_CLOCKED_IN', 'You are not on the clock.')
      const timer = running(c, tech)
      if (timer) close(c, timer, at, ' on clocking out')
      return close(c, c.s.times.find(x => x.id === shift.id)!, at, '')
    }
    case 'timer.start': {
      const { visit, tech, current } = assigned(c, p.visitId), at = deviceTime(p.deviceTime), kind = oneOf(p.kind, ['travel', 'job'] as const, 'kind')
      if (!current) fail('NOT_ASSIGNED', 'This visit is no longer yours to time.')
      if (!openShift(c, tech)) fail('NOT_CLOCKED_IN', 'Clock in before starting a timer.')
      const timer = running(c, tech)
      if (timer) close(c, timer, at, ` to start the ${label[kind]}`)
      return open(c, tech, kind, at, visit)
    }
    case 'timer.stop': {
      const { visit, tech } = assigned(c, p.visitId), at = deviceTime(p.deviceTime), timer = running(c, tech)
      if (timer?.visitId !== visit.id) fail('NO_TIMER', 'No timer is running on this visit.')
      return close(c, timer!, at, '')
    }
    case 'time.correct': {
      const entry = find(c.s, 'times', p.id), zone = business(c.s).timezone
      if (p.version !== entry.version) fail('STALE', 'This time entry changed since you opened it. Review the current version and try again.', { id: entry.id, record: entry })
      if (!entry.endAt) fail('RUNNING', 'Correct a time entry once it has stopped.')
      const startAt = instant(p.start?.date, p.start?.time, zone, 'start'), endAt = instant(p.end?.date, p.end?.time, zone, 'end')
      if (endAt <= startAt) fail('TIME', 'The end comes after the start.', null, 400)
      const reason = text(p.reason, 'reason', { max: 500 })
      const correction = { by: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, at: c.now, reason, from: { startAt: entry.startAt, endAt: entry.endAt }, to: { startAt, endAt } }
      const row = bump(c.s, 'times', entry, { startAt, endAt, original: entry.original ?? { startAt: entry.startAt, endAt: entry.endAt }, corrections: [...entry.corrections, correction] })
      const tech = find(c.s, 'technicians', entry.technicianId), shown = (iso: string) => localParts(iso, zone).time
      event(c, { jobId: entry.jobId, subjectKind: 'time', subjectId: entry.id, kind: 'time.corrected', summary: `${c.actor.name} corrected ${tech.name}'s ${label[entry.kind as keyof typeof label]} from ${shown(entry.startAt)}–${shown(entry.endAt)} to ${shown(startAt)}–${shown(endAt)} (${minutes(startAt, endAt)} min): ${reason}`, data: correction })
      return row
    }
  }
}
