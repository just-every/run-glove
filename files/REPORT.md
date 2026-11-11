# sx-glove-c-f255-pc1 results

Repository: just-every/run-glove. Product branch: cloud/sx-glove-c-f255-pc1.
Product head: f0937b4f1bf4a1bafc48de2a2b44a2d859375766. Merged main: 14d10155020b230c5cba59aa9f78be5185b7e0fa.
Published candidate required and verified: bca70d3c98a6ae2f9cd31847e337afe8ec0cb0c2.

## Plan and implementation

PLAN.md contains the complete execution plan. The named branch starts at the verified published candidate. Merge main without rebasing or rewriting published history. Both conflicting import additions and both scenario additions were kept verbatim. An independent line-order check confirms every nonblank line from each parent's flows.test.mjs remains in sequence. No test was deleted or weakened. No migration collision exists. The optional shard re-plan is absent from the merged main, so main's workflow and portable suite remain as main has them.

CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and docs/contract/ID-MAP.json are byte-identical to merged main. Contract generation with --clauses PAY-010 PAY-012 wrote zero documents and its check passed. Main's generated views were restored. Setup made a generated route-tree whitespace change, which was restored before regenerating sources.lock.json last. The final source lock check passed.

The delta from main is exactly sources.lock.json, tests/api/flows.test.mjs (+222 lines), and tests/fixtures/statement-journey.mjs (+118 lines). The original candidate's CLAIM lines and clause claims are unchanged. The merge commit has both required parents and has no skip-ci directive.

## Validation

- The documented non-interactive rer setup completed, including production build, D1 migrations and first-owner preparation. Its raw private log stays outside the public packet.
- pnpm typecheck passed once. The provided toolchain shim selected pnpm 10.12.4; direct Node is v24.19.0 and rer selected its pinned Node 22.20.0.
- The touched non-browser test command, cloud_run node --test --test-concurrency=1 tests/api/flows.test.mjs, passed once: 9 tests, 9 passed, 0 failed, 0 skipped; duration 76.297 seconds. It executed PAY-010's seven scenarios and main's five PAY-012 scenarios.
- Local browser and portable suites were skipped as the brief explicitly requires; CI runs the required suites.
- Both parent versions register 9 tests. Main has 11 direct scenario calls; candidate and merged versions have 17. Main's unbilledReminderPoints(t) call and fixture are retained.
- git diff --check and the four main-equality checks passed. All four candidate commits (including published side parents) passed the identity and trailer audit. New work uses explicit fleet author and committer variables; original repository hooks remain active.
- The product push succeeded on the first guard attempt. Product worktree is clean. No PR was required or created for this direct branch handoff; main was not pushed.

## Counts and clause status

Compared with the old published candidate's generated counts, the merge preserves main's newer judgments: Core 43 done / 178 partial / 16 missing becomes 45 / 176 / 16, total 237. Agent surface remains 0 / 13 / 13, total 26. Full target 43 / 191 / 29 becomes 45 / 189 / 29, total 263. Relative to current main all counts are unchanged. PAY-010 remains partial, with its Status, Gap and Evidence row unchanged. No clause was promoted by this task. Inherited main status changes: BOOK-017 partial → done, QUOTE-002 partial → done. These were already on main and were not judgments made by this task.

## CI and custody

The product branch is pushed at f0937b4f1bf4a1bafc48de2a2b44a2d859375766. Exact-SHA Verify run 42989731892: completed/failure. URL: https://github.com/just-every/run-glove/actions/runs/42989731892. GitHub calls used: 9/10. All CI observations are in ci-receipt.json and github-call-*.txt; github-calls.json records the bounded call ledger. The initial short-SHA discovery returned no run and supplied no workflow outcome; every subsequent observation used the full pushed SHA or that exact run ID.

The public-safe packet is published separately to evidence/sx-glove-c-f255-pc1 after checks complete. It is evidence transfer only, not acceptance, landing or product readiness. The fleet's independent publication scan remains a Mac responsibility and was not claimed here.


## Final CI result and blockers

Verify 42989731892 completed with failure on the exact pushed head. Successful jobs: plan, build, foundation, api-1, portable, browser-2, browser-3 and browser-4. Full-push-proof and nightly-proof were skipped; no readiness is claimed.

- Job 130419643032, shards (browser-1): arrival-windows.spec.ts:10:1 (Arrival promises survive desk booking and reload and appear on the assigned technician phone) exceeded 240000 ms; cleanup then reported browserContext.close: Target page, context or browser has been closed at harness-route.ts:80. The shard reports 13 passed and 1 failed. The returned archive has no more precise failing assertion before this timeout.
- Job 130419643016, shards (api-2): cancelled after 17m17s (08:47:27Z to 09:04:44Z), against a 17-minute configured job timeout. Its single gh run view --log-failed invocation succeeded with empty output, so there is no failed assertion to report from that archive.
- Job 130427289958, verify: the aggregate rejected the selected coverage because the required shards did not all succeed; the failed step exited 1.

Each failed/cancelled job archive was requested once with the mandated gh run view command. Nine of ten GitHub calls were used. Archive reads succeeded; no redirected blob retries were attempted. Public receipts include actual failure excerpts and exact command/exit/byte-count receipts. Full archive output remains outside the public packet because workflow headers contain environment dumps, which are excluded from publication.

The failing browser test, browser route harness and verification workflow are byte-identical to the merged main. This task does not establish whether main's own run has the same failure. The explicit brief requires a merge-only candidate, forbids local browser/portable runs here, and requires reporting a red Verify. No unrelated test rewrite, timeout increase, test weakening or CI rerun was attempted. The source lock and touched local checks remain valid; product work stays safely pushed and the product checkout is clean. No push was rejected, so no push-rejection rescue bundle was required.

Final custody: BLOCKED on exact-SHA Verify 42989731892: browser-1 job 130419643032 timed out; api-2 job 130419643016 was cancelled; aggregate job 130427289958 failed. Product branch cloud/sx-glove-c-f255-pc1 remains pushed at f0937b4f1bf4a1bafc48de2a2b44a2d859375766. No PR was created or required. The separate evidence transfer is not a READY signal.
