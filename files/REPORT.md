# sx-glove-c-f116 result

Repository: just-every/run-glove. Product branch: cloud/sx-glove-c-f116.
Candidate: 988ba34084bbdb9e131b72a8175f8c3bd35d7c8d. Main at the final fetch: e555cc0ada4915dd1f64a5fa09ab77cff7a468a4.

COMM-016 point 1 is fully exercised locally. The focused journey connects Postmark as the Owner, sends five distinct real messages, authenticates five documented callbacks with the generated Basic credential, and separately checks delivered, bounced, deferred, failed and complained. The fixed runtime clock separates provider occurrence from receipt. Worker disposal and recreation retains D1; duplicate replays after restart add neither facts nor receipts. An unsigned delivery and an unrecognized bounce Type are refused without changing messages, Activity, export facts or event receipts. No production code needed repair.

The accepted point is one outcome family, represented by one new integration registration in the existing email collection: five registrations before, six after. No assertion was deleted, narrowed, skipped or moved behind a condition. This checkout has no test-budget.json. Static direct registrations are 154 API and 41 browser, plus the four Verify-invoked runtime, mail-link, site and portability scripts: 199. No cap change was made.

## Plan and counts

Executed plan: read clause and current proof; verify official provider semantics; add focused real-door proof; run touched tests and typecheck; generate and check contract views, restore them, lock sources last and check; commit with fleet hooks and identity; integrate fresh main; push guarded product branch; inspect exact-SHA CI; publish explicitly selected non-secret evidence separately. PLAN.md holds the complete working plan. The only campaign row proposed for change is COMM-016 point 1. Full plan and all Status, Gap and Evidence cells are untouched.

Actual counts remain 11 DONE, 223 PARTIAL, 29 MISSING, all 263 rows retained. After an independent gate and lander status update the proposed counts are 12 DONE, 222 PARTIAL, 29 MISSING. COMM-016 is PARTIAL on main, proposed DONE on landing. No other clause is claimed.

## Documentation decision

Official references checked on 2026-11-08:

- https://postmarkapp.com/developer/webhooks/bounce-webhook
- https://postmarkapp.com/developer/webhooks/delivery-webhook
- https://postmarkapp.com/developer/webhooks/spam-complaint-webhook

Bounce documents Email and BouncedAt, with Type and TypeCode classification. Inactive reports address deactivation; CanActivate concerns subsequent reactivation. Its soft-bounce guidance specifically points to those fields. This supports the current inactive-soft-bounce mapping to failed; a non-inactive soft bounce stays deferred. Delivery uses Recipient and DeliveredAt. SpamComplaint uses Email and BouncedAt. All fixtures carry the actual send's Glove metadata. These are provider-edge simulations, not live Postmark delivery, provider-account acceptance or legal proof. No new policy default was adopted.

## Frozen proof rubric

Every code reference below is in tests/api/email.test.mjs at 988ba34084bbdb9e131b72a8175f8c3bd35d7c8d. Shared document payloads are in tests/fixtures/mail-providers.mjs lines 22–35. All outcomes use the same named journey: COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay.

| Row | Acceptance or inherited duty | Evidence | Local result |
| --- | --- | --- | --- |
| R1 | Point 1: Delivery becomes delivered | 351, 357–398, one independent message | PASS |
| R2 | Point 1: HardBounce becomes bounced | 352, 357–398 | PASS |
| R3 | Point 1: non-final SoftBounce becomes deferred | 353, 357–398 | PASS |
| R4 | Point 1: inactive final SoftBounce becomes failed | 354, 357–398; documented Inactive distinction | PASS |
| R5 | Point 1: SpamComplaint becomes complained | 355, 357–398 | PASS |
| R6 | Named trail duty: Activity and business export retain attributable facts | 368, 384–398; exact exported reference and occurredAt; same fact ID, provider, receipt time and summary in Activity | PASS |
| R7 | BASE-MAIL-001 inherited mail door, metadata, outcome and dedupe | 346–365, 380–398, 403–406 | PASS for touched outcomes |
| R8 | BASE-OPS-003 cited operational duty: actual runtime restart with durable facts | 400–402; existing harness restart disposes and recreates Miniflare over persistent D1 | PASS for touched outcomes |
| R9 | BASE-OPS-004 cited operational duty: stable replay and no automatic resend | 403–411 | PASS for touched outcomes |
| R10 | BASE-SECRET-001 credential exclusion | 369–372; state, Activity, business export and saved outcomes checked before and after callbacks and restart | PASS |
| R11 | Authenticated-only effects and unknown-Type refusal | 377–379, 408–410 | PASS |

Activity's existing projection exposes fact identity, actor, kind, subject, receipt time and summary. The test joins that exact immutable fact to its exported providerMessageId and occurredAt, and independently asserts the state reference and occurrence time. No new Activity projection or screen is claimed.

