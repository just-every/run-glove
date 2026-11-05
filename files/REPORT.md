# sx-glove-c-f83-fix1 — FIELD-003 A

Repository: just-every/run-glove. Product branch: `cloud/sx-glove-c-f83-fix1`.
Original family lifetime: **FIX1of2**. Sole repair: legitimate prior-installation manual report links survive an actual Worker upgrade while their issuer retains current authority. No clause, UI, provider, account, workflow, runtime or source-pin expansion.

## Product provenance and custody

- Comparison main: `e0bb7c6b8489e3ffc51b26a7601764be9a870f99`.
- Required original source and failing-before Worker: `46c9593e83723388e134dfa7a38733ba982ad5ba`.
- Fixed-after product: `5581612a468f79766add9b6334070c2227e3d931`.
- The final head retains both comparison main and the complete original source, including its merge-time integration authority assertions, as ancestors. The original source branch was never rewritten. An unpublished default rebase dropped merge-time changes; that replay was discarded before publication, and the complete original source was restored before applying the fix. Fresh main remained the same comparison SHA; the post-publication merge reported already up to date.
- Only the named product branch was pushed, through `python3 $HOME/rer-consolidation/.tools/cloud-push.py origin cloud/sx-glove-c-f83-fix1`. The first attempt succeeded. `product-remote.txt` independently records the exact advertised remote head. No PR was created: this seed's supplied landing rules use the fleet Mac lander.
- All three candidate commits, including both side parents of the original merge, have fleet authors and committers with no trailers. See `identity-audit.txt` and `publication-receipt.json`.
- The product change relative to the required original source is limited to `src/glove/service-reports.ts`, the FIELD-003 status/evidence/gap and generated summary in `CONTRACT.md`, and `sources.lock.json`. `fix1-product.patch` contains the complete product diff. No evidence or generated view file is in a product commit.

## Reproduction and repair

The before observation was completed on unchanged source before editing product code. The one-off probe is `files/native-upgrade.mjs` in this evidence ref, not a registered product test. From the original-source checkout it was invoked through:

```sh
. /tmp/rer-cloud-toolchain.sh
cloud_run node "$HOME/rer-consolidation/work/sx-glove-c-f83-fix1/packet/native-upgrade.mjs"
```

Main and original source were separately built with `cloud_run npx -y @runeditrun/rer build` (exit 0 each). A detached worktree of the declared repository supplied comparison main. The probe runs the **full emitted production Worker**, with native authentication and migrated, disk-persistent D1. Its small external wrapper controls only the runtime clock at `2026-11-05T21:51:00.000Z`; no product route or response is substituted. The native sign-in provider's mail transport is the only network-edge fake.

The main Worker bootstrapped the owner, invited and natively signed in Office and Technician, assigned their roles, saved a business, service, customer and site, approved and accepted a quote, created and booked a job, and recorded technician arrival, required checklist, original photo and reasoned-unsigned completion. Office then issued the ordinary `report.link` capability. Its record has **no issuedBy**, expiry exactly `2026-11-12T21:51:00.000Z`, and null revocation. The issuance timeline fact identifies the actual Office operator and the matching native command. That operator was active, Office, unscoped and authorized throughout the initial comparison.

The main Worker was disposed. The full unchanged original candidate Worker started against the **same disk persistence, D1 identity, bindings, native sessions and bearer**. It did not bootstrap or reissue a link. The before receipt confirms the expected regression; successful observation of a 404 is not product success.

After the fix was committed and built (exit 0), the same live probe was resumed by sending `after` to its stdin. It disposed the old candidate Worker and started the fixed full Worker. All credentials remained only in that process's memory. The probe's complete exit was 0.

| Stage | Report GET | Original GET | Observation |
| --- | ---: | ---: | --- |
| Main, native-issued prior link | 200 | 200 | Exact snapshot and original input bytes |
| Original candidate after real restart | 404 | 404 | Both `REPORT_LINK` |
| Fixed candidate after real restart | 200 | 200 | Exact same main response bytes and original input bytes |

PROBE FIELD-003 A: main-created valid report/original links before upgrade -> main 200/200; original candidate 404/404 REPORT_LINK; fixed candidate 200/200 exact bytes over unchanged prior data.

