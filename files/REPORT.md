# sx-glove-c-f94 result

API-001 remains PARTIAL → PARTIAL. This round qualifies only point 1's existing human customer and site screen-to-HTTP slice. No DONE claim is made. The before and after counts are 7 DONE, 227 PARTIAL, 29 MISSING; all 263 parent Status rows remain.

Product repository: just-every/run-glove.
Product branch: cloud/sx-glove-c-f94.
Product head: a4a7d425fdf9983b724f2f29e096ec42ffb40136.
Original main: e0bb7c6b8489e3ffc51b26a7601764be9a870f99.
PR: none required; Verify starts on branch push.
Product push: successful, first attempt. The remote ref was independently read back at the exact head.
Exact-SHA Verify: 42130411941, push event, completed with conclusion failure. The sole root failure is the permitted generated-view check: ACCEPTANCE.md differs from CONTRACT.md. The API, portable and browser shards all succeeded on the exact product SHA. The aggregate verify job failed as a consequence of foundation. This qualifies for the brief's explicit generated-view READY exception; the fleet lander must regenerate and Verify again before landing.
Publication scan and main Run site: not performed here; retained fleet landing gates. No main push or landing was attempted.

## Plan and scope

The complete original plan is in PLAN.md. The completed work follows its seven steps: inspect the public doors, add a real HTTP browser journey, repair the demonstrated screen discrepancy, run touched checks, update the partial contract evidence, refresh the source lock and push the named candidate, then publish this separate report packet.

The only plan row changed is API-001's evidence and remaining Gap. The acceptance sentence, Base citations and PARTIAL status are unchanged. Every other documented read and command and its screen parity, integration-token and company-agent authority, and provider-dependent behavior remain unqualified. Customer-side Checkout, messaging and consent, account and ct prerequisites, Lanyard availability, gr-base-285 egress and adoption, and accepted runtime-pin holds remain unchanged. This bounded planner selection authorizes no provider activation, repinning, release or publication of the product.

## Product change and proof

The documented site.save edit door had no corresponding site-edit control. The corrected baseline browser journey created the customer and both sites, then failed waiting for Edit site at tests/browser/http-customers.spec.ts:99 on the pre-repair screen. See baseline-missing-control.log.

src/ui/customers.tsx:87 now reuses the site's existing form for editing. It captures the selected identity and observed version, preserves the branch and undisplayed contact email, preserves an explicit ZIP when the address has not changed, and resets on customer selection changes. Save uses the existing command and role checks. Cancel discards the form without writing. No server authority or API semantics changed.

tests/browser/http-customers.spec.ts:13 contains one sanity journey. It uses the real setup and dev installation, native owner sign-in, actual Worker responses and disposable migrated D1. It never intercepts or fulfills application API requests. Its request collector checks type, payload, actual HTTP status, outcome, returned identity and next version. Exact expected field values are chosen independently of returned projections.

Customer creation and editing are checked at lines 61–77, both site creations at 79–96, cancel at 97–105, both site edits at 106–126, a permitted direct HTTP edit and reload at 128–141, and captured successful creation replay at 143–152. The authenticated state read is at 16–19. The replay returns the original successful response even after the site has been edited, with no extra record, event or state version.

Assertions execute at 1440. The same candidate screens are captured once at both 1440 and 390: customer form, site editor and persisted sites. Each capture checks page overflow and icon-only control descriptions through the existing phoneScreen helper. The new controls have text labels and use the existing form styles. No new icon-only controls, configuration surface, one-sided borders, homepage copy, branding or logo were added.

Actual command requests and results are retained in browser-receipt.json, without cookies, headers, owner entry URLs or credentials. These are synthetic customer data. Six PNGs show the candidate. The source file hashes in checks-receipt.json bind the unchanged tested bytes to a4a7d425fdf9983b724f2f29e096ec42ffb40136; no relevant source changed between the final fresh run, commit and no-op rebase.

## Checks and actual attempts

- Final fresh browser run: exit 0; 1 passed, 8.6 seconds for the journey and 9.3 seconds overall after setup. browser-final.log and browser-receipt.json retain the result.
- Earlier fresh browser run: exit 0; 1 passed in 7.7 seconds, before the final cancel and customer screenshot additions. browser-first-fresh.log retains it.
- Touched API commands: node --test --test-concurrency=1 tests/api/flows.test.mjs tests/api/security.test.mjs. Exit 0; 23 passed, 0 failed, 0 skipped. API customer persistence, stale edits, actual Worker restart, current-role refusal, revoked sessions and replay assertions remain.
- Typecheck: pnpm typecheck, exit 0.
- First-party check: npx -y @runeditrun/rer check --profile first-party, exit 0.
- Contract generation: node scripts/contract-docs.mjs write --clauses API-001, then node scripts/contract-docs.mjs check; both exit 0. ACCEPTANCE.md and docs/CLAIMS.md were restored from origin/main. Neither generated view is committed.
- Source lock: node scripts/edition-authoring/cli.mjs lock, then node scripts/edition-authoring/cli.mjs check; both exit 0 after final edits and after the no-op rebase. The committed tree is clean.
- Migration ledger: not applicable; no migration changes.
- Parent row protection: all 263 Status IDs preserved; all status values unchanged; the parent and candidate each have 474 table lines.
- All candidate commit authors, committers and trailers passed the identity audit. No OpenAI or Codex co-author survived. Added product text has zero email-address literals. identity-receipt.json records the audit. The separate full-history publication scan remains unclaimed.

