import { runRecurringBilling } from './billing-scheduler'
import { runtimeBindings, type Bindings } from '../auth.server'
import { runRoutingJobs } from './routing'

/** Worker's bounded background passes; opening a page never runs them. */
export async function runBackground(env: Bindings, at: string) {
  const db = runtimeBindings(env).DB
  await runRoutingJobs(db, at)
  await runRecurringBilling(db, at)
}
