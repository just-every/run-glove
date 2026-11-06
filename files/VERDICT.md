# QUOTE-007 original exact-source verdict

**Verdict: ACCEPT ON LANDING.** All eight original substantive acceptance outcomes pass in the focused native API journey at the pinned source. The functional browser journey also passes. No product acceptance, status award, source protection readback, release or landing is performed by this report. The distinct source CT-review protection is still unresolved and the exact-chain CT hold remains ACTIVE. This is a conditional product-scope judgment, not protected final admission.

## Identity and authority

- Replacement tag: ct-judge-glove-quote007-20261105-1932-sol1; original commission: ct-judge-glove-quote007-20261105-1932.
- Actual reviewer execution: GPT-6.1 Sol, xhigh, Codex subscription, under the supplied strategy authority dated 2026-11-06T01:26Z. No paid API, usage credits, additional judge session or delegated agent was used.
- Repository: just-every/run-glove. Original source branch: cloud/sx-glove-c-f74. Exact source: `aaab546b493eff3fad3be08bbab11d631aae22be`.
- Disposable shallow filtered checkout was detached at that source. Remote readback still names the same source branch head. Fresh main readback: `786ecbc4d54e2125f3e96589ecc40f57962825ee`.
- Scope: one clause, QUOTE-007. QUOTE-019, the MONEY clauses, DATA-002, FIELD-003 and MONEY-003 receive no separate status judgment or promotion.
- Only the inline common judge rules, DONE riders and original contract excerpt were used as fleet references. No INBOX.md, STATE.md, private gate material, old private report or Mac receipt path was read. The supplied brief states no earlier exact-source CT judgment; no earlier independent report was reused.
- Category, buyer and competitors below come exclusively from pinned CONTRACT.md.

| Contract field | Pinned value |
| --- | --- |
| Category | Field service management for home and commercial service trades |
| First buyer | The owner or dispatcher of a US plumbing, HVAC, electrical or other service-trade business with 2 to 25 technicians, moving from another field-service system; USD, US sales tax, card and ACH, one or more US time zones, QuickBooks Online books, the owner's own Cloudflare account |
| Incumbents | Jobber, Housecall Pro, ServiceTitan |
| Up-and-comers | FieldPulse, Workiz |

## Clause table

| Clause | Journeys and public doors | Acceptance and inherited duties | Exact-source Verify and judgment |
| --- | --- | --- | --- |
| QUOTE-007 — Discounts on quotes and invoices | `tests/api/discounts.test.mjs` — Owner discounts retain exact rounding, boundaries, ordered allocation, authority and downstream figures. Real production Glove and auth HTTP handlers, native sessions and migrated D1 through POST /api/glove/commands; authenticated state, export, Activity, invoice CSV, mapped QuickBooks JSON, reports and job-cost GET doors. `tests/browser/discounts.spec.ts` — QUOTE-007, QUOTE-019 owner gives a document discount with a discount line and sees the allocation on the quote, invoice, price book and role limits at 1440 and 390. Real rer setup and dev app; the page's API requests route to the independently seeded native Worker fixture. | All original APs 1–8; written MONEY-001, MONEY-004 and MONEY-005 tax classification and retained snapshot duty; DATA-002 attribution for the new pricing and correction effects; original requested riders 1–11 and RL-5. | Local API 1 passed, local browser 1 passed, ten screenshots. Source push Verify 42088688000 is supplied as failed only on generated-view freshness, with API, browser and portable shards SUCCESS. Accepted only under the assignment's CANDIDATE exception; not independently polled and not full final green. ACCEPT ON LANDING; riders 3 and 11 retain their exact-final duties and source custody stays held. |

## Full original clause at the pin

#### QUOTE-007 — Discounts on quotes and invoices

*Tier:* Core · *From:* QUOTE-007

**Requirement.** Discounts on quotes and invoices supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-007-operating-rules) retain the record formats and calculations. Recorded decisions: RL-5.

