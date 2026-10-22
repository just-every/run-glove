import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'

const storeLabel: Record<string, string> = { customers: 'Customer identities', sites: 'Properties', jobs: 'Jobs', visits: 'Visits', captures: 'Field captures', quotes: 'Quotes', invoices: 'Invoices', imports: 'Import records', merges: 'Merge records', privacyRequests: 'Privacy receipts', conversations: 'Conversations', equipment: 'Equipment', messages: 'Messages', glove_files: 'Original files', glove_tax_certificates: 'Exemption certificates', glove_tax_certificate_chunks: 'Certificate file parts', glove_events: 'Activity entries', glove_commands: 'Saved command outcomes', glove_companycam_uploads: 'Photo sync records', rer_mail_event_states: 'Mail delivery states', rer_mail_event_receipts: 'Mail provider events', importBatches: 'Import batches' }

/** Owner-only explicit requests; exported bytes live only in this download. */
export function CustomerPrivacy({ s, run, customer }: { s: Glove; run: Run; customer: Rec }) {
  const [confirm, setConfirm] = useState(''), [ack, setAck] = useState(false)
  const [preview, setPreview] = useState<Rec | null>(null)
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
      <form onSubmit={e => { e.preventDefault(); if (preview && ack && confirm === 'ERASE') void act(run('privacy.erase', { customerId: customer.id, version: customer.version, confirm, fingerprint: preview?.fingerprint }), () => { setConfirm(''); setAck(false); setPreview(null) }) }}>
        <p>Erasure is permanent. It removes this customer group’s contacts, addresses, messages and originals, including exemption certificates and affected import originals. Review the affected originals and any loss of shared Undo before confirming. Other customers’ native records remain. Invoices, job costs and tax totals stay anonymous. Keep the latest backup as the erasure journal when restoring older backups.</p>
        <button type="button" onClick={() => void act(run('privacy.preview', { customerId: customer.id, version: customer.version }), result => { setPreview(result); setConfirm(''); setAck(false) })}>Preview erasure</button>
        {preview && <div aria-label="Erasure preview">
          <h3>What will be erased</h3>
          <p>{preview.customerIds.length} merged identities. {preview.peersAffected} peer customers lose access to a shared original.</p>
          <ul>{Object.entries(preview.counts).filter(([, n]) => Number(n) > 0).map(([store, n]) => <li key={store}>{storeLabel[store] ?? store.replace(/([A-Z])/g, ' $1')}: {String(n)} affected records</li>)}</ul>
          <h3>Shared originals withdrawn</h3>
          {preview.sharedOriginals.length ? <ul>{preview.sharedOriginals.map((a: Rec) => <li key={a.jobId + a.sha256}>{a.name}: {a.peers} peer customers affected</li>)}</ul> : <p>No shared originals.</p>}
          <h3>Undo retired</h3>
          {preview.retiredBatches.length ? <ul>{preview.retiredBatches.map((b: Rec) => <li key={b.jobId}>{b.name} · {b.jobId}: {b.reason}</li>)}</ul> : <p>No batches retired. Peer Undo remains available.</p>}
        </div>}
        <label className="check-line"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /> I am acting on this customer’s erasure request, including all merged identities and affected originals.</label>
        <Field label="Type ERASE to confirm">{p => <input {...p} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="off" />}</Field>
        <button type="submit" disabled={!preview || !ack || confirm !== 'ERASE'}>Erase customer personal data</button>
      </form>
    </>}
    <Problem error={error} />
    {receipts.length > 0 && <ul aria-label="Privacy request outcomes">{receipts.map(r => <li key={r.id}>{r.action === 'export' ? 'Export' : 'Erasure'} {r.outcome === 'complete' ? 'complete' : 'prepared with shared-source omissions'} · {r.customerIds.length} customer identities · {r.by.name} · {new Date(r.createdAt).toLocaleString('en-US')}</li>)}</ul>}
  </section>
}
