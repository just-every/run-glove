# sx-glove-c-f200 — COMM-010

Candidate: `edff42d711ef67d828990af9a77c8f3196954e52` on `cloud/sx-glove-c-f200`, pushed to `just-every/run-glove`. No PR is required: Verify has a branch-push entry point. The baseline was `592be9edd6258ffb39bed635bb28a1506494ae7d`; updated main `8f4ba9d7955ad22771499ff401fc6f2e1693df6c` was merged without rewriting the published save. The product diff against that main is five files.

COMM-010 is claimed DONE for native acceptance points 1–8, subject to the exact-SHA Verify and guarded landing. Source judgments remain untouched. Initial source counts were 35 DONE, 199 PARTIAL, 29 MISSING. Concurrent DISP-007 landing changed main to 36 DONE, 198 PARTIAL, 29 MISSING. Those latest-main counts remain identical in this candidate; accepting the COMM-010 claim would make 37 DONE, 197 PARTIAL, 29 MISSING. The only plan row proposed for update is COMM-010: PARTIAL to DONE; no plan source or inbox was edited.

## Changes and reproduction

The public command and signed-callback reproduction failed on the original implementation: an accounts-payable bounce disappeared after a later quote email was delivered to the main address. `reproduction.log` contains the failed assertion and nonzero test result. The repair in `src/glove/mail.ts:116` tracks an outstanding warning for each current email address. Refused, failed, uncertain and non-final attempts leave that warning standing. A later delivered email clears only its own address; clearing the newest warning reveals any older warning on the other address. Changing a warned address removes it from the current-address projection. SMS cannot resolve an email warning.

The focused public-door proof also checks provider references in Activity, including the original send answer. The send fact already retained its provider reference in export data, but Activity displayed only its summary. `src/glove/mail.ts:59` now includes the reference in that displayed summary when the provider supplied one. Rejected and ambiguous answers without a provider reference keep null rather than inventing one.

The existing provider-document recovery setup encoded the same cross-address defect. Five additive lines in `tests/api/email.test.mjs:568` first assert that the accounts-payable warning still stands, then explicitly send and deliver a new invoice to that same address before the existing no-warning assertion. No existing assertion, scenario, registration or security boundary was removed, narrowed, skipped or conditionalized.

The new API registration is `tests/api/message-outcomes.test.mjs#COMM-010 points 1–8: committed messages retain honest provider outcomes, address warnings and no resend across Worker restart`. It uses named scenario steps, real commands, D1, production Worker doors and authenticated callback signers. Fakes exist only at provider network edges. The new browser registration is `tests/browser/conversation.spec.ts#COMM-010 points 5–7: desk sees independent address warnings and exact message outcomes after Worker restart`.

## Results

- Focused API registration: PASS, 1 registration, 89.4 seconds of test execution, final test bytes match the candidate.
- Existing email registration: PASS, including its morning, document, callback boundary, Postmark custody and outcome mapping, and SNS custody scenarios. No held helper or provider fixture was edited.
- Browser conversation file: PASS, 2 registrations. The existing COMM-007 journey passed in 55.1 seconds and the new COMM-010 journey in 27.5 seconds. Assertions run at 1440; customer bounce and complaint warnings and document failure states were each captured at 1440 and 390. Actual Worker restart retained the displayed warning. Screenshots were inspected.
- Typecheck: PASS after merging updated main. First-party check: PASS after that merge.
- Test inventory: 198 of 200, including 194 registrations and 4 assertion scripts. Before this round the initial main was 194 of 200; this round adds two registrations, and concurrent main adds two more. No test was deleted or weakened.
- Contract generator write and check: PASS, zero generated document changes. Both view files were restored wholesale from updated main. No contract clause or Status, Gap or Evidence cell differs from updated main.
- Source lock: regenerated last and its check PASS. No migration changed; ledger check is inapplicable.
- All candidate author and committer identities are the fleet identity; no co-author trailers are present. Product pushes used the fleet push guard and succeeded on the first attempt.

The first stock fresh-install browser attempt hit the installer's internal-listener readiness deadline. A direct retry was refused while the existing email test still held the checkout. After that test completed, the already prepared native installation started normally and both browser journeys passed with `/usr/bin/chromium` and `--no-sandbox`. No product change was made for those local runtime conditions. `browser-installation-failure.log` retains the sanitized readiness diagnostic. Browser contexts and only the server processes owned by this proof were closed.

## Frozen acceptance rubric

All API line references below name `tests/api/message-outcomes.test.mjs`. Verify event is push, exact head `edff42d711ef67d828990af9a77c8f3196954e52`, run 42582383828. Its current conclusion is recorded in the CI receipt; local runtime rows below are PASS. Landing remains conditional on the workflow and fleet gates.

