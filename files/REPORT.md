# sx-glove-c-f220 — PAY-021 native qualification

Repository: just-every/run-glove  
Branch: cloud/sx-glove-c-f220  
Candidate: 6a1b172ef52994689af4a5463eac96e94646b946  
Base observed before candidate push: fcfafa4d17d1ff83fcd75fd89b929a29780397f8  
PR: none required; Verify accepts branch pushes.  
Verify: 42616745495 (event push), in_progress, conclusion=None, https://github.com/just-every/run-glove/actions/runs/42616745495

PAY-021 remains PARTIAL. Native acceptance points 1–7 are qualified; point 8 and the explicitly held PAY-009 inheritance remain outside this round. Source counts stay **41 DONE, 193 PARTIAL, 29 MISSING, 263 total** before and after. Inventory stays **202 of 200**; no registration was added, removed or weakened. The pre-existing over-cap inventory is reported honestly rather than presented as a passing check.

## Product change and completed plan

The existing registration at `tests/api/payments.test.mjs:13` now calls `receiptCreditQualification`, whose seven named `scenario` steps are in `tests/api/receipt-credit.mjs`. The only other product-tree change is the regenerated source lock. There is no production repair: public-door proof exposed no product defect. The original combined three-installment and refund scenario, `tests/api/refunds.test.mjs`, `tests/api/deposit-batches.mjs`, `tests/api/harness.mjs` and `tests/fixtures/stripe-payments.mjs` remain unedited. No homepage, UI, runtime pin, workflow, migration, contract judgment or generated view changed.

`PLAN.md` records the complete executed plan. The returned plan row is PAY-021 native points 1–7 qualified on this branch, held remainder unchanged; no fleet plan was edited. No unprovided ruling was requested, no new default was adopted, and no additional clause was started because the remaining named payment doors are explicitly held.

The fixture uses a pinned 2026-11-04 approval date, zero-day terms and the pinned 2026-11-09 payment and reporting date, within real session lifetimes. A separate currency fixture uses the documented ServiceM8 opening-balance import followed by a reviewed customer merge; no direct domain seeding or harness editing was used. Test-development corrections concerned valid branch fixtures, session expiry, unordered invoice collections, Stripe audit attribution and exact callback identity; none required a production change or weakened an existing assertion.

## Frozen rubric: one row per acceptance point

All rows use the existing payment test registration named `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 Stripe-hosted card and ACH settle once, a return reopens aging, tips stay separate and receipts retain provider outcomes`. Each row below gives its separate scenario step and source line. The helper is invoked unconditionally and adds no test registration. All native rows passed through production Worker commands and routes locally. Exact-SHA push Verify event and conclusion at report time: 42616745495, in_progress, conclusion=None.

