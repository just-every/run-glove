import { business, fail, find, type Row, type State } from './model'

/** TEAM-002, TEAM-004, TEAM-005: unassigned legacy records keep the installation's original branch. */
export const branchIdOf = (s: State, record: Row): string | null => {
  if (Object.hasOwn(record, 'branchId')) return record.branchId ?? null
  if (record.siteId) return find(s, 'sites', record.siteId).branchId ?? null
  if (record.jobId) return branchIdOf(s, find(s, 'jobs', record.jobId))
  return null
}

export const branchZone = (s: State, record: Row) => {
  const id = branchIdOf(s, record)
  return id ? find(s, 'branches', id).timezone : business(s).timezone
}

export function chosenBranch(s: State, value: unknown): string | null {
  return value === undefined || value === null || value === '' ? null : find(s, 'branches', value).id
}

/** Branch assignment is frozen on a site: existing work retains its original branch. */
export function siteBranch(s: State, p: any, existing?: Row) {
  const branchId = p.branchId === undefined && existing ? existing.branchId ?? null : chosenBranch(s, p.branchId)
  if (existing && branchId !== (existing.branchId ?? null)) fail('BRANCH', 'A site keeps its branch. Add a new site for work at another branch.')
  return { branchId }
}

export function sameBranch(s: State, job: Row, technician: Row) {
  if (branchIdOf(s, job) !== (technician.branchId ?? null)) fail('BRANCH', 'Book a technician from the job’s branch.', null, 400)
}