| Item | Outcome and public-door evidence | Result |
| --- | --- | --- |
| P1 | Lines 114–160 assert independent expected kinds, subjects, recipients, from address, provider and sender for quotes, invoices, purchase orders and emailed agreement offers. Lines 263–267 inspect nonempty state, saved outcomes, Activity, timelines, business export and captured Worker logs for absent bodies, bearer and credentials. Replay omits the one-time bearer. | PASS locally |
| P2 | Lines 32–44 and 114–160 count exactly one provider request per committed message, check the message delivery ID, inspect committed message and command rows at the provider edge, and assert command replay causes no provider request. Resend's edge records its idempotency key; the other three edges also pause to inspect committed rows before answering. | PASS locally |
| P3a | Lines 203–219 exercise accepted, refused, rate-limited and unknown answers and authenticated delivered, deferred, bounced, complained, failed and rejected events across the four providers. Lines 234–262 open populated message timelines, paginate all Activity and open the business export, checking provider attribution and references without inventing references for refusals. | PASS locally |
| P3b | Lines 164–180 authenticate callbacks and prove same-provider and exact-recipient authorization, unknown-message and other-provider opaque acknowledgments, and unchanged retained state for unsafe or unmatched inputs. Lines 46–55 replay each matched event and compare durable receipts and facts. | PASS locally |
| P4a | Lines 181–198 post older, equal-time and later non-final events after delivery, an older final event after a complaint, and an equal-time final event. Delivery remains final against non-final facts, a later complaint wins, and the first equal-time final fact remains, matching Base ordering. | PASS locally |
| P4b | Line 183 checks the actual displayed delivered claim: recipient mail-server acceptance reported by the named provider. No human read receipt is inferred. Browser line 264 checks that displayed provider wording. | PASS locally |
| P5 | Lines 203–219 and 294–313 assert exact failure text and next action for bounced, complained, failed, rejected, rate-limited and unknown states. Browser lines 269–278 read exact bounced, refused and failed message guidance. | PASS locally |
| P6 | Lines 86–107 exercise two on-record addresses, delivery to the other address, a refused send, later failure, a complaint, separate recovery of both addresses and a changed address. Browser lines 207–307 show bounce and complaint warnings, persistence after restart, same-address delivery recovery and an actual customer-form address correction. | PASS locally |
| P7 | Lines 223–231 open the populated customer conversation and find every sent message by its stable email ID, checking outbound direction, author, recipient and state. Browser lines 263–265 inspect the same actual conversation. | PASS locally |
| P8 | Lines 197–201 require the bounced booking link's revoke-and-new-offer next step and actually revoke the offer before a later fresh one. Lines 270–284 run repeated scheduled passes and every saved command before and after actual Worker shutdown and reopen, proving no new provider request and identical outcomes. | PASS locally |

Recipient boundary clarification: current COMM-013 point 6 explicitly requires a known-message wrong-recipient batch to return the generic 401. Existing landed tests assert that rule. This round preserves it and proves no effect. Unknown messages, other-provider messages and unmatched references, including another recipient on an unknown reference, receive opaque `200 {ok:true}` with no effect. No callback policy was silently changed to satisfy the brief's broader parenthetical phrasing.

## Inherited duties

| Duty | Evidence | Result |
| --- | --- | --- |
| BASE-SECRET-001 | API lines 263–267 check the state, saved command outcomes, Activity, export and captured logs after actual emailed bearer issuance. | PASS locally |
| BASE-OPS-003 | API lines 46–55 and 270–284 check event replay, command replay, repeated schedules and actual Worker restart. | PASS locally |
| BASE-OPS-004 | Exact failure states and next steps at API lines 203–219 and browser lines 269–278. | PASS locally |
| BASE-AUDIT-001 | API lines 234–262 open all Activity pages and business export, matching provider facts, actor, time, command and reference; the job timeline is populated and checked. | PASS locally |
| BASE-MAIL-001 | API lines 164–219 qualify event matching, durable deduplication, terminal ordering and truthful server-acceptance labels. | PASS locally |
| COMM-007 outbound stream | API lines 223–231 and browser lines 263–265 open nonempty histories with author, recipient and provider state. | PASS locally |
| DATA-002 attribution and export | API lines 234–262 and the existing assertTrail helper compare actual attributable Activity events with the export. | PASS locally |
| R-9 field-proof boundary | No live provider delivery, account acceptance or legal claim is made. The clause's network-edge proof is qualified; external field proof remains external. | INSPECTED, no live receipt claimed |

## DONE riders

