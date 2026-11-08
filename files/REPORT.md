# PAY-007 continuation: sx-glove-c-f151

Plan: retain the eight focused public-command journeys from the prior candidate; integrate current main; close any demonstrated payout boundary defect; run the focused API suite, preserved payment and deposit suites, typecheck and first-party check; record the existing payout browser journey at 1440 and 390; regenerate contract views for validation only, restore them from main, regenerate the source lock last, and publish only the named product branch. Publish this complete report packet separately. No contract judgment cells are edited.

Starting proof: prior candidate 122cf08f3baa7ec9100311f8b29e9da3026c9ee1 has push Verify 42507940358 completed successfully. All eight focused API journeys and typecheck pass locally after rebase onto current main.

A new public-command probe found that an oversized terminal provider page bypasses the 1,000-row total limit. The existing ten-page limit only catches a provider that honors the requested page size. The added case supplies 1,001 valid rows in one terminal page at the Stripe network edge; it must refuse PAYOUT_LIMIT without writing any payout. The before-repair execution fails because the command accepts the oversized page. The source repair will enforce the accumulated row limit independently of provider pagination.

Provider boundary: only Stripe transport is faked; native owner Checkout, authenticated outcomes, actual Worker runtime, D1, role checks, exports, replay and restart remain real. This proves test-mode inspection and explicit books allocation, never live settlement, bank confirmation, provider activation or money movement.

Contract and plan judgments remain fleet-owned. PAY-025, PAY-026 and all unrelated holds remain unchanged. No new policy default is adopted. No PR is required by the repository branch workflow.

## Exact candidate and results

Product branch: cloud/sx-glove-c-f151. Candidate: 659a4d29a251899f46dfcf09a9af63265d9381a7. Integrated origin main: 508403025ce0d57d57c24dae142f16f8fb190285. Full-history clone; published history was never rewritten. Counts before and after remain 19 DONE, 215 PARTIAL, 29 MISSING, all 263 rows retained. Proposed PAY-007 judgment: DONE upon independent landing gate; builders changed no status rows. No further clause was started. Existing payment and deposit-batch assertions are preserved. Eight focused test registrations are carried from the previous candidate; this continuation adds no registration.

The oversized-page regression was observed accepting 1,001 rows with reconciled true. The repair rejects total rows above 1,000 before consuming that page, with no retained change. See oversized-before.log for the actual failing assertion. This is a new locally reproduced defect, not a hosted Verify repair.

## Acceptance proof rows

- R1, acceptance point 1: local PASS. `Six native Owner Checkout payments and a confirmed refund reconcile to $584.20; adding the missing source leaves it named unmatched. Explicit test Instant Payout returns bank $1,000, fee $15, source net $1,015 and zero difference. Restart and replay preserve financial facts and call counts.` Proof: tests/api/payout-reconciliation.test.mjs:62, PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay. Public doors: authenticated commands, state, Activity and business export. Verify push event: run 42510897436 at 659a4d29a251899f46dfcf09a9af63265d9381a7; conclusion pending at discovery.

- R2, acceptance point 2: local PASS. `Three populated inspection and allocation events have exact current Owner identity, role, command, time and Stripe reference in Activity and the opened business export; connected synthetic keys and private Checkout data are absent.` Proof: tests/api/payout-reconciliation.test.mjs:92, PAY-007 point 2: every inspection and reviewed allocation has attributable secret-free Activity and business export facts. Public doors: authenticated commands, state, Activity and business export. Verify push event: run 42510897436 at 659a4d29a251899f46dfcf09a9af63265d9381a7; conclusion pending at discovery.

- R3, acceptance point 3: local PASS. `Unscoped signed-in Owner succeeds. Office, Dispatcher, Technician, custom role, integration token, revoked token, signed-out person and branch-limited Owner are refused. A former Owner cannot read a saved outcome after withdrawal, including after restart. Live mode, foreign currency and non-positive bank amounts refuse without retained changes.` Proof: tests/api/payout-reconciliation.test.mjs:126, PAY-007 point 3: only a signed-in unscoped Owner inspects positive USD test payouts. Public doors: authenticated commands, state, Activity and business export. Verify push event: run 42510897436 at 659a4d29a251899f46dfcf09a9af63265d9381a7; conclusion pending at discovery.