`before-receipt.json` and `upgrade-receipt.json` are actual machine-written receipts. Each upgrade compared all `glove_records`, private link-secret rows, native operators, native sessions and timeline facts in memory and found them identical, both before and after the public reads. These private rows and generated credentials were never copied into evidence. The same bearer remained in memory across all three Workers.

Exact retained public report content: `files/main-report.json`, SHA-256 `f919cfb1c465c66fc5796683eccf79bd35a2427cf6610129228f2f533b2f4341`.
Exact synthetic original: `files/original.png`, SHA-256 `c414cd0e204de974f73753c7e28d7638e7b3691bb8b1a2bab6b25bb7fed7ce77`.

The implementation resolves legacy **manual** issuer identity from the existing append-only `report.link.created` event and matching `report.link` command outcome. It binds the event to the same link, report, job, issuance instant and expiry, and binds its actor to the saved native command. An explicit `issuedBy` remains authoritative when present; an absent native issuance does not gain authority. The resolved identity must still pass the existing active native/integration issuer, current role/custom permission and branch gates on every report and original read. No legacy row, frozen snapshot, expiry, revocation or bearer was rewritten, and no owner or issuer was invented.

## Preserved controls

The same upgraded prior-data installation additionally observed:

- Matching main-branch authority: 200/200. Withdrawal to the other branch: 404/404. Restoring the unscoped branch: 200/200.
- Office changed to Viewer: 404/404. Restored Office: 200/200. Inactive issuer: 404/404. Reactivated issuer: 200/200.
- One millisecond before original expiry: 200/200. At exact original expiry: 404/404. Returning the probe clock to the original unexpired instant retained the same capability and exact bytes.
- An unrelated customer's original and a report-selection query remained 404. The authenticated original door remained 401 when offered only the report bearer.
- Explicit revocation of the original main-issued link: 404/404. A separate still-live newly issued capability then lost both report and original after ordinary privacy erasure; zero service reports remained. No erased record was revived.

The existing registered API journey independently retains both complete signed and reasoned-unsigned snapshots, every distinct original, another report's original exclusion, recommendation single-draft and human approval, current branch/role/operator and integration controls, Activity/history/export, command replay and erasure assertions. Every original-source test byte is unchanged. The existing registered portability journey retains its exact report/original/link-metadata restore assertions and rejects old bearers after restore; its fresh result is recorded separately below.

## Checks and mechanical custody

- `node --test --test-concurrency=1 tests/api/service-reports.test.mjs`: exit 0, 1 registration, 1 pass, 0 failures/skips.
- `node tests/portable.mjs`: exit 0 on the committed candidate; complete existing journey passed, including exact FIELD-003 restore/original/link metadata, denied prior/revoked bearers, new-bearer requirement and erasure fences. See `portable-receipt.json` and `glove-portable.log`.
- `pnpm typecheck`: exit 0. The supplied toolchain shim selected pnpm 10.12.4; the host's newer Node 24.19.0 ran the TypeScript command. RER builds select the checkout's own runtime pin.
- `node scripts/contract-docs.mjs write --clauses FIELD-003`: exit 0; `node scripts/contract-docs.mjs check --clauses FIELD-003`: exit 0. The wrapper initially rejected the stale generated summary after changing the status; running its same delegated generator without clause arguments regenerated the summary first, then both clause-qualified commands passed. No summary was hand-edited.
- Generated `ACCEPTANCE.md` and `docs/CLAIMS.md` were restored whole from comparison main. Neither view is committed. A later candidate check can therefore report only those expected generated-view differences; this is distinct from executed runtime proof.
- `node scripts/edition-authoring/cli.mjs lock`: exit 0, run last after source/contract/view work. `node scripts/edition-authoring/cli.mjs check`: exit 0, including again at the pushed head.
- Migration ledger: none; no migration file or schema changed.
- `git diff --check`: exit 0. Candidate author/committer/trailer inspection passed for all three commits. The added product text has no credential-shaped matches. The full Base COMPLETE NEW0 publication scan is unavailable in this cloud and remains the fleet Mac lander's required gate, as directed in the cloud brief.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock/0 + check/0; views=node scripts/contract-docs.mjs write --clauses FIELD-003/0 + check --clauses FIELD-003/0, then restored from main; ledger=none.

