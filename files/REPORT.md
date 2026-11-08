# DISP-003 qualification plan and results

Task: sx-glove-c-f164. Repository: just-every/run-glove.
Branch: cloud/sx-glove-c-f164.
Initial main: cb4787ac9734f9fb534fe2896cc054e3637953af.

## Plan

1. Read the supplied plan extract, rulings, DONE riders, launcher instructions,
   repository instructions, contract and existing routing proof.
2. Qualify the native proposal flow through commands, HTTP reads and the actual
   Worker scheduled handler. Independently total consecutive provider legs,
   inspect all saved slots, and exercise command replay and actual restart.
3. Exercise live role and branch authority before claim and before result save,
   queue serialization, timeout, lease expiry, visit and technician endpoints,
   whole-schedule eligibility, fixed crew placements and field evidence.
4. Extend the existing board journey to compare every displayed figure with
   saved proposal values and retain the existing desktop and phone proof.
5. Repair production only for an exposed defect. Preserve the existing routing
   and travel-assignment journeys and all excluded production files.
6. Run touched API journeys and typecheck, contract generation and its check,
   restore generated views, regenerate the source lock last, and check it.
7. Commit with fleet identity and hooks, inspect every candidate identity and
   trailer, push only the named cloud branch, inspect exact-SHA Verify, and
   publish this actual non-secret packet to the separate evidence branch.

## Scope and initial proof map

The contract has eight native acceptance points. Existing combined routing
journeys cover a substantial happy path, apply and discard, stale eligibility,
provider refusal and erasure. This round adds focused outcomes for authority at
claim and save, numeric endpoints, coordinate-only network shape, actual abort,
fixed evidence and crew slots, independently computed totals and retained
proposal state across restart. No live Google account acceptance is claimed.
DISP-011 remains owned by its existing proof; no policy or acceptance changes
are planned. Contract Status, Gap and Evidence cells remain unchanged.

The repository has no test-budget.json. Registration counts and the existing
suite-size discrepancy are reported below.

## Candidate and repair

Candidate: **85f8648ffc8b09754bc939fc080580194f233c4e**.
Save: 4f164c1889e4f6ee892078c2cbf1d2a08f565fa2, pushed with CI skipped.
Final candidate: 85f8648ffc8b09754bc939fc080580194f233c4e, pushed normally.
No PR is required: the existing Verify workflow accepts branch pushes.

The public command and scheduled-handler probe exposed a production defect:
the saved evaluation count reached **1,216**, despite a maximum of 1,200.
The inner loop stopped evaluating, but subsequent outer iterations still
incremented the counter. A repeatable twenty-visit directed provider scenario
reproduced the failure before the repair; see cap-before.log. The repair tests
the budget before incrementing and exits both exchange loops. The same
scenario now records **1,200**. No optimization, authority or validation rule
was relaxed. The production change is confined to src/glove/routing.ts.

The Maps fixture adds an optional response delay at the existing provider edge.
The twenty-visit scenario prepares its repeatable order with ordinary desk
commands. No routing, eligibility or optimization implementation is faked.
All installations use their production HTTP command doors and real persistent
D1, with the actual Worker scheduled handler and actual Worker restart.

The board journey additionally verifies all three displayed figures against
saved beforeSeconds, afterSeconds and savedSeconds, the excluded depot leg,
and absence of an optimum guarantee. The inspected desktop and phone proposal
screens show 75.4 minutes before, 9.2 proposed and 66.2 saved in this run.
The existing journey also checks all twelve original and proposed placements,
discard, provider refusal, explicit reasoned acceptance and retained assignment
history after restart. Screenshots contain synthetic fixture data only.

No contract clause, Status, Gap or Evidence cell changed. No generated view is
committed. The source lock is generated and checked. The protected-files.diff
receipt is empty, including the three explicitly excluded production files.
The existing routing and travel-assignment tests were preserved byte for byte.
No existing assertion was removed, narrowed, skipped or put behind a condition.

