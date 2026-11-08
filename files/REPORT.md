# sx-glove-c-f133: DATA-004 installation qualification

Product repository: just-every/run-glove. Branch: cloud/sx-glove-c-f133.
Candidate: be3c0d35d34c1b30a7162da2cd438304c023ac6c.
Integrated main: e65fd420554c15d42ef2dbb77300adf99e600704.

CLAIM DATA-004 DONE points=1 tests=tests/browser/fresh-install.spec.ts#DATA-004 fresh local installation completes service work as four separately signed-in people

This is a builder claim for guarded acceptance on landing. Contract judgments remain unchanged. Source counts before and after this run are 14 DONE, 220 PARTIAL, 29 MISSING, total 263. Accepting DATA-004 would yield 15 DONE, 219 PARTIAL, 29 MISSING. The only plan row proposed for change is DATA-004, PARTIAL to DONE. No other campaign or held provider point was taken.

## Plan and implementation

The complete execution plan is in PLAN.md. The prescribed starting head was beb43b5020a4198a2352f9b581403124e68559e0 on the prior continuation branch. Its push Verify 42484591659 was completed successfully. This run made a full-history clone, created the named branch at that head, and rebased its unpublished continuation onto current main before its first save. Ordinary rebase dropped the previous merge commits' resolution-only test hunks; they were restored before publication. Later main updates were merged, preserving published branch history. The final integration added main's segment assertions. Main's contract judgments were retained in full.

The resulting product diff contains only the edition-owned local personas, the new focused fresh-install journey, its installation runner and install-path alignment, and the regenerated source lock. No Base auth or server copy was modified. The existing journey, workflow, verification command inventory and browser partition count are unchanged. The focused file adds one registered journey; this continuation adds no further registrations and removes no assertion. There are eight CI shards, including four browser partitions; verification-plan.json records the computed plan and the fresh journey's browser-2 command.

The owner sets up a USD business, its priced service and checklist, invites three people with their separate roles, and links the technician to their actual operator. Each person enters through native local sign-in in their own browser context. Additional local personas are members until the owner's actual invitation assigns their business role. The dispatcher performs intake, quote preparation and approval, person-recorded customer acceptance, creation and booking, and recurring maintenance. The technician uses a 390-pixel phone through an actual browser offline interval. The office independently prepares and approves the invoice, records the customer's check, downloads the accounting CSV and cannot export the same approved revision again.

This continuation also checks the downloaded CSV's single accounting line, customer, invoice and job references, service, quantity, unit amount, currency, tax and gross total, rather than relying solely on text containing an amount. The receipt carries the actual tested source SHA. The dispatch proof selects the booked date again after each reload, so both screenshots show the real booking rather than today's empty board.

## Point and frozen proof rubric

All runtime rows below are proved by `tests/browser/fresh-install.spec.ts`, test “DATA-004 fresh local installation completes service work as four separately signed-in people”. It runs through `tests/browser/run.mjs`; fresh-copy installation performs frozen dependency installation, then the documented `rer install`, `rer setup --non-interactive` with an owner and a free local port, and foreground `rer dev`. It starts with an empty business and exactly one owner. Only the generated dev entry is used to sign in; it is never stored in this packet.

