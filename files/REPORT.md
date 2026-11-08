# sx-glove-c-f162 — COMM-012

Candidate: `10d84256718bb3e216c741ed6d221adaa2154efe` on `cloud/sx-glove-c-f162`, repository `just-every/run-glove`. Product branch pushed successfully. No pull request is required: Verify accepts branch pushes. No production repair was needed.

Claim: COMM-012 DONE, points 1–7, subject to the independent exact-head Verify and guarded landing. All seven native acceptance outcomes now have focused passing public-door assertions. CONTRACT.md, its Status judgments, the existing combined email test, the landed AGENT-008 API journey, the provider fixture and the held callback browser test are unchanged. The only product-tree changes are the focused API journey, one harness network-failure translation, additive states in the existing browser journey, and the generated source lock.

Source counts before and after: 21 DONE, 213 PARTIAL, 29 MISSING; total 263. COMM-012 remains PARTIAL in CONTRACT.md until the lander applies its judgment. Accepting this claim would yield 22 DONE, 212 PARTIAL and 29 MISSING. Plan row proposed: COMM-012 qualified for DONE on landing; no other campaign row changed.

## Plan and implementation

The complete initial plan is in PLAN.md. The round read the target clause and its seven points, the inline rulings and DONE-RIDERS, repository instructions, relevant operating rules, production mail sender, callback matching, Today component, existing journeys and harness. Existing proof covered the ordinary opt-in send, but did not separately qualify every refusal, interruption, failure outcome and displayed state.

The new API registration consolidates one morning-email journey with five stages: nonempty native brief and exactly-once content; configuration authority and defaults; local scheduling and interrupted submission; disabled or unavailable prerequisites; provider answers, callbacks, no retry and public custody. Assertions identify points 1–7 individually. Clocks, local dates, callback timestamps and cron instants are fixed. Actual Worker disposal and restart retain D1. The provider request is paused by the existing fake's beforeRespond control; a durable queued claim is inspected before the response and remains queued after Worker interruption. No production algorithm, permission, provider endpoint or retry behaviour changed.

The existing browser registration now obtains scheduled, queued, accepted, delivered, bounced, refused, rate-limited and not-confirmed states through the real Worker cron and signed callback doors. It reloads Today before reading each fresh state, asserts at 1440 and records each screen at 1440 and 390. It checks the next action when the provider state requires one, status font size at least 13px, and zero outbound side effects from opening the page. The provider fixtures are byte-identical to main. The harness alone maps the existing fake's synthetic 599 response to a genuine fetch exception, so the assertion distinguishes transport uncertainty from provider refusal.

A malformed retained owner address and missing non-exported provider credential have no ordinary creation command. Only those prerequisites are seeded directly; their behaviour is exercised through the actual cron. The native last-owner guard stays enabled. The business itself, configuration changes, roles, branch limits, integration token, work records, sends, callbacks, Activity and export all enter through public doors.

No existing assertion was removed, narrowed, skipped or moved behind a width or environment condition. No duplicate or pin assertion was deleted. Registration accounting is a known bookkeeping exception: the checkout already had 201 simple API and browser registrations without a test-budget.json; the focused API journey adds one, giving 202. The browser registration count is unchanged. No cap raise or unrelated test deletion was made; lane consolidation remains separate from this clause's acceptance proof.

## Acceptance rubric

All API rows refer to `tests/api/morning-email.test.mjs` test **COMM-012 points 1–7: morning delivery, owner authority, local clock, interruption, provider facts and no retries**, registered at line 255. Browser rows refer to `tests/browser/morning-brief.spec.ts` test **AGENT-008 points 1–2 and 4: owner reads the fixed-date Today brief and follows every section action at 1440 and 390 without sending**, registered at line 19; its additive COMM-012 assertions are lines 67–125. API and browser globs are in existing push Verify commands in verification.json; workflow shape is unchanged.

