# sx-glove-c-f172 — PLAN-013

Product repository: just-every/run-glove. Branch: cloud/sx-glove-c-f172.
Candidate: 5279e022c322a9fcac68ca3bc2fa92f8619950d1. PR: none required; push Verify is the existing entry point.

The native date behavior needed qualification, and no product defect was exposed. The product diff contains only the new focused API journey, an additive invoice case in the existing revenue browser journey, and the regenerated source lock. CONTRACT.md and both generated views are unchanged. Existing provider, customer payment, receipt, dunning, live accounting and release holds remain unchanged.

Plan and execution

1. Read the launcher, repository rules, PLAN-013, its operating rules, existing invoice implementation, report journey and recurring billing proof. Map each acceptance outcome before adding assertions. The main implementation already rejected early monthly approval, froze issue and due dates, separated approval time, labelled late approval and retained legacy approval-date behavior.
2. Reuse fixedMonthlyReports without editing its harness. Through actual Worker cron, native commands and the runtime clock, add Chicago and Pacific approval boundaries, every aging cutoff, all report and accounting representations, correction and replay, and a real restart from an earlier approval writer to the current Worker.
3. Add invoice-label and QuickBooks inspection controls to the existing revenue browser journey. Preserve every original assertion. Assert at 1440 and capture the same records at both 1440 and 390.
4. Save the first real commit immediately with skip CI, merge updated main without rewriting published history, run the touched checks, generate and check views, restore them from main, and regenerate the source lock last. Main's test consolidation and scenario helper were retained whole.
5. Push only the named product branch. Keep all report bytes outside the product checkout and publish explicitly selected public-safe reports, receipts and screenshots only on the evidence ref. Scanning, main equality and Run site remain guarded lander duties.

Initial gaps closed

Existing combined recurring billing proof did not independently qualify the one-day-before and exact branch boundaries, every aging cutoff, the invoice detail labels, or a Worker upgrade from approvals without frozen dates. The focused journey closes these outcomes without changing production behavior. No acceptance point or contract judgment was changed.

Proof map

API journey A is tests/api/fixed-monthly-dates.test.mjs, “PLAN-013 fixed-monthly dates survive approval boundaries, aging, exports and a legacy Worker upgrade” (registration at line 41). It has three successive named scenario steps and isolated native installations, all assertions executed with failure propagation and cleanup. These are related steps of one date-custody behavior, not hidden registrations.

Browser journey B is tests/browser/revenue.spec.ts, “REPORT-002, REPORT-004 the owner filters job margins and downloads the matching CSV at 1440 and 390” (registration at line 100), including fixedMonthlyRevenue at line 154 and the additive invoice case at line 209. The existing report journey is preserved.

API journey C is tests/api/fixed-monthly-reports.test.mjs, “REPORT-004 fixed-monthly reports freeze three local period ends across approval, correction, export and Worker restart” (registration at line 25). Its source bytes are unchanged and it was rerun with A.

| Item | Public door and independently checked outcome | Proof |
| --- | --- | --- |
| PLAN-013 point 1 | Actual cron generates native monthly drafts for January, February and March; a full local day before and the last millisecond before both Chicago and Pacific period ends refuse BILLING_EARLY with full state unchanged; exact local midnight approval succeeds. Existing builder supplies later approvals in both zones. Exact issue date, approval instant, named Office approver, 14-day terms, local approval date, late flag and frozen due date are compared. | A lines 42–73; native fixedMonthlyReports builder unchanged. |
| PLAN-013 point 2 | Receivables exclude drafts and approvals later than the selected as-of date. Every monthly invoice crosses due day, day 1 and the 30, 31, 60, 61, 90 and 91-day cutoffs with exact invoice balance, global currency bucket counts and totals. Every late invoice is visibly labelled; on-time and draft documents have no false late label. Revenue and tax show every late-approval row. | A lines 77–94 and 103–123; B lines 185–207 and 211–259. |
| PLAN-013 point 3 | Inclusive period-end revenue JSON has 3 invoices and 440.00 revenue; tax JSON has 36.00 main and 8.00 Pacific tax. Every parsed revenue and tax CSV row is compared with an independently authored expected row. Every accounting invoice row carries the frozen dates and amount; all QuickBooks payload dates are checked. Real invoice controls prepare and read the matching QuickBooks inspection download. | A lines 103–142; B lines 218–229. |
| PLAN-013 point 4 | Changing terms from 14 to 0 and approving a 150.00 correction leaves all original dates and approval facts unchanged, preserves the original CSV, and writes the correction with January 31 issue and February 17 due. A Worker built with the earlier approval writer creates a real monthly approval without frozen dates; after restart with rebuild to current production code, all earlier report JSON, parsed CSV, aging, accounting and QuickBooks outputs are byte-equivalent or deeply equivalent, on their February 2 approval-date basis. No D1 row is manufactured. | A lines 144–172 and 192–247. |
| PLAN-013 point 5 | Generation, approval, exports, three repeated cron passes, command replay before and after real Worker restart leave no payments, notices, customer messages, charges, receipts or dunning events. The outbound counter equals only the native invitation messages. Stripe, customer email and Twilio counters remain zero. Activity and business export retain exact actor, command, subject and time and every invoice's records. | A lines 159–189 and 239–247; B lines 260–261. |
| Inherited GLOVE-09 correction duty | Current Office correction succeeds with a revision and its accounting output. A field person is refused with full state unchanged; replay returns the original result and changes nothing after restart. No approval or financial fact is lost. | A lines 63–66 and 144–180. |
| Inherited report-date duty | Revenue, tax, aging, CSV and QuickBooks all use the frozen issue or due basis, while the older document retains first-approval basis. REPORT-004 permission and branch refusal assertions remain present and pass. | A and C; C is unchanged. |
| Inherited DATA-002 attribution | Native approval and export events include actor identity, role, time, command and subject in Activity and the business export. No inspection causes a provider or collection effect. | A lines 173–189; assertTrail in unchanged tests/api/harness.mjs at line 343. |
| Owning-clause held obligations | Automatic collection, receipt delivery and dunning remain with the payment, plan and messaging clauses named by point 5. Live QuickBooks posting and Xero provider acceptance are outside this inspection proof. | No authority or product implementation was added; point 5 refusal and no-effect assertions pass. |

