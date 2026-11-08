# CUST-006 continuation results

Repository: just-every/run-glove
Tag and branch: sx-glove-c-f123-pc1; cloud/sx-glove-c-f123-pc1
Candidate: 5c02ddbee37f430756e9a3d57339c4575ceb0157
Saved starting head: eb8e911cd22e56298d5bb7ece63571ca4143546a
Integrated main: e65fd420554c15d42ef2dbb77300adf99e600704

The saved commits were preserved through two new merge commits, 9c013732274f017555f93d4628bcf0710305cc09 and 5c02ddbee37f430756e9a3d57339c4575ceb0157. Both pushes succeeded on the first guarded attempt. No published history was rewritten. No default branch or PR was changed. The final tree equals the integrated main tree exactly, while preserving the saved branch ancestry. Main already includes the CUST-006 DONE judgment and the same audience proof, including encoded credential exclusion. This continuation adds no contract judgment, product behavior, workflow change, policy default or duplicate test registration.

Counts at the saved head were 11 DONE, 223 PARTIAL and 29 MISSING. Integrated main and the candidate have 14 DONE, 220 PARTIAL and 29 MISSING, with all 263 Status rows retained. Main supplied the CUST-006, QUOTE-011 and PLAN-002 judgments; this builder changed no Status, Gap or Evidence cell. CUST-006 is retained as DONE. No other campaign target was started. The plan's CUST-006 row may record the continuation SHA, preserved DONE judgment and current Verify result; no plan file was edited in this cloud.

## Failed Verify and comparison

Previous Verify 42476002103 failed browser job 128717558425 and aggregate job 128719745045 on the saved head. The browser log names `tests/browser/rules.spec.ts:19`: the exact Rules heading was not found within 5000 ms while opening the Rules screen. The other previous shards, including API and portable, succeeded. One `gh run view` archive read was made per failed job. This gh version returned empty formatted output; its already downloaded archive contained the full browser log, from which `previous-failure.txt` retains the failing assertion and command without environment dumps or transport URLs.

The exact shard command, `node scripts/verify-ci.mjs "$SHARD"` with browser-2 selected and the CI flags, was run on the failed head before any edit. Node was 22.20.0; the cloud used Chromium at `/usr/bin/chromium` with the repository's existing no-sandbox option. All six tests passed, including the formerly failing Rules and phone desk journey. The failure did not reproduce. No speculative repair or assertion weakening was made, and there was no repair round to label VERIFY_REPRODUCED. `reproduction.json` records the actual exit 0 honestly.

The same command was run in a detached worktree on main 1caa3765552bf70bde548bf7a34c2bdf71118e47 on the same cloud runner; all six tests passed. Main already contained 912413adec61f3ba998dbfa55f91b8ee3fbe3e5a, which attaches the fixture before hydration, waits for readiness before navigation and settles the Rules route before reload. Merging main carries that existing fix. The final candidate's browser journey, fixture, harness, relevant screens and portability journey match that main proof byte for byte; `receipt.json` records the hashes. The final segment journey was rerun after retaining both of main's credential assertions and passed.

Current exact-head Verify is push run 42488300873. Its state at 14:13:33 UTC is in_progress, with no conclusion; receipt.json and ci-poll-1.json retain that exact-head observation. No prior head's green run is claimed for this candidate. The initial discovery was at 14:08:26 UTC; subsequent reads are at least 300 seconds apart, with one watcher and a ten-call budget. No dispatch or rerun has been requested.

## Acceptance and inherited proof map

The registered segment journey is `tests/api/segments.test.mjs` — “DATA-002, DATA-009, DATA-010 / CUST-004, CUST-006 two custom fields, tags and a segment: members match the filter and the export carries exactly them” at line 419; `marketingHandoff` begins at line 515. The real installation script is `tests/portable.mjs` — CUST-006 real archive.

| Item | Public door and observed proof | Result and location |
| --- | --- | --- |
| Point 1: Owner connects Mango with an integration address and contacts write credential, or Mailchimp with a data-center key and audience | Owner `marketing.connect` stores only connection metadata in public state. Office, Dispatcher, Agent, technician and integration-token attempts are refused without retained changes. Invalid address, malformed key and missing audience are refused. Synthetic network credentials succeed at the provider boundary; provider-rejected credentials record 401 without claiming verification. | Local PASS; segment lines 521–547 and 649–660. Verify covers this existing API registration. |
| Point 1: keys never enter records, saved outcomes, export, logs or installation archive | State, saved command results, Activity, export and actual captured Worker output exclude raw keys and Basic authorization encoding. Real `rer export` excludes the provider key table and both keys; import into a fresh installation requires explicit reconnection. | Local PASS; segment lines 638–642; portable lines 257–276, 317–325, 343–352 and 372–383. |
| Point 2: Owner and Office hand off the exact audience without subscribing | Independently enumerated members include eligible, provider-refused, unreachable, missing-email, do-not-contact and SMS STOP cases. Each role pushes both providers before and after a real Worker restart. Exact Mango PUT has email, display name, segment and tags without a subscribe field. Exact Mailchimp PUT uses transactional status only for new members, followed by segment and customer tag POSTs. | Local PASS; segment lines 549–613. |
| Point 2: skipped counts, provider refusals and recorded push outcomes | Seven members produce four successful pushes, one missing email and two contact exclusions on success; refusal rounds produce one pushed member and three exact HTTP or unconfirmed statuses. Individual provider facts and push counts persist, with no repeated call on replay or restart. | Local PASS; segment lines 585–636 and 615–625. |
| BASE-SECRET-001 inheritance | Explicit citation in CUST-006 meta line. Raw and encoded credentials are excluded from populated retained surfaces, Worker logs and the real archive. | Local PASS; CONTRACT.md line 399; segment lines 638–642 and portable lines 317–325. |
| BASE-DATA-001 inheritance | Explicit citation in CUST-006 meta line. Actual archive export and fresh import preserve exact segments, push records and saved outcomes. Old sessions fail, old connection replay cannot reconstitute keys, and reconnect alone sends nothing. | Local PASS; CONTRACT.md line 399; portable lines 327–352 and 372–383. |
| DATA-002, DATA-009 and DATA-010 provider fact custody | The real command and provider doors retain provider identity, time, command, customer and segment references, actual HTTP result or honest unconfirmed outcome, without provider reply secrets. Activity and export agree. | Local PASS; segment lines 627–636 and 638–642. |
| Current authority, erasure and replay fences | Disconnected keys cannot send; downgraded Office cannot replay a former push. Customer erasure scrubs referenced failed outcomes and replay cannot resurrect or send the erased member. | Local PASS; segment lines 644–648 and 664–676. |

