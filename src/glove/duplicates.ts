import type { Row, State } from './model'

// CUST-005: customers that share a phone number, an email or a normalized
// address (billing or any site) are possible duplicates of each other.

const phone = (v: unknown) => { const d = String(v ?? '').replace(/\D/g, ''); return d.length >= 7 ? d.slice(-10) : '' }
const email = (v: unknown) => String(v ?? '').trim().toLowerCase()
/** "14 Harbour St., Balmain" and "14 harbour st balmain" are one address. */
export const address = (v: unknown) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** The phone, email and address keys of a customer and the given site addresses. */
function keysOf(c: Row, siteAddresses: unknown[]) {
  const others: Row[] = c.contacts ?? []
  return [
    ...[c.phone, ...others.map(x => x.phone)].map(phone).filter(Boolean).map(k => `phone:${k}`),
    ...[c.email, c.apEmail, ...others.map(x => x.email)].map(email).filter(Boolean).map(k => `email:${k}`),
    ...[c.billingAddress, ...siteAddresses].map(address).filter(Boolean).map(k => `address:${k}`),
  ]
}
const keys = (s: State, c: Row) => keysOf(c, s.sites.filter(x => x.customerId === c.id).map(x => x.address))

/**
 * CUST-005 on CSV import: for each incoming customer, the live Glove customers and
 * the other incoming customers sharing a phone, email or address, from one index.
 */
export function batchDuplicates(s: State, incoming: { customer: Row; addresses: string[] }[]) {
  const index = new Map<string, { id: string; name: string; incoming: boolean }[]>()
  const add = (k: string, who: { id: string; name: string; incoming: boolean }) => (index.get(k) ?? index.set(k, []).get(k)!).push(who)
  const sitesOf = new Map<string, string[]>()
  for (const x of s.sites) (sitesOf.get(x.customerId) ?? sitesOf.set(x.customerId, []).get(x.customerId)!).push(x.address)
  for (const c of s.customers) if (!c.mergedInto) for (const k of new Set(keysOf(c, sitesOf.get(c.id) ?? []))) add(k, { id: c.id, name: c.name, incoming: false })
  const mine = incoming.map(x => new Set(keysOf(x.customer, x.addresses)))
  incoming.forEach((x, i) => { for (const k of mine[i]) add(k, { id: x.customer.id, name: x.customer.name, incoming: true }) })
  return incoming.map((x, i) => {
    const found = new Map<string, { id: string; name: string; incoming: boolean; matches: Set<string> }>()
    for (const k of mine[i]) for (const o of index.get(k)!) if (o.id !== x.customer.id) (found.get(o.id) ?? found.set(o.id, { ...o, matches: new Set() }).get(o.id)!).matches.add(k.split(':')[0])
    return [...found.values()].map(d => ({ ...d, matches: [...d.matches] }))
  })
}

/** Live customers sharing a phone, email or address with this one, with what they share. */
export function duplicatesOf(s: State, customer: Row) {
  const mine = new Set(keys(s, customer))
  return s.customers.filter(c => c.id !== customer.id && !c.mergedInto).map(c => ({ id: c.id, name: c.name, matches: [...new Set(keys(s, c).filter(k => mine.has(k)).map(k => k.split(':')[0]))] })).filter(d => d.matches.length)
}

export const holders = ['sites', 'enquiries', 'quotes', 'jobs', 'invoices', 'payments'] as const

/** The merge review: what each record holds and what would move to the survivor. */
export function mergeReview(s: State, customer: Row) {
  const group = [customer, ...duplicatesOf(s, customer).map(d => s.customers.find(c => c.id === d.id)!)]
  return {
    candidates: duplicatesOf(s, customer),
    records: group.map(c => ({ customer: c, holds: Object.fromEntries(holders.map(kind => [kind, s[kind].filter(r => r.customerId === c.id).length])) })),
  }
}