## Frozen outcome rubric

Every row below uses candidate 85f8648ffc8b09754bc939fc080580194f233c4e.
The local API run is sx-glove-c-f164-local-1 (ten tests passed); the browser
run is sx-glove-c-f164-local-browser (one journey passed). Push Verify is
42530051626; its observed conclusion is recorded in the CI receipt below.
The new API file is tests/api/route-optimization.test.mjs. The browser file is
tests/browser/routing.spec.ts. Line references below identify the candidate.

| Row | Acceptance sentence and observed outcome | Door, proof and lines | Local result |
| --- | --- | --- | --- |
| R1 / point 1 | Twelve visits and three technicians yield lower independently summed driving, retain every window and skill, and remain unchanged until a dispatcher accepts. | API journey “DISP-003 points 1, 6 and 8: a twelve-visit proposal saves only consecutive driving and survives replay and Worker restart without moving visits”, lines 51–83; independent feasibility helper lines 28–48. route.optimize, actual cron, state and route.accept. | PASS |
| R2 / point 2 | Owner and Dispatcher request a whole day and one technician; Office, Technician, Agent, custom role, token, signed-out and wrong-branch requests refuse. Two days advance one per cron pass. Role and branch withdrawal before claim and before save fail visibly. A running lease survives 59,999 ms and fails at 60,000 ms, with no moves. | API journey “DISP-003 point 2: live person authority fences day and technician requests, one cron claim, revocation and expired leases”, lines 86–156. Real command transport, network-boundary withdrawal, actual scheduled handler and state. | PASS |
| R3 / point 3 | Two and twenty visits, including eight assigned technicians, prepare; one and twenty-one visits and nine technicians refuse ROUTE_LIMIT with no queued proposal or moved visit. | API journey “DISP-003 point 3: visit and assigned-technician limits accept their endpoints and refuse excess without queuing or moving work”, lines 180–196. route.optimize and actual cron. | PASS |
| R4 / point 4 | Every Routes body contains only registered waypoint coordinates, DRIVE and TRAFFIC_UNAWARE. The delayed response fails before its eleven-second answer, leaving visits unchanged. The deterministic capped search records 1,200 evaluations and finishes within twenty seconds. | API journey “DISP-003 point 4: coordinate-only Routes requests abort a delayed provider and retain a bounded exchange count”, lines 198–241. Real command and cron, network-edge body inspection, real ten-second abort; exact-head outside-Verify runtime receipt sx-glove-c-f164-local-1. | PASS |
| R5 / point 5 | Every proposed duration, window, skill, area, working span, time off, overlap and adjacent drive is independently checked. Crew members, arrival, capture and late-evidence slots are fixed. Invalid skill, leave, area and hours changes cause visible failure, with visits unchanged. | API journey “DISP-003 point 5: whole proposed schedules preserve eligibility, duration and fixed crew and field-evidence placements”, lines 243–274; helper lines 28–48. Real booking, crew, arrival, capture, handover, technician-edit, route and state doors. | PASS |
| R6 / point 6 | Every saved original and proposed technician, UTC timestamp, local timestamp and window is retained. Original and proposed totals and savings are checked. Queued and ready records survive actual restart; repeated cron and replay move nothing and create no duplicate proposal. | API journey at lines 51–83, same name as R1; original records at line 63, independent local and UTC correspondence at lines 34–38, totals at lines 68–71, replay and restart at lines 57–79. | PASS |
| R7 / point 7 | The dispatcher's board displays every proposal move and the saved driving comparison; desktop and phone screenshots show the changed screen. | Existing browser journey “DISP-003, DISP-011 the dispatcher discards, sees a provider refusal, then compares driving saved and explicitly accepts the route, at 1440 and 390”, lines 21–170, especially 70–88. Added numerical assertions execute at 1440. Existing width proof remains at both widths. | PASS |
| R8 / point 8 | Both driving totals equal the sum of exactly nine consecutive visit legs, with no depot. Saved method disclaims a global optimum, and the board makes no optimum guarantee. | API journey R1, lines 66–73; browser journey R7, lines 70–74. No production optimization helper calculates the expected total. | PASS |

