# sx-glove-c-f122 — signed customer-copy qualification

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f122
Candidate: 04f91418c06f984a84124840c3ded212aa8a0184
Base main: 2bc83fc9cf947daa7e9befb37169b34e0a650c96
Predecessor replayed: f0be713bf60cde70c4329d66914c8642d6230e96
PR: none; the existing push workflow covers this branch.

## Result and scope

QUOTE-011 point 1 is fully exercised locally. Its single acceptance point requires an immutable self-contained HTML copy with original images and signature, a verified SHA-256, and identical bytes from the desk and live customer-link readers. The recovered journey now proves all of those outcomes, including durable restart, later edits, unsafe reads, replay and the explicitly requested at-rest corruption. No defect in production signing or public quote code was exposed, so no production source was changed.

The predecessor's unfinished test and harness changes were replayed onto current main. Its stale source lock conflicted and was regenerated from the combined tree; no hashes were hand-edited. Non-secret diagnostic lines report observed copy sizes and chunk counts. All newer main work remains intact.

Product files changed: tests/api/customer-quotes.test.mjs, tests/api/harness.mjs, sources.lock.json. No acceptance text, Status row, Gap, Evidence, count, generated view, workflow, package pin, homepage, logo or screen was changed.

## Full execution plan and results

1. Read launcher instructions, the repository instructions, the full QUOTE-011 clause and its Status Gap, signing implementation and readers, existing API journeys, inline plan extract, rulings and DONE-RIDERS.
2. Replayed f0be713bf60cde70c4329d66914c8642d6230e96 onto main 3db9c3ec9cdad3f66b4b809b05126264fce2d38d; regenerated the conflicting source lock while keeping main's contract judgments and all unrelated work.
3. Ran the entire touched customer-quotes API file: the initial eight registrations passed on Node 24 and Node 22.20.0, then the final seven registrations passed on Node 22.20.0 after folding the new proof into the existing signing journey without dropping any assertion. The final tree is the committed candidate; no relevant bytes changed after the final run. Typecheck and first-party profile check passed.
4. Ran the documented contract write and check, restored ACCEPTANCE.md and docs/CLAIMS.md from main, regenerated sources.lock.json last and passed its check.
5. Committed under the fleet identity with hooks active; fetched main and rebased (already current); passed the lock check and checked all candidate authors, committers, full messages and trailers. All candidate authors and committers are the fleet identity and no trailers are present. Pushed only the named branch through the supplied cloud push guard, successful on its first attempt.
6. After the first product publication, a test-budget audit found an existing over-cap legacy suite. Folded the entire new proof into the existing signing journey, retaining every assertion and adding zero registrations. Fetched and merged newer main 2bc83fc9cf947daa7e9befb37169b34e0a650c96 without rewriting published history. Retained its newer COMM-016 judgments and mail tests. Regenerated contract views, restored main’s generated views, regenerated and checked the source lock after the merge (no additional diff), and pushed the merged candidate. The signing implementation, public reader, harness and touched test bytes did not change in the merge.
7. Investigated predecessor Verify 42472118922, failed browser job 128705340331, by reading its completed failure archive once. Its failure was tests/browser/rules.spec.ts:136, heading Rules not visible in the Office rule creation step after 5000 ms. Replayed the exact browser-2 shard command on its failed SHA with the CI partition flags, the pinned runtime selected by rer, and the mandated system Chromium. All six journeys passed, including Rules in 52.7 seconds. No speculative repair, test weakening, workflow edit or rerun was made. The same browser-2 command also passed all six journeys on baseline main 3db9c3ec9cdad3f66b4b809b05126264fce2d38d on the same runner; Rules took 49.9 seconds. Both processes completed and their owned dev runtimes stopped.
8. Recorded exact candidate Verify discovery and prepared this separate public report packet. The fleet owns publication scanning, generated status judgments, landing and exact-main Run site.

## Acceptance and frozen proof rubric

All line references below are in tests/api/customer-quotes.test.mjs on 04f91418c06f984a84124840c3ded212aa8a0184; the named journey is “QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 / COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy”.

