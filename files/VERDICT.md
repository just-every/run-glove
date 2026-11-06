# COST-001 exact-source independent verdict

COST-001: **ACCEPT ON LANDING**. All seven original acceptance outcomes are MET by fresh focused execution. No NEW exposure, data loss, plausible regression or ordinary correctness finding was found. This is a substantive product judgment, not a full-clause award, accepted source, READY product candidate, release, or landing consent.

## Identity, scope and custody

- Task: ct-judge-glove-cost001-20261105-1725-sol1, replacing the original commission ct-judge-glove-cost001-20261105-1725 under the supplied 2026-11-06T01:26Z routing authority.
- Reviewer: Codex, commissioned model gpt-6.1-sol, reasoning effort xhigh. This records the session’s supplied routing configuration; no model API, paid API credits, usage credits, subagent, second session or successor was used.
- Repository: just-every/run-glove. Original source branch: cloud/sx-glove-c-f62. Exact source: 2519b34f7d87c7401bf2ce23808096cf6b5bb2c6. Fresh shallow filtered clone HEAD matched exactly. No named replacement cloud product branch was created because the assignment expressly makes the product repository read-only.
- Product source, contract, docs, test registrations and source lock: no intentional edits, commits, pushes or PRs. The only publication is the separate report-only evidence ref. Git hooks and fleet identity remain active. There were no GitHub API calls and no CI poll, rerun or dispatch.
- The inline brief says no earlier CT request or judgment covered this source. The affected reviewer and original builder history are context, not a previous independent CT verdict. This is the one authorized replacement judgment.
- The request supplies original gate sx-glove-c-f62-gate-1, genuinely ended 2026-11-05T17:12:48Z, exit 0, GATE PASS for exactly COST-001 at this source, with a fresh matching public branch. This review does not inspect private gate material or replay mutations.
- supported accepted(source)=[] remains unchanged. Original source and exact-chain review custody must be established and read back through the same supported MAIN mechanism, preserving the f57 stack. SAME FV/main owns the original handoff lifecycle recovery. The original builder’s BLOCKED/PUSHED/headnone terminal and f62-land’s 17:14:03 BLOCKED/HELD on f57 are not rewritten by this verdict.

## Product target, only from the pinned contract

Category: Field service management for home and commercial service trades.

First buyer: The owner or dispatcher of a US plumbing, HVAC, electrical or other service-trade business with 2 to 25 technicians, moving from another field-service system; USD, US sales tax, card and ACH, one or more US time zones, QuickBooks Online books, the owner's own Cloudflare account.

Incumbents: Jobber, Housecall Pro, ServiceTitan. The pinned contract also names FieldPulse and Workiz as up-and-comers. The Australian fixture business does not change that target.

## Clause table

| Clause | Original scope and inherited duties | Named journey and public doors | Outcomes and result | Recorded Verify |
| --- | --- | --- | --- | --- |
| COST-001 | Full Requirement and AP1–7; BASE-AUDIT-001 correction record duty; GLOVE-06 outbox identity and phone-time inheritance; REPORT-001 on-the-clock tile dependency; original DONE-RIDERS1–11 | `tests/api/time.test.mjs` — a linked technician clocks a first shift, reads only their own timesheet, and the desk retains ordered corrections after restart. `tests/browser/journey.spec.ts` — COST-001 / COST-002, COST-006, COST-007 a technician clocks their first shift before any visit is assigned at 1440 and 390. `tests/api/payroll.test.mjs` retains payroll and commission behavior. Doors: native sessions and POST /api/glove/commands; GET /api/glove/state, /api/glove/dashboard, /api/glove/timesheets, job timeline, Activity and business export; technician phone visits/outbox and desk Today, Reports and Jobs. | AP1–7 MET, 8 API tests passed with 0 skips, 1 focused browser journey passed, types passed. Permitted corrections and populated unsafe-refused operations both executed. | Supplied push Verify 42064877694 attempt 2: completed FAILURE; browser job 127391380451, API and portable SUCCESS; foundation 127391383507 failed solely stale generated ACCEPTANCE.md, with consequent aggregate failure. Apply only the explicit candidate-view exception. This is not an actually full-green Verify or final integration proof. |

Full original Requirement and acceptance text are retained in PINNED-CLAUSE-EXTRACTS.md. No acceptance sentence, source pin, hold or lifecycle changed. CONTRACT-STANDARD.md remains absent; no structural rewrite was attempted.

