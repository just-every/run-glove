# sx-glove-f127fix1 — one blocking journey repair

Repository: just-every/run-glove
Branch: cloud/sx-glove-f127fix1
Start: 3041ce39fb8a867522c4b3cac85402ba32d3ff83

## Plan

1. Read fleet/repository instructions and the shipped RULES; obtain the completed failing browser-4 job log once.
2. Identify the exact assertion and distinguish f127 product regression from clock or fixture state dependence.
3. Merge current main without weakening its tests or changing contract judgments.
4. Repair only the journey's fixture cause; retain every existing assertion and add no test registrations.
5. Regenerate source lock last, check it, typecheck, and run the affected journey with its shard predecessors. Keep screenshots and actual command receipts outside the product checkout.
6. Audit every unpublished commit identity/message, preserve the first real commit using the required guard, then publish the final candidate and await exact-SHA Verify within the ten-call API budget.
7. Publish this non-secret report/receipt packet to evidence/sx-glove-f127fix1 separately from product custody.

## Diagnosis and before proof

Verify 42482616582, failed job 128737775128 (shards browser-4), failed the 1440px MONEY-002 / BOOK-005 journey at checkToday, journey.spec.ts:154: expect(jobIds.has(mine.id)).toBe(true), received false. Complete retrieved failed-job log: before-ci-browser-4.log.

The journey started 2026-11-08 12:59:36 UTC and failed 13:00:25 UTC. In Australia/Sydney (UTC+11 then), this crosses midnight. A visit booked before midnight is yesterday's visit when Today is checked after midnight. The dashboard excluding it is correct. The candidate's f127 changes add API custody coverage and a provider fixture, not application behavior or this journey. This is a real-time fixture assumption, independent of the preceding shard-order fixture flake.

## Repair

The journey selects between two supported real business timezones, Australia/Sydney and America/New_York, choosing the one farther from midnight at its start. Both browser and Worker retain their real clocks. Save that timezone through the business settings UI for each width, including when an earlier test created the business; fill the creation-only currency control only for a new business. Existing booking, date, timezone, money, dashboard and downstream assertions all remain; the two expected retained visit timezones follow the chosen real business timezone. No assertions deleted, skipped, relaxed or added. No application UI/source change.

All contract Status/Gap/Evidence cells and generated view files are unchanged. No publication scan run, as the brief explicitly forbids it. No new DONE claim; original COMM-015 builder claim remains for the lander.

## Results

Local touched checks and final exact-SHA Verify passed; actual receipts are retained in this packet.

## Integration and counts

The first saved merge preserved main 3a6b0e4 and all newer browser fixture assertions. Main then advanced to 1caa3765552bf70bde548bf7a34c2bdf71118e47 (ServiceM8 changes); it was merged without conflicts into 26186ea655b961814f03ea7bd11b4f4b581b8da4; the source lock was regenerated last and checked successfully. No contract source change or conflict exists. Counts before/after this FIX: 263 clauses, 14 done / 220 partial / 29 missing. Browser registrations remain 45 in 23 files; this FIX adds zero registrations and zero assertions. COMM-015 stays partial.

The initial local 1440 journey passed the formerly failing Today step. Its phone counterpart exposed an editing error (trying the creation-only currency control on an existing business); that local run was intentionally interrupted, the conditional restored, and the unpublished commit amended. The interrupted receipt is retained as local-browser-interrupted.log and is not final proof.

The corrected repair commit 0237db9 (abbreviated; see Git history for its full identity) passed its 1440px and 390px journeys after custom-roles and documents, 4/4 total, in 2.2 minutes (after-predecessors-browser.log). Final merged-head typecheck, contract-docs check, edition source lock check and diff whitespace check passed. The final-head browser proof and exact-SHA CI receipt follow below.

## Final local proof and custody

Final product head: 26186ea655b961814f03ea7bd11b4f4b581b8da4. Both complete MONEY-002 / BOOK-005 owner/dispatcher/technician/office journeys passed on this merged head at 1440px and 390px, 2/2 in 1.8 minutes. Complete output: after-local-browser.log. The Today screenshots at each width are included. Typecheck, contract-document freshness, source-lock check and whitespace check passed. local-receipt.json records commands, heads and outcomes. All five candidate commits, including both sides of merges, have the fleet author and committer and no trailers (identity-audit.json). Product push uses the required guard; final-push.log records its actual result.

Exact-SHA Verify discovered: run 42487476824, https://github.com/just-every/run-glove/actions/runs/42487476824 (head 26186ea655b961814f03ea7bd11b4f4b581b8da4). One watcher, 301-second poll spacing; discovery plus earlier failed-run investigation consumed 3 of the ten GitHub calls at this point. No PR was created; fleet landing uses the named branch.

## Final exact-SHA Verify and handoff

Verify 42487476824 completed/success on 26186ea655b961814f03ea7bd11b4f4b581b8da4, confirmed by REST at 2026-11-08T14:13:41Z. This is the final merged and pushed product SHA. No generator-only exception was needed. ci-receipt.json and ci-watcher.log contain every scheduled status read; six total GitHub calls were used, including the two original-failure investigation calls. The final merged product branch was independently confirmed by git ls-remote and the checkout was clean. terminal-receipt.json records terminal product provenance.

Before: the named 1440px journey failed in Verify 42482616582 / job 128737775128 because Sydney crossed midnight. After: the same 1440px journey and existing 390px journey passed locally on the final merged SHA, and full Verify 42487476824 is green on that exact SHA. The predecessor-inclusive run also passed 4/4 before the final main integration. No product behavior changed, no assertions were weakened/deleted, no tests were added, and no Status, Gap or Evidence cells were edited.

Counts before/after: done 14 → 14, partial 220 → 220, missing 29 → 29, 263 total clauses; browser registrations 45 → 45. COMM-015 remains partial; no new DONE claim. No blockers. No PR was created. Product custody is READY on cloud/sx-glove-f127fix1; evidence publication is separate and does not accept or land the product. The fleet and its independent gate retain landing authority.

All reports and receipts are published only through refs/heads/evidence/sx-glove-f127fix1. After the final evidence publication and remote ref confirmation, the disposable product clone is removed under the fleet clone cleanup rule; the actual packet and publication logs remain under the fleet work directory.
