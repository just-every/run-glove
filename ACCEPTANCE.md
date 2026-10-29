<!-- Generated from CONTRACT.md by contract-docs. Edit CONTRACT.md, then regenerate. -->

# Accept a Glove installation

The primary journey: Capture the customer request, quote and book the work, dispatch the technician, complete the job through lost signal, invoice and collect payment, reconcile the books and schedule recurring maintenance.

## Progress

| Tier | Done | Partial | Missing | Total |
| --- | ---: | ---: | ---: | ---: |
| Core | 4 | 217 | 16 | 237 |
| Agent surface | 0 | 13 | 13 | 26 |
| Later | 0 | 0 | 0 | 0 |
| Full target | 4 | 230 | 29 | 263 |

Judged from the code and tests at commit `a38248e45e342b14c9adb9d7f1a88148a790c5c8` (21 October 2026). Field proof register: 22 rows; 0 passed, 0 failed, 22 not run.

## Core

### First release clauses

#### GLOVE-01 — Set up the business and its people

Core · published · **partial** · Cites BASE-ACCESS-001, BASE-ACCESS-002, BASE-ROLE-001

**Requirement.** The owner records the business (name, tax identifier, booking time zone, payment terms), a price book of services with prices before tax and their job checklists (items marked required or not), and the technicians; invites people and gives each one role; links a technician to the person who signs in. US identifiers and US sales tax are `MONEY-001, MONEY-004, MONEY-005` and `MONEY-002`. The [operating rules](docs/service-work-rules.md#glove-01-operating-rules) retain the record formats and calculations.

| Role | Service-work allocation |
| --- | --- |
| Owner | Business settings, staff, provider connections and every desk job. |
| Dispatcher | Customers, requests, quotes, job creation, booking, moves, conflict and late-evidence decisions, customer messages. |
| Office | Customers, requests and service calls, included-agreement booking, invoice preparation, approval, sending, export and correction, collection and customer messages. Repair booking and visit moves remain dispatch work. |
| Technician | Assigned field work, time, equipment and capture without desk prices, plus separately granted field quoting and collection capabilities. |
| Subcontractor | Currently assigned visits and their bounded contact, site, checklist, form and capture view, with no desk pricing or other workers’ work. |
| Agent | The named sponsor’s service-work authority intersected with its scoped grant; the company policy decides the tool’s computed classes. |
| Viewer | The permitted desk reads. |

**Acceptance.**
1. The business name, tax identifier, booking zone and payment terms survive reload.
2. Services keep before-tax prices and required or optional checklist items; technicians retain their linked sign-in.
3. An invited person has the role the owner assigned.

**Evidence.** `tests/api/flows.test.mjs`, `tests/api/security.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The business name, tax identifier, booking zone and payment terms survive reload.; point 2 — Services keep before-tax prices and required or optional checklist items; technicians retain their linked sign-in.; point 3 — An invited person has the role the owner assigned. See docs/contract/DONE-AUDIT.md for each named outcome.

#### GLOVE-02 — Customers and sites

Core · published · **partial**

**Requirement.** The desk records customers (contact, email, billing address) and the sites where work happens, with access notes. Edits apply only to the version the person saw. The [operating rules](docs/service-work-rules.md#glove-02-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A customer retains contact, email and billing address, with several sites and their access notes.
2. A stale edit cannot replace a newer version.

**Evidence.** `tests/api/flows.test.mjs`
**Gap.** The audit records 1 separately asserted outcome(s). Complete proof is not located for point 1 — A customer retains contact, email and billing address, with several sites and their access notes.; point 2 — A stale edit cannot replace a newer version. See docs/contract/DONE-AUDIT.md for each named outcome.

#### GLOVE-03 — Request to an approved quote

Core · published · **partial**

**Requirement.** A request becomes a quote of priced lines (from the price book or custom) with tax computed exactly. A person approves one exact revision's price. Any price change is a new revision that needs its own approval; earlier revisions and approvals stay on the record. The [operating rules](docs/service-work-rules.md#glove-03-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A request produces priced lines from the price book or custom work, with exact tax.
2. The approved price belongs to one exact revision; a price edit requires a new approval and keeps the earlier revision and decision.

**Evidence.** `tests/api/flows.test.mjs`
**Gap.** The audit records 3 separately asserted outcome(s). Complete proof is not located for point 1 — A request produces priced lines from the price book or custom work, with exact tax.; point 2 — The approved price belongs to one exact revision; a price edit requires a new approval and keeps the earlier revision and decision. See docs/contract/DONE-AUDIT.md for each named outcome.

#### GLOVE-04 — The customer's answer, recorded honestly

Core · published · **partial**

**Requirement.** A person records how the approved quote went out (email, printed, in person, phone) without any delivery claim, and records the customer's acceptance or decline of the current revision: who answered, how (signed, email reply, phone, in person) and who recorded it. An accepted quote is frozen. The customer-link door in `QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013` shares the first-decision-wins revision freeze; online signing remains gated on the owner’s accepted consent disclosure. The [operating rules](docs/service-work-rules.md#glove-04-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The recorded send retains its method and recorder without claiming delivery.
2. The customer answer retains the current revision, claimed customer, answer method and actual recorder.
3. An accepted revision is frozen and cannot be decided again.

**Evidence.** `tests/api/flows.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The recorded send retains its method and recorder without claiming delivery.; point 2 — The customer answer retains the current revision, claimed customer, answer method and actual recorder.; point 3 — An accepted revision is frozen and cannot be decided again. See docs/contract/DONE-AUDIT.md for each named outcome.

#### GLOVE-05 — Book and assign the visit

Core · published · **partial**

**Requirement.** An accepted quote becomes one job carrying the accepted lines and the checklist from its services. The dispatcher books visits for a technician at local times in the business time zone. A booking that overlaps another visit for that technician is refused until the dispatcher reviews those exact conflicts and confirms. The [operating rules](docs/service-work-rules.md#glove-05-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. An accepted quote creates one job with exactly its accepted lines and service checklist.
2. A technician booking retains the chosen local date and time in the business zone.
3. An overlap is refused until the dispatcher confirms the exact conflicts reviewed.

**Evidence.** `tests/api/flows.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 2 separately asserted outcome(s). Complete proof is not located for point 1 — An accepted quote creates one job with exactly its accepted lines and service checklist. See docs/contract/DONE-AUDIT.md for each named outcome.

#### GLOVE-06 — Field capture through a connectivity interruption

Core · published · **partial** · Cites BASE-INPUT-003

**Requirement.** On a phone, the assigned technician records arrival, checklist results (done, or not applicable with a reason), notes, photos and materials. Each item is kept on the phone with its capture time until the server confirms it; resending after a lost signal lands it exactly once. Photos are stored as received and readable only by people allowed to see that job. The [operating rules](docs/service-work-rules.md#glove-06-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The assigned technician captures arrival, checklist results, notes, photos and materials with their capture times.
2. A resend after a lost response returns the recorded outcome and produces one copy of each capture.
3. Original photo bytes remain readable by the assigned technician and unavailable to an unrelated technician.

**Evidence.** `tests/api/flows.test.mjs`, `src/ui/outbox.ts`
**Gap.** The audit records 3 separately asserted outcome(s). Complete proof is not located for point 1 — The assigned technician captures arrival, checklist results, notes, photos and materials with their capture times. See docs/contract/DONE-AUDIT.md for each named outcome.

#### GLOVE-07 — Dispatch change with conflict review

Core · published · **partial**

**Requirement.** The dispatcher changes a visit's technician, date or time with a reason. The change is refused if the visit changed since they opened it, and must be reviewed when it overlaps another visit or the technician has already recorded evidence on it. Evidence that arrives from a technician after the visit moved on is kept, flagged on the visit, and reviewed by the dispatcher. Every change keeps its before and after on the record. A new technician records their own arrival; the earlier arrival stays as evidence. The [operating rules](docs/service-work-rules.md#glove-07-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A move retains technician, date, time, reason and before/after assignment history.
2. A stale move is refused; overlapping work or existing field evidence requires review of the exact conflicts.
3. Evidence arriving after reassignment is retained and flagged for review; a new assignee records a new arrival without replacing the earlier one.

**Evidence.** `tests/api/flows.test.mjs`
**Gap.** The audit records 3 separately asserted outcome(s). Complete proof is not located for point 1 — A move retains technician, date, time, reason and before/after assignment history.; point 2 — A stale move is refused; overlapping work or existing field evidence requires review of the exact conflicts. See docs/contract/DONE-AUDIT.md for each named outcome.

#### GLOVE-08 — Customer completion evidence

Core · published · **partial**

**Requirement.** The technician completes a visit only after recording their arrival, and completes the job only when every required checklist item is done or not applicable with a reason. Completion carries a work summary and either the customer's name and drawn signature or why the customer could not sign. The [operating rules](docs/service-work-rules.md#glove-08-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Completion refuses a missing arrival or an unanswered required checklist item.
2. A completed job retains its work summary and the customer name and drawn signature, or the recorded reason for a missing signature.

**Evidence.** `tests/api/flows.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Completion refuses a missing arrival or an unanswered required checklist item.; point 2 — A completed job retains its work summary and the customer name and drawn signature, or the recorded reason for a missing signature. See docs/contract/DONE-AUDIT.md for each named outcome.

#### GLOVE-09 — Invoice preparation, export and correction trail

Core · published · **partial**

**Requirement.** For a completed job, the office prepares an invoice from accepted lines and recorded materials priced from the price book, explicitly prices unpriced materials, approves an exact revision and exports each approved revision once in Xero sales-invoice import columns. An exported invoice is immutable; a correction identifies the corrected revision and export, receives its own approval and exports as a separately numbered row. Sending, payment and live synchronization retain their PAY and LEDGER clauses. The [operating rules](docs/service-work-rules.md#glove-09-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The draft includes accepted lines, priced materials and explicitly priced unpriced materials.
2. The office approves one exact revision and exports each approved revision once in the accounting import format.
3. A correction retains the earlier export and revision, receives its own approval and exports as its own numbered row, including when revised before approval.
4. Fixed-monthly invoices retain the issue, approval and due-date basis governed by PLAN-013.

**Evidence.** `tests/api/flows.test.mjs`, `tests/api/records.test.mjs`
**Gap.** The audit records 4 separately asserted outcome(s). Complete proof is not located for point 1 — The draft includes accepted lines, priced materials and explicitly priced unpriced materials.; point 2 — The office approves one exact revision and exports each approved revision once in the accounting import format.; point 3 — A correction retains the earlier export and revision, receives its own approval and exports as its own numbered row, including when revised before approval.; point 4 — Fixed-monthly invoices retain the issue, approval and due-date basis governed by PLAN-013. See docs/contract/DONE-AUDIT.md for each named outcome.

#### GLOVE-10 — Agent preparation under company policy

Core · published · **partial**

**Requirement.** An agent prepares quote drafts, dispatch proposals (job, technician, time, rationale, evidence) and invoice drafts through the same public commands. Quote preparation and reversible dispatch or invoice drafting carry standard; binding quote or invoice decisions carry commitment, customer disclosures carry external and collection carries money. The company’s policy decides those calls. After a person decides an agent-prepared action, the record identifies that person’s decision and the agent’s preparation separately. The [operating rules](docs/service-work-rules.md#glove-10-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Under the held company policy, the agent prepares quotes, dispatch and invoices; the person the policy names decides the saved revision and the record distinguishes preparation from decision.

**Evidence.** `tests/api/flows.test.mjs`, `tests/api/security.test.mjs`
**Gap.** Old evidence asserts agent quote preparation and dispatcher-decided quote/dispatch proposals. It does not assert an agent-prepared invoice, its person decision or its attribution, despite the old test title. Company-selected standard, commitment, external and money decisions and the held-policy saved-revision journey are unasserted; fixed Agent-role refusals are not company-policy proof. The audit records 1 separately asserted outcome(s). Complete proof is not located for point 1 — Under the held company policy, the agent prepares quotes, dispatch and invoices; the person the policy names decides the saved revision and the record distinguishes preparation from decision. See docs/contract/DONE-AUDIT.md for each named outcome.

#### GLOVE-11 — Move in from the first source system with dry run, journal and undo

Core · published · **partial**

**Requirement.** The owner previews the first-source move-in of clients, contacts, staff, jobs, activities, materials and attachments, including merges, rejected or unused records and missing files. Commit applies the exact reviewed preview with source identifiers and original files. Repeating unchanged input has no effect; Undo removes exactly the imported records and refuses when later work depends on them or an imported record changed. Every other move-in kit inherits this journey. The [operating rules](docs/service-work-rules.md#glove-11-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The preview identifies each source record’s destination, merge, rejection with location and reason, unused record and missing attachment.
2. Commit applies the reviewed preview with source identifiers and exact received files.
3. An unchanged repeat writes nothing; undo removes exactly the imported effects and refuses changed records or later dependent work.

**Evidence.** `tests/api/flows.test.mjs`, `tests/api/movein.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The preview identifies each source record’s destination, merge, rejection with location and reason, unused record and missing attachment.; point 2 — Commit applies the reviewed preview with source identifiers and exact received files.; point 3 — An unchanged repeat writes nothing; undo removes exactly the imported effects and refuses changed records or later dependent work. See docs/contract/DONE-AUDIT.md for each named outcome.

#### GLOVE-12 — The whole timeline, exported and restorable

Core · published · **partial** · Cites BASE-DATA-001, BASE-BACKUP-001

**Requirement.** Every job shows its timeline: each step, who did it in which role, with which command. The owner or office downloads the business as JSON. rer export and rer import move the complete installation (records, timeline, photos and signatures, command outcomes, move-in journal and originals) into a fresh checkout, which keeps working; a session from the old installation does not open it. The [operating rules](docs/service-work-rules.md#glove-12-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The job timeline retains every step, actual person, role and command, including after hundreds of later events.
2. The business download includes that timeline.
3. Restoring the installation preserves the service records, captures, signatures, command outcomes, move-in journal and original bytes, and the service journey works there.
4. A session from the old installation cannot open the restored one.

**Evidence.** `tests/api/flows.test.mjs`, `tests/api/records.test.mjs`, `tests/portable.mjs`
**Gap.** The audit records 4 separately asserted outcome(s). Complete proof is not located for point 1 — The job timeline retains every step, actual person, role and command, including after hundreds of later events.; point 2 — The business download includes that timeline.; point 3 — Restoring the installation preserves the service records, captures, signatures, command outcomes, move-in journal and original bytes, and the service journey works there. See docs/contract/DONE-AUDIT.md for each named outcome.

### Foundation

#### HTTP-001 — Foundation HTTP routing

Core · published · **partial** · Cites BASE-OPS-001

**Requirement.** The foundation routes health checks, product API requests and document reads to their declared handlers. The [operating rules](docs/service-work-rules.md#http-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Health, product API and document requests reach their declared handlers; an unknown route returns a missing-page response.

**Evidence.** `tests/runtime.mjs`
**Gap.** The audit records 2 separately asserted outcome(s). Complete proof is not located for point 1 — Health, product API and document requests reach their declared handlers; an unknown route returns a missing-page response. See docs/contract/DONE-AUDIT.md for each named outcome.

### US business and money

#### MONEY-001 — US dollars and sales tax

Core · target · **partial** · From MONEY-001

**Requirement.** US dollars and sales tax supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#money-001-operating-rules) retain the record formats and calculations. Recorded decisions: RL-2.

**Acceptance.**
1. A fixture sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites in each and for an exempt customer, and checks exact cents and the per-jurisdiction breakdown on the quote, invoice, export and explicitly mapped downloadable QuickBooks Online inspection payload (no sync); LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007 and LEDGER-004 carry the actual transport and provider-fake assertion; the `REPORT-002, REPORT-004` sales-tax report matches the invoices' tax by jurisdiction to the cent.
2. The scenario sets different branch tax jurisdictions, checks each branch’s quote/invoice/export/provider tax, and narrows the REPORT-002, REPORT-004 tax rows to one branch.
3. New installations default to USD and unsaved booking zones to America/Chicago; an existing business retains its saved currency, tax and time zone.
4. A jurisdiction is the owner's named combined rate, decimal percent to four places, with ZIP matches and an optional default.
5. A site can choose explicitly; overlapping ZIP matches require that choice, and an unmatched configured address without a default is refused.
6. Branch settings override business settings.
7. FREE items are not taxed; TAXABLE items (and legacy GST codes) follow the jurisdiction, whose service-labor switch applies to service items.
8. Quantities are thousandths, line multiplication and tax use integer arithmetic, rounding half up per line and once on the document's combined taxable cents.

**Evidence.** `src/glove/sales-tax.ts`, `src/glove/avatax.ts`, `src/glove/qbo-invoice.ts`, `tests/api/money.test.mjs`, `tests/portable.mjs`, `tests/browser/money.spec.ts`
**Gap.** The audit records 9 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites in each and for an exempt customer, and checks exact cents and the per-jurisdiction breakdown on the quote, invoice, export and explicitly mapped downloadable QuickBooks Online inspection payload (no sync); LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007 and LEDGER-004 carry the actual transport and provider-fake assertion; the REPORT-002, REPORT-004 sales-tax report matches the invoices' tax by jurisdiction to the cent.; point 2 — The scenario sets different branch tax jurisdictions, checks each branch’s quote/invoice/export/provider tax, and narrows the REPORT-002, REPORT-004 tax rows to one branch.; point 3 — New installations default to USD and unsaved booking zones to America/Chicago; an existing business retains its saved currency, tax and time zone.; point 4 — A jurisdiction is the owner's named combined rate, decimal percent to four places, with ZIP matches and an optional default.; point 5 — A site can choose explicitly; overlapping ZIP matches require that choice, and an unmatched configured address without a default is refused.; point 6 — Branch settings override business settings.; point 7 — FREE items are not taxed; TAXABLE items (and legacy GST codes) follow the jurisdiction, whose service-labor switch applies to service items.; point 8 — Quantities are thousandths, line multiplication and tax use integer arithmetic, rounding half up per line and once on the document's combined taxable cents. See docs/contract/DONE-AUDIT.md for each named outcome.

#### MONEY-004 — Frozen tax evidence and reporting

Core · target · **partial** · From MONEY-001 · Cites BASE-DATA-001, BASE-DATA-003

**Requirement.** Frozen tax evidence and reporting supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#money-001-operating-rules) retain the record formats and calculations. Owning-capability boundaries: QUOTE-007, QUOTE-019 carries discount allocation through this same tax calculation before discounts ship.

**Acceptance.**
1. The revision freezes currency, jurisdiction, rate, labor classification and exemption evidence; accepting options/add-ons and preparing/correcting the invoice retains that snapshot.
2. Certificate evidence is private to the customer's full desk readers, including branch limits, stored in original chunks, archived with the customer and retained when replaced; exemption expiry is inclusive in the branch's local date.
3. Any physical customer removal deletes its originals and chunks; DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 carries the customer erasure door and restore-fence assertion before shipping.
4. US exports keep approved jurisdiction, rate, taxable basis, tax and total; legacy AUD exports retain Xero columns.
5. Tax reports use each invoice's first approval local date (inclusive period bounds), grouping the latest approved tax snapshot by branch and jurisdiction.
6. Before payments ship, the report honestly says tax on approved invoices; PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 carries collected tax.
7. The mapped QuickBooks JSON is an inspection document only; LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007/004 carry live posting, matching and provider assertions.

**Evidence.** `src/glove/sales-tax.ts`, `src/glove/avatax.ts`, `src/glove/qbo-invoice.ts`, `tests/api/money.test.mjs`, `tests/portable.mjs`, `tests/browser/money.spec.ts`
**Gap.** The audit records 5 separately asserted outcome(s). Complete proof is not located for point 1 — The revision freezes currency, jurisdiction, rate, labor classification and exemption evidence; accepting options/add-ons and preparing/correcting the invoice retains that snapshot.; point 2 — Certificate evidence is private to the customer's full desk readers, including branch limits, stored in original chunks, archived with the customer and retained when replaced; exemption expiry is inclusive in the branch's local date.; point 3 — Any physical customer removal deletes its originals and chunks; DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 carries the customer erasure door and restore-fence assertion before shipping.; point 4 — US exports keep approved jurisdiction, rate, taxable basis, tax and total; legacy AUD exports retain Xero columns.; point 5 — Tax reports use each invoice's first approval local date (inclusive period bounds), grouping the latest approved tax snapshot by branch and jurisdiction.; point 6 — Before payments ship, the report honestly says tax on approved invoices; PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 carries collected tax.; point 7 — The mapped QuickBooks JSON is an inspection document only; LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007/004 carry live posting, matching and provider assertions. See docs/contract/DONE-AUDIT.md for each named outcome.

#### MONEY-005 — Address-based tax lookup

Core · target · **partial** · From MONEY-001 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-SECRET-001

**Requirement.** Address-based tax lookup supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#money-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The optional Avalara AvaTax and Stripe Tax lookups (provider fakes at their network edges) each return an owner-applied proposal, and an unregistered or rateless answer reads "rate unavailable", never 0%.
2. Stripe lookup sends only service address and two fixed sample classifications, never identity or certificates; the owner selects the service classification, reviews the response and applies settings.
3. Unsupported, partial or unregistered treatment is unavailable for automatic application, never inferred as zero tax or exemption.
4. Every new lookup/certificate event appears in Activity and business export without credentials.
5. The Avalara AvaTax lookup follows the same rules as Stripe : the owner alone connects it, and the account ID, license key, company code and production/sandbox choice are one sealed secret excluded from state, archives and export.
6. A lookup creates one uncommitted AvaTax SalesOrder (never recorded in AvaTax) at the service address with the fixed customer code glove-address-rate-lookup and two $100 sample lines: the provider’s parts classification for general tangible goods and the AvaTax tax code the owner enters for the service.
7. It is a proposal only when every parts jurisdiction is fully taxable and their rates, summed in millionths and shown as a percent to four places, exceed zero, and the service is either fully taxable at that same combined rate (labor taxed) or wholly non-taxable (labor exempt); no nexus, zero, mixed, partial, exempt or refused answers read "rate unavailable", never 0%.
8. The owner applies a proposal through the ordinary jurisdiction settings.

**Evidence.** `src/glove/sales-tax.ts`, `src/glove/avatax.ts`, `src/glove/qbo-invoice.ts`, `tests/api/money.test.mjs`, `tests/portable.mjs`, `tests/browser/money.spec.ts`
**Gap.** The audit records 9 separately asserted outcome(s). Complete proof is not located for point 1 — The optional Avalara AvaTax and Stripe Tax lookups (provider fakes at their network edges) each return an owner-applied proposal, and an unregistered or rateless answer reads "rate unavailable", never 0%.; point 2 — Stripe lookup sends only service address and two fixed sample classifications, never identity or certificates; the owner selects the service classification, reviews the response and applies settings.; point 3 — Unsupported, partial or unregistered treatment is unavailable for automatic application, never inferred as zero tax or exemption.; point 5 — The Avalara AvaTax lookup follows the same rules as Stripe : the owner alone connects it, and the account ID, license key, company code and production/sandbox choice are one sealed secret excluded from state, archives and export.; point 6 — A lookup creates one uncommitted AvaTax SalesOrder (never recorded in AvaTax) at the service address with the fixed customer code glove-address-rate-lookup and two $100 sample lines: the provider’s parts classification for general tangible goods and the AvaTax tax code the owner enters for the service.; point 7 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summed in millionths and shown as a percent to four places, exceed zero, and the service is either fully taxable at that same combined rate (labor taxed) or wholly non-taxable (labor exempt); no nexus, zero, mixed, partial, exempt or refused answers read "rate unavailable", never 0%. See docs/contract/DONE-AUDIT.md for each named outcome.

#### MONEY-002 — US business identity on every document

Core · target · **partial** · Cites BASE-ROLE-001

**Requirement.** The business records its legal name, DBA, EIN, state contractor license numbers (by trade and state), insurance details and logo; quotes, invoices, service reports and agreements print the license numbers and terms a state requires, US address and phone formats, and US date formats. Customers record a billing and service address separately and a business customer's tax ID. The [operating rules](docs/service-work-rules.md#money-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The business retains its EIN, two license numbers and logo after reload; the customer retains separate billing and service addresses through edit and export.
2. The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first release), up to 20 contractor licenses (trade, two-letter state, number), insurance (carrier, policy number, expiry date) and a logo image in its own format (PNG, JPEG or WebP, at most 1.5 MB), each kept when a save leaves it out; every signed-in role can open the logo.
3. Customers keep a billing address apart from each site's service address, and a business customer's tax ID; the customer export carries both addresses in their own columns.
4. Printing these on quotes, invoices, service reports and agreements, with US address, phone and date formats, is `QUOTE-005, QUOTE-015`'s.

**Evidence.** `src/glove/commands/setup.ts`, `src/glove/api.ts`, `src/ui/identity.tsx`, `src/ui/team.tsx`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The business retains its EIN, two license numbers and logo after reload; the customer retains separate billing and service addresses through edit and export.; point 2 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first release), up to 20 contractor licenses (trade, two-letter state, number), insurance (carrier, policy number, expiry date) and a logo image in its own format (PNG, JPEG or WebP, at most 1.5 MB), each kept when a save leaves it out; every signed-in role can open the logo.; point 3 — Customers keep a billing address apart from each site's service address, and a business customer's tax ID; the customer export carries both addresses in their own columns.; point 4 — Printing these on quotes, invoices, service reports and agreements, with US address, phone and date formats, is QUOTE-005, QUOTE-015's. See docs/contract/DONE-AUDIT.md for each named outcome.

#### MONEY-003 — Price book with costs, markup and flat rates

Core · target · **partial** · From MONEY-003

**Requirement.** Price book with costs, markup and flat rates supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#money-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture imports a 200-line price book CSV with costs and markups, raises one category by 5%, quotes a flat-rate task and a time-and-materials line, and checks prices, costs and the round-trip export.
2. An item is a service, a material or a flat-rate task.
3. Its price is fixed, or follows its category's markup: unit cost × (100 + markup) / 100, rounded half up to the cent, recomputed whenever the cost or the markup changes.
4. A task's cost is the sum of its contents' costs at their quantities (each rounded half up to the cent); its contents are services and materials, never other tasks.
5. A bulk change multiplies each fixed price in one category by (100 + percent) / 100, rounded half up to the cent; markup prices follow cost instead.
6. A price-book quote line keeps the item's unit cost when it was priced.
7. The customer-facing description is stored on the item; the doors that show customers documents (`QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013`, `QUOTE-005, QUOTE-015`, `COMM-006, COMM-022, COMM-023, COMM-024, COMM-025`) print it when they ship.

**Evidence.** `src/glove/pricebook.ts`, `src/glove/commands/pricebook.ts`, `src/ui/price-book.tsx`, `tests/api/pricebook.test.mjs`, `src/glove/commands/setup.ts`, `src/glove/api.ts`, `src/glove/access.ts`, `src/glove/view.ts`
**Gap.** The audit records 10 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture imports a 200-line price book CSV with costs and markups, raises one category by 5%, quotes a flat-rate task and a time-and-materials line, and checks prices, costs and the round-trip export.; point 2 — An item is a service, a material or a flat-rate task.; point 3 — Its price is fixed, or follows its category's markup: unit cost × (100 + markup) / 100, rounded half up to the cent, recomputed whenever the cost or the markup changes.; point 4 — A task's cost is the sum of its contents' costs at their quantities (each rounded half up to the cent); its contents are services and materials, never other tasks.; point 5 — A bulk change multiplies each fixed price in one category by (100 + percent) / 100, rounded half up to the cent; markup prices follow cost instead.; point 6 — A price-book quote line keeps the item's unit cost when it was priced.; point 7 — The customer-facing description is stored on the item; the doors that show customers documents (QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013, QUOTE-005, QUOTE-015, COMM-006, COMM-022, COMM-023, COMM-024, COMM-025) print it when they ship. See docs/contract/DONE-AUDIT.md for each named outcome.

#### MONEY-006 — Price-book CSV and cost visibility

Core · target · **partial** · From MONEY-003 · Cites BASE-ROLE-001

**Requirement.** Price-book CSV and cost visibility supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#money-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Costs are margin figures: technicians never read them, and a custom role reads them only with report-reading permission.
2. The price-book CSV matches rows by Code (new, updated with the fields that change, unchanged, or rejected with its reason), is committed only as the exact preview, keeps checklists, skills and images, and ignores a markup row's Price; re-importing the export changes nothing.

**Evidence.** `src/glove/pricebook.ts`, `src/glove/commands/pricebook.ts`, `src/ui/price-book.tsx`, `tests/api/pricebook.test.mjs`, `src/glove/commands/setup.ts`, `src/glove/api.ts`, `src/glove/access.ts`, `src/glove/view.ts`
**Gap.** The audit records 1 separately asserted outcome(s). Complete proof is not located for point 1 — Costs are margin figures: technicians never read them, and a custom role reads them only with report-reading permission.; point 2 — The price-book CSV matches rows by Code (new, updated with the fields that change, unchanged, or rejected with its reason), is committed only as the exact preview, keeps checklists, skills and images, and ignores a markup row's Price; re-importing the export changes nothing. See docs/contract/DONE-AUDIT.md for each named outcome.

### Customers, properties and equipment

#### CUST-001 — Customer and property history in one place

Core · target · **partial**

**Requirement.** A customer has several contacts and properties. Each property shows every kept service-work record newest first: requests, quotes, jobs, visits, photos, checklist forms, notes, materials, refrigerant, completion, invoices and equipment. Payment, agreement and message clauses also place their records in that history. Search covers name, phone, email and address. A business customer keeps a billing contact and accounts-payable email separately from its site contact, and can require a purchase-order number that invoice approval enforces and the invoice CSV carries. The [operating rules](docs/service-work-rules.md#cust-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture opens a customer with two properties and finds each property's full history of every kept record kind: requests, quotes, jobs, visits, photos, checklist forms, notes, materials, refrigerant, completion, invoices and equipment; a search by a phone fragment and by a street name finds them; a business customer's billing contact and accounts-payable email stay apart from its site contacts.
2. Require a PO for that customer, refuse invoice approval without it, then add the PO, approve and verify it travels in the invoice CSV Reference.
3. Each PAY-* payment, PLAN-* agreement and COMM-* message clause must prove its entries appear in the property history; these remain standing obligations of those clauses.

**Evidence.** `src/glove/commands/setup.ts`, `src/glove/history.ts`, `src/ui/customers.tsx`, `src/ui/property-history.tsx`, `tests/api/customers.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 2 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture opens a customer with two properties and finds each property's full history of every kept record kind: requests, quotes, jobs, visits, photos, checklist forms, notes, materials, refrigerant, completion, invoices and equipment; a search by a phone fragment and by a street name finds them; a business customer's billing contact and accounts-payable email stay apart from its site contacts.; point 2 — Require a PO for that customer, refuse invoice approval without it, then add the PO, approve and verify it travels in the invoice CSV Reference.; point 3 — Each PAY-* payment, PLAN-* agreement and COMM-* message clause must prove its entries appear in the property history; these remain standing obligations of those clauses. See docs/contract/DONE-AUDIT.md for each named outcome.

#### CUST-002 — Installed equipment and warranties

Core · target · **partial**

**Requirement.** Each property lists installed equipment (type, make, model, serial, install date, refrigerant, location in the building, photos) with manufacturer and labor warranty dates; technicians add or update equipment from the phone; every job and form links to the equipment it touched; expiring warranties appear on the property and in reports. The [operating rules](docs/service-work-rules.md#cust-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture adds a furnace and an AC condenser to a site, records a visit against the condenser, and reads the condenser's service history and warranty state; the technician's phone shows them offline.

**Evidence.** `src/glove/commands/equipment.ts`, `src/glove/equipment.ts`, `src/ui/equipment.tsx`, `tests/api/equipment.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 1 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture adds a furnace and an AC condenser to a site, records a visit against the condenser, and reads the condenser's service history and warranty state; the technician's phone shows them offline. See docs/contract/DONE-AUDIT.md for each named outcome.

#### CUST-003 — Customer CSV import and export

Core · target · **partial**

**Requirement.** The owner imports customers, contacts and properties from a CSV (any column order, mapped once and remembered), sees a preview of new, matched and rejected rows with reasons, and commits through the import kit journal with undo; the same records export as CSV at any time. The [operating rules](docs/service-work-rules.md#cust-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture previews and commits a 500-row CSV with bad rows and duplicates, undoes it, and exports a CSV that re-imports unchanged.
2. Rows sharing a Customer ID, or without one carrying identical customer details, are one customer, each row adding one site and one other contact.
3. A row is *matched* when its Customer ID is a Glove customer's ID or it repeats a customer an earlier CSV import created; Glove keeps a matched customer's details and contacts as they are, lists which file values differ, and adds only the site addresses it lacks.
4. A row is , with its spreadsheet row number and reason, when a field fails the rule customer save action or site save action applies, it has more cells than the header, it repeats an earlier row exactly, or its details differ from the first row with the same Customer ID; every other row is *new*.
5. Without a chosen mapping Glove uses the last committed CSV's mapping when every column it names is in the file, else columns headed like Glove's own export.
6. The export writes every live (unmerged) customer, one row per site or other contact, and puts a ' before a cell a spreadsheet would run as a formula (import takes exactly one off), so re-importing it matches every row and writes nothing.

**Evidence.** `src/glove/movein/csv.ts`, `src/glove/movein/kit.ts`, `src/ui/csv-import.tsx`, `tests/api/csv.test.mjs`
**Gap.** The audit records 8 separately asserted outcome(s). Complete proof is not located for point 2 — Rows sharing a Customer ID, or without one carrying identical customer details, are one customer, each row adding one site and one other contact.; point 3 — A row is *matched* when its Customer ID is a Glove customer's ID or it repeats a customer an earlier CSV import created; Glove keeps a matched customer's details and contacts as they are, lists which file values differ, and adds only the site addresses it lacks.; point 4 — A row is , with its spreadsheet row number and reason, when a field fails the rule customer save action or site save action applies, it has more cells than the header, it repeats an earlier row exactly, or its details differ from the first row with the same Customer ID; every other row is *new*.; point 5 — Without a chosen mapping Glove uses the last committed CSV's mapping when every column it names is in the file, else columns headed like Glove's own export.; point 6 — The export writes every live (unmerged) customer, one row per site or other contact, and puts a ' before a cell a spreadsheet would run as a formula (import takes exactly one off), so re-importing it matches every row and writes nothing. See docs/contract/DONE-AUDIT.md for each named outcome.

#### CUST-004 — Tags, custom fields and segments

Core · target · **partial** · From CUST-004

**Requirement.** Tags, custom fields and segments supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#cust-004-operating-rules) retain the record formats and calculations.

Its audience export follows the customer CSV permission boundary.

**Acceptance.**
1. A fixture defines two custom fields and a segment, and checks that the segment's members match the filter and that the export and the Mango push (provider fake) carry exactly them; a workflow rule conditioned on the "commercial" tag runs only for a tagged customer's job (`API-005`).
2. The owner defines custom fields on customers, sites, jobs or equipment (text, number, date, yes/no, or a choice of 2–20 values); a field keeps its record and type.
3. The owner, dispatchers and the office set field values and a customer's tags (up to 20, each up to 40 characters, kept once whatever the case) and save segments.
4. A technician sees the values on the sites, jobs and equipment of visits assigned to them, never a customer's tags or customer fields.
5. A segment's members are the live customers (never merged-away ones) that have all of its "has" tags and none of its "has none" tags (compared without case), meet every field condition (is, over, under, set, unset; a site field holds when any of the customer's sites meets it) and, when set, have equipment at one of their sites installed at least N years before today's local date. "No agreement" holds for every customer until agreements exist; `PLAN-002` carries it in its text and acceptance.
6. The members list reads for the desk; the members CSV (name, email, phone, tags, customer fields) for the owner and office.
7. A tag is a condition of a workflow rule (`API-005`).

**Evidence.** `src/glove/segments.ts`, `src/glove/commands/segments.ts`, `src/glove/commands/marketing.ts`, `src/glove/rules.ts`, `src/ui/custom-fields.tsx`, `tests/api/segments.test.mjs`
**Gap.** The audit records 5 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture defines two custom fields and a segment, and checks that the segment's members match the filter and that the export and the Mango push (provider fake) carry exactly them; a workflow rule conditioned on the "commercial" tag runs only for a tagged customer's job (API-005).; point 2 — The owner defines custom fields on customers, sites, jobs or equipment (text, number, date, yes/no, or a choice of 2–20 values); a field keeps its record and type.; point 3 — The owner, dispatchers and the office set field values and a customer's tags (up to 20, each up to 40 characters, kept once whatever the case) and save segments.; point 4 — A technician sees the values on the sites, jobs and equipment of visits assigned to them, never a customer's tags or customer fields.; point 5 — A segment's members are the live customers (never merged-away ones) that have all of its "has" tags and none of its "has none" tags (compared without case), meet every field condition (is, over, under, set, unset; a site field holds when any of the customer's sites meets it) and, when set, have equipment at one of their sites installed at least N years before today's local date. "No agreement" holds for every customer until agreements exist; PLAN-002 carries it in its text and acceptance.; point 6 — The members list reads for the desk; the members CSV (name, email, phone, tags, customer fields) for the owner and office. See docs/contract/DONE-AUDIT.md for each named outcome.

#### CUST-006 — Segment audience handoff

Core · target · **partial** · From CUST-004 · Cites BASE-DATA-001, BASE-SECRET-001

**Requirement.** Segment audience handoff supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#cust-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner connects Mango (its integration address and a contacts:write credential) or Mailchimp (an API key and audience ID); the key is kept as a secret, never in records, exports, logs or the archive.
2. The owner and office push a segment: Glove holds no marketing consent, so a push never subscribes anyone: Mango receives each member with an email (email, name, tags, the segment as its list, without subscribe), Mailchimp adds new members as transactional and tags them with the segment and their tags; members without an email or tagged "do not contact" are skipped and counted (customers who opted out are excluded with `COMM-002`'s consent record, which carries it in its text and acceptance), and each push is recorded with its counts and the provider's refusals.

**Evidence.** `src/glove/segments.ts`, `src/glove/commands/segments.ts`, `src/glove/commands/marketing.ts`, `src/glove/rules.ts`, `src/ui/custom-fields.tsx`, `tests/api/segments.test.mjs`
**Gap.** The audit records 1 separately asserted outcome(s). Complete proof is not located for point 1 — The owner connects Mango (its integration address and a contacts:write credential) or Mailchimp (an API key and audience ID); the key is kept as a secret, never in records, exports, logs or the archive.; point 2 — The owner and office push a segment: Glove holds no marketing consent, so a push never subscribes anyone: Mango receives each member with an email (email, name, tags, the segment as its list, without subscribe), Mailchimp adds new members as transactional and tags them with the segment and their tags; members without an email or tagged "do not contact" are skipped and counted (customers who opted out are excluded with COMM-002's consent record, which carries it in its text and acceptance), and each push is recorded with its counts and the provider's refusals. See docs/contract/DONE-AUDIT.md for each named outcome.

#### CUST-005 — Duplicate detection and merge review

Core · target · **done**

**Requirement.** Glove flags customers that share a phone number, email or normalized address, on entry, on CSV import and on move-in, and offers a merge review: what each record holds, which values win, and what moves (properties, jobs, invoices, messages); a merge is one journaled change that can be undone. The [operating rules](docs/service-work-rules.md#cust-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture creates nine customers sharing a phone number, reviews and merges them, checks every job and invoice now hangs off the survivor, and undoes the merge.

**Evidence.** `tests/api/merge.test.mjs` — “CUST-005: nine customers sharing a phone are flagged, merged into one and unmerged”
**Gap.** None.

### Requests and online booking

#### BOOK-001 — Request form on the business website

Core · target · **partial** · From BOOK-001 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-DATA-001, BASE-INPUT-002, BASE-PUBLIC-001, BASE-PUBLIC-002, BASE-PUBLIC-003, BASE-SECRET-001

**Requirement.** Request form on the business website supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture submits the embedded form from a fixture page with two photos, finds the request in the queue matched to an existing customer by phone, and checks that a submission failing Turnstile writes nothing; a flow test drafts an `AGENT-005, AGENT-014` quote from that request (model fake) and finds its photos sent only with the owner's switch on.
2. A signed-in owner without branch limits explicitly configures Turnstile and enables website requests.
3. The public /request page can be linked or embedded with the documented product door; additional direct-post origins must be explicitly listed.
4. The installation-private Turnstile key is excluded from state, exports and archives and must be reconnected after restore.
5. Siteverify receives only its key and challenge token; success must match this form’s action and browser hostname within the token’s validity.
6. Failed, uncertain or mismatched verification writes no customer, site, request, file, notice or command result.
7. Verified consented requests carry service, contact, service address, preferred times and up to two original images.
8. An exact unique phone or email match reuses the live customer without changing its stored identity; ambiguity refuses without exposing candidates.

**Evidence.** `tests/api/pipeline.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** Account-specific no-training qualification is an owner attestation, not provider-side verification; sender-requested withdrawal is owner-recorded under RL-101. Provider-held copies and training compliance are not independently verified. The public intake and photo-control workflow remains partial under its existing evidence; the ruling supplies policy authority, not additional implementation proof.

#### BOOK-007 — Request custody and office handoff

Core · target · **partial** · From BOOK-001 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-DATA-003, BASE-INPUT-002, BASE-PUBLIC-001, BASE-PUBLIC-002, BASE-PUBLIC-003, BASE-ROLE-001

**Requirement.** Request custody and office handoff supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. New customer/site/request records, private originals and an owner/office in-app notice commit together under the configuring owner’s still-current role, branch and exact configuration.
2. The anonymous response is only an opaque receipt, and replay cannot duplicate the request.
3. A request never books or sends a reply.
4. The desk reads the source, preferred times and photos in the request pipeline; field and public file doors cannot read these originals.
5. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 export/erase includes the contact, request and original bytes.
6. Quote drafting retains its text evidence; the separate photo permission controls sanitized additions to the model evidence.

**Evidence.** `tests/api/pipeline.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** Account-specific no-training qualification is an owner attestation, not provider-side verification; sender-requested withdrawal is owner-recorded under RL-101. Provider-held copies and training compliance are not independently verified. The public intake and photo-control workflow remains partial under its existing evidence; the ruling supplies policy authority, not additional implementation proof.

#### BOOK-008 — Sender photo permission

Core · target · **partial** · From BOOK-001 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-INPUT-002, BASE-PUBLIC-001, BASE-PUBLIC-002, BASE-PUBLIC-003, BASE-ROLE-001

**Requirement.** Sender photo permission supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The switch is off by default and only a signed-in owner without branch limits may change it.
2. Each request requires the sender’s separate explicit consent naming that its photos go to the configured model provider.
3. Only the photos are added to model calls, never contact, address or customer identity; EXIF and location metadata are stripped from the sent copy.
4. The provider is barred from training on the photos.
5. Withdrawal excludes the photos from later calls.
6. Originals remain private to the office.
7. Office-contact consent never authorizes model sharing.
8. Declining still submits the request to the office.

**Evidence.** `tests/api/pipeline.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** Account-specific no-training qualification is an owner attestation, not provider-side verification; sender-requested withdrawal is owner-recorded under RL-101. Provider-held copies and training compliance are not independently verified. The public intake and photo-control workflow remains partial under its existing evidence; the ruling supplies policy authority, not additional implementation proof.

#### BOOK-009 — Provider qualification and disclosure

Core · target · **partial** · From BOOK-001 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-DATA-003, BASE-INPUT-002, BASE-PUBLIC-001, BASE-PUBLIC-002, BASE-PUBLIC-003, BASE-ROLE-001

**Requirement.** Provider qualification and disclosure supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The signed-in unscoped owner may enable model-photo sharing in website-request settings only with a configured provider, its sender-facing name and explicit affirmation of the entered account-specific terms prohibiting training.
2. The setting starts off; each save creates a new disclosure, and reconnecting or changing the provider invalidates earlier permission.
3. The public form offers a separate unchecked optional consent naming that provider and its actual hostname; it binds that request’s exact photos to the disclosure text, time and recipient.
4. Provider qualification under RL-101 relies on the recorded account-specific no-training agreement and affirmation; disabling storage alone does not qualify it.
5. Missing or changed applicable terms hold photo sharing.
6. The owner records a sender-requested withdrawal and its reason; it excludes every later model attempt while private originals remain subject to erasure.
7. The record is an attestation and agreement reference, never provider verification or a legal determination.

**Evidence.** `tests/api/pipeline.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** Account-specific no-training qualification is an owner attestation, not provider-side verification; sender-requested withdrawal is owner-recorded under RL-101. Provider-held copies and training compliance are not independently verified. The public intake and photo-control workflow remains partial under its existing evidence; the ruling supplies policy authority, not additional implementation proof.

#### BOOK-010 — Model-photo authorization and withdrawal

Core · target · **partial** · From BOOK-001 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-AUDIT-001, BASE-DATA-003, BASE-INPUT-002, BASE-PUBLIC-001, BASE-PUBLIC-002, BASE-PUBLIC-003, BASE-ROLE-001

**Requirement.** Model-photo authorization and withdrawal supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Old or mismatched disclosure refuses the whole submission without persistence.
2. Request quote drafting adds only transient image data, never filenames, captions, file references, contact, address or customer identity fields.
3. JPEG metadata across scans, PNG ancillary metadata and WebP metadata are removed server-side; malformed or animated copies refuse instead of transmitting originals.
4. Office originals remain unchanged behind the existing private file door.
5. Immediately before each photo attempt, one atomic authorization checks the caller, exact business/request versions and configuring owner’s active unscoped authority, then records the disclosure and derivative hashes in Activity/export.
6. Photo attempts cannot follow provider redirects and retain store-off.
7. A switch/provider/role change or recorded withdrawal wins before later authorization; an already authorized in-flight call cannot be recalled from a provider.
8. Recording photo withdrawal requires the unscoped owner to affirm the sender requested withdrawal and record how; later calls exclude those photos while originals stay private until DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erasure.

**Evidence.** `tests/api/pipeline.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** Account-specific no-training qualification is an owner attestation, not provider-side verification; sender-requested withdrawal is owner-recorded under RL-101. Provider-held copies and training compliance are not independently verified. The public intake and photo-control workflow remains partial under its existing evidence; the ruling supplies policy authority, not additional implementation proof.

#### BOOK-002 — Online booking into real availability

Core · target · **partial** · From BOOK-002 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-AUDIT-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001 · Register R-1, R-2

**Requirement.** Online booking into real availability supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-002-operating-rules) retain the record formats and calculations. Recorded decisions: RL-3.

**Acceptance.**
1. A fixture books a tune-up through the public booking page, sees a full day refused and a window offered on a technician with the right skill, and finds the visit on the dispatch board with its confirmation queued.
2. A second booking for a service with a $50.00 deposit takes it (Stripe fake), and the deposit shows on the job.
3. With a 24-hour window and a $75.00 late-cancellation fee, a booking the customer cancels 3 hours ahead puts the $75.00 fee on the visit, and the office charges it to the saved card; a booking canceled 3 days ahead charges nothing and refunds its $50.00 deposit; and a visit marked as a no-show proposes the no-show fee, which the office waives with a reason on the timeline.
4. each online booking is assigned with automatic technician selection and lands on an eligible technician inside its window.
5. Deposits, payments, saved-card consent, fees, cancellation and rescheduling are unavailable through this bearer.
6. The bounded offer does not remove customer-selected booking, deposits, cancellation or rescheduling from the complete target; customer-payment authority follows RL-106.

**Evidence.** `tests/api/agreements.test.mjs`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/ui/customer-booking.tsx`, `tests/browser/due-visits.spec.ts`
**Gap.** Gap — Customer-selected service catalogue; travel-feasible arrival-window generation beyond the existing assignment ranking; per-service instant or approval and deposit settings; priority-member treatment; outbound confirmation under COMM-003; deposits and customer payments pending the PAY-002 customer-side ruling; policy disclosure and fee-specific PAY-008 saved-card consent; customer cancellation through confirmation or hub; timely deposit refunds; late-cancellation and no-show fee proposals; authorized office charges; and reasoned waivers remain unproved. Service-path exact-expiry, concurrent-use and authority-change-at-commit execution, erasure and archive and restore credential invalidation, abuse controls, and enumeration and timing boundaries remain unverified by this review. Complete customer-catalogue browser acceptance, exact-SHA Verify and guarded landing remain pending. The generated service-window flow has local browser proof at 1440 and 390 in the named journey. CT has approved only the preparatory bearer defaults with riders; this removes the pending BOOK-002 policy decision, changes no implementation status and proves no security certification, legal compliance or provider delivery.

#### BOOK-011 — Single-service booking offers

Core · target · **partial** · From BOOK-002 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001 · Register R-1, R-2

**Requirement.** Single-service booking offers supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Booking offer action is an explicit signed-in unscoped Owner command for an existing open, single-service call without an agreement or live visit.
2. The Owner selects the service and offers 1 to 10 future planned times with arrival windows; this is not customer service selection or generated-window booking.
3. A cryptographically random bearer is shown once, stored as a hash, expires 14 days after issuance, is explicitly revocable, and permits at most one successfully committed booking.
4. Possession grants only this offer’s read and choice operations; it does not verify customer identity, property authority, a signature or payment consent.
5. Reads disclose only the business name, offered service, this site address, expiry, and currently available offered dates, planned times, time zone and arrival windows.
6. They disclose no customer account, contact or access notes, prices, technician identifiers, competing work or other records.
7. The holder may submit only an offered slot identifier, not choose another customer, site, service, technician or arbitrary time, or override conflicts.
8. Current issuer authority and eligibility are rechecked on use; expired, revoked, used or currently unauthorized links refuse access.

**Evidence.** `tests/api/agreements.test.mjs`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/ui/customer-booking.tsx`, `tests/browser/due-visits.spec.ts`
**Gap.** Gap — Customer-selected service catalogue; travel-feasible arrival-window generation beyond the existing assignment ranking; per-service instant or approval and deposit settings; priority-member treatment; outbound confirmation under COMM-003; deposits and customer payments pending the PAY-002 customer-side ruling; policy disclosure and fee-specific PAY-008 saved-card consent; customer cancellation through confirmation or hub; timely deposit refunds; late-cancellation and no-show fee proposals; authorized office charges; and reasoned waivers remain unproved. Service-path exact-expiry, concurrent-use and authority-change-at-commit execution, erasure and archive and restore credential invalidation, abuse controls, and enumeration and timing boundaries remain unverified by this review. Complete customer-catalogue browser acceptance, exact-SHA Verify and guarded landing remain pending. The generated service-window flow has local browser proof at 1440 and 390 in the named journey. CT has approved only the preparatory bearer defaults with riders; this removes the pending BOOK-002 policy decision, changes no implementation status and proves no security certification, legal compliance or provider delivery.

#### BOOK-012 — Current capacity and window generation

Core · target · **partial** · From BOOK-002 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001 · Register R-1, R-2

**Requirement.** Current capacity and window generation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. DISP-006 recomputes eligible automatic assignment at booking, retains the arrival window and records the assignment reason; availability displayed earlier reserves no capacity.
2. A successful service booking creates an internal desk confirmation task only.
3. It does not itself establish an outbound send, provider acceptance, delivery, arrival or completion.
4. The Owner shares this service link outside Glove; this extension adds no automatic customer send.
5. Each candidate uses the existing live automatic-assignment eligibility door: service skills, area, working hours, time off, calendar busy time and existing visits.
6. Generated windows remain restricted to the existing service call and bearer authority; reads and choices recheck current capacity.
7. Each arrival window spans its planned visit.

**Evidence.** `tests/api/agreements.test.mjs`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/ui/customer-booking.tsx`, `tests/browser/due-visits.spec.ts`
**Gap.** Gap — Customer-selected service catalogue; travel-feasible arrival-window generation beyond the existing assignment ranking; per-service instant or approval and deposit settings; priority-member treatment; outbound confirmation under COMM-003; deposits and customer payments pending the PAY-002 customer-side ruling; policy disclosure and fee-specific PAY-008 saved-card consent; customer cancellation through confirmation or hub; timely deposit refunds; late-cancellation and no-show fee proposals; authorized office charges; and reasoned waivers remain unproved. Service-path exact-expiry, concurrent-use and authority-change-at-commit execution, erasure and archive and restore credential invalidation, abuse controls, and enumeration and timing boundaries remain unverified by this review. Complete customer-catalogue browser acceptance, exact-SHA Verify and guarded landing remain pending. The generated service-window flow has local browser proof at 1440 and 390 in the named journey. CT has approved only the preparatory bearer defaults with riders; this removes the pending BOOK-002 policy decision, changes no implementation status and proves no security certification, legal compliance or provider delivery.

#### BOOK-013 — Booking-offer proof boundary

Core · target · **partial** · From BOOK-002 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001 · Register R-1, R-2

**Requirement.** Booking-offer proof boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Generation grants no customer catalogue, priority, payment, sending or cancellation authority.
2. Travel currently participates only in existing DISP-006 assignment ranking, not a proved travel-feasibility boundary.

**Evidence.** `tests/api/agreements.test.mjs`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/ui/customer-booking.tsx`, `tests/browser/due-visits.spec.ts`
**Gap.** Gap — Customer-selected service catalogue; travel-feasible arrival-window generation beyond the existing assignment ranking; per-service instant or approval and deposit settings; priority-member treatment; outbound confirmation under COMM-003; deposits and customer payments pending the PAY-002 customer-side ruling; policy disclosure and fee-specific PAY-008 saved-card consent; customer cancellation through confirmation or hub; timely deposit refunds; late-cancellation and no-show fee proposals; authorized office charges; and reasoned waivers remain unproved. Service-path exact-expiry, concurrent-use and authority-change-at-commit execution, erasure and archive and restore credential invalidation, abuse controls, and enumeration and timing boundaries remain unverified by this review. Complete customer-catalogue browser acceptance, exact-SHA Verify and guarded landing remain pending. The generated service-window flow has local browser proof at 1440 and 390 in the named journey. CT has approved only the preparatory bearer defaults with riders; this removes the pending BOOK-002 policy decision, changes no implementation status and proves no security certification, legal compliance or provider delivery.

#### BOOK-003 — Lead sources and the request pipeline

Core · target · **done**

**Requirement.** Every request carries its source (website, Google, phone, text, Angi, Thumbtack, Yelp, referral, repeat customer, marketing campaign) and moves through a pipeline (new, contacted, quoted, won, lost with a reason); the office sees an aging pipeline board, and reports show conversion and revenue by source. The [operating rules](docs/service-work-rules.md#book-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture creates requests from four sources, quotes and wins two, loses one with a reason, and checks the pipeline and the conversion-by-source report.

**Evidence.** `tests/api/pipeline.test.mjs` — “BOOK-003 requests from four sources move through the pipeline into the conversion-by-source report”
**Gap.** None.

#### BOOK-004 — Leads from Google, Angi, Thumbtack and Yelp

Core · target · **partial** · From BOOK-004 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-004, BASE-SECRET-001

**Requirement.** Leads from Google, Angi, Thumbtack and Yelp supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture posts a recorded lead payload from each provider (provider fakes), finds four requests with sources and lead costs, one matched to an existing customer, and an acknowledgment queued for each; a workflow rule on requests from Angi applies its lead cost (`API-005`).
2. Only the owner connects a lead source (lead connect action), with how many minutes the business has to acknowledge its leads (5 to 1,440, default 60) and the acknowledgment text.
3. Angi and Thumbtack post each lead (Thumbtack's Partner API v4 NegotiationCreatedV4 body; Angi's CRM lead delivery) to the source-specific lead receiver, and Yelp posts a notice naming new leads to the Yelp notice receiver, which Glove reads from Yelp's Leads API with the owner's key; Google Local Services has no push, so Glove reads the last week's leads from the Google Ads API (the provider’s service-lead record) with the owner's OAuth credentials and developer token on every scheduled run (every 15 minutes) and when the desk chooses **Read new leads** (lead pull action), and a failed scheduled read is a provider fact in Activity.
4. Google reads every response page with the same query and the provider's next-page token; repeated tokens, malformed rows or a failed later page refuse that entire read before requests are written.
5. Scheduled and desk retries retain one request per provider lead ID.
6. The posting doors authenticate before reading the body, as `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`'s unsigned callbacks do: HTTPS Basic user glove with a per-source password of 32 random bytes shown only in the connecting owner's response and kept as its SHA-256 hash (compared in constant time; reconnecting replaces it at once); every credential or form failure answers the same 401 body, writes nothing, and after 20 rejections from one address in a minute 429; a lead older than 7 days is refused, and a lead already landed (by provider and provider lead ID) lands nothing again.
7. Basic door passwords are stored only as SHA-256 hashes; provider keys are installation-local values in the installation-private provider store, with no sealed or encrypted storage claim.
8. Both stay out of records, Activity, command outcomes, the export and the archive.

**Evidence.** `tests/api/pipeline.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** Google, Angi, Thumbtack and Reserve replies through COMM-002 or their provider message channels within the response window remain unbuilt. Yelp's own response-time duties remain a Gap. Yelp has an explicitly approved masked-email acknowledgment through the existing mail sender, with provider acceptance distinguished from receipt in the Yelp conversation; neither Yelp receipt nor deadline compliance is claimed. ct approved this slice on 24 October 2026 at 05:58Z: only an unscoped owner acting as a person explicitly approves each acknowledgment, using its unexpired source destination, with no automatic send or retry. Reserve with Google still has documented Booking-record intake only; its booking server, feeds, notifications, updates and cancellations remain unbuilt. Provider eligibility gates live activation only.

#### BOOK-014 — Lead-source credential custody

Core · target · **partial** · From BOOK-004 · Cites BASE-DATA-004, BASE-SECRET-001

**Requirement.** Lead-source credential custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A lead becomes a request with its provider as source and its provider lead ID, for the one existing customer whose phone (last ten digits) or email equals the lead's, else for a new customer (and site, when the lead names an address) that `CUST-005` flags if it resembles another.

**Evidence.** `tests/api/pipeline.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** Google, Angi, Thumbtack and Reserve replies through COMM-002 or their provider message channels within the response window remain unbuilt. Yelp's own response-time duties remain a Gap. Yelp has an explicitly approved masked-email acknowledgment through the existing mail sender, with provider acceptance distinguished from receipt in the Yelp conversation; neither Yelp receipt nor deadline compliance is claimed. ct approved this slice on 24 October 2026 at 05:58Z: only an unscoped owner acting as a person explicitly approves each acknowledgment, using its unexpired source destination, with no automatic send or retry. Reserve with Google still has documented Booking-record intake only; its booking server, feeds, notifications, updates and cancellations remain unbuilt. Provider eligibility gates live activation only.

#### BOOK-015 — Lead costs and acknowledgments

Core · target · **partial** · From BOOK-004 · Cites BASE-DATA-004

**Requirement.** Lead costs and acknowledgments supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A cost the provider reports (Thumbtack's the provider’s reported lead price) is the request's lead cost; a workflow rule on enquiry created action with the action the request’s lead cost (`API-005`) applies its amount to a request from its source that has no cost yet (a provider-reported cost is kept and the run says so), and the owner or office sets or corrects a cost (enquiry cost action).
2. Each lead's acknowledgment is queued with its text and due time (received + the source's minutes) on the request; it is never sent automatically: the desk records it sent outside Glove (enquiry acknowledged action), noting when that was after the window.
3. The sent state is that person’s external-send attestation, not provider-confirmed delivery or proof of meeting the provider’s response window.
4. The 60-minute default and 5–1,440-minute range are product choices.
5. Only a signed-in Owner without branch limits explicitly authorizes each Yelp acknowledgment under RL-28.
6. It uses the unexpired masked reply address from that lead, never a subsequently edited customer address, through the connected customer email provider.
7. The command commits one message before sending, and replay or a second command never resends that acknowledgment.
8. Provider mail acceptance or delivery is shown from the existing mail receipts; neither confirms receipt in the Yelp conversation or meeting Yelp's response window.

**Evidence.** `tests/api/pipeline.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** Google, Angi, Thumbtack and Reserve replies through COMM-002 or their provider message channels within the response window remain unbuilt. Yelp's own response-time duties remain a Gap. Yelp has an explicitly approved masked-email acknowledgment through the existing mail sender, with provider acceptance distinguished from receipt in the Yelp conversation; neither Yelp receipt nor deadline compliance is claimed. ct approved this slice on 24 October 2026 at 05:58Z: only an unscoped owner acting as a person explicitly approves each acknowledgment, using its unexpired source destination, with no automatic send or retry. Reserve with Google still has documented Booking-record intake only; its booking server, feeds, notifications, updates and cancellations remain unbuilt. Provider eligibility gates live activation only.

#### BOOK-016 — Explicit lead acknowledgment execution

Core · target · **partial** · From BOOK-004 · Cites BASE-DATA-004

**Requirement.** Explicit lead acknowledgment execution supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. No acknowledgment is sent automatically.

**Evidence.** `tests/api/pipeline.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** Google, Angi, Thumbtack and Reserve replies through COMM-002 or their provider message channels within the response window remain unbuilt. Yelp's own response-time duties remain a Gap. Yelp has an explicitly approved masked-email acknowledgment through the existing mail sender, with provider acceptance distinguished from receipt in the Yelp conversation; neither Yelp receipt nor deadline compliance is claimed. ct approved this slice on 24 October 2026 at 05:58Z: only an unscoped owner acting as a person explicitly approves each acknowledgment, using its unexpired source destination, with no automatic send or retry. Reserve with Google still has documented Booking-record intake only; its booking server, feeds, notifications, updates and cancellations remain unbuilt. Provider eligibility gates live activation only.

#### BOOK-017 — Reserve with Google request intake

Core · target · **partial** · From BOOK-004 · Cites BASE-DATA-004

**Requirement.** Reserve with Google request intake supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Reserve with Google booking records enter the authenticated source receiver in the documented provider shape.
2. An owner-connected integration relays a record; this is request intake, not a Google booking server or an inbound Google BookingNotification webhook (that API sends updates to Google).
3. The source booking ID, merchant and service IDs, slot time and duration and source status remain on the request, without scheduling a visit or sending a reply.
4. A booking price is not a lead cost; no cost is invented.
5. Only confirmed or pending-merchant-confirmation source records are admitted; updates and cancellations are unsupported.
6. The first record for a booking ID wins, including concurrent retries.
7. The slot start is not a creation timestamp; the acknowledgment due time starts at Glove receipt.
8. No live integration is claimed; see [lead source formats](docs/lead-sources.md).

**Evidence.** `tests/api/pipeline.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** Google, Angi, Thumbtack and Reserve replies through COMM-002 or their provider message channels within the response window remain unbuilt. Yelp's own response-time duties remain a Gap. Yelp has an explicitly approved masked-email acknowledgment through the existing mail sender, with provider acceptance distinguished from receipt in the Yelp conversation; neither Yelp receipt nor deadline compliance is claimed. ct approved this slice on 24 October 2026 at 05:58Z: only an unscoped owner acting as a person explicitly approves each acknowledgment, using its unexpired source destination, with no automatic send or retry. Reserve with Google still has documented Booking-record intake only; its booking server, feeds, notifications, updates and cancellations remain unbuilt. Provider eligibility gates live activation only.

#### BOOK-005 — Service calls booked without a quote

Core · target · **partial** · Cites BASE-AUDIT-001

**Requirement.** The dispatcher or office creates a job straight from a request, a call or the customer record with zero or more lines (for example a diagnostic or trip fee from the price book), books its visit under `GLOVE-05`'s conflict review with an arrival window (`DISP-006`), and the customer gets the confirmation of `COMM-003, COMM-019, COMM-020`. On site the technician adds flat-rate or time-and-materials lines from the price book (with prices where the owner allows under `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`, otherwise priced by the office), and the customer's approval of the added work is recorded on the phone; the fee, the added lines and the recorded materials flow to the invoice draft under `GLOVE-09`. A job made without a quote says so on its timeline, and none of its prices counts as approved until its invoice revision is approved. The [operating rules](docs/service-work-rules.md#book-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89.00 diagnostic fee from the price book, books it for today, and the technician adds a flat-rate valve replacement and 1.5 hours of labor on site with the customer's approval; the invoice draft carries exactly the fee, both lines and the recorded materials, and is approved and invoiced; a browser journey creates the same kind of job from the customer record.
2. The dispatcher, the office or the owner makes a service call (job create action without a quote) from a request (which is then won) or from the customer record, at one of that customer's sites, with zero or more lines from the price book or custom; its checklist and forms come from those lines as for a quoted job.
3. Its timeline says it was made without a quote, its screen shows no accepted price, and its booking, field capture and completion are any job's.
4. On site the assigned technician adds work only on a service call (on a quoted job that is a change order, `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`): a price-book item other than a material, a quantity, and the customer's approval (their name, and signed on the phone or told in person), queued through the phone's outbox; the technician sees no prices.
5. The invoice draft carries the job's lines, then the added work and the recorded price-book materials at today's price-book prices, so the office prices them by preparing, revising and approving the invoice under `GLOVE-09`; until that approval none of the job's prices counts as approved.
6. A service call's arrival window comes with `DISP-006`, the customer's confirmation with `COMM-003, COMM-019, COMM-020`, and technicians pricing their own added work where the owner allows with `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`.
7. The office makes service calls only: a job from an accepted quote stays the dispatcher's or the owner's (`GLOVE-05`).

**Evidence.** `src/glove/commands/dispatch.ts`, `src/glove/commands/field.ts`, `src/glove/commands/invoices.ts`, `src/ui/service-call.tsx`, `tests/api/servicecall.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 6 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89.00 diagnostic fee from the price book, books it for today, and the technician adds a flat-rate valve replacement and 1.5 hours of labor on site with the customer's approval; the invoice draft carries exactly the fee, both lines and the recorded materials, and is approved and invoiced; a browser journey creates the same kind of job from the customer record.; point 2 — The dispatcher, the office or the owner makes a service call (job create action without a quote) from a request (which is then won) or from the customer record, at one of that customer's sites, with zero or more lines from the price book or custom; its checklist and forms come from those lines as for a quoted job.; point 3 — Its timeline says it was made without a quote, its screen shows no accepted price, and its booking, field capture and completion are any job's.; point 4 — On site the assigned technician adds work only on a service call (on a quoted job that is a change order, QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018): a price-book item other than a material, a quantity, and the customer's approval (their name, and signed on the phone or told in person), queued through the phone's outbox; the technician sees no prices.; point 5 — The invoice draft carries the job's lines, then the added work and the recorded price-book materials at today's price-book prices, so the office prices them by preparing, revising and approving the invoice under GLOVE-09; until that approval none of the job's prices counts as approved.; point 6 — A service call's arrival window comes with DISP-006, the customer's confirmation with COMM-003, COMM-019, COMM-020, and technicians pricing their own added work where the owner allows with QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018.; point 7 — The office makes service calls only: a job from an accepted quote stays the dispatcher's or the owner's (GLOVE-05). See docs/contract/DONE-AUDIT.md for each named outcome.

#### BOOK-006 — Assessment visits on a request

Core · target · **partial**

**Requirement.** A request can carry a scheduled assessment (an on-site estimate): the technician or salesperson, date, time, arrival window and instructions. It sits on the dispatch board and the assessor's phone like any visit, blocks that calendar time (`GLOVE-07` conflict review applies), sends the customer's confirmation and reminders (`COMM-003, COMM-019, COMM-020`), and lets the assessor record notes, photos, measurements and a custom form (`FIELD-002`) before any quote exists. Completing the assessment turns the request into a quote draft carrying those notes, photos and form results, or into a field quote under `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`; the assessment, the request and the quote stay linked on the customer and property history (`CUST-001`). The [operating rules](docs/service-work-rules.md#book-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture books an assessment on a water-heater replacement request, checks it blocks an overlapping booking for that technician until reviewed, records two photos and a form on the phone, completes it, and converts the request into a quote draft carrying the photos, notes and form results; the assessment shows on the request, the quote and the customer history.
2. The dispatcher or owner books an assessment on an open request (assessment book action): the technician, local date, start and end, instructions and up to 10 of the owner's forms (`FIELD-002`); one open assessment per request.
3. It is a job of kind assessment with no lines or price, linked to the request, whose visit is booked under `GLOVE-05`'s conflict review, so it sits on the board and the assessor's phone and blocks that time like any visit, and takes the same field capture (arrival, notes, photos, forms, through the outbox).
4. Completing its visit marks it assessed (never "completed, not invoiced" and never invoiced).
5. A quote drafted from that request carries the assessment's notes, photos and form results and its link; the request names its assessment; the assessment, the request and the quote show on the property history (`CUST-001`).
6. The arrival window comes with `DISP-006`, the customer's confirmation and reminders with `COMM-003, COMM-019, COMM-020`, and turning it into a field quote on the phone with `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`, each carrying it in its text and acceptance.

**Evidence.** `src/glove/commands/assessments.ts`, `src/glove/commands/quotes.ts`, `src/glove/commands/field.ts`, `src/ui/assessment.tsx`, `tests/api/assessments.test.mjs`
**Gap.** The audit records 4 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture books an assessment on a water-heater replacement request, checks it blocks an overlapping booking for that technician until reviewed, records two photos and a form on the phone, completes it, and converts the request into a quote draft carrying the photos, notes and form results; the assessment shows on the request, the quote and the customer history.; point 2 — The dispatcher or owner books an assessment on an open request (assessment book action): the technician, local date, start and end, instructions and up to 10 of the owner's forms (FIELD-002); one open assessment per request.; point 3 — It is a job of kind assessment with no lines or price, linked to the request, whose visit is booked under GLOVE-05's conflict review, so it sits on the board and the assessor's phone and blocks that time like any visit, and takes the same field capture (arrival, notes, photos, forms, through the outbox).; point 4 — Completing its visit marks it assessed (never "completed, not invoiced" and never invoiced).; point 5 — A quote drafted from that request carries the assessment's notes, photos and form results and its link; the request names its assessment; the assessment, the request and the quote show on the property history (CUST-001).; point 6 — The arrival window comes with DISP-006, the customer's confirmation and reminders with COMM-003, COMM-019, COMM-020, and turning it into a field quote on the phone with QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018, each carrying it in its text and acceptance. See docs/contract/DONE-AUDIT.md for each named outcome.

### Quotes and approval

#### QUOTE-001 — Good, better and best options and add-ons

Core · target · **partial**

**Requirement.** A quote holds up to five options, each its own set of lines and total, plus optional add-ons the customer can tick; the customer chooses one option and any add-ons, and the job carries exactly the chosen lines. Each option's price is approved under `GLOVE-03`. The owner keeps reusable quote templates beside the price book (`MONEY-003, MONEY-006`): named bundles of options, add-ons, lines from the price book, notes and terms. A quote started from a template takes the current price-book prices unless the template fixes a price, and editing a template never changes a quote already made from it. The [operating rules](docs/service-work-rules.md#quote-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture drafts three options with two add-ons, records the customer's choice of the middle option and one add-on (choosing online through the quote link is `QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013`'s acceptance), and the job's lines and total equal exactly that choice.
2. The owner saves those options as a template, raises one price-book price, and starts a second quote from the template: it carries the three options and add-ons with the raised price, and editing the template afterwards leaves the second quote unchanged.
3. A revision holds one to five options (each its own lines and total, tax computed per option) and up to ten named add-ons.
4. Approving a revision approves every option's and add-on's price under `GLOVE-03`; a changed price is a new revision.
5. The customer's answer records their choice — exactly one option and any of the add-ons — by the person taking it under `GLOVE-04` (online under `QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013`); a revision with more than one option or any add-on cannot be accepted without a choice.
6. The accepted lines are the chosen option's followed by the chosen add-ons', with tax computed once on that document, and the job carries exactly those lines and that total; booked-today and won-value figures (`REPORT-001`, `BOOK-003`) count the chosen total.
7. The owner saves named templates of options, add-ons, notes and terms; a price-book line in a template follows the price book unless the template fixes its price, and a custom line always fixes it.
8. A quote started from a template copies it at today's prices and records which template it came from; editing a template never changes a quote already made from it.

**Evidence.** `src/glove/commands/quotes.ts`, `src/glove/commands/dispatch.ts`, `src/ui/options.tsx`, `src/ui/quotes.tsx`, `tests/api/options.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture drafts three options with two add-ons, records the customer's choice of the middle option and one add-on (choosing online through the quote link is QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013's acceptance), and the job's lines and total equal exactly that choice.; point 2 — The owner saves those options as a template, raises one price-book price, and starts a second quote from the template: it carries the three options and add-ons with the raised price, and editing the template afterwards leaves the second quote unchanged.; point 3 — A revision holds one to five options (each its own lines and total, tax computed per option) and up to ten named add-ons.; point 4 — Approving a revision approves every option's and add-on's price under GLOVE-03; a changed price is a new revision.; point 5 — The customer's answer records their choice — exactly one option and any of the add-ons — by the person taking it under GLOVE-04 (online under QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013); a revision with more than one option or any add-on cannot be accepted without a choice.; point 6 — The accepted lines are the chosen option's followed by the chosen add-ons', with tax computed once on that document, and the job carries exactly those lines and that total; booked-today and won-value figures (REPORT-001, BOOK-003) count the chosen total.; point 7 — The owner saves named templates of options, add-ons, notes and terms; a price-book line in a template follows the price book unless the template fixes its price, and a custom line always fixes it.; point 8 — A quote started from a template copies it at today's prices and records which template it came from; editing a template never changes a quote already made from it. See docs/contract/DONE-AUDIT.md for each named outcome.

#### QUOTE-002 — Online approval with e-signature

Core · target · **partial** · From QUOTE-002 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001 · Register R-1, R-2

**Requirement.** Online approval with e-signature supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations. Recorded decisions: RL-4.

**Acceptance.**
1. A fixture opens a sent quote link, finds each price-book line's customer-facing description (`MONEY-003, MONEY-006`), chooses the middle of three options and one add-on (`QUOTE-001`, the job then carrying exactly that choice), requests a change, approves the revised quote with a drawn signature, and checks the signature record and that a stale revision's link cannot be approved.
2. A second quote with a 30-day validity date is opened on day 31: approval is refused, and "ask for an updated quote" puts a notice in the office queue and reopens the request.
3. A bearer delegates read, option choice, change request, decline, update request and signed approval for one price-approved revision.
4. Only a signed-in person issues it; one live link per revision, and reissue revokes the previous one.
5. The page reveals only that revision and its service site.
6. A forwarded link can be used; name and capacity are claimed, unverified, never verified, with authentication basis recorded as a link sent by Glove to the address on record or handed out by staff to an unverified recipient.
7. A decision rechecks the issuer's live role and branch; job creation rechecks price approval.
8. One decision per revision wins between staff and online and freezes it; replay changes nothing.

**Evidence.** `tests/browser/customer-quotes.spec.ts`, `tests/api/customer-quotes.test.mjs`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture opens a sent quote link, finds each price-book line's customer-facing description (MONEY-003, MONEY-006), chooses the middle of three options and one add-on (QUOTE-001, the job then carrying exactly that choice), requests a change, approves the revised quote with a drawn signature, and checks the signature record and that a stale revision's link cannot be approved.; point 2 — A second quote with a 30-day validity date is opened on day 31: approval is refused, and "ask for an updated quote" puts a notice in the office queue and reopens the request.; point 3 — A bearer delegates read, option choice, change request, decline, update request and signed approval for one price-approved revision.; point 4 — Only a signed-in person issues it; one live link per revision, and reissue revokes the previous one.; point 5 — The page reveals only that revision and its service site.; point 6 — A forwarded link can be used; name and capacity are claimed, unverified, never verified, with authentication basis recorded as a link sent by Glove to the address on record or handed out by staff to an unverified recipient.; point 7 — A decision rechecks the issuer's live role and branch; job creation rechecks price approval.; point 8 — One decision per revision wins between staff and online and freezes it; replay changes nothing. See docs/contract/DONE-AUDIT.md for each named outcome.

#### QUOTE-008 — First quote decision freezes the revision

Core · target · **partial** · From QUOTE-002 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003 · Register R-1, R-2

**Requirement.** First quote decision freezes the revision supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Requesting changes keeps the link live.

**Evidence.** `tests/browser/customer-quotes.spec.ts`, `tests/api/customer-quotes.test.mjs`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Requesting changes keeps the link live. See docs/contract/DONE-AUDIT.md for each named outcome.

#### QUOTE-009 — Quote-link custody and expiry

Core · target · **partial** · From QUOTE-002 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-SECRET-001 · Register R-1, R-2

**Requirement.** Quote-link custody and expiry supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The token is shown once, hashed separately at rest, sent in the URL fragment and Authorization header only, and absent from queries, logs, saved command outcomes, Activity, business exports and installation archives.
2. An older revision's link shows only “a newer revision was sent” and refuses decisions.
3. An expired quote remains readable and offers an update request once per revision until the link expires 90 days after validity.
4. Restore retains records and document hashes but requires new links; erasure follows DATA-001, DATA-005, DATA-006, DATA-007, DATA-008.
5. The quote-validity setting is owner-only, 1–3650 calendar days, default 30 for new revisions.
6. Drafts and revisions take an optional real valid-until date date; validity includes that date in the frozen branch/business zone, and the link expires at local midnight starting the day after validity plus 90 calendar days.
7. Defaults change later revisions only.
8. Legacy revisions without validity must be revised and price-approved before a link can be issued.

**Evidence.** `tests/browser/customer-quotes.spec.ts`, `tests/api/customer-quotes.test.mjs`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The token is shown once, hashed separately at rest, sent in the URL fragment and Authorization header only, and absent from queries, logs, saved command outcomes, Activity, business exports and installation archives.; point 2 — An older revision's link shows only “a newer revision was sent” and refuses decisions.; point 3 — An expired quote remains readable and offers an update request once per revision until the link expires 90 days after validity.; point 4 — Restore retains records and document hashes but requires new links; erasure follows DATA-001, DATA-005, DATA-006, DATA-007, DATA-008.; point 5 — The quote-validity setting is owner-only, 1–3650 calendar days, default 30 for new revisions.; point 6 — Drafts and revisions take an optional real valid-until date date; validity includes that date in the frozen branch/business zone, and the link expires at local midnight starting the day after validity plus 90 calendar days.; point 7 — Defaults change later revisions only.; point 8 — Legacy revisions without validity must be revised and price-approved before a link can be issued. See docs/contract/DONE-AUDIT.md for each named outcome.

#### QUOTE-010 — Signing consent and frozen customer copy

Core · target · **partial** · From QUOTE-002 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003 · Register R-1, R-2

**Requirement.** Signing consent and frozen customer copy supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The final signing capability must record an affirmed versioned consent disclosure and its hash, revision document hash, drawn or typed signature, signer and claimed capacity, authentication basis, link ID, time, IP address and browser, then freeze the signed copy and its hash and send a confirmation copy to the on-record email when COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 is connected.
2. The signing flow follows BASE-ACCESSIBILITY-001 and always offers a typed signature.
3. Production signing waits for the owner's accepted concrete consent disclosure; no ESIGN, UETA or eIDAS validity is claimed.
4. A signed-in unscoped owner uses the signing-consent setting to enter and explicitly accept concrete disclosure; no default text or environment bypass is supplied.
5. Each accepted disclosure has a numbered version, hash and owner/time history; changing it or disabling signing refuses signatures prepared under the old disclosure.
6. The customer reviews a server-hashed chosen document, affirms that disclosure and signs with bounded drawn strokes or a typed signature.
7. Approval uses the ordinary exact chosen option/add-on calculation and first-decision freeze.
8. The winning record contains claimed name/capacity, authentication basis, link ID, time, IP (or explicit unavailable), browser, signature, disclosure version/text/hash and both revision/chosen document hashes.

**Evidence.** `tests/browser/customer-quotes.spec.ts`, `tests/api/customer-quotes.test.mjs`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The final signing capability must record an affirmed versioned consent disclosure and its hash, revision document hash, drawn or typed signature, signer and claimed capacity, authentication basis, link ID, time, IP address and browser, then freeze the signed copy and its hash and send a confirmation copy to the on-record email when COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 is connected.; point 2 — The signing flow follows BASE-ACCESSIBILITY-001 and always offers a typed signature.; point 3 — Production signing waits for the owner's accepted concrete consent disclosure; no ESIGN, UETA or eIDAS validity is claimed.; point 4 — A signed-in unscoped owner uses the signing-consent setting to enter and explicitly accept concrete disclosure; no default text or environment bypass is supplied.; point 5 — Each accepted disclosure has a numbered version, hash and owner/time history; changing it or disabling signing refuses signatures prepared under the old disclosure.; point 6 — The customer reviews a server-hashed chosen document, affirms that disclosure and signs with bounded drawn strokes or a typed signature.; point 7 — Approval uses the ordinary exact chosen option/add-on calculation and first-decision freeze.; point 8 — The winning record contains claimed name/capacity, authentication basis, link ID, time, IP (or explicit unavailable), browser, signature, disclosure version/text/hash and both revision/chosen document hashes. See docs/contract/DONE-AUDIT.md for each named outcome.

#### QUOTE-011 — Immutable signed customer copy

Core · target · **partial** · From QUOTE-002 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003 · Register R-1, R-2

**Requirement.** Immutable signed customer copy supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The immutable self-contained HTML copy embeds its original images and signature and is stored with a verified SHA-256; desk and live customer-link doors return those same bytes.

**Evidence.** `tests/browser/customer-quotes.spec.ts`, `tests/api/customer-quotes.test.mjs`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The immutable self-contained HTML copy embeds its original images and signature and is stored with a verified SHA-256; desk and live customer-link doors return those same bytes. See docs/contract/DONE-AUDIT.md for each named outcome.

#### QUOTE-012 — Quote-link issue and response records

Core · target · **partial** · From QUOTE-002 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-AUDIT-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001, BASE-SECRET-001 · Register R-1, R-2

**Requirement.** Quote-link issue and response records supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Issuing a quote link and revoking a quote link require a signed-in person allowed to record that quote as sent, never an integration token.
2. A link freezes a customer-only document and canonical SHA-256, with price-book customer descriptions captured when priced; costs, internal evidence and unrelated customer details are excluded.
3. The desk shares it outside Glove, labelled recipient unverified, or queues it to the customer's on-record address through COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 with the actual provider outcome.
4. A customer response records “link sent by Glove to the address on record” only once a provider fact confirms the provider took the email; a refused or unconfirmed send retains the staff-handed, recipient-unverified basis.
5. The customer quote door reads only that revision; same-origin JSON responses can request changes, decline with a claimed name and capacity, or request an update once per revision.
6. Changes and updates enter the office queue, Activity, property history, COMM-007 stream and business export; an update reopens the originating request as contacted.
7. A decline competes atomically with staff decisions and makes the revision read-only.
8. Issuer role removal, branch restriction, revocation and expiry are enforced again in the commit batch.

**Evidence.** `tests/browser/customer-quotes.spec.ts`, `tests/api/customer-quotes.test.mjs`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Issuing a quote link and revoking a quote link require a signed-in person allowed to record that quote as sent, never an integration token.; point 2 — A link freezes a customer-only document and canonical SHA-256, with price-book customer descriptions captured when priced; costs, internal evidence and unrelated customer details are excluded.; point 3 — The desk shares it outside Glove, labelled recipient unverified, or queues it to the customer's on-record address through COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 with the actual provider outcome.; point 4 — A customer response records “link sent by Glove to the address on record” only once a provider fact confirms the provider took the email; a refused or unconfirmed send retains the staff-handed, recipient-unverified basis.; point 5 — The customer quote door reads only that revision; same-origin JSON responses can request changes, decline with a claimed name and capacity, or request an update once per revision.; point 6 — Changes and updates enter the office queue, Activity, property history, COMM-007 stream and business export; an update reopens the originating request as contacted.; point 7 — A decline competes atomically with staff decisions and makes the revision read-only.; point 8 — Issuer role removal, branch restriction, revocation and expiry are enforced again in the commit batch. See docs/contract/DONE-AUDIT.md for each named outcome.

#### QUOTE-013 — Signed-copy confirmation and custody

Core · target · **partial** · From QUOTE-002 · Cites BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003 · Register R-1, R-2

**Requirement.** Signed-copy confirmation and custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A connected COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 provider receives the winning HTML and text confirmation once after commit to the on-record email; actual provider outcomes remain separate from signing.
2. A refused confirmation does not undo the signature or claim delivery.
3. Reissue for an accepted/declined quote is read-only and preserves the frozen revision.
4. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 removes signed-copy chunks and signature evidence; rer export/import preserves their exact bytes while excluding bearer credentials.
5. Typed signing is always available by keyboard at 390 px, disclosure text and consent controls retain labels/focus, and the signing page reflows without sideways scroll.
6. No verified-identity or ESIGN/UETA/eIDAS validity claim is made.

**Evidence.** `tests/browser/customer-quotes.spec.ts`, `tests/api/customer-quotes.test.mjs`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A connected COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 provider receives the winning HTML and text confirmation once after commit to the on-record email; actual provider outcomes remain separate from signing.; point 2 — A refused confirmation does not undo the signature or claim delivery.; point 3 — Reissue for an accepted/declined quote is read-only and preserves the frozen revision.; point 4 — DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 removes signed-copy chunks and signature evidence; rer export/import preserves their exact bytes while excluding bearer credentials.; point 5 — Typed signing is always available by keyboard at 390 px, disclosure text and consent controls retain labels/focus, and the signing page reflows without sideways scroll.; point 6 — No verified-identity or ESIGN/UETA/eIDAS validity claim is made. See docs/contract/DONE-AUDIT.md for each named outcome.

#### QUOTE-003 — Deposits on approval

Core · target · **partial** · From QUOTE-003

**Requirement.** Deposits on approval supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture approves a $1,850 quote with a $500 deposit (Stripe fake), finds the deposit on the job, and checks the final invoice shows $1,350 due.
2. Only the signed-in unscoped owner sets service deposit action for future quote revisions or quote deposit action on an unapproved draft: an amount or a percentage above zero and at most 100, with half-up cent rounding against the eventual chosen total.
3. The rule is frozen in the linked revision, chosen-document hash and signed copy; approved/accepted revisions cannot change it.
4. After the winning current price-approved revision is signed under QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 and its exact job exists, that owner alone can prepare test card/ACH Checkout (payment deposit checkout action).
5. A confirmed deposit stays on that job; invoice preparation links it and any prior original-method refund to the final invoice once, and only net confirmed funds reduce the balance.
6. Pending ACH remains pending.
7. Original-method refunds use PAY-004, PAY-021, PAY-022, PAY-023, including before invoice preparation.

**Evidence.** `tests/api/customer-quotes.test.mjs`
**Gap.** Customer-initiated deposits on online approval and the customer-scoped Checkout door under PAY-002/RL-106 remain unbuilt; the existing test slice is owner-created and infers no automatic charge.

#### QUOTE-014 — Customer deposit payment boundary

Core · target · **missing** · From QUOTE-003

**Requirement.** Customer deposit payment boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Under RL-106, the customer explicitly initiates only the deposit for the exact approved quote through PAY-002’s customer-scoped hosted payment authority.
2. Signing alone initiates no charge; the bearer grants no access to another customer’s records or general login.

**Evidence.** `tests/api/customer-quotes.test.mjs`
**Gap.** Customer-initiated quote-deposit Checkout under RL-106 remains unbuilt. The separate Owner-created test reservation does not deliver this customer door; signing alone still creates no charge.

#### QUOTE-004 — Automatic quote follow-up

Core · target · **partial** · Rules D-1 · Register R-9

**Requirement.** QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 inheritance: stop on the winning staff or customer-link decision and the frozen validity date; an update request notifies the office and needs a newly approved revision. The owner sets a follow-up sequence (for example day 2 text, day 5 email, day 10 call task); Glove sends it through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`/`COMM-002` for every unanswered quote, stops the moment the customer answers, the quote is closed or it reaches its validity date (`QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013`), and shows which step each open quote is on. The [operating rules](docs/service-work-rules.md#quote-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture advances a clock past each step for three quotes, one answered on day 3 and one whose validity date is day 7, and checks exactly which messages were sent, that the answered quote's sequence stopped, and that the expiring quote's day-10 step was never sent.

**Evidence.** `tests/api/reminders.test.mjs`, `tests/browser/reminders.spec.ts`
**Gap.** Call steps create internal tasks only and never place calls. The private withdrawal link permits only an explicit stop of quote-purpose follow-up. Live provider delivery remains unrun; RL-102 resolves shared consent, quiet-hours and withdrawal policy. Existing implementation proof remains partial.

#### QUOTE-005 — Branded quote, invoice and report documents

Core · target · **partial** · From QUOTE-005

**Requirement.** Branded quote, invoice and report documents supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-005-operating-rules) retain the record formats and calculations. Owning-capability boundaries: FIELD-003 inheritance: render the immutable service report as the branded PDF with every snapshot field and flagged form reading, asserted in the document journey.

**Acceptance.**
1. A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds logo, license number, terms, an attached photo and each price-book line's customer-facing description (`MONEY-003, MONEY-006`) in both; it then opens an invoice and a service report and finds the EIN, two license numbers and logo set under `MONEY-002` printed on each.
2. The signed-in owner edits plain-text heading, terms and footer per document kind, and explicitly attaches customer-facing photos.
3. Issuing a quote link freezes the business identity, template, line descriptions/images and attachments in its hashed customer document; completing a report freezes the same identity/template with every report field.
4. Later edits never change those snapshots.
5. Invoices and agreements use their current desk-authorized projection and current template; invoice lines retain the approved job’s customer descriptions/images.

**Evidence.** `tests/browser/documents.spec.ts`, `tests/api/documents.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds logo, license number, terms, an attached photo and each price-book line's customer-facing description (MONEY-003, MONEY-006) in both; it then opens an invoice and a service report and finds the EIN, two license numbers and logo set under MONEY-002 printed on each.; point 2 — The signed-in owner edits plain-text heading, terms and footer per document kind, and explicitly attaches customer-facing photos.; point 3 — Issuing a quote link freezes the business identity, template, line descriptions/images and attachments in its hashed customer document; completing a report freezes the same identity/template with every report field.; point 4 — Later edits never change those snapshots.; point 5 — Invoices and agreements use their current desk-authorized projection and current template; invoice lines retain the approved job’s customer descriptions/images. See docs/contract/DONE-AUDIT.md for each named outcome.

#### QUOTE-015 — Document presentation and print

Core · target · **partial** · From QUOTE-005 · Cites BASE-DATA-001, BASE-ROLE-001

**Requirement.** Document presentation and print supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Existing role, branch, revision and original-file guards apply.
2. Dates use US calendar presentation and ten-digit phones use US punctuation; saved legacy addresses and time zones remain as recorded.
3. Print / Save PDF invokes the browser’s print renderer after removing a bearer fragment, restores the link after printing, includes the whole document and hides response controls.
4. No signing, send or delivery claim is added; QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013/006 retain their owner-disclosure gate and COMM-006, COMM-022, COMM-023, COMM-024, COMM-025 inherits the same document and original-file restrictions.

**Evidence.** `tests/browser/documents.spec.ts`, `tests/api/documents.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Existing role, branch, revision and original-file guards apply.; point 2 — Dates use US calendar presentation and ten-digit phones use US punctuation; saved legacy addresses and time zones remain as recorded.; point 3 — Print / Save PDF invokes the browser’s print renderer after removing a bearer fragment, restores the link after printing, includes the whole document and hides response controls.; point 4 — No signing, send or delivery claim is added; QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013/006 retain their owner-disclosure gate and COMM-006, COMM-022, COMM-023, COMM-024, COMM-025 inherits the same document and original-file restrictions. See docs/contract/DONE-AUDIT.md for each named outcome.

#### QUOTE-006 — Field quotes and change orders, offline

Core · target · **partial** · From QUOTE-006

**Requirement.** Field quotes and change orders, offline supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture with the network off builds a two-option field quote, captures the customer's signature, reconnects, and finds the approved change order on the job and its lines on the invoice draft; an out-of-range price waits for approval; and the `REPORT-002, REPORT-004` technician report shows that technician's close rate from their field quotes; a completed assessment becomes a field quote carrying its photos.
2. The unscoped signed-in owner explicitly enables online field pricing per technician, bound to that technician’s current sign-in.
3. The technician reads selling prices and their own field quotes only while currently assigned to an open job or completed assessment.
4. The ordinary state and offline day remain unpriced.
5. Options use active price-book items, authoritative tax and descriptions, and the owner’s inclusive per-line unit-price bounds expressed as whole percentages of the current price-book price.
6. A price outside those bounds is flagged for the desk; every draft remains subject to ordinary desk price approval.
7. Drafting from a completed assessment retains its notes, photos and form results.

**Evidence.** `tests/api/options.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** phone controls and offline pricing custody, offline two-option signing with QUOTE-002 consent and document evidence, change-order application for existing invoices, recurring billing, discounts, deposits or differing tax snapshots, and full phone browser proof remain. Online grant approved by ct 24 October 2026 14:50Z; off by default, current sign-in and assignment, selling prices only, desk approval for every draft, next-request WITHDRAWAL asserted. Owner-only application approved by ct 24 October 2026 16:35Z; scoped-owner refusal and no amendment before the explicit owner act are asserted

#### QUOTE-016 — Field-quote custody and selling figures

Core · target · **partial** · From QUOTE-006

**Requirement.** Field-quote custody and selling figures supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Command replay returns only a receipt and never another copy of the priced document.
2. Revocation and reassignment close the read and new-draft doors; sign-in relinking requires a fresh owner grant.
3. A grant never approves a customer-facing price or creates a customer decision, signature, send or job amendment.
4. The technician report counts accepted field quotes divided by accepted or declined field quotes answered in its inclusive business-local date period, to one decimal percent; unanswered drafts are excluded and an empty denominator is unavailable.
5. Its JSON and CSV carry accepted and answered counts.
6. A desk-recorded acceptance defaults its commission seller to the originating technician, retaining the existing explicit desk override.
7. The remaining phone, signing and change-order work retains QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013, GLOVE-06, TEAM-003, TEAM-006 and DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 obligations.

**Evidence.** `tests/api/options.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** phone controls and offline pricing custody, offline two-option signing with QUOTE-002 consent and document evidence, change-order application for existing invoices, recurring billing, discounts, deposits or differing tax snapshots, and full phone browser proof remain. Online grant approved by ct 24 October 2026 14:50Z; off by default, current sign-in and assignment, selling prices only, desk approval for every draft, next-request WITHDRAWAL asserted. Owner-only application approved by ct 24 October 2026 16:35Z; scoped-owner refusal and no amendment before the explicit owner act are asserted

#### QUOTE-017 — Apply the signed change order

Core · target · **partial** · From QUOTE-006 · Cites BASE-AUDIT-001

**Requirement.** Apply the signed change order supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A technician explicitly drafts additions with field quote draft action; an assessment can only produce a new quote.
2. The signed-in unscoped owner explicitly invokes field quote apply action with the current quote and source-job versions.
3. The current revision needs its desk price approval, winning customer acceptance and frozen QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 signature, disclosure and signed-copy evidence.
4. The selected lines append once to the same open source job, with their applicable checklists and forms; its ordinary completion and invoice preparation carry those lines while invoice approval remains separate.
5. A field change order cannot create another job.
6. Replays return the receipt only.
7. Activity and export retain the quote revision, signed-copy hash and application actor and time.

**Evidence.** `tests/api/options.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** phone controls and offline pricing custody, offline two-option signing with QUOTE-002 consent and document evidence, change-order application for existing invoices, recurring billing, discounts, deposits or differing tax snapshots, and full phone browser proof remain. Online grant approved by ct 24 October 2026 14:50Z; off by default, current sign-in and assignment, selling prices only, desk approval for every draft, next-request WITHDRAWAL asserted. Owner-only application approved by ct 24 October 2026 16:35Z; scoped-owner refusal and no amendment before the explicit owner act are asserted

#### QUOTE-018 — Change-order reconciliation and authority

Core · target · **partial** · From QUOTE-006 · Cites BASE-ROLE-001

**Requirement.** Change-order reconciliation and authority supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Existing invoices, recurring billing, discounts, deposits, mismatched frozen tax or a combined rounding difference refuse for explicit desk reconciliation; they are named engineering gaps, never silently repriced.
2. Field drafts without the explicit change-order flag retain the ordinary new-job path.
3. Only a signed-in Owner without branch limits explicitly applies the change order under RL-29; scoped or non-owner sessions and unsigned or desk-unapproved changes refuse, and signing alone never amends a job.

**Evidence.** `tests/api/options.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** phone controls and offline pricing custody, offline two-option signing with QUOTE-002 consent and document evidence, change-order application for existing invoices, recurring billing, discounts, deposits or differing tax snapshots, and full phone browser proof remain. Online grant approved by ct 24 October 2026 14:50Z; off by default, current sign-in and assignment, selling prices only, desk approval for every draft, next-request WITHDRAWAL asserted. Owner-only application approved by ct 24 October 2026 16:35Z; scoped-owner refusal and no amendment before the explicit owner act are asserted

#### QUOTE-007 — Discounts on quotes and invoices

Core · target · **partial** · From QUOTE-007

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

**Evidence.** `src/glove/sales-tax.ts`, `src/glove/discounts.ts`, `tests/api/discounts.test.mjs`, `tests/browser/discounts.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) with a $50.00 non-taxable first-time-customer discount line and a 10% document discount, and checks subtotal $650.00, discount $65.00 taken from labor, tax $33.00 and total $618.00; a 50% document discount on the same lines spills $75.00 onto the parts and gives tax $26.81 and total $351.81; the accepted figures are identical to the cent on the job, the invoice, the CSV and the explicitly mapped QuickBooks inspection payload.; point 2 — A discount line is a line whose unit price is negative (-50.00), custom or from a price-book item of kind discount (a fixed negative price, no cost); its line total rounds half a cent away from zero.; point 3 — Each line is taxable or non-taxable as MONEY-001, MONEY-004, MONEY-005 decides (item flag, labor rule, exemption); discount lines may not take either pool below zero.; point 4 — The document discount is a percent of the subtotal (above 0 to 100, two places, amount rounded half up to the cent) or a fixed dollar amount, never above the subtotal, with a reason up to 100 characters.; point 5 — It comes off the non-taxable lines first (line order, each line at most its own amount), then taxable lines in line order; tax is the jurisdiction rate on the remaining taxable cents, rounded half up once, and the total is subtotal − discount + tax.; point 6 — Each quote option carries its own discount; add-ons take discount lines only; on acceptance the chosen option's discount applies to the accepted lines (a percent re-applies to their subtotal, an amount stays fixed).; point 7 — The job and invoice carry it; an invoice revision or correction keeps it unless the payload sets another.; point 8 — The CSV writes the discount as up to two rows (non-taxable and taxable amounts); the QuickBooks inspection payload writes a DiscountLineDetail with tax after discount and both amounts in its description; revenue reports and job costing use subtotal less discount. See docs/contract/DONE-AUDIT.md for each named outcome.

#### QUOTE-019 — Role discount limits

Core · target · **partial** · From QUOTE-007 · Cites BASE-ROLE-001

**Requirement.** Role discount limits supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Limits: the owner is unlimited; business save action role discount limits gives each built-in or custom role a maximum percent of the document's gross (positive-line) subtotal, counting discount lines and the document discount together; an unlisted role gives none, checked on person and agent quote drafts and revisions and invoice preparations, revisions and corrections; carrying an accepted quote's discount unchanged is not giving one; A binding price decision carries commitment when an agent makes it, and the company’s policy decides that call; a person’s own price approval remains their own act.

**Evidence.** `src/glove/sales-tax.ts`, `src/glove/discounts.ts`, `tests/api/discounts.test.mjs`, `tests/browser/discounts.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Limits: the owner is unlimited; business save action role discount limits gives each built-in or custom role a maximum percent of the document's gross (positive-line) subtotal, counting discount lines and the document discount together; an unlisted role gives none, checked on person and agent quote drafts and revisions and invoice preparations, revisions and corrections; carrying an accepted quote's discount unchanged is not giving one; A binding price decision carries commitment when an agent makes it, and the company’s policy decides that call; a person’s own price approval remains their own act. See docs/contract/DONE-AUDIT.md for each named outcome.

### Scheduling and dispatch

#### DISP-001 — Drag-and-drop dispatch board

Core · target · **partial** · Cites BASE-ACCESSIBILITY-001

**Requirement.** Day, week and month views by technician and by crew, an unscheduled-jobs list, drag-and-drop to book, move, reassign or resize a visit (each drop is a `GLOVE-07` change with conflict review), color by job type or status, and a keyboard path for every drag. The [operating rules](docs/service-work-rules.md#disp-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture at 1440 px drags an unscheduled job onto a technician, moves it to another day, triggers and confirms a conflict review, and repeats the move with the keyboard.
2. The board shows a day (one row per technician across the hours), a week (Sunday to Saturday, technicians by day) or a month (weeks of days, all technicians or one), in the business time zone; inactive technicians show only where they have visits in the shown range.
3. The unscheduled list is the "Waiting to book" card: accepted quotes still to become jobs and open jobs with no booked or started visit.
4. Dragging an unscheduled job onto a technician books it (visit book action) for one hour at the dropped quarter hour in the day, or at 9:00 on the dropped day in the week and month (in the month for the chosen technician, else the first active one).
5. Dragging a booked or started visit moves it to the dropped quarter hour, day and technician keeping its length, and dragging its right edge in the day changes its end; each drop asks for the reason and is a `GLOVE-07` change (visit change action) with its conflict review.
6. The keyboard path on a focused visit: left and right move it a quarter hour in the day and a day in the week and month, up and down change technician (a week in the month), Shift with left or right changes its end by a quarter hour in the day, Enter reviews the change and Escape drops it; booking by keyboard is the "Book a visit" form.
7. Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by job type (the category of the job's first price-book line, else Uncategorized, as in `COST-004`), with a legend.
8. Views by crew are `DISP-007, DISP-013, DISP-014`'s Rows choice on the same board.

**Evidence.** `src/ui/dispatch.tsx`, `src/ui/dispatch-board.tsx`, `src/glove/commands/dispatch.ts`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture at 1440 px drags an unscheduled job onto a technician, moves it to another day, triggers and confirms a conflict review, and repeats the move with the keyboard.; point 2 — The board shows a day (one row per technician across the hours), a week (Sunday to Saturday, technicians by day) or a month (weeks of days, all technicians or one), in the business time zone; inactive technicians show only where they have visits in the shown range.; point 3 — The unscheduled list is the "Waiting to book" card: accepted quotes still to become jobs and open jobs with no booked or started visit.; point 4 — Dragging an unscheduled job onto a technician books it (visit book action) for one hour at the dropped quarter hour in the day, or at 9:00 on the dropped day in the week and month (in the month for the chosen technician, else the first active one).; point 5 — Dragging a booked or started visit moves it to the dropped quarter hour, day and technician keeping its length, and dragging its right edge in the day changes its end; each drop asks for the reason and is a GLOVE-07 change (visit change action) with its conflict review.; point 6 — The keyboard path on a focused visit: left and right move it a quarter hour in the day and a day in the week and month, up and down change technician (a week in the month), Shift with left or right changes its end by a quarter hour in the day, Enter reviews the change and Escape drops it; booking by keyboard is the "Book a visit" form.; point 7 — Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by job type (the category of the job's first price-book line, else Uncategorized, as in COST-004), with a legend.; point 8 — Views by crew are DISP-007, DISP-013, DISP-014's Rows choice on the same board. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-002 — Map board and travel time

Core · target · **partial** · From DISP-002 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-SECRET-001

**Requirement.** Map board and travel time supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture opens the map board with a fixture day, sees pins and drive times (provider fake), and the technician's phone offers a directions link with the site's address; a flow test draws a zone for a technician and checks a booking at a site outside it gets the area warning.
2. Only the owner connects Google Maps Platform with their own key, kept as an installation secret (never in state, Activity, a command result, the business export, the installation archive or a log; a restored installation needs it entered again).
3. While it is connected, saving a site with a new or changed address places it with Google's Geocoding API (the street address only goes to Google) and keeps its latitude and longitude on the site, or says Google found no such place; the desk places listed sites again with site locate action.
4. The day board shows a route map over the board (the day map, desk roles only): Google's base map (Static Maps API, asked for by center and zoom only) under Glove's own numbered pins for each technician's stops in order, the legs between consecutive stops with the drive time and distance from Google's Routes API (driving, traffic-unaware; only the stops' coordinates go to Google), and the zones drawn for each technician; a stop whose site is not on the map is listed with **Place on the map**.
5. On the technician's phone each visit offers directions to the site's address in Apple Maps, Google Maps or Waze.
6. The owner draws a technician's zones on the map (technician zones action: up to 20 named polygons of 3 to 100 corners, by clicking corners or typing them).
7. A technician's service area is their ZIP codes and drawn zones together: with zones drawn, a site whose ZIP is not listed and which is not inside any zone (a site not on the map is inside none) falls under the owner's area rule, warned for review or refused, exactly as `DISP-004`'s ZIP rule.

**Evidence.** `src/glove/maps.ts`, `src/glove/commands/maps.ts`, `src/ui/dispatch-map.tsx`, `tests/api/eligibility.test.mjs`, `tests/browser/dispatch-map.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture opens the map board with a fixture day, sees pins and drive times (provider fake), and the technician's phone offers a directions link with the site's address; a flow test draws a zone for a technician and checks a booking at a site outside it gets the area warning.; point 2 — Only the owner connects Google Maps Platform with their own key, kept as an installation secret (never in state, Activity, a command result, the business export, the installation archive or a log; a restored installation needs it entered again).; point 3 — While it is connected, saving a site with a new or changed address places it with Google's Geocoding API (the street address only goes to Google) and keeps its latitude and longitude on the site, or says Google found no such place; the desk places listed sites again with site locate action.; point 4 — The day board shows a route map over the board (the day map, desk roles only): Google's base map (Static Maps API, asked for by center and zoom only) under Glove's own numbered pins for each technician's stops in order, the legs between consecutive stops with the drive time and distance from Google's Routes API (driving, traffic-unaware; only the stops' coordinates go to Google), and the zones drawn for each technician; a stop whose site is not on the map is listed with **Place on the map**.; point 5 — On the technician's phone each visit offers directions to the site's address in Apple Maps, Google Maps or Waze.; point 6 — The owner draws a technician's zones on the map (technician zones action: up to 20 named polygons of 3 to 100 corners, by clicking corners or typing them).; point 7 — A technician's service area is their ZIP codes and drawn zones together: with zones drawn, a site whose ZIP is not listed and which is not inside any zone (a site not on the map is inside none) falls under the owner's area rule, warned for review or refused, exactly as DISP-004's ZIP rule. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-010 — Travel-aware automatic assignment

Core · target · **partial** · From DISP-002

**Requirement.** Travel-aware automatic assignment supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. travel time from the previous visit joins the automatic-assignment ranking.
2. With Google Maps connected, `DISP-006`'s automatic assignment adds to each candidate's booked minutes their drive minutes from their previous visit that day (the latest ending by the new start; none, no drive) to the job's site, and picks the fewest booked-plus-drive minutes, then by name, naming each one's booked and drive minutes in the ranking; a site Google cannot place, or a drive with no route, refuses the automatic booking so the dispatcher chooses.
3. Live technician positions are `DISP-005, DISP-012`'s, and route optimization `DISP-003, DISP-011`'s, each carrying the map board in its text and acceptance.

**Evidence.** `src/glove/maps.ts`, `src/glove/commands/maps.ts`, `src/ui/dispatch-map.tsx`, `tests/api/eligibility.test.mjs`, `tests/browser/dispatch-map.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — travel time from the previous visit joins the automatic-assignment ranking.; point 2 — With Google Maps connected, DISP-006's automatic assignment adds to each candidate's booked minutes their drive minutes from their previous visit that day (the latest ending by the new start; none, no drive) to the job's site, and picks the fewest booked-plus-drive minutes, then by name, naming each one's booked and drive minutes in the ranking; a site Google cannot place, or a drive with no route, refuses the automatic booking so the dispatcher chooses.; point 3 — Live technician positions are DISP-005, DISP-012's, and route optimization DISP-003, DISP-011's, each carrying the map board in its text and acceptance. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-003 — Route optimization

Core · target · **partial** · From DISP-003

**Requirement.** Route optimization supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture optimizes a fixture day of 12 visits for 3 technicians (routing provider fake), checks no arrival window or skill is broken and the drive time falls, and checks nothing moves until accepted.
2. A signed-in owner or dispatcher requests a day or one technician with route optimize action; the existing 15-minute Worker cron claims one durable job per pass.
3. A job covers 2–20 visits and up to 8 assigned technicians.
4. It requests coordinate-only, traffic-unaware Google Routes driving times with a ten-second abort, then performs at most 1,200 appointment exchanges within twenty seconds.
5. It retains appointment duration and arrival windows, validates skills, working availability, service areas, overlaps and driving time against the whole proposed schedule, and keeps crews and visits with field evidence fixed.
6. It saves the original and proposed slots and driving comparison; no visit moves in the background.
7. The board shows the proposal and time saved.
8. The comparison measures driving between visits, with no depot legs; the bounded improvement search does not claim a global optimum.

**Evidence.** `tests/api/routing.test.mjs`, `tests/browser/routing.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture optimizes a fixture day of 12 visits for 3 technicians (routing provider fake), checks no arrival window or skill is broken and the drive time falls, and checks nothing moves until accepted.; point 2 — A signed-in owner or dispatcher requests a day or one technician with route optimize action; the existing 15-minute Worker cron claims one durable job per pass.; point 3 — A job covers 2–20 visits and up to 8 assigned technicians.; point 4 — It requests coordinate-only, traffic-unaware Google Routes driving times with a ten-second abort, then performs at most 1,200 appointment exchanges within twenty seconds.; point 5 — It retains appointment duration and arrival windows, validates skills, working availability, service areas, overlaps and driving time against the whole proposed schedule, and keeps crews and visits with field evidence fixed.; point 6 — It saves the original and proposed slots and driving comparison; no visit moves in the background.; point 7 — The board shows the proposal and time saved.; point 8 — The comparison measures driving between visits, with no depot legs; the bounded improvement search does not claim a global optimum. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-011 — Apply or discard a route proposal

Core · target · **partial** · From DISP-003 · Cites BASE-DATA-001, BASE-DATA-003, BASE-ROLE-001

**Requirement.** Apply or discard a route proposal supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Route accept action requires a person's reason, fresh live dispatch/branch authority, unchanged day/eligibility dependencies and a fresh provider matrix, then commits every move and assignment history together.
2. Discard, provider refusal, expiration and stale proposals move nothing.
3. Restore retains proposal metadata but requires Google Maps to be reconnected; customer erasure discards affected undecided proposals and redacts their erased references.

**Evidence.** `tests/api/routing.test.mjs`, `tests/browser/routing.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Route accept action requires a person's reason, fresh live dispatch/branch authority, unchanged day/eligibility dependencies and a fresh provider matrix, then commits every move and assignment history together.; point 2 — Discard, provider refusal, expiration and stale proposals move nothing.; point 3 — Restore retains proposal metadata but requires Google Maps to be reconnected; customer erasure discards affected undecided proposals and redacts their erased references. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-004 — Skills, availability, time off and service areas

Core · target · **partial** · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-SECRET-001

**Requirement.** Technician eligibility combines skills, hours, time off, ZIP codes and drawn service areas, calendar busy spans and the owner’s warn-or-refuse area rule. Lanyard availability is a read-only connector scoped to one explicitly selected worker; credentials and unrelated staff or payroll information remain private. The [operating rules](docs/service-work-rules.md#disp-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture books a gas job for a technician without the gas skill (refused), on their day off (refused) and outside their area (warning), then books it for an eligible technician; a flow test reads a technician's calendar (provider fake), refuses a booking over a busy span and books a free one, and checks the address is readable only by the owner and that technician and absent from state, timeline, command results and export.
2. A fixture has the owner connect a technician with an explicit staff ID and key, checks the key is absent from state, Activity, command results, the export and the archive, checks Glove sent only GETs to the fixed availability path with nothing about customers or jobs and refused a redirect, checks only that staff member's availability windows and approved-leave instants for the next 90 days are kept (Lanyard's recurring patterns as Lanyard defines them; pending and declined leave ignored; no names, payroll, preferences, reasons or other staff), warns or refuses a booking by the owner's setting, keeps and labels the last snapshot with its read time after a failed read with a generic message, clears it on disconnect, shows reconnect for an expired key, and refuses an http, non-public-host or credential-bearing origin.

**Evidence.** `src/glove/eligibility.ts`, `src/glove/calendar.ts`, `src/glove/commands/calendar.ts`, `src/ui/availability.tsx`, `tests/api/eligibility.test.mjs`
**Gap.** availability not read from Lanyard (no Lanyard read door yet); Base egress door: partial until Glove adopts Base's egress door for the owner-entered Lanyard origin (gr-base-285)

#### DISP-005 — Live technician location and ETA

Core · target · **partial** · From DISP-005 · Cites BASE-ROLE-001

**Requirement.** Live technician location and ETA supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-005-operating-rules) retain the record formats and calculations. Recorded decisions: RL-6.

**Acceptance.**
1. A fixture posts phone locations and a fleet-provider feed (fake), checks positions and ETAs on the board, and checks no location is recorded after clock-out.
2. Location sharing starts off.
3. Only the technician's current person session can record or withdraw their explicit consent; the phone requests browser permission and captures only while visible, online, clocked in and running a travel or job timer on its current assigned visit.
4. Locations never enter the offline outbox.
5. The owner can explicitly connect one Samsara vehicle per technician and request its current GPS snapshot from the fixed documented host; that read requires the same consent, shift and visit checks.
6. Coordinates captured before the shift or timer, more than two minutes ago, in the future beyond ten seconds, or after assignment, consent or sign-in withdrawal are refused.
7. The most recent position replaces the previous one in transient storage; it is hidden after two minutes and removed by the next product command, clock-out, timer stop, reassignment or consent withdrawal.
8. Consent changes and generic capture outcomes are audited without coordinates.

**Evidence.** `tests/api/eligibility.test.mjs`, `tests/portable.mjs`, `tests/browser/dispatch-map.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture posts phone locations and a fleet-provider feed (fake), checks positions and ETAs on the board, and checks no location is recorded after clock-out.; point 2 — Location sharing starts off.; point 3 — Only the technician's current person session can record or withdraw their explicit consent; the phone requests browser permission and captures only while visible, online, clocked in and running a travel or job timer on its current assigned visit.; point 4 — Locations never enter the offline outbox.; point 5 — The owner can explicitly connect one Samsara vehicle per technician and request its current GPS snapshot from the fixed documented host; that read requires the same consent, shift and visit checks.; point 6 — Coordinates captured before the shift or timer, more than two minutes ago, in the future beyond ten seconds, or after assignment, consent or sign-in withdrawal are refused.; point 7 — The most recent position replaces the previous one in transient storage; it is hidden after two minutes and removed by the next product command, clock-out, timer stop, reassignment or consent withdrawal.; point 8 — Consent changes and generic capture outcomes are audited without coordinates. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-012 — Position disclosure and delay estimate

Core · target · **partial** · From DISP-005 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-ROLE-001

**Requirement.** Position disclosure and delay estimate supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. the delay watch adds a late technician's position and ETA to its at-risk reasons and same-time options.
2. A current position goes only to the owner within their branch scope, and its coordinates go to the already-connected Google Routes API for a traffic-unaware driving estimate to the next booked visit.
3. This is a driving estimate from the moment of reading, not a departure promise; the delay watch retains its existing overrun and promised-window rules.
4. Missing routes and stale positions never invent an ETA.
5. Coordinates and fleet keys are absent from state, Activity values, command results, business exports and installation archives.
6. Delegated Dispatcher and named-agent location views follow DISP-009’s current-shift grants.
7. An agent’s location call carries standard and the company’s policy decides it within that authority.
8. `COMM-004, COMM-021` inherits customer notices and `FIELD-005` inherits native background capture before those capabilities ship.

**Evidence.** `tests/api/eligibility.test.mjs`, `tests/portable.mjs`, `tests/browser/dispatch-map.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — the delay watch adds a late technician's position and ETA to its at-risk reasons and same-time options.; point 2 — A current position goes only to the owner within their branch scope, and its coordinates go to the already-connected Google Routes API for a traffic-unaware driving estimate to the next booked visit.; point 3 — This is a driving estimate from the moment of reading, not a departure promise; the delay watch retains its existing overrun and promised-window rules.; point 4 — Missing routes and stale positions never invent an ETA.; point 5 — Coordinates and fleet keys are absent from state, Activity values, command results, business exports and installation archives.; point 6 — Delegated Dispatcher and named-agent location views follow DISP-009’s current-shift grants.; point 7 — An agent’s location call carries standard and the company’s policy decides it within that authority.; point 8 — COMM-004, COMM-021 inherits customer notices and FIELD-005 inherits native background capture before those capabilities ship. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-006 — Arrival windows and automatic assignment

Core · target · **partial**

**Requirement.** Visits, `BOOK-005` service calls' included, are booked with a customer arrival window (for example 8–10 am) separate from the planned time; when a booking comes from `BOOK-002, BOOK-011, BOOK-012, BOOK-013` or `AGENT-001`, Glove assigns the best eligible technician (skills, area, load, travel) under the owner's rules, and the dispatcher can override. `BOOK-006` assessments are booked with an arrival window too. The [operating rules](docs/service-work-rules.md#disp-006-operating-rules) retain the record formats and calculations. Recorded decisions: RL-7.

**Acceptance.**
1. A fixture books three online requests and checks each lands on an eligible technician inside its window, then the dispatcher reassigns one with a `GLOVE-07` review; an assessment on a request is booked with its arrival window.
2. Visit book action, crew bookings, `BOOK-005` service-call visits, `BOOK-006` assessment book action and approved dispatch proposals take an optional an arrival window: wall-clock HH:MM on the visit's local date in its booking zone, start before end, kept on the visit as the arrival window beside the planned start and end.
3. The planned start must fall inside the window, both ends included; otherwise the booking is refused.
4. Visit change action keeps the visit's window unless it names a new one, and removing the window removes it; a move whose planned start leaves the kept window is refused.
5. The window shows in the booking event ("9:00 AM – 10:30 AM (arrival window 8:00 AM – 10:00 AM)"), on the dispatcher's visit panel and on the technician's phone.
6. Recurring series occurrences (`PLAN-001, PLAN-006`) carry no window.
7. Visit book action (service calls included) and assessment book action also take automatic technician selection: Glove picks, among active technicians in the job's branch with no conflict at that time (skills, areas, time off, calendars, other visits and the owner's warn/refuse rules; an out-of-area warning is a conflict, so every candidate is in-area), the one with the fewest booked minutes on that local date, then by name; the assignment records "Assigned automatically" with the ranking, the documented refusal answers when nobody is free, and the dispatcher overrides with visit change action under `GLOVE-07` review.
8. With Google Maps connected, each candidate's drive from their previous visit that day joins their booked minutes (`DISP-002, DISP-010`'s semantics), and online bookings (`BOOK-002, BOOK-011, BOOK-012, BOOK-013`) and the front office (`AGENT-001`) call this assignment, each naming `DISP-006` in its text and acceptance.

**Evidence.** `src/glove/commands/dispatch.ts`, `src/glove/commands/assessments.ts`, `src/ui/dispatch-cards.tsx`, `src/ui/assessment.tsx`, `src/ui/visit-panel.tsx`, `tests/api/assessments.test.mjs`
**Gap.** The audit records 7 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture books three online requests and checks each lands on an eligible technician inside its window, then the dispatcher reassigns one with a GLOVE-07 review; an assessment on a request is booked with its arrival window.; point 2 — Visit book action, crew bookings, BOOK-005 service-call visits, BOOK-006 assessment book action and approved dispatch proposals take an optional an arrival window: wall-clock HH:MM on the visit's local date in its booking zone, start before end, kept on the visit as the arrival window beside the planned start and end.; point 3 — The planned start must fall inside the window, both ends included; otherwise the booking is refused.; point 4 — Visit change action keeps the visit's window unless it names a new one, and removing the window removes it; a move whose planned start leaves the kept window is refused.; point 5 — The window shows in the booking event ("9:00 AM – 10:30 AM (arrival window 8:00 AM – 10:00 AM)"), on the dispatcher's visit panel and on the technician's phone.; point 6 — Recurring series occurrences (PLAN-001, PLAN-006) carry no window.; point 7 — Visit book action (service calls included) and assessment book action also take automatic technician selection: Glove picks, among active technicians in the job's branch with no conflict at that time (skills, areas, time off, calendars, other visits and the owner's warn/refuse rules; an out-of-area warning is a conflict, so every candidate is in-area), the one with the fewest booked minutes on that local date, then by name; the assignment records "Assigned automatically" with the ranking, the documented refusal answers when nobody is free, and the dispatcher overrides with visit change action under GLOVE-07 review.; point 8 — With Google Maps connected, each candidate's drive from their previous visit that day joins their booked minutes (DISP-002, DISP-010's semantics), and online bookings (BOOK-002, BOOK-011, BOOK-012, BOOK-013) and the front office (AGENT-001) call this assignment, each naming DISP-006 in its text and acceptance. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-007 — Multi-day jobs, crews and subcontractors

Core · target · **partial** · From DISP-007

**Requirement.** Multi-day jobs, crews and subcontractors supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-007-operating-rules) retain the record formats and calculations. Recorded decisions: RL-8.

**Acceptance.**
1. A fixture books a three-day install for a two-person crew and a subcontractor, checks each sees only their visits, and checks the subcontractor's total in the 1099 export; a browser journey drags the crew's visit to another day on the `DISP-001` week board by crew.
2. A job holds any number of visits over any days.
3. The owner (acting for "admin") names crews of 2 to 10 active technicians or subcontractors; changing a crew changes only later bookings.
4. Booking a crew books one visit per member at the same date and times in one command, after one review of every member's conflicts.
5. Moving any visit of that booking moves every member's visit in it that is not completed or canceled to the same date and times, never to another technician, after one review.
6. Canceling cancels them all, and is refused while a member has recorded evidence on theirs.
7. The dispatch board's Rows choice shows crews instead of technicians in the day, week and month, one chip per crew booking, dragged or moved by keyboard as one.

**Evidence.** `src/glove/commands/dispatch.ts`, `src/glove/subcontract.ts`, `src/glove/view.ts`, `src/ui/dispatch.tsx`, `src/ui/subcontract.tsx`, `tests/api/subcontract.test.mjs`, `tests/browser/journey.spec.ts`, `src/glove/commands/field.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture books a three-day install for a two-person crew and a subcontractor, checks each sees only their visits, and checks the subcontractor's total in the 1099 export; a browser journey drags the crew's visit to another day on the DISP-001 week board by crew.; point 2 — A job holds any number of visits over any days.; point 3 — The owner (acting for "admin") names crews of 2 to 10 active technicians or subcontractors; changing a crew changes only later bookings.; point 4 — Booking a crew books one visit per member at the same date and times in one command, after one review of every member's conflicts.; point 5 — Moving any visit of that booking moves every member's visit in it that is not completed or canceled to the same date and times, never to another technician, after one review.; point 6 — Canceling cancels them all, and is refused while a member has recorded evidence on theirs.; point 7 — The dispatch board's Rows choice shows crews instead of technicians in the day, week and month, one chip per crew booking, dragged or moved by keyboard as one. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-013 — Subcontractor field access

Core · target · **partial** · From DISP-007 · Cites BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** Subcontractor field access supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Subcontractor is a built-in role, invited and signed in like staff.
2. A subcontractor sees only the visits now assigned to them and, for those, the job title, checklist and forms, the site's address and access notes, the customer's name and phone, and their own captures.
3. They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, other people's work or other visits.
4. They record arrival, checklist items, notes, photos, materials by description, forms and completion on their visits.
5. They cannot clock in, run timers, record refrigerant or expenses, or add priced work, and their phone keeps no offline day and gets no pushes (`FIELD-001` and `FIELD-004, FIELD-009, FIELD-010` are the Technician's).

**Evidence.** `src/glove/commands/dispatch.ts`, `src/glove/subcontract.ts`, `src/glove/view.ts`, `src/ui/dispatch.tsx`, `src/ui/subcontract.tsx`, `tests/api/subcontract.test.mjs`, `tests/browser/journey.spec.ts`, `src/glove/commands/field.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Subcontractor is a built-in role, invited and signed in like staff.; point 2 — A subcontractor sees only the visits now assigned to them and, for those, the job title, checklist and forms, the site's address and access notes, the customer's name and phone, and their own captures.; point 3 — They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, other people's work or other visits.; point 4 — They record arrival, checklist items, notes, photos, materials by description, forms and completion on their visits.; point 5 — They cannot clock in, run timers, record refrigerant or expenses, or add priced work, and their phone keeps no offline day and gets no pushes (FIELD-001 and FIELD-004, FIELD-009, FIELD-010 are the Technician's). See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-014 — Subcontractor agreed amounts and filing totals

Core · target · **partial** · From DISP-007

**Requirement.** Subcontractor agreed amounts and filing totals supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner marks a technician record as a subcontractor with a 1099 payee name and the last 4 digits of the TIN; a full TIN is refused and never stored.
2. The owner sets an agreed amount on each of their visits.
3. The 1099-NEC totals for a calendar year, which the owner and office read as JSON or CSV, sum each subcontractor's agreed amounts on their visits completed that year (dated by the completion Glove received, in the business time zone), with the visit count and whether the total is $600 or more.
4. They are labelled "Totals for your filing, not a filed 1099"; Glove files nothing.
5. Timesheets and payroll exports stay `COST-002, COST-006, COST-007`'s.

**Evidence.** `src/glove/commands/dispatch.ts`, `src/glove/subcontract.ts`, `src/glove/view.ts`, `src/ui/dispatch.tsx`, `src/ui/subcontract.tsx`, `tests/api/subcontract.test.mjs`, `tests/browser/journey.spec.ts`, `src/glove/commands/field.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The owner marks a technician record as a subcontractor with a 1099 payee name and the last 4 digits of the TIN; a full TIN is refused and never stored.; point 2 — The owner sets an agreed amount on each of their visits.; point 3 — The 1099-NEC totals for a calendar year, which the owner and office read as JSON or CSV, sum each subcontractor's agreed amounts on their visits completed that year (dated by the completion Glove received, in the business time zone), with the visit count and whether the total is $600 or more.; point 4 — They are labelled "Totals for your filing, not a filed 1099"; Glove files nothing.; point 5 — Timesheets and payroll exports stay COST-002, COST-006, COST-007's. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-008 — Google Calendar and Outlook sync

Core · target · **partial** · From DISP-008 · Cites BASE-DATA-001

**Requirement.** Google Calendar and Outlook sync supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture books, moves and cancels a visit and checks the calendar provider fake receives create, update and delete, and that a busy block refuses an overlapping booking.
2. The unscoped owner explicitly connects one delegated Google or Microsoft calendar per technician and approves one-way visit writes.
3. Customer details default to hidden; the owner may include customer name and service address only.
4. No attendees or contact channels are sent.
5. Credentials, pending delivery work and event mappings are excluded from archives; restore requires explicit reconnection.
6. Booking refreshes busy time and refuses an unreadable provider; only busy instants are retained.
7. The existing private iCal connection remains independent.

**Evidence.** `tests/api/eligibility.test.mjs`, `tests/browser/dispatch-map.spec.ts`, `src/glove/calendar-sync.ts`, `src/ui/calendar-sync.tsx`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture books, moves and cancels a visit and checks the calendar provider fake receives create, update and delete, and that a busy block refuses an overlapping booking.; point 2 — The unscoped owner explicitly connects one delegated Google or Microsoft calendar per technician and approves one-way visit writes.; point 3 — Customer details default to hidden; the owner may include customer name and service address only.; point 4 — No attendees or contact channels are sent.; point 5 — Credentials, pending delivery work and event mappings are excluded from archives; restore requires explicit reconnection.; point 6 — Booking refreshes busy time and refuses an unreadable provider; only busy instants are retained.; point 7 — The existing private iCal connection remains independent. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-015 — Calendar change delivery and uncertainty

Core · target · **partial** · From DISP-008

**Requirement.** Calendar change delivery and uncertainty supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. All committed visit changes enqueue provider work, including technician reassignment.
2. Uncertain writes remain visible and stop later work on that connection, without automatic replay.
3. Disconnect stops writes and retains existing provider events for owner review.

**Evidence.** `tests/api/eligibility.test.mjs`, `tests/browser/dispatch-map.spec.ts`, `src/glove/calendar-sync.ts`, `src/ui/calendar-sync.tsx`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — All committed visit changes enqueue provider work, including technician reassignment.; point 2 — Uncertain writes remain visible and stop later work on that connection, without automatic replay.; point 3 — Disconnect stops writes and retains existing provider events for owner review. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DISP-009 — Delegated dispatcher position view

Core · target · **partial** · Cites BASE-ROLE-001

**Requirement.** The owner may grant a Dispatcher position view per technician and shift. The technician is told the view is on, every read is audited, and custody remains latest-only. Agent reads remain denied unless the owner grants the same view to a named agent. The delegated-view authority follows RL-30. The [operating rules](docs/service-work-rules.md#disp-009-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner grants a named dispatcher or agent the current-shift position view for named technicians, and the record retains the grant.
2. The granted view reveals only fresh current positions and estimates; expiry, revocation, clock-out and consent withdrawal end that view.
3. An agent’s granted position read carries standard and follows the company’s policy.

**Evidence.** `tests/api/eligibility.test.mjs`, `tests/browser/dispatch-map.spec.ts`, `scripts/installer/local.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The owner grants a named dispatcher or agent the current-shift position view for named technicians, and the record retains the grant.; point 2 — The granted view reveals only fresh current positions and estimates; expiry, revocation, clock-out and consent withdrawal end that view.; point 3 — An agent’s granted position read carries standard and follows the company’s policy. See docs/contract/DONE-AUDIT.md for each named outcome.

### Customer communication

#### COMM-001 — Customer email with delivery status

Core · target · **partial** · From COMM-001 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · Register R-9

**Requirement.** Customer email with delivery status supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations. Recorded decisions: RL-9. Owning-capability boundaries: COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.

**Acceptance.**
1. A fixture sends a quote, an invoice and a purchase order to its supplier (provider fake), replays delivered and bounced events, and checks each message's state on the timeline and the bounce warning on the customer.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
3. The owner connects customer email (mail connect action): SendGrid or Resend through Base's mail adapter, or Postmark or Amazon SES through fixed provider endpoints, a from-address and optional name, the provider API key and, for SendGrid/Resend, its event-webhook verification key (SendGrid's Signed Event Webhook public key or Resend's whsec_ signing secret), kept as installation secrets that are never shown again, exported or archived; {provider: null} disconnects.
4. Glove does not check the sending domain itself: the provider refuses mail from a domain it has not verified, and that refusal shows on the message.
5. The desk emails what each person may already record as sent (email send action): an approved quote's current revision to the customer's email (owner, dispatcher, office; the quote is then sent, naming the email), an approved or exported invoice to the customer's accounts-payable address, else their email (owner, office), and a draft purchase order to its supplier's address (owner, office; the order is then sent); agreement offer action with email: true emails a `PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011` booking link to the customer's own email address.
6. Every email Glove sends today is transactional; no marketing email is sent.
7. Replies go to the business email when one is set.

**Evidence.** `tests/api/email.test.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/api/agreements.test.mjs`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`, `tests/browser/email.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture sends a quote, an invoice and a purchase order to its supplier (provider fake), replays delivered and bounced events, and checks each message's state on the timeline and the bounce warning on the customer.; point 2 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.; point 3 — The owner connects customer email (mail connect action): SendGrid or Resend through Base's mail adapter, or Postmark or Amazon SES through fixed provider endpoints, a from-address and optional name, the provider API key and, for SendGrid/Resend, its event-webhook verification key (SendGrid's Signed Event Webhook public key or Resend's whsec_ signing secret), kept as installation secrets that are never shown again, exported or archived; {provider: null} disconnects.; point 4 — Glove does not check the sending domain itself: the provider refuses mail from a domain it has not verified, and that refusal shows on the message.; point 5 — The desk emails what each person may already record as sent (email send action): an approved quote's current revision to the customer's email (owner, dispatcher, office; the quote is then sent, naming the email), an approved or exported invoice to the customer's accounts-payable address, else their email (owner, office), and a draft purchase order to its supplier's address (owner, office; the order is then sent); agreement offer action with email: true emails a PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 booking link to the customer's own email address.; point 6 — Every email Glove sends today is transactional; no marketing email is sent.; point 7 — Replies go to the business email when one is set. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COMM-010 — Message outcomes and customer warnings

Core · target · **partial** · From COMM-001 · Cites BASE-AUDIT-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · Register R-9

**Requirement.** Message outcomes and customer warnings supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A message record keeps its kind, subject, recipient, from-address, provider and who sent it, never the body, so a booking link's bearer exists only in the email and the one-time command response.
2. After the command commits, Glove makes one send attempt with the message id as the delivery id.
3. The provider's answer (accepted, refused, rate limited or not confirmed) and every authenticated event the provider posts to the mail callback (delivered, deferred, bounced, complained, failed, rejected) are provider facts on the message's timeline, in Activity and in the business export with the provider's reference; Glove authenticates each callback under the rules below (using Base's verifier for SendGrid/Resend), and Base's durable store keeps each matched event once, and applies an event only to a message Glove sent through that provider to exactly that recipient; authenticated unmatched events return 200 without effect.
4. A message's state is the latest of its facts in Base's order: a final fact (delivered, bounced, complained, failed, rejected) is never replaced by a non-final one, and a later final fact (a complaint after delivery) replaces an earlier one. "Delivered" means the recipient's mail server accepted it, as the provider reported; Glove never claims a person read it.
5. Each failure shows on the message with what to do next.
6. A customer whose latest finished email to an address on their record bounced or was marked as spam carries that warning, with what to do next, until a later email to that address finishes delivered or the address changes.
7. Each email is in the `COMM-007` stream as an outbound email with its author, recipient and state.
8. Nothing is retried automatically: the desk sends again, or for a booking link revokes it and makes a new offer.

**Evidence.** `tests/api/email.test.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/api/agreements.test.mjs`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`, `tests/browser/email.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A message record keeps its kind, subject, recipient, from-address, provider and who sent it, never the body, so a booking link's bearer exists only in the email and the one-time command response.; point 2 — After the command commits, Glove makes one send attempt with the message id as the delivery id.; point 3 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authenticated event the provider posts to the mail callback (delivered, deferred, bounced, complained, failed, rejected) are provider facts on the message's timeline, in Activity and in the business export with the provider's reference; Glove authenticates each callback under the rules below (using Base's verifier for SendGrid/Resend), and Base's durable store keeps each matched event once, and applies an event only to a message Glove sent through that provider to exactly that recipient; authenticated unmatched events return 200 without effect.; point 4 — A message's state is the latest of its facts in Base's order: a final fact (delivered, bounced, complained, failed, rejected) is never replaced by a non-final one, and a later final fact (a complaint after delivery) replaces an earlier one. "Delivered" means the recipient's mail server accepted it, as the provider reported; Glove never claims a person read it.; point 5 — Each failure shows on the message with what to do next.; point 6 — A customer whose latest finished email to an address on their record bounced or was marked as spam carries that warning, with what to do next, until a later email to that address finishes delivered or the address changes.; point 7 — Each email is in the COMM-007 stream as an outbound email with its author, recipient and state.; point 8 — Nothing is retried automatically: the desk sends again, or for a booking link revokes it and makes a new offer. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COMM-011 — Future document-email inheritance

Core · target · **partial** · From COMM-001 · Cites BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · Register R-9

**Requirement.** Future document-email inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations. Owning-capability boundaries: QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 inherits a confirmation copy of the winning signed revision to the on-record email, with the same provider outcomes, before online signing ships.

**Acceptance.**
1. Inheritance : receipts join with `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020` and `PAY-004, PAY-021, PAY-022, PAY-023`, appointment confirmations with `COMM-003, COMM-019, COMM-020` (which also carries `FIELD-003` report links), and review requests with `COMM-008, COMM-026, COMM-027`; each emails through this door with the same provider outcomes , and any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address.

**Evidence.** `tests/api/email.test.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/api/agreements.test.mjs`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`, `tests/browser/email.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Inheritance : receipts join with PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 and PAY-004, PAY-021, PAY-022, PAY-023, appointment confirmations with COMM-003, COMM-019, COMM-020 (which also carries FIELD-003 report links), and review requests with COMM-008, COMM-026, COMM-027; each emails through this door with the same provider outcomes , and any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COMM-012 — Morning-brief email

Core · target · **partial** · From COMM-001 · Cites BASE-AUDIT-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · Register R-9

**Requirement.** Morning-brief email supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. It also delivers the owner's `AGENT-008, AGENT-016` brief in the morning and asserts the provider delivery outcome without a duplicate delivery for that business-local date.
2. Only the owner turns it on or off (mail morning action, with customer email connected first; time is a business-local the documented refusal, 07:00 by default); it is off until then, and opening the brief never sends anything.
3. Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in the business time zone) is at or past time on a local date emails that date's brief, as `AGENT-008, AGENT-016` prepares it for that instant, to the owner's active sign-in address (the owner account's email, not the business email) through the connected provider; a business-local date gets at most one send, claimed once as a queued fact in the timeline before the provider is called, so a repeated or simultaneous run sends nothing more and a crash between claim and send loses that date's email rather than sending it twice.
4. A run before time, with email off or disconnected, or without an active owner address sends nothing.
5. The provider's answer (accepted, refused, rate limited or not confirmed) and its signed delivery events (the mail callback, accepted only for that recipient and that date's delivery id) are provider facts on that date in Activity and the business export, with the provider's reference and no key or brief body; the Today screen and the owner brief (emailed) show the date's state exactly as those facts fold, with what to do next, and "delivered" means the recipient's mail server accepted it.
6. Nothing is retried: a failed date stays failed and the next local date sends its own brief.
7. The email carries the brief's own text and, being a transactional notice to the owner of their own records, no marketing content.

**Evidence.** `tests/api/email.test.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/api/agreements.test.mjs`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`, `tests/browser/email.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — It also delivers the owner's AGENT-008, AGENT-016 brief in the morning and asserts the provider delivery outcome without a duplicate delivery for that business-local date.; point 2 — Only the owner turns it on or off (mail morning action, with customer email connected first; time is a business-local the documented refusal, 07:00 by default); it is off until then, and opening the brief never sends anything.; point 3 — Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in the business time zone) is at or past time on a local date emails that date's brief, as AGENT-008, AGENT-016 prepares it for that instant, to the owner's active sign-in address (the owner account's email, not the business email) through the connected provider; a business-local date gets at most one send, claimed once as a queued fact in the timeline before the provider is called, so a repeated or simultaneous run sends nothing more and a crash between claim and send loses that date's email rather than sending it twice.; point 4 — A run before time, with email off or disconnected, or without an active owner address sends nothing.; point 5 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed delivery events (the mail callback, accepted only for that recipient and that date's delivery id) are provider facts on that date in Activity and the business export, with the provider's reference and no key or brief body; the Today screen and the owner brief (emailed) show the date's state exactly as those facts fold, with what to do next, and "delivered" means the recipient's mail server accepted it.; point 6 — Nothing is retried: a failed date stays failed and the next local date sends its own brief.; point 7 — The email carries the brief's own text and, being a transactional notice to the owner of their own records, no marketing content. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COMM-013 — Callback authentication before effects

Core · target · **partial** · From COMM-001 · Cites BASE-AUDIT-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · Register R-9

**Requirement.** Callback authentication before effects supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Authentication precedes delivery-payload parsing, message lookup, database writes and outbound effects.
2. SNS necessarily decodes its bounded signed envelope and fetches only its pinned certificate to verify the signature; its SES Message remains unparsed until verification.
3. Disconnected email returns 404.
4. Every failed authentication/schema/recipient check returns the same generic 401 body, writes no Activity, durable counter, receipt/event ID or other business record, and logs only a generic Worker warning without secrets.
5. After 20 rejections from one IP in a minute, further rejected requests return 429; verified traffic is never counted or refused by that rejection allowance.
6. Authenticated events for messages Glove did not send through that provider return the same opaque 200 acknowledgement as matched events, with no effect and no consumed event ID; a wrong recipient for a known message refuses the entire batch.
7. The owner's email settings show the last verified matched event time and any SNS cancellation warning.
8. Unauthenticated and unmatched events never change delivery state, bounce/spam warnings, suppression/opt-outs, subscriptions or inbound email, request, conversation or customer records; never write Activity/export or reveal message/customer/recipient existence.

**Evidence.** `tests/api/email.test.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/api/agreements.test.mjs`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`, `tests/browser/email.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Authentication precedes delivery-payload parsing, message lookup, database writes and outbound effects.; point 2 — SNS necessarily decodes its bounded signed envelope and fetches only its pinned certificate to verify the signature; its SES Message remains unparsed until verification.; point 3 — Disconnected email returns 404.; point 4 — Every failed authentication/schema/recipient check returns the same generic 401 body, writes no Activity, durable counter, receipt/event ID or other business record, and logs only a generic Worker warning without secrets.; point 5 — After 20 rejections from one IP in a minute, further rejected requests return 429; verified traffic is never counted or refused by that rejection allowance.; point 6 — Authenticated events for messages Glove did not send through that provider return the same opaque 200 acknowledgement as matched events, with no effect and no consumed event ID; a wrong recipient for a known message refuses the entire batch.; point 7 — The owner's email settings show the last verified matched event time and any SNS cancellation warning.; point 8 — Unauthenticated and unmatched events never change delivery state, bounce/spam warnings, suppression/opt-outs, subscriptions or inbound email, request, conversation or customer records; never write Activity/export or reveal message/customer/recipient existence. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COMM-014 — Callback rejection accounting

Core · target · **partial** · From COMM-001 · Cites BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · Register R-9

**Requirement.** Callback rejection accounting supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Every future inbound-email receiver inherits this authentication before shipping.
2. Rejection accounting uses a shared transient actor keyed by a hashed source address, with no durable counter or business write.

**Evidence.** `tests/api/email.test.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/api/agreements.test.mjs`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`, `tests/browser/email.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Every future inbound-email receiver inherits this authentication before shipping.; point 2 — Rejection accounting uses a shared transient actor keyed by a hashed source address, with no durable counter or business write. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COMM-015 — Postmark callback custody

Core · target · **partial** · From COMM-001 · Cites BASE-AUDIT-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · Register R-9

**Requirement.** Postmark callback custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Postmark: HTTPS Basic user glove, with a per-installation password generated from 32 random bytes and shown only in the first owner response.
2. Store only its SHA-256 hash and compare in constant time.
3. Mail callback action keeps the previous hash valid for exactly 24 hours (exclusive expiry), revoking the previous credential ends that overlap immediately, and disconnect revokes both.
4. Rotation, revocation and allowlist changes are Activity facts without secrets.
5. The optional source-IP allowlist is off by default, pinned in source with a dated provider reference, fails closed when on and never replaces Basic authentication; reconnecting credentials preserves this owner option unless explicitly changed.
6. Plain-HTTP Postmark callbacks are refused without writes.
7. Replay identity is event type plus Postmark ID, or message ID + type + recipient + time when no ID exists; refuse events over 7 days old.
8. Sends include Glove's delivery ID in Postmark metadata.

**Evidence.** `tests/api/email.test.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/api/agreements.test.mjs`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`, `tests/browser/email.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Postmark: HTTPS Basic user glove, with a per-installation password generated from 32 random bytes and shown only in the first owner response.; point 2 — Store only its SHA-256 hash and compare in constant time.; point 3 — Mail callback action keeps the previous hash valid for exactly 24 hours (exclusive expiry), revoking the previous credential ends that overlap immediately, and disconnect revokes both.; point 4 — Rotation, revocation and allowlist changes are Activity facts without secrets.; point 5 — The optional source-IP allowlist is off by default, pinned in source with a dated provider reference, fails closed when on and never replaces Basic authentication; reconnecting credentials preserves this owner option unless explicitly changed.; point 6 — Plain-HTTP Postmark callbacks are refused without writes.; point 7 — Replay identity is event type plus Postmark ID, or message ID + type + recipient + time when no ID exists; refuse events over 7 days old.; point 8 — Sends include Glove's delivery ID in Postmark metadata. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COMM-016 — Postmark delivery-outcome mapping

Core · target · **partial** · From COMM-001 · Cites BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · Register R-9

**Requirement.** Postmark delivery-outcome mapping supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Delivery maps to delivered, hard bounce to bounced, soft bounce to deferred or failed when final, and SpamComplaint to complained.

**Evidence.** `tests/api/email.test.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/api/agreements.test.mjs`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`, `tests/browser/email.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Delivery maps to delivered, hard bounce to bounced, soft bounce to deferred or failed when final, and SpamComplaint to complained. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COMM-017 — Amazon SES and SNS callback custody

Core · target · **partial** · From COMM-001 · Cites BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · Register R-9

**Requirement.** Amazon SES and SNS callback custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Amazon SES via SNS: pin region, TopicArn and configuration set to the owner's connection.
2. Require the message-type header to equal the envelope Type, accept SNS signature versions 1 and 2 (setup asks for version 2), and require the signing certificate at the documented product door with no query, credentials, fragment, alternate port or redirects; cache the certificate within its validity for at most one hour.
3. SNS timestamps are at most 1 hour old and at most 5 minutes ahead.
4. Require a signed SNS envelope (raw delivery off), the pinned SES configuration set and Glove delivery tag on each SES event; sends carry the configuration set and a base64url-encoded delivery ID tag.
5. Deduplicate SNS MessageId and the SES event.
6. A SubscriptionConfirmation URL is fetched only after all source, URL, timestamp and signature checks; require HTTPS on the same pinned regional SNS host with the exact ConfirmSubscription action, TopicArn and Token, and follow no redirects.
7. An UnsubscribeConfirmation warns the owner and never fetches its URL.
8. Delivery maps to delivered; Permanent bounce to bounced; Transient bounce to failed; DeliveryDelay to deferred; Complaint to complained; Reject and RenderingFailure (including AWS's Rendering Failure spelling) to rejected.

**Evidence.** `tests/api/email.test.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/api/agreements.test.mjs`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`, `tests/browser/email.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Amazon SES via SNS: pin region, TopicArn and configuration set to the owner's connection.; point 2 — Require the message-type header to equal the envelope Type, accept SNS signature versions 1 and 2 (setup asks for version 2), and require the signing certificate at the documented product door with no query, credentials, fragment, alternate port or redirects; cache the certificate within its validity for at most one hour.; point 3 — SNS timestamps are at most 1 hour old and at most 5 minutes ahead.; point 4 — Require a signed SNS envelope (raw delivery off), the pinned SES configuration set and Glove delivery tag on each SES event; sends carry the configuration set and a base64url-encoded delivery ID tag.; point 5 — Deduplicate SNS MessageId and the SES event.; point 6 — A SubscriptionConfirmation URL is fetched only after all source, URL, timestamp and signature checks; require HTTPS on the same pinned regional SNS host with the exact ConfirmSubscription action, TopicArn and Token, and follow no redirects.; point 7 — An UnsubscribeConfirmation warns the owner and never fetches its URL.; point 8 — Delivery maps to delivered; Permanent bounce to bounced; Transient bounce to failed; DeliveryDelay to deferred; Complaint to complained; Reject and RenderingFailure (including AWS's Rendering Failure spelling) to rejected. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COMM-018 — Email provider proof boundary

Core · target · **partial** · From COMM-001 · Cites BASE-DATA-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · Register R-9

**Requirement.** Email provider proof boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Document email, morning brief, callback outcomes and restored connections are proven against the configured provider’s network edge.

**Evidence.** `tests/api/email.test.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/api/agreements.test.mjs`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`, `tests/browser/email.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Document email, morning brief, callback outcomes and restored connections are proven against the configured provider’s network edge. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COMM-002 — Texts from a registered US number

Core · target · **partial** · Cites BASE-AUDIT-001, BASE-OPS-003, BASE-SECRET-001 · Rules D-1 · Register R-10

**Requirement.** The owner connects Twilio (or another provider) with a US number registered for A2P 10DLC or toll-free verification; Glove records each customer's SMS consent (source, time, wording), honors STOP, HELP and START in every thread, keeps quiet hours by the customer's time zone, and records sent, delivered and failed per message. The owner keeps their existing business number: it is ported to Twilio, or text-enabled in place as a hosted number while voice stays with the current carrier, with the port or hosting status shown until it is live; a new number is the owner's choice, never the only path. A customer's recorded opt-out also keeps them out of every `CUST-004, CUST-006` segment push. DATA-002, DATA-009, DATA-010 inheritance: every new command, communication, payment or sync action and provider outcome keeps its actor or provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. The [operating rules](docs/service-work-rules.md#comm-002-operating-rules) retain the record formats and calculations. Owning-capability boundaries: COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.

**Acceptance.**
1. A fixture texts a consenting customer (provider fake), replays delivered and failed callbacks, receives STOP and checks the next send is refused with the reason, and checks no automated text is sent in quiet hours; a hosted-number order and a port request (provider fake) show their status until the number is live, and sends then use it; a customer who replied STOP is left out of a `CUST-004, CUST-006` segment push.
2. a texted customer's reply confirming or refusing a visit moved around a delay lands on that visit, replacing "customer not yet asked", and an `AGENT-009`-granted agent move texts the customer.
3. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.

**Evidence.** `tests/api/reminders.test.mjs`, `tests/browser/reminders.spec.ts`, `tests/portable.mjs`
**Gap.** Hosted-number orders and port requests with live status remain unbuilt; an existing-number connection records only the owner’s affirmation. Delay-specific confirmation/refusal and agent-move sends under AGENT-003 remain unproved. No live registration or provider receipt is claimed. RL-102 resolves the messaging-policy hold.

#### COMM-003 — Appointment confirmations and reminders

Core · target · **partial** · From COMM-003 · Cites BASE-AUDIT-001, BASE-MAIL-001 · Rules D-1 · Register R-9

**Requirement.** Appointment confirmations and reminders supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-003-operating-rules) retain the record formats and calculations. Owning-capability boundaries: FIELD-003 inheritance: the customer receives its service-report link through the configured notice channel with the provider outcome asserted. COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 inheritance: every confirmation, reminder and report-link notice it emails goes through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`'s door with the same provider outcomes: one send attempt per message, recorded with the provider's answer and reference on the message, the visit's timeline, Activity and the business export without secrets; state changes only from authenticated provider callbacks; delivery is never claimed without the provider's event.

**Acceptance.**
1. A fixture books, moves and cancels a visit and checks the exact messages and their timing, and a reply "reschedule" opens a request on the job; an owner-edited reminder template with merge fields is exactly what the customer receives, and its opt-out wording cannot be removed; booking an assessment on a request sends its confirmation.
2. Any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address.
3. The owner previews plain-text templates through reminder preview action, then explicitly approves templates and the schedule through reminder configure action.
4. The immutable footer adds the business name and office-handled stop instructions.
5. No links or markup are accepted in templates.

**Evidence.** `tests/api/reminders.test.mjs`, `tests/browser/reminders.spec.ts`
**Gap.** Automatic email confirmations and reminders still direct replies to the office; automatic response-link inclusion and customer-selected schedule controls remain unbuilt. COMM-004 and COMM-008 retain on-my-way and review-template obligations. COMM-002 retains number ordering and delay-agent inheritance. No live provider delivery is claimed; RL-102 resolves the consent, quiet-hours, response-link and report-disclosure policy holds.

#### COMM-019 — Visit notice scheduling and current consent

Core · target · **partial** · From COMM-003 · Cites BASE-MAIL-001, BASE-ROLE-001 · Rules D-1 · Register R-9

**Requirement.** Visit notice scheduling and current consent supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner records consent or withdrawal separately for visits, invoices and quotes through reminder consent action; changing the recorded recipient address invalidates consent.
2. Automatic email is off by default.
3. The scheduled Worker sends only between 08:00 inclusive and 18:00 exclusive in the record branch zone, rechecking current owner authority, connection, consent and business state.
4. Due steps are claimed durably before one provider attempt; retries and concurrent passes never resend a claimed step.
5. Unknown outcomes remain unknown.
6. Historical messages are never a resend source.
7. A changed visit supersedes its unsent notice and old reminder times; cancelled visits have no later visit reminder.
8. Every visit creation door uses the shared commit path, including assessments and recurring or customer-booked visits.

**Evidence.** `tests/api/reminders.test.mjs`, `tests/browser/reminders.spec.ts`
**Gap.** Automatic email confirmations and reminders still direct replies to the office; automatic response-link inclusion and customer-selected schedule controls remain unbuilt. COMM-004 and COMM-008 retain on-my-way and review-template obligations. COMM-002 retains number ordering and delay-agent inheritance. No live provider delivery is claimed; RL-102 resolves the consent, quiet-hours, response-link and report-disclosure policy holds.

#### COMM-020 — Other-purpose reminder inheritance

Core · target · **partial** · From COMM-003 · Cites BASE-DATA-003, BASE-MAIL-001 · Rules D-1 · Register R-9

**Requirement.** Other-purpose reminder inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The pass reserves at most 50 messages.
2. PAY-005 uses frozen invoice due dates and current confirmed balances, stops on disputes and zero, and exposes actual state in aging.
3. QUOTE-004 uses elapsed 24-hour days after the revision was recorded sent and stops on any current-revision customer response, closure or the frozen expiry instant.
4. Erasure removes recipient consent, visit intent and message records through DATA-001, DATA-005, DATA-006, DATA-007, DATA-008.
5. The subsequent bounded text channel, explicit customer response and report-link doors, and quote-purpose unsubscribe are described in docs/sms-channel.md.
6. Future notice kinds inherit D-1 before shipping.

**Evidence.** `tests/api/reminders.test.mjs`, `tests/browser/reminders.spec.ts`
**Gap.** Automatic email confirmations and reminders still direct replies to the office; automatic response-link inclusion and customer-selected schedule controls remain unbuilt. COMM-004 and COMM-008 retain on-my-way and review-template obligations. COMM-002 retains number ordering and delay-agent inheritance. No live provider delivery is claimed; RL-102 resolves the consent, quiet-hours, response-link and report-disclosure policy holds.

#### COMM-004 — On-my-way and job status texts

Core · target · **partial** · From COMM-004 · Cites BASE-DATA-001, BASE-ROLE-001 · Rules D-1 · Register R-9, R-10

**Requirement.** On-my-way and job status texts supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture taps on-my-way on the phone and checks the customer text (provider fake) carries name and ETA; completion sends the report link.
2. All three notice settings start off.
3. The unscoped owner previews and explicitly approves exact plain-text templates and each setting, including seven-day report sharing; the business name and STOP wording cannot be removed.
4. Only the current assigned technician explicitly taps on my way, online, with a consented on-clock travel timer and fresh position for that visit.
5. The server privately derives a driving estimate; the customer receives the technician’s first name and ETA plus a two-hour link to their photo, never coordinates or a movement history.
6. Only the technician can upload their own photo and explicitly consent; metadata is stripped, replacement or withdrawal deletes the original and links even after profile deactivation, and expiry, assignment change, customer consent withdrawal or changed owner authority closes public reads.
7. The photo bearer is hash-only in transient storage, omitted from archives, and grants only first name and sanitized image.
8. The tap implements the clause’s explicit-departure alternative; no detected-departure send is added.

**Evidence.** `tests/browser/reminders.spec.ts`, `tests/api/reminders.test.mjs`
**Gap.** Automatic detected departure and live provider proof remain unproved; the technician tap proves only the explicit-departure alternative. COMM-002 retains live registration and number-ordering work. RL-103 resolves the bounded disclosure and report-issuance policy holds.

#### COMM-021 — Arrival and completed-report notices

Core · target · **partial** · From COMM-004 · Cites BASE-ROLE-001 · Rules D-1 · Register R-9, R-10

**Requirement.** Arrival and completed-report notices supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-004-operating-rules) retain the record formats and calculations. Owning-capability boundaries: FIELD-003 inheritance: the report-ready notice carries its exact service-report link, with the provider delivery outcome asserted.

**Acceptance.**
1. Arrival follows its separate exact owner-approved template only when the assigned technician’s fresh arrival reaches the server within two minutes; stale offline evidence still records arrival without a misleading text.
2. Completion can issue the immutable report’s seven-day link only under the approved report setting, current customer consent, quiet hours and current configuring-owner authority.
3. Only a hash persists; the bearer exists in the one provider attempt.
4. Replay never resends, uncertain delivery is not called delivered, and revoked or expired report links stop reading.
5. COMM-002, COMM-003, COMM-019, COMM-020 and COMM-005 retain their existing consent and channel obligations; DISP-009 retains delegated location views.

**Evidence.** `tests/browser/reminders.spec.ts`, `tests/api/reminders.test.mjs`
**Gap.** Automatic detected departure and live provider proof remain unproved; the technician tap proves only the explicit-departure alternative. COMM-002 retains live registration and number-ordering work. RL-103 resolves the bounded disclosure and report-issuance policy holds.

#### COMM-005 — Two-way texting inbox

Core · target · **partial** · Cites BASE-AUDIT-001, BASE-DATA-003, BASE-SECRET-001 · Rules D-1

**Requirement.** Replies land in a shared inbox, threaded by customer and linked to the open job, with assignment, unread state and canned replies; technicians text customers from the job through the business number, never their personal number. DATA-002, DATA-009, DATA-010 inheritance: every new command, communication, payment or sync action and provider outcome keeps its actor or provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. Under RL-104, the owner separately opts into retained shared-inbox text; native desk users explicitly reply through D-1, and retained text follows customer erasure. The [operating rules](docs/service-work-rules.md#comm-005-operating-rules) retain the record formats and calculations. Owning-capability boundaries: COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.

**Acceptance.**
1. A fixture receives a customer reply (provider fake), assigns it, answers with a canned reply, and finds the thread on the customer and the job.
2. a customer's confirmation reply to a moved visit is threaded on the customer, the job and that visit.
3. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
4. Retained incoming text requires the owner’s explicit inbox opt-in; native desk people alone read its body.
5. Each person-triggered reply checks current recipient consent and quiet hours under D-1; customer erasure removes retained message records (RL-104).

**Evidence.** `tests/api/reminders.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** Technician arbitrary-text sending and delay-move confirmation threading on the visit remain unbuilt. The channel retains current-number visit consent and customer-zone quiet hours, including STOP; shared-number senders reveal no retained body and cannot be answered until resolved.

#### COMM-006 — Customer hub

Core · target · **missing** · From COMM-006 · Cites BASE-ACCESS-003, BASE-AUDIT-001

**Requirement.** Customer hub supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-006-operating-rules) retain the record formats and calculations. Recorded decisions: RL-10. Owning-capability boundaries: FIELD-003 inheritance: the customer finds and reads their service reports in the hub, with report and file isolation asserted. COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.

**Acceptance.**
1. A fixture signs a customer in by a link, finds a quote's price-book line with its item's customer-facing description (`MONEY-003, MONEY-006`), approves the quote, pays an invoice (Stripe fake), requests work, and checks another customer's link reads none of it.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
3. Existing staff send, receive, delivery-outcome and conversation-history targets remain with their owning communication clauses.
4. Complete customer browser acceptance at 1440 and 390 remains required.

**Evidence.** `tests/api/customer-quotes.test.mjs` › “COMM-006 Owner hub preview isolates one customer and excludes drafts, access notes, payment credentials and internal conversations” proves the permitted projection including quoted alternatives and the accepted option with add-ons and its exact total, confirmed payments, exact authority and unavailable or merged-customer refusals, hiding of a newly unapproved quote revision, role and token exclusions, current authority on new requests and replay, attributable inspection without copied bodies, and erasure of saved outcomes and timeline copies. `tests/browser/customer-quotes.spec.ts` › “COMM-006 Owner inspects two customers through restricted previews, then sees unavailable and withdrawn access” proves explicit Owner inspection, quoted alternatives and the accepted work with its exact total, two-customer selection, summary-only reports and clearing after refusal; browser proof covers 1440 and 390. `tests/portable.mjs` reconstructs permitted content including the accepted quote choice under a fresh current Owner session, refuses old sessions and tokens, and checks the trusted later erasure journal. These are preparatory inspection proofs only.
**Gap.** Customer sign-in and credential issuance, expiry and revocation; customer-facing screens and authenticated cross-customer isolation; quote approval and signing; invoice payment and receipts; work requests; visit confirmation and policy-bound rescheduling; report discovery, reading and original-file isolation; agreement renewal and card updates; COMM-007 portal communications and provider outcomes; and complete customer browser acceptance at 1440 and 390 remain unbuilt or unproved. Preparatory Owner inspection grants no customer authentication, sending, booking or payment authority. All original acceptance, payment prerequisites and release holds remain binding; COMM-006 stays PARTIAL.  No customer sign-in or customer-facing hub workflow is delivered. Owner-only projection inspection is carried separately in COMM-023 to COMM-025; customer quote decisions, payment, work requests and isolation remain unbuilt.

#### COMM-022 — Customer-hub completion boundary

Core · target · **missing** · From COMM-006 · Cites BASE-ACCESS-003

**Requirement.** Customer-hub completion boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Customer-hub quote signing, payment, work requests, visits, reports, agreement renewal, card updates and portal conversations retain their owning capabilities and customer isolation.

**Evidence.** `tests/api/customer-quotes.test.mjs` › “COMM-006 Owner hub preview isolates one customer and excludes drafts, access notes, payment credentials and internal conversations” proves the permitted projection including quoted alternatives and the accepted option with add-ons and its exact total, confirmed payments, exact authority and unavailable or merged-customer refusals, hiding of a newly unapproved quote revision, role and token exclusions, current authority on new requests and replay, attributable inspection without copied bodies, and erasure of saved outcomes and timeline copies. `tests/browser/customer-quotes.spec.ts` › “COMM-006 Owner inspects two customers through restricted previews, then sees unavailable and withdrawn access” proves explicit Owner inspection, quoted alternatives and the accepted work with its exact total, two-customer selection, summary-only reports and clearing after refusal; browser proof covers 1440 and 390. `tests/portable.mjs` reconstructs permitted content including the accepted quote choice under a fresh current Owner session, refuses old sessions and tokens, and checks the trusted later erasure journal. These are preparatory inspection proofs only.
**Gap.** Customer sign-in and credential issuance, expiry and revocation; customer-facing screens and authenticated cross-customer isolation; quote approval and signing; invoice payment and receipts; work requests; visit confirmation and policy-bound rescheduling; report discovery, reading and original-file isolation; agreement renewal and card updates; COMM-007 portal communications and provider outcomes; and complete customer browser acceptance at 1440 and 390 remain unbuilt or unproved. Preparatory Owner inspection grants no customer authentication, sending, booking or payment authority. All original acceptance, payment prerequisites and release holds remain binding; COMM-006 stays PARTIAL.  Customer-hub quote signing, payment, work requests, visits, reports, agreement renewal, card updates and conversations remain unbuilt. The delivered Owner-only inspection confers none of these customer workflows.

#### COMM-023 — Owner inspection of customer-facing projection

Core · target · **partial** · From COMM-006 · Cites BASE-ACCESS-003, BASE-SECRET-001

**Requirement.** Owner inspection of customer-facing projection supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Only a signed-in Owner without branch limits may explicitly inspect one customer’s proposed customer-facing content.
2. The projection includes customer document fields of sent or decided quotes, customer-facing price-book descriptions, approved invoices, confirmed-payment summaries, visits, completed-report summaries, equipment and agreements.
3. It shows proposed customer communications content, not proof that any content was sent, received or read.
4. Exclude draft documents, private notes, access notes, internal conversations, credentials, payment authorization evidence and report files.
5. Report summaries provide no original-file access.
6. Existing document, customer, record and original-file restrictions remain binding.
7. The projection does not authenticate a customer, assert control of their email or phone, issue a credential or link, grant customer access, approve or sign a quote, request work, change a visit or agreement, send a message, update a payment method or authorize a payment.
8. Enforce the Owner restriction at the command boundary.

**Evidence.** `tests/api/customer-quotes.test.mjs` › “COMM-006 Owner hub preview isolates one customer and excludes drafts, access notes, payment credentials and internal conversations” proves the permitted projection including quoted alternatives and the accepted option with add-ons and its exact total, confirmed payments, exact authority and unavailable or merged-customer refusals, hiding of a newly unapproved quote revision, role and token exclusions, current authority on new requests and replay, attributable inspection without copied bodies, and erasure of saved outcomes and timeline copies. `tests/browser/customer-quotes.spec.ts` › “COMM-006 Owner inspects two customers through restricted previews, then sees unavailable and withdrawn access” proves explicit Owner inspection, quoted alternatives and the accepted work with its exact total, two-customer selection, summary-only reports and clearing after refusal; browser proof covers 1440 and 390. `tests/portable.mjs` reconstructs permitted content including the accepted quote choice under a fresh current Owner session, refuses old sessions and tokens, and checks the trusted later erasure journal. These are preparatory inspection proofs only.
**Gap.** Customer sign-in and credential issuance, expiry and revocation; customer-facing screens and authenticated cross-customer isolation; quote approval and signing; invoice payment and receipts; work requests; visit confirmation and policy-bound rescheduling; report discovery, reading and original-file isolation; agreement renewal and card updates; COMM-007 portal communications and provider outcomes; and complete customer browser acceptance at 1440 and 390 remain unbuilt or unproved. Preparatory Owner inspection grants no customer authentication, sending, booking or payment authority. All original acceptance, payment prerequisites and release holds remain binding; COMM-006 stays PARTIAL.

#### COMM-024 — Customer preview has no transaction authority

Core · target · **partial** · From COMM-006 · Cites BASE-ACCESS-003, BASE-ROLE-001

**Requirement.** Customer preview has no transaction authority supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Inspection creates no communication or payment effect.

**Evidence.** `tests/api/customer-quotes.test.mjs` › “COMM-006 Owner hub preview isolates one customer and excludes drafts, access notes, payment credentials and internal conversations” proves the permitted projection including quoted alternatives and the accepted option with add-ons and its exact total, confirmed payments, exact authority and unavailable or merged-customer refusals, hiding of a newly unapproved quote revision, role and token exclusions, current authority on new requests and replay, attributable inspection without copied bodies, and erasure of saved outcomes and timeline copies. `tests/browser/customer-quotes.spec.ts` › “COMM-006 Owner inspects two customers through restricted previews, then sees unavailable and withdrawn access” proves explicit Owner inspection, quoted alternatives and the accepted work with its exact total, two-customer selection, summary-only reports and clearing after refusal; browser proof covers 1440 and 390. `tests/portable.mjs` reconstructs permitted content including the accepted quote choice under a fresh current Owner session, refuses old sessions and tokens, and checks the trusted later erasure journal. These are preparatory inspection proofs only.
**Gap.** Customer sign-in and credential issuance, expiry and revocation; customer-facing screens and authenticated cross-customer isolation; quote approval and signing; invoice payment and receipts; work requests; visit confirmation and policy-bound rescheduling; report discovery, reading and original-file isolation; agreement renewal and card updates; COMM-007 portal communications and provider outcomes; and complete customer browser acceptance at 1440 and 390 remain unbuilt or unproved. Preparatory Owner inspection grants no customer authentication, sending, booking or payment authority. All original acceptance, payment prerequisites and release holds remain binding; COMM-006 stays PARTIAL.

#### COMM-025 — Projection authority and retained custody

Core · target · **partial** · From COMM-006 · Cites BASE-ACCESS-003, BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Projection authority and retained custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Signed-out people, branch-limited Owners, other staff roles, custom roles, integration tokens and agents gain no projection access through this policy.
2. Refusal reads “An Owner without branch limits must sign in to inspect this customer preview” and reveals no customer content.
3. An unavailable customer reads “Customer preview unavailable” without exposing another customer’s records.
4. Each successful inspection records the actual Owner, time, selected customer reference and inspection effect in Activity and business export, without copying the projection body, private fields or credentials into the trail.
5. Restore reconstructs the projection only from permitted restored records under current authority; it restores no session, customer credential, link or sending or payment authority.
6. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erasure removes underlying personal content and personal saved outcomes or timeline copies, and the projection must not reconstruct erased content.
7. The trusted later erasure journal prevents an older backup from reviving erased content; an offline destination cannot discover a later erasure without that journal.

**Evidence.** `tests/api/customer-quotes.test.mjs` › “COMM-006 Owner hub preview isolates one customer and excludes drafts, access notes, payment credentials and internal conversations” proves the permitted projection including quoted alternatives and the accepted option with add-ons and its exact total, confirmed payments, exact authority and unavailable or merged-customer refusals, hiding of a newly unapproved quote revision, role and token exclusions, current authority on new requests and replay, attributable inspection without copied bodies, and erasure of saved outcomes and timeline copies. `tests/browser/customer-quotes.spec.ts` › “COMM-006 Owner inspects two customers through restricted previews, then sees unavailable and withdrawn access” proves explicit Owner inspection, quoted alternatives and the accepted work with its exact total, two-customer selection, summary-only reports and clearing after refusal; browser proof covers 1440 and 390. `tests/portable.mjs` reconstructs permitted content including the accepted quote choice under a fresh current Owner session, refuses old sessions and tokens, and checks the trusted later erasure journal. These are preparatory inspection proofs only.
**Gap.** Customer sign-in and credential issuance, expiry and revocation; customer-facing screens and authenticated cross-customer isolation; quote approval and signing; invoice payment and receipts; work requests; visit confirmation and policy-bound rescheduling; report discovery, reading and original-file isolation; agreement renewal and card updates; COMM-007 portal communications and provider outcomes; and complete customer browser acceptance at 1440 and 390 remain unbuilt or unproved. Preparatory Owner inspection grants no customer authentication, sending, booking or payment authority. All original acceptance, payment prerequisites and release holds remain binding; COMM-006 stays PARTIAL.

#### COMM-007 — One conversation history per customer

Core · target · **partial** · Cites BASE-AUDIT-001, BASE-INPUT-002, BASE-ROLE-001

**Requirement.** Customer and job conversation streams combine recorded calls and notes, actual sends and replies, document responses, provider outcomes and agent work in order, retaining direction, channel and actual author. Merging customers preserves those entries, and field-role restrictions remain in force. The [operating rules](docs/service-work-rules.md#comm-007-operating-rules) retain the record formats and calculations. Owning-capability boundaries: Inheritance: `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`, `COMM-002`, `COMM-005`, `COMM-006, COMM-022, COMM-023, COMM-024, COMM-025`, `COMM-009, COMM-028` and `AGENT-001` each assert that its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.

**Acceptance.**
1. A fixture logs a call and a note on one job, reads them with today's real sends (a request and its follow-up, a quote recorded as sent and its signed acceptance, a purchase order recorded as sent, a delivered and a refused Web Push notice) and an agent's quote draft, in order, from the customer and job streams with direction, channel, author and delivery; field roles cannot read or log; agent log calls use their sponsor’s role and grant under the company’s policy; a merged customer's entries read on the survivor, and the logged call and note are in Activity and the business export.

**Evidence.** `src/glove/conversation.ts`, `src/ui/conversation.tsx`, `tests/api/conversation.test.mjs`, `src/glove/history.ts`, `src/glove/api.ts`, `tests/browser/journey.spec.ts`
**Gap.** Old evidence asserts existing customer/job streams, field-role restrictions, merging and logged-call/note Activity and export. An agent logging through its sponsor’s role and grant under the company’s selected policy is unasserted; the existing fixed Agent-role log refusal does not prove that authority and policy path. The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture logs a call and a note on one job, reads them with today's real sends (a request and its follow-up, a quote recorded as sent and its signed acceptance, a purchase order recorded as sent, a delivered and a refused Web Push notice) and an agent's quote draft, in order, from the customer and job streams with direction, channel, author and delivery; field roles cannot read or log; agent log calls use their sponsor’s role and grant under the company’s policy; a merged customer's entries read on the survivor, and the logged call and note are in Activity and the business export. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COMM-008 — Review requests after paid jobs

Core · target · **partial** · From COMM-008 · Cites BASE-AUDIT-001

**Requirement.** Review requests after paid jobs supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-008-operating-rules) retain the record formats and calculations. Owning-capability boundaries: COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018: assert each emailed review request goes through the owner's provider (fake) with its provider outcome on the message, customer and job timelines, Activity and export without secrets, and that any email not strictly transactional carries the CAN-SPAM unsubscribe link and postal address. COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 inheritance: every review request it emails goes through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`'s door with the same provider outcomes: one send attempt per message, recorded with the provider's answer and reference on the message, the customer and job timelines, Activity and the business export without secrets; state changes only from authenticated provider callbacks; delivery is never claimed without the provider's event.

**Acceptance.**
1. A fixture completes and pays two jobs for one customer within the period and checks one request was sent; an opted-out customer gets none.
2. Any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address.
3. COMM-008, COMM-026, COMM-027 still requires owner-selected automatic trigger execution, owner controls, text requests under COMM-002, and recording reviews reported by Google Business Profile.
4. Those capabilities inherit the same eligibility, consent, uniform wording, period and outcome controls; COMM-003, COMM-019, COMM-020 retains owner-editable template obligations.
5. DISP-009 is unchanged.

**Evidence.** `tests/api/reminders.test.mjs`, `tests/browser/reminders.spec.ts`
**Gap.** Automatic trigger execution, text requests and Google Business Profile review retrieval remain unbuilt. Approved with riders: the current capability is off-by-default, explicit owner-triggered email under the owner's established current authority; unscoped does not bypass access or recipient boundaries. Separate source and time-recorded permission must match the current email, existing opt-outs prevail, and every request uses the uniform configured wording, postal address and purpose-specific unsubscribe. Assert address-change and unauthorized-send refusal, the shared customer period across jobs, period consumption for every provider attempt including refusal, rate limiting, failure and uncertainty, no automatic send or retry, authenticated outcome distinctions and attributable secret-free history. The cited test proves its named manual-email slice, not every rider. Automatic triggers, texts under COMM-002 and Google review retrieval remain required and unbuilt; COMM-003 retains owner-editable review templates. Status remains PARTIAL. `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” proves separate review withdrawal and changing between private preference links at both widths.

#### COMM-026 — Review-request consent and uniform wording

Core · target · **partial** · From COMM-008 · Cites BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Review-request consent and uniform wording supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Review email is off by default.
2. The current signed-in owner explicitly configures one uniform request and explicitly requests every email; enabling this preparatory and manual capability does not enable automatic execution or retries. “Unscoped owner” means the owner's established current installation authority, without a branch-scoped or application-token credential; it never bypasses existing session, role, customer, job, branch or recipient boundaries.
3. Review-email permission is separate from visit notices, quote follow-ups and SMS permission.
4. The owner records the customer's affirmative permission with its source or reference and time against the current email address; a changed address requires permission for that address.
5. An address on file or owner configuration approval is not customer consent.
6. Existing do-not-contact, marketing and review opt-outs prevail.
7. Every eligible customer receives the same configured request, without sentiment filtering, with the business name, postal address and a purpose-specific unsubscribe.

**Evidence.** `tests/api/reminders.test.mjs`, `tests/browser/reminders.spec.ts`
**Gap.** Automatic trigger execution, text requests and Google Business Profile review retrieval remain unbuilt. Approved with riders: the current capability is off-by-default, explicit owner-triggered email under the owner's established current authority; unscoped does not bypass access or recipient boundaries. Separate source and time-recorded permission must match the current email, existing opt-outs prevail, and every request uses the uniform configured wording, postal address and purpose-specific unsubscribe. Assert address-change and unauthorized-send refusal, the shared customer period across jobs, period consumption for every provider attempt including refusal, rate limiting, failure and uncertainty, no automatic send or retry, authenticated outcome distinctions and attributable secret-free history. The cited test proves its named manual-email slice, not every rider. Automatic triggers, texts under COMM-002 and Google review retrieval remain required and unbuilt; COMM-003 retains owner-editable review templates. Status remains PARTIAL. `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” proves separate review withdrawal and changing between private preference links at both widths.

#### COMM-027 — Review-request period and outcome custody

Core · target · **partial** · From COMM-008 · Cites BASE-AUDIT-001

**Requirement.** Review-request period and outcome custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The period is per customer across jobs.
2. Every provider attempt consumes it, including refusal, rate limiting, failure and uncertain delivery; changing the job or message identity cannot bypass it.
3. An uncertain result remains unknown, never presumed unsent and never automatically retried.
4. Queueing, provider acceptance and authenticated delivery are distinct facts.
5. Configuration, consent and withdrawal, explicit requests or skipped reasons, and provider outcomes and references retain their existing attributable Activity, timeline and export custody without credentials or unsubscribe bearers.
6. This approves only the current manual-email boundary.

**Evidence.** `tests/api/reminders.test.mjs`, `tests/browser/reminders.spec.ts`
**Gap.** Automatic trigger execution, text requests and Google Business Profile review retrieval remain unbuilt. Approved with riders: the current capability is off-by-default, explicit owner-triggered email under the owner's established current authority; unscoped does not bypass access or recipient boundaries. Separate source and time-recorded permission must match the current email, existing opt-outs prevail, and every request uses the uniform configured wording, postal address and purpose-specific unsubscribe. Assert address-change and unauthorized-send refusal, the shared customer period across jobs, period consumption for every provider attempt including refusal, rate limiting, failure and uncertainty, no automatic send or retry, authenticated outcome distinctions and attributable secret-free history. The cited test proves its named manual-email slice, not every rider. Automatic triggers, texts under COMM-002 and Google review retrieval remain required and unbuilt; COMM-003 retains owner-editable review templates. Status remains PARTIAL. `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” proves separate review withdrawal and changing between private preference links at both widths.

#### COMM-009 — Calls on the business number

Core · target · **partial** · From COMM-009 · Cites BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** Calls on the business number supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-009-operating-rules) retain the record formats and calculations. Owning-capability boundaries: COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.

**Acceptance.**
1. A fixture replays Twilio voice webhooks (fake) for an answered call and a missed call, checks the call log, the recording notice and the missed-call text.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
3. Call routing starts off and only a signed-in Owner without branch limits explicitly configures the connected existing Twilio number, its ordered office and on-call destinations and optional final forwarding destination.
4. The present slice accepts only an unambiguous current customer number; unknown and shared-number callers remain a Gap, without creating customer identities.
5. Signed callbacks retain exact provider call references, durations and outcomes.
6. Only that Owner authority reads native call metadata and routing configuration.
7. Recording is refused and no recording notice or recording access is claimed.

**Evidence.** `tests/api/reminders.test.mjs`, `tests/api/voice-flow.mjs`, `tests/browser/reminders.spec.ts`, `tests/browser/voice-journey.ts`
**Gap.** CT approval of the adopted routing, Owner-only call custody and explicit missed-call booking-text defaults remains pending. Recording consent, recording notice, provider recording custody and access, automatic missed-call texts, unknown and shared-number callers, inbound caller-disconnect outcomes, browser configuration and reply controls, complete archive restoration proof and COMM-002 number hosting and port activation remain unbuilt or unproved. The existing-number connection is an Owner affirmation; no live provider receipt is claimed.

#### COMM-028 — Missed-call reply and call custody

Core · target · **partial** · From COMM-009 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-SECRET-001

**Requirement.** Missed-call reply and call custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-009-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Missed-call webhooks never send automatically.
2. The Owner may explicitly request one booking-link text for an unreplied missed call, using their still-valid offer for that customer, separate source and wording consent for the current number, STOP protection and customer-zone quiet hours.
3. The body and booking bearer remain transient; a durable attempt permits one provider request, never an automatic retry.
4. Provider acceptance and authenticated delivery remain distinct.
5. Activity and business export retain actual effects and provider references without credentials or bearers.
6. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erasure removes call records, replies, saved outcomes and personal timeline copies; a saved opaque callback identity prevents replay from reconstructing erased calls even when the number is reused.
7. Restore retains permitted history but imports no provider key or booking credential, and reconnection changes the callback connection identity.
8. This preparatory boundary does not replace the complete original target.

**Evidence.** `tests/api/reminders.test.mjs`, `tests/api/voice-flow.mjs`, `tests/browser/reminders.spec.ts`, `tests/browser/voice-journey.ts`
**Gap.** CT approval of the adopted routing, Owner-only call custody and explicit missed-call booking-text defaults remains pending. Recording consent, recording notice, provider recording custody and access, automatic missed-call texts, unknown and shared-number callers, inbound caller-disconnect outcomes, browser configuration and reply controls, complete archive restoration proof and COMM-002 number hosting and port activation remain unbuilt or unproved. The existing-number connection is an Owner affirmation; no live provider receipt is claimed.

### Field work on the phone

#### FIELD-001 — Offline day of jobs that survives a reload

Core · target · **partial** · Cites BASE-DATA-002, BASE-ROLE-001

**Requirement.** The technician's phone keeps the day's assigned visits (customer, site, access notes, equipment, history, checklists, forms, photos already taken) cached, so the app opens, reloads and works with no signal; everything captured offline sends exactly once on reconnect under `GLOVE-06`, and a conflict with a desk change is shown, never silently overwritten. The [operating rules](docs/service-work-rules.md#field-001-operating-rules) retain the record formats and calculations. Recorded decisions: RL-11.

**Acceptance.**
1. A fixture loads the day, goes offline, reloads the app, completes a visit with photos and a form, reconnects, and checks everything landed once; a visit moved at the desk meanwhile shows the late-evidence review.
2. Only a signed-in Technician's phone keeps the day: that technician's own view (the visits ever assigned to them with those jobs' customers, sites, access notes, equipment, history, checklists, forms and captures; never prices), replaced on every successful refresh, kept in this browser's storage, and cleared on sign-out and whenever a different person or a desk role signs in on it.
3. A service worker keeps the app shell this phone loaded and that technician's photos, answering from them only when the network fails; it never keeps records or other the documented product door or the documented product door answers, and desk roles never keep records.
4. With no signal the app opens, reloads and works from the kept day, saying how old it is; everything recorded (arrival, checklist, forms, notes, photos, materials, completion) waits in the phone's outbox, in order, tied to the person who recorded it (another sign-in never sends or shows it), and sends exactly once on reconnect under `GLOVE-06`; a visit can be completed once its arrival is waiting to send.
5. Evidence for a visit the desk moved to someone else meanwhile is kept, flagged and reviewed under `GLOVE-07`, never silently overwritten.

**Evidence.** `src/ui/offline-day.ts`, `public/glove-sw.js`, `src/ui/api.ts`, `src/ui/outbox.ts`, `src/ui/technician.tsx`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture loads the day, goes offline, reloads the app, completes a visit with photos and a form, reconnects, and checks everything landed once; a visit moved at the desk meanwhile shows the late-evidence review.; point 2 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits ever assigned to them with those jobs' customers, sites, access notes, equipment, history, checklists, forms and captures; never prices), replaced on every successful refresh, kept in this browser's storage, and cleared on sign-out and whenever a different person or a desk role signs in on it.; point 3 — A service worker keeps the app shell this phone loaded and that technician's photos, answering from them only when the network fails; it never keeps records or other the documented product door or the documented product door answers, and desk roles never keep records.; point 4 — With no signal the app opens, reloads and works from the kept day, saying how old it is; everything recorded (arrival, checklist, forms, notes, photos, materials, completion) waits in the phone's outbox, in order, tied to the person who recorded it (another sign-in never sends or shows it), and sends exactly once on reconnect under GLOVE-06; a visit can be completed once its arrival is waiting to send.; point 5 — Evidence for a visit the desk moved to someone else meanwhile is kept, flagged and reviewed under GLOVE-07, never silently overwritten. See docs/contract/DONE-AUDIT.md for each named outcome.

#### FIELD-002 — Custom forms and inspections

Core · target · **partial** · Cites BASE-AUDIT-001, BASE-INPUT-003

**Requirement.** The owner builds forms (yes/no, choice, number with units, reading with range, photo, signature, notes, conditional questions) and attaches them to services, equipment types or agreements; technicians fill them offline; results appear on the job, the report and the equipment history. The [operating rules](docs/service-work-rules.md#field-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture builds an HVAC inspection form with a conditional question and a reading range, fills it on a visit with one out-of-range reading, and finds the flagged reading on the job and the equipment.
2. The owner builds a form of up to 60 questions (yes/no, choice, number with an optional unit, reading with a unit and an inclusive range, photo, signature, notes); a question can be asked only when an earlier yes/no or choice question has a given answer.
3. A form attaches to price-book services and to equipment types (matched without regard to case).
4. A new job takes a copy of each form that applies: one per unit the job names whose type the form lists, otherwise one for the job when a quoted service lists it; editing or archiving the form never changes a job's copy, and the per-service checklists stay as they are.
5. The technician fills each copy once on the phone, through the outbox, so it works without signal (`GLOVE-06`): every question asked and required must be answered, a question not asked must be left empty, and a reading below its lowest or above its highest value is flagged.
6. The filled form is a field record on the job and its timeline (naming how many readings are out of range), on the unit's service history when the copy is for a unit, and in the property history.
7. Agreements carry forms when `PLAN-002` ships, and the customer's report prints form results under `FIELD-003`.

**Evidence.** `src/glove/forms.ts`, `src/glove/commands/forms.ts`, `src/glove/commands/field.ts`, `src/ui/forms.tsx`, `tests/api/forms.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture builds an HVAC inspection form with a conditional question and a reading range, fills it on a visit with one out-of-range reading, and finds the flagged reading on the job and the equipment.; point 2 — The owner builds a form of up to 60 questions (yes/no, choice, number with an optional unit, reading with a unit and an inclusive range, photo, signature, notes); a question can be asked only when an earlier yes/no or choice question has a given answer.; point 3 — A form attaches to price-book services and to equipment types (matched without regard to case).; point 4 — A new job takes a copy of each form that applies: one per unit the job names whose type the form lists, otherwise one for the job when a quoted service lists it; editing or archiving the form never changes a job's copy, and the per-service checklists stay as they are.; point 5 — The technician fills each copy once on the phone, through the outbox, so it works without signal (GLOVE-06): every question asked and required must be answered, a question not asked must be left empty, and a reading below its lowest or above its highest value is flagged.; point 6 — The filled form is a field record on the job and its timeline (naming how many readings are out of range), on the unit's service history when the copy is for a unit, and in the property history.; point 7 — Agreements carry forms when PLAN-002 ships, and the customer's report prints form results under FIELD-003. See docs/contract/DONE-AUDIT.md for each named outcome.

#### FIELD-003 — Shareable service report

Core · target · **partial** · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-ROLE-001

**Requirement.** Completing a visit produces an immutable service report: work summary, findings, `FIELD-002` form results with out-of-range readings marked, photos, materials, customer signature (or the recorded reason it is absent), and recommendations. The owner, dispatcher or office creates a seven-day link with **Copy report link** and shares it with the customer by hand today; Glove makes no delivery claim. Recommendations become a quote draft in one step under ordinary human price approval. COMM-003, COMM-019, COMM-020/004 inherit customer notices, COMM-006, COMM-022, COMM-023, COMM-024, COMM-025 the hub, and QUOTE-005, QUOTE-015 branded PDF documents, in their text and acceptance before shipping. The [operating rules](docs/service-work-rules.md#field-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Completing a visit freezes the customer report’s fields, form readings and flags, with only the technician’s first name.
2. A report link reads exactly that snapshot and its originals; another record or unrelated original remains unavailable.
3. Revocation, expiry or loss of the issuer’s current branch authority closes the link.
4. A recommended item creates one quote draft under ordinary price approval.
5. Report creation, sharing and recommendation outcomes appear in Activity, property history and business export.
6. Restore preserves exact snapshot bytes and link metadata, while requiring a newly issued bearer.

**Evidence.** `src/glove/service-reports.ts`, `src/glove/commands/service-reports.ts`, `src/ui/service-report.tsx`, `tests/api/service-reports.test.mjs`, `tests/browser/service-reports.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Completing a visit freezes the customer report’s fields, form readings and flags, with only the technician’s first name.; point 2 — A report link reads exactly that snapshot and its originals; another record or unrelated original remains unavailable.; point 3 — Revocation, expiry or loss of the issuer’s current branch authority closes the link.; point 4 — A recommended item creates one quote draft under ordinary price approval.; point 5 — Report creation, sharing and recommendation outcomes appear in Activity, property history and business export.; point 6 — Restore preserves exact snapshot bytes and link metadata, while requiring a newly issued bearer. See docs/contract/DONE-AUDIT.md for each named outcome.

#### FIELD-004 — Installable technician app with push

Core · target · **partial** · From FIELD-004 · Cites BASE-ACCESSIBILITY-001 · Register R-1, R-2

**Requirement.** Installable technician app with push supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-004-operating-rules) retain the record formats and calculations. Recorded decisions: RL-12.

**Acceptance.**
1. A fixture installs the app manifest, subscribes to push, and receives a notification (push service fake) when the dispatcher moves the visit; from the visit, tap-to-call opens a tel: link to the customer's number and tap-to-navigate a maps link to the site's address.
2. The documented product door installs to the home screen from its web app manifest (Glove, starting at the documented product door, standalone, 192 and 512 px icons) and the home-screen tags iPhone reads; an iPhone shows web pushes only once Glove is added to its Home Screen (iOS 16.4 and later), which the phone screen says.
3. Field photos open the rear camera directly.
4. Tapping a notification opens the signed-in app on that job's visit.
5. On a visit, Call customer opens a tel: link to the customer's phone (its digits and a leading +) and Navigate to site opens Google Maps directions to the site's address (the Maps app where installed).
6. A local installation served from this computer also accepts a push service on this computer (the documented product door or localhost), so its own browser journey can run one; a hosted installation accepts only https push services.
7. `FIELD-005`'s native apps carry push in their own text.

**Evidence.** `src/glove/push.ts`, `src/glove/commands/push.ts`, `src/ui/push.tsx`, `public/manifest.webmanifest`, `public/glove-sw.js`, `tests/api/push.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture installs the app manifest, subscribes to push, and receives a notification (push service fake) when the dispatcher moves the visit; from the visit, tap-to-call opens a tel: link to the customer's number and tap-to-navigate a maps link to the site's address.; point 2 — The documented product door installs to the home screen from its web app manifest (Glove, starting at the documented product door, standalone, 192 and 512 px icons) and the home-screen tags iPhone reads; an iPhone shows web pushes only once Glove is added to its Home Screen (iOS 16.4 and later), which the phone screen says.; point 3 — Field photos open the rear camera directly.; point 4 — Tapping a notification opens the signed-in app on that job's visit.; point 5 — On a visit, Call customer opens a tel: link to the customer's phone (its digits and a leading +) and Navigate to site opens Google Maps directions to the site's address (the Maps app where installed).; point 6 — A local installation served from this computer also accepts a push service on this computer (the documented product door or localhost), so its own browser journey can run one; a hosted installation accepts only https push services.; point 7 — FIELD-005's native apps carry push in their own text. See docs/contract/DONE-AUDIT.md for each named outcome.

#### FIELD-009 — Phone push subscriptions

Core · target · **partial** · From FIELD-004 · Cites BASE-ACCESSIBILITY-001, BASE-DATA-001, BASE-ROLE-001, BASE-SECRET-001 · Register R-1, R-2

**Requirement.** Phone push subscriptions supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair whose private key is an owner-only installation secret (never in records, state, exports, logs or the archive); turning them on again replaces the key, and turning them off deletes the key and every subscription.
2. A Technician turns notifications on for each phone.
3. A subscription (the push service address and the phone's keys) belongs to that person, that device and that signed-in session; only that person reads it back, as their list of phones (a label, the last outcome and when, never the address or keys); and it is deleted when they remove it, sign out on that phone, the session is ended elsewhere or expires, they stop being an active Technician (a role change or deactivation), the push service no longer knows it (HTTP 404 or 410), or the owner turns notifications off.
4. It is never in records, exports or the archive, so a restored installation needs fresh subscriptions.

**Evidence.** `src/glove/push.ts`, `src/glove/commands/push.ts`, `src/ui/push.tsx`, `public/manifest.webmanifest`, `public/glove-sw.js`, `tests/api/push.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair whose private key is an owner-only installation secret (never in records, state, exports, logs or the archive); turning them on again replaces the key, and turning them off deletes the key and every subscription.; point 2 — A Technician turns notifications on for each phone.; point 3 — A subscription (the push service address and the phone's keys) belongs to that person, that device and that signed-in session; only that person reads it back, as their list of phones (a label, the last outcome and when, never the address or keys); and it is deleted when they remove it, sign out on that phone, the session is ended elsewhere or expires, they stop being an active Technician (a role change or deactivation), the push service no longer knows it (HTTP 404 or 410), or the owner turns notifications off.; point 4 — It is never in records, exports or the archive, so a restored installation needs fresh subscriptions. See docs/contract/DONE-AUDIT.md for each named outcome.

#### FIELD-010 — Schedule-change push outcomes

Core · target · **partial** · From FIELD-004 · Cites BASE-ACCESSIBILITY-001, BASE-ROLE-001, BASE-SECRET-001 · Register R-1, R-2

**Requirement.** Schedule-change push outcomes supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. After every committed change, whoever or whatever made it (a person, a rule, a recurring series, an agent under the owner's grant, a move-in), each technician with a visit that has not ended and was booked to them, moved (its start or end changed), canceled, or handed to another technician gets one push on each subscribed phone: "New visit on your schedule" (also for the technician who receives a handed-over visit), "Visit moved", "Visit canceled" or "Visit moved off your schedule", or "N changes to your schedule" when one change touches several of their visits.
2. A push carries only that line and, when one visit changed, the job's opaque id; never the customer, site, time or a note.
3. Each push is encrypted for the phone (RFC 8291, aes128gcm) and signed with the VAPID key (RFC 8292: a 12-hour token naming the business email, else the installation address), kept by the push service for at most a day, and sent once, never retried.
4. The phone list says "Handed to the push service" (not "delivered", which Glove cannot see), "Not sent: the push service answered HTTP <status>" or "Not sent: the push service could not be reached".
5. A technician manages the phone’s own subscription; committed visit changes trigger the bounded schedule-notification connector.

**Evidence.** `src/glove/push.ts`, `src/glove/commands/push.ts`, `src/ui/push.tsx`, `public/manifest.webmanifest`, `public/glove-sw.js`, `tests/api/push.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — After every committed change, whoever or whatever made it (a person, a rule, a recurring series, an agent under the owner's grant, a move-in), each technician with a visit that has not ended and was booked to them, moved (its start or end changed), canceled, or handed to another technician gets one push on each subscribed phone: "New visit on your schedule" (also for the technician who receives a handed-over visit), "Visit moved", "Visit canceled" or "Visit moved off your schedule", or "N changes to your schedule" when one change touches several of their visits.; point 2 — A push carries only that line and, when one visit changed, the job's opaque id; never the customer, site, time or a note.; point 3 — Each push is encrypted for the phone (RFC 8291, aes128gcm) and signed with the VAPID key (RFC 8292: a 12-hour token naming the business email, else the installation address), kept by the push service for at most a day, and sent once, never retried.; point 4 — The phone list says "Handed to the push service" (not "delivered", which Glove cannot see), "Not sent: the push service answered HTTP <status>" or "Not sent: the push service could not be reached".; point 5 — A technician manages the phone’s own subscription; committed visit changes trigger the bounded schedule-notification connector. See docs/contract/DONE-AUDIT.md for each named outcome.

#### FIELD-005 — Native iOS and Android apps

Core · target · **missing** · Register R-3, R-4

**Requirement.** Glove ships technician apps in the App Store and Google Play, signed in to the owner's installation, with the offline cache of `FIELD-001`, background photo upload, push, location under `DISP-005, DISP-012` and Tap to Pay under `PAY-003`. The [operating rules](docs/service-work-rules.md#field-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A device-farm journey on a current iPhone and Android phone completes a visit offline, reconnects and takes a Tap to Pay test payment (Stripe test mode).

**Evidence.** None.
**Gap.** no native apps

#### FIELD-006 — Equipment nameplate capture

Core · target · **partial** · From FIELD-006 · Cites BASE-DATA-001, BASE-SECRET-001

**Requirement.** Equipment nameplate capture supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture submits three fixture nameplate photos (model provider fake), checks the proposed fields and, under the held company policy, checks nothing is saved until the technician confirms.
2. The model provider is the owner's own: an OpenAI-compatible chat-completions address (https), one model id and the owner's key, connected by the owner only and kept like the marketing keys (never in records, exports, logs or the archive); without it nothing is read.
3. The technician reads a nameplate on a visit they are working, for a unit already at the site or one not recorded yet; only the photo goes to the provider (no customer, site or job details), asking for JSON with storage off.
4. The reading is labelled as read by the model and carries its evidence and uncertainty.
5. The company’s policy decides whether the standard-class reading fills the equipment fields or waits for the technician.
6. Under the held policy the technician who took it confirms or corrects the fields or discards the reading, keeping the proposed and corrected fields distinct.

**Evidence.** `src/glove/commands/nameplates.ts`, `src/glove/provider.ts`, `src/ui/nameplates.tsx`, `tests/api/nameplates.test.mjs`
**Gap.** Old evidence asserts the three nameplate readings, unchanged equipment before the technician confirms, corrected fields, discard and manual attachment. Company-policy selection between automatic field filling and held confirmation is unasserted; the existing fixed technician-confirmation gate proves only that held behavior. The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture submits three fixture nameplate photos (model provider fake), checks the proposed fields and, under the held company policy, checks nothing is saved until the technician confirms.; point 2 — The model provider is the owner's own: an OpenAI-compatible chat-completions address (https), one model id and the owner's key, connected by the owner only and kept like the marketing keys (never in records, exports, logs or the archive); without it nothing is read.; point 3 — The technician reads a nameplate on a visit they are working, for a unit already at the site or one not recorded yet; only the photo goes to the provider (no customer, site or job details), asking for JSON with storage off.; point 4 — The reading is labelled as read by the model and carries its evidence and uncertainty.; point 5 — The company’s policy decides whether the standard-class reading fills the equipment fields or waits for the technician.; point 6 — Under the held policy the technician who took it confirms or corrects the fields or discards the reading, keeping the proposed and corrected fields distinct. See docs/contract/DONE-AUDIT.md for each named outcome.

#### FIELD-011 — Nameplate dates and manual lookup

Core · target · **partial** · From FIELD-006

**Requirement.** Nameplate dates and manual lookup supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anything else is left unread, as is any field the model returns empty. "Where one is available" means the manual library the desk keeps (make, model, title, https address): on confirmation the manual whose make and model match, ignoring case and surrounding spaces, is attached; Glove never invents, searches for or fetches a manual.
2. Reading needs a signal; the confirmed unit and its manual are then in the phone's offline day (`FIELD-001`).

**Evidence.** `src/glove/commands/nameplates.ts`, `src/glove/provider.ts`, `src/ui/nameplates.tsx`, `tests/api/nameplates.test.mjs`
**Gap.** Old evidence asserts the three nameplate readings, unchanged equipment before the technician confirms, corrected fields, discard and manual attachment. Company-policy selection between automatic field filling and held confirmation is unasserted; the existing fixed technician-confirmation gate proves only that held behavior. The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anything else is left unread, as is any field the model returns empty. "Where one is available" means the manual library the desk keeps (make, model, title, https address): on confirmation the manual whose make and model match, ignoring case and surrounding spaces, is attached; Glove never invents, searches for or fetches a manual.; point 2 — Reading needs a signal; the confirmed unit and its manual are then in the phone's offline day (FIELD-001). See docs/contract/DONE-AUDIT.md for each named outcome.

#### FIELD-007 — Refrigerant tracking for HVAC

Core · target · **done**

**Requirement.** On HVAC visits the technician records refrigerant type and the amounts added and recovered per equipment item, with their EPA Section 608 certification number; the owner gets a per-equipment and per-period refrigerant log for their own recordkeeping. The [operating rules](docs/service-work-rules.md#field-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture records refrigerant added and recovered on two visits to one condenser and reads the equipment log and the period total.

**Evidence.** `tests/api/equipment.test.mjs` — “FIELD-007 refrigerant added and recovered on two visits to the condenser, in its log and the period total”
**Gap.** None.

#### FIELD-008 — The whole office on the owner's phone

Core · target · **partial** · From FIELD-008 · Cites BASE-ROLE-001 · Register R-3, R-4

**Requirement.** The whole office on the owner's phone supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-008-operating-rules) retain the record formats and calculations. Owning-capability boundaries: PAY-008, PAY-027, PAY-028, PAY-029, PAY-030 inherits method collection and autopay; PAY-009 retains keyed cards, other charge subjects and custom roles; COMM-005 retains technician texting and moved-visit threading; FIELD-005 retains native delivery.

**Acceptance.**
1. A fixture at 390 px signed in as Owner creates a job from a phoned-in request, sends a quote, books the visit, sends the invoice, records a check payment, charges a saved card on a second invoice (Stripe fake), answers a customer text and opens the dashboard, asserting no horizontal scroll on any screen; the same steps signed in as Office are refused exactly where the role table says.
2. The existing desk commands run at both widths.

**Evidence.** `tests/browser/journey.spec.ts`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`
**Gap.** FIELD-005 native apps still need Apple Developer and Google Play publisher/signing access and device proof. Keyed cards, discretionary deposits, saved bank methods and custom-role charges remain PAY-009/PAY-008 work. RL-104 resolves the saved-card authorization and retained-inbox policy holds; it grants no live spend.

#### FIELD-012 — Phone-desk saved-card and inbox custody

Core · target · **partial** · From FIELD-008 · Cites BASE-DATA-003, BASE-ROLE-001 · Register R-3, R-4

**Requirement.** Phone-desk saved-card and inbox custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A saved-card charge from the phone desk displays the exact authorized method and amount and follows PAY-031’s customer authorization and uncertain-attempt rule.
2. A phone-desk reply follows COMM-005’s retained-inbox custody, current consent and quiet-hour rule.

**Evidence.** `tests/browser/journey.spec.ts`, `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`
**Gap.** FIELD-005 native apps still need Apple Developer and Google Play publisher/signing access and device proof. Keyed cards, discretionary deposits, saved bank methods and custom-role charges remain PAY-009/PAY-008 work. RL-104 resolves the saved-card authorization and retained-inbox policy holds; it grants no live spend.

#### COST-001 — Clock-ins and job timers

Core · target · **partial** · Cites BASE-AUDIT-001

**Requirement.** Technicians clock in and out for the day and run travel and on-job timers per visit, with or without signal; time is attached to the job; the desk sees who is on the clock (the `REPORT-001` dashboard's on-the-clock tile) and corrects time with a reason. The [operating rules](docs/service-work-rules.md#cost-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture clocks in, starts travel and job timers on two visits with one offline stretch, clocks out, and checks the time on each job; a desk correction keeps the original; the `REPORT-001` on-the-clock tile lists exactly the technicians clocked in at each step.
2. A technician clocks in and out on the phone and, only while clocked in, runs one timer at a time, travel or on the job, on a visit currently assigned to them; starting a timer stops the running one at the same phone time, and clocking out or completing the visit stops it too.
3. Every start and stop carries the phone's clock time and goes through the phone's outbox with the identity it was given, so it works without signal and a resend lands once (`GLOVE-06`).
4. An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of its entries per kind.
5. The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local dates and times in the business timezone, with a reason; the entry keeps the phone's original times and every correction (who, when, reason, from and to), and the job's timeline records it.
6. Technicians read only their own entries.
7. The `REPORT-001` on-the-clock tile lists the technicians with a shift clocked in and not out, with the timer each is running.

**Evidence.** `src/glove/commands/time.ts`, `src/ui/clock.tsx`, `src/glove/dashboard.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs`, `src/glove/view.ts`, `src/ui/technician.tsx`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture clocks in, starts travel and job timers on two visits with one offline stretch, clocks out, and checks the time on each job; a desk correction keeps the original; the REPORT-001 on-the-clock tile lists exactly the technicians clocked in at each step.; point 2 — A technician clocks in and out on the phone and, only while clocked in, runs one timer at a time, travel or on the job, on a visit currently assigned to them; starting a timer stops the running one at the same phone time, and clocking out or completing the visit stops it too.; point 3 — Every start and stop carries the phone's clock time and goes through the phone's outbox with the identity it was given, so it works without signal and a resend lands once (GLOVE-06).; point 4 — An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of its entries per kind.; point 5 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local dates and times in the business timezone, with a reason; the entry keeps the phone's original times and every correction (who, when, reason, from and to), and the job's timeline records it.; point 6 — Technicians read only their own entries.; point 7 — The REPORT-001 on-the-clock tile lists the technicians with a shift clocked in and not out, with the timer each is running. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COST-002 — Timesheets and payroll export

Core · target · **partial** · From COST-002

**Requirement.** Timesheets and payroll export supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#cost-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture builds a 44-hour week, approves it, and checks the overtime split and the Gusto and QuickBooks Payroll exports; a subcontractor's total appears only in the 1099 export.
2. A workweek is seven local days in the business time zone from the owner's week-start day (Monday unless the owner sets another; fixed once any timesheet is approved).
3. Each closed shift counts its whole minutes (`COST-001` rounding) on the local day it started, including a shift that runs past midnight; job and travel timer minutes are shown beside it, and paid hours are the shift (clock) time.
4. When the owner sets a state rule, minutes past the "after" hours in a day are overtime and minutes past the optional "double after" hours are double time (quarter-hour settings, double after overtime); then, day by day in order, regular minutes beyond 40 hours in the workweek become overtime.
5. Seventh-day and other state rules are not applied.
6. Hours are each bucket's minutes / 60, rounded half up to two decimals, so rounded buckets can differ from the rounded total by 0.01.
7. A timesheet is flagged when it holds any overtime or double time.
8. Whoever reads time entries reads the week's timesheets (a technician only their own; a subcontractor none).

**Evidence.** `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `tests/api/payroll.test.mjs`, `src/glove/api.ts`, `tests/api/security.test.mjs`, `src/glove/view.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture builds a 44-hour week, approves it, and checks the overtime split and the Gusto and QuickBooks Payroll exports; a subcontractor's total appears only in the 1099 export.; point 2 — A workweek is seven local days in the business time zone from the owner's week-start day (Monday unless the owner sets another; fixed once any timesheet is approved).; point 3 — Each closed shift counts its whole minutes (COST-001 rounding) on the local day it started, including a shift that runs past midnight; job and travel timer minutes are shown beside it, and paid hours are the shift (clock) time.; point 4 — When the owner sets a state rule, minutes past the "after" hours in a day are overtime and minutes past the optional "double after" hours are double time (quarter-hour settings, double after overtime); then, day by day in order, regular minutes beyond 40 hours in the workweek become overtime.; point 5 — Seventh-day and other state rules are not applied.; point 6 — Hours are each bucket's minutes / 60, rounded half up to two decimals, so rounded buckets can differ from the rounded total by 0.01.; point 7 — A timesheet is flagged when it holds any overtime or double time.; point 8 — Whoever reads time entries reads the week's timesheets (a technician only their own; a subcontractor none). See docs/contract/DONE-AUDIT.md for each named outcome.

#### COST-006 — Approved-period payroll eligibility

Core · target · **partial** · From COST-002 · Register R-15, R-16, R-17

**Requirement.** Approved-period payroll eligibility supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#cost-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Only the owner (acting for "admin") approves a week, and only once no shift in it is still open; an approval stands while the week's entries and their split are unchanged.
2. A later correction, late entry or overtime-rule change marks it "changed since approval" until the owner approves it again.
3. The payroll files are for a pay period of 1 to 6 whole workweeks, read by the owner and office like the other exports.
4. They hold only people whose every week with time in the period is approved and unchanged, and they list everyone left out with the reason.
5. A technician record marked as a 1099 subcontractor (`DISP-007, DISP-013, DISP-014`) is never in the payroll files or approvable; their agreed-amount totals are only in the 1099-NEC export.
6. The files follow what each provider publishes, checked against the provider's own help on 21 October 2026.
7. The employee ID is the payroll ID the owner keeps on each technician record.

**Evidence.** `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `tests/api/payroll.test.mjs`, `src/glove/api.ts`, `tests/api/security.test.mjs`, `src/glove/view.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Only the owner (acting for "admin") approves a week, and only once no shift in it is still open; an approval stands while the week's entries and their split are unchanged.; point 2 — A later correction, late entry or overtime-rule change marks it "changed since approval" until the owner approves it again.; point 3 — The payroll files are for a pay period of 1 to 6 whole workweeks, read by the owner and office like the other exports.; point 4 — They hold only people whose every week with time in the period is approved and unchanged, and they list everyone left out with the reason.; point 5 — A technician record marked as a 1099 subcontractor (DISP-007, DISP-013, DISP-014) is never in the payroll files or approvable; their agreed-amount totals are only in the 1099-NEC export.; point 6 — The files follow what each provider publishes, checked against the provider's own help on 21 October 2026.; point 7 — The employee ID is the payroll ID the owner keeps on each technician record. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COST-007 — Provider payroll file shapes

Core · target · **partial** · From COST-002 · Register R-15, R-16, R-17

**Requirement.** Provider payroll file shapes supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#cost-002-operating-rules) retain the record formats and calculations. Owning-capability boundaries: Inheritance: `TEAM-003, TEAM-006` commissions and spiffs and `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020` technician tips add their amounts to the same payroll files (Gusto's commission and paycheck-tips columns, an ADP RUN earnings code with dollars) for the same approved weeks before either ships.

**Acceptance.**
1. The ADP RUN file matches its published import layout for company, pay frequency, period dates, employee, earnings code, hours, dollars, check selection, department and pay-rate code, with the exact formatting in the operating rules.
2. Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is downloaded inside Gusto, and its Smart Import matches columns on upload); Glove's column names (last name, first name, Gusto employee ID, regular, overtime and double-overtime hours; the first word of the technician's name is the first name) are therefore not confirmed against a Gusto-published layout.
3. The one column Gusto's help names, workweeks, is followed: one row per person and approved workweek, holding that week's date range as the documented refusal beside that week's hours, so Gusto places overtime in the right workweek.
4. Glove keeps no SSN and writes no SSN column.
5. QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom upload takes one entry per line with the employee and a date plus units, the date format and each column's meaning chosen on upload; Glove's date-and-units file (employee display name, MM/DD/YYYY date, pay item Regular, Overtime or Double time, hours) is a file the owner maps on upload, not a confirmed Intuit layout.

**Evidence.** `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `tests/api/payroll.test.mjs`, `src/glove/api.ts`, `tests/api/security.test.mjs`, `src/glove/view.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The ADP RUN file matches its published import layout for company, pay frequency, period dates, employee, earnings code, hours, dollars, check selection, department and pay-rate code, with the exact formatting in the operating rules.; point 2 — Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is downloaded inside Gusto, and its Smart Import matches columns on upload); Glove's column names (last name, first name, Gusto employee ID, regular, overtime and double-overtime hours; the first word of the technician's name is the first name) are therefore not confirmed against a Gusto-published layout.; point 3 — The one column Gusto's help names, workweeks, is followed: one row per person and approved workweek, holding that week's date range as the documented refusal beside that week's hours, so Gusto places overtime in the right workweek.; point 4 — Glove keeps no SSN and writes no SSN column.; point 5 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom upload takes one entry per line with the employee and a date plus units, the date format and each column's meaning chosen on upload; Glove's date-and-units file (employee display name, MM/DD/YYYY date, pay item Regular, Overtime or Double time, hours) is a file the owner maps on upload, not a confirmed Intuit layout. See docs/contract/DONE-AUDIT.md for each named outcome.

#### COST-003 — Job expenses and receipts

Core · target · **done**

**Requirement.** Technicians and the office record expenses on a job (supply-house purchases, permits, equipment rental, subcontractor bills) with a receipt photo, vendor, amount and whether it is billable; billable expenses can be added to the invoice at cost or with markup. The [operating rules](docs/service-work-rules.md#cost-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture records a supply-house receipt as billable with 20% markup and a permit fee as non-billable, and checks the invoice draft and job cost.

**Evidence.** `tests/api/expenses.test.mjs` — “COST-003 a billable supply-house receipt with 20% markup and a non-billable permit fee reach the invoice draft and job cost”
**Gap.** None.

#### COST-004 — Estimate versus actual job costing

Core · target · **partial**

**Requirement.** Every job shows its quoted price and estimated cost against actual labor (time × each person's loaded cost rate), materials at cost, expenses and subcontractors, giving actual margin and the difference from estimate; reports roll this up by job type, technician and period. The [operating rules](docs/service-work-rules.md#cost-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture runs a job quoted at $1,850 with estimated 41% margin through recorded time, materials and an expense, and checks actual cost and a 46% margin to the cent.
2. Revenue is the latest person-approved invoice revision's subtotal before tax, else the accepted quote's subtotal.
3. The estimated cost is each accepted line's unit cost (kept when the line was priced from the price book, `MONEY-003, MONEY-006`) × its quantity; a line without one counts at $0.00 and is named.
4. Actual labor is every travel and on-job entry (`COST-001`) at its whole minutes × that technician's loaded cost per hour ÷ 60; materials are the price-book materials recorded on the job at the item's unit cost now, beyond what the job's own purchase orders received (`STOCK-002`), whose received lines count at the order's unit cost; expenses and subcontractors are `COST-003`'s amounts, subcontractor bills apart.
5. Each product is rounded half up to the cent; a margin is (revenue − cost) ÷ revenue as a percentage to one decimal, rounded half up, and the difference from estimate is in dollars and margin points.
6. The owner sets each technician's loaded cost per hour; like every cost it is a margin figure, read only by roles that read reports (`MONEY-003, MONEY-006`).
7. Reports take the jobs completed in a period (by local completion date, bounds inclusive) and roll them up by job type (the category of the job's first price-book line, else Uncategorized) and by technician (their minutes, labor cost and the jobs they recorded time on).

**Evidence.** `tests/api/costing.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 7 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture runs a job quoted at $1,850 with estimated 41% margin through recorded time, materials and an expense, and checks actual cost and a 46% margin to the cent.; point 2 — Revenue is the latest person-approved invoice revision's subtotal before tax, else the accepted quote's subtotal.; point 3 — The estimated cost is each accepted line's unit cost (kept when the line was priced from the price book, MONEY-003, MONEY-006) × its quantity; a line without one counts at $0.00 and is named.; point 4 — Actual labor is every travel and on-job entry (COST-001) at its whole minutes × that technician's loaded cost per hour ÷ 60; materials are the price-book materials recorded on the job at the item's unit cost now, beyond what the job's own purchase orders received (STOCK-002), whose received lines count at the order's unit cost; expenses and subcontractors are COST-003's amounts, subcontractor bills apart.; point 5 — Each product is rounded half up to the cent; a margin is (revenue − cost) ÷ revenue as a percentage to one decimal, rounded half up, and the difference from estimate is in dollars and margin points.; point 6 — The owner sets each technician's loaded cost per hour; like every cost it is a margin figure, read only by roles that read reports (MONEY-003, MONEY-006).; point 7 — Reports take the jobs completed in a period (by local completion date, bounds inclusive) and roll them up by job type (the category of the job's first price-book line, else Uncategorized) and by technician (their minutes, labor cost and the jobs they recorded time on). See docs/contract/DONE-AUDIT.md for each named outcome.

#### COST-005 — Live margin warnings

Core · target · **partial** · Cites BASE-AUDIT-001

**Requirement.** When actual cost on an open job crosses an owner-set threshold of its estimate, or projected margin falls below a floor, Glove warns the dispatcher and the owner while the job is still open. The [operating rules](docs/service-work-rules.md#cost-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture records time past the threshold and checks one warning to each of the two people, and no repeat for the same crossing.
2. The owner sets, on the business, a cost threshold (warn when actual cost reaches this percentage of the estimate) and a margin floor (warn when projected margin falls below this percentage); either can be blank, meaning off.
3. After every command, each open job is checked with `COST-004`'s figures; its projected cost is the larger of actual and estimated cost, and a job with no estimated cost never crosses the threshold.
4. A crossing is one warning shown in Glove to the owner and to every dispatcher, on their desk screens and on the job's timeline; nothing is sent (no email or text).
5. A warning is kept once per job, kind and setting, so the same crossing never repeats; changing a setting can warn again.
6. Like every cost, warnings are read only by the owner and dispatchers they are addressed to, and their timeline entries only by roles that read reports.

**Evidence.** `src/glove/margins.ts`, `src/glove/api.ts`, `src/glove/view.ts`, `src/ui/costing.tsx`, `src/ui/team.tsx`, `tests/api/margins.test.mjs`
**Gap.** The audit records 5 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture records time past the threshold and checks one warning to each of the two people, and no repeat for the same crossing.; point 2 — The owner sets, on the business, a cost threshold (warn when actual cost reaches this percentage of the estimate) and a margin floor (warn when projected margin falls below this percentage); either can be blank, meaning off.; point 3 — After every command, each open job is checked with COST-004's figures; its projected cost is the larger of actual and estimated cost, and a job with no estimated cost never crosses the threshold.; point 4 — A crossing is one warning shown in Glove to the owner and to every dispatcher, on their desk screens and on the job's timeline; nothing is sent (no email or text).; point 5 — A warning is kept once per job, kind and setting, so the same crossing never repeats; changing a setting can warn again.; point 6 — Like every cost, warnings are read only by the owner and dispatchers they are addressed to, and their timeline entries only by roles that read reports. See docs/contract/DONE-AUDIT.md for each named outcome.

### Invoicing and payments

#### PAY-001 — USD invoices sent from Glove

Core · target · **partial** · From PAY-001 · Cites BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** USD invoices sent from Glove supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations. Recorded decisions: RL-13, RL-14.

**Acceptance.**
1. A fixture approves and sends an invoice (provider fakes), batch-invoices three completed jobs, and opens a customer statement with the right balances; a commercial customer that requires a PO refuses invoice approval without one, and its invoice goes to the accounts-payable address with the PO printed.
2. The existing invoice-preparation permission also prepares selected completed jobs together (invoice prepare batch action, 1–50 distinct job IDs).
3. Each job uses the same accepted lines, priced materials, billable expenses, discount and tax rules as a single preparation and produces a draft requiring its own existing approval.
4. Results stay in selection order and name each prepared invoice or refusal; a refused item consumes no invoice number or expense and does not prevent the other items.
5. Branch limits apply to each job; an out-of-branch job returns no record details.
6. Replaying the same command returns the same result; a fresh request for an already invoiced job refuses it rather than duplicating it.
7. Activity and business export retain the individual preparations and the batch counts.
8. The Invoices screen offers selection, each result and links to review drafts.

**Evidence.** `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`
**Gap.** External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold.

#### PAY-010 — Customer statements

Core · target · **partial** · From PAY-001 · Cites BASE-DATA-003, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Customer statements supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The desk's existing report authority opens a customer's dated statement as JSON or downloads it as CSV from Customers.
2. Statements include only that customer's approved revisions and retained opening balances through the chosen date, subtract confirmed payment effects through each record's branch-local date, and keep currencies separate.
3. Unapproved corrections and pending, failed or returned payments do not reduce a balance; tips and fees are excluded.
4. Credits stay separate until explicitly allocated.
5. Dates remain frozen under GLOVE-09 and PLAN-005, PLAN-012, PLAN-013.
6. Branch scope, customer erasure and existing report permissions apply at the HTTP boundary.
7. Statements issue no payment credential and send no message.
8. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

**Evidence.** `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`
**Gap.** External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold.

#### PAY-011 — Statement monthly-date inheritance

Core · target · **partial** · From PAY-001

**Requirement.** Statement monthly-date inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The customer statement uses the fixed-monthly period-end issue date, separate approval time and later-of-period/approval due-date basis, without moving preexisting dates.

**Evidence.** `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`
**Gap.** External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold.

#### PAY-012 — Internal uninvoiced-work reminder

Core · target · **partial** · From PAY-001 · Cites BASE-AUDIT-001, BASE-DATA-003

**Requirement.** Internal uninvoiced-work reminder supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A scheduled internal Activity reminder records completed work still awaiting invoice preparation or approval once per job and branch-local date, on the first pass at or after 08:00; approval and erasure are rechecked atomically.
2. This reminder sends no customer or office email.

**Evidence.** `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`
**Gap.** External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold.

#### PAY-013 — Progress invoice stages

Core · target · **partial** · From PAY-001 · Cites BASE-ROLE-001

**Requirement.** Progress invoice stages supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Existing invoice preparers explicitly name each stage and enter its priced lines for an accepted quoted job.
2. Every stage is a distinct draft under the existing exact-revision human approval, PO, terms, tax and correction controls.
3. Earlier stages require approval before the next stage; names are unique within the job.
4. The first stage freezes the accepted gross contract cap.
5. Drafts and corrections reserve their current gross amounts within that cap, and a final stage requires a completed job and exactly the remaining amount including tax.
6. Only a final stage export finishes invoicing the completed job.
7. No percentage, material, expense, discount allocation or charge is inferred; the preparer reconciles the explicit stage lines, including agreed discounts, against the accepted scope.
8. Job-held deposits attach only to the final stage.

**Evidence.** `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`
**Gap.** External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold.

#### PAY-014 — Progress-invoice changed-scope reconciliation

Core · target · **partial** · From PAY-001 · Cites BASE-ROLE-001

**Requirement.** Progress-invoice changed-scope reconciliation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Changed progress-invoice scope is reconciled explicitly before further stages; no automatic allocation silently reprices the accepted work.

**Evidence.** `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`
**Gap.** External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold.

#### PAY-015 — Field invoice draft permission

Core · target · **partial** · From PAY-001 · Cites BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Field invoice draft permission supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. *Field invoice custody (RL-105):* a signed-in Owner without branch limits explicitly allows or withdraws invoice preparation and approved invoice presentation for one active technician linked to their current sign-in.
2. This separate permission is off by default and grants no field price-book authority, approval, sending, payment, custom-role or integration-token authority.
3. A technician requests a draft only for their currently assigned, uncancelled visit on a completed job.
4. The phone's existing ordered outbox keeps the visit, capture time, actor and command identity through offline reload and a lost response; reconnection prepares one office-review draft without an external message.
5. Current authority and assignment are rechecked on execution and replay.
6. An unapproved draft reveals no prices to the technician.
7. This field permission permits preparation and presentation of the exact approved customer-facing revision, with FIELD-001’s common retention and reconnect fences; it supplies no approval, sending or collection authority.

**Evidence.** `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`
**Gap.** External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold.

#### PAY-016 — Offline approved-invoice presentation

Core · target · **partial** · From PAY-001 · Cites BASE-DATA-001, BASE-DATA-003, BASE-ROLE-001

**Requirement.** Offline approved-invoice presentation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. With that permission, the technician state and kept offline day include only the customer-facing fields of an exact approved invoice revision on their current assigned job: document identity, lines, approved totals, PO, issue and due dates and approval basis.
2. Costs, credentials, private accounting details and payment balances stay excluded.
3. An unapproved replacement does not replace the last approved revision.
4. The phone labels the kept time and inability to discover later changes while disconnected; reconnection hides a kept presentation until a fresh authority and approval read.
5. Sign-out, changed identity, withdrawal on fresh read and DATA-001, DATA-005, DATA-006, DATA-007, DATA-008's received erasure fences clear retained access through the existing offline custody.
6. An offline destination cannot discover a later withdrawal or erasure without reconnecting to trusted current state.
7. Restore supplies no session or permission to a different identity.
8. Customer-payment bearer authority follows PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 under RL-106.

**Evidence.** `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`
**Gap.** External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold.

#### PAY-002 — Card, ACH and wallet payments through Stripe

Core · target · **partial** · From PAY-002 · Cites BASE-AUDIT-001, BASE-OPS-003 · Register R-11

**Requirement.** Card, ACH and wallet payments through Stripe supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-002-operating-rules) retain the record formats and calculations. Owning-capability boundaries: COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018: assert each emailed receipt goes through the owner's provider (fake) with its provider outcome on the message, payment's timeline, Activity and export without secrets, and that any email not strictly transactional carries the CAN-SPAM unsubscribe link and postal address. REPORT-003 inheritance: confirmed payments update the aging report's open balances before this capability ships; assert the exact bucket and customer totals and invoice links in its flow. COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 inheritance: every receipt it emails goes through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`'s door with the same provider outcomes: one send attempt per message, recorded with the provider's answer and reference on the message, the payment's timeline, Activity and the business export without secrets; state changes only from authenticated provider callbacks; delivery is never claimed without the provider's event.

**Acceptance.**
1. A fixture pays one invoice by card and one by ACH (Stripe fake with webhooks), checks the card payment is paid at once, the ACH payment pending until the settlement event, and a failed ACH return reopens the balance; a card payment with a $15.00 tip records the tip for the visit's technician, untaxed, and the tip appears in the payroll export; the `REPORT-001` "Paid today" tile counts the card payment at once and the ACH payment only after its settlement event; the `REPORT-002, REPORT-004` sales-tax report counts the tax on the two paid invoices as collected.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
3. Any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address.
4. RL-106 replaces owner-only consumption with the customer-scoped payment door; the existing owner-only test slice does not complete that target.

**Evidence.** `tests/api/payments.test.mjs` › Stripe-hosted card and ACH settle once (settlement and return, fees, tips and payroll, dashboard, collected tax, aging, receipt and provider timeline, Activity and export); rejects invalid callbacks and unauthorized requests (no effects, reconnect fence, uncertain Checkout replay); payment custody follows customer merge and undo and erasure (financial totals retained, provider and session references removed); `tests/browser/receivables.spec.ts` › confirmed payment and ACH return (Today, aging, tax, invoice and property-history screens at 1440 and 390); `tests/portable.mjs` › PAY-002 real archive passed (actual export and fresh import of confirmed card funds, pending ACH and an uncertain Checkout reservation; exact balances and aging; attributable Activity and retained payment timelines; excluded keys, hosted URLs and private Checkout sessions; old sign-in and callback refusal; no provider POST across import, setup, startup, replay or reconnection; restored unresolved reservations still refuse duplicates; anonymous financial effects and trusted later-erasure journal protection)
**Gap.** Only test-mode owner-created invoice Checkout exists. Customer-scoped hosted access required by RL-106, customer-selected tips, wallet proof, deposits and agreement payments, surcharge/disclosure, uncertain Checkout reconciliation remain. Live activation is disabled; RL-106 resolves policy authority without proving the customer door.

#### PAY-017 — Hosted test-payment reservation

Core · target · **partial** · From PAY-002 · Cites BASE-DATA-001, BASE-OPS-003, BASE-SECRET-001 · Register R-11

**Requirement.** Hosted test-payment reservation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The signed-in unscoped owner connects Stripe test mode with payment connect action, which requires Stripe’s balance API to confirm the key is not live; payment checkout action reserves an approved USD invoice payment before one fixed-endpoint Stripe Checkout attempt.
2. Card-hosted entry and ACH never pass account or card numbers to Glove.
3. A returned hosted URL is bearer material, shown only in the first response, excluded from records, saved outcomes and archives; a replay recovers the reservation without another attempt.
4. The public the documented product door acknowledgement never treats a redirect or its query parameters as payment confirmation.
5. Restored installations must reconnect their excluded private keys before another reservation is allowed.
6. Checkout facts expose only an irreversible reference hash; the provider session reference stays in the private archive-excluded attempt store.
7. Unresolved requests block a second request for that invoice.

**Evidence.** `tests/api/payments.test.mjs` › Stripe-hosted card and ACH settle once (settlement and return, fees, tips and payroll, dashboard, collected tax, aging, receipt and provider timeline, Activity and export); rejects invalid callbacks and unauthorized requests (no effects, reconnect fence, uncertain Checkout replay); payment custody follows customer merge and undo and erasure (financial totals retained, provider and session references removed); `tests/browser/receivables.spec.ts` › confirmed payment and ACH return (Today, aging, tax, invoice and property-history screens at 1440 and 390); `tests/portable.mjs` › PAY-002 real archive passed (actual export and fresh import of confirmed card funds, pending ACH and an uncertain Checkout reservation; exact balances and aging; attributable Activity and retained payment timelines; excluded keys, hosted URLs and private Checkout sessions; old sign-in and callback refusal; no provider POST across import, setup, startup, replay or reconnection; restored unresolved reservations still refuse duplicates; anonymous financial effects and trusted later-erasure journal protection)
**Gap.** Only test-mode owner-created invoice Checkout exists. Customer-scoped hosted access required by RL-106, customer-selected tips, wallet proof, deposits and agreement payments, surcharge/disclosure, uncertain Checkout reconciliation remain. Live activation is disabled; RL-106 resolves policy authority without proving the customer door.

#### PAY-018 — Provider settlement and payment custody

Core · target · **partial** · From PAY-002 · Cites BASE-AUDIT-001, BASE-OPS-003 · Register R-11

**Requirement.** Provider settlement and payment custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Payment receipt action is an explicit Owner or Office transactional email to the on-record accounts-payable or customer address through COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018.
2. Webhooks verify the raw-body Stripe signature and five-minute freshness before parsing; current intent retrieval verifies the connection, currency, gross amount, payment identity and test mode.
3. Confirmed effects reduce aging and feed paid-today and collected-tax totals, with tips apart; a failed charge or ACH return reverses them.
4. Each tip splits equally in exact cents among the completed visits’ distinct technicians (ID order receives remainder cents), and joins approved payroll weeks only.
5. Test mode is named in payment facts, receipts, aging and collected-tax basis; these are not live funds.
6. Provider outcomes and receipts read on the payment timeline, Activity, conversation stream and business export.
7. Property history includes each payment and its current provider state.
8. Duplicate-customer merge and undo carry payment ownership with the invoice.

**Evidence.** `tests/api/payments.test.mjs` › Stripe-hosted card and ACH settle once (settlement and return, fees, tips and payroll, dashboard, collected tax, aging, receipt and provider timeline, Activity and export); rejects invalid callbacks and unauthorized requests (no effects, reconnect fence, uncertain Checkout replay); payment custody follows customer merge and undo and erasure (financial totals retained, provider and session references removed); `tests/browser/receivables.spec.ts` › confirmed payment and ACH return (Today, aging, tax, invoice and property-history screens at 1440 and 390); `tests/portable.mjs` › PAY-002 real archive passed (actual export and fresh import of confirmed card funds, pending ACH and an uncertain Checkout reservation; exact balances and aging; attributable Activity and retained payment timelines; excluded keys, hosted URLs and private Checkout sessions; old sign-in and callback refusal; no provider POST across import, setup, startup, replay or reconnection; restored unresolved reservations still refuse duplicates; anonymous financial effects and trusted later-erasure journal protection)
**Gap.** Only test-mode owner-created invoice Checkout exists. Customer-scoped hosted access required by RL-106, customer-selected tips, wallet proof, deposits and agreement payments, surcharge/disclosure, uncertain Checkout reconciliation remain. Live activation is disabled; RL-106 resolves policy authority without proving the customer door.

#### PAY-019 — Payment ownership and erasure

Core · target · **partial** · From PAY-002 · Cites BASE-DATA-003, BASE-OPS-003 · Register R-11

**Requirement.** Payment ownership and erasure supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. After erasure, anonymous financial effects remain and provider and session references are removed.

**Evidence.** `tests/api/payments.test.mjs` › Stripe-hosted card and ACH settle once (settlement and return, fees, tips and payroll, dashboard, collected tax, aging, receipt and provider timeline, Activity and export); rejects invalid callbacks and unauthorized requests (no effects, reconnect fence, uncertain Checkout replay); payment custody follows customer merge and undo and erasure (financial totals retained, provider and session references removed); `tests/browser/receivables.spec.ts` › confirmed payment and ACH return (Today, aging, tax, invoice and property-history screens at 1440 and 390); `tests/portable.mjs` › PAY-002 real archive passed (actual export and fresh import of confirmed card funds, pending ACH and an uncertain Checkout reservation; exact balances and aging; attributable Activity and retained payment timelines; excluded keys, hosted URLs and private Checkout sessions; old sign-in and callback refusal; no provider POST across import, setup, startup, replay or reconnection; restored unresolved reservations still refuse duplicates; anonymous financial effects and trusted later-erasure journal protection)
**Gap.** Only test-mode owner-created invoice Checkout exists. Customer-scoped hosted access required by RL-106, customer-selected tips, wallet proof, deposits and agreement payments, surcharge/disclosure, uncertain Checkout reconciliation remain. Live activation is disabled; RL-106 resolves policy authority without proving the customer door.

#### PAY-020 — Tip preferences and receipt recovery

Core · target · **partial** · From PAY-002 · Cites BASE-OPS-003 · Register R-11

**Requirement.** Tip preferences and receipt recovery supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner sets 1–20 distinct fixed-dollar tip choices, including zero, with payment preferences action; new connections default to zero only.
2. Preference edits affect future requests and keep existing reservations unchanged.
3. A rejected receipt leaves the payment confirmed; replay never sends again, and the office can explicitly send a new receipt after correction.

**Evidence.** `tests/api/payments.test.mjs` › Stripe-hosted card and ACH settle once (settlement and return, fees, tips and payroll, dashboard, collected tax, aging, receipt and provider timeline, Activity and export); rejects invalid callbacks and unauthorized requests (no effects, reconnect fence, uncertain Checkout replay); payment custody follows customer merge and undo and erasure (financial totals retained, provider and session references removed); `tests/browser/receivables.spec.ts` › confirmed payment and ACH return (Today, aging, tax, invoice and property-history screens at 1440 and 390); `tests/portable.mjs` › PAY-002 real archive passed (actual export and fresh import of confirmed card funds, pending ACH and an uncertain Checkout reservation; exact balances and aging; attributable Activity and retained payment timelines; excluded keys, hosted URLs and private Checkout sessions; old sign-in and callback refusal; no provider POST across import, setup, startup, replay or reconnection; restored unresolved reservations still refuse duplicates; anonymous financial effects and trusted later-erasure journal protection)
**Gap.** Only test-mode owner-created invoice Checkout exists. Customer-scoped hosted access required by RL-106, customer-selected tips, wallet proof, deposits and agreement payments, surcharge/disclosure, uncertain Checkout reconciliation remain. Live activation is disabled; RL-106 resolves policy authority without proving the customer door.

#### PAY-003 — Tap to Pay and card readers on site

Core · target · **missing** · Cites BASE-AUDIT-001 · Register R-11

**Requirement.** Technicians take card-present payments on the phone (Tap to Pay on iPhone and Android through Stripe Terminal) or a paired Stripe reader, with the tip choices of `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020`, the receipt texted or emailed and the payment on the job before they leave. The [operating rules](docs/service-work-rules.md#pay-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The `FIELD-005` device journey takes a Tap to Pay test payment on a $412.00 invoice with an 18% tip chosen on the phone's tip screen and the receipt sent by text, then a second test payment with no tip and the receipt by email.
2. It finds both payments on the job, the $74.16 tip recorded for the visit's technician outside revenue and sales tax, and each receipt on the timeline with the channel the customer chose and the provider's delivery outcome.

**Evidence.** None.
**Gap.** no payments or native app

#### PAY-004 — Partial payments, balances, refunds and credits

Core · target · **partial** · From PAY-004 · Cites BASE-AUDIT-001

**Requirement.** Partial payments, balances, refunds and credits supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-004-operating-rules) retain the record formats and calculations. Owning-capability boundaries: COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018: assert each emailed receipt goes through the owner's provider (fake) with its provider outcome on the message, payment's timeline, Activity and export without secrets, and that any email not strictly transactional carries the CAN-SPAM unsubscribe link and postal address. AGENT-008, AGENT-016 inheritance: the morning brief lists overdue invoices (due date passed, balance unpaid) with their invoice link and a proposed action, asserted in the AGENT-008, AGENT-016 flow. REPORT-003 inheritance: allocations, credits, overpayments and refunds update the aging report's open balances before this capability ships; assert the exact bucket and customer totals and invoice links in its flow. COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 inheritance: every receipt it emails goes through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`'s door with the same provider outcomes: one send attempt per message, recorded with the provider's answer and reference on the message, the payment's timeline, Activity and the business export without secrets; state changes only from authenticated provider callbacks; delivery is never claimed without the provider's event.

**Acceptance.**
1. A fixture pays an invoice in three parts (one by check), refunds $50 to the card (Stripe fake), and checks the invoice, customer balance and refund record, and that the `REPORT-001` receivables tile equals the open balances after each step.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
3. Any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address.

**Evidence.** `tests/api/payments.test.mjs`, `tests/browser/receivables.spec.ts`, `tests/api/customer-quotes.test.mjs`
**Gap.** PAY-009 inherits keyed/saved-method entry obligations The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture pays an invoice in three parts (one by check), refunds $50 to the card (Stripe fake), and checks the invoice, customer balance and refund record, and that the REPORT-001 receivables tile equals the open balances after each step.; point 2 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.; point 3 — Any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PAY-021 — Receipt and customer-credit allocation

Core · target · **partial** · From PAY-004

**Requirement.** Receipt and customer-credit allocation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Payment checkout action accepts an optional positive installment amount up to the invoice’s unpaid balance; the owner-only, show-once test Checkout boundary of PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 remains.
2. The signed-in office or owner records cash/check receipts (payment record action) with a reference; these are staff records, never provider-confirmed claims.
3. Overpayments remain customer credit on their invoice.
4. Payment allocate action explicitly moves available credit to an unpaid invoice of the same customer, currency and branch; it never transfers money.
5. The owner records a reasoned non-cash credit (payment credit action).
6. Invoice/customer balances (customer and invoice balances), aging, Today’s receivables and the owner’s linked overdue brief use the same cent ledger.
7. Stripe test revenue/tips remain separate from office cash/check records.
8. Transactional receipts for payments and refunds use COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 with actual delivery facts.

**Evidence.** `tests/api/payments.test.mjs`, `tests/browser/receivables.spec.ts`, `tests/api/customer-quotes.test.mjs`
**Gap.** PAY-009 inherits keyed/saved-method entry obligations The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Payment checkout action accepts an optional positive installment amount up to the invoice’s unpaid balance; the owner-only, show-once test Checkout boundary of PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 remains.; point 2 — The signed-in office or owner records cash/check receipts (payment record action) with a reference; these are staff records, never provider-confirmed claims.; point 3 — Overpayments remain customer credit on their invoice.; point 4 — Payment allocate action explicitly moves available credit to an unpaid invoice of the same customer, currency and branch; it never transfers money.; point 5 — The owner records a reasoned non-cash credit (payment credit action).; point 6 — Invoice/customer balances (customer and invoice balances), aging, Today’s receivables and the owner’s linked overdue brief use the same cent ledger.; point 7 — Stripe test revenue/tips remain separate from office cash/check records.; point 8 — Transactional receipts for payments and refunds use COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 with actual delivery facts. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PAY-022 — Receipt and downstream payment inheritance

Core · target · **partial** · From PAY-004

**Requirement.** Receipt and downstream payment inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. QUOTE-003, QUOTE-014 inherits job-held deposits and final-invoice allocation; PAY-009 inherits keyed/saved-method entry without bypassing these allocation/refund rules.

**Evidence.** `tests/api/payments.test.mjs`, `tests/browser/receivables.spec.ts`, `tests/api/customer-quotes.test.mjs`
**Gap.** PAY-009 inherits keyed/saved-method entry obligations The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — QUOTE-003, QUOTE-014 inherits job-held deposits and final-invoice allocation; PAY-009 inherits keyed/saved-method entry without bypassing these allocation/refund rules. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PAY-023 — Original-method refunds

Core · target · **partial** · From PAY-004 · Cites BASE-SECRET-001

**Requirement.** Original-method refunds supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Only the signed-in owner refunds (payment refund action), at most the original confirmed amount less earlier confirmed or unresolved refunds, using the original method.
2. Refund amount is invoice principal and optional tip is separately bounded by the remaining original tip; a tip-only refund changes tips/payroll, never invoice balance or tax.
3. A subsequent return reverses only the remaining principal/tip, not a second copy of a prior refund.
4. Cash/check refunds record money already returned; Stripe refunds reserve durably before one provider attempt with an idempotency key.
5. Each refund has its own payment-linked record; pending/unknown refunds have no balance effect and are never automatically resent.
6. A pending provider reference can be read again (payment refund refresh action); only provider-confirmed success reopens a balance.

**Evidence.** `tests/api/payments.test.mjs`, `tests/browser/receivables.spec.ts`, `tests/api/customer-quotes.test.mjs`
**Gap.** PAY-009 inherits keyed/saved-method entry obligations The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Only the signed-in owner refunds (payment refund action), at most the original confirmed amount less earlier confirmed or unresolved refunds, using the original method.; point 2 — Refund amount is invoice principal and optional tip is separately bounded by the remaining original tip; a tip-only refund changes tips/payroll, never invoice balance or tax.; point 3 — A subsequent return reverses only the remaining principal/tip, not a second copy of a prior refund.; point 4 — Cash/check refunds record money already returned; Stripe refunds reserve durably before one provider attempt with an idempotency key.; point 5 — Each refund has its own payment-linked record; pending/unknown refunds have no balance effect and are never automatically resent.; point 6 — A pending provider reference can be read again (payment refund refresh action); only provider-confirmed success reopens a balance. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PAY-005 — Payment reminders that stop at zero

Core · target · **partial** · Cites BASE-MAIL-001, BASE-ROLE-001 · Rules D-1 · Register R-9

**Requirement.** The owner sets a reminder schedule (before due, on due, after due); Glove sends it by text and email with the pay link, stops the moment the balance is zero or the invoice is disputed, and shows each invoice's reminder state. Customer-payment links follow PAY-002, PAY-017, PAY-018, PAY-019, PAY-020’s customer-scoped authority under RL-106. The [operating rules](docs/service-work-rules.md#pay-005-operating-rules) retain the record formats and calculations. Owning-capability boundaries: REPORT-003 inheritance: each invoice in the aging report displays its actual reminder state asserted in the reminder flow.

**Acceptance.**
1. A fixture advances a clock through the schedule for two invoices, pays one after the first reminder, and checks it received nothing more.

**Evidence.** `tests/api/reminders.test.mjs`, `tests/browser/reminders.spec.ts`
**Gap.** Customer payment-link generation/inclusion remains unbuilt under PAY-002 and RL-106; current reminder emails contain no payment link. SMS under COMM-002 and owner schedule/dispute controls in Settings and invoices remain. Live provider proof is unrun. RL-102 resolves shared consent and quiet-hours policy; RL-106 resolves customer-side payment authority.

#### PAY-006 — Consumer financing through Wisetack

Core · target · **partial** · From PAY-006 · Cites BASE-DATA-001, BASE-SECRET-001 · Register R-12

**Requirement.** Consumer financing through Wisetack supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture applies for financing on a $9,800 quote (provider fake), approves, funds, and checks the invoice is paid by the financing payout.
2. The signed-in unscoped owner configures only Wisetack's fixed test endpoint (financing connect action), an owner-only private auth token, merchant reference and minimum amount.
3. For a current price-approved owner-issued quote link, the customer chooses the exact work, enters an expected completion date and explicitly consents before requesting an application.
4. Glove sends only the chosen USD amount, completion date, generic service purpose and opaque purchase reference to Wisetack; no name, contact, address, SSN, income or other credit data is forwarded.
5. The provider-hosted application link is returned once, never retained in records, saved outcomes, logs, exports or archives; personal and credit information is entered only on Wisetack.
6. A durable reservation precedes the one provider request; an unknown outcome is never automatically resent.
7. The owner explicitly refreshes from Wisetack's authenticated transaction read door; the quote shows only its own provider status and reported APR/month ranges, labelled provider facts with final terms on Wisetack.
8. Approval is not money.

**Evidence.** `tests/api/customer-quotes.test.mjs`
**Gap.** Live merchant setup gates production activation only; fake-provider and browser evidence is not live financing proof. RL-107 resolves the explicit customer-choice, owner-issued quote-link policy hold; status remains partial.

#### PAY-024 — Financing funding and custody

Core · target · **partial** · From PAY-006 · Cites BASE-AUDIT-001 · Register R-12

**Requirement.** Financing funding and custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-006-operating-rules) retain the record formats and calculations. Owning-capability boundaries: COMM-006, COMM-022, COMM-023, COMM-024, COMM-025 inherits the same isolation, explicit consent, minimal data and provider-outcome rules before financing appears in the hub.

**Acceptance.**
1. Funding is allocated only when the full provider-reported amount matches the winning signed chosen-document hash and exact job; it is held on that job until its invoice is prepared.
2. Duplicate reads create no duplicate payment.
3. Wisetack's fee stays separate; original-method refunds use PAY-004, PAY-021, PAY-022, PAY-023's reservation and separate linked refund record.
4. Activity, property history and export keep only whitelisted outcomes and references; DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erases the application and retains anonymous financial totals.
5. Glove never underwrites or lends.
6. Production activation remains disabled; a live merchant account is needed only to activate a future live connection.

**Evidence.** `tests/api/customer-quotes.test.mjs`
**Gap.** Live merchant setup gates production activation only; fake-provider and browser evidence is not live financing proof. RL-107 resolves the explicit customer-choice, owner-issued quote-link policy hold; status remains partial.

#### PAY-007 — Payouts and reconciliation

Core · target · **partial** · From PAY-007 · Cites BASE-AUDIT-001

**Requirement.** Payouts and reconciliation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture replays a payout of six payments, one refund and fees (Stripe fake) and checks the payout reconciles to the cent, with a deliberately missing payment listed as unmatched; an instant payout (Stripe fake) with its fee reconciles the same way.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
3. The owner inspects a USD Stripe test payout (payout reconcile action).
4. Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longer/incomplete list refuses reconciliation) and match confirmed payment/refund references, gross cents and fees; missing, unconfirmed, wrong-amount, wrong-fee/currency and unsupported sources are named.
5. Bank amount plus any payout fee must equal source net exactly, and only provider-paid payouts reconcile.
6. An unavailable payout fee refuses reconciliation; zero is never inferred.
7. Stripe does not attribute source payments to manual payouts.
8. Those require an explicit owner-reviewed books allocation (payout allocate action), never claimed as Stripe source attribution; unreviewed sources remain unmatched.

**Evidence.** `tests/api/payments.test.mjs`, `tests/browser/receivables.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture replays a payout of six payments, one refund and fees (Stripe fake) and checks the payout reconciles to the cent, with a deliberately missing payment listed as unmatched; an instant payout (Stripe fake) with its fee reconciles the same way.; point 2 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.; point 3 — The owner inspects a USD Stripe test payout (payout reconcile action).; point 4 — Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longer/incomplete list refuses reconciliation) and match confirmed payment/refund references, gross cents and fees; missing, unconfirmed, wrong-amount, wrong-fee/currency and unsupported sources are named.; point 5 — Bank amount plus any payout fee must equal source net exactly, and only provider-paid payouts reconcile.; point 6 — An unavailable payout fee refuses reconciliation; zero is never inferred.; point 7 — Stripe does not attribute source payments to manual payouts.; point 8 — Those require an explicit owner-reviewed books allocation (payout allocate action), never claimed as Stripe source attribution; unreviewed sources remain unmatched. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PAY-025 — Cash and check deposit batches

Core · target · **partial** · From PAY-007 · Cites BASE-DATA-003

**Requirement.** Cash and check deposit batches supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Cash/check deposits (payment deposit batch action) group 1–100 confirmed same-currency/branch records once, net of prior recorded refunds, as staff-recorded deposits without a bank-confirmation claim.
2. Only the owner reads provider-wide payout and fee records; the office sees its branch's cash/check batches.
3. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 removes erased customer references from shared payout source detail while retaining anonymous aggregate bank history.

**Evidence.** `tests/api/payments.test.mjs`, `tests/browser/receivables.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Cash/check deposits (payment deposit batch action) group 1–100 confirmed same-currency/branch records once, net of prior recorded refunds, as staff-recorded deposits without a bank-confirmation claim.; point 2 — Only the owner reads provider-wide payout and fee records; the office sees its branch's cash/check batches.; point 3 — DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 removes erased customer references from shared payout source detail while retaining anonymous aggregate bank history. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PAY-026 — Instant payout preview and execution

Core · target · **partial** · From PAY-007 · Cites BASE-SECRET-001

**Requirement.** Instant payout preview and execution supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. For Instant Payouts, the owner records their account-specific fee schedule (basis points and minimum, labelled owner-recorded and not verified by Glove); a preview checks an existing Stripe debit card's instant eligibility and funds, computes the half-up fee, and requires selected source net to equal the proposed bank amount plus that fee.
2. The owner explicitly confirms both displayed amounts within ten minutes; source availability, current connection, schedule, eligibility and funds are checked again.
3. A durable reservation and Stripe idempotency key precede one request.
4. Replay never resends an unknown outcome.
5. Sources cannot be allocated to another payout.
6. Reconciliation checks the actual payout debit, source allocation and actual fee against the confirmed preview; a difference stays unmatched.

**Evidence.** `tests/api/payments.test.mjs`, `tests/browser/receivables.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — For Instant Payouts, the owner records their account-specific fee schedule (basis points and minimum, labelled owner-recorded and not verified by Glove); a preview checks an existing Stripe debit card's instant eligibility and funds, computes the half-up fee, and requires selected source net to equal the proposed bank amount plus that fee.; point 2 — The owner explicitly confirms both displayed amounts within ten minutes; source availability, current connection, schedule, eligibility and funds are checked again.; point 3 — A durable reservation and Stripe idempotency key precede one request.; point 4 — Replay never resends an unknown outcome.; point 5 — Sources cannot be allocated to another payout.; point 6 — Reconciliation checks the actual payout debit, source allocation and actual fee against the confirmed preview; a difference stays unmatched. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PAY-008 — Saved payment methods and autopay with consent

Core · target · **partial** · From PAY-008 · Register R-11

**Requirement.** Saved payment methods and autopay with consent supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-008-operating-rules) retain the record formats and calculations. Recorded decisions: RL-15.

**Acceptance.**
1. A fixture saves a card with consent, charges an agreement renewal, fails the next charge (Stripe fake) and checks the update-link message and the retained authorization record.
2. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.
3. When the customer chose autopay, the invoice is charged to the saved method under `PAY-008, PAY-027, PAY-028, PAY-029, PAY-030`, with the receipt sent, and a failed charge follows `PLAN-003`'s dunning. a flow test runs two series for three months (Stripe fake): a per-visit series with one visit in month 1, two in month 2 (a third skipped) and none in month 3, and a quarterly commercial PM job billed $240.00 fixed monthly on autopay; it checks exactly three per-visit invoices with each visit's lines, exactly three $240.00 invoices dated the last day of each month, each charged once, with one failed charge entering dunning and recovered; an on-close series invoices once when the job closes.
4. This policy establishes no payment-network or legal compliance.

**Evidence.** `tests/api/recurring-billing.test.mjs`
**Gap.** Customer-side saved-card setup and bank authorization; automatic agreement renewals and recurring charges; receipts, failed-charge update links and PLAN-003 dunning with recovery; per-visit and on-close charge proof; and customer-facing 1440 and 390 journeys remain unbuilt. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. PAY-008 stays PARTIAL.

#### PAY-027 — Saved-card permission versions

Core · target · **partial** · From PAY-008 · Cites BASE-DATA-003, BASE-ROLE-001 · Register R-11

**Requirement.** Saved-card permission versions supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Only a signed-in Owner without branch limits may record customer permission or explicitly execute this preparatory payment flow.
2. Permission is an Owner-recorded account of the customer’s consent, not customer authentication or proof of consent obtained through Glove.
3. Retain its source, exact authorization wording, recorded time, recording Owner, customer, verified saved test-card reference, fixed-monthly rule identity and revision, cadence, maximum USD amount, and active or withdrawn state.
4. A replacement permission creates a distinct version and does not overwrite the earlier record; withdrawal remains attributable and timed.
5. The permission covers only the named card and fixed-monthly rule revision within the stated maximum.
6. Withdrawal, paused billing or a changed card, rule revision, cadence or maximum refuses further requests until fresh permission is recorded.
7. Withdrawal does not erase the actual outcome of an already-authorized request in flight.
8. Keep authorization evidence Owner-only and exclude raw payment data and credentials.

**Evidence.** `tests/api/recurring-billing.test.mjs`
**Gap.** Customer-side saved-card setup and bank authorization; automatic agreement renewals and recurring charges; receipts, failed-charge update links and PLAN-003 dunning with recovery; per-visit and on-close charge proof; and customer-facing 1440 and 390 journeys remain unbuilt. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. PAY-008 stays PARTIAL.

#### PAY-028 — Exact-invoice saved-card execution

Core · target · **partial** · From PAY-008 · Cites BASE-DATA-001, BASE-ROLE-001 · Register R-11

**Requirement.** Exact-invoice saved-card execution supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Each full unpaid approved invoice requires the Owner’s explicit confirmation of its displayed invoice, card and USD amount.
2. Confirmation does not authorize another invoice or a retry.
3. An agent’s charge carries money, and the company’s policy decides it; restored state grants no new charge authority.
4. Provider requests are test mode only; live charges are refused.
5. Recheck current Owner authority, customer and card association, provider-verified card attachment, active permission, exact rule revision, running billing state, invoice approval, unpaid amount and cap before reserving one provider attempt.
6. Existing durable reservation, idempotency and authenticated settlement boundaries apply.
7. An unknown attempt blocks a further attempt; a decline does not trigger an automatic retry.
8. Refusals identify the required correction without exposing credentials or another customer’s records: “Owner access required”; “Test mode only; live charges are unavailable”; “Fresh customer permission is required for this card and billing rule”; “Billing is paused; no charge was requested”; “Approve the invoice before charging”; “The invoice must be fully unpaid”; “The invoice exceeds the authorized USD maximum”; or “A prior payment attempt is unresolved; no further charge was requested”, as applicable.

**Evidence.** `tests/api/recurring-billing.test.mjs`
**Gap.** Customer-side saved-card setup and bank authorization; automatic agreement renewals and recurring charges; receipts, failed-charge update links and PLAN-003 dunning with recovery; per-visit and on-close charge proof; and customer-facing 1440 and 390 journeys remain unbuilt. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. PAY-008 stays PARTIAL.

#### PAY-029 — Saved-card refusal has no financial effect

Core · target · **partial** · From PAY-008 · Register R-11

**Requirement.** Saved-card refusal has no financial effect supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A refused request makes no payment-provider request and changes no invoice balance.

**Evidence.** `tests/api/recurring-billing.test.mjs`
**Gap.** Customer-side saved-card setup and bank authorization; automatic agreement renewals and recurring charges; receipts, failed-charge update links and PLAN-003 dunning with recovery; per-visit and on-close charge proof; and customer-facing 1440 and 390 journeys remain unbuilt. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. PAY-008 stays PARTIAL.

#### PAY-030 — Saved-card outcome and restore custody

Core · target · **partial** · From PAY-008 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-ROLE-001 · Register R-11

**Requirement.** Saved-card outcome and restore custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Record permission versions, withdrawal, explicit execution and provider outcomes with actor, time, permitted references and actual effect in Activity and business export.
2. Customer erasure covers personal consent evidence, saved-method associations, personal command results and timeline copies under DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 while preserving required anonymous financial totals.
3. Restore retains permitted business history but imports no provider credentials, creates no payment authority and resumes no charge.
4. Reconnection alone does not replace current permission or explicit invoice confirmation.
5. The trusted later erasure journal prevents an older backup from reviving erased evidence; an offline destination cannot discover a later erasure without that journal.

**Evidence.** `tests/api/recurring-billing.test.mjs`
**Gap.** Customer-side saved-card setup and bank authorization; automatic agreement renewals and recurring charges; receipts, failed-charge update links and PLAN-003 dunning with recovery; per-visit and on-close charge proof; and customer-facing 1440 and 390 journeys remain unbuilt. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. PAY-008 stays PARTIAL.

#### PAY-009 — Office charges a card by phone or on file

Core · target · **partial** · Cites BASE-AUDIT-001, BASE-ROLE-001, BASE-SECRET-001 · Register R-11

**Requirement.** The authorized office person collects an invoice, deposit, cancellation fee or agreement charge by provider-hosted keyed entry or a saved method carrying the customer’s matching authorization. Raw card data stays with Stripe, approved amounts remain explicit, and provider confirmation determines the recorded payment. The [operating rules](docs/service-work-rules.md#pay-009-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture signs in as Office and charges a keyed card against a $412.00 invoice and a saved card against a $500.00 deposit.
2. Each payment is recorded only on Stripe's confirmation event, with the Office person on the timeline.
3. A declined keyed card leaves the $412.00 balance open with the decline reason.
4. A saved card whose authorization covers only autopay is refused, with the pay link offered.
5. A Technician or Dispatcher without collection permission is refused through the command and HTTP; an agent’s collection call uses its sponsor’s permission and the company’s money policy.
6. No request body, record, log line or business export contains a card number.
7. A fixture at 390 px signed in as Owner charges a saved card on an invoice from the phone with no horizontal scroll.
8. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.

**Evidence.** `tests/api/payments.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** Keyed Stripe card entry and MOTO entitlement, saved-card deposits and other charge subjects, custom-role charges, saved bank authorization, optional tips and customer authentication or payment-link activation remain unbuilt. Existing test Checkout is owner-created; PAY-002/RL-106 requires the customer-scoped hosted door. RL-104 resolves saved-card authorization policy; no live activation is supplied.

#### PAY-031 — Saved-card authorization and one-attempt custody

Core · target · **partial** · From PAY-009, FIELD-008 · Cites BASE-AUDIT-001, BASE-OPS-003, BASE-ROLE-001

**Requirement.** Saved-card collection uses the customer’s matching current authorization, distinct from merely attaching a method. RL-104 governs the bounded saved-card charge; keyed entry and the complete office collection target remain PAY-009.

**Acceptance.**
1. The owner records source, wording and scope after the provider verifies that the test method is attached to the mapped customer; attachment alone grants no debit consent.
2. An Owner or Office person explicitly confirms the displayed method and amount under the matching current customer permission and role.
3. One reservation precedes the provider attempt; an unknown attempt blocks another until reconciled.
4. Method registration and withdrawal retain their actual actor and time in Activity.

**Evidence.** `tests/api/payments.test.mjs`, `tests/api/reminders.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** Old evidence covers the owner-recorded test-card and explicit desk-charge slice. This part carries its sources’ partial status; complete saved-card authorization, withdrawal and uncertain-attempt reconciliation need a fresh point-by-point judgment before promotion.

#### LEDGER-001 — QuickBooks Online sync

Core · target · **partial** · From LEDGER-001 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-004, BASE-SECRET-001 · Register R-13

**Requirement.** QuickBooks Online sync supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture syncs a customer, invoice, payment and refund (QuickBooks fake), replays the same sync without duplicates, receives a rejected item with its message, fixes and retries it, and reads a payment entered in QuickBooks back onto the invoice.
2. A property manager with two properties mapped as sub-customers posts each property's invoice to its own sub-customer under the parent, and one payment covering both is applied to both invoices.
3. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
4. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.
5. Only a signed-in unscoped Owner explicitly connects a QuickBooks sandbox company, verifies existing record IDs, confirms the pre-existing links, posts one record or reads one provider payment.
6. The access token is an installation secret, excluded from browser command storage, domain state, Activity, business exports and archives.
7. Same-company token replacement retains link identities; another company requires fresh links and confirmation.

**Evidence.** `tests/api/quickbooks.test.mjs` › “QuickBooks sync posts mapped customer, frozen invoice, payment and refund once; a rejected item is repaired and retried with secret-free history” proves verified existing customer and item mappings, customer and item updates, approved invoice transport, payment and full refund transport, replay on a later date without another post, repeated customer edits including return to an earlier value, provider rejection shown on the record, repair and retry, frozen branch tax of $11.32 and total $164.83 after settings changes, a 30% discount with $30.30 non-taxable and $35.49 taxable allocation, payment echo suppression, role refusal, disconnect, and attributable provider references in Activity and business export without the access token. › “QuickBooks property sub-customers receive separate invoices and one parent payment settles both without replay or unknown-send duplicates” proves two mapped sub-customers billed through their parent, each invoice posted to its property, one parent payment read back onto both invoice balances, exact collected tax, property history, readback replay, uncertain-send refusal and exact-reference reconciliation without another post. › “QuickBooks first-post review refuses unconfirmed links and duplicate invoices; provider facts survive owner withdrawal without allowing another send” proves explicit first-post confirmation, duplicate document refusal, linking an existing invoice, payment against that reference, and recording the authorized in-flight provider result after the initiating person loses Owner authority. The same journey interrupts and restarts the actual Worker with surviving D1, recovers one native approved USD invoice by exact provider reference without another post, refuses every changed sent field and total, unavailable answers, changed local content, unconfirmed links, stale versions, excluded roles and credentials, authority withdrawal and concurrent verification, and proves replay, wrong-company refusal, late-answer custody, erasure and secret-free Activity and export. `tests/browser/quickbooks.spec.ts` › “QuickBooks owner connects and maps existing records, repairs a rejected invoice, syncs once and reads its payment at 1440 and 390” proves the owner settings, verified maps, confirmation, rejection, explicit retry, replay, uncertain-send and interrupted-invoice reconciliation with honest mismatch and unavailable-provider refusals, and one parent payment displayed as the correct allocation on each property invoice in the built application at both widths. `tests/api/quickbooks.test.mjs` › “QuickBooks mapped fixed discount item and document discount preserve accepted taxable and non-taxable cents at the provider edge” proves the mapped negative discount item, document discount and frozen $15.59 tax with a $230.69 total. › “QuickBooks rejection messages follow customer export and erasure without credentials or a surviving personal outbox payload” proves access-token redaction, customer export, erasure during an in-flight provider refusal, suppression of late personal outcomes and post-erasure send refusal. Existing PLAN-005 date inheritance remains proved by `tests/api/recurring-billing.test.mjs` and `tests/browser/recurring-billing.spec.ts`.
**Gap.** Production OAuth authorization and token refresh, owner account activation, automatic customer and item discovery and the complete LEDGER-004 reviewed matching plan, creating approved unmatched records, Stripe fees and deposits, partial refunds, refund readback, changed imported payments, posted-invoice corrections, and interrupted-send recovery for other entity kinds remain unbuilt or unproved. Live automated-sales-tax jurisdiction and taxable-basis reconciliation remain unverified. Only sandbox companies with manually verified existing records are supported. The owner must authorize the production Intuit app and company after production connection support ships; no live provider call or activation is claimed. LEDGER-001 remains PARTIAL.

#### LEDGER-005 — Verified QuickBooks tax and property links

Core · target · **partial** · From LEDGER-001 · Cites BASE-DATA-004, BASE-SECRET-001 · Register R-13

**Requirement.** Verified QuickBooks tax and property links supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Each mapped sales item retains its existing income account; optional class and department references and the transaction tax code are verified against that company.
2. Parent-billed properties must be actual sub-customers of their mapped parent.
3. An existing invoice number refuses creation until the owner links the matching customer, number and total.

**Evidence.** `tests/api/quickbooks.test.mjs` › “QuickBooks sync posts mapped customer, frozen invoice, payment and refund once; a rejected item is repaired and retried with secret-free history” proves verified existing customer and item mappings, customer and item updates, approved invoice transport, payment and full refund transport, replay on a later date without another post, repeated customer edits including return to an earlier value, provider rejection shown on the record, repair and retry, frozen branch tax of $11.32 and total $164.83 after settings changes, a 30% discount with $30.30 non-taxable and $35.49 taxable allocation, payment echo suppression, role refusal, disconnect, and attributable provider references in Activity and business export without the access token. › “QuickBooks property sub-customers receive separate invoices and one parent payment settles both without replay or unknown-send duplicates” proves two mapped sub-customers billed through their parent, each invoice posted to its property, one parent payment read back onto both invoice balances, exact collected tax, property history, readback replay, uncertain-send refusal and exact-reference reconciliation without another post. › “QuickBooks first-post review refuses unconfirmed links and duplicate invoices; provider facts survive owner withdrawal without allowing another send” proves explicit first-post confirmation, duplicate document refusal, linking an existing invoice, payment against that reference, and recording the authorized in-flight provider result after the initiating person loses Owner authority. The same journey interrupts and restarts the actual Worker with surviving D1, recovers one native approved USD invoice by exact provider reference without another post, refuses every changed sent field and total, unavailable answers, changed local content, unconfirmed links, stale versions, excluded roles and credentials, authority withdrawal and concurrent verification, and proves replay, wrong-company refusal, late-answer custody, erasure and secret-free Activity and export. `tests/browser/quickbooks.spec.ts` › “QuickBooks owner connects and maps existing records, repairs a rejected invoice, syncs once and reads its payment at 1440 and 390” proves the owner settings, verified maps, confirmation, rejection, explicit retry, replay, uncertain-send and interrupted-invoice reconciliation with honest mismatch and unavailable-provider refusals, and one parent payment displayed as the correct allocation on each property invoice in the built application at both widths. `tests/api/quickbooks.test.mjs` › “QuickBooks mapped fixed discount item and document discount preserve accepted taxable and non-taxable cents at the provider edge” proves the mapped negative discount item, document discount and frozen $15.59 tax with a $230.69 total. › “QuickBooks rejection messages follow customer export and erasure without credentials or a surviving personal outbox payload” proves access-token redaction, customer export, erasure during an in-flight provider refusal, suppression of late personal outcomes and post-erasure send refusal. Existing PLAN-005 date inheritance remains proved by `tests/api/recurring-billing.test.mjs` and `tests/browser/recurring-billing.spec.ts`.
**Gap.** Production OAuth authorization and token refresh, owner account activation, automatic customer and item discovery and the complete LEDGER-004 reviewed matching plan, creating approved unmatched records, Stripe fees and deposits, partial refunds, refund readback, changed imported payments, posted-invoice corrections, and interrupted-send recovery for other entity kinds remain unbuilt or unproved. Live automated-sales-tax jurisdiction and taxable-basis reconciliation remain unverified. Only sandbox companies with manually verified existing records are supported. The owner must authorize the production Intuit app and company after production connection support ships; no live provider call or activation is claimed. LEDGER-001 remains PARTIAL.

#### LEDGER-006 — QuickBooks posting and readback recovery

Core · target · **partial** · From LEDGER-001 · Cites BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · Register R-13

**Requirement.** QuickBooks posting and readback recovery supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A durable reservation precedes each provider write; replay retains the provider identity, a definite rejection permits explicit retry after repair, and an uncertain or interrupted operation blocks another send.
2. The owner may reconcile an uncertain result only to an existing record whose returned fields match the exact reserved content; this performs no new post. For native approved USD invoices with confirmed existing same-company mappings, this explicit verification also recovers an interrupted durable sending operation, requiring the reserved fingerprint, every sent field and the frozen total to match. Age or timeout never proves failure or permits resending. Reconciliation changes no balance or retry authority; its attributable verified outcome survives a late answer to the original authorized post, while personal erasure discards late details.
3. The provider-confirmed tax and total must equal the frozen approved cents; a mismatch retains its reference for reconciliation.
4. Readback applies only exact, fully allocated USD payments to their mapped invoices and never counts Glove-origin payments twice.
5. Each allocation retains its invoice tax snapshot.
6. Provider effects already authorized in flight remain recorded if the initiating person loses authority; this grants no later send authority.
7. Full-invoice refunds preserve the approved tax and discount snapshot.
8. There is no automatic sync or retry, production connection, new customer payment authority or live-provider proof.

**Evidence.** `tests/api/quickbooks.test.mjs` › “QuickBooks sync posts mapped customer, frozen invoice, payment and refund once; a rejected item is repaired and retried with secret-free history” proves verified existing customer and item mappings, customer and item updates, approved invoice transport, payment and full refund transport, replay on a later date without another post, repeated customer edits including return to an earlier value, provider rejection shown on the record, repair and retry, frozen branch tax of $11.32 and total $164.83 after settings changes, a 30% discount with $30.30 non-taxable and $35.49 taxable allocation, payment echo suppression, role refusal, disconnect, and attributable provider references in Activity and business export without the access token. › “QuickBooks property sub-customers receive separate invoices and one parent payment settles both without replay or unknown-send duplicates” proves two mapped sub-customers billed through their parent, each invoice posted to its property, one parent payment read back onto both invoice balances, exact collected tax, property history, readback replay, uncertain-send refusal and exact-reference reconciliation without another post. › “QuickBooks first-post review refuses unconfirmed links and duplicate invoices; provider facts survive owner withdrawal without allowing another send” proves explicit first-post confirmation, duplicate document refusal, linking an existing invoice, payment against that reference, and recording the authorized in-flight provider result after the initiating person loses Owner authority. The same journey interrupts and restarts the actual Worker with surviving D1, recovers one native approved USD invoice by exact provider reference without another post, refuses every changed sent field and total, unavailable answers, changed local content, unconfirmed links, stale versions, excluded roles and credentials, authority withdrawal and concurrent verification, and proves replay, wrong-company refusal, late-answer custody, erasure and secret-free Activity and export. `tests/browser/quickbooks.spec.ts` › “QuickBooks owner connects and maps existing records, repairs a rejected invoice, syncs once and reads its payment at 1440 and 390” proves the owner settings, verified maps, confirmation, rejection, explicit retry, replay, uncertain-send and interrupted-invoice reconciliation with honest mismatch and unavailable-provider refusals, and one parent payment displayed as the correct allocation on each property invoice in the built application at both widths. `tests/api/quickbooks.test.mjs` › “QuickBooks mapped fixed discount item and document discount preserve accepted taxable and non-taxable cents at the provider edge” proves the mapped negative discount item, document discount and frozen $15.59 tax with a $230.69 total. › “QuickBooks rejection messages follow customer export and erasure without credentials or a surviving personal outbox payload” proves access-token redaction, customer export, erasure during an in-flight provider refusal, suppression of late personal outcomes and post-erasure send refusal. Existing PLAN-005 date inheritance remains proved by `tests/api/recurring-billing.test.mjs` and `tests/browser/recurring-billing.spec.ts`.
**Gap.** Production OAuth authorization and token refresh, owner account activation, automatic customer and item discovery and the complete LEDGER-004 reviewed matching plan, creating approved unmatched records, Stripe fees and deposits, partial refunds, refund readback, changed imported payments, posted-invoice corrections, and interrupted-send recovery for other entity kinds remain unbuilt or unproved. Live automated-sales-tax jurisdiction and taxable-basis reconciliation remain unverified. Only sandbox companies with manually verified existing records are supported. The owner must authorize the production Intuit app and company after production connection support ships; no live provider call or activation is claimed. LEDGER-001 remains PARTIAL.

#### LEDGER-007 — QuickBooks production and automation boundary

Core · target · **missing** · From LEDGER-001 · Cites BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · Register R-13

**Requirement.** QuickBooks production and automation boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. QuickBooks synchronization includes the complete target for production connection, automatic execution and recovery; preparatory owner commands grant no new customer payment authority.

**Evidence.** `tests/api/quickbooks.test.mjs` › “QuickBooks sync posts mapped customer, frozen invoice, payment and refund once; a rejected item is repaired and retried with secret-free history” proves verified existing customer and item mappings, customer and item updates, approved invoice transport, payment and full refund transport, replay on a later date without another post, repeated customer edits including return to an earlier value, provider rejection shown on the record, repair and retry, frozen branch tax of $11.32 and total $164.83 after settings changes, a 30% discount with $30.30 non-taxable and $35.49 taxable allocation, payment echo suppression, role refusal, disconnect, and attributable provider references in Activity and business export without the access token. › “QuickBooks property sub-customers receive separate invoices and one parent payment settles both without replay or unknown-send duplicates” proves two mapped sub-customers billed through their parent, each invoice posted to its property, one parent payment read back onto both invoice balances, exact collected tax, property history, readback replay, uncertain-send refusal and exact-reference reconciliation without another post. › “QuickBooks first-post review refuses unconfirmed links and duplicate invoices; provider facts survive owner withdrawal without allowing another send” proves explicit first-post confirmation, duplicate document refusal, linking an existing invoice, payment against that reference, and recording the authorized in-flight provider result after the initiating person loses Owner authority. The same journey interrupts and restarts the actual Worker with surviving D1, recovers one native approved USD invoice by exact provider reference without another post, refuses every changed sent field and total, unavailable answers, changed local content, unconfirmed links, stale versions, excluded roles and credentials, authority withdrawal and concurrent verification, and proves replay, wrong-company refusal, late-answer custody, erasure and secret-free Activity and export. `tests/browser/quickbooks.spec.ts` › “QuickBooks owner connects and maps existing records, repairs a rejected invoice, syncs once and reads its payment at 1440 and 390” proves the owner settings, verified maps, confirmation, rejection, explicit retry, replay, uncertain-send and interrupted-invoice reconciliation with honest mismatch and unavailable-provider refusals, and one parent payment displayed as the correct allocation on each property invoice in the built application at both widths. `tests/api/quickbooks.test.mjs` › “QuickBooks mapped fixed discount item and document discount preserve accepted taxable and non-taxable cents at the provider edge” proves the mapped negative discount item, document discount and frozen $15.59 tax with a $230.69 total. › “QuickBooks rejection messages follow customer export and erasure without credentials or a surviving personal outbox payload” proves access-token redaction, customer export, erasure during an in-flight provider refusal, suppression of late personal outcomes and post-erasure send refusal. Existing PLAN-005 date inheritance remains proved by `tests/api/recurring-billing.test.mjs` and `tests/browser/recurring-billing.spec.ts`.
**Gap.** Production OAuth connection, token refresh and automatic QuickBooks execution remain unbuilt. The delivered manually configured sandbox posting and inspection workflows stay with LEDGER-001, LEDGER-005 and LEDGER-006.

#### LEDGER-002 — Xero sync

Core · target · **partial** · From LEDGER-002 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-004, BASE-SECRET-001 · Register R-14

**Requirement.** Xero sync supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations. Recorded decisions: RL-16, RL-17, RL-18.

**Acceptance.**
1. The complete QuickBooks synchronization journey is repeated against the Xero provider edge with the Xero property representation.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
3. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.
4. Xero inspection is off by default.
5. Only a signed-in Owner without branch limits explicitly connects and reads the fixed Xero Accounting API.
6. Custom roles and integration tokens are refused.
7. The tenant identifier and OAuth access token remain installation secrets, outside domain state, Activity, business export and archives.

**Evidence.** `tests/api/xero.test.mjs`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/quickbooks.test.mjs`
**Gap.** Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL.

#### LEDGER-008 — QuickBooks-style hierarchy is not assumed in Xero

Core · target · **partial** · From LEDGER-002 · Cites BASE-DATA-004, BASE-SECRET-001 · Register R-14

**Requirement.** QuickBooks-style hierarchy is not assumed in Xero supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The connection is verified with a read; replacement for the same tenant retains its local connection identity.
2. Xero has no QuickBooks-style sub-customer; this preparatory slice makes no property allocation claim.

**Evidence.** `tests/api/xero.test.mjs`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/quickbooks.test.mjs`
**Gap.** Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL.

#### LEDGER-009 — Xero inspection custody

Core · target · **partial** · From LEDGER-002 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · Register R-14

**Requirement.** Xero inspection custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Inspection returns only whitelisted contact, item and sales-invoice summaries in the immediate response, not saved command outcomes or Activity bodies.
2. Provider errors refuse inspection, redirects are refused, and potentially incomplete lists refuse rather than claiming company-wide discovery.
3. Disconnect removes credentials; restored domain history grants no read or write access.
4. Inspection itself grants no posting, automatic execution, mapping confirmation or customer payment authority.
5. Provider identifiers are Owner-only on current reads, command outcomes and error records.
6. Credentials remain installation-private; customer erasure removes customer links and personal outcomes.
7. See [XERO.md](XERO.md) for the supported commands and retrieval limits.

**Evidence.** `tests/api/xero.test.mjs`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/quickbooks.test.mjs`
**Gap.** Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL.

#### LEDGER-010 — Xero property and parent allocation

Core · target · **missing** · From LEDGER-002 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · Register R-14

**Requirement.** Xero property and parent allocation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Owner inspection grants no posting authority; the connector reviews an explicit parent-contact and property representation before any post under RL-16.
2. The Owner-only inspection grants no posting, mapping confirmation, payment allocation or money-movement authority under RL-17.
3. The complete inherited LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007 target and Xero-fake acceptance remain binding, including existing-record review, two property invoices, the parent roll-up and one parent remittance allocated to both invoices.
4. The product representation uses one reviewed Xero billing contact and distinct Glove properties, with each property invoice linked to its property and that contact.
5. A documented supported invoice reference or tracking dimension identifies the property without discarding the purchase-order reference; no QuickBooks-style contact hierarchy is assumed.
6. One parent remittance retains explicit invoice allocations; the proposed transport uses invoice-linked Xero payment applications grouped locally under that remittance, with provider identities and exact allocated cents, subject to official capability verification.
7. Readback must preserve each property’s balance and frozen tax and discount amounts without duplicate cash or payment echoes.
8. Existing branch, role, reviewed-link, approval, replay, uncertainty, audit, export, archive and erasure obligations continue to apply.

**Evidence.** `tests/api/xero.test.mjs`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/quickbooks.test.mjs`
**Gap.** Xero parent/property allocation and the two-invoice parent remittance workflow remain unbuilt. Owner read inspection and local reviewed mappings are delivered separately; they prove no property allocation or provider post.

#### LEDGER-011 — Xero provider capability proof boundary

Core · target · **partial** · From LEDGER-002 · Cites BASE-DATA-004, BASE-SECRET-001 · Register R-14

**Requirement.** Xero provider capability proof boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Xero discovery, existing-record review, customer and item synchronization, frozen invoice transport, payment/refund readback, uncertainty recovery and property allocations are proved against the official provider capability.

**Evidence.** `tests/api/xero.test.mjs`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/quickbooks.test.mjs`
**Gap.** Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL.

#### LEDGER-012 — Xero reviewed mappings

Core · target · **partial** · From LEDGER-002 · Cites BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · Register R-14

**Requirement.** Xero reviewed mappings supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A separate explicit Owner command now verifies and records existing billing-contact and sales-item links, and a fresh fingerprint-bound command records their local review.
2. Neither command authorizes a provider write, first post or customer payment.
3. Default inspection and fingerprint-bound local link review retain their read-only authority; neither grants accounting or payment authority.

**Evidence.** `tests/api/xero.test.mjs`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/quickbooks.test.mjs`
**Gap.** Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL.

#### LEDGER-013 — Xero company action policy

Core · target · **missing** · From LEDGER-002 · Cites BASE-AUDIT-001, BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · Register R-14

**Requirement.** Xero company action policy supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Each Xero accounting action computes its fleet risk classes from the actual business effect: money for monetary effects, commitment for binding decisions and external for provider disclosure.
2. The company policy decides the call; an unanswered policy permits no accounting effect.
3. A policy decision does not widen the action’s separate current authority, and its class, action and decision remain in Activity.

**Evidence.** `tests/api/xero.test.mjs`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/quickbooks.test.mjs`
**Gap.** No Xero action workflow computes fleet classes and applies the company’s selected policy. Existing Owner-only inspection and local link review provide no accounting or payment authority.

#### LEDGER-014 — Xero policy proof matrix

Core · target · **missing** · From LEDGER-002 · Cites BASE-DATA-004, BASE-SECRET-001 · Register R-14

**Requirement.** Xero policy proof matrix supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The provider-fake accounting journey runs the company’s selected policy and records its decision; that fixture does not claim live-provider acceptance.

**Evidence.** `tests/api/xero.test.mjs`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/quickbooks.test.mjs`
**Gap.** No provider-fake accounting journey exercises the company-policy matrix and records its accounting decisions. Existing inspection fixtures do not deliver this workflow.

#### LEDGER-003 — Pantry sync

Core · target · **missing** · Cites BASE-AUDIT-001, BASE-SECRET-001

**Requirement.** For an owner who keeps their books in Pantry, Run Edit Run's accounting product, Glove posts the same records through Pantry's API with the same error and retry behavior. DATA-002, DATA-009, DATA-010 inheritance: every new command, communication, payment or sync action and provider outcome keeps its actor or provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. The [operating rules](docs/service-work-rules.md#ledger-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The complete accounting synchronization journey runs against Pantry’s documented provider edge.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.

**Evidence.** None.
**Gap.** no Pantry connection

#### LEDGER-004 — First QuickBooks connection linked to existing records

Core · target · **partial** · Cites BASE-AUDIT-001, BASE-SECRET-001 · Register R-13

**Requirement.**Proposed links.** Glove reads the company's customers (with sub-customers), items and open and recent invoices, and proposes a link for each Glove customer, price-book item and moved-in invoice. Customers match first by the QuickBooks customer ID the move-in carried where the source kept one (`MOVE-005`), then by display name together with email or phone. Items match by SKU, then by name. Moved-in invoices match by the carried QuickBooks ID, then by invoice number with the same customer and total. - **Owner review.** The review lists four groups: matched (with the rule that matched), ambiguous (two or more candidates; the owner picks one or none), Glove records with no match (the owner approves creating each in QuickBooks or links it by hand), and QuickBooks records with no Glove counterpart (left alone, or brought into Glove through the `CUST-003` review). A QuickBooks name clash ("another customer already uses this name") appears in the review before anything posts, never as a sync error afterwards. - **Only confirmed writes.** Confirming writes only the confirmed links and the new records the owner approved. A linked moved-in invoice is never posted again; later payments and refunds on it post against the QuickBooks invoice it links to. Each link records who confirmed it and can be changed until the first post that uses it. Reconnecting the same company keeps the links; connecting a different company starts a new review. DATA-002, DATA-009, DATA-010 inheritance: every new command, communication, payment or sync action and provider outcome keeps its actor or provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. MONEY-001, MONEY-004, MONEY-005 inheritance: post the frozen USD jurisdiction/tax snapshot with explicit existing-record mappings and assert the provider receives it to the cent; the current downloadable payload is inspection only, never a sync. QUOTE-007, QUOTE-019 inheritance: post each QUOTE-007, QUOTE-019 discount as the provider's discount line (tax after discount) with its non-taxable and taxable amounts and assert the provider fake receives the accepted figures to the cent. The [operating rules](docs/service-work-rules.md#ledger-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture moves in a Jobber fixture (`MOVE-001, MOVE-007`) with 50 customers, 20 price-book items and their open invoices, then connects a QuickBooks fake that already holds 48 of those customers (10 matched by the carried QuickBooks ID, 37 by name with email or phone, and one name with two QuickBooks candidates), all 20 items and the open invoices.
2. The review lists exactly 47 matched customers, one ambiguous pair, two Glove customers with no match and 20 matched items, and the fake receives no write before confirmation.
3. After the owner picks the ambiguous match and approves creating the two unmatched customers, the fake holds no duplicate customer or item, the two new customers exist once each, the moved-in invoices are linked and not re-created, a payment on one of them posts against its existing QuickBooks invoice, and the next new Glove invoice posts against the linked customer.
4. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.

**Evidence.** `tests/api/quickbooks.test.mjs`, `tests/browser/quickbooks.spec.ts`
**Gap.** Carried source QuickBooks customer, item and invoice IDs and their ordered source-ID matching remain unbuilt: the held documented Jobber parent and product export shapes do not define those accounting fields. The 50-customer fixture proves 47 name-and-contact matches, not the required 10 carried-ID plus 37 contact-match split. Different-company reconciliation of previously posted payments and unresolved sends, moved-in refund posting and production connection and owner activation remain unproved.

### Recurring service and maintenance agreements

#### PLAN-001 — Recurring jobs

Core · target · **partial** · From PLAN-001 · Cites BASE-AUDIT-001

**Requirement.** Before the first QuickBooks post, the owner reviews discovered customers, items, open invoices and parent/property relationships against the moved-in business, resolves ambiguity and confirms reuse or creation without duplication. The [operating rules](docs/service-work-rules.md#ledger-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture creates a quarterly series, skips one visit, moves another, changes the rule from a date, and checks every generated visit.
2. The dispatcher or owner makes an open job repeat (series create action) from a first local date, at a visit start and end time with one technician, on a rule: every 1–52 weeks (on the first date's weekday), or every 1–52 months, or every year in named months, on a day of the month (the first date's unless given; a day the month lacks becomes its last day) or on the first to fourth or last given weekday of the month; intervals count from the rule's first date.
3. Dates are local dates in the business time zone.
4. The series may end on a date (inclusive).
5. Visits are booked for every occurrence through the earlier of that end and today plus the series' rolling horizon (7–730 days, 365 by default): at create and change, conflicts are reviewed under `GLOVE-05` as for one booking; after every later command the horizon rolls forward and the newly booked visits carry their conflicts unreviewed, named on the job timeline for review on Dispatch, and an occurrence that cannot be booked (for example an inactive technician) is recorded once on the series and named on the timeline.

**Evidence.** `src/glove/recurrence.ts`, `src/glove/commands/series.ts`, `src/glove/commands/field.ts`, `src/ui/series.tsx`, `tests/api/series.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture creates a quarterly series, skips one visit, moves another, changes the rule from a date, and checks every generated visit.; point 2 — The dispatcher or owner makes an open job repeat (series create action) from a first local date, at a visit start and end time with one technician, on a rule: every 1–52 weeks (on the first date's weekday), or every 1–52 months, or every year in named months, on a day of the month (the first date's unless given; a day the month lacks becomes its last day) or on the first to fourth or last given weekday of the month; intervals count from the rule's first date.; point 3 — Dates are local dates in the business time zone.; point 4 — The series may end on a date (inclusive).; point 5 — Visits are booked for every occurrence through the earlier of that end and today plus the series' rolling horizon (7–730 days, 365 by default): at create and change, conflicts are reviewed under GLOVE-05 as for one booking; after every later command the horizon rolls forward and the newly booked visits carry their conflicts unreviewed, named on the job timeline for review on Dispatch, and an occurrence that cannot be booked (for example an inactive technician) is recorded once on the series and named on the timeline. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PLAN-006 — Recurring occurrence changes

Core · target · **partial** · From PLAN-001

**Requirement.** Recurring occurrence changes supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Each visit is an ordinary visit carrying its rule revision and occurrence date: moving it (visit change action) or skipping it (visit cancel action, labelled skipped) leaves the series unchanged, and an occurrence that has a visit is never booked again.
2. Changing the series from a date (series change action, with a reason, not before its first date) starts a new rule revision there: visits on or after that date that are still booked and untouched (no arrival, never moved) are canceled with that reason and booked again under the new revision; earlier visits and moved, skipped, started or completed ones stay as they are.
3. Completing one visit leaves a recurring job open; a visit completes the job only once the series has an end date, has booked through it and no other visit of the job is booked.
4. The series' invoicing rule comes with `PLAN-005, PLAN-012, PLAN-013`, which carries it in its text and acceptance; until then a recurring job is invoiced as one job under `GLOVE-09`.

**Evidence.** `src/glove/recurrence.ts`, `src/glove/commands/series.ts`, `src/glove/commands/field.ts`, `src/ui/series.tsx`, `tests/api/series.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Each visit is an ordinary visit carrying its rule revision and occurrence date: moving it (visit change action) or skipping it (visit cancel action, labelled skipped) leaves the series unchanged, and an occurrence that has a visit is never booked again.; point 2 — Changing the series from a date (series change action, with a reason, not before its first date) starts a new rule revision there: visits on or after that date that are still booked and untouched (no arrival, never moved) are canceled with that reason and booked again under the new revision; earlier visits and moved, skipped, started or completed ones stay as they are.; point 3 — Completing one visit leaves a recurring job open; a visit completes the job only once the series has an end date, has booked through it and no other visit of the job is booked.; point 4 — The series' invoicing rule comes with PLAN-005, PLAN-012, PLAN-013, which carries it in its text and acceptance; until then a recurring job is invoiced as one job under GLOVE-09. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PLAN-002 — Maintenance agreements and memberships

Core · target · **partial**

**Requirement.** A maintenance plan defines term, price, included visits, inspection forms, repair discounts and renewal conditions. Selling it creates a customer/property agreement whose remaining entitlements, due work, history, reporting and segment membership reconcile with completed or explicitly declined visits. The [operating rules](docs/service-work-rules.md#plan-002-operating-rules) retain the record formats and calculations. Owning-capability boundaries: QUOTE-007, QUOTE-019 inheritance: the member repair discount is a QUOTE-007, QUOTE-019 document discount or discount line, allocated non-taxable first and taxed after discount, carried quote → job → invoice, and asserted on the CSV, the QuickBooks payload and reports.

**Acceptance.**
1. A fixture sells a plan with two included tune-ups and 15% repair discount, books and completes one tune-up, quotes a repair, and checks the entitlement count and the discount, that the completed tune-up's job carried the plan's inspection form, and that the `REPORT-001` agreements-due tile counts the agreement while its second tune-up is due, and that the `REPORT-002, REPORT-004` agreement report counts the sold agreement and no churn, and that a `CUST-004, CUST-006` "no agreement" segment excludes the customer.

**Evidence.** `src/glove/agreements.ts`, `src/ui/agreements.tsx`, `tests/api/agreements.test.mjs`, `src/glove/history.ts`, `src/glove/api.ts`, `tests/browser/due-visits.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture sells a plan with two included tune-ups and 15% repair discount, books and completes one tune-up, quotes a repair, and checks the entitlement count and the discount, that the completed tune-up's job carried the plan's inspection form, and that the REPORT-001 agreements-due tile counts the agreement while its second tune-up is due, and that the REPORT-002, REPORT-004 agreement report counts the sold agreement and no churn, and that a CUST-004, CUST-006 "no agreement" segment excludes the customer. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PLAN-003 — Recurring billing and renewals

Core · target · **missing**

**Requirement.** Agreements bill monthly or yearly through saved payment methods (`PAY-008, PAY-027, PAY-028, PAY-029, PAY-030`); renewal notices go out ahead of the term end with the terms state auto-renewal laws require the owner to show; customers can cancel or update their card in the hub; a failed charge follows the dunning schedule and the agreement shows its state. The [operating rules](docs/service-work-rules.md#plan-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture runs a monthly agreement through three charges, one failed and recovered, then a renewal notice and an auto-renewal, and a cancellation from the hub.
2. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.
3. When the customer chose autopay, the invoice is charged to the saved method under `PAY-008, PAY-027, PAY-028, PAY-029, PAY-030`, with the receipt sent, and a failed charge follows `PLAN-003`'s dunning. a flow test runs two series for three months (Stripe fake): a per-visit series with one visit in month 1, two in month 2 (a third skipped) and none in month 3, and a quarterly commercial PM job billed $240.00 fixed monthly on autopay; it checks exactly three per-visit invoices with each visit's lines, exactly three $240.00 invoices dated the last day of each month, each charged once, with one failed charge entering dunning and recovered; an on-close series invoices once when the job closes.

**Evidence.** None.
**Gap.** no recurring billing

#### PLAN-004 — Due-visit scheduling until done or declined

Core · target · **partial** · From PLAN-004

**Requirement.** Due-visit scheduling until done or declined supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations. Recorded decisions: RL-19. Owning-capability boundaries: AGENT-008, AGENT-016 inheritance: the morning brief lists agreements with visits due, with their agreement link and a proposed action, asserted in the AGENT-008, AGENT-016 flow.

**Acceptance.**
1. A fixture generates 40 due visits, batch-books 30 by area, sends links for 8, records 2 declines, and checks the due list shows exactly the remainder, and the `REPORT-001` agreements-due tile the same number of due visits.
2. The due-visit list lists each included visit separately, identified by agreement and zero-based ordinal, with its PLAN-002 due date, customer, site, ZIP, linked job and booking state.
3. Through defaults to the business's local today; optional from and through bounds include both ends; area matches the site's exact ZIP.
4. Completion removes only that entitlement, even if visits finish out of order.
5. Booking, cancellation, term expiry and ending an agreement do not silently remove outstanding work.
6. New included jobs keep the included-visit ordinal; older jobs take the first unclaimed ordinal in stored order.
7. An existing job is retained when its booking is cancelled, so the desk can rebook it.

**Evidence.** `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture generates 40 due visits, batch-books 30 by area, sends links for 8, records 2 declines, and checks the due list shows exactly the remainder, and the REPORT-001 agreements-due tile the same number of due visits.; point 2 — The due-visit list lists each included visit separately, identified by agreement and zero-based ordinal, with its PLAN-002 due date, customer, site, ZIP, linked job and booking state.; point 3 — Through defaults to the business's local today; optional from and through bounds include both ends; area matches the site's exact ZIP.; point 4 — Completion removes only that entitlement, even if visits finish out of order.; point 5 — Booking, cancellation, term expiry and ending an agreement do not silently remove outstanding work.; point 6 — New included jobs keep the included-visit ordinal; older jobs take the first unclaimed ordinal in stored order.; point 7 — An existing job is retained when its booking is cancelled, so the desk can rebook it. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PLAN-007 — Due work in the owner brief

Core · target · **partial** · From PLAN-004

**Requirement.** Due work in the owner brief supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Today counts outstanding due visits, including those booked, and the owner morning brief links each one to its customer's agreement and Dispatch.

**Evidence.** `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Today counts outstanding due visits, including those booked, and the owner morning brief links each one to its customer's agreement and Dispatch. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PLAN-008 — Due-visit desk booking

Core · target · **partial** · From PLAN-004 · Cites BASE-ROLE-001

**Requirement.** Due-visit desk booking supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Dispatch offers consecutive-slot batches through the existing job create action and visit book action doors, with their current authority and conflicts: each success and refusal is shown, and a refused or interrupted booking remains due.
2. The Office may now book only jobs linked to an agreement under the approved booking semantics below.
3. Customer links and the Office booking authority follow the approved semantics below.
4. The Office may visit book action only a job with an a matching agreement link linking that job's customer and site, with the normal exact-conflict review, and may neither visit change action nor visit cancel action; the dispatcher keeps every other booking.
5. Direct HTTP calls enforce these restrictions; Office workflow rules retain API-005’s existing prohibition on automatic booking.

**Evidence.** `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Dispatch offers consecutive-slot batches through the existing job create action and visit book action doors, with their current authority and conflicts: each success and refusal is shown, and a refused or interrupted booking remains due.; point 2 — The Office may now book only jobs linked to an agreement under the approved booking semantics below.; point 3 — Customer links and the Office booking authority follow the approved semantics below.; point 4 — The Office may visit book action only a job with an a matching agreement link linking that job's customer and site, with the normal exact-conflict review, and may neither visit change action nor visit cancel action; the dispatcher keeps every other booking.; point 5 — Direct HTTP calls enforce these restrictions; Office workflow rules retain API-005’s existing prohibition on automatic booking. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PLAN-009 — Customer explicit entitlement decline

Core · target · **partial** · From PLAN-004 · Cites BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** Customer explicit entitlement decline supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A decline is the customer's own explicit answer, recorded by a person as `GLOVE-04` records a quote's answer: the desk (owner, dispatcher, office) records it for one included visit of an agreement (agreement decline action: agreement version, zero-based ordinal, who declined, how — phone, email reply, text reply or in person — and their reason).
2. Glove never infers a decline from silence, a cancelled booking, term expiry or agreement end action.
3. It is refused for a completed or already declined visit, and while that visit has a live booking (cancel the booking first, under `GLOVE-07`).
4. The decline keeps the visit's due date, the recorder's name and role and the time, is appended to the agreement (never edited), is named on the Activity timeline (agreement visit declined action) and travels in the export.
5. A declined visit leaves the due list, the `REPORT-001` agreements-due tile and the `AGENT-008, AGENT-016` brief; it is no longer "left" under `PLAN-002`, and no included job can be made for it.
6. The decline joins the site's property history (`CUST-001`) as an agreement decline row.

**Evidence.** `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A decline is the customer's own explicit answer, recorded by a person as GLOVE-04 records a quote's answer: the desk (owner, dispatcher, office) records it for one included visit of an agreement (agreement decline action: agreement version, zero-based ordinal, who declined, how — phone, email reply, text reply or in person — and their reason).; point 2 — Glove never infers a decline from silence, a cancelled booking, term expiry or agreement end action.; point 3 — It is refused for a completed or already declined visit, and while that visit has a live booking (cancel the booking first, under GLOVE-07).; point 4 — The decline keeps the visit's due date, the recorder's name and role and the time, is appended to the agreement (never edited), is named on the Activity timeline (agreement visit declined action) and travels in the export.; point 5 — A declined visit leaves the due list, the REPORT-001 agreements-due tile and the AGENT-008, AGENT-016 brief; it is no longer "left" under PLAN-002, and no included job can be made for it.; point 6 — The decline joins the site's property history (CUST-001) as an agreement decline row. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PLAN-010 — Customer due-visit booking offers

Core · target · **partial** · From PLAN-004 · Cites BASE-DATA-001, BASE-ROLE-001

**Requirement.** Customer due-visit booking offers supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The desk offers 1 to 10 future, currently conflict-free slots for one outstanding included visit (agreement offer action), retaining or creating its included job.
2. The revocable bearer link is shown once, stores only its hash separately from portable domain records, expires exactly 14 days after creation, and is revoked atomically when used or by staff (agreement offer revoke action).
3. Like FIELD-003, restoring an archive retains offer metadata but requires a new link; old bearers are not restored.
4. The customer page offers only that included visit's service, site and slots, with each slot's booking time zone; it grants no account access.
5. The customer chooses one offered slot, under the offering person's current active role and branch authority.
6. Every choice repeats `GLOVE-05` eligibility and overlap checks; the public choice never acknowledges new conflicts.
7. A slot taken meanwhile is refused, showing only remaining open offers without other customers' conflict details.
8. No open offers means contact the office; the visit stays due.

**Evidence.** `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The desk offers 1 to 10 future, currently conflict-free slots for one outstanding included visit (agreement offer action), retaining or creating its included job.; point 2 — The revocable bearer link is shown once, stores only its hash separately from portable domain records, expires exactly 14 days after creation, and is revoked atomically when used or by staff (agreement offer revoke action).; point 3 — Like FIELD-003, restoring an archive retains offer metadata but requires a new link; old bearers are not restored.; point 4 — The customer page offers only that included visit's service, site and slots, with each slot's booking time zone; it grants no account access.; point 5 — The customer chooses one offered slot, under the offering person's current active role and branch authority.; point 6 — Every choice repeats GLOVE-05 eligibility and overlap checks; the public choice never acknowledges new conflicts.; point 7 — A slot taken meanwhile is refused, showing only remaining open offers without other customers' conflict details.; point 8 — No open offers means contact the office; the visit stays due. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PLAN-011 — Booking-offer communication history

Core · target · **partial** · From PLAN-004 · Cites BASE-AUDIT-001

**Requirement.** Booking-offer communication history supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Created, used, revoked and staff-recorded outside-send events name the person and time in Activity and the business export, without the bearer.
2. Agreement offer action with email: true emails the link through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018` to the customer's own email address on record (the link is still shown once in the response), and the offer shows its provider-reported delivery state; agreement offer sent action still records a send staff made outside Glove, labelled with the method and recorder and “delivery not verified”, with no delivery claimed.
3. The offer, its outside-send record and its use or revocation are booking link rows in the site's property history (`CUST-001`); an emailed link also appears there as a message row with its provider-reported state (`COMM-007`).

**Evidence.** `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Created, used, revoked and staff-recorded outside-send events name the person and time in Activity and the business export, without the bearer.; point 2 — Agreement offer action with email: true emails the link through COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 to the customer's own email address on record (the link is still shown once in the response), and the offer shows its provider-reported delivery state; agreement offer sent action still records a send staff made outside Glove, labelled with the method and recorder and “delivery not verified”, with no delivery claimed.; point 3 — The offer, its outside-send record and its use or revocation are booking link rows in the site's property history (CUST-001); an emailed link also appears there as a message row with its provider-reported state (COMM-007). See docs/contract/DONE-AUDIT.md for each named outcome.

#### PLAN-005 — Invoicing rules for recurring jobs

Core · target · **partial** · From PLAN-005

**Requirement.** Invoicing rules for recurring jobs supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture runs two series for three months: a per-visit series with one visit in month 1, two in month 2 (a third skipped) and none in month 3, and a quarterly commercial PM job billed $240.00 fixed monthly; it checks exactly three per-visit invoices with each visit's lines, exactly three $240.00 invoices dated the last day of each month; an on-close series invoices once when the job closes.
2. The signed-in owner sets a billing rule with a series at creation/change or series billing action.
3. Its numbered revisions apply from a current/future local date and retain earlier billing.
4. Modes are per-visit, fixed-monthly, fixed-after-visit, on-close and as-needed (one month-end office reminder, no invoice).
5. Fixed rules keep their explicit priced lines; per-visit drafts carry only that visit's work/materials and unbilled visit expenses.
6. Skipped/canceled visits do not bill; paused periods do not bill; monthly fixed billing does not depend on whether visits ran.
7. Stable job/visit/month/close identities commit with the invoice or reminder, so replay, concurrent commands and cron runs cannot duplicate them.
8. A capture already claimed by one invoice is not billed again after a forward rule change.

**Evidence.** `tests/api/recurring-billing.test.mjs`, `tests/browser/recurring-billing.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture runs two series for three months: a per-visit series with one visit in month 1, two in month 2 (a third skipped) and none in month 3, and a quarterly commercial PM job billed $240.00 fixed monthly; it checks exactly three per-visit invoices with each visit's lines, exactly three $240.00 invoices dated the last day of each month; an on-close series invoices once when the job closes.; point 2 — The signed-in owner sets a billing rule with a series at creation/change or series billing action.; point 3 — Its numbered revisions apply from a current/future local date and retain earlier billing.; point 4 — Modes are per-visit, fixed-monthly, fixed-after-visit, on-close and as-needed (one month-end office reminder, no invoice).; point 5 — Fixed rules keep their explicit priced lines; per-visit drafts carry only that visit's work/materials and unbilled visit expenses.; point 6 — Skipped/canceled visits do not bill; paused periods do not bill; monthly fixed billing does not depend on whether visits ran.; point 7 — Stable job/visit/month/close identities commit with the invoice or reminder, so replay, concurrent commands and cron runs cannot duplicate them.; point 8 — A capture already claimed by one invoice is not billed again after a forward rule change. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PLAN-012 — Recurring draft approval

Core · target · **partial** · From PLAN-005 · Cites BASE-ROLE-001

**Requirement.** Recurring draft approval supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The Worker cron and ordinary mutations generate due drafts; opening state is read-only.
2. The office can run series billing run action and reads the documented product door for dates without an invoice/reminder and the concrete missing-price/PO problem.
3. Existing series retain their old job-wide workflow until the owner explicitly configures a rule.
4. The owner may explicitly authorize automatic approval only for a rule's fixed invoices.
5. The pass rechecks the configuring owner's current active Owner role and branch scope at commit; no other person's rule or a later edited draft borrows that grant.
6. Otherwise normal GLOVE-09 approval applies.
7. Drafts say “Proposed — not approved, not sent” and count nowhere in aging, revenue, tax, exports or QuickBooks.

**Evidence.** `tests/api/recurring-billing.test.mjs`, `tests/browser/recurring-billing.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The Worker cron and ordinary mutations generate due drafts; opening state is read-only.; point 2 — The office can run series billing run action and reads the documented product door for dates without an invoice/reminder and the concrete missing-price/PO problem.; point 3 — Existing series retain their old job-wide workflow until the owner explicitly configures a rule.; point 4 — The owner may explicitly authorize automatic approval only for a rule's fixed invoices.; point 5 — The pass rechecks the configuring owner's current active Owner role and branch scope at commit; no other person's rule or a later edited draft borrows that grant.; point 6 — Otherwise normal GLOVE-09 approval applies.; point 7 — Drafts say “Proposed — not approved, not sent” and count nowhere in aging, revenue, tax, exports or QuickBooks. See docs/contract/DONE-AUDIT.md for each named outcome.

#### PLAN-013 — Fixed-monthly invoice dates

Core · target · **partial** · From PLAN-005

**Requirement.** Fixed-monthly invoice dates supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. For newly generated fixed-monthly invoices only, approval on/after period end freezes issue date at that period end, records approval time and approver separately, and freezes due date = max(period end, the local approval date) + terms.
2. Late approvals are labelled; aging begins only after approval and ages from that frozen due date.
3. Revenue/tax/CSV/QuickBooks use the frozen issue date.
4. Terms changes, correction and later export do not move those dates; preexisting documents and outputs are unchanged.
5. No charge, receipt or dunning is added by this slice; PAY-008, PAY-027, PAY-028, PAY-029, PAY-030, PLAN-003 and COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 carry those remaining acceptance obligations before autopay ships.

**Evidence.** `tests/api/recurring-billing.test.mjs`, `tests/browser/recurring-billing.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — For newly generated fixed-monthly invoices only, approval on/after period end freezes issue date at that period end, records approval time and approver separately, and freezes due date = max(period end, the local approval date) + terms.; point 2 — Late approvals are labelled; aging begins only after approval and ages from that frozen due date.; point 3 — Revenue/tax/CSV/QuickBooks use the frozen issue date.; point 4 — Terms changes, correction and later export do not move those dates; preexisting documents and outputs are unchanged.; point 5 — No charge, receipt or dunning is added by this slice; PAY-008, PAY-027, PAY-028, PAY-029, PAY-030, PLAN-003 and COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 carry those remaining acceptance obligations before autopay ships. See docs/contract/DONE-AUDIT.md for each named outcome.

### Stock and purchasing

#### STOCK-001 — Van and warehouse stock

Core · target · **partial** · Cites BASE-AUDIT-001

**Requirement.** Each van and warehouse holds stock of price-book materials with counts; materials used on a visit come off that technician's van; transfers and restocks are recorded; low stock against a par level shows on the van; the day's jobs list the parts they need and whether the van has them. The [operating rules](docs/service-work-rules.md#stock-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture sets van stock, records materials used on two visits, transfers from the warehouse, and checks counts, a low-stock flag and the parts-on-board check for tomorrow's jobs.
2. The owner and office keep stock locations (a van per technician, and warehouses) holding price-book materials only, counted in the material's unit to a thousandth; par levels are set per location and material.
3. A stocktake sets a count, a restock adds, a transfer moves between two locations and is refused when the source holds less; a material from the price book that a technician records on a visit (`GLOVE-06`, so also offline) comes off that technician's van, and a count may go below zero, shown as such.
4. Every movement is a stock-move record with who, when, the change and the count after, and a timeline entry.
5. An item is low when its count is at or below its par.
6. The parts a job needs are its lines' materials, and a task line's material contents, at their quantity times the line's quantity; the day's parts check walks one technician's visits on a local date in start order, and a part is on board for a job when the van holds enough for that job and every earlier job that day.
7. A technician reads only their own van and their own day.

**Evidence.** `src/glove/stock.ts`, `src/glove/commands/stock.ts`, `src/glove/commands/field.ts`, `src/ui/stock.tsx`, `tests/api/stock.test.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 5 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture sets van stock, records materials used on two visits, transfers from the warehouse, and checks counts, a low-stock flag and the parts-on-board check for tomorrow's jobs.; point 2 — The owner and office keep stock locations (a van per technician, and warehouses) holding price-book materials only, counted in the material's unit to a thousandth; par levels are set per location and material.; point 3 — A stocktake sets a count, a restock adds, a transfer moves between two locations and is refused when the source holds less; a material from the price book that a technician records on a visit (GLOVE-06, so also offline) comes off that technician's van, and a count may go below zero, shown as such.; point 4 — Every movement is a stock-move record with who, when, the change and the count after, and a timeline entry.; point 5 — An item is low when its count is at or below its par.; point 6 — The parts a job needs are its lines' materials, and a task line's material contents, at their quantity times the line's quantity; the day's parts check walks one technician's visits on a local date in start order, and a part is on board for a job when the van holds enough for that job and every earlier job that day. See docs/contract/DONE-AUDIT.md for each named outcome.

#### STOCK-002 — Purchase orders to suppliers

Core · target · **partial** · Cites BASE-AUDIT-001

**Requirement.** The office raises purchase orders to suppliers (by email or supplier portal), receives them fully or partly into a van or warehouse, and links job-specific orders to the job's cost. The [operating rules](docs/service-work-rules.md#stock-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture raises a PO for a job, receives it in two parts, and checks stock and job cost.
2. The owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (with an optional email) of 1 to 50 price-book materials, each at a quantity to a thousandth of its unit and the supplier's unit cost (the item's price-book cost unless given), delivered to one van or warehouse (`STOCK-001`), for stock or for one job; it changes only while a draft.
3. A draft order goes to the supplier in one of two ways, and the record and timeline say which: the owner or office emails it from Glove to the order's supplier address, or another address the person names, through the owner's connected email (`COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018` email send action with kind purchase order; the order then reads sent, naming the email, with the provider's reported outcome, where delivered means only that the supplier's mail server accepted it), or the person sends it outside Glove by email, the supplier's portal, phone or in person and records that method with the supplier's reference, which is recorded as sent with no delivery claim.
4. Glove has no supplier-portal connection.
5. Only a sent order is received, in one or more parts, each line at most what is still due; each part adds to the delivery location's stock as a stock move naming the order (and its job), and the order reads partly received until every line arrives.
6. A job's received lines count to its actual cost (`COST-004`) at the order's unit cost; a price-book material recorded on that job counts at its price-book cost only beyond the quantity the job's orders received of it, so nothing is costed twice.
7. A job order shows on the property history (`CUST-001`).
8. Unit costs are margin figures (`MONEY-003, MONEY-006`): purchase orders are read only by roles that read reports, never by technicians.

**Evidence.** `src/glove/commands/purchasing.ts`, `src/glove/costing.ts`, `src/ui/purchasing.tsx`, `tests/api/purchasing.test.mjs`, `src/glove/api.ts`, `src/glove/storage.ts`, `src/glove/access.ts`, `src/glove/view.ts`
**Gap.** The audit records 8 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture raises a PO for a job, receives it in two parts, and checks stock and job cost.; point 2 — The owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (with an optional email) of 1 to 50 price-book materials, each at a quantity to a thousandth of its unit and the supplier's unit cost (the item's price-book cost unless given), delivered to one van or warehouse (STOCK-001), for stock or for one job; it changes only while a draft.; point 3 — A draft order goes to the supplier in one of two ways, and the record and timeline say which: the owner or office emails it from Glove to the order's supplier address, or another address the person names, through the owner's connected email (COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 email send action with kind purchase order; the order then reads sent, naming the email, with the provider's reported outcome, where delivered means only that the supplier's mail server accepted it), or the person sends it outside Glove by email, the supplier's portal, phone or in person and records that method with the supplier's reference, which is recorded as sent with no delivery claim.; point 4 — Glove has no supplier-portal connection.; point 5 — Only a sent order is received, in one or more parts, each line at most what is still due; each part adds to the delivery location's stock as a stock move naming the order (and its job), and the order reads partly received until every line arrives.; point 6 — A job's received lines count to its actual cost (COST-004) at the order's unit cost; a price-book material recorded on that job counts at its price-book cost only beyond the quantity the job's orders received of it, so nothing is costed twice.; point 8 — Unit costs are margin figures (MONEY-003, MONEY-006): purchase orders are read only by roles that read reports, never by technicians. See docs/contract/DONE-AUDIT.md for each named outcome.

### Team and permissions

#### TEAM-001 — Custom roles and permissions

Core · target · **partial** · Cites BASE-ACCESS-004, BASE-ROLE-001

**Requirement.** The owner builds roles from named permissions (for example a CSR who books and takes card payments under `PAY-009` but cannot see margins or refund, a lead technician who can approve field quotes), each enforced by every command handler and read door as the built-in roles are. The [operating rules](docs/service-work-rules.md#team-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A custom customer-service role is refused each command outside its named permissions through every product door.

**Evidence.** `src/glove/access.ts`, `src/glove/commands/setup.ts`, `src/ui/custom-roles.tsx`, `tests/api/security.test.mjs`, `tests/api/purchasing.test.mjs`, `src/glove/commands/purchasing.ts`, `src/glove/api.ts`, `src/glove/storage.ts`, `src/glove/view.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A custom customer-service role is refused each command outside its named permissions through every product door. See docs/contract/DONE-AUDIT.md for each named outcome.

#### TEAM-002 — Branches

Core · target · **partial** · From TEAM-002 · Cites BASE-ACCESS-004, BASE-ROLE-001

**Requirement.** Branches supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#team-002-operating-rules) retain the record formats and calculations. Recorded decisions: RL-20.

**Acceptance.**
1. A fixture sets two branches in different time zones, books in each, and checks a branch-limited dispatcher sees only theirs; and the `REPORT-002, REPORT-004` revenue report by branch, filtered to one branch, narrows to that branch's invoices.
2. The owner creates branches with an IANA booking zone, a unique alphanumeric number prefix and service ZIP codes.
3. New sites choose their branch and keep it; the first site assigns its customer to that branch, and all of that customer’s sites stay in it.
4. Technicians belong to a branch; crews never mix branches.
5. Quotes, service calls, assessments and their jobs and invoices inherit the site’s branch, with independent per-kind counters (for example RAL-J-1001 and RAL-INV-0001).
6. The prefix is fixed after the first number.
7. Legacy sites, technicians and documents remain in the main business branch with their original numbers and business zone.
8. A visit records its booking zone and exact instants; later branch-zone edits affect new bookings and moves, never rewrite existing visits.

**Evidence.** `src/glove/branches.ts`, `src/glove/commands/branches.ts`, `src/ui/branches.tsx`, `tests/api/branches.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture sets two branches in different time zones, books in each, and checks a branch-limited dispatcher sees only theirs; and the REPORT-002, REPORT-004 revenue report by branch, filtered to one branch, narrows to that branch's invoices.; point 2 — The owner creates branches with an IANA booking zone, a unique alphanumeric number prefix and service ZIP codes.; point 3 — New sites choose their branch and keep it; the first site assigns its customer to that branch, and all of that customer’s sites stay in it.; point 4 — Technicians belong to a branch; crews never mix branches.; point 5 — Quotes, service calls, assessments and their jobs and invoices inherit the site’s branch, with independent per-kind counters (for example RAL-J-1001 and RAL-INV-0001).; point 6 — The prefix is fixed after the first number.; point 7 — Legacy sites, technicians and documents remain in the main business branch with their original numbers and business zone.; point 8 — A visit records its booking zone and exact instants; later branch-zone edits affect new bookings and moves, never rewrite existing visits. See docs/contract/DONE-AUDIT.md for each named outcome.

#### TEAM-004 — Branch operational projections

Core · target · **partial** · From TEAM-002 · Cites BASE-ACCESS-004, BASE-ROLE-001

**Requirement.** Branch operational projections supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#team-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A technician must belong to the job’s branch; the existing area warning/refusal rule also applies to its branch ZIP codes.
2. The Dispatch branch choice shows its own technicians, work and local zone.
3. Actual per-branch US tax settings and the REPORT-002, REPORT-004 tax-jurisdiction rows ship with MONEY-001, MONEY-004, MONEY-005, which carries them in its text and acceptance.
4. Revenue reports include branch rows and a branch filter in JSON and CSV, dating each invoice by its branch’s local first-approval date (both period ends included).
5. Customers cannot merge across branches.
6. Every existing report accepts the branch filter in JSON and CSV; future record kinds, read doors and reports inherit the same scope before shipping (API-002, API-006, API-007/003, COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018..009, PAY-001, PAY-010, PAY-011, PAY-012, PAY-013, PAY-014, PAY-015, PAY-016..009, LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007..004, PLAN-002..005, MOVE-001, MOVE-007..006).

**Evidence.** `src/glove/branches.ts`, `src/glove/commands/branches.ts`, `src/ui/branches.tsx`, `tests/api/branches.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A technician must belong to the job’s branch; the existing area warning/refusal rule also applies to its branch ZIP codes.; point 2 — The Dispatch branch choice shows its own technicians, work and local zone.; point 3 — Actual per-branch US tax settings and the REPORT-002, REPORT-004 tax-jurisdiction rows ship with MONEY-001, MONEY-004, MONEY-005, which carries them in its text and acceptance.; point 4 — Revenue reports include branch rows and a branch filter in JSON and CSV, dating each invoice by its branch’s local first-approval date (both period ends included).; point 5 — Customers cannot merge across branches.; point 6 — Every existing report accepts the branch filter in JSON and CSV; future record kinds, read doors and reports inherit the same scope before shipping (API-002, API-006, API-007/003, COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018..009, PAY-001, PAY-010, PAY-011, PAY-012, PAY-013, PAY-014, PAY-015, PAY-016..009, LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007..004, PLAN-002..005, MOVE-001, MOVE-007..006). See docs/contract/DONE-AUDIT.md for each named outcome.

#### TEAM-005 — Current branch authority

Core · target · **partial** · From TEAM-002 · Cites BASE-ACCESS-004, BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** Current branch authority supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#team-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner limits a person to a named branch or the main business branch, or removes that limit.
2. The installation owner retains all-branch access.
3. Limits apply to every current read and command door, including files, Activity, history, reports, business/CSV exports, saved command outcomes and workflow actions under their creator’s live scope; a changed limit is rechecked in the commit guard.
4. Scoped people read and change only operational records rooted in their branch; shared business reference data remains readable under their existing role and is read-only for them.
5. New operational records created by a scoped person belong to their branch.

**Evidence.** `src/glove/branches.ts`, `src/glove/commands/branches.ts`, `src/ui/branches.tsx`, `tests/api/branches.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The owner limits a person to a named branch or the main business branch, or removes that limit.; point 2 — The installation owner retains all-branch access.; point 3 — Limits apply to every current read and command door, including files, Activity, history, reports, business/CSV exports, saved command outcomes and workflow actions under their creator’s live scope; a changed limit is rechecked in the commit guard.; point 4 — Scoped people read and change only operational records rooted in their branch; shared business reference data remains readable under their existing role and is read-only for them.; point 5 — New operational records created by a scoped person belong to their branch. See docs/contract/DONE-AUDIT.md for each named outcome.

#### TEAM-003 — Technician commissions and bonuses

Core · target · **partial** · From TEAM-003

**Requirement.** Technician commissions and bonuses supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#team-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture applies a 5% sold-revenue rule and a $25 agreement spiff over a period and checks the totals in the payroll export.
2. The owner alone (acting for "admin") sets commission rules in payroll settings: a percent of sold revenue, a percent of completed revenue and a fixed spiff per agreement sold, each optional (percents from 0 to 99.99 with up to two decimals; the spiff in USD).
3. Each save is a rule version applying from a local date (today unless the owner gives one), replacing any version from that same date; a credited sale takes the version in force on its local date in the business time zone, so a later change never alters earlier earnings.
4. Rules apply to every technician.
5. Sold revenue is an accepted quote's accepted total before tax (the chosen option and add-ons after any `QUOTE-007, QUOTE-019` discount), credited to the technician the desk names as its seller when recording the acceptance, on the local date the acceptance was recorded; a quote accepted with no seller credits nobody.
6. Completed revenue is `REPORT-002, REPORT-004`'s technician revenue: an invoice's latest approved revision before tax, split equally among the technicians who completed the job's visits (the cent remainder to the first by name), on the local date of its first approval.
7. A spiff is credited to the technician the desk names when selling a `PLAN-002` agreement, on the local date it was sold.
8. Each credited sale's commission is its base × percent, rounded half up to the cent; totals are sums of those amounts.

**Evidence.** `src/glove/commissions.ts`, `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `tests/api/payroll.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture applies a 5% sold-revenue rule and a $25 agreement spiff over a period and checks the totals in the payroll export.; point 2 — The owner alone (acting for "admin") sets commission rules in payroll settings: a percent of sold revenue, a percent of completed revenue and a fixed spiff per agreement sold, each optional (percents from 0 to 99.99 with up to two decimals; the spiff in USD).; point 3 — Each save is a rule version applying from a local date (today unless the owner gives one), replacing any version from that same date; a credited sale takes the version in force on its local date in the business time zone, so a later change never alters earlier earnings.; point 4 — Rules apply to every technician.; point 5 — Sold revenue is an accepted quote's accepted total before tax (the chosen option and add-ons after any QUOTE-007, QUOTE-019 discount), credited to the technician the desk names as its seller when recording the acceptance, on the local date the acceptance was recorded; a quote accepted with no seller credits nobody.; point 6 — Completed revenue is REPORT-002, REPORT-004's technician revenue: an invoice's latest approved revision before tax, split equally among the technicians who completed the job's visits (the cent remainder to the first by name), on the local date of its first approval.; point 7 — A spiff is credited to the technician the desk names when selling a PLAN-002 agreement, on the local date it was sold.; point 8 — Each credited sale's commission is its base × percent, rounded half up to the cent; totals are sums of those amounts. See docs/contract/DONE-AUDIT.md for each named outcome.

#### TEAM-006 — Commission payroll export

Core · target · **partial** · From TEAM-003 · Register R-15, R-16, R-17

**Requirement.** Commission payroll export supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#team-003-operating-rules) retain the record formats and calculations. Owning-capability boundaries: Inheritance: technician tips do not exist today; `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020` adds each technician's tips to the same files for the same approved weeks , and `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018` field quotes and `COMM-006, COMM-022, COMM-023, COMM-024, COMM-025` hub sales credit their selling technician under these rules.

**Acceptance.**
1. Earnings are computed for the pay period when the payroll files are read, and the owner's timesheet approval covers hours only.
2. They join `COST-002, COST-006, COST-007`'s payroll files for the same people: Gusto's commission column on each workweek's row (a workweek with commissions but no time gets its own row with zero hours), one ADP RUN row per person with the owner's commission earnings code (default COMM, set to the code the owner's RUN earnings report shows), blank Pay Hours and the total in Dollars, and one QuickBooks Payroll Commission line per person and local date with the amount in an Amount column.
3. A technician with commissions but no approved time in the period is left out of the files with that reason; a 1099 subcontractor is never in them.
4. The payroll JSON gives each person's sold, completed and agreement amounts and every credited sale.
5. Commission columns, like the hour columns, are not confirmed against a live Gusto, ADP RUN or QuickBooks account; Glove pays no one.

**Evidence.** `src/glove/commissions.ts`, `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `tests/api/payroll.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Earnings are computed for the pay period when the payroll files are read, and the owner's timesheet approval covers hours only.; point 2 — They join COST-002, COST-006, COST-007's payroll files for the same people: Gusto's commission column on each workweek's row (a workweek with commissions but no time gets its own row with zero hours), one ADP RUN row per person with the owner's commission earnings code (default COMM, set to the code the owner's RUN earnings report shows), blank Pay Hours and the total in Dollars, and one QuickBooks Payroll Commission line per person and local date with the amount in an Amount column.; point 3 — A technician with commissions but no approved time in the period is left out of the files with that reason; a 1099 subcontractor is never in them.; point 4 — The payroll JSON gives each person's sold, completed and agreement amounts and every credited sale.; point 5 — Commission columns, like the hour columns, are not confirmed against a live Gusto, ADP RUN or QuickBooks account; Glove pays no one. See docs/contract/DONE-AUDIT.md for each named outcome.

### Reporting

#### REPORT-001 — Owner dashboard

Core · target · **partial**

**Requirement.** The owner's home shows today's jobs and their state, technicians on the clock, revenue booked and paid today, open quotes, unbilled completed jobs, receivables and agreements due. The [operating rules](docs/service-work-rules.md#report-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture with a fixture day checks every figure against the records it summarizes (today's tiles; each later tile is checked by its own clause's acceptance).
2. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

**Evidence.** `src/glove/dashboard.ts`, `src/glove/api.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture with a fixture day checks every figure against the records it summarizes (today's tiles; each later tile is checked by its own clause's acceptance).; point 2 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis. See docs/contract/DONE-AUDIT.md for each named outcome.

#### REPORT-002 — Job, revenue, technician and lead reports

Core · target · **partial** · From REPORT-002

**Requirement.** Job, revenue, technician and lead reports supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#report-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture builds a fixture month and checks each report's totals against the records and the CSV export; one filter per report (period, branch, technician, job type, source) narrows its totals correctly, and the sales-tax-collected report matches the invoices' tax by jurisdiction to the cent.
2. Every report takes a period of local dates in the business time zone, both ends included, and one filter, and answers as JSON or as a CSV of the same figures, read by the roles that read reports.
3. Revenue is an invoice's latest person-approved revision subtotal before tax, counted once and dated by the invoice's first approval; the revenue report gives it by month and by job type (the category of the job's first price-book line, else Uncategorized, as in `COST-004`), filtered by job type.
4. The technician report gives each technician's revenue (each such job's revenue split equally among the technicians who completed its visits, the cent remainder to the first by name), visits completed in the period, callbacks (a completed visit followed within 30 days by a new job at the same site) and their rate, and hours (their clocked shifts that began in the period, to a tenth of an hour), filtered by technician.
5. Lead-source conversion counts the requests made in the period by source (`BOOK-003`'s figures), filtered by source; the quote win rate is quotes accepted ÷ quotes answered (accepted or declined) in the period, with the won value, filtered by the request's source; job margins are `COST-004`'s period roll-up, filtered by job type.
6. The sales-tax report sums the tax on approved invoices by month in one row per branch and jurisdiction, from each invoice's frozen `MONEY-001, MONEY-004, MONEY-005` tax breakdown (an invoice approved before `MONEY-001, MONEY-004, MONEY-005`, which has no breakdown, reports its tax under the business's former single jurisdiction), and says its basis: tax on approved invoices, because Glove records no payments yet.
7. Percentages are to one decimal, rounded half up.
8. The branch filter (`TEAM-002, TEAM-004, TEAM-005`) narrows every report to one branch's records and the revenue report also gives revenue by branch; the agreements report is `PLAN-002`'s (agreements sold in the period by plan with their value, those active on the period's last day, and churn).

**Evidence.** `src/glove/reports.ts`, `src/glove/api.ts`, `src/ui/reports.tsx`, `tests/api/reports.test.mjs`, `src/glove/costing.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture builds a fixture month and checks each report's totals against the records and the CSV export; one filter per report (period, branch, technician, job type, source) narrows its totals correctly, and the sales-tax-collected report matches the invoices' tax by jurisdiction to the cent.; point 2 — Every report takes a period of local dates in the business time zone, both ends included, and one filter, and answers as JSON or as a CSV of the same figures, read by the roles that read reports.; point 3 — Revenue is an invoice's latest person-approved revision subtotal before tax, counted once and dated by the invoice's first approval; the revenue report gives it by month and by job type (the category of the job's first price-book line, else Uncategorized, as in COST-004), filtered by job type.; point 4 — The technician report gives each technician's revenue (each such job's revenue split equally among the technicians who completed its visits, the cent remainder to the first by name), visits completed in the period, callbacks (a completed visit followed within 30 days by a new job at the same site) and their rate, and hours (their clocked shifts that began in the period, to a tenth of an hour), filtered by technician.; point 5 — Lead-source conversion counts the requests made in the period by source (BOOK-003's figures), filtered by source; the quote win rate is quotes accepted ÷ quotes answered (accepted or declined) in the period, with the won value, filtered by the request's source; job margins are COST-004's period roll-up, filtered by job type.; point 6 — The sales-tax report sums the tax on approved invoices by month in one row per branch and jurisdiction, from each invoice's frozen MONEY-001, MONEY-004, MONEY-005 tax breakdown (an invoice approved before MONEY-001, MONEY-004, MONEY-005, which has no breakdown, reports its tax under the business's former single jurisdiction), and says its basis: tax on approved invoices, because Glove records no payments yet.; point 7 — Percentages are to one decimal, rounded half up.; point 8 — The branch filter (TEAM-002, TEAM-004, TEAM-005) narrows every report to one branch's records and the revenue report also gives revenue by branch; the agreements report is PLAN-002's (agreements sold in the period by plan with their value, those active on the period's last day, and churn). See docs/contract/DONE-AUDIT.md for each named outcome.

#### REPORT-004 — Report inherited payment and monthly dates

Core · target · **partial** · From REPORT-002

**Requirement.** Report inherited payment and monthly dates supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#report-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Technician close rate from field quotes (`QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`) and tax collected from payments (`PAY-002, PAY-017, PAY-018, PAY-019, PAY-020`) come with those clauses, which carry them in their text and acceptance.
2. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

**Evidence.** `src/glove/reports.ts`, `src/glove/api.ts`, `src/ui/reports.tsx`, `tests/api/reports.test.mjs`, `src/glove/costing.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Technician close rate from field quotes (QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018) and tax collected from payments (PAY-002, PAY-017, PAY-018, PAY-019, PAY-020) come with those clauses, which carry them in their text and acceptance.; point 2 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis. See docs/contract/DONE-AUDIT.md for each named outcome.

#### REPORT-003 — Receivables aging

Core · target · **partial**

**Requirement.** An aging report (current, 1–30, 31–60, 61–90, over 90 days) by customer with links to each open invoice and its reminder state. The [operating rules](docs/service-work-rules.md#report-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Invoices at every aging boundary fall into the exact customer and currency bucket, with a link to each open invoice.
2. Terms edits, export and approved corrections preserve frozen dates; an unapproved correction changes no balance.
3. The report’s JSON and CSV agree; invalid dates and forbidden branch reads are refused.
4. Payment and reminder labels show their actual recorded basis.
5. The report opens at both widths and follows an exact invoice.
6. Payment, allocation, credit and refund effects follow PAY-018 and PAY-021; reminder state follows PAY-005.
7. Fixed-monthly invoice dates follow PLAN-013.

**Evidence.** `src/glove/receivables.ts`, `tests/api/reports.test.mjs`, `tests/browser/receivables.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Invoices at every aging boundary fall into the exact customer and currency bucket, with a link to each open invoice.; point 2 — Terms edits, export and approved corrections preserve frozen dates; an unapproved correction changes no balance.; point 3 — The report’s JSON and CSV agree; invalid dates and forbidden branch reads are refused.; point 4 — Payment and reminder labels show their actual recorded basis.; point 5 — The report opens at both widths and follows an exact invoice.; point 6 — Payment, allocation, credit and refund effects follow PAY-018 and PAY-021; reminder state follows PAY-005.; point 7 — Fixed-monthly invoice dates follow PLAN-013. See docs/contract/DONE-AUDIT.md for each named outcome.

### Move-in from other systems

#### MOVE-001 — Move in from the client-and-property source system

Core · target · **partial** · From MOVE-001 · Cites BASE-DATA-001 · Register R-18

**Requirement.** Move in from the client-and-property source system supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture previews and commits a documented-shape Jobber fixture, checks open balances, recurring visits and the price book from the products and services CSV arrive, and undoes it.
2. Imported source quotes retain their source status, terms and cent-reconciled lines as read-only history; a source approval creates no Glove approval, signature, send or new job.
3. New customer decisions use a new native quote.
4. Imported invoice lines reconcile with the source amounts and balance report, including document discounts; every job belongs to the same source client, and a multi-job balance counts once.
5. Closed source jobs stay archived.
6. Job-owned notes retain source time, and downloaded job attachments retain exact bytes without fetching source URLs.
7. An unscheduled source visit is explicit pending history on its job, with no invented time or capacity reservation; the dispatcher books native work explicitly.

**Evidence.** `tests/api/movein.test.mjs`, `tests/browser/movein.spec.ts`, `tests/portable.mjs`
**Gap.** separate contact-person mapping, selected optional quote items and future recurring-rule mapping need a current version-labelled Jobber child schema or owner export that this installation does not hold. Public parent references do not define ContactModel fields, optional selection encoding or calendarRule encoding; authenticated GraphiQL access is required. Source recurrence remains inert and unsupported optional priced lines are refused, without invented selections. A real owner export is reconciled when available

#### MOVE-007 — Imported recurrence proposals

Core · target · **partial** · From MOVE-001 · Register R-18

**Requirement.** Imported recurrence proposals supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Source recurrence definitions stay visible but inactive until an exact rule mapping exists.
2. Unsupported shapes remain named in preview.

**Evidence.** `tests/api/movein.test.mjs`, `tests/browser/movein.spec.ts`, `tests/portable.mjs`
**Gap.** separate contact-person mapping, selected optional quote items and future recurring-rule mapping need a current version-labelled Jobber child schema or owner export that this installation does not hold. Public parent references do not define ContactModel fields, optional selection encoding or calendarRule encoding; authenticated GraphiQL access is required. Source recurrence remains inert and unsupported optional priced lines are refused, without invented selections. A real owner export is reconciled when available

#### MOVE-002 — Move in from the service-plan source system

Core · target · **partial** · From MOVE-002 · Register R-19

**Requirement.** Move in from the service-plan source system supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A documented-shape Housecall Pro fixture follows the complete client-and-property move-in journey.
2. Saved Housecall Pro public API responses use the existing owner-only dry run, reviewed fingerprint, source journal and guarded Undo.
3. Price-book monetary integers are cents; invoice quantities are hundredths.
4. Imported invoices retain dated remaining balances and cannot become new sales.
5. Existing source visits arrive without starting future schedules.
6. Source roles grant no sign-in.
7. Unknown fields and unsupported rules are named; nothing sends or charges.

**Evidence.** `tests/api/movein.test.mjs`, `tests/browser/movein.spec.ts`
**Gap.** service plans need a documented source export or read shape with plan identity, terms and included services; estimates, separate contacts and future recurring-rule mapping remain; real owner-export proof is recorded when available

#### MOVE-008 — Imported leads and invoice discounts

Core · target · **partial** · From MOVE-002 · Register R-19

**Requirement.** Imported leads and invoice discounts supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Housecall Pro leads retain source identity, customer and optional site, source and pipeline labels, and open, won or lost state; unknown source stage times stay unknown.
2. Invoice discounts are non-negative source cents represented as negative lines, with each item amount, gross subtotal, discounts, tax and final total reconciled before import.

**Evidence.** `tests/api/movein.test.mjs`, `tests/browser/movein.spec.ts`
**Gap.** service plans need a documented source export or read shape with plan identity, terms and included services; estimates, separate contacts and future recurring-rule mapping remain; real owner-export proof is recorded when available

#### MOVE-003 — Move in from the location-and-membership source system

Core · target · **partial** · From MOVE-003 · Register R-20

**Requirement.** Move in from the location-and-membership source system supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A documented-shape ServiceTitan fixture follows the complete client-and-property move-in journey.
2. The owner loads saved V2 response files from the location-and-membership source system and downloaded attachments through the existing move-in dry run, reviewed fingerprint, journal and guarded undo.
3. Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assignments, service and material price-book entries, notes, attachment bytes, equipment and warranties remain linked.
4. Invoice remaining balances are dated opening balances, never a new sale or an approved invoice to repost.
5. Nothing is scheduled, emailed or charged by importing.
6. A shape without an exact native rule, an unknown field, missing bytes or a rejected parent is named in the preview and its source is retained, as `MOVE-001, MOVE-007` requires.
7. `MOVE-005` retains carried QuickBooks references and the cutover checklist; `MOVE-006` retains saved methods, autopay and processor authorization; a real owner-export journey is recorded when available (`MOVE-001, MOVE-007`).

**Evidence.** `tests/api/movein.test.mjs`, `tests/browser/movein.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A documented-shape ServiceTitan fixture follows the complete client-and-property move-in journey.; point 2 — The owner loads saved V2 response files from the location-and-membership source system and downloaded attachments through the existing move-in dry run, reviewed fingerprint, journal and guarded undo.; point 3 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assignments, service and material price-book entries, notes, attachment bytes, equipment and warranties remain linked.; point 4 — Invoice remaining balances are dated opening balances, never a new sale or an approved invoice to repost.; point 5 — Nothing is scheduled, emailed or charged by importing.; point 6 — A shape without an exact native rule, an unknown field, missing bytes or a rejected parent is named in the preview and its source is retained, as MOVE-001, MOVE-007 requires.; point 7 — MOVE-005 retains carried QuickBooks references and the cutover checklist; MOVE-006 retains saved methods, autopay and processor authorization; a real owner-export journey is recorded when available (MOVE-001, MOVE-007). See docs/contract/DONE-AUDIT.md for each named outcome.

#### MOVE-009 — Imported memberships and recurrence proposals

Core · target · **partial** · From MOVE-003 · Cites BASE-ROLE-001 · Register R-20

**Requirement.** Imported memberships and recurrence proposals supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. One source membership remains one agreement, including ongoing or multiple-location terms; each source recurring-service event keeps its own site, template SKUs, quantities, exact due date and completed or source-closed state.
2. Its source billing template is labelled separately from charge permission, and unavailable member benefits are named.
3. Monthly rules with one day and weekly rules with one weekday matching their anchor map to inactive native proposals; a person explicitly chooses a technician and times before activating a mapped rule strictly after exported events, with its original end date.

**Evidence.** `tests/api/movein.test.mjs`, `tests/browser/movein.spec.ts`, `tests/portable.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — One source membership remains one agreement, including ongoing or multiple-location terms; each source recurring-service event keeps its own site, template SKUs, quantities, exact due date and completed or source-closed state.; point 2 — Its source billing template is labelled separately from charge permission, and unavailable member benefits are named.; point 3 — Monthly rules with one day and weekly rules with one weekday matching their anchor map to inactive native proposals; a person explicitly chooses a technician and times before activating a mapped rule strictly after exported events, with its original end date. See docs/contract/DONE-AUDIT.md for each named outcome.

#### MOVE-004 — Move in from the recurring-report source system and the additional job source system

Core · target · **partial** · From MOVE-004 · Register R-21

**Requirement.** Move in from the recurring-report source system and the additional job source system supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Documented-shape FieldPulse and Workiz fixtures follow the complete client-and-property move-in journey.
2. FieldPulse saved job responses may be accompanied by its documented Recurring Jobs CSV report.
3. The report's Recurring Job ID joins only exact the source recurring-parent identifier values, never customer names; conflicting or absent customer/site parents are rejected.
4. One definition remains one inactive job proposal with source frequency, anchor and end condition retained.
5. The report's last generated occurrence and every exported occurrence, including later exceptions, bound explicit activation under the existing series create action guard.
6. Exactly matching weekly weekday wording maps to a native weekly proposal; other frequencies are named as unmapped and retained without guessing (FieldPulse's absent-month-date skip must not become Glove's last-day clamp).
7. A person must choose a technician and times and explicitly confirm activation after all exported work, retaining the source end condition.
8. No import schedules, charges or sends anything.

**Evidence.** `tests/api/movein.test.mjs`, `tests/browser/movein.spec.ts`, `tests/portable.mjs`
**Gap.** Workiz future recurring-rule export/read encoding needed; FieldPulse recurring-report definition and guarded activation are proven

#### MOVE-010 — Additional-source move-in and cutover

Core · target · **partial** · From MOVE-004 · Register R-22

**Requirement.** Additional-source move-in and cutover supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A Workiz source rule is mapped only from its documented encoding; an unavailable encoding remains explicitly unmapped.
2. MOVE-005 retains accounting references, agreements/equipment and cutover; MOVE-006 retains saved methods, autopay and processor authorization.

**Evidence.** `tests/api/movein.test.mjs`, `tests/browser/movein.spec.ts`, `tests/portable.mjs`
**Gap.** Workiz future recurring-rule export/read encoding needed; FieldPulse recurring-report definition and guarded activation are proven

#### MOVE-005 — Open balances, agreements and equipment carried over

Core · target · **partial**

**Requirement.** Every kit carries open invoice balances (as opening balances that the documented refusal does not post twice), every accounting reference the source kept (the QuickBooks Online customer, item and invoice IDs its sync wrote, used by `LEDGER-004` to link rather than re-post), active agreements with remaining entitlements and renewal dates, installed equipment, and saved cards, bank accounts and autopay authorizations (`MOVE-006`); a guided cutover checklist tells the owner what to switch off in the old system and when, including the payment processor's export request and its freeze window. The [operating rules](docs/service-work-rules.md#move-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture moves in a fixture with open balances and an active agreement, checks balances and entitlements and the carried QuickBooks IDs, and checks the QuickBooks fake receives no duplicate invoice; the cutover checklist lists the processor export request and the freeze window.

**Evidence.** `tests/api/movein.test.mjs`, `tests/browser/movein.spec.ts`
**Gap.** ServiceTitan carries dated opening balances (not reposted), one agreement per membership with per-event entitlements, and equipment with warranties; FieldPulse, Workiz, Jobber and Housecall Pro carry opening balances. ServiceM8 now reconciles completed sent invoices against active source payments into dated opening balances, retains rejected-job payment custody for customer export and erasure, and proves the owner journey with unconditional phone overflow checks. No kit carries documented source QuickBooks customer, item and invoice IDs for `LEDGER-004` linking, so the carried-ID no-duplicate assertion remains unproved. ServiceM8 agreements, equipment, original due-date mapping and balance-specific restore proof remain unproved, as do agreement and equipment coverage for the other kits beyond ServiceTitan. The owner’s Move in screen and `IMPORT.md` now provide the cutover guide: secure processor export request, the export-to-import freeze window and recollection of intervening card updates, old-system shutdown, final dated reconciliation, confirmed accounting links, and held renewals without a verified method. No processor transfer or saved-method activation is claimed.  Workiz serialId, ServiceTitan referenceNumber and Housecall Pro invoice_number remain separate from prefixed Glove display numbers, allowing existing QuickBooks invoices to be reviewed and linked without reposting. These document numbers are not QuickBooks record IDs. Source QuickBooks customer, item and invoice IDs still require a provider-documented export field and remain uncarried; carried-ID matching and its no-duplicate assertion remain unproved under LEDGER-004. The checked ServiceTitan catalog externalId identifies an original catalog item, not an accounting record, and must not be treated as a QuickBooks ID. Saved methods and authorizations remain with MOVE-006.

#### MOVE-006 — Saved cards and autopay carried over

Core · target · **missing**

**Requirement.** Each kit carries every moved-in customer's autopay: the agreements and recurring jobs that charged a saved card or bank account. Card and bank numbers move processor to processor, never through Glove: the `MOVE-005` cutover checklist tells the owner to request the old processor's export to Stripe (Stripe's PAN import, about 10 business days) and names the freeze window between export and import, in which card updates made in the old system are lost and must be collected again. When Stripe completes the import, the owner loads Stripe's mapping file (old customer and card IDs to new Stripe customer and payment-method IDs); Glove attaches each imported method to its moved-in customer and to the agreements or recurring jobs it paid, keeping the original authorization reference, consent date and source as the `PAY-008, PAY-027, PAY-028, PAY-029, PAY-030` authorization record. Glove lists every autopay agreement or recurring job with no migrated method, sends those customers a tracked card-update link (`COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`, `COMM-002`) before their next charge, and shows who has updated. A renewal or recurring charge with no method is held as "needs payment method" with a reminder, never charged and never counted as a failed payment for dunning. The [operating rules](docs/service-work-rules.md#move-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture moves in a fixture with 10 autopay agreements, loads a Stripe-fake mapping file matching 7, and checks those 7 carry the imported method and original authorization reference and renew with a charge; the other 3 are listed with update links queued before their next charge date, their renewals charge nothing and enter no dunning, and one customer's update link saves a method that the next renewal charges; the cutover checklist shows the processor export request and the freeze window.

**Evidence.** None.
**Gap.** no saved payment methods or autopay; the ServiceM8 kit carries no payment data (`src/glove/movein/servicem8.ts`)

### Integrations and API

#### API-001 — Documented HTTP API

Core · target · **partial** · Cites BASE-DOCS-001, BASE-INPUT-001

**Requirement.** Every read and command people use is a documented HTTP door ([API.md](API.md)) that agents and integrations call under the same roles and checks. The [operating rules](docs/service-work-rules.md#api-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Each documented service-work read and command can be called through the HTTP door with the same product outcome as its screen.

**Evidence.** `API.md`, `tests/api/flows.test.mjs`, `tests/api/security.test.mjs`, `tests/api/subcontract.test.mjs`, `tests/api/push.test.mjs`, `tests/api/suggest.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Each documented service-work read and command can be called through the HTTP door with the same product outcome as its screen. See docs/contract/DONE-AUDIT.md for each named outcome.

#### API-002 — Webhooks and integration tokens

Core · target · **partial** · From API-002 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-OPS-003, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Webhooks and integration tokens supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#api-002-operating-rules) retain the record formats and calculations. Recorded decisions: RL-21.

**Acceptance.**
1. A fixture issues a dispatcher-scoped token, is refused an owner command with it, and receives signed webhooks for a booked visit and a paid invoice, with a retried failed delivery.
2. Only the owner issues (token issue action) and revokes (token revoke action) integration tokens.
3. A token acts as one role: Dispatcher, Office, Agent, Viewer or one of the owner's custom roles, never Owner, Technician or Subcontractor (field roles act for a person on their own visits).
4. Without the chosen branch it reaches every branch; with a branch id, or main for the main business, it is limited like a branch-limited person (`TEAM-002, TEAM-004, TEAM-005`).
5. The token (glv_ and 43 base64url characters from 32 random bytes) appears once, in the issuing response; Glove keeps only its SHA-256, never in records, the saved command outcome a replay returns, Activity, exports or the portable archive (restored installations issue new tokens).
6. A request with Authorization: Bearer <token> acts as that role through every read and command door, without the same-origin check sessions need.
7. What a token changes is in Activity under "<name> (integration token)" with its role; the owner's token list shows each token's role, branch, issue time, last use (every request) and revocation, never the token or its hash.

**Evidence.** `src/glove/tokens.ts`, `src/glove/access.ts`, `src/ui/integration-tokens.tsx`, `tests/api/tokens.test.mjs`, `tests/api/security.test.mjs`
**Gap.** signed webhooks wait on the Base egress door with the resolved-address check (gr-base-285)

#### API-006 — Integration policy and workflow authority

Core · target · **partial** · From API-002 · Cites BASE-AGENT-005, BASE-OPS-003, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Integration policy and workflow authority supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#api-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Agent-token changes to other tokens, roles, assignments, grants or branch limits carry access; provider-key or calendar-credential changes carry security.
2. The company’s policy decides within the sponsor’s current authority.
3. A workflow rule a token created runs as that token's current role and branch, and is logged "not allowed" once the token is revoked.

**Evidence.** `src/glove/tokens.ts`, `src/glove/access.ts`, `src/ui/integration-tokens.tsx`, `tests/api/tokens.test.mjs`, `tests/api/security.test.mjs`
**Gap.** signed webhooks wait on the Base egress door with the resolved-address check (gr-base-285)

#### API-007 — Signed webhook delivery

Core · target · **missing** · From API-002 · Cites BASE-OPS-003, BASE-SECRET-001

**Requirement.** Signed webhook delivery supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#api-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A booked visit and a paid invoice produce signed webhook events, with retries and an operator delivery log.
2. Delivery validates the resolved destination at use time and preserves the refusal boundary if the address changes.

**Evidence.** `src/glove/tokens.ts`, `src/glove/access.ts`, `src/ui/integration-tokens.tsx`, `tests/api/tokens.test.mjs`, `tests/api/security.test.mjs`
**Gap.** Signed webhook delivery remains unbuilt pending adoption of the Base egress door with destination resolution at use time. Integration-token and workflow-rule behavior is delivered separately in API-002 and API-006.

#### API-003 — Zapier and Crank apps

Core · target · **missing**

**Requirement.** Published Zapier and Crank apps expose Glove's triggers and actions (create request, create customer, new paid invoice) for cross-app automation. The [operating rules](docs/service-work-rules.md#api-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The published Zapier and Crank apps each execute their declared Glove triggers and actions against a running installation.

**Evidence.** None.
**Gap.** no published apps

#### API-004 — CompanyCam photos

Core · target · **partial** · From API-004 · Cites BASE-DATA-001, BASE-INPUT-003, BASE-SECRET-001

**Requirement.** CompanyCam photos supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#api-004-operating-rules) retain the record formats and calculations. Recorded decisions: RL-22.

**Acceptance.**
1. A fixture links a CompanyCam project (fake) and checks photos flow both ways once.
2. The owner saves or disconnects a CompanyCam Public API access token as an installation secret, excluded from state, exports, logs and archives.
3. Saving it is labelled unverified.
4. The owner or dispatcher links a job to an existing project by numeric id; its recorded address must match the site's address after case, whitespace and punctuation normalization, without claiming postal validation.
5. Imports and exports are explicit actions on that job.
6. Imports consume every cursor page, retain provider photo ids and capture times, and show original photos with captions labelled CompanyCam, never as technician arrival or sign-off.
7. The existing Glove JPEG/PNG/WebP and 1.5 MB photo limits apply, with a visible error for every unsupported, oversized or unready photo; none is silently skipped.
8. Repeating an import creates no second copy.

**Evidence.** `src/glove/commands/companycam.ts`, `src/glove/companycam/client.ts`, `src/glove/companycam/uploads.ts`, `src/ui/companycam.tsx`, `tests/api/companycam.test.mjs`, `tests/browser/companycam.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture links a CompanyCam project (fake) and checks photos flow both ways once.; point 2 — The owner saves or disconnects a CompanyCam Public API access token as an installation secret, excluded from state, exports, logs and archives.; point 3 — Saving it is labelled unverified.; point 4 — The owner or dispatcher links a job to an existing project by numeric id; its recorded address must match the site's address after case, whitespace and punctuation normalization, without claiming postal validation.; point 5 — Imports and exports are explicit actions on that job.; point 6 — Imports consume every cursor page, retain provider photo ids and capture times, and show original photos with captions labelled CompanyCam, never as technician arrival or sign-off.; point 7 — The existing Glove JPEG/PNG/WebP and 1.5 MB photo limits apply, with a visible error for every unsupported, oversized or unready photo; none is silently skipped.; point 8 — Repeating an import creates no second copy. See docs/contract/DONE-AUDIT.md for each named outcome.

#### API-008 — CompanyCam export and reconciliation

Core · target · **partial** · From API-004 · Cites BASE-DATA-001, BASE-INPUT-003, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** CompanyCam export and reconciliation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#api-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A selected original Glove photo sends only its bytes and caption to that project; no customer identity, contacts, job prices or other fields are sent.
2. A durable, current-authority-checked reservation precedes the upload.
3. Its provider photo id and caption outcome are kept; repeating a send never sends that photo again.
4. An uncertain upload is labelled “outcome unknown; check CompanyCam” and is never resent.
5. The owner can reconcile it to an existing photo in the same project only after its original-byte SHA-256 matches; this confirms the photo without claiming any unconfirmed caption.
6. Exported photos do not loop back into the job; a photo matching an uncertain upload is held with a visible reconciliation error.
7. Link, import and export outcomes and provider ids are audited on the job; whole-business export and the portable archive retain references and upload reservations, never the token.

**Evidence.** `src/glove/commands/companycam.ts`, `src/glove/companycam/client.ts`, `src/glove/companycam/uploads.ts`, `src/ui/companycam.tsx`, `tests/api/companycam.test.mjs`, `tests/browser/companycam.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A selected original Glove photo sends only its bytes and caption to that project; no customer identity, contacts, job prices or other fields are sent.; point 2 — A durable, current-authority-checked reservation precedes the upload.; point 3 — Its provider photo id and caption outcome are kept; repeating a send never sends that photo again.; point 4 — An uncertain upload is labelled “outcome unknown; check CompanyCam” and is never resent.; point 5 — The owner can reconcile it to an existing photo in the same project only after its original-byte SHA-256 matches; this confirms the photo without claiming any unconfirmed caption.; point 6 — Exported photos do not loop back into the job; a photo matching an uncertain upload is held with a visible reconciliation error.; point 7 — Link, import and export outcomes and provider ids are audited on the job; whole-business export and the portable archive retain references and upload reservations, never the token. See docs/contract/DONE-AUDIT.md for each named outcome.

#### API-005 — Workflow rules

Core · target · **partial** · Cites BASE-OPS-004, BASE-ROLE-001

**Requirement.** The owner sets rules of the form "when this happens, do that" on Glove's own events (when a job with the "commercial" tag completes, assign the invoice to a named office person; when a quote over $5,000 is approved, notify the owner; when a request comes from Angi, apply its lead cost), each with a run log and an on/off switch; a rule can do only what its creator's role can. The [operating rules](docs/service-work-rules.md#api-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture creates two rules, triggers each, checks the run log and effect, and checks a rule created by an office person cannot book a visit.
2. The owner and the office make rules (rule save action); a rule's creator or the owner changes it or turns it off.
3. A rule has a trigger among Glove's own events (a request created, a quote's price approved, a job created, a job completed), an optional condition (the request's source; the quote's or job's total over an amount, tax included) and one action: an in-app notice to a desk role or to one named person who holds a desk role , booking a job just created with a technician a number of days later at set times, or assigning a job just completed's invoice preparation to one named person who prepares invoices (the owner or an office person), shown on the job with a notice to them.
4. After every command, each enabled rule whose trigger that command raised runs once, as its creator's current role checked at run time through the same command checks: an action that role cannot take is logged "not allowed" and does nothing, and a booking with a conflict is logged "refused" (a rule never confirms a conflict review).
5. Every run is logged with the rule and its version, the triggering record, the outcome and why, and is shown with the rules on the Rules screen; what a rule does never triggers another rule.
6. A customer-tag condition comes with `CUST-004, CUST-006`, and applying a lead cost (the request’s lead cost, on enquiry created action) with `BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017`, which carry them in their text and acceptance.

**Evidence.** `src/glove/rules.ts`, `src/glove/api.ts`, `src/ui/rules.tsx`, `tests/api/rules.test.mjs`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture creates two rules, triggers each, checks the run log and effect, and checks a rule created by an office person cannot book a visit.; point 2 — The owner and the office make rules (rule save action); a rule's creator or the owner changes it or turns it off.; point 3 — A rule has a trigger among Glove's own events (a request created, a quote's price approved, a job created, a job completed), an optional condition (the request's source; the quote's or job's total over an amount, tax included) and one action: an in-app notice to a desk role or to one named person who holds a desk role , booking a job just created with a technician a number of days later at set times, or assigning a job just completed's invoice preparation to one named person who prepares invoices (the owner or an office person), shown on the job with a notice to them.; point 4 — After every command, each enabled rule whose trigger that command raised runs once, as its creator's current role checked at run time through the same command checks: an action that role cannot take is logged "not allowed" and does nothing, and a booking with a conflict is logged "refused" (a rule never confirms a conflict review).; point 5 — Every run is logged with the rule and its version, the triggering record, the outcome and why, and is shown with the rules on the Rules screen; what a rule does never triggers another rule.; point 6 — A customer-tag condition comes with CUST-004, CUST-006, and applying a lead cost (the request’s lead cost, on enquiry created action) with BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017, which carry them in their text and acceptance. See docs/contract/DONE-AUDIT.md for each named outcome.

### Data, privacy and operations

#### DATA-001 — Customer privacy requests and erasure

Core · target · **partial** · From DATA-001 · Cites BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-DATA-005, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Customer privacy requests and erasure supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-001-operating-rules) retain the record formats and calculations. Recorded decisions: RL-23.

**Acceptance.**
1. A fixture exports one customer's data, erases them, checks every personal field and file is gone while invoice totals and tax records remain, and checks a restored older backup cannot bring them back.
2. Only a signed-in owner without branch limits, never an integration token or custom role, requests whole-customer export or explicitly confirms erasure.
3. The request closes over every merged identity and its receipt lists every merged ID.
4. Export includes related records, full timeline and base64 original files/certificates; shared CSV/ServiceM8 sources are projected to this customer’s complete source rows/objects, never peer records, with any mixed-ownership source omission explicitly named; its download is shown only in that response, never in saved command outcomes.
5. Erasure removes personal operational records, attached originals and certificate chunks/evidence, customer-link credentials, delivery-recipient/event copies, personal timeline text and command results.
6. Anonymous customer/site/job placeholders, invoice amounts/dates/classifications, job costs and tax totals remain; erased records cannot be edited or unmerged.
7. The Base redaction checkpoint and transfer invalidation commit atomically with the erasure; the destination fence or a trusted later post-erasure backup supplied as the import journal refuses an older checkpoint.
8. A fresh offline destination cannot discover an erasure without that trusted later journal; the owner is told to keep it.

**Evidence.** `tests/api/privacy.test.mjs`, `tests/browser/journey.spec.ts`, `tests/portable.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture exports one customer's data, erases them, checks every personal field and file is gone while invoice totals and tax records remain, and checks a restored older backup cannot bring them back.; point 2 — Only a signed-in owner without branch limits, never an integration token or custom role, requests whole-customer export or explicitly confirms erasure.; point 3 — The request closes over every merged identity and its receipt lists every merged ID.; point 4 — Export includes related records, full timeline and base64 original files/certificates; shared CSV/ServiceM8 sources are projected to this customer’s complete source rows/objects, never peer records, with any mixed-ownership source omission explicitly named; its download is shown only in that response, never in saved command outcomes.; point 5 — Erasure removes personal operational records, attached originals and certificate chunks/evidence, customer-link credentials, delivery-recipient/event copies, personal timeline text and command results.; point 6 — Anonymous customer/site/job placeholders, invoice amounts/dates/classifications, job costs and tax totals remain; erased records cannot be edited or unmerged.; point 7 — The Base redaction checkpoint and transfer invalidation commit atomically with the erasure; the destination fence or a trusted later post-erasure backup supplied as the import journal refuses an older checkpoint.; point 8 — A fresh offline destination cannot discover an erasure without that trusted later journal; the owner is told to keep it. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DATA-005 — Customer erasure inheritance

Core · target · **partial** · From DATA-001 · Cites BASE-DATA-003, BASE-DATA-005

**Requirement.** Customer erasure inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. QUOTE-005, QUOTE-015 proves its snapshot/attachment erasure in the document flow; future MOVE-001, MOVE-007..006, QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018, COMM-002/005/006/009, PAY-002, PAY-017, PAY-018, PAY-019, PAY-020/004/007/008/009 and LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007..004 inherit their additional personal stores before shipping.
2. Outside copies and holds are DATA-005.

**Evidence.** `tests/api/privacy.test.mjs`, `tests/browser/journey.spec.ts`, `tests/portable.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — QUOTE-005, QUOTE-015 proves its snapshot/attachment erasure in the document flow; future MOVE-001, MOVE-007..006, QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018, COMM-002/005/006/009, PAY-002, PAY-017, PAY-018, PAY-019, PAY-020/004/007/008/009 and LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007..004 inherit their additional personal stores before shipping.; point 2 — Outside copies and holds are DATA-005. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DATA-006 — Shared import-source erasure

Core · target · **partial** · From DATA-001 · Cites BASE-DATA-003, BASE-DATA-005

**Requirement.** Shared import-source erasure supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. An import source can hold one person's customer and site in one record and several people's originals in one artifact.
2. Erasure first produces a preview bound to the customer group's current version.
3. The preview gives counts per store and names: each import batch whose Undo/resume will be retired and why, each shared original artifact that will be withdrawn, and the number of peer customers whose source file becomes unavailable.
4. Confirmation repeats the preview's fingerprint, and a stale preview is refused.
5. The subject's records in every affected batch become zero-effect tombstones, so peers' Undo and resume keep working.
6. A batch's whole Undo/source custody is retired only when the import kit cannot tombstone the record or a batch header holds the subject's exact value; its source is then labelled withdrawn.
7. A withdrawn shared artifact is removed whole.
8. Peers keep their per-record source payloads and their exports name the byte-exact file as an omission.

**Evidence.** `tests/api/privacy.test.mjs`, `tests/browser/journey.spec.ts`, `tests/portable.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — An import source can hold one person's customer and site in one record and several people's originals in one artifact.; point 2 — Erasure first produces a preview bound to the customer group's current version.; point 3 — The preview gives counts per store and names: each import batch whose Undo/resume will be retired and why, each shared original artifact that will be withdrawn, and the number of peer customers whose source file becomes unavailable.; point 4 — Confirmation repeats the preview's fingerprint, and a stale preview is refused.; point 5 — The subject's records in every affected batch become zero-effect tombstones, so peers' Undo and resume keep working.; point 6 — A batch's whole Undo/source custody is retired only when the import kit cannot tombstone the record or a batch header holds the subject's exact value; its source is then labelled withdrawn.; point 7 — A withdrawn shared artifact is removed whole.; point 8 — Peers keep their per-record source payloads and their exports name the byte-exact file as an omission. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DATA-007 — Peer redaction and device erasure fences

Core · target · **partial** · From DATA-001 · Cites BASE-DATA-003, BASE-DATA-005

**Requirement.** Peer redaction and device erasure fences supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Subject values are the group's exact typed identifiers (name, email, phone, address, contact name/phone/email, certificate number).
2. Peer-owned records that mention them have only those values redacted and are never deleted.
3. Rewritten identifiers are keyed or random, never a plain hash of a personal value.
4. No send or remote deletion happens.
5. At the next successful device refresh, value-free fences remove the earlier assignee's cached day, photo cache and queued captures for erased visits; losing an assignment alone never discards late evidence.
6. A disconnected device cannot observe erasure until it reconnects.

**Evidence.** `tests/api/privacy.test.mjs`, `tests/browser/journey.spec.ts`, `tests/portable.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Subject values are the group's exact typed identifiers (name, email, phone, address, contact name/phone/email, certificate number).; point 2 — Peer-owned records that mention them have only those values redacted and are never deleted.; point 3 — Rewritten identifiers are keyed or random, never a plain hash of a personal value.; point 4 — No send or remote deletion happens.; point 5 — At the next successful device refresh, value-free fences remove the earlier assignee's cached day, photo cache and queued captures for erased visits; losing an assignment alone never discards late evidence.; point 6 — A disconnected device cannot observe erasure until it reconnects. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DATA-008 — Privacy delegation and agent erasure

Core · target · **partial** · From DATA-001 · Cites BASE-DATA-003, BASE-DATA-005, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Privacy delegation and agent erasure supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Only a signed-in owner without branch limits confirms today.
2. A TEAM-001 privacy permission may later delegate the door.
3. Agents may prepare a request for a person's decision under GLOVE-10/AGENT-009.
4. A token or agent never records a person’s confirmation.
5. An agent’s own erasure act carries destructive and sensitive, with the company’s policy deciding the call under its sponsor’s authority.

**Evidence.** `tests/api/privacy.test.mjs`, `tests/browser/journey.spec.ts`, `tests/portable.mjs`, `tests/api/customer-quotes.test.mjs`, `tests/browser/customer-quotes.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Only a signed-in owner without branch limits confirms today.; point 2 — A TEAM-001 privacy permission may later delegate the door.; point 3 — Agents may prepare a request for a person's decision under GLOVE-10/AGENT-009.; point 4 — A token or agent never records a person’s confirmation.; point 5 — An agent’s own erasure act carries destructive and sensitive, with the company’s policy deciding the call under its sponsor’s authority. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DATA-002 — Every change, message and payment recorded

Core · target · **partial** · From DATA-002 · Cites BASE-AUDIT-001, BASE-OPS-005

**Requirement.** Every change, message and payment recorded supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-002-operating-rules) retain the record formats and calculations. Recorded decisions: RL-24.

**Acceptance.**
1. Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule actions, calendar reads, audience pushes, model responses, CompanyCam photo syncs and Web Push setup/subscription/removal/outcomes, and find each current kind with who, when and what changed in Activity and the business export.
2. The browser journey loads an older provider outcome in Activity at 1440 and 390.
3. Future communication, payment and accounting flows assert their new kinds before shipping under the carriers below.
4. DONE covers every current capability.
5. Every committed Glove command must supply an explicit timeline event; an eventless command is refused before its changes commit.
6. An event keeps its actual person/agent/rule-creator identity, time, command id, subject and effect.
7. The command's first event also keeps the ids, before/after versions and changed field names of its changed records, without copying private field values.

**Evidence.** `src/glove/storage.ts`, `src/glove/timeline.ts`, `src/glove/activity.ts`, `src/ui/activity.tsx`, `tests/api/records.test.mjs`, `tests/api/segments.test.mjs`, `tests/api/push.test.mjs`, `tests/api/eligibility.test.mjs`, `tests/api/suggest.test.mjs`, `tests/api/companycam.test.mjs`, `tests/api/rules.test.mjs`, `tests/api/stock.test.mjs`, `tests/api/purchasing.test.mjs`, `tests/browser/companycam.spec.ts`, `src/glove/rules.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule actions, calendar reads, audience pushes, model responses, CompanyCam photo syncs and Web Push setup/subscription/removal/outcomes, and find each current kind with who, when and what changed in Activity and the business export.; point 2 — The browser journey loads an older provider outcome in Activity at 1440 and 390.; point 3 — Future communication, payment and accounting flows assert their new kinds before shipping under the carriers below.; point 4 — DONE covers every current capability.; point 5 — Every committed Glove command must supply an explicit timeline event; an eventless command is refused before its changes commit.; point 6 — An event keeps its actual person/agent/rule-creator identity, time, command id, subject and effect.; point 7 — The command's first event also keeps the ids, before/after versions and changed field names of its changed records, without copying private field values. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DATA-009 — Audit record projections and provider facts

Core · target · **partial** · From DATA-002 · Cites BASE-AUDIT-001, BASE-OPS-005, BASE-ROLE-001

**Requirement.** Audit record projections and provider facts supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Activity's changed-record details follow the same current visibility as the underlying records.
2. Provider response facts identify the provider and a generic outcome, never credentials, endpoints, keys or payloads; current model, audience, CompanyCam and Web Push outcomes are recorded separately so the fact survives a lost final command commit.
3. Web Push records subscription/technician/job ids and HTTP status only, including 404/410 and unreachable services; it never claims delivery to the phone.
4. Subscription setup/removal, marketing disconnects, custom-field/tag/segment edits, stock locations, purchase-order revisions and rule changes/runs have their own explicit events.
5. Activity loads older events by sequence, with current role/job checks on every page; its loaded history is discarded when the installation change version or reader changes.

**Evidence.** `src/glove/storage.ts`, `src/glove/timeline.ts`, `src/glove/activity.ts`, `src/ui/activity.tsx`, `tests/api/records.test.mjs`, `tests/api/segments.test.mjs`, `tests/api/push.test.mjs`, `tests/api/eligibility.test.mjs`, `tests/api/suggest.test.mjs`, `tests/api/companycam.test.mjs`, `tests/api/rules.test.mjs`, `tests/api/stock.test.mjs`, `tests/api/purchasing.test.mjs`, `tests/browser/companycam.spec.ts`, `src/glove/rules.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Activity's changed-record details follow the same current visibility as the underlying records.; point 2 — Provider response facts identify the provider and a generic outcome, never credentials, endpoints, keys or payloads; current model, audience, CompanyCam and Web Push outcomes are recorded separately so the fact survives a lost final command commit.; point 3 — Web Push records subscription/technician/job ids and HTTP status only, including 404/410 and unreachable services; it never claims delivery to the phone.; point 4 — Subscription setup/removal, marketing disconnects, custom-field/tag/segment edits, stock locations, purchase-order revisions and rule changes/runs have their own explicit events.; point 5 — Activity loads older events by sequence, with current role/job checks on every page; its loaded history is discarded when the installation change version or reader changes. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DATA-010 — Future audit inheritance

Core · target · **partial** · From DATA-002 · Cites BASE-AUDIT-001, BASE-OPS-005

**Requirement.** Future audit inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Every future clause adding a capability, provider, record kind or door inherits this obligation.
2. The absent customer-message/call/portal kinds are carried by COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018/002/005/006/009, payments/refunds/payouts/office charges by PAY-002, PAY-017, PAY-018, PAY-019, PAY-020/004/007/009, and accounting syncs by LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007/002/003/004, each named in its text and acceptance.
3. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

**Evidence.** `src/glove/storage.ts`, `src/glove/timeline.ts`, `src/glove/activity.ts`, `src/ui/activity.tsx`, `tests/api/records.test.mjs`, `tests/api/segments.test.mjs`, `tests/api/push.test.mjs`, `tests/api/eligibility.test.mjs`, `tests/api/suggest.test.mjs`, `tests/api/companycam.test.mjs`, `tests/api/rules.test.mjs`, `tests/api/stock.test.mjs`, `tests/api/purchasing.test.mjs`, `tests/browser/companycam.spec.ts`, `src/glove/rules.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Every future clause adding a capability, provider, record kind or door inherits this obligation.; point 2 — The absent customer-message/call/portal kinds are carried by COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018/002/005/006/009, payments/refunds/payouts/office charges by PAY-002, PAY-017, PAY-018, PAY-019, PAY-020/004/007/009, and accounting syncs by LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007/002/003/004, each named in its text and acceptance.; point 3 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis. See docs/contract/DONE-AUDIT.md for each named outcome.

#### DATA-003 — Hosted on the owner's own Cloudflare account

Core · target · **partial** · Cites BASE-BACKUP-001, BASE-DATA-001, BASE-INSTALL-001, BASE-OPS-002, BASE-SECRET-002

**Requirement.** rer deploy puts Glove on the owner's Cloudflare account with their domain, backups and the provider secrets above, and the hosted installation passes the same acceptance flows as a local one. The [operating rules](docs/service-work-rules.md#data-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A hosted deployment runs the API flow suite against its own URL and a restore from its backup.

**Evidence.** `wrangler.jsonc`, `deploy.json`
**Gap.** Glove runs locally; no hosted deployment has been accepted

#### DATA-004 — Free, open source and run on the owner's own computer

Core · target · **partial** · Cites BASE-DATA-005, BASE-INSTALL-001

**Requirement.** Glove is MIT-licensed, and its self-hosted installation completes the trade-service journey on the owner’s computer. The [operating rules](docs/service-work-rules.md#data-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. In a fresh local installation, the owner, dispatcher, technician and office complete the service-work journey.

**Evidence.** `LICENSE`, `tests/browser/run.mjs`, `tests/browser/journey.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — In a fresh local installation, the owner, dispatcher, technician and office complete the service-work journey. See docs/contract/DONE-AUDIT.md for each named outcome.

### Agents that run the job

#### AGENT-001 — AI front office for calls and texts

Core · push-further · **missing** · Cites BASE-AUDIT-001

**Requirement.** The front-office agent answers the business's calls and texts 24/7 (always, after hours or on overflow, by owner setting), speaks and writes like the business, identifies the caller and their property, qualifies the problem, quotes flat-rate prices from the price book, and books into a real open slot (`BOOK-002, BOOK-011, BOOK-012, BOOK-013`, `DISP-006`), then texts the confirmation; every call and thread gets a written summary, and the lead's details (name, address, problem, equipment, urgency) are extracted onto the request. Its data is the price book, technician capacity, skills and areas, the customer's history and equipment, and the owner's call script and policies. Internal intake and reversible booking carry standard; customer replies and confirmations carry external, charges carry money and binding offers carry commitment. The company’s policy decides what runs or needs a person. A provider step requiring a person carries gated. The [operating rules](docs/service-work-rules.md#agent-001-operating-rules) retain the record formats and calculations. Owning-capability boundaries: COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.

**Acceptance.**
1. A fixture books a tune-up into the right slot, refuses an out-of-policy price and hands it to the office, and transfers a gas-smell call within the owner's limit.
2. An inbound text thread is answered by the agent and books a slot, with the confirmation text sent.
3. With the mode set to after hours, a call inside business hours rings the office and the agent does not answer; with overflow, the agent answers only a call the office leaves ringing past the owner's limit.
4. Every call transcript and text thread opens with the automated-assistant disclosure; saying or texting "talk to a person" transfers the call, or hands the thread to the office inbox.
5. The request carries the extracted name, address, problem and urgency, and the call, transcript, thread, summary and booking are on the customer timeline.
6. `AGENT-005, AGENT-014` drafts a quote from a request the agent took with the call's transcript in its evidence (model fake).
7. a booking the front office makes is assigned automatically.

**Evidence.** None.
**Gap.** no telephony or answering agent

#### AGENT-002 — Ready-to-dispatch check the day before

Core · push-further · **missing**

**Requirement.** For each next-day visit, the coordinator confirms access (gate codes, pets, who will be home) with the customer by text, checks the parts the job needs are on the van or at the supplier, and that permits, deposits and equipment history are in place; marks each visit ready or not ready with the reason. Its data is tomorrow's visits, customer threads, van stock, purchase orders and the job's quote lines. Readiness preparation is standard; outside access or parts requests carry external and a binding supplier order carries commitment. The company’s policy decides every such call. The [operating rules](docs/service-work-rules.md#agent-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture with five next-day visits (provider fakes) gets one access confirmation, one missing part and one unanswered customer, and checks the ready board and the three proposals.

**Evidence.** None.
**Gap.** no ready-to-dispatch agent: no next-day access confirmation by text (no SMS, `COMM-002`), no ready or not-ready marking with its reason, no ready board and no proposals to the dispatcher; the agent can read `STOCK-001`'s parts check and job purchase orders (`STOCK-002`), which are those clauses' doors, not this workflow

#### AGENT-003 — Rebook around delays

Core · push-further · **partial** · From AGENT-003

**Requirement.** Rebook around delays supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-003-operating-rules) retain the record formats and calculations. Recorded decisions: RL-25.

**Acceptance.**
1. Under the held company policy, a long-running job leads the agent to prepare a move of the next visit to another technician; the dispatcher approves that exact move and the customer’s confirmation reply lands on the visit.
2. The delay watch (the desk and agents; never field roles) watches today's signals that exist.
3. A booked visit not yet arrived is at risk when its technician is still on an earlier visit that day after that visit's booked end (a running `COST-001` job timer, or arrival without completion): Glove expects them free at the moment of reading plus the overrun so far, at least 15 minutes, and flags their later visits that day starting before then.
4. A visit is also at risk while a purchase order for its job (`STOCK-002`) is not fully received.
5. For an overrun, the watch offers each other active technician free at the same planned time (same branch, skills, areas, time off, calendars and other visits checked; cancelled visits free their slots), then the same technician at the expected free time rounded up to 15 minutes.
6. The agent (or the owner or a dispatcher) prepares a move as a proposal (proposal prepare action); under the held company policy, someone other than the preparer approves the exact move with GLOVE-07 conflict review; a visit changed since preparation needs a new proposal.
7. A move that keeps the planned time, or keeps the start inside the visit's arrival window (`DISP-006`) on the same day, keeps that window; any other move drops it and is labelled "customer not yet asked".

**Evidence.** `src/glove/delays.ts`, `src/glove/commands/dispatch.ts`, `src/glove/commands/grants.ts`, `src/ui/dispatch-cards.tsx`, `tests/api/delays.test.mjs`
**Gap.** Old evidence asserts delay reasons, feasible move options, a dispatcher-decided move, grant-scoped same-day moves and retained arrival windows. Company-policy selection for standard moves and external customer texts is unasserted; the fixed proposal/grant paths prove neither the all-autonomous company policy nor the external send. Customer confirmation/refusal and moved-visit messaging remain COMM-002/COMM-005 proof gaps. The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Under the held company policy, a long-running job leads the agent to prepare a move of the next visit to another technician; the dispatcher approves that exact move and the customer’s confirmation reply lands on the visit.; point 2 — The delay watch (the desk and agents; never field roles) watches today's signals that exist.; point 3 — A booked visit not yet arrived is at risk when its technician is still on an earlier visit that day after that visit's booked end (a running COST-001 job timer, or arrival without completion): Glove expects them free at the moment of reading plus the overrun so far, at least 15 minutes, and flags their later visits that day starting before then.; point 4 — A visit is also at risk while a purchase order for its job (STOCK-002) is not fully received.; point 5 — For an overrun, the watch offers each other active technician free at the same planned time (same branch, skills, areas, time off, calendars and other visits checked; cancelled visits free their slots), then the same technician at the expected free time rounded up to 15 minutes.; point 6 — The agent (or the owner or a dispatcher) prepares a move as a proposal (proposal prepare action); under the held company policy, someone other than the preparer approves the exact move with GLOVE-07 conflict review; a visit changed since preparation needs a new proposal.; point 7 — A move that keeps the planned time, or keeps the start inside the visit's arrival window (DISP-006) on the same day, keeps that window; any other move drops it and is labelled "customer not yet asked". See docs/contract/DONE-AUDIT.md for each named outcome.

#### AGENT-010 — Granted moves and customer response

Core · push-further · **partial** · From AGENT-003 · Cites BASE-ROLE-001

**Requirement.** Granted moves and customer response supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Within the AGENT-009 resource and action grant, the same-day, same-technician move keeps its arrival window and its start inside it; the company’s policy decides the standard-class call.
2. A changed window is a distinct action with its own authority and computed facts.
3. The customer's confirmation by reply and the agent's text are carried by `COMM-002` and `COMM-005`, technician locations by `DISP-005, DISP-012`, each naming `AGENT-003, AGENT-010` in its text and acceptance; customer preferences join when a clause records them.

**Evidence.** `src/glove/delays.ts`, `src/glove/commands/dispatch.ts`, `src/glove/commands/grants.ts`, `src/ui/dispatch-cards.tsx`, `tests/api/delays.test.mjs`
**Gap.** Old evidence asserts delay reasons, feasible move options, a dispatcher-decided move, grant-scoped same-day moves and retained arrival windows. Company-policy selection for standard moves and external customer texts is unasserted; the fixed proposal/grant paths prove neither the all-autonomous company policy nor the external send. Customer confirmation/refusal and moved-visit messaging remain COMM-002/COMM-005 proof gaps. The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Within the AGENT-009 resource and action grant, the same-day, same-technician move keeps its arrival window and its start inside it; the company’s policy decides the standard-class call.; point 2 — A changed window is a distinct action with its own authority and computed facts.; point 3 — The customer's confirmation by reply and the agent's text are carried by COMM-002 and COMM-005, technician locations by DISP-005, DISP-012, each naming AGENT-003, AGENT-010 in its text and acceptance; customer preferences join when a clause records them. See docs/contract/DONE-AUDIT.md for each named outcome.

#### AGENT-004 — Chase every invoice until paid and reconciled

Core · push-further · **partial** · From AGENT-004

**Requirement.** Chase every invoice until paid and reconciled supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-004-operating-rules) retain the record formats and calculations. Recorded decisions: RL-26.

**Acceptance.**
1. An unbilled job produces an invoice draft, an overdue invoice produces its purpose-bound reminder sequence, and an unreconciled payment produces a source-linked comparison.
2. Under the held company policy, a consequential accounting call waits for the named person’s exact-revision decision.
3. The invoice chase uses current consent, recipient, dispute, quiet-hour and zero-balance facts; changing the initiator never bypasses a reserved send.
4. A retained payment comparison names its approved invoice, accepted job amount, field evidence and accounting outcome; unknown provider state stays an inspection question.
5. An uncertain accounting operation is inspected without resending it.

**Evidence.** `src/glove/collection-agent.ts`, `src/glove/reminders.ts`, `tests/api/flows.test.mjs`
**Gap.** Owner-only retained payout comparison is implemented; the future agent payout authority design is unbuilt. Complete current-books discovery and fee and deposit posting readback remain unproved; retained outcomes are not fresh provider verification Gap retained after CT ruling: The present Owner-only policy is decided; separately scoped future agent payout reads remain unbuilt and unproved. Complete current-books discovery and fee and deposit posting readback remain unproved, and retained outcomes do not prove fresh provider verification.

#### AGENT-011 — Payment inspection decision has no posting effect

Core · push-further · **partial** · From AGENT-004 · Cites BASE-DATA-003, BASE-ROLE-001

**Requirement.** Payment inspection decision has no posting effect supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. An inspection decision retains its actual recorder and the preparer as distinct people under the held company policy.
2. Approving the inspection alone creates no posting, credit or payment; any consequential call uses its own authority and company-policy decision.
3. The proposal retains branch custody and is removed by customer erasure.

**Evidence.** `src/glove/collection-agent.ts`, `src/glove/reminders.ts`, `tests/api/flows.test.mjs`
**Gap.** Owner-only retained payout comparison is implemented; the future agent payout authority design is unbuilt. Complete current-books discovery and fee and deposit posting readback remain unproved; retained outcomes are not fresh provider verification Gap retained after CT ruling: The present Owner-only policy is decided; separately scoped future agent payout reads remain unbuilt and unproved. Complete current-books discovery and fee and deposit posting readback remain unproved, and retained outcomes do not prove fresh provider verification.

#### AGENT-012 — Retained payout comparison

Core · push-further · **partial** · From AGENT-004 · Cites BASE-DATA-003

**Requirement.** Retained payout comparison supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A signed-in owner without branch limits compares the retained payout or recorded deposit against current source amounts, fees, invoices and payment outcomes.
2. A missing retained posting remains a question, not proof of a missing bank entry; comparing a retained snapshot makes no fresh provider request.
3. Unchanged comparison reuses its proposal; changed source records require a new comparison.
4. A comparison records no posting, credit, refund or money movement.
5. Customer erasure removes personal aggregate proposals.

**Evidence.** `src/glove/collection-agent.ts`, `src/glove/reminders.ts`, `tests/api/flows.test.mjs`
**Gap.** Owner-only retained payout comparison is implemented; the future agent payout authority design is unbuilt. Complete current-books discovery and fee and deposit posting readback remain unproved; retained outcomes are not fresh provider verification Gap retained after CT ruling: The present Owner-only policy is decided; separately scoped future agent payout reads remain unbuilt and unproved. Complete current-books discovery and fee and deposit posting readback remain unproved, and retained outcomes do not prove fresh provider verification.

#### AGENT-013 — Payout comparison authority boundary

Core · push-further · **partial** · From AGENT-004 · Cites BASE-ROLE-001

**Requirement.** Payout comparison authority boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The retained provider-wide inspection follows RL-1 and grants no future coordinator access.
2. Future provider-wide agent access requires its separately scoped authority design; the complete invoice and reconciliation target remains binding.

**Evidence.** `src/glove/collection-agent.ts`, `src/glove/reminders.ts`, `tests/api/flows.test.mjs`
**Gap.** Owner-only retained payout comparison is implemented; the future agent payout authority design is unbuilt. Complete current-books discovery and fee and deposit posting readback remain unproved; retained outcomes are not fresh provider verification Gap retained after CT ruling: The present Owner-only policy is decided; separately scoped future agent payout reads remain unbuilt and unproved. Complete current-books discovery and fee and deposit posting readback remain unproved, and retained outcomes do not prove fresh provider verification.

#### AGENT-005 — Quote writer from the request

Core · push-further · **partial** · From AGENT-005

**Requirement.** Quote writer from the request supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-005-operating-rules) retain the record formats and calculations. Recorded decisions: RL-27.

**Acceptance.**
1. A fixture drafts a quote for a 15-year-old furnace request (model fake) and checks three options from the price book with reasons, under the held company policy, held as a draft until the named person approves.
2. The agent, the owner or a dispatcher asks for a draft on a new or contacted request that names its site, once the owner has connected the model provider (`FIELD-006, FIELD-011`).
3. The owner's provider receives, with store off and a strict answer schema, exactly: the request's description as entered and its source; the site's equipment (type, make, model, install and manufacture dates, age in whole years from the install date, else the manufacture date, to today in the business time zone, refrigerant) with each unit's earlier completed visits' dates and work summaries; the property's past job titles with their completed visits' summaries; and the active price book (code, name, the description customers see, unit, price before tax).
4. Never costs or markups, the customer's name, contacts, billing or site address, technician names or serial numbers.
5. Request photos are added separately only under BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010’s consent, owner, metadata, training and withdrawal controls.
6. The answer is a job title and three options, Good, Better and Best, each one to 20 lines of an active price-book code and a quantity (more than 0, up to three decimals) and a reason.
7. Any other code, quantity or shape refuses the whole answer, with nothing saved, repaired or retried.
8. Glove saves it as a draft quote on the request (the request becomes quoted) at the price book's prices, with each option's reason and the label "Drafted by the model from the request.

**Evidence.** `src/glove/commands/suggest.ts`, `src/ui/quotes.tsx`, `tests/api/suggest.test.mjs`, `src/glove/provider.ts`
**Gap.** Old evidence asserts three priced options, reasons, bounded model data and fixed Agent-role refusal to approve or send, followed by dispatcher price approval. Company-policy selection for standard drafting, commitment price decisions and external sending is unasserted; the fixed human gate does not prove the all-autonomous company policy. Authorized photo use follows BOOK-001/RL-101, whose proof boundaries remain. The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture drafts a quote for a 15-year-old furnace request (model fake) and checks three options from the price book with reasons, under the held company policy, held as a draft until the named person approves.; point 2 — The agent, the owner or a dispatcher asks for a draft on a new or contacted request that names its site, once the owner has connected the model provider (FIELD-006, FIELD-011).; point 3 — The owner's provider receives, with store off and a strict answer schema, exactly: the request's description as entered and its source; the site's equipment (type, make, model, install and manufacture dates, age in whole years from the install date, else the manufacture date, to today in the business time zone, refrigerant) with each unit's earlier completed visits' dates and work summaries; the property's past job titles with their completed visits' summaries; and the active price book (code, name, the description customers see, unit, price before tax).; point 4 — Never costs or markups, the customer's name, contacts, billing or site address, technician names or serial numbers.; point 5 — Request photos are added separately only under BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010’s consent, owner, metadata, training and withdrawal controls.; point 6 — The answer is a job title and three options, Good, Better and Best, each one to 20 lines of an active price-book code and a quantity (more than 0, up to three decimals) and a reason.; point 7 — Any other code, quantity or shape refuses the whole answer, with nothing saved, repaired or retried.; point 8 — Glove saves it as a draft quote on the request (the request becomes quoted) at the price book's prices, with each option's reason and the label "Drafted by the model from the request. See docs/contract/DONE-AUDIT.md for each named outcome.

#### AGENT-014 — Quote decision classes and evidence handoff

Core · push-further · **partial** · From AGENT-005

**Requirement.** Quote decision classes and evidence handoff supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Under the held company policy, a person approves each option’s price before sending.
2. An agent’s binding price decision carries commitment, and sending carries external; the company’s policy decides these calls, with truthful attribution.
3. Quote evidence includes separately consented sanitized request photos under BOOK-008, BOOK-009 and BOOK-010, and the front-office call transcript under AGENT-001, preserving each source’s disclosure limits.

**Evidence.** `src/glove/commands/suggest.ts`, `src/ui/quotes.tsx`, `tests/api/suggest.test.mjs`, `src/glove/provider.ts`
**Gap.** Old evidence asserts three priced options, reasons, bounded model data and fixed Agent-role refusal to approve or send, followed by dispatcher price approval. Company-policy selection for standard drafting, commitment price decisions and external sending is unasserted; the fixed human gate does not prove the all-autonomous company policy. Authorized photo use follows BOOK-001/RL-101, whose proof boundaries remain. The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Under the held company policy, a person approves each option’s price before sending.; point 2 — An agent’s binding price decision carries commitment, and sending carries external; the company’s policy decides these calls, with truthful attribution.; point 3 — Quote evidence includes separately consented sanitized request photos under BOOK-008, BOOK-009 and BOOK-010, and the front-office call transcript under AGENT-001, preserving each source’s disclosure limits. See docs/contract/DONE-AUDIT.md for each named outcome.

#### AGENT-006 — Repeat-callback diagnosis

Core · push-further · **partial** · Cites BASE-AUDIT-001

**Requirement.** The callback-diagnosis agent gathers the equipment history, earlier photos, readings, materials and manufacturer manual for a recently serviced property, then prepares a diagnosis checklist and parts plan. Evidence gathering and an advisory checklist carry standard; provider-bound disclosure adds external. The company’s policy decides those calls. A licensed technician’s diagnosis and actual certification are recorded as their own acts. The [operating rules](docs/service-work-rules.md#agent-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture raises a callback on a condenser with two prior visits and checks the prepared checklist cites both visits' readings.
2. A new job (from a quote or a service call, which can name the site's equipment) is a callback when a unit it names had a visit on another job completed within the 30 days before the job was made, counted on the server's received completion time, the window `REPORT-002, REPORT-004` counts callbacks in; the job carries that flag and its timeline says so.
3. The agent (or the owner or a dispatcher) prepares the checklist with the owner's model provider (`FIELD-006, FIELD-011`'s connection): Glove gathers the unit's record, manual, photos and every earlier completed visit on it (form readings with their ranges and out-of-range flags, refrigerant, notes, materials), oldest first, each visit and reading with a reference; the model gets the equipment and visit evidence and photo captions only, never customer names, contacts or addresses.
4. Every checklist step and part must cite references the pack holds, and Glove resolves each citation to the recorded reading; an answer that cites nothing or anything else is refused and nothing is kept.
5. The prepared checklist is labelled advisory (the licensed technician diagnoses and decides the work; it is not a safety certification), decides no work, and is read by the desk and the technicians assigned to the callback job.

**Evidence.** `src/glove/callbacks.ts`, `src/glove/commands/callbacks.ts`, `src/glove/provider.ts`, `src/ui/nameplates.tsx`, `tests/api/callbacks.test.mjs`
**Gap.** The audit records 9 separately asserted outcome(s). Complete proof is not located for point 2 — A new job (from a quote or a service call, which can name the site's equipment) is a callback when a unit it names had a visit on another job completed within the 30 days before the job was made, counted on the server's received completion time, the window REPORT-002, REPORT-004 counts callbacks in; the job carries that flag and its timeline says so.; point 3 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model provider (FIELD-006, FIELD-011's connection): Glove gathers the unit's record, manual, photos and every earlier completed visit on it (form readings with their ranges and out-of-range flags, refrigerant, notes, materials), oldest first, each visit and reading with a reference; the model gets the equipment and visit evidence and photo captions only, never customer names, contacts or addresses.; point 4 — Every checklist step and part must cite references the pack holds, and Glove resolves each citation to the recorded reading; an answer that cites nothing or anything else is refused and nothing is kept.; point 5 — The prepared checklist is labelled advisory (the licensed technician diagnoses and decides the work; it is not a safety certification), decides no work, and is read by the desk and the technicians assigned to the callback job. See docs/contract/DONE-AUDIT.md for each named outcome.

#### AGENT-007 — Keep every maintenance agreement fulfilled

Core · push-further · **partial** · From AGENT-007 · Cites BASE-ROLE-001

**Requirement.** Keep every maintenance agreement fulfilled supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture with 20 due visits checks offers sent, 12 booked by customer reply, chases for the rest, and a flag on a completed visit with no maintenance form.
2. The Agent, Owner or Dispatcher explicitly calls agreement.prepare for one currently visible agreement.
3. Completed native entitlements compare each job's frozen form copies with captures of that same copy on a visit belonging to that same job, attributed to an assigned technician.
4. Late captures count only after desk review.
5. Missing copies produce source-linked flags; later genuine accepted evidence refreshes the same preparation, while old preparation is labelled stale.
6. Unchanged inspection and command replay create no duplicate preparation.
7. Current role, branch and global Agent pause apply, including replay; the atomic commit rechecks authority and the installation revision.
8. The desk's completed-maintenance section links to the actual job evidence.

**Evidence.** `tests/api/agreements.test.mjs`, `tests/browser/due-visits.spec.ts`
**Gap.** Agent-originated offers, the 20-visit outreach journey, 12 bookings by customer reply, remaining chases and renewal outreach are unbuilt. Their standard, external, commitment and money calls must follow the company policy; RL-102 supplies the shared messaging rule. Existing agreement.offer remains desk-only. Imported completion evidence without attributable native captures remains unavailable.

#### AGENT-015 — Maintenance inspection custody

Core · push-further · **partial** · From AGENT-007 · Cites BASE-AUDIT-001, BASE-DATA-003

**Requirement.** Maintenance inspection custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Preparation is internal inspection only and grants no sending, booking, price or term change.
2. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erasure removes personal preparation records and saved outcomes and scrubs personal timeline copies; DATA-002, DATA-009, DATA-010 keeps attributable inspection, source references and actual effect in Activity and business export.
3. Unknown imported completion evidence is unavailable, never fabricated.

**Evidence.** `tests/api/agreements.test.mjs`, `tests/browser/due-visits.spec.ts`
**Gap.** Agent-originated offers, the 20-visit outreach journey, 12 bookings by customer reply, remaining chases and renewal outreach are unbuilt. Their standard, external, commitment and money calls must follow the company policy; RL-102 supplies the shared messaging rule. Existing agreement.offer remains desk-only. Imported completion evidence without attributable native captures remains unavailable.

#### AGENT-008 — Morning brief and margin watch

Core · push-further · **partial** · From AGENT-008

**Requirement.** Morning brief and margin watch supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture with a fixture day checks every item in the brief matches its records and links to its action, and opening it sends no email or push.
2. A fixture opens Glove and reads the brief.
3. `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018` inherits morning email delivery with a provider-outcome assertion.
4. Glove prepares the brief itself from its records (no model), for the owner only, at the owner brief and on the owner's Today screen, for the business's local date at the moment it is read (at= reads it as of another UTC moment); it writes nothing.
5. At risk today: visits on that local date, not cancelled or completed, with no technician, not arrived 15 minutes after their start, or arrived and still open at or after their planned end (action: Dispatch).
6. Unbilled: completed jobs whose invoice is missing (Prepare invoice) or still a draft (Approve invoice).
7. Over estimate: open jobs whose actual cost exceeds a non-zero estimated cost as `COST-004` computes them (Review job costs); `COST-005` margin warnings stay the live watch.
8. Leads waiting: requests still new or contacted 24 hours or more after entering that stage (Contact the customer / Quote the request).

**Evidence.** `src/glove/morning-brief.ts`, `tests/api/morning-brief.test.mjs`, `tests/browser/morning-brief.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — A fixture with a fixture day checks every item in the brief matches its records and links to its action, and opening it sends no email or push.; point 2 — A fixture opens Glove and reads the brief.; point 3 — COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 inherits morning email delivery with a provider-outcome assertion.; point 4 — Glove prepares the brief itself from its records (no model), for the owner only, at the owner brief and on the owner's Today screen, for the business's local date at the moment it is read (at= reads it as of another UTC moment); it writes nothing.; point 5 — At risk today: visits on that local date, not cancelled or completed, with no technician, not arrived 15 minutes after their start, or arrived and still open at or after their planned end (action: Dispatch).; point 6 — Unbilled: completed jobs whose invoice is missing (Prepare invoice) or still a draft (Approve invoice).; point 7 — Over estimate: open jobs whose actual cost exceeds a non-zero estimated cost as COST-004 computes them (Review job costs); COST-005 margin warnings stay the live watch.; point 8 — Leads waiting: requests still new or contacted 24 hours or more after entering that stage (Contact the customer / Quote the request). See docs/contract/DONE-AUDIT.md for each named outcome.

#### AGENT-016 — Brief delivery and financial sections

Core · push-further · **partial** · From AGENT-008

**Requirement.** Brief delivery and financial sections supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The brief is shown when the owner opens Glove and sends nothing by being opened; `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018` emails it to the owner once per business-local date only when the owner turns that on (mail morning action, off by default), with the delivery outcome asserted in its flow, and nothing is pushed.
2. The brief lists overdue invoices with their invoice links and proposed collection action under PAY-004, PAY-021, PAY-022, PAY-023’s balance rules.
3. PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 now lists outstanding due included visits with their agreement and Dispatch links, asserted in its named flow.
4. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

**Evidence.** `src/glove/morning-brief.ts`, `tests/api/morning-brief.test.mjs`, `tests/browser/morning-brief.spec.ts`
**Gap.** The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — The brief is shown when the owner opens Glove and sends nothing by being opened; COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 emails it to the owner once per business-local date only when the owner turns that on (mail morning action, off by default), with the delivery outcome asserted in its flow, and nothing is pushed.; point 2 — The brief lists overdue invoices with their invoice links and proposed collection action under PAY-004, PAY-021, PAY-022, PAY-023’s balance rules.; point 3 — PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 now lists outstanding due included visits with their agreement and Dispatch links, asserted in its named flow.; point 4 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis. See docs/contract/DONE-AUDIT.md for each named outcome.

#### AGENT-009 — Agent policy and scoped authority

Core · push-further · **partial** · Cites BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** The owner controls named-agent authority through scoped grants and Pause. A grant identifies its agent and permitted actions, service or visit scope, and any business limits the person sets. Other-agent grant changes carry access with their widening or narrowing direction. The company’s policy decides those calls within the sponsor’s authority. Each operation records the grant it used. The [operating rules](docs/service-work-rules.md#agent-009-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Under a company policy that permits the named coordinator’s tune-up bookings below $200 and blocks higher values, a permitted booking records its grant and policy, a $250 booking is refused, revocation stops the next booking, and the person’s Pause stops every agent.

**Evidence.** `src/glove/commands/grants.ts`, `src/glove/api.ts`, `src/ui/agent-grants.tsx`, `tests/api/grants.test.mjs`, `tests/api/security.test.mjs`
**Gap.** Old evidence asserts an explicit owner grant, its booking uses and $200 limit, revocation and Pause. A complete company policy with computed classes, its numbered decision record and selectable dispositions is unasserted; fixed grant defaults and role refusals do not prove that policy. The audit records 0 separately asserted outcome(s). Complete proof is not located for point 1 — Under a company policy that permits the named coordinator’s tune-up bookings below $200 and blocks higher values, a permitted booking records its grant and policy, a $250 booking is refused, revocation stops the next booking, and the person’s Pause stops every agent. See docs/contract/DONE-AUDIT.md for each named outcome.

## Agent surface

### Agent surface

#### SURFACE-001 — Service-work registry coverage

Agent surface · target · **missing** · From new · Cites BASE-AGENT-002, BASE-AGENT-006, BASE-AGENT-013 · Register R-5, R-6, R-7, R-8

**Requirement.** The service coordinator exposes the table’s service-work jobs through the same action registry used by Glove screens and embedded agents.

**Acceptance.**
1. Every Core id in the table or the stated not-tool boundaries is present in discovery, including new parts of a split capability.
2. Quote, dispatch, invoice and maintenance fixtures yield the same Glove revision and business outcome through their UI action and tool.
3. The existing embedded front-office, collection, quote, callback and brief workflows identify their calls by these registry jobs.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-002 — The linked service-work resources

Agent surface · target · **missing** · From new · Cites BASE-AGENT-003

**Requirement.** The resources preserve Glove’s customer, property, work and accounting relationships without turning a customer bearer into general business access.

**Acceptance.**
1. A request links its customer, site and assessment; its quote links the exact priced and chosen revisions.
2. A completed visit links its job, assigned worker, captured originals, forms and immutable customer report.
3. An invoice links its approved revision, related stages, credits and confirmed payment effects; an agreement links its entitlements and due visits.
4. The customer-facing signed-copy resource returns the same immutable bytes as the owning quote or report door; a desk-only original stays separate.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-003 — Invoice and commitment classification

Agent surface · target · **missing** · From new · Cites BASE-AGENT-006, BASE-AGENT-007, BASE-AGENT-008

**Requirement.** Glove classifies the financial and binding effect of the exact requested service-work action.

**Acceptance.**
1. A payment, refund, credit allocation or payout call computes money with its frozen amount, currency and actual counterparty.
2. A quote decision, invoice approval, change-order application, agreement acceptance or supplier order that binds the business computes commitment with its exact revision, value and counterparty.
3. A draft that changes no amount owed or paid remains standard; calling a charge a draft does not remove money.
4. A call with both a binding decision and a charge carries commitment and money, and the company policy decides that combined call.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-004 — Customer and provider disclosure classification

Agent surface · target · **missing** · From new · Cites BASE-AGENT-006, BASE-AGENT-007

**Requirement.** Glove computes exposure from the actual service document, recipient and destination.

**Acceptance.**
1. Email, SMS, supplier orders, provider-bound request photos and newly issued customer links compute external with the recipient count and actual counterparty.
2. A saved customer or supplier is known, an unrecognized recipient is new and an open link is public.
3. An internal draft remains standard; exposing its attachment or customer-facing report outside the business adds external.
4. Changing a recipient or a provider invalidates the earlier disclosure facts and recomputes the call’s classes.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-005 — Staff and protective-setting classification

Agent surface · target · **missing** · From new · Cites BASE-AGENT-005, BASE-AGENT-006, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Glove classifies the authority and protective settings changed by the action.

**Acceptance.**
1. Inviting a worker, changing a branch or custom role, granting a current-shift position view or changing another agent’s grant computes access with the affected people and widening or narrowing direction.
2. Changing a provider key, callback authenticator or protective setting computes security with the connection or setting.
3. A change that combines a new grant and its credential carries access and security together.
4. The service coordinator cannot widen its own authority through a dispatch, role, policy or Pause operation, including under the all-autonomous company policy.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-006 — Irreversible and regulated-data classification

Agent surface · target · **missing** · From new · Cites BASE-AGENT-003, BASE-AGENT-006, BASE-DATA-003, BASE-SECRET-001

**Requirement.** Glove distinguishes reversible work from irreversible removal and regulated financial or payroll data.

**Acceptance.**
1. Customer erasure and irrevocable voiding compute destructive with the exact item count; a reversible draft edit remains standard.
2. A payroll-number, customer-tax-identifier, bank or payment-credential operation computes sensitive with the record count and data kind.
3. Erasing a customer with such data carries destructive and sensitive; the retained anonymous financial totals remain visible as the erasure clause requires.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-007 — Outside-resource and provider-step classification

Agent surface · target · **missing** · From new · Cites BASE-AGENT-006, BASE-AGENT-008, BASE-SECRET-001

**Requirement.** Glove classifies external resources and provider-controlled personal steps before attempting them.

**Acceptance.**
1. Creating or ordering a business number, outside account or paid provider resource computes accounts with the provider and resource.
2. Hosted customer card entry, merchant verification, a personal consent screen or terms accepted in a person’s name computes gated with the provider and exact step.
3. A provider answer requiring a person adds gated to the same pending job; a company-credential route remains subject to the company’s policy.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-008 — Live-service and reversible-work classification

Agent surface · target · **missing** · From new · Cites BASE-AGENT-006, BASE-AGENT-007, BASE-SECRET-001

**Requirement.** Glove derives standard and live from the actual work changed.

**Acceptance.**
1. Reversible internal request, quote, visit, stock and expense edits compute standard with their affected item count.
2. Changing active public intake, call routing or running workflow rules computes live with the service affected.
3. A public-intake change that newly discloses information carries live and external; a credential change on that service also carries security.
4. A customer request claiming that its recipient is internal does not remove external from the resulting customer message; a note claiming that a charge is confirmed does not remove money.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-009 — Service-provider cost facts

Agent surface · target · **missing** · From new · Cites BASE-AGENT-011

**Requirement.** Provider-backed service coordination reports the actual model, SMS, mail and map costs covered by the company’s spend rules.

**Acceptance.**
1. Quote-photo and equipment-nameplate analysis, callback diagnosis, customer messages and route calculation expose their provider estimate before the call.
2. Usage separates the cost of model analysis, SMS, mail and mapping from customer amounts collected and supplier amounts committed.
3. A zero-cost internal draft remains available independently of a provider-spend cap.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-010 — Service-work event handoffs

Agent surface · target · **missing** · From new · Cites BASE-AGENT-010, BASE-ROLE-001

**Requirement.** The event graph lets the coordinator resume the specific service-work record that changed.

**Acceptance.**
1. A customer quote decision points to the winning exact revision; a payment change points to its invoice and provider outcome.
2. A completed job makes the unbilled-work job available; a due entitlement makes the maintenance-booking job available.
3. Consent withdrawal and an invoice reaching zero make later purpose-bound outreach ineligible before the next send.
4. A ledger or payroll handoff carries the owning record and actual outcome without granting authority to unrelated customer records.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-011 — A stranger coordinator runs a seeded service week

Agent surface · target · **missing** · From new · Cites BASE-AGENT-007, BASE-AGENT-009, BASE-AGENT-013

**Requirement.** A stranger agent given only the seed URL completes the linked service-work week through MCP under two complete company policies.

**Acceptance.**
1. The week takes a new service request through quote options, booking into real capacity, technician evidence, an approved invoice and provider-confirmed test collection.
2. It also handles one late visit, one refund or credit reconciliation and one due maintenance visit, retaining the exact customer and job links.
3. Under the all-autonomous company policy every declared class is autonomous, no call waits for a person and none is refused by policy.
4. Under the held company policy standard is review and every other declared class is approval; the signed-in test person takes precisely the returned approval steps.
5. The week’s class facts and decisions reconcile with the actual quote, visit, invoice, payment and maintenance effects under each policy.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-012 — Existing front-office work uses company policy

Agent surface · target · **missing** · From new · Cites BASE-AGENT-002, BASE-AGENT-007, BASE-AGENT-008

**Requirement.** The existing embedded-agent jobs and an outside service coordinator take the same company policy for their classed calls.

**Acceptance.**
1. An agent-prepared quote, dispatch proposal and invoice run under each of the company’s chosen dispositions without a seed-selected approval rule.
2. A delay move and its customer text compute the visit change and external disclosure separately and apply the current company policy.
3. A collection step that changes money or a binding business decision carries money or commitment even when prepared by the embedded agent.
4. After a person decides an agent-prepared action, the work record retains that person’s decision and the agent’s preparation as distinct acts.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-013 — Coordinator documentation and operating overview

Agent surface · target · **missing** · From new · Cites BASE-AGENT-009, BASE-AGENT-013, BASE-DATA-003

**Requirement.** The coordinator’s on-site guide and operating overview name the service-work tools, resources and computed classes above.

**Acceptance.**
1. The guide lets a stranger find the incoming-work, dispatch, collection and maintenance prompts and the exact records each job needs.
2. The fixture week’s overview separates customer money, provider spend, outbound recipients, binding decisions and erased items while linking each total to its Glove work records.

**Evidence.** None.
**Gap.** The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt.

#### SURFACE-014 — Native price-book MCP transport

Agent surface · target · **partial** · From BASE-AGENT-001 · Cites BASE-AGENT-001

**Requirement.** The service coordinator reaches Glove’s native price-book subset through the shared MCP door.

**Acceptance.**
1. Read the Glove catalogue and perform an existing-item update through both supported MCP eras.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** Released Base 5381ab872b5ab4de80e811bcb4b1a803dd713e0f and rer 0.2.87 serve both supported MCP eras for the declared price-book subset. Base still advertises resource subscriptions and installs events.list unconditionally; declared-subset capability selection awaits Base. Full service-coordinator transport coverage is not claimed.

#### SURFACE-015 — Native price-book action parity

Agent surface · target · **partial** · From BASE-AGENT-002 · Cites BASE-AGENT-002

**Requirement.** The price-book registry joins internal catalogue inspection, existing-item edits, category markups and category price adjustments to Glove’s desk actions.

**Acceptance.**
1. Each declared price-book operation gives the same native record state and Activity effect as its desk action; the wider service-work registry remains the target of SURFACE-001.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** Only internal inspection and existing-item, category-markup and category-price updates are registered. Client-bearing tools await the agreed retained-client custody, redaction and atomic erasure mapping required by Base ADOPTING.md and DATA-001. The broader ct service-work surface is not adopted.

#### SURFACE-016 — Native price-book resources

Agent surface · target · **partial** · From BASE-AGENT-003 · Cites BASE-AGENT-003

**Requirement.** The coordinator reads price-book items and the catalogue with Glove’s native cost visibility.

**Acceptance.**
1. Read an item and the catalogue as the permitted native roles, with category markups visible only to roles that read costs.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** Only native price-book item and catalogue resources are declared. Client-bearing record resources and the optional resource-refresh family are undeclared pending custody integration.

#### SURFACE-017 — Native sponsor identity binding

Agent surface · target · **partial** · From BASE-AGENT-004 · Cites BASE-AGENT-004

**Requirement.** Business owner and team identities bind to Glove’s immutable native operator identities.

**Acceptance.**
1. The current native account, branch limits and cost visibility govern the price-book call after identity or email changes; absent or inactive mappings confer no native identity.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** Owner-bound subjects use signed owner_id and team-id mappings to current native ids. Multi-sponsor conformance is undeclared. Unknown/inactive/allow-list-excluded sponsor and email-change negative journeys are not yet asserted by the supplied core harness; no completion claim is made for them.

#### SURFACE-018 — Native price-book authority

Agent surface · target · **partial** · From BASE-AGENT-005 · Cites BASE-AGENT-005

**Requirement.** Glove’s role, custom-permission, branch and cost-visibility rules govern the declared native operations.

**Acceptance.**
1. Read and edit the native price book through the same allowed and refused role cases as the desk; an integration token does not become a Business sponsor.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** Declared tools retain current native role, custom-permission, branch and cost-visibility fences. Access/security tools, escalation/narrowing fixtures and the broader field/project journeys remain unadopted; no fake widening operation is registered.

#### SURFACE-019 — Native price-book class facts

Agent surface · target · **partial** · From BASE-AGENT-006 · Cites BASE-AGENT-006

**Requirement.** Internal catalogue inspection and reversible price-book changes carry standard with their native affected-item count.

**Acceptance.**
1. Catalogue inspection, existing-item editing, category markup and category price adjustment compute standard from the native operation and affected items, without changing customer decisions or invoking providers.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** Declared price-book effects compute standard from their native internal operations. External, money, commitment, accounts, gated, access, security, destructive, sensitive and live tool families remain unadopted; caller flags and imported text confer no authority.

#### SURFACE-020 — Native price-book company policy

Agent surface · target · **partial** · From BASE-AGENT-007 · Cites BASE-AGENT-007

**Requirement.** Glove applies the company’s policy to admitted native price-book operations.

**Acceptance.**
1. Run the declared price-book sequence under autonomous, held, unset and blocked company policies and observe the native records and Activity outcomes.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** The signed policy receiver and autonomy, review, unset, Pause, revocation and unchanged-state refusals are asserted for the declared set. The Base standard-only held-policy journey exercises review, not named approval; a standard-class approval variant and broader service-work approval journeys remain unproved.

#### SURFACE-021 — Native price-book attribution

Agent surface · target · **partial** · From BASE-AGENT-008 · Cites BASE-AGENT-008

**Requirement.** Native price-book history distinguishes the service coordinator, its sponsoring native person and any company approver.

**Acceptance.**
1. Read the changed price-book item’s native Activity and exported record with the agent and sponsor distinct; any actual company approver remains a separate person.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** Native Activity and door audit retain the agent for the current native sponsor; record-change events carry separate identities and company approvers. Native human approval and Undo proof are undeclared because no such native operation is registered in this subset.

#### SURFACE-022 — Native price-book activity custody

Agent surface · target · **partial** · From BASE-AGENT-009 · Cites BASE-AGENT-009

**Requirement.** The declared price-book operations retain their native Activity alongside the shared door audit.

**Acceptance.**
1. Read the admitted price-book changes and refused attempts in the operating overview and native Activity without introducing client-bearing service-work content.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** Declared tool and resource reads, mutations and refusals are audited with zero differs_from_policy in conformance. Client-bearing private reads and the broader service-week audit remain unadopted pending custody integration.

#### SURFACE-023 — Native price-book event scope

Agent surface · target · **partial** · From BASE-AGENT-010 · Cites BASE-AGENT-010

**Requirement.** The coordinator follows internal price-book and shared-door changes while the wider service-work handoffs remain under SURFACE-010.

**Acceptance.**
1. Read retained price-book and shared-door event identities after the declared catalogue changes; full service-work subscriptions retain their separate target.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** The events/subscriptions family is undeclared. Base forces the compatibility events.list entry; only internal price-book and shared-door events are visible. The full Glove service-work event graph, handoffs and subscriptions are not adopted.

#### SURFACE-024 — Native price-book Pause fences

Agent surface · target · **partial** · From BASE-AGENT-011 · Cites BASE-AGENT-011

**Requirement.** Native price-book actions honor Glove’s native agent Pause together with shared local and Business Pause.

**Acceptance.**
1. Pause each control and observe unchanged native price-book records on the next attempted change, then resume as a person and complete the admitted change.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** Business Pause, shared local Pause, native agent Pause and consent revocation guard declared effects. Spend is none; provider costs, spend reservations, byte budgets and queued native provider effects are undeclared and unproved.

#### SURFACE-025 — Native price-book replay and revisions

Agent surface · target · **partial** · From BASE-AGENT-012 · Cites BASE-AGENT-012

**Requirement.** Glove binds price-book changes to native record revisions and command outcomes.

**Acceptance.**
1. Retry an existing-item or category change once, read one native effect, and refuse changed arguments or a stale native revision without another effect.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** Declared native mutations prove once-only replay, changed-argument conflict and stale revision refusal, with transactional current-authority and Pause fences. Long jobs, queued provider execution and uncertain-provider recovery are undeclared; no resend claim is made.

#### SURFACE-026 — Native price-book conformance scope

Agent surface · target · **partial** · From BASE-AGENT-013 · Cites BASE-AGENT-013

**Requirement.** Glove’s declared price-book manifest and its coordinator instructions describe the implemented native subset.

**Acceptance.**
1. A coordinator reads the item and catalogue, changes an existing item, sets a category markup and adjusts that category through the declared door under both company policies; the full service week remains SURFACE-011.

**Evidence.** `agent-surface.json`, `tests/initialize-agent-owner.mjs`, `tests/agent-native-journey.mjs`; normal rer 0.2.87 verify with the foundation shard passed 700/700 BASE-AGENT points, including native person/tool readback under both policies, current native revision preconditions, independent audit targets, revision/key conflicts, once-only replay, measured bulk effects, Pause, resource policy and attributable Activity.
**Gap.** The manifest exactly matches the declared registry, including Base-forced events.list, and its current journey is green. It does not cover the full ct service-coordinator tool/resource/class/week journey. Optional multi-sponsor, resource-refresh, mail/provider and event/subscription families remain undeclared.

## Later

None.

## Field proof register

| ID | Proof | Clauses | State | Date | Receipt |
| --- | --- | --- | --- | --- | --- |
| R-1 | Human screen-reader review of booking, quote signing and field journeys | BOOK-002, BOOK-011, BOOK-012, BOOK-013, QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013, FIELD-004, FIELD-009, FIELD-010 | not run | | |
| R-2 | VPAT for the operator and public service-work surfaces | BOOK-002, BOOK-011, BOOK-012, BOOK-013, QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013, FIELD-004, FIELD-009, FIELD-010 | not run | | |
| R-3 | Apple publisher/signing access, real iOS-device proof and App Store approval | FIELD-005, FIELD-008, FIELD-012 | not run | | |
| R-4 | Google Play publisher/signing access, real Android-device proof and store approval | FIELD-005, FIELD-008, FIELD-012 | not run | | |
| R-5 | Service coordinator conformance in the Claude client | SURFACE-001 | not run | | |
| R-6 | Service coordinator conformance in the ChatGPT client | SURFACE-001 | not run | | |
| R-7 | Service coordinator conformance in the Codex client | SURFACE-001 | not run | | |
| R-8 | Service coordinator conformance in the Copilot client | SURFACE-001 | not run | | |
| R-9 | Live connected-provider customer email delivery receipts | COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018, COMM-003, COMM-019, COMM-020, COMM-004, COMM-021, QUOTE-004, PAY-005 | not run | | |
| R-10 | Live US number registration/porting and real SMS delivery receipts | COMM-002, COMM-004, COMM-021 | not run | | |
| R-11 | Owner-authorized live Stripe activation and provider settlement receipts | PAY-002, PAY-017, PAY-018, PAY-019, PAY-020, PAY-003, PAY-008, PAY-027, PAY-028, PAY-029, PAY-030, PAY-009 | not run | | |
| R-12 | Live Wisetack merchant activation and financing/funding receipt | PAY-006, PAY-024 | not run | | |
| R-13 | Live QuickBooks company activation and posting/readback receipt | LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007, LEDGER-004 | not run | | |
| R-14 | Live Xero company activation and posting/readback receipt | LEDGER-002, LEDGER-008, LEDGER-009, LEDGER-010, LEDGER-011, LEDGER-012, LEDGER-013, LEDGER-014 | not run | | |

| R-15 | Real Gusto account upload and import acceptance for payroll and commissions | COST-006, COST-007, TEAM-006 | not run | | |
| R-16 | Real ADP RUN account upload and import acceptance for payroll and commissions | COST-006, COST-007, TEAM-006 | not run | | |
| R-17 | Real QuickBooks Payroll account upload and import acceptance | COST-006, COST-007, TEAM-006 | not run | | |
| R-18 | Reconciled real-owner Jobber export move-in | MOVE-001, MOVE-007 | not run | | |
| R-19 | Reconciled real-owner Housecall Pro export move-in | MOVE-002, MOVE-008 | not run | | |
| R-20 | Reconciled real-owner ServiceTitan export move-in | MOVE-003, MOVE-009 | not run | | |
| R-21 | Reconciled real-owner FieldPulse export move-in | MOVE-004 | not run | | |
| R-22 | Reconciled real-owner Workiz export move-in | MOVE-010 | not run | | |
