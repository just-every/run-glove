import { roles, fail, text, oneOf, find, expectVersion, put, bump, event, newId, type Context, type Collection, type Row } from '../model'
import { taxCodes, cents, dollars } from '../money'
import { validZone } from '../time'
import { grantable } from '../access'
import { availability, rules, siteZip, skills } from '../eligibility'
import { duplicatesOf } from '../duplicates'
import { itemFields, reprice } from '../pricebook'
import { image } from './field'
import { watchSettings } from '../margins'
import type { Handler } from './types'

// The business, its people's roles, price book, technicians, customers and sites.

/** Create a record, or update it at the version the person saw. */
function save(c: Context, kind: Collection, p: any, fields: Record<string, unknown>): Row {
  if (p.id === undefined) return put(c.s, kind, { id: newId(), version: 1, createdAt: c.now, createdBy: c.actor.id, ...fields })
  const row = find(c.s, kind, p.id)
  expectVersion(row, p.version)
  return bump(c.s, kind, row, { ...fields, updatedAt: c.now, updatedBy: c.actor.id })
}

/**
 * MONEY-002: the business's legal name, DBA, contractor licenses (trade, state,
 * number), insurance and logo, each kept when a save leaves it out. The EIN is
 * the business's tax ID field (abn, kept from the first release).
 */
async function identity(c: Context, p: any, existing: Row | undefined) {
  const keep = <T,>(key: string, parse: () => T) => p[key] !== undefined ? parse() : existing?.[key]
  const licenses = keep('licenses', () => {
    if (!Array.isArray(p.licenses) || p.licenses.length > 20) return fail('INPUT', 'licenses lists at most 20 licenses.', { field: 'licenses' }, 400)
    return p.licenses.map((l: any, i: number) => ({ trade: text(l?.trade, `licenses[${i}].trade`, { max: 60 }), state: /^[A-Z]{2}$/.test(l?.state ?? '') ? l.state : fail('INPUT', `licenses[${i}].state is a two-letter state such as TX.`, { field: `licenses[${i}].state` }, 400), number: text(l?.number, `licenses[${i}].number`, { max: 60 }) }))
  }) ?? []
  const insurance = keep('insurance', () => p.insurance ? { carrier: text(p.insurance.carrier, 'insurance.carrier', { max: 200 }), policy: text(p.insurance.policy, 'insurance.policy', { max: 100 }), expires: /^\d{4}-\d{2}-\d{2}$/.test(p.insurance.expires ?? '') ? p.insurance.expires : fail('INPUT', 'insurance.expires is a date (YYYY-MM-DD).', { field: 'insurance.expires' }, 400) } : null) ?? null
  const logo = p.logo !== undefined ? (p.logo === null ? null : await image(c, p.logo, 'business', 'logo')) : existing?.logo ?? null
  return { legalName: text(p.legalName ?? existing?.legalName, 'legalName', { optional: true, max: 200 }), dba: text(p.dba ?? existing?.dba, 'dba', { optional: true, max: 200 }), licenses, insurance, logo }
}

const checklist = (value: unknown) => {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 30) return fail('INPUT', 'A checklist has at most 30 items.', null, 400)
  return value.map((item, i) => ({ label: text(item?.label, `checklist[${i}].label`, { max: 200 }), required: item?.required === true }))
}

/** A customer's other contacts (CUST-001): name with an optional role, phone and email. */
const contacts = (value: unknown) => {
  if (!Array.isArray(value) || value.length > 20) return fail('INPUT', 'contacts is a list of at most 20 people.', { field: 'contacts' }, 400)
  return value.map((x, i) => ({ name: text(x?.name, `contacts[${i}].name`, { max: 200 }), role: text(x?.role, `contacts[${i}].role`, { optional: true, max: 100 }), phone: text(x?.phone, `contacts[${i}].phone`, { optional: true, max: 50 }), email: text(x?.email, `contacts[${i}].email`, { optional: true, max: 200 }) }))
}