- R4, acceptance point 4: local PASS. `1,000 rows reconcile over ten correctly cursor-paged calls. 1,001 rows across pages or one oversized final page refuse PAYOUT_LIMIT; empty has-more, duplicate rows, repeated cross-page rows and inconsistent cents refuse without changing state. Unsupported, missing payment, missing refund, unconfirmed payment and refund, wrong gross, wrong fee, unavailable fee and currency each have their own attempted wrong source. Refused-command output and provider-call counts remain identical after actual restart and replay.` Proof: tests/api/payout-reconciliation.test.mjs:179, PAY-007 point 4: ten pages reconcile exactly 1000 rows; overflow, incomplete pages, duplicates, inconsistent rows and wrong sources refuse safely. Public doors: authenticated commands, state, Activity and business export. Verify push event: run 42510897436 at 659a4d29a251899f46dfcf09a9af63265d9381a7; conclusion pending at discovery.

- R5, acceptance point 5: local PASS. `Bank $98.75 plus fee $0.25 equals source net $99; one cent below and above do not reconcile. Pending, in_transit, failed and canceled statuses never reconcile; source payments remain identical.` Proof: tests/api/payout-reconciliation.test.mjs:239, PAY-007 point 5: bank plus payout fee must equal source net exactly and only paid payouts reconcile. Public doors: authenticated commands, state, Activity and business export. Verify push event: run 42510897436 at 659a4d29a251899f46dfcf09a9af63265d9381a7; conclusion pending at discovery.

- R6, acceptance point 6: local PASS. `After retaining a valid inspection, missing, empty, null, negative and fractional payout fees refuse without changing retained payouts. Restart preserves refusal.` Proof: tests/api/payout-reconciliation.test.mjs:259, PAY-007 point 6: an unavailable payout fee refuses without changing any retained payout. Public doors: authenticated commands, state, Activity and business export. Verify push event: run 42510897436 at 659a4d29a251899f46dfcf09a9af63265d9381a7; conclusion pending at discovery.

- R7, acceptance point 7: local PASS. `Manual inspection returns no items or source attribution, reconciled false, and source allocation not reviewed. No available payment is automatically allocated; restart and replay preserve that outcome.` Proof: tests/api/payout-reconciliation.test.mjs:277, PAY-007 point 7: a manual payout has no Stripe source attribution before owner review. Public doors: authenticated commands, state, Activity and business export. Verify push event: run 42510897436 at 659a4d29a251899f46dfcf09a9af63265d9381a7; conclusion pending at discovery.

- R8, acceptance point 8: local PASS. `Only explicit Owner allocation reconciles bank $98.75, fee $0.25, source net $99 and the independently identified payment. Other unreviewed payouts remain unmatched; duplicate allocation refuses unchanged. Source erasure keeps anonymous bank aggregates while blocking fresh reads, allocation and saved replay before provider calls, through restart.` Proof: tests/api/payout-reconciliation.test.mjs:288, PAY-007 point 8: only explicit owner books allocation reconciles manual sources and other unreviewed payouts remain unmatched. Public doors: authenticated commands, state, Activity and business export. Verify push event: run 42510897436 at 659a4d29a251899f46dfcf09a9af63265d9381a7; conclusion pending at discovery.

## Inherited duties and riders

Inherited BASE-AUDIT-001: point 2 reads populated Activity and the business export and compares exact actor, command, timestamp and provider reference. No new deletion or legal assertion is inferred. DATA-002 custody is covered there; customer erasure and replay protection are exercised by point 8. PAY-025 remains separately owned and its existing depositBatchQualification helper runs unchanged from payments.test.mjs. PAY-026 remains separately owned; the existing preview and explicit test confirmation are used only to produce its real native inspection input.