**Acceptance.**
1. A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) with a $50.00 non-taxable first-time-customer discount line and a 10% document discount, and checks subtotal $650.00, discount $65.00 taken from labor, tax $33.00 and total $618.00; a 50% document discount on the same lines spills $75.00 onto the parts and gives tax $26.81 and total $351.81; the accepted figures are identical to the cent on the job, the invoice, the CSV and the explicitly mapped QuickBooks inspection payload.
2. A discount line is a line whose unit price is negative (-50.00), custom or from a price-book item of kind discount (a fixed negative price, no cost); its line total rounds half a cent away from zero.
3. Each line is taxable or non-taxable as `MONEY-001, MONEY-004, MONEY-005` decides (item flag, labor rule, exemption); discount lines may not take either pool below zero.
4. The document discount is a percent of the subtotal (above 0 to 100, two places, amount rounded half up to the cent) or a fixed dollar amount, never above the subtotal, with a reason up to 100 characters.
5. It comes off the non-taxable lines first (line order, each line at most its own amount), then taxable lines in line order; tax is the jurisdiction rate on the remaining taxable cents, rounded half up once, and the total is subtotal − discount + tax.
6. Each quote option carries its own discount; add-ons take discount lines only; on acceptance the chosen option's discount applies to the accepted lines (a percent re-applies to their subtotal, an amount stays fixed).
7. The job and invoice carry it; an invoice revision or correction keeps it unless the payload sets another.
8. The CSV writes the discount as up to two rows (non-taxable and taxable amounts); the QuickBooks inspection payload writes a DiscountLineDetail with tax after discount and both amounts in its description; revenue reports and job costing use subtotal less discount.

## Original frozen rubric, reproduced verbatim

D = `tests/api/discounts.test.mjs`. These are the supplied original IDs and mappings, not a new checklist. Line mappings are kept exactly as commissioned.

| ID | Original frozen item | Score and observed outcome |
| --- | --- | --- |
| A1 | D:27–76,361–395 named examples and downstream parity | MET. 10% yields subtotal 650.00, discount 65.00, tax 33.00, total 618.00; 50% yields non-taxable 250.00, taxable 75.00, tax 26.81 and total 351.81. Accepted jobs, approved invoices, all CSV columns and explicitly mapped QuickBooks inspection match the independently stated cents. |
| A2 | D:107–137 negative-line rounding and catalogue custody | MET. Catalogue discount is fixed, negative and has zero cost; positive, zero and markup discount edits refuse. Custom and catalogue fractions 0.499, 0.5, 0.501 and 1.5 of a cent retain the expected rounding, including the half-cent away from zero. |
| A3 | D:257–299 tax treatment and unchanged pool refusals | MET. Native item flags, switched labor taxation, actual certificate attachment and inclusive expiry select the pools; taxable and non-taxable pool underflows refuse on draft and revision without altering populated exported state or Activity. Boundary-zero pools and retained exemption snapshots survive Worker restart. |
| A4 | D:160–198 discount boundaries | MET. Fixed and percent values include both decimal places, upper limits and exact subtotal caps; zero, negative, above-cap, numeric, over-precision and missing or oversized reasons refuse unchanged. A 100-character reason is retained. |
| A5 | D:138–176 ordered allocation and tax rounding | MET. Interleaved pools give non-taxable lines first, then taxable lines in their own line order with per-line caps. 2.64% of 0.19 rounds to 0.01; 50% rounds to 0.10; the 2.00 taxable basis produces 0.17 tax, rounded once rather than twice. |
| A6 | D:302–324,361–375 option and add-on inheritance | MET. Independent options retain 90%, 10% and fixed 50.00 discounts. The chosen 10% option plus net 80.00 add-on recalculates on 730.00 to 73.00; the fixed choice stays 50.00. Negative add-on lines work; add-on document discounts refuse unchanged for both draft and revision. |
| A7 | D:397–443 correction retention and replay | MET. Native job and invoice inherit the accepted discount; correction and revision retain it when omitted, replace it when explicitly set, and remove it on null. Separate approvals and correction exports retain earlier revision records and byte-identical original CSVs. Stale, wrong revision, wrong state and unauthorized attempts refuse unchanged. A replay after real Worker restart adds no correction and rewinds nothing. |
| A8 | D:56–76,337–395,417–440 CSV, QuickBooks, revenue and costing | MET. CSVs contain one or two exact discount rows. Mapped QuickBooks inspection has DiscountLineDetail for percentage and amount, ApplyTaxAfterDiscount true and both amounts in the description. Native revenue and costing use net prices 325.00, 585.00, 657.00 and 680.00; aggregate 2247.00 becomes 2567.00 only after the approved correction. An unapproved revision cannot replace approved revenue. |

Score: **8 MET, 0 UNMET, 0 NOT RUN rubric items.** The one API sanity journey ran once and covers all eight; the existing browser journey ran once. Reading-only money or authority proof was not used as PASS.

## Inherited written duties and boundaries

