# sx-glove-c-f233-pc2 — Glove main refresh

## Scope and plan

Repository: just-every/run-glove. Product branch: cloud/sx-glove-c-f233-pc2.

1. Refresh launcher credentials, install the fleet Git helper, push guard and commit-message cleanup; retain repository hooks and fleet identity.
2. Clone with --filter=blob:none and full history. Fetch main and pc1, require pc1 head d2366e79d9f2cdc5833285c42a72fc32de35faee, and create pc2 at that head.
3. Merge current main without rewriting published history. Keep both sides' tests; retain main's full contract judgments, ID map and generated views. Resolve any migration number collision without deleting tests.
4. Restore CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and docs/contract/ID-MAP.json byte for byte from main; verify the contract diff is empty. Regenerate contract documents, check, restore main's views, then regenerate and check sources.lock.json last.
5. Run the candidate's touched non-browser test (tests/api/push.test.mjs) and typecheck once. Browser and portable suites run only in CI, as directed by the brief.
6. Fetch main immediately before publication, merge again if moved, restore main's contract documents and regenerate/check the lock. Inspect all candidate commits, including side parents, for author, committer and trailer policy before the guarded push.
7. Discover and poll exact-SHA Verify via REST with one watcher, no faster than five minutes per run, within the ten-call API budget. Read each failed job's failed log at most once when needed. Record actual outcomes and job IDs.
8. Publish the explicitly selected non-secret packet to evidence/sx-glove-c-f233-pc2, separately from the product branch. Return provenance and an sx inbox POST line; never write lane inboxes or main.

## Initial observations

- Launcher refresh succeeded; the decrypted bundle is used through the fleet helper without exposing values.
- pc1's head matched the required SHA exactly.
- The first merge of current main completed without content conflicts, including tests/browser/journey.spec.ts. No manual test resolution or migration renumbering was needed.
- Candidate changes relative to main are the iPhone iOS 16.4 notification notice, six lines of hosted push endpoint rejection coverage, expanded FIELD-004 browser steps at 1440 and 390, and the regenerated source lock.
- This refresh introduces no new product behavior or clause claims. Existing candidate claims and CLAIM lines are retained.

## Merge and local results

- New merge commit: c3f4c1ec4003e8fccadf6798cf706e8db39ef3e9. Parents: pc1 d2366e79d9f2cdc5833285c42a72fc32de35faee and current main 35f1f12f403d924b1a9cd095583fd21d774dfee2.
- Main was fetched immediately before the guarded push and had not moved. The latest main is an ancestor of the published candidate.
- No conflicts occurred. pc1's three candidate source/test files remain byte-identical to pc1. Both sides' changes are retained by the merge, including main's CI re-plan, harness work and newer clause judgments.
- CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and docs/contract/ID-MAP.json are byte-identical to main. No generated view edits were authored. Setup's unrelated route-tree whitespace generation was restored before the final lock.
- Contract counts before (pc1): 45 done, 189 partial, 29 missing, 263 total. After (current main retained): 47 done, 187 partial, 29 missing, 263 total. COST-001 and SURFACE-015 retain main's partial-to-done judgments. Relative to main there are no clause status, gap, evidence, requirement or CLAIM changes.
- FIELD-004 remains partial; FIELD-009 remains partial; FIELD-010 remains done.
- Local setup completed the production build and 55 migrations. Typecheck passed. The touched push API test passed (one top-level test, six scenarios, zero failures). Contract generation and its check passed. The final source lock was regenerated last and its check passed. Diff whitespace checks passed.
- Local browser/portable suites were deliberately skipped under the explicit brief's runner constraint. The existing candidate contains browser assertion/proof steps at 1440 and 390; their execution is entrusted to CI.
- All six candidate commits, including side parents, passed the pre-push identity/message/trailer scan. Published pc1 commits were preserved without rewriting. The new merge commit has fleet author and committer and no AI co-author trailer.
- Product push succeeded on the first guard attempt to cloud/sx-glove-c-f233-pc2. No main/default ref was pushed and no PR was created (the repo's provided builder rules require none).
- Exact-SHA Verify discovered: run 43010230808, https://github.com/just-every/run-glove/actions/runs/43010230808. CI outcome is recorded separately in ci-receipt.json.

## Terminal CI and custody result

Exact-SHA Verify run **43010230808** completed with **success** on **c3f4c1ec4003e8fccadf6798cf706e8db39ef3e9**. URL: https://github.com/just-every/run-glove/actions/runs/43010230808. Four GitHub API calls were used: discovery, then three polls spaced at least 300 seconds apart. No failed-job log calls were needed. This is an actual successful workflow conclusion; the generated-view exception was not needed.

The first discovery's URL sanitizer truncated the saved compact JSON at a templated GitHub notifications URL. The complete run identity and in-progress status had already been observed; ci-discovery-summary.json records those fields and the watcher resumed that same run without repeating discovery. Later poll receipts are complete JSON and the terminal receipt confirms the exact SHA.

Product custody: PUSHED, eligible for READY under the supplied exact-SHA Verify contract. No blockers. No PR was created. No main/default push, merge landing or publication scan on the fleet machine was attempted. Evidence publication is a separate report-only ref and grants no additional product or clause acceptance.

Local evidence files include the full plan, contract counts, immutable product/hash receipt, identity scan, push terminal result, touched-check logs, generated-source receipts and exact-SHA CI observations. The packet is explicitly selected for publication, contains regular files only, and was checked for injected bundle values before transfer. Private setup output and credentials are excluded.

READY branch=cloud/sx-glove-c-f233-pc2 head=c3f4c1ec4003e8fccadf6798cf706e8db39ef3e9