Runtime probes

PROBE PLAN-013 1: invoice.approve at Chicago 2025-01-31T06:00:00.000Z -> issued 2025-01-31, due 2025-02-14, Office identity and exact approval instant; Pacific before local midnight -> BILLING_EARLY and unchanged state; Pacific late approval at 2025-02-03T06:30:00.000Z -> approvedOn 2025-02-02, due 2025-02-16.
PROBE PLAN-013 2: receivables.json at offsets 0,1,30,31,60,61,90,91 from each frozen due date -> current,1-30,1-30,31-60,31-60,61-90,61-90,over90; invoice and late report rows show exact frozen dates at both proof widths.
PROBE PLAN-013 3: revenue and tax routes for each period end -> 440.00 revenue and 44.00 tax with all parsed rows checked; invoice export and QuickBooks inspection -> frozen period-end issue dates.
PROBE PLAN-013 4: business.save terms 0; invoice.correct, invoice.approve revision 2 and invoice.export -> original dates unchanged and correction amount 150.00; legacy Worker approval followed by actual upgrade -> February 2 issue and February 16 due with every earlier output unchanged.
PROBE PLAN-013 5: scheduled passes, replay of the same approval command and real Worker restart -> identical terminal state, no Stripe call, no customer message, payment, receipt or dunning; attributable Activity and business export retained.

DONE-RIDERS

| Rider | Local result and exact-candidate evidence |
| --- | --- |
| 1 | PASS locally: every acceptance outcome is exercised through native public doors by A and B; recorded exact-SHA Verify result is tracked below. |
| 2 | PASS: nonempty seeded monetary records; exact expected values; BILLING_EARLY and FORBIDDEN attempts compare the entire visible business state before and after. A lines 54–73 and 149–151. |
| 3 | Pending exact-SHA CI: new API filename is included in the existing API glob; B is part of the existing browser selection. No workflow edit or optional flag is needed to execute assertions. Browser run.mjs always supplies screenshot paths. |
| 4 | PASS locally: A and C rerun on the committed SHA; B rerun on the committed SHA. Source-receipt hashes bind actual tested bytes to HEAD. |
| 5 | PASS inspected: PLAN-013 explicitly carries date behavior and names each owning payment, plan and messaging obligation in point 5. No new inheritance is invented. |
| 6 | PASS mechanical: generator write and check succeed; generated views and all contract judgments remain exactly main's. Landing owns any final status and evidence update. |
| 7 | PASS inspected: no acceptance sentence, status, Gap, Evidence, coverage map or ruling changed. |
| 8 | PASS: Office approval and correction complete; field approval fails with unchanged full state. Existing authorization, branch and revoked-token report proof in C remains unchanged. |
| 9 | PASS: only native date calculations and inspection downloads are claimed. No live accounting, automatic collection, mail delivery, tax compliance or provider account acceptance is claimed. |
| 10 | Not applicable: no policy choice or default was adopted. The existing month-end rule is unchanged. |
| 11 | Pending guarded landing: branch-only. Main equality, exact-SHA full-history publication scan and Run site must be supplied by the lander. |