| Rider | Result and evidence |
| --- | --- |
| 1 | PASS locally: every native outcome is reached by the API rubric and the browser journey above. Exact-head Verify is the remaining workflow bar. |
| 2 | PASS: seeded quote, invoice, supplier order and booking offer are actually sent, and unsafe callback cases return unchanged populated data. |
| 3 | Pending exact-head Verify 42582383828 at initial discovery; both new registrations are loaded by existing push test globs, with no flag or nightly restriction. See the final CI receipt for observed status. |
| 4 | PASS: final API test bytes were run; relevant mail, fixture, customer, document and conversation UI bytes did not change after browser proof. Updated main changed unrelated crew dispatch files. Candidate receipt records relevant file hashes. |
| 5 | PASS, INSPECTED: COMM-010's existing Cites meta line names its Base duties, and its own points name the conversation and export duties. No inheritance was newly asserted through unrelated clauses. |
| 6 | PASS mechanically: generator write and check passed; views restored; source contract and judgments are exactly updated main. Lander writes the final judgment and generated views. |
| 7 | PASS, INSPECTED: acceptance points and contract source unchanged; no ruling or coverage rewrite needed. |
| 8 | PASS for this clause's provider authority boundary: valid authenticated matched events apply; unsigned, wrong-recipient and other-provider events cannot alter protected messages. No staff authority door changed. |
| 9 | PASS: network-edge proof only, no live provider acceptance or R-9 receipt claimed. |
| 10 | PASS, inapplicable: no new custody, consent, spending or authority default adopted. |
| 11 | Pending guarded lander: main equality, exact-main Verify, full-history publication scan and Run site are not claimed by this cloud task. |

## PRE-READY self-check

1. Every named native behavior has a populated public-door check. Exact-SHA Verify is tracked separately, honestly.
2. No existing assertion removed, narrowed, skipped or moved behind a branch or width condition. The corrected existing recovery fixture is additive.
3. Callback authentication, exact recipient scope, wrong-provider isolation, replay and restart are exercised. Existing `tests/api/privacy.test.mjs:30` sends a real email, erases all personal message state, then replays the callback without resurrection; that unchanged protection remains in Verify. No authority or erasure implementation changed.
4. No screen source, CSS, homepage or control was changed. The existing screens were inspected at 1440 and 390; controls used in the journey have text labels and no new icon-only controls exist. Existing unrelated style details remain outside this behavioral round.
5. Source lock is fresh. Publication scan and main Run site remain guarded lander duties. New fixtures construct synthetic addresses rather than adding literal email-shaped fixture strings; provider credentials use synthetic values. No Base or rer pin changed.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses COMM-010 and check exit=0; ledger=none exit=0
PROBE COMM-010 1: email.send plus agreement.offer email:true -> exact safe message metadata; no body or bearer in retained state, outcomes, Activity, export or captured logs.
PROBE COMM-010 2: committed email.send and replay -> one provider request carrying the message ID; replay creates zero requests.
PROBE COMM-010 3: authenticated provider callbacks -> attributable timeline, Activity and export facts with references; replay once; unmatched inputs no effect; known-recipient mismatch is generic 401 under COMM-013.
PROBE COMM-010 4: delivered followed by old, equal and later deferred or accepted facts -> remains delivered; newer complaint -> complained; equal-time final -> first final retained.
PROBE COMM-010 5: refused, rate-limited, unknown, bounced, complained and failed outcomes -> exact message text and corrective next step.
PROBE COMM-010 6: accounts-payable bounce plus delivered main email, refusal and later failure -> warning remains; same-address delivery or customer-form address change -> warning clears; other outstanding address warning survives.
PROBE COMM-010 7: populated customer conversation -> every email is outbound with author, recipient and current provider state.
PROBE COMM-010 8: repeated schedules, replay and actual Worker restart -> identical messages and facts, zero resend; bounced offer -> revoke and make a new offer.

Publication scan receipt: commit=edff42d711ef67d828990af9a77c8f3196954e52 complete=false historyScanned=false findings=unestablished status=NOT_RUN_IN_CLOUD. Full history is present in the product clone. The cloud handoff does not waive that lander gate.

Main equality: false; remote main was 8f4ba9d7955ad22771499ff401fc6f2e1693df6c at the final merge. Baseline Verify 42577457957 and Run site 42577457916 were green on 592be9edd6258ffb39bed635bb28a1506494ae7d; neither is presented as candidate proof. No release, deployment or default-branch push was performed.

CLAIM COMM-010 DONE points=1,2,3,4,5,6,7,8 tests=tests/api/message-outcomes.test.mjs#COMM-010 points 1–8: committed messages retain honest provider outcomes, address warnings and no resend across Worker restart; tests/browser/conversation.spec.ts#COMM-010 points 5–7: desk sees independent address warnings and exact message outcomes after Worker restart

Blockers: none in the product proof. No new policy default or clause hold was adopted. Exact-head CI and the separate guarded publication and landing gates are recorded independently, not replaced by local proof or evidence transport.

Final CI observation at 2026-11-09 08:02 UTC: push Verify 42582383828 is still in_progress with null conclusion on the exact candidate head. Three GitHub calls were used, with one watcher and more than 300 seconds between candidate discovery and polling. No green conclusion, publication scan, main equality or Run site is claimed for this candidate. Per the cloud READY contract, the guarded lander owns those remaining gates.
