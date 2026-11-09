# PLAN-004 qualification — sx-glove-c-f174

Repository: just-every/run-glove
Product branch: cloud/sx-glove-c-f174
Candidate: c8db50453f95e058921f9a842e8b9c2e8244227e
Integrated main: a81e93dc401029a20f3bf38570b4b2fefd637246

All seven native acceptance outcomes are qualified locally. No product defect was exposed, so no production file changed. The DONE claim is submitted for the independent landing gate; it does not assert that landing or the publication scan has happened. Contract judgments remain untouched.

The complete work plan is in PLAN.md. Execution followed that plan, with one prerequisite addition: current main's maintained inventory reported 203 tests before this round. The new due-list journeys add three registrations. Six redundant stage registrations in the existing shared-installation first-release journey were folded into its quote-preparation and invoice-preparation journeys, giving 200 total tests. All 416 existing assertion expressions are preserved byte for byte, the original stage order is retained, and every test name cited by CONTRACT.md remains a registration. The independent agent, import and final timeline tests remain registrations. No assertion was removed, narrowed, skipped or placed behind a condition. No duplicate assertion was deleted.

The protected agreement tests, existing due-visits browser journey, dispatch and series command sources, and mail-provider fixture have no branch diff against main. The harness needed no change. PLAN-010 and PLAN-011 proof was read only. Existing messaging, agent outreach, payment, provider, runtime-pin and release holds remain unchanged. No policy default was adopted, no live provider acceptance is claimed, and no provider credentials were needed.

Two focused API registrations contain seven independently named scenarios, each with its own installation and fixed runtime clock. The browser journey uses the production Worker and native sessions, forwards the built desk application's domain requests to that Worker, and uses real controls. Only provider transport is faked. Assertions run at 1440; the same filtered booked-state screen is captured at 1440 and 390.

## Acceptance proof

The API file is tests/api/due-visit-list.test.mjs. Test A is “PLAN-004 points 1 to 3: forty-visit campaign, complete due rows and exact local calendar filters”. Test B is “PLAN-004 points 4 to 7: entitlement identity survives completion, cancellation, term end and Worker upgrade”. The browser file is tests/browser/due-visit-list.spec.ts and its test is “PLAN-004 Office filters individual due visits and books through desk controls while outstanding work stays listed”. Every row below executes public commands or HTTP routes; no production helper computes its expected due dates or remainder.

| Row | Acceptance outcome | Proof and observed result | Local result |
| --- | --- | --- | --- |
| P1 | Generate 40 visits, book 30 by area, send 8 links, record 2 declines; list and REPORT-001 agree | Test A, scenario at line 46. Twenty two-visit agreements across 78704 and 78701. Office and Dispatcher book the thirty 78704 entries. Office sends exactly eight Postmark-edge messages through agreement.offer with email true, and every captured body contains its actual issued booking link. Two distinct customers decline the other two entries. Complete row projections and dashboard identities/count are checked after every individual step and after actual Worker restart. Forty remain after booking and offers; exactly thirty-eight remain after the two declines. | PASS |
| P2 | Separate agreement and ordinal entries with due date, customer, site, ZIP, linked job and booking state | Test A, scenario at line 114. A three-visit five-month term starting January 31 yields January 31, February 28 and April 30; ordinal 1 is reserved and booked and all fields are compared before and after restart. Campaign expectations also enumerate all forty entries independently. | PASS |
| P3 | Local today, inclusive date bounds, exact ZIP | Test A, scenario at line 127. At 2026-11-06T00:30Z Chicago is November 5. Default through is November 5; same-day and two-ended ranges include their endpoints; adjacent ZIP and partial ZIP do not match; impossible dates and reversed bounds return 400 with unchanged business export. Browser lines 40–56 exercise local default, exact ZIP, season bounds and corrective error through controls. | PASS |
| P4 | Completing a later entitlement removes only that entitlement | Test B, scenario at line 148. Both siblings are booked, the assigned technician completes ordinal 1 first, only ordinal 0 with its original date remains, replay adds nothing, and restart retains that exact remainder. | PASS |
| P5 | Booking, cancellation, term expiry and ending retain work | Test B, scenario at line 170. A fixed term ends November 5; the runtime clock crosses to November 6. The agreement is confirmed inactive. Booking, cancellation, clock expiry, agreement.end and actual restart each preserve the independent two-entry expectation and dashboard count. | PASS |
| P6 | New ordinals persist; older jobs take first unclaimed ordinals in stored order | Test B, scenario at line 183. The existing workerPlugins build seam omits only the ordinal field when creating two old-shape jobs through job.create. Their stored order is observed through the state door. restart with rebuild true upgrades the actual Worker without changing its D1. Old jobs map to 0 and 1, a new explicit job keeps 2, and another restart preserves all dates and identities. No journal or domain record is written directly. | PASS |
| P7 | Retain a cancelled job and rebook it | Test B, scenario at line 204. The cancelled booking loses its visit reference but keeps the original job; another booking reuses it and state contains exactly one job. A duplicate job.create for the claimed ordinal is refused and the full business export stays equal. Browser lines 57–86 assert retained due rows, an exact ordinal-1 job and booked versus unbooked siblings. | PASS |

