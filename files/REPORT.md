# SURFACE-022 continuation results

CLAIM SURFACE-022 PARTIAL points=none tests=tests/agent-native-overview.mjs#pricebookOverview

GAP SURFACE-022: Point 1 cannot complete because the accepted Base Recent activity renderer omits each admitted call's computed class. The shared audit and weekly counts carry the class. Client-bearing private agent reads and the broader service-week custody and erasure boundaries remain held as before.

Product head: `6cea228cfc991d229367554229aa4cbf90e3b477` on `cloud/sx-glove-c-f262` in `just-every/run-glove`. This is a pushed blocked preservation save, with `[skip ci]`, not a landing candidate. No PR was created. No release, deployment or publication beyond the expressly requested branch and evidence transfer occurred.

The complete plan is in `PLAN.md`. This run configured fleet authentication and hooks, cloned with full history, replayed the unfinished predecessor helper on current main, generated and checked the views, regenerated the lock, committed and pushed the first real save, built and typechecked, ran the public-door conformance proof, and preserved the actual failure. No Glove production defect was demonstrated and no production repair was attempted.

The predecessor is `1edb76d696dfc55ecc8064c063f5a65803084055`. Its overview helper and its once-awaited native-journey call were replayed additively on main `35f1f12f403d924b1a9cd095583fd21d774dfee2`. The original SURFACE-015 head is `fa752fd050227098935f8a8aabc42ccb2c4b9416`; its integrated head `26ff9e2042a685e409e262fe6ceca9b25b70af0c` is already an ancestor of current main. All three have the identical parity-helper blob `5455130d82e1b7baf5e9f4d40d0d036c10a0a5ce`. No other writer's work was removed. The final fetch found unchanged main; the required post-save merge reported Already up to date.

The only product changes are `tests/agent-native-overview.mjs`, two added lines in `tests/agent-native-journey.mjs`, and the regenerated `sources.lock.json`. The helper adds no new test registration; it extends the existing default journey. No existing assertion was removed, narrowed or put behind a new condition. The entire Base agent-door copy, manifest, parity helper, pre-existing browser proof, copy inventory, package pins, contract and generated views are unchanged from main. All 263 Status rows remain intact. Counts before and after are 47 DONE, 187 PARTIAL and 29 MISSING. SURFACE-022 remains PARTIAL; no acceptance point is claimed fully closed and no plan status is changed.

## Actual verification

The accepted checkout pins remain Node 22.20.0, pnpm 10.12.4 and rer 0.2.87. The production build selected the pinned Node; the touched checks explicitly used the cached Node 22.20.0. Setup and build ran through the supplied cloud subreaper. The static first-party check passed, exit 0; typecheck passed, exit 0; production build passed, exit 0. The first-party check is static, so its success is not presented as a passing native journey.

The runtime command was `node node_modules/@runeditrun/rer/cli/agent-door.mjs .`, under the supplied cloud subreaper and a 1200-second hard timeout. This is Verify's existing native conformance entry point, without running unrelated shards. It completed with exit 1: 767 of 768 conformance points passed. `BASE-AGENT-013.native-journey` failed at `tests/agent-native-overview.mjs:170`:

> SURFACE-022: Recent activity must show the computed class for each admitted price-book call

The actual missing entries were `glove.pricebook.update`, `glove.pricebook.category` and `glove.pricebook.adjust`, each class `standard`, decision `autonomous`, outcome `done`. Full non-secret output is in `native-conformance.log`. Both screenshots were captured before this final assertion and are included as `overview-1440.png` and `overview-390.png`.

The defect is in unchanged `src/modules/agent-door/pages.ts:104`: the Recent activity list renders the tool, agent and sponsor, decision, outcome, code and timestamp but never renders `row.classes`. The same source is on accepted main. It is Base-copied source, so the brief forbids editing it. Rewriting the Base page in the Glove adapter would be a runtime patch around that restriction. An upstream Base correction and its authorized adoption are the dependency. No passing-after repair is claimed because no repair was made. This is a local reproduced failure, not a failed CI job or an unreproduced infrastructure issue.

All browser contexts, browsers and disposable Workers closed normally. No long-lived server remains from this run. Actual screenshots contain only synthetic conformance identities, public price-book information, policy metadata and the audit overview; no session material or private client fixture content is published.

## Frozen POINT rubric and observed outcomes

This rubric decomposes the one existing acceptance sentence and the planner's explicit checks; it creates no acceptance points.

| Row | Existing outcome | Exact-head proof | Result |
| --- | --- | --- | --- |
| R1 | Client-bearing native records precede the agent operations | `tests/agent-native-overview.mjs:33`, signed-in Owner command calls create customer, contacts, billing address, site with access notes, enquiry and approved quote using the service item; approved status and native readback asserted at lines 49–54 | PASS locally |
| R2 | Every one of six calls has its ordered shared audit row and complete attribution, class, decision, outcome and code | `tests/agent-native-overview.mjs:62`, through the passed `tool` helper only; one new audit ID per call, fields and facts asserted at lines 68–78; all Base audit-count and policy-difference checks pass in `native-conformance.log` | PASS locally |
| R3 | Recent activity shows each call with computed class and the other declared fields | `tests/agent-native-overview.mjs:134`, last 20 rows and each call checked through the built page; fields pass at line 142, class collection at line 147 and final assertion at line 170 fail for the three admitted changes | FAIL |
| R4 | Weekly cells equal all current UTC-week audit rows by class and decision | Paginated audit at line 21, actual page cells at line 149 and independent grouping at lines 152–163; observations bound the request's UTC week rather than assume a weekday or date boundary | PASS locally |
| R5 | Each admitted change has exactly one attributed native Activity event | `tests/agent-native-overview.mjs:84`, exact event count, sponsor actor ID, agent label and native event kind for update, category and adjustment | PASS locally |
| R6 | Stale revision, changed arguments and unknown item are refused and change neither native state nor Activity | `tests/agent-native-overview.mjs:79`, attempts at lines 98–100; unchanged business, services, customers, sites and quotes | PASS locally |
| R7 | Seeded customer, site, contact, quote and address values reach none of the three overview surfaces | `tests/agent-native-overview.mjs:55`, values include names, contacts, email, phone, address, access notes, private descriptions and native client record identifiers; shared rows at line 92, admitted Activity at line 90, overview HTML at line 135; frozen approved quote also unchanged at line 111 | PASS locally |
| R8 | The existing Verify path loads the helper exactly once | `tests/agent-native-journey.mjs:47` awaits `pricebookOverview` once; the pinned rer conformance loader calls this default journey. Exact-head local conformance executed it. No exact-head CI run exists for the blocked skip-ci save | INSPECTED wiring; CI unestablished |

