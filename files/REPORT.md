# sx-glove-c-f256-pc2 results

Repository: just-every/run-glove
Product branch: cloud/sx-glove-c-f256-pc2
Product head: a5f203a9f22803ec224ba4fd58e30675c70e3c74
Prior candidate: 507b08f48ccaf3d03fea89b3b01c245ceb1075ba
Merged main: 35f1f12f403d924b1a9cd095583fd21d774dfee2
PR: none created; the assigned fleet landing path retains the named product branch.

## Plan and implementation

The complete plan is in PLAN.md. The launcher was refreshed and its AGENTS.md read. The repository was cloned with --filter=blob:none without a depth limit. Its prior candidate head was verified before creating the named branch. Fleet identity and commit-message cleanup were installed locally, preserving the repository hooks.

The candidate was merged with current main without rewriting its published history. The only source conflict was the import block in tests/api/flows.test.mjs: retain fixedMonthlyReports from the candidate and the audit-trail fixture imports from main. All tests from both sides remain. merge-integrity.json additionally proves the statement fixture and entire PAY-010 statement test block are byte-identical to the prior candidate, and main's audit fixture is byte-identical to main. The source-lock conflict was resolved by regenerating it. No migrations collided.

CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and docs/contract/ID-MAP.json were restored whole from main. No Status, Gap, Evidence, clause claim or CLAIM line was authored by this task. Contract generation was run with --clauses PAY-010, its check passed, both view files were restored from main, then sources.lock.json was regenerated last and checked. Main was fetched again immediately before pushing; it was still 35f1f12f403d924b1a9cd095583fd21d774dfee2 and an ancestor of the candidate.

The merge commit uses the explicit fleet author and committer environment with active repository-preserving hooks. All 7 candidate commits, including side parents, passed the identity and trailer audit. Historical owner commits retain James Peter's configured identity and allowed Anthropic noreply trailers; no OpenAI/Codex coauthor survived. The product push guard succeeded on its first attempt. No main/default branch was pushed, no force push or rebase occurred, and reports remain outside the product tree.

Compared with main, the product changes are only sources.lock.json, tests/api/flows.test.mjs and tests/fixtures/statement-journey.mjs: 383 insertions, 2 deletions. They retain the prior candidate's PAY-010 statement evidence.

## Local verification

- Frozen pnpm install: passed.
- pnpm typecheck: passed (exit 0).
- node --test --test-concurrency=1 tests/api/flows.test.mjs: passed, 9/9 tests, 1 suite, 0 failures, 0 skipped or cancelled. The complete touched non-browser test file was run once through cloud_run, including all eight PAY-010 acceptance points and main's retained audit-trail assertions.
- Contract generation: wrote 0 documents; check passed.
- Edition source lock: regenerated after source reconciliation; check returned ok=true.
- git diff --check: passed.
- All four protected contract/map/view files are byte-identical to merged main; hashes are in RECEIPT.json.
- Browser and portable suites were not run locally, as directed by the brief. No UI was changed.

The supplied toolchain script selected pnpm 10.12.4 and retained VM Node 24.19.0 (its version test accepts a newer Node than the declared 22.20.0 pin); typecheck and the local API tests passed on that runtime. CI uses the repository's exact Node 22.20.0 pin.

## Counts and clause judgments

Previous candidate: 263 clauses, 45 done, 189 partial, 29 missing.
Merged candidate/current main: 263 clauses, 47 done, 187 partial, 29 missing.
The two inherited main judgments are COST-001 partial -> done and SURFACE-015 partial -> done. This task changes zero judgments relative to current main. PAY-010 remains partial; none of its claims were changed.

## Exact-SHA CI and custody

Verify run: 43010387272
URL: https://github.com/just-every/run-glove/actions/runs/43010387272
Exact head: a5f203a9f22803ec224ba4fd58e30675c70e3c74
Final outcome: completed / success on the exact product SHA. Observed via REST after discovery and two polls, using 3 of 10 allowed GitHub calls; each observation was more than 300 seconds after the previous one. No failed jobs or archive downloads were needed.

Custody: READY branch=cloud/sx-glove-c-f256-pc2 head=a5f203a9f22803ec224ba4fd58e30675c70e3c74

Blockers: none. No PR was required by the assigned branch-and-fleet landing path. The fleet must still run its independent gates and publication scan before landing; this task did not push main.

One REST watcher observes only this exact-SHA push run, with at least 300 seconds between discovery and subsequent observations and a ten-call GitHub budget. Actual REST responses and the call ledger are included in the packet.

Product custody and evidence publication are separate. No product readiness is inferred from report transport. The local packet scan checks report-file safety only; it is not the fleet publication scan. Independent fleet gates and the Mac publication scan remain required before landing.
