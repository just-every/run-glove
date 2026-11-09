# sx-glove-suite-cap-2 results

Repository: just-every/run-glove
Product branch: cloud/sx-glove-suite-cap-2
Baseline main: a81e93dc401029a20f3bf38570b4b2fefd637246
Product head and CI receipt: recorded in RECEIPT.json and ci-receipt.json after publication.

The initial main counter is 203/200. The latest integrated main, 553a489af1a4f789d0b0b38acf7aa5330c0c9236, has 209 registrations (206 direct calls) plus four assertion scripts = 213/200. The final candidate retains the ten SES/SNS and refund registrations added during this task and has 181 registrations (178 direct calls) plus the same four scripts = 185/200, reducing integrated main by 28 registrations. The lower-limit acceptance command is "node tests/inventory.mjs --limit 185".

Only sixteen API test files and the generated sources.lock.json change. No cap/counter/limit changes, no new cases, no runtime or UI changes, no clause status changes, no DONE claim, no generated contract-view changes. No PR is required by the repository instructions; landing remains with the fleet.

Further related variants consolidate hourly and commission payroll exports, office/field quote options, customer quote signing and deposit custody, monthly invoice approval and collection, message delivery custody, and source request provenance. The related cases use the existing scenario helper, with assertions throwing normally, named diagnostics retained, installation cleanups run before the next independent scenario, and the original order kept for shared installations. The import consolidation extends the existing provider-source behavior across the already present ServiceM8, Jobber, FieldPulse, Workiz, ServiceTitan and Housecall Pro cases. Independent domains still have independent registrations.

The exact token multiset of all 2,708 static assert expressions and all 477 explicit error-option calls is identical per touched file before and after. This comparison preserves operators, input values, expected values, failure messages, and provider/refusal cases rather than comparing counts alone. All test names actually cited by CONTRACT.md, ACCEPTANCE.md or docs/CLAIMS.md remain registrations. The cited subcontract filing-total name becomes the containing registration; its former nested registration becomes a named step. No new test enumeration is introduced.

| Merged file | Registrations before → after | Assertion expressions before → after | Refusal expectations before → after |
| --- | ---: | ---: | ---: |
| tests/api/movein.test.mjs | 6 → 1 | 350 → 350 | 36 → 36 |
| tests/api/payments.test.mjs | 6 → 3 | 180 → 180 | 27 → 27 |
| tests/api/security.test.mjs | 6 → 3 | 40 → 40 | 17 → 17 |
| tests/api/equipment.test.mjs | 3 → 2 | 25 → 25 | 6 → 6 |
| tests/api/arrival-windows.test.mjs | 2 → 1 | 66 → 66 | 1 → 1 |
| tests/api/agreements.test.mjs | 3 → 1 | 252 → 252 | 37 → 37 |
| tests/api/quickbooks.test.mjs | 8 → 6 | 340 → 340 | 105 → 105 |
| tests/api/flows.test.mjs | 17 → 15 | 416 → 416 | 98 → 98 |
| tests/api/pipeline.test.mjs | 3 → 1 | 171 → 171 | 34 → 34 |
| tests/api/subcontract.test.mjs | 2 → 1 | 84 → 84 | 21 → 21 |
| tests/api/payroll.test.mjs | 2 → 1 | 30 → 30 | 9 → 9 |
| tests/api/options.test.mjs | 2 → 1 | 61 → 61 | 23 → 23 |
| tests/api/email.test.mjs | 2 → 1 | 181 → 181 | 16 → 16 |
| tests/api/customer-quotes.test.mjs | 4 → 3 | 293 → 293 | 22 → 22 |
| tests/api/recurring-billing.test.mjs | 2 → 1 | 158 → 158 | 16 → 16 |
| tests/api/assessments.test.mjs | 2 → 1 | 61 → 61 | 9 → 9 |

The full operational plan is PLAN.md. consolidations.json records every former registration grouped into each surviving registration. assertion-preservation.json records exact-expression and refusal hashes and retained cited names. assertion-audit.mjs reproduces the comparison when run from a checkout with TypeScript installed; its optional argument selects the baseline SHA; this packet compares against integrated main 01898554241b55d82948c9d145ea849b7db26394.

