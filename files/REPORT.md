# sx-glove-c-f138 — DISP-013 field access qualification

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f138
Candidate: cc09ce1f85506ef57ebdbefe1f54efb59a3b3054
Base main: f5d2b44b4e731aaee612cdde0fcb6cc24b2181b5
Checkpoint: 7e21cca (published with skipped CI)
PR: none required; the existing push entry point started Verify 42495799161.

DISP-013's five native acceptance points are qualified through real native invitations, production Worker routes, persistent disposable D1, commands, original files, Activity, business export and the built phone. All existing crew and DISP-014 assertions remain intact. No contract acceptance text or judgment cell changed. Counts remain 17 DONE, 217 PARTIAL, 29 MISSING before and after; the guarded lander alone applies the claimed PARTIAL to DONE transition. If accepted, that transition would yield 18 DONE, 216 PARTIAL, 29 MISSING.

## Work and findings

The plan is in PLAN.md. The existing combined crew journey supplied partial proof, but did not separately perform the full five outcomes. The new focused API journey has named subtests for those outcomes, sharing one real installed business, two jobs, two sites, employee visits, a two-person crew, and an invited subcontractor with independent expected records. It pins the clock and restarts the actual Worker while retaining D1 on disk. Mail is faked only at the invitation provider boundary; no domain record is seeded with SQL.

The initial public-door assertions exposed these defects, which were repaired:

- An old capture on a reassigned visit remained in state while another visit of that job was still assigned. Captures now require both the person's technician identity and a currently visible visit.
- Completion's first response and saved replay included the agreed amount and assignment history. Both now use the same bounded visit projection as state, with arrival and completion restricted to that person's work.
- Former assignments still admitted field writes and saved-command reads. Both fresh execution and replay now require the current subcontractor assignment; the Technician's existing late-evidence path remains unchanged.
- A direct price-book image file ID returned original bytes to a Subcontractor. The original-file gate now refuses that role while preserving the existing Technician and desk access. This small repair in src/glove/api.ts is necessary for the brief's named original-file public door.

No offline-day or screen repair was required. The built phone already clears a retained Technician day when the current role is Subcontractor and offers no notification, clock, timer, nameplate, quote, invoice, refrigerant or expense control.

## Frozen acceptance rubric and proof

Every row below was performed against the candidate's source; api.log and browser.log are actual final runs on the clean committed candidate. The exact-head CI event and conclusion are recorded below and in candidate-ci.json and the polling receipts.

| Row | Acceptance sentence or inherited duty | Public door and observed outcome | Evidence |
| --- | --- | --- | --- |
| R1 | Point 1: built-in role, invited and signed in like staff | An invitation returns 202; its mailed confirmation returns 303; the resulting native member session holds the assigned Subcontractor role and the exact linked technician. Only the three field commands and bounded read permissions are granted. | tests/api/subcontractor-field.test.mjs:41, `point 1: mailed staff invitation confirms a built-in Subcontractor linked to their technician`; tests/api/harness.mjs:205 |
| R2 | Point 2: only current visits and their bounded job, checklist, forms, site, customer and own captures | Independently enumerated visits exclude employees and crew members. Reassignment and cancellation remove visits; removing the second-site assignment removes its job, site and customer. Ordered checklist items and frozen form questions survive library edits and actual Worker restart. Another worker's handoff evidence is hidden. | tests/api/subcontractor-field.test.mjs:55, `point 2: exact current assignments, bounded records and frozen ordered work survive Worker restart` |
| R3 | Point 3: no desk money, quotes, invoices, price book, equipment, timeline, other work or visits | Own original photo bytes match exactly; employee and price-book originals return 404. Every enumerated desk read and export route returns 403; job timelines and Activity are empty. Property history contains only the visible job, current visit and that person's captures. Employee, crew, price, cost and agreed-amount sentinels are absent. A genuine invoice and CSV export exist before refusal. | tests/api/subcontractor-field.test.mjs:153, `point 3: files and every other read door expose no desk money, timeline or other worker data` |
| R4 | Point 4: arrival, checklist, notes, photos, described materials, forms and completion | Every checklist item, including reasoned not-applicable, a note, a captioned photo, a fractional described material, the frozen form and completion land on the person's visit. Each replay returns the bounded result with unchanged state and export. Every same act on an employee visit is refused with all records and events unchanged. Results persist after restart. | tests/api/subcontractor-field.test.mjs:106, `point 4: arrival, every checklist item, note, captioned photo, described material, frozen form and completion land once with attribution` |
| R5 | Point 5: excluded writes, no offline day and no pushes | Both clock verbs, timers, refrigerant, expenses, priced work, an actual price-book material, field quote and invoice preparation, nameplate verbs, location consent and phone reports, and subscription verbs all refuse without a retained effect. At 390 px the built phone has no notification control, clears an old Technician day on reload, and cannot reconstruct work when the state transport is unavailable. Zero push subscriptions and sends. | tests/api/subcontractor-field.test.mjs:192, `point 5: all Technician-only writes refuse without retained effects; erasure and withdrawn sessions cannot replay captures`; tests/browser/subcontractor.spec.ts:9, `DISP-013 subcontractor phone has current work but no notification control or offline day after reload` |
| R6 | Inherited BASE-AUDIT-001 | Each permitted own-visit act has exactly one Activity event and export timeline entry with the exact command, actor, role, customer job and pinned receipt time. Native role assignment and technician linking also retain owner attribution. | tests/api/subcontractor-field.test.mjs:50 and :134; existing tests/api/subcontract.test.mjs retained in the passing run |
| R7 | Inherited BASE-ROLE-001 | Supported writes complete, other visits and excluded capabilities refuse with unchanged state and export; role withdrawal refuses saved replay, customer erasure removes personal content and original bytes, and revoked native sessions refuse state and commands. | tests/api/subcontractor-field.test.mjs:22, :32, :85, :99, :117 and :208 |

