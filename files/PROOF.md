# PAY-025 proof register

Candidate: `3a5be004a8ecc2979b4186b10a3621a85b9014c7`.

API journey A is `tests/api/payments.test.mjs:353` — “PAY-007, PAY-025, PAY-026 six confirmed payments, refund and fees reconcile exactly; missing source is named; explicit Instant Payout fee and cash/check batches never duplicate”. It invokes `tests/api/deposit-batches.mjs:67` through the existing Verify API glob. Browser journey B is `tests/browser/receivables.spec.ts:234` — “PAY-007, PAY-025, PAY-026 owner inspects unmatched payouts, confirms the visible instant fee and groups cash/check deposits at 1440 and 390”. It is invoked by the existing Verify browser glob. No workflow was edited.

The Verify event is push, run 42485455360, bound to this exact candidate. It completed SUCCESS on this exact head, observed 2026-11-08T13:43:17Z, as recorded in `ci.json` and `receipt.json`; that event and conclusion apply to every row below. Local runtime assertions are PASS; the recorded workflow is a separate gate, never inferred from local output.

| Acceptance sentence | Public-door evidence and independently checked result | Local result |
| --- | --- | --- |
| 1. Confirmed cash and check receipts group 1 to 100 same-currency and same-branch records once, net of earlier paid refunds, with staff-recorded status and no bank confirmation claim. | A; helper lines 67, 82 and 272. Exact USD 222.08, USD 21.09, USD 16.92 and USD 32.18; positive cardinalities 1 and 100; negative cardinalities 0 and 101; distinct ids, methods, prior refunds, existing batch membership, current branch and currency enforced. Refusals compare complete state. Concurrent commands have one winner and replay adds nothing. B renders staff-recorded deposits at both widths. | PASS |
| 2. Only the Owner reads provider-wide payouts and fees; Office sees permitted branch cash and check batches. | A; helper lines 134 and 177. Populated state, every Activity page, opened business export and saved command outcomes are independently enumerated for unscoped Owner, unlimited Office, scoped Office and scoped Owner. Current role and branch withdrawal, Technician, Dispatcher, Agent and token refusals, revoked token reads and actual restart are exercised. | PASS |
| 3. The named privacy duties remove erased customer references from shared payout sources and retain anonymous aggregate bank history. | A; helper line 227. Preview names three affected payouts; erasure cleans a mixed batch, a peer-only copied note and a mixed-provider source payout. Bank totals and peer sources remain exact; identity and private receipt details disappear from payout detail, complete Activity and business export. Saved outcomes and fresh provider inspection or allocation cannot repopulate personal sources. Actual restart repeats the complete proof. | PASS |

Frozen native rubric for the requested lease:

| Item | Outcome | Evidence | Local result |
| --- | --- | --- | --- |
| R1 | Independent Office receipts and exact prior-refund net cents in two branches | A, helper lines 70 and 106 | PASS |
| R2 | 1 and 100 accepted; 0 and 101 refused | A, helper lines 84 and 109 | PASS |
| R3 | Duplicate ids, refund records, card and hosted receipts, unpaid receipts, missing records, existing batches, mixed branches and currencies refused unchanged | A, helper lines 24, 84 and 272 | PASS |
| R4 | Concurrent claim and replay cannot duplicate a receipt | A, helper line 122 and restart replay at line 221 | PASS |
| R5 | Honest staff-recorded status and no bank-confirmation claim | A, helper lines 106 and 158; B and both deposit screenshots | PASS |
| R6 | Exact populated visibility on all four requested read forms | A, helper lines 156 and 177 | PASS |
| R7 | Excluded writers and revoked or withdrawn authority cannot act or recover old outcomes | A, helper lines 197 and 201 | PASS |
| R8 | Identical retained outcomes after actual Worker disposal and recreation | A, helper lines 217 and 266 | PASS |
| R9 | Erasure retains anonymous bank money and peer receipts while removing shared personal source detail | A, helper lines 227 and 235 | PASS |
| R10 | Replay and fresh provider doors cannot restore erased source information | A, helper lines 254 and 257 | PASS |

Inherited duties are limited here to PAY-025's receiving duty; no parent clause is promoted by this report.

