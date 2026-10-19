import { allow } from '../access'
import { bump, event, expectVersion, fail, find, newId, put, text, type Row } from '../model'
import { newReportToken, reportTokenHash, type Recommendation } from '../service-reports'
import { quotes } from './quotes'
import type { Handler } from './types'

/** Desk controls. The ordinary command pipeline supplies live native authority,
 * branchState and its atomic commit guard; each handler checks its role too. */
export const serviceReports: Handler = async (c, type, p, db) => {
  if (!['report.link', 'report.revoke', 'report.quote'].includes(type)) return undefined
  allow(c.actor, type)
  if (type === 'report.link') {
    const report = find(c.s, 'serviceReports', p.reportId), token = newReportToken()
    const row = put(c.s, 'serviceReportLinks', { id: newId(), version: 1, createdAt: c.now, jobId: report.jobId, reportId: report.id, expiresAt: new Date(Date.parse(c.now) + 7 * 86400000).toISOString(), revokedAt: null })
    c.sql.push({ sql: 'INSERT INTO glove_report_secrets(link_id,hash) VALUES(?,?)', params: [row.id, reportTokenHash(token)] })
    c.reveal = { token }
    event(c, { jobId: report.jobId, subjectKind: 'serviceReportLink', subjectId: row.id, kind: 'report.link.created', summary: `${c.actor.name} created a seven-day service report link for manual sharing`, data: { reportId: report.id, expiresAt: row.expiresAt } })
    return row
  }
  if (type === 'report.revoke') {
    const link = find(c.s, 'serviceReportLinks', p.linkId)
    expectVersion(link, p.version)
    if (link.revokedAt) fail('REPORT_LINK', 'This report link is already revoked.')
    const row = bump(c.s, 'serviceReportLinks', link, { revokedAt: c.now })
    event(c, { jobId: link.jobId, subjectKind: 'serviceReportLink', subjectId: row.id, kind: 'report.link.revoked', summary: `${c.actor.name} revoked a service report link`, data: { reportId: link.reportId } })
    return row
  }
  // Reuse quote.draft, its current price book and normal human price approval.
  // An unpriced recommendation needs the desk's price; never invent a price.
  allow(c.actor, 'quote.draft')
  const report = find(c.s, 'serviceReports', p.reportId)
  const recommendation = (report.recommendations as Recommendation[]).find(r => r.id === p.recommendationId) ?? fail('NOT_FOUND', 'Choose a recommendation on this report.', null, 404)
  const item = recommendation.serviceId ? find(c.s, 'services', recommendation.serviceId) : null
  if (item?.archived || item?.kind === 'discount') fail('INPUT', 'Update this recommendation’s price-book item before quoting it.', null, 400)
  const unitPrice = text(p.unitPrice ?? item?.unitPrice, 'unitPrice', { max: 30 })
  const quote = await quotes(c, 'quote.draft', { customerId: report.customerId, siteId: report.siteId, title: recommendation.title, notes: recommendation.description, lines: [{ description: recommendation.title, quantity: recommendation.quantity, unitPrice, ...(item ? { serviceId: item.id, tax: item.tax } : {}) }] }, db) as Row
  const row = put(c.s, 'quotes', { ...quote, serviceReport: { reportId: report.id, visitId: report.visitId, recommendationId: recommendation.id } })
  event(c, { jobId: report.jobId, subjectKind: 'serviceReport', subjectId: report.id, kind: 'report.recommendation.quoted', summary: `${c.actor.name} turned “${recommendation.title}” into ${row.number}, a draft awaiting price approval`, data: { reportId: report.id, recommendationId: recommendation.id, quoteId: row.id } })
  return row
}
