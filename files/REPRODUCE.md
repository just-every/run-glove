# Reproducing the replay receipts

The committed regression is self-contained: from the candidate checkout with dependencies, run:

    node --test --test-name-pattern='ServiceM8 every source record' tests/api/movein.test.mjs

It uses the frozen main-era mapper fixture, ordinary HTTP import/commit doors, persisted D1 and a real Worker rebuild/restart. It adds no test registrations and has one added assertion for the upgrade repeat.

The separate before/after probes use the actual full main Worker, not a fabricated journal. To reconstruct those probes in an isolated checkout of the declared repository:

1. Check out candidate 706d282048b79271445ae179aa83234635826062 and install its pinned dependencies.
2. Create /tmp/sx-glove-main-era as a detached worktree at c993c94ac3edebe7bba7c90a0ab06a0ee00f1fc1 and /tmp/sx-glove-before-fix at 81b7665ce37d19dd38432198376a4189a5bf69a9. Make the same dependency installation available to those source trees.
3. Copy this packet's upgrade-harness.mjs, main-era-probe.mjs and main-era-refusals.mjs into tests/api/ under those same filenames. The harness initially bundles the actual main Worker entry. Its restart bundles the candidate Worker or PROBE_TARGET_ENTRY and preserves the same persisted D1 and session bindings.
4. Run from the candidate root with the ordinary cloud toolchain environment and cloud_run subreaper:

    PROBE_TARGET_ENTRY=/tmp/sx-glove-before-fix/tests/api/worker.ts PROBE_RECEIPT=/tmp/before-replay.json cloud_run node tests/api/main-era-probe.mjs
    PROBE_RECEIPT=/tmp/after-replay.json cloud_run node tests/api/main-era-probe.mjs
    PROBE_RECEIPT=/tmp/after-refusals.json cloud_run node tests/api/main-era-refusals.mjs

Each run first imports all 22 current fixture records on main and proves main's repeat succeeds, then upgrades the Worker while retaining that actual installation. Random installation IDs and event times make digest values differ across runs. Within each run the before/after hashes must match. The first command returns a captured 409 SOURCE_ID_CONTENT_CONFLICT; the second a captured 200 committed response. The third additionally probes unchanged refusal semantics after a changed material price and after a native edit.

These scripts are evidence-only, not product branch files. No external provider or owner session is used. Synthetic fixtures and provider-boundary fakes are the same as the ordinary API harness.
