import { fail, text, oneOf, find, put, bump, event, newId, business, type Context, type Row, type State } from './model'
import { cents, dollars } from './money'
import { formatCsv } from './csv-format'
import { localParts, dayLabel } from './time'
import { minutes } from './commands/time'
import type { Handler } from './commands/types'
import { credits, saveRule, ruleText, summary, totalCents, type Credit } from './commissions'

// COST-002, COST-006, COST-007 timesheets and payroll export. A technician's workweek is seven
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
// DISP-007, DISP-013, DISP-014 1099-NEC export. TEAM-003, TEAM-006 commissions and spiffs (commissions.ts)
// join the same files for the same people: Gusto's commission column per
// workweek, an ADP RUN earnings code with dollars, and QuickBooks Commission
// lines by date. Glove pays no one and files nothing.

export const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
const WEEK_LIMIT = 40 * 60

const dateOk = (date: unknown, name: string) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ? date : fail('INPUT', `Give ${name} as YYYY-MM-DD.`, { field: name }, 400)
const addDays = (date: string, n: number) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const weekdayOf = (date: string) => weekdays[new Date(`${date}T00:00:00Z`).getUTCDay()]
/** Minutes as decimal hours, rounded half up to two places. */
export const hours = (m: number) => { const h = Math.floor((m * 100 + 30) / 60); return `${Math.floor(h / 100)}.${String(h % 100).padStart(2, '0')}` }

export function settings(s: State) {
  const p = s.business[0]?.payroll ?? {}
  return { weekStart: p.weekStart ?? 'monday', dailyOvertime: p.dailyOvertime ?? null, adp: p.adp ? { commission: 'COMM', ...p.adp } : null, commissionRules: p.commissionRules ?? [] } as { weekStart: (typeof weekdays)[number]; dailyOvertime: { afterHours: number; doubleAfterHours: number | null } | null; adp: { companyCode: string; payFrequency: string; regular: string; overtime: string; doubleTime: string; commission: string } | null; commissionRules: ReturnType<typeof saveRule> }
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
  const credited = credits(s, from, to)
  const tipItems = s.payments.flatMap(p => (p.effects ?? []).flatMap((e: Row) => {
    const date = localParts(e.at, business(s).timezone).date, ids = p.technicianIds ?? []
    if (date < from || date > to || !ids.length || !e.tipCents) return []
    const sign = Math.sign(e.tipCents), amount = Math.abs(e.tipCents)
    return ids.map((id: string, i: number) => ({ technicianId: id, paymentId: p.id, date, cents: sign * (Math.floor(amount / ids.length) + (i < amount % ids.length ? 1 : 0)) }))
  }))
  const people: any[] = [], left: { technicianId: string; name: string; reason: string }[] = []
  for (const tech of s.technicians) {
    const sheets = starts.map(w => timesheet(s, s.times, tech, w)).filter(t => t.minutes.worked > 0 || t.onTheClock || t.status !== 'not approved')
    const mine = credited.filter(c => c.technicianId === tech.id), tips = tipItems.filter((x: any) => x.technicianId === tech.id)
    const tipTotal = (rows: typeof tips) => dollars(rows.reduce((n: number, x: any) => n + x.cents, 0))
    if (!sheets.length && !mine.length && !tips.length) continue
    const reason = tech.subcontractor ? '1099 subcontractor: paid through the 1099-NEC totals, not payroll'
      : !sheets.length ? `commissions of $${summary(mine).total} but no approved time in the period`
        : sheets.find(t => t.onTheClock) ? `on the clock in the week of ${sheets.find(t => t.onTheClock)!.weekStart}`
          : sheets.find(t => t.status !== 'approved') ? `week of ${sheets.find(t => t.status !== 'approved')!.weekStart} ${sheets.find(t => t.status !== 'approved')!.status}` : null
    if (reason) { left.push({ technicianId: tech.id, name: tech.name, reason }); continue }
    const sum = (k: 'regular' | 'overtime' | 'doubleTime') => sheets.reduce((n, t) => n + t.minutes[k], 0)
    const inWeek = (w: string) => mine.filter(c => c.date >= w && c.date <= addDays(w, 6))
    const weekRows = starts.filter(w => sheets.some(t => t.weekStart === w) || inWeek(w).length).map(w => { const t = sheets.find(x => x.weekStart === w); return { weekStart: w, weekEnd: addDays(w, 6), hours: t?.hours ?? { regular: '0.00', overtime: '0.00', doubleTime: '0.00' }, commission: summary(inWeek(w)).total, tips: tipTotal(tips.filter((x: any) => x.date >= w && x.date <= addDays(w, 6))) } })
    people.push({ technicianId: tech.id, name: tech.name, payrollId: tech.payrollId || null, minutes: { regular: sum('regular'), overtime: sum('overtime'), doubleTime: sum('doubleTime') }, days: sheets.flatMap(t => t.days), weeks: weekRows, commission: summary(mine), tips: tipTotal(tips), tipItems: tips })
  }
  return { from, to, tipsEnabled: s.payments.length > 0, settings: settings(s), people: people.map(p => ({ ...p, hours: { regular: hours(p.minutes.regular), overtime: hours(p.minutes.overtime), doubleTime: hours(p.minutes.doubleTime) } })), left }
}

