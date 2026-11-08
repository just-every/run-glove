# COMM-017 focused custody proof

Candidate: `53f62846c8af0f99266cfe95cb95c48700be42b3` on `cloud/sx-glove-c-f165` in just-every/run-glove.
Base: `cb4787ac9734f9fb534fe2896cc054e3637953af`. Product branch pushed successfully. No PR is required: Verify starts on branch push. No product acceptance text or status judgment changed.

Claim: all eight native acceptance points qualified, proposed DONE on guarded landing. Current stored status remains PARTIAL. Contract counts before and after are 21 DONE, 213 PARTIAL, 29 MISSING, 263 total. If the independent gate accepts this claim and no concurrent judgment changes counts, COMM-017 alone contributes plus one DONE and minus one PARTIAL.

Full execution plan and results are in PLAN.md. Public-door probe records are in PROBES.txt. Complete actual local outputs and their hashes are recorded in RECEIPT.json.

## Changes and validation

Added tests/api/ses-sns-custody.test.mjs with eight focused public-door registrations. The harness now has an optional SNS response hook that supplies redirect responses at the provider edge. Production code is unchanged because the proof exposed no defect.

Focused candidate run: 8 passed, 0 failed, 0 skipped, using Node 22.20.0 on the committed candidate. Existing email regression: 6 passed, 0 failed, 0 skipped. Its harness and production bytes are identical to the candidate; the later diff changes only the focused test and source lock. Typecheck and first-party profile check both exited 0 on the committed candidate. Contract generator write and check exited 0; generated views were restored from main and are not committed. Source lock regenerated last, includes the new tracked test and passes its check. No migration changed.

Existing email tests, the mail provider fixture, browser email journey, CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are byte-identical to origin main. No assertion was removed, narrowed or hidden. No UI changed, so screen and tooltip checks are inapplicable.

Test inventory: focused registrations 0 to 8; direct API registrations 157 to 165. An inventory of direct API and browser registrations already totals 201 on main and totals 209 on this candidate; this exceeds the stated 200-test target before this round. No cap raise was authored, no unrelated assertion was deleted, and the eight new point registrations are the proof explicitly requested by this brief. Suite consolidation is a mechanical follow-up for the lane, not an unproved COMM-017 outcome.

The first published save was retained. A malformed configuration fixture in that save used a literal slash; the final candidate constructs it from pieces. The final changed-text check finds no stray repository-shaped prose token. Published history was not rewritten; the full-history publication scan remains the fleet lander's gate.

## Frozen proof rubric

Every R row below corresponds to one acceptance sentence. Each is MET by an actual passing local public-door journey. Exact-head Verify is separately recorded below and is not assumed green.

