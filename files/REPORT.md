# sx-glove-c-f159 report

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f159
Candidate: 5ee76db19338548e301f48938c1b138443b411aa
Main observed: 4eea04c27f02aa2cb0c12edc421a9b4e574de0bf
PR: none; Verify has a branch push entry point.

## Outcome and scope

DISP-005 native acceptance points 1 through 8 are the target. Contract judgments are unchanged: 20 DONE, 214 PARTIAL, 29 MISSING, across 263 rows before and after. The clause remains PARTIAL because exact-SHA Verify failed and its failure did not reproduce. No plan file was edited; proposed plan row: DISP-005 native proof added; browser CI qualification held for triage.

The only runtime change rejects an explicitly supplied foreign technician ID at the existing self-location command boundary. Previously that ID was ignored and the caller's own consent could change. An ordinary command now returns FORBIDDEN and leaves both technicians and transient custody unchanged. Sharing still uses the linked technician's current built-in session. No screen code, inherited eligibility implementation, protected calendar fixture, combined eligibility journey, combined map journey, workflow, contract status or generated view is changed. No new policy default is adopted.

Only Samsara and Maps provider edges are fake. Chromium invokes its native geolocation API with a synthetic sensor position and granted browser permission. Visibility is changed at the browser document boundary; offline mode is Chromium's actual context offline control. The API fixture shuts down and recreates workerd with surviving migrated D1. The archive journey runs real installation export, import and startup; it never seeds product state with SQL.

## Acceptance evidence and frozen rubric

Each row is one acceptance sentence from the existing clause. The named journeys use authenticated native HTTP commands and reads, or the built application. Exact candidate CI evidence is filled in the receipt and CI section below.

| Item | Public-door outcome and independently asserted result | Evidence | Result |
| --- | --- | --- | --- |
| R1 / point 1 | Both phone and Samsara positions reach the owner board with the next visit ID; fixed route expectations are 163 and 169 seconds, with exact arrivals. The 1440 board shows both pins and rounded ETA. Clock-out refuses further captures and provider reads, clears storage and removes board positions. Results are repeated after actual Worker restart. | `tests/api/live-locations.test.mjs:18` — DISP-005 point 1: phone and fleet fixes reach the owner board with next-stop ETAs and clock-out stops both sources after Worker restart<br>`tests/browser/phone-location.spec.ts:42` — DISP-005 point 1: owner board displays phone and Samsara fixes with next-stop ETAs and removes them on clock-out at 1440 | Local PASS; Verify push 42520162580 completed failure (phone journey) |
| R2 / point 2 | Both newly linked technicians report consent disabled, no capture is accepted, no row exists and no position is visible. The phone offers the explicit consent control before any geolocation watch. | `tests/api/live-locations.test.mjs:49` — DISP-005 point 2: a newly linked technician starts with sharing off and no stored or board position<br>`tests/browser/phone-location.spec.ts:83` — DISP-005 points 2, 3 and 4: phone consent requests browser location only during visible online assigned work and never queues offline captures at 390 | Local PASS; Verify push 42520162580 completed failure (phone journey) |
| R3 / point 3 | Own consent enable and withdrawal succeed; foreign technician targeting, Owner, Office, Dispatcher, Agent, custom role and token attempts refuse without changing technicians or locations. Missing consent, shift, timer or current assignment stores nothing. At 390 the browser invokes native geolocation only during eligible visible online work; active consent withdrawal clears the watch and stored fix. | `tests/api/live-locations.test.mjs:62` — DISP-005 point 3: only the linked technician current built-in session changes consent and every missing work condition stores nothing<br>`tests/browser/phone-location.spec.ts:83` — DISP-005 points 2, 3 and 4: phone consent requests browser location only during visible online assigned work and never queues offline captures at 390 | Local PASS; Verify push 42520162580 completed failure (phone journey) |
| R4 / point 4 | All browser writes to the outbox are observed: no location command enters it even online. Offline sensor changes generate neither a capture command nor an outbox entry. Reconnect while hidden sends no buffered capture and the offline sensor value never appears among commands. | `tests/browser/phone-location.spec.ts:83` — DISP-005 points 2, 3 and 4: phone consent requests browser location only during visible online assigned work and never queues offline captures at 390 | Local PASS; Verify push 42520162580 completed failure (phone journey) |
| R5 / point 5 | One numeric vehicle connection replaces the prior one in the separate credential store. Office, Dispatcher, branch-limited Owner, custom role and token attempts refuse. Every provider request uses only the documented Samsara host and Authorization; provider HTTP failure, network rejection and missing GPS refuse without a position. A consent withdrawal during the provider response fences its capture. Missing shift, timer or consent prevents the request. Board, state and restart never poll fleet. | `tests/api/live-locations.test.mjs:102` — DISP-005 point 5: only unscoped owner connects one numeric Samsara vehicle and explicit fixed-host reads refuse missing work or provider answers | Local PASS; Verify push 42520162580 completed failure (phone journey) |
| R6 / point 6 | Captures before shift, timer or consent, older than two minutes or more than ten seconds ahead refuse without replacing the retained row. Reassignment and consent withdrawal stop capture; a native sign-out makes both capture and consent return 401. | `tests/api/live-locations.test.mjs:155` — DISP-005 point 6: stale, premature, future and withdrawn-authority captures refuse without replacing the current fix | Local PASS; Verify push 42520162580 completed failure (phone journey) |
| R7 / point 7 | A newer capture replaces the only row; a later-arriving older capture cannot replace it. The row survives actual Worker restart. The runtime clock hides it after two minutes before the next product command deletes it. Timer stop, clock-out, reassignment and consent withdrawal each remove a freshly populated row. Saved-outcome replay resurrects none. | `tests/api/live-locations.test.mjs:191` — DISP-005 point 7: latest-only storage survives restart, older fixes lose and every expiry or work withdrawal removes transient positions | Local PASS; Verify push 42520162580 completed failure (phone journey) |
| R8 / point 8 | Phone and fleet captures, consent changes and fleet connection retain attributable Activity and business-export facts after restart. Coordinates and fleet key are absent from state, outcomes, durable records, events, commands and captured Worker logs. Customer erasure clears both positions; replay restores no row. A real archive omits populated transient and fleet credential tables and their values, retains generic attributable history, rejects source sessions, and saved-outcome replay after explicit staff reactivation creates no position. | `tests/api/live-locations.test.mjs:234` — DISP-005 point 8: attributable consent, fleet and capture history survives restart without coordinates or keys in state, outcomes, logs or business export<br>`tests/portable.mjs` — DISP-005 real archive custody (populated source, archive manifest, restored history and replay) | Local PASS; Verify push 42520162580 completed failure (phone journey) |

