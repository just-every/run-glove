# sx-glove-c-f258 — SURFACE-024 native Pause qualification

Product: just-every/run-glove, branch `cloud/sx-glove-c-f258`, full candidate `7527cae04cd1e580d479b8b820a3f037eb110adf`.
Base main: `26ff9e2042a685e409e262fe6ceca9b25b70af0c`. Product pushed and independently read back with `git ls-remote`. No PR is required: this repository runs Verify on branch pushes. No main push, release or deployment was performed.

SURFACE-024 remains PARTIAL. Point 1's native and shared local subset is qualified; the Business signed-policy resume-and-complete leg remains externally held. No Status, Gap, Evidence, acceptance sentence or generated view changed. Contract counts remain 46 DONE, 188 PARTIAL, 29 MISSING, 263 total. Test inventory remains 198 of 200, with no added registration. The existing default journey awaits the helper once at `tests/agent-native-journey.mjs:47`.

## Plan and implementation

The full work plan is in `PLAN.md`. The plan row affected is SURFACE-024 point 1, native and shared local controls. The only product changes are `tests/agent-native-pause.mjs`, its import and single invocation in `tests/agent-native-journey.mjs`, `docs/agent-door.md` and the generated source lock. No production defect was found and no runtime repair was made. Therefore failing-before repair evidence is inapplicable.

The required additive SURFACE-015 base has already landed. Current main contains its equivalent rebased parity commits and lander judgment; the old f254 branch contains alternate copies of those commits. Its parity helper is retained byte-for-byte, with no duplicate replay or merge of obsolete copies. Both pre-candidate main fetches found no new main commits to merge. The first real commit `16676e537fdb756c5013944b35a29440076d7228` was pushed with skip-ci custody; the final commit is `7527cae04cd1e580d479b8b820a3f037eb110adf` without any skip marker. All new author and committer identities are fleet, and both candidate histories have no co-author trailers.

The helper creates real fixed-price and markup items through the signed-in Owner's commands. Before pausing it prepares item, category and adjustment requests with current native revisions and new operation keys. It then sets native Pause, shared local Pause, and both. After each individual refused tool call, a fresh person snapshot compares the state version, complete services, complete business records, native Activity event identities and shared pause flags. The read, update, category and adjustment tools all refuse `agents_paused`, with no structured content exposed. Both combined release orders still refuse while the other control remains set.

Resuming through the original person door admits the prepared item update and category intent once each. Each call advances the native state version once and creates exactly one attributed agent Activity event. Item and category values are asserted against literal prices and names, unrelated services stay identical, and replay returns the same result with no extra state or Activity effect. Native Pause is itself a business write: its category request first proves the original precondition is stale, then refreshes only `expected_revision`, keeping its original intent and operation key. Shared local Pause permits the exact original category request. This preserves the existing revision contract instead of weakening it.

An actual integration token is issued by `token.issue` and revoked at cleanup. Its requests, even with the valid Owner cookie, refuse native `agents.pause` with HTTP 403 FORBIDDEN and shared local Pause with HTTP 403 person_session_required. These attempts try both setting and clearing Pause and leave both controls and native records unchanged. Nested finally blocks resume both person controls after an assertion failure. Every MCP call uses the supplied journey `tool` helper, so Base's exact audit-row inventory includes the added calls.

## Exact-candidate results

Runtime pins: Node 22.20.0, pnpm 10.12.4, rer 0.2.87; the accepted Base copies are unchanged.