The routing provider fake is explicitly permitted by the clause. No live
Google Maps Platform account, activation, delivery or external compliance is
claimed. Existing Base, Lanyard and resolved-address egress holds are unchanged.
DISP-011's apply, discard, stale acceptance, erasure and restore remain in that
clause; this run preserves and executes its existing API proof, including
customer erasure and retained decided work, without editing that proof.

## DONE riders

| Rider | Result | Exact-candidate evidence |
| --- | --- | --- |
| 1 | PASS locally; Verify custody recorded below | R1–R8 each reach and inspect the named public outcome. API and browser receipts bind to the candidate SHA. |
| 2 | PASS | Nonempty twelve-visit and twenty-visit installations, independently summed provider legs, successful authorized requests and refused unsafe requests with unchanged visits. R1–R6. The cap-before.log counterexample demonstrates a meaningful failing assertion. |
| 3 | CI custody recorded below | verification.json runs the API glob and browser runner on push. scripts/verify-app.mjs discovers the new file and retains the routing browser journey. Exact-SHA Verify 42530051626 is the recorded push event. No proof is hidden behind a new flag or nightly-only command. |
| 4 | PASS | checks-receipt.json and browser-receipt.json name the full candidate SHA. Both run after the final code and test commit. No relevant bytes changed afterward. |
| 5 | INSPECTED, no new inheritance | DISP-003 retains its existing native points and operating-rule reference. No Base duty or receiving-clause rewrite is introduced. DISP-011 retains its own existing Base citations. |
| 6 | PASS mechanical; judgment remains lander-owned | Contract generator write and check both exit 0. Source counts and provenance remain exactly main's. Generated files are restored and excluded from commits; stale Status judgments are intentionally untouched for the lander. |
| 7 | PASS, INSPECTED | No acceptance point, ruling, coverage mapping or Status row changed. protected-files.diff is empty. |
| 8 | PASS | Owner and Dispatcher positive cases; role, token, custom-role and branch refusals; live authority withdrawn before claim and before result save. R2. Existing reasoned acceptance and erasure proof also passes unchanged. |
| 9 | PASS | Only the allowed Google provider fake is claimed. Live provider activation and other clauses' external and Base boundaries remain held and are not presented as verified. |
| 10 | INAPPLICABLE | No new custody, consent, spending or authority policy default was adopted. No ruling or ASK is required for the existing owner and dispatcher boundary. |
| 11 | PENDING GUARDED LANDING | This cloud pushes no main or default branch. Main equality, complete full-history publication scan with zero findings and candidate Run site remain the fleet lander's gates. Nothing here counts the clause as landed. |

## Pre-READY self-check

1. R1–R8 exercise user-visible outcomes. Exact-head local checks pass; exact-SHA
   Verify status is recorded below. The bounded counter fails on the original
   implementation and passes on the repair.
2. No existing assertion was removed, narrowed, skipped or conditionally moved.
3. Authority withdrawal and command replay are explicitly exercised. The unchanged
   routing journey's personal-erasure assertions run on this exact candidate.
   This change adds no capture, restore, personal-data or outbound authority.
4. No production screen is edited. The inspected proposal panel uses text-labelled
   controls, has no icon-only control, and its existing text and balanced borders
   remain readable at 1440 and 390. Configuration placement is unchanged.
5. The exact-head source lock, generator and first-party checks pass. Publication
   scan and candidate Run site are NOT RUN in this cloud and remain guarded
   landing conditions. Added fixture and source text contains no email-shaped
   value; no provider-shaped key is introduced. The only synthetic Maps key
   added uses the required synthetic-glove naming.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses DISP-003 and check --clauses DISP-003 exit=0; ledger=none exit=0.

