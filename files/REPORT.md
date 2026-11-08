# sx-glove-c-f144 — FIELD-009

Product candidate: `7627f27774a9f253313dfbe00f38515dcf5ebcd3`, branch `cloud/sx-glove-c-f144`, repository `just-every/run-glove`. No PR is needed: branch push is the existing Verify entry point. No release, provider activation or default-branch push was performed.

This continuation retains the prior candidate's complete phone subscription proof and its restoration repair, integrated with main `46260ec687c3915be6ade22b895321d11f45b55a`. The initial rebase replayed the standalone proof commit but omitted changes made inside the prior merge commit; the next product commit explicitly restores that merge-only repair and the full corresponding portable journey. No unrelated main code, assertion or clause judgment was removed. The previous candidate's Verify `42497583970` on `30d23cde995571134f055ae459448b2dc36de91c` is completed and successful; it is context, not substituted evidence for this candidate.

The production repair is at `src/glove/commands/push.ts:27`: a restored public setting cannot authorize a subscription without the installation-local VAPID private key. Only explicit owner setup creates that key. The proof exercises actual Worker commands, native sessions, durable D1, Worker restart, built browser controls and real installation export and import. Only external transport and the browser's push-service interface are synthetic. No live push-service or native-device acceptance is claimed. The existing `tests/api/push.test.mjs` is byte-identical to main.

Source counts before and after are **16 DONE, 218 PARTIAL, 29 MISSING**, 263 rows. FIELD-009's source judgment remains PARTIAL for the lander to own. Its points 1–4 are locally qualified, but this round cannot claim DONE while exact-SHA Verify is red. A future accepted DONE claim would change the landing counts to 17 DONE, 217 PARTIAL, 29 MISSING. The only plan row proposed for change is FIELD-009: native points locally proven; retain PARTIAL until its exact-SHA workflow is green. Rider 11 remains the guarded lander's duty. No additional clause is started: the campaign has no other target sharing these files without its own held remainder.

## Frozen acceptance rubric and public-door proof

The rubric is the four unchanged acceptance sentences, with their checkable constituent outcomes. API journey A is `tests/api/push-subscriptions.test.mjs#FIELD-009 owner key custody and two-session Technician phone ownership` (registration at line 115). API journey B is `tests/api/push-subscriptions.test.mjs#FIELD-009 every subscription-removal trigger independently stops further pushes and preserves unaffected phones after restart` (line 120). Browser journey C is `tests/browser/push-settings.spec.ts#FIELD-009 owner enables phone notifications and a Technician controls two session-bound phones at 1440 and 390` (line 31). Archive journey D is the existing executable `tests/portable.mjs#Glove portability passed: export, import into a fresh checkout, identical records, timeline, photo bytes and move-in journal, and undo after restore` (assertions at lines 291–309, 347–348 and 421–451).