/** A customer's own fields as customer.save and the CSV import (CUST-003) accept them. */
export const customerFields = (p: any) => ({
  name: text(p.name, 'name', { max: 200 }), kind: oneOf(p.kind ?? 'residential', ['residential', 'business'] as const, 'kind'), abn: text(p.abn, 'abn', { optional: true, max: 20 }), email: text(p.email, 'email', { optional: true, max: 200 }), phone: text(p.phone, 'phone', { optional: true, max: 50 }), contact: text(p.contact, 'contact', { optional: true, max: 200 }), billingAddress: text(p.billingAddress, 'billingAddress', { optional: true, max: 500 }),
  billingContact: text(p.billingContact, 'billingContact', { optional: true, max: 200 }), apEmail: text(p.apEmail, 'apEmail', { optional: true, max: 200 }), requirePo: p.requirePo === true,
  ...(p.contacts !== undefined ? { contacts: contacts(p.contacts) } : {}),
})

/** A site's fields as site.save and the CSV import accept them. */
export const siteFields = (p: any) => ({ address: text(p.address, 'address', { max: 500 }), zip: siteZip(p.zip, String(p.address ?? '')), accessNotes: text(p.accessNotes, 'accessNotes', { optional: true, max: 1000 }), contact: text(p.contact, 'contact', { optional: true, max: 200 }), contactPhone: text(p.contactPhone, 'contactPhone', { optional: true, max: 50 }), contactEmail: text(p.contactEmail, 'contactEmail', { optional: true, max: 200 }) })

