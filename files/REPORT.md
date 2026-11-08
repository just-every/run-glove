# FIELD-009: proposed DONE

Repository: just-every/run-glove. Branch: cloud/sx-glove-c-f137. Candidate: 30d23cde995571134f055ae459448b2dc36de91c. No PR is required: the repository accepts branch-push Verify. All local checks passed. Exact-head push run 42497583970, in_progress; conclusion unestablished. This is a proposed clause judgment; acceptance, scanning and landing remain the maintained fleet's work.

A real installation restore exposed a defect: retained public settings allowed `push.subscribe` to return HTTP 200 although the installation had no VAPID private key. The subscription command now requires the actual private-key row. Without explicit fresh Owner setup it refuses HTTP 409 PUSH. No new sending, consent, role or provider authority was introduced. The production change is confined to `src/glove/commands/push.ts` line 26.

The plan was to preserve the combined push test, qualify installation key custody and rotation, qualify two native sessions and identity isolation, independently exercise every deletion trigger with actual Worker restart and later delivery, then prove real export and import plus fresh Owner and phone consent. The browser proof uses the existing Team and Technician controls, asserts at 1440 and records the same states at 1440 and 390. Finally, run touched proof, typecheck, first-party validation, contract generation and source locking; publish only the named product branch and the separate report tree. That plan is complete locally.

## Results and custody

- Focused and preserved push API files: 8 tests passed under Node 22.20.0. The original `tests/api/push.test.mjs` is byte-for-byte unchanged.
- Focused browser journey: 1 passed in 58 seconds after the main merge. Ten screenshots show Owner on and off and Technician two-phone, removed and off states at both widths.
- Complete `tests/portable.mjs`: exit 0, including FIELD-009, the retained route and audience history, original-file withdrawal, older-erasure-journal refusal, payment custody and both later payment restoration journeys.
- Pinned-runtime typecheck, production build and first-party profile check: exit 0. Merged-tree typecheck and first-party check were repeated and passed.
- Contract write and check: exit 0. Exact committed views check: exit 0. Source lock regenerated last and exact committed lock check: exit 0. No migration changed.
- Product head was pushed successfully and read back from the exact remote ref. Both candidate commits have fleet authors and committers and no co-author trailers. Full history is present.

The first save was 2679222, explicitly carrying skipped CI. The final candidate merges origin main d4db6606f259cabcc10cb4b3b7232b802ba70df5; published history was never rebased or force-pushed. The harness merge retains both the incoming calendar edge support and the new native second-session helper. The sole merge conflict was sources.lock.json, resolved by regeneration. CONTRACT.md and both generated view files exactly match that incoming main. No clause judgment or acceptance text was edited by this branch.

Source counts are 15 DONE, 219 PARTIAL and 29 MISSING before and after this branch's changes against merged main. FIELD-009 remains source PARTIAL pending its gate's status update. Initial checkout f5d2b44b4e731aaee612cdde0fcb6cc24b2181b5 had 17 DONE, 217 PARTIAL and 29 MISSING; the intervening count change belongs to upstream judgments, all retained. Its push Verify 42493578218 and Run site 42493578258 were green. The direct registration scan is 197 on both original and incoming main and 200 on the candidate; no existing assertion or registration was deleted, narrowed or hidden behind a width or opt-in condition.

## Frozen acceptance rubric

| Item | Public-door journey, lines and observed outcome | Local proof | Verify |
| --- | --- | --- | --- |
| P1 | `tests/api/push-subscriptions.test.mjs` lines 30–72 and browser lines 70–76: allowed Owner setup; desk, Technician, Agent, integration and signed-out refusals; fresh public and private keys on rotation; all earlier phones deleted; off deletes key and phones and refuses new subscriptions. State, saved command outcomes, Activity, export and captured Worker logs exclude generated private material. Populated real archive is opened and checked in `tests/portable.mjs`. | PASS | push run 42497583970, in_progress; conclusion unestablished |
| P2 | API lines 75–111 and browser lines 77–93: one Technician subscribes two phones in distinct native signed-in sessions; both receive a later push. | PASS | push run 42497583970, in_progress; conclusion unestablished |
| P3 | API lines 87–110 and 120–180: exact labels, outcome and time; each session marks only its originating phone; another Technician, desk role and integration token read or remove no foreign phone. Independent own removal, sign-out, remote revoke, exact runtime expiry, role loss, deactivation, HTTP 404, HTTP 410 and Owner off each delete exactly the affected phones. Actual Worker restart, later booking and replay prove no resurrection or later affected delivery; unaffected sessions and the other Technician still receive pushes. Activity remains attributable and secret-free. Browser lines 89–114 prove phone lists and removal controls. | PASS | push run 42497583970, in_progress; conclusion unestablished |
| P4 | `tests/portable.mjs` source phone population, actual export and import, and FIELD-009 continuation after restored staff reactivation: no private key, subscription, endpoint or phone key restores; source sessions fail; import and startup send nothing; another real restart still refuses subscription; explicit fresh Owner setup makes a different public key and only a fresh phone subscription receives a later push. | PASS | push run 42497583970, in_progress; conclusion unestablished |

## Inherited duties

