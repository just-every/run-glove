# Independent CT judgment — PLAN-009, original exact source

**Verdict: PLAN-009 ACCEPT ON LANDING.** All six original frozen outcome rows pass on **e77eddb69789701b517586ee026460e00717a14e**. There is no failing A, B, standing BAR or NEW finding. This is the single commissioned independent whole-clause judgment, separate from the original affected gates. No product acceptance, status, source pin, hold, lifetime, release or landing state was changed.

Repository: just-every/run-glove. Source branch: cloud/sx-glove-c-f86. Replacement commission: ct-judge-glove-plan009-20261105-2138-sol1. Date: 2026-11-06 UTC. Product commits, product pushes and PRs: none. No task product branch was created because the specific reviewer authority makes the product read-only. The only publication is the separate report-only evidence ref.

Model and effort record: the authorized launch metadata specifies **gpt-6.1-sol, xhigh**, replacing the historical required-Opus wording for this one execution. This report was authored in the current single Codex session; no alternate session, delegated agent, model API or usage credits were used. The session exposes no independent backend model/effort attestation, so commissioned routing is recorded without inventing an additional runtime receipt. CT retains responsibility for actual admission and retirement of its original waiter.

## Product scope from the immutable contract

Category: field service management for home and commercial service trades. Buyer: owner or dispatcher of a US plumbing, HVAC, electrical or other service-trade business with 2 to 25 technicians, replacing another field-service system; USD, US tax, one or more US time zones, QuickBooks Online and the owner's own Cloudflare account. Primary incumbents: **Jobber, Housecall Pro and ServiceTitan**. The full target also names **FieldPulse and Workiz** as up-and-comers. Those names and the complete win-work, customer, dispatch, communication, field, costing, payments, books, recurring-service, business operations, move-in and agent scope are retained; this review awards no wider parity.

The buyer-visible standard for this clause is an explicit customer answer recorded by authorized desk staff for one included visit, durable attributable history, and consistent exclusion of precisely that work from outstanding entitlements and booking. The clause's express guarantees govern; no unsupported assertion about a particular incumbent's implementation substitutes for them. Bookkeeping, payroll, telecom operation, underwriting, legal advice, native-device proof and provider delivery remain their contract boundaries.

The complete immutable CONTRACT.md and ACCEPTANCE.md were processed end to end for clause structure, acceptance text, Status, Evidence, Gap and provenance. The inventory finds **263 clauses and 1,207 acceptance points**, with identical acceptance text in every corresponding generated clause. Full-file hashes and all 263 complete source/main Status-row comparisons are retained in contract-inventory.json and source-comparison.json. Detailed substantive reading covered the full original Requirement/AP1–6, neighboring PLAN duties and operating rules, GLOVE answer/booking authority, the Base citations, governing RL-19, the complete RULINGS.md, the relied-on native journey and every called target helper, browser journey and runtime helpers. This is a PLAN-009 judgment, not requalification of the other 262 clauses. No contract-standard absence or stale view was used to restructure anything.

## Immutable original clause

#### PLAN-009 — Customer explicit entitlement decline

*Tier:* Core · *From:* PLAN-004 · *Cites:* BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** Customer explicit entitlement decline supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A decline is the customer's own explicit answer, recorded by a person as `GLOVE-04` records a quote's answer: the desk (owner, dispatcher, office) records it for one included visit of an agreement (agreement decline action: agreement version, zero-based ordinal, who declined, how — phone, email reply, text reply or in person — and their reason).
2. Glove never infers a decline from silence, a cancelled booking, term expiry or agreement end action.
3. It is refused for a completed or already declined visit, and while that visit has a live booking (cancel the booking first, under `GLOVE-07`).
4. The decline keeps the visit's due date, the recorder's name and role and the time, is appended to the agreement (never edited), is named on the Activity timeline (agreement visit declined action) and travels in the export.
5. A declined visit leaves the due list, the `REPORT-001` agreements-due tile and the `AGENT-008, AGENT-016` brief; it is no longer "left" under `PLAN-002`, and no included job can be made for it.
6. The decline joins the site's property history (`CUST-001`) as an agreement decline row.


