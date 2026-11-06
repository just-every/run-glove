# sx-glove-ci-critical-path-2 — diagnosis and stop receipt

Repository: just-every/run-glove

Disposition: BLOCKED. This continuation found an existing Node 22.20.0 native Request.clone finalization failure on unchanged main. The same voice-flow assertion fails under a controlled native-GC lifecycle trigger, independently of the workflow split. The continuation explicitly assigns main flakes to fv and prohibits product, runtime and test changes, so no workflow-only repair was invented and no new product commit or push was made. There is no READY claim.

Terminal local branch: cloud/sx-glove-ci-critical-path-2
Terminal HEAD: e962e91404dfc03be3f59c199567b7b21e50986c (the previous round's published head, not a new candidate)
Current fetched main: aa2311479f2fbe347f9204bfe297341deee3e035
Retained diagnostic integration: d1a44d850a68bbbe646543cb1eb49a05e71b03e0
PR: none created. The new product branch was not pushed; only evidence is published.

## Plan and execution

1. Apply the fleet identity, refresh the launcher's decrypted bundle, install the Git helper, push guard and clone-local co-author hook; read launcher AGENTS.md, repo AGENTS.md and the inline RULES.md. Read the cloud runtime skill and inspect the supported network policy. Only just-every/run-glove was cloned. No lane INBOX.md or STATE.md was read or written.
2. Start a shallow filtered clone on current main. Inspect recent Actions runs for an active writer, then fetch the two exact diagnostic branches. The repository's latest 100 runs contained no non-completed run and no newer CI critical-path writer. This is a repository observation, not a claim to have read the unavailable fleet live-process registry. All newer-run custody decisions are in custody-and-runs.json.
3. Create cloud/sx-glove-ci-critical-path-2 from previous head e962e91404dfc03be3f59c199567b7b21e50986c and rebase onto fetched main; Git reported already up to date. No prior published history was rewritten. The previous branch contains only verify.yml, verify-app.mjs, verify-ci.mjs, verify-progress.mjs and its source lock, with no retained API-001 product delta.
4. Read the previous failed API job once, obtain its run's job/step timestamps, and compare the failing test source with main. Run the exact failing test on main under CI's exact Node version; run its unchanged main file to examine intra-file ordering; compare the previous branch with its shard environment. All ordinary probes passed. Diagnose the native Request lifecycle with a temporary external script, then reproduce that failure on unchanged main by advancing native garbage collection in the owned process. No repository test, assertion, Request implementation or provider behavior was replaced or patched.
5. Stop product work under the continuation's main-flake rule. Run bounded local validation, regenerate the documented source lock last (no delta), and publish these actual reports/receipts on evidence/sx-glove-ci-critical-path-2 only. No full local verify, full suite, browser run, rer setup/build, CI dispatch, CI rerun, empty commit, test retry mechanism or product push was performed.

Cloud adaptation: the dedicated Linux cloud VM replaces heavy-slot/win-runner. This is not a receipt from the fleet's named win-runner. The supplied toolchain was sourced in fresh checkout shells. Because the helper permits the newer VM Node 24, each diagnostic explicitly put npm's exact node@22.20.0 runtime first on PATH. Receipts report v22.20.0. No held provider keys were required. The loader helper read GH_TOKEN only from the prescribed decrypted bundle for each gh command; credentials and environment dumps are excluded from the packet.

## Measured failure diagnosis

Previous exact-SHA Verify 42247502459, attempt 1, at e962e91404dfc03be3f59c199567b7b21e50986c failed. Job shards (api-2), id 127993859795, reported at 16:01:52Z:

- Test: COMM-009, COMM-028 signed known-customer calls route in order and retain outcomes; Owner explicitly texts one consented booking reply.
- Error: TypeError: unusable, ERR_TEST_FAILURE.
- Stack: _Request.clone (node:internal/deps/undici/undici:9968:17), tests/api/voice-flow.mjs:153:43.
- API-2 final totals: 96 tests, 95 pass, 1 fail, 0 skipped, 0 cancelled. The complete test-output portion of the actual archived failed step is retained; its Actions environment preamble was excluded from the public packet.

The entire tests/ tree is identical between main and the previous branch. voice-flow.mjs SHA-256 is e4a91d569bd4739789e82537a10405152738537e90d6709e280442159873f610 on both. Node's test runner keeps file isolation and --test-concurrency=1 in both the unsplit and split API commands. The extra GLOVE flags only select orchestration; this API harness compiles its production worker directly and does not read the shared dist build. No new CI environment dependency or source delta explains a retained Request becoming unusable.

The exact Node 22.20.0 bundled Undici implementation registers an internal cloned request state with streamRegistry, holding a WeakRef to out1, the branch assigned back to the retained original body's stream. After the consumed clone becomes unreachable, its finalizer can cancel that retained original stream. A minimal external native probe reads request.clone().text(), observes original.bodyUsed=false, calls global.gc(), waits for native finalizers, observes original.bodyUsed=true, and gets the exact _Request.clone error at internal line 9968 on the next clone. It uses no Glove code or provider mocks.

Actual comparisons:

| Source / diagnostic | Result | Elapsed |
| --- | --- | ---: |
| Main, single original voice-flow test, normal execution | 1 pass / 0 fail | 4.749 s |
| Main, full unchanged reminders.test.mjs, normal execution | 8 pass / 0 fail | 43.171 s |
| Previous branch, same single test with shard environment | 1 pass / 0 fail | 5.169 s |
| Main, unchanged single test with external 500 ms native-GC cadence | 1 pass / 0 fail | 5.540 s |
| Main, unchanged single test with external 50 ms native-GC cadence | 0 pass / 1 fail, TypeError: unusable | 5.154 s |

The controlled main failure is at voice-flow.mjs:44:43, an earlier reuse of an original Request, with the identical internal Undici line, error name and message. It is not the same source line as the CI failure at :153. Native finalization timing determines which reused request fails first. This establishes that the native failure mechanism exists on main; it does not claim an ordinary unmodified main run failed in this VM, nor prove which precise object was finalized in the historical CI process. The normal main and previous-branch passes are retained alongside the controlled failure. No green CI claim is inferred from these probes.

Read command for original browser job: gh run view 42234771269 --repo just-every/run-glove --job 127949505404 --log-failed. It exited 0 with zero stdout bytes because no failed-step log was returned for the cancelled job; it was not retried. The original 15-minute cancellation/no-output observation is the supplied disposition, not a newly recovered log or proof of lost-runner infrastructure. That run remains cancelled and unqualified.

## Before/after counts and executed coverage

This continuation changes zero product files, adds zero product commits, adds/deletes/skips/weakens zero tests and assertions, changes zero clause statuses and creates zero PRs or CI runs. The local new branch points to the prior published head. Main had 4 push shards; the previous round split them to 8. This round remains at those 8 without a new product publication. Both have 51 API files and 20 browser spec files. Browser journeys, their viewport assertions, names and maintained command inventory remain unchanged. All generated contract views remain unchanged. Full-target counts remain 7 DONE / 227 PARTIAL / 29 MISSING out of 263. No clause acceptance, source acceptance, product acceptance or hold release is granted.

The previous run's 8 shard jobs completed with 7 success and 1 failure. All four browser shards passed. Its workflow ran from 15:55:13Z to aggregate completion 16:05:52Z: 639 s (10m39), above the 10-minute target. The longest shard job was portable at 588 s (9m48), mean 328.125 s (5m28.125), ratio 1.792, above 1.5. Its actual command took 567 s (9m27). No timing improvement is claimed for this round. Job API timestamps are second-resolution; they include runner setup and post steps separately from the measured shard command.

| Previous job | Job seconds | Command seconds | Result |
| --- | ---: | ---: | --- |
| shards (api-1) | 402 | 374 | success |
| shards (foundation) | 84 | 55 | success |
| shards (browser-1) | 164 | 136 | success |
| shards (portable) | 588 | 567 | success |
| shards (browser-3) | 401 | 370 | success |
| shards (browser-4) | 314 | 274 | success |
| shards (browser-2) | 268 | 238 | success |
| shards (api-2) | 404 | 376 | failure |

## Complete check-to-job mapping

There is no new after-state change in this round. The following maps the maintained current-main checks to the inherited previous branch and terminal local state. Full file selections and exact shell commands are also machine-readable in check-job-mapping.json.

| Main check | Prior/terminal execution owner |
| --- | --- |
| Reusable workflow permission validation and coverage planning | plan, unchanged; canonical readers retained for light coverage |
| Source-lock freshness | build and every shard; retained |
| Generated contract-document consistency | foundation; retained |
| pnpm frozen dependency install | build plus every shard; retained |
| Production pnpm run build | once in build; exact run/attempt artifact downloaded by shards; nested setup/restore journey builds retained |
| pnpm run check --profile first-party | foundation, unchanged |
| pnpm run typecheck | foundation, unchanged |
| tests/runtime.mjs | foundation, unchanged |
| tests/email-link.mjs | foundation, unchanged |
| tests/site.mjs | foundation, unchanged |
| RER hosted-output and hydration proof | exactly one hosted foundation shard, unchanged |
| tests/api/*.test.mjs | all 51 files split once across api-1 (26) and api-2 (25); file isolation and serial per-job execution retained |
| tests/portable.mjs | portable, unchanged, including its actual builds/setup/restore assertions |
| tests/browser/run.mjs | all 20 specs split once over four jobs with 5 specs each; journey and routing remain together in browser-3 |
| Chromium install, launch probe, apt-on-probe-failure, disk reservation | retained on browser-marked jobs |
| Reviewed readers, source lock, rer check and site build for light diffs | light, unchanged; selected only by maintained planner rules |
| Full push coverage proof | full-push-proof, executed only after selected shard success; skipped on failed prior candidate |
| Scheduled complete nightly proof | nightly-proof, unchanged; no nightly shards currently declared |
| Final selected-coverage gate | verify, unchanged; prior run correctly failed |
| Branch/PR triggers, main isolation, superseded branch concurrency | unchanged |

Exact inherited file partition:

### foundation

- `pnpm run build`
- `pnpm run check --profile first-party`
- `pnpm run typecheck`
- `node tests/runtime.mjs`
- `node tests/email-link.mjs`
- `node tests/site.mjs`

### api-1

- `pnpm run build`
- `node --test --test-concurrency=1 'tests/api/agreements.test.mjs' 'tests/api/branches.test.mjs' 'tests/api/companycam.test.mjs' 'tests/api/costing.test.mjs' 'tests/api/customer-quotes.test.mjs' 'tests/api/delays.test.mjs' 'tests/api/documents.test.mjs' 'tests/api/email.test.mjs' 'tests/api/expenses.test.mjs' 'tests/api/forms.test.mjs' 'tests/api/margins.test.mjs' 'tests/api/money.test.mjs' 'tests/api/movein.test.mjs' 'tests/api/options.test.mjs' 'tests/api/payroll.test.mjs' 'tests/api/pricebook.test.mjs' 'tests/api/purchasing.test.mjs' 'tests/api/quickbooks.test.mjs' 'tests/api/recurring-billing.test.mjs' 'tests/api/reports.test.mjs' 'tests/api/rules.test.mjs' 'tests/api/segments.test.mjs' 'tests/api/service-reports.test.mjs' 'tests/api/stock.test.mjs' 'tests/api/suggest.test.mjs' 'tests/api/xero.test.mjs'`

### api-2

- `pnpm run build`
- `node --test --test-concurrency=1 'tests/api/assessments.test.mjs' 'tests/api/callbacks.test.mjs' 'tests/api/conversation.test.mjs' 'tests/api/csv.test.mjs' 'tests/api/customers.test.mjs' 'tests/api/discounts.test.mjs' 'tests/api/eligibility.test.mjs' 'tests/api/equipment.test.mjs' 'tests/api/flows.test.mjs' 'tests/api/grants.test.mjs' 'tests/api/merge.test.mjs' 'tests/api/morning-brief.test.mjs' 'tests/api/nameplates.test.mjs' 'tests/api/payments.test.mjs' 'tests/api/pipeline.test.mjs' 'tests/api/privacy.test.mjs' 'tests/api/push.test.mjs' 'tests/api/records.test.mjs' 'tests/api/reminders.test.mjs' 'tests/api/routing.test.mjs' 'tests/api/security.test.mjs' 'tests/api/series.test.mjs' 'tests/api/servicecall.test.mjs' 'tests/api/subcontract.test.mjs' 'tests/api/tokens.test.mjs'`

### portable

- `pnpm run build`
- `node tests/portable.mjs`

### browser-1

- `pnpm run build`
- `node --import ./scripts/verify-progress.mjs tests/browser/run.mjs 'tests/browser/branches.spec.ts' 'tests/browser/discounts.spec.ts' 'tests/browser/email.spec.ts' 'tests/browser/morning-brief.spec.ts' 'tests/browser/recurring-billing.spec.ts'`

### browser-2

- `pnpm run build`
- `node --import ./scripts/verify-progress.mjs tests/browser/run.mjs 'tests/browser/companycam.spec.ts' 'tests/browser/dispatch-map.spec.ts' 'tests/browser/invoice-batch.spec.ts' 'tests/browser/movein.spec.ts' 'tests/browser/reminders.spec.ts'`

### browser-3

- `pnpm run build`
- `node --import ./scripts/verify-progress.mjs tests/browser/run.mjs 'tests/browser/custom-roles.spec.ts' 'tests/browser/documents.spec.ts' 'tests/browser/journey.spec.ts' 'tests/browser/quickbooks.spec.ts' 'tests/browser/routing.spec.ts'`

### browser-4

- `pnpm run build`
- `node --import ./scripts/verify-progress.mjs tests/browser/run.mjs 'tests/browser/customer-quotes.spec.ts' 'tests/browser/due-visits.spec.ts' 'tests/browser/money.spec.ts' 'tests/browser/receivables.spec.ts' 'tests/browser/service-reports.spec.ts'`

The main command inventory remains verification.json: foundation, api, portable and browser, with no nightly entries. The partition is a CI-only transformation. verify-progress.mjs observes buffered child phases and restricted Playwright result lines; it changes no assertion, timeout, exit code or cleanup. No timeout, retry, mock, test gate or success fallback was added in this continuation.

## Local validation and limitations

All seven actual checks in validation-receipt.json exited 0: pnpm typecheck; verify-ci.mjs --check-workflows; node --check for verify-ci, verify-app and verify-progress; contract-docs check; edition-authoring check. Typecheck took 14.126 s. PyYAML also parsed verify.yml successfully. A separate actionlint attempt through the VM's go command was unavailable: `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/verify.yml` returned `Go: Unknown option: run`. This is not represented as passing actionlint. No workflow was changed.

Last source-lock action used the documented `node scripts/edition-authoring/cli.mjs lock`, then check; both succeeded and produced no tracked delta. CONTRACT.md and its generated views were never edited or committed. Identity inspection of every inherited candidate commit showed fleet author and committer, with no trailers. No new product push was attempted; no push rejection or unfinished product change needs rescue. The cloud cannot perform the Mac's complete full-history publication and landing scans. No such scan, exact-final Verify or landing qualification is claimed.

GitHub budget: four logical read commands, no polling watcher. Initial recent runs; the failed API job archive; prior-run jobs/timestamps; the cancelled original browser job's empty failed-log selection. No new CI run was requested and no old CI green was relabeled. No site or landing wait occurred.

## Return to sx / fv

Route the existing native Request.clone lifecycle flake to fv. A separate authorized source/runtime decision can repair the reusable native request fixture or its pinned runtime while keeping every replay assertion. This brief cannot change either. After that repair, resume the orchestration work against fresh main and requalify its exact final SHA. Portable timing and the 1.792 longest/mean ratio also remain unresolved; do not claim the ten-minute target or final coverage on the current red head.

The CI-only source from the previous round could be applied to the retained original integration only through the fleet's separate integration and source-lock process, followed by exact-final executed qualification. No new repair is supplied by this stopped round. The retained d1a44d850a68bbbe646543cb1eb49a05e71b03e0 integration remains genuinely BLOCKED. Original technical/Opus receipts, full PARTIAL Gap/status, rejected-head/134hold snapshot, C/D follow-ups and all holds remain unchanged. No API-001 delta was carried onto main.

Evidence is report-only and is not READY, product acceptance or landing evidence. Complete actual receipts accompany this report; source-comparison-receipt.json distinguishes ordinary probes from controlled native-lifecycle diagnosis. The product clone remains clean until evidence publication, then it can be removed under the task's cleanup rule because there is no new unpushed work.
