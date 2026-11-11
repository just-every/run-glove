# sx-glove-c-f241-fix1-pc1: refresh DATA-006 candidate against main

Repository: just-every/run-glove
Product branch: cloud/sx-glove-c-f241-fix1-pc1
Product head: 15012f2d8836c44f6566f826aa64b8196dc8b674
Original candidate: d053203e969869d09f1949e8549e3e0b3828d5dd
Merged main: 7ed9291267dafdd0ed87eaab829eb7af547269a9
PR: none created; this brief returns the named branch to the fleet lander.

## Plan and implementation

The full plan is in PLAN.md. The task is an integration refresh of an existing published fix, preserving the DATA-006 code and claim while retaining current main's contract judgments.

1. Refreshed the fleet launcher, installed decrypted-bundle Git authentication, configured fleet identity, and installed the fleet co-author cleanup hook while preserving repository hooks. Cloned only the declared write repository with --filter=blob:none and no depth limit.
2. Fetched main and cloud/sx-glove-c-f241-fix1 and verified the candidate's full expected SHA. Created cloud/sx-glove-c-f241-fix1-pc1 at that candidate. Merged origin/main without rebasing or rewriting the original published history.
3. The only Git merge conflict was sources.lock.json. The contract source, both generated views and docs/contract/ID-MAP.json were restored whole from main as directed. No test conflict or migration collision occurred. All main tests and all candidate tests remain.
4. Ran the documented contract generator write with --clauses COST-001 SURFACE-015 and its check. It wrote zero documents and the check passed. Restored ACCEPTANCE.md and docs/CLAIMS.md from main. Regenerated sources.lock.json from the merged sources and checked it last. Generated view files have no diff against the merged main.
5. Installed frozen dependencies and ran the requested non-interactive local setup through cloud_run. Reinstalled the fleet hook after dependency/setup work. Typecheck and the touched privacy API test file each ran once and passed. Setup's only unrelated tracked effect was generated route-file whitespace, which was restored before the final source-lock regeneration. No browser or portable suite ran locally, as directed by the brief.
6. Fetched origin/main immediately before committing and pushing. It remained 7ed9291267dafdd0ed87eaab829eb7af547269a9, exactly the main parent of the merge. Verified zero diff from main for CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and docs/contract/ID-MAP.json. Created one fleet-authored merge commit without [skip ci]. Inspected all six commits reachable from the candidate but not main, including side parents, and checked identities, trailers and complete messages. Existing owner-authored commits and permitted Anthropic noreply trailers were preserved; no OpenAI/Codex co-author was present.
7. Pushed only cloud/sx-glove-c-f241-fix1-pc1 through cloud-push.py; first attempt succeeded. A single REST watcher observes exact-SHA Verify within the ten-call budget, with a 300-second watcher schedule, including discovery. Reports and receipts are kept outside the product checkout for publication only on evidence/sx-glove-c-f241-fix1-pc1.

## Product scope and preservation

Relative to the main parent, the candidate changes eight files: sources.lock.json, the three privacy implementation files, privacy.test.mjs, and the three shared-import fixture files. The final diff is 565 insertions and 22 deletions. CONTRACT.md and the generated views have zero diff against main.

The merged privacy.test.mjs has 407 lines and retains every line from the original candidate (313 lines) and current main (396 lines); test-preservation.json records the check. The original kept-batch privacy.ts block is byte-identical to the original candidate. privacy-imports.ts, privacy-preview.ts and all three original shared-import fixture files are also byte-identical to that candidate. privacy.ts additionally contains main's newer event/command identity-redaction changes, and privacy.test.mjs retains main's newer peer-redaction tests. Receipt checks record this explicitly. The original DATA-006 CLAIM DONE commit remains in unchanged ancestry. This task adds no CLAIM line and makes no DATA-006 status promotion.

## Clause counts and status changes

Counts are parsed from CONTRACT.md, not hand-edited summaries.

| Version | Done | Partial | Missing | Total |
| --- | ---: | ---: | ---: | ---: |
| Original candidate d053203 | 45 | 189 | 29 | 263 |
| Merged main and refreshed candidate | 47 | 187 | 29 | 263 |

| Clause | Original candidate | Main / refreshed candidate |
| --- | --- | --- |
| COST-001 | partial | done |
| SURFACE-015 | partial | done |
| DATA-006 | partial | partial |

There are no clause-status changes relative to the last fetched main. Generated tier counts after the merge are Core: 46 done, 175 partial, 16 missing (237 total); Agent surface: 1 done, 12 partial, 13 missing (26 total); full target: 47 done, 187 partial, 29 missing (263 total).

## Local results

- Fresh setup: passed. The temporary setup processes exited under the child subreaper. The raw setup log is retained privately outside the packet because setup output can contain local access material.
- pnpm typecheck: passed once; typecheck.log. The supplied toolchain shim retained host Node 24.19.0 and pnpm 10.12.4; the repository and CI pin is Node 22.20.0. No second local test run was added.
- cloud_run node --test --test-concurrency=1 tests/api/privacy.test.mjs: passed once; 1 top-level test, 28 scenario results, zero failures, 129437.219576 ms; privacy-tests.log and privacy-scenarios.json.
- node scripts/contract-docs.mjs write --clauses COST-001 SURFACE-015 and check: passed; zero generated document changes.
- node scripts/edition-authoring/cli.mjs lock and check: passed after contract restoration; source-checks.json.
- Four-file contract parity with main: passed; contract-parity.json.
- Identity, trailer and full-message check across all six candidate commits: passed; identity-check.json and commit-identities.txt.
- git diff --check: passed. Product checkout was clean after commit/push.
- Product push: passed on attempt 1; product-push.log.
- Browser/portable assertions and dual-width browser proof: not run locally because this is an integration-only refresh and the brief explicitly delegates those suites to CI. This task changes no UI source.

RECEIPT.json contains the actual product, command and preservation receipt. ci-receipt.json and github-calls.json retain exact-SHA observations and budget accounting. CI and terminal custody are recorded below. Independent publication scan and landing remain fleet-side responsibilities.


## Exact-SHA CI and terminal custody

Verify run: 43003293466
URL: https://github.com/just-every/run-glove/actions/runs/43003293466
Observed status: completed
Observed conclusion: success
Observed head: 15012f2d8836c44f6566f826aa64b8196dc8b674

Five GitHub calls were used: two discovery requests and three status requests. The watcher scheduled requests every 300 seconds. Actual wrapper timestamps record intervals of 300.016, 300.003, 299.982 and 300.013 seconds; one invocation was 18.5 milliseconds short of 300 seconds because subprocess startup varied. The original timestamps are retained without adjustment. The completed/success result is for the exact pushed branch head; no generated-view exception was needed. No failed jobs or log-archive requests were necessary. The declared repository has a push-triggered Verify entry point, and no PR was required by this brief or its AGENTS.md.

No blockers remain in the cloud brief. READY records this product branch's checked custody; it does not claim independent acceptance, publication scan approval or landing. The fleet performs those steps on its own machine. The complete selected non-secret report packet is returned through the separate evidence ref. That publication leaves the product head and index untouched.

READY branch=cloud/sx-glove-c-f241-fix1-pc1 head=15012f2d8836c44f6566f826aa64b8196dc8b674
