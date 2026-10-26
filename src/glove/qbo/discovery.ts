import { canonicalJson, sha256 } from '../../modules/import-kit/src/d1/index'
import { business, event, fail, type Context, type Row } from '../model'
import { qboRequest, type QboConnection } from './client'

const normalized = (value: unknown) => typeof value === 'string' ? value.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ') : ''
const phone = (value: unknown) => typeof value === 'string' ? value.replace(/\D/g, '') : ''
const active = (row: any) => row.Active !== false
const validId = (value: unknown) => typeof value === 'string' && /^\d{1,30}$/.test(value)

/** Read every page or refuse the review; a partial company is never an empty match. */
async function readCompany(connection: QboConnection, key: string, entity: string) {
  const rows: any[] = [], ids = new Set<string>(), size = 1000
  for (let start = 1; start <= 100_000; start += size) {
    const query = `SELECT * FROM ${entity}${entity === 'Invoice' ? '' : ' WHERE Active IN (true, false)'} STARTPOSITION ${start} MAXRESULTS ${size}`
    const response = await qboRequest(connection, key, `query?query=${encodeURIComponent(query)}`)
    if (!response.QueryResponse || typeof response.QueryResponse !== 'object' || Array.isArray(response.QueryResponse)) fail('QBO_DISCOVERY', 'QuickBooks returned no company query result; no review was prepared.')
    const page = response.QueryResponse[entity] ?? []
    if (!Array.isArray(page) || page.length > size) fail('QBO_DISCOVERY', 'QuickBooks returned an invalid company page; no review was prepared.')
    for (const row of page) {
      if (!validId(row?.Id) || ids.has(row.Id)) fail('QBO_DISCOVERY', 'QuickBooks returned a repeated or invalid record identity; no review was prepared.')
      ids.add(row.Id); rows.push(row)
    }
    if (page.length < size) return rows
  }
  return fail('QBO_DISCOVERY', 'This company exceeds the review read bound; no partial match plan was prepared.')
}

type Proposal = { kind: string; id: string; rule: string | null; group: 'matched' | 'ambiguous' | 'unmatched'; candidates: string[]; nameClashes: string[] }

