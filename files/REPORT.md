# sx-glove-c-f121 — COMM-016

Candidate: c2fb27a6b95ebdc88283a471097a538bd2ab4f34  
Repository: just-every/run-glove  
Branch: cloud/sx-glove-c-f121  
PR: none; Verify runs directly on branch pushes.

COMM-016 point 1 is complete locally, but the terminal claim remains PARTIAL because exact-SHA Verify failed and its failure did not reproduce. No DONE promotion is claimed. No Status, Gap or Evidence cell, acceptance text, generated view, workflow or runtime pin changed. Recorded counts remain 11 DONE, 223 PARTIAL, 29 MISSING; terminal counts remain 11 DONE, 223 PARTIAL, 29 MISSING. All 263 Status rows are preserved.

CLAIM COMM-016 PARTIAL points=1 tests=tests/api/email.test.mjs#COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay

## Full plan and results

1. Read the full target clause and Gap, shipped plan extract, rulings and eleven DONE-RIDERS. The single acceptance point requires all five outcomes. The required continuation base already contained a focused sanity journey, documented provider fixtures and actual Worker restart support. Its assertions covered status, export, restart and replay, but the Activity projection exposed neither provider reference nor occurred time.
2. Retrieve Postmark's public bounce, delivery and complaint documentation. Inactive reports address deactivation; CanActivate reports possible reactivation. TypeCode 4096 guidance explicitly directs readers to those fields. The current final-soft-bounce reading is consistent with that documentation; no mail-callbacks.ts change was warranted. See postmark-documentation.md.
3. Extend the focused journey with independent reference and occurred-time assertions in Activity. Run before production repair: it fails with “delivered exposes its provider reference in Activity.” Preserve the actual failure in regression-before-fix.log.
4. Repair the existing callback fact summary in src/glove/mail-events.ts: include its authenticated provider reference and occurred time. Activity now displays both, separately from receipt time. Structured export data and state folding are unchanged. This small native repair is required for the brief's public Activity outcome even though its file list principally names tests.
5. Run all touched email and privacy journeys, typecheck and first-party check: all pass. Run a one-off browser probe against the existing real app, forwarding browser requests to the actual production HTTP fixture; only provider network edges are synthetic. Assert five exact rows at 1440 and capture Activity once at 1440 and 390. Both screenshots were visually inspected. No credential is displayed; timeline text is 14px and attribution 13px. Activity has no icon-only buttons.
6. Start from full-history continuation 988ba34084bbdb9e131b72a8175f8c3bd35d7c8d; rebase its test commit onto current main. Immediately before candidate commit fetch and rebase again: main remains 3db9c3ec9cdad3f66b4b809b05126264fce2d38d. Generate and check contract views with COMM-016, restore both views from origin/main, then regenerate and check source lock last. Commit with fleet author and committer and active fleet hook. Inspect every candidate commit, including side parents, for identity and trailers. Guarded push succeeds on attempt 1.
7. Repeat the focused point probe on the exact committed candidate: pass. Exact-SHA Verify then failed browser-4 with a Playwright route-handling error in an unchanged offline privacy journey. Read its failed job archive exactly once. Rebuild the candidate and run the exact failed shard: all 14 tests pass. Run the same failed journey once on main in this environment: one test passes. The brief explicitly requires stopping BLOCKED when a failure does not reproduce. No speculative repair, assertion change, CI rerun or dispatch was attempted. Retain actual non-secret reports and receipts outside the product clone and return them only through the separate evidence ref.

No next clause was started. COMM-015, COMM-017, COMM-013 and COMM-014, COMM-010, COMM-018 and COMM-011 retain their own obligations and holds. No live Postmark delivery, provider-account acceptance, automatic resend, release or publication approval is claimed. External field proof register R-9 remains not run; the contract standard says this field proof does not block native qualification. No new policy default was needed.

## Actual local checks

Product commits:
- df0d5e4c73f6db4f77bd2a20d3d8720153bdbc41: rebased focused continuation proof.
- c2fb27a6b95ebdc88283a471097a538bd2ab4f34: Activity reference and occurrence repair.

| Command | Result | Actual receipt |
| --- | --- | --- |
| node --test tests/api/email.test.mjs tests/api/privacy.test.mjs | Exit 0; 11 passed | touched-tests.log |
| node --test --test-name-pattern='^COMM-016 Postmark outcomes' tests/api/email.test.mjs | Exit 0; 1 passed on exact candidate | candidate-probe.log |
| pnpm typecheck | Exit 0 | typecheck.log |
| npx -y @runeditrun/rer check --profile first-party | Exit 0 | first-party.log |
| node scripts/contract-docs.mjs write --clauses COMM-016 then check | Exit 0; zero views changed | views.log |
| node scripts/edition-authoring/cli.mjs lock then check | Exit 0 | receipt.json |
| timeout 1200 node activity-probe.mjs | Exit 0; assertions at 1440, screenshots 1440 and 390 | activity-probe.log, activity-probe.json, activity-1440.png, activity-390.png |

