# sx-glove-c-f146 — PLAN-011 communication history

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f146
Candidate: f84f1d003c67a1adf8d23199660fa71761caba4e
Merged main: d1d1a15cc01a553a6035a85d9764f102b8c6ff9f
Product save: 3f9bd16; final candidate is a merge retaining updated main.
PR: none; branch push is the existing Verify entry point.

All three native acceptance points pass locally. No production defect was exposed, so production code, existing agreements tests, the API harness and provider fakes are unchanged. The candidate adds the requested focused API file, additive desk journey coverage and the generated source lock. No contract source, status, Gap, Evidence, acceptance sentence or generated view is changed. The requested plan-row change is PLAN-011, PARTIAL to DONE once the exact-SHA and guarded landing gates establish it. Current source counts remain 18 DONE, 216 PARTIAL and 29 MISSING before and after this candidate; no count promotion is claimed before landing.

## Plan and actual results

The full plan is in PLAN.md. The implemented sequence mapped the existing public doors, added focused lifecycle, email and history journeys, extended the real Office desk journey, ran only touched API and browser checks plus typecheck and first-party validation, regenerated and checked contract views, restored both generated views from main, merged current main after the published save, regenerated the lock last, audited both candidate commits and pushed through the fleet guard. Product work contains no report files. The final packet is published separately on the task's evidence ref.

The focused lifecycle test creates used, revoked, expired and outside-sent offers. It checks all seven lifecycle events with independently fixed time, actor, historical role, offer and job; the used event's visit is joined to its associated booking event in Activity and directly checked in the export. It changes the issuing person's role before later events to distinguish historical roles. Exact expiry uses a real fourteen-day-old offer rather than editing durable records. State, command results, Activity, export and captured Worker logs exclude every bearer and separately stored bearer hash. A real Worker restart keeps the records and events identical, and identical commands reveal no bearer or new effect.

The email test sends exactly once through the existing Postmark edge, to the customer's ordinary email instead of its distinct accounts-payable email. The emailed bearer matches the one-time committing response. Missing email and integration-token issuance are refused without changing the complete business export or sending mail. Accepted is the authenticated provider send response; delivered and bounced come from authenticated callbacks, while the unauthenticated callback is refused. The test checks provider-qualified wording, exactly one provider fact per outcome in Activity and export, no replayed send, and honest outside-send method, recorder and unverified delivery.

The history test uses multiple properties of the same customer. It checks exact offer, outside-send, use and revoke rows, exact relevant times and status, one message row with accepted, delivered then bounced state, no peer property's offer or message, and identical rows after Worker restart. The browser drives Email the link, Record as sent outside Glove and Revoke booking link, checks actual provider states on the offer and history, and checks the other property's history. Existing customer-use screens and assertions remain intact. Assertions use 1440; screen proof also captures 390. Eighteen explicitly selected new screenshots are in the packet; prior bearer-display screens and temporary owner-entry material are excluded.

## Acceptance and inherited duty register

| Item | Public door and proof | Result |
| --- | --- | --- |
| Point 1: created, used, revoked and outside-send attribution, time and no bearer | tests/api/booking-offer-history.test.mjs, `PLAN-011 lifecycle events retain exact historical attribution after Worker restart without replay disclosure`, lines 51–110; HTTP commands, public booking, Activity and export; lines 33–48 check all credential surfaces | PASS locally; Verify 42507488266, push event, pending |
| Point 2: on-record email and provider-reported state | Same file, `PLAN-011 emails one transactional on-record link, refuses unsafe issuance and retains authenticated provider states`, lines 112–170; command and authenticated callback doors | PASS locally; Verify 42507488266, push event, pending |
| Point 2: outside-send method and recorder, delivery not verified | Lifecycle test and email test, plus existing Office outside-send controls in tests/browser/due-visits.spec.ts | PASS locally; same Verify pending |
| Point 3: booking rows and emailed message state at the correct property | Same API file, `PLAN-011 property histories show exact offer, outside-send, use, revoke and provider message rows only at their own site`, lines 172–219; site-history routes | PASS locally; same Verify pending |
| Point 3: real desk controls, visible provider state and property rows | tests/browser/due-visits.spec.ts, existing Office batch-booking journey registered at line 33; call at lines 221–224 and helper at lines 452–525 | PASS locally; same Verify pending |
| Inherited BASE-AUDIT-001 | CONTRACT.md line 2421 cites it. Native Activity and export preserve the exact actor, historical role, time, subject, job, command and visit association through actual Worker restart | PASS locally; same Verify pending |

All new tests are discovered by the existing API glob. The existing due-visits browser file remains in the browser glob and its existing Verify partition. No workflow or verification inventory was changed. A simple source-registration inventory of API and browser files was already above the general 200-test cap, 283 before and 286 after the three explicitly requested focused cases. The browser registration count is unchanged. No test was removed, weakened or hidden to offset that pre-existing suite budget debt; no cap increase is claimed.

## Frozen rubric

