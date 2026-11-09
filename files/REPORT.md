# QUOTE-015 document presentation and print

Tag: sx-glove-c-f190. Repository: just-every/run-glove. Branch: cloud/sx-glove-c-f190. Candidate: `6b38636601214afc0e481643b71f1b2a2f682fdc`. PR: none required; branch pushes invoke Verify. Verify 42570243395 completed successfully for this exact SHA on the push event. Terminal custody and the observed workflow result are recorded in receipt.json and verify.json. Local checks pass; riders 1 through 10 pass, and rider 11 awaits the independent fleet gate and guarded landing.

The full work plan is retained in PLAN.md. The round read the shipped plan extract, builder rules, ct rulings and DONE riders, then the repository instructions, contract, acceptance, API and import guidance and the document implementations and existing journeys. Only QUOTE-015's plan row is proposed for completion. No plan, contract judgment, acceptance point, Base pin, homepage, delivery policy, payment flow or release setting was changed.

## Findings and repair

The first real print reproduction showed the open quote PDF containing the option labels “Choose Standard service”, “Choose Extended service” and “Add Filter pack”. REPRO-print-controls.log records that failure. The repair adds the existing print-hidden document-tools class only to the two response labels. The fieldsets, both options, every line, totals, descriptions, original photos, terms, notes and footer remain printable.

A second public-page PDF assertion found the report footer printing the raw ten-digit phone while its header printed US punctuation. REPRO-report-phone.log records that failure. The footer now calls the existing documentPhone formatter. It retains non-ten-digit legacy values. No document formatter semantics or source records were changed.

Two focused registrations were added, each with named scenarios for points 1 through 4:

- tests/api/document-presentation.test.mjs — QUOTE-015 document presentation preserves scoped originals, calendar facts and honest states after Worker restart.
- tests/browser/document-print.spec.ts — QUOTE-015 scoped documents print complete facts without controls or bearer fragments at 1440 and 390.

Both use deterministic originals from tests/fixtures/document-images.mjs and native Worker installations through the unchanged tests/api/harness.mjs. The browser serves the real compiled page and forwards its product API requests to that actual Worker; it does not substitute product responses. The production Print / Save PDF button executes its own handler. Only the interactive print dialog is bridged to Chromium's PDF renderer, with native beforeprint and afterprint events and print media. The invocation URL, URL during native printing, restored URL, PDF bytes, extracted text, embedded images and visible print controls are checked. Print headers omit the wall-clock timestamp, keeping restart text comparisons deterministic.

Screenshot capture waits for all original images to load, so full-page images include the footer after layout settles. The retained artifacts include all six document states at 1440 and 390: open quote, expired quote, declined quote, completed report, invoice and agreement. Twelve PDFs and twelve screenshots are listed with their actual hashes in artifacts.json. The point 4 scenario restarts the actual Worker and compares all six PDF texts with the earlier texts.

## Frozen rubric and acceptance proof

The following rows map every acceptance sentence to the public behavior reached. API and browser below denote the two full journey names above, rather than additional test registrations. The receipt binds all final runs to the candidate. The exact-SHA workflow event and conclusion are in verify.json.