## Frozen outcome rubric

The original affected report’s seven AP rows are the authorized original checklist. No prior stable R-IDs were supplied, so these retain AP1–7 rather than inventing a new rubric. Each sentence below is verbatim from the pinned COST-001 acceptance. Inherited duties and the requested riders are scored separately below; they do not expand acceptance.

### AP1 — MET

A fixture clocks in, starts travel and job timers on two visits with one offline stretch, clocks out, and checks the time on each job; a desk correction keeps the original; the `REPORT-001` on-the-clock tile lists exactly the technicians clocked in at each step.

Verification: API and browser perform two visits, completion, an offline stretch, clock-out, job reads and reasoned correction. The browser checks first job Travel 10 min and On the job 21 min; second job Travel 11 min and On the job 3 min, then Travel 15 min after correction. API onClock checks exact full membership throughout both technicians’ transitions. Browser checks each phone transition and the desk’s zero-technician tile after replay. The original is retained.

### AP2 — MET

A technician clocks in and out on the phone and, only while clocked in, runs one timer at a time, travel or on the job, on a visit currently assigned to them; starting a timer stops the running one at the same phone time, and clocking out or completing the visit stops it too.

Verification: Browser uses real Clock in, Clock out, Start travel, Start job timer, Stop timer and Save completion controls. API executes NOT_CLOCKED_IN, CLOCKED_IN, never-assigned FORBIDDEN, completed or reassigned NOT_ASSIGNED, NO_TIMER and repeated clock-out NOT_CLOCKED_IN refusals, comparing the whole populated domain before and after. Independently fixed phone instants prove replacement, completion and clock-out stops and one running timer.

### AP3 — MET

Every start and stop carries the phone's clock time and goes through the phone's outbox with the identity it was given, so it works without signal and a resend lands once (`GLOVE-06`).

Verification: Browser disables transport and navigator connectivity, queues five timer and clock-out commands, checks the exact phone instants and actor, five distinct command identities, unchanged server state and optimistic phone state. After reconnect it drops the first real committed timer-start reply, checks the five items remain queued, resends the identical command twice and drains to one persisted entry. Start and stop receipt times remain distinct from phone times. API replays every clock, timer and completion command and checks unchanged state and restart.

### AP4 — MET

An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of its entries per kind.

Verification: API checks literal 10, 21, 11, 1 and 2 minute boundaries using 29-second and 30-second rounding cases, plus retained timesheet totals. Browser job reads check literal 10/21 and 11/3 travel/job totals and 15/3 after correction. The expected totals do not call the production rounding helper.

### AP5 — MET

The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local dates and times in the business timezone, with a reason; the entry keeps the phone's original times and every correction (who, when, reason, from and to), and the job's timeline records it.

Verification: API performs three ordered stopped-entry corrections as Owner, Dispatcher and Office in America/Chicago, including a local date crossing midnight, with independently specified UTC from/to instants, actor identities, historical roles, fixed correction times, reasons, original phone instants and full history. It opens populated job timeline, Activity and business export, then replaces the Worker and checks all records survive. Blank reason, backward end, running entry, stale version, unauthorized roles and unsigned transport are refused without changing populated state; demoted authors cannot replay old privileged corrections. Browser saves a reasoned local-time correction and displays its original and changed totals.

### AP6 — MET

Technicians read only their own entries.

Verification: API populates both technicians’ entries on a shared job and assignment history, then reads each technician’s state, Activity and shared-job timeline: each sees own entries and own time events; neither sees the other’s. Technician export and dashboard are actually refused, and a shared assignment name never widens timesheet authority. This is executed privacy proof, not an empty-list or reading-only claim.

### AP7 — MET

The `REPORT-001` on-the-clock tile lists the technicians with a shift clocked in and not out, with the timer each is running.

Verification: API checks the whole dashboard onClock object with literal technician identities, since instants and kind/job timer objects after each transition: zero, one and two members; travel, job, stopped timer, completion and separate clock-outs. Reads are shown not to mutate state. Browser drives the corresponding phone transitions, checks exact dashboard responses and displays the desk tile. The rendering in src/ui/today.tsx maps the returned membership and timer without recomputing it; the full REPORT-001 clause is not awarded.

## Inherited original duties

