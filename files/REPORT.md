# PAY-007 qualification plan and results

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f148

The assignment is to qualify all eight native payout reconciliation points through production commands and the built owner page, using only Stripe network-edge responses. Retain the existing payment and deposit-batch journeys. Do not change contract judgments or generated views. All live-provider, agent authority, PAY-002, PAY-025 and PAY-026 remainder boundaries remain unchanged.

Plan:
1. Map the eight acceptance points against the existing payout code and tests.
2. Add a focused public-command journey for each point, native Checkout sources, explicit refusals, actual Worker restart and saved-command replay. Extend the Stripe edge with cursor-based paging and malformed-page controls.
3. Repair only exposed payout defects. Record provider references in Activity summaries and identify source currency mismatch explicitly.
4. Extend existing owner payout browser proof to show reconciled and unmatched states at 1440 and 390. Keep assertions at 1440 for the added money details.
5. Run focused API tests and retained payment suite, typecheck, contract generation and source-lock checks, and the focused browser journey. Run the 1000-row proof again on the committed candidate.
6. Merge current main after the first save, regenerate the lock last, push only the named branch, discover exact-SHA Verify and preserve complete non-secret receipts on the separate evidence ref.

Initial gaps: the existing combined payout journey covers the basic source match, one missing source, fee unavailability and allocation. It does not separately qualify authority exclusions, all pagination refusals, every named wrong-source reason, payout lifecycle or exact one-cent boundaries. The existing phone screenshot shows only the unmatched automatic payout.

Exposed defects: Activity summaries omitted the Stripe payout reference although exports retained it. A foreign-currency source was refused using a generic inconsistent-row message rather than naming currency differs. Both are corrected in payout code only.

Contract source, Status rows, Gap cells, Evidence cells and generated view files remain unchanged. No policy default, new authority or money movement is introduced. No PR is required by the branch-push Verify entry point.

## Final candidate

Head: `122cf08f3baa7ec9100311f8b29e9da3026c9ee1`. Base main: `d1d1a15cc01a553a6035a85d9764f102b8c6ff9f`. Product branch is pushed and advertised at that head. PR: none required. Verify: push run `42507940358`, discovered in progress on this exact head; final observed state is in `ci-status.json`. Only two fleet-authored product commits are candidates, with no trailers.

Source counts before and after: **18 DONE, 216 PARTIAL, 29 MISSING**, with all 263 Status rows retained. Proposed lander judgment: PAY-007 PARTIAL to DONE, yielding **19 DONE, 215 PARTIAL, 29 MISSING** after independent acceptance. No plan or judgment file was edited. Plan return: only the PAY-007 target row receives this claim; other campaign rows and holds remain unchanged.

## Frozen rubric and acceptance evidence

One row per acceptance sentence. All eight rows passed under Node 22 on this exact candidate in `api-final-receipt.json`; CI loads them in `api-2`, and loads the owner page journey in `browser-2`. The six-payment result is $584.20; adding the deliberately missing $11.97 net source yields $596.17 with the missing payment still unmatched. Instant bank $1,000.00 plus fee $15.00 equals source net $1,015.00.

