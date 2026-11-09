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

All native rows are invoked by the existing API Verify glob through tests/api/payments.test.mjs, registration “PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 Stripe-hosted card and ACH settle once, a return reopens aging, tips stay separate and receipts retain provider outcomes”. Exact-SHA push Verify: run 42621607320, observed failure. No assertion was removed or narrowed. Every original default ledger check still reads and compares all financial projections; added future report reads retain the Today comparison against the actual pinned current date.

| Row | Acceptance outcome and observed public-door proof | Test and source line | Result |
| --- | --- | --- | --- |
| R1 | Owner payment.checkout accepts $0.01, then exactly the remaining $100.02. Zero, negative, malformed, fractional cents and one cent over the balance refuse; Office, Dispatcher and an integration token refuse. Refusals preserve payments, invoices and Activity and issue no Stripe request. Command replay after restart never returns the show-once bearer. | tests/api/receipt-credit.mjs:154, PAY-021 point 1: exact installment boundaries and current Owner-only TEST Checkout refuse unsafe amounts without a request; called by the existing payment registration | Native runtime qualified; Verify failure |
| R2 | Owner and Office each record cash and check with exact references and recorder identity. Records have no provider confirmation fields. Dispatcher, Technician, a custom role, an integration token, missing references and an unapproved invoice refuse without balance or provider effects. | tests/api/receipt-credit.mjs:165, PAY-021 point 2: Owner and Office cash and check references remain attributable staff records and unauthorized or unapproved receipts change nothing; called by the existing payment registration | Native runtime qualified; Verify failure |
| R3 | The $80.07 source receives $10.10 in four staff receipts, then a $90.00 check; the exact $20.03 excess stays only on that invoice. | tests/api/receipt-credit.mjs:181, PAY-021 point 3: a check exceeding the remaining balance retains exactly the excess on its source invoice; called by the existing payment registration | Native runtime qualified; Verify failure |
| R4 | Office allocates $12.01 and Owner $8.02 as zero-amount credit-transfer records, with source and target effects equal to requested cents. Other customer, branch and currency, the same invoice, excess source credit, excess target balance, other roles and tokens refuse. No provider action or money transfer occurs. | tests/api/receipt-credit.mjs:189, PAY-021 point 4: explicit credit allocations enforce customer, currency, branch, source and target limits with no money movement; called by the existing payment registration | Native runtime qualified; Verify failure |
| R5 | Owner alone records a $3.07 non-cash goodwill credit with its exact reason and actor. Missing reason, Office, Dispatcher, Technician, custom role, Agent and integration token refuse without effects. | tests/api/receipt-credit.mjs:215, PAY-021 point 5: only the Owner records a reasoned non-cash credit; called by the existing payment registration | Native runtime qualified; Verify failure |
| R6 | Every allowed and refused financial step checks all invoice and customer balances, all aging totals and buckets, every parsed CSV cell, Today receivables and every overdue brief item against initial prices and explicitly requested cents. A nonempty current bucket and exact day 30, 31, 60, 61, 90 and 91 boundaries are asserted. Final target due is $27.01 and the principal customer balance is $32.04. Currency-separated ledger checks also survive restart. | tests/api/receipt-credit.mjs:226, PAY-021 point 6: every invoice, customer, aging bucket and CSV cell, Today tile and linked overdue item matches the independent cent ledger after every allowed and refused step; called by the existing payment registration | Native runtime qualified; Verify failure |
| R7 | Only $100.03 Stripe principal and $15.00 tips enter Stripe revenue and technician payroll. Cash and checks keep zero tip and fee and cannot be selected as Stripe payout sources. Activity and business export keep actor, time, command, reference and exact amounts. Actual Worker disposal and restart plus every command and callback replay preserve projections, payments, payroll and the complete trail; revoked integration access is refused. | tests/api/receipt-credit.mjs:238, PAY-021 point 7: Stripe revenue and technician tips exclude staff receipts and allocations, with identical restart, replay, Activity and business export; called by the existing payment registration | Native runtime qualified; Verify failure |
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
| 3 | failure | Existing push Verify API glob loads the entire registration. Exact-SHA Verify run 42621607320. |
| 4 | PASS for local candidate proof | candidate-checks.json binds commands and log hashes to this exact candidate SHA. |
| 5 | INSPECTED, held inheritance retained | PAY-021 names its current allocation, Owner authority, reporting and provider separation duties. PAY-004 names audit and downstream report duties; its combined journey remains intact. No new inheritance is claimed. PAY-009 remains held. |
| 6 | PASS for allowed builder mechanics | Contract source and all Status cells remain byte-identical to main; local generator write and check pass and generated views are restored. Counts and judged provenance are left to the lander. |
| 7 | PASS | No acceptance sentence, ruling, status judgment or coverage mapping was changed. |
| 8 | PASS locally | R1, R2, R4 and R5 cover supported and unsafe money callers, wrong-state receipts, denied role and branch reads; R7 revokes the integration token. |
| 9 | PASS with honest provider boundary | TEST network-edge facts only. Staff records never claim provider confirmation. No live spend, settlement, bank confirmation or email delivery is claimed. |
| 10 | NOT APPLICABLE | No custody, consent, spending or authority policy default was added or promoted. Existing assignment holds remain binding. |
| 11 | PENDING GUARDED LANDER | Product branch only. Main equality, full-history publication scan and exact-main Run site are not claimed for this candidate. |

