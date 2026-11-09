# PAY-023 refund qualification — sx-glove-c-f175

Repository: https://github.com/just-every/run-glove
Branch: `cloud/sx-glove-c-f175`
Candidate: `ea3d39b6771c099c2ade3e6c2693e6ac2ea393cc`
Baseline main: `a81e93dc401029a20f3bf38570b4b2fefd637246`
Product commits: `05af82fea1b3f3a49ed73ffc6c124eb4d9ef89b5` and `ea3d39b6771c099c2ade3e6c2693e6ac2ea393cc`.
PR: none; this repository starts Verify on the named branch push.

PAY-023 remains PARTIAL. This round qualifies native points 1–6 through the signed-in command door, authenticated Stripe TEST events and the actual built Owner controls. It fixes one exposed defect: `payment.refundRefresh` accepted a failed refund, although that refund's reservation had already been released. The command now requires `status === 'pending'` as well as a retained provider reference. The focused test first reproduced acceptance of a failed refresh where `REFUND_STATE` was required, then passed after this one-condition repair. No CI repair round was undertaken.

The source Status, Gap and Evidence cells, clause wording and generated views remain unchanged. Counts before and after: **24 DONE, 210 PARTIAL, 29 MISSING**, all 263 Status rows retained. Plan row for the receiving lane: PAY-023, native points 1–6 qualified; whole-clause status remains PARTIAL for the held inheritance below. No plan file was rebuilt or edited.

## Plan executed

1. Read the launcher and repository instructions, the target's six acceptance points and live Gap, the supplied campaign extract, rulings and all eleven DONE riders. Map the existing combined payment journeys before adding focused proof.
2. Use the existing native Worker, D1, real session and invitation harness. Prepare Stripe source payments only through signed-in Owner TEST Checkout after Owner-configured tip choices; settle card and ACH only through signed provider events. Record manual source payments as Office cash and check receipts. Keep the existing harness and Stripe fixture unedited.
3. Exercise all six points as named steps in one registered refund sanity journey. Each step owns a fresh native installation and cleanup. Use the current main's scenario helper so every assertion still executes without six independent registrations.
4. Exercise Owner refund and refresh controls through the real built page. Assert behavior once at 1440; capture the same actual states at 1440 and 390. Route only the API origin to the real authenticated Worker fixture. Fake only Stripe's network edge, never command results, balances, payroll or exports.
5. Reproduce and repair the failed-refund refresh defect. Preserve all existing payment assertions and the explicitly protected files. Run touched API and browser proof, typecheck, build, first-party check, contract generation and source-lock checks.
6. Fetch and rebase before the first publication, retaining the newer main test consolidation. After publication, fetch and merge main before the final candidate. Publish both substantial commits through the fleet push guard, without force or default-branch writes. Recheck identity and trailers across every candidate commit before each push.
7. Keep this report, actual receipts and screenshots outside the product tree. Publish explicitly selected files only to this task's separate evidence ref.

## Frozen native-outcome rubric

All rows below use the exact candidate above. API denotes `tests/api/refunds.test.mjs`, registered journey **PAY-023 original-method refund authority, accounting and recovery** (line 57). Browser denotes `tests/browser/refunds.spec.ts`, registered journey **PAY-023 Owner refunds and refreshes original-method outcomes with unchanged states after Worker restart** (line 12). Each API step is separately labelled in the TAP receipt. Local PASS below means executed and passed; it does not assert that the branch Verify has finished.

