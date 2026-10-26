import { useState } from 'react'
import { QuickBooksReview } from './quickbooks-review'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, money, useAction } from './controls'
import { can } from './roles'

type Props = { s: Glove; run: Run }
type Kind = 'customer' | 'site' | 'service' | 'invoice'
const owner = (s: Glove) => s.actor.role === 'owner' && !s.actor.branch && !(s.actor as Glove['actor'] & { token?: unknown }).token
const mapped = (row: Rec, connectionId: string) => row.qbo?.connectionId === connectionId

function QuickBooksStatus({ row, connectionId }: { row: Rec; connectionId: string }) {
  const link = row.qbo ?? (row.qboSync?.phase === 'complete' ? row.qboSync : null)
  return <div role="status">
    <p className="muted">{link?.connectionId === connectionId ? `Mapped to QuickBooks ID ${link.remoteId}` : link ? 'Mapping belongs to a previous connection. Link this record again.' : 'No QuickBooks mapping.'}</p>
    {row.qboSync && <p>{row.qboSync.phase}{row.qboSync.remoteId ? ` · QuickBooks ID ${row.qboSync.remoteId}` : ''}{row.qboSync.message ? ` · ${row.qboSync.message}` : ''}</p>}
    {row.qboSync?.phase === 'unknown' && <p className="problem">The outcome is unknown. Check QuickBooks and verify its existing reference below before making further changes.</p>}
    {(row.qboSyncHistory ?? []).map((outcome: Rec, i: number) => <p className="muted" key={i}>Previous company outcome: {outcome.phase} · QuickBooks ID {outcome.remoteId}</p>)}
  </div>
}


