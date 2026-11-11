# sx-glove-c-f256-pc2 plan

Repository: just-every/run-glove. Product branch: cloud/sx-glove-c-f256-pc2.

1. Configure fleet Git identity, refresh the authorized launcher, install decrypted-bundle Git authentication and push guard, read launcher and repository instructions. Keep reports outside the product checkout.
2. Clone with --filter=blob:none and no depth limit. Configure clone identity and preserved repository commit hooks. Fetch main and cloud/sx-glove-c-f256-pc1, verify the prior branch head is 507b08f48ccaf3d03fea89b3b01c245ceb1075ba, and create the named branch there.
3. Merge origin/main without rebasing published history. Preserve main's complete CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md, and docs/contract/ID-MAP.json. Keep both sets of tests. Resolve the lock by regeneration, not hand editing. No migration collision occurred.
4. Run contract-docs write/check with --clauses PAY-010, restore both generated views from origin/main, then regenerate and check sources.lock.json last. Make no clause status, evidence, gap or CLAIM changes.
5. Install frozen dependencies using the cloud toolchain. Run pnpm typecheck and the complete touched non-browser test file tests/api/flows.test.mjs once. Do not run browser or portable suites locally.
6. Fetch origin/main immediately before the product push; merge any update and repeat source/lock reconciliation as needed. Commit with explicit fleet author/committer environment and active hooks, no [skip ci] on the final head. Audit every candidate commit including side parents and trailers. Push only the named branch via cloud-push.py.
7. Use gh api with the injected bundle credential for exact-SHA Verify discovery/polling, one watcher, at least 300 seconds between reads for the same run, within ten GitHub calls. Read each failing job's archive once if needed. Report exact run/job IDs and distinguish product success from evidence delivery.
8. Write actual non-secret report and receipts into packet/. Scan explicit selections, publish only to evidence/sx-glove-c-f256-pc2 via cloud_evidence.py, preserve terminal product provenance, and return the lane POST plus final custody line.
