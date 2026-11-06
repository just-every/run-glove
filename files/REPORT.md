PLAN-008 interrupted-batch repair — sx-glove-c-f110

Product candidate: just-every/run-glove, cloud/sx-glove-c-f110, 92de027e2c7f2faa0b99b563f183276d00adc237.
Base main: acfdd944a4356002ad6a1d27707cc68c32ce0730. Both candidate commits retain all parent Status rows. The branch was fetched and merged immediately before final mechanical checks; main had not advanced. No PR is required: Verify accepts all pushed branches.

PLAN-008 remains PARTIAL → PARTIAL. Counts remain 7 DONE, 227 PARTIAL, 29 MISSING; all 263 Status rows and 474 table rows remain. The changed plan row is PLAN-008's interrupted-outcome qualification only. The supplied POINTS deliberately holds the rest of point 1's batch, conflict and authority matrix and complete points 2–5. Acceptance text is unchanged.

Implementation and result

The prior batch labeled a committed booking “not booked” when its transport reply was lost. The corrected UI distinguishes an unconfirmed booking or job creation from a known refusal, stops the batch, and explicitly identifies later entries as not attempted. Existing Retry retains and reuses the original command identity. Once authoritative state is recovered, the batch result shows the actual booking and clears the obsolete Retry instruction. No new command, booking authority, customer link, outbound send, move or cancellation is added. Only src/ui/due-visits.tsx changes product behavior; API and backend authority implementations are unchanged.

The existing browser registration invokes interruptedBatch in tests/browser/due-visits.spec.ts, lines 315–430. Three distinct native entitlements use ordered due dates and a fixed clock. The first real Worker visit.book succeeds; only its HTTP transport reply is discarded at lines 328–338. Lines 349–360 check explicit uncertainty, later unattempted entries, exactly two original commands and the actual retained job and visit. Lines 362–382 restart the Worker, recover using Retry's identical command, assert completely unchanged domain state, show the actual booking, then restart and reload without extra commands. Lines 383–404 use the real batch controls to book only the two unattempted entries and reuse the retained included job; Activity and business export retain exactly one attributable event for the original command. Lines 405–429 complete the recovered visit through the technician's actual arrival and completion controls, prove completion survives Worker restart, and show the other work remains due until separately completed. The existing success, conflict refusal, outside-send, customer-offer, brief, history and maintenance assertions remain intact.

The existing Forty due entitlements and exact owner projections survive bookings, cancellations, completion, declines, delivery and restart registration additionally invokes interruptedBooking in tests/api/agreements.test.mjs, lines 687–743. It discards a real successful response without SQL-seeded domain state, restarts durable D1, recovers the original result without changing state, refuses a changed payload under that identity, proves exact outstanding identities, and checks exactly one Office-attributed booking in Activity and export. Explicit subsequent commands reuse the retained job; completion removes only its entitlement.

PROBE PLAN-008 1: Dispatch selects three native due entitlements; the real Worker commits the first visit.book and its transport reply is discarded → booking outcome unconfirmed, two later entries not attempted, original command identity recovered by Retry, exactly one original booking and event, all three still due until completion. Restart and reload issue no extra commands; the next explicit batch reuses the retained included job; actual technician controls complete the recovered visit, leaving only the other two due.
PROBE PLAN-008 2–5: none; the supplied POINTS holds complete qualification of these outcomes and the broader authority matrix. Existing authority guards are unchanged.

Actual validation

- Before proof: browser exit 1. Expected “booking outcome unconfirmed”; received “not booked” after a genuine successful Worker response. before-browser.txt contains the actual sanitized failure. The original implementation is the one-off regression variant; no permanent mutation test was added.
- Exact committed candidate browser: exit 0, one existing registration passed, 47.0 seconds for the journey and 50.1 seconds including Playwright startup. browser.txt records the actual run. The runner builds and starts its own real installation and closes its browser and owned server. Changed-screen proof is included at 1440 and 390 for interruption, reconciliation, recovered due work and completion. Business assertions run at 1440; the existing screenshot helper proves reflow at both widths.
- Exact candidate API: exit 0, 7 passed, 0 failed, 0 skipped; Node 22.20.0. api.txt records the actual run.
- pnpm typecheck: exit 0 on Node 22.20.0. No assertions were removed, weakened or moved behind width or branch conditions. No test registration was added or removed; no cap change was requested.
- npx -y @runeditrun/rer check --profile first-party: exit 0. local-checks.json binds the actual checks; first-party.txt is empty because the successful command emitted no output.
- MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock, then node scripts/edition-authoring/cli.mjs check exit=0; views=node scripts/contract-docs.mjs write --clauses PLAN-008, then check --clauses PLAN-008 exit=0; ledger=none exit=0. mechanical.json records these results. Generated ACCEPTANCE.md and docs/CLAIMS.md were restored whole from origin/main; neither is committed. The final tree is clean. No migration changed.
- Every unpublished candidate author, committer and trailer was inspected before both product pushes, including all side parents. Both commits use fleet identity, no co-author trailers, preserved hooks and no force push. No new email-shaped string was introduced in product changes. The source clone has full history.

