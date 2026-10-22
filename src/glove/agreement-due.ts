import type { Row, State } from './model'

export const addMonths = (date: string, months: number) => {
  const [y, m, d] = date.split('-').map(Number), total = y * 12 + m - 1 + months, year = Math.floor(total / 12), month = total % 12 + 1
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`
}

// Each entitlement keeps its ordinal even when later visits finish first.
// Pre-PLAN-004 jobs take the first unclaimed ordinal in their stored order.
// A decline is the customer's explicit answer recorded on the agreement.
export function agreementVisits(s: State, a: Row) {
  const declines: Row[] = a.declines ?? []
  const rows = Array.from({ length: a.plan.includedVisits }, (_, index) => ({
    id: `${a.id}:${index}`, agreementId: a.id, index,
    due: a.importedEntitlements?.[index]?.due ?? addMonths(a.startDate, Math.floor(index * a.plan.termMonths / a.plan.includedVisits)),
    ...(a.importedEntitlements ? { importedEventId: a.importedEntitlements[index].sourceId, siteId: a.importedEntitlements[index].siteId, sourceClosed: a.importedEntitlements[index].sourceClosed === true } : {}),
    jobId: null as string | null, visitId: null as string | null, completed: a.importedEntitlements?.[index]?.completed === true, booked: false,
    declined: declines.find(d => d.index === index) ?? null,
  }))
  const jobs = s.jobs.filter(j => j.agreementId === a.id)
  for (const j of [...jobs.filter(j => j.agreementVisitIndex !== undefined), ...jobs.filter(j => j.agreementVisitIndex === undefined)]) {
    const row = j.agreementVisitIndex === undefined ? rows.find(x => !x.jobId) : rows[j.agreementVisitIndex]
    if (!row || row.jobId) continue
    const visits = s.visits.filter(v => v.jobId === j.id)
    const visit = visits.find(v => v.status === 'completed') ?? visits.find(v => v.status !== 'cancelled')
    Object.assign(row, { jobId: j.id, visitId: visit?.id ?? null, completed: visit?.status === 'completed', booked: !!visit && visit.status !== 'completed' })
  }
  return rows
}

/** Outstanding entitlements never disappear at term end or when merely booked; only completion or a recorded decline removes one. */
export function dueVisits(s: State, through: string, from?: string, area?: string) {
  return s.agreements.flatMap(a => agreementVisits(s, a).filter(v => !v.completed && !v.declined && !('sourceClosed' in v && v.sourceClosed) && v.due <= through && (!from || v.due >= from)).map(v => {
    const siteId = 'siteId' in v ? v.siteId : a.siteId, site = s.sites.find(x => x.id === siteId), customer = s.customers.find(x => x.id === a.customerId)
    return { ...v, customerId: a.customerId, customer: customer?.name ?? '', siteId, address: site?.address ?? '', area: site?.zip ?? '', plan: a.plan.name, service: a.plan.visitServiceName }
  })).filter(v => !area || v.area === area).sort((a, b) => a.due.localeCompare(b.due) || a.id.localeCompare(b.id))
}
