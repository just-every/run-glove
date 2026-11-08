# sx-glove-c-f147 — DISP-008 calendar qualification

Repository: just-every/run-glove. Product branch: cloud/sx-glove-c-f147.
Candidate: 5c819a17c0bc27f6096c7aa3b8dd56ddda2baff9.
Integrated main: d1d1a15cc01a553a6035a85d9764f102b8c6ff9f.

This report is a builder qualification claim. It does not count a landing, a live provider acceptance, a release or a publication. Contract judgments and generated views remain main's text. Source counts before and after are 18 DONE, 216 PARTIAL, 29 MISSING, with all 263 Status rows retained. DISP-008 is claimed DONE with points 1–7 qualified. The proposed gate effect is one PARTIAL to DONE; the fleet owns that decision and count update. No other plan row is changed.

## Plan and findings

1. Read the launcher rules, repository AGENTS.md, the full target clauses in CONTRACT.md and their existing acceptance evidence together with the shipped plan, rulings and DONE riders. Map the seven missing outcomes to the existing eligibility and calendar-delivery journeys. Keep DISP-004's external holds and DISP-015's landed proof intact.
2. Reproduce branch-limited Owner connection through calendar.connect with the original access rule. The actual Worker accepted it. The retained successful reproduction bundles that original rule by removing only the new branch restriction from test compiler input; native authentication, commands and provider transport remain real. Add calendar.connect to the shared branch restriction so direct calls and offered grants use the existing unscoped-Owner rule.
3. Qualify Google and Microsoft lifecycle, consent and authority, default and opted-in event contents, paged busy reads, unreadable-provider refusal and independent private iCal use through real commands and D1. Real Worker restarts retain the same outcomes. Fix two defects exposed by those journeys: a busy refusal dereferenced an absent iCal feed; malformed busy instants produced an unconfirmed internal error and reversed intervals were accepted. Refusals now remain explicit and write no visit, delivery work or mapping.
4. Extend the existing built owner journey with default detail choice, reload persistence, exact provider payload checks, empty credential controls after disconnect and stopped delivery after Worker restart. Keep all original map, phone and retained-event assertions. Qualify one independent real calendar archive case in tests/portable.mjs, using separate source and restored installations to avoid changing existing route and customer-preview fixtures.
5. Keep the focused proof as named journeys called from the existing eligibility registration, following the existing calendarDelivery pattern. No existing assertion is deleted or weakened, and no permanent test registration is added. The initial save briefly registered five separate tests; the final candidate folds those outcomes into the maintained journey. The pre-existing suite already exceeds the nominal cap under a simple registration census; no cap raise is requested and no unrelated test is removed.
6. Preserve the first save remotely; merge updated main rather than rebasing the published branch. Generate and check contract views locally, restore both views from main, regenerate the source lock last, and check it. Run the touched API, browser and real archive checks, typecheck and first-party profile. Inspect every candidate commit's identities and trailers before guarded publication. Publish this report and actual receipts only to the separate evidence ref.

No new policy default is adopted. DISP-008 already names the unscoped Owner, explicit consent, minimal disclosure and restore boundaries. The only production changes are in access.ts, calendar-sync.ts and the single busy-refusal message in eligibility.ts. The latter small adjacent repair is necessary for the point-1 and point-6 public-door proof. No Base pin, runtime pin, migration, workflow, homepage or UI component is changed.

## Frozen outcome rubric

Every row uses the actual Worker command door. The browser also uses the built application and real API Worker; only provider transport is faked. The archive case runs actual setup, export, import, startup and restart. CI event and conclusion are supplied in the final receipt section below.

