# sx-glove-c-f249-pc1 — plan and results

Repository: just-every/run-glove
Product branch: cloud/sx-glove-c-f249-pc1
Candidate: f89074455249b9d81780009f441397711e056abb (verified against the fetched published branch).
Main initially merged: 35f1f12f403d924b1a9cd095583fd21d774dfee2.

## Full plan

1. Configure fleet Git identity; refresh the launcher; install the decrypted-bundle Git helper, product push guard, and co-author cleanup hooks without exposing credentials.
2. Clone the declared repository with --filter=blob:none and no depth limit. Fetch main and cloud/sx-glove-c-f249, verify the candidate SHA, and create the named task branch at that published candidate.
3. Merge current main without rebasing or rewriting published commits. Preserve all candidate and main tests. Use main's whole CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and docs/contract/ID-MAP.json; verify byte identity with main. Regenerate contract documents with COMM-014 as the touched-clause argument, check generation, and restore both generated views from main.
4. Regenerate sources.lock.json last and check it. Install dependencies and restore the fleet hook configuration after setup. Run the typecheck and tests/api/email.test.mjs once; do not run local browser or portable suites.
5. Fetch main immediately before publication. If main advanced, merge it under the same preservation rules and repeat the required generation/lock checks. Commit with explicit fleet author/committer identity and without a skip-ci final head. Inspect all unpublished commit identities, messages and trailers, including both merge parents. Push only the named product branch through cloud-push.py.
6. Discover and watch the pushed SHA's Verify through authenticated REST, loading the launcher bundle token for each gh invocation. Keep a single watcher, at least 300 seconds between calls for a run, and within ten GitHub calls. Report failures by run/job ID and inspect each failed job log only once.
7. Save actual non-secret reports and receipts in this packet, explicitly select files for report-only publication to evidence/sx-glove-c-f249-pc1, and report product custody separately from evidence transfer. End READY only on exact-SHA Verify success (or the permitted generated-view-only exception).

## Merge outcome so far

Only sources.lock.json conflicted. It was restored from main, then regenerated from the merged source. tests/api/email.test.mjs merged automatically: the candidate remains an additive 92-line change relative to main, including all three COMM-014 point 2 scenarios and their fixtures. No migration collision occurred. No clause judgment or CLAIM line was authored. The four protected contract files match main. Contract regeneration wrote zero documents; its check passed.

Owner identity observed on main: James Peter <github@zemaj.com>. The two inherited published candidate commits use that identity. New commits use Run Edit Run fleet <fleet@runeditrun.com>.

## Contract preservation

Candidate counts: 43 Done / 191 Partial / 29 Missing, total 263. Current main and merged counts: 47 Done / 187 Partial / 29 Missing, total 263 (Core 46/175/16 of 237; Agent surface 1/12/13 of 26). Main-to-merged judgment changes: none. COMM-014 stays Partial, with unchanged evidence and gap.

The newer main judgments retained from the candidate-to-main comparison are:

- COST-001: partial → done.
- BOOK-017: partial → done.
- QUOTE-002: partial → done.
- SURFACE-015: partial → done.

## Validation

- Frozen dependency installation succeeded with pnpm 10.12.4. The fleet commit hook was reinstalled afterward.
- `pnpm typecheck`: exit 0.
- `node scripts/contract-docs.mjs write --clauses COMM-014`: wrote zero documents.
- `node scripts/contract-docs.mjs check`: exit 0.
- `node scripts/edition-authoring/cli.mjs lock` then `check`: exit 0; check returned `ok: true`.
- Both generated view files and the protected contract/ID map were restored from main and have no difference from main.
- No local browser or portable suite was started, as instructed. API tests use isolated Miniflare installations and do not require a Vite listener.

## Final merge and product publication

The final pre-push fetch found main had advanced to `9a9426a6470e2fa91f0232a527277b34f033d1ff`. The first mechanical merge was still uncommitted, so it was refreshed from the original published candidate to this current main. The newly arrived changes are native Pause tests/docs and their source-lock entries; the protected contract documents are unchanged. The generator and lock checks were repeated. The touched email API source SHA-256 remained `95c11fd3df2646e034949b47b126dcdd2e54c00fa9dc66d343e9167861aa70fb`, identical to the passing local run. No published history was rewritten.