| Rubric | Acceptance outcome | Proof and observed result | Result |
| --- | --- | --- | --- |
| P1 | The owner's prepared morning brief is delivered once for the business-local date, with a provider delivery outcome. | API lines 27–61: native unbilled work is nonempty; simultaneous first-due runs produce one submission; signed delivery folds to delivered; replay, later runs, two simultaneous later runs and actual Worker restart retain exactly one send. | PASS locally; Verify pending |
| P2 | Only the signed-in unscoped Owner controls enabled and time; connection first, default 07:00, off initially, opening sends nothing. | API lines 65–119: signed-out, Office, Dispatcher, Technician, custom role, integration token, branch-limited Owner and demoted former Owner are refused; complete business and brief facts unchanged. Invalid times and preconnection enable are refused; Owner enable, time change and disable succeed with audit. API lines 32–36 and browser lines 25–65, 71–93 prove reads and the real Today screen make no send. | PASS locally; Verify pending |
| P3 | Fifteen-minute business-local checks send at or after the chosen time to the owner account, once per local date, with a durable pre-send claim and no resend after crash. | API lines 123–157: Sydney November 9 is UTC November 8; 06:45, 07:00 and 07:15 claim and send nothing; 07:30 submits to the account address rather than business address; another date's first 07:45 check qualifies. The next date is interrupted inside its provider call after the queued claim; actual Worker restart leaves queued only and a repeated cron makes no additional submission. Existing production cron configuration and src/server.ts scheduled entry inspected. | PASS locally; cron wiring INSPECTED; Verify pending |
| P4 | Early, off, disconnected and no active usable owner sign-in address cause no claim or send. | API lines 130–133 and 161–186: pre-time, explicit off, missing private provider credential, disconnect after enable, and retained owner with unusable address leave zero brief facts and zero submissions. Native last-owner guard remains intact. | PASS locally; Verify pending |
| P5 | Honest provider answers and signed matching events appear on the date in Activity, export, brief and Today, with provider reference but no credentials or body. | API lines 190–251: accepted, 400 refused, 429 rate limited, 503 not confirmed and unreachable transport not confirmed; wrong recipient refused with no business effect; another date ignored with no business effect; signed delivered and bounce fold on their dates. Every brief fact has provider attribution in Activity and export; callback references retained exactly, keys and escaped complete brief bodies absent. Browser lines 71–125 and 16 status captures show all folded states and applicable next steps; delivered text explicitly means the recipient's mail server. | PASS locally; Verify pending |
| P6 | No retry of failed dates; the next local date has its own submission. | API lines 197–221: later runs and actual Worker restart preserve each date's provider state and fact list without an extra send; next dates submit their own delivery IDs. | PASS locally; Verify pending |
| P7 | The owner's transactional email contains exactly the brief text and no marketing content. | API lines 32–43: exact complete plain text derived from the public brief at the same instant, with a separately asserted nonempty native item; only text/plain; marketing and unsubscribe content absent. Preserved AGENT-008 journey independently checks the native brief's exact sections and expected content. | PASS locally; Verify pending |

## Inherited duties

| Duty | Application and proof | Result |
| --- | --- | --- |
| BASE-AUDIT-001 | Configuration audit attribution at API lines 111–114; all delivery facts compared through Activity and export at lines 237–248. | PASS |
| BASE-MAIL-001 | Existing provider edge and signed callback door; one submit per date, accepted distinct from delivered, exact references, failure states and transport uncertainty at API lines 37–60 and 197–248. | PASS for the native boundary |
| BASE-OPS-003 | Production scheduled entry inspected; fixed local-clock checks and real restart at API lines 123–157. | PASS locally; wiring INSPECTED |
| BASE-OPS-004 | Concurrent cron claims, interrupted provider call, durable replay suppression and no retry at API lines 37–59, 139–157 and 208–221. | PASS |
| BASE-SECRET-001 | Signing key and provider credential excluded from Activity and business export at API lines 249–251; no real provider secret used. | PASS |
| R-9 | Live provider delivery receipts and provider-account acceptance are not claimed. Fakes qualify the seed's native transport boundary only. | EXTERNAL field proof remains unclaimed |

## DONE-RIDERS

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | PASS locally, pending exact-head Verify | P1–P7 above reach every named native outcome through commands, cron, callback, built Today, Activity and export. |
| 2 | PASS | Native nonempty work at API lines 30–40; allowed Owner configuration and excluded authority cases at lines 65–119; wrong callback recipient and date preserve public state at lines 222–228. |
| 3 | PENDING CI | Existing API glob and browser runner are push Verify commands. Candidate Verify run 42529815126 was discovered queued on the exact full SHA. |
| 4 | PASS | API and browser are rerun on the final committed candidate; exact source SHA and Node version are retained in logs and receipts. |
| 5 | PASS | COMM-012 already cites all five inherited Base duties in CONTRACT.md; duties are not added or moved. |
| 6 | PASS mechanical; source judgment retained for lander | Contract write and check pass with touched clause COMM-012; generated views restored whole from origin/main and not committed; Status, Gap, Evidence, provenance and counts are unchanged. |
| 7 | PASS | CONTRACT.md has a zero-byte diff; no acceptance rewrite or ruling required. |
| 8 | PASS | Every excluded configuration principal is refused for enable, disable and time changes with unchanged public state; Owner path and current-role withdrawal checked at API lines 65–119. |
| 9 | PASS bounded claim | No live provider acceptance, legal conclusion, SNS custody or external delivery receipt is claimed. R-9 remains field proof. |
| 10 | NOT APPLICABLE | No new policy default, disclosure or authority was introduced. |
| 11 | PENDING GUARDED LANDING | Candidate remains branch-only. Fleet must scan full history, require exact-head Verify, land and confirm Run site. Main equality is not claimed. |

