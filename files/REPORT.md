# BOOK-017 qualification

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f214
Candidate: 61fae338ea45bf8fab68fa1b60b1d1c63aaa39c5
Base main: a495723 (full identity is retained in receipt.json).
Predecessor: 629d11606d056eb44d3a95305e106a99ff5e84d8. Its Verify 42597679105 completed successfully, observed through REST. That success is predecessor evidence only.

The predecessor's unfinished public-door proof was rebased onto current main and preserved as f19be339bd9e289cfe2b2d3496993bb2ad01d99d. A recovery save was pushed with CI skipped. The earlier candidate a1363930c00e9d3ba4e2234ae810db10aa050e28 additionally refuses incomplete Booking records with the same generic refusal used for wrong credentials and races two distinct admitted source records, checking that exactly one complete record wins and remains unchanged on replay and restart. The fixture factory is unchanged. The final browser proof waits for hydration-triggered reads to settle after its two reloads, retaining all assertions and their original timeout. No production repair, acceptance rewrite, status judgment, generated view, workflow, migration, runtime pin or unrelated writer's work was changed. The BOOK-014 matching, BOOK-016 pipeline and customer merge assertions are preserved.

The complete plan is in PLAN.md. The only plan row proposed for the lane is BOOK-017: PARTIAL to DONE after its independent gate. No other clause is claimed. BOOK-004 retains provider replies, Yelp response duties, Google booking server, feed, notification, update and cancellation obligations. BOOK-015 retains cost and acknowledgment execution responsibilities. Nothing in this intake qualifies a live Google account or sends a reply.

Source judgments remain 41 DONE, 193 PARTIAL, 29 MISSING before and after. The independent lander owns any resulting count change. Test inventory is 202 before and after, with zero added registrations: main's archived tests independently reproduce the same 202/200 overage. Each nearby API file already has one registration, so no duplicate was removed and no unrelated flow was combined to reduce the count. This pre-existing inventory issue is reported to the lane.

## Acceptance proof

Every acceptance and inherited-duty row below has final Verify event push, run 42611236930, observed in_progress with conclusion null on the exact final head. No row claims completed green CI. All API rows use tests/api/lead-matching.test.mjs, the existing registration “BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart”. Its successive named steps are the BOOK-017 point N scenarios. Each API row ran through the actual production Worker with native authentication and durable D1. The existing browser registration is tests/browser/journey.spec.ts, “BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017 Reserve with Google request intake and external-send attestation at 1440 and 390”.

| Row | Acceptance sentence or inherited duty | Door and independently asserted result | Proof |
| --- | --- | --- | --- |
| P1 | Documented Booking records enter the authenticated receiver. | Owner-issued Basic relay credential admits the unchanged factory Booking, retaining the customer identity and one request. Wrong password, different username, missing credential and incomplete bodies yield the generic 401 with unchanged state; disconnected source yields 404 without a write. | API point 1 at line 233, PASS locally. |
| P2 | Owner-connected relay is request intake, with no Google server or inbound notification claim. | lead.connect succeeds only for the signed-in unscoped Owner. Office, Dispatcher, scoped Owner, custom role, integration token and signed-out calls are refused without a change. Intake returns only an acknowledgment receipt; records and Activity contain no booking-server claim. Existing screen explains the relay and absence of booking activation. | API point 2 at line 269; browser line 1233. |
| P3 | Exact source identity and slot facts remain without scheduling or reply. | Actual Worker shutdown and restart retain booking identity, merchant, service, start, duration and source status byte-for-byte. Jobs, visits and messages remain empty; calendar calls, pushes, outbound attempts and sent mail do not increase. | API point 3 at line 299, PASS locally. |
| P4 | Booking price is not lead cost and no cost is invented. | Both admitted statuses retain no leadCost. Slot and user facts do not become cost. Business export lacks leadCost, Activity has no cost correction, and the receipt fact has null cost. | API point 4 at line 316, PASS locally. |
| P5 | Only confirmed or pending records are admitted; updates and cancellations are unsupported. | Cancellation and five other unsupported status values yield 401 without changes. A changed slot, merchant, service and status for an admitted identity does not replace the first request. | API point 5 at line 340, PASS locally. |
| P6 | First record wins, including concurrent retries. | Two distinct source records for one fresh ID are posted concurrently. Exactly one request and one lead.received fact land, with one complete input's facts. Both replay variants and later changed duration preserve the winner after restart; Activity and export each have one receipt per identity. | API point 6 at line 355, PASS locally. |
| P7 | Slot start is not creation time; due time begins at receipt. | Fixed Worker clock at 2030-03-10 12:00Z and unedited factory clock producing a slot five days later retain exact creation and receipt time, queued status and 12:37Z acknowledgment due, never slot creation. | API point 7 at line 383, PASS locally. |
| P8 | No live integration claim. | Owner connection screen and generated documentation expose the bounded intake. Activity and business export attribute each receipt to Reserve with Google lead feed, including actor, time, identity and subject. Neither door password appears. Credential rotation and disconnect refuse old access; accepted captures replayed after personal erasure and restart resurrect nothing. | API point 8 at line 397; browser line 1233; docs/lead-sources.md inspected. |
| D1 | BASE-DATA-004 outbound duty, cited in BOOK-017. | Intake creates only internal request and acknowledgment records, with no new outbound attempt, message, mail, calendar write or push. No live provider compliance is inferred. | API points 1, 3, 4, 6 and 7, PASS locally. |

