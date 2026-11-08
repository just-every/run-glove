# sx-glove-browserflake-2

Repository: just-every/run-glove
Product branch: cloud/sx-glove-browserflake-2
Product head: 5ed76137a9974c25914b4e9aa8841a05f9578be2
Initial main: e756d5d9c075b61c9222ca1c52a6fd4bd03303f4
PR: none; repository AGENTS.md defines no PR-only landing rule.

## Problem and change

The fresh-install journey installed a ticking fake clock at 2026-11-01T09:00:00.000Z and then asked pauseAt to pause at that same instant. Command latency could put that instant in the past. The journey now uses setFixedTime(phoneTime); Date stays exactly at 09:00 UTC while timers run normally. The unnecessary resume call was removed. Every original capture timestamp, attribution, offline-state, completion, payment, export and role-refusal assertion remains intact. No timeout, retry, test registration, application source or contract was changed.

A search of clock.install, clock.pauseAt, clock.setFixedTime and clock.setSystemTime across all browser specs and helpers found only this install/pauseAt pair. Other clock installations in routing and recurring-billing do not pause at the installed instant.

## Plan

1. Read fleet rules and repository instructions; use a fresh full-history clone of the declared repository, fleet identity, cloud commit cleanup hooks and the supplied toolchain.
2. Replace the single race with fixed Date time and remove the obsolete resume, preserving all assertions and the exact 09:00 UTC instant.
3. Run setup, build, Verify's pnpm run typecheck, regenerate the source lock last and check it. Commit and preserve the first real change through the fleet push guard.
4. Run the complete fresh-install spec ten consecutive times through the existing real-installation runner, with a separate fresh installation each time. Run it once more with browser-only CPU throttling. Stop on any failure; these are mandated repetitions, not retry-until-green.
5. Inspect exact-SHA Verify using REST within the ten-call budget and five-minute minimum polling interval. Merge current main after publication instead of rewriting published commits.
6. Publish the complete actual non-secret report/receipt packet on evidence/sx-glove-browserflake-2, keeping it out of product commits. Relay the final product and CI provenance to the lane. The fleet owns scanning and landing.

## Validation

Setup, production build, pnpm run typecheck, source-lock regeneration/check and git diff --check passed. Chromium is /usr/bin/chromium with --no-sandbox under the normal HOME. The runner creates independent temporary installations and stops its own runtime PID before removing them.

The browser-only load run passed with Emulation.setCPUThrottlingRate rate 6 applied before returning each of the four new pages. Both desk widths (1440) and phone width (390) are recorded in cpu-6/throttle.jsonl. No machine stress tools or CPU-burning loops were used. See cpu-receipt.json and cpu-6/command.log.

The initial repetition batch passed eight fresh installations, then stopped on an ECONNRESET at the recurring-job POST (fresh-install.spec.ts:164/170), before the clock step at line 194. The owned dev log records no clock error. This transport failure is retained in normal-09/command.log and initial-stability-receipt.json; no failed attempt is hidden or retried within a test.

The second, explicitly bounded batch passed all ten consecutive fresh installations on the exact pushed SHA. It had no retries and was configured to stop on any failure. Product code, assertions, timeouts and retry settings remained unchanged. stability-receipt.json records this confirmation batch; confirmation-NN holds each actual receipt and proof. The initial eight successes, initial transport failure and CPU pass remain in the packet.

| Confirmation run | Exit | Full install + journey seconds |
| --- | ---: | ---: |
| confirmation-01 | 0 | 87.419 |
| confirmation-02 | 0 | 85.500 |
| confirmation-03 | 0 | 89.448 |
| confirmation-04 | 0 | 84.732 |
| confirmation-05 | 0 | 85.220 |
| confirmation-06 | 0 | 87.621 |
| confirmation-07 | 0 | 86.376 |
| confirmation-08 | 0 | 86.091 |
| confirmation-09 | 0 | 87.071 |
| confirmation-10 | 0 | 86.245 |
| CPU throttle 6x | 0 | 205.504 |

The requested consecutive proof is 10/10, plus the separate CPU pass. Across all attempts, 19 passed and 1 failed with the pre-clock transport reset described above. All nineteen successful business receipts report passed=true and preserve all five captures. No claim is made that every attempted local run passed.


## Counts and scope

- Same-instant install/pause pairs: 1 before, 0 after.
- Touched test registrations: 1 before, 1 after.
- Added/deleted/skipped tests: 0/0/0.
- Changed product files: tests/browser/fresh-install.spec.ts and its generated sources.lock.json hash.
- Clause status changes: 0. No clause completion claim.
- Application source and CONTRACT.md: no committed changes.
- Generated ACCEPTANCE.md and docs/CLAIMS.md: no changes.
- Setup/build regenerated whitespace in src/routeTree.gen.ts; that generated side effect was restored before locking and committing.

## Product custody and CI

The fleet push guard published the first real commit successfully on attempt 1. All candidate author/committer identities were Run Edit Run fleet <fleet@runeditrun.com> and no trailers were present. A subsequent fetch of origin/main and merge reported already up to date. Published history was not rewritten.

Verify run 42498288551 completed successfully on exact SHA 5ed76137a9974c25914b4e9aa8841a05f9578be2. URL: https://github.com/just-every/run-glove/actions/runs/42498288551 . Four GitHub calls were used, including the incomplete-SHA discovery; the two status polls were more than 300 seconds apart.
One discovery request accidentally used an incomplete placeholder SHA and returned no runs; it was counted against the budget. The subsequent full-SHA discovery found the actual Verify. No conclusion is inferred from the empty discovery.

No cloud publication scan was requested by this test-only brief; the fleet's publication/landing checks remain its responsibility.

## Final result

The product branch is pushed, exact-SHA Verify is green, and the required ten consecutive fresh-install proofs plus CPU-throttled proof passed. The initial pre-clock transport failure is recorded; its underlying cause is unproven and no unrelated application change is included. No remaining blocker to the requested clock fix. The fleet owns publication scanning and landing; no main/default branch was pushed.

The packet contains the full plan, sanitized setup/build and journey logs, actual business and Playwright receipts, product/CI provenance, browser-throttle helper, run harnesses, initial failure context and every generated proof PNG. Cookie/authorization header lines were removed from the initial failed command diagnostic before evidence publication; that temporary installation and its sessions were stopped and deleted. No credentials, environment dumps, private gate material or symlinks were selected.
