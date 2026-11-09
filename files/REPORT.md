# sx-glove-c-f183 — DISP-002 qualification

Candidate: `65a9c12400ac9806af73dbf53da64ddcdaeaf1a4` on `cloud/sx-glove-c-f183` in `just-every/run-glove`.
Integrated main: `eb1178dde4b08016c116445860c5f6bb36e56710`. Product publication: pushed, branch only. PR: none required; push starts Verify.
Verify 42557723301, event push, in_progress, conclusion pending. URL: https://github.com/just-every/run-glove/actions/runs/42557723301.

DISP-002: qualified candidate; gate pending, native acceptance points 1–7 covered. No production repair, acceptance rewrite, new policy default or release was needed. The plan row to update after judgment is DISP-002 only. The supplied plan was not rebuilt or edited.

## Plan and resulting changes

The full plan is in `PLAN.md`. The predecessor at `a3936d7c06870e2ad10a9ac113a0cea3013142b8` was replayed onto current main on a new branch. Its original Verify 42544379964 completed successfully; that is historical context and is not used as this candidate's gate. The unfinished qualification was retained, final predecessor refinements were restored and newer main work was preserved. Subsequent integration used a merge after published saves, with no force push.

The focused API journey has five independently named scenarios covering map reads and provider minimization, key custody, placement, zone limits and service-area booking. This continuation adds integration-token storage checks, exact placement-request sequencing, additional excluded zone callers and branch-scoped base-map image proof. The existing browser journey is extended with the fixed business-local day, exact numbered stops and drive labels, both zone editors, an unplaced stop and each assigned phone address. The real archive journey adds restored Maps custody checks.

Only `tests/api/map-board.test.mjs`, `tests/api/harness.mjs`, `tests/browser/dispatch-map.spec.ts`, `tests/portable.mjs` and the generated source lock differ from integrated main. All protected files, routing work, map fixture hooks, the technician screen and other writers' tests are preserved. The only map edge hooks used are places, status, routeAnswer and calls. All fixtures are synthetic. No live Google Maps Platform account acceptance is claimed.

Two local trial assertions were corrected during review: branch-limited Owners may edit their own branch's zones under existing policy, and an empty foreign-branch selection may return a base map fitted to already visible sites. Neither was a production defect. The final tests check the required non-Owner refusal and independently expected scoped map bounds. No existing assertion was removed, narrowed or hidden behind a new width or branch condition.

## Counts and judgment custody

Initial main had 28 DONE, 206 PARTIAL and 29 MISSING. Integrated main has 29 DONE, 205 PARTIAL and 29 MISSING across 263 Status rows, before and after this candidate's own changes. The increase from initial main belongs to another writer's PLAN-013 judgment. DISP-002's stored Status, Gap and Evidence remain exactly main's PARTIAL row; the lander owns the proposed DONE flip.

The inherited inventory discrepancy is retained honestly: initial main counted 215 tests, integrated main counts 216, and this candidate counts 217 against the documented cap of 200. This round adds one focused API registration and extends the existing browser registration and portability script. No cap raise or unrelated test deletion was made. This process discrepancy is reported for consolidation; it is not a missing DISP-002 outcome.

## Acceptance and inherited duty rubric

All API entries refer to the registered journey **DISP-002 map board qualification through desk, Owner and booking doors** and its named scenario. Browser entries refer to the existing registered journey **DISP-002, DISP-010, DISP-015 the map board shows the day's pins and drive times, the owner draws a zone, and the technician's phone hands directions to their navigation app, at 1440 and 390**. Portability entries refer to its actual Maps archive section. Every row is selected by the existing push Verify: the API glob, browser runner or portability script.