function ReconcileQuickBooks({ row, kind, run, connectionId }: { row: Rec; kind: string; run: Run; connectionId: string }) {
  const previousCompany = row.qboSync?.connectionId !== connectionId
  const [remoteId, setRemoteId] = useState(previousCompany ? '' : row.qboSync?.remoteId ?? row.qbo?.remoteId ?? ''), action = useAction()
  const unresolved = ['unknown', 'reserved', 'sending'].includes(row.qboSync?.phase)
  if (unresolved && previousCompany) return <p className="problem">Reconnect the original QuickBooks company and verify its outstanding outcome before changing accounting links.</p>
  const previousPayment = kind === 'payment' && row.kind === 'payment' && previousCompany && row.qboSync?.phase === 'complete'
  if (!unresolved && !previousPayment) return null
  return <form onSubmit={e => { e.preventDefault(); void action.act(run('qbo.reconcile', { kind, id: row.id, version: row.version, remoteId })) }}>
    {previousPayment && <p>Confirm the new company's links, then enter the payment reference that already exists there. Its customer, amount, reference and invoice allocations must match. This payment will not be posted again.</p>}
    <Field label="QuickBooks reference to reconcile" hint={previousPayment ? 'Enter the existing payment ID in the connected company. Verification sends no new payment and changes no balance.' : 'Verifies exact reserved content in the connected company; sends no new record.'}>{p => <input {...p} value={remoteId} onChange={e => setRemoteId(e.target.value)} inputMode="numeric" pattern="[0-9]+" required />}</Field>
    <button type="submit">Verify QuickBooks outcome</button><Problem error={action.error} />
  </form>
}

export function QuickBooksSettings({ s, run }: Props) {
  const qbo = s.business[0]?.qbo
  const [realmId, setRealmId] = useState(qbo?.realmId ?? ''), [key, setKey] = useState('')
  const [kind, setKind] = useState<Kind>('customer'), [id, setId] = useState(''), [remoteId, setRemoteId] = useState('')
  const [refs, setRefs] = useState({ taxCodeRef: qbo?.taxCodeRef ?? '', classRef: qbo?.classRef ?? '', departmentRef: qbo?.departmentRef ?? '' })
  const [paymentId, setPaymentId] = useState(''), [pulled, setPulled] = useState('')
  const action = useAction()
  if (!owner(s) || !can(s.actor, 'qbo.connect') || !s.business.length) return null
  const records = (kind === 'customer' ? s.customers : kind === 'site' ? s.sites : kind === 'invoice' ? s.invoices : s.services).filter(r => !r.erasedAt && !r.mergedInto)
  const selected = records.find(r => r.id === id)
  return <section className="panel"><h2>QuickBooks Online sandbox</h2>
    <p className="muted">{qbo ? `Connected to sandbox company ${qbo.realmId}.` : 'Connect a QuickBooks sandbox company to verify existing records and send approved invoices.'}</p>
    <form onSubmit={e => { e.preventDefault(); void action.act(run('qbo.connect', { realmId, key, mode: 'sandbox' }), () => setKey('')) }}>
      <div className="form-grid">
        <Field label="QuickBooks sandbox company ID">{p => <input {...p} value={realmId} onChange={e => setRealmId(e.target.value)} inputMode="numeric" pattern="[0-9]+" required />}</Field>
        <Field label="QuickBooks sandbox access token" hint="Kept as an installation secret; never included in exports.">{p => <input {...p} type="password" value={key} onChange={e => setKey(e.target.value)} autoComplete="off" required />}</Field>
      </div>
      <div className="actions"><button type="submit">Connect QuickBooks sandbox</button>{qbo && <button type="button" onClick={() => action.act(run('qbo.connect', { key: null }), () => setKey(''))}>Disconnect QuickBooks</button>}</div>
    </form>
    {qbo && <>
      <QuickBooksReview key={qbo.connectionId} s={s} run={run} />
      <details><summary>Link a record by QuickBooks ID</summary>
      <h3>Link existing QuickBooks records</h3>
      <p className="muted">Select the Glove record and enter its existing QuickBooks ID. A site must be a sub-customer of its mapped customer, billed with that parent.</p>
      <form onSubmit={e => { e.preventDefault(); void action.act(run('qbo.map', { kind, id, remoteId }), () => setRemoteId('')) }}>
        <div className="form-grid">
          <Field label="Record type">{p => <select {...p} value={kind} onChange={e => { setKind(e.target.value as Kind); setId(''); setRemoteId('') }}><option value="customer">Customer</option><option value="site">Site</option><option value="service">Service</option><option value="invoice">Invoice</option></select>}</Field>
          <Field label="Glove record">{p => <select {...p} value={id} onChange={e => { setId(e.target.value); setRemoteId('') }} required><option value="">Choose a {kind}</option>{records.map(row => <option key={row.id} value={row.id}>{kind === 'site' ? `${s.customers.find(c => c.id === row.customerId)?.name ?? ''} · ${row.address}` : row.name ?? row.number}</option>)}</select>}</Field>
          <Field label="Existing QuickBooks record ID">{p => <input {...p} value={remoteId} onChange={e => setRemoteId(e.target.value)} inputMode="numeric" pattern="[0-9]+" required />}</Field>
        </div><button type="submit" disabled={!id}>Verify and link QuickBooks record</button>
      </form>
      {selected && <><QuickBooksStatus row={selected} connectionId={qbo.connectionId} /><ReconcileQuickBooks key={`${id}:${qbo.connectionId}`} row={selected} kind={kind} run={run} connectionId={qbo.connectionId} />{!['site', 'invoice'].includes(kind) && mapped(selected, qbo.connectionId) && can(s.actor, 'qbo.sync') && !['unknown', 'reserved', 'sending'].includes(selected.qboSync?.phase) && <button onClick={() => action.act(run('qbo.sync', { kind, id }))}>{selected.qboSync?.phase === 'rejected' ? 'Retry' : 'Sync'} QuickBooks {kind}</button>}</>}
      </details>
      <p className="muted">Verify every pre-existing customer, sales item and invoice, then confirm these links before posting.</p><button onClick={() => action.act(run('qbo.confirmLinks', { confirm: true }))}>Confirm existing QuickBooks links</button>{qbo.linksConfirmedAt && <p role="status">Existing links confirmed.</p>}
      <h3>Invoice accounting references</h3>
      <form onSubmit={e => { e.preventDefault(); void action.act(run('qbo.configure', { taxCodeRef: refs.taxCodeRef, ...(refs.classRef ? { classRef: refs.classRef } : {}), ...(refs.departmentRef ? { departmentRef: refs.departmentRef } : {}) })) }}>
        <div className="form-grid">{([['taxCodeRef', 'QuickBooks tax code ID'], ['classRef', 'QuickBooks class ID (optional)'], ['departmentRef', 'QuickBooks department ID (optional)']] as const).map(([field, label]) => <Field key={field} label={label}>{p => <input {...p} value={refs[field]} onChange={e => setRefs({ ...refs, [field]: e.target.value })} inputMode="numeric" pattern="[0-9]+" required={field === 'taxCodeRef'} />}</Field>)}</div>
        <button type="submit">Verify and save accounting references</button>
      </form>
      <h3>Read a QuickBooks payment</h3>
      <p className="muted">Read a payment recorded in QuickBooks and apply its linked invoice allocations to Glove balances.</p>
      <form onSubmit={e => { e.preventDefault(); void action.act(run('qbo.pull', { remoteId: paymentId }), result => setPulled(result?.message ?? `Read QuickBooks payment ${paymentId}.`)) }}>
        <Field label="QuickBooks payment ID">{p => <input {...p} value={paymentId} onChange={e => { setPaymentId(e.target.value); setPulled('') }} inputMode="numeric" pattern="[0-9]+" required />}</Field>
        <button type="submit">Read QuickBooks payment</button>
      </form>{pulled && <p role="status">{pulled}</p>}
    </>}
    <Problem error={action.error} />
  </section>
}

export function QuickBooksInvoice({ s, invoice, run }: Props & { invoice: Rec }) {
  const action = useAction(), qbo = s.business[0]?.qbo
  if (!owner(s) || !can(s.actor, 'qbo.sync')) return null
  if (!qbo) return <section><h3>QuickBooks Online</h3><p className="muted">Connect a QuickBooks sandbox company under Team to sync this invoice.</p></section>
  const payments = s.payments.filter(p => !p.qboImported && p.status === 'paid' && (p.invoiceId === invoice.id || p.effects?.some((effect: Rec) => effect.invoiceId === invoice.id)))
  const ready = !invoice.openingBalance && ['approved', 'exported'].includes(invoice.status)
  return <section><h3>QuickBooks Online sandbox</h3>
    <QuickBooksStatus row={invoice} connectionId={qbo.connectionId} /><ReconcileQuickBooks key={`${invoice.id}:${qbo.connectionId}`} row={invoice} kind="invoice" run={run} connectionId={qbo.connectionId} />
    {invoice.qboSync?.phase !== 'unknown' && <button disabled={!ready} onClick={() => action.act(run('qbo.sync', { kind: 'invoice', id: invoice.id }))}>{invoice.qboSync?.phase === 'rejected' ? 'Retry QuickBooks invoice' : 'Sync QuickBooks invoice'}</button>}
    {!ready && <p className="muted">Approve the invoice before syncing. Imported opening balances are retained as history.</p>}
    {payments.length > 0 && <><h4>Payments</h4><ul className="rows">{payments.map(payment => <li key={payment.id}><div><strong>{payment.kind === 'refund' ? 'Refund' : 'Payment'} · {money(payment.amount)}{payment.reference ? ` · ${payment.reference}` : ''}</strong><QuickBooksStatus row={payment} connectionId={qbo.connectionId} /><ReconcileQuickBooks key={`${payment.id}:${qbo.connectionId}`} row={payment} kind="payment" run={run} connectionId={qbo.connectionId} />{!['unknown', 'reserved', 'sending'].includes(payment.qboSync?.phase) && !(payment.qboSync?.phase === 'complete' && payment.qboSync.connectionId !== qbo.connectionId) && <button onClick={() => action.act(run('qbo.sync', { kind: 'payment', id: payment.id }))}>{payment.qboSync?.phase === 'rejected' ? 'Retry' : 'Sync'} QuickBooks {payment.kind === 'refund' ? 'refund' : 'payment'}</button>}</div></li>)}</ul></>}
    <Problem error={action.error} />
  </section>
}
