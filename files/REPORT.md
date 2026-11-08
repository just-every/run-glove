# sx-glove-c-f120 — ServiceM8 move-in review

Repository: just-every/run-glove. Product branch: cloud/sx-glove-c-f120.
Candidate: 1b615b444443efb47b2cea492ace97a43e8a5207. PR: none required; Verify runs on branch pushes.

GLOVE-11 points 1–3 are implemented and locally proved against an authored, documented-shape ServiceM8 export. No real owner export or live provider acceptance is claimed. Product publication and landing remain separate fleet gates. The product branch contains no report or receipt files.

## Plan and scope

1. Read the complete GLOVE-11 requirement and acceptance points, current Status Gap, seed agent instructions, move-in documentation, edition adapter, public HTTP commands, API harness and existing browser journey. Map the unproved outcomes to the existing sanity journeys.
2. Project every planned source record into an owner review: source kind, ID, file and row, destination kinds and IDs, merge targets, rejection and unused reasons, missing attachment bytes and already-moved-in status. Retain the mapping's reason-only entries. Separate genuinely merged records from unused input.
3. Retain source material IDs on their merged price lines. Extend the authored fixture only with documented JobActivity and Attachment shapes: an activity on a quote and a customer attachment. Enumerate all 22 expected source outcomes independently of the production mapper.
4. Exercise stage, reviewed-fingerprint refusal, commit, command replay, exact destination and merged identities, eight byte-exact original-file reads, actual Worker restart, unchanged repeat, exact business snapshot restoration and destructive undo refusals through public doors. Keep the existing large resumable undo and other-kit journeys.
5. Add current-Owner original-file downloads backed by the kit's verified journal read. Check signed-out, Office, Technician and withdrawn-Owner refusals and unavailable originals after erasure. Check attributable Activity and actual business export.
6. Extend the existing owner browser journey to inspect the record review at 1440 and capture it at 1440 and 390. Collapse earlier committed or undone record reviews while retaining their disclosure controls. No icon-only controls were added; the touched screen's controls have text labels.
7. Run touched API tests, typecheck, first-party check, contract generator write and check, restore generated views, regenerate the edition source lock last and check it. Merge current main without rewriting published saves. Commit and push only the named cloud branch using fleet identity and the push guard. Observe exact-SHA Verify by bounded REST calls; publish this packet separately.

Only the GLOVE-11 plan row is proposed for judgment. No plan files or contract Status, Gap or Evidence cells were edited. Existing held Jobber, Housecall Pro and Workiz encoding and account obligations, MOVE-005 balances and QuickBooks references, MOVE-006 saved-method custody, provider activation and Base restrictions remain held. Existing mappings outside ServiceM8 were not edited. The current rer and Base pins were preserved.

## Changes and findings

The edition preview previously counted every zero-effect source as merged and dropped reason-only explanations. It now exposes a per-record projection and genuine merge targets derived from retained source identities. A source can be unused and still name missing attachment bytes. The aggregate omission list comes from the same per-record projection.

The original adapter dropped JobMaterial identities when creating native price lines. Price lines now retain sourceId, matching the existing contact custody pattern. Every fixture destination and every merged identity is checked independently. Rejected and unused objects remain in the received original files, which the public download door checks byte for byte.

A destructive-refusal proof exposed a real edition defect: attempting undo after a customer edit changed the import batch version despite refusing the edit. Glove now preflights every remaining imported native record before starting reversal. The kit still performs its atomic revision checks at apply time. Both edited-customer and booked-visit refusal journeys compare the whole public state, including every record and event, unchanged.

The successful undo comparison excludes only the import batches, their events and the installation-wide version counter, which advances when those batches change. It compares all business collections and other state exactly. The refusal comparisons exclude nothing.

## Frozen acceptance rubric and public-door probes

