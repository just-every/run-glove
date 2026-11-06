# sx-glove-c-f95 — DISP-001 native qualification

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f95
Candidate: 05edc49918517e6761fe0f69afaac85569eb1f89
Pinned continuation base: 76b4639ae36ffc305bf5a41314140fb5fd304773
Integrated main: 786ecbc4d54e2125f3e96589ecc40f57962825ee.

DISP-001 remains PARTIAL → PARTIAL. Acceptance points 2 and 3 have native public-door proof. Points 1 and 4–8 remain explicitly outstanding in the source Gap. Counts remain 7 DONE, 227 PARTIAL, 29 MISSING, 263 total Status rows. No DONE claim or independent judge request is made.

## Work and observed result

The f93 base already supplied one focused browser journey and native fixture. Its completed push Verify 42130299273 passed the browser, API and portability shards. Foundation job 127605083119 failed only `node src/base/contract-docs.mjs check`: “ACCEPTANCE.md: generated content differs; run contract-docs write.” The same command reproduced that output locally. This is the documented lander-owned generated-view exception; no workflow was changed and no CI repair or rerun was attempted.

The continuation extends that same journey rather than adding registrations. It adds an active technician without visits in the day or week, a second month with five weeks, additional quote states, jobs with multiple visits, and independently written wall-time answers. All original assertions remain, with exact row and chip counts expanded for the added native records. The original `tests/browser/journey.spec.ts` remains byte-for-byte unchanged.

The extended public browser journey reproduced an acceptance-breaking month defect. After choosing Day Inactive in March and navigating to April, that technician correctly disappeared from the selector, which displayed All technicians. The board nevertheless retained the invisible technician filter: expected five native chips, received zero. `dispatch-before.log` records the failure. The repair in `src/ui/dispatch.tsx:68` uses the available technician selection consistently in both the selector and month board, then clears the expired selection. Returning to March retains the visible All choice. No domain records change.

The fixture is created only through native business, customer, site, technician, quote, job and visit commands. It includes local-midnight boundaries, the spring business-zone offset change, padded month boundaries, inactive technicians inside and outside each shown range, an inactive technician with only cancelled work, and one with no work. One open job has completed work plus a later booking; another has cancelled work plus a later booking outside the displayed month. Both remain excluded from Waiting to book. Two cancelled visits on one open job yield one waiting row. Draft, approved, sent and declined quotes remain excluded. An accepted quote already linked to an unbooked job is represented only by that job. A completed closed job is excluded; a completed visit on an open job is included. Booked and arrived visits suppress waiting globally.

## Runtime proof

Journey: `tests/browser/dispatch-board.spec.ts:43` — dispatch grids and Waiting to book retain exact native membership across reload and Worker restart.

- Point 2: independent wall-time answers at lines 9–26; UTC instants and business zone at lines 51–59; exact day rows and hourly columns at lines 116–123; exact Sunday-to-Saturday week cells at lines 137–151; all 42 March cells and their chips at lines 160–186; selected active and inactive technicians at lines 188–194; the five-week April range and expired-selection navigation at lines 197–213.
- Point 3: exact five quote and job identities, titles, count and quote-only action at lines 97–104. The native fixture contains the positive and excluded states listed above at `tests/api/harness.mjs:306`.
- Durability and absence of side effects: initial, reload and actual Worker restart phases at lines 111–113; the harness disposes the actual Worker and reopens its surviving D1. Complete authenticated domain state equals the independent pre-read snapshot at line 215 after every phase. No SQL-seeded domain records, provider availability or mocked command result is used.
- The journey asserts at 1440 pixels. Its screen capture helper records day, week, month all, month selected, next-month range and Waiting to book once each at 1440 and 390. Twelve actual PNGs are included in the packet. The changed April screen was visually inspected at both widths.
- Existing Book a visit, Previous day and Next day icon controls retain immediate keyboard-focus tooltips at lines 128–134. The repair adds no controls, CSS or everyday text.

PROBE DISP-001 2: authenticated native board at fixed business-local boundaries → exact day, week, month, technician and chip identities; All technicians agrees with the displayed month after an inactive selection leaves the range; unchanged after reload and actual Worker restart.
PROBE DISP-001 3: native quotes and open jobs with mixed visit histories → exactly five Waiting to book identities, with no duplicate linked quote or multi-visit job; booked and arrived work excluded even outside the displayed range; navigation and reads leave domain state unchanged.

