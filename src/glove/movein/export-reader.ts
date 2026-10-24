import { canonicalJson, sha256, type SourceBundle } from '../../modules/import-kit/src/d1/index'
import { fail } from '../model'
import { parseCsv } from '../csv-format'
import type { MoveInFile } from './servicem8'
import { recurringColumns } from './fieldpulse-recurrence'
const jobberBalanceColumns = ['Invoice #', 'Total ($)', 'Balance ($)', 'Tax amount ($)', 'Issued date', 'Due date']
const jobberColumns = ['Name', 'Description', 'Unit Price', 'Taxable', 'Category', 'Active']

/** Saved provider responses only. No credential, URL fetch, or executable input. */
export function exportBundle(files: unknown, namespace: string, kinds: readonly string[], envelope: 'response' | 'data') : SourceBundle {
  if (!Array.isArray(files) || !files.length || files.length > 200) fail('IMPORT_FILES', 'Add between 1 and 200 saved export files.', null, 400)
  const bundle: SourceBundle = { records: [], artifacts: [], diagnostics: [] }, names = new Set<string>()
  let total = 0
  for (const file of files as MoveInFile[]) {
    const name = typeof file?.name === 'string' ? file.name : ''
    if (names.has(name)) fail('IMPORT_FILES', `${name} was added twice.`, null, 400)
    names.add(name)
    const csvColumns = namespace === 'jobber' && name === 'invoice-balances.csv' ? jobberBalanceColumns : namespace === 'jobber' && /^products-services(?:-\d+)?\.csv$/.test(name) ? jobberColumns : namespace === 'fieldpulse' ? name === 'invoice-balances.csv' ? ['#ID','Invoice Total','Amount Due','Invoiced Date','Due Date','Tax','Pre-Tax Subtotal'] : name === 'recurring-jobs.csv' ? recurringColumns : null : null
    const housecallInvoices = namespace === 'housecallpro' && /^job-invoices-[a-zA-Z0-9_-]{1,100}\.json$/.test(name)
    const jobNotes = namespace === 'servicetitan' && /^job-notes-[a-zA-Z0-9_-]{1,100}\.json$/.test(name)
    const jobAttachments = namespace === 'servicetitan' && /^job-attachments-[a-zA-Z0-9_-]{1,100}\.json$/.test(name)
    const match = /^([a-z-]+)(?:-\d+)?\.json$/.exec(name), attachment = /^attachments\/(?!\.\.?$)[a-zA-Z0-9_.-]{1,180}$/.test(name)
    let bytes: Uint8Array
    if (attachment && typeof file.base64 === 'string') {
      try { bytes = Uint8Array.from(atob(file.base64), c => c.charCodeAt(0)) } catch { return fail('IMPORT_FILES', `${name} is not base64.`, null, 400) }
    } else if ((csvColumns || housecallInvoices || jobNotes || jobAttachments || match && kinds.includes(match[1])) && typeof file.text === 'string') bytes = new TextEncoder().encode(file.text)
    else return fail('IMPORT_FILES', `${name || 'A file'} is not a supported ${namespace} export list or attachments/<id>. See IMPORT.md.`, null, 400)
    total += bytes.length
    if (total > 1_400_000) fail('IMPORT_SIZE', 'This move-in is over 1.4 MB. Split the source into smaller complete batches.', null, 400)
    let binary = ''
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    const artifact = { name, sha256: sha256(bytes), size: bytes.length, original: { status: 'available' as const, base64: btoa(binary) } }
    bundle.artifacts.push(artifact)
    if (attachment) continue
    if (csvColumns) {
      const [headers, ...rows] = parseCsv(file.text!)
      if (!headers || new Set(headers).size !== headers.length || csvColumns.some(h => !headers.includes(h))) fail('IMPORT_PARSE', `${name} needs the documented source columns (see IMPORT.md).`, null, 400)
      const identity = namespace === 'jobber' ? name === 'invoice-balances.csv' ? 'Invoice #' : 'Name' : name === 'recurring-jobs.csv' ? 'Recurring Job ID' : '#ID'
      rows.forEach((cells, index) => {
        if (cells.length !== headers.length) fail('IMPORT_PARSE', `${name} row ${index + 2} has a different number of columns.`, null, 400)
        const object = Object.fromEntries(headers.map((h, i) => [h, cells[i]]))
        if (!object[identity]) fail('IMPORT_PARSE', `${name} row ${index + 2} has no ${identity}.`, null, 400)
        bundle.records.push({ namespace, kind: namespace === 'jobber' && name !== 'invoice-balances.csv' ? 'products-services' : name.slice(0, -4), sourceId: object[identity], payload: object, payloadHash: sha256(canonicalJson(object)), artifactHash: artifact.sha256, location: { artifact: name, row: index + 2 } })
      })
      continue
    }
    let parsed: any
    try { parsed = JSON.parse(file.text!) } catch { return fail('IMPORT_PARSE', `${name} is not valid JSON.`, null, 400) }
    if (parsed?.errors?.length) fail('IMPORT_PARSE', `${name} holds GraphQL errors; export a successful response.`, null, 400)
    if (namespace === 'jobber' && parsed?.data?.[match![1]]) {
      const connection = parsed.data[match![1]]
      // Top-level pages are separate files; nested connections must be complete.
      parsed = connection.nodes ?? connection.edges?.map((e: any) => e.node) ?? connection
    }
    if (parsed?.error === true) fail('IMPORT_PARSE', `${name} holds a provider error, not an export.`, null, 400)
    if (namespace === 'housecallpro') {
      const key = housecallInvoices ? 'invoices' : match![1]
      parsed = parsed?.[key] ?? parsed
      if (Array.isArray(parsed?.data)) parsed = parsed.data
    }
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.[envelope]) ? parsed[envelope] : parsed?.[envelope]?.id !== undefined ? [parsed[envelope]] : parsed?.id !== undefined ? [parsed] : null
    if (!rows) fail('IMPORT_PARSE', `${name} must hold a list, a ${envelope} response, or one detailed record.`, null, 400)
    for (const [index, object] of rows!.entries()) {
      if ((jobNotes || jobAttachments) && object && typeof object === 'object' && !Array.isArray(object)) {
        const sourceId = name.slice(0, -5) + ':' + sha256(canonicalJson(object)).slice(0, 24)
        bundle.records.push({ namespace, kind: jobNotes ? 'job-notes' : 'job-attachments', sourceId, payload: object, payloadHash: sha256(canonicalJson(object)), artifactHash: artifact.sha256, location: { artifact: name, row: index + 1 } })
        continue
      }
      const sourceId = namespace === 'housecallpro' && !housecallInvoices && ['materials','services'].includes(match![1]) ? object?.uuid : object?.id
      if (!object || typeof object !== 'object' || Array.isArray(object) || !['string', 'number'].includes(typeof sourceId) || !String(sourceId).trim() || (typeof sourceId === 'number' && !Number.isSafeInteger(sourceId))) fail('IMPORT_PARSE', `${name} item ${index + 1} needs an exact source id.`, null, 400)
      bundle.records.push({ namespace, kind: housecallInvoices ? 'job-invoices' : match![1], sourceId: String(sourceId), payload: object, payloadHash: sha256(canonicalJson(object)), artifactHash: artifact.sha256, location: { artifact: name, row: index + 1 } })
    }
  }
  return bundle
}
