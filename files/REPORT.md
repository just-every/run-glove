# sx-glove-c-f150 — MONEY-005 proof

Repository: just-every/run-glove. Branch: cloud/sx-glove-c-f150. Current product head: 34f1d9c10ff33fe2e74ee14e52bf1ba011ede43e.
The final candidate and CI receipt are recorded in RECEIPT.json. Product history and report transport are separate.

## Plan and execution

1. Read the shipped plan, all eight MONEY-005 acceptance points, current Status Gap, the eleven DONE riders, the relevant rulings, launcher rules and repository instructions. The missing native qualification was points 1–3 and 5–7. Points 4 and 8 retained their existing money and browser proof. No new policy decision or external key was needed.
2. Keep the existing money tests intact. Add three focused public-command sanity journeys, using actual native sign-in, D1 and the production Worker. Extend only the existing provider edges to return real HTTP refusals and to simulate an unreachable transport inside the Worker. Exercise allowed proposals and refused answers, inspect unchanged settings and private records, and restart the actual Worker with retained D1.
3. Prove each exact Stripe request and every supported service classification, and each exact AvaTax SalesOrder on both hosts. Prove command replay, owner authority, private sealed-value custody, exact millionth rounding, unsupported treatments and manual application.
4. Extend the existing owner money browser journey: deliberately save 7.75% with labor taxed, choose and review a Stripe 8.25% labor-exempt proposal, confirm lookup leaves settings unchanged, apply its values through ordinary business settings and reload. Repeat that review and application for AvaTax. Capture the proposal and application screens at 1440 and 390; run behavioral assertions at 1440.
5. Extend the actual archive journey: use the public connect and lookup doors, export the installation, inspect archive bytes and its manifest, import into a fresh installation, reject the old session, refuse a new lookup until reconnection, replay old outcomes without a provider call, and explicitly reconnect before one fresh lookup. Preserve all existing archive assertions.
6. Run touched API tests, browser journey, actual portability script, typecheck, production build and first-party check. Generate and check contract views, restore the generated files from main, then regenerate and check the source lock last. Preserve every Status, Gap and Evidence cell. Save the first real commit with skipped CI, merge fresh main without rewriting published history, then publish the final candidate and exact-head evidence packet.

## Production findings

The Stripe public-command proof failed because a standard-rated response of zero became an automatic 0% proposal. The handler now requires a supported positive decimal rate at most 100%, with no more than four decimal places, before preparing a proposal. A missing rate is unavailable, rather than an input error or inferred zero.

The AvaTax public-command proof failed because an explicit reduced rate type became a proposal. A fully taxable part jurisdiction now also requires the provider's rate type to be absent or General. Explicit reduced or unsupported rate types do not qualify. Ordinary combined jurisdictions remain supported, including exact four-place results.

The first archive run reached all the new tax archive assertions, then failed an existing DISP-011 assertion: expected MAPS, observed ROUTE_STALE. Tax setup and reconnection had changed the business version after a route proposal. The fixture now creates the connection before route preparation and reconnects after the existing route checks. No route assertion was removed or weakened.

The added browser refusal probe also failed: the main answer said unavailable, but raw provider diagnostics displayed not_collecting 0%. The shared lookup renderer in src/ui/tax-lookup.tsx now shows provider reasons without numeric diagnostics when no proposal qualifies. This one-line display correction is necessary in the actual lookup component (the brief names tax-settings.tsx, while this renderer lives in tax-lookup.tsx). The browser journey now asserts both Stripe unregistered and AvaTax zero-rate displays contain no 0% and preserve the applied settings.

## Acceptance evidence

Recorded CI for every row in this section: Verify 42508990142, event push, completed, conclusion failure; exact head 34f1d9c10ff33fe2e74ee14e52bf1ba011ede43e.

The following is the frozen checkable rubric for this round. Provider fakes are permitted explicitly by point 1. Live registrations, provider activation and live Avalara account acceptance are not claimed.

