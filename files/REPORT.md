# SURFACE-019 native price-book class facts

Candidate: `11fd25e0092888ec15c32f309b3ba6ea23be0312` on `cloud/sx-glove-c-f257`, repository `just-every/run-glove`.
Prior main: `26ff9e2042a685e409e262fe6ceca9b25b70af0c`. No PR is required: branch push starts Verify.

## Plan and result

The full plan is in PLAN.txt. Reproduced the declared read defect before repair: `glove.pricebook.read` returned standard with measure 1 for a catalogue independently counted through the Owner state door as 25 visible service and category records. The native conformance command exited 1 with `BASE-AGENT-013.native-journey`; FAILING-BEFORE.log retains the actual assertion and output. The structural `pnpm run check --profile first-party` passed before and after: it validates structure and does not execute the native journey. The runtime proof is the same shared conformance checker called by the foundation shard's `rer verify`.

Repaired only the read classifier in `src/glove/agent-door/tools.ts`: it counts native visible services plus visible categories, matching the catalogue resource. The write classifier and pure native proposal are unchanged. The new `pricebookClassFacts` helper is awaited once by the existing default journey. Each agent call uses its `tool` helper, preserving exact audit counts. An Owner command prepares the declared Parts category before the autonomous phase, so each declared catalogue read has an exact expectation of two records in both policy phases. Only the three affected read expectations changed in agent-surface.json. No existing assertion was removed or weakened.

Main already contains the SURFACE-015 parity helper and its invocation; its helper and the prior parity candidate's helper are byte-identical. They were preserved. Current Base, rer 0.2.87 and Node 22.20.0 pins are unchanged. No copied agent runtime, workflow, browser-proof helper, homepage, UI, contract judgment or generated view was committed.

## Frozen proof rubric

All rows refer to `tests/agent-native-class-facts.mjs#pricebookClassFacts`, invoked by `tests/agent-native-journey.mjs` default export, and use the signed-in Owner state and command doors plus the agent journey tool helper.

| Row | Acceptance sentence or inherited duty | Proof and observed result |
| --- | --- | --- |
| R1 | SURFACE-019 point 1: catalogue inspection computes standard with the native affected count | Lines 50–72 assert exactly one standard class, count independently enumerated service and category records, return the same native services, and change no record. Before repair measure 1 versus expected 25 fails; after repair passes. |
| R2 | Point 1: existing-item editing computes affected items | Lines 73–84 hold an isolated fixed-price update to one changed record, and a material cost update with a repriced task to two. Literal prices are 120.00, then material 18.00, task cost 24.00 and task price 36.00. |
| R3 | Point 1: category markup computes affected items | Lines 85–87 enumerate the business record, two markup items and their task, measure 4. Prices become 21.60, 36.00 and 43.20. |
| R4 | Point 1: category adjustment computes affected items | Lines 88–93 enumerate only the two active fixed-price items, measure 2. Prices become 132.00 and 44.00. Archived, other-category and markup items remain unchanged. |
| R5 | Point 1: no customer decision or provider effect | Lines 29–48 create and assert a nonempty approved then person-accepted quote, job, saved plan, sold agreement and customer. Lines 50–64 compare every other native collection and provider settings after each call; messages, payments, payouts, financing and push records stay empty; only the named price-book Activity event is added. |
| R6 | Inherited BASE-AGENT-006: classes come from the native operation, not caller assertions | CONTRACT.md cites BASE-AGENT-006 at the clause. Exact class facts and independently named changed records cover all four declared native tools; the existing injection and policy checks remain in native conformance. |

The focused native run passed 766 of 766 conformance points. The full local foundation shard also passed on the exact committed candidate: `CI=true GLOVE_CI_PREBUILT=1 GLOVE_VERIFY_SHARD=foundation node scripts/verify-ci.mjs foundation` exited 0 and finished `verify: complete (exit 0)`, including structural check, typecheck, runtime and email-link flows, run-site build and links, hosted output, hydration and agent conformance. Its complete actual output is in FOUNDATION.log. Its production browser proof covers Agents once at 1440 and 390. No screen changes were made.

## DONE-RIDERS on the candidate

1. PASS local: point 1 and inherited class duty are covered by R1–R6. Exact-SHA workflow outcome is recorded in CI files and RECEIPT.json; at 10:14:58 UTC the push run was still in progress.
2. PASS: nonempty mixed-price fixtures, independently enumerated record IDs, literal price outcomes and nonempty accepted customer decisions; lines 16–93. The demonstrated before failure proves the read assertion detects the defect.
3. Pending workflow: default journey is loaded by the existing hosted foundation Verify path. Exact-SHA run 43000534237 is the push event; conclusion will be recorded in the receipt.
4. PASS: exact candidate local foundation rerun, or byte identity for the focused native proof. No relevant source or test changes after the committed candidate.
5. PASS INSPECTED: receiving clause already cites BASE-AGENT-006; contract text unchanged.
6. PASS mechanical: generator write and check exited 0; generated views restored whole from origin main. Status, Gap, Evidence and counts remain lander-owned.
7. PASS INSPECTED: no acceptance sentence changed, no ruling or coverage rewrite needed.
8. PASS existing inherited authority coverage: native conformance retains allowed and refused authorization, Pause, stale revision, idempotency and policy paths; no new authority door or permission change.
9. PASS INSPECTED: no legal or live provider acceptance is claimed. Unadopted tool families and existing custody holds remain unchanged.
10. PASS INSPECTED: no policy default adopted.
11. PENDING LANDER: publication scan, main equality, exact-SHA Verify and resulting main Run site must be confirmed by the guarded fleet lander. This cloud never writes main.

## Pre-ready self-check

The named business outcomes have public-door assertions; no assertion was removed, narrowed or hidden behind a width flag. No credential, erasure or capture replay implementation changed; existing native revocation and replay conformance is preserved. No screens changed, so tooltip and text-size edits are inapplicable. The existing browser helper produced the two required Agents widths. No new email-shaped fixture value was added. Source lock is regenerated and checked after all changes. Full-history publication scan is not run in cloud under the task adaptation: commit=11fd25e0092888ec15c32f309b3ba6ea23be0312, complete=UNESTABLISHED, historyScanned=UNESTABLISHED, findings=UNESTABLISHED. The clone has full history. Fleet scan and landing remain mandatory; no receipt here substitutes for them.

Source judgments before and after are 46 DONE, 188 PARTIAL, 29 MISSING, all 263 rows preserved. Proposed SURFACE-019 judgment is PARTIAL to DONE after the independent gate; if accepted, counts become 47 DONE, 187 PARTIAL, 29 MISSING. No other plan row changes. Test inventory remains 198 of the 200 cap, 194 registrations and four direct scripts; this helper adds no registration. No pin test or duplicate was introduced or removed.

PROBE SURFACE-019 1: Owner-created mixed catalogue and accepted customer work, then all four price-book tools through the journey helper -> exact standard measures catalogue count, 1, 2, 4, 2; exact enumerated record effects; customer decisions and provider state unchanged.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write and check exit=0, generated files restored from origin main; ledger=none exit=0.

CLAIM SURFACE-019 DONE points=1 tests=tests/agent-native-class-facts.mjs#pricebookClassFacts; tests/agent-native-journey.mjs#default export

The local full foundation proof is green on the candidate. No account, product or policy blocker found. Workflow and landing state are reported separately in RECEIPT.json. Existing broader surface and client-custody holds are unchanged.
