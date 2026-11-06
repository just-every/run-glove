# sx-glove-f99fix1

Outcome: blocking B is fixed and locally verified in the pushed product candidate. Exact-SHA Verify is still in progress. PLAN-012 remains PARTIAL.

Repository: just-every/run-glove
Branch: cloud/sx-glove-f99fix1
Candidate: 1c405502503397445caf1faaa9dff071023e0e44
Rejected feature candidate: 3116829b5277b1e8b40119a989054c5fc5653860
Compared main: 786ecbc4d54e2125f3e96589ecc40f57962825ee

## Scope and plan

The FIX-round override limits this run to current-branch privacy of retained billing-command replay. No other acceptance point, follow-up or campaign remainder was taken.

1. Read the launcher and repository instructions, PLAN-012, relevant API documentation, inline builder rules and DONE riders. Trace command admission, branch projections, retained recurring review construction, durable command outcomes, erasure and direct replay callers.
2. Preserve the rejected feature's existing Office PO review and assertions while bringing it onto current main without rewriting its published commits. Reproduce the reported disclosure through the production Worker command door using native authentication and disposable migrated D1.
3. Enforce current branch scope at the durable replay boundary, following the existing whole-outcome NOT_FOUND precedent. Extend the existing recurring journey without adding a test registration or weakening any assertion.
4. Run focused API journeys, typecheck, first-party check, contract generation and source-lock checks. Compare an identical independent runtime probe on the rejected head, main and the exact fixed candidate. Review for surviving bypasses and compatibility regressions.
5. Push only the named product branch using fleet identities and the cloud push guard. Record exact-SHA branch CI and relevant browser proof. Publish this report and actual receipts separately on the evidence branch; leave publication scanning and landing to the guarded fleet lander.

The source, reproduction, focused checks and product push are complete. CI and browser command observations are recorded below and in receipt.json.

## Diagnosis and minimal change

The command handler authenticates the current person and checks the command role before calling saved() in ./src/glove/storage.ts. Both ordinary replay and the concurrent-commit recovery path use saved(). First execution runs inside inBranch(), and the recurring review GET uses branchState().

The candidate adds retained draft PO-refusal rows to recurringBillingDue(). Its series.billingRun outcome has a missed array containing jobId, invoiceId, invoiceNumber, an optional visitId and the refusal code and message. The replay boundary checked top-level records, named nested records and batch results, but never checked this missed array. A previously unrestricted Office person could therefore replay the original command after branch restriction and receive the now-hidden invoice identity and PO diagnostic.

The fix adds four lines in ./src/glove/storage.ts. For series.billingRun only, every populated jobId, invoiceId and visitId in the retained missed rows must exist in current branch-scoped records. Any hidden reference refuses the entire outcome with the existing NOT_FOUND response and HTTP 404. The durable outcome is neither filtered nor regenerated. Occurrence keys and line-item identifiers are not treated as record roots.

The only new product-fix edits beyond the rejected feature are ./src/glove/storage.ts, additional assertions in ./tests/api/recurring-billing.test.mjs and the regenerated ./sources.lock.json. The original feature's API documentation, contract Evidence and Gap, recurring projection, Office UI and browser journey were preserved by a merge with its published head. No workflow, Base pin, provider authority, acceptance sentence or generated view was changed by this fix.

## Public-door reproduction and validation

The existing monthly recurring-approval sanity journey now checks a real Office session with a retained PO-required draft. Main-only scope still replays its own result unchanged. Moving the same person into a distinct branch makes a fresh review empty and refuses replay of the original command without any hidden identity, occurrence key or PO diagnostic. Full business export comparison proves the refused replay changes no domain records or Activity. Removing the branch restriction restores the original durable outcome. Existing role withdrawal, financial approval, audit, erasure and no-provider-effect assertions remain intact.

Before the patch, that added branch assertion failed: HTTP 200 did not equal the required 404. See reproduction.log.

The separate identical probe in probe-b.mjs ran through POST /api/glove/commands on three actual checkouts:

- Rejected 3116829b5277b1e8b40119a989054c5fc5653860: exit 1; HTTP 200, one retained review row, hidden identity or diagnostic present.
- Main 786ecbc4d54e2125f3e96589ecc40f57962825ee: exit 0; HTTP 200, zero review rows, no hidden information.
- Fixed candidate 1c405502503397445caf1faaa9dff071023e0e44: exit 0; HTTP 404, NOT_FOUND, no hidden information. Repeated after a real Worker restart with surviving D1. Same-branch and restored-authority replays remain equal to the original outcome; refused replay changes no records or Activity.

PROBE B: Office replays series.billingRun with its original commandId and empty payload after restriction to a different branch -> HTTP 404 NOT_FOUND, no hidden invoice or PO diagnostic; same result after Worker restart. Valid same-branch replay remains unchanged.

Validation gates:

- Focused recurring and branch API files: 5 tests passed, zero failures. This includes successful Office PO correction and approval of the original draft, current-role and branch refusals, erasure, historical dates, concurrent replay and financial effects. See touched-tests.log.
- pnpm typecheck: exit 0. See typecheck.log.
- npx -y @runeditrun/rer check --profile first-party: exit 0. See rer-check.log.
- Contract generator write and check with --clauses PLAN-012: both exit 0. Generated views were then restored whole from origin/main, and neither was committed. See views.log.
- Source lock regenerated last with the documented command, then check exited 0. See lock.log.
- git diff --check: exit 0. Every parent retains all 263 Status rows; the whole-contract table line count remains 474.
- Independent read-only boundary investigation and one independent bypass review found no concrete remaining route or regression in scope. Their conclusions are in review.md.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses PLAN-012 then check --clauses PLAN-012 exit=0, generated views restored from origin/main; ledger=none exit=0.

No additional test registration was added. No existing assertion was removed, narrowed, skipped or moved behind a width or branch condition. The privacy assertion is unconditional. The existing erased-result tombstone and the optional-reference forms remain supported. The change introduces no outbound action, money movement, automatic approval or credential authority.

## Contract and custody

PLAN-012: PARTIAL -> PARTIAL. No acceptance point was promoted to DONE. The rejected candidate's native point 2 retained-PO-review qualification and its honest remaining Gap were preserved. No plan row was changed beyond carrying that same partial evidence. No further ct ruling was needed for denying hidden-branch disclosure.

Counts before and after: 7 DONE, 227 PARTIAL, 29 MISSING, 263 Status rows. DONE-RIDERS 1 through 11 are not newly claimed: this is a bounded privacy repair with no DONE flip. Existing policy, provider and broader acceptance holds remain.

The product branch has one new merge commit and preserves the rejected feature's two published commits as side ancestry. Every candidate author and committer was checked, including side parents; all use the fleet identity and no co-author trailer. The first and only product push succeeded on attempt 1 through cloud-push.py. No main push, force push or PR was used. The branch push starts Verify directly.

Verify: run 42149080635, push event, exact head 1c405502503397445caf1faaa9dff071023e0e44, initially in progress. Final observation is recorded in receipt.json and the CI result file. No claim is made about a different SHA.

Run site and the full-history publication scan are guarded fleet landing gates and were not run in cloud. No scan completeness or landing is claimed. The generated-view freshness difference is expected because the lander owns those generated files. The exact candidate command node src/base/contract-docs.mjs check exits 1 only with “ACCEPTANCE.md: generated content differs; run contract-docs write.” Generator write and check had both passed before the required restore. This is the explicitly permitted cloud-candidate exception; see expected-view-check.log. The exact committed source-lock check passes.

## Browser and final observation

The existing recurring browser journey passed on the exact committed tree: 1 journey, exit 0, 26.2 seconds of Playwright execution. It covers the Owner rule, proposed monthly draft, changed future pricing, late approval and pauses at both widths, followed by the Office retained-PO review, original draft and successful approval at 1440 and 390. Sixteen actual screenshots are retained under ./screenshots and published with this packet. The Office PO-review screenshots at both widths were visually inspected. No product source changed after the successful touched checks.

The first browser attempt ran no assertions: the default bundled Playwright executable was unavailable. The corrected command selected the prescribed /usr/bin/chromium using the repository's existing executable-path option and existing no-sandbox launch argument. The identical browser journey then passed; no code or assertion was changed to repair the environment.

Pre-ready self-check: the privacy trigger fails on the rejected head and passes on the exact fixed head; valid replay and Office approval remain intact; no assertion was weakened; branch withdrawal and erasure are exercised; no new UI control or policy authority was added; the exact committed source lock is fresh. Publication scanning, Run site and guarded landing remain fleet-owned and unclaimed. Evidence publication is separate from product readiness and landing.

Final CI observation at 2026-11-06 02:25 UTC: run 42149080635 remains in_progress with no conclusion on exact head 1c405502503397445caf1faaa9dff071023e0e44. Discovery and two status reads used three GitHub calls, with at least 300 seconds between reads. No workflow was dispatched or rerun. No failed assertion or completed red run was observed. The cloud CI-wait allowance is exhausted; product custody is PUSHED pending this existing run, with no green or landing claim. There is no local product blocker.

PR: none; branch push is the workflow entry point. Full-history publication scanning and Run site remain guarded fleet landing gates.

Terminal product custody: PUSHED branch=cloud/sx-glove-f99fix1 head=1c405502503397445caf1faaa9dff071023e0e44.

Lane relay: sx-glove-f99fix1 fixes only current-branch billing replay privacy. PLAN-012 remains PARTIAL; counts remain 7 DONE, 227 PARTIAL, 29 MISSING. Candidate 1c405502503397445caf1faaa9dff071023e0e44 has five passing API journeys, typecheck, one passing browser journey at 1440 and 390, and the exact-head public probe. Verify 42149080635 remains in progress. No plan remainder was taken.
