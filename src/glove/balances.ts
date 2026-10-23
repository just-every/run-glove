import { invoicePaid } from './payments'
import { cents, dollars } from './money'
import type { Row, State } from './model'

export function invoiceBalance(s: State, inv: Row) {
  const rev = [...inv.revisions].reverse().find((r: Row) => r.approval)
  const gross = inv.openingBalance?.amount ?? rev?.totals.total
  return gross === undefined ? null : cents(gross, 'total') - invoicePaid(s, inv.id)
}
export function balances(s: State) {
  const invoices = s.invoices.filter(i => !i.erasedAt).flatMap(i => {
    const net = invoiceBalance(s, i)
    if (net === null) return []
    return [{ id: i.id, number: i.number, customerId: i.customerId, currency: i.revisions.at(-1).totals.currency ?? s.business[0]?.currency, netCents: net, due: dollars(Math.max(0, net)), credit: dollars(Math.max(0, -net)), href: `#invoices/${i.id}` }]
  })
  const customers = [...new Set(invoices.map(i => JSON.stringify([i.customerId, i.currency])))].map(key => {
    const list = invoices.filter(i => JSON.stringify([i.customerId, i.currency]) === key)
    const due = list.reduce((n, i) => n + Math.max(0, i.netCents), 0), credit = list.reduce((n, i) => n + Math.max(0, -i.netCents), 0)
    return { customerId: list[0].customerId, currency: list[0].currency, due: dollars(due), credit: dollars(credit), balance: dollars(due - credit), invoices: list }
  })
  return { invoices, customers }
}