| Inherited duty | Proof and result |
| --- | --- |
| DATA-002 Activity and business export | R7, tests/api/receipt-credit.mjs, point 7: every requested payment, staff receipt, allocation and credit retains exact actor, command, time, reference and amount in both public read doors. Native local PASS. |
| REPORT-003 aging and CSV | R6, tests/api/receipt-credit.mjs, independent ledger check and point 6: all customer and currency totals, buckets, invoice links and every parsed cell agree after each money step. Native local PASS. |
| REPORT-001 Today receivables | R6: every ledger check compares the actual pinned Today tile, including during added future-date aging probes. Native local PASS. |
| AGENT-016 overdue brief | R6: complete overdue rows include exact due amount, due date and invoice action link. Native local PASS. |
| PAY-004 combined journey | Existing tests/api/payments.test.mjs combined three-installment and original-method refund scenario is preserved and passes in the same registration. |
| PAY-023 and PAY-025 boundaries | Focused refund and deposit-batch sources are untouched. The three payment registrations pass; no extra qualification is claimed for those separate clauses. |
| PAY-009 broader collection inheritance | Held explicitly by this assignment; no keyed or saved-method collection completion is claimed. |
| Shared transactional receipt email | PAY-021 point 8 stays held; no customer receipt email was added or claimed. |

## Pre-ready self-check

1. Native user-visible money outcomes are qualified through allowed and refused public doors. Exact-SHA local results are recorded below; Verify is reported as observed, not inferred from main.
2. No assertion was removed, narrowed or placed behind a width or role condition. No test registration was added or deleted. Inventory remains 198 registrations plus four assertion scripts, 202 against the pre-existing 200 limit; inventory command exits 1 for the existing overage documented in the assignment. This round neither raises the cap nor increases the count.
3. Current authority, role, branch and token refusals are runtime assertions. Actual restart and command and callback replay retain all cent projections. The unchanged payment registration also exercises customer erasure and later authenticated payment callbacks without resurrecting erased material.
4. No screen, control, CSS or homepage changed, so UI typography, tooltip and screenshot duties are inapplicable to this test-only continuation. Existing browser shards were later replayed solely for Verify triage, with the cloud-required Chromium executable; no changed-screen browser proof is claimed.
5. Source lock freshness is checked after final edits and rebase. No migration was changed. Changed test lines contain no email-shaped strings. All candidate authors and committers are fleet identity and there are no trailers. The cloud branch publication scan is delegated to the maintained Mac lander as required by the cloud adaptation.

Publication scan: commit=44baf40fbacc1e3307877b1aca736bc1c46dc996 complete=unestablished historyScanned=unestablished findings=unestablished. No cloud scan result is claimed.
Main equality: candidate 44baf40fbacc1e3307877b1aca736bc1c46dc996 differs from observed main fcfafa4d17d1ff83fcd75fd89b929a29780397f8; guarded landing is pending.
Observed main Verify 42611312391 and Run site 42611312355 completed successfully on fcfafa4d17d1ff83fcd75fd89b929a29780397f8. These are main evidence only, not candidate evidence.
Candidate Verify run=42621607320, event=push, observed=failure. No PR is needed because Verify accepts branch pushes.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses PAY-021 then check exit=0; ledger=none exit=0.

## Actual local results

- timeout 900 node --test --test-concurrency=1 tests/api/payments.test.mjs: exit 0, 121.484 seconds, exact head 44baf40fbacc1e3307877b1aca736bc1c46dc996, actual log payments.log.
- pnpm typecheck: exit 0, 0.764 seconds, exact head 44baf40fbacc1e3307877b1aca736bc1c46dc996, actual log typecheck.log.
- npx -y @runeditrun/rer check --profile first-party: exit 0, 7.387 seconds, exact head 44baf40fbacc1e3307877b1aca736bc1c46dc996, actual log first-party.log.
- node scripts/contract-docs.mjs check: exit 0, 0.29 seconds, exact head 44baf40fbacc1e3307877b1aca736bc1c46dc996, actual log contract-views.log.
- node scripts/edition-authoring/cli.mjs check: exit 0, 1.389 seconds, exact head 44baf40fbacc1e3307877b1aca736bc1c46dc996, actual log source-lock.log.

## Verify triage

Exact-SHA Verify failed in API job 129175280036 and browser job 129175280024. API assertion: tests/api/message-outcomes.test.mjs:168: Expected HTTP 200 and ok true; received HTTP 401 MAIL_EVENT: Not accepted: the signature, the event form or the message it names did not match.

The exact API and browser CI entry points were replayed without any product or test repair. The API assertion reproduced at line 168; the broad API replay later reached its 1350-second local limit and the browser replay reached its required 1200-second limit. A focused candidate run exits 1 with the original 401 MAIL_EVENT assertion, and the same focused main run exits 1 identically. The failed API test and all production code are unchanged from main. The PAY-021 registration passes in both the original local candidate run and the failed overall CI API job.

