import { fail, find, expectVersion, bump, event, newId, type Actor, type Context, type Row, type State } from './model'

/** Installation-private custody is excluded from archives; public grant metadata is inert on restore. */
export const fieldInvoiceCustodyPath = (operatorId: string) => `$.${JSON.stringify(operatorId)}`
export const fieldInvoiceGranted = (tech: Row, actor: Actor) => actor.role === 'technician' && !actor.token && !actor.custom && tech.active !== false && tech.fieldInvoicing?.enabled && tech.fieldInvoicing.operatorId === actor.id && !!actor.fieldInvoiceGrant && tech.fieldInvoicing.grantId === actor.fieldInvoiceGrant

/** A distinct owner grant: field quoting never authorizes offline invoices. */
export function fieldInvoiceVisit(s: State, actor: Actor, visitId: unknown) {
  if (actor.role !== 'technician' || actor.token || actor.custom) fail('FORBIDDEN', 'Only the signed-in technician uses field invoices.', null, 403)
  const tech = s.technicians.find(t => t.operatorId === actor.id && t.active !== false) ?? fail('FORBIDDEN', 'No active technician is linked to this sign-in.', null, 403)
  if (!fieldInvoiceGranted(tech, actor)) fail('FORBIDDEN', 'The owner has not enabled invoice preparation and presentation for you.', null, 403)
  const visit = find(s, 'visits', visitId), job = find(s, 'jobs', visit.jobId)
  if (visit.technicianId !== tech.id || visit.status === 'cancelled' || job.erasedAt || find(s, 'customers', job.customerId).erasedAt || find(s, 'sites', job.siteId).erasedAt) fail('FORBIDDEN', 'Field invoices require your current assignment to this customer job.', null, 403)
  return { tech, visit, job }
}

export function configureFieldInvoices(c: Context, p: any) {
  if (c.actor.role !== 'owner' || c.actor.branch || c.actor.token || c.actor.custom) fail('FORBIDDEN', 'Only the signed-in Owner without branch limits changes field invoice permission.', null, 403)
  const tech = find(c.s, 'technicians', p.technicianId)
  expectVersion(tech, p.version)
  if (typeof p.enabled !== 'boolean') fail('INPUT', 'enabled is true or false.', null, 400)
  if (p.enabled && (!tech.operatorId || tech.active === false)) fail('INPUT', 'Link an active technician to their sign-in before enabling field invoices.', null, 400)
  const fieldInvoicing = { enabled: p.enabled, operatorId: tech.operatorId, grantId: p.enabled ? newId() : null, by: c.actor.id, at: c.now }
  if (tech.operatorId) {
    const path = fieldInvoiceCustodyPath(tech.operatorId)
    c.sql.push(p.enabled
      ? { sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('field-invoices',json_set('{}',?,?),?,?) ON CONFLICT(provider) DO UPDATE SET value=json_set(glove_provider_keys.value,?,?),set_by=excluded.set_by,set_at=excluded.set_at", params: [path, fieldInvoicing.grantId, c.actor.id, c.now, path, fieldInvoicing.grantId] }
      : { sql: "UPDATE glove_provider_keys SET value=json_remove(value,?),set_by=?,set_at=? WHERE provider='field-invoices'", params: [path, c.actor.id, c.now] })
  }
  const row = bump(c.s, 'technicians', tech, { fieldInvoicing })
  event(c, { jobId: null, subjectKind: 'technician', subjectId: tech.id, kind: 'invoice.fieldConfigured', summary: `${tech.name}: invoice draft preparation and approved invoice presentation on this phone ${p.enabled ? 'allowed' : 'withdrawn'} by the Owner`, data: fieldInvoicing })
  return { id: row.id, version: row.version, fieldInvoicing }
}

/** Only customer-facing fields of an exact approved revision travel to the
 * permitted technician's offline day. No drafts, costs, credentials or balances. */
export function fieldInvoiceProjection(s: State, actor: Actor, jobs: Row[]) {
  const tech = s.technicians.find(t => t.operatorId === actor.id && t.active !== false)
  if (!tech || !fieldInvoiceGranted(tech, actor)) return []
  const allowed = new Set(s.visits.filter(v => v.technicianId === tech.id && v.status !== 'cancelled').map(v => v.jobId))
  return s.invoices.flatMap(invoice => {
    if (invoice.erasedAt || !allowed.has(invoice.jobId) || !jobs.some(j => j.id === invoice.jobId && !j.erasedAt)) return []
    const rev = invoice.revisions.findLast((r: Row) => r.approval)
    if (!rev) return []
    const { subtotal, gst, total, currency, taxBreakdown, discount } = rev.totals
    return [{ id: invoice.id, version: invoice.version, number: invoice.number, jobId: invoice.jobId, customerId: invoice.customerId, status: 'approved', dates: invoice.dates, poNumber: invoice.poNumber ?? '', ...(invoice.progress ? { progress: { name: invoice.progress.name, final: invoice.progress.final, sequence: invoice.progress.sequence } } : {}), revisions: [{ n: rev.n, approval: { name: rev.approval.name, at: rev.approval.at }, lines: rev.lines.map(({ description, customerDescription, quantity, unitPrice, tax, total }: Row) => ({ description, customerDescription, quantity, unitPrice, tax, total })), totals: { subtotal, gst, total, currency, taxBreakdown, discount } }] }]
  })
}