## Inherited duty

| Item | Duty and proof | Result |
| --- | --- | --- |
| I1 | BASE-ROLE-001 is cited by DISP-005. Native command tests exercise the allowed technician and unscoped Owner cases, excluded desk roles, foreign technician targeting, custom roles, tokens, a limited Owner and withdrawn sign-in. Refusals preserve actual records and provider call counts. | Local PASS; Verify push 42520162580 completed failure (phone journey) |

## DONE riders

| Row | Result | Exact evidence or boundary |
| --- | --- | --- |
| 1 | FAIL CI bar | R1 through R8 reach populated allowed and refused outcomes through the clause's actual public doors. |
| 2 | PASS | Real seeded jobs and visits, independently fixed route seconds and arrival timestamps, positive positions, actual refuse cases and unchanged custody on refusal. |
| 3 | FAIL | Existing Verify discovers the new Worker file through its API glob and the new browser file through its browser glob; portable remains in its push shard. No new workflow or flag is needed. |
| 4 | PASS | Relevant runtime and test bytes are recorded in the receipt; final CI executes the exact candidate. Local browser proof includes both widths. |
| 5 | PASS | CONTRACT.md cites BASE-ROLE-001; authority is also explicit in points 3 and 5. Existing inherited duties and receiving clauses are unchanged. |
| 6 | PASS mechanically | Contract generator write and check pass; generated views are restored from main. Status, Gap and Evidence remain the lander's custody. |
| 7 | PASS | No acceptance text, judgment, coverage map or ruling was edited. |
| 8 | PASS | Own consent and unscoped Owner fleet connection succeed; other roles, scopes, token and custom role attempts are refused with no private or provider effect. In-flight consent withdrawal, sign-out and erasure are exercised. |
| 9 | PASS within named boundary | Clause point 1 explicitly permits a fake fleet feed. Live Samsara or Google account acceptance, native background collection, delegated position views, delay-watch obligations and customer disclosure remain with their existing held clauses. No live provider receipt is claimed. |
| 10 | PASS | No new policy default or acceptance change. The existing self-only authority is enforced against explicit foreign targeting. |
| 11 | Pending guarded landing | Candidate is branch-only. Fleet must establish main equality, exact-SHA green Verify, COMPLETE full-history publication scan with zero findings and main Run site. No cloud landing or release occurred. |

## Pre-ready self-check

