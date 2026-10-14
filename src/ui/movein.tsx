import { useState } from 'react'
import { when, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, useAction } from './controls'
import { can } from './roles'

// Moving in from ServiceM8: choose the saved API lists (and any attachment
// files), preview exactly what Glove would write, commit that exact preview,
// and undo it if it was wrong.

const lists = ['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment']
const uuid = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/

async function readFiles(files: FileList) {
  const out: { name: string; text?: string; base64?: string }[] = [], skipped: string[] = []
  for (const file of Array.from(files)) {
    const list = lists.find(k => file.name.toLowerCase() === `${k}.json`)
    if (list) { out.push({ name: `${list}.json`, text: await file.text() }); continue }
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
  const { error, act } = useAction()
  const owner = can(s.actor.role, 'import.stage')
  return <div className="page">
    <section className="titlebar"><div><h1>Move in</h1><p className="subtitle">Bring your customers, staff and job history from ServiceM8</p></div></section>
    <div className="two-col">
      <div>
        {owner ? <form className="panel" onSubmit={e => { e.preventDefault(); void act(run('import.stage', { label, files }), () => { setFiles([]); setLabel('') }) }}>
          <h2>Preview a move-in</h2>
          <p>Choose the lists you saved from ServiceM8's API: {lists.map(l => `${l}.json`).join(', ')}. Add any job attachment files you downloaded (their file names keep the attachment ID). Nothing is written until you commit the preview.</p>
          <Field label="Export files">{p => <input {...p} type="file" multiple accept=".json,image/*,application/pdf" onChange={async e => { if (e.target.files) { const r = await readFiles(e.target.files); setFiles(r.out); setSkipped(r.skipped) } }} />}</Field>
          {files.length > 0 && <p className="muted">{files.length} file{files.length === 1 ? '' : 's'} ready: {files.map(f => f.name).join(', ')}</p>}
          {skipped.length > 0 && <p className="field-error">Not a ServiceM8 list or attachment, so left out: {skipped.join(', ')}</p>}
          <Field label="Name this move-in (optional)">{p => <input {...p} value={label} onChange={e => setLabel(e.target.value)} placeholder="ServiceM8 export, October" />}</Field>
          <Problem error={error} />
          <div className="actions"><button className="primary" type="submit" disabled={!files.length}>Preview</button></div>
        </form> : <section className="panel"><p>The owner moves records in. You can see past move-ins here.</p></section>}
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
  const p = batch.preview, zone = s.business[0]?.timezone ?? 'Australia/Sydney'
  const owner = can(s.actor.role, 'import.commit')
  return <section className="panel" aria-label={batch.label}>
    <h2>{batch.label} <Badge tone={batch.status === 'committed' ? 'green' : batch.status === 'undone' ? 'grey' : 'gold'}>{{ previewed: 'Preview', committed: 'Committed', undoing: 'Undo part-way', undone: 'Undone' }[batch.status as string]}</Badge></h2>
    <p className="muted">Previewed {when(batch.stagedAt, zone)} by {batch.stagedBy.name}{batch.committedBy ? ` · committed by ${batch.committedBy.name}` : ''}{batch.undoneBy ? ` · undone by ${batch.undoneBy.name}: ${batch.undoReason}` : ''}</p>
    <table className="table"><thead><tr><th>ServiceM8 list</th><th>Records</th><th>Become Glove records</th><th>Merged</th><th>Rejected</th></tr></thead><tbody>
      {Object.entries(p.byKind as Record<string, Rec>).map(([kind, n]) => <tr key={kind}><td>{kind}</td><td data-label="Records">{n.input}</td><td data-label="Become Glove records">{n.mapped}</td><td data-label="Merged">{n.merged}</td><td data-label="Rejected">{n.rejected}</td></tr>)}
    </tbody></table>
    {p.alreadyMovedIn > 0 && <p>{p.alreadyMovedIn} of these were moved in before and will be left exactly as they are.</p>}
    {p.rejections.length > 0 && <><h3>Rejected ({p.rejections.length})</h3><ul>{p.rejections.map((r: Rec) => <li key={r.kind + r.sourceId}>{r.kind} {r.location?.artifact} item {r.location?.row}: {r.reason}</li>)}</ul></>}
    {p.missingAttachments.length > 0 && <><h3>Attachments not included ({p.missingAttachments.length})</h3><p className="muted">These stay listed on their jobs as missing until you add the files.</p><ul>{p.missingAttachments.map((a: Rec) => <li key={a.sourceId}>{a.name}</li>)}</ul></>}
    {Object.keys(p.unmappedFields).length > 0 && <details className="details"><summary>ServiceM8 fields Glove does not use</summary><ul>{Object.entries(p.unmappedFields as Record<string, string[]>).map(([k, f]) => <li key={k}>{k}: {f.join(', ')}</li>)}</ul></details>}
    <Problem error={error} />
    {owner && batch.status === 'previewed' && <div className="actions"><button className="primary" onClick={() => act(run('import.commit', { batchId: batch.id, version: batch.version, fingerprint: p.fingerprint }))}>Commit exactly this preview</button></div>}
    {owner && batch.status === 'undoing' && <><p>The undo stopped part-way ({batch.undoReason}). Until it finishes, its records cannot be changed or used in new work.</p>
      <div className="actions"><button className="primary" onClick={() => act(run('import.undo', { batchId: batch.id, version: batch.version, reason: batch.undoReason }))}>Finish the undo</button></div></>}
    {owner && batch.status === 'committed' && <form className="inline-form" onSubmit={e => { e.preventDefault(); void act(run('import.undo', { batchId: batch.id, version: batch.version, reason })) }}>
      <Field label="Why undo this move-in">{f => <input {...f} value={reason} onChange={e => setReason(e.target.value)} required />}</Field>
      <button type="submit">Undo move-in</button>
    </form>}
  </section>
}