| Item | Outcome and proof | Local result |
| --- | --- | --- |
| GLOVE-11 point 1 | ./tests/api/movein.test.mjs, `ServiceM8 every source record is reviewed, fingerprinted, retained through restart, repeated without effects and safely undone`, lines 16–57: independent expected rows for all 22 records and exact public stage projection. ./tests/browser/movein.spec.ts, existing fieldpulse owner journey, lines 225–259: real owner file selection and review of destination, merge, source location, rejection, unused reason and missing bytes. | PASS |
| GLOVE-11 point 2 | Same API journey, lines 59–90: wrong fingerprint changes nothing; committed projection equals reviewed projection; lost-answer replay is inert; all and only expected destinations exist with source IDs, merged source IDs remain, and every one of eight received files is byte-identical through the authorized download route. | PASS |
| GLOVE-11 point 3: unchanged repeat | Same API journey, lines 91–98: actual Worker disposal and restart with persistent D1; all 22 entries already moved in; repeat commit changes no business record. | PASS |
| GLOVE-11 point 3: successful undo | Same API journey, lines 99–107, and ./tests/api/flows.test.mjs test `11 owner moves in from ServiceM8 with a dry run, a journaled commit and undo`, lines 775–809: exact pre-move-in business state restored, actual Activity and exported timeline checked. | PASS |
| GLOVE-11 point 3: unsafe undo | Same API journey, lines 109–130: real native booked visit creates an attributable dependency and refusal leaves every record unchanged. Existing `ServiceM8 opening balances retain payment custody, reject mismatches, and preserve native edits on undo`, lines 139–172: actual customer edit, refusal, exact unchanged-state assertion and attributable Activity with export. | PASS |
| Current authority and erasure | Same API journeys, lines 81–89, 123–127 and 189–192: current Owner reads original bytes; excluded and signed-out people are refused; withdrawn Owner session is refused; erasure withdraws shared originals. Existing ./tests/api/harness.mjs restart uses actual Miniflare disposal with D1 on disk. | PASS |

PROBE GLOVE-11 1: import.stage with eight fixture files -> 22 independently enumerated source records; genuine merges, rejected job at job.json item 4, two unused records and missing attachment names retained.
PROBE GLOVE-11 2: import.commit with reviewed fingerprint -> exact expected native destinations and retained source IDs; eight authorized original-file responses byte-identical; wrong fingerprint and unauthorized file reads refused without effects.
PROBE GLOVE-11 3: actual Worker restart, import.stage and import.commit of identical files -> all 22 records already moved in and unchanged business records; import.undo restores exact business state; customer-edit and booked-visit undo attempts refuse with the whole public state unchanged.

## DONE riders

| Rider | Result | Evidence and boundary |
| --- | --- | --- |
| 1 | LOCAL PASS; Verify pending | All three acceptance points reach public commands, state, files, Activity, export and owner browser. Exact-SHA run recorded below when available. |
| 2 | PASS | Independently enumerated, nonempty 22-record source expectation; actual byte comparisons; supported destructive undo and both unsafe refusals performed; whole-state equality on refusal. |
| 3 | PENDING VERIFY | Existing push Verify runs both API test files and the existing browser journey through verification.json and scripts/verify-app.mjs. No environment flag gates the added assertions. Screenshots are optional output only. |
| 4 | PASS locally | Final browser and focused API proofs run on the committed candidate. The full touched API suite used identical relevant code and tests; the only later source change joins the same MIME type string. Receipt hashes bind the final source and test files. |
| 5 | PASS, INSPECTED | GLOVE-11 states its public-door duties directly and names inheritance by the other move-in kits. No new inherited Base duty or clause obligation was introduced. |
| 6 | PASS mechanical; judgment deferred | Contract generator write and check pass. Generated views were restored from main and were never committed. No Status, Gap or Evidence cell changed. The lander owns the judgment and counts. |
| 7 | PASS, INSPECTED | No acceptance sentence, identifier, ruling or contract text changed. |
| 8 | PASS | Signed-out, Office, Technician and withdrawn-Owner original-file reads refused. Wrong fingerprint, edited record and native dependent work refuse without business changes; actual Activity and export prove permitted operations. |
| 9 | PASS boundary retained | Authored documented-shape fixture only; no real export, live provider receipt, legal or processor-transfer claim. Existing external holds remain unchanged. |
| 10 | NOT APPLICABLE | No policy default adopted. The new original read uses existing current unscoped Owner move-in authority and the kit's guarded read. |
| 11 | PENDING GUARDED LANDER | Product stays on named cloud branch. Main equality, COMPLETE full-history publication scan, exact-main Verify and Run site are fleet gates, not established by a cloud push or an evidence ref. |