| Row | Acceptance sentence and outcome | Journey and location | Observed result |
| --- | --- | --- | --- |
| P1 | Books, moves and cancels once per provider; busy overlap refuses without a visit or event | tests/api/calendar-sync.test.mjs, exactCalendarLifecycle, lines 22–55 | Independently expected Sydney-to-UTC times; exactly POST, PATCH and DELETE for the same provider event; unchanged visits, work and mappings on refusal; replay and restart send nothing |
| P2 | Only a signed-in unscoped Owner explicitly connects one delegated calendar per technician | tests/api/calendar-sync.test.mjs, ownerConnectionAuthority, lines 57–102 | Office, Dispatcher, Technician, custom role, integration token, signed-out and branch-limited Owner refused; confirmation and second connection refused; credentials stay separate; Owner, role, technician and pinned time appear in Activity and export |
| P3 | Customer details hidden by default; opt-in adds only name and service address | tests/api/calendar-sync.test.mjs, minimalEventDisclosure, lines 104–141; tests/browser/dispatch-map.spec.ts, owner calendar section | Both providers tested with details false and true on create and update; exact title and location; phone, email, private notes, access notes, title and prices absent; built controls persist the choice after reload |
| P4 | No attendees or contact channels leave Glove | tests/api/calendar-sync.test.mjs, minimalEventDisclosure, lines 104–141 | Event payload is limited to the permitted fields; no attendees, organizer or contact fields; Google sendUpdates is none |
| P5 | Archive excludes credentials, pending work and mappings; restore needs explicit reconnection | tests/portable.mjs, calendarRestore | Real source commands populate two credentials, six work rows and two mappings, including uncertain creates and queued updates; actual archive omits all three tables and synthetic secret values; restored tables empty; old sessions refused; import, setup, startup, replay and restart make no provider call; reconnection alone writes no event; fresh explicit read and booking work only after reconnect |
| P6 | Booking refreshes busy time, refuses unreadable provider and retains only busy instants | tests/api/calendar-sync.test.mjs, freshBusyTime, lines 143–182 | Both provider continuations read before deciding; timed and all-day overlap refused; changed answer used on next booking; cancelled, free, transparent and Glove-owned events excluded; missing, invalid and reversed intervals, authorization revocation, HTTP 503 and 20-page continuation refused without writes; stored busy records contain start and end only |
| P7 | Existing private iCal connection remains independent | tests/api/calendar-sync.test.mjs, independentCalendars, lines 184–219 | Connect and read both independently; disconnect each while the other still reads; real Worker restarts between transitions; no delegated transport after delegated disconnect; private iCal address stays available only through its own door |
| D1 | Inherited BASE-DATA-001 custody | CONTRACT.md line 1080 and tests/portable.mjs, calendarRestore | Clause explicitly cites the duty; actual archive preserves ordinary business records but grants no provider credentials, delivery work, mappings or inherited execution authority |

## DONE riders

| Rider | Builder result | Evidence and boundary |
| --- | --- | --- |
| 1 | PASS | P1–P7 public-door journeys above; workflow API evidence appended below |
| 2 | PASS | Seeded customer and visit facts have independent expected results; allowed writes complete and unsafe authority, busy, provider and restore paths refuse without effect |
| 3 | PASS | Existing verification.json API glob, portable command and browser command load all named proof on push; exact run recorded below |
| 4 | PASS locally | Check receipts bind full candidate SHA and hashes of the touched code and tests; browser proof at 1440 and 390; any later main-only integration is reported explicitly |
| 5 | PASS | DISP-008 explicitly cites BASE-DATA-001 and its own points name all other claimed boundaries |
| 6 | PASS mechanically; judgments retained | Generator write and check pass locally; generated views restored from origin/main and not committed; no Status, Gap or Evidence edit; counts unchanged |
| 7 | PASS | No acceptance text or coverage rewrite and no new acceptance point |
| 8 | PASS | Owner completes connection with attributed audit; every excluded actor, missing consent and second connection refuses; current withdrawn role and revoked provider authorization refuse |
| 9 | PASS with boundary | Network-edge fakes qualify the native contract points. No live Google or Microsoft account, OAuth redirect configuration, provider retention guarantee or legal compliance is claimed |
| 10 | Inapplicable | No new custody, consent, spending or authority default; this implements the existing clause |
| 11 | Pending guarded landing | Branch-only custody; main equality, publication scan and Run site remain the fleet lander's gates. This is ACCEPT ON LANDING rather than a claim that landing already happened |

## Pre-ready self-check

1. Every named user outcome has a journey through its public door; exact counts, values and refused effects are asserted. No per-sentence mutation test is claimed or required. Exact-SHA Verify is recorded separately.
2. Existing eligibility, calendar-delivery and browser assertions remain present. New calendar fixtures use distinct times and independent archive installations so they cannot change existing location, route or customer-preview expectations. No assertion is moved behind a width or environment condition.
3. Missing restored credentials, provider authorization revocation and withdrawn current roles refuse. Erasure scrubs a saved personal booking result; replay after restart returns ERASED and sends no event. Restored replay and uncertain work acquire no new execution authority.
4. No UI component changes. Calendar controls are text-labelled, with no icon-only action added. Browser proof shows the existing screen at both widths, with overflow assertions. Existing navigation tooltip proof remains intact. No homepage or visual redesign is included.
5. Source lock and contract generation are checked. No migration is changed. The added-line review finds zero email-shaped literals. Full-history scanning and Run site are not available to this cloud task and remain explicit fleet gates, not fabricated successes.

## Public-door probes

PROBE DISP-008 1: visit.book, visit.change and visit.cancel for Google and Microsoft -> one create, update and delete at independently expected instants; busy refusal changes nothing; restart and replay send nothing.
PROBE DISP-008 2: calendar.connect as current Owner and excluded actors -> Owner consent recorded with technician and pinned time; excluded actors, missing confirmation and replacement refused.
PROBE DISP-008 3: calendar.connect details false and true followed by visit.book and visit.change -> generic event by default; exactly customer name and service address with opt-in.
PROBE DISP-008 4: both provider event requests -> no attendees, organizer or customer contact channels; Google sends no updates.
PROBE DISP-008 5: actual installation export and import -> no calendar credentials, work or mappings, no provider call during import, startup, replay or restart, explicit reconnect required.
PROBE DISP-008 6: visit.book across paged provider answers -> refreshed timed and all-day busy instants; free and owned records excluded; unreadable, revoked, HTTP-error and unbounded answers refused without writes.
PROBE DISP-008 7: technician.calendar, technician.calendarRead, calendar.connect and calendar.read -> independent use and disconnection across real Worker restarts.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses DISP-008 and check exit=0, views restored from origin/main; ledger=none exit=0.