Two local authoring attempts also remain in the packet for completeness. The first new assertion incorrectly compared an edit's returned version with the submitted version; it was corrected to require an increment (authoring-version-assertion.log). A later run reused an installation containing the earlier synthetic customer and encountered the existing duplicate-review table's overflow; the maintained fresh-install runner passed (reused-installation-overflow.log). These were local test-development results, not failed CI repairs.

The new browser registration is offset by folding the existing built-in current-role withdrawal commands and assertions into the existing custom-role authority journey in tests/api/security.test.mjs:147. No existing assertion was removed, weakened, skipped or made conditional on width. No permanent assertion was added for copy, hashes, versions or static configuration. The inherited registration count does not increase.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses API-001 and check exit=0; ledger=none exit=0.

## Runtime probes

PROBE API-001 1 customer creation: real New customer control -> HTTP 200 customer.save, identity 911d9aea-7d80-4ad7-9bd2-f08f2a471d5a, independently specified contact, email, phone and billing address retained.
PROBE API-001 1 customer edit: real Save changes control -> HTTP 200 with the same customer identity and next version; exact new name, contact, email, phone and billing address visible.
PROBE API-001 1 two site creations: real Add site controls -> two distinct returned identities, each linked to the intended customer; exact addresses, access notes, contacts and phones retained.
PROBE API-001 1 two site edits: real Edit site and Save site controls -> HTTP 200 for each original identity and observed version; exact new fields survive reload and authenticated state reads.
PROBE API-001 1 cancel: Edit site, change access notes, Cancel edit -> no changed site or Activity entries.
PROBE API-001 1 direct HTTP edit: permitted native-session customer.save -> HTTP 200, Taylor HTTP and 300 Direct Avenue, Austin TX 78706 visible after reload and in authenticated state.
PROBE API-001 1 captured replay: repeat the first successful site.save envelope under the same native session -> HTTP 200 with the identical saved response; customer records, site records, events and state version unchanged.

## DONE-RIDERS assessment

This is a PARTIAL slice, not a request for a DONE judgment.

1. PARTIAL: the customer and site outcomes are performed and checked by the new sanity journey; the full acceptance sentence still lacks parity qualification for the other documented doors.
2. PASS for this slice: real nonempty records, exact independent fields and identities, a direct HTTP edit and unchanged replay state. Removing site-edit controls failed the corrected baseline.
3. PASS for the slice under the permitted generated-view exception: exact-SHA browser job 127605354170, API job 127605354022 and portable job 127605354046 succeeded in push Verify 42130411941. The sole root failure is foundation's generated ACCEPTANCE.md check. The new spec is included by the existing browser test glob; no workflow changed.
4. PASS for source binding: the final fresh browser proof ran the same relevant bytes committed at this head. checks-receipt.json records their hashes.
5. PASS: API-001 retains BASE-DOCS-001 and BASE-INPUT-001. No inherited duty was added or relocated.
6. PARTIAL accurately retained: the Gap names the qualified slice and all omitted scope. Generated write and check passed before restoration. The pre-existing global Judged from provenance was not represented as a new whole-contract judgment.
7. PASS: no acceptance change, new obligation, scope rewrite or Status row loss.
8. Existing API authority proof passed, including current-role withdrawal and wrong-person replay. The new screen uses that same door and grants no authority.
9. PASS boundary: no live provider receipt or provider behavior is claimed.
10. Not applicable: no new policy default or new authority was adopted.
11. Pending fleet landing: main equality, complete publication scan and exact resulting main Run site remain unestablished here.

## Pre-handoff assessment

The chosen public behavior is asserted through real controls and HTTP; the demonstrated missing edit control fails the baseline. Existing assertions remain. Authority and replay proof passed; this change adds no erasure, restoration or credential path. The new screen controls use existing readable fields and text buttons, and responsive screenshots passed overflow and icon-description checks. Existing publication and Run site gates remain mandatory and are not claimed complete. No new blocker was found in the bounded slice. The observed CI failure is only the specifically permitted generated-view exception, not a failed product assertion. No CI rerun, workflow edit, generated-view commit or repair round was performed.

The independent gate must score the retained wider Gap honestly. API-001 is not DONE. There is no ct judge request or scope ASK for this partial qualification.

## Custody

The product and all product, contract and documentation changes are on the named cloud branch. This packet goes only to refs/heads/evidence/sx-glove-c-f94. The evidence manifest identifies the product head and selected file hashes; evidence transport is separate from product READY, acceptance or landing. No fleet packet file is in the product commit.


## Final CI observation and log transport

The run completed before the last planned status observation. Eight GitHub invocations were used, with status polls separated by at least 300 seconds. The failed foundation log was read exactly once:

gh run view 42130411941 --repo just-every/run-glove --job 127605354018 --log-failed

It returned exit 0 and the actual failing assertion:
ACCEPTANCE.md: generated content differs; run contract-docs write.
The workflow command was node src/base/contract-docs.mjs check, exit 1.
This is the expected generated-view failure. The log's CI environment section was removed from the published copy; its command and actual failure remain intact.

The aggregate verify job's failed-log archive was also requested once:
gh run view 42130411941 --repo just-every/run-glove --job 127611706339 --log-failed

That command returned exit 1:
failed to get run log: zip: not a valid zip file

No HTTP status or response body was supplied. It was not retried. The REST job receipt independently shows that this aggregate job failed at Require the selected coverage and its proof after foundation failed. API, portable and browser succeeded. No transport failure is being represented as a passed log retrieval. Both actual log outcomes are retained in the packet.

Final product custody: eligible READY under the explicit generated-view exception, at the same pushed SHA. All main, publication-scan and Run site requirements remain the fleet lander's responsibility.
