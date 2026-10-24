import { instant } from './time'
import { branchZone } from './branches'
import { bump, event, fail, find, newId, oneOf, text, type Context, type State, type Row } from './model'
import { allow } from './access'
import { providerEvent } from './timeline'
import type { Handler } from './commands/types'

const kind = 'calendar-sync'
const enc = encodeURIComponent
const endpoint = (p: string, id: string) => p === 'google' ? `https://www.googleapis.com/calendar/v3/calendars/${enc(id)}/events` : `https://graph.microsoft.com/v1.0/me/calendars/${enc(id)}/events`
async function jsonRequest(url: string, init: RequestInit) {
  let r: Response
  try { r = await fetch(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(10000) }) }
  catch { return fail('CALENDAR_SYNC', 'Calendar outcome unconfirmed. Check the provider before reconnecting.', null, 502) }
  if (!r.ok) fail('CALENDAR_SYNC', `Calendar provider answered HTTP ${r.status}. Reconnect if authorization expired.`, null, 502)
  return r.status === 204 ? {} : r.json() as Promise<any>
}
async function token(secret: any, db?: D1Database) {
  const body = new URLSearchParams({ grant_type: 'refresh_token', client_id: secret.clientId, client_secret: secret.clientSecret, refresh_token: secret.refreshToken })
  const result = await jsonRequest(secret.provider === 'google' ? 'https://oauth2.googleapis.com/token' : 'https://login.microsoftonline.com/common/oauth2/v2.0/token', { method: 'POST', body })
  if (typeof result.access_token !== 'string') fail('CALENDAR_SYNC', 'Reconnect the calendar authorization.', null, 502)
  if (typeof result.refresh_token === 'string') {
    secret.refreshToken = result.refresh_token
    if (db) await db.prepare("UPDATE glove_calendar_credentials SET value=? WHERE provider=? AND json_extract(value,'$.connectionId')=?").bind(JSON.stringify(secret), `${kind}:${secret.technicianId}`, secret.connectionId).run()
  }
  return { authorization: `Bearer ${result.access_token}`, 'content-type': 'application/json' }
}
async function credential(db: D1Database, tech: Row) {
  const row = await db.prepare('SELECT value FROM glove_calendar_credentials WHERE provider=?').bind(`${kind}:${tech.id}`).first<{ value: string }>()
  const secret = row ? JSON.parse(row.value) : null
  if (!secret || secret.connectionId !== tech.calendarSync?.connectionId) fail('CALENDAR_SYNC', 'Reconnect this calendar after restore or authorization removal.', null, 409)
  return secret
}

/** Only busy instants survive the provider read. Managed visits are checked by dispatch itself. */
async function busyRead(secret: any, from: string, to: string, db: D1Database) {
  const headers = await token(secret, db), spans: { start: string; end: string }[] = []
  let next: string | null = secret.provider === 'google'
    ? `${endpoint('google', secret.calendarId)}?singleEvents=true&timeMin=${enc(from)}&timeMax=${enc(to)}&maxResults=2500`
    : `https://graph.microsoft.com/v1.0/me/calendars/${enc(secret.calendarId)}/calendarView?startDateTime=${enc(from)}&endDateTime=${enc(to)}&$top=1000`
  for (let page = 0; next && page < 20; page++) {
    const url: string = next
    // Continuations are accepted only on the fixed provider host and calendar path.
    if (!url.startsWith(secret.provider === 'google' ? endpoint('google', secret.calendarId) + '?' : `https://graph.microsoft.com/v1.0/me/calendars/${enc(secret.calendarId)}/calendarView?`)) fail('CALENDAR_SYNC', 'Calendar continuation was refused.', null, 502)
    const data = await jsonRequest(url, { headers: { ...headers, Prefer: 'outlook.timezone="UTC"' } })
    const rows = secret.provider === 'google' ? data.items : data.value
    if (!Array.isArray(rows)) fail('CALENDAR_SYNC', 'Calendar busy time was unavailable.', null, 502)
    for (const r of rows) {
      if (r.status === 'cancelled' || r.isCancelled || r.transparency === 'transparent' || r.showAs === 'free' || r.extendedProperties?.private?.gloveVisit || r.transactionId?.startsWith('glove-')) continue
      const start = r.start?.dateTime ?? (r.start?.date ? instant(r.start.date, '00:00', secret.timezone, 'calendar date') : null), end = r.end?.dateTime ?? (r.end?.date ? instant(r.end.date, '00:00', secret.timezone, 'calendar date') : null)
      if (!start || !end) fail('CALENDAR_SYNC', 'Calendar returned an unreadable busy interval.', null, 502)
      const utc = (v: string) => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(v) ? v : v + 'Z').toISOString()
      spans.push({ start: utc(start), end: utc(end) })
    }
    next = secret.provider === 'google' ? data.nextPageToken ? `${endpoint('google', secret.calendarId)}?singleEvents=true&timeMin=${enc(from)}&timeMax=${enc(to)}&maxResults=2500&pageToken=${enc(data.nextPageToken)}` : null : data['@odata.nextLink'] ?? null
  }
  if (next) fail('CALENDAR_SYNC', 'Calendar has too many busy intervals; narrow the booking range.', null, 502)
  return spans
}

