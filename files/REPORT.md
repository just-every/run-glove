# sx-glove-f201fix1 — conversation proxy lifecycle

Repository: just-every/run-glove
Branch: cloud/sx-glove-f201fix1
Head: 30350fbcb64c3457c9b890ee88f354473121d919
Start: 6854445708d24dbc80d7372c7acc1cba5f998b6a
PR: none; branch-push Verify is the repository's pre-main entry point.

## Result and cause

Both existing journeys in tests/browser/conversation.spec.ts passed in ten consecutive complete spec invocations: 20/20 tests, one worker per invocation, zero retries. Every original test registration and all 54 expect expressions (including COMM-010's 19) remain identical. No product code, migration, workflow, runtime pin, contract judgment or generated contract view was changed by this task.

The original route.fulfill: Route is already handled! error was reproduced locally on intermediate f934352. Playwright 1.63 removes the handler from its list before waiting in unrouteAll(wait). A completing callback sees the empty list and updates interception patterns; server interceptor removal continues another in-flight route, while its callback may still be awaiting the independent Miniflare response/body. A later fulfill therefore targets an already continued route. A subsequent experiment also timed out in Playwright's wait bookkeeping after our explicit reply drain had completed. Intermediate repeated remove/re-register attempts could miss a customer view, including after eight successful runs; those incomplete sequences are retained and are not counted toward the final ten.

The fix registers each proxy once and keeps it registered for the full browser context. A shared tracker covers h.request, response-body reading and route.fulfill. Parking drains every reply, opens about:blank, then drains any callbacks queued during that transition. Worker restart and context close happen only while parked. There are no unrouteAll calls, ignoreErrors mode, cancellation catches, fabricated responses, private Playwright-state probes or increases to existing test/action/navigation limits. New callbacks arriving during a drain are also awaited.

Before Worker restart the old document is parked on about:blank, preventing new reads during disposal. Both fixtures start a new document after installing the proxy and drain/park every document open or reload. Their intentional in-page scope switches stay live while the held-response assertions run. This fixes the observed initial-view race in which a hash-only navigation could keep native-installation data fetched before proxy installation. COMM-007's intentionally held current and late response assertions remain intact. Teardown releases those holds, parks the document, and closes the browser context and Worker in finally. Both proxy contexts block service workers so that all Glove HTTP requests stay within the intended real harness Worker boundary; these desk conversation assertions do not depend on offline shell interception.

Document opens explicitly await the proxied initial state response and its body, with the existing 30-second navigation deadline, before checking the ordinary app-ready state and conversation loading indicator. A diagnostic captured the otherwise-ready document still showing Loading your work at the new 15-second readiness check; the state-response wait removes that scheduling assumption. Customer selection and log submission also await that existing loading state, except when the journey deliberately holds a reply to assert loading/clearing behavior. These waits replace accidental scheduling assumptions; every original expect expression remains unchanged.

The same real production harness Worker, durable D1, native people and provider-edge fake are used. No Worker double answer was demonstrated.

## Checks and counts

- Ten full spec runs: spec-run-01.json/log through spec-run-10.json/log. Each records this exact head, command, timestamps, exit 0 and 2 passed. No failed intermediate run is counted.
- Typecheck: PASS, typecheck-clean.json/log.
- Source lock: regenerated last before commit and rechecked on the canonical candidate tree after restoring the local dependency originals; PASS, source-lock-clean.json/log. The contract generator write/check also passed without changing a document.
- Setup and build completed through cloud_run; actual sanitized logs/receipts are retained.
- Before → after: spec registrations 2 → 2; expect expressions 54 → 54; COMM-010 expect expressions 19 → 19.
- Contract counts unchanged: 42 done, 192 partial, 29 missing, 263 total.
- Inventory unchanged: 203/200 (199 registrations plus 4 assertion scripts). Its inherited excess returns exit 1 and is recorded honestly; this patch adds no registration or assertion script.
- Clause status changes: none. QUOTE-002's inherited DONE claim for points 1–8 stays unchanged. COMM-010 remains done. No new clause promotion or policy default.
- CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and ID-MAP are byte-identical to the supplied start.
- No full local suite, full local rer verify or publication scan was run. Fleet publication and landing gates remain required.

## Exact-SHA CI and custody

Verify 42623346266: completed / failure on exact head 30350fbcb64c3457c9b890ee88f354473121d919. https://github.com/just-every/run-glove/actions/runs/42623346266

The first real save, 50568a7, was pushed with [skip ci]. The final product branch was pushed through the fleet cloud push guard after local checks, with every candidate author, committer and trailer inspected, including side parents. There was no force push, published-history rewrite, main push or landing. Main was fetched and merged without rewriting published history. The final integration includes main fcfafa4d17d1ff83fcd75fd89b929a29780397f8 and its unrelated branch-projection tests; the complete history is retained. product-push-final.log and receipt.json bind terminal product custody to this head.

Evidence publication is independent of product READY/PUSHED custody. The explicitly selected packet is published only to evidence/sx-glove-f201fix1.

## Blocker and follow-up

The exact-SHA Verify is red for api-1, not for generated contract views. All browser shards, including browser-4 containing the repaired journeys, passed. api-1 failed tests/api/message-outcomes.test.mjs:168 in COMM-010 points 1–8: a callback expected [200, ok:true] but returned 401 MAIL_EVENT. Aggregate verify then failed because selected shards were not all successful. ci-jobs.json, ci-failure.json and the once-per-failed-job archive logs retain the actual evidence. No rerun was dispatched.

The failing API test, its provider fixture and production callback code are unchanged from the supplied start. A local read-only certificate probe confirms that the existing SNS fixture generates an OpenSSL certificate valid from wall-clock time while this API test freezes its clock at 2026-11-09T12:00:00Z; after noon that certificate is not yet valid at the test clock. This is consistent with the SES authentication refusal, but the CI certificate itself was not retained or inspected. callback-clock-diagnostic.json contains only public dates and the probe result. No certificate bytes, private key or callback credential is included. Repairing that separate fixture/callback issue exceeds this one-defect brief, which permits product changes only if a Worker double answer is demonstrated. No such double answer was demonstrated.

Terminal product custody is pushed, but READY is withheld because the exact-SHA Verify has a real assertion failure. The final response must end BLOCKED with this failure, even though the local ten-run route proof passes.

## Local environment and retained diagnostic attempts

The pinned dev launcher repeatedly missed its 60-second initial readiness deadline in this cloud VM; a later startup actually announced its listener after about 70 seconds. Final local runs temporarily allowed 180 seconds for this pre-test bootstrap only. Original ephemeral binding, native dev sign-in, owned-socket verification, health checks, test timeouts and assertions were retained. Installed dependency files were restored byte-for-byte after the local run and before evidence publication. No dependency workaround is committed. local-bootstrap-workaround.json records original/temporary hashes and restoration.

The fixed-port experiment was inconsistent and was restored. Preview attempts did not supply the dev entry expected by this spec. Earlier candidates exposed the initial-view race, reproduced the original handled-route error and exposed the redundant-wait hang. Their actual receipts/logs are retained with their own heads; they do not qualify the final ten. Vite's generated route file changed only three blank lines during runtime startup; that generated formatting was restored and the canonical candidate source lock then checked successfully. The prescribed origin/main generated-view restore produces an older local ACCEPTANCE.md because the supplied published start already carries QUOTE-002’s generated DONE view. That local view copy is never committed. Candidate hashes refer to HEAD, which preserves the supplied claim unchanged; contract-view-restore.json distinguishes the local main-view restore from the checked candidate.

PLAN.md contains the complete execution plan. receipt.json consolidates the actual command receipts, CI observation, counts, hashes and six COMM-010 screenshots (first passing run, once at 1440 and 390). No credentials, environment dump, browser session or held-out gate material belongs to the packet.
