# sx-glove-c-f259 — native price-book attribution

Product repository: https://github.com/just-every/run-glove
Product branch: `cloud/sx-glove-c-f259`
Product head: `4094bbf237dd15284cf86f7ae3d5048f6644e944`
Base main after final merge: `7ed9291267dafdd0ed87eaab829eb7af547269a9`
Initial main before concurrent fleet restoration: `26ff9e2042a685e409e262fe6ceca9b25b70af0c`
PR: none; Verify has a branch-push entry point.

CLAIM SURFACE-021 PARTIAL points=1 tests=tests/agent-native-attribution.mjs#pricebookAttribution; tests/agent-native-attribution.mjs#afterAttributionStep

GAP SURFACE-021: Point 1 is qualified for the declared autonomous and held standard-review price-book operations. Actual named-company-approver execution remains the SURFACE-020 Base harness proof gap. Native human approval and Undo are undeclared because this subset registers neither operation; it registers no mail tool. Client-bearing tools remain closed under SURFACE-001 to SURFACE-013 pending Base client custody, agreed redaction and the atomic erasure fence. Existing account, policy, provider and runtime-pin holds remain unchanged.

No new policy default was adopted. No release, production deployment or landing was performed.

## Plan and outcome

The full work plan is in `PLAN.md`. The target was mapped to its single acceptance sentence and inherited BASE-AGENT-008 duty, then qualified through the existing default native journey and its existing afterStep hook. The supplied SURFACE-015 candidate has already landed: the parity helper and its journey integration on main are byte-identical to `origin/cloud/sx-glove-c-f254`. Work began on that main without duplicating or rewriting the published candidate commits.

The added focused helper uses only the native commands, Activity, state, business export and agent roster public doors. Every agent call uses the journey's supplied tool helper. It performs existing-item update, category markup with a real repriced item, and fixed-price adjustment, then edits the same item as the signed-in Owner. It reads nonempty timelines and changed records, their versions and updatedBy, and checks registered identities. The existing afterStep hook checks each mutation under both autonomous and held standard review and performs a same-item Owner edit after the adjustment in each phase.

The reproduction exposed a seed projection defect: persisted event data and the business export contained preparedBy and approvers, while Activity omitted them. Only `src/glove/activity.ts` was repaired, selecting the two stored fields and decoding them into the current visible event projection. The existing event actor label and role, native sponsor id, record visibility, record storage and export format are retained. Native actorId and updatedBy remain native-person foreign keys; the linked record-change event separately identifies the agent by its own id and name and its sponsor by native id and name. A human edit has no agent preparer or fabricated approver. No Base runtime file was edited.

The browser proof reaches the disposable production Worker with its synthetic native Owner session, confirms that Owner's native first-run form, then opens Activity. The initial browser attempt exposed an uncompleted first-run redirect: Playwright does not intercept the redirected request as another routed navigation. Completing the real public setup form fixed the proof transport; it did not require a production workaround. The final proof shows the exact label at 1440 and 390. Both contexts and browsers close in finally blocks. `tests/agent-browser-proof.mjs` is unchanged.

## Failure before repair and proof after repair

Before repair, `node node_modules/@runeditrun/rer/cli/agent-door.mjs .` exited 1. The precise failure was `Activity preserves the separate registered agent and native sponsor`, with actual `undefined` and expected the registered agent and Avery Chen as distinct identities. Both autonomous and held phases failed this assertion. The run finished with 564 of 567 points passing; failing phases stopped early, so fewer calls and checks ran than on the passing journey. The full non-secret output is `attribution-before.log`.

After repair, the same runtime command exited 0 with 756 of 756 conformance points passing. BASE-AGENT-009.1's exact audit-call checks pass. The final committed candidate passed the complete targeted foundation shard with an explicit captured shell exit of 0 in `foundation-exit.json`, including build, `pnpm run check --profile first-party`, typecheck, runtime, email-link sign-in, run-site links, hosted output, hydration and agent conformance. The source Node pin is 22.20.0, pnpm 10.12.4, rer 0.2.87; the commands ran under Node 22.20.0 selected from the verified rer runtime cache. The cloud toolchain's default Node 24 was overridden for these proof commands. Browser automation uses `/usr/bin/chromium` with `--no-sandbox`.

The first final-head run printed `verify: complete (exit 0)` but the execution session returned 1. The identical foundation command was repeated with an explicit shell exit receipt and returned 0 with 756 of 756 conformance points. Both outputs are retained as `foundation-first-final.log` and `foundation.log`; no source or test was changed for the repeat.