## Inherited duties and brief riders

| Duty | Proof | Result |
| --- | --- | --- |
| PLAN-002 calendar calculation | P2's independent 31st-to-month-end dates and zero-based ordinals | PASS |
| REPORT-001 identical remainder | same helper at API lines 38–42 compares full due projections, dashboard count and dashboard identity list after every campaign step, completion, cancellation, term change and restart | PASS |
| Read-only due inspection | P3 and P7 compare complete business exports around populated reads, bad dates and denied reads | PASS |
| Technician and Subcontractor refusal | P7 attempts both roles against the populated due route and receives 403; signed-out read receives 401 | PASS |
| Branch-limited desk visibility | P7 creates a second branch with its own real agreement; the scoped Office sees exactly those two independently expected entries | PASS |
| Current authority and revoked credentials | P7 changes the reader to Technician, then signs out the same native session; subsequent requests return 403 and 401 respectively | PASS |
| Erasure and replay fences | P7 erases a customer through preview and confirmed erase, then replays its original job command; ERASED returns and export remains unchanged. After actual restart the erased agreement and personal names and address are absent from the due list. P1 offer and decline replay and P4 completion replay also leave the complete export unchanged. | PASS |
| DATA-002 actual actor attribution | P1 traverses every Activity page and finds sales, bookings, offers and declines with the exact command, subject, actual Office or Dispatcher, role and fixed time, then compares the export's timeline metadata. P4 does the same for the actual Technician's completion. | PASS |
| Office desk proof | Browser test at line 9, assertions at 1440, screenshots at both required widths; real date, area, row-selection and booking controls | PASS |
| AGENT-008 and AGENT-016 morning brief ownership | Their existing due-list inheritance remains untouched; this round does not add a morning-brief claim | INSPECTED |
| PLAN-008, PLAN-009, PLAN-010 and PLAN-011 boundaries | No broader batch-outcome, decline-policy, bearer-custody or communication-history claim; existing protected proof and source remain intact | INSPECTED |

## DONE-RIDERS

| Rider | Result | Evidence |
| --- | --- | --- |
| 1 | PASS locally; exact-SHA CI is recorded separately | P1–P7 rows and browser journey exercise every native outcome on populated records |
| 2 | PASS | Independent dates and row enumeration; permitted and refused authority paths; duplicate refusal preserves the whole export |
| 3 | PENDING CI at report construction | Both new files are selected by Verify's existing API and browser globs; no workflow or verification configuration changed |
| 4 | PASS | Final API run is on the full candidate SHA. Browser start and completion receipts bind the final invocation and screenshot hashes to that SHA |
| 5 | PASS | PLAN-004 acceptance point 2 names the PLAN-002 due-date duty; point 1 names REPORT-001; the clause explicitly leaves morning brief ownership to AGENT-008 and AGENT-016 |
| 6 | PASS for builder-owned mechanics; landing judgments pending | Contract generator write and check both exit 0; generated views restored from main; no Status, Gap or Evidence cell changed |
| 7 | PASS | No acceptance text, rider, clause ID, status row or coverage rewrite |
| 8 | PASS | P7 executes allowed desk reads and booking, field-role and branch restrictions, revoked session, duplicate ordinal refusal, erased replay and zero-write refusals |
| 9 | PASS | Only mail-provider edge acceptance is asserted. No live delivery, provider deletion, legal or payment boundary is reported as proved |
| 10 | INAPPLICABLE | No custody, consent, spending or authority default added |
| 11 | PENDING GUARDED LANDING | Main equality, complete full-history publication scan, exact-SHA Verify and Run site are the maintained fleet lander's conditions; no cloud main push occurred |

## Pre-READY self-check and mechanics

