# COMM-013 callback authentication qualification

Task: sx-glove-c-f145. Repository: just-every/run-glove. Product branch: cloud/sx-glove-c-f145.

## Plan

1. Read the full COMM-013 acceptance, its Status gap, its inherited Base duties, the inline plan extract, ct rulings and all eleven DONE riders. Preserve the source judgments and generated views from main.
2. Start at the requested continuation commit, retain its focused public-door API and browser journeys, and replay them onto current main. Run those journeys to identify an actual unproved outcome before adding proof.
3. Extend existing API journeys with real retained consent withdrawal, contact suppression, conversation and spam warning records; preserve a verified SNS cancellation warning; verify uncached certificate-only fetching for a forged malformed SES payload; interleave verified traffic with shared transient rejection counts.
4. Run focused API journeys, the settings browser journey with screenshots at 1440 and 390, typecheck and first-party validation. Preserve existing email and Postmark custody journeys. No production repair unless public-door proof exposes a defect.
5. Generate and check contract views, restore main's generated files, regenerate and check the source lock last, verify all commit identities and trailers, push only the named product branch, and observe exact-SHA Verify through bounded REST polling.
6. Record one proof row for each acceptance sentence, inherited duty and DONE rider. Publish this actual non-secret report and receipts only to the separate evidence ref. Scanning, main equality and Run site remain guarded fleet landing duties.

## Initial check

The requested continuation already supplies five focused API registrations and one focused settings browser registration. Initial API run: all five passed, covering points 1 through 6 and 8 through actual HTTP callbacks, native commands, real D1 and actual Worker restart. Point 7 is reached by the owner browser journey. Remaining proof work found here: retained spam warning and populated withdrawal and suppression preservation, retained SNS cancellation state in the refusal matrix, uncached malformed-message certificate fetch, and verified events interleaved with the rejection allowance. These extensions add no test registration and remove no existing assertion.

Only mail-provider network edges are synthetic in the focused journeys; the clock is controlled at the test Worker boundary. Live provider delivery, automatic resend, and the separate COMM-014, COMM-015, COMM-017 and COMM-018 obligations are not claimed.

## Results

All eight native acceptance points are covered by passing local proof on candidate 94457cdf3a3651d6a84f3ecd6103d253af8ebf27. Twelve selected API tests and one owner browser journey pass, with six screenshots at 1440 and 390. The exact-SHA CI receipt is appended below after its bounded observation.

## Frozen acceptance rubric and public-door probes

All test references below are in the candidate tree. API means `tests/api/mail-callback-auth.test.mjs`; Browser means `tests/browser/email.spec.ts`. API uses all four mail providers, genuine signatures or Basic credentials, real authenticated native commands, real D1 and Worker restart. The certificate and mail HTTP edges alone are answered synthetically.

| Item | Public outcome and observed result | Journey and lines |
| --- | --- | --- |
| P1 | Bad signatures on both known and absent message IDs, and malformed delivery bytes, return the same opaque rejection without durable or outbound effects; correctly authenticated events apply. | API points 1, 4 and 8, lines 63–105; unchanged helper lines 18–41. |
| P2 envelope | Forged SNS notification and subscription controls retrieve only the region-pinned certificate; SubscribeURL is never requested. A foreign certificate location causes no fetch. | API point 2, lines 108–133. |
| P2 message | A forged SNS envelope with non-JSON SES Message still retrieves the uncached pinned certificate before returning the generic rejection. | API point 2, lines 125–128. |
| P3 | Disconnecting through mail.connect with provider null returns 404 for every provider, including after actual Worker restart, without changes. | API point 3, lines 135–145. |
| P4 response | Bad signature, malformed JSON, invalid schema and wrong recipient each receive identical MAIL_EVENT 401 JSON. | API points 1, 4 and 8, lines 86–98. |
| P4 durable effects | Hash snapshots of every Glove and mail table and public state, Activity and export remain identical; the valid capture can subsequently apply. | API helper lines 18–38, and lines 86–103. |
| P4 logs | Each refused request produces exactly one Worker warning, with exactly the generic message and no credential, signature, address, recipient or event detail. | API helper lines 39–41. |
| P5 allowance | Twenty rejected requests alternate between two real Worker isolates sharing the allowance; the next rejection in either is 429. | API point 5, lines 147–182. |
| P5 exclusions | Verified events interleaved with refusals and sent after exhaustion succeed; another IP and the next controlled clock minute remain usable. Repeat after actual restart. | API point 5, lines 166–182. |
| P6 unmatched | Matched and unmatched callbacks return identical opaque 200 JSON; the same previously unmatched capture applies after a real provider send, proving its identity was not consumed. Another provider cannot borrow the message. | API point 6, lines 188–218. |
| P6 recipient | A validly signed batch with one wrong recipient changes no table or public state and leaves its known message accepted. Postmark's one-recipient webhook and unsupported array are both refused. | API point 6, lines 205–213. |
| P7 display | Owner settings display the exact last verified matched processing time and SNS cancellation warning, survive reload and restart, and retain them through forged, wrong-recipient and unmatched traffic. Screenshots at 1440 and 390. | Browser focused COMM-013 journey, lines 236–315. |
| P8 protected state | Populated consent withdrawal, contact suppression, inbound conversation, customer and request records, bounce and spam warnings, and SNS cancellation are retained through rejected or unmatched events. All business and mail tables, public state, Activity and export remain unchanged. | API fixture lines 43–59, first journey lines 63–105 and unchanged helper lines 18–41. |
| P8 existence | Known and absent IDs produce identical rejection bodies; matched and unmatched authenticated requests produce identical acknowledgements. | API lines 86–102 and 196–204. |
| P8 erasure | Previously authenticated captures replayed after real personal erasure and Worker restart return opaque acknowledgements and recreate no personal record, receipt or event fact. | API point 6, lines 219–232. |