The initial browser attempt encountered the concurrently running typecheck's checkout lock. After that owned process exited, the isolated browser probe passed. No application test was weakened to resolve it.

Relevant source and test byte hashes are in receipt.json. Rebase did not alter those proof files; later generation and locking changed only sources.lock.json. The full touched suite and browser probe therefore exercise the same relevant bytes as the final commit; the focused point probe additionally ran after the final commit. Final touched tests and browser proof used Node 22.20.0 and existing rer 0.2.87. No runtime pin changed.

No assertion was removed, narrowed, skipped or made conditional. This continuation adds no new permanent registration. The retained focused test added by the prior continuation brings top-level API and browser registrations from 163 to 164; a scan including indented registrations finds 195 API and browser registrations.

PROBE COMM-016 1: Owner mail.connect and five email.send commands, then authenticated Basic callbacks at /api/glove/mail/events for Delivery, HardBounce, non-final SoftBounce, inactive SoftBounce and SpamComplaint -> delivered, bounced, deferred, failed and complained respectively. Each exact state, reference and occurrence is readable in Activity and export. Actual Worker restart retains results; replay adds no fact or receipt; unknown bounce returns 401 unchanged. Five sends remain five.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses COMM-016 then check exit=0; ledger=none exit=0.

## Acceptance, brief riders and inherited duties

The named focused test is “COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay” in tests/api/email.test.mjs.

| Item | Passing public-door evidence |
| --- | --- |
| COMM-016 acceptance sentence 1: five mapped outcomes | Focused test lines 350–365 sends one message per independently enumerated outcome; lines 380–400 independently assert exact states and facts. |
| Brief: Activity and business-export provenance | Lines 366–400: credential exclusion, exact structured reference and occurred time, same Activity fact with provider identity, distinct receipt time, readable reference and occurrence. Browser probe reads all five rows. |
| Brief: actual restart | Lines 402–404 compare complete retained results; harness.mjs disposes Miniflare and recreates the Worker against surviving on-disk D1. |
| Brief: replay | Lines 405–408 compare states, messages, Activity, exported timeline and receipt rows after every replay. |
| Brief: unknown bounce Type | Lines 410–413: 401, no state change, no new receipt or fact, no resend. |
| BASE-MAIL-001 truthful mail outcomes | Lines 351–355, 361–365, 384–399 independently check documented statuses and provider references. No live receipt claimed. |
| BASE-OPS-003 idempotency | Lines 402–413 prove restart persistence and unchanged replay with five total sends. |
| BASE-OPS-004 visible failure | Lines 384–399 read bounced, deferred, failed and complaint states and facts; browser probe reads each outcome's literal wording. |
| BASE-SECRET-001 no leakage | Lines 366–374 inspect state, Activity, export and saved outcomes for API key and callback password. Existing Postmark custody journey at lines 266–340 additionally exercises current versus revoked credentials with no rejected writes. |
| Existing privacy fence | tests/api/privacy.test.mjs's “DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals” journey, lines 44–105, erases actual Postmark outcome state and receipts, replays the callback and asserts unchanged timeline. Full privacy file passes. |

## All DONE-RIDERS

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | LOCAL PASS; overall gate unmet | Focused test lines 342–414 reaches and reads all five outcomes. Verify 42474671848 is its exact-SHA push run. |
| 2 | PASS | Independently enumerated expected states; unsigned and unknown-type callbacks refuse without changes, lines 377–379 and 410–412. New Activity assertion fails before repair. |
| 3 | FAIL: overall Verify red | The existing API glob loads email.test.mjs; both API shards passed. Exact run 42474671848 finished failure in browser-4. No workflow or selector change. |
| 4 | PASS | Exact committed candidate point probe passes; receipt.json hashes establish unchanged relevant bytes for earlier suite and browser proof. |
| 5 | PASS, INSPECTED | CONTRACT.md:1216 already cites BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004 and BASE-SECRET-001. |
| 6 | PASS mechanical; bookkeeping delegated | Generator write and check exit 0. No Status, Gap, Evidence, provenance or generated-view edit. Lander writes judged cells and counts. |
| 7 | PASS, INSPECTED | CONTRACT.md is byte-identical to main. No acceptance change, ID rewrite or obligation deletion. |
| 8 | PASS within touched boundary | Owner connection and authenticated callback succeed; unsigned and unknown-type inputs refuse unchanged. Existing Postmark journey tests Office setup refusal and revoked credentials. No authority added. |
| 9 | PASS, INSPECTED | Fakes only at provider edge. R-9 remains not run. No live provider, legal, account or retention claim. |
| 10 | PASS, INSPECTED | No new custody, consent, spending or authority policy default. Existing normalization preserved after documentation review. |
| 11 | PENDING LANDER | Branch-only candidate; main equality, candidate Run site and full-history publication scan remain Mac lander duties. No landed count claimed. |

