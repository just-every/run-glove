import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'

const read = (f: File) => new Promise<{ mediaType: string; base64: string }>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve({ mediaType: f.type, base64: String(r.result).split(',')[1] }); r.onerror = () => reject(r.error); r.readAsDataURL(f) })

export function TaxExemption({ s, customer, run }: { s: Glove; customer: Rec; run: Run }) {
  const existing = customer.taxExemption
  const [form, setForm] = useState({ certificateNumber: existing?.certificateNumber ?? '', expires: existing?.expires ?? '' })
  const [file, setFile] = useState<File | null>(null)
  const { error, setError, act } = useAction()
  if (s.business[0]?.currency === 'AUD') return null
  const editable = can(s.actor, 'customer.save')
  const save = () => run('customer.save', { ...customer, taxExemption: form })
  return <section className="panel" aria-label="Sales-tax exemption"><h2>Sales-tax exemption</h2><p className="muted">An exemption applies only with its private certificate on file and through its expiry date. This records your evidence; Glove does not verify it with a provider.</p>
    <form onSubmit={e => { e.preventDefault(); void act(save()) }}><fieldset className="form-grid two" disabled={!editable}>
      <Field label="Exemption certificate number">{p => <input {...p} value={form.certificateNumber} required onChange={e => setForm({ ...form, certificateNumber: e.target.value })} />}</Field>
      <Field label="Exemption expiry date">{p => <input {...p} type="date" value={form.expires} required onChange={e => setForm({ ...form, expires: e.target.value })} />}</Field>
    </fieldset>{editable && <div className="actions"><button type="submit">Save exemption details</button>{existing && <button type="button" onClick={() => act(run('customer.save', { ...customer, taxExemption: null }))}>Remove exemption</button>}</div>}</form>
    {existing && <><p>{existing.certificate ? <a href={`/api/glove/files/${existing.certificate.fileId}`} download>Download private certificate</a> : 'Certificate document missing; tax still applies.'}</p>{editable && <form onSubmit={e => { e.preventDefault(); if (!file) return; if (file.size > 10 * 1024 * 1024) { setError({ code: 'SIZE', message: 'Choose a certificate up to 10 MB.' }); return } void act(read(file).then(file => run('customer.certificate', { customerId: customer.id, version: customer.version, file }))) }}>
      <Field label="Private exemption certificate" hint="PDF, JPEG or PNG, up to 10 MB. The original bytes are kept privately with this customer.">{p => <input {...p} type="file" accept="application/pdf,image/jpeg,image/png" required onChange={e => setFile(e.target.files?.[0] ?? null)} />}</Field><button type="submit">File certificate document</button>
    </form>}</>}
    <Problem error={error} />
  </section>
}