PROBE BOOK-017 1: POST authenticated recorded Booking -> 200 and exactly one request; wrong or missing credentials, incomplete bodies and disconnected source -> refusal with unchanged state.
PROBE BOOK-017 2: lead.connect as Owner and excluded actors -> Owner receives relay credential; every excluded actor is refused without a write.
PROBE BOOK-017 3: fresh state after actual Worker restart -> exact booking facts retained; no scheduling or outbound effect.
PROBE BOOK-017 4: confirmed and pending Booking POST -> leadCost absent in request and export; receipt cost null.
PROBE BOOK-017 5: cancellation, unsupported status and changed-slot POST -> refusal or unchanged original request.
PROBE BOOK-017 6: two distinct concurrent records, both retries and post-restart replay -> one complete winning request and one receipt fact.
PROBE BOOK-017 7: future slot at fixed receipt clock -> created and received at 12:00Z; queued acknowledgment due at 12:37Z.
PROBE BOOK-017 8: Activity and business export -> provider attribution retained without relay password; revoked access refuses and erased capture replay preserves tombstones.

## Local checks and mechanical receipt

The touched API command passed all three registrations, with zero failures or skips: node --test --test-concurrency=1 tests/api/lead-matching.test.mjs tests/api/merge.test.mjs tests/api/pipeline.test.mjs. Typecheck and the first-party profile passed. Actual outputs are in api.log, typecheck.log and first-party.log. The API run preceded the commits; its relevant API test and source bytes are exactly those on the final candidate. The subsequent browser-only lifecycle change does not change that API proof. The successful final browser run executed on the final committed head. receipt.json binds those files by SHA-256 to this candidate.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then node scripts/edition-authoring/cli.mjs check exit=0; views=node scripts/contract-docs.mjs write --clauses BOOK-017 then node scripts/contract-docs.mjs check --clauses BOOK-017 exit=0; ledger=none exit=0.

The generator wrote zero views and its check passed; both generated views were restored whole from main. CONTRACT.md is unchanged, including every Status, Gap and Evidence cell and all 263 Status rows. Lock hashes were generated by the documented tool. No migrations changed. The final pre-push fetch reported main already merged. All three product pushes passed the complete candidate author, committer, message and trailer inspection; every candidate identity is the fleet identity and no co-author trailer is present. No branch was force-pushed, and main was never pushed.

Initial setup hit the 60-second cold development-listener deadline. The warmed setup, run with the pinned Node runtime after touched API processes exited, passed without source changes. An intervening setup attempt was correctly refused because the pipeline process owned the checkout; no process was killed to bypass that custody guard.

## Riders and pre-READY assessment

| Rider | Result | Evidence |
| --- | --- | --- |
| 1 | Local behavior PASS; exact candidate Verify tracked separately. | P1 through P8 and D1 above; all dangerous allowed and refused paths execute. |
| 2 | PASS. | Nonempty requests, exact exported receipts, unchanged-state refusals, distinct concurrent values and actual restart; API scenario steps beginning at lines 233, 269, 299, 316, 340, 355, 383 and 397. |
| 3 | CI pending at initial report. | Push Verify 42611236930 on the exact final candidate; api and browser test globs in existing verification.json. Final observation is in ci-final.json. Earlier run and failed-job diagnostics are retained separately in ci.json and the two ci-job logs. |
| 4 | PASS for API; browser recorded against candidate. | Source and test hashes in receipt.json; final code diff has no production change. |
| 5 | PASS. | BOOK-017 meta cites BASE-DATA-004 and D1 performs its intake outbound boundary. |
| 6 | PASS mechanically; judgment intentionally retained. | Generator write and check exit zero, no source judgment edits, restored main views. Lander owns the stale copied family Gap. |
| 7 | PASS. | Acceptance text, point count and coverage unchanged; no policy or clause rewrite. |
| 8 | PASS. | Point 2 exercises actual Owner and every excluded principal; points 1 and 8 cover revoked and disconnected credentials. |
| 9 | PASS. | Network-edge and recorded-shape proof only; existing screen and docs explicitly deny live integration and booking-server completeness. |
| 10 | INAPPLICABLE. | No new custody, consent, spending or authority default adopted. |
| 11 | PENDING guarded landing. | Main equality, complete publication scan and Run site are fleet duties. This cloud run claims no landing receipt. |

