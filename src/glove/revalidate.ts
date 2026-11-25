import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import type { Actor } from './model'

// The desk and the field poll /state, /map and /delays every 30 to 60 seconds.
// Each answer is a pure function of the records, the timeline, a few small
// tables bounded by headcount, the person asking and (for the few parts that
// read the clock) the time. This stamp names exactly those inputs from a handful
// of rows, so a poll that finds nothing changed is answered 304 before any
// record is read: its cost is flat however much history the business holds.

/** How long the answer may lag the clock, in milliseconds: state 15 minutes (the cron's own cadence), map and delays 5 minutes, or 30 seconds while a technician shares a live position. */
export const windows = { state: 15 * 60_000, board: 5 * 60_000, live: 30_000 }

export async function stamp(db: D1Database, actor: Actor, scope: string, window: keyof typeof windows): Promise<string> {
  const [meta, events, people, tokens, live] = await db.batch<any>([
    db.prepare('SELECT version FROM glove_meta WHERE id=1'),
    db.prepare('SELECT COALESCE(MAX(sequence),0) AS sequence FROM glove_events'),
    db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(version),0) AS versions, COALESCE(MAX(created_at),0) AS newest FROM oa_operators'),
    db.prepare("SELECT COUNT(*) AS n, COALESCE(MAX(created_at),'') AS newest, COALESCE(MAX(revoked_at),'') AS revoked FROM glove_tokens"),
    db.prepare("SELECT COUNT(*) AS n, COALESCE(MAX(observed_at),'') AS newest FROM glove_live_locations"),
  ])
  const sharing = live.results[0].n > 0
  const span = window === 'board' && sharing ? windows.live : windows[window]
  const who = [actor.id, actor.role, actor.name, actor.branch ?? null, actor.custom ?? null, actor.token ?? null, actor.sessionId]
  return `W/"${sha256(canonicalJson([scope, meta.results[0].version, events.results[0], people.results[0], tokens.results[0], live.results[0], who, Math.floor(Date.now() / span)])).slice(0, 32)}"`
}

/** True when the browser already holds this exact answer. */
export const unchanged = (ifNoneMatch: string | null, tag: string) => !!ifNoneMatch && ifNoneMatch.split(',').some(t => t.trim() === tag)
