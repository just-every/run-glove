import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { fail, newId, text, type Context, type Row } from './model'

/** Consent names one configured recipient, never an arbitrary later provider. */
const binding = (b: Row) => b.model ? sha256(canonicalJson({ url: b.model.url, model: b.model.model, connectionId: b.model.connectionId ?? '', connectedAt: b.model.connectedAt })) : ''

export function configureRequestPhotos(c: Context, b: Row, p: any) {
  if (p.modelPhotosEnabled !== true) return { enabled: false }
  if (!b.model) fail('MODEL', 'Connect the model provider before allowing request photos.')
  if (p.confirmNoTraining !== true) fail('PHOTO_TERMS', 'Confirm that the provider agreement for this account prohibits training on the photos.', null, 400)
  return {
    enabled: true, id: newId(), binding: binding(b),
    providerName: text(p.photoProviderName, 'photoProviderName', { max: 120 }), providerHost: new URL(b.model.url).host,
    noTrainingTerms: text(p.noTrainingTerms, 'noTrainingTerms', { max: 4000 }),
    acceptedAt: c.now, by: { id: c.actor.id, name: c.actor.name },
  }
}

export function requestPhotoDisclosure(b: Row) {
  const policy = b.intake?.modelPhotos
  if (!b.intake?.enabled || !policy?.enabled || policy.binding !== binding(b)) return null
  return {
    id: policy.id, providerName: policy.providerName, providerHost: policy.providerHost,
    text: `I separately allow my request photos to go to the configured model provider ${policy.providerName} (${policy.providerHost}) to help draft this quote. The sent copies have EXIF and location metadata removed. The provider agreement must prohibit training on these photos. Contact the office to withdraw permission for later calls. My originals remain private to the office.`,
  }
}

export function consentForRequest(b: Row, input: any, fileIds: string[], at: string) {
  if (!input?.accepted) return null
  const disclosure = requestPhotoDisclosure(b)
  if (!disclosure || input.accepted !== true || input.disclosureId !== disclosure.id || !fileIds.length) fail('PHOTO_CONSENT', 'The photo disclosure changed. Refresh the form and choose photo permission again.', null, 409)
  return { ...disclosure, fileIds, acceptedAt: at }
}