export const setup: Handler = async (c, type, p, db) => {
  switch (type) {
    case 'business.save': {
      const fields = { name: text(p.name, 'name', { max: 200 }), abn: text(p.abn, 'abn', { optional: true, max: 20 }), timezone: validZone(p.timezone), email: text(p.email, 'email', { optional: true, max: 200 }), phone: text(p.phone, 'phone', { optional: true, max: 50 }), address: text(p.address, 'address', { optional: true, max: 500 }), paymentTermsDays: Number.isInteger(p.paymentTermsDays) && p.paymentTermsDays >= 0 && p.paymentTermsDays <= 120 ? p.paymentTermsDays : 14, currency: 'AUD', eligibility: rules(p.eligibility ?? c.s.business[0]?.eligibility), marginWatch: watchSettings(p.marginWatch ?? c.s.business[0]?.marginWatch) }
      const existing = c.s.business[0]
      Object.assign(fields, await identity(c, p, existing))
      const row = existing ? (expectVersion(existing, p.version), bump(c.s, 'business', existing, { ...fields, updatedAt: c.now })) : put(c.s, 'business', { id: 'business', version: 1, createdAt: c.now, counters: {}, ...fields })
      event(c, { jobId: null, subjectKind: 'business', subjectId: row.id, kind: 'business.saved', summary: `Business details saved (${row.timezone})`, data: fields })
      return row
    }
    case 'role.save': {
      const permissions = Array.isArray(p.permissions) ? [...new Set(p.permissions)] : fail('INPUT', 'permissions is a list of named permissions.', { field: 'permissions' }, 400)
      for (const name of permissions) oneOf(name, grantable, 'each permission')
      const name = text(p.name, 'name', { max: 60 })
      if ([...roles, 'custom'].includes(name.toLowerCase()) || c.s.roles.some(r => r.name.toLowerCase() === name.toLowerCase() && r.id !== p.id)) fail('DUPLICATE', `A role called ${name} already exists.`)
      const row = save(c, 'roles', p, { name, permissions: grantable.filter(g => permissions.includes(g)) })
      event(c, { jobId: null, subjectKind: 'role', subjectId: row.id, kind: 'role.saved', summary: `Role ${row.name}: ${row.permissions.length ? row.permissions.join(', ') : 'read only'}`, data: { permissions: row.permissions } })
      return row
    }
    case 'role.set': {
      const custom = typeof p.role === 'string' && p.role.startsWith('custom:') ? find(c.s, 'roles', p.role.slice(7), 'roles') : null
      const role = custom ? `custom:${custom.id}` : oneOf(p.role, roles, 'role')
      const operator = await db.prepare('SELECT id,role,display_name AS name,status FROM oa_operators WHERE id=?').bind(text(p.operatorId, 'operatorId', { max: 100 })).first<any>()
      if (!operator) fail('OPERATOR', 'Invite this person first, then assign their role.', null, 404)
      if (operator.id === c.actor.id) fail('OWN_ROLE', 'You cannot change your own role.')
      if (operator.role === 'owner' && role !== 'owner') fail('OWNER_ROLE', 'The installation owner keeps owner authority.')
      c.sql.push({ sql: 'INSERT INTO glove_roles(operator_id,role,assigned_by,assigned_at) VALUES(?,?,?,?) ON CONFLICT(operator_id) DO UPDATE SET role=excluded.role,assigned_by=excluded.assigned_by,assigned_at=excluded.assigned_at', params: [operator.id, role, c.actor.id, c.now] })
      // FIELD-004: a person who is no longer a Technician loses their phones' push subscriptions.
      if (role !== 'technician') c.sql.push({ sql: 'DELETE FROM glove_push_subscriptions WHERE operator_id=?', params: [operator.id] })
      event(c, { jobId: null, subjectKind: 'operator', subjectId: operator.id, kind: 'role.set', summary: `${operator.name} is now ${custom?.name ?? role}`, data: { role } })
      return { operatorId: operator.id, role }
    }
    case 'service.save': {
      const code = text(p.code, 'code', { max: 40 })
      if (c.s.services.some(s => s.code === code && s.id !== p.id)) fail('DUPLICATE', `Service code ${code} is already used.`)
      // MONEY-003: kind, cost, category and markup or fixed price, supplier part numbers, the customer's description, a task's contents and images.
      const existing = p.id === undefined ? null : find(c.s, 'services', p.id)
      let row = save(c, 'services', p, { code, name: text(p.name, 'name', { max: 200 }), unit: text(p.unit, 'unit', { optional: true, max: 20 }) || 'each', ...itemFields(c.s, p, existing), tax: oneOf(p.tax ?? 'GST', taxCodes, 'tax'), checklist: checklist(p.checklist), requiredSkills: p.requiredSkills === undefined ? [] : skills(p.requiredSkills, 'requiredSkills'), archived: p.archived === true, images: existing?.images ?? [] })
      if (p.image) row = put(c.s, 'services', { ...row, images: [...row.images, await image(c, p.image, row.id, 'image')] })
      reprice(c.s, c.now)
      row = find(c.s, 'services', row.id)
      event(c, { jobId: null, subjectKind: 'service', subjectId: row.id, kind: 'service.saved', summary: `Price book: ${row.code} ${row.name} at $${row.unitPrice} before tax (cost $${row.unitCost})`, data: null })
      return row
    }
    case 'technician.save': {
      const operatorId = p.operatorId ? text(p.operatorId, 'operatorId', { max: 100 }) : null
      if (operatorId && c.s.technicians.some(t => t.operatorId === operatorId && t.id !== p.id)) fail('DUPLICATE', 'That person is already linked to another technician.')
      const row = save(c, 'technicians', p, { name: text(p.name, 'name', { max: 200 }), operatorId, phone: text(p.phone, 'phone', { optional: true, max: 50 }), epa608: text(p.epa608, 'epa608', { optional: true, max: 40 }), ...(p.costRate !== undefined && p.costRate !== '' ? { costRate: dollars(cents(p.costRate, 'costRate')) } : {}), active: p.active !== false, ...availability(p, p.id === undefined ? null : find(c.s, 'technicians', p.id)) })
      event(c, { jobId: null, subjectKind: 'technician', subjectId: row.id, kind: 'technician.saved', summary: `Technician ${row.name}${row.operatorId ? ' (signs in)' : ''}`, data: null })
      return row
    }
    case 'customer.save': {
      // A business customer's billing contact and accounts-payable email stay apart from its site contacts (on each site).
      const row = save(c, 'customers', p, customerFields(p))
      // CUST-005: entry flags customers that share a phone, email or address.
      const duplicates = duplicatesOf(c.s, row)
      event(c, { jobId: null, subjectKind: 'customer', subjectId: row.id, kind: 'customer.saved', summary: `Customer ${row.name}${duplicates.length ? ` (possible duplicate of ${duplicates.map(d => d.name).join(', ')})` : ''}`, data: null })
      return { ...row, duplicates }
    }
    case 'site.save': {
      const customer = find(c.s, 'customers', p.customerId)
      const row = save(c, 'sites', p, { customerId: customer.id, ...siteFields(p) })
      event(c, { jobId: null, subjectKind: 'site', subjectId: row.id, kind: 'site.saved', summary: `Site ${row.address} for ${customer.name}`, data: null })
      return row
    }
  }
}
