import type { privacyScope } from './privacy-scope'
import type { Row, State } from './model'

type Scope = ReturnType<typeof privacyScope>
export type SharedSignedCopy = { quoteId: string; revision: number; name: string; sha256: string; peers: number; peerIds: string[]; reason: string }

/** An immutable artifact cannot be field-redacted. Withdraw only its original,
 * retaining the peer's quote and non-personal commercial record. */
export function sharedSignedQuotes(s: State, scope: Scope): SharedSignedCopy[] {
  return s.quotes.filter(q => !scope.selected.has(`quotes:${q.id}`) && q.acceptance?.signing?.signedCopy && scope.matches(q.acceptance.signing)).map(q => ({
    quoteId: q.id, revision: q.acceptance.revision, name: `Quote ${q.number} revision ${q.acceptance.revision}`,
    sha256: q.acceptance.signing.signedCopy.sha256, peers: 1, peerIds: [q.customerId],
    reason: 'The immutable signed original contains an erased customer identifier; the peer quote remains.',
  }))
}

export function withdrawSignedQuote(q: Row, scope: Scope, copy: SharedSignedCopy, at: string): Row {
  const redacted = scope.redact(q)
  return { ...redacted, id: q.id, version: q.version + 1, acceptance: { ...redacted.acceptance, signing: {
    ...redacted.acceptance.signing, signature: null, signedCopy: null,
    copyWithdrawn: { at, sha256: copy.sha256, reason: 'Signed original and signature withdrawn for customer privacy. The accepted quote remains.' },
  } } }
}