| Item | Required outcome | Exact proof | Local result |
| --- | --- | --- | --- |
| R1 | Native quote and both signature kinds | Lines 325–376: native document.photo, quote.approve, quote.link, public choose and approve; separate drawn and typed signatures | PASS |
| R2 | Every embedded original is exact and self-contained | Lines 347–361 and 387–395: original-file HTTP reads equal submitted bytes and hashes, then every HTML img decodes to those same originals | PASS |
| R3 | Embedded submitted signature | Lines 396–405: every drawn stroke and point equals submitted coordinates; typed text including markup characters equals submitted text and remains escaped | PASS |
| R4 | Multi-chunk immutable copy and verified manifest | Lines 374–386: manifest hash, size, chunk count, contiguous ordinals and concatenated bytes agree | PASS |
| R5 | Desk and live-link identical original bytes | Lines 413–439: both readers match saved bytes, size and manifest before restart, after actual Worker disposal and recreation with persistent D1, after business/template/price-book edits and after a second restart | PASS |
| R6 | Unauthorized readers remain refused | Lines 423–426: technician desk 403, signed-out desk 401, bearer-less public reads 404, repeated in every phase | PASS |
| R7 | Approval replay stores no second copy | Lines 406–409: exact chunk rows and accepted quote remain unchanged after repeated approve | PASS |
| R8 | Requested storage-corruption defense | Lines 441–453 and tests/api/harness.mjs:215–251: stop Worker, flip one byte with SQLite blob write while preserving size, count and immutability trigger, restart; both readers return 500 SIGNED_COPY; the other copy remains exact | PASS |
| R9 | Attributable command history | Line 440: existing assertTrail proves Activity and business export attribution for photos, price approval, link issue and customer approval | PASS |

Observed drawn copy: 688876 bytes, two chunks, four original images.
Observed typed copy: 688469 bytes, two chunks, four original images.
The test fixes its clock to 2026-11-08T12:00:00.000Z. It uses real production Worker doors and D1; mail is faked only at the existing provider edge. Only the requested corruption is a direct test storage write. No submitted or expected image is seeded through storage.

PROBE QUOTE-011 1: native document.photo, quote.approve, quote.link and public quote approve with each signature -> accepted; four original images match authorized original reads; both signed-copy readers retain their manifest hashes after restarts and edits; unauthorized readers, replay and single-byte corruption behave as required.

## DONE-RIDERS

| Row | Result on candidate | Evidence or boundary |
| --- | --- | --- |
| 1 | Local PASS; exact-SHA Verify recorded below | The one acceptance sentence is performed through native public doors by R1–R8 above, loaded by push Verify api-1 through the existing API glob |
| 2 | PASS | Nonempty native records, independently submitted image bytes and signatures, allowed and refused reads, changed-at-rest hash refusal, unchanged replay |
| 3 | Pending exact-SHA conclusion below | Verify push 42475994158, api-1 includes this file without an opt-in flag |
| 4 | PASS | Final Node 22.20.0 touched run used exactly the source and test bytes committed in this SHA; hashes are in receipt.json |
| 5 | INSPECTED PASS | CONTRACT.md:731 already cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003 and registers R-1 and R-2; no inherited duty was removed or newly claimed |
| 6 | PASS for builder mechanical duties | Documented generator write then check exited zero; generated views restored to main; Status cells and counts remain the lander's judgment |
| 7 | PASS | No CONTRACT.md or acceptance edit; coverage, IDs and all 263 Status rows preserved |
| 8 | PASS in clause scope | Both native accepted copies served; technician and signed-out readers refused in each phase; corrupt bytes refused; existing disclosure, issuer-role, revocation, branch and first-decision tests remain passing in the touched file |
| 9 | PASS | No verified identity, legal validity, provider delivery, archive, consent-policy or deposit qualification is claimed; QUOTE-002, QUOTE-009, QUOTE-010, QUOTE-012, QUOTE-013 and held payment clauses retain their own duties |
| 10 | PASS | No policy default was introduced; no ruling or account dependency was invented |
| 11 | PENDING guarded landing | Candidate is branch-only. Publication scan and exact-main Run site are fleet duties; no scan or landing success is asserted |

## Pre-ready checks

