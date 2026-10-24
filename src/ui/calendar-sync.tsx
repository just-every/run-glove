import { useState } from 'react'
import type { Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'

/** Owner-approved one-way calendar writes; credentials are never returned. */
export function CalendarSync({ t, run }: { t: Rec; run: Run }) {
  const [form, setForm] = useState({ provider: 'google', calendarId: '', clientId: '', clientSecret: '', refreshToken: '', details: false, confirm: false })
  const { error, act } = useAction(), current = t.calendarSync
  const field = (key: 'calendarId' | 'clientId' | 'clientSecret' | 'refreshToken') => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  return <form className="inline-form" aria-label={`Visit calendar for ${t.name}`} onSubmit={e => { e.preventDefault(); void act(run('calendar.connect', { technicianId: t.id, ...form })) }}>
    <h3>Visit calendar for {t.name}</h3>
    {current ? <><p>{current.provider === 'google' ? 'Google Calendar' : 'Microsoft 365'} connected. {current.details ? 'Customer name and service address included.' : 'Customer details hidden.'}</p>
      <p role="status">{t.calendarOutcome ? `Calendar ${t.calendarOutcome.action ?? 'sync'}: ${t.calendarOutcome.state}.` : 'No visit changes sent yet.'} {['unknown', 'sending'].includes(t.calendarOutcome?.state) && 'Check the provider before reconnecting; uncertain writes are not repeated.'}</p>
      <button type="button" onClick={() => void act(run('calendar.read', { technicianId: t.id }))}>Read provider busy time</button>
      <button type="button" onClick={() => void act(run('calendar.connect', { technicianId: t.id, disconnect: true }))}>Disconnect visit calendar</button>
      <p>Disconnecting retains existing events in the provider. Remove them there before connecting again.</p>
    </> : <><p>Use a delegated OAuth authorization for this technician’s calendar. Google needs calendar events access; Microsoft needs Calendars.ReadWrite and offline access. Visits sync one way; provider edits do not move visits in Glove.</p>
      <Field label="Calendar provider">{p => <select {...p} value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}><option value="google">Google Calendar</option><option value="microsoft">Microsoft 365</option></select>}</Field>
      <Field label="Calendar ID">{p => <input {...p} required value={form.calendarId} onChange={field('calendarId')} />}</Field>
      <Field label="OAuth client ID">{p => <input {...p} required value={form.clientId} onChange={field('clientId')} />}</Field>
      <Field label="OAuth client secret">{p => <input {...p} required type="password" autoComplete="off" value={form.clientSecret} onChange={field('clientSecret')} />}</Field>
      <Field label="OAuth refresh token">{p => <input {...p} required type="password" autoComplete="off" value={form.refreshToken} onChange={field('refreshToken')} />}</Field>
      <label><input type="checkbox" checked={form.details} onChange={e => setForm({ ...form, details: e.target.checked })} /> Include customer name and service address</label>
      <label><input type="checkbox" required checked={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.checked })} /> Approve creating, updating and deleting Glove visit events in this calendar</label>
      <button type="submit">Connect visit calendar</button>
    </>}
    <Problem error={error} />
  </form>
}
