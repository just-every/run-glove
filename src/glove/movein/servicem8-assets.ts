import { type SourceBundle, type SourceRecord, type MappingResult } from '../../modules/import-kit/src/d1/index'
import { Problem, fail } from '../model'
import { calendarDate } from '../receivables'
import { siteId } from './servicem8'

const fields = ['make', 'model', 'serial', 'installedOn', 'manufacturerWarrantyUntil', 'laborWarrantyUntil', 'refrigerant', 'location'] as const
const str = (value: unknown) => typeof value === 'string' ? value.trim() : ''

/** ServiceM8 defines custom asset fields, but no service-site reference. The
 * owner supplies a Glove crosswalk; source labels never choose native fields. */
export function assetMapping(bundle: SourceBundle, rejectedJob: (id: string) => boolean) {
  const rows = (kind: string) => bundle.records.filter(r => r.kind === kind)
  return (record: SourceRecord): MappingResult => {
    const o = record.payload as any
    if (record.kind === 'assettype') return { effects: [], unmapped: [{ reason: 'Retained source asset type; used by explicitly reviewed equipment.' }] }
    if (record.kind === 'equipment-map') {
      if (!rows('asset').some(r => r.sourceId === o.uuid)) return { effects: [], rejection: 'This equipment crosswalk has no matching asset in asset.json.' }
      return { effects: [], unmapped: [{ reason: 'Owner-authored Glove crosswalk retained with the reviewed source asset.' }] }
    }
    const unmapped = Object.keys(o).filter(k => !['uuid', 'active', 'asset_type_uuid', 'company_uuid', 'name', 'asset_code', 'field_data'].includes(k)).map(field => ({ field, reason: 'Retained source field; no native mapping.' }))
    if (String(o.active) === '0') return { effects: [], unmapped: [...unmapped, { field: 'inactive asset', reason: 'Deleted source equipment is retained as history, never installed.' }] }
    try {
      const choices = rows('equipment-map').filter(r => r.sourceId === record.sourceId)
      if (choices.length !== 1) fail('IMPORT_EQUIPMENT', 'Provide exactly one reviewed equipment-map.json row for this asset; no site is guessed.')
      const choice = choices[0].payload as any
      if (Object.keys(choice).some(k => !['uuid', 'job_uuid', 'fields'].includes(k))) fail('IMPORT_EQUIPMENT', 'The equipment crosswalk contains an unsupported choice.')
      const job = rows('job').find(r => r.sourceId === choice.job_uuid)?.payload as any
      if (!job || rejectedJob(choice.job_uuid) || !str(job.job_address)) fail('IMPORT_EQUIPMENT', 'Choose an exported, accepted job with a service address for this asset.')
      if (job.company_uuid !== o.company_uuid || !rows('company').some(r => r.sourceId === o.company_uuid)) fail('IMPORT_EQUIPMENT', 'The asset and its chosen service site must belong to the same exported customer.')
      const types = rows('assettype').filter(r => r.sourceId === o.asset_type_uuid)
      if (types.length !== 1 || !str((types[0].payload as any).name)) fail('IMPORT_EQUIPMENT', 'Include the asset type with its name in assettype.json.')
      if (!choice.fields || typeof choice.fields !== 'object' || Array.isArray(choice.fields) || Object.keys(choice.fields).some(k => !fields.includes(k as any))) fail('IMPORT_EQUIPMENT', 'Choose only supported equipment fields in the crosswalk.')
      if (!Array.isArray(o.field_data)) fail('IMPORT_EQUIPMENT', 'The asset must include its documented field_data array, even when empty.')
      const seen = new Set<string>(), values: Record<string, string> = {}
      for (const field of o.field_data) {
        if (!str(field?.uuid) || seen.has(field.uuid) || typeof field.fieldValue !== 'string') fail('IMPORT_EQUIPMENT', 'Asset fields need unique identities and string values.')
        seen.add(field.uuid)
      }
      for (const field of fields) {
        const selected = choice.fields[field]
        const source = selected === undefined ? undefined : o.field_data.find((f: any) => f.uuid === selected)
        if (selected !== undefined && (!str(selected) || !source)) fail('IMPORT_EQUIPMENT', 'A chosen equipment field is absent from this source asset.')
        const value = str(source?.fieldValue)
        values[field] = field.endsWith('Until') || field === 'installedOn' ? value ? calendarDate(value) : '' : value
        if (values[field].length > (field === 'location' ? 200 : field === 'refrigerant' ? 40 : 100)) fail('IMPORT_EQUIPMENT', 'An equipment field exceeds its native length; review it before importing.')
      }
      const chosen = new Set(Object.values(choice.fields))
      for (const field of o.field_data) if (!chosen.has(field.uuid)) unmapped.push({ field: `asset field ${field.uuid}: ${str(field.fieldName)}`, reason: 'Retained in source; not assigned to a native equipment field.' })
      const type = str((types[0].payload as any).name)
      if (type.length > 100) fail('IMPORT_EQUIPMENT', 'The asset type exceeds the native equipment type length.')
      return { effects: [{ targetKind: 'equipment', targetId: `sm8-${o.uuid}`, value: { id: `sm8-${o.uuid}`, version: 1, customerId: `sm8-${o.company_uuid}`, siteId: siteId(o.company_uuid, str(job.job_address)), type, ...values, photos: [], importedAsset: { name: str(o.name), code: str(o.asset_code), typeId: o.asset_type_uuid, siteChosenFromJob: choice.job_uuid }, source: { system: 'ServiceM8', kind: 'asset', id: o.uuid } } }], unmapped }
    } catch (error) { if (error instanceof Problem) return { effects: [], rejection: error.message }; throw error }
  }
}
