# sx-glove-c-f112 results

MONEY-001 remains PARTIAL. Acceptance point 5 is qualified by the existing public API and browser journeys, extended in this candidate. The run did not change product behavior because both refusals and explicit selection already worked.

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f112
Candidate: bc0a5755a83da6f20d4ab441d755a2b560095960
Parent and observed main: acfdd944a4356002ad6a1d27707cc68c32ce0730
PR: none required; push starts Verify.
Counts before and after: 7 DONE, 227 PARTIAL, 29 MISSING, 263 clauses.
All 263 parent Status rows and all 474 parent table lines remain.

## Plan and scope

The complete initial plan is in PLAN.md. Its six steps were executed: map current acceptance and proof, extend the API journey, exercise browser refusal and correction, run touched checks, regenerate and restore views and lock sources, then commit and push only the named branch and return evidence separately.

Only the MONEY-001 plan row changes: point 5 goes from unqualified to locally qualified. Its Status stays partial. CONTRACT.md retains the exact acceptance text and all other Gap sentences. Evidence names both existing journeys and their selected-point outcomes.

Points 1–4 and 6–8 retain their complete-qualification gaps. MONEY-004 snapshot, certificate and report completeness, MONEY-005 provider lookups, collected tax, ledger posting and provider acceptance remain omitted. MONEY-006's original external campaign hold remains. Customer-side payment, messaging and consent, account, ct, Base, Lanyard, resolved-address egress, adoption and accepted runtime-pin holds remain unchanged. No release, activation, repinning, authority expansion, provider acceptance or deployment occurred.

## Public-door proof

API journey: tests/api/money.test.mjs — DATA-002, DATA-009, DATA-010 / MONEY-001, MONEY-004, MONEY-005 address and branch tax, labor rules and certificate expiry remain exact on approved documents, exports, QuickBooks payloads and tax reports.

Browser journey: tests/browser/money.spec.ts — MONEY-001, MONEY-004, MONEY-005 owner manages branch rates, private exemption evidence, Stripe and Avalara AvaTax proposals and frozen quote/invoice tax at 1440 and 390.

| Rubric | Public outcome | Proof on candidate |
| --- | --- | --- |
| P5.1 | Overlapping configured ZIP without an explicit choice refuses and saves no quote | API lines 150–166; browser lines 175–183. Compare quotes, sites, business counters, approvals and events before and after refusal. |
| P5.2 | Unmatched configured address without a default refuses and saves no quote | The same API and browser loops independently exercise ZIP 99999 and the distinct corrective message. |
| P5.3 | Each permitted explicit site jurisdiction prices exactly | API lines 178–193: two sites each select tx and az through site.save; expected literal breakdowns include exact identity, name, rate, taxable basis and tax. Browser lines 184–202 uses the actual selector, saves it, drafts a quote and asserts the displayed jurisdiction and exact total for each selection on each site. |
| P5.4 | Later selections preserve earlier revisions and approved decisions through restart | API lines 181–210 keeps the first approved revision, creates a separately unapproved revision and checks every quote and exact revisions after an actual Worker restart with surviving D1. Browser lines 205–214 checks all saved quotes and selected sites after restart and reload. |
| P5.5 | Existing authority and attribution stay intact | API lines 168–174 refuses technician edits, cross-branch site edits and Office quote or business changes without state changes. Lines 196–216 assert successful site.saved actor, role, time, command and subject in Activity and the business export after restart. |
| P5.6 | Manual selection causes no tax-provider request | API line 218 and browser line 215 assert unchanged Stripe and AvaTax request counts during selection. The separate probe starts with no tax connection and records exactly zero tax-provider requests. |

Independent expected API values on 150.04 subtotal: Austin combined at 8.25%, labor exempt, taxable basis 100.01, tax 8.25, total 158.29; Phoenix combined at 6.5%, labor taxable, taxable basis 150.04, tax 9.75, total 159.79. Browser values on a 100.01 material line: city at 8.25%, tax 8.25, total 108.26; district at 9.5%, tax 9.50, total 109.51. Expectations are literal business figures, not recalculated by the production tax helper.

PROBE MONEY-001 5: business.save configures overlapping ZIP 78704 and no default; site.save creates matching and unmatched ZIP 99999 sites; quote.draft refuses both with TAX_JURISDICTION and unchanged quotes. Explicit choices yield 8.25% tax 8.25 total 108.26 and 9.5% tax 9.50 total 109.51. quote.revise and restart retain earlier revisions. Tax-provider requests: 0. Actual observations are in probe.json.

## Checks and mechanical work

