import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'

type Kind = 'customer' | 'service' | 'invoice'
type Proposal = { kind: Kind; id: string; rule: string | null; group: 'matched' | 'ambiguous' | 'unmatched'; candidates: string[]; nameClashes: string[] }
type Choice = { id: string; name?: string; email?: string; phone?: string; number?: string; total?: number; subCustomer?: boolean; active?: boolean; sku?: string }
type Review = { connectionId: string; fingerprint: string; proposals: Proposal[]; choices: Record<Kind, Choice[]>; untouched: { customers: Choice[]; items: Choice[]; invoices: Choice[] } }
const kinds: Kind[] = ['customer', 'service', 'invoice']
const labels = { customer: 'customers', service: 'items', invoice: 'invoices' }
const rules: Record<string, string> = { 'verified-company-link': 'Verified company link', 'name-and-contact': 'Name and email or phone', sku: 'SKU', name: 'Item name', 'number-customer-total': 'Invoice number, customer and original total' }
const records = (s: Glove, kind: Kind) => kind === 'customer' ? s.customers : kind === 'service' ? s.services : s.invoices
const label = (row?: Rec) => row?.name ?? row?.importedInvoiceNumber ?? row?.number ?? 'Record unavailable'
const choiceLabel = (row: Choice) => `${row.name ?? row.number ?? 'Record'} · ID ${row.id}${row.email ? ` · ${row.email}` : row.phone ? ` · ${row.phone}` : ''}${row.sku ? ` · SKU ${row.sku}` : ''}${row.total !== undefined ? ` · $${Number(row.total).toFixed(2)}` : ''}`

/** Company review stays in memory. Every chosen link is verified by its existing command. */
export function QuickBooksReview({ s, run }: { s: Glove; run: Run }) {
  const [review, setReview] = useState<Review | null>(null), [busy, setBusy] = useState(false), [progress, setProgress] = useState('')
  const action = useAction(), connectionId = s.business[0]?.qbo?.connectionId
  const read = async () => {
    const result = await action.act(run('qbo.discover', {}))
    if (result.ok) { const next = JSON.parse(result.result.review) as Review; setReview(next); return next }
    return null
  }
  const perform = async (work: () => Promise<void>) => {
    setBusy(true); setProgress('')
    try { await work() } finally { setBusy(false) }
  }
  const verify = async (proposal: Proposal, remoteId: string) => {
    const result = await action.act(run('qbo.map', { kind: proposal.kind, id: proposal.id, remoteId }))
    if (result.ok) await read()
  }
  const verifyMatched = async (kind: Kind) => {
    const pending = review!.proposals.filter(p => p.kind === kind && p.group === 'matched' && records(s, kind).find(r => r.id === p.id)?.qbo?.connectionId !== connectionId)
    for (const [i, proposal] of pending.entries()) {
      setProgress(`Verifying ${labels[kind]}: ${i + 1} of ${pending.length}`)
      const result = await action.act(run('qbo.map', { kind, id: proposal.id, remoteId: proposal.candidates[0] }))
      if (!result.ok) { setProgress(`Stopped after ${i} verified links. Correct the refusal and read the review again.`); return }
    }
    await read(); setProgress(`Verified ${pending.length} ${labels[kind]}. No QuickBooks records were created.`)
  }
  const create = async (proposal: Proposal) => {
    const row = records(s, proposal.kind).find(r => r.id === proposal.id)!
    const result = await action.act(run('qbo.createCustomer', { id: row.id, version: row.version, confirm: true, reviewFingerprint: review!.fingerprint }))
    if (result.ok) { await read(); setProgress(result.result.phase === 'complete' ? `${label(row)} created and linked once.` : `Creation ${result.result.phase}. Inspect the outcome before another attempt.`) }
  }
  return <section aria-label="QuickBooks company review">
    <h3>Review the existing company</h3>
    <p>Read customers, sales items and invoices before any sync. Verify proposed links, resolve choices, and explicitly approve each new customer. Provider-only records stay untouched.</p>
    <button type="button" disabled={busy} onClick={() => void perform(async () => { await read() })}>{review ? 'Refresh company review' : 'Read company review'}</button>
    <Problem error={action.error} />{progress && <p role="status">{progress}</p>}
    {review && <fieldset disabled={busy} aria-busy={busy} style={{ minWidth: 0, border: 0, padding: 0, margin: 0 }}>
      <legend>Company link plan</legend>
      <p>Review company {s.business[0]?.qbo?.realmId}. Matching alone authorizes no provider writes. Verify all existing records, then confirm the links below before syncing.</p>
      {(['matched', 'ambiguous', 'unmatched'] as const).map(group => <details key={group} open={group !== 'matched'}>
        <summary>{group === 'matched' ? 'Matched records' : group === 'ambiguous' ? 'Ambiguous choices' : 'Glove records with no match'} · {review.proposals.filter(p => p.group === group).length}</summary>
        {kinds.map(kind => {
          const proposals = review.proposals.filter(p => p.group === group && p.kind === kind)
          if (!proposals.length) return null
          const pending = proposals.some(p => records(s, kind).find(r => r.id === p.id)?.qbo?.connectionId !== connectionId)
          return <section key={kind} aria-label={`${group} ${labels[kind]}`}>
            <h4>{proposals.length} {labels[kind]}</h4>
            {group === 'matched' && pending && <button type="button" onClick={() => void perform(() => verifyMatched(kind))}>Verify matched {labels[kind]}</button>}
            <ul className="rows">{proposals.map(proposal => <ReviewRecord key={`${proposal.kind}-${proposal.id}`} proposal={proposal} row={records(s, kind).find(r => r.id === proposal.id)} review={review} s={s} verify={id => perform(() => verify(proposal, id))} create={() => perform(() => create(proposal))} />)}</ul>
          </section>
        })}
      </details>)}
      <details><summary>QuickBooks records left untouched · {Object.values(review.untouched).reduce((n, rows) => n + rows.length, 0)}</summary>
        <p>These records will not be changed or imported by confirming this plan. Bring customers into Glove through the existing Move in review when needed.</p>
        {Object.entries(review.untouched).map(([kind, rows]) => rows.length > 0 && <section key={kind} aria-label={`Untouched ${kind}`}><h4>{rows.length} {kind}</h4><ul className="rows">{rows.map(row => <li key={row.id}><div>{choiceLabel(row)}{row.subCustomer && ' · Sub-customer'}{row.active === false && ' · Inactive'}</div></li>)}</ul></section>)}
      </details>
    </fieldset>}
  </section>
}

