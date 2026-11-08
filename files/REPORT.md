# sx-glove-c-f156 — REPORT-004 point 2

Repository: just-every/run-glove. Product branch: cloud/sx-glove-c-f156.

Plan: qualify only the native monthly reporting point. Map the current date implementation and existing proof; create one focused public Worker journey with three actual cron months, real Owner rules and Office approvals; independently compare frozen dates, complete revenue and tax CSV records, aging, statements, accounting exports and QuickBooks inspection; test current read permission, branch scope, restart and correction immutability; prove report late-approval rows through the existing Reports page at 1440 and 390; run touched tests, typecheck, first-party checks, contract generation and source integrity; publish product and separate report evidence. Preserve all contract judgments and inherited holds.

Initial findings: period-end issue dates, approval identity and time, later-of-period-and-local-approval terms and downstream API exports already exist. The Reports page omits the API late-approval rows. No production billing or storage edits are planned. The two recurring-billing test files and the series UI remain untouched.

Scope: point 1 remains held by its quoted field-quote and payment clauses. No charge, receipt, dunning, live provider activation, release or main push is authorized. REPORT-004 remains PARTIAL regardless of completion of point 2. Plan row to update on the fleet: REPORT-004 point 2 native proof, retaining all held point 1 work.

Validation and final provenance will be appended after the candidate is committed.

## Product result

Candidate: ed241ebb34b7f0491ea056cdd53a0f40fdce9c58. Base main: 4eea04c27f02aa2cb0c12edc421a9b4e574de0bf. Branch: cloud/sx-glove-c-f156. PR: none; Verify has a branch-push entry point. Product commits: a51777c58524184192b8d7c1310027f3d453bd90, then ed241ebb34b7f0491ea056cdd53a0f40fdce9c58. The first push omitted three edits after an autostash unstaged them; the second published commit adds all three without rewriting the first. Only the final head is a landing candidate.

The production change renders the existing report API's six late-approval records for revenue and sales tax, with distinct issue, approval and due dates and responsive date labels. It reuses the seed's existing table and responsive styling. No billing-generation, storage, recurring-series UI, recurring-billing test, provider or contract implementation changed. No assertion was deleted, skipped, narrowed or put behind a new width condition. The existing browser registration now invokes the focused monthly report journey too.

Source judgments remain exactly as on main: REPORT-004 PARTIAL → PARTIAL, point 2 newly qualified locally, point 1 held. Counts before and after: 20 DONE, 214 PARTIAL, 29 MISSING (263 Status rows). No CONTRACT.md Status, Gap, Evidence or acceptance text was edited. No generated views are committed. Plan extract row to update: REPORT-004 point 2 proof and the visible late-approval rows; do not change any held remainder or global campaign order.

## Qualification rubric and evidence

The API journey is tests/api/fixed-monthly-reports.test.mjs#REPORT-004 fixed-monthly reports freeze three local period ends across approval, correction, export and Worker restart, starting at line 23. The browser journey is tests/browser/revenue.spec.ts#REPORT-002, REPORT-004 the owner filters job margins and downloads the matching CSV at 1440 and 390; the monthly helper begins at line 154. All API rows below run through real native commands and report HTTP routes on the production Worker with migrated disposable D1, real invited people and the existing boundary clock. No domain row is SQL seeded. Provider edges exist only in the established harness and receive no product-provider requests.

