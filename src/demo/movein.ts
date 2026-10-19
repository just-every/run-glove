import { applyMoveIn, committedSummary, previewMoveIn, type Guard } from '../glove/movein/kit'
import { readBundle, siteId } from '../glove/movein/servicem8'
import type { Row } from '../glove/model'
import { DEMO_CLIENTS, DEMO_STAFF, demoServiceM8Export } from './servicem8'

type Person = { id: string; name: string; role: string }

/**
 * Pacheco Plumbing & HVAC's real ServiceM8 move-in, a month before the demo starts:
 * Glove's own import kit previews, journals and applies it as the owner, so
 * Move in shows a committed batch and its records keep their ServiceM8 IDs.
 */
export async function demoMoveIn(db: D1Database, owner: Person, now: Date, zone: string, at: (offset: number, time?: string) => string) {
 // The kit's write guard: the demo's owner is still the active owner.
 const guard: Guard = { sql: "EXISTS(SELECT 1 FROM oa_operators WHERE id=? AND role='owner' AND status='active')", params: [owner.id] }
 const files = demoServiceM8Export(now, zone), by = { id: owner.id, name: owner.name }
 const staged: Row = { id: 'demo-movein', version: 1, createdAt: at(-31, '16:45'), stagedAt: at(-31, '16:45'), system: 'ServiceM8', label: 'ServiceM8 export, before switching', timezone: zone, files, status: 'previewed', stagedBy: by }
 const preview = await previewMoveIn(db, staged, guard)
 const jobId = await applyMoveIn(db, staged, guard, preview.fingerprint)
 const batch: Row = { ...staged, version: 2, preview, fileSummary: readBundle(files).artifacts.map(a => ({ name: a.name, sha256: a.sha256, size: a.size })), status: 'committed', jobId, committedAt: at(-31, '16:52'), committedBy: by }
 const events = [
  { id: 'demo-movein-previewed', at: staged.stagedAt as string, kind: 'import.previewed', summary: `ServiceM8 move-in previewed: ${preview.counts.input} source records (0 already moved in), ${preview.counts.effects} Glove records, ${preview.rejections.length} rejected, 0 attachments missing` },
  { id: 'demo-movein-committed', at: batch.committedAt as string, kind: 'import.committed', summary: committedSummary(batch) },
 ].map(e => ({ ...e, jobId: null, subjectKind: 'import', subjectId: batch.id, by: owner }))
 return {
  batch, events,
  technicians: DEMO_STAFF.map(uuid => `sm8-${uuid}`),
  customers: DEMO_CLIENTS.map(uuid => ({ customerId: `sm8-${uuid}` })),
  /** The site each moved-in client's jobs were at. */
  site: (client: number, address: string) => siteId(DEMO_CLIENTS[client], address),
 }
}
