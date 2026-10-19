import { useEffect, useState } from 'react'
import { when, type Glove, type Rec, type Run } from './api'
import { Badge, Problem, useAction } from './controls'
import { can } from './roles'

// CUST-005 on the Customers screen: the merge review for customers sharing a
// phone, email or address with the one open, and undoing a merge into it.

const shown = ['name', 'phone', 'email', 'billingAddress'] as const
const label = { name: 'Name', phone: 'Phone', email: 'Email', billingAddress: 'Billing address' }

export function Duplicates({ s, run, customer }: { s: Glove; run: Run; customer: Rec }) {
  const [review, setReview] = useState<{ candidates: Rec[]; records: Rec[] } | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const { error, act } = useAction()
  useEffect(() => {
    let live = true
    fetch(`/api/glove/customers/${encodeURIComponent(customer.id)}/duplicates`, { credentials: 'same-origin', cache: 'no-store' }).then(r => r.ok ? r.json() : null).then((body: any) => { if (live) setReview(body) })
    return () => { live = false }
  }, [customer.id, s.version])
  const merges = s.merges.filter(m => m.survivorId === customer.id && m.status === 'merged')
  if (!can(s.actor, 'customer.merge') || (!review?.candidates.length && !merges.length)) return null
  const versions = Object.fromEntries(s.customers.map(c => [c.id, c.version]))
  return <section className="panel" aria-label="Possible duplicates"><h2>Possible duplicates</h2>
    {review && review.candidates.length > 0 && <>
      <p className="muted">These customers share a {[...new Set(review.candidates.flatMap(c => c.matches))].join(', ')} with {customer.name}. Merging moves their properties, requests, quotes, jobs and invoices here; you can undo it.</p>
      <table className="table"><thead><tr><th>Customer</th>{shown.map(f => <th key={f}>{label[f]}</th>)}<th>Holds</th></tr></thead><tbody>
        {review.records.map(r => <tr key={r.customer.id}><td>{r.customer.name}{r.customer.id === customer.id && <> <Badge tone="green">Keeps</Badge></>}</td>
          {shown.map(f => <td key={f} data-label={label[f]}><label className="check-line"><input type="radio" name={`value-${f}`} checked={(values[f] ?? customer.id) === r.customer.id} onChange={() => setValues({ ...values, [f]: r.customer.id })} /> {r.customer[f] || '—'}</label></td>)}
          <td data-label="Holds">{Object.entries(r.holds).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(', ') || 'nothing yet'}</td></tr>)}
      </tbody></table>
      <div className="actions"><button className="primary" onClick={() => act(run('customer.merge', { survivorId: customer.id, mergedIds: review.candidates.map(c => c.id), versions, values }), () => setValues({}))}>Merge {review.candidates.length} into {customer.name}</button></div>
    </>}
    {merges.map(m => <div key={m.id} className="actions"><span className="muted">Merged {m.mergedIds.length} customer{m.mergedIds.length === 1 ? '' : 's'} ({m.moved.length} records moved) {when(m.createdAt, s.business[0]?.timezone ?? 'UTC')} by {m.by.name}</span>{can(s.actor, 'customer.unmerge') && <button onClick={() => act(run('customer.unmerge', { mergeId: m.id, version: m.version }))}>Undo merge</button>}</div>)}
    <Problem error={error} />
  </section>
}