| Rubric | Acceptance outcome | Door and independent assertion |
| --- | --- | --- |
| R1, point 1 | Owner turns notifications on under Team and a real key is generated | C lines 70–76: the Team browser button sends `push.setup`, then renders attributable owner activation. A lines 34–39 refuses non-owners and signed-out callers and obtains the real generated public and private key. |
| R2, point 1 | Private key stays out of records, state, export, logs and installation archive | A lines 66–71 scans populated command outcomes, state, Activity, export and captured Worker logs against both generated private values. Existing push test lines 21–27 reads the public doors while enabled. D lines 303–309 and 347–348 scans real source records, Worker logs and actual archive bytes while the key and subscription exist; credential and subscription tables are absent. |
| R3, point 1 | Turning on again changes the key and removes every prior subscription | A lines 40–57 has two people subscribed, rotates both public and private values, checks empty device lists, then schedules a visit: zero earlier endpoints are contacted. Only an explicitly resubscribed phone receives a later push. |
| R4, point 1 | Turning off deletes the key and all subscriptions and refuses new subscriptions | A lines 58–65 checks null business setting, absent private-key row, zero subscriptions and a refused new subscribe after actual restart; later booking sends nothing. C lines 111–116 observes the disabled owner and technician controls. |
| R5, point 2 | Technician explicitly enables each phone | C lines 77–83 enables two phones through real controls in separate browser contexts, confirms success and the supplied public key. A lines 80–85 proves both separate signed-in sessions receive their own network delivery. |
| R6, point 3 | Each subscription belongs to the person, device and signed-in session; own list shows label, last outcome and time, never endpoint or keys | A lines 80–94 independently compares both session lists against the exact expected labels, flags, outcome and pinned clock after Worker restart. C lines 87–95 reloads both browsers and checks one this-phone marker and two actual delivery outcomes. |
| R7, point 3 | Other Technician, desk role and integration token cannot read or remove these subscriptions | A lines 95–110 populates both users, attempts cross-person removal, sends all three push verbs as desk and token callers, checks refusal or an empty own list and exact unchanged subscription rows. |
| R8, point 3 | Own removal ends exactly the removed subscription | B lines 121–177: a fresh installation per trigger, two sessions for the target person and a third for another Technician; removal through the other own session, restart, exact remaining rows and exact later endpoint list. |
| R9, point 3 | Sign-out on that phone ends exactly its subscription | B lines 138, 149–168: actual `/auth/signout`, restart, no more push to the affected endpoint, other sessions preserved, old capture refused. |
| R10, point 3 | Session ended elsewhere ends exactly its subscription | B lines 139, 149–168: actual `/auth/session/revoke` from the other session, restart, exact surviving subscriptions and endpoints, old capture refused. |
| R11, point 3 | Exact session expiry ends exactly its subscription | B lines 127–140, 149–168: existing runtime clock reaches the original session's exact expiry while later sessions remain valid; restart preserves the clock, ended credential is refused and other subscriptions still deliver. |
| R12, point 3 | Role change away from Technician removes that person's subscriptions | B lines 141, 149–168: actual `role.set`, both affected sessions disappear, further subscribe and unsubscribe refuse, unrelated Technician still receives a push. |
| R13, point 3 | Deactivation removes that person's subscriptions | B lines 142, 149–168: actual `/auth/operator/status`, both affected sessions disappear, ended credential cannot replay, other Technician still receives a push. |
| R14, point 3 | Push-service HTTP 404 removes only that subscription | B lines 143–146, 149–168: the affected service request actually returns 404; only that endpoint disappears, restart and later bookings contact only unaffected endpoints. |
| R15, point 3 | Push-service HTTP 410 removes only that subscription | Same B loop, distinct fresh installation and explicit 410 transport outcome; exact surviving rows and subsequent sends are asserted independently. |
| R16, point 3 | Owner off deletes all subscriptions and no further delivery occurs | B lines 148–168: explicit owner command, restart, exact empty rows, zero later sends for either Technician; saved subscribe capture cannot resurrect a row. |
| R17, point 4 | Subscription material stays out of records, export and real archive; restore needs fresh subscriptions | D lines 291–309, 347–348, 421–451: actual source delivery; actual export and import; absent private key, endpoints, phone keys and subscription table; old session 401; fresh session 409 before owner setup, both before and after restart; a new owner key and fresh subscription alone permit the second actual delivery. |

The API assertion loop is data inside one registration, with independently executed fresh installations for all nine deletion causes. Existing assertions were preserved; no width condition hides an assertion. Browser assertions run at 1440; the same changed panels are then photographed at 1440 and 390. Screenshots cover owner on and off, two Technician phones, removal and disabled state. The four on-state desktop and phone images were visually inspected: readable controls, no clipping or endpoint disclosure, 14px muted text, text-labelled actions, full panel borders. These notification panels have no icon-only controls. Team is the existing settings surface named by the clause; no placement or visual redesign was attempted.

## Inherited duties

| Duty | Result and evidence |
| --- | --- |
| BASE-ACCESSIBILITY-001 | INSPECTED and browser-tested for these controls: named regions, named buttons, status output and 1440 plus 390 captures in C; existing 14px muted text and 15px button CSS. This does not claim a VPAT; field register R-2 remains external. |
| BASE-DATA-001 | PASS through D: permitted records and attributable history survive the actual archive, while installation-local keys and subscriptions do not; explicit fresh authority is required. |
| BASE-ROLE-001 | PASS through A lines 34–36 and 95–110 and B lines 156–165: allow the current owner or appropriate Technician; refuse excluded identities and revoked credentials without changing subscription rows. |
| BASE-SECRET-001 | PASS through A lines 66–71, D lines 303–309 and 347–348: generated private material is absent from public surfaces, saved results, captured logs and actual archive. |
| DATA-002 attributable Activity and export | PASS through A line 66 and B lines 169–177, plus the actual archive's retained timeline comparison: actor, role, command and time retained without private phone material. |

