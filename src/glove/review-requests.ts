import { bump, business, event, expectVersion, fail, find, text } from './model'
import { invoiceBalance } from './balances'
import { isAddress, queueEmail } from './mail'
import { quoteEmailFooter } from './email-preferences'
import type { Handler } from './commands/types'
import type { State, Row } from './model'

export function reviewWorkReady(s: State, job: Row) {
  const invoices = s.invoices.filter(i => i.jobId === job.id && !i.erasedAt)
  const visits = s.visits.filter(v => v.jobId === job.id && v.status !== 'cancelled')
  return visits.length > 0 && visits.every(v => v.status === 'completed') && invoices.length > 0 && invoices.every(i => invoiceBalance(s, i) !== null && invoiceBalance(s, i)! <= 0)
}

export function reviewReason(s: State, job: Row, now: string) {
  const customer = find(s, 'customers', job.customerId), config = business(s).reviewRequests
  const consent = customer.automaticEmail?.reviews
  let reason = !config?.enabled ? 'disabled' : customer.erasedAt || customer.mergedInto || customer.doNotContact || customer.marketingOptOut || (customer.tags ?? []).some((t: string) => t.toLowerCase() === 'do not contact') ? 'opted out' : !consent?.enabled || consent.address !== customer.email || !isAddress(customer.email) ? 'no current review-email consent' : !reviewWorkReady(s, job) ? 'job must be complete and paid' : null
  const previous = s.messages.filter(m => m.kind === 'reviewRequest' && m.customerId === customer.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (!reason && previous && Date.parse(now) - Date.parse(previous.createdAt) < config.periodDays * 86400000) reason = 'period already requested'
  return reason
}

/** Conservative interim door: a person explicitly requests every send; no automatic outreach. */
export const reviewRequests: Handler = async (c, type, p) => {
  if (!['review.configure', 'review.consent', 'review.request'].includes(type)) return
  if (c.actor.role !== 'owner' || c.actor.branch || c.actor.token) fail('FORBIDDEN', 'Only the unscoped signed-in owner manages review requests.', null, 403)
  const b = business(c.s)
  if (type === 'review.configure') {
    expectVersion(b, p.version)
    if (typeof p.enabled !== 'boolean') fail('INPUT', 'Choose whether review requests are enabled.', null, 400)
    if (!p.enabled) {
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: type, summary: 'Owner disabled review requests', data: null })
      return bump(c.s, 'business', b, { reviewRequests: { ...b.reviewRequests, enabled: false } })
    }
    if (p.approved !== true) fail('CONSENT', 'Explicitly approve the same request for every customer.', null, 400)
    if (!Number.isInteger(p.periodDays) || p.periodDays < 1 || p.periodDays > 3650) fail('INPUT', 'Choose a period from 1 to 3650 days.', null, 400)
    if (!['completion', 'payment'].includes(p.trigger)) fail('INPUT', 'Choose completion or payment for owner review; both completion and payment are required.', null, 400)
    let url: URL
    try { url = new URL(text(p.url, 'url', { max: 1000 })) } catch { return fail('INPUT', 'Use a valid Google review link.', null, 400) }
    if (url.protocol !== 'https:' || !['search.google.com', 'g.page'].includes(url.hostname) || url.username || url.password || url.hash) fail('INPUT', 'Use the Google review link without credentials or a fragment.', null, 400)
    const template = text(p.template, 'template', { max: 2000 })
    if (/https?:|www\.|[<>{}]/i.test(template)) fail('INPUT', 'Use one plain-text request, without links or merge fields.', null, 400)
    const address = p.postalAddress === undefined ? b.address?.trim() : text(p.postalAddress, 'postalAddress', { max: 1000 })
    if (!address) fail('POSTAL_ADDRESS', 'Record the business postal address first.', null, 409)
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: type, summary: 'Owner approved uniform, explicit email review requests; no automatic sends', data: { trigger: p.trigger, periodDays: p.periodDays } })
    return bump(c.s, 'business', b, { address, reviewRequests: { enabled: true, periodDays: p.periodDays, trigger: p.trigger, url: url.toString(), template } })
  }
  if (type === 'review.consent') {
    const customer = find(c.s, 'customers', p.customerId); expectVersion(customer, p.version)
    if (typeof p.enabled !== 'boolean') fail('INPUT', 'Choose whether this customer permits review email.', null, 400)
    const reference = text(p.reference, 'reference', { max: 500 })
    event(c, { jobId: null, subjectKind: 'customer', subjectId: customer.id, kind: type, summary: 'Owner recorded review-email consent or withdrawal', data: { enabled: p.enabled } })
    return bump(c.s, 'customers', customer, { automaticEmail: { ...customer.automaticEmail, reviews: { enabled: p.enabled, address: customer.email, reference, at: c.now } } })
  }
  const job = find(c.s, 'jobs', p.jobId), customer = find(c.s, 'customers', job.customerId), config = b.reviewRequests
  const reason = reviewReason(c.s, job, c.now)
  if (reason) {
    event(c, { jobId: job.id, subjectKind: 'customer', subjectId: customer.id, kind: 'review.skipped', summary: `Review request not sent: ${reason}`, data: { reason } })
    return { sent: false, reason }
  }
  const message = queueEmail(c, { kind: 'reviewRequest', subjectKind: 'job', subjectId: job.id, jobId: job.id, customerId: customer.id, to: customer.email, subject: `${b.name}: review request`, label: 'review request', text: `${config.template}\n${config.url}` + quoteEmailFooter(c, customer.id, customer.email, 'reviews') })
  return { sent: true, messageId: message.id }
}
