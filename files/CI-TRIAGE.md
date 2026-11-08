# Predecessor CI triage

Predecessor: 10d84256718bb3e216c741ed6d221adaa2154efe.
Verify: 42529815126, event push, conclusion failure.
Primary failed job: 128881480080, shards (browser-2).
The failed job log was read exactly once with:

```
gh run view 42529815126 --repo just-every/run-glove --job 128881480080 --log-failed
```

The job's exact command was `node scripts/verify-ci.mjs "$SHARD"`, with SHARD and GLOVE_VERIFY_SHARD set to browser-2, CI=true, WRANGLER_SEND_METRICS=false, PLAYWRIGHT_SKIP_BROWSER_GC=1 and GLOVE_CI_PREBUILT=1.

Observed failure:

```
tests/browser/due-visits.spec.ts:33:1
BOOK-002, BOOK-011, BOOK-012, BOOK-013 / PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 / AGENT-008, AGENT-016 Office batch books due visits, records declines and outside sends, the customer chooses an offered slot, the owner follows the brief, and Agent prepares source-linked maintenance flags at 1440 and 390
TypeError: fetch failed
at tests/browser/due-visits.spec.ts:63:26
[cause]: SocketError: other side closed
```

The job reported 22 passing tests and this one failing test. The aggregate verify job 128884399135 consequently failed. The api-1, api-2 and other browser shards succeeded. No callback blob redirect was fetched.

The local reproduction runs the same shard on the failed SHA after building that SHA, with the listed environment and the cloud-required system Chromium path and no-sandbox launch settings. Actual local output and main comparison are recorded in the final receipt. This is a transport failure outside the changed email journey. No speculative production repair is authorized by this evidence.