## Pre-ready self-check

1. Every named native behaviour has passing runtime assertions; API and browser are loaded by existing Verify globs. Exact-head CI is recorded separately below.
2. Existing assertions and both specifically preserved API files remain unchanged. No width or environment gate was added around an assertion.
3. Current configuration authority withdrawal, callback replay, wrong recipient and wrong date are exercised with unchanged public state. No personal-erasure, credential-restore or customer outbound surface is modified. Broader erasure, callback authentication and provider custody duties remain in their owning clauses.
4. The touched Morning brief region has labelled links and no icon-only controls. Its status text is at least 13px. Existing Settings owns configuration; UI source and style are unchanged. Captures at 1440 and 390 were visually inspected for the changed status region.
5. Source lock is fresh; generated contract check passes; no migration was changed. No email-shaped literal was added to product fixtures. Publication scan, main equality and Run site for the candidate remain fleet gates; no cloud scan result is fabricated.

## Public-door probes

PROBE COMM-012 1: simultaneous scheduled runs at 2026-11-09T13:15:00.000Z -> one provider submission, signed delivered status, later runs and restart keep one.
PROBE COMM-012 2: mail.morning as Owner and all excluded principals -> Owner controls and 07:00 default succeed; excluded requests are refused and business unchanged; opening API and Today sends nothing.
PROBE COMM-012 3: Sydney cron at UTC 19:45, 20:00, 20:15 and 20:30 -> no early claims, one local November 9 submission at 07:30; interrupted later date stays queued after actual Worker restart with no second submission.
PROBE COMM-012 4: off, missing credential, disconnected and unusable owner address through scheduled -> zero brief claims and zero sends.
PROBE COMM-012 5: provider 202, 400, 429, 503 and transport rejection, then signed callbacks -> honest date states; wrong recipient and date unchanged; Activity and export retain provider facts and references without keys or brief bodies; Today displays each state and applicable action.
PROBE COMM-012 6: later cron and actual restart after each answer -> state and facts unchanged, no resend; next local date has its own submission.
PROBE COMM-012 7: send body compared to nonempty public brief at the same instant -> exact plain text, no marketing or unsubscribe content.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses COMM-012 then check --clauses COMM-012 exit=0; ledger=none exit=0.

## Terminal provenance and gates

Candidate head: 10d84256718bb3e216c741ed6d221adaa2154efe. Save head: 1ab164c7af38b66cbacba0ce0e648a9aff268f76. Both commits have fleet author and committer identities and no trailers; every candidate commit and message was inspected before each product push. Product pushes used cloud-push.py and succeeded without retry. Fresh main was fetched and merged before the candidate; main was already an ancestor and no merge commit was needed.

Observed main: cb4787ac9734f9fb534fe2896cc054e3637953af. Exact-main Verify 42527470716 and Run site 42527470649 are completed success. Candidate is not main. Candidate Verify 42529815126: push event, initially queued; terminal observation to be appended after the five-minute polling interval. GitHub calls used so far: 2, one for main and one for candidate discovery.

Scan: commit=10d84256718bb3e216c741ed6d221adaa2154efe complete=NOT_RUN historyScanned=NOT_RUN findings=NOT_RUN. Full-history clone was used. Cloud does not run the fleet publication scanner; fleet scanning and guarded landing are pending. No release or publication of the product is authorized by this report.

Local results: focused COMM-012 plus preserved AGENT-008 API journeys pass on the candidate with Node 22.20.0; preserved combined morning-email journey also passes. Typecheck passes with the project Node. First-party check exits 0. Exact-head browser journey passes on Node 22.20.0, with all 26 captures retained in the packet. No production defect or CI repair round was required. Earlier construction-only failures were fixture expectations and same-URL browser navigation and were corrected without changing product code or removing a required assertion.

Blockers: none in native implementation or local acceptance. Exact-head CI and fleet landing conditions are reported as pending until observed. Evidence publication is separate from product custody.

CI observation at 2026-11-08T22:31:41Z: Verify 42529815126 remains in_progress on 10d84256718bb3e216c741ed6d221adaa2154efe. No conclusion is claimed; 4 GitHub calls used.
