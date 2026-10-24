import { canonicalJson, sha256, type SourceBundle, type SourceRecord } from '../../modules/import-kit/src/d1/index'
import { fail } from '../model'
import { str } from './export-mapping'

export const jobberConnection = (value: any): any[] => {
  if (Array.isArray(value)) return value
  if (value?.pageInfo?.hasNextPage) fail('IMPORT_PARSE', 'Save every Jobber connection page separately; an unfinished nested connection cannot be imported.', null, 400)
  if (Array.isArray(value?.nodes)) return value.nodes
  if (Array.isArray(value?.edges)) return value.edges.map((e: any) => e.node)
  if (value !== undefined && value !== null) fail('IMPORT_PARSE', 'Export the complete Jobber connection as nodes or edges.', null, 400)
  return []
}

const owners: Record<string, string> = { ClientNote: 'clients', RequestNote: 'requests', QuoteNote: 'quotes', JobNote: 'jobs', InvoiceNote: 'invoices' }
const unions: Record<string, string[]> = {
  clients: ['ClientNote'], requests: ['ClientNote', 'RequestNote'], quotes: ['ClientNote', 'RequestNote', 'QuoteNote'],
  jobs: ['ClientNote', 'RequestNote', 'QuoteNote', 'JobNote'], invoices: ['ClientNote', 'RequestNote', 'QuoteNote', 'JobNote', 'InvoiceNote'],
}
const noteValue = (n: any) => ({ sourceType: str(n.__typename), sourceId: str(n.id), text: n.message, sourceTime: n.createdAt ?? null })
const attachmentValue = (a: any) => ({ sourceId: str(a?.id), noteId: str(a?.note?.id), name: str(a?.fileName), size: a?.fileSize, contentType: str(a?.contentType) })
const clientId = (r: SourceRecord) => r.kind === 'clients' ? r.sourceId : str((r.payload as any).client?.id)

/** Linked notes are kept once at their exported owner, never copied into field evidence. */
export function jobberNotes(bundle: SourceBundle, record: SourceRecord) {
  const payload: any = record.payload, notes: any[] = [], attachments: any[] = []
  const seenNotes = new Map<string, string>(), seenAttachments = new Map<string, string>()
  const ownerOf = (note: any): SourceRecord => {
    if (!unions[record.kind]?.includes(note?.__typename) || !str(note.id) || typeof note.message !== 'string') fail('IMPORT_NOTE', 'Export each Jobber note with its supported __typename, id and message.', null, 400)
    if (note.createdAt !== undefined && note.createdAt !== null && (typeof note.createdAt !== 'string' || !/(?:Z|[+-]\d\d:\d\d)$/.test(note.createdAt) || !Number.isFinite(Date.parse(note.createdAt)))) fail('IMPORT_NOTE', 'A source note time must be a timestamp with an explicit offset.', null, 400)
    const ownerKind = owners[note.__typename]
    const candidates = bundle.records.filter(r => r.kind === ownerKind).filter(r => {
      const value: any = (r.payload as any).notes
      const rows = Array.isArray(value) ? value : value?.nodes ?? value?.edges?.map((e: any) => e.node) ?? []
      return Array.isArray(rows) && rows.some((n: any) => n?.__typename === note.__typename && str(n.id) === str(note.id))
    })
    if (candidates.length !== 1) fail('IMPORT_NOTE', `Include exactly one exported ${ownerKind} owner containing ${note.__typename} ${str(note.id)}; inherited notes cannot be assigned to the current record.`, null, 400)
    const owner = candidates[0]
    const originals = jobberConnection((owner.payload as any).notes).filter(n => n.__typename === note.__typename && str(n.id) === str(note.id))
    if (clientId(owner) !== clientId(record) || originals.some(n => canonicalJson(noteValue(n)) !== canonicalJson(noteValue(note)))) fail('IMPORT_NOTE', 'The linked Jobber note differs from its owning record or belongs to another client; use one consistent export snapshot.', null, 400)
    return owner
  }
  const exportedNotes = jobberConnection(payload.notes)
  for (const note of exportedNotes) {
    const owner = ownerOf(note), value = noteValue(note), key = `${value.sourceType}:${value.sourceId}`, encoded = canonicalJson(value)
    if (seenNotes.has(key) && seenNotes.get(key) !== encoded) fail('IMPORT_NOTE', 'A Jobber note has conflicting exported definitions.', null, 400)
    if (!seenNotes.has(key) && owner.kind === record.kind && owner.sourceId === record.sourceId) notes.push({ ...value, owner: { kind: record.kind, sourceId: record.sourceId } })
    seenNotes.set(key, encoded)
  }
  for (const attachment of jobberConnection(payload.noteAttachments)) {
    const descriptor = attachmentValue(attachment)
    if (!descriptor.sourceId || !descriptor.name || !descriptor.noteId || !Number.isSafeInteger(descriptor.size) || descriptor.size < 0) fail('IMPORT_ATTACHMENT', 'Every Jobber attachment needs its source id, note id, filename and non-negative integer file size.', null, 400)
    const linked = exportedNotes.filter(n => str(n.id) === descriptor.noteId)
    if (linked.length !== 1) fail('IMPORT_ATTACHMENT', 'Include the attachment note exactly once in this record’s complete notes connection to establish ownership.', null, 400)
    const owner = ownerOf(linked[0])
    if (owner.kind !== record.kind || owner.sourceId !== record.sourceId) {
      const originals = jobberConnection((owner.payload as any).noteAttachments).filter(a => str(a.id) === descriptor.sourceId)
      if (originals.length !== 1 || canonicalJson(attachmentValue(originals[0])) !== canonicalJson(descriptor)) fail('IMPORT_ATTACHMENT', 'Include the inherited attachment on its explicitly exported note owner with the same descriptor.', null, 400)
      continue
    }
    const encoded = canonicalJson(descriptor)
    if (seenAttachments.has(descriptor.sourceId)) {
      if (seenAttachments.get(descriptor.sourceId) !== encoded) fail('IMPORT_ATTACHMENT', 'A Jobber attachment has conflicting exported definitions.', null, 400)
      continue
    }
    seenAttachments.set(descriptor.sourceId, encoded)
    const artifact = `attachments/${sha256(descriptor.sourceId).slice(0, 24)}`, file = bundle.artifacts.find(f => f.name === artifact)
    if (file && descriptor.size !== file.size) fail('IMPORT_ATTACHMENT', 'The saved attachment size differs from the Jobber descriptor; use one consistent snapshot.', null, 400)
    attachments.push({ ...descriptor, owner: { kind: record.kind, sourceId: record.sourceId }, bytes: file ? { status: 'retained', artifact, sha256: file.sha256, size: file.size } : { status: 'missing', reason: 'The attachment bytes were not supplied.' } })
  }
  return { importedNotes: notes, importedAttachments: attachments }
}
