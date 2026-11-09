# sx-glove-f205fix1-pc1 — run-glove continuation

Final result: BLOCKED. Exact-SHA Verify 42640480047: completed/failure, attempt 2. Product head: bfb8066c945f939c2baa676e08a03a9b78830014.

Repository: just-every/run-glove. Product branch: cloud/sx-glove-f205fix1-pc1.

## Scope and plan

The requested work is one continuation merge of the published DATA-001 f205 repair, preserving its claims and tests. The full executable plan is PLAN.md. The source branch was fetched and its required head verified as 4cb7a67af164eb018628577d9cccf9fe00f2d53c. Current main was e1d25590661c95f7f94041c395aa0c34b7b97e3a, containing the synthetic SNS certificate fix 643c6432 or later (actual abbreviated commit 643c643).

The continuation starts at the published source and merges current main without rebasing or force pushing. Only sources.lock.json conflicted. CONTRACT.md, docs/contract/ID-MAP.json and the generated views match main. There were no migration collisions. The documented contract write/check ran with --clauses COMM-001; the generated views were restored from main. The documented edition lock/check ran last after restoring build-only route formatting.

## Product result

The existing ten-file DATA-001 repair is retained relative to main: the glove_meta revision counter belongs to the edition archive policy; erased field evidence is separated from retained anonymous material costs; shared source exports fence peer originals; privacy qualification includes full source rows and objects; the real portability probe opens the destination database and supplies a Web stream to the archive reader. No clause claim or CLAIM line was authored by this continuation.

Compared with the source candidate, main contributes COMM-001 partial → done: 41 done / 193 partial / 29 missing becomes 42 done / 192 partial / 29 missing (263 unique clauses). Compared with current main, all 263 clause statuses are unchanged. DATA-001 and CUST-001 stay partial. Published: 3 done / 10 partial; target: 37 done / 170 partial / 27 missing; push-further: 2 done / 12 partial / 2 missing. These are report counts read from the source table, not edits to generated summary documents.

## Validation and execution findings

- Fleet identity and credential helper installed; repository-preserving co-author hook active and reinstalled after setup.
- Non-interactive setup with pinned RER 0.2.87 passed.
- Typecheck passed; publication check with the first-party profile passed.
- Privacy API test passed its complete set of named scenarios (1 top-level test, zero failures).
- Contract generator check passed. Final source-lock check passed.
- All seven tests in tests/browser/journey.spec.ts passed in Chromium, including privacy erasure and CUST-001 property histories at 1440 and 390. The selected screenshot bytes and hashes are in browser-proof-receipt.json. The full portable shard passed to its green end with CI=true at the original caller (991.01 seconds, including its build). It passed the destination erasure checkpoint, later-journal protection, the documented fresh-offline limitation, anonymous material costs, exact original custody, payment state and replay/reconnection fences.

The first portable invocation stopped at the CLI requirement that --no-queue have CI=true on the original caller. It was rerun with CI=true exported before the full shard, without changing product code, tests or deadlines. An intermediate source-lock check observed generated route whitespace from build; that file was restored and the final documented lock/check passed. Retained logs distinguish those attempts. No private setup log, environment dump, provider keys, native sign-in entry or held-out gate material is selected for public evidence.

## Custody and boundaries

Product merge commit bfb8066c945f939c2baa676e08a03a9b78830014 was pushed successfully on the first guard attempt. Its parents are 4cb7a67af164eb018628577d9cccf9fe00f2d53c, e1d25590661c95f7f94041c395aa0c34b7b97e3a. Its tree 7d99fe1e3f7fd4b7e8e79839d617ed36a330deb3 matches the tested-tree receipt. Every one of the nine candidate commits (including side parents) has fleet author and committer identities and no prohibited trailers. Exact-SHA Verify run 42640480047 was discovered by full-SHA REST lookup: https://github.com/just-every/run-glove/actions/runs/42640480047. The exact-SHA run completed with failure. Diagnosis is complete and the ten-call GitHub budget is exhausted; no READY claim is made. See the terminal artifact blocker below. The initial abbreviated-SHA discovery returned no runs and supplies no CI evidence. All subsequent lookups use the full 40-character SHA and the watcher enforces at least 300 seconds between calls. No PR is required by the repository instructions; none has been opened. No main/default branch push or lane inbox write is performed. The Mac fleet publication scan and landing remain its responsibility. Evidence publication is a separate report-only ref and does not signal acceptance or landing.

## CI failure diagnosis and bounded retry

The first Verify attempt passed plan, build, foundation, api-1, api-2, portable, and browser-2/3/4. Browser-1 passed 15 of 16 tests and failed in tests/browser/invoice-batch.spec.ts:31 with `route.fulfill: Route is already handled!`; the aggregate failed as a consequence. The single failed-step archive was successfully retrieved with `gh run view 42640480047 --repo just-every/run-glove --job 129240404968 --log-failed`. No direct job-log blob endpoint was used.

The full unchanged browser-1 shard then passed locally: 16/16, 381.03 seconds including its fresh installation and build. This supports an intermittent Playwright routing lifecycle failure. The failed-jobs retry request was accepted (exit 0); it retained the same product head and all existing assertions. No tests, timeouts, clause judgments or product files were changed for this diagnosis. Build-only route formatting was restored, and all 1,610 tracked source hashes and the clean checkout were verified again.

### Latest attempt blocker

Attempt 2 did not reach browser assertions. It failed during actions/download-artifact: `Artifact not found for name: verify-build-42640480047-2`. The workflow uploads and downloads `verify-build-${github.run_id}-${github.run_attempt}`. The failed-jobs-only retry retained the successful attempt-1 build, so no attempt-2 artifact was produced. A full workflow rerun on the same SHA is needed to create a matching build artifact and rerun coverage; the original invoice-batch routing error must be reassessed if it recurs.

The tenth and final budgeted GitHub invocation was `gh run view 42640480047 --repo just-every/run-glove --attempt 2 --log-failed`; it retrieved both latest failed-job archives once in one invocation, avoiding another discovery call beyond budget. It succeeded. This was a workflow artifact lookup failure, not a Git/credential/HTTP transport rejection. No retry of a blocked blob endpoint was attempted. The call journal and archived logs omit private runtime entries and configured step environment blocks before public evidence selection.

## Terminal custody

Product custody: PUSHED; readiness: BLOCKED. Branch cloud/sx-glove-f205fix1-pc1, head bfb8066c945f939c2baa676e08a03a9b78830014, tree 7d99fe1e3f7fd4b7e8e79839d617ed36a330deb3. Product push succeeded once; the one authored commit is the nonempty continuation merge. No PR was required or opened. No force push, default-branch push, test deletion, timeout increase, shard move, or clause promotion was performed.

The last exact-SHA REST result for Verify run 42640480047 is status=completed, conclusion=failure, run_attempt=2. URL: https://github.com/just-every/run-glove/actions/runs/42640480047. GitHub calls used: 10/10. The complete actual call journal, first-attempt job metadata, failed-job archive, unchanged 16/16 browser reproduction and accepted rerun receipt are included.

The exact-SHA CI retry is red before browser assertions: artifact verify-build-42640480047-2 is missing because the successful build job was not rerun. A full workflow rerun is required to produce the matching artifact; the ten-call GitHub budget is exhausted. The first-attempt invoice-batch routing error is separately documented and passed in the unchanged 16/16 local shard. READY is not claimed. The pushed product and complete actual evidence are retained.