| Row | Acceptance sentence or requested qualification | Public-door proof and observed outcome | Local result |
| --- | --- | --- | --- |
| R1 | Point 1: signed-in Owner authority | API line 58: Owner succeeds; Office, Dispatcher, Technician, a custom role explicitly granted both refund verbs, a former Owner, signed-out caller and an integration token are refused without payment or balance changes or provider calls. | PASS |
| R2 | Point 1: branch boundary | API line 58: Owner limited to a different branch receives NOT_FOUND and changes nothing. | PASS |
| R3 | Point 1: confirmed and unresolved principal cap | API line 58: original 207.90, confirmed refund 50.00 and pending refund 20.00; 137.91 refused, exactly 137.90 succeeds. Pending funds do not reopen the balance. | PASS |
| R4 | Point 1: original method | API lines 58 and 139: card, ACH, cash and check retain the original method and linked payment; supplied alternate method cannot change card or ACH routing. | PASS |
| R5 | Point 2: principal and tip bounded separately | API line 94: excess principal and tip each refused; after a 10.00 tip return, 5.01 refused and exactly 5.00 accepted. | PASS |
| R6 | Point 2: tip-only accounting | API line 94: technician payroll JSON tips go 15.00 to 5.00 to 0.00. Invoice due stays zero, collected-tax JSON stays identical, and a nonempty REPORT-001 receivables tile still holds the unrelated unpaid 207.90 invoice. | PASS |
| R7 | Point 3: later return | API line 120: after refunding 50.00 principal and 5.00 tip, a signed charge.dispute.created event reverses only 157.90 and 10.00. Duplicate event has no second effect; restart preserves results. | PASS |
| R8 | Point 4: cash and check already returned | API line 139: Office records each original receipt, Owner records its full original-method refund as paid, with zero Stripe requests. | PASS |
| R9 | Point 4: durable reservation before request | API line 139: pause the actual Stripe response; read the independently persisted reserved payment record with empty effects before releasing it. Exactly one POST has the key glove-refund- plus that retained refund id. | PASS |
| R10 | Point 4: concurrency and replay | API line 139: concurrent excess request refused; same command replay while the first response is paused makes no second request; replay and cron after actual Worker restart also make none. | PASS |
| R11 | Point 5: separate payment-linked records | API line 185 and common trail helper line 45: four distinct refund ids retain their original payment, method and status in state and business export. | PASS |
| R12 | Point 5: honest unresolved and failed states | API line 185: pending, failed, HTTP 503 and genuinely rejected fetch outcomes all leave paid invoice due at zero and have empty effects. Browser shows pending, failed, reserved and the unknown-outcome explanation. | PASS |
| R13 | Point 5: no automatic resend | API line 185: command replay, repeated cron and actual Worker restart retain the exact records with four original POSTs only. | PASS |
| R14 | Point 6: retained-reference read only | API line 232: refresh produces only GET for the retained refund reference, never a new refund POST. | PASS |
| R15 | Point 6: confirmed success exactly once | API line 232: pending success reopens 50.00 once; command replay after actual restart does not reopen again. | PASS |
| R16 | Point 6: failed reservation releases | API line 232: pending-to-failed has no balance effect; its released principal becomes available. An unresolved 10.00 remains reserved, so 147.91 is refused and 147.90 accepted. | PASS |
| R17 | Point 6: invalid refresh refused | API line 232: paid, failed and reference-less reserved refunds are refused unchanged. Even a later succeeded edge answer cannot refresh a failed record. Office refresh is refused. | PASS |
| R18 | Owner refund and refresh controls | Browser line 12: submit through the refund form; pending refresh appears, success reopens 20.00, failed and unknown outcomes retain that balance, refresh disappears on terminal outcomes, reload after restart retains the states, Office sees neither refund control. | PASS |
| R19 | Both proof widths | Browser capture calls at lines 73, 86, 94 and 108 produce actual pending, confirmed, failed and unknown-after-restart panels at 1440 and 390. Assertions run at 1440. Visible controls have words, with no icon-only control on the payment panel; no product UI edit was required. | PASS |
| R20 | DATA-002 attributable Activity and business export | Common API trail helper lines 40–54, all six steps and Browser line 111: actual refund events retain Olivia Owner, owner role, fixed time and command id; provider outcomes remain attributable; exported facts match. Test key values and hosted Checkout URLs are absent. | PASS |
| R21 | Current authority and erasure replay | API line 58 refuses withdrawn Owner authority and a revoked token; line 185 erases the customer and personal refund material, restarts, refuses old command replay as ERASED, retains anonymous records and makes no further provider call. | PASS |
| R22 | Inherited BASE-SECRET-001 duty within this change | Existing PAY-023 cites BASE-SECRET-001. The common trail helper checks Activity and business export for the synthetic connection secrets and hosted Checkout material. Erasure removes provider references and personal saved outcomes. No credential collection or new provider custody is introduced. | PASS |