| Original duty | Assessment |
| --- | --- |
| MONEY-001, MONEY-004, MONEY-005 named in QUOTE-007 AP3 | MET for this clause's delta. The executed discount journey uses configured jurisdiction rate 8.25%, item flags, labor treatment and certificate evidence before allocating, retains the selected tax context and exact accepted figures through downstream documents and real restart. The MONEY clauses remain partial; their whole existing requirements and Gaps are not transferred to this clause. No optional lookup, provider connection, tax filing, legal or real-account qualification is claimed. |
| DATA-002 attribution, D:234–239,444–453 | MET for the relied-on pricing, acceptance, invoice and export effects. Authenticated Activity and portable business export retain native command id, subject, actor id, actor name, actor role and fixture time; replay adds no event or changed record. Existing DATA-002 overall scope, changed-record details and unrelated capability obligations remain with DATA-002 and its carriers. |
| Existing RL-5 | MET for this clause. Its negative custom or catalogue line, fixed price, zero cost and half-cent away-from-zero semantics are unchanged and executed. No new default, ruling, Base obligation or broader authority policy was adopted. |
| Mapped inspection versus live accounting | The actual assertion opens the local explicitly mapped QuickBooks JSON. It is not a provider post, sync, discovery, refresh or provider acceptance receipt. Those duties remain in LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007 and LEDGER-004. |

## All eleven originally requested riders

| Rider | Score | Basis and retained duty |
| --- | --- | --- |
| 1 — native outcomes | MET at source under permitted CANDIDATE exception | One end-to-end native discount API journey reaches and observes every AP; browser observes the allocation, invoice, catalogue and configured role limit. Actual local commands pass on the pin. |
| 2 — exact seeded figures and unsafe refusals | MET | Independently written expected cents, nonempty retained business export snapshots, allowed and refused price paths, zero-pool boundaries, real users, corrections, restart and replay. No expected result is computed from a second product projection. |
| 3 — exact-SHA Verify | CANDIDATE EXCEPTION; final duty PENDING | Supplied source push Verify 42088688000: generated-view freshness failure only, API, browser and portable SUCCESS. Checked workflow wiring loads the API glob and browser runner on push. No polling, rerun, dispatch or claim of full-green final runtime. The final integration must actually execute its complete exact-final Verify including these journeys. |
| 4 — exact-head proof | MET | Checkout HEAD and remote source readback both equal aaab546b493eff3fad3be08bbab11d631aae22be. Local API and browser ran this tree. Setup's incidental generated route-tree write was restored before the focused checks; final tracked diff is empty. |
| 5 — written inheritance | MET | AP3 explicitly names MONEY-001, MONEY-004 and MONEY-005. Existing DATA-002 duty is retained as commissioned and asserted for the relied-on new effects. No unrecorded new Base inheritance or transfer of later-clause obligations. |
| 6 — generator, counts and provenance | MECHANICAL PENDING, not substantive refusal | Pinned source lock check passed. Original generator check exits 1 only for ACCEPTANCE.md. In an isolated copy, write --clauses QUOTE-007 and check --clauses QUOTE-007 both pass. Views, summary and global provenance are left to the existing lander. Fresh-main complete rows are preserved in the evidence packet. |
| 7 — unchanged acceptance and original obligations | MET by inspection; integration preservation PENDING | Full normative CONTRACT prefix is byte-identical to current main; all 263 clauses parse. No acceptance or RL-5 edit is proposed. CONTRACT-STANDARD.md remains absent. Newer-main MONEY-003 and FIELD-003 qualifications and their newer journeys must be retained, not overwritten by the older source tree. |
| 8 — authority, stale, wrong-state and replay | MET | Native allowed owner and delegated office operations complete; viewer and other disallowed roles refuse price changes, withdrawn owner authority cannot replay a prior success, stale versions, wrong approval revision, wrong correction state and changed replay payloads refuse without changing populated state. One journey covers the correction verbs, without adding per-verb tests. |
| 9 — honest tax and provider boundary | MET | Native configured-tax calculation and mapped inspection only. Real provider, production, legal and device acceptance is not claimed. Existing external holds remain. |
| 10 — policy default | MET by inspection | Existing RL-5 remains the recorded decision; no policy default, custody ruling or new source acceptance is adopted. |
| 11 — guarded landing | PENDING | No integration in this read-only task. Exact-final full-green runtime Verify, COMPLETE full-history publication scan NEW 0, guarded landing, main equality and exact resulting main Run site remain required. No canceled duplicate, earlier SHA, source candidate exception or report READY can satisfy those final requirements. |