| Item | Public outcome and assertion | Evidence | Result |
| --- | --- | --- | --- |
| REPORT-004 acceptance 1 | Field quote close rate and collected-payment tax | Explicitly held by the assignment's named quote and payment clauses | HELD; no claim |
| REPORT-004 acceptance 2 | Three fixed-monthly local periods, period-end issue dates, independent approval metadata, later-of-period-and-approval terms, approval-gated aging and frozen report and export dates | Entire focused API journey plus browser monthly helper | PASS locally; exact-head Verify recorded separately |
| P2.1 | Owner creates four native recurring rules; actual Worker cron generates three months; Office early approval is refused unchanged, exact local period-end approvals and late approvals land | tests/api/harness.mjs:603–665; API lines 35–50 | PASS |
| P2.2 | Every approved invoice has independently fixed issue, approval and due dates; exact approver and UTC time retained | API lines 39–46; explicit three-month date table in harness | PASS |
| P2.3 | Every revenue JSON group and parsed CSV record, including late rows, matches the frozen issue month | API lines 51–88 | PASS |
| P2.4 | Every tax JSON jurisdiction and month and parsed CSV record matches the same periods; honest approved-invoice tax basis | API lines 51–88 | PASS; no collected-payment proof claimed |
| P2.5 | Both inclusive period boundaries, exact one-day period ends, branch filtering and exclusion of next-month approvals from the wrong issue period | API lines 79–88 | PASS |
| P2.6 | Drafts are excluded; approved balances age from each frozen due date, and approvals after the as-of date are excluded | API lines 89–118, including 11 approved documents and 3 unapproved drafts | PASS |
| P2.7 | Customer statement JSON and every parsed CSV record retain dates, amounts and basis | API lines 104–115 | PASS |
| P2.8 | Accounting CSV has all 11 approved invoices, every original cell checked; QuickBooks inspection has the same issue and due dates | API lines 121–137 | PASS; inspection only |
| P2.9 | Native ordinary and per-visit invoices keep their local approval-date basis even though their work was in January | API lines 39–46 and 86–87; harness ordinary and per-visit native completion | PASS |
| P2.10 | Los Angeles branch approval date differs from the Chicago business date at the same UTC instant, including the March daylight-saving transition | Harness explicit Pacific dates; API date, branch-report and historical-aging assertions | PASS |
| P2.11 | Actual Worker disposal and recreation preserves complete records and identical report, aging, statement, CSV and QuickBooks reads | API lines 138–145 and 194–197 | PASS |
| P2.12 | Signed-out, field and custom-role report reads and forbidden branches fail through JSON and CSV without record changes; a revoked token fails on the next read | API lines 146–168 | PASS |
| P2.13 | Terms change, draft correction, approval and later accounting export leave every original frozen date and approval intact; original export is immutable | API lines 169–197 | PASS |
| P2.14 | No charge, receipt, dunning, product email, SMS or provider call | API lines 198–203; outbound count equals only native invitation mail | PASS |
| P2.15 | Reports shows all six late-approval rows for revenue and tax; branch selection narrows them; next-period report clears them | Browser lines 154–211 | PASS locally at 1440; same screens captured at 1440 and 390 |

UI regression proof: before the repair, the real browser expected six late-approval rows and received an empty array. After rendering the API projection, the same journey passes. The pre-repair failure is retained in baseline.txt. The API expectations do not depend on source-date calculation helpers. CSV records are parsed with quoted-field support; comparison normalizes unspecified report-row ordering while checking every record and cell.

## DONE-RIDERS

| Row | Result on this partial point | Evidence and limitation |
| --- | --- | --- |
| 1 | PARTIAL for the whole clause; P2 PASS locally | P2.1–P2.15 cover the complete assigned monthly point. Acceptance 1 remains held. |
| 2 | PASS locally | Populated real records; early approval and forbidden report reads are attempted and checked unchanged; correction is executed and read back. |
| 3 | PENDING Verify until the recorded conclusion below | API wildcard and browser revenue file already run under existing push Verify commands; no workflow edits or hidden feature flag. |
| 4 | PASS locally | Exact committed head API and mechanical runs; relevant test and UI bytes match browser proof, with a fresh-install browser rerun on the exact head. |
| 5 | INSPECTED | REPORT-004 acceptance 2 explicitly names PLAN-005, PLAN-012 and PLAN-013 and the inherited date duties; no new Base duty was invented. |
| 6 | PASS mechanical; source judgments preserved | Contract generator write and check pass; generated views restored from main. Status counts and evidence cells are the lander's responsibility. |
| 7 | PASS INSPECTED | No acceptance text, ruling, coverage map or status edits. |
| 8 | PASS for the assigned report authority boundary | JSON and CSV refusals, current branch scoping and credential revocation change nothing. Existing invoice correction authority is unchanged. |
| 9 | PASS boundary | Tax on approved invoices and QuickBooks inspection only. Payment-collected tax, live ledger posting and Xero remain held. |
| 10 | NOT APPLICABLE | No new custody, spending, consent or authority policy default. |
| 11 | PENDING guarded landing | Main does not equal the candidate; publication scan and Run site are not cloud-side claims. |

