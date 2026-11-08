# sx-glove-c-f131 — COMM-015 custody qualification

Repository: just-every/run-glove
Product branch: cloud/sx-glove-c-f131
Candidate: 3810d9fd5c36068b24b8d6a2f17b7bbbfaadb6ef
Baseline main incorporated: 3a6b0e410f4b2744b7c0d293a71c9cae4d3113d2

This continuation carries forward the focused public-door proof from 3041ce39fb8a867522c4b3cac85402ba32d3ff83, preserves current main's browser fixture work, and strengthens encoded Basic-credential secrecy and the allowed side immediately before disconnect revokes both overlapping credentials. No production defect was exposed. No production code, screen, provider pin, workflow, clause acceptance text, Status, Gap or Evidence cell was changed. The contract and all 263 judgment rows remain intact: before and after, 14 DONE, 220 PARTIAL, 29 MISSING.

## Completed plan

1. Read the inline campaign extract, all eleven DONE riders, the ruling index and Glove rulings; inspect COMM-015's eight acceptance sentences, current implementation, focused proof, email browser journey and archive proof.
2. Create the named branch from the requested prior candidate, rebase the unpublished continuation onto current main, preserve all other writers' work, and install fleet identity and commit hooks.
3. Run the existing email API proof and focused custody journey. Add only the two previously indirect security outcomes to that same journey: absence of reversible Basic encoding in public projections and captured logs, and successful authentication by both overlap credentials immediately before disconnect.
4. Build and run the unchanged email browser journey at 1440 and 390, retaining masked screenshots. Run actual installation export and import proof. Reproduce the prior run's failing browser shard before contemplating any CI repair.
5. Merge refreshed main after the first product push. Generate and check contract views, restore them whole from main, regenerate the source lock last, and run lock, typecheck and first-party checks on the committed candidate.
6. Push only the named cloud branch through the fleet guard after checking all candidate authors, committers and trailers, including side parents. Publish actual non-secret reports and receipts through the separate evidence ref. Leave publication scanning, guarded landing and candidate-main Run site to the fleet.

The plan row addressed is COMM-015 only. No plan was rebuilt, no inbox file was accessed, and no other clause or repository was changed. Broader COMM-013, COMM-014, COMM-017, COMM-010, COMM-018 and COMM-011 duties remain with their owning clauses. Live Postmark delivery, provider-account acceptance and automatic resend are not claimed.

## Acceptance proof register

All runtime rows use `tests/api/postmark-custody.test.mjs`, test name “COMM-015 points 1–8: Owner-only Postmark custody survives restart, refuses unsafe callbacks and applies replay once”. Commands enter authenticated native `/api/glove/commands`; callbacks enter `/api/glove/mail/events`; state, Activity and business export are read through their HTTP doors. SQL reads inspect durable evidence and never seed custody state. The only substituted Postmark behavior is its outbound network edge. Worker disposal and recreation retain the real disk-backed D1 installation.

| Item | Exact evidence | Observed local result |
| --- | --- | --- |
| Acceptance 1: HTTPS Basic user glove, 32 random bytes, first response only | Focused journey lines 43–65, 85–103; secret projections lines 25–36; browser email journey Postmark connection, hidden after reload | PASS: 64 hex password shown once, replay omits it; Office, Dispatcher and scoped Owner connect and rotate are refused without writes; malformed headers, other username and wrong passwords are refused |
| Acceptance 2: hash-only custody and constant-time comparison | Focused journey lines 67–73, 98–103, 134–147; production `src/glove/mail-callbacks.ts` uses SHA-256 and `timingSafeEqual` | PASS runtime: independently computed current and previous hashes match storage after actual restart, cleartext absent, supported password succeeds and unsafe password fails; constant-time primitive verified by source inspection |
| Acceptance 3: exact overlap, revokePrevious and disconnect | Focused journey lines 127–155 and 206–215 | PASS: old password works at 23:59:59.999, fails at exactly 24:00:00.000, current remains accepted; immediate revokePrevious ends overlap; both active credentials succeed before disconnect and both fail immediately and after restart |
| Acceptance 4: secret-free attributable facts | Focused journey lines 176–191 and helper lines 25–36; `assertTrail` verifies Activity and exported timeline | PASS: rotate, revokePrevious and allowlist retain Owner identity, action and time; plaintext and encoded credentials absent from state, saved outcomes, Activity, export and captured Worker warnings |
| Acceptance 5: optional dated allowlist | Focused journey lines 91–94 and 157–174; dated provider reference in `src/glove/mail-callbacks.ts` | PASS runtime: off initially, missing and unlisted IP fail closed when enabled; listed IP cannot replace Basic; option survives reconnection and restart; explicit disable restores password-only acceptance; source date and reference inspected |
| Acceptance 6: plain HTTP rejected with no write | Focused journey lines 105–106, refusal helper lines 13–22 | PASS: valid Basic over HTTP is refused and complete durable business-table snapshot stays unchanged |
| Acceptance 7: replay identity and seven-day age fence | Focused journey lines 108–125, 193–204 | PASS: same Postmark ID across different RecordType events remains distinct; events with and without ID apply once before and after restart; over-seven-day event fails without write and exact seven-day boundary succeeds; authenticated replay after customer erasure resurrects nothing |
| Acceptance 8: delivery metadata | Focused journey lines 76–82, invoked for every send in the journey | PASS: each observed Postmark POST carries Metadata.glove_delivery_id equal to its actual message ID |
| BASE-AUDIT-001 inherited duty | Focused journey lines 176–191 and public Activity and export doors | PASS: secret-free attributable facts retained in both projections |
| BASE-MAIL-001 inherited duty, bounded to this clause | Focused and preserved email API journeys; preserved browser email journey | PASS locally: real command and callback processing, synthetic provider edge only; no live-provider claim |
| BASE-OPS-003 inherited duty | Focused journey lines 54–61, 96–125, 129–147 and 193–204 | PASS: command replay reveals no password, event replay and erased-data replay have no second durable effect |
| BASE-OPS-004 inherited duty, bounded to this clause | Refusal helper lines 13–22; genuine captured rejection warning line 190; preserved email outcome journey | PASS: unsafe callbacks are visibly refused and changes nothing; wider outcome ordering remains COMM-010 |
| BASE-SECRET-001 inherited duty | Focused journey lines 25–36, 67–73, 176–215; actual archive in `tests/portable.mjs` lines 227–228, 319, 328–333 | PASS focused journey; archive result recorded below separately |