| Duty | Evidence | Result | Verify |
| --- | --- | --- | --- |
| BASE-ACCESSIBILITY-001 | Browser lines 31–121; screenshots at both widths; existing labeled text controls and cards. No new UI control or styling. Notification actions have text labels, with no icon-only action requiring a new tooltip. | PASS; existing styling INSPECTED | push run 42497583970, in_progress; conclusion unestablished |
| BASE-DATA-001 | Complete real `tests/portable.mjs` run, actual archive bytes, empty restored secret and subscription tables, fresh consent and later-erasure-journal protection. | PASS | push run 42497583970, in_progress; conclusion unestablished |
| BASE-ROLE-001 | API lines 34–36, 95–110 and 137–165; native sessions, real role changes, revocation and deactivation through public doors. | PASS | push run 42497583970, in_progress; conclusion unestablished |
| BASE-SECRET-001 | API lines 66–71 and 169–177; populated actual archive and captured real Worker output exclude private push material. | PASS | push run 42497583970, in_progress; conclusion unestablished |

## DONE-RIDERS

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | Local PASS; exact-head CI pending | P1–P4 above. Every native outcome is performed and checked on populated data. |
| 2 | PASS | API lines 34, 85, 97–110 and 135–177; supported pushes occur before withdrawal, unsafe identities are attempted, exact surviving rows and later deliveries are checked. Real restored subscription was refused before Owner enablement and accepted afterward. |
| 3 | PENDING Verify | push run 42497583970, in_progress; conclusion unestablished. Existing verification.json runs the API glob, whole portable script and browser runner. The focused browser file loads without an opt-in flag. |
| 4 | PASS locally | Candidate source hashes and Git blobs in checks.json. Merged API and browser proof passed. The complete portable run used identical FIELD-009 product, fixture and portable-script bytes; the intervening main API change annotates Owner calendar outcomes and the harness adds calendar transport handling, both outside this phone flow. |
| 5 | PASS | CONTRACT.md line 1548 already cites all four inherited duties above. |
| 6 | PASS for builder mechanics | Contract write and check, exact committed views check, final lock and check all exit 0. Judgments and generated files remain main's whole versions, for the lander to update after acceptance. |
| 7 | PASS | No acceptance or judgment change; original combined push file unchanged; no assertion weakened. |
| 8 | PASS | API lines 95–110 and 137–165: Owner and same-person authority allowed, foreign roles and tokens refused without phone alteration, ended authority cannot replay a subscription. |
| 9 | PASS with honest boundary | Synthetic push network edge and browser service enrollment only. Sessions, D1, commands, actual restart and archive transport are real. Live provider acceptance and native-device distribution are not claimed. |
| 10 | Not applicable | No policy default adopted. Existing Owner and Technician authority is preserved. |
| 11 | PENDING maintained fleet lander | Exact-head scan, main equality, green branch Verify and Run site remain unestablished cloud-side. No main push was attempted. |

PRE-READY: every named native outcome has public-door proof; no existing assertion was removed, narrowed or hidden; revoked, expired and inactive credentials cannot recreate phones; restored archives carry no phone authority; screens are captured at both widths and use existing readable type, text controls and rounded cards. No homepage, logo, runtime pin, workflow, migration or other clause was changed. All local checks pass. CI, scanning and landing are reported separately.

## Probes and mechanical receipt

PROBE FIELD-009 1: Owner push.setup, rotate, actual restart and off -> different key, earlier phones deleted, off refuses subscription, private values absent from public surfaces and actual archive.
PROBE FIELD-009 2: native Technician in two sessions, push.subscribe on each -> two phones, exactly one thisSession marker in each session and later push to both.
PROBE FIELD-009 3: each of nine independent withdrawal triggers, actual restart and visit.book -> affected rows absent and no later affected delivery, unaffected session and other Technician still receive pushes, foreign reads and writes reveal or alter no phone.
PROBE FIELD-009 4: actual archive import, fresh sign-in and another real restart -> no restored key or phone, HTTP 409 PUSH before explicit Owner setup, new public key and only a fresh subscription receiving the later push.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses FIELD-009 then check exit=0; ledger=none exit=0.

Scan handoff: commit=30d23cde995571134f055ae459448b2dc36de91c complete=unestablished historyScanned=unestablished findings=unestablished. is-shallow-repository=false. The maintained fleet must run its full-history publication scan and guarded landing. A saved packet is not a landing or acceptance receipt.

The real defect reproduction is retained in restore-defect.txt: the public restored subscription returned 200 instead of 409. Fixture preparation was corrected to enable notifications and create its phone job before existing route proposals freeze business counters, and to exercise restored phones after existing unchanged-schedule and suspended-staff assertions. All original assertions remain. No routing product code changed.

The current UI exposes Team directly; the older More → Team wording maps to that existing entry. Assertions run at 1440 and the same changed states are recorded at 390. No design or navigation change was made.

No account, policy or Base dependency blocks this native FIELD-009 proof. FIELD-004, FIELD-010 and FIELD-005 retain their separate obligations and existing holds. There is no live push-service, native-app, release, deployment or main-publication claim.

Plan row for relay: FIELD-009, proposed PARTIAL → DONE, points 1–4 proven locally on the exact pushed head; source judgments and counts unchanged by this branch. Exact-head Verify remains running at the last allowed poll. Four GitHub API calls were used; no dispatch, rerun or PR was created.

CLAIM FIELD-009 DONE points=1,2,3,4 tests=tests/api/push-subscriptions.test.mjs#FIELD-009 owner key custody and two-session Technician phone ownership; tests/api/push-subscriptions.test.mjs#FIELD-009 every subscription-removal trigger independently stops further pushes and preserves unaffected phones after restart; tests/browser/push-settings.spec.ts#FIELD-009 owner enables phone notifications and a Technician controls two session-bound phones at 1440 and 390; tests/portable.mjs#FIELD-009 real archive