## DONE-RIDERS review

| Rider | Result for this bounded claim | Evidence |
| --- | --- | --- |
| 1 | Native outcomes PASS locally; whole clause remains PARTIAL | R1–R22 cover all six native acceptance points. Explicit held inheritance remains below. Exact-SHA Verify still required. |
| 2 | PASS | Money authority and amount cases execute supported and refused paths; refusals independently compare records, balances and provider-call counts. Payroll and nonempty receivables are read. |
| 3 | PENDING exact-SHA CI | Push Verify 42544130561 runs both new files through the existing API and browser file globs. Last observation: in_progress, conclusion null, candidate ea3d39b6771c099c2ade3e6c2693e6ac2ea393cc. No gate or test is hidden behind an opt-in flag. |
| 4 | PASS locally | Actual API and browser receipts identify the exact final SHA. The six steps and both screenshot widths are rerun on that candidate. |
| 5 | PASS | PAY-023's existing BASE-SECRET-001 citation and named payment duties remain unchanged; R20–R22 exercise the applicable delta. |
| 6 | PASS mechanically; judgments retained | Contract generator write and check exit 0; generated views restored from main. No Status, Gap, Evidence or counts edited. The lander owns any later judgment and generated-view update. |
| 7 | PASS | No acceptance sentence, id map, coverage rewrite or ct ruling changed. |
| 8 | PASS | R1–R4, R14–R18 cover Owner refund and refresh and unsafe authority, state, amount and reference cases with unchanged financial records on refusal. |
| 9 | PASS for honest boundary | Stripe is an existing network-edge fake in TEST mode. No live Stripe, settlement, bank, provider compliance or money-movement acceptance is claimed. |
| 10 | NOT APPLICABLE | No new policy default adopted. The pending-only rule is already explicit in PAY-023 point 6. Existing held policy and account boundaries remain held. |
| 11 | PENDING guarded lander | No default-branch write. Candidate remains branch-only. Exact-SHA publication scan, Verify completion, main equality and resulting Run site are external landing duties. |

## Checks, inventory and custody

- Actual exact-SHA results are in `checks-receipt.json`, `api-receipt.tap`, `browser-receipt.json` and `browser-receipt.log`. API: one registered journey, six named point steps, all passed. Browser: one journey passed; assertions at 1440, proof at 1440 and 390.
- Pinned Node 22.20.0 was selected for final API, browser and typecheck. Chromium is `/usr/bin/chromium` with the repository's no-sandbox launch argument. All owned test installations and server processes are closed by their maintained runner.
- Production build passed. The production change was unchanged between that build and the final SHA; the second commit only consolidated API registration and refreshed its source lock.
- Typecheck, first-party check, contract write, contract check, lock generation and lock check pass. No migration changed, so the migration-ledger check is not applicable. Product checkout was clean after regeneration.
- Inventory limitation, reported without weakening or deleting assertions: the new main inventory counts **203/200 on baseline main** and **205/200 on this candidate**. This round adds one API journey and one browser journey. All existing payment assertions and protected files are preserved. The baseline was counted in a detached main worktree and that worktree was removed. `main-test-inventory.json` and `test-inventory.json` are the actual comparative receipts. No cap was raised. Remaining suite consolidation belongs to the receiving lane.
- Main baseline a81e93dc401029a20f3bf38570b4b2fefd637246 has successful Verify 42542975207 and Run site 42542974673. Earlier baseline 91f64e494b7e2f4c29f47457a92ca24e8b5b3dde had successful Verify 42541507336 and Run site 42541507337. These are baseline facts, not candidate green claims.
- Final candidate Verify: push run **42544130561**, exact SHA ea3d39b6771c099c2ade3e6c2693e6ac2ea393cc; observed in progress. Previous candidate run 42543795046 is superseded and is not candidate acceptance evidence. Four GitHub API calls have been used: initial main discovery, first-candidate discovery, final-candidate discovery and updated baseline discovery. No polling, dispatch or rerun was used.
- Publication scan receipt: `commit=ea3d39b6771c099c2ade3e6c2693e6ac2ea393cc complete=not_run historyScanned=not_run findings=unestablished`. Full-history clone retained through evidence publication; the maintained Mac lander must run the COMPLETE scan and require zero findings before landing. No scan result is fabricated.
- Main equality: false by design; candidate is branch-only above baseline main. Candidate Run site: not run, because that workflow belongs to landing on main.
- Product push guard succeeded on both substantial commits. All candidate author and committer identities are the fleet identity; trailers are absent. No other repository was cloned or written, no PR was needed, and no product push targeted a default branch.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write and check exit=0, restored from origin/main; ledger=none exit=0