- Rider 1: PASS locally, hosted qualification pending. All eight public-door tests above reach every named outcome. The changed built page is inspected by tests/browser/receivables.spec.ts:234.

- Rider 2: PASS. Actual native seeded financial data; permitted operations and unsafe refusals, unchanged-state comparisons, independently expected cents and references.

- Rider 3: PENDING exact-SHA Verify. Verification manifest already selects API test glob and the existing browser runner; push Verify 42510897436 is in progress at discovery. No workflow changes or dispatch.

- Rider 4: PASS. API final source ran locally; exact committed-SHA rerun recorded separately. Browser proof ran after source fix; only refusal assertions and their source-lock hash changed afterward, with no browser, fixture, harness or product-code byte changes.

- Rider 5: PASS. PAY-007 metadata explicitly cites BASE-AUDIT-001 at CONTRACT.md:2003; point 2 proves that duty.

- Rider 6: PASS mechanical. Contract generator write and check pass. Generated views restored from origin main. No Status, Gap or Evidence cell changed; fleet writes the judgment after its gate.

- Rider 7: PASS. No acceptance sentence or ruling changed; no coverage rewrite.

- Rider 8: PASS. Point 3 exercises all excluded current identities and revoked credentials; point 8 explicitly allocates, refuses duplicate use, erases and fences saved replay.

- Rider 9: PASS. Clause explicitly permits Stripe fake; only test inspection and books allocation are claimed. No live settlement, money movement, legal compliance or bank confirmation.

- Rider 10: INAPPLICABLE. Existing owner-only authority retained; no policy default adopted.

- Rider 11: PENDING guarded landing. Main does not equal candidate yet. Fleet must establish exact-SHA Verify, COMPLETE full-history publication scan with zero findings, landing and Run site. No cloud push to main.

## Pre-ready self-check

1. Every outcome is exercised through native doors using populated fixtures; unsafe money and authority cases are refused unchanged. Hosted exact-SHA proof remains explicitly pending until the run completes.
2. No existing assertion is removed, narrowed or moved behind a new width or branch condition in this continuation. The inherited additive browser checks keep established journeys intact.
3. Revoked integration credentials and former Owners are refused. Erased payout sources cannot reappear through command replay or restart; anonymous financial aggregates remain.
4. No screen implementation changed. Browser proof shows the existing owner screens at 1440 and 390. Existing visible controls have text; the journey audits icon-only controls and horizontal overflow. No new configuration placement or border is introduced.
5. Source lock check passes. New product additions contain no email-shaped literal or provider-shaped key. Publication scan and Run site belong to the fleet landing gate and are unestablished here.

Publication scan receipt: commit=659a4d29a251899f46dfcf09a9af63265d9381a7; complete=NOT_RUN_CLOUD; historyScanned=UNESTABLISHED; findings=UNESTABLISHED. This is honest pending fleet custody, never a zero-findings claim. Main equality: false before landing. Run site: not run on this branch.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses PAY-007 then check exit=0; ledger=none exit=0. No migration changed.

PROBE PAY-007 1: public Owner commands and reads -> Six native Owner Checkout payments and a confirmed refund reconcile to $584.20; adding the missing source leaves it named unmatched. Explicit test Instant Payout returns bank $1,000, fee $15, source net $1,015 and zero difference. Restart and replay preserve financial facts and call counts.

PROBE PAY-007 2: public Owner commands and reads -> Three populated inspection and allocation events have exact current Owner identity, role, command, time and Stripe reference in Activity and the opened business export; connected synthetic keys and private Checkout data are absent.

PROBE PAY-007 3: public Owner commands and reads -> Unscoped signed-in Owner succeeds. Office, Dispatcher, Technician, custom role, integration token, revoked token, signed-out person and branch-limited Owner are refused. A former Owner cannot read a saved outcome after withdrawal, including after restart. Live mode, foreign currency and non-positive bank amounts refuse without retained changes.

