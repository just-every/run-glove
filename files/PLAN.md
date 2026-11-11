# Plan: sx-glove-c-f241-fix1-pc1

1. Refresh fleet launcher; install decrypted-bundle Git authentication and fleet commit hooks. Clone only just-every/run-glove with --filter=blob:none and no depth limit.
2. Verify cloud/sx-glove-c-f241-fix1 is d053203e969869d09f1949e8549e3e0b3828d5dd. Start cloud/sx-glove-c-f241-fix1-pc1 there and merge current origin/main without rebasing published history.
3. Resolve contract sources from main first; restore CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and docs/contract/ID-MAP.json byte-for-byte from main. Preserve privacy fix, CLAIM lines and all tests. Regenerate contract views and check; restore main's view files. Regenerate and check sources.lock.json last.
4. Set up pinned dependencies, run typecheck and the candidate's touched non-browser privacy API tests once. Do not run browser or portable suites locally, as explicitly instructed.
5. Fetch main immediately before publication; merge again if needed and repeat contract restoration and source lock checks. Inspect all candidate commit identities, trailers and messages. Push only the named product branch through cloud-push.py.
6. Within ten GitHub calls, discover and watch exact-SHA Verify with REST at no more than one call per run per 300 seconds. Read each failing job archive at most once if needed. Require exact-SHA success, allowing only the documented generated-view check exception.
7. Save complete non-secret results and actual receipts outside the product checkout. Publish explicitly selected report files on evidence/sx-glove-c-f241-fix1-pc1. Return product provenance, CI IDs, clause counts/statuses, evidence ref and lane POST line.
