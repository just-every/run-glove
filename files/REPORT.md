# sx-glove-c-f153 — PLAN-011 continuation

Candidate: `324e8833e87313c75deaee4f71404e60a055d17a` on `cloud/sx-glove-c-f153` in `just-every/run-glove`. Product push succeeded. No PR is required: this repository runs Verify on branch pushes. The last main integrated was `f2e01ddb2ba371ee5deed4f9391d7ec5cb51f954`. Main was merged after the first published save; no published history was rewritten.

PLAN-011 is claimed DONE for points 1, 2 and 3. Exact-SHA push Verify 42511632383 completed successfully; guarded landing remains pending. No Status, Gap or Evidence cell was edited. The current integrated source counts remain **20 DONE, 214 PARTIAL, 29 MISSING, 263 total**, before and after this candidate. The PLAN-011 row remains PARTIAL in the source pending the lander's judgment; accepting this claim alone would make the counts 21 DONE, 213 PARTIAL, 29 MISSING. The run began with older main counts of 19, 215 and 29; the unrelated increment to 20 came from updated main and is preserved.

## Work completed

The full plan is recorded in PLAN.md. The prior continuation supplied three focused API journeys and an additive segment in the existing Office browser journey. This run retained that work, rebased unpublished commits onto main, installed the publication commit hook, and reran the public-door proof.

An added browser assertion exposed one production defect: once an offer had been emailed, its desk row suppressed a separately recorded outside send. The record and property history were intact. The failing real browser journey reached the saved outside send, navigated back to Dispatch and expected the recorder, method and “delivery not verified” label. It received only the provider-reported email outcome. REPRODUCTION.txt records the nonzero run and exact failure. This was a local acceptance reproduction, not a failed Verify repair.

The two-line component change in `src/ui/booking-offers.tsx:45` renders the provider outcome and the outside-send attribution independently. The same browser journey now checks both records before and after revocation. No sending, delivery, booking or authority semantics changed. The focused lifecycle journey was also extended to replay the original revocation and outside-send commands after an actual Worker restart, in addition to every original offer creation; all saved results remain identical and nothing is disclosed or appended again.

Only `src/ui/booking-offers.tsx`, `tests/api/booking-offer-history.test.mjs`, `tests/browser/due-visits.spec.ts` and the generated source lock differ from integrated main. The harness, mail fakes, existing agreement tests, workflow and contract judgments are unchanged. This run added no registration of its own; the three focused API registrations were carried from the specified continuation head, and unrelated additions from updated main were preserved. The repository has 168 API and 64 browser registration sites, before counting other scripts and generated cases, and no test-budget.json. This pre-existing suite exceeds the generic 200-test cap; the scoped continuation adds no registration of its own and does not delete unrelated assertions to reduce it.

## Frozen outcome rubric

`A1` is `tests/api/booking-offer-history.test.mjs#PLAN-011 lifecycle events retain exact historical attribution after Worker restart without replay disclosure`.

`A2` is `tests/api/booking-offer-history.test.mjs#PLAN-011 emails one transactional on-record link, refuses unsafe issuance and retains authenticated provider states`.

`A3` is `tests/api/booking-offer-history.test.mjs#PLAN-011 property histories show exact offer, outside-send, use, revoke and provider message rows only at their own site`.

`B` is `tests/browser/due-visits.spec.ts#BOOK-002, BOOK-011, BOOK-012, BOOK-013 / PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 / AGENT-008, AGENT-016 Office batch books due visits, records declines and outside sends, the customer chooses an offered slot, the owner follows the brief, and Agent prepares source-linked maintenance flags at 1440 and 390`.

