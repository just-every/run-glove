import { runtimeBindings, type Bindings } from '../auth.server'
import { runRoutingJobs } from './routing'

/** Worker's bounded background passes; opening a page never runs them. */
export async function runBackground(env: Bindings, at: string) {
  await runRoutingJobs(runtimeBindings(env).DB, at)
}
