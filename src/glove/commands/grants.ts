import { fail, text, oneOf, find, expectVersion, put, bump, event, newId, business, type Context, type Row } from '../model'
import { cents, dollars } from '../money'
import { localParts } from '../time'
import { roleSql } from '../access'
import type { Handler } from './types'

// AGENT-009: the owner's control over agents. The owner grants a named action
// to a named agent (book visits for listed services under a price limit, or
// move a visit within its day) with a daily budget and quiet hours, revokes
// it, and pauses every agent with one switch. An agent acting under a grant
// passes every check here first; the visit records the grant it used.

export const agentActions = ['visit.book', 'visit.change'] as const
const clock = (v: unknown, name: string) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : fail('INPUT', `${name} is a time (HH:MM).`, { field: name }, 400)

export const grantLabel = (s: Context['s'], g: Row) => `${g.action === 'visit.book' ? 'book' : 'move within its day'} ${g.serviceIds.length ? g.serviceIds.map((id: string) => s.services.find(x => x.id === id)?.name ?? 'a service').join(', ') : 'any service'}${g.maxSubtotal ? ` under $${g.maxSubtotal}` : ''}`

/** The active grant that lets this agent send this command now, or a refusal saying which limit stops it. */
export function useGrant(c: Context, type: string, p: any): Row {
  const grant = c.s.grants.find(g => g.agentId === c.actor.id && g.action === type && g.status === 'active') ?? fail('FORBIDDEN', `Your role (agent) cannot ${type} without an active grant from the owner.`, { type, role: c.actor.role }, 403)
  const zone = business(c.s).timezone, now = localParts(c.now, zone)
  const q = grant.quietHours
  if (q && (q.start <= q.end ? q.start <= now.time && now.time < q.end : now.time >= q.start || now.time < q.end)) fail('QUIET_HOURS', `Agents act under this grant outside quiet hours (${q.start}–${q.end}).`, { grantId: grant.id })
  if (grant.uses.filter((u: Row) => localParts(u.at, zone).date === now.date).length >= grant.dailyLimit) fail('BUDGET', `This grant's daily budget of ${grant.dailyLimit} is used up today.`, { grantId: grant.id })
  const visit = type === 'visit.change' ? find(c.s, 'visits', p.visitId) : null
  const job = find(c.s, 'jobs', visit ? visit.jobId : p.jobId)
  if (grant.serviceIds.length && !job.lines.every((l: Row) => grant.serviceIds.includes(l.serviceId))) fail('GRANT_SCOPE', `${job.number} has work outside this grant's services.`, { grantId: grant.id })
  if (grant.maxSubtotal && cents(job.totals.subtotal, 'subtotal') > cents(grant.maxSubtotal, 'maxSubtotal')) fail('GRANT_SCOPE', `${job.number} is $${job.totals.subtotal} before tax, over this grant's $${grant.maxSubtotal} limit.`, { grantId: grant.id })
  if (visit && ((p.technicianId ?? visit.technicianId) !== visit.technicianId || (p.date ?? visit.local.date) !== visit.local.date)) fail('GRANT_SCOPE', 'Under this grant an agent moves a visit only within its day, for the same technician.', { grantId: grant.id })
  return grant
}

/** An agent under a grant takes only open slots: any conflict waits for a person. */
export function openSlotOnly(c: Context, found: unknown[]) {
  if (c.grant && found.length) fail('GRANT_SCOPE', 'An agent books only open slots; a person reviews these conflicts.', { conflicts: found })
}

/** Record the grant's use on the register once the command's change is made. */
export function recordUse(c: Context, subjectId: string) {
  const grant = find(c.s, 'grants', c.grant!.id)
  bump(c.s, 'grants', grant, { uses: [...grant.uses, { at: c.now, commandId: c.commandId, subjectId }] })
}

export const grants: Handler = async (c, type, p, db) => {
  switch (type) {
    case 'grant.create': {
      const agent = await db.prepare(`SELECT id,display_name AS name,${roleSql('o.id')} AS role FROM oa_operators o WHERE id=?`).bind(text(p.agentId, 'agentId', { max: 100 })).first<{ id: string; name: string; role: string }>()
      if (!agent || agent.role !== 'agent') fail('AGENT', 'Grant actions to a person who holds the Agent role.', null, 404)
      const action = oneOf(p.action, agentActions, 'action')
      if (c.s.grants.some(g => g.agentId === agent!.id && g.action === action && g.status === 'active')) fail('DUPLICATE', `${agent!.name} already holds an active grant for ${action}; revoke it first.`)
      const serviceIds = p.serviceIds === undefined ? [] : Array.isArray(p.serviceIds) ? [...new Set(p.serviceIds.map((id: unknown) => find(c.s, 'services', id).id))] : fail('INPUT', 'serviceIds is a list of price-book services.', null, 400)
      const dailyLimit = p.dailyLimit === undefined ? 20 : Number.isInteger(p.dailyLimit) && p.dailyLimit >= 1 && p.dailyLimit <= 500 ? p.dailyLimit : fail('INPUT', 'dailyLimit is a whole number from 1 to 500.', { field: 'dailyLimit' }, 400)
      const quietHours = p.quietHours ? { start: clock(p.quietHours.start, 'quietHours.start'), end: clock(p.quietHours.end, 'quietHours.end') } : null
      const row = put(c.s, 'grants', { id: newId(), version: 1, createdAt: c.now, agentId: agent!.id, agentName: agent!.name, action, serviceIds, maxSubtotal: p.maxSubtotal ? dollars(cents(p.maxSubtotal, 'maxSubtotal')) : '', dailyLimit, quietHours, status: 'active', grantedBy: { id: c.actor.id, name: c.actor.name }, uses: [] })
      event(c, { jobId: null, subjectKind: 'grant', subjectId: row.id, kind: 'grant.created', summary: `${c.actor.name} granted ${agent!.name}: ${grantLabel(c.s, row)}, up to ${dailyLimit} a day${quietHours ? `, quiet ${quietHours.start}–${quietHours.end}` : ''}`, data: null })
      return row
    }
    case 'grant.revoke': {
      const grant = find(c.s, 'grants', p.grantId)
      expectVersion(grant, p.version)
      if (grant.status !== 'active') fail('GRANT_STATE', 'This grant is already revoked.')
      const row = bump(c.s, 'grants', grant, { status: 'revoked', revokedAt: c.now, revokedBy: { id: c.actor.id, name: c.actor.name } })
      event(c, { jobId: null, subjectKind: 'grant', subjectId: row.id, kind: 'grant.revoked', summary: `${c.actor.name} revoked ${row.agentName}'s grant to ${grantLabel(c.s, row)}`, data: null })
      return row
    }
    case 'agents.pause': {
      const paused = p.paused === true, b = business(c.s)
      const row = bump(c.s, 'business', b, { agentsPaused: paused })
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: paused ? 'agents.paused' : 'agents.resumed', summary: paused ? `${c.actor.name} paused every agent` : `${c.actor.name} let agents act again`, data: null })
      return { agentsPaused: row.agentsPaused }
    }
  }
}
