# sx-glove-c-f136 — travel-aware automatic assignment

Candidate: `203197587a05b9f7ef8ea3d054bcef2848bea092` on `cloud/sx-glove-c-f136` in `just-every/run-glove`.
Parent main at the final fetch: `f5d2b44b4e731aaee612cdde0fcb6cc24b2181b5`. Main was unchanged at candidate rebase.
No PR is required: branch pushes start Verify. Run `42495298542`, event `push`, is in progress on the exact candidate. The last observed main Verify `42493578218` and Run site `42493578258` succeeded on `f5d2b44b4e731aaee612cdde0fcb6cc24b2181b5`.

Plan and results

1. Read the supplied plan extract, rulings index, Glove rulings and DONE-RIDERS, launcher rules, seed instructions, full DISP-010 acceptance and Status Gap, existing assignment code, API, move-in and acceptance documentation, Maps network fake and Worker harness. Existing combined eligibility proof had one ranking expression and a relative drive comparison; points 1 to 3 had no separately qualifying journey.
2. Preserve existing behavior and tests; use the existing Maps network-edge route-duration override and actual Worker restart support. Add one focused file containing three public-command sanity journeys. No fixture or harness repair was needed, and no production defect was exposed. The existing eligibility test is byte-for-byte unchanged.
3. Qualify all native outcomes: geocoded sites, Owner connection, saved technicians, accepted-quote job, service-call job and automatic assessment. Enumerate independent fixed route durations; qualify earlier, later, exact-boundary, cancelled and absent previous visits, exact total tie, retained reasons, replay and restart. Exercise disconnected fallback and all three provider refusals through both automatic doors, with unchanged state and Activity; explicit dispatcher choices still succeed.
4. Prove the clause boundary with a real consented live-phone location that differs from every job site. Verify complete route bodies contain only the expected stop coordinates and protocol fields; compare all existing visits and proposals before and after assignment.
5. Run only touched journeys, typecheck and required mechanical checks. Fetch main and rebase before the first push. Generate contract documents and check them, restore generated views, add the new test to the index, regenerate the source lock last, and check it. Commit with fleet identity and preserved hooks; inspect every candidate identity and trailer, then push with the fleet guard. Repeat touched journeys through the pinned rer runtime on the exact committed head. Publish this packet separately from the product tree.

Only product changes: `tests/api/travel-assignment.test.mjs` and generated `sources.lock.json`. No acceptance text, Status, Gap, Evidence, generated view, workflow, runtime pin, UI, homepage or release changes. No existing assertion was removed or narrowed. Three registrations added; none removed. Test-cap finding: main already had 203 explicit API and browser registrations, before loop expansion and script checks; the candidate has 206 against the stated cap of 200. No redundant test could safely be removed from the assigned files, and the brief explicitly preserves the existing eligibility file. This is reported to the fleet as suite bookkeeping under gate tiers F and G; no unrelated test was deleted or assertion weakened to change the count. No local full suite run. No browser proof is applicable because no screen changed.

Frozen rubric and acceptance proof

Every runtime row below passed locally on `203197587a05b9f7ef8ea3d054bcef2848bea092`. All are included automatically in the existing push Verify API glob. Exact-SHA CI conclusion remains pending and will be recorded in the receipt before transfer.