## Full frozen table — verbatim

These are the original frozen rows supplied with the commission, including the inherited public-door scope. The historical execution wording below is preserved verbatim; the score table afterward states exactly what this session ran. No private held-out material is included in this packet.

| Point | Independent execution and observation |
| --- | --- |
| 1 | Reran the affected native HTTP journey: Owner, Dispatcher and Office each record all four methods, with explicit customer/reason, current version and ordinal. The separate held-out probe records a text answer through native Office authority and checks the exact server-attributed record. |
| 2 | Native journey checks silence, cancellation, actual expiry and agreement end without inferred answers. Independent probe confirms due/dashboard/brief reads preserve the export and leave the decline list empty. |
| 3 | Native journey checks completed, previously declined and live-booked visits, stale/invalid inputs, excluded roles, branch limits, signed-out requests and revoked current authority, preserving domain records on refusal. Independent probe repeats a duplicate ordinal and checks unchanged export. |
| 4 | Native journey checks thirteen exact ordered answers, due dates, identities/historical roles, server times, replay, real Worker restart, Activity and business-export records. Independent probe checks its own exact answer and one attributed event after restart. Erasure/replay assertions also passed. |
| 5 | Native journey checks exact due identities, dashboard tile, owner brief, left/declined/completed counts, future work, refused explicit and implicit job creation, existing-job booking refusal, restart and an undeclined customer successfully booked. Independent probe checks due/tile/brief 2→1, left 3→2, new-job refusal and unchanged export on existing-job booking refusal. |
| 6 | Native journey checks exact property rows before/after restart, same-customer other-property isolation, branch and field exclusions, erasure and replay. Independent probe finds exactly its own retained property decline row. |

## One clause row and exact-source scores

| Clause | Journeys and public doors | Coverage and recorded Verify | Disposition |
| --- | --- | --- | --- |
| PLAN-009, including BASE-AUDIT-001, BASE-ROLE-001 and all eleven riders | `tests/api/agreements.test.mjs` — “Forty due entitlements and exact owner projections survive bookings, cancellations, completion, declines, delivery and restart”, including ownerDueBrief(), recordedDeclineAnswers() and declinedEntitlementConsequences(). Real native sign-in, production Worker and migrated persisted D1; POST commands and GET agreements, due-visits, dashboard, brief, Activity, export and site history. `tests/browser/due-visits.spec.ts` — the existing Office batch-booking, recorded-decline, customer-choice and owner-brief journey at 1440 and 390; real setup/dev document layer with native HTTP requests fulfilled by the production Worker harness. | All six points executed successfully here. The immutable workflow and verification.json load the API glob and browser runner on push. Supplied exact-source Verify **42109834723**, event **push**, reports API, portable and browser success, foundation generated-view-only failure and derivative aggregate failure. Raw workflow conclusion remains **failure**, under the explicit candidate exception. No CI query, rerun or dispatch occurred in this reviewer session. | **ACCEPT ON LANDING**, no substantive Gap, no applied award. Final fully green merged runtime Verify and guarded landing remain owed. |