| Row | Acceptance outcome | Test and lines | Local result | Verify event and conclusion |
| --- | --- | --- | --- | --- |
| R1 | Pin region, TopicArn and configuration set; malformed connection values and foreign sources refuse; reconnect withdraws old pins. | tests/api/ses-sns-custody.test.mjs, COMM-017 point 1: owner pins reject malformed sources and reconnect withdraws old pins, lines 58–82 | MET, PASS | push, run 42530273972, queued at final discovery |
| R2 | Match header and envelope, verify versions 1 and 2, refuse invalid signatures and hostile certificate locations, refuse certificate redirects, cap cache by one hour and certificate validity. | tests/api/ses-sns-custody.test.mjs, COMM-017 point 2: signatures, certificate URL custody, redirects and bounded cache, lines 84–127 | MET, PASS | push, run 42530273972, queued at final discovery |
| R3 | Accept exact one-hour past and five-minute future limits; refuse one second beyond. | tests/api/ses-sns-custody.test.mjs, COMM-017 point 3: exact timestamp boundaries accept and one second beyond refuses, lines 129–138 | MET, PASS | push, run 42530273972, queued at final discovery |
| R4 | Require the signed envelope and pinned configuration and delivery tags; bind every send to its own base64url delivery ID. | tests/api/ses-sns-custody.test.mjs, COMM-017 point 4: signed configuration and delivery tags bind every SES send, lines 140–162 | MET, PASS | push, run 42530273972, queued at final discovery |
| R5 | Deduplicate SNS and SES identities; refuse changed-body reuse; retain results through restart. | tests/api/ses-sns-custody.test.mjs, COMM-017 point 5: SNS and SES replays apply once and changed-body reuse refuses, lines 164–183 | MET, PASS | push, run 42530273972, queued at final discovery |
| R6 | Verify every confirmation before the exact pinned HTTPS request, fetch once and never follow a redirect or refetch a failed confirmation. | tests/api/ses-sns-custody.test.mjs, COMM-017 point 6: confirmation fetch is checked, exact, once and never follows redirects, lines 185–217 | MET, PASS | push, run 42530273972, queued at final discovery |
| R7 | Unsubscribe creates an owner warning in state and Activity, without fetching its subscription URL. | tests/api/ses-sns-custody.test.mjs, COMM-017 point 7: unsubscribe persists an owner warning in state and Activity without fetching, lines 219–236 | MET, PASS | push, run 42530273972, queued at final discovery |
| R8 | All eight SES outcome forms map exactly; facts and results survive actual restart; state, command results, Activity, export and captured logs exclude credentials, subscription tokens and certificates. | tests/api/ses-sns-custody.test.mjs, COMM-017 point 8: every SES outcome retains exact state and secret-free facts across Worker restart, lines 238–292 | MET, PASS | push, run 42530273972, queued at final discovery |

The wrong-signature probe uses a verified cached certificate: a cryptographic signature requires a public key, so a cold cache must fetch the pinned certificate first. Structural source refusals occur before any fetch; the wrong signature causes no additional request or business effect. This follows the clause without inventing an impossible pre-key signature check.

Two SNS envelopes carrying the same SES event correctly leave two SNS identity receipts, one SES receipt and one delivery fact. An exact replay of one envelope leaves one receipt of each kind. This distinction is explicitly asserted.

## Inherited duties

| Duty | Public-door evidence | Result |
| --- | --- | --- |
| BASE-MAIL-001 truthful mail outcomes | Point 8 checks exact state, provider reference, occurrence time and identical Activity and export facts for every outcome; point 6 exposes unknown confirmation outcome. | PASS locally |
| BASE-OPS-003 idempotency | Points 5–8 repeat signed callbacks, replay controls and recreate the actual Worker with persistent D1. | PASS locally |
| BASE-OPS-004 visible failure | Point 6 checks confirmationFailed in Activity and the state warning; point 7 checks the unsubscribe warning in both doors; point 8 checks failed and rejected messages. | PASS locally |
| BASE-SECRET-001 no leakage | Point 8 checks both accepted outcomes and a deliberately rejected unsigned confirmation containing synthetic token and certificate material; it checks state, saved command results, Activity, business export and captured Worker logs for the synthetic access key, secret, session token, subscription token and full and partial certificate. | PASS locally |

The receiving clause already cites all four Base duties. No acceptance point, policy default or ct ruling was changed. Held live-provider and separate-clause obligations remain held, including COMM-013, COMM-014, COMM-010, COMM-012, COMM-018 and COMM-011 as scoped in the brief. No live account proof or automatic resend is claimed.

## DONE riders