export const calendarSync: Handler = async (c, type, p, db) => {
  if (!['calendar.connect', 'calendar.read'].includes(type)) return
  allow(c.actor, type)
  const tech = find(c.s, 'technicians', p.technicianId)
  if (type === 'calendar.connect') {
    if (p.disconnect === true) {
      c.sql.push({ sql: 'DELETE FROM glove_calendar_credentials WHERE provider=?', params: [`${kind}:${tech.id}`] })
      const row = bump(c.s, 'technicians', tech, { calendarSync: null })
      event(c, { jobId: null, subjectKind: 'technician', subjectId: tech.id, kind: 'calendar.disconnected', summary: `${c.actor.name} stopped calendar synchronization for ${tech.name}; existing provider events retained`, data: null })
      return row
    }
    if (tech.calendarSync) fail('CALENDAR_SYNC', 'Disconnect the current calendar before replacing it. Existing provider events are retained.', null, 409)
    if (p.confirm !== true) fail('CONSENT', 'Explicitly approve writing visits to this calendar.', null, 400)
    const provider = oneOf(p.provider, ['google', 'microsoft'] as const, 'provider'), connectionId = newId()
    const secret = { provider, connectionId, technicianId: tech.id, timezone: branchZone(c.s, tech), calendarId: text(p.calendarId, 'calendarId', { max: 500 }), clientId: text(p.clientId, 'clientId', { max: 1000 }), clientSecret: text(p.clientSecret, 'clientSecret', { max: 4000 }), refreshToken: text(p.refreshToken, 'refreshToken', { max: 8000 }) }
    await token(secret)
    c.sql.push({ sql: 'INSERT INTO glove_calendar_credentials(provider,value,set_by,set_at) VALUES(?,?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at', params: [`${kind}:${tech.id}`, JSON.stringify(secret), c.actor.id, c.now] })
    const row = bump(c.s, 'technicians', tech, { calendarSync: { provider, connectionId, details: p.details === true, connectedAt: c.now, readAt: null, busy: [] } })
    event(c, { jobId: null, subjectKind: 'technician', subjectId: tech.id, kind: 'calendar.connected', summary: `${c.actor.name} approved ${provider} visit synchronization for ${tech.name}${p.details === true ? ' with customer name and service address' : ' without customer details'}`, data: { provider, details: p.details === true } })
    return row
  }
  const secret = await credential(db, tech), to = new Date(Date.parse(c.now) + 90 * 86400000).toISOString()
  const busy = await busyRead(secret, c.now, to, db)
  const row = bump(c.s, 'technicians', tech, { calendarSync: { ...tech.calendarSync, busy, readAt: c.now } })
  event(c, { jobId: null, subjectKind: 'technician', subjectId: tech.id, kind: 'calendar.read', summary: `${tech.name}: ${busy.length} calendar busy intervals read`, data: { provider: secret.provider } })
  return row
}

/** Live calendar reads precede booking and movement, including automatic assignment. */
export async function refreshBookingCalendars(c: Context, db: D1Database, type: string, p: any) {
  if (!['visit.book', 'visit.change', 'assessment.book', 'proposal.approve', 'route.accept', 'series.create', 'series.change'].includes(type)) return
  for (const tech of c.s.technicians.filter(t => t.calendarSync)) {
    const secret = await credential(db, tech)
    const visit = p.visitId ? c.s.visits.find(v => v.id === p.visitId) : null
    const date = p.date ?? visit?.local.date ?? c.now.slice(0, 10)
    const from = new Date(Date.parse(date + 'T00:00:00Z') - 86400000).toISOString(), to = new Date(Date.parse(from) + 92 * 86400000).toISOString()
    const busy = await busyRead(secret, from, to, db)
    bump(c.s, 'technicians', tech, { calendarSync: { ...tech.calendarSync, busy, readAt: c.now } })
  }
}

/** Commit the durable work with the visit. Store only references; resolve details immediately before sending. */
export function queueCalendarSync(c: Context, before: State) {
  for (const tech of c.s.technicians.filter(t => t.calendarSync)) {
    const previous = before.technicians.find(t => t.id === tech.id)
    for (const visit of c.s.visits) {
      const old = before.visits.find(v => v.id === visit.id)
      if (visit.technicianId !== tech.id && old?.technicianId !== tech.id) continue
      if (previous?.calendarSync?.connectionId === tech.calendarSync.connectionId && old && ['technicianId', 'startAt', 'endAt', 'status'].every(k => old[k] === visit[k])) continue
      c.sql.push({ sql: 'INSERT OR IGNORE INTO glove_calendar_work(id,command_id,technician_id,connection_id,visit_id,state) VALUES(?,?,?,?,?,\'pending\')', params: [`${c.commandId}:${tech.id}:${visit.id}`, c.commandId, tech.id, tech.calendarSync.connectionId, visit.id] })
    }
  }
}

