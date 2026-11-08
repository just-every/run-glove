# DISP-003 route optimization qualification

Candidate: `ef30c22140edde096a0aee697cf5e53acd238e43` on `cloud/sx-glove-c-f169` in https://github.com/just-every/run-glove.
Product custody: pushed through the fleet guard; no PR required because branch pushes start Verify. Exact-candidate Verify push run: 42534469815. Its latest observed status is in CI.json. Publication scanning, main landing and Run site remain fleet duties.

The source judgments remain unchanged: DISP-003 PARTIAL in CONTRACT.md. The requested landing claim is DONE for native acceptance points 1–8, subject to the exact-candidate Verify and guarded landing. Source counts are 22 DONE, 212 PARTIAL and 29 MISSING before and after this product change; a sole accepted DISP-003 flip would produce 23 DONE, 211 PARTIAL and 29 MISSING. All 263 Status rows are preserved. No acceptance text, Status, Gap or Evidence cell changed. The plan row to update is DISP-003 only; this cloud did not edit the Mac plan.

## Work completed

The predecessor's two unfinished commits from 85f8648ffc8b09754bc939fc080580194f233c4e were replayed onto main 5fc3e002ef52aef13409cc8e93786fd74afb6c6a before this branch was first published. Thereafter only new commits were added. Fresh main was fetched and merged before the final push; it remained the same ancestor. Other writers' work is retained.

The public command and actual Worker cron proof exposed an exchange-count defect: exhausting the inner loop could increment evaluations again in later outer-loop iterations. The repair checks the bound before incrementing and exits both loops. The deterministic twenty-visit provider scenario reaches exactly 1,200 saved evaluations. No route authority, automatic acceptance, provider door or UI behavior was added.

Five focused API sanity flows qualify authority, bounded routing and retained comparisons. The twelve-visit fixture has three technicians, distinct service durations, arrival windows and actual required skills. Independent totals use only the Maps fake's consecutive pairwise travel times. The whole-schedule scenario includes a cheaper ordering with one impossible individual drive; it remains unapplied with zero claimed savings. The existing browser flow additionally checks the saved numeric comparison, depot exclusion and absence of a global-optimum claim. Existing route application and automatic-assignment assertions are unchanged.

## Exact-candidate local results

- `node --test --test-concurrency=1 tests/api/route-optimization.test.mjs tests/api/routing.test.mjs tests/api/travel-assignment.test.mjs`: exit 0; 10 passed, zero failed, skipped or removed. Duration 54.270 seconds. See API.log and RECEIPT.json.
- Twelve-visit independently checked comparison: 4,524 seconds before, 549 after, 3,975 saved; nine consecutive legs before and after, with no depot leg; 132 evaluated exchanges in this run. No visit changed until an explicit dispatcher acceptance.
- Twenty-visit search: 1,200 exchanges saved, 370.631 ms elapsed through the command and cron door. Delayed provider: 12,000 ms configured at the network edge, aborted in 10,029.493 ms; job failed visibly and all visits remained unchanged. The committed flow was run outside Verify at the exact candidate; local timing run id `sx-glove-c-f169-exact-api-1`.
- `pnpm typecheck`: exit 0. `pnpm run check --profile first-party`: exit 0. Setup and production build completed with the provided cloud toolchain. The direct local Node runtime is 24.19.0; GitHub Verify selects the unchanged repository pin 22.20.0.
- Built-browser proof passed at the exact candidate: eight tests passed, zero failed. Result and six routing screenshot hashes are recorded in RECEIPT.json. The maintained browser runner requires the existing installation journey before routing, so both files were selected. Only the route screen screenshots are selected for publication.
- Contract generator write and check: exit 0, zero generated documents changed. Both generated views were restored from main. Source lock regenerated last and its check passed. No migration changed, so migration-ledger execution is inapplicable.

## Frozen acceptance rubric

Every row uses the candidate SHA above. No earlier rubric was provided beyond the eight planner-selected points; these R1–R8 rows freeze those items without adding acceptance obligations. The Verify event is push, run 42534469815; its observed conclusion is recorded in CI.json. PASS below describes the executed local public-door outcome; workflow admission remains dependent on that run.

