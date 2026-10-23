import { branchEvent, inBranch } from './branch-access'
import { Problem, fail, text, oneOf, find, expectVersion, put, bump, event, newId, business, type Actor, type Context, type Row } from './model'
import { cents, dollars } from './money'
import { allow, roleSql } from './access'
import { tokenCreator } from './tokens'
import { addDays } from './recurrence'
import { localParts } from './time'
import type { Handler } from './commands/types'

// Workflow rules (API-005): "when this happens, do that" on Glove's own
// events. A rule has a trigger (a request created, a quote's price approved, a
// job created or completed), optional conditions (the request's source; the
// customer's tag, CUST-004; a total over an amount) and one action: an in-app
// notice to a role or a named desk person, booking the new job's visit with a
// technician some days later, or assigning a completed job's invoice
// preparation to a named owner or office person. After every command, each enabled
// rule whose trigger that command raised runs once, as its creator's current
// role: an action the creator's role cannot take is refused and logged, nothing
// done. Applying a lead cost (BOOK-004) sets a just-created request's cost
// unless it already has one. Every run is logged with the rule version, what triggered it, the
// outcome and why. Actions a rule takes never trigger rules.

export const triggers = ['enquiry.created', 'quote.approved', 'job.created', 'job.completed'] as const
const roles = ['owner', 'dispatcher', 'office'] as const

async function action(c: Context, p: any, trigger: string, db: D1Database) {
  const kind = oneOf(p?.kind, ['notify', 'book', 'assign', 'leadCost'] as const, 'action.kind')
  if (kind === 'leadCost') {
    // BOOK-004: a request just created takes this lead cost unless it already has one.
    if (trigger !== 'enquiry.created') fail('INPUT', 'A rule applies a lead cost only to a request just created.', { field: 'action.kind' }, 400)
    const amount = dollars(cents(p.amount, 'action.amount'))
    if (cents(amount, 'action.amount') <= 0) fail('INPUT', 'action.amount is more than $0.00.', { field: 'action.amount' }, 400)
    return { kind, amount }
  }
  if (kind === 'assign') {
    // The completed job's invoice preparation goes to one person who can prepare invoices (owner or office) now.
    if (trigger !== 'job.completed') fail('INPUT', 'A rule assigns invoice preparation only for a job just completed.', { field: 'action.kind' }, 400)
    const person = typeof p.personId === 'string' ? await db.prepare(`SELECT display_name AS name, ${roleSql('?')} AS role FROM oa_operators WHERE id=?`).bind(p.personId, p.personId, p.personId).first<{ name: string; role: string }>() : null
    if (!person || !['owner', 'office'].includes(person.role)) fail('INPUT', 'Assign invoice preparation to a person who prepares invoices (owner or office).', { field: 'action.personId' }, 400)
    return { kind, personId: p.personId as string, name: person!.name }
  }
  if (kind === 'notify') {
    // A role, or one person who holds a desk role now.
    const person = typeof p.to === 'string' && p.to.startsWith('person:') ? p.to.slice(7) : null
    const to = person ? (roles as readonly string[]).includes((await db.prepare(`SELECT ${roleSql('?')} AS role`).bind(person, person).first<{ role: string }>())?.role ?? '') ? p.to as string : fail('INPUT', 'Notify a person who holds a desk role.', { field: 'action.to' }, 400) : oneOf(p.to, roles, 'action.to')
    return { kind, to, message: text(p.message, 'action.message', { max: 300 }) }
  }
  if (trigger !== 'job.created') fail('INPUT', 'A rule books a visit only for a job just created.', { field: 'action.kind' }, 400)
  const afterDays = Number.isInteger(p.afterDays) && p.afterDays >= 0 && p.afterDays <= 60 ? p.afterDays : fail('INPUT', 'action.afterDays is 0 to 60.', { field: 'action.afterDays' }, 400)
  const time = (v: unknown, name: string) => typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : fail('INPUT', `${name} is HH:MM.`, { field: name }, 400)
  return { kind, technicianId: find(c.s, 'technicians', p.technicianId).id, afterDays, start: time(p.start, 'action.start'), end: time(p.end, 'action.end') }
}

