# sx-glove-suite-cap-2 results

Repository: just-every/run-glove
Branch: cloud/sx-glove-suite-cap-2
Product SHA: a9626806a7691019bf0a82bdb979d59b7aa0ce5a
Integrated main: 553a489af1a4f789d0b0b38acf7aa5330c0c9236
Exact-SHA Verify: completed/success, run 42548981081
CI URL: https://github.com/just-every/run-glove/actions/runs/42548981081
PR: none required or created.
Blockers: none.

The repository's own counter reports 185 after the final merge/integration of origin/main and immediately before the guarded push. Initial main was 203/200; integrated main was 213/200 after ten SES/SNS and refund registrations landed during this task. The candidate retains all ten and cuts 28 existing registrations: 209 registrations (206 direct calls) plus four assertion scripts become 181 registrations (178 direct calls) plus the same four scripts = 185/200. The actual lower-limit command, "node tests/inventory.mjs --limit 185", exited 0 and printed 185/185.

The product commit changes sixteen API test files and the regenerated sources.lock.json. It introduces no cases, cap/counter/limit changes, runtime/UI edits of its own, clause status changes, generated contract-view changes, releases, or DONE claims. Main's current contract judgments, refund guard, and new test journeys remain intact. Browser proof is inapplicable to these API registration changes.

Related cases use the existing scenario helper as awaited named steps. Independent installations close before the next case; shared-installation cases keep their order and existing cleanup. Consolidations cover provider import custody, payment settlement/refund custody, current-role authorization and session-bound command replay, equipment/warranty history, automatic assignment and arrival promises, assessment booking, due-entitlement offers, reviewed accounting links/writes, office invoice drafting, source request provenance, payroll earnings export, quote-option variants, monthly invoice collection, message delivery, customer signing/deposit custody, and subcontract work and filing totals.

All 2,708 static assertion expressions and 477 explicit error-option calls are token-identical per touched file before and after, including values, operators, expected results, messages, refusals and provider cases. Every contract-cited registration name is retained; the cited subcontract filing-total name becomes its containing registration. No new enumeration is introduced.

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

Validation:
- Exact pushed SHA a9626806a7691019bf0a82bdb979d59b7aa0ce5a passed Verify 42548981081. Four GitHub REST calls were used, with at least 300 seconds between observations. No workflow was dispatched or rerun.
- The initial ten-file run passed 38/38. The subsequent integrated fifteen-file run passed 41/42, with one signed-copy transport failure documented below. The unchanged quote file then passed 3/3, and the corrected quote file passed 3/3. After the final main integration and two additional consolidations, assessments/payments passed 4/4. The remaining touched behaviors had passed in the integrated run. These actual logs are retained separately; the earlier failed run is not presented as green.
- "pnpm run typecheck" passed after the final integration.
- Contract write/check passed; both generated views were restored whole from origin/main. Neither is in the product diff.
- The edition source lock was regenerated last and "node scripts/edition-authoring/cli.mjs check" passed.
- Every candidate author, committer, trailer and full commit message was inspected before publication. All identities are the fleet identity; no trailers survived. The final inventory acceptance command passed immediately before push. Product checkout and index are clean.
- Local validation stayed with touched files and typecheck; no full local suite was run. CI supplied the exact-SHA full Verify result.

Signed-copy transport correction: the integrated run encountered "TypeError: Body is unusable: Body has already been read" at signedQuoteOriginals/verifyCopies. That loop fetched two responses before consuming either body. The test now fetches and consumes each response before starting the next Miniflare request, including the damaged-copy check. Both requests and every status, manifest, byte, hash and authority assertion remain unchanged. The final changed-file run passed. This changes test request sequencing, not the product's behavior or acceptance criteria.

Main integration: the branch began at a81e93dc401029a20f3bf38570b4b2fefd637246, integrated 01898554241b55d82948c9d145ea849b7db26394 and then 553a489af1a4f789d0b0b38acf7aa5330c0c9236. Fleet-identified stashes preserved uncommitted work while main advanced. CONTRACT.md and generated views retained main's whole content, with no source judgment conflict. A final fresh fetch found main unchanged; no published history was rewritten.

Product publication: the cloud push guard reported PUSH_OK on attempt 1, and independent git ls-remote confirmed a9626806a7691019bf0a82bdb979d59b7aa0ce5a at refs/heads/cloud/sx-glove-suite-cap-2. The surrounding shell command reported exit 1 despite successful guard output, so the receipt retains that observed wrapper result rather than reporting it as zero. There was no observed push rejection.

The full operational plan is PLAN.md. consolidations.json records all grouped registrations. assertion-preservation.json contains per-file equality results, hashes and cited-name checks; assertion-audit.mjs reproduces that audit from a checkout with TypeScript installed, with baseline 553a489af1a4f789d0b0b38acf7aa5330c0c9236 as its argument. Inventory JSON, actual test logs, command-results.json, CI receipts, identity/trailer output and source-lock checks are selected explicitly in the report packet. Direct local Node tests used the supplied cloud toolchain (Node v24.19.0, pnpm 10.12.4); the successful exact-SHA CI used the repository's Node 22.20.0 pin.

Evidence publication is separate from product READY and landing. Reports go only to evidence/sx-glove-suite-cap-2. The task requests no release or publication scan; the fleet's Mac publication/landing process remains separate.