| Point | Public door and independently asserted outcome | Proof |
| --- | --- | --- |
| 1 | Both providers return proposals without changing business settings; unregistered, rateless, HTTP-refused and unreachable responses return unavailable with no proposal; only explicit ordinary settings application changes the rate. | tests/api/tax-lookup.test.mjs:34 — MONEY-005 Stripe proposals disclose only fixed samples and fail closed without applying tax settings; tests/api/tax-lookup.test.mjs:94 — MONEY-005 AvaTax exact SalesOrder proposals retain millionth precision, refuse unsafe treatments and replay after restart; tests/browser/money.spec.ts:29 — MONEY-001, MONEY-004, MONEY-005 owner manages branch rates, private exemption evidence, Stripe and Avalara AvaTax proposals and frozen quote/invoice tax at 1440 and 390 |
| 2 | All four service classifications work; a fifth is refused without a provider call. Each Stripe calculation body equals the fixed address and one $100 line, excluding the populated private customer, site, contact, exemption and certificate data. Owner selects, reviews and applies through browser controls; screens at both widths. | tests/api/tax-lookup.test.mjs:34 — MONEY-005 Stripe proposals disclose only fixed samples and fail closed without applying tax settings; tests/browser/money.spec.ts:29 — MONEY-001, MONEY-004, MONEY-005 owner manages branch rates, private exemption evidence, Stripe and Avalara AvaTax proposals and frozen quote/invoice tax at 1440 and 390 |
| 3 | Stripe partial, mixed, multiple-rate, reduced, exempt-parts, unsupported and different-labor answers are unavailable. AvaTax partial basis, mixed service, reduced basis and rate, exempt parts, unsupported rates, incomplete jurisdictions and mismatched labor are unavailable. Every refusal preserves settings, customer and site records. Supported AvaTax multi-jurisdiction sums remain proposals as point 7 requires. | tests/api/tax-lookup.test.mjs:34 — MONEY-005 Stripe proposals disclose only fixed samples and fail closed without applying tax settings; tests/api/tax-lookup.test.mjs:94 — MONEY-005 AvaTax exact SalesOrder proposals retain millionth precision, refuse unsafe treatments and replay after restart |
| 4 | Actual connected, disconnected, provider-outcome and looked-up events have actor, time and command attribution in Activity and business export; no sealed value appears. Existing certificate-event proof retained unchanged. | tests/api/tax-lookup.test.mjs:151 — MONEY-005 AvaTax connection custody requires the current signed-in unscoped Owner and never exposes its sealed value; tests/api/money.test.mjs:9 — existing address and branch tax flow |
| 5 | Signed-in unscoped Owner succeeds; Office, Dispatcher, custom role, integration token, signed-out request and branch-limited Owner cannot connect or disconnect. Current authority withdrawal also refuses historical lookup access. Captured Worker logs are asserted nonempty during credential use. State, saved command outcomes, Activity, export and captured Worker logs exclude every credential component and the sealed object. Real archive excludes the secret table and values; restored Owner must reconnect. | tests/api/tax-lookup.test.mjs:151 — MONEY-005 AvaTax connection custody requires the current signed-in unscoped Owner and never exposes its sealed value; tests/portable.mjs:297,353,361,411 — real installation export and import, MONEY-005 additions |
| 6 | Each lookup makes exactly one uncommitted SalesOrder with exact date, currency, address, fixed customer code and both exact $100 lines on sandbox and production hosts. Neither initial nor restarted replay sends another request. | tests/api/tax-lookup.test.mjs:94 — MONEY-005 AvaTax exact SalesOrder proposals retain millionth precision, refuse unsafe treatments and replay after restart |
| 7 | Two jurisdictions with sub-millionth fractions are each rounded to millionths and sum to exactly 8.2345%; matching fully taxed labor and wholly non-taxable labor qualify. Zero, sub-millionth zero sum and different labor rate do not qualify. | tests/api/tax-lookup.test.mjs:94 — MONEY-005 AvaTax exact SalesOrder proposals retain millionth precision, refuse unsafe treatments and replay after restart |
| 8 | Owner applies the proposal through ordinary business jurisdiction settings and sees retained values after reload and actual Worker restart. Lookup itself never applies tax or exemption. | tests/api/tax-lookup.test.mjs:34 — MONEY-005 Stripe proposals disclose only fixed samples and fail closed without applying tax settings; tests/api/tax-lookup.test.mjs:94 — MONEY-005 AvaTax exact SalesOrder proposals retain millionth precision, refuse unsafe treatments and replay after restart; tests/browser/money.spec.ts:29 — MONEY-001, MONEY-004, MONEY-005 owner manages branch rates, private exemption evidence, Stripe and Avalara AvaTax proposals and frozen quote/invoice tax at 1440 and 390 |

## Inherited duties

Recorded CI for every row in this section: Verify 42508990142, event push, completed, conclusion failure; exact head 34f1d9c10ff33fe2e74ee14e52bf1ba011ede43e.