| Item | Outcome through the public door | Proof | Local result | Exact-SHA Verify |
| --- | --- | --- | --- | --- |
| 1a | Fixed local day, two technicians and five placed sites; ordered numbered pins, each exact driving time and distance, phone directions. | `tests/api/map-board.test.mjs:14` and `tests/browser/dispatch-map.spec.ts:354`, `tests/browser/dispatch-map.spec.ts:418` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 1b | A zone drawn through the Owner controls gives an outside booking the area warning and changes no visits. | `tests/browser/dispatch-map.spec.ts:375` to `:403` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 2a | Only the signed-in unscoped Owner connects and disconnects; excluded roles, custom role, integration token, signed-out reader and limited Owner are refused without a stored key. | `tests/api/map-board.test.mjs:74` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 2b | Key is absent from state, saved outcomes, Activity, export, captured Worker logs; disconnect and lost current authority cannot be replayed into restored authority. | `tests/api/map-board.test.mjs:74` to `:128` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 2c | A real installation archive excludes the key and credential table. Restored metadata and replay grant no Maps requests before a fresh key is entered. | `tests/portable.mjs:485`, `:497`, `:554` to `:585` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 3a | A new or changed address alone is geocoded, returned coordinates are retained and an unchanged address sends no request. | `tests/api/map-board.test.mjs:130` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 3b | ZERO_RESULTS saves an unplaced site honestly; a provider error changes neither existing nor new sites; desk site.locate places two listed unplaced sites, with unchanged replay after real restart. | `tests/api/map-board.test.mjs:142` to `:169` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 4a | Desk map reads refuse Technician, Subcontractor and signed-out readers; limited desk JSON and base-map bounds exclude the populated remote branch. | `tests/api/map-board.test.mjs:14` to `:72` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 4b | Every Routes request contains coordinates, DRIVE and TRAFFIC_UNAWARE only. Each Static Maps request contains center, zoom, size, scale and map type only, without markers, paths or addresses. | `tests/api/map-board.test.mjs:61` to `:67` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 4c | Glove renders the base map, numbered stops, legs and saved zones; an unplaced stop is listed with Place on the map and is not drawn. | `tests/browser/dispatch-map.spec.ts:354` to `:416` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 5 | Each of the five assigned phone visits links Apple Maps, Google Maps and Waze to its own site address at width 390. | `tests/browser/dispatch-map.spec.ts:418` to `:444` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 6a | Twenty named polygons with 3 and 100 corners are accepted; 21 polygons, 2 and 101 corners, malformed points and non-Owner callers are refused with the technician unchanged. | `tests/api/map-board.test.mjs:172` to `:203` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 6b | Owner draws one zone by clicking corners and one by typing them at width 1440; saved polygons are visible and retained. | `tests/browser/dispatch-map.spec.ts:375` to `:394` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| 7 | Listed ZIP or inside-zone sites book cleanly; outside and unplaced sites warn with review or refuse under the Owner rule. Restart and replay preserve the exact reviewed booking and its Activity and export. | `tests/api/map-board.test.mjs:205` to `:245` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| BASE-AUDIT-001 | Attributable Maps connection, site placement, zone and booking events survive restart and appear in Activity and business export. | `tests/api/map-board.test.mjs:127`, `:169`, `:202`, `:244`; `tests/api/harness.mjs:343`; `tests/portable.mjs:568` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| BASE-DATA-001 | Real archive export and import preserve site coordinates, visits and audit history; old sessions and credential execution authority do not transfer. | `tests/portable.mjs:480` to `:585` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |
| BASE-SECRET-001 | Maps key is installation-only; public and retained projections, captured logs and the actual archive contain none of it. | `tests/api/map-board.test.mjs:74` to `:128`; `tests/portable.mjs:485`, `:497`, `:554` | PASS | Verify 42557723301, event push, in_progress, conclusion pending |

## DONE riders

| Rider | Result and evidence |
| --- | --- |
| 1 | Runtime coverage passes for all seven points in the rubric above; exact-SHA run: Verify 42557723301, event push, in_progress, conclusion pending. |
| 2 | PASS. Five populated sites, two real invited technicians, independent literal drive answers, saved-zone boundary cases, allowed owner operations and refused unsafe operations with unchanged state. |
| 3 | PENDING. The existing push Verify selects all three runners; Verify 42557723301, event push, in_progress, conclusion pending. No screenshot-only environment flag hides the journey from Verify. |
| 4 | PASS. API and mechanical receipts name `65a9c12400ac9806af73dbf53da64ddcdaeaf1a4`. Browser and archive commands began on `f869667dcba97290319428b335d68955ccaa759c`; an empty diff for all application source, map browser source, harness, archive source and provider fixtures proves their relevant bytes are identical on the candidate. The browser receipt records that check. |
| 5 | PASS by inspection. CONTRACT.md:928 already cites BASE-AUDIT-001, BASE-DATA-001 and BASE-SECRET-001; their native outcomes are covered above. |
| 6 | PASS for builder mechanics. Generator write and check succeeded, generated views were restored and the source lock was regenerated last. Main's judgments and provenance are untouched; their final evidence and counts remain lander-owned. |
| 7 | PASS by inspection. No clause acceptance text or coverage mapping was changed; no new acceptance point or policy was invented. |
| 8 | PASS. Owner key connection and disconnection succeed; excluded callers, revoked current authority and replay after withdrawal cannot change the key. Zone writes are similarly refused to non-Owners without changing the technician. |
| 9 | PASS. Only the Maps network edge and real local installation are qualified. Live provider account acceptance, native devices and the other held clauses are not claimed. |
| 10 | NOT APPLICABLE. No new custody, consent, spending or authority policy default. |
| 11 | PENDING GUARDED LANDING. Main does not equal `65a9c12400ac9806af73dbf53da64ddcdaeaf1a4`. Full-history publication scanning and Run site on the resulting main are fleet duties; no scan or landing result is fabricated. An unlanded candidate is accepted on landing when the preceding substantive rows pass. |