| Item | Outcome and public door | Proof lines and result |
| --- | --- | --- |
| Acceptance 1 | In a fresh local installation, the owner, dispatcher, technician and office complete the service-work journey. | Lines 48–335 perform the complete real installation journey. Local candidate result and exact-head Verify are recorded in the receipts below. |
| R1 | Owner business settings, priced service with required and optional checklist, three invitations and their effective roles, technician sign-in link. | Lines 66–108 perform owner controls and native sign-ins; lines 263–269 independently check retained values and four distinct identities. PASS locally. |
| R2 | Dispatcher request, customer and site, priced approved quote and customer's recorded acceptance, exact accepted job and booking. | Lines 112–163 perform dispatcher controls; lines 270–278 check exact retained customer, site, enquiry, quote and job, their amounts and actors, and booked technician, date and times. PASS locally. |
| R3 | Dispatcher makes a separate maintenance job recur without closing the future series when the first job is billed. | Lines 175–192 use the dispatcher's actual session and recurrence controls; lines 289–293 check two jobs, an open series, exact recurrence and three booked dates assigned to the technician. PASS locally. |
| R4 | Technician completes the visit on the phone through genuine lost connectivity and reconnect. | Lines 196–221 disconnect the real browser context, queue five items, independently read the owner session to prove the server still has a booked visit with no captures, then reconnect. Lines 278–288 check completed evidence, frozen checklist, summary, unsigned reason, capture kinds, times and technician. PASS locally. |
| R5 | Office prepares and approves a single invoice, records the check and exports exactly once. | Lines 224–245 use office controls and the CSV download; lines 294–299 independently check invoice state, revision, office preparation and approval, one paid $200 check and its 20,000-cent effect, one export and linkage. Lines 240–243 assert the accounting row. Lines 254–256 refuse a second export without mutation. PASS locally. |
| R6 | Each person's role boundary refuses an operation outside their role and retains all business and financial state. | Lines 246–256 attempt owner field arrival, dispatcher invoice approval, technician payment recording and office catalogue editing, requiring 403 FORBIDDEN and unchanged version, records, approvals and Activity. PASS locally. |
| R7 | Persisted records, Activity and business export attribute every performed step to its actual person and role. | Lines 258–325 reload all sessions, independently check retained records, then check 24 Activity kinds against each actual actor and their complete exported timeline counterparts. Exported domain collections must match the independently checked state. PASS locally. |
| R8 | Reloaded screens at 1440 and 390 show settings, accepted quote, booked dispatch day, recurring job, paid exported invoice, Activity, completed job and technician visits. | Lines 32–45 perform both-width reload proof; call sites capture eight screen pairs plus the actual disconnected phone screen. Screenshots and their hashes accompany the receipt. PASS locally; no separate duplicated full journey was added for each width. |
| Inherited BASE-INSTALL-001 | Free local installation through the documented verbs, independent owner state and ability to run the service journey. | `CONTRACT.md` DATA-004 explicitly cites this duty. Runner and runtime install path plus the same browser journey prove the local delta. MIT licence remains unchanged and is INSPECTED. No hosted or removal work is claimed. |
| Inherited BASE-DATA-005 | Owner independence and retention of the business's own records through the installation's export door. | `CONTRACT.md` DATA-004 explicitly cites this duty. Lines 309–325 download and inspect actual business data and attributable timeline. Base-wide erasure and retention duties remain with their owning clauses; no new custody semantics were introduced. |

## DONE riders

| Rider | Assessment on the candidate |
| --- | --- |
| 1 | PASS locally: the single acceptance point is reached through the public installation and four genuine sign-ins; rows R1–R8 identify all requested outcomes. Recorded exact-head Verify status is supplied separately below. |
| 2 | PASS: nonempty native records, independently expected money and states, actual CSV opening, four refused role attempts and unchanged retained state, plus once-only export. Test lines 240–256 and 265–325. |
| 3 | The focused file is selected by the existing push Verify browser command, in browser-2. Event, run id and exact-head conclusion are in the CI receipt. No nightly-only flag is needed. |
| 4 | PASS locally: receipt.sourceHead is the final candidate; the final proof was rerun after source changes and main integration. Screenshots derive from that run. |
| 5 | PASS INSPECTED: DATA-004 already cites BASE-DATA-005 and BASE-INSTALL-001 in its meta line; neither text nor inheritance changed. Inherited local deltas are mapped above. |
| 6 | PASS mechanical generation: generator write and check succeed; generated views were restored wholesale from main and are absent from product commits. Status, Gap, Evidence, counts and judged-from provenance remain the lander's single-writer responsibility. |
| 7 | PASS INSPECTED: no acceptance sentence, clause identifier, status row, policy or coverage rewrite. CONTRACT.md has no diff from integrated main. |
| 8 | PASS: all four role refusals plus repeated invoice export are executed through real command HTTP doors, with complete relevant state unchanged. No approval, correction or refund authority was added. |
| 9 | PASS boundary: proof is a local installation and an office-recorded check only. Hosted Cloudflare acceptance, live bookkeeping, customer card and wallet collection, messaging, native devices and provider activation remain held with their owning clauses. No live provider operation occurred. |
| 10 | PASS INSPECTED: no new policy default. The owner assigns existing roles; local persona members receive no harness-injected business authority. |
| 11 | PENDING FLEET: main equality, COMPLETE full-history publication scanning, guarded landing, status update and candidate Run site belong to the maintained lander. This packet establishes no landing. |