| Row | Acceptance sentence and outcome | Executed proof and lines | Result |
| --- | --- | --- | --- |
| R1 | Point 1: twelve visits for three technicians improve driving, preserve arrival windows and skills, and move only after acceptance | `tests/api/route-optimization.test.mjs` test “DISP-003 points 1, 6 and 8: a twelve-visit proposal saves only consecutive driving and survives replay and Worker restart without moving visits”, lines 51–89, using independent feasibility checks at lines 27–48 | PASS |
| R2 | Point 2: owner and dispatcher each request a day and one technician; actual cron claims one durable job per pass | Same file, test “DISP-003 point 2: live person authority fences day and technician requests, one cron claim, revocation and expired leases”, lines 92–161. Allowed scopes, excluded people and token, wrong branch, invalid day, disconnected Maps, duplicate request, two queued days, role and branch withdrawal before claim and save, and exact lease expiration are exercised with no movement | PASS |
| R3 | Point 3: accept two and twenty visits and eight assigned technicians; refuse one, twenty-one and nine technicians | Same file, test “DISP-003 point 3: visit and assigned-technician limits accept their endpoints and refuse excess without queuing or moving work”, lines 186–201 | PASS |
| R4 | Point 4: coordinate-only DRIVE and TRAFFIC_UNAWARE matrix, real ten-second abort and bounded exchanges within twenty seconds | Same file, test “DISP-003 point 4: coordinate-only Routes requests abort a delayed provider and retain a bounded exchange count”, lines 204–250. Every captured Routes request, including the delayed request, is checked. API.log contains the actual timing observations | PASS |
| R5 | Point 5: retain duration and windows, validate complete schedules and keep crew and field-evidence placements fixed | Same file, test “DISP-003 point 5: whole proposed schedules preserve eligibility, duration and fixed crew and field-evidence placements”, lines 253–307; distinct durations and independent feasibility also at lines 27–48 and 54–76. Skills, time off, service area and working-hours refusals, overlaps, individual driving time, crew, arrival, capture and late-evidence data are exercised | PASS |
| R6 | Point 6: retain original and proposed technician, local and UTC placements and comparison; background work, repeated cron, command replay and real Worker restart move nothing | First focused test, lines 59–89, plus local and UTC consistency at lines 31–37. Saved proposal is compared whole after restart and replay; explicit acceptance then matches all proposed slots | PASS |
| R7 | Point 7: the dispatcher's board shows all proposed moves and saved driving figures | `tests/browser/routing.spec.ts`, test “DISP-003, DISP-011 the dispatcher discards, sees a provider refusal, then compares driving saved and explicitly accepts the route, at 1440 and 390”, lines 63–88. Numeric and move assertions run at 1440; preserved existing layout assertions and screen captures run at 1440 and 390 | PASS |
| R8 | Point 8: consecutive visits only, no depot legs and no claim to a global optimum | First focused API test, lines 71–79; browser test, lines 70–74. Independent exact totals and nine legs are checked; saved method disclaims global optimality; the screen excludes depot travel and claims no global optimum | PASS |

## Inherited and adjacent duties

| Duty | Proof and disposition |
| --- | --- |
| Current native authority and branch scope | Point 2 flow executes allowed Owner and Dispatcher cases and refused Office, Technician, Agent, custom-role, token and signed-out cases; authority withdrawn before claim or result save visibly fails. No Base client-custody adapter or new service-work authority is claimed. PASS |
| No unintended background data change, replay or stale acceptance | Points 1, 2, 5 and 6 compare actual visits before and after cron, refusals, restart and replay. Existing `tests/api/routing.test.mjs` flows additionally cover current route acceptance, stale eligibility, discard, erasure and provider refusal, all passing. Those obligations remain owned by DISP-011. PASS |
| Automatic travel-assignment regression | All three existing `tests/api/travel-assignment.test.mjs` flows pass unchanged; DISP-010 is preserved. PASS |
| Provider scope | The contract explicitly permits the routing fake. Fakes remain only at the existing Google Maps network edge. No live Google account acceptance, Lanyard read or new outbound authority is claimed. PASS |

## DONE riders

| Rider | Check against exact candidate | Result |
| --- | --- | --- |
| 1 | Every named acceptance outcome is performed and inspected through real command, actual cron or built browser; mapping R1–R8 above. Verify run 42534469815 must admit the same SHA | Local PASS; exact Verify status in CI.json |
| 2 | Populated fixtures and independent expected totals; allowed authority completes, unsafe authority and travel fail with visits unchanged. API lines 27–48, 59–89, 99–161, 275–307 | PASS |
| 3 | Existing Verify API glob loads the new file, and maintained browser partition includes the modified journey; no env flag hides the assertions. Exact Verify push run 42534469815 | Pending its observed conclusion in CI.json |
| 4 | API and browser rerun after the final commit; no later source or test edit. RECEIPT.json binds the commands and screenshots to ef30c22140edde096a0aee697cf5e53acd238e43 | PASS |
| 5 | No new inherited Base obligation or contract text introduced. Native route authority, minimal provider request and retained data obligations already appear in the receiving clause and operating rules | INSPECTED PASS |
| 6 | Generator write and check pass; source lock fresh; all source judgments, counts and parent Status rows retained. The lander owns the final Evidence and Status flip | Mechanical PASS; landing metadata deferred |
| 7 | No acceptance point or rider wording changed; no ID rewrite | PASS |
| 8 | Dangerous authority path exercised both ways, including live withdrawal before claim and save. Point 2 lines 99–161. Existing application authority proof also passes | PASS |
| 9 | Fake-provider boundary explicit; no live Maps, provider compliance, account activation or legal claim | PASS |
| 10 | No policy default adopted and no authority expansion. Existing rulings and holds remain unchanged | Inapplicable, PASS |
| 11 | Main remains 5fc3e002ef52aef13409cc8e93786fd74afb6c6a, an ancestor of the candidate, rather than the candidate. Exact-candidate publication scan and Run site await the guarded fleet landing | PENDING LANDER, acceptance on landing |

