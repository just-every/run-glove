import { invoicePaid } from './payments'
import { branchZone } from './branches'
import { calendarDate, invoiceDates } from './receivables'
import { cents, signedCents, dollars } from './money'
import { find, type Row, type State } from './model'
import { localParts } from './time'
import { formatCsv } from './csv-format'

/** A statement is an inspection of approved balances, never a payment credential. */
export function customerStatement(s: State, customerId: string, asOf: string) {
  calendarDate(asOf)
  const customer = find(s, 'customers', customerId)
  const invoices = s.invoices.filter(i => i.customerId === customer.id && !i.erasedAt).flatMap(inv => {
    const dates = invoiceDates(s, inv)
    const approved = inv.revisions.filter((r: Row) => r.approval && localParts(r.approval.at, branchZone(s, inv)).date <= asOf).at(-1)
    const opening = inv.openingBalance && inv.openingBalance.asOf <= asOf ? inv.openingBalance : null
    if (!dates || (!opening && !approved)) return []
    const rev = opening ? inv.revisions[0] : approved
    const total = cents(opening?.amount ?? rev.totals.total, 'total'), paid = invoicePaid(s, inv.id, asOf), net = total - paid
    return [{ id: inv.id, number: inv.number, revision: rev.n, currency: rev.totals.currency ?? s.business[0]?.currency ?? 'USD', issuedOn: dates.issuedOn, dueOn: dates.dueOn, basis: dates.basis, total: dollars(total), paid: dollars(paid), due: dollars(Math.max(0, net)), credit: dollars(Math.max(0, -net)), balance: dollars(net), openingBalance: !!opening, href: `#invoices/${inv.id}` }]
  }).sort((a, b) => a.issuedOn.localeCompare(b.issuedOn) || a.number.localeCompare(b.number))
  const totals = [...new Set(invoices.map(i => i.currency))].sort().map(currency => {
    const rows = invoices.filter(i => i.currency === currency)
    const sum = (key: 'total' | 'paid' | 'due' | 'credit' | 'balance') => dollars(rows.reduce((n, r) => n + signedCents(r[key], key), 0))
    return { currency, total: sum('total'), paid: sum('paid'), due: sum('due'), credit: sum('credit'), balance: sum('balance') }
  })
  return { asOf, customer: { id: customer.id, name: customer.name, billingContact: customer.billingContact ?? customer.contact ?? '', billingAddress: customer.billingAddress ?? '', email: customer.apEmail || customer.email || '' }, basis: 'Approved invoices and retained opening balances through this date, less confirmed payment effects through each record’s branch-local date. Pending, failed and returned payments do not reduce balances. Tips and processing fees are excluded. Credits remain separate until explicitly allocated. No payment link or charge authority is issued.', invoices, totals }
}
export function statementCsv(statement: ReturnType<typeof customerStatement>) {
  return formatCsv([['Customer', 'As of', 'Currency', 'Invoice', 'Revision', 'Issued', 'Due', 'Total', 'Confirmed net payments', 'Amount due', 'Credit', 'Balance', 'Basis'], ...statement.invoices.map(i => [statement.customer.name, statement.asOf, i.currency, i.number, String(i.revision), i.issuedOn, i.dueOn, i.total, i.paid, i.due, i.credit, i.balance, i.basis])])
}
