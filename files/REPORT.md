# sx-glove-c-f130: DISP-015 calendar delivery

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f130
Candidate: 2ce56cd27d78e45c6f4e8ff94e333b558282b0f6
Merged main: 00543a4111453e00bfce85033457492098af9d3b

DISP-015 has complete native proof for points 1, 2 and 3, subject to the exact-candidate Verify and guarded landing. Source judgments are unchanged: 14 DONE, 220 PARTIAL, 29 MISSING before and after. The proposed landing change is DISP-015 PARTIAL to DONE, yielding 15 DONE, 219 PARTIAL, 29 MISSING only when the fleet lands and judges it.

## Full plan and result

1. Read the launcher instructions, repository instructions, the clause and its three acceptance sentences, operating rules, public doors, existing calendar assertions, shipped plan extract, rulings and all eleven DONE riders. Map the missing proof to committed lifecycle work, uncertainty and disconnect review. No new policy decision or external account is needed for these native points.
2. Exercise the real production API Worker and migrated disposable D1 with real native sessions. Fake only provider network edges. Cover both Google and Microsoft, two connected technicians, reassignment in both directions, booking, movement, cancellation, crew members, four quarterly occurrences, assessments, arrival, completion and accepted route proposals. Prove exactly one ordered write per affected visit and connected technician, unchanged replay, no work for unchanged placement or captures, unrelated commands and refused changes. Use fixed clocks.
3. Exercise a provider that kept a create but returned no reference, and a timeout raised at fetch inside the Worker. Observe unknown in the owner state and Activity, later work pending and unsent, an independent connection still working, repeated cron passes, command replay and an actual Worker disposal and restart retaining D1. Disconnect through current owner authority, retain provider events and mapping references, stop pending work without provider writes, reconnect under a fresh connection, and prove that even reconnecting the same calendar causes zero provider writes and zero new work; only a later explicit visit command starts fresh delivery. Revoke dispatcher authority and refuse replay without writes.
4. Repair only exposed defects: connection-only commands never enqueue or resend existing visits; prioritize unresolved current-connection outcomes over later pending work; project retained mappings and old uncertain work to the owner; show those references for review in the existing Settings form; stop pending work atomically on disconnect; prevent unchanged fresh busy-time reads from invalidating route acceptance while changed availability still refuses it. Preserve the existing DISP-008 block. Extend the existing registered calendar and browser journeys, with focused helpers in the new calendar-delivery proof file. Registration counts stay API 223 to 223, browser 43 to 43; no cap increase, deleted assertion or weakened assertion.
5. Prove the owner status, Activity and retained-event review in the real browser, assertions at 1440 and visual proof at both 1440 and 390. Keep the existing map and phone journey assertions. Build, typecheck, run touched API and browser journeys, validate first-party authoring, generate and check contract views, restore those views from main, and regenerate and check the source lock last. Merge main after the published save; never rebase published work. Push only the named branch, record exact-SHA CI, publish this packet only to the separate evidence ref, and leave scan and landing to the fleet.

## Named journeys

API registration: `tests/api/eligibility.test.mjs:54` — DATA-002, DATA-009, DATA-010 / DISP-004: busy time from a technician's calendar refuses an overlapping booking; the secret calendar address stays with the owner and that technician; DISP-015 ordered delivery, uncertainty and retained-event review. It invokes `calendarDelivery` in `tests/api/calendar-delivery.test.mjs:207` in the ordinary Verify API glob. The focused file has no additional registration.

Browser registration: `tests/browser/dispatch-map.spec.ts:43` — DISP-002, DISP-010, DISP-015 the map board shows the day's pins and drive times, the owner draws a zone, and the technician's phone hands directions to their navigation app, at 1440 and 390. Its existing calendar section invokes `calendarDeliveryReview` at line 249 in the ordinary Verify browser glob, without an environment flag. Only screenshots are optional; assertions always execute.

## Frozen acceptance rubric

| Item | Acceptance sentence and observed outcome | Public door and proof | Result and Verify |
| --- | --- | --- | --- |
| R1 | All committed visit changes enqueue provider work, including technician reassignment. | Real commands and provider calls; focused proof lines 21–88 and 161–193. Both reassignment directions remove the old event and create the new event. Four expected occurrence dates are asserted independently. Changed route availability refuses without changed visits or writes. | Local PASS; exact-SHA Verify pending. |
| R2 | Uncertain writes remain visible and stop later work on that connection, without automatic replay. | Command, owner state, Activity, cron and actual Worker restart; focused proof lines 92–124 and 142–162. Browser status and Activity lines 270–299. | Local PASS; exact-SHA Verify pending. |
| R3 | Disconnect stops writes and retains existing provider events for owner review. | Owner disconnect and reconnection; focused proof lines 125–163. Browser owner controls, exact retained event and visit references, unknown reference warning and fresh connection, lines 303–327. | Local PASS; exact-SHA Verify pending. |

DISP-015 cites no independent Base duty. Its three original acceptance sentences are unchanged. DISP-008 retains busy-time, consent and detail, credential custody and archive and restore duties. Google redirect configuration, QA users, live Google and Microsoft acceptance, the Lanyard door, Base egress adoption and every accepted runtime pin remain outside this claim.

## DONE riders on the exact candidate