PROBE CUST-006 1: Owner marketing.connect for both providers, excluded roles and an integration token, followed by populated state, Activity, saved outcomes, export, captured Worker output and actual archive inspection -> valid metadata retained; unauthorized and malformed inputs refused; raw and encoded keys absent; restored installation requires explicit reconnection.

PROBE CUST-006 2: Owner and Office segment.push for seven enumerated members against each provider, including HTTP refusal and unreachable-edge answers, restart and command replay -> exact provider bodies, counts 7 members, 4 pushed, 1 missing email and 2 contact exclusions on success; refusal rounds record 1 pushed and 3 refusals or unconfirmed outcomes; restart and replay make no duplicate provider call.

## DONE-RIDERS review

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | Local PASS; exact-head Verify receipt governs CI | Both acceptance points are reached through commands and a real archive; proof map above. |
| 2 | PASS | Populated independently enumerated customers; successful and forbidden role paths; exact payloads, counts and refusal facts, segment lines 529–547 and 549–636. |
| 3 | Pending exact-head Verify at report creation | Existing push API and portable shards load the journeys; verification.json and the unchanged Verify workflow retain them. Current run is 42488300873, event push, exact candidate SHA. |
| 4 | PASS by byte equality | Receipt hashes show the browser, harness, product screens and archive journey unchanged from the main comparison. Final segment assertions passed before the final merge commit; no relevant bytes changed afterwards. |
| 5 | PASS | CUST-006 explicitly cites BASE-DATA-001 and BASE-SECRET-001 at CONTRACT.md line 399. |
| 6 | PASS for builder mechanics | Contract write and check exit 0. Contract source and generated views equal main exactly. Main owns existing provenance and judgments; none were rewritten. |
| 7 | PASS | No acceptance text or obligation was changed; contract delta from main is empty. |
| 8 | PASS | Owner connection succeeds; Office and Dispatcher connection plus integration-token authority are refused without changes. Office push succeeds, current withdrawal prevents replay, segment lines 529–547 and 664–676. |
| 9 | PASS within the named boundary | Fakes are at Mango and Mailchimp network edges. No live account, marketing consent, subscription, legal compliance or automatic audience synchronization is claimed. COMM-002 retains its broader owned obligations and holds. |
| 10 | PASS | No policy default adopted. Existing Owner connection and Owner or Office explicit push authority remain unchanged. |
| 11 | Pending guarded lander | This cloud has not landed or scanned the candidate. Main equality, COMPLETE full-history scan with zero new findings and Run site receipt remain independent lander gates. |

## Local checks and pre-ready review

The saved-head browser comparison passed 6 of 6 tests, and the main comparison passed 6 of 6 tests at the same runner. The integrated segment journey passed 1 of 1 registered test with zero failures, skips or cancellations; the final assertion version passed again. Typecheck and the first-party check exited 0. The complete real installation journey exited 0, including the CUST-006 archive section and all existing source, erasure, payment and restore checks; portable.log retains its actual output. No permanent test was added, deleted, skipped, narrowed or hidden by a width or branch condition. Existing test registrations were preserved; no cap increase was requested.

The named authority, erasure and replay paths are exercised. No screen or product behavior was changed by this continuation relative to current main. Main's Rules proof at 1440 and 390 is retained in the packet, with no UI claim inferred beyond that journey. No provider-shaped credential or literal email fixture was added. The only resolved segment conflict retains main's original raw-key assertion alongside its encoded-credential assertion. Main's newer harness plugins, real restart and signed-copy corruption support are retained whole.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and node scripts/edition-authoring/cli.mjs check exit=0; views=node scripts/contract-docs.mjs write and node scripts/contract-docs.mjs check exit=0; ledger=none exit=0.

Publication scan text for 5c02ddbee37f430756e9a3d57339c4575ceb0157: complete=unestablished; historyScanned=unestablished; findings=unestablished. The cloud does not claim a COMPLETE scan or zero findings. Run site and candidate landing equality are also unestablished and remain lander duties. These fields are kept explicit in receipt.json. Neither a product push nor report publication claims acceptance, landing or release.

No account or provider activation is requested. The held marketing-consent, subscription, live-provider acceptance, automatic sync and agent push boundaries remain unchanged. There is no new product blocker identified by local tests; CI state is reported exactly as observed.

The full executed plan is PLAN.md. Actual logs and structured receipts are selected explicitly for the separate evidence branch. No credential files, private environment dumps, signed transport URLs, symlinks or held-out gate material are selected. Product commits contain no packet files. The evidence manifest binds the reports to the product branch and head without changing its checkout or refs.
