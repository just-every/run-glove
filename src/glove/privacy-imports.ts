import { Buffer } from 'node:buffer'
import { loadPlans } from '../modules/import-kit/src/d1/plans'
import { importTargets } from './movein/kit'
import { canonicalJson, sha256, type ImportPlan } from '../modules/import-kit/src/d1/index'
import { formatCsv, parseCsv } from './csv-format'
import type { privacyScope } from './privacy'

/** Source ownership survives a rejected mapping. Follow only typed provider
 * relationships, never arbitrary UUID mentions or another provider's IDs. */
export function customerPlanEntries(plan: ImportPlan, scope: ReturnType<typeof privacyScope>) {
  const companies = new Set(scope.records.customers.filter(c => c.source?.system === 'ServiceM8').map(c => c.source.id))
  const jobs = new Set(plan.entries.filter(e => !e.erased && e.source.namespace === 'servicem8' && e.source.kind === 'job' && companies.has((e.source.payload as any).company_uuid)).map(e => e.source.sourceId))
  const payments = plan.entries.filter(e => !e.erased && e.source.namespace === 'servicem8' && e.source.kind === 'jobpayment' && jobs.has((e.source.payload as any).job_uuid))
  const paymentIds = new Set(payments.map(e => e.source.sourceId)), attachmentIds = new Set(payments.map(e => (e.source.payload as any).attachment_uuid).filter(Boolean))
  return plan.entries.filter(e => {
    if (e.erased) return false
    if (e.effects.some(effect => scope.ids.has(effect.targetId))) return true
    if (e.source.namespace !== 'servicem8') return scope.matches(e.source.payload)
    const p = e.source.payload as any
    return e.source.kind === 'company' && companies.has(e.source.sourceId)
      || e.source.kind === 'companycontact' && companies.has(p.company_uuid)
      || e.source.kind === 'job' && jobs.has(e.source.sourceId)
      || ['jobpayment', 'jobmaterial', 'jobactivity'].includes(e.source.kind) && jobs.has(p.job_uuid)
      || e.source.kind === 'attachment' && (attachmentIds.has(e.source.sourceId) || p.related_object === 'job' && jobs.has(p.related_object_uuid) || p.related_object === 'jobpayment' && paymentIds.has(p.related_object_uuid))
  })
}

/** Files named by retained source objects remain in custody even when no
 * native capture was created for the source. */
export function sourceAttachmentNames(entries: ImportPlan['entries']) {
  return new Set(entries.filter(e => e.source.namespace === 'servicem8').flatMap(e => {
    const p = e.source.payload as any
    const uuid = e.source.kind === 'jobpayment' ? p.attachment_uuid : e.source.kind === 'attachment' ? e.source.sourceId : null
    return typeof uuid === 'string' && uuid ? [`attachments/${uuid}`] : []
  }))
}

/** Read all retained plan encodings with the pinned kit's hash checks. Export
 * only this person's source records; shared files are projected by format. */
export async function customerImportData(db: D1Database, scope: ReturnType<typeof privacyScope>) {
  const rows = (await db.prepare('SELECT * FROM ik_jobs WHERE destination=?').bind('glove').all<any>()).results
  const plans = await loadPlans(rows, db)
  const affected = rows.filter(row => customerPlanEntries(plans.get(row.id)!, scope).length)
  const custody: any[] = [], originals: any[] = [], omissions: any[] = []
  for (const row of affected) {
    const plan = plans.get(row.id)!
    const mine = customerPlanEntries(plan, scope)
    const safe = mine.filter(e => e.effects.every(effect => scope.ids.has(effect.targetId)))
    for (const e of mine) if (!safe.includes(e)) omissions.push({ jobId: row.id, sourceIdentity: e.identity, reason: 'Shared source record requires owner review; peer data withheld.' })
    custody.push({ jobId: row.id, records: safe.map(e => ({ source: e.source, unmapped: e.unmapped, rejection: e.rejection })) })
    for (const e of safe) for (const effect of e.effects) if (effect.attachment) originals.push({ jobId: row.id, kind: 'attachment', targetId: effect.targetId, mediaType: effect.attachment.mediaType, sha256: effect.attachment.sha256, bytes: effect.attachment.base64, projection: false })
    // Downloaded provider attachments belong to captures or private source records.
    // They have no source row of their own, so select them through this customer's effects.
    const attachmentNames = new Set<string>()
    for (const e of safe) for (const effect of e.effects) {
      const value = effect.value as any
      const attachments = [...(effect.targetKind === 'captures' && value?.kind === 'attachment' ? [value] : []), ...(value?.importedAttachments ?? [])]
      for (const value of attachments) {
      if (value.bytes?.status !== 'retained' || attachmentNames.has(value.bytes.artifact)) continue
      attachmentNames.add(value.bytes.artifact)
      const artifact = plan.source.artifacts.find(a => a.name === value.bytes.artifact && a.sha256 === value.bytes.sha256)
      if (!artifact || artifact.original?.status !== 'available') {
        omissions.push({ jobId: row.id, artifact: value.bytes.artifact, sourceSha256: value.bytes.sha256, reason: 'The retained attachment original is unavailable or was withdrawn for customer privacy.' })
        continue
      }
      originals.push({ jobId: row.id, kind: 'attachment', name: artifact.name, targetId: effect.targetId, sha256: artifact.sha256, size: artifact.size, projection: false, bytes: artifact.original.base64 })
      }
    }
    const foreignAttachments = sourceAttachmentNames(plan.entries.filter(e => !e.erased && !safe.includes(e)))
    for (const name of sourceAttachmentNames(safe)) {
      if (attachmentNames.has(name)) continue
      const artifact = plan.source.artifacts.find(a => a.name === name)
      if (!artifact || artifact.original?.status !== 'available' || foreignAttachments.has(name)) {
        omissions.push({ jobId: row.id, artifact: name, sourceSha256: artifact?.sha256, reason: foreignAttachments.has(name) ? 'Shared source attachment requires owner review; peer data withheld.' : 'The source attachment original is unavailable or was withdrawn for customer privacy.' })
        continue
      }
      attachmentNames.add(name)
      originals.push({ jobId: row.id, kind: 'attachment', name, sha256: artifact.sha256, size: artifact.size, projection: false, bytes: artifact.original.base64 })
    }
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