## Pre-ready self-check and limits

1. Every requested native outcome is reached by the named journey, including the money and authority refusal paths. Exact candidate CI is reported from GitHub, independently of earlier green SHAs.
2. Existing assertions were retained. The original `tests/browser/journey.spec.ts` and all existing command inventories are unchanged; no assertions were narrowed or hidden behind a new width condition.
3. No runtime authority, credential, erasure, restore or replay code changed. No restore or erased-person guarantee is inferred from this local journey. Within the changed flow the role and duplicate-export refusals leave data unchanged, and reconnect yields exactly the five queued captures once.
4. No UI component or stylesheet changed. Existing screens were inspected in the generated proof, including the actual offline phone and paid invoice. Existing cosmetic or configuration-placement issues are outside this proof-only change. Shared dispatch date controls retain their existing tooltips.
5. Source lock generation and check pass after final integration. The local fixture introduces no literal email address or provider-shaped key. Added slash tokens are the real timezone identifier and a real output directory. The product candidate has full history. No cloud publication scanner was run or fabricated.

Publication scan at be3c0d35d34c1b30a7162da2cd438304c023ac6c: status=DEFERRED_TO_GUARDED_LANDER; complete=unestablished; historyScanned=unestablished; findings=unestablished. The cloud adaptation requires this scan at landing and does not require a cloud-side scan for the branch push.

Current integrated main is e65fd420554c15d42ef2dbb77300adf99e600704, not the candidate. Its exact-head Verify 42488043620 and Run site 42488043641 both completed successfully. Candidate Run site and guarded main equality remain pending landing. No PR is required for the existing all-branch push Verify entry point, and none was opened.

PROBE DATA-004 1: fresh documented install, owner setup and invitations, four native sign-ins, dispatcher request through recurring booking, technician phone offline and reconnect, office invoice through check and one export -> retained attributed service records, five captures, paid $200 invoice with zero due, three future maintenance visits, exact accounting row and four unchanged role refusals.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses DATA-004 and check exit=0, followed by restoring main's generated files; ledger=none exit=0.

Local proof, final push and exact-head CI conclusions are written in FINAL-RESULTS.md and checks.json after their actual completion. Full terminal receipts and the source diff accompany this report. The actual screenshot set contains only synthetic installation data, never the dev entry, session material, credentials or environment dumps.

## Test inventory note

The static direct-registration inventory is 201 on integrated main and 202 on the candidate (159 API and 43 browser registrations). The requested new focused journey contributes one; this continuation adds no registrations beyond that inherited file. Loop expansion and standalone assertion scripts are not included in those figures. Main already exceeds the nominal 200-test cap before this work. No cap raise is requested, and no existing assertion or the required original journey was removed to conceal the pre-existing excess. The computed CI shape remains eight shards with four browser partitions. This process and inventory follow-up is disclosed to the lane, not presented as a passing complete test-budget receipt.

## Final exact-head conclusion

Push Verify 42488243039 completed successfully on be3c0d35d34c1b30a7162da2cd438304c023ac6c, observed through REST at 2026-11-08T14:23:51.225577+00:00. Rider 3 is PASS; rider 1 now includes recorded exact-SHA Verify. Rows 1–10 pass as qualified above; row 11 remains pending the guarded lander. FINAL-RESULTS.md and checks.json carry the complete terminal receipt. No workflow was dispatched or rerun and no known runtime blocker remains.