Exact-head runtime and timing receipt: `RUNTIME-RECEIPT.json`, with actual TAP output `candidate-custody.log`. It ran on Node 22.20.0 on the committed candidate, outside push Verify. The deterministic request clock advances across the exact 24-hour boundary and survives actual Worker restarts. No real-day wait or live provider timing is claimed.

Preserved email API proof: `api-tests.log`, seven tests passed (six existing email flows and the focused custody journey). The strengthened journey additionally passed in `custody-strengthened.log`, and passed again on the exact candidate in `candidate-custody.log`. No existing assertion was removed, narrowed, skipped or put behind a width or branch condition. The continuation adds no new test registration; it retains the prior focused registration and strengthens it.

Browser proof: `tests/browser/email.spec.ts` passed once, testing both 1440 and 390. Screenshots mask secret outputs. Relevant Postmark connection, rotation, allowlist and verified-event screenshots are selected for the evidence packet. Browser source, UI source, command source and provider fake bytes are identical to the exact candidate; only the focused API test and lock were subsequently changed.

## Public-door probes

PROBE COMM-015 1: Owner mail.connect and identical command replay, plus excluded-role connect and rotate -> first response contains 64 hex password; replay omits it; unsafe roles receive FORBIDDEN with unchanged custody.
PROBE COMM-015 2: authenticated callback and durable hash inspection after Worker restart -> matching SHA-256 retained; current credential accepted; malformed and wrong Basic refused with unchanged records.
PROBE COMM-015 3: mail.callback rotate, pinned clock to one millisecond before and exactly at 24 hours, revokePrevious and disconnect -> exclusive expiry and immediate revocation of both active credentials, preserved across restart.
PROBE COMM-015 4: Owner rotate, revokePrevious and allowlist, followed by Activity and business export -> attributable secret-free actions; no plaintext or encoded Basic credential in saved outcomes or captured logs.
PROBE COMM-015 5: callback with missing, unlisted and listed source IP, with and without Basic, then reconnect -> default off, enabled option fails closed and remains enabled across reconnect and restart.
PROBE COMM-015 6: plain HTTP POST with valid Basic -> 401 and unchanged durable snapshot.
PROBE COMM-015 7: callbacks with provider ID, without ID, same ID across event kinds, old event and erased-customer replay -> distinct legitimate events apply once; duplicate and erased-data replays change nothing; over-seven-day event refused.
PROBE COMM-015 8: explicit email.send through the real command door -> every observed Postmark request carries its message's delivery ID in Metadata.

## DONE riders

| Rider | Result and evidence |
| --- | --- |
| 1 | Local behavioral PASS for all eight acceptance rows above; final acceptance requires the exact-head Verify result recorded below. |
| 2 | PASS: populated messages, actual allowed and unsafe credentials, complete durable snapshots and erasure; focused journey lines 85–215. |
| 3 | PENDING exact-head Verify 42484816075, push event. The focused journey is loaded by the maintained test glob in api-1; the unchanged email browser journey is loaded by the maintained browser partition. No workflow edit or opt-in flag. |
| 4 | PASS: focused runtime rerun on the exact committed candidate. Browser and archive relevant bytes unchanged; comparison against candidate confirms relevance. |
| 5 | PASS: COMM-015 cites all five Base duties in its meta line; inherited-duty rows above name their bounded evidence. |
| 6 | PASS mechanically: write and check succeeded, generated files restored from main; all judgment cells untouched. Lander owns final Evidence and count updates. |
| 7 | PASS: no acceptance sentence, coverage mapping or ruling text changed. |
| 8 | PASS: Owner succeeds; Office, Dispatcher and branch-limited Owner connect and rotate are refused without any durable change. |
| 9 | PASS boundary: Postmark network fake only; no provider-account acceptance, live delivery, legal or compliance assertion. |
| 10 | PASS: no new custody or authority policy default adopted; existing clause semantics preserved. |
| 11 | PENDING fleet guarded landing: main equality, candidate-main Run site and complete full-history publication scan remain fleet duties. Main is not advanced by this cloud task. |

