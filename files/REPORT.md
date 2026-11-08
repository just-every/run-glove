# COMM-012 continuation report

CLAIM COMM-012 DONE points=1,2,3,4,5,6,7 tests=tests/api/morning-email.test.mjs#COMM-012 points 1–7: morning delivery, owner authority, local clock, interruption, provider facts and no retries; tests/browser/morning-brief.spec.ts#AGENT-008 points 1–2 and 4: owner reads the fixed-date Today brief and follows every section action at 1440 and 390 without sending

Product branch: cloud/sx-glove-c-f168. Full candidate: a8f9867a413fe790732df707a8f74172b095d966. Main retained: 5fc3e002ef52aef13409cc8e93786fd74afb6c6a. PR: none; branch push is the existing Verify entry point. Product source and contract judgments are unchanged. The two unfinished predecessor commits were rebased onto current main without rewriting their published original branch. Their complete proof was saved at 4b89d8f, then strengthened with current-authority replay and revoked-token checks at the candidate.

Verify 42534874359, event push, status in_progress, conclusion None; https://github.com/just-every/run-glove/actions/runs/42534874359

The focused API command passed all 8 journeys; the focused browser command passed its 1 existing Today journey, including all provider states. Typecheck and first-party check exit 0. Every receipt records the exact candidate SHA. The committed fixed-clock cron journey ran outside Verify as the local focused-api receipt, with start and finish timestamps and a captured-output hash. No live clock wait, real provider send, account acceptance or release is claimed.

Source counts before and after: **22 DONE, 212 PARTIAL, 29 MISSING, 263 total**. COMM-012's source row remains PARTIAL for the lander; the builder claims its native points 1–7 complete, subject to the exact-SHA workflow and guarded landing. Audited separately asserted outcomes: 0 before, all 7 now reached and observed. The requested plan update is COMM-012 only; no other campaign clause was taken and no plan or inbox file was written. The full actual execution plan is PLAN.md.

## Frozen proof rubric

All rows below are reached by `tests/api/morning-email.test.mjs` — “COMM-012 points 1–7: morning delivery, owner authority, local clock, interruption, provider facts and no retries” — or the additive browser journey “AGENT-008 points 1–2 and 4: owner reads the fixed-date Today brief and follows every section action at 1440 and 390 without sending”. Runtime assertions use fixed business-local instants through the harness clock and `h.scheduled`; fakes are at the provider edge. The Verify event and conclusion are the single exact-head result stated above and in RECEIPT.json, not predecessor CI or current-main CI.

| Item | Observed outcome | Public-door proof and lines |
| --- | --- | --- |
| R1 / point 1 | PASS locally: First due concurrent runs send exactly one full brief; signed delivery folds that date to delivered; callback replay, later runs and actual Worker restart do not resubmit. | tests/api/morning-email.test.mjs:27–63, onceAndContent; brief route, real scheduled handler and signed callback. |
| R2 / point 2, authority | PASS locally: Signed-in unscoped Owner enables, disables and changes time. Office, Dispatcher, Technician, custom role, token, signed-out and branch-limited Owner are refused without business changes. | tests/api/morning-email.test.mjs:65–110, authorityAndDefaults; public command and state doors. |
| R3 / point 2, defaults | PASS locally: Before connection and invalid times refuse without changes. Connection alone leaves mail off; default is 07:00; explicit changes retain an attributable history. | tests/api/morning-email.test.mjs:65–114; command, Activity and business export. |
| R4 / point 2, withdrawal and replay | PASS locally: An originally authorized command is refused after its Owner is demoted; a new request is also refused. A revoked integration credential is 401 and changes nothing. | tests/api/morning-email.test.mjs:115–128; current authority checked on the actual command door. |
| R5 / point 2, reading | PASS locally: Opening the brief API and the real Today page produces no mail, push, model request or state change. | tests/api/morning-email.test.mjs:32–36; tests/browser/morning-brief.spec.ts:24–67 and 72–85. |
| R6 / point 3, local clock | PASS locally: Sydney local November 9 differs from UTC November 8. Fifteen-minute checks before 07:30 claim nothing; the exact and first later due checks send to the owner account instead of the business address. | tests/api/morning-email.test.mjs:132–147; pinned runtime clock and h.scheduled. Actual cron */15 is inspected at wrangler.jsonc:9–12. |
| R7 / point 3, interrupted claim | PASS locally: An actual Worker restart cuts off the provider answer after the durable queued claim. The date retains only queued and is not retried; no accepted or delivered fact is invented. | tests/api/morning-email.test.mjs:148–167; persistent D1 and actual Miniflare dispose and restart, not a seeded send phase. |
| R8 / point 4 | PASS locally: Off, missing installation credential, explicit disconnection and no usable active-owner address claim and send nothing. | tests/api/morning-email.test.mjs:170–196; public commands and scheduled handler; only the otherwise uncreatable unusable owner-address edge is seeded in D1. |
| R9 / point 5, provider answers | PASS locally: Accepted, refused, rate-limited, server-unconfirmed and genuinely unreachable transport answers fold to their honest states. Unreachable transport is uncertain with transport_uncertain, never refused. | tests/api/morning-email.test.mjs:199–228; provider boundary only; the existing provider fakes are unchanged. |
| R10 / point 5, callback binding | PASS locally: Signed delivered and bounced callbacks affect their date. Another recipient refuses, another unclaimed date is ignored, and both leave business and brief facts unchanged. | tests/api/morning-email.test.mjs:234–253; signed callback public route and whole-business snapshots. |
| R11 / point 5, custody | PASS locally: Every queued and provider-outcome fact is attributable provider Activity and retained in business export, bound to its date and provider reference. Provider key, event verification material and complete brief bodies are absent. | tests/api/morning-email.test.mjs:254–260; assertTrail uses /api/glove/activity and /api/glove/export at tests/api/harness.mjs:343–357. |
| R12 / point 5, Today | PASS locally: Real Today shows scheduled, queued, accepted, refused, rate-limited, unknown, delivered and bounced folds and corrective next steps. Delivered explicitly means the mail server accepted it. | tests/browser/morning-brief.spec.ts:69–132; assertions at 1440; captures of every state at 1440 and 390. |
| R13 / point 6 | PASS locally: Each failed or unknown date retains its state through later runs and restart. Every next local date makes its own submission, with no automatic resend. | tests/api/morning-email.test.mjs:206–233; scheduled handler and actual Worker restart. |
| R14 / point 7 | PASS locally: Full plain-text email equals the brief read for the scheduled instant, using nonempty native jobs. No HTML, unsubscribe or marketing content is added. | tests/api/morning-email.test.mjs:29–44; native brief route compared with the captured provider request. |

