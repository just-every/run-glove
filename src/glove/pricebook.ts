import { Problem, fail, text, oneOf, bump, type Row, type State } from './model'
import { cents, dollars, signedCents, thousandths, quantity, taxCodes } from './money'
import { parseCsv, formatCsv, unguard } from './csv-format'

// MONEY-003, MONEY-006: the price book. Every item (a service, a material, or a flat-rate
// task with labor and parts inside) carries a unit cost and a price. A price is
// fixed, or follows its category's markup: cost × (100 + markup) / 100, rounded
// half up to the cent. A task's cost is the sum of its contents' costs at their
// quantities (each rounded half up to the cent); contents are services or
// materials, never other tasks. Prices change in bulk by a percentage of each
// fixed price in a category (rounded half up); markup prices follow cost.

// QUOTE-007, QUOTE-019: a discount item is a fixed negative price used as a discount line.
export const kinds = ['service', 'material', 'task', 'discount'] as const
export const pricings = ['fixed', 'markup'] as const

/** A percentage as integer hundredths: "5" → 500, "-2.5" → -250. */
export function hundredths(value: unknown, name: string, { min = -9999, max = 100000 } = {}) {
  if (typeof value !== 'string' || !/^-?\d{1,4}(\.\d{1,2})?$/.test(value.trim())) return fail('INPUT', `${name} is a percentage such as 5 or 12.5.`, { field: name }, 400)
  const [whole, part = ''] = value.trim().replace('-', '').split('.')
  const n = (value.trim().startsWith('-') ? -1 : 1) * (Number(whole) * 100 + Number(part.padEnd(2, '0')))
  return n >= min && n <= max ? n : fail('INPUT', `${name} is between ${min / 100}% and ${max / 100}%.`, { field: name }, 400)
}
export const percent = (n: number) => `${n < 0 ? '-' : ''}${Math.floor(Math.abs(n) / 100)}${Math.abs(n) % 100 ? '.' + String(Math.abs(n) % 100).padStart(2, '0').replace(/0$/, '') : ''}`
/** amount × (10000 + h) / 10000, rounded half up to the cent. */
export const scale = (amount: number, h: number) => Math.floor((amount * (10000 + h) + 5000) / 10000)

export type Category = { name: string; markupPercent: string }
export const categoriesOf = (s: State): Category[] => s.business[0]?.priceCategories ?? []
const categoryKey = (name: string) => name.trim().toLowerCase()

const parts = (v: unknown) => {
  if (!Array.isArray(v) || v.length > 10) return fail('INPUT', 'parts is a list of at most 10 supplier part numbers.', { field: 'parts' }, 400)
  return v.map((x, i) => ({ supplier: text(x?.supplier, `parts[${i}].supplier`, { max: 100 }), partNumber: text(x?.partNumber, `parts[${i}].partNumber`, { max: 100 }) }))
}

/** A task's contents: other price-book items (by ID) at a quantity. */
function components(s: State, v: unknown, selfId: string | undefined) {
  if (!Array.isArray(v) || !v.length || v.length > 30) return fail('INPUT', 'A flat-rate task holds between 1 and 30 services or materials.', { field: 'components' }, 400)
  return v.map((x, i) => {
    const item = s.services.find(r => r.id === x?.serviceId) ?? fail('INPUT', `components[${i}] names no price-book item.`, { field: 'components' }, 400)
    if (item.kind === 'task' || item.kind === 'discount' || item.id === selfId) fail('INPUT', `components[${i}]: a task holds services and materials, not tasks.`, { field: 'components' }, 400)
    return { serviceId: item.id, quantity: quantity(thousandths(x?.quantity, `components[${i}].quantity`)) }
  })
}

/** The price-book fields of service.save beyond code, name, checklist and skills. */
export function itemFields(s: State, p: any, existing: Row | null) {
  const kind = oneOf(p.kind ?? existing?.kind ?? 'service', kinds, 'kind')
  const pricing = oneOf(p.pricing ?? 'fixed', pricings, 'pricing')
  const category = text(p.category, 'category', { optional: true, max: 60 })
  if (kind === 'discount' && (pricing !== 'fixed' || signedCents(p.unitPrice, 'unitPrice') >= 0)) fail('INPUT', 'A discount item has a fixed negative price such as -25.00.', { field: 'unitPrice' }, 400)
  if (pricing === 'markup' && !categoriesOf(s).some(c => categoryKey(c.name) === categoryKey(category))) fail('INPUT', 'A markup price needs a category with a markup (pricebook.category).', { field: 'pricing' }, 400)
  return {
    kind, pricing, category: categoriesOf(s).find(c => categoryKey(c.name) === categoryKey(category))?.name ?? category,
    unitCost: kind === 'task' || kind === 'discount' ? '0.00' : dollars(cents(p.unitCost ?? '0', 'unitCost')),
    unitPrice: pricing === 'fixed' ? dollars(kind === 'discount' ? signedCents(p.unitPrice, 'unitPrice') : cents(p.unitPrice, 'unitPrice')) : existing?.unitPrice ?? '0.00',
    description: text(p.description, 'description', { optional: true, max: 2000 }),
    parts: p.parts === undefined ? existing?.parts ?? [] : parts(p.parts),
    components: kind === 'task' ? components(s, p.components, existing?.id) : [],
  }
}