| Inherited duty | Receiving text and proof | Result |
| --- | --- | --- |
| BASE-DATA-003 | Explicitly cited in PAY-025's meta line at `CONTRACT.md:2019`; A erases shared source references and repeats reads after restart. | PASS |
| DATA-001 | PAY-025 point 3 names it. A performs Owner preview and fingerprint-bound erasure, with anonymous retained finance. The five preserved privacy sanity tests also pass, including real older-backup refusal using a trusted later journal. | PASS for receiving duty |
| DATA-005 | PAY-025 point 3 names it. New payout-note, shared audit and saved-outcome copies follow erasure; provider-side copies and outside holds are not claimed deleted. | PASS for receiving duty |
| DATA-006 | PAY-025 point 3 names it. A reads exact affected-store preview counts and preserves peer-owned records. Existing shared imported-source and source-custody privacy journeys pass unchanged. | PASS for receiving duty |
| DATA-007 | PAY-025 point 3 names it. A removes only protected data from the peer-only batch note and keeps all 100 peer sources and every peer payment byte-for-byte. No remote deletion or send is added. Device fence implementation is unchanged. | PASS for receiving duty |
| DATA-008 | PAY-025 point 3 names it. Owner confirmation stays on the existing restricted public door; preserved privacy tests refuse a scoped Owner, while A uses an explicitly signed-in unscoped Owner. No delegation or agent confirmation authority is added. | PASS for receiving duty |
| DATA-002 attribution | A opens complete Activity and business export, checks exact permitted batch event subjects, recorder, command identity and time, and excludes provider facts from limited readers. Existing payout outcome attribution assertions remain. | PASS |

| DONE-RIDERS row | Assessment on this candidate | Proof |
| --- | --- | --- |
| 1 | PASS, including exact-head push Verify 42485455360 SUCCESS | A reaches all three original acceptance outcomes on populated data; B confirms retained controls and visible status. |
| 2 | PASS | Supported money paths complete; each unsafe request is attempted and the complete state remains unchanged. USD expectations are literal independent cents, including a numeric reference equal to an amount. |
| 3 | PASS, exact-head push Verify 42485455360 SUCCESS | Push run 42485455360 invokes the API glob and browser runner. No flags hide the new helper. |
| 4 | PASS | Exact-head A run and exact-head B run are returned. Production code for all 12 regression tests is unchanged between that run and this merge; the merge changes ancestry only. |
| 5 | PASS, INSPECTED | The receiving clause explicitly cites BASE-DATA-003 and names its privacy duty in point 3. No inherited text is invented. |
| 6 | PASS mechanical; source judgments preserved for lander | Document write and check pass; restored generated views are not committed. No Status, Gap, Evidence, summary count or provenance line is edited. |
| 7 | PASS, INSPECTED | CONTRACT.md has no candidate diff and no acceptance rewrite; no coverage-map rewrite or ct ruling is required. |
| 8 | PASS | A exercises current roles, branch changes, revoked token, protected saved outcomes, already-deposited state and erased records; the preserved payout journey still proves normal Owner allocation and provider inspection. |
| 9 | PASS, boundary retained | Stripe is faked only at its network edge. No live bank confirmation, settlement, provider erasure, account activation or legal compliance is claimed. |
| 10 | PASS, INSPECTED | No new policy default. Current Owner and Office authority and existing erasure restrictions are enforced without new execution authority. |
| 11 | PENDING GUARDED LANDING | Product head is branch-only. Main equality, exact main Run site and COMPLETE publication scan are fleet gates; see the receipt's explicit unestablished scan fields. |

Pre-READY self-check:

1. PASS locally: the named user outcomes have actual positive and negative runtime assertions. Earlier red assertions are retained as receipts. The exact-head Verify result is separate in the receipt; no field-by-field mutation campaign is claimed.
2. PASS: no inherited assertion was removed, narrowed, skipped or conditioned on width or branch. The original browser file is unchanged. The inherited suite is already over its stated cap; this round adds zero registrations and extends its existing money sanity journey.
3. PASS: token revocation, current-role and branch withdrawal, old command replay, simultaneous claims, actual restart, erasure and both fresh provider doors are exercised without resurrection.
4. PASS for this scope: no UI source is touched. The preserved browser journey checks visible word controls and no horizontal overflow at 1440 and 390; returned screenshots visibly retain staff-recorded deposits. No new icon-only control or configuration placement is introduced.
5. Source lock and generated-document checks pass; changed product text adds no email-shaped fixture literal or suspicious prose repository shorthand. Exact-head Verify is recorded separately. Publication scan, main equality and Run site remain unestablished fleet gates, rather than fabricated local successes.

Scan receipt required at landing, not run in this cloud:

```json
{"commit":"3a5be004a8ecc2979b4186b10a3621a85b9014c7","complete":null,"historyScanned":null,"findings":null,"status":"pending fleet publication scan"}
```