DONE-RIDERS assessment; no DONE claim

1. PARTIAL: the bounded interrupted outcome is reached and checked, but the supplied omitted outcomes remain unqualified. Browser lines 328–429 and API lines 705–741 prove this round's outcome only.
2. PASS for the changed outcome: actual native seeded work and the real Worker commit are observed, with complete state equality and exact-once history after replay. Existing conflict refusals remain exercised. No claim is made for the held matrix.
3. PENDING candidate Verify; both changed journeys remain inside its existing browser and API globs. Local exact-head runs passed. No workflow was edited.
4. PASS for local proof: browser and API runs used the committed candidate above, followed by no source changes. mechanical.json binds final checks to the same head.
5. UNCHANGED: PLAN-008 cites BASE-ROLE-001; receiving duties and role guards are unchanged.
6. PASS for this partial update: Evidence names both journeys, Gap retains the unproved remainder, counts and rows are unchanged, generated write and check pass before the required view restoration. No global judgment provenance or DONE claim is rewritten.
7. PASS: no acceptance sentence, clause ID, rider or coverage obligation changed.
8. UNCHANGED: Office agreement-only booking, exact conflict review, no Office move or cancellation, and API-005 automatic-booking prohibition remain binding. No authority implementation changed; complete qualification remains held.
9. UNCHANGED: no provider, compliance, live-account, activation or legal-boundary proof is claimed.
10. NOT APPLICABLE: no policy default or custody decision was introduced.
11. PENDING fleet landing. No main equality, candidate Run site or complete publication-scan receipt is claimed.

Pre-handoff checks

The user-visible changed outcome fails on the original implementation and passes in the actual candidate journey. No existing assertion is removed or narrowed. Replay creates no second booking or event. Erasure and withdrawn-authority paths are unchanged and are not newly claimed as qualified. No icon-only control, configuration surface, font rule or border rule was added; existing Previous day tooltip proof still passes. Screens were inspected at both required widths. Accepted runtime and Base pins are unchanged. Publication scanning and exact-head CI admission remain fleet responsibilities; this cloud did not run the Mac publication scanner.

Held remainder

The rest of PLAN-008 point 1 and complete points 2–5 remain outside this narrow round. PLAN-004 forty-visit qualification, PLAN-007 and PLAN-009 queued work, PLAN-010 and PLAN-011 customer-bearer, security, restore and customer-reply journeys stay omitted. All supplied customer-side Checkout, messaging and consent, account, ct and Base prerequisites, Lanyard availability, gr-base-285 resolved-address egress adoption and accepted-runtime-pin holds remain unchanged. The fix introduces no new account dependency and has no known local blocker.

Product custody and CI

The initial coherent save a5d29ea0a4ebd04e751c7c5ad14f741c6e5b1360 was pushed with [skip ci]. The final candidate is 92de027e2c7f2faa0b99b563f183276d00adc237; its substantive final commit adds durable-reload and completion proof. Both pushes succeeded on attempt 1 through the fleet push guard. main-ci.json records the inspected base: Verify 42151113949 and Run site 42151113801 were completed successfully on acfdd944a4356002ad6a1d27707cc68c32ce0730. The first candidate workflow discovery returned no runs during indexing; the final observed candidate state is appended below. No green result from main or another SHA is attributed to the candidate. No PR was created, no deployment was made, and main was never pushed or fast-forwarded.

The complete plan is PLAN.md. Actual logs, mechanical and local-check receipts and eight selected changed-screen images are included in this packet. No credentials, private runtime entry, environment dump, held-out gate material or symlink is selected. The evidence ref is a separate report-only tree and signals no product acceptance or landing.

The required restoration of main’s generated views leaves the expected check result: exit 1, “ACCEPTANCE.md: generated content differs; run contract-docs write.” restored-views-check.txt records it. Local generation and check passed immediately before restoration. This is the expressly permitted generated-view exception, not a repair or a source-lock failure.

Final CI observation: Verify 42158671063, event push, head 92de027e2c7f2faa0b99b563f183276d00adc237, status in_progress, conclusion None. URL: https://github.com/just-every/run-glove/actions/runs/42158671063. Three GitHub REST calls were used: one base discovery and two candidate discoveries separated by at least 300 seconds. No workflow was dispatched or rerun. The branch already has its required Verify entry point. Exact-head CI admission, the complete publication scan and Run site remain pending fleet gates; the final READY line is the brief's cloud handoff, not a green-CI or landing claim.
