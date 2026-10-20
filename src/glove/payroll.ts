import { fail, text, oneOf, find, put, bump, event, newId, business, type Context, type Row, type State } from './model'
import { formatCsv } from './csv-format'
import { localParts, dayLabel } from './time'
import { minutes } from './commands/time'
import type { Handler } from './commands/types'

// COST-002 timesheets and payroll export. A technician's workweek is seven
// local days in the business time zone from the owner's chosen week-start day
// (Monday unless set; fixed once any week is approved). Each closed shift
// counts whole minutes (COST-001 rounding) on the local day it started; job
// and travel timers are shown beside it. Daily overtime applies only when the
// owner sets a state rule (minutes past "after" hours a day are overtime, past
// "double after" double time); then, in day order, regular minutes past 40
// hours in the week become overtime. Hours are minutes / 60 rounded half up to
// two decimals per bucket. The owner approves a week once nobody is on the
// clock in it; any later change to its entries or to their overtime split
// marks it changed since approval until approved again. Payroll files carry only approved, unchanged weeks of
// people who are not 1099 subcontractors; subcontractors' totals stay in the
// DISP-007 1099-NEC export. Glove pays no one and files nothing.

export const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
const WEEK_LIMIT = 40 * 60

const dateOk = (date: unknown, name: string) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ? date : fail('INPUT', `Give ${name} as YYYY-MM-DD.`, { field: name }, 400)
const addDays = (date: string, n: number) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const weekdayOf = (date: string) => weekdays[new Date(`${date}T00:00:00Z`).getUTCDay()]
/** Minutes as decimal hours, rounded half up to two places. */
export const hours = (m: number) => { const h = Math.floor((m * 100 + 30) / 60); return `${Math.floor(h / 100)}.${String(h % 100).padStart(2, '0')}` }

export function settings(s: State) {
  const p = s.business[0]?.payroll ?? {}
  return { weekStart: p.weekStart ?? 'monday', dailyOvertime: p.dailyOvertime ?? null, adp: p.adp ?? null } as { weekStart: (typeof weekdays)[number]; dailyOvertime: { afterHours: number; doubleAfterHours: number | null } | null; adp: { companyCode: string; payFrequency: string; regular: string; overtime: string; doubleTime: string } | null }
}

function startOfWeek(s: State, date: unknown, name = 'week') {
  const d = dateOk(date, name), start = settings(s).weekStart
  if (weekdayOf(d) !== start) fail('INPUT', `A workweek starts on ${start[0].toUpperCase()}${start.slice(1)}; ${d} is a ${weekdayOf(d)}.`, { field: name }, 400)
  return d
}

