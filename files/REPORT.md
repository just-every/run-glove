# sx-glove-f101fix1 CompanyCam restart repair

The rejected CompanyCam browser journey disposed Miniflare immediately after a page reload and visible-error assertions, while the reload could still have image or API requests in flight. The repair waits for network idle before the existing actual Worker restart. It catches no errors, adds no retries, and retains every original assertion. Only two lines in the browser journey and the generated source-lock hash differ from the rejected head.

Repository: just-every/run-glove. Product branch: `cloud/sx-glove-f101fix1`. Pushed head: `f317342cd1782cacace8bd928c2b427c37d95b90`. Rejected head: `69afc1e0927ad6084459a08c7fffc9b89aa79282`. Base main: `786ecbc4d54e2125f3e96589ecc40f57962825ee`. No PR is required because the branch push starts Verify. No default branch was pushed or changed.

## Scope and clause custody

API-004 stays PARTIAL. Counts remain 7 DONE, 227 PARTIAL, 29 MISSING, with all 263 Status rows retained through every candidate commit and parent. No acceptance point was added or changed. The original candidate's point 7 matrix and contract evidence are retained, with points 1 through 6 and 8 still held. No new clause or plan remainder was attempted. No plan rows changed in this fix round. No DONE promotion or new provider acceptance is claimed.

The named repair commit retains both published commits of the rejected candidate. Main was fetched and integrated before final commit; it was already an ancestor. No published history was rewritten. No generated acceptance or claims view is committed. No product source, UI, dependency pin or workflow changed in the repair.

## Plan and reproduction

The full plan is in PLAN.md. The completed failed browser job was read once with `gh run view 42142634287 --repo just-every/run-glove --job 127646502280 --log-failed`. It reports `TypeError: fetch failed` at the CompanyCam route handler, with `[cause]: Error: read ECONNRESET`.

Before editing, the exact browser shard command `node scripts/verify-ci.mjs browser` was run on the rejected head with the browser shard environment and system Chromium. That initial diagnostic inherited the cloud's Node 24.19.0. Its child finished with 40 passes and three failures outside CompanyCam; the outer command reached its 1200-second alarm and returned 242. The full log and limitations are recorded in full-shard-diagnostic.json and full-shard-diagnostic.log. None of those unrelated tests was changed.

The focused original journey was then repeated five times on the unchanged rejected head using pinned Node 22.20.0, one Playwright worker and system Chromium. It reproduced exactly: three failures with `TypeError: fetch failed; [cause]: Error: read ECONNRESET`, and two passes; exit 1. Main's original journey passed on the same VM using pinned Node 22.20.0; exit 0. See VERIFY_REPRODUCED.json, reproduction.log and main-browser.json.

VERIFY_REPRODUCED

```json
{"head":"69afc1e0927ad6084459a08c7fffc9b89aa79282","job":"shards (browser), 127646502280","command":"node tests/browser/run.mjs companycam.spec.ts --repeat-each=5","test":"tests/browser/companycam.spec.ts:36 CompanyCam project linking, photos both ways once and uncertain-upload reconciliation","exit":1,"failure":"TypeError: fetch failed; [cause]: Error: read ECONNRESET"}
```

## Repair and local validation

The repair adds `await page.waitForLoadState('networkidle')` before `await h.restart()` at tests/browser/companycam.spec.ts:110. Existing reload, restart, nine visible refusals, exact accepted originals, exports, upload counts and Activity assertions remain byte for byte. Assertion counts before and after are identical: 31 ordinary expect calls, one expect.poll call, three assertErrors calls and one actual Worker restart. No test registration, assertion, width guard, catch or retry was added, removed or narrowed. Source-inspection.json checks the exact diff and every candidate parent.

The repaired preview passes the full CompanyCam journey. The exact pushed head's CompanyCam API journey also passes, including restart, file custody, replay and export assertions. Typecheck and `rer check --profile first-party` pass. Source and test bytes relevant to these checks are identical to the pushed head; only the final source-lock update and commit metadata followed the typecheck.

