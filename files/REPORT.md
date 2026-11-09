# sx-glove-c-f194 — DISP-007 continuation

Product branch: cloud/sx-glove-c-f194
Candidate: c82d23129d551a386e0e1af409e1bc5715987115
Base main: e9cc0be2f683ff559fc89be0de67de750238dc7a
Prior qualifying candidate: e152db60e194d10da1075020b6813eef7139f55b
PR: none required; Verify has a branch-push entry point.

The continuation's two focused registrations already qualify all seven native acceptance points. This run read and retained them, rebased the eleven product commits onto current main, and reran the focused proofs. No new source repair or test registration was necessary. The product delta from main remains the two focused journeys, the demonstrated crew month-filter repair in src/ui/dispatch.tsx, and the generated source lock. The filter uses crew identities when crew rows are selected and clears an incompatible filter when Rows changes.

The source judgments remain 33 DONE, 201 PARTIAL and 29 MISSING, total 263, before and after. DISP-007 remains PARTIAL in CONTRACT.md until the fleet applies its judgment from this claim. Qualification would yield 34 DONE, 200 PARTIAL and 29 MISSING after acceptance. No Status, Gap, Evidence, acceptance text, homepage, workflow or runtime pin was changed. The plan's DISP-007 ready row should advance to this candidate and this run's receipts. Other campaign rows and every stated account, provider and Base hold remain unchanged.

## Plan and completed results

The complete initial plan is in plan.txt. Its local execution steps are complete, with evidence transfer and CI completion tracked separately: inspect the existing qualification against all points and RL-8; retain and integrate it with main; run the focused API and browser journeys plus typecheck and first-party checks; generate and check views, restore main's views, regenerate the lock last and check it; audit all eleven candidate commits and push only the named product branch; return the actual non-secret packet separately through the evidence ref. CI and final transfer metadata are recorded below and in receipt.json.

The initial audit found no remaining unperformed native acceptance outcome in the f192 implementation. Every scenario goes through production Worker routes, native sessions and real migrated D1; the actual Worker restart disposes and recreates the runtime with durable data. The browser uses real built pages and controls backed by those same production Worker routes, not a domain-answer stub. Existing fixture provider edges remain unchanged.

## Frozen acceptance rubric and public-door proof

The API registration is tests/api/crews.test.mjs#DISP-007 crews retain multi-day work, authority, atomic review and evidence through restart (line 8). The browser registration is tests/browser/crew-board.spec.ts#DISP-007 points 1 and 7: crew bookings stay single on every board and drag, keyboard move and cancellation retain the human actor (line 45). Each is one registration with named scenarios from tests/fixtures/scenario.mjs. Their push-Verify membership is captured in verify-registration.json: API shard api-1 and browser shard browser-1.

- R1, acceptance 1, PASS locally: API lines 50–75 book a two-person crew and the signed-in subcontractor on each of three days. Each person's entire state visit list equals their own three visit identities. Two completed agreed amounts, 450.17 and 300.08, total exactly 750.25; the uncompleted 275.01 is excluded. JSON and every parsed CSV header and value are independently asserted, including quoted payee fields. A subcontractor report read is refused. Browser lines 88–165 book the same three-day shape, drag the crew booking on the week board at 1440, and assert every member follows while other install days remain unchanged.
- R2, acceptance 2, PASS locally: API lines 77–99 independently enumerate six non-consecutive bookings, eight actual visits, single technicians, a crew and a subcontractor across October and November, with different dates and times. Actual Worker restart retains the exact expected visits and the complete state.
- R3, acceptance 3, PASS locally: API lines 101–162 accept two and ten distinct active same-branch members, counting a repeated identity once. Office, Dispatcher, Technician, subcontractor, custom role and integration token cannot create or rename a crew. One, one repeated, eleven, inactive, cross-branch, duplicate-name and stale-version attempts refuse; domain state, Activity and export stay unchanged. A later roster and name edit affects later bookings only. The earlier booking preserves its original members and name through move and cancellation.
- R4, acceptance 4, PASS locally: API lines 164–180 force overlaps on two different members and assert both conflict codes and both people in one CONFLICT_REVIEW. Partial acknowledgement writes nothing. Full acknowledgement creates exactly one visit per member with common times. Exact command replay leaves the full state, Activity and export unchanged.
- R5, acceptance 5, PASS locally: API lines 182–210 complete one member and move the other two after one combined review of two conflicts. Partial review writes nothing. Date and both times are independently checked; a move initiated from either open member carries all open members. The completed visit remains byte-for-byte equal. Technician reassignment returns CREW; stale moves write nothing. Canceled member visits remain unchanged and reject movement with VISIT_STATE. No mixed group with an independently canceled member is created by today's public cancellation door, which always cancels the whole group.
- R6, acceptance 6, PASS locally: API lines 212–248 cancel the complete group from a member and assert each actual actor and reason; exact cancellation replay changes nothing. Separate arrival, note and photo captures on one member each cause cancellation from either member to refuse with VISIT_STATE while complete state, captures, Activity and export remain equal. Erasure removes the private visit and photo; its file read returns 404 and replay cannot restore it.
- R7, acceptance 7, PASS locally: browser lines 120–201 replace technician rows with one crew row and assert exactly one chip for each booking in day, week and month; the month filter contains crew identities and switching row types clears stale filters. Drag and keyboard move operate one chip and carry every open member. Screens are captured at 1440 and 390. Browser lines 203–232 and API lines 250–274 inspect actual Activity and business export entries for every crew save, booking, move and cancellation, with actual Owner or Dispatcher identity, role, command, subject, time and summary. No empty-list proof is used.