| Duty | Result and evidence |
| --- | --- |
| BASE-AUDIT-001 | MET locally: custody sanity journey calls assertTrail on populated provider events and compares Activity with business export, including actor, time, reference and command id. Existing certificate-event proof retained. |
| BASE-DATA-001 | MET locally: actual installation archive preserves historical lookup outcome, excludes provider secrets and execution authority, rejects an old source session, and requires explicit reconnection for new work. |
| BASE-SECRET-001 | MET locally: all four secret components form one private provider value; observed state, stored command results, Activity, export, Worker logs and real archive expose none of the credential material. Authentication headers are observed only inside the fake provider edge. |

## DONE riders

Recorded CI for every row in this section: Verify 42508990142, event push, completed, conclusion failure; exact head 34f1d9c10ff33fe2e74ee14e52bf1ba011ede43e.

| Row | Result | Evidence or boundary |
| --- | --- | --- |
| 1 | Native outcomes MET; full Verify bar failed | All eight acceptance outcomes mapped above through real commands, built browser and actual archive. |
| 2 | MET | Populated private customer and certificate; supported provider cases succeed; unsafe treatment and unauthorized cases refuse and preserve records. |
| 3 | FAIL: full Verify 42508990142 failed in browser-1 | Existing Verify API glob includes the new file, existing browser and portability commands include the additive cases. No env-gated proof added. |
| 4 | MET on final bytes | Final local command logs and content hashes in receipt; API, browser and portability rerun after their last relevant edit. |
| 5 | MET by inspection and tests | CONTRACT.md:293 already cites BASE-AUDIT-001, BASE-DATA-001 and BASE-SECRET-001. No clause text changed. |
| 6 | MET mechanically; judgment custody retained | Generator write and check pass; generated views restored. No Status, Gap, Evidence or count edit. |
| 7 | MET by diff | No acceptance sentence, policy or coverage rewrite. |
| 8 | MET | Current Owner succeeds; excluded signed-in roles, token and limited Owner fail; withdrawn role cannot reuse a lookup outcome. |
| 9 | MET | Only network-edge fake proof claimed, as the contract allows. No live tax registration, Avalara account verification, filing or legal compliance claim. |
| 10 | Inapplicable | Existing authority and provider boundaries retained; no new policy default. |
| 11 | Pending guarded fleet landing | This task cannot establish main equality with the candidate, Run site on landed head, or fleet publication scan. Branch custody and exact-head Verify are in receipt; the fleet retains all landing gates. |

## Pre-ready checks

The dangerous money and authority paths run both ways. No existing assertion was removed, skipped, narrowed or moved behind a width condition. Historical outcome replay sends no new provider request, disconnection removes execution authority, and actual restore imports no provider key. Erasure behavior was not changed; the existing archive suite retains its later-erasure-journal cases. Tax requests disclose no customer identity or certificate data. The only UI production change removes numeric diagnostics from unavailable answers in the existing shared renderer. Existing lookup controls have text labels, and the captured screens have readable fields without added icon-only controls. No layout, typography or configuration placement changed. Configuration placement was not changed.

The source lock is generated after all changes. No migration changed, so the migration-ledger check is inapplicable. Changes contain no new email-shaped fixture value, provider-shaped key, bare repository-like prose token, credential or private evidence. Existing Base and rer pins, branding, homepage and workflows are unchanged.

## Counts, claims and custody

Before and after source judgments: 18 DONE, 216 PARTIAL, 29 MISSING, all 263 Status rows preserved. MONEY-005 remains PARTIAL for the required full Verify bar: its native points 1–8 are qualified, but browser-1 failed on the exact head. No count change is claimed until that CI failure is resolved and the independent gate accepts the clause. The only plan row proposed for update is MONEY-005. No other plan campaign was rebuilt or reordered. No PR is required: Verify starts on branch push. No product push or fast-forward to main is authorized or performed.

Publication scan: not run in this cloud, per the cloud-only branch route. No COMPLETE or zero-findings scan is claimed. Exact commit, historyScanned, findings and landed main equality remain the fleet's independently generated receipt.

