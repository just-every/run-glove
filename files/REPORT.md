# sx-glove-c-f96

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f96
Pushed candidate: 1e5779205e6e9cae7cd93420cd0f0d80569cb3a6
Main used for the final refresh: 786ecbc4d54e2125f3e96589ecc40f57962825ee
PR: none required; existing Verify runs on branch pushes.

This FIX round addresses only the blocking moved-visit notification assertion at 390px. COMM-007 remains PARTIAL to PARTIAL. Counts remain 7 DONE, 227 PARTIAL, 29 MISSING; all 263 Status rows survive every candidate commit and every parent comparison. No acceptance sentence or policy changes. The earlier human-conversation work is retained and rebased onto main without changing its published original branch.

Plan performed:
1. Reproduce the rejected SHA's browser shard before editing, and record the exact failing assertion and real nonzero exit.
2. Compare the existing paired journey on main on the same VM; inspect actual service-worker behavior, keeping successful and unsuccessful diagnostic results distinct.
3. Harden only the push-service fake's delivery boundary, preserve all existing outcome assertions, and run covering browser journeys, conversation and push API tests, typecheck, build and the first-party check.
4. Refresh main, resolve the contract source first, generate and check its views locally, restore main's generated views, regenerate and check the source lock last, audit all commit identities and parent Status rows, then push the named branch and publish selected non-secret evidence separately.

The product repair is in tests/browser/journey.spec.ts lines 594 and 633–648. The notification browser honors the configured Chromium executable and uses the prescribed sandbox flag. The test attaches to the real service worker, observes one actual PushEvent and checks that the exact decrypted payload reached it before reading native notifications. CDP still delivers exactly once. The original native title, body and job assertion is unchanged at line 648; so are provider signatures, encrypted content, notification settings, reload outcome, visit navigation, call, map and rear-camera assertions. There is no retry, timeout increase, skipped assertion, width restriction or new test registration. Application notification behavior and communication authority are unchanged by this repair.

The carried COMM-007 changes remain in src/ui/conversation.tsx, tests/api/conversation.test.mjs, tests/browser/conversation.spec.ts and its own CONTRACT.md Evidence and Gap row. They bind displayed reads to current scope and authority, clear obsolete or refused bodies, and prove two populated human histories across merge, reload and actual Worker restart. Existing stream, Activity and export assertions remain. Sponsor, grant and company-policy agent logging, complete owning-capability inheritance and every existing account, messaging, payment, Lanyard, Base and runtime-pin hold remain explicit unproved work. No sending, agent expansion, activation, repinning, release or landing is claimed.

Reproduction and diagnosis:
- The exact rejected source 81468c19500f76c0e4d88dfcbeb2fb145e7fb847 ran node scripts/verify-ci.mjs browser with the browser shard's CI environment. The real notification assertion at journey.spec.ts:637 failed: expected Glove, Visit moved and the actual job ID; received an empty array after 5000ms. The command exited 1. There were 42 passing and two failing tests.
- The other full-shard failure was customer-quotes.spec.ts:338: managed Chromium refused a downloaded local document with ERR_BLOCKED_BY_ADMINISTRATOR. This is a local environment limitation, outside the named notification repair; no quote assertion or browser policy was changed.
- The same main source's complete journey file passed all nine tests on this VM, including its 390px notification. The candidate's diagnostic journey file also passed all nine. A full-shard repeat with failure-only observers passed notifications and 43 tests, leaving only that file-opening refusal. This establishes intermittence; it does not establish an application notification defect or a definitive browser cause.
- Isolated actual-worker diagnostics displayed the correct notification in both Chromium builds, including after stopping the worker. Lifecycle alone was therefore not treated as the cause.
- Initial 390px-only diagnostic selections on main and the candidate failed earlier because the existing paired journey uses another technician created by its 1440px case. Those selections are not notification or flake evidence. The valid comparisons ran the complete file.
- The new delivery receipt makes the network fake's input observable before the existing user-visible outcome is judged. The focused final candidate checks pass. The run receipts retain the diagnostic limitations above.