The inherited BASE-AGENT-009 duty is explicitly cited in SURFACE-022's meta line at `CONTRACT.md:3295`. Its actual conformance checks passed for one unique ordered row per call, class and facts, matching policy decision and zero `differs_from_policy`. The helper keeps every agent invocation inside the provided `tool` helper, so Base's exact audit-row count remains valid. This proves the admitted price-book subset, not unadopted service-work tools.

PROBE SURFACE-022 1: Signed-in Owner command door creates private customer, site and approved quote; six journey tool calls then produce six complete audit rows, three attributed native Activity events and zero refusal events. Built overview matches all weekly counts and all recent tool, agent, sponsor, decision, outcome and code fields; all three admitted rows omit their computed standard class. Seeded client values are absent from the tested overview HTML, audit rows and admitted Activity entries.

## DONE-RIDERS dispositions

| Rider | Disposition | Evidence or remaining bar |
| --- | --- | --- |
| 1 | FAIL | Point 1's computed class is absent from Recent activity; R3 and the line-170 failure above. No DONE claim. |
| 2 | PASS locally | Real native seeded records, three admitted mutations and three unsafe refusals through public doors; R1, R5, R6 and R7. |
| 3 | UNESTABLISHED | Exact-head Verify has no run because this is a blocked skip-ci preservation save; no dispatch spent on a known failing candidate. |
| 4 | PASS locally | Build and native journey ran on the exact recorded head, and no relevant source or test changed afterward. |
| 5 | PASS | SURFACE-022 cites BASE-AGENT-009 at `CONTRACT.md:3295`. |
| 6 | PASS mechanical; judgment retained | Generator write and check passed; generated views restored whole from main. Contract Status, Gap and Evidence belong to the lander and were not changed. |
| 7 | PASS | No acceptance text, coverage map or ruling was changed. |
| 8 | PASS within adopted scope | Native and shared authority, revoked-consent, Pause and current-authority conformance checks pass; three unsafe mutations change nothing. No new authority surface was added. |
| 9 | PASS boundary | No live provider, legal compliance, private client read, custody-adapter or broader service-week completion is claimed. |
| 10 | NOT APPLICABLE | No policy default or scope decision was introduced. |
| 11 | PENDING fleet; not counted | Product branch only. No landing, main equality, candidate Verify, candidate Run site or publication-scan completion is claimed. |

## Mechanical and custody receipts

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses SURFACE-022 then check exit=0; ledger=none exit=0.

Generator wrote 0 documents and reported current. Both generated views were restored from main. Source lock was regenerated after the last relevant file operation and its check passed. The tree is clean. Source Status and Gap cells were unchanged both in the staged commit check and in the complete diff from main. All candidate author and committer identities were fleet, trailers absent; all candidate messages were inspected before the guarded push.

Exact-head scan receipt: commit=6cea228cfc991d229367554229aa4cbf90e3b477; complete=false; historyScanned=unestablished; findings=unestablished. The cloud brief assigns the publication scan to the fleet lander. No scan success or READY is inferred from a pushed save or evidence publication.

Main provenance observed by REST: Verify 43007862828 and 43002016344 completed success, and Run site 43007862807 completed success, all on `35f1f12f403d924b1a9cd095583fd21d774dfee2`. Exact product head discovery returned zero runs. Three GitHub API calls were used, including one initial abbreviated-SHA lookup that returned no rows; only the full-SHA main response is relied on. No CI dispatch or rerun was made.

Pre-READY self-check: this is not READY because the named runtime behavior fails. Existing assertions are preserved; current authority, revoked consent, Pause and replay checks passed in the adopted Base conformance. Erased-person service-work custody remains held and is not claimed. No screen or control was edited; the existing page was captured at both widths, without claiming a new UI compliance audit. Source lock is fresh and contract views generate. Exact-head CI, scan, landing and Run site are unestablished. Source fixtures add no literal email address; customer emails are constructed only at runtime. The complete packet contains explicitly selected report, receipt, logs and screenshots, never credentials, environment dumps or private gate material.

The product push succeeded on attempt 1 using the supplied cloud guard. No rejection, rescue bundle or unpushed work exists. Product custody and the separate evidence transfer are distinct. Before cleanup the product ref will be checked against the full head; the disposable clone and dependencies can then be removed as requested.

Recommended plan entry: retain SURFACE-022 PARTIAL and its existing broader custody holds; attach the fresh R3 failure and refer the unchanged Base renderer omission to the Base lane. No other clause was started because this is a genuine upstream dependency under the brief's repair restriction.