1. Every named QUOTE-011 behavior has a passing observable assertion; wrong embedded bytes, signature content, chunk retention, manifest hash, read authority, replay duplication or corruption serving fail the sanity journey. No mutation suite was added.
2. No existing assertion was removed, narrowed, skipped or conditionalized.
3. Existing unsafe authority, revocation and erasure coverage in the touched file is retained. Replay cannot create another signed copy. Erasure and archive restoration remain owned by QUOTE-013 rather than being promoted by this claim.
4. No screen or UI control was changed; additional screen screenshots and tooltip changes are inapplicable.
5. Source lock is fresh and contract generation passed. Exact candidate Verify, guarded landing, publication scan and Run site are reported honestly below. No new email-shaped fixture string or provider-shaped key was introduced.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write then check exit=0; ledger=none exit=0

## Counts, plan changes and handoff

Current checked-out main has 11 DONE, 223 PARTIAL, 29 MISSING, 263 total. No Status row was edited. Successful acceptance of this QUOTE-011 claim would produce 12 DONE, 222 PARTIAL, 29 MISSING. The report proposes only that plan target row change; the cloud does not edit lane plans.

Test budget: the AST inventory reports 231 registered test cases plus four standalone verification assertion entrypoints on both latest main and the final candidate. This inherited total exceeds the nominal cap. The final round diff adds zero registrations: its complete proof is an unconditional helper inside the existing signing journey. No tests were deleted or weakened; test-count.json records the unchanged per-file counts. No cap raise is requested.

Earlier baseline main's exact SHA 3db9c3ec9cdad3f66b4b809b05126264fce2d38d has green push Verify 42472490387, green main Verify 42473191949 and green Run site 42473192011. Those are baseline provenance, never candidate proof.

Candidate publication scan text: commit=04f91418c06f984a84124840c3ded212aa8a0184 complete=false historyScanned=unknown findings=unknown. Reason: cloud-side scanner unavailable; fleet guarded lander must obtain COMPLETE with zero findings before landing.

Main equality: false (branch-only). Candidate Run site: not run, belongs to the main landing.
CI, main-comparison and evidence-publication receipts are finalized below before transfer.

CLAIM QUOTE-011 DONE points=1 tests=tests/api/customer-quotes.test.mjs#QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 / COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy

Final proof call site: tests/api/customer-quotes.test.mjs:262 invokes signedQuoteOriginals unconditionally inside the existing signing journey registered at line 138. The helper is at line 325. The final candidate has seven tests in this file, all passed.

Round-start counts were 10 DONE, 224 PARTIAL, 29 MISSING. A newer main promoted COMM-016 independently; after preserving that judgment, latest main has 11 DONE, 223 PARTIAL, 29 MISSING. QUOTE-011 alone proposes the additional change to 12 DONE, 222 PARTIAL, 29 MISSING after acceptance.

The predecessor failure was not reproduced on its failed SHA or baseline main; no Verify repair was attempted. This replaces the predecessor’s unqualified blocker with the actual pass receipts and a fresh exact-SHA candidate workflow, without guessing a source fix.

Exact-candidate runtime probe: the existing signing journey was run after the main merge on 04f91418c06f984a84124840c3ded212aa8a0184 with Node 22.20.0. One selected journey passed in 21.4 seconds, including all byte, restart, erasure and corruption assertions; exact-head-probe.log and probe-head.txt bind this receipt to the candidate. All three candidate-history commits passed the complete identity and trailer audit, including the merge.

## Terminal CI and custody receipt

At 2026-11-08T11:35:25Z, exact-candidate push Verify 42475994158 is in_progress with conclusion null on 04f91418c06f984a84124840c3ded212aa8a0184. No green result from a different SHA is substituted. There is one watcher and seven total budgeted GitHub calls, no dispatch or rerun, and at least 300 seconds between candidate discovery and its poll. This is a branch-only qualification handoff to the maintained fleet lander. DONE is proposed for the fully proved point; no status or counts are changed here. Rows 3 and 11 remain fleet gates until exact-SHA Verify, complete scan and landing succeed. No builder product blocker is known.

Evidence publication transfers this packet only. It grants no acceptance, payment, deployment, release or landing authority. The final EVIDENCE line names the exact report-only ref and head.
