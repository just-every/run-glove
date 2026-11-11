# sx-glove-c-f260 — Native price-book replay proof

Candidate: c6efd8f9627cb82d979046d06cc98d3cb2fecce3
Branch: cloud/sx-glove-c-f260
Repository: just-every/run-glove
Main observed: 26ff9e2042a685e409e262fe6ceca9b25b70af0c
Product custody: pushed by cloud-push.py; no PR required (Verify runs on branch pushes).
Exact-head Verify: 43000518951, push event, in progress at discovery. No completed GitHub success is claimed.
Local foundation: exit 0, Node 22.20.0, pnpm 10.12.4, rer 0.2.87; 787 of 787 Base conformance points passed.

CLAIM SURFACE-025 DONE points=1 tests=tests/agent-native-replay.mjs#pricebookReplay; tests/agent-native-journey.mjs#default export (awaits pricebookReplay once)

This is a proposed DONE judgment on landing. Contract Status, Gap, Evidence and summary counts are untouched. The source remains 46 DONE, 188 PARTIAL, 29 MISSING before and after. If accepted, the lander can move SURFACE-025 from PARTIAL to DONE: 47 DONE, 187 PARTIAL, 29 MISSING. Test inventory remains 198 of 200 before and after; no registration or existing assertion was removed, skipped, narrowed or hidden.

## Plan and outcome

1. Read the full SURFACE-025 clause and its status gap, the supplied plan and rulings, DONE-RIDERS, launcher instructions and repository instructions. Point 1 lacked state-level once-only proof for both native mutations, intervening desk work, and no-effect conflict readback.
2. Preserve SURFACE-015's parity helper and invoke a new focused replay helper once from the existing native journey. SURFACE-015 had already landed: main's 26ff9e2 status commit sits above 0257ddc and the same parity source shipped by f254. No duplicate replay of its superseded branch commits was needed.
3. Seed a fixed-price material, a markup task depending on its cost, a second markup material and an unrelated item through the signed-in desk command. Use literal expected monetary values, native revisions and attributed Activity through public read doors.
4. Update the material, commit an unrelated desk save, retry the original key and arguments, refuse changed arguments and stale revisions, then apply a fresh key with current revision. Repeat the retry, refusal and fresh-key cycle for category markup, including every repriced dependant and the business revision.
5. Save and push the first coherent proof commit with skip CI, run the foundation shard, add distinct command-identity assertions for fresh keys, regenerate and check views, restore the generated views, regenerate the source lock last, and rerun the foundation shard on the final committed head.
6. Fetch main and merge it before final publication (already up to date), inspect all candidate authors, committers and trailers including side parents, check the exact scope and lock, push the named branch, discover its exact-head Verify once, and publish this separate report packet. No published history was rewritten.

Only tests/agent-native-replay.mjs, tests/agent-native-journey.mjs and sources.lock.json changed. savePricebook and proposePricebook required no repair. Base-copied runtime sources, agent-surface.json, tests/agent-native-parity.mjs, tests/agent-browser-proof.mjs, base-copies.json and the rer pin are unchanged. No test was removed. No failing-before production repair evidence applies because the existing native implementation passed the new proof.

## Frozen acceptance rubric

All references below are to tests/agent-native-replay.mjs at c6efd8f9627cb82d979046d06cc98d3cb2fecce3, unless otherwise named. Each row was executed in the final local foundation run (exit 0); GitHub Verify 43000518951 is the push event and remains in progress at the recorded discovery.

| Row | Clause sentence or bounded outcome | Public-door proof and result |
| --- | --- | --- |
| R1 | Point 1: retry an existing-item or category change once, read one native effect, and refuse changed arguments or a stale native revision without another effect. | pricebookReplay, lines 9–46 and 66–144: both tools run through the supplied tool helper; snapshots read state and every Activity page. PASS locally; exact-head CI pending. |
| R2 | Existing-item retry after unrelated desk service.save commits. | Lines 96–111: item cost 12.00, fixed price 24.00, dependent task cost 24.00 and price 36.00; unrelated item becomes 4.00 and advances once; retry returns the identical saved result without changing the intervening snapshot. PASS. |
| R3 | Exactly one version advance for each changed item and repriced dependant, one native state version and one attributed Activity event. | Lines 66–93, 100 and 126: unchanged services are compared whole; changed records and Activity recordChanges advance from v to v+1; agent name and sponsor id match the native Owner attribution. Category business revision also advances once. PASS. |
| R4 | Changed arguments with the same key yield idempotency_conflict and change nothing. | Lines 36–42, 110 and 132: both update and category refusals compare full state version, all services, business records and every native Activity event before and after. PASS. |
| R5 | Stale item expected_revision or stale category business revision yields revision_conflict and changes nothing. | Lines 36–42, 111 and 133: new keys retain old revisions; exact snapshots remain equal. PASS. |
| R6 | A new key with current revision owns a single independent effect. | Lines 113–120 and 135–144: distinct native command ids, one event, v+1 record changes and literal task prices 42.00 then 53.20; category material 7.60. PASS. |
| R7 | Inherited BASE-AGENT-012 duty is received in the clause and proof retains native command outcomes and revision fences. | CONTRACT.md lines 3320–3327 cites BASE-AGENT-012; R1–R6 prove the declared native subset. Existing Base conformance also proves its own replay phases. PASS locally. |
| R8 | Every extra agent call participates in Base's exact audit count. | Native journey passes the supplied tool helper unchanged to pricebookReplay; final FOUNDATION.txt includes PASS BASE-AGENT-009.1.count and the remaining shared audit rows, 787 of 787 points. PASS. |