| Item | Result | Named step and public-door proof |
| --- | --- | --- |
| PAY-021 point 1 | MET locally | `tests/api/receipt-credit.mjs:147` — PAY-021 point 1: exact installment boundaries and current Owner-only TEST Checkout refuse unsafe amounts without a request. Checkout accepts 0.01 and the exact remaining 100.02 on 100.03 of work. Zero, negative, malformed, excess precision and one cent over either balance fail without a provider call or money record. Office, Dispatcher and integration token are refused. Replay exposes no saved Checkout bearer. |
| PAY-021 point 2 | MET locally | `tests/api/receipt-credit.mjs:158` — PAY-021 point 2: Owner and Office cash and check references remain attributable staff records and unauthorized or unapproved receipts change nothing. Owner and Office each record cash and check with exact references and recording identities. No provider identity, connection, intent, tip or fee is attached. Dispatcher, Technician, custom role without permission, integration token, omitted or blank reference and a draft invoice are refused with invoices, money and Activity unchanged. |
| PAY-021 point 3 | MET locally | `tests/api/receipt-credit.mjs:174` — PAY-021 point 3: a check exceeding the remaining balance retains exactly the excess on its source invoice. Four staff receipts total 10.10 on an 80.07 invoice. A further 90.00 check produces exactly 20.03 of credit on that source invoice, with no credit invented elsewhere. |
| PAY-021 point 4 | MET locally | `tests/api/receipt-credit.mjs:182` — PAY-021 point 4: explicit credit allocations enforce customer, currency, branch, source and target limits with no money movement. Office allocates 12.01 and Owner allocates the remaining 8.02 from that 20.03 credit to the same customer, USD currency and original branch. Each record has amount 0.00 and equal opposite cent effects. Same invoice, other customer, other branch, 20.04 against 20.03 available, and 5.04 against a 5.03 target all fail unchanged. A separate AUD native invoice and imported USD invoice are merged through public commands to the same customer and original branch: even with 50.00 available, a 1.00 transfer is refused without a provider request. Current customer and site rules themselves forbid same-customer cross-branch sites, so the valid other-branch invoice necessarily has another customer; the proof does not manufacture corrupt domain records to bypass that invariant. |
| PAY-021 point 5 | MET locally | `tests/api/receipt-credit.mjs:200` — PAY-021 point 5: only the Owner records a reasoned non-cash credit. Only Owner grants the reasoned non-cash 3.07 credit. Office, Dispatcher, Technician, custom role, Agent, integration token and omitted or blank reason are refused. The credit has no provider request or cash movement. |
| PAY-021 point 6 | MET locally | `tests/api/receipt-credit.mjs:211` — PAY-021 point 6: every invoice, customer, aging bucket and CSV cell, Today tile and linked overdue item matches the independent cent ledger after every allowed and refused step. The independent oracle starts with input work prices and explicitly requested receipt, allocation and credit cents, never projected balances or payment effects. It checks every invoice and grouped customer row, every aging bucket and currency total, every parsed CSV cell including a quoted customer name, Today receivables and every linked overdue brief item after allowed and refused payment steps and replay. The target ends at 27.01; its customer ends at 32.04; all open invoices total 109.81. |
| PAY-021 point 7 | MET locally | `tests/api/receipt-credit.mjs:218` — PAY-021 point 7: Stripe revenue and technician tips exclude staff receipts and allocations, with identical restart, replay, Activity and business export. Stripe-only revenue is 100.03 and the assigned technician retains 15.00 tips in payroll. Staff receipts have zero tip and fee. The 115.01 Stripe test payout reconciles exactly to the two card sources and excludes all staff receipts; each staff source is refused by explicit Stripe allocation. Activity attributes people separately from Stripe acceptance, and the business export retains exact receipt references, reasons, cents and recording people. An actual Worker shutdown and restart preserves all projections, payroll, records and complete Activity and export after replay of every successful command and the identical authenticated provider events, with no provider POST and no new email. A revoked integration token is subsequently refused. |
| PAY-021 point 8 | HELD | Held by this brief: emailed payment and refund receipts and customer-facing payment controls remain under PAY-002; PAY-009 keyed and saved-method entry inheritance remains under its supplied FIELD-008 authorization dependency. No claim is made for this held remainder. |

## Inherited and brief-required duties

| Duty | Result | Proof or boundary |
| --- | --- | --- |
| REPORT-003 aging and downloaded CSV | MET | Independent cent ledger checks every nonempty invoice row, all customer and currency buckets, totals and every parsed CSV cell, including quoted names, after payment actions, refusals and replay. |
| REPORT-001 Today receivables and AGENT-016 overdue brief | MET | The same oracle checks the tile and every overdue amount and invoice action link. No independent mutation or model answer supplies expected money. |
| DATA-002 attributable Activity and business export | MET | Point 7 checks each successful command identity, human or Stripe actor, time, exported event identity, exact receipt reference and allocation cents, then exact restarted and replayed snapshots. |
| PAY-009 keyed and saved-method inheritance | HELD | Supplied FIELD-008 dependency retained; no new enrollment, charge authority or method collection. |
| PAY-002 and transactional payment and refund email | HELD | No customer-facing payment control or receipt email was added. Existing combined email assertions remain intact. |
| PAY-004, PAY-022, PAY-023, PAY-007, PAY-025 and PAY-026 | PRESERVED | Their existing combined scenario and payment-file registrations remain; the dedicated refund suite and deposit-batch helper have no diff. Their separate clause judgments are not claimed by this round. |

