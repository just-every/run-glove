# sx-glove-ci-limit-1 report

Repository: just-every/run-glove (treated as public).
Branch: `cloud/sx-glove-ci-limit-1`.
Base: `a891c6854edd4c44b39956b362930b2224f7a31c`.
Candidate: `e9d3a5e8a4cede999e79b2e881a8d3f4a9c1b2be`.
Repair commit: `98069548b98c02f074fd7444d937e520216e45b6`.
Timeout commit: `e9d3a5e8a4cede999e79b2e881a8d3f4a9c1b2be`.
PR: none; the fleet retains landing responsibility. No main/default branch push was performed.

## Plan and implementation

The full executed plan is in PLAN.md. In sequence: configure fleet identity and bundle-only authentication; inspect launcher/repository rules; shallow filtered clone main; carry the supplied Request.clone repair; measure three recent workflow job inventories; update only the shard timeout settings; run touched checks and source-lock regeneration; inspect candidate identities; push the named branch; verify its exact-SHA workflow; publish a separate report-only evidence ref.

The branch includes the fclone repair from `175348fdc66d67c70dc07e1d903923b532b68042` and supersedes sx-glove-fclone-1 for landing. Its changes buffer signed callback bytes once and construct independent Requests for replay, avoiding native Request.clone lifecycle cancellation while retaining the existing test outcomes and checks. The carry was conflict-free; no CONTRACT.md status/gap/evidence hunk was carried. Main's content and clause judgments remain intact.

The separate timeout commit changes `.github/workflows/verify.yml`'s workflow_call timeout default and shards timeout fallback from **15 to 17 minutes**. The longest actually completed sampled shard is browser at **12m55s**, so `ceil(12m55s + 4m) = 17m`, a **4m05s** margin. The cancelled browser attempt's 15m15s is a floor for that attempt, not a completed runtime. The conditional 25-minute fallback does not apply because a browser shard completed below 15 minutes.

The plan, matrix, commands, test placement and assertion counts are unchanged. Four push shards remain four (at most eight allowed). The explicit nightly 45-minute override is retained; plan/summary/proof jobs remain one minute and light remains 12 minutes. sources.lock.json was regenerated last for each product commit; Verify is one of its inputs. No generated acceptance/claims view, fleet evidence or setup-generated route formatting was committed.

## Measurements

| Run | Shard | Conclusion | Duration |
| --- | --- | --- | --- |
| 42349435219 | shards (api) | success | 8m17s |
| 42349435219 | shards (browser) | success | 12m55s |
| 42349435219 | shards (foundation) | success | 1m56s |
| 42349435219 | shards (portable) | success | 6m16s |
| 42352072080 | shards (${{ matrix.name }}) | skipped | 0m00s |
| 42355219327 | shards (browser) | cancelled | 15m15s |
| 42355219327 | shards (portable) | success | 8m41s |
| 42355219327 | shards (api) | success | 12m32s |
| 42355219327 | shards (foundation) | success | 1m15s |

Longest actually completed shard: browser, 12m55s, run 42349435219.
ceil(12m55s + 4m) = 17 minutes, giving 4m05s margin.
Run 42355219327 browser was cancelled at 15m15s: this is a lower bound for that attempt, not a completed duration.
Run 42352072080 succeeded with shard coverage skipped; it does not establish a browser duration.
Push shard count stays 4 (foundation, api, portable, browser), below the limit of 8.
The explicit nightly reusable-workflow override remains 45 minutes; plan/summary jobs remain 1 minute and light remains 12 minutes.

## Local validation