| Row | Acceptance sentence | Public proof and observed result |
| --- | --- | --- |
| R1 | A fixture replays a payout of six payments, one refund and fees (Stripe fake) and checks the payout reconciles to the cent, with a deliberately missing payment listed as unmatched; an instant payout (Stripe fake) with its fee reconciles the same way. | PASS local: `tests/api/payout-reconciliation.test.mjs:62` — PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay. Six real native Checkout payments, a provider-confirmed refund and signed fee rebate match every source row. The missing charge is named. The explicit Instant Payout matches bank, fee and source net. Saved replay has no provider request; restart retains identical results. Verify event: push; observed CI state remains separately recorded. |
| R2 | The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets. | PASS local: `tests/api/payout-reconciliation.test.mjs:92` — PAY-007 point 2: every inspection and reviewed allocation has attributable secret-free Activity and business export facts. Two inspections and one explicit allocation each retain Owner, time, command and Stripe payout reference in Activity summary and export. Export retains provider data. Keys and private Checkout material are absent. Verify event: push; observed CI state remains separately recorded. |
| R3 | The owner inspects a USD Stripe test payout (payout reconcile action). | PASS local: `tests/api/payout-reconciliation.test.mjs:126` — PAY-007 point 3: only a signed-in unscoped Owner inspects positive USD test payouts. An unscoped signed-in Owner succeeds. Office, Dispatcher, Technician, custom role with granted payout verbs, integration token, revoked token, branch-limited Owner and signed-out caller are refused without effects. Role withdrawal also refuses a saved command after restart. Live mode, AUD, zero and negative payouts refuse. Verify event: push; observed CI state remains separately recorded. |
| R4 | Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longer/incomplete list refuses reconciliation) and match confirmed payment/refund references, gross cents and fees; missing, unconfirmed, wrong-amount, wrong-fee/currency and unsupported sources are named. | PASS local: `tests/api/payout-reconciliation.test.mjs:179` — PAY-007 point 4: ten pages reconcile exactly 1000 rows; overflow, incomplete pages, duplicates, inconsistent rows and wrong sources refuse safely. Exactly 1,000 rows use ten pages with limit 100 and the exact previous-page cursor. 1,001 rows, empty has-more page, same-page and cross-page repeated rows and inconsistent net refuse without state changes. Distinct wrong sources name unsupported type, missing payment, missing refund, pending payment, pending refund, gross mismatch, changed fee, unavailable source fee and currency differs. Verify event: push; observed CI state remains separately recorded. |
| R5 | Bank amount plus any payout fee must equal source net exactly, and only provider-paid payouts reconcile. | PASS local: `tests/api/payout-reconciliation.test.mjs:224` — PAY-007 point 5: bank plus payout fee must equal source net exactly and only paid payouts reconcile. Bank $98.75 plus fee $0.25 equals source net $99.00. A cent in either direction stays unreconciled. Pending, in-transit, failed and canceled provider states stay unreconciled. Payment balances stay unchanged. Verify event: push; observed CI state remains separately recorded. |
| R6 | An unavailable payout fee refuses reconciliation; zero is never inferred. | PASS local: `tests/api/payout-reconciliation.test.mjs:244` — PAY-007 point 6: an unavailable payout fee refuses without changing any retained payout. Missing debit, absent fee, null fee, negative fee and fractional fee refuse with the explicit unknown-fee reason. Every retained record and event remains unchanged before and after restart. Verify event: push; observed CI state remains separately recorded. |
| R7 | Stripe does not attribute source payments to manual payouts. | PASS local: `tests/api/payout-reconciliation.test.mjs:262` — PAY-007 point 7: a manual payout has no Stripe source attribution before owner review. Available native payments do not become manual-payout sources: items remain empty, sourcePaymentIds absent, allocation-not-reviewed unmatched reason present and Stripe non-attribution wording retained. Verify event: push; observed CI state remains separately recorded. |
| R8 | Those require an explicit owner-reviewed books allocation (payout allocate action), never claimed as Stripe source attribution; unreviewed sources remain unmatched. | PASS local: `tests/api/payout-reconciliation.test.mjs:273` — PAY-007 point 8: only explicit owner books allocation reconciles manual sources and other unreviewed payouts remain unmatched. Only explicit owner books allocation selects the source, records its audited books basis and reconciles bank plus fee. Another unreviewed payout remains unmatched; double allocation refuses. Erasure then blocks fresh inspection and saved allocation replay before provider reads, after actual restart as well. Verify event: push; observed CI state remains separately recorded. |

The owner built-page journey is `tests/browser/receivables.spec.ts:234` — PAY-007, PAY-025, PAY-026 owner inspects unmatched payouts, confirms the visible instant fee and groups cash/check deposits at 1440 and 390. It passes, preserves all existing assertions, adds money-detail assertions at 1440, and records reconciled and unmatched screens once per width. Screenshots are the ten explicitly selected PNG files under `screenshots`. A second proof run corrected only the screenshot scroll position; the focused journey still passes. The first browser command selected no tests due to an anchored grep filter; no product change was made for that command-selection error.

