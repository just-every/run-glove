# sx-glove-c-f154 — DISP-008 native completion

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f154
Candidate: 9ab2a9b10971e25958dd1f04dd5bdab231a07868
Merged main: f2e01ddb2ba371ee5deed4f9391d7ec5cb51f954
PR: none required; Verify has a branch push entry point.

All seven native DISP-008 acceptance outcomes are covered by passing public-door journeys. The product carries the continuation's repairs for branch-limited Owner connection authority, unreadable or reversed busy intervals, and delegated busy conflicts when no private iCal connection exists. This round makes the focused journeys independently registered, preserves the original combined calendar and DISP-015 assertions, isolates the real calendar restore fixture, and checks privacy across create, update, delete and busy-read requests.

The sole proposed plan-row change is DISP-008: PARTIAL to DONE after the independent gate. Contract judgments remain entirely the fleet's: no source Status, Gap or Evidence cell changed, and there is no candidate diff in CONTRACT.md, ACCEPTANCE.md or docs/CLAIMS.md. Current counts remain 20 DONE, 214 PARTIAL and 29 MISSING, all 263 rows retained. Accepting this single claim would produce 21 DONE, 213 PARTIAL and 29 MISSING. No other target was started.

## Plan and verification

The complete execution plan and its disposition are in PLAN.md. The machine-readable receipt records the exact candidate, commands, local outcomes and pending fleet duties. Focused API proof passes five registrations. The existing combined calendar and DISP-015 journey passes unchanged. Typecheck and first-party validation pass. The real owner browser journey passes in Chromium at 1440 and 390; six selected consent, connected and disconnected screens are included. The real calendar export and import case passes. The complete portability script also exits 0, including its existing quote, marketing, route, erasure, saved-card and invoice-payment restore checks; see portable.log.

After published saves, the candidate merged updated main without rewriting published history. Main's newer quote archive assertions and purchasing changes were retained. The focused API and typecheck were rerun on the final candidate. The browser and archive proof has unchanged relevant bytes after the merge: main's only additional production edit is an unrelated service.saved Activity cost filter in src/glove/api.ts. No calendar source, archive policy or browser code changed after those journeys took their fixtures.

Candidate Verify: push run 42512217809, exact head 9ab2a9b10971e25958dd1f04dd5bdab231a07868; completed with success, observed at 2026-11-08T19:08:16.537603+00:00. No other SHA is used as candidate proof.

## Frozen acceptance rubric

The row ids below are the frozen rubric for this candidate. All provider substitution is at the network edge; commands, sessions, roles, business records, SQL migrations, Worker restart and archive tools are real.

| Row | Acceptance outcome and public door | Proof and lines | Local result | Verify coverage |
| --- | --- | --- | --- | --- |
| P1 | Book, move and cancel; refuse a busy booking without a visit or event | tests/api/calendar-sync.test.mjs:23, exactCalendarLifecycle; authenticated visit.book, visit.change and visit.cancel. Both providers receive independently specified exact UTC times, one POST, one PATCH and one DELETE. The refused booking preserves visits, pending work and event mappings. Actual restart and replay add no write. | PASS | Standard API glob in push Verify |
| P2 | Only the unscoped signed-in Owner explicitly connects one calendar per technician | tests/api/calendar-sync.test.mjs:65, ownerConnectionAuthority. Office, Dispatcher, Technician, custom role, integration token, signed-out and branch-limited Owner are refused with unchanged credential rows and no provider request. Missing consent and second connection are refused. Accepted consent retains Owner identity, role, time and technician in Activity and export. Later authority withdrawal is refused. Browser real controls: tests/browser/dispatch-map.spec.ts:43. | PASS | Standard API and browser journeys in push Verify |
| P3 | Details are hidden by default; explicit details disclose only customer name and site address | tests/api/calendar-sync.test.mjs:112, minimalEventDisclosure. Both providers execute both consent states and moves. Exact permitted event keys and values exclude contact channels, job title, prices, notes, access notes and move reasons. Customer erasure followed by restart and replay cannot resurrect data. Browser default and opt-in controls exercise real writes and reload. | PASS | Standard API and browser journeys in push Verify |
| P4 | No attendees or contact channels leave in calendar requests | tests/api/calendar-sync.test.mjs:23 and :112, exactCalendarLifecycle and minimalEventDisclosure. Inspect every lifecycle and busy request, exact event key sets, body-free deletion, no customer facts in default request URLs or bodies, and Google sendUpdates=none for every lifecycle write. | PASS | Standard API glob in push Verify |
| P5 | Actual archives exclude credentials, queued work and event mappings; explicit reconnection is required | tests/portable.mjs:200, calendarRestore. Populate both providers' confirmed mappings, uncertain creates and queued updates through commands, use real rer export and rer import, open the actual archive manifest and bytes, check the destination's actual tables and history, reject old sessions and fresh busy or booking attempts, replay saved connect and booking commands silently, restart the restored Worker, and explicitly reconnect before a new read and write. | PASS | tests/portable.mjs is a normal push Verify command |
| P6 | Each booking refreshes paged busy time; unreadable providers fail closed; only instants persist | tests/api/calendar-sync.test.mjs:151, freshBusyTime. Both provider continuations include a busy span and an all-day span. Exact independent expected intervals survive while provider titles and contact data do not. A changed answer at the same pinned instant changes the next booking. Missing or invalid intervals, reversed intervals, revoked authorization, HTTP 503 and twenty continuing pages refuse with no visit, delivery work or event change. Free, cancelled and Glove-owned entries are excluded. Restart preserves the refusal boundary. | PASS | Standard API glob in push Verify |
| P7 | Private iCal remains independent from delegated synchronization | tests/api/calendar-sync.test.mjs:192, independentCalendars. Connect and read distinct feeds, actually restart, disconnect private iCal while delegated reads remain usable, then reconnect iCal and disconnect delegated authorization. After restart iCal still reads its exact independent span while the delegated read fails without touching transport. The private credential read returns the original feed only to its permitted owner. | PASS | Standard API glob in push Verify |
| D1 | Inherited BASE-DATA-001 archive custody | CONTRACT.md:1080 cites BASE-DATA-001; calendarRestore performs the actual data boundary and retains permitted business history without inherited execution authority. | PASS | Portable shard |