PROBE COMM-013 1: public event route, forged known and absent IDs and malformed bytes -> identical rejection and unchanged durable and public state.
PROBE COMM-013 2: forged SNS notification and confirmation; malformed SES Message -> only pinned certificate fetched, generic 401, no subscription request.
PROBE COMM-013 3: native disconnect then callbacks for all providers -> opaque 404 before and after restart.
PROBE COMM-013 4: signature, JSON, schema and recipient refusals -> identical 401, one generic warning, no durable change or outbound effect.
PROBE COMM-013 5: twenty rejections alternating two isolates -> subsequent 429, while interleaved verified events, other address and next clock minute remain usable; repeat after restart.
PROBE COMM-013 6: unmatched capture then actual send -> same opaque 200 and reusable event identity; one wrong recipient -> entire batch unchanged.
PROBE COMM-013 7: native Owner settings -> exact verified time and cancellation warning at 1440 and 390, retained through ignored traffic and restart.
PROBE COMM-013 8: rejected and unmatched captures against populated state and after customer erasure -> no changed state or resurrected personal data.

## Inherited Base duties

| Duty | Evidence |
| --- | --- |
| BASE-AUDIT-001 | API helper lines 24–36 proves no rejected or unmatched Activity or export fact; the preserved email journeys assert attributable successful provider outcomes through Activity and the business export. |
| BASE-MAIL-001 | API first journey accepts authentic bounce and spam outcomes; point 6 applies a captured delivery only after a real send. The preserved email provider journeys prove genuine outcome labels. |
| BASE-OPS-003 | API point 6 proves unmatched identities remain reusable and erased captures cannot restore records. The preserved Postmark custody journey proves matched replay changes no fact across restart. |
| BASE-OPS-004 | API refusal helper checks the opaque generic rejection; Browser lines 254–310 checks exact verified time and retained SNS cancellation warning. |
| BASE-SECRET-001 | API refusal helper checks exact generic logs and all public and durable projections, while the preserved Postmark custody journey checks secret exclusion from state, saved outcomes, logs and export. |

## DONE riders

| Rider | Result and evidence |
| --- | --- |
| 1 | Local public-door proof covers all eight points; exact-SHA Verify result is recorded in the final receipt. |
| 2 | PASS: real populated records and both accepted and refused security paths; API fixture lines 43–59, first journey lines 63–105, and point 6 lines 188–232. |
| 3 | Exact-SHA branch Verify result and push event are recorded in the final receipt. API file is in the existing API glob; Browser is in the existing browser runner and partition selection. No opt-in flag is added. |
| 4 | PASS: candidate API run uses the final merged HEAD. Browser run uses the final HEAD; no subsequent relevant source or journey edits are permitted. |
| 5 | PASS: COMM-013 meta line cites BASE-AUDIT-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004 and BASE-SECRET-001; each duty is mapped above. |
| 6 | PASS locally: contract write and check pass; generated views and all Status cells equal main. The lander alone records the eventual judged SHA and new status. |
| 7 | PASS: no acceptance point, source judgment, ruling or coverage mapping was changed. |
| 8 | PASS: signed and unsigned unsafe callbacks, wrong recipients and provider ownership are exercised. Preserved Postmark custody tests additionally exercise owner-only credential actions, revocation and erasure. |
| 9 | PASS: only native provider-edge qualification is claimed. Live provider acceptance, legal compliance, automatic resend and other clauses' duties are not inferred. |
| 10 | Inapplicable: no policy default or new execution authority is introduced. |
| 11 | Guarded landing custody: main equality, candidate Run site and COMPLETE full-history publication scanning remain fleet duties. The cloud writes neither main nor any default branch. |

## Pre-ready self-check

Every named outcome is reached through a real route, command or built page using populated business records. Both accepted and refused callback paths run. No existing assertion was removed, skipped, narrowed or moved behind a width or branch condition; both existing email and Postmark custody test files remain unchanged. This continuation adds zero registrations. The inherited continuation adds five focused API registrations and one focused browser registration relative to main.