Additional existing record-trail regression coverage passed: `node --test --test-concurrency=1 tests/api/records.test.mjs`, 2 passed, 0 failed. The complete test inventory is 194 registrations plus 4 assertion scripts, 198 of the cap of 200, unchanged by this helper. No test registration, assertion, pin, threshold or existing proof was deleted, narrowed or moved behind a condition.

## Acceptance and inherited-duty rubric

This is a bounded qualification, not a whole-clause DONE claim. Each row is bound to the product head above. Local PASS means executed in the candidate foundation shard; the separate CI receipt records the branch Verify event and conclusion.

| Row | Acceptance sentence, inherited duty or requested outcome | Public-door proof on this candidate | Result |
| --- | --- | --- | --- |
| A1 | SURFACE-021 point 1: read changed native Activity and exported record with agent and sponsor distinct | `tests/agent-native-attribution.mjs#pricebookAttribution`, lines 151–186; `agentEvent`, lines 39–58; `exportedItem`, lines 62–68. Real update, markup and adjustment, nonempty records and exact 22.00, 18.00 and 24.20 outcomes. | PASS for current subset |
| A2 | Point 1 conditional: an actual company approver remains separate | No approver exists in autonomous or standard-review execution. Empty stored approvers are checked at lines 52 and 57 under both policies. The supplied Base harness cannot exercise the standard-class named-approval variant. | UNMET-EXTERNAL for actual named approval |
| B1 | BASE-AGENT-008 truthful attribution: agent own id and name, native sponsor id and name, never the person's own act | `agentEvent`, lines 39–58; roster at `/agents/api/agents`, Activity at `/api/glove/activity`, timeline in `/api/glove/export`. | PASS |
| B2 | A later desk action is only the person's act; it does not relabel earlier agent acts | `ownerEdit`, lines 71–89; native `service.save` of the same item, actor role and identity, exported updatedBy and absence of agent metadata. Prior events are reread. | PASS |
| B3 | Autonomous and held standard review fabricate no approver | `afterAttributionStep`, lines 96–114, called additively from `tests/agent-native-journey.mjs#afterStep`, line 72. All three calls in each policy are reported in foundation output. | PASS |
| B4 | Category and adjustment identify their affected exported records | Lines 104–111 and 170–184; real markup-dependent and fixed-price items, corresponding recordChanges and current exported versions. | PASS |
| B5 | Existing exact audit-count obligation, BASE-AGENT-009.1 | All added MCP calls go through supplied tool at lines 159–162; candidate foundation reports `PASS BASE-AGENT-009.1.events-audited` and 756 of 756 conformance points. | PASS |
| B6 | Owner Activity screen at both widths | `activityProof`, lines 117–147; saved `activity-1440.png` and `activity-390.png`. Visible agent-for-person label at both widths; overflow assertion at 1440. | PASS |

## DONE-RIDERS review

| Rider | Result on this candidate | Evidence or boundary |
| --- | --- | --- |
| 1 | PARTIAL | Native declared outcomes execute and are read back in the candidate foundation shard; actual standard-class named approval remains the explicit Base proof gap. A1 and A2 above. |
| 2 | PASS for native scope | Nonempty seeded records, exact hand-calculated prices, separate registered identities and a real subsequent Owner edit. Existing refusal coverage is preserved. |
| 3 | Local PASS; exact-SHA branch CI PENDING | Default helper is awaited at `tests/agent-native-journey.mjs:47`; afterStep integration at line 72. Foundation executes rer verify and its native conformance. The final candidate CI status is recorded in `ci.json` and `ci-status.json`. Push Verify 43002022587 remained in progress at the 10:26:58 UTC status read on the exact final SHA, with no conclusion. Eight of the ten GitHub calls have been used; terminal custody is PUSHED, not READY. The fleet must finish observing exact-SHA Verify before any landing. Run 43000933328 belongs only to the earlier published head and is never treated as final candidate proof. Earlier API reads failed with a malformed response and a TLS handshake timeout, without an HTTP status supplied by gh; the bundle was refreshed and final-head discovery recovered. |
| 4 | PASS | Foundation and both Activity captures ran on the committed product head. Earlier failing and passing logs are preserved separately. |
| 5 | PASS, INSPECTED | `CONTRACT.md:3286` cites BASE-AGENT-008. No contract text changed. |
| 6 | PASS for generator; judgment deferred | Document write and check pass, then both views are restored from main. No Status, Gap or Evidence cell changed. Counts remain the merged main's: 47 DONE, 187 PARTIAL, 29 MISSING. |
| 7 | PASS, INSPECTED | No acceptance sentence, clause id or coverage obligation changed. |
| 8 | PASS for touched native scope | Current Owner public session is required for the reads and desk edit. Existing conformance refusal, Pause, replay, argument-conflict and stale-revision assertions pass and remain unchanged. The projection makes no authority mutation. |
| 9 | PASS for honest boundary | No provider, mail, legal, real-person approval or client-custody proof is claimed. Existing holds are retained in the GAP line. |
| 10 | PASS, not applicable | No policy default or authority widening was introduced. |
| 11 | PENDING fleet lander | Product is branch-only. Main equality, COMPLETE publication scan with zero findings, exact-SHA branch Verify and any resulting Run site remain the guarded fleet's gates. |