Local verification uses Verify's touched-file API command with --test-concurrency=1, and pnpm run typecheck. The additional final-step run checks the flattened arrival-window and import wrappers after the redundant wrapper simplification. This is not a full local suite run. Actual command outputs are retained in the selected log files. Static assertion equivalence was rechecked after the final edits. Contract document check passed without writing either generated view. The edition source lock is regenerated last and its documented check is retained.

The cloud toolchain script selects pnpm 10.12.4 and uses the VM's Node v24.19.0 for direct local tests and typecheck; the setup command uses the checkout's runner and exact runtime selection. Exact-SHA GitHub Verify supplies the repository's Node 22.20.0 CI validation.

Before the product push, origin/main is fetched and integrated, the source lock is regenerated, the documented lock check passes, every candidate author/committer/trailer and complete message is inspected, and the inventory acceptance command is run as the last local check immediately before the guarded push. Product writes go solely to cloud/sx-glove-suite-cap-2; reports go solely to evidence/sx-glove-suite-cap-2.

No target clauses are changed or claimed. Browser proof is inapplicable because this changes API test registrations only. The task requests no release or publication scan; the cloud does not perform the fleet's Mac landing/publication step. Final product provenance, command exits, exact-SHA CI, blockers and API-call metadata are in the actual receipts.


Integration handling: the first fetch advanced main from a81e93dc401029a20f3bf38570b4b2fefd637246 to 01898554241b55d82948c9d145ea849b7db26394. The uncommitted source-lock edit prevented an in-place merge, so fleet-identified stash commits preserved the work while the named cloud branch integrated main; the stash then reapplied cleanly. No published history was rewritten. CONTRACT.md and both generated views are main's whole files; the generator write/check ran, then both views were restored from origin/main and the source lock regenerated. No contract-source conflict arose. The second local run includes the first fifteen touched files against main's updated harness. Initial-run and final-step logs remain separately identified, and are not substituted for this integrated candidate's verification.


Local transport correction: the integrated 42-test run completed with 41 passes and one customer-quote failure: "TypeError: Body is unusable: Body has already been read" at signedQuoteOriginals/verifyCopies while consuming a signed-copy response. The unchanged file then passed 3/3 independently. Both signed-copy two-door loops now fetch and consume one response before starting the other request, avoiding retained unread Miniflare response bodies across a subsequent request. The same two requests, byte/hash/manifests, status, authority and damaged-copy assertions remain, with the token-multiset comparison still exact. The final modified customer-quote file has its own rerun receipt; the earlier failure and passing unchanged retry are retained honestly. Other touched tests already passed on the integrated source.


Second main integration: main advanced to 553a489af1a4f789d0b0b38acf7aa5330c0c9236, carrying the pending-only refund-refresh guard plus one API and one browser refund journey. These remain intact, including main's runtime change. Its own inventory now reports 209 registrations (206 direct calls) plus four scripts = 213/200. The final candidate remains 181 registrations plus four scripts = 185/200, a reduction of 28 registrations against that main. To retain both new journeys, assessment booking variants and payment settlement/refund variants contribute two additional existing-case consolidations. The fresh integrated assertion audit covers 2,708 static assertions and 477 explicit refusal expectations in sixteen API files, all token-identical. The table above uses this latest main. A final focused assessments/payments run validates the additional consolidation and main's refund guard; typecheck runs again. No additional cases, source/runtime edits of our own, clause edits, or generated views are introduced.


Product publication: cloud/sx-glove-suite-cap-2 is a9626806a7691019bf0a82bdb979d59b7aa0ce5a. The guard reported PUSH_OK on attempt 1 and git ls-remote independently confirmed that exact SHA. The surrounding shell command reported exit 1 despite the successful guard output, so command-results.json retains that observed wrapper result rather than presenting it as zero. Product checkout and index are clean. Before publication, a fresh main fetch was unchanged at 553a489af1a4f789d0b0b38acf7aa5330c0c9236; its merge was already up to date, the source lock/check and assertion audit passed, the fleet identity/trailer/full-message inspection passed for every candidate commit, and the final inventory acceptance command returned 185/185 immediately before the guarded push. The final assessments/payments run passed 4/4; the corrected customer-quote file passed 3/3; typecheck passed again. The other touched behaviors passed in the earlier integrated run.
