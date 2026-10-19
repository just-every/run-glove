import { canonicalJson, sha256 } from '../../modules/import-kit/src/d1/index'
import { fail, text, put, bump, event, newId, business, type Context } from '../model'
import { cents, dollars } from '../money'
import { categoriesOf, hundredths, percent, scale, reprice, planPriceBook } from '../pricebook'
import type { Handler } from './types'

// MONEY-003: category markups, bulk price changes by percentage, and the
// price-book CSV import (preview, then commit exactly that preview).

function setCategories(c: Context, next: { name: string; markupPercent: string }[]) {
  const all = [...categoriesOf(c.s)]
  for (const n of next) { const i = all.findIndex(x => x.name.toLowerCase() === n.name.toLowerCase()); if (i < 0) all.push(n); else all[i] = { ...all[i], markupPercent: n.markupPercent } }
  bump(c.s, 'business', business(c.s), { priceCategories: all })
}

export const pricebook: Handler = async (c, type, p) => {
  switch (type) {
    case 'pricebook.category': {
      const name = text(p.name, 'name', { max: 60 }), markupPercent = percent(hundredths(p.markupPercent, 'markupPercent', { min: 0 }))
      setCategories(c, [{ name, markupPercent }])
      const repriced = reprice(c.s, c.now)
      event(c, { jobId: null, subjectKind: 'business', subjectId: 'business', kind: 'pricebook.category', summary: `Price book: ${name} marked up ${markupPercent}% on cost (${repriced.length} item${repriced.length === 1 ? '' : 's'} repriced)`, data: { name, markupPercent, repriced: repriced.map(r => r.id) } })
      return { name, markupPercent, repriced: repriced.map(r => ({ id: r.id, code: r.code, unitPrice: r.unitPrice })) }
    }
    case 'pricebook.adjust': {
      const category = text(p.category, 'category', { max: 60 }), h = hundredths(p.percent, 'percent', { min: -9999, max: 100000 })
      const items = c.s.services.filter(x => (x.category ?? '').toLowerCase() === category.toLowerCase() && (x.pricing ?? 'fixed') === 'fixed' && !x.archived)
      if (!items.length) fail('NOT_FOUND', `No fixed-price items in ${category}.`, null, 404)
      const changed = items.map(x => bump(c.s, 'services', x, { unitPrice: dollars(scale(cents(x.unitPrice, 'unitPrice'), h)), updatedAt: c.now, updatedBy: c.actor.id }))
      reprice(c.s, c.now)
      event(c, { jobId: null, subjectKind: 'business', subjectId: 'business', kind: 'pricebook.adjusted', summary: `Price book: ${category} prices ${h < 0 ? 'lowered' : 'raised'} ${percent(Math.abs(h))}% (${changed.length} item${changed.length === 1 ? '' : 's'})`, data: { category, percent: percent(h), items: changed.map(r => r.id) } })
      return { category, percent: percent(h), items: changed.map(r => ({ id: r.id, code: r.code, unitPrice: r.unitPrice })) }
    }
    case 'pricebook.import': {
      const plan = planPriceBook(c.s, p.file, p.mapping)
      const fingerprint = sha256(canonicalJson(plan as any))
      const preview = { fingerprint, rows: plan.rows, mapping: plan.mapping, categories: plan.categories, rejected: plan.rejected, changes: plan.planned.filter(x => x.status !== 'unchanged').map(x => ({ row: x.row, code: x.code, status: x.status, changes: x.changes })) }
      if (p.fingerprint === undefined) {
        event(c, { jobId: null, subjectKind: 'business', subjectId: 'business', kind: 'pricebook.previewed', summary: `Price book CSV previewed: ${plan.rows.new} new, ${plan.rows.updated} updated, ${plan.rows.rejected} rejected; no prices changed`, data: { fingerprint } })
        return { committed: false, preview }
      }
      if (p.fingerprint !== fingerprint) fail('IMPORT_STALE', 'The price book plans differently now (the file or Glove changed since the preview). Preview it again.', { fingerprint })
      if (plan.categories.length) setCategories(c, plan.categories)
      for (const x of plan.planned) {
        const { componentCodes: _codes, ...fields } = x.fields
        if (x.status === 'new') put(c.s, 'services', { id: newId(), version: 1, createdAt: c.now, createdBy: c.actor.id, kind: 'service', unit: 'each', unitCost: '0.00', pricing: 'fixed', unitPrice: '0.00', tax: 'GST', category: '', description: '', parts: [], components: [], checklist: [], requiredSkills: [], archived: false, ...fields })
        else if (x.status === 'updated') bump(c.s, 'services', c.s.services.find(r => r.code === x.code)!, { ...fields, updatedAt: c.now, updatedBy: c.actor.id })
      }
      // Contents resolve by code once every new item exists.
      for (const x of plan.planned) if (x.status !== 'unchanged' && x.fields.componentCodes) {
        const item = c.s.services.find(r => r.code === x.code)!
        put(c.s, 'services', { ...item, components: x.fields.componentCodes.map((k: { code: string; quantity: string }) => ({ serviceId: c.s.services.find(r => r.code === k.code)!.id, quantity: k.quantity })) })
      }
      const repriced = reprice(c.s, c.now)
      event(c, { jobId: null, subjectKind: 'business', subjectId: 'business', kind: 'pricebook.imported', summary: `Price book CSV: ${plan.rows.new} new, ${plan.rows.updated} updated, ${plan.rows.unchanged} unchanged, ${plan.rows.rejected} rejected${repriced.length ? `; ${repriced.length} repriced` : ''}`, data: { fingerprint } })
      return { committed: true, preview }
    }
  }
}
