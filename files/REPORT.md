# sx-glove-c-f207 — ServiceTitan move-in

Candidate: `db35289a917e7bdcb4a69f23306a3565e198f286`, branch `cloud/sx-glove-c-f207`, repository https://github.com/just-every/run-glove . No pull request is required: Verify accepts branch pushes. Only the named product branch is published. The complete plan is in `PLAN.md`.

CLAIM MOVE-003 PARTIAL points=1,2,3,4,5,6 tests=tests/api/servicetitan-memberships.test.mjs#MOVE-009 memberships retain event entitlements and source terms until a person activates an exact imported rule; tests/browser/movein.spec.ts#MOVE-003, MOVE-009 servicetitan: owner previews, commits, reads the imported work and balance, and undoes at 1440 and 390
GAP MOVE-003: Point 7 retains the brief's MOVE-005 QuickBooks and cutover hold, MOVE-006 saved-method and authorization hold, and R-20 real-owner ServiceTitan export proof. No live export reconciliation or provider acceptance is claimed.

## Changes and reproduction

The public import door reproduced editable `draft` estimates, a source material's non-taxable flag being replaced with TAXABLE, and a Completed job remaining in the live completed state. Estimates now remain imported, read-only source history, retain the documented status object and item identities, use the referenced price-book taxable flags, and reject inconsistent source line totals. Completed source jobs become archived while retaining their exact source status and completion time. `REPRODUCTION.txt` records the observed before-state.

Contact loss did not reproduce on the cloned main: all four channels of the second customer, their source IDs and memos were already linked. That mapping is unchanged. The fixture uses only documented contact fields, without invented people or roles. Estimate status uses the documented V2 object with integer value and string name; no native approval or acceptance is inferred.

The six named scenario steps extend the existing MOVE-009 registration without renaming it. The existing combined provider test file remains unedited. Qualification pages live in a separate fixture subdirectory and replace pages only for the focused ServiceTitan journeys; the original combined fixtures and every other adapter retain their inputs and results. No Base-copied import-kit file, workflow, homepage, runtime pin or contract judgment is edited.

Main advanced during the run with FIELD-010 and then COMM-010. Their product changes and newer contract judgments were merged, without rewriting any published commit. The source contract equals merged main `a49572307a6e66f53dc1fd39b0260c2c5a1b6361`. The clone began with 39 DONE, 195 PARTIAL, 29 MISSING; merged main and this candidate have 41 DONE, 193 PARTIAL, 29 MISSING. Those count changes belong entirely to FIELD-010 and COMM-010. MOVE-003 remains PARTIAL. Native independently qualified acceptance points increase from the audit's 0 to 6. Inventory began at 199/200, reached 200/200 after FIELD-010 and is 202/200 after the subsequent COMM-010 merge. This round adds zero registrations and removes zero assertions. The inherited over-cap inventory is reported to the lane; newer main proof is preserved rather than deleted.

## Acceptance proof register

All API rows use the real Worker, migrated D1 and native sessions. Only provider network edges are faked. The browser uses the real local application and routes Glove requests to that same Worker harness. Screens are captured once per changed screen at 1440 and 390; the new behavioral assertions run at 1440. The existing assertions at both widths remain intact.

