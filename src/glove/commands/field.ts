import { completionReportFields, createServiceReport } from '../service-reports'
import { fail, text, oneOf, find, put, bump, event, newId, business, type Context, type Row } from '../model'
import { clockLabel } from '../time'
import { thousandths, quantity } from '../money'
import { equipmentAt } from './equipment'
import { stopTimerOn } from './time'
import { answer } from '../forms'
import { move } from './stock'
import type { Handler } from './types'

// What a technician records on a phone: arrival, checklist results, notes,
// photos, materials and the customer's completion sign-off. The phone queues
// these while offline and sends each with the identity it was given when it
// was captured, so a resend after a dropped connection lands once. Evidence
// that arrives after the visit moved to someone else is kept and flagged for
// the dispatcher's review, never dropped.

const media = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47], 'image/webp': [0x52, 0x49, 0x46, 0x46] } as const

export async function image(c: Context, value: any, captureId: string, name: string) {
  const mediaType = oneOf(value?.mediaType, Object.keys(media) as (keyof typeof media)[], `${name}.mediaType`)
  if (typeof value?.base64 !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value.base64)) return fail('FILE', `${name} must be base64 image bytes.`, null, 400)
  const bytes = Uint8Array.from(atob(value.base64), ch => ch.charCodeAt(0))
  if (!bytes.length || bytes.length > 1_500_000) return fail('FILE', `${name} must be under 1.5 MB (the phone shrinks photos before sending).`, null, 400)
  if (!media[mediaType].every((b, i) => bytes[i] === b)) return fail('FILE', `${name} is not a ${mediaType} image.`, null, 400)
  const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('')
  const file = { id: newId(), sha256, mediaType, size: bytes.length, bytes, captureId }
  c.files.push(file)
  return { fileId: file.id, sha256, mediaType, size: bytes.length }
}

/** The technician record of the signed-in person. */
function me(c: Context) {
  return c.s.technicians.find(t => t.operatorId === c.actor.id) ?? fail('TECHNICIAN', 'Your sign-in is not linked to a technician yet. Ask the dispatcher to link it.', null, 403)
}

export function assigned(c: Context, visitId: unknown) {
  const visit = find(c.s, 'visits', visitId), tech = me(c)
  const everAssigned = visit.assignments.some((a: Row) => a.technicianId === tech.id)
  if (!everAssigned) fail('FORBIDDEN', 'This visit was never assigned to you.', null, 403)
  const current = visit.technicianId === tech.id && !['cancelled', 'completed'].includes(visit.status)
  return { visit, tech, current }
}

const deviceTime = (value: unknown) => typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : fail('INPUT', 'deviceTime is the phone\'s clock time when this was recorded.', null, 400)

function record(c: Context, visit: Row, tech: Row, current: boolean, kind: string, at: string, fields: Record<string, unknown>, summary: string) {
  const capture = put(c.s, 'captures', { id: c.commandId, version: 1, createdAt: c.now, visitId: visit.id, jobId: visit.jobId, technicianId: tech.id, kind, deviceTime: at, receivedAt: c.now, late: !current, ...fields })
  const lateEvidence = current ? visit.lateEvidence : [...visit.lateEvidence, { captureId: capture.id, kind, technicianId: tech.id, receivedAt: c.now, reviewed: null }]
  bump(c.s, 'visits', visit, { lateEvidence })
  event(c, { jobId: visit.jobId, subjectKind: 'capture', subjectId: capture.id, kind: `capture.${kind}`, summary: `${tech.name}: ${summary} (phone time ${clockLabel(at, visit.local.timezone ?? business(c.s).timezone, c.now)})${current ? '' : ' — arrived after the visit changed; waiting for dispatcher review'}`, data: { captureId: capture.id } })
  return capture
}