| Item | Acceptance sentence or inherited duty | Public-door proof and location | Result |
| --- | --- | --- | --- |
| R1, point 1 | Created, used, revoked and recorded outside-send events retain person and time in Activity and export without bearer disclosure. | A1, lines 51–114: four native offers, historical role change, public customer choice, revocation, outside-send and exact expiry; exact actor, role, time, offer, job and visit attribution through Activity and export. Real Worker restart and identical command replays preserve the complete snapshots. Lines 35–48 check state, persisted outcomes, Activity, export and captured Worker logs for every bearer and stored hash. | PASS locally on the candidate. |
| R2, point 2, first sentence | Explicit email issuance sends one transactional link to the customer's own address and displays only actual provider states. | A2, lines 116–172: exactly one Postmark transactional request, own address rather than accounts-payable address, show-once response, no-email and integration-token refusals with identical export and no outbound effect; unauthenticated callback refusal, accepted, delivered and bounced facts through authenticated event HTTP. B, lines 452–502, drives the real Email the link control and displays all three states. | PASS locally on the candidate. |
| R3, point 2, second sentence | Outside-send retains method and recorder labelled delivery not verified, independently of provider email. | A2, lines 156–169, checks retained method, recorder and audit deliveryVerified false. B, lines 504–519, records a phone follow-up through the desk and sees both facts on the emailed offer before and after revocation. | PASS locally on the candidate; reproduced defect repaired. |
| R4, point 3, first sentence | Property history lists the offer, outside-send and use or revocation as booking-link rows. | A3, lines 175–223, independently expects each exact row and excludes another property's offer; restart preserves all rows. B, lines 209–217, reads offer, outside-send and use; lines 504–531 read outside-send and revocation at the own property and exclude them at the sibling property. | PASS locally on the candidate. |
| R5, point 3, second sentence | Emailed link appears as a message row with its provider-reported state. | A3, lines 193–220, checks the own message's label, recipient, job and accepted, delivered and bounced status, with no sibling-site message. B, lines 481–502 and 520–531, reads the same real property-history controls. | PASS locally on the candidate. |
| R6, BASE-AUDIT-001 inherited duty | The receiving clause cites the audit duty, and new effects keep attributable public history. | `CONTRACT.md:2421` cites BASE-AUDIT-001. A1 and A2 check event identities and matching export records, including provider outcomes. | PASS locally for this clause's new kinds; no broader DATA-002 completion claimed. |
| R7, CUST-001 and COMM-007 inherited property-history duty | Own-property booking and message history remains isolated and carries honest provider facts. | A3 and B, as above, including two sites of one customer. | PASS locally for the named booking-link rows. |
| R8, COMM provider boundary | The email door uses the configured COMM mail facade with authenticated reported outcomes, without claiming live delivery. | A2 and B use existing unmodified Postmark transport fakes and real callback authentication. | PASS for the permitted network-edge proof. R-9 live provider receipts remain unclaimed. |

Every R1–R8 row passed in push Verify **42511632383**, conclusion **success**, head **324e8833e87313c75deaee4f71404e60a055d17a**, as recorded in CI_RECEIPT.json. The maintained push verification already selects API files through its glob and this browser file through the browser runner. No workflow or verification inventory was changed.

## DONE-RIDERS

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | PASS, push Verify 42511632383 success | R1–R5, all three API journeys and the real Office journey, on the candidate. |
| 2 | PASS | Seeded, nonempty histories with independently expected rows; no-email and integration-token refusals preserve the full export and provider count; an unauthenticated delivery callback is refused. |
| 3 | PASS, push Verify 42511632383 success | Existing push Verify loads the API file and browser journey without a new flag. Both browser widths have actual images; assertions run at 1440, layout checks and proof at both widths. |
| 4 | PASS | API, browser, typecheck, first-party and source checks rerun on full candidate 324e8833e87313c75deaee4f71404e60a055d17a. The build used the same final production source before the test-only replay commit. |
| 5 | PASS | PLAN-011 already cites BASE-AUDIT-001 and names CUST-001 and COMM-007 duties in its acceptance. No new inheritance was invented. |
| 6 | PASS mechanical; judgment cells reserved | Generator write and check both exit 0; restored main's generated views; no contract diff against integrated main. The old PARTIAL row remains for the lander to judge. |
| 7 | PASS | No acceptance point, contract text, ruling, coverage map or judgment was edited. |
| 8 | PASS for the scoped doors | A2's unsafe issuance and unauthenticated callback are refused with no protected effect, while authorized issuance and authenticated outcomes complete. Broader bearer authority and erasure guarantees remain with PLAN-010, whose tests and behavior are preserved. |
| 9 | PASS | Accepted, delivered and bounced mean only what the configured provider reports. Outside sends explicitly claim no verified delivery. No live provider, legal, or R-9 proof claimed. |
| 10 | NOT APPLICABLE | No custody, consent, spending or authority policy default was added. Existing holds remain unchanged. |
| 11 | PENDING GUARDED LANDING | Product branch only. Full-history publication scan, main equality and exact-main Run site remain the fleet's duties. No cloud receipt claims them. |

## Pre-ready self-check

