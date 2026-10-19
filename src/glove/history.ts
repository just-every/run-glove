import type { Row } from './model'

// One property's history (CUST-001): every request, quote, job, visit, field
// item (photo, form, note, material, refrigerant), invoice and equipment
// record at the site, newest first, from what this person may see.

type View = Record<'enquiries' | 'quotes' | 'jobs' | 'visits' | 'captures' | 'invoices' | 'equipment', Row[]>
export type HistoryEntry = { at: string; kind: string; id: string; jobId: string | null; label: string; status: string | null }

const captureKinds: Record<string, string> = { checklist: 'form', photo: 'photo', note: 'note', material: 'material', refrigerant: 'refrigerant', arrival: 'arrival', completion: 'completion' }

function captureLabel(x: Row) {
  switch (x.kind) {
    case 'checklist': return `${x.label}: ${x.result}${x.note ? ` (${x.note})` : ''}`
    case 'photo': return x.caption ? `Photo: ${x.caption}` : 'Photo'
    case 'note': return x.text
    case 'material': return `${x.description} × ${x.quantity}${x.unit ? ` ${x.unit}` : ''}`
    case 'refrigerant': return `Refrigerant ${x.refrigerant?.type ?? ''}`.trim()
    case 'arrival': return 'Arrived on site'
    case 'completion': return x.summary ? `Completed: ${x.summary}` : 'Completed'
    default: return x.kind
  }
}

export function propertyHistory(v: View, site: Row): HistoryEntry[] {
  const jobs = v.jobs.filter(j => j.siteId === site.id), number = new Map(jobs.map(j => [j.id, j.number as string]))
  const entry = (at: string, kind: string, id: string, jobId: string | null, label: string, status: string | null = null): HistoryEntry => ({ at, kind, id, jobId, label, status })
  return [
    ...v.enquiries.filter(e => e.siteId === site.id).map(e => entry(e.createdAt, 'request', e.id, null, `Request (${e.source}): ${e.description}`, e.status)),
    ...v.quotes.filter(q => q.siteId === site.id).map(q => entry(q.createdAt, 'quote', q.id, null, `${q.number} ${q.title}`, q.status)),
    ...jobs.map(j => entry(j.createdAt, 'job', j.id, j.id, `${j.number} ${j.title}`, j.status)),
    ...v.visits.filter(x => number.has(x.jobId)).map(x => entry(x.createdAt, 'visit', x.id, x.jobId, `${number.get(x.jobId)} visit ${x.local.date} ${x.local.start}–${x.local.end}`, x.status)),
    ...v.captures.filter(x => number.has(x.jobId)).map(x => entry(x.createdAt, captureKinds[x.kind] ?? x.kind, x.id, x.jobId, `${number.get(x.jobId)} ${captureLabel(x)}`)),
    ...v.invoices.filter(i => number.has(i.jobId)).map(i => entry(i.createdAt, 'invoice', i.id, i.jobId, `${i.number} for ${number.get(i.jobId)}`, i.status)),
    ...v.equipment.filter(e => e.siteId === site.id).map(e => entry(e.createdAt, 'equipment', e.id, null, [e.type, e.make, e.model].filter(Boolean).join(' '))),
  ].sort((a, b) => b.at.localeCompare(a.at))
}