export const field: Handler = async (c, type, p) => {
  switch (type) {
    case 'visit.arrive': {
      const { visit, tech, current } = assigned(c, p.visitId), at = deviceTime(p.deviceTime)
      if (current && visit.arrival) fail('ARRIVED', 'Arrival is already recorded for this visit.', { arrival: visit.arrival })
      const capture = record(c, visit, tech, current, 'arrival', at, {}, 'recorded arrival on site')
      if (current) bump(c.s, 'visits', c.s.visits.find(v => v.id === visit.id)!, { status: 'arrived', arrival: { technicianId: tech.id, deviceTime: at, receivedAt: c.now, captureId: capture.id } })
      return capture
    }
    case 'visit.capture': {
      const { visit, tech, current } = assigned(c, p.visitId), at = deviceTime(p.deviceTime), job = find(c.s, 'jobs', visit.jobId)
      const kind = oneOf(p.kind, ['checklist', 'note', 'photo', 'material', 'refrigerant', 'form', 'line'] as const, 'kind')
      // DISP-007: a subcontractor sees no price book or equipment, so records checklist, notes, photos, materials and forms only.
      if (c.actor.role === 'subcontractor' && ['refrigerant', 'line'].includes(kind) || c.actor.role === 'subcontractor' && p.serviceId !== undefined) fail('FORBIDDEN', 'A subcontractor records checklist items, notes, photos, materials by description and forms.', null, 403)
      if (kind === 'line') {
        // BOOK-005: work added on a service call from the price book, with the customer's approval; the office's invoice prices it.
        if (!job.serviceCall) fail('QUOTED', 'Work added to a quoted job is a change order (QUOTE-006).')
        const item = find(c.s, 'services', p.serviceId)
        if (item.archived) fail('INPUT', `${item.name} is no longer in the price book.`, { field: 'serviceId' }, 400)
        // QUOTE-007: discounts are given at the desk within the owner's limits, not added on site.
        if (item.kind === 'discount') fail('INPUT', 'A discount is given on the quote or invoice, within the owner’s limits.', { field: 'serviceId' }, 400)
        const approvedBy = { customerName: text(p.approval?.customerName, 'approval.customerName', { max: 200 }), method: oneOf(p.approval?.method, ['signed', 'verbal'] as const, 'approval.method') }
        const line = { serviceId: item.id, description: item.name, quantity: quantity(thousandths(p.quantity, 'quantity')), unit: item.unit, approval: approvedBy }
        return record(c, visit, tech, current, kind, at, line, `added ${line.description} × ${line.quantity} ${line.unit} — approved by ${approvedBy.customerName} (${approvedBy.method})`)
      }
      if (kind === 'form') {
        // FIELD-002: one filled copy per form on the job; the unit it is about comes from the copy.
        const form = (job.forms ?? []).find((f: Row) => f.id === p.formId) ?? fail('NOT_FOUND', 'Choose a form on this job.', null, 404)
        if (c.s.captures.some(x => x.kind === 'form' && x.formId === form.id)) fail('FILLED', `${form.name} is already filled in on this job.`)
        const filled = await answer(c, form, p.answers)
        const unit = form.equipmentId ? c.s.equipment.find(e => e.id === form.equipmentId) : null
        const about = unit ? ` on ${[unit.type, unit.make, unit.model].filter(Boolean).join(' ')}` : ''
        return record(c, visit, tech, current, kind, at, { ...(unit ? { equipmentId: unit.id } : {}), formId: form.id, formName: form.name, ...filled }, `form ${form.name}${about}${filled.flagged ? ` — ${filled.flagged} reading${filled.flagged === 1 ? '' : 's'} out of range` : ''}`)
      }
      // Any field item can name the equipment it was about (CUST-002); refrigerant always does (FIELD-007).
      const unit = p.equipmentId !== undefined || kind === 'refrigerant' ? equipmentAt(c, job, p.equipmentId) : null
      const on = unit ? { equipmentId: unit.id } : {}
      const about = unit ? ` on ${[unit.type, unit.make, unit.model].filter(Boolean).join(' ')}` : ''
      if (kind === 'refrigerant') {
        const added = thousandths(p.added ?? '0', 'added', { zero: true }), recovered = thousandths(p.recovered ?? '0', 'recovered', { zero: true })
        if (!added && !recovered) fail('QUANTITY', 'Record the pounds of refrigerant added or recovered.', null, 400)
        const refrigerant = { type: text(p.refrigerant ?? unit!.refrigerant, 'refrigerant', { max: 40 }), added: quantity(added), recovered: quantity(recovered), addedThousandths: added, recoveredThousandths: recovered, certification: text(p.certification ?? tech.epa608, 'certification', { max: 40 }) }
        return record(c, visit, tech, current, kind, at, { ...on, refrigerant }, `refrigerant ${refrigerant.type}${about}: ${refrigerant.added} lb added, ${refrigerant.recovered} lb recovered (EPA 608 ${refrigerant.certification})`)
      }
      if (kind === 'checklist') {
        const item = job.checklist.find((i: Row) => i.id === p.itemId) ?? fail('NOT_FOUND', 'Choose an item on this job\'s checklist.', null, 404)
        const result = oneOf(p.result, ['done', 'not applicable'] as const, 'result')
        const note = text(p.note, 'note', { optional: result === 'done', max: 1000 })
        return record(c, visit, tech, current, kind, at, { ...on, itemId: item.id, label: item.label, result, note }, `${item.label}${about} — ${result}${note ? ` (${note})` : ''}`)
      }
      if (kind === 'note') {
        const note = text(p.text, 'text', { max: 4000 })
        return record(c, visit, tech, current, kind, at, { ...on, text: note }, `note${about}: ${note.slice(0, 80)}`)
      }
      if (kind === 'photo') {
        const file = await image(c, p.photo, c.commandId, 'photo'), caption = text(p.caption, 'caption', { optional: true, max: 300 })
        return record(c, visit, tech, current, kind, at, { ...on, file, caption }, `photo${about}${caption ? `: ${caption}` : ''}`)
      }
      const service = p.serviceId ? find(c.s, 'services', p.serviceId) : null
      if (service?.kind === 'discount') fail('INPUT', 'A discount is not a material used on site.', { field: 'serviceId' }, 400)
      const material = { description: text(p.description ?? service?.name, 'description', { max: 300 }), quantity: quantity(thousandths(p.quantity, 'quantity')), unit: text(p.unit, 'unit', { optional: true, max: 20 }) || service?.unit || 'each', serviceId: service?.id ?? null }
      const used = record(c, visit, tech, current, kind, at, { ...on, ...material }, `material ${material.description} × ${material.quantity} ${material.unit}${about}`)
      // STOCK-001: a price-book material comes off the technician's van.
      const van = service?.kind === 'material' ? c.s.stock.find(l => l.kind === 'van' && l.technicianId === tech.id && !l.archived) : null
      if (van) move(c, van, service!, -thousandths(p.quantity, 'quantity'), 'use', { jobId: visit.jobId, visitId: visit.id, captureId: used.id }, `${tech.name} used ${material.quantity} ${material.unit} ${service!.name} on ${job.number}`)
      return used
    }
    case 'visit.complete': {
      const { visit, tech, current } = assigned(c, p.visitId), at = deviceTime(p.deviceTime), job = find(c.s, 'jobs', visit.jobId)
      if (!current) fail('NOT_ASSIGNED', 'This visit is no longer yours to complete. Your recorded evidence is kept for the dispatcher.')
      if (!visit.arrival) fail('NO_ARRIVAL', 'Record your arrival before completing the visit.')
      // PLAN-001: a visit completes a recurring job only once its series has ended and no other visit is still booked.
      const jobComplete = p.jobComplete !== false && (!job.series || (!!job.series.until && job.series.through === job.series.until && !c.s.visits.some(v => v.jobId === job.id && v.id !== visit.id && v.status === 'booked')))
      if (jobComplete) {
        const results = new Map(c.s.captures.filter(x => x.jobId === job.id && x.kind === 'checklist').map(x => [x.itemId, x.result]))
        const open = job.checklist.filter((i: Row) => i.required && !results.has(i.id))
        if (open.length) fail('CHECKLIST', 'Finish the required checklist items, or mark them not applicable with a reason.', { open: open.map((i: Row) => i.label) })
      }
      const summary = text(p.summary, 'summary', { max: 4000 })
      let signoff: Record<string, unknown>
      if (p.signoff?.absentReason) signoff = { customerPresent: false, absentReason: text(p.signoff.absentReason, 'absentReason', { max: 500 }) }
      else signoff = { customerPresent: true, customerName: text(p.signoff?.customerName, 'customerName', { max: 200 }), signature: await image(c, p.signoff?.signature, c.commandId, 'signature') }
      const completion = { technicianId: tech.id, deviceTime: at, receivedAt: c.now, summary, signoff, jobComplete, ...completionReportFields(c, p) }
      record(c, visit, tech, true, 'completion', at, completion, `completed the visit${signoff.customerPresent ? ` — signed off by ${signoff.customerName}` : ` — customer not present (${signoff.absentReason})`}`)
      const row = bump(c.s, 'visits', c.s.visits.find(v => v.id === visit.id)!, { status: 'completed', completion })
      createServiceReport(c, row)
      stopTimerOn(c, tech, visit.id, at)
      // A later visit never moves an invoiced job back.
      // BOOK-006: an assessment is assessed, ready for a quote drafted from its request, never billed itself.
      if (job.kind === 'assessment' && job.status === 'open') {
        bump(c.s, 'jobs', job, { status: 'assessed', assessedAt: c.now })
        event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'assessment.done', summary: `${job.number} assessed; a quote drafted from its request carries its notes, photos and forms`, data: null })
      } else if (jobComplete && job.status === 'open') {
        bump(c.s, 'jobs', job, { status: 'completed', completedAt: c.now })
        event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'job.completed', summary: `${job.number} completed; ready for invoice preparation`, data: null })
      }
      return row
    }
  }
}
