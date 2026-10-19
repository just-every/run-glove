import { business, fail, roles, text, type Context, type State } from './model'
import { cents, signedCents, type Line, type Totals } from './money'

// QUOTE-007 / TEAM-001: the owner limits who may give a discount and its
// maximum, as a percent of the document's gross (positive-line) subtotal,
// counting discount lines and the document discount together. The owner is
// unlimited; a role the owner has not listed gives no discount.

export type DiscountLimits = Record<string, string>

export function discountLimits(s: State, value: unknown): DiscountLimits {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('INPUT', 'discountLimits maps roles to a maximum discount percent.', { field: 'discountLimits' }, 400)
  const out: DiscountLimits = {}
  for (const [role, limit] of Object.entries(value)) {
    const known = role.startsWith('custom:') ? s.roles.some(r => `custom:${r.id}` === role) : (roles as readonly string[]).includes(role) && role !== 'owner'
    if (!known) fail('INPUT', `discountLimits names an unknown role (${role}).`, { field: 'discountLimits' }, 400)
    const percent = text(limit, `discountLimits.${role}`, { max: 6 })
    if (!/^\d{1,3}(\.\d{1,2})?$/.test(percent) || Number(percent) > 100) fail('INPUT', 'A discount limit is a percent from 0 to 100 with up to two decimal places.', { field: `discountLimits.${role}` }, 400)
    out[role] = String(Number(percent))
  }
  return out
}

/** Discount cents a document gives: its discount lines plus its document discount. */
export const givenCents = (rows: Line[], totals: Totals) => rows.reduce((n, l) => n + (l.discount ? -signedCents(l.total, 'total') : 0), 0) + (totals.discount ? cents(totals.discount.amount, 'discount') : 0)

/** Refuse a discount above the actor's limit; carrying an accepted discount unchanged is not giving one. */
export function checkDiscount(c: Context, rows: Line[], totals: Totals, carried = 0) {
  const given = givenCents(rows, totals)
  if (given <= carried || c.actor.role === 'owner') return
  const gross = rows.reduce((n, l) => n + Math.max(0, signedCents(l.total, 'total')), 0)
  const limit = business(c.s).discountLimits?.[c.actor.role]
  if (limit === undefined || BigInt(given) * 10000n > BigInt(gross) * BigInt(Math.round(Number(limit) * 100))) fail('DISCOUNT_LIMIT', limit === undefined ? 'The owner has not allowed your role to give discounts.' : `Your role may discount at most ${limit}% of the subtotal.`, { limit: limit ?? null }, 403)
}