| Frozen point | Score | Actual observation on e77 |
| --- | --- | --- |
| 1 | PASS | Native helper lines 686–865 runs all three desk roles across phone, email reply, text reply and in person: 12 matrix answers plus the later canceled-visit answer. Current agreement versions and zero-based ordinals are supplied. Exact customer, reason, due date, historical authenticated recorder and server time are checked. Caller-forged recorder/time fields do not replace server facts. Browser records Office's explicit email-reply answer using the real controls. |
| 2 | PASS | Lines 758–775 perform populated due/dashboard/brief reads, a real booking cancellation, actual term expiry, scheduler, Worker restart and explicit agreement end. Every step checks zero manufactured answers and zero decline events. Nothing is inferred from silence or lifecycle actions. |
| 3 | PASS | Lines 729–756 and 795–811 attempt completed, live-booked, duplicate, stale and invalid declines, signed-out access, field/subcontractor/Agent/viewer/read-only-custom/integration and out-of-branch authority. Later Dispatcher and Office downgrades refuse both old replay and new actions. Exact whole-business downloads, excluding only generated exportedAt, remain unchanged on refusal. The canceled booking becomes declinable only after cancellation. |
| 4 | PASS | Lines 777–865 check 13 append-ordered answers against independent fixed dates/times and supplied facts, every Activity actor/role/time/command/summary, exported event detail and agreement records, before and after actual Worker disposal/recreation. Immediate and older replay add nothing; prior historical roles survive current-role withdrawal. Owner erasure removes personal answers and export/history identifiers; old and new replays refuse without resurrection. |
| 5 | PASS | Lines 869–951 independently enumerate exact due/dashboard/brief identities and included/used/booked/declined/left/next/due values in an active term. Completed work and later explicit current/future declines remove only those ordinals. Owner, Dispatcher and Office new-job attempts for declined ordinals and exhausted implicit allocation refuse ENTITLEMENT with unchanged complete downloads. Crucially line 939 attempts Dispatcher booking of a retained, unbooked included job after its future ordinal was declined: ENTITLEMENT and full-export equality pass. Post-refusal restart, all-future projection and exhausted-job refusals finish; the terminal Office control creates and books an undeclined customer's included job successfully. |
| 6 | PASS | Lines 822–864 assert exact site-only decline rows, historical attribution, due date, label, status and newest-first order before and after restart, with distributions 5, 4 and 4. Another property of the same customer has no inherited rows; field views omit desk answers and out-of-branch history returns 404. Erasure leaves no personal decline/history and replay cannot restore it. Browser reaches Lee's retained property decline at both widths. |

The selected native journey ran once, exit 0, **one selected registration passed, zero failed, skipped or canceled**. Its helper source SHA-256 is the original supplied e77 file hash: **157ce769b69ca3b7ced45053102a664fd0d8d946aa7ceb50d499d756fa4fdbb8**. No assertion or import was edited. The original private strict probe was not supplied as executable material and was NOT RUN; this session neither invented it nor copied private held-outs into public evidence. Its historical results remain the supplied affected-gate evidence, separate from this session's native execution. The native source itself contains and executes the original formerly failing retained-job refusal and the complete tail.

## DONE riders and inherited duties

