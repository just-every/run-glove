import { Buffer } from 'node:buffer'
import { loadPlans } from '../modules/import-kit/src/d1/plans'
import { importTargets } from './movein/kit'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { formatCsv, parseCsv } from './csv-format'
import type { privacyScope } from './privacy'

/** Read all retained plan encodings with the pinned kit's hash checks. Export
 * only this person's source records; shared files are projected by format. */
export async function customerImportData(db: D1Database, scope: ReturnType<typeof privacyScope>) {
  const rows = (await db.prepare('SELECT * FROM ik_jobs WHERE destination=?').bind('glove').all<any>()).results
  const plans = await loadPlans(rows, db)
  const affected = rows.filter(row => scope.matches(plans.get(row.id)))
  const custody: any[] = [], originals: any[] = [], omissions: any[] = []
  for (const row of affected) {
    const plan = plans.get(row.id)!
    const mine = plan.entries.filter(e => !e.erased && (e.effects.some(effect => scope.ids.has(effect.targetId)) || scope.matches(e.source.payload)))
    const safe = mine.filter(e => e.effects.every(effect => scope.ids.has(effect.targetId)))
    for (const e of mine) if (!safe.includes(e)) omissions.push({ jobId: row.id, sourceIdentity: e.identity, reason: 'Shared source record requires owner review; peer data withheld.' })
    custody.push({ jobId: row.id, records: safe.map(e => ({ source: e.source, unmapped: e.unmapped, rejection: e.rejection })) })
    for (const e of safe) for (const effect of e.effects) if (effect.attachment) originals.push({ jobId: row.id, kind: 'attachment', targetId: effect.targetId, mediaType: effect.attachment.mediaType, sha256: effect.attachment.sha256, bytes: effect.attachment.base64, projection: false })
    for (const artifact of plan.source.artifacts) {
      const chosen = safe.filter(e => e.source.artifactHash === artifact.sha256)
      if (!chosen.length) continue
      const all = plan.entries.filter(e => !e.erased && e.source.artifactHash === artifact.sha256)
      let bytes: Buffer, projection = chosen.length !== all.length
      if (!projection && artifact.original?.status === 'available') bytes = Buffer.from(artifact.original.base64, 'base64')
      else if (chosen.every(e => e.source.namespace === 'csv') && artifact.original?.status === 'available') {
        const original = parseCsv(Buffer.from(artifact.original.base64, 'base64').toString('utf8'))
        const indices = new Set(chosen.flatMap(e => (e.source.payload as any).rows ?? [e.source.location.row]))
        bytes = Buffer.from(formatCsv([original[0], ...original.slice(1).filter((_, index) => indices.has(index + 2))]))
      } else {
        // ServiceM8 JSON records retain their complete original object,
        // including unmapped fields. Never copy the surrounding peer array.
        bytes = Buffer.from(JSON.stringify(chosen.map(e => e.source.payload), null, 2))
        projection = true
      }
      if (artifact.original?.status === 'unavailable') omissions.push({ jobId: row.id, artifact: artifact.name, sourceSha256: artifact.sha256, reason: 'The byte-exact shared source was withdrawn for customer privacy; only a per-record projection remains.' })
      originals.push({ jobId: row.id, kind: 'artifact', name: artifact.name, sourceSha256: artifact.sha256, sha256: sha256(bytes), size: bytes.length, projection, bytes: Buffer.from(bytes).toString('base64') })
    }
  }
  for (const row of (await db.prepare("SELECT data FROM glove_records WHERE kind='imports'").all<any>()).results) {
    const batch = JSON.parse(row.data)
    for (const lost of batch.privacyOmissions ?? []) if (lost.peerIds.some((id: string) => scope.customers.has(id))) omissions.push({ jobId: batch.jobId, artifact: lost.name, sourceSha256: lost.sha256, reason: 'The byte-exact shared source was withdrawn for customer privacy; only per-record data remains.' })
  }
  return { affected, custody, originals, omissions }
}

/** The product erases its owned rows in the guarded native batch; the kit
 * field-redacts peer imports and keeps their applied revision for Undo. */
export function privacyTargets(ids: string[]) {
  const excluded = JSON.stringify(ids)
  return {
    ...importTargets,
    async list(db: Parameters<typeof importTargets.list>[0], destination: string) {
      return (await importTargets.list(db, destination)).filter(r => !ids.includes(r.targetId))
    },
    matchesCount(count: number) { return { sql: '(SELECT COUNT(*) FROM glove_records WHERE revision IS NOT NULL AND id NOT IN (SELECT value FROM json_each(?)))=?', params: [excluded, count] } },
    write(row: Parameters<typeof importTargets.write>[0]) {
      return [{ sql: 'UPDATE glove_records SET data=? WHERE kind=? AND id=? AND revision=?', params: [canonicalJson(row.value), row.targetKind === 'workorders' ? 'jobs' : row.targetKind, row.targetId, row.revision] }]
    },
  }
}
