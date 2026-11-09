# PAY-021 continuation sx-glove-c-f222

Product: just-every/run-glove, branch cloud/sx-glove-c-f222, candidate 44baf40fbacc1e3307877b1aca736bc1c46dc996.
Observed main: fcfafa4d17d1ff83fcd75fd89b929a29780397f8.

CLAIM PAY-021 PARTIAL points=1,2,3,4,5,6,7 tests=tests/api/payments.test.mjs#PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 Stripe-hosted card and ACH settle once, a return reopens aging, tips stay separate and receipts retain provider outcomes

GAP PAY-021: Point 8 payment and refund receipt emails and customer-facing payment controls remain held by the assignment under PAY-002. PAY-009 keyed and saved-method inheritance remains held as named in the assignment. No customer receipt email, live activation, bank confirmation, money movement, held financing or job deposit is claimed.

No policy default was added. PAY-021 remains PARTIAL to PARTIAL. Source judgments stay 41 DONE, 193 PARTIAL, 29 MISSING before and after; all 263 Status rows remain. No plan source row was edited. The fleet should record native points 1–7 as qualified and retain the held remainder.

## Plan and implementation results

The full plan is PLAN.md. The inherited continuation already supplied the native receipt-credit journey. This round preserves it and its existing registration and combined installment and refund scenario, adds a future-due invoice and exact aging-boundary reads, asserts the public single-branch customer invariant and current scoped-office refusals, and checks every cent projection after each duplicate provider callback following real Worker restart. The invocation now sits immediately before the original combined installment scenario inside the same registration. No production repair was exposed or made.

The actual Worker, native auth, D1, commands and read routes run. Only the existing Stripe network edge supplies test-mode provider answers. Card sources are created exclusively with Owner TEST Checkout. The harness, Stripe edge, PAY-023 refund qualification and PAY-025 deposit-batch qualification are unchanged.

One customer cannot have sites in different branches: the native site command refuses that construction. Therefore a same-customer cross-branch invoice pair is not fabricated. The journey checks the construction refusal, a cross-branch allocation, and a branch-limited Office refusal independently of the other-customer case. The currency case uses the documented ServiceM8 import door and a permitted customer merge, then proves that equal customer and branch still cannot cross currencies.

## Frozen acceptance rubric and public-door probes

All native rows are invoked by the existing API Verify glob through tests/api/payments.test.mjs, registration “PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 Stripe-hosted card and ACH settle once, a return reopens aging, tips stay separate and receipts retain provider outcomes”. Exact-SHA push Verify: run 42621607320, observed in_progress. No assertion was removed or narrowed. Every original default ledger check still reads and compares all financial projections; added future report reads retain the Today comparison against the actual pinned current date.