export const rules: Handler = async (c, type, p, db) => {
  if (type !== 'rule.save') return undefined
  const trigger = oneOf(p.trigger, triggers, 'trigger')
  const condition = { source: text(p.condition?.source, 'condition.source', { optional: true, max: 40 }) || null, tag: text(p.condition?.tag, 'condition.tag', { optional: true, max: 40 }) || null, over: p.condition?.over === undefined || p.condition?.over === '' ? null : dollars(cents(p.condition.over, 'condition.over')) }
  const fields = { name: text(p.name, 'name', { max: 120 }), trigger, condition, action: await action(c, p.action, trigger, db), enabled: p.enabled !== false }
  if (p.id === undefined) { const row = put(c.s, 'rules', { id: newId(), version: 1, createdAt: c.now, createdBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, ...fields }); event(c, { jobId: null, subjectKind: 'rule', subjectId: row.id, kind: 'rule.saved', summary: `${c.actor.name} created rule ${row.name}`, data: { enabled: row.enabled } }); return row }
  const rule = find(c.s, 'rules', p.id); expectVersion(rule, p.version)
  if (rule.createdBy.id !== c.actor.id && c.actor.role !== 'owner') fail('FORBIDDEN', 'Only the rule\'s creator or the owner changes it.', null, 403)
  const row = bump(c.s, 'rules', rule, fields)
  event(c, { jobId: null, subjectKind: 'rule', subjectId: row.id, kind: 'rule.saved', summary: `${c.actor.name} saved rule ${row.name}`, data: { enabled: row.enabled } })
  return row
}

type Perform = (c: Context, type: string, payload: Record<string, unknown>) => Promise<unknown>

/** What the triggering record offers a condition: the request's source, a total in cents. */
function facts(c: Context, kind: string, id: string) {
  const tags = (customerId: string) => (c.s.customers.find(x => x.id === customerId)?.tags ?? []).map((t: string) => t.toLowerCase())
  if (kind === 'enquiry.created') { const e = c.s.enquiries.find(x => x.id === id); return e ? { source: e.source as string, total: null, job: null, tags: tags(e.customerId) } : null }
  if (kind === 'quote.approved') { const q = c.s.quotes.find(x => x.id === id), rev = q && [...q.revisions].reverse().find((r: Row) => r.approval); return rev ? { source: c.s.enquiries.find(e => e.id === q!.enquiryId)?.source ?? null, total: cents(rev.totals.total, 'total'), job: null, tags: tags(q!.customerId) } : null }
  const j = c.s.jobs.find(x => x.id === id); return j ? { source: null, total: j.totals ? cents(j.totals.total, 'total') : null, job: j, tags: tags(j.customerId) } : null
}