MECHANICAL lock=`node scripts/edition-authoring/cli.mjs lock` and `check` exit=0; views=`node scripts/contract-docs.mjs write --clauses API-004` and `check --clauses API-004` exit=0, then generated views restored whole from main; ledger=none exit=0.

The generated contract check passes after local generation. Restoring main's views deliberately leaves their expected contract-view freshness difference for the Mac lander. The source lock is generated after the restoration and checks clean. The full actual command results are in mechanical.json. No migration changed.

## Exact-head proof and CI

The exact-head browser repetition completed with five passes in five attempts, exit 0, using pinned Node 22.20.0 and system Chromium. The matching API journey passes too. Screenshots after restart and of the later valid original are included at both 1440 and 390 pixels. All owned browser and server commands have finished. Exact-SHA Verify has completed. Its browser, API and portable shards succeeded. Its only upstream failed step is the expected generated contract-document check; the aggregate verify job fails downstream from that step. This is the expressly permitted generated-view freshness exception for READY. The Verify push run is 42148928231 for the full pushed head above. No workflow dispatch, rerun or PR was created. GitHub calls are recorded in github-calls.json, with at least 300 seconds between observations of this run.

## Pre-handoff checks and limitations

All existing assertions are retained; no new test registration is introduced. No authority, erasure, replay or product UI behavior is changed. Existing private-key and refusal assertions remain in the CompanyCam journey. All candidate authors and committers use the fleet identity, and no candidate commit has trailers. The source lock is fresh. Publication scanning, guarded landing and Run site remain Mac fleet gates and are not claimed completed by this cloud task. No status counts depend on those pending gates.

The original Node-24 full-shard diagnostic's three unrelated local failures and outer alarm are retained honestly as diagnostic limitations. The authoritative repair evidence is the reproduced pinned-Node CompanyCam failure, same-runner main pass, repaired exact-head CompanyCam proof and exact-SHA branch Verify.

PROBE API-004 blocking-bar: native Owner imports project 42 matrix, reloads, waits for browser requests, restarts the actual Worker with surviving D1 and reloads -> five of five exact-head journeys pass; nine persisted visible errors, four retained original photos, unchanged export file IDs and original upload assertions; screenshots at 1440 and 390.

## Final CI and handoff result

Exact-SHA push Verify run **42148928231** completed with the expected generated-view exception. Browser job **127667166300**, API job **127667166895** and portable job **127667166359** all succeeded. Foundation job **127667166283** failed only at **Check generated contract documents**; aggregate job **127671780118** fails downstream, and full-push-proof is skipped as a dependency consequence. The unchanged main view was also checked locally at the exact head: exit 1, **ACCEPTANCE.md: generated content differs; run contract-docs write.** The generator's write and check passed before restoring that view as required. No generated view is committed to repair CI.

The exact-SHA browser shard runs the unmodified browser glob and includes this CompanyCam journey. Thus the gate's actual blocking browser bar is closed on the pushed head, beyond the five passing exact-head local repetitions. The full browser shard's success also establishes that the three unrelated Node-24 diagnostic failures do not recur in this candidate's recorded CI. No code or assertion in those tests was changed.

Eight GitHub API calls were used. The candidate run was observed only at intervals of at least 300 seconds, including discovery and completed-job inspection. No workflow was dispatched or rerun.

There is no product blocker. API-004 remains PARTIAL, and no additional acceptance point or clause was attempted. The point 7 restart proof is repaired; all other held points and provider limitations are retained. Counts remain **7 DONE, 227 PARTIAL, 29 MISSING**. No plan row changed. The fleet still owns full-history publication scanning, generated-view regeneration, guarded landing and exact-main Run site.

The full plan, actual reproduction and test logs, mechanical results, CI job receipt, source and identity inspections, remote product provenance and four screenshots are selected explicitly for the separate evidence ref. Evidence publication grants no product landing authority.