VERIFY_REPRODUCED
{
  "head": "81468c19500f76c0e4d88dfcbeb2fb145e7fb847",
  "job": "shards (browser); gate local rerun",
  "command": "CI=true GLOVE_VERIFY_SHARD=browser WRANGLER_SEND_METRICS=false PLAYWRIGHT_SKIP_BROWSER_GC=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/verify-ci.mjs browser",
  "test": "journey.spec.ts:637, owner, dispatcher, technician and office journey at 390px",
  "exit": 1,
  "failure": "Expected [[Glove, Visit moved, actual job ID]], received []; Timeout 5000ms exceeded while waiting on the predicate",
  "other_failure": "customer-quotes.spec.ts:338: file document navigation refused with ERR_BLOCKED_BY_ADMINISTRATOR",
  "passed": 42,
  "failed": 2
}

Final local results, bound by source hashes in final-local-receipt.json and product-provenance.json:
- Pinned build: exit 0.
- Typecheck: exit 0.
- First-party check: exit 0.
- Public conversation and push API tests: 10 passed, 0 failed, 0 skipped.
- Focused browser proof: 3 passed, 0 failed. It runs the COMM-007 desk journey and both existing 1440px and 390px owner, dispatcher, technician and office journey cases. It checks the added PushEvent receipt and the unchanged native notification assertion.
- Browser proof has 16 selected actual screenshots. Conversation states are captured at 1440 and 390; the technician visit and moved-visit phone are included. Visual inspection confirmed legible populated conversation bodies and controls at both widths and the intended moved visit on the phone. The existing direction badge typography is not a new polish claim.
- No permanent test registration was added or removed by the FIX. No existing assertion was weakened or made conditional. No production authority, erasure, replay, payment, sending or provider code changed in this repair. The carried current-role and branch refusal paths pass, with unchanged exported domain records.

PROBE COMM-007 notification finding: real dispatcher visit.book followed by visit.change, signed encrypted loopback push, actual service-worker PushEvent and native notification read -> one received move payload and the exact Glove / Visit moved / job notification; reload retains the honest provider handoff and the job opens with correct call and map controls. Passed at 390px in the existing public browser journey.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses COMM-007 and check --clauses COMM-007 exit=0; ledger=none exit=0.

The source lock conflict during replay was regenerated, never hand-edited. Main's newer clause judgments and all parent Status rows were retained. The generated ACCEPTANCE.md and docs/CLAIMS.md were restored whole from origin/main and are not part of the product changes. A candidate Verify failure only in generated-view freshness is the documented landing exemption. The lander writes those views. Build-generated whitespace in src/routeTree.gen.ts was restored rather than committed. The final fetch and rebase reported the branch up to date; the final committed lock check passes and the checkout is clean.

The push guard succeeded on its first attempt. All three candidate commits have the fleet author and committer, no disallowed trailers and no Codex or OpenAI co-author. The audit includes every candidate parent. Source hashes match the successful local proof. No credential, environment dump, private gate material or symlink is selected for evidence. All reports stay outside the product tree.

Exact-head Verify: push run 42142564315, initially in progress on 1e5779205e6e9cae7cd93420cd0f0d80569cb3a6. candidate-ci.json contains the latest actual observation. No success from another SHA is used. The watcher queries no more often than once per 301 seconds. No workflow, runtime pin, PR, dispatch, rerun, main push, deployment or release was changed or created.

No DONE claim is made. The full clause's substantive remainder stays in its Gap. Publication scanning, guarded landing, main equality and Run site remain fleet gates; evidence publication alone confers none of them. Plan rows changed: none in this FIX round; relay that the existing COMM-007 human-history qualification is carried and PARTIAL remains. The only requested new result is repair and exact-head verification of the notification bar.
