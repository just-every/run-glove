# Glove target product contract

Target edition: 17 October 2026. Glove is the field-service operating system a US plumbing, HVAC, electrical or other home and commercial service business runs instead of Jobber, Housecall Pro or ServiceTitan: every call, text and web request becomes a quoted, booked, dispatched and completed job, paid on site or online, synced to the books, and brought back through recurring maintenance agreements, with the technician's work kept through a lost signal and every step on the record.

## Product target

| | |
| --- | --- |
| Category | Field service management for home and commercial service trades |
| Incumbents a buyer switches from | Jobber, Housecall Pro, ServiceTitan |
| Up-and-comers it must also beat | FieldPulse, Workiz |
| First buyer | The owner or dispatcher of a US plumbing, HVAC, electrical or other service-trade business with 2 to 25 technicians, moving from another field-service system; USD, US sales tax, card and ACH, one or more US time zones, QuickBooks Online books, the owner's own Cloudflare account |
| What switching means | Their customers, properties, equipment, open quotes, scheduled and recurring jobs, maintenance agreements and open balances arrive with a reviewed move-in; every daily job (answer, quote, book, dispatch, work on site, invoice, collect, reconcile, renew, ask for a review) has a Glove equivalent; Stripe, Twilio, email, Google Maps, Google Calendar, QuickBooks Online and their lead sources plug in |

A buyer replacing an incumbent needs the whole job, so the target is the whole job:

- **Win the work.** Requests from the website, Google, Angi, Thumbtack, Yelp, calls and texts land in one queue with their source (`BOOK-*`); customers book real open slots online (`BOOK-002`); a demand service call becomes a job booked straight from the request and priced on site (`BOOK-005`), and a replacement gets a scheduled assessment visit first (`BOOK-006`); quotes carry good, better and best options and discounts, are approved and signed online with a deposit, and are followed up until answered (`QUOTE-*`).
- **Know the customer.** Customers, properties, installed equipment, warranties and the whole service history in one place, imported by CSV and merged when duplicated (`CUST-*`).
- **Book and dispatch.** A drag-and-drop board with a live map, travel times, route optimization, technician skills, availability and service areas, arrival windows and live location with ETA (`DISP-*`).
- **Talk to the customer.** Delivered email and texts from a registered US number: confirmations, reminders, on-my-way with ETA, two-way texting, missed-call text-back, a customer hub and review requests, all on one conversation history (`COMM-*`).
- **Work on site.** An offline phone app (installable now, native iOS and Android in the stores) with job details, history, photos, custom forms, signatures, field quotes and change orders, service reports and equipment capture (`GLOVE-06`, `GLOVE-08`, `FIELD-*`); the owner and office run the whole desk from a phone in the truck (`FIELD-008`).
- **Know the margin.** Clock-ins and job timers, timesheets for payroll, materials, expenses and receipts, and estimate-versus-actual job costing with margin warnings (`COST-*`).
- **Get paid.** USD invoices sent from Glove, card, ACH, Apple Pay and Google Pay through the owner's Stripe account, Tap to Pay on site, cards the office keys in over the phone or charges on file, deposits, partial payments, refunds, financing through Wisetack, reminders that stop at zero, and reconciled payouts (`PAY-*`).
- **Keep the books right.** Two-way QuickBooks Online sync that links to the customers, items and invoices already in the owner's company before it posts anything, Xero sync, and Pantry for owners who run Run Edit Run's ledger (`LEDGER-*`).
- **Bring them back.** Recurring jobs billed per visit, per period or on close, and maintenance agreements with entitlements, autopay renewals and due-visit booking (`PLAN-*`).
- **Run the business.** Van and warehouse stock and purchase orders (`STOCK-*`), custom roles, branches and commissions (`TEAM-*`), dashboards and reports (`REPORT-*`), an API, webhooks and Zapier/Crank apps (`API-*`), US privacy requests and a complete audit (`DATA-*`).
- **Move in and out.** Reviewed, journaled, undoable move-ins from the supported source formats, with open balances, saved cards and autopay carried across (`GLOVE-11`, `MOVE-*`), and complete export and restore (`GLOVE-12`).
- **Let agents run the front office.** An AI front office answers calls and texts 24/7 and books into real capacity; a job agent confirms access and parts before dispatch, rebooks around delays and chases every invoice until paid and reconciled, under the owner's policy (`AGENT-*`).

### Neighboring products stay separate

Glove is one product. Where the market sells a neighboring product separately, Glove connects to it and does not rebuild it; when the neighbor is a Run Edit Run sibling, Glove links to that sibling first and to the US incumbent second.

| Job | Owned by | How Glove meets it |
| --- | --- | --- |
| Bookkeeping, the general ledger and sales-tax filing | [Pantry](https://github.com/just-every/run-pantry) (or QuickBooks Online, Xero) | Two-way sync of customers, items, invoices, payments, refunds and fees (`LEDGER-001` to `LEDGER-003`); Glove keeps no general ledger |
| Payroll, tax withholding and W-2/1099 filing | [Envelope](https://github.com/just-every/run-envelope) (or Gusto, ADP RUN, QuickBooks Payroll) | Approved timesheets and subcontractor totals exported in the payroll provider's import shape (`COST-002`) |
| Shift scheduling for an hourly workforce | [Lanyard](https://github.com/just-every/run-lanyard) (or Deputy, Homebase) | Glove schedules jobs and job time; availability and time off can be read from Lanyard (`DISP-004`) |
| Business phone system (extensions, IVR, call center) | No sibling (RingCentral, Dialpad) | Glove answers and logs calls on its own Twilio numbers and forwards to the owner's phone system (`COMM-009`, `AGENT-001`) |
| Generic appointment booking pages | [Dial](https://github.com/just-every/run-dial) (or Calendly) | Glove's own booking into technician capacity (`BOOK-002`); Dial is not needed for jobs |
| Email marketing campaigns | [Mango](https://github.com/just-every/run-mango) (or Mailchimp) | Segments and reactivation lists pushed to Mango (`CUST-004`); Glove sends transactional messages and review requests only |
| Business website | [Pane](https://github.com/just-every/run-pane) (or Squarespace, WordPress) | An embeddable request and booking widget (`BOOK-001`, `BOOK-002`) |
| Long-form signed agreements | [Inkwell](https://github.com/just-every/run-inkwell) (or Docusign) | Quote and work-order signatures are Glove's own (`QUOTE-002`); envelope workflows stay in Inkwell |
| General work and project management | [Pegboard](https://github.com/just-every/run-pegboard) | A separate sibling product |
| Multi-month construction projects | [Plinth](https://github.com/just-every/run-plinth) (or Buildertrend) | Glove handles service, repair, install and maintenance jobs; remodel project management stays in Plinth |
| In-house maintenance of a company's own assets | [Gasket](https://github.com/just-every/run-gasket) (or MaintainX) | Glove serves a business selling service to customers |
| Company-wide expense cards and reports | [Coaster](https://github.com/just-every/run-coaster) (or Expensify) | Job expenses and receipts stay on the job (`COST-003`) |
| Cross-app automation | [Crank](https://github.com/just-every/run-crank) (or Zapier, Make) | Webhooks, the API and published Crank and Zapier apps (`API-002`, `API-003`) |

The primary journey: Capture the customer request, quote and book the work, dispatch the technician, complete the job through lost signal, invoice and collect payment, reconcile the books and schedule recurring maintenance.

## How to read this contract

- This follows the RER contract standard.
- Core, Agent surface and Later are reported separately.
- Done means every acceptance point has recorded proof.
- Field proof is kept in its register.
- ACCEPTANCE.md and the homepage claims document are generated from this file.

## Door rules

- **D-1.** Purpose-bound customer messaging (RL-102). Every send checks current purpose consent, authority, recipient and channel registration, stops on withdrawal and the applicable invoice or quote terminal state, and preserves unknown delivery honestly. Email uses 08:00–18:00 in the branch's local zone; SMS uses 08:00–18:00 in the recorded customer zone and is held when that zone is unknown, subject to stricter provider or legal restrictions. Consent binds its purpose and current address or number; SMS records its source, time and wording. Business identity and opt-out wording are immutable. Channels and automation start off and use explicitly enabled exact templates; an existing-number affirmation permits configuration and proves no live A2P registration. For an agent's send, the call carries external and any other computed classes; the company's policy decides its disposition.

## Shared duties (Base)

| Base duty | Duty | Delta clauses | Base journey |
| --- | --- | --- | --- |
| BASE-ACCESS-001 | Sign-in | GLOVE-01 | not run |
| BASE-ACCESS-002 | Sessions | GLOVE-01 | not run |
| BASE-ACCESS-003 | Public endpoints | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010, BOOK-002, BOOK-011, BOOK-012, BOOK-013, QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013, COMM-006, COMM-022, COMM-023, COMM-024, COMM-025 | not run |
| BASE-ACCESS-004 | Server-side authorisation | TEAM-001, TEAM-002, TEAM-004, TEAM-005 | not run |
| BASE-INPUT-001 | Validation | API-001 | not run |
| BASE-INPUT-002 | HTML | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010, COMM-007 | not run |
| BASE-INPUT-003 | Uploads | FIELD-002, API-004, API-008, GLOVE-06 | not run |
| BASE-SECRET-001 | No leakage | MONEY-005, CUST-006, BOOK-001, BOOK-004, BOOK-014, QUOTE-009, QUOTE-012, DISP-002, DISP-004, COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018, COMM-002, COMM-005, COMM-023, COMM-025, COMM-026, COMM-028, FIELD-009, FIELD-010, FIELD-006, PAY-010, PAY-015, PAY-017, PAY-023, PAY-006, PAY-026, PAY-009, LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007, LEDGER-002, LEDGER-008, LEDGER-009, LEDGER-010, LEDGER-011, LEDGER-012, LEDGER-013, LEDGER-014, LEDGER-003, LEDGER-004, API-002, API-006, API-007, API-004, API-008, DATA-001, DATA-008, SURFACE-005, SURFACE-006, SURFACE-007, SURFACE-008 | not run |
| BASE-SECRET-002 | Startup | DATA-003 | not run |
| BASE-DATA-001 | Export and import | MONEY-004, MONEY-005, CUST-006, BOOK-001, BOOK-004, QUOTE-009, QUOTE-015, DISP-002, DISP-011, DISP-004, DISP-012, DISP-008, COMM-001, COMM-018, COMM-004, COMM-025, COMM-028, FIELD-003, FIELD-009, FIELD-006, PAY-016, PAY-017, PAY-006, PAY-028, PAY-030, LEDGER-001, LEDGER-002, LEDGER-009, LEDGER-010, PLAN-010, MOVE-001, API-002, API-004, API-008, DATA-001, DATA-003, GLOVE-12 | not run |
| BASE-DATA-002 | Retention | FIELD-001 | not run |
| BASE-DATA-003 | Erasure | MONEY-004, BOOK-007, BOOK-009, BOOK-010, QUOTE-009, DISP-011, COMM-020, COMM-005, COMM-025, COMM-028, FIELD-012, PAY-010, PAY-012, PAY-016, PAY-019, PAY-025, PAY-027, PAY-030, LEDGER-009, LEDGER-010, DATA-001, DATA-005, DATA-006, DATA-007, DATA-008, SURFACE-006, SURFACE-013, AGENT-011, AGENT-012, AGENT-015 | not run |
| BASE-DATA-004 | Outbound flows | BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017, LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007, LEDGER-002, LEDGER-008, LEDGER-009, LEDGER-010, LEDGER-011, LEDGER-012, LEDGER-013, LEDGER-014 | not run |
| BASE-DATA-005 | Independence | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008, DATA-004 | not run |
| BASE-PUBLIC-001 | Privacy | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010, BOOK-002, BOOK-011, BOOK-012, BOOK-013, QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 | not run |
| BASE-PUBLIC-002 | Origins | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 | not run |
| BASE-PUBLIC-003 | Accessibility | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010, BOOK-002, BOOK-011, BOOK-012, BOOK-013, QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 | not run |
| BASE-OPS-001 | Health | HTTP-001 | not run |
| BASE-OPS-002 | Migrations | DATA-003 | not run |
| BASE-OPS-003 | Idempotency | COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018, COMM-002, PAY-002, PAY-017, PAY-018, PAY-019, PAY-020, API-002, API-006, API-007 | not run |
| BASE-OPS-004 | Failure is visible | COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018, API-005 | not run |
| BASE-OPS-005 | Audit | DATA-002, DATA-009, DATA-010 | not run |
| BASE-ROLE-001 | Roles through every door | MONEY-002, MONEY-006, BOOK-007, BOOK-008, BOOK-009, BOOK-010, BOOK-002, BOOK-011, BOOK-012, BOOK-013, QUOTE-002, QUOTE-012, QUOTE-015, QUOTE-018, QUOTE-019, DISP-011, DISP-005, DISP-012, DISP-013, DISP-009, COMM-019, COMM-004, COMM-021, COMM-024, COMM-025, COMM-007, COMM-026, COMM-009, FIELD-001, FIELD-003, FIELD-009, FIELD-010, FIELD-008, FIELD-012, PAY-001, PAY-010, PAY-013, PAY-014, PAY-015, PAY-016, PAY-005, PAY-027, PAY-028, PAY-030, PAY-009, LEDGER-006, LEDGER-007, LEDGER-009, LEDGER-010, LEDGER-012, LEDGER-013, PLAN-008, PLAN-009, PLAN-010, PLAN-012, TEAM-001, TEAM-002, TEAM-004, TEAM-005, MOVE-009, API-002, API-006, API-008, API-005, DATA-001, DATA-008, DATA-009, SURFACE-005, SURFACE-010, AGENT-010, AGENT-011, AGENT-013, AGENT-007, AGENT-009, GLOVE-01 | not run |
| BASE-AUDIT-001 | Searchable, durable audit | MONEY-005, BOOK-010, BOOK-002, BOOK-004, BOOK-005, QUOTE-009, QUOTE-012, QUOTE-017, DISP-002, DISP-004, DISP-012, DISP-013, COMM-001, COMM-010, COMM-012, COMM-013, COMM-015, COMM-002, COMM-003, COMM-005, COMM-006, COMM-025, COMM-007, COMM-008, COMM-027, COMM-009, COMM-028, FIELD-002, FIELD-003, COST-001, COST-005, PAY-001, PAY-012, PAY-002, PAY-018, PAY-003, PAY-004, PAY-024, PAY-007, PAY-030, PAY-009, LEDGER-001, LEDGER-002, LEDGER-009, LEDGER-010, LEDGER-013, LEDGER-003, LEDGER-004, PLAN-001, PLAN-009, PLAN-011, STOCK-001, STOCK-002, TEAM-005, API-002, DATA-001, DATA-002, DATA-009, DATA-010, AGENT-001, AGENT-006, AGENT-015, AGENT-009 | not run |
| BASE-BACKUP-001 | Independent backup, restore and rollback | DATA-003, GLOVE-12 | not run |
| BASE-DATA-005 | Erasure respects retention and legal hold | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008, DATA-004 | not run |
| BASE-SIGNIN-001 | Standards-based SSO and lifecycle | none | not run |
| BASE-SIGNIN-002 | Native multi-factor authentication | none | not run |
| BASE-INSTALL-001 | Free self-host and removal | DATA-003, DATA-004 | not run |
| BASE-MAIL-001 | Truthful mail outcomes | COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018, COMM-003, COMM-019, COMM-020, PAY-005 | not run |
| BASE-ACCESSIBILITY-001 | One accessibility bar | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010, BOOK-002, BOOK-011, BOOK-012, BOOK-013, QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013, DISP-001, FIELD-004, FIELD-009, FIELD-010 | not run |
| BASE-DOCS-001 | On-site docs from one contract | API-001 | not run |
| BASE-AGENT-001 | One MCP door per seed | none | not run |
| BASE-AGENT-002 | The seed's jobs are tools, through the UI's own actions | SURFACE-001, SURFACE-012 | not run |
| BASE-AGENT-003 | Records are resources | SURFACE-002, SURFACE-006 | not run |
| BASE-AGENT-004 | Business identity and short-lived, audience-bound tokens | none | not run |
| BASE-AGENT-005 | An agent acts as a person in a role, never more | SURFACE-005 | not run |
| BASE-AGENT-006 | Every action declares its risk class | SURFACE-001, SURFACE-003, SURFACE-004, SURFACE-005, SURFACE-006, SURFACE-007, SURFACE-008 | not run |
| BASE-AGENT-007 | The company's policy decides, at one chokepoint | SURFACE-003, SURFACE-004, SURFACE-008, SURFACE-011, SURFACE-012 | not run |
| BASE-AGENT-008 | Truthful attribution | SURFACE-003, SURFACE-007, SURFACE-012 | not run |
| BASE-AGENT-009 | Every agent action is audited with its class and decision | SURFACE-011, SURFACE-013 | not run |
| BASE-AGENT-010 | Agents can follow changes | SURFACE-010 | not run |
| BASE-AGENT-011 | Limits are policy, and Pause stops everything | SURFACE-009 | not run |
| BASE-AGENT-012 | Writes are idempotent and conflict-safe | none | not run |
| BASE-AGENT-013 | Manifest, docs and the conformance journey | SURFACE-001, SURFACE-011, SURFACE-013 | not run |

## Published clauses

- `GLOVE-01`: *Tier:* Core · *Cites:* BASE-ACCESS-001, BASE-ACCESS-002, BASE-ROLE-001
- `GLOVE-02`: *Tier:* Core
- `GLOVE-03`: *Tier:* Core
- `GLOVE-04`: *Tier:* Core
- `GLOVE-05`: *Tier:* Core
- `GLOVE-06`: *Tier:* Core · *Cites:* BASE-INPUT-003
- `GLOVE-07`: *Tier:* Core
- `GLOVE-08`: *Tier:* Core
- `GLOVE-09`: *Tier:* Core
- `GLOVE-10`: *Tier:* Core
- `GLOVE-11`: *Tier:* Core
- `GLOVE-12`: *Tier:* Core · *Cites:* BASE-DATA-001, BASE-BACKUP-001
- `HTTP-001`: *Tier:* Core · *Cites:* BASE-OPS-001

### First release clauses

#### GLOVE-01 — Set up the business and its people

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

#### GLOVE-02 — Customers and sites

**Requirement.** The desk records customers (contact, email, billing address) and the sites where work happens, with access notes. Edits apply only to the version the person saw. The [operating rules](docs/service-work-rules.md#glove-02-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A customer retains contact, email and billing address, with several sites and their access notes.
2. A stale edit cannot replace a newer version.

#### GLOVE-03 — Request to an approved quote

**Requirement.** A request becomes a quote of priced lines (from the price book or custom) with tax computed exactly. A person approves one exact revision's price. Any price change is a new revision that needs its own approval; earlier revisions and approvals stay on the record. The [operating rules](docs/service-work-rules.md#glove-03-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A request produces priced lines from the price book or custom work, with exact tax.
2. The approved price belongs to one exact revision; a price edit requires a new approval and keeps the earlier revision and decision.

#### GLOVE-04 — The customer's answer, recorded honestly

**Requirement.** A person records how the approved quote went out (email, printed, in person, phone) without any delivery claim, and records the customer's acceptance or decline of the current revision: who answered, how (signed, email reply, phone, in person) and who recorded it. An accepted quote is frozen. The customer-link door in `QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013` shares the first-decision-wins revision freeze; online signing remains gated on the owner’s accepted consent disclosure. The [operating rules](docs/service-work-rules.md#glove-04-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The recorded send retains its method and recorder without claiming delivery.
2. The customer answer retains the current revision, claimed customer, answer method and actual recorder.
3. An accepted revision is frozen and cannot be decided again.

#### GLOVE-05 — Book and assign the visit

**Requirement.** An accepted quote becomes one job carrying the accepted lines and the checklist from its services. The dispatcher books visits for a technician at local times in the business time zone. A booking that overlaps another visit for that technician is refused until the dispatcher reviews those exact conflicts and confirms. The [operating rules](docs/service-work-rules.md#glove-05-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. An accepted quote creates one job with exactly its accepted lines and service checklist.
2. A technician booking retains the chosen local date and time in the business zone.
3. An overlap is refused until the dispatcher confirms the exact conflicts reviewed.

#### GLOVE-06 — Field capture through a connectivity interruption

**Requirement.** On a phone, the assigned technician records arrival, checklist results (done, or not applicable with a reason), notes, photos and materials. Each item is kept on the phone with its capture time until the server confirms it; resending after a lost signal lands it exactly once. Photos are stored as received and readable only by people allowed to see that job. The [operating rules](docs/service-work-rules.md#glove-06-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The assigned technician captures arrival, checklist results, notes, photos and materials with their capture times.
2. A resend after a lost response returns the recorded outcome and produces one copy of each capture.
3. Original photo bytes remain readable by the assigned technician and unavailable to an unrelated technician.

#### GLOVE-07 — Dispatch change with conflict review

**Requirement.** The dispatcher changes a visit's technician, date or time with a reason. The change is refused if the visit changed since they opened it, and must be reviewed when it overlaps another visit or the technician has already recorded evidence on it. Evidence that arrives from a technician after the visit moved on is kept, flagged on the visit, and reviewed by the dispatcher. Every change keeps its before and after on the record. A new technician records their own arrival; the earlier arrival stays as evidence. The [operating rules](docs/service-work-rules.md#glove-07-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A move retains technician, date, time, reason and before/after assignment history.
2. A stale move is refused; overlapping work or existing field evidence requires review of the exact conflicts.
3. Evidence arriving after reassignment is retained and flagged for review; a new assignee records a new arrival without replacing the earlier one.

#### GLOVE-08 — Customer completion evidence

**Requirement.** The technician completes a visit only after recording their arrival, and completes the job only when every required checklist item is done or not applicable with a reason. Completion carries a work summary and either the customer's name and drawn signature or why the customer could not sign. The [operating rules](docs/service-work-rules.md#glove-08-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Completion refuses a missing arrival or an unanswered required checklist item.
2. A completed job retains its work summary and the customer name and drawn signature, or the recorded reason for a missing signature.

#### GLOVE-09 — Invoice preparation, export and correction trail

**Requirement.** **Requirement.*`. The [operating rules](docs/service-work-rules.md#glove-09-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The draft includes accepted lines, priced materials and explicitly priced unpriced materials.
2. The office approves one exact revision and exports each approved revision once in the accounting import format.
3. A correction retains the earlier export and revision, receives its own approval and exports as its own numbered row, including when revised before approval.
4. Fixed-monthly invoices retain the issue, approval and due-date basis governed by PLAN-013.

#### GLOVE-10 — Agent preparation under company policy

**Requirement.** An agent prepares quote drafts, dispatch proposals (job, technician, time, rationale, evidence) and invoice drafts through the same public commands. Quote preparation and reversible dispatch or invoice drafting carry standard; binding quote or invoice decisions carry commitment, customer disclosures carry external and collection carries money. The company’s policy decides those calls. After a person decides an agent-prepared action, the record identifies that person’s decision and the agent’s preparation separately. The [operating rules](docs/service-work-rules.md#glove-10-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Under the held company policy, the agent prepares quotes, dispatch and invoices; the person the policy names decides the saved revision and the record distinguishes preparation from decision.

#### GLOVE-11 — Move in from the first source system with dry run, journal and undo

**Requirement.** **Requirement.*`) follows this clause. The [operating rules](docs/service-work-rules.md#glove-11-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The preview identifies each source record’s destination, merge, rejection with location and reason, unused record and missing attachment.
2. Commit applies the reviewed preview with source identifiers and exact received files.
3. An unchanged repeat writes nothing; undo removes exactly the imported effects and refuses changed records or later dependent work.

#### GLOVE-12 — The whole timeline, exported and restorable

**Requirement.** Every job shows its timeline: each step, who did it in which role, with which command. The owner or office downloads the business as JSON. rer export and rer import move the complete installation (records, timeline, photos and signatures, command outcomes, move-in journal and originals) into a fresh checkout, which keeps working; a session from the old installation does not open it. The [operating rules](docs/service-work-rules.md#glove-12-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The job timeline retains every step, actual person, role and command, including after hundreds of later events.
2. The business download includes that timeline.
3. Restoring the installation preserves the service records, captures, signatures, command outcomes, move-in journal and original bytes, and the service journey works there.
4. A session from the old installation cannot open the restored one.

### Foundation

#### HTTP-001 — Foundation HTTP routing

**Requirement.** The foundation routes health checks, product API requests and document reads to their declared handlers. The [operating rules](docs/service-work-rules.md#http-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Health, product API and document requests reach their declared handlers; an unknown route returns a missing-page response.

## Target clauses

### US business and money

#### MONEY-001 — US dollars and sales tax

*Tier:* Core · *From:* MONEY-001

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

#### MONEY-004 — Frozen tax evidence and reporting

*Tier:* Core · *From:* MONEY-001 · *Cites:* BASE-DATA-001, BASE-DATA-003

**Requirement.** Frozen tax evidence and reporting supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#money-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The revision freezes currency, jurisdiction, rate, labor classification and exemption evidence; accepting options/add-ons and preparing/correcting the invoice retains that snapshot.
2. Certificate evidence is private to the customer's full desk readers, including branch limits, stored in original chunks, archived with the customer and retained when replaced; exemption expiry is inclusive in the branch's local date.
3. Any physical customer removal deletes its originals and chunks; DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 carries the customer erasure door and restore-fence assertion before shipping.
4. US exports keep approved jurisdiction, rate, taxable basis, tax and total; legacy AUD exports retain Xero columns.
5. Tax reports use each invoice's first approval local date (inclusive period bounds), grouping the latest approved tax snapshot by branch and jurisdiction.
6. Before payments ship, the report honestly says tax on approved invoices; PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 carries collected tax.
7. The mapped QuickBooks JSON is an inspection document only; LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007/004 carry live posting, matching and provider assertions.
8. QUOTE-007, QUOTE-019 carries discount allocation through this same tax calculation before discounts ship.

#### MONEY-005 — Address-based tax lookup

*Tier:* Core · *From:* MONEY-001 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-SECRET-001

**Requirement.** Address-based tax lookup supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#money-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The optional Avalara AvaTax and Stripe Tax lookups (provider fakes at their network edges) each return an owner-applied proposal, and an unregistered or rateless answer reads "rate unavailable", never 0%.
2. Stripe lookup sends only service address and two fixed sample classifications, never identity or certificates; the owner selects the service classification, reviews the response and applies settings.
3. Unsupported, partial or unregistered treatment is unavailable for automatic application, never inferred as zero tax or exemption.
4. Every new lookup/certificate event appears in Activity and business export without credentials.
5. The Avalara AvaTax lookup follows the same rules as Stripe : the owner alone connects it, and the account ID, license key, company code and production/sandbox choice are one sealed secret excluded from state, archives and export.
6. A lookup creates one uncommitted AvaTax SalesOrder (never recorded in AvaTax) at the service address with the fixed customer code glove-address-rate-lookup and two $100 sample lines: the documented refusal general tangible goods and the AvaTax tax code the owner enters for the service.
7. It is a proposal only when every parts jurisdiction is fully taxable and their rates, summed in millionths and shown as a percent to four places, exceed zero, and the service is either fully taxable at that same combined rate (labor taxed) or wholly non-taxable (labor exempt); no nexus, zero, mixed, partial, exempt or refused answers read "rate unavailable", never 0%.
8. The owner applies a proposal through the ordinary jurisdiction settings.

#### MONEY-002 — US business identity on every document

*Tier:* Core · *Cites:* BASE-ROLE-001

**Requirement.** The business records its legal name, DBA, EIN, state contractor license numbers (by trade and state), insurance details and logo; quotes, invoices, service reports and agreements print the license numbers and terms a state requires, US address and phone formats, and US date formats. Customers record a billing and service address separately and a business customer's tax ID. The [operating rules](docs/service-work-rules.md#money-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The business retains its EIN, two license numbers and logo after reload; the customer retains separate billing and service addresses through edit and export.
2. The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first release), up to 20 contractor licenses (trade, two-letter state, number), insurance (carrier, policy number, expiry date) and a logo image in its own format (PNG, JPEG or WebP, at most 1.5 MB), each kept when a save leaves it out; every signed-in role can open the logo.
3. Customers keep a billing address apart from each site's service address, and a business customer's tax ID; the customer export carries both addresses in their own columns.
4. Printing these on quotes, invoices, service reports and agreements, with US address, phone and date formats, is `QUOTE-005, QUOTE-015`'s.

#### MONEY-003 — Price book with costs, markup and flat rates

*Tier:* Core · *From:* MONEY-003

**Requirement.** Price book with costs, markup and flat rates supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#money-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture imports a 200-line price book CSV with costs and markups, raises one category by 5%, quotes a flat-rate task and a time-and-materials line, and checks prices, costs and the round-trip export.
2. An item is a service, a material or a flat-rate task.
3. Its price is fixed, or follows its category's markup: unit cost × (100 + markup) / 100, rounded half up to the cent, recomputed whenever the cost or the markup changes.
4. A task's cost is the sum of its contents' costs at their quantities (each rounded half up to the cent); its contents are services and materials, never other tasks.
5. A bulk change multiplies each fixed price in one category by (100 + percent) / 100, rounded half up to the cent; markup prices follow cost instead.
6. A price-book quote line keeps the item's unit cost when it was priced.
7. The customer-facing description is stored on the item; the doors that show customers documents (`QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013`, `QUOTE-005, QUOTE-015`, `COMM-006, COMM-022, COMM-023, COMM-024, COMM-025`) print it when they ship.

#### MONEY-006 — Price-book CSV and cost visibility

*Tier:* Core · *From:* MONEY-003 · *Cites:* BASE-ROLE-001

**Requirement.** Price-book CSV and cost visibility supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#money-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Costs are margin figures: technicians never read them, and a custom role reads them only with report-reading permission.
2. The price-book CSV matches rows by Code (new, updated with the fields that change, unchanged, or rejected with its reason), is committed only as the exact preview, keeps checklists, skills and images, and ignores a markup row's Price; re-importing the export changes nothing.

### Customers, properties and equipment

#### CUST-001 — Customer and property history in one place

*Tier:* Core

**Requirement.** **Requirement.*), agreements (PLAN-*) and messages (COMM-*) join the property history as standing obligations of their own clauses; each such clause must add its entries to the property history. Search across customers covers name, phone, email and address; a business customer keeps a billing contact and an accounts-payable email apart from the site contact, and can require a purchase-order number on its invoices. The PO requirement is enforced at invoice approval and the PO travels in the invoice CSV Reference. The [operating rules](docs/service-work-rules.md#cust-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture opens a customer with two properties and finds each property's full history of every kept record kind: requests, quotes, jobs, visits, photos, checklist forms, notes, materials, refrigerant, completion, invoices and equipment; a search by a phone fragment and by a street name finds them; a business customer's billing contact and accounts-payable email stay apart from its site contacts.
2. Require a PO for that customer, refuse invoice approval without it, then add the PO, approve and verify it travels in the invoice CSV Reference.
3. Each PAY-* payment, PLAN-* agreement and COMM-* message clause must prove its entries appear in the property history; these remain standing obligations of those clauses.

#### CUST-002 — Installed equipment and warranties

*Tier:* Core

**Requirement.** Each property lists installed equipment (type, make, model, serial, install date, refrigerant, location in the building, photos) with manufacturer and labor warranty dates; technicians add or update equipment from the phone; every job and form links to the equipment it touched; expiring warranties appear on the property and in reports. The [operating rules](docs/service-work-rules.md#cust-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture adds a furnace and an AC condenser to a site, records a visit against the condenser, and reads the condenser's service history and warranty state; the technician's phone shows them offline.

#### CUST-003 — Customer CSV import and export

*Tier:* Core

**Requirement.** The owner imports customers, contacts and properties from a CSV (any column order, mapped once and remembered), sees a preview of new, matched and rejected rows with reasons, and commits through the import kit journal with undo; the same records export as CSV at any time. The [operating rules](docs/service-work-rules.md#cust-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture previews and commits a 500-row CSV with bad rows and duplicates, undoes it, and exports a CSV that re-imports unchanged.
2. Rows sharing a Customer ID, or without one carrying identical customer details, are one customer, each row adding one site and one other contact.
3. A row is *matched* when its Customer ID is a Glove customer's ID or it repeats a customer an earlier CSV import created; Glove keeps a matched customer's details and contacts as they are, lists which file values differ, and adds only the site addresses it lacks.
4. A row is , with its spreadsheet row number and reason, when a field fails the rule customer save action or site save action applies, it has more cells than the header, it repeats an earlier row exactly, or its details differ from the first row with the same Customer ID; every other row is *new*.
5. Without a chosen mapping Glove uses the last committed CSV's mapping when every column it names is in the file, else columns headed like Glove's own export.
6. The export writes every live (unmerged) customer, one row per site or other contact, and puts a ' before a cell a spreadsheet would run as a formula (import takes exactly one off), so re-importing it matches every row and writes nothing.

#### CUST-004 — Tags, custom fields and segments

*Tier:* Core · *From:* CUST-004

**Requirement.** Tags, custom fields and segments supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#cust-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture defines two custom fields and a segment, and checks that the segment's members match the filter and that the export and the Mango push (provider fake) carry exactly them; a workflow rule conditioned on the "commercial" tag runs only for a tagged customer's job (`API-005`).
2. The owner defines custom fields on customers, sites, jobs or equipment (text, number, date, yes/no, or a choice of 2–20 values); a field keeps its record and type.
3. The owner, dispatchers and the office set field values and a customer's tags (up to 20, each up to 40 characters, kept once whatever the case) and save segments.
4. A technician sees the values on the sites, jobs and equipment of visits assigned to them, never a customer's tags or customer fields.
5. A segment's members are the live customers (never merged-away ones) that have all of its "has" tags and none of its "has none" tags (compared without case), meet every field condition (is, over, under, set, unset; a site field holds when any of the customer's sites meets it) and, when set, have equipment at one of their sites installed at least N years before today's local date. "No agreement" holds for every customer until agreements exist; `PLAN-002` carries it in its text and acceptance.
6. The members list reads for the desk; the members CSV (name, email, phone, tags, customer fields) for the owner and office, like the customer CSV.
7. A tag is a condition of a workflow rule (`API-005`).

#### CUST-006 — Segment audience handoff

*Tier:* Core · *From:* CUST-004 · *Cites:* BASE-DATA-001, BASE-SECRET-001

**Requirement.** Segment audience handoff supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#cust-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner connects Mango (its integration address and a contacts:write credential) or Mailchimp (an API key and audience ID); the key is kept as a secret, never in records, exports, logs or the archive.
2. The owner and office push a segment: Glove holds no marketing consent, so a push never subscribes anyone: Mango receives each member with an email (email, name, tags, the segment as its list, without subscribe), Mailchimp adds new members as transactional and tags them with the segment and their tags; members without an email or tagged "do not contact" are skipped and counted (customers who opted out are excluded with `COMM-002`'s consent record, which carries it in its text and acceptance), and each push is recorded with its counts and the provider's refusals.

#### CUST-005 — Duplicate detection and merge review

*Tier:* Core

**Requirement.** Glove flags customers that share a phone number, email or normalized address, on entry, on CSV import and on move-in, and offers a merge review: what each record holds, which values win, and what moves (properties, jobs, invoices, messages); a merge is one journaled change that can be undone. The [operating rules](docs/service-work-rules.md#cust-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture creates nine customers sharing a phone number, reviews and merges them, checks every job and invoice now hangs off the survivor, and undoes the merge.

### Requests and online booking

#### BOOK-001 — Request form on the business website

*Tier:* Core · *From:* BOOK-001 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-DATA-001, BASE-INPUT-002, BASE-PUBLIC-001, BASE-PUBLIC-002, BASE-PUBLIC-003, BASE-SECRET-001

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

#### BOOK-007 — Request custody and office handoff

*Tier:* Core · *From:* BOOK-001 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-DATA-003, BASE-INPUT-002, BASE-PUBLIC-001, BASE-PUBLIC-002, BASE-PUBLIC-003, BASE-ROLE-001

**Requirement.** Request custody and office handoff supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. New customer/site/request records, private originals and an owner/office in-app notice commit together under the configuring owner’s still-current role, branch and exact configuration.
2. The anonymous response is only an opaque receipt, and replay cannot duplicate the request.
3. A request never books or sends a reply.
4. The desk reads the source, preferred times and photos in the request pipeline; field and public file doors cannot read these originals.
5. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 export/erase includes the contact, request and original bytes.
6. Quote drafting retains its text evidence; the separate photo permission controls sanitized additions to the model evidence.

#### BOOK-008 — Sender photo permission

*Tier:* Core · *From:* BOOK-001 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-INPUT-002, BASE-PUBLIC-001, BASE-PUBLIC-002, BASE-PUBLIC-003, BASE-ROLE-001

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

#### BOOK-009 — Provider qualification and disclosure

*Tier:* Core · *From:* BOOK-001 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-DATA-003, BASE-INPUT-002, BASE-PUBLIC-001, BASE-PUBLIC-002, BASE-PUBLIC-003, BASE-ROLE-001

**Requirement.** Provider qualification and disclosure supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The signed-in unscoped owner may enable model-photo sharing in website-request settings only with a configured provider, its sender-facing name and explicit affirmation of the entered account-specific terms prohibiting training.
2. The setting starts off; each save creates a new disclosure, and reconnecting or changing the provider invalidates earlier permission.
3. The public form offers a separate unchecked optional consent naming that provider and its actual hostname; it binds that request’s exact photos to the disclosure text, time and recipient.
4. Provider qualification under RL-101 relies on the recorded account-specific no-training agreement and affirmation; disabling storage alone does not qualify it.
5. Missing or changed applicable terms hold photo sharing.
6. The owner records a sender-requested withdrawal and its reason; it excludes every later model attempt while private originals remain subject to erasure.
7. The record is an attestation and agreement reference, never provider verification or a legal determination.

#### BOOK-010 — Model-photo authorization and withdrawal

*Tier:* Core · *From:* BOOK-001 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-AUDIT-001, BASE-DATA-003, BASE-INPUT-002, BASE-PUBLIC-001, BASE-PUBLIC-002, BASE-PUBLIC-003, BASE-ROLE-001

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

#### BOOK-002 — Online booking into real availability

*Tier:* Core · *From:* BOOK-002 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-AUDIT-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001 · *Register:* R-1, R-2

**Requirement.** Online booking into real availability supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-002-operating-rules) retain the record formats and calculations. Recorded decisions: RL-3.

**Acceptance.**
1. A fixture books a tune-up through the public booking page, sees a full day refused and a window offered on a technician with the right skill, and finds the visit on the dispatch board with its confirmation queued.
2. A second booking for a service with a $50.00 deposit takes it (Stripe fake), and the deposit shows on the job.
3. With a 24-hour window and a $75.00 late-cancellation fee, a booking the customer cancels 3 hours ahead puts the $75.00 fee on the visit, and the office charges it to the saved card; a booking canceled 3 days ahead charges nothing and refunds its $50.00 deposit; and a visit marked as a no-show proposes the no-show fee, which the office waives with a reason on the timeline.
4. It also carries `DISP-006`: each online booking is assigned with automatic technician selection and lands on an eligible technician inside its window.
5. Deposits, payments, saved-card consent, fees, cancellation and rescheduling are unavailable through this bearer.
6. The bounded offer does not remove customer-selected booking, deposits, cancellation or rescheduling from the complete target; customer-payment authority follows RL-106.

#### BOOK-011 — Single-service booking offers

*Tier:* Core · *From:* BOOK-002 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001 · *Register:* R-1, R-2

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

#### BOOK-012 — Current capacity and window generation

*Tier:* Core · *From:* BOOK-002 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001 · *Register:* R-1, R-2

**Requirement.** Current capacity and window generation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. DISP-006 recomputes eligible automatic assignment at booking, retains the arrival window and records the assignment reason; availability displayed earlier reserves no capacity.
2. A successful service booking creates an internal desk confirmation task only.
3. It does not itself establish an outbound send, provider acceptance, delivery, arrival or completion.
4. The Owner shares this service link outside Glove; this extension adds no automatic customer send.
5. Each candidate uses the existing live automatic-assignment eligibility door: service skills, area, working hours, time off, calendar busy time and existing visits.
6. Generated windows remain restricted to the existing service call and bearer authority; reads and choices recheck current capacity.
7. Each arrival window spans its planned visit.

#### BOOK-013 — Booking-offer proof boundary

*Tier:* Core · *From:* BOOK-002 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001 · *Register:* R-1, R-2

**Requirement.** Booking-offer proof boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Generation grants no customer catalogue, priority, payment, sending or cancellation authority.
2. Travel currently participates only in existing DISP-006 assignment ranking, not a proved travel-feasibility boundary.

#### BOOK-003 — Lead sources and the request pipeline

*Tier:* Core

**Requirement.** Every request carries its source (website, Google, phone, text, Angi, Thumbtack, Yelp, referral, repeat customer, marketing campaign) and moves through a pipeline (new, contacted, quoted, won, lost with a reason); the office sees an aging pipeline board, and reports show conversion and revenue by source. The [operating rules](docs/service-work-rules.md#book-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture creates requests from four sources, quotes and wins two, loses one with a reason, and checks the pipeline and the conversion-by-source report.

#### BOOK-004 — Leads from Google, Angi, Thumbtack and Yelp

*Tier:* Core · *From:* BOOK-004 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-004, BASE-SECRET-001

**Requirement.** Leads from Google, Angi, Thumbtack and Yelp supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture posts a recorded lead payload from each provider (provider fakes), finds four requests with sources and lead costs, one matched to an existing customer, and an acknowledgment queued for each; a workflow rule on requests from Angi applies its lead cost (`API-005`).
2. Only the owner connects a lead source (lead connect action), with how many minutes the business has to acknowledge its leads (5 to 1,440, default 60) and the acknowledgment text.
3. Angi and Thumbtack post each lead (Thumbtack's Partner API v4 NegotiationCreatedV4 body; Angi's CRM lead delivery) to the source-specific lead receiver, and Yelp posts a notice naming new leads to the Yelp notice receiver, which Glove reads from Yelp's Leads API with the owner's key; Google Local Services has no push, so Glove reads the last week's leads from the Google Ads API (local_services_lead) with the owner's OAuth credentials and developer token on every scheduled run (every 15 minutes) and when the desk chooses **Read new leads** (lead pull action), and a failed scheduled read is a provider fact in Activity.
4. Google reads every response page with the same query and the provider's next-page token; repeated tokens, malformed rows or a failed later page refuse that entire read before requests are written.
5. Scheduled and desk retries retain one request per provider lead ID.
6. The posting doors authenticate before reading the body, as `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`'s unsigned callbacks do: HTTPS Basic user glove with a per-source password of 32 random bytes shown only in the connecting owner's response and kept as its SHA-256 hash (compared in constant time; reconnecting replaces it at once); every credential or form failure answers the same 401 body, writes nothing, and after 20 rejections from one address in a minute 429; a lead older than 7 days is refused, and a lead already landed (by provider and provider lead ID) lands nothing again.
7. Basic door passwords are stored only as SHA-256 hashes; provider keys are installation-local values in the installation-private provider store, with no sealed or encrypted storage claim.
8. Both stay out of records, Activity, command outcomes, the export and the archive.

#### BOOK-014 — Lead-source credential custody

*Tier:* Core · *From:* BOOK-004 · *Cites:* BASE-DATA-004, BASE-SECRET-001

**Requirement.** Lead-source credential custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A lead becomes a request with its provider as source and its provider lead ID, for the one existing customer whose phone (last ten digits) or email equals the lead's, else for a new customer (and site, when the lead names an address) that `CUST-005` flags if it resembles another.

#### BOOK-015 — Lead costs and acknowledgments

*Tier:* Core · *From:* BOOK-004 · *Cites:* BASE-DATA-004

**Requirement.** Lead costs and acknowledgments supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A cost the provider reports (Thumbtack's leadPrice) is the request's lead cost; a workflow rule on enquiry created action with the action leadCost (`API-005`) applies its amount to a request from its source that has no cost yet (a provider-reported cost is kept and the run says so), and the owner or office sets or corrects a cost (enquiry cost action).
2. Each lead's acknowledgment is queued with its text and due time (received + the source's minutes) on the request; it is never sent automatically: the desk records it sent outside Glove (enquiry acknowledged action), noting when that was after the window.
3. The sent state is that person’s external-send attestation, not provider-confirmed delivery or proof of meeting the provider’s response window.
4. The 60-minute default and 5–1,440-minute range are product choices.
5. Under ct's approval on 24 October 2026 at 05:58Z, only an unscoped owner acting as a person explicitly approves each Yelp acknowledgment (enquiry reply action, confirm: true).
6. It uses the unexpired masked reply address from that lead, never a subsequently edited customer address, through the connected customer email provider.
7. The command commits one message before sending, and replay or a second command never resends that acknowledgment.
8. Provider mail acceptance or delivery is shown from the existing mail receipts; neither confirms receipt in the Yelp conversation or meeting Yelp's response window.

#### BOOK-016 — Explicit lead acknowledgment execution

*Tier:* Core · *From:* BOOK-004 · *Cites:* BASE-DATA-004

**Requirement.** Explicit lead acknowledgment execution supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#book-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. No acknowledgment is sent automatically.

#### BOOK-017 — Reserve with Google request intake

*Tier:* Core · *From:* BOOK-004 · *Cites:* BASE-DATA-004

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

#### BOOK-005 — Service calls booked without a quote

*Tier:* Core · *Cites:* BASE-AUDIT-001

**Requirement.** The dispatcher or office creates a job straight from a request, a call or the customer record with zero or more lines (for example a diagnostic or trip fee from the price book), books its visit under `GLOVE-05`'s conflict review with an arrival window (`DISP-006`), and the customer gets the confirmation of `COMM-003, COMM-019, COMM-020`. On site the technician adds flat-rate or time-and-materials lines from the price book (with prices where the owner allows under `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`, otherwise priced by the office), and the customer's approval of the added work is recorded on the phone; the fee, the added lines and the recorded materials flow to the invoice draft under `GLOVE-09`. A job made without a quote says so on its timeline, and none of its prices counts as approved until its invoice revision is approved. The [operating rules](docs/service-work-rules.md#book-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89.00 diagnostic fee from the price book, books it for today, and the technician adds a flat-rate valve replacement and 1.5 hours of labor on site with the customer's approval; the invoice draft carries exactly the fee, both lines and the recorded materials, and is approved and invoiced; a browser journey creates the same kind of job from the customer record.
2. The dispatcher, the office or the owner makes a service call (job create action without a quote) from a request (which is then won) or from the customer record, at one of that customer's sites, with zero or more lines from the price book or custom; its checklist and forms come from those lines as for a quoted job.
3. Its timeline says it was made without a quote, its screen shows no accepted price, and its booking, field capture and completion are any job's.
4. On site the assigned technician adds work only on a service call (on a quoted job that is a change order, `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`): a price-book item other than a material, a quantity, and the customer's approval (their name, and signed on the phone or told in person), queued through the phone's outbox; the technician sees no prices.
5. The invoice draft carries the job's lines, then the added work and the recorded price-book materials at today's price-book prices, so the office prices them by preparing, revising and approving the invoice under `GLOVE-09`; until that approval none of the job's prices counts as approved.
6. A service call's arrival window comes with `DISP-006`, the customer's confirmation with `COMM-003, COMM-019, COMM-020`, and technicians pricing their own added work where the owner allows with `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`.
7. The office makes service calls only: a job from an accepted quote stays the dispatcher's or the owner's (`GLOVE-05`).

#### BOOK-006 — Assessment visits on a request

*Tier:* Core

**Requirement.** A request can carry a scheduled assessment (an on-site estimate): the technician or salesperson, date, time, arrival window and instructions. It sits on the dispatch board and the assessor's phone like any visit, blocks that calendar time (`GLOVE-07` conflict review applies), sends the customer's confirmation and reminders (`COMM-003, COMM-019, COMM-020`), and lets the assessor record notes, photos, measurements and a custom form (`FIELD-002`) before any quote exists. Completing the assessment turns the request into a quote draft carrying those notes, photos and form results, or into a field quote under `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`; the assessment, the request and the quote stay linked on the customer and property history (`CUST-001`). The [operating rules](docs/service-work-rules.md#book-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture books an assessment on a water-heater replacement request, checks it blocks an overlapping booking for that technician until reviewed, records two photos and a form on the phone, completes it, and converts the request into a quote draft carrying the photos, notes and form results; the assessment shows on the request, the quote and the customer history.
2. The dispatcher or owner books an assessment on an open request (assessment book action): the technician, local date, start and end, instructions and up to 10 of the owner's forms (`FIELD-002`); one open assessment per request.
3. It is a job of kind assessment with no lines or price, linked to the request, whose visit is booked under `GLOVE-05`'s conflict review, so it sits on the board and the assessor's phone and blocks that time like any visit, and takes the same field capture (arrival, notes, photos, forms, through the outbox).
4. Completing its visit marks it assessed (never "completed, not invoiced" and never invoiced).
5. A quote drafted from that request carries the assessment's notes, photos and form results and its link; the request names its assessment; the assessment, the request and the quote show on the property history (`CUST-001`).
6. The arrival window comes with `DISP-006`, the customer's confirmation and reminders with `COMM-003, COMM-019, COMM-020`, and turning it into a field quote on the phone with `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`, each carrying it in its text and acceptance.

### Quotes and approval

#### QUOTE-001 — Good, better and best options and add-ons

*Tier:* Core

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

#### QUOTE-002 — Online approval with e-signature

*Tier:* Core · *From:* QUOTE-002 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001 · *Register:* R-1, R-2

**Requirement.** Online approval with e-signature supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations. Recorded decisions: RL-4.

**Acceptance.**
1. A fixture opens a sent quote link, finds each price-book line's customer-facing description (`MONEY-003, MONEY-006`), chooses the middle of three options and one add-on (`QUOTE-001`, the job then carrying exactly that choice), requests a change, approves the revised quote with a drawn signature, and checks the signature record and that a stale revision's link cannot be approved.
2. A second quote with a 30-day validity date is opened on day 31: approval is refused, and "ask for an updated quote" puts a notice in the office queue and reopens the request.
3. A bearer delegates read, option choice, change request, decline, update request and signed approval for one price-approved revision.
4. Only a signed-in person issues it; one live link per revision, and reissue revokes the previous one.
5. The page reveals only that revision and its service site.
6. A forwarded link can be used; name and capacity are CLAIMED, never verified, with authentication basis recorded as a link sent by Glove to the address on record or handed out by staff to an unverified recipient.
7. A decision rechecks the issuer's live role and branch; job creation rechecks price approval.
8. One decision per revision wins between staff and online and freezes it; replay changes nothing.

#### QUOTE-008 — First quote decision freezes the revision

*Tier:* Core · *From:* QUOTE-002 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003 · *Register:* R-1, R-2

**Requirement.** First quote decision freezes the revision supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Requesting changes keeps the link live.

#### QUOTE-009 — Quote-link custody and expiry

*Tier:* Core · *From:* QUOTE-002 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-SECRET-001 · *Register:* R-1, R-2

**Requirement.** Quote-link custody and expiry supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The token is shown once, hashed separately at rest, sent in the URL fragment and Authorization header only, and absent from queries, logs, saved command outcomes, Activity, business exports and installation archives.
2. An older revision's link shows only “a newer revision was sent” and refuses decisions.
3. An expired quote remains readable and offers an update request once per revision until the link expires 90 days after validity.
4. Restore retains records and document hashes but requires new links; erasure follows DATA-001, DATA-005, DATA-006, DATA-007, DATA-008.
5. The quote-validity setting is owner-only, 1–3650 calendar days, default 30 for new revisions.
6. Drafts and revisions take an optional real validUntil date; validity includes that date in the frozen branch/business zone, and the link expires at local midnight starting the day after validity plus 90 calendar days.
7. Defaults change later revisions only.
8. Legacy revisions without validity must be revised and price-approved before a link can be issued.

#### QUOTE-010 — Signing consent and frozen customer copy

*Tier:* Core · *From:* QUOTE-002 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003 · *Register:* R-1, R-2

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

#### QUOTE-011 — Immutable signed customer copy

*Tier:* Core · *From:* QUOTE-002 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003 · *Register:* R-1, R-2

**Requirement.** Immutable signed customer copy supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The immutable self-contained HTML copy embeds its original images and signature and is stored with a verified SHA-256; desk and live customer-link doors return those same bytes.

#### QUOTE-012 — Quote-link issue and response records

*Tier:* Core · *From:* QUOTE-002 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-AUDIT-001, BASE-PUBLIC-001, BASE-PUBLIC-003, BASE-ROLE-001, BASE-SECRET-001 · *Register:* R-1, R-2

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

#### QUOTE-013 — Signed-copy confirmation and custody

*Tier:* Core · *From:* QUOTE-002 · *Cites:* BASE-ACCESS-003, BASE-ACCESSIBILITY-001, BASE-PUBLIC-001, BASE-PUBLIC-003 · *Register:* R-1, R-2

**Requirement.** Signed-copy confirmation and custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A connected COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 provider receives the winning HTML and text confirmation once after commit to the on-record email; actual provider outcomes remain separate from signing.
2. A refused confirmation does not undo the signature or claim delivery.
3. Reissue for an accepted/declined quote is read-only and preserves the frozen revision.
4. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 removes signed-copy chunks and signature evidence; rer export/import preserves their exact bytes while excluding bearer credentials.
5. Typed signing is always available by keyboard at 390 px, disclosure text and consent controls retain labels/focus, and the signing page reflows without sideways scroll.
6. No verified-identity or ESIGN/UETA/eIDAS validity claim is made.

#### QUOTE-003 — Deposits on approval

*Tier:* Core · *From:* QUOTE-003

**Requirement.** Deposits on approval supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture approves a $1,850 quote with a $500 deposit (Stripe fake), finds the deposit on the job, and checks the final invoice shows $1,350 due.
2. Only the signed-in unscoped owner sets service deposit action for future quote revisions or quote deposit action on an unapproved draft: an amount or a percentage above zero and at most 100, with half-up cent rounding against the eventual chosen total.
3. The rule is frozen in the linked revision, chosen-document hash and signed copy; approved/accepted revisions cannot change it.
4. After the winning current price-approved revision is signed under QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 and its exact job exists, that owner alone can prepare test card/ACH Checkout (payment deposit checkout action).
5. A confirmed deposit stays on that job; invoice preparation links it and any prior original-method refund to the final invoice once, and only net confirmed funds reduce the balance.
6. Pending ACH remains pending.
7. Original-method refunds use PAY-004, PAY-021, PAY-022, PAY-023, including before invoice preparation.

#### QUOTE-014 — Customer deposit payment boundary

*Tier:* Core · *From:* QUOTE-003

**Requirement.** Customer deposit payment boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Customer quote bearers cannot invoke a payment door or initiate a charge.
2. No public customer Checkout or automatic charge on signing is enabled.

#### QUOTE-004 — Automatic quote follow-up

*Tier:* Core · *Rules:* D-1 · *Register:* R-9

**Requirement.** QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 inheritance: stop on the winning staff or customer-link decision and the frozen validity date; an update request notifies the office and needs a newly approved revision. The owner sets a follow-up sequence (for example day 2 text, day 5 email, day 10 call task); Glove sends it through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`/`COMM-002` for every unanswered quote, stops the moment the customer answers, the quote is closed or it reaches its validity date (`QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013`), and shows which step each open quote is on. The [operating rules](docs/service-work-rules.md#quote-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture advances a clock past each step for three quotes, one answered on day 3 and one whose validity date is day 7, and checks exactly which messages were sent, that the answered quote's sequence stopped, and that the expiring quote's day-10 step was never sent.

#### QUOTE-005 — Branded quote, invoice and report documents

*Tier:* Core · *From:* QUOTE-005

**Requirement.** Branded quote, invoice and report documents supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds logo, license number, terms, an attached photo and each price-book line's customer-facing description (`MONEY-003, MONEY-006`) in both; it then opens an invoice and a service report and finds the EIN, two license numbers and logo set under `MONEY-002` printed on each.
2. FIELD-003 inheritance: render the immutable service report as the branded PDF with every snapshot field and flagged form reading, asserted in the document journey.
3. The signed-in owner edits plain-text heading, terms and footer per document kind, and explicitly attaches customer-facing photos.
4. Issuing a quote link freezes the business identity, template, line descriptions/images and attachments in its hashed customer document; completing a report freezes the same identity/template with every report field.
5. Later edits never change those snapshots.
6. Invoices and agreements use their current desk-authorized projection and current template; invoice lines retain the approved job’s customer descriptions/images.

#### QUOTE-015 — Document presentation and print

*Tier:* Core · *From:* QUOTE-005 · *Cites:* BASE-DATA-001, BASE-ROLE-001

**Requirement.** Document presentation and print supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Existing role, branch, revision and original-file guards apply.
2. Dates use US calendar presentation and ten-digit phones use US punctuation; saved legacy addresses and time zones remain as recorded.
3. Print / Save PDF invokes the browser’s print renderer after removing a bearer fragment, restores the link after printing, includes the whole document and hides response controls.
4. No signing, send or delivery claim is added; QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013/006 retain their owner-disclosure gate and COMM-006, COMM-022, COMM-023, COMM-024, COMM-025 inherits the same document and original-file restrictions.

#### QUOTE-006 — Field quotes and change orders, offline

*Tier:* Core · *From:* QUOTE-006

**Requirement.** Field quotes and change orders, offline supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture with the network off builds a two-option field quote, captures the customer's signature, reconnects, and finds the approved change order on the job and its lines on the invoice draft; an out-of-range price waits for approval; and the `REPORT-002, REPORT-004` technician report shows that technician's close rate from their field quotes; a completed assessment becomes a field quote carrying its photos.
2. The unscoped signed-in owner explicitly enables online field pricing per technician, bound to that technician’s current sign-in.
3. The technician reads selling prices and their own field quotes only while currently assigned to an open job or completed assessment.
4. The ordinary state and offline day remain unpriced.
5. Options use active price-book items, authoritative tax and descriptions, and the owner’s inclusive per-line unit-price bounds expressed as whole percentages of the current price-book price.
6. A price outside those bounds is flagged for the desk; every draft remains subject to ordinary desk price approval.
7. Drafting from a completed assessment retains its notes, photos and form results.

#### QUOTE-016 — Field-quote custody and selling figures

*Tier:* Core · *From:* QUOTE-006

**Requirement.** Field-quote custody and selling figures supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Command replay returns only a receipt and never another copy of the priced document.
2. Revocation and reassignment close the read and new-draft doors; sign-in relinking requires a fresh owner grant.
3. A grant never approves a customer-facing price or creates a customer decision, signature, send or job amendment.
4. The technician report counts accepted field quotes divided by accepted or declined field quotes answered in its inclusive business-local date period, to one decimal percent; unanswered drafts are excluded and an empty denominator is unavailable.
5. Its JSON and CSV carry accepted and answered counts.
6. A desk-recorded acceptance defaults its commission seller to the originating technician, retaining the existing explicit desk override.
7. The remaining phone, signing and change-order work retains QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013, GLOVE-06, TEAM-003, TEAM-006 and DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 obligations.

#### QUOTE-017 — Apply the signed change order

*Tier:* Core · *From:* QUOTE-006 · *Cites:* BASE-AUDIT-001

**Requirement.** Apply the signed change order supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A technician explicitly drafts additions with field quote draft action; an assessment can only produce a new quote.
2. The signed-in unscoped owner explicitly invokes field quote apply action with the current quote and source-job versions.
3. The current revision needs its desk price approval, winning customer acceptance and frozen QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 signature, disclosure and signed-copy evidence.
4. The selected lines append once to the same open source job, with their applicable checklists and forms; its ordinary completion and invoice preparation carry those lines while invoice approval remains separate.
5. A field change order cannot create another job.
6. Replays return the receipt only.
7. Activity and export retain the quote revision, signed-copy hash and application actor and time.

#### QUOTE-018 — Change-order reconciliation and authority

*Tier:* Core · *From:* QUOTE-006 · *Cites:* BASE-ROLE-001

**Requirement.** Change-order reconciliation and authority supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Existing invoices, recurring billing, discounts, deposits, mismatched frozen tax or a combined rounding difference refuse for explicit desk reconciliation; they are named engineering gaps, never silently repriced.
2. Field drafts without the explicit change-order flag retain the ordinary new-job path.
3. Authority approved by ct 24 October 2026 16:35Z: explicit signed-in unscoped owner application only; scoped or non-owner sessions and unsigned or desk-unapproved changes refuse, and signing alone never amends a job.

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

#### QUOTE-019 — Role discount limits

*Tier:* Core · *From:* QUOTE-007 · *Cites:* BASE-ROLE-001

**Requirement.** Role discount limits supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#quote-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Limits: the owner is unlimited; business save action discountLimits gives each built-in or custom role a maximum percent of the document's gross (positive-line) subtotal, counting discount lines and the document discount together; an unlisted role gives none, checked on person and agent quote drafts and revisions and invoice preparations, revisions and corrections; carrying an accepted quote's discount unchanged is not giving one; A binding price decision carries commitment when an agent makes it, and the company’s policy decides that call; a person’s own price approval remains their own act.

### Scheduling and dispatch

#### DISP-001 — Drag-and-drop dispatch board

*Tier:* Core · *Cites:* BASE-ACCESSIBILITY-001

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

#### DISP-002 — Map board and travel time

*Tier:* Core · *From:* DISP-002 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-SECRET-001

**Requirement.** Map board and travel time supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture opens the map board with a fixture day, sees pins and drive times (provider fake), and the technician's phone offers a directions link with the site's address; a flow test draws a zone for a technician and checks a booking at a site outside it gets the area warning.
2. Only the owner connects Google Maps Platform with their own key, kept as an installation secret (never in state, Activity, a command result, the business export, the installation archive or a log; a restored installation needs it entered again).
3. While it is connected, saving a site with a new or changed address places it with Google's Geocoding API (the street address only goes to Google) and keeps its latitude and longitude on the site, or says Google found no such place; the desk places listed sites again with site locate action.
4. The day board shows a route map over the board (the day map, desk roles only): Google's base map (Static Maps API, asked for by center and zoom only) under Glove's own numbered pins for each technician's stops in order, the legs between consecutive stops with the drive time and distance from Google's Routes API (driving, traffic-unaware; only the stops' coordinates go to Google), and the zones drawn for each technician; a stop whose site is not on the map is listed with **Place on the map**.
5. On the technician's phone each visit offers directions to the site's address in Apple Maps, Google Maps or Waze.
6. The owner draws a technician's zones on the map (technician zones action: up to 20 named polygons of 3 to 100 corners, by clicking corners or typing them).
7. A technician's service area is their ZIP codes and drawn zones together: with zones drawn, a site whose ZIP is not listed and which is not inside any zone (a site not on the map is inside none) falls under the owner's area rule, warned for review or refused, exactly as `DISP-004`'s ZIP rule.

#### DISP-010 — Travel-aware automatic assignment

*Tier:* Core · *From:* DISP-002

**Requirement.** Travel-aware automatic assignment supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. It also carries `DISP-006`: travel time from the previous visit joins the automatic-assignment ranking.
2. With Google Maps connected, `DISP-006`'s automatic assignment adds to each candidate's booked minutes their drive minutes from their previous visit that day (the latest ending by the new start; none, no drive) to the job's site, and picks the fewest booked-plus-drive minutes, then by name, naming each one's booked and drive minutes in the ranking; a site Google cannot place, or a drive with no route, refuses the automatic booking so the dispatcher chooses.
3. Live technician positions are `DISP-005, DISP-012`'s, and route optimization `DISP-003, DISP-011`'s, each carrying the map board in its text and acceptance.

#### DISP-003 — Route optimization

*Tier:* Core · *From:* DISP-003

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

#### DISP-011 — Apply or discard a route proposal

*Tier:* Core · *From:* DISP-003 · *Cites:* BASE-DATA-001, BASE-DATA-003, BASE-ROLE-001

**Requirement.** Apply or discard a route proposal supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Route accept action requires a person's reason, fresh live dispatch/branch authority, unchanged day/eligibility dependencies and a fresh provider matrix, then commits every move and assignment history together.
2. Discard, provider refusal, expiration and stale proposals move nothing.
3. Restore retains proposal metadata but requires Google Maps to be reconnected; customer erasure discards affected undecided proposals and redacts their erased references.

#### DISP-004 — Skills, availability, time off and service areas

*Tier:* Core · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-SECRET-001

**Requirement.** Technician eligibility combines skills, hours, time off, ZIP codes and drawn service areas, calendar busy spans and the owner’s warn-or-refuse area rule. Lanyard availability is a read-only connector scoped to one explicitly selected worker; credentials and unrelated staff or payroll information remain private. The [operating rules](docs/service-work-rules.md#disp-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture books a gas job for a technician without the gas skill (refused), on their day off (refused) and outside their area (warning), then books it for an eligible technician; a flow test reads a technician's calendar (provider fake), refuses a booking over a busy span and books a free one, and checks the address is readable only by the owner and that technician and absent from state, timeline, command results and export.
2. A fixture has the owner connect a technician with an explicit staff ID and key, checks the key is absent from state, Activity, command results, the export and the archive, checks Glove sent only GETs to the fixed availability path with nothing about customers or jobs and refused a redirect, checks only that staff member's availability windows and approved-leave instants for the next 90 days are kept (Lanyard's recurring patterns as Lanyard defines them; pending and declined leave ignored; no names, payroll, preferences, reasons or other staff), warns or refuses a booking by the owner's setting, keeps and labels the last snapshot with its read time after a failed read with a generic message, clears it on disconnect, shows reconnect for an expired key, and refuses an http, non-public-host or credential-bearing origin.

#### DISP-005 — Live technician location and ETA

*Tier:* Core · *From:* DISP-005 · *Cites:* BASE-ROLE-001

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

#### DISP-012 — Position disclosure and delay estimate

*Tier:* Core · *From:* DISP-005 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-ROLE-001

**Requirement.** Position disclosure and delay estimate supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. It also carries `AGENT-003, AGENT-010`: the delay watch adds a late technician's position and ETA to its at-risk reasons and same-time options.
2. A current position goes only to the owner within their branch scope, and its coordinates go to the already-connected Google Routes API for a traffic-unaware driving estimate to the next booked visit.
3. This is a driving estimate from the moment of reading, not a departure promise; the delay watch retains its existing overrun and promised-window rules.
4. Missing routes and stale positions never invent an ETA.
5. Coordinates and fleet keys are absent from state, Activity values, command results, business exports and installation archives.
6. Delegated Dispatcher and named-agent location views follow DISP-009’s current-shift grants.
7. An agent’s location call carries standard and the company’s policy decides it within that authority.
8. `COMM-004, COMM-021` inherits customer notices and `FIELD-005` inherits native background capture before those capabilities ship.

#### DISP-006 — Arrival windows and automatic assignment

*Tier:* Core

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

#### DISP-007 — Multi-day jobs, crews and subcontractors

*Tier:* Core · *From:* DISP-007

**Requirement.** Multi-day jobs, crews and subcontractors supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-007-operating-rules) retain the record formats and calculations. Recorded decisions: RL-8.

**Acceptance.**
1. A fixture books a three-day install for a two-person crew and a subcontractor, checks each sees only their visits, and checks the subcontractor's total in the 1099 export; a browser journey drags the crew's visit to another day on the `DISP-001` week board by crew.
2. A job holds any number of visits over any days.
3. The owner (acting for "admin") names crews of 2 to 10 active technicians or subcontractors; changing a crew changes only later bookings.
4. Booking a crew books one visit per member at the same date and times in one command, after one review of every member's conflicts.
5. Moving any visit of that booking moves every member's visit in it that is not completed or canceled to the same date and times, never to another technician, after one review.
6. Canceling cancels them all, and is refused while a member has recorded evidence on theirs.
7. The dispatch board's Rows choice shows crews instead of technicians in the day, week and month, one chip per crew booking, dragged or moved by keyboard as one.

#### DISP-013 — Subcontractor field access

*Tier:* Core · *From:* DISP-007 · *Cites:* BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** Subcontractor field access supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Subcontractor is a built-in role, invited and signed in like staff.
2. A subcontractor sees only the visits now assigned to them and, for those, the job title, checklist and forms, the site's address and access notes, the customer's name and phone, and their own captures.
3. They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, other people's work or other visits.
4. They record arrival, checklist items, notes, photos, materials by description, forms and completion on their visits.
5. They cannot clock in, run timers, record refrigerant or expenses, or add priced work, and their phone keeps no offline day and gets no pushes (`FIELD-001` and `FIELD-004, FIELD-009, FIELD-010` are the Technician's).

#### DISP-014 — Subcontractor agreed amounts and filing totals

*Tier:* Core · *From:* DISP-007

**Requirement.** Subcontractor agreed amounts and filing totals supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner marks a technician record as a subcontractor with a 1099 payee name and the last 4 digits of the TIN; a full TIN is refused and never stored.
2. The owner sets an agreed amount on each of their visits.
3. The 1099-NEC totals for a calendar year, which the owner and office read as JSON or CSV, sum each subcontractor's agreed amounts on their visits completed that year (dated by the completion Glove received, in the business time zone), with the visit count and whether the total is $600 or more.
4. They are labelled "Totals for your filing, not a filed 1099"; Glove files nothing.
5. Timesheets and payroll exports stay `COST-002, COST-006, COST-007`'s.

#### DISP-008 — Google Calendar and Outlook sync

*Tier:* Core · *From:* DISP-008 · *Cites:* BASE-DATA-001

**Requirement.** Google Calendar and Outlook sync supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture books, moves and cancels a visit and checks the calendar provider fake receives create, update and delete, and that a busy block refuses an overlapping booking.
2. The unscoped owner explicitly connects one delegated Google or Microsoft calendar per technician and approves one-way visit writes.
3. Customer details default to hidden; the owner may include customer name and service address only.
4. No attendees or contact channels are sent.
5. Credentials, pending delivery work and event mappings are excluded from archives; restore requires explicit reconnection.
6. Booking refreshes busy time and refuses an unreadable provider; only busy instants are retained.
7. The existing private iCal connection remains independent.

#### DISP-015 — Calendar change delivery and uncertainty

*Tier:* Core · *From:* DISP-008

**Requirement.** Calendar change delivery and uncertainty supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#disp-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. All committed visit changes enqueue provider work, including technician reassignment.
2. Uncertain writes remain visible and stop later work on that connection, without automatic replay.
3. Disconnect stops writes and retains existing provider events for owner review.

#### DISP-009 — Delegated dispatcher position view

*Tier:* Core · *Cites:* BASE-ROLE-001

**Requirement.** The owner may grant a Dispatcher position view per technician and shift. The technician is told the view is on, every read is audited, and custody remains latest-only. Agent reads remain denied unless the owner grants the same view to a named agent. This is ct's 25 October 2026 rider to `DISP-005, DISP-012`, assigned the next free numeric ID. The [operating rules](docs/service-work-rules.md#disp-009-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner grants a named dispatcher or agent the current-shift position view for named technicians, and the record retains the grant.
2. The granted view reveals only fresh current positions and estimates; expiry, revocation, clock-out and consent withdrawal end that view.
3. An agent’s granted position read carries standard and follows the company’s policy.

### Customer communication

#### COMM-001 — Customer email with delivery status

*Tier:* Core · *From:* COMM-001 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · *Register:* R-9

**Requirement.** Customer email with delivery status supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations. Recorded decisions: RL-9.

**Acceptance.**
1. A fixture sends a quote, an invoice and a purchase order to its supplier (provider fake), replays delivered and bounced events, and checks each message's state on the timeline and the bounce warning on the customer.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
3. COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.
4. The owner connects customer email (mail connect action): SendGrid or Resend through Base's mail adapter, or Postmark or Amazon SES through fixed provider endpoints, a from-address and optional name, the provider API key and, for SendGrid/Resend, its event-webhook verification key (SendGrid's Signed Event Webhook public key or Resend's whsec_ signing secret), kept as installation secrets that are never shown again, exported or archived; {provider: null} disconnects.
5. Glove does not check the sending domain itself: the provider refuses mail from a domain it has not verified, and that refusal shows on the message.
6. The desk emails what each person may already record as sent (email send action): an approved quote's current revision to the customer's email (owner, dispatcher, office; the quote is then sent, naming the email), an approved or exported invoice to the customer's accounts-payable address, else their email (owner, office), and a draft purchase order to its supplier's address (owner, office; the order is then sent); agreement offer action with email: true emails a `PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011` booking link to the customer's own email address.
7. Every email Glove sends today is transactional; no marketing email is sent.
8. Replies go to the business email when one is set.

#### COMM-010 — Message outcomes and customer warnings

*Tier:* Core · *From:* COMM-001 · *Cites:* BASE-AUDIT-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · *Register:* R-9

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

#### COMM-011 — Future document-email inheritance

*Tier:* Core · *From:* COMM-001 · *Cites:* BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · *Register:* R-9

**Requirement.** Future document-email inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 inherits a confirmation copy of the winning signed revision to the on-record email, with the same provider outcomes, before online signing ships.
2. Inheritance : receipts join with `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020` and `PAY-004, PAY-021, PAY-022, PAY-023`, appointment confirmations with `COMM-003, COMM-019, COMM-020` (which also carries `FIELD-003` report links), and review requests with `COMM-008, COMM-026, COMM-027`; each emails through this door with the same provider outcomes , and any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address.

#### COMM-012 — Morning-brief email

*Tier:* Core · *From:* COMM-001 · *Cites:* BASE-AUDIT-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · *Register:* R-9

**Requirement.** Morning-brief email supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. It also delivers the owner's `AGENT-008, AGENT-016` brief in the morning and asserts the provider delivery outcome without a duplicate delivery for that business-local date.
2. Only the owner turns it on or off (mail morning action, with customer email connected first; time is a business-local the documented refusal, 07:00 by default); it is off until then, and opening the brief never sends anything.
3. Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in the business time zone) is at or past time on a local date emails that date's brief, as `AGENT-008, AGENT-016` prepares it for that instant, to the owner's active sign-in address (the owner account's email, not the business email) through the connected provider; a business-local date gets at most one send, claimed once as a queued fact in the timeline before the provider is called, so a repeated or simultaneous run sends nothing more and a crash between claim and send loses that date's email rather than sending it twice.
4. A run before time, with email off or disconnected, or without an active owner address sends nothing.
5. The provider's answer (accepted, refused, rate limited or not confirmed) and its signed delivery events (the mail callback, accepted only for that recipient and that date's delivery id) are provider facts on that date in Activity and the business export, with the provider's reference and no key or brief body; the Today screen and the owner brief (emailed) show the date's state exactly as those facts fold, with what to do next, and "delivered" means the recipient's mail server accepted it.
6. Nothing is retried: a failed date stays failed and the next local date sends its own brief.
7. The email carries the brief's own text and, being a transactional notice to the owner of their own records, no marketing content.

#### COMM-013 — Callback authentication before effects

*Tier:* Core · *From:* COMM-001 · *Cites:* BASE-AUDIT-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · *Register:* R-9

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

#### COMM-014 — Callback rejection accounting

*Tier:* Core · *From:* COMM-001 · *Cites:* BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · *Register:* R-9

**Requirement.** Callback rejection accounting supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Every future inbound-email receiver inherits this authentication before shipping.
2. Rejection accounting uses a shared transient actor keyed by a hashed source address, with no durable counter or business write.

#### COMM-015 — Postmark callback custody

*Tier:* Core · *From:* COMM-001 · *Cites:* BASE-AUDIT-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · *Register:* R-9

**Requirement.** Postmark callback custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Postmark: HTTPS Basic user glove, with a per-installation password generated from 32 random bytes and shown only in the first owner response.
2. Store only its SHA-256 hash and compare in constant time.
3. Mail callback action keeps the previous hash valid for exactly 24 hours (exclusive expiry), revokePrevious ends that overlap immediately, and disconnect revokes both.
4. Rotation, revocation and allowlist changes are Activity facts without secrets.
5. The optional source-IP allowlist is off by default, pinned in source with a dated provider reference, fails closed when on and never replaces Basic authentication; reconnecting credentials preserves this owner option unless explicitly changed.
6. Plain-HTTP Postmark callbacks are refused without writes.
7. Replay identity is event type plus Postmark ID, or message ID + type + recipient + time when no ID exists; refuse events over 7 days old.
8. Sends include Glove's delivery ID in Postmark metadata.

#### COMM-016 — Postmark delivery-outcome mapping

*Tier:* Core · *From:* COMM-001 · *Cites:* BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · *Register:* R-9

**Requirement.** Postmark delivery-outcome mapping supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Delivery maps to delivered, hard bounce to bounced, soft bounce to deferred or failed when final, and SpamComplaint to complained.

#### COMM-017 — Amazon SES and SNS callback custody

*Tier:* Core · *From:* COMM-001 · *Cites:* BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · *Register:* R-9

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

#### COMM-018 — Email provider proof boundary

*Tier:* Core · *From:* COMM-001 · *Cites:* BASE-DATA-001, BASE-MAIL-001, BASE-OPS-003, BASE-OPS-004, BASE-SECRET-001 · *Register:* R-9

**Requirement.** Email provider proof boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Document email, morning brief, callback outcomes and restored connections are proven against the configured provider’s network edge.

#### COMM-002 — Texts from a registered US number

*Tier:* Core · *Cites:* BASE-AUDIT-001, BASE-OPS-003, BASE-SECRET-001 · *Rules:* D-1 · *Register:* R-10

**Requirement.** The owner connects Twilio (or another provider) with a US number registered for A2P 10DLC or toll-free verification; Glove records each customer's SMS consent (source, time, wording), honors STOP, HELP and START in every thread, keeps quiet hours by the customer's time zone, and records sent, delivered and failed per message. The owner keeps their existing business number: it is ported to Twilio, or text-enabled in place as a hosted number while voice stays with the current carrier, with the port or hosting status shown until it is live; a new number is the owner's choice, never the only path. A customer's recorded opt-out also keeps them out of every `CUST-004, CUST-006` segment push. DATA-002, DATA-009, DATA-010 inheritance: every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. The [operating rules](docs/service-work-rules.md#comm-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture texts a consenting customer (provider fake), replays delivered and failed callbacks, receives STOP and checks the next send is refused with the reason, and checks no automated text is sent in quiet hours; a hosted-number order and a port request (provider fake) show their status until the number is live, and sends then use it; a customer who replied STOP is left out of a `CUST-004, CUST-006` segment push.
2. It also carries `AGENT-003, AGENT-010`: a texted customer's reply confirming or refusing a visit moved around a delay lands on that visit, replacing "customer not yet asked", and an `AGENT-009`-granted agent move texts the customer.
3. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
4. COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.

#### COMM-003 — Appointment confirmations and reminders

*Tier:* Core · *From:* COMM-003 · *Cites:* BASE-AUDIT-001, BASE-MAIL-001 · *Rules:* D-1 · *Register:* R-9

**Requirement.** Appointment confirmations and reminders supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture books, moves and cancels a visit and checks the exact messages and their timing, and a reply "reschedule" opens a request on the job; an owner-edited reminder template with merge fields is exactly what the customer receives, and its opt-out wording cannot be removed; booking an assessment on a request sends its confirmation.
2. FIELD-003 inheritance: the customer receives its service-report link through the configured notice channel with the provider outcome asserted.
3. COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 inheritance: every confirmation, reminder and report-link notice it emails goes through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`'s door with the same provider outcomes: one send attempt per message, recorded with the provider's answer and reference on the message, the visit's timeline, Activity and the business export without secrets; state changes only from authenticated provider callbacks; delivery is never claimed without the provider's event.
4. Any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address.
5. The owner previews plain-text templates through reminder preview action, then explicitly approves templates and the schedule through reminder configure action.
6. The immutable footer adds the business name and office-handled stop instructions.
7. No links or markup are accepted in templates.

#### COMM-019 — Visit notice scheduling and current consent

*Tier:* Core · *From:* COMM-003 · *Cites:* BASE-MAIL-001, BASE-ROLE-001 · *Rules:* D-1 · *Register:* R-9

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

#### COMM-020 — Other-purpose reminder inheritance

*Tier:* Core · *From:* COMM-003 · *Cites:* BASE-DATA-003, BASE-MAIL-001 · *Rules:* D-1 · *Register:* R-9

**Requirement.** Other-purpose reminder inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The pass reserves at most 50 messages.
2. PAY-005 uses frozen invoice due dates and current confirmed balances, stops on disputes and zero, and exposes actual state in aging.
3. QUOTE-004 uses elapsed 24-hour days after the revision was recorded sent and stops on any current-revision customer response, closure or the frozen expiry instant.
4. Erasure removes recipient consent, visit intent and message records through DATA-001, DATA-005, DATA-006, DATA-007, DATA-008.
5. The subsequent bounded text channel, explicit customer response and report-link doors, and quote-purpose unsubscribe are described in docs/sms-channel.md.
6. Future notice kinds inherit D-1 before shipping.

#### COMM-004 — On-my-way and job status texts

*Tier:* Core · *From:* COMM-004 · *Cites:* BASE-DATA-001, BASE-ROLE-001 · *Rules:* D-1 · *Register:* R-9, R-10

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

#### COMM-021 — Arrival and completed-report notices

*Tier:* Core · *From:* COMM-004 · *Cites:* BASE-ROLE-001 · *Rules:* D-1 · *Register:* R-9, R-10

**Requirement.** Arrival and completed-report notices supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. FIELD-003 inheritance: the report-ready notice carries its exact service-report link, with the provider delivery outcome asserted.
2. Arrival follows its separate exact owner-approved template only when the assigned technician’s fresh arrival reaches the server within two minutes; stale offline evidence still records arrival without a misleading text.
3. Completion can issue the immutable report’s seven-day link only under the approved report setting, current customer consent, quiet hours and current configuring-owner authority.
4. Only a hash persists; the bearer exists in the one provider attempt.
5. Replay never resends, uncertain delivery is not called delivered, and revoked or expired report links stop reading.
6. COMM-002, COMM-003, COMM-019, COMM-020 and COMM-005 retain their existing consent and channel obligations; DISP-009 retains delegated location views.

#### COMM-005 — Two-way texting inbox

*Tier:* Core · *Cites:* BASE-AUDIT-001, BASE-DATA-003, BASE-SECRET-001 · *Rules:* D-1

**Requirement.** Replies land in a shared inbox, threaded by customer and linked to the open job, with assignment, unread state and canned replies; technicians text customers from the job through the business number, never their personal number. DATA-002, DATA-009, DATA-010 inheritance: every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. Under RL-104, the owner separately opts into retained shared-inbox text; native desk users explicitly reply through D-1, and retained text follows customer erasure. The [operating rules](docs/service-work-rules.md#comm-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture receives a customer reply (provider fake), assigns it, answers with a canned reply, and finds the thread on the customer and the job.
2. It also carries `AGENT-003, AGENT-010`: a customer's confirmation reply to a moved visit is threaded on the customer, the job and that visit.
3. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
4. COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.

#### COMM-006 — Customer hub

*Tier:* Core · *From:* COMM-006 · *Cites:* BASE-ACCESS-003, BASE-AUDIT-001

**Requirement.** Customer hub supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-006-operating-rules) retain the record formats and calculations. Recorded decisions: RL-10.

**Acceptance.**
1. A fixture signs a customer in by a link, finds a quote's price-book line with its item's customer-facing description (`MONEY-003, MONEY-006`), approves the quote, pays an invoice (Stripe fake), requests work, and checks another customer's link reads none of it.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
3. FIELD-003 inheritance: the customer finds and reads their service reports in the hub, with report/file isolation asserted.
4. COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.
5. Existing staff send, receive, delivery-outcome and conversation-history targets remain with their owning communication clauses.
6. Complete customer browser acceptance at 1440 and 390 remains required.

#### COMM-022 — Customer-hub completion boundary

*Tier:* Core · *From:* COMM-006 · *Cites:* BASE-ACCESS-003

**Requirement.** Customer-hub completion boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Customer-hub quote signing, payment, work requests, visits, reports, agreement renewal, card updates and portal conversations retain their owning capabilities and customer isolation.

#### COMM-023 — Owner inspection of customer-facing projection

*Tier:* Core · *From:* COMM-006 · *Cites:* BASE-ACCESS-003, BASE-SECRET-001

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

#### COMM-024 — Customer preview has no transaction authority

*Tier:* Core · *From:* COMM-006 · *Cites:* BASE-ACCESS-003, BASE-ROLE-001

**Requirement.** Customer preview has no transaction authority supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Inspection creates no communication or payment effect.

#### COMM-025 — Projection authority and retained custody

*Tier:* Core · *From:* COMM-006 · *Cites:* BASE-ACCESS-003, BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Projection authority and retained custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Signed-out people, branch-limited Owners, other staff roles, custom roles, integration tokens and agents gain no projection access through this policy.
2. Refusal reads “An Owner without branch limits must sign in to inspect this customer preview” and reveals no customer content.
3. An unavailable customer reads “Customer preview unavailable” without exposing another customer’s records.
4. Each successful inspection records the actual Owner, time, selected customer reference and inspection effect in Activity and business export, without copying the projection body, private fields or credentials into the trail.
5. Restore reconstructs the projection only from permitted restored records under current authority; it restores no session, customer credential, link or sending or payment authority.
6. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erasure removes underlying personal content and personal saved outcomes or timeline copies, and the projection must not reconstruct erased content.
7. The trusted later erasure journal prevents an older backup from reviving erased content; an offline destination cannot discover a later erasure without that journal.

#### COMM-007 — One conversation history per customer

*Tier:* Core · *Cites:* BASE-AUDIT-001, BASE-INPUT-002, BASE-ROLE-001

**Requirement.** Customer and job conversation streams combine recorded calls and notes, actual sends and replies, document responses, provider outcomes and agent work in order, retaining direction, channel and actual author. Merging customers preserves those entries, and field-role restrictions remain in force. The [operating rules](docs/service-work-rules.md#comm-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture logs a call and a note on one job, reads them with today's real sends (a request and its follow-up, a quote recorded as sent and its signed acceptance, a purchase order recorded as sent, a delivered and a refused Web Push notice) and an agent's quote draft, in order, from the customer and job streams with direction, channel, author and delivery; field roles cannot read or log; agent log calls use their sponsor’s role and grant under the company’s policy; a merged customer's entries read on the survivor, and the logged call and note are in Activity and the business export.
2. Inheritance: `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`, `COMM-002`, `COMM-005`, `COMM-006, COMM-022, COMM-023, COMM-024, COMM-025`, `COMM-009, COMM-028` and `AGENT-001` each assert that its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.

#### COMM-008 — Review requests after paid jobs

*Tier:* Core · *From:* COMM-008 · *Cites:* BASE-AUDIT-001

**Requirement.** Review requests after paid jobs supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture completes and pays two jobs for one customer within the period and checks one request was sent; an opted-out customer gets none.
2. COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018: assert each emailed review request goes through the owner's provider (fake) with its provider outcome on the message, customer and job timelines, Activity and export without secrets, and that any email not strictly transactional carries the CAN-SPAM unsubscribe link and postal address.
3. COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 inheritance: every review request it emails goes through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`'s door with the same provider outcomes: one send attempt per message, recorded with the provider's answer and reference on the message, the customer and job timelines, Activity and the business export without secrets; state changes only from authenticated provider callbacks; delivery is never claimed without the provider's event.
4. Any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address.
5. COMM-008, COMM-026, COMM-027 still requires owner-selected automatic trigger execution, owner controls, text requests under COMM-002, and recording reviews reported by Google Business Profile.
6. Those capabilities inherit the same eligibility, consent, uniform wording, period and outcome controls; COMM-003, COMM-019, COMM-020 retains owner-editable template obligations.
7. DISP-009 is unchanged.

#### COMM-026 — Review-request consent and uniform wording

*Tier:* Core · *From:* COMM-008 · *Cites:* BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Review-request consent and uniform wording supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Review email is off by default.
2. The current signed-in owner explicitly configures one uniform request and explicitly requests every email; enabling this preparatory and manual capability does not enable automatic execution or retries. “Unscoped owner” means the owner's established current installation authority, without a branch-scoped or application-token credential; it never bypasses existing session, role, customer, job, branch or recipient boundaries.
3. Review-email permission is separate from visit notices, quote follow-ups and SMS permission.
4. The owner records the customer's affirmative permission with its source or reference and time against the current email address; a changed address requires permission for that address.
5. An address on file or owner configuration approval is not customer consent.
6. Existing do-not-contact, marketing and review opt-outs prevail.
7. Every eligible customer receives the same configured request, without sentiment filtering, with the business name, postal address and a purpose-specific unsubscribe.

#### COMM-027 — Review-request period and outcome custody

*Tier:* Core · *From:* COMM-008 · *Cites:* BASE-AUDIT-001

**Requirement.** Review-request period and outcome custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The period is per customer across jobs.
2. Every provider attempt consumes it, including refusal, rate limiting, failure and uncertain delivery; changing the job or message identity cannot bypass it.
3. An uncertain result remains unknown, never presumed unsent and never automatically retried.
4. Queueing, provider acceptance and authenticated delivery are distinct facts.
5. Configuration, consent and withdrawal, explicit requests or skipped reasons, and provider outcomes and references retain their existing attributable Activity, timeline and export custody without credentials or unsubscribe bearers.
6. This approves only the current manual-email boundary.

#### COMM-009 — Calls on the business number

*Tier:* Core · *From:* COMM-009 · *Cites:* BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** Calls on the business number supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#comm-009-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture replays Twilio voice webhooks (fake) for an answered call and a missed call, checks the call log, the recording notice and the missed-call text.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
3. COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.
4. Call routing starts off and only a signed-in Owner without branch limits explicitly configures the connected existing Twilio number, its ordered office and on-call destinations and optional final forwarding destination.
5. The present slice accepts only an unambiguous current customer number; unknown and shared-number callers remain a Gap, without creating customer identities.
6. Signed callbacks retain exact provider call references, durations and outcomes.
7. Only that Owner authority reads native call metadata and routing configuration.
8. Recording is refused and no recording notice or recording access is claimed.

#### COMM-028 — Missed-call reply and call custody

*Tier:* Core · *From:* COMM-009 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-SECRET-001

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

### Field work on the phone

#### FIELD-001 — Offline day of jobs that survives a reload

*Tier:* Core · *Cites:* BASE-DATA-002, BASE-ROLE-001

**Requirement.** The technician's phone keeps the day's assigned visits (customer, site, access notes, equipment, history, checklists, forms, photos already taken) cached, so the app opens, reloads and works with no signal; everything captured offline sends exactly once on reconnect under `GLOVE-06`, and a conflict with a desk change is shown, never silently overwritten. The [operating rules](docs/service-work-rules.md#field-001-operating-rules) retain the record formats and calculations. Recorded decisions: RL-11.

**Acceptance.**
1. A fixture loads the day, goes offline, reloads the app, completes a visit with photos and a form, reconnects, and checks everything landed once; a visit moved at the desk meanwhile shows the late-evidence review.
2. Only a signed-in Technician's phone keeps the day: that technician's own view (the visits ever assigned to them with those jobs' customers, sites, access notes, equipment, history, checklists, forms and captures; never prices), replaced on every successful refresh, kept in this browser's storage, and cleared on sign-out and whenever a different person or a desk role signs in on it.
3. A service worker keeps the app shell this phone loaded and that technician's photos, answering from them only when the network fails; it never keeps records or other the documented product door or the documented product door answers, and desk roles never keep records.
4. With no signal the app opens, reloads and works from the kept day, saying how old it is; everything recorded (arrival, checklist, forms, notes, photos, materials, completion) waits in the phone's outbox, in order, tied to the person who recorded it (another sign-in never sends or shows it), and sends exactly once on reconnect under `GLOVE-06`; a visit can be completed once its arrival is waiting to send.
5. Evidence for a visit the desk moved to someone else meanwhile is kept, flagged and reviewed under `GLOVE-07`, never silently overwritten.

#### FIELD-002 — Custom forms and inspections

*Tier:* Core · *Cites:* BASE-AUDIT-001, BASE-INPUT-003

**Requirement.** The owner builds forms (yes/no, choice, number with units, reading with range, photo, signature, notes, conditional questions) and attaches them to services, equipment types or agreements; technicians fill them offline; results appear on the job, the report and the equipment history. The [operating rules](docs/service-work-rules.md#field-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture builds an HVAC inspection form with a conditional question and a reading range, fills it on a visit with one out-of-range reading, and finds the flagged reading on the job and the equipment.
2. The owner builds a form of up to 60 questions (yes/no, choice, number with an optional unit, reading with a unit and an inclusive range, photo, signature, notes); a question can be asked only when an earlier yes/no or choice question has a given answer.
3. A form attaches to price-book services and to equipment types (matched without regard to case).
4. A new job takes a copy of each form that applies: one per unit the job names whose type the form lists, otherwise one for the job when a quoted service lists it; editing or archiving the form never changes a job's copy, and the per-service checklists stay as they are.
5. The technician fills each copy once on the phone, through the outbox, so it works without signal (`GLOVE-06`): every question asked and required must be answered, a question not asked must be left empty, and a reading below its lowest or above its highest value is flagged.
6. The filled form is a field record on the job and its timeline (naming how many readings are out of range), on the unit's service history when the copy is for a unit, and in the property history.
7. Agreements carry forms when `PLAN-002` ships, and the customer's report prints form results under `FIELD-003`.

#### FIELD-003 — Shareable service report

*Tier:* Core · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-ROLE-001

**Requirement.** Completing a visit produces an immutable service report: work summary, findings, `FIELD-002` form results with out-of-range readings marked, photos, materials, customer signature (or the recorded reason it is absent), and recommendations. The owner, dispatcher or office creates a seven-day link with **Copy report link** and shares it with the customer by hand today; Glove makes no delivery claim. Recommendations become a quote draft in one step under ordinary human price approval. COMM-003, COMM-019, COMM-020/004 inherit customer notices, COMM-006, COMM-022, COMM-023, COMM-024, COMM-025 the hub, and QUOTE-005, QUOTE-015 branded PDF documents, in their text and acceptance before shipping. The [operating rules](docs/service-work-rules.md#field-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Completing a visit freezes the customer report’s fields, form readings and flags, with only the technician’s first name.
2. A report link reads exactly that snapshot and its originals; another record or unrelated original remains unavailable.
3. Revocation, expiry or loss of the issuer’s current branch authority closes the link.
4. A recommended item creates one quote draft under ordinary price approval.
5. Report creation, sharing and recommendation outcomes appear in Activity, property history and business export.
6. Restore preserves exact snapshot bytes and link metadata, while requiring a newly issued bearer.

#### FIELD-004 — Installable technician app with push

*Tier:* Core · *From:* FIELD-004 · *Cites:* BASE-ACCESSIBILITY-001 · *Register:* R-1, R-2

**Requirement.** Installable technician app with push supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-004-operating-rules) retain the record formats and calculations. Recorded decisions: RL-12.

**Acceptance.**
1. A fixture installs the app manifest, subscribes to push, and receives a notification (push service fake) when the dispatcher moves the visit; from the visit, tap-to-call opens a tel: link to the customer's number and tap-to-navigate a maps link to the site's address.
2. The documented product door installs to the home screen from its web app manifest (Glove, starting at the documented product door, standalone, 192 and 512 px icons) and the home-screen tags iPhone reads; an iPhone shows web pushes only once Glove is added to its Home Screen (iOS 16.4 and later), which the phone screen says.
3. Field photos open the rear camera directly.
4. Tapping a notification opens the signed-in app on that job's visit.
5. On a visit, Call customer opens a tel: link to the customer's phone (its digits and a leading +) and Navigate to site opens Google Maps directions to the site's address (the Maps app where installed).
6. A local installation served from this computer also accepts a push service on this computer (the documented product door or localhost), so its own browser journey can run one; a hosted installation accepts only https push services.
7. `FIELD-005`'s native apps carry push in their own text.

#### FIELD-009 — Phone push subscriptions

*Tier:* Core · *From:* FIELD-004 · *Cites:* BASE-ACCESSIBILITY-001, BASE-DATA-001, BASE-ROLE-001, BASE-SECRET-001 · *Register:* R-1, R-2

**Requirement.** Phone push subscriptions supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair whose private key is an owner-only installation secret (never in records, state, exports, logs or the archive); turning them on again replaces the key, and turning them off deletes the key and every subscription.
2. A Technician turns notifications on for each phone.
3. A subscription (the push service address and the phone's keys) belongs to that person, that device and that signed-in session; only that person reads it back, as their list of phones (a label, the last outcome and when, never the address or keys); and it is deleted when they remove it, sign out on that phone, the session is ended elsewhere or expires, they stop being an active Technician (a role change or deactivation), the push service no longer knows it (HTTP 404 or 410), or the owner turns notifications off.
4. It is never in records, exports or the archive, so a restored installation needs fresh subscriptions.

#### FIELD-010 — Schedule-change push outcomes

*Tier:* Core · *From:* FIELD-004 · *Cites:* BASE-ACCESSIBILITY-001, BASE-ROLE-001, BASE-SECRET-001 · *Register:* R-1, R-2

**Requirement.** Schedule-change push outcomes supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. After every committed change, whoever or whatever made it (a person, a rule, a recurring series, an agent under the owner's grant, a move-in), each technician with a visit that has not ended and was booked to them, moved (its start or end changed), canceled, or handed to another technician gets one push on each subscribed phone: "New visit on your schedule" (also for the technician who receives a handed-over visit), "Visit moved", "Visit canceled" or "Visit moved off your schedule", or "N changes to your schedule" when one change touches several of their visits.
2. A push carries only that line and, when one visit changed, the job's opaque id; never the customer, site, time or a note.
3. Each push is encrypted for the phone (RFC 8291, aes128gcm) and signed with the VAPID key (RFC 8292: a 12-hour token naming the business email, else the installation address), kept by the push service for at most a day, and sent once, never retried.
4. The phone list says "Handed to the push service" (not "delivered", which Glove cannot see), "Not sent: the push service answered HTTP <status>" or "Not sent: the push service could not be reached".
5. Only a Technician subscribes, and no role, agent included, has a door that sends a push.

#### FIELD-005 — Native iOS and Android apps

*Tier:* Core · *Register:* R-3, R-4

**Requirement.** Glove ships technician apps in the App Store and Google Play, signed in to the owner's installation, with the offline cache of `FIELD-001`, background photo upload, push, location under `DISP-005, DISP-012` and Tap to Pay under `PAY-003`. The [operating rules](docs/service-work-rules.md#field-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A device-farm journey on a current iPhone and Android phone completes a visit offline, reconnects and takes a Tap to Pay test payment (Stripe test mode).

#### FIELD-006 — Equipment nameplate capture

*Tier:* Core · *From:* FIELD-006 · *Cites:* BASE-DATA-001, BASE-SECRET-001

**Requirement.** Equipment nameplate capture supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture submits three fixture nameplate photos (model provider fake), checks the proposed fields and, under the held company policy, checks nothing is saved until the technician confirms.
2. The model provider is the owner's own: an OpenAI-compatible chat-completions address (https), one model id and the owner's key, connected by the owner only and kept like the marketing keys (never in records, exports, logs or the archive); without it nothing is read.
3. The technician reads a nameplate on a visit they are working, for a unit already at the site or one not recorded yet; only the photo goes to the provider (no customer, site or job details), asking for JSON with storage off.
4. The reading is labelled as read by the model and carries its evidence and uncertainty.
5. The company’s policy decides whether the standard-class reading fills the equipment fields or waits for the technician.
6. Under the held policy the technician who took it confirms or corrects the fields or discards the reading, keeping the proposed and corrected fields distinct.

#### FIELD-011 — Nameplate dates and manual lookup

*Tier:* Core · *From:* FIELD-006

**Requirement.** Nameplate dates and manual lookup supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anything else is left unread, as is any field the model returns empty. "Where one is available" means the manual library the desk keeps (make, model, title, https address): on confirmation the manual whose make and model match, ignoring case and surrounding spaces, is attached; Glove never invents, searches for or fetches a manual.
2. Reading needs a signal; the confirmed unit and its manual are then in the phone's offline day (`FIELD-001`).

#### FIELD-007 — Refrigerant tracking for HVAC

*Tier:* Core

**Requirement.** On HVAC visits the technician records refrigerant type and the amounts added and recovered per equipment item, with their EPA Section 608 certification number; the owner gets a per-equipment and per-period refrigerant log for their own recordkeeping. The [operating rules](docs/service-work-rules.md#field-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture records refrigerant added and recovered on two visits to one condenser and reads the equipment log and the period total.

#### FIELD-008 — The whole office on the owner's phone

*Tier:* Core · *From:* FIELD-008 · *Cites:* BASE-ROLE-001 · *Register:* R-3, R-4

**Requirement.** The whole office on the owner's phone supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture at 390 px signed in as Owner creates a job from a phoned-in request, sends a quote, books the visit, sends the invoice, records a check payment, charges a saved card on a second invoice (Stripe fake), answers a customer text and opens the dashboard, asserting no horizontal scroll on any screen; the same steps signed in as Office are refused exactly where the role table says.
2. The existing desk commands run at both widths.
3. PAY-008, PAY-027, PAY-028, PAY-029, PAY-030 inherits method collection and autopay; PAY-009 retains keyed cards, other charge subjects and custom roles; COMM-005 retains technician texting and moved-visit threading; FIELD-005 retains native delivery.

#### FIELD-012 — Phone-desk saved-card and inbox custody

*Tier:* Core · *From:* FIELD-008 · *Cites:* BASE-DATA-003, BASE-ROLE-001 · *Register:* R-3, R-4

**Requirement.** Phone-desk saved-card and inbox custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#field-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The signed-in unscoped owner records an existing Stripe test method only after Stripe verifies its attachment to the mapped customer and the owner records source, wording and authorization scope.
2. Each Owner or Office charge explicitly confirms the displayed method and amount, reserves before a single provider attempt and counts funds only after the authenticated Stripe event.
3. Unknown attempts block another charge.
4. Registration and withdrawal are audited.
5. The shared inbox retains consented incoming text only after the owner opts in, exposes bodies to native desk people only, and sends each reply only on their explicit action under current consent and quiet hours.
6. Customer erasure removes message records.

#### COST-001 — Clock-ins and job timers

*Tier:* Core · *Cites:* BASE-AUDIT-001

**Requirement.** Technicians clock in and out for the day and run travel and on-job timers per visit, with or without signal; time is attached to the job; the desk sees who is on the clock (the `REPORT-001` dashboard's on-the-clock tile) and corrects time with a reason. The [operating rules](docs/service-work-rules.md#cost-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture clocks in, starts travel and job timers on two visits with one offline stretch, clocks out, and checks the time on each job; a desk correction keeps the original; the `REPORT-001` on-the-clock tile lists exactly the technicians clocked in at each step.
2. A technician clocks in and out on the phone and, only while clocked in, runs one timer at a time, travel or on the job, on a visit currently assigned to them; starting a timer stops the running one at the same phone time, and clocking out or completing the visit stops it too.
3. Every start and stop carries the phone's clock time and goes through the phone's outbox with the identity it was given, so it works without signal and a resend lands once (`GLOVE-06`).
4. An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of its entries per kind.
5. The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local dates and times in the business timezone, with a reason; the entry keeps the phone's original times and every correction (who, when, reason, from and to), and the job's timeline records it.
6. Technicians read only their own entries.
7. The `REPORT-001` on-the-clock tile lists the technicians with a shift clocked in and not out, with the timer each is running.

#### COST-002 — Timesheets and payroll export

*Tier:* Core · *From:* COST-002

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

#### COST-006 — Approved-period payroll eligibility

*Tier:* Core · *From:* COST-002

**Requirement.** Approved-period payroll eligibility supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#cost-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Only the owner (acting for "admin") approves a week, and only once no shift in it is still open; an approval stands while the week's entries and their split are unchanged.
2. A later correction, late entry or overtime-rule change marks it "changed since approval" until the owner approves it again.
3. The payroll files are for a pay period of 1 to 6 whole workweeks, read by the owner and office like the other exports.
4. They hold only people whose every week with time in the period is approved and unchanged, and they list everyone left out with the reason.
5. A technician record marked as a 1099 subcontractor (`DISP-007, DISP-013, DISP-014`) is never in the payroll files or approvable; their agreed-amount totals are only in the 1099-NEC export.
6. The files follow what each provider publishes, checked against the provider's own help on 21 October 2026.
7. The employee ID is the payroll ID the owner keeps on each technician record.
8. None of these files has yet been uploaded to a live Gusto, ADP RUN or QuickBooks account; Glove pays no one and files nothing.

#### COST-007 — Provider payroll file shapes

*Tier:* Core · *From:* COST-002

**Requirement.** Provider payroll file shapes supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#cost-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418A) defines the layout, and the file follows it exactly: a the documented refusal version row, the column titles IID, Pay Frequency, Pay Period Start Date, Pay Period End Date, Employee ID, Earnings Code, Pay Hours, Dollars, Separate Check, Worked In Dept and Rate Code, then one row per person and earnings code with the owner's company code (up to 10 letters and digits), pay frequency, the period's start and end as MM/DD/YYYY, the hours to two decimals, Separate Check 0 (the regular check) and Rate Code BASE (the first pay rate on the employee), with the owner's earnings codes, by default REG, OTP and DBL.
2. Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is downloaded inside Gusto, and its Smart Import matches columns on upload); Glove's column names (last name, first name, Gusto employee ID, regular, overtime and double-overtime hours; the first word of the technician's name is the first name) are therefore not confirmed against a Gusto-published layout.
3. The one column Gusto's help names, workweeks, is followed: one row per person and approved workweek, holding that week's date range as the documented refusal beside that week's hours, so Gusto places overtime in the right workweek.
4. Glove keeps no SSN and writes no SSN column.
5. QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom upload takes one entry per line with the employee and a date plus units, the date format and each column's meaning chosen on upload; Glove's date-and-units file (employee display name, MM/DD/YYYY date, pay item Regular, Overtime or Double time, hours) is a file the owner maps on upload, not a confirmed Intuit layout.
6. Inheritance: `TEAM-003, TEAM-006` commissions and spiffs and `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020` technician tips add their amounts to the same payroll files (Gusto's commission and paycheck-tips columns, an ADP RUN earnings code with dollars) for the same approved weeks before either ships.

#### COST-003 — Job expenses and receipts

*Tier:* Core

**Requirement.** Technicians and the office record expenses on a job (supply-house purchases, permits, equipment rental, subcontractor bills) with a receipt photo, vendor, amount and whether it is billable; billable expenses can be added to the invoice at cost or with markup. The [operating rules](docs/service-work-rules.md#cost-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture records a supply-house receipt as billable with 20% markup and a permit fee as non-billable, and checks the invoice draft and job cost.

#### COST-004 — Estimate versus actual job costing

*Tier:* Core

**Requirement.** Every job shows its quoted price and estimated cost against actual labor (time × each person's loaded cost rate), materials at cost, expenses and subcontractors, giving actual margin and the difference from estimate; reports roll this up by job type, technician and period. The [operating rules](docs/service-work-rules.md#cost-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture runs a job quoted at $1,850 with estimated 41% margin through recorded time, materials and an expense, and checks actual cost and a 46% margin to the cent.
2. Revenue is the latest person-approved invoice revision's subtotal before tax, else the accepted quote's subtotal.
3. The estimated cost is each accepted line's unit cost (kept when the line was priced from the price book, `MONEY-003, MONEY-006`) × its quantity; a line without one counts at $0.00 and is named.
4. Actual labor is every travel and on-job entry (`COST-001`) at its whole minutes × that technician's loaded cost per hour ÷ 60; materials are the price-book materials recorded on the job at the item's unit cost now, beyond what the job's own purchase orders received (`STOCK-002`), whose received lines count at the order's unit cost; expenses and subcontractors are `COST-003`'s amounts, subcontractor bills apart.
5. Each product is rounded half up to the cent; a margin is (revenue − cost) ÷ revenue as a percentage to one decimal, rounded half up, and the difference from estimate is in dollars and margin points.
6. The owner sets each technician's loaded cost per hour; like every cost it is a margin figure, read only by roles that read reports (`MONEY-003, MONEY-006`).
7. Reports take the jobs completed in a period (by local completion date, bounds inclusive) and roll them up by job type (the category of the job's first price-book line, else Uncategorized) and by technician (their minutes, labor cost and the jobs they recorded time on).

#### COST-005 — Live margin warnings

*Tier:* Core · *Cites:* BASE-AUDIT-001

**Requirement.** When actual cost on an open job crosses an owner-set threshold of its estimate, or projected margin falls below a floor, Glove warns the dispatcher and the owner while the job is still open. The [operating rules](docs/service-work-rules.md#cost-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture records time past the threshold and checks one warning to each of the two people, and no repeat for the same crossing.
2. The owner sets, on the business, a cost threshold (warn when actual cost reaches this percentage of the estimate) and a margin floor (warn when projected margin falls below this percentage); either can be blank, meaning off.
3. After every command, each open job is checked with `COST-004`'s figures; its projected cost is the larger of actual and estimated cost, and a job with no estimated cost never crosses the threshold.
4. A crossing is one warning shown in Glove to the owner and to every dispatcher, on their desk screens and on the job's timeline; nothing is sent (no email or text).
5. A warning is kept once per job, kind and setting, so the same crossing never repeats; changing a setting can warn again.
6. Like every cost, warnings are read only by the owner and dispatchers they are addressed to, and their timeline entries only by roles that read reports.

### Invoicing and payments

#### PAY-001 — USD invoices sent from Glove

*Tier:* Core · *From:* PAY-001 · *Cites:* BASE-AUDIT-001, BASE-ROLE-001

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

#### PAY-010 — Customer statements

*Tier:* Core · *From:* PAY-001 · *Cites:* BASE-DATA-003, BASE-ROLE-001, BASE-SECRET-001

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

#### PAY-011 — Statement monthly-date inheritance

*Tier:* Core · *From:* PAY-001

**Requirement.** Statement monthly-date inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The customer statement uses the fixed-monthly period-end issue date, separate approval time and later-of-period/approval due-date basis, without moving preexisting dates.

#### PAY-012 — Internal uninvoiced-work reminder

*Tier:* Core · *From:* PAY-001 · *Cites:* BASE-AUDIT-001, BASE-DATA-003

**Requirement.** Internal uninvoiced-work reminder supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A scheduled internal Activity reminder records completed work still awaiting invoice preparation or approval once per job and branch-local date, on the first pass at or after 08:00; approval and erasure are rechecked atomically.
2. This reminder sends no customer or office email.

#### PAY-013 — Progress invoice stages

*Tier:* Core · *From:* PAY-001 · *Cites:* BASE-ROLE-001

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

#### PAY-014 — Progress-invoice changed-scope reconciliation

*Tier:* Core · *From:* PAY-001 · *Cites:* BASE-ROLE-001

**Requirement.** Progress-invoice changed-scope reconciliation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Changed progress-invoice scope is reconciled explicitly before further stages; no automatic allocation silently reprices the accepted work.

#### PAY-015 — Field invoice draft permission

*Tier:* Core · *From:* PAY-001 · *Cites:* BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Field invoice draft permission supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. *Field invoice custody (RL-105):* a signed-in Owner without branch limits explicitly allows or withdraws invoice preparation and approved invoice presentation for one active technician linked to their current sign-in.
2. This separate permission is off by default and grants no field price-book authority, approval, sending, payment, custom-role or integration-token authority.
3. A technician requests a draft only for their currently assigned, uncancelled visit on a completed job.
4. The phone's existing ordered outbox keeps the visit, capture time, actor and command identity through offline reload and a lost response; reconnection prepares one office-review draft without an external message.
5. Current authority and assignment are rechecked on execution and replay.
6. An unapproved draft reveals no prices to the technician.
7. This field permission permits preparation and presentation of the exact approved customer-facing revision, with FIELD-001’s common retention and reconnect fences; it supplies no approval, sending or collection authority.

#### PAY-016 — Offline approved-invoice presentation

*Tier:* Core · *From:* PAY-001 · *Cites:* BASE-DATA-001, BASE-DATA-003, BASE-ROLE-001

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

#### PAY-002 — Card, ACH and wallet payments through Stripe

*Tier:* Core · *From:* PAY-002 · *Cites:* BASE-AUDIT-001, BASE-OPS-003 · *Register:* R-11

**Requirement.** Card, ACH and wallet payments through Stripe supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture pays one invoice by card and one by ACH (Stripe fake with webhooks), checks the card payment is paid at once, the ACH payment pending until the settlement event, and a failed ACH return reopens the balance; a card payment with a $15.00 tip records the tip for the visit's technician, untaxed, and the tip appears in the payroll export; the `REPORT-001` "Paid today" tile counts the card payment at once and the ACH payment only after its settlement event; the `REPORT-002, REPORT-004` sales-tax report counts the tax on the two paid invoices as collected.
2. COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018: assert each emailed receipt goes through the owner's provider (fake) with its provider outcome on the message, payment's timeline, Activity and export without secrets, and that any email not strictly transactional carries the CAN-SPAM unsubscribe link and postal address.
3. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
4. REPORT-003 inheritance: confirmed payments update the aging report's open balances before this capability ships; assert the exact bucket/customer totals and invoice links in its flow.
5. COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 inheritance: every receipt it emails goes through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`'s door with the same provider outcomes: one send attempt per message, recorded with the provider's answer and reference on the message, the payment's timeline, Activity and the business export without secrets; state changes only from authenticated provider callbacks; delivery is never claimed without the provider's event.
6. Any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address.
7. RL-106 replaces owner-only consumption with the customer-scoped payment door; the existing owner-only test slice does not complete that target.

#### PAY-017 — Hosted test-payment reservation

*Tier:* Core · *From:* PAY-002 · *Cites:* BASE-DATA-001, BASE-OPS-003, BASE-SECRET-001 · *Register:* R-11

**Requirement.** Hosted test-payment reservation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The signed-in unscoped owner connects Stripe test mode with payment connect action, which requires Stripe’s balance API to confirm the key is not live; payment checkout action reserves an approved USD invoice payment before one fixed-endpoint Stripe Checkout attempt.
2. Card-hosted entry and ACH never pass account or card numbers to Glove.
3. A returned hosted URL is bearer material, shown only in the first response, excluded from records, saved outcomes and archives; a replay recovers the reservation without another attempt.
4. The public the documented product door acknowledgement never treats a redirect or its query parameters as payment confirmation.
5. Restored installations must reconnect their excluded private keys before another reservation is allowed.
6. Checkout facts expose only an irreversible reference hash; the provider session reference stays in the private archive-excluded attempt store.
7. Unresolved requests block a second request for that invoice.

#### PAY-018 — Provider settlement and payment custody

*Tier:* Core · *From:* PAY-002 · *Cites:* BASE-AUDIT-001, BASE-OPS-003 · *Register:* R-11

**Requirement.** Provider settlement and payment custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Payment receipt action is an explicit Owner/Office transactional email to the on-record accounts-payable or customer address through COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018.
2. Webhooks verify the raw-body Stripe signature and five-minute freshness before parsing; current intent retrieval verifies the connection, currency, gross amount, payment identity and test mode.
3. Confirmed effects reduce aging and feed paid-today and collected-tax totals, with tips apart; a failed charge or ACH return reverses them.
4. Each tip splits equally in exact cents among the completed visits’ distinct technicians (ID order receives remainder cents), and joins approved payroll weeks only.
5. Test mode is named in payment facts, receipts, aging and collected-tax basis; these are not live funds.
6. Provider outcomes and receipts read on the payment timeline, Activity, conversation stream and business export.
7. Property history includes each payment and its current provider state.
8. Duplicate-customer merge and undo carry payment ownership with the invoice.

#### PAY-019 — Payment ownership and erasure

*Tier:* Core · *From:* PAY-002 · *Cites:* BASE-DATA-003, BASE-OPS-003 · *Register:* R-11

**Requirement.** Payment ownership and erasure supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. After erasure, anonymous financial effects remain and provider/session references are removed.

#### PAY-020 — Tip preferences and receipt recovery

*Tier:* Core · *From:* PAY-002 · *Cites:* BASE-OPS-003 · *Register:* R-11

**Requirement.** Tip preferences and receipt recovery supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner sets 1–20 distinct fixed-dollar tip choices, including zero, with payment preferences action; new connections default to zero only.
2. Preference edits affect future requests and keep existing reservations unchanged.
3. A rejected receipt leaves the payment confirmed; replay never sends again, and the office can explicitly send a new receipt after correction.

#### PAY-003 — Tap to Pay and card readers on site

*Tier:* Core · *Cites:* BASE-AUDIT-001 · *Register:* R-11

**Requirement.** Technicians take card-present payments on the phone (Tap to Pay on iPhone and Android through Stripe Terminal) or a paired Stripe reader, with the tip choices of `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020`, the receipt texted or emailed and the payment on the job before they leave. The [operating rules](docs/service-work-rules.md#pay-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The `FIELD-005` device journey takes a Tap to Pay test payment on a $412.00 invoice with an 18% tip chosen on the phone's tip screen and the receipt sent by text, then a second test payment with no tip and the receipt by email.
2. It finds both payments on the job, the $74.16 tip recorded for the visit's technician outside revenue and sales tax, and each receipt on the timeline with the channel the customer chose and the provider's delivery outcome.

#### PAY-004 — Partial payments, balances, refunds and credits

*Tier:* Core · *From:* PAY-004 · *Cites:* BASE-AUDIT-001

**Requirement.** Partial payments, balances, refunds and credits supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture pays an invoice in three parts (one by check), refunds $50 to the card (Stripe fake), and checks the invoice, customer balance and refund record, and that the `REPORT-001` receivables tile equals the open balances after each step.
2. COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018: assert each emailed receipt goes through the owner's provider (fake) with its provider outcome on the message, payment's timeline, Activity and export without secrets, and that any email not strictly transactional carries the CAN-SPAM unsubscribe link and postal address.
3. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
4. AGENT-008, AGENT-016 inheritance: the morning brief lists overdue invoices (due date passed, balance unpaid) with their invoice link and a proposed action, asserted in the AGENT-008, AGENT-016 flow.
5. REPORT-003 inheritance: allocations, credits, overpayments and refunds update the aging report's open balances before this capability ships; assert the exact bucket/customer totals and invoice links in its flow.
6. COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 inheritance: every receipt it emails goes through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`'s door with the same provider outcomes: one send attempt per message, recorded with the provider's answer and reference on the message, the payment's timeline, Activity and the business export without secrets; state changes only from authenticated provider callbacks; delivery is never claimed without the provider's event.
7. Any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address.

#### PAY-021 — Receipt and customer-credit allocation

*Tier:* Core · *From:* PAY-004

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

#### PAY-022 — Receipt and downstream payment inheritance

*Tier:* Core · *From:* PAY-004

**Requirement.** Receipt and downstream payment inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. QUOTE-003, QUOTE-014 inherits job-held deposits and final-invoice allocation; PAY-009 inherits keyed/saved-method entry without bypassing these allocation/refund rules.

#### PAY-023 — Original-method refunds

*Tier:* Core · *From:* PAY-004 · *Cites:* BASE-SECRET-001

**Requirement.** Original-method refunds supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Only the signed-in owner refunds (payment refund action), at most the original confirmed amount less earlier confirmed or unresolved refunds, using the original method.
2. Refund amount is invoice principal and optional tip is separately bounded by the remaining original tip; a tip-only refund changes tips/payroll, never invoice balance or tax.
3. A subsequent return reverses only the remaining principal/tip, not a second copy of a prior refund.
4. Cash/check refunds record money already returned; Stripe refunds reserve durably before one provider attempt with an idempotency key.
5. Each refund has its own payment-linked record; pending/unknown refunds have no balance effect and are never automatically resent.
6. A pending provider reference can be read again (payment refund refresh action); only provider-confirmed success reopens a balance.

#### PAY-005 — Payment reminders that stop at zero

*Tier:* Core · *Cites:* BASE-MAIL-001, BASE-ROLE-001 · *Rules:* D-1 · *Register:* R-9

**Requirement.** The owner sets a reminder schedule (before due, on due, after due); Glove sends it by text and email with the pay link, stops the moment the balance is zero or the invoice is disputed, and shows each invoice's reminder state. Customer-payment links follow PAY-002, PAY-017, PAY-018, PAY-019, PAY-020’s customer-scoped authority under RL-106. The [operating rules](docs/service-work-rules.md#pay-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture advances a clock through the schedule for two invoices, pays one after the first reminder, and checks it received nothing more.
2. REPORT-003 inheritance: each invoice in the aging report displays its actual reminder state asserted in the reminder flow.

#### PAY-006 — Consumer financing through Wisetack

*Tier:* Core · *From:* PAY-006 · *Cites:* BASE-DATA-001, BASE-SECRET-001 · *Register:* R-12

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

#### PAY-024 — Financing funding and custody

*Tier:* Core · *From:* PAY-006 · *Cites:* BASE-AUDIT-001 · *Register:* R-12

**Requirement.** Financing funding and custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Funding is allocated only when the full provider-reported amount matches the winning signed chosen-document hash and exact job; it is held on that job until its invoice is prepared.
2. Duplicate reads create no duplicate payment.
3. Wisetack's fee stays separate; original-method refunds use PAY-004, PAY-021, PAY-022, PAY-023's reservation and separate linked refund record.
4. Activity, property history and export keep only whitelisted outcomes and references; DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erases the application and retains anonymous financial totals.
5. Glove never underwrites or lends.
6. COMM-006, COMM-022, COMM-023, COMM-024, COMM-025 inherits the same isolation, explicit consent, minimal data and provider-outcome rules before financing appears in the hub.
7. Production activation remains disabled; a live merchant account is needed only to activate a future live connection.

#### PAY-007 — Payouts and reconciliation

*Tier:* Core · *From:* PAY-007 · *Cites:* BASE-AUDIT-001

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

#### PAY-025 — Cash and check deposit batches

*Tier:* Core · *From:* PAY-007 · *Cites:* BASE-DATA-003

**Requirement.** Cash and check deposit batches supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Cash/check deposits (payment deposit batch action) group 1–100 confirmed same-currency/branch records once, net of prior recorded refunds, as staff-recorded deposits without a bank-confirmation claim.
2. Only the owner reads provider-wide payout and fee records; the office sees its branch's cash/check batches.
3. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 removes erased customer references from shared payout source detail while retaining anonymous aggregate bank history.

#### PAY-026 — Instant payout preview and execution

*Tier:* Core · *From:* PAY-007 · *Cites:* BASE-SECRET-001

**Requirement.** Instant payout preview and execution supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. For Instant Payouts, the owner records their account-specific fee schedule (basis points and minimum, labelled owner-recorded and not verified by Glove); a preview checks an existing Stripe debit card's instant eligibility and funds, computes the half-up fee, and requires selected source net to equal the proposed bank amount plus that fee.
2. The owner explicitly confirms both displayed amounts within ten minutes; source availability, current connection, schedule, eligibility and funds are checked again.
3. A durable reservation and Stripe idempotency key precede one request.
4. Replay never resends an unknown outcome.
5. Sources cannot be allocated to another payout.
6. Reconciliation checks the actual payout debit, source allocation and actual fee against the confirmed preview; a difference stays unmatched.

#### PAY-008 — Saved payment methods and autopay with consent

*Tier:* Core · *From:* PAY-008 · *Register:* R-11

**Requirement.** Saved payment methods and autopay with consent supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-008-operating-rules) retain the record formats and calculations. Recorded decisions: RL-15.

**Acceptance.**
1. A fixture saves a card with consent, charges an agreement renewal, fails the next charge (Stripe fake) and checks the update-link message and the retained authorization record.
2. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.
3. When the customer chose autopay, the invoice is charged to the saved method under `PAY-008, PAY-027, PAY-028, PAY-029, PAY-030`, with the receipt sent, and a failed charge follows `PLAN-003`'s dunning. a flow test runs two series for three months (Stripe fake): a per-visit series with one visit in month 1, two in month 2 (a third skipped) and none in month 3, and a quarterly commercial PM job billed $240.00 fixed monthly on autopay; it checks exactly three per-visit invoices with each visit's lines, exactly three $240.00 invoices dated the last day of each month, each charged once, with one failed charge entering dunning and recovered; an on-close series invoices once when the job closes.
4. This policy establishes no payment-network or legal compliance.

#### PAY-027 — Saved-card permission versions

*Tier:* Core · *From:* PAY-008 · *Cites:* BASE-DATA-003, BASE-ROLE-001 · *Register:* R-11

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

#### PAY-028 — Exact-invoice saved-card execution

*Tier:* Core · *From:* PAY-008 · *Cites:* BASE-DATA-001, BASE-ROLE-001 · *Register:* R-11

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

#### PAY-029 — Saved-card refusal has no financial effect

*Tier:* Core · *From:* PAY-008 · *Register:* R-11

**Requirement.** Saved-card refusal has no financial effect supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A refused request makes no payment-provider request and changes no invoice balance.

#### PAY-030 — Saved-card outcome and restore custody

*Tier:* Core · *From:* PAY-008 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-ROLE-001 · *Register:* R-11

**Requirement.** Saved-card outcome and restore custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#pay-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Record permission versions, withdrawal, explicit execution and provider outcomes with actor, time, permitted references and actual effect in Activity and business export.
2. Customer erasure covers personal consent evidence, saved-method associations, personal command results and timeline copies under DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 while preserving required anonymous financial totals.
3. Restore retains permitted business history but imports no provider credentials, creates no payment authority and resumes no charge.
4. Reconnection alone does not replace current permission or explicit invoice confirmation.
5. The trusted later erasure journal prevents an older backup from reviving erased evidence; an offline destination cannot discover a later erasure without that journal.

#### PAY-009 — Office charges a card by phone or on file

*Tier:* Core · *Cites:* BASE-AUDIT-001, BASE-ROLE-001, BASE-SECRET-001 · *Register:* R-11

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

#### LEDGER-001 — QuickBooks Online sync

*Tier:* Core · *From:* LEDGER-001 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-004, BASE-SECRET-001 · *Register:* R-13

**Requirement.** QuickBooks Online sync supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture syncs a customer, invoice, payment and refund (QuickBooks fake), replays the same sync without duplicates, receives a rejected item with its message, fixes and retries it, and reads a payment entered in QuickBooks back onto the invoice.
2. A property manager with two properties mapped as sub-customers posts each property's invoice to its own sub-customer under the parent, and one payment covering both is applied to both invoices.
3. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
4. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.
5. Only a signed-in unscoped Owner explicitly connects a QuickBooks sandbox company, verifies existing record IDs, confirms the pre-existing links, posts one record or reads one provider payment.
6. The access token is an installation secret, excluded from browser command storage, domain state, Activity, business exports and archives.
7. Same-company token replacement retains link identities; another company requires fresh links and confirmation.

#### LEDGER-005 — Verified QuickBooks tax and property links

*Tier:* Core · *From:* LEDGER-001 · *Cites:* BASE-DATA-004, BASE-SECRET-001 · *Register:* R-13

**Requirement.** Verified QuickBooks tax and property links supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Each mapped sales item retains its existing income account; optional class and department references and the transaction tax code are verified against that company.
2. Parent-billed properties must be actual sub-customers of their mapped parent.
3. An existing invoice number refuses creation until the owner links the matching customer, number and total.

#### LEDGER-006 — QuickBooks posting and readback recovery

*Tier:* Core · *From:* LEDGER-001 · *Cites:* BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · *Register:* R-13

**Requirement.** QuickBooks posting and readback recovery supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A durable reservation precedes each provider write; replay retains the provider identity, a definite rejection permits explicit retry after repair, and an uncertain or interrupted operation blocks another send.
2. The owner may reconcile an uncertain result only to an existing record whose returned fields match the exact reserved content; this performs no new post.
3. The provider-confirmed tax and total must equal the frozen approved cents; a mismatch retains its reference for reconciliation.
4. Readback applies only exact, fully allocated USD payments to their mapped invoices and never counts Glove-origin payments twice.
5. Each allocation retains its invoice tax snapshot.
6. Provider effects already authorized in flight remain recorded if the initiating person loses authority; this grants no later send authority.
7. Full-invoice refunds preserve the approved tax and discount snapshot.
8. There is no automatic sync or retry, production connection, new customer payment authority or live-provider proof.

#### LEDGER-007 — QuickBooks production and automation boundary

*Tier:* Core · *From:* LEDGER-001 · *Cites:* BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · *Register:* R-13

**Requirement.** QuickBooks production and automation boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. QuickBooks synchronization includes the complete target for production connection, automatic execution and recovery; preparatory owner commands grant no new customer payment authority.

#### LEDGER-002 — Xero sync

*Tier:* Core · *From:* LEDGER-002 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-004, BASE-SECRET-001 · *Register:* R-14

**Requirement.** Xero sync supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations. Recorded decisions: RL-16, RL-17, RL-18.

**Acceptance.**
1. The complete QuickBooks synchronization journey is repeated against the Xero provider edge with the Xero property representation.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.
3. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.
4. Xero inspection is off by default.
5. Only a signed-in Owner without branch limits explicitly connects and reads the fixed Xero Accounting API.
6. Custom roles and integration tokens are refused.
7. The tenant identifier and OAuth access token remain installation secrets, outside domain state, Activity, business export and archives.

#### LEDGER-008 — QuickBooks-style hierarchy is not assumed in Xero

*Tier:* Core · *From:* LEDGER-002 · *Cites:* BASE-DATA-004, BASE-SECRET-001 · *Register:* R-14

**Requirement.** QuickBooks-style hierarchy is not assumed in Xero supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The connection is verified with a read; replacement for the same tenant retains its local connection identity.
2. Xero has no QuickBooks-style sub-customer; this preparatory slice makes no property allocation claim.

#### LEDGER-009 — Xero inspection custody

*Tier:* Core · *From:* LEDGER-002 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · *Register:* R-14

**Requirement.** Xero inspection custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Inspection returns only whitelisted contact, item and sales-invoice summaries in the immediate response, not saved command outcomes or Activity bodies.
2. Provider errors refuse inspection, redirects are refused, and potentially incomplete lists refuse rather than claiming company-wide discovery.
3. Disconnect removes credentials; restored domain history grants no read or write access.
4. Inspection itself grants no posting, automatic execution, mapping confirmation or customer payment authority.
5. Provider identifiers are Owner-only on current reads, command outcomes and error records.
6. Credentials remain installation-private; customer erasure removes customer links and personal outcomes.
7. See [XERO.md](XERO.md) for the supported commands and retrieval limits.

#### LEDGER-010 — Xero property and parent allocation

*Tier:* Core · *From:* LEDGER-002 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · *Register:* R-14

**Requirement.** Xero property and parent allocation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. CT approved preparatory default: Owner-only read inspection; the future connector must review an explicit parent-contact and property representation before any post, preserving all inherited allocation obligations.
2. CT scope ruling, 26 October 2026: Owner-only Xero inspection is approved as a preparatory default, with no posting, mapping confirmation, payment allocation or money-movement authority.
3. The complete inherited LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007 target and Xero-fake acceptance remain binding, including existing-record review, two property invoices, the parent roll-up and one parent remittance allocated to both invoices.
4. The product representation uses one reviewed Xero billing contact and distinct Glove properties, with each property invoice linked to its property and that contact.
5. A documented supported invoice reference or tracking dimension identifies the property without discarding the purchase-order reference; no QuickBooks-style contact hierarchy is assumed.
6. One parent remittance retains explicit invoice allocations; the proposed transport uses invoice-linked Xero payment applications grouped locally under that remittance, with provider identities and exact allocated cents, subject to official capability verification.
7. Readback must preserve each property’s balance and frozen tax and discount amounts without duplicate cash or payment echoes.
8. Existing branch, role, reviewed-link, approval, replay, uncertainty, audit, export, archive and erasure obligations continue to apply.

#### LEDGER-011 — Xero provider capability proof boundary

*Tier:* Core · *From:* LEDGER-002 · *Cites:* BASE-DATA-004, BASE-SECRET-001 · *Register:* R-14

**Requirement.** Xero provider capability proof boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Xero discovery, existing-record review, customer and item synchronization, frozen invoice transport, payment/refund readback, uncertainty recovery and property allocations are proved against the official provider capability.

#### LEDGER-012 — Xero reviewed mappings

*Tier:* Core · *From:* LEDGER-002 · *Cites:* BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · *Register:* R-14

**Requirement.** Xero reviewed mappings supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A separate explicit Owner command now verifies and records existing billing-contact and sales-item links, and a fresh fingerprint-bound command records their local review.
2. Neither command authorizes a provider write, first post or customer payment.
3. Default inspection and fingerprint-bound local link review retain their read-only authority; neither grants accounting or payment authority.

#### LEDGER-013 — Xero company action policy

*Tier:* Core · *From:* LEDGER-002 · *Cites:* BASE-AUDIT-001, BASE-DATA-004, BASE-ROLE-001, BASE-SECRET-001 · *Register:* R-14

**Requirement.** Xero company action policy supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Each Xero accounting action computes its fleet risk classes from the actual business effect: money for monetary effects, commitment for binding decisions and external for provider disclosure.
2. The company policy decides the call; an unanswered policy permits no accounting effect.
3. A policy decision does not widen the action’s separate current authority, and its class, action and decision remain in Activity.

#### LEDGER-014 — Xero policy proof matrix

*Tier:* Core · *From:* LEDGER-002 · *Cites:* BASE-DATA-004, BASE-SECRET-001 · *Register:* R-14

**Requirement.** Xero policy proof matrix supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#ledger-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The provider-fake accounting journey runs the company’s selected policy and records its decision; that fixture does not claim live-provider acceptance.

#### LEDGER-003 — Pantry sync

*Tier:* Core · *Cites:* BASE-AUDIT-001, BASE-SECRET-001

**Requirement.** For an owner who keeps their books in Pantry, Run Edit Run's accounting product, Glove posts the same records through Pantry's API with the same error and retry behavior. DATA-002, DATA-009, DATA-010 inheritance: every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. The [operating rules](docs/service-work-rules.md#ledger-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The complete accounting synchronization journey runs against Pantry’s documented provider edge.
2. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.

#### LEDGER-004 — First QuickBooks connection linked to existing records

*Tier:* Core · *Cites:* BASE-AUDIT-001, BASE-SECRET-001 · *Register:* R-13

**Requirement.**Proposed links.** Glove reads the company's customers (with sub-customers), items and open and recent invoices, and proposes a link for each Glove customer, price-book item and moved-in invoice. Customers match first by the QuickBooks customer ID the move-in carried where the source kept one (`MOVE-005`), then by display name together with email or phone. Items match by SKU, then by name. Moved-in invoices match by the carried QuickBooks ID, then by invoice number with the same customer and total. - **Owner review.** The review lists four groups: matched (with the rule that matched), ambiguous (two or more candidates; the owner picks one or none), Glove records with no match (the owner approves creating each in QuickBooks or links it by hand), and QuickBooks records with no Glove counterpart (left alone, or brought into Glove through the `CUST-003` review). A QuickBooks name clash ("another customer already uses this name") appears in the review before anything posts, never as a sync error afterwards. - **Only confirmed writes.** Confirming writes only the confirmed links and the new records the owner approved. A linked moved-in invoice is never posted again; later payments and refunds on it post against the QuickBooks invoice it links to. Each link records who confirmed it and can be changed until the first post that uses it. Reconnecting the same company keeps the links; connecting a different company starts a new review. DATA-002, DATA-009, DATA-010 inheritance: every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. MONEY-001, MONEY-004, MONEY-005 inheritance: post the frozen USD jurisdiction/tax snapshot with explicit existing-record mappings and assert the provider receives it to the cent; the current downloadable payload is inspection only, never a sync. QUOTE-007, QUOTE-019 inheritance: post each QUOTE-007, QUOTE-019 discount as the provider's discount line (tax after discount) with its non-taxable and taxable amounts and assert the provider fake receives the accepted figures to the cent. The [operating rules](docs/service-work-rules.md#ledger-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture moves in a Jobber fixture (`MOVE-001, MOVE-007`) with 50 customers, 20 price-book items and their open invoices, then connects a QuickBooks fake that already holds 48 of those customers (10 matched by the carried QuickBooks ID, 37 by name with email or phone, and one name with two QuickBooks candidates), all 20 items and the open invoices.
2. The review lists exactly 47 matched customers, one ambiguous pair, two Glove customers with no match and 20 matched items, and the fake receives no write before confirmation.
3. After the owner picks the ambiguous match and approves creating the two unmatched customers, the fake holds no duplicate customer or item, the two new customers exist once each, the moved-in invoices are linked and not re-created, a payment on one of them posts against its existing QuickBooks invoice, and the next new Glove invoice posts against the linked customer.
4. The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the business export, including provider outcomes and references without secrets.

### Recurring service and maintenance agreements

#### PLAN-001 — Recurring jobs

*Tier:* Core · *From:* PLAN-001 · *Cites:* BASE-AUDIT-001

**Requirement.** Before the first QuickBooks post, the owner reviews discovered customers, items, open invoices and parent/property relationships against the moved-in business, resolves ambiguity and confirms reuse or creation without duplication. The [operating rules](docs/service-work-rules.md#ledger-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture creates a quarterly series, skips one visit, moves another, changes the rule from a date, and checks every generated visit.
2. The dispatcher or owner makes an open job repeat (series create action) from a first local date, at a visit start and end time with one technician, on a rule: every 1–52 weeks (on the first date's weekday), or every 1–52 months, or every year in named months, on a day of the month (the first date's unless given; a day the month lacks becomes its last day) or on the first to fourth or last given weekday of the month; intervals count from the rule's first date.
3. Dates are local dates in the business time zone.
4. The series may end on a date (inclusive).
5. Visits are booked for every occurrence through the earlier of that end and today plus the series' rolling horizon (7–730 days, 365 by default): at create and change, conflicts are reviewed under `GLOVE-05` as for one booking; after every later command the horizon rolls forward and the newly booked visits carry their conflicts unreviewed, named on the job timeline for review on Dispatch, and an occurrence that cannot be booked (for example an inactive technician) is recorded once on the series and named on the timeline.

#### PLAN-006 — Recurring occurrence changes

*Tier:* Core · *From:* PLAN-001

**Requirement.** Recurring occurrence changes supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Each visit is an ordinary visit carrying its rule revision and occurrence date: moving it (visit change action) or skipping it (visit cancel action, labelled skipped) leaves the series unchanged, and an occurrence that has a visit is never booked again.
2. Changing the series from a date (series change action, with a reason, not before its first date) starts a new rule revision there: visits on or after that date that are still booked and untouched (no arrival, never moved) are canceled with that reason and booked again under the new revision; earlier visits and moved, skipped, started or completed ones stay as they are.
3. Completing one visit leaves a recurring job open; a visit completes the job only once the series has an end date, has booked through it and no other visit of the job is booked.
4. The series' invoicing rule comes with `PLAN-005, PLAN-012, PLAN-013`, which carries it in its text and acceptance; until then a recurring job is invoiced as one job under `GLOVE-09`.

#### PLAN-002 — Maintenance agreements and memberships

*Tier:* Core

**Requirement.** A maintenance plan defines term, price, included visits, inspection forms, repair discounts and renewal conditions. Selling it creates a customer/property agreement whose remaining entitlements, due work, history, reporting and segment membership reconcile with completed or explicitly declined visits. The [operating rules](docs/service-work-rules.md#plan-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture sells a plan with two included tune-ups and 15% repair discount, books and completes one tune-up, quotes a repair, and checks the entitlement count and the discount, that the completed tune-up's job carried the plan's inspection form, and that the `REPORT-001` agreements-due tile counts the agreement while its second tune-up is due, and that the `REPORT-002, REPORT-004` agreement report counts the sold agreement and no churn, and that a `CUST-004, CUST-006` "no agreement" segment excludes the customer.
2. QUOTE-007, QUOTE-019 inheritance: the member repair discount is a QUOTE-007, QUOTE-019 document discount or discount line, allocated non-taxable first and taxed after discount, carried quote → job → invoice, and asserted on the CSV, the QuickBooks payload and reports.

#### PLAN-003 — Recurring billing and renewals

*Tier:* Core

**Requirement.** Agreements bill monthly or yearly through saved payment methods (`PAY-008, PAY-027, PAY-028, PAY-029, PAY-030`); renewal notices go out ahead of the term end with the terms state auto-renewal laws require the owner to show; customers can cancel or update their card in the hub; a failed charge follows the dunning schedule and the agreement shows its state. The [operating rules](docs/service-work-rules.md#plan-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture runs a monthly agreement through three charges, one failed and recovered, then a renewal notice and an auto-renewal, and a cancellation from the hub.
2. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.
3. When the customer chose autopay, the invoice is charged to the saved method under `PAY-008, PAY-027, PAY-028, PAY-029, PAY-030`, with the receipt sent, and a failed charge follows `PLAN-003`'s dunning. a flow test runs two series for three months (Stripe fake): a per-visit series with one visit in month 1, two in month 2 (a third skipped) and none in month 3, and a quarterly commercial PM job billed $240.00 fixed monthly on autopay; it checks exactly three per-visit invoices with each visit's lines, exactly three $240.00 invoices dated the last day of each month, each charged once, with one failed charge entering dunning and recovered; an on-close series invoices once when the job closes.

#### PLAN-004 — Due-visit scheduling until done or declined

*Tier:* Core · *From:* PLAN-004

**Requirement.** Due-visit scheduling until done or declined supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations. Recorded decisions: RL-19.

**Acceptance.**
1. A fixture generates 40 due visits, batch-books 30 by area, sends links for 8, records 2 declines, and checks the due list shows exactly the remainder, and the `REPORT-001` agreements-due tile the same number of due visits.
2. AGENT-008, AGENT-016 inheritance: the morning brief lists agreements with visits due, with their agreement link and a proposed action, asserted in the AGENT-008, AGENT-016 flow.
3. The due-visit list lists each included visit separately, identified by agreement and zero-based ordinal, with its PLAN-002 due date, customer, site, ZIP, linked job and booking state.
4. Through defaults to the business's local today; optional from and through bounds include both ends; area matches the site's exact ZIP.
5. Completion removes only that entitlement, even if visits finish out of order.
6. Booking, cancellation, term expiry and ending an agreement do not silently remove outstanding work.
7. New included jobs keep agreementVisitIndex; older jobs take the first unclaimed ordinal in stored order.
8. An existing job is retained when its booking is cancelled, so the desk can rebook it.

#### PLAN-007 — Due work in the owner brief

*Tier:* Core · *From:* PLAN-004

**Requirement.** Due work in the owner brief supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Today counts outstanding due visits, including those booked, and the owner morning brief links each one to its customer's agreement and Dispatch.

#### PLAN-008 — Due-visit desk booking

*Tier:* Core · *From:* PLAN-004 · *Cites:* BASE-ROLE-001

**Requirement.** Due-visit desk booking supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Dispatch offers consecutive-slot batches through the existing job create action and visit book action doors, with their current authority and conflicts: each success and refusal is shown, and a refused or interrupted booking remains due.
2. The Office may now book only jobs linked to an agreement under the approved booking semantics below.
3. Customer links and the Office booking authority follow the approved semantics below.
4. The Office may visit book action only a job with an agreementId linking that job's customer and site, with the normal exact-conflict review, and may neither visit change action nor visit cancel action; the dispatcher keeps every other booking.
5. Direct HTTP calls enforce these restrictions; Office workflow rules retain API-005’s existing prohibition on automatic booking.

#### PLAN-009 — Customer explicit entitlement decline

*Tier:* Core · *From:* PLAN-004 · *Cites:* BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** Customer explicit entitlement decline supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A decline is the customer's own explicit answer, recorded by a person as `GLOVE-04` records a quote's answer: the desk (owner, dispatcher, office) records it for one included visit of an agreement (agreement decline action: agreement version, zero-based ordinal, who declined, how — phone, email reply, text reply or in person — and their reason).
2. Glove never infers a decline from silence, a cancelled booking, term expiry or agreement end action.
3. It is refused for a completed or already declined visit, and while that visit has a live booking (cancel the booking first, under `GLOVE-07`).
4. The decline keeps the visit's due date, the recorder's name and role and the time, is appended to the agreement (never edited), is named on the Activity timeline (agreement visit declined action) and travels in the export.
5. A declined visit leaves the due list, the `REPORT-001` agreements-due tile and the `AGENT-008, AGENT-016` brief; it is no longer "left" under `PLAN-002`, and no included job can be made for it.
6. The decline joins the site's property history (`CUST-001`) as an agreement decline row.

#### PLAN-010 — Customer due-visit booking offers

*Tier:* Core · *From:* PLAN-004 · *Cites:* BASE-DATA-001, BASE-ROLE-001

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

#### PLAN-011 — Booking-offer communication history

*Tier:* Core · *From:* PLAN-004 · *Cites:* BASE-AUDIT-001

**Requirement.** Booking-offer communication history supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Created, used, revoked and staff-recorded outside-send events name the person and time in Activity and the business export, without the bearer.
2. Agreement offer action with email: true emails the link through `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018` to the customer's own email address on record (the link is still shown once in the response), and the offer shows its provider-reported delivery state; agreement offer sent action still records a send staff made outside Glove, labelled with the method and recorder and “delivery not verified”, with no delivery claimed.
3. The offer, its outside-send record and its use or revocation are booking link rows in the site's property history (`CUST-001`); an emailed link also appears there as a message row with its provider-reported state (`COMM-007`).

#### PLAN-005 — Invoicing rules for recurring jobs

*Tier:* Core · *From:* PLAN-005

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

#### PLAN-012 — Recurring draft approval

*Tier:* Core · *From:* PLAN-005 · *Cites:* BASE-ROLE-001

**Requirement.** Recurring draft approval supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The Worker cron and ordinary mutations generate due drafts; opening state is read-only.
2. The office can run series billing run action and reads the documented product door for dates without an invoice/reminder and the concrete missing-price/PO problem.
3. Existing series retain their old job-wide workflow until the owner explicitly configures a rule.
4. The owner may explicitly authorize automatic approval only for a rule's fixed invoices.
5. The pass rechecks the configuring owner's current active Owner role and branch scope at commit; no other person's rule or a later edited draft borrows that grant.
6. Otherwise normal GLOVE-09 approval applies.
7. Drafts say “Proposed — not approved, not sent” and count nowhere in aging, revenue, tax, exports or QuickBooks.

#### PLAN-013 — Fixed-monthly invoice dates

*Tier:* Core · *From:* PLAN-005

**Requirement.** Fixed-monthly invoice dates supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. For newly generated fixed-monthly invoices only, approval on/after period end freezes issueDate at that period end, records approvalAt and approver separately, and freezes dueDate = max(periodEnd, approvalLocalDate) + terms.
2. Late approvals are labelled; aging begins only after approval and ages from that frozen due date.
3. Revenue/tax/CSV/QuickBooks use the frozen issue date.
4. Terms changes, correction and later export do not move those dates; preexisting documents and outputs are unchanged.
5. No charge, receipt or dunning is added by this slice; PAY-008, PAY-027, PAY-028, PAY-029, PAY-030, PLAN-003 and COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 carry those remaining acceptance obligations before autopay ships.

### Stock and purchasing

#### STOCK-001 — Van and warehouse stock

*Tier:* Core · *Cites:* BASE-AUDIT-001

**Requirement.** Each van and warehouse holds stock of price-book materials with counts; materials used on a visit come off that technician's van; transfers and restocks are recorded; low stock against a par level shows on the van; the day's jobs list the parts they need and whether the van has them. The [operating rules](docs/service-work-rules.md#stock-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture sets van stock, records materials used on two visits, transfers from the warehouse, and checks counts, a low-stock flag and the parts-on-board check for tomorrow's jobs.
2. The owner and office keep stock locations (a van per technician, and warehouses) holding price-book materials only, counted in the material's unit to a thousandth; par levels are set per location and material.
3. A stocktake sets a count, a restock adds, a transfer moves between two locations and is refused when the source holds less; a material from the price book that a technician records on a visit (`GLOVE-06`, so also offline) comes off that technician's van, and a count may go below zero, shown as such.
4. Every movement is a stock-move record with who, when, the change and the count after, and a timeline entry.
5. An item is low when its count is at or below its par.
6. The parts a job needs are its lines' materials, and a task line's material contents, at their quantity times the line's quantity; the day's parts check walks one technician's visits on a local date in start order, and a part is on board for a job when the van holds enough for that job and every earlier job that day.
7. A technician reads only their own van and their own day.

#### STOCK-002 — Purchase orders to suppliers

*Tier:* Core · *Cites:* BASE-AUDIT-001

**Requirement.** The office raises purchase orders to suppliers (by email or supplier portal), receives them fully or partly into a van or warehouse, and links job-specific orders to the job's cost. The [operating rules](docs/service-work-rules.md#stock-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture raises a PO for a job, receives it in two parts, and checks stock and job cost.
2. The owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (with an optional email) of 1 to 50 price-book materials, each at a quantity to a thousandth of its unit and the supplier's unit cost (the item's price-book cost unless given), delivered to one van or warehouse (`STOCK-001`), for stock or for one job; it changes only while a draft.
3. A draft order goes to the supplier in one of two ways, and the record and timeline say which: the owner or office emails it from Glove to the order's supplier address, or another address the person names, through the owner's connected email (`COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018` email send action with kind purchaseOrder; the order then reads sent, naming the email, with the provider's reported outcome, where delivered means only that the supplier's mail server accepted it), or the person sends it outside Glove by email, the supplier's portal, phone or in person and records that method with the supplier's reference, which is recorded as sent with no delivery claim.
4. Glove has no supplier-portal connection.
5. Only a sent order is received, in one or more parts, each line at most what is still due; each part adds to the delivery location's stock as a stock move naming the order (and its job), and the order reads partly received until every line arrives.
6. A job's received lines count to its actual cost (`COST-004`) at the order's unit cost; a price-book material recorded on that job counts at its price-book cost only beyond the quantity the job's orders received of it, so nothing is costed twice.
7. A job order shows on the property history (`CUST-001`).
8. Unit costs are margin figures (`MONEY-003, MONEY-006`): purchase orders are read only by roles that read reports, never by technicians.

### Team and permissions

#### TEAM-001 — Custom roles and permissions

*Tier:* Core · *Cites:* BASE-ACCESS-004, BASE-ROLE-001

**Requirement.** The owner builds roles from named permissions (for example a CSR who books and takes card payments under `PAY-009` but cannot see margins or refund, a lead technician who can approve field quotes), each enforced by every command handler and read door as the built-in roles are. The [operating rules](docs/service-work-rules.md#team-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A custom customer-service role is refused each command outside its named permissions through every product door.

#### TEAM-002 — Branches

*Tier:* Core · *From:* TEAM-002 · *Cites:* BASE-ACCESS-004, BASE-ROLE-001

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

#### TEAM-004 — Branch operational projections

*Tier:* Core · *From:* TEAM-002 · *Cites:* BASE-ACCESS-004, BASE-ROLE-001

**Requirement.** Branch operational projections supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#team-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A technician must belong to the job’s branch; the existing area warning/refusal rule also applies to its branch ZIP codes.
2. The Dispatch branch choice shows its own technicians, work and local zone.
3. Actual per-branch US tax settings and the REPORT-002, REPORT-004 tax-jurisdiction rows ship with MONEY-001, MONEY-004, MONEY-005, which carries them in its text and acceptance.
4. Revenue reports include branch rows and a branch filter in JSON and CSV, dating each invoice by its branch’s local first-approval date (both period ends included).
5. Customers cannot merge across branches.
6. Every existing report accepts the branch filter in JSON and CSV; future record kinds, read doors and reports inherit the same scope before shipping (API-002, API-006, API-007/003, COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018..009, PAY-001, PAY-010, PAY-011, PAY-012, PAY-013, PAY-014, PAY-015, PAY-016..009, LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007..004, PLAN-002..005, MOVE-001, MOVE-007..006).

#### TEAM-005 — Current branch authority

*Tier:* Core · *From:* TEAM-002 · *Cites:* BASE-ACCESS-004, BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** Current branch authority supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#team-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The owner limits a person to a named branch or the main business branch, or removes that limit.
2. The installation owner retains all-branch access.
3. Limits apply to every current read and command door, including files, Activity, history, reports, business/CSV exports, saved command outcomes and workflow actions under their creator’s live scope; a changed limit is rechecked in the commit guard.
4. Scoped people read and change only operational records rooted in their branch; shared business reference data remains readable under their existing role and is read-only for them.
5. New operational records created by a scoped person belong to their branch.

#### TEAM-003 — Technician commissions and bonuses

*Tier:* Core · *From:* TEAM-003

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

#### TEAM-006 — Commission payroll export

*Tier:* Core · *From:* TEAM-003

**Requirement.** Commission payroll export supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#team-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Earnings are computed for the pay period when the payroll files are read, and the owner's timesheet approval covers hours only.
2. They join `COST-002, COST-006, COST-007`'s payroll files for the same people: Gusto's commission column on each workweek's row (a workweek with commissions but no time gets its own row with zero hours), one ADP RUN row per person with the owner's commission earnings code (default COMM, set to the code the owner's RUN earnings report shows), blank Pay Hours and the total in Dollars, and one QuickBooks Payroll Commission line per person and local date with the amount in an Amount column.
3. A technician with commissions but no approved time in the period is left out of the files with that reason; a 1099 subcontractor is never in them.
4. The payroll JSON gives each person's sold, completed and agreement amounts and every credited sale.
5. Commission columns, like the hour columns, are not confirmed against a live Gusto, ADP RUN or QuickBooks account; Glove pays no one.
6. Inheritance: technician tips do not exist today; `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020` adds each technician's tips to the same files for the same approved weeks , and `QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018` field quotes and `COMM-006, COMM-022, COMM-023, COMM-024, COMM-025` hub sales credit their selling technician under these rules.

### Reporting

#### REPORT-001 — Owner dashboard

*Tier:* Core

**Requirement.** The owner's home shows today's jobs and their state, technicians on the clock, revenue booked and paid today, open quotes, unbilled completed jobs, receivables and agreements due. The [operating rules](docs/service-work-rules.md#report-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture with a fixture day checks every figure against the records it summarizes (today's tiles; each later tile is checked by its own clause's acceptance).
2. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

#### REPORT-002 — Job, revenue, technician and lead reports

*Tier:* Core · *From:* REPORT-002

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

#### REPORT-004 — Report inherited payment and monthly dates

*Tier:* Core · *From:* REPORT-002

**Requirement.** Report inherited payment and monthly dates supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#report-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Technician close rate from field quotes (`QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018`) and tax collected from payments (`PAY-002, PAY-017, PAY-018, PAY-019, PAY-020`) come with those clauses, which carry them in their text and acceptance.
2. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

#### REPORT-003 — Receivables aging

*Tier:* Core

**Requirement.** An aging report (current, 1–30, 31–60, 61–90, over 90 days) by customer with links to each open invoice and its reminder state. The [operating rules](docs/service-work-rules.md#report-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Invoices at every aging boundary fall into the exact customer and currency bucket, with a link to each open invoice.
2. Terms edits, export and approved corrections preserve frozen dates; an unapproved correction changes no balance.
3. The report’s JSON and CSV agree; invalid dates and forbidden branch reads are refused.
4. Payment and reminder labels show their actual recorded basis.
5. The report opens at both widths and follows an exact invoice.
6. Payment, allocation, credit and refund effects follow PAY-018 and PAY-021; reminder state follows PAY-005.
7. Fixed-monthly invoice dates follow PLAN-013.

### Move-in from other systems

#### MOVE-001 — Move in from the client-and-property source system

*Tier:* Core · *From:* MOVE-001 · *Cites:* BASE-DATA-001

**Requirement.** Move in from the client-and-property source system supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture previews and commits a documented-shape Jobber fixture, checks open balances, recurring visits and the price book from the products and services CSV arrive, and undoes it; the same journey on a real owner export is recorded when one is available.
2. Imported source quotes retain their source status, terms and cent-reconciled lines as read-only history; a source approval creates no Glove approval, signature, send or new job.
3. New customer decisions use a new native quote.
4. Imported invoice lines reconcile with the source amounts and balance report, including document discounts; every job belongs to the same source client, and a multi-job balance counts once.
5. Closed source jobs stay archived.
6. Job-owned notes retain source time, and downloaded job attachments retain exact bytes without fetching source URLs.
7. An unscheduled source visit is explicit pending history on its job, with no invented time or capacity reservation; the dispatcher books native work explicitly.

#### MOVE-007 — Imported recurrence proposals

*Tier:* Core · *From:* MOVE-001

**Requirement.** Imported recurrence proposals supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Source recurrence definitions stay visible but inactive until an exact rule mapping exists.
2. Unsupported shapes remain named in preview.

#### MOVE-002 — Move in from the service-plan source system

*Tier:* Core · *From:* MOVE-002

**Requirement.** Move in from the service-plan source system supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A documented-shape Housecall Pro fixture follows the complete client-and-property move-in journey.
2. Saved Housecall Pro public API responses use the existing owner-only dry run, reviewed fingerprint, source journal and guarded Undo.
3. Price-book monetary integers are cents; invoice quantities are hundredths.
4. Imported invoices retain dated remaining balances and cannot become new sales.
5. Existing source visits arrive without starting future schedules.
6. Source roles grant no sign-in.
7. Unknown fields and unsupported rules are named; nothing sends or charges.

#### MOVE-008 — Imported leads and invoice discounts

*Tier:* Core · *From:* MOVE-002

**Requirement.** Imported leads and invoice discounts supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Housecall Pro leads retain source identity, customer and optional site, source and pipeline labels, and open, won or lost state; unknown source stage times stay unknown.
2. Invoice discounts are non-negative source cents represented as negative lines, with each item amount, gross subtotal, discounts, tax and final total reconciled before import.

#### MOVE-003 — Move in from the location-and-membership source system

*Tier:* Core · *From:* MOVE-003

**Requirement.** Move in from the location-and-membership source system supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A documented-shape ServiceTitan fixture follows the complete client-and-property move-in journey.
2. The owner loads saved V2 response files from the location-and-membership source system and downloaded attachments through the existing move-in dry run, reviewed fingerprint, journal and guarded undo.
3. Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assignments, service and material price-book entries, notes, attachment bytes, equipment and warranties remain linked.
4. Invoice remaining balances are dated opening balances, never a new sale or an approved invoice to repost.
5. Nothing is scheduled, emailed or charged by importing.
6. A shape without an exact native rule, an unknown field, missing bytes or a rejected parent is named in the preview and its source is retained, as `MOVE-001, MOVE-007` requires.
7. `MOVE-005` retains carried QuickBooks references and the cutover checklist; `MOVE-006` retains saved methods, autopay and processor authorization; a real owner-export journey is recorded when available (`MOVE-001, MOVE-007`).

#### MOVE-009 — Imported memberships and recurrence proposals

*Tier:* Core · *From:* MOVE-003 · *Cites:* BASE-ROLE-001

**Requirement.** Imported memberships and recurrence proposals supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. One source membership remains one agreement, including ongoing or multiple-location terms; each source recurring-service event keeps its own site, template SKUs, quantities, exact due date and completed or source-closed state.
2. Its source billing template is labelled separately from charge permission, and unavailable member benefits are named.
3. Monthly rules with one day and weekly rules with one weekday matching their anchor map to inactive native proposals; a person explicitly chooses a technician and times before activating a mapped rule strictly after exported events, with its original end date.

#### MOVE-004 — Move in from the recurring-report source system and the additional job source system

*Tier:* Core · *From:* MOVE-004

**Requirement.** Move in from the recurring-report source system and the additional job source system supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Documented-shape FieldPulse and Workiz fixtures follow the complete client-and-property move-in journey.
2. FieldPulse saved job responses may be accompanied by its documented Recurring Jobs CSV report.
3. The report's Recurring Job ID joins only exact recurring_parent_id values, never customer names; conflicting or absent customer/site parents are rejected.
4. One definition remains one inactive job proposal with source frequency, anchor and end condition retained.
5. The report's last generated occurrence and every exported occurrence, including later exceptions, bound explicit activation under the existing series create action guard.
6. Exactly matching weekly weekday wording maps to a native weekly proposal; other frequencies are named as unmapped and retained without guessing (FieldPulse's absent-month-date skip must not become Glove's last-day clamp).
7. A person must choose a technician and times and explicitly confirm activation after all exported work, retaining the source end condition.
8. No import schedules, charges or sends anything.

#### MOVE-010 — Additional-source move-in and cutover

*Tier:* Core · *From:* MOVE-004

**Requirement.** Additional-source move-in and cutover supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#move-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A Workiz source rule is mapped only from its documented encoding; an unavailable encoding remains explicitly unmapped.
2. MOVE-005 retains accounting references, agreements/equipment and cutover; MOVE-006 retains saved methods, autopay and processor authorization.

#### MOVE-005 — Open balances, agreements and equipment carried over

*Tier:* Core

**Requirement.** Every kit carries open invoice balances (as opening balances that the documented refusal does not post twice), every accounting reference the source kept (the QuickBooks Online customer, item and invoice IDs its sync wrote, used by `LEDGER-004` to link rather than re-post), active agreements with remaining entitlements and renewal dates, installed equipment, and saved cards, bank accounts and autopay authorizations (`MOVE-006`); a guided cutover checklist tells the owner what to switch off in the old system and when, including the payment processor's export request and its freeze window. The [operating rules](docs/service-work-rules.md#move-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture moves in a fixture with open balances and an active agreement, checks balances and entitlements and the carried QuickBooks IDs, and checks the QuickBooks fake receives no duplicate invoice; the cutover checklist lists the processor export request and the freeze window.

#### MOVE-006 — Saved cards and autopay carried over

*Tier:* Core

**Requirement.** Each kit carries every moved-in customer's autopay: the agreements and recurring jobs that charged a saved card or bank account. Card and bank numbers move processor to processor, never through Glove: the `MOVE-005` cutover checklist tells the owner to request the old processor's export to Stripe (Stripe's PAN import, about 10 business days) and names the freeze window between export and import, in which card updates made in the old system are lost and must be collected again. When Stripe completes the import, the owner loads Stripe's mapping file (old customer and card IDs to new Stripe customer and payment-method IDs); Glove attaches each imported method to its moved-in customer and to the agreements or recurring jobs it paid, keeping the original authorization reference, consent date and source as the `PAY-008, PAY-027, PAY-028, PAY-029, PAY-030` authorization record. Glove lists every autopay agreement or recurring job with no migrated method, sends those customers a tracked card-update link (`COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018`, `COMM-002`) before their next charge, and shows who has updated. A renewal or recurring charge with no method is held as "needs payment method" with a reminder, never charged and never counted as a failed payment for dunning. The [operating rules](docs/service-work-rules.md#move-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture moves in a fixture with 10 autopay agreements, loads a Stripe-fake mapping file matching 7, and checks those 7 carry the imported method and original authorization reference and renew with a charge; the other 3 are listed with update links queued before their next charge date, their renewals charge nothing and enter no dunning, and one customer's update link saves a method that the next renewal charges; the cutover checklist shows the processor export request and the freeze window.

### Integrations and API

#### API-001 — Documented HTTP API

*Tier:* Core · *Cites:* BASE-DOCS-001, BASE-INPUT-001

**Requirement.** Every read and command people use is a documented HTTP door ([API.md](API.md)) that agents and integrations call under the same roles and checks. The [operating rules](docs/service-work-rules.md#api-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Each documented service-work read and command can be called through the HTTP door with the same product outcome as its screen.

#### API-002 — Webhooks and integration tokens

*Tier:* Core · *From:* API-002 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-OPS-003, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Webhooks and integration tokens supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#api-002-operating-rules) retain the record formats and calculations. Recorded decisions: RL-21.

**Acceptance.**
1. A fixture issues a dispatcher-scoped token, is refused an owner command with it, and receives signed webhooks for a booked visit and a paid invoice, with a retried failed delivery.
2. Only the owner issues (token issue action) and revokes (token revoke action) integration tokens.
3. A token acts as one role: Dispatcher, Office, Agent, Viewer or one of the owner's custom roles, never Owner, Technician or Subcontractor (field roles act for a person on their own visits).
4. Without branchId it reaches every branch; with a branch id, or main for the main business, it is limited like a branch-limited person (`TEAM-002, TEAM-004, TEAM-005`).
5. The token (glv_ and 43 base64url characters from 32 random bytes) appears once, in the issuing response; Glove keeps only its SHA-256, never in records, the saved command outcome a replay returns, Activity, exports or the portable archive (restored installations issue new tokens).
6. A request with Authorization: Bearer <token> acts as that role through every read and command door, without the same-origin check sessions need.
7. Each request checks the token is unrevoked, and each commit re-checks in its atomic batch that the token is unrevoked, still holds its role, and that a custom role's permissions are unchanged; a revoked token is refused (401) from its next request.
8. What a token changes is in Activity under "<name> (integration token)" with its role; the owner's token list shows each token's role, branch, issue time, last use (every request) and revocation, never the token or its hash.

#### API-006 — Integration policy and workflow authority

*Tier:* Core · *From:* API-002 · *Cites:* BASE-OPS-003, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Integration policy and workflow authority supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#api-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Agent-token changes to other tokens, roles, assignments, grants or branch limits carry access; provider-key or calendar-credential changes carry security.
2. The company’s policy decides within the sponsor’s current authority.
3. A call never widens its own authority or changes policy or Pause.
4. A workflow rule a token created runs as that token's current role and branch, and is logged "not allowed" once the token is revoked.

#### API-007 — Signed webhook delivery

*Tier:* Core · *From:* API-002 · *Cites:* BASE-OPS-003, BASE-SECRET-001

**Requirement.** Signed webhook delivery supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#api-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A booked visit and a paid invoice produce signed webhook events, with retries and an operator delivery log.
2. Delivery validates the resolved destination at use time and preserves the refusal boundary if the address changes.

#### API-003 — Zapier and Crank apps

*Tier:* Core

**Requirement.** Published Zapier and Crank apps expose Glove's triggers and actions (create request, create customer, new paid invoice) for cross-app automation. The [operating rules](docs/service-work-rules.md#api-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The published Zapier and Crank apps each execute their declared Glove triggers and actions against a running installation.

#### API-004 — CompanyCam photos

*Tier:* Core · *From:* API-004 · *Cites:* BASE-DATA-001, BASE-INPUT-003, BASE-SECRET-001

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

#### API-008 — CompanyCam export and reconciliation

*Tier:* Core · *From:* API-004 · *Cites:* BASE-DATA-001, BASE-INPUT-003, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** CompanyCam export and reconciliation supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#api-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A selected original Glove photo sends only its bytes and caption to that project; no customer identity, contacts, job prices or other fields are sent.
2. A durable, current-authority-checked reservation precedes the upload.
3. Its provider photo id and caption outcome are kept; repeating a send never sends that photo again.
4. An uncertain upload is labelled “outcome unknown; check CompanyCam” and is never resent.
5. The owner can reconcile it to an existing photo in the same project only after its original-byte SHA-256 matches; this confirms the photo without claiming any unconfirmed caption.
6. Exported photos do not loop back into the job; a photo matching an uncertain upload is held with a visible reconciliation error.
7. Link, import and export outcomes and provider ids are audited on the job; whole-business export and the portable archive retain references and upload reservations, never the token.

#### API-005 — Workflow rules

*Tier:* Core · *Cites:* BASE-OPS-004, BASE-ROLE-001

**Requirement.** The owner sets rules of the form "when this happens, do that" on Glove's own events (when a job with the "commercial" tag completes, assign the invoice to a named office person; when a quote over $5,000 is approved, notify the owner; when a request comes from Angi, apply its lead cost), each with a run log and an on/off switch; a rule can do only what its creator's role can. The [operating rules](docs/service-work-rules.md#api-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture creates two rules, triggers each, checks the run log and effect, and checks a rule created by an office person cannot book a visit.
2. The owner and the office make rules (rule save action); a rule's creator or the owner changes it or turns it off.
3. A rule has a trigger among Glove's own events (a request created, a quote's price approved, a job created, a job completed), an optional condition (the request's source; the quote's or job's total over an amount, tax included) and one action: an in-app notice to a desk role or to one named person who holds a desk role , booking a job just created with a technician a number of days later at set times, or assigning a job just completed's invoice preparation to one named person who prepares invoices (the owner or an office person), shown on the job with a notice to them.
4. After every command, each enabled rule whose trigger that command raised runs once, as its creator's current role checked at run time through the same command checks: an action that role cannot take is logged "not allowed" and does nothing, and a booking with a conflict is logged "refused" (a rule never confirms a conflict review).
5. Every run is logged with the rule and its version, the triggering record, the outcome and why, and is shown with the rules on the Rules screen; what a rule does never triggers another rule.
6. A customer-tag condition comes with `CUST-004, CUST-006`, and applying a lead cost (leadCost, on enquiry created action) with `BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017`, which carry them in their text and acceptance.

### Data, privacy and operations

#### DATA-001 — Customer privacy requests and erasure

*Tier:* Core · *From:* DATA-001 · *Cites:* BASE-AUDIT-001, BASE-DATA-001, BASE-DATA-003, BASE-DATA-005, BASE-ROLE-001, BASE-SECRET-001

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

#### DATA-005 — Customer erasure inheritance

*Tier:* Core · *From:* DATA-001 · *Cites:* BASE-DATA-003, BASE-DATA-005

**Requirement.** Customer erasure inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. QUOTE-005, QUOTE-015 proves its snapshot/attachment erasure in the document flow; future MOVE-001, MOVE-007..006, QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018, COMM-002/005/006/009, PAY-002, PAY-017, PAY-018, PAY-019, PAY-020/004/007/008/009 and LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007..004 inherit their additional personal stores before shipping.
2. Outside copies and holds are DATA-005.

#### DATA-006 — Shared import-source erasure

*Tier:* Core · *From:* DATA-001 · *Cites:* BASE-DATA-003, BASE-DATA-005

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

#### DATA-007 — Peer redaction and device erasure fences

*Tier:* Core · *From:* DATA-001 · *Cites:* BASE-DATA-003, BASE-DATA-005

**Requirement.** Peer redaction and device erasure fences supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Subject values are the group's exact typed identifiers (name, email, phone, address, contact name/phone/email, certificate number).
2. Peer-owned records that mention them have only those values redacted and are never deleted.
3. Rewritten identifiers are keyed or random, never a plain hash of a personal value.
4. No send or remote deletion happens.
5. At the next successful device refresh, value-free fences remove the earlier assignee's cached day, photo cache and queued captures for erased visits; losing an assignment alone never discards late evidence.
6. A disconnected device cannot observe erasure until it reconnects.

#### DATA-008 — Privacy delegation and agent erasure

*Tier:* Core · *From:* DATA-001 · *Cites:* BASE-DATA-003, BASE-DATA-005, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Privacy delegation and agent erasure supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Only a signed-in owner without branch limits confirms today.
2. A TEAM-001 privacy permission may later delegate the door.
3. Agents may prepare a request for a person's decision under GLOVE-10/AGENT-009.
4. A token or agent never records a person’s confirmation.
5. An agent’s own erasure act carries destructive and sensitive, with the company’s policy deciding the call under its sponsor’s authority.

#### DATA-002 — Every change, message and payment recorded

*Tier:* Core · *From:* DATA-002 · *Cites:* BASE-AUDIT-001, BASE-OPS-005

**Requirement.** Every change, message and payment recorded supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-002-operating-rules) retain the record formats and calculations. Recorded decisions: RL-24.

**Acceptance.**
1. Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule actions, calendar reads, audience pushes, model responses, CompanyCam photo syncs and Web Push setup/subscription/removal/outcomes, and find each current kind with who, when and what changed in Activity and the business export.
2. The browser journey loads an older provider outcome in Activity at 1440 and 390.
3. Future communication, payment and accounting flows assert their new kinds before shipping under the carriers below.
4. DONE covers every current capability.
5. Every committed Glove command must supply an explicit timeline event; an eventless command is refused before its changes commit.
6. An event keeps its actual person/agent/rule-creator identity, time, command id, subject and effect.
7. The command's first event also keeps the ids, before/after versions and changed field names of its changed records, without copying private field values.

#### DATA-009 — Audit record projections and provider facts

*Tier:* Core · *From:* DATA-002 · *Cites:* BASE-AUDIT-001, BASE-OPS-005, BASE-ROLE-001

**Requirement.** Audit record projections and provider facts supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Activity's changed-record details follow the same current visibility as the underlying records.
2. Provider response facts identify the provider and a generic outcome, never credentials, endpoints, keys or payloads; current model, audience, CompanyCam and Web Push outcomes are recorded separately so the fact survives a lost final command commit.
3. Web Push records subscription/technician/job ids and HTTP status only, including 404/410 and unreachable services; it never claims delivery to the phone.
4. Subscription setup/removal, marketing disconnects, custom-field/tag/segment edits, stock locations, purchase-order revisions and rule changes/runs have their own explicit events.
5. Activity loads older events by sequence, with current role/job checks on every page; its loaded history is discarded when the installation change version or reader changes.

#### DATA-010 — Future audit inheritance

*Tier:* Core · *From:* DATA-002 · *Cites:* BASE-AUDIT-001, BASE-OPS-005

**Requirement.** Future audit inheritance supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#data-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Every future clause adding a capability, provider, record kind or door inherits this obligation.
2. The absent customer-message/call/portal kinds are carried by COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018/002/005/006/009, payments/refunds/payouts/office charges by PAY-002, PAY-017, PAY-018, PAY-019, PAY-020/004/007/009, and accounting syncs by LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007/002/003/004, each named in its text and acceptance.
3. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

#### DATA-003 — Hosted on the owner's own Cloudflare account

*Tier:* Core · *Cites:* BASE-BACKUP-001, BASE-DATA-001, BASE-INSTALL-001, BASE-OPS-002, BASE-SECRET-002

**Requirement.** rer deploy puts Glove on the owner's Cloudflare account with their domain, backups and the provider secrets above, and the hosted installation passes the same acceptance flows as a local one. The [operating rules](docs/service-work-rules.md#data-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A hosted deployment runs the API flow suite against its own URL and a restore from its backup.

#### DATA-004 — Free, open source and run on the owner's own computer

*Tier:* Core · *Cites:* BASE-DATA-005, BASE-INSTALL-001

**Requirement.** Glove is MIT-licensed, and its self-hosted installation completes the trade-service journey on the owner’s computer. The [operating rules](docs/service-work-rules.md#data-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. In a fresh local installation, the owner, dispatcher, technician and office complete the service-work journey.

### Agent surface

**Specialist: service coordinator.** It takes a service business from incoming requests through priced work, capacity-safe dispatch, field evidence, collection and recurring maintenance.

Inherits BASE-AGENT-001 to BASE-AGENT-013. The company's policy decides every call.

**How Glove computes each class.** The server uses the actual recipient, current job and invoice revisions, current customer and provider records, and the requested operation:

- **standard:** reversible internal preparation and reads; facts name the affected requests, quotes, jobs, visits or items.
- **external:** a customer, supplier, provider or public reader newly receives business information; facts give recipient count and internal, known, new or public counterparty. A saved business customer or supplier is known; an unrecognized address is new; a public link is public. Publishing a report or exposing photos counts as disclosure too.
- **money:** collection, refund, credit allocation, payout or ledger posting changes an amount owed or paid; facts give exact amount, currency and customer, supplier or provider counterparty.
- **commitment:** a quote or change-order decision, binding invoice approval, agreement term, supplier order or customer sign-off is recorded as the caller's own act; facts give the exact revision, value and counterparty.
- **accounts:** an outside number, provider account or other paid external resource is created; facts name the provider and resource.
- **gated:** a provider requires personal consent, hosted card entry, merchant verification or acceptance of terms in a person's name; facts name the provider and required step. An available company-credential route uses the company's decision for its classes.
- **access:** staff, branch, role, device, location-view or agent authority changes; facts name the people or grants and whether authority widens or narrows.
- **security:** a provider credential, callback authenticator or protective setting changes; facts name the setting or connection without its secret.
- **destructive:** erasure, irrevocable financial voiding or another action cannot be undone in Glove; facts give the exact affected item count.
- **sensitive:** a payroll number, customer tax identifier, bank or payment credential is read or handled; facts give record count and data kind. Ordinary service location alone is not classified as regulated data.
- **live:** public intake, active routing or workflow configuration changes the service used by customers or staff; facts name the affected live service.

| Tool | Does | Core clauses | Risk class | Today |
| --- | --- | --- | --- | --- |
| `glove.business.update` | Maintain business identity and tax configuration | GLOVE-01, MONEY-001, MONEY-004, MONEY-005, MONEY-002 | standard or sensitive | Business settings; MCP mapping unbuilt |
| `glove.pricebook.update` | Maintain prices, costs, tasks and reusable service checklists | MONEY-003, MONEY-006 | standard | Price book; MCP mapping unbuilt |
| `glove.customers.update` | Maintain contacts, sites, equipment, tags and reviewed merges | GLOVE-02, CUST-001, CUST-002, CUST-004, CUST-006, CUST-005 | standard or sensitive (+ external) | Customers; MCP mapping unbuilt |
| `glove.intake.configure` | Configure website and provider lead intake | BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010, BOOK-003, BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017 | security · live (+ external) | Request intake; MCP mapping unbuilt |
| `glove.booking.manage` | Offer and book service calls and assessments against real capacity | GLOVE-05, BOOK-002, BOOK-011, BOOK-012, BOOK-013, BOOK-005, BOOK-006, DISP-006 | standard (+ external) | Booking and assessments; MCP mapping unbuilt |
| `glove.quotes.prepare` | Prepare options, templates, discounts, field quotes and change orders | GLOVE-03, QUOTE-001, QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018, QUOTE-007, QUOTE-019 | standard | Quote drafts; MCP mapping unbuilt |
| `glove.quotes.decide` | Record a business price decision or a customer decision with its actual actor | GLOVE-04, QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 | commitment (+ external) | Quote decisions; MCP mapping unbuilt |
| `glove.quotes.send` | Issue quote links and purpose-bound follow-up | QUOTE-004 | external | Quote follow-up; MCP mapping unbuilt |
| `glove.documents.render` | Produce branded customer documents and immutable reports | QUOTE-005, QUOTE-015, FIELD-003 | standard (+ external) | Documents; MCP mapping unbuilt |
| `glove.dispatch.update` | Book, move and optimize individual and crew visits with calendar busy time | GLOVE-07, DISP-001, DISP-002, DISP-010, DISP-003, DISP-011, DISP-004, DISP-007, DISP-013, DISP-014, DISP-008, DISP-015 | standard (+ external) | Dispatch; MCP mapping unbuilt |
| `glove.location.read` | Read the current technician position under an explicit shift-scoped grant | DISP-005, DISP-012, DISP-009 | standard | Map; MCP mapping unbuilt |
| `glove.numbers.manage` | Order, port or host a business number and manage its provider connection | COMM-002, COMM-009, COMM-028 | accounts · money (+ gated) (+ security) (+ external) | Number ordering and porting unbuilt |
| `glove.messages.send` | Send configured email, SMS, notices, reviews and call follow-up | COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018, COMM-002, COMM-003, COMM-019, COMM-020, COMM-004, COMM-021, COMM-008, COMM-026, COMM-027, COMM-009, COMM-028 | external | Communications; MCP mapping unbuilt |
| `glove.conversations.read` | Read or reply to the customer conversation and shared inbox | COMM-005, COMM-007 | standard or external | Conversation; MCP mapping unbuilt |
| `glove.hub.issue` | Issue the bounded customer-hub access and requested customer action | COMM-006, COMM-022, COMM-023, COMM-024, COMM-025 | external (+ commitment) (+ money) (+ gated) | Hub projection; MCP mapping unbuilt |
| `glove.field.capture` | Record assigned visit work, forms, materials, signatures and equipment readings | GLOVE-06, GLOVE-08, FIELD-002, FIELD-006, FIELD-011, FIELD-007 | standard or commitment | Field actions; MCP mapping unbuilt |
| `glove.time.update` | Record job time, submit timesheets and prepare payroll and commission data | COST-001, COST-002, COST-006, COST-007, TEAM-003, TEAM-006 | standard or sensitive (+ external) | Time and payroll; MCP mapping unbuilt |
| `glove.expenses.update` | Record job expenses and inspect actual margins and warnings | COST-003, COST-004, COST-005 | standard | Costing; MCP mapping unbuilt |
| `glove.invoices.prepare` | Prepare and correct invoice revisions, stages and customer statements | GLOVE-09, PAY-001, PAY-010, PAY-011, PAY-012, PAY-013, PAY-014, PAY-015, PAY-016 | standard or commitment (+ external) | Invoices; MCP mapping unbuilt |
| `glove.payments.collect` | Issue hosted payment requests, saved-method charges and on-site collection | QUOTE-003, QUOTE-014, PAY-002, PAY-017, PAY-018, PAY-019, PAY-020, PAY-003, PAY-008, PAY-027, PAY-028, PAY-029, PAY-030, PAY-009 | money (+ sensitive) (+ gated) (+ external) | Test payment actions; MCP mapping unbuilt |
| `glove.payments.adjust` | Allocate installments, refunds, credits and payout reconciliation | PAY-004, PAY-021, PAY-022, PAY-023, PAY-007, PAY-025, PAY-026 | money (+ destructive) | Payment reconciliation; MCP mapping unbuilt |
| `glove.payments.followup` | Send purpose-bound payment reminders and customer-chosen financing requests | PAY-005, PAY-006, PAY-024 | external (+ money) (+ gated) | Payment follow-up; MCP mapping unbuilt |
| `glove.ledger.sync` | Connect, inspect, review and post mapped books records | LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007, LEDGER-002, LEDGER-008, LEDGER-009, LEDGER-010, LEDGER-011, LEDGER-012, LEDGER-013, LEDGER-014, LEDGER-003, LEDGER-004 | standard or money (+ security) (+ gated) (+ external) | Ledger integrations; MCP mapping unbuilt |
| `glove.agreements.update` | Schedule recurring work, maintain entitlements and renew and bill agreements | PLAN-001, PLAN-006, PLAN-002, PLAN-003, PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011, PLAN-005, PLAN-012, PLAN-013 | standard or commitment (+ money) (+ external) | Recurring work; MCP mapping unbuilt |
| `glove.stock.update` | Maintain van and warehouse stock and issue supplier purchase orders | STOCK-001, STOCK-002 | standard or commitment (+ external) | Stock and purchasing; MCP mapping unbuilt |
| `glove.team.update` | Maintain roles, branches and technician or agent grants | TEAM-001, TEAM-002, TEAM-004, TEAM-005 | access or security | Team; MCP mapping unbuilt |
| `glove.reports.read` | Read operational, tax, revenue, technician and receivables reports | REPORT-001, REPORT-002, REPORT-004, REPORT-003 | standard or sensitive | Reports; MCP mapping unbuilt |
| `glove.integrations.manage` | Manage the documented integration door, hooks, apps, photos and workflow rules | API-001, API-002, API-006, API-007, API-003, API-004, API-008, API-005 | standard or access or security or live (+ external) (+ gated) | Integration actions; MCP mapping unbuilt |
| `glove.privacy.erase` | Preview and execute customer erasure with retained financial effects | DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 | destructive · sensitive | Customer privacy; MCP mapping unbuilt |
| `glove.activity.read` | Read job timelines and export attributable business activity | GLOVE-12, DATA-002, DATA-009, DATA-010 | standard or sensitive | Activity; MCP mapping unbuilt |
| `glove.frontoffice.run` | Answer incoming work, check readiness and prepare delay recovery | GLOVE-10, AGENT-001, AGENT-002, AGENT-003, AGENT-010 | standard (+ external) (+ commitment) (+ money) | Embedded agent actions; MCP mapping unbuilt |
| `glove.collections.run` | Prepare invoice fixes and reconcile collections and payouts | AGENT-004, AGENT-011, AGENT-012, AGENT-013 | standard (+ external) (+ money) | Collection preparation; MCP mapping unbuilt |
| `glove.quotes.suggest` | Draft evidenced quote options from the request and authorized photos | AGENT-005, AGENT-014 | standard (+ external) | Quote suggestions; MCP mapping unbuilt |
| `glove.diagnosis.prepare` | Prepare the repeat-callback checklist and parts plan | AGENT-006 | standard (+ external) | Callback suggestions; MCP mapping unbuilt |
| `glove.agreements.followup` | Prepare due-work booking and renewal outreach | AGENT-007, AGENT-015 | standard (+ external) (+ commitment) (+ money) | Agreement work; MCP mapping unbuilt |
| `glove.brief.read` | Prepare the dated operating brief and proposed next actions | AGENT-008, AGENT-016 | standard | Morning brief; MCP mapping unbuilt |
| `glove.policy.draft` | Draft policy questions for the person who controls policy and Pause | AGENT-009 | standard | Agent settings; MCP mapping unbuilt |

**Resources.** `glove://customers/{id}`, `glove://sites/{id}`, `glove://equipment/{id}`, `glove://requests/{id}`, `glove://quotes/{id}/revisions/{revision}`, `glove://jobs/{id}`, `glove://visits/{id}`, `glove://invoices/{id}/revisions/{revision}`, `glove://payments/{id}`, `glove://agreements/{id}`, `glove://stock/{id}`, `glove://purchase-orders/{id}`, `glove://timesheets/{id}`, `glove://conversations/{id}` and `glove://reports/{kind}` form the service-work graph. Original bytes and customer-facing signed copies remain distinct resources governed by their owning clauses.

**Events.** Request received, quote revised or decided, visit booked or changed, field evidence received, job completed, invoice approved, payment state changed, ledger outcome changed, due visit available and customer consent withdrawn carry the owning record URI. Delivery, approval, review and policy events inherit Base.

**Prompts.** Work the incoming request queue and its quote evidence; plan a dispatch day; prepare completed jobs for collection and books reconciliation; fulfill the due-maintenance week; prepare the morning operating brief. Each prompt links the exact owning clauses and tools in the registry above.

**Not tools, and why.** HTTP-001: an installation routing fact; CUST-003: the reviewed import door; FIELD-001: device-local offline custody; FIELD-004, FIELD-009, FIELD-010: device installation and push permission screens; FIELD-005: native-device distribution and operation; FIELD-008, FIELD-012: the native desk screen, whose business actions are the tools above; MOVE-001, MOVE-007: the reviewed import door; MOVE-002, MOVE-008: the reviewed import door; MOVE-003, MOVE-009: the reviewed import door; MOVE-004, MOVE-010: the reviewed import door; MOVE-005: the reviewed import door; MOVE-006: the reviewed import door and provider-held payment-method transfer; DATA-003: an installation fact; DATA-004: the source licence and installation facts; GLOVE-11: the reviewed import door. These boundaries leave each associated business action in the registry; the reasons are device operation, a person's interactive screen, a connector, the import door or installation facts.

**Limits.** Published installation capacities bound request rate, body size, upload bytes and field-outbox batches. Provider estimates, business thresholds and spend caps follow the company's policy; no daily business-volume ceiling is an installation limit.

**Handoffs.** Listen for customer and supplier context from Business, staff and availability from Auth or Lanyard, ledger outcomes from Pantry and payment-provider changes. Emit typed requests for ledger reconciliation, payroll export, document custody and maintenance follow-up; event text supplies evidence, never authority to expand a job.

#### SURFACE-001 — Service-work registry coverage

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-002, BASE-AGENT-006, BASE-AGENT-013 · *Register:* R-5, R-6, R-7, R-8

**Requirement.** The service coordinator exposes the table’s service-work jobs through the same action registry used by Glove screens and embedded agents.

**Acceptance.**
1. Every Core id in the table or the stated not-tool boundaries is present in discovery, including new parts of a split capability.
2. Quote, dispatch, invoice and maintenance fixtures yield the same Glove revision and business outcome through their UI action and tool.
3. The existing embedded front-office, collection, quote, callback and brief workflows identify their calls by these registry jobs.

#### SURFACE-002 — The linked service-work resources

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-003

**Requirement.** The resources preserve Glove’s customer, property, work and accounting relationships without turning a customer bearer into general business access.

**Acceptance.**
1. A request links its customer, site and assessment; its quote links the exact priced and chosen revisions.
2. A completed visit links its job, assigned worker, captured originals, forms and immutable customer report.
3. An invoice links its approved revision, related stages, credits and confirmed payment effects; an agreement links its entitlements and due visits.
4. The customer-facing signed-copy resource returns the same immutable bytes as the owning quote or report door; a desk-only original stays separate.

#### SURFACE-003 — Invoice and commitment classification

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-006, BASE-AGENT-007, BASE-AGENT-008

**Requirement.** Glove classifies the financial and binding effect of the exact requested service-work action.

**Acceptance.**
1. A payment, refund, credit allocation or payout call computes money with its frozen amount, currency and actual counterparty.
2. A quote decision, invoice approval, change-order application, agreement acceptance or supplier order that binds the business computes commitment with its exact revision, value and counterparty.
3. A draft that changes no amount owed or paid remains standard; calling a charge a draft does not remove money.
4. A call with both a binding decision and a charge carries commitment and money, and the company policy decides that combined call.

#### SURFACE-004 — Customer and provider disclosure classification

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-006, BASE-AGENT-007

**Requirement.** Glove computes exposure from the actual service document, recipient and destination.

**Acceptance.**
1. Email, SMS, supplier orders, provider-bound request photos and newly issued customer links compute external with the recipient count and actual counterparty.
2. A saved customer or supplier is known, an unrecognized recipient is new and an open link is public.
3. An internal draft remains standard; exposing its attachment or customer-facing report outside the business adds external.
4. Changing a recipient or a provider invalidates the earlier disclosure facts and recomputes the call’s classes.

#### SURFACE-005 — Staff and protective-setting classification

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-005, BASE-AGENT-006, BASE-ROLE-001, BASE-SECRET-001

**Requirement.** Glove classifies the authority and protective settings changed by the action.

**Acceptance.**
1. Inviting a worker, changing a branch or custom role, granting a current-shift position view or changing another agent’s grant computes access with the affected people and widening or narrowing direction.
2. Changing a provider key, callback authenticator or protective setting computes security with the connection or setting.
3. A change that combines a new grant and its credential carries access and security together.
4. The service coordinator cannot widen its own authority through a dispatch, role, policy or Pause operation, including under the all-autonomous company policy.

#### SURFACE-006 — Irreversible and regulated-data classification

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-003, BASE-AGENT-006, BASE-DATA-003, BASE-SECRET-001

**Requirement.** Glove distinguishes reversible work from irreversible removal and regulated financial or payroll data.

**Acceptance.**
1. Customer erasure and irrevocable voiding compute destructive with the exact item count; a reversible draft edit remains standard.
2. A payroll-number, customer-tax-identifier, bank or payment-credential operation computes sensitive with the record count and data kind.
3. Erasing a customer with such data carries destructive and sensitive; the retained anonymous financial totals remain visible as the erasure clause requires.

#### SURFACE-007 — Outside-resource and provider-step classification

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-006, BASE-AGENT-008, BASE-SECRET-001

**Requirement.** Glove classifies external resources and provider-controlled personal steps before attempting them.

**Acceptance.**
1. Creating or ordering a business number, outside account or paid provider resource computes accounts with the provider and resource.
2. Hosted customer card entry, merchant verification, a personal consent screen or terms accepted in a person’s name computes gated with the provider and exact step.
3. A provider answer requiring a person adds gated to the same pending job; a company-credential route remains subject to the company’s policy.

#### SURFACE-008 — Live-service and reversible-work classification

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-006, BASE-AGENT-007, BASE-SECRET-001

**Requirement.** Glove derives standard and live from the actual work changed.

**Acceptance.**
1. Reversible internal request, quote, visit, stock and expense edits compute standard with their affected item count.
2. Changing active public intake, call routing or running workflow rules computes live with the service affected.
3. A public-intake change that newly discloses information carries live and external; a credential change on that service also carries security.
4. A customer request claiming that its recipient is internal does not remove external from the resulting customer message; a note claiming that a charge is confirmed does not remove money.

#### SURFACE-009 — Service-provider cost facts

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-011

**Requirement.** Provider-backed service coordination reports the actual model, SMS, mail and map costs covered by the company’s spend rules.

**Acceptance.**
1. Quote-photo analysis, callback diagnosis, customer messages and route calculation expose their provider estimate before the call.
2. Usage separates the cost of model analysis, SMS, mail and mapping from customer amounts collected and supplier amounts committed.
3. A zero-cost internal draft remains available independently of a provider-spend cap.

#### SURFACE-010 — Service-work event handoffs

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-010, BASE-ROLE-001

**Requirement.** The event graph lets the coordinator resume the specific service-work record that changed.

**Acceptance.**
1. A customer quote decision points to the winning exact revision; a payment change points to its invoice and provider outcome.
2. A completed job makes the unbilled-work job available; a due entitlement makes the maintenance-booking job available.
3. Consent withdrawal and an invoice reaching zero make later purpose-bound outreach ineligible before the next send.
4. A ledger or payroll handoff carries the owning record and actual outcome without granting authority to unrelated customer records.

#### SURFACE-011 — A stranger coordinator runs a seeded service week

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-007, BASE-AGENT-009, BASE-AGENT-013

**Requirement.** A stranger agent given only the seed URL completes the linked service-work week through MCP under two complete company policies.

**Acceptance.**
1. The week takes a new service request through quote options, booking into real capacity, technician evidence, an approved invoice and provider-confirmed test collection.
2. It also handles one late visit, one refund or credit reconciliation and one due maintenance visit, retaining the exact customer and job links.
3. Under the all-autonomous company policy every declared class is autonomous, no call waits for a person and none is refused by policy.
4. Under the held company policy standard is review and every other declared class is approval; the signed-in test person takes precisely the returned approval steps.
5. The week’s class facts and decisions reconcile with the actual quote, visit, invoice, payment and maintenance effects under each policy.

#### SURFACE-012 — Existing front-office work uses company policy

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-002, BASE-AGENT-007, BASE-AGENT-008

**Requirement.** The existing embedded-agent jobs and an outside service coordinator take the same company policy for their classed calls.

**Acceptance.**
1. An agent-prepared quote, dispatch proposal and invoice run under each of the company’s chosen dispositions without a seed-selected approval rule.
2. A delay move and its customer text compute the visit change and external disclosure separately and apply the current company policy.
3. A collection step that changes money or a binding business decision carries money or commitment even when prepared by the embedded agent.
4. After a person decides an agent-prepared action, the work record retains that person’s decision and the agent’s preparation as distinct acts.

#### SURFACE-013 — Coordinator documentation and operating overview

*Tier:* Agent surface · *From:* new · *Cites:* BASE-AGENT-009, BASE-AGENT-013, BASE-DATA-003

**Requirement.** The coordinator’s on-site guide and operating overview name the service-work tools, resources and computed classes above.

**Acceptance.**
1. The guide lets a stranger find the incoming-work, dispatch, collection and maintenance prompts and the exact records each job needs.
2. The fixture week’s overview separates customer money, provider spend, outbound recipients, binding decisions and erased items while linking each total to its Glove work records.

## Push further

### Agents that run the job

#### AGENT-001 — AI front office for calls and texts

*Tier:* Core · *Cites:* BASE-AUDIT-001

**Requirement.** The front-office agent answers the business's calls and texts 24/7 (always, after hours or on overflow, by owner setting), speaks and writes like the business, identifies the caller and their property, qualifies the problem, quotes flat-rate prices from the price book, and books into a real open slot (`BOOK-002, BOOK-011, BOOK-012, BOOK-013`, `DISP-006`), then texts the confirmation; every call and thread gets a written summary, and the lead's details (name, address, problem, equipment, urgency) are extracted onto the request. Its data is the price book, technician capacity, skills and areas, the customer's history and equipment, and the owner's call script and policies. Internal intake and reversible booking carry standard; customer replies and confirmations carry external, charges carry money and binding offers carry commitment. The company’s policy decides what runs or needs a person. A provider step requiring a person carries gated. The [operating rules](docs/service-work-rules.md#agent-001-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture books a tune-up into the right slot, refuses an out-of-policy price and hands it to the office, and transfers a gas-smell call within the owner's limit.
2. An inbound text thread is answered by the agent and books a slot, with the confirmation text sent.
3. With the mode set to after hours, a call inside business hours rings the office and the agent does not answer; with overflow, the agent answers only a call the office leaves ringing past the owner's limit.
4. Every call transcript and text thread opens with the automated-assistant disclosure; saying or texting "talk to a person" transfers the call, or hands the thread to the office inbox.
5. The request carries the extracted name, address, problem and urgency, and the call, transcript, thread, summary and booking are on the customer timeline.
6. `AGENT-005, AGENT-014` drafts a quote from a request the agent took with the call's transcript in its evidence (model fake).
7. It also carries `DISP-006`: a booking the front office makes is assigned automatically.
8. COMM-007 inheritance: its sent and received messages (or agent conversations) appear in the COMM-007 stream in order, with direction, channel and author.

#### AGENT-002 — Ready-to-dispatch check the day before

*Tier:* Core

**Requirement.** For each next-day visit, the coordinator confirms access (gate codes, pets, who will be home) with the customer by text, checks the parts the job needs are on the van or at the supplier, and that permits, deposits and equipment history are in place; marks each visit ready or not ready with the reason. Its data is tomorrow's visits, customer threads, van stock, purchase orders and the job's quote lines. Readiness preparation is standard; outside access or parts requests carry external and a binding supplier order carries commitment. The company’s policy decides every such call. The [operating rules](docs/service-work-rules.md#agent-002-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture with five next-day visits (provider fakes) gets one access confirmation, one missing part and one unanswered customer, and checks the ready board and the three proposals.

#### AGENT-003 — Rebook around delays

*Tier:* Core · *From:* AGENT-003

**Requirement.** Rebook around delays supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-003-operating-rules) retain the record formats and calculations. Recorded decisions: RL-25.

**Acceptance.**
1. Under the held company policy, a long-running job leads the agent to prepare a move of the next visit to another technician; the dispatcher approves that exact move and the customer’s confirmation reply lands on the visit.
2. The delay watch (the desk and agents; never field roles) watches today's signals that exist.
3. A booked visit not yet arrived is at risk when its technician is still on an earlier visit that day after that visit's booked end (a running `COST-001` job timer, or arrival without completion): Glove expects them free at the moment of reading plus the overrun so far, at least 15 minutes, and flags their later visits that day starting before then.
4. A visit is also at risk while a purchase order for its job (`STOCK-002`) is not fully received.
5. For an overrun, the watch offers each other active technician free at the same planned time (same branch, skills, areas, time off, calendars and other visits checked; cancelled visits free their slots), then the same technician at the expected free time rounded up to 15 minutes.
6. The agent (or the owner or a dispatcher) prepares a move as a proposal (proposal prepare action); under the held company policy, someone other than the preparer approves the exact move with GLOVE-07 conflict review; a visit changed since preparation needs a new proposal.
7. A move that keeps the planned time, or keeps the start inside the visit's arrival window (`DISP-006`) on the same day, keeps that window; any other move drops it and is labelled "customer not yet asked".

#### AGENT-010 — Granted moves and customer response

*Tier:* Core · *From:* AGENT-003 · *Cites:* BASE-ROLE-001

**Requirement.** Granted moves and customer response supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-003-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Within the AGENT-009 resource and action grant, the same-day, same-technician move keeps its arrival window and its start inside it; the company’s policy decides the standard-class call.
2. A changed window is a distinct action with its own authority and computed facts.
3. The customer's confirmation by reply and the agent's text are carried by `COMM-002` and `COMM-005`, technician locations by `DISP-005, DISP-012`, each naming `AGENT-003, AGENT-010` in its text and acceptance; customer preferences join when a clause records them.

#### AGENT-004 — Chase every invoice until paid and reconciled

*Tier:* Core · *From:* AGENT-004

**Requirement.** Chase every invoice until paid and reconciled supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-004-operating-rules) retain the record formats and calculations. Recorded decisions: RL-26.

**Acceptance.**
1. An unbilled job produces an invoice draft, an overdue invoice produces its purpose-bound reminder sequence, and an unreconciled payment produces a source-linked comparison.
2. Under the held company policy, a consequential accounting call waits for the named person’s exact-revision decision.
3. The invoice chase uses current consent, recipient, dispute, quiet-hour and zero-balance facts; changing the initiator never bypasses a reserved send.
4. A retained payment comparison names its approved invoice, accepted job amount, field evidence and accounting outcome; unknown provider state stays an inspection question.
5. An uncertain accounting operation is inspected without resending it.

#### AGENT-011 — Payment inspection decision has no posting effect

*Tier:* Core · *From:* AGENT-004 · *Cites:* BASE-DATA-003, BASE-ROLE-001

**Requirement.** Payment inspection decision has no posting effect supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. An inspection decision retains its actual recorder and the preparer as distinct people under the held company policy.
2. Approving the inspection alone creates no posting, credit or payment; any consequential call uses its own authority and company-policy decision.
3. The proposal retains branch custody and is removed by customer erasure.

#### AGENT-012 — Retained payout comparison

*Tier:* Core · *From:* AGENT-004 · *Cites:* BASE-DATA-003

**Requirement.** Retained payout comparison supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A signed-in owner without branch limits compares the retained payout or recorded deposit against current source amounts, fees, invoices and payment outcomes.
2. A missing retained posting remains a question, not proof of a missing bank entry; comparing a retained snapshot makes no fresh provider request.
3. Unchanged comparison reuses its proposal; changed source records require a new comparison.
4. A comparison records no posting, credit, refund or money movement.
5. Customer erasure removes personal aggregate proposals.

#### AGENT-013 — Payout comparison authority boundary

*Tier:* Core · *From:* AGENT-004 · *Cites:* BASE-ROLE-001

**Requirement.** Payout comparison authority boundary supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The retained provider-wide inspection follows RL-1 and grants no future coordinator access.
2. Future provider-wide agent access requires its separately scoped authority design; the complete invoice and reconciliation target remains binding.

#### AGENT-005 — Quote writer from the request

*Tier:* Core · *From:* AGENT-005

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

#### AGENT-014 — Quote decision classes and evidence handoff

*Tier:* Core · *From:* AGENT-005

**Requirement.** Quote decision classes and evidence handoff supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-005-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Under the held company policy, a person approves each option’s price before sending.
2. An agent’s binding price decision carries commitment, and sending carries external; the company’s policy decides these calls, with truthful attribution.
3. Quote evidence includes separately consented sanitized request photos under BOOK-008, BOOK-009 and BOOK-010, and the front-office call transcript under AGENT-001, preserving each source’s disclosure limits.

#### AGENT-006 — Repeat-callback diagnosis

*Tier:* Core · *Cites:* BASE-AUDIT-001

**Requirement.** when a property calls back about equipment serviced recently, gathers the equipment history, earlier photos, readings, materials and the manufacturer's manual, and prepares a diagnosis checklist and parts plan for the technician. Its data is equipment records, form results, photos and materials at the property. Evidence gathering and an advisory checklist are standard, with external added for provider-bound disclosure; the company’s policy decides those calls. The licensed technician’s diagnosis and actual certification are recorded as their own acts. The [operating rules](docs/service-work-rules.md#agent-006-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A fixture raises a callback on a condenser with two prior visits and checks the prepared checklist cites both visits' readings.
2. A new job (from a quote or a service call, which can name the site's equipment) is a callback when a unit it names had a visit on another job completed within the 30 days before the job was made, counted on the server's received completion time, the window `REPORT-002, REPORT-004` counts callbacks in; the job carries that flag and its timeline says so.
3. The agent (or the owner or a dispatcher) prepares the checklist with the owner's model provider (`FIELD-006, FIELD-011`'s connection): Glove gathers the unit's record, manual, photos and every earlier completed visit on it (form readings with their ranges and out-of-range flags, refrigerant, notes, materials), oldest first, each visit and reading with a reference; the model gets the equipment and visit evidence and photo captions only, never customer names, contacts or addresses.
4. Every checklist step and part must cite references the pack holds, and Glove resolves each citation to the recorded reading; an answer that cites nothing or anything else is refused and nothing is kept.
5. The prepared checklist is labelled advisory (the licensed technician diagnoses and decides the work; it is not a safety certification), decides no work, and is read by the desk and the technicians assigned to the callback job.

#### AGENT-007 — Keep every maintenance agreement fulfilled

*Tier:* Core · *From:* AGENT-007 · *Cites:* BASE-ROLE-001

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

#### AGENT-015 — Maintenance inspection custody

*Tier:* Core · *From:* AGENT-007 · *Cites:* BASE-AUDIT-001, BASE-DATA-003

**Requirement.** Maintenance inspection custody supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-007-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Preparation is internal inspection only and grants no sending, booking, price or term change.
2. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erasure removes personal preparation records and saved outcomes and scrubs personal timeline copies; DATA-002, DATA-009, DATA-010 keeps attributable inspection, source references and actual effect in Activity and business export.
3. Unknown imported completion evidence is unavailable, never fabricated.

#### AGENT-008 — Morning brief and margin watch

*Tier:* Core · *From:* AGENT-008

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

#### AGENT-016 — Brief delivery and financial sections

*Tier:* Core · *From:* AGENT-008

**Requirement.** Brief delivery and financial sections supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#agent-008-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. The brief is shown when the owner opens Glove and sends nothing by being opened; `COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018` emails it to the owner once per business-local date only when the owner turns that on (mail morning action, off by default), with the delivery outcome asserted in its flow, and nothing is pushed.
2. The brief lists overdue invoices with their invoice links and proposed collection action under PAY-004, PAY-021, PAY-022, PAY-023’s balance rules.
3. PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 now lists outstanding due included visits with their agreement and Dispatch links, asserted in its named flow.
4. PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

#### AGENT-009 — Agent policy and scoped authority

*Tier:* Core · *Cites:* BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** The owner controls agent authority. The owner grants named actions to a named agent (for example send reminder texts from a template, book into open slots for listed services under a price limit, move a visit within its window), with a daily budget and quiet hours; every granted action records the grant it used; one switch pauses every agent. Its data is the grant register and the timeline. People set the company’s policy and Pause. An agent may draft policy questions; a person confirms the change. Other named-agent grants carry access with their direction, and the calling agent never widens its own authority. Business thresholds and provider-spend caps are the company’s choices. The [operating rules](docs/service-work-rules.md#agent-009-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. Under a company policy that permits the named coordinator’s tune-up bookings below $200 and blocks higher values, a permitted booking records its grant and policy, a $250 booking is refused, revocation stops the next booking, and the person’s Pause stops every agent.

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

## Boundaries

Glove does not do these, and this is how a US buyer gets them.

| Glove does not | How buyers get it |
| --- | --- |
| Act as a telecom carrier, register numbers itself or run a full business phone system | Twilio (or another provider) holds the numbers, A2P 10DLC registration and delivery; RingCentral, Dialpad or the owner's system keeps extensions and IVR; Glove records consent and opt-outs and answers on its own numbers (`COMM-002`, `COMM-009`) |
| Process raw card numbers, underwrite credit or lend | Stripe holds card and bank data under its PCI scope, and saved cards move from the old processor to Stripe directly (`MOVE-006`); Wisetack decides and funds financing; Glove records provider-confirmed outcomes (`PAY-*`) |
| Keep the general ledger, file sales tax or run payroll | QuickBooks Online, Xero or Pantry keep the books; Avalara or the owner's accountant files sales tax; [Envelope](https://github.com/just-every/run-envelope), Gusto, ADP RUN or QuickBooks Payroll pay people and file W-2 and 1099 forms (`LEDGER-*`, `MONEY-001`, `COST-002`) |
| Operate maps, GPS hardware or lead marketplaces | Google Maps and routing providers, Linxup, Samsara or Verizon Connect for fleet GPS, Google, Angi, Thumbtack and Yelp for leads (`DISP-002`, `DISP-005`, `BOOK-004`) |
| Replace trade licensing, diagnosis or safe-work judgment | Agents are advisory on technical work; the licensed technician remains responsible for the work and equipment release (`AGENT-006`) |
| Give legal advice on consumer, auto-renewal, surcharging or recording-consent law | Glove carries the notices, consents and settings; the owner sets the wording their state requires |
| Run route optimization or media processing unbounded inside a request | Bounded background jobs and external providers (`DISP-003`, `FIELD-006`) |
| Become a marketing suite or a construction project manager | Mango or Mailchimp for campaigns; Plinth or Buildertrend for multi-month builds; related sibling: [Pegboard](https://github.com/just-every/run-pegboard) |

Physical receipt, completed repair, safe equipment and accepted work require human evidence; a database state, a provider acknowledgment or a restore is not that evidence. A real owner export from each incumbent has not yet been reconciled; each move-in kit is proven against documented-shape fixtures until one is. "Glove" is the working name.

## Homepage claims

| # | Claim | Clauses |
| --- | --- | --- |
| 1 | Every call becomes a paid job. | `GLOVE-03`, `GLOVE-05`, `GLOVE-09`, `BOOK-005`, `AGENT-001`, `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020` |
| 2 | Glove answers your calls and texts | `AGENT-001`, `COMM-002`, `COMM-009, COMM-028` |
| 3 | books the job | `GLOVE-05`, `BOOK-002, BOOK-011, BOOK-012, BOOK-013`, `BOOK-005` |
| 4 | sends the tech | `GLOVE-05` |
| 5 | takes payment on site | `PAY-003` |
| 6 | keeps every maintenance plan on schedule | `PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011`, `AGENT-007, AGENT-015` |
| 7 | 100% free, open source alternative to Jobber, Housecall Pro and ServiceTitan | `DATA-004` |
| 8 | Hero cards: New call 7:42 am · Booked 11:00 am; Dispatch · Luis · Van 3 · ETA 10:52 am; Quote $1,850 · Accepted; Part on backorder · Rebooked Thu, Oct 22 · Customer texted; Paid on site · $412.00 · card; Maintenance plan · 1 visit left · next Apr 3 | `AGENT-001`, `GLOVE-05`, `DISP-005, DISP-012`, `GLOVE-04`, `AGENT-003, AGENT-010`, `STOCK-002`, `COMM-003, COMM-019, COMM-020`, `PAY-003`, `PLAN-002` |
| 9 | 7:42 am · Front office: answers the first ring, says it is an automated assistant, asks what a good dispatcher would ask and books a real open slot | `AGENT-001`, `BOOK-002, BOOK-011, BOOK-012, BOOK-013` |
| 10 | Booked job #4417 with the confirmation text ("You're booked for 11:00") | `GLOVE-05`, `COMM-003, COMM-019, COMM-020` |
| 11 | 8:05 am · Dispatch: the day board, 6 techs and 31 jobs on an 8 am-2 pm grid | `DISP-001` |
| 12 | The route-map strip over the board | `DISP-002, DISP-010` |
| 13 | 8:05 am · Parts check · Van 3: every part job #4417 needs is on board (drain valve and anode), the shutoff from the 7:42 call is on the job, and the on-my-way text goes when Luis leaves Ortiz | `STOCK-001`, `AGENT-001`, `COMM-004, COMM-021` |
| 14 | 10:52 am · Tech app: photos, checklist, options and signature on the tech's phone, with or without signal | `FIELD-001`, `FIELD-002`, `GLOVE-06`, `GLOVE-08` |
| 15 | The data plate read as MFG 2014 · 50 GAL · NAT GAS | `FIELD-006, FIELD-011` |
| 16 | Good, better and best for the replacement; Better accepted | `QUOTE-001`, `GLOVE-04` |
| 17 | Paid on site · $412.00; $500 deposit paid | `PAY-003`, `QUOTE-003, QUOTE-014` |
| 18 | 12:40 pm · Job agent: rebooked before anyone called; finds stock at a branch and a new slot, Maya in dispatch taps Send, Ellen confirms by reply | `AGENT-003, AGENT-010`, `STOCK-002`, `GLOVE-07`, `COMM-003, COMM-019, COMM-020` |
| 19 | Interlude: Van 3 · Ellen's heater delivered · parts for all 5 jobs | `STOCK-001`, `STOCK-002` |
| 20 | Thursday 10:05 am · Payments: card, tap to pay, ACH or financing on site | `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020`, `PAY-003`, `PAY-006, PAY-024` |
| 21 | Each payment lands in QuickBooks Online | `LEDGER-001, LEDGER-005, LEDGER-006, LEDGER-007` |
| 22 | The job shows its real margin: job costing for #4417 + #4418, estimate against actual | `COST-004` |
| 23 | Review request · goes out 6:00 pm | `COMM-008, COMM-026, COMM-027` |
| 24 | Next 12 months · Maintenance plans: Comfort Club at $19/mo, 2 visits a year, 1 visit left, billed monthly, renews | `PLAN-002`, `PLAN-003` |
| 25 | A declined card fixed by an update link | `PAY-008, PAY-027, PAY-028, PAY-029, PAY-030` |
| 26 | Moving in: customers, jobs, quotes, recurring jobs and open balances from a source system in one import | `MOVE-001, MOVE-007` |
| 27 | Onto your office computer or your own server | `DATA-004`, `DATA-003` |
| 28 | 9 customers share a phone number · review merge | `CUST-005` |
| 29 | git clone, then `rer install`, `rer setup`, `rer dev` | `DATA-004` |
| 30 | What it doesn't do: payroll, GPS hardware or marketing campaigns | `COST-002, COST-006, COST-007`, `DISP-005, DISP-012`, `CUST-004, CUST-006` |
| 31 | Every job, done and paid. / Open source field service software for plumbing, HVAC, electrical and home service pros / Free and open source, MIT licensed | `GLOVE-08`, `GLOVE-09`, `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020`, `DATA-004` |
| 32 | Closing cards: 31 jobs done, Paid today · $14,820 | `REPORT-001`, `PAY-002, PAY-017, PAY-018, PAY-019, PAY-020` |

## Status

Judged from the code and tests at commit `a38248e45e342b14c9adb9d7f1a88148a790c5c8` (21 October 2026).

| Clauses | Done | Partial | Missing | Total |
| --- | ---: | ---: | ---: | ---: |
| Published | 12 | 1 | 0 | 13 |
| Target and push further | 114 | 101 | 21 | 236 |
| All | 126 | 102 | 21 | 249 |

| Clause | Title | Kind | Status | Evidence | Gap |
| --- | --- | --- | --- | --- | --- |
| `GLOVE-01` | Set up the business and its people | published | done | `tests/api/flows.test.mjs`, `tests/api/security.test.mjs` |  |
| `GLOVE-02` | Customers and sites | published | done | `tests/api/flows.test.mjs` |  |
| `GLOVE-03` | Request to an approved quote | published | done | `tests/api/flows.test.mjs` |  |
| `GLOVE-04` | The customer's answer, recorded honestly | published | done | `tests/api/flows.test.mjs` |  |
| `GLOVE-05` | Book and assign the visit | published | done | `tests/api/flows.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `GLOVE-06` | Field capture through a connectivity interruption | published | done | `tests/api/flows.test.mjs`, `src/ui/outbox.ts` |  |
| `GLOVE-07` | Dispatch change with conflict review | published | done | `tests/api/flows.test.mjs` |  |
| `GLOVE-08` | Customer completion evidence | published | done | `tests/api/flows.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `GLOVE-09` | Invoice preparation, export and correction trail | published | done | `tests/api/flows.test.mjs`, `tests/api/records.test.mjs` |  |
| `GLOVE-10` | Agent preparation under company policy | published | partial | `tests/api/flows.test.mjs`, `tests/api/security.test.mjs` | Old evidence asserts agent quote preparation and dispatcher-decided quote/dispatch proposals. It does not assert an agent-prepared invoice, its person decision or its attribution, despite the old test title. Company-selected standard, commitment, external and money decisions and the held-policy saved-revision journey are unasserted; fixed Agent-role refusals are not company-policy proof. |
| `GLOVE-11` | Move in from the first source system with dry run, journal and undo | published | done | `tests/api/flows.test.mjs`, `tests/api/movein.test.mjs` |  |
| `GLOVE-12` | The whole timeline, exported and restorable | published | done | `tests/api/flows.test.mjs`, `tests/api/records.test.mjs`, `tests/portable.mjs` |  |
| `HTTP-001` | Foundation HTTP routing | published | done | `tests/runtime.mjs` |  |
| `MONEY-002` | US business identity on every document | target | done | `src/glove/commands/setup.ts`, `src/glove/api.ts`, `src/ui/identity.tsx`, `src/ui/team.tsx`, `tests/browser/journey.spec.ts` |  |
| `CUST-001` | Customer and property history in one place | target | done | `src/glove/commands/setup.ts`, `src/glove/history.ts`, `src/ui/customers.tsx`, `src/ui/property-history.tsx`, `tests/api/customers.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `CUST-002` | Installed equipment and warranties | target | done | `src/glove/commands/equipment.ts`, `src/glove/equipment.ts`, `src/ui/equipment.tsx`, `tests/api/equipment.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `CUST-003` | Customer CSV import and export | target | done | `src/glove/movein/csv.ts`, `src/glove/movein/kit.ts`, `src/ui/csv-import.tsx`, `tests/api/csv.test.mjs` |  |
| `CUST-005` | Duplicate detection and merge review | target | done | `src/glove/duplicates.ts`, `src/glove/commands/merge.ts`, `src/ui/duplicates.tsx`, `src/glove/movein/kit.ts`, `tests/api/merge.test.mjs`, `tests/api/csv.test.mjs` |  |
| `BOOK-003` | Lead sources and the request pipeline | target | done | `src/glove/pipeline.ts`, `src/glove/commands/quotes.ts`, `src/ui/quotes.tsx`, `tests/api/pipeline.test.mjs` |  |
| `BOOK-005` | Service calls booked without a quote | target | done | `src/glove/commands/dispatch.ts`, `src/glove/commands/field.ts`, `src/glove/commands/invoices.ts`, `src/ui/service-call.tsx`, `tests/api/servicecall.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `BOOK-006` | Assessment visits on a request | target | done | `src/glove/commands/assessments.ts`, `src/glove/commands/quotes.ts`, `src/glove/commands/field.ts`, `src/ui/assessment.tsx`, `tests/api/assessments.test.mjs` |  |
| `QUOTE-001` | Good, better and best options and add-ons | target | done | `src/glove/commands/quotes.ts`, `src/glove/commands/dispatch.ts`, `src/ui/options.tsx`, `src/ui/quotes.tsx`, `tests/api/options.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `QUOTE-004` | Automatic quote follow-up | target | partial | `tests/api/reminders.test.mjs` › “QUOTE-004 three quote sequences stop on day-three answer and day-seven expiry without reusing customer links” (exact email and text steps for three quotes, stopped answer and validity, once-only internal call tasks and explicit completion, replay, immutable business and stop footer, postal-address guard, private explicit unsubscribe and subsequent suppression, no reused quote credential); `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” (Settings schedules and template preview, call task and completed state, customer withdrawal) | Call steps create internal tasks only and never place calls. The private withdrawal link permits only an explicit stop of quote-purpose follow-up. Live provider delivery remains unrun; RL-102 resolves shared consent, quiet-hours and withdrawal policy. Existing implementation proof remains partial. |
| `DISP-001` | Drag-and-drop dispatch board | target | done | `src/ui/dispatch.tsx`, `src/ui/dispatch-board.tsx`, `src/glove/commands/dispatch.ts`, `tests/browser/journey.spec.ts` |  |
| `DISP-004` | Skills, availability, time off and service areas | target | partial | `src/glove/eligibility.ts`, `src/glove/calendar.ts`, `src/glove/commands/calendar.ts`, `src/ui/availability.tsx`, `tests/api/eligibility.test.mjs` | availability not read from Lanyard (no Lanyard read door yet); Base egress door: partial until Glove adopts Base's egress door for the owner-entered Lanyard origin (gr-base-285) |
| `DISP-006` | Arrival windows and automatic assignment | target | done | `src/glove/commands/dispatch.ts`, `src/glove/commands/assessments.ts`, `src/ui/dispatch-cards.tsx`, `src/ui/assessment.tsx`, `src/ui/visit-panel.tsx`, `tests/api/assessments.test.mjs` |  |
| `DISP-009` | Delegated dispatcher position view | target | done | `tests/api/eligibility.test.mjs` › “DATA-002 / DISP-002 map and location flow” (owner-only current-shift grants; separate named-agent grant; ungranted reads denied; every delegated map read audited without coordinates; phone status names viewers; withdrawal, branch scope and next-shift refusal; latest position unchanged).  `tests/browser/dispatch-map.spec.ts` › “DISP-002 the map board shows the day's pins and drive times, the owner draws a zone, and the technician's phone hands directions to their navigation app, at 1440 and 390” (owner grants to Dispatcher and named agent, technician notice and delegated map at both widths, keyboard tooltips, clock-out and withdrawal). Latest-only coordinates and archive exclusions under DISP-005 remain unchanged; transient grants are separately excluded by `scripts/installer/local.mjs`. | |
| `COMM-002` | Texts from a registered US number | target | partial | `tests/api/reminders.test.mjs` › COMM-003 owner-approved email templates flow (registered connection starts disabled, separate explicit enable, source and wording consent, exact immutable footer, quiet hours, signed callback and replay, reschedule request, STOP and START, segment exclusion and export without credentials); › Erasure during an automatic provider attempt flow (text erasure); `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” (owner connection and purpose consent); `tests/portable.mjs` (secret exclusion and reconnection after restore) | Hosted-number orders and port requests with live status remain unbuilt; an existing-number connection records only the owner’s affirmation. Delay-specific confirmation/refusal and agent-move sends under AGENT-003 remain unproved. No live registration or provider receipt is claimed. RL-102 resolves the messaging-policy hold. |
| `COMM-005` | Two-way texting inbox | target | partial | `tests/api/reminders.test.mjs` › “The desk explicitly retains, assigns and answers a customer text on its job; STOP and role withdrawal close the send door” (owner opt-in retention, desk assignment, explicit same-customer job link, canned-text reply, provider outcome, customer and job conversation, Activity and business export, STOP and revoked-role refusal); `tests/browser/journey.spec.ts` › “The Owner runs the whole phone desk and Office repeats its permitted steps with exact role refusals at 390 and 1440” (Owner and Office text inbox, assignment and canned reply on a phone and desktop) | Technician arbitrary-text sending and delay-move confirmation threading on the visit remain unbuilt. Adopted explicit owner opt-in body retention, desk-only body audience and person-triggered replies require ct approval. The channel retains current-number visit consent and customer-zone quiet hours, including STOP; shared-number senders reveal no retained body and cannot be answered until resolved. |
| `COMM-007` | One conversation history per customer | target | partial | `src/glove/conversation.ts`, `src/ui/conversation.tsx`, `tests/api/conversation.test.mjs`, `src/glove/history.ts`, `src/glove/api.ts`, `tests/browser/journey.spec.ts` | Old evidence asserts existing customer/job streams, field-role restrictions, merging and logged-call/note Activity and export. An agent logging through its sponsor’s role and grant under the company’s selected policy is unasserted; the existing fixed Agent-role log refusal does not prove that authority and policy path. |
| `FIELD-001` | Offline day of jobs that survives a reload | target | done | `src/ui/offline-day.ts`, `public/glove-sw.js`, `src/ui/api.ts`, `src/ui/outbox.ts`, `src/ui/technician.tsx`, `tests/browser/journey.spec.ts` |  |
| `FIELD-002` | Custom forms and inspections | target | done | `src/glove/forms.ts`, `src/glove/commands/forms.ts`, `src/glove/commands/field.ts`, `src/ui/forms.tsx`, `tests/api/forms.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `FIELD-003` | Shareable service report | target | done | `src/glove/service-reports.ts`, `src/glove/commands/service-reports.ts`, `src/ui/service-report.tsx`, `tests/api/service-reports.test.mjs`, `tests/browser/service-reports.spec.ts` |  |
| `FIELD-005` | Native iOS and Android apps | target | missing |  | no native apps |
| `FIELD-007` | Refrigerant tracking for HVAC | target | done | `src/glove/commands/field.ts`, `src/glove/equipment.ts`, `src/ui/equipment.tsx`, `tests/api/equipment.test.mjs` |  |
| `COST-001` | Clock-ins and job timers | target | done | `src/glove/commands/time.ts`, `src/ui/clock.tsx`, `src/glove/dashboard.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs`, `src/glove/view.ts`, `src/ui/technician.tsx` |  |
| `COST-003` | Job expenses and receipts | target | done | `src/glove/commands/expenses.ts`, `src/glove/commands/invoices.ts`, `src/ui/expenses.tsx`, `tests/api/expenses.test.mjs` |  |
| `COST-004` | Estimate versus actual job costing | target | done | `tests/api/costing.test.mjs` › COST-004 a $1,850 job estimated at 41% margin comes in at 46% through time, materials, an expense and a subcontractor; `tests/browser/journey.spec.ts` › COST-004 uncosted estimate lines are named on the job at 1440 and 390 | |
| `COST-005` | Live margin warnings | target | done | `src/glove/margins.ts`, `src/glove/api.ts`, `src/glove/view.ts`, `src/ui/costing.tsx`, `src/ui/team.tsx`, `tests/api/margins.test.mjs` |  |
| `PAY-003` | Tap to Pay and card readers on site | target | missing |  | no payments or native app |
| `PAY-005` | Payment reminders that stop at zero | target | partial | `tests/api/reminders.test.mjs` › “PAY-005 due-date reminders stop after payment or dispute and aging exposes their actual state” (schedule, zero-balance stop, dispute stop, no Checkout links, aging state and Activity); `tests/browser/reminders.spec.ts` › “PAY-005 and QUOTE-004 show automatic email progress, provider acceptance and stopped states at 1440 and 390” (invoice and aging screens) | Customer payment-link generation/inclusion remains unbuilt under PAY-002 and RL-106; current reminder emails contain no payment link. SMS under COMM-002 and owner schedule/dispute controls in Settings and invoices remain. Live provider proof is unrun. RL-102 resolves shared consent and quiet-hours policy; RL-106 resolves customer-side payment authority. |
| `PAY-009` | Office charges a card by phone or on file | target | partial | `tests/api/payments.test.mjs` › “FIELD-008 saved test cards require customer authorization and desk authority, reserve once, and pay only on authenticated Stripe confirmation” (Office saved-card charge, verified customer and attachment, explicit business-charge authorization, autopay-only and role refusals, uncertain attempt blocking, authenticated Stripe settlement and decline, authorization withdrawal, Activity and business export); `tests/browser/journey.spec.ts` › “The Owner runs the whole phone desk and Office repeats its permitted steps with exact role refusals at 390 and 1440” (Owner and Office saved-card invoice controls with amount, brand and last four digits, pending and paid states, no horizontal scroll) | Keyed Stripe card entry and MOTO entitlement, saved-card deposits and other charge subjects, custom-role charges, saved bank authorization, optional tips and customer authentication or payment-link activation remain unbuilt. Existing test Checkout is owner-created; PAY-002/RL-106 requires the customer-scoped hosted door. RL-104 resolves saved-card authorization policy; no live activation is supplied. |
| `LEDGER-003` | Pantry sync | target | missing |  | no Pantry connection |
| `LEDGER-004` | First QuickBooks connection linked to existing records | target | partial | `tests/api/quickbooks.test.mjs` › “QuickBooks company discovery proposes imported customer, item and original invoice links without a write or a partial company review” proves a saved-shape 50-customer and 20-item Jobber move-in; 47 contact matches, one ambiguous pair and two unmatched customers; SKU before name for items; original invoice number and total despite a partially paid opening balance; provider-only sub-customers; pre-write name clashes; complete paginated reads and refusal of overlapping pages; owner-only access; same-company link retention and different-company confirmation refusal; and secret-free Activity and export references. › “QuickBooks reviewed migration creates only two explicitly approved unmatched customers, links old invoices and posts later money once with locked confirmed links” proves review-bound explicit approval, stale-review and name-clash refusal, creation replay, 48 old invoices linked without recreation, later payment against its existing invoice, one new invoice against the linked customer with frozen tax and discount cents, per-link confirmer identity, dependent-post link locks, definite-refusal repair and uncertain-creation reconciliation without another send. `tests/api/quickbooks.test.mjs` › “QuickBooks first-post review refuses unconfirmed links and duplicate invoices; provider facts survive owner withdrawal without allowing another send” proves the manual prerequisite: verified existing customer, item and invoice links, explicit confirmation before posting, duplicate-number refusal, and payment against the linked existing invoice. `tests/browser/quickbooks.spec.ts` proves the manual mapping and confirmation controls at 1440 and 390. `tests/browser/quickbooks.spec.ts` › “QuickBooks company review resolves ambiguous links, approves two creations and preserves moved invoices at 1440 and 390” proves the matched groups and rules, one-or-none ambiguity choice, per-customer creation approval, pre-write name-clash refusal, untouched provider-only records, refused premature confirmation, verified existing links, two creations exactly once, all 48 old invoices retained without posting, later payment replay and the next linked invoice in the built owner screens at both widths. `tests/api/quickbooks.test.mjs` › “QuickBooks property sub-customers receive separate invoices and one parent payment settles both without replay or unknown-send duplicates” proves a fresh different-company review, mandatory property remapping, new-company invoice links and confirmation without provider writes, same-company retention, no repost of either old invoice and one later payment against the new linked invoice with Activity and export references. | Carried source QuickBooks customer, item and invoice IDs and their ordered source-ID matching remain unbuilt: the held documented Jobber parent and product export shapes do not define those accounting fields. The 50-customer fixture proves 47 name-and-contact matches, not the required 10 carried-ID plus 37 contact-match split. Different-company reconciliation of previously posted payments and unresolved sends, moved-in refund posting and production connection and owner activation remain unproved. |
| `PLAN-002` | Maintenance agreements and memberships | target | done | `src/glove/agreements.ts`, `src/ui/agreements.tsx`, `tests/api/agreements.test.mjs`, `src/glove/history.ts`, `src/glove/api.ts`, `tests/browser/due-visits.spec.ts` |  |
| `PLAN-003` | Recurring billing and renewals | target | missing |  | no recurring billing |
| `STOCK-001` | Van and warehouse stock | target | done | `src/glove/stock.ts`, `src/glove/commands/stock.ts`, `src/glove/commands/field.ts`, `src/ui/stock.tsx`, `tests/api/stock.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `STOCK-002` | Purchase orders to suppliers | target | done | `src/glove/commands/purchasing.ts`, `src/glove/costing.ts`, `src/ui/purchasing.tsx`, `tests/api/purchasing.test.mjs`, `src/glove/api.ts`, `src/glove/storage.ts`, `src/glove/access.ts`, `src/glove/view.ts` |  |
| `TEAM-001` | Custom roles and permissions | target | done | `src/glove/access.ts`, `src/glove/commands/setup.ts`, `src/ui/custom-roles.tsx`, `tests/api/security.test.mjs`, `tests/api/purchasing.test.mjs`, `src/glove/commands/purchasing.ts`, `src/glove/api.ts`, `src/glove/storage.ts`, `src/glove/view.ts` |  |
| `REPORT-001` | Owner dashboard | target | done | `src/glove/dashboard.ts`, `src/glove/api.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs` |  |
| `REPORT-003` | Receivables aging | target | done | `src/glove/receivables.ts`, `tests/api/reports.test.mjs`, `tests/browser/receivables.spec.ts` |  |
| `MOVE-005` | Open balances, agreements and equipment carried over | target | partial | `tests/api/movein.test.mjs` › ServiceM8 opening balances retain payment custody, reject mismatches, and preserve native edits on undo; `tests/browser/movein.spec.ts` › MOVE-004 fieldpulse, MOVE-001 Jobber and MOVE-002 Housecall Pro (includes the ServiceM8 owner flow at 1440 and 390); `tests/api/movein.test.mjs` › MOVE-003 ServiceTitan saved exports and ongoing multi-location membership; MOVE-004 FieldPulse and Workiz saved exports  The Workiz, ServiceTitan and Housecall Pro saved-export flows additionally prove original invoice-number preservation, exact-total existing-invoice matching and confirmed linking, refusal of a same-number invoice with the wrong total, no provider writes on repeated opening-invoice sync, and original-number custody in the business export.| ServiceTitan carries dated opening balances (not reposted), one agreement per membership with per-event entitlements, and equipment with warranties; FieldPulse, Workiz, Jobber and Housecall Pro carry opening balances. ServiceM8 now reconciles completed sent invoices against active source payments into dated opening balances, retains rejected-job payment custody for customer export and erasure, and proves the owner journey with unconditional phone overflow checks. No kit carries documented source QuickBooks customer, item and invoice IDs for `LEDGER-004` linking, so the carried-ID no-duplicate assertion remains unproved. ServiceM8 agreements, equipment, original due-date mapping and balance-specific restore proof remain unproved, as do agreement and equipment coverage for the other kits beyond ServiceTitan. The owner’s Move in screen and `IMPORT.md` now provide the cutover guide: secure processor export request, the export-to-import freeze window and recollection of intervening card updates, old-system shutdown, final dated reconciliation, confirmed accounting links, and held renewals without a verified method. No processor transfer or saved-method activation is claimed.  Workiz serialId, ServiceTitan referenceNumber and Housecall Pro invoice_number remain separate from prefixed Glove display numbers, allowing existing QuickBooks invoices to be reviewed and linked without reposting. These document numbers are not QuickBooks record IDs. Source QuickBooks customer, item and invoice IDs still require a provider-documented export field and remain uncarried; carried-ID matching and its no-duplicate assertion remain unproved under LEDGER-004. The checked ServiceTitan catalog externalId identifies an original catalog item, not an accounting record, and must not be treated as a QuickBooks ID. Saved methods and authorizations remain with MOVE-006.|
| `MOVE-006` | Saved cards and autopay carried over | target | missing |  | no saved payment methods or autopay; the ServiceM8 kit carries no payment data (`src/glove/movein/servicem8.ts`) |
| `API-001` | Documented HTTP API | target | done | `API.md`, `tests/api/flows.test.mjs`, `tests/api/security.test.mjs`, `tests/api/subcontract.test.mjs`, `tests/api/push.test.mjs`, `tests/api/suggest.test.mjs` |  |
| `API-003` | Zapier and Crank apps | target | missing |  | no published apps |
| `API-005` | Workflow rules | target | done | `src/glove/rules.ts`, `src/glove/api.ts`, `src/ui/rules.tsx`, `tests/api/rules.test.mjs` |  |
| `DATA-003` | Hosted on the owner's own Cloudflare account | target | partial | `wrangler.jsonc`, `deploy.json` | Glove runs locally; no hosted deployment has been accepted |
| `DATA-004` | Free, open source and run on the owner's own computer | target | done | `LICENSE`, `tests/browser/run.mjs`, `tests/browser/journey.spec.ts` |  |
| `AGENT-001` | AI front office for calls and texts | push-further | missing |  | no telephony or answering agent |
| `AGENT-002` | Ready-to-dispatch check the day before | push-further | missing |  | no ready-to-dispatch agent: no next-day access confirmation by text (no SMS, `COMM-002`), no ready or not-ready marking with its reason, no ready board and no proposals to the dispatcher; the agent can read `STOCK-001`'s parts check and job purchase orders (`STOCK-002`), which are those clauses' doors, not this workflow |
| `AGENT-006` | Repeat-callback diagnosis | push-further | done | `src/glove/callbacks.ts`, `src/glove/commands/callbacks.ts`, `src/glove/provider.ts`, `src/ui/nameplates.tsx`, `tests/api/callbacks.test.mjs` |  |
| `AGENT-009` | Agent policy and scoped authority | push-further | partial | `src/glove/commands/grants.ts`, `src/glove/api.ts`, `src/ui/agent-grants.tsx`, `tests/api/grants.test.mjs`, `tests/api/security.test.mjs` | Old evidence asserts an explicit owner grant, its booking uses and $200 limit, revocation and Pause. A complete company policy with computed classes, its numbered decision record and selectable dispositions is unasserted; fixed grant defaults and role refusals do not prove that policy. |
| `SURFACE-001` | Service-work registry coverage | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-002` | The linked service-work resources | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-003` | Invoice and commitment classification | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-004` | Customer and provider disclosure classification | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-005` | Staff and protective-setting classification | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-006` | Irreversible and regulated-data classification | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-007` | Outside-resource and provider-step classification | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-008` | Live-service and reversible-work classification | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-009` | Service-provider cost facts | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-010` | Service-work event handoffs | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-011` | A stranger coordinator runs a seeded service week | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-012` | Existing front-office work uses company policy | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `SURFACE-013` | Coordinator documentation and operating overview | target | missing | | The service-work MCP mapping, computed-class fixtures and company-policy conformance journey are unbuilt. |
| `MONEY-001` | US dollars and sales tax | target | done | `src/glove/sales-tax.ts`, `src/glove/avatax.ts`, `src/glove/qbo-invoice.ts`, `tests/api/money.test.mjs`, `tests/portable.mjs`, `tests/browser/money.spec.ts` |  |
| `MONEY-004` | Frozen tax evidence and reporting | target | done | `src/glove/sales-tax.ts`, `src/glove/avatax.ts`, `src/glove/qbo-invoice.ts`, `tests/api/money.test.mjs`, `tests/portable.mjs`, `tests/browser/money.spec.ts` |  |
| `MONEY-005` | Address-based tax lookup | target | done | `src/glove/sales-tax.ts`, `src/glove/avatax.ts`, `src/glove/qbo-invoice.ts`, `tests/api/money.test.mjs`, `tests/portable.mjs`, `tests/browser/money.spec.ts` |  |
| `MONEY-003` | Price book with costs, markup and flat rates | target | done | `src/glove/pricebook.ts`, `src/glove/commands/pricebook.ts`, `src/ui/price-book.tsx`, `tests/api/pricebook.test.mjs`, `src/glove/commands/setup.ts`, `src/glove/api.ts`, `src/glove/access.ts`, `src/glove/view.ts` |  |
| `MONEY-006` | Price-book CSV and cost visibility | target | done | `src/glove/pricebook.ts`, `src/glove/commands/pricebook.ts`, `src/ui/price-book.tsx`, `tests/api/pricebook.test.mjs`, `src/glove/commands/setup.ts`, `src/glove/api.ts`, `src/glove/access.ts`, `src/glove/view.ts` |  |
| `CUST-004` | Tags, custom fields and segments | target | done | `src/glove/segments.ts`, `src/glove/commands/segments.ts`, `src/glove/commands/marketing.ts`, `src/glove/rules.ts`, `src/ui/custom-fields.tsx`, `tests/api/segments.test.mjs` |  |
| `CUST-006` | Segment audience handoff | target | done | `src/glove/segments.ts`, `src/glove/commands/segments.ts`, `src/glove/commands/marketing.ts`, `src/glove/rules.ts`, `src/ui/custom-fields.tsx`, `tests/api/segments.test.mjs` |  |
| `BOOK-001` | Request form on the business website | target | partial | `tests/api/pipeline.test.mjs` › “BOOK-001 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure” (matching, private originals, office notice, replay, text-only model draft and export/erase); › “BOOK-001 failed verification, consent, origins and ambiguous matching persist no request; owner disable fences an in-flight submission” (no writes on verification/consent/origin failure and commit fence); `tests/browser/customer-quotes.spec.ts` › “BOOK-001 the owner enables an embedded request form; two photos reach the matched customer and office at 1440/390, while failed Turnstile writes nothing” (owner setup, actual embed script, refused and received states, matched queue and two photos at 1440/390); `tests/api/pipeline.test.mjs` › “BOOK-001 only an unscoped owner enables provider-bound photo consent; model copies strip metadata and withdrawal excludes later calls” (off by default, unscoped-owner authority, separate provider-bound consent, training-terms affirmation, JPEG/PNG/WebP metadata removal, photo-only additions, switch/provider changes, unchanged private originals and later-call withdrawal); `tests/browser/customer-quotes.spec.ts` › “BOOK-001 owner enables provider-bound photo permission; the sender opts in, sanitized photos draft a quote and the owner records withdrawal at 1440/390” (owner configuration, unchecked named-provider consent, actual model draft and decodable copies, private office originals, withdrawal and disabled sharing at 1440/390) | Account-specific no-training qualification is an owner attestation, not provider-side verification; sender-requested withdrawal is owner-recorded under RL-101. Provider-held copies and training compliance are not independently verified. The public intake and photo-control workflow remains partial under its existing evidence; the ruling supplies policy authority, not additional implementation proof. |
| `BOOK-007` | Request custody and office handoff | target | partial | `tests/api/pipeline.test.mjs` › “BOOK-001 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure” (matching, private originals, office notice, replay, text-only model draft and export/erase); › “BOOK-001 failed verification, consent, origins and ambiguous matching persist no request; owner disable fences an in-flight submission” (no writes on verification/consent/origin failure and commit fence); `tests/browser/customer-quotes.spec.ts` › “BOOK-001 the owner enables an embedded request form; two photos reach the matched customer and office at 1440/390, while failed Turnstile writes nothing” (owner setup, actual embed script, refused and received states, matched queue and two photos at 1440/390); `tests/api/pipeline.test.mjs` › “BOOK-001 only an unscoped owner enables provider-bound photo consent; model copies strip metadata and withdrawal excludes later calls” (off by default, unscoped-owner authority, separate provider-bound consent, training-terms affirmation, JPEG/PNG/WebP metadata removal, photo-only additions, switch/provider changes, unchanged private originals and later-call withdrawal); `tests/browser/customer-quotes.spec.ts` › “BOOK-001 owner enables provider-bound photo permission; the sender opts in, sanitized photos draft a quote and the owner records withdrawal at 1440/390” (owner configuration, unchecked named-provider consent, actual model draft and decodable copies, private office originals, withdrawal and disabled sharing at 1440/390) | Account-specific no-training qualification is an owner attestation, not provider-side verification; sender-requested withdrawal is owner-recorded under RL-101. Provider-held copies and training compliance are not independently verified. The public intake and photo-control workflow remains partial under its existing evidence; the ruling supplies policy authority, not additional implementation proof. |
| `BOOK-008` | Sender photo permission | target | partial | `tests/api/pipeline.test.mjs` › “BOOK-001 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure” (matching, private originals, office notice, replay, text-only model draft and export/erase); › “BOOK-001 failed verification, consent, origins and ambiguous matching persist no request; owner disable fences an in-flight submission” (no writes on verification/consent/origin failure and commit fence); `tests/browser/customer-quotes.spec.ts` › “BOOK-001 the owner enables an embedded request form; two photos reach the matched customer and office at 1440/390, while failed Turnstile writes nothing” (owner setup, actual embed script, refused and received states, matched queue and two photos at 1440/390); `tests/api/pipeline.test.mjs` › “BOOK-001 only an unscoped owner enables provider-bound photo consent; model copies strip metadata and withdrawal excludes later calls” (off by default, unscoped-owner authority, separate provider-bound consent, training-terms affirmation, JPEG/PNG/WebP metadata removal, photo-only additions, switch/provider changes, unchanged private originals and later-call withdrawal); `tests/browser/customer-quotes.spec.ts` › “BOOK-001 owner enables provider-bound photo permission; the sender opts in, sanitized photos draft a quote and the owner records withdrawal at 1440/390” (owner configuration, unchecked named-provider consent, actual model draft and decodable copies, private office originals, withdrawal and disabled sharing at 1440/390) | Account-specific no-training qualification is an owner attestation, not provider-side verification; sender-requested withdrawal is owner-recorded under RL-101. Provider-held copies and training compliance are not independently verified. The public intake and photo-control workflow remains partial under its existing evidence; the ruling supplies policy authority, not additional implementation proof. |
| `BOOK-009` | Provider qualification and disclosure | target | partial | `tests/api/pipeline.test.mjs` › “BOOK-001 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure” (matching, private originals, office notice, replay, text-only model draft and export/erase); › “BOOK-001 failed verification, consent, origins and ambiguous matching persist no request; owner disable fences an in-flight submission” (no writes on verification/consent/origin failure and commit fence); `tests/browser/customer-quotes.spec.ts` › “BOOK-001 the owner enables an embedded request form; two photos reach the matched customer and office at 1440/390, while failed Turnstile writes nothing” (owner setup, actual embed script, refused and received states, matched queue and two photos at 1440/390); `tests/api/pipeline.test.mjs` › “BOOK-001 only an unscoped owner enables provider-bound photo consent; model copies strip metadata and withdrawal excludes later calls” (off by default, unscoped-owner authority, separate provider-bound consent, training-terms affirmation, JPEG/PNG/WebP metadata removal, photo-only additions, switch/provider changes, unchanged private originals and later-call withdrawal); `tests/browser/customer-quotes.spec.ts` › “BOOK-001 owner enables provider-bound photo permission; the sender opts in, sanitized photos draft a quote and the owner records withdrawal at 1440/390” (owner configuration, unchecked named-provider consent, actual model draft and decodable copies, private office originals, withdrawal and disabled sharing at 1440/390) | Account-specific no-training qualification is an owner attestation, not provider-side verification; sender-requested withdrawal is owner-recorded under RL-101. Provider-held copies and training compliance are not independently verified. The public intake and photo-control workflow remains partial under its existing evidence; the ruling supplies policy authority, not additional implementation proof. |
| `BOOK-010` | Model-photo authorization and withdrawal | target | partial | `tests/api/pipeline.test.mjs` › “BOOK-001 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure” (matching, private originals, office notice, replay, text-only model draft and export/erase); › “BOOK-001 failed verification, consent, origins and ambiguous matching persist no request; owner disable fences an in-flight submission” (no writes on verification/consent/origin failure and commit fence); `tests/browser/customer-quotes.spec.ts` › “BOOK-001 the owner enables an embedded request form; two photos reach the matched customer and office at 1440/390, while failed Turnstile writes nothing” (owner setup, actual embed script, refused and received states, matched queue and two photos at 1440/390); `tests/api/pipeline.test.mjs` › “BOOK-001 only an unscoped owner enables provider-bound photo consent; model copies strip metadata and withdrawal excludes later calls” (off by default, unscoped-owner authority, separate provider-bound consent, training-terms affirmation, JPEG/PNG/WebP metadata removal, photo-only additions, switch/provider changes, unchanged private originals and later-call withdrawal); `tests/browser/customer-quotes.spec.ts` › “BOOK-001 owner enables provider-bound photo permission; the sender opts in, sanitized photos draft a quote and the owner records withdrawal at 1440/390” (owner configuration, unchecked named-provider consent, actual model draft and decodable copies, private office originals, withdrawal and disabled sharing at 1440/390) | Account-specific no-training qualification is an owner attestation, not provider-side verification; sender-requested withdrawal is owner-recorded under RL-101. Provider-held copies and training compliance are not independently verified. The public intake and photo-control workflow remains partial under its existing evidence; the ruling supplies policy authority, not additional implementation proof. |
| `BOOK-002` | Online booking into real availability | target | partial | `tests/api/agreements.test.mjs`; `src/glove/booking-offers.ts`; `src/glove/public-booking.ts`; `src/ui/customer-booking.tsx`; generated-capacity assertions in `tests/api/agreements.test.mjs` and generated-window browser flow in `tests/browser/due-visits.spec.ts`. The identical CT evidence paragraph and its execution limits are preserved in the detailed BOOK-002 status above and in ACCEPTANCE.md. | Gap — Customer-selected service catalogue; travel-feasible arrival-window generation beyond the existing assignment ranking; per-service instant or approval and deposit settings; priority-member treatment; outbound confirmation under COMM-003; deposits and customer payments pending the PAY-002 customer-side ruling; policy disclosure and fee-specific PAY-008 saved-card consent; customer cancellation through confirmation or hub; timely deposit refunds; late-cancellation and no-show fee proposals; authorized office charges; and reasoned waivers remain unproved. Service-path exact-expiry, concurrent-use and authority-change-at-commit execution, erasure and archive and restore credential invalidation, abuse controls, and enumeration and timing boundaries remain unverified by this review. Complete customer-catalogue browser acceptance, exact-SHA Verify and guarded landing remain pending. The generated service-window flow has local browser proof at 1440 and 390 in the named journey. CT has approved only the preparatory bearer defaults with riders; this removes the pending BOOK-002 policy decision, changes no implementation status and proves no security certification, legal compliance or provider delivery. |
| `BOOK-011` | Single-service booking offers | target | partial | `tests/api/agreements.test.mjs`; `src/glove/booking-offers.ts`; `src/glove/public-booking.ts`; `src/ui/customer-booking.tsx`; generated-capacity assertions in `tests/api/agreements.test.mjs` and generated-window browser flow in `tests/browser/due-visits.spec.ts`. The identical CT evidence paragraph and its execution limits are preserved in the detailed BOOK-002 status above and in ACCEPTANCE.md. | Gap — Customer-selected service catalogue; travel-feasible arrival-window generation beyond the existing assignment ranking; per-service instant or approval and deposit settings; priority-member treatment; outbound confirmation under COMM-003; deposits and customer payments pending the PAY-002 customer-side ruling; policy disclosure and fee-specific PAY-008 saved-card consent; customer cancellation through confirmation or hub; timely deposit refunds; late-cancellation and no-show fee proposals; authorized office charges; and reasoned waivers remain unproved. Service-path exact-expiry, concurrent-use and authority-change-at-commit execution, erasure and archive and restore credential invalidation, abuse controls, and enumeration and timing boundaries remain unverified by this review. Complete customer-catalogue browser acceptance, exact-SHA Verify and guarded landing remain pending. The generated service-window flow has local browser proof at 1440 and 390 in the named journey. CT has approved only the preparatory bearer defaults with riders; this removes the pending BOOK-002 policy decision, changes no implementation status and proves no security certification, legal compliance or provider delivery. |
| `BOOK-012` | Current capacity and window generation | target | partial | `tests/api/agreements.test.mjs`; `src/glove/booking-offers.ts`; `src/glove/public-booking.ts`; `src/ui/customer-booking.tsx`; generated-capacity assertions in `tests/api/agreements.test.mjs` and generated-window browser flow in `tests/browser/due-visits.spec.ts`. The identical CT evidence paragraph and its execution limits are preserved in the detailed BOOK-002 status above and in ACCEPTANCE.md. | Gap — Customer-selected service catalogue; travel-feasible arrival-window generation beyond the existing assignment ranking; per-service instant or approval and deposit settings; priority-member treatment; outbound confirmation under COMM-003; deposits and customer payments pending the PAY-002 customer-side ruling; policy disclosure and fee-specific PAY-008 saved-card consent; customer cancellation through confirmation or hub; timely deposit refunds; late-cancellation and no-show fee proposals; authorized office charges; and reasoned waivers remain unproved. Service-path exact-expiry, concurrent-use and authority-change-at-commit execution, erasure and archive and restore credential invalidation, abuse controls, and enumeration and timing boundaries remain unverified by this review. Complete customer-catalogue browser acceptance, exact-SHA Verify and guarded landing remain pending. The generated service-window flow has local browser proof at 1440 and 390 in the named journey. CT has approved only the preparatory bearer defaults with riders; this removes the pending BOOK-002 policy decision, changes no implementation status and proves no security certification, legal compliance or provider delivery. |
| `BOOK-013` | Booking-offer proof boundary | target | partial | `tests/api/agreements.test.mjs`; `src/glove/booking-offers.ts`; `src/glove/public-booking.ts`; `src/ui/customer-booking.tsx`; generated-capacity assertions in `tests/api/agreements.test.mjs` and generated-window browser flow in `tests/browser/due-visits.spec.ts`. The identical CT evidence paragraph and its execution limits are preserved in the detailed BOOK-002 status above and in ACCEPTANCE.md. | Gap — Customer-selected service catalogue; travel-feasible arrival-window generation beyond the existing assignment ranking; per-service instant or approval and deposit settings; priority-member treatment; outbound confirmation under COMM-003; deposits and customer payments pending the PAY-002 customer-side ruling; policy disclosure and fee-specific PAY-008 saved-card consent; customer cancellation through confirmation or hub; timely deposit refunds; late-cancellation and no-show fee proposals; authorized office charges; and reasoned waivers remain unproved. Service-path exact-expiry, concurrent-use and authority-change-at-commit execution, erasure and archive and restore credential invalidation, abuse controls, and enumeration and timing boundaries remain unverified by this review. Complete customer-catalogue browser acceptance, exact-SHA Verify and guarded landing remain pending. The generated service-window flow has local browser proof at 1440 and 390 in the named journey. CT has approved only the preparatory bearer defaults with riders; this removes the pending BOOK-002 policy decision, changes no implementation status and proves no security certification, legal compliance or provider delivery. |
| `BOOK-004` | Leads from Google, Angi, Thumbtack and Yelp | target | partial | `tests/api/pipeline.test.mjs` › DATA-002 / BOOK-004 / API-005 lead flow (sources, matching, costs, queued tasks, Reserve booking-record intake, refusals and retries); `tests/browser/journey.spec.ts` › BOOK-004 Reserve with Google request intake and external-send attestation at 1440 and 390 | Google, Angi, Thumbtack and Reserve replies through COMM-002 or their provider message channels within the response window remain unbuilt. Yelp's own response-time duties remain a Gap. Yelp has an explicitly approved masked-email acknowledgment through the existing mail sender, with provider acceptance distinguished from receipt in the Yelp conversation; neither Yelp receipt nor deadline compliance is claimed. ct approved this slice on 24 October 2026 at 05:58Z: only an unscoped owner acting as a person explicitly approves each acknowledgment, using its unexpired source destination, with no automatic send or retry. Reserve with Google still has documented Booking-record intake only; its booking server, feeds, notifications, updates and cancellations remain unbuilt. Provider eligibility gates live activation only. |
| `BOOK-014` | Lead-source credential custody | target | partial | `tests/api/pipeline.test.mjs` › DATA-002 / BOOK-004 / API-005 lead flow (sources, matching, costs, queued tasks, Reserve booking-record intake, refusals and retries); `tests/browser/journey.spec.ts` › BOOK-004 Reserve with Google request intake and external-send attestation at 1440 and 390 | Google, Angi, Thumbtack and Reserve replies through COMM-002 or their provider message channels within the response window remain unbuilt. Yelp's own response-time duties remain a Gap. Yelp has an explicitly approved masked-email acknowledgment through the existing mail sender, with provider acceptance distinguished from receipt in the Yelp conversation; neither Yelp receipt nor deadline compliance is claimed. ct approved this slice on 24 October 2026 at 05:58Z: only an unscoped owner acting as a person explicitly approves each acknowledgment, using its unexpired source destination, with no automatic send or retry. Reserve with Google still has documented Booking-record intake only; its booking server, feeds, notifications, updates and cancellations remain unbuilt. Provider eligibility gates live activation only. |
| `BOOK-015` | Lead costs and acknowledgments | target | partial | `tests/api/pipeline.test.mjs` › DATA-002 / BOOK-004 / API-005 lead flow (sources, matching, costs, queued tasks, Reserve booking-record intake, refusals and retries); `tests/browser/journey.spec.ts` › BOOK-004 Reserve with Google request intake and external-send attestation at 1440 and 390 | Google, Angi, Thumbtack and Reserve replies through COMM-002 or their provider message channels within the response window remain unbuilt. Yelp's own response-time duties remain a Gap. Yelp has an explicitly approved masked-email acknowledgment through the existing mail sender, with provider acceptance distinguished from receipt in the Yelp conversation; neither Yelp receipt nor deadline compliance is claimed. ct approved this slice on 24 October 2026 at 05:58Z: only an unscoped owner acting as a person explicitly approves each acknowledgment, using its unexpired source destination, with no automatic send or retry. Reserve with Google still has documented Booking-record intake only; its booking server, feeds, notifications, updates and cancellations remain unbuilt. Provider eligibility gates live activation only. |
| `BOOK-016` | Explicit lead acknowledgment execution | target | partial | `tests/api/pipeline.test.mjs` › DATA-002 / BOOK-004 / API-005 lead flow (sources, matching, costs, queued tasks, Reserve booking-record intake, refusals and retries); `tests/browser/journey.spec.ts` › BOOK-004 Reserve with Google request intake and external-send attestation at 1440 and 390 | Google, Angi, Thumbtack and Reserve replies through COMM-002 or their provider message channels within the response window remain unbuilt. Yelp's own response-time duties remain a Gap. Yelp has an explicitly approved masked-email acknowledgment through the existing mail sender, with provider acceptance distinguished from receipt in the Yelp conversation; neither Yelp receipt nor deadline compliance is claimed. ct approved this slice on 24 October 2026 at 05:58Z: only an unscoped owner acting as a person explicitly approves each acknowledgment, using its unexpired source destination, with no automatic send or retry. Reserve with Google still has documented Booking-record intake only; its booking server, feeds, notifications, updates and cancellations remain unbuilt. Provider eligibility gates live activation only. |
| `BOOK-017` | Reserve with Google request intake | target | partial | `tests/api/pipeline.test.mjs` › DATA-002 / BOOK-004 / API-005 lead flow (sources, matching, costs, queued tasks, Reserve booking-record intake, refusals and retries); `tests/browser/journey.spec.ts` › BOOK-004 Reserve with Google request intake and external-send attestation at 1440 and 390 | Google, Angi, Thumbtack and Reserve replies through COMM-002 or their provider message channels within the response window remain unbuilt. Yelp's own response-time duties remain a Gap. Yelp has an explicitly approved masked-email acknowledgment through the existing mail sender, with provider acceptance distinguished from receipt in the Yelp conversation; neither Yelp receipt nor deadline compliance is claimed. ct approved this slice on 24 October 2026 at 05:58Z: only an unscoped owner acting as a person explicitly approves each acknowledgment, using its unexpired source destination, with no automatic send or retry. Reserve with Google still has documented Booking-record intake only; its booking server, feeds, notifications, updates and cancellations remain unbuilt. Provider eligibility gates live activation only. |
| `QUOTE-002` | Online approval with e-signature | target | done | `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (owner disclosure door, line descriptions, chosen option/add-on, change request, revised drawn approval, exact job, typed keyboard/reflow/contrast, signature record, downloaded signed artifact, named erasure preview and peer withdrawal end states at 1440/390); › “QUOTE-002 customer revision links, change requests, superseded documents, declines and expired updates at 1440 and 390; signing stays gated” (factory gate, stale link and 30-day/day-31 refusal/update queue); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (versioned consent, signer/capacity/authentication/time/IP/browser and document hashes, immutable embedded-image copy, exact job, confirmation provider outcomes and erasure; named shared-original withdrawal retains the peer’s accepted quote and unrelated original); › “QUOTE-002 concrete disclosure changes and disablement close stale signatures; typed signing competes atomically with a staff answer and never emails twice” (stale consent, typed signature, first-wins and replay); `tests/portable.mjs` › Glove portability (actual rer export/import retains signed HTML bytes and all evidence; old bearer refused, fresh read-only link, erasure and later-backup fence) |  |
| `QUOTE-008` | First quote decision freezes the revision | target | done | `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (owner disclosure door, line descriptions, chosen option/add-on, change request, revised drawn approval, exact job, typed keyboard/reflow/contrast, signature record, downloaded signed artifact, named erasure preview and peer withdrawal end states at 1440/390); › “QUOTE-002 customer revision links, change requests, superseded documents, declines and expired updates at 1440 and 390; signing stays gated” (factory gate, stale link and 30-day/day-31 refusal/update queue); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (versioned consent, signer/capacity/authentication/time/IP/browser and document hashes, immutable embedded-image copy, exact job, confirmation provider outcomes and erasure; named shared-original withdrawal retains the peer’s accepted quote and unrelated original); › “QUOTE-002 concrete disclosure changes and disablement close stale signatures; typed signing competes atomically with a staff answer and never emails twice” (stale consent, typed signature, first-wins and replay); `tests/portable.mjs` › Glove portability (actual rer export/import retains signed HTML bytes and all evidence; old bearer refused, fresh read-only link, erasure and later-backup fence) |  |
| `QUOTE-009` | Quote-link custody and expiry | target | done | `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (owner disclosure door, line descriptions, chosen option/add-on, change request, revised drawn approval, exact job, typed keyboard/reflow/contrast, signature record, downloaded signed artifact, named erasure preview and peer withdrawal end states at 1440/390); › “QUOTE-002 customer revision links, change requests, superseded documents, declines and expired updates at 1440 and 390; signing stays gated” (factory gate, stale link and 30-day/day-31 refusal/update queue); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (versioned consent, signer/capacity/authentication/time/IP/browser and document hashes, immutable embedded-image copy, exact job, confirmation provider outcomes and erasure; named shared-original withdrawal retains the peer’s accepted quote and unrelated original); › “QUOTE-002 concrete disclosure changes and disablement close stale signatures; typed signing competes atomically with a staff answer and never emails twice” (stale consent, typed signature, first-wins and replay); `tests/portable.mjs` › Glove portability (actual rer export/import retains signed HTML bytes and all evidence; old bearer refused, fresh read-only link, erasure and later-backup fence) |  |
| `QUOTE-010` | Signing consent and frozen customer copy | target | done | `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (owner disclosure door, line descriptions, chosen option/add-on, change request, revised drawn approval, exact job, typed keyboard/reflow/contrast, signature record, downloaded signed artifact, named erasure preview and peer withdrawal end states at 1440/390); › “QUOTE-002 customer revision links, change requests, superseded documents, declines and expired updates at 1440 and 390; signing stays gated” (factory gate, stale link and 30-day/day-31 refusal/update queue); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (versioned consent, signer/capacity/authentication/time/IP/browser and document hashes, immutable embedded-image copy, exact job, confirmation provider outcomes and erasure; named shared-original withdrawal retains the peer’s accepted quote and unrelated original); › “QUOTE-002 concrete disclosure changes and disablement close stale signatures; typed signing competes atomically with a staff answer and never emails twice” (stale consent, typed signature, first-wins and replay); `tests/portable.mjs` › Glove portability (actual rer export/import retains signed HTML bytes and all evidence; old bearer refused, fresh read-only link, erasure and later-backup fence) |  |
| `QUOTE-011` | Immutable signed customer copy | target | done | `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (owner disclosure door, line descriptions, chosen option/add-on, change request, revised drawn approval, exact job, typed keyboard/reflow/contrast, signature record, downloaded signed artifact, named erasure preview and peer withdrawal end states at 1440/390); › “QUOTE-002 customer revision links, change requests, superseded documents, declines and expired updates at 1440 and 390; signing stays gated” (factory gate, stale link and 30-day/day-31 refusal/update queue); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (versioned consent, signer/capacity/authentication/time/IP/browser and document hashes, immutable embedded-image copy, exact job, confirmation provider outcomes and erasure; named shared-original withdrawal retains the peer’s accepted quote and unrelated original); › “QUOTE-002 concrete disclosure changes and disablement close stale signatures; typed signing competes atomically with a staff answer and never emails twice” (stale consent, typed signature, first-wins and replay); `tests/portable.mjs` › Glove portability (actual rer export/import retains signed HTML bytes and all evidence; old bearer refused, fresh read-only link, erasure and later-backup fence) |  |
| `QUOTE-012` | Quote-link issue and response records | target | done | `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (owner disclosure door, line descriptions, chosen option/add-on, change request, revised drawn approval, exact job, typed keyboard/reflow/contrast, signature record, downloaded signed artifact, named erasure preview and peer withdrawal end states at 1440/390); › “QUOTE-002 customer revision links, change requests, superseded documents, declines and expired updates at 1440 and 390; signing stays gated” (factory gate, stale link and 30-day/day-31 refusal/update queue); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (versioned consent, signer/capacity/authentication/time/IP/browser and document hashes, immutable embedded-image copy, exact job, confirmation provider outcomes and erasure; named shared-original withdrawal retains the peer’s accepted quote and unrelated original); › “QUOTE-002 concrete disclosure changes and disablement close stale signatures; typed signing competes atomically with a staff answer and never emails twice” (stale consent, typed signature, first-wins and replay); `tests/portable.mjs` › Glove portability (actual rer export/import retains signed HTML bytes and all evidence; old bearer refused, fresh read-only link, erasure and later-backup fence) |  |
| `QUOTE-013` | Signed-copy confirmation and custody | target | done | `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (owner disclosure door, line descriptions, chosen option/add-on, change request, revised drawn approval, exact job, typed keyboard/reflow/contrast, signature record, downloaded signed artifact, named erasure preview and peer withdrawal end states at 1440/390); › “QUOTE-002 customer revision links, change requests, superseded documents, declines and expired updates at 1440 and 390; signing stays gated” (factory gate, stale link and 30-day/day-31 refusal/update queue); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (versioned consent, signer/capacity/authentication/time/IP/browser and document hashes, immutable embedded-image copy, exact job, confirmation provider outcomes and erasure; named shared-original withdrawal retains the peer’s accepted quote and unrelated original); › “QUOTE-002 concrete disclosure changes and disablement close stale signatures; typed signing competes atomically with a staff answer and never emails twice” (stale consent, typed signature, first-wins and replay); `tests/portable.mjs` › Glove portability (actual rer export/import retains signed HTML bytes and all evidence; old bearer refused, fresh read-only link, erasure and later-backup fence) |  |
| `QUOTE-003` | Deposits on approval | target | partial | `tests/api/customer-quotes.test.mjs` › QUOTE-003 frozen signed deposit (owner-only configuration/Checkout, exact signed job, $500 held and final $1,350 due, refund); same file › QUOTE-003 an original-method refund made while a deposit is job-held (prior refund follows final allocation once) | Customer-initiated deposits on online approval and the customer-scoped Checkout door under PAY-002/RL-106 remain unbuilt; the existing test slice is owner-created and infers no automatic charge. |
| `QUOTE-014` | Customer deposit payment boundary | target | partial | `tests/api/customer-quotes.test.mjs` › QUOTE-003 frozen signed deposit (owner-only configuration/Checkout, exact signed job, $500 held and final $1,350 due, refund); same file › QUOTE-003 an original-method refund made while a deposit is job-held (prior refund follows final allocation once) | Customer-initiated deposits on online approval and the customer-scoped Checkout door under PAY-002/RL-106 remain unbuilt; the existing test slice is owner-created and infers no automatic charge. |
| `QUOTE-005` | Branded quote, invoice and report documents | target | done | `tests/browser/documents.spec.ts` › QUOTE-005 branded templates, quote HTML and PDF, invoice, immutable report and agreement at 1440 and 390 (every document/identity/terms/photo/description/report-reading point); `tests/api/documents.test.mjs` › customer quote snapshots and desk projections (immutability, exact originals, authorization and erasure) |  |
| `QUOTE-015` | Document presentation and print | target | done | `tests/browser/documents.spec.ts` › QUOTE-005 branded templates, quote HTML and PDF, invoice, immutable report and agreement at 1440 and 390 (every document/identity/terms/photo/description/report-reading point); `tests/api/documents.test.mjs` › customer quote snapshots and desk projections (immutability, exact originals, authorization and erasure) |  |
| `QUOTE-006` | Field quotes and change orders, offline | target | partial | `tests/api/options.test.mjs` › “QUOTE-006 owner-bound field pricing drafts two options from an assigned assessment, retains evidence once, and withdraws access immediately” (online draft foundation, options, price bounds, assessment carry-over, close-rate JSON and CSV, seller credit, next-request WITHDRAWAL, signed selected-option application once to the source job and ordinary invoice draft); `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (signed field option, owner-applied job lines and ordinary invoice draft at 1440 and 390) | phone controls and offline pricing custody, offline two-option signing with QUOTE-002 consent and document evidence, change-order application for existing invoices, recurring billing, discounts, deposits or differing tax snapshots, and full phone browser proof remain. Online grant approved by ct 24 October 2026 14:50Z; off by default, current sign-in and assignment, selling prices only, desk approval for every draft, next-request WITHDRAWAL asserted. Owner-only application approved by ct 24 October 2026 16:35Z; scoped-owner refusal and no amendment before the explicit owner act are asserted |
| `QUOTE-016` | Field-quote custody and selling figures | target | partial | `tests/api/options.test.mjs` › “QUOTE-006 owner-bound field pricing drafts two options from an assigned assessment, retains evidence once, and withdraws access immediately” (online draft foundation, options, price bounds, assessment carry-over, close-rate JSON and CSV, seller credit, next-request WITHDRAWAL, signed selected-option application once to the source job and ordinary invoice draft); `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (signed field option, owner-applied job lines and ordinary invoice draft at 1440 and 390) | phone controls and offline pricing custody, offline two-option signing with QUOTE-002 consent and document evidence, change-order application for existing invoices, recurring billing, discounts, deposits or differing tax snapshots, and full phone browser proof remain. Online grant approved by ct 24 October 2026 14:50Z; off by default, current sign-in and assignment, selling prices only, desk approval for every draft, next-request WITHDRAWAL asserted. Owner-only application approved by ct 24 October 2026 16:35Z; scoped-owner refusal and no amendment before the explicit owner act are asserted |
| `QUOTE-017` | Apply the signed change order | target | partial | `tests/api/options.test.mjs` › “QUOTE-006 owner-bound field pricing drafts two options from an assigned assessment, retains evidence once, and withdraws access immediately” (online draft foundation, options, price bounds, assessment carry-over, close-rate JSON and CSV, seller credit, next-request WITHDRAWAL, signed selected-option application once to the source job and ordinary invoice draft); `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (signed field option, owner-applied job lines and ordinary invoice draft at 1440 and 390) | phone controls and offline pricing custody, offline two-option signing with QUOTE-002 consent and document evidence, change-order application for existing invoices, recurring billing, discounts, deposits or differing tax snapshots, and full phone browser proof remain. Online grant approved by ct 24 October 2026 14:50Z; off by default, current sign-in and assignment, selling prices only, desk approval for every draft, next-request WITHDRAWAL asserted. Owner-only application approved by ct 24 October 2026 16:35Z; scoped-owner refusal and no amendment before the explicit owner act are asserted |
| `QUOTE-018` | Change-order reconciliation and authority | target | partial | `tests/api/options.test.mjs` › “QUOTE-006 owner-bound field pricing drafts two options from an assigned assessment, retains evidence once, and withdraws access immediately” (online draft foundation, options, price bounds, assessment carry-over, close-rate JSON and CSV, seller credit, next-request WITHDRAWAL, signed selected-option application once to the source job and ordinary invoice draft); `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (signed field option, owner-applied job lines and ordinary invoice draft at 1440 and 390) | phone controls and offline pricing custody, offline two-option signing with QUOTE-002 consent and document evidence, change-order application for existing invoices, recurring billing, discounts, deposits or differing tax snapshots, and full phone browser proof remain. Online grant approved by ct 24 October 2026 14:50Z; off by default, current sign-in and assignment, selling prices only, desk approval for every draft, next-request WITHDRAWAL asserted. Owner-only application approved by ct 24 October 2026 16:35Z; scoped-owner refusal and no amendment before the explicit owner act are asserted |
| `QUOTE-007` | Discounts on quotes and invoices | target | done | `src/glove/sales-tax.ts`, `src/glove/discounts.ts`, `tests/api/discounts.test.mjs`, `tests/browser/discounts.spec.ts` |  |
| `QUOTE-019` | Role discount limits | target | done | `src/glove/sales-tax.ts`, `src/glove/discounts.ts`, `tests/api/discounts.test.mjs`, `tests/browser/discounts.spec.ts` |  |
| `DISP-002` | Map board and travel time | target | done | `src/glove/maps.ts`, `src/glove/commands/maps.ts`, `src/ui/dispatch-map.tsx`, `tests/api/eligibility.test.mjs`, `tests/browser/dispatch-map.spec.ts` |  |
| `DISP-010` | Travel-aware automatic assignment | target | done | `src/glove/maps.ts`, `src/glove/commands/maps.ts`, `src/ui/dispatch-map.tsx`, `tests/api/eligibility.test.mjs`, `tests/browser/dispatch-map.spec.ts` |  |
| `DISP-003` | Route optimization | target | done | `tests/api/routing.test.mjs` › “DISP-003: 12 visits for 3 technicians improve through a bounded background proposal, respect windows and skills, and move only on dispatcher acceptance” proves the 12/3 day, lower driving time, windows/skills/areas, unchanged visits before explicit acceptance and exactly-once moves; › “DISP-003: stale eligibility, discard and a routing-provider refusal never change appointments” proves stale/provider refusal and discard; `tests/browser/routing.spec.ts` › “DISP-003 the dispatcher compares driving saved and explicitly accepts the route, at 1440 and 390” proves the proposal/comparison and accepted board at both widths. |  |
| `DISP-011` | Apply or discard a route proposal | target | done | `tests/api/routing.test.mjs` › “DISP-003: 12 visits for 3 technicians improve through a bounded background proposal, respect windows and skills, and move only on dispatcher acceptance” proves the 12/3 day, lower driving time, windows/skills/areas, unchanged visits before explicit acceptance and exactly-once moves; › “DISP-003: stale eligibility, discard and a routing-provider refusal never change appointments” proves stale/provider refusal and discard; `tests/browser/routing.spec.ts` › “DISP-003 the dispatcher compares driving saved and explicitly accepts the route, at 1440 and 390” proves the proposal/comparison and accepted board at both widths. |  |
| `DISP-005` | Live technician location and ETA | target | done | `tests/api/eligibility.test.mjs` › “DATA-002 / DISP-002 map and location flow” (consent off by default and refused capture; consented capture refused without a shift or assigned timer; two uninterrupted phone fixes leave exactly one stored row with the second coordinates and the owner's map reads it; owner positions and ETAs with Office, Dispatcher and agent views denied and storage unchanged; explicit owner-only Samsara request and audited outcome with no polling on board reads; simultaneous phone and fleet sources; stale and unavailable states; AGENT-003 delay reasons and same-time options; clock-out, withdrawal, reassignment and revoked-session stops; no coordinates or keys in durable records or business export); `tests/portable.mjs` › installation export and restore journey (populated phone position and fleet credential excluded from the archive; restore has no position and requires fleet reconnection); `tests/browser/dispatch-map.spec.ts` › “DISP-002 the map board shows the day's pins and drive times, the owner draws a zone, and the technician's phone hands directions to their navigation app, at 1440 and 390” (consent, fresh capture, both sources and ETAs, delay reasons and options, keyboard tooltips, phone Clock out and withdrawal at both widths) | |
| `DISP-012` | Position disclosure and delay estimate | target | done | `tests/api/eligibility.test.mjs` › “DATA-002 / DISP-002 map and location flow” (consent off by default and refused capture; consented capture refused without a shift or assigned timer; two uninterrupted phone fixes leave exactly one stored row with the second coordinates and the owner's map reads it; owner positions and ETAs with Office, Dispatcher and agent views denied and storage unchanged; explicit owner-only Samsara request and audited outcome with no polling on board reads; simultaneous phone and fleet sources; stale and unavailable states; AGENT-003 delay reasons and same-time options; clock-out, withdrawal, reassignment and revoked-session stops; no coordinates or keys in durable records or business export); `tests/portable.mjs` › installation export and restore journey (populated phone position and fleet credential excluded from the archive; restore has no position and requires fleet reconnection); `tests/browser/dispatch-map.spec.ts` › “DISP-002 the map board shows the day's pins and drive times, the owner draws a zone, and the technician's phone hands directions to their navigation app, at 1440 and 390” (consent, fresh capture, both sources and ETAs, delay reasons and options, keyboard tooltips, phone Clock out and withdrawal at both widths) | |
| `DISP-007` | Multi-day jobs, crews and subcontractors | target | done | `src/glove/commands/dispatch.ts`, `src/glove/subcontract.ts`, `src/glove/view.ts`, `src/ui/dispatch.tsx`, `src/ui/subcontract.tsx`, `tests/api/subcontract.test.mjs`, `tests/browser/journey.spec.ts`, `src/glove/commands/field.ts` |  |
| `DISP-013` | Subcontractor field access | target | done | `src/glove/commands/dispatch.ts`, `src/glove/subcontract.ts`, `src/glove/view.ts`, `src/ui/dispatch.tsx`, `src/ui/subcontract.tsx`, `tests/api/subcontract.test.mjs`, `tests/browser/journey.spec.ts`, `src/glove/commands/field.ts` |  |
| `DISP-014` | Subcontractor agreed amounts and filing totals | target | done | `src/glove/commands/dispatch.ts`, `src/glove/subcontract.ts`, `src/glove/view.ts`, `src/ui/dispatch.tsx`, `src/ui/subcontract.tsx`, `tests/api/subcontract.test.mjs`, `tests/browser/journey.spec.ts`, `src/glove/commands/field.ts` |  |
| `DISP-008` | Google Calendar and Outlook sync | target | done | `tests/api/eligibility.test.mjs` › “DATA-002 / DISP-004: busy time from a technician's calendar refuses an overlapping booking; the secret calendar address stays with the owner and that technician” (Google and Microsoft create, update, delete and busy refusal; owner detail limits, replay, credential exclusion and provider read failures); `tests/browser/dispatch-map.spec.ts` › “DISP-002 the map board shows the day's pins and drive times, the owner draws a zone, and the technician's phone hands directions to their navigation app, at 1440 and 390” (Google and Microsoft connection, customer detail consent, busy read and disconnect at 1440 and 390); `src/glove/calendar-sync.ts`, `src/ui/calendar-sync.tsx` | |
| `DISP-015` | Calendar change delivery and uncertainty | target | done | `tests/api/eligibility.test.mjs` › “DATA-002 / DISP-004: busy time from a technician's calendar refuses an overlapping booking; the secret calendar address stays with the owner and that technician” (Google and Microsoft create, update, delete and busy refusal; owner detail limits, replay, credential exclusion and provider read failures); `tests/browser/dispatch-map.spec.ts` › “DISP-002 the map board shows the day's pins and drive times, the owner draws a zone, and the technician's phone hands directions to their navigation app, at 1440 and 390” (Google and Microsoft connection, customer detail consent, busy read and disconnect at 1440 and 390); `src/glove/calendar-sync.ts`, `src/ui/calendar-sync.tsx` | |
| `COMM-001` | Customer email with delivery status | target | done | `tests/api/email.test.mjs` › “COMM-001 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events” (SendGrid, Resend, Postmark and Amazon SES routing and outcomes; Postmark and SES document delivery and bounce replay, exact job facts, customer warning and recovery, conversation order and authors, refusal, rate limiting, malformed answers, uncertainty, explicit resend and Activity and export with each provider reference); › “COMM-001 the owner's morning brief email is sent once per business-local date and records the provider outcome” (Postmark and SES concurrent separate-isolate date claims, complete brief including overdue invoices, delivered and bounced facts, refusal, rate limiting and uncertainty without same-date retry, next-date recovery and provider references); › “COMM-001 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic” (one 20-request allowance across two Worker isolates, 21st rejection, independent IP, minute reset, verified bypass and generic no-write rejection); › “COMM-001 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes”; › “COMM-001 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs” (approved provider callback boundaries); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (SendGrid, Postmark and SES immutable confirmation copies and delivered outcomes); `tests/api/agreements.test.mjs` › PLAN-004 forty due entitlements flow (eight working emailed offers through each provider); `tests/api/payments.test.mjs` › PAY-004 three installments flow (payment and refund receipts through each provider); `tests/api/reminders.test.mjs` › COMM-003 owner-approved email templates flow (each provider's existing notices and report links under the retained authority and consent limits); `tests/browser/email.spec.ts` › “COMM-001 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390” (settings, document outcomes, both providers' failure and next-step screens, explicit recovery, unknown morning outcome and next-date delivered state); `tests/portable.mjs` › Glove portability (real archive and restore, callback password and hash exclusion, old credential refused and reconnection required). |  |
| `COMM-010` | Message outcomes and customer warnings | target | done | `tests/api/email.test.mjs` › “COMM-001 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events” (SendGrid, Resend, Postmark and Amazon SES routing and outcomes; Postmark and SES document delivery and bounce replay, exact job facts, customer warning and recovery, conversation order and authors, refusal, rate limiting, malformed answers, uncertainty, explicit resend and Activity and export with each provider reference); › “COMM-001 the owner's morning brief email is sent once per business-local date and records the provider outcome” (Postmark and SES concurrent separate-isolate date claims, complete brief including overdue invoices, delivered and bounced facts, refusal, rate limiting and uncertainty without same-date retry, next-date recovery and provider references); › “COMM-001 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic” (one 20-request allowance across two Worker isolates, 21st rejection, independent IP, minute reset, verified bypass and generic no-write rejection); › “COMM-001 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes”; › “COMM-001 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs” (approved provider callback boundaries); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (SendGrid, Postmark and SES immutable confirmation copies and delivered outcomes); `tests/api/agreements.test.mjs` › PLAN-004 forty due entitlements flow (eight working emailed offers through each provider); `tests/api/payments.test.mjs` › PAY-004 three installments flow (payment and refund receipts through each provider); `tests/api/reminders.test.mjs` › COMM-003 owner-approved email templates flow (each provider's existing notices and report links under the retained authority and consent limits); `tests/browser/email.spec.ts` › “COMM-001 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390” (settings, document outcomes, both providers' failure and next-step screens, explicit recovery, unknown morning outcome and next-date delivered state); `tests/portable.mjs` › Glove portability (real archive and restore, callback password and hash exclusion, old credential refused and reconnection required). |  |
| `COMM-011` | Future document-email inheritance | target | done | `tests/api/email.test.mjs` › “COMM-001 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events” (SendGrid, Resend, Postmark and Amazon SES routing and outcomes; Postmark and SES document delivery and bounce replay, exact job facts, customer warning and recovery, conversation order and authors, refusal, rate limiting, malformed answers, uncertainty, explicit resend and Activity and export with each provider reference); › “COMM-001 the owner's morning brief email is sent once per business-local date and records the provider outcome” (Postmark and SES concurrent separate-isolate date claims, complete brief including overdue invoices, delivered and bounced facts, refusal, rate limiting and uncertainty without same-date retry, next-date recovery and provider references); › “COMM-001 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic” (one 20-request allowance across two Worker isolates, 21st rejection, independent IP, minute reset, verified bypass and generic no-write rejection); › “COMM-001 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes”; › “COMM-001 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs” (approved provider callback boundaries); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (SendGrid, Postmark and SES immutable confirmation copies and delivered outcomes); `tests/api/agreements.test.mjs` › PLAN-004 forty due entitlements flow (eight working emailed offers through each provider); `tests/api/payments.test.mjs` › PAY-004 three installments flow (payment and refund receipts through each provider); `tests/api/reminders.test.mjs` › COMM-003 owner-approved email templates flow (each provider's existing notices and report links under the retained authority and consent limits); `tests/browser/email.spec.ts` › “COMM-001 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390” (settings, document outcomes, both providers' failure and next-step screens, explicit recovery, unknown morning outcome and next-date delivered state); `tests/portable.mjs` › Glove portability (real archive and restore, callback password and hash exclusion, old credential refused and reconnection required). |  |
| `COMM-012` | Morning-brief email | target | done | `tests/api/email.test.mjs` › “COMM-001 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events” (SendGrid, Resend, Postmark and Amazon SES routing and outcomes; Postmark and SES document delivery and bounce replay, exact job facts, customer warning and recovery, conversation order and authors, refusal, rate limiting, malformed answers, uncertainty, explicit resend and Activity and export with each provider reference); › “COMM-001 the owner's morning brief email is sent once per business-local date and records the provider outcome” (Postmark and SES concurrent separate-isolate date claims, complete brief including overdue invoices, delivered and bounced facts, refusal, rate limiting and uncertainty without same-date retry, next-date recovery and provider references); › “COMM-001 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic” (one 20-request allowance across two Worker isolates, 21st rejection, independent IP, minute reset, verified bypass and generic no-write rejection); › “COMM-001 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes”; › “COMM-001 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs” (approved provider callback boundaries); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (SendGrid, Postmark and SES immutable confirmation copies and delivered outcomes); `tests/api/agreements.test.mjs` › PLAN-004 forty due entitlements flow (eight working emailed offers through each provider); `tests/api/payments.test.mjs` › PAY-004 three installments flow (payment and refund receipts through each provider); `tests/api/reminders.test.mjs` › COMM-003 owner-approved email templates flow (each provider's existing notices and report links under the retained authority and consent limits); `tests/browser/email.spec.ts` › “COMM-001 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390” (settings, document outcomes, both providers' failure and next-step screens, explicit recovery, unknown morning outcome and next-date delivered state); `tests/portable.mjs` › Glove portability (real archive and restore, callback password and hash exclusion, old credential refused and reconnection required). |  |
| `COMM-013` | Callback authentication before effects | target | done | `tests/api/email.test.mjs` › “COMM-001 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events” (SendGrid, Resend, Postmark and Amazon SES routing and outcomes; Postmark and SES document delivery and bounce replay, exact job facts, customer warning and recovery, conversation order and authors, refusal, rate limiting, malformed answers, uncertainty, explicit resend and Activity and export with each provider reference); › “COMM-001 the owner's morning brief email is sent once per business-local date and records the provider outcome” (Postmark and SES concurrent separate-isolate date claims, complete brief including overdue invoices, delivered and bounced facts, refusal, rate limiting and uncertainty without same-date retry, next-date recovery and provider references); › “COMM-001 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic” (one 20-request allowance across two Worker isolates, 21st rejection, independent IP, minute reset, verified bypass and generic no-write rejection); › “COMM-001 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes”; › “COMM-001 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs” (approved provider callback boundaries); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (SendGrid, Postmark and SES immutable confirmation copies and delivered outcomes); `tests/api/agreements.test.mjs` › PLAN-004 forty due entitlements flow (eight working emailed offers through each provider); `tests/api/payments.test.mjs` › PAY-004 three installments flow (payment and refund receipts through each provider); `tests/api/reminders.test.mjs` › COMM-003 owner-approved email templates flow (each provider's existing notices and report links under the retained authority and consent limits); `tests/browser/email.spec.ts` › “COMM-001 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390” (settings, document outcomes, both providers' failure and next-step screens, explicit recovery, unknown morning outcome and next-date delivered state); `tests/portable.mjs` › Glove portability (real archive and restore, callback password and hash exclusion, old credential refused and reconnection required). |  |
| `COMM-014` | Callback rejection accounting | target | done | `tests/api/email.test.mjs` › “COMM-001 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events” (SendGrid, Resend, Postmark and Amazon SES routing and outcomes; Postmark and SES document delivery and bounce replay, exact job facts, customer warning and recovery, conversation order and authors, refusal, rate limiting, malformed answers, uncertainty, explicit resend and Activity and export with each provider reference); › “COMM-001 the owner's morning brief email is sent once per business-local date and records the provider outcome” (Postmark and SES concurrent separate-isolate date claims, complete brief including overdue invoices, delivered and bounced facts, refusal, rate limiting and uncertainty without same-date retry, next-date recovery and provider references); › “COMM-001 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic” (one 20-request allowance across two Worker isolates, 21st rejection, independent IP, minute reset, verified bypass and generic no-write rejection); › “COMM-001 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes”; › “COMM-001 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs” (approved provider callback boundaries); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (SendGrid, Postmark and SES immutable confirmation copies and delivered outcomes); `tests/api/agreements.test.mjs` › PLAN-004 forty due entitlements flow (eight working emailed offers through each provider); `tests/api/payments.test.mjs` › PAY-004 three installments flow (payment and refund receipts through each provider); `tests/api/reminders.test.mjs` › COMM-003 owner-approved email templates flow (each provider's existing notices and report links under the retained authority and consent limits); `tests/browser/email.spec.ts` › “COMM-001 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390” (settings, document outcomes, both providers' failure and next-step screens, explicit recovery, unknown morning outcome and next-date delivered state); `tests/portable.mjs` › Glove portability (real archive and restore, callback password and hash exclusion, old credential refused and reconnection required). |  |
| `COMM-015` | Postmark callback custody | target | done | `tests/api/email.test.mjs` › “COMM-001 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events” (SendGrid, Resend, Postmark and Amazon SES routing and outcomes; Postmark and SES document delivery and bounce replay, exact job facts, customer warning and recovery, conversation order and authors, refusal, rate limiting, malformed answers, uncertainty, explicit resend and Activity and export with each provider reference); › “COMM-001 the owner's morning brief email is sent once per business-local date and records the provider outcome” (Postmark and SES concurrent separate-isolate date claims, complete brief including overdue invoices, delivered and bounced facts, refusal, rate limiting and uncertainty without same-date retry, next-date recovery and provider references); › “COMM-001 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic” (one 20-request allowance across two Worker isolates, 21st rejection, independent IP, minute reset, verified bypass and generic no-write rejection); › “COMM-001 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes”; › “COMM-001 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs” (approved provider callback boundaries); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (SendGrid, Postmark and SES immutable confirmation copies and delivered outcomes); `tests/api/agreements.test.mjs` › PLAN-004 forty due entitlements flow (eight working emailed offers through each provider); `tests/api/payments.test.mjs` › PAY-004 three installments flow (payment and refund receipts through each provider); `tests/api/reminders.test.mjs` › COMM-003 owner-approved email templates flow (each provider's existing notices and report links under the retained authority and consent limits); `tests/browser/email.spec.ts` › “COMM-001 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390” (settings, document outcomes, both providers' failure and next-step screens, explicit recovery, unknown morning outcome and next-date delivered state); `tests/portable.mjs` › Glove portability (real archive and restore, callback password and hash exclusion, old credential refused and reconnection required). |  |
| `COMM-016` | Postmark delivery-outcome mapping | target | done | `tests/api/email.test.mjs` › “COMM-001 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events” (SendGrid, Resend, Postmark and Amazon SES routing and outcomes; Postmark and SES document delivery and bounce replay, exact job facts, customer warning and recovery, conversation order and authors, refusal, rate limiting, malformed answers, uncertainty, explicit resend and Activity and export with each provider reference); › “COMM-001 the owner's morning brief email is sent once per business-local date and records the provider outcome” (Postmark and SES concurrent separate-isolate date claims, complete brief including overdue invoices, delivered and bounced facts, refusal, rate limiting and uncertainty without same-date retry, next-date recovery and provider references); › “COMM-001 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic” (one 20-request allowance across two Worker isolates, 21st rejection, independent IP, minute reset, verified bypass and generic no-write rejection); › “COMM-001 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes”; › “COMM-001 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs” (approved provider callback boundaries); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (SendGrid, Postmark and SES immutable confirmation copies and delivered outcomes); `tests/api/agreements.test.mjs` › PLAN-004 forty due entitlements flow (eight working emailed offers through each provider); `tests/api/payments.test.mjs` › PAY-004 three installments flow (payment and refund receipts through each provider); `tests/api/reminders.test.mjs` › COMM-003 owner-approved email templates flow (each provider's existing notices and report links under the retained authority and consent limits); `tests/browser/email.spec.ts` › “COMM-001 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390” (settings, document outcomes, both providers' failure and next-step screens, explicit recovery, unknown morning outcome and next-date delivered state); `tests/portable.mjs` › Glove portability (real archive and restore, callback password and hash exclusion, old credential refused and reconnection required). |  |
| `COMM-017` | Amazon SES and SNS callback custody | target | done | `tests/api/email.test.mjs` › “COMM-001 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events” (SendGrid, Resend, Postmark and Amazon SES routing and outcomes; Postmark and SES document delivery and bounce replay, exact job facts, customer warning and recovery, conversation order and authors, refusal, rate limiting, malformed answers, uncertainty, explicit resend and Activity and export with each provider reference); › “COMM-001 the owner's morning brief email is sent once per business-local date and records the provider outcome” (Postmark and SES concurrent separate-isolate date claims, complete brief including overdue invoices, delivered and bounced facts, refusal, rate limiting and uncertainty without same-date retry, next-date recovery and provider references); › “COMM-001 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic” (one 20-request allowance across two Worker isolates, 21st rejection, independent IP, minute reset, verified bypass and generic no-write rejection); › “COMM-001 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes”; › “COMM-001 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs” (approved provider callback boundaries); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (SendGrid, Postmark and SES immutable confirmation copies and delivered outcomes); `tests/api/agreements.test.mjs` › PLAN-004 forty due entitlements flow (eight working emailed offers through each provider); `tests/api/payments.test.mjs` › PAY-004 three installments flow (payment and refund receipts through each provider); `tests/api/reminders.test.mjs` › COMM-003 owner-approved email templates flow (each provider's existing notices and report links under the retained authority and consent limits); `tests/browser/email.spec.ts` › “COMM-001 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390” (settings, document outcomes, both providers' failure and next-step screens, explicit recovery, unknown morning outcome and next-date delivered state); `tests/portable.mjs` › Glove portability (real archive and restore, callback password and hash exclusion, old credential refused and reconnection required). |  |
| `COMM-018` | Email provider proof boundary | target | done | `tests/api/email.test.mjs` › “COMM-001 a quote, an invoice and a purchase order emailed through the owner's provider record delivered and bounced from signed provider events” (SendGrid, Resend, Postmark and Amazon SES routing and outcomes; Postmark and SES document delivery and bounce replay, exact job facts, customer warning and recovery, conversation order and authors, refusal, rate limiting, malformed answers, uncertainty, explicit resend and Activity and export with each provider reference); › “COMM-001 the owner's morning brief email is sent once per business-local date and records the provider outcome” (Postmark and SES concurrent separate-isolate date claims, complete brief including overdue invoices, delivered and bounced facts, refusal, rate limiting and uncertainty without same-date retry, next-date recovery and provider references); › “COMM-001 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic” (one 20-request allowance across two Worker isolates, 21st rejection, independent IP, minute reset, verified bypass and generic no-write rejection); › “COMM-001 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes”; › “COMM-001 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs” (approved provider callback boundaries); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (SendGrid, Postmark and SES immutable confirmation copies and delivered outcomes); `tests/api/agreements.test.mjs` › PLAN-004 forty due entitlements flow (eight working emailed offers through each provider); `tests/api/payments.test.mjs` › PAY-004 three installments flow (payment and refund receipts through each provider); `tests/api/reminders.test.mjs` › COMM-003 owner-approved email templates flow (each provider's existing notices and report links under the retained authority and consent limits); `tests/browser/email.spec.ts` › “COMM-001 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390” (settings, document outcomes, both providers' failure and next-step screens, explicit recovery, unknown morning outcome and next-date delivered state); `tests/portable.mjs` › Glove portability (real archive and restore, callback password and hash exclusion, old credential refused and reconnection required). |  |
| `COMM-003` | Appointment confirmations and reminders | target | partial | `tests/api/reminders.test.mjs` › “COMM-003 owner-approved email templates confirm and move visits including assessments, respect consent and quiet hours, and never replay an attempt” (exact approved wording and timing, booking, move, cancellation and assessment notices, authenticated provider outcomes, customer confirm and reschedule with unchanged booking, explicit emailed report link, consent withdrawal, text quiet hours, authenticated text replies, STOP and segment exclusion, privacy erasure); the same COMM-003 template flow also proves address change, unknown outcome and the owner switch through its retained refusal assertions; › “Erasure during an automatic provider attempt never restores recipient addresses in the outcome” (email and text erasure while provider response is pending); `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” (template editor and previews, disabled and enabled connection, purpose consent, customer responses and desk request, received report, stop states) | Automatic email confirmations and reminders still direct replies to the office; automatic response-link inclusion and customer-selected schedule controls remain unbuilt. COMM-004 and COMM-008 retain on-my-way and review-template obligations. COMM-002 retains number ordering and delay-agent inheritance. No live provider delivery is claimed; RL-102 resolves the consent, quiet-hours, response-link and report-disclosure policy holds. |
| `COMM-019` | Visit notice scheduling and current consent | target | partial | `tests/api/reminders.test.mjs` › “COMM-003 owner-approved email templates confirm and move visits including assessments, respect consent and quiet hours, and never replay an attempt” (exact approved wording and timing, booking, move, cancellation and assessment notices, authenticated provider outcomes, customer confirm and reschedule with unchanged booking, explicit emailed report link, consent withdrawal, text quiet hours, authenticated text replies, STOP and segment exclusion, privacy erasure); the same COMM-003 template flow also proves address change, unknown outcome and the owner switch through its retained refusal assertions; › “Erasure during an automatic provider attempt never restores recipient addresses in the outcome” (email and text erasure while provider response is pending); `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” (template editor and previews, disabled and enabled connection, purpose consent, customer responses and desk request, received report, stop states) | Automatic email confirmations and reminders still direct replies to the office; automatic response-link inclusion and customer-selected schedule controls remain unbuilt. COMM-004 and COMM-008 retain on-my-way and review-template obligations. COMM-002 retains number ordering and delay-agent inheritance. No live provider delivery is claimed; RL-102 resolves the consent, quiet-hours, response-link and report-disclosure policy holds. |
| `COMM-020` | Other-purpose reminder inheritance | target | partial | `tests/api/reminders.test.mjs` › “COMM-003 owner-approved email templates confirm and move visits including assessments, respect consent and quiet hours, and never replay an attempt” (exact approved wording and timing, booking, move, cancellation and assessment notices, authenticated provider outcomes, customer confirm and reschedule with unchanged booking, explicit emailed report link, consent withdrawal, text quiet hours, authenticated text replies, STOP and segment exclusion, privacy erasure); the same COMM-003 template flow also proves address change, unknown outcome and the owner switch through its retained refusal assertions; › “Erasure during an automatic provider attempt never restores recipient addresses in the outcome” (email and text erasure while provider response is pending); `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” (template editor and previews, disabled and enabled connection, purpose consent, customer responses and desk request, received report, stop states) | Automatic email confirmations and reminders still direct replies to the office; automatic response-link inclusion and customer-selected schedule controls remain unbuilt. COMM-004 and COMM-008 retain on-my-way and review-template obligations. COMM-002 retains number ordering and delay-agent inheritance. No live provider delivery is claimed; RL-102 resolves the consent, quiet-hours, response-link and report-disclosure policy holds. |
| `COMM-004` | On-my-way and job status texts | target | partial | `tests/browser/reminders.spec.ts` › “COMM-004 owner previews status templates; technician shares photo and ETA, arrival and the exact completed report at 1440 and 390” (explicit owner settings and exact previews, phone tap with technician first name, consented photo and current driving ETA, arrival text and completed report text, exact report-link content and authenticated delivery outcome at both widths); `tests/api/reminders.test.mjs` › “COMM-004 owner-approved tap sends first name, photo and live ETA; arrival and completion follow owner settings once” (off-by-default refusal, personal photo consent and sanitized image, two-hour bearer isolation and withdrawal even after profile deactivation, fresh arrival and stale offline suppression, current assignment and consent, no coordinates in texts, one attempt on replay, exact seven-day report bearer, signed delivery, revocation, quiet-hours suppression and Activity with business export without credentials) | Automatic detected departure and live provider proof remain unproved; the technician tap proves only the explicit-departure alternative. COMM-002 retains live registration and number-ordering work. RL-103 resolves the bounded disclosure and report-issuance policy holds. |
| `COMM-021` | Arrival and completed-report notices | target | partial | `tests/browser/reminders.spec.ts` › “COMM-004 owner previews status templates; technician shares photo and ETA, arrival and the exact completed report at 1440 and 390” (explicit owner settings and exact previews, phone tap with technician first name, consented photo and current driving ETA, arrival text and completed report text, exact report-link content and authenticated delivery outcome at both widths); `tests/api/reminders.test.mjs` › “COMM-004 owner-approved tap sends first name, photo and live ETA; arrival and completion follow owner settings once” (off-by-default refusal, personal photo consent and sanitized image, two-hour bearer isolation and withdrawal even after profile deactivation, fresh arrival and stale offline suppression, current assignment and consent, no coordinates in texts, one attempt on replay, exact seven-day report bearer, signed delivery, revocation, quiet-hours suppression and Activity with business export without credentials) | Automatic detected departure and live provider proof remain unproved; the technician tap proves only the explicit-departure alternative. COMM-002 retains live registration and number-ordering work. RL-103 resolves the bounded disclosure and report-issuance policy holds. |
| `COMM-006` | Customer hub | target | partial | `tests/api/customer-quotes.test.mjs` › “COMM-006 Owner hub preview isolates one customer and excludes drafts, access notes, payment credentials and internal conversations” reports proof of the owner-only projection, price-book customer description, approved invoices, completed-report summaries, equipment, separation from another customer, draft and secret exclusion, signed-out and role refusals, branch-scoped Owner refusal and attributable Activity and export. This is repository-reported evidence, not independently executed by CT. It proves no customer sign-in or browser acceptance. | Customer sign-in and credential lifecycle, customer-facing screens, quote approval and signing, invoice payment, work requests, report originals and isolation, visit responses, agreement renewal and card updates, and COMM-007 portal conversations remain unbuilt; the complete 1440 and 390 browser acceptance remains unproved. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. COMM-006 stays PARTIAL. |
| `COMM-022` | Customer-hub completion boundary | target | partial | `tests/api/customer-quotes.test.mjs` › “COMM-006 Owner hub preview isolates one customer and excludes drafts, access notes, payment credentials and internal conversations” reports proof of the owner-only projection, price-book customer description, approved invoices, completed-report summaries, equipment, separation from another customer, draft and secret exclusion, signed-out and role refusals, branch-scoped Owner refusal and attributable Activity and export. This is repository-reported evidence, not independently executed by CT. It proves no customer sign-in or browser acceptance. | Customer sign-in and credential lifecycle, customer-facing screens, quote approval and signing, invoice payment, work requests, report originals and isolation, visit responses, agreement renewal and card updates, and COMM-007 portal conversations remain unbuilt; the complete 1440 and 390 browser acceptance remains unproved. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. COMM-006 stays PARTIAL. |
| `COMM-023` | Owner inspection of customer-facing projection | target | partial | `tests/api/customer-quotes.test.mjs` › “COMM-006 Owner hub preview isolates one customer and excludes drafts, access notes, payment credentials and internal conversations” reports proof of the owner-only projection, price-book customer description, approved invoices, completed-report summaries, equipment, separation from another customer, draft and secret exclusion, signed-out and role refusals, branch-scoped Owner refusal and attributable Activity and export. This is repository-reported evidence, not independently executed by CT. It proves no customer sign-in or browser acceptance. | Customer sign-in and credential lifecycle, customer-facing screens, quote approval and signing, invoice payment, work requests, report originals and isolation, visit responses, agreement renewal and card updates, and COMM-007 portal conversations remain unbuilt; the complete 1440 and 390 browser acceptance remains unproved. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. COMM-006 stays PARTIAL. |
| `COMM-024` | Customer preview has no transaction authority | target | partial | `tests/api/customer-quotes.test.mjs` › “COMM-006 Owner hub preview isolates one customer and excludes drafts, access notes, payment credentials and internal conversations” reports proof of the owner-only projection, price-book customer description, approved invoices, completed-report summaries, equipment, separation from another customer, draft and secret exclusion, signed-out and role refusals, branch-scoped Owner refusal and attributable Activity and export. This is repository-reported evidence, not independently executed by CT. It proves no customer sign-in or browser acceptance. | Customer sign-in and credential lifecycle, customer-facing screens, quote approval and signing, invoice payment, work requests, report originals and isolation, visit responses, agreement renewal and card updates, and COMM-007 portal conversations remain unbuilt; the complete 1440 and 390 browser acceptance remains unproved. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. COMM-006 stays PARTIAL. |
| `COMM-025` | Projection authority and retained custody | target | partial | `tests/api/customer-quotes.test.mjs` › “COMM-006 Owner hub preview isolates one customer and excludes drafts, access notes, payment credentials and internal conversations” reports proof of the owner-only projection, price-book customer description, approved invoices, completed-report summaries, equipment, separation from another customer, draft and secret exclusion, signed-out and role refusals, branch-scoped Owner refusal and attributable Activity and export. This is repository-reported evidence, not independently executed by CT. It proves no customer sign-in or browser acceptance. | Customer sign-in and credential lifecycle, customer-facing screens, quote approval and signing, invoice payment, work requests, report originals and isolation, visit responses, agreement renewal and card updates, and COMM-007 portal conversations remain unbuilt; the complete 1440 and 390 browser acceptance remains unproved. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. COMM-006 stays PARTIAL. |
| `COMM-008` | Review requests after paid jobs | target | partial | `tests/api/reminders.test.mjs` › “COMM-008 explicit uniform email requests require completed paid jobs, current consent and a per-customer period” (unpaid refusal; two completed and paid jobs produce one explicit request; provider acceptance and signed delivery on message, job timeline, customer history, Activity and export; mandatory postal address and unsubscribe; separate withdrawal prevents a later request; changed-address and Office-send refusal; refused, rate-limited, uncertain and authenticated bounced attempts consume the shared period despite job and template changes, with no automatic retry; no bearer in export). Owner controls proven: `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” now edits and approves uniform review wording, the business postal footer and customer period without sending; records current-email permission with source and time; withdraws and renews it; selects exactly the completed and paid jobs; explicitly sends one request; shows provider acceptance without claiming delivery; and suppresses a second job in the shared period. Its review screens are recorded at both widths. `tests/api/reminders.test.mjs` › “COMM-008 explicit uniform email requests require completed paid jobs, current consent and a per-customer period” also proves the owner eligibility projection, changed-address and Office and branch-limited Owner refusals, and attributable configuration, permission, skipped request and provider outcomes in Activity and export. Owner controls additionally invalidate consent confirmation when the current email changes and send confirmation when the customer or saved business settings change. The same API test refuses stale-address consent and proves rejected, rate-limited, uncertain and bounced review outcomes retain the customer period without advice to resend; the owner browser journey shows an authenticated bounce and period suppression. | Automatic trigger execution, text requests and Google Business Profile review retrieval remain unbuilt. Approved with riders: the current capability is off-by-default, explicit owner-triggered email under the owner's established current authority; unscoped does not bypass access or recipient boundaries. Separate source and time-recorded permission must match the current email, existing opt-outs prevail, and every request uses the uniform configured wording, postal address and purpose-specific unsubscribe. Assert address-change and unauthorized-send refusal, the shared customer period across jobs, period consumption for every provider attempt including refusal, rate limiting, failure and uncertainty, no automatic send or retry, authenticated outcome distinctions and attributable secret-free history. The cited test proves its named manual-email slice, not every rider. Automatic triggers, texts under COMM-002 and Google review retrieval remain required and unbuilt; COMM-003 retains owner-editable review templates. Status remains PARTIAL. `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” proves separate review withdrawal and changing between private preference links at both widths. |
| `COMM-026` | Review-request consent and uniform wording | target | partial | `tests/api/reminders.test.mjs` › “COMM-008 explicit uniform email requests require completed paid jobs, current consent and a per-customer period” (unpaid refusal; two completed and paid jobs produce one explicit request; provider acceptance and signed delivery on message, job timeline, customer history, Activity and export; mandatory postal address and unsubscribe; separate withdrawal prevents a later request; changed-address and Office-send refusal; refused, rate-limited, uncertain and authenticated bounced attempts consume the shared period despite job and template changes, with no automatic retry; no bearer in export). Owner controls proven: `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” now edits and approves uniform review wording, the business postal footer and customer period without sending; records current-email permission with source and time; withdraws and renews it; selects exactly the completed and paid jobs; explicitly sends one request; shows provider acceptance without claiming delivery; and suppresses a second job in the shared period. Its review screens are recorded at both widths. `tests/api/reminders.test.mjs` › “COMM-008 explicit uniform email requests require completed paid jobs, current consent and a per-customer period” also proves the owner eligibility projection, changed-address and Office and branch-limited Owner refusals, and attributable configuration, permission, skipped request and provider outcomes in Activity and export. Owner controls additionally invalidate consent confirmation when the current email changes and send confirmation when the customer or saved business settings change. The same API test refuses stale-address consent and proves rejected, rate-limited, uncertain and bounced review outcomes retain the customer period without advice to resend; the owner browser journey shows an authenticated bounce and period suppression. | Automatic trigger execution, text requests and Google Business Profile review retrieval remain unbuilt. Approved with riders: the current capability is off-by-default, explicit owner-triggered email under the owner's established current authority; unscoped does not bypass access or recipient boundaries. Separate source and time-recorded permission must match the current email, existing opt-outs prevail, and every request uses the uniform configured wording, postal address and purpose-specific unsubscribe. Assert address-change and unauthorized-send refusal, the shared customer period across jobs, period consumption for every provider attempt including refusal, rate limiting, failure and uncertainty, no automatic send or retry, authenticated outcome distinctions and attributable secret-free history. The cited test proves its named manual-email slice, not every rider. Automatic triggers, texts under COMM-002 and Google review retrieval remain required and unbuilt; COMM-003 retains owner-editable review templates. Status remains PARTIAL. `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” proves separate review withdrawal and changing between private preference links at both widths. |
| `COMM-027` | Review-request period and outcome custody | target | partial | `tests/api/reminders.test.mjs` › “COMM-008 explicit uniform email requests require completed paid jobs, current consent and a per-customer period” (unpaid refusal; two completed and paid jobs produce one explicit request; provider acceptance and signed delivery on message, job timeline, customer history, Activity and export; mandatory postal address and unsubscribe; separate withdrawal prevents a later request; changed-address and Office-send refusal; refused, rate-limited, uncertain and authenticated bounced attempts consume the shared period despite job and template changes, with no automatic retry; no bearer in export). Owner controls proven: `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” now edits and approves uniform review wording, the business postal footer and customer period without sending; records current-email permission with source and time; withdraws and renews it; selects exactly the completed and paid jobs; explicitly sends one request; shows provider acceptance without claiming delivery; and suppresses a second job in the shared period. Its review screens are recorded at both widths. `tests/api/reminders.test.mjs` › “COMM-008 explicit uniform email requests require completed paid jobs, current consent and a per-customer period” also proves the owner eligibility projection, changed-address and Office and branch-limited Owner refusals, and attributable configuration, permission, skipped request and provider outcomes in Activity and export. Owner controls additionally invalidate consent confirmation when the current email changes and send confirmation when the customer or saved business settings change. The same API test refuses stale-address consent and proves rejected, rate-limited, uncertain and bounced review outcomes retain the customer period without advice to resend; the owner browser journey shows an authenticated bounce and period suppression. | Automatic trigger execution, text requests and Google Business Profile review retrieval remain unbuilt. Approved with riders: the current capability is off-by-default, explicit owner-triggered email under the owner's established current authority; unscoped does not bypass access or recipient boundaries. Separate source and time-recorded permission must match the current email, existing opt-outs prevail, and every request uses the uniform configured wording, postal address and purpose-specific unsubscribe. Assert address-change and unauthorized-send refusal, the shared customer period across jobs, period consumption for every provider attempt including refusal, rate limiting, failure and uncertainty, no automatic send or retry, authenticated outcome distinctions and attributable secret-free history. The cited test proves its named manual-email slice, not every rider. Automatic triggers, texts under COMM-002 and Google review retrieval remain required and unbuilt; COMM-003 retains owner-editable review templates. Status remains PARTIAL. `tests/browser/reminders.spec.ts` › “PAY-005, QUOTE-004 and COMM-003 owner templates, text consent, visit replies, report notices and stopped states at 1440 and 390” proves separate review withdrawal and changing between private preference links at both widths. |
| `COMM-009` | Calls on the business number | target | partial | `tests/api/reminders.test.mjs` › “COMM-009 signed known-customer calls route in order and retain outcomes; Owner explicitly texts one consented booking reply”, implemented in `tests/api/voice-flow.mjs`: ordered office and on-call routing and final forwarding, answered and missed call replay, exact caller and duration, off-by-default recording refusal, explicit booking text, separate consent, quiet hours, one attempt, authenticated delivery, role and branch refusals, ordered COMM-007 stream, Activity and business export with provider references and no credentials or bearer, and erasure without webhook resurrection.  Gate correction evidence: the same HTTP flow asserts Owner retention and staff refusal of native call identities and call-to-offer associations through state and business export, including audit change metadata; signed inbound and completed-leg replays and a fresh next-leg callback hang up after the customer number changes, without writes. `tests/browser/reminders.spec.ts` › “COMM-009 native call history is Owner-only while the desk retains text history”, implemented in `tests/browser/voice-journey.ts`, asserts Owner call outcomes and Office exclusion at 1440, with screen proof at 1440 and 390.| CT approval of the adopted routing, Owner-only call custody and explicit missed-call booking-text defaults remains pending. Recording consent, recording notice, provider recording custody and access, automatic missed-call texts, unknown and shared-number callers, inbound caller-disconnect outcomes, browser configuration and reply controls, complete archive restoration proof and COMM-002 number hosting and port activation remain unbuilt or unproved. The existing-number connection is an Owner affirmation; no live provider receipt is claimed. |
| `COMM-028` | Missed-call reply and call custody | target | partial | `tests/api/reminders.test.mjs` › “COMM-009 signed known-customer calls route in order and retain outcomes; Owner explicitly texts one consented booking reply”, implemented in `tests/api/voice-flow.mjs`: ordered office and on-call routing and final forwarding, answered and missed call replay, exact caller and duration, off-by-default recording refusal, explicit booking text, separate consent, quiet hours, one attempt, authenticated delivery, role and branch refusals, ordered COMM-007 stream, Activity and business export with provider references and no credentials or bearer, and erasure without webhook resurrection.  Gate correction evidence: the same HTTP flow asserts Owner retention and staff refusal of native call identities and call-to-offer associations through state and business export, including audit change metadata; signed inbound and completed-leg replays and a fresh next-leg callback hang up after the customer number changes, without writes. `tests/browser/reminders.spec.ts` › “COMM-009 native call history is Owner-only while the desk retains text history”, implemented in `tests/browser/voice-journey.ts`, asserts Owner call outcomes and Office exclusion at 1440, with screen proof at 1440 and 390.| CT approval of the adopted routing, Owner-only call custody and explicit missed-call booking-text defaults remains pending. Recording consent, recording notice, provider recording custody and access, automatic missed-call texts, unknown and shared-number callers, inbound caller-disconnect outcomes, browser configuration and reply controls, complete archive restoration proof and COMM-002 number hosting and port activation remain unbuilt or unproved. The existing-number connection is an Owner affirmation; no live provider receipt is claimed. |
| `FIELD-004` | Installable technician app with push | target | done | `src/glove/push.ts`, `src/glove/commands/push.ts`, `src/ui/push.tsx`, `public/manifest.webmanifest`, `public/glove-sw.js`, `tests/api/push.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `FIELD-009` | Phone push subscriptions | target | done | `src/glove/push.ts`, `src/glove/commands/push.ts`, `src/ui/push.tsx`, `public/manifest.webmanifest`, `public/glove-sw.js`, `tests/api/push.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `FIELD-010` | Schedule-change push outcomes | target | done | `src/glove/push.ts`, `src/glove/commands/push.ts`, `src/ui/push.tsx`, `public/manifest.webmanifest`, `public/glove-sw.js`, `tests/api/push.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `FIELD-006` | Equipment nameplate capture | target | partial | `src/glove/commands/nameplates.ts`, `src/glove/provider.ts`, `src/ui/nameplates.tsx`, `tests/api/nameplates.test.mjs` | Old evidence asserts the three nameplate readings, unchanged equipment before the technician confirms, corrected fields, discard and manual attachment. Company-policy selection between automatic field filling and held confirmation is unasserted; the existing fixed technician-confirmation gate proves only that held behavior. |
| `FIELD-011` | Nameplate dates and manual lookup | target | partial | `src/glove/commands/nameplates.ts`, `src/glove/provider.ts`, `src/ui/nameplates.tsx`, `tests/api/nameplates.test.mjs` | Old evidence asserts the three nameplate readings, unchanged equipment before the technician confirms, corrected fields, discard and manual attachment. Company-policy selection between automatic field filling and held confirmation is unasserted; the existing fixed technician-confirmation gate proves only that held behavior. |
| `FIELD-008` | The whole office on the owner's phone | target | partial | `tests/browser/journey.spec.ts` › “The Owner runs the whole phone desk and Office repeats its permitted steps with exact role refusals at 390 and 1440” (phoned request to quote and job, provider-accepted quote and invoice email, booking, check payment, saved-card charge settled by a signed Stripe event, customer text reply and dashboard; every screen checks horizontal scroll; Office service-call creation, allowed sends and payments, and quote approval, customer acceptance and ordinary booking refusals); `tests/api/payments.test.mjs` › “FIELD-008 saved test cards require customer authorization and desk authority, reserve once, and pay only on authenticated Stripe confirmation” (verified attachment, scope and role refusals, exact-once reservation, unknown outcome, signed settlement, decline, withdrawal and Activity with business export); `tests/api/reminders.test.mjs` › “The desk explicitly retains, assigns and answers a customer text on its job; STOP and role withdrawal close the send door” (inbox assignment, same-customer threading, provider delivery, conversation history, STOP and role withdrawal) | FIELD-005 native apps still need Apple Developer and Google Play publisher/signing access and device proof. Keyed cards, discretionary deposits, saved bank methods and custom-role charges remain PAY-009/PAY-008 work. RL-104 resolves the saved-card authorization and retained-inbox policy holds; it grants no live spend. |
| `FIELD-012` | Phone-desk saved-card and inbox custody | target | partial | `tests/browser/journey.spec.ts` › “The Owner runs the whole phone desk and Office repeats its permitted steps with exact role refusals at 390 and 1440” (phoned request to quote and job, provider-accepted quote and invoice email, booking, check payment, saved-card charge settled by a signed Stripe event, customer text reply and dashboard; every screen checks horizontal scroll; Office service-call creation, allowed sends and payments, and quote approval, customer acceptance and ordinary booking refusals); `tests/api/payments.test.mjs` › “FIELD-008 saved test cards require customer authorization and desk authority, reserve once, and pay only on authenticated Stripe confirmation” (verified attachment, scope and role refusals, exact-once reservation, unknown outcome, signed settlement, decline, withdrawal and Activity with business export); `tests/api/reminders.test.mjs` › “The desk explicitly retains, assigns and answers a customer text on its job; STOP and role withdrawal close the send door” (inbox assignment, same-customer threading, provider delivery, conversation history, STOP and role withdrawal) | FIELD-005 native apps still need Apple Developer and Google Play publisher/signing access and device proof. Keyed cards, discretionary deposits, saved bank methods and custom-role charges remain PAY-009/PAY-008 work. RL-104 resolves the saved-card authorization and retained-inbox policy holds; it grants no live spend. |
| `COST-002` | Timesheets and payroll export | target | done | `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `tests/api/payroll.test.mjs`, `src/glove/api.ts`, `tests/api/security.test.mjs`, `src/glove/view.ts` |  |
| `COST-006` | Approved-period payroll eligibility | target | done | `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `tests/api/payroll.test.mjs`, `src/glove/api.ts`, `tests/api/security.test.mjs`, `src/glove/view.ts` |  |
| `COST-007` | Provider payroll file shapes | target | done | `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `tests/api/payroll.test.mjs`, `src/glove/api.ts`, `tests/api/security.test.mjs`, `src/glove/view.ts` |  |
| `PAY-001` | USD invoices sent from Glove | target | partial | `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`  `tests/api/flows.test.mjs` › “PAY-001 named progress drafts preserve the contract cap, exact final remainder, tax, approval and correction trail” proves named stages, replay, over-cap and premature-stage refusal, PO, frozen terms, tax cents, final residual, export, immutable correction history, customer statement totals and branch isolation; › “PAY-001 owner-granted technician draft requests replay once and expose only approved invoices under current assignment and permission” proves separate explicit Owner permission, role and assignment refusal, concurrent replay once, no draft prices, office-only approval, exact prior approved revision, withdrawal including replay, customer erasure and refused access to erased visits, Activity and export without automatic sending. `tests/browser/invoice-batch.spec.ts` › “PAY-001 office stages a long job, sees the remaining contract amount and approves the exact final invoice at 1440 and 390” proves stage controls, refused overbilling, remaining amount, final review and approved stage history; › “PAY-001 owner allows a technician to queue one invoice draft offline and present its approved revision after reconnect and reload at 1440 and 390” proves the owner permission screen, offline queue and reload, lost response after server commit with exactly-once replay, office approval, approved presentation online and offline, kept-time warning and withdrawal on reconnect. | External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold. |
| `PAY-010` | Customer statements | target | partial | `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`  `tests/api/flows.test.mjs` › “PAY-001 named progress drafts preserve the contract cap, exact final remainder, tax, approval and correction trail” proves named stages, replay, over-cap and premature-stage refusal, PO, frozen terms, tax cents, final residual, export, immutable correction history, customer statement totals and branch isolation; › “PAY-001 owner-granted technician draft requests replay once and expose only approved invoices under current assignment and permission” proves separate explicit Owner permission, role and assignment refusal, concurrent replay once, no draft prices, office-only approval, exact prior approved revision, withdrawal including replay, customer erasure and refused access to erased visits, Activity and export without automatic sending. `tests/browser/invoice-batch.spec.ts` › “PAY-001 office stages a long job, sees the remaining contract amount and approves the exact final invoice at 1440 and 390” proves stage controls, refused overbilling, remaining amount, final review and approved stage history; › “PAY-001 owner allows a technician to queue one invoice draft offline and present its approved revision after reconnect and reload at 1440 and 390” proves the owner permission screen, offline queue and reload, lost response after server commit with exactly-once replay, office approval, approved presentation online and offline, kept-time warning and withdrawal on reconnect. | External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold. |
| `PAY-011` | Statement monthly-date inheritance | target | partial | `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`  `tests/api/flows.test.mjs` › “PAY-001 named progress drafts preserve the contract cap, exact final remainder, tax, approval and correction trail” proves named stages, replay, over-cap and premature-stage refusal, PO, frozen terms, tax cents, final residual, export, immutable correction history, customer statement totals and branch isolation; › “PAY-001 owner-granted technician draft requests replay once and expose only approved invoices under current assignment and permission” proves separate explicit Owner permission, role and assignment refusal, concurrent replay once, no draft prices, office-only approval, exact prior approved revision, withdrawal including replay, customer erasure and refused access to erased visits, Activity and export without automatic sending. `tests/browser/invoice-batch.spec.ts` › “PAY-001 office stages a long job, sees the remaining contract amount and approves the exact final invoice at 1440 and 390” proves stage controls, refused overbilling, remaining amount, final review and approved stage history; › “PAY-001 owner allows a technician to queue one invoice draft offline and present its approved revision after reconnect and reload at 1440 and 390” proves the owner permission screen, offline queue and reload, lost response after server commit with exactly-once replay, office approval, approved presentation online and offline, kept-time warning and withdrawal on reconnect. | External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold. |
| `PAY-012` | Internal uninvoiced-work reminder | target | partial | `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`  `tests/api/flows.test.mjs` › “PAY-001 named progress drafts preserve the contract cap, exact final remainder, tax, approval and correction trail” proves named stages, replay, over-cap and premature-stage refusal, PO, frozen terms, tax cents, final residual, export, immutable correction history, customer statement totals and branch isolation; › “PAY-001 owner-granted technician draft requests replay once and expose only approved invoices under current assignment and permission” proves separate explicit Owner permission, role and assignment refusal, concurrent replay once, no draft prices, office-only approval, exact prior approved revision, withdrawal including replay, customer erasure and refused access to erased visits, Activity and export without automatic sending. `tests/browser/invoice-batch.spec.ts` › “PAY-001 office stages a long job, sees the remaining contract amount and approves the exact final invoice at 1440 and 390” proves stage controls, refused overbilling, remaining amount, final review and approved stage history; › “PAY-001 owner allows a technician to queue one invoice draft offline and present its approved revision after reconnect and reload at 1440 and 390” proves the owner permission screen, offline queue and reload, lost response after server commit with exactly-once replay, office approval, approved presentation online and offline, kept-time warning and withdrawal on reconnect. | External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold. |
| `PAY-013` | Progress invoice stages | target | partial | `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`  `tests/api/flows.test.mjs` › “PAY-001 named progress drafts preserve the contract cap, exact final remainder, tax, approval and correction trail” proves named stages, replay, over-cap and premature-stage refusal, PO, frozen terms, tax cents, final residual, export, immutable correction history, customer statement totals and branch isolation; › “PAY-001 owner-granted technician draft requests replay once and expose only approved invoices under current assignment and permission” proves separate explicit Owner permission, role and assignment refusal, concurrent replay once, no draft prices, office-only approval, exact prior approved revision, withdrawal including replay, customer erasure and refused access to erased visits, Activity and export without automatic sending. `tests/browser/invoice-batch.spec.ts` › “PAY-001 office stages a long job, sees the remaining contract amount and approves the exact final invoice at 1440 and 390” proves stage controls, refused overbilling, remaining amount, final review and approved stage history; › “PAY-001 owner allows a technician to queue one invoice draft offline and present its approved revision after reconnect and reload at 1440 and 390” proves the owner permission screen, offline queue and reload, lost response after server commit with exactly-once replay, office approval, approved presentation online and offline, kept-time warning and withdrawal on reconnect. | External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold. |
| `PAY-014` | Progress-invoice changed-scope reconciliation | target | partial | `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`  `tests/api/flows.test.mjs` › “PAY-001 named progress drafts preserve the contract cap, exact final remainder, tax, approval and correction trail” proves named stages, replay, over-cap and premature-stage refusal, PO, frozen terms, tax cents, final residual, export, immutable correction history, customer statement totals and branch isolation; › “PAY-001 owner-granted technician draft requests replay once and expose only approved invoices under current assignment and permission” proves separate explicit Owner permission, role and assignment refusal, concurrent replay once, no draft prices, office-only approval, exact prior approved revision, withdrawal including replay, customer erasure and refused access to erased visits, Activity and export without automatic sending. `tests/browser/invoice-batch.spec.ts` › “PAY-001 office stages a long job, sees the remaining contract amount and approves the exact final invoice at 1440 and 390” proves stage controls, refused overbilling, remaining amount, final review and approved stage history; › “PAY-001 owner allows a technician to queue one invoice draft offline and present its approved revision after reconnect and reload at 1440 and 390” proves the owner permission screen, offline queue and reload, lost response after server commit with exactly-once replay, office approval, approved presentation online and offline, kept-time warning and withdrawal on reconnect. | External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold. |
| `PAY-015` | Field invoice draft permission | target | partial | `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`  `tests/api/flows.test.mjs` › “PAY-001 named progress drafts preserve the contract cap, exact final remainder, tax, approval and correction trail” proves named stages, replay, over-cap and premature-stage refusal, PO, frozen terms, tax cents, final residual, export, immutable correction history, customer statement totals and branch isolation; › “PAY-001 owner-granted technician draft requests replay once and expose only approved invoices under current assignment and permission” proves separate explicit Owner permission, role and assignment refusal, concurrent replay once, no draft prices, office-only approval, exact prior approved revision, withdrawal including replay, customer erasure and refused access to erased visits, Activity and export without automatic sending. `tests/browser/invoice-batch.spec.ts` › “PAY-001 office stages a long job, sees the remaining contract amount and approves the exact final invoice at 1440 and 390” proves stage controls, refused overbilling, remaining amount, final review and approved stage history; › “PAY-001 owner allows a technician to queue one invoice draft offline and present its approved revision after reconnect and reload at 1440 and 390” proves the owner permission screen, offline queue and reload, lost response after server commit with exactly-once replay, office approval, approved presentation online and offline, kept-time warning and withdrawal on reconnect. | External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold. |
| `PAY-016` | Offline approved-invoice presentation | target | partial | `src/glove/statements.ts`, `src/glove/unbilled-reminders.ts`, `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`, `tests/api/email.test.mjs`, `tests/browser/invoice-batch.spec.ts`  `tests/api/flows.test.mjs` › “PAY-001 named progress drafts preserve the contract cap, exact final remainder, tax, approval and correction trail” proves named stages, replay, over-cap and premature-stage refusal, PO, frozen terms, tax cents, final residual, export, immutable correction history, customer statement totals and branch isolation; › “PAY-001 owner-granted technician draft requests replay once and expose only approved invoices under current assignment and permission” proves separate explicit Owner permission, role and assignment refusal, concurrent replay once, no draft prices, office-only approval, exact prior approved revision, withdrawal including replay, customer erasure and refused access to erased visits, Activity and export without automatic sending. `tests/browser/invoice-batch.spec.ts` › “PAY-001 office stages a long job, sees the remaining contract amount and approves the exact final invoice at 1440 and 390” proves stage controls, refused overbilling, remaining amount, final review and approved stage history; › “PAY-001 owner allows a technician to queue one invoice draft offline and present its approved revision after reconnect and reload at 1440 and 390” proves the owner permission screen, offline queue and reload, lost response after server commit with exactly-once replay, office approval, approved presentation online and offline, kept-time warning and withdrawal on reconnect. | External invoice delivery on reconnect remains unbuilt; its preparatory reconnect action creates a draft only. Customer-facing payment links remain engineering work under PAY-002 and RL-106. Progress invoices use explicitly priced stages within the frozen accepted gross cap; changed scope requires reviewed reconciliation before later stages. RL-105 resolves the separate field grant and offline approved-invoice custody policy hold. |
| `PAY-002` | Card, ACH and wallet payments through Stripe | target | partial | `tests/api/payments.test.mjs` › Stripe-hosted card and ACH settle once (settlement/return, fees, tips/payroll, dashboard, collected tax, aging, receipt/provider timeline, Activity/export); rejects invalid callbacks and unauthorized requests (no effects, reconnect fence, uncertain Checkout replay); payment custody follows customer merge and undo and erasure (financial totals retained, provider/session references removed); `tests/browser/receivables.spec.ts` › confirmed payment and ACH return (Today, aging, tax, invoice and property-history screens at 1440/390) | Only test-mode owner-created invoice Checkout exists. Customer-scoped hosted access required by RL-106, customer-selected tips, wallet proof, deposits and agreement payments, surcharge/disclosure, uncertain Checkout reconciliation and archive/restore proof remain. Live activation is disabled; RL-106 resolves policy authority without proving the customer door. |
| `PAY-017` | Hosted test-payment reservation | target | partial | `tests/api/payments.test.mjs` › Stripe-hosted card and ACH settle once (settlement/return, fees, tips/payroll, dashboard, collected tax, aging, receipt/provider timeline, Activity/export); rejects invalid callbacks and unauthorized requests (no effects, reconnect fence, uncertain Checkout replay); payment custody follows customer merge and undo and erasure (financial totals retained, provider/session references removed); `tests/browser/receivables.spec.ts` › confirmed payment and ACH return (Today, aging, tax, invoice and property-history screens at 1440/390) | Only test-mode owner-created invoice Checkout exists. Customer-scoped hosted access required by RL-106, customer-selected tips, wallet proof, deposits and agreement payments, surcharge/disclosure, uncertain Checkout reconciliation and archive/restore proof remain. Live activation is disabled; RL-106 resolves policy authority without proving the customer door. |
| `PAY-018` | Provider settlement and payment custody | target | partial | `tests/api/payments.test.mjs` › Stripe-hosted card and ACH settle once (settlement/return, fees, tips/payroll, dashboard, collected tax, aging, receipt/provider timeline, Activity/export); rejects invalid callbacks and unauthorized requests (no effects, reconnect fence, uncertain Checkout replay); payment custody follows customer merge and undo and erasure (financial totals retained, provider/session references removed); `tests/browser/receivables.spec.ts` › confirmed payment and ACH return (Today, aging, tax, invoice and property-history screens at 1440/390) | Only test-mode owner-created invoice Checkout exists. Customer-scoped hosted access required by RL-106, customer-selected tips, wallet proof, deposits and agreement payments, surcharge/disclosure, uncertain Checkout reconciliation and archive/restore proof remain. Live activation is disabled; RL-106 resolves policy authority without proving the customer door. |
| `PAY-019` | Payment ownership and erasure | target | partial | `tests/api/payments.test.mjs` › Stripe-hosted card and ACH settle once (settlement/return, fees, tips/payroll, dashboard, collected tax, aging, receipt/provider timeline, Activity/export); rejects invalid callbacks and unauthorized requests (no effects, reconnect fence, uncertain Checkout replay); payment custody follows customer merge and undo and erasure (financial totals retained, provider/session references removed); `tests/browser/receivables.spec.ts` › confirmed payment and ACH return (Today, aging, tax, invoice and property-history screens at 1440/390) | Only test-mode owner-created invoice Checkout exists. Customer-scoped hosted access required by RL-106, customer-selected tips, wallet proof, deposits and agreement payments, surcharge/disclosure, uncertain Checkout reconciliation and archive/restore proof remain. Live activation is disabled; RL-106 resolves policy authority without proving the customer door. |
| `PAY-020` | Tip preferences and receipt recovery | target | partial | `tests/api/payments.test.mjs` › Stripe-hosted card and ACH settle once (settlement/return, fees, tips/payroll, dashboard, collected tax, aging, receipt/provider timeline, Activity/export); rejects invalid callbacks and unauthorized requests (no effects, reconnect fence, uncertain Checkout replay); payment custody follows customer merge and undo and erasure (financial totals retained, provider/session references removed); `tests/browser/receivables.spec.ts` › confirmed payment and ACH return (Today, aging, tax, invoice and property-history screens at 1440/390) | Only test-mode owner-created invoice Checkout exists. Customer-scoped hosted access required by RL-106, customer-selected tips, wallet proof, deposits and agreement payments, surcharge/disclosure, uncertain Checkout reconciliation and archive/restore proof remain. Live activation is disabled; RL-106 resolves policy authority without proving the customer door. |
| `PAY-004` | Partial payments, balances, refunds and credits | target | done | `tests/api/payments.test.mjs` › the two PAY-004 flows (three installments/check/refund; invoice/customer/credit/aging/dashboard/brief; receipt provider outcomes and Activity/export; pending/uncertain refund safety); `tests/browser/receivables.spec.ts` › PAY-004 office payment and original-method refund controls (own screens at 1440/390); `tests/api/customer-quotes.test.mjs` › QUOTE-003 frozen signed deposit (job-held payment and final invoice allocation) | PAY-009 inherits keyed/saved-method entry obligations |
| `PAY-021` | Receipt and customer-credit allocation | target | done | `tests/api/payments.test.mjs` › the two PAY-004 flows (three installments/check/refund; invoice/customer/credit/aging/dashboard/brief; receipt provider outcomes and Activity/export; pending/uncertain refund safety); `tests/browser/receivables.spec.ts` › PAY-004 office payment and original-method refund controls (own screens at 1440/390); `tests/api/customer-quotes.test.mjs` › QUOTE-003 frozen signed deposit (job-held payment and final invoice allocation) | PAY-009 inherits keyed/saved-method entry obligations |
| `PAY-022` | Receipt and downstream payment inheritance | target | done | `tests/api/payments.test.mjs` › the two PAY-004 flows (three installments/check/refund; invoice/customer/credit/aging/dashboard/brief; receipt provider outcomes and Activity/export; pending/uncertain refund safety); `tests/browser/receivables.spec.ts` › PAY-004 office payment and original-method refund controls (own screens at 1440/390); `tests/api/customer-quotes.test.mjs` › QUOTE-003 frozen signed deposit (job-held payment and final invoice allocation) | PAY-009 inherits keyed/saved-method entry obligations |
| `PAY-023` | Original-method refunds | target | done | `tests/api/payments.test.mjs` › the two PAY-004 flows (three installments/check/refund; invoice/customer/credit/aging/dashboard/brief; receipt provider outcomes and Activity/export; pending/uncertain refund safety); `tests/browser/receivables.spec.ts` › PAY-004 office payment and original-method refund controls (own screens at 1440/390); `tests/api/customer-quotes.test.mjs` › QUOTE-003 frozen signed deposit (job-held payment and final invoice allocation) | PAY-009 inherits keyed/saved-method entry obligations |
| `PAY-006` | Consumer financing through Wisetack | target | partial | `tests/api/customer-quotes.test.mjs` › PAY-006 customer explicitly applies for a $9,800 chosen quote (consent/minimal data, provider decision/offer/funding, exact signed invoice, original-method refund, Activity/export/history/erasure) | Live merchant setup gates production activation only; fake-provider and browser evidence is not live financing proof. RL-107 resolves the explicit customer-choice, owner-issued quote-link policy hold; status remains partial. |
| `PAY-024` | Financing funding and custody | target | partial | `tests/api/customer-quotes.test.mjs` › PAY-006 customer explicitly applies for a $9,800 chosen quote (consent/minimal data, provider decision/offer/funding, exact signed invoice, original-method refund, Activity/export/history/erasure) | Live merchant setup gates production activation only; fake-provider and browser evidence is not live financing proof. RL-107 resolves the explicit customer-choice, owner-issued quote-link policy hold; status remains partial. |
| `PAY-007` | Payouts and reconciliation | target | done | `tests/api/payments.test.mjs` › PAY-007 six confirmed payments, refund and fees (cent reconciliation, missing source, owner-reviewed manual allocation, cash/check batches, eligible Instant Payout and explicit fee, actual fee mismatch, replay/source reuse, Activity/export/erasure); `tests/browser/receivables.spec.ts` › PAY-007 owner inspects unmatched payouts (controls/fee confirmation/batches, 1440/390) | |
| `PAY-025` | Cash and check deposit batches | target | done | `tests/api/payments.test.mjs` › PAY-007 six confirmed payments, refund and fees (cent reconciliation, missing source, owner-reviewed manual allocation, cash/check batches, eligible Instant Payout and explicit fee, actual fee mismatch, replay/source reuse, Activity/export/erasure); `tests/browser/receivables.spec.ts` › PAY-007 owner inspects unmatched payouts (controls/fee confirmation/batches, 1440/390) | |
| `PAY-026` | Instant payout preview and execution | target | done | `tests/api/payments.test.mjs` › PAY-007 six confirmed payments, refund and fees (cent reconciliation, missing source, owner-reviewed manual allocation, cash/check batches, eligible Instant Payout and explicit fee, actual fee mismatch, replay/source reuse, Activity/export/erasure); `tests/browser/receivables.spec.ts` › PAY-007 owner inspects unmatched payouts (controls/fee confirmation/batches, 1440/390) | |
| `PAY-008` | Saved payment methods and autopay with consent | target | partial | `tests/api/recurring-billing.test.mjs` › “PAY-008 explicit Owner test charges bind customer permission to a monthly rule and cap, settle once, and stop on withdrawal or rule change” reports proof of retained source, exact wording, time and rule-specific consent, three frozen $240 monthly invoices, explicit test charges once each, authenticated settlement, a declined second charge without retry, cap and role refusals, withdrawal, changed-rule refusal, owner-only consent evidence and attributable Activity and business export. This is repository-reported evidence, not independently executed by CT. This is preparatory explicit execution, not automatic renewal, receipt, update-link or dunning completion. | Customer-side saved-card setup and bank authorization; automatic agreement renewals and recurring charges; receipts, failed-charge update links and PLAN-003 dunning with recovery; per-visit and on-close charge proof; and customer-facing 1440 and 390 journeys remain unbuilt. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. PAY-008 stays PARTIAL. |
| `PAY-027` | Saved-card permission versions | target | partial | `tests/api/recurring-billing.test.mjs` › “PAY-008 explicit Owner test charges bind customer permission to a monthly rule and cap, settle once, and stop on withdrawal or rule change” reports proof of retained source, exact wording, time and rule-specific consent, three frozen $240 monthly invoices, explicit test charges once each, authenticated settlement, a declined second charge without retry, cap and role refusals, withdrawal, changed-rule refusal, owner-only consent evidence and attributable Activity and business export. This is repository-reported evidence, not independently executed by CT. This is preparatory explicit execution, not automatic renewal, receipt, update-link or dunning completion. | Customer-side saved-card setup and bank authorization; automatic agreement renewals and recurring charges; receipts, failed-charge update links and PLAN-003 dunning with recovery; per-visit and on-close charge proof; and customer-facing 1440 and 390 journeys remain unbuilt. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. PAY-008 stays PARTIAL. |
| `PAY-028` | Exact-invoice saved-card execution | target | partial | `tests/api/recurring-billing.test.mjs` › “PAY-008 explicit Owner test charges bind customer permission to a monthly rule and cap, settle once, and stop on withdrawal or rule change” reports proof of retained source, exact wording, time and rule-specific consent, three frozen $240 monthly invoices, explicit test charges once each, authenticated settlement, a declined second charge without retry, cap and role refusals, withdrawal, changed-rule refusal, owner-only consent evidence and attributable Activity and business export. This is repository-reported evidence, not independently executed by CT. This is preparatory explicit execution, not automatic renewal, receipt, update-link or dunning completion. | Customer-side saved-card setup and bank authorization; automatic agreement renewals and recurring charges; receipts, failed-charge update links and PLAN-003 dunning with recovery; per-visit and on-close charge proof; and customer-facing 1440 and 390 journeys remain unbuilt. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. PAY-008 stays PARTIAL. |
| `PAY-029` | Saved-card refusal has no financial effect | target | partial | `tests/api/recurring-billing.test.mjs` › “PAY-008 explicit Owner test charges bind customer permission to a monthly rule and cap, settle once, and stop on withdrawal or rule change” reports proof of retained source, exact wording, time and rule-specific consent, three frozen $240 monthly invoices, explicit test charges once each, authenticated settlement, a declined second charge without retry, cap and role refusals, withdrawal, changed-rule refusal, owner-only consent evidence and attributable Activity and business export. This is repository-reported evidence, not independently executed by CT. This is preparatory explicit execution, not automatic renewal, receipt, update-link or dunning completion. | Customer-side saved-card setup and bank authorization; automatic agreement renewals and recurring charges; receipts, failed-charge update links and PLAN-003 dunning with recovery; per-visit and on-close charge proof; and customer-facing 1440 and 390 journeys remain unbuilt. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. PAY-008 stays PARTIAL. |
| `PAY-030` | Saved-card outcome and restore custody | target | partial | `tests/api/recurring-billing.test.mjs` › “PAY-008 explicit Owner test charges bind customer permission to a monthly rule and cap, settle once, and stop on withdrawal or rule change” reports proof of retained source, exact wording, time and rule-specific consent, three frozen $240 monthly invoices, explicit test charges once each, authenticated settlement, a declined second charge without retry, cap and role refusals, withdrawal, changed-rule refusal, owner-only consent evidence and attributable Activity and business export. This is repository-reported evidence, not independently executed by CT. This is preparatory explicit execution, not automatic renewal, receipt, update-link or dunning completion. | Customer-side saved-card setup and bank authorization; automatic agreement renewals and recurring charges; receipts, failed-charge update links and PLAN-003 dunning with recovery; per-visit and on-close charge proof; and customer-facing 1440 and 390 journeys remain unbuilt. Approved with riders: the CT preparatory policy above governs; implementation of every rider is not established. PAY-008 stays PARTIAL. |
| `LEDGER-001` | QuickBooks Online sync | target | partial | `tests/api/quickbooks.test.mjs` › “QuickBooks sync posts mapped customer, frozen invoice, payment and refund once; a rejected item is repaired and retried with secret-free history” proves verified existing customer and item mappings, customer and item updates, approved invoice transport, payment and full refund transport, replay on a later date without another post, repeated customer edits including return to an earlier value, provider rejection shown on the record, repair and retry, frozen branch tax of $11.32 and total $164.83 after settings changes, a 30% discount with $30.30 non-taxable and $35.49 taxable allocation, payment echo suppression, role refusal, disconnect, and attributable provider references in Activity and business export without the access token. › “QuickBooks property sub-customers receive separate invoices and one parent payment settles both without replay or unknown-send duplicates” proves two mapped sub-customers billed through their parent, each invoice posted to its property, one parent payment read back onto both invoice balances, exact collected tax, property history, readback replay, uncertain-send refusal and exact-reference reconciliation without another post. › “QuickBooks first-post review refuses unconfirmed links and duplicate invoices; provider facts survive owner withdrawal without allowing another send” proves explicit first-post confirmation, duplicate document refusal, linking an existing invoice, payment against that reference, and recording the authorized in-flight provider result after the initiating person loses Owner authority. `tests/browser/quickbooks.spec.ts` › “QuickBooks owner connects and maps existing records, repairs a rejected invoice, syncs once and reads its payment at 1440 and 390” proves the owner settings, verified maps, confirmation, rejection, explicit retry, replay, uncertain-send reconciliation and one parent payment displayed as the correct allocation on each property invoice in the built application at both widths. `tests/api/quickbooks.test.mjs` › “QuickBooks mapped fixed discount item and document discount preserve accepted taxable and non-taxable cents at the provider edge” proves the mapped negative discount item, document discount and frozen $15.59 tax with a $230.69 total. › “QuickBooks rejection messages follow customer export and erasure without credentials or a surviving personal outbox payload” proves access-token redaction, customer export, erasure during an in-flight provider refusal, suppression of late personal outcomes and post-erasure send refusal. Existing PLAN-005 date inheritance remains proved by `tests/api/recurring-billing.test.mjs` and `tests/browser/recurring-billing.spec.ts`. | Production OAuth authorization and token refresh, owner account activation, automatic customer and item discovery and the complete LEDGER-004 reviewed matching plan, creating approved unmatched records, Stripe fees and deposits, partial refunds, refund readback, changed imported payments, posted-invoice corrections, and recovery after an interrupted in-flight send remain unbuilt or unproved. Live automated-sales-tax jurisdiction and taxable-basis reconciliation remain unverified. Only sandbox companies with manually verified existing records are supported. The owner must authorize the production Intuit app and company after production connection support ships; no live provider call or activation is claimed. LEDGER-001 remains PARTIAL. |
| `LEDGER-005` | Verified QuickBooks tax and property links | target | partial | `tests/api/quickbooks.test.mjs` › “QuickBooks sync posts mapped customer, frozen invoice, payment and refund once; a rejected item is repaired and retried with secret-free history” proves verified existing customer and item mappings, customer and item updates, approved invoice transport, payment and full refund transport, replay on a later date without another post, repeated customer edits including return to an earlier value, provider rejection shown on the record, repair and retry, frozen branch tax of $11.32 and total $164.83 after settings changes, a 30% discount with $30.30 non-taxable and $35.49 taxable allocation, payment echo suppression, role refusal, disconnect, and attributable provider references in Activity and business export without the access token. › “QuickBooks property sub-customers receive separate invoices and one parent payment settles both without replay or unknown-send duplicates” proves two mapped sub-customers billed through their parent, each invoice posted to its property, one parent payment read back onto both invoice balances, exact collected tax, property history, readback replay, uncertain-send refusal and exact-reference reconciliation without another post. › “QuickBooks first-post review refuses unconfirmed links and duplicate invoices; provider facts survive owner withdrawal without allowing another send” proves explicit first-post confirmation, duplicate document refusal, linking an existing invoice, payment against that reference, and recording the authorized in-flight provider result after the initiating person loses Owner authority. `tests/browser/quickbooks.spec.ts` › “QuickBooks owner connects and maps existing records, repairs a rejected invoice, syncs once and reads its payment at 1440 and 390” proves the owner settings, verified maps, confirmation, rejection, explicit retry, replay, uncertain-send reconciliation and one parent payment displayed as the correct allocation on each property invoice in the built application at both widths. `tests/api/quickbooks.test.mjs` › “QuickBooks mapped fixed discount item and document discount preserve accepted taxable and non-taxable cents at the provider edge” proves the mapped negative discount item, document discount and frozen $15.59 tax with a $230.69 total. › “QuickBooks rejection messages follow customer export and erasure without credentials or a surviving personal outbox payload” proves access-token redaction, customer export, erasure during an in-flight provider refusal, suppression of late personal outcomes and post-erasure send refusal. Existing PLAN-005 date inheritance remains proved by `tests/api/recurring-billing.test.mjs` and `tests/browser/recurring-billing.spec.ts`. | Production OAuth authorization and token refresh, owner account activation, automatic customer and item discovery and the complete LEDGER-004 reviewed matching plan, creating approved unmatched records, Stripe fees and deposits, partial refunds, refund readback, changed imported payments, posted-invoice corrections, and recovery after an interrupted in-flight send remain unbuilt or unproved. Live automated-sales-tax jurisdiction and taxable-basis reconciliation remain unverified. Only sandbox companies with manually verified existing records are supported. The owner must authorize the production Intuit app and company after production connection support ships; no live provider call or activation is claimed. LEDGER-001 remains PARTIAL. |
| `LEDGER-006` | QuickBooks posting and readback recovery | target | partial | `tests/api/quickbooks.test.mjs` › “QuickBooks sync posts mapped customer, frozen invoice, payment and refund once; a rejected item is repaired and retried with secret-free history” proves verified existing customer and item mappings, customer and item updates, approved invoice transport, payment and full refund transport, replay on a later date without another post, repeated customer edits including return to an earlier value, provider rejection shown on the record, repair and retry, frozen branch tax of $11.32 and total $164.83 after settings changes, a 30% discount with $30.30 non-taxable and $35.49 taxable allocation, payment echo suppression, role refusal, disconnect, and attributable provider references in Activity and business export without the access token. › “QuickBooks property sub-customers receive separate invoices and one parent payment settles both without replay or unknown-send duplicates” proves two mapped sub-customers billed through their parent, each invoice posted to its property, one parent payment read back onto both invoice balances, exact collected tax, property history, readback replay, uncertain-send refusal and exact-reference reconciliation without another post. › “QuickBooks first-post review refuses unconfirmed links and duplicate invoices; provider facts survive owner withdrawal without allowing another send” proves explicit first-post confirmation, duplicate document refusal, linking an existing invoice, payment against that reference, and recording the authorized in-flight provider result after the initiating person loses Owner authority. `tests/browser/quickbooks.spec.ts` › “QuickBooks owner connects and maps existing records, repairs a rejected invoice, syncs once and reads its payment at 1440 and 390” proves the owner settings, verified maps, confirmation, rejection, explicit retry, replay, uncertain-send reconciliation and one parent payment displayed as the correct allocation on each property invoice in the built application at both widths. `tests/api/quickbooks.test.mjs` › “QuickBooks mapped fixed discount item and document discount preserve accepted taxable and non-taxable cents at the provider edge” proves the mapped negative discount item, document discount and frozen $15.59 tax with a $230.69 total. › “QuickBooks rejection messages follow customer export and erasure without credentials or a surviving personal outbox payload” proves access-token redaction, customer export, erasure during an in-flight provider refusal, suppression of late personal outcomes and post-erasure send refusal. Existing PLAN-005 date inheritance remains proved by `tests/api/recurring-billing.test.mjs` and `tests/browser/recurring-billing.spec.ts`. | Production OAuth authorization and token refresh, owner account activation, automatic customer and item discovery and the complete LEDGER-004 reviewed matching plan, creating approved unmatched records, Stripe fees and deposits, partial refunds, refund readback, changed imported payments, posted-invoice corrections, and recovery after an interrupted in-flight send remain unbuilt or unproved. Live automated-sales-tax jurisdiction and taxable-basis reconciliation remain unverified. Only sandbox companies with manually verified existing records are supported. The owner must authorize the production Intuit app and company after production connection support ships; no live provider call or activation is claimed. LEDGER-001 remains PARTIAL. |
| `LEDGER-007` | QuickBooks production and automation boundary | target | partial | `tests/api/quickbooks.test.mjs` › “QuickBooks sync posts mapped customer, frozen invoice, payment and refund once; a rejected item is repaired and retried with secret-free history” proves verified existing customer and item mappings, customer and item updates, approved invoice transport, payment and full refund transport, replay on a later date without another post, repeated customer edits including return to an earlier value, provider rejection shown on the record, repair and retry, frozen branch tax of $11.32 and total $164.83 after settings changes, a 30% discount with $30.30 non-taxable and $35.49 taxable allocation, payment echo suppression, role refusal, disconnect, and attributable provider references in Activity and business export without the access token. › “QuickBooks property sub-customers receive separate invoices and one parent payment settles both without replay or unknown-send duplicates” proves two mapped sub-customers billed through their parent, each invoice posted to its property, one parent payment read back onto both invoice balances, exact collected tax, property history, readback replay, uncertain-send refusal and exact-reference reconciliation without another post. › “QuickBooks first-post review refuses unconfirmed links and duplicate invoices; provider facts survive owner withdrawal without allowing another send” proves explicit first-post confirmation, duplicate document refusal, linking an existing invoice, payment against that reference, and recording the authorized in-flight provider result after the initiating person loses Owner authority. `tests/browser/quickbooks.spec.ts` › “QuickBooks owner connects and maps existing records, repairs a rejected invoice, syncs once and reads its payment at 1440 and 390” proves the owner settings, verified maps, confirmation, rejection, explicit retry, replay, uncertain-send reconciliation and one parent payment displayed as the correct allocation on each property invoice in the built application at both widths. `tests/api/quickbooks.test.mjs` › “QuickBooks mapped fixed discount item and document discount preserve accepted taxable and non-taxable cents at the provider edge” proves the mapped negative discount item, document discount and frozen $15.59 tax with a $230.69 total. › “QuickBooks rejection messages follow customer export and erasure without credentials or a surviving personal outbox payload” proves access-token redaction, customer export, erasure during an in-flight provider refusal, suppression of late personal outcomes and post-erasure send refusal. Existing PLAN-005 date inheritance remains proved by `tests/api/recurring-billing.test.mjs` and `tests/browser/recurring-billing.spec.ts`. | Production OAuth authorization and token refresh, owner account activation, automatic customer and item discovery and the complete LEDGER-004 reviewed matching plan, creating approved unmatched records, Stripe fees and deposits, partial refunds, refund readback, changed imported payments, posted-invoice corrections, and recovery after an interrupted in-flight send remain unbuilt or unproved. Live automated-sales-tax jurisdiction and taxable-basis reconciliation remain unverified. Only sandbox companies with manually verified existing records are supported. The owner must authorize the production Intuit app and company after production connection support ships; no live provider call or activation is claimed. LEDGER-001 remains PARTIAL. |
| `LEDGER-002` | Xero sync | target | partial | `tests/api/xero.test.mjs` › “Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes” proves bounded complete-page reads for contacts and invoices, whole-list items, rejection of duplicate or malformed pages and later-page failure, explicit existing billing-contact and sales-item links with verified income accounts and revenue tax types, duplicate-link and stale-review refusals, same-tenant retention and different-tenant review, Owner-only commands and read custody, customer export and erasure, and attributable provider references without credentials. This is local link review, not accounting sync or first-post authorization. `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` retain the sales-invoice CSV. Conditional company-policy evidence: tests/api/xero.test.mjs, “Xero company policy defaults to no effects and isolates allow, review, approve and block decisions”; tests/api/quickbooks.test.mjs, “Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts” and “Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations”; tests/browser/quickbooks.spec.ts, “Xero remittance shows each property invoice allocation and refuses unsupported refund controls”. Additional Xero tests retain concurrent reservation, authority withdrawal and in-flight erasure assertions. The conditional fake proves exact frozen cents, current approved drafts, receipt-date tax allocation, two-property readback and replay; it does not prove live accounting or bank settlement. The inspection regression in `tests/api/quickbooks.test.mjs` also proves active-only contacts (including GDPRREQUEST, absent and unknown-status refusals), attributed inspection, token replacement, exact existing sales-invoice customer/number/USD-total/state validation, duplicate links, confirmation-time revalidation, retained verifying and confirming Owner/time, and Owner-only link custody. Invoice links use main's version-bound explicit mapping and fingerprint review; replacing a billing contact invalidates its dependent invoice links. No provider write is authorized. | Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL. |
| `LEDGER-008` | QuickBooks-style hierarchy is not assumed in Xero | target | partial | `tests/api/xero.test.mjs` › “Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes” proves bounded complete-page reads for contacts and invoices, whole-list items, rejection of duplicate or malformed pages and later-page failure, explicit existing billing-contact and sales-item links with verified income accounts and revenue tax types, duplicate-link and stale-review refusals, same-tenant retention and different-tenant review, Owner-only commands and read custody, customer export and erasure, and attributable provider references without credentials. This is local link review, not accounting sync or first-post authorization. `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` retain the sales-invoice CSV. Conditional company-policy evidence: tests/api/xero.test.mjs, “Xero company policy defaults to no effects and isolates allow, review, approve and block decisions”; tests/api/quickbooks.test.mjs, “Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts” and “Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations”; tests/browser/quickbooks.spec.ts, “Xero remittance shows each property invoice allocation and refuses unsupported refund controls”. Additional Xero tests retain concurrent reservation, authority withdrawal and in-flight erasure assertions. The conditional fake proves exact frozen cents, current approved drafts, receipt-date tax allocation, two-property readback and replay; it does not prove live accounting or bank settlement. The inspection regression in `tests/api/quickbooks.test.mjs` also proves active-only contacts (including GDPRREQUEST, absent and unknown-status refusals), attributed inspection, token replacement, exact existing sales-invoice customer/number/USD-total/state validation, duplicate links, confirmation-time revalidation, retained verifying and confirming Owner/time, and Owner-only link custody. Invoice links use main's version-bound explicit mapping and fingerprint review; replacing a billing contact invalidates its dependent invoice links. No provider write is authorized. | Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL. |
| `LEDGER-009` | Xero inspection custody | target | partial | `tests/api/xero.test.mjs` › “Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes” proves bounded complete-page reads for contacts and invoices, whole-list items, rejection of duplicate or malformed pages and later-page failure, explicit existing billing-contact and sales-item links with verified income accounts and revenue tax types, duplicate-link and stale-review refusals, same-tenant retention and different-tenant review, Owner-only commands and read custody, customer export and erasure, and attributable provider references without credentials. This is local link review, not accounting sync or first-post authorization. `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` retain the sales-invoice CSV. Conditional company-policy evidence: tests/api/xero.test.mjs, “Xero company policy defaults to no effects and isolates allow, review, approve and block decisions”; tests/api/quickbooks.test.mjs, “Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts” and “Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations”; tests/browser/quickbooks.spec.ts, “Xero remittance shows each property invoice allocation and refuses unsupported refund controls”. Additional Xero tests retain concurrent reservation, authority withdrawal and in-flight erasure assertions. The conditional fake proves exact frozen cents, current approved drafts, receipt-date tax allocation, two-property readback and replay; it does not prove live accounting or bank settlement. The inspection regression in `tests/api/quickbooks.test.mjs` also proves active-only contacts (including GDPRREQUEST, absent and unknown-status refusals), attributed inspection, token replacement, exact existing sales-invoice customer/number/USD-total/state validation, duplicate links, confirmation-time revalidation, retained verifying and confirming Owner/time, and Owner-only link custody. Invoice links use main's version-bound explicit mapping and fingerprint review; replacing a billing contact invalidates its dependent invoice links. No provider write is authorized. | Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL. |
| `LEDGER-010` | Xero property and parent allocation | target | partial | `tests/api/xero.test.mjs` › “Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes” proves bounded complete-page reads for contacts and invoices, whole-list items, rejection of duplicate or malformed pages and later-page failure, explicit existing billing-contact and sales-item links with verified income accounts and revenue tax types, duplicate-link and stale-review refusals, same-tenant retention and different-tenant review, Owner-only commands and read custody, customer export and erasure, and attributable provider references without credentials. This is local link review, not accounting sync or first-post authorization. `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` retain the sales-invoice CSV. Conditional company-policy evidence: tests/api/xero.test.mjs, “Xero company policy defaults to no effects and isolates allow, review, approve and block decisions”; tests/api/quickbooks.test.mjs, “Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts” and “Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations”; tests/browser/quickbooks.spec.ts, “Xero remittance shows each property invoice allocation and refuses unsupported refund controls”. Additional Xero tests retain concurrent reservation, authority withdrawal and in-flight erasure assertions. The conditional fake proves exact frozen cents, current approved drafts, receipt-date tax allocation, two-property readback and replay; it does not prove live accounting or bank settlement. The inspection regression in `tests/api/quickbooks.test.mjs` also proves active-only contacts (including GDPRREQUEST, absent and unknown-status refusals), attributed inspection, token replacement, exact existing sales-invoice customer/number/USD-total/state validation, duplicate links, confirmation-time revalidation, retained verifying and confirming Owner/time, and Owner-only link custody. Invoice links use main's version-bound explicit mapping and fingerprint review; replacing a billing contact invalidates its dependent invoice links. No provider write is authorized. | Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL. |
| `LEDGER-011` | Xero provider capability proof boundary | target | partial | `tests/api/xero.test.mjs` › “Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes” proves bounded complete-page reads for contacts and invoices, whole-list items, rejection of duplicate or malformed pages and later-page failure, explicit existing billing-contact and sales-item links with verified income accounts and revenue tax types, duplicate-link and stale-review refusals, same-tenant retention and different-tenant review, Owner-only commands and read custody, customer export and erasure, and attributable provider references without credentials. This is local link review, not accounting sync or first-post authorization. `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` retain the sales-invoice CSV. Conditional company-policy evidence: tests/api/xero.test.mjs, “Xero company policy defaults to no effects and isolates allow, review, approve and block decisions”; tests/api/quickbooks.test.mjs, “Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts” and “Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations”; tests/browser/quickbooks.spec.ts, “Xero remittance shows each property invoice allocation and refuses unsupported refund controls”. Additional Xero tests retain concurrent reservation, authority withdrawal and in-flight erasure assertions. The conditional fake proves exact frozen cents, current approved drafts, receipt-date tax allocation, two-property readback and replay; it does not prove live accounting or bank settlement. The inspection regression in `tests/api/quickbooks.test.mjs` also proves active-only contacts (including GDPRREQUEST, absent and unknown-status refusals), attributed inspection, token replacement, exact existing sales-invoice customer/number/USD-total/state validation, duplicate links, confirmation-time revalidation, retained verifying and confirming Owner/time, and Owner-only link custody. Invoice links use main's version-bound explicit mapping and fingerprint review; replacing a billing contact invalidates its dependent invoice links. No provider write is authorized. | Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL. |
| `LEDGER-012` | Xero reviewed mappings | target | partial | `tests/api/xero.test.mjs` › “Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes” proves bounded complete-page reads for contacts and invoices, whole-list items, rejection of duplicate or malformed pages and later-page failure, explicit existing billing-contact and sales-item links with verified income accounts and revenue tax types, duplicate-link and stale-review refusals, same-tenant retention and different-tenant review, Owner-only commands and read custody, customer export and erasure, and attributable provider references without credentials. This is local link review, not accounting sync or first-post authorization. `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` retain the sales-invoice CSV. Conditional company-policy evidence: tests/api/xero.test.mjs, “Xero company policy defaults to no effects and isolates allow, review, approve and block decisions”; tests/api/quickbooks.test.mjs, “Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts” and “Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations”; tests/browser/quickbooks.spec.ts, “Xero remittance shows each property invoice allocation and refuses unsupported refund controls”. Additional Xero tests retain concurrent reservation, authority withdrawal and in-flight erasure assertions. The conditional fake proves exact frozen cents, current approved drafts, receipt-date tax allocation, two-property readback and replay; it does not prove live accounting or bank settlement. The inspection regression in `tests/api/quickbooks.test.mjs` also proves active-only contacts (including GDPRREQUEST, absent and unknown-status refusals), attributed inspection, token replacement, exact existing sales-invoice customer/number/USD-total/state validation, duplicate links, confirmation-time revalidation, retained verifying and confirming Owner/time, and Owner-only link custody. Invoice links use main's version-bound explicit mapping and fingerprint review; replacing a billing contact invalidates its dependent invoice links. No provider write is authorized. | Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL. |
| `LEDGER-013` | Xero company action policy | target | partial | `tests/api/xero.test.mjs` › “Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes” proves bounded complete-page reads for contacts and invoices, whole-list items, rejection of duplicate or malformed pages and later-page failure, explicit existing billing-contact and sales-item links with verified income accounts and revenue tax types, duplicate-link and stale-review refusals, same-tenant retention and different-tenant review, Owner-only commands and read custody, customer export and erasure, and attributable provider references without credentials. This is local link review, not accounting sync or first-post authorization. `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` retain the sales-invoice CSV. Conditional company-policy evidence: tests/api/xero.test.mjs, “Xero company policy defaults to no effects and isolates allow, review, approve and block decisions”; tests/api/quickbooks.test.mjs, “Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts” and “Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations”; tests/browser/quickbooks.spec.ts, “Xero remittance shows each property invoice allocation and refuses unsupported refund controls”. Additional Xero tests retain concurrent reservation, authority withdrawal and in-flight erasure assertions. The conditional fake proves exact frozen cents, current approved drafts, receipt-date tax allocation, two-property readback and replay; it does not prove live accounting or bank settlement. The inspection regression in `tests/api/quickbooks.test.mjs` also proves active-only contacts (including GDPRREQUEST, absent and unknown-status refusals), attributed inspection, token replacement, exact existing sales-invoice customer/number/USD-total/state validation, duplicate links, confirmation-time revalidation, retained verifying and confirming Owner/time, and Owner-only link custody. Invoice links use main's version-bound explicit mapping and fingerprint review; replacing a billing contact invalidates its dependent invoice links. No provider write is authorized. | Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL. |
| `LEDGER-014` | Xero policy proof matrix | target | partial | `tests/api/xero.test.mjs` › “Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes” proves bounded complete-page reads for contacts and invoices, whole-list items, rejection of duplicate or malformed pages and later-page failure, explicit existing billing-contact and sales-item links with verified income accounts and revenue tax types, duplicate-link and stale-review refusals, same-tenant retention and different-tenant review, Owner-only commands and read custody, customer export and erasure, and attributable provider references without credentials. This is local link review, not accounting sync or first-post authorization. `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` retain the sales-invoice CSV. Conditional company-policy evidence: tests/api/xero.test.mjs, “Xero company policy defaults to no effects and isolates allow, review, approve and block decisions”; tests/api/quickbooks.test.mjs, “Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts” and “Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations”; tests/browser/quickbooks.spec.ts, “Xero remittance shows each property invoice allocation and refuses unsupported refund controls”. Additional Xero tests retain concurrent reservation, authority withdrawal and in-flight erasure assertions. The conditional fake proves exact frozen cents, current approved drafts, receipt-date tax allocation, two-property readback and replay; it does not prove live accounting or bank settlement. The inspection regression in `tests/api/quickbooks.test.mjs` also proves active-only contacts (including GDPRREQUEST, absent and unknown-status refusals), attributed inspection, token replacement, exact existing sales-invoice customer/number/USD-total/state validation, duplicate links, confirmation-time revalidation, retained verifying and confirming Owner/time, and Owner-only link custody. Invoice links use main's version-bound explicit mapping and fingerprint review; replacing a billing contact invalidates its dependent invoice links. No provider write is authorized. | Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. An unanswered company policy grants no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL. |
| `PLAN-001` | Recurring jobs | target | done | `src/glove/recurrence.ts`, `src/glove/commands/series.ts`, `src/glove/commands/field.ts`, `src/ui/series.tsx`, `tests/api/series.test.mjs` |  |
| `PLAN-006` | Recurring occurrence changes | target | done | `src/glove/recurrence.ts`, `src/glove/commands/series.ts`, `src/glove/commands/field.ts`, `src/ui/series.tsx`, `tests/api/series.test.mjs` |  |
| `PLAN-004` | Due-visit scheduling until done or declined | target | done | `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts` |  |
| `PLAN-007` | Due work in the owner brief | target | done | `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts` |  |
| `PLAN-008` | Due-visit desk booking | target | done | `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts` |  |
| `PLAN-009` | Customer explicit entitlement decline | target | done | `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts` |  |
| `PLAN-010` | Customer due-visit booking offers | target | done | `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts` |  |
| `PLAN-011` | Booking-offer communication history | target | done | `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts` |  |
| `PLAN-005` | Invoicing rules for recurring jobs | target | done | `tests/api/recurring-billing.test.mjs` › “PLAN-005 three months produce exactly three per-visit drafts with their own materials and three fixed monthly drafts, with skips and concurrent replay” (three-month drafts, material scope, skips, concurrency/cron and no draft accounting); › “PLAN-005 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks” (ct date rules and historical outputs); › “PLAN-005 forward prices, pauses, fixed after-visit auto-approval, on-close, as-needed and missed price review preserve exactly-once evidence” (forward rules, all modes and missed dates); `tests/browser/recurring-billing.spec.ts` › “PLAN-005 owner reviews fixed billing, changes a future price, approves a proposed monthly invoice late and pauses future billing at 1440/390” |  |
| `PLAN-012` | Recurring draft approval | target | done | `tests/api/recurring-billing.test.mjs` › “PLAN-005 three months produce exactly three per-visit drafts with their own materials and three fixed monthly drafts, with skips and concurrent replay” (three-month drafts, material scope, skips, concurrency/cron and no draft accounting); › “PLAN-005 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks” (ct date rules and historical outputs); › “PLAN-005 forward prices, pauses, fixed after-visit auto-approval, on-close, as-needed and missed price review preserve exactly-once evidence” (forward rules, all modes and missed dates); `tests/browser/recurring-billing.spec.ts` › “PLAN-005 owner reviews fixed billing, changes a future price, approves a proposed monthly invoice late and pauses future billing at 1440/390” |  |
| `PLAN-013` | Fixed-monthly invoice dates | target | done | `tests/api/recurring-billing.test.mjs` › “PLAN-005 three months produce exactly three per-visit drafts with their own materials and three fixed monthly drafts, with skips and concurrent replay” (three-month drafts, material scope, skips, concurrency/cron and no draft accounting); › “PLAN-005 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks” (ct date rules and historical outputs); › “PLAN-005 forward prices, pauses, fixed after-visit auto-approval, on-close, as-needed and missed price review preserve exactly-once evidence” (forward rules, all modes and missed dates); `tests/browser/recurring-billing.spec.ts` › “PLAN-005 owner reviews fixed billing, changes a future price, approves a proposed monthly invoice late and pauses future billing at 1440/390” |  |
| `TEAM-002` | Branches | target | done | `src/glove/branches.ts`, `src/glove/commands/branches.ts`, `src/ui/branches.tsx`, `tests/api/branches.test.mjs` |  |
| `TEAM-004` | Branch operational projections | target | done | `src/glove/branches.ts`, `src/glove/commands/branches.ts`, `src/ui/branches.tsx`, `tests/api/branches.test.mjs` |  |
| `TEAM-005` | Current branch authority | target | done | `src/glove/branches.ts`, `src/glove/commands/branches.ts`, `src/ui/branches.tsx`, `tests/api/branches.test.mjs` |  |
| `TEAM-003` | Technician commissions and bonuses | target | done | `src/glove/commissions.ts`, `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `tests/api/payroll.test.mjs` |  |
| `TEAM-006` | Commission payroll export | target | done | `src/glove/commissions.ts`, `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `tests/api/payroll.test.mjs` |  |
| `REPORT-002` | Job, revenue, technician and lead reports | target | done | `src/glove/reports.ts`, `src/glove/api.ts`, `src/ui/reports.tsx`, `tests/api/reports.test.mjs`, `src/glove/costing.ts` |  |
| `REPORT-004` | Report inherited payment and monthly dates | target | done | `src/glove/reports.ts`, `src/glove/api.ts`, `src/ui/reports.tsx`, `tests/api/reports.test.mjs`, `src/glove/costing.ts` |  |
| `MOVE-001` | Move in from the client-and-property source system | target | partial | `tests/api/movein.test.mjs` › “MOVE-001 Jobber saved responses and product CSV preview, retain recurring visits, repeat without duplicates and undo while keeping native work” (source relationships, prices and balances, exact visits and unscheduled work, inert recurrence, reconciled priced and text-only quote rows, job and non-job notes with source timestamps, inherited-note deduplication, retained original bytes and disclosed missing files, refusal of incomplete or foreign ownership, technician privacy, customer export and erasure, repeat and guarded undo); `tests/browser/movein.spec.ts` › “MOVE-004 fieldpulse, MOVE-001 Jobber and MOVE-002 Housecall Pro: owner previews, commits, reads the imported work and balance, and undoes at 1440 and 390” (Jobber preview and committed customer, request, quote and invoice source notes, originals and balances, undo); `tests/portable.mjs` (exact source records and originals restore, repeat and undo) | separate contact-person mapping, selected optional quote items and future recurring-rule mapping need a current version-labelled Jobber child schema or owner export that this installation does not hold. Public parent references do not define ContactModel fields, optional selection encoding or calendarRule encoding; authenticated GraphiQL access is required. Source recurrence remains inert and unsupported optional priced lines are refused, without invented selections. A real owner export is reconciled when available |
| `MOVE-007` | Imported recurrence proposals | target | partial | `tests/api/movein.test.mjs` › “MOVE-001 Jobber saved responses and product CSV preview, retain recurring visits, repeat without duplicates and undo while keeping native work” (source relationships, prices and balances, exact visits and unscheduled work, inert recurrence, reconciled priced and text-only quote rows, job and non-job notes with source timestamps, inherited-note deduplication, retained original bytes and disclosed missing files, refusal of incomplete or foreign ownership, technician privacy, customer export and erasure, repeat and guarded undo); `tests/browser/movein.spec.ts` › “MOVE-004 fieldpulse, MOVE-001 Jobber and MOVE-002 Housecall Pro: owner previews, commits, reads the imported work and balance, and undoes at 1440 and 390” (Jobber preview and committed customer, request, quote and invoice source notes, originals and balances, undo); `tests/portable.mjs` (exact source records and originals restore, repeat and undo) | separate contact-person mapping, selected optional quote items and future recurring-rule mapping need a current version-labelled Jobber child schema or owner export that this installation does not hold. Public parent references do not define ContactModel fields, optional selection encoding or calendarRule encoding; authenticated GraphiQL access is required. Source recurrence remains inert and unsupported optional priced lines are refused, without invented selections. A real owner export is reconciled when available |
| `MOVE-002` | Move in from the service-plan source system | target | partial | `tests/api/movein.test.mjs` › MOVE-002 Housecall Pro saved responses preview prices, balances and recurring visits, repeat unchanged and undo without removing native work; `tests/browser/movein.spec.ts` › MOVE-004 fieldpulse, MOVE-001 Jobber and MOVE-002 Housecall Pro: owner previews, commits, reads the imported work and balance, and undoes at 1440 and 390 | service plans need a documented source export or read shape with plan identity, terms and included services; estimates, separate contacts and future recurring-rule mapping remain; real owner-export proof is recorded when available |
| `MOVE-008` | Imported leads and invoice discounts | target | partial | `tests/api/movein.test.mjs` › MOVE-002 Housecall Pro saved responses preview prices, balances and recurring visits, repeat unchanged and undo without removing native work; `tests/browser/movein.spec.ts` › MOVE-004 fieldpulse, MOVE-001 Jobber and MOVE-002 Housecall Pro: owner previews, commits, reads the imported work and balance, and undoes at 1440 and 390 | service plans need a documented source export or read shape with plan identity, terms and included services; estimates, separate contacts and future recurring-rule mapping remain; real owner-export proof is recorded when available |
| `MOVE-003` | Move in from the location-and-membership source system | target | done | `tests/api/movein.test.mjs` › MOVE-003 saved exports (identity graph, balances, price book, visits, notes, originals, repeat/undo), missing parents/native edit, ongoing multi-location membership and reviewed recurrence activation; `tests/browser/movein.spec.ts` › MOVE-003 owner move-in at 1440/390; `tests/portable.mjs` › restored source records/custody and undo |  |
| `MOVE-009` | Imported memberships and recurrence proposals | target | done | `tests/api/movein.test.mjs` › MOVE-003 saved exports (identity graph, balances, price book, visits, notes, originals, repeat/undo), missing parents/native edit, ongoing multi-location membership and reviewed recurrence activation; `tests/browser/movein.spec.ts` › MOVE-003 owner move-in at 1440/390; `tests/portable.mjs` › restored source records/custody and undo |  |
| `MOVE-004` | Move in from the recurring-report source system and the additional job source system | target | partial | `tests/api/movein.test.mjs` › MOVE-004 FieldPulse/Workiz saved exports (source graph, prices, balances, occurrences, notes/originals, repeat/undo), missing-parent/native-edit flows and FieldPulse recurring report (definition, no replay, explicit activation, unmapped rules); `tests/browser/movein.spec.ts` › both provider move-in journeys at 1440/390; `tests/portable.mjs` › restored source records/custody and undo | Workiz future recurring-rule export/read encoding needed; FieldPulse recurring-report definition and guarded activation are proven |
| `MOVE-010` | Additional-source move-in and cutover | target | partial | `tests/api/movein.test.mjs` › MOVE-004 FieldPulse/Workiz saved exports (source graph, prices, balances, occurrences, notes/originals, repeat/undo), missing-parent/native-edit flows and FieldPulse recurring report (definition, no replay, explicit activation, unmapped rules); `tests/browser/movein.spec.ts` › both provider move-in journeys at 1440/390; `tests/portable.mjs` › restored source records/custody and undo | Workiz future recurring-rule export/read encoding needed; FieldPulse recurring-report definition and guarded activation are proven |
| `API-002` | Webhooks and integration tokens | target | partial | `src/glove/tokens.ts`, `src/glove/access.ts`, `src/ui/integration-tokens.tsx`, `tests/api/tokens.test.mjs`, `tests/api/security.test.mjs` | signed webhooks wait on the Base egress door with the resolved-address check (gr-base-285) |
| `API-006` | Integration policy and workflow authority | target | partial | `src/glove/tokens.ts`, `src/glove/access.ts`, `src/ui/integration-tokens.tsx`, `tests/api/tokens.test.mjs`, `tests/api/security.test.mjs` | signed webhooks wait on the Base egress door with the resolved-address check (gr-base-285) |
| `API-007` | Signed webhook delivery | target | partial | `src/glove/tokens.ts`, `src/glove/access.ts`, `src/ui/integration-tokens.tsx`, `tests/api/tokens.test.mjs`, `tests/api/security.test.mjs` | signed webhooks wait on the Base egress door with the resolved-address check (gr-base-285) |
| `API-004` | CompanyCam photos | target | done | `src/glove/commands/companycam.ts`, `src/glove/companycam/client.ts`, `src/glove/companycam/uploads.ts`, `src/ui/companycam.tsx`, `tests/api/companycam.test.mjs`, `tests/browser/companycam.spec.ts` |  |
| `API-008` | CompanyCam export and reconciliation | target | done | `src/glove/commands/companycam.ts`, `src/glove/companycam/client.ts`, `src/glove/companycam/uploads.ts`, `src/ui/companycam.tsx`, `tests/api/companycam.test.mjs`, `tests/browser/companycam.spec.ts` |  |
| `DATA-001` | Customer privacy requests and erasure | target | done | `tests/api/privacy.test.mjs` › “DATA-001 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals” (merged owner-only export/erasure, private originals, tax totals, stale preview, typed identifiers, peer field redaction, random IDs); › “DATA-001 a trusted later erasure journal refuses an older backup and a new anonymous backup restores without certificate bytes” (restore fence); › “DATA-001 imported customer erasure removes retained source copies and shared originals without changing a peer customer” (named retirement preview, peer counts and later source omissions); › “DATA-001 erasure tombstones one CSV customer while peers retain source projections and exact Undo” (tombstones, peer projection and Undo); `tests/browser/journey.spec.ts` › “DATA-001 the owner exports and explicitly erases a merged customer with durable outcomes at 1440 and 390” (download, named preview before consent and erased end state); › “DATA-001 a technician reconnects and erases cached originals and queued captures only for explicitly erased visits at 1440 and 390” (device fences); `tests/portable.mjs` (real rer older-restore refusal and anonymous restore); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (shared signed-original withdrawal, retained peer quote and unaffected byte-exact original); `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (named shared-copy preview and withdrawn customer/desk states at 1440/390). |  |
| `DATA-005` | Customer erasure inheritance | target | done | `tests/api/privacy.test.mjs` › “DATA-001 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals” (merged owner-only export/erasure, private originals, tax totals, stale preview, typed identifiers, peer field redaction, random IDs); › “DATA-001 a trusted later erasure journal refuses an older backup and a new anonymous backup restores without certificate bytes” (restore fence); › “DATA-001 imported customer erasure removes retained source copies and shared originals without changing a peer customer” (named retirement preview, peer counts and later source omissions); › “DATA-001 erasure tombstones one CSV customer while peers retain source projections and exact Undo” (tombstones, peer projection and Undo); `tests/browser/journey.spec.ts` › “DATA-001 the owner exports and explicitly erases a merged customer with durable outcomes at 1440 and 390” (download, named preview before consent and erased end state); › “DATA-001 a technician reconnects and erases cached originals and queued captures only for explicitly erased visits at 1440 and 390” (device fences); `tests/portable.mjs` (real rer older-restore refusal and anonymous restore); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (shared signed-original withdrawal, retained peer quote and unaffected byte-exact original); `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (named shared-copy preview and withdrawn customer/desk states at 1440/390). |  |
| `DATA-006` | Shared import-source erasure | target | done | `tests/api/privacy.test.mjs` › “DATA-001 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals” (merged owner-only export/erasure, private originals, tax totals, stale preview, typed identifiers, peer field redaction, random IDs); › “DATA-001 a trusted later erasure journal refuses an older backup and a new anonymous backup restores without certificate bytes” (restore fence); › “DATA-001 imported customer erasure removes retained source copies and shared originals without changing a peer customer” (named retirement preview, peer counts and later source omissions); › “DATA-001 erasure tombstones one CSV customer while peers retain source projections and exact Undo” (tombstones, peer projection and Undo); `tests/browser/journey.spec.ts` › “DATA-001 the owner exports and explicitly erases a merged customer with durable outcomes at 1440 and 390” (download, named preview before consent and erased end state); › “DATA-001 a technician reconnects and erases cached originals and queued captures only for explicitly erased visits at 1440 and 390” (device fences); `tests/portable.mjs` (real rer older-restore refusal and anonymous restore); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (shared signed-original withdrawal, retained peer quote and unaffected byte-exact original); `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (named shared-copy preview and withdrawn customer/desk states at 1440/390). |  |
| `DATA-007` | Peer redaction and device erasure fences | target | done | `tests/api/privacy.test.mjs` › “DATA-001 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals” (merged owner-only export/erasure, private originals, tax totals, stale preview, typed identifiers, peer field redaction, random IDs); › “DATA-001 a trusted later erasure journal refuses an older backup and a new anonymous backup restores without certificate bytes” (restore fence); › “DATA-001 imported customer erasure removes retained source copies and shared originals without changing a peer customer” (named retirement preview, peer counts and later source omissions); › “DATA-001 erasure tombstones one CSV customer while peers retain source projections and exact Undo” (tombstones, peer projection and Undo); `tests/browser/journey.spec.ts` › “DATA-001 the owner exports and explicitly erases a merged customer with durable outcomes at 1440 and 390” (download, named preview before consent and erased end state); › “DATA-001 a technician reconnects and erases cached originals and queued captures only for explicitly erased visits at 1440 and 390” (device fences); `tests/portable.mjs` (real rer older-restore refusal and anonymous restore); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (shared signed-original withdrawal, retained peer quote and unaffected byte-exact original); `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (named shared-copy preview and withdrawn customer/desk states at 1440/390). |  |
| `DATA-008` | Privacy delegation and agent erasure | target | done | `tests/api/privacy.test.mjs` › “DATA-001 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals” (merged owner-only export/erasure, private originals, tax totals, stale preview, typed identifiers, peer field redaction, random IDs); › “DATA-001 a trusted later erasure journal refuses an older backup and a new anonymous backup restores without certificate bytes” (restore fence); › “DATA-001 imported customer erasure removes retained source copies and shared originals without changing a peer customer” (named retirement preview, peer counts and later source omissions); › “DATA-001 erasure tombstones one CSV customer while peers retain source projections and exact Undo” (tombstones, peer projection and Undo); `tests/browser/journey.spec.ts` › “DATA-001 the owner exports and explicitly erases a merged customer with durable outcomes at 1440 and 390” (download, named preview before consent and erased end state); › “DATA-001 a technician reconnects and erases cached originals and queued captures only for explicitly erased visits at 1440 and 390” (device fences); `tests/portable.mjs` (real rer older-restore refusal and anonymous restore); `tests/api/customer-quotes.test.mjs` › “QUOTE-002 / COMM-001 the owner accepts concrete disclosure, the customer chooses the middle option and one add-on, requests a revision and signs its immutable exact copy” (shared signed-original withdrawal, retained peer quote and unaffected byte-exact original); `tests/browser/customer-quotes.spec.ts` › “QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard” (named shared-copy preview and withdrawn customer/desk states at 1440/390). |  |
| `DATA-002` | Every change, message and payment recorded | target | done | `src/glove/storage.ts`, `src/glove/timeline.ts`, `src/glove/activity.ts`, `src/ui/activity.tsx`, `tests/api/records.test.mjs`, `tests/api/segments.test.mjs`, `tests/api/push.test.mjs`, `tests/api/eligibility.test.mjs`, `tests/api/suggest.test.mjs`, `tests/api/companycam.test.mjs`, `tests/api/rules.test.mjs`, `tests/api/stock.test.mjs`, `tests/api/purchasing.test.mjs`, `tests/browser/companycam.spec.ts`, `src/glove/rules.ts` |  |
| `DATA-009` | Audit record projections and provider facts | target | done | `src/glove/storage.ts`, `src/glove/timeline.ts`, `src/glove/activity.ts`, `src/ui/activity.tsx`, `tests/api/records.test.mjs`, `tests/api/segments.test.mjs`, `tests/api/push.test.mjs`, `tests/api/eligibility.test.mjs`, `tests/api/suggest.test.mjs`, `tests/api/companycam.test.mjs`, `tests/api/rules.test.mjs`, `tests/api/stock.test.mjs`, `tests/api/purchasing.test.mjs`, `tests/browser/companycam.spec.ts`, `src/glove/rules.ts` |  |
| `DATA-010` | Future audit inheritance | target | done | `src/glove/storage.ts`, `src/glove/timeline.ts`, `src/glove/activity.ts`, `src/ui/activity.tsx`, `tests/api/records.test.mjs`, `tests/api/segments.test.mjs`, `tests/api/push.test.mjs`, `tests/api/eligibility.test.mjs`, `tests/api/suggest.test.mjs`, `tests/api/companycam.test.mjs`, `tests/api/rules.test.mjs`, `tests/api/stock.test.mjs`, `tests/api/purchasing.test.mjs`, `tests/browser/companycam.spec.ts`, `src/glove/rules.ts` |  |
| `AGENT-003` | Rebook around delays | push-further | partial | `src/glove/delays.ts`, `src/glove/commands/dispatch.ts`, `src/glove/commands/grants.ts`, `src/ui/dispatch-cards.tsx`, `tests/api/delays.test.mjs` | Old evidence asserts delay reasons, feasible move options, a dispatcher-decided move, grant-scoped same-day moves and retained arrival windows. Company-policy selection for standard moves and external customer texts is unasserted; the fixed proposal/grant paths prove neither the all-autonomous company policy nor the external send. Customer confirmation/refusal and moved-visit messaging remain COMM-002/COMM-005 proof gaps. |
| `AGENT-010` | Granted moves and customer response | push-further | partial | `src/glove/delays.ts`, `src/glove/commands/dispatch.ts`, `src/glove/commands/grants.ts`, `src/ui/dispatch-cards.tsx`, `tests/api/delays.test.mjs` | Old evidence asserts delay reasons, feasible move options, a dispatcher-decided move, grant-scoped same-day moves and retained arrival windows. Company-policy selection for standard moves and external customer texts is unasserted; the fixed proposal/grant paths prove neither the all-autonomous company policy nor the external send. Customer confirmation/refusal and moved-visit messaging remain COMM-002/COMM-005 proof gaps. |
| `AGENT-004` | Chase every invoice until paid and reconciled | push-further | partial | `src/glove/collection-agent.ts`, `src/glove/reminders.ts`, `tests/api/flows.test.mjs` | Owner-only retained payout comparison is implemented; the future agent payout authority design is unbuilt. Complete current-books discovery and fee and deposit posting readback remain unproved; retained outcomes are not fresh provider verification Gap retained after CT ruling: The present Owner-only policy is decided; separately scoped future agent payout reads remain unbuilt and unproved. Complete current-books discovery and fee and deposit posting readback remain unproved, and retained outcomes do not prove fresh provider verification. |
| `AGENT-011` | Payment inspection decision has no posting effect | push-further | partial | `src/glove/collection-agent.ts`, `src/glove/reminders.ts`, `tests/api/flows.test.mjs` | Owner-only retained payout comparison is implemented; the future agent payout authority design is unbuilt. Complete current-books discovery and fee and deposit posting readback remain unproved; retained outcomes are not fresh provider verification Gap retained after CT ruling: The present Owner-only policy is decided; separately scoped future agent payout reads remain unbuilt and unproved. Complete current-books discovery and fee and deposit posting readback remain unproved, and retained outcomes do not prove fresh provider verification. |
| `AGENT-012` | Retained payout comparison | push-further | partial | `src/glove/collection-agent.ts`, `src/glove/reminders.ts`, `tests/api/flows.test.mjs` | Owner-only retained payout comparison is implemented; the future agent payout authority design is unbuilt. Complete current-books discovery and fee and deposit posting readback remain unproved; retained outcomes are not fresh provider verification Gap retained after CT ruling: The present Owner-only policy is decided; separately scoped future agent payout reads remain unbuilt and unproved. Complete current-books discovery and fee and deposit posting readback remain unproved, and retained outcomes do not prove fresh provider verification. |
| `AGENT-013` | Payout comparison authority boundary | push-further | partial | `src/glove/collection-agent.ts`, `src/glove/reminders.ts`, `tests/api/flows.test.mjs` | Owner-only retained payout comparison is implemented; the future agent payout authority design is unbuilt. Complete current-books discovery and fee and deposit posting readback remain unproved; retained outcomes are not fresh provider verification Gap retained after CT ruling: The present Owner-only policy is decided; separately scoped future agent payout reads remain unbuilt and unproved. Complete current-books discovery and fee and deposit posting readback remain unproved, and retained outcomes do not prove fresh provider verification. |
| `AGENT-005` | Quote writer from the request | push-further | partial | `src/glove/commands/suggest.ts`, `src/ui/quotes.tsx`, `tests/api/suggest.test.mjs`, `src/glove/provider.ts` | Old evidence asserts three priced options, reasons, bounded model data and fixed Agent-role refusal to approve or send, followed by dispatcher price approval. Company-policy selection for standard drafting, commitment price decisions and external sending is unasserted; the fixed human gate does not prove the all-autonomous company policy. Authorized photo use follows BOOK-001/RL-101, whose proof boundaries remain. |
| `AGENT-014` | Quote decision classes and evidence handoff | push-further | partial | `src/glove/commands/suggest.ts`, `src/ui/quotes.tsx`, `tests/api/suggest.test.mjs`, `src/glove/provider.ts` | Old evidence asserts three priced options, reasons, bounded model data and fixed Agent-role refusal to approve or send, followed by dispatcher price approval. Company-policy selection for standard drafting, commitment price decisions and external sending is unasserted; the fixed human gate does not prove the all-autonomous company policy. Authorized photo use follows BOOK-001/RL-101, whose proof boundaries remain. |
| `AGENT-007` | Keep every maintenance agreement fulfilled | push-further | partial | `tests/api/agreements.test.mjs` — “PLAN-002 included visits consume entitlements; AGENT-007 flags only missing accepted frozen forms on twenty completed visits”; `tests/browser/due-visits.spec.ts` — the Office due-visit journey with Agent maintenance preparation | Agent-originated offers, the 20-visit offers-sent journey, 12 bookings by customer reply, chases for the remainder and renewal outreach remain unbuilt and held on owner booking and renewal policy plus pending COMM-002 and COMM-003 consent rulings. Existing agreement.offer remains desk-only. Imported completion evidence without attributable native captures remains unavailable. |
| `AGENT-015` | Maintenance inspection custody | push-further | partial | `tests/api/agreements.test.mjs` — “PLAN-002 included visits consume entitlements; AGENT-007 flags only missing accepted frozen forms on twenty completed visits”; `tests/browser/due-visits.spec.ts` — the Office due-visit journey with Agent maintenance preparation | Agent-originated offers, the 20-visit offers-sent journey, 12 bookings by customer reply, chases for the remainder and renewal outreach remain unbuilt and held on owner booking and renewal policy plus pending COMM-002 and COMM-003 consent rulings. Existing agreement.offer remains desk-only. Imported completion evidence without attributable native captures remains unavailable. |
| `AGENT-008` | Morning brief and margin watch | push-further | done | `src/glove/morning-brief.ts`, `tests/api/morning-brief.test.mjs`, `tests/browser/morning-brief.spec.ts` |  |
| `AGENT-016` | Brief delivery and financial sections | push-further | done | `src/glove/morning-brief.ts`, `tests/api/morning-brief.test.mjs`, `tests/browser/morning-brief.spec.ts` |  |