## Pre-ready review

1. Public-door attribution assertions fail on the original projection and pass after repair. Full targeted foundation passes on the committed candidate; exact-SHA branch CI is reported honestly in `ci.json`.
2. Existing assertions are retained. The new helper does not count as another registration; inventory remains 198 of 200.
3. No credential, erasure, replay or retention mechanism was changed. Existing native conformance replay, revocation, Pause and unchanged-state refusals pass; no client-bearing operation was opened. The already role-filtered projection adds only the existing stored agent and sponsor metadata of visible events.
4. No screen code or styling was changed. Owner Activity is captured at both widths. The Activity download, load-earlier control, changed-record disclosures and shared mobile menu have text labels; there is no new icon-only control or configuration flow.
5. Source lock is fresh. Publication scan is deferred to the fleet; no COMPLETE or zero-findings claim is made here. Added product text contains no email-shaped value or new provider credential fixture. No homepage copy, branding, workflow, package pin, agent manifest, parity helper or Base-copy inventory changed.

## Mechanical and runtime probes

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses SURFACE-021 then check --clauses SURFACE-021 exit=0; ledger=none exit=0

Both generated view files were restored using `git checkout origin/main -- ACCEPTANCE.md docs/CLAIMS.md`. The generator wrote zero files because main's source and views were already aligned. No migration changed. The lock was generated after the last source and test edit and the final main update.

PROBE SURFACE-021 1: admitted glove.pricebook.update, glove.pricebook.category and glove.pricebook.adjust, followed by native Owner service.save; GET /api/glove/activity, GET /api/glove/export and GET /agents/api/agents -> separate matching agent and native sponsor identities, no company approver under autonomous or standard review, exact exported changed record and updatedBy, later human act attributed only to the Owner.

## Custody and plan row

The named branch was pushed at its first real commit and again after the final strengthening through the supplied cloud push guard, each on attempt 1 with exit 0. Final attribution review strengthened afterStep to select the latest matching act before checking its role, and category events now identify the current business revision. This prevents an older correctly labelled event from hiding a new mislabelled act. Both published histories are retained. Every candidate author and committer was checked independently and is the fleet identity; there are no trailers. The candidate commit message has no CI-skip marker. Main was fetched and the unpublished work rebased before the first commit. Before the final commit, newly updated main was merged without rewriting published history. The concurrent COST-001 judgment restoration and its generated views were kept whole from main; then the views were checked and restored from main, and the source lock was regenerated last. The product diff contains only the Activity projection, attribution helper, additive journey integration and regenerated source lock.

Before and after this candidate relative to the merged main: 47 DONE, 187 PARTIAL, 29 MISSING, total 263. Initial checkout counts were 46 DONE, 188 PARTIAL, 29 MISSING; the separate fleet COST-001 restoration moved one PARTIAL to DONE in main during this task. Our target and count delta remain zero. SURFACE-021 stays PARTIAL; its native point 1 qualification is the only plan-row result to relay. No source status row or full plan was edited or rebuilt. The actual plan, full logs, structured receipt and screenshots stay in this report-only packet and are published only to `evidence/sx-glove-c-f259`.

Exact-SHA publication scan receipt: commit=4094bbf237dd15284cf86f7ae3d5048f6644e944 complete=unestablished historyScanned=unestablished findings=unestablished; the fleet lander must run its own full-history scan. The candidate is not equal to main and is not landed. Initial base main's Verify 42998019060 and Run site 42998019057 are successful on the initial base SHA 26ff9e2042a685e409e262fe6ceca9b25b70af0c; these are baseline context only and are not claimed as candidate proof.

Terminal CI and evidence return: Verify run 43002022587, event push, status in_progress, conclusion null, head 4094bbf237dd15284cf86f7ae3d5048f6644e944. GitHub budget used: 8 of 10 calls. The product is PUSHED and ready for continued fleet observation, with no CI-green or READY claim. The report-only transport was independently fetched and its manifest and every selected file hash verified; the actual receipt is `evidence-fetch-first.json`. The final evidence publication adds this last CI status and preserves the complete relevant packet.
