import { roleSql } from './access'
import { business, fail, type Context } from './model'

export const statusKinds = ['onMyWay', 'arrival', 'reportReady'] as const
export type StatusKind = typeof statusKinds[number]
export const isStatusKind = (kind: string): kind is StatusKind => (statusKinds as readonly string[]).includes(kind)

/** A field tap delegates only a named, owner-approved notice, never arbitrary texting. */
export function statusPolicy(c: Context, kind: StatusKind) {
  const policy = business(c.s).visitNotices
  if (c.actor.role !== 'technician' || !c.actor.sessionId || c.actor.token || c.actor.custom) fail('FORBIDDEN', 'Only the currently assigned technician triggers a visit status text.', null, 403)
  if (!policy?.[kind] || !policy.templates?.[kind] || !policy.approvedAt || !policy.by?.id) fail('VISIT_NOTICE', 'The owner has not approved this visit status text.')
  return policy
}

/** Rechecked at preparation, atomic commit and immediately before the provider attempt. */
export function statusOwnerAuthority(policy: any) {
  return {
    sql: `EXISTS(SELECT 1 FROM oa_operators WHERE id=? AND version=? AND status='active') AND ${roleSql('?')}='owner' AND COALESCE((SELECT version FROM glove_records WHERE kind='branchAccess' AND id=?),0)=?`,
    params: [policy.by.id, policy.operatorVersion, policy.by.id, policy.by.id, policy.by.id, policy.branchRevision ?? 0] as unknown[],
  }
}

export async function currentStatusOwner(db: D1Database, policy: any) {
  const a = statusOwnerAuthority(policy)
  return !!(await db.prepare(`SELECT 1 AS ok WHERE ${a.sql}`).bind(...a.params).first())
}

export function guardStatusOwner(c: Context, policy: any) {
  const a = statusOwnerAuthority(policy)
  c.sql.push({ sql: `INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN (${a.sql}) THEN 1 ELSE 0 END)`, params: [crypto.randomUUID(), ...a.params] })
}
