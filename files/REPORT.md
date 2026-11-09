FIELD-010 results for sx-glove-c-f199

CLAIM FIELD-010 DONE points=1,2,3,4,5 tests=tests/api/schedule-push.test.mjs#FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control

Candidate: ecff63d68bbc2b4bd27462745b3de96a7f19f9d9; branch cloud/sx-glove-c-f199; repository just-every/run-glove. Product ref is confirmed on the remote. PR: none required; Verify runs on branch pushes. Verify 42581830646 is completed with conclusion success on this exact head, event push. Independent acceptance and landing are pending.

Repaired two reproduced missing notifications. The scheduled recurring-billing pass now calls notify only after its existing successful commit; a lost optimistic race continues without sending. One background caller passes the existing bindings. The original extendSeries call lines are unchanged. The import branch keeps its pre-journal schedule for notification after the ordinary batch-record commit. An explicit import-undo flag includes removed future booked visits as cancellations; erasure never uses this flag.

The first cron reproduction expected four total pushes after the next occurrence but observed two. The successful later-batch undo reproduction expected one cancellation push and observed zero. Both pass after repair. A later ServiceM8 import containing an already edited, linked technician is refused by the native-edit guard. No import guard is bypassed or weakened: the supported committed removal path after linking is exercised, while an unlinked import correctly sends no phone request. No import adapter, subscription command, service worker, technician screen or shared fixture was changed.

The focused sanity registration uses the existing scenario helper, real Worker commands and read routes, real invited sessions, the existing phoneKeys, decrypt and vapid functions, and the existing push edge. Two phones belong to one technician. Every captured push is decrypted and independently checked for its exact line and minimal contents; each VAPID signature and claims, encryption record and TTL are checked. Miniflare translates outbound callback rejection to HTTP 500, so the unreachable test uses the harness's existing Worker plugin seam to reject fetch at the transport boundary. It changes no production behavior or shared harness file.

Frozen rubric and acceptance evidence (each row uses the named registration above):

| Item | Acceptance outcome | Result | Test location |
| --- | --- | --- | --- |
| R1 | Point 1: dispatcher new, start move, end move, reassignment and cancellation | PASS locally | `tests/api/schedule-push.test.mjs:81`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R2 | Point 1: each crew member receives one notification per subscribed phone | PASS locally | `tests/api/schedule-push.test.mjs:93`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R3 | Point 1: Owner workflow booking on job.created, replay inert | PASS locally | `tests/api/schedule-push.test.mjs:110`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R4 | Point 1: series creation aggregates two changes and no opaque job id | PASS locally | `tests/api/schedule-push.test.mjs:117`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R5 | Point 1: actual scheduled billed-series horizon extension, no repeats after Worker restart | PASS locally | `tests/api/schedule-push.test.mjs:160`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R6 | Point 1: explicit Agent grant succeeds; absent or revoked grant refuses | PASS locally | `tests/api/schedule-push.test.mjs:97`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R7 | Point 1: later move-in undo after technician linking removes a future visit and notifies once | PASS locally | `tests/api/schedule-push.test.mjs:134`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R8 | Point 1: existing public booking choice reaches the only free technician and is single use | PASS locally | `tests/api/schedule-push.test.mjs:122`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R9 | Point 1: ended visits, unchanged schedule and commands without visit changes send nothing | PASS locally | `tests/api/schedule-push.test.mjs:86`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R10 | Point 2 acceptance sentence: each decrypted body contains only title, the exact generic line and opaque single-job id; aggregate id is null | PASS locally | `tests/api/schedule-push.test.mjs:46`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R11 | Point 3 acceptance sentence: phone-specific aes128gcm, single final record, signed ES256 VAPID, correct audience, subject and twelve-hour bound, day TTL | PASS locally | `tests/api/schedule-push.test.mjs:47`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R12 | Point 3: command replay, repeated cron and actual Worker restart never repeat an attempt | PASS locally | `tests/api/schedule-push.test.mjs:229`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R13 | Point 4 acceptance sentence: exact 201, 500 and unreachable labels; 404 and 410 remove only their subscriptions | PASS locally | `tests/api/schedule-push.test.mjs:177`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R14 | Point 5 acceptance sentence: own subscribe and unsubscribe govern later phones; cross-person removal has no effect | PASS locally | `tests/api/schedule-push.test.mjs:239`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R15 | Point 5 connector attribution: every outcome is attributable in Activity and business export without endpoints or phone keys | PASS locally | `tests/api/schedule-push.test.mjs:204`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R16 | BASE-ROLE-001 inheritance: live authority, refused Agent move, phone isolation, sign-out and privacy erasure | PASS locally | `tests/api/schedule-push.test.mjs:239`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R17 | BASE-SECRET-001 inheritance: every sent payload is minimal; another phone cannot decrypt; Activity and export omit subscription keys | PASS locally | `tests/api/schedule-push.test.mjs:83`; `FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control` |
| R18 | BASE-ACCESSIBILITY-001 inheritance | INSPECTED, unchanged | Existing citation at CONTRACT.md:1560; this change adds no screen or control. Existing labels are read through the phone-list route. Field proof R-1 and R-2 remains external. |

