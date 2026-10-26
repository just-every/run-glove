import { bump, business, newId, type Context, type Row } from '../model'
import { requiredLinks } from './links'

/** Accounting identities belong to both an Intuit environment and company. */
export function connectCompany(c: Context, realmId: string, mode: string, auth: 'manual' | 'oauth', extra: Record<string, unknown> = {}) {
  const b = business(c.s), previous = b.qbo ?? b.qboPrevious
  const companies = [...(b.qboCompanies ?? []).filter((company: Row) => company.connectionId !== previous?.connectionId), ...(previous ? [previous] : [])]
  const known = companies.find((company: Row) => company.realmId === realmId && company.mode === mode)
  const same = previous?.realmId === realmId && previous.mode === mode
  return bump(c.s, 'business', b, { qbo: { ...known, ...(same ? previous : { requiredLinks: requiredLinks(c.s), linksConfirmedAt: null, linksConfirmedBy: null }), realmId, mode, auth, connectionId: known?.connectionId ?? newId(), configuredAt: c.now, ...extra }, qboPrevious: null, qboCompanies: companies })
}