## Pre-ready self-check

- Behaviour: all named outcomes exercised through public doors with seeded source records; money and destructive paths include refusal and unchanged-state proof. No existing assertion was removed, skipped, weakened or moved under a new width or branch condition. The old standalone dependent-refusal test was folded, preserving its assertions, into the larger ServiceM8 sanity journey; the two touched API files still register 31 tests total. No browser test registration was added.
- Authority, erasure and replay: current Owner and excluded reads exercised; withdrawal denied on the next request; erasure denied every retained-original URL; lost-answer replay and actual-restart unchanged reimport create no business effect. Existing shared erasure and native session guards remain in use.
- Screen: existing seed look and text sizes retained; no icon-only controls or one-sided borders added; no new configuration surface. Review is shown at 1440 and 390, with changed-screen captures selected explicitly in the packet.
- Generated files and lock: generator write then check passed; view files restored whole from main; source lock regenerated last and checked. No migrations added, so ledger check is not applicable.
- Publication scan: NOT RUN in cloud, as authorized by the cloud adaptation. commit=1b615b444443efb47b2cea492ace97a43e8a5207, complete=unestablished, historyScanned=unestablished, findings=unestablished. No scan success or zero-finding claim is made. The maintained Mac lander must run it from full history before landing.
- Counts: observed main has 11 DONE, 223 PARTIAL, 29 MISSING across 263 Status rows. Product text retains those counts. Proposed after successful independent judgment and landing: 12 DONE, 222 PARTIAL, 29 MISSING; GLOVE-11 PARTIAL -> DONE. No other clause changes.

## Validation and custody

Touched API suite: 31 passed, 0 failed. Final committed-candidate ServiceM8 API proof: 2 passed, 0 failed. Final committed-candidate browser journey: 1 passed, covering both widths; added review assertions run at 1440. Typecheck, first-party profile, contract generator write and check, and source lock check passed. Actual logs, receipt.json, lock-receipt.json and the two selected review screenshots are in this packet. No migrations changed.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses GLOVE-11 and check --clauses GLOVE-11 exit=0; ledger=none exit=0.

Initial exact-SHA discovery immediately after push returned no runs yet. Workflow configuration has push entry for every branch. Discovery will be repeated only after the 300-second polling interval; no duplicate dispatch or PR is needed while GitHub processes the push. Latest observed main e555cc0ada4915dd1f64a5fa09ab77cff7a468a4 has Verify 42467836802 and Run site 42467837032 completed successfully. The product candidate does not equal main; landing is not performed in cloud.

No blockers are known from local touched checks. Exact-SHA branch Verify and the guarded landing remain pending until their actual receipts establish them. Evidence publication transports this report and selected actual receipts only; it grants no product acceptance or landing authority.

Registration check: raw test registrations remain 18 -> 18 in ./tests/api/movein.test.mjs, 17 -> 17 in ./tests/api/flows.test.mjs and 1 -> 1 in ./tests/browser/movein.spec.ts. Generated cases are included in the 31 passing touched API tests.

Fixture review totals: 20 -> 22 source objects after adding two documented unused cases. Candidate preview accounts for all 22: 12 mapped source objects, 7 merged, 2 unused and 1 rejected, producing exactly 14 native destination records. It names 2 missing attachment files. The 8 actually received files are all retained and downloaded byte for byte.
