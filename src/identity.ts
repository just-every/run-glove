// This edition's identity: what its installed Lobby and its run site say.
// The name and colour are the ones setup saves in src/branding.json; the
// tagline is the run site's meta description: the approved hero's subhead (design desk, 17 Oct 2026).
import type { EditionIdentity } from './base/identity'
import branding from './branding.json'
import site from '../deploy-site.json'

export const identity: EditionIdentity = {
  product: branding.name,
  deployment: branding.name,
  purpose: '{deployment} runs field service for a small trade business: quotes, booked visits, technician evidence and invoice preparation.',
  tagline: 'Glove answers your calls and texts, books the job, sends the tech, takes payment on site, and keeps every maintenance plan on schedule.',
  signInPath: '/signin',
  // The run site `rer deploy --site` publishes (deploy-site.json).
  runSite: `https://${site.domain}`,
  // An installed instance serves the Lobby at /.
  installedHome: 'lobby',
  theme: '/rer-theme.css',
  mark: '/brand/mark.svg',
  fonts: '/fonts/fonts.css',
  accentColor: branding.primaryColor,
}
