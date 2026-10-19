// CUST-003: the customer CSV's columns and RFC 4180 reading and writing,
// shared by the server and the move-in screen (no server imports here).

/** Glove's customer CSV columns: export writes these headers, and a file with them maps itself. */
export const columns = {
  customerId: 'Customer ID', name: 'Name', kind: 'Kind', abn: 'Business number', email: 'Email', phone: 'Phone', contact: 'Contact',
  billingAddress: 'Billing address', billingContact: 'Billing contact', apEmail: 'Accounts payable email', requirePo: 'Requires PO',
  contactName: 'Other contact', contactRole: 'Other contact role', contactPhone: 'Other contact phone', contactEmail: 'Other contact email',
  siteAddress: 'Site address', siteZip: 'Site ZIP', siteAccessNotes: 'Site access notes', siteContact: 'Site contact', siteContactPhone: 'Site contact phone', siteContactEmail: 'Site contact email',
} as const
export type CsvField = keyof typeof columns
export type ColumnMapping = Partial<Record<CsvField, string>>

/** The mapping a file gets with no choice made: columns named like Glove's own headers. */
export const autoMapping = (headers: string[]): ColumnMapping =>
  Object.fromEntries(Object.entries(columns).flatMap(([field, label]) => { const h = headers.find(x => x.trim().toLowerCase() === label.toLowerCase()); return h === undefined ? [] : [[field, h]] }))

/** Records of cells; quoted cells may hold commas, quotes ("") and line breaks. A leading byte-order mark is dropped. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false, i = text.charCodeAt(0) === 0xfeff ? 1 : 0
  for (; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch !== '"') cell += ch
      else if (text[i + 1] === '"') { cell += '"'; i++ }
      else quoted = false
    } else if (ch === '"' && cell === '') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += ch
  }
  if (quoted) throw new Error('A quoted cell is never closed.')
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}

// A spreadsheet runs a cell starting with = + - @ as a formula, so export puts a
// ' before it (and before an already-guarded value), and import takes exactly one off.
const guarded = (v: string): boolean => /^[=+\-@\t\r]/.test(v) || (v.startsWith("'") && guarded(v.slice(1)))
export const unguard = (v: string) => v.startsWith("'") && guarded(v.slice(1)) ? v.slice(1) : v

export function formatCsv(rows: string[][]) {
  const cell = (raw: string) => { const v = guarded(raw) ? `'${raw}` : raw; return /[",\r\n]|^\s|\s$/.test(v) ? `"${v.replace(/"/g, '""')}"` : v }
  return rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n'
}
