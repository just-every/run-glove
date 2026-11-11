# sx-glove-pricebook-fields-1 report

Repository: just-every/run-glove
Product branch: cloud/sx-glove-pricebook-fields-1
Base: 26ff9e2042a685e409e262fe6ceca9b25b70af0c
Product head: 5f69e7993d7412aa396bc8b524bdd2957ca4bcf6
PR: none; this task returns the named branch to the fleet lander.

## Result

The shared service.save handler now reads the current item and overlays the fields supplied by the caller before ordinary field validation. Both desk commands and glove.pricebook.update use that handler. Creates retain their defaults, and explicitly supplied empty arrays/strings, zero costs and false archived state still apply. Role checks, stale revision checks, duplicate-code checks, native repricing and existing Activity behavior remain in their existing paths. No held approval summary was changed.

The existing tests/agent-native-parity.mjs#pricebookParity regression now uses two richly populated markup-priced, tax-free, archived materials and a dependent flat-rate task per door. With only the schema-required id, code, name and unchanged unitPrice supplied, the business change is the name. Each door must retain pricing=markup, unitCost=7.00, tax=FREE, category, unit=box, description, checklist, required skills, supplier parts and archived=true. Each dependent task must keep its exact record and version, including its 21.00 price. All other catalogue records must remain exact. A further explicit edit through each door checks named clears and archived=false still apply.

## Before and after evidence

The same updated parity helper was executed as a non-browser test against the baseline emitted production Worker and then the fixed emitted production Worker. The disposable driver uses the released rer hosted Worker harness, actual native owner bootstrap, signed Business owner binding and policy adoption, and actual HTTP desk/MCP doors. It makes no database fixture writes and substitutes no native role or price-book handler. Its actual source is included as non-browser-parity-driver.mjs; /tmp/glove-pricebook-parity.mjs is the executed copy. The helper remains wired into the existing native agent journey for normal Verify.

Before the fix the literal assertion failed with pricing=fixed, unitCost=0.00, tax=TAXABLE and taskTotal=0.00. The failure is retained in before-fix.log. After the fix the same helper passed once, including all existing read/edit/category/adjustment, Activity, stale and duplicate checks, all omitted-field checks and explicit-clear checks (after-fix.log).

The former omitted-field portion of pricebookParity compared the two reset field lists and described reset parity in its success message. It has been replaced with literal preservation expectations under the task's decision. No existing test registration or scenario was removed or weakened.

## Validation and custody

- Repository setup and the fixed production build completed successfully through cloud_run with the repository-pinned rer version (0.2.87).
- Typecheck passed once after the fix.
- The touched non-browser parity helper passed once after the fix, following the expected failing baseline run.
- node scripts/contract-docs.mjs check passed with current documents.
- sources.lock.json was regenerated last using node scripts/edition-authoring/cli.mjs lock; its check returned ok=true.
- rer check --profile first-party passed (exit 0; no stdout).
- Test inventory is unchanged: 194 registrations plus four assertion scripts, 198/200 before and after.
- git diff --check passed; the final product checkout is clean.
- Local browser suite runs: zero. Local portable suite runs: zero. This change has no screen/UI edits.
- Only the handler, existing parity helper and source lock are committed. CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and the generated route tree match origin/main. Fleet evidence remains outside the product tree.
- The first real commit was immediately pushed through cloud-push.py, successfully on attempt 1. Its author and committer are both Run Edit Run fleet <fleet@runeditrun.com>; its full message has no co-author trailers. No history was rewritten.

## Clause judgments and counts

No clause status, Gap, Evidence or wording changed. SURFACE-015 remains done. Its existing legacy Evidence prose was retained as instructed, including its historical reset-parity phrase; this report records the new behavior without editing contract judgments.

| Tier | Before done/partial/missing | After done/partial/missing | Total |
| --- | --- | --- | --- |
| Core | 45 / 176 / 16 | 45 / 176 / 16 | 237 |
| Agent surface | 1 / 12 / 13 | 1 / 12 / 13 | 26 |
| Full target | 46 / 188 / 29 | 46 / 188 / 29 | 263 |

## CI

Verify push run 43000536001 is for the exact product head above:
https://github.com/just-every/run-glove/actions/runs/43000536001

The REST discovery and timestamped polls are retained separately. Terminal outcome will be appended after the single watcher finishes. Ten-call GitHub API budget applies; polling is no faster than one call per 300 seconds including discovery. No green result from another commit is accepted.

## Plan

The complete executed plan is in PLAN.md. No missing ruling or account was needed; the brief's stated field-preservation decision was applied. Product custody and report-only evidence publication remain separate from acceptance or landing.
