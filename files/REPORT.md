# PAY-025 qualification plan and results

Tag: sx-glove-c-f129. Repository: just-every/run-glove. Product branch: cloud/sx-glove-c-f129.

Plan:
1. Preserve all existing payment and receivables assertions. Extend the existing payout sanity journey through focused helpers, with no added test registrations because the inherited suite already exceeds its stated cap.
2. Point 1: record independent cash and check receipts on native invoices in two branches. Check exact net cents, cardinality boundaries, invalid selections, simultaneous claims, replay and durable restart. Exercise mixed currencies through the documented ServiceM8 opening-balance import and a native AUD invoice.
3. Point 2: populate provider payouts and fee records, then inspect state, complete paginated Activity, business export and command replay as the unscoped Owner, unlimited Office, scoped Office and scoped Owner. Attempt excluded roles and integration tokens, withdraw authority and restart.
4. Point 3: preview and erase one paying customer in shared deposit and provider source records. Check disappearance of identity and personal receipt details, preserved totals and peer sources, and replay after restart.
5. Repair only defects exposed through these public doors. Run touched API tests, typecheck, first-party check, generator write and check; restore generated views; regenerate and check the source lock last.
6. Commit with fleet identity and hooks, push only the named product branch, inspect exact-SHA Verify through REST within budget, and publish the explicit non-secret evidence packet on its separate evidence branch. The fleet owns scanning, main integration and Run site.

Initial contract status: PAY-025 PARTIAL. No contract Status, Gap or Evidence edits are authorized. Existing proof is the combined payout API test and receivables browser journey; independent boundary, scope and erasure outcomes above are not yet fully asserted.

Implemented outcomes:
- The existing payout sanity registration now calls `tests/api/deposit-batches.mjs#depositBatchQualification`. No test registration or existing assertion was removed or added. It seeds native approved invoices for three customers across East and West, records separate Office cash and check receipts, and drives every new assertion through authenticated HTTP commands and read doors.
- Exact retained amounts: four-receipt shared batch USD 222.08 after two earlier refunds of USD 23.11 and USD 8.02; one-receipt batch USD 21.09; 100-receipt batch USD 16.92 after refunds of USD 0.03 and USD 0.05; concurrent contested receipt USD 32.18 claimed once. The 100-receipt batch contains fifty receipts of USD 0.11 and fifty of USD 0.23. Empty, 101-record, repeated-ID, refund, card, hosted ACH, unpaid hosted, missing-record, already-batched, mixed-branch and mixed-currency selections are refused without domain record or event changes.
- Mixed currencies are real public-door records: a native AUD invoice and a documented ServiceM8 USD opening balance, followed by Office receipts in each currency. No SQL creates payment, payout, invoice or erasure state in the new proof.
- Populated state, every Activity page, business export and saved outcomes prove unscoped Owner provider and fee visibility, unlimited Office batch-only visibility, and scoped Owner and Office exact branch batches. Technician, Dispatcher, Agent and integration-token writes are refused. A revoked token cannot read; role and branch withdrawal suppress saved results. Actual Worker disposal and recreation with surviving D1 reproduce the same state and outcomes.
- One paying customer is previewed and erased from a shared batch and a two-customer Stripe source payout. Personal identity, receipt references and source links disappear; USD 222.08 and USD 194.00 retained bank totals, the peer's original source item and every peer receipt remain. Old outcomes, fresh provider reinspection and fresh batching of erased receipts cannot restore personal data. The same assertions pass after another actual Worker restart.

Defects reproduced and repaired:
1. A batch note quoting the payer's check reference retained that reference after erasure. `erasure-before.log` records the failing public-door assertion. `src/glove/privacy.ts` now redacts those personal receipt and provider references in the affected shared payout note.
2. A formerly unscoped Owner could replay a fee-schedule command after receiving a branch limit, and an ordinary saved business outcome could retain that schedule. `saved-outcome-before.log` records the exposed provider pricing. `src/glove/view.ts` now refuses provider payout outcomes outside current unscoped Owner authority and removes fee schedules from other projected outcomes.
3. Review caught a numeric-reference collision in the first correction: a receipt reference equal to the bank amount redacted the amount itself. `numeric-reference-before.log` records actual `[erased]` versus expected `222.08`. The final redaction applies expanded receipt values only to the note, preserving numeric bank facts. The journey asserts both removal from the note and preservation of the equal amount.
4. A fresh `payout.reconcile` after erasure fetched the erased provider reference again and changed the retained payout to unmatched. `provider-refresh-before.log` records that public-door result. A value-free erasure marker now fences provider reinspection or reallocation of that retained payout before provider fetches; its anonymous bank history and the other customer's retained detail remain readable. This grants no provider deletion or money authority.

No policy default, new acceptance point, provider activation, Base change, migration, UI change, homepage change or release is included. PAY-002, PAY-007, PAY-026 and all other held obligations retain their existing boundaries. Provider responses are faked only at the Stripe transport edge; no live settlement, bank confirmation or remote erasure is claimed.

