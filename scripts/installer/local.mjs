import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { operatorInstaller, developmentTarget, previewTarget } from '@runeditrun/rer/operator-installer';
import { selectLocalState } from '@runeditrun/rer/local/state';
import { commandAdapter as createCommandAdapter } from '@runeditrun/rer/adapter';
import { ownerDeploy } from '@runeditrun/rer/deploy';
import { localPortability } from '@runeditrun/rer/portability';
import * as model from './ui/seed.mjs';

export { selectLocalState };
const lifecycle = operatorInstaller({
 database: 'field-service-glove', features: model.features,
 async prepare({ root, input, store }) {
  // export and import run prepare without answers; the saved branding stays.
  if (input.APP_NAME === undefined && input.PRIMARY_COLOR === undefined) return;
  await store.step('Saving application branding');
  await writeFile(join(root, 'src/branding.json'), JSON.stringify({ name: input.APP_NAME, primaryColor: input.PRIMARY_COLOR }, null, 2) + '\n');
 },
});
export const adapter = lifecycle;
export const { install } = lifecycle;
export const commandAdapter = createCommandAdapter(lifecycle, {
 dev: developmentTarget, preview: previewTarget, verify: ['pnpm', ['run', 'verify:app']], deploy: ownerDeploy('deploy.json', lifecycle),
 // Glove's records, timeline, photos, command outcomes and the move-in journal
 // (ik_*) travel in the archive; only the transient batch guard stays behind.
 portability: localPortability({ database: 'field-service-glove', policy: { includeTables: ['oa_operators','oa_bootstrap','oa_external_identities','oa_invitation_cancellations','oa_tokens','oa_auth_settings','oa_auth_audit','oa_domain_rules','oa_logout_events','oc_owner_claims','oc_idp_grants'], excludeTables: ['glove_calendar_credentials','glove_calendar_work','glove_calendar_events','glove_email_stop_secrets','glove_sms_attempts','glove_sms_receipts','glove_visit_reply_secrets','glove_payment_attempts','glove_privacy_guard','glove_mail_callback_auth','glove_quote_secrets','glove_booking_secrets','glove_report_secrets','rer_dependency_keys','rer_dependency_pending','rer_dependency_codes','glove_guard','glove_secrets','glove_lead_secrets','glove_provider_keys','glove_push_subscriptions','glove_tokens'], replaceableTables: ['glove_meta'], product: 'field-service-glove', requiredConfiguration: ['OWNER_EMAIL', 'SESSION_SECRET', 'SETUP_TOKEN', 'AUTH_ORIGIN', 'MAIL_PROVIDER', 'MAIL_FROM'] }, transient: ['local runtime caches and logs'] }),
 setup: { manifestFile: 'rer-setup.json' }, browserModule: 'scripts/installer/ui/seed.mjs',
 // The run site (rer build --site, rer deploy --site, RER_SITE): the homepage, /run and the docs from
 // docs/*.md, written to an ignored folder; its domain is in deploy-site.json.
 site: { entry: 'src/site/pages.tsx', output: 'dist/site', declaration: 'deploy-site.json', config: 'vite.site.config.ts' },
 // Local dev identity: the local-only Worker entry and the build output rer build
 // scans for the dev layer.
 devIdentity: { entry: 'src/server.dev.ts', output: ['dist'] },
 localOnlyKeys: ['RER_DEV_ORIGIN', 'RER_DEV_IDENTITY'],
 product: model.product.name, input: { names: { email: 'OWNER_EMAIL', name: 'displayName' }, async defaults(root) { const { readFile } = await import('node:fs/promises'); const branding = JSON.parse(await readFile(join(root, 'src/branding.json'), 'utf8')); return { APP_NAME: branding.name, PRIMARY_COLOR: branding.primaryColor }; } },
});