## Clause and count custody

FIELD-003 stays **PARTIAL**. Main's newer point-1 qualification and point-2–6 pending judgments were preserved. The original family's full six-point acceptance, Base duties, inheritance, frozen checks and required independent Opus judgment remain binding and unawarded on this new SHA. The original source's DONE proposal is not reused as acceptance.

| Reference | Published done/partial/missing | Target done/partial/missing | All done/partial/missing/total |
| --- | --- | --- | --- |
| Original source, unawarded proposal | 2/11/0 | 6/215/29 | 8/226/29/263 |
| Comparison main | 2/11/0 | 5/216/29 | 7/227/29/263 |
| Fixed candidate | 2/11/0 | 5/216/29 | 7/227/29/263 |

No other status, gap, evidence or provenance row changed. No test registration was added, deleted, skipped or weakened relative to the required original source. Touched registered checks remain one service-report API registration and the one portability assert script; no new corpus or full local suite was introduced. No UI changed, so no fresh UI/browser proof is claimed. The original browser assertions and six-point proof remain in the product source for the independent re-gate.

## Risks, independent gates and terminal results

Historical manual grants require their real native issuance event and matching saved command; missing or privacy-erased provenance stays unavailable. Existing explicit issuedBy integration/native behavior and automatic notice issuance remain governed by the original source's gates. There is no provider qualification, delivery or independent acceptance claim.

The fleet retains original-family affected re-gate, independent Opus acceptance, generated-view landing, COMPLETE NEW0 publication scan, exact-final executed runtime Verify, guarded main equality and exact-main Run site. No submission, landing, default-branch push, tag, release or deployment occurred here.

Final CI and terminal custody are recorded below. `PLAN.md` holds the full plan; all selected report/receipt files live only in this evidence packet. Evidence transport is not product READY, acceptance or landing.


## Final exact-SHA Verify and blocker

Verify run **42119336230**, https://github.com/just-every/run-glove/actions/runs/42119336230, completed **failure** on exactly `5581612a468f79766add9b6334070c2227e3d931`. The plan and complete portable shard succeeded. Foundation failed only `Check generated contract documents`; its retrieved log names `ACCEPTANCE.md: generated content differs`. However, **API and browser both concluded cancelled during Run this shard**, independently of that step; full-push-proof was skipped and the aggregate verify job failed. This is not a completed green runtime wall and does not qualify as the generated-view-only exception. No new product assertion failure is alleged from the cancelled jobs.

The mandated one-time `gh run view --job ... --log-failed` reads for cancelled API (127567358539) and browser (127567358552) returned exit 0 with empty output. The final aggregate verify log command `gh run view 42119336230 --repo just-every/run-glove --job 127574990399 --log-failed` failed exit 1: `failed to get job: HTTP 401: Bad credentials (https://api.github.com/repos/just-every/run-glove/actions/jobs/127574990399)`. No log archive was obtained for that job. The launcher was refreshed and the decrypted-bundle Git setup repeated for evidence transport; no alternative credential was sought. Ten GitHub calls were used, including discovery and each log invocation; the exhausted budget and supplied no-rerun rule were preserved. No Verify dispatch, retry, rerun or no-op product commit was made.

**BLOCKED dependency:** the pushed exact SHA still requires successful API/browser runtime CI. Workflows/runtime pins are frozen and a SHA that already has a run may not be dispatched or rerun by this task. The fleet must resolve the cancelled required coverage through its authorized landing path. The requested repair itself passes the unchanged-data native upgrade proof, report API journey, typecheck, full portability journey and documented mechanics. All finished product work is durably pushed; this is a CI blocker, not a push rejection.

`ci-receipt.json`, `ci-jobs.json`, `ci-final.json`, the budget ledger and actual non-secret log excerpts contain the complete observed result. The cancellation cause was not supplied by the allowed failed-log reads and is not guessed here. Foundation runtime steps did not execute after the generator check failed; API/browser runtime success is not claimed. The independent original-family and Mac landing gates remain pending.

Requested model/effort: Sol/xhigh; backend selection was not independently verified. No PR was created. Evidence publication is report-only and does not signal READY or acceptance.