Riders 6 and 7 are mechanical work for integration, never a standalone product FIX. No substantive frozen item failed and no NEW correctness, introduced data-loss, exposure or regression finding was established in this focused review. This is not a full publication scan, full-suite result or a claim of COMPLETE NEW 0.

## Actual executions and receipts

Every focused execution used Node v22.20.0 and pnpm 10.12.4 after sourcing the supplied cloud toolchain. The toolchain's initial shell diagnostic reports VM Node v24.19.0; the focused commands explicitly put the repository's rer-acquired v22.20.0 runtime first. Long-running commands used cloud_run. Browser uses /usr/bin/chromium and the existing configuration's --no-sandbox argument.

| Command | Exit | Actual result |
| --- | ---: | --- |
| git clone --depth 1 --filter=blob:none --no-checkout --branch cloud/sx-glove-c-f74 https://github.com/just-every/run-glove.git <disposable-clone> | 0 | Detached checkout aaab546b493eff3fad3be08bbab11d631aae22be; local fleet identity configured immediately after clone. |
| pnpm install --frozen-lockfile | 0 | Frozen dependencies installed. |
| cloud_run npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive | 0 | Local-only setup, build, migrations and owner bootstrap; private entry material excluded from the packet. Incidental src/routeTree.gen.ts generation restored before testing. |
| cloud_run env WRANGLER_SEND_METRICS=false node --test --test-concurrency=1 tests/api/discounts.test.mjs | 0 | 1 test passed, 0 failed, skipped or cancelled; 12.57 seconds; 2026-11-06T02:03:43Z to 02:03:55Z. |
| cloud_run pnpm typecheck | 0 | TypeScript build check passed. |
| cloud_run env PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium GLOVE_BROWSER_OUTPUT=<task>/browser-output GLOVE_SCREENSHOTS=<packet>/screenshots node tests/browser/run.mjs discounts.spec.ts | 0 | 1 test passed; its own timing 13.1 seconds, including 9.5-second test; owned fresh install, public site build, setup and dev wrapper completed 02:04:01Z to 02:05:17Z. |
| node scripts/edition-authoring/cli.mjs check | 0 | Pinned source lock matches. |
| node scripts/contract-docs.mjs check --clauses QUOTE-007 | 1 | Only ACCEPTANCE.md differs. Expected generated-view exception; no product file rewritten. |
| node scripts/contract-docs.mjs write --clauses QUOTE-007, followed by check --clauses QUOTE-007 in isolated scratch | 0, 0 | Wrote one generated view; check current. Scratch removed. |
| parseContract on entire source and fresh-main CONTRACT.md | 0 | 263 clauses each; entire normative prefix unchanged. |
| git diff --exit-code and git status --porcelain | 0 | Clean tracked source after local setup restoration. |
| git ls-remote origin refs/heads/main refs/heads/cloud/sx-glove-c-f74 | 0 | Source aaab546b493eff3fad3be08bbab11d631aae22be; main 786ecbc4d54e2125f3e96589ecc40f57962825ee. |

Actual command receipt files and complete non-secret command logs accompany this verdict. The original gate sx-glove-c-f74-gate-1 exit0 GATE PASS at 2026-11-05T19:26:00Z and source Verify 42088688000 are supplied facts from the brief, not newly run or independently fetched receipts. GitHub API calls by this review: 0. CI polls, retries, dispatches and provider operations: 0.

Browser artifacts: revise-form, quote-allocation, invoice-allocation, role-limits and price-book-discount, each once at 1440×1050 and 390×1050. Ten regular PNG files are included. The functional assertion sees the exact 50% allocation and 351.81 total on quote and invoice; screenshot inspection confirms those figures at both widths. No visual-quality judgment is assigned or made. The browser UI calls real native command handlers through the harness routing; this is not a live-provider or production installation receipt.

## Every NOT RUN and unmet external boundary