## Additional brief duties and dangerous paths

- Authority and branch scope, PASS: API point 3 denies excluded roles and integration tokens; wrong-branch roster membership refuses unchanged. Revoking a previously successful token prevents replay of its exact booking command. Withdrawing the Dispatcher's role likewise prevents replay of an actual previously accepted booking command (API lines 142–160 and 268–272).
- Money and filing boundary, PASS: the exact supported completed-visit total and complete CSV are asserted; unfinished work is excluded and the subcontractor cannot read the business-wide filing report. This is a downloadable total for the owner's filing, not a filed return, tax compliance determination or provider settlement claim.
- Erasure and replay, PASS: API lines 233–246 erase a customer with an actual crew photo; the subcontractor's state no longer exposes that job, the capture disappears, file access is 404, and exact capture replay is refused without resurrecting state or text in business export.
- Attribution, PASS: API lines 250–266 page through the full nonempty Activity trail and compare exported events, and browser lines 203–232 inspect the visible human actor in Activity. This satisfies the brief's DATA-002 business trail duty without claiming unrelated inherited features.
- Preserved assertions, PASS: all specifically protected test files and tests/api/harness.mjs equal main; no existing assertion was removed, narrowed, disabled or moved behind a width or branch condition. No DISP-001 candidate test was created or edited. This continuation adds zero registrations; the retained candidate adds the requested two relative to main. Inventory is 190 registrations plus four assertion scripts, 194 of 200.

## DONE-RIDERS, one row per rider

1. PASS locally, exact-SHA Verify pending: R1–R7 above reach every acceptance outcome through public doors. CI membership is recorded and the eventual run conclusion is below.
2. PASS: seeded, nonempty visits and events; hand-computed money; allowed and refused role, conflict, evidence, erasure and replay paths; full-state and export equality on refusal (API lines 36–42, 50–75, 101–246).
3. PENDING exact-SHA CI: both registrations load in push Verify on this candidate, without an execution flag. Screenshot output is configured by the normal browser runner, not a gate on test execution. See verify-registration.json and CI receipts.
4. PASS: both focused journeys ran on c82d23129d551a386e0e1af409e1bc5715987115; the final fetch and rebase were a no-op, and the full tree remained identical after those runs. API also passed under the workflow's Node 22.20.0 runtime.
5. INSPECTED: DISP-007 names its complete crew duties and RL-8 in its owning requirement and acceptance. No new Base inheritance was invented. DATA-002 attribution is exercised as the brief requests; other clauses retain their own duties.
6. PASS mechanically, judgment deferred: generator write reports zero files changed and check passes; main's two generated views were explicitly restored. Contract judgments and all 263 rows are intact and equal main. The lander owns the eventual Evidence and Status changes.
7. PASS: no acceptance sentence or ruling was edited, no rewrite or identifier remap occurred, and no coverage was dropped.
8. PASS: Owner saves succeed; every excluded actor and invalid roster is attempted and refused. The actual dangerous token and role replay paths are refused after authority withdrawal. See API points 3, 4, 6 and 7.
9. PASS: this claim covers native crew work and downloadable 1099 totals only. No provider filing, legal determination, customer notice delivery, live activation or native app proof is claimed. Existing provider and account boundaries remain intact.
10. NOT APPLICABLE: no new policy default. Existing RL-8 governs the crew semantics; the shipped ct index and Glove rulings require no new decision for this work.
11. PENDING guarded landing: the branch is pushed, but main still equals e9cc0be2f683ff559fc89be0de67de750238dc7a. Exact-candidate publication scanning, status judgment, guarded integration and candidate Run site are fleet duties. This is acceptance qualification for landing, not a claim that this cloud changed main.

