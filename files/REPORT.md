# sx-glove-quote015-cause-1-pc1 report

Repository: just-every/run-glove. Product branch: cloud/sx-glove-quote015-cause-1-pc1.
Product head: cd509b28824d721de6800a6ac4d7209fdadfd887.
Original candidate: 625733332a6b3c9ee4fdd979b371d4f5ce5813e8 (remote head verified exactly).
Merged main: e1d25590661c95f7f94041c395aa0c34b7b97e3a.

## Plan and scope

Follow PLAN.md: fleet setup, untruncated filtered clone, original-head verification, one continuation merge, local touched checks, source-lock regeneration last, one product push, exact-SHA Verify and separate report-only evidence publication.

Created the named continuation at the original published candidate and merged main without rebase or force. No merge conflicts and no migration collisions occurred. Main carries the synthetic SNS certificate clock correction and the newer COMM-001 judgment. No other work was added. The resulting tree differs from merged main in exactly tests/browser/document-print.spec.ts (the original three-line wait for loaded originals before restarting Miniflare) and that file's entry in sources.lock.json.

CONTRACT.md and docs/contract/ID-MAP.json match merged main. ACCEPTANCE.md and docs/CLAIMS.md were restored whole from main after the generator proof; no authored view changes were made. Original candidate commit messages and any claims remain intact. Setup rewrote three blank lines in routeTree.gen.ts; that incidental output was restored before the final source-lock regeneration.

## Clause status and counts

No candidate claim or QUOTE-015 status changed: QUOTE-015 remains done. Main's already-published COMM-001 partial -> done judgment was inherited intact. Relative to the original candidate, full-target counts move from 41 done / 193 partial / 29 missing / 263 total to 42 / 192 / 29 / 263. Relative to merged main, counts do not change. Final core: 42 done / 179 partial / 16 missing / 237 total; agent surface: 0 / 13 / 13 / 26; later: 0.

## Local results

- Fleet launcher refresh, bundle-only credential helper, push guard, fleet identity and clone-local preserving commit hooks installed.
- Real rer setup completed successfully with the required noninteractive fleet owner identity. It built the app, applied migrations, claimed the local first owner and stopped its temporary runtime.
- pnpm typecheck: pass. The shell used Node 24.19.0 for tsc and printed an engine warning; rer setup and the browser journey used the pinned Node 22.20.0.
- Contract write/check with --clauses QUOTE-015: pass, wrote zero documents and confirmed generated views current. Main views restored afterward.
- Edition source lock: regenerated last after restoring incidental setup formatting; check passed for 1606 files. Only the document-print test hash differs from main.
- Touched browser journey ran once, with system /usr/bin/chromium and --no-sandbox in a fresh owned installation: failed at tests/browser/document-print.spec.ts:169. After navigating the invoice for the second phone value (020 7946 0958 ext 7), .document-identity was absent for the 5000 ms expectation timeout. The recorded page snapshot was "Loading document…". This is before the candidate's restart step; that step was not reached. No assertion was weakened or deleted and the run was not retried. See document-print.log.
- Diff whitespace and all candidate identity/message/trailer checks: pass. The scan included all three commits reachable beyond origin/main, including side parents; all author and committer identities are fleet and no co-author trailers are present.

The local browser result is red and remains reported. The brief explicitly requires one continuation push and a fresh hosted exact-SHA Verify, so that push was made without changing or weakening the test. No local green claim is made.

## Product custody and hosted verification

One product push through the cloud guard succeeded on its first attempt. No default branch was pushed, no published history was rewritten, and no PR was required or created. The product working tree is clean.

Verify: https://github.com/just-every/run-glove/actions/runs/42640087695
Exact head: cd509b28824d721de6800a6ac4d7209fdadfd887.
Hosted Verify completed successfully on the exact pushed SHA. ci-receipt.json records all four REST reads. One watcher used a minimum 300-second cadence from invocation start; no failed-job log calls were needed. This is ordinary green Verify, without the generated-view exception. The separate local browser failure remains recorded above. Product status: READY under the supplied exact-SHA Verify contract. No product blockers remain.

## Evidence custody

This packet is separate from the product branch and selected for publication only to refs/heads/evidence/sx-glove-quote015-cause-1-pc1. It contains explicitly selected reports and actual nonsecret receipts. Evidence publication is not acceptance, landing, or product READY. Terminal product status is READY at cd509b28824d721de6800a6ac4d7209fdadfd887. No PR was created. The lane receives the product and report provenance in the final POST line.
