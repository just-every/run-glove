# sx-glove-c-f215 — TEAM-006 continuation

This packet records native commission payroll qualification. Product branch: cloud/sx-glove-c-f215. Candidate identity and CI are recorded in receipt.json when complete. Contract judgments are unchanged.

The full plan is in PLAN.md. The predecessor at 197195bb5ed61452b0645d2474ddbe1dd952ef3a was replayed onto main fcfafa4d17d1ff83fcd75fd89b929a29780397f8. All twelve unique non-merge commits were retained by rebase before the first publication. The new branch was saved at f866b9f; subsequent history is append-only. No production commission defect was exposed, so no production source was repaired. The continuation adds direct checks that ADP and QuickBooks, alongside Gusto, include a newly credited sale after the hours approval.

Main initially passed Verify 42611312391 and Run site 42611312355, both push events on fcfafa4d17d1ff83fcd75fd89b929a29780397f8. The earlier branch Verify 42603950921 also succeeded on that same SHA. The predecessor's QUOTE-015 transport failure is historical evidence only; no answer or expected commission amount was copied from an earlier run.

Source counts before and after this work: 41 DONE, 193 PARTIAL, 29 MISSING; 263 Status rows. TEAM-006 stays PARTIAL in CONTRACT.md until the independent gate writes its judgment. The requested claim closes its five native points; if accepted, the count effect is one additional DONE and one fewer PARTIAL. No other clause or plan row is claimed. Plan row to update: the held TEAM-006 continuation entry becomes this candidate, subject to its independent gate.

The initial main inventory was 202 of 200. The predecessor's existing correction preserves every COMM-010 assertion by invoking messageOutcomes inside the existing email journey and its browser outcomes inside the existing COMM-007 journey. Two registrations were removed without deleting assertions. The candidate inventory is 200 of 200. No new API or browser registration was added for TEAM-006. Existing assertions were not narrowed or made conditional by width. Homepage, branding, runtime pins, workflows and contract acceptance text are unchanged.

## Frozen proof rubric

The registered API journey is tests/api/payroll-files.test.mjs, COST-007 payroll files qualify provider rows, approved workweeks, privacy and export authority. The five named scenario steps remain inside that existing registration. Native quote.accept, invoice.approve after both technicians complete their visits, agreement.sell, Owner payroll.settings, clock.in, clock.out, timer.start, timer.stop and Owner timesheet.approve prepare actual production Worker data. Only provider network edges are faked. Expected cents and complete CSV record sets are independently enumerated in tests/fixtures/payroll-commissions.mjs; production payroll functions are never imported for expected values.

| Item | User outcome and public door | Proof location | Local result |
| --- | --- | --- | --- |
| R1, point 1 | A post-approval credited sale changes the next payroll file reads while the approval remains unchanged; later rules preserve earlier credits. | tests/api/payroll-files.test.mjs:226, TEAM-006 point 1 | PASS; 0.00 becomes 61.73; approved hours unchanged; 5% before November 9 and 10% from November 9. |
| R2, point 2 Gusto | Every row for two technicians over three workweeks includes exact hours and commission; commission-only workweeks have zero hours. | tests/api/payroll-files.test.mjs:255 and tests/fixtures/payroll-commissions.mjs:95 | PASS; six employee rows across three workweeks. |
| R3, point 2 ADP | Complete ADP records, default COMM and owner SALESOWN, blank Pay Hours and exact Dollars. | tests/api/payroll-files.test.mjs:255 | PASS; totals 221.75 and 135.02 with both codes. |
| R4, point 2 QuickBooks | One Commission line per person and local credited date with exact Amount. | tests/api/payroll-files.test.mjs:255 | PASS; complete thirteen data rows including seven Commission lines. |
| R5, point 3 | A credited person without approved time is absent from all files and appears with that exact withholding reason; a credited subcontractor never appears. | tests/api/payroll-files.test.mjs:266 | PASS; 60.00 commission withheld, subcontractor excluded, accepted native sales demonstrated. |
| R6, point 4 | JSON gives exact sold, completed and agreement amounts and every credited item, including the completed invoice's cent remainder. | tests/api/payroll-files.test.mjs:282 | PASS; Priya 131.74 sold, 25.01 completed, 65.00 agreements; Tom 70.02 sold, 25.00 completed, 40.00 agreements; six and five items respectively. |
| R7, point 5 boundary | No file or JSON claims confirmed provider account acceptance or any payment. | tests/api/payroll-files.test.mjs:287 | PASS; all contents inspected, zero payments and unchanged state and export. |
| R8, point 5 restart | JSON and all three files remain identical after the actual Worker is stopped and restarted with persistent D1. | tests/api/payroll-files.test.mjs:295; probes.json | PASS; byte-identical file hashes and equal JSON and business state. |
| R9, point 5 UI | Owner clicks each real Timesheets download at 1440 and 390, with real attachment bytes and the payment boundary visible. | tests/browser/journey.spec.ts:866 invokes tests/browser/commission-download-journey.ts:8 | Browser receipt and screenshots supplied separately. |
| R10, authority | Unsafe file reads as dispatcher, technician, custom role, integration token and signed-out visitor are refused without changing state or export. | tests/api/payroll-files.test.mjs:177 | PASS; existing COST-007 allowed Owner and Office paths and refusal paths retained. |

