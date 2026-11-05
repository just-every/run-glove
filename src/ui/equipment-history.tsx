import { serviceHistory } from '../glove/equipment'
import type { Glove, Rec } from './api'

/** Only the technician's authorized records are present, including in the kept offline day. */
export function EquipmentHistory({ s, equipment }: { s: Glove; equipment: Rec }) {
  const history = serviceHistory(s, equipment, s.jobs)
  return <details>
    <summary>Service history</summary>
    {!history.length ? <p>No jobs have touched this unit yet.</p> : <ul className="rows">{history.map(job => <li key={job.jobId}><div>
      <strong>{job.number} · {job.title}</strong>
      {job.visits.map(visit => <p key={visit.visitId}>{visit.date} {visit.start} · {visit.technician} · {visit.status}</p>)}
      {job.captures.map(capture => <p key={capture.id}>{capture.kind === 'refrigerant' ? `${capture.refrigerant.type}: ${capture.refrigerant.added} lb added, ${capture.refrigerant.recovered} lb recovered` : capture.text ?? capture.label ?? capture.formName ?? capture.description ?? capture.caption ?? capture.kind}</p>)}
    </div></li>)}</ul>}
  </details>
}