PRE-READY

1. Exact values, nonempty rows and unchanged-state refusals would fail if the named behavior were removed or wrong. API and browser assertions pass locally; candidate Verify is tracked below.
2. No preexisting assertion was removed, narrowed, moved behind a width condition or weakened. The only correction to a new audit assertion was to exclude hidden controls inside a closed details section from accessible-name checks; visible controls are audited. No product fix was required.
3. Replay is exercised before and after real restart. Current-role refusal changes no record; the existing branch and revoked-token report test is retained. No erasure implementation, credential door, capture authority or data exposure changed.
4. No screen code changed. Invoice and report screens were shown at both widths. Visible invoice controls have accessible names; icon-only controls, if present, require a described tooltip on hover and focus. A disabled button inside the closed saved-card details section is not an icon control. Existing layout and typography are retained; no design or homepage work was performed.
5. Source lock check passes on committed HEAD; contract generation passes. New text has no email-shaped value. Candidate Verify, scan and main-only Run site are tracked honestly below.

Checks and limitations

Touched proof: A and preserved C pass together; B passes on actual setup and dev with system Chromium and no sandbox. Typecheck and rer check --profile first-party pass. Generator write and check pass, and both view files are restored from main. Source lock is regenerated after the final edit and merge, then checked on the exact committed tree. No migration changed; ledger check is not applicable.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses PLAN-013 then check exit=0; ledger=none exit=0.

Main added its inventory counter during this round. That merged main counts 203 tests including four assertion scripts; this focused journey adds one, for 204 against the existing cap of 200. No cap was raised. No unrelated or protected journey was removed to conceal the inherited overage. The three new scenario steps share one registered lifecycle journey. This inventory issue remains reported for the test-consolidation lane and does not disguise a passing cap check.

Counts before and after this branch: 24 DONE, 210 PARTIAL, 29 MISSING; all 263 Status rows retained. PLAN-013 remains PARTIAL in source; the proposed claim qualifies points 1–5 for DONE on landing. No plan row was edited in this cloud. Intended plan update: PLAN-013 native points 1–5 proven; all separately owned automatic collection, receipt, dunning and live provider duties remain with their owning clauses.

Product blocker: none exposed. Publication scan is not run in this cloud, as instructed. Exact-SHA scan receipt: commit=5279e022c322a9fcac68ca3bc2fa92f8619950d1, complete=unestablished, historyScanned=unestablished, findings=unestablished. Main equality is false because only the cloud branch is pushed. Candidate Run site is not run before main; it remains a lander gate. These are not claims of completed publication or landing.

CI at discovery: Verify 42543925199, event push, exact head 5279e022c322a9fcac68ca3bc2fa92f8619950d1, in_progress. Prior observed main 91f64e494b7e2f4c29f47457a92ca24e8b5b3dde had Verify 42541507336 success and Run site 42541507337 success. The merged main is a81e93dc401029a20f3bf38570b4b2fefd637246 and has not been separately claimed green in this report.

Final CI and custody receipt will be appended after exact-candidate proof completes.

Final local proof and handoff

Exact committed head 5279e022c322a9fcac68ca3bc2fa92f8619950d1: the focused API journey plus preserved REPORT-004 API journey passed (2 of 2); the revenue browser journey passed (1 of 1), with 28 actual screenshots. All relevant test, fixture, contract and lock bytes match the committed source. There is no product implementation change.

Verify 42543925199, event push, remained in_progress with null conclusion at the permitted REST observation at 2026-11-09T01:13:33Z on this exact head. Three REST calls were used in total: prior-main discovery, candidate discovery, and one observation after 300 seconds. No rerun or dispatch was made, and no failure was observed. CI is not claimed green. The cloud-specific brief delegates the remaining exact-SHA CI and publication gates to the maintained lander; the product is branch-only. Rider 3 remains pending CI and rider 11 remains pending guarded landing.

The claim below offers the locally qualified native clause for acceptance on guarded landing; it does not change source judgments or claim completed main gates. No native acceptance gap or new policy default remains.

CLAIM PLAN-013 DONE points=1,2,3,4,5 tests=tests/api/fixed-monthly-dates.test.mjs#PLAN-013 fixed-monthly dates survive approval boundaries, aging, exports and a legacy Worker upgrade; tests/browser/revenue.spec.ts#REPORT-002, REPORT-004 the owner filters job margins and downloads the matching CSV at 1440 and 390

Counts remain 24 DONE, 210 PARTIAL, 29 MISSING. Intended plan update is PLAN-013 native points 1–5 qualified; no plan file or Status cell was edited. Product blocker: none. Inventory follow-up remains 203 on merged main to 204 on candidate against cap 200; no existing assertion was removed to fit the count.