| Row | Acceptance sentence or named outcome | Public-door proof and lines in tests/api/travel-assignment.test.mjs |
| --- | --- | --- |
| R1 | Point 1: travel time joins automatic ranking | Point 1 journey, lines 128 to 149; fixed expected ranking at line 6, visit result at lines 104 to 108. Bea wins with 75 booked and 5 drive, beating Zoe's 60 booked and 20 drive by name despite more booked work. |
| R2 | Point 2: with Maps connected, each candidate adds previous same-day drive to booked minutes | Point 1 journey, Owner maps.connect at line 14, public site.save at lines 16 to 20 and technician.save at line 33; route durations independent at lines 36 to 42; exact ranking at lines 106 to 108. |
| R3 | Point 2: latest visit ending by new start; no previous means no drive | Point 1 journey, fixture lines 45 to 55: Ada has 120 future booked minutes and zero drive; Bea ends exactly at 10:00; Cy's latest eligible visit is 09:00 to 09:30, ignoring an earlier visit, a later cancelled one and a future one. Prior-day Ada visit at line 131 is ignored. Complete origin coordinates asserted at lines 113 to 118. |
| R4 | Point 2: fewest total then name, ranking names every candidate's booked and drive minutes | Point 1 journey, line 6 and lines 106 to 108. Exact ordered result: Bea 75+5=80; Zoe 60+20=80; Cy 90+5=95; Ada 120+0=120. |
| R5 | Point 2: unplaceable job site refuses so dispatcher chooses | Point 2 journey, lines 172 to 191, both visit.book and assessment.book return MAP_LOCATION without changes, then the explicit technician books. |
| R6 | Point 2: unplaceable previous-visit site refuses so dispatcher chooses | Point 2 journey, same independent scenario loop, lines 172 to 191; MAP_LOCATION and complete unchanged state and Activity. |
| R7 | Point 2: route not found refuses so dispatcher chooses | Point 2 journey, lines 172 to 191; edge returns ROUTE_NOT_FOUND using null duration; both automatic doors return ROUTING and change nothing; explicit choice makes no Maps call. |
| R8 | Named door coverage: quoted work, service-call visit and assessment | Point 1 journey lines 83 to 108 and 133 to 135; real approval and person-recorded quote acceptance, native serviceCall identity, native enquiry and automatic assessment. |
| R9 | Named retention and DATA-002 duty: exact reason retained on visit, Activity and business export | Point 1 journey via retained helper lines 61 to 80, invoked at line 119 and after restart at line 139. Actor, role, time, command and visit identities retained. Activity lowercases the automatic ranking and retains every candidate's exact minutes; business export retains the full assignment reason and corresponding timeline summary. |
| R10 | Named restart and replay stability | Point 1 journey lines 121 to 124 and 138 to 149: replay has no new state or provider call; actual Worker is disposed and recreated with D1 retained, followed by all saved replays and a fresh identical assessment decision. |
| R11 | Named disconnected fallback: booked minutes only, no Routes call | Point 2 journey lines 151 to 167: visit selects Bea at 30 versus 60 booked, assessment then selects Ada at 60 versus 90; exact reasons and zero Maps calls. |
| R12 | Point 3: live positions remain with DISP-005 and DISP-012 | Point 3 journey lines 197 to 208, a real phone consent, shift, timer and accepted live point; complete assignment route origins at lines 113 to 118 are previous visit sites, never the live point. |
| R13 | Point 3: optimization remains with DISP-003 and DISP-011 | Point 3 journey line 205 uses public visit.book; lines 109 to 112 compare all previous visits, general proposals and route-optimization proposals, lines 209 and 210 assert no general or route-optimization proposal exists. No route-optimization action is invoked or inferred. |

DONE-RIDERS

| Row | Result and evidence |
| --- | --- |
| 1 | Local PASS: all acceptance outcomes covered by R1 to R13 and the three named journeys; exact-SHA Verify pending. |
| 2 | PASS: nonempty independent schedules and exact expected outcomes; provider refusal cases compare complete state and Activity. No money action is added. |
| 3 | Pending: push Verify run 42495298542 on the candidate includes the new file through the existing API glob and shard discovery. No env flag or nightly restriction. |
| 4 | PASS: touched tests run again on the exact committed candidate through rer's selected runtime. Output is travel-tests.log and receipt.json. |
| 5 | INSPECTED: no new Base inheritance; own point 3 already names the four owning location and optimization clauses. Named Activity and export duty proved in R9. |
| 6 | PASS for builder mechanics: contract generator write and check exit 0, zero generated documents changed. Status, Gap and Evidence remain main's judgments for the lander to update from the claim. |
| 7 | PASS: no acceptance or contract edit and no obligation rewrite. |
| 8 | INSPECTED, no new authority: commands use real Owner and Dispatcher sessions; existing handlers and authority rules unchanged. No correction, refund or broadened grant introduced. |
| 9 | PASS: fake-provider behavior only; no live Maps account acceptance, legal result, live tracking or route optimization claimed. |
| 10 | PASS: no policy default adopted and no ruling required. |
| 11 | Pending guarded lander: candidate remains branch-only; main equality, candidate publication scan and post-landing Run site are not claimed. |