5. A peer-only batch note could quote the erased payer's receipt even though none of its sources belonged to that payer. `peer-note-before.log` records the surviving private check reference. The final erasure scope follows affected payout ids only into payout notes, their audit copies, proposal custody and saved outcomes; it does not expand ownership into peer payment records. Preview counts include all three affected payout rows. The peer's 100 sources and USD 16.92 bank total remain exact, while replay of its old personal note is refused.

Candidate and custody:
- Final head: 3a5be004a8ecc2979b4186b10a3621a85b9014c7.
- Branch: cloud/sx-glove-c-f129. Product push succeeded without retries or force pushes.
- Current main 3a6b0e410f4b2744b7c0d293a71c9cae4d3113d2 was merged after the first published save. That main update changed ancestry only. The final merge preserves both product commits and main's judgments.
- Superseded first head: 7110144fd622fab235334891a4f59c7169ed3cc2; its Verify run was 42483430450 and is not the final candidate's proof.
- Final exact-head push Verify: 42485455360, https://github.com/just-every/run-glove/actions/runs/42485455360. Final conclusion is recorded in `receipt.json` and `ci.json` after observation.
- No PR is required or created: Verify accepts named branch pushes.
- Contract judgments and counts remain 14 DONE, 220 PARTIAL and 29 MISSING before and after. PAY-025's source row remains PARTIAL. This report proposes DONE for points 1, 2 and 3; after independent acceptance its count effect would be 15 DONE, 219 PARTIAL and 29 MISSING.
- Plan row qualified: PAY-025 only. No read-only fleet plan, inbox, Status cell, Gap cell, Evidence cell or generated view is edited. All 263 source Status rows remain.

Local validation:
- Node 22.20.0, the checkout's accepted runtime, ran the final API proof. No dependency or Base pin changed.
- `node --test --test-concurrency=1 tests/api/payments.test.mjs tests/api/privacy.test.mjs`: 12 passed, 0 failed, covering the final production source. The last test-only addition also checks the same erasure fence through `payout.allocate`.
- On the exact final head, `node --test --test-name-pattern='PAY-007, PAY-025, PAY-026' tests/api/payments.test.mjs`: 1 passed, 0 failed, including that final allocation refusal.
- `pnpm typecheck`: exit 0. `npx -y @runeditrun/rer check --profile first-party`: exit 0.
- `node scripts/contract-docs.mjs write --clauses PAY-025`, then `node scripts/contract-docs.mjs check --clauses PAY-025`: exit 0. Generated views were restored from current main and neither is committed.
- Source lock regenerated last with `node scripts/edition-authoring/cli.mjs lock`; its `check` exits 0. No migration or ledger change is present.
- The preserved receivables payout browser journey runs through real fresh setup and dev, with Chromium at the requested executable and a 20-minute timeout. Its final-head result and nine screenshots are returned in the packet.

PROBE PAY-025 1: authenticated payment and deposit commands on independently recorded receipts -> USD 222.08 net, 1 and 100 accepted, 0 and 101 refused, all invalid selections unchanged, one concurrent winner, identical restart and replay.
PROBE PAY-025 2: populated state, complete Activity, business export and saved commands under current roles and branches -> only unscoped Owner provider facts, exact permitted branch batches, denied Technician, Dispatcher and token writes, revoked access denied.
PROBE PAY-025 3: owner preview and confirmed erasure of one paying customer -> three shared payout copies cleaned, personal saved outcomes and fresh provider reads refused, peer sources and exact anonymous bank totals retained after actual restart.
MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write and check --clauses PAY-025 exit=0; ledger=none exit=0.

No local proof replaces fleet landing: main equality, full-history publication scanning and Run site on the eventual main head remain the guarded lander's duties. No scan result or Run site success is fabricated. No live provider confirmation or deletion is asserted.

`PROOF.md` carries one row for each acceptance sentence, the native lease rubric, inherited receiving duties, all eleven DONE-RIDERS and the five self-checks. The local result supports ACCEPT ON LANDING; rider 11 is intentionally pending fleet landing and the workflow's actual conclusion is kept separate in the final receipt. No live external dependency blocks the three PAY-025 points.

Final recorded CI: Verify 42485455360, event push, completed SUCCESS on 3a5be004a8ecc2979b4186b10a3621a85b9014c7, observed 2026-11-08T13:43:17Z. Four GitHub API calls were used in total; no workflow was dispatched or rerun. Exact-head browser proof also passed: one preserved journey, both requested widths, nine screenshots. All local commands have completed and owned browser and server processes are stopped.

CLAIM PAY-025 DONE points=1,2,3 tests=tests/api/payments.test.mjs#PAY-007, PAY-025, PAY-026 six confirmed payments, refund and fees reconcile exactly; missing source is named; explicit Instant Payout fee and cash/check batches never duplicate

Blockers: none for the three requested PAY-025 points. DONE-RIDERS 1 through 10 pass; row 11 awaits the guarded lander's actual scan, main integration and Run site. Contract counts remain unchanged until that gate accepts the claim. Full history and exact branch custody are verified. The scratch clone is removed only after evidence publication is verified; the actual packet remains under the fleet work directory.