The one browser archive command failed: gh run view 42621607320 --repo just-every/run-glove --job 129175280024 --log-failed. Sanitized error: failed to get run log: zip: not a valid zip file. HTTP status was not supplied. No archive retry or blob redirect was attempted.

verify-replay-api-1.json: {
  "head": "44baf40fbacc1e3307877b1aca736bc1c46dc996",
  "job": "shards (api-1)",
  "job_id": 129175280036,
  "run_id": 42621607320,
  "command": "node scripts/verify-ci.mjs api-1",
  "exit": 124,
  "seconds": 1350.011,
  "at": "2026-11-09T13:40:08.802596+00:00",
  "ci_failure": "tests/api/message-outcomes.test.mjs:168 expected HTTP 200 and ok true; received HTTP 401 MAIL_EVENT"
}

verify-replay-browser-2.json: {
  "head": "44baf40fbacc1e3307877b1aca736bc1c46dc996",
  "job": "shards (browser-2)",
  "job_id": 129175280024,
  "run_id": 42621607320,
  "command": "node scripts/verify-ci.mjs browser-2",
  "timeout_seconds": 1200,
  "exit": 124,
  "seconds": 1200.082,
  "at": "2026-11-09T13:39:39.415986+00:00",
  "browser": "/usr/bin/chromium",
  "ci_failure": "assertion unavailable because the single gh run view archive read failed with zip: not a valid zip file"
}

verify-focused-message-outcomes.json: {
  "head": "44baf40fbacc1e3307877b1aca736bc1c46dc996",
  "job": "shards (api-1)",
  "job_id": 129175280036,
  "job_command": "node scripts/verify-ci.mjs api-1",
  "command": "timeout 300 node --test --test-concurrency=1 tests/api/message-outcomes.test.mjs",
  "test": "COMM-010 points 1\u20138: committed messages retain honest provider outcomes, address warnings and no resend across Worker restart",
  "exit": 1,
  "seconds": 72.256,
  "failure": "HTTP 401 MAIL_EVENT instead of expected HTTP 200 at tests/api/message-outcomes.test.mjs:168",
  "at": "2026-11-09T13:44:37.811434+00:00"
}

verify-main-message-outcomes.json: {
  "head": "fcfafa4d17d1ff83fcd75fd89b929a29780397f8",
  "command": [
    "node",
    "--test",
    "--test-concurrency=1",
    "tests/api/message-outcomes.test.mjs"
  ],
  "exit": 1,
  "seconds": 92.797,
  "at": "2026-11-09T13:38:08.982203+00:00",
  "comparison": "origin/main on the same local runner",
  "node": "v22.20.0"
}

verify-main-document-print.json: {
  "head": "fcfafa4d17d1ff83fcd75fd89b929a29780397f8",
  "command": [
    "timeout",
    "1200",
    "node",
    "--import",
    "./scripts/verify-progress.mjs",
    "tests/browser/run.mjs",
    "tests/browser/document-print.spec.ts",
    "--grep",
    "QUOTE-015 scoped documents"
  ],
  "exit": 1,
  "seconds": 345.042,
  "at": "2026-11-09T13:43:54.147769+00:00",
  "comparison": "origin/main on the same local runner",
  "node": "v22.20.0"
}

The browser replay recorded failures in the unchanged QUOTE-015 print test, DATA-001 cached erasure test and DISP-005 phone-location test before its time limit. The focused QUOTE-015 comparison also exits 1 on main at tests/browser/document-print.spec.ts:153 while waiting for heading Open heating proposal. The unavailable original browser archive prevents matching that job’s exact CI assertion, and no archive retry was attempted. These are outside the leased PAY-021 receipt-credit proof. No mail, document, privacy or location test was edited or weakened.

VERIFY_REPRODUCED {"head": "44baf40fbacc1e3307877b1aca736bc1c46dc996", "job": "shards (api-1)", "job_id": 129175280036, "job_command": "node scripts/verify-ci.mjs api-1", "command": "timeout 300 node --test --test-concurrency=1 tests/api/message-outcomes.test.mjs", "test": "COMM-010 points 1\u20138: committed messages retain honest provider outcomes, address warnings and no resend across Worker restart", "exit": 1, "failure": "HTTP 401 MAIL_EVENT instead of expected HTTP 200 at tests/api/message-outcomes.test.mjs:168"}

Final disposition: BLOCKED by the exact-SHA red workflow, requiring FV triage of the existing mail failure and browser-2. Eight GitHub calls were used. No code repair and no CI rerun was attempted. Native points 1–7 remain qualified, the product branch is pushed, and all actual logs and receipts are retained. The packet records the broad replay time limits honestly and does not claim that either entire failed shard passed. Every owned runtime was stopped and its identified scratch was removed. No green workflow or READY status is claimed.

Product custody and evidence publication are separate; neither receipt publication nor this PARTIAL claim signals acceptance or landing.