DONE-RIDERS:

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | PASS | Every native outcome is reached by the focused registration and the existing push registration. See R1 to R17; exact-head Verify 42581830646. |
| 2 | PASS | Real invited people, native jobs and committed D1 changes; independent expected lines and counts; wrong-key decryption, absent and revoked grant, cross-person unsubscribe, signed-out and erased-customer refusals. |
| 3 | PASS | Existing verification.json API glob loads the new registration; push Verify 42581830646, completed, success on ecff63d68bbc2b4bd27462745b3de96a7f19f9d9. |
| 4 | PASS | Exact-head focused rerun passes on Node 22.20.0. Existing regression sources and repaired production bytes were unchanged between their passing run and the candidate; only focused-test coverage and its lock changed. |
| 5 | PASS | CONTRACT.md FIELD-010 meta line already cites BASE-ACCESSIBILITY-001, BASE-ROLE-001 and BASE-SECRET-001. No new inheritance or duty is invented. |
| 6 | PASS mechanical; judgment delegated | Contract write and check exit 0, views restored from main. Status, Gap, Evidence, provenance and generated counts remain main-owned; the lander writes the accepted judgment. |
| 7 | PASS | No acceptance text, Status row or coverage-map obligation changed; git diff against main for CONTRACT.md is empty. |
| 8 | PASS | Allowed Agent change completes under the explicit Owner grant; absent and revoked grants refuse. Another technician cannot remove a phone; signed-out sessions cannot subscribe. Existing push journey also covers desk and agent subscription refusals and role loss. |
| 9 | PASS boundary | Only push-service edge behavior is qualified. No actual phone arrival, live push-service delivery, native distribution, R-1 screen-reader field proof or R-2 VPAT is claimed. |
| 10 | PASS, inapplicable | No new policy default; existing owner setup, technician opt-in and explicit owner grant are retained. |
| 11 | PENDING guarded landing | Main is still 592be9edd6258ffb39bed635bb28a1506494ae7d; exact-head publication scan and Run site after guarded landing belong to the fleet. No cloud landing or main push occurred. |

PRE-READY self-check:

1. Native acceptance outcomes have passing public-door assertions. Initial cron and undo assertions fail on the original behavior. Exact-head Verify is reported above, without borrowing green from another head.
2. No prior assertion or registration was removed, narrowed, skipped or hidden behind a width or environment condition. Test inventory is 194 before and 195 after, cap 200; no replacement or deletion was needed.
3. Existing authority is preserved. The journey exercises absent and revoked Agent grants, a cross-person phone removal, a signed-out resubscription refusal, replay and actual Worker restarts, plus erasure with no deleted-id push or visit resurrection. Capture semantics and subscription restoration remain with their owning clauses.
4. No screen, text size, icon-only control or settings placement changed. Browser screenshots at 1440 and 390 are inapplicable to this API and connector repair.
5. Source lock is fresh. Contract generation and check pass, and generated views equal main. Changed source was checked for email-shaped new literals and provider-shaped secrets. Publication scan, main equality and post-landing Run site remain unestablished until the fleet runs them; this report does not claim a scan or landing receipt.

Actual local results:

- Focused journey: exit 0 on exact head ecff63d68bbc2b4bd27462745b3de96a7f19f9d9, Node v22.20.0, all five named point groups. A first post-commit attempt hit a local fetch failed transport error during the restart scenario, without an assertion mismatch; one unchanged rerun passed. Both actual receipts and outputs are preserved. No production or test edit was made to pass that rerun.
- Existing push, recurring-billing and move-in regressions: 3 registrations, all pass, exit 0. The complete diagnostic output is in regressions.txt.
- pnpm typecheck: exit 0 on Node 22.20.0. Production build via cloud_run npx -y @runeditrun/rer build: exit 0. First-party rer check: exit 0.
- Contract write with --clauses FIELD-010: exit 0; check: exit 0; generated ACCEPTANCE.md and docs/CLAIMS.md restored from origin/main and not committed.
- Source lock regeneration: exit 0; check: exit 0; exact-head repeated check: exit 0, ok true. Migration ledger: not applicable; no migration changed.
- Current main was fetched and merged with the published branch, reporting already up to date. Both candidate commits have fleet author and committer; all side parents and trailers were inspected before both pushes. No trailer is present. The product checkout is clean.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses FIELD-010 and check exit=0; ledger=none exit=0

publication_scan commit=ecff63d68bbc2b4bd27462745b3de96a7f19f9d9 complete=unestablished historyScanned=unestablished findings=unestablished reason=cloud-side scan delegated to guarded lander
main_equal_candidate=false main=592be9edd6258ffb39bed635bb28a1506494ae7d candidate=ecff63d68bbc2b4bd27462745b3de96a7f19f9d9
base_main Verify=42577457957 success; Run site=42577457916 success. These are base checks, never candidate proof.

Contract counts before and after: 35 DONE, 199 PARTIAL, 29 MISSING, total 263. FIELD-010's source row remains PARTIAL; this report claims all five native points for DONE on acceptance. Accepted count change would be +1 DONE and -1 PARTIAL, entirely lander-owned. Plan row proposed: FIELD-010 native points 1 to 5 qualified, subject to its independent gate. No plan file was written.

No product blocker or new policy default remains. FIELD-004 installation and tap obligations, FIELD-009 subscription custody, FIELD-001 device behavior, FIELD-005 native-account holds, DISP and PLAN work owned by other rounds, and every existing provider and policy hold remain unchanged. This run authorizes no release or real provider delivery. The packet carries the full plan, public-door probe lines, reproduction logs, passing outputs, first-attempt failure, mechanical receipt, exact-head receipt, CI observations and product custody.
