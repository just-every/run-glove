import { Problem, fail, find, bump, event, business, type Context, type Row } from '../model'
import { busyFrom } from '../calendar'
import { publicHost } from '../public-address'
import type { Handler } from './types'

// DISP-004: a technician's availability read from their calendar. The owner or
// the technician sets the calendar's secret iCal address; it is stored in
// glove_secrets, readable only by them (GET /api/glove/technicians/<id>/calendar),
// and never written to a record, an event, a command result or a log. Reading
// it stores busy spans (no titles) for the next 90 days on the technician, with
// when they were read; booking checks them under the owner's availability rule.

const READ_DAYS = 90

/** The owner, or the technician whose record it is. */
function mine(c: Context, p: any): Row {
  const tech = find(c.s, 'technicians', p.technicianId, 'technicians')
  if (c.actor.role !== 'owner' && tech.operatorId !== c.actor.id) fail('FORBIDDEN', 'Only the owner or this technician sets their calendar.', null, 403)
  return tech
}

/** Glove reads a calendar only over https from a public host, with no credentials in the address. */
const readable = (url: URL) => url.protocol === 'https:' && !url.username && !url.password && publicHost(url.hostname)

const address = (v: unknown) => {
  if (v === null) return null
  if (typeof v !== 'string' || v.length > 2000) return fail('INPUT', 'url is the calendar\'s secret iCal address (https), or null to disconnect.', { field: 'url' }, 400)
  let url: URL
  try { url = new URL(v.trim().replace(/^webcal:/i, 'https:')) } catch { return fail('INPUT', 'url is not an address.', { field: 'url' }, 400) }
  return readable(url) ? url.toString() : fail('INPUT', 'The calendar address must be https on the public internet.', { field: 'url' }, 400)
}

/** The feed's text. Each redirect is followed only to an address Glove would accept itself, at most five times. */
async function feed(address: string, name: string) {
  let url = new URL(address)
  for (let hop = 0; hop <= 5; hop++) {
    if (!readable(url)) fail('CALENDAR', `${name}'s calendar address leads somewhere other than a public https address.`, null, 502)
    const res = await fetch(url.toString(), { headers: { accept: 'text/calendar' }, redirect: 'manual' })
    const next = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null
    if (next) { url = new URL(next, url); continue }
    if (!res.ok) fail('CALENDAR', `${name}'s calendar could not be read (HTTP ${res.status}).`, null, 502)
    return res.text()
  }
  return fail('CALENDAR', `${name}'s calendar redirected too many times.`, null, 502)
}

export const calendar: Handler = async (c, type, p, db) => {
  switch (type) {
    case 'technician.calendar': {
      const tech = mine(c, p), url = address(p.url)
      c.sql.push(url ? { sql: "INSERT INTO glove_secrets(technician_id,kind,value,set_by,set_at) VALUES(?,'ical',?,?,?) ON CONFLICT(technician_id,kind) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [tech.id, url, c.actor.id, c.now] } : { sql: "DELETE FROM glove_secrets WHERE technician_id=? AND kind='ical'", params: [tech.id] })
      const row = bump(c.s, 'technicians', tech, { calendar: url ? { connected: true, setAt: c.now, setBy: c.actor.name, readAt: null, busy: [], unexpanded: 0 } : null })
      event(c, { jobId: null, subjectKind: 'technician', subjectId: tech.id, kind: 'technician.calendar', summary: url ? `${c.actor.name} connected ${tech.name}'s calendar` : `${c.actor.name} disconnected ${tech.name}'s calendar`, data: null })
      return { id: row.id, version: row.version, calendar: row.calendar }
    }
    case 'technician.calendarRead': {
      const tech = find(c.s, 'technicians', p.technicianId, 'technicians')
      if (c.actor.role === 'technician' && tech.operatorId !== c.actor.id) fail('FORBIDDEN', 'You read only your own calendar.', null, 403)
      const secret = await db.prepare("SELECT value FROM glove_secrets WHERE technician_id=? AND kind='ical'").bind(tech.id).first<{ value: string }>()
      if (!secret) fail('CALENDAR', `${tech.name} has no calendar connected.`)
      // The address is a credential: a failure names the HTTP status only, never the address.
      let text = ''
      try {
        text = await feed(secret!.value, tech.name)
      } catch (error) { if (error instanceof Problem) throw error; fail('CALENDAR', `${tech.name}'s calendar could not be reached.`, null, 502) }
      if (!text.includes('BEGIN:VCALENDAR')) fail('CALENDAR', `${tech.name}'s calendar address did not answer with a calendar.`, null, 502)
      const to = new Date(Date.parse(c.now) + READ_DAYS * 86_400_000).toISOString()
      const read = busyFrom(text, business(c.s).timezone, c.now, to)
      const row = bump(c.s, 'technicians', tech, { calendar: { ...tech.calendar, readAt: c.now, busy: read.busy, unexpanded: read.unexpanded } })
      event(c, { jobId: null, subjectKind: 'technician', subjectId: tech.id, kind: 'technician.calendarRead', summary: `${tech.name}'s calendar read: ${read.busy.length} busy span${read.busy.length === 1 ? '' : 's'} in the next ${READ_DAYS} days${read.unexpanded ? `; ${read.unexpanded} repeating event${read.unexpanded === 1 ? '' : 's'} read at the first occurrence only` : ''}`, data: null })
      return { id: row.id, version: row.version, calendar: row.calendar }
    }
  }
}
