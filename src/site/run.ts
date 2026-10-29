import { runPricing } from '../base/run-pricing'
import type { RunData } from '../base/run-site'
import data from './run.json'

// Seed identity and repository stay here; shared Base owns the paid-plan copy.
export const run: RunData = { ...data, pricing: runPricing }
