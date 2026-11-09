# sx-glove-c-f181 — PAY-026

Repository: just-every/run-glove. Branch: cloud/sx-glove-c-f181.
Candidate: 7d7cc6feabd4946e044a27f41239590bce884c8e.
Saved product commit: 3d8aaa3d51578a4f8b5e7734adf89c630207637d.
PR: none required or created. The repository starts Verify on branch pushes.
Verify: push run 42556690576, exact candidate SHA; in progress at both permitted observations, separated by at least 300 seconds. No conclusion has been inferred from another SHA.

All six native acceptance outcomes now have public-door proof. This report does not claim live Stripe money movement, a real debit-card payout, bank confirmation, provider activation, agent payout authority, publication scanning or landing. The fee schedule remains Owner-recorded and unverified by Glove. Existing PAY-002, R-11, agent, provider, policy and accepted runtime-pin holds remain unchanged. No new policy default was adopted.

## Work and defects

The new focused API registration uses the existing runtime, native sign-in, real migrated D1, public commands, authenticated payment callbacks and six named scenario steps. Every source enters through the existing Owner-only TEST Checkout boundary. Only Stripe's network edge gains eligibility, funds, request inspection and lost-answer controls. The API harness and the landed payment, payout-reconciliation and deposit-batch tests are unchanged.

Public-door proof exposed two money defects. Confirmation accepted a previously known zero-fee source after its fee became unavailable, by substituting zero. Repeated reconciliation could also replace the original bank amount with the preceding provider inspection and then accept drift. Confirmation now requires known current fees and the original source fingerprint; reservation retains its idempotency key, confirmed bank amount and source identities. Reconciliation compares current allocation facts with the retained confirmation and reports source changes separately from amount or fee differences. The original allocation and debit behavior remains covered by the existing regressions.

The existing Owner browser journey adds the unknown-outcome state and attributable Activity and export checks without removing or narrowing an original assertion. It records schedule, preview, confirmation and unknown screens at 1440 and 390. New assertions run at 1440; original width behavior is preserved. The inspected screenshots contain synthetic business data and no credentials. No production UI, homepage or branding file changed.

## Counts and plan return

The initial checkout had 27 DONE, 207 PARTIAL and 29 MISSING clauses. Concurrent main commit 63bfd0d1a155d7be44561e579d643f895fabded3 judged STOCK-002 DONE. The candidate retains that judgment whole: relative to fresh main, counts remain 28 DONE, 206 PARTIAL and 29 MISSING, with all 263 Status rows intact. PAY-026's source Status, Gap and Evidence are unchanged. This round's native outcome qualification is 0 to 6; the lander owns any eventual PAY-026 status flip.

Plan row return: PAY-026 points 1–6 qualified locally. No other campaign row was taken or rewritten. PLAN.md contains the actual execution plan.

Test inventory: fresh main has 215 counted items; the requested focused API registration adds one, giving 216 against the inherited cap of 200. Browser proof extends its existing registration and adds none. This inherited budget debt remains disclosed; no existing money assertion was removed to reduce the count. The inventory command exits 1. The touched runtime, browser, type, build, first-party, generator and lock checks pass.

## Frozen outcome rubric and proof

The API test name for all six rows is `PAY-026 Owner Instant Payout qualification, reservation and reconciliation` in `tests/api/instant-payouts.test.mjs`. Each named step executes its dangerous path with populated data and verifies refusal effects. The existing Verify API glob discovers this file without workflow edits.