## Pre-READY self-check

1. Native money, security and recovery outcomes execute both safe and unsafe paths through the real public doors. Whole-clause DONE is not claimed. Exact-SHA Verify remains a lander requirement.
2. No existing assertion was removed, narrowed, skipped or conditioned on width. The six new scenarios retain every assertion after consolidation. The first browser audit's false positive was a hidden control; its corrected audit checks visible controls, matching the existing browser convention.
3. Revoked-token, withdrawn-role, erasure and capture or command replay paths are exercised in the focused API journey. Restarts use the real Worker's persisted D1 installation.
4. No product screen was changed. The tested payment panel uses the existing components; its visible controls have text, no icon-only control, and existing readable text. Screenshots are scoped to that panel, excluding unrelated invoice email and payout sections.
5. Source lock is fresh; generated views check; first-party check and typecheck pass. Inventory overage, CI completion, publication scan and landing receipts are honestly separated above.

## Held remainder and plan handoff

PAY-009 keyed and saved-method entry inheritance stays ct-held under the brief's FIELD-008 authorization hold. Job-held deposits under QUOTE-003 and QUOTE-014, Wisetack financing under PAY-006 and PAY-024, Xero and QuickBooks entered-payment refund readback under LEDGER-002 and LEDGER-001, and every other provider, Base, account and activation hold remain unchanged. This round creates no receipt email, automatic resend, new payment-entry door or live activation. Existing customer-side Checkout, customer tips, wallets, reconciliation, receipts, PAY-004 fixture, PAY-021 allocation and receipt, PAY-022 inheritance, PAY-007 payout and PAY-026 Instant Payout obligations remain with their owning clauses. The next same-file inheritance named by this plan is held PAY-009; no unprovided ruling is invented.

CLAIM PAY-023 PARTIAL points=1,2,3,4,5,6 tests=tests/api/refunds.test.mjs#PAY-023 original-method refund authority, accounting and recovery; tests/browser/refunds.spec.ts#PAY-023 Owner refunds and refreshes original-method outcomes with unchanged states after Worker restart
GAP PAY-023: Native points 1–6 have local exact-SHA proof; the brief's held PAY-009 payment-entry inheritance and other named provider and policy holds remain. Exact-SHA Verify and guarded landing are pending.

PROBE PAY-023 1: signed-in refund command, role matrix and 137.91 versus 137.90 after confirmed and pending refunds -> unsafe cases refused unchanged; exact remainder and original methods succeed.
PROBE PAY-023 2: tip-only refund command and payroll JSON -> tips 15.00 to 5.00 to 0.00; invoice balance, collected tax and nonempty receivables tile unchanged.
PROBE PAY-023 3: signed charge.dispute.created after partial refund -> only remaining 157.90 principal and 10.00 tip reversed, duplicate and restart unchanged.
PROBE PAY-023 4: Office manual receipts and paused Stripe edge -> manual refunds make no request; durable reservation precedes one keyed POST; concurrent excess, replay and restart add none.
PROBE PAY-023 5: pending, failed, HTTP 503 and unreachable refund edge -> four linked records, zero reopened balance; replay, cron, restart and later erasure add no request or personal resurrection.
PROBE PAY-023 6: refund refresh command with retained reference -> GET only; success reopens once, failure releases its cap, terminal or reference-less records refused, no new refund POST.
