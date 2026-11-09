# sx-glove-c-f221-pc1 report

Repository: just-every/run-glove.
Branch: cloud/sx-glove-c-f221-pc1.
Candidate head: f6897f8d65633c3afce4755dd1243439e6ca7e7c.
Original candidate: 7296b84ca02cda60b41642ccae13f8bfcfd998a8 (verified exactly).
Merged main: a81559508ceab2126d0259be3a06afb7f647ec77.

## Plan and scope

See PLAN.md for the full execution plan. The work is the requested single continuation merge: retain the existing privacy implementation, merge current main, regenerate the source lock, run touched checks and observe a fresh exact-SHA Verify. No additional product work, claim promotion, test weakening, history rewrite, default-branch push or landing is authorized or performed. No PR rule is declared in AGENTS.md; the named branch's push workflow is the pre-main verification entry point.

## Merge result

The two parents are the exact published candidate and fetched main. Only sources.lock.json conflicted; it was regenerated from the merged sources after setup. CONTRACT.md, docs/contract/ID-MAP.json, ACCEPTANCE.md and docs/CLAIMS.md match main byte-for-byte. Contract generation and check used --clauses COMM-001 to carry main's newer judgment, then both generated views were restored from main. Setup's blank-line-only route generator output was restored to main's canonical src/routeTree.gen.ts before locking. There are no migration changes or numbering collisions. All source CLAIM lines are unchanged from the published candidate. No tests were edited.

The final diff from main contains the candidate's existing privacy changes in costing, privacy import custody and erasure; API/native-browser/archive qualification fixtures; and the regenerated source lock. merge-receipt.json records the complete file list, parents and preservation assertions.

## Clause statuses and counts

DATA-001 stays PARTIAL; no candidate clause claim changes. Main's existing COMM-001 PARTIAL → DONE judgment is retained without modification. Compared with the original candidate, totals change from 41 done / 193 partial / 29 missing / 263 total to 42 done / 192 partial / 29 missing / 263 total. Compared with fetched main, counts and clause statuses are unchanged. Target-and-push-further counts are 38/183/29 → 39/182/29; published counts remain 3/10/0. Qualification results are evidence, not an automatic promotion of DATA-001.

## Local results

- Dependency install: pnpm install --frozen-lockfile — passed.
- Setup: cloud_run npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive — passed, including production build and temporary-Worker shutdown.
- Contract generator write/check --clauses COMM-001 — passed; zero generated document changes.
- Typecheck: cloud_run pnpm typecheck — passed.
- Source lock: node scripts/edition-authoring/cli.mjs lock, then check — passed.
- First-party checks: cloud_run pnpm exec rer check --profile first-party — passed.
- Privacy API: cloud_run node --test --test-concurrency=1 tests/api/privacy.test.mjs — passed (1 test, 0 failures, 361310.576144 ms); includes all native privacy, peer preservation and archive-fence scenarios. This run started on the exact merge tree before the merge was committed; no tested source changed before commit.
- Browser privacy: blocked before assertions. The first concurrent attempt failed during fresh setup; a sequential retry under Node 22.20.0 passed setup but failed during rer dev. Both hit the application listener-handshake readiness deadline. Actual complete logs are privacy-browser-first-attempt.log and privacy-browser.log. No screenshots or browser pass are claimed.
- Complete portable CLI export/restore: blocked before archive assertions at calendarRestore fresh setup, with the same listener-handshake readiness failure (portable-first-attempt.log and portable.log). It was run once. A second full run was not started after the sequential browser retry reproduced the runtime blocker.

The supplied toolchain script was used. rer selected its exact Node 22.20.0 runtime; the direct pnpm typecheck and Node test launcher used the VM Node 24.19.0 as permitted by the supplied script's minimum-version selection, with pnpm 10.12.4. The typecheck's engine warning is preserved in the actual log. The sequential browser retry explicitly selected the cached Node 22.20.0 runtime. Headless browser execution was configured for /usr/bin/chromium and the repository's --no-sandbox launch option; assertions were not reached. No new UI or test assertions were introduced; the existing privacy tests retain their 1440 and 390 coverage.

## Publication and custody

All ten candidate commits, including side parents, passed fleet author/committer and trailer checks. The product tree is clean. The complete actual logs and receipts are selected explicitly for the report-only evidence ref; no environment dumps, credentials, symlinks or private gate material are selected. The fleet's independent publication scan and landing remain on its own machine.

Product push: not attempted because required local browser/portable checks did not pass. The finished one-commit merge remains in the clean product clone and in the verified recovery bundle below. No push rejection or HTTP error occurred.
Exact-SHA Verify: no run requested or observed because the product branch was not pushed. CI run IDs: none. No PR created.
Evidence publication: performed after finalizing this report, separately from product custody.
Blocker: the unchanged pinned rer 0.2.87 runner failed to receive the Vite listener handshake within its hard 60-second deadline. This recurred after removing concurrency and using the exact Node runtime. The cap is enforced in @runeditrun/rer/onboarding/adapter.mjs with Math.min(timeoutMs ?? 60000, 60000). The source checkout's setup did pass, but the fresh browser installation's subsequent dev start did not. No product assertion has established a privacy regression; these incomplete checks still prevent a local pass, product push and READY. Fixing or bypassing the runner, changing tests or weakening readiness is outside this merge-only brief.

## Recovery

Verified incremental bundle outside product clone: /home/agent/rer-consolidation/work/push-rescue/sx-glove-c-f221-pc1-f6897f8d6563-incremental.bundle

SHA-256: 13b4b12cc6f2bdf137e53ef7bdc7b8fcdcf2d9898b0785d18af97b40bc4f372f

Head: f6897f8d65633c3afce4755dd1243439e6ca7e7c

The incremental bundle contains all ten candidate commits and requires existing main history. bundle-verify.log lists its exact prerequisites. recovery-receipt.json records verified identity and size. Preserve this VM/clone and retrieve the bundle before the VM retention period ends. The bundle is recovery data, not a push, READY signal or acceptance proof. No published history was rewritten.
