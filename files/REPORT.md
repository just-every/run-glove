# sx-glove-f124fix1 results

Repository: just-every/run-glove
Branch: cloud/sx-glove-f124fix1
Candidate: 706d282048b79271445ae179aa83234635826062
Fix commit: c0f9999a820d47fe3965959c97cdb06a406c0599
Merged main: 434cc298a5bf6af70b08e6c389cede64a85cce7e
PR: none; this repository's AGENTS.md does not require a PR for the cloud landing handoff.

## Scope and plan

Only BLOCKING A, GLOVE-11 point 3: preserve the unchanged-repeat identity of ServiceM8 records imported before price-line source IDs were added. The complete execution plan is in PLAN.md. Start was the specified full-history 81b7665 candidate. Main was merged before the first push and merged again after it advanced; both published heads were ordinary guarded pushes with no force or default-branch write.

## Before and after

The probe imported all 22 candidate fixture records with the actual production Worker from main c993c94ac3edebe7bba7c90a0ab06a0ee00f1fc1. An unchanged repeat on that main Worker succeeded with identical business/source/provenance snapshots. The same persisted D1 installation and sessions were then retained while its Worker was upgraded.

Before: target 81b7665ce37d19dd38432198376a4189a5bf69a9 advertised 22 already-moved-in records, then returned HTTP 409 SOURCE_ID_CONTENT_CONFLICT. Receipt: before-replay.json.

After: target 706d282048b79271445ae179aa83234635826062 advertises the same 22 already-moved-in records and commits the unchanged repeat with HTTP 200. All business records, original ik_sources claims and original ik_provenance rows have identical before/after hashes. Receipt: after-replay-exact.json. This compares imported effects and original journals; preview/batch and audit bookkeeping retain their existing normal behavior.

Additional exact-head public-door probes still return HTTP 409 SOURCE_ID_CONTENT_CONFLICT for changed material content and HTTP 409 NATIVE_EDIT_CONFLICT for a subsequent native customer edit. Both refusals preserve their before/after business and original-journal snapshots; see after-refusals-exact.json.

Fresh imports retain material/price-line source IDs. The existing flow assertions continue to check those values, exact original-file bytes, review fingerprints, restart retention, unchanged current-era repeats, undo, dependent-work refusals and native-edit preservation. No assertions were removed or weakened.

## Implementation

Glove's ServiceM8 planner reads prior job source claims in bounded groups. If current enriched effects differ, it computes the old price-line form and selects it only when its complete effect hash equals the stored claim. Existing engine checks still require the same source payload, mapping version, owner journal, provenance and untouched native values. This does not rewrite legacy journals or imported records and does not admit another changed mapping. New imports continue to use enriched effect values. Preview uses the enriched mapper solely to display retained source relationships for legacy records.

One regression assertion was folded into the existing ServiceM8 test in tests/api/movein.test.mjs. It imports through HTTP with a frozen main-era mapper, rebuilds/restarts the real Worker on candidate code while keeping the same persisted D1, then compares status, all business records and original source/provenance rows after the repeat. The frozen test mapper comes from main and resolves the ordinary production dependencies. The test harness now accepts esbuild plugins and an explicit rebuild on restart to support this upgrade scenario; default restarts are unchanged.

## Checks and counts

- Both touched API files: 31 passed, 0 failed. Complete actual output: touched-tests.log.
- Exact-head upgrade regression: 1 passed, 0 failed. Complete actual output: regression-exact.log.
- Exact-head typecheck: passed. Complete actual output: typecheck-exact.log. Local runner used the VM Node v24.19.0 through the supplied toolchain, and pnpm 10.12.4; CI selects the project pin Node 22.20.0.
- Contract generator write/check: passed. Main's generated views were restored; source, judgment cells and both views exactly match merged main.
- Source lock was regenerated last and its exact-head check passed.
- Test registrations: unchanged, +0. Added regression assertions: 1.
- Contract counts relative to merged main: 14 done / 220 partial / 29 missing / 263 total -> 14 / 220 / 29 / 263. GLOVE-11 remains PARTIAL; Status, Gap and Evidence cells are unchanged.
- No publication scan, UI redesign, campaign continuation, Base update, release or landing was performed. No UI changed in this FIX, so browser proof was not repeated.

## CI and custody

Product is pushed at the candidate SHA above. Verify run 42481575549 completed successfully on exact candidate 706d282048b79271445ae179aa83234635826062. URL: https://github.com/just-every/run-glove/actions/runs/42481575549 . One REST watcher used three GitHub calls total (discovery and two polls), separated by at least 300 seconds. Complete actual final status is in ci-final.json and verification-receipt.json. An independent git ls-remote read also confirmed the exact pushed product ref; see product-remote-ref.txt.

All candidate commits, including side parents, were inspected before each product push. Every author and committer is Run Edit Run fleet <fleet@runeditrun.com>, and all candidate messages have no co-author trailers. Fleet commit hooks remained enabled. The retained packet includes explicit complete non-secret reports and receipts only; no credentials, installation settings or private gate inputs are included.

CLAIM GLOVE-11 PARTIAL points=3 tests=tests/api/movein.test.mjs#ServiceM8 every source record is reviewed, fingerprinted, retained through restart, repeated without effects and safely undone
GAP GLOVE-11: This FIX addresses only the frozen blocker; the independent fleet gate owns acceptance and clause judgment.

Blockers: none. Exact-SHA Verify is green. Evidence transfer is separate from product readiness; its destination is evidence/sx-glove-f124fix1 and its exact ref/head is returned in the terminal EVIDENCE line. The fleet still owns the independent frozen-rubric gate, publication scan and landing. This builder did not change any clause judgment.
