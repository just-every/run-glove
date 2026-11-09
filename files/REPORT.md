# sx-glove-c-f218-pc1 report

Repository: just-every/run-glove. Product branch: cloud/sx-glove-c-f218-pc1.

## Assignment and plan

Continue the published AGENT-005 candidate at d2eb4c0cb800e603bcaa98a0319d483c1f2f46e1 with one merge of current main and a new exact-SHA Verify. PLAN.md records the complete execution plan. No other product work or clause promotion is authorized.

## Merge results

The specified candidate head was verified. Main at a81559508ceab2126d0259be3a06afb7f647ec77 includes the synthetic SNS certificate fix (643c6432 or later) and was merged without conflicts, rebase or history rewrite. The published candidate's full suggestion test file is unchanged. No migration collision exists.

CONTRACT.md matches main, as do docs/contract/ID-MAP.json and the generated ACCEPTANCE.md/docs/CLAIMS.md views. Contract generation with --clauses COMM-001 AGENT-005 wrote zero files and its check passed. The generated views were restored from origin/main. The source lock was regenerated last and checked successfully. The only differences against main are tests/api/suggest.test.mjs and its sources.lock.json entry. No new CLAIM line or clause claim was added.

Candidate counts: 41 done, 193 partial, 29 missing, 263 total. Merged counts: 42 done, 192 partial, 29 missing, 263 total. The difference is main's COMM-001 partial-to-done judgment; AGENT-005 stays partial. Main-to-continuation counts are unchanged.

## Local verification

The candidate touched tests/api/suggest.test.mjs only. Its native API scenario passed once, including authority, evidence disclosure, strict schema, malformed answer refusal, price approval, restart/replay, provider failures, current prices and erasure custody. No test was weakened or removed. The test owns and closes its Workers. No UI change was made, so no new browser proof was required.

Typecheck passed once. Product merge commit 6df155d633bb0e955e39b9cb99f5822e93d512bd was pushed successfully on the first guarded attempt after checking all candidate identities and trailers. The worktree is clean. Exact-SHA Verify completed with failure; terminal-receipt.json records the actual result. Dependency installation used the pinned pnpm 10.12.4; the supplied cloud toolchain retained VM Node 24.19.0. Hosted Verify uses the repository's exact Node 22.20.0.

## Custody and evidence

Product and evidence publication are separate. This packet contains only explicitly selected non-secret results; no environment dumps, credentials, private gate material or symlinks are included. Final product SHA, push and CI outcomes will be recorded in terminal receipts before evidence publication.

## Execution details

The continuation is a two-parent merge: first parent d2eb4c0cb800e603bcaa98a0319d483c1f2f46e1, second parent a81559508ceab2126d0259be3a06afb7f647ec77. Fleet identity is installed globally and locally; the preserved repository hooks remained enabled for the merge commit. The identity scan covered every commit in origin/main..HEAD, including side parents. Both candidates use Run Edit Run fleet <fleet@runeditrun.com> for author and committer; neither has trailers.

Commands and receipts:

- `pnpm install --frozen-lockfile`: passed; dependency-install.log.
- `node scripts/contract-docs.mjs write --clauses COMM-001 AGENT-005`: passed, zero files written; contract-write.log.
- `node scripts/contract-docs.mjs check --clauses COMM-001 AGENT-005`: passed; contract-check.log.
- `git checkout origin/main -- ACCEPTANCE.md docs/CLAIMS.md`: restored inherited views.
- `node scripts/edition-authoring/cli.mjs lock` followed by `check`: passed; source-lock-write.log and source-lock-check.log retain actual output.
- `pnpm typecheck`: passed; typecheck.log and typecheck-receipt.json.
- `node --test --test-concurrency=1 tests/api/suggest.test.mjs`: passed once, one top-level test, zero failures/skips, 28.144 seconds; suggest-tests.log and suggest-receipt.json.
- `git diff --check` and `git diff --cached --check`: passed before commit.
- `python3 $HOME/rer-consolidation/.tools/cloud-push.py origin cloud/sx-glove-c-f218-pc1`: first-attempt success; product-push.log.

No PR was opened: the brief requests the named branch for the Mac lander and the repository instructions impose no PR creation rule. No main/default branch was pushed. The cloud cannot run the fleet's publication scan; the Mac lander retains that check and independent acceptance. Evidence publication is not a landing or acceptance signal.

Exact-SHA Verify run: 42646655767, https://github.com/just-every/run-glove/actions/runs/42646655767. A single REST watcher observes the required five-minute spacing and ten-call budget. Its status receipts determine the terminal custody state.

## Final CI result and blocker

Terminal product state: BLOCKED. Product branch cloud/sx-glove-c-f218-pc1 is successfully pushed at 6df155d633bb0e955e39b9cb99f5822e93d512bd. No product changes remain unpushed, and the worktree is clean. No PR was created.

Verify run 42646655767 completed with conclusion failure on exactly that head. The sole failing test shard is browser-1, job 129262022345:

- `tests/browser/revenue.spec.ts:100:1`: REPORT-002, REPORT-004 the owner filters job margins and downloads the matching CSV at 1440 and 390.
- Failure at line 170: `Error: route.fulfill: Route is already handled!`.
- Browser-1 summary: 15 passed, 1 failed. The failing file is byte-identical to merged main; its last source commit is 60b97c8ed6551c994ba1d21fbf6b7d7e2adc195c (Finish fixed monthly date custody journey and invoice labels).
- The aggregate verify job 129270406985 failed because SHARDS=failure; full-push-proof was skipped.

Successful jobs: plan 129261595914, build 129261695543, foundation 129262022077, api-2 129262022111, portable 129262022117, browser-3 129262022175, browser-2 129262022205, browser-4 129262022279, api-1 129262022321. API-1 success shows the previous candidate's API-1 blocker did not recur in this continuation. No generated-contract-view check failed, so the lander exception does not apply. This is not a QUOTE-015 failure.

Both failed jobs' archived logs were read once with the mandated gh run view command; both reads succeeded. Seven of ten GitHub calls were used: one discovery, three exact-run polls spaced at least 301 seconds apart, one jobs listing, and two failed-job log reads. The first discovery response was truncated by an overbroad URL sanitizer after its run identity/status fields; ci-discovery-receipt.json records that limitation. The sanitizer was corrected before subsequent reads. Every exact-run status response and the jobs listing are complete valid JSON. No blocked blob-download retry was attempted.

Per the brief's one-merge, one-push scope and explicit BLOCKED-on-red rule, no unrelated revenue test change, test weakening, workflow rerun, second merge or second product push was made. A separate repair of the inherited browser route lifecycle and a later continuation from corrected main can address this check. This report does not establish the failure on any other SHA.

## Return packet

PLAN.md carries the complete plan. REPORT.md carries the complete results. terminal-receipt.json carries actual product provenance and CI custody; the check receipts and logs retain their actual output. Only the separately named evidence/sx-glove-c-f218-pc1 ref will carry this packet. The evidence transfer is not READY, product acceptance or landing.