| Rider | Result | Evidence |
| --- | --- | --- |
| 1 | PASS local outcomes; exact-head CI pending | R1–R8 each exercise a supported case and inspect the refused or permitted result; tests are included by the existing API glob. |
| 2 | PASS | Each unsafe callback compares all product and mail tables before and after refusal. Supported callbacks operate on actually sent messages; no empty-list proof. |
| 3 | PENDING Verify | Push Verify 42530273972 targets the full candidate SHA. API shards enumerate the new test automatically. No successful conclusion has yet been assumed. |
| 4 | PASS | Eight focused tests and typecheck were rerun after commit on the candidate. The earlier email run uses the same relevant source and harness bytes, as confirmed by the diff. |
| 5 | PASS, INSPECTED | COMM-017 meta line cites BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004 and BASE-SECRET-001; corresponding journeys are above. |
| 6 | PASS mechanical; judgment remains lander-owned | Generator write and check pass; views restored; status and Evidence cells unchanged. The lander owns any eventual judgment and provenance update. |
| 7 | PASS, INSPECTED | CONTRACT.md unchanged, all 263 parent Status rows remain; no rewrite, acceptance change or new ruling. |
| 8 | PASS within clause authority | Point 1 configures through the current owner's public command and proves pin withdrawal on reconnect; hostile callbacks cannot mutate any product or mail table. No new role authority is introduced. Broader callback authority remains with COMM-013. |
| 9 | PASS boundary | Only existing SES and SNS network-edge behavior is claimed. No live Amazon account, legal or provider activation acceptance is claimed. |
| 10 | Inapplicable | No custody, consent, spending or authority policy default was adopted. |
| 11 | PENDING guarded landing | Main remains the base, not the candidate. Publication scan, candidate landing and resulting Run site are fleet gates. |

## Pre-ready self-check

1. PASS locally: all named outcomes have public-door passing assertions, supported and unsafe security paths are exercised. Exact-head Verify is pending.
2. PASS: no existing assertion was removed, narrowed, skipped or placed behind a condition.
3. PASS for the touched boundary: reconnect withdraws old pins; callback and control replay cannot duplicate results or requests. Personal erasure and broader COMM-011 custody are unchanged and remain expressly outside this proof; no new data resurrection path is added.
4. Inapplicable: no screen changed.
5. Local checks PASS: lock fresh, contract generator current, no email-shaped literal in the new fixture. Publication scan, candidate Verify and candidate main Run site remain separately pending; no cloud scan or landing result is fabricated.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write then check exit=0; generated views restored; ledger=none exit=0.

## CI and publication custody

Base Verify 42527470716 and Run site 42527470649 are completed success on the base SHA. An additional base Verify 42526035926 is also success. These are not candidate proof.

Candidate Verify: run 42530273972, event push, exact candidate SHA, queued at final discovery. CI.json carries the timestamped REST observation. Three GitHub API calls used through final discovery, no dispatch or rerun, no PR.

Publication scan result: commit 53f62846c8af0f99266cfe95cb95c48700be42b3; complete=false; historyScanned=unestablished; findings=unestablished. Cloud branch push does not run the Mac-only scanner. The maintained lander must scan complete history, require exact-head Verify, land through its guard and require Run site before counting DONE.

Main equality: false, main was intentionally never advanced. Candidate Run site: not run because it is a main-only landing gate. No acceptance-breaking local failure or missing account blocks the native proof. Pending CI and landing are not claimed complete. No plan, Status, Gap or Evidence cell was edited.

CLAIM COMM-017 DONE points=1,2,3,4,5,6,7,8 tests=tests/api/ses-sns-custody.test.mjs#COMM-017 point 1: owner pins reject malformed sources and reconnect withdraws old pins; tests/api/ses-sns-custody.test.mjs#COMM-017 point 2: signatures, certificate URL custody, redirects and bounded cache; tests/api/ses-sns-custody.test.mjs#COMM-017 point 3: exact timestamp boundaries accept and one second beyond refuses; tests/api/ses-sns-custody.test.mjs#COMM-017 point 4: signed configuration and delivery tags bind every SES send; tests/api/ses-sns-custody.test.mjs#COMM-017 point 5: SNS and SES replays apply once and changed-body reuse refuses; tests/api/ses-sns-custody.test.mjs#COMM-017 point 6: confirmation fetch is checked, exact, once and never follows redirects; tests/api/ses-sns-custody.test.mjs#COMM-017 point 7: unsubscribe persists an owner warning in state and Activity without fetching; tests/api/ses-sns-custody.test.mjs#COMM-017 point 8: every SES outcome retains exact state and secret-free facts across Worker restart

The earlier candidate 63f26628327b7d1c7ead827f201f2f1ee2dfb972 started Verify 42529760283 and was superseded by the final rejection-log assertion. Its observed in-progress status is retained in CI.json; no earlier-SHA result is used as final proof.