## Inherited duties in this delta

| Duty | Result and evidence |
| --- | --- |
| BASE-AUDIT-001; DATA-002 provider Activity and export | PASS locally: R3 and R11, complete attributable configuration and provider facts, dates and references. |
| BASE-MAIL-001 connected provider boundary | PASS locally: R1, R9, R10 and R12, actual production Worker calls and signed callbacks with honest accepted versus delivered states. Live provider qualification remains the field register. |
| BASE-OPS-003 and BASE-OPS-004 operational failure and recovery | PASS locally: R6, R7, R9 and R13, deterministic local clock, persistent claims, actual restart, unknown outcomes and no retry. No new execution authority. |
| BASE-SECRET-001 installation-secret custody | PASS locally: R11, exported Activity and business data omit the configured key and event verification material. No brief body is retained in provider facts. |
| Existing erasure and retained-record duties | INSPECTED: no runtime persistence, projection, erasure, session or credential code changes; the protected existing journeys and their assertions are untouched. No broader erasure or restore qualification is claimed. |

## DONE riders

| Row | Result | Evidence or remaining lander duty |
| --- | --- | --- |
| 1 | PASS locally; exact-SHA workflow result below | R1–R14 cover every native acceptance outcome through public doors. |
| 2 | PASS | Nonempty seeded work is read; unsafe authority, malformed times, wrong callback recipient and replay paths are actually attempted and snapshots stay unchanged. |
| 3 | PENDING exact-SHA CI | The existing API glob loads the focused test. The existing browser runner loads the additive Today assertions without a new flag. Verify 42534874359, event push, status in_progress, conclusion None; https://github.com/just-every/run-glove/actions/runs/42534874359 |
| 4 | PASS | All four local command receipts name this exact head. Screens were captured by that head. No source or test changed afterwards. |
| 5 | PASS / INSPECTED | COMM-012 already cites BASE-AUDIT-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004 and BASE-SECRET-001. No citation or receiving obligation was changed. |
| 6 | PASS mechanically; lander owns the judgment cells | Generator write and check exit 0. Views are restored from main and not committed. Contract status, Gap, Evidence, counts and provenance remain exactly main. |
| 7 | PASS | No acceptance text, point, ruling, coverage mapping or inherited obligation changed. |
| 8 | PASS | Owner configuration succeeds with audit facts. Every excluded authority and an allowed-command replay after demotion refuse without business changes; revoked credential returns 401. |
| 9 | PASS, bounded | Only network-edge fake delivery is claimed. Live provider delivery and provider-account qualification remain R-9 field proof and are not claimed. |
| 10 | NOT APPLICABLE | No new custody, consent, spending or authority policy default was introduced. Existing owner-only morning configuration is unchanged. |
| 11 | PENDING guarded landing | Main is 5fc3e002ef52aef13409cc8e93786fd74afb6c6a and does not yet equal the candidate. Candidate publication scan, guarded main landing and candidate Run site remain fleet duties; no cloud result is invented. |