PROBE DISP-013 1: /auth/invite, mailed /auth/confirm, role.set and technician.save -> native member session acts as linked built-in Subcontractor, with only three field commands.
PROBE DISP-013 2: /api/glove/state before and after visit.change, visit.cancel and Worker restart -> exact current visits and bounded frozen work; removed site records and former captures disappear.
PROBE DISP-013 3: own and employee original files, price-book image, populated invoice CSV, all enumerated desk reads, timelines, Activity and property history -> own photo bytes exact; originals 404; desk reads 403; no other work or money in permitted responses.
PROBE DISP-013 4: visit.arrive, every checklist result, note, captioned photo, material description, frozen form and visit.complete -> one effect and attributable Activity and export per act; same acts on employee visit refuse unchanged.
PROBE DISP-013 5: all excluded commands and built phone at 390 px across reload -> no write effect, no subscriptions or sends, no notification control, no retained offline day, no offline work reconstruction.

## DONE-RIDERS

| Rider | Result | Exact candidate evidence or boundary |
| --- | --- | --- |
| 1 | PASS | R1–R5 cover every acceptance outcome through public doors; API and browser receipts bind the clean full candidate SHA. |
| 2 | PASS | R2–R4 use populated employee and crew data, actual files and exported invoices, independent expected rows, supported execution and refused execution with unchanged records. |
| 3 | PASS | The existing Verify file discovery includes the new API file in api-2 and browser file in browser-1. Push Verify 42495799161 is for the exact candidate; the second five-minute poll records completed and success on that exact SHA. |
| 4 | PASS | Final API, browser, typecheck, first-party, contract and lock checks ran on cc09ce1f85506ef57ebdbefe1f54efb59a3b3054 with a clean worktree; product-receipt.json records source hashes. |
| 5 | PASS | DISP-013's unchanged meta line cites BASE-AUDIT-001 and BASE-ROLE-001. R6 and R7 supply attributable audit and both allowed and refused authority paths. |
| 6 | PASS mechanical; judgments reserved | Contract generation writes zero changed files and check succeeds. The existing PARTIAL judgment and its Gap and Evidence are intentionally unchanged under the single-writer instruction; the lander applies the claim. |
| 7 | PASS, INSPECTED | CONTRACT.md is byte-identical to main; no acceptance point, coverage map, status row, incumbent, inherited duty or provider boundary changed. |
| 8 | PASS | Each allowed capture completes and replays once; the same act on an employee visit refuses. Reassigned and cancelled visits, role withdrawal, erasure and revoked sessions cannot return the old personal capture or create a new effect. |
| 9 | PASS, INSPECTED | No provider delivery, filing, legal compliance, native-device, offline Technician or account-activation proof is inferred. The invitation provider edge is the only relevant network fake; all existing account and provider holds remain. |
| 10 | PASS, INSPECTED | No new policy default or authority was adopted. Denial and projection repairs enforce DISP-013's existing current-assignment and no-price requirements. |
| 11 | PENDING GUARDED LANDER | Candidate remains branch-only. Main equality, full-history publication scanning, landing, and candidate Run site are fleet duties. No cloud scanner receipt or main success is fabricated. |

