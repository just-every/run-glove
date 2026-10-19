import { fail, text, find, put, bump, event, newId, nextNumber, type Row } from '../model'
import { book, slot, who } from './dispatch'
import type { Handler } from './types'

// Assessment visits on a request (BOOK-006). An assessment is a job of kind
// "assessment" made from the request, with no lines and no price, the forms the
// dispatcher chose, and one visit booked under GLOVE-05's conflict review, so it
// sits on the board and the assessor's phone like any visit and takes the same
// field capture. Completing it marks it assessed (never "completed, not
// invoiced"); a quote drafted from that request then carries its notes, photos
// and form results (quotes.ts), and the request, assessment and quote link.

export const assessments: Handler = async (c, type, p) => {
  if (type !== 'assessment.book') return undefined
  const enquiry = find(c.s, 'enquiries', p.enquiryId)
  if (['won', 'lost'].includes(enquiry.status)) fail('ENQUIRY_STATE', `This request is already ${enquiry.status}.`)
  if (c.s.jobs.some(j => j.kind === 'assessment' && j.enquiryId === enquiry.id && j.status === 'open')) fail('DUPLICATE', 'This request already has an assessment booked.')
  const site = find(c.s, 'sites', enquiry.siteId)
  const forms = (Array.isArray(p.formIds) ? p.formIds : []).slice(0, 10).map((id: unknown) => {
    const f = find(c.s, 'forms', id)
    if (f.archived) fail('INPUT', `${f.name} is archived.`, { field: 'formIds' }, 400)
    return { id: newId(), formId: f.id, formVersion: f.version, name: f.name, questions: f.questions, equipmentId: null }
  })
  const next = slot(c, p)
  const job = put(c.s, 'jobs', { id: newId(), version: 1, createdAt: c.now, number: nextNumber(c, 'job'), kind: 'assessment', enquiryId: enquiry.id, quoteId: null, quoteRevision: null, customerId: enquiry.customerId, siteId: site.id, title: `Assessment: ${text(p.title ?? enquiry.description?.slice(0, 100), 'title', { max: 200 })}`, instructions: text(p.instructions, 'instructions', { optional: true, max: 2000 }), lines: [], totals: null, checklist: [], forms, equipmentIds: [], status: 'open', source: null, assessment: { by: who(c), at: c.now } })
  event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'assessment.created', summary: `${job.number} assessment on the request "${enquiry.description}" made by ${c.actor.name}${forms.length ? ` with ${forms.map((f: Row) => f.name).join(', ')}` : ''}`, data: { enquiryId: enquiry.id } })
  const visit = book(c, job, next, p.acknowledge, text(p.reason, 'reason', { optional: true, max: 500 }) || 'Assessment booked')
  bump(c.s, 'enquiries', c.s.enquiries.find(e => e.id === enquiry.id)!, { assessmentJobId: job.id })
  return { job: c.s.jobs.find(j => j.id === job.id), visit }
}
