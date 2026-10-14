import { fail, text, oneOf, find, expectVersion, put, bump, event, newId, nextNumber, type Context, type Row } from '../model'
import { lines, totals } from '../money'
import type { Handler } from './types'

// Enquiry → quote revisions → a person approves the exact price → the quote is
// recorded as sent (never claimed as delivered) → the customer's acceptance is
// recorded with how it was given. A changed price is a new revision that needs
// its own approval; an accepted quote is frozen.

const who = (c: Context) => ({ id: c.actor.id, name: c.actor.name, role: c.actor.role })

/** Record a person's decision on agent- or person-prepared work, with the exact version decided. */
export function approval(c: Context, subjectKind: string, subject: Row, label: string, revision: number, preparedBy: unknown, decision: 'approved' | 'declined', note = '') {
  return put(c.s, 'approvals', { id: newId(), version: 1, createdAt: c.now, subjectKind, subjectId: subject.id, subjectLabel: label, revision, preparedBy, approvedBy: who(c), decision, note })
}

/** An agent never decides its own preparation, even after its sign-in is given a person's role. */
export function selfApproval(c: Context, preparedBy: { id: string; role: string }) {
  if (preparedBy.role === 'agent' && preparedBy.id === c.actor.id) fail('SELF_APPROVAL', 'Someone other than the agent that prepared this approves it.')
}

function revision(c: Context, p: any, n: number) {
  const priced = lines(p.lines)
  return { n, lines: priced, totals: totals(priced), notes: text(p.notes, 'notes', { optional: true, max: 4000 }), preparedBy: who(c), preparedAt: c.now, approval: null as null | Record<string, unknown> }
}

const current = (q: Row) => q.revisions[q.revisions.length - 1]

function open(c: Context, p: any) {
  const quote = find(c.s, 'quotes', p.quoteId)
  expectVersion(quote, p.version)
  return quote
}