## Pre-ready self-check

1. Each native outcome has independently expected state and fact through public doors; new Activity regression demonstrably fails without production repair. Exact-SHA Verify is red, so no READY or DONE promotion is claimed.
2. No assertion removed or weakened and no width or branch condition added.
3. Current credentials work; unsigned and revoked credentials refuse without writes. The passing privacy journey proves callback replay cannot resurrect erased data.
4. Both Activity screenshots inspected. Changed timeline text remains at least 13px, controls have text, no configuration or new control was added. No new one-sided border.
5. Source lock fresh, generated views current, first-party check passed. No unperformed scan or candidate Run site is reported as complete.

## CI and landing custody

Candidate Verify run 42474671848, event push, head c2fb27a6b95ebdc88283a471097a538bd2ab4f34: completed failure. Both API shards, browser shards 1 through 3, foundation, portable and build passed. Browser-4 job 128713634442 failed; aggregate verify consequently failed. See ci-jobs.jsonl and ci-browser-4.log.
https://github.com/just-every/run-glove/actions/runs/42474671848

Observed main is 3db9c3ec9cdad3f66b4b809b05126264fce2d38d. Exact-main Verify 42473191949 and Run site 42473192011 are completed success. Candidate is not main. No product PR required.

Publication scan: commit=c2fb27a6b95ebdc88283a471097a538bd2ab4f34 complete=false historyScanned=unestablished findings=unestablished. Cloud adaptation delegates scanning to the maintained Mac lander; no zero-findings claim is made.

BLOCKED: exact-SHA Verify browser-4 failed with “Error: route.fulfill: Route is already handled!” at tests/browser/journey.spec.ts:1169:21. The complete candidate shard passed locally (14 tests), and the failed journey passed on main (1 test). The brief explicitly says to stop BLOCKED when reproduction fails. No production defect has been inferred, no speculative fix made and no permitted-flake rerun claimed. Evidence transfer is report custody only. GitHub budget used: seven calls; no blocked log download retry.

Plan row result: COMM-016 remains PARTIAL; point 1 has complete native local proof, but promotion is withheld for the unreproduced red exact-SHA check. All other rows and holds unchanged. Mac plan and inbox were neither read nor written.

GAP COMM-016: native point 1 passes locally and in its API shard, but overall exact-SHA Verify 42474671848 failed browser-4 job 128713634442; the unchanged offline privacy journey's route-handling error did not reproduce on the candidate or main. The brief requires BLOCKED instead of guessing a fix.

VERIFY_NOT_REPRODUCED: candidate c2fb27a6b95ebdc88283a471097a538bd2ab4f34, browser-4 command exit=0, 14 passed; main 3db9c3ec9cdad3f66b4b809b05126264fce2d38d, failed journey command exit=0, 1 passed. Actual commands and complete logs are in verification-reproduction.json, browser-4-reproduction.log and main-browser-comparison.log. Zero repair rounds.

POST lanes/sx/INBOX.md: sx-glove-c-f121 COMM-016 remains PARTIAL, point 1 locally complete, branch cloud/sx-glove-c-f121 head c2fb27a6b95ebdc88283a471097a538bd2ab4f34. Verify 42474671848 failed browser-4 job 128713634442 with route.fulfill: Route is already handled!; exact candidate shard passes 14 of 14 and main comparison passes 1 of 1. BLOCKED by the brief's non-reproduction rule; no speculative repair or CI rerun. Counts unchanged: 11 DONE, 223 PARTIAL, 29 MISSING.
POST lanes/fv/INBOX.md: sx-glove-c-f121 just-every/run-glove run=42474671848 job=128713634442 browser-4 fails unchanged tests/browser/journey.spec.ts:1169 with route.fulfill: Route is already handled! Full candidate shard rerun locally exits 0, 14 passed; same failed test on main 3db9c3ec9cdad3f66b4b809b05126264fce2d38d exits 0, 1 passed. Not reproduced; no repair or CI rerun. Please triage the CI-only route-handling failure.