## Pre-READY self-check

1. All five named user outcomes are performed and inspected through public doors. Existing behavior removal causes a failed assertion or command, including the privacy defects that failed during development. Exact-head push Verify 42495799161 is completed and successful.
2. No prior test or assertion was removed, narrowed, skipped, conditioned by width, or modified. The existing combined subcontract and filing journey is unchanged and passed. New UI behavior assertions run at 390 px; proof captures show 390 and 1440 px.
3. R4 and R7 prove once-only replay, authority withdrawal, erased personal evidence and files, and revoked native credentials. No retained work can be resurrected through those paths.
4. No UI source changed. Inspection of the actual screenshots shows the existing screens, readable text, complete card borders and text-labelled controls. The browser asserts no unlabeled icon-only control. No new configuration or top-level action was added.
5. Source lock is fresh, generated documents check successfully, build and local touched checks pass. Exact-head Verify, scan, main equality and Run site are honestly separated below. No added line contains an email-shaped string. No Base, rer or dependency pin changed.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock, then node scripts/edition-authoring/cli.mjs check exit=0; views=node scripts/contract-docs.mjs write and check exit=0, generated views restored from origin/main; ledger=none exit=0.

Touched checks: 13 API tests passed, zero failed; one built-browser journey passed, zero failed; typecheck, production build, first-party check, contract write and check, source lock generation and check, and clean-tree verification all succeeded. Final local and browser receipts give commands, exits, head, source hashes and screenshot hashes. No full local suite was run. Literal Node and Playwright registrations in the relevant test globs were already above the stated 200-test guideline on main (220) and are 227 on this candidate; no test-budget increase was invented and no existing assertion was discarded to hide that pre-existing inventory issue.

## CI, publication and custody

Push Verify 42495799161 completed successfully on cc09ce1f85506ef57ebdbefe1f54efb59a3b3054. The actual REST receipt is ci-poll-2.json and ci-receipt.json. Four GitHub calls were used: base discovery, candidate discovery, and two polls at least 300 seconds apart. No rerun, dispatch or failed-job archive read was needed.

The base main SHA f5d2b44b4e731aaee612cdde0fcb6cc24b2181b5 has green push Verify 42493578218 and green Run site 42493578258; those are base receipts, not candidate receipts. The candidate has no main deployment or Run site receipt. A later credential-free ls-remote observed main at d4db6606f259cabcc10cb4b3b7232b802ba70df5 while the exact product branch remained cc09ce1f85506ef57ebdbefe1f54efb59a3b3054. The final candidate had fetched and merged main immediately before its push; later main drift is reserved for the guarded lander.

Exact-candidate publication scan: {"commit":"cc09ce1f85506ef57ebdbefe1f54efb59a3b3054","complete":false,"historyScanned":false,"findings":null,"status":"NOT_RUN_CLOUD_ROUTE"}. The maintained fleet lander must perform the full-history COMPLETE scan with zero findings, exact-SHA Verify and guarded landing. No default branch was pushed and no PR, provider activation, release or production publication was performed.

All report files, receipts, logs and screenshots are outside the product tree. The checkpoint and candidate were pushed with the supplied fleet guard after inspecting every candidate author's identity, committer and trailers. No co-author trailer is present. Evidence transfer uses only the dedicated report ref and has no product acceptance or landing authority.

Plan row proposed for the lane: DISP-013, claim points 1–5 qualified and PARTIAL to DONE after the round's independent gates; leave all other campaign rows and held remainders unchanged. No lane file was read or written.

No product blocker remains. Guarded scanning, landing and candidate Run site remain pending fleet duties.

CLAIM DISP-013 DONE points=1,2,3,4,5 tests=tests/api/subcontractor-field.test.mjs#DISP-013 invited subcontractor works only on current visits through every public door; tests/browser/subcontractor.spec.ts#DISP-013 subcontractor phone has current work but no notification control or offline day after reload
