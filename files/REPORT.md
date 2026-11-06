# sx-glove-ci-critical-path-1

Repository: just-every/run-glove
Requested product branch: cloud/sx-glove-ci-critical-path-1
Product head: unavailable; no clone, branch, commit or push exists from this task.
PR: none. New CI run IDs: none. GitHub REST/log API calls: zero.
Disposition: bootstrap authentication failure; bounded recovery in progress.

## Goal and authorized scope

Diagnose the browser critical path of retained integration d1a44d850a68bbbe646543cb1eb49a05e71b03e0, Verify run 42234771269, browser job 127949505404. The brief reports that its command began at 14:32:55 and emitted no output before the 15-minute cancellation. That is supplied context, not a newly observed runner diagnosis. A lost runner is not established.

Write only .github/workflows/verify.yml, CI orchestration scripts it invokes, and the required generated source lock on current main. Do not carry the unlanded API-001 product delta. Preserve all test registrations, names, assertions, coverage, newer main checks, concurrency, at most eight shard jobs and one full run per pushed commit. Do not increase timeouts, add retries, suppress checks or edit product/runtime/test/migration/contract/UI sources.

## Full execution plan (not executed beyond bootstrap)

1. Set fleet Git identity, read launcher instructions, refresh the injected bundle and install the mandated Git helper and push guard. Clone main shallow with blob filtering. Configure repository identity and preserved commit hooks. Read repository AGENTS.md, CONTRACT.md, ACCEPTANCE.md and documented source-lock/contract-generator instructions. Check repository-visible current branches, PRs and recent runs for a newer live owner of this CI scope, within the ten-call API budget. If custody exists, report it and stop.
2. Create cloud/sx-glove-ci-critical-path-1 from current main. Fetch the immutable retained integration only for diagnosis and verify its exact SHA. Read its completed failed browser-job log once using the required gh run view command, with the token loaded directly from the refreshed bundle. Save sanitized command and timing receipts. Inspect the exact invoked orchestration, dependencies and test registration coverage without importing the retained product delta.
3. Construct a complete before/after check-to-job table from the actual current-main workflow. Trace each command, shard assignment, build dependency, browser setup and final executed coverage. Distinguish an oversized serial workload, child-process lifecycle stall, deadlock, setup delay and runner failure using actual logs and command behavior. Do not invent a diagnosis from silence alone.
4. Implement the smallest cause-based orchestration change on current main. Preserve every assertion and the final coverage execution; build once and share artifacts; use ubuntu-24.04 and the maintained Chromium controls where required by existing rules. Limit the matrix to eight shards and target ten minutes end to end. Keep timeouts and retry policy unchanged. Add no permanent test for this one-off fix.
5. Source the supplied toolchain setup in each shell. Run only touched workflow/script validation and repository typecheck, plus the documented contract view check if applicable. Do not run the full suite locally. Retain generated views from main without committing them. Regenerate the documented source lock last and check it. Record all commands, exits and measured timings in actual receipt files.
6. Fetch and rebase onto fresh main before the first candidate push; resolve source before generated views and preserve newer main judgments. Regenerate/check the source lock after any replay. Commit with explicit fleet author and committer environment variables and active hooks. Inspect every candidate commit including side parents, all identities, trailers and complete messages. Use only the named branch and cloud-push.py. If a published save exists, merge subsequent main updates instead of rebasing or force pushing.
7. Discover exact-SHA Verify through REST and use one watcher with at most one call per run per 300 seconds, staying within the ten-call GitHub budget. Read a completed failed job log once per failed job if needed. Do not rerun or dispatch. Require executed success on the exact candidate; report actual job/wall timings and whether the ten-minute target was met. A generated-view-only failure receives only the explicitly supplied exception.
8. Save the full measured diagnosis, before/after check-to-job mapping, counts, retained-integration applicability and terminal provenance in this packet. Publish only explicitly selected non-secret regular files to evidence/sx-glove-ci-critical-path-1 using cloud_evidence.py. Emit the required sx POST and exact READY/PUSHED/BLOCKED disposition. Delete successfully pushed clones/dependencies; preserve unpublished work and verified rescue bundles if a push is blocked.

## Actual results

- Global fleet author and committer configuration was applied before repository work.
- Launcher /workspace/rer-cloud-launcher/refresh.sh was read and run successfully. Launcher snapshot reported 8ca2ea2; its AGENTS.md was read. No launcher source was changed.
- The cloud runtime skill and network guidance were read. The observed network policy was enforced and unrestricted, with VPN disabled. No bypass or alternate credential was attempted.
- Installed the task-side decrypted-bundle Git credential helper, credential-URL cleanup and cloud push guard outside product repositories. Each clone recovery refresh is followed by reinstalling the bundle-reading helper and cleanup.
- Git rejected the requested shallow filtered product clone with: `remote: Invalid username or token. Password authentication is not supported for Git operations.` Git exited 128 and did not supply an HTTP status.
- The requested bounded recovery uses five total attempts with 15, 45, 90 and 150-second delays, refreshing the same injected bundle before each retry. See clone-recovery.json and clone-recovery.log for actual outcomes.
- No repository code or workflow was available to inspect. The newer-writer custody check, source inspection, immutable diagnostic fetch and log review were NOT RUN. No CI cause is established and no workflow repair is claimed.
- No dependency installation, tests, typecheck, source-lock regeneration, contract generation, publication scan, product commit, push or CI execution occurred. No full suite was run locally.
- Before/after test counts, job counts, assertion counts and check-to-job mapping are UNKNOWN because the source could not be read. There were zero task-created tests, assertions, product commits or clause changes.
- Clause statuses, gaps and evidence are unchanged. Original technical/Opus receipts, PARTIAL gap/status, rejected-head/134hold snapshot and C/D follow-ups remain untouched. Retained integration d1a44d850a68bbbe646543cb1eb49a05e71b03e0 remains BLOCKED and is not relabeled green.
- No repair exists to apply to the retained integration. Applicability must be established by the unexecuted diagnosis and exact-final qualification after access is restored.
- The ten-minute target is NOT MEASURED. No fabricated before/after timings or green-CI claims are made.
- There is no completed unpushed product work and no Git object store from which to create a rescue bundle. No product push was attempted or rejected, so push-rescue requirements are not applicable.

## Evidence and next action

Actual non-secret local packet lives at /home/agent/rer-consolidation/work/sx-glove-ci-critical-path-1/packet/. The task-side evidence transport entrypoint was installed. Final transfer outcome is recorded in evidence-publication.log and terminal-receipt.json. No successful evidence ref/head is claimed without a successful helper result.

The fleet owner must refresh the launcher's injected bundle with a credential authorized to read just-every/run-glove, then relaunch this same scoped assignment. No additional product or clause ruling is requested.