## PRE-READY self-check

1. The assigned monthly user outcomes run through populated public-door journeys and fail on wrong dates or missing rows. The browser's missing-row failure was directly observed before the repair. Exact-head Verify is recorded below; no green result is borrowed from another SHA.
2. Existing assertions are preserved. Existing desktop and phone margin proof and ordinary revenue correction proof remain invoked.
3. Revoked report credentials and branch boundaries are directly exercised. This change adds no stored person, capture, restore, erasure or replay path; existing erasure and capture obligations remain with their owning clauses and are not claimed newly qualified here.
4. The changed report table uses existing 13px-or-larger typography and full existing table styling; the changed panel has no icon-only action. Its existing download action has visible text. No configuration control was added. Phone dates have explicit labels through the existing responsive table mechanism. Unrelated existing payroll configuration remains outside this change.
5. Source integrity and generated views pass. Cloud publication scan: commit=ed241ebb34b7f0491ea056cdd53a0f40fdce9c58, complete=UNESTABLISHED, historyScanned=UNESTABLISHED, findings=UNESTABLISHED. The cloud brief reserves scanning and main landing to the fleet; this is not a COMPLETE or zero-finding claim. Candidate main equality is false by design. Run site is main-only and awaits landing. No email-shaped or credential-shaped string was added to product fixtures or files.

Test-budget note: no test-budget.json exists on this main. Static registrations and the Playwright list indicate the pre-existing suite already exceeds the default 200 cap (226 before, 227 after counting API registrations, generated loop cases, 48 browser tests and the four Verify scripts). This round adds the expressly requested one focused high-stakes monthly journey and extends one existing browser registration. No unrelated valid assertion was removed to disguise that inherited cap issue; no cap increase was made. The count issue is reported for fleet bookkeeping under the brief's proportionality rules.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses REPORT-004 then check --clauses REPORT-004 exit=0; ledger=none exit=0
PROBE REPORT-004 2: native Owner series.create, three Worker scheduled triggers and Office approvals → 12 monthly drafts, 9 approved monthly invoices plus ordinary and per-visit invoices; combined revenue 1400.00, approved-invoice tax 140.00, six explicit late-approval rows, three unchanged early-approval refusals, and preserved dates after correction and restart.

CLAIM REPORT-004 PARTIAL points=2 tests=tests/api/fixed-monthly-reports.test.mjs#REPORT-004 fixed-monthly reports freeze three local period ends across approval, correction, export and Worker restart; tests/browser/revenue.spec.ts#REPORT-002, REPORT-004 the owner filters job margins and downloads the matching CSV at 1440 and 390
GAP REPORT-004: Acceptance 1 remains held by QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018 and PAY-002, PAY-017, PAY-018, PAY-019, PAY-020. Live ledger and Xero, recurring charging, receipts and dunning, and all other quoted account, ct and Base holds remain unchanged. The assigned monthly reporting point is qualified; no whole-clause DONE claim is made.

Exact-head local results: the focused API and existing reports file pass 3 tests; typecheck, first-party checks, source-lock freshness and generated-view check all exit 0. The official fresh-install browser command passes its existing revenue registration (including the new monthly helper) and captures the changed revenue and tax rows at 1440 and 390. The initial official invocation missed the Chromium selector and failed before executing a journey; the rerun used the required system Chromium and passed without a source edit. All owned runtimes and browser processes exited.

Exact-head CI: Verify push run 42518845292, head ed241ebb34b7f0491ea056cdd53a0f40fdce9c58, still in progress at 2026-11-08T20:17:10Z. REST calls used: 2 of 10; discovery and the first status observation were more than 300 seconds apart. Run site and the full-history publication scan remain guarded-landerer duties.