| Rider | Score and retained obligation |
| --- | --- |
| 1 — Every original outcome reached | PASS at candidate boundary: six rows above, exact e77 native HTTP and functional browser proof. |
| 2 — Populated allowed and refused paths | PASS: populated independent expectations, actual authorized answers/bookings and unsafe refusals with complete protected-record equality. No outcome is inferred from reading alone. |
| 3 — Loaded in exact-source Verify | PASS under the expressly supplied generated-view candidate exception, not full-green final-runtime qualification. Push Verify 42109834723 and committed workflow coverage are distinguished from local proof and from later-source runs. No new CI query was authorized or made. |
| 4 — Exact source | PASS: HEAD and all relied-on source files remain byte-identical to e77 throughout checks. Fresh native API and browser executions are on those bytes. No earlier-source runtime result is relabeled as execution here. |
| 5 — Inheritance explicit | PASS: PLAN-009 meta cites BASE-AUDIT-001 and BASE-ROLE-001. Durable attributable answers/Activity/export and current person/role/branch authority are executed through the native doors. The shared Base duty table's unrelated global “not run” entries are not converted to product-wide Base claims. |
| 6 — Status, Gap, evidence, provenance and generated mechanics | F/bookkeeping: candidate source says done with an empty PLAN-009 Gap and precise named evidence; committed generated views still say partial. Independent generator check exits 1 only for ACCEPTANCE.md and docs/CLAIMS.md. Source-lock check exits 0. Global Judged-from still names a969c6b7e41806d2b92bd939ff886bdfadba95c6. Existing custodian must write merged views/counts and current source/report provenance, lock LAST and check. Read-only review performs no generator write or status-flip commit. |
| 7 — Acceptance and scope retained | PASS: all original six points, full Requirement, Base citations and existing rulings retained. Entire 263-clause acceptance comparison is equal between source and generated acceptance. No rewrite, point addition or weakened assertion is proposed. |
| 8 — Current authority | PASS: Owner/Dispatcher/Office allowed matrix; excluded and revoked-role, integration, signed-out and wrong-branch refusals leave records unchanged. Shared book() guard executes before any visit/assignment/event write; native Dispatcher refusal and successful undeclined Office control both execute. |
| 9 — Honest provider/legal boundary | PASS: a human-recorded phone/email/text/in-person answer proves the native record only. Test mail uses network-edge fakes; no live delivery, customer identity verification, legal consent, real account/device, production or release outcome is claimed. |
| 10 — No new default | PASS: no new custody, consent, money or authority default was adopted. Recording an answer gives no sending, payment, provider or release permission. RL-19 remains the existing booking-link authority. |
| 11 — Guarded landing | PENDING, not awarded: existing source-lineage disposition and protections, merged generation/current counts/provenance, source lock LAST, actually EXECUTED fully green exact-FINAL runtime Verify loading the relied-on journeys, COMPLETE full-history publication scan NEW 0, guarded fast-forward/main equality and exact-main Run site remain required. |

Rows 6 and 7 mechanics create no product FIX. No account, real-device or missing sibling API is needed for these native outcomes; UNMET-EXTERNAL is none within the frozen clause. Other clauses keep their complete provider, account and Base boundaries. No money/security/data-loss outcome is marked PASS solely from inspection.

## Fresh-main comparison, counts and source custody

Fresh main fetched once resolves to **786ecbc4d54e2125f3e96589ecc40f57962825ee**. Every complete Status row's title, kind, Status, Evidence and Gap was compared, along with provenance, without applying a merge. Both sources have 263 rows. Fresh main is **7 DONE / 227 PARTIAL / 29 MISSING**; e77 proposes **8 / 226 / 29**. Applied count delta in this reviewer run is **0 / 0 / 0**. Proposed PLAN-009 delta is **+1 DONE, −1 PARTIAL**, still **UNAWARDED**.

Only MONEY-003 and PLAN-009 differ in the full Status-row comparison. MONEY-003 stays PARTIAL on both, but fresh main adds point-4 qualification and exact Evidence/Gap language for independently rounded component products, edits that preserve fixed prices, nested-task refusal, restart, replay, current authority and Activity/export. Main also adds 101 pricebook-test lines. Preserve that complete newer judgment and every assertion; merely retaining its Status would lose evidence. The global Judged-from marker matches on the two sources and still requires current integration provenance. All other 261 Status/Evidence/Gap rows are identical at these read pins. The report does not alter any of them.

Fresh main does not contain e77's declined-entitlement shared guard or its two target helpers. The commissioned source does. Relative to fresh main, e77 adds the original native assertions and browser history anchor without deleting main's agreement assertions; its separate older pricebook bytes must not overwrite the newer main assertions. The installed original integration family must reconcile these sources, not replace main wholesale with this older checkout.

The supplied historical lineage remains distinct:

- Original f79 PASS and f86/e77 affected PASS remain source-bound. The original e77 affected gate actually ended 2026-11-05T21:39:26Z, exit 0, per the terminal supplement. This reviewer does not infer affected PASS from its own CT verdict.
- pc1 **0fbef999d60de59a2f2ca77c044b0014770baf71** actually failed original frozen row 5. Its Verify **42122151408** and builder READY/evidence are not e77 proof and cannot acquire the old PASS.
- Original FIX1 repair **a2009e6c4f32a353e0f3aa9fe5d319aa4d819da1** received actual affected PASS at 2026-11-05T23:51:13Z. That is affected qualification, not a CT whole-clause judgment or an admitted source disposition. Its runtime/browser retention claims are not substituted for this e77 execution.
- No supported admitted-successor disposition was provided. Therefore this commission retains exact e77. The SAME installed source-lineage/index/continuation custodian still owes its supported qualified-unsuperseded-source reconciliation, including every unsuperseded extra assertion/helper and entire fresh-main Status AND Gap/Evidence/provenance. The pc1 FIX and original history are not normalized or erased.
- Lifetime remains OPEN, **one lifetime FIX, FIX1of2 unchanged**. All existing source/exact-land review protections and holds remain active. No successor, duplicate repair, resolver, readmission, submission, adoption or release was launched.

For a supported integration of this judged source, the intended source edit is only PLAN-009 partial→done, empty substantive Gap and the existing exact target journey evidence, with current judged-source/report provenance. Regenerate summary counts from the complete merged source rather than summing concurrent awards. If substantive outcomes had failed, the exact fresh-main partial Gap is preserved in source-comparison.json; none failed here, so no narrower replacement Gap or demotion is proposed.

## Actual plan and execution

1. Set fleet Git identity before other shell work; read the launcher refresh and AGENTS, refresh once, install the decrypted-bundle Git helper, cleanup and push guard. Use the managed cloud networking skill and policy; no other credential was sought.
2. Use one disposable shallow filtered clone of the declared source branch and verify exact e77 before runtime. Configure clone-local fleet identity and preserve repository hooks. No product branch creation/commit/push/PR follows the generic builder path because the specific review commission forbids it.
3. Read and preserve the full original frozen request, six outcome table, all eleven riders and later factual supplements. Keep e77, failed pc1 and affected-qualified a200 separate.
4. Process full immutable contract/generated acceptance, inventory every clause and point, read target/inherited operating authority and actual end-to-end target journeys/helpers, and compare complete fresh-main judgment rows and source deltas.
5. Source the prescribed cloud toolchain in checkout shells. rer setup acquires the project's exact Node 22.20.0. Select that cached runtime explicitly for direct tests because the VM default Node is newer; keep pnpm 10.12.4 and rer 0.2.87. Run setup/build and long-lived checks through cloud_run.
6. Run typecheck and the single relied-on native Forty-due registration once, concurrency 1 and bounded timeout. No full/baseline suite, application mutation, altered held-out assertion, live provider operation or CI query.
7. Run the existing functional due-visits browser journey once using /usr/bin/chromium, --no-sandbox, real account HOME, fresh context, one worker and owned runtime cleanup. Retain functional target screens at 1440 and 390; no UI/design/visual-quality judgment is made.
8. Run read-only generator and lock checks. Restore only automatic routeTree.gen.ts generation caused by setup/build to the exact original bytes before runtime. Never write contract/generated acceptance/claim views or relock source in this read-only commission.
9. Record complete actual non-secret commands, exits, source hashes, counts and every pending guard. Select public report, receipt, sanitized logs and target screens explicitly for separate evidence transport. No private held-out material, credentials, environment dump, booking link screen or symlink is selected.
10. Verify evidence custody independently of product qualification, confirm the product HEAD/index/tracked tree are unchanged, and remove the owned clone/dependencies after successful report transfer. Cleanup receipt records the actual result.

## Commands, exits and receipts

All substantive product checks used Node **22.20.0**, pnpm **10.12.4**, repository-pinned rer **0.2.87**, one heavy job at a time and one test/browser worker. No Mac slot/load loop applies in this dedicated cloud VM. The Mac Data-volume threshold is not a cloud admission measurement; the VM has no Mac Data volume. Initial cloud workspace free space was about 30 GiB, and the focused work fit without capacity refusal.