## DONE-RIDERS

| Row | Result | Evidence or boundary |
| --- | --- | --- |
| 1 | PASS | R1–R5 and full email suite; Verify 42472079384 push event at candidate |
| 2 | PASS | Real seeded messages, exact expected statuses, unsigned and unknown refusal with unchanged effects; lines 357–410 |
| 3 | PASS | verification.json API glob and scripts/verify-app.mjs include this file; exact-SHA Verify 42472079384 completed successfully, event push |
| 4 | PASS | Focused probe rerun on committed candidate, candidate-probe.log; full file tested identical bytes before commit |
| 5 | PASS INSPECTED | COMM-016 already cites BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001; CONTRACT.md unchanged |
| 6 | PASS local mechanical; lander metadata pending | Contract generator write and check exit 0; generated views restored; no builder Status, Gap or Evidence changes |
| 7 | PASS INSPECTED | No acceptance or coverage-map edits; no scope narrowing |
| 8 | PASS for touched boundary | Owner connection; unsigned callback refused with no state, fact or receipt effect; existing Postmark credential test also remains passing; broader authority owned by COMM-015 and COMM-013 |
| 9 | PASS | Only network-edge fake proof claimed; live provider receipt, custody and other clauses remain separate |
| 10 | PASS INSPECTED | No policy decision or default changed |
| 11 | PENDING LANDER | Main does not equal candidate; publication scan and Run site are Mac lander custody |

## Pre-ready self-check

1. All five named observable mappings execute through actual commands and callback HTTP doors, with real public state, Activity and export reads. The exact-SHA focused runtime probe passes. Full exact-SHA Verify 42472079384 completed successfully for this candidate, event push.
2. Existing assertions are preserved. This is an additional integration journey, not a replacement or weakened assertion.
3. No authority, erasure or replay implementation changed. Replay and unauthenticated refusal are executed. Existing credential rotation, revocation and disconnect tests pass in the full touched suite. Broader erasure, ordering, rejection accounting, provider edge and future-door inheritance are not newly claimed and remain with COMM-015, COMM-017, COMM-013, COMM-014, COMM-010, COMM-018 and COMM-011.
4. No screen changed, so browser widths and UI polish are inapplicable.
5. Source lock check passes; added lines contain no literal email-shaped string or ambiguous prose repository token. Exact-SHA Verify, main equality, Run site and COMPLETE full-history publication scan remain recorded honestly below. No publication or release is authorized by this test change.

## Commands and custody

Touched suite: six passing tests, zero failed, zero skipped; Node 22.20.0. Typecheck and first-party check exit 0. Contract write and check exit 0, zero view changes; views restored from origin/main. Source lock regenerated with its documented command and check exit 0. No migration changed, so ledger check is not applicable. git diff --check passes. Final tree contains only the two requested test files and sources.lock.json. Fleet author and committer and absent trailers were checked over every candidate commit; no history was rewritten after publication. Product push succeeded on the first guarded attempt. No PR is required: Verify accepts direct branch pushes.

PROBE COMM-016 1: Owner mail.connect and five email.send commands; Basic-authenticated documented Delivery, HardBounce, non-final SoftBounce, final SoftBounce and SpamComplaint callbacks -> delivered, bounced, deferred, failed, complained with exact persisted reference and occurrence time; same facts after Worker restart; replay adds zero facts and receipts; unknown bounce Type returns 401 with no outcome change.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write then check exit=0, generated views restored; ledger=none exit=0.

Exact-SHA scan: commit=988ba34084bbdb9e131b72a8175f8c3bd35d7c8d complete=NOT_RUN_CLOUD historyScanned=UNESTABLISHED findings=UNESTABLISHED. The maintained Mac lander runs the scan; no COMPLETE or zero-findings claim is made here.

Main equality: false at handoff preparation; origin/main=e555cc0ada4915dd1f64a5fa09ab77cff7a468a4. Verify push run=42472079384 head=988ba34084bbdb9e131b72a8175f8c3bd35d7c8d status=completed conclusion=success. Run site: pending landing. GH calls used: 4; no dispatch, rerun or PR creation.

No known product blocker. DONE-RIDERS rows 1 through 10 pass for this scoped claim; row 11 is pending independent landing. The product is READY with exact-SHA Verify success; the final handoff names the separate evidence ref and head. receipt.json records actual CI observations.

CLAIM COMM-016 DONE points=1 tests=tests/api/email.test.mjs#COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay

Observed pre-candidate main is green: exact-main Verify push 42467836802 and Run site push 42467837032 completed successfully at e555cc0ada4915dd1f64a5fa09ab77cff7a468a4. These are baseline-health receipts only and are not candidate proof.

READY repo=just-every/run-glove branch=cloud/sx-glove-c-f116 head=988ba34084bbdb9e131b72a8175f8c3bd35d7c8d