- Full API or baseline suite, portable suite, unrelated price-book and service-report journeys: NOT RUN because this is a bounded focused original judgment; the supplied gate and source Verify context do not substitute for the future full exact-final run.
- CI discovery, polling, log download, rerun and dispatch: NOT RUN, expressly prohibited by this reviewer assignment. Source run 42088688000 is the only cited CI run; none is newly created.
- Mutation campaigns, per-point new tests and fault injection: NOT RUN, expressly excluded. Existing native allowed and refused paths executed once.
- Real accounting-provider posting, connection discovery, OAuth refresh, tax lookup, tax filing, production deployment and paid model calls: NOT RUN; not the mapped-inspection claim. Any account-dependent qualification stays UNMET-EXTERNAL, with all existing provider and account holds retained.
- Native mobile apps, physical devices, another seed's API and owner-account Cloudflare runtime: NOT RUN; no such acceptance is part of this scoped source judgment and no missing external material is treated as locally proven.
- Private frozen held-out material and inaccessible private Mac receipts: NOT READ or RUN; only supplied context is stated. No new held-out definitions or broader rubric rows were invented.
- Distinct source and exact-chain CT protection mutation or readback: NOT RUN; assignment read-only. Source additive review duty remains unsupported alongside existing f66 stack, exact-chain hold ACTIVE. This report cannot waive or supply that support.
- Full-history publication scan: NOT RUN in cloud. complete=false, historyScanned=false; no NEW 0 publication assertion.
- Merge, source acceptance, promotion, product push or PR, protected final admission, final main equality and exact-main Run site: NOT RUN. Those are retained guarded integration duties.

## Status, complete Gaps, counts and proposed flip

| Basis | Done | Partial | Missing | Award |
| --- | ---: | ---: | ---: | --- |
| Fresh main 786ecbc4d54e2125f3e96589ecc40f57962825ee | 7 | 227 | 29 | Actual unchanged main |
| Pinned candidate CONTRACT | 8 | 226 | 29 | Builder proposal, not awarded |
| This read-only judgment | 7 | 227 | 29 | Actual counts remain unchanged |
| Single possible QUOTE-007 award after all guards | 8 | 226 | 29 | Conditional +1 done, −1 partial, 0 missing; never add concurrent proposals |

All totals are 263. Pinned generated ACCEPTANCE.md still reports 7 done, 227 partial, 29 missing despite the source proposal; the isolated generation resolves that mechanical difference. No view is committed.

Exact proposed permitted flip, only when custody and landing permit it: retain the complete current-main contract and change QUOTE-007 from partial to done, use the pinned candidate's named API and browser journey Evidence cell plus this source-and-report provenance, and set that clause's Gap to empty. There are no failing rubric rows to write into a new product Gap. Until admission, leave main's full existing QUOTE-007 Gap and Evidence unchanged; their exact full text is retained in fresh-main-status.json. The review proposes ACCEPT ON LANDING, never an immediate DONE award.

Current-main preservation is substantive: the comparison identifies newer qualifications for MONEY-003 point 4 and FIELD-003 point 1. Preserve BOTH their Status AND complete Gap, Evidence, provenance and newer assertions, including the newer price-book and service-report journey bodies. The older exact source must not replace those current-main rows or tests. The full main rows, not shortened excerpts, are retained in fresh-main-status.json and main-preservation.md.

Existing lifetime FIX totals and all provider, device, account, Base, runtime-pin, adoption and release boundaries remain unchanged. No product FIX was requested or made by this review. Rows 6 and 7 do not create standalone product FIX work. CONTRACT-STANDARD.md stays absent; no structural rewrite, source pin, hold, release, readmission, submission, adoption or lifecycle change is authorized here.

## Required custody and final integration guards

1. The installed strategy source-lineage and hold custodian must supply supported distinct protections for original sx-glove-c-f74 and sx-glove-c-f74-land with readback before any source acceptance or protected final admission. The existing source f66 stack alone is not that distinct source CT duty. Exact-chain hold remains ACTIVE; this verdict does not release it.
2. Only the original gate and lander families integrate. No second resolver, tool writer or canonical edit is commissioned. Preserve exact original lineage and every newer-main Status, complete Gap, Evidence, provenance and assertion. Re-derive counts from actual main when integrating; do not sum concurrent proposals.
3. Resolve CONTRACT.md first, retain newer-main judgments and unrelated prose, then use documented generator write and check including touched clause QUOTE-007. Name the judged source and this report in provenance. The Mac lander owns generated views. Regenerate source lock LAST and run its check.
4. Actually execute the complete runtime Verify at the exact final integrated SHA, including the relied-on public journeys, and require full green. The source generated-view CANDIDATE exception is not a final runtime waiver.
5. Require COMPLETE full-history publication scan NEW 0, guarded landing with main equality and exact resulting main Run site. Retain every original stack, provider, CT, account, adoption, runtime and release hold.

No source acceptance, count award or landing is granted before those conditions. The report completion marker READY means only that this single authorized read-only judgment and evidence return are complete.