## PRE-READY self-check

1. PASS locally: the named API and browser journeys perform every crew outcome and check observable state. Exact-candidate Verify is tracked below.
2. PASS: no existing assertion is weakened; all protected files and contract text remain intact.
3. PASS: current role, revoked token, erased photo and repeated capture or command paths are exercised through real doors and cannot restore private data or duplicate bookings.
4. INSPECTED: the changed crew filter reuses existing select controls and typography, with no new configuration surface or icon control. The browser audits tooltips for visible icon-only controls and verifies immediate focus and hover visibility. The 1440 and 390 crew screenshots are included. Existing compact calendar-chip typography and grid styling are unchanged and are not presented as a new polish qualification.
5. Lock and generator PASS. Exact-SHA Verify, main equality, candidate Run site and publication scanning are reported honestly below; the latter three remain guarded fleet duties. No changed source or fixture contains an email-shaped literal. Commit identities and trailers pass for every candidate commit, including side parents. No OpenAI or Codex trailer remains.

## Runtime probes

PROBE DISP-007 1: state and filing report doors -> exactly three own visits each; completed total 750.25 with every CSV column; week-board drag moves every crew member.
PROBE DISP-007 2: six bookings on one job across October and November -> eight exact member visits retained after actual Worker restart.
PROBE DISP-007 3: crew.save -> excluded actors and invalid rosters refuse unchanged; two and ten commit; original snapshot survives roster edit, move and cancellation.
PROBE DISP-007 4: visit.book with two member overlaps -> both conflicts; partial acknowledgement no writes; full acknowledgement exactly two visits; replay unchanged.
PROBE DISP-007 5: visit.change from both open members -> reviewed common date and times; completed member frozen; technician swap, stale and canceled movement refused unchanged.
PROBE DISP-007 6: visit.cancel -> whole group canceled; arrival, note and photo each prevent whole-group cancellation without changing visits, captures or events.
PROBE DISP-007 7: built day, week and month boards -> one crew chip per booking; drag and keyboard move open members as one; Activity and export retain the actual people.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses DISP-007 then check exit=0; ledger=none exit=0.

## Exact-head custody and checks

Local checks: focused API 1 passed on Node 24.19.0; focused API 1 passed on Node 22.20.0; focused browser 1 passed in 34.7 seconds including 1440 and 390 proof; typecheck 0; first-party check 0; contract generation and check 0; source lock regeneration and check 0; inventory 194 of 200. Setup completed successfully through cloud_run; all browsers and owned servers stopped before command completion.

The product push succeeded on its first guarded attempt. remote-head.txt confirms the exact named branch and SHA. Eleven candidate commits, including all parents outside main, passed the allowed independent author and committer identity checks and trailer checks. No product PR is needed or created. No force push or default-branch update was attempted.

Base main Verify 42571868555 (push) and Run site 42571868655 (push) were completed success on e9cc0be2f683ff559fc89be0de67de750238dc7a. These are reported only as base health; they are not proof for the candidate. Candidate Verify 42572989246 (push) runs on c82d23129d551a386e0e1af409e1bc5715987115. Its final status will be appended after the single bounded watcher finishes.

Publication scan: commit=c82d23129d551a386e0e1af409e1bc5715987115; complete=UNESTABLISHED; historyScanned=UNESTABLISHED; findings=UNESTABLISHED. The cloud adaptation explicitly assigns the exact-tree full-history publication scan to the maintained Mac lander. The source f192 report's scan result is not reused for this new SHA.

Main equality: false. Candidate Run site: not yet applicable before guarded landing. Product READY or PUSHED custody is separate from evidence publication. Packet files contain actual reports, test output and synthetic crew screenshots, explicitly selected for the separate report-only ref; they contain no credential file, environment dump or held-out gate material. No finished unpushed work remains.

Blockers: none in local product proof. Guarded fleet scanning and landing remain outstanding, and exact-candidate CI is tracked above.

Proof source identity: proof-source-identity.json records SHA-256 hashes and confirms the focused journeys, existing harness, scenario helper and relevant runtime source exactly equal the pushed commit. Screenshots were captured by the focused run before any later edit; the final rebase and lock regeneration changed no byte.