export async function runRules(c: Context, db: D1Database, perform: Perform) {
  const raised = c.events.filter(e => (triggers as readonly string[]).includes(e.kind))
  if (!raised.length) return
  for (const e of raised) for (const rule of c.s.rules.filter(r => r.enabled && r.trigger === e.kind)) {
    const f = facts(c, e.kind, e.subjectId)
    if (!f) continue
    if (rule.condition.source && f.source !== rule.condition.source) continue
    // CUST-004: a customer tag, compared without regard to case.
    if (rule.condition.tag && !f.tags.includes(rule.condition.tag.toLowerCase())) continue
    if (rule.condition.over && (f.total === null || f.total <= cents(rule.condition.over, 'over'))) continue
    const log = (outcome: string, detail: string) => {
      const run = put(c.s, 'ruleRuns', { id: newId(), version: 1, createdAt: c.now, ruleId: rule.id, ruleVersion: rule.version, rule: rule.name, trigger: { kind: e.kind, subjectId: e.subjectId, jobId: e.jobId }, outcome, detail })
      event({ ...c, actor: as }, { jobId: e.jobId, subjectKind: 'rule', subjectId: rule.id, kind: 'rule.ran', summary: `Rule ${rule.name}: ${outcome}; ${detail}`, data: { runId: run.id, ruleVersion: rule.version, trigger: run.trigger } })
      return run
    }
    // API-002: a rule a token created runs as that token's role and branch while it is unrevoked.
    const byToken = rule.createdBy.id.startsWith('token:') ? await tokenCreator(db, rule.createdBy.id) : null
    // A person's rule runs only while that person is active, as their current role.
    const person = rule.createdBy.id.startsWith('token:') ? null : await db.prepare(`SELECT o.status,o.version,${roleSql('o.id')} AS role FROM oa_operators o WHERE o.id=?`).bind(rule.createdBy.id).first<{ status: string; version: number; role: string }>()
    const row = rule.createdBy.id.startsWith('token:') ? byToken : person
    const limit = c.s.branchAccess.find(r => r.id === rule.createdBy.id && r.limited !== false)
    const branch = byToken ? (byToken.branchId === null ? undefined : { id: byToken.branchId === 'main' ? null : byToken.branchId, version: 0 }) : limit ? { id: limit.branchId, version: limit.version } : undefined
    if (branch && (!branchEvent(c.s, { branch } as Actor, e) || !branchEvent(c.s, { branch } as Actor, { jobId: null, subjectId: rule.id, subjectKind: 'rule' }))) continue
    const as: Actor = { ...c.actor, id: rule.createdBy.id, name: `${rule.createdBy.name} (rule "${rule.name}")`, role: (row?.role ?? 'viewer') as Actor['role'], custom: undefined, branch, token: byToken ? rule.createdBy.id.slice('token:'.length) : undefined }
    if (rule.createdBy.id.startsWith('token:') && !byToken) { log('not allowed', `${rule.createdBy.name} was revoked`); continue }
    if (!rule.createdBy.id.startsWith('token:') && person?.status !== 'active') { log('not allowed', `${rule.createdBy.name} is no longer active`); continue }
    // The batch that commits what the rule does checks again that its creator is still active with the same role and branch.
    if (person) c.sql.push({ sql: `INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN EXISTS(SELECT 1 FROM oa_operators WHERE id=? AND version=? AND status='active') AND ${roleSql('?')}=? AND COALESCE((SELECT version FROM glove_records WHERE kind='branchAccess' AND id=?),0)=? THEN 1 ELSE 0 END)`, params: [newId(), rule.createdBy.id, person.version, rule.createdBy.id, rule.createdBy.id, person.role, rule.createdBy.id, c.s.branchAccess.find(r => r.id === rule.createdBy.id)?.version ?? 0] })
    if (rule.action.kind === 'notify') {
      if (!(roles as readonly string[]).includes(as.role)) { log('not allowed', `${rule.createdBy.name} no longer holds a desk role`); continue }
      put(c.s, 'notices', { id: newId(), version: 1, createdAt: c.now, to: [rule.action.to], ruleId: rule.id, jobId: e.jobId, message: `${rule.name}: ${f.job ? `${f.job.number} ` : ''}${rule.action.message}` })
      log('done', `notice to ${rule.action.to}`)
      continue
    }
    if (rule.action.kind === 'leadCost') {
      try { allow(as, 'enquiry.cost') } catch (error) { if (!(error instanceof Problem)) throw error; log('not allowed', error.message); continue }
      const request = c.s.enquiries.find(x => x.id === e.subjectId)!
      if (request.leadCost) { log('refused', `the request already has a lead cost of $${request.leadCost.amount} (${request.leadCost.by === 'provider' ? 'from the provider' : `set by ${request.leadCost.by}`})`); continue }
      bump(c.s, 'enquiries', request, { leadCost: { amount: rule.action.amount, by: 'rule', ruleId: rule.id, rule: rule.name, at: c.now } })
      log('done', `lead cost $${rule.action.amount} applied`)
      continue
    }
    if (rule.action.kind === 'assign') {
      const target = await db.prepare(`SELECT ${roleSql('?')} AS role`).bind(rule.action.personId, rule.action.personId).first<{ role: string }>()
      try { allow(as, 'invoice.prepare') } catch (error) { if (!(error instanceof Problem)) throw error; log('not allowed', error.message); continue }
      if (!['owner', 'office'].includes(target?.role ?? '')) { log('refused', `${rule.action.name} no longer prepares invoices`); continue }
      const job = c.s.jobs.find(j => j.id === f.job!.id)!
      const targetLimit = c.s.branchAccess.find(r => r.id === rule.action.personId && r.limited !== false)
      if (targetLimit && !branchEvent(c.s, { branch: { id: targetLimit.branchId, version: targetLimit.version } } as Actor, e)) { log('refused', 'The assignee cannot read this branch'); continue }
      bump(c.s, 'jobs', job, { invoiceAssignee: { id: rule.action.personId, name: rule.action.name, ruleId: rule.id, at: c.now } })
      put(c.s, 'notices', { id: newId(), version: 1, createdAt: c.now, to: [`person:${rule.action.personId}`], ruleId: rule.id, jobId: job.id, message: `${rule.name}: prepare the invoice for ${job.number}` })
      event({ ...c, actor: as }, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'job.invoiceAssigned', summary: `Invoice preparation for ${job.number} assigned to ${rule.action.name} by the rule "${rule.name}"`, data: null })
      log('done', `invoice preparation assigned to ${rule.action.name}`)
      continue
    }
    const date = addDays(localParts(c.now, business(c.s).timezone).date, rule.action.afterDays), payload = { jobId: f.job!.id, technicianId: rule.action.technicianId, date, start: rule.action.start, end: rule.action.end, reason: `Booked by the rule "${rule.name}"` }
    try {
      // API-005's standing ban on automatic Office bookings is unchanged by
      // PLAN-004's human Office booking permission.
      if (as.role === 'office') fail('FORBIDDEN', 'An Office workflow rule cannot visit.book; a person books included visits.', null, 403)
      allow(as, 'visit.book')
      const scoped = { ...c, actor: as }
      const visit = await inBranch(scoped, () => perform(scoped, 'visit.book', payload)) as Row
      c.s = scoped.s
      log('done', `booked ${date} ${visit.local.start}–${visit.local.end}`)
    } catch (error) {
      if (!(error instanceof Problem)) throw error
      log(error.code === 'FORBIDDEN' ? 'not allowed' : 'refused', error.message)
    }
  }
}
