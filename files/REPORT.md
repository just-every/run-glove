# sx-glove-browserflake-1 — browser shard independence

Repository: just-every/run-glove
Requested product branch: cloud/sx-glove-browserflake-1
Lease: tests/browser/** only (specifications and helpers).

## Plan

1. Configure the fleet identity, refresh the launcher bundle, install the required Git credential helper and push guard, and make a fresh full-history clone from main. Read the repository AGENTS.md, CONTRACT.md, ACCEPTANCE.md, and supplied builder rules before implementation.
2. Inspect Verify's browser commands and partitioning, shared setup and teardown, rules.spec.ts navigation and reload handling, and journey.spec.ts reconnect/erasure setup. Determine whether the observed failures are caused by leaked browser context, service workers/cache/storage, incomplete route readiness, or another asynchronous condition. The brief's cause suggestions remain hypotheses until tested.
3. Reproduce the current-main browser-2 and browser-4 shards with one temporary passing browser specification file so partitioning changes. Exercise each failing specification first, middle, and last with its relevant neighbours. Preserve actual commands and results.
4. Fix the demonstrated cause inside tests/browser/**. Use isolated browser contexts or real readiness/cleanup conditions where evidence supports them. Preserve all assertions; do not skip tests or raise a timeout alone. Do not modify src/**, CONTRACT.md, or generated contract views. The dummy test is a temporary proof fixture, not an acceptance claim.
5. Run the touched tests and Verify's typecheck through the prescribed cloud toolchain; retain receipts and before/after registration counts. Preserve any first real commit on the named cloud branch using the push guard after inspecting every candidate identity, committer and trailer. Merge updated main after published saves; never force-push or rewrite published history.
6. Push the tested candidate, discover and poll exact-SHA Verify through REST within the ten-call budget and the 300-second per-run polling interval, and diagnose completed failing jobs only through the authorized archive command. Publish the complete non-secret report packet only to evidence/sx-glove-browserflake-1. Report READY only for the permitted exact-SHA success condition; report a real blocker honestly.

## Recovery and baseline

The required identity and launcher setup completed. The first four full-history clone attempts failed with “Invalid username or token”; the fifth succeeded after the required 15/45/90/150-second backoffs, launcher refreshes, and Git helper reinstalls. The branch was created from main at 2bc83fc9cf947daa7e9befb37169b34e0a650c96. See clone-receipt.json for actual outcomes. No alternate credential was used.

Repository instructions and the supplied builder rules were read. Setup used the prescribed cloud toolchain and subreaper, with the fleet owner email; typecheck passed. The first official browser runner invocation could not launch because the Playwright browser was not installed. Subsequent browser commands explicitly use /usr/bin/chromium with the repository's --no-sandbox configuration.

The unmodified reconnect and Rules/phone-desk tests both passed locally (2/2). The original Rules shard neighbours also passed (6/6). A narrow repeated hash/reload probe passed at ordinary speed and with CDP CPU throttling rate 6. These local results do not claim a deterministic reproduction of the historical Rules timeout.

Historical GitHub failure evidence: run 42474633290, failed job 128713217933, shows Rules failing on its first make/open after companycam, discounts, email, morning-brief, and recurring-billing. The retained log is prior-browser-2.log. The latest attempt of historical run 42474671848 (failed job 128721902169) failed to find its attempt-2 build artifact before browser execution; this is recorded in prior-browser-4.log and is not an assertion diagnostic. Four GitHub calls were used for these historical reads; no blocked archive downloads were retried.

## Implementation

- Desk fixture API routing is attached before owner entry can hydrate the app. The fixture now waits for the rendered desk's completed initial state, instead of treating arrival at /app as hydration readiness. Failure closes its owned page routes and context.
- Rules waits for the actual Rules screen before reloading it, preserving the original post-reload visibility assertion. Both contexts are retained immediately for cleanup. Teardown drains the page-scoped routes that the fixture actually registered.
- Phone-desk and voice-journey helper teardown also drains page-scoped routes before context closure or Worker disposal.
- The reconnect test waits for both original files to be cached before cutting the network, tracks and drains its fixture responses at network/reload/teardown boundaries, and waits for the real erasure/outbox work before testing persistence by reload. Every existing post-reload assertion remains.

An intermediate strengthened reconnect run exposed an actual asynchronous route.fulfill “Route is already handled!” error. After adding cache and in-flight response synchronization, the reconnect test passed three consecutive repetitions. This result is in reconnect-settled/. No error is swallowed or ignored by the fix; assertions remain at the original timeouts.

## Order proof protocol

shard-plan.json records the actual Verify partition commands before and after adding a temporary aaa-order-dummy.spec.ts. Because the dummy sorts first, it moves both originally failing targets to different partitions; shifted browser-2 and browser-4 are still executed in full through tests/browser/run.mjs, including their fresh owned setup/dev installations.

The separate first/middle/last proof runs the complete existing Rules test and the exact reconnect test registration extracted without assertion changes from journey.spec.ts, together with email, morning-brief, recurring-billing, and the dummy. Numbered temporary copies provide deterministic file order with one Playwright worker. Each target runs first, middle, and last across the three permutations. order-plan.json records the ordering and source hashes; reconnect-order-source.ts retains the exact extracted registration and dependencies. Temporary proof files are never committed.

Final validation, product provenance, before/after counts, CI, and evidence custody are recorded below once complete.

Clause status changes: none. No clause work or product UI change is part of this assignment.

## Additional proof findings and corrections

The initial shifted browser-2 payload ran 13 tests: 12 passed and the downloaded signed-quote test was refused by this VM's managed Chromium file:// policy. The test now reopens the exact downloaded bytes through a synthetic HTTPS route, preserving the download, filename, drawn-signature, content, and responsive-layout assertions. Its focused run passed (1/1). This portability change is confined to tests/browser/customer-quotes.spec.ts.

The first product save af7025807cbbca60787603a38a740a24c08ab297 was pushed successfully. Verify 42478827848 failed at the build job's edition source-lock check. The live source checkout's dev server regenerated src/routeTree.gen.ts between restoration and locking, so the saved lock described its generated whitespace variant instead of the committed source. No src/** change was committed. A clean detached worktree was used to run the documented lock and check against the actual committed files; its check passed. The corrected lock is a separate, non-rewritten commit.

The first order trial passed 6/6; the middle trial passed both target tests but failed an email invoice-selection assertion while source regeneration/rebase work overlapped its live dev server. An exploratory deep-link change was tested but is not retained. The final order proof is rerun with the source tree left stable. Trial logs are preserved separately, and these are not described as final passing proof.

## Final candidate provenance

Branch: cloud/sx-glove-browserflake-1
Head: 06373ca0b02e1fbebe3e1526921202d2e22cab50
Base main: 030ad38dfe13717fbc048a885d40ecfb4bde8363
Product commits: af7025807cbbca60787603a38a740a24c08ab297 and 06373ca0b02e1fbebe3e1526921202d2e22cab50. Both pushes succeeded on their first transport attempt. All candidate authors and committers use the fleet identity, with no co-author trailers. No force push, default-branch push, PR, clause edit or publication scan occurred. The final diff consists only of six browser specifications/helpers and their source-lock entries.

The exact candidate source lock passed the documented check in a clean detached worktree (source-lock-receipt.json). Typecheck passed. The changed browser registrations and helper files match the committed candidate; order proof source hashes for Rules and the neighbour specs match HEAD. Browser registration counts are 45 before and 45 after, excluding temporary proof registrations, none of which is committed.

The final shifted browser-4 payload passed 12/12 tests, through the official fresh setup/dev runner. Final order first passed 6/6. Remaining final outcomes will be recorded at completion.

The stable middle permutation passed 6/6, including the original unmodified email spec and both target tests. This supports treating the earlier selection loss during overlapping source regeneration as a proof-run interference finding; the exploratory email change remains excluded from the product. Final order source hashes match the candidate.

Exact-SHA Verify is green: https://github.com/just-every/run-glove/actions/runs/42479100504, completed/success on 06373ca0b02e1fbebe3e1526921202d2e22cab50. Discovery plus one poll used two calls; total GitHub use is 8/10. The preceding save's failed Verify 42478827848 and its source-lock repair are retained above. No failure exception was needed for the final green result.

Final shifted shard results: browser-2 13/13 passed; browser-4 12/12 passed. Both used the official tests/browser/run.mjs fresh owned installation runner and the partition selected with one additional temporary dummy browser file. The targets moved out of these two shifted partitions as recorded in shard-plan.json; their first/middle/last proof is therefore separate and explicit, rather than inferred from shard labels.

## Completed results

All three final order permutations passed 6/6 (18 passing executions, including three temporary dummy executions). Rules runs first, middle, and last; reconnect runs last, middle, and first. The original email, morning-brief, and recurring-billing neighbours pass in each permutation. The final shifted shard payloads passed 25/25 combined. Custom-role, native-call, signed-quote download, typecheck, and clean candidate source-lock checks also passed. Four safe target screenshots retain Rules and technician reconnection at 1440 and 390; provider credential screens and transient downloaded artifacts are not selected for evidence publication.

Browser registrations: 45 before, 45 after. No test was removed, skipped or weakened; no timeout was increased. No clause statuses changed. No PR was required or created. No blockers remain. The historical Rules timeout was not reproduced deterministically in local baselines; the concrete fixture attachment/readiness, response-lifecycle and teardown races were removed and the requested order variants plus exact-SHA Verify passed.

The final report and actual receipts are published separately to evidence/sx-glove-browserflake-1, with product custody remaining on the named cloud branch. Publication does not claim product acceptance or landing.