The original combined payment test and PAY-025 deposit-batch qualification remain byte-for-byte unchanged. The touched payment suite plus the new focused suite pass 15 of 15 under Node 22. The exact-candidate focused suite passes 8 of 8; its separate scale run passes the 1,000-row journey at this exact SHA, outside push Verify, as cloud direct execution of the brief’s heavy command. Scale receipt ID: `sx-glove-c-f148-scale-candidate`. No provider account or live key was used.

## DONE-RIDERS

| Rider | Result | Evidence |
| --- | --- | --- |
| 1 | PASS local; exact-SHA Verify is the remaining hosted gate | R1 through R8 above; api-final receipt; push Verify 42507940358. |
| 2 | PASS | Every inspected source list is populated. Money and authority refusals assert no state or payment changes. Test helper lines 31, 39 and 53; points 3, 4, 5, 6 and 8. |
| 3 | PENDING hosted conclusion | CI coverage receipt resolves the new API file to api-2 and existing browser journey to browser-2 in push Verify 42507940358. No nightly-only proof or opt-in test flag. |
| 4 | PASS local | api-final receipt and scale-candidate receipt name this exact head. Browser production and test bytes were finalized before its successful run. The earlier 15-test Node 22 run used identical relevant API and product bytes. |
| 5 | PASS INSPECTED | CONTRACT.md:2003 already cites BASE-AUDIT-001; R2 proves this payout delta. No new inherited duty was invented. |
| 6 | PASS mechanical; judgment reserved for lander | Contract generator write and check exit 0, zero documents changed; generated views restored. All Status, Gap and Evidence cells are untouched. |
| 7 | PASS INSPECTED | No acceptance sentence, ruling, rider or coverage-map change. |
| 8 | PASS | Point 3 denies current excluded authority for both payout verbs, including withdrawn role and token; point 8 proves owner allocation, duplicate refusal, erasure and replay. |
| 9 | PASS | The clause explicitly permits a Stripe fake. Only test provider inspection is claimed; no live settlement, bank confirmation, activation, spend or release is claimed. |
| 10 | NOT APPLICABLE | No new policy default. Existing signed-in unscoped Owner policy is the approved retained-payout boundary; AGENT-004 resolution in the shipped rulings remains unchanged. |
| 11 | PENDING guarded landing | Main is still d1d1a15cc01a553a6035a85d9764f102b8c6ff9f, not this cloud branch. Publication scan and Run site remain Mac lander duties. No landing or main equality is claimed. |

## Inherited duty

| Duty | Result | Proof |
| --- | --- | --- |
| BASE-AUDIT-001, as cited by PAY-007 | PASS local | R2 checks every new payout inspection and allocation in Activity and the business export, with exact recorder, role, time, command, provider and reference, plus secret exclusion. R8 proves erasure cannot reintroduce personal source facts. |

## Pre-ready self-check

1. All eight named user and business outcomes are reached through native public commands; the owner page is exercised in Chromium. Exact-SHA hosted Verify is reported honestly, not inferred from local results.
2. No existing assertion or test was removed, weakened, skipped or hidden behind a new condition. No tests were replaced. Eight integration registrations were added: API top-level registrations 129 to 137, browser registrations unchanged at 42 (179 combined). There is no test-budget.json in this seed.
3. Revoked token, withdrawn Owner authority, erased customer and replayed commands cannot regain provider facts or restore source details. Actual Worker restarts retain these fences.
4. No UI source component was changed. Existing payout controls have visible text; the journey’s icon-only audit passes. Owner payout screens were inspected at 1440 and 390, with readable text and complete visible bank, fee and difference details.
5. Build, typecheck, first-party check, contract generation and source-lock freshness pass. Publication scanning, exact-main equality and Run site remain explicitly unestablished cloud-side and are required of the lander. New test and Stripe fixture contain no email-shaped literal or provider-shaped credential.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses PAY-007 and check exit=0; ledger=none exit=0.

PROBE PAY-007 1: public payout commands and authenticated reads -> Six real native Checkout payments, a provider-confirmed refund and signed fee rebate match every source row. The missing charge is named. The explicit Instant Payout matches bank, fee and source net. Saved replay has no provider request; restart retains identical results.

PROBE PAY-007 2: public payout commands and authenticated reads -> Two inspections and one explicit allocation each retain Owner, time, command and Stripe payout reference in Activity summary and export. Export retains provider data. Keys and private Checkout material are absent.