The production split is independently checked using a 100.01 invoice: the two completing technicians receive bases of 50.01 and 50.00 and 50% commissions of 25.01 and 25.00. The first is determined by technician name, despite reverse booking order. A November 23 sale is outside the period and never appears. Gusto's first week commissions are 111.74 and 35.01; the third week has 80.00 and 50.00 with zero hours.

## Inherited duties and held boundaries

| Duty | Disposition and evidence |
| --- | --- |
| TEAM-003 dated native commission rules | Exercised through Owner settings with sold, completed and agreement credits; its wider rule qualification remains with TEAM-003. Its held date validation path is unchanged. |
| COST-002 and COST-006 hours and approval | Native clocks, timer and approvals are used. This round changes no approval implementation or existing payroll test. Their wider reapproval obligations remain held with those clauses. |
| COST-007 file formats | Existing DONE clause is preserved and read; its complete existing API assertions and refusal paths run with the extended journey. No judgment changes. |
| PAY-002 and its tips family | Current configuration is preserved. No new tips authority, customer payment, collection or confirmation is claimed. |
| Field quote and hub sales | Remain held with QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018, COMM-006 and COMM-022 through COMM-025. No such sale is introduced or credited here. |
| R-15, R-16 and R-17 live provider acceptance | NOT RUN. No genuine Gusto, ADP RUN or QuickBooks account upload, acceptance, payment or filing is claimed. These field-register proofs remain external. |
| Base and runtime restrictions | Existing pins and code are unchanged; no release, deployment or publication to main is authorized. |

## DONE riders

| Rider | Result and evidence |
| --- | --- |
| 1 | All native acceptance outcomes are reached by R1 through R10. Exact candidate Verify must be green before an unconditional READY claim. |
| 2 | PASS: real native business data, independent cents and complete record sets; unsafe exclusions and export authority refusals leave state and export unchanged. |
| 3 | Exact candidate push Verify is recorded in receipt.json. It includes the API glob and browser runner that invoke the retained registrations. |
| 4 | Browser code, fixture, native transport and production bytes are compared against the final candidate; a later change limited to API assertions and its source lock does not alter browser outcomes. Exact provenance is recorded in browser-current.json and receipt.json. |
| 5 | INSPECTED: the receiving clause names TEAM-003 and the existing owning boundaries; this round adds no Base capability or unwritten inheritance. |
| 6 | PASS mechanically: generator write and check succeed; generated views restored to main; all 263 Status rows and their Gap and Evidence cells are unchanged. The lander owns the judgment update. |
| 7 | PASS by diff inspection: no acceptance sentence, rider, coverage map or ruling changed. |
| 8 | PASS for applicable file authority: allowed Owner and Office reads; refused unprivileged roles, token and anonymous reads leave business state and export unchanged. No new correction or payment authority exists. |
| 9 | PASS: provider account acceptance, payment and filing are explicitly unclaimed. |
| 10 | NOT APPLICABLE: no new policy default or authority design was adopted. |
| 11 | PENDING GUARDED LANDING: main equality, exact-main Run site and complete full-history publication scan belong to the fleet. A branch evidence transfer is not acceptance or landing. |

