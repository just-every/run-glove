import { useEffect, useState } from 'react'
import { shiftDate, today, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, money, useAction } from './controls'
import { can } from './roles'

// COST-002 weekly timesheets: each person's clock and job time for a workweek
// with overtime past 40 hours (and the owner's daily rule) split out, the
// owner's approval, the payroll settings, and the Gusto, ADP RUN and
// QuickBooks Payroll files of approved weeks (GET /api/glove/timesheets and
// /api/glove/reports/payroll-<kind>.csv), with TEAM-003 commissions and spiffs
// for the week from the payroll JSON. Glove pays no one and files nothing.

const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const startOf = (date: string, weekStart: string) => shiftDate(date, -((new Date(`${date}T00:00:00Z`).getUTCDay() - weekdays.indexOf(weekStart) + 7) % 7))
const tone = (status: string) => status === 'approved' ? 'green' : status === 'changed since approval' ? 'gold' : 'grey'

export function Timesheets({ s, run }: { s: Glove; run: Run }) {
  const weekStart = s.business[0]?.payroll?.weekStart ?? 'monday'
  const [week, setWeek] = useState(startOf(today(s.business[0]?.timezone ?? 'America/Chicago'), weekStart))
  const [data, setData] = useState<Rec | null>(null), [failure, setFailure] = useState('')
  const { error, act } = useAction()
  const start = startOf(week, weekStart)
  useEffect(() => {
    let live = true; setData(null); setFailure('')
    void fetch(`/api/glove/timesheets?week=${start}`, { credentials: 'same-origin', cache: 'no-store' }).then(async r => {
      const body = await r.json() as Rec
      if (!r.ok) throw new Error(body.error?.message ?? 'Timesheets could not load.')
      if (live) setData(body)
    }).catch(e => { if (live) setFailure(e.message) })
    return () => { live = false }
  }, [start, s.version])
  const sheets = (data?.timesheets ?? []).filter((t: Rec) => t.hours.worked !== '0.00' || t.onTheClock || t.status !== 'not approved')
  const period = `from=${start}&to=${shiftDate(start, 6)}`
  return <section className="panel" aria-labelledby="timesheets-title">
    <h2 id="timesheets-title">Timesheets</h2>
    <p className="muted">Clock time by the local day each shift started. Overtime past 40 hours a week{data?.settings.dailyOvertime ? `, and past ${data.settings.dailyOvertime.afterHours} hours a day${data.settings.dailyOvertime.doubleAfterHours ? ` (double time past ${data.settings.dailyOvertime.doubleAfterHours})` : ''}` : ''}. Hours for your payroll provider; Glove pays no one and files nothing.</p>
    <div className="form-grid"><Field label="Week of" hint={`Weeks start on ${weekStart[0].toUpperCase()}${weekStart.slice(1)}.`}>{p => <input {...p} type="date" value={week} onChange={e => setWeek(e.target.value || week)} />}</Field></div>
    {failure && <p role="alert" className="problem">{failure}</p>}
    {!data && !failure && <p role="status">Loading timesheets…</p>}
    {data && !sheets.length && <Empty title="No time this week" />}
    <ul className="rows">{sheets.map((t: Rec) => <li key={t.technicianId} aria-label={`Timesheet for ${t.name}`}>
      <div>
        <strong>{t.name}</strong> {!t.subcontractor && <Badge tone={tone(t.status)}>{t.status}</Badge>}{t.overtimeFlag && <> <Badge tone="gold">overtime</Badge></>}{t.subcontractor && <> <Badge tone="grey">1099 subcontractor</Badge></>}
        <p>{t.hours.worked} h worked ({t.hours.job} on jobs, {t.hours.travel} travel) · {t.hours.regular} regular · {t.hours.overtime} overtime · {t.hours.doubleTime} double time</p>
        {t.onTheClock && <p className="muted">Still on the clock this week.</p>}
        {t.approval && <p className="muted">Approved by {t.approval.by}</p>}
      </div>
      {can(s.actor, 'timesheet.approve') && !t.subcontractor && t.status !== 'approved' && !t.onTheClock && <button type="button" onClick={() => void act(run('timesheet.approve', { technicianId: t.technicianId, weekStart: start }))}>Approve timesheet</button>}
    </li>)}</ul>
    <Problem error={error} />
    {s.actor.reads.includes('export') && <Commissions period={period} version={s.version} />}
    {s.actor.reads.includes('export') && <p className="actions"><a href={`/api/glove/reports/payroll-gusto.csv?${period}`} download>Gusto hours CSV</a><a href={`/api/glove/reports/payroll-adp-run.csv?${period}`} download>ADP RUN pay data CSV</a><a href={`/api/glove/reports/payroll-quickbooks.csv?${period}`} download>QuickBooks Payroll timesheet CSV</a></p>}
    {can(s.actor, 'payroll.settings') && <PayrollSettings s={s} run={run} />}
  </section>
}