PROBE PAY-007 3: public payout commands and authenticated reads -> An unscoped signed-in Owner succeeds. Office, Dispatcher, Technician, custom role with granted payout verbs, integration token, revoked token, branch-limited Owner and signed-out caller are refused without effects. Role withdrawal also refuses a saved command after restart. Live mode, AUD, zero and negative payouts refuse.

PROBE PAY-007 4: public payout commands and authenticated reads -> Exactly 1,000 rows use ten pages with limit 100 and the exact previous-page cursor. 1,001 rows, empty has-more page, same-page and cross-page repeated rows and inconsistent net refuse without state changes. Distinct wrong sources name unsupported type, missing payment, missing refund, pending payment, pending refund, gross mismatch, changed fee, unavailable source fee and currency differs.

PROBE PAY-007 5: public payout commands and authenticated reads -> Bank $98.75 plus fee $0.25 equals source net $99.00. A cent in either direction stays unreconciled. Pending, in-transit, failed and canceled provider states stay unreconciled. Payment balances stay unchanged.

PROBE PAY-007 6: public payout commands and authenticated reads -> Missing debit, absent fee, null fee, negative fee and fractional fee refuse with the explicit unknown-fee reason. Every retained record and event remains unchanged before and after restart.

PROBE PAY-007 7: public payout commands and authenticated reads -> Available native payments do not become manual-payout sources: items remain empty, sourcePaymentIds absent, allocation-not-reviewed unmatched reason present and Stripe non-attribution wording retained.

PROBE PAY-007 8: public payout commands and authenticated reads -> Only explicit owner books allocation selects the source, records its audited books basis and reconciles bank plus fee. Another unreviewed payout remains unmatched; double allocation refuses. Erasure then blocks fresh inspection and saved allocation replay before provider reads, after actual restart as well.

Publication scan receipt, as text: {"commit": "122cf08f3baa7ec9100311f8b29e9da3026c9ee1", "complete": false, "historyScanned": false, "findings": null, "reason": "Cloud branch route; full-history scan is deferred to the guarded Mac lander."}

Blockers: none in the native implementation or local qualification. Hosted Verify, publication scanning, landing and Run site remain the normal independent gates. No PR, dispatch or workflow change was made. No cloud attempt touched main.

CLAIM PAY-007 DONE points=1,2,3,4,5,6,7,8 tests=tests/api/payout-reconciliation.test.mjs#PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay; tests/api/payout-reconciliation.test.mjs#PAY-007 point 2: every inspection and reviewed allocation has attributable secret-free Activity and business export facts; tests/api/payout-reconciliation.test.mjs#PAY-007 point 3: only a signed-in unscoped Owner inspects positive USD test payouts; tests/api/payout-reconciliation.test.mjs#PAY-007 point 4: ten pages reconcile exactly 1000 rows; overflow, incomplete pages, duplicates, inconsistent rows and wrong sources refuse safely; tests/api/payout-reconciliation.test.mjs#PAY-007 point 5: bank plus payout fee must equal source net exactly and only paid payouts reconcile; tests/api/payout-reconciliation.test.mjs#PAY-007 point 6: an unavailable payout fee refuses without changing any retained payout; tests/api/payout-reconciliation.test.mjs#PAY-007 point 7: a manual payout has no Stripe source attribution before owner review; tests/api/payout-reconciliation.test.mjs#PAY-007 point 8: only explicit owner books allocation reconciles manual sources and other unreviewed payouts remain unmatched

## Terminal handoff

Exact-SHA Verify 42507940358 was last observed in progress at 2026-11-08T18:07:44.019625+00:00. No green CI conclusion is claimed. Two REST calls were used, with the status poll at least 300 seconds after discovery. No rerun or dispatch was made. Local checks are complete; the brief’s final cloud-specific rule hands this pushed candidate to the maintained Mac lander with READY. Riders 1 and 3 retain their exact-SHA hosted gate, and rider 11 retains scanning, main equality and Run site. These are ordinary guarded landing conditions, not a native product blocker.

The evidence packet contains the complete report, machine-readable receipts, actual passing logs, the exact CI metadata, identity audit, push custody and ten browser captures. Only regular files were selected and the packet was checked for injected secret values.
