# sx-glove-c-f239-pc2 plan

1. Refresh the launcher bundle, install the fleet credential helper, push guard and commit hook; clone only just-every/run-glove with partial blob filtering and full history.
2. Verify origin/cloud/sx-glove-c-f239-pc1 is 44f5bc69836fe1dde3f27c5701c09531b7dcac7f, create cloud/sx-glove-c-f239-pc2 there, and merge current origin/main without rewriting published history.
3. Preserve main's CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and docs/contract/ID-MAP.json exactly. Preserve both sides' tests and resolve actual code/migration conflicts if any.
4. Install the pinned checkout toolchain/dependencies, run the documented contract generator and check with QUOTE-013 as the inherited product clause, restore generated views from main, regenerate sources.lock.json last and check it.
5. Run typecheck and the only candidate-touched non-browser test file, tests/api/quote-link-custody.test.mjs, once. Do not run browser or portable suites locally per this brief.
6. Fetch main immediately before publication, merging again if it moved, repeat contract/lock preservation and required checks for new changes. Audit every candidate commit author, committer, full message and trailer, including side parents. Commit with fleet identity and active hooks, without skip-ci on the final head, then push only cloud/sx-glove-c-f239-pc2 through cloud-push.py.
7. Discover and poll exact-SHA Verify through REST with one watcher, at least 300 seconds between calls for that run and a total ten-call GitHub budget. Inspect completed failures once per failed job, fix within scope where possible, and report exact job IDs for infrastructure/unrelated failures. Never use another SHA's result as the candidate's success.
8. Save complete non-secret results, receipt and logs in this packet; explicitly publish selected files only to evidence/sx-glove-c-f239-pc2. Return product custody, counts and clause status unchanged, exact CI IDs and sx inbox POST line.

Write scope: just-every/run-glove only. No PR is required by its AGENTS.md; the fleet Mac owns landing and publication scanning. No main push, default-branch fast-forward, published-history rewrite or fleet inbox write is authorized.