| Duty | Score and limit |
| --- | --- |
| BASE-AUDIT-001 | MET for this clause’s native delta. COST-001 explicitly cites the Base duty. The executed three-role correction journey checks ordered who, when, reason, from and to, originals, record versions, job timeline, Activity, full business export and actual Worker restart. Current-role revocation and erased-history replay are exercised, including absence of erased reasons after restart and export. This does not separately award all of Base or DATA-002’s general audit functionality. |
| GLOVE-06 outbox inheritance | MET for COST-001 start and stop identity, phone clock, retained queued items and exactly-once resend. Browser routing forwards the real request to the production Glove and native-auth doors on actual Miniflare/D1; only connectivity and response delivery are interrupted. There is no fake domain implementation. Other GLOVE-06 photo and field-capture obligations remain that clause’s own scope and status. |
| REPORT-001 tile dependency | MET for the on-the-clock membership and current timer required by COST-001, including two populated technicians and exact transitions. Full REPORT-001 remains partial at this pin; the dashboard’s other figures and later-tile obligations are not awarded by this review. |
| Retained payroll behavior | Executed once from `tests/api/payroll.test.mjs`: the 44-hour week, approved unchanged W-2 exports, exclusion of the subcontractor, daily overtime reapproval, dated commission rules and all three payroll file formats passed. The time journey also retains unassigned first-shift, own-timesheet, replay and approved hours behavior. These are regression evidence, not additional clause promotions. |

## Original DONE-RIDERS1–11

| Row | Score | Evidence or pending condition |
| --- | --- | --- |
| 1 | MET for affected outcomes, candidate-view exception only | Both native sanity journeys cover all original AP1–7. Fresh executions pass at the exact source. The recorded push Verify loads them; its known view-only failure is explicitly excepted for this candidate. Final merged runtime Verify remains mandatory. |
| 2 | MET | Populated data, literal independent expected phone instants and minutes, supported corrections, unsafe-refused operations, and whole-state unchanged assertions. No dangerous path rests only on inspection. |
| 3 | MET under the supplied candidate-view exception; full-final green PENDING | `.github/workflows/verify.yml` runs on push, pull_request and dispatch. `verification.json` places the complete API and browser commands in push shards; the focused journeys have no opt-in gate. Recorded push run 42064877694 attempt 2 has successful browser, API and portable shards but overall FAILURE from the stale generated view. No new CI claim or poll is made. |
| 4 | MET | HEAD and all selected source and journey bytes match 2519b34f7d87c7401bf2ce23808096cf6b5bb2c6; fresh command receipts carry that exact SHA. Setup regenerated three blank lines in `src/routeTree.gen.ts`; the saved diff contains only whitespace. It changed no executable token. That artifact was restored from HEAD; source-lock check then passed and final tracked worktree was clean. Browser’s fresh installation came from the same tracked source. No second journey execution was needed for a whitespace-only generated artifact restoration. |
| 5 | MET | The receiving COST-001 meta line explicitly cites BASE-AUDIT-001. AP3 explicitly retains GLOVE-06 and AP1/AP7 name REPORT-001. |
| 6 | Substantive scope MET; mechanical notes F and G | Candidate source COST-001 has done, named exact journeys and empty Gap. Pinned ACCEPTANCE.md remains partial with obsolete generic Gap and counts, and the contract Judged-from line remains an earlier source. The local generator check reports only ACCEPTANCE.md differs. Do not commit generated views. CT/lander must reconcile newer main Status AND Gap/Evidence/provenance/assertions and regenerate merged views; this bookkeeping is not a standalone FIX or substantive refusal. |
| 7 | INSPECTED, MET | The original COST-001 Requirement and all seven AP sentences exactly match the supplied excerpt. No acceptance, ruling, coverage, original assertion registration, structural rewrite or legacy prose was edited. No mutation was applied. |
| 8 | MET, executed | Owner, dispatcher and office correction success; running, stale, absent reason, reverse interval, unauthenticated, technician, agent, viewer, subcontractor and weaker custom-role refusals. Demoted authors cannot correct or replay old privileged edits. Populated state is unchanged on refusals. |
| 9 | MET within native boundary | Local production Worker/D1, browser and edge transport proof only. No live payroll upload, provider settlement, native-device, store, legal or remote-account acceptance is asserted. Such field proof remains UNMET-EXTERNAL where applicable and does not block COST-001. |
| 10 | MET | No policy or authority default was introduced or adopted. Existing owner, CT, Base, runtime-pin, provider and release boundaries remain. No unprovided ruling was inferred. |
| 11 | PENDING; prevents award, not ACCEPT ON LANDING | No landing, main equality, exact final-main runtime Verify, green Run site or COMPLETE full-history publication scan NEW 0 is claimed. The original holds and MAIN exact-chain custody remain prerequisites. CT retains these guards. |

