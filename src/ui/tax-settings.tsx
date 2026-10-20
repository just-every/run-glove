import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'

export type TaxSettings = { jurisdictions: { id: string; name: string; rate: string; zips: string[]; taxLabor: boolean }[]; defaultJurisdictionId?: string }
export const taxSettingsOf = (record?: Rec): TaxSettings => record?.taxSettings ?? { jurisdictions: [] }

/** Owner-entered combined rates; no claim of provider verification or filing. */
export function TaxFields({ value, onChange }: { value: TaxSettings; onChange: (v: TaxSettings) => void }) {
  const update = (id: string, change: Partial<TaxSettings['jurisdictions'][number]>) => onChange({ ...value, jurisdictions: value.jurisdictions.map(j => j.id === id ? { ...j, ...change } : j) })
  return <fieldset><legend>US sales-tax jurisdictions</legend><p className="muted">Enter the combined state, county, city and district rate. ZIP codes select a rate; a site can select a jurisdiction explicitly when ZIP codes overlap. Glove calculates tax and does not file returns.</p>
    {value.jurisdictions.map(j => <fieldset key={j.id}><legend>{j.name || 'New jurisdiction'}</legend><div className="form-grid two">
      <Field label="Jurisdiction name">{p => <input {...p} value={j.name} required onChange={e => update(j.id, { name: e.target.value })} />}</Field>
      <Field label="Combined sales-tax rate (%)">{p => <input {...p} inputMode="decimal" value={j.rate} required onChange={e => update(j.id, { rate: e.target.value })} />}</Field>
      <Field label="Tax jurisdiction ZIP codes">{p => <input {...p} defaultValue={j.zips.join(', ')} onChange={e => update(j.id, { zips: e.target.value.split(/[\s,]+/).filter(Boolean) })} />}</Field>
      <label className="check-line"><input type="checkbox" checked={j.taxLabor} onChange={e => update(j.id, { taxLabor: e.target.checked })} /> Tax service labor in this jurisdiction</label>
    </div><button type="button" onClick={() => onChange({ ...value, defaultJurisdictionId: value.defaultJurisdictionId === j.id ? undefined : value.defaultJurisdictionId, jurisdictions: value.jurisdictions.filter(x => x.id !== j.id) })}>Remove jurisdiction</button></fieldset>)}
    <button type="button" onClick={() => onChange({ ...value, jurisdictions: [...value.jurisdictions, { id: crypto.randomUUID(), name: '', rate: '', zips: [], taxLabor: true }] })}>Add tax jurisdiction</button>
    {value.jurisdictions.length > 0 && <Field label="Default tax jurisdiction" hint="Used only when no ZIP matches. Without a default, an unmatched address needs an explicit site jurisdiction.">{p => <select {...p} value={value.defaultJurisdictionId ?? ''} onChange={e => onChange({ ...value, defaultJurisdictionId: e.target.value || undefined })}><option value="">Require a matching address</option>{value.jurisdictions.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}</select>}</Field>}
  </fieldset>
}

export function TaxJurisdictionChoice({ s, branchId, value, onChange }: { s: Glove; branchId?: string | null; value: string; onChange: (v: string) => void }) {
  const branch = s.branches.find(b => b.id === branchId)
  const settings = branch?.taxSettings ?? s.business[0]?.taxSettings
  if (!settings?.jurisdictions?.length) return null
  return <Field label="Site tax jurisdiction" hint="Use the address match, or select the combined jurisdiction explicitly.">{p => <select {...p} value={value} onChange={e => onChange(e.target.value)}><option value="">Match service address</option>{settings.jurisdictions.map((j: Rec) => <option key={j.id} value={j.id}>{j.name} · {j.rate}%</option>)}</select>}</Field>
}

export function SiteTax({ s, site, run }: { s: Glove; site: Rec; run: Run }) {
  const [value, setValue] = useState(site.taxJurisdictionId ?? '')
  const { error, act } = useAction()
  if (!can(s.actor, 'site.save') || s.business[0]?.currency === 'AUD') return null
  return <form onSubmit={e => { e.preventDefault(); void act(run('site.save', { ...site, taxJurisdictionId: value })) }}><TaxJurisdictionChoice s={s} branchId={site.branchId} value={value} onChange={setValue} /><Problem error={error} />{value !== (site.taxJurisdictionId ?? '') && <button type="submit">Save site tax jurisdiction</button>}</form>
}
