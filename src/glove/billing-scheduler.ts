import { roleSql } from './access'
import { inBranch } from './branch-access'
import { generateRecurringBilling } from './recurring-billing'
import { extendSeries } from './commands/series'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { load, commit } from './storage'
import type { Actor, Context } from './model'

/** Standing owner rules, with current owner/branch authority at every commit.
 * No browser session or a different person's consent is borrowed by cron. */
export async function runRecurringBilling(db: D1Database, at: string) {
  const initial = await load(db)
  const owners = [...new Set(initial.jobs.flatMap(j => (j.series?.billing?.revisions ?? []).map((r: any) => r.by.id)))] as string[]
  for (const id of owners) {
    const before = await load(db)
    const owner = await db.prepare(`SELECT id,display_name AS name,version,${roleSql('?')} AS role FROM oa_operators WHERE id=? AND status='active'`).bind(id, id, id).first<{ id: string; name: string; version: number; role: string }>()
    if (!owner || owner.role !== 'owner') continue
    const limit = before.branchAccess.find(b => b.id === id)
    const actor: Actor = { id, name: owner.name, role: 'owner', sessionId: '', operatorVersion: owner.version, branchRevision: limit?.version ?? 0, ...(limit && limit.limited !== false ? { branch: { id: limit.branchId ?? null, version: limit.version } } : {}), billingRun: true }
    const c: Context = { s: structuredClone(before), actor, now: at, commandId: `billing-${crypto.randomUUID()}`, events: [], files: [], sql: [] }
    await inBranch(c, async () => { extendSeries(c); await generateRecurringBilling(c) })
    if (!c.events.length) continue
    try { await commit(db, c, before, 'series.billingRun', sha256(canonicalJson({ at, owner: id })), { scheduled: true }) }
    catch (error) {
      // A concurrent pass or person won the snapshot. Nothing was published by
      // this attempt; the next ordinary cron sees the remaining occurrences.
      if ((await load(db)).version === before.version) throw error
    }
  }
}