- `GLOVE_VERIFY_SHARD=foundation WRANGLER_SEND_METRICS=false timeout 1200 pnpm run verify`: exit 0, 903 of 903 agent-door points. This executes the maintained foundation shard, including `pnpm run check --profile first-party`, typecheck, emitted-Worker runtime, email-link and site checks, hosted output, hydration and the native journey. It does not execute the other local shards. Actual log: `foundation-final.log`.
- `pnpm run typecheck`: exit 0, actual log `typecheck-final.log`.
- `pnpm run check --profile first-party --json`: exit 0, all reported clauses pass; actual log `first-party-final.jsonl`.
- `node tests/inventory.mjs --json`: exit 0, 194 registrations and four assertion scripts, total 198 of 200; unchanged registration count. Actual output `inventory.json`.
- Contract generator write with `--clauses SURFACE-024`, then check: both exit 0. Both generated views restored whole from main and uncommitted.
- Source lock regenerated last and checked: exit 0. A second check after final build and restoration of the build's unrelated route-tree whitespace also exits 0. No migration changed; ledger check inapplicable.
- Browser proof from the final candidate opens the existing Agents page at 1440 and 390, using `/usr/bin/chromium` with `--no-sandbox`; captures are `agents-1440.png` and `agents-390.png`. No screen code changed.
- Protected files `agent-surface.json`, `tests/agent-native-parity.mjs`, `tests/agent-browser-proof.mjs`, `base-copies.json`, and the rer pin have no diff from main. No Base-copied module changed. No prior assertion was deleted, narrowed or put behind a new condition.

## Acceptance and inherited-duty rubric

All line references are on the full candidate above. The local runtime evidence is exact-head. Branch Verify event and conclusion are recorded separately in `ci-discovery-final.jsonl` and the receipt; no green result from a different head is used.

| Item | Outcome and door | Proof | Result |
| --- | --- | --- | --- |
| R1, acceptance sentence 1: pause each native and shared local control, then observe unchanged records on the next attempted change | Signed-in commands and shared local person POST; four MCP tools; state, Activity and shared state reads | `tests/agent-native-pause.mjs:28`, `:78`, `:92`, `:103`; helper `pricebookPause` invoked at journey `:47` | PASS locally: independent controls and both controls; every attempted call compared against a fresh complete snapshot |
| R2, acceptance sentence 1: resuming one control while the other is set must still refuse | Both person doors, both release orders | helper `:107` | PASS locally: all four tools refuse with unchanged snapshots in each intermediate state |
| R3, acceptance sentence 1: person resume completes the item change once | Original item request, key and revision through MCP, person readback and replay | helper `:120`, `:138` | PASS locally: one state step, one attributed event, literal name and price; replay adds neither |
| R4, acceptance sentence 1: person resume completes the category change once | Category MCP request, markup item and business readback, replay | helper `:146`, `:153` | PASS locally with explicit current-revision revalidation after native Pause; exact original request after shared local Pause |
| R5, authority of Pause | Real issued integration token carrying an Owner cookie attempts both controls | helper `:57`, `:61`, `:77`, `:106` | PASS locally: HTTP 403 and both controls unchanged when trying to pause and resume |
| R6, acceptance sentence 1: Business Pause and person resume completing a native change | Signed Business envelope | Base's existing `src/modules/agent-door/conformance/policy-phases.mjs` `pausePhase` covers signed pause refusal and restored reads; seed cannot issue the Business resume-and-complete leg | UNMET-EXTERNAL: no Business signer fabricated; overall clause stays PARTIAL |
| R7, inherited BASE-AGENT-011 and BASE-AGENT-009.1 audit duty | Supplied tracked `tool` helper and Base audit phase | helper `:96`, `:122`, `:134`, `:150`; final log audit points and 903 of 903 summary | PASS for the declared subset; counts reconcile with every added call |
| R8, cleanup for later Base phases | Person resume in nested finally, token revocation | helper `:163`, `:168`; subsequent Base replay and audit phases pass | PASS locally |
| R9, declared boundaries | No provider effects, no spend, no queued native effects, client tools closed | Unchanged manifest, native source and accepted Base copies; clause cites BASE-AGENT-011 at CONTRACT.md:3313 | INSPECTED; unchanged holds are not claimed as proven capabilities |

## DONE riders and pre-READY self-check