PROBE PAY-007 4: public Owner commands and reads -> 1,000 rows reconcile over ten correctly cursor-paged calls. 1,001 rows across pages or one oversized final page refuse PAYOUT_LIMIT; empty has-more, duplicate rows, repeated cross-page rows and inconsistent cents refuse without changing state. Unsupported, missing payment, missing refund, unconfirmed payment and refund, wrong gross, wrong fee, unavailable fee and currency each have their own attempted wrong source. Refused-command output and provider-call counts remain identical after actual restart and replay.

PROBE PAY-007 5: public Owner commands and reads -> Bank $98.75 plus fee $0.25 equals source net $99; one cent below and above do not reconcile. Pending, in_transit, failed and canceled statuses never reconcile; source payments remain identical.

PROBE PAY-007 6: public Owner commands and reads -> After retaining a valid inspection, missing, empty, null, negative and fractional payout fees refuse without changing retained payouts. Restart preserves refusal.

PROBE PAY-007 7: public Owner commands and reads -> Manual inspection returns no items or source attribution, reconciled false, and source allocation not reviewed. No available payment is automatically allocated; restart and replay preserve that outcome.

PROBE PAY-007 8: public Owner commands and reads -> Only explicit Owner allocation reconciles bank $98.75, fee $0.25, source net $99 and the independently identified payment. Other unreviewed payouts remain unmatched; duplicate allocation refuses unchanged. Source erasure keeps anonymous bank aggregates while blocking fresh reads, allocation and saved replay before provider calls, through restart.

## Claim

CLAIM PAY-007 DONE points=1,2,3,4,5,6,7,8 tests=tests/api/payout-reconciliation.test.mjs#PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay; tests/api/payout-reconciliation.test.mjs#PAY-007 point 2: every inspection and reviewed allocation has attributable secret-free Activity and business export facts; tests/api/payout-reconciliation.test.mjs#PAY-007 point 3: only a signed-in unscoped Owner inspects positive USD test payouts; tests/api/payout-reconciliation.test.mjs#PAY-007 point 4: ten pages reconcile exactly 1000 rows; overflow, incomplete pages, duplicates, inconsistent rows and wrong sources refuse safely; tests/api/payout-reconciliation.test.mjs#PAY-007 point 5: bank plus payout fee must equal source net exactly and only paid payouts reconcile; tests/api/payout-reconciliation.test.mjs#PAY-007 point 6: an unavailable payout fee refuses without changing any retained payout; tests/api/payout-reconciliation.test.mjs#PAY-007 point 7: a manual payout has no Stripe source attribution before owner review; tests/api/payout-reconciliation.test.mjs#PAY-007 point 8: only explicit owner books allocation reconciles manual sources and other unreviewed payouts remain unmatched

Exact committed-SHA local proof: Node 22.20.0 ran `node --test --test-concurrency=1 tests/api/payout-reconciliation.test.mjs tests/api/payments.test.mjs` at 659a4d29a251899f46dfcf09a9af63265d9381a7; exit 0, 15 tests passed, zero failed or skipped. PAY-025 qualification remains invoked by the preserved payments journey. `git diff` confirms the browser-relevant product, fixture, harness and journey bytes match the successful screenshot run. Both generated documents and all contract judgments, existing payment assertions, deposit helper and Verify workflow match origin main.

Observed integrated main has successful Verify 42510192151 and successful Run site 42510192005 at 508403025ce0d57d57c24dae142f16f8fb190285. These baseline runs are not used as candidate proof.

Plan-row handoff: PAY-007 PARTIAL to proposed DONE, points 1 through 8. Existing source counts stay 19 DONE, 215 PARTIAL, 29 MISSING; if the fleet gate accepts this one-clause judgment, proposed counts are 20 DONE, 214 PARTIAL, 29 MISSING. No shared plan or inbox file was read or written.