## Pre-ready self-check

1. Named user-visible behavior is exercised by R1–R8 on populated data. The exchange-cap scenario reaches the boundary; the unsafe drive scenario has a lower total but cannot fit one individual leg. Verify status is recorded honestly, never borrowed from main.
2. No existing assertion was removed, skipped, narrowed or hidden behind a new width or branch condition. Existing routing, DISP-010 and browser assertions remain intact. This continuation adds no registrations beyond the predecessor's five focused flows. Main already has at least 207 static top-level API and browser registrations before generated cases; no test-budget file exists. No cap raise or unrelated deletion was made; the explicit requirement to preserve the existing related tests was followed.
3. Live authority withdrawal, unchanged replay and no background movement are proven. Existing safe customer erasure assertions run unchanged. This repair adds no new read or resurrection path.
4. No UI source is modified. The displayed route panel uses existing 13 px or larger text, full panel borders and text-labelled controls, with no icon-only route control. The existing shared board controls retain their tooltips. Existing placement and settings are unchanged.
5. Source lock is fresh. Exact Verify is in CI.json. The cloud performs no publication scan or main push. Exact-SHA scan receipt: `commit=ef30c22140edde096a0aee697cf5e53acd238e43 complete=NOT_RUN historyScanned=NOT_RUN findings=NOT_ESTABLISHED`; the maintained lander must supply COMPLETE with zero findings. Run site on the candidate is not available before landing. Changed source and test files contain zero email-shaped strings; no environment dump, credential, provider key or held-out gate material enters this packet.

## Public-door probe results

PROBE DISP-003 1: dispatcher route.optimize on twelve visits and three technicians, cron and explicit acceptance -> 4524 before, 549 after, 3975 seconds saved; windows and skills valid; no move before acceptance.
PROBE DISP-003 2: owner and dispatcher day and technician requests, excluded actors, branch and role withdrawals, two queued days and lease boundary -> supported requests ready, unsafe requests refused or visibly failed; one claim per pass; no visit moved.
PROBE DISP-003 3: visit and technician endpoints through route.optimize -> two and twenty visits and eight technicians accepted; one and twenty-one visits and nine technicians refused with ROUTE_LIMIT.
PROBE DISP-003 4: twenty-visit coordinate matrix and delayed network-edge answer -> DRIVE and TRAFFIC_UNAWARE coordinates only; 1200 evaluations in 370.631 ms; delayed answer aborted after 10029.493 ms, failed job and no move.
PROBE DISP-003 5: crew, arrival, capture, late evidence, changed eligibility and cheaper impossible drive -> fixed slots retained, invalid whole schedules failed, impossible cheaper ordering rejected and original 1900-second comparison retained.
PROBE DISP-003 6: repeated actual cron, command replay and Worker restart -> saved original and proposed slots and figures unchanged, one proposal retained, no background move.
PROBE DISP-003 7: dispatcher built board at 1440 and 390 -> numeric saved comparison and twelve source-linked moves shown; exact browser outcome in RECEIPT.json.
PROBE DISP-003 8: independently sum consecutive fake travel legs and inspect proposal and board -> nine legs, exact totals, no depot leg and no global-optimum claim.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write then check exit=0; ledger=none exit=0.

Boundary summary: live Google Maps Platform acceptance is not claimed; DISP-011 keeps apply, discard, stale acceptance, restore and erasure; DISP-006 and DISP-007 keep arrival-window booking and crew booking qualification; DISP-004 keeps its Lanyard and Base egress holds. All agent surface holds and accepted runtime pins remain unchanged.

No account, policy or other-seed dependency blocks the requested native route qualification. All prior holds remain. Full plan is PLAN.md. Previous unrelated CI failure is recorded in PREDECESSOR-CI.md; no speculative repair was attempted. Product and evidence publication are separate custody operations.