| Rider | Result | Evidence or boundary |
| --- | --- | --- |
| 1 | PARTIAL | R1 to R5 and R7 to R8 execute and pass locally. R6's Business resume leg remains externally held. Exact-SHA branch CI is a separate fleet gate. |
| 2 | PASS for local subset | Real seeded records; explicit refusal snapshots and allowed completion with literal amounts, one effect and replay. Helper lines 28, 78, 92, 120, 138 and 153. |
| 3 | PENDING branch CI | The default journey is loaded by maintained foundation Verify; local exact-head proof passed. Do not infer branch CI success from local proof. |
| 4 | PASS locally | Final foundation, typecheck and first-party checks ran on 7527cae04cd1e580d479b8b820a3f037eb110adf after the last edit. |
| 5 | PASS | The receiving clause already cites BASE-AGENT-011 at CONTRACT.md:3313. |
| 6 | MECHANICAL PASS, judgment with lander | Generator write and check exit 0; generated views restored, no status or provenance cells edited. |
| 7 | PASS | No acceptance point, clause text, ruling or coverage map changed. |
| 8 | PASS for touched authority | Signed-in Owner sets and resumes each door; real integration token plus Owner cookie is refused both doors without changing controls. |
| 9 | PASS boundary | No Business signer, provider acceptance, spend or client custody completion is claimed. |
| 10 | N/A | No new policy default adopted; existing owner-only authority retained. |
| 11 | PENDING guarded lander | Product branch is pushed; main equality, full-history scan and exact-main Run site remain fleet duties. |

Self-check: no assertion removed or weakened. Touched authority and replay paths execute both allowed and refused cases; Base's consent-revocation phase also passes in the same run. This test-only change adds no erasure or retained-client path. No screen source changed, so screen-style and tooltip edits are inapplicable. Changed test and documentation additions contain no email-shaped fixture or provider-shaped key. Diff whitespace check passes; source lock is current. Publication scan is NOT RUN in this cloud, and no COMPLETE or zero-finding result is asserted.

Publication scan receipt fields: commit=7527cae04cd1e580d479b8b820a3f037eb110adf complete=unestablished historyScanned=unestablished findings=unestablished. Main equality=false before landing. Known base main Verify 42998019060 and 42995490841 are success; base Run site 42998019057 is success. These are context only, never evidence of candidate CI.

PROBE SURFACE-024 1: Owner sets native, shared local and combined Pause; prepared read, update, category and adjustment calls -> agents_paused and identical native snapshots and flags; each person resume -> one item and category effect and no replay effect. Integration token attempts -> 403 FORBIDDEN and 403 person_session_required, controls unchanged. Native business revision is revalidated as described above.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses SURFACE-024 and check exit=0, generated views restored; ledger=none exit=0.

CLAIM SURFACE-024 PARTIAL points=1 tests=tests/agent-native-pause.mjs#pricebookPause; tests/agent-native-journey.mjs#default
GAP SURFACE-024: Point 1's native and shared local controls are qualified; Business Pause's signed-envelope resume-and-complete leg stays with Base. Native Pause requires current business revision revalidation for the category intent. Existing spend, provider, queued-effect and client-custody holds remain unchanged. Status judgment remains with the lander.

No product blocker or production repair. No new campaign clause, plan reorder, release or live-provider action was opened.

## Candidate CI and handoff

Exact-head branch Verify 43000612075, event push, head 7527cae04cd1e580d479b8b820a3f037eb110adf, was in_progress with conclusion null at the final permitted lookup. URL: https://github.com/just-every/run-glove/actions/runs/43000612075 . No workflow was dispatched or rerun. There is no observed failing candidate run. Four GitHub API calls were used, with the two candidate discoveries spaced at least 300 seconds apart. The maintained cloud handoff ends READY for the pushed product candidate; it does not assert CI green, completed publication scanning, landing or DONE.