## Pre-ready self-check

1. Applicable native money outcomes are checked through payroll routes and actual downloads, with both allowed and unsafe cases. Workflow status is recorded exactly in receipt.json.
2. No existing assertion is deleted, weakened or moved behind a width condition. Registration consolidation preserves complete existing scenarios.
3. No credential, replay, erasure, storage or outbound path changes. Existing export refusal checks and unchanged-state checks cover the relevant boundaries. Other clauses retain their own custody and erasure duties.
4. Production screens are unchanged. Timesheets uses labeled links for all three downloads and existing labeled controls; browser proof checks overflow and unlabeled visible actions at both widths. No new icon-only control or configuration surface was added.
5. Source lock freshness, generation, typecheck and first-party checks are recorded in mechanical.json and receipt.json. Added text has zero email-shaped strings. Existing unrelated legacy text is preserved. A cloud-side publication scan is not run and is not claimed COMPLETE; the guarded fleet performs it before landing.

PROBE TEAM-006 1: native late quote acceptance after hours approval and payroll reads -> 0.00 becomes 61.73, approval unchanged; dated sold credits 5%, 10%, 10%.
PROBE TEAM-006 2: three native payroll file reads -> 7 Gusto records, 8 ADP records and 14 QuickBooks records including headers; zero-hour commission week and blank ADP Pay Hours.
PROBE TEAM-006 3: native credited person without time and credited subcontractor -> only Priya and Tom included; exact withholding reasons retained.
PROBE TEAM-006 4: payroll JSON -> complete six-item and five-item summaries, totals 221.75 and 135.02, split completed commissions 25.01 and 25.00.
PROBE TEAM-006 5: real Worker restart and rereads -> identical JSON and all CSV bytes; no payment and unchanged business state.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses TEAM-006 and check exit=0; ledger=none exit=0.

The packet retains the actual local failure diagnostics and recovery receipts. No private runtime log, credential file, environment dump, browser trace, session state or held-out material is selected for evidence publication.

## Local diagnostics and recovery

The original combined touched API invocation under VM Node 24.19.0 failed the pre-existing COMM-016 registered email journey at the future SNS timestamp check: expected 401, observed 200 at tests/api/email.test.mjs:428. The command was node --test --test-concurrency=1 tests/api/payroll-files.test.mjs tests/api/email.test.mjs tests/api/message-outcomes.test.mjs. Its payroll registration passed. The same registered email test on unchanged main fcfafa4d17d1ff83fcd75fd89b929a29780397f8 also failed in this VM, at its shared rejected-IP allowance check: expected 429, observed 401, tests/api/email.test.mjs:296. Repeating the candidate with the pinned Node 22.20.0 runtime produced that same 401 versus 429 failure at line 297, while payroll passed. The test implementation and production mail code at those failing assertions are unchanged from main. No mail assertion or production mail guard was altered, and no CI repair is inferred from these local runs. The full actual logs are retained.

The fresh-install browser wrapper failed setup's internal listener handshake before Playwright started. The already-set-up checkout successfully started its own dev server. The first direct browser run hit an existing first-run navigation timeout and a loading-page timeout before the commission step; the pinned-Node run passed the complete COMM-007 journey, including preserved COMM-010 outcomes, but its legacy time journey hit a loading-page timeout after reload, again before the added commission call. These are recorded without claiming those runs passed. A focused invocation of the unchanged commission download helper is used to reach the target's own screens directly without a new browser registration; its receipt states the exact result and any startup wait.

The complete touched browser run subsequently passed both registered journeys after explicit synchronization with the completed native state response. This adds readiness waits around navigation and reload in the existing time journey and the commission download helper. No assertion, expected outcome, width, role or failure condition was removed or changed. The successful local run is recorded in browser-current.json and browser-current.log; a final committed-head run supersedes the scratch invocation for target proof.

The initial landing candidate was 35785ba0a677a6aa5f603871419bd643df9e883e. It was pushed normally by the fleet guard; product-ref.txt records the exact advertised branch head. The new commit changes only the post-approval file assertions, explicit browser readiness synchronization and the generated source lock. Thirteen candidate commits passed the complete author, committer and trailer audit, including all parents.