type Run = ReturnType<typeof payrollRun>
const us = (date: string) => `${date.slice(5, 7)}/${date.slice(8, 10)}/${date.slice(0, 4)}`
const splitName = (name: string) => { const [first, ...rest] = name.trim().split(/\s+/); return { first, last: rest.join(' ') } }

/**
 * Gusto Smart Import: Gusto matches the columns on upload and publishes no fixed employee layout outside an account (its template
 * is downloaded inside Gusto). Its help asks for a "workweeks" column with each week's date range beside that week's hours so
 * overtime lands in the right workweek, so there is one row per employee and approved workweek. Glove keeps no SSN.
 */
export const gustoCsv = (r: Run) => formatCsv([
  ['last_name', 'first_name', 'gusto_employee_id', 'workweeks', 'regular_hours', 'overtime_hours', 'double_overtime_hours', 'commission', ...(r.tipsEnabled ? ['tips'] : [])],
  ...r.people.flatMap(p => { const n = splitName(p.name); return p.weeks.map((w: Row) => [n.last, n.first, p.payrollId ?? '', `${w.weekStart} - ${w.weekEnd}`, w.hours.regular, w.hours.overtime, w.hours.doubleTime, w.commission, ...(r.tipsEnabled ? [w.tips] : [])]) }),
])

/**
 * ADP's "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418A), payroll-assigned identifier layout: a
 * `##GENERIC## V1.0` version row, the eleven column titles, then one row per employee and earnings code with hours.
 * Separate Check (0 = the regular check) and Rate Code (BASE = the first pay rate on the employee) are required there.
 */