## DONE-RIDERS

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | MET for native points 1–7; whole clause PARTIAL | The seven runtime scenario steps below perform the nonempty allowed and refused outcomes. Point 8 and PAY-009 inheritance remain held. |
| 2 | PASS | Real invoices, staff receipts, card confirmations, nonempty CSV and both sides of every money and authority boundary; unchanged refusal assertions in receipt-credit.mjs:121 and the independent ledger at line 30. |
| 3 | PENDING CI | The existing payment registration is loaded by push Verify 42616745495 on this head. Current observation: in_progress, conclusion=None. |
| 4 | PASS locally | Exact committed-head payment run and a final-source public-door probe; source hashes and actual command receipts are recorded. No test or production source changed after the candidate commit. |
| 5 | INSPECTED | No new Base inheritance is asserted and no clause text changes. Existing owning-capability boundaries and PAY-009 inheritance remain intact. The brief-required Activity and export duty is performed in point 7. |
| 6 | PASS mechanical; judgments reserved | Generator write and check both pass. Generated views were restored whole from main and none is committed. Status, Gap, Evidence, summary counts and provenance text were not edited. |
| 7 | PASS | No acceptance point, ruling or coverage map changed; no existing obligation or assertion was deleted or narrowed. |
| 8 | PASS | Current Owner and Office allowed cases, all named role and token refusals, draft-invoice refusal and revoked token; original refund and erasure scenarios preserved and executed. |
| 9 | PASS boundary | Only the existing Stripe test network edge is faked. No live payment, money transfer, bank confirmation, customer-side payment or emailed receipt is claimed by the new proof. |
| 10 | NOT APPLICABLE | No new custody, spending, consent or authority policy default was adopted; the supplied conservative test-only boundary and holds remain. |
| 11 | PENDING guarded landing | The branch is pushed; main does not equal the candidate. Publication scanning and Run site for the landed candidate remain fleet duties. Baseline main Verify and Run site were observed green. |

## Pre-READY self-check

1. Every native money outcome has a populated public-door assertion, including unsafe cases refused with no balance or provider effect. Exact-SHA Verify is recorded separately, without borrowing a green run from another head. The clause is not claimed DONE because its held remainder is unproved here.
2. The only change in the existing payment file is an import and unconditional helper call. No assertion was removed, narrowed, skipped or moved behind a width or environment condition.
3. Current roles and integration tokens are refused where required; a revoked token is refused after restart. The preserved combined erasure scenario proves later authenticated events and another checkout cannot resurrect erased customer payment material. All successful payment commands and the same capture events are replayed after actual Worker restart without duplicated cents or provider POSTs.
4. No screen changed. Browser captures, icon tooltips, text sizes and layout audits are not applicable to this test-only change.
5. Contract generation and source-lock checks pass on the candidate. No migration changed. Added test lines contain no email-shaped values or provider-shaped key strings; legacy synthetic fixture addresses in the preserved existing test file remain. A full publication scan, main equality and Run site for this candidate are not established in cloud and are not claimed. The fleet must perform those gates before landing.

Exact-SHA publication scan record: `{"commit": "6a1b172ef52994689af4a5463eac96e94646b946", "complete": false, "findings": null, "historyScanned": false, "status": "NOT_RUN_CLOUD_LANDER_OWNS"}`. Full Git history is present (`--is-shallow-repository` is false). Baseline main fcfafa4d17d1ff83fcd75fd89b929a29780397f8 had push Verify 42611312391 and Run site 42611312355 completed successfully; those runs are not candidate proof. Candidate main equality is false. Candidate Run site is not run before landing.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then node scripts/edition-authoring/cli.mjs check exit=0; views=node scripts/contract-docs.mjs write then node scripts/contract-docs.mjs check exit=0; ledger=none exit=0.

