import { documentIdentity, documentTemplate } from './documents'
import { sha256 } from '../modules/import-kit/src/d1/index'
import { business, event, fail, find, newId, put, text, type Context, type Row } from './model'
import { quantity, thousandths } from './money'

// FIELD-003: only this explicit, customer-facing projection crosses the public
// door. It is frozen at completion; later evidence and edits never rewrite it.
export type ReportFile = { fileId: string; mediaType: string; sha256: string; size: number }
export type Recommendation = { id: string; title: string; description: string; serviceId: string | null; quantity: string }
export type ReportAnswer = { label: string; type: string; value: string | boolean | ReportFile; unit?: string; min?: string; max?: string; flagged?: boolean }
export type ServiceReportSnapshot = {
  business: ReturnType<typeof documentIdentity>; template?: { heading: string; terms: string; footer: string }
  job: { number: string; title: string }
  customer: { name: string }; site: { address: string }
  visit: { date: string; completedAt: string; technician: string; timezone?: string }
  summary: string; findings: string
  forms: { name: string; answers: ReportAnswer[] }[]
  photos: { caption: string; file: ReportFile }[]
  materials: { description: string; quantity: string; unit: string }[]
  signoff: { customerPresent: boolean; customerName?: string; signature?: ReportFile; absentReason?: string }
  recommendations: { id: string; title: string; description: string }[]
  files: string[]
}

/** Spread these into the completion record before recording it. No field prices. */
export function completionReportFields(c: Context, p: any) {
  const findings = text(p.findings, 'findings', { optional: true, max: 4000 })
  if (p.recommendations !== undefined && (!Array.isArray(p.recommendations) || p.recommendations.length > 20)) fail('INPUT', 'Record at most 20 recommendations.', { field: 'recommendations' }, 400)
  const recommendations: Recommendation[] = (p.recommendations ?? []).map((r: any, i: number) => {
    const service = r?.serviceId ? find(c.s, 'services', r.serviceId) : null
    if (service?.archived || service?.kind === 'discount') fail('INPUT', 'Choose a current service or material for the recommendation.', { field: `recommendations[${i}].serviceId` }, 400)
    return { id: newId(), title: text(r?.title, `recommendations[${i}].title`, { max: 200 }), description: text(r?.description, `recommendations[${i}].description`, { optional: true, max: 2000 }), serviceId: service?.id ?? null, quantity: quantity(thousandths(r?.quantity ?? '1', `recommendations[${i}].quantity`)) }
  })
  return { findings, recommendations }
}

/** Called once by visit.complete in the same native, authority-guarded commit. */
export function createServiceReport(c: Context, visit: Row) {
  if (!visit.completion || visit.status !== 'completed') fail('REPORT', 'Complete the visit before preparing its report.')
  if (c.s.serviceReports.some(r => r.visitId === visit.id)) fail('REPORT', 'This visit already has its immutable report.')
  const job = find(c.s, 'jobs', visit.jobId), customer = find(c.s, 'customers', job.customerId), site = find(c.s, 'sites', job.siteId)
  const tech = find(c.s, 'technicians', visit.completion.technicianId), b = business(c.s), completion = visit.completion
  const captures = c.s.captures.filter(x => x.visitId === visit.id)
  const files = new Set<string>()
  const file = (value: any): ReportFile => {
    files.add(value.fileId)
    return { fileId: value.fileId, mediaType: value.mediaType, sha256: value.sha256, size: value.size }
  }
  const snapshot: ServiceReportSnapshot = {
    business: documentIdentity(c.s), template: documentTemplate(c.s, 'report'),
    job: { number: job.number, title: job.title }, customer: { name: customer.name }, site: { address: site.address },
    visit: { date: visit.local.date, timezone: visit.local.timezone, completedAt: completion.deviceTime, technician: String(tech.name).trim().split(/\s+/)[0] },
    summary: completion.summary, findings: completion.findings ?? '',
    forms: captures.filter(x => x.kind === 'form').map(x => ({ name: x.formName, answers: x.answers.map((a: any): ReportAnswer => ({ label: a.label, type: a.type, value: ['photo', 'signature'].includes(a.type) ? file(a.value) : a.value, ...(a.unit ? { unit: a.unit } : {}), ...(a.type === 'reading' ? { min: a.min, max: a.max, flagged: a.flagged === true } : {}) })) })),
    photos: captures.filter(x => x.kind === 'photo').map(x => ({ caption: x.caption ?? '', file: file(x.file) })),
    materials: captures.filter(x => x.kind === 'material').map(x => ({ description: x.description, quantity: x.quantity, unit: x.unit })),
    signoff: completion.signoff.customerPresent ? { customerPresent: true, customerName: completion.signoff.customerName, signature: file(completion.signoff.signature) } : { customerPresent: false, absentReason: completion.signoff.absentReason },
    recommendations: (completion.recommendations ?? []).map((r: Recommendation) => ({ id: r.id, title: r.title, description: r.description })),
    files: [],
  }
  if (snapshot.business.logo?.fileId) files.add(snapshot.business.logo.fileId)
  snapshot.files = [...files]
  const row = put(c.s, 'serviceReports', { id: newId(), version: 1, createdAt: c.now, jobId: job.id, visitId: visit.id, customerId: customer.id, siteId: site.id, snapshot: structuredClone(snapshot), recommendations: structuredClone(completion.recommendations ?? []) })
  event(c, { jobId: job.id, subjectKind: 'serviceReport', subjectId: row.id, kind: 'report.created', summary: `${job.number} service report prepared from the completed visit`, data: { visitId: visit.id, reportId: row.id } })
  return row
}