| Row | Acceptance sentence and outcomes | Public proof | Result |
| --- | --- | --- | --- |
| R1 | Point 1: existing role, branch, revision and original-file guards apply. | API point 1: tests/api/document-presentation.test.mjs:55. Owner, Dispatcher and Office read invoice and agreement; Technician, Subcontractor and signed-out people are refused. A limited desk reader receives NOT_FOUND outside the branch. Superseded links return no document and refuse originals; revoked links refuse both. Quote and report bearers cannot exchange doors or original capabilities. Every listed original, including report form photo and signature, is checked byte for byte. A technician outside the job is denied the job originals. The shared business logo remains readable to signed-in roles, as MONEY-002 already requires. Guard and byte checks repeat after a real Worker restart. Browser point 1 opens the real customer and desk pages. | PASS: push Verify 42570243395, completed success on the exact candidate |
| R2 | Point 2: US calendar dates and phone punctuation; saved legacy addresses and zones retained. | API point 2: tests/api/document-presentation.test.mjs:135. Browser point 2 and PDF helper: tests/browser/document-print.spec.ts. Independent expectations include Feb 28, 2030 prepared and completed work, Mar 14, 2030 invoice due date, Mar 31, 2030 quote validity, Dec 31, 2031 insurance expiry and the agreement's Mar 1, 2030 through Feb 28, 2031 term. Ten digits and +1 inputs print US punctuation; a non-ten-digit extension value remains exact. The saved Australian address is unchanged, and the quote retains its Chicago validity zone after the business changes to Sydney. The report PDF refuses the raw unpunctuated phone anywhere. | PASS: push Verify 42570243395, completed success on the exact candidate |
| R3 | Point 3: actual print button removes the bearer before rendering, restores it, prints the whole document and hides response controls. | API point 3: tests/api/document-presentation.test.mjs:153. Browser buttonPdf and point 3 reach all six states at both widths. The renderer's invocation and beforeprint URLs have no fragment; afterprint restores the exact original link. Neither raw bytes nor extracted PDF text contain the bearer. Every expected content item and original image is present. All print-time input, select, textarea and button elements have no visible layout; response and signing labels are absent from the PDF. | PASS: push Verify 42570243395, completed success on the exact candidate |
| R4 | Point 4: add no signing, send or delivery claim; retain owner-disclosure and future hub boundaries. | API point 4: tests/api/document-presentation.test.mjs:166. Browser point 4 checks unsigned disclosure without a signature block, invoice approved status and agreement sold status without invented sending or delivery. Customer approval without the owner's disclosure is refused and changes nothing. The report's signed-by fact corresponds to a genuinely captured deterministic signature. No provider email is attempted. Results remain identical after actual Worker restart. Erasure denies old documents and originals; replay returns only a scrubbed ERASED outcome and leaves state unchanged. | PASS: push Verify 42570243395, completed success on the exact candidate |

## DONE riders

| Rider | Result and evidence |
| --- | --- |
| 1 | PASS: R1 through R4 reach every target acceptance outcome. Push Verify 42570243395 is green on the exact candidate. |
| 2 | PASS: native populated records and independently expected dates, amounts, phone presentation and original bytes. Security paths serve the permitted case and deny the unsafe case. Gated approval and erased replay leave state unchanged. |
| 3 | PASS: push Verify 42570243395 is completed success on the exact candidate, as recorded in verify.json. verification.json's API glob and browser runner include the new files; scripts/verify-app.mjs discovers both collections automatically. Width loops and PDF checks are unconditional. The maintained browser runner supplies screenshot output paths. |
| 4 | PASS: final focused journeys rerun on this candidate. Build provenance is recorded in receipt.json. |
| 5 | PASS, INSPECTED: QUOTE-015 already cites BASE-DATA-001 and BASE-ROLE-001. Their citations and the future hub restrictions in point 4 are preserved. |
| 6 | PASS for the builder's mechanical duties: documented generator write and check succeed; generated views are restored from origin/main and no judgment cell is edited. The lander owns the eventual evidence and count update. |
| 7 | PASS, INSPECTED: no acceptance text or contract source change. No rewrite or new policy ruling is involved. |
| 8 | PASS for applicable authority: current native roles, signed-out refusal, branch denial, revoked and superseded credentials, cross-document originals and erasure are exercised through HTTP doors. Money correction and refund verbs are outside this clause. |
| 9 | PASS: no live email delivery, legal signature validity, customer identity verification, payment, financing or provider compliance is claimed. The report renders only its recorded signature fact. |
| 10 | PASS, INSPECTED: no new policy default. The existing owner-disclosure gate and every held neighboring clause remain intact. |
| 11 | PENDING guarded landing: this is a branch-only cloud handoff. Main equality, complete publication scan with zero findings and Run site on the landed SHA are fleet duties. No landing or release is claimed here. |

| Inherited duty | Candidate proof and boundary |
| --- | --- |
| BASE-ROLE-001 | Cited in QUOTE-015 and exercised through the real document and original doors in R1. Current role, branch, revision and bearer boundaries have passing local assertions. |
| BASE-DATA-001 | Citation preserved. Durable document and original custody, actual Worker restart and erasure are exercised here. The underlying Base export and import duty and its owning portability clauses retain their own proof; this round does not claim the separately held quote-link archive qualification. |


## Pre-ready self-check

