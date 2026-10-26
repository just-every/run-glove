import { remindUnbilled } from './unbilled-reminders'
import { deliverCalendars } from './calendar-sync'
import { runReminders } from './reminders'
import { runRecurringBilling } from './billing-scheduler'
import { runtimeBindings, type Bindings } from '../auth.server'
import { runRoutingJobs } from './routing'

/** Worker's bounded background passes; opening a page never runs them. */
export async function runBackground(env: Bindings, at: string) {
  const db = runtimeBindings(env).DB
  await remindUnbilled(db, at)
  await deliverCalendars(db)
  await runRoutingJobs(db, at)
  await runRecurringBilling(db, at)
  await runReminders(db, at, new URL(env.AUTH_ORIGIN).origin, env.AUTH_LOCAL === 'true')
}
