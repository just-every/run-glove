# sx-glove-c-f222-pc1 report

Repository: just-every/run-glove
Product branch: cloud/sx-glove-c-f222-pc1
Product head: 40deb630ae9759db0703ec89b9aa1dc0b51b0864
Original published candidate: 44baf40fbacc1e3307877b1aca736bc1c46dc996
Merged main: 0c76685078292ea640a2d9bc3238a51abd7c2b62
PR: none; the repository supports branch-push Verify and this brief requests branch custody for the fleet lander.

## Plan and execution

The complete plan is in PLAN.md. The authorized fleet launcher was refreshed, decrypted-bundle Git authentication was installed, and fleet Git identity and commit-message cleanup hooks remained active. Only the declared product repository was cloned, with --filter=blob:none and no shallow option. Both named refs were fetched and the original candidate head was verified exactly. The continuation branch was created at that published head.

Current main merged cleanly into the continuation without rebase, force push or history rewrite. One substantive merge commit was created. Its first parent is the published candidate and second parent is current main. No conflict resolution, migration renumbering, product behavior change or test weakening was needed. The existing PAY-021 candidate tests are byte-identical to their published versions. Main contains the fixed-clock synthetic SNS certificate repair, deterministic document-print restart repair and the Verify failed-job rerun repair.

CONTRACT.md and docs/contract/ID-MAP.json match main exactly. Contract generation and checking ran with --clauses BOOK-015 PAY-021. Generated ACCEPTANCE.md and docs/CLAIMS.md were restored whole from origin/main; neither has any new delta from main. sources.lock.json was regenerated last after the restored views and its documented check passed. The final tree differs from main only in tests/api/payments.test.mjs, tests/api/receipt-credit.mjs and their source-lock hashes.

## Validation

- Pinned pnpm 10.12.4 dependencies installed successfully with --frozen-lockfile.
- node scripts/contract-docs.mjs write --clauses BOOK-015 PAY-021: exit 0, wrote zero documents.
- node scripts/contract-docs.mjs check --clauses BOOK-015 PAY-021: exit 0, documents current.
- node scripts/edition-authoring/cli.mjs lock: exit 0.
- node scripts/edition-authoring/cli.mjs check: exit 0, 1607 tracked file hashes.
- pnpm typecheck: exit 0.
- node --test --test-concurrency=1 tests/api/payments.test.mjs: exit 0; 3 tests passed, 0 failed, 0 skipped. The PAY-021 nested qualification scenarios exercise native points 1–7, including authorization, exact cent balances and aging, branch/currency/customer exclusions, replay and restart, Activity and business export.
- git diff --check: passed.
- Candidate identity/trailer audit: all 3 commits outside origin/main, including side parents, have fleet author and committer and no trailers. No OpenAI/Codex co-author survived.

The supplied cloud toolchain selected Node v24.19.0 and pnpm 10.12.4. pnpm emitted the repository's Node 22.20.0 engine warning; local checks nevertheless passed. Hosted Verify pins Node 22.20.0 and supplies the required exact-SHA runtime proof. Local browser and portable suites were intentionally not run, as required by this continuation brief. No UI files changed relative to main.

## Clause judgments and counts

No candidate claim or CLAIM line was changed. PAY-021 remains PARTIAL, with transactional receipt delivery point 8 outside this qualification's native points 1–7.

The merge inherits main's BOOK-015 PARTIAL → DONE judgment; it makes no new promotion. Before (published candidate): 41 done / 193 partial / 29 missing, 263 total. After (merged main judgments): 42 done / 192 partial / 29 missing, 263 total. Core changes from 41/180/16 to 42/179/16; Agent surface remains 0/13/13; Later remains 0/0/0. Field proof remains 22 not run.

## Product publication and CI

Product push: success on the first guard attempt. Only cloud/sx-glove-c-f222-pc1 was pushed; main was not advanced. The product checkout is clean. Product provenance and actual command receipts are in product-receipt.json, commit.log, identity-audit.json, product-push.log and the named validation logs/receipts.

Exact-SHA Verify: run 42662160304, https://github.com/just-every/run-glove/actions/runs/42662160304, initially in_progress for 40deb630ae9759db0703ec89b9aa1dc0b51b0864. Final result: completed/success on that exact head; no generated-view exception was needed. github-calls.jsonl records actual REST requests; the watcher polls at intervals greater than 300 seconds and retains exact-SHA responses.

## Evidence custody

This packet is non-secret report-only material. Product commits contain no fleet reports or receipts. Explicitly selected packet files will be published only to refs/heads/evidence/sx-glove-c-f222-pc1 using cloud_evidence.py. Evidence transfer does not establish product readiness, independent acceptance or landing. The fleet performs publication scanning and landing on its own machine.

## Blockers

None found during merge or local validation. Exact-SHA Verify completed successfully. No blockers remain.

Final GitHub call usage: 4/10. All run observations were separated by at least 300 seconds. Exact-SHA success receipt: ci-receipt.json. Product custody is READY, without any claim of fleet acceptance or landing.
