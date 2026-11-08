# DISP-014 results — sx-glove-c-f132

Candidate: `6ca5adc9a328bd6cad7f614b1ce5eaa5bcaec822` on `cloud/sx-glove-c-f132` in just-every/run-glove. Product push succeeded on attempt 1. No PR is required by this repository's push Verify entry point. Full history is present. Base main at candidate preparation was `3a6b0e410f4b2744b7c0d293a71c9cae4d3113d2` and is an ancestor of the candidate.

DISP-014 is claimed DONE for acceptance points 1–5, subject to the maintained lander's independent exact-SHA Verify, publication scan and landing gates. Its committed Status, Gap and Evidence remain exactly main's PARTIAL judgment. Actual counts remain 14 DONE, 220 PARTIAL, 29 MISSING, all 263 rows retained. Acceptance of this claim would yield 15 DONE, 219 PARTIAL, 29 MISSING; this builder has not written that count.

The full execution plan and completed steps are in PLAN.md. Only the DISP-014 plan row is proposed to change from PARTIAL to DONE after the round gate accepts it. No full plan was rebuilt. No next unblocked same-file clause is provided by the supplied truncated extract; DISP-007 and DISP-013 are explicitly held outside this round.

## What changed

The continued candidate retains the Owner-only subcontractor guard from sx-glove-c-f128: it runs before technician persistence and checks both explicit payee fields and the existing record, so a delegated technician editor cannot edit or clear a payee by omitting the field. Ordinary delegated employee creation still succeeds. This continuation strengthens the same native journey with refused new payee creation as well as edits, exact unchanged Activity and export after each invalid TIN, stale clear refusal, read-only report state and saved outcomes, and every completion event's real recorder and receipt time in Activity and export. The source lock was regenerated last.

No acceptance text, Status row, Gap cell, Evidence cell, generated contract view, workflow, provider pin, payroll implementation or UI source changed. No existing assertion or test registration was removed, narrowed, skipped or hidden. The touched file still runs seven registered tests; five sequential named diagnostic point groups share the existing registered filing subtest. No new test registration was added.

## Acceptance proof matrix

All rows use `tests/api/subcontract.test.mjs` and the registered subtest **DISP-007, DISP-013, DISP-014 the owner's agreed amounts on completed visits make the subcontractor's 1099-NEC total for the year**, which executes the point groups inside `assertSubcontract1099`. The production Worker is bundled and served by Miniflare with actual migrated persistent D1 and native invited-person sessions. Fakes are limited to existing provider edges. The exact committed candidate's local run passes 7 of 7 registered tests, 0 failures, 0 skips. Every money and authority row below was executed, not merely inspected.

