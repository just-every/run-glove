# sx-glove-suite-cap-1 — Glove test inventory consolidation

Repository: just-every/run-glove
Branch: cloud/sx-glove-suite-cap-1
Product head: a3cbd723ef3d90d9356259ea7deb2f0814e10cc7

## Plan

# sx-glove-suite-cap-1 plan

1. Initialize fleet identity, bundle-backed Git authentication, clone-local commit hooks, and the pinned package manager in a fresh full-history clone. Read the launcher rules, repository AGENTS.md, Verify commands, CONTRACT.md and ACCEPTANCE.md evidence names.
2. Inventory actual Node/Playwright registrations, including nested subtests and loop-generated provider/viewport cases, plus bare assertion scripts invoked by Verify. No existing budget counter or test-budget.json exists, so add a reviewable counter under tests/ with the unchanged 200-test cap and an optional stricter limit.
3. Consolidate only related cases within their behavior families. Existing ordered suites keep their shared installation. Independent edge-case scenarios retain their original callback bodies, fresh installations and immediate cleanup. Use named diagnostic steps without registering extra subtests. Preserve contract-cited registrations.
4. Compare the complete multiset of assertion/refusal call text before and after every touched file; retain a complete original-name-to-registration mapping and full assertion ledger. Preserve all supported provider cases inside the import registration.
5. Save and push a fleet-authored [skip ci] commit with the product changes. Run every touched API file using Verify's Node test command and run its typecheck. Merge updated main before the final candidate; retain main's newer contract judgments and tests. Recount and regenerate sources.lock.json last, without committing generated acceptance/claim views.
6. Commit the counter and final lock as a substantive candidate; inspect every candidate author, committer and trailer and push through the fleet guard. Discover and poll exact-SHA Verify through REST within the ten-call budget and 300-second polling interval. Diagnose completed failed jobs only once each if necessary.
7. Write complete non-secret reports and actual receipts to the separate packet, publish only its explicit files to evidence/sx-glove-suite-cap-1, and return product SHA, CI IDs, counts, unchanged clause status and an SX inbox relay line. The Mac fleet owns publication scanning and landing; make no DONE claim.

## Inventory and scope

The baseline has 271 direct registration calls expanding to 278 tests, plus 4 assertion scripts: **282**. The candidate has 182 direct calls expanding to 185 tests, plus 4 assertion scripts: **189**. This saves 93 counted tests and leaves 11 slots below the unchanged 200 cap.

No pre-existing test inventory/budget counter or test-budget.json was found in package scripts, tests/, scripts/ or Verify. The new tests/inventory.mjs parses the actual repository tests, counts nested subtests and literal loop expansion, and inventories bare assertion scripts from verification.json. The same counter produced both baseline-inventory.json and candidate-inventory.json. Baseline exits 1 because it exceeds 200; the candidate passes --limit 190.

Consolidation is confined to tests/ plus the required source lock. Related edge-case scenarios run as awaited named steps of one behavior. Existing shared installations remain shared. Independent scenarios keep their fresh installation and cleanup before the next scenario. The provider import table retains every positive and negative case for all three sources. No skips, weaker assertions, omitted provider cases, src edits, cap increase or clause status changes were introduced.

Contract and generated acceptance evidence names were checked before consolidation. Fully cited registrations were retained; related steps were folded into cited tests where applicable. The specifically cited subcontractor 1099-NEC subtest remains a registration. No DONE claim is made. Publication scanning and landing remain with the Mac fleet.

## Assertion preservation

The complete multiset of assertion/refusal expressions is identical in every touched test file: **4101 before = 4101 after**. This includes assert.*, assertTrail, refuse and explicit error expectations passed to command/run. The ledger below lists every such expression in each merged callback; assertions in shared helper/setup functions were also compared file-wide.

The comparison is text-exact for call expressions and multiplicity, so changing an expected value, deleting an assertion, or losing a refusal fails the comparison. Loops retain the same cases. Assertion-expression counts are source counts rather than the number of runtime loop iterations.

| Touched file | Assertions before | Assertions after | Exact multiset |
| --- | ---: | ---: | --- |
| tests/api/arrival-windows.test.mjs | 82 | 82 | identical |
| tests/api/customer-quotes.test.mjs | 322 | 322 | identical |
| tests/api/email.test.mjs | 203 | 203 | identical |
| tests/api/movein.test.mjs | 388 | 388 | identical |
| tests/api/payments.test.mjs | 212 | 212 | identical |
| tests/api/payout-reconciliation.test.mjs | 81 | 81 | identical |
| tests/api/pipeline.test.mjs | 205 | 205 | identical |
| tests/api/privacy.test.mjs | 98 | 98 | identical |
| tests/api/quickbooks.test.mjs | 444 | 444 | identical |
| tests/api/quote-link-custody.test.mjs | 104 | 104 | identical |
| tests/api/recurring-billing.test.mjs | 178 | 178 | identical |
| tests/api/eligibility.test.mjs | 158 | 158 | identical |
| tests/api/documents.test.mjs | 30 | 30 | identical |
| tests/api/xero.test.mjs | 73 | 73 | identical |
| tests/api/pricebook.test.mjs | 145 | 145 | identical |
| tests/api/purchasing.test.mjs | 135 | 135 | identical |
| tests/api/money.test.mjs | 96 | 96 | identical |
| tests/api/servicecall.test.mjs | 65 | 65 | identical |
| tests/api/routing.test.mjs | 141 | 141 | identical |
| tests/api/merge.test.mjs | 19 | 19 | identical |
| tests/api/reminders.test.mjs | 212 | 212 | identical |
| tests/api/push.test.mjs | 34 | 34 | identical |
| tests/api/payroll.test.mjs | 41 | 41 | identical |
| tests/api/conversation.test.mjs | 55 | 55 | identical |
| tests/api/agreements.test.mjs | 298 | 298 | identical |
| tests/api/callbacks.test.mjs | 17 | 17 | identical |
| tests/api/nameplates.test.mjs | 55 | 55 | identical |
| tests/api/subcontract.test.mjs | 106 | 106 | identical |
| tests/api/subcontractor-field.test.mjs | 80 | 80 | identical |
| tests/api/suggest.test.mjs | 24 | 24 | identical |

## Merged registration and step table

| File | Surviving registration | Original step | Assertions before | Assertions after | Provider cases |
| --- | --- | --- | ---: | ---: | ---: |
| tests/api/arrival-windows.test.mjs | Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes | Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes | 5 | 5 | 1 |
| tests/api/arrival-windows.test.mjs | Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes | Approved dispatch and move proposals retain exact windows and changed promises require a person | 18 | 18 | 1 |
| tests/api/arrival-windows.test.mjs | Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes | Desk requests, crew moves and assessments keep attributable promises through review, replay and Worker restart | 41 | 41 | 1 |
| tests/api/arrival-windows.test.mjs | Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes | Series creation, dated revisions and the clock-pinned rolling horizon never create arrival promises | 8 | 8 | 1 |
| tests/api/customer-quotes.test.mjs | QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 / COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy | QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 / COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy | 67 | 67 | 1 |
| tests/api/customer-quotes.test.mjs | QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 / COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy | QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 revision-scoped customer links show customer descriptions, take changes and declines, expire into one office update request, and never bypass the consent gate | 60 | 60 | 1 |
| tests/api/customer-quotes.test.mjs | QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 / COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy | QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 concrete disclosure changes and disablement close stale signatures; typed signing competes atomically with a staff answer and never emails twice | 15 | 15 | 1 |
| tests/api/customer-quotes.test.mjs | QUOTE-003, QUOTE-014 frozen signed deposit stays owner-only, is held on the exact job, allocates to its final invoice and refunds through the original card | QUOTE-003, QUOTE-014 frozen signed deposit stays owner-only, is held on the exact job, allocates to its final invoice and refunds through the original card | 24 | 24 | 1 |
| tests/api/customer-quotes.test.mjs | QUOTE-003, QUOTE-014 frozen signed deposit stays owner-only, is held on the exact job, allocates to its final invoice and refunds through the original card | QUOTE-003, QUOTE-014 an original-method refund made while a deposit is job-held follows it into the final invoice once | 7 | 7 | 1 |
| tests/api/email.test.mjs | COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay | COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay | 24 | 24 | 1 |
| tests/api/email.test.mjs | COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay | COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events | 40 | 40 | 1 |
| tests/api/email.test.mjs | COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay | COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic | 13 | 13 | 1 |
| tests/api/email.test.mjs | COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay | COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes | 32 | 32 | 1 |
| tests/api/email.test.mjs | COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay | COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs | 31 | 31 | 1 |
| tests/api/movein.test.mjs | ServiceM8 every source record is reviewed, fingerprinted, retained through restart, repeated without effects and safely undone | ServiceM8 every source record is reviewed, fingerprinted, retained through restart, repeated without effects and safely undone | 47 | 47 | 1 |
| tests/api/movein.test.mjs | ServiceM8 every source record is reviewed, fingerprinted, retained through restart, repeated without effects and safely undone | ServiceM8 opening balances retain payment custody, reject mismatches, and preserve native edits on undo | 29 | 29 | 1 |
| tests/api/movein.test.mjs | MOVE-001, MOVE-007 Jobber saved responses and product CSV preview, retain recurring visits, repeat without duplicates and undo while keeping native work | MOVE-001, MOVE-007 Jobber saved responses and product CSV preview, retain recurring visits, repeat without duplicates and undo while keeping native work | 110 | 110 | 1 |
| tests/api/movein.test.mjs | MOVE-001, MOVE-007 Jobber saved responses and product CSV preview, retain recurring visits, repeat without duplicates and undo while keeping native work | an undo that takes several passes holds its records until it finishes | 11 | 11 | 1 |
| tests/api/movein.test.mjs | MOVE-003, MOVE-009 an ongoing multi-location membership keeps one identity and offers each outstanding source event only at its own site | MOVE-003, MOVE-009 an ongoing multi-location membership keeps one identity and offers each outstanding source event only at its own site | 15 | 15 | 1 |
| tests/api/movein.test.mjs | MOVE-003, MOVE-009 an ongoing multi-location membership keeps one identity and offers each outstanding source event only at its own site | MOVE-003, MOVE-009 source recurrence activates only after explicit review, never replays exported events, and unsupported rules are named | 11 | 11 | 1 |
| tests/api/payments.test.mjs | PAY-004, PAY-021, PAY-022, PAY-023 three installments, original-card refund, cash/check overpayment and customer credit keep invoice, aging, brief and receipts exact | PAY-004, PAY-021, PAY-022, PAY-023 three installments, original-card refund, cash/check overpayment and customer credit keep invoice, aging, brief and receipts exact | 48 | 48 | 1 |
| tests/api/payments.test.mjs | PAY-004, PAY-021, PAY-022, PAY-023 three installments, original-card refund, cash/check overpayment and customer credit keep invoice, aging, brief and receipts exact | PAY-004, PAY-021, PAY-022, PAY-023 refunds reserve uncertain funds once, refuse excess and stale writes, and confirm pending original-method outcomes explicitly | 14 | 14 | 1 |
| tests/api/payout-reconciliation.test.mjs | PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay | PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay | 7 | 7 | 1 |
| tests/api/payout-reconciliation.test.mjs | PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay | PAY-007 point 2: every inspection and reviewed allocation has attributable secret-free Activity and business export facts | 11 | 11 | 1 |
| tests/api/payout-reconciliation.test.mjs | PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay | PAY-007 point 3: only a signed-in unscoped Owner inspects positive USD test payouts | 18 | 18 | 1 |
| tests/api/payout-reconciliation.test.mjs | PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay | PAY-007 point 4: ten pages reconcile exactly 1000 rows; overflow, incomplete pages, duplicates, inconsistent rows and wrong sources refuse safely | 8 | 8 | 1 |
| tests/api/payout-reconciliation.test.mjs | PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay | PAY-007 point 5: bank plus payout fee must equal source net exactly and only paid payouts reconcile | 4 | 4 | 1 |
| tests/api/payout-reconciliation.test.mjs | PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay | PAY-007 point 6: an unavailable payout fee refuses without changing any retained payout | 1 | 1 | 1 |
| tests/api/payout-reconciliation.test.mjs | PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay | PAY-007 point 7: a manual payout has no Stripe source attribution before owner review | 4 | 4 | 1 |
| tests/api/payout-reconciliation.test.mjs | PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay | PAY-007 point 8: only explicit owner books allocation reconciles manual sources and other unreviewed payouts remain unmatched | 19 | 19 | 1 |
| tests/api/pipeline.test.mjs | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure | 36 | 36 | 1 |
| tests/api/pipeline.test.mjs | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 failed verification, consent, origins and ambiguous matching persist no request; owner disable fences an in-flight submission | 17 | 17 | 1 |
| tests/api/pipeline.test.mjs | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 only an unscoped owner enables provider-bound photo consent; model copies strip metadata and withdrawal excludes later calls | 41 | 41 | 1 |
| tests/api/privacy.test.mjs | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals | 45 | 45 | 1 |
| tests/api/privacy.test.mjs | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 a trusted later erasure journal refuses an older backup and a new anonymous backup restores without certificate bytes | 6 | 6 | 1 |
| tests/api/privacy.test.mjs | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 imported customer erasure removes retained source copies and shared originals without changing a peer customer | 18 | 18 | 1 |
| tests/api/privacy.test.mjs | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 / MOVE-001, MOVE-007 / MOVE-003, MOVE-009 / MOVE-004, MOVE-010 erasing one provider customer keeps another provider with the same numeric source ID and journal intact | 20 | 20 | 1 |
| tests/api/privacy.test.mjs | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erasure tombstones one CSV customer while peers retain source projections and exact Undo | 9 | 9 | 1 |
| tests/api/quickbooks.test.mjs | QuickBooks company discovery proposes imported customer, item and original invoice links without a write or a partial company review | QuickBooks company discovery proposes imported customer, item and original invoice links without a write or a partial company review | 36 | 36 | 1 |
| tests/api/quickbooks.test.mjs | QuickBooks company discovery proposes imported customer, item and original invoice links without a write or a partial company review | QuickBooks reviewed migration creates only two explicitly approved unmatched customers, links old invoices and posts later money once with locked confirmed links | 36 | 36 | 1 |
| tests/api/quickbooks.test.mjs | Xero complete company reads and reviewed existing links preserve two property invoice identities without writes or restored authority | Xero complete company reads and reviewed existing links preserve two property invoice identities without writes or restored authority | 59 | 59 | 1 |
| tests/api/quickbooks.test.mjs | Xero complete company reads and reviewed existing links preserve two property invoice identities without writes or restored authority | Xero owner inspects current contacts, items and sales invoices without writes, retained payloads or revived provider access | 61 | 61 | 1 |
| tests/api/quickbooks.test.mjs | Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts | Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts | 37 | 37 | 1 |
| tests/api/quickbooks.test.mjs | Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts | Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations | 26 | 26 | 1 |
| tests/api/quickbooks.test.mjs | Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts | Xero durable reservation refuses a concurrent send and a different tenant, then retains same-tenant recovery after disconnect | 11 | 11 | 1 |
| tests/api/quickbooks.test.mjs | Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts | Xero records an authorized in-flight provider fact after Owner withdrawal and refuses the next send | 4 | 4 | 1 |
| tests/api/quickbooks.test.mjs | Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts | Xero erasure during a provider response discards late personal outcomes and durable reservations | 5 | 5 | 1 |
| tests/api/quote-link-custody.test.mjs | QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart | QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart | 28 | 28 | 1 |
| tests/api/quote-link-custody.test.mjs | QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart | QUOTE-009 superseded links disclose no document and refuse every customer action across restart | 8 | 8 | 1 |
| tests/api/quote-link-custody.test.mjs | QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart | QUOTE-009 expired revisions remain readable with exactly one update until the link expiry instant | 26 | 26 | 1 |
| tests/api/quote-link-custody.test.mjs | QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart | QUOTE-009 owner validity boundaries and default changes affect only later revisions | 14 | 14 | 1 |
| tests/api/quote-link-custody.test.mjs | QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart | QUOTE-009 real dates and frozen Chicago midnight govern approval and the ninety-day reading window | 16 | 16 | 1 |
| tests/api/quote-link-custody.test.mjs | QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart | QUOTE-009 pre-validity Worker upgrade requires revision and fresh price approval before issuing a link | 11 | 11 | 1 |
| tests/api/recurring-billing.test.mjs | PLAN-005, PLAN-012, PLAN-013 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks | PLAN-005, PLAN-012, PLAN-013 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks | 59 | 59 | 1 |
| tests/api/recurring-billing.test.mjs | PLAN-005, PLAN-012, PLAN-013 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks | PLAN-005, PLAN-012, PLAN-013 three months produce exactly three per-visit drafts with their own materials and three fixed monthly drafts, with skips and concurrent replay | 19 | 19 | 1 |
| tests/api/recurring-billing.test.mjs | PLAN-005, PLAN-012, PLAN-013 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks | PLAN-005, PLAN-012, PLAN-013 forward prices, pauses, fixed after-visit auto-approval, on-close, as-needed and missed price review preserve exactly-once evidence | 13 | 13 | 1 |
| tests/api/eligibility.test.mjs | DATA-002, DATA-009, DATA-010 / DISP-004: busy time from a technician's calendar refuses an overlapping booking; the secret calendar address stays with the owner and that technician; DISP-015 ordered delivery, uncertainty and retained-event review | DATA-002, DATA-009, DATA-010 / DISP-004: busy time from a technician's calendar refuses an overlapping booking; the secret calendar address stays with the owner and that technician; DISP-015 ordered delivery, uncertainty and retained-event review | 32 | 32 | 1 |
| tests/api/eligibility.test.mjs | DATA-002, DATA-009, DATA-010 / DISP-004: busy time from a technician's calendar refuses an overlapping booking; the secret calendar address stays with the owner and that technician; DISP-015 ordered delivery, uncertainty and retained-event review | DISP-004: booking refuses a missing skill and a day off, warns outside the area, then books an eligible technician | 16 | 16 | 1 |
| tests/api/documents.test.mjs | QUOTE-005, QUOTE-015 customer quote documents freeze branding, owner templates, line descriptions and only their scoped original images | QUOTE-005, QUOTE-015 customer quote documents freeze branding, owner templates, line descriptions and only their scoped original images | 22 | 22 | 1 |
| tests/api/documents.test.mjs | QUOTE-005, QUOTE-015 customer quote documents freeze branding, owner templates, line descriptions and only their scoped original images | QUOTE-005, QUOTE-015 desk invoice and agreement projections use identity and descriptions without granting public or technician access | 8 | 8 | 1 |
| tests/api/xero.test.mjs | Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes | Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes | 54 | 54 | 1 |
| tests/api/xero.test.mjs | Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes | Xero company policy defaults to no effects and isolates allow, review, approve and block decisions | 19 | 19 | 1 |
| tests/api/pricebook.test.mjs | MONEY-003, MONEY-006: a 200-line price book CSV with costs and markups, a 5% category raise, a flat-rate task quoted beside time and materials, and a round-trip export | MONEY-003, MONEY-006: a 200-line price book CSV with costs and markups, a 5% category raise, a flat-rate task quoted beside time and materials, and a round-trip export | 117 | 117 | 1 |
| tests/api/pricebook.test.mjs | MONEY-003, MONEY-006: a 200-line price book CSV with costs and markups, a 5% category raise, a flat-rate task quoted beside time and materials, and a round-trip export | MONEY-003, MONEY-006 exports honor current margin permission while retaining a usable price catalogue and full owner costs | 27 | 27 | 1 |
| tests/api/purchasing.test.mjs | DATA-002, DATA-009, DATA-010 / STOCK-002 a purchase order for a job, received in two parts, lands in stock and in the job cost | DATA-002, DATA-009, DATA-010 / STOCK-002 a purchase order for a job, received in two parts, lands in stock and in the job cost | 55 | 55 | 1 |
| tests/api/purchasing.test.mjs | DATA-002, DATA-009, DATA-010 / STOCK-002 a purchase order for a job, received in two parts, lands in stock and in the job cost | STOCK-002 / TEAM-001 purchase commands acknowledge writes without granting margin reads, including old outcomes after role edits | 42 | 42 | 1 |
| tests/api/money.test.mjs | DATA-002, DATA-009, DATA-010 / MONEY-001, MONEY-004, MONEY-005 address and branch tax, labor rules and certificate expiry remain exact on approved documents, exports, QuickBooks payloads and tax reports | DATA-002, DATA-009, DATA-010 / MONEY-001, MONEY-004, MONEY-005 address and branch tax, labor rules and certificate expiry remain exact on approved documents, exports, QuickBooks payloads and tax reports | 71 | 71 | 1 |
| tests/api/money.test.mjs | DATA-002, DATA-009, DATA-010 / MONEY-001, MONEY-004, MONEY-005 address and branch tax, labor rules and certificate expiry remain exact on approved documents, exports, QuickBooks payloads and tax reports | MONEY-001, MONEY-004, MONEY-005 Avalara AvaTax lookup sends only the service address and two samples with the owner-only sealed key, proposes a rate the owner applies, and reads unavailable rather than 0% | 25 | 25 | 1 |
| tests/api/servicecall.test.mjs | BOOK-005 desk creation retains request linkage, exact lines and frozen service checklists and forms under current authority | BOOK-005 desk creation retains request linkage, exact lines and frozen service checklists and forms under current authority | 37 | 37 | 1 |
| tests/api/servicecall.test.mjs | BOOK-005 desk creation retains request linkage, exact lines and frozen service checklists and forms under current authority | BOOK-005 a leaking water heater: a job with an $89.00 diagnostic fee, a flat-rate valve and 1.5 hours added on site, invoiced exactly | 28 | 28 | 1 |
| tests/api/routing.test.mjs | DISP-003, DISP-011: 12 visits for 3 technicians improve through a bounded background proposal, respect windows and skills, and move only on dispatcher acceptance before safe customer erasure | DISP-003, DISP-011: 12 visits for 3 technicians improve through a bounded background proposal, respect windows and skills, and move only on dispatcher acceptance before safe customer erasure | 95 | 95 | 1 |
| tests/api/routing.test.mjs | DISP-003, DISP-011: 12 visits for 3 technicians improve through a bounded background proposal, respect windows and skills, and move only on dispatcher acceptance before safe customer erasure | DISP-003, DISP-011: stale eligibility, discard and a routing-provider refusal never change appointments | 46 | 46 | 1 |
| tests/api/merge.test.mjs | CUST-005: nine customers sharing a phone are flagged, merged into one and unmerged | CUST-005: nine customers sharing a phone are flagged, merged into one and unmerged | 18 | 18 | 1 |
| tests/api/merge.test.mjs | CUST-005: nine customers sharing a phone are flagged, merged into one and unmerged | CUST-005: the move-in preview flags incoming customers that duplicate Glove customers | 1 | 1 | 1 |
| tests/api/reminders.test.mjs | COMM-003, COMM-019, COMM-020 owner-approved email templates confirm and move visits including assessments, respect consent and quiet hours, and never replay an attempt | COMM-003, COMM-019, COMM-020 owner-approved email templates confirm and move visits including assessments, respect consent and quiet hours, and never replay an attempt | 94 | 94 | 1 |
| tests/api/reminders.test.mjs | COMM-003, COMM-019, COMM-020 owner-approved email templates confirm and move visits including assessments, respect consent and quiet hours, and never replay an attempt | Erasure during an automatic provider attempt never restores recipient addresses in the outcome | 9 | 9 | 1 |
| tests/api/reminders.test.mjs | PAY-005 due-date reminders stop after payment or dispute and aging exposes their actual state | PAY-005 due-date reminders stop after payment or dispute and aging exposes their actual state | 9 | 9 | 1 |
| tests/api/reminders.test.mjs | PAY-005 due-date reminders stop after payment or dispute and aging exposes their actual state | QUOTE-004 three quote sequences stop on day-three answer and day-seven expiry without reusing customer links | 22 | 22 | 1 |
| tests/api/push.test.mjs | API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id | FIELD-004, FIELD-009, FIELD-010 only the owner turns notifications on, and the VAPID private key never leaves the server | 4 | 4 | 1 |
| tests/api/push.test.mjs | API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id | FIELD-004, FIELD-009, FIELD-010 a technician subscribes their own phone; agents and desk roles cannot, and each person reads only their own phones | 9 | 9 | 1 |
| tests/api/push.test.mjs | API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id | FIELD-004, FIELD-009, FIELD-010 new, moved and canceled visits each reach the technician's phone, signed with the VAPID key and encrypted for that phone | 9 | 9 | 1 |
| tests/api/push.test.mjs | API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id | FIELD-004, FIELD-009, FIELD-010 a failed push is labelled and not retried; a subscription the push service no longer knows is deleted | 3 | 3 | 1 |
| tests/api/push.test.mjs | API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id | FIELD-004, FIELD-009, FIELD-010 sign-out and role loss delete the phone's subscription, and nothing more is sent to it | 4 | 4 | 1 |
| tests/api/push.test.mjs | API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id | FIELD-004, FIELD-009, FIELD-010 turning notifications off deletes every phone's subscription and the key | 4 | 4 | 1 |
| tests/api/payroll.test.mjs | COST-002, COST-006, COST-007 a 44-hour week is approved by the owner, split at 40 hours and under the daily rule, and exported for Gusto, ADP RUN and QuickBooks Payroll without the subcontractor | COST-002, COST-006, COST-007 the weekly timesheet rolls up clock and job time and flags overtime past 40 hours a week | 4 | 4 | 1 |
| tests/api/payroll.test.mjs | COST-002, COST-006, COST-007 a 44-hour week is approved by the owner, split at 40 hours and under the daily rule, and exported for Gusto, ADP RUN and QuickBooks Payroll without the subcontractor | COST-002, COST-006, COST-007 only the owner approves, and only approved weeks of W-2 people reach the payroll files | 16 | 16 | 1 |
| tests/api/payroll.test.mjs | COST-002, COST-006, COST-007 a 44-hour week is approved by the owner, split at 40 hours and under the daily rule, and exported for Gusto, ADP RUN and QuickBooks Payroll without the subcontractor | COST-002, COST-006, COST-007 the owner's daily overtime rule re-splits the week, which needs approving again before it exports | 7 | 7 | 1 |
| tests/api/conversation.test.mjs | COMM-007 a logged call, a logged note, today's real sends and agent actions read in order from the customer and the job | COMM-007 the desk logs calls and notes, refuses field and agent logs, and reads ordered customer and job streams with direction, channel, author and delivery | 13 | 13 | 1 |
| tests/api/conversation.test.mjs | COMM-007 a logged call, a logged note, today's real sends and agent actions read in order from the customer and the job | COMM-007 / CUST-001 the property history carries the same messages at its site, newest first, and not the customer-level voicemail; field roles read none | 9 | 9 | 1 |
| tests/api/conversation.test.mjs | COMM-007 a logged call, a logged note, today's real sends and agent actions read in order from the customer and the job | COMM-007 only the desk reads the stream, and the logged call and note are in Activity and the business export | 5 | 5 | 1 |
| tests/api/conversation.test.mjs | COMM-007 a logged call, a logged note, today's real sends and agent actions read in order from the customer and the job | COMM-007 two populated human histories survive merge and Worker restart; current role and branch refusals change nothing | 28 | 28 | 1 |
| tests/api/movein.test.mjs | Imported provider exports retain records and refuse unsafe undo for every supported source | `${system === 'servicetitan' ? 'MOVE-003, MOVE-009' : 'MOVE-004, MOVE-010'} ${system}: saved exports preview, preserve source records, prices, balances, visits, notes and attachment bytes, repeat once, and undo without touching native work` | 70 | 70 | 3 |
| tests/api/movein.test.mjs | Imported provider exports retain records and refuse unsafe undo for every supported source | `${system === 'servicetitan' ? 'MOVE-003, MOVE-009' : 'MOVE-004, MOVE-010'} ${system}: missing parents and invalid amounts are explained in preview; a native edit prevents destructive undo` | 9 | 9 | 3 |
| tests/api/agreements.test.mjs | PLAN-002 a plan with two included tune-ups and 15% off repairs is sold, used, discounted, counted due, reported and segmented | PLAN-002 the owner defines the plan and the desk sells it by phone; one agreement per site and term | 12 | 12 | 1 |
| tests/api/agreements.test.mjs | PLAN-002 a plan with two included tune-ups and 15% off repairs is sold, used, discounted, counted due, reported and segmented | PLAN-002 included visits consume entitlements; AGENT-007, AGENT-015 flags only missing accepted frozen forms on twenty completed visits | 7 | 7 | 1 |
| tests/api/agreements.test.mjs | PLAN-002 a plan with two included tune-ups and 15% off repairs is sold, used, discounted, counted due, reported and segmented | PLAN-002 / QUOTE-007, QUOTE-019 a repair quote takes the member discount, carried to the job, invoice, CSV, QuickBooks payload and revenue | 11 | 11 | 1 |
| tests/api/agreements.test.mjs | PLAN-002 a plan with two included tune-ups and 15% off repairs is sold, used, discounted, counted due, reported and segmented | PLAN-002 the agreement report counts the sold agreement and no churn, and a "no agreement" segment leaves the member out | 44 | 44 | 1 |
| tests/api/callbacks.test.mjs | AGENT-006 a callback on a condenser with two prior visits gets an advisory checklist that cites both visits' readings | AGENT-006 the callback is detected and the agent gathers both earlier visits | 6 | 6 | 1 |
| tests/api/callbacks.test.mjs | AGENT-006 a callback on a condenser with two prior visits gets an advisory checklist that cites both visits' readings | AGENT-006 the prepared checklist cites both visits' readings, resolved from the records, and is labelled advisory | 6 | 6 | 1 |
| tests/api/callbacks.test.mjs | AGENT-006 a callback on a condenser with two prior visits gets an advisory checklist that cites both visits' readings | AGENT-006 a checklist citing what the pack does not hold is refused; the technician on the callback reads the checklist, another does not | 5 | 5 | 1 |
| tests/api/nameplates.test.mjs | FIELD-006, FIELD-011 a technician photographs three nameplates; the model proposes the fields and nothing is saved until the technician confirms | FIELD-006, FIELD-011 the proposed fields are what the nameplate shows, and an unreadable date stays unread | 9 | 9 | 1 |
| tests/api/nameplates.test.mjs | FIELD-006, FIELD-011 a technician photographs three nameplates; the model proposes the fields and nothing is saved until the technician confirms | FIELD-006, FIELD-011 nothing is saved to equipment until the technician confirms | 6 | 6 | 1 |
| tests/api/nameplates.test.mjs | FIELD-006, FIELD-011 a technician photographs three nameplates; the model proposes the fields and nothing is saved until the technician confirms | FIELD-006, FIELD-011 confirmation retains exact fields and date precision through refusal, replay and restart; library attachment and discard remain intact | 36 | 36 | 1 |
| tests/api/payroll.test.mjs | TEAM-003, TEAM-006 a 5% sold-revenue rule and a $25 agreement spiff over a period reach the Gusto, ADP RUN and QuickBooks Payroll files | TEAM-003, TEAM-006 only the owner sets dated commission rules | 2 | 2 | 1 |
| tests/api/payroll.test.mjs | TEAM-003, TEAM-006 a 5% sold-revenue rule and a $25 agreement spiff over a period reach the Gusto, ADP RUN and QuickBooks Payroll files | TEAM-003, TEAM-006 sales credited to their technician earn the rule in force on their date | 3 | 3 | 1 |
| tests/api/payroll.test.mjs | TEAM-003, TEAM-006 a 5% sold-revenue rule and a $25 agreement spiff over a period reach the Gusto, ADP RUN and QuickBooks Payroll files | TEAM-003, TEAM-006 the approved person's commissions and spiffs are in every payroll file, by week and date | 9 | 9 | 1 |
| tests/api/subcontract.test.mjs | API-001 / DISP-007, DISP-013, DISP-014 a three-day install for a two-person crew and a subcontractor: each sees only their visits, the crew moves as one, and the subcontractor's 1099 total is kept | DISP-007, DISP-013, DISP-014 the crew is booked as one: one visit per member each day, and each member sees only their own | 3 | 3 | 1 |
| tests/api/subcontract.test.mjs | API-001 / DISP-007, DISP-013, DISP-014 a three-day install for a two-person crew and a subcontractor: each sees only their visits, the crew moves as one, and the subcontractor's 1099 total is kept | DISP-007, DISP-013, DISP-014 the subcontractor sees only their own visits on the job, without money or other people's work | 10 | 10 | 1 |
| tests/api/subcontract.test.mjs | API-001 / DISP-007, DISP-013, DISP-014 a three-day install for a two-person crew and a subcontractor: each sees only their visits, the crew moves as one, and the subcontractor's 1099 total is kept | DISP-007, DISP-013, DISP-014 the subcontractor records arrival, checklist, notes and completion on their visits only, and cannot clock in | 5 | 5 | 1 |
| tests/api/subcontract.test.mjs | API-001 / DISP-007, DISP-013, DISP-014 a three-day install for a two-person crew and a subcontractor: each sees only their visits, the crew moves as one, and the subcontractor's 1099 total is kept | DISP-007, DISP-013, DISP-014 a note recorded before arrival prevents cancelling any member of the crew booking | 5 | 5 | 1 |
| tests/api/subcontract.test.mjs | API-001 / DISP-007, DISP-013, DISP-014 a three-day install for a two-person crew and a subcontractor: each sees only their visits, the crew moves as one, and the subcontractor's 1099 total is kept | DISP-007, DISP-013, DISP-014 moving or canceling a crew visit moves or cancels every member's visit, after one conflict review | 5 | 5 | 1 |
| tests/api/subcontractor-field.test.mjs | DISP-013 invited subcontractor works only on current visits through every public door | point 1: mailed staff invitation confirms a built-in Subcontractor linked to their technician | 9 | 9 | 1 |
| tests/api/subcontractor-field.test.mjs | DISP-013 invited subcontractor works only on current visits through every public door | point 2: exact current assignments, bounded records and frozen ordered work survive Worker restart | 19 | 19 | 1 |
| tests/api/subcontractor-field.test.mjs | DISP-013 invited subcontractor works only on current visits through every public door | point 4: arrival, every checklist item, note, captioned photo, described material, frozen form and completion land once with attribution | 20 | 20 | 1 |
| tests/api/subcontractor-field.test.mjs | DISP-013 invited subcontractor works only on current visits through every public door | point 3: files and every other read door expose no desk money, timeline or other worker data | 10 | 10 | 1 |
| tests/api/subcontractor-field.test.mjs | DISP-013 invited subcontractor works only on current visits through every public door | point 5: all Technician-only writes refuse without retained effects; erasure and withdrawn sessions cannot replay captures | 13 | 13 | 1 |
| tests/api/suggest.test.mjs | API-001 / DATA-002, DATA-009, DATA-010 / AGENT-005, AGENT-014 the agent drafts good, better and best for a 15-year-old furnace from the price book, held as a draft until a person approves | AGENT-005, AGENT-014 any extra, missing or malformed answer field refuses the whole draft without repair or retry | 5 | 5 | 1 |
| tests/api/suggest.test.mjs | API-001 / DATA-002, DATA-009, DATA-010 / AGENT-005, AGENT-014 the agent drafts good, better and best for a 15-year-old furnace from the price book, held as a draft until a person approves | AGENT-005, AGENT-014 three options from the price book at its prices, each with the model's reason | 4 | 4 | 1 |
| tests/api/suggest.test.mjs | API-001 / DATA-002, DATA-009, DATA-010 / AGENT-005, AGENT-014 the agent drafts good, better and best for a 15-year-old furnace from the price book, held as a draft until a person approves | AGENT-005, AGENT-014 the model saw the request, the furnace's age and history and the price book, never costs or who and where the customer is | 7 | 7 | 1 |
| tests/api/suggest.test.mjs | API-001 / DATA-002, DATA-009, DATA-010 / AGENT-005, AGENT-014 the agent drafts good, better and best for a 15-year-old furnace from the price book, held as a draft until a person approves | AGENT-005, AGENT-014 the draft waits for a person: the agent cannot approve or send it; a dispatcher approves the prices | 6 | 6 | 1 |

## Full assertion text for every merged step

### 1. tests/api/arrival-windows.test.mjs

Surviving registration: Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes

Original step: Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes

Assertion text count: 5; generated provider cases: 1.

```js
refuse(h, b.dispatcher.run, 'visit.book', { jobId: j.id, technicianId, date: '2026-11-03', start, end, window: promised }, 'WINDOW')
```

```js
refuse(h, b.dispatcher.run, 'assessment.book', { enquiryId: enquiry.id, technicianId, date: '2026-11-03', start, end, window: promised }, 'WINDOW')
```

```js
assert.deepEqual(v.arrivalWindow, window)
```

```js
assert.deepEqual([v.local.start, v.local.end, v.local.timezone], [start, end, 'Australia/Sydney'])
```

```js
assert.deepEqual([assessment.visit.arrivalWindow, assessment.visit.local.start, assessment.visit.local.end, assessment.visit.local.timezone], [window, start, end, 'Australia/Sydney'])
```

### 2. tests/api/arrival-windows.test.mjs

Surviving registration: Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes

Original step: Approved dispatch and move proposals retain exact windows and changed promises require a person

Assertion text count: 18; generated provider cases: 1.

```js
refuse(h, run, 'proposal.approve', dispatchDecision, 'FORBIDDEN')
```

```js
assert.deepEqual(visit.arrivalWindow, window)
```

```js
assert.equal(move.customer, 'customer not yet asked')
```

```js
assert.deepEqual(moved.arrivalWindow, afternoon)
```

```js
assert.deepEqual([moved.local.start, moved.local.end], ['13:00', '14:30'])
```

```js
assert.match(moved.assignments.at(-1).reason, /customer not yet asked/)
```

```js
assert.deepEqual(await h.state(), retained)
```

```js
assert.deepEqual(await b.dispatcher.run('proposal.approve', dispatchDecision, { commandId: 'synthetic-glove-window-proposal' }), approved)
```

```js
assert.deepEqual(await h.state(), retained)
```

```js
assert.equal(sameTime.customer, 'customer not yet asked')
```

```js
assert.deepEqual(moved.arrivalWindow, { start: '12:30', end: '14:30' })
```

```js
refuse(h, b.agent.run, 'visit.change', { visitId: moved.id, version: moved.version, window, start: '09:00', end: '10:30', reason: 'Try to execute the changed promise' }, 'GRANT_SCOPE')
```

```js
assert.equal(pending.customer, 'customer not yet asked')
```

```js
refuse(h, b.agent.run, 'proposal.approve', { proposalId: pending.id, version: pending.version }, 'FORBIDDEN')
```

```js
assert.deepEqual(await h.state(), kept)
```

```js
assert.deepEqual([saved.arrivalWindow, saved.assignments], [moved.arrivalWindow, moved.assignments])
```

```js
assert.ok(changedEvent.summary.includes('customer not yet asked'))
```

```js
assert.deepEqual([changedEvent.actor_id, changedEvent.actor_name, changedEvent.actor_role, changedEvent.at], [b.dispatcher.id, b.dispatcher.name, 'dispatcher', at])
```

### 3. tests/api/arrival-windows.test.mjs

Surviving registration: Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes

Original step: Desk requests, crew moves and assessments keep attributable promises through review, replay and Worker restart

Assertion text count: 41; generated provider cases: 1.

```js
assert.deepEqual(booked.arrivalWindow, window)
```

```js
assert.ok((await h.state()).events.find(e => e.subjectId === booked.id && e.kind === 'visit.booked').summary.includes(exactText))
```

```js
assert.deepEqual(changed.arrivalWindow, window)
```

```js
refuse(h, b.dispatcher.run, 'visit.change', { visitId: changed.id, version: changed.version, start: '10:01', end: '11:00', reason: 'Outside kept promise' }, 'WINDOW')
```

```js
assert.deepEqual(changed.arrivalWindow, afternoon)
```

```js
assert.equal(changed.arrivalWindow, undefined)
```

```js
assert.equal((await crewVisits()).length, 2)
```

```js
assert.deepEqual([v.arrivalWindow, v.local.start, v.local.end], [window, '09:00', '10:30'])
```

```js
assert.deepEqual([v.arrivalWindow, v.local.start], [window, '10:00'])
```

```js
refuse(h, b.dispatcher.run, 'visit.change', { visitId: lead.id, version: lead.version, start: '10:01', end: '11:00', reason: 'Outside crew promise' }, 'WINDOW')
```

```js
assert.deepEqual([v.arrivalWindow, v.local.start], [afternoon, '13:00'])
```

```js
assert.equal(v.arrivalWindow, undefined)
```

```js
assert.deepEqual([v.arrivalWindow,v.local.start,v.local.end], [promised,start,end])
```

```js
assert.equal((await h.state()).enquiries.find(e => e.id === enquiry.id).wonJobId, j.id)
```

```js
assert.deepEqual(autos.map(v => v.technicianId), [b.tom.id, b.priya.id, b.tom.id])
```

```js
assert.equal(autos[0].assignments[0].reason, 'Assigned automatically: Tom B. had the fewest booked minutes that day (Tom B. 0, Priya N. 120)')
```

```js
refuse(h,b.dispatcher.run,'visit.change',override,'CONFLICT_REVIEW')
```

```js
assert.deepEqual([moved.technicianId,moved.assignments.at(-1).reason,moved.assignments.at(-1).reviewedConflicts], [b.priya.id,override.reason,review.details.conflicts])
```

```js
refuse(h,run,'visit.book',quotedPayload,'FORBIDDEN')
```

```js
refuse(h,run,'assessment.book',assessmentPayload,'FORBIDDEN')
```

```js
refuse(h,run,'visit.change',{ visitId:moved.id,version:moved.version,reason:'Unauthorized change' },'FORBIDDEN')
```

```js
refuse(h, b.dispatcher.run, 'assessment.book', { ...assessmentPayload, technicianId, start: '13:59' }, 'WINDOW')
```

```js
assert.deepEqual([assessment.visit.technicianId,assessment.visit.arrivalWindow,assessment.visit.local.start,assessment.visit.local.end],[b.tom.id,assessmentPayload.window,'15:00','16:00'])
```

```js
assert.deepEqual((await b.tomPerson.state()).visits.find(v=>v.id===assessment.visit.id).arrivalWindow,assessmentPayload.window)
```

```js
assert.deepEqual(await h.state(),before)
```

```js
assert.deepEqual(await b.dispatcher.run('visit.book',quotedPayload,{ commandId:replayId }),booked)
```

```js
assert.deepEqual(await b.dispatcher.run('visit.book',payloads[i],{ commandId:`synthetic-glove-window-auto-${i+1}` }),autos[i])
```

```js
assert.deepEqual(await b.dispatcher.run('assessment.book',assessmentPayload,{ commandId:'synthetic-glove-window-assessment' }),assessment)
```

```js
assert.deepEqual(await h.state(),before)
```

```js
refuse(h,b.dispatcher.run,'visit.book',quotedPayload,'FORBIDDEN',{ commandId:replayId })
```

```js
assert.deepEqual([event.actorId,event.actorName,event.actorRole,event.at],[b.dispatcher.id,b.dispatcher.name,'dispatcher',at])
```

```js
assert.ok(event.summary.includes('arrival window'))
```

```js
assert.ok(event.summary.includes(v.assignments[0].reason.split('; ')[0].toLowerCase()))
```

```js
assert.deepEqual([trail.summary,trail.actor_id,trail.actor_name,trail.actor_role,trail.at],[event.summary,b.dispatcher.id,b.dispatcher.name,'dispatcher',at])
```

```js
assert.deepEqual(saved.arrivalWindow,v.arrivalWindow)
```

```js
assert.deepEqual(saved.assignments,v.assignments)
```

```js
refuse(h,b.dispatcher.run,'visit.book',quotedPayload,'ERASED',{ commandId:replayId })
```

```js
refuse(h,b.dispatcher.run,'assessment.book',assessmentPayload,'ERASED',{ commandId:'synthetic-glove-window-assessment' })
```

```js
assert.equal(signedOut.status,204)
```

```js
assert.equal(revoked.status,401)
```

```js
assert.deepEqual(await h.state(),afterSignout)
```

### 4. tests/api/arrival-windows.test.mjs

Surviving registration: Arrival windows validate before automatic selection and retain inclusive boundaries without refusal writes

Original step: Series creation, dated revisions and the clock-pinned rolling horizon never create arrival promises

Assertion text count: 8; generated provider cases: 1.

```js
assert.deepEqual((await visits()).map(v=>v.local.date).sort(),['2026-11-02','2026-11-09'])
```

```js
assert.equal(v.arrivalWindow,undefined)
```

```js
assert.deepEqual(revised.map(v=>[v.local.date,v.local.start]).sort(),[['2026-11-02','09:00'],['2026-11-09','11:00']])
```

```js
assert.equal(v.arrivalWindow,undefined)
```

```js
assert.deepEqual((await visits()).filter(v=>v.status==='booked').map(v=>v.local.date).sort(),['2026-11-02','2026-11-09','2026-11-16'])
```

```js
assert.equal(v.arrivalWindow,undefined)
```

```js
assert.ok(v.assignments.every(a=>a.arrivalWindow===undefined))
```

```js
assert.deepEqual(await h.state(),before)
```

### 5. tests/api/customer-quotes.test.mjs

Surviving registration: QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 / COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy

Original step: QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 / COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy

Assertion text count: 67; generated provider cases: 1.

```js
b.dispatcher.run('quote.consent', { version: (await h.state()).business[0].version, text: disclosure, accept: true }, { error: 'FORBIDDEN' })
```

```js
h.command('quote.consent', { version: (await h.state()).business[0].version, text: disclosure, accept: false }, { error: 'CONSENT' })
```

```js
assert.equal(view.selection.document.totals.total, '225.00')
```

```js
assert.deepEqual(q.customerRequests[0].choice.addOnIds, ['addon-1'])
```

```js
assert.equal(q.status, 'approved')
```

```js
assert.equal((await (await post(first.token, { action: 'approve' })).json()).error.code, 'REVISION')
```

```js
assert.equal(view.selection.document.totals.total, '235.00')
```

```js
assert.ok(!JSON.stringify(view.selection).includes('unitCost'))
```

```js
assert.equal(response.status, 200, await response.clone().text())
```

```js
assert.equal(view.decision, 'accepted')
```

```js
assert.equal(view.signed.confirmation.status, 'accepted')
```

```js
assert.equal(signing.identity, 'CLAIMED')
```

```js
assert.equal(signing.capacity, 'Property manager')
```

```js
assert.equal(signing.authenticationBasis, 'link sent by Glove to the address on record')
```

```js
assert.equal(signing.ip, '198.51.100.37')
```

```js
assert.equal(signing.browser, 'synthetic-glove-34 browser')
```

```js
assert.deepEqual(signing.signature, answer.signature)
```

```js
assert.equal(signing.consent.text, disclosure)
```

```js
assert.equal(signing.consent.hash, createHash('sha256').update(disclosure).digest('hex'))
```

```js
assert.equal(signing.revisionDocumentHash, link.documentHash)
```

```js
assert.equal(signing.chosenDocumentHash, view.signed.chosenDocumentHash)
```

```js
assert.equal(copy.status, 200)
```

```js
assert.equal(copy.headers.get('content-type'), 'application/octet-stream')
```

```js
assert.equal(deskCopy.status, 200)
```

```js
assert.equal(await deskCopy.text(), html)
```

```js
assert.equal((await h.request(`/api/glove/quotes/${q.id}/signed`, { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal(createHash('sha256').update(html).digest('hex'), signing.signedCopy.sha256)
```

```js
assert.ok(html.includes('Washable filter') && html.includes('235.00') && html.includes('polyline'))
```

```js
assert.ok(html.includes('data:image/jpeg;base64,') && html.includes('synthetic-glove-42 original image'))
```

```js
assert.ok(html.includes('&lt;script&gt;no execution&lt;/script&gt;') && !html.includes('<script>'))
```

```js
assert.ok(!html.includes('unitCost') && !html.includes(link.token))
```

```js
assert.equal(confirmation.kind, 'quoteConfirmation')
```

```js
assert.equal(confirmation.to, b.customer.email)
```

```js
assert.equal(provider === 'postmark' ? emailed.body.HtmlBody : provider === 'ses' ? emailed.body.Content.Simple.Body.Html.Data : emailed.body.content.find(c => c.type === 'text/html').value, html)
```

```js
assert.equal((await (await post(link.token, answer)).json()).decision, 'accepted')
```

```js
assert.equal(h.email.sent.length, beforeReplay)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_quote_signed_chunks WHERE quote_id=?').bind(q.id).first()).n, chunks.n)
```

```js
assert.equal((await postEvents(h, edge ? edge.callback(receipt(h, confirmation)) : events.signed([{ email: confirmation.to, timestamp: at, event: 'delivered', sg_event_id: 'synthetic-glove-35', sg_message_id: 'synthetic-glove-36', rer_delivery_id: confirmation.id }]))).status, 200)
```

```js
assert.equal((await (await read(link.token)).json()).signed.confirmation.status, 'delivered')
```

```js
assert.ok(conversation.entries.some(e => e.kind === 'quote accepted' && e.author === 'Mei Lin (claimed)'))
```

```js
assert.ok(conversation.entries.some(e => e.kind === 'signed quote confirmation emailed' && e.delivery.includes('Delivered')))
```

```js
assert.ok(history.entries.some(e => e.kind === 'quote response' && e.label.includes('Mei Lin (claimed) approve')))
```

```js
assert.ok(history.entries.some(e => e.kind === 'message' && e.label.includes('Signed quote')))
```

```js
assert.deepEqual(job.lines, accepted.acceptance.lines)
```

```js
assert.deepEqual(job.totals, accepted.acceptance.totals)
```

```js
assert.deepEqual(job.lines.map(l => l.description), ['Better condenser work', 'Washable filter'])
```

```js
h.command('quote.revise', { quoteId: q.id, version: (await h.state()).quotes.find(x => x.id === q.id).version, lines: options[0].lines }, { error: 'QUOTE_CLOSED' })
```

```js
assert.equal(await (await h.request('/api/glove/public/quote/signed', { as: '', headers: headers(link.token) })).text(), html)
```

```js
assert.equal((await read(link.token)).status, 404)
```

```js
assert.equal(await (await h.request('/api/glove/public/quote/signed', { as: '', headers: headers(fresh.token) })).text(), html)
```

```js
assertTrail(h, ['quote.consentAccepted', 'quote.customer.changes', 'quote.customer.approve', 'email.delivered'])
```

```js
assert.ok(!JSON.stringify(exported).includes(fresh.token))
```

```js
assert.equal((await post(peerLink.token, { action: 'approve', name: 'Synthetic peer owner', capacity: 'Owner', choice: peerChoice, documentHash: peerSelection.documentHash, selectionHash: peerSelection.selection.hash, consent: { version: peerSelection.disclosure.version, hash: peerSelection.disclosure.hash, affirmed: true }, signature: { kind: 'typed', text: 'Synthetic peer owner' } })).status, 200)
```

```js
assert.ok((await (await h.request('/api/glove/public/quote/signed', { as: '', headers: headers(peerLink.token) })).text()).includes(b.customer.email))
```

```js
assert.equal((await post(cleanLink.token, { action: 'approve', name: 'Synthetic peer owner', capacity: 'Owner', choice: peerChoice, documentHash: cleanSelection.documentHash, selectionHash: cleanSelection.selection.hash, consent: { version: cleanSelection.disclosure.version, hash: cleanSelection.disclosure.hash, affirmed: true }, signature: { kind: 'typed', text: 'Synthetic peer owner' } })).status, 200)
```

```js
assert.ok(privacy.download.includes(signing.signedCopy.sha256))
```

```js
assert.deepEqual(preview.sharedSignedCopies.map(x => [x.quoteId, x.name, x.peers]), [[peerQuote.id, `Quote ${peerQuote.number} revision 1`, 1]])
```

```js
assert.equal(preview.peersAffected, 1)
```

```js
assert.equal((await read(fresh.token)).status, 404)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_quote_signed_chunks WHERE quote_id=?').bind(q.id).first()).n, 0)
```

```js
assert.equal((await h.request('/api/glove/public/quote/signed', { as: '', headers: headers(peerLink.token) })).status, 404, 'an immutable peer original containing the erased identifier is withdrawn')
```

```js
assert.equal((await h.state()).quotes.find(x => x.id === peerQuote.id).status, 'accepted')
```

```js
assert.equal((await h.state()).quotes.find(x => x.id === peerQuote.id).acceptance.signing.signedCopy, null)
```

```js
assert.equal((await h.request(`/api/glove/quotes/${peerQuote.id}/signed`)).status, 404)
```

```js
assert.equal((await (await read(peerLink.token)).json()).signed.copyWithdrawn.reason, 'Signed original and signature withdrawn for customer privacy. The accepted quote remains.')
```

```js
assert.equal((await h.state()).customers.find(x => x.id === peer.id).name, peer.name)
```

```js
assert.equal(await (await h.request('/api/glove/public/quote/signed', { as: '', headers: headers(cleanLink.token) })).text(), cleanHtml, 'the unrelated peer original remains byte-exact and available')
```

### 6. tests/api/customer-quotes.test.mjs

Surviving registration: QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 / COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy

Original step: QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 revision-scoped customer links show customer descriptions, take changes and declines, expire into one office update request, and never bypass the consent gate

Assertion text count: 60; generated provider cases: 1.

```js
b.office.run('quote.validity', { days: 10 }, { error: 'FORBIDDEN' })
```

```js
assert.ok(q.revisions[0].validUntil && q.revisions[0].validityZone === 'Australia/Sydney')
```

```js
h.command('quote.link', { quoteId: q.id, version: q.version }, { error: 'NOT_APPROVED' })
```

```js
b.agent.run('quote.link', { quoteId: q.id, version: q.version }, { error: 'FORBIDDEN' })
```

```js
assert.match(link.token, /^glq_[\w-]{43}$/)
```

```js
assert.equal(replay.token, undefined, 'only the issuing response reveals the bearer')
```

```js
assert.equal(secret.hash.length, 64)
```

```js
assert.notEqual(secret.hash, link.token)
```

```js
assert.equal(response.headers.get('cache-control'), 'no-store, private')
```

```js
assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
```

```js
assert.deepEqual(view.document.options.map(x => x.name), ['Good', 'Better', 'Best'])
```

```js
assert.equal(view.document.options[1].lines[0].customerDescription, service.description)
```

```js
assert.equal(view.document.terms, 'Payment within 14 days.')
```

```js
assert.ok(!JSON.stringify(view).includes('unitCost') && !JSON.stringify(view).includes(b.customer.phone))
```

```js
assert.equal((await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${link.token}` } })).status, 401)
```

```js
assert.equal((await h.request(`/api/glove/public/quote?token=${link.token}`, { as: '' })).status, 404)
```

```js
assert.equal((await respond(link.token, 'approve')).status, 409)
```

```js
assert.equal((await (await respond(link.token, 'approve')).json()).error.code, 'CONSENT_GATE')
```

```js
assert.equal((await respond(link.token, 'changes', { message: 'Can the work happen on Friday?' })).status, 200)
```

```js
assert.equal(view.state, 'open', 'requesting changes does not revoke the link')
```

```js
assert.equal(view.requests[0].message, 'Can the work happen on Friday?')
```

```js
assert.ok(stream.entries.some(x => x.kind === 'quote changes requested' && x.direction === 'inbound' && x.author === 'Mei Lin (claimed)' && x.channel === 'customer link'))
```

```js
assert.ok(history.entries.some(x => x.kind === 'quote response' && x.label.includes('Friday')))
```

```js
assert.ok(state.notices.some(n => n.quoteId === q.id && n.message.includes('Friday')))
```

```js
assert.equal((await h.state(b.priyaPerson.cookie)).quoteLinks.length, 0)
```

```js
assert.equal((await read(link.token)).status, 404)
```

```js
assert.equal(superseded.state, 'superseded')
```

```js
assert.equal(superseded.document, undefined)
```

```js
assert.equal((await respond(replacement.token, 'decline')).status, 409)
```

```js
assert.equal((await respond(next.token, 'decline')).status, 200)
```

```js
assert.equal(closed.status, 'declined')
```

```js
assert.equal(closed.declined.identity, 'CLAIMED')
```

```js
assert.equal(closed.declined.authenticationBasis, 'link handed out by staff, recipient unverified')
```

```js
assert.equal((await (await respond(next.token, 'decline')).json()).state, 'decided')
```

```js
h.command('quote.accept', { quoteId: q.id, version: closed.version, revision: 2, method: 'phone', customerName: 'Another person' }, { error: 'QUOTE_STATE' })
```

```js
assert.equal(Date.parse(expired.revisions[0].validUntil) - Date.parse(issueDate), 30 * 86400000)
```

```js
assert.equal((await (await read(old.token)).json()).state, 'expired')
```

```js
assert.equal((await (await respond(old.token, 'approve')).json()).error.code, 'EXPIRED')
```

```js
assert.ok(attempts.every(r => r.status === 200))
```

```js
assert.equal(state.notices.filter(n => n.quoteId === expired.id).length, 1)
```

```js
assert.equal(state.quotes.find(x => x.id === expired.id).customerRequests.length, 1)
```

```js
assert.equal(state.enquiries.find(x => x.id === enquiry.id).status, 'contacted')
```

```js
assert.equal((await read(scoped.token)).status, 404)
```

```js
assert.equal((await respond(scoped.token, 'changes', { message: 'Please revise' })).status, 404)
```

```js
assert.equal(refusedToken.status, 403)
```

```js
assert.equal((await read(old.token)).status, 404)
```

```js
assert.equal((await read(delegated.token)).status, 404)
```

```js
assert.equal((await respond(delegated.token, 'decline')).status, 404)
```

```js
assert.ok(h.email.sent.at(-1).body.content[0].value.includes(`/quote#token=${emailed.token}`))
```

```js
assert.equal(m.kind, 'quoteLink')
```

```js
assert.equal(m.to, b.customer.email)
```

```js
assert.equal((await postEvents(h, events.signed([{ email: m.to, timestamp: at, event: 'delivered', sg_event_id: 'quote-link-delivered', sg_message_id: 'quote-link-provider', rer_delivery_id: m.id }]))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[m.id].status, 'delivered')
```

```js
assert.equal((await h.state()).quotes.find(q => q.id === emailQuote.id).customerRequests[0].authenticationBasis, 'link sent by Glove to the address on record')
```

```js
assert.equal((await h.state()).quotes.find(q => q.id === refusedQuote.id).customerRequests[0].authenticationBasis, 'link handed out by staff, recipient unverified')
```

```js
assertTrail(h, ['quote.validity', 'quote.linkIssued', 'quote.linkRevoked', 'quote.customer.changes', 'quote.customer.decline', 'quote.customer.update'])
```

```js
assert.equal(declineFact.method, 'customer link')
```

```js
assert.equal(declineFact.identity, 'CLAIMED')
```

```js
assert.ok(!JSON.stringify(exported).includes(token))
```

```js
assert.ok(!JSON.stringify(await h.db.prepare('SELECT result FROM glove_commands').all()).includes(emailed.token))
```

### 7. tests/api/customer-quotes.test.mjs

Surviving registration: QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 / COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy

Original step: QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 concrete disclosure changes and disablement close stale signatures; typed signing competes atomically with a staff answer and never emails twice

Assertion text count: 15; generated provider cases: 1.

```js
assert.equal((await read()).signingAvailable, false)
```

```js
assert.equal((await (await post({ action: 'approve' })).json()).error.code, 'CONSENT_GATE')
```

```js
assert.equal(refused.status, 403)
```

```js
assert.equal((await (await post(answer)).json()).error.code, 'CONSENT_CHANGED')
```

```js
assert.equal((await (await post(answer)).json()).error.code, 'CONSENT_GATE')
```

```js
assert.equal((await (await post({ ...answer, signature: { kind: 'typed', text: '' } })).json()).error.code, 'INPUT')
```

```js
assert.ok(wins.some(r => r.status === 200))
```

```js
assert.ok(['accepted', 'declined'].includes(final.status))
```

```js
assert.equal(final.acceptance.signing.signature.kind, 'typed')
```

```js
assert.equal(final.acceptance.signing.confirmation.status, 'not_connected')
```

```js
assert.equal(final.declined, null)
```

```js
assert.equal(final.acceptance, null)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_quote_signed_chunks WHERE quote_id=?').bind(q.id).first()).n, 0)
```

```js
assert.equal((await (await post(answer)).json()).decision, final.status)
```

```js
assert.deepEqual((await h.state()).quotes.find(x => x.id === q.id), final)
```

### 8. tests/api/customer-quotes.test.mjs

Surviving registration: QUOTE-003, QUOTE-014 frozen signed deposit stays owner-only, is held on the exact job, allocates to its final invoice and refunds through the original card

Original step: QUOTE-003, QUOTE-014 frozen signed deposit stays owner-only, is held on the exact job, allocates to its final invoice and refunds through the original card

Assertion text count: 24; generated provider cases: 1.

```js
assert.deepEqual(q.revisions[0].deposit, { kind: 'percent', value: '25' })
```

```js
b.office.run('quote.deposit', { quoteId: q.id, version: q.version, deposit: { kind: 'amount', value: '500.00' } }, { error: 'FORBIDDEN' })
```

```js
h.command('quote.deposit', { quoteId: q.id, version: q.version, deposit: null }, { error: 'QUOTE_STATE' })
```

```js
h.command('payment.depositCheckout', { quoteId: q.id, version: q.version, method: 'card' }, { error: 'DEPOSIT_GATE' })
```

```js
assert.equal((await (await publicRequest({ action: 'approve' })).json()).error.code, 'CONSENT_GATE')
```

```js
assert.deepEqual(selected.document.deposit, { kind: 'amount', value: '500.00' })
```

```js
assert.equal((await publicRequest({ action: 'approve', choice, name: 'Mei Lin', capacity: 'Owner', documentHash: selected.documentHash, selectionHash: selected.selection.hash, consent: { ...selected.disclosure, affirmed: true }, signature: { kind: 'typed', text: 'Mei Lin' } })).status, 200)
```

```js
b.office.run('payment.depositCheckout', { quoteId: q.id, version: q.version, method: 'card' }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await h.request('/api/glove/commands', { as: '', method: 'POST', headers: { authorization: `Bearer ${link.token}` }, body: { commandId: randomUUID(), type: 'payment.depositCheckout', payload: { quoteId: q.id, version: q.version, method: 'card' } } })).status, 401)
```

```js
assert.equal((await publicRequest({ action: 'checkout' })).status, 400)
```

```js
assert.equal(h.stripePayments.calls.length, network, 'customer quote bearer has no payment authority')
```

```js
assert.equal(deposit.amount, '500.00')
```

```js
assert.equal(deposit.jobId, job.id)
```

```js
assert.equal(deposit.invoiceId, null)
```

```js
assert.equal(deposit.chosenDocumentHash, q.acceptance.signing.chosenDocumentHash)
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded')).status, 200)
```

```js
assert.equal((await h.state()).payments.find(p => p.id === deposit.id).status, 'paid')
```

```js
assert.equal((await (await h.request('/api/glove/balances')).json()).invoices.find(i => i.id === inv.id).due, '1350.00')
```

```js
assert.equal(held.invoiceId, inv.id)
```

```js
assert.equal(refund.method, 'card')
```

```js
assert.equal(refund.paymentId, deposit.id)
```

```js
assert.equal(refund.status, 'paid')
```

```js
assert.equal((await (await h.request('/api/glove/balances')).json()).invoices.find(i => i.id === inv.id).due, '1400.00')
```

```js
assertTrail(h, ['deposit.serviceConfigured', 'deposit.quoteConfigured', 'deposit.requested', 'deposit.allocated', 'refund.paid'])
```

### 9. tests/api/customer-quotes.test.mjs

Surviving registration: QUOTE-003, QUOTE-014 frozen signed deposit stays owner-only, is held on the exact job, allocates to its final invoice and refunds through the original card

Original step: QUOTE-003, QUOTE-014 an original-method refund made while a deposit is job-held follows it into the final invoice once

Assertion text count: 7; generated provider cases: 1.

```js
assert.equal((await post({ action: 'approve', choice, name: 'Mei Lin', capacity: 'Owner', documentHash: selected.documentHash, selectionHash: selected.selection.hash, consent: { ...selected.disclosure, affirmed: true }, signature: { kind: 'typed', text: 'Mei Lin' } })).status, 200)
```

```js
assert.equal(refund.status, 'paid')
```

```js
assert.equal(refund.invoiceId, null)
```

```js
assert.equal((await h.state()).payments.find(p => p.id === refund.id).invoiceId, invoice.id)
```

```js
assert.equal((await (await h.request('/api/glove/balances')).json()).invoices.find(i => i.id === invoice.id).due, '1400.00')
```

```js
assert.equal((await (await h.request('/api/glove/reports/receivables.json?asOf=2099-01-01')).json()).totals[0].total, '1400.00')
```

```js
assertTrail(h, ['deposit.allocated', 'refund.allocated'])
```

### 10. tests/api/email.test.mjs

Surviving registration: COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay

Original step: COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay

Assertion text count: 24; generated provider cases: 1.

```js
assert.deepEqual([sent.provider, sent.authorization, sent.body.Metadata.glove_delivery_id], ['postmark', apiKey, c.message.id])
```

```js
assert.equal((await h.state()).messageStates[c.message.id].status, 'accepted')
```

```js
assert.equal(h.email.sent.length, 5, 'one real send per outcome, with only the Postmark network edge faked')
```

```js
assertTrail(h, ['mail.connected', 'email.queued', 'email.accepted'])
```

```js
assert.ok(!JSON.stringify({ state, activity, exported, saved }).includes(secret), 'state, Activity, business export and saved command outcomes exclude credentials')
```

```js
assert.equal((await postEvents(h, { raw: JSON.stringify(cases[0].payload), headers: {} })).status, 401)
```

```js
assert.deepEqual(await inspect(), beforeUnsigned, 'unsigned delivery creates no outcome or receipt')
```

```js
assert.equal(response.status, 200, await response.text())
```

```js
assert.deepEqual([states[c.message.id].status, states[c.message.id].providerMessageId, states[c.message.id].at], [c.status, c.message.receipt, c.at], c.status)
```

```js
assert.equal(facts.length, 1, `${c.status} is retained exactly once in the business export`)
```

```js
assert.deepEqual(JSON.parse(fact.data), {
      messageId: c.message.id, provider: 'postmark', providerMessageId: c.message.receipt,
      eventId: c.details.ID === undefined ? `Delivery:${c.message.receipt}:Delivery:${c.message.to}:${Date.parse(c.at)}` : `${c.details.RecordType}:${c.details.ID}`,
      status: c.status, occurredAt: c.at,
    })
```

```js
assert.equal(visible.length, 1, `${c.status} has the same retained fact in Activity`)
```

```js
assert.deepEqual([visible[0].kind, visible[0].subjectKind, visible[0].subjectId, visible[0].actorName, visible[0].actorRole, visible[0].at], [`email.${c.status}`, 'message', c.message.id, 'Postmark', 'provider', '2026-11-08T12:01:00.000Z'])
```

```js
assert.equal(visible[0].summary, fact.summary)
```

```js
assert.ok(visible[0].summary.includes(c.message.to))
```

```js
assert.ok(visible[0].summary.includes(`Provider reference: ${c.message.receipt}`), `${c.status} exposes its provider reference in Activity`)
```

```js
assert.ok(visible[0].summary.includes(`Occurred at: ${c.at}`), `${c.status} exposes provider occurrence separately from receipt time in Activity`)
```

```js
assert.equal(receipts.length, cases.indexOf(c) + 1)
```

```js
assert.deepEqual(await inspect(), retained, 'actual Worker disposal and recreation retains every state, Activity fact, export fact and receipt')
```

```js
assert.equal((await postEvents(h, callback(c.payload))).status, 200)
```

```js
assert.deepEqual(await inspect(), retained, `${c.status} replay adds no fact or receipt and changes no message state`)
```

```js
assert.equal((await postEvents(h, callback(unknown))).status, 401)
```

```js
assert.deepEqual(await inspect(), retained, 'unrecognized bounce Type cannot become failed, consume a receipt or add an Activity fact')
```

```js
assert.equal(h.email.sent.length, 5, 'callbacks, restart, replay and refusal never resend')
```

### 11. tests/api/email.test.mjs

Surviving registration: COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay

Original step: COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events

Assertion text count: 40; generated provider cases: 1.

```js
b.dispatcher.run('email.send', { kind: 'quote', id: quote.id, version: quote.version }, { error: 'MAIL' })
```

```js
b.office.run('mail.connect', connect, { error: 'FORBIDDEN' })
```

```js
h.command('mail.connect', { ...connect, eventKey: 'whsec_not-a-sendgrid-key' }, { error: 'INPUT' })
```

```js
h.command('mail.connect', { ...connect, fromEmail: 'not an address' }, { error: 'INPUT' })
```

```js
b.priyaPerson.run('email.send', { kind: 'quote', id: quote.id, version: quote.version }, { error: 'FORBIDDEN' })
```

```js
assert.equal(quoteSent.authorization, `Bearer ${apiKey}`)
```

```js
assert.deepEqual([quoteSent.to, quoteSent.body.from.email, quoteSent.body.custom_args.rer_delivery_id], ['mei@harbourview.example', 'office@harbourair.example', quoteMail.id])
```

```js
assert.match(quoteSent.body.content[0].value, new RegExp(`${quote.number} \\(revision 1\\)[\\s\\S]*Condenser fan motor[\\s\\S]*Total: \\$`))
```

```js
assert.deepEqual([quote.status, quote.sent.at(-1).channel, quote.sent.at(-1).messageId], ['sent', 'email', quoteMail.id])
```

```js
b.office.run('email.send', { kind: 'invoice', id: inv.id, version: inv.version }, { error: 'INVOICE_STATE' })
```

```js
b.dispatcher.run('email.send', { kind: 'invoice', id: inv.id, version: inv.version }, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.email.sent.at(-1).to, 'payables@harbourview.example')
```

```js
assert.match(h.email.sent.at(-1).body.content[0].value, new RegExp(`invoice ${inv.number} for ${job.number}`))
```

```js
assert.equal(h.email.sent.at(-1).to, 'orders@supplyco.example')
```

```js
assert.deepEqual([sentPo.status, sentPo.sent.method, sentPo.sent.messageId], ['sent', 'email', poMail.id])
```

```js
assert.deepEqual([quoteMail, invoiceMail, poMail].map(m => states[m.id].status), ['accepted', 'accepted', 'accepted'])
```

```js
assert.deepEqual([states[refusedMail.id].status, states[refusedMail.id].next], ['rejected', 'Check the email connection and the address, then send again.'])
```

```js
assert.equal((await postEvents(h, { raw: JSON.stringify(batch), headers: {} })).status, 401)
```

```js
assert.equal((await postEvents(h, mailEvents('sendgrid').signed(batch))).status, 401)
```

```js
assert.equal((await postEvents(h, sendgrid.signed([sgEvent(quoteMail, 'delivered', 1, 'someone@else.example')]))).status, 401)
```

```js
assert.deepEqual(Object.values((await h.state()).messageStates).map(s => s.status).sort(), ['accepted', 'accepted', 'accepted', 'rejected'])
```

```js
assert.equal(delivered.status, 200, await delivered.clone().text())
```

```js
assert.equal((await postEvents(h, sendgrid.signed(batch))).status, 200, 'a replayed batch is acknowledged')
```

```js
assert.deepEqual([quoteMail, invoiceMail, poMail].map(m => states[m.id].status), ['delivered', 'bounced', 'delivered'])
```

```js
assert.equal(states[invoiceMail.id].text, 'Bounced: payables@harbourview.example did not accept it (reported by SendGrid)')
```

```js
assert.deepEqual(state.emailWarnings[customer.id], { messageId: invoiceMail.id, to: 'payables@harbourview.example', status: 'bounced', at: states[invoiceMail.id].at, text: states[invoiceMail.id].text, next: 'Check the address with the customer, correct it on their record and send again.' })
```

```js
assert.deepEqual(about(invoiceMail.id), [['email.queued', 'office'], ['email.accepted', 'provider'], ['email.bounced', 'provider']])
```

```js
assert.deepEqual(about(poMail.id), [['email.queued', 'office'], ['email.accepted', 'provider'], ['email.delivered', 'provider']])
```

```js
assert.deepEqual(await stream(`customerId=${customer.id}`), [
    ['quote emailed', 'outbound', 'Sam Ortiz', 'mei@harbourview.example', 'Delivered to mei@harbourview.example\'s mail server (reported by SendGrid)'],
    ['invoice emailed', 'outbound', 'Olu Office', 'payables@harbourview.example', 'Bounced: payables@harbourview.example did not accept it (reported by SendGrid)'],
    ['purchase order emailed', 'outbound', 'Olu Office', 'orders@supplyco.example', 'Delivered to orders@supplyco.example\'s mail server (reported by SendGrid)'],
  ])
```

```js
assert.deepEqual((await stream(`jobId=${job.id}`)).map(e => e[0]), ['invoice emailed', 'purchase order emailed'])
```

```js
assertTrail(h, ['mail.connected', 'email.queued', 'email.accepted', 'email.rejected', 'email.delivered', 'email.bounced'])
```

```js
assert.equal(exported.messages.length, 4)
```

```js
assert.ok(exported.timeline.some(e => e.kind === 'email.accepted' && JSON.parse(e.data).providerMessageId === 'sg-receipt-1'))
```

```js
assert.equal(exported.timeline.filter(e => e.kind === 'email.delivered').length, 2, 'a replayed event is recorded once')
```

```js
assert.ok(!everything.includes(apiKey) && !everything.includes(sendgrid.eventKey), 'no provider key in state or export')
```

```js
assert.deepEqual([viaResend.provider, viaResend.idempotencyKey, viaResend.to], ['resend', resent.id, 'mei@harbourview.example'])
```

```js
assert.equal((await postEvents(h, resend.signed(resendEvent))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[resent.id].status, 'delivered')
```

```js
b.office.run('email.send', { kind: 'quote', id: again.id, version: again.version + 1 }, { error: 'MAIL' })
```

```js
assert.equal((await postEvents(h, resend.signed(resendEvent))).status, 404)
```

### 12. tests/api/email.test.mjs

Surviving registration: COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay

Original step: COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic

Assertion text count: 13; generated provider cases: 1.

```js
assert.deepEqual([unmatched.status, unmatchedBody], [200, { ok: true }])
```

```js
assert.equal(await mailSnapshot(h), before, 'authenticated unmatched consumes no ID or verified-at and has no effect')
```

```js
assert.equal((await h.state()).messageStates[sent.id].status, 'accepted')
```

```js
assert.equal(matchedResponse.status, 200)
```

```js
assert.deepEqual(await matchedResponse.json(), unmatchedBody, 'successful and unmatched acknowledgements disclose no match count')
```

```js
assert.equal((await h.state()).messageStates[sent.id].status, 'delivered')
```

```js
assert.ok((await h.state()).mailCallbacks.verifiedAt)
```

```js
assert.equal((await postEvents(h, signer.signed([matchLater]))).status, 200, 'unmatched event did not reserve its event ID')
```

```js
assert.equal((await h.state()).emailWarnings[b.customer.id].status, 'complained')
```

```js
assert.equal((await postEvents(peerView, accepted)).status, 200, 'verified traffic is never rate limited by rejection counts')
```

```js
assert.equal((await postEvents(h, resend.signed(re))).status, 200)
```

```js
assert.equal(await mailSnapshot(h), reBefore)
```

```js
assert.equal((await postEvents(h, resend.signed({ ...re, data: { email_id: `re-receipt-${h.email.sent.length}`, to: [reSent.to] } }))).status, 200)
```

### 13. tests/api/email.test.mjs

Surviving registration: COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay

Original step: COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes

Assertion text count: 32; generated provider cases: 1.

```js
b.office.run('mail.connect', connect, { error: 'FORBIDDEN' })
```

```js
assert.match(connected.callbackPassword, /^[a-f0-9]{64}$/)
```

```js
assert.equal((await h.command('mail.connect', connect, { commandId })).callbackPassword, undefined)
```

```js
assert.equal(stored.current_hash, (await import('node:crypto')).createHash('sha256').update(current).digest('hex'))
```

```js
assert.equal(stored.previous_hash, null)
```

```js
assert.equal((await h.state()).business[0].mail.postmarkAllowlist, false)
```

```js
assert.ok(out, JSON.stringify((await h.state()).messageStates))
```

```js
assert.deepEqual([out.provider, out.authorization, out.body.Metadata.glove_delivery_id], ['postmark', connect.apiKey, message.id])
```

```js
assert.equal(insecure.status, 401, 'Postmark Basic credentials are accepted only over HTTPS')
```

```js
assert.equal(await mailSnapshot(h), insecureBefore)
```

```js
assert.equal((await postEvents(h, post(delivered))).status, 200)
```

```js
assert.equal((await postEvents(h, post(delivered))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[m.id].status, 'delivered')
```

```js
assert.equal((await h.db.prepare("SELECT count(*) AS n FROM rer_mail_event_receipts WHERE provider='postmark'").first()).n, 1)
```

```js
assert.equal((await postEvents(h, post(missing))).status, 200)
```

```js
assert.equal(await mailSnapshot(h), before)
```

```js
assert.equal((await postEvents(h, post(pmEvent(message, recordType, details)))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[message.id].status, expected)
```

```js
b.office.run('mail.callback', { action: 'rotate' }, { error: 'FORBIDDEN' })
```

```js
assert.notEqual(rotated.callbackPassword, current)
```

```js
assert.equal(Date.parse(rotatedStored.previous_until) - Date.parse(rotation.at), 86_400_000)
```

```js
assert.equal((await postEvents(h, post(delivered))).status, 200, 'old credential valid during 24h overlap')
```

```js
assert.equal((await postEvents(h, post(delivered, rotated.callbackPassword))).status, 200)
```

```js
assert.equal((await postEvents(h, post(fresh, rotated.callbackPassword))).status, 200, 'new credential still valid at old expiry')
```

```js
assert.equal((await postEvents(h, post(delivered, again.callbackPassword, { 'cf-connecting-ip': '3.134.147.250' }))).status, 200)
```

```js
assert.equal((await h.state()).business[0].mail.postmarkAllowlist, true, 'reconnecting credentials preserves the owner-selected allowlist')
```

```js
assert.equal((await postEvents(h, post(delivered, reconnected.callbackPassword, { 'cf-connecting-ip': '3.134.147.250' }))).status, 200)
```

```js
assertTrail(h, ['mail.connected', 'mail.callback.rotate', 'mail.callback.revokePrevious', 'mail.callback.allowlist', 'email.delivered', 'email.bounced', 'email.deferred', 'email.failed', 'email.complained'])
```

```js
assert.ok(!visible.includes(secret), 'no secret in state, trail, export or saved outcomes')
```

```js
assert.equal((await postEvents(h, post(delivered, again.callbackPassword))).status, 404)
```

```js
assert.equal((await postEvents(h, post(delivered, reconnected.callbackPassword))).status, 404)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_mail_callback_auth').first()).n, 0)
```

### 14. tests/api/email.test.mjs

Surviving registration: COMM-016 Postmark outcomes retain exact message states and attributable facts across restart and replay

Original step: COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs

Assertion text count: 31; generated provider cases: 1.

```js
h.command('mail.connect', { ...connection, sns: { ...settings, region: 'elsewhere' } }, { error: 'INPUT' })
```

```js
h.command('mail.connect', { ...connection, apiKey: '{}' }, { error: 'INPUT' })
```

```js
assert.ok(out, JSON.stringify((await h.state()).messageStates))
```

```js
assert.equal(out.provider, 'ses')
```

```js
assert.match(out.authorization, /^AWS4-HMAC-SHA256 Credential=TESTONLYACCESSKEY0001\/\d{8}\/us-east-1\/ses\/aws4_request,/)
```

```js
assert.equal(out.body.ConfigurationSetName, settings.configurationSet)
```

```js
assert.deepEqual(out.body.EmailTags, [{ Name: 'glove_delivery_id', Value: Buffer.from(message.id).toString('base64url') }])
```

```js
assert.equal(h.email.fetches.length, n)
```

```js
assert.equal(h.email.fetches.length, 1)
```

```js
assert.equal((await h.state()).messageStates[m.id].status, 'accepted')
```

```js
assert.equal((await postEvents(h, unknownSigned)).status, 200)
```

```js
assert.equal(await mailSnapshot(h), before)
```

```js
assert.equal(h.email.subscriptions.length, 0)
```

```js
assert.equal((await postEvents(h, signed)).status, 200)
```

```js
assert.equal((await postEvents(h, signed)).status, 200)
```

```js
assert.equal((await postEvents(h, signer.signed(payload))).status, 200, 'same SES event with another SNS ID remains one event')
```

```js
assert.equal((await h.state()).messageStates[m.id].status, 'delivered')
```

```js
assert.equal((await h.db.prepare("SELECT count(*) AS n FROM rer_mail_event_receipts WHERE provider='ses'").first()).n, 1)
```

```js
assert.equal((await postEvents(h, signer.signed(e))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[message.id].status, expected)
```

```js
assert.equal(h.email.fetches.length, fetchCount, 'unsigned confirmation fetched nothing')
```

```js
assert.equal((await postEvents(h, subscribe)).status, 200)
```

```js
assert.equal((await postEvents(h, subscribe)).status, 200)
```

```js
assert.equal(h.email.subscriptions.length, 1)
```

```js
assert.equal((await postEvents(h, unsub)).status, 200)
```

```js
assert.equal(h.email.subscriptions.length, 1)
```

```js
assert.match((await h.state()).mailCallbacks.warning, /cancelled the email-event subscription/)
```

```js
assertTrail(h, ['email.delivered', 'email.bounced', 'email.failed', 'email.deferred', 'email.complained', 'email.rejected', 'mail.subscription.confirmed', 'mail.subscription.unsubscribed'])
```

```js
assert.equal(trail.exported.timeline.filter(e => e.kind === 'email.delivered').length, 1)
```

```js
assert.ok(!visible.includes('test-only-ses-secret-not-an-account') && !visible.includes('test-only-subscription-token'))
```

```js
assert.equal((await postEvents(h, subscribe)).status, 404)
```

### 15. tests/api/movein.test.mjs

Surviving registration: ServiceM8 every source record is reviewed, fingerprinted, retained through restart, repeated without effects and safely undone

Original step: ServiceM8 every source record is reviewed, fingerprinted, retained through restart, repeated without effects and safely undone

Assertion text count: 47; generated provider cases: 1.

```js
b.office.run('import.stage', { files: input }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(recordProjection(staged.preview.records), expectedRecords)
```

```js
assert.deepEqual(staged.preview.byKind.jobactivity, { input: 3, mapped: 2, merged: 0, rejected: 0, unused: 1 })
```

```js
assert.deepEqual(staged.preview.byKind.attachment, { input: 3, mapped: 2, merged: 0, rejected: 0, unused: 1 })
```

```js
assert.deepEqual(businessRecords(await h.state()), businessRecords(before), 'preview changes no business record')
```

```js
assert.deepEqual(await h.state(), stagedState, 'wrong fingerprint changes no record')
```

```js
assert.deepEqual(batch.preview, staged.preview, 'the committed batch retains the exact reviewed projection')
```

```js
assert.deepEqual(await commit(staged, staged.preview.fingerprint, { commandId: commitId }), batch)
```

```js
assert.deepEqual(await h.state(), committed, 'lost-answer replay is inert')
```

```js
assert.deepEqual(committed[kind].filter(r => !before[kind].some(old => old.id === r.id)).map(r => r.id).sort(), destinations.map(d => d.id).sort(), kind)
```

```js
assert.equal(committed[kind].find(r => r.id === d.id).source.id, source.sourceId)
```

```js
assert.ok((d.kind === 'customers' ? merged.contacts : merged.lines ?? merged.revisions[0].lines).some(item => item.sourceId === record.sourceId), 'merged records retain their source identity')
```

```js
assert.deepEqual([importedJob.number, importedJob.customerId, importedJob.siteId, importedJob.title, importedJob.status, importedJob.workDone, importedJob.purchaseOrder],
    ['SM8-1012', `sm8-${company1}`, 'sm8-site-40348167947ffe64470806c2', 'Coolroom compressor not starting', 'invoiced', 'Replaced start capacitor, tested 30 min', 'BB-2219'])
```

```js
assert.deepEqual(priceLines(importedJob.lines), [
    ['7c8d9e0f-0001-4a1b-8c2d-3e4f5a6b7c01', 'Call-out and diagnosis', '1', '145.00', '145.00', 'GST'],
    ['7c8d9e0f-0002-4a1b-8c2d-3e4f5a6b7c02', 'Start capacitor 45uF', '1', '38.50', '38.50', 'GST'],
  ])
```

```js
assert.deepEqual(importedJob.totals, { subtotal: '183.50', gst: '18.35', total: '201.85' })
```

```js
assert.deepEqual([quote.status, quote.revisions[0].approval, quote.customerId, quote.siteId], ['draft', null, `sm8-${company2}`, 'sm8-site-509de9a75b649d441a872db0'])
```

```js
assert.deepEqual(priceLines(quote.revisions[0].lines), [['7c8d9e0f-0004-4a1b-8c2d-3e4f5a6b7c04', 'Zone controller supply and install', '1', '1240.00', '1240.00', 'GST']])
```

```js
assert.deepEqual(committed.visits.filter(v => v.source?.system === 'ServiceM8').map(v => [v.id, v.jobId, v.technicianId, v.startAt, v.endAt, v.status, v.arrival]), [
    ['sm8-5a6b7c8d-0001-4e9f-8a0b-1c2d3e4f5a01', `sm8-${completed}`, 'sm8-f0e1d2c3-1111-4a5b-9c8d-7e6f5a4b3c01', '2026-08-14T03:00:00.000Z', '2026-08-14T05:15:00.000Z', 'completed', null],
    ['sm8-5a6b7c8d-0002-4e9f-8a0b-1c2d3e4f5a02', `sm8-${openJob}`, 'sm8-f0e1d2c3-2222-4a5b-9c8d-7e6f5a4b3c02', '2026-10-19T22:00:00.000Z', '2026-10-20T00:00:00.000Z', 'booked', null],
  ])
```

```js
assert.equal(response.status, 200)
```

```js
assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(file.text ?? file.base64, file.text === undefined ? 'base64' : 'utf8'), file.name)
```

```js
assert.equal((await h.request(download(summary), { as: b.office.cookie })).status, 403)
```

```js
assert.equal((await h.request(download(summary), { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal((await h.request(download(summary), { as: '' })).status, 401)
```

```js
assert.deepEqual(businessRecords(await h.state()), businessRecords(committed), 'actual Worker restart retains all mapped values')
```

```js
assert.deepEqual(recordProjection(repeat.preview.records), expectedRecords.map(r => ({ ...r, status: 'already-moved-in', alreadyMovedIn: true })))
```

```js
assert.equal(repeat.preview.alreadyMovedIn, 22)
```

```js
assert.deepEqual(businessRecords(await h.state()), beforeRepeat, 'a repeated commit changes no business record')
```

```js
assert.deepEqual({ alreadyMovedIn: repeat.preview.alreadyMovedIn, status: response.status, resultStatus: result.result?.status ?? null, error: result.error ?? null, business: businessRecords(await upgraded.state()), journal: await originalJournal() },
      { alreadyMovedIn: expectedRecords.length, status: 200, resultStatus: 'committed', error: null, business: before, journal: journalBefore }, 'an unchanged 22-record main-era import repeats after upgrade without changing business records or original source claims')
```

```js
assert.equal(undone.status, 'undone')
```

```js
assert.deepEqual(businessRecords(await h.state()), businessRecords(before), 'undo restores the exact pre-move-in business snapshot')
```

```js
assertTrail(h, ['import.previewed', 'import.committed', 'import.undone'])
```

```js
assert.deepEqual([fact.actorName, fact.actorRole], ['Olivia Owner', 'owner'])
```

```js
assert.equal(exported.imports.find(i => i.id === batch.id).preview.fingerprint, staged.preview.fingerprint)
```

```js
assert.ok(exported.timeline.some(e => e.id === fact.id))
```

```js
h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Try to back out' }, { error: 'IMPORT_DEPENDENTS' })
```

```js
assert.deepEqual(refused.details.dependents, [{ kind: 'visits', id: visit.id, refersTo: workOrder.id }])
```

```js
assert.deepEqual(after, beforeRefusal, 'dependent-work refusal changes every record and event by zero')
```

```js
assertTrail(h, ['import.previewed', 'import.committed', 'visit.booked'])
```

```js
assert.equal((await h.request(originalUrl, { as: reader.cookie })).status, 200)
```

```js
assert.equal((await h.request(originalUrl, { as: reader.cookie })).status, 403, 'withdrawn Owner authority cannot read originals with an existing session')
```

```js
assert.equal((await h.db.prepare("SELECT state FROM ik_jobs").first()).state, 'completed', 'the journal was not touched')
```

```js
edited.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Refuse losing native work' }, { error: 'NATIVE_EDIT_CONFLICT' })
```

```js
assert.deepEqual(refusal.details, { kind: 'customers', id: customer.id })
```

```js
assert.deepEqual(await edited.state(), beforeRefusal, 'edited fixture customer blocks undo without changing any record or event')
```

```js
assertTrail(edited, ['import.committed', 'customer.saved'])
```

```js
assert.deepEqual([change.actorName, change.actorRole], ['Olivia Owner', 'owner'])
```

```js
assert.equal(exported.customers.find(c => c.id === customer.id).name, 'Balmain Bakehouse amended by owner')
```

### 16. tests/api/movein.test.mjs

Surviving registration: ServiceM8 every source record is reviewed, fingerprinted, retained through restart, repeated without effects and safely undone

Original step: ServiceM8 opening balances retain payment custody, reject mismatches, and preserve native edits on undo

Assertion text count: 29; generated provider cases: 1.

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.equal((await h.state()).invoices.length, 0, 'preview creates no invoice')
```

```js
assert.deepEqual([invoice.openingBalance.amount, invoice.openingBalance.sourceTotal, invoice.openingBalance.asOf, invoice.openingBalance.notForPosting, invoice.revisions[0].approval], ['76.50', '201.85', '2026-10-22', true, null])
```

```js
assert.equal(state.payments.length, 0, 'historical payments are not new Glove receipts')
```

```js
h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'IMPORTED_INVOICE' })
```

```js
assert.equal(aging.customers.find(c => c.customerId === invoice.customerId).total, '76.50')
```

```js
assert.equal((await h.state()).invoices.length, 1)
```

```js
h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Back out' }, { error: 'NATIVE_EDIT_CONFLICT' })
```

```js
assert.match(conflict.message, /changed in Glove/)
```

```js
assert.deepEqual(afterRefusal, beforeRefusal, 'edited-record refusal changes every record and event by zero')
```

```js
assertTrail(h, ['import.previewed', 'import.committed', 'customer.saved'])
```

```js
assert.equal((await h.state()).customers.find(c => c.id === customer.id).name, 'Rozelle Physio & Pilates')
```

```js
assert.equal((await h.state()).imports.find(i => i.id === batch.id).status, 'committed')
```

```js
assert.ok(preview.preview.rejections.some(r => r.kind === 'job' && reason.test(r.reason)), label)
```

```js
assert.equal((await rejected.state()).invoices.length, 0)
```

```js
assert.ok(preview.preview.rejections.some(r => r.kind === 'job' && /total does not match/.test(r.reason)))
```

```js
assert.ok(!after.jobs.some(j => j.source?.id === jobs[0].uuid))
```

```js
assert.equal(after.invoices.length, 0)
```

```js
assert.ok(original, 'privacy export must include retained source payment history for the customer of a rejected job')
```

```js
assert.deepEqual(JSON.parse(Buffer.from(original.bytes, 'base64').toString()).map(p => p.uuid).sort(), ['synthetic-glove-payment-1', 'synthetic-glove-payment-inactive'])
```

```js
assert.ok(exported.importOriginals.some(f => f.kind === 'attachment' && Buffer.from(f.bytes, 'base64').toString() === 'Synthetic retained payment attachment bytes'), 'rejected-job payment originals remain exportable')
```

```js
assert.ok(!JSON.stringify(exported).includes('Synthetic peer payment note'))
```

```js
assert.deepEqual(JSON.parse(Buffer.from(peerPayments.bytes, 'base64').toString()).map(p => p.uuid), ['synthetic-glove-payment-peer'])
```

```js
assert.equal((await rejected.request(`/api/glove/imports/${rejectedBatch.id}/files/${original.sha256}`)).status, 404, 'erasure withdraws shared byte-exact originals from the download door')
```

```js
assert.ok(!journal.includes('Synthetic retained payment note'))
```

```js
assert.ok(!journal.includes('Synthetic inactive payment note'))
```

```js
assert.ok(!journal.includes('Synthetic retained payment attachment bytes'))
```

```js
assert.ok(!journal.includes(Buffer.from('Synthetic retained payment attachment bytes').toString('base64')))
```

```js
assert.ok(JSON.stringify(remaining).includes('Synthetic peer payment note'))
```

### 17. tests/api/movein.test.mjs

Surviving registration: MOVE-001, MOVE-007 Jobber saved responses and product CSV preview, retain recurring visits, repeat without duplicates and undo while keeping native work

Original step: MOVE-001, MOVE-007 Jobber saved responses and product CSV preview, retain recurring visits, repeat without duplicates and undo while keeping native work

Assertion text count: 110; generated provider cases: 1.

```js
b.office.run('import.stage', { format: 'jobber', files }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.ok(staged.preview.unmappedFields.clients.includes('contacts'))
```

```js
assert.ok(staged.preview.unmappedFields.jobs.includes('unsupportedSourceField'))
```

```js
assert.ok(staged.preview.unmappedFields.jobs.some(f => f.includes('recurrence:')))
```

```js
assert.deepEqual(staged.preview.missingAttachments.map(a => a.name).sort(), ['Balance confirmation.pdf', 'Warranty conditions.pdf'])
```

```js
assert.equal((await h.state()).jobs.length, before.jobs.length, 'preview is inert')
```

```js
assert.equal(summary.size, bytes.length)
```

```js
assert.equal(summary.sha256, createHash('sha256').update(bytes).digest('hex'))
```

```js
assert.equal(imported('customers')[0].source.id, 'synthetic-glove-client')
```

```js
assert.equal(imported('sites')[0].customerId, imported('customers')[0].id)
```

```js
assert.deepEqual(imported('customers')[0].contacts.map(c => [c.sourceId, c.email, c.phone, c.sourceContactId]), [['synthetic-glove-email', 'synthetic-glove-1@example.test', '', 'synthetic-glove-contact'], ['synthetic-glove-phone', '', '+15125550123', 'synthetic-glove-contact']])
```

```js
assert.equal(imported('jobs').find(j => j.source.id === 'synthetic-glove-job-2').status, 'archived')
```

```js
assert.equal(imported('enquiries')[0].customerId, imported('customers')[0].id)
```

```js
assert.equal(imported('technicians')[0].operatorId, null)
```

```js
assert.equal(imported('jobs')[0].importedRecurrence.active, false)
```

```js
assert.equal(imported('jobs')[0].series, undefined)
```

```js
assert.equal(imported('jobs')[0].importedRecurrence.source.calendarRule, 'synthetic-glove-source-rule')
```

```js
assert.equal(pending.importedVisitId, 'synthetic-glove-unscheduled')
```

```js
assert.equal(pending.title, 'Synthetic pending inspection')
```

```js
assert.equal(pending.instructions, 'Call before arranging a date')
```

```js
assert.equal(pending.sourceComplete, false)
```

```js
assert.equal(pending.deviceTime, null)
```

```js
assert.equal(pending.jobId, imported('jobs')[0].id)
```

```js
assert.equal(sourceQuote.source.id, 'synthetic-glove-quote')
```

```js
assert.equal(sourceQuote.customerId, imported('customers')[0].id)
```

```js
assert.equal(sourceQuote.siteId, imported('sites')[0].id)
```

```js
assert.equal(sourceQuote.importedStatus, 'approved')
```

```js
assert.equal(sourceQuote.status, 'imported')
```

```js
assert.equal(sourceQuote.acceptance, null)
```

```js
assert.equal(sourceQuote.revisions[0].approval, null)
```

```js
assert.equal(sourceQuote.revisions[0].totals.total, '205.68')
```

```js
assert.equal(sourceQuote.revisions[0].lines[0].sourceId, 'synthetic-glove-quote-line')
```

```js
assert.equal(sourceQuote.revisions[0].lines[1].total, '-10.00')
```

```js
assert.equal(sourceQuote.importedTerms, 'Synthetic source terms')
```

```js
assert.deepEqual(sourceQuote.importedTextRows, [{ sourceId: 'synthetic-glove-quote-text-1', position: 1, name: 'Before the visit', description: 'Please clear access to the outdoor unit.' }])
```

```js
h.command(type, { quoteId: sourceQuote.id, version: sourceQuote.version, revision: 1 }, { error: 'IMPORTED_QUOTE' })
```

```js
h.command('document.photo', { kind: 'quote', id: sourceQuote.id, version: sourceQuote.version }, { error: 'IMPORTED_QUOTE' })
```

```js
h.command('quote.link', { quoteId: sourceQuote.id, version: sourceQuote.version }, { error: 'NOT_APPROVED' })
```

```js
assert.equal(note.text, 'Synthetic Jobber job note')
```

```js
assert.equal(note.importedNoteId, 'synthetic-glove-note')
```

```js
assert.equal(note.jobId, imported('jobs')[0].id)
```

```js
assert.equal(note.deviceTime, '2026-10-01T08:00:00Z')
```

```js
assert.equal(note.receivedAt, null)
```

```js
assert.equal(attachment.name, 'Synthetic source attachment.txt')
```

```js
assert.equal(attachment.importedAttachmentId, 'synthetic-glove-attachment')
```

```js
assert.equal(attachment.importedNoteId, note.importedNoteId)
```

```js
assert.equal(attachment.bytes.status, 'retained')
```

```js
assert.ok(!JSON.stringify(attachment).includes('https:'), 'no remote URL becomes a native fetch target')
```

```js
assert.ok(original, 'exact attachment bytes are in journal custody')
```

```js
assert.equal(kept.toString(), 'synthetic-glove-attachment\n')
```

```js
assert.equal((await stage(files.filter(f => !f.base64))).preview.missingAttachments.length, 4)
```

```js
assert.equal(row.importedNotes.length, 1, 'inherited notes stay only on their owning record')
```

```js
assert.equal(row.importedNotes[0].sourceType, type)
```

```js
assert.deepEqual(row.importedNotes[0].owner, { kind: ownerKind, sourceId })
```

```js
assert.equal(row.importedNotes[0].sourceTime, time)
```

```js
assert.equal(row.importedAttachments.length, ownerKind === 'requests' ? 0 : 1)
```

```js
assert.ok(!JSON.stringify(row.importedAttachments).includes('https:'), 'no source URL becomes a native fetch target')
```

```js
assert.equal(sourceCustomer.importedAttachments[0].bytes.status, 'retained')
```

```js
assert.equal(sourceQuote.importedAttachments[0].bytes.status, 'missing')
```

```js
assert.deepEqual(imported('captures').filter(c => c.kind === 'note').map(c => c.importedNoteId), ['synthetic-glove-note'])
```

```js
assert.ok(clientOriginal, 'private source attachment bytes are in journal custody')
```

```js
assert.deepEqual(clientChunks.length ? Buffer.from(clientChunks.map(c => c.bytes).join(''), 'base64') : Buffer.from(clientOriginal.bytes), await readFile('tests/fixtures/jobber-movein/client-attachment.txt'))
```

```js
assert.deepEqual(sourceExport.customers.find(c => c.id === sourceCustomer.id).importedNotes, sourceCustomer.importedNotes)
```

```js
assert.deepEqual(sourceExport.invoices.find(i => i.source?.system === 'Jobber').importedAttachments, imported('invoices')[0].importedAttachments)
```

```js
assert.ok((await stage(changedNotes(kind, change))).preview.rejections.some(r => r.kind === kind), 'invalid source ownership, time or attachment evidence is refused')
```

```js
assert.ok(absentReview.preview.rejections.some(r => r.kind === 'jobs' && /exported clients owner/.test(r.reason)), 'an inherited note cannot be reassigned to a job when its source owner is missing')
```

```js
assert.deepEqual(imported('visits').map(v => [v.startAt, v.status]).sort(), [['2026-10-23T14:00:00.000Z','booked'],['2026-11-23T14:00:00.000Z','completed']])
```

```js
assert.equal(visit.jobId, imported('jobs')[0].id)
```

```js
assert.equal(visit.technicianId, imported('technicians')[0].id)
```

```js
assert.equal(invoice.source.id, 'synthetic-glove-invoice')
```

```js
assert.equal(invoice.jobId, imported('jobs')[0].id)
```

```js
assert.deepEqual(invoice.importedJobIds, imported('jobs').map(j => j.id))
```

```js
assert.equal(invoice.openingBalance.amount, '76.50')
```

```js
assert.equal(invoice.openingBalance.notForPosting, true)
```

```js
assert.equal(invoice.revisions[0].totals.total, '216.50')
```

```js
assert.equal(invoice.revisions[0].approval, null)
```

```js
assert.deepEqual(invoice.revisions[0].lines.map(l => [l.sourceId, l.description, l.quantity, l.unitPrice, l.total, l.tax]), [['synthetic-glove-line-1', 'Synthetic inspection, Source inspection detail', '2', '100.00', '200.00', 'TAXABLE']])
```

```js
assert.equal(invoice.sourceLinesUnavailable, undefined)
```

```js
assert.ok((await stage(changedInvoice(change))).preview.rejections.some(r => r.kind === 'invoices'), 'inconsistent or incomplete source money is rejected')
```

```js
assert.deepEqual(discountedPreview.preview.rejections, [])
```

```js
assert.deepEqual(archivedPreview.preview.rejections, [])
```

```js
assert.equal(aging.customers.find(c => c.customerId === invoice.customerId).total, '76.50')
```

```js
h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'IMPORTED_INVOICE' })
```

```js
assert.equal(products.length, 2)
```

```js
assert.deepEqual(products.map(p => [p.name, p.kind, p.unitPrice, p.unitCost, p.tax]).sort(), [['Synthetic inspection','service','100.00','25.00','TAXABLE'],['Synthetic replacement filter','material','10.00','3.00','FREE']])
```

```js
assert.ok(again.preview.alreadyMovedIn > 0)
```

```js
assert.equal(twice[kind].length, state[kind].length)
```

```js
assert.equal((await stage(bad)).preview.rejections.filter(r => r.kind === 'visits').length, 3)
```

```js
assert.ok((await stage(invalid)).preview.rejections.some(r => r.kind === 'products-services'))
```

```js
assert.ok((await stage(incomplete)).preview.rejections.some(r => r.kind === 'visits'))
```

```js
assert.ok((await stage(missingBalance)).preview.rejections.some(r => r.kind === 'invoices'))
```

```js
assert.deepEqual(closedStage.preview.rejections, [])
```

```js
assert.equal(closedJob.status, 'archived')
```

```js
h.command('invoice.prepare', { jobId: closedJob.id }, { error: 'JOB_STATE' })
```

```js
h.command('visit.book', { jobId: closedJob.id, technicianId: b.priya.id, date: '2026-10-26', start: '08:00', end: '09:00' }, { error: 'JOB_STATE' })
```

```js
assert.ok((await stage(input)).preview.rejections.some(r => r.kind === 'quotes'))
```

```js
assert.ok((await stage(input)).preview.rejections.some(r => r.kind === 'jobs'))
```

```js
assert.ok((await stage(wrongAttachment)).preview.rejections.some(r => r.kind === 'jobs'))
```

```js
assert.equal(undone[kind].length, before[kind].length)
```

```js
assert.ok(undone.customers.some(c => c.id === native.id))
```

```js
assert.ok(!undone.customers.some(c => c.id === sourceCustomer.id), 'undo removes the owning private notes and attachment metadata with their imported customer')
```

```js
assert.ok(field.jobs.some(j => j.id === privacyJob.id), 'the technician really is assigned to the imported job')
```

```js
assert.ok(field.captures.some(c => c.importedNoteId === 'synthetic-glove-note'))
```

```js
assert.ok(!JSON.stringify(field).includes(row.importedNotes[0].text), 'private upstream notes never leak into assigned field work')
```

```js
assert.ok(!JSON.stringify(field).includes('Billing instructions.txt'))
```

```js
assert.equal(field.customers.find(c => c.id === sourceCustomer.id).importedNotes, undefined)
```

```js
assert.deepEqual(field.quotes, [])
```

```js
assert.deepEqual(field.invoices, [])
```

```js
assert.deepEqual(field.enquiries, [])
```

### 18. tests/api/movein.test.mjs

Surviving registration: MOVE-001, MOVE-007 Jobber saved responses and product CSV preview, retain recurring visits, repeat without duplicates and undo while keeping native work

Original step: an undo that takes several passes holds its records until it finishes

Assertion text count: 11; generated provider cases: 1.

```js
assert.equal(committed.ok, true, JSON.stringify(committed))
```

```js
assert.equal((await movedIn()).length, 600)
```

```js
assert.equal(first.ok, false, 'this undo needs more than one pass')
```

```js
assert.equal(first.error.code, 'IMPORT_INCOMPLETE')
```

```js
assert.equal(midway.imports.find(i => i.id === staged.id).status, 'undoing', 'the screen shows the undo is part-way')
```

```js
assert.equal(enquiry.error?.code, 'IMPORT_UNDOING', 'no new work may refer to a record that is being undone')
```

```js
assert.equal(edit.error?.code, 'IMPORT_UNDOING', 'nor may it be edited')
```

```js
assert.equal(undone.ok, true, JSON.stringify(undone))
```

```js
assert.equal(s.customers.filter(c => c.id.startsWith('sm8-')).length, 0, 'every moved-in record is gone')
```

```js
assert.ok(s.customers.some(c => c.name === 'Walk-in customer'), 'unrelated desk work carried on')
```

```js
assert.equal(s.imports.find(i => i.id === staged.id).status, 'undone')
```

### 19. tests/api/movein.test.mjs

Surviving registration: MOVE-003, MOVE-009 an ongoing multi-location membership keeps one identity and offers each outstanding source event only at its own site

Original step: MOVE-003, MOVE-009 an ongoing multi-location membership keeps one identity and offers each outstanding source event only at its own site

Assertion text count: 15; generated provider cases: 1.

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.equal(state.agreements.filter(a => a.source?.id === '18').length, 1, 'a source membership is never split into several identities or charges')
```

```js
assert.equal(agreement.endDate, null)
```

```js
assert.equal(agreement.siteIds.length, 2)
```

```js
assert.equal(members.agreements.find(a => a.id === agreement.id).active, true, 'ongoing source term remains active')
```

```js
assert.ok(second)
```

```js
assert.equal(reserving.agreements.find(a => a.id === agreement.id).entitlements.nextSiteId, second.siteId, 'the next booking chooses an unreserved entitlement at its actual site')
```

```js
b.office.run('job.create', { customerId: agreement.customerId, siteId: agreement.siteId, agreementId: agreement.id, agreementVisitIndex: second.index, title: 'Wrong source location' }, { error: 'ENTITLEMENT' })
```

```js
assert.equal(job.totals.total, '0.00')
```

```js
assert.notEqual(job.lines[0].serviceId, agreement.plan.visitServiceId, 'different source recurring services do not inherit the first template SKU')
```

```js
assert.equal(job.lines[0].description, 'Second-site coil cleaning')
```

```js
assert.equal(job.lines[0].quantity, '2')
```

```js
assert.equal(state.services.find(s => s.id === job.lines[0].serviceId).source.id, '28')
```

```js
assert.equal(booked.booked, true)
```

```js
assert.equal(booked.siteId, second.siteId)
```

### 20. tests/api/movein.test.mjs

Surviving registration: MOVE-003, MOVE-009 an ongoing multi-location membership keeps one identity and offers each outstanding source event only at its own site

Original step: MOVE-003, MOVE-009 source recurrence activates only after explicit review, never replays exported events, and unsupported rules are named

Assertion text count: 11; generated provider cases: 1.

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.equal(state.visits.filter(v => v.jobId === job.id).length, 0)
```

```js
h.command('series.create', { ...input, date: '2026-07-15' }, { error: 'IMPORT_RECURRENCE' })
```

```js
h.command('series.create', { ...input, date: '2027-02-15' }, { error: 'IMPORT_RECURRENCE' })
```

```js
h.command('series.create', { ...input, date: '2027-01-15', until: null }, { error: 'IMPORT_RECURRENCE' })
```

```js
assert.deepEqual(active.series.revisions[0].rule, job.importedRecurrence.proposal.rule)
```

```js
assert.deepEqual(visits.map(v => v.local.date).sort(), ['2027-01-15','2027-07-15'])
```

```js
assert.ok(visits.every(v => v.technicianId === b.priya.id))
```

```js
h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Must preserve the newly activated native visits' }, { error: 'IMPORT_DEPENDENTS' })
```

```js
assert.equal((await h.state()).visits.filter(v => v.jobId === job.id).length, 2)
```

```js
assert.ok(preview.preview.unmappedFields['recurring-services'].some(f => f.includes('no exact native rule')))
```

### 21. tests/api/payments.test.mjs

Surviving registration: PAY-004, PAY-021, PAY-022, PAY-023 three installments, original-card refund, cash/check overpayment and customer credit keep invoice, aging, brief and receipts exact

Original step: PAY-004, PAY-021, PAY-022, PAY-023 three installments, original-card refund, cash/check overpayment and customer credit keep invoice, aging, brief and receipts exact

Assertion text count: 48; generated provider cases: 1.

```js
assert.equal(invoice.due, due)
```

```js
assert.equal(balances.customers[0].due, due)
```

```js
assert.equal(aging.totals[0]?.total ?? '0.00', due)
```

```js
assert.equal(aging.customers[0].invoices[0].href, `#invoices/${inv.id}`)
```

```js
assert.equal(aging.customers[0].buckets.over90, due)
```

```js
assert.equal(dashboard.receivables[0]?.total ?? '0.00', due)
```

```js
assert.equal(pi.amount, 7500)
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded')).status, 200)
```

```js
b.office.run('payment.refund', refundPayload, { error: 'FORBIDDEN' })
```

```js
assert.equal(refund.status, 'paid')
```

```js
assert.equal(refund.paymentId, payment.id)
```

```js
assert.equal(refund.method, 'card')
```

```js
assert.equal(refund.amount, '50.00')
```

```js
assert.equal(h.stripePayments.refunds.get(refund.providerReference).payment_intent, pi.id)
```

```js
assert.equal(h.stripePayments.calls.length, calls, 'refund command replay never resends')
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded')).status, 200)
```

```js
assert.equal(brief.sections.overdue[0].id, inv.id)
```

```js
assert.match(brief.sections.overdue[0].text, /\$50.00/)
```

```js
assert.deepEqual(brief.sections.overdue[0].action, { label: 'Review overdue invoice', href: `#invoices/${inv.id}` })
```

```js
assert.equal(balances.invoices[0].credit, '50.00')
```

```js
assert.equal(balances.customers[0].balance, '-50.00')
```

```js
assert.equal(allocation.kind, 'allocation')
```

```js
assert.equal(balances.invoices.find(i => i.id === inv.id).credit, '0.00')
```

```js
assert.equal(balances.invoices.find(i => i.id === next.id).due, ((total - 5000) / 100).toFixed(2))
```

```js
assert.equal(aging.customers[0].total, ((total - 5000) / 100).toFixed(2))
```

```js
assert.equal(aging.customers[0].invoices[0].id, next.id)
```

```js
assert.equal(aging.customers[0].invoices[0].href, `#invoices/${next.id}`)
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).receivables[0].total, aging.customers[0].total)
```

```js
assert.equal((await h.state()).messageStates[receipt.id].status, 'accepted')
```

```js
assert.equal((await postEvents(h, edge ? edge.callback(mailReceipt(h, receipt)) : events.signed([{ email: receipt.to, timestamp: Math.floor(Date.now() / 1000), event: 'delivered', sg_event_id: randomUUID(), sg_message_id: 'synthetic-glove-mail-4', rer_delivery_id: receipt.id }]))).status, 200)
```

```js
assert.ok((await read(h, `/api/glove/payments/${row.id}/timeline`)).events.some(e => e.kind === 'email.delivered'))
```

```js
assert.equal(credited.kind, 'credit')
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices.find(i => i.id === next.id).due, ((total - 6000) / 100).toFixed(2))
```

```js
assertTrail(h, ['payment.credited', 'payment.recorded', 'payment.allocated', 'refund.requested', 'refund.paid', 'email.accepted', 'email.delivered'])
```

```js
assert.match(JSON.stringify(trail), /synthetic-glove-refund-1/)
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-[124](?![A-Za-z0-9-])|checkout\.stripe\.com|stripe-signature/)
```

```js
assert.equal((await h.request('/api/glove/balances', { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal(tipRefund.status, 'paid')
```

```js
assert.equal(tipRefund.amount, '0.00')
```

```js
assert.equal(tipRefund.tip, '15.00')
```

```js
assert.equal(h.stripePayments.refunds.get(tipRefund.providerReference).amount, 1500)
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).paidToday.tips, '0.00')
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices.find(i => i.id === inv.id).due, '0.00', 'tip-only refunds never change the invoice or its tax basis')
```

```js
h.command('payment.refund', { invoiceId: inv.id, version: inv.version, paymentId: freshOriginal.id, paymentVersion: freshOriginal.version, amount: '0.00', tip: '0.01', reason: 'Excess tip refund' }, { error: 'AMOUNT' })
```

```js
assert.equal(payroll.people.find(p => p.technicianId === b.priya.id).tips, '0.00', 'a refunded tip no longer belongs in technician payroll')
```

```js
assert.equal((await paymentEvent(h, { metadata: pi.metadata, payment_intent: pi.id }, 'charge.dispute.created')).status, 200)
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).paidToday.tips, '0.00', 'a later return never reverses an already refunded tip twice')
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices.find(i => i.id === inv.id).due, '10.00', 'only the unrefunded card principal returns')
```

### 22. tests/api/payments.test.mjs

Surviving registration: PAY-004, PAY-021, PAY-022, PAY-023 three installments, original-card refund, cash/check overpayment and customer credit keep invoice, aging, brief and receipts exact

Original step: PAY-004, PAY-021, PAY-022, PAY-023 refunds reserve uncertain funds once, refuse excess and stale writes, and confirm pending original-method outcomes explicitly

Assertion text count: 14; generated provider cases: 1.

```js
h.command('payment.refund', { ...payload, amount: '9999.00' }, { error: 'AMOUNT' })
```

```js
assert.equal(uncertain.status, 'reserved')
```

```js
assert.equal(h.stripePayments.calls.length, calls)
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices[0].due, '0.00', 'unknown refund never reopens paid invoice')
```

```js
h.command('payment.refund', { ...payload, amount: original.amount }, { error: 'AMOUNT' })
```

```js
assert.equal(pending.status, 'pending')
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices[0].due, '0.00')
```

```js
assert.equal(pending.status, 'paid')
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices[0].due, '20.00')
```

```js
assert.equal(returned.method, 'cash')
```

```js
assert.equal(returned.status, 'paid')
```

```js
h.command('payment.record', { invoiceId: inv.id, version: inv.version - 1, method: 'cash', amount: '1.00', reference: 'synthetic-glove-10' }, { error: 'STALE' })
```

```js
b.agent.run('payment.record', { invoiceId: inv.id, version: inv.version, method: 'cash', amount: '1.00', reference: 'synthetic-glove-10' }, { error: 'FORBIDDEN' })
```

```js
assertTrail(h, ['refund.unconfirmed'])
```

### 23. tests/api/payout-reconciliation.test.mjs

Surviving registration: PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay

Original step: PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay

Assertion text count: 7; generated provider cases: 1.

```js
assert.deepEqual([matched.reconciled, matched.amount, matched.net, matched.difference, matched.payoutFee, matched.unmatched], [true, '584.20', '584.20', '0.00', '0.00', []])
```

```js
assert.deepEqual(matched.items.map(i => [i.paymentId, i.amountCents, i.feeCents, i.netCents]), [...sources.map(s => [s.payment.id, 10000, 100, 9900]), [refund.id, -1000, -20, -980]])
```

```js
assert.deepEqual([missing.reconciled, missing.net, missing.difference, missing.unmatched.map(i => [i.providerReference, i.reason])], [false, '596.17', '0.00', [['synthetic-glove-missing-payment', 'missing payment']]])
```

```js
assert.deepEqual([result.reconciled, result.amount, result.payoutFee, result.net, result.difference, result.unmatched], [true, '1000.00', '15.00', '1015.00', '0.00', []])
```

```js
assert.match(result.sourceMembership, /owner explicitly allocates/)
```

```js
assert.deepEqual([fresh.reconciled, fresh.items, fresh.unmatched, fresh.net], [missing.reconciled, missing.items, missing.unmatched, missing.net])
```

```js
assert.equal(h.stripePayments.calls.length - calls, f.records[1].calls)
```

### 24. tests/api/payout-reconciliation.test.mjs

Surviving registration: PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay

Original step: PAY-007 point 2: every inspection and reviewed allocation has attributable secret-free Activity and business export facts

Assertion text count: 11; generated provider cases: 1.

```js
assert.equal(activity.length, 3)
```

```js
assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at], [owner.id, owner.name, 'owner', at])
```

```js
assert.ok(event.commandId && event.summary)
```

```js
assert.ok([automatic.providerId, manual.providerId].some(id => event.summary.includes(id)), 'Activity names the inspected Stripe reference')
```

```js
assert.ok(kept)
```

```js
assert.equal(JSON.parse(kept.data).provider, 'Stripe')
```

```js
assert.ok([automatic.providerId, manual.providerId].includes(JSON.parse(kept.data).providerReference))
```

```js
assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.command_id, kept.summary], [event.actorId, event.actorName, event.actorRole, event.at, event.commandId, event.summary])
```

```js
assert.deepEqual(exported.payouts.map(p => p.providerId).sort(), [automatic.providerId, manual.providerId].sort())
```

```js
assert.ok(!text.includes('synthetic-glove-1') && !text.includes('synthetic-glove-2'), 'provider keys are absent')
```

```js
assert.ok(!text.includes('checkout.stripe.com') && !text.includes('synthetic-glove-session-'), 'private Checkout material is absent')
```

### 25. tests/api/payout-reconciliation.test.mjs

Surviving registration: PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay

Original step: PAY-007 point 3: only a signed-in unscoped Owner inspects positive USD test payouts

Assertion text count: 18; generated provider cases: 1.

```js
assert.deepEqual([result.reconciled, result.currency, result.mode], [true, 'USD', 'test'])
```

```js
person.run('payout.reconcile', payload, { error: 'FORBIDDEN' })
```

```js
person.run('payout.allocate', { ...payload, paymentIds: [source.payment.id] }, { error: 'FORBIDDEN' })
```

```js
assert.ok(!(await response.text()).includes(payload.providerId), `${person.name} cannot read retained provider facts`)
```

```js
assert.equal(response.status, 403)
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal(h.stripePayments.calls.length, calls)
```

```js
assert.equal(tokenRead.status, 200)
```

```js
assert.ok(!(await tokenRead.text()).includes(payload.providerId))
```

```js
assert.equal(response.status, expected)
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal(h.stripePayments.calls.length, calls)
```

```js
assert.equal((await h.request('/api/glove/commands', { method: 'POST', as: '', body: { type: 'payout.reconcile', commandId: randomUUID(), payload } })).status, 401)
```

```js
former.run('payout.reconcile', payload, { error: 'FORBIDDEN' })
```

```js
former.run('payout.reconcile', payload, { commandId: formerCommand, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await h.state(), afterWithdrawal)
```

```js
assert.equal(h.stripePayments.calls.length, calls, 'withdrawn authority cannot inspect or replay provider facts')
```

```js
former.run('payout.reconcile', payload, { commandId: formerCommand, error: 'FORBIDDEN' })
```

### 26. tests/api/payout-reconciliation.test.mjs

Surviving registration: PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay

Original step: PAY-007 point 4: ten pages reconcile exactly 1000 rows; overflow, incomplete pages, duplicates, inconsistent rows and wrong sources refuse safely

Assertion text count: 8; generated provider cases: 1.

```js
assert.deepEqual([result.reconciled, result.items.length, result.amount, result.net, result.difference, result.unmatched], [true, 1000, '89.01', '89.01', '0.00', []])
```

```js
assert.equal(pages.length, 10)
```

```js
assert.deepEqual(pages.map(c => [c.limit, c.startingAfter]), Array.from({ length: 10 }, (_, n) => ['100', n === 0 ? null : tx[n * 100 - 1].id]))
```

```js
assert.equal(outcome.reconciled, false, name)
```

```js
assert.deepEqual(outcome.unmatched.map(i => [i.id, i.reason]), [[row.id, reason]], name)
```

```js
assert.match(error.message, /currency differs/)
```

```js
assert.deepEqual([fresh.items, fresh.unmatched, fresh.net, fresh.reconciled], [result.items, result.unmatched, result.net, true])
```

```js
assert.equal(h.stripePayments.calls.length - count, 11, 'a fresh inspection still reads exactly ten pages after Worker restart')
```

### 27. tests/api/payout-reconciliation.test.mjs

Surviving registration: PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay

Original step: PAY-007 point 5: bank plus payout fee must equal source net exactly and only paid payouts reconcile

Assertion text count: 4; generated provider cases: 1.

```js
assert.deepEqual([(await f.inspect(payload)).reconciled, (await f.inspect(payload)).difference], [true, '0.00'])
```

```js
assert.deepEqual([row.reconciled, row.difference], [false, difference])
```

```js
assert.deepEqual([row.providerStatus, row.reconciled, row.difference, row.unmatched], [status, false, '0.00', []])
```

```js
assert.deepEqual((await h.state()).payments, payments, 'inspection never changes a payment balance')
```

### 28. tests/api/payout-reconciliation.test.mjs

Surviving registration: PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay

Original step: PAY-007 point 6: an unavailable payout fee refuses without changing any retained payout

Assertion text count: 1; generated provider cases: 1.

```js
assert.match(error.message, /payout fee; no zero fee is inferred/)
```

### 29. tests/api/payout-reconciliation.test.mjs

Surviving registration: PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay

Original step: PAY-007 point 7: a manual payout has no Stripe source attribution before owner review

Assertion text count: 4; generated provider cases: 1.

```js
assert.deepEqual([row.reconciled, row.items, row.unmatched.map(i => [i.paymentId, i.reason])], [false, [], [[null, 'source allocation not reviewed']]])
```

```js
assert.match(row.sourceMembership, /Stripe does not attribute source payments to manual payouts/)
```

```js
assert.equal(row.sourcePaymentIds, undefined)
```

```js
assert.deepEqual((await h.state()).payments, payments, 'inspection does not allocate available sources')
```

### 30. tests/api/payout-reconciliation.test.mjs

Surviving registration: PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay

Original step: PAY-007 point 8: only explicit owner books allocation reconciles manual sources and other unreviewed payouts remain unmatched

Assertion text count: 19; generated provider cases: 1.

```js
h.command('payout.allocate', { ...payload, paymentIds: [] }, { error: 'PAYOUT_ALLOCATION' })
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal(h.stripePayments.calls.length, calls + 1, 'only the provider read occurs on invalid allocation')
```

```js
assert.deepEqual([row.reconciled, row.amount, row.payoutFee, row.net, row.sourceNet, row.difference, row.sourcePaymentIds, row.unmatched], [true, '98.75', '0.25', '99.00', '99.00', '0.00', [source.payment.id], []])
```

```js
assert.equal(row.items.find(i => i.type === 'owner-allocated source').paymentId, source.payment.id)
```

```js
assert.match(row.sourceBasis, /Owner-reviewed books allocation; not a Stripe source attribution/)
```

```js
assert.equal((await h.state()).payments.find(p => p.id === source.payment.id).payoutAllocationId, row.id)
```

```js
assert.deepEqual([other.reconciled, other.items, other.unmatched[0].reason], [false, [], 'source allocation not reviewed'])
```

```js
h.command('payout.allocate', { ...unreviewed, paymentIds: [source.payment.id] }, { error: 'PAYOUT_ALLOCATION' })
```

```js
assert.deepEqual(await h.state(), allocated, 'one source cannot be allocated twice')
```

```js
assert.deepEqual([bank.amount, bank.payoutFee, bank.net, bank.reconciled], ['98.75', '0.25', '99.00', true])
```

```js
assert.ok(bank.sourceDetailsErasedAt)
```

```js
h.command('payout.reconcile', payload, { error: 'ERASED' })
```

```js
h.command('payout.allocate', input, { error: 'ERASED' })
```

```js
h.command('payout.allocate', input, { commandId, error: 'ERASED' })
```

```js
assert.deepEqual(await h.state(), state, 'neither fresh inspection nor replay restores erased source details')
```

```js
assert.equal(h.stripePayments.calls.length, calls, 'erasure refuses before provider reads')
```

```js
assert.ok(!text.includes(source.pi.latest_charge.id), 'erased provider source is absent from every retained public projection')
```

```js
assert.deepEqual(await erased(), afterErasure)
```

### 31. tests/api/pipeline.test.mjs

Surviving registration: BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure

Original step: BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure

Assertion text count: 36; generated provider cases: 1.

```js
assert.equal((await h.request(endpoint, { as: '' })).status, 404)
```

```js
office.run('intake.configure', { version: (await h.state()).business[0].version, enabled: true, siteKey: 'synthetic-glove-11', secret: 'synthetic-glove-12', allowedOrigins: [] }, { error: 'FORBIDDEN' })
```

```js
assert.equal(config.headers.get('access-control-allow-origin'), embed)
```

```js
assert.deepEqual(await config.json(), { businessName: 'synthetic-glove-13', siteKey: 'synthetic-glove-11', action: 'glove-request' })
```

```js
assert.equal(response.status, 200, await response.clone().text())
```

```js
assert.deepEqual(Object.keys(receipt).sort(), ['ok', 'receipt'])
```

```js
assert.equal(receipt.ok, true)
```

```js
assert.equal(state.customers.length, 1)
```

```js
assert.equal(enquiry.customerId, customer.id)
```

```js
assert.equal(enquiry.source, 'website')
```

```js
assert.equal(enquiry.intake.preferredTimes, input.preferredTimes)
```

```js
assert.equal(enquiry.photos.length, 2)
```

```js
assert.ok(!JSON.stringify(state).includes('synthetic-glove-12'))
```

```js
assert.ok(!(await (await h.request('/api/glove/export')).text()).includes('synthetic-glove-12'))
```

```js
assert.ok(notices.some(n => n.enquiryId === enquiry.id && n.to.includes('office')))
```

```js
assert.ok(state.events.some(e => e.kind === 'intake.received' && e.subjectId === enquiry.id))
```

```js
assert.deepEqual(Object.keys(h.turnstile.calls[0]).sort(), ['response', 'secret'])
```

```js
assert.deepEqual(await (await send(h, input)).json(), receipt)
```

```js
assert.deepEqual(await durable(h), beforeReplay)
```

```js
assert.ok(modelRequest.includes(input.description))
```

```js
assert.ok(!modelRequest.includes(png))
```

```js
assert.ok(!modelRequest.includes(input.email))
```

```js
assert.ok(!modelRequest.includes(input.address))
```

```js
assert.equal(original.status, 200)
```

```js
assert.equal(Buffer.from(await original.arrayBuffer()).toString('base64'), png)
```

```js
assert.equal((await h.request(`/api/glove/files/${fileId}`, { as: '' })).status, 401)
```

```js
assert.equal((await h.request(endpoint + '/files/' + fileId, { as: '' })).status, 401)
```

```js
assert.equal((await h.request(`/api/glove/files/${fileId}`, { as: office.cookie })).status, 404)
```

```js
assert.equal(exported.files.filter(f => enquiry.photos.some(p => p.file.fileId === f.id)).length, 2)
```

```js
assert.equal((await h.request(`/api/glove/files/${fileId}`)).status, 404)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_files WHERE capture_id=?').bind(enquiry.id).first()).n, 0)
```

```js
assert.ok(!JSON.stringify((await h.state()).enquiries).includes(input.description))
```

```js
assert.ok(retained && !retained.description.includes(input.email), 'the newly supplied typed contact is redacted without deleting a peer request')
```

```js
assert.equal((await h.state()).customers.find(c => c.id === peer.id).name, peer.name)
```

```js
assert.ok(!external.includes(input.description))
```

```js
assert.ok(!external.includes(png))
```

### 32. tests/api/pipeline.test.mjs

Surviving registration: BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure

Original step: BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 failed verification, consent, origins and ambiguous matching persist no request; owner disable fences an in-flight submission

Assertion text count: 17; generated provider cases: 1.

```js
assert.equal((await send(h, request())).status, 400)
```

```js
assert.deepEqual(await durable(h), baseline)
```

```js
assert.equal((await send(h, { ...request(), consent: false })).status, 400)
```

```js
assert.equal((await send(h, request(), 'https://synthetic-glove-18.example.test')).status, 403)
```

```js
assert.deepEqual(await durable(h), baseline)
```

```js
assert.equal((await send(h, { ...request(), photos })).status, 400)
```

```js
assert.deepEqual(await durable(h), baseline)
```

```js
assert.equal(refused.status, 409)
```

```js
assert.deepEqual(await durable(h), ambiguous)
```

```js
assert.ok(!(await refused.text()).includes('synthetic-glove-19'))
```

```js
assert.equal((await send(h, freshInput)).status, 200)
```

```js
assert.ok(created)
```

```js
assert.equal(created.phone, freshInput.phone)
```

```js
assert.equal((await sending).status, 409)
```

```js
assert.deepEqual(await durable(h), disabled)
```

```js
assert.equal((await h.request(endpoint, { as: '' })).status, 404)
```

```js
assert.equal((await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='turnstile'").first()).n, 0)
```

### 33. tests/api/pipeline.test.mjs

Surviving registration: BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure

Original step: BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 only an unscoped owner enables provider-bound photo consent; model copies strip metadata and withdrawal excludes later calls

Assertion text count: 41; generated provider cases: 1.

```js
assert.equal((await (await h.request(endpoint, { as: '', headers: { origin: embed } })).json()).photoDisclosure, undefined)
```

```js
h.command('intake.configure', { version: (await h.state()).business[0].version, enabled: true, siteKey: 'synthetic-glove-11', allowedOrigins: [embed], ...terms, confirmNoTraining: false }, { error: 'PHOTO_TERMS' })
```

```js
assert.deepEqual(await durable(h), before)
```

```js
person.run('intake.configure', { version: (await h.state()).business[0].version, enabled: true, siteKey: 'synthetic-glove-11', allowedOrigins: [embed], ...terms }, { error: 'FORBIDDEN' })
```

```js
assert.ok(disclosure.text.includes('Synthetic model provider') && disclosure.text.includes('models.example.test'))
```

```js
assert.ok(!JSON.stringify(disclosure).includes(terms.noTrainingTerms), 'the provider contract is not published as sender disclosure')
```

```js
assert.equal(response.status, 200, await response.clone().text())
```

```js
h.command('quote.suggest', { enquiryId: noConsent.enquiry.id }, { error: 'MODEL' })
```

```js
assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string')
```

```js
h.command('quote.suggest', { enquiryId: enquiry.id }, { error: 'MODEL' })
```

```js
assert.equal(content.length, 2)
```

```js
assert.deepEqual(Object.keys(content[1]).sort(), ['image_url', 'type'])
```

```js
assert.ok(sent.length < Buffer.from(photo.base64, 'base64').length)
```

```js
assert.ok(!sent.includes(Buffer.from(photoMetadata)), `${photo.mediaType} model copy strips EXIF, GPS, XMP and text`)
```

```js
assert.equal(call.store, false)
```

```js
assert.ok(!wire.includes(excluded), 'no contact, identity, caption, file reference or address is added with model photos')
```

```js
assert.equal(Buffer.from(await (await h.request(`/api/glove/files/${file}`)).arrayBuffer()).toString('base64'), photo.base64, 'office original is unchanged')
```

```js
assert.equal((await h.request(`/api/glove/files/${file}`, { as: '' })).status, 401)
```

```js
office.run('intake.withdrawPhotos', { enquiryId: enquiry.id, version: enquiry.version, senderRequested: true, reason: 'Sender called' }, { error: 'FORBIDDEN' })
```

```js
limited.run('intake.withdrawPhotos', { enquiryId: enquiry.id, version: enquiry.version, senderRequested: true, reason: 'Sender called' }, { error: 'FORBIDDEN' })
```

```js
h.command('intake.withdrawPhotos', { enquiryId: enquiry.id, version: enquiry.version, senderRequested: false, reason: 'No sender request' }, { error: 'PHOTO_CONSENT' })
```

```js
assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string', 'a later call contains no withdrawn photo')
```

```js
assert.equal(Buffer.from(await (await h.request(`/api/glove/files/${file}`)).arrayBuffer()).toString('base64'), photo.base64)
```

```js
h.command('quote.suggest', { enquiryId: malformed.enquiry.id }, { error: 'PHOTO_METADATA' })
```

```js
assert.equal(h.models.calls.length, callsBeforeMalformed, 'an unsafe copy never falls back to sending the original')
```

```js
h.command('quote.suggest', { enquiryId: redirected.enquiry.id }, { error: 'MODEL' })
```

```js
assert.equal(refusal.details.status, 307, 'photo requests do not follow redirects to a different recipient')
```

```js
h.command('quote.suggest', { enquiryId: switchOff.enquiry.id }, { error: 'MODEL' })
```

```js
assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string', 'turning off the switch excludes existing consented photos')
```

```js
assert.equal((await send(h, stale)).status, 409)
```

```js
assert.deepEqual(await durable(h), baseline)
```

```js
assert.equal((await send(h, providerInput)).status, 200)
```

```js
assert.equal((await (await h.request(endpoint, { as: '', headers: { origin: embed } })).json()).photoDisclosure, undefined)
```

```js
h.command('quote.suggest', { enquiryId: providerRequest.id }, { error: 'MODEL' })
```

```js
assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string', 'provider changes cannot inherit consent')
```

```js
assert.equal((await send(h, delegatedInput)).status, 200)
```

```js
h.command('quote.suggest', { enquiryId: delegated.id }, { error: 'PHOTO_CONSENT_CHANGED' })
```

```js
h.command('quote.suggest', { enquiryId: delegated.id }, { error: 'PHOTO_CONSENT_CHANGED' })
```

```js
assert.equal(h.models.calls.length, beforeAuthority, 'loss of the configuring owner authority fences dispatch')
```

```js
assert.ok(exported.timeline.some(e => e.kind === 'intake.photoUseAuthorized'))
```

```js
assert.equal(exported.timeline.filter(e => e.kind === 'intake.photosWithdrawn').length, 3)
```

### 34. tests/api/privacy.test.mjs

Surviving registration: DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals

Original step: DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals

Assertion text count: 45; generated provider cases: 1.

```js
scopedOwner.run(type, { customerId: b.customer.id, version: b.customer.version, confirm: 'ERASE' }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await callback()).status, 200)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM rer_mail_event_states').first()).n, 1)
```

```js
person.run(type, { customerId: customer.id, version: customer.version, confirm: 'ERASE' }, { error: 'FORBIDDEN' })
```

```js
h.command('privacy.erase', { customerId: customer.id, version: customer.version }, { error: 'CONSENT' })
```

```js
assert.deepEqual(data.customerIds, [b.customer.id, duplicate.id].sort())
```

```js
assert.equal(data.records.invoices[0].id, inv.id)
```

```js
assert.ok(data.timeline.some(e => e.kind === 'customer.merged'))
```

```js
assert.ok(data.files.some(f => f.id === capture.file.fileId && f.bytes === jpeg))
```

```js
assert.ok(data.files.some(f => f.id === certificate.taxExemption.certificate.fileId && f.bytes === pdf))
```

```js
h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: stale.fingerprint }, { error: 'STALE_PREVIEW' })
```

```js
assert.deepEqual(result.customerIds, [b.customer.id, duplicate.id].sort())
```

```js
assert.equal(result.outcome, 'complete')
```

```js
assert.deepEqual(s.privacyRequests.map(r => r.action).sort(), ['erase', 'export'])
```

```js
assert.ok(s.customers.filter(c => result.customerIds.includes(c.id)).every(c => c.name === 'Erased customer' && !c.email && !c.taxExemption))
```

```js
assert.equal(s.customers.find(c => c.id === other.id).email, other.email)
```

```js
assert.deepEqual(kept.revisions[0].totals, inv.revisions[0].totals)
```

```js
assert.equal(kept.revisions[0].lines[0].description, 'Retained invoice line')
```

```js
assert.equal(s.serviceReports.length, 0)
```

```js
assert.equal(s.equipment.length, 0)
```

```js
assert.equal(s.messages.length, 0)
```

```js
assert.ok((await b.priyaPerson.state()).privacyFences.includes(visit.id))
```

```js
assert.ok(!(await b.tomPerson.state()).privacyFences.includes(visit.id))
```

```js
assert.equal((await h.request(`/api/glove/files/${unit.photos[0].fileId}`)).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/files/${earlierCertificate}`)).status, 404)
```

```js
assert.equal((await h.db.prepare(`SELECT count(*) AS n FROM ${table}`).first()).n, 0)
```

```js
assert.equal((await callback()).status, 200)
```

```js
assert.equal(JSON.stringify((await h.request('/api/glove/export').then(r => r.json())).timeline), beforeReplay)
```

```js
assert.equal(h.email.sent.length, 1)
```

```js
assert.equal(s.captures.length, 0)
```

```js
assert.equal(s.conversations.find(r => r.id === peerNote.id).text, 'Tenant needs a quote; [erased] recommended us.')
```

```js
assert.ok(s.conversations.some(r => r.text === 'Tenant keeps this note'))
```

```js
assert.ok(anonymized.length > 0)
```

```js
assert.ok(!anonymized.includes('privacy-' + createHash('sha256').update('synthetic-glove-22-event').digest('hex')))
```

```js
assert.ok(!anonymized.includes('synthetic-glove-22-event'))
```

```js
assert.equal((await h.request(`/api/glove/files/${capture.file.fileId}`)).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/files/${certificate.taxExemption.certificate.fileId}`)).status, 404)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_tax_certificate_chunks').first()).n, 0)
```

```js
assert.match(csv, /Erased customer/)
```

```js
assert.ok(!csv.includes('Harbourview'))
```

```js
assert.ok(!all.includes(value), `export does not retain ${value} in ${Object.entries(JSON.parse(all)).filter(([,v]) => JSON.stringify(v).includes(value)).map(([k]) => k).join(',')}`)
```

```js
assert.ok(!commands.includes('Harbourview Dental'))
```

```js
h.command('customer.unmerge', { mergeId: merged.id, version: merged.version }, { error: 'NOT_FOUND' })
```

```js
h.command('customer.save', { ...customer, name: 'Resurrected' }, { error: 'ERASED' })
```

```js
assert.rejects(h.db.prepare("UPDATE glove_events SET summary='changed'").run(), /append_only_timeline/)
```

### 35. tests/api/privacy.test.mjs

Surviving registration: DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals

Original step: DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 a trusted later erasure journal refuses an older backup and a new anonymous backup restores without certificate bytes

Assertion text count: 6; generated provider cases: 1.

```js
assert.ok(after.records[0].epoch > before.records[0].epoch)
```

```js
assert.rejects(restore(destination, before.records, { sourceIdentity: after.records[0].sourceIdentity, epoch: after.records[0].epoch, journal: after.records[0].journal }), /erasure_epoch/)
```

```js
assert.equal((await target.db.prepare('SELECT count(*) AS n FROM glove_tax_certificates').first()).n, 0)
```

```js
assert.equal((await target.db.prepare('SELECT count(*) AS n FROM glove_tax_certificate_chunks').first()).n, 0)
```

```js
assert.ok(!restored.includes('Harbourview Dental'))
```

```js
assert.ok(!restored.includes('synthetic-glove-4'))
```

### 36. tests/api/privacy.test.mjs

Surviving registration: DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals

Original step: DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 imported customer erasure removes retained source copies and shared originals without changing a peer customer

Assertion text count: 18; generated provider cases: 1.

```js
assert.ok(customer && peer)
```

```js
assert.ok(exported.importOriginals.length)
```

```js
assert.ok(exported.importOriginals.every(f => f.projection))
```

```js
assert.ok(!JSON.stringify(exported).includes('Synthetic Peer'))
```

```js
assert.ok(!JSON.stringify(exported).includes('synthetic-glove-7@example.test'))
```

```js
assert.match(projected, /Synthetic Imported/)
```

```js
assert.ok(!projected.includes('Synthetic Peer'))
```

```js
assert.ok(!projected.includes('synthetic-glove-7@example.test'))
```

```js
assert.ok(preview.sharedOriginals.some(a => a.name === 'synthetic-glove-5.csv' && a.peers === 1))
```

```js
assert.ok(preview.retiredBatches.some(b => b.jobId === batch.jobId && /cannot tombstone/.test(b.reason)))
```

```js
assert.equal(preview.peersAffected, 1)
```

```js
assert.equal(preview.counts.customers, 1)
```

```js
assert.deepEqual((await h.state()).customers.find(c => c.id === peer.id), peer)
```

```js
assert.ok(!rows.includes('Synthetic Imported'), `${table} has no erased name`)
```

```js
assert.ok(!rows.includes('synthetic-glove-6@example.test'), `${table} has no erased email`)
```

```js
assert.ok(!bytes.includes('Synthetic Imported'))
```

```js
assert.equal(current.status, 'privacy-withdrawn')
```

```js
assert.ok(peerExport.omissions.some(o => o.artifact === 'synthetic-glove-5.csv' && /withdrawn/.test(o.reason)))
```

### 37. tests/api/privacy.test.mjs

Surviving registration: DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals

Original step: DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 / MOVE-001, MOVE-007 / MOVE-003, MOVE-009 / MOVE-004, MOVE-010 erasing one provider customer keeps another provider with the same numeric source ID and journal intact

Assertion text count: 20; generated provider cases: 1.

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.equal(fp.source.id, st.source.id, 'both unrelated source accounts use customer ID 1')
```

```js
assert.ok(initialJobberExport.importOriginals.some(f => f.kind === 'attachment' && Buffer.from(f.bytes, 'base64').toString() === 'synthetic-glove-attachment\n'), 'customer export includes exact retained Jobber attachment bytes')
```

```js
assert.ok(exported.records.invoices.some(i => i.openingBalance.amount === '76.50'))
```

```js
assert.ok(exported.importCustody.length > 0)
```

```js
assert.ok(!JSON.stringify(exported).includes('Synthetic ServiceTitan Customer'))
```

```js
assert.equal(after.invoices.find(i => i.customerId === fp.id).openingBalance?.amount, '76.50', 'erasure preserves the anonymous imported balance')
```

```js
assert.deepEqual(after.customers.find(c => c.id === st.id), st)
```

```js
assert.deepEqual(after.customers.find(c => c.id === jobber.id), jobber)
```

```js
assert.deepEqual((await h.db.prepare('SELECT * FROM ik_sources WHERE job_id=? ORDER BY identity').bind(peerBatch.jobId).all()).results, peerSources, 'source IDs are scoped by namespace and kind')
```

```js
assert.ok(!JSON.stringify(await h.request('/api/glove/export').then(r => r.json())).includes('fp@example.test'))
```

```js
assert.ok(!(await h.state()).customers.some(c => c.id === st.id))
```

```js
assert.ok(jobberExport.importCustody.some(c => c.records.some(r => r.source.namespace === 'jobber')))
```

```js
assert.ok(jobberExport.records.invoices.some(i => i.openingBalance.amount === '76.50'))
```

```js
assert.ok(jobberExport.records.quotes.some(q => q.importedReadOnly && q.revisions[0].totals.total === '205.68'))
```

```js
assert.ok(jobberExport.records.captures.some(c => c.kind === 'source-visit' && c.importedVisitId === 'synthetic-glove-unscheduled'))
```

```js
assert.ok(jobberExport.records.captures.some(c => c.kind === 'note' && c.text === 'Synthetic Jobber job note'))
```

```js
assert.ok(jobberExport.importOriginals.some(f => f.kind === 'attachment') || jobberExport.omissions.some(o => o.sourceSha256 === createHash('sha256').update('synthetic-glove-attachment\n').digest('hex')), 'an attachment is exported or its missing original is explicitly reported')
```

```js
assert.ok(!JSON.stringify(await h.request('/api/glove/export').then(r => r.json())).includes('jobber@example.test'))
```

```js
assert.ok(!erasedExport.includes(value), 'erasure removes source quote, note, attachment and pending-visit content')
```

### 38. tests/api/privacy.test.mjs

Surviving registration: DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals

Original step: DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erasure tombstones one CSV customer while peers retain source projections and exact Undo

Assertion text count: 9; generated provider cases: 1.

```js
assert.deepEqual(preview.retiredBatches, [])
```

```js
assert.equal(preview.sharedOriginals[0].peers, 1)
```

```js
assert.equal(current.status, batch.status)
```

```js
assert.deepEqual(after.customers.find(c => c.id === peer.id), peer)
```

```js
assert.ok(exported.importOriginals.some(a => a.projection && Buffer.from(a.bytes, 'base64').toString().includes(peer.name)))
```

```js
assert.ok(exported.omissions.some(o => /withdrawn/.test(o.reason)))
```

```js
assert.ok(!JSON.stringify(exported).includes('synthetic-glove-24@example.test'))
```

```js
assert.ok(!undone.customers.some(c => c.id === peer.id))
```

```js
assert.equal(undone.customers.find(c => c.id === subject.id).name, 'Erased customer')
```

### 39. tests/api/quickbooks.test.mjs

Surviving registration: QuickBooks company discovery proposes imported customer, item and original invoice links without a write or a partial company review

Original step: QuickBooks company discovery proposes imported customer, item and original invoice links without a write or a partial company review

Assertion text count: 36; generated provider cases: 1.

```js
assert.deepEqual(['matched', 'ambiguous', 'unmatched'].map(group => customers.filter(p => p.group === group).length), [47, 1, 2])
```

```js
assert.equal(customers.filter(p => p.rule === 'name-and-contact').length, 48)
```

```js
assert.equal(items.filter(p => p.group === 'matched').length, 20)
```

```js
assert.equal(items.filter(p => p.rule === 'sku').length, 10)
```

```js
assert.equal(items.filter(p => p.rule === 'name').length, 10)
```

```js
assert.equal(invoices.filter(p => p.group === 'matched').length, 47)
```

```js
assert.ok(review.untouched.customers.some(r => r.id === '101' && r.subCustomer))
```

```js
assert.equal(review.choices.customer.find(r => r.id === '48').phone, '5125550048')
```

```js
assert.equal(review.choices.invoice.find(r => r.id === '501').total, 108.25)
```

```js
assert.equal(review.choices.service.find(r => r.id === '200').name, b.services[0].name)
```

```js
assert.ok(review.choices.customer.find(r => r.id === '101').subCustomer)
```

```js
assert.doesNotMatch(JSON.stringify(review), /SyncToken|IncomeAccountRef|synthetic-glove-901/)
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
```

```js
h.command('qbo.confirmLinks', { confirm: true }, { error: 'QBO_REVIEW' })
```

```js
assert.deepEqual(ambiguous.candidates.sort(), ['48', '99'])
```

```js
assert.equal((await discover()).proposals.find(p => p.id === ambiguous.id).rule, 'verified-company-link')
```

```js
assert.equal((await current(h, 'invoices', invoice.id)).qboSync.remoteId, '501', 'original number and total link despite partial opening balance')
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
```

```js
assert.equal(clash.group, 'unmatched')
```

```js
assert.deepEqual(clash.nameClashes, ['102'])
```

```js
assert.ok((await discover()).untouched.customers.some(r => r.id === '10999'))
```

```js
assert.ok(h.quickbooks.calls.some(r => r.entity === 'query' && !r.body))
```

```js
h.command('qbo.discover', {}, { error: 'QBO_DISCOVERY' })
```

```js
office.run('qbo.discover', {}, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.quickbooks.calls.length, reads)
```

```js
assertTrail(h, ['qbo.discovered', 'qbo.mapped'])
```

```js
assert.ok(trail.activity.some(e => e.kind === 'qbo.discovered'))
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-901|Provider-only property/)
```

```js
assert.equal(business.qbo.review, undefined, 'remote names are not retained in business settings')
```

```js
assert.equal(collision.proposals.find(p => p.id === duplicate.id).group, 'ambiguous')
```

```js
assert.equal(collision.proposals.find(p => p.id === customer.id).group, 'ambiguous')
```

```js
assert.equal(collision.proposals.find(p => p.id === invoice.id).group, 'unmatched', 'ambiguous customer never supplies a proposed invoice parent')
```

```js
assert.equal((await current(h, 'customers', customer.id)).qbo.connectionId, (await h.state()).business[0].qbo.connectionId)
```

```js
assert.notEqual((await h.state()).business[0].qbo.connectionId, review.connectionId)
```

```js
assert.ok(freshCompany.proposals.every(p => p.group === 'unmatched'), 'another company cannot reuse prior company facts or confirmations')
```

```js
h.command('qbo.confirmLinks', { confirm: true }, { error: 'QBO_REVIEW' })
```

### 40. tests/api/quickbooks.test.mjs

Surviving registration: QuickBooks company discovery proposes imported customer, item and original invoice links without a write or a partial company review

Original step: QuickBooks reviewed migration creates only two explicitly approved unmatched customers, links old invoices and posts later money once with locked confirmed links

Assertion text count: 36; generated provider cases: 1.

```js
h.command('qbo.createCustomer', { id: first.id, version: first.version }, { error: 'QBO_REVIEW' })
```

```js
h.command('qbo.createCustomer', { id: first.id, version: first.version, confirm: true }, { error: 'QBO_REVIEW' })
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
```

```js
assert.equal(created.phase, 'complete')
```

```js
assert.equal(customer.qbo.remoteId, created.remoteId)
```

```js
assert.equal(customer.qbo.confirmedBy, customer.qboCreate.approvedBy)
```

```js
assert.equal([...h.quickbooks.records.values()].filter(r => r.DisplayName === customer.name).length, 1)
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 2)
```

```js
assert.equal(proposal.group, 'matched')
```

```js
assert.ok(customer.qbo.confirmedAt)
```

```js
assert.equal(customer.qbo.confirmedBy, (await h.state()).business[0].qbo.linksConfirmedBy)
```

```js
assert.equal(sent.phase, 'complete')
```

```js
assert.equal(h.quickbooks.calls.find(r => r.entity === 'payment' && r.body).body.Line[0].LinkedTxn[0].TxnId, invoice.qbo.remoteId)
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.entity === 'payment' && r.body).length, 1)
```

```js
h.command('qbo.map', { kind: 'customer', id: customer.id, remoteId: '103' }, { error: 'QBO_LINK_USED' })
```

```js
assert.equal(retainedItem.group, 'matched')
```

```js
assert.equal(retainedItem.rule, 'verified-company-link')
```

```js
assert.equal(retainedItem.candidates[0], (await current(h, 'services', imported.services[0].id)).qbo.remoteId)
```

```js
h.command('qbo.map', { kind: 'invoice', id: invoice.id, remoteId: '999' }, { error: 'QBO_LINK_USED' })
```

```js
assert.equal(posted.phase, 'complete')
```

```js
assert.equal(writes.length, 1, 'no moved-in invoice is recreated')
```

```js
assert.equal(writes[0].body.CustomerRef.value, customer.qbo.remoteId)
```

```js
assert.equal(writes[0].body.TxnTaxDetail.TotalTax.toFixed(2), next.revisions.at(-1).totals.gst)
```

```js
assert.equal(writes[0].body.Line.at(-1).Amount.toFixed(2), next.revisions.at(-1).totals.discount.amount)
```

```js
assert.equal(writes[0].body.ApplyTaxAfterDiscount, true)
```

```js
assertTrail(h, ['qbo.discovered', 'qbo.creationApproved', 'qbo.complete', 'qbo.mapped', 'qbo.linksConfirmed', 'qbo.reserved', 'qbo.replayed'])
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-901/)
```

```js
assert.equal(refused.phase, 'rejected')
```

```js
assert.equal(unknown.phase, 'unknown')
```

```js
h.command('qbo.map', { kind: 'customer', id: extra.id, remoteId: remote.Id }, { error: 'QBO_UNCERTAIN' })
```

```js
assert.equal((await h.command('qbo.reconcile', { kind: 'customer', id: extra.id, remoteId: remote.Id })).phase, 'complete')
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, creationWrites)
```

```js
assert.equal((await current(h, 'customers', extra.id)).qbo.remoteId, remote.Id)
```

```js
office.run('qbo.createCustomer', { id: first.id, version: first.version, confirm: true }, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, writesBefore)
```

### 41. tests/api/quickbooks.test.mjs

Surviving registration: Xero complete company reads and reviewed existing links preserve two property invoice identities without writes or restored authority

Original step: Xero complete company reads and reviewed existing links preserve two property invoice identities without writes or restored authority

Assertion text count: 59; generated provider cases: 1.

```js
assert.deepEqual(review.contacts.map(r => r.id), Array.from({ length: 201 }, (_, i) => `synthetic-glove-contact-${i}`))
```

```js
assert.deepEqual(review.invoices.map(r => r.id), Array.from({ length: 100 }, (_, i) => `synthetic-glove-invoice-${i}`))
```

```js
assert.equal(review.items.length, 201)
```

```js
assert.deepEqual(readCalls.filter(r => r.path.endsWith('/Contacts')).map(r => new URLSearchParams(r.query).get('page')), ['1', '2', '3'])
```

```js
assert.deepEqual(readCalls.filter(r => r.path.endsWith('/Invoices')).map(r => new URLSearchParams(r.query).get('page')), ['1', '2'])
```

```js
assert.equal(readCalls.filter(r => r.path.endsWith('/Items')).length, 1)
```

```js
assert.ok(readCalls.every(r => r.method === 'GET' && r.tenant === tenant))
```

```js
assert.equal((await inspect(h, b.customer.id)).contacts.length, 201)
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
```

```js
h.command('xero.connect', { version: 0, tenant, token }, { error: 'STALE' })
```

```js
assert.equal(inspected.contacts.length, 2)
```

```js
assert.equal(inspected.items.length, 2)
```

```js
assert.equal(inspected.invoices.length, 2)
```

```js
assert.equal(inspected.invoices[0].amountDue, 80)
```

```js
assert.ok(!JSON.stringify(inspected).includes('excluded'))
```

```js
assert.ok(!JSON.stringify(savedInspections.results).includes(b.customer.name))
```

```js
b.agent.run('xero.connect', { tenant, token }, { error: 'FORBIDDEN' })
```

```js
b.office.run('xero.map', { kind: 'customer', id: b.customer.id, version: b.customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'FORBIDDEN' })
```

```js
b.agent.run('xero.confirmLinks', { confirm: true }, { error: 'FORBIDDEN' })
```

```js
b.office.run('xero.inspect', { customerId: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
limitedOwner.run('xero.map', { kind: 'customer', id: b.customer.id, version: b.customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'FORBIDDEN' })
```

```js
assert.equal(refusedToken.status, 403)
```

```js
assert.fail('unmapped company cannot be confirmed')
```

```js
assert.match(e.message, /XERO_REVIEW/)
```

```js
assert.fail('explicit review is required')
```

```js
assert.match(e.message, /XERO_REVIEW/)
```

```js
assert.equal(confirmed.confirmed, true)
```

```js
assert.deepEqual([a, z].map(r => state.invoices.find(i => i.id === r.id).xero.propertyId), [b.site.id, second.id])
```

```js
assert.ok([a, z].every(r => state.invoices.find(i => i.id === r.id).xero.contactId === 'synthetic-glove-contact-1'))
```

```js
assert.ok(state.invoices.filter(i => [a.id, z.id].includes(i.id)).every(i => i.xero.confirmedBy && i.xero.confirmedAt === '2026-11-01T12:00:00.000Z'))
```

```js
assert.fail('changed provider tax mapping must be refused')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.equal((await h.state()).business[0].xeroInspection.connectionId, connection)
```

```js
assert.ok((await h.state()).invoices.filter(i => [a.id, z.id].includes(i.id)).every(i => i.xero === null))
```

```js
assert.fail('dependent links must be reviewed again')
```

```js
assert.match(e.message, /XERO_REVIEW/)
```

```js
assertTrail(h, ['xero.connected', 'xero.mapped', 'xero.linksConfirmed'])
```

```js
assert.ok(trail.activity.some(e => e.kind === 'xero.mapped' && e.summary))
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-51|Bearer|excluded bank detail/)
```

```js
assert.ok(!JSON.stringify(await h.state()).includes(token))
```

```js
assert.ok(!JSON.stringify(trail).includes(tenant))
```

```js
assert.equal(JSON.parse(mappedEvent.data).remoteId, 'synthetic-glove-invoice-0')
```

```js
assert.ok(h.xero.calls.length > 0 && h.xero.calls.every(c => c.method === 'GET'))
```

```js
assert.equal((await h.state()).payments.length, 0)
```

```js
assert.ok(exportBody.result.download.includes('synthetic-glove-invoice-0'))
```

```js
assert.equal(erased.customers.find(r => r.id === customer.id).xero, undefined)
```

```js
assert.ok(erased.invoices.filter(i => [a.id, z.id].includes(i.id)).every(i => i.xero === undefined))
```

```js
h.command('xero.map', { kind: 'customer', id: customer.id, version: customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'ERASED' })
```

```js
assert.notEqual((await h.state()).business[0].xeroInspection.connectionId, connection)
```

```js
h.command('xero.inspect', { customerId: duplicate.id }, { error: 'XERO_PROVIDER' })
```

```js
h.command('xero.inspect', { customerId: duplicate.id }, { error: 'XERO_SETUP' })
```

```js
assert.equal((await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='xero'").first()).n, 0)
```

```js
assert.fail('new tenant requires fresh links')
```

```js
assert.match(e.message, /XERO_REVIEW/)
```

```js
h.command('xero.confirmLinks', { version: (await h.state()).business[0].version, confirm: true }, { error: 'XERO_SETUP' })
```

```js
assert.equal(h.xero.calls.length, calls)
```

### 42. tests/api/quickbooks.test.mjs

Surviving registration: Xero complete company reads and reviewed existing links preserve two property invoice identities without writes or restored authority

Original step: Xero owner inspects current contacts, items and sales invoices without writes, retained payloads or revived provider access

Assertion text count: 61; generated provider cases: 1.

```js
assert.fail('stale connect must fail')
```

```js
assert.match(e.message, /STALE/)
```

```js
b.agent.run('xero.connect', { tenant, token }, { error: 'FORBIDDEN' })
```

```js
b.office.run('xero.inspect', { customerId: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
assert.equal(connected.mode, 'read-only')
```

```js
assert.equal(result.ok, true)
```

```js
assert.deepEqual(review.contacts, [{ id: 'synthetic-glove-contact-1', name: 'Synthetic Customer', email: 'synthetic@example.test' }])
```

```js
assert.equal(review.items.length, 1)
```

```js
assert.equal(review.invoices.length, 1)
```

```js
assert.equal(review.invoices[0].amountDue, 80)
```

```js
assert.ok(!JSON.stringify(review).includes('excluded'))
```

```js
assert.ok(h.xero.calls.every(c => c.method === 'GET' && c.tenant === tenant && c.authorization === `Bearer ${token}`))
```

```js
assertTrail(h, ['xero.connected', 'xero.inspected'])
```

```js
assert.ok(!serialized.includes(tenant))
```

```js
assert.ok(!serialized.includes(token))
```

```js
assert.ok(!serialized.includes('excluded bank detail'))
```

```js
assert.ok(!JSON.stringify(commands.results).includes('synthetic@example.test'), 'inspection bodies are not saved command outcomes')
```

```js
assert.equal((await h.state()).business[0].xeroInspection.connectionId, connection)
```

```js
assert.equal(h.xero.calls.at(-1).authorization, 'Bearer synthetic-glove-2', 'replacement uses the distinct new token')
```

```js
assert.equal(inspectedEvent.actorRole, 'owner')
```

```js
assert.equal(inspectedEvent.subjectId, b.customer.id)
```

```js
h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
```

```js
h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
assert.deepEqual(paginated.contacts.map(row => row.id), Array.from({ length: 101 }, (_, i) => `synthetic-glove-list-${i}`))
```

```js
assert.ok(h.xero.calls.some(call => call.path.endsWith('/Contacts') && call.page === '2'))
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
```

```js
b.office.run('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'FORBIDDEN' })
```

```js
b.agent.run('xero.confirmLinks', { confirm: true }, { error: 'FORBIDDEN' })
```

```js
limitedOwner.run('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'FORBIDDEN' })
```

```js
assert.equal(refusedToken.status, 403)
```

```js
assert.equal(h.xero.calls.length, beforeMap)
```

```js
h.command('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'XERO_MAPPING' })
```

```js
assert.equal((await current(h, 'customers', b.customer.id)).xeroLink, undefined)
```

```js
assert.equal((await current(h, 'customers', b.customer.id)).xeroLink.remoteId, contactId)
```

```js
h.command('xero.map', { kind: 'customer', id: duplicate.id, remoteId: contactId }, { error: 'XERO_MAPPING' })
```

```js
h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_REVIEW' })
```

```js
h.command('xero.map', { kind: 'invoice', id: invoice.id, remoteId: invoiceId }, { error: 'XERO_MAPPING' })
```

```js
h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_MAPPING' })
```

```js
assert.ok(!(await h.state()).business[0].xeroInspection.linksConfirmedAt)
```

```js
assert.equal((await h.command('xero.confirmLinks', { confirm: true })).confirmed, true)
```

```js
assert.equal(linked.xeroLink.confirmedBy, inspectedEvent.actorId)
```

```js
assert.equal(linked.xeroLink.confirmedAt, '2026-11-01T12:00:00.000Z')
```

```js
assert.equal((await current(h, 'invoices', invoice.id)).xeroLink.remoteId, invoiceId)
```

```js
assertTrail(h, ['xero.mapped', 'xero.linksReviewed'])
```

```js
assert.ok(mappingTrail.activity.some(e => e.kind === 'xero.mapped' && e.subjectId === b.customer.id && e.summary.includes(contactId)))
```

```js
assert.ok(h.xero.calls.every(c => c.method === 'GET'), 'mapping and confirmation never post to Xero')
```

```js
assert.equal(officeState.customers.find(row => row.id === b.customer.id).xeroLink, undefined)
```

```js
assert.ok(!officeState.events.some(event => event.kind.startsWith('xero.')))
```

```js
assert.equal(officeExport.invoices.find(row => row.id === invoice.id).xeroLink, undefined)
```

```js
assert.ok(!officeExport.timeline.some(event => event.kind.startsWith('xero.')))
```

```js
assert.equal((await h.state()).business[0].xeroInspection.linksConfirmedAt, null)
```

```js
assert.equal((await current(h, 'customers', b.customer.id)).xeroLink.connectionId, (await h.state()).business[0].xeroInspection.connectionId)
```

```js
assert.notEqual((await h.state()).business[0].xeroInspection.connectionId, connection)
```

```js
h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_REVIEW' })
```

```js
h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_SETUP' })
```

```js
assert.equal((await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='xero'").first()).n, 0)
```

```js
h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_SETUP' })
```

```js
h.command('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'XERO_SETUP' })
```

```js
h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_SETUP' })
```

```js
assert.equal(h.xero.calls.length, calls, 'restored domain history without provider credentials grants no read access')
```

### 43. tests/api/quickbooks.test.mjs

Surviving registration: Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts

Original step: Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts

Assertion text count: 37; generated provider cases: 1.

```js
h.command('role.save', { name: 'Accounting delegate', permissions: ['xero.sync'] }, { error: 'INPUT' })
```

```js
b.office.run('xero.sync', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
b.agent.run('xero.reconcile', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
limited.run('xero.sync', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 0)
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 0)
```

```js
assert.equal(customer.phase, 'complete')
```

```js
assert.equal((await h.command('xero.sync', customerPayload, { commandId: customerCommandId })).remoteId, customer.remoteId)
```

```js
assert.equal(h.xero.data.Contacts[0].Name, b.customer.name)
```

```js
assert.equal(rejected.phase, 'rejected')
```

```js
assert.match(rejected.message, /Income account is inactive/)
```

```js
assert.ok(!rejected.message.includes(token))
```

```js
assert.equal((await xeroSync(h, 'service', b.service.id)).phase, 'complete')
```

```js
assert.equal(h.xero.data.Items[0].Description, 'Repaired sales item')
```

```js
assert.deepEqual([invoice.revisions.at(-1).totals.total, invoice.revisions.at(-1).totals.gst], ['166.17', '12.66'])
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, beforeDraft)
```

```js
assert.equal(posted.phase, 'complete')
```

```js
assert.equal(transport.Contact.ContactID, 'synthetic-glove-contact-1')
```

```js
assert.equal(transport.Reference, `Property ${b.site.address}`)
```

```js
assert.equal(transport.LineItems[0].Description, invoice.revisions.at(-1).lines[0].description + ' reviewed')
```

```js
assert.deepEqual(transport.LineItems.map(l => [l.LineAmount, l.DiscountAmount ?? 0, l.TaxAmount]), [[153.51, 35.49, 12.66], [0, 30.3, 0]])
```

```js
assert.deepEqual([transport.Date, transport.DueDate], ['2026-11-01', '2026-11-15'])
```

```js
assert.equal(h.xero.data.Invoices[0].Total, 166.17)
```

```js
assert.equal((await xeroSync(h, kind, id)).phase, 'complete')
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, writes)
```

```js
assert.ok(h.xero.calls.filter(r => r.body).every(r => r.idempotencyKey))
```

```js
assert.equal(unknown.phase, 'unknown')
```

```js
assert.equal(recovered.phase, 'complete')
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, before)
```

```js
h.command('xero.map', { kind: 'customer', id: b.customer.id, version: (await current(h, 'customers', b.customer.id)).version, remoteId: 'synthetic-glove-contact-1' }, { error: 'XERO_LOCKED' })
```

```js
assertTrail(h, ['xero.reserved', 'xero.complete', 'xero.rejected', 'xero.unknown', 'xero.reconciled', 'xero.replayed'])
```

```js
assert.ok(trail.activity.some(e => e.kind === 'xero.complete' && e.summary.includes(posted.remoteId)))
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-51|Bearer|00000000-0000-4000-8000-000000000001/)
```

```js
assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_xero_operations WHERE record_id IN (?,?)').bind(c.id, invoice.id).first('n'), 0)
```

```js
h.command('xero.sync', customerPayload, { commandId: customerCommandId, error: 'ERASED' })
```

```js
assert.equal(h.xero.calls.length, beforeReplay)
```

```js
assert.doesNotMatch(saved, /synthetic-glove-contact-1|operationId|connectionId/)
```

### 44. tests/api/quickbooks.test.mjs

Surviving registration: Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts

Original step: Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations

Assertion text count: 26; generated provider cases: 1.

```js
assert.ok(posted.every(p => p.phase === 'complete'))
```

```js
b.office.run('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'FORBIDDEN' })
```

```js
h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' })
```

```js
h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' })
```

```js
h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_MAPPING' })
```

```js
h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' })
```

```js
assert.equal((await h.state()).payments.length, 0)
```

```js
assert.equal(payment.amount, '409.18')
```

```js
assert.equal(payment.xeroImported.bankReconciled, false)
```

```js
assert.equal(payment.fee, null)
```

```js
assert.deepEqual(payment.effects.map(e => [e.invoiceId, e.amountCents, e.taxTotalAmount]), [[a.id, 20459, '204.59'], [z.id, 20459, '204.59']])
```

```js
assert.equal((await h.state()).payments.length, 1)
```

```js
h.command('xero.pull', { paymentIds: [paymentIds[0]], reference: 'Parent remittance', amountCents: 20459 }, { error: 'XERO_PAYMENT_CHANGED' })
```

```js
h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' })
```

```js
assert.equal(tax.jurisdictions.reduce((n, j) => n + Math.round(Number(j.tax) * 100), 0), 3118)
```

```js
assert.equal(receiptDay.jurisdictions.reduce((n, j) => n + Math.round(Number(j.tax) * 100), 0), 3118)
```

```js
assert.deepEqual(importDay.jurisdictions, [])
```

```js
assert.deepEqual(receivables.customers, [])
```

```js
assert.equal(payment.createdAt, '2026-12-01T12:00:00.000Z')
```

```js
assert.ok(entries.some(e => e.kind === 'payment' && e.label === `Xero payment Parent remittance for ${invoice.number}: $204.59`))
```

```js
h.command('payment.refund', { invoiceId: a.id, version: (await current(h, 'invoices', a.id)).version, paymentId: payment.id, paymentVersion: payment.version, amount: '1.00', reason: 'Xero refund' }, { error: 'XERO_REFUND_STATE' })
```

```js
h.command('payment.receipt', { paymentId: payment.id, version: payment.version }, { error: 'XERO_RECEIPT_STATE' })
```

```js
assert.equal(staff.status, 200)
```

```js
assert.doesNotMatch(await staff.text(), /synthetic-glove-payment-|synthetic-glove-invoices-|bankReconciled|xeroSync|"xero":/)
```

```js
assertTrail(h, ['xero.paymentImported', 'xero.paymentReplayed'])
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-51|Bearer/)
```

### 45. tests/api/quickbooks.test.mjs

Surviving registration: Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts

Original step: Xero durable reservation refuses a concurrent send and a different tenant, then retains same-tenant recovery after disconnect

Assertion text count: 11; generated provider cases: 1.

```js
assert.fail('unresolved tenant must stay pinned')
```

```js
assert.match(e.message, /XERO_TENANT/)
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 1)
```

```js
assert.equal((await pending).phase, 'complete')
```

```js
assert.equal((await h.state()).business[0].xeroInspection.connectionId, connectionId)
```

```js
assert.equal((await xeroSync(h, 'customer', b.customer.id)).phase, 'complete')
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 1)
```

```js
assert.deepEqual([denied.riskClass, denied.decision, denied.allowed], ['provider-write', 'block', false])
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 1, 'policy withdrawal before send makes no new provider write')
```

```js
assertTrail(h, ['company.actionPolicy'])
```

```js
assert.ok(trail.exported.timeline.some(e => e.kind === 'company.actionPolicy' && JSON.parse(e.data).decision === 'block'))
```

### 46. tests/api/quickbooks.test.mjs

Surviving registration: Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts

Original step: Xero records an authorized in-flight provider fact after Owner withdrawal and refuses the next send

Assertion text count: 4; generated provider cases: 1.

```js
assert.equal(outcome.phase, 'complete')
```

```js
other.run('xero.sync', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 1)
```

```js
assert.equal(state.customers.find(c => c.id === b.customer.id).xeroSync.remoteId, 'synthetic-glove-contact-1')
```

### 47. tests/api/quickbooks.test.mjs

Surviving registration: Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts

Original step: Xero erasure during a provider response discards late personal outcomes and durable reservations

Assertion text count: 5; generated provider cases: 1.

```js
assert.equal(outcome.phase, 'unknown')
```

```js
assert.equal(outcome.remoteId, undefined)
```

```js
assert.equal(state.customers.find(c => c.id === b.customer.id).xeroSync, undefined)
```

```js
assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_xero_operations WHERE record_id=?').bind(b.customer.id).first('n'), 0)
```

```js
assert.ok(!JSON.stringify(exported).includes(b.customer.name))
```

### 48. tests/api/quote-link-custody.test.mjs

Surviving registration: QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart

Original step: QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart

Assertion text count: 28; generated provider cases: 1.

```js
assert.match(link.token, /^glq_[A-Za-z0-9_-]{43}$/)
```

```js
assert.equal(Buffer.from(link.token.slice(4), 'base64url').length, 32)
```

```js
assert.deepEqual(secrets, [{ link_id: link.id, hash: createHash('sha256').update(`glove-quote-link:${link.token}`).digest('hex') }])
```

```js
assert.ok(sent, 'the provider edge actually receives the quote email')
```

```js
assert.equal(url.pathname, '/quote')
```

```js
assert.equal(url.search, '')
```

```js
assert.equal(url.hash, `#token=${link.token}`)
```

```js
assert.equal(mail.replace(url.href, '').includes(link.token), false, 'the email carries the bearer only in its fragment')
```

```js
assert.equal((await read(h, link.token)).status, 200)
```

```js
assert.equal((await h.request(path, { as: '', ...options })).status, 404, 'non-header credential does not open the public door')
```

```js
assert.equal(bodyToken.status, 400, 'even an authorized request refuses a body credential')
```

```js
assert.deepEqual(await exportBusiness(h), before, 'refused credentials change no business data')
```

```js
assert.equal((await respond(h, link.token, 'changes', { message: 'Please confirm access with reception.' })).status, 200)
```

```js
assert.equal(replay.token, undefined)
```

```js
assert.equal(replay.id, link.id)
```

```js
assert.equal(h.email.sent.length, sentCount, 'issuance replay sends no second email')
```

```js
assert.deepEqual(await exportBusiness(h), persisted)
```

```js
assert.equal((await read(h, link.token)).status, 200, 'only restart, rather than restore, retains the issued credential')
```

```js
assertTrail(h, ['quote.linkIssued', 'quote.customer.changes'])
```

```js
assert.deepEqual([event.actorName, event.actorRole, event.commandId, event.at], ['Olivia Owner', 'owner', commandId, at])
```

```js
assert.ok(h.logs.length, 'Worker log capture is active')
```

```js
assert.equal((await read(h, link.token)).status, 404)
```

```js
assert.equal((await read(h, replacement.token)).status, 200)
```

```js
assert.equal((await read(h, replacement.token)).status, 404)
```

```js
assert.equal(revokedReplay.token, undefined)
```

```js
assert.equal(h.email.sent.length, emailsBeforeReplay)
```

```js
assert.deepEqual(await exportBusiness(h), revokedSnapshot, 'a captured issuance cannot recreate a revoked link')
```

```js
assert.equal((await respond(h, replacement.token, 'decline')).status, 404, 'replay cannot revive revoked authority')
```

### 49. tests/api/quote-link-custody.test.mjs

Surviving registration: QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart

Original step: QUOTE-009 superseded links disclose no document and refuse every customer action across restart

Assertion text count: 8; generated provider cases: 1.

```js
assert.equal(response.status, 200)
```

```js
assert.deepEqual(view, { state: 'superseded', message: 'A newer revision was sent. Ask the business for its current link.' })
```

```js
assert.equal(refused.status, 409, action)
```

```js
assert.deepEqual((await refused.json()).error, { code: 'REVISION', message: view.message })
```

```js
assert.deepEqual(await exportBusiness(h), before, 'superseded requests record no decision or data change')
```

```js
assert.equal(live.state, 'open')
```

```js
assert.equal(live.document.revision, 2)
```

```js
assertTrail(h, ['quote.revised', 'quote.linkIssued'])
```

### 50. tests/api/quote-link-custody.test.mjs

Surviving registration: QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart

Original step: QUOTE-009 expired revisions remain readable with exactly one update until the link expiry instant

Assertion text count: 26; generated provider cases: 1.

```js
assert.equal(view.state, 'expired')
```

```js
assert.equal(view.documentHash, first.documentHash)
```

```js
assert.equal(view.updateRequested, false)
```

```js
assert.equal(response.status, 409)
```

```js
assert.equal((await response.json()).error.code, 'EXPIRED')
```

```js
assert.equal(response.status, 200)
```

```js
assert.equal((await response.json()).updateRequested, true)
```

```js
assert.equal((await respond(h, first.token, 'update')).status, 200)
```

```js
assert.equal(record.customerRequests.filter(x => x.revision === 1 && x.action === 'update').length, 1)
```

```js
assert.equal(state.notices.filter(n => n.quoteId === q.id).length, 1)
```

```js
assert.equal(state.enquiries.find(e => e.id === enquiry.id).status, 'contacted')
```

```js
assert.equal((await read(h, first.token)).status, 404)
```

```js
assert.equal((await (await read(h, reissued.token)).json()).updateRequested, true, 'reissuing a link cannot reset the revision update request')
```

```js
assert.equal((await respond(h, reissued.token, 'update')).status, 200)
```

```js
assert.equal((await quote(h, q.id)).customerRequests.length, 1)
```

```js
assert.equal(view.state, 'expired')
```

```js
assert.equal(view.updateRequested, false)
```

```js
assert.equal((await respond(h, next.token, 'update')).status, 200, 'a later revision gets its own single request at the last live instant')
```

```js
assert.equal((await read(h, next.token)).status, 404)
```

```js
assert.equal((await respond(h, next.token, 'update')).status, 404)
```

```js
assert.equal((await read(h, next.token)).status, 404)
```

```js
assert.deepEqual(record.customerRequests.map(x => [x.revision, x.action]), [[1, 'update'], [2, 'update']])
```

```js
assert.equal(state.notices.filter(n => n.quoteId === q.id).length, 2)
```

```js
assertTrail(h, ['quote.customer.update'])
```

```js
assert.equal(activity.filter(e => e.kind === 'quote.customer.update').length, 2)
```

```js
assert.equal(exported.timeline.filter(e => e.kind === 'quote.customer.update').length, 2)
```

### 51. tests/api/quote-link-custody.test.mjs

Surviving registration: QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart

Original step: QUOTE-009 owner validity boundaries and default changes affect only later revisions

Assertion text count: 14; generated provider cases: 1.

```js
assert.equal(original.validUntil, '2030-03-31', 'Sydney March 1 plus the untouched 30-day default')
```

```js
person.run('quote.validity', { days: 5 }, { error: 'FORBIDDEN' })
```

```js
h.command('quote.validity', { days }, { error: 'INPUT' })
```

```js
assert.deepEqual(await exportBusiness(h), before)
```

```js
assert.equal(denied.status, 403)
```

```js
assert.equal((await denied.json()).error.code, 'FORBIDDEN')
```

```js
assert.equal(next.revisions[0].validUntil, validUntil)
```

```js
assert.deepEqual((await quote(h, q.id)).revisions[0], original)
```

```js
assert.deepEqual((await h.state()).quoteLinks.find(l => l.id === link.id), Object.fromEntries(Object.entries(link).filter(([k]) => k !== 'token')))
```

```js
assert.deepEqual(q.revisions[0], original)
```

```js
assert.equal(q.revisions[1].validUntil, '2030-03-02')
```

```js
assert.deepEqual(await h.command('quote.revise', payload, { commandId }), q)
```

```js
assert.equal((await h.state()).business[0].quoteValidityDays, 1)
```

```js
assertTrail(h, ['quote.validity', 'quote.revised'])
```

### 52. tests/api/quote-link-custody.test.mjs

Surviving registration: QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart

Original step: QUOTE-009 real dates and frozen Chicago midnight govern approval and the ninety-day reading window

Assertion text count: 16; generated provider cases: 1.

```js
h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Impossible date', lines, validUntil: '2026-02-30' }, { error: 'INPUT' })
```

```js
assert.deepEqual(await exportBusiness(h), before)
```

```js
h.command('quote.revise', { quoteId: first.id, version: first.version, lines, validUntil: '2026-02-30' }, { error: 'INPUT' })
```

```js
assert.equal((await h.state()).business[0].timezone, 'Australia/Sydney')
```

```js
assert.deepEqual([q.revisions[0].validUntil, q.revisions[0].validityZone, q.revisions[0].validTo, q.revisions[0].linkExpiresAt], ['2030-02-28', 'America/Chicago', '2030-03-01T06:00:00.000Z', '2030-05-30T05:00:00.000Z'])
```

```js
assert.equal((await (await read(h, live.token)).json()).state, 'open')
```

```js
assert.equal((await respond(h, live.token, 'approve', answer)).status, 200, 'approval succeeds at the last Chicago instant of the validity date')
```

```js
assert.equal((await quote(h, first.id)).acceptance.signing.at, '2030-03-01T05:59:59.999Z')
```

```js
assert.equal((await expired.json()).state, 'expired')
```

```js
assert.equal(refused.status, 409)
```

```js
assert.equal((await refused.json()).error.code, 'EXPIRED')
```

```js
assert.equal((await read(h, expiring.token)).status, 200, 'DST-adjusted midnight, rather than ninety UTC days, ends the reading window')
```

```js
assert.equal((await read(h, token)).status, 404)
```

```js
assert.equal((await respond(h, token, 'update')).status, 404)
```

```js
assert.deepEqual(await exportBusiness(h), snapshot, 'expiry refuses without data changes')
```

```js
assertTrail(h, ['quote.customer.approve', 'quote.consentAccepted'])
```

### 53. tests/api/quote-link-custody.test.mjs

Surviving registration: QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart

Original step: QUOTE-009 pre-validity Worker upgrade requires revision and fresh price approval before issuing a link

Assertion text count: 11; generated provider cases: 1.

```js
assert.ok(source.includes(addition), 'the era build removes the actual validity addition')
```

```js
assert.equal(old.revisions[0].validUntil, undefined)
```

```js
assert.deepEqual(await exportBusiness(h), before, 'upgrade preserves the actual earlier-build revision')
```

```js
assert.equal((await h.state()).quoteLinks.length, 0)
```

```js
assert.deepEqual(revised.revisions[0], old.revisions[0])
```

```js
assert.equal(revised.revisions[1].validUntil, '2030-03-31')
```

```js
assert.deepEqual(await h.command('quote.revise', payload, { commandId }), revised)
```

```js
assert.deepEqual(await exportBusiness(h), persisted)
```

```js
assert.equal(view.document.revision, 2)
```

```js
assert.equal(view.documentHash, link.documentHash)
```

```js
assertTrail(h, ['quote.revised', 'quote.approved', 'quote.linkIssued'])
```

### 54. tests/api/recurring-billing.test.mjs

Surviving registration: PLAN-005, PLAN-012, PLAN-013 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks

Original step: PLAN-005, PLAN-012, PLAN-013 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks

Assertion text count: 59; generated provider cases: 1.

```js
person.run(type, payload, { error })
```

```js
assert.deepEqual(await snapshot(), before, `${error} leaves every financial record and Activity unchanged`)
```

```js
assert.equal(response.status, 200, await response.clone().text())
```

```js
assert.equal(invoice.recurring.periodEnd, '2025-10-31')
```

```js
assert.equal(invoice.dates, undefined)
```

```js
assert.equal(invoice.approvalAt, undefined)
```

```js
assert.equal(invoice.revisions[0].approval, null)
```

```js
assert.deepEqual(invoice.dates, lateDates)
```

```js
assert.deepEqual(invoice.approvalAt, { ...office, at: '2025-11-03T18:00:00.000Z' })
```

```js
assert.deepEqual(invoice.revisions[0].approval, invoice.approvalAt)
```

```js
assert.deepEqual([invoice.dates.issuedOn, invoice.dates.dueOn, invoice.dates.approvedOn], ['2025-10-31', '2025-11-17', '2025-11-03'])
```

```js
assert.equal(invoice.approvalAt.at, '2025-11-03T18:00:00.000Z')
```

```js
assert.equal(await aging('2025-11-02'), undefined)
```

```js
assert.equal((await aging(date)).bucket, bucket)
```

```js
assert.equal(revenue.total.revenue, '240.00')
```

```js
assert.equal(revenue.approvedAfterPeriodEnd[0].invoiceId, invoice.id)
```

```js
assert.equal(tax.jurisdictions[0].tax, '24.00')
```

```js
assert.equal(tax.approvedAfterPeriodEnd[0].issuedOn, '2025-10-31')
```

```js
assert.ok(csv.includes('10/31/2025,11/17/2025'))
```

```js
assert.deepEqual([qbo.TxnDate, qbo.DueDate], ['2025-10-31', '2025-11-17'])
```

```js
assert.equal(csv, expectedCsv, 'the entire downloaded monthly accounting record uses the period end and frozen due date')
```

```js
assert.deepEqual(revenue.approvedAfterPeriodEnd, [{ invoiceId: invoice.id, number: 'INV-0002', issuedOn: '2025-10-31', approvedOn: '2025-11-03', dueOn: '2025-11-17', label: 'approved after period end' }])
```

```js
assert.deepEqual(tax.approvedAfterPeriodEnd, revenue.approvedAfterPeriodEnd)
```

```js
assert.deepEqual(qbo, {
    CustomerRef: { value: '1' }, CurrencyRef: { value: 'USD' }, DocNumber: 'INV-0002', TxnDate: '2025-10-31', DueDate: '2025-11-17',
    BillAddr: { Line1: '' }, ShipAddr: { Line1: '120 Main Street, Austin TX 78701' },
    PrivateNote: 'Glove INV-0002 revision 1; J-1002; Local sales tax (10%)',
    Line: [{ LineNum: 1, Description: 'Preventive maintenance', Amount: 240, DetailType: 'SalesItemLineDetail', SalesItemLineDetail: { ItemRef: { value: '2' }, Qty: 1, UnitPrice: 240, TaxCodeRef: { value: 'TAX' } } }],
    TxnTaxDetail: { TxnTaxCodeRef: { value: '3' }, TotalTax: 24 },
  })
```

```js
assert.deepEqual(corrected.revisions[0], original)
```

```js
assert.deepEqual(corrected.approvalAt, { ...office, at: '2025-11-03T18:00:00.000Z' }, 'the first approval is retained separately from correction approval')
```

```js
assert.deepEqual(corrected.revisions[1].approval, { ...owner, at: '2025-11-11T05:30:00.000Z' })
```

```js
assert.deepEqual((await h.state()).invoices.find(i => i.id === invoice.id).dates, dates)
```

```js
assert.deepEqual([after.TxnDate, after.DueDate], [qbo.TxnDate, qbo.DueDate])
```

```js
assert.equal(await download(`/api/glove/exports/${correctionExport.id}.csv`), expectedCorrectionCsv)
```

```js
assert.equal(await download(`/api/glove/exports/${exported.id}.csv`), expectedCsv, 'later correction and export leave original output unchanged')
```

```js
assert.deepEqual((await h.state()).invoices.find(i => i.id === invoice.id).dates, lateDates)
```

```js
assert.deepEqual(approved.dates, { issuedOn: '2025-11-30', dueOn: '2025-12-14', termsDays: 14, basis: 'fixed monthly period end; terms frozen at first approval', approvedOn: '2025-11-30', approvedAfterPeriodEnd: false })
```

```js
assert.deepEqual(approved.approvalAt, { ...office, at: '2025-12-01T05:30:00.000Z' }, 'UTC December 1 is still November 30 in the business zone')
```

```js
assert.deepEqual(approved.revisions[0].approval, approved.approvalAt)
```

```js
assert.equal(approved.dates.issuedOn, '2025-11-30')
```

```js
assert.equal(approved.dates.dueOn, '2025-12-14')
```

```js
assert.equal(await h.request(`/api/glove/exports/${oldExport.id}.csv`).then(r => r.text()), oldCsv)
```

```js
assert.deepEqual(await h.request(oldDoor).then(r => r.json()), oldQbo)
```

```js
assert.deepEqual((await h.state()).invoices.find(i => i.id === oldInvoice.id).dates, oldInvoice.dates)
```

```js
assert.deepEqual((await h.state()).invoices.find(i => i.id === oldInvoice.id), retainedOld)
```

```js
assert.deepEqual(await snapshot(), retained, 'ordinary and monthly revisions, dates, decisions and exports survive a real Worker restart')
```

```js
assert.equal(await download(`/api/glove/exports/${id}.csv`), expected)
```

```js
assert.deepEqual(await h.request(oldDoor).then(r => r.json()), oldQbo)
```

```js
assert.deepEqual(await h.request(qboDoor).then(r => r.json()), after)
```

```js
assertTrail(h, ['invoice.prepared', 'invoice.approved', 'invoice.corrected', 'invoice.exported'])
```

```js
assert.equal(event.length, 1)
```

```js
assert.deepEqual([event[0].kind, event[0].actorId, event[0].actorName, event[0].actorRole, event[0].at, event[0].subjectId], ['invoice.approved', recorder.id, recorder.name, recorder.role, at, id])
```

```js
assert.match(event[0].summary, new RegExp(`revision ${revision} approved by`))
```

```js
assert.equal(kept.length, 1)
```

```js
assert.deepEqual([kept[0].id, kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].at, kept[0].subject_id], [event[0].id, recorder.id, recorder.name, recorder.role, at, id])
```

```js
assert.deepEqual(businessExport.invoices, retained.invoices.map(({ reminderState: _liveReminderLabel, ...record }) => record))
```

```js
assert.deepEqual(businessExport.approvals, retained.approvals)
```

```js
assert.deepEqual(await snapshot(), retained, 'report, payload, Activity and business-export reads have no financial effect')
```

```js
assert.deepEqual(retained.payments, [])
```

```js
assert.equal(h.stripePayments.calls.filter(c => c.method === 'POST').length, 0)
```

```js
assert.equal(h.quickbooks.calls.filter(c => c.method === 'POST').length, 0)
```

```js
assert.equal(h.email.sent.length, 0)
```

```js
assert.equal(h.twilio.calls.length, 0)
```

### 55. tests/api/recurring-billing.test.mjs

Surviving registration: PLAN-005, PLAN-012, PLAN-013 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks

Original step: PLAN-005, PLAN-012, PLAN-013 three months produce exactly three per-visit drafts with their own materials and three fixed monthly drafts, with skips and concurrent replay

Assertion text count: 19; generated provider cases: 1.

```js
b.dispatcher.run('series.billing', { jobId: perVisit.id, version: perVisit.version, from: '2025-01-01', billing: { mode: 'per-visit' }, reason: 'Price authority refused' }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await b.office.run('series.billingRun', {}, { commandId }), first)
```

```js
assert.equal(each.length, 3)
```

```js
assert.equal(monthly.length, 3)
```

```js
assert.deepEqual(visits.map(v => each.find(i => i.recurring.visitId === v.id).revisions[0].totals.total), ['57.00', '64.00', '71.00'])
```

```js
assert.ok(!each.some(i => i.recurring.visitId === skipped.id))
```

```js
assert.deepEqual(monthly.map(i => [i.recurring.proposedIssuedOn, i.revisions[0].totals.total]), [['2025-01-31', '240.00'], ['2025-02-28', '240.00'], ['2025-03-31', '240.00']])
```

```js
assert.equal(new Set(s.invoices.map(i => i.recurring.key)).size, 6)
```

```js
assert.ok(s.invoices.every(i => i.status === 'draft' && !i.revisions[0].approval && !i.dates))
```

```js
assert.equal((await h.request('/api/glove/reports/revenue.json?from=2025-01-01&to=2025-03-31').then(r => r.json())).total.revenue, '0.00')
```

```js
assert.deepEqual((await h.request('/api/glove/reports/receivables.json?asOf=2025-03-31').then(r => r.json())).totals, [])
```

```js
h.command('invoice.export', {}, { error: 'NOTHING_TO_EXPORT' })
```

```js
h.command('invoice.prepare', { jobId: perVisit.id }, { error: 'RECURRING_BILLING' })
```

```js
assert.equal(h.email.sent.length, 0)
```

```js
assert.ok(!(await b.techPerson.state()).jobs.find(j => j.id === perVisit.id).series.billing)
```

```js
assert.equal((await h.request('/api/glove/recurring-billing', { as: b.techPerson.cookie })).status, 403)
```

```js
assertTrail(h, ['series.billingChanged', 'invoice.prepared', 'series.billingRun'])
```

```js
b.office.run('invoice.approve', { invoiceId: monthly[0].id, version: monthly[0].version, revision: 1 }, { error: 'NOT_FOUND' })
```

```js
assert.deepEqual((await h.request('/api/glove/recurring-billing', { as: b.office.cookie }).then(r => r.json())).missed, [])
```

### 56. tests/api/recurring-billing.test.mjs

Surviving registration: PLAN-005, PLAN-012, PLAN-013 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks

Original step: PLAN-005, PLAN-012, PLAN-013 forward prices, pauses, fixed after-visit auto-approval, on-close, as-needed and missed price review preserve exactly-once evidence

Assertion text count: 13; generated provider cases: 1.

```js
assert.equal(first.status, 'approved')
```

```js
assert.ok(first.approvalAt.autoRule)
```

```js
assert.equal((await h.state()).invoices.filter(i => i.jobId === closed.id).length, 1)
```

```js
assert.ok(missing.missed.some(m => m.jobId === unpriced.id && /not in the price book/.test(m.reason)))
```

```js
assert.equal((await h.state()).invoices.filter(i => i.jobId === fixed.id).length, 1)
```

```js
assert.deepEqual(invoices.map(i => i.revisions[0].totals.total), ['80.00', '90.00'])
```

```js
assert.deepEqual((await h.state()).invoices.find(i => i.id === first.id), first)
```

```js
h.command('series.billing', { jobId: fixed.id, version: latest.version, from: '2025-01-01', reason: 'Retrospective change', billing: { mode: 'as-needed' } }, { error: 'BILLING_DATE' })
```

```js
assert.equal(s.notices.filter(n => n.jobId === reminder.id && n.recurringBillingKey).length, 1)
```

```js
assert.equal(s.invoices.filter(i => i.jobId === reminder.id).length, 0)
```

```js
assert.equal(s.invoices.filter(i => i.jobId === closed.id).length, 1)
```

```js
assert.equal(h.email.sent.length, 0)
```

```js
assertTrail(h, ['series.billingReminder', 'series.billingMissed', 'invoice.autoApproved'])
```

### 57. tests/api/eligibility.test.mjs

Surviving registration: DATA-002, DATA-009, DATA-010 / DISP-004: busy time from a technician's calendar refuses an overlapping booking; the secret calendar address stays with the owner and that technician; DISP-015 ordered delivery, uncertainty and retained-event review

Original step: DATA-002, DATA-009, DATA-010 / DISP-004: busy time from a technician's calendar refuses an overlapping booking; the secret calendar address stays with the owner and that technician; DISP-015 ordered delivery, uncertainty and retained-event review

Assertion text count: 32; generated provider cases: 1.

```js
b.dispatcher.run('technician.calendar', { technicianId: b.tom.id, url: secret }, { error: 'FORBIDDEN' })
```

```js
b.priyaPerson.run('technician.calendar', { technicianId: b.tom.id, url: secret }, { error: 'FORBIDDEN' })
```

```js
assert.equal(set.calendar.connected, true)
```

```js
assert.equal((await (await door(h.owner())).json()).url, secret)
```

```js
assert.equal((await (await door(b.tomPerson.cookie)).json()).url, secret)
```

```js
assert.equal((await door(other)).status, 403)
```

```js
assert.equal(read.calendar.busy.length, 7, JSON.stringify(read.calendar.busy))
```

```js
assert.equal(read.calendar.unexpanded, 1)
```

```js
assert.ok(!JSON.stringify(read).includes('dentist'), 'busy spans carry no titles')
```

```js
b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date, start, end }, { error: 'ELIGIBILITY' })
```

```js
assert.match((await book('2026-11-03', '09:30', '10:00')).message, /Tom B\.'s calendar shows busy time/)
```

```js
b.dispatcher.run('technician.calendarRead', { technicianId: b.tom.id }, { error: 'CALENDAR' })
```

```js
assert.ok(!JSON.stringify(gone).includes(hidden))
```

```js
assert.ok(!JSON.stringify(await h.state(who)).includes(hidden))
```

```js
assert.ok(!(await (await h.request('/api/glove/export')).text()).includes(hidden))
```

```js
assert.ok(!JSON.stringify(rows).includes(hidden), `${table} never holds the address`)
```

```js
assertTrail(h, ['technician.calendar', 'technician.calendarRead'])
```

```js
b.dispatcher.run('calendar.connect', connect, { error: 'FORBIDDEN' })
```

```js
h.command('calendar.connect', { ...connect, confirm: false }, { error: 'CONSENT' })
```

```js
b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-21', start: '09:00', end: '10:00' }, { error: 'ELIGIBILITY' })
```

```js
assert.equal(created.method, 'POST')
```

```js
assert.equal(created.provider, provider)
```

```js
assert.equal(JSON.stringify(created.body).includes(b.customer.name), provider === 'microsoft')
```

```js
assert.equal(JSON.stringify(created.body).includes(b.site.address), provider === 'microsoft')
```

```js
assert.equal(writes().length, count, 'replay does not send a second calendar event')
```

```js
assert.equal(writes().at(-1).method, 'PATCH')
```

```js
assert.equal(writes().at(-1).body.start.dateTime, v.startAt)
```

```js
assert.equal(writes().at(-1).method, 'DELETE')
```

```js
assert.ok(!JSON.stringify((await h.db.prepare(`SELECT * FROM ${table}`).all()).results).includes(connect.refreshToken))
```

```js
assert.ok(!(await (await h.request('/api/glove/export')).text()).includes(connect.clientSecret))
```

```js
b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-22', start: '13:00', end: '14:00' }, { error: 'CALENDAR_SYNC' })
```

```js
assertTrail(h, ['calendar.connected', 'calendar.disconnected', 'calendar.outcome'])
```

### 58. tests/api/eligibility.test.mjs

Surviving registration: DATA-002, DATA-009, DATA-010 / DISP-004: busy time from a technician's calendar refuses an overlapping booking; the secret calendar address stays with the owner and that technician; DISP-015 ordered delivery, uncertainty and retained-event review

Original step: DISP-004: booking refuses a missing skill and a day off, warns outside the area, then books an eligible technician

Assertion text count: 16; generated provider cases: 1.

```js
assert.equal(site.zip, '60654')
```

```js
assert.deepEqual(tom.skills, ['gas', 'epa 608'])
```

```js
assert.deepEqual((await h.command('technician.save', { id: tom.id, version: tom.version, name: tom.name, operatorId: b.tomPerson.id, active: true })).zips, ['60601', '60602'])
```

```js
b.dispatcher.run('visit.book', booking(b.priya.id, '2026-10-20'), { error: 'ELIGIBILITY' })
```

```js
assert.match(skill.message, /does not have the gas skill/)
```

```js
b.dispatcher.run('visit.book', booking(tom.id, '2026-10-21'), { error: 'ELIGIBILITY' })
```

```js
assert.match(off.message, /off on 2026-10-21 \(Dentist\)/)
```

```js
b.dispatcher.run('visit.book', booking(tom.id, '2026-10-24'), { error: 'ELIGIBILITY' })
```

```js
b.dispatcher.run('visit.book', booking(tom.id, '2026-10-20'), { error: 'CONFLICT_REVIEW' })
```

```js
assert.deepEqual(area.details.conflicts.map(c => c.code), ['area:60654'])
```

```js
assert.equal(visit.technicianId, tom.id)
```

```js
b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, technicianId: b.priya.id, reason: 'Rebalance' }, { error: 'ELIGIBILITY' })
```

```js
b.dispatcher.run('visit.book', booking(b.priya.id, '2026-10-22', { start: '11:00', end: '12:00' }), { error: 'CONFLICT_REVIEW' })
```

```js
assert.deepEqual(warned.details.conflicts.map(c => c.code), ['skill:gas'])
```

```js
b.dispatcher.run('visit.book', booking(tom.id, '2026-10-21', { start: '13:00', end: '14:00' }), { error: 'CONFLICT_REVIEW' })
```

```js
assert.deepEqual(away.details.conflicts.map(c => c.code), ['off:2026-10-21'])
```

### 59. tests/api/documents.test.mjs

Surviving registration: QUOTE-005, QUOTE-015 customer quote documents freeze branding, owner templates, line descriptions and only their scoped original images

Original step: QUOTE-005, QUOTE-015 customer quote documents freeze branding, owner templates, line descriptions and only their scoped original images

Assertion text count: 22; generated provider cases: 1.

```js
b.office.run('document.template', { kind: 'quote', version: businessRow.version, heading: 'Proposal', terms: 'No changes' }, { error: 'FORBIDDEN' })
```

```js
b.dispatcher.run('document.photo', { kind: 'quote', id: quote.id, version: quote.version, photo }, { error: 'FORBIDDEN' })
```

```js
assert.equal(d.business.legalName, 'Synthetic Glove LLC')
```

```js
assert.equal(d.business.ein, '12-3456789')
```

```js
assert.deepEqual(d.business.licenses.map(l => l.number), ['synthetic-glove-9','synthetic-glove-10'])
```

```js
assert.equal(d.template.terms, 'Payment due in 14 days.')
```

```js
assert.equal(d.options[0].lines[0].customerDescription, service.description)
```

```js
assert.equal(d.options[0].lines[0].images[0].fileId, service.images[0].fileId)
```

```js
assert.equal(d.photos[0].caption, 'Customer-facing site photo')
```

```js
assert.equal(d.files.length, 3)
```

```js
assert.equal(response.status, 200)
```

```js
assert.equal(Buffer.from(await response.arrayBuffer()).toString('base64'), fileId === d.business.logo.fileId ? documentLogo : png)
```

```js
assert.equal((await read(`/files/${unrelated.images[0].fileId}`)).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/public/quote/files/${d.files[0]}`, { as: '' })).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/public/quote/files/${d.files[0]}?token=${link.token}`, { as: '' })).status, 404)
```

```js
assert.deepEqual((await (await read('')).json()).document, d, 'issued customer document never changes with a template edit')
```

```js
assert.ok(!JSON.stringify(d).includes('1091.50'))
```

```js
assert.ok(!JSON.stringify(d).includes(b.customer.email))
```

```js
assertTrail(h, ['document.template','document.photo','quote.linkIssued'])
```

```js
assert.equal((await read('')).status, 404)
```

```js
assert.equal((await read(`/files/${quote.documentPhotos[0].file.fileId}`)).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/files/${quote.documentPhotos[0].file.fileId}`)).status, 404)
```

### 60. tests/api/documents.test.mjs

Surviving registration: QUOTE-005, QUOTE-015 customer quote documents freeze branding, owner templates, line descriptions and only their scoped original images

Original step: QUOTE-005, QUOTE-015 desk invoice and agreement projections use identity and descriptions without granting public or technician access

Assertion text count: 8; generated provider cases: 1.

```js
assert.equal(doc.kind, 'invoice')
```

```js
assert.equal(doc.lines[0].description, 'Split system service')
```

```js
assert.equal(doc.totals.total, invoice.revisions[0].totals.total)
```

```js
assert.equal((await h.request(`/api/glove/documents/invoice/${invoice.id}`, { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal((await h.request(`/api/glove/documents/invoice/${invoice.id}`, { as: '' })).status, 401)
```

```js
assert.equal(agreementDoc.title, plan.name)
```

```js
assert.match(agreementDoc.lines[0].customerDescription, /2 included visits/)
```

```js
assert.equal(agreementDoc.totals.total, '240.00')
```

### 61. tests/api/xero.test.mjs

Surviving registration: Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes

Original step: Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes

Assertion text count: 54; generated provider cases: 1.

```js
assert.deepEqual(discovery.contacts.map(c => c.id), Array.from({ length: 201 }, (_, n) => `synthetic-glove-contact-${n}`).filter(id => id !== 'synthetic-glove-contact-1'))
```

```js
assert.deepEqual(discovery.invoices.map(i => [i.id, i.total, i.amountDue]), Array.from({ length: 101 }, (_, n) => [`synthetic-glove-invoice-${n}`, n + 1, n]))
```

```js
assert.equal(discovery.items.length, 101)
```

```js
assert.equal(discovery.items.at(-1).id, 'synthetic-glove-item-100')
```

```js
assert.ok(h.xero.calls.some(c => c.path.endsWith('/Contacts') && c.query === '?page=3&pageSize=100'))
```

```js
assert.ok(h.xero.calls.some(c => c.path.endsWith('/Invoices') && c.query === '?page=2&pageSize=100'))
```

```js
assert.ok(h.xero.calls.filter(c => c.path.endsWith('/Items')).every(c => c.query === ''))
```

```js
assert.doesNotMatch(JSON.stringify(discovery), /excluded-/)
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
assert.ok(h.xero.calls.every(c => c.method === 'GET'))
```

```js
assert.doesNotMatch(JSON.stringify(saved.results), /Contact 200|INV-100|SERVICE-100/)
```

```js
assertTrail(h, ['xero.discovered'])
```

```js
h.command('xero.map', { kind: 'customer', id: b.customer.id, version: b.customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'XERO_REVIEW' })
```

```js
assert.fail('archived contact')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.fail('inactive income account')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.fail('missing income mapping')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.fail('non-revenue tax')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.fail('duplicate link')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.deepEqual(review.missing, [])
```

```js
assert.deepEqual(review.links.map(l => [l.kind, l.remoteId]).sort((a, b) => a[1].localeCompare(b[1])), [['customer', 'synthetic-glove-contact-1'], ['service', 'synthetic-glove-item-1'], ['service', 'synthetic-glove-item-2']])
```

```js
assert.deepEqual(review.links.filter(l => l.kind === 'service').map(l => [l.accountCode, l.taxType, l.taxRate]), [['200', 'OUTPUT', 8.25], ['200', 'OUTPUT', 8.25]])
```

```js
assert.equal((await confirm(review.fingerprint)).reviewed, true)
```

```js
assert.equal((await h.state()).business[0].xeroInspection.linkReview.fingerprint, review.fingerprint)
```

```js
assert.deepEqual((await discover(h, b)).linkReview.missing, [], 'same tenant retains local links')
```

```js
assert.deepEqual((await discover(h, b)).linkReview.missing.map(r => r.kind), ['customer', 'service', 'service'])
```

```js
assert.ok(h.xero.calls.every(c => c.method === 'GET'))
```

```js
assertTrail(h, ['xero.mapped', 'xero.linksReviewed'])
```

```js
h.command('role.save', { name: 'Synthetic provider manager', permissions: ['xero.map'] }, { error: 'INPUT' })
```

```js
person.run(type, {}, { error: 'FORBIDDEN' })
```

```js
assert.equal(res.status, 403)
```

```js
assert.equal(signedOut.status, 401)
```

```js
assert.equal(h.xero.calls.length, callsBeforeRefusals)
```

```js
assert.equal(result.xeroLink, undefined)
```

```js
b.office.run('customer.save', { ...customer }, { error: 'STALE' })
```

```js
assert.doesNotMatch(JSON.stringify(stale), /xeroLink|synthetic-glove-contact-1/)
```

```js
assert.equal(res.status, 200)
```

```js
assert.doesNotMatch(await res.text(), /synthetic-glove-contact-1|synthetic-glove-item-1|xeroLink|xeroInspection|xero\.mapped/)
```

```js
assertTrail(h, ['xero.mapped'])
```

```js
assert.ok(trail.exported.timeline.some(e => e.kind === 'xero.mapped' && e.data.includes('synthetic-glove-contact-1')))
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-931|excluded-bank/)
```

```js
assert.equal(download.records.customers[0].xeroLink.remoteId, 'synthetic-glove-contact-1')
```

```js
assert.equal((await current(h, 'customers', live.id)).xeroLink, undefined)
```

```js
assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /synthetic-glove-contact-1/)
```

```js
h.command('xero.map', { kind: 'customer', id: live.id, version: live.version, remoteId: 'synthetic-glove-contact-1', confirm: true }, { error: 'ERASED' })
```

```js
h.command('xero.discover', { customerId: live.id }, { error: 'XERO_SETUP' })
```

```js
assert.equal(h.xero.calls.length, beforeMissingCredentials, 'retained links never recreate installation credentials')
```

### 62. tests/api/xero.test.mjs

Surviving registration: Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes

Original step: Xero company policy defaults to no effects and isolates allow, review, approve and block decisions

Assertion text count: 19; generated provider cases: 1.

```js
assert.deepEqual([result.riskClass, result.decision, result.allowed], ['provider-write', 'block', false])
```

```js
assert.equal(h.xero.calls.length, calls)
```

```js
assert.deepEqual((await h.state()).customers, before.customers)
```

```js
assert.deepEqual((await h.state()).invoices, before.invoices)
```

```js
assert.deepEqual((await h.state()).payments, [])
```

```js
assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_xero_operations').first('n'), 0)
```

```js
assert.equal((await h.command('xero.pull', {})).decision, 'block')
```

```js
assert.deepEqual(await h.command(action, {}).then(r => [r.allowed, r.decision]), [false, decision])
```

```js
assert.equal(h.xero.calls.length, calls)
```

```js
assert.equal(review.contacts[0].id, 'synthetic-glove-contact-1')
```

```js
assert.equal((await current(h, 'customers', b.customer.id)).xero, undefined)
```

```js
assert.equal((await current(h, 'customers', b.customer.id)).xeroLink.remoteId, 'synthetic-glove-contact-1')
```

```js
assertTrail(h, ['company.actionPolicy'])
```

```js
assert.ok(decisions.some(d => d.action === 'xero.pull' && d.riskClass === 'provider-write' && d.decision === 'approve' && d.allowed === false))
```

```js
assert.ok(trail.exported.timeline.some(e => e.kind === 'company.actionPolicy' && JSON.parse(e.data).decision === 'review'))
```

```js
assert.ok(h.xero.calls.every(c => c.method === 'GET'))
```

```js
assert.equal((await h.command('xero.pull', {})).allowed, false)
```

```js
assert.notEqual((await h.state()).business[0].xeroInspection.connectionId, connection)
```

```js
assert.equal((await h.command('xero.pull', {})).allowed, false)
```

### 63. tests/api/pricebook.test.mjs

Surviving registration: MONEY-003, MONEY-006: a 200-line price book CSV with costs and markups, a 5% category raise, a flat-rate task quoted beside time and materials, and a round-trip export

Original step: MONEY-003, MONEY-006: a 200-line price book CSV with costs and markups, a 5% category raise, a flat-rate task quoted beside time and materials, and a round-trip export

Assertion text count: 117; generated provider cases: 1.

```js
assert.equal(previewed.committed, false)
```

```js
assert.deepEqual(previewed.preview.rows, { total: 200, new: 200, updated: 0, unchanged: 0, rejected: 0 })
```

```js
assert.deepEqual(previewed.preview.categories, [{ name: 'Parts', markupPercent: '50' }])
```

```js
assert.equal((await h.state()).services.length, before.services.length, 'the preview writes nothing')
```

```js
h.command('pricebook.import', { file, fingerprint: 'not-the-preview' }, { error: 'IMPORT_STALE' })
```

```js
assert.equal(s.services.length, before.services.length + 200)
```

```js
assert.deepEqual([item('P-001').unitCost, item('P-001').unitPrice], ['10.01', '15.02'], 'cost × 1.5, rounded half up to the cent')
```

```js
assert.deepEqual([item('P-150').unitCost, item('P-150').unitPrice], ['160.00', '240.00'])
```

```js
assert.deepEqual(item('P-001').parts, [{ supplier: 'Ferguson', partNumber: 'FG-1001' }, { supplier: 'Johnstone', partNumber: 'J-77' }])
```

```js
assert.deepEqual([valve.kind, valve.unitCost, valve.unitPrice, valve.description], ['task', '77.51', '349.00', 'Valve, fittings and labor, one price'], 'a task costs its labor and parts inside')
```

```js
assert.deepEqual(valve.components, [{ serviceId: item('LAB-HR').id, quantity: '1.5' }, { serviceId: item('P-001').id, quantity: '1' }])
```

```js
assert.equal(raised.items.length, 41)
```

```js
assert.deepEqual(['F-001', 'F-003', 'F-041'].map(c => item(c).unitPrice), ['21.00', '22.04', '63.00'])
```

```js
assert.deepEqual([item('P-001').unitPrice, item('LAB-HR').unitPrice], ['15.02', '120.00'])
```

```js
assert.deepEqual([item('P-001').unitPrice, item('TASK-1').unitCost, item('TASK-1').unitPrice], ['19.20', '79.50', '349.00'])
```

```js
assert.equal(picture.status, 200)
```

```js
assert.equal(Buffer.from(await picture.arrayBuffer()).toString('base64'), jpeg)
```

```js
assert.deepEqual(lines.map(l => [l.total, l.unitCost]), [['349.00', '79.50'], ['300.00', '45.00']])
```

```js
assert.deepEqual(quote.revisions[0].totals, { subtotal: '649.00', gst: '64.90', total: '713.90' })
```

```js
assert.ok(tech.services.every(x => x.unitCost === undefined && x.unitPrice === undefined), 'a technician reads neither price nor cost')
```

```js
assert.equal(res.status, 200)
```

```js
assert.deepEqual(again.preview.rows, { total: s.services.length, new: 0, updated: 0, unchanged: s.services.length, rejected: 0 })
```

```js
assert.deepEqual(again.preview.categories, [])
```

```js
assert.equal((await h.request('/api/glove/pricebook.csv', { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal(response.status, 200)
```

```js
assert.equal(response.headers.get('content-type'), 'image/jpeg')
```

```js
assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(jpeg, 'base64'))
```

```js
assert.deepEqual(item.checklist, checklist)
```

```js
assert.deepEqual(item.requiredSkills, [skill])
```

```js
assert.equal(item.images.length, 1)
```

```js
assert.equal(marked.unitPrice, '20.00')
```

```js
assert.equal(reviewed.committed, false)
```

```js
assert.deepEqual(reviewed.preview.rows, { total: 8, new: 1, updated: 1, unchanged: 2, rejected: 4 })
```

```js
assert.deepEqual(reviewed.preview.changes, [
    { row: 2, code: 'MX-UPDATE', status: 'updated', changes: ['name', 'unitCost', 'description', 'parts', 'unitPrice'] },
    { row: 5, code: 'MX-NEW', status: 'new', changes: [] },
  ], 'Code matches the existing item; only the listed fields differ, and rows 3 and 4 are unchanged')
```

```js
assert.deepEqual(reviewed.preview.rejected, [
    { row: 6, reason: 'Name: name is required (at most 200 characters).' },
    { row: 7, reason: 'Unit cost: unitCost must be a dollar amount such as 120 or 120.50.' },
    { row: 8, reason: 'Code: Code MX-UPDATE is already on row 2.' },
    { row: 9, reason: 'Task contents: Task contents name MX-MISSING, which is not in the price book or this file.' },
  ])
```

```js
assert.deepEqual(reviewed.preview.categories, [], 'rejected rows confer no category markup')
```

```js
assert.deepEqual(await domain(), beforeMixed, 'preview changes no domain record')
```

```js
h.command('pricebook.import', { file, fingerprint: reviewed.preview.fingerprint }, { error: 'IMPORT_STALE' })
```

```js
assert.deepEqual(await domain(), beforeMixed, 'changed file inputs cannot use the old preview')
```

```js
b.office.run('pricebook.import', { file: mixed, fingerprint: withdrawnReview.preview.fingerprint }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), beforeCommit, 'withdrawn Owner authority cannot commit an inspected preview')
```

```js
h.command('pricebook.import', { file: mixed, fingerprint: reviewed.preview.fingerprint }, { error: 'IMPORT_STALE' })
```

```js
assert.deepEqual(await domain(), beforeCommit)
```

```js
assert.notEqual(current.preview.fingerprint, reviewed.preview.fingerprint)
```

```js
assert.deepEqual(current.preview.changes, reviewed.preview.changes)
```

```js
person.run('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), beforeCommit)
```

```js
assert.equal(committed.committed, true)
```

```js
assert.deepEqual(committed.preview, current.preview, 'the committed plan is exactly the current preview')
```

```js
assert.match(newItem.id, /^[a-f0-9-]{36}$/)
```

```js
assert.ok(!beforeCommit.services.some(x => x.id === newItem.id))
```

```js
assert.deepEqual(newItem, {
    id: newItem.id, version: 1, createdAt: at, createdBy: owner.id,
    code: 'MX-NEW', name: 'New coupling', kind: 'material', category: 'Mixed', unit: 'each',
    unitCost: '6.25', pricing: 'fixed', unitPrice: '18.75', tax: 'GST', description: 'Replacement coupling',
    parts: [{ supplier: 'Supply house', partNumber: 'NEW-3' }], components: [], checklist: [], requiredSkills: [], archived: false,
  })
```

```js
assert.deepEqual(retained, { ...beforeCommit, services: [...beforeCommit.services.map(x => x.id === updated.id ? expectedUpdated : x), newItem].sort((a, b) => a.code.localeCompare(b.code)) }, 'all other identities, versions, evidence and customer records are unchanged')
```

```js
assert.deepEqual(await domain(), retained, 'actual Worker restart retains exact identities, values and versions')
```

```js
assert.deepEqual(await h.command('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { commandId }), committed)
```

```js
assert.deepEqual(await domain(), retained, 'replayed commit adds no items and changes no versions')
```

```js
b.office.run('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { commandId, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), retained, 'saved outcomes cannot bypass current authority')
```

```js
h.command('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { error: 'IMPORT_STALE' })
```

```js
assert.deepEqual(await domain(), retained)
```

```js
assert.deepEqual(repeat.preview.rows, { total: 8, new: 0, updated: 0, unchanged: 4, rejected: 4 })
```

```js
assert.deepEqual(repeat.preview.changes, [])
```

```js
assert.deepEqual(repeat.preview.rejected, reviewed.preview.rejected)
```

```js
assert.deepEqual(repeat.preview.categories, [])
```

```js
assert.equal(exported.status, 200)
```

```js
assert.deepEqual(row('MX-UPDATE'), ['MX-UPDATE', 'Inspect pump and valves', 'service', 'Mixed', '', 'visit', '15.25', 'fixed', '55.50', 'GST', 'Inspection with valve check', 'Supply house: NEW-2', '', 'no'])
```

```js
assert.deepEqual(row('MX-MARKUP'), ['MX-MARKUP', 'Marked coupling', 'material', 'Parts', '60', 'each', '12.50', 'markup', '20.00', 'GST', '', '', '', 'no'])
```

```js
assert.deepEqual(row('MX-SAME'), ['MX-SAME', 'Existing coupling', 'material', 'Mixed', '', 'each', '3.00', 'fixed', '8.25', 'FREE', '', '', '', 'no'])
```

```js
assert.deepEqual(row('MX-NEW'), ['MX-NEW', 'New coupling', 'material', 'Mixed', '', 'each', '6.25', 'fixed', '18.75', 'GST', 'Replacement coupling', 'Supply house: NEW-3', '', 'no'])
```

```js
assert.deepEqual(roundTrip.preview.rows, { total: retained.services.length, new: 0, updated: 0, unchanged: retained.services.length, rejected: 0 })
```

```js
assert.deepEqual(roundTrip.preview.changes, [])
```

```js
assert.deepEqual(roundTrip.preview.categories, [])
```

```js
assert.deepEqual(await domain(), retained, 'export and actual re-import change no domain records')
```

```js
assert.equal(await (await h.request('/api/glove/pricebook.csv')).text(), exportText)
```

```js
assert.equal(imported.length, 1)
```

```js
assert.deepEqual([imported[0].actorId, imported[0].actorName, imported[0].actorRole, imported[0].at, imported[0].subjectKind, imported[0].subjectId, imported[0].summary], [owner.id, 'Olivia Owner', 'owner', at, 'business', 'business', 'Price book CSV: 1 new, 1 updated, 2 unchanged, 4 rejected'])
```

```js
assert.deepEqual([entry.actor_id, entry.actor_name, entry.actor_role, entry.at, entry.command_id, entry.summary], [owner.id, 'Olivia Owner', 'owner', at, commandId, imported[0].summary])
```

```js
assert.deepEqual(download.services.toSorted((a, b) => a.code.localeCompare(b.code)), retained.services)
```

```js
assert.equal(rejected.committed, false)
```

```js
assert.deepEqual(rejected.preview.rows, { total: 2, new: 0, updated: 0, unchanged: 0, rejected: 2 })
```

```js
assert.deepEqual(rejected.preview.changes, [])
```

```js
assert.deepEqual(rejected.preview.categories, [])
```

```js
assert.deepEqual(rejected.preview.rejected, rows.map((row, i) => ({ row: i + 2, reason: row.startsWith('MAT,') ? 'Pricing: markup needs a category with a markup.' : 'Task contents: Task contents name MAT, which is not in the price book or this file.' })))
```

```js
assert.deepEqual(await domain(), beforeRejected, 'rejected dependency preview changes no records')
```

```js
assert.equal(committed.committed, true)
```

```js
assert.deepEqual(committed.preview, rejected.preview, 'commit applies exactly the two rejected rows without a dangling task')
```

```js
assert.deepEqual(await domain(), beforeRejected, 'rejected rows retain every unrelated record and version')
```

```js
assert.deepEqual(await h.command('pricebook.import', { file, fingerprint: rejected.preview.fingerprint }, { commandId }), committed)
```

```js
assert.deepEqual(await domain(), beforeRejected, 'restart and replay retain all records')
```

```js
assert.equal(await (await h.request('/api/glove/pricebook.csv')).text(), exportText)
```

```js
assert.notEqual(labor.id, material.id)
```

```js
assert.deepEqual(await figures(), [
      [labor.id, 'service', [], '0.01', '5.00'],
      [material.id, 'material', [], '0.01', '3.00'],
      [laborTask.id, 'task', laborContents, '0.01', '17.00'],
      [materialTask.id, 'task', materialContents, '0.01', '19.00'],
      [task.id, 'task', contents, '0.02', '42.00'],
    ], 'each distinct half-cent rounds up; rounding only the sum would yield one cent')
```

```js
assert.deepEqual(await figures(), [
      [labor.id, 'service', [], '0.03', '5.00'],
      [material.id, 'material', [], '0.01', '3.00'],
      [laborTask.id, 'task', laborContents, '0.02', '17.00'],
      [materialTask.id, 'task', materialContents, '0.01', '19.00'],
      [task.id, 'task', contents, '0.03', '42.00'],
    ], 'a service cost edit recalculates every dependent task without changing fixed prices')
```

```js
assert.deepEqual(await figures(), expected, 'a material cost edit rounds its own product before summation')
```

```js
h.command('service.save', { ...currentTask, unitPrice: '99.00', components: [{ serviceId: laborTask.id, quantity: '1' }] }, { error: 'INPUT' })
```

```js
assert.equal(nested.details.field, 'components')
```

```js
assert.deepEqual(await domain(), retained, 'a task-within-task edit preserves the exact retained task and other records')
```

```js
h.command('service.save', { ...currentTask, version: 0, unitPrice: '99.00' }, { error: 'STALE' })
```

```js
assert.deepEqual(await domain(), retained, 'stale task edits change nothing')
```

```js
person.run('service.save', { ...currentTask, unitPrice: '99.00' }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), retained, 'excluded roles cannot change task costs or prices')
```

```js
assert.deepEqual(await figures(), expected, 'actual Worker restart retains component identities, quantities, recalculated costs and fixed prices')
```

```js
assert.deepEqual(await domain(), retained)
```

```js
assert.deepEqual(await h.command('service.save', taskPayload, { commandId: creation.commandId }), creation.record)
```

```js
assert.deepEqual(await domain(), retained, 'replaying the original save cannot roll back current component costs')
```

```js
b.office.run('service.save', taskPayload, { commandId: creation.commandId, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), retained, 'replay still checks current authority')
```

```js
b.office.run('service.save', promotedPayload, { commandId: promotedCommandId, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), afterWithdrawal, 'withdrawn Owner authority cannot replay its prior authorized save')
```

```js
assert.deepEqual(await domain(), afterWithdrawal, 'restart retains the last authorized save and current role')
```

```js
b.office.run('service.save', promotedPayload, { commandId: promotedCommandId, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), afterWithdrawal)
```

```js
assert.deepEqual(await figures(), expected)
```

```js
assert.equal(events.length, 1, 'save and replay retain one attributable event')
```

```js
assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.subjectKind, event.subjectId, event.summary], [actorId, actorName, 'owner', at, 'service', record.id, summary])
```

```js
assert.deepEqual([exported.actor_id, exported.actor_name, exported.actor_role, exported.at, exported.command_id, exported.subject_id, exported.summary], [actorId, actorName, 'owner', at, commandId, record.id, summary])
```

```js
assert.deepEqual(download.services.find(x => x.id === itemId), afterWithdrawal.services.find(x => x.id === itemId), 'business download retains exact task and component records')
```

### 64. tests/api/pricebook.test.mjs

Surviving registration: MONEY-003, MONEY-006: a 200-line price book CSV with costs and markups, a 5% category raise, a flat-rate task quoted beside time and materials, and a round-trip export

Original step: MONEY-003, MONEY-006 exports honor current margin permission while retaining a usable price catalogue and full owner costs

Assertion text count: 27; generated provider cases: 1.

```js
assert.equal(drafted.revisions[0].lines[0].unitCost, undefined, 'drafting prices grants no margin read')
```

```js
assert.equal((await exporter.run('quote.draft', payload, { commandId })).revisions[0].lines[0].unitCost, undefined, 'saved quote outcomes follow margin visibility too')
```

```js
exporter.run('quote.revise', { quoteId: drafted.id, version: 0, lines: payload.lines }, { error: 'STALE' })
```

```js
assert.equal(stale.details.record.revisions[0].lines[0].unitCost, undefined, 'stale quote error records do not expose costs')
```

```js
assert.equal(response.status, 200)
```

```js
assert.equal(response.status, 200)
```

```js
assert.ok(!catalogue.headers.includes('Unit cost'), 'restricted catalogue omits costs, rather than fabricating zero')
```

```js
assert.equal(item.Name, part.name)
```

```js
assert.equal(item.Price, '400.00')
```

```js
assert.equal(data.services.find(r => r.id === part.id).unitCost, undefined)
```

```js
assert.equal(data.quotes.find(r => r.id === quote.id).revisions[0].lines[0].unitCost, undefined)
```

```js
assert.equal(data.jobs.find(r => r.id === job.id).lines[0].unitCost, undefined)
```

```js
assert.deepEqual(data.purchaseOrders, [])
```

```js
assert.deepEqual(data.expenses, [])
```

```js
assert.ok(!data.timeline.some(e => ['purchaseOrder', 'expense', 'warning'].includes(e.subject_kind)))
```

```js
assert.equal(data.jobs.find(r => r.id === job.id).lines[0].unitPrice, '400.00')
```

```js
assert.ok(data.timeline.some(e => e.kind === 'job.created'), 'permitted business history remains exportable')
```

```js
assert.equal((await readCsv(as)).rows.find(r => r.Code === part.code)['Unit cost'], '137.29')
```

```js
assert.equal(data.services.find(r => r.id === part.id).unitCost, '137.29')
```

```js
assert.equal(data.quotes.find(r => r.id === quote.id).revisions[0].lines[0].unitCost, '137.29')
```

```js
assert.equal(data.jobs.find(r => r.id === job.id).lines[0].unitCost, '137.29')
```

```js
assert.equal(data.purchaseOrders[0].lines[0].unitCost, '137.29')
```

```js
assert.equal((await exporter.run('quote.draft', payload, { commandId })).revisions[0].lines[0].unitCost, '137.29', 'granting reports reveals the original retained cost on replay')
```

```js
assert.equal((await readCsv(exporter.cookie)).rows.find(r => r.Code === part.code)['Unit cost'], '137.29')
```

```js
assert.equal((await readExport(exporter.cookie)).services.find(r => r.id === part.id).unitCost, '137.29')
```

```js
assert.equal((await exporter.run('quote.draft', payload, { commandId })).revisions[0].lines[0].unitCost, undefined, 'removing reports hides retained quote costs again')
```

```js
assert.equal((await h.request(door, { as: exporter.cookie })).status, 403, 'reports.read alone grants no export')
```

### 65. tests/api/purchasing.test.mjs

Surviving registration: DATA-002, DATA-009, DATA-010 / STOCK-002 a purchase order for a job, received in two parts, lands in stock and in the job cost

Original step: DATA-002, DATA-009, DATA-010 / STOCK-002 a purchase order for a job, received in two parts, lands in stock and in the job cost

Assertion text count: 55; generated provider cases: 1.

```js
b.dispatcher.run('po.save', order, { error: 'FORBIDDEN' })
```

```js
b.priyaPerson.run('po.save', order, { error: 'FORBIDDEN' })
```

```js
b.office.run('po.save', { ...order, lines: [{ serviceId: b.service.id, quantity: '1' }] }, { error: 'INPUT' })
```

```js
assert.deepEqual([po.number, po.status, po.lines.map(l => [l.code, l.quantity, l.unitCost, l.total]), po.total], ['PO-0001', 'draft', [['CAP-455', '4', '11.50', '46.00'], ['FLT-1620', '10', '6.00', '60.00']], '106.00'])
```

```js
b.office.run('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: po.lines[0].id, quantity: '1' }] }, { error: 'PO_STATE' })
```

```js
assert.deepEqual([po.status, po.sent], ['sent', { method: 'portal', reference: 'SC-88812', by: { id: b.office.id, name: 'Olu Office' }, at: '2026-10-21T01:00:00.000Z' }])
```

```js
b.office.run('po.save', { ...order, id: po.id, version: po.version }, { error: 'PO_STATE' })
```

```js
assert.ok((await timeline()).some(s => s.includes('recorded PO-0001 as sent to Supply Co by portal (supplier reference SC-88812); Glove sent nothing itself')))
```

```js
assert.equal(response.status, 200)
```

```js
person.run('po.receive', payload, { error, ...(commandId ? { commandId } : {}) })
```

```js
assert.deepEqual(await domain(), before, `${error} leaves orders, stock, movements, job evidence, cost and Activity unchanged`)
```

```js
assert.deepEqual([po.status, po.lines.map(l => l.received)], ['partly received', ['2', '0']])
```

```js
assert.equal(po.receipts.length, 1)
```

```js
assert.ok(firstReceipt.id)
```

```js
assert.deepEqual(firstReceipt, { id: firstReceipt.id, ...receipt([{ lineId: capLine.id, quantity: '2' }], '2026-10-21T02:00:00.000Z', 'First delivery') })
```

```js
assert.deepEqual(firstState.purchaseOrders.find(p => p.id === po.id), po)
```

```js
assert.deepEqual(firstState.stock.find(l => l.id === warehouse.id).counts, { [cap.id]: 2000 })
```

```js
assert.deepEqual(receiptMoves(firstState), [[warehouse.id, cap.id, '2', '2', po.id, job.id, firstReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T02:00:00.000Z']])
```

```js
assert.deepEqual([c.actual.purchases, c.actual.materials, c.actual.cost], ['23.00', '0.00', '23.00'])
```

```js
assert.deepEqual(c.actual.purchaseEntries.map(l => [l.poId, l.number, l.serviceId, l.received, l.unitCost, l.cost]), [[po.id, 'PO-0001', cap.id, '2', '11.50', '23.00']])
```

```js
assert.deepEqual(await domain(), firstDomain, 'the partly received order, exact stock, cost, receipt and movement survive restart')
```

```js
assert.deepEqual(await b.office.run('po.receive', firstPayload, { commandId: firstCommand }), po)
```

```js
assert.deepEqual(await domain(), firstDomain, 'first-receipt replay after restart creates no stock, cost, movement or event')
```

```js
refuse(b.office, firstPayload, 'STALE')
```

```js
refuse(b.office, { poId: po.id, version: po.version, lines: [{ lineId: capLine.id, quantity: '1' }, { lineId: filterLine.id, quantity: '11' }] }, 'OVER')
```

```js
refuse(b.office, { poId: po.id, version: po.version, lines: [{ lineId: capLine.id, quantity: '3' }] }, 'OVER')
```

```js
refuse(person, remainder, 'FORBIDDEN')
```

```js
refuse(b.office, remainder, 'FORBIDDEN')
```

```js
refuse(b.office, firstPayload, 'FORBIDDEN', firstCommand)
```

```js
assert.deepEqual([po.status, po.lines.map(l => l.received), po.receipts.length], ['received', ['4', '10'], 2])
```

```js
assert.ok(secondReceipt.id && secondReceipt.id !== firstReceipt.id)
```

```js
assert.deepEqual(po.receipts, [firstReceipt, { id: secondReceipt.id, ...receipt([{ lineId: capLine.id, quantity: '2' }, { lineId: filterLine.id, quantity: '10' }], '2026-10-21T03:00:00.000Z', 'Back order arrived') }])
```

```js
assert.deepEqual(s.purchaseOrders.find(p => p.id === po.id), po)
```

```js
assert.deepEqual(s.stock.find(l => l.id === warehouse.id).counts, { [cap.id]: 4000, [filter.id]: 10000 })
```

```js
assert.deepEqual(byItem(receiptMoves(s)), byItem([
    [warehouse.id, cap.id, '2', '2', po.id, job.id, firstReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T02:00:00.000Z'],
    [warehouse.id, cap.id, '2', '4', po.id, job.id, secondReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T03:00:00.000Z'],
    [warehouse.id, filter.id, '10', '10', po.id, job.id, secondReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T03:00:00.000Z'],
  ]))
```

```js
assert.deepEqual([c.actual.purchases, c.actual.materials, c.actual.cost], ['106.00', '0.00', '106.00'])
```

```js
assert.deepEqual(c.actual.purchaseEntries.map(l => [l.number, l.description, l.received, l.cost]), [['PO-0001', 'Run capacitor 45/5', '4', '46.00'], ['PO-0001', 'Filter 16x20', '10', '60.00']])
```

```js
assert.deepEqual(await domain(), finalDomain, 'both receipt identities and the exact final effects survive another Worker restart')
```

```js
assert.deepEqual(await b.office.run('po.receive', firstPayload, { commandId: firstCommand }), firstState.purchaseOrders.find(p => p.id === po.id), 'first replay returns its historical partly received outcome')
```

```js
assert.deepEqual(await b.office.run('po.receive', remainder, { commandId: secondCommand }), po)
```

```js
assert.deepEqual(await domain(), finalDomain, 'replaying both receipts cannot add any stock, cost, movement or Activity')
```

```js
refuse(b.office, remainder, 'STALE')
```

```js
refuse(b.office, { poId: po.id, version: po.version, lines: [{ lineId: filterLine.id, quantity: '1' }] }, 'PO_STATE')
```

```js
assert.deepEqual([c.actual.materialEntries.map(m => [m.quantity, m.fromPurchaseOrders, m.cost]), c.actual.materials, c.actual.cost], [[['5', '4', '12.00']], '12.00', '118.00'])
```

```js
assert.ok(history.entries.some(e => e.kind === 'purchase order' && e.label === `PO-0001 to Supply Co for ${job.number}` && e.status === 'received'))
```

```js
assert.deepEqual((await b.priyaPerson.state()).purchaseOrders, [])
```

```js
assertTrail(h, ['po.raised', 'po.revised', 'po.sent', 'po.received'])
```

```js
assert.deepEqual(exported.purchaseOrders.find(p => p.id === po.id), po)
```

```js
assert.deepEqual(receiptMoves(exported), receiptMoves(s), 'business download retains the receipt-linked stock movements')
```

```js
assert.deepEqual(activity.filter(e => e.kind === 'po.received').map(e => e.commandId).sort(), [firstCommand, secondCommand].sort())
```

```js
assert.equal(events.length, 1)
```

```js
assert.deepEqual([event.kind, event.subjectId, event.jobId, event.actorId, event.actorName, event.actorRole, event.at], [kind, po.id, job.id, b.office.id, 'Olu Office', 'office', at])
```

```js
assert.equal(kept.length, 1)
```

```js
assert.deepEqual([kept[0].kind, kept[0].subject_id, kept[0].job_id, kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].command_id, kept[0].at], [kind, po.id, job.id, b.office.id, 'Olu Office', 'office', commandId, at])
```

```js
assert.equal(h.outbound.attempts - providerAttempts, 0, 'outside-send recording, receiving, refusal, restart and replay make zero outbound provider attempts')
```

### 66. tests/api/purchasing.test.mjs

Surviving registration: DATA-002, DATA-009, DATA-010 / STOCK-002 a purchase order for a job, received in two parts, lands in stock and in the job cost

Original step: STOCK-002 / TEAM-001 purchase commands acknowledge writes without granting margin reads, including old outcomes after role edits

Assertion text count: 42; generated provider cases: 1.

```js
assert.deepEqual(Object.keys(result).sort(), ['id', 'version'], 'only the record identity and committed version acknowledge the write')
```

```js
assert.deepEqual(await receiver.run(type, payload, { commandId }), result, 'replay has the same restricted acknowledgement')
```

```js
receiver.run(command.type, command.payload, { error: 'STALE' })
```

```js
assert.deepEqual(stale.details.record, { id: po.id, version: po.version }, 'stale responses disclose no hidden purchase-order record')
```

```js
assert.equal(po.status, 'received')
```

```js
assert.equal(po.total, '274.58')
```

```js
assert.deepEqual((await receiver.state()).purchaseOrders, [])
```

```js
assert.ok(!(await receiver.state()).events.some(e => e.subjectKind === 'purchaseOrder'))
```

```js
assert.equal((await h.request(`/api/glove/jobs/${job.id}/cost`, { as: receiver.cookie })).status, 403)
```

```js
assert.equal((await h.state()).stock.find(l => l.id === warehouse.id).counts[material.id], 2000)
```

```js
assert.equal(cost.costing.actual.purchases, '274.58', 'redaction changes no stock or job-cost effect')
```

```js
assert.deepEqual(state.purchaseOrders, margins ? [po] : [], `${person.name} state follows current report access`)
```

```js
assert.equal(activity.events.some(e => e.kind === 'service.saved' && e.summary.includes('137.29')), margins, 'historical catalogue costs follow report access as purchase orders do')
```

```js
assert.equal(events.length, margins ? 5 : 0, `${person.name} Activity follows margin access`)
```

```js
assert.equal(timeline.events.filter(e => e.subjectKind === 'purchaseOrder').length, margins ? 5 : 0)
```

```js
assert.deepEqual(history.entries.filter(e => e.kind === 'purchase order').map(e => e.id), margins ? [po.id] : [])
```

```js
assert.equal(response.status, margins ? 200 : 403)
```

```js
assert.equal((await response.json()).costing.actual.purchases, '274.58')
```

```js
assert.equal(download.status, exportAllowed ? 200 : 403)
```

```js
assert.deepEqual(exported.purchaseOrders, margins ? [po] : [])
```

```js
assert.equal(exported.timeline.filter(e => e.subject_kind === 'purchaseOrder').length, margins ? 5 : 0)
```

```js
assert.ok(!JSON.stringify(exported).includes('137.29'), 'export permission alone exposes no supplier costs')
```

```js
assert.ok(!JSON.stringify({ state, activity, timeline, history }).includes('137.29'), 'no supplier cost in any permitted projection')
```

```js
assert.deepEqual(await h.state(), before, 'inspection changes no domain record or Activity')
```

```js
person.run(type, type === 'po.save' ? commands[0].payload : { poId: po.id, version: po.version, method: 'portal', lines: [{ lineId: po.lines[0].id, quantity: '1' }] }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal(h.outbound.attempts, attempts)
```

```js
assert.equal((await h.request(path, { as: '' })).status, 401)
```

```js
assert.deepEqual(priced, { id: expense.id, version: 2 })
```

```js
assert.deepEqual(await receiver.run('expense.price', expensePayload, { commandId: expenseCommandId }), priced)
```

```js
receiver.run('expense.price', expensePayload, { error: 'STALE' })
```

```js
assert.deepEqual(staleExpense.details.record, priced)
```

```js
assert.equal(replay.lines[0].unitCost, '137.29')
```

```js
assert.equal(replay.total, '274.58')
```

```js
assert.equal(replay.version, command.result.version, 'the historical outcome is retained')
```

```js
assert.equal((await receiver.state()).purchaseOrders[0].total, '274.58')
```

```js
assert.equal((await receiver.run('expense.price', expensePayload, { commandId: expenseCommandId })).amount, '42.00')
```

```js
assert.equal(full.lines[0].unitCost, '137.29')
```

```js
assert.deepEqual(await receiver.run('po.save', payload, { commandId }), { id: full.id, version: full.version }, 'a previously full outcome loses margin access immediately')
```

```js
assert.deepEqual(await receiver.run('expense.price', expensePayload, { commandId: expenseCommandId }), priced)
```

```js
receiver.run('po.save', payload, { commandId, error: 'FORBIDDEN' })
```

```js
assert.equal((await h.request('/api/glove/export', { as: receiver.cookie })).status, 403, 'revoking export authority applies to the next request')
```

### 67. tests/api/money.test.mjs

Surviving registration: DATA-002, DATA-009, DATA-010 / MONEY-001, MONEY-004, MONEY-005 address and branch tax, labor rules and certificate expiry remain exact on approved documents, exports, QuickBooks payloads and tax reports

Original step: DATA-002, DATA-009, DATA-010 / MONEY-001, MONEY-004, MONEY-005 address and branch tax, labor rules and certificate expiry remain exact on approved documents, exports, QuickBooks payloads and tax reports

Assertion text count: 71; generated provider cases: 1.

```js
assert.equal((await h.state()).business[0].currency, 'USD')
```

```js
assert.ok(customer.taxExemption.certificate.fileId)
```

```js
assert.equal(missingQuote.revisions[0].totals.gst, '8.25')
```

```js
assert.deepEqual([totals.currency, totals.subtotal, totals.gst, totals.taxBreakdown[0].taxable], ['USD', '150.04', tax, taxable])
```

```js
assert.deepEqual(q.acceptance.totals, place.frozen)
```

```js
assert.deepEqual(job.totals, place.frozen)
```

```js
assert.deepEqual(invoice.revisions[0].totals, place.frozen)
```

```js
assert.equal(response.status, 200)
```

```js
assert.deepEqual(payload.CustomerRef, { value: 'customer-17' })
```

```js
assert.deepEqual(payload.TxnTaxDetail, { TxnTaxCodeRef: { value: 'tax-code-9' }, TotalTax: Number(tax) })
```

```js
assert.deepEqual(payload.Line.map(l => l.SalesItemLineDetail.TaxCodeRef.value), place === exempt ? ['NON', 'NON'] : place === z || place === w ? ['TAX', 'TAX'] : ['TAX', 'NON'])
```

```js
assert.equal(payload.CurrencyRef.value, 'USD')
```

```js
assert.equal((await h.request(`/api/glove/invoices/${invoices[0].id}/quickbooks.json`)).status, 400)
```

```js
assert.equal(bytes.status, 200)
```

```js
assert.equal(Buffer.from(await bytes.arrayBuffer()).toString('base64'), certificate.base64)
```

```js
assert.equal((await h.request(`/api/glove/files/${privateFileId}`, { as: westCrew.person.cookie })).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/files/${privateFileId}`, { as: branchOffice.cookie })).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/invoices/${invoices[0].id}/quickbooks.json?customerRef=58&itemRef=41&taxCodeRef=7`, { as: branchOffice.cookie })).status, 404)
```

```js
branchOffice.run('customer.certificate', { customerId: exempt.customer.id, version: exempt.customer.version, file: certificate }, { error: 'NOT_FOUND' })
```

```js
branchOffice.run('tax.connect', { key: 'fixture-no-authority' }, { error: 'FORBIDDEN' })
```

```js
branchOffice.run('tax.lookup', { siteId: e.site.id }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual([lookup.proposal.rate, lookup.proposal.taxLabor], ['8.25', false])
```

```js
assert.equal(h.stripeTax.calls.length, 2)
```

```js
assert.equal(call.authorization, 'Bearer fixture-stripe-tax-credential')
```

```js
assert.equal(call.body['customer_details[address][line1]'], '10 Service St')
```

```js
assert.equal(call.body['line_items[0][amount]'], '10000')
```

```js
assert.ok(call.idempotencyKey)
```

```js
assert.ok(!JSON.stringify(call.body).includes(a.customer.id) && !JSON.stringify(call.body).includes(exempt.customer.taxExemption.certificateNumber))
```

```js
assert.equal((await h.command('tax.lookup', request)).proposal, null)
```

```js
assert.ok(exportedTrail.timeline.some(e => e.kind === kind && e.actor_id && e.at && e.command_id), `DATA-002 ${kind}`)
```

```js
assert.ok(!JSON.stringify(exportedTrail).includes('fixture-stripe-tax-credential'))
```

```js
assert.ok(activity.events.some(e => e.kind === kind), `DATA-002 Activity ${kind}`)
```

```js
assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), large)
```

```js
h.command('customer.certificate', { customerId: customer.id, version: uploaded.version, file: { mediaType: 'image/png', base64: large.toString('base64') } }, { error: 'INPUT' })
```

```js
assert.match(csv, /DocumentTaxAmount/)
```

```js
assert.equal(exported.currency, 'USD')
```

```js
assert.deepEqual(exported.taxBreakdown, place.frozen.taxBreakdown)
```

```js
assert.ok(csv.includes(place.frozen.taxBreakdown[0].jurisdiction))
```

```js
assert.ok(csv.includes(tax))
```

```js
assert.deepEqual([row('tx', null).tax, row('az', null).tax, row('county', east.id).tax, row('county', west.id).tax], ['16.50', '9.75', '4.50', '12.57'])
```

```js
assert.equal(narrowed.jurisdictions.length, 1)
```

```js
assert.deepEqual([narrowed.jurisdictions[0].branchId, narrowed.jurisdictions[0].tax], [east.id, '4.50'])
```

```js
assert.match(taxCsv, /Clark combined/)
```

```js
assert.match(taxCsv, /12\.57/)
```

```js
assert.ok(!taxCsv.includes('Wake combined'))
```

```js
assert.deepEqual((await h.state()).business[0].taxSettings, overlap)
```

```js
h.command('quote.draft', { customerId: selectionCustomer.id, siteId: site.id, title: 'Select the correct tax', lines: invoiceLines }, { error: 'TAX_JURISDICTION' })
```

```js
assert.equal(refusal.message, message)
```

```js
assert.deepEqual(after[key], before[key], `${address}: refused draft leaves ${key} unchanged`)
```

```js
mainCrew.person.run('site.save', { ...selectionSites[0], taxJurisdictionId: 'tx' }, { error: 'FORBIDDEN' })
```

```js
branchOffice.run('site.save', { ...selectionSites[0], taxJurisdictionId: 'tx' }, { error: 'NOT_FOUND' })
```

```js
branchOffice.run('quote.draft', { customerId: selectionCustomer.id, siteId: selectionSites[0].id, title: 'Wrong branch', lines: invoiceLines }, { error: 'FORBIDDEN' })
```

```js
branchOffice.run('business.save', { ...b, taxSettings: overlap }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(afterAuthority[key], beforeAuthority[key], `authority refusals leave ${key} unchanged`)
```

```js
assert.deepEqual(first.totals.taxBreakdown, [{ branchId: null, jurisdictionId: 'tx', jurisdiction: 'Austin combined', rate: '8.25', taxable: '100.01', tax: '8.25' }])
```

```js
assert.deepEqual([first.totals.subtotal, first.totals.gst, first.totals.total], ['150.04', '8.25', '158.29'])
```

```js
assert.equal(first.totals.taxContext.jurisdictionId, 'tx')
```

```js
assert.deepEqual(quote.revisions[0], first, 'a different explicit choice preserves the earlier approved revision')
```

```js
assert.deepEqual(second.totals.taxBreakdown, [{ branchId: null, jurisdictionId: 'az', jurisdiction: 'Phoenix combined', rate: '6.5', taxable: '150.04', tax: '9.75' }])
```

```js
assert.deepEqual([second.totals.subtotal, second.totals.gst, second.totals.total], ['150.04', '9.75', '159.79'])
```

```js
assert.equal(second.totals.taxContext.jurisdictionId, 'az')
```

```js
assert.equal(second.approval, null)
```

```js
assert.equal(choices.length, 3, 'site creation and both explicit choices are attributable')
```

```js
assert.deepEqual([e.actorId, e.actorName, e.actorRole, e.at], [afterAuthority.actor.id, 'Olivia Owner', 'owner', selectionTime])
```

```js
assert.ok(e.commandId)
```

```js
assert.deepEqual(restarted.quotes, beforeRestart.quotes, 'every quote remains unchanged after restart')
```

```js
assert.deepEqual(restarted.quotes.find(q => q.id === quote.id).revisions, quote.revisions, 'both revisions and their separate approval state survive restart')
```

```js
assert.deepEqual(restarted.sites.find(s => s.id === site.id), site, 'explicit site jurisdiction survives restart')
```

```js
assert.deepEqual(selectionActivity.events.find(x => x.id === e.id), e)
```

```js
assert.deepEqual([exported.actor_id, exported.actor_name, exported.actor_role, exported.at, exported.command_id, exported.subject_id], [e.actorId, e.actorName, e.actorRole, e.at, e.commandId, e.subjectId])
```

```js
assert.deepEqual([h.stripeTax.calls.length, h.avatax.calls.length], providerCalls, 'explicit tax selection makes no tax-provider request')
```

### 68. tests/api/money.test.mjs

Surviving registration: DATA-002, DATA-009, DATA-010 / MONEY-001, MONEY-004, MONEY-005 address and branch tax, labor rules and certificate expiry remain exact on approved documents, exports, QuickBooks payloads and tax reports

Original step: MONEY-001, MONEY-004, MONEY-005 Avalara AvaTax lookup sends only the service address and two samples with the owner-only sealed key, proposes a rate the owner applies, and reads unavailable rather than 0%

Assertion text count: 25; generated provider cases: 1.

```js
office.run('tax.connect', { provider: 'avatax', key }, { error: 'FORBIDDEN' })
```

```js
office.run('tax.lookup', request, { error: 'FORBIDDEN' })
```

```js
h.command('tax.lookup', request, { error: 'TAX_PROVIDER' })
```

```js
assert.equal((await h.state()).business[0].avataxLookup.connected, true)
```

```js
assert.ok(!JSON.stringify(await h.state()).includes('fixture-avatax-license'))
```

```js
h.command('tax.lookup', { ...request, serviceTaxCode: 'not a code' }, { error: 'INPUT' })
```

```js
assert.deepEqual([exempt.proposal.rate, exempt.proposal.taxLabor, exempt.proposal.zips], ['8.25', false, ['78704']])
```

```js
assert.match(exempt.label, /proposal; review and apply/)
```

```js
assert.deepEqual((await h.state()).business[0].taxSettings, original, 'a lookup never applies itself')
```

```js
assert.equal(call.url, 'https://sandbox-rest.avatax.com/api/v2/transactions/create')
```

```js
assert.equal(call.authorization, `Basic ${Buffer.from('1100012345:fixture-avatax-license').toString('base64')}`)
```

```js
assert.deepEqual([call.body.type, call.body.commit, call.body.companyCode, call.body.customerCode, call.body.currencyCode], ['SalesOrder', false, 'PACHECO', 'glove-address-rate-lookup', 'USD'])
```

```js
assert.deepEqual(call.body.addresses, { singleLocation: { line1: '10 Service St', city: 'Austin', region: 'TX', postalCode: '78704', country: 'US' } })
```

```js
assert.deepEqual(call.body.lines.map(l => [l.taxCode, l.amount, l.quantity]), [['P0000000', 100, 1], ['SV060100', 100, 1]])
```

```js
assert.ok(!JSON.stringify(call.body).includes(secret))
```

```js
assert.deepEqual([taxed.proposal.rate, taxed.proposal.taxLabor], ['8.25', true])
```

```js
assert.deepEqual((await h.state()).business[0].taxSettings.jurisdictions.map(j => [j.rate, j.taxLabor]), [['8.25', true]])
```

```js
assert.equal(unavailable.proposal, null)
```

```js
assert.match(unavailable.label, /^Rate unavailable/)
```

```js
assert.notEqual(unavailable.parts.combined, '0')
```

```js
assert.equal(h.avatax.calls.at(-1).url, 'https://rest.avatax.com/api/v2/transactions/create')
```

```js
h.command('tax.lookup', request, { error: 'TAX_PROVIDER' })
```

```js
assert.ok(!JSON.stringify(exported).includes('fixture-avatax-license'))
```

```js
assert.ok(exported.timeline.some(e => e.kind === kind && /Avalara AvaTax/.test(e.summary) && e.command_id), `DATA-002 export ${kind}`)
```

```js
assert.ok(activity.events.some(e => e.kind === kind && /Avalara AvaTax/.test(e.summary)), `DATA-002 Activity ${kind}`)
```

### 69. tests/api/servicecall.test.mjs

Surviving registration: BOOK-005 desk creation retains request linkage, exact lines and frozen service checklists and forms under current authority

Original step: BOOK-005 desk creation retains request linkage, exact lines and frozen service checklists and forms under current authority

Assertion text count: 37; generated provider cases: 1.

```js
assert.deepEqual([job.customerId, job.siteId, job.quoteId, job.quoteRevision, job.serviceCall], [b.customer.id, siteId, null, null, { enquiryId: request?.id ?? null, by: { id: person.id, name: person.name, role: person.role }, at }])
```

```js
assert.deepEqual(job.lines, priced ? expectedLines : [])
```

```js
assert.deepEqual(job.totals, priced ? { subtotal: '236.60', gst: '17.80', total: '254.40' } : { subtotal: '0.00', gst: '0.00', total: '0.00' })
```

```js
assert.deepEqual(job.checklist.map(({ id: _id, ...item }) => item), priced ? expectedChecklist : [])
```

```js
assert.deepEqual(job.forms.map(({ id: _id, ...form }) => form).sort((a, b) => a.formId.localeCompare(b.formId)), priced ? expectedForms : [])
```

```js
assert.ok(item.id && !itemIds.has(item.id), 'each job owns distinct checklist and form copies')
```

```js
assert.deepEqual(view.jobs.find(j => j.id === job.id), job)
```

```js
assert.deepEqual(won, { ...request, version: request.version + 1, status: 'won', stageAt: at, wonAt: at, wonJobId: job.id })
```

```js
assert.deepEqual(await person.run('job.create', payload, { commandId }), job, 'a repeated command returns its original job')
```

```js
assert.equal((await h.state()).jobs.filter(j => j.id === job.id).length, 1)
```

```js
assert.equal(response.status, 200)
```

```js
person.run('job.create', payload, { error, ...options })
```

```js
assert.deepEqual(await snapshot(), before, 'refusal changes no business record or timeline event')
```

```js
assert.deepEqual([s.quotes.find(x => x.id === q.id).jobId, s.jobs.find(x => x.id === job.id).quoteId, job.quoteRevision], [job.id, q.id, 1])
```

```js
assert.deepEqual(updated.checklist.map(({ id: _id, ...item }) => item), [{ label: 'New procedure', required: true }])
```

```js
assert.deepEqual(updated.forms, [])
```

```js
assert.deepEqual(await snapshot(), beforeRestart, 'actual Worker replacement retains the complete business export')
```

```js
assert.deepEqual(s.jobs.find(j => j.id === job.id), job, 'line values and ordered checklist and form copies survive edits and restart')
```

```js
assert.deepEqual(s.enquiries.find(e => e.id === request.id), { ...request, version: request.version + 1, status: 'won', stageAt: at, wonAt: at, wonJobId: job.id })
```

```js
assert.deepEqual(await person.run('job.create', payload, { commandId }), job)
```

```js
assert.deepEqual(await snapshot(), beforeRestart, 'reads and durable replay write nothing')
```

```js
assert.equal(activityResponse.status, 200)
```

```js
assert.equal(events.length, 1, 'creation and its replays retain just one attributable event')
```

```js
assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.jobId, event.subjectId], [person.id, person.name, person.role, at, job.id, job.id])
```

```js
assert.equal(kept.length, 1)
```

```js
assert.deepEqual([kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].at, kept[0].job_id, kept[0].subject_id], [person.id, person.name, person.role, at, job.id, job.id])
```

```js
assert.ok(event.summary.includes('created as a service call without a quote'))
```

```js
assert.deepEqual([data.serviceCall, data.enquiryId], [true, request?.id ?? null])
```

```js
assert.equal((await h.request('/auth/session/revoke', { method: 'POST', body: { sessionId: b.dispatcher.session.id } })).status, 204)
```

```js
assert.equal(response.status, 401)
```

```js
assert.deepEqual(await snapshot(), before)
```

```js
h.command('job.create', personalPayload, { commandId: 'synthetic-glove-506', error: 'ERASED' })
```

```js
h.command('job.create', { customerId: customer.id, siteId: otherSite.id, title: 'After erasure' }, { error: 'ERASED' })
```

```js
assert.deepEqual(await snapshot(), erased, 'neither a saved outcome nor new creation resurrects erased work')
```

```js
assert.deepEqual(await snapshot(), erased)
```

```js
assert.ok(anonymous.erasedAt)
```

```js
assert.ok(!JSON.stringify(erased).includes(value))
```

### 70. tests/api/servicecall.test.mjs

Surviving registration: BOOK-005 desk creation retains request linkage, exact lines and frozen service checklists and forms under current authority

Original step: BOOK-005 a leaking water heater: a job with an $89.00 diagnostic fee, a flat-rate valve and 1.5 hours added on site, invoiced exactly

Assertion text count: 28; generated provider cases: 1.

```js
assert.deepEqual([request.source, request.description], ['phone', 'Water heater leaking from the relief valve'])
```

```js
b.dispatcher.run('job.create', { enquiryId: request.id, title: 'Leaking water heater', lines: [{ description: 'Diagnostic fee', quantity: '1', unitPrice: '89.00', serviceId: diag.id }], siteId: (await h.command('site.save', { customerId: (await h.command('customer.save', { name: 'Someone else' })).id, address: '9 Other St' })).id }, { error: 'SITE' })
```

```js
assert.equal(job.quoteId, null)
```

```js
assert.deepEqual(job.lines.map(l => [l.serviceId, l.quantity, l.unitPrice]), [[diag.id, '1', '89.00']])
```

```js
assert.deepEqual([job.totals.total, job.serviceCall.enquiryId], ['97.90', request.id])
```

```js
assert.equal((await h.state()).enquiries.find(e => e.id === request.id).status, 'won')
```

```js
assert.ok((await timeline()).some(s => s.includes('service call without a quote') && s.includes('no price is approved until its invoice is')))
```

```js
assert.deepEqual([visit.jobId, visit.technicianId, visit.local.date, visit.status], [job.id, b.priya.id, today, 'booked'])
```

```js
assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: new Date(Date.parse(now) + minute++ * 60_000).toISOString() } })).status, 200)
```

```js
b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: now, kind: 'line', serviceId: tape.id, quantity: '1', approval: { customerName: 'Dr Mei Lin', method: 'signed' } }, { error: 'INPUT' })
```

```js
assert.deepEqual(afterMaterialLine.captures, beforeMaterialLine.captures, 'a refused material line saves no capture')
```

```js
assert.deepEqual(afterMaterialLine.visits, beforeMaterialLine.visits, 'a refused material line leaves the visit unchanged')
```

```js
b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: now, kind: 'line', serviceId: replace.id, quantity: '1', approval: { customerName: '', method: 'signed' } }, { error: 'INPUT' })
```

```js
assert.deepEqual([material.kind, material.serviceId, material.quantity], ['material', tape.id, '1'])
```

```js
assert.deepEqual(seen.captures.filter(x => x.visitId === visit.id && x.kind === 'line').map(x => [x.serviceId, x.quantity, x.approval]), [
    [replace.id, '1', { customerName: 'Dr Mei Lin', method: 'signed' }],
    [labor.id, '1.5', { customerName: 'Dr Mei Lin', method: 'verbal' }],
  ])
```

```js
assert.deepEqual(seen.captures.filter(x => x.visitId === visit.id && x.kind === 'material').map(x => x.id), [material.id])
```

```js
assert.ok(seen.jobs.find(j => j.id === job.id).lines.every(l => l.unitPrice === undefined), 'the technician reads no prices')
```

```js
assert.ok(seen.captures.filter(x => x.kind === 'line').every(x => x.unitPrice === undefined && x.approval.customerName === 'Dr Mei Lin'))
```

```js
b.priyaPerson.run('visit.capture', { visitId: quotedVisit.id, deviceTime: now, kind: 'line', serviceId: labor.id, quantity: '1', approval: { customerName: 'Dr Mei Lin', method: 'signed' } }, { error: 'QUOTED' })
```

```js
assert.deepEqual([officeCall.quoteId, officeCall.serviceCall.enquiryId, officeCall.lines.length, officeCall.serviceCall.by.name], [null, null, 0, 'Olu Office'])
```

```js
b.office.run('job.create', { quoteId: (await acceptedQuote(h, b)).id }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'completed')
```

```js
assert.deepEqual([invoice.status, rev.approval], ['draft', null])
```

```js
assert.deepEqual(rev.lines.map(l => [l.description, l.quantity, l.total]), [
    ['Diagnostic fee', '1', '89.00'],
    ['Valve replacement (flat rate) (added on site, approved by Dr Mei Lin)', '1', '285.00'],
    ['Plumbing labor (added on site, approved by Dr Mei Lin)', '1.5', '180.00'],
    ['Thread seal tape (used on site)', '1', '4.00'],
  ])
```

```js
assert.deepEqual(rev.totals, { subtotal: '558.00', gst: '55.80', total: '613.80' })
```

```js
assert.equal(approved.status, 'approved')
```

```js
assert.equal(approved.revisions[0].approval.id, b.office.id)
```

```js
assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'invoiced')
```

### 71. tests/api/routing.test.mjs

Surviving registration: DISP-003, DISP-011: 12 visits for 3 technicians improve through a bounded background proposal, respect windows and skills, and move only on dispatcher acceptance before safe customer erasure

Original step: DISP-003, DISP-011: 12 visits for 3 technicians improve through a bounded background proposal, respect windows and skills, and move only on dispatcher acceptance before safe customer erasure

Assertion text count: 95; generated provider cases: 1.

```js
person.run('route.optimize', { date: day }, { error: 'FORBIDDEN' })
```

```js
assert.equal(queued.status, 'queued')
```

```js
assert.deepEqual((await h.state()).visits, before)
```

```js
assert.equal(ready.status, 'ready', JSON.stringify(ready))
```

```js
assert.equal(ready.moves.length, 12)
```

```js
assert.ok(ready.afterSeconds < ready.beforeSeconds)
```

```js
assert.equal(ready.savedSeconds, ready.beforeSeconds - ready.afterSeconds)
```

```js
assert.deepEqual((await h.state()).visits, before, 'even a completed proposal moves no visit')
```

```js
assert.ok(routeCalls.length > 0)
```

```js
assert.ok(routeCalls.every(c => !JSON.stringify(c.body).includes('Routing Ave') && !JSON.stringify(c.body).includes(b.customer.name)))
```

```js
assert.deepEqual(ready.moves.map(m => m.visitId).sort(), visits.map(v => v.id).sort())
```

```js
assert.deepEqual(proposed.map(v => `${v.technicianId}:${v.startAt}`).sort(), visits.map(v => `${v.technicianId}:${v.startAt}`).sort())
```

```js
assert.deepEqual(move.before, placement(visits.find(v => v.id === move.visitId)))
```

```js
assert.equal(signedOut.status, 401)
```

```js
assert.equal(integration.status, 403)
```

```js
assert.equal((await integration.json()).error.code, 'FORBIDDEN')
```

```js
custom.run(type, payload, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason }, { error: 'INPUT' })
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
assert.equal(calls(), beforeMissingReason, 'no provider request without a person’s reason')
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version - 1, reason: 'Old inspection' }, { error: 'STALE' })
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Role withdrawn during provider check' }, { error: 'AUTH' })
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Role is now viewer' }, { error: 'FORBIDDEN' })
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Branch withdrawn during provider check' }, { error: 'AUTH' })
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Now outside branch' }, { error: 'NOT_FOUND' })
```

```js
assert.ok(newLeg, 'the proposal has a newly proposed drive')
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Provider no longer offers that drive' }, { error: 'ROUTE_TRAVEL' })
```

```js
assert.ok(calls() > beforeInvalid, 'acceptance requested a fresh provider answer')
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
assert.deepEqual(await effects(h), untouched, 'no move is visible before the fresh provider reply')
```

```js
assert.equal(expectedSeconds, ready.afterSeconds + 45)
```

```js
b.office.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Less driving' }, { error: 'FORBIDDEN' })
```

```js
assert.equal(accepted.status, 'accepted')
```

```js
assert.equal(calls(), beforeAccepted + 1)
```

```js
assert.equal(accepted.acceptedSeconds, expectedSeconds)
```

```js
assert.equal(accepted.decidedAt, at)
```

```js
assert.deepEqual(accepted.decidedBy, { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' })
```

```js
assert.equal(accepted.reason, 'Keep customers in their windows with less driving')
```

```js
assert.equal(state.version, beforeVersion + 1, 'the route and all visit histories advance in one command commit')
```

```js
assert.equal(accepted.version, ready.version + 1)
```

```js
assert.ok(after.some(v => { const old = visits.find(x => x.id === v.id); return old && (old.startAt !== v.startAt || old.technicianId !== v.technicianId) }))
```

```js
assert.deepEqual(placement(visit), placement(next), `every accepted slot is retained for ${visit.id}`)
```

```js
assert.deepEqual(visit.assignments, moved ? [...old.assignments, { ...placement(next), by: accepted.decidedBy, at, reason: `Accepted route optimization: ${accepted.reason}`, reviewedConflicts: [], grantId: null }] : old.assignments)
```

```js
assert.equal(visit.version, old.version + (moved ? 1 : 0))
```

```js
assert.deepEqual(visit.arrivalWindow, original.arrivalWindow)
```

```js
assert.ok(visit.local.start >= visit.arrivalWindow.start && visit.local.start <= visit.arrivalWindow.end)
```

```js
assert.equal(Date.parse(visit.endAt) - Date.parse(visit.startAt), Date.parse(original.endAt) - Date.parse(original.startAt))
```

```js
assert.ok(tech.skills.includes(skill))
```

```js
assert.ok(tech.zips.includes(site.zip))
```

```js
assert.ok(previous.endAt <= visit.startAt)
```

```js
assert.ok(Date.parse(from.endAt) + leg.seconds * 1000 <= Date.parse(to.startAt), 'final route leaves real driving time')
```

```js
assert.deepEqual(replay, accepted)
```

```js
assert.deepEqual((await h.state()).visits, after)
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: accepted.version, reason: 'Already applied' }, { error: 'ROUTE_STATE' })
```

```js
assertTrail(h, ['route.queued', 'route.ready', 'route.accepted', 'visit.changed'])
```

```js
assert.deepEqual(applied.filter(e => e.kind === 'visit.changed').map(e => e.subjectId).sort(), changed.sort())
```

```js
assert.equal(applied.filter(e => e.kind === 'route.accepted').length, 1)
```

```js
assert.deepEqual([e.actorId, e.actorName, e.actorRole, e.at], [b.dispatcher.id, 'Sam Ortiz', 'dispatcher', at])
```

```js
assert.ok(e.summary.includes(accepted.reason))
```

```js
assert.deepEqual([exported.actor_id, exported.actor_name, exported.actor_role, exported.command_id, exported.at], [b.dispatcher.id, 'Sam Ortiz', 'dispatcher', 'accept-route-day-0001', at])
```

```js
assert.deepEqual(data.before, { technicianId: old.technicianId, ...old.local })
```

```js
assert.deepEqual(data.after, { technicianId: next.technicianId, ...next.local })
```

```js
assert.deepEqual([...data.visitIds].sort(), changed)
```

```js
assert.equal(data.driveSeconds, expectedSeconds)
```

```js
assert.deepEqual(await effects(h), retained)
```

```js
assert.deepEqual(await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: accepted.reason }, { commandId: 'accept-route-day-0001' }), accepted)
```

```js
assert.deepEqual(await effects(h), retained)
```

```js
assert.equal(calls(), callsBeforeRestart, 'replay after restart neither applies again nor calls Maps')
```

```js
assert.deepEqual((await b.priyaPerson.state()).routes, [])
```

```js
assertTrail(h, ['route.queued', 'route.ready', 'route.accepted', 'visit.changed'])
```

```js
assert.equal(route.status, 'ready')
```

```js
assert.equal(receipt.outcome, 'complete')
```

```js
assert.equal(runningBeforeErase.status, 'running')
```

```js
assert.equal(queued.status, 'queued')
```

```js
assert.equal(after.status, before.status === 'accepted' ? 'accepted' : 'discarded', `erasure closes undecided work and retains the decided outcome`)
```

```js
assert.deepEqual([after.date, after.branchId, after.technicianId, after.requestedBy, after.createdAt], [before.date, before.branchId, before.technicianId, before.requestedBy, before.createdAt])
```

```js
assert.equal(move.visitId, '[erased]')
```

```js
assert.equal(after.reason, 'Customer personal data erased; prepare a new route.')
```

```js
assert.deepEqual(erased.routes.find(r => r.id === peerRoute.id), peerRoute)
```

```js
assert.deepEqual(peerVisits, peerBefore, 'the unrelated customer retains exact appointments and histories')
```

```js
assert.equal(peerVisits.length, 2)
```

```js
assert.ok(peerVisits.every(v => erased.jobs.find(j => j.id === v.jobId).customerId === peer.id))
```

```js
assert.deepEqual((await h.state()).routes, erased.routes, 'late provider success cannot resurrect erased in-flight work')
```

```js
assert.equal(h.maps.calls.length, calls, 'erased queued work never reaches Maps')
```

```js
b.dispatcher.run('route.optimize', { date: route.date }, { commandId, error: 'ERASED' })
```

```js
b.dispatcher.run('route.accept', { routeId: closed.id, version: closed.version, reason: 'Erased route' }, { error: 'ROUTE_STATE' })
```

```js
assert.deepEqual((await h.state()).visits, peerVisits)
```

```js
assertTrail(h, ['privacy.erase'])
```

```js
assert.equal(move.visitId, '[erased]')
```

```js
assert.ok(!encoded.includes(visit.id), 'erased references are absent from routes and their trail')
```

```js
assert.deepEqual(await effects(h), retained)
```

### 72. tests/api/routing.test.mjs

Surviving registration: DISP-003, DISP-011: 12 visits for 3 technicians improve through a bounded background proposal, respect windows and skills, and move only on dispatcher acceptance before safe customer erasure

Original step: DISP-003, DISP-011: stale eligibility, discard and a routing-provider refusal never change appointments

Assertion text count: 46; generated provider cases: 1.

```js
b.dispatcher.run('route.accept', { routeId: route.id, version: route.version, reason: 'Eligibility changed during provider check' }, { error: 'ROUTE_STALE' })
```

```js
assert.deepEqual(await effects(h), original, 'a changed dependency cannot commit even one move or assignment event')
```

```js
b.dispatcher.run('route.accept', { routeId: route.id, version: route.version, reason: 'Rebalance' }, { error: 'ROUTE_STALE' })
```

```js
assert.deepEqual((await h.state()).visits, unchanged)
```

```js
assert.equal(failed.status, 'failed')
```

```js
assert.match(failed.problem, /Google Maps/)
```

```js
assert.deepEqual((await h.state()).visits, unchanged)
```

```js
assert.ok(!JSON.stringify(failed).includes('synthetic-glove-7'))
```

```js
assert.equal(inspected.status, 'ready')
```

```js
b.dispatcher.run('route.accept', { routeId: inspected.id, version: inspected.version, reason: 'Day changed during provider check' }, { error: 'ROUTE_STALE' })
```

```js
assert.deepEqual(await effects(h), afterBooking, 'the new booking survives and none of the stale proposal moves or histories apply')
```

```js
assert.equal(reviewed.status, 'ready')
```

```js
b.dispatcher.run('route.accept', { routeId: reviewed.id, version: reviewed.version, reason: 'Provider unavailable' }, { error: 'MAPS' })
```

```js
assert.deepEqual(await effects(h), beforeRefusal)
```

```js
b.dispatcher.run('route.accept', { routeId: reviewed.id, version: reviewed.version, reason: 'Unusable provider answer' }, { error: 'MAPS' })
```

```js
assert.deepEqual(await effects(h), beforeRefusal)
```

```js
b.dispatcher.run('route.accept', { routeId: reviewed.id, version: reviewed.version, reason: 'Missing provider routes' }, { error: 'ROUTE_TRAVEL' })
```

```js
assert.deepEqual(await effects(h), beforeRefusal)
```

```js
person.run('route.discard', { routeId: reviewed.id, version: reviewed.version }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await effects(h), beforeRefusal)
```

```js
assert.equal(discarded.status, 'discarded')
```

```js
assert.deepEqual(discarded.decidedBy, { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' })
```

```js
assert.equal(discarded.decidedAt, at)
```

```js
assert.deepEqual(discarded.moves, reviewed.moves)
```

```js
assert.deepEqual(decided.visits, beforeRefusal.visits)
```

```js
assert.deepEqual(decided.events, beforeRefusal.events)
```

```js
assert.deepEqual(await b.dispatcher.run('route.discard', { routeId: reviewed.id, version: reviewed.version }, { commandId: 'discard-reviewed-route-0001' }), discarded)
```

```js
b.dispatcher.run('route.accept', { routeId: discarded.id, version: discarded.version, reason: 'Discarded proposal' }, { error: 'ROUTE_STATE' })
```

```js
assert.deepEqual(await effects(h), decided)
```

```js
assert.equal(h.maps.calls.length, callsBeforeDiscard)
```

```js
assert.deepEqual((await effects(h)).visits, decided.visits)
```

```js
assert.deepEqual((await effects(h)).events, decided.events)
```

```js
assert.equal(current.status, 'running')
```

```js
assert.deepEqual(await effects(h), discardedInFlight, 'late background result cannot replace the explicit discard')
```

```js
assert.deepEqual(discardedInFlight.visits, decided.visits)
```

```js
assert.deepEqual(discardedInFlight.events, decided.events)
```

```js
b.dispatcher.run('route.accept', { routeId: failed.id, version: failed.version, reason: 'Expired work' }, { error: 'ROUTE_STATE' })
```

```js
assert.equal(beforeExpiry.status, 'running')
```

```js
assert.equal(expired.status, 'failed')
```

```js
assert.match(expired.problem, /expired/)
```

```js
assert.equal(expired.finishedAt, '2026-11-03T00:01:00.000Z')
```

```js
assert.deepEqual(await effects(h), expiredEffects, 'late provider success cannot revive expired work')
```

```js
assert.deepEqual(expiredEffects.visits, decided.visits)
```

```js
assert.deepEqual(expiredEffects.events, decided.events)
```

```js
assert.deepEqual(await effects(h), retained)
```

```js
assertTrail(h, ['route.discarded', 'route.failed'])
```

### 73. tests/api/merge.test.mjs

Surviving registration: CUST-005: nine customers sharing a phone are flagged, merged into one and unmerged

Original step: CUST-005: nine customers sharing a phone are flagged, merged into one and unmerged

Assertion text count: 18; generated provider cases: 1.

```js
assert.deepEqual(others.at(-1).duplicates.map(d => d.matches), Array(8).fill(['phone']))
```

```js
assert.equal(others.at(-1).duplicates.length, 8)
```

```js
assert.deepEqual(loner.duplicates, [])
```

```js
assert.equal(review.candidates.length, 8)
```

```js
assert.deepEqual(held[b.customer.id], { sites: 1, enquiries: 0, quotes: 1, jobs: 1, invoices: 1, payments: 0 })
```

```js
assert.equal((await h.request(`/api/glove/customers/${survivor.id}/duplicates`, { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.ok(after[kind].every(r => r.customerId === survivor.id || r.customerId === loner.id), `every ${kind} hangs off the survivor`)
```

```js
assert.deepEqual([kept.name, kept.email], ['Harbourview Dental', 'accounts@harbourview.example'])
```

```js
assert.ok(kept.contacts.some(c => c.name === 'Dr Mei Lin'), 'the merged contact person stays a contact')
```

```js
assert.ok(mergedIds.every(id => after.customers.find(c => c.id === id).mergedInto === survivor.id))
```

```js
assert.equal(after.invoices.find(i => i.id === invoice.id).customerId, survivor.id)
```

```js
b.dispatcher.run('customer.merge', { survivorId: survivor.id, mergedIds: [b.customer.id], versions: Object.fromEntries(after.customers.map(c => [c.id, c.version])) }, { error: 'MERGED' })
```

```js
assert.equal(after.jobs.find(j => j.id === job.id).customerId, b.customer.id)
```

```js
assert.equal(after.invoices.find(i => i.id === invoice.id).customerId, b.customer.id)
```

```js
assert.equal(after.sites.find(x => x.address === '22 Wharf Rd, Birchgrove').customerId, survivor.id)
```

```js
assert.ok(after.customers.every(c => !c.mergedInto))
```

```js
assert.equal(after.customers.find(c => c.id === survivor.id).name, 'Harbourview 1')
```

```js
b.dispatcher.run('customer.unmerge', { mergeId: again.id, version: again.version }, { error: 'CHANGED_SINCE' })
```

### 74. tests/api/merge.test.mjs

Surviving registration: CUST-005: nine customers sharing a phone are flagged, merged into one and unmerged

Original step: CUST-005: the move-in preview flags incoming customers that duplicate Glove customers

Assertion text count: 1; generated provider cases: 1.

```js
assert.deepEqual(staged.preview.possibleDuplicates.map(d => [d.name, d.duplicates.map(x => [x.name, x.matches])]), [['Rozelle Physio', [['R. Physio', ['phone']]]]])
```

### 75. tests/api/reminders.test.mjs

Surviving registration: COMM-003, COMM-019, COMM-020 owner-approved email templates confirm and move visits including assessments, respect consent and quiet hours, and never replay an attempt

Original step: COMM-003, COMM-019, COMM-020 owner-approved email templates confirm and move visits including assessments, respect consent and quiet hours, and never replay an attempt

Assertion text count: 94; generated provider cases: 1.

```js
b.office.run('reminder.configure', { enabled: false }, { error: 'FORBIDDEN' })
```

```js
h.command('reminder.configure', { version: (await h.state()).business[0].version, enabled: true, approved: false }, { error: 'CONSENT' })
```

```js
assert.match(preview.visitReminder, /stop automatic emails/)
```

```js
assert.equal((await h.state()).business[0].messageAutomation, undefined)
```

```js
assert.equal(policy.preview.visitReminder, `Bring access instructions for 2026-11-01 at 10:00.\n\nHarbour Air & Electrical\n1400 Synthetic Street, Austin TX 78701\nContact the office to confirm, reschedule, or stop automatic emails. Replies are handled by the office.`)
```

```js
h.command('reminder.configure', { version: policy.version, enabled: true, approved: true, templates: { ...templates, visitReminder: '{{secret}}' }, visitHours: [24], paymentDays: [], quoteDays: [] }, { error: 'INPUT' })
```

```js
assert.equal(h.email.sent.length, 0, 'a recorded address alone never consents')
```

```js
assert.equal(h.email.sent.length, 0, 'quiet hours hold confirmations')
```

```js
assert.equal(h.email.sent.length, 1)
```

```js
assert.equal(body(h.email.sent[0]), `Booked Harbourview Dental on ${day(2)} at 10:00 (UTC).\n\nHarbour Air & Electrical\n1400 Synthetic Street, Austin TX 78701\nContact the office to confirm, reschedule, or stop automatic emails. Replies are handled by the office.`)
```

```js
assert.equal((await messages(h, 'visitReminder')).length, 1)
```

```js
assert.match(body(h.email.sent.at(-1)), /Bring access instructions/)
```

```js
assert.equal((await messages(h, 'visitReminder')).length, 2)
```

```js
assert.equal(h.email.sent.length, 3, 'replaying cron does not resend')
```

```js
b.office.run('visit.replyLink', { visitId: visit.id, version: visit.version }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual([visibleVisit.visit.date, visibleVisit.visit.start], [visit.local.date, visit.local.start])
```

```js
assert.ok(!JSON.stringify(visibleVisit).includes(b.customer.email))
```

```js
assert.ok(!JSON.stringify(visibleVisit).includes(b.site.address))
```

```js
assert.equal(requestReply.status, 200, await requestReply.clone().text())
```

```js
assert.equal((await publicReply('POST', { action: 'reschedule' })).status, 200)
```

```js
assert.equal((await publicReply('POST', { action: 'confirm' })).status, 409)
```

```js
assert.equal(requested.length, 1, 'a replay opens no duplicate reschedule request')
```

```js
assert.equal(requested[0].status, 'new')
```

```js
assert.equal(responded.visits.find(v => v.id === visit.id).startAt, visit.startAt, 'a request never changes the booking')
```

```js
assert.ok(responded.events.some(e => e.kind === 'visit.customer.reschedule' && e.jobId === job.id))
```

```js
assert.ok(!JSON.stringify(await (await h.request('/api/glove/export')).json()).includes(replyToken))
```

```js
assert.deepEqual(await h.command('visit.replyLink', { visitId: visit.id, version: visit.version }, { commandId: replyId }), issued, 'recovery never sends another link')
```

```js
assert.equal((await messages(h, 'moved')).length, 1)
```

```js
assert.equal((await publicReply()).status, 404, 'a changed schedule invalidates the old response credential')
```

```js
assert.equal((await messages(h, 'cancelled')).length, 1)
```

```js
assert.equal(h.email.sent.length, count, 'cancelled visit has no later reminders')
```

```js
assert.equal((await messages(h, 'confirmation')).length, 2)
```

```js
assert.equal((await postEvents(h, { raw: JSON.stringify(delivery), headers: {} })).status, 401)
```

```js
assert.equal((await postEvents(h, signer.signed(delivery, { at: timestamp }))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[first.id].status, 'delivered')
```

```js
assert.equal((await publicReply('POST', { action: 'confirm' }, confirmToken)).status, 200)
```

```js
assert.equal(assessmentVisit.customerResponses[0].action, 'confirm')
```

```js
assert.equal((await publicReply('GET', undefined, confirmToken)).status, 404, 'withdrawal closes the reply door immediately')
```

```js
assert.equal(h.email.sent.length, count + 2, 'withdrawal suppresses assessment reminder')
```

```js
b.office.run('report.link', { reportId: report.id, email: true }, { error: 'FORBIDDEN' })
```

```js
assert.equal(reportLink.token, undefined, 'an emailed report credential is not exposed in the command response')
```

```js
assert.ok(body(reportMail).startsWith(`Completed Service visit on ${day(5)}: your report is ready.`))
```

```js
assert.match(body(reportMail), /stop automatic emails/)
```

```js
assert.equal(receivedReport.status, 200)
```

```js
assert.equal((await receivedReport.json()).report.summary, 'synthetic-glove-2 completed work')
```

```js
assert.deepEqual(await h.command('report.link', reportPayload, { commandId: reportCommand }), reportLink)
```

```js
assert.equal(h.email.sent.length, sentCount)
```

```js
assert.equal((await h.state()).messageStates[reportMessage.id].status, 'accepted')
```

```js
assert.equal((await postEvents(h, signer.signed(reportEvent, { at: reportEvent[0].timestamp }))).status, 200)
```

```js
assert.ok(reportTimeline.some(e => e.kind === 'email.delivered' && e.subjectId === reportMessage.id))
```

```js
assert.ok(reportStream.some(e => e.id === `email:${reportMessage.id}` && /delivered/i.test(e.delivery)))
```

```js
assert.ok(!JSON.stringify(privateExport).includes(reportToken))
```

```js
assert.ok(privateExport.timeline.some(e => e.kind === 'email.delivered' && e.subject_id === reportMessage.id))
```

```js
assertTrail(h, ['visit.replyLink.sent', 'visit.customer.reschedule', 'visit.customer.confirm', 'report.link.created', 'email.accepted'])
```

```js
assert.equal(h.twilio.calls.length, 0, 'customer-local quiet hours hold customer texts')
```

```js
assert.equal(h.twilio.calls.length, 0, '07:00 in the recorded customer zone stays quiet even while the UTC branch is open')
```

```js
assert.equal(confirmations.length, 1)
```

```js
assert.equal(firstText.body.Body, `Booked Harbourview Dental on ${day(6)} at 12:00 (UTC).\n\nHarbour Air & Electrical\nReply CONFIRM to confirm or RESCHEDULE to ask the office for another time.\nReply STOP to stop texts, HELP for help, START to request texts again.`)
```

```js
assert.equal(h.twilio.calls.length, textCount)
```

```js
assert.equal((await postSms(h, invalidDelivery)).status, 401)
```

```js
assert.equal((await h.state()).events.length, eventsBefore, 'unauthenticated text callbacks write no business fact')
```

```js
assert.equal((await postSms(h, delivered())).status, 200)
```

```js
assert.equal((await postSms(h, delivered())).status, 200)
```

```js
assert.equal((await h.state()).messageStates[confirmations[0].id].status, 'delivered')
```

```js
assert.ok(otherText, 'the due reminder is a separate text attempt')
```

```js
assert.equal((await postSms(h, failed())).status, 200)
```

```js
assert.equal((await postSms(h, failed())).status, 200)
```

```js
assert.equal((await h.state()).messageStates[failedMessage.id].status, 'failed')
```

```js
assert.ok(textStream.some(e => e.channel === 'text message' && e.direction === 'outbound' && e.author && /delivered/i.test(e.delivery)))
```

```js
assert.equal((await postSms(h, reschedule())).status, 200)
```

```js
assert.equal((await postSms(h, reschedule())).status, 200)
```

```js
assert.equal(smsState.enquiries.filter(e => e.visitId === smsVisit.id && e.source === 'text').length, 1)
```

```js
assert.equal(smsState.visits.find(v => v.id === smsVisit.id).startAt, smsVisit.startAt)
```

```js
assert.ok(replyStream.some(e => e.channel === 'text message' && e.direction === 'inbound' && e.jobId === smsJob.id && e.kind === 'text reply: reschedule' && e.author))
```

```js
assert.equal((await postSms(h, stop())).status, 200)
```

```js
assert.equal((await postSms(h, stop())).status, 200)
```

```js
assert.equal(stoppedCustomer.smsOptOut.blocked, true)
```

```js
assert.equal(stoppedCustomer.automaticSms.visits.enabled, false)
```

```js
assert.equal(h.twilio.calls.length, beforeStoppedTick)
```

```js
assert.equal(pushed.skippedDoNotContact, 1)
```

```js
assert.equal(h.marketing.length, 0)
```

```js
assert.equal((await postSms(h, h.twilio.inbound(h.origin, '+13125550123', 'START'))).status, 200)
```

```js
assert.equal(restarted.smsOptOut.blocked, false)
```

```js
assert.equal(restarted.automaticSms.visits.enabled, false, 'START never manufactures fresh purpose consent')
```

```js
assertTrail(h, ['sms.queued', 'sms.accepted', 'sms.delivered', 'sms.failed', 'sms.received.reschedule', 'sms.received.stop', 'sms.received.start'])
```

```js
assert.ok(smsExport.timeline.some(e => e.kind === 'sms.delivered'))
```

```js
assert.ok(smsExport.timeline.some(e => e.kind === 'visit.customer.reschedule'))
```

```js
assert.ok(!JSON.stringify(smsExport).includes(h.twilio.authToken))
```

```js
assert.equal((await publicReply('GET', undefined, confirmToken)).status, 404)
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_visit_reply_secrets').first()).n, 0)
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_attempts').first()).n, 0)
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_receipts').first()).n, 0)
```

```js
assert.equal((await h.request('/api/glove/public/reports', { as: '', headers: { authorization: `Bearer ${reportToken}` } })).status, 404)
```

```js
assert.ok(privateExport.timeline.some(e => e.kind === 'email.delivered'))
```

### 76. tests/api/reminders.test.mjs

Surviving registration: COMM-003, COMM-019, COMM-020 owner-approved email templates confirm and move visits including assessments, respect consent and quiet hours, and never replay an attempt

Original step: Erasure during an automatic provider attempt never restores recipient addresses in the outcome

Assertion text count: 9; generated provider cases: 1.

```js
assert.equal(h.email.sent.length, 1, 'the already-started provider request cannot be recalled')
```

```js
assert.ok(!JSON.stringify(exported).includes(b.customer.email), 'provider response does not restore an erased address')
```

```js
assert.equal((await h.state()).messages.length, 0)
```

```js
assert.ok(!JSON.stringify(smsExport).includes('+13125550123'))
```

```js
assert.equal((await sms.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_attempts').first()).n, 0)
```

```js
assert.equal((await sms.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_receipts').first()).n, 0)
```

```js
assert.equal((await sms.state()).messages.length, 0)
```

```js
assert.equal((await postSms(sms, lateDelivery)).status, 200)
```

```js
assert.equal((await sms.state()).messages.length, 0, 'a late signed callback never restores an erased SMS message')
```

### 77. tests/api/reminders.test.mjs

Surviving registration: PAY-005 due-date reminders stop after payment or dispute and aging exposes their actual state

Original step: PAY-005 due-date reminders stop after payment or dispute and aging exposes their actual state

Assertion text count: 9; generated provider cases: 1.

```js
assert.equal(h.email.sent.length, 2)
```

```js
assert.ok(h.email.sent.every(m => !/https?:|checkout|token=/i.test(body(m))), 'no checkout link or stored session reused')
```

```js
assert.equal((await messages(h, 'paymentReminder')).filter(m => m.subjectId === first.id).length, 1)
```

```js
assert.equal((await messages(h, 'paymentReminder')).filter(m => m.subjectId === second.id).length, 2)
```

```js
assert.match(JSON.stringify(report), /2 reminder steps reserved/)
```

```js
b.office.run('invoice.dispute', { invoiceId: inv.id, version: inv.version, disputed: true, reason: 'Question about work' }, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.email.sent.length, 3)
```

```js
assert.match(JSON.stringify(disputed), /Stopped: invoice disputed/)
```

```js
assertTrail(h, ['invoice.dispute', 'email.queued', 'email.accepted'])
```

### 78. tests/api/reminders.test.mjs

Surviving registration: PAY-005 due-date reminders stop after payment or dispute and aging exposes their actual state

Original step: QUOTE-004 three quote sequences stop on day-three answer and day-seven expiry without reusing customer links

Assertion text count: 22; generated provider cases: 1.

```js
assert.equal(h.email.sent.length, 0)
```

```js
assert.equal(h.email.sent.length, 3)
```

```js
assert.equal(h.email.sent.length, 5)
```

```js
assert.equal(h.email.sent.length, 6)
```

```js
assert.equal(h.email.sent.length, 6)
```

```js
assert.deepEqual(quotes.map(q => sent.filter(m => m.subjectId === q.id).length), [3, 1, 2])
```

```js
assert.deepEqual(quotes.map(q => textSteps.filter(m => m.subjectId === q.id).length), [3, 1, 2])
```

```js
assert.ok(h.twilio.calls.every(c => !c.body || c.body.Body.endsWith('Reply STOP to stop texts, HELP for help, START to request texts again.')))
```

```js
assert.deepEqual(quotes.map(q => taskQuotes.find(r => r.id === q.id).followupTasks.length), [3, 1, 2])
```

```js
assert.ok(taskQuotes.find(q => q.id === quotes[1].id).followupTasks.every(t => t.status === 'stopped'))
```

```js
assert.ok(taskQuotes.find(q => q.id === quotes[2].id).followupTasks.every(t => t.status === 'stopped'))
```

```js
assert.ok((await h.state()).events.some(e => e.kind === 'quote.followupTask'))
```

```js
assert.ok(h.email.sent.every(m => /\/email-preferences#token=gle_/.test(body(m)) && body(m).includes('1400 Synthetic Street, Austin TX 78701') && !body(m).includes('/quote#token=')), 'each quote follow-up has the mandatory unsubscribe link and postal address, never a quote bearer')
```

```js
assert.equal((await preference()).status, 200)
```

```js
assert.equal((await h.state()).events.length, beforeRead, 'opening an unsubscribe link never changes consent')
```

```js
assert.equal(withdrawal.status, 200, await withdrawal.clone().text())
```

```js
assert.equal((await preference('POST', { stop: true })).status, 200)
```

```js
assert.equal((await h.state()).customers.find(c => c.id === b.customer.id).automaticEmail.quotes.enabled, false)
```

```js
assert.equal(h.email.sent.length, 6, 'withdrawal stops a later still-valid unanswered quote step')
```

```js
assert.ok((await h.state()).quotes.find(q => q.id === quotes[0].id).followupTasks.every(t => t.status === 'stopped'), 'expiry retires pending call tasks even when no new message is due')
```

```js
assert.ok(!JSON.stringify(exported).includes(customer.email))
```

```js
assert.equal(h.email.sent.length, 6)
```

### 79. tests/api/push.test.mjs

Surviving registration: API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id

Original step: FIELD-004, FIELD-009, FIELD-010 only the owner turns notifications on, and the VAPID private key never leaves the server

Assertion text count: 4; generated provider cases: 1.

```js
b.priyaPerson.run('push.subscribe', { endpoint: priyaUrl, keys: priyaPhone.keys }, { error: 'PUSH' })
```

```js
b.office.run('push.setup', {}, { error: 'FORBIDDEN' })
```

```js
assert.equal(Buffer.from(publicKey, 'base64url').length, 65)
```

```js
assert.doesNotMatch(await (await h.request(path)).text(), new RegExp(d))
```

### 80. tests/api/push.test.mjs

Surviving registration: API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id

Original step: FIELD-004, FIELD-009, FIELD-010 a technician subscribes their own phone; agents and desk roles cannot, and each person reads only their own phones

Assertion text count: 9; generated provider cases: 1.

```js
b.priyaPerson.run('push.subscribe', { endpoint: 'http://push.example.test/send/plain', keys: priyaPhone.keys }, { error: 'INPUT' })
```

```js
b.priyaPerson.run('push.subscribe', { endpoint: priyaUrl, keys: { p256dh: 'AAAA', auth: priyaPhone.keys.auth } }, { error: 'INPUT' })
```

```js
b.agent.run('push.subscribe', { endpoint: 'https://push.example.test/send/agent', keys: tomPhone.keys }, { error: 'FORBIDDEN' })
```

```js
b.office.run('push.subscribe', { endpoint: 'https://push.example.test/send/office', keys: tomPhone.keys }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(mine.devices.map(d => [d.device, d.thisSession, d.lastOutcome]), [['iPhone', true, null]])
```

```js
assert.doesNotMatch(JSON.stringify(mine), /push\.example\.test|p256dh/, 'the endpoint and keys are not read back')
```

```js
assert.deepEqual((await devices(b.tomPerson)).devices.map(d => d.device), ['Android phone'])
```

```js
assert.deepEqual((await devices(b.office)).devices, [])
```

```js
assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /push\.example\.test/)
```

### 81. tests/api/push.test.mjs

Surviving registration: API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id

Original step: FIELD-004, FIELD-009, FIELD-010 new, moved and canceled visits each reach the technician's phone, signed with the VAPID key and encrypted for that phone

Assertion text count: 9; generated provider cases: 1.

```js
assert.deepEqual(priya.map(p => [p.title, p.body, p.jobId]), [['Glove', 'New visit on your schedule', job.id], ['Glove', 'Visit moved', job.id], ['Glove', 'Visit moved off your schedule', job.id]])
```

```js
assert.deepEqual(tom.map(p => [p.body, p.jobId]), [['New visit on your schedule', job.id], ['Visit canceled', job.id]])
```

```js
assert.deepEqual(Object.keys(p).filter(k => !['vapid', 'encoding'].includes(k)).sort(), ['body', 'jobId', 'title'], 'nothing but the line and the job id')
```

```js
assert.equal(p.encoding, 'aes128gcm')
```

```js
assert.equal(p.vapid.k, publicKey)
```

```js
assert.deepEqual([p.vapid.header.alg, p.vapid.claims.aud, p.vapid.claims.sub], ['ES256', 'https://push.example.test', 'mailto:office@harbourair.example'])
```

```js
assert.ok(p.vapid.claims.exp * 1000 > Date.now())
```

```js
assert.doesNotMatch(sent.body.toString('latin1'), /Harbourview|Harbour St|Rooftop|Mei Lin/)
```

```js
assert.equal((await devices(b.priyaPerson)).devices[0].lastOutcome, 'Handed to the push service')
```

### 82. tests/api/push.test.mjs

Surviving registration: API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id

Original step: FIELD-004, FIELD-009, FIELD-010 a failed push is labelled and not retried; a subscription the push service no longer knows is deleted

Assertion text count: 3; generated provider cases: 1.

```js
assert.equal(h.pushes.sent.length, before + 1, 'sent once')
```

```js
assert.equal((await devices(b.tomPerson)).devices[0].lastOutcome, 'Not sent: the push service answered HTTP 500')
```

```js
assert.deepEqual(await rows(b.tomPerson.id), [])
```

### 83. tests/api/push.test.mjs

Surviving registration: API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id

Original step: FIELD-004, FIELD-009, FIELD-010 sign-out and role loss delete the phone's subscription, and nothing more is sent to it

Assertion text count: 4; generated provider cases: 1.

```js
assert.equal(signedOut.status, 204)
```

```js
assert.deepEqual(await rows(b.tomPerson.id), [])
```

```js
assert.equal(h.pushes.sent.length, before, 'no push to a signed-out phone')
```

```js
assert.deepEqual(await rows(b.priyaPerson.id), [])
```

### 84. tests/api/push.test.mjs

Surviving registration: API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id

Original step: FIELD-004, FIELD-009, FIELD-010 turning notifications off deletes every phone's subscription and the key

Assertion text count: 4; generated provider cases: 1.

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_push_subscriptions').first()).n, 0)
```

```js
assert.equal(await h.db.prepare("SELECT value FROM glove_provider_keys WHERE provider='vapid'").first(), null)
```

```js
back.run('push.subscribe', { endpoint: 'https://push.example.test/send/pat', keys: priyaPhone.keys }, { error: 'PUSH' })
```

```js
assertTrail(h, ['push.enabled', 'push.subscribed', 'push.unsubscribed', 'push.outcome', 'push.disabled'])
```

### 85. tests/api/payroll.test.mjs

Surviving registration: COST-002, COST-006, COST-007 a 44-hour week is approved by the owner, split at 40 hours and under the daily rule, and exported for Gusto, ADP RUN and QuickBooks Payroll without the subcontractor

Original step: COST-002, COST-006, COST-007 the weekly timesheet rolls up clock and job time and flags overtime past 40 hours a week

Assertion text count: 4; generated provider cases: 1.

```js
assert.deepEqual([s.hours, s.overtimeFlag, s.status, s.onTheClock], [{ worked: '44.00', job: '2.50', travel: '0.00', regular: '40.00', overtime: '4.00', doubleTime: '0.00' }, true, 'not approved', false])
```

```js
assert.deepEqual(s.days.map(d => [d.date, d.hours.worked, d.hours.regular, d.hours.overtime]), [['2026-11-02', '13.00', '13.00', '0.00'], ['2026-11-03', '10.00', '10.00', '0.00'], ['2026-11-04', '10.00', '10.00', '0.00'], ['2026-11-05', '7.00', '7.00', '0.00'], ['2026-11-06', '4.00', '0.00', '4.00'], ['2026-11-07', '0.00', '0.00', '0.00'], ['2026-11-08', '0.00', '0.00', '0.00']])
```

```js
assert.equal((await read('/api/glove/timesheets?week=2026-11-03')).status, 400, 'a workweek starts on the owner\'s week-start day')
```

```js
assert.deepEqual(own.map(x => [x.technicianId, x.hours.worked]), [[priya.id, '44.00']], 'a technician reads only their own timesheet')
```

### 86. tests/api/payroll.test.mjs

Surviving registration: COST-002, COST-006, COST-007 a 44-hour week is approved by the owner, split at 40 hours and under the daily rule, and exported for Gusto, ADP RUN and QuickBooks Payroll without the subcontractor

Original step: COST-002, COST-006, COST-007 only the owner approves, and only approved weeks of W-2 people reach the payroll files

Assertion text count: 16; generated provider cases: 1.

```js
assert.deepEqual(before.people, [])
```

```js
assert.deepEqual(before.left.map(x => [x.name, x.reason]), [['Priya N.', 'week of 2026-11-02 not approved'], ['Tom B.', '1099 subcontractor: paid through the 1099-NEC totals, not payroll']])
```

```js
person.run('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-02' }, { error: 'FORBIDDEN' })
```

```js
h.command('timesheet.approve', { technicianId: tom.id, weekStart: '2026-11-02' }, { error: 'SUBCONTRACTOR' })
```

```js
h.command('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-09' }, { error: 'NO_TIME' })
```

```js
assert.deepEqual([approved.timesheet.status, approved.minutes], ['approved', { worked: 2640, job: 150, travel: 0, regular: 2400, overtime: 240, doubleTime: 0 }])
```

```js
h.command('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-02' }, { error: 'APPROVED' })
```

```js
assert.equal((await sheet()).status, 'approved')
```

```js
assert.equal((await read(`/api/glove/reports/payroll.json?${period}`, b.dispatcher.cookie)).status, 403, 'the payroll files are the owner\'s and the office\'s, like the other exports')
```

```js
assert.equal(gusto.body, csv([['last_name', 'first_name', 'gusto_employee_id', 'workweeks', 'regular_hours', 'overtime_hours', 'double_overtime_hours', 'commission'], ['N.', 'Priya', '104', '2026-11-02 - 2026-11-08', '40.00', '4.00', '0.00', '0.00']]), 'Gusto Smart Import gets each workweek\'s hours with its date range')
```

```js
assert.equal((await read(`/api/glove/reports/payroll-quickbooks.csv?${period}`)).body, csv([['Employee', 'Date', 'Pay item', 'Hours', 'Amount'], ['Priya N.', '11/02/2026', 'Regular', '13.00', ''], ['Priya N.', '11/03/2026', 'Regular', '10.00', ''], ['Priya N.', '11/04/2026', 'Regular', '10.00', ''], ['Priya N.', '11/05/2026', 'Regular', '7.00', ''], ['Priya N.', '11/06/2026', 'Overtime', '4.00', '']]))
```

```js
assert.equal((await read(`/api/glove/reports/payroll-adp-run.csv?${period}`)).status, 409, 'ADP RUN needs the company code first')
```

```js
b.office.run('payroll.settings', { adp: { companyCode: 'G3X', payFrequency: 'W' } }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await read(`/api/glove/reports/payroll-adp-run.csv?${period}`)).body, '##GENERIC## V1.0\r\n' + csv([['IID', 'Pay Frequency', 'Pay Period Start Date', 'Pay Period End Date', 'Employee ID', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code'], ['G3X', 'W', '11/02/2026', '11/08/2026', '104', 'REG', '40.00', '', '0', '', 'BASE'], ['G3X', 'W', '11/02/2026', '11/08/2026', '104', 'OTP', '4.00', '', '0', '', 'BASE']]))
```

```js
assert.doesNotMatch((await read(`/api/glove/reports/payroll-${kind}.csv?${period}`)).body, /Tom|9876/, `${kind} carries no subcontractor`)
```

```js
assert.deepEqual(nec.rows.map(r => [r.payeeName, r.total]), [['Tom Brooks Electric', '450.00']], 'the subcontractor\'s total is in the 1099 export')
```

### 87. tests/api/payroll.test.mjs

Surviving registration: COST-002, COST-006, COST-007 a 44-hour week is approved by the owner, split at 40 hours and under the daily rule, and exported for Gusto, ADP RUN and QuickBooks Payroll without the subcontractor

Original step: COST-002, COST-006, COST-007 the owner's daily overtime rule re-splits the week, which needs approving again before it exports

Assertion text count: 7; generated provider cases: 1.

```js
h.command('payroll.settings', { weekStart: 'sunday' }, { error: 'WORKWEEK_FIXED' })
```

```js
assert.deepEqual([s.status, s.hours.regular, s.hours.overtime, s.hours.doubleTime], ['changed since approval', '35.00', '8.00', '1.00'])
```

```js
assert.deepEqual(s.days.slice(0, 5).map(d => [d.hours.regular, d.hours.overtime, d.hours.doubleTime]), [['8.00', '4.00', '1.00'], ['8.00', '2.00', '0.00'], ['8.00', '2.00', '0.00'], ['7.00', '0.00', '0.00'], ['4.00', '0.00', '0.00']])
```

```js
assert.deepEqual((await read(`/api/glove/reports/payroll.json?${period}`)).body.left.map(x => x.reason)[0], 'week of 2026-11-02 changed since approval')
```

```js
assert.match((await read(`/api/glove/reports/payroll-gusto.csv?${period}`)).body, /\r\nN\.,Priya,104,2026-11-02 - 2026-11-08,35\.00,8\.00,1\.00,0\.00\r\n$/)
```

```js
assertTrail(h, ['timesheet.approved', 'payroll.settings'])
```

```js
assert.deepEqual(exported.timesheets.map(x => [x.technicianId, x.weekStart, x.version, x.minutes.doubleTime]), [[priya.id, '2026-11-02', 2, 60]])
```

### 88. tests/api/conversation.test.mjs

Surviving registration: COMM-007 a logged call, a logged note, today's real sends and agent actions read in order from the customer and the job

Original step: COMM-007 the desk logs calls and notes, refuses field and agent logs, and reads ordered customer and job streams with direction, channel, author and delivery

Assertion text count: 13; generated provider cases: 1.

```js
b.office.run('conversation.log', { customerId: b.customer.id, kind: 'note' }, { error: 'INPUT' })
```

```js
b.office.run('conversation.log', { customerId: b.customer.id, kind: 'call', direction: 'inbound', outcome: 'missed' }, { error: 'INPUT' })
```

```js
person.run('conversation.log', { customerId: b.customer.id, kind: 'note', text: 'x' }, { error: 'FORBIDDEN' })
```

```js
b.office.run('conversation.log', { customerId: other.id, jobId: job.id, kind: 'note', text: 'Wrong customer' }, { error: 'CUSTOMER' })
```

```js
assert.equal(customer.status, 200)
```

```js
assert.deepEqual(shape(customer.body.entries), [...expected, ['call', 'outbound', 'phone call (logged)', 'Olu Office', 'Harbourview Dental', 'voicemail']])
```

```js
assert.deepEqual(customer.body.entries.map(e => e.at), customer.body.entries.map(e => e.at).sort(), 'oldest first')
```

```js
assert.match(customer.body.entries.find(e => e.kind === 'agent action').text, new RegExp(`^${quote.number} drafted by Ada Agent \\(agent\\)`))
```

```js
assert.equal(customer.body.entries.find(e => e.kind === 'quote accepted').recordedBy, 'Sam Ortiz', 'the person who recorded the customer\'s answer')
```

```js
assert.equal(customer.body.entries.find(e => e.kind === 'call').text, 'Asked whether the unit can run until Thursday')
```

```js
assert.equal(onJob.status, 200)
```

```js
assert.deepEqual(shape(onJob.body.entries), expected, 'the job reads its own request, quote, notices, order, call and note, not the customer-level voicemail')
```

```js
assert.deepEqual(onJob.body.entries.filter(e => ['call', 'note', 'push notice', 'purchase order sent'].includes(e.kind)).map(e => e.jobId), Array(5).fill(job.id))
```

### 89. tests/api/conversation.test.mjs

Surviving registration: COMM-007 a logged call, a logged note, today's real sends and agent actions read in order from the customer and the job

Original step: COMM-007 / CUST-001 the property history carries the same messages at its site, newest first, and not the customer-level voicemail; field roles read none

Assertion text count: 9; generated provider cases: 1.

```js
assert.equal(r.status, 200)
```

```js
assert.equal(messages.length, stream.length)
```

```js
assert.deepEqual(messages.map(e => e.id).reverse(), stream.map(e => e.id), 'the job\'s stream, newest first')
```

```js
assert.deepEqual(messages.map(e => e.at), messages.map(e => e.at).sort().reverse())
```

```js
assert.match(accepted.label, /^quote accepted \(inbound, signed, Dr Mei Lin\)/)
```

```js
assert.equal(accepted.status, 'Received')
```

```js
assert.equal(messages.find(e => e.label.startsWith('push notice') && e.status.includes('HTTP 410')).jobId, job.id)
```

```js
assert.ok(!(await history()).some(e => e.label.includes('voicemail') || e.status === 'voicemail'))
```

```js
assert.ok(!(await history(b.priyaPerson)).some(e => e.kind === 'message'))
```

### 90. tests/api/conversation.test.mjs

Surviving registration: COMM-007 a logged call, a logged note, today's real sends and agent actions read in order from the customer and the job

Original step: COMM-007 only the desk reads the stream, and the logged call and note are in Activity and the business export

Assertion text count: 5; generated provider cases: 1.

```js
assert.equal((await read(`jobId=${job.id}`, person)).status, 403)
```

```js
assert.equal((await read(`customerId=${b.customer.id}&jobId=${job.id}`)).status, 400)
```

```js
assert.equal((await read('customerId=nobody')).status, 404)
```

```js
assertTrail(h, ['call.logged', 'note.logged'])
```

```js
assert.deepEqual(exported.conversations.map(x => [x.kind, x.direction, x.outcome, x.by.name]), [['call', 'inbound', 'answered', 'Olu Office'], ['note', null, null, 'Sam Ortiz'], ['call', 'outbound', 'voicemail', 'Olu Office']])
```

### 91. tests/api/conversation.test.mjs

Surviving registration: COMM-007 a logged call, a logged note, today's real sends and agent actions read in order from the customer and the job

Original step: COMM-007 two populated human histories survive merge and Worker restart; current role and branch refusals change nothing

Assertion text count: 28; generated provider cases: 1.

```js
assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
```

```js
assert.deepEqual((await read(`customerId=${b.customer.id}`)).body.entries, [...baseline, ...primary.map(f => expectedHuman(f))])
```

```js
assert.deepEqual((await read(`customerId=${dup.id}`)).body.entries, secondary.map(f => expectedHuman(f)))
```

```js
assert.deepEqual((await read(`jobId=${otherJob.id}`)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f)))
```

```js
assert.deepEqual((await read(`customerId=${dup.id}`, b.office)).body.entries, secondary.map(f => expectedHuman(f)))
```

```js
assert.deepEqual((await read(`jobId=${otherJob.id}`, viewer)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f)))
```

```js
assert.equal((await read(`jobId=${otherJob.id}`, b.priyaPerson)).status, 403)
```

```js
assert.deepEqual(await domain(), beforeReads, 'allowed and refused reads leave every domain record unchanged')
```

```js
assert.deepEqual((await read(`customerId=${b.customer.id}`, b.office)).body.entries, [...baseline, ...primary.map(f => expectedHuman(f))])
```

```js
assert.deepEqual((await read(`jobId=${otherJob.id}`, b.office)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f)))
```

```js
assert.deepEqual(await domain(), beforeBranch)
```

```js
assert.equal(refused.status, 404)
```

```js
assert.equal(refused.body.entries, undefined)
```

```js
assert.deepEqual(await domain(), beforeOtherBranch)
```

```js
assert.equal(refused.status, 403)
```

```js
assert.equal(refused.body.entries, undefined)
```

```js
assert.deepEqual(await domain(), beforeRole)
```

```js
assert.deepEqual((await read(`customerId=${b.customer.id}`, b.office)).body.entries, [...baseline, ...facts.map(f => expectedHuman(f, true))])
```

```js
assert.deepEqual((await read(`jobId=${job.id}`, viewer)).body.entries, primary.map(f => expectedHuman(f, true)))
```

```js
assert.deepEqual((await read(`jobId=${otherJob.id}`, viewer)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f, true)))
```

```js
assert.equal((await read(`customerId=${b.customer.id}`)).body.entries.at(-1).text, 'Asked for a maintenance plan')
```

```js
assert.deepEqual(await domain(), beforeSurvivorReads)
```

```js
b.office.run('conversation.log', { customerId: dup.id, kind: 'note', text: 'x' }, { error: 'MERGED' })
```

```js
assertTrail(h, ['call.logged', 'note.logged'])
```

```js
assert.ok(e)
```

```js
assert.deepEqual([e.kind, e.subjectId, e.jobId, e.actorId, e.actorName, e.actorRole, e.at], [f.kind === 'call' ? 'call.logged' : 'note.logged', f.row.id, f.jobId, f.person.id, f.person.name, f.person === b.office ? 'office' : 'dispatcher', f.at])
```

```js
assert.deepEqual([kept.command_id, kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.subject_id, kept.job_id], [f.commandId, f.person.id, f.person.name, e.actorRole, f.at, f.row.id, f.jobId])
```

```js
assert.deepEqual([record.text, record.createdAt, record.by.id, record.by.name, record.by.role], [f.text, f.at, f.person.id, f.person.name, e.actorRole])
```

### 92. tests/api/movein.test.mjs

Surviving registration: Imported provider exports retain records and refuse unsafe undo for every supported source

Original step: `${system === 'servicetitan' ? 'MOVE-003, MOVE-009' : 'MOVE-004, MOVE-010'} ${system}: saved exports preview, preserve source records, prices, balances, visits, notes and attachment bytes, repeat once, and undo without touching native work`

Assertion text count: 70; generated provider cases: 3.

```js
b.office.run('import.stage', { format: system, files, balanceAsOf: snapshot }, { error: 'FORBIDDEN' })
```

```js
assert.equal(staged.system.toLowerCase(), system)
```

```js
assert.deepEqual(staged.preview.rejections, [], 'every documented fixture row maps')
```

```js
assert.equal(staged.status, 'previewed')
```

```js
assert.equal((await h.state()).jobs.length, before.jobs.length, 'dry run writes no work')
```

```js
assert.equal(staged.fileSummary.length, files.length)
```

```js
assert.equal(f.size, expected.length)
```

```js
assert.equal(f.sha256, createHash('sha256').update(expected).digest('hex'))
```

```js
assert.ok(staged.preview.unmappedFields.jobs.includes('unsupportedSourceField'))
```

```js
h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: 'unreviewed' }, { error: 'IMPORT_REVIEW' })
```

```js
assert.equal(imported('customers').length, 1)
```

```js
assert.deepEqual(['customers','services','jobs','quotes','invoices'].map(kind => imported(kind).find(r => kind === 'jobs' ? r.id === imported('invoices')[0].jobId : kind === 'services' ? r.kind === 'service' : true)?.source.id), expectedSourceIds, 'each primary source ID is kept exactly')
```

```js
assert.ok(imported('sites').length >= 1)
```

```js
assert.equal(imported('services').length, 2)
```

```js
assert.equal(product.name, 'Synthetic replacement filter')
```

```js
assert.equal(product.unitPrice, '10.00')
```

```js
assert.equal(product.unitCost, '3.00')
```

```js
assert.equal(product.tax, 'FREE')
```

```js
assert.equal(imported('jobs').length, system === 'fieldpulse' ? 3 : 2)
```

```js
assert.equal(imported('visits').length, system === 'servicetitan' ? 1 : 2)
```

```js
assert.equal(imported('quotes').length, 1)
```

```js
assert.equal(imported('invoices').length, 1)
```

```js
assert.equal(invoice.status, 'imported')
```

```js
assert.equal(invoice.openingBalance.amount, '76.50')
```

```js
assert.equal(invoice.openingBalance.asOf, snapshot)
```

```js
assert.equal(invoice.openingBalance.notForPosting, true)
```

```js
assert.equal(invoice.dates.termsDays, 14, 'the source issue/due interval is preserved rather than invented as zero')
```

```js
assert.equal(invoice.revisions[0].totals.total, '216.50')
```

```js
assert.equal(invoice.revisions[0].approval, null)
```

```js
assert.equal(imported('quotes')[0].revisions[0].approval, null)
```

```js
assert.ok(pricedService)
```

```js
assert.equal(pricedService.unitCost, system === 'workiz' ? '40.00' : system === 'servicetitan' ? '30.00' : '25.00')
```

```js
assert.equal(imported('technicians')[0].operatorId, null, 'no imported person receives a sign-in or source role')
```

```js
assert.equal(visit.jobId, job.id)
```

```js
assert.equal(visit.technicianId, imported('technicians')[0].id)
```

```js
assert.ok(imported('captures').some(c => c.kind === 'note'))
```

```js
assert.equal(attachment.bytes.status, 'retained')
```

```js
assert.ok(original, 'the exact attachment is in journal custody')
```

```js
assert.equal(kept.toString(), 'synthetic-glove-attachment\n', 'original bytes, not just a descriptor, survive commit')
```

```js
assert.deepEqual(imported('visits').map(v => v.local.date).sort(), ['2026-10-23','2026-11-23'], 'both existing source occurrences arrive exactly once')
```

```js
assert.ok(imported('jobs').every(j => j.importedRecurrence.parentId === '20'), 'the source recurring group is retained across its occurrences')
```

```js
assert.equal(equipment.siteId, job.siteId)
```

```js
assert.equal(equipment.serial, 'synthetic-glove-serial')
```

```js
assert.equal(equipment.manufacturerWarrantyUntil, '2028-01-01')
```

```js
assert.deepEqual([member.entitlements.included, member.entitlements.used, member.entitlements.left, member.entitlements.next], [3, 1, 2, '2026-07-15'])
```

```js
assert.equal(agreement.siteId, job.siteId)
```

```js
assert.equal(agreement.plan.price, '240.00')
```

```js
assert.equal(agreement.sourceTerms.billingFrequency, 'Annually')
```

```js
assert.equal(agreement.plan.repairDiscountPercent, null, 'an unavailable source member discount is not reported as zero')
```

```js
assert.deepEqual(agreement.importedEntitlements.map(e => e.due), ['2026-01-15','2026-07-15','2026-11-15'])
```

```js
assert.equal(recurrence.importedRecurrence.source.recurrenceInterval, 6)
```

```js
assert.equal(recurrence.importedRecurrence.active, false)
```

```js
assert.deepEqual(recurrence.importedRecurrence.proposal.rule, { unit: 'month', interval: 6, months: null, day: 15, nth: null, weekday: null })
```

```js
assert.equal(recurrence.importedRecurrence.proposal.coveredThrough, '2026-11-15')
```

```js
assert.equal(recurrence.series, undefined, 'the imported rule never generates bookings without a person')
```

```js
assert.ok(!JSON.stringify(recurrence).includes('estimatedPayrollCost'), 'raw payroll amounts never enter a technician-visible job')
```

```js
assert.equal(sourceEventsResponse.status, 200)
```

```js
assert.deepEqual(sourceEvents.visits.filter(v => v.agreementId === agreement.id).map(v => v.due), ['2026-07-15','2026-11-15'], 'the source-completed event never becomes outstanding again')
```

```js
assert.equal(aging.customers.find(c => c.customerId === invoice.customerId).total, '76.50')
```

```js
assert.equal((await readAging('2026-10-21')).customers.length, 0, 'a later balance snapshot does not rewrite history')
```

```js
assert.equal(revenue.total.revenue, '0.00', 'imported balances are not new sales')
```

```js
h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'IMPORTED_INVOICE' })
```

```js
h.command('invoice.revise', { invoiceId: invoice.id, version: invoice.version, lines: [], reason: 'Cannot repost history' }, { error: 'IMPORTED_INVOICE' })
```

```js
h.command('invoice.export', {}, { error: 'NOTHING_TO_EXPORT' })
```

```js
assert.equal(h.email.sent.length, beforeMail, 'an import sends no customer message')
```

```js
assert.ok(exported.invoices.some(i => i.id === invoice.id && i.openingBalance.amount === '76.50'))
```

```js
assert.ok(again.preview.alreadyMovedIn > 0)
```

```js
assert.equal(twice[kind].length, once[kind].length, `${kind} unchanged on retry`)
```

```js
assert.equal(undone[kind].length, before[kind].length, `${kind} reversed`)
```

```js
assert.ok(undone.customers.some(c => c.id === native.id), 'native work survives undo')
```

### 93. tests/api/movein.test.mjs

Surviving registration: Imported provider exports retain records and refuse unsafe undo for every supported source

Original step: `${system === 'servicetitan' ? 'MOVE-003, MOVE-009' : 'MOVE-004, MOVE-010'} ${system}: missing parents and invalid amounts are explained in preview; a native edit prevents destructive undo`

Assertion text count: 9; generated provider cases: 3.

```js
assert.ok(orphan.preview.rejections.some(r => r.kind === 'jobs'), 'a missing customer refuses the job')
```

```js
assert.ok(orphan.preview.rejections.some(r => r.kind === 'invoices'), 'and its dependent invoice')
```

```js
assert.ok(invalid.preview.rejections.some(r => r.kind === (system === 'servicetitan' ? 'services' : 'items') && /amount/.test(r.reason)))
```

```js
assert.equal((await h.state()).imports.length, 2, 'invalid source rows remain reviewable, without product writes')
```

```js
assert.ok(typeReview.preview.rejections.some(r => r.kind === 'items' && /exact native mapping/.test(r.reason)), 'a documented Workiz warranty item is not silently changed into a stock product')
```

```js
assert.ok(cancelledVisit)
```

```js
assert.match(cancelledVisit.cancelled.reason, /Canceled in/)
```

```js
h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Keep the native correction' }, { error: 'NATIVE_EDIT_CONFLICT' })
```

```js
assert.equal((await h.state()).customers.find(c => c.id === customer.id).name, 'Synthetic corrected customer')
```

### 94. tests/api/agreements.test.mjs

Surviving registration: PLAN-002 a plan with two included tune-ups and 15% off repairs is sold, used, discounted, counted due, reported and segmented

Original step: PLAN-002 the owner defines the plan and the desk sells it by phone; one agreement per site and term

Assertion text count: 12; generated provider cases: 1.

```js
who.run('plan.save', club, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await records(), before, 'excluded plan writers change no business record')
```

```js
assert.deepEqual([plan.price, plan.termMonths, plan.includedVisits, plan.repairDiscountPercent, plan.priorityBooking, plan.formIds], ['228.00', 12, 2, '15', true, [form.id]])
```

```js
who.run('agreement.sell', { planId: plan.id, customerId: ellen.id, siteId: site.id, via: 'phone', startDate: start }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await records(), unsold, 'excluded sellers create no agreement or entitlement')
```

```js
office.run('agreement.sell', { planId: plan.id, customerId: ellen.id, siteId: site.id, via: 'quote', startDate: start }, { error: 'NOT_FOUND' })
```

```js
assert.deepEqual([agreement.startDate, agreement.plan.name, agreement.via, agreement.soldBy.name], [start, 'Comfort Club', 'phone', 'Front Office'])
```

```js
assert.equal(agreement.endDate, '2027-04-04', 'the day before the same date twelve months on')
```

```js
assert.deepEqual(soldAgreement.entitlements, { included: 2, used: 0, booked: 0, declined: 0, left: 2, next: '2026-04-05', due: ['2026-04-05', '2026-10-05'] }, 'selling grants two unused visits with independently fixed due dates')
```

```js
office.run('agreement.sell', { planId: plan.id, customerId: ellen.id, siteId: site.id, via: 'phone', startDate: today }, { error: 'AGREEMENT' })
```

```js
assert.deepEqual(sold.map(e => [e.id, e.status, e.label]), [[agreement.id, 'sold', `Comfort Club sold (phone): ${start} to ${agreement.endDate}, 2 included visits`]])
```

```js
assert.equal((await h.request(`/api/glove/sites/${site.id}/history`, { as: person.cookie })).status, 404, 'a technician with no visit there reads no history')
```

### 95. tests/api/agreements.test.mjs

Surviving registration: PLAN-002 a plan with two included tune-ups and 15% off repairs is sold, used, discounted, counted due, reported and segmented

Original step: PLAN-002 included visits consume entitlements; AGENT-007, AGENT-015 flags only missing accepted frozen forms on twenty completed visits

Assertion text count: 7; generated provider cases: 1.

```js
assert.deepEqual([job.agreementId, job.lines.map(l => [l.description, l.total]), job.totals.total, job.forms.map(f => f.name)], [agreement.id, [['AC tune-up (included in Comfort Club)', '0.00']], '0.00', ['Comfort Club inspection']])
```

```js
assert.deepEqual(reservedAgreement.entitlements, { included: 2, used: 0, booked: 1, declined: 0, left: 2, next: '2026-04-05', due: ['2026-04-05', '2026-10-05'] }, 'creating an included job reserves its entitlement without consuming it')
```

```js
assert.deepEqual(job.forms.map(({ id, ...copy }) => copy), [{ formId: form.id, formVersion: 1, name: 'Comfort Club inspection', questions: [{ id: 'filter', label: 'Filter replaced', type: 'yesno', required: false }], equipmentId: null }])
```

```js
assert.deepEqual([row.active, row.entitlements.used, row.entitlements.left, row.entitlements.next], [true, 1, 1, '2026-10-05'], '1 visit left, next six months after the start')
```

```js
dispatcher.run('job.create', { customerId: ellen.id, siteId: site.id, agreementId: agreement.id, title: 'One too many' }, { error: 'ENTITLEMENT' })
```

```js
assert.deepEqual(await records(), reserved, 'an exhausted reservation cannot create another included job')
```

```js
assert.deepEqual([dash.agreementsDue.count, dash.agreementsDue.list.map(x => [x.customer, x.plan, x.left])], [1, [['Ellen Brooks', 'Comfort Club', 1]]], 'the agreement counts while its second tune-up is due')
```

### 96. tests/api/agreements.test.mjs

Surviving registration: PLAN-002 a plan with two included tune-ups and 15% off repairs is sold, used, discounted, counted due, reported and segmented

Original step: PLAN-002 / QUOTE-007, QUOTE-019 a repair quote takes the member discount, carried to the job, invoice, CSV, QuickBooks payload and revenue

Assertion text count: 11; generated provider cases: 1.

```js
assert.deepEqual([q.revisions[0].options[0].discount, totals.subtotal, totals.discount.amount, totals.discount.nonTaxable, totals.gst, totals.total], [{ kind: 'percent', value: '15', reason: 'Comfort Club member' }, '700.00', '105.00', '105.00', '33.00', '628.00'], 'the dispatcher holds no discount limit, and the member discount is not refused')
```

```js
dispatcher.run('quote.draft', { customerId: ellen.id, siteId: site.id, title: 'Extra off', lines: repair, discount: { kind: 'percent', value: '20', reason: 'Goodwill' } }, { error: 'DISCOUNT_LIMIT' })
```

```js
assert.deepEqual(await records(), beforeDiscountRefusal, 'a refused extra discount changes no quote or money')
```

```js
assert.equal(other.revisions[0].totals.discount, undefined, 'no agreement, no member discount')
```

```js
assert.deepEqual(job.discount, { kind: 'percent', value: '15', reason: 'Comfort Club member' })
```

```js
assert.deepEqual([money(priced.totals.subtotal), money(priced.totals.discount.amount), money(priced.totals.discount.nonTaxable), money(priced.totals.gst), money(priced.totals.total)], [70000, 10500, 10500, 3300, 62800])
```

```js
assert.equal(inv.revisions[0].totals.total, '628.00')
```

```js
assert.deepEqual([line.Amount, line.DiscountLineDetail, qbo.ApplyTaxAfterDiscount, qbo.TxnTaxDetail.TotalTax], [105, { PercentBased: true, DiscountPercent: 15 }, true, 33])
```

```js
assert.match(csv, /Discount: Comfort Club member \(15%\) on non-taxable lines,1,-105\.00,/)
```

```js
assert.equal((await read(`/api/glove/reports/revenue.json?from=${start}&to=${today}`)).total.revenue, '595.00')
```

```js
assert.deepEqual([call.discount?.reason, call.totals.discount?.amount], ['Comfort Club member', '13.35'], 'a member\'s service call takes the discount too')
```

### 97. tests/api/agreements.test.mjs

Surviving registration: PLAN-002 a plan with two included tune-ups and 15% off repairs is sold, used, discounted, counted due, reported and segmented

Original step: PLAN-002 the agreement report counts the sold agreement and no churn, and a "no agreement" segment leaves the member out

Assertion text count: 44; generated provider cases: 1.

```js
assert.deepEqual([r.sold, r.active, r.churn, r.soldValue, r.byPlan], [1, 1, 0, '228.00', [{ plan: 'Comfort Club', sold: 1 }]])
```

```js
assert.deepEqual(parseCsv(await h.request(`/api/glove/reports/agreements.csv?${period}`).then(x => x.text())), expectedCsv)
```

```js
assert.deepEqual((await read(`/api/glove/segments/${segment.id}`)).members.map(m => m.name), ['Lee Park'])
```

```js
assert.deepEqual(member.plan, { ...club, visitServiceName: 'AC tune-up' })
```

```js
assert.deepEqual([member.startDate, member.endDate, member.soldOn, member.soldBy], [start, '2027-04-04', today, { id: office.id, name: 'Front Office', role: 'office' }])
```

```js
assert.deepEqual([member.id, member.active, member.entitlements], [agreement.id, true, { included: 2, used: 1, booked: 1, declined: 0, left: 1, next: '2026-10-05', due: ['2026-04-05', '2026-10-05'] }])
```

```js
assert.equal(keptJob.status, 'completed')
```

```js
assert.deepEqual(keptJob.forms, tuneJob.forms, 'the completed job retains its original frozen form, not the edited template')
```

```js
assert.deepEqual([visit.status, visit.arrival, visit.completion], ['completed', { technicianId: tech.id, deviceTime: tuneEvidence.visit.startAt, receivedAt: at, captureId: tuneEvidence.arrival.id }, tuneEvidence.completed.completion])
```

```js
assert.deepEqual(visit.completion, { technicianId: tech.id, deviceTime: tuneEvidence.visit.endAt, receivedAt: at, summary: 'Done', signoff: { customerPresent: false, absentReason: 'Customer at work' }, jobComplete: true, findings: '', recommendations: [] })
```

```js
assert.deepEqual(visit.lateEvidence, [], 'assigned technician evidence was accepted directly')
```

```js
assert.equal(captures.length, 1, 'the frozen inspection has exactly one accepted capture')
```

```js
assert.equal(capture.id, tuneEvidence.captures[0].id)
```

```js
assert.deepEqual([capture.visitId, capture.jobId, capture.technicianId, capture.kind, capture.late, capture.formId, capture.formName, capture.answers, capture.flagged, capture.deviceTime, capture.receivedAt], [visit.id, keptJob.id, tech.id, 'form', false, tuneJob.forms[0].id, 'Comfort Club inspection', [{ questionId: 'filter', label: 'Filter replaced', type: 'yesno', value: true }], 0, tuneEvidence.visit.startAt, at])
```

```js
assert.deepEqual(state.captures.find(c => c.id === 'synthetic-glove-completion-6'), { ...tuneEvidence.completed.completion, id: 'synthetic-glove-completion-6', version: 1, createdAt: at, visitId: visit.id, jobId: keptJob.id, kind: 'completion', late: false })
```

```js
assert.deepEqual([keptQuote.status, keptQuote.acceptance.revision, keptQuote.acceptance.method, keptQuote.acceptance.customerName], ['accepted', 1, 'phone', 'Ellen Brooks'])
```

```js
assert.deepEqual([keptQuote.acceptance.recordedBy, keptQuote.acceptance.at], [{ id: dispatcher.id, name: 'Dee Dispatcher', role: 'dispatcher' }, at])
```

```js
assert.deepEqual(keptRepair.discount, { kind: 'percent', value: '15', reason: 'Comfort Club member' })
```

```js
assert.deepEqual([totals.subtotal, totals.discount.amount, totals.discount.nonTaxable, totals.gst, totals.total], ['700.00', '105.00', '105.00', '33.00', '628.00'])
```

```js
assert.deepEqual([dashboard.date, dashboard.timezone, dashboard.agreementsDue], [today, 'America/Chicago', { count: 1, list: [{ id: `${agreement.id}:1`, customer: 'Ellen Brooks', plan: 'Comfort Club', next: '2026-10-05', left: 1 }] }])
```

```js
assert.deepEqual([report.kind, report.from, report.to, report.sold, report.active, report.churn, report.soldValue, report.byPlan], ['agreements', start, today, 1, 1, 0, '228.00', [{ plan: 'Comfort Club', sold: 1 }]])
```

```js
assert.deepEqual(parseCsv(await h.request(`/api/glove/reports/agreements.csv?${period}`).then(x => x.text())), expectedCsv)
```

```js
assert.deepEqual((await read(`/api/glove/segments/${segment.id}`)).members.map(m => [m.id, m.name]), [[lee.id, 'Lee Park']])
```

```js
assert.deepEqual(await read('/api/glove/export'), before, 'state, agreement, dashboard, report and segment reads change no exported record')
```

```js
assert.equal((await h.request('/api/glove/agreements', { as: '' })).status, 401, 'agreement reads require a real session')
```

```js
assert.equal((await h.request(path, { as: who.cookie })).status, 403, path)
```

```js
who.run('agreement.sell', { planId: agreement.planId, customerId: ellen.id, siteId: site.id, via: 'phone', startDate: start }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await records(), unchanged, 'refused reads and sales change no business records')
```

```js
assertTrail(h, ['plan.saved', 'agreement.sold', 'capture.form', 'capture.completion', 'job.completed'])
```

```js
assert.ok(e, `${expected.kind} has the actual command reference`)
```

```js
assert.deepEqual([e.subjectId, e.actorId, e.actorName, e.actorRole, e.at], [expected.subjectId, expected.actorId, expected.actorName, expected.actorRole, at])
```

```js
assert.deepEqual([saved.command_id, saved.subject_id, saved.actor_id, saved.actor_name, saved.actor_role, saved.at], [expected.commandId, expected.subjectId, expected.actorId, expected.actorName, expected.actorRole, at])
```

```js
assert.deepEqual([completed.actorId, completed.actorName, completed.actorRole], [person.id, 'Luis Ortega', 'technician'])
```

```js
assert.deepEqual(await person.run('visit.capture', { visitId: tuneEvidence.visit.id, deviceTime: tuneEvidence.visit.startAt, kind: 'form', formId: tuneJob.forms[0].id, answers: { filter: true } }, { commandId: tuneEvidence.captures[0].id }), tuneEvidence.captures[0])
```

```js
assert.deepEqual(await person.run('visit.complete', { visitId: tuneEvidence.visit.id, deviceTime: tuneEvidence.visit.endAt, summary: 'Done', signoff: { absentReason: 'Customer at work' } }, { commandId: 'synthetic-glove-completion-6' }), tuneEvidence.completed)
```

```js
assert.deepEqual(await records(), beforeReplay, 'replaying accepted inspection and completion after restart changes no record, entitlement or audit event')
```

```js
assert.deepEqual((await read(`/api/glove/reports/agreements.json?${period}`)).churn, 1)
```

```js
assert.deepEqual((await read(`/api/glove/segments/${segment.id}`)).members.map(m => m.name).sort(), ['Ellen Brooks', 'Lee Park'])
```

```js
assert.equal(after.revisions[0].totals.discount, undefined, 'an ended agreement gives no discount')
```

```js
assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, 1, 'PLAN-004 ending a term is not completion or a customer decline')
```

```js
assertTrail(h, ['plan.saved', 'agreement.sold', 'agreement.ended'])
```

```js
assert.deepEqual(exported.agreements.map(a => [a.plan.name, a.endReason]), [['Comfort Club', 'Moved away']])
```

```js
assert.deepEqual((await read(`/api/glove/sites/${site.id}/history`)).entries.filter(e => e.kind === 'agreement').map(e => [e.id, e.status, e.label]), [[`${agreement.id}:ended`, 'ended', 'Comfort Club ended by Front Office: Moved away'], [agreement.id, 'ended', `Comfort Club sold (phone): ${start} to ${agreement.endDate}, 2 included visits`]], 'the end joins the history, newest first')
```

```js
assert.equal((await h.request('/api/glove/agreements', { as: person.cookie })).status, 403)
```

### 98. tests/api/callbacks.test.mjs

Surviving registration: AGENT-006 a callback on a condenser with two prior visits gets an advisory checklist that cites both visits' readings

Original step: AGENT-006 the callback is detected and the agent gathers both earlier visits

Assertion text count: 6; generated provider cases: 1.

```js
assert.deepEqual(callback.callback, { days: 30, equipment: [{ equipmentId: condenser.id, visitIds: [first.id, second.id] }] })
```

```js
assert.equal(other.callback, null, 'the furnace was never serviced, so that job is no callback')
```

```js
assert.ok(timeline.events.some(e => e.kind === 'job.callback' && /AC condenser Trane XR14 serviced in the last 30 days/.test(e.summary)))
```

```js
assert.deepEqual(pack.units[0].visits.map(v => [v.ref, v.date, v.readings.map(r => [r.ref, r.label, r.value, r.flagged])]), [
      ['V1', '2026-10-06', [['R1', 'Suction pressure', '118', false], ['R2', 'Superheat', '10', false]]],
      ['V2', '2026-10-13', [['R3', 'Suction pressure', '104', true], ['R4', 'Superheat', '15', true]]],
    ])
```

```js
assert.deepEqual(pack.units[0].visits[1].refrigerant, [{ type: 'R-410A', added: '1.5', recovered: '0' }])
```

```js
b.agent.run('callback.prepare', { jobId: other.id }, { error: 'NOT_CALLBACK' })
```

### 99. tests/api/callbacks.test.mjs

Surviving registration: AGENT-006 a callback on a condenser with two prior visits gets an advisory checklist that cites both visits' readings

Original step: AGENT-006 the prepared checklist cites both visits' readings, resolved from the records, and is labelled advisory

Assertion text count: 6; generated provider cases: 1.

```js
assert.doesNotMatch(JSON.stringify(call.body), /Harbourview|Harbour St|Mei Lin|02 9555/, 'no customer, contact or address goes to the model')
```

```js
assert.deepEqual(diagnosis.checklist[0].cites.map(r => [r.date, r.label, r.value, r.unit, r.flagged ?? null]), [
      ['2026-10-06', 'Suction pressure', '118', 'psi', false],
      ['2026-10-13', 'Suction pressure', '104', 'psi', true],
      ['2026-10-06', 'Superheat', '10', '°F', false],
      ['2026-10-13', 'Superheat', '15', '°F', true],
    ])
```

```js
assert.deepEqual(new Set(diagnosis.checklist[0].cites.map(r => r.visitId)), new Set([first.id, second.id]))
```

```js
assert.deepEqual(diagnosis.parts.map(p => [p.part, p.quantity, p.cites.map(r => r.visitId)]), [['R-410A refrigerant', '3 lb', [second.id]]])
```

```js
assert.match(diagnosis.advisory, /technician diagnoses and decides the work; this is not a safety certification/)
```

```js
assert.equal(diagnosis.preparedBy.role, 'agent')
```

### 100. tests/api/callbacks.test.mjs

Surviving registration: AGENT-006 a callback on a condenser with two prior visits gets an advisory checklist that cites both visits' readings

Original step: AGENT-006 a checklist citing what the pack does not hold is refused; the technician on the callback reads the checklist, another does not

Assertion text count: 5; generated provider cases: 1.

```js
b.agent.run('callback.prepare', { jobId: callback.id }, { error: 'MODEL' })
```

```js
b.priyaPerson.run('callback.prepare', { jobId: callback.id }, { error: 'FORBIDDEN' })
```

```js
assert.equal(seen.diagnoses.length, 1)
```

```js
assert.equal(seen.diagnoses[0].checklist[0].cites.length, 4)
```

```js
assert.equal((await h.request(`/api/glove/jobs/${callback.id}/callback`, { as: b.priyaPerson.cookie })).status, 404)
```

### 101. tests/api/nameplates.test.mjs

Surviving registration: FIELD-006, FIELD-011 a technician photographs three nameplates; the model proposes the fields and nothing is saved until the technician confirms

Original step: FIELD-006, FIELD-011 the proposed fields are what the nameplate shows, and an unreadable date stays unread

Assertion text count: 9; generated provider cases: 1.

```js
assert.deepEqual(trane.proposed, { make: 'Trane', model: 'XR14', serial: '19243KX1F', manufactured: '2019-06' })
```

```js
assert.deepEqual([carrier.proposed, carrier.unread], [{ make: 'Carrier', model: '59TP6', serial: '', manufactured: '2014' }, ['serial']])
```

```js
assert.deepEqual([rheem.proposed.manufactured, rheem.unread], ['', ['manufactured']], '"June 2018" is not a date as printed to a precision, so it is left unread')
```

```js
assert.ok([trane, carrier, rheem].every(r => r.status === 'proposed' && r.model === 'vision-test'))
```

```js
assert.equal(h.models.calls.length, 3)
```

```js
assert.equal(call.authorization, 'Bearer synthetic-glove-111')
```

```js
assert.equal(call.body.store, false)
```

```js
assert.equal(call.body.response_format.type, 'json_schema')
```

```js
assert.doesNotMatch(JSON.stringify(call.body), /Harbourview|Harbour St|Mei Lin|Condenser service/)
```

### 102. tests/api/nameplates.test.mjs

Surviving registration: FIELD-006, FIELD-011 a technician photographs three nameplates; the model proposes the fields and nothing is saved until the technician confirms

Original step: FIELD-006, FIELD-011 nothing is saved to equipment until the technician confirms

Assertion text count: 6; generated provider cases: 1.

```js
assert.deepEqual(before.equipment.map(e => [e.type, e.make ?? '', e.model ?? '', e.serial ?? '']), [['AC condenser', '', '', '']])
```

```js
assert.equal(before.nameplates.length, 3)
```

```js
assert.doesNotMatch(JSON.stringify(before), /synthetic-glove-111/)
```

```js
assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /synthetic-glove-111/)
```

```js
b.tomPerson.run('nameplate.confirm', { readingId: trane.id, version: trane.version, ...trane.proposed }, { error: 'FORBIDDEN' })
```

```js
b.dispatcher.run('nameplate.confirm', { readingId: trane.id, version: trane.version, ...trane.proposed }, { error: 'FORBIDDEN' })
```

### 103. tests/api/nameplates.test.mjs

Surviving registration: FIELD-006, FIELD-011 a technician photographs three nameplates; the model proposes the fields and nothing is saved until the technician confirms

Original step: FIELD-006, FIELD-011 confirmation retains exact fields and date precision through refusal, replay and restart; library attachment and discard remain intact

Assertion text count: 36; generated provider cases: 1.

```js
assert.deepEqual([unit.id, unit.make, unit.model, unit.serial, unit.manufacturedOn, unit.location], [condenser.id, 'Trane', 'XR14', '19243KX1G', '2019-06', 'Roof'])
```

```js
assert.deepEqual(unit.manual, { manualId: manual.id, title: 'Trane XR14 installer guide', url: 'https://manuals.example.test/trane-xr14.pdf' })
```

```js
assert.deepEqual(unit.photos.map(p => p.fileId), [trane.photo.fileId])
```

```js
b.priyaPerson.run('nameplate.confirm', { readingId: trane.id, version: trane.version + 1, ...trane.proposed }, { error: 'READING_STATE' })
```

```js
assert.deepEqual([furnace.siteId, furnace.type, furnace.make, furnace.model, furnace.serial, furnace.manufacturedOn, furnace.manual], [b.site.id, 'Furnace', 'Carrier', '59TP6', '', '2014', null], 'no manual in the library, none attached')
```

```js
assert.equal(discarded.status, 'discarded')
```

```js
assert.deepEqual(after.equipment.map(e => e.type).sort(), ['AC condenser', 'Furnace'])
```

```js
assert.deepEqual(after.nameplates.map(r => [r.status, r.corrected ?? null]), [['confirmed', ['serial']], ['confirmed', []], ['discarded', null]])
```

```js
assert.equal((await h.request(`/api/glove/files/${trane.photo.fileId}`, { as: b.priyaPerson.cookie })).status, 200)
```

```js
assert.equal((await h.request(`/api/glove/files/${trane.photo.fileId}`, { as: b.office.cookie })).status, 200)
```

```js
assert.equal((await h.request(`/api/glove/files/${trane.photo.fileId}`, { as: b.tomPerson.cookie })).status, 404)
```

```js
assert.equal(record.equipment.manual.title, 'Trane XR14 installer guide')
```

```js
assert.deepEqual(reading.proposed, proposed, `printed date ${JSON.stringify(value)}`)
```

```js
assert.deepEqual(reading.unread, empty ? ['make', 'model', 'serial', 'manufactured'] : expected ? ['serial'] : ['serial', 'manufactured'])
```

```js
assert.equal(reading.status, 'proposed')
```

```js
assert.deepEqual((await h.state()).equipment, before.equipment, 'a model reading never fills equipment itself')
```

```js
assert.deepEqual(await b.priyaPerson.run('nameplate.read', payload, { commandId }), reading)
```

```js
assert.equal(h.models.calls.length, calls, 'read replay makes no provider request')
```

```js
assert.deepEqual([unit.make, unit.model, unit.serial, unit.manufacturedOn], ['Synthetic make', 'Synthetic model', '', expected])
```

```js
assert.deepEqual(await b.priyaPerson.run('nameplate.confirm', confirmation, { commandId: confirmId }), unit)
```

```js
b.priyaPerson.run('nameplate.confirm', { readingId: correction.id, version: correction.version, ...correction.proposed, manufactured: value }, { error: 'INPUT' })
```

```js
assert.equal(error.message, 'manufactured is YYYY, YYYY-MM or YYYY-MM-DD.')
```

```js
assert.deepEqual(error.details, { field: 'manufactured' })
```

```js
assert.deepEqual(refused.equipment, unchanged.equipment, 'invalid technician correction changes no equipment')
```

```js
assert.deepEqual(refused.nameplates, unchanged.nameplates, 'invalid correction leaves the proposal reviewable')
```

```js
assert.deepEqual([corrected.id, corrected.make, corrected.model, corrected.serial, corrected.manufacturedOn], [condenser.id, 'Trane', 'XR14', 'synthetic-glove-112', '2020-12-31'])
```

```js
assert.deepEqual((await h.state()).equipment.find(e => e.id === unit.id), unit, 'exact confirmed fields survive Worker restart')
```

```js
assert.deepEqual(await b.priyaPerson.run('nameplate.confirm', confirmation, { commandId }), unit, 'confirmation replay after restart returns the same unit')
```

```js
assert.deepEqual([reading.status, reading.confirmed, reading.corrected], ['confirmed', expected.confirmed, expected.corrected])
```

```js
assert.equal(restarted.equipment.length, 5, 'replay creates no duplicate equipment')
```

```js
assert.equal(call.authorization, 'Bearer synthetic-glove-111')
```

```js
assert.equal(call.body.store, false)
```

```js
assert.doesNotMatch(JSON.stringify(call.body), /Harbourview|Harbour St|Mei Lin|Condenser service/)
```

```js
assertTrail(h, ['nameplate.read', 'equipment.added', 'equipment.updated'])
```

```js
assert.ok(activity.some(e => e.kind === 'equipment.updated' && e.actorId === b.priyaPerson.id && e.commandId === correctionId && e.subjectId === condenser.id))
```

```js
assert.doesNotMatch(JSON.stringify([restarted, activity, exported]), /synthetic-glove-111/)
```

### 104. tests/api/payroll.test.mjs

Surviving registration: TEAM-003, TEAM-006 a 5% sold-revenue rule and a $25 agreement spiff over a period reach the Gusto, ADP RUN and QuickBooks Payroll files

Original step: TEAM-003, TEAM-006 only the owner sets dated commission rules

Assertion text count: 2; generated provider cases: 1.

```js
b.office.run('payroll.settings', { commissions: { soldPercent: '5' } }, { error: 'FORBIDDEN' })
```

```js
h.command('payroll.settings', { commissions: { soldPercent: '120' } }, { error: 'INPUT' })
```

### 105. tests/api/payroll.test.mjs

Surviving registration: TEAM-003, TEAM-006 a 5% sold-revenue rule and a $25 agreement spiff over a period reach the Gusto, ADP RUN and QuickBooks Payroll files

Original step: TEAM-003, TEAM-006 sales credited to their technician earn the rule in force on their date

Assertion text count: 3; generated provider cases: 1.

```js
b.dispatcher.run('quote.accept', { quoteId: draft.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin', soldByTechnicianId: 'nobody' }, { error: 'NOT_FOUND' })
```

```js
assert.equal(sold.acceptance.soldByTechnicianId, priya.id)
```

```js
assert.deepEqual(before.left.map(x => [x.name, x.reason]), [['Priya N.', `week of ${lastWeek} not approved`], ['Tom B.', 'commissions of $25.00 but no approved time in the period']])
```

### 106. tests/api/payroll.test.mjs

Surviving registration: TEAM-003, TEAM-006 a 5% sold-revenue rule and a $25 agreement spiff over a period reach the Gusto, ADP RUN and QuickBooks Payroll files

Original step: TEAM-003, TEAM-006 the approved person's commissions and spiffs are in every payroll file, by week and date

Assertion text count: 9; generated provider cases: 1.

```js
assert.deepEqual([p.commission.sold, p.commission.completed, p.commission.agreements, p.commission.total], [{ revenue: '1234.50', amount: '61.73' }, { revenue: '189.00', amount: '3.78' }, { count: 1, amount: '25.00' }, '90.51'], '5% of $1,234.50 rounds half up to $61.73; 2% of $189.00 completed; one $25 spiff; tomorrow\'s rule changes none of today\'s')
```

```js
assert.deepEqual(p.commission.items.map(c => [c.date, c.kind, c.rate, c.amount]), [[today, 'agreement', '$25.00', '25.00'], [today, 'completed', '2%', '3.78'], [today, 'sold', '5%', '61.73']])
```

```js
assert.deepEqual(run.left.map(x => x.name), ['Tom B.'], 'a commission without approved time stays out of the files, with the reason')
```

```js
assert.equal(await read(`/api/glove/reports/payroll-gusto.csv?${period}`, b.office.cookie), csv([['last_name', 'first_name', 'gusto_employee_id', 'workweeks', 'regular_hours', 'overtime_hours', 'double_overtime_hours', 'commission'], ['N.', 'Priya', '104', `${lastWeek} - ${plusDays(lastWeek, 6)}`, '16.00', '0.00', '0.00', '0.00'], ['N.', 'Priya', '104', `${thisWeek} - ${plusDays(thisWeek, 6)}`, '0.00', '0.00', '0.00', '90.51']]))
```

```js
assert.equal(await read(`/api/glove/reports/payroll-adp-run.csv?${period}`), '##GENERIC## V1.0\r\n' + csv([['IID', 'Pay Frequency', 'Pay Period Start Date', 'Pay Period End Date', 'Employee ID', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code'], ['G3X', 'B', us(lastWeek), us(plusDays(thisWeek, 6)), '104', 'REG', '16.00', '', '0', '', 'BASE'], ['G3X', 'B', us(lastWeek), us(plusDays(thisWeek, 6)), '104', 'COMM', '', '90.51', '0', '', 'BASE']]))
```

```js
assert.equal(await read(`/api/glove/reports/payroll-quickbooks.csv?${period}`), csv([['Employee', 'Date', 'Pay item', 'Hours', 'Amount'], ['Priya N.', us(lastWeek), 'Regular', '8.00', ''], ['Priya N.', us(plusDays(lastWeek, 1)), 'Regular', '8.00', ''], ['Priya N.', us(today), 'Commission', '', '90.51']]))
```

```js
assert.doesNotMatch(await read(`/api/glove/reports/payroll-${kind}.csv?${period}`), /Tom/, `${kind} carries no one left out`)
```

```js
assertTrail(h, ['payroll.settings', 'quote.accepted', 'agreement.sold'])
```

```js
assert.ok(activity.some(e => e.kind === 'payroll.settings' && e.summary.endsWith(`commissions from ${lastWeek}: 5% of sold revenue, 2% of completed revenue, $25.00 per agreement sold`)))
```

### 107. tests/api/subcontract.test.mjs

Surviving registration: API-001 / DISP-007, DISP-013, DISP-014 a three-day install for a two-person crew and a subcontractor: each sees only their visits, the crew moves as one, and the subcontractor's 1099 total is kept

Original step: DISP-007, DISP-013, DISP-014 the crew is booked as one: one visit per member each day, and each member sees only their own

Assertion text count: 3; generated provider cases: 1.

```js
assert.deepEqual(crewDays.map(g => g.visits.map(v => [v.technicianId, v.local.date, v.crew.name]).sort()), days.map(d => [[b.priya.id, d, 'Install crew'], [b.tom.id, d, 'Install crew']].sort()))
```

```js
assert.deepEqual(await mine(b.priyaPerson), crewDays.map(g => g.visits.find(v => v.technicianId === b.priya.id).id).sort())
```

```js
assert.deepEqual(await mine(b.tomPerson), crewDays.map(g => g.visits.find(v => v.technicianId === b.tom.id).id).sort())
```

### 108. tests/api/subcontract.test.mjs

Surviving registration: API-001 / DISP-007, DISP-013, DISP-014 a three-day install for a two-person crew and a subcontractor: each sees only their visits, the crew moves as one, and the subcontractor's 1099 total is kept

Original step: DISP-007, DISP-013, DISP-014 the subcontractor sees only their own visits on the job, without money or other people's work

Assertion text count: 10; generated provider cases: 1.

```js
assert.deepEqual(s.visits.map(v => v.id).sort(), sidDays.map(v => v.id).sort())
```

```js
assert.deepEqual(s.jobs.map(j => [j.id, j.title, j.lines.length]), [[job.id, 'Three-day system install', 0]])
```

```js
assert.deepEqual(s.customers, [{ id: b.customer.id, version: s.customers[0].version, name: 'Harbourview Dental', phone: '02 9555 0101' }])
```

```js
assert.deepEqual(s.sites.map(x => [x.address, x.accessNotes]), [['14 Harbour St, Balmain NSW 2041', 'Gate code at reception']])
```

```js
assert.deepEqual([s.quotes, s.invoices, s.services, s.captures, s.events, s.equipment, s.times], [[], [], [], [], [], [], []])
```

```js
assert.deepEqual(Object.keys(s.business[0]).sort(), ['id', 'name', 'timezone', 'version'])
```

```js
assert.doesNotMatch(JSON.stringify(s), /189\.00|unitPrice|totals|costRate|Priya|Tom B/)
```

```js
assert.equal((await h.request(`/api/glove/files/${photo.file.fileId}`, { as: sub.cookie })).status, 404)
```

```js
assert.deepEqual((await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: sub.cookie })).json()).events, [])
```

```js
assert.equal((await h.request(path, { as: sub.cookie })).status, 403, path)
```

### 109. tests/api/subcontract.test.mjs

Surviving registration: API-001 / DISP-007, DISP-013, DISP-014 a three-day install for a two-person crew and a subcontractor: each sees only their visits, the crew moves as one, and the subcontractor's 1099 total is kept

Original step: DISP-007, DISP-013, DISP-014 the subcontractor records arrival, checklist, notes and completion on their visits only, and cannot clock in

Assertion text count: 5; generated provider cases: 1.

```js
sub.run('visit.arrive', { visitId: priyaDay1.id, deviceTime: '2026-11-01T21:05:00Z' }, { error: 'FORBIDDEN' })
```

```js
sub.run('clock.in', { deviceTime: '2026-11-01T21:00:00Z' }, { error: 'FORBIDDEN' })
```

```js
sub.run('visit.capture', { visitId: sidDays[0].id, deviceTime: '2026-11-01T21:10:00Z', kind: 'refrigerant', refrigerant: { type: 'R-410A', added: '1' } }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(s.captures.map(x => x.kind).filter(k => k !== 'checklist').sort(), ['arrival', 'arrival', 'completion', 'completion', 'note', 'note'])
```

```js
assert.ok(s.captures.every(x => x.technicianId === sid.id))
```

### 110. tests/api/subcontract.test.mjs

Surviving registration: API-001 / DISP-007, DISP-013, DISP-014 a three-day install for a two-person crew and a subcontractor: each sees only their visits, the crew moves as one, and the subcontractor's 1099 total is kept

Original step: DISP-007, DISP-013, DISP-014 a note recorded before arrival prevents cancelling any member of the crew booking

Assertion text count: 5; generated provider cases: 1.

```js
assert.deepEqual(booking.map(v => v.status), ['booked', 'booked'])
```

```js
b.dispatcher.run('visit.cancel', { visitId: member.id, version: current.version, reason: 'Cancel the installation day' }, { error: 'VISIT_STATE' })
```

```js
assert.deepEqual(after.visits.filter(v => v.crew?.groupId === crewDays[1].id), booking, 'neither member is cancelled or changed')
```

```js
assert.deepEqual(after.captures, before.captures, 'the recorded evidence is kept')
```

```js
assert.deepEqual(after.events, before.events, 'a refused crew cancellation records no cancellation')
```

### 111. tests/api/subcontract.test.mjs

Surviving registration: API-001 / DISP-007, DISP-013, DISP-014 a three-day install for a two-person crew and a subcontractor: each sees only their visits, the crew moves as one, and the subcontractor's 1099 total is kept

Original step: DISP-007, DISP-013, DISP-014 moving or canceling a crew visit moves or cancels every member's visit, after one conflict review

Assertion text count: 5; generated provider cases: 1.

```js
b.dispatcher.run('visit.change', { visitId: day3.id, version: (await at(day3.id)).version, technicianId: b.tom.id, reason: 'Swap' }, { error: 'CREW' })
```

```js
b.dispatcher.run('visit.change', { visitId: day3.id, version: (await at(day3.id)).version, date: '2026-11-06', reason: 'Materials late' }, { error: 'CONFLICT_REVIEW' })
```

```js
assert.deepEqual(review.details.conflicts.map(x => x.code), [`overlap:${tomOwn.id}`])
```

```js
assert.deepEqual(moved.map(v => [v.technicianId, v.local.date, v.local.start]).sort(), [[b.priya.id, '2026-11-06', '08:00'], [b.tom.id, '2026-11-06', '08:00']].sort())
```

```js
assert.deepEqual((await h.state()).visits.filter(v => v.crew?.groupId === crewDays[2].id).map(v => v.status), ['cancelled', 'cancelled'])
```

### 112. tests/api/subcontractor-field.test.mjs

Surviving registration: DISP-013 invited subcontractor works only on current visits through every public door

Original step: point 1: mailed staff invitation confirms a built-in Subcontractor linked to their technician

Assertion text count: 9; generated provider cases: 1.

```js
assert.deepEqual(sub.invitation, { status: 202, confirmationStatus: 303, path: '/auth/confirm' })
```

```js
assert.deepEqual([session.operator.id, session.operator.displayName, session.operator.role], [sub.id, 'Sid Field', 'member'])
```

```js
assert.deepEqual([s.actor.id, s.actor.name, s.actor.role, s.actor.roleName], [sub.id, 'Sid Field', 'subcontractor', null])
```

```js
assert.deepEqual(s.actor.commands.sort(), ['visit.arrive', 'visit.capture', 'visit.complete'])
```

```js
assert.deepEqual(s.actor.reads.sort(), ['file', 'state'])
```

```js
assert.deepEqual(s.technicians.map(x => [x.id, x.operatorId, x.name]), [[tech.id, sub.id, 'Sid Field']])
```

```js
assertTrail(h, ['role.set', 'technician.saved'])
```

```js
assert.ok(activity.some(e => e.kind === 'role.set' && e.subjectId === sub.id && e.actorRole === 'owner'))
```

```js
assert.equal(exported.technicians.find(x => x.id === tech.id).operatorId, sub.id)
```

### 113. tests/api/subcontractor-field.test.mjs

Surviving registration: DISP-013 invited subcontractor works only on current visits through every public door

Original step: point 2: exact current assignments, bounded records and frozen ordered work survive Worker restart

Assertion text count: 19; generated provider cases: 1.

```js
assert.ok((await sub.state()).captures.some(x => x.id === oldNote.id))
```

```js
assert.deepEqual(sorted((await sub.state()).visits).map(x => x.id), sorted([own, second, moved, cancelled]).map(x => x.id))
```

```js
assert.deepEqual(sorted(s.visits).map(v => [v.id, v.jobId, v.technicianId, v.local.date, v.local.start, v.local.end, v.local.timezone, v.status, v.assignments, v.lateEvidence]), sorted([
        { id: own.id, jobId: job.id, date: '2026-11-09' }, { id: second.id, jobId: secondJob.id, date: '2026-11-10' },
      ]).map(v => [v.id, v.jobId, tech.id, v.date, '09:00', '10:00', 'UTC', 'booked', [], []]))
```

```js
assert.deepEqual(Object.keys(v).sort(), ['id', 'version', 'jobId', 'technicianId', 'startAt', 'endAt', 'local', 'status', 'arrival', 'completion', 'lateEvidence', 'assignments'].sort())
```

```js
assert.deepEqual(sorted(s.jobs).map(j => [j.id, j.title, j.customerId, j.siteId, j.lines, j.checklist.map(i => [i.label, i.required]), j.forms.map(x => [x.name, x.formVersion, x.questions])]), sorted([
        { id: job.id, title: 'Dental field inspection', customerId: b.customer.id, siteId: b.site.id },
        { id: secondJob.id, title: 'River field inspection', customerId: f.secondCustomer.id, siteId: f.secondSite.id },
      ]).map(j => [j.id, j.title, j.customerId, j.siteId, [], [['Isolate supply', true], ['Inspect connections', true], ['Clean work area', false]], [['Frozen field inspection', 1, [{ id: 'safe', label: 'Supply isolated?', type: 'yesno', required: true }, { id: 'note', label: 'Inspection detail', type: 'notes', required: true }]]]]))
```

```js
assert.deepEqual(sorted(s.customers), sorted([{ id: b.customer.id, version: 1, name: 'Harbourview Dental', phone: '02 9555 0101' }, { id: f.secondCustomer.id, version: 1, name: 'River Clinic', phone: '212 555 0199' }]))
```

```js
assert.deepEqual(sorted(s.sites), sorted([{ id: b.site.id, version: 1, customerId: b.customer.id, address: '14 Harbour St, Balmain NSW 2041', accessNotes: 'Gate code at reception' }, { id: f.secondSite.id, version: 1, customerId: f.secondCustomer.id, address: '28 River Road', accessNotes: 'Use rear entrance' }]))
```

```js
assert.deepEqual(s.captures, [], 'no former-visit or employee capture')
```

```js
assert.deepEqual(populated, ['business', 'customers', 'jobs', 'sites', 'technicians', 'visits'])
```

```js
assert.deepEqual(await check(), before)
```

```js
sub.run('visit.capture', oldPayload, { commandId: oldCommand, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(h), afterMove)
```

```js
assert.deepEqual(s.jobs.map(j => j.id), [job.id])
```

```js
assert.deepEqual(s.customers.map(c => c.id), [b.customer.id])
```

```js
assert.deepEqual(s.sites.map(x => x.id), [b.site.id])
```

```js
assert.equal(s.visits.find(v => v.id === second.id).arrival, null, 'a previous worker arrival is not this person’s work')
```

```js
refuse('visit.complete', { visitId: second.id, deviceTime: at, summary: 'Cannot use previous arrival', signoff: { absentReason: 'Customer away' } }, 'NO_ARRIVAL')
```

```js
assert.equal(arrival.technicianId, tech.id)
```

```js
refuse(type, { visitId, deviceTime: at, kind: 'note', text: 'After assignment ends' })
```

### 114. tests/api/subcontractor-field.test.mjs

Surviving registration: DISP-013 invited subcontractor works only on current visits through every public door

Original step: point 4: arrival, every checklist item, note, captioned photo, described material, frozen form and completion land once with attribution

Assertion text count: 20; generated provider cases: 1.

```js
refuse(type, { visitId: employee.id, deviceTime: at, ...fields })
```

```js
assert.equal(s.captures.length, 10, 'these nine captures plus the independently recorded second-site arrival')
```

```js
assert.deepEqual(captures.map(x => x.kind).sort(), ['arrival', 'checklist', 'checklist', 'checklist', 'completion', 'form', 'material', 'note', 'photo'].sort())
```

```js
assert.ok(captures.every(x => x.visitId === own.id && x.technicianId === tech.id && x.receivedAt === at && x.deviceTime === at))
```

```js
assert.deepEqual(job.checklist.map(i => { const c = captures.find(c => c.itemId === i.id); return [c.label, c.result, c.note] }), [['Isolate supply', 'done', ''], ['Inspect connections', 'not applicable', 'No connection fitted'], ['Clean work area', 'done', '']])
```

```js
assert.equal(captures.find(x => x.kind === 'note').text, 'Supply isolated and inspected')
```

```js
assert.equal(photo.caption, 'Safe isolation at the panel')
```

```js
assert.deepEqual([material.description, material.quantity, material.unit, material.serviceId], ['Unpriced conduit', '2.5', 'ft', null])
```

```js
assert.deepEqual([form.formName, form.answers], ['Frozen field inspection', [{ questionId: 'safe', label: 'Supply isolated?', type: 'yesno', value: true }, { questionId: 'note', label: 'Inspection detail', type: 'notes', value: 'Frozen inspection completed' }]])
```

```js
assert.deepEqual([s.visits.find(x => x.id === own.id).status, s.visits.find(x => x.id === own.id).completion.summary], ['completed', 'Inspection complete'])
```

```js
assertTrail(h, ['capture.arrival', 'capture.checklist', 'capture.note', 'capture.photo', 'capture.material', 'capture.form', 'capture.completion'])
```

```js
assert.ok(event)
```

```js
assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.jobId], [sub.id, 'Sid Field', 'subcontractor', at, job.id])
```

```js
assert.equal(activity.filter(e => e.commandId === commandId && e.kind === kind).length, 1)
```

```js
assert.deepEqual([entry.actor_id, entry.actor_name, entry.actor_role, entry.at, entry.job_id, entry.summary], [sub.id, 'Sid Field', 'subcontractor', at, job.id, event.summary])
```

```js
assert.equal(exported.captures.filter(c => c.id === commandId).length, 1)
```

```js
assert.equal(exported.timeline.filter(e => e.command_id === commandId && e.kind === kind).length, 1)
```

```js
assert.deepEqual(await sub.state(), before)
```

```js
assert.deepEqual(await sub.run(type, payload, { commandId }), result)
```

```js
assert.deepEqual(await sub.state(), before)
```

### 115. tests/api/subcontractor-field.test.mjs

Surviving registration: DISP-013 invited subcontractor works only on current visits through every public door

Original step: point 3: files and every other read door expose no desk money, timeline or other worker data

Assertion text count: 10; generated provider cases: 1.

```js
assert.equal(ownFile.status, 200)
```

```js
assert.deepEqual(Buffer.from(await ownFile.arrayBuffer()), Buffer.from(png, 'base64'))
```

```js
assert.equal(response.status, 404)
```

```js
assert.equal((await h.request(`/api/glove/exports/${csv.id}.csv`)).status, 200)
```

```js
assert.equal(response.status, 403, `${path}: ${await response.clone().text()}`)
```

```js
assert.deepEqual((await read(h, `/api/glove/jobs/${j.id}/timeline`, sub.cookie)).events, [])
```

```js
assert.deepEqual(activity.events, [])
```

```js
assert.ok(history.entries.every(e => e.id === job.id || [own.id, ...trail.map(x => x.commandId)].includes(e.id)))
```

```js
assert.equal((await h.request(`/api/glove/equipment/${f.equipment.id}`, { as: sub.cookie })).status, 404)
```

```js
assert.deepEqual(push.devices, [])
```

### 116. tests/api/subcontractor-field.test.mjs

Surviving registration: DISP-013 invited subcontractor works only on current visits through every public door

Original step: point 5: all Technician-only writes refuse without retained effects; erasure and withdrawn sessions cannot replay captures

Assertion text count: 13; generated provider cases: 1.

```js
refuse(type, { visitId: second.id, deviceTime: at, ...payload })
```

```js
assert.equal(h.pushes.sent.length, 0)
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_push_subscriptions').first()).n, 0)
```

```js
sub.run(saved.type, saved.payload, { commandId: saved.commandId, error: 'FORBIDDEN' })
```

```js
assert.equal(erased.ok, false, 'erased capture cannot be resurrected')
```

```js
assert.ok(['FORBIDDEN', 'ERASED'].includes(erased.error.code))
```

```js
assert.deepEqual(await domain(h), afterErase)
```

```js
assert.equal((await h.request(`/api/glove/files/${photo.file.fileId}`, { as: sub.cookie })).status, 404)
```

```js
assert.doesNotMatch(JSON.stringify(await sub.state()), /Supply isolated and inspected|Safe isolation at the panel|Frozen inspection completed|Harbourview Dental/)
```

```js
assert.ok(revoked.status < 400)
```

```js
assert.equal((await h.request('/api/glove/state', { as: sub.cookie })).status, 401)
```

```js
assert.equal(denied.status, 401)
```

```js
assert.deepEqual(await domain(h), afterErase)
```

### 117. tests/api/suggest.test.mjs

Surviving registration: API-001 / DATA-002, DATA-009, DATA-010 / AGENT-005, AGENT-014 the agent drafts good, better and best for a 15-year-old furnace from the price book, held as a draft until a person approves

Original step: AGENT-005, AGENT-014 any extra, missing or malformed answer field refuses the whole draft without repair or retry

Assertion text count: 5; generated provider cases: 1.

```js
b.agent.run('quote.suggest', { enquiryId: request.id }, { error: 'MODEL' })
```

```js
assert.deepEqual(after.quotes, before.quotes, label)
```

```js
assert.deepEqual(after.enquiries, before.enquiries, label)
```

```js
assert.equal(after.events.filter(event => event.kind === 'quote.suggested').length, before.events.filter(event => event.kind === 'quote.suggested').length, label)
```

```js
assert.equal(h.models.calls.length, calls + 1, `${label}: no retry`)
```

### 118. tests/api/suggest.test.mjs

Surviving registration: API-001 / DATA-002, DATA-009, DATA-010 / AGENT-005, AGENT-014 the agent drafts good, better and best for a 15-year-old furnace from the price book, held as a draft until a person approves

Original step: AGENT-005, AGENT-014 three options from the price book at its prices, each with the model's reason

Assertion text count: 4; generated provider cases: 1.

```js
assert.deepEqual(options.map(o => [o.name, o.lines.map(l => [l.serviceId, l.quantity, l.unitPrice])]), [
      ['Good', [[tune.id, '1', '149.00']]],
      ['Better', [[tune.id, '1', '149.00'], [sensor.id, '1', '129.00']]],
      ['Best', [[replace.id, '1', '4890.00']]],
    ])
```

```js
assert.deepEqual(quote.drafted.reasons.map(r => [r.optionId, r.name, r.reason]), options.map((o, i) => [o.id, o.name, answer[['good', 'better', 'best'][i]].reason]))
```

```js
assert.match(quote.drafted.label, /^Drafted by the model from the request/)
```

```js
assert.deepEqual([quote.title, quote.enquiryId, quote.revisions[0].preparedBy.role], ['Furnace short-cycling', request.id, 'agent'])
```

### 119. tests/api/suggest.test.mjs

Surviving registration: API-001 / DATA-002, DATA-009, DATA-010 / AGENT-005, AGENT-014 the agent drafts good, better and best for a 15-year-old furnace from the price book, held as a draft until a person approves

Original step: AGENT-005, AGENT-014 the model saw the request, the furnace's age and history and the price book, never costs or who and where the customer is

Assertion text count: 7; generated provider cases: 1.

```js
assert.equal(call.body.store, false)
```

```js
assert.equal(sent.request.description, request.description)
```

```js
assert.deepEqual(sent.equipment.map(e => [e.type, e.ageYears]), [['Gas furnace', 15]])
```

```js
assert.deepEqual(Object.keys(sent).sort(), ['equipment', 'pastJobs', 'priceBook', 'request'])
```

```js
assert.ok(sent.pastJobs.some(j => j.completed.includes('Cleaned filters and coil')))
```

```js
assert.deepEqual(sent.priceBook.map(x => x.code).sort(), ['FLAME-SNS', 'FURN-96', 'FURN-TUNE', 'R32-KG', 'SPLIT-SVC'])
```

```js
assert.doesNotMatch(call.body.messages[1].content, /unitCost|2100|Harbourview|Harbour St|9555|Mei Lin|harbourview\.example|Priya|Tom B/)
```

### 120. tests/api/suggest.test.mjs

Surviving registration: API-001 / DATA-002, DATA-009, DATA-010 / AGENT-005, AGENT-014 the agent drafts good, better and best for a 15-year-old furnace from the price book, held as a draft until a person approves

Original step: AGENT-005, AGENT-014 the draft waits for a person: the agent cannot approve or send it; a dispatcher approves the prices

Assertion text count: 6; generated provider cases: 1.

```js
assert.equal(quote.status, 'draft')
```

```js
b.agent.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 }, { error: 'FORBIDDEN' })
```

```js
b.agent.run('quote.markSent', { quoteId: quote.id, version: quote.version, revision: 1, channel: 'email' }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual([approved.status, approved.revisions[0].approval.name], ['approved', 'Sam Ortiz'])
```

```js
assert.equal(s.enquiries.find(e => e.id === request.id).status, 'quoted')
```

```js
assert.ok(s.events.some(e => e.kind === 'quote.suggested' && e.subjectId === quote.id))
```

## Validation and custody

Actual command results and provenance are in the selected JSON receipts and logs. Final exact-SHA CI results are recorded in ci-receipt.json when available. Product and evidence refs have separate custody; the evidence commit is not a READY or landing signal.

Clause changes: none. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md were not edited by this task.

## Recorded validation results

| Check | Result | Product head |
| --- | --- | --- |
| All 30 touched API files, using Verify’s serial Node test command | 65 passed; 0 failed, skipped or cancelled; 528.394 seconds | fc2c10e01b67d2ab8e8db3edf30b5a549ce8e9c0 |
| Arrival-window file after merging main’s newer assertions | 2 passed; 0 failed, skipped or cancelled | a3cbd723ef3d90d9356259ea7deb2f0814e10cc7 |
| pnpm run typecheck | passed | a3cbd723ef3d90d9356259ea7deb2f0814e10cc7 |
| Edition source lock check | passed after regeneration | a3cbd723ef3d90d9356259ea7deb2f0814e10cc7 |
| New inventory counter, --limit 190 | 189; passed | a3cbd723ef3d90d9356259ea7deb2f0814e10cc7 |
| Assertion/refusal text multiset against merged main 5fc3e002ef52aef13409cc8e93786fd74afb6c6a | 4,101 before = 4,101 after; identical in all 30 files | a3cbd723ef3d90d9356259ea7deb2f0814e10cc7 |

The initial static comparison was 4,092 = 4,092. Main added nine assertion/refusal expressions in the arrival-window scenarios; all nine are retained in the final 4,101 = 4,101 comparison. Main’s only product change merged here was in src/ui/visit-panel.tsx; the other 29 touched API files retain the exact tested bytes.

Local commands used the supplied cloud toolchain (Node 24.19.0, pnpm 10.12.4). GitHub Verify selects its declared Node 22.20.0. No provider accounts, UI changes or owner browser sessions were needed for this test-only work.

Exact-SHA Verify: 42532456363; status=completed; conclusion=success; head=a3cbd723ef3d90d9356259ea7deb2f0814e10cc7; URL=https://github.com/just-every/run-glove/actions/runs/42532456363.

## Full touched-file assertion ledger, including shared fixtures

Each list includes every assertion/refusal expression in its touched file, including helpers shared by several steps and unchanged sibling tests. Every expression and its multiplicity matches merged main exactly. The per-step table above identifies the surviving registration for each original callback; shared helper expressions are listed here once at their source location rather than duplicated for each caller.

### tests/api/arrival-windows.test.mjs

Assertions before: 82; assertions after: 82.

```js
assert.deepEqual(await h.state(), before, `${code} leaves all business records unchanged`)
```

```js
refuse(h, b.dispatcher.run, 'visit.book', { jobId: j.id, technicianId, date: '2026-11-03', start, end, window: promised }, 'WINDOW')
```

```js
refuse(h, b.dispatcher.run, 'assessment.book', { enquiryId: enquiry.id, technicianId, date: '2026-11-03', start, end, window: promised }, 'WINDOW')
```

```js
assert.deepEqual(v.arrivalWindow, window)
```

```js
assert.deepEqual([v.local.start, v.local.end, v.local.timezone], [start, end, 'Australia/Sydney'])
```

```js
assert.deepEqual([assessment.visit.arrivalWindow, assessment.visit.local.start, assessment.visit.local.end, assessment.visit.local.timezone], [window, start, end, 'Australia/Sydney'])
```

```js
refuse(h, run, 'proposal.approve', dispatchDecision, 'FORBIDDEN')
```

```js
assert.deepEqual(visit.arrivalWindow, window)
```

```js
assert.equal(move.customer, 'customer not yet asked')
```

```js
assert.deepEqual(moved.arrivalWindow, afternoon)
```

```js
assert.deepEqual([moved.local.start, moved.local.end], ['13:00', '14:30'])
```

```js
assert.match(moved.assignments.at(-1).reason, /customer not yet asked/)
```

```js
assert.deepEqual(await h.state(), retained)
```

```js
assert.deepEqual(await b.dispatcher.run('proposal.approve', dispatchDecision, { commandId: 'synthetic-glove-window-proposal' }), approved)
```

```js
assert.deepEqual(await h.state(), retained)
```

```js
assert.equal(sameTime.customer, 'customer not yet asked')
```

```js
assert.deepEqual(moved.arrivalWindow, { start: '12:30', end: '14:30' })
```

```js
refuse(h, b.agent.run, 'visit.change', { visitId: moved.id, version: moved.version, window, start: '09:00', end: '10:30', reason: 'Try to execute the changed promise' }, 'GRANT_SCOPE')
```

```js
assert.equal(pending.customer, 'customer not yet asked')
```

```js
refuse(h, b.agent.run, 'proposal.approve', { proposalId: pending.id, version: pending.version }, 'FORBIDDEN')
```

```js
assert.deepEqual(await h.state(), kept)
```

```js
assert.deepEqual([saved.arrivalWindow, saved.assignments], [moved.arrivalWindow, moved.assignments])
```

```js
assert.ok(changedEvent.summary.includes('customer not yet asked'))
```

```js
assert.deepEqual([changedEvent.actor_id, changedEvent.actor_name, changedEvent.actor_role, changedEvent.at], [b.dispatcher.id, b.dispatcher.name, 'dispatcher', at])
```

```js
assert.deepEqual(booked.arrivalWindow, window)
```

```js
assert.ok((await h.state()).events.find(e => e.subjectId === booked.id && e.kind === 'visit.booked').summary.includes(exactText))
```

```js
assert.deepEqual(changed.arrivalWindow, window)
```

```js
refuse(h, b.dispatcher.run, 'visit.change', { visitId: changed.id, version: changed.version, start: '10:01', end: '11:00', reason: 'Outside kept promise' }, 'WINDOW')
```

```js
assert.deepEqual(changed.arrivalWindow, afternoon)
```

```js
assert.equal(changed.arrivalWindow, undefined)
```

```js
assert.equal((await crewVisits()).length, 2)
```

```js
assert.deepEqual([v.arrivalWindow, v.local.start, v.local.end], [window, '09:00', '10:30'])
```

```js
assert.deepEqual([v.arrivalWindow, v.local.start], [window, '10:00'])
```

```js
refuse(h, b.dispatcher.run, 'visit.change', { visitId: lead.id, version: lead.version, start: '10:01', end: '11:00', reason: 'Outside crew promise' }, 'WINDOW')
```

```js
assert.deepEqual([v.arrivalWindow, v.local.start], [afternoon, '13:00'])
```

```js
assert.equal(v.arrivalWindow, undefined)
```

```js
assert.deepEqual([v.arrivalWindow,v.local.start,v.local.end], [promised,start,end])
```

```js
assert.equal((await h.state()).enquiries.find(e => e.id === enquiry.id).wonJobId, j.id)
```

```js
assert.deepEqual(autos.map(v => v.technicianId), [b.tom.id, b.priya.id, b.tom.id])
```

```js
assert.equal(autos[0].assignments[0].reason, 'Assigned automatically: Tom B. had the fewest booked minutes that day (Tom B. 0, Priya N. 120)')
```

```js
refuse(h,b.dispatcher.run,'visit.change',override,'CONFLICT_REVIEW')
```

```js
assert.deepEqual([moved.technicianId,moved.assignments.at(-1).reason,moved.assignments.at(-1).reviewedConflicts], [b.priya.id,override.reason,review.details.conflicts])
```

```js
refuse(h,run,'visit.book',quotedPayload,'FORBIDDEN')
```

```js
refuse(h,run,'assessment.book',assessmentPayload,'FORBIDDEN')
```

```js
refuse(h,run,'visit.change',{ visitId:moved.id,version:moved.version,reason:'Unauthorized change' },'FORBIDDEN')
```

```js
refuse(h, b.dispatcher.run, 'assessment.book', { ...assessmentPayload, technicianId, start: '13:59' }, 'WINDOW')
```

```js
assert.deepEqual([assessment.visit.technicianId,assessment.visit.arrivalWindow,assessment.visit.local.start,assessment.visit.local.end],[b.tom.id,assessmentPayload.window,'15:00','16:00'])
```

```js
assert.deepEqual((await b.tomPerson.state()).visits.find(v=>v.id===assessment.visit.id).arrivalWindow,assessmentPayload.window)
```

```js
assert.deepEqual(await h.state(),before)
```

```js
assert.deepEqual(await b.dispatcher.run('visit.book',quotedPayload,{ commandId:replayId }),booked)
```

```js
assert.deepEqual(await b.dispatcher.run('visit.book',payloads[i],{ commandId:`synthetic-glove-window-auto-${i+1}` }),autos[i])
```

```js
assert.deepEqual(await b.dispatcher.run('assessment.book',assessmentPayload,{ commandId:'synthetic-glove-window-assessment' }),assessment)
```

```js
assert.deepEqual(await h.state(),before)
```

```js
refuse(h,b.dispatcher.run,'visit.book',quotedPayload,'FORBIDDEN',{ commandId:replayId })
```

```js
assert.deepEqual([event.actorId,event.actorName,event.actorRole,event.at],[b.dispatcher.id,b.dispatcher.name,'dispatcher',at])
```

```js
assert.ok(event.summary.includes('arrival window'))
```

```js
assert.ok(event.summary.includes(v.assignments[0].reason.split('; ')[0].toLowerCase()))
```

```js
assert.deepEqual([trail.summary,trail.actor_id,trail.actor_name,trail.actor_role,trail.at],[event.summary,b.dispatcher.id,b.dispatcher.name,'dispatcher',at])
```

```js
assert.deepEqual(saved.arrivalWindow,v.arrivalWindow)
```

```js
assert.deepEqual(saved.assignments,v.assignments)
```

```js
refuse(h,b.dispatcher.run,'visit.book',quotedPayload,'ERASED',{ commandId:replayId })
```

```js
refuse(h,b.dispatcher.run,'assessment.book',assessmentPayload,'ERASED',{ commandId:'synthetic-glove-window-assessment' })
```

```js
assert.equal(signedOut.status,204)
```

```js
assert.equal(revoked.status,401)
```

```js
assert.deepEqual(await h.state(),afterSignout)
```

```js
assert.equal(first.technicianId,b.tom.id,'exact zero-minute tie is resolved by name rather than creation order, excluding every earlier invalid name')
```

```js
assert.equal(first.assignments[0].reason,'Assigned automatically: Bea eligible had the fewest booked minutes that day (Bea eligible 0, Zoe eligible 0)')
```

```js
assert.equal(second.technicianId,b.priya.id)
```

```js
assert.equal(second.assignments[0].reason,'Assigned automatically: Zoe eligible had the fewest booked minutes that day (Zoe eligible 0)')
```

```js
refuse(h,b.dispatcher.run,'visit.book',payload,'NO_TECHNICIAN')
```

```js
assert.equal(unavailable.message,'No technician is free without a conflict at that time; choose one and review the conflicts.')
```

```js
assert.deepEqual(await h.state(),before)
```

```js
assert.equal(again.technicianId,b.tom.id)
```

```js
assert.equal(again.assignments[0].reason,'Assigned automatically: Bea eligible had the fewest booked minutes that day (Bea eligible 0, Zoe eligible 0)')
```

```js
assert.deepEqual((await visits()).map(v=>v.local.date).sort(),['2026-11-02','2026-11-09'])
```

```js
assert.equal(v.arrivalWindow,undefined)
```

```js
assert.deepEqual(revised.map(v=>[v.local.date,v.local.start]).sort(),[['2026-11-02','09:00'],['2026-11-09','11:00']])
```

```js
assert.equal(v.arrivalWindow,undefined)
```

```js
assert.deepEqual((await visits()).filter(v=>v.status==='booked').map(v=>v.local.date).sort(),['2026-11-02','2026-11-09','2026-11-16'])
```

```js
assert.equal(v.arrivalWindow,undefined)
```

```js
assert.ok(v.assignments.every(a=>a.arrivalWindow===undefined))
```

```js
assert.deepEqual(await h.state(),before)
```

### tests/api/customer-quotes.test.mjs

Assertions before: 322; assertions after: 322.

```js
b.office.run('quote.validity', { days: 10 }, { error: 'FORBIDDEN' })
```

```js
assert.ok(q.revisions[0].validUntil && q.revisions[0].validityZone === 'Australia/Sydney')
```

```js
h.command('quote.link', { quoteId: q.id, version: q.version }, { error: 'NOT_APPROVED' })
```

```js
b.agent.run('quote.link', { quoteId: q.id, version: q.version }, { error: 'FORBIDDEN' })
```

```js
assert.match(link.token, /^glq_[\w-]{43}$/)
```

```js
assert.equal(replay.token, undefined, 'only the issuing response reveals the bearer')
```

```js
assert.equal(secret.hash.length, 64)
```

```js
assert.notEqual(secret.hash, link.token)
```

```js
assert.equal(response.headers.get('cache-control'), 'no-store, private')
```

```js
assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
```

```js
assert.deepEqual(view.document.options.map(x => x.name), ['Good', 'Better', 'Best'])
```

```js
assert.equal(view.document.options[1].lines[0].customerDescription, service.description)
```

```js
assert.equal(view.document.terms, 'Payment within 14 days.')
```

```js
assert.ok(!JSON.stringify(view).includes('unitCost') && !JSON.stringify(view).includes(b.customer.phone))
```

```js
assert.equal((await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${link.token}` } })).status, 401)
```

```js
assert.equal((await h.request(`/api/glove/public/quote?token=${link.token}`, { as: '' })).status, 404)
```

```js
assert.equal((await respond(link.token, 'approve')).status, 409)
```

```js
assert.equal((await (await respond(link.token, 'approve')).json()).error.code, 'CONSENT_GATE')
```

```js
assert.equal((await respond(link.token, 'changes', { message: 'Can the work happen on Friday?' })).status, 200)
```

```js
assert.equal(view.state, 'open', 'requesting changes does not revoke the link')
```

```js
assert.equal(view.requests[0].message, 'Can the work happen on Friday?')
```

```js
assert.ok(stream.entries.some(x => x.kind === 'quote changes requested' && x.direction === 'inbound' && x.author === 'Mei Lin (claimed)' && x.channel === 'customer link'))
```

```js
assert.ok(history.entries.some(x => x.kind === 'quote response' && x.label.includes('Friday')))
```

```js
assert.ok(state.notices.some(n => n.quoteId === q.id && n.message.includes('Friday')))
```

```js
assert.equal((await h.state(b.priyaPerson.cookie)).quoteLinks.length, 0)
```

```js
assert.equal((await read(link.token)).status, 404)
```

```js
assert.equal(superseded.state, 'superseded')
```

```js
assert.equal(superseded.document, undefined)
```

```js
assert.equal((await respond(replacement.token, 'decline')).status, 409)
```

```js
assert.equal((await respond(next.token, 'decline')).status, 200)
```

```js
assert.equal(closed.status, 'declined')
```

```js
assert.equal(closed.declined.identity, 'CLAIMED')
```

```js
assert.equal(closed.declined.authenticationBasis, 'link handed out by staff, recipient unverified')
```

```js
assert.equal((await (await respond(next.token, 'decline')).json()).state, 'decided')
```

```js
h.command('quote.accept', { quoteId: q.id, version: closed.version, revision: 2, method: 'phone', customerName: 'Another person' }, { error: 'QUOTE_STATE' })
```

```js
assert.equal(Date.parse(expired.revisions[0].validUntil) - Date.parse(issueDate), 30 * 86400000)
```

```js
assert.equal((await (await read(old.token)).json()).state, 'expired')
```

```js
assert.equal((await (await respond(old.token, 'approve')).json()).error.code, 'EXPIRED')
```

```js
assert.ok(attempts.every(r => r.status === 200))
```

```js
assert.equal(state.notices.filter(n => n.quoteId === expired.id).length, 1)
```

```js
assert.equal(state.quotes.find(x => x.id === expired.id).customerRequests.length, 1)
```

```js
assert.equal(state.enquiries.find(x => x.id === enquiry.id).status, 'contacted')
```

```js
assert.equal((await read(scoped.token)).status, 404)
```

```js
assert.equal((await respond(scoped.token, 'changes', { message: 'Please revise' })).status, 404)
```

```js
assert.equal(refusedToken.status, 403)
```

```js
assert.equal((await read(old.token)).status, 404)
```

```js
assert.equal((await read(delegated.token)).status, 404)
```

```js
assert.equal((await respond(delegated.token, 'decline')).status, 404)
```

```js
assert.ok(h.email.sent.at(-1).body.content[0].value.includes(`/quote#token=${emailed.token}`))
```

```js
assert.equal(m.kind, 'quoteLink')
```

```js
assert.equal(m.to, b.customer.email)
```

```js
assert.equal((await postEvents(h, events.signed([{ email: m.to, timestamp: at, event: 'delivered', sg_event_id: 'quote-link-delivered', sg_message_id: 'quote-link-provider', rer_delivery_id: m.id }]))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[m.id].status, 'delivered')
```

```js
assert.equal((await h.state()).quotes.find(q => q.id === emailQuote.id).customerRequests[0].authenticationBasis, 'link sent by Glove to the address on record')
```

```js
assert.equal((await h.state()).quotes.find(q => q.id === refusedQuote.id).customerRequests[0].authenticationBasis, 'link handed out by staff, recipient unverified')
```

```js
assertTrail(h, ['quote.validity', 'quote.linkIssued', 'quote.linkRevoked', 'quote.customer.changes', 'quote.customer.decline', 'quote.customer.update'])
```

```js
assert.equal(declineFact.method, 'customer link')
```

```js
assert.equal(declineFact.identity, 'CLAIMED')
```

```js
assert.ok(!JSON.stringify(exported).includes(token))
```

```js
assert.ok(!JSON.stringify(await h.db.prepare('SELECT result FROM glove_commands').all()).includes(emailed.token))
```

```js
b.dispatcher.run('quote.consent', { version: (await h.state()).business[0].version, text: disclosure, accept: true }, { error: 'FORBIDDEN' })
```

```js
h.command('quote.consent', { version: (await h.state()).business[0].version, text: disclosure, accept: false }, { error: 'CONSENT' })
```

```js
assert.equal(view.selection.document.totals.total, '225.00')
```

```js
assert.deepEqual(q.customerRequests[0].choice.addOnIds, ['addon-1'])
```

```js
assert.equal(q.status, 'approved')
```

```js
assert.equal((await (await post(first.token, { action: 'approve' })).json()).error.code, 'REVISION')
```

```js
assert.equal(view.selection.document.totals.total, '235.00')
```

```js
assert.ok(!JSON.stringify(view.selection).includes('unitCost'))
```

```js
assert.equal(response.status, 200, await response.clone().text())
```

```js
assert.equal(view.decision, 'accepted')
```

```js
assert.equal(view.signed.confirmation.status, 'accepted')
```

```js
assert.equal(signing.identity, 'CLAIMED')
```

```js
assert.equal(signing.capacity, 'Property manager')
```

```js
assert.equal(signing.authenticationBasis, 'link sent by Glove to the address on record')
```

```js
assert.equal(signing.ip, '198.51.100.37')
```

```js
assert.equal(signing.browser, 'synthetic-glove-34 browser')
```

```js
assert.deepEqual(signing.signature, answer.signature)
```

```js
assert.equal(signing.consent.text, disclosure)
```

```js
assert.equal(signing.consent.hash, createHash('sha256').update(disclosure).digest('hex'))
```

```js
assert.equal(signing.revisionDocumentHash, link.documentHash)
```

```js
assert.equal(signing.chosenDocumentHash, view.signed.chosenDocumentHash)
```

```js
assert.equal(copy.status, 200)
```

```js
assert.equal(copy.headers.get('content-type'), 'application/octet-stream')
```

```js
assert.equal(deskCopy.status, 200)
```

```js
assert.equal(await deskCopy.text(), html)
```

```js
assert.equal((await h.request(`/api/glove/quotes/${q.id}/signed`, { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal(createHash('sha256').update(html).digest('hex'), signing.signedCopy.sha256)
```

```js
assert.ok(html.includes('Washable filter') && html.includes('235.00') && html.includes('polyline'))
```

```js
assert.ok(html.includes('data:image/jpeg;base64,') && html.includes('synthetic-glove-42 original image'))
```

```js
assert.ok(html.includes('&lt;script&gt;no execution&lt;/script&gt;') && !html.includes('<script>'))
```

```js
assert.ok(!html.includes('unitCost') && !html.includes(link.token))
```

```js
assert.equal(confirmation.kind, 'quoteConfirmation')
```

```js
assert.equal(confirmation.to, b.customer.email)
```

```js
assert.equal(provider === 'postmark' ? emailed.body.HtmlBody : provider === 'ses' ? emailed.body.Content.Simple.Body.Html.Data : emailed.body.content.find(c => c.type === 'text/html').value, html)
```

```js
assert.equal((await (await post(link.token, answer)).json()).decision, 'accepted')
```

```js
assert.equal(h.email.sent.length, beforeReplay)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_quote_signed_chunks WHERE quote_id=?').bind(q.id).first()).n, chunks.n)
```

```js
assert.equal((await postEvents(h, edge ? edge.callback(receipt(h, confirmation)) : events.signed([{ email: confirmation.to, timestamp: at, event: 'delivered', sg_event_id: 'synthetic-glove-35', sg_message_id: 'synthetic-glove-36', rer_delivery_id: confirmation.id }]))).status, 200)
```

```js
assert.equal((await (await read(link.token)).json()).signed.confirmation.status, 'delivered')
```

```js
assert.ok(conversation.entries.some(e => e.kind === 'quote accepted' && e.author === 'Mei Lin (claimed)'))
```

```js
assert.ok(conversation.entries.some(e => e.kind === 'signed quote confirmation emailed' && e.delivery.includes('Delivered')))
```

```js
assert.ok(history.entries.some(e => e.kind === 'quote response' && e.label.includes('Mei Lin (claimed) approve')))
```

```js
assert.ok(history.entries.some(e => e.kind === 'message' && e.label.includes('Signed quote')))
```

```js
assert.deepEqual(job.lines, accepted.acceptance.lines)
```

```js
assert.deepEqual(job.totals, accepted.acceptance.totals)
```

```js
assert.deepEqual(job.lines.map(l => l.description), ['Better condenser work', 'Washable filter'])
```

```js
h.command('quote.revise', { quoteId: q.id, version: (await h.state()).quotes.find(x => x.id === q.id).version, lines: options[0].lines }, { error: 'QUOTE_CLOSED' })
```

```js
assert.equal(await (await h.request('/api/glove/public/quote/signed', { as: '', headers: headers(link.token) })).text(), html)
```

```js
assert.equal((await read(link.token)).status, 404)
```

```js
assert.equal(await (await h.request('/api/glove/public/quote/signed', { as: '', headers: headers(fresh.token) })).text(), html)
```

```js
assertTrail(h, ['quote.consentAccepted', 'quote.customer.changes', 'quote.customer.approve', 'email.delivered'])
```

```js
assert.ok(!JSON.stringify(exported).includes(fresh.token))
```

```js
assert.equal((await post(peerLink.token, { action: 'approve', name: 'Synthetic peer owner', capacity: 'Owner', choice: peerChoice, documentHash: peerSelection.documentHash, selectionHash: peerSelection.selection.hash, consent: { version: peerSelection.disclosure.version, hash: peerSelection.disclosure.hash, affirmed: true }, signature: { kind: 'typed', text: 'Synthetic peer owner' } })).status, 200)
```

```js
assert.ok((await (await h.request('/api/glove/public/quote/signed', { as: '', headers: headers(peerLink.token) })).text()).includes(b.customer.email))
```

```js
assert.equal((await post(cleanLink.token, { action: 'approve', name: 'Synthetic peer owner', capacity: 'Owner', choice: peerChoice, documentHash: cleanSelection.documentHash, selectionHash: cleanSelection.selection.hash, consent: { version: cleanSelection.disclosure.version, hash: cleanSelection.disclosure.hash, affirmed: true }, signature: { kind: 'typed', text: 'Synthetic peer owner' } })).status, 200)
```

```js
assert.ok(privacy.download.includes(signing.signedCopy.sha256))
```

```js
assert.deepEqual(preview.sharedSignedCopies.map(x => [x.quoteId, x.name, x.peers]), [[peerQuote.id, `Quote ${peerQuote.number} revision 1`, 1]])
```

```js
assert.equal(preview.peersAffected, 1)
```

```js
assert.equal((await read(fresh.token)).status, 404)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_quote_signed_chunks WHERE quote_id=?').bind(q.id).first()).n, 0)
```

```js
assert.equal((await h.request('/api/glove/public/quote/signed', { as: '', headers: headers(peerLink.token) })).status, 404, 'an immutable peer original containing the erased identifier is withdrawn')
```

```js
assert.equal((await h.state()).quotes.find(x => x.id === peerQuote.id).status, 'accepted')
```

```js
assert.equal((await h.state()).quotes.find(x => x.id === peerQuote.id).acceptance.signing.signedCopy, null)
```

```js
assert.equal((await h.request(`/api/glove/quotes/${peerQuote.id}/signed`)).status, 404)
```

```js
assert.equal((await (await read(peerLink.token)).json()).signed.copyWithdrawn.reason, 'Signed original and signature withdrawn for customer privacy. The accepted quote remains.')
```

```js
assert.equal((await h.state()).customers.find(x => x.id === peer.id).name, peer.name)
```

```js
assert.equal(await (await h.request('/api/glove/public/quote/signed', { as: '', headers: headers(cleanLink.token) })).text(), cleanHtml, 'the unrelated peer original remains byte-exact and available')
```

```js
assert.equal((await read()).signingAvailable, false)
```

```js
assert.equal((await (await post({ action: 'approve' })).json()).error.code, 'CONSENT_GATE')
```

```js
assert.equal(refused.status, 403)
```

```js
assert.equal((await (await post(answer)).json()).error.code, 'CONSENT_CHANGED')
```

```js
assert.equal((await (await post(answer)).json()).error.code, 'CONSENT_GATE')
```

```js
assert.equal((await (await post({ ...answer, signature: { kind: 'typed', text: '' } })).json()).error.code, 'INPUT')
```

```js
assert.ok(wins.some(r => r.status === 200))
```

```js
assert.ok(['accepted', 'declined'].includes(final.status))
```

```js
assert.equal(final.acceptance.signing.signature.kind, 'typed')
```

```js
assert.equal(final.acceptance.signing.confirmation.status, 'not_connected')
```

```js
assert.equal(final.declined, null)
```

```js
assert.equal(final.acceptance, null)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_quote_signed_chunks WHERE quote_id=?').bind(q.id).first()).n, 0)
```

```js
assert.equal((await (await post(answer)).json()).decision, final.status)
```

```js
assert.deepEqual((await h.state()).quotes.find(x => x.id === q.id), final)
```

```js
assert.equal(response.status, 200)
```

```js
assert.deepEqual(bytes, submitted)
```

```js
assert.equal(hash(bytes), file.sha256)
```

```js
assert.deepEqual([...selected.selection.document.files].sort(), expectedFiles.map(([file]) => file.fileId).sort())
```

```js
assert.equal(approved.status, 200, await approved.clone().text())
```

```js
assert.equal(view.decision, 'accepted')
```

```js
assert.deepEqual(view.signed.signedCopy, manifest)
```

```js
assert.deepEqual(accepted.acceptance.signing.signature, signature)
```

```js
assert.equal(response.status, 200)
```

```js
assert.equal(hash(bytes), manifest.sha256)
```

```js
assert.equal(bytes.length, manifest.size)
```

```js
assert.ok(manifest.chunks > 1, 'the actual copy spans multiple retained chunks')
```

```js
assert.equal(rows.length, manifest.chunks)
```

```js
assert.deepEqual(rows.map(row => row.ordinal), Array.from({ length: manifest.chunks }, (_, i) => i))
```

```js
assert.deepEqual(Buffer.concat(rows.map(row => row.bytes)), bytes)
```

```js
assert.equal(images.length, expectedFiles.length, 'every original is embedded exactly once')
```

```js
assert.ok(embedded, 'each image is self-contained')
```

```js
assert.equal(embedded[1], expectedFiles[i][0].mediaType)
```

```js
assert.deepEqual(Buffer.from(embedded[2], 'base64'), authorizedOriginals[i], 'embedded image matches its authorized original byte-for-byte')
```

```js
assert.ok(sigHtml)
```

```js
assert.match(sigHtml, /viewBox="0 0 600 200"/)
```

```js
assert.deepEqual(strokes, signature.strokes, 'the embedded drawing retains every submitted stroke and point')
```

```js
assert.equal(decode(/<p\b[^>]*>([\s\S]*?)<\/p>/.exec(sigHtml)?.[1] ?? ''), signature.text)
```

```js
assert.ok(!sigHtml.includes('<Glove>'), 'typed signature stays escaped text')
```

```js
assert.equal((await (await respond(link.token, answer)).json()).decision, 'accepted')
```

```js
assert.deepEqual(await stored(q.id), beforeReplay, 'approval replay creates no second copy or changed chunk')
```

```js
assert.deepEqual((await h.state()).quotes.find(row => row.id === q.id), accepted)
```

```js
assert.deepEqual((await h.state()).quotes.find(row => row.id === copy.id).acceptance.signing.signedCopy, copy.manifest)
```

```js
assert.equal(response.status, 200)
```

```js
assert.equal(hash(bytes), copy.manifest.sha256)
```

```js
assert.equal(bytes.length, copy.manifest.size)
```

```js
assert.deepEqual(bytes, copy.bytes)
```

```js
assert.equal((await h.request(`/api/glove/quotes/${copy.id}/signed`, { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal((await h.request(`/api/glove/quotes/${copy.id}/signed`, { as: '' })).status, 401)
```

```js
assert.equal((await h.request('/api/glove/public/quote/signed', { as: '' })).status, 404)
```

```js
assert.equal((await h.request('/api/glove/public/quote/signed', { as: b.priyaPerson.cookie })).status, 404)
```

```js
assert.deepEqual(await stored(copy.id), copy.rows)
```

```js
assertTrail(h, ['document.photo', 'quote.approved', 'quote.linkIssued', 'quote.customer.approve'])
```

```js
assert.deepEqual(await stored(damaged.id), damaged.rows.map((row, i) => i === 0 ? { ...row, bytes: altered } : row))
```

```js
assert.deepEqual((await h.state()).quotes.find(row => row.id === damaged.id).acceptance.signing.signedCopy, damaged.manifest)
```

```js
assert.equal(response.status, 500)
```

```js
assert.equal((await response.json()).error.code, 'SIGNED_COPY')
```

```js
assert.deepEqual(await stored(copies[1].id), copies[1].rows)
```

```js
assert.deepEqual(Buffer.from(await (await publicCopy(copies[1].token)).arrayBuffer()), copies[1].bytes, 'the other signed copy is unaffected')
```

```js
assert.deepEqual(q.revisions[0].deposit, { kind: 'percent', value: '25' })
```

```js
b.office.run('quote.deposit', { quoteId: q.id, version: q.version, deposit: { kind: 'amount', value: '500.00' } }, { error: 'FORBIDDEN' })
```

```js
h.command('quote.deposit', { quoteId: q.id, version: q.version, deposit: null }, { error: 'QUOTE_STATE' })
```

```js
h.command('payment.depositCheckout', { quoteId: q.id, version: q.version, method: 'card' }, { error: 'DEPOSIT_GATE' })
```

```js
assert.equal((await (await publicRequest({ action: 'approve' })).json()).error.code, 'CONSENT_GATE')
```

```js
assert.deepEqual(selected.document.deposit, { kind: 'amount', value: '500.00' })
```

```js
assert.equal((await publicRequest({ action: 'approve', choice, name: 'Mei Lin', capacity: 'Owner', documentHash: selected.documentHash, selectionHash: selected.selection.hash, consent: { ...selected.disclosure, affirmed: true }, signature: { kind: 'typed', text: 'Mei Lin' } })).status, 200)
```

```js
b.office.run('payment.depositCheckout', { quoteId: q.id, version: q.version, method: 'card' }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await h.request('/api/glove/commands', { as: '', method: 'POST', headers: { authorization: `Bearer ${link.token}` }, body: { commandId: randomUUID(), type: 'payment.depositCheckout', payload: { quoteId: q.id, version: q.version, method: 'card' } } })).status, 401)
```

```js
assert.equal((await publicRequest({ action: 'checkout' })).status, 400)
```

```js
assert.equal(h.stripePayments.calls.length, network, 'customer quote bearer has no payment authority')
```

```js
assert.equal(deposit.amount, '500.00')
```

```js
assert.equal(deposit.jobId, job.id)
```

```js
assert.equal(deposit.invoiceId, null)
```

```js
assert.equal(deposit.chosenDocumentHash, q.acceptance.signing.chosenDocumentHash)
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded')).status, 200)
```

```js
assert.equal((await h.state()).payments.find(p => p.id === deposit.id).status, 'paid')
```

```js
assert.equal((await (await h.request('/api/glove/balances')).json()).invoices.find(i => i.id === inv.id).due, '1350.00')
```

```js
assert.equal(held.invoiceId, inv.id)
```

```js
assert.equal(refund.method, 'card')
```

```js
assert.equal(refund.paymentId, deposit.id)
```

```js
assert.equal(refund.status, 'paid')
```

```js
assert.equal((await (await h.request('/api/glove/balances')).json()).invoices.find(i => i.id === inv.id).due, '1400.00')
```

```js
assertTrail(h, ['deposit.serviceConfigured', 'deposit.quoteConfigured', 'deposit.requested', 'deposit.allocated', 'refund.paid'])
```

```js
b.office.run('financing.connect', {}, { error: 'FORBIDDEN' })
```

```js
assert.equal((await (await post(apply)).json()).error.code, 'CONSENT')
```

```js
assert.equal(h.wisetack.calls.length, 0)
```

```js
assert.equal(initiated.financing.status, 'application-ready')
```

```js
assert.match(initiated.financingUrl, /^https:\/\/wisetack-sec\.us\/#\//)
```

```js
assert.deepEqual(Object.keys(h.wisetack.calls[0].body).sort(), ['purchaseId', 'serviceCompletedOn', 'transactionAmount', 'transactionPurpose'])
```

```js
assert.equal(h.wisetack.calls[0].body.transactionAmount, '9800.00')
```

```js
assert.equal(f.consent.affirmed, true)
```

```js
assert.equal((await (await post({ ...apply, financingConsent: true })).json()).financingUrl, undefined, 'application URL is shown once and never recovered by creating another request')
```

```js
assert.equal(h.wisetack.calls.length, 1)
```

```js
assert.doesNotMatch(JSON.stringify(await h.state()), /wisetack-sec\.us\/#|synthetic-glove-60/)
```

```js
assert.equal(current.status, 'Approved')
```

```js
assert.deepEqual(current.offer, { aprRange: '0-29.9', monthRange: '3-60' })
```

```js
assert.equal((await h.state()).payments.length, 0, 'approval is never booked as money')
```

```js
h.command('financing.refresh', { financingId: f.id, version: current.version }, { error: 'FINANCING_ALLOCATION' })
```

```js
assert.equal((await h.state()).payments.length, 0, 'funding cannot attach to an unsigned or different chosen revision')
```

```js
assert.equal((await post({ action: 'approve', choice, name: 'Mei Lin', capacity: 'Owner', documentHash: selected.documentHash, selectionHash: selected.selection.hash, consent: { ...selected.disclosure, affirmed: true }, signature: { kind: 'typed', text: 'Mei Lin' } })).status, 200)
```

```js
assert.equal(payment.amount, '9800.00')
```

```js
assert.equal(payment.fee, '300.00')
```

```js
assert.equal(payment.invoiceId, inv.id)
```

```js
assert.equal((await (await h.request('/api/glove/balances')).json()).invoices.find(i => i.id === inv.id).due, '0.00')
```

```js
assert.equal((await h.state()).payments.filter(p => p.financingId === f.id).length, 1)
```

```js
assert.equal(refund.status, 'paid')
```

```js
assert.equal(refund.method, 'wisetack')
```

```js
assert.equal(refund.paymentId, payment.id)
```

```js
assert.equal((await (await h.request('/api/glove/balances')).json()).invoices.find(i => i.id === inv.id).due, '100.00')
```

```js
assert.match(h.email.sent.at(-1).body.content[0].value, /Wisetack test funding confirmed/)
```

```js
assert.doesNotMatch(h.email.sent.at(-1).body.content[0].value, /confirmed by Stripe/)
```

```js
assert.equal((await h.state()).messageStates[receipt.id].status, 'accepted')
```

```js
assert.equal((await postEvents(h, mail.signed([{ email: receipt.to, timestamp: Math.floor(Date.now() / 1000), event: 'delivered', sg_event_id: randomUUID(), sg_message_id: 'synthetic-glove-mail-62', rer_delivery_id: receipt.id }]))).status, 200)
```

```js
assert.ok((await (await h.request(`/api/glove/payments/${payment.id}/timeline`)).json()).events.some(e => e.kind === 'email.delivered'))
```

```js
assertTrail(h, ['financing.connectionChanged', 'financing.applicationRequested', 'financing.applicationReady', 'financing.statusRequested', 'financing.providerStatus', 'refund.paid', 'email.accepted', 'email.delivered'])
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-60|wisetack-sec\.us\/#|synthetic-glove-private-60|private@example\.test/)
```

```js
assert.deepEqual((await b.priyaPerson.state()).financings, [])
```

```js
assert.equal((await h.request('/api/glove/public/quote?financingId=' + f.id, { as: '' })).status, 404)
```

```js
assert.ok(history.entries.some(e => e.kind === 'financing' && e.id === f.id && e.status === 'Paid'))
```

```js
assert.deepEqual((await h.state()).financings, [])
```

```js
assert.equal(anonymous.amount, '9800.00')
```

```js
assert.ok(anonymous.erasedAt)
```

```js
assert.doesNotMatch(JSON.stringify(await h.state()), /synthetic-glove-financing-1|synthetic-glove-finance-refund-/)
```

```js
assert.equal((await post({ action: 'approve', choice, name: 'Mei Lin', capacity: 'Owner', documentHash: selected.documentHash, selectionHash: selected.selection.hash, consent: { ...selected.disclosure, affirmed: true }, signature: { kind: 'typed', text: 'Mei Lin' } })).status, 200)
```

```js
assert.equal(refund.status, 'paid')
```

```js
assert.equal(refund.invoiceId, null)
```

```js
assert.equal((await h.state()).payments.find(p => p.id === refund.id).invoiceId, invoice.id)
```

```js
assert.equal((await (await h.request('/api/glove/balances')).json()).invoices.find(i => i.id === invoice.id).due, '1400.00')
```

```js
assert.equal((await (await h.request('/api/glove/reports/receivables.json?asOf=2099-01-01')).json()).totals[0].total, '1400.00')
```

```js
assertTrail(h, ['deposit.allocated', 'refund.allocated'])
```

```js
assert.deepEqual((await h.command('customer.hubPreview', { customerId: b.customer.id })).invoices, [])
```

```js
assert.deepEqual((await h.command('customer.hubPreview', { customerId: b.customer.id })).receipts, [], 'an unconfirmed attempt is not paid money')
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded', { at: Date.parse('2030-03-12T12:00:00Z') / 1000 })).status, 200)
```

```js
assert.equal((await person.run('customer.hubPreview', payload, { error: 'FORBIDDEN' })).message, message)
```

```js
person.run('customer.hubPreview', payload, { error: 'FORBIDDEN' })
```

```js
assert.equal(unauthenticated.status, 403)
```

```js
assert.equal((await unauthenticated.json()).error.message, message)
```

```js
assert.equal(response.status, 403)
```

```js
assert.equal((await response.json()).error.message, message)
```

```js
h.command('customer.hubPreview', { ...payload, siteId: otherSite.id }, { error: 'INPUT' })
```

```js
assert.equal((await h.command('customer.hubPreview', { customerId }, { error: 'NOT_FOUND' })).message, 'Customer preview unavailable')
```

```js
h.command('customer.hubPreview', { customerId }, { error: 'NOT_FOUND' })
```

```js
assert.equal(preview.mode, 'owner-preview')
```

```js
assert.deepEqual(preview.customer, { id: b.customer.id, name: b.customer.name })
```

```js
assert.ok(!JSON.stringify(preview).includes(privateValue), 'contact and private access facts stay out of the inspection')
```

```js
assert.deepEqual(preview.actions, { signIn: false, approve: false, pay: false, requestWork: false, renew: false, updateCard: false })
```

```js
assert.deepEqual(preview.quotes.map(q => q.id).sort(), [quote.id, accepted].sort())
```

```js
assert.equal(preview.quotes.find(q => q.id === quote.id).lines[0].customerDescription, 'Customer-facing annual inspection')
```

```js
assert.deepEqual(quoted.options.map(o => [o.id, o.name, o.totals.total]), [['option-1', 'Standard inspection', '189.00'], ['option-2', 'Extended inspection', '289.00']])
```

```js
assert.deepEqual(quoted.addOns.map(a => [a.id, a.name, a.lines[0].description, a.totals.total]), [['addon-1', 'Filter pack', 'Replacement filter', '50.00']])
```

```js
assert.equal(quoted.options[1].lines[0].customerDescription, 'Customer-facing annual inspection')
```

```js
assert.deepEqual(preview.invoices.map(i => [i.id, i.revision]), [[invoice.id, 2]])
```

```js
assert.deepEqual(preview.receipts, [{ id: payment.id, invoiceId: invoice.id, amount: payment.amount, currency: 'USD', confirmedAt: payment.confirmedAt }])
```

```js
assert.deepEqual(preview.equipment.map(e => e.id), [equipment.id])
```

```js
assert.deepEqual(preview.agreements.map(a => a.id), [agreement.id])
```

```js
assert.deepEqual(preview.visits.map(v => v.id), before.visits.map(v => v.id))
```

```js
assert.deepEqual(preview.reports, before.serviceReports.map(r => ({ id: r.id, title: 'Service 2030-03-12', completedAt: r.snapshot.visit.completedAt, summary: 'Cleaned filters and coil' })))
```

```js
assert.doesNotMatch(JSON.stringify(preview), /synthetic-glove-private|synthetic-glove-other|accessNotes|unitCost|savedCards|stripeMethodId|tokenHash|files|signature|authorization|Customer authorizes this business|synthetic-glove-6/)
```

```js
assert.ok(!preview.quotes.some(q => q.id === draft.id))
```

```js
assert.equal(alternate.quotes.length, 0)
```

```js
assert.equal(alternate.invoices.length, 0)
```

```js
assert.equal(alternate.reports.length, 0)
```

```js
assert.equal(alternate.equipment[0].type, 'synthetic-glove-other-equipment')
```

```js
assertTrail(h, ['hub.previewed'])
```

```js
assert.equal(inspection.actor_name, 'Olivia Owner')
```

```js
assert.equal(inspection.actor_role, 'owner')
```

```js
assert.equal(inspection.subject_id, b.customer.id)
```

```js
assert.equal(inspection.at, '2030-03-12T12:00:00.000Z')
```

```js
assert.match(inspection.summary, /Owner inspected proposed hub content/)
```

```js
assert.deepEqual(JSON.parse(inspection.data), { customerId: b.customer.id, mode: 'owner-preview', recordChanges: [] })
```

```js
assert.doesNotMatch(JSON.stringify(trail), /Customer-facing annual inspection|Cleaned filters|synthetic-glove-private|stripeMethodId/)
```

```js
assert.deepEqual(after[key], before[key], 'inspection has no customer action or financial effect')
```

```js
assert.deepEqual([h.stripePayments.calls.length, h.email.sent.length, h.twilio.calls.length], providerCalls)
```

```js
assert.ok(!draftInspection.quotes.some(q => q.id === quote.id), 'a new unapproved revision removes the formerly sent quote from the current preview')
```

```js
assert.ok(draftInspection.quotes.some(q => q.id === accepted), 'other permitted documents remain visible')
```

```js
assert.equal(decided.status, 'accepted')
```

```js
assert.deepEqual(decided.lines.map(l => [l.description, l.total]), [['Extended coil inspection', '289.00'], ['Replacement filter', '50.00']])
```

```js
assert.equal(decided.totals.total, '339.00', 'the accepted choice replaces the first-option price in the inspection')
```

```js
assert.doesNotMatch(JSON.stringify(decided), /unitCost|preparedBy|recordedBy|signature/)
```

```js
assert.equal((await delegated.run('customer.hubPreview', payload, { commandId: id, error: 'FORBIDDEN' })).message, message)
```

```js
delegated.run('customer.hubPreview', payload, { commandId: id, error: 'FORBIDDEN' })
```

```js
assert.equal((await changed.run('customer.hubPreview', payload, { commandId: id, error: 'FORBIDDEN' })).message, message)
```

```js
changed.run('customer.hubPreview', payload, { commandId: id, error: 'FORBIDDEN' })
```

```js
assert.equal((await h.request('/auth/signout', { as: signedOut.cookie, method: 'POST', body: {} })).status, 204)
```

```js
assert.equal((await signedOut.run('customer.hubPreview', payload, { error: 'FORBIDDEN' })).message, message)
```

```js
signedOut.run('customer.hubPreview', payload, { error: 'FORBIDDEN' })
```

```js
assert.equal((await h.command('customer.hubPreview', payload, { error: 'NOT_FOUND' })).message, 'Customer preview unavailable')
```

```js
h.command('customer.hubPreview', payload, { error: 'NOT_FOUND' })
```

```js
h.command('customer.hubPreview', payload, { commandId, error: 'ERASED' })
```

```js
assert.doesNotMatch(saved.result, /Customer-facing annual inspection|Harbourview|Cleaned filters/)
```

```js
assert.ok(erasedTrail.every(e => e.summary === 'Customer personal data erased' && e.data === '{}'))
```

```js
assert.equal((await h.command('customer.hubPreview', { customerId: other.id })).equipment[0].type, 'synthetic-glove-other-equipment')
```

```js
assert.equal((await h.command('customer.hubPreview', { customerId: other.id }, { error: 'NOT_FOUND' })).message, 'Customer preview unavailable')
```

```js
h.command('customer.hubPreview', { customerId: other.id }, { error: 'NOT_FOUND' })
```

```js
assert.equal((await h.command('customer.hubPreview', { customerId: survivor.id })).equipment[0].type, 'synthetic-glove-other-equipment')
```

### tests/api/email.test.mjs

Assertions before: 203; assertions after: 203.

```js
b.dispatcher.run('email.send', { kind: 'quote', id: quote.id, version: quote.version }, { error: 'MAIL' })
```

```js
b.office.run('mail.connect', connect, { error: 'FORBIDDEN' })
```

```js
h.command('mail.connect', { ...connect, eventKey: 'whsec_not-a-sendgrid-key' }, { error: 'INPUT' })
```

```js
h.command('mail.connect', { ...connect, fromEmail: 'not an address' }, { error: 'INPUT' })
```

```js
b.priyaPerson.run('email.send', { kind: 'quote', id: quote.id, version: quote.version }, { error: 'FORBIDDEN' })
```

```js
assert.equal(quoteSent.authorization, `Bearer ${apiKey}`)
```

```js
assert.deepEqual([quoteSent.to, quoteSent.body.from.email, quoteSent.body.custom_args.rer_delivery_id], ['mei@harbourview.example', 'office@harbourair.example', quoteMail.id])
```

```js
assert.match(quoteSent.body.content[0].value, new RegExp(`${quote.number} \\(revision 1\\)[\\s\\S]*Condenser fan motor[\\s\\S]*Total: \\$`))
```

```js
assert.deepEqual([quote.status, quote.sent.at(-1).channel, quote.sent.at(-1).messageId], ['sent', 'email', quoteMail.id])
```

```js
b.office.run('email.send', { kind: 'invoice', id: inv.id, version: inv.version }, { error: 'INVOICE_STATE' })
```

```js
b.dispatcher.run('email.send', { kind: 'invoice', id: inv.id, version: inv.version }, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.email.sent.at(-1).to, 'payables@harbourview.example')
```

```js
assert.match(h.email.sent.at(-1).body.content[0].value, new RegExp(`invoice ${inv.number} for ${job.number}`))
```

```js
assert.equal(h.email.sent.at(-1).to, 'orders@supplyco.example')
```

```js
assert.deepEqual([sentPo.status, sentPo.sent.method, sentPo.sent.messageId], ['sent', 'email', poMail.id])
```

```js
assert.deepEqual([quoteMail, invoiceMail, poMail].map(m => states[m.id].status), ['accepted', 'accepted', 'accepted'])
```

```js
assert.deepEqual([states[refusedMail.id].status, states[refusedMail.id].next], ['rejected', 'Check the email connection and the address, then send again.'])
```

```js
assert.equal((await postEvents(h, { raw: JSON.stringify(batch), headers: {} })).status, 401)
```

```js
assert.equal((await postEvents(h, mailEvents('sendgrid').signed(batch))).status, 401)
```

```js
assert.equal((await postEvents(h, sendgrid.signed([sgEvent(quoteMail, 'delivered', 1, 'someone@else.example')]))).status, 401)
```

```js
assert.deepEqual(Object.values((await h.state()).messageStates).map(s => s.status).sort(), ['accepted', 'accepted', 'accepted', 'rejected'])
```

```js
assert.equal(delivered.status, 200, await delivered.clone().text())
```

```js
assert.equal((await postEvents(h, sendgrid.signed(batch))).status, 200, 'a replayed batch is acknowledged')
```

```js
assert.deepEqual([quoteMail, invoiceMail, poMail].map(m => states[m.id].status), ['delivered', 'bounced', 'delivered'])
```

```js
assert.equal(states[invoiceMail.id].text, 'Bounced: payables@harbourview.example did not accept it (reported by SendGrid)')
```

```js
assert.deepEqual(state.emailWarnings[customer.id], { messageId: invoiceMail.id, to: 'payables@harbourview.example', status: 'bounced', at: states[invoiceMail.id].at, text: states[invoiceMail.id].text, next: 'Check the address with the customer, correct it on their record and send again.' })
```

```js
assert.deepEqual(about(invoiceMail.id), [['email.queued', 'office'], ['email.accepted', 'provider'], ['email.bounced', 'provider']])
```

```js
assert.deepEqual(about(poMail.id), [['email.queued', 'office'], ['email.accepted', 'provider'], ['email.delivered', 'provider']])
```

```js
assert.deepEqual(await stream(`customerId=${customer.id}`), [
    ['quote emailed', 'outbound', 'Sam Ortiz', 'mei@harbourview.example', 'Delivered to mei@harbourview.example\'s mail server (reported by SendGrid)'],
    ['invoice emailed', 'outbound', 'Olu Office', 'payables@harbourview.example', 'Bounced: payables@harbourview.example did not accept it (reported by SendGrid)'],
    ['purchase order emailed', 'outbound', 'Olu Office', 'orders@supplyco.example', 'Delivered to orders@supplyco.example\'s mail server (reported by SendGrid)'],
  ])
```

```js
assert.deepEqual((await stream(`jobId=${job.id}`)).map(e => e[0]), ['invoice emailed', 'purchase order emailed'])
```

```js
assertTrail(h, ['mail.connected', 'email.queued', 'email.accepted', 'email.rejected', 'email.delivered', 'email.bounced'])
```

```js
assert.equal(exported.messages.length, 4)
```

```js
assert.ok(exported.timeline.some(e => e.kind === 'email.accepted' && JSON.parse(e.data).providerMessageId === 'sg-receipt-1'))
```

```js
assert.equal(exported.timeline.filter(e => e.kind === 'email.delivered').length, 2, 'a replayed event is recorded once')
```

```js
assert.ok(!everything.includes(apiKey) && !everything.includes(sendgrid.eventKey), 'no provider key in state or export')
```

```js
assert.deepEqual([viaResend.provider, viaResend.idempotencyKey, viaResend.to], ['resend', resent.id, 'mei@harbourview.example'])
```

```js
assert.equal((await postEvents(h, resend.signed(resendEvent))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[resent.id].status, 'delivered')
```

```js
b.office.run('email.send', { kind: 'quote', id: again.id, version: again.version + 1 }, { error: 'MAIL' })
```

```js
assert.equal((await postEvents(h, resend.signed(resendEvent))).status, 404)
```

```js
h.command('mail.morning', { enabled: true }, { error: 'MAIL' })
```

```js
b.office.run('mail.morning', { enabled: true }, { error: 'FORBIDDEN' })
```

```js
h.command('mail.morning', { enabled: true, time: '7am' }, { error: 'INPUT' })
```

```js
assert.deepEqual([h.email.sent.length, brief.emailed.enabled, brief.emailed.status], [0, true, 'scheduled'])
```

```js
assert.equal(h.email.sent.length, 0)
```

```js
assert.equal(h.email.sent.length, 1)
```

```js
assert.deepEqual([sent.to, sent.authorization, sent.body.custom_args.rer_delivery_id, sent.body.subject], ['owner@example.test', `Bearer ${apiKey}`, 'brief:2026-10-23', 'Morning brief for 2026-10-23 from Harbour Air & Electrical'])
```

```js
assert.match(text, new RegExp(`Unbilled work\\n- ${job.number} for Harbourview Dental is complete with no invoice`))
```

```js
assert.equal(h.email.sent.length, 1, 'a later run on the same local date sends nothing more')
```

```js
assert.equal((await (await h.request('/api/glove/brief?at=2026-10-22T20:30:00Z')).json()).emailed.status, 'accepted')
```

```js
assert.equal((await postEvents(h, sendgrid.signed([event(1, 'someone@else.example')]))).status, 401)
```

```js
assert.equal((await postEvents(h, sendgrid.signed([event(2)]))).status, 200)
```

```js
assert.equal((await postEvents(h, sendgrid.signed([event(2)]))).status, 200, 'a replayed event is acknowledged')
```

```js
assert.deepEqual([delivered.status, delivered.to, delivered.text], ['delivered', 'owner@example.test', 'Delivered to owner@example.test\'s mail server (reported by SendGrid)'])
```

```js
assert.equal(h.email.sent.length, 2)
```

```js
assert.deepEqual([refused.date, refused.status, refused.next], ['2026-10-24', 'rejected', 'Check the email connection; Glove does not retry, and sends the next brief on the next business-local date.'])
```

```js
assert.equal(h.email.sent.length, 2)
```

```js
assertTrail(h, ['mail.morning', 'email.queued', 'email.accepted', 'email.delivered', 'email.rejected'])
```

```js
assert.deepEqual(exported.timeline.filter(e => e.subject_kind === 'brief').map(e => e.kind), ['email.queued', 'email.accepted', 'email.delivered', 'email.queued', 'email.rejected'])
```

```js
assert.ok(!JSON.stringify(exported).includes(apiKey) && !JSON.stringify(exported).includes(sendgrid.eventKey), 'no provider key in the export')
```

```js
assert.equal(response.status, status, await response.clone().text())
```

```js
assert.deepEqual(await response.json(), { ok: false, error: { code: 'MAIL_EVENT', message: 'Not accepted: the signature, the event form or the message it names did not match.' } })
```

```js
assert.equal(await mailSnapshot(h), before, 'rejection writes no product, Activity, callback counter, replay ID, warning or inbound record')
```

```js
assert.deepEqual([unmatched.status, unmatchedBody], [200, { ok: true }])
```

```js
assert.equal(await mailSnapshot(h), before, 'authenticated unmatched consumes no ID or verified-at and has no effect')
```

```js
assert.equal((await h.state()).messageStates[sent.id].status, 'accepted')
```

```js
assert.equal(matchedResponse.status, 200)
```

```js
assert.deepEqual(await matchedResponse.json(), unmatchedBody, 'successful and unmatched acknowledgements disclose no match count')
```

```js
assert.equal((await h.state()).messageStates[sent.id].status, 'delivered')
```

```js
assert.ok((await h.state()).mailCallbacks.verifiedAt)
```

```js
assert.equal((await postEvents(h, signer.signed([matchLater]))).status, 200, 'unmatched event did not reserve its event ID')
```

```js
assert.equal((await h.state()).emailWarnings[b.customer.id].status, 'complained')
```

```js
assert.equal((await postEvents(peerView, accepted)).status, 200, 'verified traffic is never rate limited by rejection counts')
```

```js
assert.equal((await postEvents(h, resend.signed(re))).status, 200)
```

```js
assert.equal(await mailSnapshot(h), reBefore)
```

```js
assert.equal((await postEvents(h, resend.signed({ ...re, data: { email_id: `re-receipt-${h.email.sent.length}`, to: [reSent.to] } }))).status, 200)
```

```js
b.office.run('mail.connect', connect, { error: 'FORBIDDEN' })
```

```js
assert.match(connected.callbackPassword, /^[a-f0-9]{64}$/)
```

```js
assert.equal((await h.command('mail.connect', connect, { commandId })).callbackPassword, undefined)
```

```js
assert.equal(stored.current_hash, (await import('node:crypto')).createHash('sha256').update(current).digest('hex'))
```

```js
assert.equal(stored.previous_hash, null)
```

```js
assert.equal((await h.state()).business[0].mail.postmarkAllowlist, false)
```

```js
assert.ok(out, JSON.stringify((await h.state()).messageStates))
```

```js
assert.deepEqual([out.provider, out.authorization, out.body.Metadata.glove_delivery_id], ['postmark', connect.apiKey, message.id])
```

```js
assert.equal(insecure.status, 401, 'Postmark Basic credentials are accepted only over HTTPS')
```

```js
assert.equal(await mailSnapshot(h), insecureBefore)
```

```js
assert.equal((await postEvents(h, post(delivered))).status, 200)
```

```js
assert.equal((await postEvents(h, post(delivered))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[m.id].status, 'delivered')
```

```js
assert.equal((await h.db.prepare("SELECT count(*) AS n FROM rer_mail_event_receipts WHERE provider='postmark'").first()).n, 1)
```

```js
assert.equal((await postEvents(h, post(missing))).status, 200)
```

```js
assert.equal(await mailSnapshot(h), before)
```

```js
assert.equal((await postEvents(h, post(pmEvent(message, recordType, details)))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[message.id].status, expected)
```

```js
b.office.run('mail.callback', { action: 'rotate' }, { error: 'FORBIDDEN' })
```

```js
assert.notEqual(rotated.callbackPassword, current)
```

```js
assert.equal(Date.parse(rotatedStored.previous_until) - Date.parse(rotation.at), 86_400_000)
```

```js
assert.equal((await postEvents(h, post(delivered))).status, 200, 'old credential valid during 24h overlap')
```

```js
assert.equal((await postEvents(h, post(delivered, rotated.callbackPassword))).status, 200)
```

```js
assert.equal((await postEvents(h, post(fresh, rotated.callbackPassword))).status, 200, 'new credential still valid at old expiry')
```

```js
assert.equal((await postEvents(h, post(delivered, again.callbackPassword, { 'cf-connecting-ip': '3.134.147.250' }))).status, 200)
```

```js
assert.equal((await h.state()).business[0].mail.postmarkAllowlist, true, 'reconnecting credentials preserves the owner-selected allowlist')
```

```js
assert.equal((await postEvents(h, post(delivered, reconnected.callbackPassword, { 'cf-connecting-ip': '3.134.147.250' }))).status, 200)
```

```js
assertTrail(h, ['mail.connected', 'mail.callback.rotate', 'mail.callback.revokePrevious', 'mail.callback.allowlist', 'email.delivered', 'email.bounced', 'email.deferred', 'email.failed', 'email.complained'])
```

```js
assert.ok(!visible.includes(secret), 'no secret in state, trail, export or saved outcomes')
```

```js
assert.equal((await postEvents(h, post(delivered, again.callbackPassword))).status, 404)
```

```js
assert.equal((await postEvents(h, post(delivered, reconnected.callbackPassword))).status, 404)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_mail_callback_auth').first()).n, 0)
```

```js
assert.deepEqual([sent.provider, sent.authorization, sent.body.Metadata.glove_delivery_id], ['postmark', apiKey, c.message.id])
```

```js
assert.equal((await h.state()).messageStates[c.message.id].status, 'accepted')
```

```js
assert.equal(h.email.sent.length, 5, 'one real send per outcome, with only the Postmark network edge faked')
```

```js
assertTrail(h, ['mail.connected', 'email.queued', 'email.accepted'])
```

```js
assert.ok(!JSON.stringify({ state, activity, exported, saved }).includes(secret), 'state, Activity, business export and saved command outcomes exclude credentials')
```

```js
assert.equal((await postEvents(h, { raw: JSON.stringify(cases[0].payload), headers: {} })).status, 401)
```

```js
assert.deepEqual(await inspect(), beforeUnsigned, 'unsigned delivery creates no outcome or receipt')
```

```js
assert.equal(response.status, 200, await response.text())
```

```js
assert.deepEqual([states[c.message.id].status, states[c.message.id].providerMessageId, states[c.message.id].at], [c.status, c.message.receipt, c.at], c.status)
```

```js
assert.equal(facts.length, 1, `${c.status} is retained exactly once in the business export`)
```

```js
assert.deepEqual(JSON.parse(fact.data), {
      messageId: c.message.id, provider: 'postmark', providerMessageId: c.message.receipt,
      eventId: c.details.ID === undefined ? `Delivery:${c.message.receipt}:Delivery:${c.message.to}:${Date.parse(c.at)}` : `${c.details.RecordType}:${c.details.ID}`,
      status: c.status, occurredAt: c.at,
    })
```

```js
assert.equal(visible.length, 1, `${c.status} has the same retained fact in Activity`)
```

```js
assert.deepEqual([visible[0].kind, visible[0].subjectKind, visible[0].subjectId, visible[0].actorName, visible[0].actorRole, visible[0].at], [`email.${c.status}`, 'message', c.message.id, 'Postmark', 'provider', '2026-11-08T12:01:00.000Z'])
```

```js
assert.equal(visible[0].summary, fact.summary)
```

```js
assert.ok(visible[0].summary.includes(c.message.to))
```

```js
assert.ok(visible[0].summary.includes(`Provider reference: ${c.message.receipt}`), `${c.status} exposes its provider reference in Activity`)
```

```js
assert.ok(visible[0].summary.includes(`Occurred at: ${c.at}`), `${c.status} exposes provider occurrence separately from receipt time in Activity`)
```

```js
assert.equal(receipts.length, cases.indexOf(c) + 1)
```

```js
assert.deepEqual(await inspect(), retained, 'actual Worker disposal and recreation retains every state, Activity fact, export fact and receipt')
```

```js
assert.equal((await postEvents(h, callback(c.payload))).status, 200)
```

```js
assert.deepEqual(await inspect(), retained, `${c.status} replay adds no fact or receipt and changes no message state`)
```

```js
assert.equal((await postEvents(h, callback(unknown))).status, 401)
```

```js
assert.deepEqual(await inspect(), retained, 'unrecognized bounce Type cannot become failed, consume a receipt or add an Activity fact')
```

```js
assert.equal(h.email.sent.length, 5, 'callbacks, restart, replay and refusal never resend')
```

```js
h.command('mail.connect', { ...connection, sns: { ...settings, region: 'elsewhere' } }, { error: 'INPUT' })
```

```js
h.command('mail.connect', { ...connection, apiKey: '{}' }, { error: 'INPUT' })
```

```js
assert.ok(out, JSON.stringify((await h.state()).messageStates))
```

```js
assert.equal(out.provider, 'ses')
```

```js
assert.match(out.authorization, /^AWS4-HMAC-SHA256 Credential=TESTONLYACCESSKEY0001\/\d{8}\/us-east-1\/ses\/aws4_request,/)
```

```js
assert.equal(out.body.ConfigurationSetName, settings.configurationSet)
```

```js
assert.deepEqual(out.body.EmailTags, [{ Name: 'glove_delivery_id', Value: Buffer.from(message.id).toString('base64url') }])
```

```js
assert.equal(h.email.fetches.length, n)
```

```js
assert.equal(h.email.fetches.length, 1)
```

```js
assert.equal((await h.state()).messageStates[m.id].status, 'accepted')
```

```js
assert.equal((await postEvents(h, unknownSigned)).status, 200)
```

```js
assert.equal(await mailSnapshot(h), before)
```

```js
assert.equal(h.email.subscriptions.length, 0)
```

```js
assert.equal((await postEvents(h, signed)).status, 200)
```

```js
assert.equal((await postEvents(h, signed)).status, 200)
```

```js
assert.equal((await postEvents(h, signer.signed(payload))).status, 200, 'same SES event with another SNS ID remains one event')
```

```js
assert.equal((await h.state()).messageStates[m.id].status, 'delivered')
```

```js
assert.equal((await h.db.prepare("SELECT count(*) AS n FROM rer_mail_event_receipts WHERE provider='ses'").first()).n, 1)
```

```js
assert.equal((await postEvents(h, signer.signed(e))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[message.id].status, expected)
```

```js
assert.equal(h.email.fetches.length, fetchCount, 'unsigned confirmation fetched nothing')
```

```js
assert.equal((await postEvents(h, subscribe)).status, 200)
```

```js
assert.equal((await postEvents(h, subscribe)).status, 200)
```

```js
assert.equal(h.email.subscriptions.length, 1)
```

```js
assert.equal((await postEvents(h, unsub)).status, 200)
```

```js
assert.equal(h.email.subscriptions.length, 1)
```

```js
assert.match((await h.state()).mailCallbacks.warning, /cancelled the email-event subscription/)
```

```js
assertTrail(h, ['email.delivered', 'email.bounced', 'email.failed', 'email.deferred', 'email.complained', 'email.rejected', 'mail.subscription.confirmed', 'mail.subscription.unsubscribed'])
```

```js
assert.equal(trail.exported.timeline.filter(e => e.kind === 'email.delivered').length, 1)
```

```js
assert.ok(!visible.includes('test-only-ses-secret-not-an-account') && !visible.includes('test-only-subscription-token'))
```

```js
assert.equal((await postEvents(h, subscribe)).status, 404)
```

```js
assert.equal(h.email.sent.length, count, 'command replay never sends again')
```

```js
assert.equal(h.email.sent.at(-1).provider, provider)
```

```js
assert.ok(textOf(h.email.sent.at(-1)).includes(record.number))
```

```js
assert.equal((await h.state()).messageStates[message.id].status, 'accepted')
```

```js
assert.deepEqual(sent.map(m => m.to), [customer.email, customer.apEmail, po.supplierEmail])
```

```js
assert.equal((await postEvents(h, event)).status, 200)
```

```js
assert.equal((await postEvents(h, event)).status, 200)
```

```js
assert.equal((await h.state()).messageStates[m.id].status, outcome)
```

```js
assert.equal(state.emailWarnings[customer.id].messageId, sent[1].id)
```

```js
assert.match(state.emailWarnings[customer.id].next, /Check the address/)
```

```js
assert.deepEqual(timeline.events.filter(e => e.subjectId === m.id).map(e => e.kind), ['email.queued', 'email.accepted', 'email.delivered', 'email.bounced'])
```

```js
assert.deepEqual(stream.entries.filter(e => e.channel === 'email').map(e => [e.direction, e.author, e.to]), sent.map(m => ['outbound', 'Olu Office', m.to]))
```

```js
assert.equal(label.status, expected)
```

```js
assert.ok(label.next)
```

```js
assert.equal(h.email.sent.length, count)
```

```js
assert.equal((await h.state()).messageStates[message.id].status, expected)
```

```js
assert.equal((await postEvents(h, edge.callback(recovered, 'delivered', new Date(Date.now() + 2000).toISOString()))).status, 200)
```

```js
assert.equal((await h.state()).emailWarnings[customer.id], undefined)
```

```js
assertTrail(h, ['mail.connected', 'email.accepted', 'email.delivered', 'email.bounced', 'email.rejected', 'email.rate_limited', 'email.uncertain'])
```

```js
assert.ok(fact, `${provider} ${m.kind} keeps ${kind} in export`)
```

```js
assert.equal(JSON.parse(fact.data).providerMessageId, m.receipt)
```

```js
assert.ok(activity.some(e => e.id === fact.id), 'the same provider fact is readable in Activity')
```

```js
assert.ok(!JSON.stringify(exported).includes(edge.secret))
```

```js
assert.equal(h.email.sent.length, before + 1)
```

```js
assert.equal(state.status, ['accepted', 'rejected', 'rate_limited', 'uncertain', 'accepted'][i])
```

```js
assert.equal(state.date, `2026-10-${23 + i}`)
```

```js
assert.equal(h.email.sent.at(-1).to, 'owner@example.test')
```

```js
assert.match(textOf(h.email.sent.at(-1)), new RegExp(state.date))
```

```js
assert.match(textOf(h.email.sent.at(-1)), /Overdue invoices/)
```

```js
assert.ok(textOf(h.email.sent.at(-1)).includes(overdue.number), 'email includes the same overdue invoice as the owner brief')
```

```js
assert.equal((await postEvents(h, event)).status, 200)
```

```js
assert.equal((await postEvents(h, event)).status, 200)
```

```js
assert.equal((await get(at)).status, i === 0 ? 'bounced' : 'delivered')
```

```js
assert.match(state.next, /does not retry/)
```

```js
assert.equal(h.email.sent.length, before + 1)
```

```js
assertTrail(h, ['email.accepted', 'email.bounced', 'email.delivered', 'email.rejected', 'email.rate_limited', 'email.uncertain'])
```

```js
assert.equal(JSON.parse(fact.data).providerMessageId, reference)
```

```js
assert.ok(activity.some(e => e.id === fact.id))
```

```js
assert.equal(exported.timeline.filter(e => e.subject_kind === 'brief' && e.kind === 'email.queued').length, 5)
```

```js
assert.ok(!JSON.stringify(exported).includes(edge.secret))
```

### tests/api/movein.test.mjs

Assertions before: 388; assertions after: 388.

```js
b.office.run('import.stage', { files: input }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(recordProjection(staged.preview.records), expectedRecords)
```

```js
assert.deepEqual(staged.preview.byKind.jobactivity, { input: 3, mapped: 2, merged: 0, rejected: 0, unused: 1 })
```

```js
assert.deepEqual(staged.preview.byKind.attachment, { input: 3, mapped: 2, merged: 0, rejected: 0, unused: 1 })
```

```js
assert.deepEqual(businessRecords(await h.state()), businessRecords(before), 'preview changes no business record')
```

```js
assert.deepEqual(await h.state(), stagedState, 'wrong fingerprint changes no record')
```

```js
assert.deepEqual(batch.preview, staged.preview, 'the committed batch retains the exact reviewed projection')
```

```js
assert.deepEqual(await commit(staged, staged.preview.fingerprint, { commandId: commitId }), batch)
```

```js
assert.deepEqual(await h.state(), committed, 'lost-answer replay is inert')
```

```js
assert.deepEqual(committed[kind].filter(r => !before[kind].some(old => old.id === r.id)).map(r => r.id).sort(), destinations.map(d => d.id).sort(), kind)
```

```js
assert.equal(committed[kind].find(r => r.id === d.id).source.id, source.sourceId)
```

```js
assert.ok((d.kind === 'customers' ? merged.contacts : merged.lines ?? merged.revisions[0].lines).some(item => item.sourceId === record.sourceId), 'merged records retain their source identity')
```

```js
assert.deepEqual([importedJob.number, importedJob.customerId, importedJob.siteId, importedJob.title, importedJob.status, importedJob.workDone, importedJob.purchaseOrder],
    ['SM8-1012', `sm8-${company1}`, 'sm8-site-40348167947ffe64470806c2', 'Coolroom compressor not starting', 'invoiced', 'Replaced start capacitor, tested 30 min', 'BB-2219'])
```

```js
assert.deepEqual(priceLines(importedJob.lines), [
    ['7c8d9e0f-0001-4a1b-8c2d-3e4f5a6b7c01', 'Call-out and diagnosis', '1', '145.00', '145.00', 'GST'],
    ['7c8d9e0f-0002-4a1b-8c2d-3e4f5a6b7c02', 'Start capacitor 45uF', '1', '38.50', '38.50', 'GST'],
  ])
```

```js
assert.deepEqual(importedJob.totals, { subtotal: '183.50', gst: '18.35', total: '201.85' })
```

```js
assert.deepEqual([quote.status, quote.revisions[0].approval, quote.customerId, quote.siteId], ['draft', null, `sm8-${company2}`, 'sm8-site-509de9a75b649d441a872db0'])
```

```js
assert.deepEqual(priceLines(quote.revisions[0].lines), [['7c8d9e0f-0004-4a1b-8c2d-3e4f5a6b7c04', 'Zone controller supply and install', '1', '1240.00', '1240.00', 'GST']])
```

```js
assert.deepEqual(committed.visits.filter(v => v.source?.system === 'ServiceM8').map(v => [v.id, v.jobId, v.technicianId, v.startAt, v.endAt, v.status, v.arrival]), [
    ['sm8-5a6b7c8d-0001-4e9f-8a0b-1c2d3e4f5a01', `sm8-${completed}`, 'sm8-f0e1d2c3-1111-4a5b-9c8d-7e6f5a4b3c01', '2026-08-14T03:00:00.000Z', '2026-08-14T05:15:00.000Z', 'completed', null],
    ['sm8-5a6b7c8d-0002-4e9f-8a0b-1c2d3e4f5a02', `sm8-${openJob}`, 'sm8-f0e1d2c3-2222-4a5b-9c8d-7e6f5a4b3c02', '2026-10-19T22:00:00.000Z', '2026-10-20T00:00:00.000Z', 'booked', null],
  ])
```

```js
assert.equal(response.status, 200)
```

```js
assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(file.text ?? file.base64, file.text === undefined ? 'base64' : 'utf8'), file.name)
```

```js
assert.equal((await h.request(download(summary), { as: b.office.cookie })).status, 403)
```

```js
assert.equal((await h.request(download(summary), { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal((await h.request(download(summary), { as: '' })).status, 401)
```

```js
assert.deepEqual(businessRecords(await h.state()), businessRecords(committed), 'actual Worker restart retains all mapped values')
```

```js
assert.deepEqual(recordProjection(repeat.preview.records), expectedRecords.map(r => ({ ...r, status: 'already-moved-in', alreadyMovedIn: true })))
```

```js
assert.equal(repeat.preview.alreadyMovedIn, 22)
```

```js
assert.deepEqual(businessRecords(await h.state()), beforeRepeat, 'a repeated commit changes no business record')
```

```js
assert.deepEqual({ alreadyMovedIn: repeat.preview.alreadyMovedIn, status: response.status, resultStatus: result.result?.status ?? null, error: result.error ?? null, business: businessRecords(await upgraded.state()), journal: await originalJournal() },
      { alreadyMovedIn: expectedRecords.length, status: 200, resultStatus: 'committed', error: null, business: before, journal: journalBefore }, 'an unchanged 22-record main-era import repeats after upgrade without changing business records or original source claims')
```

```js
assert.equal(undone.status, 'undone')
```

```js
assert.deepEqual(businessRecords(await h.state()), businessRecords(before), 'undo restores the exact pre-move-in business snapshot')
```

```js
assertTrail(h, ['import.previewed', 'import.committed', 'import.undone'])
```

```js
assert.deepEqual([fact.actorName, fact.actorRole], ['Olivia Owner', 'owner'])
```

```js
assert.equal(exported.imports.find(i => i.id === batch.id).preview.fingerprint, staged.preview.fingerprint)
```

```js
assert.ok(exported.timeline.some(e => e.id === fact.id))
```

```js
h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Try to back out' }, { error: 'IMPORT_DEPENDENTS' })
```

```js
assert.deepEqual(refused.details.dependents, [{ kind: 'visits', id: visit.id, refersTo: workOrder.id }])
```

```js
assert.deepEqual(after, beforeRefusal, 'dependent-work refusal changes every record and event by zero')
```

```js
assertTrail(h, ['import.previewed', 'import.committed', 'visit.booked'])
```

```js
assert.equal((await h.request(originalUrl, { as: reader.cookie })).status, 200)
```

```js
assert.equal((await h.request(originalUrl, { as: reader.cookie })).status, 403, 'withdrawn Owner authority cannot read originals with an existing session')
```

```js
assert.equal((await h.db.prepare("SELECT state FROM ik_jobs").first()).state, 'completed', 'the journal was not touched')
```

```js
edited.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Refuse losing native work' }, { error: 'NATIVE_EDIT_CONFLICT' })
```

```js
assert.deepEqual(refusal.details, { kind: 'customers', id: customer.id })
```

```js
assert.deepEqual(await edited.state(), beforeRefusal, 'edited fixture customer blocks undo without changing any record or event')
```

```js
assertTrail(edited, ['import.committed', 'customer.saved'])
```

```js
assert.deepEqual([change.actorName, change.actorRole], ['Olivia Owner', 'owner'])
```

```js
assert.equal(exported.customers.find(c => c.id === customer.id).name, 'Balmain Bakehouse amended by owner')
```

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.equal((await h.state()).invoices.length, 0, 'preview creates no invoice')
```

```js
assert.deepEqual([invoice.openingBalance.amount, invoice.openingBalance.sourceTotal, invoice.openingBalance.asOf, invoice.openingBalance.notForPosting, invoice.revisions[0].approval], ['76.50', '201.85', '2026-10-22', true, null])
```

```js
assert.equal(state.payments.length, 0, 'historical payments are not new Glove receipts')
```

```js
h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'IMPORTED_INVOICE' })
```

```js
assert.equal(aging.customers.find(c => c.customerId === invoice.customerId).total, '76.50')
```

```js
assert.equal((await h.state()).invoices.length, 1)
```

```js
h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Back out' }, { error: 'NATIVE_EDIT_CONFLICT' })
```

```js
assert.match(conflict.message, /changed in Glove/)
```

```js
assert.deepEqual(afterRefusal, beforeRefusal, 'edited-record refusal changes every record and event by zero')
```

```js
assertTrail(h, ['import.previewed', 'import.committed', 'customer.saved'])
```

```js
assert.equal((await h.state()).customers.find(c => c.id === customer.id).name, 'Rozelle Physio & Pilates')
```

```js
assert.equal((await h.state()).imports.find(i => i.id === batch.id).status, 'committed')
```

```js
assert.ok(preview.preview.rejections.some(r => r.kind === 'job' && reason.test(r.reason)), label)
```

```js
assert.equal((await rejected.state()).invoices.length, 0)
```

```js
assert.ok(preview.preview.rejections.some(r => r.kind === 'job' && /total does not match/.test(r.reason)))
```

```js
assert.ok(!after.jobs.some(j => j.source?.id === jobs[0].uuid))
```

```js
assert.equal(after.invoices.length, 0)
```

```js
assert.ok(original, 'privacy export must include retained source payment history for the customer of a rejected job')
```

```js
assert.deepEqual(JSON.parse(Buffer.from(original.bytes, 'base64').toString()).map(p => p.uuid).sort(), ['synthetic-glove-payment-1', 'synthetic-glove-payment-inactive'])
```

```js
assert.ok(exported.importOriginals.some(f => f.kind === 'attachment' && Buffer.from(f.bytes, 'base64').toString() === 'Synthetic retained payment attachment bytes'), 'rejected-job payment originals remain exportable')
```

```js
assert.ok(!JSON.stringify(exported).includes('Synthetic peer payment note'))
```

```js
assert.deepEqual(JSON.parse(Buffer.from(peerPayments.bytes, 'base64').toString()).map(p => p.uuid), ['synthetic-glove-payment-peer'])
```

```js
assert.equal((await rejected.request(`/api/glove/imports/${rejectedBatch.id}/files/${original.sha256}`)).status, 404, 'erasure withdraws shared byte-exact originals from the download door')
```

```js
assert.ok(!journal.includes('Synthetic retained payment note'))
```

```js
assert.ok(!journal.includes('Synthetic inactive payment note'))
```

```js
assert.ok(!journal.includes('Synthetic retained payment attachment bytes'))
```

```js
assert.ok(!journal.includes(Buffer.from('Synthetic retained payment attachment bytes').toString('base64')))
```

```js
assert.ok(JSON.stringify(remaining).includes('Synthetic peer payment note'))
```

```js
b.office.run('import.stage', { format: 'jobber', files }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.ok(staged.preview.unmappedFields.clients.includes('contacts'))
```

```js
assert.ok(staged.preview.unmappedFields.jobs.includes('unsupportedSourceField'))
```

```js
assert.ok(staged.preview.unmappedFields.jobs.some(f => f.includes('recurrence:')))
```

```js
assert.deepEqual(staged.preview.missingAttachments.map(a => a.name).sort(), ['Balance confirmation.pdf', 'Warranty conditions.pdf'])
```

```js
assert.equal((await h.state()).jobs.length, before.jobs.length, 'preview is inert')
```

```js
assert.equal(summary.size, bytes.length)
```

```js
assert.equal(summary.sha256, createHash('sha256').update(bytes).digest('hex'))
```

```js
assert.equal(imported('customers')[0].source.id, 'synthetic-glove-client')
```

```js
assert.equal(imported('sites')[0].customerId, imported('customers')[0].id)
```

```js
assert.deepEqual(imported('customers')[0].contacts.map(c => [c.sourceId, c.email, c.phone, c.sourceContactId]), [['synthetic-glove-email', 'synthetic-glove-1@example.test', '', 'synthetic-glove-contact'], ['synthetic-glove-phone', '', '+15125550123', 'synthetic-glove-contact']])
```

```js
assert.equal(imported('jobs').find(j => j.source.id === 'synthetic-glove-job-2').status, 'archived')
```

```js
assert.equal(imported('enquiries')[0].customerId, imported('customers')[0].id)
```

```js
assert.equal(imported('technicians')[0].operatorId, null)
```

```js
assert.equal(imported('jobs')[0].importedRecurrence.active, false)
```

```js
assert.equal(imported('jobs')[0].series, undefined)
```

```js
assert.equal(imported('jobs')[0].importedRecurrence.source.calendarRule, 'synthetic-glove-source-rule')
```

```js
assert.equal(pending.importedVisitId, 'synthetic-glove-unscheduled')
```

```js
assert.equal(pending.title, 'Synthetic pending inspection')
```

```js
assert.equal(pending.instructions, 'Call before arranging a date')
```

```js
assert.equal(pending.sourceComplete, false)
```

```js
assert.equal(pending.deviceTime, null)
```

```js
assert.equal(pending.jobId, imported('jobs')[0].id)
```

```js
assert.equal(sourceQuote.source.id, 'synthetic-glove-quote')
```

```js
assert.equal(sourceQuote.customerId, imported('customers')[0].id)
```

```js
assert.equal(sourceQuote.siteId, imported('sites')[0].id)
```

```js
assert.equal(sourceQuote.importedStatus, 'approved')
```

```js
assert.equal(sourceQuote.status, 'imported')
```

```js
assert.equal(sourceQuote.acceptance, null)
```

```js
assert.equal(sourceQuote.revisions[0].approval, null)
```

```js
assert.equal(sourceQuote.revisions[0].totals.total, '205.68')
```

```js
assert.equal(sourceQuote.revisions[0].lines[0].sourceId, 'synthetic-glove-quote-line')
```

```js
assert.equal(sourceQuote.revisions[0].lines[1].total, '-10.00')
```

```js
assert.equal(sourceQuote.importedTerms, 'Synthetic source terms')
```

```js
assert.deepEqual(sourceQuote.importedTextRows, [{ sourceId: 'synthetic-glove-quote-text-1', position: 1, name: 'Before the visit', description: 'Please clear access to the outdoor unit.' }])
```

```js
h.command(type, { quoteId: sourceQuote.id, version: sourceQuote.version, revision: 1 }, { error: 'IMPORTED_QUOTE' })
```

```js
h.command('document.photo', { kind: 'quote', id: sourceQuote.id, version: sourceQuote.version }, { error: 'IMPORTED_QUOTE' })
```

```js
h.command('quote.link', { quoteId: sourceQuote.id, version: sourceQuote.version }, { error: 'NOT_APPROVED' })
```

```js
assert.equal(note.text, 'Synthetic Jobber job note')
```

```js
assert.equal(note.importedNoteId, 'synthetic-glove-note')
```

```js
assert.equal(note.jobId, imported('jobs')[0].id)
```

```js
assert.equal(note.deviceTime, '2026-10-01T08:00:00Z')
```

```js
assert.equal(note.receivedAt, null)
```

```js
assert.equal(attachment.name, 'Synthetic source attachment.txt')
```

```js
assert.equal(attachment.importedAttachmentId, 'synthetic-glove-attachment')
```

```js
assert.equal(attachment.importedNoteId, note.importedNoteId)
```

```js
assert.equal(attachment.bytes.status, 'retained')
```

```js
assert.ok(!JSON.stringify(attachment).includes('https:'), 'no remote URL becomes a native fetch target')
```

```js
assert.ok(original, 'exact attachment bytes are in journal custody')
```

```js
assert.equal(kept.toString(), 'synthetic-glove-attachment\n')
```

```js
assert.equal((await stage(files.filter(f => !f.base64))).preview.missingAttachments.length, 4)
```

```js
assert.equal(row.importedNotes.length, 1, 'inherited notes stay only on their owning record')
```

```js
assert.equal(row.importedNotes[0].sourceType, type)
```

```js
assert.deepEqual(row.importedNotes[0].owner, { kind: ownerKind, sourceId })
```

```js
assert.equal(row.importedNotes[0].sourceTime, time)
```

```js
assert.equal(row.importedAttachments.length, ownerKind === 'requests' ? 0 : 1)
```

```js
assert.ok(!JSON.stringify(row.importedAttachments).includes('https:'), 'no source URL becomes a native fetch target')
```

```js
assert.equal(sourceCustomer.importedAttachments[0].bytes.status, 'retained')
```

```js
assert.equal(sourceQuote.importedAttachments[0].bytes.status, 'missing')
```

```js
assert.deepEqual(imported('captures').filter(c => c.kind === 'note').map(c => c.importedNoteId), ['synthetic-glove-note'])
```

```js
assert.ok(clientOriginal, 'private source attachment bytes are in journal custody')
```

```js
assert.deepEqual(clientChunks.length ? Buffer.from(clientChunks.map(c => c.bytes).join(''), 'base64') : Buffer.from(clientOriginal.bytes), await readFile('tests/fixtures/jobber-movein/client-attachment.txt'))
```

```js
assert.deepEqual(sourceExport.customers.find(c => c.id === sourceCustomer.id).importedNotes, sourceCustomer.importedNotes)
```

```js
assert.deepEqual(sourceExport.invoices.find(i => i.source?.system === 'Jobber').importedAttachments, imported('invoices')[0].importedAttachments)
```

```js
assert.ok((await stage(changedNotes(kind, change))).preview.rejections.some(r => r.kind === kind), 'invalid source ownership, time or attachment evidence is refused')
```

```js
assert.ok(absentReview.preview.rejections.some(r => r.kind === 'jobs' && /exported clients owner/.test(r.reason)), 'an inherited note cannot be reassigned to a job when its source owner is missing')
```

```js
assert.deepEqual(imported('visits').map(v => [v.startAt, v.status]).sort(), [['2026-10-23T14:00:00.000Z','booked'],['2026-11-23T14:00:00.000Z','completed']])
```

```js
assert.equal(visit.jobId, imported('jobs')[0].id)
```

```js
assert.equal(visit.technicianId, imported('technicians')[0].id)
```

```js
assert.equal(invoice.source.id, 'synthetic-glove-invoice')
```

```js
assert.equal(invoice.jobId, imported('jobs')[0].id)
```

```js
assert.deepEqual(invoice.importedJobIds, imported('jobs').map(j => j.id))
```

```js
assert.equal(invoice.openingBalance.amount, '76.50')
```

```js
assert.equal(invoice.openingBalance.notForPosting, true)
```

```js
assert.equal(invoice.revisions[0].totals.total, '216.50')
```

```js
assert.equal(invoice.revisions[0].approval, null)
```

```js
assert.deepEqual(invoice.revisions[0].lines.map(l => [l.sourceId, l.description, l.quantity, l.unitPrice, l.total, l.tax]), [['synthetic-glove-line-1', 'Synthetic inspection, Source inspection detail', '2', '100.00', '200.00', 'TAXABLE']])
```

```js
assert.equal(invoice.sourceLinesUnavailable, undefined)
```

```js
assert.ok((await stage(changedInvoice(change))).preview.rejections.some(r => r.kind === 'invoices'), 'inconsistent or incomplete source money is rejected')
```

```js
assert.deepEqual(discountedPreview.preview.rejections, [])
```

```js
assert.deepEqual(archivedPreview.preview.rejections, [])
```

```js
assert.equal(aging.customers.find(c => c.customerId === invoice.customerId).total, '76.50')
```

```js
h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'IMPORTED_INVOICE' })
```

```js
assert.equal(products.length, 2)
```

```js
assert.deepEqual(products.map(p => [p.name, p.kind, p.unitPrice, p.unitCost, p.tax]).sort(), [['Synthetic inspection','service','100.00','25.00','TAXABLE'],['Synthetic replacement filter','material','10.00','3.00','FREE']])
```

```js
assert.ok(again.preview.alreadyMovedIn > 0)
```

```js
assert.equal(twice[kind].length, state[kind].length)
```

```js
assert.equal((await stage(bad)).preview.rejections.filter(r => r.kind === 'visits').length, 3)
```

```js
assert.ok((await stage(invalid)).preview.rejections.some(r => r.kind === 'products-services'))
```

```js
assert.ok((await stage(incomplete)).preview.rejections.some(r => r.kind === 'visits'))
```

```js
assert.ok((await stage(missingBalance)).preview.rejections.some(r => r.kind === 'invoices'))
```

```js
assert.deepEqual(closedStage.preview.rejections, [])
```

```js
assert.equal(closedJob.status, 'archived')
```

```js
h.command('invoice.prepare', { jobId: closedJob.id }, { error: 'JOB_STATE' })
```

```js
h.command('visit.book', { jobId: closedJob.id, technicianId: b.priya.id, date: '2026-10-26', start: '08:00', end: '09:00' }, { error: 'JOB_STATE' })
```

```js
assert.ok((await stage(input)).preview.rejections.some(r => r.kind === 'quotes'))
```

```js
assert.ok((await stage(input)).preview.rejections.some(r => r.kind === 'jobs'))
```

```js
assert.ok((await stage(wrongAttachment)).preview.rejections.some(r => r.kind === 'jobs'))
```

```js
assert.equal(undone[kind].length, before[kind].length)
```

```js
assert.ok(undone.customers.some(c => c.id === native.id))
```

```js
assert.ok(!undone.customers.some(c => c.id === sourceCustomer.id), 'undo removes the owning private notes and attachment metadata with their imported customer')
```

```js
assert.ok(field.jobs.some(j => j.id === privacyJob.id), 'the technician really is assigned to the imported job')
```

```js
assert.ok(field.captures.some(c => c.importedNoteId === 'synthetic-glove-note'))
```

```js
assert.ok(!JSON.stringify(field).includes(row.importedNotes[0].text), 'private upstream notes never leak into assigned field work')
```

```js
assert.ok(!JSON.stringify(field).includes('Billing instructions.txt'))
```

```js
assert.equal(field.customers.find(c => c.id === sourceCustomer.id).importedNotes, undefined)
```

```js
assert.deepEqual(field.quotes, [])
```

```js
assert.deepEqual(field.invoices, [])
```

```js
assert.deepEqual(field.enquiries, [])
```

```js
assert.equal(committed.ok, true, JSON.stringify(committed))
```

```js
assert.equal((await movedIn()).length, 600)
```

```js
assert.equal(first.ok, false, 'this undo needs more than one pass')
```

```js
assert.equal(first.error.code, 'IMPORT_INCOMPLETE')
```

```js
assert.equal(midway.imports.find(i => i.id === staged.id).status, 'undoing', 'the screen shows the undo is part-way')
```

```js
assert.equal(enquiry.error?.code, 'IMPORT_UNDOING', 'no new work may refer to a record that is being undone')
```

```js
assert.equal(edit.error?.code, 'IMPORT_UNDOING', 'nor may it be edited')
```

```js
assert.equal(undone.ok, true, JSON.stringify(undone))
```

```js
assert.equal(s.customers.filter(c => c.id.startsWith('sm8-')).length, 0, 'every moved-in record is gone')
```

```js
assert.ok(s.customers.some(c => c.name === 'Walk-in customer'), 'unrelated desk work carried on')
```

```js
assert.equal(s.imports.find(i => i.id === staged.id).status, 'undone')
```

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.equal(state.invoices.length, 1)
```

```js
assert.equal(invoice.importedInvoiceNumber, expectedNumber)
```

```js
assert.equal(invoice.openingBalance.amount, '76.50')
```

```js
assert.equal(invoice.openingBalance.sourceTotal, expectedTotal)
```

```js
assert.notEqual(invoice.number, expectedNumber, 'Glove keeps its readable source prefix separately')
```

```js
assert.deepEqual(proposal.map(p => [p.id, p.group, p.rule, p.candidates]), [[invoice.id, 'matched', 'number-customer-total', ['501']]])
```

```js
assert.deepEqual(proposal[0].nameClashes, ['502'])
```

```js
h.command('qbo.confirmLinks', { confirm: true }, { error: 'QBO_REVIEW' })
```

```js
h.command('qbo.map', { kind: 'invoice', id: invoice.id, remoteId: '502' }, { error: 'QBO_MAPPING' })
```

```js
h.command('qbo.sync', { kind: 'invoice', id: invoice.id }, { error: 'NOT_APPROVED' })
```

```js
assert.equal(h.quickbooks.calls.filter(c => c.body).length, 0, 'discovery, confirmed linkage and replay never post opening history')
```

```js
assert.deepEqual([...h.quickbooks.records.values()].filter(r => r.DocNumber).map(r => [r.Id, r.DocNumber, r.TotalAmt, r.Balance]), [['501', expectedNumber, Number(expectedTotal), 76.50], ['502', expectedNumber, 76.50, 76.50]])
```

```js
assert.equal(linked.qboSync.remoteId, '501')
```

```js
assert.equal(linked.openingBalance.amount, '76.50')
```

```js
assert.equal(exported.invoices.find(r => r.id === invoice.id).importedInvoiceNumber, expectedNumber)
```

```js
b.office.run('import.stage', { format: system, files, balanceAsOf: snapshot }, { error: 'FORBIDDEN' })
```

```js
assert.equal(staged.system.toLowerCase(), system)
```

```js
assert.deepEqual(staged.preview.rejections, [], 'every documented fixture row maps')
```

```js
assert.equal(staged.status, 'previewed')
```

```js
assert.equal((await h.state()).jobs.length, before.jobs.length, 'dry run writes no work')
```

```js
assert.equal(staged.fileSummary.length, files.length)
```

```js
assert.equal(f.size, expected.length)
```

```js
assert.equal(f.sha256, createHash('sha256').update(expected).digest('hex'))
```

```js
assert.ok(staged.preview.unmappedFields.jobs.includes('unsupportedSourceField'))
```

```js
h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: 'unreviewed' }, { error: 'IMPORT_REVIEW' })
```

```js
assert.equal(imported('customers').length, 1)
```

```js
assert.deepEqual(['customers','services','jobs','quotes','invoices'].map(kind => imported(kind).find(r => kind === 'jobs' ? r.id === imported('invoices')[0].jobId : kind === 'services' ? r.kind === 'service' : true)?.source.id), expectedSourceIds, 'each primary source ID is kept exactly')
```

```js
assert.ok(imported('sites').length >= 1)
```

```js
assert.equal(imported('services').length, 2)
```

```js
assert.equal(product.name, 'Synthetic replacement filter')
```

```js
assert.equal(product.unitPrice, '10.00')
```

```js
assert.equal(product.unitCost, '3.00')
```

```js
assert.equal(product.tax, 'FREE')
```

```js
assert.equal(imported('jobs').length, system === 'fieldpulse' ? 3 : 2)
```

```js
assert.equal(imported('visits').length, system === 'servicetitan' ? 1 : 2)
```

```js
assert.equal(imported('quotes').length, 1)
```

```js
assert.equal(imported('invoices').length, 1)
```

```js
assert.equal(invoice.status, 'imported')
```

```js
assert.equal(invoice.openingBalance.amount, '76.50')
```

```js
assert.equal(invoice.openingBalance.asOf, snapshot)
```

```js
assert.equal(invoice.openingBalance.notForPosting, true)
```

```js
assert.equal(invoice.dates.termsDays, 14, 'the source issue/due interval is preserved rather than invented as zero')
```

```js
assert.equal(invoice.revisions[0].totals.total, '216.50')
```

```js
assert.equal(invoice.revisions[0].approval, null)
```

```js
assert.equal(imported('quotes')[0].revisions[0].approval, null)
```

```js
assert.ok(pricedService)
```

```js
assert.equal(pricedService.unitCost, system === 'workiz' ? '40.00' : system === 'servicetitan' ? '30.00' : '25.00')
```

```js
assert.equal(imported('technicians')[0].operatorId, null, 'no imported person receives a sign-in or source role')
```

```js
assert.equal(visit.jobId, job.id)
```

```js
assert.equal(visit.technicianId, imported('technicians')[0].id)
```

```js
assert.ok(imported('captures').some(c => c.kind === 'note'))
```

```js
assert.equal(attachment.bytes.status, 'retained')
```

```js
assert.ok(original, 'the exact attachment is in journal custody')
```

```js
assert.equal(kept.toString(), 'synthetic-glove-attachment\n', 'original bytes, not just a descriptor, survive commit')
```

```js
assert.deepEqual(imported('visits').map(v => v.local.date).sort(), ['2026-10-23','2026-11-23'], 'both existing source occurrences arrive exactly once')
```

```js
assert.ok(imported('jobs').every(j => j.importedRecurrence.parentId === '20'), 'the source recurring group is retained across its occurrences')
```

```js
assert.equal(equipment.siteId, job.siteId)
```

```js
assert.equal(equipment.serial, 'synthetic-glove-serial')
```

```js
assert.equal(equipment.manufacturerWarrantyUntil, '2028-01-01')
```

```js
assert.deepEqual([member.entitlements.included, member.entitlements.used, member.entitlements.left, member.entitlements.next], [3, 1, 2, '2026-07-15'])
```

```js
assert.equal(agreement.siteId, job.siteId)
```

```js
assert.equal(agreement.plan.price, '240.00')
```

```js
assert.equal(agreement.sourceTerms.billingFrequency, 'Annually')
```

```js
assert.equal(agreement.plan.repairDiscountPercent, null, 'an unavailable source member discount is not reported as zero')
```

```js
assert.deepEqual(agreement.importedEntitlements.map(e => e.due), ['2026-01-15','2026-07-15','2026-11-15'])
```

```js
assert.equal(recurrence.importedRecurrence.source.recurrenceInterval, 6)
```

```js
assert.equal(recurrence.importedRecurrence.active, false)
```

```js
assert.deepEqual(recurrence.importedRecurrence.proposal.rule, { unit: 'month', interval: 6, months: null, day: 15, nth: null, weekday: null })
```

```js
assert.equal(recurrence.importedRecurrence.proposal.coveredThrough, '2026-11-15')
```

```js
assert.equal(recurrence.series, undefined, 'the imported rule never generates bookings without a person')
```

```js
assert.ok(!JSON.stringify(recurrence).includes('estimatedPayrollCost'), 'raw payroll amounts never enter a technician-visible job')
```

```js
assert.equal(sourceEventsResponse.status, 200)
```

```js
assert.deepEqual(sourceEvents.visits.filter(v => v.agreementId === agreement.id).map(v => v.due), ['2026-07-15','2026-11-15'], 'the source-completed event never becomes outstanding again')
```

```js
assert.equal(aging.customers.find(c => c.customerId === invoice.customerId).total, '76.50')
```

```js
assert.equal((await readAging('2026-10-21')).customers.length, 0, 'a later balance snapshot does not rewrite history')
```

```js
assert.equal(revenue.total.revenue, '0.00', 'imported balances are not new sales')
```

```js
h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'IMPORTED_INVOICE' })
```

```js
h.command('invoice.revise', { invoiceId: invoice.id, version: invoice.version, lines: [], reason: 'Cannot repost history' }, { error: 'IMPORTED_INVOICE' })
```

```js
h.command('invoice.export', {}, { error: 'NOTHING_TO_EXPORT' })
```

```js
assert.equal(h.email.sent.length, beforeMail, 'an import sends no customer message')
```

```js
assert.ok(exported.invoices.some(i => i.id === invoice.id && i.openingBalance.amount === '76.50'))
```

```js
assert.ok(again.preview.alreadyMovedIn > 0)
```

```js
assert.equal(twice[kind].length, once[kind].length, `${kind} unchanged on retry`)
```

```js
assert.equal(undone[kind].length, before[kind].length, `${kind} reversed`)
```

```js
assert.ok(undone.customers.some(c => c.id === native.id), 'native work survives undo')
```

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.equal(schedules.length, 1, 'one generator proposal per source group, rather than one per occurrence')
```

```js
assert.equal(job.source.id, '20')
```

```js
assert.equal(job.importedRecurrence.source['Recurring Time - Frequency'], 'Every week on Tuesday')
```

```js
assert.deepEqual([proposal.from, proposal.until, proposal.coveredThrough], ['2026-10-20', '2026-12-29', '2026-11-24'])
```

```js
assert.equal(job.series, undefined)
```

```js
assert.equal(state.visits.filter(v => v.source?.system === 'FieldPulse').length, 2, 'only exported visits exist until activation')
```

```js
h.command('series.create', { ...input, date: '2026-11-24' }, { error: 'IMPORT_RECURRENCE' })
```

```js
h.command('series.create', { ...input, date: '2026-11-25' }, { error: 'IMPORT_RECURRENCE' })
```

```js
h.command('series.create', { ...input, date: '2026-12-01', until: null }, { error: 'IMPORT_RECURRENCE' })
```

```js
assert.deepEqual((await h.state()).visits.filter(v => v.jobId === job.id).map(v => v.local.date).sort(), ['2026-12-01','2026-12-08','2026-12-15','2026-12-22','2026-12-29'])
```

```js
h.command('import.undo', { batchId: committed.id, version: committed.version, reason: 'Preserve new native work' }, { error: 'IMPORT_DEPENDENTS' })
```

```js
assert.ok(unsupported.preview.unmappedFields['recurring-jobs'].some(f => f.includes('no exact native mapping')))
```

```js
assert.ok(invalid.preview.unmappedFields['recurring-jobs'].some(f => /date/i.test(f)))
```

```js
assert.ok(orphan.preview.rejections.some(r => r.kind === 'recurring-jobs' && /recurring_parent_id/.test(r.reason)))
```

```js
assert.deepEqual(extended.preview.rejections, [])
```

```js
assert.equal(moved.importedRecurrence.proposal.until, null)
```

```js
assert.equal(moved.importedRecurrence.proposal.coveredThrough, '2027-01-05', 'the late source exception is January 5 in the business timezone')
```

```js
assert.ok(orphan.preview.rejections.some(r => r.kind === 'jobs'), 'a missing customer refuses the job')
```

```js
assert.ok(orphan.preview.rejections.some(r => r.kind === 'invoices'), 'and its dependent invoice')
```

```js
assert.ok(invalid.preview.rejections.some(r => r.kind === (system === 'servicetitan' ? 'services' : 'items') && /amount/.test(r.reason)))
```

```js
assert.equal((await h.state()).imports.length, 2, 'invalid source rows remain reviewable, without product writes')
```

```js
assert.ok(typeReview.preview.rejections.some(r => r.kind === 'items' && /exact native mapping/.test(r.reason)), 'a documented Workiz warranty item is not silently changed into a stock product')
```

```js
assert.ok(cancelledVisit)
```

```js
assert.match(cancelledVisit.cancelled.reason, /Canceled in/)
```

```js
h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Keep the native correction' }, { error: 'NATIVE_EDIT_CONFLICT' })
```

```js
assert.equal((await h.state()).customers.find(c => c.id === customer.id).name, 'Synthetic corrected customer')
```

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.equal(state.agreements.filter(a => a.source?.id === '18').length, 1, 'a source membership is never split into several identities or charges')
```

```js
assert.equal(agreement.endDate, null)
```

```js
assert.equal(agreement.siteIds.length, 2)
```

```js
assert.equal(members.agreements.find(a => a.id === agreement.id).active, true, 'ongoing source term remains active')
```

```js
assert.ok(second)
```

```js
assert.equal(reserving.agreements.find(a => a.id === agreement.id).entitlements.nextSiteId, second.siteId, 'the next booking chooses an unreserved entitlement at its actual site')
```

```js
b.office.run('job.create', { customerId: agreement.customerId, siteId: agreement.siteId, agreementId: agreement.id, agreementVisitIndex: second.index, title: 'Wrong source location' }, { error: 'ENTITLEMENT' })
```

```js
assert.equal(job.totals.total, '0.00')
```

```js
assert.notEqual(job.lines[0].serviceId, agreement.plan.visitServiceId, 'different source recurring services do not inherit the first template SKU')
```

```js
assert.equal(job.lines[0].description, 'Second-site coil cleaning')
```

```js
assert.equal(job.lines[0].quantity, '2')
```

```js
assert.equal(state.services.find(s => s.id === job.lines[0].serviceId).source.id, '28')
```

```js
assert.equal(booked.booked, true)
```

```js
assert.equal(booked.siteId, second.siteId)
```

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.equal(state.visits.filter(v => v.jobId === job.id).length, 0)
```

```js
h.command('series.create', { ...input, date: '2026-07-15' }, { error: 'IMPORT_RECURRENCE' })
```

```js
h.command('series.create', { ...input, date: '2027-02-15' }, { error: 'IMPORT_RECURRENCE' })
```

```js
h.command('series.create', { ...input, date: '2027-01-15', until: null }, { error: 'IMPORT_RECURRENCE' })
```

```js
assert.deepEqual(active.series.revisions[0].rule, job.importedRecurrence.proposal.rule)
```

```js
assert.deepEqual(visits.map(v => v.local.date).sort(), ['2027-01-15','2027-07-15'])
```

```js
assert.ok(visits.every(v => v.technicianId === b.priya.id))
```

```js
h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Must preserve the newly activated native visits' }, { error: 'IMPORT_DEPENDENTS' })
```

```js
assert.equal((await h.state()).visits.filter(v => v.jobId === job.id).length, 2)
```

```js
assert.ok(preview.preview.unmappedFields['recurring-services'].some(f => f.includes('no exact native rule')))
```

```js
b.office.run('import.stage', { format: 'housecallpro', files }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.equal((await h.state()).jobs.length, before.jobs.length)
```

```js
assert.ok(staged.preview.unmappedFields.customers.includes('unsupportedSourceField'))
```

```js
assert.ok(staged.preview.unmappedFields.employees.includes('role'))
```

```js
assert.ok(staged.preview.unmappedFields.jobs.includes('recurrence_rule'))
```

```js
assert.equal(staged.fileSummary.find(x => x.name === f.name).sha256, createHash('sha256').update(Buffer.from(f.text ?? f.base64, f.text === undefined ? 'base64' : 'utf8')).digest('hex'))
```

```js
h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: 'unreviewed' }, { error: 'IMPORT_REVIEW' })
```

```js
assert.equal(rows('customers')[0].source.id, 'synthetic-glove-customer')
```

```js
assert.equal(rows('customers')[0].importedDoNotService, true)
```

```js
assert.equal(rows('sites')[0].customerId, rows('customers')[0].id)
```

```js
assert.equal(rows('technicians')[0].operatorId, null)
```

```js
assert.deepEqual(rows('services').map(s => [s.source.id,s.kind,s.unitPrice,s.unitCost,s.tax]).sort(), [['synthetic-glove-material','material','10.00','3.00','FREE'],['synthetic-glove-service','service','100.00','25.00','TAXABLE']])
```

```js
assert.deepEqual(rows('visits').map(v => [v.local.date,v.status]).sort(), [['2026-10-23','booked'],['2026-11-23','completed']])
```

```js
assert.ok(rows('jobs').some(j => j.id === visit.jobId))
```

```js
assert.equal(visit.technicianId, rows('technicians')[0].id)
```

```js
assert.ok(rows('jobs').every(j => j.importedRecurrence.active === false && !j.series))
```

```js
assert.equal(invoice.jobId, rows('jobs').find(j => j.source.id === 'synthetic-glove-job_1').id)
```

```js
assert.deepEqual([invoice.openingBalance.amount,invoice.openingBalance.asOf,invoice.openingBalance.notForPosting,invoice.revisions[0].totals.total,invoice.revisions[0].approval], ['76.50','2026-10-22',true,'206.50',null])
```

```js
assert.deepEqual(invoice.revisions[0].lines.map(l => [l.description, l.total]), [['Synthetic inspection','200.00'],['Synthetic source discount','-10.00']])
```

```js
assert.equal(lead.importSource.id, 'synthetic-glove-lead')
```

```js
assert.equal(lead.customerId, rows('customers')[0].id)
```

```js
assert.equal(lead.siteId, rows('sites')[0].id)
```

```js
assert.equal(lead.status, 'new')
```

```js
assert.equal(lead.importedLeadSource, 'Synthetic referral')
```

```js
assert.equal(lead.description, 'Housecall Pro lead 101: Needs inspection')
```

```js
assert.equal(lead.acknowledgment, undefined, 'historical leads queue no new reply')
```

```js
assert.equal(sourceReport.sources.find(s => s.source === 'housecallpro').requests, 2)
```

```js
assert.equal(sourceReport.pipeline.find(s => s.stage === 'new').requests.find(r => r.id === lead.id).ageDays, null)
```

```js
assert.equal(rows('enquiries').find(e => e.importSource.id === 'synthetic-glove-lost-lead').status, 'lost')
```

```js
assert.equal(conversation.status, 200)
```

```js
assert.equal((await conversation.json()).entries.filter(e => e.kind === 'request').length, 2)
```

```js
assert.equal(history.status, 200)
```

```js
assert.equal((await history.json()).entries.filter(e => e.kind === 'request').length, 2)
```

```js
assert.equal(rows('captures').find(c => c.kind === 'note').text, 'Synthetic source job note')
```

```js
assert.equal(attachment.bytes.status, 'retained')
```

```js
assert.equal(attachment.bytes.sha256, createHash('sha256').update('synthetic-glove-attachment\n').digest('hex'))
```

```js
assert.equal(aging.customers.find(c => c.customerId === invoice.customerId).total, '76.50')
```

```js
h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'IMPORTED_INVOICE' })
```

```js
assert.ok(exported.invoices.some(i => i.id === invoice.id && i.openingBalance.amount === '76.50'))
```

```js
assert.equal(h.email.sent.length, beforeMail, 'importing sends no customer message')
```

```js
assert.ok(again.preview.alreadyMovedIn > 0)
```

```js
assert.equal(twice[kind].length, state[kind].length)
```

```js
assert.equal(undone[kind].length, before[kind].length)
```

```js
assert.ok(undone.customers.some(c => c.id === native.id))
```

```js
assert.ok(orphan.preview.rejections.some(r => r.kind === 'jobs'))
```

```js
assert.ok((await stage(invalid)).preview.rejections.some(r => r.kind === 'services' && /cents/.test(r.reason)))
```

```js
assert.ok(rejected.preview.rejections.some(r => r.kind === 'job-invoices'), 'inconsistent invoice amounts are refused')
```

```js
assert.ok(orphanLead.preview.rejections.some(r => r.kind === 'leads'))
```

```js
assert.equal(missing.preview.missingAttachments.length, 1)
```

```js
h.command('import.undo', { batchId: applied.id, version: applied.version, reason: 'Keep native edit' }, { error: 'NATIVE_EDIT_CONFLICT' })
```

```js
assert.equal((await h.state()).customers.find(c => c.id === customer.id).name, 'Synthetic edited customer')
```

### tests/api/payments.test.mjs

Assertions before: 212; assertions after: 212.

```js
assert.equal(response.status, 200, JSON.stringify(body))
```

```js
b.office.run('payment.preferences', { version: preferences.version, tipChoices: ['0.00', '99.00'] }, { error: 'FORBIDDEN' })
```

```js
h.command('payment.preferences', { version: preferences.version, tipChoices }, { error: tipChoices.includes('-1.00') ? 'MONEY' : 'INPUT' })
```

```js
assert.deepEqual((await h.state()).business[0], preferences, 'invalid or unauthorized choices change nothing')
```

```js
assert.match(checkout.checkoutUrl, /^https:\/\/checkout\.stripe\.com\//)
```

```js
assert.equal((await h.command('payment.checkout', payload, { commandId })).checkoutUrl, undefined, 'bearer URL is never saved or replayed')
```

```js
assert.equal(h.stripePayments.sessions.length, 1)
```

```js
assert.deepEqual(h.stripePayments.calls.find(c => c.path === '/v1/checkout/sessions'), { method: 'POST', path: '/v1/checkout/sessions', idempotencyKey: `glove-checkout-${checkout.id}` })
```

```js
assert.equal(h.stripePayments.sessions[0].form['line_items[1][price_data][unit_amount]'], '1500')
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).paidToday.total, '0.00', 'Checkout never means paid')
```

```js
assert.equal((await paymentEvent(h, card, 'payment_intent.succeeded', { id: eventId })).status, 200)
```

```js
assert.equal((await paymentEvent(h, card, 'payment_intent.succeeded', { id: eventId })).status, 200)
```

```js
assert.equal((await paymentEvent(h, { metadata: card.metadata, payment_intent: card.id }, 'charge.failed')).status, 200, 'stale failure reads the current successful charge')
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).paidToday.total, checkout.amount)
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).paidToday.tips, '15.00')
```

```js
assert.deepEqual([payment.status, payment.fee, payment.tip, payment.technicianIds, payment.effects.length], ['paid', '6.81', '15.00', [b.priya.id], 1])
```

```js
assert.ok(!aging.customers.flatMap(c => c.invoices).some(i => i.id === inv.id))
```

```js
assert.equal(aging.customers.flatMap(c => c.invoices).find(i => i.id === bank.id).balance, bank.revisions[0].totals.total)
```

```js
assert.equal((await paymentEvent(h, ach, 'payment_intent.processing')).status, 200)
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).paidToday.total, checkout.amount, 'pending ACH is excluded')
```

```js
assert.equal((await paymentEvent(h, ach, 'payment_intent.succeeded')).status, 200)
```

```js
assert.equal((await paymentEvent(h, ach, 'payment_intent.processing')).status, 200, 'old event fetches current provider state')
```

```js
assert.match(tax.basis, /collected/)
```

```js
assert.equal(tax.jurisdictions.reduce((n, j) => n + Math.round(Number(j.tax) * 100), 0), Math.round(Number(inv.revisions[0].totals.gst) * 100) + Math.round(Number(bank.revisions[0].totals.gst) * 100))
```

```js
assert.deepEqual((await read(h, '/api/glove/reports/receivables.json?asOf=2099-01-01')).customers, [])
```

```js
assert.equal((await paymentEvent(h, ach, 'payment_intent.succeeded')).status, 200, 'canonical failed charge defeats a stale success')
```

```js
assert.equal(aging.customers[0].invoices[0].balance, bank.revisions[0].totals.total)
```

```js
assert.equal(aging.customers[0].invoices[0].href, `#invoices/${bank.id}`)
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).paidToday.total, checkout.amount)
```

```js
assert.equal((await read(h, `/api/glove/reports/payroll.json?${period}`)).people.find(p => p.technicianId === b.priya.id).tips, '15.00')
```

```js
assert.match(await (await h.request(`/api/glove/reports/payroll-${kind}.csv?${period}`)).text(), /15\.00/)
```

```js
assert.equal((await h.state()).messageStates[refusedReceipt.id].status, 'rejected')
```

```js
assert.equal(h.email.sent.length, sendsBefore + 1, 'receipt replay never repeats a rejected send')
```

```js
assert.equal((await h.state()).payments.find(p => p.id === payment.id).status, 'paid', 'receipt failure never undoes confirmed funds')
```

```js
assert.match(h.email.sent.at(-1).body.content[0].value, /Tip: \$15.00/)
```

```js
assert.equal((await read(h, '/api/glove/state')).messageStates[receipt.id].status, 'accepted')
```

```js
assert.equal((await postEvents(h, events.signed([{ email: receipt.to, timestamp: Math.floor(Date.now() / 1000), event: 'delivered', sg_event_id: randomUUID(), sg_message_id: 'synthetic-glove-mail-1', rer_delivery_id: receipt.id }]))).status, 200)
```

```js
assert.ok(property.entries.some(e => e.id === checkout.id && e.kind === 'payment' && e.status === 'paid'))
```

```js
assert.ok(property.entries.some(e => e.kind === 'payment' && e.status === 'returned'))
```

```js
assert.ok(timeline.events.some(e => e.kind === 'email.delivered'))
```

```js
assert.ok(timeline.events.some(e => e.kind === 'email.rejected'))
```

```js
assert.equal((await h.request(`/api/glove/payments/${payment.id}/timeline`, { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.ok(JSON.stringify(conversation).includes('paymentReceipt emailed'))
```

```js
assertTrail(h, ['payment.connected', 'payment.preferencesChanged', 'payment.requested', 'payment.checkoutAccepted', 'payment.paid', 'payment.pending', 'payment.returned', 'email.accepted', 'email.delivered', 'email.rejected'])
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-[124](?![A-Za-z0-9-])|synthetic-glove-session|checkout\.stripe\.com|stripe-signature/)
```

```js
assert.deepEqual((await b.priyaPerson.state()).payments, [])
```

```js
b.agent.run('payment.receipt', { paymentId: payment.id, version: payment.version }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).paidToday.total, checkout.amount, 'disconnect preserves recorded financial effects')
```

```js
assert.match((await read(h, '/api/glove/reports/tax.json?from=2000-01-01&to=2099-01-01')).basis, /collected/)
```

```js
assert.equal((await paymentEvent(h, card, 'payment_intent.succeeded')).status, 404)
```

```js
assert.equal(returned.status, 200)
```

```js
assert.match(html, /This page does not confirm a payment/)
```

```js
assert.doesNotMatch(html, /<script>|synthetic-glove-|Harbourview/)
```

```js
assert.match(returned.headers.get('cache-control'), /no-store/)
```

```js
assert.equal((await h.request('/payment-return', { as: '', method: 'POST' })).status, 405)
```

```js
b.office.run('payment.connect', {}, { error: 'FORBIDDEN' })
```

```js
h.command('payment.connect', { version: disconnected.business[0].version, mode: 'test', key: 'synthetic-glove-1\nsynthetic-glove-2', webhookSecret: 'synthetic-glove-2' }, { error: 'INPUT' })
```

```js
assert.equal(h.stripePayments.calls.length, networkBefore, 'malformed credentials never reach a provider or header diagnostic')
```

```js
h.command('payment.connect', { version: disconnected.business[0].version, mode: 'test', key: 'synthetic-glove-1', webhookSecret: 'synthetic-glove-2' }, { error: 'PAYMENT_MODE' })
```

```js
assert.deepEqual(await h.state(), disconnected, 'a live key cannot create even a test-labeled connection')
```

```js
assert.equal(h.stripePayments.sessions.length, 0)
```

```js
b.office.run('payment.checkout', { invoiceId: inv.id, version: inv.version, method: 'card' }, { error: 'FORBIDDEN' })
```

```js
h.command('payment.checkout', { invoiceId: inv.id, version: inv.version - 1, method: 'card' }, { error: 'STALE' })
```

```js
h.command('payment.checkout', { invoiceId: inv.id, version: inv.version, method: 'card', tip: '99.00' }, { error: 'INPUT' })
```

```js
h.command('payment.checkout', { invoiceId: inv.id, version: inv.version, method: 'card', cardNumber: 'synthetic-glove-5' }, { error: 'INPUT' })
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded', { signature: false })).status, 401)
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded', { at: 1 })).status, 401)
```

```js
assert.equal(h.stripePayments.calls.length, calls, 'unauthenticated callbacks make no provider call')
```

```js
assert.deepEqual(await h.state(), before, 'invalid callbacks write no product fact')
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded')).status, 401)
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded')).status, 401)
```

```js
h.command('payment.checkout', { invoiceId: inv.id, version: inv.version, method: 'card' }, { error: 'PAYMENT_PENDING' })
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.payment_failed')).status, 200)
```

```js
assert.equal((await h.state()).payments.find(p => p.id === checkout.id).status, 'failed')
```

```js
h.command('payment.checkout', { invoiceId: inv.id, version: inv.version, method: 'card' }, { error: 'PAYMENT_PENDING' })
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded')).status, 200)
```

```js
assert.equal((await h.state()).payments.find(p => p.id === checkout.id).status, 'failed', 'old connection cannot mutate new funds')
```

```js
assert.equal(uncertain.checkoutUrl, undefined)
```

```js
assert.equal(h.stripePayments.sessions.at(-1).form['metadata[glove_payment_id]'], uncertain.id, 'Stripe accepted the request before its response was lost')
```

```js
assert.equal(h.stripePayments.calls.length, attempted, 'a replay recovers reservation without repeating provider attempt')
```

```js
assertTrail(h, ['payment.checkoutUnconfirmed'])
```

```js
h.command('payment.checkout', { invoiceId: fresh.id, version: fresh.version, method: 'card' }, { error: 'PAYMENT_SETUP' })
```

```js
assert.deepEqual(await h.state(), withoutKey, 'missing private binding cannot strand a new reservation')
```

```js
assert.equal(h.stripePayments.calls.length, requestsBefore)
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded')).status, 200)
```

```js
assert.ok(merged.moved.some(m => m.kind === 'payments' && m.id === p.id))
```

```js
assert.equal((await h.state()).payments.find(x => x.id === p.id).customerId, survivor.id)
```

```js
assert.equal(s.payments.find(x => x.id === p.id).customerId, b.customer.id)
```

```js
assert.equal(anonymous.amount, p.amount)
```

```js
assert.ok(anonymous.erasedAt)
```

```js
assert.equal(anonymous.intentId, undefined)
```

```js
assert.equal(anonymous.providerReference, undefined)
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_payment_attempts WHERE payment_id=?').bind(p.id).first()).n, 0)
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded')).status, 200)
```

```js
h.command('payment.checkout', { invoiceId: inv.id, version: inv.version, method: 'card' }, { error: 'ERASED' })
```

```js
assert.deepEqual(await h.state(), erased, 'a later authenticated settlement and another request cannot revive erased personal payment material')
```

```js
assert.equal(h.stripePayments.calls.slice(providerCalls).filter(c => c.method === 'POST').length, 0)
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).paidToday.total, p.amount)
```

```js
assert.deepEqual((await read(h, '/api/glove/reports/receivables.json?asOf=2099-01-01')).customers, [])
```

```js
assert.doesNotMatch(JSON.stringify(exported), /synthetic-glove-intent|synthetic-glove-custody-charge|accounts@harbourview\.example/)
```

```js
assert.equal(invoice.due, due)
```

```js
assert.equal(balances.customers[0].due, due)
```

```js
assert.equal(aging.totals[0]?.total ?? '0.00', due)
```

```js
assert.equal(aging.customers[0].invoices[0].href, `#invoices/${inv.id}`)
```

```js
assert.equal(aging.customers[0].buckets.over90, due)
```

```js
assert.equal(dashboard.receivables[0]?.total ?? '0.00', due)
```

```js
assert.equal(pi.amount, 7500)
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded')).status, 200)
```

```js
b.office.run('payment.refund', refundPayload, { error: 'FORBIDDEN' })
```

```js
assert.equal(refund.status, 'paid')
```

```js
assert.equal(refund.paymentId, payment.id)
```

```js
assert.equal(refund.method, 'card')
```

```js
assert.equal(refund.amount, '50.00')
```

```js
assert.equal(h.stripePayments.refunds.get(refund.providerReference).payment_intent, pi.id)
```

```js
assert.equal(h.stripePayments.calls.length, calls, 'refund command replay never resends')
```

```js
assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded')).status, 200)
```

```js
assert.equal(brief.sections.overdue[0].id, inv.id)
```

```js
assert.match(brief.sections.overdue[0].text, /\$50.00/)
```

```js
assert.deepEqual(brief.sections.overdue[0].action, { label: 'Review overdue invoice', href: `#invoices/${inv.id}` })
```

```js
assert.equal(balances.invoices[0].credit, '50.00')
```

```js
assert.equal(balances.customers[0].balance, '-50.00')
```

```js
assert.equal(allocation.kind, 'allocation')
```

```js
assert.equal(balances.invoices.find(i => i.id === inv.id).credit, '0.00')
```

```js
assert.equal(balances.invoices.find(i => i.id === next.id).due, ((total - 5000) / 100).toFixed(2))
```

```js
assert.equal(aging.customers[0].total, ((total - 5000) / 100).toFixed(2))
```

```js
assert.equal(aging.customers[0].invoices[0].id, next.id)
```

```js
assert.equal(aging.customers[0].invoices[0].href, `#invoices/${next.id}`)
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).receivables[0].total, aging.customers[0].total)
```

```js
assert.equal((await h.state()).messageStates[receipt.id].status, 'accepted')
```

```js
assert.equal((await postEvents(h, edge ? edge.callback(mailReceipt(h, receipt)) : events.signed([{ email: receipt.to, timestamp: Math.floor(Date.now() / 1000), event: 'delivered', sg_event_id: randomUUID(), sg_message_id: 'synthetic-glove-mail-4', rer_delivery_id: receipt.id }]))).status, 200)
```

```js
assert.ok((await read(h, `/api/glove/payments/${row.id}/timeline`)).events.some(e => e.kind === 'email.delivered'))
```

```js
assert.equal(credited.kind, 'credit')
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices.find(i => i.id === next.id).due, ((total - 6000) / 100).toFixed(2))
```

```js
assertTrail(h, ['payment.credited', 'payment.recorded', 'payment.allocated', 'refund.requested', 'refund.paid', 'email.accepted', 'email.delivered'])
```

```js
assert.match(JSON.stringify(trail), /synthetic-glove-refund-1/)
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-[124](?![A-Za-z0-9-])|checkout\.stripe\.com|stripe-signature/)
```

```js
assert.equal((await h.request('/api/glove/balances', { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal(tipRefund.status, 'paid')
```

```js
assert.equal(tipRefund.amount, '0.00')
```

```js
assert.equal(tipRefund.tip, '15.00')
```

```js
assert.equal(h.stripePayments.refunds.get(tipRefund.providerReference).amount, 1500)
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).paidToday.tips, '0.00')
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices.find(i => i.id === inv.id).due, '0.00', 'tip-only refunds never change the invoice or its tax basis')
```

```js
h.command('payment.refund', { invoiceId: inv.id, version: inv.version, paymentId: freshOriginal.id, paymentVersion: freshOriginal.version, amount: '0.00', tip: '0.01', reason: 'Excess tip refund' }, { error: 'AMOUNT' })
```

```js
assert.equal(payroll.people.find(p => p.technicianId === b.priya.id).tips, '0.00', 'a refunded tip no longer belongs in technician payroll')
```

```js
assert.equal((await paymentEvent(h, { metadata: pi.metadata, payment_intent: pi.id }, 'charge.dispute.created')).status, 200)
```

```js
assert.equal((await read(h, '/api/glove/dashboard')).paidToday.tips, '0.00', 'a later return never reverses an already refunded tip twice')
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices.find(i => i.id === inv.id).due, '10.00', 'only the unrefunded card principal returns')
```

```js
h.command('payment.refund', { ...payload, amount: '9999.00' }, { error: 'AMOUNT' })
```

```js
assert.equal(uncertain.status, 'reserved')
```

```js
assert.equal(h.stripePayments.calls.length, calls)
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices[0].due, '0.00', 'unknown refund never reopens paid invoice')
```

```js
h.command('payment.refund', { ...payload, amount: original.amount }, { error: 'AMOUNT' })
```

```js
assert.equal(pending.status, 'pending')
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices[0].due, '0.00')
```

```js
assert.equal(pending.status, 'paid')
```

```js
assert.equal((await read(h, '/api/glove/balances')).invoices[0].due, '20.00')
```

```js
assert.equal(returned.method, 'cash')
```

```js
assert.equal(returned.status, 'paid')
```

```js
h.command('payment.record', { invoiceId: inv.id, version: inv.version - 1, method: 'cash', amount: '1.00', reference: 'synthetic-glove-10' }, { error: 'STALE' })
```

```js
b.agent.run('payment.record', { invoiceId: inv.id, version: inv.version, method: 'cash', amount: '1.00', reference: 'synthetic-glove-10' }, { error: 'FORBIDDEN' })
```

```js
assertTrail(h, ['refund.unconfirmed'])
```

```js
assert.equal(payout.reconciled, true)
```

```js
assert.equal(payout.difference, '0.00')
```

```js
assert.equal(payout.items.length, 7)
```

```js
assert.deepEqual(payout.unmatched, [])
```

```js
assert.equal(payout.items.find(i => i.type === 'refund').feeCents, -100, 'provider fee rebates retain their sign')
```

```js
h.command('payout.reconcile', { providerId: id }, { error: 'PAYOUT_PROVIDER' })
```

```js
assert.deepEqual((await h.state()).payouts, retainedPayouts, 'an unknown payout fee never becomes a zero-fee reconciliation')
```

```js
assert.ok(after > requests)
```

```js
assert.equal(h.stripePayments.calls.length, after)
```

```js
assert.equal(payout.reconciled, false)
```

```js
assert.equal(payout.difference, '0.00')
```

```js
assert.equal(payout.unmatched[0].reason, 'missing payment')
```

```js
assert.equal(payout.unmatched[0].providerReference, 'synthetic-glove-unmatched-charge')
```

```js
assert.equal(batch.amount, '50.00')
```

```js
assert.equal(batch.status, 'staff-recorded')
```

```js
b.office.run('payment.depositBatch', { paymentIds: [check.id], reference: 'synthetic-glove-bank-2' }, { error: 'DEPOSIT_BATCH' })
```

```js
h.command('payout.instantPreview', { amount: '1000.00', destination: 'synthetic-glove-debit-1' }, { error: 'PAYOUT_FEE' })
```

```js
assert.equal(preview.expectedFee, '15.00')
```

```js
assert.match(preview.feeSource, /not verified/)
```

```js
b.office.run('payout.instantConfirm', { payoutId: preview.id, version: preview.version, confirmAmount: '1000.00', confirmFee: '15.00' }, { error: 'FORBIDDEN' })
```

```js
h.command('payout.instantConfirm', { payoutId: preview.id, version: preview.version, confirmAmount: '1000.00', confirmFee: '0.00' }, { error: 'CONSENT' })
```

```js
assert.equal(instant.status, 'paid')
```

```js
assert.equal(h.stripePayments.calls.length, calls)
```

```js
assert.equal(reconciled.reconciled, true)
```

```js
assert.equal(reconciled.payoutFee, '15.00')
```

```js
assert.equal(reconciled.difference, '0.00')
```

```js
assert.match(reconciled.sourceMembership, /does not attribute/)
```

```js
assert.equal((await h.command('payout.reconcile', { providerId: instant.providerId })).reconciled, false, 'a fee mismatch never silently becomes reconciled')
```

```js
assertTrail(h, ['payout.reconciled', 'payout.depositBatchRecorded', 'payout.feeScheduleRecorded', 'payout.instantPreviewed', 'payout.instantRequested', 'payout.instantProviderOutcome'])
```

```js
h.command('payout.instantPreview', { amount: '1000.00', destination: 'synthetic-glove-debit-1', paymentIds: [source.payment.id] }, { error: 'PAYOUT_ALLOCATION' })
```

```js
assert.equal(unallocated.reconciled, false)
```

```js
assert.equal(unallocated.unmatched[0].reason, 'source allocation not reviewed')
```

```js
assert.equal(manual.reconciled, true)
```

```js
assert.equal(manual.difference, '0.00')
```

```js
assert.equal(manual.items.find(i => i.type === 'owner-allocated source').paymentId, manualSource.payment.id)
```

```js
assert.ok(officeState.payouts.every(p => p.kind === 'depositBatch'))
```

```js
assert.equal(officeState.business[0].payoutFeeSchedule, undefined)
```

```js
assert.ok(!officeState.events.some(e => e.kind.startsWith('payout.') && e.kind !== 'payout.depositBatchRecorded'))
```

```js
assert.ok(!officeActivity.events.some(e => e.kind.startsWith('payout.') && e.kind !== 'payout.depositBatchRecorded'))
```

```js
assert.ok(officeExport.payouts.every(p => p.kind === 'depositBatch'))
```

```js
assert.equal(officeExport.business[0].payoutFeeSchedule, undefined)
```

```js
assert.ok(!officeExport.timeline.some(e => e.kind.startsWith('payout.') && e.kind !== 'payout.depositBatchRecorded'))
```

```js
assert.ok(officeExport.payments.every(p => p.payoutAllocationId === undefined))
```

```js
assert.ok(scopedExport.payouts.every(p => p.kind === 'depositBatch'))
```

```js
assert.equal(scopedExport.business[0].payoutFeeSchedule, undefined)
```

```js
assert.ok(!scopedExport.timeline.some(e => e.kind.startsWith('payout.') && e.kind !== 'payout.depositBatchRecorded'))
```

```js
scopedOwner.run('payout.reconcile', { providerId: manualId }, { error: 'FORBIDDEN' })
```

```js
assert.doesNotMatch(JSON.stringify(exported), /synthetic-glove-payout-charge-|synthetic-glove-instant-funding-/)
```

```js
assert.ok((await h.state()).payouts.length > 0, 'aggregate financial deposit history survives customer erasure')
```

### tests/api/payout-reconciliation.test.mjs

Assertions before: 81; assertions after: 81.

```js
assert.equal(response.status, 200)
```

```js
assert.equal((await paymentEvent(h, pi, paid ? 'payment_intent.succeeded' : 'payment_intent.processing', { at: seconds })).status, 200)
```

```js
assert.deepEqual((await h.state()).payments, payments, 'inspection never posts or changes a source payment')
```

```js
assert.deepEqual(await h.command(row.type, row.payload, { commandId: row.commandId }), row.result)
```

```js
assert.deepEqual(await h.state(), before, 'replay preserves retained records and Activity')
```

```js
assert.equal(h.stripePayments.calls.length, calls, 'command replay makes no provider call')
```

```js
assert.deepEqual(await h.state(), before, 'actual Worker restart retains exact financial and audit state')
```

```js
h.command('payout.reconcile', payload, { error: code })
```

```js
assert.deepEqual(await h.state(), before, 'refused inspection changes no retained fact or balance')
```

```js
assert.deepEqual([matched.reconciled, matched.amount, matched.net, matched.difference, matched.payoutFee, matched.unmatched], [true, '584.20', '584.20', '0.00', '0.00', []])
```

```js
assert.deepEqual(matched.items.map(i => [i.paymentId, i.amountCents, i.feeCents, i.netCents]), [...sources.map(s => [s.payment.id, 10000, 100, 9900]), [refund.id, -1000, -20, -980]])
```

```js
assert.deepEqual([missing.reconciled, missing.net, missing.difference, missing.unmatched.map(i => [i.providerReference, i.reason])], [false, '596.17', '0.00', [['synthetic-glove-missing-payment', 'missing payment']]])
```

```js
assert.deepEqual([result.reconciled, result.amount, result.payoutFee, result.net, result.difference, result.unmatched], [true, '1000.00', '15.00', '1015.00', '0.00', []])
```

```js
assert.match(result.sourceMembership, /owner explicitly allocates/)
```

```js
assert.deepEqual([fresh.reconciled, fresh.items, fresh.unmatched, fresh.net], [missing.reconciled, missing.items, missing.unmatched, missing.net])
```

```js
assert.equal(h.stripePayments.calls.length - calls, f.records[1].calls)
```

```js
assert.equal(activity.length, 3)
```

```js
assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at], [owner.id, owner.name, 'owner', at])
```

```js
assert.ok(event.commandId && event.summary)
```

```js
assert.ok([automatic.providerId, manual.providerId].some(id => event.summary.includes(id)), 'Activity names the inspected Stripe reference')
```

```js
assert.ok(kept)
```

```js
assert.equal(JSON.parse(kept.data).provider, 'Stripe')
```

```js
assert.ok([automatic.providerId, manual.providerId].includes(JSON.parse(kept.data).providerReference))
```

```js
assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.command_id, kept.summary], [event.actorId, event.actorName, event.actorRole, event.at, event.commandId, event.summary])
```

```js
assert.deepEqual(exported.payouts.map(p => p.providerId).sort(), [automatic.providerId, manual.providerId].sort())
```

```js
assert.ok(!text.includes('synthetic-glove-1') && !text.includes('synthetic-glove-2'), 'provider keys are absent')
```

```js
assert.ok(!text.includes('checkout.stripe.com') && !text.includes('synthetic-glove-session-'), 'private Checkout material is absent')
```

```js
assert.deepEqual([result.reconciled, result.currency, result.mode], [true, 'USD', 'test'])
```

```js
person.run('payout.reconcile', payload, { error: 'FORBIDDEN' })
```

```js
person.run('payout.allocate', { ...payload, paymentIds: [source.payment.id] }, { error: 'FORBIDDEN' })
```

```js
assert.ok(!(await response.text()).includes(payload.providerId), `${person.name} cannot read retained provider facts`)
```

```js
assert.equal(response.status, 403)
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal(h.stripePayments.calls.length, calls)
```

```js
assert.equal(tokenRead.status, 200)
```

```js
assert.ok(!(await tokenRead.text()).includes(payload.providerId))
```

```js
assert.equal(response.status, expected)
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal(h.stripePayments.calls.length, calls)
```

```js
assert.equal((await h.request('/api/glove/commands', { method: 'POST', as: '', body: { type: 'payout.reconcile', commandId: randomUUID(), payload } })).status, 401)
```

```js
former.run('payout.reconcile', payload, { error: 'FORBIDDEN' })
```

```js
former.run('payout.reconcile', payload, { commandId: formerCommand, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await h.state(), afterWithdrawal)
```

```js
assert.equal(h.stripePayments.calls.length, calls, 'withdrawn authority cannot inspect or replay provider facts')
```

```js
former.run('payout.reconcile', payload, { commandId: formerCommand, error: 'FORBIDDEN' })
```

```js
assert.deepEqual([result.reconciled, result.items.length, result.amount, result.net, result.difference, result.unmatched], [true, 1000, '89.01', '89.01', '0.00', []])
```

```js
assert.equal(pages.length, 10)
```

```js
assert.deepEqual(pages.map(c => [c.limit, c.startingAfter]), Array.from({ length: 10 }, (_, n) => ['100', n === 0 ? null : tx[n * 100 - 1].id]))
```

```js
assert.equal(outcome.reconciled, false, name)
```

```js
assert.deepEqual(outcome.unmatched.map(i => [i.id, i.reason]), [[row.id, reason]], name)
```

```js
assert.match(error.message, /currency differs/)
```

```js
assert.deepEqual([fresh.items, fresh.unmatched, fresh.net, fresh.reconciled], [result.items, result.unmatched, result.net, true])
```

```js
assert.equal(h.stripePayments.calls.length - count, 11, 'a fresh inspection still reads exactly ten pages after Worker restart')
```

```js
assert.deepEqual([(await f.inspect(payload)).reconciled, (await f.inspect(payload)).difference], [true, '0.00'])
```

```js
assert.deepEqual([row.reconciled, row.difference], [false, difference])
```

```js
assert.deepEqual([row.providerStatus, row.reconciled, row.difference, row.unmatched], [status, false, '0.00', []])
```

```js
assert.deepEqual((await h.state()).payments, payments, 'inspection never changes a payment balance')
```

```js
assert.match(error.message, /payout fee; no zero fee is inferred/)
```

```js
assert.deepEqual([row.reconciled, row.items, row.unmatched.map(i => [i.paymentId, i.reason])], [false, [], [[null, 'source allocation not reviewed']]])
```

```js
assert.match(row.sourceMembership, /Stripe does not attribute source payments to manual payouts/)
```

```js
assert.equal(row.sourcePaymentIds, undefined)
```

```js
assert.deepEqual((await h.state()).payments, payments, 'inspection does not allocate available sources')
```

```js
h.command('payout.allocate', { ...payload, paymentIds: [] }, { error: 'PAYOUT_ALLOCATION' })
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal(h.stripePayments.calls.length, calls + 1, 'only the provider read occurs on invalid allocation')
```

```js
assert.deepEqual([row.reconciled, row.amount, row.payoutFee, row.net, row.sourceNet, row.difference, row.sourcePaymentIds, row.unmatched], [true, '98.75', '0.25', '99.00', '99.00', '0.00', [source.payment.id], []])
```

```js
assert.equal(row.items.find(i => i.type === 'owner-allocated source').paymentId, source.payment.id)
```

```js
assert.match(row.sourceBasis, /Owner-reviewed books allocation; not a Stripe source attribution/)
```

```js
assert.equal((await h.state()).payments.find(p => p.id === source.payment.id).payoutAllocationId, row.id)
```

```js
assert.deepEqual([other.reconciled, other.items, other.unmatched[0].reason], [false, [], 'source allocation not reviewed'])
```

```js
h.command('payout.allocate', { ...unreviewed, paymentIds: [source.payment.id] }, { error: 'PAYOUT_ALLOCATION' })
```

```js
assert.deepEqual(await h.state(), allocated, 'one source cannot be allocated twice')
```

```js
assert.deepEqual([bank.amount, bank.payoutFee, bank.net, bank.reconciled], ['98.75', '0.25', '99.00', true])
```

```js
assert.ok(bank.sourceDetailsErasedAt)
```

```js
h.command('payout.reconcile', payload, { error: 'ERASED' })
```

```js
h.command('payout.allocate', input, { error: 'ERASED' })
```

```js
h.command('payout.allocate', input, { commandId, error: 'ERASED' })
```

```js
assert.deepEqual(await h.state(), state, 'neither fresh inspection nor replay restores erased source details')
```

```js
assert.equal(h.stripePayments.calls.length, calls, 'erasure refuses before provider reads')
```

```js
assert.ok(!text.includes(source.pi.latest_charge.id), 'erased provider source is absent from every retained public projection')
```

```js
assert.deepEqual(await erased(), afterErasure)
```

### tests/api/pipeline.test.mjs

Assertions before: 205; assertions after: 205.

```js
assert.deepEqual([web.status, web.source], ['new', 'website'])
```

```js
b.office.run('enquiry.create', { customerId: b.customer.id, description: 'x', source: 'billboard' }, { error: 'INPUT' })
```

```js
assert.equal(contacted.status, 'contacted')
```

```js
b.office.run('enquiry.contact', { enquiryId: referral.id, version: referral.version }, { error: 'STALE' })
```

```js
assert.equal(s.enquiries.find(e => e.id === web.id).status, 'won')
```

```js
assert.deepEqual([lost.status, lost.lostReason], ['lost', 'Went with a cheaper quote'])
```

```js
b.office.run('enquiry.close', { enquiryId: google.id, version: won.version, reason: 'x' }, { error: 'ENQUIRY_STATE' })
```

```js
b.dispatcher.run('quote.draft', { enquiryId: angi.id, title: 'x', lines: [{ description: 'x', quantity: '1', unitPrice: '1.00' }] }, { error: 'ENQUIRY_STATE' })
```

```js
assert.equal(res.status, 200)
```

```js
assert.deepEqual(Object.keys(bySource).sort(), ['angi', 'google', 'referral', 'website'])
```

```js
assert.deepEqual(['requests', 'contacted', 'quoted', 'won', 'lost', 'conversion', 'wonValue', 'invoiced'].map(k => bySource.website[k]), [2, 0, 1, 1, 0, '50.0', '207.90', '0.00'])
```

```js
assert.deepEqual(['requests', 'quoted', 'won', 'conversion', 'wonValue', 'invoiced'].map(k => bySource.google[k]), [1, 1, 1, '100.0', '594.00', '594.00'])
```

```js
assert.deepEqual(['requests', 'won', 'lost', 'conversion'].map(k => bySource.angi[k]), [1, 0, 1, '0.0'])
```

```js
assert.deepEqual(['requests', 'contacted', 'won'].map(k => bySource.referral[k]), [1, 1, 0])
```

```js
assert.deepEqual(report.total, { requests: 5, won: 2, conversion: '40.0', wonValue: '801.90', invoiced: '594.00' })
```

```js
assert.deepEqual(Object.fromEntries(Object.entries(board).map(([k, v]) => [k, v.map(r => r.id)])), { new: [webIdle.id], contacted: [referral.id], quoted: [], won: [web.id, google.id], lost: [angi.id] })
```

```js
assert.equal(board.lost[0].lostReason, 'Went with a cheaper quote')
```

```js
assert.ok(Object.values(board).flat().every(r => r.ageDays === 0 && r.since), 'each request shows how long it has sat in its stage')
```

```js
assert.equal((await h.request('/api/glove/reports/sources', { as: b.priyaPerson.cookie })).status, 403, 'technicians never read revenue')
```

```js
assert.ok(s.events.some(e => e.kind === kind), `timeline has ${kind}`)
```

```js
b.dispatcher.run('lead.connect', { provider: 'thumbtack' }, { error: 'FORBIDDEN' })
```

```js
assert.match(thumbtack.password, /^[a-f0-9]{64}$/)
```

```js
assert.deepEqual(thumbtack.callback, { url: `${h.origin}/api/glove/leads/thumbtack`, user: 'glove' })
```

```js
assert.equal((await h.command('lead.connect', { provider: 'google', ...google })).password, undefined)
```

```js
h.command('rule.save', { name: 'Wrong trigger', trigger: 'job.created', action: { kind: 'leadCost', amount: '5.00' } }, { error: 'INPUT' })
```

```js
assert.equal(refused.status, 401)
```

```js
assert.deepEqual(await refused.json(), { ok: false, error: { code: 'LEAD', message: 'Not accepted: the credentials or the lead did not match.' } })
```

```js
assert.equal((await h.mf.dispatchFetch(`${h.origin}/api/glove/leads/thumbtack`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 401)
```

```js
assert.equal((await h.state()).version, version)
```

```js
assert.equal((await post('thumbtack', recorded.thumbtack(), thumbtack.password)).status, 200)
```

```js
assert.equal((await post('thumbtack', recorded.thumbtack(), thumbtack.password)).status, 200)
```

```js
assert.equal((await post('thumbtack', recorded.thumbtack('511234567890999999', 8 * 24 * 60), thumbtack.password)).status, 401)
```

```js
assert.equal((await post('angi', recorded.angi(), angi.password)).status, 200)
```

```js
assert.equal((await post('yelp', recorded.yelpNotice('synthetic-glove-yelp-lead-1'), yelp.password)).status, 200)
```

```js
assert.equal((await b.dispatcher.run('lead.pull', { provider: 'google' })).landed.length, 1)
```

```js
assert.equal((await b.dispatcher.run('lead.pull', { provider: 'google' })).landed.length, 0)
```

```js
assert.deepEqual(leads.map(e => [e.source, e.leadCost.amount, e.leadCost.by]).sort(), [['angi', '42.00', 'rule'], ['google', '28.00', 'rule'], ['thumbtack', '35.50', 'provider'], ['yelp', '15.00', 'rule']])
```

```js
assert.deepEqual(leads.filter(e => e.lead.matched === 'existing').map(e => [e.source, e.customerId]), [['angi', b.customer.id]])
```

```js
assert.deepEqual([dana.name, dana.phone, s.sites.find(x => x.customerId === dana.id).address], ['Dana Reyes', '+1 312-555-0142', '2300 N Lincoln Park W, Unit 4, Chicago, IL 60614'])
```

```js
assert.equal(s.customers.find(c => c.id === leads.find(e => e.source === 'google').customerId).email, 'pat.kim@example.test')
```

```js
assert.match(leads.find(e => e.source === 'yelp').description, /^Water Heater Installation\/Repair; What kind of water heater\? Tankless; The pilot keeps going out\.$/)
```

```js
assert.equal(e.acknowledgment.status, 'queued')
```

```js
assert.equal(e.acknowledgment.text, 'Thanks for contacting Harbour Air & Electrical! We received your request and will be in touch shortly.')
```

```js
assert.equal((Date.parse(e.acknowledgment.dueBy) - Date.parse(e.lead.receivedAt)) / 60_000, { thumbtack: 30, angi: 15, yelp: 60, google: 60 }[e.source])
```

```js
assert.deepEqual(s.ruleRuns.filter(r => r.ruleId === angiRule.id).map(r => [r.outcome, r.detail]), [['done', 'lead cost $42.00 applied']])
```

```js
assert.deepEqual(s.ruleRuns.filter(r => r.ruleId === thumbtackRule.id).map(r => [r.outcome, r.detail]), [['refused', 'the request already has a lead cost of $35.50 (from the provider)']])
```

```js
assert.deepEqual(h.leads.calls.filter(c => c.api === 'yelp').map(c => [c.authorization, c.id]), [['Bearer synthetic-glove-4', 'synthetic-glove-yelp-lead-1']])
```

```js
assert.deepEqual([search[0].customerId, search[0].authorization, search[0].developerToken], ['1234567890', 'Bearer synthetic-glove-access-1', 'synthetic-glove-5'])
```

```js
assert.match(search[0].query, /^SELECT local_services_lead\.id, .* FROM local_services_lead WHERE local_services_lead\.creation_date_time >= '/)
```

```js
assert.deepEqual([sent.acknowledgment.status, sent.acknowledgment.by.name, sent.acknowledgment.how], ['sent', 'Olu Office', 'Replied in Thumbtack'])
```

```js
b.office.run('enquiry.acknowledged', { enquiryId: ack.id, version: sent.version }, { error: 'ACKNOWLEDGMENT' })
```

```js
b.dispatcher.run('enquiry.cost', { enquiryId: ack.id, version: sent.version, amount: '30.00' }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual((await b.office.run('enquiry.cost', { enquiryId: ack.id, version: sent.version, amount: '30.00' })).leadCost.by, 'person')
```

```js
assert.equal((await h.state()).enquiries.filter(e => e.source === 'google').length, 2)
```

```js
assert.equal((await b.dispatcher.run('lead.pull', { provider: 'google' })).landed.length, 1)
```

```js
assert.deepEqual(pages.map(c => c.pageToken), [null, 'synthetic-glove-page-2'])
```

```js
assert.equal(pages[0].query, pages[1].query, 'Google requires the same query on every page')
```

```js
assert.equal((await b.dispatcher.run('lead.pull', { provider: 'google' })).landed.length, 0)
```

```js
assert.equal((await h.state()).enquiries.filter(e => e.source === 'google').length, 4)
```

```js
b.dispatcher.run('lead.pull', { provider: 'google' }, { error: 'LEADS' })
```

```js
assert.equal((await h.state()).version, pageVersion, 'a looping provider response never lands a partial read')
```

```js
b.dispatcher.run('lead.pull', { provider: 'google' }, { error: 'LEADS' })
```

```js
assert.equal((await h.state()).version, pageVersion, 'a failed later page never lands a partial read')
```

```js
b.dispatcher.run('lead.pull', { provider: 'google' }, { error: 'LEADS' })
```

```js
assert.equal((await h.state()).version, pageVersion, 'a malformed later lead never lands a partial read')
```

```js
assert.equal(h.email.sent.length, 0, 'intake never sends an acknowledgment automatically')
```

```js
b.office.run('enquiry.reply', replyPayload, { error: 'FORBIDDEN' })
```

```js
b.dispatcher.run('enquiry.reply', replyPayload, { error: 'FORBIDDEN' })
```

```js
b.priyaPerson.run('enquiry.reply', replyPayload, { error: 'FORBIDDEN' })
```

```js
h.command('enquiry.reply', { ...replyPayload, confirm: false }, { error: 'CONSENT' })
```

```js
h.command('enquiry.reply', replyPayload, { error: 'MAIL' })
```

```js
assert.equal(reply.acknowledgment.status, 'emailQueued')
```

```js
assert.deepEqual([h.email.sent.at(-1).body.To, h.email.sent.at(-1).body.TextBody], ['synthetic-glove-relay-1@example.test', yelpRequest.acknowledgment.text])
```

```js
assert.equal((await h.state()).messageStates[reply.acknowledgment.messageId].status, 'accepted')
```

```js
assert.deepEqual([acknowledgment.kind, acknowledgment.direction, acknowledgment.author], ['Yelp acknowledgment emailed', 'outbound', 'Olivia Owner'])
```

```js
assert.match(acknowledgment.delivery, /Accepted by Postmark; delivery not yet reported/)
```

```js
h.command('enquiry.reply', { ...replyPayload, version: reply.version }, { error: 'ACKNOWLEDGMENT' })
```

```js
assert.equal(h.email.sent.length, 1, 'replay and a second send cannot duplicate the acknowledgment')
```

```js
assert.equal((await post('yelp', recorded.yelpNotice('synthetic-glove-90'), yelp.password)).status, 200)
```

```js
h.command('enquiry.reply', { enquiryId: expiredReply.id, version: expiredReply.version, confirm: true }, { error: 'LEAD_REPLY' })
```

```js
assert.equal(h.email.sent.length, 1, 'an expired provider address is never sent a reply')
```

```js
assert.ok(!JSON.stringify(await h.state()).includes(secret))
```

```js
assert.ok(!(await (await h.request('/api/glove/export')).text()).includes(secret))
```

```js
assert.ok(!JSON.stringify((await h.db.prepare(`SELECT * FROM ${table}`).all()).results).includes(secret), `${table} never holds a lead credential`)
```

```js
b.office.run('lead.connect', { provider: 'reserve-google' }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(reserve.callback, { url: `${h.origin}/api/glove/leads/reserve-google`, user: 'glove' })
```

```js
assert.equal((await post('reserve-google', body, reserve.password)).status, 401)
```

```js
assert.equal((await post('reserve-google', booking, thumbtack.password)).status, 401)
```

```js
assert.equal((await h.state()).version, beforeReserve.version, 'refused records write nothing')
```

```js
assert.deepEqual(await Promise.all([1, 2].map(async () => (await post('reserve-google', booking, reserve.password)).status)), [200, 200])
```

```js
assert.equal(requests.length, 1, 'concurrent delivery retries land one request')
```

```js
assert.deepEqual([request.customerId, request.lead.provider, request.lead.providerLeadId, request.lead.matched, request.status], [b.customer.id, 'reserve-google', booking.booking_id, 'existing', 'new'])
```

```js
assert.deepEqual(request.lead.booking, { merchantId: booking.slot.merchant_id, serviceId: booking.slot.service_id, startAt: new Date(Number(booking.slot.start_sec) * 1000).toISOString(), durationSeconds: 3600, sourceStatus: 'CONFIRMED' })
```

```js
assert.equal(request.lead.providerTime, null, 'a slot start is not a notification creation time')
```

```js
assert.equal(request.leadCost, undefined, 'a booking price is not a lead cost')
```

```js
assert.equal(request.acknowledgment.status, 'queued')
```

```js
assert.equal(request.acknowledgment.channel, 'Reserve with Google')
```

```js
assert.equal(Date.parse(request.acknowledgment.dueBy) - Date.parse(request.lead.receivedAt), 20 * 60_000)
```

```js
assert.deepEqual([reserveState.jobs, reserveState.visits, reserveState.sites], [beforeReserve.jobs, beforeReserve.visits, beforeReserve.sites], 'intake books no work or service address')
```

```js
assert.deepEqual([h.leads.calls.length, h.email.sent.length], [callsBefore, mailBefore], 'no provider call or customer acknowledgment send')
```

```js
assert.equal((await (await h.request('/api/glove/reports/sources')).json()).sources.find(s => s.source === 'reserve-google').requests, 1)
```

```js
assert.ok(reserveState.events.some(e => e.kind === 'lead.received' && e.subjectId === request.id))
```

```js
assert.ok(exported.includes(booking.booking_id))
```

```js
assert.ok(!exported.includes(reserve.password))
```

```js
assert.equal((await h.db.prepare('SELECT hash FROM glove_lead_secrets WHERE provider=?').bind('reserve-google').first()).hash, (await import('node:crypto')).createHash('sha256').update(reserve.password).digest('hex'))
```

```js
assert.equal((await post('reserve-google', recorded.reserveGoogle('synthetic-glove-24'), reserve.password)).status, 401)
```

```js
assert.equal((await post('reserve-google', booking, reconnected.password)).status, 200)
```

```js
assert.equal((await h.state()).enquiries.filter(e => e.source === 'reserve-google').length, 1)
```

```js
assert.equal((await post('reserve-google', booking, reconnected.password)).status, 404)
```

```js
assert.equal((await post('angi', recorded.angi(), angi.password)).status, 404)
```

```js
assertTrail(h, ['lead.connected', 'lead.received', 'rule.ran', 'lead.read', 'enquiry.acknowledged', 'enquiry.cost', 'lead.disconnected', 'enquiry.replyApproved', 'email.queued', 'email.accepted'])
```

```js
assert.equal((await h.request(endpoint, { as: '' })).status, 404)
```

```js
office.run('intake.configure', { version: (await h.state()).business[0].version, enabled: true, siteKey: 'synthetic-glove-11', secret: 'synthetic-glove-12', allowedOrigins: [] }, { error: 'FORBIDDEN' })
```

```js
assert.equal(config.headers.get('access-control-allow-origin'), embed)
```

```js
assert.deepEqual(await config.json(), { businessName: 'synthetic-glove-13', siteKey: 'synthetic-glove-11', action: 'glove-request' })
```

```js
assert.equal(response.status, 200, await response.clone().text())
```

```js
assert.deepEqual(Object.keys(receipt).sort(), ['ok', 'receipt'])
```

```js
assert.equal(receipt.ok, true)
```

```js
assert.equal(state.customers.length, 1)
```

```js
assert.equal(enquiry.customerId, customer.id)
```

```js
assert.equal(enquiry.source, 'website')
```

```js
assert.equal(enquiry.intake.preferredTimes, input.preferredTimes)
```

```js
assert.equal(enquiry.photos.length, 2)
```

```js
assert.ok(!JSON.stringify(state).includes('synthetic-glove-12'))
```

```js
assert.ok(!(await (await h.request('/api/glove/export')).text()).includes('synthetic-glove-12'))
```

```js
assert.ok(notices.some(n => n.enquiryId === enquiry.id && n.to.includes('office')))
```

```js
assert.ok(state.events.some(e => e.kind === 'intake.received' && e.subjectId === enquiry.id))
```

```js
assert.deepEqual(Object.keys(h.turnstile.calls[0]).sort(), ['response', 'secret'])
```

```js
assert.deepEqual(await (await send(h, input)).json(), receipt)
```

```js
assert.deepEqual(await durable(h), beforeReplay)
```

```js
assert.ok(modelRequest.includes(input.description))
```

```js
assert.ok(!modelRequest.includes(png))
```

```js
assert.ok(!modelRequest.includes(input.email))
```

```js
assert.ok(!modelRequest.includes(input.address))
```

```js
assert.equal(original.status, 200)
```

```js
assert.equal(Buffer.from(await original.arrayBuffer()).toString('base64'), png)
```

```js
assert.equal((await h.request(`/api/glove/files/${fileId}`, { as: '' })).status, 401)
```

```js
assert.equal((await h.request(endpoint + '/files/' + fileId, { as: '' })).status, 401)
```

```js
assert.equal((await h.request(`/api/glove/files/${fileId}`, { as: office.cookie })).status, 404)
```

```js
assert.equal(exported.files.filter(f => enquiry.photos.some(p => p.file.fileId === f.id)).length, 2)
```

```js
assert.equal((await h.request(`/api/glove/files/${fileId}`)).status, 404)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_files WHERE capture_id=?').bind(enquiry.id).first()).n, 0)
```

```js
assert.ok(!JSON.stringify((await h.state()).enquiries).includes(input.description))
```

```js
assert.ok(retained && !retained.description.includes(input.email), 'the newly supplied typed contact is redacted without deleting a peer request')
```

```js
assert.equal((await h.state()).customers.find(c => c.id === peer.id).name, peer.name)
```

```js
assert.ok(!external.includes(input.description))
```

```js
assert.ok(!external.includes(png))
```

```js
assert.equal((await send(h, request())).status, 400)
```

```js
assert.deepEqual(await durable(h), baseline)
```

```js
assert.equal((await send(h, { ...request(), consent: false })).status, 400)
```

```js
assert.equal((await send(h, request(), 'https://synthetic-glove-18.example.test')).status, 403)
```

```js
assert.deepEqual(await durable(h), baseline)
```

```js
assert.equal((await send(h, { ...request(), photos })).status, 400)
```

```js
assert.deepEqual(await durable(h), baseline)
```

```js
assert.equal(refused.status, 409)
```

```js
assert.deepEqual(await durable(h), ambiguous)
```

```js
assert.ok(!(await refused.text()).includes('synthetic-glove-19'))
```

```js
assert.equal((await send(h, freshInput)).status, 200)
```

```js
assert.ok(created)
```

```js
assert.equal(created.phone, freshInput.phone)
```

```js
assert.equal((await sending).status, 409)
```

```js
assert.deepEqual(await durable(h), disabled)
```

```js
assert.equal((await h.request(endpoint, { as: '' })).status, 404)
```

```js
assert.equal((await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='turnstile'").first()).n, 0)
```

```js
assert.equal((await (await h.request(endpoint, { as: '', headers: { origin: embed } })).json()).photoDisclosure, undefined)
```

```js
h.command('intake.configure', { version: (await h.state()).business[0].version, enabled: true, siteKey: 'synthetic-glove-11', allowedOrigins: [embed], ...terms, confirmNoTraining: false }, { error: 'PHOTO_TERMS' })
```

```js
assert.deepEqual(await durable(h), before)
```

```js
person.run('intake.configure', { version: (await h.state()).business[0].version, enabled: true, siteKey: 'synthetic-glove-11', allowedOrigins: [embed], ...terms }, { error: 'FORBIDDEN' })
```

```js
assert.ok(disclosure.text.includes('Synthetic model provider') && disclosure.text.includes('models.example.test'))
```

```js
assert.ok(!JSON.stringify(disclosure).includes(terms.noTrainingTerms), 'the provider contract is not published as sender disclosure')
```

```js
assert.equal(response.status, 200, await response.clone().text())
```

```js
h.command('quote.suggest', { enquiryId: noConsent.enquiry.id }, { error: 'MODEL' })
```

```js
assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string')
```

```js
h.command('quote.suggest', { enquiryId: enquiry.id }, { error: 'MODEL' })
```

```js
assert.equal(content.length, 2)
```

```js
assert.deepEqual(Object.keys(content[1]).sort(), ['image_url', 'type'])
```

```js
assert.ok(sent.length < Buffer.from(photo.base64, 'base64').length)
```

```js
assert.ok(!sent.includes(Buffer.from(photoMetadata)), `${photo.mediaType} model copy strips EXIF, GPS, XMP and text`)
```

```js
assert.equal(call.store, false)
```

```js
assert.ok(!wire.includes(excluded), 'no contact, identity, caption, file reference or address is added with model photos')
```

```js
assert.equal(Buffer.from(await (await h.request(`/api/glove/files/${file}`)).arrayBuffer()).toString('base64'), photo.base64, 'office original is unchanged')
```

```js
assert.equal((await h.request(`/api/glove/files/${file}`, { as: '' })).status, 401)
```

```js
office.run('intake.withdrawPhotos', { enquiryId: enquiry.id, version: enquiry.version, senderRequested: true, reason: 'Sender called' }, { error: 'FORBIDDEN' })
```

```js
limited.run('intake.withdrawPhotos', { enquiryId: enquiry.id, version: enquiry.version, senderRequested: true, reason: 'Sender called' }, { error: 'FORBIDDEN' })
```

```js
h.command('intake.withdrawPhotos', { enquiryId: enquiry.id, version: enquiry.version, senderRequested: false, reason: 'No sender request' }, { error: 'PHOTO_CONSENT' })
```

```js
assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string', 'a later call contains no withdrawn photo')
```

```js
assert.equal(Buffer.from(await (await h.request(`/api/glove/files/${file}`)).arrayBuffer()).toString('base64'), photo.base64)
```

```js
h.command('quote.suggest', { enquiryId: malformed.enquiry.id }, { error: 'PHOTO_METADATA' })
```

```js
assert.equal(h.models.calls.length, callsBeforeMalformed, 'an unsafe copy never falls back to sending the original')
```

```js
h.command('quote.suggest', { enquiryId: redirected.enquiry.id }, { error: 'MODEL' })
```

```js
assert.equal(refusal.details.status, 307, 'photo requests do not follow redirects to a different recipient')
```

```js
h.command('quote.suggest', { enquiryId: switchOff.enquiry.id }, { error: 'MODEL' })
```

```js
assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string', 'turning off the switch excludes existing consented photos')
```

```js
assert.equal((await send(h, stale)).status, 409)
```

```js
assert.deepEqual(await durable(h), baseline)
```

```js
assert.equal((await send(h, providerInput)).status, 200)
```

```js
assert.equal((await (await h.request(endpoint, { as: '', headers: { origin: embed } })).json()).photoDisclosure, undefined)
```

```js
h.command('quote.suggest', { enquiryId: providerRequest.id }, { error: 'MODEL' })
```

```js
assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string', 'provider changes cannot inherit consent')
```

```js
assert.equal((await send(h, delegatedInput)).status, 200)
```

```js
h.command('quote.suggest', { enquiryId: delegated.id }, { error: 'PHOTO_CONSENT_CHANGED' })
```

```js
h.command('quote.suggest', { enquiryId: delegated.id }, { error: 'PHOTO_CONSENT_CHANGED' })
```

```js
assert.equal(h.models.calls.length, beforeAuthority, 'loss of the configuring owner authority fences dispatch')
```

```js
assert.ok(exported.timeline.some(e => e.kind === 'intake.photoUseAuthorized'))
```

```js
assert.equal(exported.timeline.filter(e => e.kind === 'intake.photosWithdrawn').length, 3)
```

### tests/api/privacy.test.mjs

Assertions before: 98; assertions after: 98.

```js
scopedOwner.run(type, { customerId: b.customer.id, version: b.customer.version, confirm: 'ERASE' }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await callback()).status, 200)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM rer_mail_event_states').first()).n, 1)
```

```js
person.run(type, { customerId: customer.id, version: customer.version, confirm: 'ERASE' }, { error: 'FORBIDDEN' })
```

```js
h.command('privacy.erase', { customerId: customer.id, version: customer.version }, { error: 'CONSENT' })
```

```js
assert.deepEqual(data.customerIds, [b.customer.id, duplicate.id].sort())
```

```js
assert.equal(data.records.invoices[0].id, inv.id)
```

```js
assert.ok(data.timeline.some(e => e.kind === 'customer.merged'))
```

```js
assert.ok(data.files.some(f => f.id === capture.file.fileId && f.bytes === jpeg))
```

```js
assert.ok(data.files.some(f => f.id === certificate.taxExemption.certificate.fileId && f.bytes === pdf))
```

```js
h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: stale.fingerprint }, { error: 'STALE_PREVIEW' })
```

```js
assert.deepEqual(result.customerIds, [b.customer.id, duplicate.id].sort())
```

```js
assert.equal(result.outcome, 'complete')
```

```js
assert.deepEqual(s.privacyRequests.map(r => r.action).sort(), ['erase', 'export'])
```

```js
assert.ok(s.customers.filter(c => result.customerIds.includes(c.id)).every(c => c.name === 'Erased customer' && !c.email && !c.taxExemption))
```

```js
assert.equal(s.customers.find(c => c.id === other.id).email, other.email)
```

```js
assert.deepEqual(kept.revisions[0].totals, inv.revisions[0].totals)
```

```js
assert.equal(kept.revisions[0].lines[0].description, 'Retained invoice line')
```

```js
assert.equal(s.serviceReports.length, 0)
```

```js
assert.equal(s.equipment.length, 0)
```

```js
assert.equal(s.messages.length, 0)
```

```js
assert.ok((await b.priyaPerson.state()).privacyFences.includes(visit.id))
```

```js
assert.ok(!(await b.tomPerson.state()).privacyFences.includes(visit.id))
```

```js
assert.equal((await h.request(`/api/glove/files/${unit.photos[0].fileId}`)).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/files/${earlierCertificate}`)).status, 404)
```

```js
assert.equal((await h.db.prepare(`SELECT count(*) AS n FROM ${table}`).first()).n, 0)
```

```js
assert.equal((await callback()).status, 200)
```

```js
assert.equal(JSON.stringify((await h.request('/api/glove/export').then(r => r.json())).timeline), beforeReplay)
```

```js
assert.equal(h.email.sent.length, 1)
```

```js
assert.equal(s.captures.length, 0)
```

```js
assert.equal(s.conversations.find(r => r.id === peerNote.id).text, 'Tenant needs a quote; [erased] recommended us.')
```

```js
assert.ok(s.conversations.some(r => r.text === 'Tenant keeps this note'))
```

```js
assert.ok(anonymized.length > 0)
```

```js
assert.ok(!anonymized.includes('privacy-' + createHash('sha256').update('synthetic-glove-22-event').digest('hex')))
```

```js
assert.ok(!anonymized.includes('synthetic-glove-22-event'))
```

```js
assert.equal((await h.request(`/api/glove/files/${capture.file.fileId}`)).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/files/${certificate.taxExemption.certificate.fileId}`)).status, 404)
```

```js
assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_tax_certificate_chunks').first()).n, 0)
```

```js
assert.match(csv, /Erased customer/)
```

```js
assert.ok(!csv.includes('Harbourview'))
```

```js
assert.ok(!all.includes(value), `export does not retain ${value} in ${Object.entries(JSON.parse(all)).filter(([,v]) => JSON.stringify(v).includes(value)).map(([k]) => k).join(',')}`)
```

```js
assert.ok(!commands.includes('Harbourview Dental'))
```

```js
h.command('customer.unmerge', { mergeId: merged.id, version: merged.version }, { error: 'NOT_FOUND' })
```

```js
h.command('customer.save', { ...customer, name: 'Resurrected' }, { error: 'ERASED' })
```

```js
assert.rejects(h.db.prepare("UPDATE glove_events SET summary='changed'").run(), /append_only_timeline/)
```

```js
assert.ok(after.records[0].epoch > before.records[0].epoch)
```

```js
assert.rejects(restore(destination, before.records, { sourceIdentity: after.records[0].sourceIdentity, epoch: after.records[0].epoch, journal: after.records[0].journal }), /erasure_epoch/)
```

```js
assert.equal((await target.db.prepare('SELECT count(*) AS n FROM glove_tax_certificates').first()).n, 0)
```

```js
assert.equal((await target.db.prepare('SELECT count(*) AS n FROM glove_tax_certificate_chunks').first()).n, 0)
```

```js
assert.ok(!restored.includes('Harbourview Dental'))
```

```js
assert.ok(!restored.includes('synthetic-glove-4'))
```

```js
assert.ok(customer && peer)
```

```js
assert.ok(exported.importOriginals.length)
```

```js
assert.ok(exported.importOriginals.every(f => f.projection))
```

```js
assert.ok(!JSON.stringify(exported).includes('Synthetic Peer'))
```

```js
assert.ok(!JSON.stringify(exported).includes('synthetic-glove-7@example.test'))
```

```js
assert.match(projected, /Synthetic Imported/)
```

```js
assert.ok(!projected.includes('Synthetic Peer'))
```

```js
assert.ok(!projected.includes('synthetic-glove-7@example.test'))
```

```js
assert.ok(preview.sharedOriginals.some(a => a.name === 'synthetic-glove-5.csv' && a.peers === 1))
```

```js
assert.ok(preview.retiredBatches.some(b => b.jobId === batch.jobId && /cannot tombstone/.test(b.reason)))
```

```js
assert.equal(preview.peersAffected, 1)
```

```js
assert.equal(preview.counts.customers, 1)
```

```js
assert.deepEqual((await h.state()).customers.find(c => c.id === peer.id), peer)
```

```js
assert.ok(!rows.includes('Synthetic Imported'), `${table} has no erased name`)
```

```js
assert.ok(!rows.includes('synthetic-glove-6@example.test'), `${table} has no erased email`)
```

```js
assert.ok(!bytes.includes('Synthetic Imported'))
```

```js
assert.equal(current.status, 'privacy-withdrawn')
```

```js
assert.ok(peerExport.omissions.some(o => o.artifact === 'synthetic-glove-5.csv' && /withdrawn/.test(o.reason)))
```

```js
assert.deepEqual(staged.preview.rejections, [])
```

```js
assert.equal(fp.source.id, st.source.id, 'both unrelated source accounts use customer ID 1')
```

```js
assert.ok(initialJobberExport.importOriginals.some(f => f.kind === 'attachment' && Buffer.from(f.bytes, 'base64').toString() === 'synthetic-glove-attachment\n'), 'customer export includes exact retained Jobber attachment bytes')
```

```js
assert.ok(exported.records.invoices.some(i => i.openingBalance.amount === '76.50'))
```

```js
assert.ok(exported.importCustody.length > 0)
```

```js
assert.ok(!JSON.stringify(exported).includes('Synthetic ServiceTitan Customer'))
```

```js
assert.equal(after.invoices.find(i => i.customerId === fp.id).openingBalance?.amount, '76.50', 'erasure preserves the anonymous imported balance')
```

```js
assert.deepEqual(after.customers.find(c => c.id === st.id), st)
```

```js
assert.deepEqual(after.customers.find(c => c.id === jobber.id), jobber)
```

```js
assert.deepEqual((await h.db.prepare('SELECT * FROM ik_sources WHERE job_id=? ORDER BY identity').bind(peerBatch.jobId).all()).results, peerSources, 'source IDs are scoped by namespace and kind')
```

```js
assert.ok(!JSON.stringify(await h.request('/api/glove/export').then(r => r.json())).includes('fp@example.test'))
```

```js
assert.ok(!(await h.state()).customers.some(c => c.id === st.id))
```

```js
assert.ok(jobberExport.importCustody.some(c => c.records.some(r => r.source.namespace === 'jobber')))
```

```js
assert.ok(jobberExport.records.invoices.some(i => i.openingBalance.amount === '76.50'))
```

```js
assert.ok(jobberExport.records.quotes.some(q => q.importedReadOnly && q.revisions[0].totals.total === '205.68'))
```

```js
assert.ok(jobberExport.records.captures.some(c => c.kind === 'source-visit' && c.importedVisitId === 'synthetic-glove-unscheduled'))
```

```js
assert.ok(jobberExport.records.captures.some(c => c.kind === 'note' && c.text === 'Synthetic Jobber job note'))
```

```js
assert.ok(jobberExport.importOriginals.some(f => f.kind === 'attachment') || jobberExport.omissions.some(o => o.sourceSha256 === createHash('sha256').update('synthetic-glove-attachment\n').digest('hex')), 'an attachment is exported or its missing original is explicitly reported')
```

```js
assert.ok(!JSON.stringify(await h.request('/api/glove/export').then(r => r.json())).includes('jobber@example.test'))
```

```js
assert.ok(!erasedExport.includes(value), 'erasure removes source quote, note, attachment and pending-visit content')
```

```js
assert.deepEqual(preview.retiredBatches, [])
```

```js
assert.equal(preview.sharedOriginals[0].peers, 1)
```

```js
assert.equal(current.status, batch.status)
```

```js
assert.deepEqual(after.customers.find(c => c.id === peer.id), peer)
```

```js
assert.ok(exported.importOriginals.some(a => a.projection && Buffer.from(a.bytes, 'base64').toString().includes(peer.name)))
```

```js
assert.ok(exported.omissions.some(o => /withdrawn/.test(o.reason)))
```

```js
assert.ok(!JSON.stringify(exported).includes('synthetic-glove-24@example.test'))
```

```js
assert.ok(!undone.customers.some(c => c.id === peer.id))
```

```js
assert.equal(undone.customers.find(c => c.id === subject.id).name, 'Erased customer')
```

### tests/api/quickbooks.test.mjs

Assertions before: 444; assertions after: 444.

```js
assert.equal(rev.totals.gst, '11.32')
```

```js
assert.equal(rev.totals.total, '164.83')
```

```js
assert.deepEqual([rev.totals.discount.nonTaxable, rev.totals.discount.taxable], ['30.30', '35.49'])
```

```js
assert.equal(rejected.phase, 'rejected')
```

```js
assert.match(rejected.message, /income account is inactive/)
```

```js
assert.match((await current(h, 'services', b.service.id)).qboSync.message, /income account is inactive/)
```

```js
assert.equal(fixed.phase, 'complete')
```

```js
assert.equal(posted.phase, 'complete')
```

```js
assert.equal(request.body.TxnTaxDetail.TotalTax.toFixed(2), rev.totals.gst)
```

```js
assert.equal(request.body.CustomerRef.value, '13')
```

```js
assert.equal(request.body.Line[0].SalesItemLineDetail.ItemRef.value, '20')
```

```js
assert.equal(request.body.TxnTaxDetail.TxnTaxCodeRef.value, '40')
```

```js
assert.equal(request.body.ApplyTaxAfterDiscount, true)
```

```js
assert.equal(request.body.Line.at(-1).DetailType, 'DiscountLineDetail')
```

```js
assert.equal(request.body.Line.at(-1).Amount.toFixed(2), rev.totals.discount.amount)
```

```js
assert.match(request.body.Line.at(-1).Description, /non-taxable \$30.30, taxable \$35.49/)
```

```js
assert.deepEqual(request.body.Line.slice(0, 2).map(l => l.SalesItemLineDetail.TaxCodeRef.value), ['TAX', 'NON'])
```

```js
assert.equal(sent.phase, 'complete')
```

```js
assert.equal(h.quickbooks.calls.find(r => r.entity === 'payment' && r.body).body.Line[0].LinkedTxn[0].TxnId, posted.remoteId)
```

```js
assert.equal((await h.state()).payments.length, 1, 'reading our own payment never counts it twice')
```

```js
assert.equal((await h.command('qbo.sync', { kind: 'payment', id: refund.id })).phase, 'complete')
```

```js
assert.equal(refundRequest.body.TotalAmt.toFixed(2), rev.totals.total)
```

```js
assert.equal(refundRequest.body.TxnTaxDetail.TotalTax.toFixed(2), rev.totals.gst)
```

```js
assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-02T12:00:00Z' } })).status, 200)
```

```js
assert.equal((await h.command('qbo.sync', { kind, id })).phase, 'complete')
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, before)
```

```js
assert.equal((await h.command('qbo.sync', { kind: 'customer', id: record.id })).phase, 'complete')
```

```js
assert.equal(h.quickbooks.records.get(['customer', '13'].join('/')).DisplayName, name)
```

```js
assertTrail(h, ['qbo.connected', 'qbo.mapped', 'qbo.configured', 'qbo.reserved', 'qbo.rejected', 'qbo.complete', 'qbo.replayed', 'qbo.paymentReplayed'])
```

```js
assert.ok(trail.activity.some(e => e.kind === 'qbo.complete' && e.summary.includes(posted.remoteId)))
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-901|Bearer/)
```

```js
b.office.run('qbo.sync', { kind: 'invoice', id: invoice.id }, { error: 'FORBIDDEN' })
```

```js
assert.equal(await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='quickbooks'").first('n'), 0)
```

```js
assertTrail(h, ['qbo.disconnected'])
```

```js
assert.deepEqual(h.quickbooks.calls.filter(r => r.entity === 'invoice' && r.body).map(r => r.body.CustomerRef.value), ['11', '12'])
```

```js
assert.equal(pulled.effects.length, 2)
```

```js
assert.ok(history.entries.some(e => e.kind === 'payment' && e.label.includes(`QuickBooks payment 90 for ${invoice.number}: $${invoice.revisions[0].totals.total}`)))
```

```js
h.command('payment.refund', { invoiceId: live.id, version: live.version, paymentId: pulled.id, paymentVersion: pulled.version, amount: '1.00', reason: 'Imported payment refund' }, { error: 'QBO_REFUND_STATE' })
```

```js
assert.deepEqual(balances.customers, [])
```

```js
assert.equal((await h.state()).payments.length, 1)
```

```js
assert.equal(tax.jurisdictions.reduce((n, j) => n + Math.round(Number(j.tax) * 100), 0), [a, z].reduce((n, inv) => n + Math.round(Number(inv.revisions[0].totals.gst) * 100), 0))
```

```js
assertTrail(h, ['qbo.paymentImported'])
```

```js
assert.equal(unknown.phase, 'unknown')
```

```js
h.command('qbo.sync', { kind: 'customer', id: b.customer.id }, { error: 'QBO_UNCERTAIN' })
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, writes)
```

```js
assertTrail(h, ['qbo.unknown'])
```

```js
h.command('qbo.reconcile', { kind: 'customer', id: b.customer.id, remoteId: '12' }, { error: 'QBO_RECONCILE' })
```

```js
assert.equal(reconciled.phase, 'complete')
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, writes)
```

```js
assertTrail(h, ['qbo.reconciled'])
```

```js
assert.notEqual(newConnection, previousConnection)
```

```js
h.command('qbo.sync', { kind: 'customer', id: b.customer.id }, { error: 'QBO_REVIEW' })
```

```js
assert.ok(review.proposals.every(p => p.group === 'unmatched'))
```

```js
h.command('qbo.confirmLinks', { confirm: true }, { error: 'QBO_REVIEW' })
```

```js
assert.deepEqual(missing.details.missing.filter(r => r.kind === 'sites').map(r => r.id).sort(), [b.site.id, second.id].sort())
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, beforeReview, 'review and confirmation never write to either company')
```

```js
assert.equal(confirmedSite.qbo.connectionId, newConnection)
```

```js
assert.ok(confirmedSite.qbo.confirmedBy)
```

```js
assert.equal((await h.state()).business[0].qbo.connectionId, newConnection)
```

```js
assert.deepEqual((await current(h, 'sites', b.site.id)).qbo, confirmedSite.qbo)
```

```js
h.command('qbo.sync', { kind: 'invoice', id: a.id }, { error: 'QBO_CORRECTION' })
```

```js
assert.equal((await h.command('qbo.sync', { kind: 'payment', id: payment.id })).phase, 'complete')
```

```js
assert.equal(newWrites.length, 1)
```

```js
assert.equal(newWrites[0].body.CustomerRef.value, '110')
```

```js
assert.equal(newWrites[0].body.Line[0].LinkedTxn[0].TxnId, '1501')
```

```js
assertTrail(h, ['qbo.connected', 'qbo.discovered', 'qbo.mapped', 'qbo.linksConfirmed', 'qbo.complete', 'qbo.replayed'])
```

```js
h.command('qbo.sync', { kind: 'customer', id: b.customer.id }, { error: 'QBO_REVIEW' })
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
```

```js
h.command('qbo.sync', { kind: 'invoice', id: invoice.id }, { error: 'QBO_EXISTING' })
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
```

```js
assert.equal(h.quickbooks.calls.find(r => r.entity === 'payment' && r.body).body.Line[0].LinkedTxn[0].TxnId, '99')
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.entity === 'invoice' && r.body).length, 0)
```

```js
h.command('qbo.reconcile', { kind: 'customer', id: b.customer.id, remoteId: '10' }, { error: 'QBO_RECONCILE' })
```

```js
assert.equal(outcome.phase, 'complete')
```

```js
assert.equal((await h.state()).customers.find(c => c.id === b.customer.id).qboSync.remoteId, '10')
```

```js
alternate.run('qbo.sync', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
assert.ok(activity.events.some(e => e.kind === 'qbo.complete' && e.summary.includes('10')))
```

```js
assert.equal(posted.phase, 'complete')
```

```js
assert.equal(payload.Line[2].Amount, -50)
```

```js
assert.equal(payload.Line[2].SalesItemLineDetail.ItemRef.value, '22')
```

```js
assert.equal(payload.Line[2].SalesItemLineDetail.TaxCodeRef.value, 'NON')
```

```js
assert.equal(payload.Line[3].DetailType, 'DiscountLineDetail')
```

```js
assert.equal(payload.Line[3].Amount, 23.9)
```

```js
assert.equal(payload.TxnTaxDetail.TotalTax, 15.59)
```

```js
assert.deepEqual([invoice.revisions.at(-1).totals.gst, invoice.revisions.at(-1).totals.total], ['15.59', '230.69'])
```

```js
assert.match(rejected.message, /Invalid customer Cedar Property Management/)
```

```js
assert.doesNotMatch(rejected.message, /synthetic-glove-901/)
```

```js
assert.equal(custody.records.customers[0].qboSync.message, rejected.message)
```

```js
assert.doesNotMatch(JSON.stringify(await read(h, '/api/glove/export')), /synthetic-glove-901/)
```

```js
assert.match(interrupted.message, /subject was erased/)
```

```js
assert.doesNotMatch(JSON.stringify(await read(h, '/api/glove/export')), /Cedar Property Management|accounts@cedar.example.test|120 Congress Avenue/)
```

```js
h.command('qbo.sync', { kind: 'customer', id: customer.id }, { error: 'ERASED' })
```

```js
assert.deepEqual(['matched', 'ambiguous', 'unmatched'].map(group => customers.filter(p => p.group === group).length), [47, 1, 2])
```

```js
assert.equal(customers.filter(p => p.rule === 'name-and-contact').length, 48)
```

```js
assert.equal(items.filter(p => p.group === 'matched').length, 20)
```

```js
assert.equal(items.filter(p => p.rule === 'sku').length, 10)
```

```js
assert.equal(items.filter(p => p.rule === 'name').length, 10)
```

```js
assert.equal(invoices.filter(p => p.group === 'matched').length, 47)
```

```js
assert.ok(review.untouched.customers.some(r => r.id === '101' && r.subCustomer))
```

```js
assert.equal(review.choices.customer.find(r => r.id === '48').phone, '5125550048')
```

```js
assert.equal(review.choices.invoice.find(r => r.id === '501').total, 108.25)
```

```js
assert.equal(review.choices.service.find(r => r.id === '200').name, b.services[0].name)
```

```js
assert.ok(review.choices.customer.find(r => r.id === '101').subCustomer)
```

```js
assert.doesNotMatch(JSON.stringify(review), /SyncToken|IncomeAccountRef|synthetic-glove-901/)
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
```

```js
h.command('qbo.confirmLinks', { confirm: true }, { error: 'QBO_REVIEW' })
```

```js
assert.deepEqual(ambiguous.candidates.sort(), ['48', '99'])
```

```js
assert.equal((await discover()).proposals.find(p => p.id === ambiguous.id).rule, 'verified-company-link')
```

```js
assert.equal((await current(h, 'invoices', invoice.id)).qboSync.remoteId, '501', 'original number and total link despite partial opening balance')
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
```

```js
assert.equal(clash.group, 'unmatched')
```

```js
assert.deepEqual(clash.nameClashes, ['102'])
```

```js
assert.ok((await discover()).untouched.customers.some(r => r.id === '10999'))
```

```js
assert.ok(h.quickbooks.calls.some(r => r.entity === 'query' && !r.body))
```

```js
h.command('qbo.discover', {}, { error: 'QBO_DISCOVERY' })
```

```js
office.run('qbo.discover', {}, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.quickbooks.calls.length, reads)
```

```js
assertTrail(h, ['qbo.discovered', 'qbo.mapped'])
```

```js
assert.ok(trail.activity.some(e => e.kind === 'qbo.discovered'))
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-901|Provider-only property/)
```

```js
assert.equal(business.qbo.review, undefined, 'remote names are not retained in business settings')
```

```js
assert.equal(collision.proposals.find(p => p.id === duplicate.id).group, 'ambiguous')
```

```js
assert.equal(collision.proposals.find(p => p.id === customer.id).group, 'ambiguous')
```

```js
assert.equal(collision.proposals.find(p => p.id === invoice.id).group, 'unmatched', 'ambiguous customer never supplies a proposed invoice parent')
```

```js
assert.equal((await current(h, 'customers', customer.id)).qbo.connectionId, (await h.state()).business[0].qbo.connectionId)
```

```js
assert.notEqual((await h.state()).business[0].qbo.connectionId, review.connectionId)
```

```js
assert.ok(freshCompany.proposals.every(p => p.group === 'unmatched'), 'another company cannot reuse prior company facts or confirmations')
```

```js
h.command('qbo.confirmLinks', { confirm: true }, { error: 'QBO_REVIEW' })
```

```js
h.command('qbo.createCustomer', { id: first.id, version: first.version }, { error: 'QBO_REVIEW' })
```

```js
h.command('qbo.createCustomer', { id: first.id, version: first.version, confirm: true }, { error: 'QBO_REVIEW' })
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
```

```js
assert.equal(created.phase, 'complete')
```

```js
assert.equal(customer.qbo.remoteId, created.remoteId)
```

```js
assert.equal(customer.qbo.confirmedBy, customer.qboCreate.approvedBy)
```

```js
assert.equal([...h.quickbooks.records.values()].filter(r => r.DisplayName === customer.name).length, 1)
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 2)
```

```js
assert.equal(proposal.group, 'matched')
```

```js
assert.ok(customer.qbo.confirmedAt)
```

```js
assert.equal(customer.qbo.confirmedBy, (await h.state()).business[0].qbo.linksConfirmedBy)
```

```js
assert.equal(sent.phase, 'complete')
```

```js
assert.equal(h.quickbooks.calls.find(r => r.entity === 'payment' && r.body).body.Line[0].LinkedTxn[0].TxnId, invoice.qbo.remoteId)
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.entity === 'payment' && r.body).length, 1)
```

```js
h.command('qbo.map', { kind: 'customer', id: customer.id, remoteId: '103' }, { error: 'QBO_LINK_USED' })
```

```js
assert.equal(retainedItem.group, 'matched')
```

```js
assert.equal(retainedItem.rule, 'verified-company-link')
```

```js
assert.equal(retainedItem.candidates[0], (await current(h, 'services', imported.services[0].id)).qbo.remoteId)
```

```js
h.command('qbo.map', { kind: 'invoice', id: invoice.id, remoteId: '999' }, { error: 'QBO_LINK_USED' })
```

```js
assert.equal(posted.phase, 'complete')
```

```js
assert.equal(writes.length, 1, 'no moved-in invoice is recreated')
```

```js
assert.equal(writes[0].body.CustomerRef.value, customer.qbo.remoteId)
```

```js
assert.equal(writes[0].body.TxnTaxDetail.TotalTax.toFixed(2), next.revisions.at(-1).totals.gst)
```

```js
assert.equal(writes[0].body.Line.at(-1).Amount.toFixed(2), next.revisions.at(-1).totals.discount.amount)
```

```js
assert.equal(writes[0].body.ApplyTaxAfterDiscount, true)
```

```js
assertTrail(h, ['qbo.discovered', 'qbo.creationApproved', 'qbo.complete', 'qbo.mapped', 'qbo.linksConfirmed', 'qbo.reserved', 'qbo.replayed'])
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-901/)
```

```js
assert.equal(refused.phase, 'rejected')
```

```js
assert.equal(unknown.phase, 'unknown')
```

```js
h.command('qbo.map', { kind: 'customer', id: extra.id, remoteId: remote.Id }, { error: 'QBO_UNCERTAIN' })
```

```js
assert.equal((await h.command('qbo.reconcile', { kind: 'customer', id: extra.id, remoteId: remote.Id })).phase, 'complete')
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, creationWrites)
```

```js
assert.equal((await current(h, 'customers', extra.id)).qbo.remoteId, remote.Id)
```

```js
office.run('qbo.createCustomer', { id: first.id, version: first.version, confirm: true }, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, writesBefore)
```

```js
assert.equal(result.ok, true, JSON.stringify(result))
```

```js
assert.deepEqual(review.contacts.map(r => r.id), Array.from({ length: 201 }, (_, i) => `synthetic-glove-contact-${i}`))
```

```js
assert.deepEqual(review.invoices.map(r => r.id), Array.from({ length: 100 }, (_, i) => `synthetic-glove-invoice-${i}`))
```

```js
assert.equal(review.items.length, 201)
```

```js
assert.deepEqual(readCalls.filter(r => r.path.endsWith('/Contacts')).map(r => new URLSearchParams(r.query).get('page')), ['1', '2', '3'])
```

```js
assert.deepEqual(readCalls.filter(r => r.path.endsWith('/Invoices')).map(r => new URLSearchParams(r.query).get('page')), ['1', '2'])
```

```js
assert.equal(readCalls.filter(r => r.path.endsWith('/Items')).length, 1)
```

```js
assert.ok(readCalls.every(r => r.method === 'GET' && r.tenant === tenant))
```

```js
assert.equal((await inspect(h, b.customer.id)).contacts.length, 201)
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
```

```js
h.command('xero.connect', { version: 0, tenant, token }, { error: 'STALE' })
```

```js
assert.equal(inspected.contacts.length, 2)
```

```js
assert.equal(inspected.items.length, 2)
```

```js
assert.equal(inspected.invoices.length, 2)
```

```js
assert.equal(inspected.invoices[0].amountDue, 80)
```

```js
assert.ok(!JSON.stringify(inspected).includes('excluded'))
```

```js
assert.ok(!JSON.stringify(savedInspections.results).includes(b.customer.name))
```

```js
b.agent.run('xero.connect', { tenant, token }, { error: 'FORBIDDEN' })
```

```js
b.office.run('xero.map', { kind: 'customer', id: b.customer.id, version: b.customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'FORBIDDEN' })
```

```js
b.agent.run('xero.confirmLinks', { confirm: true }, { error: 'FORBIDDEN' })
```

```js
b.office.run('xero.inspect', { customerId: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
limitedOwner.run('xero.map', { kind: 'customer', id: b.customer.id, version: b.customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'FORBIDDEN' })
```

```js
assert.equal(refusedToken.status, 403)
```

```js
assert.fail('unmapped company cannot be confirmed')
```

```js
assert.match(e.message, /XERO_REVIEW/)
```

```js
assert.fail('explicit review is required')
```

```js
assert.match(e.message, /XERO_REVIEW/)
```

```js
assert.equal(confirmed.confirmed, true)
```

```js
assert.deepEqual([a, z].map(r => state.invoices.find(i => i.id === r.id).xero.propertyId), [b.site.id, second.id])
```

```js
assert.ok([a, z].every(r => state.invoices.find(i => i.id === r.id).xero.contactId === 'synthetic-glove-contact-1'))
```

```js
assert.ok(state.invoices.filter(i => [a.id, z.id].includes(i.id)).every(i => i.xero.confirmedBy && i.xero.confirmedAt === '2026-11-01T12:00:00.000Z'))
```

```js
assert.fail('changed provider tax mapping must be refused')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.equal((await h.state()).business[0].xeroInspection.connectionId, connection)
```

```js
assert.ok((await h.state()).invoices.filter(i => [a.id, z.id].includes(i.id)).every(i => i.xero === null))
```

```js
assert.fail('dependent links must be reviewed again')
```

```js
assert.match(e.message, /XERO_REVIEW/)
```

```js
assertTrail(h, ['xero.connected', 'xero.mapped', 'xero.linksConfirmed'])
```

```js
assert.ok(trail.activity.some(e => e.kind === 'xero.mapped' && e.summary))
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-51|Bearer|excluded bank detail/)
```

```js
assert.ok(!JSON.stringify(await h.state()).includes(token))
```

```js
assert.ok(!JSON.stringify(trail).includes(tenant))
```

```js
assert.equal(JSON.parse(mappedEvent.data).remoteId, 'synthetic-glove-invoice-0')
```

```js
assert.ok(h.xero.calls.length > 0 && h.xero.calls.every(c => c.method === 'GET'))
```

```js
assert.equal((await h.state()).payments.length, 0)
```

```js
assert.ok(exportBody.result.download.includes('synthetic-glove-invoice-0'))
```

```js
assert.equal(erased.customers.find(r => r.id === customer.id).xero, undefined)
```

```js
assert.ok(erased.invoices.filter(i => [a.id, z.id].includes(i.id)).every(i => i.xero === undefined))
```

```js
h.command('xero.map', { kind: 'customer', id: customer.id, version: customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'ERASED' })
```

```js
assert.notEqual((await h.state()).business[0].xeroInspection.connectionId, connection)
```

```js
h.command('xero.inspect', { customerId: duplicate.id }, { error: 'XERO_PROVIDER' })
```

```js
h.command('xero.inspect', { customerId: duplicate.id }, { error: 'XERO_SETUP' })
```

```js
assert.equal((await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='xero'").first()).n, 0)
```

```js
assert.fail('new tenant requires fresh links')
```

```js
assert.match(e.message, /XERO_REVIEW/)
```

```js
h.command('xero.confirmLinks', { version: (await h.state()).business[0].version, confirm: true }, { error: 'XERO_SETUP' })
```

```js
assert.equal(h.xero.calls.length, calls)
```

```js
h.command('role.save', { name: 'Accounting delegate', permissions: ['xero.sync'] }, { error: 'INPUT' })
```

```js
b.office.run('xero.sync', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
b.agent.run('xero.reconcile', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
limited.run('xero.sync', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 0)
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 0)
```

```js
assert.equal(customer.phase, 'complete')
```

```js
assert.equal((await h.command('xero.sync', customerPayload, { commandId: customerCommandId })).remoteId, customer.remoteId)
```

```js
assert.equal(h.xero.data.Contacts[0].Name, b.customer.name)
```

```js
assert.equal(rejected.phase, 'rejected')
```

```js
assert.match(rejected.message, /Income account is inactive/)
```

```js
assert.ok(!rejected.message.includes(token))
```

```js
assert.equal((await xeroSync(h, 'service', b.service.id)).phase, 'complete')
```

```js
assert.equal(h.xero.data.Items[0].Description, 'Repaired sales item')
```

```js
assert.deepEqual([invoice.revisions.at(-1).totals.total, invoice.revisions.at(-1).totals.gst], ['166.17', '12.66'])
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, beforeDraft)
```

```js
assert.equal(posted.phase, 'complete')
```

```js
assert.equal(transport.Contact.ContactID, 'synthetic-glove-contact-1')
```

```js
assert.equal(transport.Reference, `Property ${b.site.address}`)
```

```js
assert.equal(transport.LineItems[0].Description, invoice.revisions.at(-1).lines[0].description + ' reviewed')
```

```js
assert.deepEqual(transport.LineItems.map(l => [l.LineAmount, l.DiscountAmount ?? 0, l.TaxAmount]), [[153.51, 35.49, 12.66], [0, 30.3, 0]])
```

```js
assert.deepEqual([transport.Date, transport.DueDate], ['2026-11-01', '2026-11-15'])
```

```js
assert.equal(h.xero.data.Invoices[0].Total, 166.17)
```

```js
assert.equal((await xeroSync(h, kind, id)).phase, 'complete')
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, writes)
```

```js
assert.ok(h.xero.calls.filter(r => r.body).every(r => r.idempotencyKey))
```

```js
assert.equal(unknown.phase, 'unknown')
```

```js
assert.equal(recovered.phase, 'complete')
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, before)
```

```js
h.command('xero.map', { kind: 'customer', id: b.customer.id, version: (await current(h, 'customers', b.customer.id)).version, remoteId: 'synthetic-glove-contact-1' }, { error: 'XERO_LOCKED' })
```

```js
assertTrail(h, ['xero.reserved', 'xero.complete', 'xero.rejected', 'xero.unknown', 'xero.reconciled', 'xero.replayed'])
```

```js
assert.ok(trail.activity.some(e => e.kind === 'xero.complete' && e.summary.includes(posted.remoteId)))
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-51|Bearer|00000000-0000-4000-8000-000000000001/)
```

```js
assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_xero_operations WHERE record_id IN (?,?)').bind(c.id, invoice.id).first('n'), 0)
```

```js
h.command('xero.sync', customerPayload, { commandId: customerCommandId, error: 'ERASED' })
```

```js
assert.equal(h.xero.calls.length, beforeReplay)
```

```js
assert.doesNotMatch(saved, /synthetic-glove-contact-1|operationId|connectionId/)
```

```js
assert.ok(posted.every(p => p.phase === 'complete'))
```

```js
b.office.run('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'FORBIDDEN' })
```

```js
h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' })
```

```js
h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' })
```

```js
h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_MAPPING' })
```

```js
h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' })
```

```js
assert.equal((await h.state()).payments.length, 0)
```

```js
assert.equal(payment.amount, '409.18')
```

```js
assert.equal(payment.xeroImported.bankReconciled, false)
```

```js
assert.equal(payment.fee, null)
```

```js
assert.deepEqual(payment.effects.map(e => [e.invoiceId, e.amountCents, e.taxTotalAmount]), [[a.id, 20459, '204.59'], [z.id, 20459, '204.59']])
```

```js
assert.equal((await h.state()).payments.length, 1)
```

```js
h.command('xero.pull', { paymentIds: [paymentIds[0]], reference: 'Parent remittance', amountCents: 20459 }, { error: 'XERO_PAYMENT_CHANGED' })
```

```js
h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' })
```

```js
assert.equal(tax.jurisdictions.reduce((n, j) => n + Math.round(Number(j.tax) * 100), 0), 3118)
```

```js
assert.equal(receiptDay.jurisdictions.reduce((n, j) => n + Math.round(Number(j.tax) * 100), 0), 3118)
```

```js
assert.deepEqual(importDay.jurisdictions, [])
```

```js
assert.deepEqual(receivables.customers, [])
```

```js
assert.equal(payment.createdAt, '2026-12-01T12:00:00.000Z')
```

```js
assert.ok(entries.some(e => e.kind === 'payment' && e.label === `Xero payment Parent remittance for ${invoice.number}: $204.59`))
```

```js
h.command('payment.refund', { invoiceId: a.id, version: (await current(h, 'invoices', a.id)).version, paymentId: payment.id, paymentVersion: payment.version, amount: '1.00', reason: 'Xero refund' }, { error: 'XERO_REFUND_STATE' })
```

```js
h.command('payment.receipt', { paymentId: payment.id, version: payment.version }, { error: 'XERO_RECEIPT_STATE' })
```

```js
assert.equal(staff.status, 200)
```

```js
assert.doesNotMatch(await staff.text(), /synthetic-glove-payment-|synthetic-glove-invoices-|bankReconciled|xeroSync|"xero":/)
```

```js
assertTrail(h, ['xero.paymentImported', 'xero.paymentReplayed'])
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-51|Bearer/)
```

```js
assert.fail('unresolved tenant must stay pinned')
```

```js
assert.match(e.message, /XERO_TENANT/)
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 1)
```

```js
assert.equal((await pending).phase, 'complete')
```

```js
assert.equal((await h.state()).business[0].xeroInspection.connectionId, connectionId)
```

```js
assert.equal((await xeroSync(h, 'customer', b.customer.id)).phase, 'complete')
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 1)
```

```js
assert.deepEqual([denied.riskClass, denied.decision, denied.allowed], ['provider-write', 'block', false])
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 1, 'policy withdrawal before send makes no new provider write')
```

```js
assertTrail(h, ['company.actionPolicy'])
```

```js
assert.ok(trail.exported.timeline.some(e => e.kind === 'company.actionPolicy' && JSON.parse(e.data).decision === 'block'))
```

```js
assert.equal(outcome.phase, 'complete')
```

```js
other.run('xero.sync', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.xero.calls.filter(r => r.body).length, 1)
```

```js
assert.equal(state.customers.find(c => c.id === b.customer.id).xeroSync.remoteId, 'synthetic-glove-contact-1')
```

```js
assert.equal(outcome.phase, 'unknown')
```

```js
assert.equal(outcome.remoteId, undefined)
```

```js
assert.equal(state.customers.find(c => c.id === b.customer.id).xeroSync, undefined)
```

```js
assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_xero_operations WHERE record_id=?').bind(b.customer.id).first('n'), 0)
```

```js
assert.ok(!JSON.stringify(exported).includes(b.customer.name))
```

```js
assert.fail('stale connect must fail')
```

```js
assert.match(e.message, /STALE/)
```

```js
b.agent.run('xero.connect', { tenant, token }, { error: 'FORBIDDEN' })
```

```js
b.office.run('xero.inspect', { customerId: b.customer.id }, { error: 'FORBIDDEN' })
```

```js
assert.equal(connected.mode, 'read-only')
```

```js
assert.equal(result.ok, true)
```

```js
assert.deepEqual(review.contacts, [{ id: 'synthetic-glove-contact-1', name: 'Synthetic Customer', email: 'synthetic@example.test' }])
```

```js
assert.equal(review.items.length, 1)
```

```js
assert.equal(review.invoices.length, 1)
```

```js
assert.equal(review.invoices[0].amountDue, 80)
```

```js
assert.ok(!JSON.stringify(review).includes('excluded'))
```

```js
assert.ok(h.xero.calls.every(c => c.method === 'GET' && c.tenant === tenant && c.authorization === `Bearer ${token}`))
```

```js
assertTrail(h, ['xero.connected', 'xero.inspected'])
```

```js
assert.ok(!serialized.includes(tenant))
```

```js
assert.ok(!serialized.includes(token))
```

```js
assert.ok(!serialized.includes('excluded bank detail'))
```

```js
assert.ok(!JSON.stringify(commands.results).includes('synthetic@example.test'), 'inspection bodies are not saved command outcomes')
```

```js
assert.equal((await h.state()).business[0].xeroInspection.connectionId, connection)
```

```js
assert.equal(h.xero.calls.at(-1).authorization, 'Bearer synthetic-glove-2', 'replacement uses the distinct new token')
```

```js
assert.equal(inspectedEvent.actorRole, 'owner')
```

```js
assert.equal(inspectedEvent.subjectId, b.customer.id)
```

```js
h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
```

```js
h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
assert.deepEqual(paginated.contacts.map(row => row.id), Array.from({ length: 101 }, (_, i) => `synthetic-glove-list-${i}`))
```

```js
assert.ok(h.xero.calls.some(call => call.path.endsWith('/Contacts') && call.page === '2'))
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
```

```js
b.office.run('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'FORBIDDEN' })
```

```js
b.agent.run('xero.confirmLinks', { confirm: true }, { error: 'FORBIDDEN' })
```

```js
limitedOwner.run('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'FORBIDDEN' })
```

```js
assert.equal(refusedToken.status, 403)
```

```js
assert.equal(h.xero.calls.length, beforeMap)
```

```js
h.command('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'XERO_MAPPING' })
```

```js
assert.equal((await current(h, 'customers', b.customer.id)).xeroLink, undefined)
```

```js
assert.equal((await current(h, 'customers', b.customer.id)).xeroLink.remoteId, contactId)
```

```js
h.command('xero.map', { kind: 'customer', id: duplicate.id, remoteId: contactId }, { error: 'XERO_MAPPING' })
```

```js
h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_REVIEW' })
```

```js
h.command('xero.map', { kind: 'invoice', id: invoice.id, remoteId: invoiceId }, { error: 'XERO_MAPPING' })
```

```js
h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_MAPPING' })
```

```js
assert.ok(!(await h.state()).business[0].xeroInspection.linksConfirmedAt)
```

```js
assert.equal((await h.command('xero.confirmLinks', { confirm: true })).confirmed, true)
```

```js
assert.equal(linked.xeroLink.confirmedBy, inspectedEvent.actorId)
```

```js
assert.equal(linked.xeroLink.confirmedAt, '2026-11-01T12:00:00.000Z')
```

```js
assert.equal((await current(h, 'invoices', invoice.id)).xeroLink.remoteId, invoiceId)
```

```js
assertTrail(h, ['xero.mapped', 'xero.linksReviewed'])
```

```js
assert.ok(mappingTrail.activity.some(e => e.kind === 'xero.mapped' && e.subjectId === b.customer.id && e.summary.includes(contactId)))
```

```js
assert.ok(h.xero.calls.every(c => c.method === 'GET'), 'mapping and confirmation never post to Xero')
```

```js
assert.equal(officeState.customers.find(row => row.id === b.customer.id).xeroLink, undefined)
```

```js
assert.ok(!officeState.events.some(event => event.kind.startsWith('xero.')))
```

```js
assert.equal(officeExport.invoices.find(row => row.id === invoice.id).xeroLink, undefined)
```

```js
assert.ok(!officeExport.timeline.some(event => event.kind.startsWith('xero.')))
```

```js
assert.equal((await h.state()).business[0].xeroInspection.linksConfirmedAt, null)
```

```js
assert.equal((await current(h, 'customers', b.customer.id)).xeroLink.connectionId, (await h.state()).business[0].xeroInspection.connectionId)
```

```js
assert.notEqual((await h.state()).business[0].xeroInspection.connectionId, connection)
```

```js
h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_REVIEW' })
```

```js
h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_SETUP' })
```

```js
assert.equal((await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='xero'").first()).n, 0)
```

```js
h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_SETUP' })
```

```js
h.command('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'XERO_SETUP' })
```

```js
h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_SETUP' })
```

```js
assert.equal(h.xero.calls.length, calls, 'restored domain history without provider credentials grants no read access')
```

```js
assert.equal(operation.phase, durablePhase, 'Worker interruption retains the actual durable provider phase')
```

```js
assert.equal((await record()).qboSync.phase, 'reserved', 'D1 survives without a fabricated outcome')
```

```js
assert.ok(JSON.stringify(balances).includes('239.69'))
```

```js
assert.equal(writes().length, 1)
```

```js
h.command('qbo.sync', { kind: 'invoice', id: invoice.id }, { error: 'QBO_UNCERTAIN' })
```

```js
assert.equal(writes().length, 1, 'age and scheduled work never retry an interrupted send')
```

```js
assert.equal((await h.command('qbo.sync', { kind: 'invoice', id: invoice.id }, { commandId: syncId })).phase, 'reserved')
```

```js
h.command('qbo.reconcile', { ...args, remoteId: '999999' }, { error: 'QBO_PROVIDER' })
```

```js
h.command('qbo.reconcile', { ...args, remoteId: otherReference.Id }, { error: 'QBO_RECONCILE' })
```

```js
assert.equal(h.quickbooks.calls.length, reads + 1)
```

```js
assert.equal(h.quickbooks.calls.at(-1).method, 'GET', 'verification reads the supplied reference without another provider post')
```

```js
assert.deepEqual(await record(), stateBefore.invoices.find(r => r.id === invoice.id))
```

```js
assert.equal((await h.db.prepare('SELECT remote_id FROM glove_qbo_operations WHERE id=?').bind(operation.id).first()).remote_id, remote.Id)
```

```js
h.command('qbo.reconcile', args, { error: 'QBO_PROVIDER' })
```

```js
h.command('qbo.reconcile', args, { error: 'QBO_RECONCILE' })
```

```js
h.command('qbo.reconcile', args, { error: 'QBO_RECONCILE' })
```

```js
assert.deepEqual(await record(), stateBefore.invoices.find(r => r.id === invoice.id))
```

```js
h.command('qbo.reconcile', args, { error: 'QBO_RECONCILE' })
```

```js
h.command('qbo.reconcile', { ...args, version: 0 }, { error: 'STALE' })
```

```js
h.command('qbo.reconcile', args, { error: 'QBO_REVIEW' })
```

```js
person.run('qbo.reconcile', args, { error: 'FORBIDDEN' })
```

```js
limited.run('qbo.reconcile', args, { error: 'FORBIDDEN' })
```

```js
assert.equal(response.status, headers.authorization ? 403 : 401)
```

```js
alternate.run('qbo.reconcile', args, { error: 'AUTH' })
```

```js
assert.equal((await record()).qboSync.phase, 'reserved')
```

```js
assert.equal((await h.db.prepare('SELECT phase FROM glove_qbo_operations WHERE id=?').bind(operation.id).first()).phase, durablePhase)
```

```js
assert.equal(results.filter(r => r.ok).length, 1)
```

```js
assert.equal(results.find(r => !r.ok).error.code, 'QBO_RECONCILE')
```

```js
assert.equal(recovered.remoteId, remote.Id)
```

```js
assert.equal(recovered.phase, 'complete')
```

```js
assert.deepEqual(await h.command('qbo.reconcile', args, { commandId: requests[success] }), recovered)
```

```js
assert.deepEqual(await h.command('qbo.sync', { kind: 'invoice', id: invoice.id }, { commandId: syncId }), recovered)
```

```js
assert.equal((await h.command('qbo.sync', { kind: 'invoice', id: invoice.id })).remoteId, remote.Id)
```

```js
assert.equal(writes().length, 1)
```

```js
assert.deepEqual(await read(h, '/api/glove/reports/receivables.json?asOf=2026-11-30'), balances)
```

```js
assert.deepEqual((await h.state()).payments, stateBefore.payments)
```

```js
assertTrail(h, ['qbo.reserved', 'qbo.reconciled', 'qbo.replayed'])
```

```js
assert.equal(event.actorRole, 'owner')
```

```js
assert.equal(event.subjectId, invoice.id)
```

```js
assert.ok(event.at)
```

```js
assert.equal(trail.activity.filter(e => e.kind === 'qbo.reconciled').length, 1)
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-901|Bearer/)
```

```js
assert.equal(exported.records.invoices.find(r => r.id === invoice.id).qboSync.remoteId, remote.Id)
```

```js
h.command('qbo.reconcile', args, { error: 'ERASED' })
```

```js
assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_qbo_operations WHERE record_id=?').bind(invoice.id).first('n'), 0)
```

```js
assert.doesNotMatch(JSON.stringify(await read(h, '/api/glove/export')), /Cedar Property Management|120 Congress Avenue/)
```

```js
assert.equal(writes().length, 1)
```

```js
assert.deepEqual(await pending, recovered, 'late unknown response retains the Owner-verified provider fact after initiator withdrawal')
```

```js
assert.deepEqual((await current(h, 'invoices', invoice.id)).qboSync, recovered)
```

```js
assert.equal((await h.db.prepare('SELECT phase FROM glove_qbo_operations WHERE record_id=?').bind(invoice.id).first()).phase, 'complete')
```

```js
alternate.run('qbo.reconcile', { kind: 'invoice', id: invoice.id, remoteId: remote.Id }, { error: 'FORBIDDEN' })
```

```js
h.command('qbo.reconcile', { kind: 'invoice', id: second.id, remoteId: secondRemote.Id }, { error: 'QBO_RECONCILE' })
```

```js
assert.equal(h.quickbooks.calls.length, reads, 'wrong company is refused before any provider read')
```

```js
h.command('qbo.sync', { kind: 'invoice', id: second.id }, { error: 'QBO_UNCERTAIN' })
```

```js
assert.match((await late).message, /subject was erased/)
```

```js
assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_qbo_operations').first('n'), 0)
```

```js
assert.doesNotMatch(exported, /Cedar Property Management|120 Congress Avenue|synthetic-glove-90[12]|Bearer/)
```

```js
assert.equal(h.quickbooks.calls.filter(r => r.body).length, 2, 'each public sync sends exactly one original POST')
```

```js
assert.equal(interrupted.status, 500)
```

```js
assert.equal(operation.phase, 'complete', 'provider completion survives the lost invoice outcome commit')
```

```js
assert.equal(reserved.qboSync.phase, 'reserved', 'Worker restart preserves the unresolved invoice reservation')
```

```js
h.command('qbo.reconcile', args, { error: 'QBO_RECONCILE' })
```

```js
assert.deepEqual(await current(h, 'invoices', invoice.id), reserved)
```

```js
assert.equal(recovered.phase, 'complete')
```

```js
assert.equal(recovered.remoteId, operation.remote_id)
```

```js
assert.deepEqual((await current(h, 'invoices', invoice.id)).qboSync, recovered)
```

```js
assert.deepEqual(await h.command('qbo.sync', { kind: 'invoice', id: invoice.id }, { commandId }), recovered)
```

```js
assert.deepEqual(await h.command('qbo.sync', { kind: 'invoice', id: invoice.id }), recovered)
```

```js
assert.equal(h.quickbooks.calls.filter(call => call.body).length, 1, 'exact-reference recovery never posts the invoice again')
```

```js
assert.deepEqual(await read(h, '/api/glove/reports/receivables.json?asOf=2026-11-30'), balances)
```

```js
assert.deepEqual((await h.state()).payments, [])
```

```js
assertTrail(h, ['qbo.reserved', 'qbo.reconciled', 'qbo.replayed'])
```

```js
assert.equal(event.subjectId, invoice.id)
```

```js
assert.equal(event.actorRole, 'owner')
```

```js
assert.ok(event.summary.includes(`QuickBooks ${operation.remote_id}`))
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-901|Bearer/)
```

### tests/api/quote-link-custody.test.mjs

Assertions before: 104; assertions after: 104.

```js
assert.equal(JSON.stringify(value).includes(token), false, `${surface} excludes the bearer`)
```

```js
assert.match(link.token, /^glq_[A-Za-z0-9_-]{43}$/)
```

```js
assert.equal(Buffer.from(link.token.slice(4), 'base64url').length, 32)
```

```js
assert.deepEqual(secrets, [{ link_id: link.id, hash: createHash('sha256').update(`glove-quote-link:${link.token}`).digest('hex') }])
```

```js
assert.ok(sent, 'the provider edge actually receives the quote email')
```

```js
assert.equal(url.pathname, '/quote')
```

```js
assert.equal(url.search, '')
```

```js
assert.equal(url.hash, `#token=${link.token}`)
```

```js
assert.equal(mail.replace(url.href, '').includes(link.token), false, 'the email carries the bearer only in its fragment')
```

```js
assert.equal((await read(h, link.token)).status, 200)
```

```js
assert.equal((await h.request(path, { as: '', ...options })).status, 404, 'non-header credential does not open the public door')
```

```js
assert.equal(bodyToken.status, 400, 'even an authorized request refuses a body credential')
```

```js
assert.deepEqual(await exportBusiness(h), before, 'refused credentials change no business data')
```

```js
assert.equal((await respond(h, link.token, 'changes', { message: 'Please confirm access with reception.' })).status, 200)
```

```js
assert.equal(replay.token, undefined)
```

```js
assert.equal(replay.id, link.id)
```

```js
assert.equal(h.email.sent.length, sentCount, 'issuance replay sends no second email')
```

```js
assert.deepEqual(await exportBusiness(h), persisted)
```

```js
assert.equal((await read(h, link.token)).status, 200, 'only restart, rather than restore, retains the issued credential')
```

```js
assertTrail(h, ['quote.linkIssued', 'quote.customer.changes'])
```

```js
assert.deepEqual([event.actorName, event.actorRole, event.commandId, event.at], ['Olivia Owner', 'owner', commandId, at])
```

```js
assert.ok(h.logs.length, 'Worker log capture is active')
```

```js
assert.equal((await read(h, link.token)).status, 404)
```

```js
assert.equal((await read(h, replacement.token)).status, 200)
```

```js
assert.equal((await read(h, replacement.token)).status, 404)
```

```js
assert.equal(revokedReplay.token, undefined)
```

```js
assert.equal(h.email.sent.length, emailsBeforeReplay)
```

```js
assert.deepEqual(await exportBusiness(h), revokedSnapshot, 'a captured issuance cannot recreate a revoked link')
```

```js
assert.equal((await respond(h, replacement.token, 'decline')).status, 404, 'replay cannot revive revoked authority')
```

```js
assert.equal(response.status, 200)
```

```js
assert.deepEqual(view, { state: 'superseded', message: 'A newer revision was sent. Ask the business for its current link.' })
```

```js
assert.equal(refused.status, 409, action)
```

```js
assert.deepEqual((await refused.json()).error, { code: 'REVISION', message: view.message })
```

```js
assert.deepEqual(await exportBusiness(h), before, 'superseded requests record no decision or data change')
```

```js
assert.equal(live.state, 'open')
```

```js
assert.equal(live.document.revision, 2)
```

```js
assertTrail(h, ['quote.revised', 'quote.linkIssued'])
```

```js
assert.equal(view.state, 'expired')
```

```js
assert.equal(view.documentHash, first.documentHash)
```

```js
assert.equal(view.updateRequested, false)
```

```js
assert.equal(response.status, 409)
```

```js
assert.equal((await response.json()).error.code, 'EXPIRED')
```

```js
assert.equal(response.status, 200)
```

```js
assert.equal((await response.json()).updateRequested, true)
```

```js
assert.equal((await respond(h, first.token, 'update')).status, 200)
```

```js
assert.equal(record.customerRequests.filter(x => x.revision === 1 && x.action === 'update').length, 1)
```

```js
assert.equal(state.notices.filter(n => n.quoteId === q.id).length, 1)
```

```js
assert.equal(state.enquiries.find(e => e.id === enquiry.id).status, 'contacted')
```

```js
assert.equal((await read(h, first.token)).status, 404)
```

```js
assert.equal((await (await read(h, reissued.token)).json()).updateRequested, true, 'reissuing a link cannot reset the revision update request')
```

```js
assert.equal((await respond(h, reissued.token, 'update')).status, 200)
```

```js
assert.equal((await quote(h, q.id)).customerRequests.length, 1)
```

```js
assert.equal(view.state, 'expired')
```

```js
assert.equal(view.updateRequested, false)
```

```js
assert.equal((await respond(h, next.token, 'update')).status, 200, 'a later revision gets its own single request at the last live instant')
```

```js
assert.equal((await read(h, next.token)).status, 404)
```

```js
assert.equal((await respond(h, next.token, 'update')).status, 404)
```

```js
assert.equal((await read(h, next.token)).status, 404)
```

```js
assert.deepEqual(record.customerRequests.map(x => [x.revision, x.action]), [[1, 'update'], [2, 'update']])
```

```js
assert.equal(state.notices.filter(n => n.quoteId === q.id).length, 2)
```

```js
assertTrail(h, ['quote.customer.update'])
```

```js
assert.equal(activity.filter(e => e.kind === 'quote.customer.update').length, 2)
```

```js
assert.equal(exported.timeline.filter(e => e.kind === 'quote.customer.update').length, 2)
```

```js
assert.equal(original.validUntil, '2030-03-31', 'Sydney March 1 plus the untouched 30-day default')
```

```js
person.run('quote.validity', { days: 5 }, { error: 'FORBIDDEN' })
```

```js
h.command('quote.validity', { days }, { error: 'INPUT' })
```

```js
assert.deepEqual(await exportBusiness(h), before)
```

```js
assert.equal(denied.status, 403)
```

```js
assert.equal((await denied.json()).error.code, 'FORBIDDEN')
```

```js
assert.equal(next.revisions[0].validUntil, validUntil)
```

```js
assert.deepEqual((await quote(h, q.id)).revisions[0], original)
```

```js
assert.deepEqual((await h.state()).quoteLinks.find(l => l.id === link.id), Object.fromEntries(Object.entries(link).filter(([k]) => k !== 'token')))
```

```js
assert.deepEqual(q.revisions[0], original)
```

```js
assert.equal(q.revisions[1].validUntil, '2030-03-02')
```

```js
assert.deepEqual(await h.command('quote.revise', payload, { commandId }), q)
```

```js
assert.equal((await h.state()).business[0].quoteValidityDays, 1)
```

```js
assertTrail(h, ['quote.validity', 'quote.revised'])
```

```js
h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Impossible date', lines, validUntil: '2026-02-30' }, { error: 'INPUT' })
```

```js
assert.deepEqual(await exportBusiness(h), before)
```

```js
h.command('quote.revise', { quoteId: first.id, version: first.version, lines, validUntil: '2026-02-30' }, { error: 'INPUT' })
```

```js
assert.equal((await h.state()).business[0].timezone, 'Australia/Sydney')
```

```js
assert.deepEqual([q.revisions[0].validUntil, q.revisions[0].validityZone, q.revisions[0].validTo, q.revisions[0].linkExpiresAt], ['2030-02-28', 'America/Chicago', '2030-03-01T06:00:00.000Z', '2030-05-30T05:00:00.000Z'])
```

```js
assert.equal((await (await read(h, live.token)).json()).state, 'open')
```

```js
assert.equal((await respond(h, live.token, 'approve', answer)).status, 200, 'approval succeeds at the last Chicago instant of the validity date')
```

```js
assert.equal((await quote(h, first.id)).acceptance.signing.at, '2030-03-01T05:59:59.999Z')
```

```js
assert.equal((await expired.json()).state, 'expired')
```

```js
assert.equal(refused.status, 409)
```

```js
assert.equal((await refused.json()).error.code, 'EXPIRED')
```

```js
assert.equal((await read(h, expiring.token)).status, 200, 'DST-adjusted midnight, rather than ninety UTC days, ends the reading window')
```

```js
assert.equal((await read(h, token)).status, 404)
```

```js
assert.equal((await respond(h, token, 'update')).status, 404)
```

```js
assert.deepEqual(await exportBusiness(h), snapshot, 'expiry refuses without data changes')
```

```js
assertTrail(h, ['quote.customer.approve', 'quote.consentAccepted'])
```

```js
assert.ok(source.includes(addition), 'the era build removes the actual validity addition')
```

```js
assert.equal(old.revisions[0].validUntil, undefined)
```

```js
assert.deepEqual(await exportBusiness(h), before, 'upgrade preserves the actual earlier-build revision')
```

```js
assert.equal((await h.state()).quoteLinks.length, 0)
```

```js
assert.deepEqual(revised.revisions[0], old.revisions[0])
```

```js
assert.equal(revised.revisions[1].validUntil, '2030-03-31')
```

```js
assert.deepEqual(await h.command('quote.revise', payload, { commandId }), revised)
```

```js
assert.deepEqual(await exportBusiness(h), persisted)
```

```js
assert.equal(view.document.revision, 2)
```

```js
assert.equal(view.documentHash, link.documentHash)
```

```js
assertTrail(h, ['quote.revised', 'quote.approved', 'quote.linkIssued'])
```

### tests/api/recurring-billing.test.mjs

Assertions before: 178; assertions after: 178.

```js
assert.equal(response.status, 200)
```

```js
assert.ok(visit, `booked visit on ${date}`)
```

```js
b.dispatcher.run('series.billing', { jobId: perVisit.id, version: perVisit.version, from: '2025-01-01', billing: { mode: 'per-visit' }, reason: 'Price authority refused' }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await b.office.run('series.billingRun', {}, { commandId }), first)
```

```js
assert.equal(each.length, 3)
```

```js
assert.equal(monthly.length, 3)
```

```js
assert.deepEqual(visits.map(v => each.find(i => i.recurring.visitId === v.id).revisions[0].totals.total), ['57.00', '64.00', '71.00'])
```

```js
assert.ok(!each.some(i => i.recurring.visitId === skipped.id))
```

```js
assert.deepEqual(monthly.map(i => [i.recurring.proposedIssuedOn, i.revisions[0].totals.total]), [['2025-01-31', '240.00'], ['2025-02-28', '240.00'], ['2025-03-31', '240.00']])
```

```js
assert.equal(new Set(s.invoices.map(i => i.recurring.key)).size, 6)
```

```js
assert.ok(s.invoices.every(i => i.status === 'draft' && !i.revisions[0].approval && !i.dates))
```

```js
assert.equal((await h.request('/api/glove/reports/revenue.json?from=2025-01-01&to=2025-03-31').then(r => r.json())).total.revenue, '0.00')
```

```js
assert.deepEqual((await h.request('/api/glove/reports/receivables.json?asOf=2025-03-31').then(r => r.json())).totals, [])
```

```js
h.command('invoice.export', {}, { error: 'NOTHING_TO_EXPORT' })
```

```js
h.command('invoice.prepare', { jobId: perVisit.id }, { error: 'RECURRING_BILLING' })
```

```js
assert.equal(h.email.sent.length, 0)
```

```js
assert.ok(!(await b.techPerson.state()).jobs.find(j => j.id === perVisit.id).series.billing)
```

```js
assert.equal((await h.request('/api/glove/recurring-billing', { as: b.techPerson.cookie })).status, 403)
```

```js
assertTrail(h, ['series.billingChanged', 'invoice.prepared', 'series.billingRun'])
```

```js
b.office.run('invoice.approve', { invoiceId: monthly[0].id, version: monthly[0].version, revision: 1 }, { error: 'NOT_FOUND' })
```

```js
assert.deepEqual((await h.request('/api/glove/recurring-billing', { as: b.office.cookie }).then(r => r.json())).missed, [])
```

```js
person.run(type, payload, { error })
```

```js
assert.deepEqual(await snapshot(), before, `${error} leaves every financial record and Activity unchanged`)
```

```js
assert.equal(response.status, 200, await response.clone().text())
```

```js
assert.equal(invoice.recurring.periodEnd, '2025-10-31')
```

```js
assert.equal(invoice.dates, undefined)
```

```js
assert.equal(invoice.approvalAt, undefined)
```

```js
assert.equal(invoice.revisions[0].approval, null)
```

```js
assert.deepEqual(invoice.dates, lateDates)
```

```js
assert.deepEqual(invoice.approvalAt, { ...office, at: '2025-11-03T18:00:00.000Z' })
```

```js
assert.deepEqual(invoice.revisions[0].approval, invoice.approvalAt)
```

```js
assert.deepEqual([invoice.dates.issuedOn, invoice.dates.dueOn, invoice.dates.approvedOn], ['2025-10-31', '2025-11-17', '2025-11-03'])
```

```js
assert.equal(invoice.approvalAt.at, '2025-11-03T18:00:00.000Z')
```

```js
assert.equal(await aging('2025-11-02'), undefined)
```

```js
assert.equal((await aging(date)).bucket, bucket)
```

```js
assert.equal(revenue.total.revenue, '240.00')
```

```js
assert.equal(revenue.approvedAfterPeriodEnd[0].invoiceId, invoice.id)
```

```js
assert.equal(tax.jurisdictions[0].tax, '24.00')
```

```js
assert.equal(tax.approvedAfterPeriodEnd[0].issuedOn, '2025-10-31')
```

```js
assert.ok(csv.includes('10/31/2025,11/17/2025'))
```

```js
assert.deepEqual([qbo.TxnDate, qbo.DueDate], ['2025-10-31', '2025-11-17'])
```

```js
assert.equal(csv, expectedCsv, 'the entire downloaded monthly accounting record uses the period end and frozen due date')
```

```js
assert.deepEqual(revenue.approvedAfterPeriodEnd, [{ invoiceId: invoice.id, number: 'INV-0002', issuedOn: '2025-10-31', approvedOn: '2025-11-03', dueOn: '2025-11-17', label: 'approved after period end' }])
```

```js
assert.deepEqual(tax.approvedAfterPeriodEnd, revenue.approvedAfterPeriodEnd)
```

```js
assert.deepEqual(qbo, {
    CustomerRef: { value: '1' }, CurrencyRef: { value: 'USD' }, DocNumber: 'INV-0002', TxnDate: '2025-10-31', DueDate: '2025-11-17',
    BillAddr: { Line1: '' }, ShipAddr: { Line1: '120 Main Street, Austin TX 78701' },
    PrivateNote: 'Glove INV-0002 revision 1; J-1002; Local sales tax (10%)',
    Line: [{ LineNum: 1, Description: 'Preventive maintenance', Amount: 240, DetailType: 'SalesItemLineDetail', SalesItemLineDetail: { ItemRef: { value: '2' }, Qty: 1, UnitPrice: 240, TaxCodeRef: { value: 'TAX' } } }],
    TxnTaxDetail: { TxnTaxCodeRef: { value: '3' }, TotalTax: 24 },
  })
```

```js
assert.deepEqual(corrected.revisions[0], original)
```

```js
assert.deepEqual(corrected.approvalAt, { ...office, at: '2025-11-03T18:00:00.000Z' }, 'the first approval is retained separately from correction approval')
```

```js
assert.deepEqual(corrected.revisions[1].approval, { ...owner, at: '2025-11-11T05:30:00.000Z' })
```

```js
assert.deepEqual((await h.state()).invoices.find(i => i.id === invoice.id).dates, dates)
```

```js
assert.deepEqual([after.TxnDate, after.DueDate], [qbo.TxnDate, qbo.DueDate])
```

```js
assert.equal(await download(`/api/glove/exports/${correctionExport.id}.csv`), expectedCorrectionCsv)
```

```js
assert.equal(await download(`/api/glove/exports/${exported.id}.csv`), expectedCsv, 'later correction and export leave original output unchanged')
```

```js
assert.deepEqual((await h.state()).invoices.find(i => i.id === invoice.id).dates, lateDates)
```

```js
assert.deepEqual(approved.dates, { issuedOn: '2025-11-30', dueOn: '2025-12-14', termsDays: 14, basis: 'fixed monthly period end; terms frozen at first approval', approvedOn: '2025-11-30', approvedAfterPeriodEnd: false })
```

```js
assert.deepEqual(approved.approvalAt, { ...office, at: '2025-12-01T05:30:00.000Z' }, 'UTC December 1 is still November 30 in the business zone')
```

```js
assert.deepEqual(approved.revisions[0].approval, approved.approvalAt)
```

```js
assert.equal(approved.dates.issuedOn, '2025-11-30')
```

```js
assert.equal(approved.dates.dueOn, '2025-12-14')
```

```js
assert.equal(await h.request(`/api/glove/exports/${oldExport.id}.csv`).then(r => r.text()), oldCsv)
```

```js
assert.deepEqual(await h.request(oldDoor).then(r => r.json()), oldQbo)
```

```js
assert.deepEqual((await h.state()).invoices.find(i => i.id === oldInvoice.id).dates, oldInvoice.dates)
```

```js
assert.deepEqual((await h.state()).invoices.find(i => i.id === oldInvoice.id), retainedOld)
```

```js
assert.deepEqual(await snapshot(), retained, 'ordinary and monthly revisions, dates, decisions and exports survive a real Worker restart')
```

```js
assert.equal(await download(`/api/glove/exports/${id}.csv`), expected)
```

```js
assert.deepEqual(await h.request(oldDoor).then(r => r.json()), oldQbo)
```

```js
assert.deepEqual(await h.request(qboDoor).then(r => r.json()), after)
```

```js
assertTrail(h, ['invoice.prepared', 'invoice.approved', 'invoice.corrected', 'invoice.exported'])
```

```js
assert.equal(event.length, 1)
```

```js
assert.deepEqual([event[0].kind, event[0].actorId, event[0].actorName, event[0].actorRole, event[0].at, event[0].subjectId], ['invoice.approved', recorder.id, recorder.name, recorder.role, at, id])
```

```js
assert.match(event[0].summary, new RegExp(`revision ${revision} approved by`))
```

```js
assert.equal(kept.length, 1)
```

```js
assert.deepEqual([kept[0].id, kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].at, kept[0].subject_id], [event[0].id, recorder.id, recorder.name, recorder.role, at, id])
```

```js
assert.deepEqual(businessExport.invoices, retained.invoices.map(({ reminderState: _liveReminderLabel, ...record }) => record))
```

```js
assert.deepEqual(businessExport.approvals, retained.approvals)
```

```js
assert.deepEqual(await snapshot(), retained, 'report, payload, Activity and business-export reads have no financial effect')
```

```js
assert.deepEqual(retained.payments, [])
```

```js
assert.equal(h.stripePayments.calls.filter(c => c.method === 'POST').length, 0)
```

```js
assert.equal(h.quickbooks.calls.filter(c => c.method === 'POST').length, 0)
```

```js
assert.equal(h.email.sent.length, 0)
```

```js
assert.equal(h.twilio.calls.length, 0)
```

```js
assert.equal(first.status, 'approved')
```

```js
assert.ok(first.approvalAt.autoRule)
```

```js
assert.equal((await h.state()).invoices.filter(i => i.jobId === closed.id).length, 1)
```

```js
assert.ok(missing.missed.some(m => m.jobId === unpriced.id && /not in the price book/.test(m.reason)))
```

```js
assert.equal((await h.state()).invoices.filter(i => i.jobId === fixed.id).length, 1)
```

```js
assert.deepEqual(invoices.map(i => i.revisions[0].totals.total), ['80.00', '90.00'])
```

```js
assert.deepEqual((await h.state()).invoices.find(i => i.id === first.id), first)
```

```js
h.command('series.billing', { jobId: fixed.id, version: latest.version, from: '2025-01-01', reason: 'Retrospective change', billing: { mode: 'as-needed' } }, { error: 'BILLING_DATE' })
```

```js
assert.equal(s.notices.filter(n => n.jobId === reminder.id && n.recurringBillingKey).length, 1)
```

```js
assert.equal(s.invoices.filter(i => i.jobId === reminder.id).length, 0)
```

```js
assert.equal(s.invoices.filter(i => i.jobId === closed.id).length, 1)
```

```js
assert.equal(h.email.sent.length, 0)
```

```js
assertTrail(h, ['series.billingReminder', 'series.billingMissed', 'invoice.autoApproved'])
```

```js
b.office.run('payment.autopayAuthorize', consent, { error: 'FORBIDDEN' })
```

```js
h.command('payment.autopayAuthorize', { ...consent, confirmed: false }, { error: 'CONSENT' })
```

```js
h.command('payment.autopayAuthorize', { ...consent, maxAmount: '0.00' }, { error: 'AMOUNT' })
```

```js
assert.equal((await b.office.state()).jobs.find(j => j.id === job.id).series.billing.autopay, undefined, 'authorization evidence stays owner-only')
```

```js
assert.deepEqual(job.series.billing.autopayHistory, [authorization])
```

```js
assert.equal(authorization.ruleId, job.id)
```

```js
assert.equal(authorization.ruleRevision, 1)
```

```js
assert.equal(authorization.cadence, 'monthly')
```

```js
assert.equal(authorization.customerId, b.customer.id)
```

```js
assert.equal(authorization.cardId, card.id)
```

```js
assert.equal(authorization.by.id, (await h.state()).actor.id)
```

```js
assert.equal(authorization.by.name, 'Olivia Owner')
```

```js
assert.equal(authorization.maxAmount, '240.00')
```

```js
h.command('payment.autopayCharge', payload, { error: code })
```

```js
assert.equal(error.message, message)
```

```js
assert.equal(posts(), before.posts, 'a refusal makes no provider POST')
```

```js
assert.deepEqual((await h.state()).payments, before.payments, 'a refusal reserves no payment')
```

```js
assert.deepEqual(await balances(), before.balances, 'a refusal changes no invoice balance')
```

```js
assert.equal(authorization.at, '2025-01-01T16:00:00.000Z')
```

```js
assert.equal(authorization.source, consent.source)
```

```js
assert.equal(authorization.wording, consent.wording)
```

```js
assert.equal((await person.run(type, input, { error: 'FORBIDDEN' })).message, 'Owner access required')
```

```js
person.run(type, input, { error: 'FORBIDDEN' })
```

```js
assert.equal(response.status, 403)
```

```js
assert.equal((await h.request('/api/glove/commands', { method: 'POST', as: '', body: { commandId: randomUUID(), type: 'payment.autopayCharge', payload } })).status, 401)
```

```js
assert.equal(posts(), deniedBefore.posts)
```

```js
assert.deepEqual((await h.state()).payments, deniedBefore.payments)
```

```js
assert.deepEqual(await balances(), deniedBefore.balances, 'all authority refusals leave money unchanged')
```

```js
assert.deepEqual(await h.command('payment.autopayCharge', unknownPayload, { commandId: unknownId }), uncertain)
```

```js
assert.equal(posts(), count)
```

```js
assert.deepEqual((await h.state()).payments.find(p => p.id === uncertain.id).effects, [])
```

```js
assert.equal(before, Number(month), 'billing alone never charges beyond the explicit requests')
```

```js
h.command('payment.autopayCharge', { ...payload, amount: '1.00' }, { error: 'AMOUNT' })
```

```js
assert.deepEqual(duplicate, payment, 'concurrent replay has one durable outcome')
```

```js
assert.equal(edge.calls.filter(c => c.method === 'POST').length, before + 1)
```

```js
assert.equal(payment.autopay.authorizationId, authorization.id)
```

```js
assert.equal((await h.state()).payments.find(p => p.id === payment.id).status, 'reserved')
```

```js
assert.equal((await paymentEvent(h, intent, 'payment_intent.payment_failed', { at: Date.parse(at) / 1000 })).status, 200)
```

```js
h.command('payment.autopayCharge', payload, { error: 'PAYMENT_PENDING' })
```

```js
assert.equal((await h.state()).payments.find(p => p.id === payment.id).failureReason, 'Card expired')
```

```js
assert.equal((await confirmSavedCard(h, payment.id, { at: Date.parse(at) / 1000, signature: false })).status, 401)
```

```js
assert.equal((await confirmSavedCard(h, payment.id, { at: Date.parse(at) / 1000 })).status, 200)
```

```js
assert.equal((await confirmSavedCard(h, payment.id, { at: Date.parse(at) / 1000 })).status, 200)
```

```js
assert.equal((await h.state()).payments.find(p => p.id === payment.id).effects.length, 1)
```

```js
h.command('payment.autopayCharge', payload, { error: 'AMOUNT' })
```

```js
assert.equal(new Set(retained.map(a => a.id)).size, 4, 'replacement permissions have distinct identities')
```

```js
assert.deepEqual(retained[0], { ...authorization, revokedAt: '2025-04-01T04:59:00.000Z', revokedBy: authorization.by.id, reason: 'synthetic-glove-22 withdrawal in flight' })
```

```js
assert.equal(retained[1].source, 'synthetic-glove-23')
```

```js
assert.equal(retained[1].wording, 'Fresh recorded monthly permission after withdrawal.')
```

```js
assert.equal(retained[1].reason, 'Customer withdrew recurring permission')
```

```js
assert.equal(retained[2].maxAmount, '239.99')
```

```js
assert.equal(retained[2].reason, 'Replace maximum with fresh permission')
```

```js
assert.equal(retained[3].revokedAt, undefined)
```

```js
assert.deepEqual(latest.series.billing.autopayHistory, retained, 'billing edits retain all permission evidence')
```

```js
former.run('payment.autopayCharge', { ...failedPayload, invoiceId: authorityInvoice.id, version: authorityInvoice.version }, { error: 'AUTH' })
```

```js
assert.equal(posts(), authorityBefore.posts)
```

```js
assert.deepEqual((await h.state()).payments, authorityBefore.payments, 'changed authority cannot commit a reservation')
```

```js
assert.deepEqual(await balances(), authorityBefore.balances)
```

```js
former.run('payment.autopayCharge', replay.payload, { error: 'FORBIDDEN' })
```

```js
assert.equal(posts(), count, 'replay after withdrawal never repeats the request')
```

```js
assert.equal(h.email.sent.length, 0)
```

```js
assertTrail(h, ['autopay.authorized', 'autopay.revoked', 'payment.savedCardRequested', 'payment.paid', 'payment.failed'])
```

```js
assert.deepEqual(trail.exported.jobs.find(j => j.id === job.id).series.billing.autopayHistory, retained)
```

```js
assert.ok(authored, 'every distinct permission has an exported Activity event')
```

```js
assert.equal(authored.actor_id, permission.by.id)
```

```js
assert.equal(authored.at, permission.at)
```

```js
assert.ok(withdrawn, 'every withdrawal stays attributable')
```

```js
assert.equal(withdrawn.actor_id, permission.revokedBy)
```

```js
assert.equal(withdrawn.at, permission.revokedAt)
```

```js
assert.equal(state.jobs.find(j => j.id === job.id).series.billing.autopayHistory, undefined)
```

```js
assert.equal(payment.savedCard?.authorizedAt, undefined)
```

```js
assert.deepEqual(saved.authorization, { scope: 'autopay' })
```

```js
assert.equal(response.status, person === b.dispatcher && path === '/api/glove/export' ? 403 : 200)
```

```js
assert.ok(!serialized.includes(authorization.wording) && !serialized.includes('synthetic-glove-23'), 'permission evidence is Owner-only on every read door')
```

```js
assert.ok(!(body.events ?? body.timeline ?? []).some(e => e.kind.startsWith('autopay.')))
```

```js
assert.equal(result.savedCards[0].authorization.wording, undefined, 'ordinary command outcomes do not expose consent evidence')
```

```js
assert.equal((await h.request('/api/glove/state', { headers: { authorization: 'Bearer ' + token.token } })).status, 401)
```

```js
assert.doesNotMatch(JSON.stringify(trail.exported), /client_secret|cardNumber|stripe-signature/)
```

```js
assert.deepEqual((await h.state()).invoices.filter(i => i.jobId === job.id).map(i => [i.dates.issuedOn, i.revisions[0].totals.total]), [['2025-01-31', '240.00'], ['2025-02-28', '240.00'], ['2025-03-31', '240.00']])
```

```js
assert.equal(erased.jobs.find(j => j.id === job.id).series, undefined)
```

```js
assert.equal(erased.customers.find(c => c.id === customer.id).savedCards, undefined)
```

```js
assert.ok(!JSON.stringify(erased).includes(authorization.wording))
```

```js
assert.ok(!JSON.stringify(erased).includes('synthetic-glove-23'))
```

```js
assert.equal(recovered.error.code, 'ERASED', 'erasure removes the personal saved result')
```

```js
assert.equal(posts(), count)
```

### tests/api/eligibility.test.mjs

Assertions before: 158; assertions after: 158.

```js
assert.equal(site.zip, '60654')
```

```js
assert.deepEqual(tom.skills, ['gas', 'epa 608'])
```

```js
assert.deepEqual((await h.command('technician.save', { id: tom.id, version: tom.version, name: tom.name, operatorId: b.tomPerson.id, active: true })).zips, ['60601', '60602'])
```

```js
b.dispatcher.run('visit.book', booking(b.priya.id, '2026-10-20'), { error: 'ELIGIBILITY' })
```

```js
assert.match(skill.message, /does not have the gas skill/)
```

```js
b.dispatcher.run('visit.book', booking(tom.id, '2026-10-21'), { error: 'ELIGIBILITY' })
```

```js
assert.match(off.message, /off on 2026-10-21 \(Dentist\)/)
```

```js
b.dispatcher.run('visit.book', booking(tom.id, '2026-10-24'), { error: 'ELIGIBILITY' })
```

```js
b.dispatcher.run('visit.book', booking(tom.id, '2026-10-20'), { error: 'CONFLICT_REVIEW' })
```

```js
assert.deepEqual(area.details.conflicts.map(c => c.code), ['area:60654'])
```

```js
assert.equal(visit.technicianId, tom.id)
```

```js
b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, technicianId: b.priya.id, reason: 'Rebalance' }, { error: 'ELIGIBILITY' })
```

```js
b.dispatcher.run('visit.book', booking(b.priya.id, '2026-10-22', { start: '11:00', end: '12:00' }), { error: 'CONFLICT_REVIEW' })
```

```js
assert.deepEqual(warned.details.conflicts.map(c => c.code), ['skill:gas'])
```

```js
b.dispatcher.run('visit.book', booking(tom.id, '2026-10-21', { start: '13:00', end: '14:00' }), { error: 'CONFLICT_REVIEW' })
```

```js
assert.deepEqual(away.details.conflicts.map(c => c.code), ['off:2026-10-21'])
```

```js
b.dispatcher.run('technician.calendar', { technicianId: b.tom.id, url: secret }, { error: 'FORBIDDEN' })
```

```js
b.priyaPerson.run('technician.calendar', { technicianId: b.tom.id, url: secret }, { error: 'FORBIDDEN' })
```

```js
assert.equal(set.calendar.connected, true)
```

```js
assert.equal((await (await door(h.owner())).json()).url, secret)
```

```js
assert.equal((await (await door(b.tomPerson.cookie)).json()).url, secret)
```

```js
assert.equal((await door(other)).status, 403)
```

```js
assert.equal(read.calendar.busy.length, 7, JSON.stringify(read.calendar.busy))
```

```js
assert.equal(read.calendar.unexpanded, 1)
```

```js
assert.ok(!JSON.stringify(read).includes('dentist'), 'busy spans carry no titles')
```

```js
b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date, start, end }, { error: 'ELIGIBILITY' })
```

```js
assert.match((await book('2026-11-03', '09:30', '10:00')).message, /Tom B\.'s calendar shows busy time/)
```

```js
b.dispatcher.run('technician.calendarRead', { technicianId: b.tom.id }, { error: 'CALENDAR' })
```

```js
assert.ok(!JSON.stringify(gone).includes(hidden))
```

```js
assert.ok(!JSON.stringify(await h.state(who)).includes(hidden))
```

```js
assert.ok(!(await (await h.request('/api/glove/export')).text()).includes(hidden))
```

```js
assert.ok(!JSON.stringify(rows).includes(hidden), `${table} never holds the address`)
```

```js
assertTrail(h, ['technician.calendar', 'technician.calendarRead'])
```

```js
b.dispatcher.run('calendar.connect', connect, { error: 'FORBIDDEN' })
```

```js
h.command('calendar.connect', { ...connect, confirm: false }, { error: 'CONSENT' })
```

```js
b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-21', start: '09:00', end: '10:00' }, { error: 'ELIGIBILITY' })
```

```js
assert.equal(created.method, 'POST')
```

```js
assert.equal(created.provider, provider)
```

```js
assert.equal(JSON.stringify(created.body).includes(b.customer.name), provider === 'microsoft')
```

```js
assert.equal(JSON.stringify(created.body).includes(b.site.address), provider === 'microsoft')
```

```js
assert.equal(writes().length, count, 'replay does not send a second calendar event')
```

```js
assert.equal(writes().at(-1).method, 'PATCH')
```

```js
assert.equal(writes().at(-1).body.start.dateTime, v.startAt)
```

```js
assert.equal(writes().at(-1).method, 'DELETE')
```

```js
assert.ok(!JSON.stringify((await h.db.prepare(`SELECT * FROM ${table}`).all()).results).includes(connect.refreshToken))
```

```js
assert.ok(!(await (await h.request('/api/glove/export')).text()).includes(connect.clientSecret))
```

```js
b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-22', start: '13:00', end: '14:00' }, { error: 'CALENDAR_SYNC' })
```

```js
assertTrail(h, ['calendar.connected', 'calendar.disconnected', 'calendar.outcome'])
```

```js
b.dispatcher.run('maps.connect', { key }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual([erie.location.lat, erie.location.lng, lakeShore.zip], [41.8937, -87.6386, '60637'])
```

```js
assert.equal(lost.location, null)
```

```js
assert.match(lost.locateError, /found no place/)
```

```js
assert.deepEqual(h.maps.calls.filter(c => c.api === 'geocode').map(c => [c.key, c.address]).sort(), [...places.map(([address]) => [key, address]), [key, '1 Nowhere Rd, Atlantis, IL 60000']].sort())
```

```js
b.dispatcher.run('technician.zones', { technicianId: b.tom.id, version: b.tom.version, zones: [north] }, { error: 'FORBIDDEN' })
```

```js
h.command('technician.zones', { technicianId: b.tom.id, version: b.tom.version, zones: [{ name: 'Line', points: north.points.slice(0, 2) }] }, { error: 'INPUT' })
```

```js
assert.deepEqual(tom.zones.map(z => [z.name, z.points.length]), [['North Side', 4]])
```

```js
assert.deepEqual(outside.details.conflicts.map(c => c.code), ['area:60637'])
```

```js
assert.equal(outside.details.conflicts[0].message, 'Tom B.\'s drawn zones do not include 5700 S Lake Shore Dr, Chicago, IL 60637 (60637).')
```

```js
assert.match(unknown.details.conflicts[0].message, /, which is not on the map yet\.$/)
```

```js
assert.equal(refused.technicianId, b.priya.id)
```

```js
assert.match((await visit(await job(lost, 'Still unplaced'), tom.id, '2026-11-04', '09:00', '10:00', { error: 'ELIGIBILITY' })).message, /^Tom B\.'s drawn zones and ZIP codes do not include 1 Nowhere Rd/)
```

```js
assert.equal(auto.technicianId, tom.id)
```

```js
assert.ok(ranking, auto.assignments[0].reason)
```

```js
assert.ok(Number(ranking[1]) < Number(ranking[2]), 'the shorter drive wins a tie in booked minutes')
```

```js
assert.equal(routed.key, key)
```

```js
assert.ok(!/Erie|Wacker|Lake Shore|Harbourview|Tower|Priya|Tom/.test(JSON.stringify(routed.body)), 'routing sends coordinates only')
```

```js
assert.deepEqual(tomDay.stops.map(x => [x.start, x.address]), [['08:00', places[0][0]], ['10:00', places[3][0]]])
```

```js
assert.equal(tomDay.legs.length, 1)
```

```js
assert.equal(Math.round(tomDay.legs[0].seconds / 60), Number(ranking[1]))
```

```js
assert.equal((await h.request('/api/glove/map?date=2026-11-05', { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal(image.headers.get('content-type'), 'image/png')
```

```js
assert.deepEqual(Object.keys(drawn.query).sort(), ['center', 'maptype', 'scale', 'size', 'zoom'])
```

```js
assert.ok(!JSON.stringify(await h.state(who)).includes(key))
```

```js
assert.ok(!(await (await h.request('/api/glove/export')).text()).includes(key))
```

```js
assert.ok(!JSON.stringify((await h.db.prepare(`SELECT * FROM ${table}`).all()).results).includes(key), `${table} never holds the key`)
```

```js
assertTrail(h, ['maps.connected', 'site.located', 'technician.zones'])
```

```js
assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: now() } })).status, 200)
```

```js
assert.deepEqual(await (await h.request('/api/glove/location', { as: b.priyaPerson.cookie })).json(), { enabled: false, delegates: [] })
```

```js
b.priyaPerson.run('location.phone', { lat: 41.89001, lng: -87.63001, observedAt: now() }, { error: 'LOCATION_STOPPED' })
```

```js
b.priyaPerson.run('location.phone', { lat: 41.89001, lng: -87.63001, observedAt: now() }, { error: 'LOCATION_STOPPED' })
```

```js
b.priyaPerson.run('location.phone', { lat: 41.89001, lng: -87.63001, observedAt: now() }, { error: 'LOCATION_STOPPED' })
```

```js
b.priyaPerson.run('location.phone', { lat: 999, lng: 0, observedAt: now() }, { error: 'LOCATION' })
```

```js
b.priyaPerson.run('location.phone', { lat: 41.89001, lng: -87.63001, observedAt: '2000-01-01T00:00:00Z' }, { error: 'LOCATION_STALE' })
```

```js
assert.deepEqual(received, { accepted: true, source: 'phone' })
```

```js
assert.equal(live.position.lat, point.lat)
```

```js
assert.equal(live.position.source, 'phone')
```

```js
assert.ok(live.eta && live.eta.seconds >= 0, JSON.stringify(live))
```

```js
assert.deepEqual(await b.priyaPerson.run('location.phone', second), { accepted: true, source: 'phone' })
```

```js
assert.equal(latest.length, 1)
```

```js
assert.deepEqual([latest[0].technician_id, latest[0].visit_id, latest[0].lat, latest[0].lng, latest[0].observed_at], [b.priya.id, active.id, second.lat, second.lng, second.observedAt])
```

```js
assert.deepEqual([live.position.lat, live.position.lng, live.position.observedAt], [second.lat, second.lng, second.observedAt])
```

```js
assert.ok(live.eta)
```

```js
assert.ok((await positions(who)).every(t => t.live === null))
```

```js
assert.deepEqual(await stored(), latest, 'Denied position views leave the latest fix unchanged')
```

```js
assert.equal((await h.request(`/api/glove/map?date=${active.local.date}`, { as: b.tomPerson.cookie })).status, 403)
```

```js
b.dispatcher.run('location.delegate', delegation, { error: 'FORBIDDEN' })
```

```js
b.agent.run('location.delegate', delegation, { error: 'FORBIDDEN' })
```

```js
h.command('location.delegate', { ...delegation, shiftId: 'synthetic-glove-absent' }, { error: 'SHIFT' })
```

```js
assert.deepEqual((await (await h.request('/api/glove/location', { as: b.priyaPerson.cookie })).json()).delegates, [{ name: b.dispatcher.name, role: 'dispatcher' }])
```

```js
assert.equal((await positions(b.dispatcher.cookie)).find(t => t.id === b.priya.id).live.position.lat, second.lat)
```

```js
assert.equal(await auditCount(), auditBefore + 2, 'Every delegated read is audited')
```

```js
assert.equal(audit.actor_id, b.dispatcher.id)
```

```js
assert.deepEqual(JSON.parse(audit.data), { shiftId: shift.id, date: active.local.date })
```

```js
assert.ok(!JSON.stringify(audit).includes(String(second.lat)) && !JSON.stringify(audit).includes(String(second.lng)), 'Delegated read audits contain no coordinates')
```

```js
assert.ok((await positions(b.agent.cookie)).every(t => t.live === null), 'Granting Dispatcher does not grant any agent')
```

```js
assert.equal((await positions(b.agent.cookie)).find(t => t.id === b.priya.id).live.position.lat, second.lat)
```

```js
assert.ok((await positions(b.office.cookie)).every(t => t.live === null))
```

```js
assert.deepEqual(await stored(), latest, 'Delegation never changes latest-only custody')
```

```js
assert.ok((await positions(b.dispatcher.cookie)).every(t => t.live === null))
```

```js
assert.ok((await positions(b.agent.cookie)).every(t => t.live === null))
```

```js
assert.equal(r.status, 403)
```

```js
assert.ok(!JSON.stringify((await h.db.prepare(`SELECT * FROM ${table}`).all()).results).includes('41.89001'), table)
```

```js
assert.ok(!(await (await h.request('/api/glove/export')).text()).includes('41.89001'))
```

```js
assert.ok(!(await positions(b.dispatcher.cookie)).some(t => t.id === b.priya.id), 'A branch-limited dispatcher sees no foreign position')
```

```js
assert.equal(h.fleet.calls.length, fleetReads, 'Reading the board never polls Samsara')
```

```js
b.dispatcher.run('location.fleetRead', { technicianId: b.priya.id }, { error: 'FORBIDDEN' })
```

```js
b.agent.run('location.fleetRead', { technicianId: b.priya.id }, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.fleet.calls.length, fleetReads)
```

```js
assert.equal(h.fleet.calls.length, fleetReads + 1)
```

```js
assertTrail(h, ['location.consent', 'location.fleetConnected', 'location.received'])
```

```js
assert.equal(live.position.source, 'Samsara')
```

```js
assert.equal(live.position.lat, 41.89123)
```

```js
assert.ok(live.eta)
```

```js
assert.ok(!state.includes(value), 'Captured coordinates and fleet keys never enter state')
```

```js
assert.ok(!privateExport.includes(value))
```

```js
assert.ok(!data.includes(value), table)
```

```js
assert.deepEqual(h.fleet.calls.at(-1), { method: 'GET', url: 'https://api.samsara.com/fleet/vehicles/stats?vehicleIds=12345&types=gps', authorization: 'Bearer synthetic-glove-501' })
```

```js
assert.ok(risk, 'The next visit is at risk while the current job runs long')
```

```js
assert.ok(risk.reasons.some(r => /Samsara position 41.89123, -87.63123; ETA/.test(r)))
```

```js
assert.ok(risk.options.length)
```

```js
assert.ok(risk.options.every(o => /Delayed technician: Samsara position.*ETA/.test(o.note)))
```

```js
assert.ok(!/41\.89123|-87\.63123|Samsara position/.test(JSON.stringify(denied)), 'Delay proposals do not grant a location view')
```

```js
assert.deepEqual(await stored(), beforeDeniedDelayReads, 'Denied delay views leave storage unchanged')
```

```js
assert.equal(mixed.find(t => t.id === b.tom.id).live.position.source, 'phone')
```

```js
assert.ok(mixed.find(t => t.id === b.tom.id).live.eta)
```

```js
assert.equal(mixed.find(t => t.id === b.priya.id).live.position.source, 'Samsara')
```

```js
assert.equal((await positions(h.owner())).find(t => t.id === b.priya.id).live.eta, null)
```

```js
h.command('location.fleetRead', { technicianId: b.priya.id }, { error: 'FLEET' })
```

```js
assert.equal((await stored()).length, 1)
```

```js
assert.equal(live.status, 'Location stale')
```

```js
assert.equal(live.position, null)
```

```js
assert.equal(live.eta, null)
```

```js
assert.equal((await stored()).length, 0, 'The next product command removes expired coordinates using the command clock')
```

```js
h.command('location.fleetRead', { technicianId: b.priya.id }, { error: 'LOCATION_STOPPED' })
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_live_locations').first()).n, 0, 'A concurrent withdrawal fences an in-flight provider response')
```

```js
b.priyaPerson.run('location.phone', { ...point, observedAt: now() }, { error: 'LOCATION_STOPPED' })
```

```js
h.command('location.fleetRead', { technicianId: b.priya.id }, { error: 'LOCATION_STOPPED' })
```

```js
assert.equal(h.fleet.calls.length, reads, 'No off-consent provider request')
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_live_locations').first()).n, 0)
```

```js
b.priyaPerson.run('location.phone', { ...point, observedAt: now() }, { error: 'LOCATION_STOPPED' })
```

```js
assert.deepEqual((await (await h.request('/api/glove/location', { as: b.priyaPerson.cookie })).json()).delegates, [])
```

```js
assert.ok((await positions(b.dispatcher.cookie)).every(t => t.live === null), 'A new shift never inherits the grant')
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_live_locations').first()).n, 0)
```

```js
b.priyaPerson.run('location.phone', { ...point, observedAt: now() }, { error: 'LOCATION_STOPPED' })
```

```js
h.command('location.fleetRead', { technicianId: b.priya.id }, { error: 'LOCATION_STOPPED' })
```

```js
assert.equal(h.fleet.calls.length, reads)
```

```js
assert.equal(revoked.status, 401, 'A revoked sign-in cannot submit a position')
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_live_locations').first()).n, 0)
```

### tests/api/documents.test.mjs

Assertions before: 30; assertions after: 30.

```js
b.office.run('document.template', { kind: 'quote', version: businessRow.version, heading: 'Proposal', terms: 'No changes' }, { error: 'FORBIDDEN' })
```

```js
b.dispatcher.run('document.photo', { kind: 'quote', id: quote.id, version: quote.version, photo }, { error: 'FORBIDDEN' })
```

```js
assert.equal(d.business.legalName, 'Synthetic Glove LLC')
```

```js
assert.equal(d.business.ein, '12-3456789')
```

```js
assert.deepEqual(d.business.licenses.map(l => l.number), ['synthetic-glove-9','synthetic-glove-10'])
```

```js
assert.equal(d.template.terms, 'Payment due in 14 days.')
```

```js
assert.equal(d.options[0].lines[0].customerDescription, service.description)
```

```js
assert.equal(d.options[0].lines[0].images[0].fileId, service.images[0].fileId)
```

```js
assert.equal(d.photos[0].caption, 'Customer-facing site photo')
```

```js
assert.equal(d.files.length, 3)
```

```js
assert.equal(response.status, 200)
```

```js
assert.equal(Buffer.from(await response.arrayBuffer()).toString('base64'), fileId === d.business.logo.fileId ? documentLogo : png)
```

```js
assert.equal((await read(`/files/${unrelated.images[0].fileId}`)).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/public/quote/files/${d.files[0]}`, { as: '' })).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/public/quote/files/${d.files[0]}?token=${link.token}`, { as: '' })).status, 404)
```

```js
assert.deepEqual((await (await read('')).json()).document, d, 'issued customer document never changes with a template edit')
```

```js
assert.ok(!JSON.stringify(d).includes('1091.50'))
```

```js
assert.ok(!JSON.stringify(d).includes(b.customer.email))
```

```js
assertTrail(h, ['document.template','document.photo','quote.linkIssued'])
```

```js
assert.equal((await read('')).status, 404)
```

```js
assert.equal((await read(`/files/${quote.documentPhotos[0].file.fileId}`)).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/files/${quote.documentPhotos[0].file.fileId}`)).status, 404)
```

```js
assert.equal(doc.kind, 'invoice')
```

```js
assert.equal(doc.lines[0].description, 'Split system service')
```

```js
assert.equal(doc.totals.total, invoice.revisions[0].totals.total)
```

```js
assert.equal((await h.request(`/api/glove/documents/invoice/${invoice.id}`, { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal((await h.request(`/api/glove/documents/invoice/${invoice.id}`, { as: '' })).status, 401)
```

```js
assert.equal(agreementDoc.title, plan.name)
```

```js
assert.match(agreementDoc.lines[0].customerDescription, /2 included visits/)
```

```js
assert.equal(agreementDoc.totals.total, '240.00')
```

### tests/api/xero.test.mjs

Assertions before: 73; assertions after: 73.

```js
assert.deepEqual(discovery.contacts.map(c => c.id), Array.from({ length: 201 }, (_, n) => `synthetic-glove-contact-${n}`).filter(id => id !== 'synthetic-glove-contact-1'))
```

```js
assert.deepEqual(discovery.invoices.map(i => [i.id, i.total, i.amountDue]), Array.from({ length: 101 }, (_, n) => [`synthetic-glove-invoice-${n}`, n + 1, n]))
```

```js
assert.equal(discovery.items.length, 101)
```

```js
assert.equal(discovery.items.at(-1).id, 'synthetic-glove-item-100')
```

```js
assert.ok(h.xero.calls.some(c => c.path.endsWith('/Contacts') && c.query === '?page=3&pageSize=100'))
```

```js
assert.ok(h.xero.calls.some(c => c.path.endsWith('/Invoices') && c.query === '?page=2&pageSize=100'))
```

```js
assert.ok(h.xero.calls.filter(c => c.path.endsWith('/Items')).every(c => c.query === ''))
```

```js
assert.doesNotMatch(JSON.stringify(discovery), /excluded-/)
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
```

```js
assert.ok(h.xero.calls.every(c => c.method === 'GET'))
```

```js
assert.doesNotMatch(JSON.stringify(saved.results), /Contact 200|INV-100|SERVICE-100/)
```

```js
assertTrail(h, ['xero.discovered'])
```

```js
h.command('xero.map', { kind: 'customer', id: b.customer.id, version: b.customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'XERO_REVIEW' })
```

```js
assert.fail('archived contact')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.fail('inactive income account')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.fail('missing income mapping')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.fail('non-revenue tax')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.fail('duplicate link')
```

```js
assert.match(e.message, /XERO_MAPPING/)
```

```js
assert.deepEqual(review.missing, [])
```

```js
assert.deepEqual(review.links.map(l => [l.kind, l.remoteId]).sort((a, b) => a[1].localeCompare(b[1])), [['customer', 'synthetic-glove-contact-1'], ['service', 'synthetic-glove-item-1'], ['service', 'synthetic-glove-item-2']])
```

```js
assert.deepEqual(review.links.filter(l => l.kind === 'service').map(l => [l.accountCode, l.taxType, l.taxRate]), [['200', 'OUTPUT', 8.25], ['200', 'OUTPUT', 8.25]])
```

```js
assert.equal((await confirm(review.fingerprint)).reviewed, true)
```

```js
assert.equal((await h.state()).business[0].xeroInspection.linkReview.fingerprint, review.fingerprint)
```

```js
assert.deepEqual((await discover(h, b)).linkReview.missing, [], 'same tenant retains local links')
```

```js
assert.deepEqual((await discover(h, b)).linkReview.missing.map(r => r.kind), ['customer', 'service', 'service'])
```

```js
assert.ok(h.xero.calls.every(c => c.method === 'GET'))
```

```js
assertTrail(h, ['xero.mapped', 'xero.linksReviewed'])
```

```js
h.command('role.save', { name: 'Synthetic provider manager', permissions: ['xero.map'] }, { error: 'INPUT' })
```

```js
person.run(type, {}, { error: 'FORBIDDEN' })
```

```js
assert.equal(res.status, 403)
```

```js
assert.equal(signedOut.status, 401)
```

```js
assert.equal(h.xero.calls.length, callsBeforeRefusals)
```

```js
assert.equal(result.xeroLink, undefined)
```

```js
b.office.run('customer.save', { ...customer }, { error: 'STALE' })
```

```js
assert.doesNotMatch(JSON.stringify(stale), /xeroLink|synthetic-glove-contact-1/)
```

```js
assert.equal(res.status, 200)
```

```js
assert.doesNotMatch(await res.text(), /synthetic-glove-contact-1|synthetic-glove-item-1|xeroLink|xeroInspection|xero\.mapped/)
```

```js
assertTrail(h, ['xero.mapped'])
```

```js
assert.ok(trail.exported.timeline.some(e => e.kind === 'xero.mapped' && e.data.includes('synthetic-glove-contact-1')))
```

```js
assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-931|excluded-bank/)
```

```js
assert.equal(download.records.customers[0].xeroLink.remoteId, 'synthetic-glove-contact-1')
```

```js
assert.equal((await current(h, 'customers', live.id)).xeroLink, undefined)
```

```js
assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /synthetic-glove-contact-1/)
```

```js
h.command('xero.map', { kind: 'customer', id: live.id, version: live.version, remoteId: 'synthetic-glove-contact-1', confirm: true }, { error: 'ERASED' })
```

```js
h.command('xero.discover', { customerId: live.id }, { error: 'XERO_SETUP' })
```

```js
assert.equal(h.xero.calls.length, beforeMissingCredentials, 'retained links never recreate installation credentials')
```

```js
assert.deepEqual([result.riskClass, result.decision, result.allowed], ['provider-write', 'block', false])
```

```js
assert.equal(h.xero.calls.length, calls)
```

```js
assert.deepEqual((await h.state()).customers, before.customers)
```

```js
assert.deepEqual((await h.state()).invoices, before.invoices)
```

```js
assert.deepEqual((await h.state()).payments, [])
```

```js
assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_xero_operations').first('n'), 0)
```

```js
assert.equal((await h.command('xero.pull', {})).decision, 'block')
```

```js
assert.deepEqual(await h.command(action, {}).then(r => [r.allowed, r.decision]), [false, decision])
```

```js
assert.equal(h.xero.calls.length, calls)
```

```js
assert.equal(review.contacts[0].id, 'synthetic-glove-contact-1')
```

```js
assert.equal((await current(h, 'customers', b.customer.id)).xero, undefined)
```

```js
assert.equal((await current(h, 'customers', b.customer.id)).xeroLink.remoteId, 'synthetic-glove-contact-1')
```

```js
assertTrail(h, ['company.actionPolicy'])
```

```js
assert.ok(decisions.some(d => d.action === 'xero.pull' && d.riskClass === 'provider-write' && d.decision === 'approve' && d.allowed === false))
```

```js
assert.ok(trail.exported.timeline.some(e => e.kind === 'company.actionPolicy' && JSON.parse(e.data).decision === 'review'))
```

```js
assert.ok(h.xero.calls.every(c => c.method === 'GET'))
```

```js
assert.equal((await h.command('xero.pull', {})).allowed, false)
```

```js
assert.notEqual((await h.state()).business[0].xeroInspection.connectionId, connection)
```

```js
assert.equal((await h.command('xero.pull', {})).allowed, false)
```

### tests/api/pricebook.test.mjs

Assertions before: 145; assertions after: 145.

```js
assert.equal(rows.length, 201)
```

```js
assert.equal(previewed.committed, false)
```

```js
assert.deepEqual(previewed.preview.rows, { total: 200, new: 200, updated: 0, unchanged: 0, rejected: 0 })
```

```js
assert.deepEqual(previewed.preview.categories, [{ name: 'Parts', markupPercent: '50' }])
```

```js
assert.equal((await h.state()).services.length, before.services.length, 'the preview writes nothing')
```

```js
h.command('pricebook.import', { file, fingerprint: 'not-the-preview' }, { error: 'IMPORT_STALE' })
```

```js
assert.equal(s.services.length, before.services.length + 200)
```

```js
assert.deepEqual([item('P-001').unitCost, item('P-001').unitPrice], ['10.01', '15.02'], 'cost × 1.5, rounded half up to the cent')
```

```js
assert.deepEqual([item('P-150').unitCost, item('P-150').unitPrice], ['160.00', '240.00'])
```

```js
assert.deepEqual(item('P-001').parts, [{ supplier: 'Ferguson', partNumber: 'FG-1001' }, { supplier: 'Johnstone', partNumber: 'J-77' }])
```

```js
assert.deepEqual([valve.kind, valve.unitCost, valve.unitPrice, valve.description], ['task', '77.51', '349.00', 'Valve, fittings and labor, one price'], 'a task costs its labor and parts inside')
```

```js
assert.deepEqual(valve.components, [{ serviceId: item('LAB-HR').id, quantity: '1.5' }, { serviceId: item('P-001').id, quantity: '1' }])
```

```js
assert.equal(raised.items.length, 41)
```

```js
assert.deepEqual(['F-001', 'F-003', 'F-041'].map(c => item(c).unitPrice), ['21.00', '22.04', '63.00'])
```

```js
assert.deepEqual([item('P-001').unitPrice, item('LAB-HR').unitPrice], ['15.02', '120.00'])
```

```js
assert.deepEqual([item('P-001').unitPrice, item('TASK-1').unitCost, item('TASK-1').unitPrice], ['19.20', '79.50', '349.00'])
```

```js
assert.equal(picture.status, 200)
```

```js
assert.equal(Buffer.from(await picture.arrayBuffer()).toString('base64'), jpeg)
```

```js
assert.deepEqual(lines.map(l => [l.total, l.unitCost]), [['349.00', '79.50'], ['300.00', '45.00']])
```

```js
assert.deepEqual(quote.revisions[0].totals, { subtotal: '649.00', gst: '64.90', total: '713.90' })
```

```js
assert.ok(tech.services.every(x => x.unitCost === undefined && x.unitPrice === undefined), 'a technician reads neither price nor cost')
```

```js
assert.equal(res.status, 200)
```

```js
assert.deepEqual(again.preview.rows, { total: s.services.length, new: 0, updated: 0, unchanged: s.services.length, rejected: 0 })
```

```js
assert.deepEqual(again.preview.categories, [])
```

```js
assert.equal((await h.request('/api/glove/pricebook.csv', { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.equal(response.status, 200)
```

```js
assert.equal(response.headers.get('content-type'), 'image/jpeg')
```

```js
assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(jpeg, 'base64'))
```

```js
assert.deepEqual(item.checklist, checklist)
```

```js
assert.deepEqual(item.requiredSkills, [skill])
```

```js
assert.equal(item.images.length, 1)
```

```js
assert.equal(marked.unitPrice, '20.00')
```

```js
assert.equal(reviewed.committed, false)
```

```js
assert.deepEqual(reviewed.preview.rows, { total: 8, new: 1, updated: 1, unchanged: 2, rejected: 4 })
```

```js
assert.deepEqual(reviewed.preview.changes, [
    { row: 2, code: 'MX-UPDATE', status: 'updated', changes: ['name', 'unitCost', 'description', 'parts', 'unitPrice'] },
    { row: 5, code: 'MX-NEW', status: 'new', changes: [] },
  ], 'Code matches the existing item; only the listed fields differ, and rows 3 and 4 are unchanged')
```

```js
assert.deepEqual(reviewed.preview.rejected, [
    { row: 6, reason: 'Name: name is required (at most 200 characters).' },
    { row: 7, reason: 'Unit cost: unitCost must be a dollar amount such as 120 or 120.50.' },
    { row: 8, reason: 'Code: Code MX-UPDATE is already on row 2.' },
    { row: 9, reason: 'Task contents: Task contents name MX-MISSING, which is not in the price book or this file.' },
  ])
```

```js
assert.deepEqual(reviewed.preview.categories, [], 'rejected rows confer no category markup')
```

```js
assert.deepEqual(await domain(), beforeMixed, 'preview changes no domain record')
```

```js
h.command('pricebook.import', { file, fingerprint: reviewed.preview.fingerprint }, { error: 'IMPORT_STALE' })
```

```js
assert.deepEqual(await domain(), beforeMixed, 'changed file inputs cannot use the old preview')
```

```js
b.office.run('pricebook.import', { file: mixed, fingerprint: withdrawnReview.preview.fingerprint }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), beforeCommit, 'withdrawn Owner authority cannot commit an inspected preview')
```

```js
h.command('pricebook.import', { file: mixed, fingerprint: reviewed.preview.fingerprint }, { error: 'IMPORT_STALE' })
```

```js
assert.deepEqual(await domain(), beforeCommit)
```

```js
assert.notEqual(current.preview.fingerprint, reviewed.preview.fingerprint)
```

```js
assert.deepEqual(current.preview.changes, reviewed.preview.changes)
```

```js
person.run('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), beforeCommit)
```

```js
assert.equal(committed.committed, true)
```

```js
assert.deepEqual(committed.preview, current.preview, 'the committed plan is exactly the current preview')
```

```js
assert.match(newItem.id, /^[a-f0-9-]{36}$/)
```

```js
assert.ok(!beforeCommit.services.some(x => x.id === newItem.id))
```

```js
assert.deepEqual(newItem, {
    id: newItem.id, version: 1, createdAt: at, createdBy: owner.id,
    code: 'MX-NEW', name: 'New coupling', kind: 'material', category: 'Mixed', unit: 'each',
    unitCost: '6.25', pricing: 'fixed', unitPrice: '18.75', tax: 'GST', description: 'Replacement coupling',
    parts: [{ supplier: 'Supply house', partNumber: 'NEW-3' }], components: [], checklist: [], requiredSkills: [], archived: false,
  })
```

```js
assert.deepEqual(retained, { ...beforeCommit, services: [...beforeCommit.services.map(x => x.id === updated.id ? expectedUpdated : x), newItem].sort((a, b) => a.code.localeCompare(b.code)) }, 'all other identities, versions, evidence and customer records are unchanged')
```

```js
assert.deepEqual(await domain(), retained, 'actual Worker restart retains exact identities, values and versions')
```

```js
assert.deepEqual(await h.command('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { commandId }), committed)
```

```js
assert.deepEqual(await domain(), retained, 'replayed commit adds no items and changes no versions')
```

```js
b.office.run('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { commandId, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), retained, 'saved outcomes cannot bypass current authority')
```

```js
h.command('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { error: 'IMPORT_STALE' })
```

```js
assert.deepEqual(await domain(), retained)
```

```js
assert.deepEqual(repeat.preview.rows, { total: 8, new: 0, updated: 0, unchanged: 4, rejected: 4 })
```

```js
assert.deepEqual(repeat.preview.changes, [])
```

```js
assert.deepEqual(repeat.preview.rejected, reviewed.preview.rejected)
```

```js
assert.deepEqual(repeat.preview.categories, [])
```

```js
assert.equal(exported.status, 200)
```

```js
assert.deepEqual(row('MX-UPDATE'), ['MX-UPDATE', 'Inspect pump and valves', 'service', 'Mixed', '', 'visit', '15.25', 'fixed', '55.50', 'GST', 'Inspection with valve check', 'Supply house: NEW-2', '', 'no'])
```

```js
assert.deepEqual(row('MX-MARKUP'), ['MX-MARKUP', 'Marked coupling', 'material', 'Parts', '60', 'each', '12.50', 'markup', '20.00', 'GST', '', '', '', 'no'])
```

```js
assert.deepEqual(row('MX-SAME'), ['MX-SAME', 'Existing coupling', 'material', 'Mixed', '', 'each', '3.00', 'fixed', '8.25', 'FREE', '', '', '', 'no'])
```

```js
assert.deepEqual(row('MX-NEW'), ['MX-NEW', 'New coupling', 'material', 'Mixed', '', 'each', '6.25', 'fixed', '18.75', 'GST', 'Replacement coupling', 'Supply house: NEW-3', '', 'no'])
```

```js
assert.deepEqual(roundTrip.preview.rows, { total: retained.services.length, new: 0, updated: 0, unchanged: retained.services.length, rejected: 0 })
```

```js
assert.deepEqual(roundTrip.preview.changes, [])
```

```js
assert.deepEqual(roundTrip.preview.categories, [])
```

```js
assert.deepEqual(await domain(), retained, 'export and actual re-import change no domain records')
```

```js
assert.equal(await (await h.request('/api/glove/pricebook.csv')).text(), exportText)
```

```js
assert.equal(imported.length, 1)
```

```js
assert.deepEqual([imported[0].actorId, imported[0].actorName, imported[0].actorRole, imported[0].at, imported[0].subjectKind, imported[0].subjectId, imported[0].summary], [owner.id, 'Olivia Owner', 'owner', at, 'business', 'business', 'Price book CSV: 1 new, 1 updated, 2 unchanged, 4 rejected'])
```

```js
assert.deepEqual([entry.actor_id, entry.actor_name, entry.actor_role, entry.at, entry.command_id, entry.summary], [owner.id, 'Olivia Owner', 'owner', at, commandId, imported[0].summary])
```

```js
assert.deepEqual(download.services.toSorted((a, b) => a.code.localeCompare(b.code)), retained.services)
```

```js
assert.equal(rejected.committed, false)
```

```js
assert.deepEqual(rejected.preview.rows, { total: 2, new: 0, updated: 0, unchanged: 0, rejected: 2 })
```

```js
assert.deepEqual(rejected.preview.changes, [])
```

```js
assert.deepEqual(rejected.preview.categories, [])
```

```js
assert.deepEqual(rejected.preview.rejected, rows.map((row, i) => ({ row: i + 2, reason: row.startsWith('MAT,') ? 'Pricing: markup needs a category with a markup.' : 'Task contents: Task contents name MAT, which is not in the price book or this file.' })))
```

```js
assert.deepEqual(await domain(), beforeRejected, 'rejected dependency preview changes no records')
```

```js
assert.equal(committed.committed, true)
```

```js
assert.deepEqual(committed.preview, rejected.preview, 'commit applies exactly the two rejected rows without a dangling task')
```

```js
assert.deepEqual(await domain(), beforeRejected, 'rejected rows retain every unrelated record and version')
```

```js
assert.deepEqual(await h.command('pricebook.import', { file, fingerprint: rejected.preview.fingerprint }, { commandId }), committed)
```

```js
assert.deepEqual(await domain(), beforeRejected, 'restart and replay retain all records')
```

```js
assert.equal(await (await h.request('/api/glove/pricebook.csv')).text(), exportText)
```

```js
assert.notEqual(labor.id, material.id)
```

```js
assert.deepEqual(await figures(), [
      [labor.id, 'service', [], '0.01', '5.00'],
      [material.id, 'material', [], '0.01', '3.00'],
      [laborTask.id, 'task', laborContents, '0.01', '17.00'],
      [materialTask.id, 'task', materialContents, '0.01', '19.00'],
      [task.id, 'task', contents, '0.02', '42.00'],
    ], 'each distinct half-cent rounds up; rounding only the sum would yield one cent')
```

```js
assert.deepEqual(await figures(), [
      [labor.id, 'service', [], '0.03', '5.00'],
      [material.id, 'material', [], '0.01', '3.00'],
      [laborTask.id, 'task', laborContents, '0.02', '17.00'],
      [materialTask.id, 'task', materialContents, '0.01', '19.00'],
      [task.id, 'task', contents, '0.03', '42.00'],
    ], 'a service cost edit recalculates every dependent task without changing fixed prices')
```

```js
assert.deepEqual(await figures(), expected, 'a material cost edit rounds its own product before summation')
```

```js
h.command('service.save', { ...currentTask, unitPrice: '99.00', components: [{ serviceId: laborTask.id, quantity: '1' }] }, { error: 'INPUT' })
```

```js
assert.equal(nested.details.field, 'components')
```

```js
assert.deepEqual(await domain(), retained, 'a task-within-task edit preserves the exact retained task and other records')
```

```js
h.command('service.save', { ...currentTask, version: 0, unitPrice: '99.00' }, { error: 'STALE' })
```

```js
assert.deepEqual(await domain(), retained, 'stale task edits change nothing')
```

```js
person.run('service.save', { ...currentTask, unitPrice: '99.00' }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), retained, 'excluded roles cannot change task costs or prices')
```

```js
assert.deepEqual(await figures(), expected, 'actual Worker restart retains component identities, quantities, recalculated costs and fixed prices')
```

```js
assert.deepEqual(await domain(), retained)
```

```js
assert.deepEqual(await h.command('service.save', taskPayload, { commandId: creation.commandId }), creation.record)
```

```js
assert.deepEqual(await domain(), retained, 'replaying the original save cannot roll back current component costs')
```

```js
b.office.run('service.save', taskPayload, { commandId: creation.commandId, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), retained, 'replay still checks current authority')
```

```js
b.office.run('service.save', promotedPayload, { commandId: promotedCommandId, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), afterWithdrawal, 'withdrawn Owner authority cannot replay its prior authorized save')
```

```js
assert.deepEqual(await domain(), afterWithdrawal, 'restart retains the last authorized save and current role')
```

```js
b.office.run('service.save', promotedPayload, { commandId: promotedCommandId, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(), afterWithdrawal)
```

```js
assert.deepEqual(await figures(), expected)
```

```js
assert.equal(events.length, 1, 'save and replay retain one attributable event')
```

```js
assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.subjectKind, event.subjectId, event.summary], [actorId, actorName, 'owner', at, 'service', record.id, summary])
```

```js
assert.deepEqual([exported.actor_id, exported.actor_name, exported.actor_role, exported.at, exported.command_id, exported.subject_id, exported.summary], [actorId, actorName, 'owner', at, commandId, record.id, summary])
```

```js
assert.deepEqual(download.services.find(x => x.id === itemId), afterWithdrawal.services.find(x => x.id === itemId), 'business download retains exact task and component records')
```

```js
assert.equal(drafted.revisions[0].lines[0].unitCost, undefined, 'drafting prices grants no margin read')
```

```js
assert.equal((await exporter.run('quote.draft', payload, { commandId })).revisions[0].lines[0].unitCost, undefined, 'saved quote outcomes follow margin visibility too')
```

```js
exporter.run('quote.revise', { quoteId: drafted.id, version: 0, lines: payload.lines }, { error: 'STALE' })
```

```js
assert.equal(stale.details.record.revisions[0].lines[0].unitCost, undefined, 'stale quote error records do not expose costs')
```

```js
assert.equal(response.status, 200)
```

```js
assert.equal(response.status, 200)
```

```js
assert.ok(!catalogue.headers.includes('Unit cost'), 'restricted catalogue omits costs, rather than fabricating zero')
```

```js
assert.equal(item.Name, part.name)
```

```js
assert.equal(item.Price, '400.00')
```

```js
assert.equal(data.services.find(r => r.id === part.id).unitCost, undefined)
```

```js
assert.equal(data.quotes.find(r => r.id === quote.id).revisions[0].lines[0].unitCost, undefined)
```

```js
assert.equal(data.jobs.find(r => r.id === job.id).lines[0].unitCost, undefined)
```

```js
assert.deepEqual(data.purchaseOrders, [])
```

```js
assert.deepEqual(data.expenses, [])
```

```js
assert.ok(!data.timeline.some(e => ['purchaseOrder', 'expense', 'warning'].includes(e.subject_kind)))
```

```js
assert.equal(data.jobs.find(r => r.id === job.id).lines[0].unitPrice, '400.00')
```

```js
assert.ok(data.timeline.some(e => e.kind === 'job.created'), 'permitted business history remains exportable')
```

```js
assert.equal((await readCsv(as)).rows.find(r => r.Code === part.code)['Unit cost'], '137.29')
```

```js
assert.equal(data.services.find(r => r.id === part.id).unitCost, '137.29')
```

```js
assert.equal(data.quotes.find(r => r.id === quote.id).revisions[0].lines[0].unitCost, '137.29')
```

```js
assert.equal(data.jobs.find(r => r.id === job.id).lines[0].unitCost, '137.29')
```

```js
assert.equal(data.purchaseOrders[0].lines[0].unitCost, '137.29')
```

```js
assert.equal((await exporter.run('quote.draft', payload, { commandId })).revisions[0].lines[0].unitCost, '137.29', 'granting reports reveals the original retained cost on replay')
```

```js
assert.equal((await readCsv(exporter.cookie)).rows.find(r => r.Code === part.code)['Unit cost'], '137.29')
```

```js
assert.equal((await readExport(exporter.cookie)).services.find(r => r.id === part.id).unitCost, '137.29')
```

```js
assert.equal((await exporter.run('quote.draft', payload, { commandId })).revisions[0].lines[0].unitCost, undefined, 'removing reports hides retained quote costs again')
```

```js
assert.equal((await h.request(door, { as: exporter.cookie })).status, 403, 'reports.read alone grants no export')
```

### tests/api/purchasing.test.mjs

Assertions before: 135; assertions after: 135.

```js
b.dispatcher.run('po.save', order, { error: 'FORBIDDEN' })
```

```js
b.priyaPerson.run('po.save', order, { error: 'FORBIDDEN' })
```

```js
b.office.run('po.save', { ...order, lines: [{ serviceId: b.service.id, quantity: '1' }] }, { error: 'INPUT' })
```

```js
assert.deepEqual([po.number, po.status, po.lines.map(l => [l.code, l.quantity, l.unitCost, l.total]), po.total], ['PO-0001', 'draft', [['CAP-455', '4', '11.50', '46.00'], ['FLT-1620', '10', '6.00', '60.00']], '106.00'])
```

```js
b.office.run('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: po.lines[0].id, quantity: '1' }] }, { error: 'PO_STATE' })
```

```js
assert.deepEqual([po.status, po.sent], ['sent', { method: 'portal', reference: 'SC-88812', by: { id: b.office.id, name: 'Olu Office' }, at: '2026-10-21T01:00:00.000Z' }])
```

```js
b.office.run('po.save', { ...order, id: po.id, version: po.version }, { error: 'PO_STATE' })
```

```js
assert.ok((await timeline()).some(s => s.includes('recorded PO-0001 as sent to Supply Co by portal (supplier reference SC-88812); Glove sent nothing itself')))
```

```js
assert.equal(response.status, 200)
```

```js
person.run('po.receive', payload, { error, ...(commandId ? { commandId } : {}) })
```

```js
assert.deepEqual(await domain(), before, `${error} leaves orders, stock, movements, job evidence, cost and Activity unchanged`)
```

```js
assert.deepEqual([po.status, po.lines.map(l => l.received)], ['partly received', ['2', '0']])
```

```js
assert.equal(po.receipts.length, 1)
```

```js
assert.ok(firstReceipt.id)
```

```js
assert.deepEqual(firstReceipt, { id: firstReceipt.id, ...receipt([{ lineId: capLine.id, quantity: '2' }], '2026-10-21T02:00:00.000Z', 'First delivery') })
```

```js
assert.deepEqual(firstState.purchaseOrders.find(p => p.id === po.id), po)
```

```js
assert.deepEqual(firstState.stock.find(l => l.id === warehouse.id).counts, { [cap.id]: 2000 })
```

```js
assert.deepEqual(receiptMoves(firstState), [[warehouse.id, cap.id, '2', '2', po.id, job.id, firstReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T02:00:00.000Z']])
```

```js
assert.deepEqual([c.actual.purchases, c.actual.materials, c.actual.cost], ['23.00', '0.00', '23.00'])
```

```js
assert.deepEqual(c.actual.purchaseEntries.map(l => [l.poId, l.number, l.serviceId, l.received, l.unitCost, l.cost]), [[po.id, 'PO-0001', cap.id, '2', '11.50', '23.00']])
```

```js
assert.deepEqual(await domain(), firstDomain, 'the partly received order, exact stock, cost, receipt and movement survive restart')
```

```js
assert.deepEqual(await b.office.run('po.receive', firstPayload, { commandId: firstCommand }), po)
```

```js
assert.deepEqual(await domain(), firstDomain, 'first-receipt replay after restart creates no stock, cost, movement or event')
```

```js
refuse(b.office, firstPayload, 'STALE')
```

```js
refuse(b.office, { poId: po.id, version: po.version, lines: [{ lineId: capLine.id, quantity: '1' }, { lineId: filterLine.id, quantity: '11' }] }, 'OVER')
```

```js
refuse(b.office, { poId: po.id, version: po.version, lines: [{ lineId: capLine.id, quantity: '3' }] }, 'OVER')
```

```js
refuse(person, remainder, 'FORBIDDEN')
```

```js
refuse(b.office, remainder, 'FORBIDDEN')
```

```js
refuse(b.office, firstPayload, 'FORBIDDEN', firstCommand)
```

```js
assert.deepEqual([po.status, po.lines.map(l => l.received), po.receipts.length], ['received', ['4', '10'], 2])
```

```js
assert.ok(secondReceipt.id && secondReceipt.id !== firstReceipt.id)
```

```js
assert.deepEqual(po.receipts, [firstReceipt, { id: secondReceipt.id, ...receipt([{ lineId: capLine.id, quantity: '2' }, { lineId: filterLine.id, quantity: '10' }], '2026-10-21T03:00:00.000Z', 'Back order arrived') }])
```

```js
assert.deepEqual(s.purchaseOrders.find(p => p.id === po.id), po)
```

```js
assert.deepEqual(s.stock.find(l => l.id === warehouse.id).counts, { [cap.id]: 4000, [filter.id]: 10000 })
```

```js
assert.deepEqual(byItem(receiptMoves(s)), byItem([
    [warehouse.id, cap.id, '2', '2', po.id, job.id, firstReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T02:00:00.000Z'],
    [warehouse.id, cap.id, '2', '4', po.id, job.id, secondReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T03:00:00.000Z'],
    [warehouse.id, filter.id, '10', '10', po.id, job.id, secondReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T03:00:00.000Z'],
  ]))
```

```js
assert.deepEqual([c.actual.purchases, c.actual.materials, c.actual.cost], ['106.00', '0.00', '106.00'])
```

```js
assert.deepEqual(c.actual.purchaseEntries.map(l => [l.number, l.description, l.received, l.cost]), [['PO-0001', 'Run capacitor 45/5', '4', '46.00'], ['PO-0001', 'Filter 16x20', '10', '60.00']])
```

```js
assert.deepEqual(await domain(), finalDomain, 'both receipt identities and the exact final effects survive another Worker restart')
```

```js
assert.deepEqual(await b.office.run('po.receive', firstPayload, { commandId: firstCommand }), firstState.purchaseOrders.find(p => p.id === po.id), 'first replay returns its historical partly received outcome')
```

```js
assert.deepEqual(await b.office.run('po.receive', remainder, { commandId: secondCommand }), po)
```

```js
assert.deepEqual(await domain(), finalDomain, 'replaying both receipts cannot add any stock, cost, movement or Activity')
```

```js
refuse(b.office, remainder, 'STALE')
```

```js
refuse(b.office, { poId: po.id, version: po.version, lines: [{ lineId: filterLine.id, quantity: '1' }] }, 'PO_STATE')
```

```js
assert.deepEqual([c.actual.materialEntries.map(m => [m.quantity, m.fromPurchaseOrders, m.cost]), c.actual.materials, c.actual.cost], [[['5', '4', '12.00']], '12.00', '118.00'])
```

```js
assert.ok(history.entries.some(e => e.kind === 'purchase order' && e.label === `PO-0001 to Supply Co for ${job.number}` && e.status === 'received'))
```

```js
assert.deepEqual((await b.priyaPerson.state()).purchaseOrders, [])
```

```js
assertTrail(h, ['po.raised', 'po.revised', 'po.sent', 'po.received'])
```

```js
assert.deepEqual(exported.purchaseOrders.find(p => p.id === po.id), po)
```

```js
assert.deepEqual(receiptMoves(exported), receiptMoves(s), 'business download retains the receipt-linked stock movements')
```

```js
assert.deepEqual(activity.filter(e => e.kind === 'po.received').map(e => e.commandId).sort(), [firstCommand, secondCommand].sort())
```

```js
assert.equal(events.length, 1)
```

```js
assert.deepEqual([event.kind, event.subjectId, event.jobId, event.actorId, event.actorName, event.actorRole, event.at], [kind, po.id, job.id, b.office.id, 'Olu Office', 'office', at])
```

```js
assert.equal(kept.length, 1)
```

```js
assert.deepEqual([kept[0].kind, kept[0].subject_id, kept[0].job_id, kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].command_id, kept[0].at], [kind, po.id, job.id, b.office.id, 'Olu Office', 'office', commandId, at])
```

```js
assert.equal(h.outbound.attempts - providerAttempts, 0, 'outside-send recording, receiving, refusal, restart and replay make zero outbound provider attempts')
```

```js
person.run(type, payload, { error })
```

```js
assert.deepEqual(await snapshot(), before, `${type} ${error} has no purchasing or financial effect`)
```

```js
assert.equal(h.outbound.attempts, attempts)
```

```js
assert.deepEqual([fractional.number, fractional.supplier, fractional.supplierEmail, fractional.locationId, fractional.jobId, fractional.lines.map(l => [l.quantity, l.unitCost, l.total]), fractional.total],
    ['PO-0002', 'Synthetic supplier', '', van.id, job.id, [['1.125', '9.99', '11.24']], '11.24'])
```

```js
assert.equal((await cost()).actual.cost, '118.00', 'a draft adds no job cost')
```

```js
assert.equal((await cost()).actual.cost, '118.00', 'recording a send adds no job cost')
```

```js
assert.deepEqual([fractional.status, fractional.lines[0].received, (await h.state()).stock.find(l => l.id === van.id).counts, c.actual.purchases, c.actual.materials, c.actual.cost],
    ['partly received', '0.125', { [cap.id]: 125 }, '107.25', '10.50', '117.75'])
```

```js
assert.deepEqual([fractional.status, fractional.lines[0].received, fractional.receipts[1].lines, fractional.receipts[1].by],
    ['received', '1.125', [{ lineId, quantity: '1' }], { id: (await h.state()).actor.id, name: 'Olivia Owner' }])
```

```js
assert.deepEqual([c.actual.purchases, c.actual.materials, c.actual.cost], ['117.24', '0.00', '117.24'], 'received quantity across two orders covers captures once')
```

```js
assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: '2026-10-21T04:00:00.000Z' } })).status, 200)
```

```js
assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: '2026-10-21T04:01:00.000Z' } })).status, 200)
```

```js
assert.deepEqual(c.actual.materialEntries.map(m => [m.quantity, m.fromPurchaseOrders, m.unitCost, m.cost]),
    [['5', '5', '15.00', '0.00'], ['1', '0.125', '15.00', '13.13'], ['12', '10', '6.00', '12.00']])
```

```js
assert.deepEqual([c.actual.purchases, c.actual.materials, c.actual.cost], ['117.24', '25.13', '142.37'], 'only excess material uses the current catalogue cost, rounded half up')
```

```js
assert.deepEqual([bulk.number, bulk.jobId, bulk.lines.length, bulk.lines.every(l => l.quantity === '0.001' && l.unitCost === '6.00' && l.total === '0.01'), bulk.total], ['PO-0003', null, 50, true, '0.50'])
```

```js
assert.equal(bulk.status, 'received')
```

```js
assert.equal((await h.state()).stock.find(l => l.id === warehouse.id).counts[filter.id], 10050)
```

```js
assert.deepEqual(await cost(), beforeBulk)
```

```js
assert.deepEqual(await cost(), beforeBulk)
```

```js
assert.equal(otherCost.costing.actual.cost, '99.00')
```

```js
assert.deepEqual(history.entries.filter(e => e.kind === 'purchase order').map(e => [e.id, e.jobId, e.status]).sort(),
    [[original.id, job.id, 'received'], [fractional.id, job.id, 'received']].sort())
```

```js
assert.deepEqual(otherHistory.entries.filter(e => e.kind === 'purchase order').map(e => [e.id, e.jobId, e.status]), [[separate.id, anotherJob.id, 'received']])
```

```js
assert.deepEqual([po.sent.method, po.sent.reference, po.sent.messageId], [method, reference, undefined])
```

```js
assert.ok((await h.state()).events.some(e => e.kind === 'po.sent' && e.subjectId === po.id && e.summary.includes(`by ${method} (supplier reference ${reference}); Glove sent nothing itself`)))
```

```js
assert.deepEqual(outside.map(e => [e.channel, e.delivery]).sort(), [['phone', 'Not confirmed: sent outside Glove'], ['portal', 'Not confirmed: sent outside Glove']])
```

```js
assert.equal(sent.to, to)
```

```js
assert.ok(textOf(sent).includes(po.number) && textOf(sent).includes('Run capacitor 45/5'))
```

```js
assert.deepEqual(await b.office.run('email.send', payload, { commandId }), message)
```

```js
assert.equal(h.outbound.attempts, attempts, 'email command replay makes no second provider request')
```

```js
assert.equal((await h.state()).messageStates[message.id].status, 'accepted')
```

```js
assert.equal((await postEvents(h, providerEvent)).status, 200)
```

```js
assert.equal((await postEvents(h, providerEvent)).status, 200)
```

```js
assert.deepEqual([saved.status, saved.sent.method, saved.sent.to, saved.sent.messageId, s.messageStates[message.id].status], ['sent', 'email', to, message.id, outcome])
```

```js
assert.equal(s.messageStates[message.id].text, n ? `Bounced: ${to} did not accept it (reported by Postmark)` : `Delivered to ${to}'s mail server (reported by Postmark)`)
```

```js
assert.equal(queued.actorId, b.office.id)
```

```js
assert.ok(queued.summary.includes(`${po.number} to Synthetic supplier to ${to} through Postmark; delivery is not yet reported`))
```

```js
assert.deepEqual(await snapshot(), final, 'all order, receiving, cost and email facts persist across the actual Worker restart')
```

```js
assertTrail(h, ['po.raised', 'po.revised', 'po.sent', 'po.received', 'email.queued', 'email.accepted', 'email.delivered', 'email.bounced'])
```

```js
assert.deepEqual(exported.purchaseOrders.find(o => o.id === po.id), po)
```

```js
assert.deepEqual(Object.keys(result).sort(), ['id', 'version'], 'only the record identity and committed version acknowledge the write')
```

```js
assert.deepEqual(await receiver.run(type, payload, { commandId }), result, 'replay has the same restricted acknowledgement')
```

```js
receiver.run(command.type, command.payload, { error: 'STALE' })
```

```js
assert.deepEqual(stale.details.record, { id: po.id, version: po.version }, 'stale responses disclose no hidden purchase-order record')
```

```js
assert.equal(po.status, 'received')
```

```js
assert.equal(po.total, '274.58')
```

```js
assert.deepEqual((await receiver.state()).purchaseOrders, [])
```

```js
assert.ok(!(await receiver.state()).events.some(e => e.subjectKind === 'purchaseOrder'))
```

```js
assert.equal((await h.request(`/api/glove/jobs/${job.id}/cost`, { as: receiver.cookie })).status, 403)
```

```js
assert.equal((await h.state()).stock.find(l => l.id === warehouse.id).counts[material.id], 2000)
```

```js
assert.equal(cost.costing.actual.purchases, '274.58', 'redaction changes no stock or job-cost effect')
```

```js
assert.deepEqual(state.purchaseOrders, margins ? [po] : [], `${person.name} state follows current report access`)
```

```js
assert.equal(activity.events.some(e => e.kind === 'service.saved' && e.summary.includes('137.29')), margins, 'historical catalogue costs follow report access as purchase orders do')
```

```js
assert.equal(events.length, margins ? 5 : 0, `${person.name} Activity follows margin access`)
```

```js
assert.equal(timeline.events.filter(e => e.subjectKind === 'purchaseOrder').length, margins ? 5 : 0)
```

```js
assert.deepEqual(history.entries.filter(e => e.kind === 'purchase order').map(e => e.id), margins ? [po.id] : [])
```

```js
assert.equal(response.status, margins ? 200 : 403)
```

```js
assert.equal((await response.json()).costing.actual.purchases, '274.58')
```

```js
assert.equal(download.status, exportAllowed ? 200 : 403)
```

```js
assert.deepEqual(exported.purchaseOrders, margins ? [po] : [])
```

```js
assert.equal(exported.timeline.filter(e => e.subject_kind === 'purchaseOrder').length, margins ? 5 : 0)
```

```js
assert.ok(!JSON.stringify(exported).includes('137.29'), 'export permission alone exposes no supplier costs')
```

```js
assert.ok(!JSON.stringify({ state, activity, timeline, history }).includes('137.29'), 'no supplier cost in any permitted projection')
```

```js
assert.deepEqual(await h.state(), before, 'inspection changes no domain record or Activity')
```

```js
person.run(type, type === 'po.save' ? commands[0].payload : { poId: po.id, version: po.version, method: 'portal', lines: [{ lineId: po.lines[0].id, quantity: '1' }] }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal(h.outbound.attempts, attempts)
```

```js
assert.equal((await h.request(path, { as: '' })).status, 401)
```

```js
assert.deepEqual(priced, { id: expense.id, version: 2 })
```

```js
assert.deepEqual(await receiver.run('expense.price', expensePayload, { commandId: expenseCommandId }), priced)
```

```js
receiver.run('expense.price', expensePayload, { error: 'STALE' })
```

```js
assert.deepEqual(staleExpense.details.record, priced)
```

```js
assert.equal(replay.lines[0].unitCost, '137.29')
```

```js
assert.equal(replay.total, '274.58')
```

```js
assert.equal(replay.version, command.result.version, 'the historical outcome is retained')
```

```js
assert.equal((await receiver.state()).purchaseOrders[0].total, '274.58')
```

```js
assert.equal((await receiver.run('expense.price', expensePayload, { commandId: expenseCommandId })).amount, '42.00')
```

```js
assert.equal(full.lines[0].unitCost, '137.29')
```

```js
assert.deepEqual(await receiver.run('po.save', payload, { commandId }), { id: full.id, version: full.version }, 'a previously full outcome loses margin access immediately')
```

```js
assert.deepEqual(await receiver.run('expense.price', expensePayload, { commandId: expenseCommandId }), priced)
```

```js
receiver.run('po.save', payload, { commandId, error: 'FORBIDDEN' })
```

```js
assert.equal((await h.request('/api/glove/export', { as: receiver.cookie })).status, 403, 'revoking export authority applies to the next request')
```

### tests/api/money.test.mjs

Assertions before: 96; assertions after: 96.

```js
assert.equal((await h.state()).business[0].currency, 'USD')
```

```js
assert.ok(customer.taxExemption.certificate.fileId)
```

```js
assert.equal(missingQuote.revisions[0].totals.gst, '8.25')
```

```js
assert.deepEqual([totals.currency, totals.subtotal, totals.gst, totals.taxBreakdown[0].taxable], ['USD', '150.04', tax, taxable])
```

```js
assert.deepEqual(q.acceptance.totals, place.frozen)
```

```js
assert.deepEqual(job.totals, place.frozen)
```

```js
assert.deepEqual(invoice.revisions[0].totals, place.frozen)
```

```js
assert.equal(response.status, 200)
```

```js
assert.deepEqual(payload.CustomerRef, { value: 'customer-17' })
```

```js
assert.deepEqual(payload.TxnTaxDetail, { TxnTaxCodeRef: { value: 'tax-code-9' }, TotalTax: Number(tax) })
```

```js
assert.deepEqual(payload.Line.map(l => l.SalesItemLineDetail.TaxCodeRef.value), place === exempt ? ['NON', 'NON'] : place === z || place === w ? ['TAX', 'TAX'] : ['TAX', 'NON'])
```

```js
assert.equal(payload.CurrencyRef.value, 'USD')
```

```js
assert.equal((await h.request(`/api/glove/invoices/${invoices[0].id}/quickbooks.json`)).status, 400)
```

```js
assert.equal(bytes.status, 200)
```

```js
assert.equal(Buffer.from(await bytes.arrayBuffer()).toString('base64'), certificate.base64)
```

```js
assert.equal((await h.request(`/api/glove/files/${privateFileId}`, { as: westCrew.person.cookie })).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/files/${privateFileId}`, { as: branchOffice.cookie })).status, 404)
```

```js
assert.equal((await h.request(`/api/glove/invoices/${invoices[0].id}/quickbooks.json?customerRef=58&itemRef=41&taxCodeRef=7`, { as: branchOffice.cookie })).status, 404)
```

```js
branchOffice.run('customer.certificate', { customerId: exempt.customer.id, version: exempt.customer.version, file: certificate }, { error: 'NOT_FOUND' })
```

```js
branchOffice.run('tax.connect', { key: 'fixture-no-authority' }, { error: 'FORBIDDEN' })
```

```js
branchOffice.run('tax.lookup', { siteId: e.site.id }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual([lookup.proposal.rate, lookup.proposal.taxLabor], ['8.25', false])
```

```js
assert.equal(h.stripeTax.calls.length, 2)
```

```js
assert.equal(call.authorization, 'Bearer fixture-stripe-tax-credential')
```

```js
assert.equal(call.body['customer_details[address][line1]'], '10 Service St')
```

```js
assert.equal(call.body['line_items[0][amount]'], '10000')
```

```js
assert.ok(call.idempotencyKey)
```

```js
assert.ok(!JSON.stringify(call.body).includes(a.customer.id) && !JSON.stringify(call.body).includes(exempt.customer.taxExemption.certificateNumber))
```

```js
assert.equal((await h.command('tax.lookup', request)).proposal, null)
```

```js
assert.ok(exportedTrail.timeline.some(e => e.kind === kind && e.actor_id && e.at && e.command_id), `DATA-002 ${kind}`)
```

```js
assert.ok(!JSON.stringify(exportedTrail).includes('fixture-stripe-tax-credential'))
```

```js
assert.ok(activity.events.some(e => e.kind === kind), `DATA-002 Activity ${kind}`)
```

```js
assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), large)
```

```js
h.command('customer.certificate', { customerId: customer.id, version: uploaded.version, file: { mediaType: 'image/png', base64: large.toString('base64') } }, { error: 'INPUT' })
```

```js
assert.match(csv, /DocumentTaxAmount/)
```

```js
assert.equal(exported.currency, 'USD')
```

```js
assert.deepEqual(exported.taxBreakdown, place.frozen.taxBreakdown)
```

```js
assert.ok(csv.includes(place.frozen.taxBreakdown[0].jurisdiction))
```

```js
assert.ok(csv.includes(tax))
```

```js
assert.deepEqual([row('tx', null).tax, row('az', null).tax, row('county', east.id).tax, row('county', west.id).tax], ['16.50', '9.75', '4.50', '12.57'])
```

```js
assert.equal(narrowed.jurisdictions.length, 1)
```

```js
assert.deepEqual([narrowed.jurisdictions[0].branchId, narrowed.jurisdictions[0].tax], [east.id, '4.50'])
```

```js
assert.match(taxCsv, /Clark combined/)
```

```js
assert.match(taxCsv, /12\.57/)
```

```js
assert.ok(!taxCsv.includes('Wake combined'))
```

```js
assert.deepEqual((await h.state()).business[0].taxSettings, overlap)
```

```js
h.command('quote.draft', { customerId: selectionCustomer.id, siteId: site.id, title: 'Select the correct tax', lines: invoiceLines }, { error: 'TAX_JURISDICTION' })
```

```js
assert.equal(refusal.message, message)
```

```js
assert.deepEqual(after[key], before[key], `${address}: refused draft leaves ${key} unchanged`)
```

```js
mainCrew.person.run('site.save', { ...selectionSites[0], taxJurisdictionId: 'tx' }, { error: 'FORBIDDEN' })
```

```js
branchOffice.run('site.save', { ...selectionSites[0], taxJurisdictionId: 'tx' }, { error: 'NOT_FOUND' })
```

```js
branchOffice.run('quote.draft', { customerId: selectionCustomer.id, siteId: selectionSites[0].id, title: 'Wrong branch', lines: invoiceLines }, { error: 'FORBIDDEN' })
```

```js
branchOffice.run('business.save', { ...b, taxSettings: overlap }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(afterAuthority[key], beforeAuthority[key], `authority refusals leave ${key} unchanged`)
```

```js
assert.deepEqual(first.totals.taxBreakdown, [{ branchId: null, jurisdictionId: 'tx', jurisdiction: 'Austin combined', rate: '8.25', taxable: '100.01', tax: '8.25' }])
```

```js
assert.deepEqual([first.totals.subtotal, first.totals.gst, first.totals.total], ['150.04', '8.25', '158.29'])
```

```js
assert.equal(first.totals.taxContext.jurisdictionId, 'tx')
```

```js
assert.deepEqual(quote.revisions[0], first, 'a different explicit choice preserves the earlier approved revision')
```

```js
assert.deepEqual(second.totals.taxBreakdown, [{ branchId: null, jurisdictionId: 'az', jurisdiction: 'Phoenix combined', rate: '6.5', taxable: '150.04', tax: '9.75' }])
```

```js
assert.deepEqual([second.totals.subtotal, second.totals.gst, second.totals.total], ['150.04', '9.75', '159.79'])
```

```js
assert.equal(second.totals.taxContext.jurisdictionId, 'az')
```

```js
assert.equal(second.approval, null)
```

```js
assert.equal(choices.length, 3, 'site creation and both explicit choices are attributable')
```

```js
assert.deepEqual([e.actorId, e.actorName, e.actorRole, e.at], [afterAuthority.actor.id, 'Olivia Owner', 'owner', selectionTime])
```

```js
assert.ok(e.commandId)
```

```js
assert.deepEqual(restarted.quotes, beforeRestart.quotes, 'every quote remains unchanged after restart')
```

```js
assert.deepEqual(restarted.quotes.find(q => q.id === quote.id).revisions, quote.revisions, 'both revisions and their separate approval state survive restart')
```

```js
assert.deepEqual(restarted.sites.find(s => s.id === site.id), site, 'explicit site jurisdiction survives restart')
```

```js
assert.deepEqual(selectionActivity.events.find(x => x.id === e.id), e)
```

```js
assert.deepEqual([exported.actor_id, exported.actor_name, exported.actor_role, exported.at, exported.command_id, exported.subject_id], [e.actorId, e.actorName, e.actorRole, e.at, e.commandId, e.subjectId])
```

```js
assert.deepEqual([h.stripeTax.calls.length, h.avatax.calls.length], providerCalls, 'explicit tax selection makes no tax-provider request')
```

```js
office.run('tax.connect', { provider: 'avatax', key }, { error: 'FORBIDDEN' })
```

```js
office.run('tax.lookup', request, { error: 'FORBIDDEN' })
```

```js
h.command('tax.lookup', request, { error: 'TAX_PROVIDER' })
```

```js
assert.equal((await h.state()).business[0].avataxLookup.connected, true)
```

```js
assert.ok(!JSON.stringify(await h.state()).includes('fixture-avatax-license'))
```

```js
h.command('tax.lookup', { ...request, serviceTaxCode: 'not a code' }, { error: 'INPUT' })
```

```js
assert.deepEqual([exempt.proposal.rate, exempt.proposal.taxLabor, exempt.proposal.zips], ['8.25', false, ['78704']])
```

```js
assert.match(exempt.label, /proposal; review and apply/)
```

```js
assert.deepEqual((await h.state()).business[0].taxSettings, original, 'a lookup never applies itself')
```

```js
assert.equal(call.url, 'https://sandbox-rest.avatax.com/api/v2/transactions/create')
```

```js
assert.equal(call.authorization, `Basic ${Buffer.from('1100012345:fixture-avatax-license').toString('base64')}`)
```

```js
assert.deepEqual([call.body.type, call.body.commit, call.body.companyCode, call.body.customerCode, call.body.currencyCode], ['SalesOrder', false, 'PACHECO', 'glove-address-rate-lookup', 'USD'])
```

```js
assert.deepEqual(call.body.addresses, { singleLocation: { line1: '10 Service St', city: 'Austin', region: 'TX', postalCode: '78704', country: 'US' } })
```

```js
assert.deepEqual(call.body.lines.map(l => [l.taxCode, l.amount, l.quantity]), [['P0000000', 100, 1], ['SV060100', 100, 1]])
```

```js
assert.ok(!JSON.stringify(call.body).includes(secret))
```

```js
assert.deepEqual([taxed.proposal.rate, taxed.proposal.taxLabor], ['8.25', true])
```

```js
assert.deepEqual((await h.state()).business[0].taxSettings.jurisdictions.map(j => [j.rate, j.taxLabor]), [['8.25', true]])
```

```js
assert.equal(unavailable.proposal, null)
```

```js
assert.match(unavailable.label, /^Rate unavailable/)
```

```js
assert.notEqual(unavailable.parts.combined, '0')
```

```js
assert.equal(h.avatax.calls.at(-1).url, 'https://rest.avatax.com/api/v2/transactions/create')
```

```js
h.command('tax.lookup', request, { error: 'TAX_PROVIDER' })
```

```js
assert.ok(!JSON.stringify(exported).includes('fixture-avatax-license'))
```

```js
assert.ok(exported.timeline.some(e => e.kind === kind && /Avalara AvaTax/.test(e.summary) && e.command_id), `DATA-002 export ${kind}`)
```

```js
assert.ok(activity.events.some(e => e.kind === kind && /Avalara AvaTax/.test(e.summary)), `DATA-002 Activity ${kind}`)
```

### tests/api/servicecall.test.mjs

Assertions before: 65; assertions after: 65.

```js
assert.deepEqual([job.customerId, job.siteId, job.quoteId, job.quoteRevision, job.serviceCall], [b.customer.id, siteId, null, null, { enquiryId: request?.id ?? null, by: { id: person.id, name: person.name, role: person.role }, at }])
```

```js
assert.deepEqual(job.lines, priced ? expectedLines : [])
```

```js
assert.deepEqual(job.totals, priced ? { subtotal: '236.60', gst: '17.80', total: '254.40' } : { subtotal: '0.00', gst: '0.00', total: '0.00' })
```

```js
assert.deepEqual(job.checklist.map(({ id: _id, ...item }) => item), priced ? expectedChecklist : [])
```

```js
assert.deepEqual(job.forms.map(({ id: _id, ...form }) => form).sort((a, b) => a.formId.localeCompare(b.formId)), priced ? expectedForms : [])
```

```js
assert.ok(item.id && !itemIds.has(item.id), 'each job owns distinct checklist and form copies')
```

```js
assert.deepEqual(view.jobs.find(j => j.id === job.id), job)
```

```js
assert.deepEqual(won, { ...request, version: request.version + 1, status: 'won', stageAt: at, wonAt: at, wonJobId: job.id })
```

```js
assert.deepEqual(await person.run('job.create', payload, { commandId }), job, 'a repeated command returns its original job')
```

```js
assert.equal((await h.state()).jobs.filter(j => j.id === job.id).length, 1)
```

```js
assert.equal(response.status, 200)
```

```js
person.run('job.create', payload, { error, ...options })
```

```js
assert.deepEqual(await snapshot(), before, 'refusal changes no business record or timeline event')
```

```js
assert.deepEqual([s.quotes.find(x => x.id === q.id).jobId, s.jobs.find(x => x.id === job.id).quoteId, job.quoteRevision], [job.id, q.id, 1])
```

```js
assert.deepEqual(updated.checklist.map(({ id: _id, ...item }) => item), [{ label: 'New procedure', required: true }])
```

```js
assert.deepEqual(updated.forms, [])
```

```js
assert.deepEqual(await snapshot(), beforeRestart, 'actual Worker replacement retains the complete business export')
```

```js
assert.deepEqual(s.jobs.find(j => j.id === job.id), job, 'line values and ordered checklist and form copies survive edits and restart')
```

```js
assert.deepEqual(s.enquiries.find(e => e.id === request.id), { ...request, version: request.version + 1, status: 'won', stageAt: at, wonAt: at, wonJobId: job.id })
```

```js
assert.deepEqual(await person.run('job.create', payload, { commandId }), job)
```

```js
assert.deepEqual(await snapshot(), beforeRestart, 'reads and durable replay write nothing')
```

```js
assert.equal(activityResponse.status, 200)
```

```js
assert.equal(events.length, 1, 'creation and its replays retain just one attributable event')
```

```js
assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.jobId, event.subjectId], [person.id, person.name, person.role, at, job.id, job.id])
```

```js
assert.equal(kept.length, 1)
```

```js
assert.deepEqual([kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].at, kept[0].job_id, kept[0].subject_id], [person.id, person.name, person.role, at, job.id, job.id])
```

```js
assert.ok(event.summary.includes('created as a service call without a quote'))
```

```js
assert.deepEqual([data.serviceCall, data.enquiryId], [true, request?.id ?? null])
```

```js
assert.equal((await h.request('/auth/session/revoke', { method: 'POST', body: { sessionId: b.dispatcher.session.id } })).status, 204)
```

```js
assert.equal(response.status, 401)
```

```js
assert.deepEqual(await snapshot(), before)
```

```js
h.command('job.create', personalPayload, { commandId: 'synthetic-glove-506', error: 'ERASED' })
```

```js
h.command('job.create', { customerId: customer.id, siteId: otherSite.id, title: 'After erasure' }, { error: 'ERASED' })
```

```js
assert.deepEqual(await snapshot(), erased, 'neither a saved outcome nor new creation resurrects erased work')
```

```js
assert.deepEqual(await snapshot(), erased)
```

```js
assert.ok(anonymous.erasedAt)
```

```js
assert.ok(!JSON.stringify(erased).includes(value))
```

```js
assert.deepEqual([request.source, request.description], ['phone', 'Water heater leaking from the relief valve'])
```

```js
b.dispatcher.run('job.create', { enquiryId: request.id, title: 'Leaking water heater', lines: [{ description: 'Diagnostic fee', quantity: '1', unitPrice: '89.00', serviceId: diag.id }], siteId: (await h.command('site.save', { customerId: (await h.command('customer.save', { name: 'Someone else' })).id, address: '9 Other St' })).id }, { error: 'SITE' })
```

```js
assert.equal(job.quoteId, null)
```

```js
assert.deepEqual(job.lines.map(l => [l.serviceId, l.quantity, l.unitPrice]), [[diag.id, '1', '89.00']])
```

```js
assert.deepEqual([job.totals.total, job.serviceCall.enquiryId], ['97.90', request.id])
```

```js
assert.equal((await h.state()).enquiries.find(e => e.id === request.id).status, 'won')
```

```js
assert.ok((await timeline()).some(s => s.includes('service call without a quote') && s.includes('no price is approved until its invoice is')))
```

```js
assert.deepEqual([visit.jobId, visit.technicianId, visit.local.date, visit.status], [job.id, b.priya.id, today, 'booked'])
```

```js
assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: new Date(Date.parse(now) + minute++ * 60_000).toISOString() } })).status, 200)
```

```js
b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: now, kind: 'line', serviceId: tape.id, quantity: '1', approval: { customerName: 'Dr Mei Lin', method: 'signed' } }, { error: 'INPUT' })
```

```js
assert.deepEqual(afterMaterialLine.captures, beforeMaterialLine.captures, 'a refused material line saves no capture')
```

```js
assert.deepEqual(afterMaterialLine.visits, beforeMaterialLine.visits, 'a refused material line leaves the visit unchanged')
```

```js
b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: now, kind: 'line', serviceId: replace.id, quantity: '1', approval: { customerName: '', method: 'signed' } }, { error: 'INPUT' })
```

```js
assert.deepEqual([material.kind, material.serviceId, material.quantity], ['material', tape.id, '1'])
```

```js
assert.deepEqual(seen.captures.filter(x => x.visitId === visit.id && x.kind === 'line').map(x => [x.serviceId, x.quantity, x.approval]), [
    [replace.id, '1', { customerName: 'Dr Mei Lin', method: 'signed' }],
    [labor.id, '1.5', { customerName: 'Dr Mei Lin', method: 'verbal' }],
  ])
```

```js
assert.deepEqual(seen.captures.filter(x => x.visitId === visit.id && x.kind === 'material').map(x => x.id), [material.id])
```

```js
assert.ok(seen.jobs.find(j => j.id === job.id).lines.every(l => l.unitPrice === undefined), 'the technician reads no prices')
```

```js
assert.ok(seen.captures.filter(x => x.kind === 'line').every(x => x.unitPrice === undefined && x.approval.customerName === 'Dr Mei Lin'))
```

```js
b.priyaPerson.run('visit.capture', { visitId: quotedVisit.id, deviceTime: now, kind: 'line', serviceId: labor.id, quantity: '1', approval: { customerName: 'Dr Mei Lin', method: 'signed' } }, { error: 'QUOTED' })
```

```js
assert.deepEqual([officeCall.quoteId, officeCall.serviceCall.enquiryId, officeCall.lines.length, officeCall.serviceCall.by.name], [null, null, 0, 'Olu Office'])
```

```js
b.office.run('job.create', { quoteId: (await acceptedQuote(h, b)).id }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'completed')
```

```js
assert.deepEqual([invoice.status, rev.approval], ['draft', null])
```

```js
assert.deepEqual(rev.lines.map(l => [l.description, l.quantity, l.total]), [
    ['Diagnostic fee', '1', '89.00'],
    ['Valve replacement (flat rate) (added on site, approved by Dr Mei Lin)', '1', '285.00'],
    ['Plumbing labor (added on site, approved by Dr Mei Lin)', '1.5', '180.00'],
    ['Thread seal tape (used on site)', '1', '4.00'],
  ])
```

```js
assert.deepEqual(rev.totals, { subtotal: '558.00', gst: '55.80', total: '613.80' })
```

```js
assert.equal(approved.status, 'approved')
```

```js
assert.equal(approved.revisions[0].approval.id, b.office.id)
```

```js
assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'invoiced')
```

### tests/api/routing.test.mjs

Assertions before: 141; assertions after: 141.

```js
person.run('route.optimize', { date: day }, { error: 'FORBIDDEN' })
```

```js
assert.equal(queued.status, 'queued')
```

```js
assert.deepEqual((await h.state()).visits, before)
```

```js
assert.equal(ready.status, 'ready', JSON.stringify(ready))
```

```js
assert.equal(ready.moves.length, 12)
```

```js
assert.ok(ready.afterSeconds < ready.beforeSeconds)
```

```js
assert.equal(ready.savedSeconds, ready.beforeSeconds - ready.afterSeconds)
```

```js
assert.deepEqual((await h.state()).visits, before, 'even a completed proposal moves no visit')
```

```js
assert.ok(routeCalls.length > 0)
```

```js
assert.ok(routeCalls.every(c => !JSON.stringify(c.body).includes('Routing Ave') && !JSON.stringify(c.body).includes(b.customer.name)))
```

```js
assert.deepEqual(ready.moves.map(m => m.visitId).sort(), visits.map(v => v.id).sort())
```

```js
assert.deepEqual(proposed.map(v => `${v.technicianId}:${v.startAt}`).sort(), visits.map(v => `${v.technicianId}:${v.startAt}`).sort())
```

```js
assert.deepEqual(move.before, placement(visits.find(v => v.id === move.visitId)))
```

```js
assert.equal(signedOut.status, 401)
```

```js
assert.equal(integration.status, 403)
```

```js
assert.equal((await integration.json()).error.code, 'FORBIDDEN')
```

```js
custom.run(type, payload, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason }, { error: 'INPUT' })
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
assert.equal(calls(), beforeMissingReason, 'no provider request without a person’s reason')
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version - 1, reason: 'Old inspection' }, { error: 'STALE' })
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Role withdrawn during provider check' }, { error: 'AUTH' })
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Role is now viewer' }, { error: 'FORBIDDEN' })
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Branch withdrawn during provider check' }, { error: 'AUTH' })
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Now outside branch' }, { error: 'NOT_FOUND' })
```

```js
assert.ok(newLeg, 'the proposal has a newly proposed drive')
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Provider no longer offers that drive' }, { error: 'ROUTE_TRAVEL' })
```

```js
assert.ok(calls() > beforeInvalid, 'acceptance requested a fresh provider answer')
```

```js
assert.deepEqual(await effects(h), untouched)
```

```js
assert.deepEqual(await effects(h), untouched, 'no move is visible before the fresh provider reply')
```

```js
assert.equal(expectedSeconds, ready.afterSeconds + 45)
```

```js
b.office.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Less driving' }, { error: 'FORBIDDEN' })
```

```js
assert.equal(accepted.status, 'accepted')
```

```js
assert.equal(calls(), beforeAccepted + 1)
```

```js
assert.equal(accepted.acceptedSeconds, expectedSeconds)
```

```js
assert.equal(accepted.decidedAt, at)
```

```js
assert.deepEqual(accepted.decidedBy, { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' })
```

```js
assert.equal(accepted.reason, 'Keep customers in their windows with less driving')
```

```js
assert.equal(state.version, beforeVersion + 1, 'the route and all visit histories advance in one command commit')
```

```js
assert.equal(accepted.version, ready.version + 1)
```

```js
assert.ok(after.some(v => { const old = visits.find(x => x.id === v.id); return old && (old.startAt !== v.startAt || old.technicianId !== v.technicianId) }))
```

```js
assert.deepEqual(placement(visit), placement(next), `every accepted slot is retained for ${visit.id}`)
```

```js
assert.deepEqual(visit.assignments, moved ? [...old.assignments, { ...placement(next), by: accepted.decidedBy, at, reason: `Accepted route optimization: ${accepted.reason}`, reviewedConflicts: [], grantId: null }] : old.assignments)
```

```js
assert.equal(visit.version, old.version + (moved ? 1 : 0))
```

```js
assert.deepEqual(visit.arrivalWindow, original.arrivalWindow)
```

```js
assert.ok(visit.local.start >= visit.arrivalWindow.start && visit.local.start <= visit.arrivalWindow.end)
```

```js
assert.equal(Date.parse(visit.endAt) - Date.parse(visit.startAt), Date.parse(original.endAt) - Date.parse(original.startAt))
```

```js
assert.ok(tech.skills.includes(skill))
```

```js
assert.ok(tech.zips.includes(site.zip))
```

```js
assert.ok(previous.endAt <= visit.startAt)
```

```js
assert.ok(Date.parse(from.endAt) + leg.seconds * 1000 <= Date.parse(to.startAt), 'final route leaves real driving time')
```

```js
assert.deepEqual(replay, accepted)
```

```js
assert.deepEqual((await h.state()).visits, after)
```

```js
b.dispatcher.run('route.accept', { routeId: ready.id, version: accepted.version, reason: 'Already applied' }, { error: 'ROUTE_STATE' })
```

```js
assertTrail(h, ['route.queued', 'route.ready', 'route.accepted', 'visit.changed'])
```

```js
assert.deepEqual(applied.filter(e => e.kind === 'visit.changed').map(e => e.subjectId).sort(), changed.sort())
```

```js
assert.equal(applied.filter(e => e.kind === 'route.accepted').length, 1)
```

```js
assert.deepEqual([e.actorId, e.actorName, e.actorRole, e.at], [b.dispatcher.id, 'Sam Ortiz', 'dispatcher', at])
```

```js
assert.ok(e.summary.includes(accepted.reason))
```

```js
assert.deepEqual([exported.actor_id, exported.actor_name, exported.actor_role, exported.command_id, exported.at], [b.dispatcher.id, 'Sam Ortiz', 'dispatcher', 'accept-route-day-0001', at])
```

```js
assert.deepEqual(data.before, { technicianId: old.technicianId, ...old.local })
```

```js
assert.deepEqual(data.after, { technicianId: next.technicianId, ...next.local })
```

```js
assert.deepEqual([...data.visitIds].sort(), changed)
```

```js
assert.equal(data.driveSeconds, expectedSeconds)
```

```js
assert.deepEqual(await effects(h), retained)
```

```js
assert.deepEqual(await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: accepted.reason }, { commandId: 'accept-route-day-0001' }), accepted)
```

```js
assert.deepEqual(await effects(h), retained)
```

```js
assert.equal(calls(), callsBeforeRestart, 'replay after restart neither applies again nor calls Maps')
```

```js
assert.deepEqual((await b.priyaPerson.state()).routes, [])
```

```js
assertTrail(h, ['route.queued', 'route.ready', 'route.accepted', 'visit.changed'])
```

```js
assert.equal(route.status, 'ready')
```

```js
assert.equal(receipt.outcome, 'complete')
```

```js
assert.equal(runningBeforeErase.status, 'running')
```

```js
assert.equal(queued.status, 'queued')
```

```js
assert.equal(after.status, before.status === 'accepted' ? 'accepted' : 'discarded', `erasure closes undecided work and retains the decided outcome`)
```

```js
assert.deepEqual([after.date, after.branchId, after.technicianId, after.requestedBy, after.createdAt], [before.date, before.branchId, before.technicianId, before.requestedBy, before.createdAt])
```

```js
assert.equal(move.visitId, '[erased]')
```

```js
assert.equal(after.reason, 'Customer personal data erased; prepare a new route.')
```

```js
assert.deepEqual(erased.routes.find(r => r.id === peerRoute.id), peerRoute)
```

```js
assert.deepEqual(peerVisits, peerBefore, 'the unrelated customer retains exact appointments and histories')
```

```js
assert.equal(peerVisits.length, 2)
```

```js
assert.ok(peerVisits.every(v => erased.jobs.find(j => j.id === v.jobId).customerId === peer.id))
```

```js
assert.deepEqual((await h.state()).routes, erased.routes, 'late provider success cannot resurrect erased in-flight work')
```

```js
assert.equal(h.maps.calls.length, calls, 'erased queued work never reaches Maps')
```

```js
b.dispatcher.run('route.optimize', { date: route.date }, { commandId, error: 'ERASED' })
```

```js
b.dispatcher.run('route.accept', { routeId: closed.id, version: closed.version, reason: 'Erased route' }, { error: 'ROUTE_STATE' })
```

```js
assert.deepEqual((await h.state()).visits, peerVisits)
```

```js
assertTrail(h, ['privacy.erase'])
```

```js
assert.equal(move.visitId, '[erased]')
```

```js
assert.ok(!encoded.includes(visit.id), 'erased references are absent from routes and their trail')
```

```js
assert.deepEqual(await effects(h), retained)
```

```js
b.dispatcher.run('route.accept', { routeId: route.id, version: route.version, reason: 'Eligibility changed during provider check' }, { error: 'ROUTE_STALE' })
```

```js
assert.deepEqual(await effects(h), original, 'a changed dependency cannot commit even one move or assignment event')
```

```js
b.dispatcher.run('route.accept', { routeId: route.id, version: route.version, reason: 'Rebalance' }, { error: 'ROUTE_STALE' })
```

```js
assert.deepEqual((await h.state()).visits, unchanged)
```

```js
assert.equal(failed.status, 'failed')
```

```js
assert.match(failed.problem, /Google Maps/)
```

```js
assert.deepEqual((await h.state()).visits, unchanged)
```

```js
assert.ok(!JSON.stringify(failed).includes('synthetic-glove-7'))
```

```js
assert.equal(inspected.status, 'ready')
```

```js
b.dispatcher.run('route.accept', { routeId: inspected.id, version: inspected.version, reason: 'Day changed during provider check' }, { error: 'ROUTE_STALE' })
```

```js
assert.deepEqual(await effects(h), afterBooking, 'the new booking survives and none of the stale proposal moves or histories apply')
```

```js
assert.equal(reviewed.status, 'ready')
```

```js
b.dispatcher.run('route.accept', { routeId: reviewed.id, version: reviewed.version, reason: 'Provider unavailable' }, { error: 'MAPS' })
```

```js
assert.deepEqual(await effects(h), beforeRefusal)
```

```js
b.dispatcher.run('route.accept', { routeId: reviewed.id, version: reviewed.version, reason: 'Unusable provider answer' }, { error: 'MAPS' })
```

```js
assert.deepEqual(await effects(h), beforeRefusal)
```

```js
b.dispatcher.run('route.accept', { routeId: reviewed.id, version: reviewed.version, reason: 'Missing provider routes' }, { error: 'ROUTE_TRAVEL' })
```

```js
assert.deepEqual(await effects(h), beforeRefusal)
```

```js
person.run('route.discard', { routeId: reviewed.id, version: reviewed.version }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await effects(h), beforeRefusal)
```

```js
assert.equal(discarded.status, 'discarded')
```

```js
assert.deepEqual(discarded.decidedBy, { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' })
```

```js
assert.equal(discarded.decidedAt, at)
```

```js
assert.deepEqual(discarded.moves, reviewed.moves)
```

```js
assert.deepEqual(decided.visits, beforeRefusal.visits)
```

```js
assert.deepEqual(decided.events, beforeRefusal.events)
```

```js
assert.deepEqual(await b.dispatcher.run('route.discard', { routeId: reviewed.id, version: reviewed.version }, { commandId: 'discard-reviewed-route-0001' }), discarded)
```

```js
b.dispatcher.run('route.accept', { routeId: discarded.id, version: discarded.version, reason: 'Discarded proposal' }, { error: 'ROUTE_STATE' })
```

```js
assert.deepEqual(await effects(h), decided)
```

```js
assert.equal(h.maps.calls.length, callsBeforeDiscard)
```

```js
assert.deepEqual((await effects(h)).visits, decided.visits)
```

```js
assert.deepEqual((await effects(h)).events, decided.events)
```

```js
assert.equal(current.status, 'running')
```

```js
assert.deepEqual(await effects(h), discardedInFlight, 'late background result cannot replace the explicit discard')
```

```js
assert.deepEqual(discardedInFlight.visits, decided.visits)
```

```js
assert.deepEqual(discardedInFlight.events, decided.events)
```

```js
b.dispatcher.run('route.accept', { routeId: failed.id, version: failed.version, reason: 'Expired work' }, { error: 'ROUTE_STATE' })
```

```js
assert.equal(beforeExpiry.status, 'running')
```

```js
assert.equal(expired.status, 'failed')
```

```js
assert.match(expired.problem, /expired/)
```

```js
assert.equal(expired.finishedAt, '2026-11-03T00:01:00.000Z')
```

```js
assert.deepEqual(await effects(h), expiredEffects, 'late provider success cannot revive expired work')
```

```js
assert.deepEqual(expiredEffects.visits, decided.visits)
```

```js
assert.deepEqual(expiredEffects.events, decided.events)
```

```js
assert.deepEqual(await effects(h), retained)
```

```js
assertTrail(h, ['route.discarded', 'route.failed'])
```

### tests/api/merge.test.mjs

Assertions before: 19; assertions after: 19.

```js
assert.deepEqual(others.at(-1).duplicates.map(d => d.matches), Array(8).fill(['phone']))
```

```js
assert.equal(others.at(-1).duplicates.length, 8)
```

```js
assert.deepEqual(loner.duplicates, [])
```

```js
assert.equal(review.candidates.length, 8)
```

```js
assert.deepEqual(held[b.customer.id], { sites: 1, enquiries: 0, quotes: 1, jobs: 1, invoices: 1, payments: 0 })
```

```js
assert.equal((await h.request(`/api/glove/customers/${survivor.id}/duplicates`, { as: b.priyaPerson.cookie })).status, 403)
```

```js
assert.ok(after[kind].every(r => r.customerId === survivor.id || r.customerId === loner.id), `every ${kind} hangs off the survivor`)
```

```js
assert.deepEqual([kept.name, kept.email], ['Harbourview Dental', 'accounts@harbourview.example'])
```

```js
assert.ok(kept.contacts.some(c => c.name === 'Dr Mei Lin'), 'the merged contact person stays a contact')
```

```js
assert.ok(mergedIds.every(id => after.customers.find(c => c.id === id).mergedInto === survivor.id))
```

```js
assert.equal(after.invoices.find(i => i.id === invoice.id).customerId, survivor.id)
```

```js
b.dispatcher.run('customer.merge', { survivorId: survivor.id, mergedIds: [b.customer.id], versions: Object.fromEntries(after.customers.map(c => [c.id, c.version])) }, { error: 'MERGED' })
```

```js
assert.equal(after.jobs.find(j => j.id === job.id).customerId, b.customer.id)
```

```js
assert.equal(after.invoices.find(i => i.id === invoice.id).customerId, b.customer.id)
```

```js
assert.equal(after.sites.find(x => x.address === '22 Wharf Rd, Birchgrove').customerId, survivor.id)
```

```js
assert.ok(after.customers.every(c => !c.mergedInto))
```

```js
assert.equal(after.customers.find(c => c.id === survivor.id).name, 'Harbourview 1')
```

```js
b.dispatcher.run('customer.unmerge', { mergeId: again.id, version: again.version }, { error: 'CHANGED_SINCE' })
```

```js
assert.deepEqual(staged.preview.possibleDuplicates.map(d => [d.name, d.duplicates.map(x => [x.name, x.matches])]), [['Rozelle Physio', [['R. Physio', ['phone']]]]])
```

### tests/api/reminders.test.mjs

Assertions before: 212; assertions after: 212.

```js
assert.equal(rows.length, 1)
```

```js
assert.equal(connection.sms.enabled, false, 'a connection never enables outbound texts')
```

```js
b.office.run('reminder.configure', { enabled: false }, { error: 'FORBIDDEN' })
```

```js
h.command('reminder.configure', { version: (await h.state()).business[0].version, enabled: true, approved: false }, { error: 'CONSENT' })
```

```js
assert.match(preview.visitReminder, /stop automatic emails/)
```

```js
assert.equal((await h.state()).business[0].messageAutomation, undefined)
```

```js
assert.equal(policy.preview.visitReminder, `Bring access instructions for 2026-11-01 at 10:00.\n\nHarbour Air & Electrical\n1400 Synthetic Street, Austin TX 78701\nContact the office to confirm, reschedule, or stop automatic emails. Replies are handled by the office.`)
```

```js
h.command('reminder.configure', { version: policy.version, enabled: true, approved: true, templates: { ...templates, visitReminder: '{{secret}}' }, visitHours: [24], paymentDays: [], quoteDays: [] }, { error: 'INPUT' })
```

```js
assert.equal(h.email.sent.length, 0, 'a recorded address alone never consents')
```

```js
assert.equal(h.email.sent.length, 0, 'quiet hours hold confirmations')
```

```js
assert.equal(h.email.sent.length, 1)
```

```js
assert.equal(body(h.email.sent[0]), `Booked Harbourview Dental on ${day(2)} at 10:00 (UTC).\n\nHarbour Air & Electrical\n1400 Synthetic Street, Austin TX 78701\nContact the office to confirm, reschedule, or stop automatic emails. Replies are handled by the office.`)
```

```js
assert.equal((await messages(h, 'visitReminder')).length, 1)
```

```js
assert.match(body(h.email.sent.at(-1)), /Bring access instructions/)
```

```js
assert.equal((await messages(h, 'visitReminder')).length, 2)
```

```js
assert.equal(h.email.sent.length, 3, 'replaying cron does not resend')
```

```js
b.office.run('visit.replyLink', { visitId: visit.id, version: visit.version }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual([visibleVisit.visit.date, visibleVisit.visit.start], [visit.local.date, visit.local.start])
```

```js
assert.ok(!JSON.stringify(visibleVisit).includes(b.customer.email))
```

```js
assert.ok(!JSON.stringify(visibleVisit).includes(b.site.address))
```

```js
assert.equal(requestReply.status, 200, await requestReply.clone().text())
```

```js
assert.equal((await publicReply('POST', { action: 'reschedule' })).status, 200)
```

```js
assert.equal((await publicReply('POST', { action: 'confirm' })).status, 409)
```

```js
assert.equal(requested.length, 1, 'a replay opens no duplicate reschedule request')
```

```js
assert.equal(requested[0].status, 'new')
```

```js
assert.equal(responded.visits.find(v => v.id === visit.id).startAt, visit.startAt, 'a request never changes the booking')
```

```js
assert.ok(responded.events.some(e => e.kind === 'visit.customer.reschedule' && e.jobId === job.id))
```

```js
assert.ok(!JSON.stringify(await (await h.request('/api/glove/export')).json()).includes(replyToken))
```

```js
assert.deepEqual(await h.command('visit.replyLink', { visitId: visit.id, version: visit.version }, { commandId: replyId }), issued, 'recovery never sends another link')
```

```js
assert.equal((await messages(h, 'moved')).length, 1)
```

```js
assert.equal((await publicReply()).status, 404, 'a changed schedule invalidates the old response credential')
```

```js
assert.equal((await messages(h, 'cancelled')).length, 1)
```

```js
assert.equal(h.email.sent.length, count, 'cancelled visit has no later reminders')
```

```js
assert.equal((await messages(h, 'confirmation')).length, 2)
```

```js
assert.equal((await postEvents(h, { raw: JSON.stringify(delivery), headers: {} })).status, 401)
```

```js
assert.equal((await postEvents(h, signer.signed(delivery, { at: timestamp }))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[first.id].status, 'delivered')
```

```js
assert.equal((await publicReply('POST', { action: 'confirm' }, confirmToken)).status, 200)
```

```js
assert.equal(assessmentVisit.customerResponses[0].action, 'confirm')
```

```js
assert.equal((await publicReply('GET', undefined, confirmToken)).status, 404, 'withdrawal closes the reply door immediately')
```

```js
assert.equal(h.email.sent.length, count + 2, 'withdrawal suppresses assessment reminder')
```

```js
b.office.run('report.link', { reportId: report.id, email: true }, { error: 'FORBIDDEN' })
```

```js
assert.equal(reportLink.token, undefined, 'an emailed report credential is not exposed in the command response')
```

```js
assert.ok(body(reportMail).startsWith(`Completed Service visit on ${day(5)}: your report is ready.`))
```

```js
assert.match(body(reportMail), /stop automatic emails/)
```

```js
assert.equal(receivedReport.status, 200)
```

```js
assert.equal((await receivedReport.json()).report.summary, 'synthetic-glove-2 completed work')
```

```js
assert.deepEqual(await h.command('report.link', reportPayload, { commandId: reportCommand }), reportLink)
```

```js
assert.equal(h.email.sent.length, sentCount)
```

```js
assert.equal((await h.state()).messageStates[reportMessage.id].status, 'accepted')
```

```js
assert.equal((await postEvents(h, signer.signed(reportEvent, { at: reportEvent[0].timestamp }))).status, 200)
```

```js
assert.ok(reportTimeline.some(e => e.kind === 'email.delivered' && e.subjectId === reportMessage.id))
```

```js
assert.ok(reportStream.some(e => e.id === `email:${reportMessage.id}` && /delivered/i.test(e.delivery)))
```

```js
assert.ok(!JSON.stringify(privateExport).includes(reportToken))
```

```js
assert.ok(privateExport.timeline.some(e => e.kind === 'email.delivered' && e.subject_id === reportMessage.id))
```

```js
assertTrail(h, ['visit.replyLink.sent', 'visit.customer.reschedule', 'visit.customer.confirm', 'report.link.created', 'email.accepted'])
```

```js
assert.equal(h.twilio.calls.length, 0, 'customer-local quiet hours hold customer texts')
```

```js
assert.equal(h.twilio.calls.length, 0, '07:00 in the recorded customer zone stays quiet even while the UTC branch is open')
```

```js
assert.equal(confirmations.length, 1)
```

```js
assert.equal(firstText.body.Body, `Booked Harbourview Dental on ${day(6)} at 12:00 (UTC).\n\nHarbour Air & Electrical\nReply CONFIRM to confirm or RESCHEDULE to ask the office for another time.\nReply STOP to stop texts, HELP for help, START to request texts again.`)
```

```js
assert.equal(h.twilio.calls.length, textCount)
```

```js
assert.equal((await postSms(h, invalidDelivery)).status, 401)
```

```js
assert.equal((await h.state()).events.length, eventsBefore, 'unauthenticated text callbacks write no business fact')
```

```js
assert.equal((await postSms(h, delivered())).status, 200)
```

```js
assert.equal((await postSms(h, delivered())).status, 200)
```

```js
assert.equal((await h.state()).messageStates[confirmations[0].id].status, 'delivered')
```

```js
assert.ok(otherText, 'the due reminder is a separate text attempt')
```

```js
assert.equal((await postSms(h, failed())).status, 200)
```

```js
assert.equal((await postSms(h, failed())).status, 200)
```

```js
assert.equal((await h.state()).messageStates[failedMessage.id].status, 'failed')
```

```js
assert.ok(textStream.some(e => e.channel === 'text message' && e.direction === 'outbound' && e.author && /delivered/i.test(e.delivery)))
```

```js
assert.equal((await postSms(h, reschedule())).status, 200)
```

```js
assert.equal((await postSms(h, reschedule())).status, 200)
```

```js
assert.equal(smsState.enquiries.filter(e => e.visitId === smsVisit.id && e.source === 'text').length, 1)
```

```js
assert.equal(smsState.visits.find(v => v.id === smsVisit.id).startAt, smsVisit.startAt)
```

```js
assert.ok(replyStream.some(e => e.channel === 'text message' && e.direction === 'inbound' && e.jobId === smsJob.id && e.kind === 'text reply: reschedule' && e.author))
```

```js
assert.equal((await postSms(h, stop())).status, 200)
```

```js
assert.equal((await postSms(h, stop())).status, 200)
```

```js
assert.equal(stoppedCustomer.smsOptOut.blocked, true)
```

```js
assert.equal(stoppedCustomer.automaticSms.visits.enabled, false)
```

```js
assert.equal(h.twilio.calls.length, beforeStoppedTick)
```

```js
assert.equal(pushed.skippedDoNotContact, 1)
```

```js
assert.equal(h.marketing.length, 0)
```

```js
assert.equal((await postSms(h, h.twilio.inbound(h.origin, '+13125550123', 'START'))).status, 200)
```

```js
assert.equal(restarted.smsOptOut.blocked, false)
```

```js
assert.equal(restarted.automaticSms.visits.enabled, false, 'START never manufactures fresh purpose consent')
```

```js
assertTrail(h, ['sms.queued', 'sms.accepted', 'sms.delivered', 'sms.failed', 'sms.received.reschedule', 'sms.received.stop', 'sms.received.start'])
```

```js
assert.ok(smsExport.timeline.some(e => e.kind === 'sms.delivered'))
```

```js
assert.ok(smsExport.timeline.some(e => e.kind === 'visit.customer.reschedule'))
```

```js
assert.ok(!JSON.stringify(smsExport).includes(h.twilio.authToken))
```

```js
assert.equal((await publicReply('GET', undefined, confirmToken)).status, 404)
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_visit_reply_secrets').first()).n, 0)
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_attempts').first()).n, 0)
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_receipts').first()).n, 0)
```

```js
assert.equal((await h.request('/api/glove/public/reports', { as: '', headers: { authorization: `Bearer ${reportToken}` } })).status, 404)
```

```js
assert.ok(privateExport.timeline.some(e => e.kind === 'email.delivered'))
```

```js
assert.equal(h.email.sent.length, 2)
```

```js
assert.ok(h.email.sent.every(m => !/https?:|checkout|token=/i.test(body(m))), 'no checkout link or stored session reused')
```

```js
assert.equal((await messages(h, 'paymentReminder')).filter(m => m.subjectId === first.id).length, 1)
```

```js
assert.equal((await messages(h, 'paymentReminder')).filter(m => m.subjectId === second.id).length, 2)
```

```js
assert.match(JSON.stringify(report), /2 reminder steps reserved/)
```

```js
b.office.run('invoice.dispute', { invoiceId: inv.id, version: inv.version, disputed: true, reason: 'Question about work' }, { error: 'FORBIDDEN' })
```

```js
assert.equal(h.email.sent.length, 3)
```

```js
assert.match(JSON.stringify(disputed), /Stopped: invoice disputed/)
```

```js
assertTrail(h, ['invoice.dispute', 'email.queued', 'email.accepted'])
```

```js
assert.equal(h.email.sent.length, 0)
```

```js
assert.equal(h.email.sent.length, 3)
```

```js
assert.equal(h.email.sent.length, 5)
```

```js
assert.equal(h.email.sent.length, 6)
```

```js
assert.equal(h.email.sent.length, 6)
```

```js
assert.deepEqual(quotes.map(q => sent.filter(m => m.subjectId === q.id).length), [3, 1, 2])
```

```js
assert.deepEqual(quotes.map(q => textSteps.filter(m => m.subjectId === q.id).length), [3, 1, 2])
```

```js
assert.ok(h.twilio.calls.every(c => !c.body || c.body.Body.endsWith('Reply STOP to stop texts, HELP for help, START to request texts again.')))
```

```js
assert.deepEqual(quotes.map(q => taskQuotes.find(r => r.id === q.id).followupTasks.length), [3, 1, 2])
```

```js
assert.ok(taskQuotes.find(q => q.id === quotes[1].id).followupTasks.every(t => t.status === 'stopped'))
```

```js
assert.ok(taskQuotes.find(q => q.id === quotes[2].id).followupTasks.every(t => t.status === 'stopped'))
```

```js
assert.ok((await h.state()).events.some(e => e.kind === 'quote.followupTask'))
```

```js
assert.ok(h.email.sent.every(m => /\/email-preferences#token=gle_/.test(body(m)) && body(m).includes('1400 Synthetic Street, Austin TX 78701') && !body(m).includes('/quote#token=')), 'each quote follow-up has the mandatory unsubscribe link and postal address, never a quote bearer')
```

```js
assert.equal((await preference()).status, 200)
```

```js
assert.equal((await h.state()).events.length, beforeRead, 'opening an unsubscribe link never changes consent')
```

```js
assert.equal(withdrawal.status, 200, await withdrawal.clone().text())
```

```js
assert.equal((await preference('POST', { stop: true })).status, 200)
```

```js
assert.equal((await h.state()).customers.find(c => c.id === b.customer.id).automaticEmail.quotes.enabled, false)
```

```js
assert.equal(h.email.sent.length, 6, 'withdrawal stops a later still-valid unanswered quote step')
```

```js
assert.ok((await h.state()).quotes.find(q => q.id === quotes[0].id).followupTasks.every(t => t.status === 'stopped'), 'expiry retires pending call tasks even when no new message is due')
```

```js
assert.ok(!JSON.stringify(exported).includes(customer.email))
```

```js
assert.equal(h.email.sent.length, 6)
```

```js
assert.equal(h.email.sent.length, 0, 'consent is bound to the recorded address')
```

```js
assert.equal(h.email.sent.length, 1)
```

```js
assert.equal((await h.state()).messageStates[queued.id].status, 'uncertain')
```

```js
assert.equal(h.email.sent.length, 1, 'an uncertain send stays uncertain')
```

```js
assert.equal(h.email.sent.length, 1, 'owner switch stops the pending reminder')
```

```js
assert.equal(h.email.sent.length, 1, 'the already-started provider request cannot be recalled')
```

```js
assert.ok(!JSON.stringify(exported).includes(b.customer.email), 'provider response does not restore an erased address')
```

```js
assert.equal((await h.state()).messages.length, 0)
```

```js
assert.ok(!JSON.stringify(smsExport).includes('+13125550123'))
```

```js
assert.equal((await sms.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_attempts').first()).n, 0)
```

```js
assert.equal((await sms.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_receipts').first()).n, 0)
```

```js
assert.equal((await sms.state()).messages.length, 0)
```

```js
assert.equal((await postSms(sms, lateDelivery)).status, 200)
```

```js
assert.equal((await sms.state()).messages.length, 0, 'a late signed callback never restores an erased SMS message')
```

```js
b.office.run('review.configure', { ...config, version: (await h.state()).business[0].version }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await h.state()).business[0].address, config.postalAddress)
```

```js
b.office.run('review.consent', { customerId: customer.id, version: customer.version, enabled: true, reference: 'Unauthorized permission' }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await request(first.jobId)).sent, false, 'Unpaid job is never asked')
```

```js
assert.equal(h.email.sent.length, 0, 'No automatic outbound action')
```

```js
assert.deepEqual((await h.state()).reviewJobs.filter(j => [first.jobId, second.jobId].includes(j.id)).map(j => ({ workReady: j.workReady, reason: j.reason })), [{ workReady: true, reason: null }, { workReady: true, reason: null }])
```

```js
assert.deepEqual((await h.state()).reviewJobs.find(j => j.id === unfinished.id), { id: unfinished.id, workReady: false, reason: 'job must be complete and paid' })
```

```js
assert.equal((await request(unfinished.id)).reason, 'job must be complete and paid', 'A paid progress invoice does not make unfinished work eligible')
```

```js
assert.equal((await request(first.jobId)).reason, 'disabled')
```

```js
h.command('review.request', { jobId: first.jobId }, { error: 'STALE' })
```

```js
h.command('review.request', { jobId: first.jobId, confirmation: confirmed }, { error: 'STALE' })
```

```js
h.command('review.request', { jobId: first.jobId, confirmation: confirmed }, { error: 'STALE' })
```

```js
h.command('review.request', { jobId: first.jobId, confirmation: confirmed }, { error: 'STALE' })
```

```js
h.command('review.request', { jobId: first.jobId, confirmation: { ...confirmed, address: b.customer.email } }, { error: 'STALE' })
```

```js
assert.equal(h.email.sent.length, beforeConfirmation, 'Stale or absent confirmation never reaches the provider')
```

```js
assert.equal((await messages(h, 'reviewRequest')).length, 0, 'Stale confirmation creates no message and consumes no customer period')
```

```js
assert.equal(sent.sent, true)
```

```js
assert.equal((await request(second.jobId)).reason, 'period already requested')
```

```js
assert.equal(h.email.sent.length, 1)
```

```js
assert.equal((await h.state()).reviewJobs.find(j => j.id === second.jobId).reason, 'period already requested')
```

```js
assert.ok(deliveredText.startsWith(config.template + '\n' + config.url))
```

```js
assert.match(deliveredText, /Stop review requests/)
```

```js
assert.ok(deliveredText.includes(config.postalAddress))
```

```js
assert.equal((await postEvents(h, signer.signed([{ rer_delivery_id: message.id, email: message.to, event: 'delivered', timestamp: Date.parse(fixed) / 1000, sg_event_id: 'synthetic-glove-802', sg_message_id: 'sg-receipt-1.filter' }], { at: Date.parse(fixed) / 1000 }))).status, 200)
```

```js
assertTrail(h, ['review.configure', 'review.consent', 'review.skipped', 'email.queued', 'email.accepted', 'email.delivered'])
```

```js
assert.ok(reviewActivity.find(e => e.kind === 'review.consent').actorRole === 'owner')
```

```js
assert.equal(reviewExport.customers.find(c => c.id === customer.id).automaticEmail.reviews.reference, 'Explicit in-person permission for review email')
```

```js
assert.equal(reviewExport.customers.find(c => c.id === customer.id).automaticEmail.reviews.at, fixed)
```

```js
assert.ok(jobHistory.includes(message.id) && jobHistory.includes('email.delivered'))
```

```js
assert.equal((await h.state()).messageStates[message.id].status, 'delivered')
```

```js
assert.ok(customerHistory.includes(message.id) && /delivered/i.test(customerHistory))
```

```js
assert.ok(exported.includes(message.id))
```

```js
assert.ok(exported.includes('sg-receipt-1'))
```

```js
assert.ok(!exported.includes(token))
```

```js
assert.equal(stop.status, 200)
```

```js
assert.equal((await request(second.jobId)).sent, false, 'Opted-out customer is never asked after the period')
```

```js
assert.equal(h.email.sent.length, 1)
```

```js
h.command('review.consent', { customerId: customer.id, version: (await h.state()).customers.find(c => c.id === customer.id).version, enabled: true, address: customer.email, reference: 'Permission confirmed before the address changed' }, { error: 'STALE' })
```

```js
assert.equal(h.email.sent.length, 1, 'Stale address confirmation sends nothing')
```

```js
assert.equal((await request(second.jobId)).reason, 'no current review-email consent')
```

```js
assert.equal((await h.state()).reviewJobs.find(j => j.id === second.jobId).reason, 'no current review-email consent')
```

```js
b.office.run('review.request', { jobId: second.jobId }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await h.state(b.office.cookie)).reviewJobs, undefined)
```

```js
limitedOwner.run('review.request', { jobId: second.jobId }, { error: 'FORBIDDEN' })
```

```js
limitedOwner.run('review.configure', { ...config, version: (await h.state()).business[0].version }, { error: 'FORBIDDEN' })
```

```js
limitedOwner.run('review.consent', { customerId: customer.id, version: (await h.state()).customers.find(c => c.id === customer.id).version, enabled: true, reference: 'Forbidden' }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await limitedOwner.state()).reviewJobs, undefined)
```

```js
person.run(type, payload, { error: 'FORBIDDEN' })
```

```js
assert.equal((await person.state()).reviewJobs, undefined)
```

```js
assert.equal(refused.status, 403)
```

```js
assert.equal((await refused.json()).error.code, 'FORBIDDEN')
```

```js
assert.equal(tokenView.status, 200)
```

```js
assert.equal((await tokenView.json()).reviewJobs, undefined)
```

```js
assert.equal(signedOut.status, 401)
```

```js
assert.equal(h.email.sent.length, 1, 'Address changes and unauthorized requests never reach the provider')
```

```js
assert.equal(attempt.sent, true, 'Explicit request queues one attempt, not a delivery claim')
```

```js
assert.equal((await h.state()).messageStates[attempt.messageId].status, expected)
```

```js
assert.equal((await postEvents(h, signer.signed([{ rer_delivery_id: message.id, email: message.to, event: 'bounce', timestamp: Date.parse(instant) / 1000, sg_event_id: 'synthetic-glove-803', sg_message_id: `sg-receipt-${before + 1}.filter` }], { at: Date.parse(instant) / 1000 }))).status, 200)
```

```js
assert.equal((await h.state()).messageStates[attempt.messageId].status, 'bounced')
```

```js
assert.equal(attemptState.status, ['rejected', 'rate_limited', 'uncertain', 'bounced'][index])
```

```js
assert.match(attemptState.next, /used the customer review period/)
```

```js
assert.match(attemptState.next, /will not retry/)
```

```js
assert.doesNotMatch(attemptState.next, new RegExp('send again|sending again', 'i'))
```

```js
assert.equal((await request(first.jobId)).reason, 'period already requested')
```

```js
assert.equal(h.email.sent.length, before + 1, `${expected} consumes the period and is never automatically retried`)
```

```js
assert.ok(exported.includes(attempt.messageId) && exported.includes(`email.${expected}`))
```

```js
assert.ok(!exported.includes(JSON.stringify('synthetic-glove-1')) && !/#token=gle_|gle_[A-Za-z0-9_-]{43}/.test(exported), 'Attempt history excludes credentials and unsubscribe bearers')
```

```js
assert.equal((await postEvents(h, signer.signed([{ rer_delivery_id: lastReview.id, email: lastReview.to, event: 'spamreport', timestamp: complaintAt, sg_event_id: 'synthetic-glove-804', sg_message_id: `sg-receipt-${h.email.sent.length}.filter` }], { at: complaintAt - 1 }))).status, 200)
```

```js
assert.equal(complaint.status, 'complained')
```

```js
assert.match(complaint.next, /Do not email them again until they ask for it/)
```

```js
assert.match(complaint.next, /will not retry/)
```

### tests/api/push.test.mjs

Assertions before: 34; assertions after: 34.

```js
assert.equal(res.status, 200)
```

```js
b.priyaPerson.run('push.subscribe', { endpoint: priyaUrl, keys: priyaPhone.keys }, { error: 'PUSH' })
```

```js
b.office.run('push.setup', {}, { error: 'FORBIDDEN' })
```

```js
assert.equal(Buffer.from(publicKey, 'base64url').length, 65)
```

```js
assert.doesNotMatch(await (await h.request(path)).text(), new RegExp(d))
```

```js
b.priyaPerson.run('push.subscribe', { endpoint: 'http://push.example.test/send/plain', keys: priyaPhone.keys }, { error: 'INPUT' })
```

```js
b.priyaPerson.run('push.subscribe', { endpoint: priyaUrl, keys: { p256dh: 'AAAA', auth: priyaPhone.keys.auth } }, { error: 'INPUT' })
```

```js
b.agent.run('push.subscribe', { endpoint: 'https://push.example.test/send/agent', keys: tomPhone.keys }, { error: 'FORBIDDEN' })
```

```js
b.office.run('push.subscribe', { endpoint: 'https://push.example.test/send/office', keys: tomPhone.keys }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(mine.devices.map(d => [d.device, d.thisSession, d.lastOutcome]), [['iPhone', true, null]])
```

```js
assert.doesNotMatch(JSON.stringify(mine), /push\.example\.test|p256dh/, 'the endpoint and keys are not read back')
```

```js
assert.deepEqual((await devices(b.tomPerson)).devices.map(d => d.device), ['Android phone'])
```

```js
assert.deepEqual((await devices(b.office)).devices, [])
```

```js
assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /push\.example\.test/)
```

```js
assert.deepEqual(priya.map(p => [p.title, p.body, p.jobId]), [['Glove', 'New visit on your schedule', job.id], ['Glove', 'Visit moved', job.id], ['Glove', 'Visit moved off your schedule', job.id]])
```

```js
assert.deepEqual(tom.map(p => [p.body, p.jobId]), [['New visit on your schedule', job.id], ['Visit canceled', job.id]])
```

```js
assert.deepEqual(Object.keys(p).filter(k => !['vapid', 'encoding'].includes(k)).sort(), ['body', 'jobId', 'title'], 'nothing but the line and the job id')
```

```js
assert.equal(p.encoding, 'aes128gcm')
```

```js
assert.equal(p.vapid.k, publicKey)
```

```js
assert.deepEqual([p.vapid.header.alg, p.vapid.claims.aud, p.vapid.claims.sub], ['ES256', 'https://push.example.test', 'mailto:office@harbourair.example'])
```

```js
assert.ok(p.vapid.claims.exp * 1000 > Date.now())
```

```js
assert.doesNotMatch(sent.body.toString('latin1'), /Harbourview|Harbour St|Rooftop|Mei Lin/)
```

```js
assert.equal((await devices(b.priyaPerson)).devices[0].lastOutcome, 'Handed to the push service')
```

```js
assert.equal(h.pushes.sent.length, before + 1, 'sent once')
```

```js
assert.equal((await devices(b.tomPerson)).devices[0].lastOutcome, 'Not sent: the push service answered HTTP 500')
```

```js
assert.deepEqual(await rows(b.tomPerson.id), [])
```

```js
assert.equal(signedOut.status, 204)
```

```js
assert.deepEqual(await rows(b.tomPerson.id), [])
```

```js
assert.equal(h.pushes.sent.length, before, 'no push to a signed-out phone')
```

```js
assert.deepEqual(await rows(b.priyaPerson.id), [])
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_push_subscriptions').first()).n, 0)
```

```js
assert.equal(await h.db.prepare("SELECT value FROM glove_provider_keys WHERE provider='vapid'").first(), null)
```

```js
back.run('push.subscribe', { endpoint: 'https://push.example.test/send/pat', keys: priyaPhone.keys }, { error: 'PUSH' })
```

```js
assertTrail(h, ['push.enabled', 'push.subscribed', 'push.unsubscribed', 'push.outcome', 'push.disabled'])
```

### tests/api/payroll.test.mjs

Assertions before: 41; assertions after: 41.

```js
assert.deepEqual([s.hours, s.overtimeFlag, s.status, s.onTheClock], [{ worked: '44.00', job: '2.50', travel: '0.00', regular: '40.00', overtime: '4.00', doubleTime: '0.00' }, true, 'not approved', false])
```

```js
assert.deepEqual(s.days.map(d => [d.date, d.hours.worked, d.hours.regular, d.hours.overtime]), [['2026-11-02', '13.00', '13.00', '0.00'], ['2026-11-03', '10.00', '10.00', '0.00'], ['2026-11-04', '10.00', '10.00', '0.00'], ['2026-11-05', '7.00', '7.00', '0.00'], ['2026-11-06', '4.00', '0.00', '4.00'], ['2026-11-07', '0.00', '0.00', '0.00'], ['2026-11-08', '0.00', '0.00', '0.00']])
```

```js
assert.equal((await read('/api/glove/timesheets?week=2026-11-03')).status, 400, 'a workweek starts on the owner\'s week-start day')
```

```js
assert.deepEqual(own.map(x => [x.technicianId, x.hours.worked]), [[priya.id, '44.00']], 'a technician reads only their own timesheet')
```

```js
assert.deepEqual(before.people, [])
```

```js
assert.deepEqual(before.left.map(x => [x.name, x.reason]), [['Priya N.', 'week of 2026-11-02 not approved'], ['Tom B.', '1099 subcontractor: paid through the 1099-NEC totals, not payroll']])
```

```js
person.run('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-02' }, { error: 'FORBIDDEN' })
```

```js
h.command('timesheet.approve', { technicianId: tom.id, weekStart: '2026-11-02' }, { error: 'SUBCONTRACTOR' })
```

```js
h.command('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-09' }, { error: 'NO_TIME' })
```

```js
assert.deepEqual([approved.timesheet.status, approved.minutes], ['approved', { worked: 2640, job: 150, travel: 0, regular: 2400, overtime: 240, doubleTime: 0 }])
```

```js
h.command('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-02' }, { error: 'APPROVED' })
```

```js
assert.equal((await sheet()).status, 'approved')
```

```js
assert.equal((await read(`/api/glove/reports/payroll.json?${period}`, b.dispatcher.cookie)).status, 403, 'the payroll files are the owner\'s and the office\'s, like the other exports')
```

```js
assert.equal(gusto.body, csv([['last_name', 'first_name', 'gusto_employee_id', 'workweeks', 'regular_hours', 'overtime_hours', 'double_overtime_hours', 'commission'], ['N.', 'Priya', '104', '2026-11-02 - 2026-11-08', '40.00', '4.00', '0.00', '0.00']]), 'Gusto Smart Import gets each workweek\'s hours with its date range')
```

```js
assert.equal((await read(`/api/glove/reports/payroll-quickbooks.csv?${period}`)).body, csv([['Employee', 'Date', 'Pay item', 'Hours', 'Amount'], ['Priya N.', '11/02/2026', 'Regular', '13.00', ''], ['Priya N.', '11/03/2026', 'Regular', '10.00', ''], ['Priya N.', '11/04/2026', 'Regular', '10.00', ''], ['Priya N.', '11/05/2026', 'Regular', '7.00', ''], ['Priya N.', '11/06/2026', 'Overtime', '4.00', '']]))
```

```js
assert.equal((await read(`/api/glove/reports/payroll-adp-run.csv?${period}`)).status, 409, 'ADP RUN needs the company code first')
```

```js
b.office.run('payroll.settings', { adp: { companyCode: 'G3X', payFrequency: 'W' } }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await read(`/api/glove/reports/payroll-adp-run.csv?${period}`)).body, '##GENERIC## V1.0\r\n' + csv([['IID', 'Pay Frequency', 'Pay Period Start Date', 'Pay Period End Date', 'Employee ID', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code'], ['G3X', 'W', '11/02/2026', '11/08/2026', '104', 'REG', '40.00', '', '0', '', 'BASE'], ['G3X', 'W', '11/02/2026', '11/08/2026', '104', 'OTP', '4.00', '', '0', '', 'BASE']]))
```

```js
assert.doesNotMatch((await read(`/api/glove/reports/payroll-${kind}.csv?${period}`)).body, /Tom|9876/, `${kind} carries no subcontractor`)
```

```js
assert.deepEqual(nec.rows.map(r => [r.payeeName, r.total]), [['Tom Brooks Electric', '450.00']], 'the subcontractor\'s total is in the 1099 export')
```

```js
h.command('payroll.settings', { weekStart: 'sunday' }, { error: 'WORKWEEK_FIXED' })
```

```js
assert.deepEqual([s.status, s.hours.regular, s.hours.overtime, s.hours.doubleTime], ['changed since approval', '35.00', '8.00', '1.00'])
```

```js
assert.deepEqual(s.days.slice(0, 5).map(d => [d.hours.regular, d.hours.overtime, d.hours.doubleTime]), [['8.00', '4.00', '1.00'], ['8.00', '2.00', '0.00'], ['8.00', '2.00', '0.00'], ['7.00', '0.00', '0.00'], ['4.00', '0.00', '0.00']])
```

```js
assert.deepEqual((await read(`/api/glove/reports/payroll.json?${period}`)).body.left.map(x => x.reason)[0], 'week of 2026-11-02 changed since approval')
```

```js
assert.match((await read(`/api/glove/reports/payroll-gusto.csv?${period}`)).body, /\r\nN\.,Priya,104,2026-11-02 - 2026-11-08,35\.00,8\.00,1\.00,0\.00\r\n$/)
```

```js
assertTrail(h, ['timesheet.approved', 'payroll.settings'])
```

```js
assert.deepEqual(exported.timesheets.map(x => [x.technicianId, x.weekStart, x.version, x.minutes.doubleTime]), [[priya.id, '2026-11-02', 2, 60]])
```

```js
b.office.run('payroll.settings', { commissions: { soldPercent: '5' } }, { error: 'FORBIDDEN' })
```

```js
h.command('payroll.settings', { commissions: { soldPercent: '120' } }, { error: 'INPUT' })
```

```js
b.dispatcher.run('quote.accept', { quoteId: draft.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin', soldByTechnicianId: 'nobody' }, { error: 'NOT_FOUND' })
```

```js
assert.equal(sold.acceptance.soldByTechnicianId, priya.id)
```

```js
assert.deepEqual(before.left.map(x => [x.name, x.reason]), [['Priya N.', `week of ${lastWeek} not approved`], ['Tom B.', 'commissions of $25.00 but no approved time in the period']])
```

```js
assert.deepEqual([p.commission.sold, p.commission.completed, p.commission.agreements, p.commission.total], [{ revenue: '1234.50', amount: '61.73' }, { revenue: '189.00', amount: '3.78' }, { count: 1, amount: '25.00' }, '90.51'], '5% of $1,234.50 rounds half up to $61.73; 2% of $189.00 completed; one $25 spiff; tomorrow\'s rule changes none of today\'s')
```

```js
assert.deepEqual(p.commission.items.map(c => [c.date, c.kind, c.rate, c.amount]), [[today, 'agreement', '$25.00', '25.00'], [today, 'completed', '2%', '3.78'], [today, 'sold', '5%', '61.73']])
```

```js
assert.deepEqual(run.left.map(x => x.name), ['Tom B.'], 'a commission without approved time stays out of the files, with the reason')
```

```js
assert.equal(await read(`/api/glove/reports/payroll-gusto.csv?${period}`, b.office.cookie), csv([['last_name', 'first_name', 'gusto_employee_id', 'workweeks', 'regular_hours', 'overtime_hours', 'double_overtime_hours', 'commission'], ['N.', 'Priya', '104', `${lastWeek} - ${plusDays(lastWeek, 6)}`, '16.00', '0.00', '0.00', '0.00'], ['N.', 'Priya', '104', `${thisWeek} - ${plusDays(thisWeek, 6)}`, '0.00', '0.00', '0.00', '90.51']]))
```

```js
assert.equal(await read(`/api/glove/reports/payroll-adp-run.csv?${period}`), '##GENERIC## V1.0\r\n' + csv([['IID', 'Pay Frequency', 'Pay Period Start Date', 'Pay Period End Date', 'Employee ID', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code'], ['G3X', 'B', us(lastWeek), us(plusDays(thisWeek, 6)), '104', 'REG', '16.00', '', '0', '', 'BASE'], ['G3X', 'B', us(lastWeek), us(plusDays(thisWeek, 6)), '104', 'COMM', '', '90.51', '0', '', 'BASE']]))
```

```js
assert.equal(await read(`/api/glove/reports/payroll-quickbooks.csv?${period}`), csv([['Employee', 'Date', 'Pay item', 'Hours', 'Amount'], ['Priya N.', us(lastWeek), 'Regular', '8.00', ''], ['Priya N.', us(plusDays(lastWeek, 1)), 'Regular', '8.00', ''], ['Priya N.', us(today), 'Commission', '', '90.51']]))
```

```js
assert.doesNotMatch(await read(`/api/glove/reports/payroll-${kind}.csv?${period}`), /Tom/, `${kind} carries no one left out`)
```

```js
assertTrail(h, ['payroll.settings', 'quote.accepted', 'agreement.sold'])
```

```js
assert.ok(activity.some(e => e.kind === 'payroll.settings' && e.summary.endsWith(`commissions from ${lastWeek}: 5% of sold revenue, 2% of completed revenue, $25.00 per agreement sold`)))
```

### tests/api/conversation.test.mjs

Assertions before: 55; assertions after: 55.

```js
b.office.run('conversation.log', { customerId: b.customer.id, kind: 'note' }, { error: 'INPUT' })
```

```js
b.office.run('conversation.log', { customerId: b.customer.id, kind: 'call', direction: 'inbound', outcome: 'missed' }, { error: 'INPUT' })
```

```js
person.run('conversation.log', { customerId: b.customer.id, kind: 'note', text: 'x' }, { error: 'FORBIDDEN' })
```

```js
b.office.run('conversation.log', { customerId: other.id, jobId: job.id, kind: 'note', text: 'Wrong customer' }, { error: 'CUSTOMER' })
```

```js
assert.equal(customer.status, 200)
```

```js
assert.deepEqual(shape(customer.body.entries), [...expected, ['call', 'outbound', 'phone call (logged)', 'Olu Office', 'Harbourview Dental', 'voicemail']])
```

```js
assert.deepEqual(customer.body.entries.map(e => e.at), customer.body.entries.map(e => e.at).sort(), 'oldest first')
```

```js
assert.match(customer.body.entries.find(e => e.kind === 'agent action').text, new RegExp(`^${quote.number} drafted by Ada Agent \\(agent\\)`))
```

```js
assert.equal(customer.body.entries.find(e => e.kind === 'quote accepted').recordedBy, 'Sam Ortiz', 'the person who recorded the customer\'s answer')
```

```js
assert.equal(customer.body.entries.find(e => e.kind === 'call').text, 'Asked whether the unit can run until Thursday')
```

```js
assert.equal(onJob.status, 200)
```

```js
assert.deepEqual(shape(onJob.body.entries), expected, 'the job reads its own request, quote, notices, order, call and note, not the customer-level voicemail')
```

```js
assert.deepEqual(onJob.body.entries.filter(e => ['call', 'note', 'push notice', 'purchase order sent'].includes(e.kind)).map(e => e.jobId), Array(5).fill(job.id))
```

```js
assert.equal(r.status, 200)
```

```js
assert.equal(messages.length, stream.length)
```

```js
assert.deepEqual(messages.map(e => e.id).reverse(), stream.map(e => e.id), 'the job\'s stream, newest first')
```

```js
assert.deepEqual(messages.map(e => e.at), messages.map(e => e.at).sort().reverse())
```

```js
assert.match(accepted.label, /^quote accepted \(inbound, signed, Dr Mei Lin\)/)
```

```js
assert.equal(accepted.status, 'Received')
```

```js
assert.equal(messages.find(e => e.label.startsWith('push notice') && e.status.includes('HTTP 410')).jobId, job.id)
```

```js
assert.ok(!(await history()).some(e => e.label.includes('voicemail') || e.status === 'voicemail'))
```

```js
assert.ok(!(await history(b.priyaPerson)).some(e => e.kind === 'message'))
```

```js
assert.equal((await read(`jobId=${job.id}`, person)).status, 403)
```

```js
assert.equal((await read(`customerId=${b.customer.id}&jobId=${job.id}`)).status, 400)
```

```js
assert.equal((await read('customerId=nobody')).status, 404)
```

```js
assertTrail(h, ['call.logged', 'note.logged'])
```

```js
assert.deepEqual(exported.conversations.map(x => [x.kind, x.direction, x.outcome, x.by.name]), [['call', 'inbound', 'answered', 'Olu Office'], ['note', null, null, 'Sam Ortiz'], ['call', 'outbound', 'voicemail', 'Olu Office']])
```

```js
assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
```

```js
assert.deepEqual((await read(`customerId=${b.customer.id}`)).body.entries, [...baseline, ...primary.map(f => expectedHuman(f))])
```

```js
assert.deepEqual((await read(`customerId=${dup.id}`)).body.entries, secondary.map(f => expectedHuman(f)))
```

```js
assert.deepEqual((await read(`jobId=${otherJob.id}`)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f)))
```

```js
assert.deepEqual((await read(`customerId=${dup.id}`, b.office)).body.entries, secondary.map(f => expectedHuman(f)))
```

```js
assert.deepEqual((await read(`jobId=${otherJob.id}`, viewer)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f)))
```

```js
assert.equal((await read(`jobId=${otherJob.id}`, b.priyaPerson)).status, 403)
```

```js
assert.deepEqual(await domain(), beforeReads, 'allowed and refused reads leave every domain record unchanged')
```

```js
assert.deepEqual((await read(`customerId=${b.customer.id}`, b.office)).body.entries, [...baseline, ...primary.map(f => expectedHuman(f))])
```

```js
assert.deepEqual((await read(`jobId=${otherJob.id}`, b.office)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f)))
```

```js
assert.deepEqual(await domain(), beforeBranch)
```

```js
assert.equal(refused.status, 404)
```

```js
assert.equal(refused.body.entries, undefined)
```

```js
assert.deepEqual(await domain(), beforeOtherBranch)
```

```js
assert.equal(refused.status, 403)
```

```js
assert.equal(refused.body.entries, undefined)
```

```js
assert.deepEqual(await domain(), beforeRole)
```

```js
assert.deepEqual((await read(`customerId=${b.customer.id}`, b.office)).body.entries, [...baseline, ...facts.map(f => expectedHuman(f, true))])
```

```js
assert.deepEqual((await read(`jobId=${job.id}`, viewer)).body.entries, primary.map(f => expectedHuman(f, true)))
```

```js
assert.deepEqual((await read(`jobId=${otherJob.id}`, viewer)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f, true)))
```

```js
assert.equal((await read(`customerId=${b.customer.id}`)).body.entries.at(-1).text, 'Asked for a maintenance plan')
```

```js
assert.deepEqual(await domain(), beforeSurvivorReads)
```

```js
b.office.run('conversation.log', { customerId: dup.id, kind: 'note', text: 'x' }, { error: 'MERGED' })
```

```js
assertTrail(h, ['call.logged', 'note.logged'])
```

```js
assert.ok(e)
```

```js
assert.deepEqual([e.kind, e.subjectId, e.jobId, e.actorId, e.actorName, e.actorRole, e.at], [f.kind === 'call' ? 'call.logged' : 'note.logged', f.row.id, f.jobId, f.person.id, f.person.name, f.person === b.office ? 'office' : 'dispatcher', f.at])
```

```js
assert.deepEqual([kept.command_id, kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.subject_id, kept.job_id], [f.commandId, f.person.id, f.person.name, e.actorRole, f.at, f.row.id, f.jobId])
```

```js
assert.deepEqual([record.text, record.createdAt, record.by.id, record.by.name, record.by.role], [f.text, f.at, f.person.id, f.person.name, e.actorRole])
```

### tests/api/agreements.test.mjs

Assertions before: 298; assertions after: 298.

```js
assert.equal(response.status, 200, await response.clone().text())
```

```js
who.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await records(), beforeArrival, 'desk arrival refusals preserve the whole business and Activity')
```

```js
office.run('visit.capture', payload, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await records(), before, 'the desk cannot manufacture technician evidence')
```

```js
assert.deepEqual(await person.run('visit.capture', payload, { commandId: capture.id }), capture, 'capture replay keeps the same accepted evidence')
```

```js
who.run('visit.complete', completionPayload, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await records(), beforeCompletion, 'desk completion refusals preserve accepted evidence and all business records')
```

```js
who.run('plan.save', club, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await records(), before, 'excluded plan writers change no business record')
```

```js
assert.deepEqual([plan.price, plan.termMonths, plan.includedVisits, plan.repairDiscountPercent, plan.priorityBooking, plan.formIds], ['228.00', 12, 2, '15', true, [form.id]])
```

```js
who.run('agreement.sell', { planId: plan.id, customerId: ellen.id, siteId: site.id, via: 'phone', startDate: start }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await records(), unsold, 'excluded sellers create no agreement or entitlement')
```

```js
office.run('agreement.sell', { planId: plan.id, customerId: ellen.id, siteId: site.id, via: 'quote', startDate: start }, { error: 'NOT_FOUND' })
```

```js
assert.deepEqual([agreement.startDate, agreement.plan.name, agreement.via, agreement.soldBy.name], [start, 'Comfort Club', 'phone', 'Front Office'])
```

```js
assert.equal(agreement.endDate, '2027-04-04', 'the day before the same date twelve months on')
```

```js
assert.deepEqual(soldAgreement.entitlements, { included: 2, used: 0, booked: 0, declined: 0, left: 2, next: '2026-04-05', due: ['2026-04-05', '2026-10-05'] }, 'selling grants two unused visits with independently fixed due dates')
```

```js
office.run('agreement.sell', { planId: plan.id, customerId: ellen.id, siteId: site.id, via: 'phone', startDate: today }, { error: 'AGREEMENT' })
```

```js
assert.deepEqual(sold.map(e => [e.id, e.status, e.label]), [[agreement.id, 'sold', `Comfort Club sold (phone): ${start} to ${agreement.endDate}, 2 included visits`]])
```

```js
assert.equal((await h.request(`/api/glove/sites/${site.id}/history`, { as: person.cookie })).status, 404, 'a technician with no visit there reads no history')
```

```js
assert.deepEqual([job.agreementId, job.lines.map(l => [l.description, l.total]), job.totals.total, job.forms.map(f => f.name)], [agreement.id, [['AC tune-up (included in Comfort Club)', '0.00']], '0.00', ['Comfort Club inspection']])
```

```js
assert.deepEqual(reservedAgreement.entitlements, { included: 2, used: 0, booked: 1, declined: 0, left: 2, next: '2026-04-05', due: ['2026-04-05', '2026-10-05'] }, 'creating an included job reserves its entitlement without consuming it')
```

```js
assert.deepEqual(job.forms.map(({ id, ...copy }) => copy), [{ formId: form.id, formVersion: 1, name: 'Comfort Club inspection', questions: [{ id: 'filter', label: 'Filter replaced', type: 'yesno', required: false }], equipmentId: null }])
```

```js
assert.deepEqual([row.active, row.entitlements.used, row.entitlements.left, row.entitlements.next], [true, 1, 1, '2026-10-05'], '1 visit left, next six months after the start')
```

```js
dispatcher.run('job.create', { customerId: ellen.id, siteId: site.id, agreementId: agreement.id, title: 'One too many' }, { error: 'ENTITLEMENT' })
```

```js
assert.deepEqual(await records(), reserved, 'an exhausted reservation cannot create another included job')
```

```js
assert.deepEqual([dash.agreementsDue.count, dash.agreementsDue.list.map(x => [x.customer, x.plan, x.left])], [1, [['Ellen Brooks', 'Comfort Club', 1]]], 'the agreement counts while its second tune-up is due')
```

```js
assert.deepEqual([q.revisions[0].options[0].discount, totals.subtotal, totals.discount.amount, totals.discount.nonTaxable, totals.gst, totals.total], [{ kind: 'percent', value: '15', reason: 'Comfort Club member' }, '700.00', '105.00', '105.00', '33.00', '628.00'], 'the dispatcher holds no discount limit, and the member discount is not refused')
```

```js
dispatcher.run('quote.draft', { customerId: ellen.id, siteId: site.id, title: 'Extra off', lines: repair, discount: { kind: 'percent', value: '20', reason: 'Goodwill' } }, { error: 'DISCOUNT_LIMIT' })
```

```js
assert.deepEqual(await records(), beforeDiscountRefusal, 'a refused extra discount changes no quote or money')
```

```js
assert.equal(other.revisions[0].totals.discount, undefined, 'no agreement, no member discount')
```

```js
assert.deepEqual(job.discount, { kind: 'percent', value: '15', reason: 'Comfort Club member' })
```

```js
assert.deepEqual([money(priced.totals.subtotal), money(priced.totals.discount.amount), money(priced.totals.discount.nonTaxable), money(priced.totals.gst), money(priced.totals.total)], [70000, 10500, 10500, 3300, 62800])
```

```js
assert.equal(inv.revisions[0].totals.total, '628.00')
```

```js
assert.deepEqual([line.Amount, line.DiscountLineDetail, qbo.ApplyTaxAfterDiscount, qbo.TxnTaxDetail.TotalTax], [105, { PercentBased: true, DiscountPercent: 15 }, true, 33])
```

```js
assert.match(csv, /Discount: Comfort Club member \(15%\) on non-taxable lines,1,-105\.00,/)
```

```js
assert.equal((await read(`/api/glove/reports/revenue.json?from=${start}&to=${today}`)).total.revenue, '595.00')
```

```js
assert.deepEqual([call.discount?.reason, call.totals.discount?.amount], ['Comfort Club member', '13.35'], 'a member\'s service call takes the discount too')
```

```js
assert.deepEqual([r.sold, r.active, r.churn, r.soldValue, r.byPlan], [1, 1, 0, '228.00', [{ plan: 'Comfort Club', sold: 1 }]])
```

```js
assert.deepEqual(parseCsv(await h.request(`/api/glove/reports/agreements.csv?${period}`).then(x => x.text())), expectedCsv)
```

```js
assert.deepEqual((await read(`/api/glove/segments/${segment.id}`)).members.map(m => m.name), ['Lee Park'])
```

```js
assert.deepEqual(member.plan, { ...club, visitServiceName: 'AC tune-up' })
```

```js
assert.deepEqual([member.startDate, member.endDate, member.soldOn, member.soldBy], [start, '2027-04-04', today, { id: office.id, name: 'Front Office', role: 'office' }])
```

```js
assert.deepEqual([member.id, member.active, member.entitlements], [agreement.id, true, { included: 2, used: 1, booked: 1, declined: 0, left: 1, next: '2026-10-05', due: ['2026-04-05', '2026-10-05'] }])
```

```js
assert.equal(keptJob.status, 'completed')
```

```js
assert.deepEqual(keptJob.forms, tuneJob.forms, 'the completed job retains its original frozen form, not the edited template')
```

```js
assert.deepEqual([visit.status, visit.arrival, visit.completion], ['completed', { technicianId: tech.id, deviceTime: tuneEvidence.visit.startAt, receivedAt: at, captureId: tuneEvidence.arrival.id }, tuneEvidence.completed.completion])
```

```js
assert.deepEqual(visit.completion, { technicianId: tech.id, deviceTime: tuneEvidence.visit.endAt, receivedAt: at, summary: 'Done', signoff: { customerPresent: false, absentReason: 'Customer at work' }, jobComplete: true, findings: '', recommendations: [] })
```

```js
assert.deepEqual(visit.lateEvidence, [], 'assigned technician evidence was accepted directly')
```

```js
assert.equal(captures.length, 1, 'the frozen inspection has exactly one accepted capture')
```

```js
assert.equal(capture.id, tuneEvidence.captures[0].id)
```

```js
assert.deepEqual([capture.visitId, capture.jobId, capture.technicianId, capture.kind, capture.late, capture.formId, capture.formName, capture.answers, capture.flagged, capture.deviceTime, capture.receivedAt], [visit.id, keptJob.id, tech.id, 'form', false, tuneJob.forms[0].id, 'Comfort Club inspection', [{ questionId: 'filter', label: 'Filter replaced', type: 'yesno', value: true }], 0, tuneEvidence.visit.startAt, at])
```

```js
assert.deepEqual(state.captures.find(c => c.id === 'synthetic-glove-completion-6'), { ...tuneEvidence.completed.completion, id: 'synthetic-glove-completion-6', version: 1, createdAt: at, visitId: visit.id, jobId: keptJob.id, kind: 'completion', late: false })
```

```js
assert.deepEqual([keptQuote.status, keptQuote.acceptance.revision, keptQuote.acceptance.method, keptQuote.acceptance.customerName], ['accepted', 1, 'phone', 'Ellen Brooks'])
```

```js
assert.deepEqual([keptQuote.acceptance.recordedBy, keptQuote.acceptance.at], [{ id: dispatcher.id, name: 'Dee Dispatcher', role: 'dispatcher' }, at])
```

```js
assert.deepEqual(keptRepair.discount, { kind: 'percent', value: '15', reason: 'Comfort Club member' })
```

```js
assert.deepEqual([totals.subtotal, totals.discount.amount, totals.discount.nonTaxable, totals.gst, totals.total], ['700.00', '105.00', '105.00', '33.00', '628.00'])
```

```js
assert.deepEqual([dashboard.date, dashboard.timezone, dashboard.agreementsDue], [today, 'America/Chicago', { count: 1, list: [{ id: `${agreement.id}:1`, customer: 'Ellen Brooks', plan: 'Comfort Club', next: '2026-10-05', left: 1 }] }])
```

```js
assert.deepEqual([report.kind, report.from, report.to, report.sold, report.active, report.churn, report.soldValue, report.byPlan], ['agreements', start, today, 1, 1, 0, '228.00', [{ plan: 'Comfort Club', sold: 1 }]])
```

```js
assert.deepEqual(parseCsv(await h.request(`/api/glove/reports/agreements.csv?${period}`).then(x => x.text())), expectedCsv)
```

```js
assert.deepEqual((await read(`/api/glove/segments/${segment.id}`)).members.map(m => [m.id, m.name]), [[lee.id, 'Lee Park']])
```

```js
assert.deepEqual(await read('/api/glove/export'), before, 'state, agreement, dashboard, report and segment reads change no exported record')
```

```js
assert.equal((await h.request('/api/glove/agreements', { as: '' })).status, 401, 'agreement reads require a real session')
```

```js
assert.equal((await h.request(path, { as: who.cookie })).status, 403, path)
```

```js
who.run('agreement.sell', { planId: agreement.planId, customerId: ellen.id, siteId: site.id, via: 'phone', startDate: start }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await records(), unchanged, 'refused reads and sales change no business records')
```

```js
assertTrail(h, ['plan.saved', 'agreement.sold', 'capture.form', 'capture.completion', 'job.completed'])
```

```js
assert.ok(e, `${expected.kind} has the actual command reference`)
```

```js
assert.deepEqual([e.subjectId, e.actorId, e.actorName, e.actorRole, e.at], [expected.subjectId, expected.actorId, expected.actorName, expected.actorRole, at])
```

```js
assert.deepEqual([saved.command_id, saved.subject_id, saved.actor_id, saved.actor_name, saved.actor_role, saved.at], [expected.commandId, expected.subjectId, expected.actorId, expected.actorName, expected.actorRole, at])
```

```js
assert.deepEqual([completed.actorId, completed.actorName, completed.actorRole], [person.id, 'Luis Ortega', 'technician'])
```

```js
assert.deepEqual(await person.run('visit.capture', { visitId: tuneEvidence.visit.id, deviceTime: tuneEvidence.visit.startAt, kind: 'form', formId: tuneJob.forms[0].id, answers: { filter: true } }, { commandId: tuneEvidence.captures[0].id }), tuneEvidence.captures[0])
```

```js
assert.deepEqual(await person.run('visit.complete', { visitId: tuneEvidence.visit.id, deviceTime: tuneEvidence.visit.endAt, summary: 'Done', signoff: { absentReason: 'Customer at work' } }, { commandId: 'synthetic-glove-completion-6' }), tuneEvidence.completed)
```

```js
assert.deepEqual(await records(), beforeReplay, 'replaying accepted inspection and completion after restart changes no record, entitlement or audit event')
```

```js
assert.deepEqual((await read(`/api/glove/reports/agreements.json?${period}`)).churn, 1)
```

```js
assert.deepEqual((await read(`/api/glove/segments/${segment.id}`)).members.map(m => m.name).sort(), ['Ellen Brooks', 'Lee Park'])
```

```js
assert.equal(after.revisions[0].totals.discount, undefined, 'an ended agreement gives no discount')
```

```js
assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, 1, 'PLAN-004 ending a term is not completion or a customer decline')
```

```js
assertTrail(h, ['plan.saved', 'agreement.sold', 'agreement.ended'])
```

```js
assert.deepEqual(exported.agreements.map(a => [a.plan.name, a.endReason]), [['Comfort Club', 'Moved away']])
```

```js
assert.deepEqual((await read(`/api/glove/sites/${site.id}/history`)).entries.filter(e => e.kind === 'agreement').map(e => [e.id, e.status, e.label]), [[`${agreement.id}:ended`, 'ended', 'Comfort Club ended by Front Office: Moved away'], [agreement.id, 'ended', `Comfort Club sold (phone): ${start} to ${agreement.endDate}, 2 included visits`]], 'the end joins the history, newest first')
```

```js
assert.equal((await h.request('/api/glove/agreements', { as: person.cookie })).status, 403)
```

```js
assert.ok(ended)
```

```js
assert.equal(all.length, 40)
```

```js
assert.equal(new Set(all.map(v => v.id)).size, 40)
```

```js
assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, 40)
```

```js
assert.equal(area.length, 30)
```

```js
assert.deepEqual(booked.map(v => v.id), all.map(v => v.id), 'booking never silently removes due work')
```

```js
assert.equal(booked.filter(v => v.booked).length, 30)
```

```js
dispatcher.run('job.create', { customerId: area[0].customerId, siteId: area[0].siteId, agreementId: area[0].agreementId, agreementVisitIndex: area[0].index, title: 'Duplicate' }, { error: 'ENTITLEMENT' })
```

```js
assert.deepEqual(remaining.map(v => v.id), all.filter(v => v.id !== target.id).map(v => v.id))
```

```js
assert.equal(sibling.index, 0)
```

```js
assert.equal(sibling.due, start)
```

```js
assert.equal(cancelled, undefined)
```

```js
assert.equal((await read('/api/glove/due-visits')).visits.find(v => v.jobId === cancel.jobId).booked, false)
```

```js
assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, 39)
```

```js
assert.equal(expired.length, 39, 'term expiry or ending does not erase outstanding visits')
```

```js
assert.equal(seasonal.length, 15, 'inclusive season bounds and ZIP filter')
```

```js
person.run('agreement.decline', { agreementId: a1.id, version: a1.version, index: first.index, ...answer }, { error: 'FORBIDDEN' })
```

```js
office.run('agreement.decline', { agreementId: a1.id, version: a1.version, index: first.index, ...answer, method: 'by carrier pigeon' }, { error: 'INPUT' })
```

```js
office.run('agreement.decline', { agreementId: a1.id, version: a1.version, index: 2, ...answer }, { error: 'ENTITLEMENT' })
```

```js
office.run('agreement.decline', { agreementId: liveAgreement.id, version: liveAgreement.version, index: live.index, ...answer, customerName: live.customer }, { error: 'BOOKED' })
```

```js
assert.deepEqual(declined1.declines.map(d => [d.index, d.due, d.method, d.customerName, d.reason, d.recordedBy.name, d.recordedBy.role]), [[first.index, first.due, 'phone', first.customer, 'Replacing the system this year', 'Front Office Due', 'office']])
```

```js
office.run('agreement.decline', { agreementId: a1.id, version: a1.version, index: first.index, ...answer }, { error: 'STALE' })
```

```js
office.run('agreement.decline', { agreementId: a1.id, version: declined1.version, index: first.index, ...answer }, { error: 'ENTITLEMENT' })
```

```js
dispatcher.run('job.create', { customerId: first.customerId, siteId: first.siteId, agreementId: first.agreementId, agreementVisitIndex: first.index, title: 'Declined' }, { error: 'ENTITLEMENT' })
```

```js
assert.deepEqual([a1.entitlements.included, a1.entitlements.used, a1.entitlements.declined, a1.entitlements.left], [2, 0, 1, 1], 'a declined visit is no longer left')
```

```js
assert.deepEqual(declines.map(e => [e.status, e.label]), [['declined', `Comfort Club visit ${first.index + 1} (due ${first.due}) declined by ${first.customer} (phone), recorded by Front Office Due: Replacing the system this year`]], 'CUST-001: the decline is in the property history')
```

```js
assert.deepEqual(remainder.map(v => v.id), remaining.filter(v => v.id !== first.id && v.id !== second.id).map(v => v.id), 'the due list shows exactly the remainder')
```

```js
assert.equal(remainder.length, 37)
```

```js
assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, remainder.length, 'the REPORT-001 tile counts the same due visits')
```

```js
assert.deepEqual(brief.sections.agreements.map(v => v.id), remainder.map(v => v.id))
```

```js
assert.deepEqual(brief.sections.agreements.map(v => [v.agreementHref, v.action.href]), remainder.map(v => [`#customers/${customerOf.get(v.agreementId)}`, '#dispatch']))
```

```js
assert.equal((await h.state()).version, before, 'due reads are read only')
```

```js
assert.equal((await h.request('/api/glove/due-visits', { as: person.cookie })).status, 403)
```

```js
assert.equal((await h.request('/api/glove/due-visits?through=2026-02-31')).status, 400)
```

```js
assertTrail(h, ['agreement.sold', 'job.created', 'visit.booked', 'job.completed', 'agreement.visitDeclined'])
```

```js
assert.equal(exported.jobs.filter(j => j.agreementVisitIndex !== undefined).length, 30)
```

```js
assert.deepEqual(exported.agreements.flatMap(a => (a.declines ?? []).map(d => `${a.id}:${d.index}`)).sort(), [first.id, second.id].sort(), 'declines travel in the export')
```

```js
assert.equal(linkable.length, 8)
```

```js
assert.deepEqual(offers.map(o => o.emailed.to), linkable.map(v => emailOf(v.customerId)), 'each link goes to its own customer')
```

```js
assert.deepEqual(links.map(m => [m.to, deliveryIdOf(m)]), offers.map(o => [o.emailed.to, o.emailed.messageId]))
```

```js
assert.deepEqual(links.map(m => /#token=(glb_[A-Za-z0-9_-]{43})/.exec(textOf(m))[1]), offers.map(o => o.token), 'each emailed link is the one shown once')
```

```js
assert.equal(opened.status, 200, 'the delivered link is the real booking link')
```

```js
assert.deepEqual((await opened.json()).offer.slots.map(x => x.start), ['08:00'])
```

```js
assert.equal((await postEvents(h, edge.callback(m))).status, 200)
```

```js
assert.equal((await postEvents(h, sendgrid.signed(delivered))).status, 200)
```

```js
assert.deepEqual(offers.map(o => linkStates[o.emailed.messageId].status), Array(8).fill('delivered'), 'eight delivered booking links')
```

```js
assert.ok(linked.some(e => e.kind === 'booking link' && e.status === 'offered' && e.label === `Comfort Club visit ${linkable[0].index + 1}: 1 slot offered by ${offers[0].offeredBy.name}`))
```

```js
assert.match(linkEmail.label, /^booking link emailed \(outbound, email, .+ to member\d+@example\.test\)/)
```

```js
assert.match(linkEmail.status, /^Delivered/, 'CUST-001 / COMM-007: the emailed booking link is in the property history with its provider-reported state')
```

```js
assert.deepEqual(afterLinks.map(v => v.id), remainder.map(v => v.id), 'sending links removes nothing: the due list still shows exactly the remainder')
```

```js
assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, remainder.length, 'and the REPORT-001 tile the same number')
```

```js
assertTrail(h, ['agreement.offer.created', 'email.queued', 'email.accepted', 'email.delivered'])
```

```js
assert.equal(trail.exported.jobs.filter(j => j.agreementVisitIndex !== undefined).length, 38)
```

```js
assert.ok(!JSON.stringify(trail.exported).includes(token) && !JSON.stringify(trail.exported).includes('synthetic-glove-1'), 'no bearer or key in the export')
```

```js
field.run('agreement.offer', payload, { error: 'FORBIDDEN' })
```

```js
assert.match(link.token, /^glb_/)
```

```js
assert.equal(Date.parse(link.expiresAt) - Date.parse(link.createdAt), 14 * 86400000)
```

```js
assert.equal((await office.run('agreement.offer', payload, { commandId })).token, undefined, 'secret shown only once, never in replay')
```

```js
assert.ok(secret.hash && !secret.hash.includes(link.token))
```

```js
assert.equal(view.offer.service, service.name, 'native plan links retain the service label instead of the internal included-line description')
```

```js
assert.deepEqual(view.offer.slots.map(s => [s.date, s.start, s.timezone]), [[date, '09:00', 'America/Chicago'], [date, '10:00', 'America/Chicago']])
```

```js
assert.equal(JSON.stringify(view).includes('Rosa'), false)
```

```js
assert.equal((await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${link.token}` } })).status, 401, 'bearer grants no staff or customer-account access')
```

```js
assert.equal((await h.request(`/api/glove/public/booking?token=${link.token}`, { as: '' })).status, 404)
```

```js
assert.equal((await publicRequest(link.token, view.offer.slots[0].id, { origin: 'https://foreign.example' })).status, 403)
```

```js
assert.equal((await publicRequest(link.token, crypto.randomUUID())).status, 409, 'a caller cannot book a slot the office did not offer')
```

```js
assert.equal((await h.state()).visits.filter(v => v.jobId === link.jobId).length, 0, 'an unoffered choice books nothing')
```

```js
assert.equal(stale.status, 409)
```

```js
assert.equal(refusal.error.code, 'SLOT_TAKEN')
```

```js
assert.deepEqual(refusal.error.details.offer.slots.map(s => s.start), ['10:00'])
```

```js
assert.equal(JSON.stringify(refusal).includes(otherJob.id), false, 'no other customer conflict details on the public door')
```

```js
assert.equal(sent.sentOutside.by.id, office.id)
```

```js
assert.deepEqual(answers.map(r => r.status).sort(), [200, 404], 'one booking under a simultaneous choice, then revoked')
```

```js
assert.equal((await publicRequest(link.token)).status, 404)
```

```js
assert.equal(booked.length, 1)
```

```js
assert.deepEqual([booked[0].local.start, booked[0].assignments[0].by.id, booked[0].assignments[0].by.role], ['10:00', office.id, 'office'])
```

```js
assert.equal((await h.request('/api/glove/due-visits').then(r => r.json())).visits.some(v => v.jobId === link.jobId && v.booked), true, 'customer booking keeps the entitlement due until completion')
```

```js
assert.equal((await publicRequest(revoked.token)).status, 404)
```

```js
assert.equal((await publicRequest(expired.token)).status, 404)
```

```js
assert.equal((await publicRequest(authority.token)).status, 404, 'offering person losing booking authority refuses the next choice')
```

```js
assert.equal((await publicRequest(authority.token)).status, 404, 'current branch authority checked on the public link')
```

```js
assert.deepEqual((await linkHistory(0)).map(e => [e.status, e.label]), [['used', 'Comfort Club visit 1: the customer chose a slot'], ['delivery not verified', 'Comfort Club visit 1: recorded by Booking Office as sent by email'], ['offered', 'Comfort Club visit 1: 2 slots offered by Booking Office']], 'CUST-001: offer, outside send and use are in the property history')
```

```js
assert.deepEqual((await linkHistory(2)).map(e => e.status).sort(), ['offered', 'offered', 'revoked'], 'a revoked and an expired offer are both on the property')
```

```js
assertTrail(h, ['agreement.offer.created', 'agreement.offer.sentOutside', 'agreement.offer.used', 'agreement.offer.revoked', 'visit.booked'])
```

```js
assert.equal(JSON.stringify(exported).includes(value), false)
```

```js
assert.equal(JSON.stringify(activity).includes(value), false)
```

```js
assert.equal(JSON.stringify(await h.state()).includes(value), false)
```

```js
assert.equal(JSON.stringify((await h.db.prepare('SELECT result FROM glove_commands').all()).results).includes(value), false)
```

```js
assert.equal((await h.request('/api/glove/due-visits').then(r => r.json())).visits.length, 4, 'first due entitlement of every member remains present')
```

```js
assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: '2030-01-01T12:00:00Z' } })).status, 200)
```

```js
dispatcher.run('booking.offer', servicePayload, { error: 'FORBIDDEN' })
```

```js
h.command('booking.offer', { ...servicePayload, deposit: '50.00' }, { error: 'PAYMENT_POLICY' })
```

```js
assert.equal((await h.command('booking.offer', servicePayload, { commandId: serviceCommand })).token, undefined)
```

```js
assert.deepEqual(full.offer.slots, [], 'a full day offers no window, despite an unqualified free technician')
```

```js
assert.equal((await publicRequest(serviceLink.token, serviceLink.slots[0].id)).status, 409)
```

```js
assert.equal((await h.state()).visits.some(v => v.jobId === serviceJob.id), false)
```

```js
assert.deepEqual(available.offer.slots.map(x => [x.start, x.window]), [['15:00', { start: '14:00', end: '16:00' }]])
```

```js
assert.equal(JSON.stringify(available).includes('Private competing work'), false)
```

```js
assert.equal(JSON.stringify(available).includes(skilled.id), false, 'no technician identifier is disclosed')
```

```js
assert.equal((await publicRequest(serviceLink.token, serviceLink.slots[0].id)).status, 200)
```

```js
assert.equal((await publicRequest(serviceLink.token, serviceLink.slots[0].id)).status, 404, 'single choice cannot book twice')
```

```js
assert.equal(serviceVisit.length, 1)
```

```js
assert.deepEqual([serviceVisit[0].technicianId, serviceVisit[0].arrivalWindow, serviceVisit[0].local.start], [skilled.id, { start: '14:00', end: '16:00' }, '15:00'])
```

```js
assert.match(serviceVisit[0].assignments[0].reason, /^Assigned automatically/)
```

```js
assert.ok((await h.state()).notices.some(n => n.visitId === serviceVisit[0].id && n.message.includes('arrange the customer confirmation')))
```

```js
dispatcher.run('agreement.offerRevoke', { offerId: revokedService.id, version: revokedService.version }, { error: 'FORBIDDEN' })
```

```js
assert.equal((await publicRequest(revokedService.token)).status, 200)
```

```js
assert.equal((await publicRequest(revokedService.token)).status, 404, 'retaining dispatch authority does not retain service-link ownership')
```

```js
assert.equal((await publicRequest(revokedService.token)).status, 404)
```

```js
dispatcher.run('booking.offer', { jobId: nextJob.id, generate }, { error: 'FORBIDDEN' })
```

```js
h.command('booking.offer', { jobId: nextJob.id, generate, slots: servicePayload.slots }, { error: 'INPUT' })
```

```js
h.command('booking.offer', { jobId: nextJob.id, generate: { ...generate, ...invalid } }, { error: invalid.date ? 'TIME' : 'INPUT' })
```

```js
h.command('booking.offer', { jobId: nextJob.id, generate: { ...generate, date: '2030-01-16' } }, { error: 'NO_TECHNICIAN' })
```

```js
assert.deepEqual(many.slots.map(x => x.start), ['10:00', '10:15', '10:30', '10:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15'], 'generation returns only the first ten eligible windows, preserving gaps and chronological order')
```

```js
assert.deepEqual(generated.slots.map(x => x.start), expectedWindows, 'generation excludes hours, visits, calendar busy time, missing skills and wrong service areas')
```

```js
assert.deepEqual(generatedView.offer.slots.map(x => [x.start, x.window]), [['10:00', { start: '10:00', end: '11:00' }], ['13:00', { start: '13:00', end: '14:00' }], ['14:00', { start: '14:00', end: '15:00' }], ['15:00', { start: '15:00', end: '16:00' }]], 'public door presents the independently expected generated arrival windows')
```

```js
assert.equal((await publicRequest(generated.token, generated.slots[0].id)).status, 409, 'generated capacity is rechecked at customer choice')
```

```js
assert.equal((await publicRequest(generated.token, generated.slots[0].id)).status, 200)
```

```js
assert.deepEqual([generatedVisit.technicianId, generatedVisit.local.start, generatedVisit.arrivalWindow], [skilled.id, '10:00', { start: '10:00', end: '11:00' }])
```

```js
assertTrail(h, ['booking.offer.created', 'booking.offer.used'])
```

```js
assert.deepEqual(serviceHistory.map(e => e.status).sort(), ['offered', 'offered', 'offered', 'offered', 'revoked', 'used', 'used'], 'CUST-001 includes the service booking offer, use and revocation alongside agreement links')
```

```js
assert.equal(JSON.stringify(serviceTrail).includes(value), false)
```

```js
assert.equal(JSON.stringify(await h.state()).includes(value), false)
```

```js
assert.equal(JSON.stringify((await h.db.prepare('SELECT result FROM glove_commands').all()).results).includes(value), false)
```

```js
assert.equal(checked.checks.length, 20)
```

```js
assert.deepEqual(checked.checks.map(x => [x.index, x.status]), Array.from({ length: 20 }, (_, i) => [i, i < 10 ? 'recorded' : 'missing']))
```

```js
assert.deepEqual(checked.checks.map(x => x.forms.map(f => f.copyId)), jobs.map(j => j.forms.map(f => f.id)), 'each job keeps distinct frozen copies')
```

```js
assert.deepEqual(checked.checks[0].forms.map(f => f.captureIds), captures.slice(0, 2).map(c => [c.id]))
```

```js
assert.deepEqual(checked.checks[10].forms.map(f => [f.name, f.formVersion, f.captureIds]), [['Promised inspection', 1, []], ['Promised readings', 1, []]])
```

```js
assert.ok(checked.checks.every(x => x.jobId === jobs[x.index].id && completionReferences.has(x.visitId) && x.completionCaptureId === completionReferences.get(x.visitId)))
```

```js
assert.deepEqual(await agent.run('agreement.prepare', payload, { commandId }), checked, 'lost-response replay is stable')
```

```js
assert.equal((await agent.run('agreement.prepare', payload)).id, checked.id, 'fresh unchanged inspection creates no duplicate')
```

```js
assert.deepEqual([after.jobs, after.visits, after.messages, after.bookingOffers, after.payments], [before.jobs, before.visits, before.messages, before.bookingOffers, before.payments], 'preparation has no operational or outbound effect')
```

```js
techPerson.run('visit.capture', { visitId: visits[10].id, deviceTime: visits[10].endAt, kind: 'form', formId: jobs[0].forms[0].id, answers: { checked: true } }, { error: 'NOT_FOUND' })
```

```js
techPerson.run('visit.capture', { visitId: visits[10].id, deviceTime: visits[10].endAt, kind: 'form', formId: form.id, answers: { checked: true } }, { error: 'NOT_FOUND' })
```

```js
assert.deepEqual((await agent.run('agreement.prepare', payload)).checks, checked.checks)
```

```js
assert.equal((await agent.run('agreement.prepare', payload)).checks[10].status, 'missing', 'unreviewed late evidence is not accepted')
```

```js
assert.equal(projection.maintenance.find(v => v.index === 10).preparation.current, false, 'old preparation is visibly stale')
```

```js
assert.equal(refreshed.id, checked.id)
```

```js
assert.equal(refreshed.version, checked.version + 1)
```

```js
assert.deepEqual(refreshed.checks.filter(x => x.status === 'missing').map(x => x.index), [11, 12, 13, 14, 15, 16, 17, 18, 19])
```

```js
assert.ok(refreshed.checks[10].forms.every(f => f.captureIds.length === 1))
```

```js
assertTrail(h, ['agreement.maintenancePrepared'])
```

```js
assert.equal(event.actorRole, 'agent')
```

```js
assert.equal(event.subjectId, checked.id)
```

```js
assert.equal(exported.agreementChecks.find(r => r.id === checked.id).preparedBy.id, agent.id)
```

```js
assert.ok(trail.some(e => e.agreementId === agreement.id && e.checks[10].status === 'recorded' && e.effect === refreshed.effect))
```

```js
agent.run('agreement.prepare', payload, { error: 'PAUSED' })
```

```js
agent.run('agreement.prepare', payload, { commandId, error: 'PAUSED' })
```

```js
agent.run('agreement.prepare', payload, { commandId, error: 'FORBIDDEN' })
```

```js
agent.run('agreement.prepare', payload, { error: 'NOT_FOUND' })
```

```js
agent.run('agreement.prepare', payload, { commandId, error: 'NOT_FOUND' })
```

```js
assert.deepEqual((await h.request('/api/glove/due-visits', { as: agent.cookie }).then(r => r.json())).maintenance, [])
```

```js
assert.equal((await agent.state()).agreementChecks.length, 0)
```

```js
assert.deepEqual((await agent.run('agreement.prepare', { agreementId: scopedAgreement.id })).checks, [], 'in-branch preparation remains available')
```

```js
techPerson.run('agreement.prepare', payload, { error: 'FORBIDDEN' })
```

```js
assert.equal((await h.request('/api/glove/due-visits', { as: techPerson.cookie })).status, 403)
```

```js
assert.equal((await techPerson.state()).agreementChecks.length, 0)
```

```js
assert.equal((await h.request('/api/glove/commands', { method: 'POST', as: '', body: { commandId: 'synthetic-glove-unsigned', type: 'agreement.prepare', payload } })).status, 401)
```

```js
assert.equal(erased.agreementChecks.some(r => r.id === checked.id), false)
```

```js
assert.equal((await h.request('/api/glove/due-visits').then(r => r.json())).maintenance.some(v => v.customerId === customer.id), false)
```

```js
assert.ok(replay.id)
```

```js
agent.run('agreement.prepare', payload, { commandId, error: 'ERASED' })
```

```js
assert.ok(erasedEvents.length > 0)
```

```js
assert.ok(erasedEvents.every(e => e.summary === 'Customer personal data erased' && e.data === '{}'), 'timeline keeps anonymous references without personal preparation copies')
```

```js
assert.ok(imported, 'source fixture includes an explicitly completed entitlement')
```

```js
assert.ok(unknown.checks.length > 0)
```

```js
assert.deepEqual(unknown.checks.map(c => [c.index, c.status, c.completionCaptureId, c.forms]), [[0, 'unavailable', null, []]])
```

```js
h.command('booking.offer', { jobId: job.id, generate }, { error: 'NO_TECHNICIAN' })
```

```js
assert.deepEqual(link.slots.map(x => x.start), ['09:30', '10:00', '10:30'], 'both directed legs fit; exact thirty-minute boundaries are included')
```

```js
assert.deepEqual(await starts(), ['09:30', '10:00', '10:30'])
```

```js
assert.deepEqual(await starts(), ['10:00', '10:30'], 'even a fractional second over the inbound gap is refused')
```

```js
assert.deepEqual(await starts(), ['09:30', '10:00'], 'outbound travel uses the following visit boundary, without rounding down')
```

```js
assert.deepEqual(await starts(), ['09:30'], 'changed routes invalidate formerly feasible windows')
```

```js
assert.equal((await request(link.slots[1].id)).status, 409)
```

```js
assert.equal((await h.state()).visits.filter(v => v.jobId === job.id).length, 0, 'travel refusal creates no booking')
```

```js
assert.deepEqual(await starts(), [], `${unavailable} is never zero-minute travel`)
```

```js
assert.equal((await request(link.slots[1].id)).status, 409)
```

```js
assert.deepEqual(await starts(), [], 'an unavailable adjacent location is not invented')
```

```js
assert.deepEqual(await starts(), ['09:30', '10:00'], 'the current following schedule is rechecked')
```

```js
assert.equal((await request(link.slots[1].id)).status, 409, 'final assignment rechecks routes after the displayed availability')
```

```js
assert.equal((await h.state()).visits.filter(v => v.jobId === job.id).length, 0)
```

```js
assert.equal((await request(link.slots[1].id)).status, 409, 'a schedule change during final routing defeats the atomic commit and is rechecked')
```

```js
assert.ok(competing)
```

```js
assert.equal((await h.state()).visits.filter(v => v.jobId === job.id).length, 0)
```

```js
assert.equal(authorityRefusal.status, 404, `Owner authority withdrawn during final routing refuses the commit: ${await authorityRefusal.text()}`)
```

```js
assert.equal((await h.state()).visits.filter(v => v.jobId === job.id).length, 0)
```

```js
assert.deepEqual(await starts(), ['09:30', '10:00', '10:30'])
```

```js
assert.equal((await request(link.slots[1].id)).status, 200)
```

```js
assert.equal(booked.length, 1)
```

```js
assert.deepEqual([booked[0].technicianId, booked[0].local.start, booked[0].arrivalWindow], [alternative.id, '10:00', { start: '10:00', end: '11:00' }])
```

```js
assert.equal((await request(link.slots[1].id)).status, 404)
```

```js
assert.equal(r.status, 200)
```

```js
assert.deepEqual(due.visits.map(v => ({ id: v.id, customer: v.customer, customerId: v.customerId, due: v.due, booked: v.booked })), expected, 'five exact outstanding native identities, including booked work and excluding future, completed and declined work')
```

```js
assert.equal(dashboard.date, '2030-01-01', 'Today uses the business date, not the UTC date')
```

```js
assert.deepEqual(dashboard.agreementsDue, { count: 5, list: expected.map(v => ({ id: v.id, customer: v.customer, plan: 'Seasonal Care', next: v.due, left: 1 })) })
```

```js
assert.deepEqual([brief.date, brief.timezone], ['2030-01-01', 'America/Chicago'])
```

```js
assert.deepEqual(brief.sections.agreements, expected.map(v => ({ kind: 'agreementDue', id: v.id, text: `${v.customer}: Seasonal Care visit due ${v.due}${v.booked ? ' (booked, awaiting completion)' : ''}`, agreementHref: `#customers/${v.customerId}`, action: { label: 'Schedule included visit', href: '#dispatch' } })))
```

```js
assert.deepEqual(await h.state(), before, 'dashboard, due-list and brief reads preserve the entire domain state, also after restart')
```

```js
assert.equal(response.status, 200)
```

```js
assert.ok(visit)
```

```js
assert.equal(before.jobs.length, 2)
```

```js
assert.equal(before.visits.length, 1)
```

```js
assert.equal(recovered.id, visit.id)
```

```js
assert.deepEqual(await h.state(), before, 'replay after restart creates no visit or event')
```

```js
office.run('visit.book', { ...payload, start: '07:00', end: '07:30' }, { commandId, error: 'IDEMPOTENCY' })
```

```js
assert.deepEqual(due.map(v => [v.id, v.booked, v.jobId]).sort(), [
      [`${members[0].agreement.id}:0`, true, job.id],
      [`${members[1].agreement.id}:0`, false, retained.id],
      [`${members[2].agreement.id}:0`, false, null],
    ].sort(), 'all three remain due; later entries are unbooked with the retained job intact')
```

```js
assertTrail(h, ['job.created', 'visit.booked'])
```

```js
assert.equal(event.length, 1)
```

```js
assert.deepEqual([event[0].commandId, event[0].jobId, event[0].actorId, event[0].actorRole], [commandId, job.id, office.id, 'office'])
```

```js
assert.deepEqual(exported.timeline.filter(e => e.kind === 'visit.booked').map(e => [e.id, e.command_id, e.actor_id]), [[event[0].id, commandId, office.id]])
```

```js
assert.deepEqual((await readDue()).map(v => [v.id, v.booked]).sort(), members.slice(1).map(m => [`${m.agreement.id}:0`, true]).sort())
```

```js
assert.equal(final.jobs.length, 3)
```

```js
assert.equal(final.visits.length, 3)
```

```js
assertTrail(h, ['job.completed'])
```

```js
assert.equal(completeTrail.activity.filter(e => e.kind === 'visit.booked' && e.commandId === commandId).length, 1)
```

### tests/api/callbacks.test.mjs

Assertions before: 17; assertions after: 17.

```js
assert.deepEqual(callback.callback, { days: 30, equipment: [{ equipmentId: condenser.id, visitIds: [first.id, second.id] }] })
```

```js
assert.equal(other.callback, null, 'the furnace was never serviced, so that job is no callback')
```

```js
assert.ok(timeline.events.some(e => e.kind === 'job.callback' && /AC condenser Trane XR14 serviced in the last 30 days/.test(e.summary)))
```

```js
assert.deepEqual(pack.units[0].visits.map(v => [v.ref, v.date, v.readings.map(r => [r.ref, r.label, r.value, r.flagged])]), [
      ['V1', '2026-10-06', [['R1', 'Suction pressure', '118', false], ['R2', 'Superheat', '10', false]]],
      ['V2', '2026-10-13', [['R3', 'Suction pressure', '104', true], ['R4', 'Superheat', '15', true]]],
    ])
```

```js
assert.deepEqual(pack.units[0].visits[1].refrigerant, [{ type: 'R-410A', added: '1.5', recovered: '0' }])
```

```js
b.agent.run('callback.prepare', { jobId: other.id }, { error: 'NOT_CALLBACK' })
```

```js
assert.doesNotMatch(JSON.stringify(call.body), /Harbourview|Harbour St|Mei Lin|02 9555/, 'no customer, contact or address goes to the model')
```

```js
assert.deepEqual(diagnosis.checklist[0].cites.map(r => [r.date, r.label, r.value, r.unit, r.flagged ?? null]), [
      ['2026-10-06', 'Suction pressure', '118', 'psi', false],
      ['2026-10-13', 'Suction pressure', '104', 'psi', true],
      ['2026-10-06', 'Superheat', '10', '°F', false],
      ['2026-10-13', 'Superheat', '15', '°F', true],
    ])
```

```js
assert.deepEqual(new Set(diagnosis.checklist[0].cites.map(r => r.visitId)), new Set([first.id, second.id]))
```

```js
assert.deepEqual(diagnosis.parts.map(p => [p.part, p.quantity, p.cites.map(r => r.visitId)]), [['R-410A refrigerant', '3 lb', [second.id]]])
```

```js
assert.match(diagnosis.advisory, /technician diagnoses and decides the work; this is not a safety certification/)
```

```js
assert.equal(diagnosis.preparedBy.role, 'agent')
```

```js
b.agent.run('callback.prepare', { jobId: callback.id }, { error: 'MODEL' })
```

```js
b.priyaPerson.run('callback.prepare', { jobId: callback.id }, { error: 'FORBIDDEN' })
```

```js
assert.equal(seen.diagnoses.length, 1)
```

```js
assert.equal(seen.diagnoses[0].checklist[0].cites.length, 4)
```

```js
assert.equal((await h.request(`/api/glove/jobs/${callback.id}/callback`, { as: b.priyaPerson.cookie })).status, 404)
```

### tests/api/nameplates.test.mjs

Assertions before: 55; assertions after: 55.

```js
b.priyaPerson.run('nameplate.read', { visitId: visit.id, equipmentId: condenser.id, photo: { mediaType: 'image/jpeg', base64: plates.trane.photo } }, { error: 'MODEL' })
```

```js
b.office.run('model.connect', { url: 'https://models.example.test/v1', model: 'vision-test', key: 'synthetic-glove-111' }, { error: 'FORBIDDEN' })
```

```js
b.office.run('manual.save', { make: ' trane ', model: 'xr14', title: 'Again', url: 'https://manuals.example.test/x.pdf' }, { error: 'DUPLICATE' })
```

```js
b.tomPerson.run('nameplate.read', { visitId: visit.id, photo: { mediaType: 'image/jpeg', base64: plates.trane.photo } }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(trane.proposed, { make: 'Trane', model: 'XR14', serial: '19243KX1F', manufactured: '2019-06' })
```

```js
assert.deepEqual([carrier.proposed, carrier.unread], [{ make: 'Carrier', model: '59TP6', serial: '', manufactured: '2014' }, ['serial']])
```

```js
assert.deepEqual([rheem.proposed.manufactured, rheem.unread], ['', ['manufactured']], '"June 2018" is not a date as printed to a precision, so it is left unread')
```

```js
assert.ok([trane, carrier, rheem].every(r => r.status === 'proposed' && r.model === 'vision-test'))
```

```js
assert.equal(h.models.calls.length, 3)
```

```js
assert.equal(call.authorization, 'Bearer synthetic-glove-111')
```

```js
assert.equal(call.body.store, false)
```

```js
assert.equal(call.body.response_format.type, 'json_schema')
```

```js
assert.doesNotMatch(JSON.stringify(call.body), /Harbourview|Harbour St|Mei Lin|Condenser service/)
```

```js
assert.deepEqual(before.equipment.map(e => [e.type, e.make ?? '', e.model ?? '', e.serial ?? '']), [['AC condenser', '', '', '']])
```

```js
assert.equal(before.nameplates.length, 3)
```

```js
assert.doesNotMatch(JSON.stringify(before), /synthetic-glove-111/)
```

```js
assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /synthetic-glove-111/)
```

```js
b.tomPerson.run('nameplate.confirm', { readingId: trane.id, version: trane.version, ...trane.proposed }, { error: 'FORBIDDEN' })
```

```js
b.dispatcher.run('nameplate.confirm', { readingId: trane.id, version: trane.version, ...trane.proposed }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual([unit.id, unit.make, unit.model, unit.serial, unit.manufacturedOn, unit.location], [condenser.id, 'Trane', 'XR14', '19243KX1G', '2019-06', 'Roof'])
```

```js
assert.deepEqual(unit.manual, { manualId: manual.id, title: 'Trane XR14 installer guide', url: 'https://manuals.example.test/trane-xr14.pdf' })
```

```js
assert.deepEqual(unit.photos.map(p => p.fileId), [trane.photo.fileId])
```

```js
b.priyaPerson.run('nameplate.confirm', { readingId: trane.id, version: trane.version + 1, ...trane.proposed }, { error: 'READING_STATE' })
```

```js
assert.deepEqual([furnace.siteId, furnace.type, furnace.make, furnace.model, furnace.serial, furnace.manufacturedOn, furnace.manual], [b.site.id, 'Furnace', 'Carrier', '59TP6', '', '2014', null], 'no manual in the library, none attached')
```

```js
assert.equal(discarded.status, 'discarded')
```

```js
assert.deepEqual(after.equipment.map(e => e.type).sort(), ['AC condenser', 'Furnace'])
```

```js
assert.deepEqual(after.nameplates.map(r => [r.status, r.corrected ?? null]), [['confirmed', ['serial']], ['confirmed', []], ['discarded', null]])
```

```js
assert.equal((await h.request(`/api/glove/files/${trane.photo.fileId}`, { as: b.priyaPerson.cookie })).status, 200)
```

```js
assert.equal((await h.request(`/api/glove/files/${trane.photo.fileId}`, { as: b.office.cookie })).status, 200)
```

```js
assert.equal((await h.request(`/api/glove/files/${trane.photo.fileId}`, { as: b.tomPerson.cookie })).status, 404)
```

```js
assert.equal(record.equipment.manual.title, 'Trane XR14 installer guide')
```

```js
assert.deepEqual(reading.proposed, proposed, `printed date ${JSON.stringify(value)}`)
```

```js
assert.deepEqual(reading.unread, empty ? ['make', 'model', 'serial', 'manufactured'] : expected ? ['serial'] : ['serial', 'manufactured'])
```

```js
assert.equal(reading.status, 'proposed')
```

```js
assert.deepEqual((await h.state()).equipment, before.equipment, 'a model reading never fills equipment itself')
```

```js
assert.deepEqual(await b.priyaPerson.run('nameplate.read', payload, { commandId }), reading)
```

```js
assert.equal(h.models.calls.length, calls, 'read replay makes no provider request')
```

```js
assert.deepEqual([unit.make, unit.model, unit.serial, unit.manufacturedOn], ['Synthetic make', 'Synthetic model', '', expected])
```

```js
assert.deepEqual(await b.priyaPerson.run('nameplate.confirm', confirmation, { commandId: confirmId }), unit)
```

```js
b.priyaPerson.run('nameplate.confirm', { readingId: correction.id, version: correction.version, ...correction.proposed, manufactured: value }, { error: 'INPUT' })
```

```js
assert.equal(error.message, 'manufactured is YYYY, YYYY-MM or YYYY-MM-DD.')
```

```js
assert.deepEqual(error.details, { field: 'manufactured' })
```

```js
assert.deepEqual(refused.equipment, unchanged.equipment, 'invalid technician correction changes no equipment')
```

```js
assert.deepEqual(refused.nameplates, unchanged.nameplates, 'invalid correction leaves the proposal reviewable')
```

```js
assert.deepEqual([corrected.id, corrected.make, corrected.model, corrected.serial, corrected.manufacturedOn], [condenser.id, 'Trane', 'XR14', 'synthetic-glove-112', '2020-12-31'])
```

```js
assert.deepEqual((await h.state()).equipment.find(e => e.id === unit.id), unit, 'exact confirmed fields survive Worker restart')
```

```js
assert.deepEqual(await b.priyaPerson.run('nameplate.confirm', confirmation, { commandId }), unit, 'confirmation replay after restart returns the same unit')
```

```js
assert.deepEqual([reading.status, reading.confirmed, reading.corrected], ['confirmed', expected.confirmed, expected.corrected])
```

```js
assert.equal(restarted.equipment.length, 5, 'replay creates no duplicate equipment')
```

```js
assert.equal(call.authorization, 'Bearer synthetic-glove-111')
```

```js
assert.equal(call.body.store, false)
```

```js
assert.doesNotMatch(JSON.stringify(call.body), /Harbourview|Harbour St|Mei Lin|Condenser service/)
```

```js
assertTrail(h, ['nameplate.read', 'equipment.added', 'equipment.updated'])
```

```js
assert.ok(activity.some(e => e.kind === 'equipment.updated' && e.actorId === b.priyaPerson.id && e.commandId === correctionId && e.subjectId === condenser.id))
```

```js
assert.doesNotMatch(JSON.stringify([restarted, activity, exported]), /synthetic-glove-111/)
```

### tests/api/subcontract.test.mjs

Assertions before: 106; assertions after: 106.

```js
h.command('technician.save', { name: 'Sid S.', operatorId: sub.id, subcontractor: { payeeName: 'Sid Sub HVAC LLC', tinLast4: '123456789' } }, { error: 'INPUT' })
```

```js
b.dispatcher.run('crew.save', { name: 'Install crew', memberIds: [b.priya.id, b.tom.id] }, { error: 'FORBIDDEN' })
```

```js
h.command('crew.save', { name: 'Solo', memberIds: [b.priya.id] }, { error: 'INPUT' })
```

```js
assert.deepEqual(crewDays.map(g => g.visits.map(v => [v.technicianId, v.local.date, v.crew.name]).sort()), days.map(d => [[b.priya.id, d, 'Install crew'], [b.tom.id, d, 'Install crew']].sort()))
```

```js
assert.deepEqual(await mine(b.priyaPerson), crewDays.map(g => g.visits.find(v => v.technicianId === b.priya.id).id).sort())
```

```js
assert.deepEqual(await mine(b.tomPerson), crewDays.map(g => g.visits.find(v => v.technicianId === b.tom.id).id).sort())
```

```js
assert.deepEqual(s.visits.map(v => v.id).sort(), sidDays.map(v => v.id).sort())
```

```js
assert.deepEqual(s.jobs.map(j => [j.id, j.title, j.lines.length]), [[job.id, 'Three-day system install', 0]])
```

```js
assert.deepEqual(s.customers, [{ id: b.customer.id, version: s.customers[0].version, name: 'Harbourview Dental', phone: '02 9555 0101' }])
```

```js
assert.deepEqual(s.sites.map(x => [x.address, x.accessNotes]), [['14 Harbour St, Balmain NSW 2041', 'Gate code at reception']])
```

```js
assert.deepEqual([s.quotes, s.invoices, s.services, s.captures, s.events, s.equipment, s.times], [[], [], [], [], [], [], []])
```

```js
assert.deepEqual(Object.keys(s.business[0]).sort(), ['id', 'name', 'timezone', 'version'])
```

```js
assert.doesNotMatch(JSON.stringify(s), /189\.00|unitPrice|totals|costRate|Priya|Tom B/)
```

```js
assert.equal((await h.request(`/api/glove/files/${photo.file.fileId}`, { as: sub.cookie })).status, 404)
```

```js
assert.deepEqual((await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: sub.cookie })).json()).events, [])
```

```js
assert.equal((await h.request(path, { as: sub.cookie })).status, 403, path)
```

```js
sub.run('visit.arrive', { visitId: priyaDay1.id, deviceTime: '2026-11-01T21:05:00Z' }, { error: 'FORBIDDEN' })
```

```js
sub.run('clock.in', { deviceTime: '2026-11-01T21:00:00Z' }, { error: 'FORBIDDEN' })
```

```js
sub.run('visit.capture', { visitId: sidDays[0].id, deviceTime: '2026-11-01T21:10:00Z', kind: 'refrigerant', refrigerant: { type: 'R-410A', added: '1' } }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(s.captures.map(x => x.kind).filter(k => k !== 'checklist').sort(), ['arrival', 'arrival', 'completion', 'completion', 'note', 'note'])
```

```js
assert.ok(s.captures.every(x => x.technicianId === sid.id))
```

```js
assert.deepEqual(booking.map(v => v.status), ['booked', 'booked'])
```

```js
b.dispatcher.run('visit.cancel', { visitId: member.id, version: current.version, reason: 'Cancel the installation day' }, { error: 'VISIT_STATE' })
```

```js
assert.deepEqual(after.visits.filter(v => v.crew?.groupId === crewDays[1].id), booking, 'neither member is cancelled or changed')
```

```js
assert.deepEqual(after.captures, before.captures, 'the recorded evidence is kept')
```

```js
assert.deepEqual(after.events, before.events, 'a refused crew cancellation records no cancellation')
```

```js
b.dispatcher.run('visit.change', { visitId: day3.id, version: (await at(day3.id)).version, technicianId: b.tom.id, reason: 'Swap' }, { error: 'CREW' })
```

```js
b.dispatcher.run('visit.change', { visitId: day3.id, version: (await at(day3.id)).version, date: '2026-11-06', reason: 'Materials late' }, { error: 'CONFLICT_REVIEW' })
```

```js
assert.deepEqual(review.details.conflicts.map(x => x.code), [`overlap:${tomOwn.id}`])
```

```js
assert.deepEqual(moved.map(v => [v.technicianId, v.local.date, v.local.start]).sort(), [[b.priya.id, '2026-11-06', '08:00'], [b.tom.id, '2026-11-06', '08:00']].sort())
```

```js
assert.deepEqual((await h.state()).visits.filter(v => v.crew?.groupId === crewDays[2].id).map(v => v.status), ['cancelled', 'cancelled'])
```

```js
b.office.run('visit.agree', { visitId: v.id, version: current.version, amount: amounts[i] }, { error: 'FORBIDDEN' })
```

```js
h.command('visit.agree', { visitId: tomVisit.id, version: tomVisit.version, amount: '100.00' }, { error: 'NOT_SUBCONTRACTOR' })
```

```js
assert.equal(totals.label, 'Totals for your filing, not a filed 1099')
```

```js
assert.deepEqual(totals.rows.map(r => [r.payeeName, r.tinLast4, r.visits, r.total, r.atOrOver600]), [['Sid Sub HVAC LLC', '4321', 2, '750.00', true]], 'the third day is not completed, so its $275.00 is not counted')
```

```js
assert.equal(csv.trim().split(/\r?\n/)[1], `Sid Sub HVAC LLC,4321,2,750.00,yes,"Totals for your filing, not a filed 1099"`)
```

```js
assert.equal((await h.request(`/api/glove/reports/1099.json?year=${year}`, { as: b.dispatcher.cookie })).status, 403)
```

```js
assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /123456789/)
```

```js
assert.equal(saved.completion.receivedAt, receivedAt)
```

```js
assert.equal(response.status, 200, await response.clone().text())
```

```js
assert.deepEqual({ ...actual, rows: actual.rows.sort(byPayee) }, { ...want, rows: [...want.rows].sort(byPayee) })
```

```js
assert.deepEqual(header, columns)
```

```js
assert.deepEqual(rows.sort((a, z) => a[0].localeCompare(z[0])), [...want.rows].sort(byPayee).map(r => [r.payeeName, r.tinLast4, String(r.visits), r.total, r.atOrOver600 ? 'yes' : 'no', label]))
```

```js
assert.equal(employee.subcontractor, null, 'delegated ordinary employee editing still works')
```

```js
person.run('technician.save', draft, { error: 'FORBIDDEN' })
```

```js
person.run('technician.save', { ...a, subcontractor }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await h.state(), before)
```

```js
b.manager.run('technician.save', { ...withoutPayee, name: 'Unauthorized rename' }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await h.state(), beforeOmitted)
```

```js
h.command('technician.save', { ...target, subcontractor: { payeeName: 'Refused payee', tinLast4 } }, { error: 'INPUT', commandId })
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.deepEqual(await read('/api/glove/export'), exported)
```

```js
assert.deepEqual(await read('/api/glove/activity'), activity)
```

```js
assert.equal(await h.db.prepare('SELECT result FROM glove_commands WHERE id=?').bind(commandId).first(), null)
```

```js
assert.deepEqual(a.subcontractor, { payeeName: 'Edited payee', tinLast4: '1234' })
```

```js
assert.equal(a.subcontractor, null)
```

```js
assert.deepEqual(a.subcontractor, { payeeName: 'Sid, "Cooling" LLC', tinLast4: '0042' })
```

```js
assert.ok(!stored.includes(JSON.stringify(value)), `rejected TIN ${value} is not retained`)
```

```js
assert.ok(!persisted.includes(value), 'full TIN is absent from persistent storage')
```

```js
assert.deepEqual(await h.command(replaySave.type, replaySave.payload, { commandId: replaySave.commandId }), replaySave.result)
```

```js
assert.deepEqual(await h.state(), beforeReplay, 'replay does not restore an old payee')
```

```js
b.manager.run('technician.save', employeePayload, { commandId: employeeCommandId, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await h.state(), afterWithdrawal, 'withdrawn authority cannot replay a previous edit')
```

```js
assert.deepEqual(first.result.agreed, { amount: '42.00', technicianId: a.id, by: 'Olivia Owner', at: '2026-12-30T12:00:00.000Z' })
```

```js
h.command('visit.agree', { visitId: editable.id, version: editable.version, amount: '999.00' }, { error: 'STALE' })
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal(changed.result.agreed.amount, '84.01')
```

```js
h.command('visit.agree', { visitId: editable.id, version: first.result.version, amount: null }, { error: 'STALE' })
```

```js
assert.deepEqual(await h.state(), before)
```

```js
person.run('visit.agree', { visitId: editable.id, version: changed.result.version, amount }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal(cleared.result.agreed, null)
```

```js
h.command('visit.agree', { visitId: employee.id, version: employee.version, amount: '99.00' }, { error: 'NOT_SUBCONTRACTOR' })
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.equal((await visit(uncompleted.id)).status, 'booked')
```

```js
assert.equal(response.status, 403)
```

```js
assert.doesNotMatch(await response.text(), /Cooling|0042|599\.99|600\.00|750\.25/)
```

```js
assert.deepEqual(await h.command(replayAgree.type, replayAgree.payload, { commandId: replayAgree.commandId }), replayAgree.result)
```

```js
assert.deepEqual(await replayComplete.person.run('visit.complete', replayComplete.payload, { commandId: replayComplete.commandId }), replayComplete.result)
```

```js
assert.deepEqual(await h.command(replaySave.type, replaySave.payload, { commandId: replaySave.commandId }), replaySave.result)
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.deepEqual(await read('/api/glove/activity'), activity)
```

```js
assert.equal(h.outbound.attempts, outbound, 'reading filing totals makes no provider request')
```

```js
assert.deepEqual(await h.state(), before, 'filing totals are read-only')
```

```js
assert.deepEqual((await h.db.prepare('SELECT id, result FROM glove_commands ORDER BY id').all()).results, commands)
```

```js
assertTrail(h, ['technician.saved', 'visit.agreed', 'capture.completion'])
```

```js
assert.equal(events.length, 1)
```

```js
assert.deepEqual([e.actorName, e.actorRole, e.subjectId], ['Olivia Owner', 'owner', wanted.subjectId])
```

```js
assert.ok(e.actorId && e.at && e.summary)
```

```js
assert.equal(exported.timeline.filter(x => x.command_id === wanted.commandId && x.kind === wanted.kind).length, 1)
```

```js
assert.equal(events.length, 1, 'one completion event, including after command replay')
```

```js
assert.deepEqual([events[0].actorId, events[0].actorName, events[0].actorRole, events[0].at],
        [person.id, person.name, person === b.tomPerson ? 'technician' : 'subcontractor', receivedAt])
```

```js
assert.equal(entries.length, 1)
```

```js
assert.equal(entries[0].actor_id, person.id)
```

```js
assert.equal(entries[0].at, receivedAt)
```

```js
assert.ok(exported.visits.some(v => v.id === visitId && v.completion.receivedAt === receivedAt))
```

```js
assert.deepEqual(exported.technicians.find(x => x.id === tech.id).subcontractor, want)
```

```js
h.command('timesheet.approve', { technicianId: tom.id, weekStart: '2026-12-28' }, { error: 'SUBCONTRACTOR' })
```

```js
assert.deepEqual(await h.state(), before)
```

```js
assert.deepEqual(result.people.map(p => [p.technicianId, p.hours.regular]), [[b.priya.id, '1.00']])
```

```js
assert.deepEqual(result.left, [{ technicianId: tom.id, name: 'Tom B.', reason: '1099 subcontractor: paid through the 1099-NEC totals, not payroll' }])
```

```js
assert.ok(rows.length > 1, `${kind} has an actual employee row`)
```

```js
assert.doesNotMatch(csv, /Tom|1099|7890|Cooling|0042|Lee Electric|6000/)
```

```js
assert.match(csv, kind === 'adp-run' ? /104/ : /Priya/)
```

```js
assert.equal(await read(`/api/glove/reports/payroll-${kind}.csv?${period}`, b.office.cookie), csv)
```

```js
assert.deepEqual(await assertPayroll(), payroll)
```

### tests/api/subcontractor-field.test.mjs

Assertions before: 80; assertions after: 80.

```js
assert.doesNotMatch(JSON.stringify(value), /876\.54|321\.09|765\.43|63\.21|Private employee|Private priced|Private second|Private equipment|Private maker|Private serial|Private install crew|Priya|Tom B|unitPrice|unitCost|costRate|agreed/)
```

```js
assert.equal(response.status, 200, `${path}: ${await response.clone().text()}`)
```

```js
assert.deepEqual(await sub.run(type, payload, { commandId }), result, 'lost-response replay returns the bounded original answer')
```

```js
assert.deepEqual(await h.state(), before, 'replay has no second effect')
```

```js
assert.deepEqual(await domain(h), exported)
```

```js
sub.run(type, payload, { error, commandId })
```

```js
assert.deepEqual(await h.state(), before, `${type} refusal leaves every record and event unchanged`)
```

```js
assert.deepEqual(await domain(h), exported)
```

```js
assert.equal(await h.db.prepare('SELECT id FROM glove_commands WHERE id=?').bind(commandId).first(), null)
```

```js
assert.deepEqual(sub.invitation, { status: 202, confirmationStatus: 303, path: '/auth/confirm' })
```

```js
assert.deepEqual([session.operator.id, session.operator.displayName, session.operator.role], [sub.id, 'Sid Field', 'member'])
```

```js
assert.deepEqual([s.actor.id, s.actor.name, s.actor.role, s.actor.roleName], [sub.id, 'Sid Field', 'subcontractor', null])
```

```js
assert.deepEqual(s.actor.commands.sort(), ['visit.arrive', 'visit.capture', 'visit.complete'])
```

```js
assert.deepEqual(s.actor.reads.sort(), ['file', 'state'])
```

```js
assert.deepEqual(s.technicians.map(x => [x.id, x.operatorId, x.name]), [[tech.id, sub.id, 'Sid Field']])
```

```js
assertTrail(h, ['role.set', 'technician.saved'])
```

```js
assert.ok(activity.some(e => e.kind === 'role.set' && e.subjectId === sub.id && e.actorRole === 'owner'))
```

```js
assert.equal(exported.technicians.find(x => x.id === tech.id).operatorId, sub.id)
```

```js
assert.ok((await sub.state()).captures.some(x => x.id === oldNote.id))
```

```js
assert.deepEqual(sorted((await sub.state()).visits).map(x => x.id), sorted([own, second, moved, cancelled]).map(x => x.id))
```

```js
assert.deepEqual(sorted(s.visits).map(v => [v.id, v.jobId, v.technicianId, v.local.date, v.local.start, v.local.end, v.local.timezone, v.status, v.assignments, v.lateEvidence]), sorted([
        { id: own.id, jobId: job.id, date: '2026-11-09' }, { id: second.id, jobId: secondJob.id, date: '2026-11-10' },
      ]).map(v => [v.id, v.jobId, tech.id, v.date, '09:00', '10:00', 'UTC', 'booked', [], []]))
```

```js
assert.deepEqual(Object.keys(v).sort(), ['id', 'version', 'jobId', 'technicianId', 'startAt', 'endAt', 'local', 'status', 'arrival', 'completion', 'lateEvidence', 'assignments'].sort())
```

```js
assert.deepEqual(sorted(s.jobs).map(j => [j.id, j.title, j.customerId, j.siteId, j.lines, j.checklist.map(i => [i.label, i.required]), j.forms.map(x => [x.name, x.formVersion, x.questions])]), sorted([
        { id: job.id, title: 'Dental field inspection', customerId: b.customer.id, siteId: b.site.id },
        { id: secondJob.id, title: 'River field inspection', customerId: f.secondCustomer.id, siteId: f.secondSite.id },
      ]).map(j => [j.id, j.title, j.customerId, j.siteId, [], [['Isolate supply', true], ['Inspect connections', true], ['Clean work area', false]], [['Frozen field inspection', 1, [{ id: 'safe', label: 'Supply isolated?', type: 'yesno', required: true }, { id: 'note', label: 'Inspection detail', type: 'notes', required: true }]]]]))
```

```js
assert.deepEqual(sorted(s.customers), sorted([{ id: b.customer.id, version: 1, name: 'Harbourview Dental', phone: '02 9555 0101' }, { id: f.secondCustomer.id, version: 1, name: 'River Clinic', phone: '212 555 0199' }]))
```

```js
assert.deepEqual(sorted(s.sites), sorted([{ id: b.site.id, version: 1, customerId: b.customer.id, address: '14 Harbour St, Balmain NSW 2041', accessNotes: 'Gate code at reception' }, { id: f.secondSite.id, version: 1, customerId: f.secondCustomer.id, address: '28 River Road', accessNotes: 'Use rear entrance' }]))
```

```js
assert.deepEqual(s.captures, [], 'no former-visit or employee capture')
```

```js
assert.deepEqual(populated, ['business', 'customers', 'jobs', 'sites', 'technicians', 'visits'])
```

```js
assert.deepEqual(await check(), before)
```

```js
sub.run('visit.capture', oldPayload, { commandId: oldCommand, error: 'FORBIDDEN' })
```

```js
assert.deepEqual(await domain(h), afterMove)
```

```js
assert.deepEqual(s.jobs.map(j => j.id), [job.id])
```

```js
assert.deepEqual(s.customers.map(c => c.id), [b.customer.id])
```

```js
assert.deepEqual(s.sites.map(x => x.id), [b.site.id])
```

```js
assert.equal(s.visits.find(v => v.id === second.id).arrival, null, 'a previous worker arrival is not this person’s work')
```

```js
refuse('visit.complete', { visitId: second.id, deviceTime: at, summary: 'Cannot use previous arrival', signoff: { absentReason: 'Customer away' } }, 'NO_ARRIVAL')
```

```js
assert.equal(arrival.technicianId, tech.id)
```

```js
refuse(type, { visitId, deviceTime: at, kind: 'note', text: 'After assignment ends' })
```

```js
refuse(type, { visitId: employee.id, deviceTime: at, ...fields })
```

```js
assert.equal(s.captures.length, 10, 'these nine captures plus the independently recorded second-site arrival')
```

```js
assert.deepEqual(captures.map(x => x.kind).sort(), ['arrival', 'checklist', 'checklist', 'checklist', 'completion', 'form', 'material', 'note', 'photo'].sort())
```

```js
assert.ok(captures.every(x => x.visitId === own.id && x.technicianId === tech.id && x.receivedAt === at && x.deviceTime === at))
```

```js
assert.deepEqual(job.checklist.map(i => { const c = captures.find(c => c.itemId === i.id); return [c.label, c.result, c.note] }), [['Isolate supply', 'done', ''], ['Inspect connections', 'not applicable', 'No connection fitted'], ['Clean work area', 'done', '']])
```

```js
assert.equal(captures.find(x => x.kind === 'note').text, 'Supply isolated and inspected')
```

```js
assert.equal(photo.caption, 'Safe isolation at the panel')
```

```js
assert.deepEqual([material.description, material.quantity, material.unit, material.serviceId], ['Unpriced conduit', '2.5', 'ft', null])
```

```js
assert.deepEqual([form.formName, form.answers], ['Frozen field inspection', [{ questionId: 'safe', label: 'Supply isolated?', type: 'yesno', value: true }, { questionId: 'note', label: 'Inspection detail', type: 'notes', value: 'Frozen inspection completed' }]])
```

```js
assert.deepEqual([s.visits.find(x => x.id === own.id).status, s.visits.find(x => x.id === own.id).completion.summary], ['completed', 'Inspection complete'])
```

```js
assertTrail(h, ['capture.arrival', 'capture.checklist', 'capture.note', 'capture.photo', 'capture.material', 'capture.form', 'capture.completion'])
```

```js
assert.ok(event)
```

```js
assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.jobId], [sub.id, 'Sid Field', 'subcontractor', at, job.id])
```

```js
assert.equal(activity.filter(e => e.commandId === commandId && e.kind === kind).length, 1)
```

```js
assert.deepEqual([entry.actor_id, entry.actor_name, entry.actor_role, entry.at, entry.job_id, entry.summary], [sub.id, 'Sid Field', 'subcontractor', at, job.id, event.summary])
```

```js
assert.equal(exported.captures.filter(c => c.id === commandId).length, 1)
```

```js
assert.equal(exported.timeline.filter(e => e.command_id === commandId && e.kind === kind).length, 1)
```

```js
assert.deepEqual(await sub.state(), before)
```

```js
assert.deepEqual(await sub.run(type, payload, { commandId }), result)
```

```js
assert.deepEqual(await sub.state(), before)
```

```js
assert.equal(ownFile.status, 200)
```

```js
assert.deepEqual(Buffer.from(await ownFile.arrayBuffer()), Buffer.from(png, 'base64'))
```

```js
assert.equal(response.status, 404)
```

```js
assert.equal((await h.request(`/api/glove/exports/${csv.id}.csv`)).status, 200)
```

```js
assert.equal(response.status, 403, `${path}: ${await response.clone().text()}`)
```

```js
assert.deepEqual((await read(h, `/api/glove/jobs/${j.id}/timeline`, sub.cookie)).events, [])
```

```js
assert.deepEqual(activity.events, [])
```

```js
assert.ok(history.entries.every(e => e.id === job.id || [own.id, ...trail.map(x => x.commandId)].includes(e.id)))
```

```js
assert.equal((await h.request(`/api/glove/equipment/${f.equipment.id}`, { as: sub.cookie })).status, 404)
```

```js
assert.deepEqual(push.devices, [])
```

```js
refuse(type, { visitId: second.id, deviceTime: at, ...payload })
```

```js
assert.equal(h.pushes.sent.length, 0)
```

```js
assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_push_subscriptions').first()).n, 0)
```

```js
sub.run(saved.type, saved.payload, { commandId: saved.commandId, error: 'FORBIDDEN' })
```

```js
assert.equal(erased.ok, false, 'erased capture cannot be resurrected')
```

```js
assert.ok(['FORBIDDEN', 'ERASED'].includes(erased.error.code))
```

```js
assert.deepEqual(await domain(h), afterErase)
```

```js
assert.equal((await h.request(`/api/glove/files/${photo.file.fileId}`, { as: sub.cookie })).status, 404)
```

```js
assert.doesNotMatch(JSON.stringify(await sub.state()), /Supply isolated and inspected|Safe isolation at the panel|Frozen inspection completed|Harbourview Dental/)
```

```js
assert.ok(revoked.status < 400)
```

```js
assert.equal((await h.request('/api/glove/state', { as: sub.cookie })).status, 401)
```

```js
assert.equal(denied.status, 401)
```

```js
assert.deepEqual(await domain(h), afterErase)
```

### tests/api/suggest.test.mjs

Assertions before: 24; assertions after: 24.

```js
b.office.run('quote.suggest', { enquiryId: request.id }, { error: 'FORBIDDEN' })
```

```js
b.agent.run('quote.suggest', { enquiryId: request.id }, { error: 'MODEL' })
```

```js
assert.deepEqual(after.quotes, before.quotes, label)
```

```js
assert.deepEqual(after.enquiries, before.enquiries, label)
```

```js
assert.equal(after.events.filter(event => event.kind === 'quote.suggested').length, before.events.filter(event => event.kind === 'quote.suggested').length, label)
```

```js
assert.equal(h.models.calls.length, calls + 1, `${label}: no retry`)
```

```js
assert.deepEqual(options.map(o => [o.name, o.lines.map(l => [l.serviceId, l.quantity, l.unitPrice])]), [
      ['Good', [[tune.id, '1', '149.00']]],
      ['Better', [[tune.id, '1', '149.00'], [sensor.id, '1', '129.00']]],
      ['Best', [[replace.id, '1', '4890.00']]],
    ])
```

```js
assert.deepEqual(quote.drafted.reasons.map(r => [r.optionId, r.name, r.reason]), options.map((o, i) => [o.id, o.name, answer[['good', 'better', 'best'][i]].reason]))
```

```js
assert.match(quote.drafted.label, /^Drafted by the model from the request/)
```

```js
assert.deepEqual([quote.title, quote.enquiryId, quote.revisions[0].preparedBy.role], ['Furnace short-cycling', request.id, 'agent'])
```

```js
assert.equal(call.body.store, false)
```

```js
assert.equal(sent.request.description, request.description)
```

```js
assert.deepEqual(sent.equipment.map(e => [e.type, e.ageYears]), [['Gas furnace', 15]])
```

```js
assert.deepEqual(Object.keys(sent).sort(), ['equipment', 'pastJobs', 'priceBook', 'request'])
```

```js
assert.ok(sent.pastJobs.some(j => j.completed.includes('Cleaned filters and coil')))
```

```js
assert.deepEqual(sent.priceBook.map(x => x.code).sort(), ['FLAME-SNS', 'FURN-96', 'FURN-TUNE', 'R32-KG', 'SPLIT-SVC'])
```

```js
assert.doesNotMatch(call.body.messages[1].content, /unitCost|2100|Harbourview|Harbour St|9555|Mei Lin|harbourview\.example|Priya|Tom B/)
```

```js
assert.equal(quote.status, 'draft')
```

```js
b.agent.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 }, { error: 'FORBIDDEN' })
```

```js
b.agent.run('quote.markSent', { quoteId: quote.id, version: quote.version, revision: 1, channel: 'email' }, { error: 'FORBIDDEN' })
```

```js
assert.deepEqual([approved.status, approved.revisions[0].approval.name], ['approved', 'Sam Ortiz'])
```

```js
assert.equal(s.enquiries.find(e => e.id === request.id).status, 'quoted')
```

```js
assert.ok(s.events.some(e => e.kind === 'quote.suggested' && e.subjectId === quote.id))
```

```js
assertTrail(h, ['model.connected', 'model.outcome', 'quote.suggested', 'quote.approved'])
```

Cited-name verification: all 14 explicitly cited registration names in the touched files remain registered. CONTRACT.md and both generated views match merged main byte for byte. See cited-name-receipt.json.

Evidence transport: the initial 17-file packet was fetched by exact evidence head and verified against every manifest hash and Git blob ID. The final packet includes that receipt and the completed/success exact-SHA Verify receipt. GitHub API usage: four calls. No blockers remain; no clause status changes or DONE claims.