1. All three named points are reached through real commands, HTTP and desk controls. The extra browser assertion failed with the original component and passes with the repair. Exact-SHA Verify is reported from REST, never inferred from the previous round.
2. No existing assertion was removed, narrowed, skipped or hidden behind a width condition. The browser diff changes only imports, the screenshot helper's optional region capture and additive proof.
3. Current integration authority and callback authentication are exercised with no-effect refusals. Actual Worker restart and captured command replays do not disclose or append data. Used and revoked bearers are refused by the public door. Broader erasure, archive and offering-person authority obligations remain owned by PLAN-010; this UI-only production change does not alter them.
4. The changed offer uses existing body text, 14px muted text and labelled buttons. No icon-only control or configuration surface was added. Existing Dispatch previous-day tooltip focus proof is preserved. Screenshots at 1440 and 390 show the offer and histories, with no horizontal overflow.
5. Source lock and generated-document checks pass; the full-history publication scan and Run site have not run in this cloud task and are not claimed. New fixtures construct synthetic addresses without email-shaped literals and use synthetic-glove values. Changed product text has no new prose token that resembles an undeclared GitHub repository. All candidate author, committer and trailer fields were inspected, including merge side parents, before product push.

## Public-door probes

PROBE PLAN-011 1: native agreement offers, public slot choice, explicit revoke and recorded outside-send, followed by Activity and export reads, Worker restart and original command replays -> seven exactly attributable lifecycle events and identical retained snapshots; no bearer or stored bearer hash in state, saved outcomes, Activity, export or captured Worker logs.

PROBE PLAN-011 2: explicit email issuance to the own on-record address, refused no-email and integration requests, unauthenticated then authenticated Postmark callbacks -> one transactional message, no changes on unsafe issuance, accepted then delivered then bounced provider facts, and independent outside-send attribution labelled delivery not verified.

PROBE PLAN-011 3: two sites belonging to the same customer, own and sibling history reads and real desk navigation -> exact offer, outside-send, use or revoke rows and own message provider state; no sibling offer or message leakage; browser proof at 1440 and 390.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses PLAN-011 then check --clauses PLAN-011 exit=0; ledger=none exit=0.

## Custody and boundaries

The provider fakes, harness and existing agreement tests were not edited. No release, account activation, SMS, agent send, automatic outreach, policy hold, runtime pin or Base adoption changed. PLAN-010 and the due-list, batch-booking and decline clauses retain their own remaining obligations. No other clause was started: the extract offers no next unheld bounded assignment after this named continuation.

Publication scan: commit=324e8833e87313c75deaee4f71404e60a055d17a; complete=NOT RUN; historyScanned=NOT RUN; findings=NOT RUN. The cloud branch push is authorized without that scan; the guarded lander must obtain COMPLETE with zero findings before landing. Main equality=false; Run site=not run on this branch candidate. These are landing conditions, not fabricated proof.

Actual command receipts, original local failure, selected bearer-free images and a machine-readable RECEIPT.json are in this packet. Product branch custody and report-only evidence publication remain separate. No report, screenshot, key, environment dump or credential file enters the product branch.

CLAIM PLAN-011 DONE points=1,2,3 tests=tests/api/booking-offer-history.test.mjs#PLAN-011 lifecycle events retain exact historical attribution after Worker restart without replay disclosure; tests/api/booking-offer-history.test.mjs#PLAN-011 emails one transactional on-record link, refuses unsafe issuance and retains authenticated provider states; tests/api/booking-offer-history.test.mjs#PLAN-011 property histories show exact offer, outside-send, use, revoke and provider message rows only at their own site; tests/browser/due-visits.spec.ts#BOOK-002, BOOK-011, BOOK-012, BOOK-013 / PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 / AGENT-008, AGENT-016 Office batch books due visits, records declines and outside sends, the customer chooses an offered slot, the owner follows the brief, and Agent prepares source-linked maintenance flags at 1440 and 390

Final exact-SHA CI observation: push Verify **42511632383**, completed **success**, head **324e8833e87313c75deaee4f71404e60a055d17a**, observed at **2026-11-08T19:01:08Z**. Five GitHub API calls were used in the task, with one watcher and at least 300 seconds between its calls. The prior round's successful run 42509113058 is not used as candidate proof.

Report transport check: fetched evidence head 92556fbdff6538a78fb160ed1a0417265c7c74fd through the supplied entrypoint; report-only tree, manifest and all 37 selected file hashes verified, with product head 324e8833e87313c75deaee4f71404e60a055d17a. This proves evidence transport only. The final evidence head is reported separately after the final CI observation is incorporated.

Final disposition: ACCEPT ON LANDING. Riders 1–9 pass; 10 is not applicable; 11 awaits the guarded lander. No local or exact-SHA CI blocker remains. PLAN-011 is the only plan row proposed for PARTIAL to DONE; all source judgments remain unchanged. No PR was opened or required.

READY repo=just-every/run-glove branch=cloud/sx-glove-c-f153 head=324e8833e87313c75deaee4f71404e60a055d17a
