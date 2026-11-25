/** Shift the business date, rather than treating each local day as 24 hours. */
export function calendarDate(days, timeZone) {
  const date = new Date(new Intl.DateTimeFormat('en-CA', { timeZone }).format(Date.now()) + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** An issue instant at noon on that calendar date in the business timezone. */
export function calendarNoon(days, timeZone) {
  const date = calendarDate(days, timeZone)
  const offset = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${date}T12:00:00Z`)).find(part => part.type === 'timeZoneName').value
  return new Date(`${date}T12:00:00${offset === 'GMT' ? 'Z' : offset.slice(3)}`).toISOString()
}

/** Keep weekday-based fixtures current when a write also checks SQLite's clock. */
export function utcWeekday(weekday) {
  const noon = new Date()
  noon.setUTCHours(12, 0, 0, 0)
  noon.setUTCDate(noon.getUTCDate() + (weekday - noon.getUTCDay() + 7) % 7)
  const date = days => new Date(noon.getTime() + days * 86_400_000).toISOString().slice(0, 10)
  return { at: noon.toISOString(), date }
}
