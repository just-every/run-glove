# FIELD-006 qualification — sx-glove-c-f180

Repository: just-every/run-glove. Branch: cloud/sx-glove-c-f180. Product head: `a37903a072ea433f4077fd89c988663ce7e1fe8c`.
Integrated main: `63bfd0d1a155d7be44561e579d643f895fabded3`. No PR is required: Verify accepts branch pushes.

FIELD-006 remains PARTIAL. Native points 1, 2, 3, 4 and 6 are qualified; point 5 remains externally held. Contract judgments are untouched. Current-main counts before and after this round are 28 DONE, 206 PARTIAL, 29 MISSING (263 rows). Initial checkout counts were 27 DONE, 207 PARTIAL, 29 MISSING; the intervening STOCK-002 judgment came from main and was preserved, not authored by this round. Nameplate registrations remain one before and after; no registration, existing assertion, date case or manual-library assertion was removed, narrowed or width-gated.

## Plan and result

1. Read the complete FIELD-006 clause, current Gap, native implementation, fixtures, public doors and inherited duties. The initial combined registration had positive cases but lacked the explicit custody and refusal qualification requested in the brief.
2. Reproduce the redirect risk through nameplate.read, the existing models.reply hook and outbound.attempts, without editing the harness.
3. Refuse all redirects in the shared askModel request and prove continued AGENT-005 quote drafting and AGENT-006 callback behavior.
4. Expand the existing registration with named point scenarios covering all requested native outcomes, actual Worker restart, authorized file readback, replay, technician audit attribution, withdrawn authority and personal erasure. Preserve the original date and manual behavior.
5. Typecheck and run only the relevant three API registrations, first-party check, contract generation and source lock. Merge updated main after the published save, retaining its complete judgments and generated views. Publish the final product branch separately from this evidence packet.
6. Run an additional temporary public-command and real installation-archive probe for the inherited provider-key exclusion. Keep that probe and its receipts outside the product tree. Hand the exact candidate to the fleet for exact-SHA Verify, publication scan and guarded landing.

Changed product files: `src/glove/provider.ts`, `tests/api/nameplates.test.mjs`, `sources.lock.json`. The harness, suggest test, callback test, UI, offline-day files, installer, workflow, runtime pins and contract are byte-identical to integrated main. The one provider change makes redirect handling manual for every feature. HTTP 3xx already enters the provider failure path, preserving its status without a reading, original photo or equipment change.

Plan row to update on the Mac: FIELD-006 gains native qualification for points 1–4 and 6; retain PARTIAL and the point-5 Base and policy hold. No other campaign row changed. FIELD-011 retains its manual, offline-day and company-policy remainder; AGENT-006 is another pending campaign, not a new target here.

## Reproduction and repair

The original provider implementation made a second outbound attempt after a model-edge HTTP 307 redirected to another HTTPS origin. The public-door assertion failed with `2 !== 1` (`redirect-before.txt`). This establishes forwarding of the photo-bearing request. The existing harness does not expose headers at an unexpected destination, so actual key forwarding is not claimed.

After repair, 301, 302, 303, 307 and 308 toward another HTTPS origin, plain HTTP and a different path on the configured origin each cause exactly one outbound attempt and one provider call, report the original 3xx status and save no reading or photo. No retry occurs. `redirect-after.txt` records all three relevant shared-provider registrations passing after the initial fix. `qualification-tests.txt` is the final run on `a37903a072ea433f4077fd89c988663ce7e1fe8c` under Node 22.20.0: 3 registrations pass, 0 fail.

## Acceptance rubric and exact-head evidence

Every API point below belongs to `tests/api/nameplates.test.mjs` test "FIELD-006, FIELD-011 a technician photographs three nameplates; the model proposes the fields and nothing is saved until the technician confirms". The existing Verify API glob includes that file; the portable shard includes `tests/portable.mjs`. CI event and conclusion are in the actual `candidate-ci.json`, with the full head recorded. Local PASS is not a claim of completed CI.

