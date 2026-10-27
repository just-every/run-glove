import { allow } from './access'
import { recordBranch } from './branch-access'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { event, fail, newId, put, type Actor, type Row, type State } from './model'
import { partsCheck } from './stock'
import { thousandths, quantity } from './money'
import type { Handler } from './commands/types'

// Internal evidence only. Neither a site note nor an order sent to a supplier
// establishes customer access, receipt, or complete visit readiness.
export function readinessAuthority(s: State, actor: Actor) {
  allow(actor, 'readiness.prepare')
  if (actor.token || actor.custom) fail('FORBIDDEN', 'A signed-in desk person or Agent must inspect readiness.', null, 403)
  if (actor.role === 'agent' && s.business[0]?.agentsPaused) fail('PAUSED', 'The owner has paused every agent.', null, 403)
}

function receiptEvidence(s: State, po: Row) {
  return (po.receipts ?? []).filter((r: Row) => {
    if (!r.at || !r.by?.id || !r.lines?.length) return false
    const required = new Map<string, number>()
    for (const line of r.lines) {
      const ordered = po.lines.find((l: Row) => l.id === line.lineId)
      if (!ordered) return false
      required.set(ordered.serviceId, (required.get(ordered.serviceId) ?? 0) + thousandths(line.quantity, 'receipt quantity'))
    }
    return [...required].every(([serviceId, amount]) => s.stockMoves.filter(m => m.kind === 'receive' && m.poId === po.id && m.receiptId === r.id && m.locationId === po.locationId && m.serviceId === serviceId)
      .reduce((n, m) => n + thousandths(m.delta, 'received stock'), 0) === amount)
  }).map((r: Row) => ({ id: r.id, at: r.at, by: r.by, lines: r.lines })) as Row[]
}

export function readinessBoard(s: State, date: string, branchId?: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) fail('INPUT', 'Choose a valid readiness date.', null, 400)
  const visits = s.visits.filter(v => v.local?.date === date && v.status === 'booked' && (branchId === undefined || (recordBranch(s, v) ?? 'main') === branchId))
    .filter(v => s.jobs.some(j => j.id === v.jobId && !j.erasedAt))
    .sort((a, b) => a.startAt.localeCompare(b.startAt) || a.id.localeCompare(b.id))
  const checks = new Map([...new Set(visits.map(v => v.technicianId))].map(id => [id, partsCheck(s, id, date)]))
  const rows = visits.map(v => {
    const job = s.jobs.find(j => j.id === v.jobId)!, site = s.sites.find(x => x.id === job.siteId)
    const check = checks.get(v.technicianId)!, parts = check.jobs.find(j => j.jobId === job.id)?.parts ?? []
    const orders = s.purchaseOrders.filter(po => po.jobId === job.id).map(po => {
      const receipts = receiptEvidence(s, po)
      return {
        id: po.id, version: po.version, number: po.number, locationId: po.locationId,
        status: po.status, receipts,
        lines: po.lines.map((l: Row) => {
          const received = receipts.flatMap(r => r.lines).filter(r => r.lineId === l.id).reduce((n, r) => n + thousandths(r.quantity, 'receipt quantity'), 0)
          return { id: l.id, serviceId: l.serviceId, ordered: l.quantity, received: quantity(received), outstanding: received < thousandths(l.quantity, 'quantity') }
        }),
      }
    })
    const evidence = { visitId: v.id, visitVersion: v.version, jobId: job.id, jobVersion: job.version, siteId: site?.id ?? null, siteVersion: site?.version ?? null, technicianId: v.technicianId, date, start: v.local.start,
      van: check.van, parts, orders, access: 'unknown', overall: 'unconfirmed' }
    const fingerprint = sha256(canonicalJson(evidence))
    const prepared = s.readiness.find(r => r.visitId === v.id)
    return { ...evidence, fingerprint, number: job.number, title: job.title,
      partsStatus: parts.some(p => !p.onBoard) ? 'missing parts' : parts.length ? 'allocated on van' : 'no listed parts',
      orderStatus: orders.some(o => o.lines.some((l: Row) => l.outstanding)) ? 'unreceived order' : orders.length ? 'received in full' : 'no job order',
      preparation: !prepared ? 'not prepared' : prepared.fingerprint === fingerprint ? 'current' : 'stale',
      preparedBy: prepared?.preparedBy ?? null, preparedAt: prepared?.preparedAt ?? null }
  })
  const proposals = [
    { kind: 'parts', title: 'Allocate missing parts', sources: rows.filter(r => r.partsStatus === 'missing parts').map(r => ({ visitId: r.visitId, jobId: r.jobId, stockId: r.van?.id ?? null, serviceIds: r.parts.filter(p => !p.onBoard).map(p => p.serviceId) })) },
    { kind: 'receipt', title: 'Verify outstanding receipts', sources: rows.filter(r => r.orderStatus === 'unreceived order').map(r => ({ visitId: r.visitId, jobId: r.jobId, orderIds: r.orders.filter(o => o.lines.some((l: Row) => l.outstanding)).map(o => o.id) })) },
    { kind: 'access', title: 'Verify customer access', sources: rows.map(r => ({ visitId: r.visitId, jobId: r.jobId, siteId: r.siteId })) },
  ].filter(p => p.sources.length)
  return { date, rows, proposals, fingerprint: sha256(canonicalJson(rows.map(r => [r.visitId, r.fingerprint]))), advisory: 'Internal proposals only. Access, permits, deposits and equipment history are unverified; overall readiness is unconfirmed. This inspection sends no customer request.' }
}

export const readiness: Handler = async (c, type, p) => {
  if (type !== 'readiness.prepare') return undefined
  readinessAuthority(c.s, c.actor)
  const board = readinessBoard(c.s, p.date, p.branchId)
  if (!board.rows.length) fail('NOT_FOUND', 'There are no scheduled visits in this readiness scope.', null, 404)
  if (p.fingerprint !== board.fingerprint) fail('STALE', 'Readiness evidence changed. Refresh the board before preparing proposals.')
  const reviews = board.rows.map(r => {
    const previous = c.s.readiness.find(x => x.visitId === r.visitId)
    if (previous?.fingerprint === r.fingerprint) return previous
    const { preparation: _p, preparedBy: _by, preparedAt: _at, ...evidence } = r
    const review = put(c.s, 'readiness', { ...evidence, id: previous?.id ?? newId(), version: (previous?.version ?? 0) + 1,
      proposals: board.proposals.flatMap(p => p.sources.filter(source => source.visitId === r.visitId).map(source => ({ kind: p.kind, title: p.title, source }))),
      preparedAt: c.now, preparedBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role } })
    event(c, { jobId: r.jobId, subjectKind: 'readiness', subjectId: review.id, kind: 'readiness.prepared', summary: 'Internal readiness proposals prepared; no operational action executed', data: { visitId: r.visitId, fingerprint: r.fingerprint, partsStatus: r.partsStatus, orderStatus: r.orderStatus, access: 'unknown', overall: 'unconfirmed' } })
    return review
  })
  if (!c.events.length) event(c, { jobId: reviews[0]?.jobId ?? null, subjectKind: 'readiness', subjectId: reviews[0]?.id ?? 'readiness', kind: 'readiness.reused', summary: 'Unchanged internal readiness preparation reused; no operational action executed', data: { date: board.date } })
  return { reviews }
}