Pre-READY: every native acceptance outcome is exercised through a public door, with unsafe authorization, replay and erasure paths covered. No existing assertion was removed, narrowed, skipped or hidden behind a condition. No production screen changed and the existing connection panel has no icon-only controls. The focused browser journey records the required screens at both widths. The source lock is fresh. Exact-SHA CI remains independently observed. Publication scanning and main Run site remain the maintained lander's gates, and no scan result is invented.

Publication scan status: {"commit":"61fae338ea45bf8fab68fa1b60b1d1c63aaa39c5","complete":false,"historyScanned":false,"findings":null,"reason":"not run in cloud; maintained fleet lander owns the full-history scan"}.
Main equality: false, branch-only candidate. Run site: not started here; main-only landing workflow. PR: none required; branch push starts Verify.

## Final results and custody

The final exact-head Reserve browser journey passed one registration at both required widths in 54.8 seconds. All sixteen actual screenshots from that existing combined journey are retained, including the connection panel, queued request, external-send attestation, generated documentation and preserved Yelp follow-through. The 1440 connection panel, 390 connection panel and 1440 queued request were visually inspected: the bounded relay disclosure is visible and the saved password is absent. No production screen was edited.

The first fresh browser installation failed its pinned launcher's 60-second listener handshake before assertions. A managed candidate run then reached the 1440 connection panel but observed Loading your work after a bare reload; the same missing pipeline assertion reproduced in the direct target run. A later managed attempt again timed out before assertions. The final declared Vite target was started directly on loopback, using the package's existing developmentTarget, readDevKey, resolvePersona and openUrl helpers. Its native owner key stayed in memory. The test's two reloads now wait for pending page requests to settle. No assertion, assertion timeout, case, width, route, authorization check or provider edge was removed or relaxed. That final run passed. All owned contexts, browsers and Vite target were closed; the successful direct runner exited zero.

The production build, typecheck, first-party profile, contract generation, generated-document check and source-lock check passed. The final source lock was checked again immediately before publication. The final main fetch was already merged, and remote branch custody was independently read with ls-remote and matched this full final SHA. The source checkout was clean before evidence publication.

Final candidate Verify: run 42611236930, event push, exact head 61fae338ea45bf8fab68fa1b60b1d1c63aaa39c5, last observed in_progress with conclusion null. This is pending CI, not a green claim. The cloud handoff follows the named branch-only route; the maintained fleet must enforce exact-head Verify, publication scanning and guarded landing.

Earlier candidate Verify 42608659219 at a1363930c00e9d3ba4e2234ae810db10aa050e28 completed failure. Its API shards, foundation, portable and other browser shards passed, but two unchanged browser fixtures failed. Job 129131281930, browser-4, failed COMM-010 points 5–7 at tests/browser/conversation.spec.ts:250 with “route.fulfill: Route is already handled!”. Job 129131281948, browser-2, failed QUOTE-015 document printing at tests/browser/document-print.spec.ts:147 with “TypeError: fetch failed”, caused by “SocketError: other side closed”. Each failed job archive was read once through the prescribed gh run view command. The exact sanitized command and diagnostics are retained in ci-job-129131281930.log and ci-job-129131281948.log. All production sources, both failing fixture files and their shared API harness are identical to main on that earlier candidate. No change to those fixtures was made, no successful main replay is claimed, and no Verify repair receipt for those unrelated failures is invented. They are handed to fv for CI fixture triage. No workflow rerun or dispatch was issued. GitHub calls used: nine of ten.

The only product changes in the final branch are the BOOK-017 API proof in the existing BOOK-014 registration, the existing Reserve browser journey's reload lifecycle, and the generated source lock. No PR was required or created. No provider activation or publication is authorized or claimed. No native BOOK-017 outcome remains unproved locally; riders 3 and 11 retain the independent CI and landing conditions.

CLAIM BOOK-017 DONE points=1,2,3,4,5,6,7,8 tests=tests/api/lead-matching.test.mjs#BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart; tests/browser/journey.spec.ts#BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017 Reserve with Google request intake and external-send attestation at 1440 and 390