Exact candidate publication scan result (cloud handoff, no scan claim):

{"commit": "35785ba0a677a6aa5f603871419bd643df9e883e", "complete": false, "findings": null, "fullHistory": true, "historyScanned": false, "responsibility": "fleet guarded lander", "status": "NOT RUN IN CLOUD"}

Committed-head local proof: payroll-exact.json records exit 0 on 35785ba0a677a6aa5f603871419bd643df9e883e with the pinned Node 22.20.0 runtime. browser-current.json records the same full SHA and exit 0 for the existing registered COST-001, COST-002, COST-006, COST-007 journey, including commissionDownloads at 1440 and 390. All four commission screen captures and six actual downloaded CSVs are included under screenshots. The owned browser contexts, fixture Workers and dev server were closed. Final lock freshness and contract view checks pass on a clean product worktree.

## Exact-SHA Verify and failure triage

Verify push run 42616113091 on 35785ba0a677a6aa5f603871419bd643df9e883e completed with api-2 red; api-1, all four browser partitions, foundation and portable succeeded. The five TEAM-006 API scenarios run in api-1, job 129156614423; the registered Timesheets journey runs in browser-2, job 129156614491. Thus the target's own registered proof passed in this recorded exact-head run. The aggregate failure remains binding until a permitted retry is green.

The one failed-job archive command was gh run view 42616113091 --repo just-every/run-glove --job 129156614417 --log-failed. It failed: failed to get run log: stream error: stream ID 1; INTERNAL_ERROR; received from peer. No HTTP status or response body was supplied. No archive retry or direct blob download was attempted, so the remote failing assertion is unknown.

The exact failed-shard command, node scripts/verify-ci.mjs api-2, is replayed with CI=true, GLOVE_VERIFY_SHARD=api-2, WRANGLER_SEND_METRICS=false, PLAYWRIGHT_SKIP_BROWSER_GC=1 and GLOVE_CI_PREBUILT=1 using Node 22.20.0 after a successful build on the candidate. It encounters TypeError: fetch failed in PLAN-010 bearer custody survives restart, expires at the runtime boundary and ends atomically on use or staff revocation, tests/api/due-visit-offers.test.mjs:130. This test and its production paths are unchanged by the candidate. The same named test passes on main fcfafa4d17d1ff83fcd75fd89b929a29780397f8 with Node 22.20.0 (ci-main-probe.json, exit 0). The separate pinned main email comparison also passes on this later attempt, showing the variability of the earlier shared local failure rather than proving its remote cause.

One permitted failed-job rerun is requested for the reproduced transport-flake class. Its request is recorded in ci-rerun.json. This is not a code repair, and no production source, assertion, workflow or published history is changed. The final run conclusion is recorded separately; no remote assertion is invented from the unavailable archive.

## Reproduced fixture repair and final handoff

The bounded exact-shard replay also reproduced a deterministic Amazon SES failure at tests/api/message-outcomes.test.mjs:168: an authenticated unmatched event returned 401 instead of the required 200. This scenario fixes its Worker clock at 2026-11-09 12:00 UTC, while the synthetic SNS certificate was generated with validity beginning at the host's later wall clock. The certificate could therefore be not-yet-valid under the scenario clock. The raw source and the actual native failure establish this local defect independently of the inaccessible remote archive.

The fixture repair adds an optional explicit certificate clock to snsEvents and uses it only in this fixed-date scenario. OpenSSL issues a genuine RSA certificate spanning the scenario date; signatures, pinned origins, certificate validity checks and every existing assertion remain in force. The default certificate path is unchanged. Temporary private keys retain their existing private file mode and are deleted by the existing cleanup. No key or certificate material is committed. The complete existing COMM-010 function now passes through native commands and provider callbacks for SendGrid, Resend, Postmark and Amazon SES, including unmatched acknowledgement, wrong-recipient refusal, unsigned refusal, replay, secret exclusion and actual Worker restart; message-outcomes-fixed.json records exit 0. No new registration is added.

