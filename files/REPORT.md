# sx-glove-c-f214-pc1 — continuation plan and results

Repository: just-every/run-glove
Product branch: cloud/sx-glove-c-f214-pc1
Required original candidate: 61fae338ea45bf8fab68fa1b60b1d1c63aaa39c5 (verified)
Merged main: a81559508ceab2126d0259be3a06afb7f647ec77

## Plan

1. Install fleet identity, credential helper, push guard and commit-message cleanup; clone with blob filtering and full history.
2. Verify the original candidate, create the named continuation there, and merge current main without rebasing or rewriting published history.
3. Keep main's contract judgments and generated views. Resolve the source lock by regeneration; renumber a migration only if one collides.
4. Run contract generation and its check for the carried COMM-001 judgment, restore main's generated views, then regenerate and check sources.lock.json last.
5. Run pinned setup, typecheck, the candidate's lead-matching API file and its changed Reserve browser journey once. Keep all test assertions and claims intact.
6. Audit all candidate authors, committers and trailers, create one real merge commit, and push only the named product branch with the fleet guard.
7. Discover and observe Verify on that exact SHA through REST within the ten-call budget and 300-second per-run polling limit. Report failed jobs honestly.
8. Publish this actual report and receipts separately to evidence/sx-glove-c-f214-pc1; product landing remains the fleet's responsibility.

## Merge findings

The original candidate is not already included in main: three candidate commits carry the API and browser qualification changes. Main includes 643c6432's synthetic SNS certificate fix. The only merge conflict was sources.lock.json; CONTRACT.md, ID-MAP and migrations needed no conflict resolution. Main's COMM-001 partial-to-done judgment is retained. BOOK-017 remains partial in CONTRACT.md; this continuation adds no claim or CLAIM-line changes. Candidate claim messages are retained verbatim.

Contract generation wrote zero documents, its check passed, and both view blobs match main. Source-lock regeneration and check passed. Final validation and transport receipts follow when complete.

## Product custody

One real merge commit was created with fleet identity and active repository-preserving hooks, then pushed once successfully through the fleet push guard. Product head: `0dd59ff3efa59e86d002578f7f7f9cb5c50a8bce`. Its parents are `61fae338ea45bf8fab68fa1b60b1d1c63aaa39c5` and `a81559508ceab2126d0259be3a06afb7f647ec77`. All four commits in `origin/main..HEAD`, including side parents, passed the author, committer and complete-message/trailer audit. No PR was required by the seed rules and none was created. Main was not pushed or fast-forwarded.

Relative to main, the complete product diff remains sources.lock.json, the 218-line API qualification addition, and the browser's hydration waits (223 insertions / 4 deletions total). No new behavior, migration, claim, CLAIM line, or test weakening was introduced.

## Counts and clause status

Before the merge, the candidate's source reported 41 done / 193 partial / 29 missing (263 total); afterward it reports 42 / 192 / 29 (263 total). This change is main's existing COMM-001 partial-to-done judgment. Relative to merged main, counts and clause judgments are unchanged. BOOK-017 remains partial; its eight acceptance-point qualification scenarios are retained without promotion. Published clauses remain 3 done / 10 partial / 0 missing (13); target-and-push-further goes from 38 / 183 / 29 to main's 39 / 182 / 29 (250).

## Local validation so far

- Contract generator write/check for carried COMM-001: pass; write changed zero documents. Both generated view blobs equal main.
- Source lock regenerated last and checked immediately before commit: pass (1,606 files).
- Typecheck: pass.
- `node --test --test-concurrency=1 tests/api/lead-matching.test.mjs`: pass, one outer test with ten named scenarios, including all eight BOOK-017 acceptance points; 89.6 seconds overall, no skips.
- The standard browser wrapper failed during its owned-installation setup before Playwright assertions. Native setup also failed twice at the 60-second listener-handshake deadline. These infrastructure failures and actual diagnostics are retained in the packet.
- Vite reached readiness when allowed to complete dependency scanning separately; a follow-up cache warmup returned HTTP 200 from the real /health endpoint and completed the dependency cache. Native setup and the unchanged browser journey are being retried in the prepared checkout; final outcome will be recorded below.

## CI observation

The branch's first exact-SHA discovery ran immediately after the successful push and no push Verify was listed yet. One watcher continues with at least 300 seconds between run API calls and a total ten-call GitHub budget. No other SHA is accepted as proof.

## Local browser outcome and limits

The run site built successfully (22 pages, 96 files). Three native setup attempts failed at the CLI's 60-second internal listener handshake; exact-Node selection and cache warmup did not remove that CLI deadline failure. The separate warmup did prove a real healthy app and completed its Vite dependency cache.

An alternative local launcher then ran the actual Vite app with the existing private dev gate and claimed the owner through native `/auth/bootstrap` with the same local CLI proof. Its /health endpoint returned 200 and native owner bootstrap succeeded. The unchanged Reserve Playwright test ran once through Chromium `/usr/bin/chromium` with `--no-sandbox`, retaining its original 240-second test timeout and all assertions. It failed at `tests/browser/journey.spec.ts:1266` with `Private owner entry failed.` before intake assertions or screenshot capture. Neither viewport completed, and no local browser screen proof is claimed. No product or test workaround was committed. This failure remains a local validation limitation; hosted exact-SHA Verify must independently establish the candidate's result.

All owned browsers and local servers from these attempts stopped. Generated routeTree output was restored to HEAD; the product checkout is clean.

## CI reader correction

The second REST discovery response identified push Verify run 42648331674 on the exact candidate SHA, in progress. The task-side URL-redaction wrapper incorrectly consumed JSON punctuation after a query-bearing URL, truncating that response. Its safe leading run fields were recovered only to identify the next request; the truncated response was not used as green proof. The wrapper was corrected outside the product checkout, the single watcher resumed with the same 300-second minimum interval, and the third call returned valid run JSON confirming in_progress on the exact SHA. All three calls and the reader error are preserved in the packet.

## Final exact-SHA result and preservation

The resumed workspace retained the already-pushed product head and complete prior receipts. No second product commit or push was made. The fourth GitHub call returned Verify **completed/success**, run **42648331674**, on exact SHA **0dd59ff3efa59e86d002578f7f7f9cb5c50a8bce**:
https://github.com/just-every/run-glove/actions/runs/42648331674

The later native browser attempt was interrupted with the environment after health and native-owner readiness; it has no completed check receipt and is not counted as a pass. The earlier completed browser failure remains recorded. Hosted Verify is green; there are no remaining product blockers. No assertion or test was removed or weakened.

Restored only the generated route-tree whitespace produced by the interrupted local server. The product checkout is clean, the merge parents and original candidate match the brief, and both generated contract views match merged main. The four GitHub calls remain within budget. No PR was required or created. Publication is to the separate evidence ref only and does not signal acceptance or landing.

READY branch=cloud/sx-glove-c-f214-pc1 head=0dd59ff3efa59e86d002578f7f7f9cb5c50a8bce
