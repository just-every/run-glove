import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'

/** Owner-only explicit requests; exported bytes live only in this download. */
export function CustomerPrivacy({ s, run, customer }: { s: Glove; run: Run; customer: Rec }) {
  const [confirm, setConfirm] = useState(''), [ack, setAck] = useState(false)
  const { error, act } = useAction()
  if (s.actor.role !== 'owner') return null
  const receipts = (s.privacyRequests ?? []).filter(r => r.customerIds.includes(customer.id))
  return <section className="panel" aria-labelledby="customer-privacy-title">
    <h2 id="customer-privacy-title">Customer privacy</h2>
    {customer.erasedAt ? <p role="status">Personal data erased. Anonymous invoices and tax totals remain.</p> : <>
      <p>Handle a customer’s request for all data Glove holds about them. Merged customer identities are included together.</p>
      <button type="button" onClick={() => void act(run('privacy.export', { customerId: customer.id, version: customer.version }), result => {
        if (!result.download) return
        const url = URL.createObjectURL(new Blob([result.download], { type: 'application/json' }))
        const a = document.createElement('a'); a.href = url; a.download = `customer-${customer.id}.json`; a.click(); URL.revokeObjectURL(url)
      })}>Export customer data</button>
      <form onSubmit={e => { e.preventDefault(); if (ack && confirm === 'ERASE') void act(run('privacy.erase', { customerId: customer.id, version: customer.version, confirm }), () => { setConfirm(''); setAck(false) }) }}>
        <p>Erasure is permanent. It removes this customer group’s contacts, addresses, messages and originals, including exemption certificates and affected import originals. Shared source files and affected import undo journals become unavailable; other imported customers remain. Invoices, job costs and tax totals stay anonymous. Keep the latest backup as the erasure journal when restoring older backups.</p>
        <label className="check-line"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /> I am acting on this customer’s erasure request, including all merged identities and affected originals.</label>
        <Field label="Type ERASE to confirm">{p => <input {...p} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="off" />}</Field>
        <button type="submit" disabled={!ack || confirm !== 'ERASE'}>Erase customer personal data</button>
      </form>
    </>}
    <Problem error={error} />
    {receipts.length > 0 && <ul aria-label="Privacy request outcomes">{receipts.map(r => <li key={r.id}>{r.action === 'export' ? 'Export' : 'Erasure'} complete · {r.customerIds.length} customer identities · {r.by.name} · {new Date(r.createdAt).toLocaleString('en-US')}</li>)}</ul>}
  </section>
}