| Item | Public-door proof | Result |
| --- | --- | --- |
| FIELD-006 point 1 | `tests/api/nameplates.test.mjs:112`. Three independent fixture expectations, complete unread lists, exactly three proposals, unchanged equipment, actual Worker restart and read replay. | PASS locally; push Verify 42555585167 in progress |
| FIELD-006 point 2 | `tests/api/nameplates.test.mjs:31`. Signed-in unscoped Owner connection and disconnect; Office, Dispatcher, Technician, Agent, custom role, integration token, signed-out caller and branch-limited Owner refused. HTTP, embedded credentials, query and fragment refused. Missing connection and disconnect produce zero outbound attempts. Keys absent from state, saved outcomes, Activity, business export and captured Worker logs. | PASS locally; push Verify 42555585167 in progress |
| FIELD-006 point 3 | `tests/api/nameplates.test.mjs:294`. Existing and new equipment read by the current technician; desk, unrelated technician, reassigned-away visit, cancelled visit, completed visit and equipment at another site refused with unchanged records, files and zero outbound calls. Entire request compared with the independently specified fixed instructions, photo, model, storage-off and strict schema; private customer, site, job, technician and equipment facts absent. | PASS locally; push Verify 42555585167 in progress |
| FIELD-006 point 4 | `tests/api/nameplates.test.mjs:152`. Authorized technician reads model identity, proposal, unread list and original JPEG bytes; all three originals return byte-identical and unrelated or signed-out callers are refused. Existing empty-field and illegible-date cases remain unread. | PASS locally; push Verify 42555585167 in progress |
| FIELD-006 point 5 | UNMET-EXTERNAL: company-policy choice needs the Base client-custody adapter and the held service-work surface. No automatic fill or simulated policy added; fixed same-technician confirmation retained. | HELD |
| FIELD-006 point 6 | `tests/api/nameplates.test.mjs:165`. Exact confirmation, serial correction, original proposal retained separately, discard without equipment or photo attachment, other-technician and desk refusal, once-only replay including restart. Every accepted read, confirmation, correction and discard checked for technician attribution in Activity and the business export. Erasure and withdrawn role refuse replay without restoring files or records. | PASS locally; push Verify 42555585167 in progress |

| Inherited duty | Evidence | Result |
| --- | --- | --- |
| BASE-SECRET-001 | Owner connection boundary at line 31; redirect refusal at line 79; key exclusion from saved outcomes and logs at line 289; state, Activity and export assertions in the same journey. | PASS locally |
| BASE-DATA-001 | Existing real archive manifest assertion `tests/portable.mjs:496` still excludes glove_provider_keys. Temporary real archive probe connects a synthetic model key through the current Owner command, verifies state, Activity and business export, exports the actual installation, and independently checks the archive manifest omits the key table and its bytes omit the key. Actual `archive-probe.json` records exit 0 on the candidate: a populated 156,237-byte installation archive excludes the provider-key table and synthetic model key. The temporary reproducible script is `archive-probe.mjs`. | PASS real archive probe; existing portable shard retained |
| DATA-002 attribution | Every saved nameplate read, confirmation and discard command is matched to exactly one technician event and its exported row, starting at line 280. | PASS locally |
| Authority, erasure and replay | Line 352: revoked role refuses replay; erasure, actual restart and saved-outcome replay return ERASED, files unavailable, equipment and readings absent, no outbound attempt. | PASS locally |

## DONE-RIDERS

| Row | Result | Evidence and limit |
| --- | --- | --- |
| 1 | PARTIAL | Native point scenarios pass; point 5 remains the explicit external hold. No whole-clause DONE claim. |
| 2 | PASS | Independently authored fixture outcomes, populated records and dangerous authority and provider paths both ways; refused cases change no domain records or files. |
| 3 | PENDING CI | Final 3-registration local run is bound to `a37903a072ea433f4077fd89c988663ce7e1fe8c`; normal push Verify includes this file. No green claim from another SHA. |
| 4 | PASS locally | Final touched tests ran after the last source edit and commit; typecheck and first-party check receipts retained. Temporary archive probe also binds its exact source head. |
| 5 | PASS INSPECTED | FIELD-006 already cites BASE-DATA-001 and BASE-SECRET-001 at CONTRACT.md:1582. |
| 6 | PASS mechanical | Generator write and check exit 0. Contract status, Gap, Evidence and generated views equal integrated main; their older judgment provenance is unchanged and remains the lander's responsibility. |
| 7 | PASS INSPECTED | No acceptance wording, status row, coverage mapping or ruling changed. All 263 parent rows retained. |
| 8 | PASS | Excluded provider managers, wrong technician, desk confirmation and discard, reassignment, terminal visits and cross-site equipment all refused with no effect. |
| 9 | PASS boundary | Model fake proves the network edge only. No live account, legal terms, provider retention or training compliance, native device, or offline acceptance claimed. |
| 10 | NOT APPLICABLE | No new policy choice; existing fixed held confirmation retained. Rejecting redirects enforces the owner's configured HTTPS destination. |
| 11 | PENDING FLEET | Product branch published only. Main equality, publication scan, final branch Verify and Run site remain guarded landing duties. |

## Runtime probes

