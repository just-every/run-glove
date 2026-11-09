# COMM-001 qualification plan and results

Task: sx-glove-c-f217. Declared repository: just-every/run-glove.
Product branch: cloud/sx-glove-c-f217. Product judgments remain owned by the lander.

## Plan

1. Read the pinned clause, operating rules, existing API and browser journeys, provider edge fixtures, launcher instructions, seed instructions, inline plan extract, ct rulings and DONE riders.
2. Preserve TEAM-006's live consolidation, including its two unchanged lines in the email journey. Integrate by merge to preserve all published history and main's newer work.
3. Extend the existing email registration with seven named COMM-001 steps. Cover document delivery, durable replay, complete Activity and export facts, four provider credential shapes, authority refusals, disconnect, provider refusal, transactional content and Reply-To.
4. Add one actual archive assertion to the existing Postmark archive case. Keep the harness, provider fixtures and existing email browser registration unchanged.
5. Run touched API and portable journeys, typecheck and first-party checks. Capture existing owner email settings and desk document states at 1440 and 390. Fix only demonstrated edition mail defects.
6. Regenerate contract views and check, restore views from main, lock source last and check. Commit product changes only, inspect all candidate identities and trailers, push through the fleet guard.
7. Discover exact-head Verify using REST, respect the ten-call budget and 300-second polling interval. Publish this report and actual receipts separately on the evidence ref.

## Initial coverage gap

The existing combined mail scenarios cover many delivery paths, but do not separately qualify COMM-001 points 1 through 7. Missing proof includes complete authority matrices, public-secret exclusion across replay and captured logs, the actual Postmark API key archive assertion, restart equality for document states and warnings, and every Reply-To request shape with and without a business email.

## Scope boundaries

No Status, Gap or Evidence cell is edited. No acceptance point is changed. No Base mail module, provider fixture, API harness or email browser file is edited. No live provider delivery receipt or provider account qualification is claimed. COMM-011's future receipts, confirmations and review inheritance, morning email and the held callback work remain with their owning clauses. No new registration or automatic resend is added.

## Implementation and findings

The seven new scenarios are inside the existing email registration. No registration was added. TEAM-006's import and call of `messageOutcomes(t)` remain unchanged. Its consolidation reduces the brief's main inventory of 202 to exactly 200, including four assertion scripts.

The public command probe demonstrated that an Office integration token could send an approved quote: the refusal assertion saw `true !== false` for the response's `ok`. The edition handler now refuses document email for integration tokens before finding or queuing a document. Native Owner, Dispatcher and Office outcomes retain their required permissions. The new journey also revokes the integration credential and verifies repeated requests cannot queue mail or change business records.

The combined email run also reproduced an inherited fixture defect in COMM-010: the SES unmatched-event assertion received HTTP 401 rather than 200 because OpenSSL generated its certificate later than the journey's hardcoded clock. That journey now freezes its starting instant when it begins, derives its agreement and booking dates from that instant, and moves the controlled clock to at least the real certificate's generation instant. All signature, unmatched-event, wrong-recipient, replay, durability and no-resend assertions remain. No provider fixture or production verifier is changed.

Initial new-test corrections fixed export timestamp comparison, documented newest-first state event ordering, provider text extraction for Resend, and complete Activity pagination. Those failures were fixture assumptions and did not require product changes.

## Frozen acceptance rubric

Every row is exercised through the real Worker HTTP doors with only provider network edges faked. Each named `COMM-001 point N:` step is in `tests/api/email.test.mjs` under the existing registration `COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay`.

