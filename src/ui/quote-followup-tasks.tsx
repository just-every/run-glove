import type { Glove, Rec, Run } from './api'
import { Problem, useAction } from './controls'
import { can } from './roles'

export function QuoteFollowupTasks({ s, quote, run }: { s: Glove; quote: Rec; run: Run }) {
  const action = useAction()
  if (!quote.followupTasks?.length) return null
  return <section aria-label={`Call tasks for ${quote.number}`}><h3>Follow-up calls</h3><ul className="rows">{quote.followupTasks.map((task: Rec) => <li key={task.key}><div><strong>{task.title}</strong><p>{task.status === 'open' ? 'Waiting for a person to call' : task.status === 'stopped' ? 'Stopped: quote answered, closed or expired' : 'Task completed; call outcome is recorded separately'}</p>{task.status === 'open' && can(s.actor, 'quote.followupComplete') && <button type="button" onClick={() => action.act(run('quote.followupComplete', { quoteId: quote.id, version: quote.version, key: task.key }))}>Complete call task</button>}</div></li>)}</ul><Problem error={action.error} /></section>
}