PROBE PAY-021 1: payment.checkout with 0.01, exact remainder, zero, negative, malformed, excess precision, one cent over, Office, Dispatcher and integration token -> two accepted Owner test sessions and all unsafe attempts refused without effects.
PROBE PAY-021 2: payment.record with Owner and Office cash and check, missing reference, unapproved invoice and disallowed roles or token -> exact attributable staff receipts; refusals leave balances and Activity unchanged.
PROBE PAY-021 3: payment.record check 90.00 after 10.10 on an 80.07 invoice -> exactly 20.03 credit remains on that invoice.
PROBE PAY-021 4: payment.allocate 12.01 then 8.02 and all unsafe customer, currency, branch, same-invoice and limit cases -> zero-money allocation records with exact cent moves; unsafe cases refused without effects or provider requests.
PROBE PAY-021 5: payment.credit 3.07 with an Owner reason and missing reason or disallowed authority -> one reasoned non-cash credit; all unsafe attempts refused.
PROBE PAY-021 6: balances, receivables JSON and parsed CSV, dashboard and overdue brief after every payment step -> independent cent ledger agreement; target 27.01 and customer 32.04.
PROBE PAY-021 7: card confirmations, payroll, Stripe payout inspection, staff source attempts, Worker restart and identical command and capture replay -> 100.03 Stripe revenue, 15.00 technician tips, 115.01 card-only payout, zero staff tip or fee, identical retained business facts and no new provider POST or email.

## Local validation and actual receipts

- `node --test --test-concurrency=1 tests/api/payments.test.mjs`: exit 0; passed 3 registrations; actual receipt `payments-candidate.tap`.
- `node /tmp/glove-pay021-probe.mjs`: exit 0; all seven named public-door steps passed after the last test edit; actual receipt `pay021-probe.log`.
- `pnpm typecheck`: exit 0; passed; actual receipt `typecheck.log`.
- `npx -y @runeditrun/rer check --profile first-party`: exit 0; passed; actual receipt `first-party.log`.
- `node scripts/contract-docs.mjs write then node scripts/contract-docs.mjs check`: exit 0; passed; actual receipt `views.log`.
- `node scripts/contract-docs.mjs check`: exit 0; passed; actual receipt `views-candidate.log`.
- `node scripts/edition-authoring/cli.mjs lock then node scripts/edition-authoring/cli.mjs check`: exit 0; passed; actual receipt `lock-final.log`.
- `node scripts/edition-authoring/cli.mjs check`: exit 0; passed; actual receipt `lock-candidate.log`.
- `node tests/inventory.mjs --json`: exit 1; 202 of 200, unchanged from supplied and observed main inventory; no new registration; actual receipt `inventory.json`.

The exact-head payment TAP contains all three existing registrations. `RECEIPTS.json` records the full SHA, actual command outcomes, source hashes, CI observations, counts and named proof map. The separate final public-door probe uses the committed helper source without registering another test. `push.log` records the successful guarded product push. No credential file, environment dump, private gate data or symlink is selected for evidence transfer.

The report packet is published only to evidence/sx-glove-c-f220. Evidence publication grants neither product acceptance nor landing. No blocker was found in the buildable native points; the held dependencies keep the clause PARTIAL. The fleet owns exact-SHA publication scanning, landing and the resulting Run site.

CLAIM PAY-021 PARTIAL points=1,2,3,4,5,6,7 tests=tests/api/payments.test.mjs#PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 Stripe-hosted card and ACH settle once, a return reopens aging, tips stay separate and receipts retain provider outcomes
GAP PAY-021: Point 8 payment and refund email and customer-facing payment controls remain held under PAY-002; PAY-009 keyed and saved-method inheritance remains under the supplied FIELD-008 dependency. No live money movement, bank confirmation or live Stripe activation is claimed.