| Row | Result | Proof |
| --- | --- | --- |
| 1 | Local PASS; CI pending | R1–R3 above reach all three acceptance outcomes through commands, owner state, Activity and browser. |
| 2 | PASS | Nonempty provider events and real persisted D1; exact expected affected pairs and counts; refused route and role paths leave visits and work unchanged. Focused proof lines 21–88, 125–162 and 177–200. |
| 3 | Pending exact-SHA Verify | Existing push Verify API and browser globs load both journeys. No assertion is hidden behind screenshot flags or width conditions. |
| 4 | PASS locally | API, browser and mechanical receipts name 2ce56cd27d78e45c6f4e8ff94e333b558282b0f6; no relevant edit after the candidate commit. |
| 5 | INSPECTED | No Base duty is newly inherited or claimed. The clause's own points specify these native outcomes; DISP-008 keeps its separate duties. |
| 6 | PASS mechanically; judgment owned by lander | Contract generator write and check exit 0; generated views restored. CONTRACT.md has no candidate diff. Source Status, Gap and Evidence remain main's, as required. |
| 7 | INSPECTED PASS | No acceptance sentence, ruling, coverage map or Status row changed. |
| 8 | PASS for applicable authority | Non-owner disconnect refuses; dispatcher, technician and Agent state omit retained-event projections; revoked dispatcher replay refuses without another write. Focused proof lines 126, 137–140 and 160–162. Existing DISP-008 consent and role assertions remain intact. |
| 9 | INSPECTED PASS | Only fake provider-edge facts are claimed. No live account, legal compliance, provider deletion, provider retention guarantee or production activation is claimed. |
| 10 | INSPECTED PASS | No new policy default; no scope narrowing. Explicit owner connection and disconnect and no automatic uncertain replay preserve the existing boundary. |
| 11 | Pending guarded landing | Main is 00543a4111453e00bfce85033457492098af9d3b, not this candidate. Main Verify 42482766533 and 42481915149 and Run site 42482766463 succeeded there. Candidate scan, main equality and candidate Run site belong to the fleet lander. No landing claim. |

## Reproduced defects and repairs

The first focused run reproduced `pending work must not hide uncertainty`: actual `pending`, expected `unknown`. It also reproduced `ROUTE_STALE: The schedule or eligibility changed. Request another optimization.` on an unchanged connected-calendar route. Those public-door probes pass after the outcome-priority and unchanged-busy-read repairs. A stronger reconnection probe on the first candidate e9257a43b01cadf3be2d57184315005b56e65274 then reproduced an unsafe resend: reconnecting the same calendar increased write calls from 3 to 5. That candidate is superseded and is not offered for landing. The queue now compares visit fields independently of connection changes, so reconnection itself enqueues no work. A later explicit new visit creates exactly one fresh write. The tightened API and browser checks cover this distinction. Disconnect retained mappings in storage but the owner state and screen had no review projection; the new exact-reference checks prove the added projection. A clean typecheck found the owner projection's technician union typing; it was corrected before the final checks. These were local build findings, not CI repair rounds.

## Pre-ready self-check

1. Each named user outcome has a public-door journey that fails if it disappears: affected write pairs and provider events, visible unknown and zero retries, retained references and no disconnect provider call. Exact-SHA CI is recorded separately.
2. The original DISP-008 block and all existing assertions remain. No assertion was removed, narrowed or moved behind a width or branch condition. Registration counts are unchanged.
3. Replay and withdrawn authority are exercised. Retained review contains opaque visit, connection and provider-event references, not customer details or credentials. It is added only in the owner state projection and is never written to domain records or archives. Existing DISP-008 erasure and restore boundaries remain its duties; no new restoration or erasure authority is introduced.
4. The touched calendar controls are under Team and settings, have visible text labels, introduce no icon-only controls or one-sided borders, and use the existing font sizing. Retained identifiers wrap on the phone. The existing map journey also checks its icon tooltip. Candidate screenshots show 1440 and 390.
5. Source lock and contract generation checks pass; no workflow, Base pin, runtime pin or generated view is committed. New fixture values use synthetic-glove names. No email address is added in the product diff. Publication scan and Run site are unestablished until the fleet lands.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses DISP-015 and check exit=0; ledger=none exit=0

PROBE DISP-015 1: native visit commands and accepted route -> one ordered provider write for each affected connected technician and visit; reassignment deletes old and creates new; no calendar effect on unchanged or refused work.
PROBE DISP-015 2: unconfirmed create and timeout, queued later change, replay, repeated cron and actual Worker restart -> unknown remains visible and original call count unchanged.
PROBE DISP-015 3: explicit owner disconnect, review and fresh reconnection -> pending work stopped with no provider write, existing event and mapping retained, uncertain old work never replayed.

Publication scan: commit=2ce56cd27d78e45c6f4e8ff94e333b558282b0f6 complete=NOT_RUN historyScanned=NOT_RUN findings=UNESTABLISHED; delegated to the maintained fleet lander under the cloud route.

Plan row proposed: DISP-015, points 1–3 qualified. No fleet plan file was written. No account or policy blocker was encountered. Product custody and evidence publication are separate.

Candidate Verify: push run 42484107814 on 2ce56cd27d78e45c6f4e8ff94e333b558282b0f6, initially queued. Previous run 42483379309 belongs to superseded head e9257a43b01cadf3be2d57184315005b56e65274 and supplies no final-candidate proof.

Final local results: five touched API registrations passed; the combined browser registration passed with all existing map and phone assertions; production build, typecheck, first-party check, contract generation and source-lock check exited 0. api-receipt.json, browser-receipt.json and GATES.json all bind to 2ce56cd27d78e45c6f4e8ff94e333b558282b0f6.