## Runtime probes

PROBE DISP-002 1: fixed-day map route and built desk and phone pages -> five ordered numbered pins, exact legs 420 seconds and 1609 meters, 660 seconds and 4828 meters, 960 seconds and 8047 meters; outside-zone booking gets area review.
PROBE DISP-002 2: Maps connection command as current Owner and excluded callers, disconnect then Worker restart and replay, real installation import -> allowed Owner connection only, no projected or archived key, no resurrected Maps authority.
PROBE DISP-002 3: site.save with new, unchanged, changed, ZERO_RESULTS and provider-error addresses, then site.locate for two sites -> exact address sequence, retained coordinates, honest unplaced result, unchanged refusal and idempotent placement replay.
PROBE DISP-002 4: desk and scoped map reads plus Static Maps image -> correct branch bounds and no remote-branch influence; field and signed-out reads refused; minimal view queries and coordinate-only driving requests; unplaced stop listed rather than drawn.
PROBE DISP-002 5: each assigned phone visit at width 390 -> Apple Maps, Google Maps and Waze each carry that visit's exact site address.
PROBE DISP-002 6: technician.zones through Owner command and browser -> 20 named polygons and boundary corner counts accepted; invalid shapes and non-Owners refused unchanged; clicked and typed zones persist visibly.
PROBE DISP-002 7: visit.book inside zone, in listed ZIP, outside both and unplaced under warn then refuse rules -> clean allowed bookings, exact area conflicts, reviewed warning only, no refused booking and unchanged replay after actual restart; Activity and export retain attribution.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write and check exit=0; ledger=none exit=0.

## Pre-ready self-check

1. The named public-door journeys reach every target outcome and observe seeded results, refusals and provider attempts. Exact-SHA CI state is stated above.
2. No prior assertion, role refusal or width coverage was removed or narrowed. Protected files equal integrated main.
3. Key withdrawal and current-authority changes cannot resurrect execution through replay. The real archive excludes credentials, rejects old sessions and retains the trusted later-erasure journal fence; the existing archive journey checks erased visit references stay erased.
4. No production screen or control changed. The map controls used here have text labels; the existing appearance and configuration placement are retained. The four selected screenshots show the clause's board and phone once at each width, with no horizontal overflow.
5. Source lock and local required checks passed. Verify: Verify 42557723301, event push, in_progress, conclusion pending. Publication scan and resulting-main Run site are pending fleet gates. New test additions contain synthetic records, no real mailbox or provider-shaped key fixture.

Exact-SHA publication scan receipt: commit=65a9c12400ac9806af73dbf53da64ddcdaeaf1a4; complete=UNESTABLISHED; historyScanned=UNESTABLISHED; findings=UNESTABLISHED. This cloud cannot perform the fleet publication scan. No zero-findings claim is made.
Main equality: false, branch-only candidate. Initial main `63bfd0d1a155d7be44561e579d643f895fabded3` had successful Verify 42554943349 and Run site 42554943436; those historical main runs are not this candidate's gate.

## Handoff

No product blocker is known. Existing Lanyard egress, other dispatch work, provider accounts, native publishing access, accepted runtime pins and all release holds remain unchanged. Evidence publication is report transport only and confers no READY, acceptance or landing.

CLAIM DISP-002 DONE points=1,2,3,4,5,6,7 tests=tests/api/map-board.test.mjs#DISP-002 map board qualification through desk, Owner and booking doors; tests/browser/dispatch-map.spec.ts#DISP-002, DISP-010, DISP-015 the map board shows the day's pins and drive times, the owner draws a zone, and the technician's phone hands directions to their navigation app, at 1440 and 390; tests/portable.mjs#DISP-002 actual archive restore retains map history but no Maps authority

This claim requests the lander's judgment after the exact-SHA workflow and landing gates; it does not change a Status cell or count.