PROBE DISP-003 1: route.optimize for twelve visits and actual cron -> lower independent driving total, feasible proposal and unchanged visits until explicit dispatcher acceptance.
PROBE DISP-003 2: person and token command transport, two queued days and live authority withdrawal -> authorized jobs prepare, unsafe requests refuse, one claim per pass, revoked and expired work visibly fails without moves.
PROBE DISP-003 3: route.optimize at visit and technician endpoints -> two and twenty visits with eight technicians accepted; one and twenty-one visits and nine technicians refused with ROUTE_LIMIT.
PROBE DISP-003 4: real Routes transport at the Maps edge -> coordinate-only DRIVE and TRAFFIC_UNAWARE; ten-second abort of an eleven-second answer; exactly 1,200 saved evaluations in the capped scenario.
PROBE DISP-003 5: real crew, arrival, capture, late handover and eligibility commands -> fixed evidence placements retained, valid complete schedules, and failed invalid schedules without moves.
PROBE DISP-003 6: route.optimize, repeated actual cron, command replay and actual Worker restart -> retained original and proposed local and UTC slots and driving figures, one proposal, no automatic moves.
PROBE DISP-003 7: real dispatcher board -> all twelve saved moves and all saved comparison figures displayed; browser proof at 1440 and 390.
PROBE DISP-003 8: saved proposal and board -> totals contain only nine consecutive legs, depot excluded, no global optimum guarantee.

## Counts and plan return

Source counts before and after: **21 DONE, 213 PARTIAL, 29 MISSING; 263 total**.
All parent Status rows remain. DISP-003's source status remains PARTIAL.
The claim is DISP-003 PARTIAL, with native points 1–8 qualified. Full Verify
remains red on an unreproduced signed-quote failure, so no DONE status change is
requested until CI triage resolves that standing bar. No other clause status or
plan row is changed. The DISP-003 plan return is native qualification complete,
blocked on CI triage; counts remain 21 DONE, 213 PARTIAL, 29 MISSING.

Literal API registrations: 187 before, 192 after. Browser registrations: 45 before
and after. Five focused public-door API journeys were added; no browser journey
was added. The repository has no test-budget.json and already exceeds the
stated 200-test seed cap before this round. The brief explicitly requests this
new focused file while preserving the existing routing and travel journeys;
no unrelated proof was deleted and no budget file or cap was changed. This
existing suite-size discrepancy is reported for lane bookkeeping.

The blocker is the red exact-SHA Verify described below. No routing product
defect remains known after the bounded-counter repair. No policy default or
contract semantic change was needed. No release, provider activation, main push
or PR was performed.


## Exact-SHA CI failure and required stop

Verify **42530051626**, event **push**, head
**85f8648ffc8b09754bc939fc080580194f233c4e**, completed **failure**.
The build, foundation, portable, API-2 and all four browser shards passed.
API-2 includes the new focused routing file, and the existing routing browser
journey is selected by the unchanged browser runner. The failed assertion is
in API-1 job **128882211270**, in an unchanged signed-quote journey:

`tests/api/customer-quotes.test.mjs:138` — QUOTE-002, QUOTE-008, QUOTE-009,
QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 / COMM-001, COMM-010, COMM-011,
COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner
accepts concrete disclosure, the customer chooses the middle option and one
add-on, requests a revision and signs its immutable exact copy.

Observed CI error: **Body is unusable: Body has already been read**.
Stack: verifyCopies at tests/api/customer-quotes.test.mjs:418, called at line
432. The exact failed-job archive was read once through the required gh command
and is retained as failed-api-1.log. No redirected job-log blob was fetched.

Before any attempted CI repair, the exact failed command was replayed on the
candidate with Node 22.20.0, the same shard and its CI flags:

