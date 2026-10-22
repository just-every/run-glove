import { useState } from 'react'
import { when, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, useAction } from './controls'
import { can } from './roles'
import { CsvImport, CsvPreview } from './csv-import'
const providerLists: Record<string, string[]> = { servicetitan: ['customers','contacts','locations','technicians','services','materials','leads','jobs','appointments','appointment-assignments','estimates','invoices','equipment','membership-types','invoice-templates','memberships','recurring-services','recurring-service-events'], servicem8: ['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment'], workiz: ['clients', 'users', 'items', 'leads', 'jobs', 'estimates', 'invoices'], fieldpulse: ['customers', 'locations', 'users', 'items', 'jobs', 'estimates', 'invoices', 'comments'] }

// Moving in from ServiceM8 (the saved API lists and any attachment files) or a
// customer CSV (CUST-003): preview exactly what Glove would write, commit that
// exact preview, and undo it if it was wrong.

const lists = ['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment']
const uuid = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/

async function readFiles(files: FileList, format: string) {
  const out: { name: string; text?: string; base64?: string }[] = [], skipped: string[] = []
  for (const file of Array.from(files)) {
    const name = file.name.toLowerCase(), list = providerLists[format].find(k => new RegExp(`^${k}(?:-\\d+)?\\.json$`).test(name))
    if (list || format === 'servicetitan' && /^job-(?:notes|attachments)-[a-zA-Z0-9_-]+\.json$/.test(file.name) || format === 'fieldpulse' && ['invoice-balances.csv', 'recurring-jobs.csv'].includes(name)) { out.push({ name, text: await file.text() }); continue }
    if (format !== 'servicem8') {
      if (format === 'servicetitan' && !file.name.endsWith('.json')) {
        const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte)
        out.push({ name: `attachments/${file.name}`, base64: btoa(binary) }); continue
      }
      const attachment = /^attachment-([a-zA-Z0-9_-]{1,150})\.[^.]+$/.exec(file.name)
      if (!attachment) { skipped.push(file.name); continue }
      const bytes = new Uint8Array(await file.arrayBuffer())
      let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte)
      out.push({ name: `attachments/${attachment[1]}`, base64: btoa(binary) }); continue
    }
    const id = uuid.exec(file.name.toLowerCase())
    if (!id) { skipped.push(file.name); continue }
    const bytes = new Uint8Array(await file.arrayBuffer())
    let binary = ''
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    out.push({ name: `attachments/${id[1]}`, base64: btoa(binary) })
  }
  return { out, skipped }
}

export function MoveIn({ s, run }: { s: Glove; run: Run }) {
  const [files, setFiles] = useState<{ name: string; text?: string; base64?: string }[]>([])
  const [skipped, setSkipped] = useState<string[]>([])
  const [label, setLabel] = useState('')
  const [format, setFormat] = useState('servicem8')
  const [balanceAsOf, setBalanceAsOf] = useState('')
  const { error, act } = useAction()
  const owner = can(s.actor, 'import.stage')
  return <div className="page">
    <section className="titlebar"><div><h1>Move in</h1><p className="subtitle">Bring saved records from ServiceM8, FieldPulse, Workiz or ServiceTitan, or customers from a CSV</p></div></section>
    <div className="two-col">
      <div>
        {owner ? <form className="panel" onSubmit={e => { e.preventDefault(); void act(run('import.stage', { label, files, format, ...(balanceAsOf ? { balanceAsOf } : {}) }), () => { setFiles([]); setLabel('') }) }}>
          <h2>Preview a move-in</h2>
          <Field label="Move-in source">{p => <select {...p} value={format} onChange={e => { setFormat(e.target.value); setFiles([]); setSkipped([]) }}><option value="servicem8">ServiceM8</option><option value="fieldpulse">FieldPulse</option><option value="workiz">Workiz</option><option value="servicetitan">ServiceTitan</option></select>}</Field>
          <p>Choose saved API responses: {providerLists[format].map(l => `${l}.json`).join(', ')}. {format === 'fieldpulse' && 'For invoices, also include invoice-balances.csv from the invoice report. For recurring definitions, include recurring-jobs.csv from the Recurring Jobs report.'} Nothing is written until you commit the preview. <a href="/docs/move-in">File formats and limits</a></p>
          {format !== 'servicem8' && <><p>Keep downloaded attachments named attachment-ID.ext. Staff move in without a sign-in. Imports do not send messages, charge customers or post invoices to accounting.</p><Field label="Balances as of" hint="The date of the source balance snapshot; defaults to today in your business timezone.">{p => <input {...p} type="date" value={balanceAsOf} onChange={e => setBalanceAsOf(e.target.value)} />}</Field></>}
          <Field label="Export files">{p => <input {...p} type="file" multiple key={format} accept=".json,.csv,image/*,application/pdf" onChange={async e => { if (e.target.files) { const r = await readFiles(e.target.files, format); setFiles(r.out); setSkipped(r.skipped) } }} />}</Field>
          {files.length > 0 && <p className="muted">{files.length} file{files.length === 1 ? '' : 's'} ready: {files.map(f => f.name).join(', ')}</p>}
          {skipped.length > 0 && <p className="field-error">Not a supported list or attachment, so left out: {skipped.join(', ')}</p>}
          <Field label="Name this move-in (optional)">{p => <input {...p} value={label} onChange={e => setLabel(e.target.value)} placeholder="ServiceM8 export, October" />}</Field>
          <Problem error={error} />
          <div className="actions"><button className="primary" type="submit" disabled={!files.length}>Preview</button></div>
        </form> : <section className="panel"><p>The owner moves records in. You can see past move-ins here.</p></section>}
        {owner && <CsvImport s={s} run={run} />}
      </div>
      <div>
        {!s.imports.length ? <Empty title="No move-ins yet" /> : [...s.imports].reverse().map(batch => <Batch key={batch.id + batch.version} s={s} batch={batch} run={run} />)}
      </div>
    </div>
  </div>
}

