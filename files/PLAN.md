# Plan

1. Use a fresh full-history clone of just-every/run-glove from origin/main; install fleet identity, commit cleanup hooks and pinned cloud tooling.
2. Inspect all browser specs and helpers for install followed by pauseAt at the same instant. Replace the fresh-install pair with setFixedTime, keeping all exact 09:00 UTC capture assertions and all timeouts. Remove the unnecessary resume. No src or contract edits.
3. Run the setup/build and Verify typecheck commands. Regenerate sources.lock.json last and check it. Commit and publish the first real save using the fleet push guard.
4. Run the unchanged fresh-install journey ten consecutive times, each through its real installation runner with fresh state, and once with browser-only CDP CPU throttling (no machine stress). Preserve sanitized command outputs and actual receipts.
5. Fetch and merge updated main after the save; retain newer source judgments and generated views whole if needed. Run touched checks on the final candidate, publish it and inspect exact-SHA Verify through REST, respecting the ten-call budget and five-minute polling interval.
6. Publish this complete non-secret report packet only through evidence/sx-glove-browserflake-2, and return product SHA, CI IDs, unchanged test/clause counts and relay lines. The fleet owns publication scanning and landing.
