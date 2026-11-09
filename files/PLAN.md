# sx-glove-verify-artifact-1 plan

1. Refresh the fleet launcher and configure fleet Git authentication, identity, commit hooks and pinned toolchain.
2. Clone just-every/run-glove from origin/main, read AGENTS.md and the inline RULES.md, and create cloud/sx-glove-verify-artifact-1.
3. Find every verify-build reference. Remove the attempt suffix from both upload/download artifact names; add overwrite: true only to the build upload. Preserve the remaining workflow shape. No product code, contract, generated view or test changes.
4. Run the repository workflow permission lint and actionlint if available as its established workflow lint. Review the exact diff and candidate identities/trailers; fetch main and integrate if needed before publication.
5. Commit using fleet identity with cleanup hooks active, then immediately push the named branch with cloud-push.py. Discover and poll exact-SHA Verify through REST at intervals of at least 300 seconds within ten GitHub calls. Read completed failed jobs once if needed.
6. Save the actual lint, push and CI receipts and complete report outside the product tree, publish explicitly selected safe packet files to evidence/sx-glove-verify-artifact-1, and return product custody plus the sx inbox relay line.

Scope: one workflow edit. No local product tests, application setup/build, browser proof or contract regeneration are required for this workflow-only brief. Publication scan is retained for the fleet Mac as specified by the cloud adaptation.
