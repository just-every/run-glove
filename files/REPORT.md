# sx-glove-ci-critical-path-1

Repository: just-every/run-glove
Product branch: cloud/sx-glove-ci-critical-path-1
Final candidate: e962e91404dfc03be3f59c199567b7b21e50986c
Base main: aa2311479f2fbe347f9204bfe297341deee3e035
PR: none; this repository's supplied landing contract uses the fleet Mac lander.
First candidate exact-SHA Verify: 42244929095 — https://github.com/just-every/run-glove/actions/runs/42244929095 (failure on ac5891e38f93a12996ac24a22ef83c6bc55a6819). Final head Verify: not queried, budget exhausted.
Terminal status: PUSHED. Final exact-SHA Verify and final wall time are unobserved; no READY claim. See terminal-receipt.json.

## Plan and scope

1. Bootstrap the fleet identity, decrypted-bundle credential helper, preserved commit hooks and push guard. Clone current main shallow with blob filtering, read repository instructions, and check recent runs/open PRs for a newer live owner of this CI scope.
2. Fetch retained integration d1a44d850a68bbbe646543cb1eb49a05e71b03e0 for diagnosis only. Inspect completed run 42234771269 and browser job 127949505404 once, derive exact timings, and trace the actual commands. Do not assume silence means lost infrastructure.
3. Repair only Verify orchestration. Preserve the maintained command inventory, every test file/name/assertion, browser widths, native setup/restore builds, hosted-output/hydration/agent-door checks, coverage proofs, concurrency, failure propagation and timeout/retry policy. Build the checkout production output once, split the long serial collections within eight shard jobs, and expose safe phase timings.
4. Run touched syntax/coverage checks and typecheck, plus focused runner probes; do not run a full local suite. Keep ordered journeys together, regenerate the documented source lock last, check it and preserve generated contract views.
5. Rebase on fresh main before the first candidate push. Commit with explicit fleet author/committer variables and active hooks. Inspect every candidate identity, trailer and message, then push only the named branch using cloud-push.py.
6. Run no dispatches or blind reruns. Watch the one exact-SHA Verify through REST with at least 300 seconds between calls and within the ten-call budget. Report measured wall/job times honestly, including any failure or missed target.
7. Publish the complete explicitly selected non-secret packet through the report-only evidence ref, emit the sx POST, and leave product acceptance/hold release/landing to the fleet.

## Custody and bootstrap

The recent 100 runs contained no active run; all were completed. The newest was the completed c-f35 landing Verify 42237222006, not a live CI writer. Four open PRs were older agent-door work, last updated 28–29 October. No newer live writer of this CI scope was identified from that repository-visible evidence. Fleet INBOX.md and STATE.md were neither read nor written.

Four clone attempts initially exited 128 with `Invalid username or token`; the fifth succeeded after the specified 15/45/90/150-second delays and bundle refreshes. No alternate credential was sought. clone-recovery.json records the actual outcomes. Global and local fleet identities were configured, repository commit hooks were preserved, and the supplied toolchain environment was used. Its outer Node was v24.19.0; native rer setup/dev selected the pinned Node 22.20.0. CI continues to explicitly use Node 22.20.0 and pnpm 10.12.4.

A preliminary evidence snapshot was inadvertently published while handling the completed clone recovery, before recognizing the fifth attempt's success. It is superseded by this final packet; no product publication or READY claim was made from it.

## Measured diagnosis

Retained integration run 42234771269 had the following actual job receipts:

| Original job | Job seconds | Run-this-shard seconds | Outcome |
| --- | ---: | ---: | --- |
| foundation | 98 | 69 | success |
| api | 679 | 653 | success |
| portable | 579 | 553 | success |
| browser | 915 | 883 | cancelled |

The browser command began at 14:32:48.083 with `pnpm run verify:app`, then built the application. Vite completed client output in 628 ms and SSR output in 1.34 seconds. `node tests/browser/run.mjs` began at 14:32:55.1727188. Its next log line was cancellation at 14:47:31.1028498: 875.93 seconds of silence inside the harness, after the build finished. The installer and browser probe had already passed before the shard command.

`tests/browser/runtime.mjs` captures every child stdout/stderr and returns it only after that child exits. `tests/browser/run.mjs` installs a fresh copy, builds the public site, runs real setup/dev and launches all browser tests with one worker. Thus a long suite or delayed failure is opaque until the entire Playwright command finishes. The unchanged manifest contains 44 registered Playwright cases across 20 spec files, including the large ordered journey file. The API command is independently over the ten-minute target at 653 seconds. This is an oversized serial critical path with missing phase visibility; the retained log alone does not establish a lost runner or identify which internal browser step consumed its silent interval.

Focused local measurement used the maintained runner and /usr/bin/chromium with its existing no-sandbox control:

