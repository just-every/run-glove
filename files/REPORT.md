# sx-glove-verify-artifact-1-pc1 — run-glove

## Result

Product branch: `cloud/sx-glove-verify-artifact-1-pc1`.
Product head: `c733d90241c295eb6bd6ddda3e0d45a1c7af7e3a`.
The branch was pushed once without force. No PR was created: this is the fleet continuation/branch custody path specified by the brief.

## Plan and implementation

The full plan is in PLAN.md. Fleet global and checkout identities, decrypted-bundle Git helper, preserved repository hooks and the cloud toolchain were installed. Only the declared product repository was cloned, with `--filter=blob:none` and no depth limit.

The published candidate was verified as `fbe722edd702638d028db96e1d1cf6bd85c28fec`. Current main was `643c64323dee88c18e5b2fc542f1da730c92112f`, including “Keep the synthetic SNS certificate valid at the fixed scenario clock”. Main did not already carry the artifact fix.

The new branch began at the published candidate. A clean nonempty merge preserved it as the first parent and current main as the second parent. There was no rebase, cherry-pick, force push, empty commit, migration collision or conflict to resolve. No test was weakened or removed. Relative to main, the only changes are `.github/workflows/verify.yml` and its hash in `sources.lock.json`.

The workflow upload and download use `verify-build-${{ github.run_id }}`. Upload has `overwrite: true`, allowing a rerun to reuse this run's production build without an attempt-dependent name mismatch. The original candidate's work and commit messages were retained.

## Contract and claims

CONTRACT.md is byte-identical to both the original candidate and main. docs/contract/ID-MAP.json, ACCEPTANCE.md and docs/CLAIMS.md match main. No clause or CLAIM line changed. No clause was promoted. Counts before and after: **41 done, 193 partial, 29 missing, 263 total**. Core remains 41/180/16 (237 total); Agent surface remains 0/13/13 (26 total); Later remains 0/0/0.

The documented contract generation wrote zero documents; its check passed. Main's generated views were restored before the documented source lock regeneration, which ran last and passed its check. The source-lock receipt records 1606 tracked source identities.

## Local validation

- `pnpm install --frozen-lockfile`: passed, pnpm 10.12.4.
- `node scripts/contract-docs.mjs write`: passed, zero documents changed.
- `node scripts/contract-docs.mjs check`: passed.
- `node scripts/edition-authoring/cli.mjs lock`: passed.
- `node scripts/edition-authoring/cli.mjs check`: passed.
- `pnpm typecheck`: passed once. The supplied toolchain retained VM Node 24.19.0 because its Node installer only upgrades older runtimes, so pnpm reported the exact-pin warning; hosted Verify selects Node 22.20.0.
- `node scripts/verify-ci.mjs --check-workflows`: passed once.
- Artifact assertions: passed for matching run-stable names, absence of run_attempt and overwrite enabled.
- Parsed contract before/after equality and clause counts: passed.
- Whitespace checks and final clean-worktree check: passed.

The original candidate touches no test files, so there are no candidate-touched tests to run. The merge incorporates main's existing test fixes unchanged; hosted Verify exercises the new merge SHA. No UI changed, so no browser screenshots were needed. No local setup, app build or unrelated suite was required by this workflow-only continuation.

## Product custody

All three commits in origin/main..HEAD, including side parents, use Run Edit Run fleet <fleet@runeditrun.com> for both author and committer. Their full messages contain no co-author trailers. The fleet commit hook remains active and repository hooks are preserved. The push guard succeeded on its first attempt. No push retry, bundle rescue, default-branch push or rewrite of published history occurred.

The cloud adaptation's exact-SHA watcher takes precedence over the historical brief's no-wait instruction. Verify run **42631966460** was discovered in progress for this exact head:
https://github.com/just-every/run-glove/actions/runs/42631966460

The CI terminal result is recorded below and in ci-receipt.json. One watcher uses REST, with at least 300 seconds between calls and a ten-call total budget. Evidence transport is separate from product READY custody and does not constitute acceptance or landing.

## Hosted exact-SHA result

Verify **42631966460** completed with **success** on `c733d90241c295eb6bd6ddda3e0d45a1c7af7e3a`. No generated-view exception was needed. The watcher used 4 of ten GitHub calls, each at least 300 seconds apart. There were no failed-job log downloads or retries. No blocker remains. Independent fleet gates and the Mac lander retain acceptance and landing authority.

All selected report files are regular files outside the product checkout, audited for injected secret values. They are published only through the report-only evidence ref, with the product checkout, HEAD and index preserved.