| Item | Acceptance outcome and public-door proof | Test lines | Local result | Exact-SHA Verify |
| --- | --- | --- | --- | --- |
| P1 | Signed-in unscoped Owner records whole basis points and valid minimums. Office, Dispatcher, custom role, integration token, scoped Owner and signed-out requests refuse. Enumerated half-cent and minimum boundaries check independent expected cents. Missing instant eligibility, credit funding, insufficient funds, pending or fee-unknown sources, duplicate or excessive selections, other connection, allocated sources and one-cent net differences refuse without stored payout effects. | API 69–128; browser 270–275 | PASS | push 42556690576 pending |
| P2 | Explicit bank amount and fee must match. The runtime clock accepts immediately before the ten-minute expiry and refuses at the exact expiry. Changed schedule, connection, source reference, net or allocation, unavailable fee, lost eligibility and insufficient funds refuse with no payout request. | API 129–172 | PASS | push 42556690576 pending |
| P3 | A provider-edge checkpoint reads the committed reserved payout, source allocation and Activity before the request completes. Two concurrent public confirmations yield one successful request with the retained key and exact amount, currency, method, destination and metadata. | API 173–195 | PASS | push 42556690576 pending |
| P4 | Accepted-but-lost HTTP and unreachable answers keep the payout reserved and honestly unknown. Same-command replay, a new confirmation, repeated cron passes and a real Worker stop and restart produce no additional payout request. Activity and export retain the unknown fact without provider secrets. | API 196–219; browser 280–304 | PASS | push 42556690576 pending |
| P5 | A confirmed source cannot enter another preview, confirmation or manual allocation. Restart preserves the exclusion. Erasure removes original and confirmed source identifiers; replay and inspection refuse without resurrection. | API 220–249 | PASS | push 42556690576 pending |
| P6 | The actual paid debit, original source allocation and actual fee reconcile exactly. Different fees, bank amounts, changed source facts and repeated inspections remain unmatched with named reasons. | API 250–286 | PASS | push 42556690576 pending |
| Inherited BASE-SECRET-001 | API trail helper compares Activity and business export provenance and excludes key values, hosted Checkout material, signatures and bearer data. Browser checks the populated exported states. | API 49–66, 126, 194, 214–217, 284; browser 293–302 | PASS | push 42556690576 pending |

PROBE PAY-026 1: public schedule and preview commands with exact cents and unsafe sources -> independent expected fees; every unsafe case refused without a stored payout change.
PROBE PAY-026 2: public confirmation at the runtime expiry boundary and after changed prerequisites -> just-before confirmation succeeds; exact expiry and changed facts refuse without sending.
PROBE PAY-026 3: concurrent public confirmations -> one reservation, committed source allocation and one POST with the retained idempotency key.
PROBE PAY-026 4: accepted request with lost or unreachable answer, replay, cron and actual Worker restart -> reserved unknown payout and one total POST.
PROBE PAY-026 5: reuse confirmed sources and replay after erasure -> refusal with unchanged retained financial state and no resurrected source identities.
PROBE PAY-026 6: inspect original debit, then fee, amount and source drift twice -> original reconciles exactly; drift remains named and unmatched.

## DONE-RIDERS

| Row | Result on the candidate | Evidence |
| --- | --- | --- |
| 1 | LOCAL PASS; recorded Verify pending | P1–P6 above execute all six acceptance outcomes through the commands and built browser controls. |
| 2 | PASS | Independent enumerated fee cents, exact successful payout and unsafe refusals; checkpoint and request count assertions; before-and-after state equality. |
| 3 | PENDING | Verify push run 42556690576 discovers the new API registration and the existing browser journey. No skipped or environment-gated new assertions. |
| 4 | PASS | The candidate has identical relevant source and test bytes to the browser proof; the focused API is rerun on the exact candidate. The merge only carries main's contract judgments and generated lock changes. |
| 5 | PASS | PAY-026 already cites BASE-SECRET-001. No inherited acceptance duty was added or removed. |
| 6 | PASS for builder mechanics; judgment remains lander-owned | Generator write and check pass. Generated views equal main. Status, Gap, Evidence and summary judgments equal main. Lock regenerated last and checked. |
| 7 | PASS | No acceptance sentence or ruling changed; no coverage rewrite. |
| 8 | PASS | Excluded current roles, integration token and scoped Owner cannot record pricing, preview or confirm. Revoked token refuses. Owner success and unchanged dangerous refusals are both executed. |
| 9 | PASS | Only allowed Stripe edge fakes are claimed. No live provider, real bank settlement or legal claim. |
| 10 | NOT APPLICABLE | Existing Owner-only authority is retained; no new custody, consent or spending policy adopted. |
| 11 | PENDING guarded landing | Cloud pushes only its named branch. Main equality, complete publication scan and candidate Run site are not established here. |

