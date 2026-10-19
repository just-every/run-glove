import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'
import { columns, autoMapping, parseCsv, type CsvField, type ColumnMapping } from '../glove/csv-format'

// CUST-003: a customer CSV in any column order. The owner matches its columns
// to Glove's fields once (Glove remembers them), previews new, matched and
// rejected rows, and commits or undoes it like a move-in.

const headersOf = (text: string) => { try { return (parseCsv(text)[0] ?? []).map(h => h.trim()) } catch { return [] } }

export function CsvImport({ s, run }: { s: Glove; run: Run }) {
  const [file, setFile] = useState<{ name: string; text: string } | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const { error, act } = useAction()
  const headers = file ? headersOf(file.text) : []
  const choose = async (picked: File | undefined) => {
    if (!picked) return
    const text = await picked.text(), found = headersOf(text), remembered: ColumnMapping = s.business[0]?.csvMapping ?? {}
    setFile({ name: picked.name, text })
    setMapping(Object.values(remembered).length && Object.values(remembered).every(h => !h || found.includes(h)) ? remembered : autoMapping(found))
  }
  return <form className="panel" aria-label="Import customers from a CSV" onSubmit={e => { e.preventDefault(); if (file) void act(run('import.stage', { format: 'csv', files: [file], mapping }), () => { setFile(null); setMapping({}) }) }}>
    <h2>Import customers from a CSV</h2>
    <p>One row per customer, or several rows sharing a Customer ID for a customer with several properties or contacts. Glove's own customer export is in this shape. Nothing is written until you commit the preview.</p>
    <Field label="Customer CSV">{p => <input {...p} type="file" accept=".csv,text/csv" onChange={e => void choose(e.target.files?.[0])} />}</Field>
    {file && <fieldset className="field-grid"><legend>Which column holds each field</legend>
      {(Object.keys(columns) as CsvField[]).map(field => <Field key={field} label={columns[field]}>{p => <select {...p} value={mapping[field] ?? ''} onChange={e => setMapping({ ...mapping, [field]: e.target.value || undefined })}>
        <option value="">Not in this file</option>{headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>}</Field>)}
    </fieldset>}
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit" disabled={!file || !mapping.name}>Preview CSV</button></div>
  </form>
}

export function CsvPreview({ p }: { p: Rec }) {
  return <>
    <table className="table"><thead><tr><th>Rows</th><th>New</th><th>Matched</th><th>Rejected</th></tr></thead><tbody>
      <tr><td data-label="Rows">{p.rows.total}</td><td data-label="New">{p.rows.new} ({p.new.length} customers, {p.effects.sites ?? 0} sites)</td><td data-label="Matched">{p.rows.matched}</td><td data-label="Rejected">{p.rows.rejected}</td></tr>
    </tbody></table>
    {p.possibleDuplicates.length > 0 && <><h3>Possible duplicates ({p.possibleDuplicates.length})</h3><p className="muted">These come in as new customers; review and merge them on the Customers screen afterwards.</p><ul>{p.possibleDuplicates.map((d: Rec) => <li key={d.rows[0]}>Row {d.rows[0]}, {d.name}: shares a {[...new Set(d.duplicates.flatMap((x: Rec) => x.matches))].join(', ')} with {d.duplicates.map((x: Rec) => x.name).join(', ')}</li>)}</ul></>}
    {p.rejected.length > 0 && <><h3>Rejected rows ({p.rejected.length})</h3><ul>{p.rejected.map((r: Rec) => <li key={r.row}>Row {r.row}: {r.reason}</li>)}</ul></>}
    {p.matched.some((m: Rec) => m.differs.length) && <details className="details"><summary>Matched customers whose file values differ (Glove keeps its own)</summary><ul>{p.matched.filter((m: Rec) => m.differs.length).map((m: Rec) => <li key={m.customerId}>Row {m.rows[0]}, {m.name}: {m.differs.join(', ')}</li>)}</ul></details>}
    {p.unusedColumns.length > 0 && <p className="muted">Columns Glove does not use: {p.unusedColumns.join(', ')}</p>}
  </>
}