PROBE MONEY-005 1: tax.lookup supported and unregistered, rateless, HTTP-refused and unreachable provider answers -> proposal only for supported positive treatment, all refusals unavailable and settings unchanged.
PROBE MONEY-005 2: tax.lookup each supported Stripe classification and one unsupported classification -> exact fixed sample requests for the four, INPUT and no request for the fifth; owner reviews and manually saves.
PROBE MONEY-005 3: tax.lookup unsafe treatment tables -> no proposal and no configuration or exemption change.
PROBE MONEY-005 4: Activity and business export reads after real tax commands -> attributable populated events with secret-free payloads.
PROBE MONEY-005 5: tax.connect signed-in Owner and excluded callers; real archive export and restore -> Owner connects and disconnects, excluded callers refused, sealed value absent, reconnect required after restore.
PROBE MONEY-005 6: tax.lookup with sandbox and production connection -> one exact uncommitted SalesOrder each, zero additional calls on replay after Worker restart.
PROBE MONEY-005 7: tax.lookup jurisdiction fractions 0.0623454 and 0.0200004 -> 8.2345%; zero sum and mismatched labor -> unavailable.
PROBE MONEY-005 8: ordinary business jurisdiction save -> reviewed rate and labor choice persist after reload and Worker restart.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check; views=node scripts/contract-docs.mjs write --clauses MONEY-005 then check, generated files restored from origin/main; ledger=none (no migration change). Exact exits are recorded in RECEIPT.json.

Exact-head CI: Verify 42508990142, event push, status completed, conclusion failure, head 34f1d9c10ff33fe2e74ee14e52bf1ba011ede43e. URL: https://github.com/just-every/run-glove/actions/runs/42508990142.
All target-specific local command exits are 0. The candidate is pushed and remote custody is verified. Current contract judgments remain unchanged. Full Verify is red; row 3 is not satisfied, and no READY claim is made. Row 11 remains the guarded fleet landing duty.

## Terminal CI disposition

BLOCKED: exact-head Verify 42508990142 completed with failure. Browser-1 job 128817888962 failed in Run this shard; aggregate verify job 128820368041 then failed because the shard set failed. No contract-view freshness exception applies. All other selected shards passed, including both API shards, the complete real portable journey, foundation and browser-2, which contains the MONEY-005 browser file. Successful relevant jobs: api-1 128817888965, api-2 128817888950, portable 128817889005 and browser-2 128817889100.

The one allowed failed-job archive read was:

    gh run view 42508990142 --repo just-every/run-glove --job 128817888962 --log-failed

Actual diagnostic: failed to get run log: zip: not a valid zip file. gh supplied no HTTP status or response body. The archive was not retried, no direct log-blob redirect was attempted, and no other credential was sought. The aggregate job's log confirmed only the expected failed-shard guard, not an independent product assertion. Seven GitHub calls were used under the ten-call budget.

The failed command was run once locally on the exact candidate with the declared shard and CI flags, pinned Node 22.20.0 and the cloud-required system Chromium. The same command was also run on the recorded main baseline d1d1a15cc01a553a6035a85d9764f102b8c6ff9f on this same cloud VM. Both ran all 21 selected browser tests and passed with exit 0. Full outputs are verify-reproduce.log and main-reproduce.log. This does not establish equivalence with the unavailable GitHub-hosted runner or reveal its failing assertion.

The CI failure is therefore not reproduced. No speculative product edit, guard weakening, workflow dispatch or unproven failed-job rerun was made. The brief requires stopping for CI triage when the failure cannot be reproduced. The exact product head remains pushed, with its complete native MONEY-005 proof intact.

Final claim: MONEY-005 PARTIAL, points 1–8 qualified; no native point remains unperformed. GAP MONEY-005: full exact-head Verify is red in browser-1, with the assertion inaccessible and both local comparisons green; fv CI triage is required. Riders 1 and 3 remain blocked by that workflow bar; riders 2 and 4–9 pass, rider 10 is inapplicable, and rider 11 awaits guarded fleet scanning and landing. Contract judgments and counts remain 18 DONE, 216 PARTIAL, 29 MISSING. No READY or landing claim is made. The only plan-row update is the MONEY-005 native-proof-complete, CI-triage-only hold.

CLAIM MONEY-005 PARTIAL points=1,2,3,4,5,6,7,8 tests=tests/api/tax-lookup.test.mjs#MONEY-005 Stripe proposals disclose only fixed samples and fail closed without applying tax settings; tests/api/tax-lookup.test.mjs#MONEY-005 AvaTax exact SalesOrder proposals retain millionth precision, refuse unsafe treatments and replay after restart; tests/api/tax-lookup.test.mjs#MONEY-005 AvaTax connection custody requires the current signed-in unscoped Owner and never exposes its sealed value; tests/browser/money.spec.ts#MONEY-001, MONEY-004, MONEY-005 owner manages branch rates, private exemption evidence, Stripe and Avalara AvaTax proposals and frozen quote/invoice tax at 1440 and 390; tests/portable.mjs#MONEY-005 real archive passed: sealed AvaTax value absent, historical replay sends nothing, restored Owner explicitly reconnects