- One unchanged branches journey passed: 11.1-second test / 13.6-second Playwright run, about 77 seconds for the complete fresh installation, runner and cleanup.
- An exploratory standalone phone journey failed because it reads a second technician created by the preceding desktop journey. This exposed an ordering dependency. The final candidate keeps explicit whole-file partitions; it does not enable fully-parallel or separate those two cases.
- The corrected ordered desktop + phone probe passed both cases. Desktop: 58.7 seconds. Phone: 36.4 seconds. Playwright process: 97,931 ms. Frozen install: 6,002 ms; site build: 2,448 ms; native setup: 32,181 ms. Native dev was stopped through the harness's owned PID and exited 143 as expected; the enclosing runner exited 0.

These are focused probes, not a full local browser-suite benchmark or exact-final CI qualification of the retained integration. See browser-ordered-journeys.log, browser-diagnostic.log and retained-timings.json.

## Complete before/after check-to-job mapping

| Check/command or gate | Before | After |
| --- | --- | --- |
| Reusable-workflow permission check and evidence/coverage plan | plan | plan, unchanged |
| Production `pnpm run build` for checkout output | repeated in each of four push partitions | build once; same run/attempt artifact restored to all eight shards; missing artifact/output fails |
| Source-lock check | every shard | build and every shard |
| Generated contract document check | foundation | foundation, unchanged |
| Frozen dependency install / rer install | direct frozen install followed by rer install (which invokes the same frozen install) | direct frozen install once in build and each shard; light unchanged; maintained native journeys retain all independent installs and assertions |
| Browser install / launch probe / conditional apt repair | browser and foundation | all four browser jobs and foundation, unchanged commands and failure policy |
| Runner disk reserve | browser and foundation | all four browser jobs and foundation, unchanged |
| First-party rer check, typecheck, runtime, email-link and site assertions | foundation | foundation, unchanged |
| Hosted production output, hydration and agent-door verification through `pnpm run verify` | foundation | foundation, unchanged; consumes shared production output |
| `node --test --test-concurrency=1 tests/api/*.test.mjs` | api: all 51 files | api-1: 26 files; api-2: 25 files, sorted alternating membership, disjoint exact union; concurrency remains 1 within each job |
| `node tests/portable.mjs` | portable | portable, unchanged, including every setup/export/import/restore build and assertion |
| `node tests/browser/run.mjs` | browser: all 44 tests | browser-1: 5; browser-2: 11; browser-3: 15; browser-4: 13, explicit whole-file filters, one worker per job; journey and routing co-located in their original relative order |
| Buffered harness progress | visible only when entire child completes | preload observes phase starts/exits and redacted Playwright result lines without altering commands, output capture, exit codes, cleanup, tests or timeouts |
| Reviewed light-reader selection and light build | light | light, canonical command inventory still supplies the existing reviewed dependency rules |
| Main/PR/nightly evidence reuse policy | plan / full-push-proof / nightly-proof | same policy; proof names use the actual eight-job CI plan |
| Final selected-coverage assertion | verify | verify, unchanged and executed; a failed build causes skipped required shards and fails this gate |
| Workflow concurrency/cancellation | existing workflow group | unchanged |
| Shard timeout / optional reusable-workflow timeout | 15 minutes / caller input | unchanged |
| Nightly/release obligations | maintained manifest | unchanged; no checks were moved off push |

coverage-mapping.json is the full machine-readable plan and exact registered browser-test membership. It asserts disjoint equality, not just matching totals. API files: 51 → 51. Registered Playwright tests: 44 → 44. Push shard jobs: 4 → 8. Root production builds: 4 → 1. Product tests added/deleted/renamed: 0/0/0. Assertion source changes: zero. No retry or timeout increase and no permanent test were introduced. Existing independent native installation builds remain because their behavior is part of the assertions.

## Changes, checks and provenance

Only these files changed: .github/workflows/verify.yml, scripts/verify-app.mjs, scripts/verify-ci.mjs, new scripts/verify-progress.mjs, and regenerated sources.lock.json. No product/runtime/test/migration/contract/UI source was changed. No API-001 delta was carried from the retained integration.

Passed locally:

- `pnpm typecheck` (exit 0).
- Node syntax checks for all three touched orchestration modules.
- PyYAML parsing of every workflow and `node scripts/verify-ci.mjs --check-workflows`.
- All four Playwright list-only partitions compared against the 44-test canonical inventory, with exact disjoint membership and intact ordered journey file.
- API command partition union compared against all 51 canonical API test files.
- Focused branches probe and ordered desktop/phone runner probe described above.
- Documented `node scripts/contract-docs.mjs write` then `check` (current and idempotent); generated views restored whole from origin/main; working tree clean.
- Documented `node scripts/edition-authoring/cli.mjs lock` run last after staging the new source, followed by its `check` (exit 0).
- Fresh-main rebase before the first push with explicit fleet commit environment and autostash; after publication, fetch/merge main (already up to date), never rebase published history; source-lock regeneration/check last. Main remained aa2311479f2fbe347f9204bfe297341deee3e035.
- Exact candidate scope/diff check and all candidate identities/messages/trailers. Two product commits, fleet author and committer on both, no co-author trailers. All candidate commits including all side parents were inspected before each push.