## Pre-ready self-check

1. All named behavior is executed through public doors with populated allowed and refused cases. Exact-SHA Verify is pending; its run id is bound above.
2. No original assertion was deleted, weakened, moved behind a width condition or skipped. The original three landed API files are untouched.
3. Revoked-token refusal, public personal erasure, saved-command replay and Worker restart cannot disclose or recreate source identities. Unknown requests never resend.
4. No production screen code changed. The existing panel has named visible buttons, readable text and no icon-only action. Browser captures check overflow and unnamed controls at both widths. The existing fee editor's placement in Invoices is unchanged; placement polish is not part of this money-safety patch.
5. Source lock is fresh. New test text has no email-shaped fixture string. Publication scan and Run site remain guarded-lander duties. Test-inventory debt is disclosed above.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses PAY-026 and check --clauses PAY-026 exit=0, generated views restored from origin/main; ledger=none exit=0.

Publication scan: commit=7d7cc6feabd4946e044a27f41239590bce884c8e complete=unestablished historyScanned=unestablished findings=unestablished. The cloud route delegates this scan to the guarded Mac lander; no COMPLETE or zero-finding receipt is invented.
Main equality: false, candidate is branch-only. Last CI-qualified observed main=63bfd0d1a155d7be44561e579d643f895fabded3; that main's Verify 42554943349 and Run site 42554943436 completed successfully. Those runs are not candidate proof.

## Publication and custody

The first product push initially failed authentication four times. The required guard refreshed the injected bundle and used its 15, 45, 90 and 150 second backoff; attempt five succeeded. A repository API request also returned HTTP 401, then its prescribed refreshed retry succeeded with repository push permission. No other credential was sought. The first published save was merged with updated main, never rebased or force-pushed. The final candidate push succeeded on its first attempt. Every candidate author and committer is Run Edit Run fleet, and all candidate messages have no co-author trailers.

Product publication and evidence transfer are separate. Evidence files are selected explicitly and published only on evidence/sx-glove-c-f181. The product branch contains only the requested proof, narrowly exposed payout repairs and its generated source lock, plus the merge of main. No fleet report, credential, environment dump or private gate material enters that branch.

Latest remote readback at packet preparation: product ref equals 7d7cc6feabd4946e044a27f41239590bce884c8e; observed main=eb1178dde4b08016c116445860c5f6bb36e56710. PUSH_RECEIPT.json records this separate custody check.

At the first permitted CI observation, Verify 42556690576 remained in progress on the exact candidate. A single watcher observes again no sooner than 300 seconds after that query.

## Final cloud handoff

CLAIM PAY-026 DONE points=1,2,3,4,5,6 tests=tests/api/instant-payouts.test.mjs#PAY-026 Owner Instant Payout qualification, reservation and reconciliation; tests/browser/receivables.spec.ts#PAY-007, PAY-025, PAY-026 owner inspects unmatched payouts, confirms the visible instant fee and groups cash/check deposits at 1440 and 390

The claim qualifies all six native outcomes with passing local proof. It is submitted under the cloud handoff rule: exact-SHA Verify remains in progress, and the guarded lander independently requires its success, a complete publication scan and landing conditions before any source status flip or count. Riders 1 and 2 pass locally; 3 awaits the exact-SHA run; 4, 5, 6, 7, 8 and 9 pass; 10 is inapplicable; 11 awaits guarded landing. The test inventory exception remains disclosed and is not silently waived.

No account or policy blocker remains. Transient authentication recovered within the bounded retry sequence. There is no known reproduced product failure. Main drift after the candidate push is recorded in PUSH_RECEIPT.json and remains the guarded lander's integration duty. The candidate checkout is clean, and all product work is published. The full packet is transferred on the separate evidence ref; its exact head is reported in the terminal message. The product clone is removed only after this transfer succeeds.
