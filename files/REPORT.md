# sx-glove-c-f111 — FIELD-011 manufacture dates

FIELD-011 remains PARTIAL → PARTIAL. This round closes the selected manufacture-date normalization slice of acceptance point 1. It does not claim the entire point or clause DONE. Status counts remain 7 DONE, 227 PARTIAL, 29 MISSING; every one of the 263 parent Status rows is retained. No PR is required: Verify accepts branch pushes.

## Scope and result

The native nameplate reader previously serialized an invalid Date before validating it. A model answer of 2026-02-99 threw RangeError: Invalid time value and the public command returned HTTP 500, UNCONFIRMED. The normalizer now checks that the timestamp is finite before serialization, then keeps the existing exact calendar comparison. It preserves YYYY, YYYY-MM and YYYY-MM-DD precision and rejects calendar rollover. Neither provider logic nor phone UI code changed.

The existing API journey was extended in place, keeping all four registrations and all original assertions. It independently checks three valid precisions, a leap day, invalid days and months, free-form and non-padded dates, every empty model field, unchanged equipment before confirmation, corrective INPUT refusal with unchanged equipment and proposals, same-technician confirmation, corrected-field history, replay before and after an actual Worker restart, no duplicate equipment or provider calls, attributable Activity and export, photo-only provider input, storage disabled and private credentials. The old provider-shaped fixture credential was replaced with synthetic-glove-111.

The source change is confined to the date normalizer. CONTRACT.md changes only FIELD-011 Evidence and Gap. Generated views are checked locally and restored to main; they are excluded from the product commit. The source lock is generated last.

## Acceptance map and probes

- R1: exact printed precision — native nameplate.read and nameplate.confirm retain 2026, 2026-02 and 2024-02-29 exactly. Surrounding spaces are trimmed; no precision is invented.
- R2: invalid model dates — 2026-02-99, 2026-02-29, 2026-04-31, month 00, month 13 and day 00 remain unread rather than throwing or rolling over.
- R3: free-form and empty fields — June 2018, 2026-2-01 and empty dates remain unread; a fully empty model answer preserves all four unread markers.
- R4: corrective refusal — five invalid technician corrections return INPUT with field manufactured; the exact equipment and proposal snapshots are unchanged. A later valid correction succeeds.
- R5: confirmation custody — explicit same-technician confirmation retains exact fields, separately keeps proposals and corrections, and survives command replay and Worker restart without another unit. Existing wrong-technician and dispatcher refusals remain.
- R6: disclosure and credentials — only photo instructions and bytes reach the model edge, with storage disabled; the synthetic private credential is absent from state, Activity and export. No live provider claim is made.
- R7: phone controls — one-off native-Worker-backed phone review at 1440 and 390 exercises the actual camera input, editable fields, invalid correction, explicit confirmation and reopening the persisted visit. Browser transport is bridged to the real Worker with a native technician session. Domain results and state are not mocked; model transport is faked. Existing invitation-mail transport faking supplies native test people.

PROBE FIELD-011 1 precision: native read and confirm, YYYY and YYYY-MM and YYYY-MM-DD -> exact printed precision retained.
PROBE FIELD-011 1 invalid: native read, 2026-02-99 and impossible calendar days -> empty manufactured field and unread marker; HTTP 200 after fix, HTTP 500 before.
PROBE FIELD-011 1 empty: native read, all four empty fields -> all four unread markers; equipment unchanged.
PROBE FIELD-011 1 correction: native confirm, invalid date -> INPUT and exact unchanged equipment and proposal; later valid 2020-12-31 retained.
PROBE FIELD-011 1 persistence: native command replay and actual Worker restart -> exact confirmed records, corrected fields and equipment count retained.
PROBE FIELD-011 2: none, complete signal, offline-day and manual qualification is explicitly held by the planner-selected scope.

The complete point 1 manual-library matching and attachment qualification, complete point 2 signal and offline-day and manual qualification, and FIELD-006 company-policy selection remain outside this repair. The fixed same-technician confirmation gate remains. Customer-side Checkout, messaging and consent, account and ct and Base prerequisites, Lanyard availability, gr-base-285 egress and adoption, native devices, accepted runtime pins and activation and release holds are unchanged.

## Before and after proof

api-before.txt records the failing public command and RangeError, with the expanded regression journey and original source. phone-before.json and phone-before-390.png reproduce HTTP 500, UNCONFIRMED through the actual phone controls. api-after.txt records all four passing registrations. phone-after.json and the width-specific images retain the final phone outcomes.

One initial API assertion incorrectly expected private event data in the Activity projection. It was corrected to use the projection's public command identity, subject identity and actor identity; no existing assertion was weakened. Its diagnostic is retained in api-after-attempt1.txt. Early phone harness attempts exposed an owned-process overlap and background requests during test Worker disposal. The probe now serializes requests during restart, bounds browser waits and reopens the visit explicitly after navigation; those actual diagnostics are retained. The online proof blocks service workers so all browser requests, including original photos, reach the native Worker through the transport bridge. With this bridge setup, original JPEG decoding passes at both widths; no offline qualification is claimed. These were local proof-harness corrections, not failed candidate Verify repairs.

## DONE-RIDERS disposition

No DONE claim or judge request is made. Numbered dispositions for this exact bounded slice:

1. UNMET for whole clause: remaining manual qualification and point 2 are held. R1–R7 cover this round's selected slice.
2. PASS for selected slice: nonempty seeded records, independent literal date expectations, successful confirmation and unsafe corrective refusals with unchanged state.
3. PENDING exact-head Verify observation; the existing API shard invokes the extended file. The one-off phone proof supplements the committed API proof. Both viewport proofs were rerun on the exact committed head.
4. PASS, final source blob receipt matches: relevant implementation and UI bytes are unchanged between local proof and candidate.
5. UNCHANGED: no inherited duty or acceptance metadata is added or removed.
6. PASS locally: Gap retains all remaining work, Evidence names the actual journey; generator write then check passes. Restored generated views are intentionally left for the lander. Existing global Judged-from provenance is retained because this is not a new whole-clause judgment.
7. PASS: no acceptance point, ruling or parent Status row changes.
8. PASS for selected boundary: existing wrong-technician and desk confirmation refusals remain; invalid corrections change no equipment. No authority code changes.
9. PASS: no live provider or native-device qualification claimed; all such holds remain.
10. PASS: no new custody, consent, spending or authority default.
11. PENDING guarded fleet landing, exact main Verify, Run site and complete publication scan. No cloud-side publication scan or landing is claimed.

## Pre-handoff self-check

The selected behavior fails with the old implementation and passes with the guard. Existing assertions and the test registration count are retained; no width or branch condition hides assertions. Confirmation authority and credential custody are unchanged; persistent replay is exercised. Erasure and credential-revocation implementation paths are untouched by this date-only change. All nameplate action controls have visible text labels; there are no icon-only nameplate controls. Browser proof is confined to this clause's screen. No new email-shaped fixture string or provider-shaped key is introduced. Publication scanning and Run site remain the fleet lander's gates.

## Plan row return

Update only FIELD-011: keep PARTIAL, record the date-normalization slice closed, point to the extended API journey and phone receipt, retain complete manual qualification and point 2 plus FIELD-006 company-policy selection as gaps. Do not reorder or rebuild the plan or advance any other clause.

Terminal provenance, mechanical exits, exact SHA, source blobs, push receipt and CI observations are in RECEIPT.json and the final receipt sections appended below.

## Candidate receipt

Branch: cloud/sx-glove-c-f111. Head: a9eb0fd82893ba412792e5e45d8a9b42b880cbdf. Parent main: acfdd944a4356002ad6a1d27707cc68c32ce0730. Product push succeeded on the first fleet-guard attempt. Candidate identity and all trailers were checked across origin/main..HEAD. No PR was opened or needed. The product checkout was clean before the exact-head proof.

Exact-head local checks: native API journey 4 passed, typecheck 0, first-party check 0, lock check 0. Build 0 on unchanged relevant source. Browser proof 0 on the exact head at 1440 and 390, including a decoded original photo, unread invalid model date, corrective refusal, later valid confirmation, replay and Worker restart. All owned browser and server processes were stopped.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses FIELD-011 and check exit=0; ledger=none exit=0. ACCEPTANCE.md and docs/CLAIMS.md were then restored whole from origin/main and were not committed. No workflow or runtime pin changed.

Verify 42159094264 was discovered as push, in progress, on the exact head. Main's observed Verify 42151113949 and Run site 42151113801 were successful on acfdd944a4356002ad6a1d27707cc68c32ce0730. Publication scanning, guarded landing and candidate Run site remain fleet gates. Latest candidate observation is recorded in the appended CI receipt and RECEIPT.json.

Proof line index in the candidate: {"attributable history": [158], "date matrix": [92], "existing authority refusals": [65], "invalid corrective refusal": [129], "proposals and no automatic fill": [107], "provider disclosure": [50, 153], "restart and replay": [142], "valid correction": [137]}. All references are within ./tests/api/nameplates.test.mjs.
Packet selection checks: only explicitly listed regular report and receipt files; injected-value byte comparison returned zero matches. No environment dump, credential file, private gate material or symlink is selected.

CI observation at 2026-11-06 03:57:39 UTC: Verify 42159094264 is still in progress on a9eb0fd82893ba412792e5e45d8a9b42b880cbdf. No final success or failure is claimed. GitHub API calls used: 3.

Initial evidence transfer: refs/heads/evidence/sx-glove-c-f111 at b56e8cd72225b899ebe3fd58e28839fc5496b919 was fetched successfully and all 50 selected file identities and hashes were verified. The report-only parent commit has fleet author and committer and no trailers. Final CI observation will be published as a normal successor on the same evidence ref; product HEAD is unchanged.

## Final CI and custody

At 2026-11-06 04:03:11 UTC, Verify 42159094264 remains in progress with no conclusion on a9eb0fd82893ba412792e5e45d8a9b42b880cbdf. Two observations were separated from discovery and each other by at least 300 seconds. Four explicit task GitHub API calls were used. The cloud handoff is PUSHED; no exact-head green CI, READY, landing, complete publication scan or candidate Run site is claimed. No known real product-check failure or date-repair blocker was observed. The fleet owns the remaining CI and publication and landing gates. The product branch remains pushed at the exact SHA and the complete selected packet is returned separately through the evidence ref.
