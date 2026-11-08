# DISP-006 arrival window qualification

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f157
Candidate: 647eb9a5629d507532fadc789c93119cea9e71c7
Parent main: 4eea04c27f02aa2cb0c12edc421a9b4e574de0bf
PR: none; Verify runs on branch push.

DISP-006 remains PARTIAL. This round qualifies points 2–7 and point 1's desk slice. Counts remain 20 DONE, 214 PARTIAL, 29 MISSING across all 263 Status rows. No Status, Gap, Evidence, acceptance sentence or generated view changed. Plan row proposed: DISP-006 native arrival-window qualification complete; retain the stated downstream holds. No other plan row changed.

## Changes and reproduced defects

1. Before repair, an automatic visit with planned start 07:59 and promise 08:00 to 10:00 answered NO_TECHNICIAN. It now answers WINDOW before ranking and writes no business records.
2. Before repair, an approved dispatch proposal discarded the supplied arrival window. Both dispatch and move proposals now retain their validated explicit windows through approval.
3. An isolated public-command reproduction using main's dispatch source confirmed that a move to 13:00 with a replacement 12:00 to 14:00 window retained no window. The repaired move retains the exact replacement. Changing a promise even while keeping the planned time remains customer not yet asked. The existing AGENT-009 grant still refuses changed windows.
4. The visit panel's existing close icon now uses the seed's shared tooltip component. No new screen, configuration or design system was introduced.

All pre-existing assertions remain intact. The existing assessment, travel-assignment and delay journeys are unchanged. The eligibility, access, calendar fixture, dispatch-map browser file and dispatch screen are unedited. No workflow, runtime pin, migration, homepage or brand change was made.

## Frozen acceptance rubric and proof index

Test names below are expanded in proof-index.json. All API proof uses actual production Worker HTTP command and read doors, migrated disposable D1, native invited sessions and actual Worker disposal and restart. Only the existing calendar network edge is faked. Browser proof uses real native setup and dev, with requests forwarded to the production Worker harness, never fixture responses.

| Row | Acceptance outcome | Proof | Result |
| --- | --- | --- | --- |
| R1 | Three eligible windowed requests, reviewed reassignment and assessment | tests/api/arrival-windows.test.mjs:69, Desk requests, crew moves and assessments keep attributable promises through review, replay and Worker restart | Desk slice passes; online-request callers held by brief |
| R2 | Named visits, crew bookings, service calls, assessments and approved dispatch proposals retain the optional local promise beside planned times | tests/api/arrival-windows.test.mjs:37 and :69, proposal and desk journeys | PASS |
| R3 | Inclusive bounds; outside and malformed windows refuse without writes for named and automatic technicians | tests/api/arrival-windows.test.mjs:17, Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes; assessment refusal in desk journey | PASS |
| R4 | Individual and crew moves keep, replace and remove promises; leaving a kept promise refuses unchanged | tests/api/arrival-windows.test.mjs:69, desk journey | PASS |
| R5 | Exact booking-event time and promise, dispatcher panel and technician phone | tests/api/arrival-windows.test.mjs:69; tests/browser/arrival-windows.spec.ts:9, Arrival promises survive desk booking and reload and appear on the assigned technician phone | PASS; assertions at 1440, screens at 1440 and 390 |
| R6 | Series create, dated revision and rolling generation carry no promise | tests/api/arrival-windows.test.mjs:220, Series creation, dated revisions and the clock-pinned rolling horizon never create arrival promises | PASS; clock pinned, populated initial and newly generated occurrences inspected |
| R7 | Active same-branch candidates only; skills, area, time off, hours, calendar and overlap exclusions, warn and refuse policy, minimum load, exact name tie, ranking reason, none-free refusal and reviewed override | tests/api/arrival-windows.test.mjs:177, Automatic assignment excludes every conflict under owner warn and refuse rules and breaks equal load by name; desk journey at :69 | PASS |
| R8 | Maps drive ranking and downstream online and front-office callers | Existing unchanged tests/api/travel-assignment.test.mjs, DISP-010 points 1–3; RL-7 | Existing drive behavior retained; downstream callers held; no new point-8 claim |
| R9 | Replay creates no duplicate; current-role refusal changes nothing | tests/api/arrival-windows.test.mjs:37 and :69 | PASS; proposal decisions, visit bookings, automatic bookings and assessment replay; Office, Technician, Viewer and current dispatcher demotion |
| R10 | Results survive actual Worker restart | tests/api/arrival-windows.test.mjs:37, :69, :177 and :219 | PASS; retained D1 and exact result equality |
| R11 | Activity and business export retain windows, automatic reasons and actual actor | tests/api/arrival-windows.test.mjs:69 | PASS; populated Activity and actual business export inspected |
| R12 | Changed proposal promise stays customer not yet asked and grants cannot execute it | tests/api/arrival-windows.test.mjs:37 | PASS; both a changed planned time and an unchanged planned time with a changed promise |
| R13 | Revoked session and erased-customer replay cannot restore access or records | tests/api/arrival-windows.test.mjs:69 | PASS; 401 for revoked session and ERASED after restart; unchanged-state assertions |
| R14 | Touched close icon has hover and immediate keyboard tooltip | tests/browser/arrival-windows.spec.ts:9 | PASS; existing shared tooltip, 350 ms hover check and focus check |

## DONE-RIDERS review

