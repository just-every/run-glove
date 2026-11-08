# Candidate Verify failure

Exact head: c2fb27a6b95ebdc88283a471097a538bd2ab4f34
Run: 42474671848; event: push; conclusion: failure.
Job: 128713634442, shards (browser-4).

The only substantive failed job is browser-4. Build, foundation, portable, both API shards and browser shards 1, 2 and 3 passed. Aggregate verify also failed because browser-4 failed.

Failed test: tests/browser/journey.spec.ts:1147, “DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 a technician reconnects and erases cached originals and queued captures only for explicitly erased visits at 1440 and 390”.

Exact quoted error: “Error: route.fulfill: Route is already handled!” at tests/browser/journey.spec.ts:1169:21.

Read the failed job archive exactly once with:
gh run view 42474671848 --repo just-every/run-glove --job 128713634442 --log-failed
Exit 0. The complete sanitized log is ci-browser-4.log.

Reproduction command on the failed head:
CI=true GLOVE_VERIFY_SHARD=browser-4 GLOVE_CI_PARTITION=1 GLOVE_CI_PREBUILT=1 WRANGLER_SEND_METRICS=false PLAYWRIGHT_SKIP_BROWSER_GC=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium SHARD=browser-4 node scripts/verify-ci.mjs browser-4

The application was rebuilt on that candidate first. Cloud-specific browser executable is the required system Chromium. The same pinned Node 22.20.0 is used. The failed test, browser runtime and outbox source are byte-identical to observed main 3db9c3ec9cdad3f66b4b809b05126264fce2d38d. No repair or assertion change has been made. Local reproduction and same-runner main comparison are complete: the entire failed candidate shard passed 14 of 14, and the failed journey on main passed 1 of 1. Both exited 0. No candidate or main source was changed for these runs. The real app was rebuilt first on the candidate; main used its own fresh setup and build.

VERIFY_NOT_REPRODUCED

The actual structured result is verification-reproduction.json. There is no truthful local nonzero exit to place in a VERIFY_REPRODUCED record: the candidate reproduction returned 0 and main comparison returned 0. No repair round was attempted. Do not infer a proven infrastructure flake or invent a speculative fix. The brief says “If it does not reproduce, stop BLOCKED with that output; do not guess a fix.” That is the terminal disposition. No CI rerun or dispatch was requested.
