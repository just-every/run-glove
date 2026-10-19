import { fail, text, oneOf, find, expectVersion, put, bump, event, newId, nextNumber, type Context, type Row } from '../model'
import { cents, dollars, thousandths, quantity } from '../money'
import { quantity0 } from '../stock'
import { move } from './stock'
import type { Handler } from './types'

// Purchase orders to suppliers (STOCK-002). The office raises an order of
// price-book materials at the supplier's unit cost, for stock or for one job,
// delivered to a van or warehouse. Glove sends nothing itself: the person
// records how the order went to the supplier (email, supplier portal, phone or
// in person) with the supplier's reference; emailing it from Glove is COMM-001's.
// Receiving takes one or more parts, each line at most what is still due, into
// the order's location as stock moves; a job's received lines count to that
// job's actual cost at the order's unit cost (costing.ts).

export const methods = ['email', 'portal', 'phone', 'in person'] as const
const lineCost = (unitCost: string, q: number) => Math.floor((cents(unitCost, 'unitCost') * q + 500) / 1000)

function orderLines(c: Context, value: unknown) {
  if (!Array.isArray(value) || !value.length || value.length > 50) return fail('INPUT', 'Add between 1 and 50 lines.', { field: 'lines' }, 400)
  return value.map((x: any, i: number) => {
    const item = find(c.s, 'services', x?.serviceId)
    if (item.kind !== 'material') fail('INPUT', `${item.name} is not a material; purchase orders buy price-book materials.`, { field: `lines[${i}].serviceId` }, 400)
    const q = thousandths(x?.quantity, `lines[${i}].quantity`), unitCost = dollars(cents(x?.unitCost ?? item.unitCost, `lines[${i}].unitCost`))
    return { id: newId(), serviceId: item.id, code: item.code, description: item.name, unit: item.unit, quantity: quantity(q), unitCost, total: dollars(lineCost(unitCost, q)), received: '0' }
  })
}

const due = (l: Row) => thousandths(l.quantity, 'quantity') - thousandths(l.received, 'received', { zero: true })

export const purchasing: Handler = async (c, type, p) => {
  switch (type) {
    case 'po.save': {
      const loc = find(c.s, 'stock', p.locationId)
      if (loc.archived) fail('INPUT', `${loc.name} is archived.`, { field: 'locationId' }, 400)
      const job = p.jobId === undefined || p.jobId === null || p.jobId === '' ? null : find(c.s, 'jobs', p.jobId)
      const lines = orderLines(c, p.lines)
      const fields = { supplier: text(p.supplier, 'supplier', { max: 200 }), supplierEmail: text(p.supplierEmail, 'supplierEmail', { optional: true, max: 200 }), locationId: loc.id, jobId: job?.id ?? null, lines, total: dollars(lines.reduce((n, l) => n + cents(l.total, 'total'), 0)), note: text(p.note, 'note', { optional: true, max: 1000 }) }
      if (p.id === undefined) {
        const po = put(c.s, 'purchaseOrders', { id: newId(), version: 1, createdAt: c.now, number: nextNumber(c, 'po'), status: 'draft', sent: null, receipts: [], by: { id: c.actor.id, name: c.actor.name }, ...fields })
        event(c, { jobId: po.jobId, subjectKind: 'purchaseOrder', subjectId: po.id, kind: 'po.raised', summary: `${c.actor.name} raised ${po.number} to ${po.supplier}${job ? ` for ${job.number}` : ''}: ${lines.map(l => `${l.description} × ${l.quantity}`).join(', ')}`, data: null })
        return po
      }
      const row = find(c.s, 'purchaseOrders', p.id); expectVersion(row, p.version)
      if (row.status !== 'draft') fail('PO_STATE', `${row.number} was already sent; only a draft changes.`)
      const revised = bump(c.s, 'purchaseOrders', row, fields)
      event(c, { jobId: revised.jobId, subjectKind: 'purchaseOrder', subjectId: row.id, kind: 'po.revised', summary: `${c.actor.name} revised purchase order ${row.number}`, data: { version: revised.version } })
      return revised
    }
    case 'po.send': {
      const po = find(c.s, 'purchaseOrders', p.poId); expectVersion(po, p.version)
      if (po.status !== 'draft') fail('PO_STATE', `${po.number} is already ${po.status}.`)
      const method = oneOf(p.method, methods, 'method'), reference = text(p.reference, 'reference', { optional: true, max: 100 })
      const row = bump(c.s, 'purchaseOrders', po, { status: 'sent', sent: { method, reference, by: { id: c.actor.id, name: c.actor.name }, at: c.now } })
      event(c, { jobId: po.jobId, subjectKind: 'purchaseOrder', subjectId: po.id, kind: 'po.sent', summary: `${c.actor.name} recorded ${po.number} as sent to ${po.supplier} by ${method}${reference ? ` (supplier reference ${reference})` : ''}; Glove sent nothing itself`, data: null })
      return row
    }
    case 'po.receive': {
      const po = find(c.s, 'purchaseOrders', p.poId); expectVersion(po, p.version)
      if (!['sent', 'partly received'].includes(po.status)) fail('PO_STATE', po.status === 'draft' ? `Record ${po.number} as sent before receiving it.` : `${po.number} is already received in full.`)
      const loc = find(c.s, 'stock', po.locationId)
      if (loc.archived) fail('INPUT', `${loc.name} is archived.`, { field: 'locationId' }, 400)
      if (!Array.isArray(p.lines) || !p.lines.length) fail('INPUT', 'Receive at least one line.', { field: 'lines' }, 400)
      const got = new Map<string, number>()
      p.lines.forEach((x: any, i: number) => {
        const line = po.lines.find((l: Row) => l.id === x?.lineId) ?? fail('NOT_FOUND', 'Choose a line of this order.', { field: `lines[${i}].lineId` }, 404)
        const q = thousandths(x?.quantity, `lines[${i}].quantity`), total = (got.get(line.id) ?? 0) + q
        if (total > due(line)) fail('OVER', `${line.description}: ${quantity(due(line))} ${line.unit} still due on ${po.number}.`, { lineId: line.id, due: quantity(due(line)) })
        got.set(line.id, total)
      })
      const receiptId = newId()
      for (const [lineId, q] of got) {
        const line = po.lines.find((l: Row) => l.id === lineId)!, item = find(c.s, 'services', line.serviceId)
        move(c, loc, item, q, 'receive', { poId: po.id, receiptId, jobId: po.jobId }, `${c.actor.name} received ${quantity0(q)} ${line.unit} ${line.description} on ${po.number} into ${loc.name}`)
      }
      const lines = po.lines.map((l: Row) => got.has(l.id) ? { ...l, received: quantity(thousandths(l.received, 'received', { zero: true }) + got.get(l.id)!) } : l)
      const status = lines.every((l: Row) => due(l) === 0) ? 'received' : 'partly received'
      const received = bump(c.s, 'purchaseOrders', po, { lines, status, receipts: [...po.receipts, { id: receiptId, at: c.now, by: { id: c.actor.id, name: c.actor.name }, note: text(p.note, 'note', { optional: true, max: 300 }), lines: [...got].map(([lineId, q]) => ({ lineId, quantity: quantity(q) })) }] })
      event(c, { jobId: po.jobId, subjectKind: 'purchaseOrder', subjectId: po.id, kind: 'po.received', summary: `${c.actor.name} received ${got.size} line${got.size === 1 ? '' : 's'} of ${po.number}; ${status}`, data: { receiptId, version: received.version, lineIds: [...got.keys()] } })
      return received
    }
  }
}
