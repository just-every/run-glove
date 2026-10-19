import { roles, fail, text, oneOf, find, expectVersion, put, bump, event, newId, type Context, type Collection, type Row } from '../model'
import { cents, dollars, taxCodes } from '../money'
import { validZone } from '../time'
import { grantable } from '../access'
import type { Handler } from './types'

// The business, its people's roles, price book, technicians, customers and sites.

/** Create a record, or update it at the version the person saw. */
function save(c: Context, kind: Collection, p: any, fields: Record<string, unknown>): Row {
  if (p.id === undefined) return put(c.s, kind, { id: newId(), version: 1, createdAt: c.now, createdBy: c.actor.id, ...fields })
  const row = find(c.s, kind, p.id)
  expectVersion(row, p.version)
  return bump(c.s, kind, row, { ...fields, updatedAt: c.now, updatedBy: c.actor.id })
}

const checklist = (value: unknown) => {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 30) return fail('INPUT', 'A checklist has at most 30 items.', null, 400)
  return value.map((item, i) => ({ label: text(item?.label, `checklist[${i}].label`, { max: 200 }), required: item?.required === true }))
}

export const setup: Handler = async (c, type, p, db) => {
  switch (type) {
    case 'business.save': {
      const fields = { name: text(p.name, 'name', { max: 200 }), abn: text(p.abn, 'abn', { optional: true, max: 20 }), timezone: validZone(p.timezone), email: text(p.email, 'email', { optional: true, max: 200 }), phone: text(p.phone, 'phone', { optional: true, max: 50 }), address: text(p.address, 'address', { optional: true, max: 500 }), paymentTermsDays: Number.isInteger(p.paymentTermsDays) && p.paymentTermsDays >= 0 && p.paymentTermsDays <= 120 ? p.paymentTermsDays : 14, currency: 'AUD' }
      const existing = c.s.business[0]
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
      const operator = await db.prepare('SELECT id,role,display_name AS name,status FROM oa_operators WHERE id=?').bind(p.operatorId).first<any>()
      if (!operator) fail('OPERATOR', 'Invite this person first, then assign their role.', null, 404)
      if (operator.id === c.actor.id) fail('OWN_ROLE', 'You cannot change your own role.')
      if (operator.role === 'owner' && role !== 'owner') fail('OWNER_ROLE', 'The installation owner keeps owner authority.')
      c.sql.push({ sql: 'INSERT INTO glove_roles(operator_id,role,assigned_by,assigned_at) VALUES(?,?,?,?) ON CONFLICT(operator_id) DO UPDATE SET role=excluded.role,assigned_by=excluded.assigned_by,assigned_at=excluded.assigned_at', params: [operator.id, role, c.actor.id, c.now] })
      event(c, { jobId: null, subjectKind: 'operator', subjectId: operator.id, kind: 'role.set', summary: `${operator.name} is now ${custom?.name ?? role}`, data: { role } })
      return { operatorId: operator.id, role }
    }
    case 'service.save': {
      const code = text(p.code, 'code', { max: 40 })
      if (c.s.services.some(s => s.code === code && s.id !== p.id)) fail('DUPLICATE', `Service code ${code} is already used.`)
      const row = save(c, 'services', p, { code, name: text(p.name, 'name', { max: 200 }), unit: text(p.unit, 'unit', { optional: true, max: 20 }) || 'each', unitPrice: dollars(cents(p.unitPrice, 'unitPrice')), tax: oneOf(p.tax ?? 'GST', taxCodes, 'tax'), checklist: checklist(p.checklist), archived: p.archived === true })
      event(c, { jobId: null, subjectKind: 'service', subjectId: row.id, kind: 'service.saved', summary: `Price book: ${row.code} ${row.name} at $${row.unitPrice} before tax`, data: null })
      return row
    }
    case 'technician.save': {
      const operatorId = p.operatorId ? text(p.operatorId, 'operatorId', { max: 100 }) : null
      if (operatorId && c.s.technicians.some(t => t.operatorId === operatorId && t.id !== p.id)) fail('DUPLICATE', 'That person is already linked to another technician.')
      const row = save(c, 'technicians', p, { name: text(p.name, 'name', { max: 200 }), operatorId, phone: text(p.phone, 'phone', { optional: true, max: 50 }), epa608: text(p.epa608, 'epa608', { optional: true, max: 40 }), active: p.active !== false })
      event(c, { jobId: null, subjectKind: 'technician', subjectId: row.id, kind: 'technician.saved', summary: `Technician ${row.name}${row.operatorId ? ' (signs in)' : ''}`, data: null })
      return row
    }
    case 'customer.save': {
      const row = save(c, 'customers', p, { name: text(p.name, 'name', { max: 200 }), abn: text(p.abn, 'abn', { optional: true, max: 20 }), email: text(p.email, 'email', { optional: true, max: 200 }), phone: text(p.phone, 'phone', { optional: true, max: 50 }), contact: text(p.contact, 'contact', { optional: true, max: 200 }), billingAddress: text(p.billingAddress, 'billingAddress', { optional: true, max: 500 }) })
      event(c, { jobId: null, subjectKind: 'customer', subjectId: row.id, kind: 'customer.saved', summary: `Customer ${row.name}`, data: null })
      return row
    }
    case 'site.save': {
      const customer = find(c.s, 'customers', p.customerId)
      const row = save(c, 'sites', p, { customerId: customer.id, address: text(p.address, 'address', { max: 500 }), accessNotes: text(p.accessNotes, 'accessNotes', { optional: true, max: 1000 }) })
      event(c, { jobId: null, subjectKind: 'site', subjectId: row.id, kind: 'site.saved', summary: `Site ${row.address} for ${customer.name}`, data: null })
      return row
    }
  }
}
