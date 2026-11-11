# sx-glove-c-f261 — SURFACE-022 blocked qualification

Product repository: just-every/run-glove
Product branch: cloud/sx-glove-c-f261
Full pushed SHA: 1edb76d696dfc55ecc8064c063f5a65803084055
Parent main: 26ff9e2042a685e409e262fe6ceca9b25b70af0c
Disposition: BLOCKED on a demonstrated copied Base defect. This is a preserved test-only save with skipped CI, not a landing candidate. No PR, release, provider activation, deployment or main push occurred.

CLAIM SURFACE-022 PARTIAL points=none tests=tests/agent-native-overview.mjs#pricebookOverview
GAP SURFACE-022: The copied Base renderer at src/modules/agent-door/pages.ts:104 omits computed classes from each Recent activity row. The audit correctly stores standard for the admitted update, category and adjustment calls. The brief requires that class in Recent activity, so point 1 is not fully qualified. Base must supply the fix through the accepted adoption path; this task cannot edit the copied module or change the rer pin. The existing client-bearing private-read and broader service-week custody holds remain unchanged.

No acceptance point, Status, Gap or Evidence cell was edited. Source counts before and after are 46 DONE, 188 PARTIAL and 29 MISSING, 263 total. The plan row SURFACE-022 remains PARTIAL; no plan row was changed. No new policy default was adopted.

## Work and prerequisite

The full execution plan is PLAN.md. The implementation seeds a customer with email, phone, billing address and another contact, a site with address and access notes, an enquiry and an approved quote that references a native price-book item. These are all created through the current signed-in Owner's public command door. It then makes admitted item update, category markup and category price adjustment calls, and refuses stale revision, changed-argument key reuse and an unknown item. Every agent call goes through the journey's supplied tool helper. The focused helper is awaited exactly once by the existing default journey.

Main already contains the prerequisite SURFACE-015 parity implementation and its landed DONE judgment. Its protected parity, browser proof, adapter, Base-copy and package files match the prerequisite branch for the relevant paths. Rebasing onto the fetched main was a no-op; no unpublished prerequisite history was replayed over main and no published history was rewritten.

Only tests/agent-native-overview.mjs, the import and single await in tests/agent-native-journey.mjs, and the generated source lock were committed. No production repair was attempted because the observed defect belongs to the copied Base page. The five protected artifacts and the runtime pin are unchanged. Existing assertions remain intact. Test inventory remains 194 registrations plus 4 assertion scripts, 198 of 200, delta zero.

## Exact-head results

The local foundation command was GLOVE_CI_PREBUILT=1 node scripts/verify-ci.mjs foundation, under cloud_run with a hard 1200-second timeout, Node 22.20.0 and pnpm 10.12.4. It used accepted rer 0.2.87 and the setup-built production output; this candidate changes no production source. It exited 1 on the exact pushed SHA. The first-party check, typecheck, runtime routing journey, email-link sign-in journey and site journey all completed successfully before the hosted native conformance phase. Hosted-output and hydration phases completed before the conformance failure.

The conformance result was 767 of 768 points passed. The sole failing point was BASE-AGENT-013.native-journey. All exact shared audit-row count assertions, the zero differs_from_policy check and the existing native price-book parity journey passed. No CI failure repair round was attempted and no passing-after repair result is claimed.

LOCAL_REPRODUCED {"head":"1edb76d696dfc55ecc8064c063f5a65803084055","job":"foundation (local)","command":"GLOVE_CI_PREBUILT=1 node scripts/verify-ci.mjs foundation","test":"tests/agent-native-overview.mjs#pricebookOverview","exit":1,"failure":"SURFACE-022: Recent activity must show the computed class for each admitted price-book call"}

Before committing, the direct native conformance entry point reproduced the same failure and all other focused assertions passed. The exact-head foundation run then reproduced it again. The unedited Base renderer and full actual sanitized logs are included. No Base source, packaged runtime helper or pin was patched to obtain these results.

The assertion's actual missing-class list is:

- glove.pricebook.update — standard, autonomous, done
- glove.pricebook.category — standard, autonomous, done
- glove.pricebook.adjust — standard, autonomous, done

## Frozen qualification rubric and acceptance outcome

| Item | Result and evidence on the pushed head |
| --- | --- |
| Acceptance point 1: read admitted changes and refused attempts in the overview and native Activity without introducing client-bearing service-work content | PARTIAL. The public doors show all six calls, exact event counts and no seeded client content. Recent activity omits computed classes. tests/agent-native-overview.mjs#pricebookOverview:10–170; local foundation exit 1. |
| R1: create real native client-bearing fixtures before changing the catalogue | PASS locally. Owner commands create the customer, site, enquiry and approved quote; retained customer billing address, site access notes and approved price-book line are read back at lines 33–57. |
| R2: every specified call has exactly one shared audit row with attribution, class, decision, outcome and code | PASS locally. Lines 65–99 identify the row by audit difference and idempotency key, check its complete expected classification and attribution, and compare the retained row again. Six calls; one row each. |
| R3: exactly one native event per admitted change, none for each refusal; refusals change no business records | PASS locally. Lines 66–97 compare Activity and native records before and after every call. Three admitted events and zero refused events. |
| R4: overview HTML, the six audit rows and the admitted Activity entries exclude seeded client values | PASS locally. Lines 58–63 and 87–98 check the seeded names, contacts, email values, phone values, billing and site addresses, access notes, quote title, description and client record ids. Raw overview HTML is checked at line 137. |
| R5: Recent activity shows each specified call with its computed class | FAIL locally. Last 20 rows, tool, agent, sponsor, decision, outcome and code pass at lines 138–150; all three admitted rows omit standard. Final assertion at line 170 fails. Base pages.ts:104 never renders row.classes. |
| R6: current UTC-week class and decision count cells equal paginated audit counts | PASS locally. Lines 151–163 reconcile every cell and every nonzero audit bucket; the request clock bounds handle a UTC-week rollover without fixed time-of-day expectations. |
| R7: existing assertions, protected artifacts and accepted pins stay intact | PASS by diff and existing conformance. Only the focused helper, default-journey integration and generated lock changed. |