1. Each named outcome has an actual positive or refuse assertion on populated records. Browser assertions run at 1440 for the board and 390 for phone behavior; proof screenshots show each screen at both widths. CI status is reported separately rather than inferred from local success.
2. No pre-existing assertion was removed, narrowed, skipped or hidden behind a width or environment condition. Protected files and original combined journeys are byte-identical to main.
3. Sign-out refuses subsequent commands, a withdrawn consent fences an in-flight fleet response, erasure clears positions, and capture replay never recreates them. Restored source sessions are invalid, staff require explicit reactivation and fleet credentials require reconnection.
4. No UI implementation changed. The inspected phone and board screenshots retain the seed's existing type, complete rounded card borders and labeled controls. The board's icon control tooltip is asserted on keyboard focus. Existing configuration placement is unchanged.
5. Local generator and lock checks are recorded below. Publication scanning and Run site on the resulting main remain the fleet's required gates. They are not claimed as completed by this cloud run.

## Test inventory and development findings

Focused Worker registrations: 7. Browser registrations: 2. The portability case is additive to the existing single executable journey. The inherited native Worker and browser inventory already had at least 212 registration sites (168 API, 44 browser), above the generic 200 cap; this brief's requested focused qualification makes at least 221 (175 API, 46 browser). These are static registration sites; generated cases can increase the formal total. No cap was raised and no unrelated or protected assertion was removed to conceal that inherited overage. This is reported for the lane's suite-budget bookkeeping.

During test development, the portable replay initially used the Owner and then tried an inactive restored staff persona. The actual product correctly refused both attempts. The final additive replay case follows the original journey's existing explicit Owner staff reactivation and then uses that current technician session. Browser development fixed a full status locator and made geolocation instrumentation count watch IDs as a set, because native clearWatch is idempotent. These were test assumptions, not runtime failures. The exposed foreign-technician targeting ambiguity was the only production repair. The first exact-SHA Verify failed in the phone browser journey; no repair edit or workflow rerun was made because the exact shard replay passed.

## Mechanics and probes

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write then check exit=0; ledger=none exit=0

PROBE DISP-005 1: native location.phone and explicit location.fleetRead, then owner map -> phone and Samsara pins with next-stop ETAs; clock-out -> no rows and no further provider request.
PROBE DISP-005 2: new linked technicians read location and post without consent -> enabled false, LOCATION_STOPPED and no row; phone offers consent.
PROBE DISP-005 3: own native consent succeeds; foreign target, excluded roles, custom role and token -> 403 with unchanged custody; missing work or browser visibility and connectivity -> no capture.
PROBE DISP-005 4: browser offline sensor update and reconnect while hidden -> empty outbox, no location writes and no buffered capture sent.
PROBE DISP-005 5: explicit unscoped Owner numeric vehicle connection and snapshot -> fixed host and Authorization only; wrong authority, missing work and provider failures -> honest refusal and no new row.
PROBE DISP-005 6: pre-work, stale, future, reassigned, withdrawn-consent and signed-out captures -> refusal with no replacement or new position.
PROBE DISP-005 7: newer then older capture, Worker restart, runtime clock advance and each work withdrawal -> latest-only custody, hidden stale fix, command cleanup and no replay resurrection.
PROBE DISP-005 8: Activity, business export, state, saved outcomes, Worker logs and actual archive restore -> attributable generic history, no coordinates or fleet key, invalid source sessions and no replayed position.

## CI and landing custody

The CI, final mechanical checks, source hashes and receipts are attached with this report. This report does not claim a fleet publication scan, main equality or Run site on an unlanded candidate.

Exact-candidate local receipt: `api-receipt.json` and `browser-receipt.json` both name 5ee76db19338548e301f48938c1b138443b411aa and Node v22.20.0. All seven Worker tests, both browser journeys, typecheck, first-party check, generated-view check and source lock check returned zero. Browser and API input digests match exactly. Production build also returned zero; it used the unchanged runtime source.

Hygiene inspection: the diff introduces no email-shaped values; existing synthetic addresses in the shared harness and portability journey are unchanged. No credentials, private environment dumps or held-out gate material are in the packet.

Full modified portability journey returned zero, including its DISP-005 archive custody case. `portable-receipt.json` records the actual command, source provenance and complete successful output.

Product push succeeded on the first guard attempt. The final branch and full head are recorded in `push.log`; main was fetched and merged immediately before that push (already up to date). Every candidate author, committer and trailer passed inspection. Both commits use fleet identity and contain no co-author trailer.


Candidate Verify: push run 42520162580 on `5ee76db19338548e301f48938c1b138443b411aa`, observed in progress at 2026-11-08T20:31:52Z. Baseline main Verify 42517513630 and Run site 42517513548 were completed success on `4eea04c27f02aa2cb0c12edc421a9b4e574de0bf`; these are baseline evidence only, not candidate green.

SCAN commit=5ee76db19338548e301f48938c1b138443b411aa complete=NOT_RUN_IN_CLOUD historyScanned=NOT_ESTABLISHED findings=NOT_ESTABLISHED. Full history exists locally; the cloud exception delegates the COMPLETE zero-finding scan to the fleet lander. Main equality is false: this is an unlanded branch candidate. Candidate Run site is not claimed; that workflow belongs to the resulting main push.

