import type { Rec } from './api'

/** Internal source history remains read-only on the record that owned it. */
export function SourceNotes({ row }: { row: Rec }) {
  const notes: Rec[] = row.importedNotes ?? [], attachments: Rec[] = row.importedAttachments ?? []
  if (!notes.length && !attachments.length) return null
  return <section className="panel" aria-label="Imported notes and attachments">
    <h3>Imported notes and attachments</h3>
    <p className="muted">Internal source history from {row.importSource?.system ?? row.source?.system}. Kept on its original record.</p>
    {notes.map(note => <div key={note.sourceId}>
      <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{note.text}</p>
      <p className="muted">{note.sourceTime ? <>Source time <time dateTime={note.sourceTime}>{note.sourceTime}</time></> : 'Source time not supplied'}</p>
    </div>)}
    {!!attachments.length && <ul>{attachments.map(attachment => <li key={attachment.sourceId} style={{ overflowWrap: 'anywhere' }}>{attachment.name} · {attachment.bytes.status === 'retained' ? 'file kept in the move-in record' : 'file missing: not included in the move-in'}</li>)}</ul>}
  </section>
}