/** One technician's workweek from the time entries given (the reader's visible ones). */
export function timesheet(s: State, times: Row[], tech: Row, weekStart: string) {
  const zone = business(s).timezone, rule = settings(s).dailyOvertime
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dayOf = (iso: string) => localParts(iso, zone).date
  const entries = times.filter(t => t.technicianId === tech.id && days.includes(dayOf(t.startAt)))
  let weekRegular = 0
  const rows = days.map(date => {
    const on = entries.filter(t => dayOf(t.startAt) === date && t.endAt)
    const sum = (kind: string) => on.filter(t => t.kind === kind).reduce((n, t) => n + minutes(t.startAt, t.endAt), 0)
    const worked = sum('shift')
    let regular = worked, overtime = 0, doubleTime = 0
    if (rule) {
      const after = rule.afterHours * 60, dbl = rule.doubleAfterHours === null ? Infinity : rule.doubleAfterHours * 60
      regular = Math.min(worked, after); overtime = Math.max(0, Math.min(worked, dbl) - after); doubleTime = Math.max(0, worked - dbl)
    }
    const weekly = Math.max(0, Math.min(regular, weekRegular + regular - WEEK_LIMIT))
    regular -= weekly; overtime += weekly; weekRegular += regular
    return { date, label: dayLabel(date), worked, job: sum('job'), travel: sum('travel'), regular, overtime, doubleTime }
  })
  const total = (k: 'worked' | 'job' | 'travel' | 'regular' | 'overtime' | 'doubleTime') => rows.reduce((n, r) => n + r[k], 0)
  const minutesTotal = { worked: total('worked'), job: total('job'), travel: total('travel'), regular: total('regular'), overtime: total('overtime'), doubleTime: total('doubleTime') }
  const fingerprint = entries.map(t => `${t.id}:${t.version}`).sort()
  const approval = s.timesheets.find(a => a.technicianId === tech.id && a.weekStart === weekStart) ?? null
  const onTheClock = entries.some(t => !t.endAt)
  // An approval stands while the week's entries and their split (under today's overtime rule) are what the owner approved.
  const status = !approval ? 'not approved' : approval.entries.join() === fingerprint.join() && JSON.stringify(approval.minutes) === JSON.stringify(minutesTotal) ? 'approved' : 'changed since approval'
  return {
    technicianId: tech.id, name: tech.name, payrollId: tech.payrollId || null, subcontractor: !!tech.subcontractor, weekStart, weekEnd: days[6], onTheClock, status,
    approval: approval && { id: approval.id, version: approval.version, by: approval.by.name, at: approval.at },
    overtimeFlag: minutesTotal.overtime + minutesTotal.doubleTime > 0,
    days: rows.map(r => ({ ...r, hours: { worked: hours(r.worked), job: hours(r.job), travel: hours(r.travel), regular: hours(r.regular), overtime: hours(r.overtime), doubleTime: hours(r.doubleTime) } })),
    minutes: minutesTotal, hours: Object.fromEntries(Object.entries(minutesTotal).map(([k, v]) => [k, hours(v)])) as Record<keyof typeof minutesTotal, string>,
    fingerprint,
  }
}

/** Every technician's week the reader may see: technicians read only their own. */
export function week(s: State, view: { times: Row[]; technicians: Row[] }, weekStart: unknown) {
  const start = startOfWeek(s, weekStart)
  return { weekStart: start, weekEnd: addDays(start, 6), settings: settings(s), timesheets: view.technicians.filter(t => t.active !== false || view.times.some(x => x.technicianId === t.id)).map(t => timesheet(s, view.times, t, start)).map(({ fingerprint: _f, ...rest }) => rest) }
}

/** A pay period of whole workweeks: who is in the payroll files and who is left out, and why. */
export function payrollRun(s: State, fromDate: unknown, toDate: unknown) {
  const from = startOfWeek(s, fromDate, 'from'), to = dateOk(toDate, 'to')
  const weeks = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000 + 1
  if (weeks % 7 !== 0 || weeks < 7 || weeks > 42) fail('INPUT', 'A pay period is 1 to 6 whole workweeks: to is the last day of a workweek.', { field: 'to' }, 400)
  const starts = Array.from({ length: weeks / 7 }, (_, i) => addDays(from, i * 7))
  const people: any[] = [], left: { technicianId: string; name: string; reason: string }[] = []
  for (const tech of s.technicians) {
    const sheets = starts.map(w => timesheet(s, s.times, tech, w)).filter(t => t.minutes.worked > 0 || t.onTheClock || t.status !== 'not approved')
    if (!sheets.length) continue
    const reason = tech.subcontractor ? '1099 subcontractor: paid through the 1099-NEC totals, not payroll'
      : sheets.find(t => t.onTheClock) ? `on the clock in the week of ${sheets.find(t => t.onTheClock)!.weekStart}`
        : sheets.find(t => t.status !== 'approved') ? `week of ${sheets.find(t => t.status !== 'approved')!.weekStart} ${sheets.find(t => t.status !== 'approved')!.status}` : null
    if (reason) { left.push({ technicianId: tech.id, name: tech.name, reason }); continue }
    const sum = (k: 'regular' | 'overtime' | 'doubleTime') => sheets.reduce((n, t) => n + t.minutes[k], 0)
    people.push({ technicianId: tech.id, name: tech.name, payrollId: tech.payrollId || null, minutes: { regular: sum('regular'), overtime: sum('overtime'), doubleTime: sum('doubleTime') }, days: sheets.flatMap(t => t.days) })
  }
  return { from, to, settings: settings(s), people: people.map(p => ({ ...p, hours: { regular: hours(p.minutes.regular), overtime: hours(p.minutes.overtime), doubleTime: hours(p.minutes.doubleTime) } })), left }
}

