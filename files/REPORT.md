# sx-glove-f205fix1-pc1 — run-glove continuation

Repository: just-every/run-glove. Product branch: cloud/sx-glove-f205fix1-pc1.

## Scope and plan

The requested work is one continuation merge of the published DATA-001 f205 repair, preserving its claims and tests. The full executable plan is PLAN.md. The source branch was fetched and its required head verified as 4cb7a67af164eb018628577d9cccf9fe00f2d53c. Current main was e1d25590661c95f7f94041c395aa0c34b7b97e3a, containing the synthetic SNS certificate fix 643c6432 or later (actual abbreviated commit 643c643).

The continuation starts at the published source and merges current main without rebasing or force pushing. Only sources.lock.json conflicted. CONTRACT.md, docs/contract/ID-MAP.json and the generated views match main. There were no migration collisions. The documented contract write/check ran with --clauses COMM-001; the generated views were restored from main. The documented edition lock/check ran last after restoring build-only route formatting.

## Product result

The existing ten-file DATA-001 repair is retained relative to main: the glove_meta revision counter belongs to the edition archive policy; erased field evidence is separated from retained anonymous material costs; shared source exports fence peer originals; privacy qualification includes full source rows and objects; the real portability probe opens the destination database and supplies a Web stream to the archive reader. No clause claim or CLAIM line was authored by this continuation.

Compared with the source candidate, main contributes COMM-001 partial → done: 41 done / 193 partial / 29 missing becomes 42 done / 192 partial / 29 missing (263 unique clauses). Compared with current main, all 263 clause statuses are unchanged. DATA-001 and CUST-001 stay partial. Published: 3 done / 10 partial; target: 37 done / 170 partial / 27 missing; push-further: 2 done / 12 partial / 2 missing. These are report counts read from the source table, not edits to generated summary documents.

## Validation and execution findings

- Fleet identity and credential helper installed; repository-preserving co-author hook active and reinstalled after setup.
- Non-interactive setup with pinned RER 0.2.87 passed.
- Typecheck passed; publication check with the first-party profile passed.
- Privacy API test passed its complete set of named scenarios (1 top-level test, zero failures).
- Contract generator check passed. Final source-lock check passed.
- All seven tests in tests/browser/journey.spec.ts passed in Chromium, including privacy erasure and CUST-001 property histories at 1440 and 390. The selected screenshot bytes and hashes are in browser-proof-receipt.json. The full portable shard passed to its green end with CI=true at the original caller (991.01 seconds, including its build). It passed the destination erasure checkpoint, later-journal protection, the documented fresh-offline limitation, anonymous material costs, exact original custody, payment state and replay/reconnection fences.

The first portable invocation stopped at the CLI requirement that --no-queue have CI=true on the original caller. It was rerun with CI=true exported before the full shard, without changing product code, tests or deadlines. An intermediate source-lock check observed generated route whitespace from build; that file was restored and the final documented lock/check passed. Retained logs distinguish those attempts. No private setup log, environment dump, provider keys, native sign-in entry or held-out gate material is selected for public evidence.

## Custody and boundaries

Product merge commit bfb8066c945f939c2baa676e08a03a9b78830014 was pushed successfully on the first guard attempt. Its parents are 4cb7a67af164eb018628577d9cccf9fe00f2d53c, e1d25590661c95f7f94041c395aa0c34b7b97e3a. Its tree 7d99fe1e3f7fd4b7e8e79839d617ed36a330deb3 matches the tested-tree receipt. Every one of the nine candidate commits (including side parents) has fleet author and committer identities and no prohibited trailers. Exact-SHA Verify run 42640480047 was discovered by full-SHA REST lookup: https://github.com/just-every/run-glove/actions/runs/42640480047. Its last observed status is queued; no green conclusion is claimed yet. The initial abbreviated-SHA discovery returned no runs and supplies no CI evidence. All subsequent lookups use the full 40-character SHA and the watcher enforces at least 300 seconds between calls. No PR is required by the repository instructions; none has been opened. No main/default branch push or lane inbox write is performed. The Mac fleet publication scan and landing remain its responsibility. Evidence publication is a separate report-only ref and does not signal acceptance or landing.