| Row | Clause outcome | Public-door evidence | Local result |
| --- | --- | --- | --- |
| R1 | Quote, invoice and supplier order sends; signed delivered and bounced events; message timeline states and customer warning | Point 1, lines 701–732: all four providers; command and callback replay; populated job timelines and quote event timeline; exact text, reference and next-step assertions; actual Worker disposal and recreation with complete state, Activity and export equality | PASS |
| R2 | Every new fact is attributable in Activity and export without secrets | Point 2, lines 733–750, plus point 7's complete paginated Activity comparison: every connection, queue fact, provider answer and matched event; actor identity, role, command, subject, summary and provider reference | PASS |
| R3 | Owner-only secret connection and disconnect for all four providers | Point 3, lines 751–780: native roles, custom role, branch-limited Owner and integration token refused unchanged; input refusals; SES JSON and SNS pins; original and identical replay responses; saved outcomes, state, Activity, export and captured Worker logs; disconnected sends refused with MAIL and every previously valid callback returns 404. `tests/portable.mjs` line 481 asserts the API key absent from actual archive bytes, next to existing callback password and hash exclusion assertions | PASS |
| R4 | Arbitrary from domain accepted locally; provider refusal visible with next step and no retry | Point 4, lines 781–797: SendGrid fake HTTP 400, exact not-sent label and corrective next step, exported provider rejection and Activity identity, command replay and restart with no extra provider attempt. Inherited COMM-010 scheduled replay proof remains in the combined registration | PASS |
| R5 | Approved current quote and exact desk authority; approved or exported invoice and recipient fallback; draft order and named supplier; own-customer booking email | Point 5, lines 798–845: allowed and forbidden native roles, custom role and integration token; draft, unapproved new revision, declined and stale quote refusals; revision 2 body; invoice draft refusal, AP address, fallback and missing-address refusal; draft-only supplier orders, alternate named recipient and recorded sent address; extra booking recipient ignored in favor of on-record customer | PASS |
| R6 | Only transactional document and booking-link content; other kinds refused | Point 6, lines 846 onward, plus the provider-request document assertions in the shared send helper and actual booking token text. Revoked credential refuses repeated requests unchanged. Complete retained projections contain no credential, booking bearer or email body | PASS |
| R7 | Business Reply-To present only when set | Point 7, lines 854–886, all four providers, both business-email states: SendGrid `reply_to` object, Resend `reply_to` string, Postmark `ReplyTo`, SES `ReplyToAddresses`; absent field when unset | PASS |

## Inherited duties

| Duty | Proof | Result |
| --- | --- | --- |
| BASE-AUDIT-001 | R2 and complete paginated Activity at R7; full historical actor, command, subject and provider-reference comparison | PASS |
| BASE-DATA-001 | R1 actual Worker restart; real installation export and import in `tests/portable.mjs`, including absent provider keys and absent callback credentials | PASS locally |
| BASE-MAIL-001 | R1 and R4 plus inherited COMM-010 provider outcomes and honest unknown-state proof | PASS |
| BASE-OPS-003 | Replayed command and signed callbacks add no attempt or fact; retained exact state after actual restart | PASS |
| BASE-OPS-004 | Exact rejected message label and next step at R4; warning and provider-state next steps at R1 | PASS |
| BASE-SECRET-001 | R3, R6 and R7 inspect populated responses, replays, state, saved outcomes, Activity, export and captured logs; actual archive bytes exclude key and callback credential | PASS locally |

## DONE riders and pre-ready review

| Rider | Result | Evidence or honest boundary |
| --- | --- | --- |
| 1 | PASS locally; exact-head Verify pending | R1–R7 perform every native acceptance outcome through real public doors. No live delivery qualification is inferred. |
| 2 | PASS | Populated documents and events; allowed sends complete; unsafe roles, versions, states, inputs and revoked credentials refuse with no queued work or business change. |
| 3 | Pending CI | Existing push Verify loads the API registration, portable script and existing email browser journey. Exact-head run will be recorded in the receipt. |
| 4 | PASS locally | Final source and test hashes and exact-head browser receipt recorded with validation. The preliminary browser run changed no product source. |
| 5 | PASS by inspection | COMM-001 meta line already cites all six Base duties above. No inheritance text changed. |
| 6 | PASS mechanical; judgments remain with lander | Contract generator write and check pass; generated views restored whole from main. No Status, Gap or Evidence cell edited. |
| 7 | PASS | No acceptance sentence changed and no old assertion removed, narrowed, skipped or hidden. No ruling or coverage rewrite needed. |
| 8 | PASS | Owner-only connection and complete native role matrix; tokens cannot send, custom role without document authority cannot send, unsafe document states and stale revisions refuse unchanged. |
| 9 | PASS boundary | Fakes qualify the native provider edge only. R-9 live delivery receipts and provider account acceptance remain unclaimed, under the existing field-proof register. |
| 10 | Not applicable | No new policy default. The brief explicitly requires the native person-only sending boundary. |
| 11 | Pending guarded lander | Candidate remains branch-only. No main write, public release, scan receipt or Run site for the candidate is claimed. |

