# sx-glove-c-f250-pc3 results

Repository: just-every/run-glove. Product branch: cloud/sx-glove-c-f250-pc3.

The starting pc2 head was verified as f3c4b53f2a527163a1cff41e0b059a8048d08287. Its two unpublished-to-main commits add the DATA-008 points 1 and 4 privacy qualification fixture and register both scenarios in the existing privacy API test. They are already published on pc2 and were retained without rewriting history.

The complete plan is in PLAN.md. Work follows the assignment: merge current main without rebase, retain current contract judgments and generated views byte for byte, regenerate sources.lock.json last, run the touched non-browser checks, push the named cloud branch through the fleet guard, and verify the exact product SHA using REST. No browser or portable suite runs locally, as explicitly directed by this brief. No UI changes are made and no clause claims or CLAIM lines are added or changed.

The initial merged main was 35f1f12f403d924b1a9cd095583fd21d774dfee2, carrying the CI shard re-plan. The only merge conflict was sources.lock.json, resolved through the documented lock generator. tests/api/privacy.test.mjs merged both sides without a conflict; the candidate's two new scenarios and main's peer-redaction coverage both remain. No migration collision occurred.

CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and docs/contract/ID-MAP.json were restored from origin/main and checked for byte equality. Contract write with --clauses DATA-008 changed zero generated documents and its check passed. Generated views were restored to main after the generator. The edition source lock was generated and its check passed. A route-tree change produced by setup was restored to main rather than included in the product change.

Counts at pc2: 263 total clauses, 43 done, 191 partial, 29 missing. Counts at initially fetched main and the candidate: 263 total, 47 done, 187 partial, 29 missing. The merge preserves four main judgments, partial to done for COST-001, BOOK-017, QUOTE-002 and SURFACE-015. The candidate changes no clause status relative to main. DATA-008 remains partial. contract-receipt.json gives the separate published/target/push-further counts.

Setup completed successfully using cloud_run and the required non-interactive fleet owner email. Actual setup receipt is in setup-receipt.json; its raw private installation output is not part of the public evidence. Typecheck passed using Node 22.20.0 and pnpm 10.12.4. Remaining check and publication results are appended below from actual receipts.

The final pre-push fetch found main had advanced to 9a9426a6470e2fa91f0232a527277b34f033d1ff. Its changes add native Pause journeys and their documentation, with no overlap with the candidate privacy tests. The first merge was retained as intermediate commit 0073336; latest main was merged again and protected documents/source lock were refreshed before final publication. No published history was rewritten.

The product head a821b4dcf7efe59afd060ce9eda985bff84a61eb was pushed successfully on the first guarded attempt. The checkout is clean. All four candidate commits reachable outside main, including side parents, passed identity/trailer review; the inherited owner identities and Anthropic noreply trailers are allowed. The final head has no skip-ci marker. No PR is required by the supplied repository rules, and none was created.

Local checks passed: typecheck (18.87 seconds) and the complete touched privacy API file (145.37 seconds). The file retains its one registered top-level test and all scenario diagnostics. See local-checks.json and the actual test logs. Final contract and source-lock checks passed.

Exact-SHA Verify run: 43010666773, https://github.com/just-every/run-glove/actions/runs/43010666773. Its pending/completed result is recorded in ci-receipt.json when observed.

Terminal product result: READY. Branch cloud/sx-glove-c-f250-pc3; full SHA a821b4dcf7efe59afd060ce9eda985bff84a61eb. Verify run 43010666773 status completed, conclusion success, exact head a821b4dcf7efe59afd060ce9eda985bff84a61eb. 

GitHub calls used: 4/10. Only one watcher polled, at least 301 seconds apart. The cloud did not run the Mac publication scan or land main; those remain with the fleet. Evidence publication is report custody and does not itself establish product readiness or acceptance.

No builder blocker remains. All required observed exact-SHA workflows succeeded.