The exact api-2 replay was bounded at twenty minutes and exited 124 after recording the transport failure and the deterministic SES assertion; it did not finish the entire partition. verify-reproduced.json states that limit and the unknown remote assertion explicitly. The initial one-off stdin invocation stalled during setup and was interrupted without a verdict; a named script then completed the same message assertions. No passing result is claimed for the interrupted invocation.

The single failed-job CI retry failed during actions/download-artifact in job 129170205297, before api-2 tests ran. That CI infrastructure issue remains for FV; no workflow is edited and no second rerun is requested. The ten permitted GitHub calls are exhausted. A new substantive fixture-repair commit is pushed as the final candidate, starting its ordinary fresh-push Verify; its new run id and conclusion cannot be observed within this run's call budget. The terminal custody marker is therefore PUSHED, not a claim of green Verify or landing.

Final candidate: 643c64323dee88c18e5b2fc542f1da730c92112f. The guarded push succeeded on cloud/sx-glove-c-f215. Source judgments and counts remain 41 DONE, 193 PARTIAL and 29 MISSING. The native five-point qualification is complete; the terminal claim remains PARTIAL solely because aggregate Verify on this final head cannot be observed after the ten-call limit. No product acceptance behavior remains to implement. This is a PUSHED handoff for independent exact-head CI and landing checks, not a green READY receipt. No PR is required or created.

GAP TEAM-006: Final exact-head aggregate Verify remains unobserved after the ten-call GitHub budget; all five native outcomes are asserted and pass locally.

VERIFY_REPRODUCED {"boundedReplay": "20-minute timeout after two observed failures; whole shard did not complete", "command": "CI=true GLOVE_VERIFY_SHARD=api-2 WRANGLER_SEND_METRICS=false PLAYWRIGHT_SKIP_BROWSER_GC=1 GLOVE_CI_PREBUILT=1 node scripts/verify-ci.mjs api-2", "exit": 124, "failure": "Expected authenticated unmatched response [200,{ok:true}], received [401,{ok:false,error:{code:MAIL_EVENT}}] at tests/api/message-outcomes.test.mjs:168", "head": "35785ba0a677a6aa5f603871419bd643df9e883e", "job": "shards (api-2), 129156614417", "otherObservedFailure": "PLAN-010 bearer custody test: TypeError: fetch failed", "remoteAssertion": "unknown because archive transport failed", "test": "COMM-016 enclosing COMM-010 points 3 and 4: Amazon SES authenticated facts deduplicate, unmatched messages have no effect, and final outcomes resist late and equal-time non-final events"}

Final committed-head proof completed successfully: payroll-exact.json and browser-current.json both name 643c64323dee88c18e5b2fc542f1da730c92112f and exit 0. The real Timesheets downloads are captured at 1440 and 390 after the final fixture repair, and are identical after actual Worker restart. Final source lock and contract view checks pass on the clean worktree. Added text has zero email-shaped strings; no production source or contract judgment changed.

CLAIM TEAM-006 PARTIAL points=1,2,3,4,5 tests=tests/api/payroll-files.test.mjs#COST-007 payroll files qualify provider rows, approved workweeks, privacy and export authority; tests/browser/journey.spec.ts#COST-001 / COST-002, COST-006, COST-007 a technician clocks their first shift before any visit is assigned at 1440 and 390

Final rider disposition: 1 native outcomes pass with aggregate CI pending; 2 PASS; 3 PENDING fresh exact-head Verify; 4 PASS on the final committed-head payroll and browser receipts; 5 INSPECTED; 6 PASS; 7 INSPECTED; 8 PASS; 9 PASS; 10 NOT APPLICABLE; 11 PENDING guarded landing, publication scan and exact-main Run site. Every proof row above uses the final local receipts unless explicitly identified as a prior CI observation. The prior push event 42616113091 proved the native target in api-1 and browser-2 but failed overall; it is never represented as a successful final-head Verify.

Final exact-head publication scan state: {"commit": "643c64323dee88c18e5b2fc542f1da730c92112f", "complete": false, "findings": null, "fullHistory": true, "historyScanned": false, "responsibility": "fleet guarded lander", "status": "NOT RUN IN CLOUD"}