## Verification and mechanics

Local commands use the provided cloud toolchain and owned-process subreaper. Browser runs use system Chromium with the prescribed no-sandbox launch. No full local suite was run.

- `pnpm typecheck`: passed.
- `npx -y @runeditrun/rer check --profile first-party`: passed.
- `timeout 1200 node tests/browser/run.mjs dispatch-board.spec.ts`: the new regression failed before repair, then the complete extended journey passed. An additional run on the committed candidate is recorded in receipt.json.
- `node scripts/contract-docs.mjs write --clauses DISP-001`, then `node scripts/contract-docs.mjs check`: passed. The generated views were restored whole from origin/main before locking. Their diff against integrated main is empty.
- `node scripts/edition-authoring/cli.mjs lock`, then `node scripts/edition-authoring/cli.mjs check`: passed, generated last after the final source and contract edit and main integration.
- Migration ledger: not applicable; no migration changed.
- `git diff --check`: passed. Added source and fixture lines contain no email-shaped string or bare prose slash token. No credential or environment dump is included.
- Every parent Status row was retained at every commit: 263 before and after. The merge retains main’s newer MONEY-003 judgment and costing assertions. Only DISP-001’s Evidence cell is changed relative to integrated main; no acceptance sentence or status rank changed.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node scripts/contract-docs.mjs write --clauses DISP-001 and check exit=0, then restored main views; ledger=none exit=0.

## DONE-RIDERS assessment

This is an honest PARTIAL handoff, with no request to count DISP-001 DONE.

1. PARTIAL: the scoped point 2 and 3 outcomes are reached by the named journey; points 1 and 4–8 remain in the Gap.
2. PASS for scoped proof: nonempty native records and independently enumerated visible answers; the removed filter repair is demonstrated by the expected-five, received-zero failure.
3. PENDING exact-SHA Verify at report preparation. The existing browser shard runs `node tests/browser/run.mjs`, whose Playwright glob loads this journey without an opt-in flag. Local proof runs on the candidate.
4. PASS for local provenance: receipt.json binds the committed candidate; no relevant source changed after it.
5. PRESERVED: DISP-001 retains its BASE-ACCESSIBILITY-001 citation; no new inherited duty is claimed.
6. PARTIAL metadata is honest: the Gap retains every omitted point and external hold. Generation passes before restoring lander-owned views; the shared Judged from line remains unchanged and no whole-contract rejudgment is claimed.
7. PASS: acceptance text, rider placement and coverage are unchanged.
8. NOT CHANGED: this is a read and filtering repair; no permission or authority path is added. Native reads leave the full domain snapshot unchanged.
9. PASS boundary: no live provider, legal, device, Lanyard or Base egress proof is claimed.
10. NOT APPLICABLE: no new custody, consent, spending or authority policy default is adopted.
11. PENDING fleet landing: main equality, exact-SHA Verify, Run site and full-history publication scanning remain independent lander gates. No COMPLETE scan result is asserted from this cloud.

## Delivery and remaining scope

The first real save 0e619b2 was pushed with the skip-CI marker. Updated main was then merged, never rebased or force-pushed. CONTRACT.md merged cleanly; the source lock conflict was regenerated from source after keeping main’s generated views. The candidate push succeeded on its first attempt. Exact-SHA push Verify 42136268352 was discovered in progress; its latest observation is recorded in receipt.json. Candidate identities and all side parents were inspected with the required origin/main range command; authors and committers are fleet and trailers are absent. Product commits contain only the requested product, tests, contract evidence and generated source lock. There is no PR requirement for this repository’s branch-push Verify entry point.

Plan row update for the lane: DISP-001 point 2 and 3 qualification now includes inactive-filter range reset, active empty rows, independently expected local times, five-week and six-week months, exact multiple-visit and quote-state Waiting membership, restart and read-only custody. Status and counts stay unchanged. Points 1 and 4–8, crew qualification, Lanyard availability read-door and gr-base-285 resolved-address egress and adoption, all account and ct prerequisites and accepted runtime restrictions remain held or outstanding exactly as in the source Gap.

No account, provider activation, customer messaging, payment, agent execution, repin, release or publication was performed. There is no new external blocker for the scoped point 2 and 3 work. CI discovery and terminal custody are recorded in receipt.json. Evidence transport is separate from product READY, acceptance and landing.