PROBE FIELD-006 1: three nameplate photos through nameplate.read -> exact independently expected proposed and unread fields; no equipment change across Worker restart and replay.
PROBE FIELD-006 2: excluded actors and invalid provider addresses through model.connect; read without connection; 15 redirect responses -> refused, no second outbound request, no saved photo or reading; actual archive exclusion is in archive-probe.json.
PROBE FIELD-006 3: current technician, other technician, desk, reassigned, cancelled and completed visits -> current reads existing or new unit; invalid reads refused before any provider call; captured body contains only fixed instructions, photo, model and strict storage-off schema.
PROBE FIELD-006 4: assigned technician file door -> all three photo originals byte-identical; unrelated technician gets 404, signed-out caller 401; model and unread evidence retained.
PROBE FIELD-006 5: none, Base client-custody adapter and service-work surface remain held.
PROBE FIELD-006 6: same technician confirms, corrects and discards; wrong actors and replay -> exact retained proposal and correction, once-only equipment effect and attributable Activity and export; erasure and withdrawn role fence replay.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses FIELD-006 and check exit=0; ledger=none exit=0.

## PRE-READY self-check

1. Every native behavior named by this brief has an executed public-door scenario; required exact-head CI remains honestly pending. Point 5 stays held, so the whole clause remains PARTIAL.
2. No existing assertion removed, weakened or conditionalized; Rheem's full proposal now has stronger assertions. Registration count unchanged. Harness and adjacent suites unchanged.
3. Withdrawn authority, erased outcomes and read, confirmation and discard replay all execute through real commands, with unsafe cases refused and no resurrection.
4. No screen was changed. UI typography, tooltips, Settings placement and 1440 and 390 browser screenshots are not applicable to this API-only change; no browser proof is claimed.
5. Source lock fresh; generated views check passes and remain equal to main. Added product text checked for email-shaped and provider-shaped values; none. Every candidate author and committer is fleet, trailers absent. The temporary archive probe initially expected HTTP 200 from the native dev gate; the actual successful response is HTTP 204. Its temporary assertion was corrected without a product edit. Publication scan is deliberately deferred to the maintained fleet lander under the cloud exemption.

Exact-head scan receipt: commit=a37903a072ea433f4077fd89c988663ce7e1fe8c; complete=NOT_RUN; historyScanned=NOT_RUN; findings=NOT_RUN (cloud exemption, no scan result invented). Full Git history was cloned without depth.
Main equality: false before landing; integrated main is `63bfd0d1a155d7be44561e579d643f895fabded3`. Its Verify runs 42554943349 and 42553468889 and Run site 42554943436 succeeded. These are main health evidence only, not candidate CI evidence. Candidate event and run IDs are recorded in candidate-ci.json. No workflow rerun or PR was requested.

Product push receipts: save-push.txt and candidate-push.txt. Actual test and command receipts: redirect-before.txt, redirect-after.txt, qualification-tests.txt, typecheck-save.txt, typecheck-final.txt, rer-check.txt, mechanical.txt, archive-probe.json and receipt.json. The packet contains no runtime entry URL, installation archive, real credential, private state, held-out gate material or symlink. Product and evidence custody are separate.

CLAIM FIELD-006 PARTIAL points=1,2,3,4,6 tests=tests/api/nameplates.test.mjs#FIELD-006, FIELD-011 a technician photographs three nameplates; the model proposes the fields and nothing is saved until the technician confirms; tests/portable.mjs#Glove portability passed
GAP FIELD-006: Point 5 needs Base's client-custody adapter and the held service-work agent surface and company policy. Fixed same-technician confirmation remains; live model-provider acceptance is not claimed.

Additional archive result: the native gate returns HTTP 204; after correcting that temporary probe assumption, the public commands and actual export passed. No product change or permanent test was needed. The archive was deleted after its manifest and bytes were checked. The build regenerated routeTree.gen.ts with whitespace-only changes; those generated changes were restored, and the source lock was checked again on the clean committed tree.

Final CI observation after the required 300-second discovery interval: push Verify 42555585167 is in progress on a37903a072ea433f4077fd89c988663ce7e1fe8c. No failed conclusion is reported. This is the candidate run, not either successful main-health run. Three GitHub API calls total; no dispatch, rerun or job-log request. The maintained fleet lander owns the remaining CI wait, publication scan and guarded landing.

Final local gates: all three relevant API registrations pass on the final committed head; typecheck and first-party check pass; generated contract documents pass; the source-lock check passes again after restoring the runtime generator whitespace. Product origin advertises the exact full candidate head. No local command remains pending.
