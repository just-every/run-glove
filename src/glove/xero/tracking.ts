import { fail } from '../model'
import { xeroRead } from './client'

/** Review existing accounting dimensions without creating categories or options. */
export async function xeroTracking(secret: { token: string; tenant: string }, choices: unknown) {
  if (!Array.isArray(choices)) return fail('XERO_MAPPING', 'Choose existing Xero tracking categories and their options.')
  if (choices.length > 2 || choices.some(r => !r || typeof r.TrackingCategoryID !== 'string' || typeof r.TrackingOptionID !== 'string') || new Set(choices.map(r => r.TrackingCategoryID)).size !== choices.length) fail('XERO_MAPPING', 'Choose up to two distinct existing Xero tracking categories and their options.')
  if (!choices.length) return []
  const categories = await xeroRead(secret, 'TrackingCategories', true)
  return choices.map(choice => {
    const category = categories.find((r: any) => r.TrackingCategoryID === choice.TrackingCategoryID && r.Status === 'ACTIVE')
    const option = category?.Options?.find((r: any) => r.TrackingOptionID === choice.TrackingOptionID && r.Status === 'ACTIVE')
    if (!option) fail('XERO_MAPPING', 'Choose an active option belonging to an active Xero tracking category.')
    return { TrackingCategoryID: choice.TrackingCategoryID, TrackingOptionID: choice.TrackingOptionID }
  })
}
