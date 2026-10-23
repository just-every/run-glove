import type { Context, State } from './model'

/** Address-free visit intent; older schedules are superseded before any send. */
export function visitNotices(c: Context, before: State) {
  for (const visit of c.s.visits) {
    const old = before.visits.find(v => v.id === visit.id)
    const kind = visit.status === 'cancelled' && old?.status !== 'cancelled' ? 'cancelled' : !old ? 'confirmation' : (old.startAt !== visit.startAt || old.endAt !== visit.endAt || old.technicianId !== visit.technicianId) ? 'moved' : null
    if (!kind) continue
    // Adding a note is part of the existing audited visit command.
    visit.notice = { kind, at: c.now, key: c.commandId, startAt: visit.startAt }
  }
}
