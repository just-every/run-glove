import { authConfig, type Bindings } from '../../auth.server'
import { ToolRefusal, type ResourceContext, type ToolContext } from '../../modules/agent-door/index.ts'
import { isActiveOperator } from '../../modules/operator-auth/index.mjs'
import { allow, authority, mayRead, roleSql, withRole } from '../access'
import { load, commit, saved } from '../storage'
import { branchState } from '../branch-access'
import { visible } from '../view'
import { setup } from '../commands/setup'
import { pricebook } from '../commands/pricebook'
import { canonicalJson, sha256 } from '../../modules/import-kit/src/d1/index'
import { Problem, type Actor, type Context } from '../model'

export type DoorAdmission = { agentId: string; agentName: string; sponsorName: string; consent?: string; envelope: string | null; localDocument: string | null; localRevision: number; approvers: readonly { id: string; name: string }[] }

export async function nativeActor(env: Bindings, ctx: Pick<ToolContext, 'person' | 'agent'> & Partial<Pick<ToolContext, 'consent' | 'approvers'>>): Promise<Actor> {
  const row = await env.DB.prepare(`SELECT id,email,display_name AS displayName,role,status,version FROM oa_operators WHERE id=?`).bind(ctx.person.id).first<{ id: string; email: string; displayName: string; role: string; status: string; version: number }>()
  if (!isActiveOperator(row as Parameters<typeof isActiveOperator>[0], authConfig(env).allowList)) throw new ToolRefusal('unauthenticated')
  const current = row!
  const role = await env.DB.prepare(`SELECT ${roleSql('?')} AS role`).bind(current.id, current.id).first<{ role: string }>()
  const limit = await env.DB.prepare("SELECT version,data FROM glove_records WHERE kind='branchAccess' AND id=?").bind(current.id).first<{ version: number; data: string }>()
  const access = limit && JSON.parse(limit.data)
  const state = await env.DB.prepare('SELECT envelope,local_document,local_revision,local_paused FROM agent_door_state WHERE id=1').first<{ envelope: string | null; local_document: string | null; local_revision: number; local_paused: number }>()
  const policy = state?.envelope && JSON.parse(state.envelope)
  if (state?.local_paused || policy?.paused || (await load(env.DB)).business[0]?.agentsPaused) throw new ToolRefusal('agents_paused')
  if (policy && policy.exp * 1000 <= Date.now()) throw new ToolRefusal('policy_unavailable')
  if (policy?.revoked?.agents?.includes(ctx.agent.id)) throw new ToolRefusal('unauthenticated')
  if (ctx.consent && policy?.revoked?.consents?.includes(ctx.consent)) throw new ToolRefusal('consent_revoked')
  return withRole(env.DB, { id: current.id, name: `${ctx.agent.name} for ${current.displayName}`, sessionId: '', operatorVersion: current.version,
    branchRevision: limit?.version ?? 0, branch: access && access.limited !== false ? { id: access.branchId, version: limit!.version } : undefined,
    agentDoor: { agentId: ctx.agent.id, agentName: ctx.agent.name, sponsorName: current.displayName, consent: ctx.consent,
      envelope: state?.envelope ?? null, localDocument: state?.local_document ?? null, localRevision: state?.local_revision ?? 0, approvers: ctx.approvers ?? [] },
  }, role?.role)
}

export async function catalogue(env: Bindings, ctx: ToolContext | ResourceContext) {
  const actor = await nativeActor(env, ctx)
  if (!mayRead(actor, 'state')) throw new ToolRefusal('resource_unavailable')
  const state = await load(env.DB), view = visible(branchState(state, actor), actor)
  return { version: state.version, services: view.services }
}

/** The same native handlers, role checker and atomic commit used by the desk.
 * No provider flush, scheduler or customer-bearing workflow is admitted here. */
export async function savePricebook(env: Bindings, type: string, args: Record<string, unknown>, ctx: ToolContext) {
  const actor = await nativeActor(env, ctx)
  try {
    allow(actor, type)
    const a = authority(actor)
    if (!(await env.DB.prepare(`SELECT (${a.sql}) AS ok`).bind(...a.params).first<{ ok: number }>())?.ok) throw new ToolRefusal('unauthenticated')
    const commandId = `door-${sha256(canonicalJson({ agent: ctx.agent.id, key: ctx.idempotencyKey }))}`
    const digest = sha256(canonicalJson({ type, payload: args }))
    const previous = await saved(env.DB, commandId, digest, actor)
    if (previous) return previous.result
    const before = await load(env.DB)
    const c: Context = { s: structuredClone(before), actor, commandId, now: new Date().toISOString(), events: [], files: [], sql: [], origin: env.AUTH_ORIGIN, local: env.AUTH_LOCAL === 'true' }
    const native = type === 'service.save' ? { ...args, version: before.services.find(row => row.id === args.id)?.version } : args
    const result = type === 'service.save' ? await setup(c, type, native, env.DB) : await pricebook(c, type, args, env.DB)
    if (result === undefined) throw new ToolRefusal('tool_not_found')
    try { await commit(env.DB, c, before, type, digest, result) }
    catch {
      const replay = await saved(env.DB, commandId, digest, actor)
      if (replay) return replay.result
      throw new ToolRefusal('revision_conflict')
    }
    const row = result as { id?: string }
    ctx.emit('pricebook.changed', row.id ? `glove://services/${row.id}` : 'glove://pricebook/catalogue')
    return result
  } catch (cause) {
    if (cause instanceof Problem) throw new ToolRefusal(cause.code.toLowerCase())
    throw cause
  }
}
