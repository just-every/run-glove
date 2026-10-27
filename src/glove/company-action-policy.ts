import { event, type Context } from './model'

export type CompanyAction = { companyId: string; connectionId: string; action: string; riskClass: 'provider-write' }
export type CompanyDecision = 'allow' | 'review' | 'approve' | 'block'

/** Installation-owned company policy; no policy means no authority. */
export async function companyActionPolicy(db: D1Database, c: Context, action: CompanyAction) {
  const row = await db.prepare('SELECT decision FROM glove_company_action_policy WHERE company_id=? AND connection_id=? AND risk_class=?').bind(action.companyId, action.connectionId, action.riskClass).first<{ decision: string }>()
  const decision: CompanyDecision = row && ['allow', 'review', 'approve', 'block'].includes(row.decision) ? row.decision as CompanyDecision : 'block'
  const result = { ...action, decision, allowed: decision === 'allow', effect: decision === 'allow' ? 'Company policy permits this action within its existing authority.' : 'Company policy did not allow this action; no provider write or payment effect.' }
  event(c, { jobId: null, subjectKind: 'business', subjectId: action.companyId, kind: 'company.actionPolicy', summary: `Company policy ${decision}: ${action.action}`, data: result })
  return result
}
