import { cents, dollars } from './money'
import { fail } from './model'

export function depositRule(value: any) {
  if (value === null || value === undefined) return null
  if (value.kind === 'amount') {
    const n = cents(value.value, 'deposit amount'); if (n <= 0) fail('DEPOSIT', 'Deposit amount must be positive.')
    return { kind: 'amount', value: dollars(n) }
  }
  if (value.kind !== 'percent' || typeof value.value !== 'string' || !/^\d{1,3}(\.\d{1,2})?$/.test(value.value) || Number(value.value) <= 0 || Number(value.value) > 100) fail('DEPOSIT', 'Deposit is an amount or a percentage above zero and at most 100.')
  return { kind: 'percent', value: value.value }
}
export function depositAmount(rule: any, total: string) {
  if (!rule) return 0
  const gross = cents(total, 'chosen total')
  const amount = rule.kind === 'amount' ? cents(rule.value, 'deposit') : Number((BigInt(gross) * BigInt(Math.round(Number(rule.value) * 100)) + 5000n) / 10000n)
  if (amount <= 0 || amount > gross) fail('DEPOSIT', 'Deposit must be positive and no greater than the chosen total.')
  return amount
}
