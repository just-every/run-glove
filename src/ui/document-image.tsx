import { useEffect, useState } from 'react'
import type { ReportFile } from '../glove/service-reports'

export function DocumentImage({ file, token, alt, scope = 'reports' }: { file: ReportFile; token?: string; alt: string; scope?: 'reports' | 'quote' }) {
  const [src, setSrc] = useState(''), [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    let objectUrl = ''
    setSrc(''); setError('')
    const path = token ? `/api/glove/public/${scope}/files/${file.fileId}` : `/api/glove/files/${file.fileId}`
    fetch(path, { signal: controller.signal, cache: 'no-store', credentials: token ? 'omit' : 'same-origin', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async response => { if (!response.ok) throw new Error('This image is unavailable.'); return response.blob() })
      .then(blob => { if (!controller.signal.aborted) { objectUrl = URL.createObjectURL(blob); setSrc(objectUrl) } })
      .catch(() => { if (!controller.signal.aborted) setError('This image is unavailable. Ask the business for a new report link.') })
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [file.fileId, token, scope])
  return error ? <p role="alert">{error}</p> : src ? <img src={src} alt={alt} style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', height: 'auto' }} /> : <p className="muted">Loading image…</p>
}
