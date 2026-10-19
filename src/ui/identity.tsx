import { useState } from 'react'
import type { Rec } from './api'
import { Field } from './controls'

// The business's US identity (MONEY-002): legal name, DBA, contractor
// licenses by trade and state, insurance and logo, saved with business.save.

/** A logo keeps its own format (a PNG keeps its transparency); the server refuses one over 1.5 MB. */
const asIs = (file: File) => new Promise<{ mediaType: string; base64: string }>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve({ mediaType: file.type, base64: String(r.result).split(',')[1] }); r.onerror = () => reject(r.error); r.readAsDataURL(file) })

export type Identity = { legalName: string; dba: string; licenses: { trade: string; state: string; number: string }[]; insurance: { carrier: string; policy: string; expires: string }; logo?: { mediaType: string; base64: string } }
export const identityOf = (b: Rec | undefined): Identity => ({ legalName: b?.legalName ?? '', dba: b?.dba ?? '', licenses: b?.licenses ?? [], insurance: b?.insurance ?? { carrier: '', policy: '', expires: '' } })
export const identityPayload = (v: Identity) => ({ legalName: v.legalName, dba: v.dba, licenses: v.licenses, insurance: v.insurance.carrier ? v.insurance : null, ...(v.logo ? { logo: v.logo } : {}) })

export function IdentityFields({ b, value, onChange }: { b: Rec | undefined; value: Identity; onChange: (v: Identity) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const license = (i: number, change: Partial<Identity['licenses'][number]>) => onChange({ ...value, licenses: value.licenses.map((l, j) => j === i ? { ...l, ...change } : l) })
  return <>
    <h3>Business identity</h3>
    <div className="form-grid two">
      <Field label="Legal name">{p => <input {...p} value={value.legalName} onChange={e => onChange({ ...value, legalName: e.target.value })} />}</Field>
      <Field label="Doing business as (DBA)">{p => <input {...p} value={value.dba} onChange={e => onChange({ ...value, dba: e.target.value })} />}</Field>
      <Field label="Insurance carrier">{p => <input {...p} value={value.insurance.carrier} onChange={e => onChange({ ...value, insurance: { ...value.insurance, carrier: e.target.value } })} />}</Field>
      <Field label="Insurance policy number">{p => <input {...p} value={value.insurance.policy} onChange={e => onChange({ ...value, insurance: { ...value.insurance, policy: e.target.value } })} required={!!value.insurance.carrier} />}</Field>
      <Field label="Insurance expires">{p => <input {...p} type="date" value={value.insurance.expires} onChange={e => onChange({ ...value, insurance: { ...value.insurance, expires: e.target.value } })} required={!!value.insurance.carrier} />}</Field>
      <Field label="Logo">{p => <input {...p} type="file" accept="image/png,image/jpeg,image/webp" onChange={async e => { const f = e.target.files?.[0]; if (f) { const img = await asIs(f); setPreview(`data:${img.mediaType};base64,${img.base64}`); onChange({ ...value, logo: img }) } }} />}</Field>
    </div>
    {(preview || b?.logo) && <img className="business-logo" src={preview ?? `/api/glove/files/${b!.logo.fileId}`} alt="Business logo" />}
    <fieldset className="licenses"><legend>Contractor licenses</legend>
      {value.licenses.map((l, i) => <div className="form-grid three" key={i} role="group" aria-label={`License ${i + 1}`}>
        <Field label="Trade">{p => <input {...p} value={l.trade} onChange={e => license(i, { trade: e.target.value })} required />}</Field>
        <Field label="State">{p => <input {...p} value={l.state} maxLength={2} onChange={e => license(i, { state: e.target.value.toUpperCase() })} required />}</Field>
        <Field label="License number">{p => <input {...p} value={l.number} onChange={e => license(i, { number: e.target.value })} required />}</Field>
        <button type="button" className="quiet" onClick={() => onChange({ ...value, licenses: value.licenses.filter((_, j) => j !== i) })}>Remove license</button>
      </div>)}
      <button type="button" onClick={() => onChange({ ...value, licenses: [...value.licenses, { trade: '', state: '', number: '' }] })}>Add a license</button>
    </fieldset>
  </>
}