Browser assertions run only at 1440. The same live overview is captured at both 1440 and 390; actual PNG files are included. No screen implementation or control was edited. The copied page's existing controls are textual; no icon-only control was introduced.

PROBE SURFACE-022 1: Owner commands seed private client work; supplied tool helper makes three admitted price-book changes and three refused attempts; audit returns six exact rows with zero differs_from_policy; Activity adds three attributed events, none for refusals; raw overview HTML excludes seeded client content; weekly cells match all audit rows; Recent activity lacks standard for each admitted call.

## DONE riders

| Rider | Result |
| --- | --- |
| 1 | FAIL for a complete point-1 claim: the class is absent from Recent activity, and exact-head foundation proof is red. Other native outcomes are reached and checked on seeded data. |
| 2 | PASS locally: real seeded nonempty records, allowed mutations and unsafe stale, conflict and unknown-item paths; refused paths leave native records and Activity unchanged. |
| 3 | NOT MET: exact-SHA local foundation exits 1. No green branch Verify is claimed; no CI candidate was requested for this blocked save. |
| 4 | PASS locally: the foundation rerun is on the pushed SHA; browser captures come from that run. |
| 5 | PASS by inspection: SURFACE-022 cites BASE-AGENT-009 and names native Activity retention in its existing acceptance. |
| 6 | Mechanical PASS: generator write and check exit 0; both generated views restored from main. Existing source judgments remain with the lander and are unchanged. |
| 7 | PASS by diff: acceptance text and all source judgments are unchanged. |
| 8 | PASS for the scoped dangerous paths locally: owner-sponsored mutations land and stale, changed-key arguments and unknown-item attempts change nothing. Existing consent, role and Pause conformance assertions are retained and pass. No broader authority qualification is claimed. |
| 9 | PASS boundary: no provider, customer-private read or wider service-week custody proof is claimed. Those holds remain explicit. |
| 10 | Not applicable: no policy default was adopted. |
| 11 | NOT MET: main does not equal this blocked save; Verify, full-history publication scan and Run site landing receipts are absent. No landing or DONE claim is made. |

Pre-ready self-check: the point remains unproved because class presentation fails; no existing assertion was removed or narrowed; revoked-credential and replay conformance remains passing, and no erasure implementation changed; no screen implementation changed; source lock is fresh. No READY line is warranted for this known failure.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write then check exit=0, generated views restored from origin/main; ledger=none exit=0.

## Custody and remaining dependency

Product commit 1edb76d696dfc55ecc8064c063f5a65803084055 was pushed successfully on guard attempt 1 to the named cloud branch. The save has [skip ci], so it is intentionally not a candidate for landing and has no Verify run ID. GitHub Actions was not dispatched or rerun. Exploratory API lookups using partial SHA filters established no CI status and are not treated as evidence. API calls used: 3. PR: none. Publication scan: NOT RUN in cloud; no complete scan or zero-findings claim. Run site: NOT RUN. No main change.

The blocked test stays asserted and wired into the ordinary foundation journey so the dependency is reviewable and reproducible; the branch must remain unlanded until the upstream class-display fix is adopted and this proof passes. The packet is a report-only evidence transfer and signals neither product acceptance nor READY. All evidence is selected explicitly, contains only synthetic local test results, and is kept outside the product tree.

POST lanes/sx/INBOX.md: sx-glove-c-f261 SURFACE-022 remains PARTIAL; no points fully closed and no clause cells changed; blocked save 1edb76d696dfc55ecc8064c063f5a65803084055 pushed to cloud/sx-glove-c-f261; exact-head local foundation 767/768, fails only Recent activity computed-class display; CI run IDs none (skip-ci save); counts unchanged 46 DONE, 188 PARTIAL, 29 MISSING.
POST lanes/gr/INBOX.md: sx-glove-c-f261 Base dependency: src/modules/agent-door/pages.ts:104 omits row.classes from Recent activity. Public-door proof on Glove 1edb76d696dfc55ecc8064c063f5a65803084055 finds standard in each admitted audit row but absent from its page entry; update, category and adjust all affected. Accepted rer 0.2.87 and copied Base code remain unedited. Evidence packet contains exact-head failure, renderer excerpt and 1440 and 390 captures; please supply an upstream fix through the approved adoption path.
