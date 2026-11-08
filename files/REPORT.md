# sx-glove-c-f135 — DISP-015 delivery qualification

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f135
Candidate: 2708cbcec86f7a3870e39d9f3fcf8aba3cd42814
Base main: df46272d1918e674f36329b0a2070d2a240d59a2
Starting continuation: 8380229cfd03485b3c1ebf07a6aaba5a7f89068f

## Result and plan

All three native acceptance points are exercised and pass locally on the candidate. The continuation already implemented the requested repairs and public-door journeys. This round read the complete clause, operating rules, continuation code and tests, rebased its four product commits onto main, then merged the later main after the first push, regenerated the source lock at each lock conflict, and reran the focused API and browser journeys, typecheck and first-party check. No additional production repair, acceptance change or test registration was needed. Screenshot inspection found that the Activity proof had retained an old scroll position; this round adds an explicit scroll to the existing unknown-outcome entries before both captures, without narrowing or removing an assertion. Both generated views match main and are absent from the product diff. No builder edit changed a Status, Gap or Evidence cell; the merge retains main’s newly judged DISP-014 row whole.

The plan row proposed for fleet judgment is DISP-015: PARTIAL to DONE, points 1–3. Initial source counts were 14 DONE, 220 PARTIAL, 29 MISSING. New main independently judged DISP-014 DONE during the round. After retaining that judgment, DISP-015 work leaves source counts unchanged at 15 DONE, 219 PARTIAL, 29 MISSING, with all 263 rows preserved. If DISP-015 is accepted, the lander changes these to 16 DONE, 218 PARTIAL, 29 MISSING. No other plan row or clause is claimed. No additional unblocked clause touching these files is supplied after this target in the extract.

## Frozen proof rubric

| Item | Acceptance outcome and public doors | Proof on candidate |
| --- | --- | --- |
| R1, point 1 | All committed visit changes enqueue work, including reassignment. Real authenticated commands use migrated D1; only Google and Microsoft transport is fake. | PASS: tests/api/calendar-delivery.test.mjs:15–94,169–203, exported calendarDelivery journey. Books, moves, cancels, reassigns both ways, books and moves a two-person crew, creates four independently checked series dates, books and completes an assessment, and accepts an optimized route. Checks exactly one row per affected visit and technician, provider write count and durable order, old event deletion, new provider event existence and placement, unchanged-command and refused-command silence, replay and restart silence. |
| R2, point 2 | Unknown writes remain visible, block later work on the same connection, and never automatically repeat. | PASS: tests/api/calendar-delivery.test.mjs:97–166. Google unconfirmed create and Microsoft transport timeout are retained as unknown. Activity and owner state expose the outcome; later work remains pending through repeated cron, replay and actual Worker disposal and restart with persistent D1. The other connected technician still delivers. Browser owner status and Activity: tests/browser/dispatch-map.spec.ts:249–300. |
| R3, point 3 | Disconnect stops pending work and retains existing provider events for owner review. | PASS: tests/api/calendar-delivery.test.mjs:127–165 and tests/browser/dispatch-map.spec.ts:302–328. Owner disconnect marks pending work disconnected, makes no calendar write, leaves confirmed provider event and mapping intact and lists old uncertain work. Unauthorized disconnect is refused. Dispatcher, technician and agent cannot read the owner review projections. Reconnecting the same calendar sends nothing; a newly committed visit uses a fresh connection; the old uncertain write never repeats even after restart and replay. The owner reviews both providers in the browser. |
| R4, inherited attribution and authority | Existing DATA-002 Activity and export attribution and owner-only provider review. | PASS: tests/api/calendar-delivery.test.mjs:94,117–118,128,139–143,160–163,165 and harness assertTrail. Real role withdrawal refuses replay without another write. No new permission or disclosure is introduced. |

API execution registration: tests/api/eligibility.test.mjs:54,139 — DATA-002, DATA-009, DATA-010 / DISP-004: busy time from a technician's calendar refuses an overlapping booking; the secret calendar address stays with the owner and that technician; DISP-015 ordered delivery, uncertainty and retained-event review.
Browser execution registration: tests/browser/dispatch-map.spec.ts:43,75 — DISP-002, DISP-010, DISP-015 the map board shows the day's pins and drive times, the owner draws a zone, and the technician's phone hands directions to their navigation app, at 1440 and 390.
Both are invoked by the existing push Verify commands in verification.json, without workflow changes or an environment flag gating assertions. The focused API module is imported by the existing calendar registration; its standalone discovery adds no registration. The browser owner assertions run at 1440; the changed status, Activity and retained-event screens are captured at both 1440 and 390. All pre-existing assertions, including the DISP-008 block and phone checks, remain.

## Probes

PROBE DISP-015 1: authenticated visit, crew, series, assessment and route command doors -> exact affected work rows and ordered provider writes; reassignment removes the old event and creates the replacement; replay and commands without visit changes send nothing.
PROBE DISP-015 2: Google unconfirmed create and Microsoft timeout, later visit change, repeated cron, command replay and actual Worker restart -> owner state and Activity retain unknown; blocked connection sends nothing further; other technician continues.
PROBE DISP-015 3: refused Dispatcher disconnect, Owner disconnect and reconnection of the same calendar -> zero disconnect writes, retained events and mappings visible to Owner, no replay on reconnect, and one fresh write for a new visit.

## DONE riders