## DONE-RIDERS

| Rider | Result on the candidate | Evidence |
| --- | --- | --- |
| 1 | PASS locally; exact-head CI pending | R1–R8 cover the only acceptance point through real MCP calls, desk commands and read doors. |
| 2 | PASS | R2–R6 exercise monetary derived prices and both allowed and refused paths; refused and replayed calls compare every native record and event. |
| 3 | PENDING GitHub Verify | 43000518951, push event, exact head c6efd8f9627cb82d979046d06cc98d3cb2fecce3; existing foundation wiring loads the native default export, which awaits the helper exactly once. Local foundation and native journey passed. |
| 4 | PASS | Final foundation ran after the last test edit on the full candidate SHA. |
| 5 | PASS | SURFACE-025 cites BASE-AGENT-012 in its meta line; R7. |
| 6 | PASS mechanical; judgment retained for lander | Generator write changed zero documents and generator check passed; generated views restored from main; no Status, Gap, Evidence or counts changed. |
| 7 | PASS inspected | No contract acceptance text, coverage mapping or ruling was changed. |
| 8 | PASS for replay scope | Current-authority implementation is unchanged; the full Base conformance authority, consent and Pause phases pass. No new permission path exists. |
| 9 | PASS boundary retained | No live provider, long job, queued provider execution, uncertain recovery or resend is declared or claimed. Client-bearing tools remain closed. |
| 10 | PASS, no new default | No policy choice or new disclosure was introduced. |
| 11 | PENDING guarded lander | Main equality, exact-head GitHub green, Run site and full-history publication scan remain unestablished here. No main push was made. |

## Pre-READY self-check

1. The only clause acceptance point has public-door assertions with literal nonempty fixtures, exact version deltas, saved outcomes and no-effect snapshots. Shared conformance reports 787 of 787 points. GitHub green is pending, not asserted.
2. No existing assertion was removed, narrowed or hidden behind width or branch conditions. The helper extends the existing journey without adding a test registration.
3. No authority, erasure or capture path changed. Base's current-authority, revoked-consent and replay conformance phases ran successfully. Client-bearing service-work remains closed under its existing external hold.
4. No UI files changed. The existing browser proof ran at 1440 and 390 against the production agent screen; no horizontal overflow was observed.
5. Source lock check passes. Views generate and check. Cloud publication scan is expressly left to the Mac lander: commit=c6efd8f9627cb82d979046d06cc98d3cb2fecce3; complete=NOT_RUN; historyScanned=false; findings=UNESTABLISHED. Main equality=false; exact-head branch Verify run=43000518951 in progress; Run site run=none for this candidate before landing. These are pending landing receipts, never claimed green.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses SURFACE-025 then check --clauses SURFACE-025 exit=0; ledger=none exit=0.

PROBE SURFACE-025 1: MCP glove.pricebook.update and glove.pricebook.category via the supplied tool helper, plus an intervening signed-in service.save -> identical retry outcomes; one native command, one version step per changed record, one attributed event; idempotency_conflict and revision_conflict preserve state and all native Activity; fresh keys apply once.

No product blocker was found. No release, deployment or main landing was attempted. The original broader holds remain: long and provider work is undeclared; dropped-stream replay with a new JSON-RPC id belongs to Base's own conformance; client-bearing tools await the accepted Base client-custody, redaction and atomic erasure adapter. No resend is claimed.

Plan row for the fleet: SURFACE-025 point 1 qualified; proposed DONE pending its one guarded landing gate. No other plan row was changed. Packet files are REPORT.md, RECEIPT.json, FOUNDATION.txt and CI.json; selected explicitly for report-only publication.