export function adpCsv(r: Run) {
  const adp = r.settings.adp ?? fail('PAYROLL_SETUP', 'Set the ADP RUN company code (IID), pay frequency and earnings codes in payroll settings first.', null, 409)
  const rows: string[][] = []
  for (const p of r.people) for (const [code, h, m] of [[adp.regular, p.hours.regular, p.minutes.regular], [adp.overtime, p.hours.overtime, p.minutes.overtime], [adp.doubleTime, p.hours.doubleTime, p.minutes.doubleTime]] as const)
    if (m > 0) rows.push([adp.companyCode, adp.payFrequency, us(r.from), us(r.to), p.payrollId ?? '', code, h, '', '0', '', 'BASE'])
  // TEAM-003, TEAM-006: commissions and spiffs as dollars under the owner's commission earnings code.
  for (const p of r.people) if (totalCents(p.commission.items) > 0) rows.push([adp.companyCode, adp.payFrequency, us(r.from), us(r.to), p.payrollId ?? '', adp.commission, '', p.commission.total, '0', '', 'BASE'])
  for (const p of r.people) if (p.tips !== '0.00') rows.push([adp.companyCode, adp.payFrequency, us(r.from), us(r.to), p.payrollId ?? '', 'TIPS', '', p.tips, '0', '', 'BASE'])
  return '##GENERIC## V1.0\r\n' + formatCsv([['IID', 'Pay Frequency', 'Pay Period Start Date', 'Pay Period End Date', 'Employee ID', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code'], ...rows])
}

/**
 * QuickBooks Online Payroll's custom timesheet upload: Intuit publishes no fixed columns, only that each line is one entry with
 * the employee and a date plus units, the date format and each column's meaning chosen on upload. One line per employee, day
 * and pay item (Regular, Overtime, Double time), which the owner maps to their pay items.
 */
export const quickbooksCsv = (r: Run) => formatCsv([
  ['Employee', 'Date', 'Pay item', 'Hours', 'Amount'],
  ...r.people.flatMap(p => p.days.flatMap((d: Row) => ([['Regular', d.regular], ['Overtime', d.overtime], ['Double time', d.doubleTime]] as const).filter(([, m]) => m > 0).map(([item, m]) => [p.name, us(d.date), item, hours(m), '']))),
  ...r.people.flatMap(p => [...new Set((p.tipItems as any[]).map(c => c.date))].map(date => [p.name, us(date), 'Tips', '', dollars((p.tipItems as any[]).filter(c => c.date === date).reduce((n, c) => n + c.cents, 0))])),
  // TEAM-003, TEAM-006: one Commission line per person and local date of their credited sales.
  ...r.people.flatMap(p => [...new Set((p.commission.items as Credit[]).map(c => c.date))].map(date => [p.name, us(date), 'Commission', '', summary((p.commission.items as Credit[]).filter(c => c.date === date)).total])),
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
  const code = (v: unknown, name: string) => { const t = text(v, name, { max: 10 }); return /^[A-Za-z0-9]+$/.test(t) ? t : fail('INPUT', `${name} is up to 10 letters and digits as ADP RUN shows it.`, { field: name }, 400) }
  const adp = p.adp === undefined ? current.adp : p.adp === null ? null : { companyCode: code(p.adp.companyCode, 'adp.companyCode'), payFrequency: oneOf(p.adp.payFrequency, ['W', 'B', 'S', 'M'] as const, 'adp.payFrequency'), regular: code(p.adp.regular ?? 'REG', 'adp.regular'), overtime: code(p.adp.overtime ?? 'OTP', 'adp.overtime'), doubleTime: code(p.adp.doubleTime ?? 'DBL', 'adp.doubleTime'), commission: code(p.adp.commission ?? 'COMM', 'adp.commission') }
  // TEAM-003, TEAM-006: a commission rule version applies to sales credited on or after its "from" date (today unless given).
  const commissionRules = p.commissions === undefined ? current.commissionRules : saveRule(c.s, p.commissions, localParts(c.now, b.timezone).date)
  const rule = p.commissions === undefined ? null : commissionRules.find(r => r.from === (p.commissions.from ?? localParts(c.now, b.timezone).date))!
  const payroll = { weekStart, dailyOvertime: daily, adp, commissionRules }
  const row = bump(c.s, 'business', b, { payroll })
  event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'payroll.settings', summary: `${c.actor.name} set the workweek to start ${weekStart}, ${daily ? `daily overtime after ${daily.afterHours} h${daily.doubleAfterHours ? `, double time after ${daily.doubleAfterHours} h` : ''}` : 'no daily overtime rule'}${adp ? `, ADP RUN company ${adp.companyCode}` : ''}${rule ? `; commissions from ${rule.from}: ${ruleText(rule)}` : ''}`, data: payroll })
  return row
}