/** TEAM-003: the week's commissions and spiffs per person, as the payroll files carry them. */
function Commissions({ period, version }: { period: string; version: number }) {
  const [run, setRun] = useState<Rec | null>(null)
  useEffect(() => {
    let live = true
    void fetch(`/api/glove/reports/payroll.json?${period}`, { credentials: 'same-origin', cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(body => { if (live) setRun(body as Rec | null) })
    return () => { live = false }
  }, [period, version])
  const earners = [...(run?.people ?? []).filter((p: Rec) => p.commission.items.length), ...(run?.left ?? []).filter((p: Rec) => p.reason.startsWith('commissions'))]
  if (!earners.length) return null
  return <div aria-label="Commissions this week"><h3>Commissions this week</h3><ul className="rows">{earners.map((p: Rec) => <li key={p.technicianId}><div>
    <strong>{p.name}</strong>
    {p.commission ? <p>{money(p.commission.total)}: {[p.commission.sold.amount !== '0.00' && `${money(p.commission.sold.amount)} on ${money(p.commission.sold.revenue)} sold`, p.commission.completed.amount !== '0.00' && `${money(p.commission.completed.amount)} on ${money(p.commission.completed.revenue)} completed`, p.commission.agreements.count > 0 && `${money(p.commission.agreements.amount)} for ${p.commission.agreements.count} agreement${p.commission.agreements.count === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</p> : <p className="muted">Not in the payroll files: {p.reason}</p>}
  </div></li>)}</ul></div>
}

function PayrollSettings({ s, run }: { s: Glove; run: Run }) {
  const saved = s.business[0]?.payroll ?? {}, rule = (saved.commissionRules ?? []).at(-1) ?? {}
  const [v, setV] = useState({ weekStart: saved.weekStart ?? 'monday', after: String(saved.dailyOvertime?.afterHours ?? ''), double: String(saved.dailyOvertime?.doubleAfterHours ?? ''), companyCode: saved.adp?.companyCode ?? '', payFrequency: saved.adp?.payFrequency ?? 'W', regular: saved.adp?.regular ?? 'REG', overtime: saved.adp?.overtime ?? 'OTP', doubleTime: saved.adp?.doubleTime ?? 'DBL', commission: saved.adp?.commission ?? 'COMM', soldPercent: rule.soldPercent ?? '', completedPercent: rule.completedPercent ?? '', agreementSpiff: rule.agreementSpiff ?? '', from: today(s.business[0]?.timezone ?? 'America/Chicago') })
  const { error, act } = useAction()
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const save = () => act(run('payroll.settings', {
    weekStart: v.weekStart,
    dailyOvertime: v.after ? { afterHours: Number(v.after), doubleAfterHours: v.double ? Number(v.double) : null } : null,
    adp: v.companyCode ? { companyCode: v.companyCode, payFrequency: v.payFrequency, regular: v.regular, overtime: v.overtime, doubleTime: v.doubleTime, commission: v.commission } : null,
    commissions: { from: v.from, soldPercent: v.soldPercent || null, completedPercent: v.completedPercent || null, agreementSpiff: v.agreementSpiff || null },
  }))
  return <form onSubmit={e => { e.preventDefault(); void save() }} aria-label="Payroll settings">
    <h3>Payroll settings</h3>
    <div className="form-grid">
      <Field label="Workweek starts" hint="Fixed once a timesheet is approved.">{p => <select {...p} value={v.weekStart} onChange={set('weekStart')}>{weekdays.map(d => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}</select>}</Field>
      <Field label="Daily overtime after (hours)" hint="Only where your state sets a daily rule; leave empty otherwise.">{p => <input {...p} inputMode="decimal" value={v.after} onChange={set('after')} />}</Field>
      <Field label="Daily double time after (hours)">{p => <input {...p} inputMode="decimal" value={v.double} onChange={set('double')} />}</Field>
      <Field label="ADP RUN company code (IID)">{p => <input {...p} value={v.companyCode} onChange={set('companyCode')} />}</Field>
      <Field label="ADP RUN pay frequency">{p => <select {...p} value={v.payFrequency} onChange={set('payFrequency')}><option value="W">Weekly</option><option value="B">Biweekly</option><option value="S">Semimonthly</option><option value="M">Monthly</option></select>}</Field>
      <Field label="ADP earnings code: regular" hint="As your ADP earnings codes report shows it.">{p => <input {...p} value={v.regular} onChange={set('regular')} />}</Field>
      <Field label="ADP earnings code: overtime">{p => <input {...p} value={v.overtime} onChange={set('overtime')} />}</Field>
      <Field label="ADP earnings code: double time">{p => <input {...p} value={v.doubleTime} onChange={set('doubleTime')} />}</Field>
      <Field label="ADP earnings code: commission">{p => <input {...p} value={v.commission} onChange={set('commission')} />}</Field>
      <Field label="Commission on sold revenue (%)" hint="Of each accepted quote before tax, to the technician who sold it.">{p => <input {...p} inputMode="decimal" value={v.soldPercent} onChange={set('soldPercent')} />}</Field>
      <Field label="Commission on completed revenue (%)" hint="Of each approved invoice before tax, shared by the technicians who completed the job.">{p => <input {...p} inputMode="decimal" value={v.completedPercent} onChange={set('completedPercent')} />}</Field>
      <Field label="Spiff per agreement sold ($)">{p => <input {...p} inputMode="decimal" value={v.agreementSpiff} onChange={set('agreementSpiff')} />}</Field>
      <Field label="Commission rules apply from" hint="Sales on or after this date; earlier sales keep the rules they were made under.">{p => <input {...p} type="date" value={v.from} onChange={set('from')} />}</Field>
    </div>
    <Problem error={error} />
    <div className="actions"><button type="submit">Save payroll settings</button></div>
  </form>
}

/** The payroll provider's employee ID on a technician record (Gusto employee ID, ADP RUN file number). */
export function PayrollId({ s, t, run }: { s: Glove; t: Rec; run: Run }) {
  const [value, setValue] = useState(t.payrollId ?? '')
  const { error, act } = useAction()
  if (!can(s.actor, 'technician.save') || t.subcontractor) return null
  return <form className="inline-form" onSubmit={e => { e.preventDefault(); void act(run('technician.save', { id: t.id, version: t.version, name: t.name, operatorId: t.operatorId ?? undefined, active: t.active, payrollId: value })) }}>
    <Field label={`Payroll ID for ${t.name}`} hint="Their employee ID in Gusto or ADP RUN.">{p => <input {...p} value={value} onChange={e => setValue(e.target.value)} />}</Field>
    <button type="submit">Save payroll ID</button>
    <Problem error={error} />
  </form>
}