`node scripts/verify-ci.mjs api-1`

Result: **exit 0; 123 tests passed; 0 failed**. The previously failing case is
`ok 15`. The complete replay log and verify-reproduction-receipt.json bind this
result to the exact candidate. The prebuilt application was rebuilt at that
candidate first. This replay ran in this dedicated cloud VM, rather than the
original GitHub runner; no claim about identical runner hardware is made.

The same failing journey was then run on observed main
**cb4787ac9734f9fb534fe2896cc054e3637953af**, using the same VM and Node pin:

`node --test --test-name-pattern='the owner accepts concrete disclosure' tests/api/customer-quotes.test.mjs`

Result: **exit 0; 1 test passed; 0 failed**. Both signed-copy read doors retained
exact manifests and bytes across two Worker restarts and later edits. The
failing journey's bytes are identical between candidate and main; see
unchanged-failing-journey.json and main-reproduction-receipt.json.

The brief's Verify-repair instruction says: “If it does not reproduce, stop
BLOCKED with that output; do not guess a fix.” That rule applies here. No source
or test change was made to repair the unexplained CI failure. No known permitted
infrastructure flake class was established, no failed-job rerun was requested,
and no assertion was weakened. GitHub calls used: **7 of 10**.

Final rider result: riders **1 and 3 remain held by the red full Verify bar**,
with all eight target outcomes locally qualified and their targeted API and
browser CI shards successful. Riders 2 and 4 pass; 5 is inspected with no new
inheritance; 6 and 7 pass mechanically with judgments untouched; 8 and 9 pass;
10 is inapplicable; 11 awaits the fleet's guarded landing. No READY line is
claimed for this known red workflow.

VERIFY_NOT_REPRODUCED {"head":"85f8648ffc8b09754bc939fc080580194f233c4e","job":128882211270,"command":"node scripts/verify-ci.mjs api-1","test":"tests/api/customer-quotes.test.mjs:138","exit":0,"observed_ci_failure":"Body is unusable: Body has already been read","local_tests":123,"local_failed":0,"main_test_exit":0}

GAP DISP-003: Native points 1–8 are qualified; exact-SHA Verify 42530051626 is red on an unchanged signed-quote journey, and neither its exact shard nor the same journey on main reproduces the error. CI triage is required by the brief before READY.

CLAIM DISP-003 PARTIAL points=1,2,3,4,5,6,7,8 tests=tests/api/route-optimization.test.mjs#DISP-003 points 1, 6 and 8: a twelve-visit proposal saves only consecutive driving and survives replay and Worker restart without moving visits; tests/api/route-optimization.test.mjs#DISP-003 point 2: live person authority fences day and technician requests, one cron claim, revocation and expired leases; tests/api/route-optimization.test.mjs#DISP-003 point 3: visit and assigned-technician limits accept their endpoints and refuse excess without queuing or moving work; tests/api/route-optimization.test.mjs#DISP-003 point 4: coordinate-only Routes requests abort a delayed provider and retain a bounded exchange count; tests/api/route-optimization.test.mjs#DISP-003 point 5: whole proposed schedules preserve eligibility, duration and fixed crew and field-evidence placements; tests/browser/routing.spec.ts#DISP-003, DISP-011 the dispatcher discards, sees a provider refusal, then compares driving saved and explicitly accepts the route, at 1440 and 390

## Preserved custody

The product branch is pushed at the full candidate SHA. A complete-history
recovery bundle was created outside the clone and verified with git bundle
verify:

Path: /home/agent/rer-consolidation/work/sx-glove-c-f164/product.bundle

SHA-256: db2f5f07451346dae033eef2ccdc9bcb6b4046bfbe2ea64ff78ec15f7e8b6c8a

The actual reports and receipts remain under the packet directory. The bundle
is recovery data, is not published as evidence, and establishes no READY or
landing claim. The clone and its dependency tree are removed only after report
transfer succeeds.