| Item | Public door, performed outcome and independently checked result | Proof |
| --- | --- | --- |
| MOVE-003 point 1 | Owner stage changes no business record; Office is refused; a wrong reviewed fingerprint cannot commit. Complete imported history can be committed and undone. | API lines 258–269, 383–405; browser line 148 |
| MOVE-003 point 2 | Exact reviewed preview commits. Source estimate approval, revision, recorded sending, acceptance, decline, link, actual email, attachment and job creation are refused without changes. A separate new native quote is approved, accepted and creates its job; its dependent work blocks destructive undo. Inconsistent source line totals are rejected in preview. | API lines 271–320; browser source estimate and undo steps |
| MOVE-003 point 3 | Independently enumerated source IDs, two customer locations, every contact and memo, lead links, quote links and item IDs, archived completed job, two technician assignments of one appointment, service and material prices and costs, source-timed note, equipment and warranty dates are checked. Every original file is downloaded byte-for-byte through the authorized file door; Office and anonymous access fail. | API lines 322–364; browser source estimate and contacts screens |
| MOVE-003 point 4 | Invoice 14 retains remaining 76.50 against source total 216.50, dated 2026-10-22 and notForPosting. Approval and export are refused; revenue is exactly zero, tax entries empty, and aging includes only 76.50. | API lines 366–381; existing browser invoice and aging screens |
| MOVE-003 point 5 | Stage, commit, same-command replay, a new identical batch, actual persisted Worker restart, successful undo and undo replay preserve the expected records. Outbound attempts remain at their pre-import baseline; no payment attempt, charge, receipt, invoice approval or export, or series occurrence appears. Activity retains one attributable event per command. Office undo is refused unchanged. | API lines 383–405 and shared noEffects assertions; existing membership restart, revocation and erasure proof retained |
| MOVE-003 point 6 | Preview names the unknown customer field, missing attachment, unassigned appointment 28, missing customer 999 for location 33, and rejected-parent job 32. Exact original files remain downloadable after undo. Unsupported recurrence shapes remain named by the unchanged membership journey. | API lines 407–420; existing membership point 3; browser complete review screen |
| MOVE-003 point 7 | Held by the explicit assignment boundary; no synthetic fixture substitutes for a real-owner export or payment authorization. | UNMET-EXTERNAL and held prerequisite work; not claimed |
| Inherited MOVE-001 source-history duty | Source status is retained without a Glove decision, every customer action is refused, native work requires a new quote, source closed work is archived, and notes and downloaded bytes retain their original custody. | API points 2–4 |
| Inherited reviewed import and destructive-undo duty | Owner succeeds; wrong role and fingerprint fail unchanged; exact bytes survive restart and undo; native dependent work prevents deletion. | API points 1–3 and 5 |

## DONE-RIDERS review

This is a PARTIAL claim, with only the six requested native points qualified. It is not a DONE or landing claim.

| Rider | Result | Evidence or boundary |
| --- | --- | --- |
| 1 | PASS locally for points 1–6; point 7 held | The six named public-door scenarios and the existing ServiceTitan browser case reach the enumerated outcomes above. |
| 2 | PASS | Nonempty independent fixture expectations; allowed import and native quote creation; unsafe approval, sending, file access and destructive undo refused unchanged. |
| 3 | FAIL: Verify red | Exact-SHA push Verify 42599653161 completed with failure in the existing browser-2 document-print test. Native MOVE-003 local proof passes; the branch is blocked for CI triage. |
| 4 | PASS for tested bytes | Final focused API and browser commands are recorded with the candidate head. The earlier combined regression is supplemental; its adapter and fixture inputs remain unchanged. |
| 5 | INSPECTED | MOVE-003 names its owner import duties and inherits MOVE-001 through its existing operating rules; no new inheritance or contract text is added. |
| 6 | Mechanical PASS; judgment owned by lander | Generator write and check pass, generated views are restored whole from main, and the source contract is unchanged. The builder leaves the old audit cell intact for the lane. |
| 7 | PASS | No acceptance sentence, status row or coverage mapping changed. Main's newer FIELD-010 judgment is retained whole. |
| 8 | PASS | Owner allowed; Office stage, commit, undo and retained-file download refused; anonymous file download refused; native-dependent undo refused. |
| 9 | PASS with explicit limit | Synthetic documented-shape files only. Point 7 and R-20 remain unclaimed. |
| 10 | NOT APPLICABLE | No new policy default: read-only source quotes and archived closed jobs implement the existing operating rules. |
| 11 | PENDING GUARDED LANDING | The cloud publishes branch-only. Main equality, COMPLETE full-history publication scan with zero findings, exact-SHA landing Verify and Run site remain fleet duties. |

## Pre-READY checks and execution notes

1. Every claimed native outcome has a real performed public-door assertion; the quote refusal paths change nothing. Exact-SHA CI state is retained honestly in `CI.json`.
2. No existing assertion is removed, narrowed or moved behind a condition. New browser assertions run at 1440 and both widths receive screenshots.
3. Existing membership revocation and erased-person replay tests remain active and pass along with the new import replay and restart scenarios. Owner-only original-byte custody and unsafe undo are asserted.
4. No UI component is edited. The existing source-history quote component is exercised; the changed screens use labeled controls, readable existing typography and no new icon-only action. Desktop and phone images are in the packet.
5. Source lock and generated-document checks are recorded in `RECEIPT.json`. No migration changed. Publication scan is NOT RUN in cloud: commit `db35289a917e7bdcb4a69f23306a3565e198f286`, complete=unestablished, historyScanned=unestablished, findings=unestablished. No zero-finding claim is made. Run site and main equality are pending the lander. New qualification files contain zero literal email-shaped strings; email fixture values use JSON escapes or are assembled at runtime.