function ReviewRecord({ proposal, row, review, s, verify, create }: { proposal: Proposal; row?: Rec; review: Review; s: Glove; verify: (id: string) => Promise<void>; create: () => Promise<void> }) {
  const [selected, setSelected] = useState(''), [manual, setManual] = useState(''), [approved, setApproved] = useState(false)
  if (!row) return null
  const link = row.qbo?.connectionId === review.connectionId ? row.qbo : null
  const choices = review.choices[proposal.kind].filter(r => proposal.candidates.includes(r.id)), clashes = review.choices[proposal.kind].filter(r => proposal.nameClashes.includes(r.id))
  return <li><div style={{ minWidth: 0, width: '100%' }}>
    <strong>{label(row)}</strong>
    {proposal.rule && <p className="muted">Matched by {rules[proposal.rule] ?? proposal.rule}.</p>}
    {link && <p role="status">Verified QuickBooks ID {link.remoteId}{link.confirmedAt ? ` · Confirmed by ${s.operators.find(o => o.id === link.confirmedBy)?.name ?? link.confirmedBy}` : ' · Awaiting confirmation'}</p>}
    {clashes.length > 0 && <div className="problem" role="alert">Name clash: {clashes.map(choiceLabel).join('; ')}. Link the existing record or resolve its name before approving creation.</div>}
    {proposal.group === 'matched' && !link && <p>{choices.map(choiceLabel).join('; ')}</p>}
    {proposal.group === 'ambiguous' && <form onSubmit={e => { e.preventDefault(); if (selected) void verify(selected) }}>
      <Field label={`QuickBooks choice for ${label(row)}`}>{p => <select {...p} value={selected} onChange={e => setSelected(e.target.value)}><option value="">Choose one or leave unresolved</option><option value="none">None of these records</option>{choices.map(choice => <option value={choice.id} key={choice.id}>{choiceLabel(choice)}</option>)}</select>}</Field>
      {choices.filter(choice => choice.id === selected).map(choice => <p key={choice.id}>{choiceLabel(choice)}</p>)}
      {selected === 'none' ? <p>No candidate chosen. Link an existing record by ID below; this record remains unresolved.</p> : <button type="submit" disabled={!selected}>Verify selected link</button>}
    </form>}
    {proposal.group !== 'matched' && <details><summary>Link an existing record by ID</summary><form onSubmit={e => { e.preventDefault(); void verify(manual) }}>
      <Field label={`Existing QuickBooks ID for ${label(row)}`}>{p => <input {...p} inputMode="numeric" pattern="[0-9]+" value={manual} onChange={e => setManual(e.target.value)} required />}</Field><button type="submit">Verify manual link</button>
    </form></details>}
    {proposal.group === 'unmatched' && proposal.kind === 'customer' && !link && <>
      <label className="check-line"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} disabled={clashes.length > 0} /> I approve creating {label(row)} in this QuickBooks company</label>
      <button type="button" disabled={!approved || clashes.length > 0} onClick={() => void create()}>Create approved customer</button>
      {row.qboSync && <p role="status">Creation {row.qboSync.phase}{row.qboSync.message ? ` · ${row.qboSync.message}` : ''}. {row.qboSync.phase === 'unknown' && 'Verify its outcome using the existing-record controls below; do not resend.'}</p>}
    </>}
    {proposal.group === 'unmatched' && proposal.kind !== 'customer' && <p>Link the existing record by ID. This review creates only explicitly approved unmatched customers.</p>}
  </div></li>
}