## Pre-READY self-check

1. Every named native outcome has a passing public-door assertion or the explicit inspected cron binding. R1–R14 identify the outcomes and observable effects. Full-SHA Verify is reported honestly above.
2. No existing assertion was removed or narrowed. The original Today journey was extended in place. `tests/api/email.test.mjs`, `tests/api/morning-brief.test.mjs`, `tests/fixtures/mail-providers.mjs` and `tests/browser/email.spec.ts` match main exactly.
3. Current authority and replay are exercised in both directions, including successful owner configuration, all forbidden roles, demotion and revoked credentials. This proof-only delta adds no stored personal data or restoration path.
4. Today status text is asserted at least 13px. Its desktop and phone screenshots were inspected. The morning-brief panel has text links and no icon-only action to acquire a tooltip. No screen implementation, border, configuration location, homepage copy or logo changed.
5. Source lock and contract generation pass; no generated view is committed. Main equality, candidate Run site and publication scanning are guarded lander checks. Their actual unavailable result is recorded below, never represented as a cloud pass. The added source contains no literal email-shaped fixture value or provider-shaped key. Changed slash tokens are actual paths, API routes or MIME media types, not invented repository references.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses COMM-012 then check --clauses COMM-012, restored from origin/main exit=0; ledger=none exit=0

Publication scan: commit=a8f9867a413fe790732df707a8f74172b095d966; complete=UNESTABLISHED; historyScanned=UNESTABLISHED; findings=UNESTABLISHED; NOT RUN IN CLOUD under the cloud push exemption. The fleet must run its full-history scan on this exact candidate and require COMPLETE with zero findings before landing.

Baseline main CI, not candidate proof: exact main 5fc3e002ef52aef13409cc8e93786fd74afb6c6a has push Verify 42531560842 success and Run site 42531560830 success. Candidate main equality is false before landing. Candidate Run site is not run before main landing. No PR, dispatch or workflow rerun was opened.

## Public probes

PROBE COMM-012 1: concurrent due cron, brief route and signed delivery callback -> exactly one complete text, delivered on its date, still one after later runs and actual restart.
PROBE COMM-012 2: mail.morning with owner, excluded roles, token, branch-limited owner, invalid time, captured command after demotion and revoked token -> allowed owner changes audited; refusals leave the business unchanged; reads send nothing.
PROBE COMM-012 3: Sydney local 07:30 across a different UTC date and interrupted provider call -> early checks claim nothing, due check targets owner account, durable queued claim survives Worker restart without a second submission.
PROBE COMM-012 4: off, disconnected and unusable active-owner address cron -> zero claims and zero submissions.
PROBE COMM-012 5: provider answers and signed correct, wrong-recipient and wrong-date callbacks; Activity, export and Today -> honest per-date folds, references retained, secrets and brief bodies omitted, correct next steps shown at 1440 and 390.
PROBE COMM-012 6: refused and unknown date replay, restart and next local date -> failed date unchanged; next date sends once.
PROBE COMM-012 7: captured provider text against same-instant public brief -> exact complete plain-text brief, without marketing or unsubscribe content.

## CI triage and limits

Predecessor Verify 42529815126 failed job 128881480080 in the unrelated due-visits browser journey: `TypeError: fetch failed`, caused by `SocketError: other side closed` at `tests/browser/due-visits.spec.ts:63:26`. Its exact browser-2 shard was run on the failed SHA before any repair: 23 passed, exit 0. The same failed test on current main on the same cloud runner also passed, exit 0. No speculative repair or retry of the GitHub workflow was made. CI-TRIAGE.md and ci-triage.json retain the observed commands, platform difference and results. The local reproduction used the cloud system Chromium and Node 24.19.0; the final focused proof uses the repository's Node 22.20.0.

No private held-out gate material was inspected. Reports are separate evidence commits. Native COMM-012 is the only claim. AGENT-016 financial sections, COMM-013 callback qualification, COMM-017 custody, COMM-018 provider matrix, live provider receipt R-9, consent holds, accepted runtime pins and all other account, ct and Base holds remain unchanged. No new default was adopted.

Test accounting: the repository has no test-budget.json and already exceeds the generic 200-test cap: a literal registration inventory finds 232 existing API and browser registrations on main, before any loop expansion or standalone assertion scripts. The required recovered focused API sanity journey adds one registration; browser registration count is unchanged. No existing assertion was removed to reduce that inherited inventory. This is reported for fleet bookkeeping; no cap raise or false compliance claim is made.

No product blocker remains after local proof. Exact-SHA CI and all unlanded conditions are stated above. After the gate and guarded landing, the lander owns any COMM-012 DONE status, Gap and Evidence write and its resulting counts.
