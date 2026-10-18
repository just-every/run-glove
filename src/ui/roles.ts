// Which controls to offer each role. The server decides (src/glove/access.ts);
// this only avoids showing a person buttons that would be refused.
const allowed: Record<string, string[]> = {
  owner: ['*'],
  dispatcher: ['customer.save', 'site.save', 'enquiry.create', 'enquiry.contact', 'enquiry.close', 'quote.draft', 'quote.revise', 'quote.approve', 'quote.markSent', 'quote.accept', 'quote.decline', 'job.create', 'visit.book', 'visit.change', 'visit.cancel', 'visit.reviewLateEvidence', 'proposal.prepare', 'proposal.approve', 'proposal.decline'],
  office: ['customer.save', 'site.save', 'enquiry.create', 'enquiry.contact', 'enquiry.close', 'quote.markSent', 'invoice.prepare', 'invoice.revise', 'invoice.approve', 'invoice.export', 'invoice.correct'],
  agent: ['enquiry.create', 'quote.draft', 'quote.revise', 'proposal.prepare', 'invoice.prepare', 'invoice.revise'],
  technician: ['visit.arrive', 'visit.capture', 'visit.complete'],
  viewer: [],
}
const fieldOnly = new Set(['visit.arrive', 'visit.capture', 'visit.complete'])
export const can = (role: string, type: string) => (allowed[role] ?? []).includes(type) || (role === 'owner' && !fieldOnly.has(type))