## Mechanical and publication custody

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses COMM-015 then check exit=0; ledger=none exit=0.

`MECHANICAL.json` records four actual exact-head checks and their output hashes: source lock, contract views, typecheck and first-party check, all exit 0. Source lock was regenerated last after merge and the final test edit. No migration changed. Generated ACCEPTANCE.md and docs/CLAIMS.md equal main whole; CONTRACT.md has no diff against main. No fixture literal with an email address was introduced; added fixture code inherits existing addresses already on main. No generic owner and repo prose token was introduced in changed product lines.

Exact-head publication scan: commit=3810d9fd5c36068b24b8d6a2f17b7bbbfaadb6ef complete=NOT_RUN historyScanned=NOT_RUN findings=NOT_ESTABLISHED. Cloud adaptation delegates that scan to the Mac lander; no COMPLETE or zero-findings result is claimed. Full Git history is retained for fleet scanning. Every product push used the fleet guard, fleet identities and active commit hooks. No force push, default-branch push or history rewrite of a published commit occurred.

Baseline main 3a6b0e410f4b2744b7c0d293a71c9cae4d3113d2 has green Verify 42484401120 (also branch Verify 42483356314) and green Run site 42484401135. Those runs do not prove the candidate. Candidate main equality is pending landing. No PR is required by this repository's push Verify entry point; none was opened.

## Runtime and CI completion

Final actual results and terminal disposition are appended below after the remaining owned processes finish. No local command is left pending at handoff.

Test inventory: baseline 124 and candidate 125 direct API registrations; Playwright lists 45 cases in 23 files. This continuation adds no registration beyond the requested prior focused custody test. It retains the existing email API, email browser and portable assertions whole.

Prior red-run diagnosis: Verify 42482616582, failed browser-4 job 128737775128, original SHA 3041ce39fb8a867522c4b3cac85402ba32d3ff83. The recorded failure was `tests/browser/journey.spec.ts:154`, `expect(jobIds.has(mine.id)).toBe(true)`, Expected true, Received false. The failing command was `node scripts/verify-ci.mjs browser-4`, with CI=true, GLOVE_VERIFY_SHARD=browser-4 and GLOVE_CI_PREBUILT=1 after building the original SHA. This exact shard was run once on that SHA on Node 22.20.0 in the cloud, with system Chromium as required by the adaptation: all 14 tests passed, exit 0 (`prior-reproduce.log`). The failure did not reproduce; no CI repair was attempted. Timing is consistent with crossing the Sydney local-date boundary during the original run, but that remains a diagnosis, not a proven root cause. A same-runner main journey check is recorded separately. No real nonzero reproduction exists, so no VERIFY_REPRODUCED receipt is fabricated.

Main comparison: the same MONEY-002 journey on main 3a6b0e410f4b2744b7c0d293a71c9cae4d3113d2 passed at both widths on the same cloud runner, Node 22.20.0, exit 0 (`main-browser-journey.log`). This confirms no reproduced candidate-specific browser failure.

Pre-READY self-check: (1) all named behaviors have public-door runtime assertions on populated data; exact-head Verify is still recorded separately; (2) no existing assertion removed or narrowed; (3) revoked, expired and disconnected credentials are refused, and customer erasure plus authenticated replay after Worker restart resurrects no personal data; (4) no UI code changed, preserved email screen proof passed at 1440 and 390 with masked secret outputs; (5) source lock and generated-contract check passed, new product lines introduce no literal email address, and scan plus candidate-main Run site remain explicit fleet gates. No real product blocker has been found.

Actual archive result: `node tests/portable.mjs` exited 0. The installation export and fresh import, exact retained records, timeline and original bytes, Postmark password and hash exclusion, refused old callback, old-session refusals, later-erasure journal, and the existing payment custody journeys all passed (`portable.log`). All locally started browsers and runtimes have closed, and both auxiliary worktrees have been removed.

Candidate Verify 42484816075 remains in progress as of the most recent allowed REST poll. It is a push event on 3810d9fd5c36068b24b8d6a2f17b7bbbfaadb6ef. No candidate failure has been observed. Fleet publication scanning and guarded landing remain pending, with no candidate-main equality or Run site claim. No behavioral gap remains in the eight native COMM-015 acceptance points.