/** Discovery is a read-only proposal. Existing map and confirmation doors still verify each link. */
export async function discover(c: Context, key: string) {
  const connection = business(c.s).qbo
  const [customers, items, invoices] = await Promise.all(['Customer', 'Item', 'Invoice'].map(entity => readCompany(connection, key, entity)))
  const proposals: Proposal[] = []
  const customerProposals = new Map<string, Proposal>()
  const propose = (kind: string, row: Row, candidates: any[], rule: string | null, clashes: any[]) => {
    const result: Proposal = { kind, id: row.id, rule, group: candidates.length > 1 ? 'ambiguous' : candidates.length ? 'matched' : 'unmatched', candidates: candidates.map(r => r.Id), nameClashes: clashes.map(r => r.Id) }
    proposals.push(result); return result
  }
  for (const row of c.s.customers.filter(r => !r.erasedAt && !r.mergedInto)) {
    const pool = customers.filter(r => active(r) && !r.Job)
    const existing = row.qbo?.connectionId === connection.connectionId ? pool.filter(r => r.Id === row.qbo.remoteId) : []
    const matches = pool.filter(r => normalized(r.DisplayName) === normalized(row.name) && (normalized(row.email) && normalized(r.PrimaryEmailAddr?.Address) === normalized(row.email) || phone(row.phone) && phone(r.PrimaryPhone?.FreeFormNumber) === phone(row.phone)))
    const candidates = existing.length ? existing : matches
    customerProposals.set(row.id, propose('customer', row, candidates, existing.length ? 'verified-company-link' : matches.length ? 'name-and-contact' : null, customers.filter(r => normalized(r.DisplayName) === normalized(row.name) && !candidates.includes(r))))
  }
  for (const row of c.s.services.filter(r => !r.archived)) {
    const pool = items.filter(r => active(r) && ['Service', 'NonInventory', 'Inventory'].includes(r.Type) && r.IncomeAccountRef?.value)
    const sku = pool.filter(r => normalized(r.Sku) && normalized(r.Sku) === normalized(row.code))
    const name = pool.filter(r => normalized(r.Name) === normalized(row.name))
    const existing = row.qbo?.connectionId === connection.connectionId ? pool.filter(r => r.Id === row.qbo.remoteId) : []
    const candidates = existing.length ? existing : sku.length ? sku : name
    propose('service', row, candidates, existing.length ? 'verified-company-link' : sku.length ? 'sku' : name.length ? 'name' : null, items.filter(r => normalized(r.Name) === normalized(row.name) && !candidates.includes(r)))
  }
  for (const proposal of proposals) if (proposal.group === 'matched' && proposals.some(other => other !== proposal && other.kind === proposal.kind && other.candidates.includes(proposal.candidates[0]))) proposal.group = 'ambiguous'
  for (const row of c.s.invoices.filter(r => !r.erasedAt)) {
    const parent = customerProposals.get(row.customerId), job = c.s.jobs.find(j => j.id === row.jobId), site = c.s.sites.find(s => s.id === job?.siteId)
    const refs = site?.qbo?.connectionId === connection.connectionId ? [site!.qbo.remoteId] : parent?.group === 'matched' ? parent.candidates : []
    // Source total is the original invoice, not its remaining opening balance.
    const total = row.openingBalance?.sourceTotal ?? row.revisions?.findLast((r: Row) => r.approval)?.totals.total
    const matches = invoices.filter(r => r.DocNumber === (row.importedInvoiceNumber ?? row.number) && refs.includes(r.CustomerRef?.value) && Number.isFinite(Number(total)) && Number(r.TotalAmt) === Number(total) && (r.CurrencyRef?.value ?? 'USD') === 'USD')
    propose('invoice', row, matches, matches.length ? 'number-customer-total' : null, invoices.filter(r => r.DocNumber === (row.importedInvoiceNumber ?? row.number) && !matches.includes(r)))
  }
  // A unique local match is still ambiguous if another local record claims the same remote identity.
  for (const proposal of proposals) if (proposal.group === 'matched' && proposals.some(other => other !== proposal && other.kind === proposal.kind && other.candidates.includes(proposal.candidates[0]))) proposal.group = 'ambiguous'
  const used = (kind: string) => new Set(proposals.filter(r => r.kind === kind).flatMap(r => r.candidates))
  const untouched = { customers: customers.filter(r => !used('customer').has(r.Id)).map(r => ({ id: r.Id, name: r.DisplayName ?? '', subCustomer: r.Job === true, active: active(r) })), items: items.filter(r => !used('service').has(r.Id)).map(r => ({ id: r.Id, name: r.Name ?? '', active: active(r) })), invoices: invoices.filter(r => !used('invoice').has(r.Id)).map(r => ({ id: r.Id, number: r.DocNumber ?? '' })) }
  const fingerprint = sha256(canonicalJson({ connectionId: connection.connectionId, customers, items, invoices, local: ['customers', 'services', 'invoices'].map(kind => c.s[kind as 'customers'].map(r => [r.id, r.version])), proposals }))
  const references = proposals.map(({ kind, id, rule, group, candidates, nameClashes }) => ({ kind, id, rule, group, candidates, nameClashes }))
  event(c, { jobId: null, subjectKind: 'business', subjectId: business(c.s).id, kind: 'qbo.discovered', summary: 'Owner read QuickBooks company and prepared link proposals; no provider writes', data: { connectionId: connection.connectionId, fingerprint, counts: { customers: customers.length, items: items.length, invoices: invoices.length }, proposals: references, untouched: { customers: untouched.customers.map(r => r.id), items: untouched.items.map(r => r.id), invoices: untouched.invoices.map(r => r.id) } } })
  // Provider names are transient review data, not a second personal-data store in business settings.
  const choices = {
    customer: customers.map(r => ({ id: r.Id, name: r.DisplayName ?? '', email: r.PrimaryEmailAddr?.Address ?? '', phone: r.PrimaryPhone?.FreeFormNumber ?? '', subCustomer: r.Job === true, active: active(r) })),
    service: items.map(r => ({ id: r.Id, name: r.Name ?? '', sku: r.Sku ?? '', active: active(r) })),
    invoice: invoices.map(r => ({ id: r.Id, number: r.DocNumber ?? '', customerId: r.CustomerRef?.value ?? '', total: r.TotalAmt })),
  }
  c.reveal = { review: JSON.stringify({ connectionId: connection.connectionId, fingerprint, proposals, untouched, choices }) }
  return { connectionId: connection.connectionId, fingerprint, counts: { matched: proposals.filter(p => p.group === 'matched').length, ambiguous: proposals.filter(p => p.group === 'ambiguous').length, unmatched: proposals.filter(p => p.group === 'unmatched').length } }
}