The attempted Go-based actionlint installation could not run because this environment's `go` is not the Go compiler (`Go: Unknown option: install`). No actionlint success is claimed; workflow YAML syntax, maintained permission validation and exact-SHA Actions execution provide the available validation. No full local suite, dispatch, rerun, paid API, main push, force push, release, tag or PR mutation was performed.

The first real commit and the substantial dependency repair were each immediately pushed through cloud-push.py on attempt 1. See product-push.log and product-push-final.log. Full-history publication scan, independent acceptance gates and landing remain the Mac fleet's responsibility; the cloud brief explicitly reserves those mechanisms to it.

## Retained integration and clause custody

The diagnostic workflow, maintained verification manifest and browser runner sources are identical between current base main and retained d1a44d850a68bbbe646543cb1eb49a05e71b03e0. An isolated-index `git apply --cached --check` proves this orchestration patch applies cleanly to the retained tree. That integration would need its own source-lock regeneration and exact-final executed qualification after applying it. This task does not integrate or accept its API-001 product delta.

Clause status changes: none. Clause acceptance claims: none. Original technical/Opus receipts, full PARTIAL Gap/status, rejected-head/134hold snapshot and C/D follow-ups remain. No product/source acceptance or hold release is granted. The original retained integration remains genuinely BLOCKED; an older green run is not substituted for its failed/cancelled run.

## Final CI, timing target and evidence

The first candidate ac5891e38f93a12996ac24a22ef83c6bc55a6819 completed Verify 42244929095 with FAILURE. Seven shards passed. Browser-4 failed at tests/browser/routing.spec.ts:46: the queued-route message was absent. The final coverage gate correctly failed and full-push-proof was skipped; no failure was hidden.

| First candidate job | Job seconds | Command seconds | Outcome |
| --- | ---: | ---: | --- |
| foundation | 138 | 98 | success |
| api-1 | 519 | 490 | success |
| api-2 | 304 | 275 | success |
| portable | 549 | 523 | success |
| browser-1 | 279 | 242 | success |
| browser-2 | 468 | 433 | success |
| browser-3 | 269 | 229 | success |
| browser-4 | 243 | 207 | failure, one routing assertion |

Measured workflow wall time: 610 seconds (10m10s), so the ten-minute target was missed. Longest shard / mean: 549 / 346.125 = 1.586, above the 1.5 balance target. The browser maximum fell from the cancelled 915-second job to a completed 468-second job; these are different workload distributions, and the failed assertion prevents a green qualification claim.

The new phase receipts show browser-4 frozen install 7,397 ms, site build 2,597 ms, setup 36,150 ms and Playwright 141,563 ms. It ran all ten assigned cases, reporting nine passes and the routing failure. The retained silence can now be separated into actual setup and assertion work; no lost-runner claim is made.

Root-cause follow-up: routing first opens the native app and latches its date, then forwards requests to a fixture in Australia/Sydney. In the original serial run, the earlier main journey configured that real installation's timezone. An isolated browser partition loses that prerequisite and can initialize a different calendar date. The final orchestration explicitly keeps journey.spec.ts before routing.spec.ts in the same installation, and still partitions every file exactly once. No UI, product or test assertion was changed. The focused original desktop → phone → routing sequence passed all three cases after grouping: about 1.0m, 36.5s and 5.1s respectively. See browser-routing-dependency.log.

The measured critical chain also performed duplicate frozen dependency installs: the pinned rer 0.2.87 install command invokes the same pnpm install --frozen-lockfile already run immediately before it. The final workflow removes that duplicate from build and shard setup while retaining the direct frozen install, every validation step and every native installer/restore assertion. The duplicate build and portable steps each measured six seconds. Final wall time and balance are UNMEASURED, not extrapolated as successes.

All ten allowed GitHub REST/log invocations are accounted for in github-api-ledger.json. The completed failed browser job's assertion archive was read once with the required gh run view --job ... --log-failed command. No paid API, dispatch, blind rerun, new permanent watcher or budget bypass occurred. Each pushed commit triggers its own ordinary full Verify once. The final head e962e91404dfc03be3f59c199567b7b21e50986c was pushed after the repair's local checks passed, but its exact-SHA run ID, outcome and timings were not queried because the budget was exhausted. This is PUSHED, not READY. The lane must require its own exact-final executed green Verify before any landing or original-integration qualification.

Actual packet: /home/agent/rer-consolidation/work/sx-glove-ci-critical-path-1/packet/. Evidence publication uses only refs/heads/evidence/sx-glove-ci-critical-path-1, separately from the product branch and readiness. The final evidence receipt supersedes the preliminary bootstrap snapshot.
