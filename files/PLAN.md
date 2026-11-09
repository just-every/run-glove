# sx-glove-c-f218-pc1 plan

Scope: only just-every/run-glove, product branch cloud/sx-glove-c-f218-pc1.

1. Configure fleet identity, launcher bundle authentication and preserved repository commit hooks.
2. Clone with --filter=blob:none and no depth; fetch main and cloud/sx-glove-c-f218. Verify the published candidate is d2eb4c0cb800e603bcaa98a0319d483c1f2f46e1 and that main does not already contain all candidate work.
3. Start the continuation at that candidate and merge current origin/main without rebasing or rewriting history. Resolve CONTRACT.md to main's newer judgments, ID-MAP to main, generated acceptance/claim views to main; preserve candidate clause claims and CLAIM lines. Renumber a migration only if a collision exists.
4. Regenerate contract documents with any touched clause arguments; run generator check, restore ACCEPTANCE.md and docs/CLAIMS.md to origin/main, and regenerate sources.lock.json last. Run source-lock check.
5. Run typecheck and the candidate's touched tests once. Do not weaken tests. Review the merge diff and all candidate identities and trailers.
6. Commit the merge with explicit fleet author and committer, preserved hooks; push only the named product branch through cloud-push.py. No force push or default-branch update.
7. Discover and watch the exact pushed SHA's Verify using GitHub REST within ten API calls and at most one call per 300 seconds per run. Report failures by run/job identity; read a failed job log once if needed.
8. Save complete actual non-secret results and receipts in this packet. Publish selected files through evidence/sx-glove-c-f218-pc1 separately from product custody. Return the exact product SHA, CI results, clause/count comparisons, evidence line and lane POST line. Mark READY only when the exact-SHA contract is met; generated-view-only failure is the specified lander exception.