No new custody or authority policy was invented. No ct default or ASK is needed. FIELD-004 installability and camera duties, FIELD-010 message content and cryptography duties, FIELD-005 native applications, and live push-service acceptance keep their existing owners and external boundaries. Erased customer records and trusted later-erasure-journal protection are also exercised by the unchanged remaining portions of D; this subscription change stores only staff phone custody, never customer details in a push.

## DONE-RIDERS

| Row | Result | Exact-candidate evidence |
| --- | --- | --- |
| 1 | LOCAL PASS; exact-SHA Verify recorded separately | R1–R17 above perform each named outcome through the public doors; A and B pass, C passes, and the complete D archive journey passes with exit 0 as recorded in the runtime receipt. |
| 2 | PASS | A starts with real populated devices and actual delivery; both allowed and refused authority paths are exercised. B verifies exact remaining identities and later delivery, rather than reading only an empty list. D populates a real private key and subscription before exporting. |
| 3 | FAIL — overall Verify red | `verification.json` invokes the API glob, all browser specs and D in push Verify. Candidate run `42500589585`, event push, exact head `7627f27774a9f253313dfbe00f38515dcf5ebcd3`; final conclusion is in candidate-ci.json. |
| 4 | PASS | All relevant source and test bytes are bound to this candidate. Browser and actual archive checks run after its commit; earlier focused API and typecheck results precede only the lock and commit, with no later relevant byte changes. |
| 5 | PASS | FIELD-009's existing meta line at CONTRACT.md:1548 explicitly cites all four inherited Base duties above. No meta or acceptance rewrite was made. |
| 6 | PASS for generator; judgments reserved to lander | Generator write and check exit 0, then main's two generated views were restored. No Status, Gap or Evidence cell changed. Existing audit wording is intentionally left for the claim-based lander. |
| 7 | PASS | CONTRACT.md diff is empty, including all acceptance text and all 263 Status rows. No ruling, rewrite or coverage-map change is required. |
| 8 | PASS | A exercises excluded current roles, cross-person access, token and signed-out paths; B proves revoked and expired sessions cannot recreate subscriptions; D rejects restored old sessions and missing private authority. |
| 9 | PASS within honest boundary | Fakes only at external edges. No live provider delivery, native-device, account activation, legal, VPAT or field-register proof is asserted. |
| 10 | PASS | Existing policy implemented unchanged. No new default, delegated authority, outbound automation or activation was introduced. |
| 11 | PENDING guarded landing | Product branch is pushed. Main equality, COMPLETE full-history publication scan with zero findings, exact-main Verify and Run site are exclusively the fleet lander's checks. No cloud landing or scan receipt is invented. |

## Public-door probes

PROBE FIELD-009 1: owner `push.setup`, then setup again and `{off:true}`; actual visit bookings -> distinct public and private keys, all old phones removed, key absent after off, new subscribe refused, no later send; public surfaces and actual archive exclude populated secret values.

PROBE FIELD-009 2: two real signed-in sessions press Turn on notifications in their own browser -> both receive actual synthetic-edge deliveries, and each list marks only its own session as this phone.

PROBE FIELD-009 3: populated two-session phone list, cross-person and token attempts, then each of nine independent public removal doors -> only expected rows and destinations remain after Worker restart; revoked or replayed captures do not recreate a subscription.

PROBE FIELD-009 4: actual export, import and restart -> no private key, phone key, endpoint or subscription restored; old phone session refuses; new session requires owner enablement before a newly created subscription can receive a push.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write and check exit=0, main views restored; ledger=none exit=0 (no migration change).

## Gate and custody record

