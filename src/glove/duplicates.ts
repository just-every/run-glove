import type { Row, State } from './model'

// CUST-005: customers that share a phone number, an email or a normalized
// address (billing or any site) are possible duplicates of each other.

const phone = (v: unknown) => { const d = String(v ?? '').replace(/\D/g, ''); return d.length >= 7 ? d.slice(-10) : '' }
const email = (v: unknown) => String(v ?? '').trim().toLowerCase()
/** "14 Harbour St., Balmain" and "14 harbour st balmain" are one address. */
export const address = (v: unknown) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function keys(s: State, c: Row) {
  const others: Row[] = c.contacts ?? [], sites = s.sites.filter(x => x.customerId === c.id)
  return [
    ...[c.phone, ...others.map(x => x.phone)].map(phone).filter(Boolean).map(k => `phone:${k}`),
    ...[c.email, c.apEmail, ...others.map(x => x.email)].map(email).filter(Boolean).map(k => `email:${k}`),
    ...[c.billingAddress, ...sites.map(x => x.address)].map(address).filter(Boolean).map(k => `address:${k}`),
  ]
}

/** Live customers sharing a phone, email or address with this one, with what they share. */
export function duplicatesOf(s: State, customer: Row) {
  const mine = new Set(keys(s, customer))
  return s.customers.filter(c => c.id !== customer.id && !c.mergedInto).map(c => ({ id: c.id, name: c.name, matches: [...new Set(keys(s, c).filter(k => mine.has(k)).map(k => k.split(':')[0]))] })).filter(d => d.matches.length)
}

export const holders = ['sites', 'enquiries', 'quotes', 'jobs', 'invoices'] as const

/** The merge review: what each record holds and what would move to the survivor. */
export function mergeReview(s: State, customer: Row) {
  const group = [customer, ...duplicatesOf(s, customer).map(d => s.customers.find(c => c.id === d.id)!)]
  return {
    candidates: duplicatesOf(s, customer),
    records: group.map(c => ({ customer: c, holds: Object.fromEntries(holders.map(kind => [kind, s[kind].filter(r => r.customerId === c.id).length])) })),
  }
}
