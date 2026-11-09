# sx-glove-f205fix1 — regression repair report

Product: just-every/run-glove  
Branch: cloud/sx-glove-f205fix1  
Head: 4cb7a67af164eb018628577d9cccf9fe00f2d53c  
Terminal custody: **BLOCKED — final exact-SHA Verify is red**. Product commits are pushed; no READY or landing claim is made. No PR was created; the fleet branch landing path applies.

## Result

CUST-001 now keeps erased field evidence absent while retaining anonymous costing inputs. The portable checkpoint probe opens the actual persisted database and supplies the Web stream its archive reader requires. The edition policy explicitly declares the non-personal glove_meta revision counter as transferred and replaceable. All CUST-001 assertions remain unchanged, and the privacy and portable assertions are preserved or strengthened.

The local api-2 shard passed 60/60 with 0 failures, 0 skips and 0 cancellations on this exact head, under official Node 22.20.0. The portable shard result is **FAIL / local runtime blocker**, exit 1; its complete actual log and receipt are portable-final.log and portable-final-receipt.json. A focused actual-installation checkpoint boundary probe passed: it opened the real migrated persistence root, used the actual edition policy, exported one glove_meta row, validated six archive records through Readable.toWeb, and left the native version unchanged (checkpoint-probe.log and receipt). This is narrower than a complete portable pass. The full portable command stopped in restored-calendar setup at its existing 60-second Vite listener deadline before reaching the changed DATA-001 checkpoint section. No complete portable-green claim is made. These are separate from CI custody.

## Plan and implementation

PLAN.md contains the full plan. Execution followed these steps:

1. Set fleet identity, refresh the authorized launcher, install the decrypted-bundle Git helper/push guard and cleanup hooks, and make a full-history clone.
2. Start at required candidate e9c1c010c1124f6cfc8168a666358019c607beb0 and merge main fcfafa4d17d1ff83fcd75fd89b929a29780397f8. Main's CONTRACT.md and ID map were retained whole; no migration was added or renumbered (the existing highest is 0058).
3. Invoke the prior failed-job archive once, reproduce CUST-001 locally, and repair the live projection without losing financial retention.
4. Correct the destination archive probe and declare the revision counter explicitly. Run the touched API tests, typecheck and requested shards; investigate completed CI failures without weakening assertions.
5. Regenerate/check contract documents with --clauses DATA-001 CUST-001, restore the generated views and source from main, regenerate/check sources.lock.json last, and preserve all finished work through guarded named-branch pushes.
6. Record exact-SHA CI through REST within the ten-call budget, retain actual non-secret evidence, and publish the report packet through the independent evidence ref.

### CUST-001 cause and repair

The command `gh run view 42608851977 --repo just-every/run-glove --job 129131981647 --log-failed` exited 0 with zero output bytes. No archive retry or blob download was attempted. The actual local reproduction is in cust-before.log: CUST-001's "replayed captures never return after erasure" assertion expected an empty live list but received two anonymous material rows.

Prior commit 25e285d39b884d6c61172faa643479b68b18dc1d retained material quantities and catalogue associations as newly identified anonymous capture rows so job costing would survive erasure. Those financial inputs leaked into live state/property-history projections even though their field evidence had been retired. This was unrelated to billing contacts, property ordering or ID allocation.

src/glove/view.ts now removes erased captures from live projections for every role. Stored anonymous inputs remain available to the financial read and business/archive export. The exact financial-cost and peer-preservation assertions still pass. In tests/fixtures/privacy-data.mjs, the exact retained-row shape/new-identity checks now use the business export, and a new assertion requires the erased job's live captures to be empty. The CUST-001 test itself is unchanged.

### Portable cause and repair

glove_meta already existed in migration 0013 and was already replaceable. Its only contents are the installation revision counter. Base's catalogue rejects a missing included/replaceable table with policy_table_missing; the error did not establish an absent policy entry.

The DATA-001 destination probe passed .wrangler/state to Wrangler getPlatformProxy, whose API expects .wrangler/state/v3. It therefore opened another empty database. tests/portable.mjs now uses the same versioned root as the pinned rer portability worker, disables remote bindings, and compares the stored counter with the version observed from the running installation before shutdown. The first repaired CI run got past that assertion and the table/policy checks, then exposed the next adapter defect: readArchive requires a Web ReadableStream and had received a Node fs.ReadStream. The final commit adapts it through Readable.toWeb. All old-archive refusal, archive verification and unchanged-record assertions remain.

scripts/installer/local.mjs explicitly includes glove_meta among the transferred tables and retains its replaceable declaration. The comment records its non-personal classification: retain the counter with the records, replace the destination's migration-seeded counter on import, and do not erase it with an individual customer.

## Verification and counts