Candidate exact-SHA publication scan: commit=7627f27774a9f253313dfbe00f38515dcf5ebcd3 complete=false historyScanned=false findings=unestablished. The cloud-specific route explicitly delegates this scan to the fleet lander; this is not a COMPLETE or zero-findings claim. Both candidate commits have fleet author and committer identities, no trailers, and all messages were inspected before the guarded push. No new email-shaped source literal was added. No credentials or private runtime entry are in the evidence packet.

Main observed before publication: `46260ec687c3915be6ade22b895321d11f45b55a`; main Verify `42499831248` and `42498811975` succeeded, and Run site `42499831269` succeeded. Candidate main equality is pending guarded landing. Candidate Verify `42500589585` and its final observed status are recorded in candidate-ci.json. The first candidate Verify is red in browser-3 on the pre-existing DATA-004 clock setup; the exact-command reproduction passes on both candidate and unchanged main, so the brief prohibits a guessed repair. Native-device and live-provider obligations outside FIELD-009 remain unchanged.

The complete non-secret plan is PLAN.md. Runtime checks, mechanical checks, exact-SHA CI observations and the ten actual screenshots are explicitly selected for the evidence-only branch. Evidence publication carries no product landing authority.

Completed local results: 8 focused API tests pass; 1 browser journey passes with 10 actual screenshots; the complete portability journey passes; typecheck, production build, first-party check, contract generation and source lock check all exit 0. No existing test was deleted, narrowed or skipped. The actual outputs and receipts are retained beside this report.

First Verify failure: run 42500589585, job 128792411382 (browser-3), `tests/browser/fresh-install.spec.ts:196`: **Error: clock.pauseAt: Error: Cannot fast-forward to the past**. API, foundation, portable and the three other browser shards succeeded. The failing job log was read exactly once with the prescribed archive command (exit 0). No job-log blob download was attempted. Candidate and unchanged main were each reproduced once with Node 22.20.0, the same shard settings and Chromium in this same dedicated VM. Both complete shard commands exited 0; no repair preceded or followed reproduction.

Repair constraint: the supplied brief says, “before editing, run the failing job's exact command on its failed SHA, with the same shard and environment” and “If it does not reproduce, stop BLOCKED with that output; do not guess a fix.” The failed DATA-004 journey passed on the first candidate reproduction and on unchanged main in the same VM. No source, test, workflow or assertion has been edited to guess at this failure, and no third-party job-log redirect was used. Full shard completion is recorded in ci-failure-receipt.json and both actual output files.

## Terminal disposition

CLAIM FIELD-009 PARTIAL points=1,2,3,4 tests=tests/api/push-subscriptions.test.mjs#FIELD-009 owner key custody and two-session Technician phone ownership; tests/api/push-subscriptions.test.mjs#FIELD-009 every subscription-removal trigger independently stops further pushes and preserves unaffected phones after restart; tests/browser/push-settings.spec.ts#FIELD-009 owner enables phone notifications and a Technician controls two session-bound phones at 1440 and 390; tests/portable.mjs#Glove portability passed: export, import into a fresh checkout, identical records, timeline, photo bytes and move-in journal, and undo after restore

GAP FIELD-009: exact-SHA Verify 42500589585 is red in browser-3 job 128792411382 on the existing DATA-004 clock.pauseAt setup; the complete failed-shard command passes on candidate and main, so no repair may be guessed. Riders 1 and 2 pass locally, 3 fails the overall workflow bar, 4–10 pass as detailed above, and 11 awaits guarded landing.

VERIFY_NOT_REPRODUCED: candidate 7627f27774a9f253313dfbe00f38515dcf5ebcd3 and main 46260ec687c3915be6ade22b895321d11f45b55a, command `node scripts/verify-ci.mjs "$SHARD"`, shard browser-3, exit 0 on both. The CI job itself exited 1 with “Error: clock.pauseAt: Error: Cannot fast-forward to the past” at tests/browser/fresh-install.spec.ts:196. No source, assertion or workflow was changed after the red run. Seven GitHub calls were used; no workflow was dispatched or rerun.

BLOCKED branch=cloud/sx-glove-c-f144 head=7627f27774a9f253313dfbe00f38515dcf5ebcd3 reason=red Verify whose failing command did not reproduce; repair rule prohibits guessing.