| Rider | Result | Evidence and boundary |
| --- | --- | --- |
| 1 | PARTIAL overall; scoped proof passes | R1–R8; full points 1 and 8 retain the brief's caller holds |
| 2 | PASS | Populated bookings, refusals with complete public-state equality, Activity and opened business export; R2–R13 |
| 3 | PENDING push Verify 42519177646: in_progress, conclusion None | Existing Verify globs include both files. Observed push event 42519177646 on 647eb9a5629d507532fadc789c93119cea9e71c7; status in_progress, conclusion None. No candidate green result is claimed |
| 4 | PASS | API and browser receipts bind the candidate SHA. The six unchanged regression tests passed at ef3bc74cee8b80eceacab9bc0a933c77ca2f68f3; custody-receipt.json proves their source and helpers unchanged on this candidate |
| 5 | INSPECTED | Existing DISP-006 requirement, points 7–8 and RL-7 name the owning duties; no inheritance wording changed |
| 6 | PASS mechanical; judgment deferred | Contract generator write and check exit 0, generated files restored; main's Status cells remain untouched |
| 7 | PASS | No acceptance or contract text changed |
| 8 | PASS within this scope | R9, R12 and R13 execute refused current-authority and grant paths and verify unchanged state |
| 9 | PASS boundary retained | Existing calendar edge only; no live provider, customer communication, payment or legal result claimed |
| 10 | Not applicable | No policy default adopted; existing grant restriction and RL-7 remain |
| 11 | Pending guarded landing | Main equality, complete publication scan and candidate Run site are fleet duties; not established in this cloud run |

## Pre-ready review

1. Each newly qualified visible outcome has a populated runtime journey; full clause and exact-SHA CI remain bounded as stated above.
2. No existing assertion was removed, narrowed, skipped or conditioned on viewport width.
3. Current-role refusal, revoked-cookie refusal, replay, erasure and actual restart are exercised, including unchanged records on refusal.
4. Window text uses existing 13px dispatcher metadata and 15px phone details. The touched icon uses the existing tooltip. No one-sided border or settings change was added.
5. Source lock and first-party checks pass. New product diff contains no email-shaped fixture values. Publication scanning, main equality and Run site remain unestablished here and are never represented as complete.

## Public-door probes

PROBE DISP-006 1: enquiry.create, job.create and visit.book with auto for three desk requests -> Tom, Priya, Tom within exact promises; reviewed change and windowed automatic assessment committed. Online callers omitted as directed.
PROBE DISP-006 2: visit.book, crew visit.book, assessment.book and approved dispatch and move proposals -> exact arrivalWindow beside local start and end.
PROBE DISP-006 3: named and auto starts at 08:00 and 10:00 -> committed; 07:59, 10:01 and malformed promises -> WINDOW with unchanged state.
PROBE DISP-006 4: visit.change for individual and crew -> kept, replaced and removed promises; outside-kept attempt -> WINDOW and unchanged group.
PROBE DISP-006 5: browser desk booking and reload, dispatcher panel and assigned technician phone -> visible 8:00 AM – 10:00 AM promise; event has exact 9:00 AM – 10:30 AM (arrival window 8:00 AM – 10:00 AM) text.
PROBE DISP-006 6: series.create, dated series.change and later clock-pinned command -> original and newly rolled occurrences have no arrivalWindow.
PROBE DISP-006 7: auto booking with earlier-named invalid candidates under warn and refuse rules -> Bea then Zoe; none free -> NO_TECHNICIAN; manual override commits after exact conflict review.
PROBE DISP-006 8: unchanged landed drive-ranking journeys exercised; online and front-office callers omitted under the supplied holds.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write and check exit=0; ledger=none exit=0.

## Holds and custody

GAP DISP-006: Point 1's online-request bookings and point 8's online and front-office call sites remain held under the supplied BOOK-002, BOOK-011, BOOK-012, BOOK-013, PAY-002, AGENT-001 and COMM-009 boundaries. Existing customer notice, AGENT-010 authority, provider, Base and accepted-runtime restrictions remain. No release or deployment was performed.

No new account, key or ruling was required for the native work completed here. This is a proven partial candidate, not a DONE claim. Full plan and sequence are retained in PLAN.md. Publication scan: candidate 647eb9a5629d507532fadc789c93119cea9e71c7; complete=NOT_RUN; historyScanned=NOT_RUN; findings=NOT_ESTABLISHED. The full-history clone was used and only the named cloud branch is pushed. Fleet scanning and guarded landing remain mandatory.

Main observed green before work: Verify 42517513630 and Run site 42517513548 at 4eea04c27f02aa2cb0c12edc421a9b4e574de0bf. These are not candidate checks. Product and report custody are separate. Evidence publication grants no READY, acceptance or landing result.

Final proof refinement: eligible technicians are inserted in reverse name order (Zoe, then Bea), so the zero-load winner must be Bea. Five new API sanity journeys and one browser journey were added; no existing test was deleted or narrowed.

Candidate Verify: 42519177646, event push, status in_progress, conclusion None, head 647eb9a5629d507532fadc789c93119cea9e71c7. URL: https://github.com/just-every/run-glove/actions/runs/42519177646. No workflow dispatch or rerun was issued. Three GitHub REST calls were used: main health, the earlier candidate discovery, and this candidate discovery.

Validation results: five focused API journeys passed on the final candidate under Node 22.20.0. The six existing assessment, delay and travel regression tests passed under Node 22.20.0 on the prior head; only the new API tie fixture and its generated lock changed since, as proven in custody-receipt.json. Typecheck, first-party, generated views and source lock checks passed on the final head. Browser results and the four actual screenshots are in the packet with their own receipt.