The two existing API registrations and one existing browser registration remain; no registration, assertion or user flow was removed, skipped or weakened. New assertions extend those journeys. Browser behaviors assert at 1440; the screenshot helper captures 1440 and 390 and returns to the original viewport. No UI source, homepage, branding, provider behavior, migration, pin or workflow changed.

The API journey and browser journey passed before committing and were rerun on the exact committed SHA. Typecheck and rer check --profile first-party passed. Chromium uses /usr/bin/chromium with --no-sandbox. The browser runner closes its contexts, stops only its owned runtime by PID and deletes its temporary installation.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then node scripts/edition-authoring/cli.mjs check exit=0; views=node scripts/contract-docs.mjs write --clauses MONEY-001 then node scripts/contract-docs.mjs check --clauses MONEY-001 exit=0; ledger=none exit=0.

The generator wrote one view and its check passed. ACCEPTANCE.md and docs/CLAIMS.md were restored whole from origin/main before the source lock was generated. Neither generated view is committed. A stale-view-only candidate Verify is expected; the lander regenerates those views from CONTRACT.md before landing.

A first browser launch failed because the default Playwright download was absent. The successful runs explicitly select the instructed system Chromium. Two early API test-writing errors were corrected: Office quote drafting refuses at the permission check, and state projections add a followupState field that command results omit. No production defect was inferred from either. Final exact-SHA runs pass.

## Mutation receipts

Temporary mutations were applied one at a time to the candidate's production source and restored in a finally block. None was committed. Each returned exit 1 from the selected existing public API journey. Full actual logs and mutations.json are included.

| Mutation | Distinct assertion that caught it |
| --- | --- |
| Remove overlapping-ZIP refusal | Expected TAX_JURISDICTION; quote.draft incorrectly returned success. |
| Remove unmatched-address refusal | Expected TAX_JURISDICTION; quote.draft incorrectly returned success. |
| Ignore the selected jurisdiction and choose the first configured rate | API line 190: Phoenix identity, rate 6.5, taxable 150.04 and tax 9.75 differed from the wrongly chosen Austin values. |
| Replace earlier revisions when revising a quote | API line 188: the earlier approved revision changed. |

## DONE-RIDERS and pre-ready check

No DONE flip or whole-clause judge request is made.

| Rider | Assessment |
| --- | --- |
| 1 | Selected point PASS through the named public journeys. Whole clause remains partial because points 1–4 and 6–8 are not qualified here. |
| 2 | PASS for selected point: real seeded data, both unsafe refusals and allowed choices, independent exact values and no mutation survival in the four exercised cases. |
| 3 | Exact-SHA local proof is recorded. The final Verify observation is recorded in receipt.json and the CI section below; no earlier SHA is substituted. |
| 4 | PASS for selected point: final API, probe and browser runs bind to the committed candidate; no relevant source bytes changed. |
| 5 | No new inheritance claim or duty. Existing MONEY-004 and MONEY-005 boundaries remain. |
| 6 | Selected evidence and Gap updated; generator write and check pass before restoring views. Whole-clause provenance remains unchanged because this is not a complete judgment. |
| 7 | PASS: acceptance text unchanged, no ct policy rewrite or lost row. |
| 8 | PASS for touched authority paths: technician and Office refusals and cross-branch site refusal change nothing; this candidate adds no authority. |
| 9 | PASS: no live tax-provider or legal boundary is claimed. Selected-point probe makes zero tax-provider calls. |
| 10 | No policy default adopted. |
| 11 | Branch custody only. Publication scan, generated landing views, guarded landing, exact-main equality and Run site remain fleet gates. No landing count claimed. |

Pre-ready: selected-point outcomes are asserted through public doors and four representative breaks fail; existing assertions remain; no authority, credential, erasure or replay implementation changed. No new controls or screen styling are introduced. The exercised selectors have visible labels and controls have text. The 1440 and 390 proof shows both refusal states, both selected jurisdictions and both quote results without horizontal overflow. Source lock is fresh. Publication scanning is not available in this cloud task and is not claimed complete; the fleet must run its complete full-history scan and landing checks.

## CI and custody

Main baseline Verify 42151113949 and Run site 42151113801 were completed successfully on acfdd944a4356002ad6a1d27707cc68c32ce0730. These are baseline health, not candidate proof.

Candidate Verify: 42158688487, push event, exact SHA bc0a5755a83da6f20d4ab441d755a2b560095960. Final observation is appended before evidence publication.

The named product branch was pushed successfully on the first guarded attempt. Identity and trailer checks covered every candidate commit, including side parents. The candidate is one new fleet-authored commit; no published history was rewritten. No PR or default-branch push was made.

The complete actual packet is returned only on refs/heads/evidence/sx-glove-c-f112. Evidence publication is not acceptance or landing.
