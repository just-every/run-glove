import type { Context } from '../model'

/** A command family: returns the result for the types it owns, undefined otherwise. */
export type Handler = (c: Context, type: string, payload: any, db: D1Database) => Promise<unknown>