Pre-ready: all seven native outcomes have behavioral assertions; no existing assertion was removed or weakened; revoked credentials and replay are exercised; real archive erasure and restoration fences remain in the existing portable journey. No screen is modified. The existing browser journey proves owner email configuration and desk document send states at 1440 and 390. No UI redesign, Base refresh, source pin change, migration or workflow change was made. The source lock and contract views are checked mechanically. Publication scanning is unavailable in this cloud by the task contract and remains the guarded lander's duty; no COMPLETE scan is fabricated.

## Runtime probes

PROBE COMM-001 1: native document sends and signed delivered and bounced events -> exact provider labels, references, populated timelines, warning and identical state after actual Worker restart.
PROBE COMM-001 2: Activity pages and business export -> every mail fact has matching identity, actor, command, subject, summary and provider reference; no key or body.
PROBE COMM-001 3: connection commands with native, custom, branch-limited and token identities -> only unscoped signed-in Owner changes a connection; malformed inputs refuse; disconnect rejects all document sends and callbacks.
PROBE COMM-001 4: arbitrary from domain and fake provider HTTP 400 -> connection accepted, message not sent by SendGrid with corrective step; replay and restart add no attempt.
PROBE COMM-001 5: document and booking commands with allowed and unsafe roles, revisions, states and recipients -> allowed exact document and on-record destination delivered to provider; unsafe attempts queue nothing.
PROBE COMM-001 6: provider request bodies and invalid kinds -> document or booking text only, no marketing or unsubscribe content; other kinds refuse; revoked integration token remains refused.
PROBE COMM-001 7: business email set then cleared for every provider -> exactly the documented Reply-To field when set, no field when unset.

## Counts and plan handoff

Contract source judgments before and after this round: 41 DONE, 193 PARTIAL, 29 MISSING, all 263 rows retained. COMM-001's source Status stays PARTIAL; proposed claim is DONE for native points 1–7, subject to independent landing gates. No plan file is edited in cloud. Plan row proposed: COMM-001 native points 1–7 qualified by the named email steps, actual Postmark archive assertion and existing owner settings and desk send browser journey. The held remainder remains with its owning clauses.

No PR is required: this seed's Verify starts on pushes to every branch. Main was green at fcfafa4d17d1ff83fcd75fd89b929a29780397f8: Verify 42611312391 and Run site 42611312355 were completed successfully. Main equality with this candidate, full-history publication scanning and resulting Run site are pending guarded landing.

## Terminal candidate and local validation

Candidate: `8efd317b006b25dd25c3745b65e917f58a892af4` on `cloud/sx-glove-c-f217`, pushed successfully through the fleet guard. All 17 candidate commits, including side parents, have allowed authors, committers and trailers; full commit messages were inspected. Main was fetched and merged immediately before the candidate push; it was already an ancestor, and no published history was rewritten.

The complete existing email registration passed in 129.7 seconds with the final relevant bytes. Typecheck, first-party checks, test inventory, contract generation and check, restored generated views and final source-lock check all pass. The complete portable script exited zero, including the actual Postmark API-key archive assertion and all existing restoration and erasure cases. The existing email browser registration passed on this exact committed candidate, producing 54 screenshots across 1440 and 390. All browsers and owned development servers closed normally. See `RESULTS.json`, `BROWSER-RECEIPT.json`, actual command logs and the source hashes.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses COMM-001 and check exit=0, generated files restored whole from main; ledger=none exit=0.

Verify push run 42616161595 is bound to this exact candidate; its latest observed status is in `ci-status-history.json`. No candidate Run site or publication scan is claimed before guarded landing.
