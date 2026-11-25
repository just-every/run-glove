// Test-only D1 meter: counts the rows every statement reads (meta.rows_read), the
// way Cloudflare bills them. It wraps the Worker's DB binding only while a test
// has switched it on, so no other test sees a changed binding.
export type Tally = { on: boolean; rows: number; statements: number }

export function metered(db: any, tally: Tally) {
  const raw = new WeakMap<object, any>()
  const count = (meta: any) => { tally.rows += meta?.rows_read ?? 0; tally.statements++ }
  const wrap = (statement: any): any => {
    const proxy = new Proxy(statement, { get(target, key) {
      if (key === 'bind') return (...values: unknown[]) => wrap(target.bind(...values))
      if (key === 'all' || key === 'run') return async () => { const result = await target[key](); count(result.meta); return result }
      if (key === 'first') return async (column?: string) => { const result = await target.all(); count(result.meta); const row = result.results[0] ?? null; return column ? row?.[column] : row }
      if (key === 'raw') return async () => { const result = await target.all(); count(result.meta); return result.results.map((r: object) => Object.values(r)) }
      const value = target[key]
      return typeof value === 'function' ? value.bind(target) : value
    } })
    raw.set(proxy, statement)
    return proxy
  }
  return new Proxy(db, { get(target, key) {
    if (key === 'prepare') return (sql: string) => wrap(target.prepare(sql))
    if (key === 'batch') return async (list: object[]) => { const results = await target.batch(list.map(s => raw.get(s) ?? s)); for (const r of results) count(r.meta); return results }
    const value = target[key]
    return typeof value === 'function' ? value.bind(target) : value
  } })
}
