# sx-glove-verify-artifact-1 report

Repository: just-every/run-glove
Branch: cloud/sx-glove-verify-artifact-1
Product head: fbe722edd702638d028db96e1d1cf6bd85c28fec
Origin main at candidate: a49572307a6e66f53dc1fd39b0260c2c5a1b6361
PR: none; the brief supplies the cloud branch to the fleet Mac lander.

## Result

The build upload and shard download both use `verify-build-${{ github.run_id }}`. The upload sets `overwrite: true`, allowing a full rerun to replace the same run's artifact. A failed-jobs rerun reuses the successful build job's artifact because the name no longer changes with the attempt.

The workflow diff has three insertions and two deletions. Its seven job definitions, steps, action pins, conditions, matrix, permissions, retention, archive paths and application commands remain as on main. A repository-wide hidden-file search excluding `.git` found six lines containing seven `verify-build` occurrences, all in this workflow. Only the two names changed; archive and directory references are unchanged.

The required source lock was generated after the workflow edit. Its sole diff is the SHA-256 for `.github/workflows/verify.yml`. No product code, tests, CONTRACT.md or generated contract views changed.

## Full plan and execution

1. Refreshed the fleet launcher and configured bundle-backed Git authentication, fleet identity, preserved commit hooks and the supplied toolchain. PLAN.md retains the original detailed plan.
2. Started from a fresh `--depth 1 --filter=blob:none` main clone, read AGENTS.md and the inline RULES.md, and created the named branch.
3. Found every artifact reference and made the two run-scoped names plus upload overwrite edit. Ran both documented workflow lint commands and diff whitespace validation.
4. Fetched main, committed using fleet identity and active cleanup hooks, checked every candidate author/committer and full message, then immediately pushed the first real commit 3db2d8b62c577eb8c1d7b4ec4249f2369182f746 with cloud-push.py.
5. Exact-SHA Verify run 42606664317 failed before building: its build job rejected the stale edition source lock, and its aggregate verify job failed because shards were skipped. Read each failed job log once using the prescribed gh archive command. This is a real lock failure, not the generated-contract-view exception.
6. Inspected the documented `changes` output, which identified only the intentional workflow edit. Fetched main and merged it (already up to date; no history rewrite), generated the source lock last with `node scripts/edition-authoring/cli.mjs lock`, and passed its `check`. Committed the one generated hash update as fbe722edd702638d028db96e1d1cf6bd85c28fec, rechecked both candidate commits and immediately pushed with the guard. The branch has two real commits and no empty/save commits, force pushes, main pushes or product evidence files.
7. Discovered exact-SHA Verify run 42608336503. Polling uses one watcher and minimum 300-second intervals including discovery, within the ten-call GitHub budget. Final state is recorded separately in final-ci-receipt.json when observed.
8. Saved the complete relevant non-secret report/receipt packet outside the product tree. Only explicitly selected regular report/receipt files are sent to the separate evidence/sx-glove-verify-artifact-1 ref. Credentials, environment dumps, symlinks and private gate material are excluded. Actual failed-job error excerpts are included; routine log environment metadata is not published.

## Validation and receipts

- actionlint 1.7.7 on all workflows: PASS (exit 0).
- `node scripts/verify-ci.mjs --check-workflows`: PASS (exit 0), every local reusable call grants requested permissions.
- `git diff --check`: PASS (exit 0).
- Source lock `changes`: exactly one intentional source edit, the Verify workflow.
- Source lock `lock` then `check`: PASS (exit 0), only its workflow hash changed.
- Every candidate author and committer: Run Edit Run fleet <fleet@runeditrun.com>; no trailers.
- Both product pushes: PASS on attempt 1, with actual sanitized push receipts.
- No application setup/build, typecheck, product tests or browser journeys ran; the brief limits local verification to workflow lint. Lock generation/check was necessary to repair the observed required CI failure.

The installed `/usr/bin/go` rejected `install`; actionlint was instead installed from its official release archive after verifying its published SHA-256. The supplied toolchain selected Node v24.19.0 and pnpm 10.12.4. No application dependency setup was needed.

## Before/after counts and clause status

- Attempt-scoped artifact names: 2 → 0.
- Run-scoped artifact names: 0 → 2.
- Upload overwrite setting: 0 → 1.
- Artifact matching lines: 6 → 6; literal occurrences: 7 → 7.
- Workflow job definitions: 7 → 7.
- Changed product files: 0 → 2 (workflow plus its generated source lock entry).
- Final diff: four insertions and three deletions, including the one-for-one lock hash replacement.
- Tests added/removed/modified: 0/0/0; registrations unchanged.
- Clauses changed or moved: 0. No clause claims apply to this infrastructure-only brief.

## CI and transport

Initial Verify: https://github.com/just-every/run-glove/actions/runs/42606664317 , head 3db2d8b62c577eb8c1d7b4ec4249f2369182f746, completed/failure; build source-lock failure repaired by the second commit. Failed jobs: build 129124389382 and verify 129124490310. Their error excerpts are retained.

Candidate Verify: https://github.com/just-every/run-glove/actions/runs/42608336503 , head fbe722edd702638d028db96e1d1cf6bd85c28fec. Discovery returned in_progress. Its observed final custody is appended below before return; only this SHA can establish READY.

The initial run's first status poll returned HTTP 401 Bad credentials and no CI conclusion. After a 15-second backoff the launcher bundle was refreshed and the fleet Git setup reinstalled. The next permitted poll succeeded. No alternative credential was searched for or used. Later status reads refresh/reinstall the required setup before use to conserve the API budget.

## Publication and limitations

The fleet Mac owns the required public-tree publication scan and landing; this cloud VM cannot run that fleet scan. Product branch custody, exact-SHA CI and report-only evidence transport remain separate. Evidence publication never asserts acceptance or landing. This round does not manually dispatch or rerun duplicate Verify runs, and does not claim observed failed-jobs-rerun execution: its configuration change and lint cover the requested scope.

No unresolved product blocker remains on the corrected candidate. The final CI outcome is below; the exact EVIDENCE line in the terminal return records report transport independently. The clone is retained until CI and evidence publication finish, and removed only after successful product/evidence preservation.

## Final outcome

Product head fbe722edd702638d028db96e1d1cf6bd85c28fec is pushed to cloud/sx-glove-verify-artifact-1. Verify run 42608336503 completed/success on that exact head, observed 2026-11-09T11:36:48.965566+00:00. Both required local workflow checks and the generated lock check passed. Ten of ten budgeted GitHub invocations were used, including one HTTP 401 status read and the two prescribed failed-job archive reads for the initial candidate. No duplicate Verify dispatch or rerun was requested.

READY branch=cloud/sx-glove-verify-artifact-1 head=fbe722edd702638d028db96e1d1cf6bd85c28fec

Clause changes: none. No PR was created. Publication scan and landing remain the fleet Mac's gates. The complete explicitly selected packet is published through cloud_evidence.py to the separate refs/heads/evidence/sx-glove-verify-artifact-1; the terminal EVIDENCE line is the transport receipt and does not signal product acceptance or landing. The original clone is removed after successful packet publication, retaining the reports and product provenance.