| Rider | Result | Evidence |
| --- | --- | --- |
| 1 | LOCAL PASS; exact-SHA Verify pending | R1–R3 exercise each acceptance outcome and owner-visible state; candidate Verify push run 42490197752 was in progress at discovery. |
| 2 | PASS | Nonempty confirmed events, uncertain provider events, blocked pending work and retained mappings. Unsafe unauthorized disconnect and revoked-authority replay are refused with no new writes. |
| 3 | PENDING CI | verification.json runs the API glob and browser runner on push; exact-SHA Verify 42490197752 is in progress, not asserted green. Screens are captured without gating assertions behind the screenshot variable. |
| 4 | PASS | The API journey ran again on the final merged worktree; committing changed no runtime bytes. The final browser journey used the final test and unchanged calendar UI. Its copy preceded an unrelated main change to subcontract-handler precedence; the calendar API sections are byte-identical, and the merged API was independently rerun. No calendar behavior changed after these runs. |
| 5 | INSPECTED | DISP-015 names its own delivery, uncertainty and disconnect duties; no new Base inheritance is claimed. DATA-002 attribution is exercised. Busy-time, credential custody and archive restoration remain DISP-008 duties. |
| 6 | PASS, judgment update reserved for lander | Contract write and check exit 0. Generated views restored whole from main. All judgment cells equal current main; this target changes no judgment or count. |
| 7 | PASS | CONTRACT.md diff is empty; no acceptance sentence or coverage map changed. |
| 8 | PASS for touched authority | Owner disconnect succeeds; Dispatcher disconnect and withdrawn Dispatcher replay fail; other roles receive no retained or uncertain review projection. Existing signed-in authority rules are preserved. |
| 9 | PASS, honest boundary | Fakes qualify only Google and Microsoft delivery behavior as allowed by the clause. No live account, OAuth production configuration, redirect setup, live sandbox acceptance, busy-time matrix or DISP-008 archive duty is claimed. |
| 10 | PASS | No policy default was introduced or changed. |
| 11 | PENDING GUARDED LANDING | Candidate is branch-only. Fleet must scan this exact full-history SHA, require exact-SHA Verify success, land it and require exact resulting main Run site success. |

## Pre-READY self-check

1. PASS locally: real journeys perform and inspect every named outcome; removing queueing, the uncertainty barrier, retained mappings or owner review makes their assertions fail. Exact-SHA CI remains pending.
2. PASS: no pre-existing assertion was removed, narrowed or hidden behind a width or branch condition. No test registration was added; no static pin test was added or encountered that required removal.
3. PASS for touched replay and authority paths: replay after restart and reconnect never repeats uncertain work; revoked Dispatcher authority is refused. INSPECTED erasure fence: delivery resolves current records and refuses creation for an absent or erased job. No erasure behavior changed; DISP-008 restore qualification remains outside this claim.
4. INSPECTED: retained review uses existing text controls, 13px or larger ordinary text and existing rounded surfaces. New review has no icon-only controls. The existing dispatch keyboard-tooltip assertion still passes. Configuration remains in the existing Team settings screen. Screens at 1440 and 390 were inspected and show readable status and wrapped references.
5. PASS source lock and diff hygiene. Zero added email-shaped lines. Publication scan and candidate Run site are fleet responsibilities, not claimed as completed here. Existing Base and rer pins are unchanged.

## Mechanical and custody

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses DISP-015 then check exit=0, views restored from origin/main; ledger=none exit=0 (no migration edit).

The candidate was pushed successfully on attempt 1 with the fleet cloud push guard. Every candidate commit, including all parents reachable outside main, has the fleet author and committer identity and no trailer. The worktree was clean before both pushes. Final merge commit 2708cbcec86f7a3870e39d9f3fcf8aba3cd42814 includes the screenshot correction and the newer main; all generated-view and Status changes in that merge are inherited whole from main and the candidate diff against main contains none. No PR is required: Verify has a branch-push entry point. No default-branch push or force push occurred.

Exact-SHA scan: commit=2708cbcec86f7a3870e39d9f3fcf8aba3cd42814, complete=false, historyScanned=false, findings=unestablished, status=NOT_RUN_CLOUD. This is explicitly deferred to the maintained Mac lander; it is not a clean scan receipt.

Main equality: false, expected before guarded landing. Observed main df46272d1918e674f36329b0a2070d2a240d59a2 had successful Verify runs 42490057367 and 42489138103, plus Run site 42490057427. These do not establish candidate success. Candidate push Verify is 42490197752, event=push, conclusion=pending at discovery. No Run site was requested on the cloud branch. No CI failure was observed or repaired; VERIFY_REPRODUCED does not apply.

Complete actual selected logs, receipt.json, CI discovery responses, identity receipt and ten clause-screen PNGs are in this packet. Setup output and private runtime entries were excluded. Evidence transport uses the evidence ref separately from product custody. Product source and node_modules will be deleted only after evidence publication and remote custody verification; this packet stays outside the clone.

Blockers: none found in the native DISP-015 outcomes. Remaining actions are independent fleet CI, publication scan and guarded landing; other account, Base, policy and runtime holds are unchanged.

CLAIM DISP-015 DONE points=1,2,3 tests=tests/api/calendar-delivery.test.mjs#calendarDelivery; tests/browser/dispatch-map.spec.ts#calendarDeliveryReview
