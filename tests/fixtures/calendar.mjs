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