Pre-ready check

1. PASS locally: each named behavior has public-door assertions checking independently expected visible results; CI pending.
2. PASS: diff adds a new focused file only; existing assertions remain intact.
3. INSPECTED: production authority, erasure and capture replay code is unchanged. Booking replay is explicitly tested and cannot duplicate visits or events. No new data retention, exposure or outbound authority.
4. Not applicable: no touched screen or control.
5. Source lock is fresh. Exact-SHA Verify pending. Candidate scan, main equality and candidate Run site are fleet duties; these receipts do not establish them.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write then check exit=0; ledger=none exit=0.
PROBE DISP-010 1: visit.book auto on quoted and service-call jobs plus assessment.book auto -> Bea; ranking Bea 75 booked + 5 drive, Zoe 60 booked + 20 drive, Cy 90 booked + 5 drive, Ada 120 booked + 0 drive; exact retained results survive Worker restart and command replay.
PROBE DISP-010 2: disconnected automatic doors -> booked-only rankings and zero Maps calls; unplaceable destination, unplaceable previous site and ROUTE_NOT_FOUND -> MAP_LOCATION or ROUTING, unchanged domain state and Activity; explicit Dispatcher choice -> booked.
PROBE DISP-010 3: accepted live phone point distinct from site coordinates then visit.book auto -> only previous visit site coordinates sent; other visits unchanged and no route proposal.

Counts and custody

Current contract counts: 17 DONE, 217 PARTIAL, 29 MISSING, 263 total, unchanged before and after. Proposed clause change after gates: DISP-010 PARTIAL to DONE, closing points 1, 2 and 3; proposed counts 18 DONE, 216 PARTIAL, 29 MISSING. No plan file was available or written; only the DISP-010 campaign row is proposed complete. All other campaign rows and holds remain unchanged. The receiving lane owns the judgment update.

Publication scan receipt on `203197587a05b9f7ef8ea3d054bcef2848bea092`: complete=false; historyScanned=unestablished; findings=unestablished. Cloud does not run the publication scanner; no COMPLETE or zero-finding result is claimed. Full-history clone was used. The fleet lander must scan this exact candidate before publication and landing.

No product blocker identified. Live Google account acceptance, held Base and Lanyard duties, public-booking travel-feasibility, other dispatch and payment clauses, and all existing release holds are unchanged. No release or default-branch publication performed. The complete report and actual receipts stay under the task packet and are transferred only via the report evidence branch.

Claim and remaining landing gates

CLAIM DISP-010 DONE points=1,2,3 tests=tests/api/travel-assignment.test.mjs#DISP-010 point 1: travel ranking and its retained reason cover quoted work, service calls and assessments across restart and replay; tests/api/travel-assignment.test.mjs#DISP-010 point 2: disconnected ranking uses booked minutes and unavailable travel refuses atomically while explicit choice books; tests/api/travel-assignment.test.mjs#DISP-010 point 3: assignment routes from visit sites despite a live phone position and never optimizes the schedule

This is a native-behavior claim for guarded landing. DONE-RIDERS row 11 remains the lander's duty; row 3 is pending exact-SHA Verify at this report revision. No live-provider or release claim is made.

Final proof refinement: the second published commit adds explicit checks of the actual route-optimization collection, retaining all general-proposal checks. Both commits have fleet author and committer identity and no trailers. The first candidate was superseded before its conclusion was observed; no earlier-SHA CI result is used. Main was fetched again and merged before the final commit; it was unchanged.
