import { useState } from 'react'
import { byId, timeRange, type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'

const drive = (seconds: number) => `${(seconds / 60).toFixed(1)} min`

export function RouteOptimization({ s, run, date, branchId }: { s: Glove; run: Run; date: string; branchId: string }) {
  const [technicianId, setTechnicianId] = useState(''), [reason, setReason] = useState(''), action = useAction()
  if (!['owner', 'dispatcher'].includes(s.actor.role)) return null
  const routes = (s.routes ?? []).filter((r: Rec) => r.date === date && (r.branchId ?? '') === branchId).slice().reverse()
  const current = routes.find((r: Rec) => !['accepted', 'discarded'].includes(r.status)) ?? routes[0]
  const busy = current && ['queued', 'running'].includes(current.status)
  const label = (slot: Rec) => `${byId(s.technicians, slot.technicianId)?.name ?? 'Technician'}, ${timeRange(slot.local.start, slot.local.end)}`
  return <section className="panel" aria-labelledby="route-optimization-title">
    <header><h2 id="route-optimization-title">Route optimization</h2></header>
    <p>Compare appointment order and assignments using driving times. Arrival windows, skills and service areas stay protected.</p>
    <form onSubmit={e => { e.preventDefault(); void action.act(run('route.optimize', { date, branchId: branchId || 'main', ...(technicianId ? { technicianId } : {}) })) }}>
      <Field label="Optimize routes for">{p => <select {...p} value={technicianId} onChange={e => setTechnicianId(e.target.value)}><option value="">All technicians this day</option>{s.technicians.filter(t => t.active && (t.branchId ?? '') === branchId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
      <div className="actions"><button type="submit" disabled={!!busy || !s.business[0]?.maps}>Propose better routes</button></div>
    </form>
    {!s.business[0]?.maps && <p className="muted">Connect Google Maps under Team first.</p>}
    {current && <div aria-live="polite">
      {current.status === 'queued' && <p>Waiting for the background run. Runs start every 15 minutes. Visits stay unchanged until you accept.</p>}
      {current.status === 'running' && <p>Comparing routes in the background. Visits stay unchanged until you accept.</p>}
      {current.status === 'failed' && <p className="problem" role="alert">{current.problem}</p>}
      {current.status === 'accepted' && <p>Route accepted. {current.decidedBy.name} recorded: {current.reason}</p>}
      {current.status === 'discarded' && <p>Proposal discarded. Visits stayed unchanged.</p>}
      {current.status === 'ready' && <>
        <p><strong>{drive(current.savedSeconds)} driving saved</strong> · {drive(current.beforeSeconds)} before → {drive(current.afterSeconds)} proposed.</p>
        <p className="muted">Driving between visits; travel to and from the depot is excluded. Visits stay unchanged until you accept.</p>
        <ol className="route-list">{current.moves.map((m: Rec) => { const visit = byId(s.visits, m.visitId), job = byId(s.jobs, visit?.jobId); return <li key={m.visitId}><strong>{job?.number} · {job?.title}</strong><p>Before: {label(m.before)}</p><p>Proposed: {label(m.after)}</p>{visit?.arrivalWindow && <small>Arrival window: {timeRange(visit.arrivalWindow.start, visit.arrivalWindow.end)}</small>}</li> })}</ol>
        <form onSubmit={e => { e.preventDefault(); void action.act(run('route.accept', { routeId: current.id, version: current.version, reason }), () => setReason('')) }}>
          <Field label="Reason for accepting route">{p => <input {...p} value={reason} onChange={e => setReason(e.target.value)} required maxLength={400} />}</Field>
          <div className="actions"><button className="primary" type="submit">Accept route changes</button></div>
        </form>
      </>}
      {!['accepted', 'discarded'].includes(current.status) && <button type="button" onClick={() => action.act(run('route.discard', { routeId: current.id, version: current.version }))}>Discard route proposal</button>}
    </div>}
    <Problem error={action.error} />
  </section>
}
