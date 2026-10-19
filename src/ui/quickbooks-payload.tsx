import { useState } from 'react'
import type { Glove, Rec } from './api'
import { Field } from './controls'

export function QuickBooksPayload({ s, invoice }: { s: Glove; invoice: Rec }) {
  const [refs, setRefs] = useState({ customerRef: '', itemRef: '', taxCodeRef: '' })
  if (!s.actor.reads.includes('export') || !invoice.revisions.some((r: Rec) => r.approval && r.totals.currency === 'USD')) return null
  const query = new URLSearchParams(refs).toString()
  return <section><h3>QuickBooks payload for inspection</h3><p className="muted">Enter the existing records’ QuickBooks IDs. This prepares a JSON document for inspection; it does not connect or sync to QuickBooks.</p><div className="form-grid">
    {([['customerRef', 'QuickBooks customer ID'], ['itemRef', 'QuickBooks sales item ID'], ['taxCodeRef', 'QuickBooks tax code ID']] as const).map(([key, label]) => <Field key={key} label={label}>{p => <input {...p} value={refs[key]} onChange={e => setRefs({ ...refs, [key]: e.target.value })} />}</Field>)}
  </div>{Object.values(refs).every(Boolean) && <a href={`/api/glove/invoices/${invoice.id}/quickbooks.json?${query}`} download>Download QuickBooks inspection payload</a>}</section>
}