- Email API suite: exit 0, 1 registered test, 1 passed, 0 failed/cancelled/skipped; 529324.615457 ms. All three named COMM-014 point 2 scenarios appear in the passing diagnostics. The test file intentionally uses named scenarios within its registered test.
- Product head: `76349e7c883f8e775cdd784f45b6f2a5aa95384f`.
- Parents: original candidate `f89074455249b9d81780009f441397711e056abb` and current main `9a9426a6470e2fa91f0232a527277b34f033d1ff`.
- Product delta against that main: two files; 92 additive email test lines and one regenerated lock hash (93 insertions, 1 deletion total).
- Commit identity and trailer inspection passed for all three commits outside main, including side parents. New merge author and committer are the fleet; inherited candidate author/committer are the configured owner. No co-author trailers survived.
- Product push succeeded on guard attempt 1. The final commit has no `[skip ci]`. No push to main/default branch, force-push, rebase, PR or deployment occurred. No repository rule required a PR.
- Product checkout is clean. All fleet reports remain outside its tree.

## CI watcher note

The first exact-SHA REST discovery request succeeded at the transport level, but a URL-sanitization expression malformed its JSON output. No CI conclusion was inferred from that unreadable response. The helper was corrected to preserve JSON delimiters. The replacement single watcher waits at least 300 seconds from the recorded first call before rediscovery, retains subsequent actual responses, and counts this initial call against the ten-call budget. This is a local reporting-helper error, not evidence of a workflow failure.

## Exact-SHA CI result

Verify run **43011672078** completed **success** on product head `76349e7c883f8e775cdd784f45b6f2a5aa95384f`.

https://github.com/just-every/run-glove/actions/runs/43011672078

The successful REST receipt is retained in `verify-latest.json` and the complete actual terminal response is in `github-response-3.json`. The watcher used 3 of 10 GitHub calls, including the initial unreadable discovery response. Subsequent discovery and terminal polling were over 300 seconds apart. No workflow failure, failed-job log download, rerun or generated-view exception was needed. The watcher exited 0.

## Terminal result and custody

- Product: READY on `cloud/sx-glove-c-f249-pc1` at `76349e7c883f8e775cdd784f45b6f2a5aa95384f`.
- PR: none created; no PR requirement was present in the repository instructions.
- Blockers: none.
- Authored clause-status, Gap, Evidence and CLAIM changes: none. COMM-014 remains Partial. Main's four newer Done judgments (COST-001, BOOK-017, QUOTE-002, SURFACE-015) are retained. Counts move from the original candidate's 43 Done / 191 Partial / 29 Missing to current main's 47 / 187 / 29, total 263.
- All intended inbox content is returned as a POST line in the final message; no INBOX.md or STATE.md was read or written.
- Evidence is published separately to `refs/heads/evidence/sx-glove-c-f249-pc1` using explicitly selected regular files from this packet. The printed EVIDENCE line identifies the report-only commit independently from the product SHA.
- READY is product CI custody, not acceptance, publication-scan completion or landing. The fleet Mac retains the publication scan and landing work. This cloud task did not push or fast-forward main.

## Packet inventory

`REPORT.md` is the complete plan and narrative result. `receipt.json` is the actual machine-readable product/check receipt. `typecheck.log` and `email-api.log` retain local checks. `contract-before.json` and `contract-counts.json` retain original/main/merged contract observations. `commit-identities.txt` and `commit-messages.txt` retain all candidate commit inspection output. `product-push.log` retains the successful guarded push. `github-calls.jsonl`, `github-response-2.json`, `github-response-3.json`, `verify-latest.json` and `verify-watch.log` retain the actual REST calls, usable responses and watcher diagnostics. The initial malformed response was not retained as valid JSON; its parse error is in the watcher log. No credentials, environment dump, symlink or held-out gate material is selected.