| Row | Acceptance outcome and observed public-door proof | Test and source line | Result |
| --- | --- | --- | --- |
| R1 | Owner payment.checkout accepts $0.01, then exactly the remaining $100.02. Zero, negative, malformed, fractional cents and one cent over the balance refuse; Office, Dispatcher and an integration token refuse. Refusals preserve payments, invoices and Activity and issue no Stripe request. Command replay after restart never returns the show-once bearer. | tests/api/receipt-credit.mjs:154, PAY-021 point 1: exact installment boundaries and current Owner-only TEST Checkout refuse unsafe amounts without a request; called by the existing payment registration | Native runtime qualified; Verify in_progress |
| R2 | Owner and Office each record cash and check with exact references and recorder identity. Records have no provider confirmation fields. Dispatcher, Technician, a custom role, an integration token, missing references and an unapproved invoice refuse without balance or provider effects. | tests/api/receipt-credit.mjs:165, PAY-021 point 2: Owner and Office cash and check references remain attributable staff records and unauthorized or unapproved receipts change nothing; called by the existing payment registration | Native runtime qualified; Verify in_progress |
| R3 | The $80.07 source receives $10.10 in four staff receipts, then a $90.00 check; the exact $20.03 excess stays only on that invoice. | tests/api/receipt-credit.mjs:181, PAY-021 point 3: a check exceeding the remaining balance retains exactly the excess on its source invoice; called by the existing payment registration | Native runtime qualified; Verify in_progress |
| R4 | Office allocates $12.01 and Owner $8.02 as zero-amount credit-transfer records, with source and target effects equal to requested cents. Other customer, branch and currency, the same invoice, excess source credit, excess target balance, other roles and tokens refuse. No provider action or money transfer occurs. | tests/api/receipt-credit.mjs:189, PAY-021 point 4: explicit credit allocations enforce customer, currency, branch, source and target limits with no money movement; called by the existing payment registration | Native runtime qualified; Verify in_progress |
| R5 | Owner alone records a $3.07 non-cash goodwill credit with its exact reason and actor. Missing reason, Office, Dispatcher, Technician, custom role, Agent and integration token refuse without effects. | tests/api/receipt-credit.mjs:215, PAY-021 point 5: only the Owner records a reasoned non-cash credit; called by the existing payment registration | Native runtime qualified; Verify in_progress |
| R6 | Every allowed and refused financial step checks all invoice and customer balances, all aging totals and buckets, every parsed CSV cell, Today receivables and every overdue brief item against initial prices and explicitly requested cents. A nonempty current bucket and exact day 30, 31, 60, 61, 90 and 91 boundaries are asserted. Final target due is $27.01 and the principal customer balance is $32.04. Currency-separated ledger checks also survive restart. | tests/api/receipt-credit.mjs:226, PAY-021 point 6: every invoice, customer, aging bucket and CSV cell, Today tile and linked overdue item matches the independent cent ledger after every allowed and refused step; called by the existing payment registration | Native runtime qualified; Verify in_progress |
| R7 | Only $100.03 Stripe principal and $15.00 tips enter Stripe revenue and technician payroll. Cash and checks keep zero tip and fee and cannot be selected as Stripe payout sources. Activity and business export keep actor, time, command, reference and exact amounts. Actual Worker disposal and restart plus every command and callback replay preserve projections, payments, payroll and the complete trail; revoked integration access is refused. | tests/api/receipt-credit.mjs:238, PAY-021 point 7: Stripe revenue and technician tips exclude staff receipts and allocations, with identical restart, replay, Activity and business export; called by the existing payment registration | Native runtime qualified; Verify in_progress |
| R8 | Transactional payment and refund email receipts through the shared mail door | Not exercised or added in this round; assignment holds this outcome | UNMET-EXTERNAL under explicit assignment hold; clause remains PARTIAL |

PROBE PAY-021 1: Owner TEST Checkout for $0.01 and the remaining $100.02 -> accepted; invalid amounts and unauthorized callers -> refused, zero requests.
PROBE PAY-021 2: Owner and Office payment.record cash and check with exact reference -> attributable staff records; missing reference, draft invoice and unauthorized callers -> refused unchanged.
PROBE PAY-021 3: payment.record $90.00 check after $10.10 of staff receipts on $80.07 -> exactly $20.03 source credit.
PROBE PAY-021 4: payment.allocate $12.01 then $8.02 -> exact cent transfer without provider action; wrong roots and over-limit amounts -> refused unchanged.
PROBE PAY-021 5: Owner payment.credit $3.07 with reason -> exact credit; missing reason and other callers -> refused unchanged.
PROBE PAY-021 6: balance, aging JSON, downloaded CSV, dashboard and brief routes after every financial step -> independent ledger equality; boundaries 30, 31, 60, 61, 90 and 91 verified.
PROBE PAY-021 7: Stripe capture, payroll and payout doors plus actual Worker restart and command and callback replay -> $100.03 principal, $15.00 tips, no manual payout source, identical ledger and trail.

## DONE riders and inherited duties

| Rider | Result | Evidence or boundary |
| --- | --- | --- |
| 1 | PARTIAL honestly retained | R1–R7 qualify native outcomes; R8 and named inheritance remain held. No DONE claim. |
| 2 | PASS locally | Dangerous money paths complete and refuse through actual commands, with seeded nonempty lists, independently requested cents and no-change comparisons in R1–R7. |
| 3 | in_progress | Existing push Verify API glob loads the entire registration. Exact-SHA Verify run 42621607320. |
| 4 | PASS for local candidate proof | candidate-checks.json binds commands and log hashes to this exact candidate SHA. |
| 5 | INSPECTED, held inheritance retained | PAY-021 names its current allocation, Owner authority, reporting and provider separation duties. PAY-004 names audit and downstream report duties; its combined journey remains intact. No new inheritance is claimed. PAY-009 remains held. |
| 6 | PASS for allowed builder mechanics | Contract source and all Status cells remain byte-identical to main; local generator write and check pass and generated views are restored. Counts and judged provenance are left to the lander. |
| 7 | PASS | No acceptance sentence, ruling, status judgment or coverage mapping was changed. |
| 8 | PASS locally | R1, R2, R4 and R5 cover supported and unsafe money callers, wrong-state receipts, denied role and branch reads; R7 revokes the integration token. |
| 9 | PASS with honest provider boundary | TEST network-edge facts only. Staff records never claim provider confirmation. No live spend, settlement, bank confirmation or email delivery is claimed. |
| 10 | NOT APPLICABLE | No custody, consent, spending or authority policy default was added or promoted. Existing assignment holds remain binding. |
| 11 | PENDING GUARDED LANDER | Product branch only. Main equality, full-history publication scan and exact-main Run site are not claimed for this candidate. |

