/** Stored calendar dates keep their date; US documents use month/day/year words. */
export const documentDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date ?? '') && Number.isFinite(Date.parse(date)) ? new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date + 'T00:00:00Z')) : date
export const documentPhone = (phone: string) => { const digits = phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''); return digits.length === 10 ? `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}` : phone }