The first fresh-copy browser setup failed its internal-listener health handshake before a page opened. The already completed local installation started successfully. The first added browser step then reproduced a test setup error: returning to Move in resets the selector to ServiceM8, leaving Preview disabled for ServiceTitan files. The test now explicitly reselects ServiceTitan. Neither failure led to a speculative product or Base repair. The successful final browser receipt and screenshots supersede those failed attempts; their actual sanitized receipts are retained.

PROBE MOVE-003 1: import.stage as Owner, Office and with an unreviewed commit fingerprint -> preview only; FORBIDDEN and IMPORT_REVIEW without business changes.
PROBE MOVE-003 2: import.commit and source estimate customer actions -> imported source history; every unsafe action refused; a new native quote creates its own job and blocks destructive undo.
PROBE MOVE-003 3: state, source record review and authorized original-file GET -> enumerated linked records, memos, source time, warranties and exact bytes; Office 403 and anonymous 401.
PROBE MOVE-003 4: invoice.approve, invoice.export and revenue, tax and aging reads -> imported approval refused, NOTHING_TO_EXPORT, zero new revenue or tax, dated 76.50 remaining balance.
PROBE MOVE-003 5: identical command and batch replay, actual Worker restart, import.undo and undo replay -> unchanged outbound attempts, no payment or recurring authority, original business state restored.
PROBE MOVE-003 6: preview and original-file GET after undo -> named unknown field, missing bytes, unassigned appointment and rejected parents, with source retained.

Plan row proposed for the lane: MOVE-003 native points 1–6 qualified; retain PARTIAL and the explicit point 7 holds. No plan file, INBOX or STATE file was edited from cloud.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses MOVE-003 and check, then restore main views exit=0; ledger=none exit=0. Inventory is separately 202/200 exit=1, inherited from merged main with zero added registrations.

Exact-SHA Verify: push event, run 42599653161, head db35289a917e7bdcb4a69f23306a3565e198f286, completed with failure. The failing job is shards (browser-2), test QUOTE-015 scoped documents print complete facts without controls or bearer fragments at 1440 and 390, at tests/browser/document-print.spec.ts:147: TypeError: fetch failed, caused by SocketError: other side closed. No earlier-SHA green is claimed.


## Terminal CI triage and blocker

BLOCKED branch=cloud/sx-glove-c-f207 head=db35289a917e7bdcb4a69f23306a3565e198f286 reason=unreproduced_Verify_socket_failure_requires_CI_triage

The archive was read once with `gh run view 42599653161 --repo just-every/run-glove --log-failed`. The last remaining GitHub call was used for the whole failed-job archive; the numeric job ID was not retrieved. The job name is recorded exactly, and no additional API or workflow rerun was attempted after the ten-call budget. The sanitized archive omits environment listings and URL queries.

Before any repair, the candidate's exact failed command was run with browser-2, CI mode, the prebuilt Worker, Node 22.20.0 and Chromium with the required sandbox flags: `node scripts/verify-ci.mjs browser-2`, under the required 1200-second bound. It reached the same document-print test but failed with a different error: `.printable-document` was not visible within 5000 ms. The slower cloud run reached 10 of 16 tests before the alarm. Its actual exit was 242 (the subreaper returns the alarm-terminated child's negative signal status through the shell). Orphaned child test processes were stopped by their known owned PIDs. No production or test assertion was changed in response.

The same document-print test was then attempted on candidate-parent main a49572307a6e66f53dc1fd39b0260c2c5a1b6361 on the same cloud runner. Native app listener readiness failed before the test opened, exit 1. This does not establish the original socket failure on main. The brief explicitly requires stopping BLOCKED when the failed assertion does not reproduce; a speculative fix or a claim of green would be incorrect.

VERIFY_NOT_REPRODUCED {"head":"db35289a917e7bdcb4a69f23306a3565e198f286","job":"shards (browser-2)","command":"node scripts/verify-ci.mjs browser-2","test":"QUOTE-015 scoped documents print complete facts without controls or bearer fragments at 1440 and 390","exit":242,"failure":"local visibility timeouts and 1200-second bound; original CI SocketError not reproduced"}

Product work remains pushed, all six focused native steps and the ServiceTitan owner browser journey passed on the final SHA, and no contract judgment was changed. Recovery data is also retained outside both worktrees: product-recovery.bundle, SHA-256 97c6c28e30960dbeb4e3d16314ffd57e142bef8c46a87a746b2ecd67fb3164f0. It is verified and requires the three main prerequisite commits listed in CI-TRIAGE.json; it is recovery data, not proof of READY or landing. The complete plan and actual terminal outputs remain in this packet. FV must triage the red browser job before the fleet can land this branch.