- Fleet launcher refresh and bundle-backed Git helper configured; repository commit hook preserves native hooks and removes Codex/OpenAI co-authors.
- `npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive`: exit 0, through cloud_run.
- `npx -y @runeditrun/rer build`: exit 0, through cloud_run.
- Touched callback suite, `node --test --test-concurrency=1 tests/api/reminders.test.mjs`: **8 passed, 0 failed** on CI's Node 22.20.0; also 8/8 on the VM Node 24.
- `npx -y @runeditrun/rer check --profile first-party`: exit 0.
- `node scripts/verify-ci.mjs --check-workflows`: passed.
- Push/all matrix checks retain foundation, api, portable and browser.
- `node scripts/contract-docs.mjs check`: current.
- `node scripts/edition-authoring/cli.mjs check`: passed after lock regeneration.
- `git diff --check`: passed; final worktree clean.
- Scope checks verify unchanged contract/views, shard composition, short-job limits and normal head message. Assertion counts remain reminders 189, SMS inbox 14 and voice 64.
- Every product candidate author and committer is Run Edit Run fleet <fleet@runeditrun.com>, with no co-author trailers. The push guard succeeded on attempt 1. Product push receipt is product-push.txt.

The fleet publication scan and landing run on its own machine; this report makes no claim to have run them in this cloud VM. No UI changes require browser screenshots.

## Counts and clause judgments

Before and after: **10 done, 224 partial, 29 missing**. No clause status changed. COMM-009/COMM-028 retain their current judgments; the callback test repair makes existing proof executable. Before/after shard count is **4/4**; timeout is **15/17 minutes**. Product changes are six files across two commits; the timeout commit is two files.

## Product custody and CI

Pushed only cloud/sx-glove-ci-limit-1, head `e9d3a5e8a4cede999e79b2e881a8d3f4a9c1b2be`. Verify run **42357379438**, https://github.com/just-every/run-glove/actions/runs/42357379438, was discovered via REST with this exact head SHA. A single watcher polls with at least 300 seconds between API calls, within the ten-call budget. The final exact-SHA result is **completed / failure**. The failed workflow is not eligible for READY. Actual details are recorded in ci-receipt.json.

## Evidence and remaining responsibility

The actual non-secret report/receipt packet is outside the product checkout, under `$HOME/rer-consolidation/work/sx-glove-ci-limit-1/packet/`. Selected regular files are published only to refs/heads/evidence/sx-glove-ci-limit-1 through cloud_evidence.py. Setup/build logs containing private local runtime material are excluded. Evidence transport does not constitute product acceptance or landing. The fleet must perform its independent publication scan and landing checks; landing this branch supersedes sx-glove-fclone-1.

## Final exact-SHA failure and blocker

Verify **42357379438** completed **failure** for `e9d3a5e8a4cede999e79b2e881a8d3f4a9c1b2be`.

| Candidate shard | Conclusion | Duration |
| --- | --- | --- |
| shards (api) | success | 11m37s |
| shards (foundation) | success | 2m07s |
| shards (browser) | failure | 14m30s |
| shards (portable) | success | 5m54s |

The browser job completed at 14m30s within the 17-minute job limit; it was not cancelled. Playwright reported **43 passed, 1 failed** (12.8m tests). The 390px MONEY-002 / BOOK-005 owner/dispatcher/technician/office journey failed at `tests/browser/journey.spec.ts:697`: after CDP delivered a push message, service-worker `getNotifications()` returned `[]` instead of `[['Glove', 'Visit moved', <job id>]]` within the 5000ms assertion window. The other three shards are green. The aggregate `verify` job failed because its required shard result was failure; full-push-proof was skipped.

The browser test and its notification code are unchanged by this branch. The cause of the missing notification is not established by the failure log; this report does not label it transient or claim a product diagnosis. Fixing a separate notification flow or altering its assertion would exceed the explicit repair-plus-timeout-only scope. No shard composition, assertion or additional product behavior was changed to bypass this failure. A rerun was not requested without budget to verify it. All ten GitHub calls were used; each failed job's archive was read once, successfully, with no blocked blob redirect downloads.

**Terminal product custody: BLOCKED on the separate browser notification assertion.** The candidate is pushed and preserved, but is not READY, accepted or landed. The measured timeout change and carried fclone repair remain available on the named branch for the fleet to retain while resolving this check. Suggested lane follow-up: investigate the Linux Chromium service-worker notification delivery at 390px, then rerun exact-SHA Verify without weakening the assertion. Landing this branch still supersedes sx-glove-fclone-1 once the independent check is green.