export const reportTokenHash = (value: string) => sha256(`glove-service-report:${value}`)
export function newReportToken() {
  return 'glr_' + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const publicHeaders = { 'cache-control': 'no-store, private', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow', vary: 'Authorization' }
const unavailable = () => Response.json({ ok: false, error: { code: 'REPORT_LINK', message: 'This report link is unavailable or has expired. Ask the business for a new link.' } }, { status: 404, headers: publicHeaders })

/** Wire before currentActor: this credential grants only this frozen report and
 * its exact originals, never a customer, job, search or write capability.
 * The credential stays in Authorization, never a URL/query or stored outcome.
 */
export async function publicServiceReport(request: Request, db: D1Database): Promise<Response | null> {
  const url = new URL(request.url)
  const path = /^\/api\/glove\/public\/reports(?:\/files\/([0-9a-f-]{36}))?$/.exec(url.pathname)
  if (!path) return null
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { ...publicHeaders, allow: 'GET' } })
  const token = /^Bearer (glr_[A-Za-z0-9_-]{43})$/.exec(request.headers.get('authorization') ?? '')?.[1]
  if (!token || url.search) return unavailable()
  // Scope and time gates are repeated in the file SQL itself, so revocation
  // and expiry protect original bytes as well as the page on every request.
  const gate = `FROM glove_report_secrets secret
    JOIN glove_records link ON link.kind='serviceReportLinks' AND link.id=secret.link_id
    JOIN glove_records report ON report.kind='serviceReports' AND report.id=json_extract(link.data,'$.reportId')
    WHERE secret.hash=? AND json_extract(link.data,'$.revokedAt') IS NULL
    AND json_extract(link.data,'$.expiresAt')>?`
  const hash = reportTokenHash(token), now = new Date().toISOString()
  if (path[1]) {
    const row = await db.prepare(`SELECT original.media_type AS mediaType,original.bytes AS bytes ${gate}
      AND EXISTS(SELECT 1 FROM json_each(report.data,'$.snapshot.files') WHERE value=?)
      AND EXISTS(SELECT 1 FROM glove_files WHERE id=?)
      AND original.id=?`.replace('FROM glove_report_secrets secret', 'FROM glove_files original CROSS JOIN glove_report_secrets secret')).bind(hash, now, path[1], path[1], path[1]).first<{ mediaType: string; bytes: ArrayBuffer }>()
    return row ? new Response(new Uint8Array(row.bytes), { headers: { ...publicHeaders, 'content-type': row.mediaType, 'content-disposition': 'inline' } }) : unavailable()
  }
  const row = await db.prepare(`SELECT json_extract(report.data,'$.snapshot') AS snapshot ${gate}`).bind(hash, now).first<{ snapshot: string }>()
  return row ? Response.json({ report: JSON.parse(row.snapshot) }, { headers: publicHeaders }) : unavailable()
}
