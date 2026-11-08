# COMM-015 custody qualification

Tag: sx-glove-c-f127. Repository: just-every/run-glove. Branch: cloud/sx-glove-c-f127.

Plan: inspect all eight contract points and existing journeys; add one focused public-door lifecycle journey with independently checked outcomes; fake only the existing Postmark network edge; fix production only if the proof exposes a defect; retain existing email, browser and portability journeys; run the focused API proof, typecheck, contract generation and source integrity; run the existing browser email proof at 1440 and 390; preserve saves, merge current main before final publication, and publish evidence separately.

Initial gaps: the existing combined email journey covers many clauses but the audit records no separately qualified COMM-015 outcomes. This round explicitly exercises credential show-once and custody, authentication and authority refusals, exclusive credential expiry, immediate revocation and disconnect, attributable safe facts, optional fail-closed IP protection, insecure transport refusal, both persisted event identities and age refusal, and delivery metadata. Actual Worker disposal and recreation retain D1 for credential, overlap and replay proof.

No contract acceptance or judgment edits are planned. No new policy default is adopted. Live provider delivery and account qualification belong to other clauses and are not claimed.

Candidate: 3041ce39fb8a867522c4b3cac85402ba32d3ff83. Save: 6a34551ed4ff069e4d22f76a7d9de163328df78c. Base main: 434cc298a5bf6af70b08e6c389cede64a85cce7e. Both product pushes succeeded on the first attempt through the cloud guard. No PR is required: Verify runs on branch push.

Result: all eight native acceptance outcomes pass in the new focused journey. One test registration was added. Production code, contract judgments, existing email assertions, browser assertions, portability assertions and runtime pins are unchanged. API registrations are now 125 and browser registrations 40, plus the existing script checks; the added journey is within the 200-test cap. No assertion was removed, narrowed, skipped or made conditional. No pin test or duplicate was deleted because none was introduced or touched.

Actual contract counts before and after this product candidate: 14 DONE, 220 PARTIAL, 29 MISSING, all 263 rows retained. COMM-015 remains PARTIAL in the source table because only the lander writes judgments. The builder proposes COMM-015 DONE, points 1–8. If independently accepted, that one change would yield 15 DONE, 219 PARTIAL, 29 MISSING. The plan row to update is COMM-015 only; no plan file was edited in cloud.

The focused test is ./tests/api/postmark-custody.test.mjs, named “COMM-015 points 1–8: Owner-only Postmark custody survives restart, refuses unsafe callbacks and applies replay once”. It uses the existing real Worker harness, native Owner session, public commands and provider callback route, migrated D1 and the existing actual restart helper. All state changes occur through public HTTP doors. SQL reads inspect results and do not seed behavior. The only new provider helper constructs documented callback bytes. Reusing the existing restart and log-capture support required no harness change.

One row per acceptance sentence, frozen rubric for this round:

| Item | Public-door result and proof | Local result | Exact-SHA Verify |
| --- | --- | --- | --- |
| R1, point 1 | Owner mail.connect returns one 64-hex credential; identical replay omits it; Office, Dispatcher and branch-limited Owner connection and rotation are refused without writes. Focused test lines 39–60, 83–99, 123–133; secret exclusions lines 24–32, 186–187. Production generation uses crypto.getRandomValues on 32 bytes at ./src/glove/mail-callbacks.ts:10. | PASS | Push run 42482616582, pending at first observation |
| R2, point 2 | Read stored current_hash and compare against independently computed SHA-256; plaintext absent; repeat after Worker restart. Good Basic succeeds and missing, malformed, wrong-user and wrong-password Basic refuse without writes. Focused lines 63–99. Constant-time primitive inspected at ./src/glove/mail-callbacks.ts:39; allowed and unsafe paths execute in the journey. | PASS | Same exact-SHA run |
| R3, point 3 | Rotate through mail.callback; both credentials serve new messages after restart at one millisecond before expiry; old refuses at the exact 24-hour instant while current succeeds. revokePrevious ends overlap immediately; disconnect removes both hashes, both credentials refuse immediately and after restart. Focused lines 123–151, 202–208. | PASS | Same exact-SHA run |
| R4, point 4 | Activity and business export retain rotation, revokePrevious and both allowlist changes, exact Owner identity, action and pinned time; no password or provider key in state, saved outcomes, Activity, export or captured Worker warnings. Focused lines 24–32, 172–187, 208. | PASS | Same exact-SHA run |
| R5, point 5 | Allowlist initially false and Basic works without an IP; enabling refuses missing and unlisted IP, and listed IP without correct Basic; listed correct Basic works. Reconnection and Worker restart preserve true; explicit disable takes effect. Focused lines 87–90, 153–170. Dated provider reference and source-pinned addresses inspected at ./src/glove/mail-callbacks.ts:28–31. | PASS | Same exact-SHA run |
| R6, point 6 | Correct Basic posted through the plain HTTP callback route returns 401 and an independently read durable snapshot is unchanged. Focused lines 13–22, 101–102. | PASS | Same exact-SHA run |
| R7, point 7 | A Delivery and Bounce sharing a Postmark ID each land one distinct fact; identical ID and fallback events have no second effect before and after actual restart. More than seven days old refuses unchanged; the exact seven-day boundary succeeds. Focused lines 104–121. Authenticated callbacks after erasure cannot recreate messages, customer data or facts, lines 189–200. | PASS | Same exact-SHA run |
| R8, point 8 | Every native email.send call in the lifecycle verifies the actual Postmark edge request carries exactly the generated message ID in Metadata.glove_delivery_id, lines 72–78. Existing email API regression checks quote, invoice and supplier sends. | PASS | Same exact-SHA run |

Inherited duties, one row each:

| Duty | Proof | Result |
| --- | --- | --- |
| BASE-AUDIT-001 | Focused lines 172–187 and assertTrail retain attributable Activity and exported facts; identities survive restart and duplicate callbacks make no second fact. | PASS locally, exact-SHA Verify pending |
| BASE-MAIL-001 | Focused lines 87–90 and 104–118 check actual authenticated outcome states; the existing email suite passes all six journeys with actual provider outcomes. Broader ordering belongs to COMM-010 and mapping to COMM-016. | PASS locally, exact-SHA Verify pending |
| BASE-OPS-003 | Command result replay lines 50–57 and 123–133, event replay lines 92–118, erasure replay lines 189–200. | PASS locally, exact-SHA Verify pending |
| BASE-OPS-004 | Refusal helper lines 13–22 checks the visible uniform 401 result and unchanged data. Captured real Worker rejection warnings are positively asserted at line 186. | PASS locally, exact-SHA Verify pending |
| BASE-SECRET-001 | Exact digest and secretFree reads verify state, Activity, export, saved results and actual Worker logs contain no generated password or provider key. Existing untouched ./tests/portable.mjs:319 excludes both callback password and hash from the real archive; that journey remains in push Verify. | Local custody PASS; preserved archive proof INSPECTED, exact-SHA Verify pending |