/** Derived figures after any price-book change: task costs from their contents, then markup prices from cost. */
export function reprice(s: State, now: string) {
  const markup = new Map(categoriesOf(s).map(c => [categoryKey(c.name), hundredths(c.markupPercent, 'markupPercent')]))
  const changed: Row[] = []
  for (const pass of ['service', 'task']) for (const item of s.services) {
    if ((item.kind === 'task') !== (pass === 'task')) continue
    const current = s.services.find(r => r.id === item.id)!
    const cost = current.kind === 'task' ? (current.components as Row[]).reduce((sum, x) => sum + Math.floor((cents(s.services.find(r => r.id === x.serviceId)!.unitCost ?? '0.00', 'unitCost') * thousandths(x.quantity, 'quantity') + 500) / 1000), 0) : cents(current.unitCost ?? '0.00', 'unitCost')
    const m = markup.get(categoryKey(current.category ?? ''))
    const price = current.pricing === 'markup' && m !== undefined ? scale(cost, m) : signedCents(current.unitPrice, 'unitPrice')
    if (dollars(cost) !== current.unitCost || dollars(price) !== current.unitPrice) changed.push(bump(s, 'services', current, { unitCost: dollars(cost), unitPrice: dollars(price), repricedAt: now }))
  }
  return changed
}

// The price book as CSV: one row per item; a category's markup on each of its rows.
export const priceColumns = {
  code: 'Code', name: 'Name', kind: 'Kind', category: 'Category', categoryMarkup: 'Category markup %', unit: 'Unit', unitCost: 'Unit cost', pricing: 'Pricing', unitPrice: 'Price', tax: 'Tax',
  description: 'Customer description', parts: 'Supplier part numbers', components: 'Task contents', archived: 'Archived',
} as const
type PriceField = keyof typeof priceColumns

export function priceBookCsv(s: State, costs = true) {
  const fields = (Object.keys(priceColumns) as PriceField[]).filter(f => costs || f !== 'unitCost')
  const markup = new Map(categoriesOf(s).map(c => [categoryKey(c.name), c.markupPercent]))
  const code = (id: string) => s.services.find(r => r.id === id)?.code ?? id
  const rows = s.services.map(x => {
    const v: Record<PriceField, string> = {
      code: x.code, name: x.name, kind: x.kind ?? 'service', category: x.category ?? '', categoryMarkup: markup.get(categoryKey(x.category ?? '')) ?? '', unit: x.unit, unitCost: x.unitCost ?? '0.00', pricing: x.pricing ?? 'fixed', unitPrice: x.unitPrice, tax: x.tax,
      description: x.description ?? '', parts: (x.parts ?? []).map((p: Row) => `${p.supplier}: ${p.partNumber}`).join('; '), components: (x.components ?? []).map((c: Row) => `${code(c.serviceId)} x ${c.quantity}`).join('; '), archived: x.archived ? 'yes' : 'no',
    }
    return fields.map(f => v[f])
  })
  return formatCsv([fields.map(f => priceColumns[f]), ...rows])
}

type Planned = { row: number; code: string; status: 'new' | 'updated' | 'unchanged'; fields: Record<string, any>; changes: string[] }

/**
 * A price-book CSV against the current items, matched by Code: each row is new,
 * updated (the fields that change), unchanged, or rejected with its reason.
 * Columns map by Glove's own headers, or by `mapping` ({field: column}).
 * Checklists, skills and images stay as they are. A markup-priced row's Price
 * is ignored (it follows cost and the category markup).
 */