| Actual invocation | Exit and result |
| --- | --- |
| `cloud_run timeout 900 npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive` | 0; dependencies/build/migrations and explicit owned local setup only. setup.log is sanitized before evidence selection. |
| `cloud_run pnpm run typecheck` | 0; typecheck.log, commands.json. |
| `cloud_run node --test --test-concurrency=1 --test-name-pattern '^Forty due entitlements' tests/api/agreements.test.mjs` | 0; one selected test passed, none failed/skipped/canceled, about 20.5 seconds; agreements.log. The receipt driver additionally bounded the process to 600 seconds. |
| `cloud_run timeout 600 npx -y @runeditrun/rer build` | 0; build.log, commands.json. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium cloud_run timeout 1200 node tests/browser/run.mjs due-visits.spec.ts` | 0; one browser journey passed, test 35.7 seconds, runner 110.9 seconds including owned install/setup/dev/cleanup; browser.log, commands.json. |
| `node scripts/contract-docs.mjs check --clauses PLAN-009` | 1; only ACCEPTANCE.md and docs/CLAIMS.md generated-content differences. Expected candidate exception, contract-check.log. |
| `node scripts/edition-authoring/cli.mjs check` | 0; source-lock-check.log and mechanics.json. No write/lock command was run. |
| Exact HEAD, clean tracked tree and relied-on file hash comparison | 0; all relied-on source bytes equal the pin, read-custody.json. |

The top-level receipt driver invokes the prescribed Python child subreaper for cloud_run. API uses a real bundled production Worker, native authentication and fresh migrated D1; fixture time is controlled at the runtime boundary. Restart really disposes/recreates Miniflare with disk-persisted D1. Browser uses the actual local UI installation; its API routing goes through the same production HTTP handlers, not fabricated command responses. Provider fakes are only at their declared network edges. No paid service is contacted.

NOT RUN: full API file's unrelated registrations, full Verify/baseline suite, portable suite, mutations, fresh-main runtime, private strict probe, any separate-source pc1/a200 test, provider/device/account proof, production operations, CI queries/log reads/reruns/dispatches, generator writes, relock, source/acceptance edits, publication scanner, guarded merge/landing/main equality/Run site or release. Reasons: focused read-only original-source judgment; native selected journey covers all frozen outcomes; other-source attribution and affected results are supplied separately; final integration guards belong to the installed custodian. No required native target tail was left unexecuted. No capacity refusal or assertion failure occurred in a relied-on runtime check.

## Findings and final conditions

**Blocking product findings: none. Failing frozen rows: none. Substantive native PLAN-009 Gap: empty.** No deletion, skip or weakening of an existing user-visible-flow assertion was used. No new security, privacy, money, data-loss or ordinary correctness failure was established. No C finding or additional FIX is opened.

F/bookkeeping: stale generated views and historical global provenance must be resolved by merged generation/check and current judged-source/report provenance. G/integration: preserve the newer MONEY-003 Evidence AND full Gap and all newer tests; reconcile exact qualified source lineage without changing the commission, FIX lifetime or protections. Those are not additional product blockers on this e77 verdict.

ACCEPT ON LANDING is conditional review advice for the exact source, never DONE-JUSTIFIED, product READY, source acceptance or a landing receipt. Original affected qualification, this independent whole-clause judgment, source disposition and final guarded integration each retain their own custody. Full-green exact-FINAL runtime Verify must actually execute the relied-on journeys; old generated-view-only failure or runtime SKIP cannot satisfy it. COMPLETE full-history scan NEW 0, guarded main equality and exact-main Run site remain unestablished here and mandatory at the final bar. The proposed 8/226/29 stays UNAWARDED until that process completes.