All substantive original rows pass. There is no STAYS PARTIAL outcome gap and no NEW finding. INSPECTED is used only for document comparison or the direct UI mapping after the executed API proof, never as a substitute for money, security or data-loss execution.

## Actual commands and exits

All focused runs used pinned Node 22.20.0 and pnpm 10.12.4 after sourcing the provided cloud toolchain. Headless Playwright used /usr/bin/chromium and --no-sandbox. Long commands ran through cloud_run and the child subreaper. The native harness stopped its owned servers, closed browsers, disposed Workers and removed temporary installations. Setup and browser setup built the real app; no separate full-suite or provider operation was needed.

Dependency installation: pnpm install --frozen-lockfile, exit 0. Full sanitized output is dependency-install.log. It added no product commit or dependency change.

| Command | Exit | Seconds | Receipt |
| --- | ---: | ---: | --- |
| npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive | 0 | 42.565 | setup.log |
| node --test --test-concurrency=1 tests/api/time.test.mjs tests/api/payroll.test.mjs | 0 | 17.815 | api.log |
| pnpm typecheck | 0 | 18.121 | types.log |
| node scripts/contract-docs.mjs check | 1 | 0.288 | contract-check.log |
| node scripts/edition-authoring/cli.mjs check | 1 | 0.415 | source-lock-check.log |
| node tests/browser/run.mjs --grep 'a technician clocks their first shift before any visit is assigned' | 0 | 102.329 | browser.log |
| node scripts/edition-authoring/cli.mjs changes | 0 | 0.299 | source-lock-changes.log |
| node scripts/edition-authoring/cli.mjs check | 0 | 0.25 | source-lock-restored-check.log |

The first source-lock check failed because native setup had removed only three blank lines from the generated route artifact. The changes command identified exactly that file and before/after hashes. GENERATED-ROUTE-DIFF.patch records the complete diff. Restoring that artifact to the pinned source made the source-lock check exit 0. The contract-docs check still exits 1 solely for ACCEPTANCE.md; it is not repaired in this read-only review.

COMMANDS.jsonl records actual UTC start/end, command, cwd, exit, duration and source. SOURCE-RECEIPT.json records the clean worktree, full source identity, 263 parsed status IDs, counts and selected input hashes matched against Git objects. RUNTIME-RECEIPT.json records executable versions and each of the 20 actual screenshot files, dimensions and SHA-256. No environment dump or credential is a selected evidence file. Two corrected-job screenshots were visually inspected for displayed totals, reason and preserved original at 1440 and 390; this is functional evidence, not a visual-quality judgment.

NOT RUN:

- Full API, browser, foundation, portable or baseline suite: outside the focused review request. The two relied-on API files and one focused browser journey were each run once, with zero API skips.
- Historical mutation runs or new per-point tests: expressly forbidden or not requested. No permanent test addition, test deletion, assertion registration, mutation, rerun or new scope was introduced.
- GitHub CI discovery, polling, logs, retry, rerun or dispatch: expressly prohibited in the reviewer assignment and the shared one-retry budget is spent. Zero of the ten-call GitHub budget was used. The exact-source CI event, IDs and conclusions above are supplied inline evidence, not newly queried facts.
- Final merged full-runtime Verify, complete full-history publication scan, guarded main fast-forward/equality and exact-main Run site: CT/main-only integration and landing duties. No fake full-green result, scan NEW 0, accepted pin, landing receipt or product READY is emitted.
- Private held-out gate material, Mac receipts or work paths, lane INBOX and STATE files: not read. The pasted gate/reviewer history is attributed as supplied; unavailable chain receipts are unestablished, never assumed.
- Real devices, Apple/Google signing or stores, owner-account providers and payroll import acceptance: outside this native clause judgment and not claimed. The contract’s 22 field-register rows remain not run. Live-account items are UNMET-EXTERNAL where applicable, not new blocking rubric rows.
- Contract write, lock regeneration, source status flip, PR, product push, provider operation, hold/release/readmit/submit/adopt: not authorized for this read-only judgment and not performed.

## Status, Gap, counts and exact flip recommendation

