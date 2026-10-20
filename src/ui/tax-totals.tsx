import type { Rec } from './api'
import { money } from './controls'

/** Every approved document displays its own frozen jurisdiction breakdown. */
export function TaxTotalRows({ totals }: { totals: Rec }) {
  const rows = totals.taxBreakdown
  return rows?.length ? <>{rows.map((r: Rec) => <tr key={`${r.branchId ?? 'main'}-${r.jurisdictionId}`}><td colSpan={3}>{r.jurisdiction} · {r.rate}% on {money(r.taxable)}{totals.taxContext?.exempt ? ' · exempt certificate on file' : ''}</td><td>{money(r.tax)}</td></tr>)}</> : <tr><td colSpan={3}>{totals.currency === 'USD' ? 'Sales tax (no jurisdiction configured)' : 'GST (10%)'}</td><td>{money(totals.gst)}</td></tr>
}
