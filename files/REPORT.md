# sx-glove-quote015-cause-1

Repository: just-every/run-glove
Product branch: cloud/sx-glove-quote015-cause-1
Initial main: fcfafa4d17d1ff83fcd75fd89b929a29780397f8
Status: product fix pushed; twenty-attempt comparison complete. Exact-SHA Verify has an unrelated API assertion failure; no READY claim.

## Cause

QUOTE-015 restarts its Miniflare fixture after document visibility and absent-control assertions, while DocumentImage's intercepted original-file requests can still be running. The fixture's explicit mf.dispose() terminates those workerd HTTPS connections, producing fetch failed / UND_ERR_SOCKET (or ECONNRESET); the same retained originals are healthy after restart.

The completed hosted browser-2 job 129120601174 in Verify 42605493250 reported the failure at document-print.spec.ts:147 inside the context.route handler's h.request call, with Miniflare.dispatchFetch and TLSSocket.onHttpSocketEnd / SocketError: other side closed. That shard ran one browser worker, and its other fifteen tests passed. The archived earlier job 129101114984 returned no failed-log output; it is not additional causal evidence.

This fixture has a distinct Worker, D1 directory and automatically bound port. The images are small (logo 199 bytes, photo 1,459 bytes, signature 1,138 bytes). No PDF body or product request handler was changed. The print button finishes awaiting Chromium rendering before the test proceeds. The unsafe lifecycle edge is the explicit fixture restart after the final agreement becomes visible, without waiting for its asynchronous image requests.

A focused public-door probe held a real original-file request for 500 ms in the test adapter, restarted the actual Worker with it in flight, and observed fetch failed / UND_ERR_SOCKET. After restart, a normal read returned HTTP 200 and exactly the original 199 bytes. See inflight-probe.log and inflight-probe.mjs.

## Fix

Wait for loadedOriginals(page) after each pre-restart document becomes visible. This existing helper asserts that no loading placeholder remains and every original image has decoded successfully, so all corresponding intercepted response bodies finish before the test leaves the page or disposes its Worker. Keep the same page, route handler, actual restart and persisted-document PDF comparisons.

All 35 original assertion-bearing source lines are byte-identical after trimming leading whitespace; the committed test registration count remains one. Scope: one test plus its required source-lock update. No product behavior, dependencies, CI workflow, timeout, contract source, generated view or clause judgment changes.

## Experiments and limitations

The repository's fresh-install browser runner was tried first with the default one-worker configuration and system Chromium. The exploratory run completed two journeys successfully, failed two cold Vite page-load assertions before the disposal edge, then was interrupted to replace natural timing with a controlled schedule; fifteen repeats did not run. These are not twenty-run flake counts.

A second attempt used a 300 ms delay before all original-file doors. The complete run that reached restart had no pending request and passed. Other startup/page-load failures and interruptions are kept in the actual logs. The delay was too short to force overlap on this VM.

A production-preview attempt stalled at the initial owner-entry wait, before the document assertions, and was stopped. It is not proof about this defect.

The final controlled comparison runs twenty repetitions of the original test and twenty of the fixed test. Both use Node 22.20.0, pnpm 10.12.4, Chromium 154 at /usr/bin/chromium with --no-sandbox, the same owned frontend and isolated real Worker/D1 per test. Only the agreement's attached-original request in the pre-restart section receives a temporary test-only header that holds them for ten seconds inside the test Worker adapter before it invokes the unchanged production door. This is scheduling control, not a synthesized transport error. An earlier cancellation-based candidate was rejected locally: navigating away from delayed requests caused route.fulfill: Route is already handled!, so the final candidate uses the existing image-loading assertion barrier instead.

The local comparison uses two independent browser workers and a local-only 30-second assertion polling deadline / 600-second journey deadline for slow VM hydration. The published test keeps the repository's original one-worker configuration, five-second polling and 240-second journey deadline; branch Verify remains the normal full check. No diagnostic, temporary adapter or local config belongs in the product commits.

Completed counts (no retries or dropped attempts):

| Version | Attempts | Full passes | Socket-reset failures | Other pre-restart failures | Restarts with active requests |
|---|---:|---:|---:|---:|---:|
| before | 20 | 0 | 19 | 1 | 19 / 19 |
| after | 20 | 19 | 0 | 1 | 0 / 19 |

The fixed version has zero recorded transport failures. Other failures are retained in full in comparison-diagnostics.jsonl; they are page-load assertions before the restart boundary, not evidence of workerd resets. The controlled timing profile and the two-worker local comparison differ from branch CI; CI used the unchanged default one-worker profile and passed all four browser shards.

Type checking, source-lock regeneration/check and git diff --check passed on the clean product worktree. The product diff is only tests/browser/document-print.spec.ts (three added lines) and the corresponding source hash in sources.lock.json. Both commits use the fleet author and committer, have no co-author trailers, and were pushed without rewriting published history. No PR was required or opened under this branch-custody workflow. Clause statuses and generated contract views are unchanged.

Full SHA: 625733332a6b3c9ee4fdd979b371d4f5ce5813e8. Branch: cloud/sx-glove-quote015-cause-1. Commit identities, push receipts and source hashes are retained in candidate-receipt.json, candidate-commit-audit.log, save-push.log, candidate-push.log and source-lock-receipt.json.

## Plan and custody

The complete plan is in PLAN.md. Actual command logs, timing controls, source hashes, assertion-preservation receipt and GitHub-call ledger are explicitly retained in this packet. Product custody and report-only evidence publication are separate. No contract or clause status changes are requested or made. Landing and the fleet publication scan remain fleet operations.

## Exact-SHA CI blocker

Candidate 625733332a6b3c9ee4fdd979b371d4f5ce5813e8 is pushed. Verify run 42618440388 completed with failure. All four browser shards, including target browser-2 job 129164409049, passed; foundation, build, API-2 and portable also passed.

API-1 job 129164408974 passed 80 of 81 registrations and failed the unchanged COMM-010 message-outcomes scenario at tests/api/message-outcomes.test.mjs:168: an authenticated mail callback expected HTTP 200 {ok:true} but received HTTP 401 MAIL_EVENT. The failed job archive was read once, and its complete sanitized output is retained in ci-failed-api.log. No retry, workflow rerun, no-op commit or assertion weakening was used.

Separate source evidence for the lane: message-outcomes.test.mjs freezes the Worker at 2026-11-09T12:00:00.000Z, while snsEvents in the unchanged API harness creates a certificate with openssl req -new -x509, whose notBefore follows wall-clock time. The production mail callback checks that certificate.validFrom is no later than the frozen Worker clock. The hosted failure occurred after 12:42Z. This is outside the requested print-connection defect and was not edited.

A fresh main fetch after the failure still names fcfafa4d17d1ff83fcd75fd89b929a29780397f8. The exact-SHA red check prevents READY under the task's standing bar, despite the successful target browser shard.