| Check | Actual result | Receipt/log |
| --- | --- | --- |
| Before repair: CUST-001 | 0/1 passed; retained anonymous captures violated live-state expectation | cust-before.log |
| Touched CUST-001 + full privacy registrations | 2/2 passed, no failures | touched-api.log; initial-checks-receipt.json |
| Final-head api-2 shard | 60/60 passed, exit 0 | api-2.log; api-2-receipt.json; pinned-runtime-receipt.json |
| Final-head portable shard | FAIL / local runtime blocker, exit 1 | portable-final.log; portable-final-receipt.json |
| Actual installation/policy/archive boundary probe | Passed; six validated archive records and counter unchanged | checkpoint-probe.log; checkpoint-probe-receipt.json |
| Typecheck | Passed | typecheck.log |
| Contract write/check, touched clause arguments | Both exit 0; generated views restored from main | contract-receipt.json; contract-regenerate.log; contract-check.log |
| Source lock | Regenerated last; check exit 0 | source-lock-check.log |
| Test inventory | 202 before / 202 after; same existing 202/200 on main and the prior candidate; no registrations added | inventory.log; inventory-main.log; inventory-candidate-before.log |

The recorded contract counts are unchanged: published 3 DONE / 10 PARTIAL / 0 MISSING (13); target/push-further 38 / 183 / 29 (250); all 41 / 193 / 29 (263). These are existing recorded judgments. No clause Status, Gap or Evidence cell changed. DATA-001 stays PARTIAL with qualified points 1–6 unchanged; CUST-001 status is unchanged. Protected source/views/ID map match merged main: True. CUST-001 test unchanged from the required starting candidate: True.

CLAIM DATA-001 PARTIAL points=1,2,3,4,5,6 tests=tests/api/privacy.test.mjs#DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals
DEFAULT DATA-001: glove_meta is non-personal installation revision metadata; export/import it with the records and retain it across customer erasure.
GAP DATA-001: Existing qualification/release boundaries remain; this fix round makes no additional point 7–8 completion claim.

## CI blocker

First repaired run 42619455401 on 671d2538175fb969ad0220e799bc8609a235b643: api-2, foundation and all four browser shards succeeded. Portable failed at the Node/Web stream mismatch (job 129167833573), repaired in the final commit. api-1 failed COMM-010's authenticated SES callback expectation at tests/api/message-outcomes.test.mjs:168 (job 129167833531): 401 MAIL_EVENT instead of 200. Each completed failed-shard archive was fetched once; both actual logs are retained.

The COMM-010 test, mail handler and harness match main. An independent main worktree probe on fcfafa4d17d1ff83fcd75fd89b929a29780397f8 reproduced the same failure at the same line. The test fixes the Worker clock at 12:00 UTC but creates its SNS certificate at wall time. The actual unchanged certificate fixture receipt records a 13:16 UTC notBefore, later than the fixed verification clock. See main-mail-probe.log/receipt and main-mail-certificate-receipt.json. No unrelated mail/provider code or assertion was changed.

Final run **42621763978** completed/failure on exactly **4cb7a67af164eb018628577d9cccf9fe00f2d53c**, observed at 13:23 UTC in ci-final-poll.json. Its per-job results/logs were not read because the ten-call task budget was exhausted (ci-call-budget.json). The earlier run and main probe establish an existing COMM-010 failure; they do not prove it is the only final-head failure. No green result is borrowed from another SHA. This is not the generated-contract-view exception: contract checks passed locally. Final run: https://github.com/just-every/run-glove/actions/runs/42621763978.

## Runtime recovery and limits

The VM initially left Node 24 ahead of the exact project pin because the supplied shim only replaces an older Node. The first full local api-2 attempt reported a +301-second SNS freshness-boundary timing assertion (200 instead of 401) and an Instant Payout timeout. It was stopped gracefully through its own rer queue PID to correct the runtime; remaining tests were cancelled and never reported passed. api-2-node24-interrupted.log/receipt preserve it. The complete pinned Node 22.20.0 rerun above is the passing API evidence; no tests were skipped, relaxed or deleted.

The first portable attempt lacked outer CI=true and was refused at rer dev's --no-queue check. Subsequent attempts during competing API work hit the existing 60-second cold Vite listener deadline before archive assertions. All actual invocation/cold-start logs and receipts are retained. The final serial attempt's actual result is reported above. Root setup succeeded after warming dependencies (setup-final.log/receipt). No third-party process was stopped and no browser profiles or credentials were copied. No UI source changed, so screenshot proof was not applicable.

## Git and report custody

New commits: 3dbd2a1a6513278fcf62ed65e0d07ea497989961 (main merge/save), 671d2538175fb969ad0220e799bc8609a235b643 (projection/policy/database probe), and 4cb7a67af164eb018628577d9cccf9fe00f2d53c (Web stream adapter). All heads were pushed only to cloud/sx-glove-f205fix1 through cloud-push.py. Every candidate author, committer and message, including side parents, was inspected; fleet identities and allowed trailers only, with no OpenAI/Codex co-author. Hooks stayed active. No published history was rewritten and no default branch was pushed.

No publication scan was run in cloud, as required by the brief; the fleet owns its publication/landing gates. Complete actual non-secret reports and receipts are returned only through refs/heads/evidence/sx-glove-f205fix1. Evidence publication is separate from product acceptance, READY or landing. VALIDATION-RECEIPT.json records the terminal product head and all final local/CI results.