export const quotes: Handler = async (c, type, p) => {
  switch (type) {
    case 'enquiry.create': {
      const customer = find(c.s, 'customers', p.customerId), site = p.siteId ? find(c.s, 'sites', p.siteId) : null
      if (site && site.customerId !== customer.id) fail('SITE', 'That site belongs to another customer.')
      const row = put(c.s, 'enquiries', { id: newId(), version: 1, createdAt: c.now, createdBy: who(c), customerId: customer.id, siteId: site?.id ?? null, description: text(p.description, 'description', { max: 4000 }), channel: text(p.channel, 'channel', { optional: true, max: 50 }) || 'phone', status: 'open' })
      event(c, { jobId: null, subjectKind: 'enquiry', subjectId: row.id, kind: 'enquiry.created', summary: `Enquiry from ${customer.name}: ${row.description.slice(0, 80)}`, data: null })
      return row
    }
    case 'enquiry.close': {
      const row = find(c.s, 'enquiries', p.enquiryId)
      expectVersion(row, p.version)
      const closed = bump(c.s, 'enquiries', row, { status: 'closed', closedReason: text(p.reason, 'reason', { max: 500 }), closedAt: c.now })
      event(c, { jobId: null, subjectKind: 'enquiry', subjectId: row.id, kind: 'enquiry.closed', summary: `Enquiry closed: ${closed.closedReason}`, data: null })
      return closed
    }
    case 'quote.draft': {
      const enquiry = p.enquiryId ? find(c.s, 'enquiries', p.enquiryId) : null
      const customer = find(c.s, 'customers', p.customerId ?? enquiry?.customerId), site = find(c.s, 'sites', p.siteId ?? enquiry?.siteId, 'sites')
      if (site.customerId !== customer.id) fail('SITE', 'That site belongs to another customer.')
      if (enquiry && enquiry.customerId !== customer.id) fail('ENQUIRY', 'That enquiry belongs to another customer.')
      const row = put(c.s, 'quotes', { id: newId(), version: 1, createdAt: c.now, number: nextNumber(c, 'quote'), customerId: customer.id, siteId: site.id, enquiryId: enquiry?.id ?? null, title: text(p.title, 'title', { max: 200 }), status: 'draft', revisions: [revision(c, p, 1)], sent: [], acceptance: null, jobId: null })
      if (enquiry) bump(c.s, 'enquiries', enquiry, { status: 'quoted', quoteId: row.id })
      event(c, { jobId: null, subjectKind: 'quote', subjectId: row.id, kind: 'quote.drafted', summary: `${row.number} drafted by ${c.actor.name} (${c.actor.role}): $${current(row).totals.total} inc GST`, data: { revision: 1 } })
      return row
    }
    case 'quote.revise': {
      const quote = open(c, p)
      if (['accepted', 'declined'].includes(quote.status)) fail('QUOTE_CLOSED', `This quote is ${quote.status}; start a new quote instead.`)
      const next = revision(c, p, quote.revisions.length + 1)
      const row = bump(c.s, 'quotes', quote, { status: 'draft', title: p.title ? text(p.title, 'title', { max: 200 }) : quote.title, revisions: [...quote.revisions, next] })
      event(c, { jobId: null, subjectKind: 'quote', subjectId: row.id, kind: 'quote.revised', summary: `${row.number} revision ${next.n} by ${c.actor.name}: $${next.totals.total} inc GST (needs approval)`, data: { revision: next.n } })
      return row
    }
    case 'quote.approve': {
      const quote = open(c, p), rev = current(quote)
      if (p.revision !== rev.n) fail('REVISION', `Approve the current revision (${rev.n}).`, { current: rev.n })
      if (quote.status !== 'draft') fail('QUOTE_STATE', `This quote is already ${quote.status}.`)
      selfApproval(c, rev.preparedBy)
      const approved = { ...rev, approval: { ...who(c), at: c.now } }
      const row = bump(c.s, 'quotes', quote, { status: 'approved', revisions: [...quote.revisions.slice(0, -1), approved] })
      approval(c, 'quote', row, `${row.number} revision ${rev.n} · $${rev.totals.total} inc GST`, rev.n, rev.preparedBy, 'approved')
      event(c, { jobId: null, subjectKind: 'quote', subjectId: row.id, kind: 'quote.approved', summary: `${row.number} revision ${rev.n} price approved by ${c.actor.name}${rev.preparedBy.role === 'agent' ? ` (prepared by agent ${rev.preparedBy.name})` : ''}`, data: { revision: rev.n, total: rev.totals.total } })
      return row
    }
    case 'quote.markSent': {
      const quote = open(c, p), rev = current(quote)
      if (!rev.approval) fail('NOT_APPROVED', 'A person approves this revision\'s price before it goes to the customer.')
      if (!['approved', 'sent'].includes(quote.status)) fail('QUOTE_STATE', `This quote is ${quote.status}.`)
      const channel = oneOf(p.channel, ['email', 'printed', 'in person', 'phone'] as const, 'channel')
      const sent = { revision: rev.n, channel, note: text(p.note, 'note', { optional: true, max: 500 }), recordedBy: who(c), at: c.now }
      const row = bump(c.s, 'quotes', quote, { status: 'sent', sent: [...quote.sent, sent] })
      event(c, { jobId: null, subjectKind: 'quote', subjectId: row.id, kind: 'quote.sent', summary: `${row.number} revision ${rev.n} recorded as sent by ${channel} (by ${c.actor.name}; delivery is not confirmed)`, data: sent })
      return row
    }
    case 'quote.accept':
    case 'quote.decline': {
      const quote = open(c, p), rev = current(quote)
      if (p.revision !== rev.n) fail('REVISION', `The customer answers the current revision (${rev.n}).`, { current: rev.n })
      if (!rev.approval) fail('NOT_APPROVED', 'Only an approved price can be accepted.')
      if (!['approved', 'sent'].includes(quote.status)) fail('QUOTE_STATE', `This quote is ${quote.status}.`)
      const answer = { revision: rev.n, method: oneOf(p.method, ['signed', 'email reply', 'phone', 'in person'] as const, 'method'), customerName: text(p.customerName, 'customerName', { max: 200 }), note: text(p.note, 'note', { optional: true, max: 1000 }), recordedBy: who(c), at: c.now }
      const accepted = type === 'quote.accept'
      const row = bump(c.s, 'quotes', quote, { status: accepted ? 'accepted' : 'declined', acceptance: accepted ? answer : null, declined: accepted ? null : answer })
      event(c, { jobId: null, subjectKind: 'quote', subjectId: row.id, kind: accepted ? 'quote.accepted' : 'quote.declined', summary: `${row.number} revision ${rev.n} ${accepted ? 'accepted' : 'declined'} by ${answer.customerName} (${answer.method}), recorded by ${c.actor.name}`, data: answer })
      return row
    }
  }
}