Authority withdrawal is covered by native mail disconnect and the preserved Postmark rotation and revocation journey. Erasure and authenticated replay are covered for all four providers by API point 6. No production screen or style was edited. The inspected customer-email settings section uses labelled controls and text-labelled actions, with no icon-only control. Browser evidence checks no sideways scroll at each width and shows the exact time and warning on the built page. No Base or rer pin, workflow, migration, homepage or logo was changed. The source lock is regenerated last; contract views are not committed.

No new literal email address or provider-shaped fixed key is introduced by this continuation. Synthetic addresses are constructed at runtime, and legacy fixtures stay intact. The dedicated cloud route delegates the publication scan to the guarded lander; it does not claim a cloud scan result.

## Candidate results and custody

Full candidate SHA: `94457cdf3a3651d6a84f3ecd6103d253af8ebf27`. Branch: cloud/sx-glove-c-f145. Main integrated before the final push: `8292c91a27427bd0779ec996f790073fffe0509b`. Remote product push succeeded through the fleet guard. No PR is required by this repository's all-branch push Verify entry point, and none was created.

All 12 selected API tests passed, with no skipped tests, on the exact candidate. The 268.693-second API run includes the focused five journeys and both preserved mail suites. The focused browser journey passed in the actual built owner installation at both widths and produced six screenshots. The API allowance journey is committed and ran outside push Verify on this exact candidate; its local run identity and original output are in receipts.json and API.log. Typecheck and first-party validation passed on Node 22.20.0.

The first stronger fixture run exposed a test setup tie: a new complaint and the previous bounce had the same controlled creation timestamp. The fixture now advances its controlled clock before creating the complaint, and all tests pass. No production repair was made. An anchored Playwright title selection found no tests because Playwright matches the full test title including its file name; the corrected selection listed and ran the focused journey. Neither diagnostic led to a weakened assertion.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses COMM-013 and check exit=0; ledger=none exit=0. Generated views were restored from main and are not committed. CONTRACT.md, including every Status, Gap and Evidence cell, equals main.

Before and after counts in the product tree remain 16 DONE, 218 PARTIAL and 29 MISSING, with all 263 rows retained. The requested judgment is COMM-013 PARTIAL to DONE for all eight points; absent concurrent judgments that would become 17 DONE, 217 PARTIAL and 29 MISSING when the lander records it. No plan file was changed in the cloud. Plan handoff: replace the ambiguous COMM-013 continuation with native points 1 through 8 qualified; no native acceptance remainder remains. All separate clause and provider holds remain unchanged.

Main was healthy when observed: Verify push runs 42502281734 and 42500437334 succeeded on `8292c91a27427bd0779ec996f790073fffe0509b`, as did Run site 42502281742. These runs are not claimed as candidate CI. Candidate exact-SHA Verify discovery is recorded separately.

Publication scan receipt: commit=94457cdf3a3651d6a84f3ecd6103d253af8ebf27; complete=UNESTABLISHED; historyScanned=UNESTABLISHED; findings=UNESTABLISHED. This cloud route cannot run the fleet's publication scan; the guarded lander must supply its COMPLETE scan and exact resulting main and Run site receipts. No release, deploy or default-branch write occurred.

Product blockers: none found by local proof. Live customer delivery, provider acceptance and automatic resend remain unclaimed.

## Claim

CLAIM COMM-013 DONE points=1,2,3,4,5,6,7,8 tests=tests/api/mail-callback-auth.test.mjs#COMM-013 points 1, 4 and 8: four providers reject unsafe callbacks opaquely without durable, public, network or log disclosure before and after restart; tests/api/mail-callback-auth.test.mjs#COMM-013 point 2: invalid SNS notifications and confirmations fetch only the pinned certificate and never parse SES or subscribe, including after restart; tests/api/mail-callback-auth.test.mjs#COMM-013 point 3: each disconnected provider returns 404 without effects before and after Worker restart; tests/api/mail-callback-auth.test.mjs#COMM-013 point 5: two Worker isolates share transient IP rejection limits while verified traffic, other IPs and the next minute remain usable after restart; tests/api/mail-callback-auth.test.mjs#COMM-013 point 6: opaque unmatched acknowledgements consume no identity, provider ownership is enforced and one wrong recipient refuses the complete batch after restart; tests/browser/email.spec.ts#COMM-013 owner email settings retain the exact last matched callback time and SNS cancellation warning through rejected and unmatched traffic and Worker restart at 1440 and 390

## Exact candidate CI observation

Verify push run 42503222307 is in progress on `94457cdf3a3651d6a84f3ecd6103d253af8ebf27` at 2026-11-08T17:10:51Z. This is the candidate run; the successful main runs above are context only. One watcher observes at intervals of at least 300 seconds. Four GitHub API calls have been used, including initial discovery and the main-health observation.