export function planPriceBook(s: State, file: unknown, given: unknown) {
  const body = typeof (file as any)?.text === 'string' ? (file as any).text as string : fail('INPUT', 'file is {name, text} with the CSV.', { field: 'file' }, 400)
  if (body.length > 2_000_000) fail('IMPORT_SIZE', 'A price-book CSV is at most 2 MB.', null, 400)
  let records: string[][]
  try { records = parseCsv(body) } catch (error) { return fail('IMPORT_PARSE', (error as Error).message, null, 400) }
  const headers = (records[0] ?? []).map(h => h.trim())
  const mapping: Partial<Record<PriceField, string>> = given && typeof given === 'object' ? given as any : Object.fromEntries(Object.entries(priceColumns).flatMap(([f, label]) => { const h = headers.find(x => x.toLowerCase() === label.toLowerCase()); return h ? [[f, h]] : [] }))
  for (const [f, h] of Object.entries(mapping)) if (!(f in priceColumns) || typeof h !== 'string' || !headers.includes(h)) fail('IMPORT_MAPPING', `Map ${f} to one of this file's columns.`, { headers, fields: priceColumns }, 400)
  if (!mapping.code || !mapping.name) fail('IMPORT_MAPPING', 'Choose the Code and Name columns.', { headers, fields: priceColumns }, 400)
  const rows = records.slice(1).map((cells, i) => ({ row: i + 2, cells })).filter(r => r.cells.some(c => c.trim()))
  if (rows.length > 5000) fail('IMPORT_SIZE', 'A price-book CSV has at most 5000 rows.', null, 400)
  const at = Object.fromEntries(Object.entries(mapping).map(([f, h]) => [f, headers.indexOf(h!)]))
  const rejected: { row: number; reason: string }[] = [], planned: Planned[] = [], markups = new Map<string, { row: number; value: string; name: string }>(), seen = new Map<string, number>()
  const reasonOf = (error: unknown) => { if (!(error instanceof Problem)) throw error; const field = String((error.details as any)?.field ?? '').replace(/\[.*$/, '') as PriceField; return mapping[field] ? `${mapping[field]}: ${error.message}` : error.message }
  for (const { row, cells } of rows) {
    const v = Object.fromEntries(Object.entries(at).map(([f, i]) => [f, unguard((cells[i] ?? '').trim()).trim()])) as Partial<Record<PriceField, string>>
    if (cells.length > headers.length) { rejected.push({ row, reason: `Row has ${cells.length} cells; the header has ${headers.length}.` }); continue }
    try {
      const code = text(v.code, 'code', { max: 40 })
      if (seen.has(code)) fail('INPUT', `Code ${code} is already on row ${seen.get(code)}.`, { field: 'code' }, 400)
      const existing = s.services.find(r => r.code === code)
      const category = text(v.category, 'category', { optional: true, max: 60 })
      if (v.categoryMarkup) {
        const value = percent(hundredths(v.categoryMarkup, 'categoryMarkup', { min: 0 })), earlier = markups.get(categoryKey(category))
        if (!category) fail('INPUT', 'A category markup needs a category.', { field: 'categoryMarkup' }, 400)
        if (earlier && earlier.value !== value) fail('INPUT', `Category ${category} has markup ${earlier.value}% on row ${earlier.row}.`, { field: 'categoryMarkup' }, 400)
        markups.set(categoryKey(category), { row, value, name: category })
      }
      const fields: Record<string, any> = {
        code, name: text(v.name, 'name', { max: 200 }),
        ...('kind' in mapping ? { kind: oneOf(v.kind?.toLowerCase() || 'service', kinds, 'kind') } : {}),
        ...('category' in mapping ? { category } : {}),
        ...('unit' in mapping ? { unit: text(v.unit, 'unit', { optional: true, max: 20 }) || 'each' } : {}),
        ...('unitCost' in mapping ? { unitCost: dollars(cents(v.unitCost || '0', 'unitCost')) } : {}),
        ...('pricing' in mapping ? { pricing: oneOf(v.pricing?.toLowerCase() || 'fixed', pricings, 'pricing') } : {}),
        ...('tax' in mapping ? { tax: oneOf(v.tax || (s.business[0]?.currency === 'AUD' ? 'GST' : 'TAXABLE'), taxCodes, 'tax') } : {}),
        ...('description' in mapping ? { description: text(v.description, 'description', { optional: true, max: 2000 }) } : {}),
        ...('parts' in mapping ? { parts: parts((v.parts ?? '').split(';').map(x => x.trim()).filter(Boolean).map(x => { const i = x.indexOf(':'); return { supplier: i < 0 ? '' : x.slice(0, i).trim(), partNumber: i < 0 ? x : x.slice(i + 1).trim() } })) } : {}),
        ...('components' in mapping ? { componentCodes: (v.components ?? '').split(';').map(x => x.trim()).filter(Boolean).map((x, i) => { const m = /^(.+?)\s+x\s+(\S+)$/i.exec(x) ?? fail('INPUT', `Task contents ${i + 1} is "CODE x quantity".`, { field: 'components' }, 400); return { code: m[1].trim(), quantity: quantity(thousandths(m[2], 'components')) } }) } : {}),
        ...('archived' in mapping ? { archived: /^(yes|true|1)$/i.test(v.archived ?? '') } : {}),
      }
      const pricing = fields.pricing ?? existing?.pricing ?? 'fixed'
      const discountItem = (fields.kind ?? existing?.kind) === 'discount'
      if (pricing === 'fixed') fields.unitPrice = 'unitPrice' in mapping || !existing ? dollars(discountItem ? signedCents(v.unitPrice, 'unitPrice') : cents(v.unitPrice, 'unitPrice')) : existing.unitPrice
      if (discountItem && (pricing !== 'fixed' || signedCents(fields.unitPrice ?? existing?.unitPrice, 'unitPrice') >= 0)) fail('INPUT', `${code}: a discount item has a fixed negative price such as -25.00.`, { field: 'unitPrice' }, 400)
      seen.set(code, row)
      planned.push({ row, code, status: existing ? 'unchanged' : 'new', fields, changes: [] })
    } catch (error) { rejected.push({ row, reason: reasonOf(error) }) }
  }
  // Task contents name codes in Glove or in this file (services and materials only).
  const kindOf = (code: string) => planned.find(p => p.code === code)?.fields.kind ?? s.services.find(r => r.code === code)?.kind ?? (planned.some(p => p.code === code) ? 'service' : undefined)
  for (const p of [...planned]) {
    const kind = p.fields.kind ?? s.services.find(r => r.code === p.code)?.kind ?? 'service'
    const contents: { code: string }[] = p.fields.componentCodes ?? []
    const bad = kind === 'task' && !contents.length && !s.services.find(r => r.code === p.code)?.components?.length ? 'A flat-rate task lists its contents.' : contents.map(c => !kindOf(c.code) ? `Task contents name ${c.code}, which is not in the price book or this file.` : kindOf(c.code) === 'task' ? `Task contents name ${c.code}, another task.` : '').find(Boolean)
    if (bad) { planned.splice(planned.indexOf(p), 1); rejected.push({ row: p.row, reason: `${mapping.components ?? 'Task contents'}: ${bad}` }) }
    else if ((p.fields.pricing ?? 'fixed') === 'markup' && !markups.has(categoryKey(p.fields.category ?? '')) && !categoriesOf(s).some(c => categoryKey(c.name) === categoryKey(p.fields.category ?? ''))) { planned.splice(planned.indexOf(p), 1); rejected.push({ row: p.row, reason: `${mapping.pricing ?? 'Pricing'}: markup needs a category with a markup.` }) }
  }
  const markupOf = (name: string) => categoriesOf(s).find(c => categoryKey(c.name) === categoryKey(name))?.markupPercent
  for (const p of planned) {
    const existing = s.services.find(r => r.code === p.code)
    if (!existing) continue
    const code = (id: string) => s.services.find(r => r.id === id)?.code
    p.changes = Object.entries(p.fields).filter(([k, v]) => k === 'componentCodes' ? JSON.stringify(v) !== JSON.stringify((existing.components ?? []).map((c: Row) => ({ code: code(c.serviceId), quantity: c.quantity }))) : JSON.stringify(v) !== JSON.stringify(existing[k] ?? (k === 'kind' ? 'service' : k === 'pricing' ? 'fixed' : k === 'parts' ? [] : k === 'archived' ? false : k === 'unitCost' ? '0.00' : ''))).map(([k]) => k === 'componentCodes' ? 'components' : k)
    if (p.changes.length) p.status = 'updated'
  }
  const categories = [...markups.values()].filter(m => markupOf(m.name) !== m.value).map(m => ({ name: categoriesOf(s).find(c => categoryKey(c.name) === categoryKey(m.name))?.name ?? m.name, markupPercent: m.value }))
  const count = (status: Planned['status']) => planned.filter(p => p.status === status).length
  return { headers, mapping, rows: { total: rows.length, new: count('new'), updated: count('updated'), unchanged: count('unchanged'), rejected: rejected.length }, planned, categories, rejected: rejected.sort((a, b) => a.row - b.row) }
}