function Batch({ s, batch, run }: { s: Glove; batch: Rec; run: Run }) {
  const [reason, setReason] = useState('')
  const { error, act } = useAction()
  const p = batch.preview, zone = s.business[0]?.timezone ?? 'America/Chicago'
  const owner = can(s.actor, 'import.commit')
  return <section className="panel" aria-label={batch.label}>
    <h2>{batch.label} <Badge tone={batch.status === 'committed' ? 'green' : batch.status === 'undone' ? 'grey' : 'gold'}>{{ previewed: 'Preview', committed: 'Committed', undoing: 'Undo part-way', undone: 'Undone' }[batch.status as string]}</Badge></h2>
    <p className="muted">Previewed {when(batch.stagedAt, zone)} by {batch.stagedBy.name}{batch.committedBy ? ` · committed by ${batch.committedBy.name}` : ''}{batch.undoneBy ? ` · undone by ${batch.undoneBy.name}: ${batch.undoReason}` : ''}</p>
    {batch.system === 'CSV' ? <CsvPreview p={p} /> : <>
    <div className="table-wrap"><table className="table"><thead><tr><th>{batch.system} list</th><th>Records</th><th>Become Glove records</th><th>Merged</th><th>Rejected</th></tr></thead><tbody>
      {Object.entries(p.byKind as Record<string, Rec>).map(([kind, n]) => <tr key={kind}><td>{kind}</td><td data-label="Records">{n.input}</td><td data-label="Become Glove records">{n.mapped}</td><td data-label="Merged">{n.merged}</td><td data-label="Rejected">{n.rejected}</td></tr>)}
    </tbody></table></div>
    {p.alreadyMovedIn > 0 && <p>{p.alreadyMovedIn} of these were moved in before and will be left exactly as they are.</p>}
    {p.possibleDuplicates?.length > 0 && <><h3>Possible duplicates of your customers ({p.possibleDuplicates.length})</h3><p className="muted">These move in as new customers; review and merge them on the Customers screen afterwards.</p><ul>{p.possibleDuplicates.map((d: Rec) => <li key={d.sourceId ?? d.name}>{d.name}: shares a {[...new Set(d.duplicates.flatMap((x: Rec) => x.matches))].join(', ')} with {d.duplicates.map((x: Rec) => x.name).join(', ')}</li>)}</ul></>}
    {p.rejections.length > 0 && <><h3>Rejected ({p.rejections.length})</h3><ul>{p.rejections.map((r: Rec) => <li key={r.kind + r.sourceId}>{r.kind} {r.location?.artifact} item {r.location?.row}: {r.reason}</li>)}</ul></>}
    {p.missingAttachments.length > 0 && <><h3>Attachments not included ({p.missingAttachments.length})</h3><p className="muted">These stay listed on their jobs as missing until you add the files.</p><ul>{p.missingAttachments.map((a: Rec) => <li key={a.sourceId}>{a.name}</li>)}</ul></>}
    {Object.keys(p.unmappedFields).length > 0 && <details className="details"><summary>{batch.system} fields Glove does not use</summary><ul>{Object.entries(p.unmappedFields as Record<string, string[]>).map(([k, f]) => <li key={k}>{k}: {f.join(', ')}</li>)}</ul></details>}
    </>}
    {batch.balanceAsOf && <p>Opening balances as of {batch.balanceAsOf}; imported balances are history, never new sales.</p>}
    {batch.fileSummary?.length > 0 && <details className="details"><summary>Original files and checksums</summary><ul>{batch.fileSummary.map((f: Rec) => <li key={f.name}>{f.name} · {f.size} bytes · <span style={{ overflowWrap: 'anywhere' }}>{f.sha256}</span></li>)}</ul></details>}
    <Problem error={error} />
    {owner && batch.status === 'previewed' && <div className="actions"><button className="primary" onClick={() => act(run('import.commit', { batchId: batch.id, version: batch.version, fingerprint: p.fingerprint }))}>Commit exactly this preview</button></div>}
    {owner && batch.status === 'undoing' && <><p>The undo stopped part-way ({batch.undoReason}). Until it finishes, its records cannot be changed or used in new work.</p>
      <div className="actions"><button className="primary" onClick={() => act(run('import.undo', { batchId: batch.id, version: batch.version, reason: batch.undoReason }))}>Finish the undo</button></div></>}
    {owner && batch.status === 'committed' && <form className="inline-form" onSubmit={e => { e.preventDefault(); void act(run('import.undo', { batchId: batch.id, version: batch.version, reason })) }}>
      <Field label={batch.system === 'CSV' ? 'Why undo this import' : 'Why undo this move-in'}>{f => <input {...f} value={reason} onChange={e => setReason(e.target.value)} required />}</Field>
      <button type="submit">{batch.system === 'CSV' ? 'Undo import' : 'Undo move-in'}</button>
    </form>}
  </section>
}
