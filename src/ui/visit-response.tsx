import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Problem, useAction } from './controls'
import { can } from './roles'
import { DocumentEmail } from './document-email'

export function VisitResponse({ s, visit, run }: { s: Glove; visit: Rec; run: Run }) {
  const action = useAction(), [notice, setNotice] = useState('')
  const reply = (visit.customerResponses ?? []).find((r: Rec) => r.noticeKey === visit.notice?.key)
  return <section aria-label={`Customer response for ${visit.local.date} ${visit.local.start}`}>
    {reply && <p>{reply.action === 'confirm' ? 'Customer confirmed this visit' : 'Customer asked to reschedule; existing booking unchanged'} · link recipient unverified</p>}
    {visit.status === 'booked' && s.actor.role === 'owner' && can(s.actor, 'visit.replyLink') && <div className="actions"><button type="button" onClick={() => action.act(run('visit.replyLink', { visitId: visit.id, version: visit.version }), () => setNotice('Visit response link submitted through customer email. Check its provider outcome below.'))}>Email visit response link</button></div>}
    {notice && <p role="status">{notice}</p>}<Problem error={action.error} />
    <DocumentEmail s={s} run={run} record={{ ...visit, number: `${visit.local.date} ${visit.local.start}` }} kind="visitResponse" ready={false} />
  </section>
}