| View or custody | Before | Candidate or recommended after | Actual effect of this review |
| --- | --- | --- | --- |
| Full target counts | 7 DONE, 227 PARTIAL, 29 MISSING, 263 IDs in pinned stale ACCEPTANCE.md | 8 DONE, 226 PARTIAL, 29 MISSING, 263 IDs in pinned CONTRACT.md | No product or fleet count changed. The one conditional COST-001 promotion is +1 DONE, −1 PARTIAL, 0 MISSING, 0 IDs, not a new delta to add to the already-promoted candidate. |
| Core | 7 DONE, 214 PARTIAL, 16 MISSING, 237 IDs in stale view | 8 DONE, 213 PARTIAL, 16 MISSING, 237 IDs for this candidate | Conditional only; no extra Core clause awarded. |
| Agent surface | 0 DONE, 13 PARTIAL, 13 MISSING, 26 IDs | Same | No change. |
| COST-001 | Prior accepted view partial, obsolete AP1–7 proof Gap | ACCEPT ON LANDING judgment. Candidate source already says done, empty Gap and names the two exact journeys. | No source edit needed in this pin. On the merged main candidate, CT may retain or apply the COST-001 partial → done flip and clear its proof Gap only after custody and integration guards, without erasing a newer judgment. |
| GLOVE-06 and REPORT-001 | partial | partial | Their inherited delta is checked here; their whole clauses are not promoted. |
| accepted(source) | [] supplied | [] until supported custody and admission | No acceptance, submit, adoption or lifecycle transition performed. |

Exact permitted flip content, if CT/main still needs the flip on its final merged source: change only COST-001 Status from partial to done, set its substantive Gap to empty, and retain Evidence naming the exact time API and focused browser journey with their coverage. Recalculate summary counts from the complete merged CONTRACT.md, never by summing parallel candidate deltas. Update final provenance only to the actual final source. The pinned source already contains this status/evidence/Gap; do not flip it twice. The obsolete generated Gap is preserved verbatim in PINNED-CLAUSE-EXTRACTS.md for the mechanical reconciliation.

If later independent integration uncovers an unmet original outcome, CT must name that exact outcome and original rider and retain the relevant Gap; this review invents none. No F or G bookkeeping creates a FIX. C remains the next planned touch. Lifetime FIX increment from this judgment is 0; the existing lifetime total is preserved unchanged (its numeric value was not supplied, so no replacement total is fabricated).

## Pending integration and custody guards

1. CT establishes this replacement judgment and original exact-source/exact-chain custody by the same supported MAIN readback mechanism, preserving f57 and all existing holds. SAME FV/main recovers the original handoff lifecycle. This evidence publication alone cannot supply admission or release.
2. Reconcile against fresh main, preserving every newer Status AND Gap/Evidence/provenance and newer assertion, all original 263 IDs and all holds. Resolve CONTRACT.md source judgments first; keep unrelated legacy prose intact.
3. Run merged contract generator write/check with touched COST-001 arguments as documented, let the Mac lander write ACCEPTANCE.md and docs/CLAIMS.md, and regenerate source lock LAST; run its check. No generated view belongs in this judge’s product branch.
4. ACTUALLY EXECUTE full-green runtime Verify on the exact final merged SHA with the relied-on journeys loaded. Candidate-view exception, historical affected PASS and this judgment do not qualify the final source.
5. COMPLETE full-history publication scan NEW 0, guarded landing/mainEquality and exact-main Run site must be proven by the final lander receipt. Never infer them from READY or from concurrent candidate counts.

These are pending original prerequisites, not newly invented acceptance or product failures. This judgment has no substantive blocker; no full-clause award is authorized until all applicable guards and custody are proven.

## Preservation and return

The full plan is PLAN.md. Complete actual non-secret reports, logs, command receipts, source receipt, runtime receipt and all 20 screenshots are selected explicitly for evidence-only transport to refs/heads/evidence/ct-judge-glove-cost001-20261105-1725-sol1 in just-every/run-glove. The report-only publisher leaves product checkout HEAD and index unchanged and uses fleet authorship. Publication and exact-head/hash readback are separate from product readiness. The disposable source clone and dependencies are removed after the evidence transfer is verified; the packet remains outside that clone.

The terminal CT POST carries this source, AP1–7 MET, the unchanged candidate counts, the recorded CI IDs and pending integration/custody guards. The final standalone READY closes only the read-only judgment task. It is not the product-builder READY branch=head signal.

Recorded UTC: 2026-11-06T02:16:31.272775+00:00