PUBLICATION_SCAN commit=5c819a17c0bc27f6096c7aa3b8dd56ddda2baff9 complete=not_run historyScanned=not_run findings=unestablished. The cloud adaptation delegates this exact full-history scan to the Mac lander. No landing or zero-findings receipt is invented.

## Actual execution and custody receipts

All local checks passed on exact candidate 5c819a17c0bc27f6096c7aa3b8dd56ddda2baff9: touched API including the original calendar-delivery proof, the built browser journey at 1440 and 390, the full real archive script, typecheck, production build and first-party profile. The individual JSON receipts carry command, full SHA, timestamps, file hashes and real exit status. The guarded product push and exact-SHA successful CI receipt are included. This complete packet is transported separately on refs/heads/evidence/sx-glove-c-f147.

Earlier failures are retained as actual logs or labelled terminal excerpts: the pre-repair busy-reference crash; the malformed-instant refusal; the first archive review-field expectation; the missing restart port; fixture interference with the existing route proof; and browser fixture interference with the existing 09:00 location selection. They were diagnosed locally, with existing assertions preserved. These are not failed Verify repairs.


### CI observation

Verify run 42508956904, event push, completed successfully on exact head 5c819a17c0bc27f6096c7aa3b8dd56ddda2baff9. The final REST observation is recorded in ci-status-3.json and ci-receipt.json. Three GitHub calls were used, with at least 300 seconds between reads for this run. No dispatch, rerun or PR was needed. Riders 1 and 3 pass on this exact SHA. Run site and main equality remain pending guarded landing.

Product custody is confirmed by the guarded push: cloud/sx-glove-c-f147 moved from a01f7d6b87b8fe00e9c662ba3c21fc41c83d1549 to 5c819a17c0bc27f6096c7aa3b8dd56ddda2baff9. The saved intermediate commit is 4ee671b (full identity in candidate.json). Every candidate author and committer is the fleet identity; no co-author trailer remains. Current main was fetched and already integrated immediately before this push. The product checkout is clean.


### Local command receipt index

All six commands exited 0 on 5c819a17c0bc27f6096c7aa3b8dd56ddda2baff9. Their actual logs and JSON receipts are selected explicitly for report transport:

- calendar-api: node --test --test-concurrency=1 tests/api/eligibility.test.mjs tests/api/calendar-sync.test.mjs. The original eligibility registration invokes calendarDelivery and then calendarSyncProof; the focused file exports the named outcomes rather than adding registrations.
- browser: timeout 1200 node tests/browser/run.mjs tests/browser/dispatch-map.spec.ts. Built owner, map, retained-event and phone journey passed; screenshots include calendar consent, connection, disconnection and Activity at 1440 and 390.
- portable: timeout 1200 node tests/portable.mjs. Every original restore case and the isolated calendarRestore case passed.
- typecheck: pnpm typecheck.
- first-party: npx -y @runeditrun/rer check --profile first-party.
- build: npx -y @runeditrun/rer build.

The final proof commands used the repository's exact Node 22.20.0 runtime. Long commands ran under the cloud subreaper. No owned dev server or browser is left running. The ordinary route-tree formatting output from build was restored to main and the source lock checked again; no product bytes changed after the candidate commit.


## Terminal qualification

CLAIM DISP-008 DONE points=1,2,3,4,5,6,7 tests=tests/api/calendar-sync.test.mjs#exactCalendarLifecycle; tests/api/calendar-sync.test.mjs#ownerConnectionAuthority; tests/api/calendar-sync.test.mjs#minimalEventDisclosure; tests/portable.mjs#calendarRestore; tests/api/calendar-sync.test.mjs#freshBusyTime; tests/api/calendar-sync.test.mjs#independentCalendars

No product blocker remains. Riders 1–9 pass; rider 10 is inapplicable because no policy default is adopted; rider 11 awaits the guarded lander. All six exact-candidate local command receipts are green, and Verify 42508956904 is completed and successful on the same full SHA. Source counts remain 18 DONE, 216 PARTIAL, 29 MISSING. The target plan row is proposed for DONE after the fleet gate; no lane files were edited here. All Lanyard, Base egress, provider account, activation and release boundaries remain unchanged. No live provider acceptance is claimed.

Main equality: not claimed; this is a branch-only candidate based on d1d1a15cc01a553a6035a85d9764f102b8c6ff9f. Run site run id: not applicable before the fleet lands it. Publication scan: not run in cloud, findings unestablished; the guarded lander must produce its COMPLETE full-history zero-findings receipt. PR: none required by this repository.

READY branch=cloud/sx-glove-c-f147 head=5c819a17c0bc27f6096c7aa3b8dd56ddda2baff9
