# sx-glove-c-f213-pc1 — run-glove continuation

Repository: just-every/run-glove
Product branch: cloud/sx-glove-c-f213-pc1
Required original candidate: a89509f061d4a643ee0e9733cc7186672ea2d2b7 (verified)
Merged main: e1d25590661c95f7f94041c395aa0c34b7b97e3a
SNS clock fix present on main: 643c6432 or later (the fetched main includes 643c643).

## Scope and plan

The complete execution plan is PLAN.md. Clone the declared repository only, preserve the published candidate, merge current main, regenerate and check contract documents, retain main's generated views, regenerate the source lock last, run typecheck and touched branch tests, make one real merge commit, audit every candidate identity/trailer, and push only the continuation branch. Apply exact-SHA Verify custody under the cloud adaptation. Publish reports separately on the evidence ref; the Mac lander independently gates and lands.

## Merge and clauses

The original candidate is not an ancestor of main and still contributes its browser and branch projection fixture changes. The merge was clean: no CONTRACT.md or ID-MAP conflicts, no migration collision or renumbering, no weakened/deleted test, no rebase, no force push and no empty commit. Main's entire CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and ID-MAP.json are preserved. Candidate test content is unchanged. The generated views have no difference from main and receive no builder edits.

Candidate before: 41 done / 193 partial / 29 missing, 263 total.
Merged after: 42 done / 192 partial / 29 missing, 263 total.
The sole inherited status change is COMM-001 partial → done, already judged on main. TEAM-004 remains partial in both source contracts. The previous TEAM-004 DONE claim for the specified slice is neither altered nor expanded; all original candidate commits and CLAIM lines are preserved in ancestry, and this continuation adds no CLAIM line.

## Verification so far

- Contract generator write --clauses COMM-001: passed, wrote zero documents; check: current.
- pnpm install --frozen-lockfile: passed using pnpm 10.12.4.
- pnpm typecheck: passed once. The supplied toolchain selected VM Node 24.19.0; pnpm printed the pinned-engine warning. Native setup uses the repository's exact cached Node 22.20.0.
- node --test --test-concurrency=1 tests/api/branches.test.mjs: passed once (1 test, 0 failures); all four TEAM-004 named scenarios ran, including the changed fixture.
- Native setup with inherited proxy settings: initial attempt and two targeted retries failed at the fixed 60-second listener-handshake deadline. Optimizing dependencies completed successfully. Direct Vite profiling located the wait before createServer completed. A local-server-only diagnostic with proxy variables cleared reached a listener before its external timeout; this is diagnostic evidence rather than a passed setup or browser test.

- Native setup with proxy variables cleared for the local-only command: passed with Node 22.20.0, all migrations applied, fixture owner claimed, owned runtime stopped.
- Source lock regenerated LAST after source/view restoration; node scripts/edition-authoring/cli.mjs check: passed. The complete actual lock write/check output is preserved in source-lock-write.log and source-lock-check.log.
- Both working-tree and staged git diff --check: passed.

- Browser: passed once via the documented fresh-copy runner, using pinned Node 22.20.0 and /usr/bin/chromium with --no-sandbox. One test passed; named Dispatch and Reports scenarios ran. Native install/setup/dev succeeded in the fresh installation, and its owned runtime and browser were closed. Browser proof produced 42 screenshots across 1440 and 390; four visually inspected Dispatch/Reports frames at 1440 and 390 are included with browser-proof-receipt.json. All other screenshots, including synthetic integration capabilities, remain outside the public packet.
- Identity/trailer audit: all 10 candidate commits (including side parents) passed the prescribed origin/main..HEAD scan; fleet author and committer on every one; no surviving OpenAI/Codex co-author.
- Product merge commit: 2d5dc9f08bc0479d2fcf975cb0747de1d60470b8. Parents are the required original candidate and e1d25590661c95f7f94041c395aa0c34b7b97e3a.
- Product push: succeeded on the first guard attempt, exactly one product push, only cloud/sx-glove-c-f213-pc1; no PR created or required by the repository instructions. Product checkout is clean.
- Delta from merged main: 3 files, 44 insertions / 14 deletions: the original branches browser test, branch-projections fixture, and their two source-lock entries. No other builder changes.

Exact-SHA Verify run 42640389256 (https://github.com/just-every/run-glove/actions/runs/42640389256) completed successfully for 2d5dc9f08bc0479d2fcf975cb0747de1d60470b8, observed at 2026-11-09T15:16:55.861530+00:00. The single watcher used 4 of the ten GitHub calls, with at least 300 seconds between calls. No generated-view exception was needed. No builder blocker remains. The Mac publication scan and landing are separate and have not been run in this cloud. The initial report-only evidence snapshot ddeea7b2cec04fb41cb941ae6fe8082b9f8dfc9a was independently fetched; all 45 selected file hashes and its product branch/head manifest were verified. initial-evidence-return-receipt.json is the actual receipt for that initial transfer. The final selected report packet adds that receipt and this completed-CI result; the terminal EVIDENCE line identifies its final published head. See the actual command receipts and logs for exit status, timing, and any limitations.
