import { sha256 } from '../modules/import-kit/src/d1/index'
import { fail, text, event, newId, type Actor, type Context } from './model'
import type { Handler } from './commands/types'

// API-002: integration tokens (ct approved 19 October 2026, 19:01Z). The owner
// issues a named token acting as one role (any built-in desk role or a custom
// role, never Owner, Technician or Subcontractor), optionally limited to one
// branch. The token is shown once in the issuing response; only its SHA-256 is
// kept, and the saved command outcome never holds it. A request carrying
// `Authorization: Bearer <token>` acts as that role through every door, and
// commits re-check in their batch that the token is unrevoked, still holds
// that role, and that a custom role's permissions are unchanged. Revoking
// applies to the next request. Tokens never manage tokens, roles, grants,
// branch limits or provider keys. What a token changes is in Activity under
// "<name> (integration token)"; each request records the token's last use.

const tokenRoles = ['dispatcher', 'office', 'agent', 'viewer'] as const

/** Commands no integration token sends, whatever its role. */
export const tokenNever = new Set(['payment.connect', 'payment.checkout', 'intake.configure', 'intake.withdrawPhotos', 'quote.consent', 'lead.connect', 'maps.connect', 'document.template', 'document.photo', 'privacy.export', 'privacy.erase', 'mail.callback', 'mail.connect', 'mail.morning', 'token.issue', 'token.revoke', 'role.set', 'role.save', 'grant.create', 'grant.revoke', 'agents.pause', 'branch.limit', 'tax.connect', 'companycam.connect', 'marketing.connect', 'model.connect', 'push.setup', 'technician.calendar'])

const digest = (secret: string) => sha256(`glove-token:${secret}`)

function secret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return 'glv_' + btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** The token row behind a Bearer header, or a refusal; null when the request carries none. */
export async function bearer(request: Request, db: D1Database) {
  const header = request.headers.get('authorization')
  if (!header) return null
  const m = /^Bearer (glv_[A-Za-z0-9_-]{43})$/.exec(header)
  const row = m && await db.prepare('SELECT id,name,role,branch_id AS branchId FROM glove_tokens WHERE hash=? AND revoked_at IS NULL').bind(digest(m[1])).first<{ id: string; name: string; role: string; branchId: string | null }>()
  if (!row) fail('AUTH', 'This integration token is not valid or was revoked.', null, 401)
  await db.prepare('UPDATE glove_tokens SET last_used_at=? WHERE id=?').bind(new Date().toISOString(), row!.id).run()
  return row!
}

/** Scalar SQL for the commit guard and reads: the token is unrevoked and still holds this role. */
export const tokenAuthority = (actor: Actor) => ({
  sql: `EXISTS(SELECT 1 FROM glove_tokens WHERE id=? AND revoked_at IS NULL AND role=?) AND COALESCE((SELECT version FROM glove_records WHERE kind='roles' AND id=?),0)=?`,
  params: [actor.token, actor.role, actor.custom?.id ?? '', actor.custom?.version ?? 0] as unknown[],
})

/** The owner's list: names, roles, branch, issue, last use and revocation; never the hash. */
export const tokenList = async (db: D1Database) => (await db.prepare('SELECT id,name,role,branch_id AS branchId,created_at AS createdAt,last_used_at AS lastUsedAt,revoked_at AS revokedAt FROM glove_tokens ORDER BY created_at,id').all()).results

/** The role and branch a token-created workflow rule runs as, or null once the token is revoked. */
export const tokenCreator = (db: D1Database, actorId: string) => db.prepare('SELECT role,branch_id AS branchId FROM glove_tokens WHERE id=? AND revoked_at IS NULL').bind(actorId.slice('token:'.length)).first<{ role: string; branchId: string | null }>()

const roleOf = (c: Context, v: unknown) => {
  if ((tokenRoles as readonly unknown[]).includes(v)) return v as string
  const custom = typeof v === 'string' && v.startsWith('custom:') ? c.s.roles.find(r => r.id === v.slice(7)) : null
  if (custom) return v as string
  return fail('INPUT', 'role is Dispatcher, Office, Agent, Viewer or one of your custom roles; tokens never act as Owner, Technician or Subcontractor.', { field: 'role' }, 400)
}

export const tokens: Handler = async (c, type, p, db) => {
  switch (type) {
    case 'token.issue': {
      const name = text(p.name, 'name', { max: 80 }), role = roleOf(c, p.role)
      const branchId = p.branchId === undefined || p.branchId === null ? null : p.branchId === 'main' ? 'main' : c.s.branches.some(b => b.id === p.branchId) ? String(p.branchId) : fail('INPUT', 'branchId is one of your branches, "main", or left out for every branch.', { field: 'branchId' }, 400)
      const id = newId(), value = secret()
      c.sql.push({ sql: 'INSERT INTO glove_tokens(id,name,role,branch_id,hash,created_by,created_at) VALUES(?,?,?,?,?,?,?)', params: [id, name, role, branchId, digest(value), c.actor.id, c.now] })
      const label = role.startsWith('custom:') ? c.s.roles.find(r => r.id === role.slice(7))!.name : role
      const where = branchId === null ? '' : branchId === 'main' ? ' for the main business' : ` for ${c.s.branches.find(b => b.id === branchId)!.name}`
      event(c, { jobId: null, subjectKind: 'token', subjectId: id, kind: 'token.issued', summary: `${c.actor.name} issued integration token "${name}" acting as ${label}${where}`, data: { role, branchId } })
      c.reveal = { token: value }
      return { id, name, role, branchId, createdAt: c.now }
    }
    case 'token.revoke': {
      const row = await db.prepare('SELECT id,name FROM glove_tokens WHERE id=? AND revoked_at IS NULL').bind(text(p.tokenId, 'tokenId', { max: 100 })).first<{ id: string; name: string }>() ?? fail('NOT_FOUND', 'No such active token.', null, 404)
      c.sql.push({ sql: 'UPDATE glove_tokens SET revoked_at=?,revoked_by=? WHERE id=? AND revoked_at IS NULL', params: [c.now, c.actor.id, row.id] })
      event(c, { jobId: null, subjectKind: 'token', subjectId: row.id, kind: 'token.revoked', summary: `${c.actor.name} revoked integration token "${row.name}"; it stops working on its next request`, data: null })
      return { id: row.id, revokedAt: c.now }
    }
  }
  return undefined
}