1. Each user-visible acceptance outcome is performed and observed by a populated public-door journey. Removing the due projection, inclusive filtering, ordinal allocation, persistence or refusal path makes its direct expectation fail. Exact-SHA Verify status is recorded in ci-status.json when observed.
2. All existing assertion expressions remain intact. The 03, 04 and 09 first-release registration names cited by the contract remain registrations, as do independent agent, import and final timeline tests. All shared-installation stages retain their original order.
3. Current authority, signed-out and revoked sessions, erasure and replay have direct checks as described above.
4. No product screen changed. The touched proof screen was inspected at both widths: ordinary text is at least 13 px, controls carry text labels, the menu button contains “Dispatch”, and the browser-native date icons retain native semantics. No new icon-only control, configuration surface or border was introduced.
5. Lock and views are fresh. Publication scan and Run site remain unestablished in cloud and are explicitly pending fleet custody; their absence is not reported as a green result.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write then check exit=0; ledger=none exit=0.

PROBE PLAN-004 1: production command campaign and due-visits plus dashboard routes -> 40 entries, 30 booked in one ZIP, exactly 8 emails, 2 explicit declines, exact 38-entry remainder survives restart.
PROBE PLAN-004 2: production plan and agreement commands, ordinal-1 job and booking -> January 31, February 28 and April 30 entries retain every expected field and link.
PROBE PLAN-004 3: due-visits at fixed UTC November 6 and Chicago November 5 -> local default, inclusive endpoint sets, exact ZIP sets and 400 on impossible dates with no business writes.
PROBE PLAN-004 4: assigned worker completes ordinal 1 -> only that entry disappears; ordinal 0 and its date survive replay and restart.
PROBE PLAN-004 5: visit booking, cancellation, runtime term expiry and agreement.end -> both outstanding entries remain at each step.
PROBE PLAN-004 6: old-shape command-created jobs and rebuild restart -> stored jobs map to the first unclaimed ordinals, new explicit ordinal stays fixed.
PROBE PLAN-004 7: cancel, rebook, duplicate command, restricted reads, erasure and replay -> original job reused, duplicate refused without writes, restricted reads denied, erased history never resurrects.

## Counts, custody and limitations

Contract source counts before and after this branch against integrated main: 24 DONE, 210 PARTIAL, 29 MISSING; all 263 judgments remain. PLAN-004 source status is PARTIAL and unchanged. The submitted claim qualifies all seven points, from zero separately qualified outcomes to seven; only the lander writes any accepted status change. If accepted without other main changes the counts become 25 DONE, 209 PARTIAL, 29 MISSING.

Maintained test inventory: main 203; candidate 200, including four assertion scripts. All thirteen touched API registrations and one browser registration pass locally. Typecheck, first-party check, source-lock check and generated-document check exit 0. The API runner used pinned Node 22.20.0. Browser Chromium is /usr/bin/chromium with no sandbox and a 1200-second hard timeout. Browsers and owned servers finish before handoff.

Product custody is separate from evidence publication. Product head is pushed only to cloud/sx-glove-c-f174, and no PR is required because Verify has a push entry point for all branches. Reports, receipts and synthetic screenshots go only to evidence/sx-glove-c-f174. No evidence is committed to the product branch. Main remains a81e93dc401029a20f3bf38570b4b2fefd637246 at integration and does not equal the candidate. The last observed pre-integration main 91f64e494b7e2f4c29f47457a92ca24e8b5b3dde had successful Verify 42541507336 and Run site 42541507337.

Exact-SHA publication scan receipt: commit=c8db50453f95e058921f9a842e8b9c2e8244227e; complete=unestablished; historyScanned=unestablished; findings=unestablished. The cloud does not have the fleet publication scanner. No complete or zero-findings result is claimed.

There are no native product blockers, live account requirements, adopted policy defaults or retained acceptance gaps in PLAN-004. Exact-SHA CI, publication scanning, status judgment, main equality and Run site remain the independent landing gate's responsibility. PLAN-004 is the only plan row proposed for advancement; no lane plan file was edited.

Exact candidate Verify: run 42544696977, event push, status pending, conclusion unestablished, head c8db50453f95e058921f9a842e8b9c2e8244227e. No green CI result is claimed. Cloud handoff follows the brief’s explicit no-wait READY route; the fleet must obtain exact-SHA success before landing. Three GitHub API calls were used; no rerun or dispatch was requested.

CLAIM PLAN-004 DONE points=1,2,3,4,5,6,7 tests=tests/api/due-visit-list.test.mjs#PLAN-004 points 1 to 3: forty-visit campaign, complete due rows and exact local calendar filters; tests/api/due-visit-list.test.mjs#PLAN-004 points 4 to 7: entitlement identity survives completion, cancellation, term end and Worker upgrade; tests/browser/due-visit-list.spec.ts#PLAN-004 Office filters individual due visits and books through desk controls while outstanding work stays listed
