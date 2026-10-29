import { authConfig, operatorAuth, type Bindings } from '../../auth.server'
import { isActiveOperator } from '../../modules/operator-auth/index.mjs'
import type { PeopleAdapter, Person } from '../../modules/agent-door/index.ts'
import type { TeamAdapter } from '../../modules/business-settings/index.ts'
import { roleSql } from '../access'

interface Operator { id: string; email: string; displayName: string; role: string; status: string }

/** Business subjects never select a native person by a token's email. */
export function glovePeople(env: Bindings): PeopleAdapter {
  const db = env.DB
  const owner = () => db.prepare("SELECT o.id FROM oa_bootstrap b JOIN oa_operators o ON o.id=b.claim_id WHERE b.singleton=1 AND o.role='owner'").first<{ id: string }>()
  const person = async (id: string): Promise<Person | null> => {
    const row = await db.prepare(`SELECT id,email,display_name AS displayName,${roleSql('oa_operators.id')} AS role,status FROM oa_operators WHERE id=?`).bind(id).first<Operator>()
    return row ? { id: row.id, email: row.email, name: row.displayName, role: row.role, active: isActiveOperator(row as Parameters<typeof isActiveOperator>[0], authConfig(env).allowList) } : null
  }
  return {
    person,
    // A locally promoted native admin is never a Business editor.
    businessRole: p => p.role === 'owner' ? 'owner' : null,
    async sponsor({ sub }) {
      const settings = await db.prepare('SELECT owner_id FROM bs_settings WHERE singleton=1 AND stopped=0').first<{ owner_id: string | null }>()
      if (!settings) return null
      if (settings.owner_id === sub) { const native = await owner(); return native ? person(native.id) : null }
      const member = await db.prepare("SELECT operator_id FROM bs_team WHERE business_id=? AND state='active'").bind(sub).first<{ operator_id: string | null }>()
      return member?.operator_id ? person(member.operator_id) : null
    },
    async businessMember(p) {
      const settings = await db.prepare('SELECT owner_id FROM bs_settings WHERE singleton=1 AND stopped=0').first<{ owner_id: string | null }>()
      if (!settings || !(await person(p.id))?.active) return null
      if (settings.owner_id && (await owner())?.id === p.id) return { id: settings.owner_id, role: 'owner' }
      const member = await db.prepare("SELECT business_id,business_role FROM bs_team WHERE operator_id=? AND state='active' AND business_id IS NOT NULL").bind(p.id).first<{ business_id: string; business_role: string }>()
      return member ? { id: member.business_id, role: member.business_role === 'admin' ? 'editor' : null } : null
    },
    async session(request) {
      const session = await operatorAuth(env).getSession(request)
      const current = session && await person(session.operator.id)
      return current?.active ? current : null
    },
  }
}

/** Bind only real native accounts. Business membership never creates a shadow
 * account, accepts an invitation, or changes a Glove role or branch grant. */
export function gloveTeam(env: Bindings): TeamAdapter {
  return {
    async ownerEmail() {
      return (await env.DB.prepare('SELECT o.email FROM oa_bootstrap b JOIN oa_operators o ON o.id=b.claim_id WHERE b.singleton=1').first<{ email: string }>())?.email ?? null
    },
    async prepare({ members, managed }) {
      const rows = []
      for (const member of members) {
        const prior = managed.find(row => member.id && row.businessId === member.id)
        const row = prior?.operatorId
          ? await env.DB.prepare('SELECT id,email,status FROM oa_operators WHERE id=?').bind(prior.operatorId).first<{ id: string; email: string; status: string }>()
          : await env.DB.prepare('SELECT id,email,status FROM oa_operators WHERE email=?').bind(member.email).first<{ id: string; email: string; status: string }>()
        rows.push({ email: member.email, operatorId: row?.id ?? null, invite: member.invite,
          state: !row || prior && !prior.operatorId ? 'conflict' as const : row.status === 'active' ? 'active' as const : row.status === 'invited' ? 'invited' as const : 'inactive' as const })
      }
      // Omission revokes a binding, but retains the durable native id for a
      // future signed roster; reusing an address cannot move that binding.
      for (const row of managed) if (!members.some(member => member.email === row.email)) rows.push({ ...row, state: 'inactive' as const })
      return { statements: [], rows, async afterCommit() {} }
    },
  }
}