1. PASS: all four visible outcomes have public-door assertions and exact-SHA push Verify 42570243395 is green. The two actual pre-repair failures demonstrate that the print-label and footer-phone assertions detect the repaired defects. Exact-SHA Verify is recorded separately.
2. PASS: no existing assertion was deleted, narrowed, skipped or placed behind a width or branch condition. Protected tests, harness and the whole documents.tsx file remain byte-identical to main.
3. PASS for applicable custody: revoked and superseded links cannot read the document or its originals; wrong roles and cross-document originals are denied; an erased customer's links and report originals remain unavailable after restart, and replay cannot resurrect a capture.
4. PASS, INSPECTED: the touched public screens retain their existing style and text size, have no icon-only controls requiring a tooltip, and introduce no new configuration. Screens at both widths and representative PDF pages were visually reviewed. No polish redesign was attempted.
5. Local build, typecheck, first-party profile, generator and fresh source lock pass. New changed text has no email-shaped strings. Exact-SHA Verify, scanning, main equality and Run site remain distinct receipts; pending fleet conditions are not reported as completed.

## Mechanical and probe receipts

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and node scripts/edition-authoring/cli.mjs check exit=0; views=node scripts/contract-docs.mjs write --clauses QUOTE-015 and node scripts/contract-docs.mjs check --clauses QUOTE-015 exit=0; ledger=none exit=0

PROBE QUOTE-015 1: native document and original routes with current desk sessions, field roles, limited branch, mismatched bearer, revoked and superseded revision -> allowed exact documents and original bytes; denied unsafe reads, unchanged after Worker restart.
PROBE QUOTE-015 2: compiled customer and desk pages with fixed calendar dates, ten-digit, +1 and legacy phones, recorded legacy address and changed business zone -> independently expected US presentation and frozen quote zone in HTML and PDFs.
PROBE QUOTE-015 3: production Print / Save PDF on six document states at 1440 and 390 -> fragment absent before and during Chromium rendering, exact link restored afterwards, complete PDFs with zero visible controls and no bearer bytes.
PROBE QUOTE-015 4: unsigned open quote and recorded invoice and agreement states, gated approval, Worker restart and erased capture replay -> honest disclosure and statuses, no invented signature or delivery, no email attempt and no resurrected data.

## Counts, scope and terminal custody

The initial clone had 31 DONE, 203 PARTIAL and 29 MISSING. During the run, unrelated upstream AGENT-016 work landed. The synchronized main has 32 DONE, 202 PARTIAL and 29 MISSING, and this branch preserves those source judgments exactly. QUOTE-015 remains source PARTIAL until the independent gate accepts the DONE claim. Accepting only this claim would produce 33 DONE, 201 PARTIAL and 29 MISSING.

The focused API registrations increase from 130 to 131, and browser registrations from 51 to 52. Existing registrations and assertions are retained; no budget increase was requested. New tests use named scenarios, not per-point registrations. No other campaign row was rebuilt or changed.

Product commits comprise the initial skip-CI save, the revoked-link qualification and the complete-screen readiness improvement. The branch contains only the two permitted UI repairs, the two new focused journeys and the generated source lock. Report files are outside the product tree. No PR is required by this repository's branch Verify entry point. Full history is retained for the Mac publication scan, and all candidate authors, committers and messages were checked before pushes.

Publication scan receipt: commit=6b38636601214afc0e481643b71f1b2a2f682fdc; complete=unestablished; historyScanned=unestablished; findings=unestablished. The cloud adaptation delegates this scan to the maintained fleet lander. Main equality is not established and Run site is not a cloud branch workflow. The earlier synchronized main at c270566732b115a5514cdab4b9f22cbc9f12fe4a had successful Verify 42566672074 and Run site 42566672055; neither is offered as proof for this candidate.

Held boundaries remain exactly as briefed: quote approval and consent, frozen disclosure and signing-copy custody, deposits, financing, customer hub authentication and payment, provider delivery and legal validity remain with their owning clauses. This claim creates no customer authentication, signing authority, outbound message, money movement, deployment, release or default-branch write.

Terminal CI: Verify 42570243395, event=push, status=completed, conclusion=success, head=6b38636601214afc0e481643b71f1b2a2f682fdc. Prior Verify 42569661909 was still running when its head was superseded and is not counted. Seven GitHub REST calls were used; no workflow was dispatched or rerun.

CLAIM QUOTE-015 DONE points=1,2,3,4 tests=tests/api/document-presentation.test.mjs#QUOTE-015 document presentation preserves scoped originals, calendar facts and honest states after Worker restart; tests/browser/document-print.spec.ts#QUOTE-015 scoped documents print complete facts without controls or bearer fragments at 1440 and 390

Blockers: none. Main equality, complete publication scanning and Run site remain the guarded lander's conditions before counting the claim.