/** A sending reservation is never automatically replayed after an uncertain provider outcome. */
export async function deliverCalendars(db: D1Database) {
  const work = (await db.prepare("SELECT * FROM glove_calendar_work WHERE state='pending' ORDER BY sequence LIMIT 30").all<Row>()).results
  for (const w of work) {
    const claimed = await db.prepare("UPDATE glove_calendar_work SET state='sending' WHERE id=? AND state='pending' AND NOT EXISTS(SELECT 1 FROM glove_calendar_work x WHERE x.technician_id=glove_calendar_work.technician_id AND x.connection_id=glove_calendar_work.connection_id AND x.sequence<glove_calendar_work.sequence AND x.state IN ('pending','sending','unknown','failed'))").bind(w.id).run()
    if (!claimed.meta.changes) continue
    let outcome = 'unknown', action = 'none'
    try {
      const records = (await db.prepare("SELECT kind,data FROM glove_records WHERE kind IN ('technicians','visits','jobs','customers','sites')").all<Row>()).results
      const rows = (kind: string) => records.filter(r => r.kind === kind).map(r => JSON.parse(r.data))
      const tech = rows('technicians').find(t => t.id === w.technician_id)
      if (tech?.calendarSync?.connectionId !== w.connection_id) { outcome = 'disconnected'; continue }
      const secret = await credential(db, tech), headers = await token(secret, db)
      const visit = rows('visits').find(v => v.id === w.visit_id), job = visit && rows('jobs').find(j => j.id === visit.jobId)
      const mapping = await db.prepare('SELECT event_id FROM glove_calendar_events WHERE connection_id=? AND visit_id=?').bind(w.connection_id, w.visit_id).first<{ event_id: string }>()
      const remove = !visit || visit.status === 'cancelled' || visit.technicianId !== tech.id || !job || job.erasedAt
      if (remove && !mapping) { outcome = 'obsolete'; continue }
      action = remove ? 'delete' : mapping ? 'update' : 'create'
      const customer = job && rows('customers').find(r => r.id === job.customerId), site = job && rows('sites').find(r => r.id === job.siteId)
      const title = tech.calendarSync.details ? `Glove visit: ${customer?.name ?? ''}` : 'Glove visit'
      const body = secret.provider === 'google' ? { summary: title, location: tech.calendarSync.details ? site?.address ?? '' : '', start: { dateTime: visit?.startAt }, end: { dateTime: visit?.endAt }, extendedProperties: { private: { gloveVisit: w.visit_id } }, ...(mapping ? {} : { id: w.visit_id.replaceAll('-', '') }) } : { subject: title, location: { displayName: tech.calendarSync.details ? site?.address ?? '' : '' }, start: { dateTime: visit?.startAt, timeZone: 'UTC' }, end: { dateTime: visit?.endAt, timeZone: 'UTC' }, ...(mapping ? {} : { transactionId: `glove-${w.connection_id}-${w.visit_id}` }) }
      const result = await jsonRequest(endpoint(secret.provider, secret.calendarId) + (mapping ? '/' + enc(mapping.event_id) : '') + (secret.provider === 'google' ? '?sendUpdates=none' : ''), { method: remove ? 'DELETE' : mapping ? 'PATCH' : 'POST', headers, ...(remove ? {} : { body: JSON.stringify(body) }) })
      if (!remove && !mapping && typeof result.id !== 'string') fail('CALENDAR_SYNC', 'Provider did not confirm the event reference.', null, 502)
      if (remove) await db.prepare('DELETE FROM glove_calendar_events WHERE connection_id=? AND visit_id=?').bind(w.connection_id, w.visit_id).run()
      else if (!mapping) await db.prepare('INSERT INTO glove_calendar_events(connection_id,visit_id,event_id) VALUES(?,?,?)').bind(w.connection_id, w.visit_id, result.id).run()
      outcome = 'confirmed'
    } catch { outcome = 'unknown' }
    finally {
      const at = new Date().toISOString()
      await db.batch([
        db.prepare('UPDATE glove_calendar_work SET state=?,action=?,at=? WHERE id=?').bind(outcome, action, at, w.id),
        providerEvent(db, { id: `calendar:${w.id}`, at, commandId: w.command_id, provider: 'Calendar', subjectKind: 'technician', subjectId: w.technician_id, kind: 'calendar.outcome', summary: `Calendar ${action}: ${outcome}${outcome === 'unknown' ? '; check the provider before reconnecting' : ''}`, data: { visitId: w.visit_id, action, outcome } }),
      ])
    }
  }
}
