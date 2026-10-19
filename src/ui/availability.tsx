import { useState } from 'react'
import type { Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'

// DISP-004 on the Team screen: what booking does when a technician lacks a
// skill, is off or works elsewhere, and each technician's skills, hours,
// time off and service ZIP codes.

const rules = [['skills', 'Technician lacks a required skill'], ['availability', 'Technician is off or outside working hours'], ['area', 'Site is outside the service area']] as const
export const defaultRules = { skills: 'refuse', availability: 'refuse', area: 'warn' }

/** The owner's warn-or-refuse choice per rule, inside the business form. */
export function EligibilityRules({ value, onChange }: { value: Record<string, string>; onChange: (next: Record<string, string>) => void }) {
  return <>{rules.map(([key, label]) => <Field key={key} label={label}>{p => <select {...p} value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })}><option value="refuse">Refuse the booking</option><option value="warn">Warn the dispatcher</option></select>}</Field>)}</>
}

const words = (v: string) => v.split(',').map(x => x.trim()).filter(Boolean)
const hoursText = (hours: Rec[] = []) => hours.map(h => `${h.day} ${h.start}-${h.end}`).join('\n')
const timeOffText = (spans: Rec[] = []) => spans.map(t => `${t.from} ${t.to}${t.reason ? ` ${t.reason}` : ''}`).join('\n')
const lines = (v: string) => v.split('\n').map(l => l.trim()).filter(Boolean)
const parseHours = (v: string) => lines(v).map(l => { const [day = '', span = ''] = l.split(/\s+/); const [start = '', end = ''] = span.split('-'); return { day: day.toLowerCase().slice(0, 3), start, end } })
const parseTimeOff = (v: string) => lines(v).map(l => { const [from = '', to = '', ...reason] = l.split(/\s+/); return { from, to: to || from, reason: reason.join(' ') } })

/** One technician's skills, working hours, time off and service area. */
export function Availability({ t, run, done }: { t: Rec; run: Run; done: () => void }) {
  const [form, setForm] = useState({ skills: (t.skills ?? []).join(', '), zips: (t.zips ?? []).join(', '), hours: hoursText(t.hours), timeOff: timeOffText(t.timeOff) })
  const { error, act } = useAction()
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  return <form className="panel" aria-label={`Availability for ${t.name}`} onSubmit={e => { e.preventDefault(); void act(run('technician.save', { id: t.id, version: t.version, name: t.name, operatorId: t.operatorId ?? undefined, active: t.active, skills: words(form.skills), zips: words(form.zips), hours: parseHours(form.hours), timeOff: parseTimeOff(form.timeOff) }), done) }}>
    <h3>Availability for {t.name}</h3>
    <div className="form-grid">
      <Field label="Skills and certifications" hint="Comma-separated, such as gas, EPA 608">{p => <input {...p} value={form.skills} onChange={set('skills')} />}</Field>
      <Field label="Service ZIP codes" hint="Comma-separated; empty serves everywhere">{p => <input {...p} value={form.zips} onChange={set('zips')} />}</Field>
      <Field label="Working hours" hint="One day per line: mon 08:00-17:00; empty means any time">{p => <textarea {...p} value={form.hours} onChange={set('hours')} />}</Field>
      <Field label="Time off" hint="One per line: 2026-10-21 2026-10-23 reason">{p => <textarea {...p} value={form.timeOff} onChange={set('timeOff')} />}</Field>
    </div>
    <Problem error={error} />
    <div className="actions"><button type="button" className="quiet" onClick={done}>Cancel</button><button className="primary" type="submit">Save availability</button></div>
  </form>
}
