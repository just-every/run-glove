import { business, fail, type Context, type Row } from './model'
import { instant, localParts } from './time'

export const shiftDay = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)

/** QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013: validity includes the whole printed day in the revision's zone. */
export function quoteValidity(c: Context, record: Row, value: unknown) {
  const b = business(c.s), site = c.s.sites.find(s => s.id === (record.siteId ?? record.id))
  const zone = c.s.branches.find(x => x.id === (record.branchId ?? site?.branchId))?.timezone ?? b.timezone
  const validUntil = value ?? shiftDay(localParts(c.now, zone).date, b.quoteValidityDays ?? 30)
  if (typeof validUntil !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(validUntil) || !Number.isFinite(Date.parse(`${validUntil}T00:00:00Z`)) || new Date(`${validUntil}T00:00:00Z`).toISOString().slice(0, 10) !== validUntil) return fail('INPUT', 'validUntil is a real date (YYYY-MM-DD).', null, 400)
  return { validUntil, validityZone: zone, validTo: instant(shiftDay(validUntil, 1), '00:00', zone, 'validUntil'), linkExpiresAt: instant(shiftDay(validUntil, 91), '00:00', zone, 'validUntil') }
}