DONE-RIDERS:

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | Local PASS; CI qualification pending | All R1–R8 outcomes execute through public doors in the focused passing exact-candidate journey; push Verify 42482616582 was in progress. |
| 2 | PASS | Nonempty native messages; independently expected facts; unsafe authority, credential, IP, age and HTTP refusals compare complete durable snapshots. |
| 3 | PENDING Verify | The new test is loaded by the existing API glob and its existing CI partition; ./scripts/verify-app.mjs uses that glob. Push run 42482616582 is on the exact candidate. No workflow changes or env-gated proof. |
| 4 | PASS | Focused journey reran on the exact candidate. Email regression, browser proof and build were run on the save. The only changes since that save are the erasure section of this focused test and its source lock; every relevant production, fixture, email, browser and portable byte is identical. |
| 5 | PASS | COMM-015 cites BASE-AUDIT-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004 and BASE-SECRET-001 in its meta line. |
| 6 | Mechanical PASS; lander judgment pending | Contract generator write and check passed. Generated views were restored from origin/main and never committed. Status, Gap, Evidence and provenance remain main’s text for the lander. |
| 7 | PASS | No acceptance point, rider, contract sentence or coverage map changed. |
| 8 | PASS | Signed-in Owner allowed; Office, Dispatcher and branch-limited Owner connect and rotate refused without writes, lines 39–60. Revoked and disconnected callback credentials refuse, lines 147–151 and 202–208. |
| 9 | PASS | Network-edge fake only. No live Postmark delivery, receipt, account activation, legal or provider compliance claim. Those broader obligations stay with their owning clauses. |
| 10 | PASS | No new policy default; existing Owner-only, exact expiry and off-by-default allowlist policy preserved. No ruling was needed. |
| 11 | PENDING guarded landing | Main equality, exact-SHA Verify success, full-history publication scan and Run site are fleet gates. This cloud run pushes only its named branch. Nothing is counted as landed here. |

Pre-ready self-check: acceptance outcomes have positive and unsafe public-door paths; no prior assertion changed; current authority and revoked credential refusals pass; customer erasure replay cannot recreate personal data; no screen source was touched, and preserved browser proof shows the Postmark controls at 1440 and 390 with callback output masked. No new email-shaped string or credential-shaped fixture value was added. The source lock is fresh. Publication scan and post-landing Run site have not run in cloud and are not claimed.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses COMM-015 then check exit=0; ledger=none exit=0

PROBE COMM-015 1: Owner mail.connect plus same command ID -> first 64-hex password, replay omits it; excluded people receive FORBIDDEN without writes.
PROBE COMM-015 2: Valid and malformed Basic at authenticated callback route -> valid request 200; wrong user, malformed header and wrong password 401 unchanged; only SHA-256 retained after restart.
PROBE COMM-015 3: Owner mail.callback rotate, controlled clock and actual restart -> old and new 200 at expiry minus 1ms; old 401 at expiry, new 200; revokePrevious old 401 immediately; disconnect both 404 immediately and after restart.
PROBE COMM-015 4: Owner Activity and business export reads -> exact attributable rotation, revocation and allowlist facts; generated secrets absent from state, outcomes, export and captured logs.
PROBE COMM-015 5: Owner allowlist option and reconnect -> default false; enabled missing and unlisted IP 401; listed wrong Basic 401; listed good Basic 200; option true survives reconnect and restart.
PROBE COMM-015 6: HTTP callback with good Basic -> 401 and unchanged durable snapshot.
PROBE COMM-015 7: ID and fallback callback duplicates -> one application each before and after restart; over-seven-day event 401 unchanged; exact boundary 200; erased messages never return from authenticated callbacks.
PROBE COMM-015 8: Native email.send -> every Postmark request has Metadata.glove_delivery_id equal to that message ID.

Publication scan receipt: commit=3041ce39fb8a867522c4b3cac85402ba32d3ff83 complete=UNESTABLISHED historyScanned=UNESTABLISHED findings=UNESTABLISHED. The cloud adaptation assigns the scan to the maintained Mac lander; no fabricated COMPLETE or zero-findings claim is made. Main equality=false at candidate handoff. Run site=not applicable before landing.

Local checks: focused custody 1/1 passed on exact candidate under Node 22.20.0; email regression 6/6 passed; browser email journey passed at 1440 and 390; typecheck, production build, first-party check, contract generation and source lock check all exited 0. The exact candidate’s typecheck and first-party check were rerun. Actual non-secret logs and machine receipt accompany this report. No production repair was needed. The initial test-development correction read action payloads from export, because Activity intentionally exposes audit metadata rather than the payload.

Blockers: none in the local product proof. CI qualification and fleet landing gates are pending and are not represented as completed. PR: none required. No release, live send or main push was performed.