R1 lifecycle attribution: MET by the lifecycle journey.
R2 secret exclusion and replay: MET by noSecrets and post-restart replay.
R3 transactional recipient and unsafe issuance refusal: MET by the email journey.
R4 authenticated provider states and honest outside send: MET by the email journey and desk controls.
R5 exact site history and peer-site exclusion: MET by the history journey and browser.
R6 actual controls and both proof widths: MET by the preserved browser registration and eighteen new screens.
R7 inherited audit and unchanged credential fences: MET for the named lifecycle and refusal paths; unchanged erasure custody INSPECTED.
R8 preserved assertions and judgments: MET by empty contract diff and additive browser changes; agreements, harness and fakes byte-identical to main.
R9 exact-SHA Verify and guarded landing custody: PENDING; no scan, landing or live provider proof is inferred.

## DONE-RIDERS

| Row | Result | Candidate-bound evidence |
| --- | --- | --- |
| 1 | PASS local; CI pending | All three named API journeys and the Office journey reach each native outcome; recorded push Verify 42507488266 is pending |
| 2 | PASS | Nonempty native fixtures; missing-email and token refusals preserve the entire export and mail count; unauthenticated provider callback refused |
| 3 | PENDING | Existing Verify globs and partitions invoke every journey; exact-SHA run 42507488266 is in progress |
| 4 | PASS | Relevant source, API tests, harness, provider edge and due-visits browser bytes are unchanged between tested save 3f9bd16 and candidate f84f1d003c67a1adf8d23199660fa71761caba4e; receipt.json hashes bind them |
| 5 | PASS | BASE-AUDIT-001 cited by PLAN-011; point 1 names the inherited audit outcome |
| 6 | PASS mechanical | Contract write and check pass; generated files restored whole; Status, Gap and Evidence cells left for the lander |
| 7 | PASS | No acceptance text, clause identity, coverage or ct policy changed |
| 8 | PASS | Integration issuance refused without effects; preserved agreements journey also exercises withdrawn role and branch authority and replay |
| 9 | PASS boundary | Only existing network-edge fakes; accepted, delivered and bounced mean provider reports. No live provider receipt or delivery beyond those facts is claimed |
| 10 | NOT APPLICABLE | No new policy default or authority was adopted |
| 11 | PENDING LANDER | Candidate is branch-only; full-history publication scan, exact-main equality, final Verify and Run site are fleet landing gates |

## Pre-ready self-check

1. Each named user-visible outcome is reached by the focused API or real desk journey. Exact-SHA Verify is still pending at report creation.
2. No old assertion was deleted, narrowed or moved behind a width or branch condition. Existing agreements tests are unchanged.
3. Replay and withdrawn role and branch authority pass in the touched and preserved journeys. No production authority or privacy path changed. Erasure deletes booking secrets and rewrites affected command results in src/glove/privacy.ts lines 140–148; that unchanged path is INSPECTED, not newly claimed as tested.
4. Existing text and controls are preserved. Booking-offer controls have text labels; the existing browser journey checks the Previous day tooltip on focus. Desktop and phone proof show the changed flow without horizontal overflow. No configuration or visual design was added.
5. Final source lock and generated contract checks pass. Exact-SHA publication scan, main equality and Run site are not established by this cloud run and remain guarded lander duties. Added fixtures contain no email-shaped literal; synthetic addresses are composed at runtime. No new provider-shaped key fixture was added.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock && node scripts/edition-authoring/cli.mjs check exit=0; views=node scripts/contract-docs.mjs write && node scripts/contract-docs.mjs check exit=0; ledger=none exit=0
PROBE PLAN-011 1: native offer commands and customer choice, then Activity and export before and after Worker restart -> seven exactly attributed lifecycle events; expired and revoked doors return 404; no bearer or hash in retained surfaces; replay reveals nothing.
PROBE PLAN-011 2: email=true with on-record address, absent address, integration token and authenticated provider callbacks -> one transactional send, both unsafe issuers refused with no business change, accepted then delivered then bounced provider state, outside send remains unverified.
PROBE PLAN-011 3: history reads for multiple sites and real Office desk controls -> exact offer, send, use, revocation and message rows only at their own property, at 1440 and 390 proof widths.

Publication scan: commit=f84f1d003c67a1adf8d23199660fa71761caba4e complete=unestablished historyScanned=unestablished findings=unestablished; not run in cloud, required from the maintained fleet lander. No COMPLETE or zero-findings claim is made.
Remote branch custody: refs/heads/cloud/sx-glove-c-f146 advertises f84f1d003c67a1adf8d23199660fa71761caba4e. Observed main is d1d1a15cc01a553a6035a85d9764f102b8c6ff9f, so main equality is false pending landing. Prior observed main 2d670ad4d007c62ff8d7b4645af5b2bcf324fcc7 had green Verify runs 42505772887 and 42504856469 and Run site 42505773159. These are historical main facts, not candidate success.

No product blocker was found. Existing agent outreach, SMS, consent-default, provider-account, other-clause and release holds remain unchanged. No release, provider activation or landing was performed.

The three focused runtime probes were rerun directly on the final full candidate SHA under Node 22.20.0: all three pass (api-exact-head.log). The earlier complete touched API run also passed all ten tests, and the browser proof has an empty relevant diff to the candidate.