## Runtime probes

PROBE DISP-008 1: authenticated visit.book, visit.change and visit.cancel for Google and Microsoft -> exact create and update instants, one delete, replay silent, overlapping busy booking refused with unchanged state.
PROBE DISP-008 2: calendar.connect with excluded identities, missing consent and a second calendar -> FORBIDDEN, CONSENT or CALENDAR_SYNC with no changed credentials; a confirmed unscoped Owner succeeds and attributable consent names Owner and time.
PROBE DISP-008 3: calendar.connect with details false and true, then visit.book and visit.change -> generic event by default; opted-in name and service address only.
PROBE DISP-008 4: every captured provider lifecycle and busy request -> no attendee, organizer or customer contact fields; Google write notifications disabled.
PROBE DISP-008 5: rer export and rer import of populated Google and Microsoft connections -> excluded tables empty, old session rejected, startup and replay silent; fresh calendar.read and booking refused until explicit reconnection.
PROBE DISP-008 6: visit.book against paged, all-day, changed and unreadable provider answers -> exact busy spans only; overlapping or unreadable cases refuse without a visit or provider event.
PROBE DISP-008 7: technician.calendar and calendar.connect with distinct provider spans, separate disconnects and actual Worker restarts -> retained connection remains usable, disconnected delegated read refuses without transport.

## DONE riders

| Rider | Result | Evidence or remaining fleet duty |
| --- | --- | --- |
| 1 | PASS; exact-SHA push Verify 42512217809 success | P1 through P7 reach every acceptance outcome through production public doors. |
| 2 | PASS | Seeded real business records, independent exact values, supported and forbidden paths, unchanged refusal-state comparisons; no empty-only acceptance. |
| 3 | PASS; push Verify 42512217809 success on the exact candidate | All named journeys are loaded by normal push Verify; no env flag excludes them. Candidate run details are recorded in receipt.json. |
| 4 | PASS | Final focused API and typecheck run on the candidate. Browser and restore relevant bytes are unchanged by the final main merge and lifecycle request assertion addition. |
| 5 | PASS | The receiving clause explicitly cites BASE-DATA-001; D1 names its archive duty. |
| 6 | PASS mechanically; source judgments intentionally retained | Generator write and check pass with --clauses DISP-008. Generated views restored whole from main. No Status edits, summary edits or dropped parent rows. |
| 7 | PASS | No acceptance point, identifier, ruling or coverage rewrite. |
| 8 | PASS | Owner allowed; excluded identities, current-role withdrawal, consent and replacement refusal exercised with unchanged state and consent audit custody. |
| 9 | PASS within the explicit fake-provider boundary | No live account acceptance, Google QA or redirect configuration, provider-held deletion, legal compliance or external activation claimed. |
| 10 | PASS, no new policy default | The unscoped Owner, explicit consent and minimal disclosure follow the existing clause; no new scope decision or ASK. |
| 11 | Pending guarded landing | Candidate is branch-only. Main equality, candidate Run site and COMPLETE publication scan remain the fleet's gates. Current merged main Verify 42511316584 and Run site 42511316587 are green; they are not candidate proof. |

## Pre-ready self-check and limits

1. Every named native user outcome has a public-door journey with observable success and unsafe refusal; push Verify 42512217809 completed with success on the exact candidate.
2. No original assertion was removed, weakened or moved behind a width or branch condition. Only the continuation's helper invocation moved into five independently discovered registrations; the original eligibility calendar block and DISP-015 file are unchanged relative to main.
3. Revoked authority and provider authorization refuse; personal erasure and replay do not resurrect calendar data; an actual restored installation inherits no calendar execution authority.
4. No UI source changed. The touched calendar controls are labelled text buttons, with no icon-only control introduced. Existing dispatch navigation tooltip behavior is asserted by the browser journey. Existing Team placement and other styling are not changed by this proof-only browser extension. Selected calendar screens were inspected at both required widths.
5. Source lock is fresh; views generate and check. No migration was added, so migration ledger is inapplicable. New fixtures use synthetic-glove values; changed text inspection found no new email-shaped string or bare prose repository token. This inspection is not the fleet publication scan.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write and check --clauses DISP-008 exit=0; ledger=none exit=0.

Publication scan: commit=9ab2a9b10971e25958dd1f04dd5bdab231a07868 complete=false historyScanned=unestablished findings=unestablished. Cloud did not run the Mac-only publication scan. The lander must establish COMPLETE and zero findings before landing. Main equality=false; candidate Run site=not yet applicable.

Held remainder is unchanged: DISP-004's Lanyard read door and Base egress adoption; all account, live-provider, runtime-pin, release and activation holds. These are not promoted by this native fake-provider proof. No blockers are known in the native target.