## Final disposition and CI reproduction

DISP-005 remains PARTIAL. Native points 1, 2, 5, 6, 7 and 8 have focused passing Worker, board and real archive evidence. Points 3 and 4 also pass locally on the exact candidate, including the complete failed shard replay, but are not claimed closed because their combined phone journey failed in branch Verify.

Verify push run 42520162580 completed FAILURE on 5ee76db19338548e301f48938c1b138443b411aa. Failed assertion job: 128851846416, shards (browser-1). The failed test is the 390 phone journey at tests/browser/phone-location.spec.ts:83; line 142 expected "Phone location shared with dispatch" to be visible and timed out after 5000ms with "element(s) not found". The verify rollup job 128854302502 consequently failed. All API shards, portable, foundation and browser shards 2, 3 and 4 succeeded. The completed job inventory is in ci-jobs.jsonl; the assertion-only log extract is in ci-failure.txt and intentionally excludes the workflow environment block.

Before any edit, the exact candidate's node scripts/verify-ci.mjs browser-1 command was replayed with the same shard and CI settings, Node 22.20.0 and the mandated cloud Chromium path. All 20 tests passed with exit 0, including the failed phone journey. No code was edited after the CI failure. The branch therefore remains on the original pushed SHA. No flake class was invented and no workflow rerun was requested.

The assignment's "VERIFY REPAIR" rule says: "If it does not reproduce, stop BLOCKED with that output; do not guess a fix." This is the binding reason for stopping. The newly introduced focused phone test is absent from main, so a same-test main replay is not available without introducing candidate test material; the explicit stop-on-nonreproduction instruction was followed. This is not classified as a proven baseline or infrastructure flake.

Riders: row 1 FAIL because the exact Verify bar is red; row 3 FAIL for the same recorded run; rows 2 and 4 through 10 PASS within the stated fake-provider and existing-policy boundary; row 11 PENDING guarded landing. No source Status, Gap or Evidence cell was changed. Counts stay 20 DONE, 214 PARTIAL, 29 MISSING, across 263 preserved Status rows. Publication scan, main equality and Run site remain unestablished fleet gates. Seven GitHub calls were used; no further polling or dispatch is pending.

GAP DISP-005: points 3 and 4 need green exact-SHA phone browser qualification; Verify run 42520162580 job 128851846416 failed and the exact failed shard passed all 20 tests on replay, requiring CI triage under the brief's reproduction rule.

VERIFY_NOT_REPRODUCED {"chromium": "154.0.8037.57", "command": "node scripts/verify-ci.mjs browser-1", "environment_description": "CI browser-1, prebuilt build, Node 22.20.0; exact non-secret command configuration is in reproduce.sh; cloud adaptation uses /usr/bin/chromium with --no-sandbox", "exit": 0, "failure": "CI expected Phone location shared with dispatch to be visible within 5000ms; element was not found", "head": "5ee76db19338548e301f48938c1b138443b411aa", "job": 128851846416, "log": "reproduction.log", "repair_edits": 0, "result": "20 passed; the failing phone journey also passed; CI failure not reproduced", "run": 42520162580, "sha256": "5520fb72cfb0f344fc866f270758cf4314abc2de755b3ff7b7ddeb284d661157", "test": "tests/browser/phone-location.spec.ts:83", "workflow_reruns": 0}

CLAIM DISP-005 PARTIAL points=1,2,5,6,7,8 tests=tests/api/live-locations.test.mjs#DISP-005 point 1: phone and fleet fixes reach the owner board with next-stop ETAs and clock-out stops both sources after Worker restart; tests/api/live-locations.test.mjs#DISP-005 point 2: a newly linked technician starts with sharing off and no stored or board position; tests/api/live-locations.test.mjs#DISP-005 point 5: only unscoped owner connects one numeric Samsara vehicle and explicit fixed-host reads refuse missing work or provider answers; tests/api/live-locations.test.mjs#DISP-005 point 6: stale, premature, future and withdrawn-authority captures refuse without replacing the current fix; tests/api/live-locations.test.mjs#DISP-005 point 7: latest-only storage survives restart, older fixes lose and every expiry or work withdrawal removes transient positions; tests/api/live-locations.test.mjs#DISP-005 point 8: attributable consent, fleet and capture history survives restart without coordinates or keys in state, outcomes, logs or business export; tests/browser/phone-location.spec.ts#DISP-005 point 1: owner board displays phone and Samsara fixes with next-stop ETAs and removes them on clock-out at 1440; tests/portable.mjs#DISP-005 real archive custody

BLOCKED branch=cloud/sx-glove-c-f159 head=5ee76db19338548e301f48938c1b138443b411aa reason=unreproduced_Verify_failure_requires_CI_triage