| Row | Acceptance sentence or inherited duty | Native door and asserted result | Source | Local result | Exact-SHA Verify |
| --- | --- | --- | --- | --- | --- |
| P1 | Owner marks a technician with payee name and last four digits; full TIN refused and never stored | `technician.save`: Owner mark, edit, clear and restore succeed; Office, Dispatcher, technician, subcontractor, Agent and delegated editor refusals; omitted-field bypass refused; eight malformed or full-TIN values refused for creation and edits with unchanged state, Activity, export and no saved outcome; retained record, command and event scans and CSV exclude full TINs | lines 194–249 | PASS | push 42485154609 in progress |
| P2 | Owner sets an agreed amount on each subcontract visit | `visit.agree`: 42.00 set, 84.01 change, null clear; stale set and stale clear, ordinary employee, all excluded-role set and clear attempts preserve exact records | lines 252–278 | PASS | push 42485154609 in progress |
| P3 | Owner and Office read JSON and CSV totals by local completion receipt year, count and 600-dollar flag | `visit.complete` with `/__test/clock` at 2027-01-01 04:59:59Z and 05:00:00Z in New York; independent 2026 expectations are Sid 2 visits 599.99 false, Lee 1 visit 600.00 true, Tom 2 visits 750.25 true; 2027 Sid 1 visit 600.01 true, Lee 2 visits 599.99 false; original device year differs; all JSON fields and parsed CSV columns agree for Owner and Office; uncompleted, cancelled, reassigned and explicitly cleared amounts excluded; excluded readers refused; reports identical after actual Worker disposal and restart and once-only command replay | lines 163–184 and 281–316 | PASS | push 42485154609 in progress |
| P4 | Filing disclaimer present; Glove files nothing | Every JSON label and every CSV row has the exact honest label; reads make zero additional provider requests and change neither state nor saved command outcomes | lines 163–184 and 319–325 | PASS | push 42485154609 in progress |
| P5 | Timesheets and payroll remain with COST-002, COST-006 and COST-007 | Existing public time and payroll routes show one real approved employee row, refuse subcontractor approval unchanged, explain exclusion of a subcontractor with actual recorded time, omit all subcontractor identities from Gusto, ADP RUN and QuickBooks CSVs, return identical Office exports and remain identical after Worker restart | lines 349–381 | PASS for named boundary; broader owning clauses unchanged | push 42485154609 in progress |
| D1 | DATA-002 attribution and business export | Every tracked Owner payee or agreed-amount command has one attributable event; every subcontractor or technician completion event has the exact actor id, name, role and receipt time and one matching export entry, including after replay | lines 326–346 | PASS | push 42485154609 in progress |
| D2 | Current authority and replay safety for touched commands | Delegated employee edit replay is refused after role withdrawal without state changes; old payee replay cannot restore old payee values; agreed amount and completion replay add no Activity or money | lines 243–249 and 308–316 | PASS | push 42485154609 in progress |

PROBE DISP-014 1: Owner `technician.save` with full TIN and malformed last-four values, both creation and edit -> INPUT; state, saved outcomes, Activity and export unchanged; valid mark, edit and clear succeed.
PROBE DISP-014 2: Owner `visit.agree` set 42.00, change 84.01, clear null -> saved exact amounts; stale clear -> STALE; excluded roles -> FORBIDDEN; non-subcontractor -> NOT_SUBCONTRACTOR, no record effects.
PROBE DISP-014 3: Native completions received on either side of New York year-end midnight -> exact independent 2026 and 2027 payees, counts, cents and threshold flags in Owner and Office JSON and parsed CSV, unchanged across restart and replay.
PROBE DISP-014 4: JSON and CSV report reads -> honest filing label, no provider attempts, unchanged state and saved outcomes, attributable source Activity and export.
PROBE DISP-014 5: `timesheet.approve` for recorded subcontractor time -> SUBCONTRACTOR; all three existing payroll files contain the real approved employee and omit subcontractors with the documented JSON exclusion reason; restart identical.

## DONE-RIDERS

| Rider | Result on candidate | Evidence and practical boundary |
| --- | --- | --- |
| 1 | Local PASS; CI pending | All five acceptance outcomes reached in the named native journey; matrix above. Verify push 42485154609 has loaded the candidate but is still running. |
| 2 | PASS | Real populated records, independent monetary expectations, allowed and refused money and security commands, unchanged state on refusals; lines 194–316 and 349–381. |
| 3 | PENDING Verify | Existing push command glob in verification.json includes the touched API file; exact candidate Verify 42485154609, event push, in progress, no conclusion yet. Earlier candidate 00422c5b8a350dae637ca2aa94517af85d330bf8 had green Verify 42482706876; that is historical context, not green evidence for this candidate. |
| 4 | PASS | API journey rerun after commit on 6ca5adc9a328bd6cad7f614b1ce5eaa5bcaec822. Browser result predates final rebase, but a zero diff against its source tree 2b7cf60cfa22edc695ece82daf86d9e1dccb8af7 confirms every relevant product screen, API, subcontractor module and harness byte unchanged. Browser source hash mapping is in receipt.json. |
| 5 | PASS, INSPECTED | DISP-014 names its payroll-owning clauses in point 5 and retains its DISP-007 origin; no additional Base duty or inheritance is claimed. DATA-002 source attribution is performed through the same native journey. |
| 6 | PASS mechanical; judgment deferred | Contract write and check both exit 0; generated views restored from main and not committed; all status cells unchanged. Lander alone writes the accepted judgment and counts. |
| 7 | PASS, INSPECTED | No acceptance point, rider, id or coverage rewrite; zero CONTRACT.md diff against main. |
| 8 | PASS | Owner payee changes and agreed amount changes succeed; excluded-role changes, delegated omission bypass, stale money commands and non-subcontractor amount attempts refuse unchanged; lines 194–278. |
| 9 | PASS | Only totals for the owner's filing; no filing, payment, TIN verification, legal certification or provider payroll acceptance claimed. Payroll provider clauses retain their existing gaps. |
| 10 | PASS, INSPECTED | No new policy default adopted; existing Owner-only requirement enforced. No ct scope request needed. |
| 11 | PENDING guarded landing | Product branch pushed; main does not equal candidate. Candidate Verify running, complete publication scan and candidate Run site not yet available. These are the maintained lander's gates, not asserted as complete by the builder. |