type Run = ReturnType<typeof payrollRun>
const us = (date: string) => `${date.slice(5, 7)}/${date.slice(8, 10)}/${date.slice(0, 4)}`
const splitName = (name: string) => { const [first, ...rest] = name.trim().split(/\s+/); return { first, last: rest.join(' ') } }

/** Gusto's hours-and-earnings upload columns, one row per employee. Glove keeps no SSN, so that column stays empty. */
export const gustoCsv = (r: Run) => formatCsv([
  ['last_name', 'first_name', 'ssn', 'title', 'gusto_employee_id', 'regular_hours', 'overtime_hours', 'double_overtime_hours'],
  ...r.people.map(p => { const n = splitName(p.name); return [n.last, n.first, '', '', p.payrollId ?? '', p.hours.regular, p.hours.overtime, p.hours.doubleTime] }),
])

/** RUN Powered by ADP's pay-data import: a version row, then one row per employee and earnings code with hours. */
export function adpCsv(r: Run) {
  const adp = r.settings.adp ?? fail('PAYROLL_SETUP', 'Set the ADP RUN company code (IID), pay frequency and earnings codes in payroll settings first.', null, 409)
  const rows: string[][] = []
  for (const p of r.people) for (const [code, h, m] of [[adp.regular, p.hours.regular, p.minutes.regular], [adp.overtime, p.hours.overtime, p.minutes.overtime], [adp.doubleTime, p.hours.doubleTime, p.minutes.doubleTime]] as const)
    if (m > 0) rows.push([adp.companyCode, adp.payFrequency, us(r.from), us(r.to), p.payrollId ?? '', code, h, '', '', '', ''])
  return '##GENERIC## V1.0\r\n' + formatCsv([['IID', 'Pay Frequency', 'Pay Period Start', 'Pay Period End', 'Employee Id', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code'], ...rows])
}

/** QuickBooks timesheet import's date-and-units layout: one line per employee, day and pay item, mapped on upload. */
export const quickbooksCsv = (r: Run) => formatCsv([
  ['Employee', 'Date', 'Pay item', 'Hours'],
  ...r.people.flatMap(p => p.days.flatMap((d: Row) => ([['Regular', d.regular], ['Overtime', d.overtime], ['Double time', d.doubleTime]] as const).filter(([, m]) => m > 0).map(([item, m]) => [p.name, us(d.date), item, hours(m)]))),
])

/** People in the payroll files without a payroll ID ADP RUN can match. */
export const missingIds = (r: Run) => r.people.filter(p => !p.payrollId).map(p => p.name)

export const payroll: Handler = async (c, type, p) => {
  if (type === 'payroll.settings') return saveSettings(c, p)
  if (type !== 'timesheet.approve') return undefined
  const tech = find(c.s, 'technicians', p.technicianId)
  if (tech.subcontractor) fail('SUBCONTRACTOR', `${tech.name} is a 1099 subcontractor; their totals are in the 1099-NEC export, not payroll.`)
  const start = startOfWeek(c.s, p.weekStart, 'weekStart')
  const sheet = timesheet(c.s, c.s.times, tech, start)
  if (sheet.onTheClock) fail('ON_THE_CLOCK', `${tech.name} is still on the clock in this week. Approve once every shift is closed.`)
  if (!sheet.fingerprint.length) fail('NO_TIME', `${tech.name} has no time in the week of ${start}.`)
  if (sheet.status === 'approved') fail('APPROVED', 'This timesheet is already approved as it stands.')
  const fields = { technicianId: tech.id, weekStart: start, entries: sheet.fingerprint, minutes: sheet.minutes, by: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, at: c.now }
  const existing = c.s.timesheets.find(a => a.technicianId === tech.id && a.weekStart === start)
  const row = existing ? bump(c.s, 'timesheets', existing, fields) : put(c.s, 'timesheets', { id: newId(), version: 1, createdAt: c.now, ...fields })
  event(c, { jobId: null, subjectKind: 'timesheet', subjectId: row.id, kind: 'timesheet.approved', summary: `${c.actor.name} ${existing ? 're-approved' : 'approved'} ${tech.name}'s timesheet for the week of ${dayLabel(start)}: ${sheet.hours.regular} regular, ${sheet.hours.overtime} overtime, ${sheet.hours.doubleTime} double-time hours`, data: { technicianId: tech.id, weekStart: start, minutes: sheet.minutes } })
  return { ...row, timesheet: { ...sheet, status: 'approved' } }
}

function saveSettings(c: Context, p: any) {
  const b = business(c.s), current = settings(c.s)
  const weekStart = oneOf(p.weekStart ?? current.weekStart, weekdays, 'weekStart')
  if (weekStart !== current.weekStart && c.s.timesheets.length) fail('WORKWEEK_FIXED', 'The workweek is fixed once a timesheet is approved.')
  const hoursValue = (v: unknown, name: string) => typeof v === 'number' && Number.isInteger(v * 4) && v > 0 && v < 24 ? v : fail('INPUT', `${name} is hours in a day, in quarter hours, between 0 and 24.`, { field: name }, 400)
  const daily = p.dailyOvertime === undefined ? current.dailyOvertime : p.dailyOvertime === null ? null : { afterHours: hoursValue(p.dailyOvertime.afterHours, 'dailyOvertime.afterHours'), doubleAfterHours: p.dailyOvertime.doubleAfterHours == null ? null : hoursValue(p.dailyOvertime.doubleAfterHours, 'dailyOvertime.doubleAfterHours') }
  if (daily?.doubleAfterHours != null && daily.doubleAfterHours <= daily.afterHours) fail('INPUT', 'Double time starts after overtime does.', { field: 'dailyOvertime.doubleAfterHours' }, 400)
  const code = (v: unknown, name: string) => { const t = text(v, name, { max: 20 }); return /^[A-Za-z0-9]+$/.test(t) ? t : fail('INPUT', `${name} is letters and digits as ADP RUN shows it.`, { field: name }, 400) }
  const adp = p.adp === undefined ? current.adp : p.adp === null ? null : { companyCode: code(p.adp.companyCode, 'adp.companyCode'), payFrequency: oneOf(p.adp.payFrequency, ['W', 'B', 'S', 'M'] as const, 'adp.payFrequency'), regular: code(p.adp.regular ?? 'REG', 'adp.regular'), overtime: code(p.adp.overtime ?? 'OTP', 'adp.overtime'), doubleTime: code(p.adp.doubleTime ?? 'DBL', 'adp.doubleTime') }
  const payroll = { weekStart, dailyOvertime: daily, adp }
  const row = bump(c.s, 'business', b, { payroll })
  event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'payroll.settings', summary: `${c.actor.name} set the workweek to start ${weekStart}, ${daily ? `daily overtime after ${daily.afterHours} h${daily.doubleAfterHours ? `, double time after ${daily.doubleAfterHours} h` : ''}` : 'no daily overtime rule'}${adp ? `, ADP RUN company ${adp.companyCode}` : ''}`, data: payroll })
  return row
}