Inherited audit and export duties: R7 asserts each requested payment, staff receipt, allocation and credit in attributable Activity and business export, with exact actor, command, time, reference and amount. Inherited reporting duty: R6 repeatedly checks REPORT-003 aging and CSV, REPORT-001 Today receivables and AGENT-016 overdue source links. Inherited PAY-004 three-installment and original-method refund journey, PAY-023 focused refund qualification and PAY-025 deposit-batch qualification remain intact. Customer receipt email and broader collection inheritance remain held.

## Pre-ready self-check

1. Native user-visible money outcomes are qualified through allowed and refused public doors. Exact-SHA local results are recorded below; Verify is reported as observed, not inferred from main.
2. No assertion was removed, narrowed or placed behind a width or role condition. No test registration was added or deleted. Inventory remains 198 registrations plus four assertion scripts, 202 against the pre-existing 200 limit; inventory command exits 1 for the existing overage documented in the assignment. This round neither raises the cap nor increases the count.
3. Current authority, role, branch and token refusals are runtime assertions. Actual restart and command and callback replay retain all cent projections. The unchanged payment registration also exercises customer erasure and later authenticated payment callbacks without resurrecting erased material.
4. No screen, control, CSS or homepage changed, so UI typography, tooltip and screenshot duties are inapplicable to this test-only continuation. No browser was started.
5. Source lock freshness is checked after final edits and rebase. No migration was changed. Changed test lines contain no email-shaped strings. All candidate authors and committers are fleet identity and there are no trailers. The cloud branch publication scan is delegated to the maintained Mac lander as required by the cloud adaptation.

Publication scan: commit=44baf40fbacc1e3307877b1aca736bc1c46dc996 complete=unestablished historyScanned=unestablished findings=unestablished. No cloud scan result is claimed.
Main equality: candidate 44baf40fbacc1e3307877b1aca736bc1c46dc996 differs from observed main fcfafa4d17d1ff83fcd75fd89b929a29780397f8; guarded landing is pending.
Observed main Verify 42611312391 and Run site 42611312355 completed successfully on fcfafa4d17d1ff83fcd75fd89b929a29780397f8. These are main evidence only, not candidate evidence.
Candidate Verify run=42621607320, event=push, observed=in_progress. No PR is needed because Verify accepts branch pushes.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses PAY-021 then check exit=0; ledger=none exit=0.

## Actual local results

- timeout 900 node --test --test-concurrency=1 tests/api/payments.test.mjs: exit 0, 121.484 seconds, exact head 44baf40fbacc1e3307877b1aca736bc1c46dc996, actual log payments.log.
- pnpm typecheck: exit 0, 0.764 seconds, exact head 44baf40fbacc1e3307877b1aca736bc1c46dc996, actual log typecheck.log.
- npx -y @runeditrun/rer check --profile first-party: exit 0, 7.387 seconds, exact head 44baf40fbacc1e3307877b1aca736bc1c46dc996, actual log first-party.log.
- node scripts/contract-docs.mjs check: exit 0, 0.29 seconds, exact head 44baf40fbacc1e3307877b1aca736bc1c46dc996, actual log contract-views.log.
- node scripts/edition-authoring/cli.mjs check: exit 0, 1.389 seconds, exact head 44baf40fbacc1e3307877b1aca736bc1c46dc996, actual log source-lock.log.

No production blocker was discovered. The only substantive remainder is the assignment’s explicit payment policy and provider holds. Product custody and evidence publication are separate; neither receipt publication nor this PARTIAL claim signals acceptance or landing.