## PRE-READY self-check

1. PASS local behavior: the named journey has real positive and refusal cases for the money and security outcomes and passes on the committed candidate. Candidate CI remains honestly pending.
2. PASS: no assertion removed or weakened, no existing test skipped or moved behind a width or branch condition. The permanent API journey contains its original positive and negative proof.
3. PASS for applicable touched authority and replay paths: current role withdrawal blocks command replay, old saved payee and completion results cannot mutate current records, refused full TINs leave no retained state. No erasure feature, erased-customer recovery, new capture authority or retention path is introduced; broader erasure clauses remain unchanged rather than claimed here.
4. Browser screens shown at 1440 and 390; existing configuration stays in Settings. No UI source changed. Existing icon-only Close visit lacks a tooltip; this pre-existing polish defect is a follow-up under gate proportionality, not acceptance loss. The first outside-repository browser attempt caught it; all attempt receipts are retained. Native Chromium downloads bypass fixture interception, as the existing revenue browser journey documents, so the final proof reads the exact CSV control resource in the page. All expected CSV columns and values remain asserted; no permanent test was modified to bypass a failure.
5. Source lock fresh, identity and trailer review clean, full history present, candidate pushed. Candidate Verify and scan are pending, with no false green or COMPLETE claim; candidate Run site follows landing. The cloud exception leaves those gates to the maintained lander.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses DISP-014 and check --clauses DISP-014 exit=0; ledger=none exit=0.

## CI, custody and limits

- Candidate Verify: run 42485154609, event push, head `6ca5adc9a328bd6cad7f614b1ce5eaa5bcaec822`, status in_progress, conclusion null at discovery. No dispatch, rerun or PR was created. One watcher; four total GitHub REST calls used. No early follow-up poll.
- Prepared base `3a6b0e410f4b2744b7c0d293a71c9cae4d3113d2`: Verify 42484401120 success and Run site 42484401135 success. These establish the base's health only.
- Product remote branch equals `6ca5adc9a328bd6cad7f614b1ce5eaa5bcaec822` by ls-remote. Main is `3a6b0e410f4b2744b7c0d293a71c9cae4d3113d2`, so mainEquality=false and no landing is claimed.
- Publication scan text: commit=6ca5adc9a328bd6cad7f614b1ce5eaa5bcaec822; complete=NOT_RUN; historyScanned=NOT_RUN; findings=NOT_RUN. The maintained lander must obtain COMPLETE with zero findings from full history before landing. Cloud publication scanning was neither run nor waived for landing.
- Runtime reports Node 24.19.0 locally under the required toolchain shim; the repository pin remains 22.20.0 and its existing CI uses that pin. No runtime or Base repin made.
- No real blocker remains in this scope. Candidate is branch-only until its independent gates complete. This report is not acceptance, landing, production publication or provider verification.
- Full report, plan, actual local receipts, test logs, browser proof and screenshots are returned only through the report evidence ref. No fleet evidence is committed to the product tree.

CLAIM DISP-014 DONE points=1,2,3,4,5 tests=tests/api/subcontract.test.mjs#DISP-007, DISP-013, DISP-014 the owner's agreed amounts on completed visits make the subcontractor's 1099-NEC total for the year
