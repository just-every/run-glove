# Glove product contract

Target edition: 17 October 2026. Glove is the field-service operating system a US plumbing, HVAC, electrical or other home and commercial service business runs instead of Jobber, Housecall Pro or ServiceTitan: every call, text and web request becomes a quoted, booked, dispatched and completed job, paid on site or online, synced to the books, and brought back through recurring maintenance agreements, with the technician's work kept through a lost signal and every step on the record.

This is a target contract. It describes the product Glove is being built towards, not only what exists today, and the [Status](#status) section marks how close the current code is. The thirteen published clauses (`GLOVE-01` to `GLOVE-12` and `HTTP-001`) are the first release, proven locally in [ACCEPTANCE.md](ACCEPTANCE.md); the target and push-further clauses are binding product requirements that build rounds work towards. Difficulty (payment providers, telephony, native apps, accounting sync) is engineering work recorded as a clause, never a reason to drop scope. A named test is a target, not evidence, until its result is recorded in ACCEPTANCE.md.

## Product target

| | |
| --- | --- |
| Category | Field service management for home and commercial service trades |
| Incumbents a buyer switches from | Jobber, Housecall Pro, ServiceTitan |
| Up-and-comers it must also beat | FieldPulse, Workiz |
| First buyer | The owner or dispatcher of a US plumbing, HVAC, electrical or other service-trade business with 2 to 25 technicians, moving from Jobber or Housecall Pro; USD, US sales tax, card and ACH, one or more US time zones, QuickBooks Online books, the owner's own Cloudflare account |
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
- **Move in and out.** Reviewed, journaled, undoable move-ins from Jobber, Housecall Pro, ServiceTitan, FieldPulse, Workiz and ServiceM8, with open balances, saved cards and autopay carried across (`GLOVE-11`, `MOVE-*`), and complete export and restore (`GLOVE-12`).
- **Let agents run the front office.** An AI front office answers calls and texts 24/7 and books into real capacity; a job agent confirms access and parts before dispatch, rebooks around delays and chases every invoice until paid and reconciled, under the owner's policy (`AGENT-*`).

### Neighboring products stay separate

Glove is one product. Where the market sells a neighboring product separately, Glove connects to it and does not rebuild it; when the neighbor is a Run Edit Run sibling, Glove links to that sibling first and to the US incumbent second.

| Job | Owned by | How Glove meets it |
| --- | --- | --- |
| Bookkeeping, the general ledger and sales-tax filing | [Pantry](https://github.com/just-every/run-pantry) (or QuickBooks Online, Xero) | Two-way sync of customers, items, invoices, payments, refunds and fees (`LEDGER-001` to `LEDGER-003`); Glove keeps no general ledger |
| Payroll, tax withholding and W-2/1099 filing | No sibling (Gusto, ADP RUN, QuickBooks Payroll) | Approved timesheets and subcontractor totals exported in the payroll provider's import shape (`COST-002`) |
| Shift scheduling for an hourly workforce | [Lanyard](https://github.com/just-every/run-lanyard) (or Deputy, Homebase) | Glove schedules jobs and job time; availability and time off can be read from Lanyard (`DISP-004`) |
| Business phone system (extensions, IVR, call center) | No sibling (RingCentral, Dialpad) | Glove answers and logs calls on its own Twilio numbers and forwards to the owner's phone system (`COMM-009`, `AGENT-001`) |
| Generic appointment booking pages | [Dial](https://github.com/just-every/run-dial) (or Calendly) | Glove's own booking into technician capacity (`BOOK-002`); Dial is not needed for jobs |
| Email marketing campaigns | [Mango](https://github.com/just-every/run-mango) (or Mailchimp) | Segments and reactivation lists pushed to Mango (`CUST-004`); Glove sends transactional messages and review requests only |
| Business website | [Pane](https://github.com/just-every/run-pane) (or Squarespace, WordPress) | An embeddable request and booking widget (`BOOK-001`, `BOOK-002`) |
| Long-form signed agreements | [Inkwell](https://github.com/just-every/run-inkwell) (or Docusign) | Quote and work-order signatures are Glove's own (`QUOTE-002`); envelope workflows stay in Inkwell |
| Multi-month construction projects | [Plinth](https://github.com/just-every/run-plinth) (or Buildertrend) | Glove handles service, repair, install and maintenance jobs; remodel project management stays in Plinth |
| In-house maintenance of a company's own assets | [Gasket](https://github.com/just-every/run-gasket) (or MaintainX) | Glove serves a business selling service to customers |
| Company-wide expense cards and reports | [Coaster](https://github.com/just-every/run-coaster) (or Expensify) | Job expenses and receipts stay on the job (`COST-003`) |
| Cross-app automation | [Crank](https://github.com/just-every/run-crank) (or Zapier, Make) | Webhooks, the API and published Crank and Zapier apps (`API-002`, `API-003`) |

## Target amendment — 17 October 2026

The owner directed on 16 October 2026 that every seed's contract describe a genuine competitor to its category's incumbents. This amendment records which published clauses the target changes. It removes no requirement, and no ID is renumbered. This round changes no code.

- **US money replaces the Australian defaults.** USD, US sales tax by jurisdiction and US business identifiers (EIN, contractor license numbers) replace AUD, 10% GST and the ABN in `GLOVE-01`, `GLOVE-03` and `GLOVE-09` (`MONEY-001`, `MONEY-002`). Existing Australian installations keep their settings.
- **Delivered messages join recorded sends.** `GLOVE-04`'s "recorded as sent" stays for sends made outside Glove; a quote, invoice or notice Glove sends itself records the provider's delivery outcome (`COMM-001`, `COMM-002`). Glove still never claims delivery without the provider saying so.
- **The customer can answer for themselves.** Besides a person recording the customer's answer (`GLOVE-04`), the customer approves and signs online (`QUOTE-002`).
- **Invoice preparation becomes invoicing and collection.** `GLOVE-09`'s approve-then-export trail stays; invoices are also sent, paid, and synced live to QuickBooks Online or Xero (`PAY-*`, `LEDGER-*`).
- **Jobs without a quote join quoted jobs.** `GLOVE-05`'s accepted-quote path stays; the desk also creates a job straight from a request, a call or the customer record and prices it on site, and books an assessment visit on a request before any quote exists (`BOOK-005`, `BOOK-006`).
- **Offline capture widens** from items queued in an open page to a cached day of jobs that survives a reload, field quotes and change orders (`GLOVE-06` → `FIELD-001`, `QUOTE-006`).
- **Agents gain bounded autonomy.** `GLOVE-10`'s "agent prepares, person approves" stays the default; the owner can grant named, revocable actions to an agent under `AGENT-009`, and every one stays on the timeline.
- **Move-in widens** from ServiceM8 to Jobber, Housecall Pro, ServiceTitan, FieldPulse and Workiz through the same import kit (`GLOVE-11` → `MOVE-*`).
- **The old "Out of the first release" list is retired.** Maps and routing, live location, SMS and email delivery, card payments, timesheets, stock and purchasing, recurring agreements and the customer portal are now target clauses. What Glove still does not do is in [Honest boundaries](#honest-boundaries).

## Operating rules

These hold for every clause, published and target.

- A new installation starts empty: no customers, prices, technicians or jobs. The owner enters real business data or moves it in.
- Each business has an operating time zone (each branch its own under `TEAM-002`). Visits are booked as local date and time and stored as exact instants; a time that does not exist (a daylight-saving gap) is refused.
- Money is exact decimal text in cents, quantities to three decimal places, and tax is rounded half up once per document. No floating point.
- Every change is a command with an identity. Sending the same identity and content again returns the first outcome; the same identity with different content, or from another person, is refused.
- Every command handler and every read door checks the signed-in person's live session and current role itself; the change then commits in one D1 batch that re-checks that session and role first. A screen hiding a button is never the control.
- Records carry versions. A change made against an older version than the current one is refused with the current record, so nobody overwrites what they did not see.
- The timeline is append-only. Captured photos, signatures and payment records are immutable; a correction is a new entry that names what it corrects.
- Glove never claims what it has no evidence for: a message is delivered only when the provider says so, a payment is paid only when the provider settles it, a technician has arrived only when their phone recorded it, and a record moved in from another system has no arrival, sign-off or payment unless the source had it.
- Provider credentials (Stripe, Twilio, email, QuickBooks Online, Google) belong to the owner, are stored as installation secrets, never travel in an export, and every external effect keeps the provider's reference so it can be reconciled.

## Decided defaults

- A new US installation uses USD, the US time zone chosen at setup and the sales-tax settings of `MONEY-001`. Installations set up before this target keep their Australian settings (AUD, 10% GST, `Australia/Sydney`).
- Quote and invoice pricing is human-approved per exact revision; no price changes without a new approval.
- Invoice numbers are `INV-0001`…; a correction exports as `INV-0001-R2`. Payment terms default to 14 days and are owner-set (due on receipt, net 15, net 30).
- The first accounting export is Xero's sales-invoice CSV columns; for the US buyer the primary accounting connection is QuickBooks Online (`LEDGER-001`).
- The first move-in kit is ServiceM8, built from the JSON its REST API object lists return; for the US buyer the next kits are Jobber and Housecall Pro (`MOVE-001`, `MOVE-002`).
- Photos are shrunk on the phone to at most 1600 px JPEG and stored up to 1.5 MB each.
- Agents work as invited sign-ins with the Agent role and the same public commands. The built-in agents (`AGENT-*`) call a model provider the owner connects with their own key; no model account is embedded.

## People and authority

| Role | Can do |
| --- | --- |
| Owner | Everything at the desk: business settings, roles, provider connections, move-in, approvals, invoices, card payments by phone or on file, refunds, agent policy. Cannot record field evidence (only a technician can). |
| Dispatcher | Customers and sites, requests, quotes (draft, revise, approve the price, record sent and the customer's answer), jobs, booking and changing visits, reviewing conflicts and late evidence, deciding agent proposals, customer messages. |
| Office | Customers and sites, requests, record a quote as sent, invoice preparation, approval, sending, export and correction, recording payments, taking card payments by phone or on a saved card (`PAY-009`), customer messages. |
| Technician | Sees only visits ever assigned to them (with those jobs' customers, sites, equipment and evidence, without prices unless the owner allows field quoting under `QUOTE-006`); records arrival, time, checklist and forms, notes, photos, materials and completion on those visits, and takes payment on site under `PAY-003`. |
| Agent | Reads the desk's records; prepares requests, quote drafts and revisions, dispatch proposals, messages and invoice drafts. Never approves, sends, records a customer's answer, books, exports, refunds or changes roles, except actions the owner granted under `AGENT-009`. |
| Viewer | Reads the desk's records. |

Target roles: custom roles built from these permissions (`TEAM-001`), a subcontractor sign-in that sees only their assigned visits (`DISP-007`), and the customer, who signs in to the customer hub by a link sent to their own email or phone and sees only their own records (`COMM-006`).

The native installation owner is always Owner. Every other person is invited and given one role by the owner; a person without a Glove role is a Viewer. Nobody can change their own role.

## First release clauses

These thirteen clauses are the published first release. Each is proven by the flow named in [ACCEPTANCE.md](ACCEPTANCE.md).

- **GLOVE-01 — Set up the business and its people.** The owner records the business (name, tax identifier, booking time zone, payment terms), a price book of services with prices before tax and their job checklists (items marked required or not), and the technicians; invites people and gives each one role; links a technician to the person who signs in. Each role can do only what the table above says, through any door. US identifiers and US sales tax are `MONEY-001` and `MONEY-002`. **Acceptance evidence:** `01 owner sets up the business, price book, team and roles` and the security matrix in `tests/api/security.test.mjs`; browser: Team screen.
- **GLOVE-02 — Customers and sites.** The desk records customers (contact, email, billing address) and the sites where work happens, with access notes. Edits apply only to the version the person saw. **Acceptance evidence:** `02 desk records a customer and the sites where work happens`; browser: Customers screen.
- **GLOVE-03 — Request to an approved quote.** A request becomes a quote of priced lines (from the price book or custom) with tax computed exactly. A person approves one exact revision's price. Any price change is a new revision that needs its own approval; earlier revisions and approvals stay on the record. **Acceptance evidence:** `03 an enquiry becomes a quote whose exact revision a person prices and approves`; browser: Quotes screen.
- **GLOVE-04 — The customer's answer, recorded honestly.** A person records how the approved quote went out (email, printed, in person, phone) without any delivery claim, and records the customer's acceptance or decline of the current revision: who answered, how (signed, email reply, phone, in person) and who recorded it. An accepted quote is frozen. **Acceptance evidence:** `04 the quote is recorded as sent and the customer acceptance with how it was given`.
- **GLOVE-05 — Book and assign the visit.** An accepted quote becomes one job carrying the accepted lines and the checklist from its services. The dispatcher books visits for a technician at local times in the business time zone. A booking that overlaps another visit for that technician is refused until the dispatcher reviews those exact conflicts and confirms. **Acceptance evidence:** `05 the accepted quote becomes a job and a visit booked for a technician in the business timezone`; browser: Dispatch screen conflict review.
- **GLOVE-06 — Field capture through a connectivity interruption.** On a phone, the assigned technician records arrival, checklist results (done, or not applicable with a reason), notes, photos and materials. Each item is kept on the phone with its capture time until the server confirms it; resending after a lost signal lands it exactly once. Photos are stored as received and readable only by people allowed to see that job. **Acceptance evidence:** `06 the technician captures checklist, notes, photos and materials through a connectivity interruption`; browser: phone offline with items waiting, then sent.
- **GLOVE-07 — Dispatch change with conflict review.** The dispatcher changes a visit's technician, date or time with a reason. The change is refused if the visit changed since they opened it, and must be reviewed when it overlaps another visit or the technician has already recorded evidence on it. Evidence that arrives from a technician after the visit moved on is kept, flagged on the visit, and reviewed by the dispatcher. Every change keeps its before and after on the record. A new technician records their own arrival; the earlier arrival stays as evidence. **Acceptance evidence:** `07 a dispatch change needs conflict review and keeps late evidence for review`.
- **GLOVE-08 — Customer completion evidence.** The technician completes a visit only after recording their arrival, and completes the job only when every required checklist item is done or not applicable with a reason. Completion carries a work summary and either the customer's name and drawn signature or why the customer could not sign. **Acceptance evidence:** `08 completion needs arrival, the required checklist and the customer sign-off or why it is missing`; browser: signature drawn on the phone.
- **GLOVE-09 — Invoice preparation, export and correction trail.** For a completed job, the office prepares an invoice from the accepted lines plus the recorded materials priced from the price book (unpriced materials must be priced explicitly), approves one exact revision, and exports every approved revision once in a CSV in Xero's sales-invoice import columns. An exported invoice is never changed: a correction is a new revision that names the revision and export it corrects, is approved, and exports as its own numbered row. Sending, payment and live sync are `PAY-001` and `LEDGER-*`. **Acceptance evidence:** `09 office prepares the invoice, approves it, exports it once and corrects it with a trail` and `a correction revised before approval still exports as its own numbered row`.
- **GLOVE-10 — Agent prepares, person approves.** An agent prepares quote drafts, dispatch proposals (job, technician, time, rationale, evidence) and invoice drafts through the same public commands. A person approves or declines each one; the approval record names what was prepared, by whom, who decided and when. An agent can never decide its own preparation or perform a person's step unless the owner granted that step under `AGENT-009`. **Acceptance evidence:** `10 an agent prepares quotes, dispatch and invoices; a person approves each and the approval is recorded`.
- **GLOVE-11 — Move in from ServiceM8 with dry run, journal and undo.** The owner previews a move-in from ServiceM8's API lists (clients and contacts, staff, jobs, activities, materials, attachments): what each source record becomes, what is merged, rejected (with the reason and location) or not used, and which attachment files are missing. Committing applies exactly the reviewed preview through Base's import kit journal, keeping every ServiceM8 ID and the exact received files. An unchanged repeat writes nothing; undo removes exactly what the move-in wrote, and refuses while later Glove work refers to it or a moved-in record was edited since. Every other move-in kit (`MOVE-*`) follows this clause. **Acceptance evidence:** `11 owner moves in from ServiceM8 with a dry run, a journaled commit and undo` and `tests/api/movein.test.mjs`.
- **GLOVE-12 — The whole timeline, exported and restorable.** Every job shows its timeline: each step, who did it in which role, with which command. The owner or office downloads the business as JSON. `rer export` and `rer import` move the complete installation (records, timeline, photos and signatures, command outcomes, move-in journal and originals) into a fresh checkout, which keeps working; a session from the old installation does not open it. **Acceptance evidence:** `12 the job timeline names every step and person, and the business export carries it`, `a job keeps its whole timeline after hundreds of later events` and `tests/portable.mjs`.

### Foundation

- **HTTP-001 — Foundation HTTP routing.** Hono serves `/health` and owns `/api` and `/api/*`; Start serves documents; unknown routes return 404. **Acceptance evidence:** the emitted-Worker runtime check `tests/runtime.mjs` in `rer verify`.

## Target clauses

Each target clause states the behavior a buyer gets, its acceptance evidence (a journey or test through a public door, with fakes only at the provider edge) and its status at the judged commit. A build round that starts a clause adds its flow to ACCEPTANCE.md and registers it in `seed.json` in the same change; IDs never change.

### US business and money

#### MONEY-001 — US dollars and sales tax.
A US installation prices in USD. The owner sets sales-tax rates by jurisdiction (state, county, city and special district combined), and each site's address selects its rate; each price-book item is taxable or not, so a state that taxes parts but not labor is expressible; a customer can be tax-exempt with an exemption certificate on file and its expiry; quotes and invoices show tax per jurisdiction. Optional Avalara AvaTax or Stripe Tax rate lookup fills rates by address; Glove calculates and records tax, it does not file returns; discounts reduce the taxable amount in the order `QUOTE-007` states.

*Acceptance:* a flow test sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites in each and for an exempt customer, and checks exact cents and the per-jurisdiction breakdown on the quote, invoice, export and QuickBooks Online payload (provider fake).

*Status:* missing — gap: money is fixed to AUD with one 10% GST rate (`src/glove/money.ts`).

#### MONEY-002 — US business identity on every document.
The business records its legal name, DBA, EIN, state contractor license numbers (by trade and state), insurance details and logo; quotes, invoices, service reports and agreements print the license numbers and terms a state requires, US address and phone formats, and US date formats. Customers record a billing and service address separately and a business customer's tax ID.

*Acceptance:* a browser journey sets EIN, two license numbers and a logo, then opens a quote, an invoice and a service report and finds each printed; the customer record keeps separate billing and service addresses through edit and export.

*Status:* partial — evidence `src/glove/commands/setup.ts`; gap: the business record holds name, ABN, phone and address only; no EIN, license numbers, logo or branded documents.

#### MONEY-003 — Price book with costs, markup and flat rates.
Every service and material carries a unit cost, a price and an optional markup rule by category, supplier part numbers, images and a description customers see; flat-rate task pricing (one price for the task, labor and parts inside) sits beside time-and-materials; the owner bulk-imports and exports the price book by CSV and updates prices in bulk by percentage.

*Acceptance:* a flow test imports a 200-line price book CSV with costs and markups, raises one category by 5%, quotes a flat-rate task and a time-and-materials line, and checks prices, costs and the round-trip export.

*Semantics (MONEY-003, 19 October 2026):* an item is a service, a material or a flat-rate task. Its price is fixed, or follows its category's markup: unit cost × (100 + markup) / 100, rounded half up to the cent, recomputed whenever the cost or the markup changes. A task's cost is the sum of its contents' costs at their quantities (each rounded half up to the cent); its contents are services and materials, never other tasks. A bulk change multiplies each fixed price in one category by (100 + percent) / 100, rounded half up to the cent; markup prices follow cost instead. A price-book quote line keeps the item's unit cost when it was priced. Costs are margin figures: technicians never read them, and a custom role reads them only with `reports.read`. The price-book CSV matches rows by Code (new, updated with the fields that change, unchanged, or rejected with its reason), is committed only as the exact preview, keeps checklists, skills and images, and ignores a markup row's Price; re-importing the export changes nothing. The customer-facing description is stored on the item; the doors that show customers documents (`QUOTE-002`, `QUOTE-005`, `COMM-006`) print it when they ship.

*Status:* done — evidence `src/glove/pricebook.ts`, `src/glove/commands/pricebook.ts`, `src/glove/commands/setup.ts`, `src/ui/price-book.tsx`, `tests/api/pricebook.test.mjs`.

### Customers, properties and equipment

#### CUST-001 — Customer and property history in one place.
A customer has several contacts and properties; each property shows every request, quote, job, visit, photo, form, invoice, payment, agreement and message ever recorded there, newest first, with a search across customers by name, phone, email and address; a business customer keeps a billing contact and an accounts-payable email apart from the site contact, and can require a purchase-order number on its invoices.

*Acceptance:* a browser journey opens a customer with two properties and finds each property's full history; a search by a phone fragment and by a street name finds them; a business customer's billing contact and accounts-payable email stay apart from its site contacts.

*Status:* done — evidence `src/glove/commands/setup.ts`, `src/glove/history.ts`, `src/ui/customers.tsx`, `src/ui/property-history.tsx`, `tests/api/customers.test.mjs`, `tests/browser/journey.spec.ts`. Payments, agreements and messages join the property history as `PAY-*`, `PLAN-*` and `COMM-*` land.

#### CUST-002 — Installed equipment and warranties.
Each property lists installed equipment (type, make, model, serial, install date, refrigerant, location in the building, photos) with manufacturer and labor warranty dates; technicians add or update equipment from the phone; every job and form links to the equipment it touched; expiring warranties appear on the property and in reports.

*Acceptance:* a flow test adds a furnace and an AC condenser to a site, records a visit against the condenser, and reads the condenser's service history and warranty state; the technician's phone shows them offline.

*Status:* done — evidence `src/glove/commands/equipment.ts`, `src/glove/equipment.ts`, `src/ui/equipment.tsx`, `tests/api/equipment.test.mjs`, `tests/browser/journey.spec.ts`.

#### CUST-003 — Customer CSV import and export.
The owner imports customers, contacts and properties from a CSV (any column order, mapped once and remembered), sees a preview of new, matched and rejected rows with reasons, and commits through the import kit journal with undo; the same records export as CSV at any time.

*Acceptance:* a flow test previews and commits a 500-row CSV with bad rows and duplicates, undoes it, and exports a CSV that re-imports unchanged.

*Semantics (CUST-003, 19 October 2026):* rows sharing a Customer ID, or without one carrying identical customer details, are one customer, each row adding one site and one other contact. A row is *matched* when its Customer ID is a Glove customer's ID or it repeats a customer an earlier CSV import created; Glove keeps a matched customer's details and contacts as they are, lists which file values differ, and adds only the site addresses it lacks. A row is *rejected*, with its spreadsheet row number and reason, when a field fails the rule `customer.save` or `site.save` applies, it has more cells than the header, it repeats an earlier row exactly, or its details differ from the first row with the same Customer ID; every other row is *new*. Without a chosen mapping Glove uses the last committed CSV's mapping when every column it names is in the file, else columns headed like Glove's own export. The export writes every live (unmerged) customer, one row per site or other contact, and puts a `'` before a cell a spreadsheet would run as a formula (import takes exactly one off), so re-importing it matches every row and writes nothing.

*Status:* done — evidence `src/glove/movein/csv.ts`, `src/glove/csv-format.ts`, `src/glove/movein/kit.ts`, `src/ui/csv-import.tsx`, `tests/api/csv.test.mjs`.

#### CUST-004 — Tags, custom fields and segments.
The owner adds custom fields to customers, properties, jobs and equipment, tags customers (for example "commercial", "VIP", "do not service"), and saves segments (customers with equipment older than ten years and no agreement); a segment can be exported or pushed to Mango or Mailchimp as an audience.

*Acceptance:* a flow test defines two custom fields and a segment, and checks that the segment's members match the filter and that the export and the Mango push (provider fake) carry exactly them.

*Status:* missing — gap: no custom fields, tags or segments.

#### CUST-005 — Duplicate detection and merge review.
Glove flags customers that share a phone number, email or normalized address, on entry, on CSV import and on move-in, and offers a merge review: what each record holds, which values win, and what moves (properties, jobs, invoices, messages); a merge is one journaled change that can be undone.

*Acceptance:* a flow test creates nine customers sharing a phone number, reviews and merges them, checks every job and invoice now hangs off the survivor, and undoes the merge.

*Status:* done — evidence `src/glove/duplicates.ts`, `src/glove/commands/merge.ts`, `src/ui/duplicates.tsx`, `src/glove/movein/kit.ts`, `src/glove/movein/csv.ts`, `tests/api/merge.test.mjs`, `tests/api/csv.test.mjs`. Customers sharing a phone, email or address are flagged on entry, in the move-in preview and in the CSV preview (against Glove customers and each other), reviewed and merged as one undoable change. Messages join what a merge moves when `COMM-*` lands them.

### Requests and online booking

#### BOOK-001 — Request form on the business website.
An embeddable request form (a script tag or link for Pane, WordPress, Squarespace or any site) takes the service wanted, address, contact, photos and preferred times; Cloudflare Turnstile blocks spam; the request lands in the queue with its source, creates or matches the customer, and the office is notified.

*Acceptance:* a browser journey submits the embedded form from a fixture page with two photos, finds the request in the queue matched to an existing customer by phone, and checks that a submission failing Turnstile writes nothing.

*Status:* missing — gap: requests are entered by staff only (`enquiry.create`).

#### BOOK-002 — Online booking into real availability.
A customer chooses a service and sees arrival windows computed from real technician capacity: skills, service area, working hours, time off, existing visits and travel; the owner decides per service whether a booking is confirmed instantly or waits for approval, and whether a deposit is taken (`QUOTE-003`); the booked visit is assigned under `DISP-006` and confirmed under `COMM-003`. The owner sets per service a cancellation window, a late-cancellation fee and a no-show fee. The booking page states the policy before the customer confirms, and where a deposit or fee applies the customer saves a card with the `PAY-008` consent that names the fee. A customer canceling (from the confirmation link or the hub, `COMM-006`) inside the window, or a visit the dispatcher marks as a no-show, puts the fee on the visit as a proposal the office charges to the saved card under `PAY-009` or waives with a reason; a cancellation outside the window charges nothing and refunds any deposit under `PAY-004`. Visits booked by the AI front office (`AGENT-001`) carry the same policy, read out on the call or texted with the confirmation.

*Acceptance:* a browser journey books a tune-up through the public booking page, sees a full day refused and a window offered on a technician with the right skill, and finds the visit on the dispatch board with its confirmation queued. A second booking for a service with a $50.00 deposit takes it (Stripe fake), and the deposit shows on the job. With a 24-hour window and a $75.00 late-cancellation fee, a booking the customer cancels 3 hours ahead puts the $75.00 fee on the visit, and the office charges it to the saved card; a booking canceled 3 days ahead charges nothing and refunds its $50.00 deposit; and a visit marked as a no-show proposes the no-show fee, which the office waives with a reason on the timeline.

*Status:* missing — gap: no customer-facing booking.

#### BOOK-003 — Lead sources and the request pipeline.
Every request carries its source (website, Google, phone, text, Angi, Thumbtack, Yelp, referral, repeat customer, marketing campaign) and moves through a pipeline (new, contacted, quoted, won, lost with a reason); the office sees an aging pipeline board, and reports show conversion and revenue by source.

*Acceptance:* a flow test creates requests from four sources, quotes and wins two, loses one with a reason, and checks the pipeline and the conversion-by-source report.

*Status:* done — evidence `src/glove/pipeline.ts`, `src/glove/commands/quotes.ts`, `src/ui/quotes.tsx`, `tests/api/pipeline.test.mjs`.

#### BOOK-004 — Leads from Google, Angi, Thumbtack and Yelp.
Glove connects Google Local Services Ads and Reserve with Google, Angi, Thumbtack and Yelp lead feeds (each by the provider's own API or webhook, under the provider's eligibility rules), lands each lead as a request with its source and cost, matches existing customers, and replies within the provider's response window through `COMM-002` or the provider's message channel.

*Acceptance:* a flow test posts a recorded lead payload from each provider (provider fakes), finds four requests with sources and lead costs, one matched to an existing customer, and an acknowledgment queued for each.

*Status:* missing — gap: no lead-source connectors.

#### BOOK-005 — Service calls booked without a quote.
The dispatcher or office creates a job straight from a request, a call or the customer record with zero or more lines (for example a diagnostic or trip fee from the price book), books its visit under `GLOVE-05`'s conflict review with an arrival window (`DISP-006`), and the customer gets the confirmation of `COMM-003`. On site the technician adds flat-rate or time-and-materials lines from the price book (with prices where the owner allows under `QUOTE-006`, otherwise priced by the office), and the customer's approval of the added work is recorded on the phone; the fee, the added lines and the recorded materials flow to the invoice draft under `GLOVE-09`. A job made without a quote says so on its timeline, and none of its prices counts as approved until its invoice revision is approved.

*Acceptance:* a flow test takes a phoned-in request for a leaking water heater, creates a job with an $89.00 diagnostic fee from the price book, books it for today, and the technician adds a flat-rate valve replacement and 1.5 hours of labor on site with the customer's approval; the invoice draft carries exactly the fee, both lines and the recorded materials, and is approved and invoiced; a browser journey creates the same kind of job from the customer record.

*Status:* partial — evidence `src/glove/commands/dispatch.ts`, `src/glove/commands/invoices.ts`; gap: `job.create` refuses a job without an accepted quote (`NOT_ACCEPTED`); booking, on-site materials and invoice preparation exist only for quoted jobs; technicians cannot add priced lines.

#### BOOK-006 — Assessment visits on a request.
A request can carry a scheduled assessment (an on-site estimate): the technician or salesperson, date, time, arrival window and instructions. It sits on the dispatch board and the assessor's phone like any visit, blocks that calendar time (`GLOVE-07` conflict review applies), sends the customer's confirmation and reminders (`COMM-003`), and lets the assessor record notes, photos, measurements and a custom form (`FIELD-002`) before any quote exists. Completing the assessment turns the request into a quote draft carrying those notes, photos and form results, or into a field quote under `QUOTE-006`; the assessment, the request and the quote stay linked on the customer and property history (`CUST-001`).

*Acceptance:* a flow test books an assessment on a water-heater replacement request, checks it blocks an overlapping booking for that technician until reviewed, records two photos and a form on the phone, completes it, and converts the request into a quote draft carrying the photos, notes and form results; the assessment shows on the request, the quote and the customer history.

*Status:* missing — gap: requests carry no visits; only jobs made from accepted quotes are booked (`src/glove/commands/dispatch.ts`).

### Quotes and approval

#### QUOTE-001 — Good, better and best options and add-ons.
A quote holds up to five options, each its own set of lines and total, plus optional add-ons the customer can tick; the customer chooses one option and any add-ons, and the job carries exactly the chosen lines. Each option's price is approved under `GLOVE-03`. The owner keeps reusable quote templates beside the price book (`MONEY-003`): named bundles of options, add-ons, lines from the price book, notes and terms. A quote started from a template takes the current price-book prices unless the template fixes a price, and editing a template never changes a quote already made from it.

*Acceptance:* a flow test drafts three options with two add-ons, the customer chooses the middle option and one add-on through the quote link, and the job's lines and total equal exactly that choice. The owner saves those options as a template, raises one price-book price, and starts a second quote from the template: it carries the three options and add-ons with the raised price, and editing the template afterwards leaves the second quote unchanged.

*Status:* missing — gap: a quote is one set of lines per revision.

#### QUOTE-002 — Online approval with e-signature.
The customer opens the quote from a link, reads its terms and each line with the customer-facing description its price-book item carries (`MONEY-003`), chooses an option, requests changes or approves with a drawn or typed signature; Glove records the signer, time, IP address, the exact revision and the ESIGN/UETA consent text they accepted, and freezes the quote under `GLOVE-04`. Every quote carries a validity date (an owner default per business, editable per quote and printed on the quote); after that date the link shows the quote as expired, refuses approval and offers "ask for an updated quote", which notifies the office and reopens the request for a new revision with its own validity date.

*Acceptance:* a browser journey opens a sent quote link, finds each price-book line's customer-facing description (`MONEY-003`), requests a change, approves the revised quote with a drawn signature, and checks the signature record and that a stale revision's link cannot be approved. A second quote with a 30-day validity date is opened on day 31: approval is refused, and "ask for an updated quote" puts a notice in the office queue and reopens the request.

*Status:* partial — evidence `src/glove/commands/quotes.ts`, `tests/api/flows.test.mjs`; gap: staff record the customer's answer, including "signed"; there is no customer-facing quote link or e-signature.

#### QUOTE-003 — Deposits on approval.
The owner sets a deposit per quote or per service (an amount or a percentage); approval online takes the deposit by card or ACH through `PAY-002`, the deposit is held against the job and applied to its invoice, and a refund of a deposit follows `PAY-004`.

*Acceptance:* a flow test approves a $1,850 quote with a $500 deposit (Stripe fake), finds the deposit on the job, and checks the final invoice shows $1,350 due.

*Status:* missing — gap: no payments.

#### QUOTE-004 — Automatic quote follow-up.
The owner sets a follow-up sequence (for example day 2 text, day 5 email, day 10 call task); Glove sends it through `COMM-001`/`COMM-002` for every unanswered quote, stops the moment the customer answers, the quote is closed or it reaches its validity date (`QUOTE-002`), and shows which step each open quote is on.

*Acceptance:* a flow test advances a clock past each step for three quotes, one answered on day 3 and one whose validity date is day 7, and checks exactly which messages were sent, that the answered quote's sequence stopped, and that the expiring quote's day-10 step was never sent.

*Status:* missing — gap: Glove sends nothing.

#### QUOTE-005 — Branded quote, invoice and report documents.
Quotes, invoices, service reports and agreements render as branded pages and PDFs with the logo, license numbers (`MONEY-002`), terms, photos, and each line's image and the customer-facing description its price-book item carries (`MONEY-003`), from templates the owner edits.

*Acceptance:* a browser journey edits the quote template, opens a quote as a customer and as a PDF, and finds logo, license number, terms, an attached photo and each price-book line's customer-facing description (`MONEY-003`) in both.

*Status:* missing — gap: documents exist only as desk screens and the invoice CSV.

#### QUOTE-006 — Field quotes and change orders, offline.
A technician the owner allows builds a quote or a change order on the phone from the price book, including options, with or without signal; the customer signs on the phone; the change order adds its lines to the job and invoice; offline drafts send exactly once on reconnect under `GLOVE-06`. Prices outside the owner's allowed range wait for desk approval.

*Acceptance:* a browser journey with the network off builds a two-option field quote, captures the customer's signature, reconnects, and finds the approved change order on the job and its lines on the invoice draft; an out-of-range price waits for approval.

*Status:* missing — gap: technicians cannot see prices or create quotes.

#### QUOTE-007 — Discounts on quotes and invoices.
A quote option and an invoice take a document discount (a percentage of the subtotal or a fixed dollar amount, with a reason such as senior, military or first-time customer) shown below the subtotal, and discount lines (negative-price lines, from the price book or custom, each marked taxable or non-taxable). Discount lines count in the subtotal under their own taxable flag. The document discount is allocated to non-taxable lines first, then to taxable lines in line order, and the allocation is shown; tax under `MONEY-001` is then computed on the discounted taxable amount and rounded half up once per document. A discount is part of the priced revision approved under `GLOVE-03`, carries unchanged from the accepted quote to the job and the invoice, and appears in the invoice CSV, the `LEDGER-*` payload (as the provider's discount line with its taxable and non-taxable amounts) and reports. The owner limits who may give a discount and its maximum (`TEAM-001`). `PLAN-002`'s member discount follows the same rule.

*Acceptance:* a flow test quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) with a $50.00 non-taxable first-time-customer discount line and a 10% document discount, and checks subtotal $650.00, discount $65.00 taken from labor, tax $33.00 and total $618.00; a 50% document discount on the same lines spills $75.00 onto the parts and gives tax $26.81 and total $351.81; the accepted figures are identical to the cent on the job, the invoice, the CSV and the QuickBooks fake.

*Status:* missing — gap: no discounts; a quote line is a price-book or custom line at its price (`src/glove/commands/quotes.ts`).

### Scheduling and dispatch

#### DISP-001 — Drag-and-drop dispatch board.
Day, week and month views by technician and by crew, an unscheduled-jobs list, drag-and-drop to book, move, reassign or resize a visit (each drop is a `GLOVE-07` change with conflict review), color by job type or status, and a keyboard path for every drag.

*Acceptance:* a browser journey at 1440 px drags an unscheduled job onto a technician, moves it to another day, triggers and confirms a conflict review, and repeats the move with the keyboard.

*Status:* partial — evidence `src/ui/dispatch.tsx`, `src/glove/commands/dispatch.ts`; gap: a day board with booking forms; no drag-and-drop, week or month views or unscheduled list.

#### DISP-002 — Map board and travel time.
The dispatch board shows today's visits and technicians on a map (Google Maps), drive time between consecutive visits from a routing provider, and a directions handoff to the technician's navigation app (Apple Maps, Google Maps, Waze). With the map and site coordinates, the owner draws service-area zones for technicians beside their ZIP codes (`DISP-004`), and booking applies the same warn-or-refuse area rule to a site outside every zone the technician serves (moved here from `DISP-004`, ct 19 October 2026).

*Acceptance:* a browser journey opens the map board with a fixture day, sees pins and drive times (provider fake), and the technician's phone offers a directions link with the site's address; a flow test draws a zone for a technician and checks a booking at a site outside it gets the area warning.

*Status:* missing — gap: no map or travel time.

#### DISP-003 — Route optimization.
For a day or a technician, Glove proposes the visit order and assignment that respects arrival windows, skills and service areas and minimizes drive time, shows the time saved, and applies it only when the dispatcher accepts; it runs as a bounded background job.

*Acceptance:* a flow test optimizes a fixture day of 12 visits for 3 technicians (routing provider fake), checks no arrival window or skill is broken and the drive time falls, and checks nothing moves until accepted.

*Status:* missing — gap: no routing.

#### DISP-004 — Skills, availability, time off and service areas.
Technicians carry skills and certifications (for example EPA 608, licensed electrician), working hours, time off and service areas (ZIP codes; drawn zones arrive with the map under `DISP-002`); booking warns or refuses (by owner setting) when the technician lacks a required skill, is off or outside the area; availability can be read from Lanyard or Google Calendar.

*Semantics (DISP-004, 19 October 2026):* calendar availability is read from the calendar's secret iCal address (Google Calendar, Outlook and most calendars publish one). The address is a credential: the owner or that technician sets it, it is stored apart from Glove's records (`glove_secrets`), only they can read it back, and it never appears in state, the timeline, a command result, the business export, the installation archive or a log; a restored installation needs it entered again. Reading it keeps only busy spans (start and end, no titles) for the next 90 days with the time they were read; an event marked free or cancelled is not busy; UTC and TZID times are exact; floating times and all-day dates are read in the business time zone; DAILY and WEEKLY repeats are expanded and other repeats are read at their first occurrence only and counted. A booking overlapping a busy span falls under the owner's availability rule (warn or refuse) and names when the calendar was read.

*Acceptance:* a flow test books a gas job for a technician without the gas skill (refused), on their day off (refused) and outside their area (warning), then books it for an eligible technician; a flow test reads a technician's calendar (provider fake), refuses a booking over a busy span and books a free one, and checks the address is readable only by the owner and that technician and absent from state, timeline, command results and export.

*Status:* partial — evidence `src/glove/eligibility.ts`, `src/glove/calendar.ts`, `src/glove/commands/calendar.ts`, `src/glove/commands/dispatch.ts`, `src/ui/availability.tsx`, `tests/api/eligibility.test.mjs`, `tests/portable.mjs`; gap: availability is not read from Lanyard (Lanyard has no read door for availability yet).

#### DISP-005 — Live technician location and ETA.
While clocked in and on the job, a technician's phone shares location (with their consent, never off the clock), or Glove reads a fleet GPS provider (Linxup, Samsara, Verizon Connect); the board shows each technician's position and an ETA to the next visit, which feeds `COMM-004`.

*Acceptance:* a flow test posts phone locations and a fleet-provider feed (fake), checks positions and ETAs on the board, and checks no location is recorded after clock-out.

*Status:* missing — gap: no location.

#### DISP-006 — Arrival windows and automatic assignment.
Visits are booked with a customer arrival window (for example 8–10 am) separate from the planned time; when a booking comes from `BOOK-002` or `AGENT-001`, Glove assigns the best eligible technician (skills, area, load, travel) under the owner's rules, and the dispatcher can override.

*Acceptance:* a flow test books three online requests and checks each lands on an eligible technician inside its window, then the dispatcher reassigns one with a `GLOVE-07` review.

*Status:* missing — gap: visits are a technician's start and end time chosen by the dispatcher.

#### DISP-007 — Multi-day jobs, crews and subcontractors.
A job can span several days and several technicians at once; a crew is booked as one; subcontractors sign in with their own limited role, see only their visits, and their 1099 totals are kept (`COST-002`).

*Acceptance:* a flow test books a three-day install for a two-person crew and a subcontractor, checks each sees only their visits, and checks the subcontractor's total in the 1099 export.

*Status:* partial — evidence `src/glove/commands/dispatch.ts`; gap: a job can hold several visits; no crews, subcontractor role or 1099 totals.

#### DISP-008 — Google Calendar and Outlook sync.
Each technician's visits appear in their Google or Microsoft 365 calendar (one way, updated on change, customer details limited by owner setting), and busy blocks from that calendar count against availability.

*Acceptance:* a flow test books, moves and cancels a visit and checks the calendar provider fake receives create, update and delete, and that a busy block refuses an overlapping booking.

*Status:* missing — gap: no calendar connection.

### Customer communication

#### COMM-001 — Customer email with delivery status.
Quotes, invoices, receipts, confirmations and reports are emailed from Glove through the owner's provider (SendGrid, Postmark, Amazon SES or the Base mail adapter) from the business's verified domain; each message records queued, delivered, bounced or complained from provider events, and a failure shows on the record with what to do next. CAN-SPAM rules apply to anything not strictly transactional.

*Acceptance:* a flow test sends a quote and an invoice (provider fake), replays delivered and bounced events, and checks each message's state on the timeline and the bounce warning on the customer.

*Status:* missing — gap: the mail module serves sign-in links only; Glove records sends but sends no customer email.

#### COMM-002 — Texts from a registered US number.
The owner connects Twilio (or another provider) with a US number registered for A2P 10DLC or toll-free verification; Glove records each customer's SMS consent (source, time, wording), honors STOP, HELP and START in every thread, keeps quiet hours by the customer's time zone, and records sent, delivered and failed per message. The owner keeps their existing business number: it is ported to Twilio, or text-enabled in place as a hosted number while voice stays with the current carrier, with the port or hosting status shown until it is live; a new number is the owner's choice, never the only path.

*Acceptance:* a flow test texts a consenting customer (provider fake), replays delivered and failed callbacks, receives STOP and checks the next send is refused with the reason, and checks no automated text is sent in quiet hours; a hosted-number order and a port request (provider fake) show their status until the number is live, and sends then use it.

*Status:* missing — gap: no SMS.

#### COMM-003 — Appointment confirmations and reminders.
Booking, moving or canceling a visit sends the customer a confirmation by text and email (by preference); reminders go at owner-set times before the window (for example 24 hours and 2 hours); the customer can confirm or ask to reschedule from the message. The wording of every automated message (confirmations, reminders, on-my-way, quote follow-ups under `QUOTE-004`, payment reminders under `PAY-005`, review requests) is an owner-edited template with merge fields and a preview; the opt-out wording and business name cannot be removed.

*Acceptance:* a flow test books, moves and cancels a visit and checks the exact messages and their timing, and a reply "reschedule" opens a request on the job; an owner-edited reminder template with merge fields is exactly what the customer receives, and its opt-out wording cannot be removed.

*Status:* missing — gap: Glove sends nothing.

#### COMM-004 — On-my-way and job status texts.
The technician taps "on my way" (or Glove detects departure under `DISP-005`) and the customer gets a text with the technician's name, photo and ETA; arrival, completion and report-ready notices follow by owner setting.

*Acceptance:* a browser journey taps on-my-way on the phone and checks the customer text (provider fake) carries name and ETA; completion sends the report link.

*Status:* missing — gap: no customer notices.

#### COMM-005 — Two-way texting inbox.
Replies land in a shared inbox, threaded by customer and linked to the open job, with assignment, unread state and canned replies; technicians text customers from the job through the business number, never their personal number.

*Acceptance:* a browser journey receives a customer reply (provider fake), assigns it, answers with a canned reply, and finds the thread on the customer and the job.

*Status:* missing — gap: no messaging.

#### COMM-006 — Customer hub.
A customer opens their hub from a sign-in link sent to their email or phone and sees their quotes (approve and sign; each price-book line shows the customer-facing description its item carries, `MONEY-003`), upcoming visits (confirm, reschedule within policy), invoices and receipts (pay), service reports, equipment, agreements (renew, update card) and can request new work; they see only their own records.

*Acceptance:* a browser journey signs a customer in by a link, finds a quote's price-book line with its item's customer-facing description (`MONEY-003`), approves the quote, pays an invoice (Stripe fake), requests work, and checks another customer's link reads none of it.

*Status:* missing — gap: no customer-facing portal.

#### COMM-007 — One conversation history per customer.
Calls, texts, emails, notes, portal actions and agent conversations appear on the customer and job timeline in one stream with their direction, channel, author and delivery state.

*Acceptance:* a flow test sends and receives a text, an email and a logged call on one job and reads them, in order, from the customer and job timelines.

*Status:* partial — evidence `src/ui/jobs.tsx`, `src/ui/activity.tsx`; gap: every command is on the job timeline; no messages or calls exist to record.

#### COMM-008 — Review requests after paid jobs.
After a job is complete and paid (owner chooses the trigger), Glove asks the customer for a Google review by text or email, at most once per owner-set period per customer, never asks a customer who opted out, and records the request and any review that the Google Business Profile connection reports. Every customer gets the same request: Glove never filters requests by sentiment.

*Acceptance:* a flow test completes and pays two jobs for one customer within the period and checks one request was sent; an opted-out customer gets none.

*Status:* missing — gap: no review requests.

#### COMM-009 — Calls on the business number.
Inbound calls to the business's Glove number ring the office and on-call phones in order, forward to the owner's existing phone system if set, play a recording notice where the owner records calls, text back a missed caller with a booking link, and log every call (caller, duration, recording, outcome) on the customer; once the existing number is ported (`COMM-002`), it is the business number.

*Acceptance:* a flow test replays Twilio voice webhooks (fake) for an answered call and a missed call, checks the call log, the recording notice and the missed-call text.

*Status:* missing — gap: no telephony.

### Field work on the phone

#### FIELD-001 — Offline day of jobs that survives a reload.
The technician's phone keeps the day's assigned visits (customer, site, access notes, equipment, history, checklists, forms, photos already taken) cached, so the app opens, reloads and works with no signal; everything captured offline sends exactly once on reconnect under `GLOVE-06`, and a conflict with a desk change is shown, never silently overwritten.

*Acceptance:* a browser journey loads the day, goes offline, reloads the app, completes a visit with photos and a form, reconnects, and checks everything landed once; a visit moved at the desk meanwhile shows the late-evidence review.

*Status:* partial — evidence `src/ui/outbox.ts`, `src/ui/technician.tsx`, `tests/browser/journey.spec.ts`; gap: queued captures survive an interruption in an open page; the day's jobs are not cached across a reload.

#### FIELD-002 — Custom forms and inspections.
The owner builds forms (yes/no, choice, number with units, reading with range, photo, signature, notes, conditional questions) and attaches them to services, equipment types or agreements; technicians fill them offline; results appear on the job, the report and the equipment history.

*Acceptance:* a flow test builds an HVAC inspection form with a conditional question and a reading range, fills it on a visit with one out-of-range reading, and finds the flagged reading on the job and the equipment.

*Semantics (FIELD-002, 19 October 2026):* the owner builds a form of up to 60 questions (yes/no, choice, number with an optional unit, reading with a unit and an inclusive range, photo, signature, notes); a question can be asked only when an earlier yes/no or choice question has a given answer. A form attaches to price-book services and to equipment types (matched without regard to case). A new job takes a copy of each form that applies: one per unit the job names whose type the form lists, otherwise one for the job when a quoted service lists it; editing or archiving the form never changes a job's copy, and the per-service checklists stay as they are. The technician fills each copy once on the phone, through the outbox, so it works without signal (`GLOVE-06`): every question asked and required must be answered, a question not asked must be left empty, and a reading below its lowest or above its highest value is flagged. The filled form is a field record on the job and its timeline (naming how many readings are out of range), on the unit's service history when the copy is for a unit, and in the property history. Agreements carry forms when `PLAN-002` ships, and the customer's report prints form results under `FIELD-003`.

*Status:* done — evidence `src/glove/forms.ts`, `src/glove/commands/forms.ts`, `src/glove/commands/field.ts`, `src/ui/forms.tsx`, `tests/api/forms.test.mjs`, `tests/browser/journey.spec.ts`.

#### FIELD-003 — Shareable service report.
Completing a visit produces a service report (work summary, findings, form results from `FIELD-002` with out-of-range readings marked, photos, materials, signature, recommendations) the customer receives by link or PDF and finds in the hub; recommendations can become a quote in one step.

*Acceptance:* a flow test completes a visit and opens its report as the customer, finds the visit's `FIELD-002` form results with the out-of-range reading marked, then turns a recommendation into a draft quote.

*Status:* partial — evidence `src/glove/commands/field.ts`, `tests/api/flows.test.mjs`; gap: completion records a summary and signature; no customer-facing report.

#### FIELD-004 — Installable technician app with push.
The technician app installs to the home screen on iPhone and Android, uses the camera directly, sends push notifications for new, moved and canceled visits, and offers tap-to-call and tap-to-navigate.

*Acceptance:* a browser journey installs the app manifest, subscribes to push, and receives a notification (push service fake) when the dispatcher moves the visit; from the visit, tap-to-call opens a `tel:` link to the customer's number and tap-to-navigate a maps link to the site's address.

*Status:* missing — gap: the phone screen is a web page with no manifest or push.

#### FIELD-005 — Native iOS and Android apps.
Glove ships technician apps in the App Store and Google Play, signed in to the owner's installation, with the offline cache of `FIELD-001`, background photo upload, push, location under `DISP-005` and Tap to Pay under `PAY-003`.

*Acceptance:* a device-farm journey on a current iPhone and Android phone completes a visit offline, reconnects and takes a Tap to Pay test payment (Stripe test mode).

*Status:* missing — gap: no native apps.

#### FIELD-006 — Equipment nameplate capture.
The technician photographs an equipment nameplate; Glove reads make, model, serial and manufacture date into the equipment record for the technician to confirm, and attaches the manufacturer's manual where one is available.

*Acceptance:* a flow test submits three fixture nameplate photos (model provider fake), checks the proposed fields, and checks nothing is saved until the technician confirms.

*Status:* missing — gap: no equipment records or nameplate reading.

#### FIELD-007 — Refrigerant tracking for HVAC.
On HVAC visits the technician records refrigerant type and the amounts added and recovered per equipment item, with their EPA Section 608 certification number; the owner gets a per-equipment and per-period refrigerant log for their own recordkeeping.

*Acceptance:* a flow test records refrigerant added and recovered on two visits to one condenser and reads the equipment log and the period total.

*Status:* done — evidence `src/glove/commands/field.ts`, `src/glove/equipment.ts`, `src/ui/equipment.tsx`, `tests/api/equipment.test.mjs`.

#### FIELD-008 — The whole office on the owner's phone.
Every desk role does its daily work from a phone, 390 px wide and up, in the installable app (`FIELD-004`) and the native apps (`FIELD-005`), under the same role checks as the desk: create a request, a customer or a job (`BOOK-005`), build, approve and send a quote, book or move a visit with conflict review, prepare, approve and send an invoice, take a payment (key in a card read out on the phone or charge a saved one under `PAY-009`, or record a check or cash), answer a text in the inbox (`COMM-005`) and read the `REPORT-001` dashboard. No screen scrolls sideways, and every action is the same public command as at the desk.

*Acceptance:* a browser journey at 390 px signed in as Owner creates a job from a phoned-in request, sends a quote, books the visit, sends the invoice, records a check payment, charges a saved card on a second invoice (Stripe fake), answers a customer text and opens the dashboard, asserting no horizontal scroll on any screen; the same steps signed in as Office are refused exactly where the role table says.

*Status:* partial — evidence `tests/browser/journey.spec.ts`; gap: the first-release desk journey (team, customers, request to accepted quote, job and booking, invoice preparation and export) runs at 390 px; nothing is sent or paid, there is no inbox or dashboard, and no horizontal-scroll check.

### Time, materials and job costing

#### COST-001 — Clock-ins and job timers.
Technicians clock in and out for the day and run travel and on-job timers per visit, with or without signal; time is attached to the job; the desk sees who is on the clock (the `REPORT-001` dashboard's on-the-clock tile) and corrects time with a reason.

*Acceptance:* a browser journey clocks in, starts travel and job timers on two visits with one offline stretch, clocks out, and checks the time on each job; a desk correction keeps the original; the `REPORT-001` on-the-clock tile lists exactly the technicians clocked in at each step.

*Semantics (COST-001, 19 October 2026):* a technician clocks in and out on the phone and, only while clocked in, runs one timer at a time, travel or on the job, on a visit currently assigned to them; starting a timer stops the running one at the same phone time, and clocking out or completing the visit stops it too. Every start and stop carries the phone's clock time and goes through the phone's outbox with the identity it was given, so it works without signal and a resend lands once (`GLOVE-06`). An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of its entries per kind. The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local dates and times in the business timezone, with a reason; the entry keeps the phone's original times and every correction (who, when, reason, from and to), and the job's timeline records it. Technicians read only their own entries. The `REPORT-001` on-the-clock tile lists the technicians with a shift clocked in and not out, with the timer each is running.

*Status:* done — evidence `src/glove/commands/time.ts`, `src/ui/clock.tsx`, `src/glove/dashboard.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs`.

#### COST-002 — Timesheets and payroll export.
Weekly timesheets per person roll up clock and job time, flag overtime past 40 hours a week (and daily overtime where the owner sets a state rule), are approved by the owner, and export in the import shape of Gusto, ADP RUN and QuickBooks Payroll; W-2 employees and 1099 subcontractors are kept apart, with subcontractor payment totals for 1099-NEC.

*Acceptance:* a flow test builds a 44-hour week, approves it, and checks the overtime split and the Gusto and QuickBooks Payroll exports; a subcontractor's total appears only in the 1099 export.

*Status:* missing — gap: no timesheets.

#### COST-003 — Job expenses and receipts.
Technicians and the office record expenses on a job (supply-house purchases, permits, equipment rental, subcontractor bills) with a receipt photo, vendor, amount and whether it is billable; billable expenses can be added to the invoice at cost or with markup.

*Acceptance:* a flow test records a supply-house receipt as billable with 20% markup and a permit fee as non-billable, and checks the invoice draft and job cost.

*Status:* done — evidence `src/glove/commands/expenses.ts`, `src/glove/commands/invoices.ts`, `src/ui/expenses.tsx`, `tests/api/expenses.test.mjs`.

#### COST-004 — Estimate versus actual job costing.
Every job shows its quoted price and estimated cost against actual labor (time × each person's loaded cost rate), materials at cost, expenses and subcontractors, giving actual margin and the difference from estimate; reports roll this up by job type, technician and period.

*Acceptance:* a flow test runs a job quoted at $1,850 with estimated 41% margin through recorded time, materials and an expense, and checks actual cost and a 46% margin to the cent.

*Semantics (COST-004, 19 October 2026):* revenue is the latest person-approved invoice revision's subtotal before tax, else the accepted quote's subtotal. The estimated cost is each accepted line's unit cost (kept when the line was priced from the price book, `MONEY-003`) × its quantity; a line without one counts at $0.00 and is named. Actual labor is every travel and on-job entry (`COST-001`) at its whole minutes × that technician's loaded cost per hour ÷ 60; materials are the price-book materials recorded on the job at the item's unit cost now; expenses and subcontractors are `COST-003`'s amounts, subcontractor bills apart. Each product is rounded half up to the cent; a margin is (revenue − cost) ÷ revenue as a percentage to one decimal, rounded half up, and the difference from estimate is in dollars and margin points. The owner sets each technician's loaded cost per hour; like every cost it is a margin figure, read only by roles that read reports (`MONEY-003`). Reports take the jobs completed in a period (by local completion date, bounds inclusive) and roll them up by job type (the category of the job's first price-book line, else Uncategorized) and by technician (their minutes, labor cost and the jobs they recorded time on).

*Status:* done — evidence `src/glove/costing.ts`, `src/glove/api.ts`, `src/glove/view.ts`, `src/ui/costing.tsx`, `tests/api/costing.test.mjs`, `tests/browser/journey.spec.ts`.

#### COST-005 — Live margin warnings.
When actual cost on an open job crosses an owner-set threshold of its estimate, or projected margin falls below a floor, Glove warns the dispatcher and the owner while the job is still open.

*Acceptance:* a flow test records time past the threshold and checks one warning to each of the two people, and no repeat for the same crossing.

*Semantics (COST-005, 19 October 2026):* the owner sets, on the business, a cost threshold (warn when actual cost reaches this percentage of the estimate) and a margin floor (warn when projected margin falls below this percentage); either can be blank, meaning off. After every command, each open job is checked with `COST-004`'s figures; its projected cost is the larger of actual and estimated cost, and a job with no estimated cost never crosses the threshold. A crossing is one warning shown in Glove to the owner and to every dispatcher, on their desk screens and on the job's timeline; nothing is sent (no email or text). A warning is kept once per job, kind and setting, so the same crossing never repeats; changing a setting can warn again. Like every cost, warnings are read only by the owner and dispatchers they are addressed to, and their timeline entries only by roles that read reports.

*Status:* done — evidence `src/glove/margins.ts`, `src/glove/api.ts`, `src/glove/view.ts`, `src/ui/costing.tsx`, `src/ui/team.tsx`, `tests/api/margins.test.mjs`.

### Invoicing and payments

#### PAY-001 — USD invoices sent from Glove.
An approved invoice is sent by email and text with a pay link, or presented on the technician's phone on site; a technician the owner allows prepares the invoice on the phone, offline if needed, and it sends exactly once on reconnect; invoices support net terms and due dates, progress invoicing on long jobs, batch invoicing of completed jobs, and statements per customer; completed jobs not yet invoiced are listed and the office is reminded daily; `GLOVE-09`'s revision and correction trail applies to every one; an invoice carries the customer's PO number (approval is refused when the customer requires one and it is missing) and goes to the customer's billing contact and accounts-payable address.

*Acceptance:* a flow test approves and sends an invoice (provider fakes), batch-invoices three completed jobs, and opens a customer statement with the right balances; a commercial customer that requires a PO refuses invoice approval without one, and its invoice goes to the accounts-payable address with the PO printed.

*Status:* partial — evidence `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`; gap: invoices are prepared, approved, exported and corrected; nothing is sent, presented or paid.

#### PAY-002 — Card, ACH and wallet payments through Stripe.
The owner connects their own Stripe account; customers pay invoices, deposits and agreements by card, Apple Pay, Google Pay or ACH bank debit; Glove records each payment only when Stripe confirms it (ACH as pending until settled), shows fees, and never touches raw card numbers. Card surcharging is off by default and, if the owner turns it on, carries the disclosure they configure. A customer can add a tip when paying online or on the `PAY-003` screen (owner-set choices); each tip is recorded against the payment and the visit's technicians, kept out of revenue and sales tax, and carried to the payroll export (`COST-002`, `TEAM-003`). The `REPORT-001` dashboard's "Paid today" tile sums the payments Stripe confirmed on the business's local today, tips apart; an ACH payment counts on the day it settles.

*Acceptance:* a flow test pays one invoice by card and one by ACH (Stripe fake with webhooks), checks the card payment is paid at once, the ACH payment pending until the settlement event, and a failed ACH return reopens the balance; a card payment with a $15.00 tip records the tip for the visit's technician, untaxed, and the tip appears in the payroll export; the `REPORT-001` "Paid today" tile counts the card payment at once and the ACH payment only after its settlement event.

*Status:* missing — gap: no payments.

#### PAY-003 — Tap to Pay and card readers on site.
Technicians take card-present payments on the phone (Tap to Pay on iPhone and Android through Stripe Terminal) or a paired Stripe reader, with the tip choices of `PAY-002`, the receipt texted or emailed and the payment on the job before they leave.

*Acceptance:* the `FIELD-005` device journey takes a Tap to Pay test payment on a $412.00 invoice with an 18% tip chosen on the phone's tip screen and the receipt sent by text, then a second test payment with no tip and the receipt by email. It finds both payments on the job, the $74.16 tip recorded for the visit's technician outside revenue and sales tax, and each receipt on the timeline with the channel the customer chose and the provider's delivery outcome.

*Status:* missing — gap: no payments or native app.

#### PAY-004 — Partial payments, balances, refunds and credits.
An invoice accepts several payments (deposit, progress, final, check and cash recorded by the office, cards the office keys in or charges on file under `PAY-009`); balances, overpayments and credits carry on the customer; the owner refunds all or part through the original method, and every refund is its own record linked to the payment. The `REPORT-001` dashboard's receivables tile is the sum of every invoice's unpaid balance.

*Acceptance:* a flow test pays an invoice in three parts (one by check), refunds $50 to the card (Stripe fake), and checks the invoice, customer balance and refund record, and that the `REPORT-001` receivables tile equals the open balances after each step.

*Status:* missing — gap: no balances or payments.

#### PAY-005 — Payment reminders that stop at zero.
The owner sets a reminder schedule (before due, on due, after due); Glove sends it by text and email with the pay link, stops the moment the balance is zero or the invoice is disputed, and shows each invoice's reminder state.

*Acceptance:* a flow test advances a clock through the schedule for two invoices, pays one after the first reminder, and checks it received nothing more.

*Status:* missing — gap: Glove sends nothing.

#### PAY-006 — Consumer financing through Wisetack.
On quotes above an owner-set amount, the customer can apply for financing through Wisetack from the quote or hub; Glove shows the provider's decision and offer, and records the payout when the provider funds; Glove never underwrites or lends.

*Acceptance:* a flow test applies for financing on a $9,800 quote (provider fake), approves, funds, and checks the invoice is paid by the financing payout.

*Status:* missing — gap: no financing.

#### PAY-007 — Payouts and reconciliation.
Each Stripe payout is matched to the payments, refunds and fees inside it; checks and cash are grouped into deposit batches; anything unmatched is listed with the reason, so the bank deposit, Glove and the books agree. Where Stripe offers Instant Payouts on the owner's account, the owner requests one to an eligible debit card with Stripe's fee shown before confirming, and it reconciles the same way.

*Acceptance:* a flow test replays a payout of six payments, one refund and fees (Stripe fake) and checks the payout reconciles to the cent, with a deliberately missing payment listed as unmatched; an instant payout (Stripe fake) with its fee reconciles the same way.

*Status:* missing — gap: no payments.

#### PAY-008 — Saved payment methods and autopay with consent.
A customer saves a card or bank account in the hub or on site, with the authorization text and time recorded (for ACH, the recurring debit authorization the Nacha rules require); saved methods pay agreements and approved invoices automatically when the customer chose autopay, the office charges them on demand under `PAY-009` when the recorded authorization covers charges the business starts, and a failed charge sends an update link.

*Acceptance:* a flow test saves a card with consent, charges an agreement renewal, fails the next charge (Stripe fake) and checks the update-link message and the retained authorization record.

*Status:* missing — gap: no payments.

#### PAY-009 — Office charges a card by phone or on file.
The Owner, the Office role and any custom role granted "take card payments" (`TEAM-001`) open an invoice, a deposit (`QUOTE-003`), a cancellation fee (`BOOK-002`) or an agreement charge and press **Charge card**. They either key in the card the customer reads out on the phone, or pick one of the customer's saved methods (`PAY-008`) and charge it at once.
- **Keyed cards never touch Glove.** The card number, expiry and security code are typed into Stripe's own card-entry element inside Glove's page and go straight to Stripe; Glove's server, records, logs and exports never hold them. A keyed card is sent as a mail or telephone order (MOTO) where the owner's Stripe account allows it. Where Stripe demands customer authentication instead, Glove texts or emails the customer a pay link for the same amount.
- **Saved methods follow their authorization.** A saved card is charged on demand only when its `PAY-008` authorization covers charges the business starts; a saved bank account is debited only under an authorization that covers it (a Nacha recurring or single-entry authorization). Otherwise Glove refuses and offers the pay link. While keying a card, the office can save it for later charges only after reading the customer the consent text, which is stored with the method as its `PAY-008` authorization.
- **Paid only on Stripe's word.** Before confirming, the screen shows the amount, the card brand and last four digits, any surcharge under `PAY-002`'s settings and an optional tip. The payment is recorded only when Stripe confirms it, and lands on the invoice, the customer balance and the timeline with who charged it. A decline leaves the balance open and shows Stripe's decline reason.
- **Desk and phone alike.** The same command runs at the desk and on a phone 390 px wide (`FIELD-008`), under the same role checks. Anyone without the permission (Dispatcher, Technician, Agent, Viewer) is refused through every door; a technician takes card-present payments on their own visits under `PAY-003`.

*Acceptance:* a flow test (Stripe fake with webhooks) signs in as Office and charges a keyed card against a $412.00 invoice and a saved card against a $500.00 deposit. Each payment is recorded only on Stripe's confirmation event, with the Office person on the timeline. A declined keyed card leaves the $412.00 balance open with the decline reason. A saved card whose authorization covers only autopay is refused, with the pay link offered. A Technician, a Dispatcher and an Agent are refused the charge through the command and through HTTP. No request body, record, log line or business export contains a card number. A browser journey at 390 px signed in as Owner charges a saved card on an invoice from the phone with no horizontal scroll.

*Status:* missing — gap: no payments; the Office role records invoices only up to approval and export (`src/glove/commands/invoices.ts`).

### Accounting sync

#### LEDGER-001 — QuickBooks Online sync.
The owner connects QuickBooks Online; the first connection to a company that already holds records links them under `LEDGER-004` before anything posts. Glove keeps customers, items, invoices, payments, refunds, Stripe fees and deposits in sync, maps income accounts, tax codes and classes or locations once, and reads back payments recorded in QuickBooks; every sync error is shown on the record with the QuickBooks message and can be retried after a fix; nothing is posted twice. A customer with many properties (a property manager or landlord) can be mapped as a QuickBooks parent customer with a sub-customer per property: each property's invoices post to its sub-customer, the parent's statement rolls them up, and payments the parent makes against several properties are applied to each sub-customer's invoices.

*Acceptance:* a flow test syncs a customer, invoice, payment and refund (QuickBooks fake), replays the same sync without duplicates, receives a rejected item with its message, fixes and retries it, and reads a payment entered in QuickBooks back onto the invoice. A property manager with two properties mapped as sub-customers posts each property's invoice to its own sub-customer under the parent, and one payment covering both is applied to both invoices.

*Status:* missing — gap: no QuickBooks connection.

#### LEDGER-002 — Xero sync.
The same as `LEDGER-001` for Xero; the existing sales-invoice CSV remains for owners who import by file.

*Acceptance:* the `LEDGER-001` flow against a Xero fake.

*Status:* partial — evidence `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`; gap: a CSV in Xero's sales-invoice import columns; no live connection or payment sync.

#### LEDGER-003 — Pantry sync.
For an owner who keeps their books in Pantry, Run Edit Run's accounting product, Glove posts the same records through Pantry's API with the same error and retry behavior.

*Acceptance:* the `LEDGER-001` flow against Pantry's documented API (fake).

*Status:* missing — gap: no Pantry connection.

#### LEDGER-004 — First QuickBooks connection linked to existing records.
An owner moving in usually connects a QuickBooks Online company that already holds their customers, products and services and years of invoices, synced there by Jobber or Housecall Pro. On that first connection Glove posts nothing until the owner has reviewed and confirmed a link plan.
- **Proposed links.** Glove reads the company's customers (with sub-customers), items and open and recent invoices, and proposes a link for each Glove customer, price-book item and moved-in invoice. Customers match first by the QuickBooks customer ID the move-in carried where the source kept one (`MOVE-005`), then by display name together with email or phone. Items match by SKU, then by name. Moved-in invoices match by the carried QuickBooks ID, then by invoice number with the same customer and total.
- **Owner review.** The review lists four groups: matched (with the rule that matched), ambiguous (two or more candidates; the owner picks one or none), Glove records with no match (the owner approves creating each in QuickBooks or links it by hand), and QuickBooks records with no Glove counterpart (left alone, or brought into Glove through the `CUST-003` review). A QuickBooks name clash ("another customer already uses this name") appears in the review before anything posts, never as a sync error afterwards.
- **Only confirmed writes.** Confirming writes only the confirmed links and the new records the owner approved. A linked moved-in invoice is never posted again; later payments and refunds on it post against the QuickBooks invoice it links to. Each link records who confirmed it and can be changed until the first post that uses it. Reconnecting the same company keeps the links; connecting a different company starts a new review.

*Acceptance:* a flow test moves in a Jobber fixture (`MOVE-001`) with 50 customers, 20 price-book items and their open invoices, then connects a QuickBooks fake that already holds 48 of those customers (10 matched by the carried QuickBooks ID, 37 by name with email or phone, and one name with two QuickBooks candidates), all 20 items and the open invoices. The review lists exactly 47 matched customers, one ambiguous pair, two Glove customers with no match and 20 matched items, and the fake receives no write before confirmation. After the owner picks the ambiguous match and approves creating the two unmatched customers, the fake holds no duplicate customer or item, the two new customers exist once each, the moved-in invoices are linked and not re-created, a payment on one of them posts against its existing QuickBooks invoice, and the next new Glove invoice posts against the linked customer.

*Status:* missing — gap: no QuickBooks connection; the ServiceM8 kit keeps source IDs but no accounting references (`src/glove/movein/servicem8.ts`).

### Recurring service and maintenance agreements

#### PLAN-001 — Recurring jobs.
A job can repeat on a rule (every 3 months, the first Monday, twice a year in April and October), generating visits over a rolling horizon; one visit can be skipped or moved without changing the series; changing the series from a date forward keeps the past; each series carries the invoicing rule of `PLAN-005`.

*Acceptance:* a flow test creates a quarterly series, skips one visit, moves another, changes the rule from a date, and checks every generated visit.

*Status:* missing — gap: no recurring jobs.

#### PLAN-002 — Maintenance agreements and memberships.
The owner defines plans (for example a yearly HVAC "Comfort Club": price, term, included visits, member discount on repairs, priority booking); a plan is sold on a quote, in the hub or by phone; each agreement tracks entitlements used and left ("1 visit left, next April 3") and applies the member discount automatically. A plan can carry `FIELD-002` forms; each visit booked under the agreement takes a copy, as a job does for a service's forms. The `REPORT-001` dashboard's agreements-due tile counts the agreements with an included visit due and not yet completed or declined (`PLAN-004`).

*Acceptance:* a flow test sells a plan with two included tune-ups and 15% repair discount, books and completes one tune-up, quotes a repair, and checks the entitlement count and the discount, that the completed tune-up's job carried the plan's inspection form, and that the `REPORT-001` agreements-due tile counts the agreement while its second tune-up is due.

*Status:* missing — gap: no agreements.

#### PLAN-003 — Recurring billing and renewals.
Agreements bill monthly or yearly through saved payment methods (`PAY-008`); renewal notices go out ahead of the term end with the terms state auto-renewal laws require the owner to show; customers can cancel or update their card in the hub; a failed charge follows the dunning schedule and the agreement shows its state.

*Acceptance:* a flow test runs a monthly agreement through three charges, one failed and recovered, then a renewal notice and an auto-renewal, and a cancellation from the hub.

*Status:* missing — gap: no recurring billing.

#### PLAN-004 — Due-visit scheduling until done or declined.
Every included visit due in a period appears in a due list until it is completed or the customer explicitly declines; the office books them in batches (by area and season) and sends booking links; nothing due is ever silently dropped. The due list's remaining visits are the `REPORT-001` agreements-due tile's visit count.

*Acceptance:* a flow test generates 40 due visits, batch-books 30 by area, sends links for 8, records 2 declines, and checks the due list shows exactly the remainder, and the `REPORT-001` agreements-due tile the same number of due visits.

*Status:* missing — gap: no agreements.

#### PLAN-005 — Invoicing rules for recurring jobs.
Every recurring job (`PLAN-001`) has an invoicing rule, set when it is created and changeable from a date forward: per visit (each completed visit's lines and materials invoice on completion, or in a daily batch), a fixed price per period (the same amount on the last day of each month, or after each visit, whatever the visit count), once on close, or as needed (a reminder to the office, no draft). Glove generates the invoice drafts or reminders on that schedule and lists any recurring job whose billing date passed without an invoice. When the customer chose autopay, the invoice is charged to the saved method under `PAY-008`, with the receipt sent, and a failed charge follows `PLAN-003`'s dunning. A skipped or canceled visit never bills a per-visit job; a fixed-price job bills whether or not its visits ran unless the owner pauses it. Drafts are approved under `GLOVE-09` unless the owner auto-approves a series' fixed invoices.

*Acceptance:* a flow test runs two series for three months (Stripe fake): a per-visit series with one visit in month 1, two in month 2 (a third skipped) and none in month 3, and a quarterly commercial PM job billed $240.00 fixed monthly on autopay; it checks exactly three per-visit invoices with each visit's lines, exactly three $240.00 invoices dated the last day of each month, each charged once, with one failed charge entering dunning and recovered; an on-close series invoices once when the job closes.

*Status:* missing — gap: no recurring jobs or recurring invoicing.

### Stock and purchasing

#### STOCK-001 — Van and warehouse stock.
Each van and warehouse holds stock of price-book materials with counts; materials used on a visit come off that technician's van; transfers and restocks are recorded; low stock against a par level shows on the van; the day's jobs list the parts they need and whether the van has them.

*Acceptance:* a flow test sets van stock, records materials used on two visits, transfers from the warehouse, and checks counts, a low-stock flag and the parts-on-board check for tomorrow's jobs.

*Semantics (STOCK-001, 19 October 2026):* the owner and office keep stock locations (a van per technician, and warehouses) holding price-book materials only, counted in the material's unit to a thousandth; par levels are set per location and material. A stocktake sets a count, a restock adds, a transfer moves between two locations and is refused when the source holds less; a material from the price book that a technician records on a visit (`GLOVE-06`, so also offline) comes off that technician's van, and a count may go below zero, shown as such. Every movement is a stock-move record with who, when, the change and the count after, and a timeline entry. An item is low when its count is at or below its par. The parts a job needs are its lines' materials, and a task line's material contents, at their quantity times the line's quantity; the day's parts check walks one technician's visits on a local date in start order, and a part is on board for a job when the van holds enough for that job and every earlier job that day. A technician reads only their own van and their own day.

*Status:* done — evidence `src/glove/stock.ts`, `src/glove/commands/stock.ts`, `src/glove/commands/field.ts`, `src/ui/stock.tsx`, `tests/api/stock.test.mjs`, `tests/browser/journey.spec.ts`.

#### STOCK-002 — Purchase orders to suppliers.
The office raises purchase orders to suppliers (by email or supplier portal), receives them fully or partly into a van or warehouse, and links job-specific orders to the job's cost.

*Acceptance:* a flow test raises a PO for a job, receives it in two parts, and checks stock and job cost.

*Status:* missing — gap: no purchasing.

### Team and permissions

#### TEAM-001 — Custom roles and permissions.
The owner builds roles from named permissions (for example a CSR who books and takes card payments under `PAY-009` but cannot see margins or refund, a lead technician who can approve field quotes), each enforced by every command handler and read door as the built-in roles are.

*Acceptance:* the security matrix in `tests/api/security.test.mjs` extended with a custom CSR role: every command it lacks is refused through every door.

*Status:* done — evidence `src/glove/access.ts`, `src/glove/commands/setup.ts`, `src/ui/custom-roles.tsx`, `tests/api/security.test.mjs`.

#### TEAM-002 — Branches.
A business with several locations keeps branches with their own time zone, technicians, service areas, tax settings, numbering and reports, under one owner; people can be limited to their branch.

*Acceptance:* a flow test sets two branches in different time zones, books in each, and checks a branch-limited dispatcher sees only theirs.

*Status:* missing — gap: one business, one time zone.

#### TEAM-003 — Technician commissions and bonuses.
The owner sets commission rules (percentage of sold or completed revenue, per-agreement spiffs) and Glove computes each technician's earnings per pay period for the payroll export, alongside each technician's tips (`PAY-002`).

*Acceptance:* a flow test applies a 5% sold-revenue rule and a $25 agreement spiff over a period and checks the totals in the payroll export.

*Status:* missing — gap: no commissions.

### Reporting

#### REPORT-001 — Owner dashboard.
The owner's home shows today's jobs and their state, technicians on the clock, revenue booked and paid today, open quotes, unbilled completed jobs, receivables and agreements due.

*Semantics (REPORT-001, 19 October 2026):* the owner's home is Today, read from `GET /api/glove/dashboard` by every role that reads reports (never a technician). "Today" is the business's local date in its timezone. Today's jobs are the jobs with a visit, not canceled, starting on that date, each with the job's own state (open, completed, invoiced). Booked today sums the accepted revision's total, tax included, of each quote whose acceptance was recorded that date. Open quotes are draft, approved and sent quotes, valued at their latest revision's total. Completed, not invoiced counts completed jobs whose invoice has not been exported. On the clock lists the technicians with a shift clocked in and not out (`COST-001`). The other tiles ship with the clauses that keep their records, each carrying its tile in its text and acceptance: paid today with `PAY-002`, receivables with `PAY-004`, agreements due with `PLAN-002` and `PLAN-004`; until a tile's clause ships, Today shows no such tile rather than a zero.

*Acceptance:* a browser journey with a fixture day checks every figure against the records it summarizes (today's tiles; each later tile is checked by its own clause's acceptance).

*Status:* done — evidence `src/glove/dashboard.ts`, `src/glove/api.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs`. The on-the-clock tile shipped with `COST-001`; the paid-today, receivables and agreements-due tiles arrive with `PAY-002`, `PAY-004`, `PLAN-002` and `PLAN-004`.

#### REPORT-002 — Job, revenue, technician and lead reports.
Reports for revenue by period, job type and branch; technician revenue, close rate, callbacks and hours; lead source conversion; quote win rate; agreement count and churn; job margin (`COST-004`); and sales tax collected by jurisdiction and period, so the owner can file between accounting syncs; each filterable and exportable as CSV.

*Acceptance:* a flow test builds a fixture month and checks each report's totals against the records and the CSV export; one filter per report (period, branch, technician, job type, source) narrows its totals correctly, and the sales-tax-collected report matches the invoices' tax by jurisdiction to the cent.

*Status:* missing — gap: no reports.

#### REPORT-003 — Receivables aging.
An aging report (current, 1–30, 31–60, 61–90, over 90 days) by customer with links to each open invoice and its reminder state.

*Acceptance:* a flow test with invoices at each age checks the buckets and totals.

*Status:* missing — gap: no balances.

### Move-in from other systems

#### MOVE-001 — Move in from Jobber.
The owner moves in from Jobber (clients, properties, contacts, requests, quotes, jobs and visits, recurring jobs, invoices with open balances, the price book of products and services, notes and attachments) through Jobber's API with the owner's own access, or its CSV exports (including the products and services export), under `GLOVE-11`'s dry run, journal and undo; Jobber IDs are kept; what does not map is listed.

*Acceptance:* a flow test previews and commits a documented-shape Jobber fixture, checks open balances, recurring visits and the price book from the products and services CSV arrive, and undoes it; the same journey on a real owner export is recorded when one is available.

*Status:* missing — gap: the only kit is ServiceM8 (`src/glove/movein/servicem8.ts`).

#### MOVE-002 — Move in from Housecall Pro.
The same as `MOVE-001` for Housecall Pro, including service plans and price book.

*Acceptance:* the `MOVE-001` flow against a documented-shape Housecall Pro fixture.

*Status:* missing — gap: no Housecall Pro kit.

#### MOVE-003 — Move in from ServiceTitan.
The same as `MOVE-001` for ServiceTitan, including locations, equipment, memberships and their recurring services.

*Acceptance:* the `MOVE-001` flow against a documented-shape ServiceTitan fixture.

*Status:* missing — gap: no ServiceTitan kit.

#### MOVE-004 — Move in from FieldPulse and Workiz.
The same as `MOVE-001` for FieldPulse and Workiz.

*Acceptance:* the `MOVE-001` flow against documented-shape fixtures for each.

*Status:* missing — gap: no FieldPulse or Workiz kit.

#### MOVE-005 — Open balances, agreements and equipment carried over.
Every kit carries open invoice balances (as opening balances that `LEDGER-*` does not post twice), every accounting reference the source kept (the QuickBooks Online customer, item and invoice IDs its sync wrote, used by `LEDGER-004` to link rather than re-post), active agreements with remaining entitlements and renewal dates, installed equipment, and saved cards, bank accounts and autopay authorizations (`MOVE-006`); a guided cutover checklist tells the owner what to switch off in the old system and when, including the payment processor's export request and its freeze window.

*Acceptance:* a flow test moves in a fixture with open balances and an active agreement, checks balances and entitlements and the carried QuickBooks IDs, and checks the QuickBooks fake receives no duplicate invoice; the cutover checklist lists the processor export request and the freeze window.

*Status:* partial — evidence `src/glove/movein/servicem8.ts`, `tests/api/movein.test.mjs`; gap: the ServiceM8 kit brings customers, jobs, quotes, visits, materials and files; no balances, agreements, equipment or cutover checklist.

#### MOVE-006 — Saved cards and autopay carried over.
Each kit carries every moved-in customer's autopay: the agreements and recurring jobs that charged a saved card or bank account. Card and bank numbers move processor to processor, never through Glove: the `MOVE-005` cutover checklist tells the owner to request the old processor's export to Stripe (Stripe's PAN import, about 10 business days) and names the freeze window between export and import, in which card updates made in the old system are lost and must be collected again. When Stripe completes the import, the owner loads Stripe's mapping file (old customer and card IDs to new Stripe customer and payment-method IDs); Glove attaches each imported method to its moved-in customer and to the agreements or recurring jobs it paid, keeping the original authorization reference, consent date and source as the `PAY-008` authorization record. Glove lists every autopay agreement or recurring job with no migrated method, sends those customers a tracked card-update link (`COMM-001`, `COMM-002`) before their next charge, and shows who has updated. A renewal or recurring charge with no method is held as "needs payment method" with a reminder, never charged and never counted as a failed payment for dunning.

*Acceptance:* a flow test moves in a fixture with 10 autopay agreements, loads a Stripe-fake mapping file matching 7, and checks those 7 carry the imported method and original authorization reference and renew with a charge; the other 3 are listed with update links queued before their next charge date, their renewals charge nothing and enter no dunning, and one customer's update link saves a method that the next renewal charges; the cutover checklist shows the processor export request and the freeze window.

*Status:* missing — gap: no saved payment methods or autopay; the ServiceM8 kit carries no payment data (`src/glove/movein/servicem8.ts`).

### Integrations and API

#### API-001 — Documented HTTP API.
Every read and command people use is a documented HTTP door ([API.md](API.md)) that agents and integrations call under the same roles and checks.

*Acceptance:* the API flow suite drives every clause through these doors.

*Status:* done — evidence `API.md`, `tests/api/flows.test.mjs`.

#### API-002 — Webhooks and integration tokens.
The owner issues scoped tokens for integrations, each acting as one role, revocable; webhooks fire signed events (request created, quote approved, visit booked, job completed, invoice paid) with retries and a delivery log.

*Acceptance:* a flow test issues a dispatcher-scoped token, is refused an owner command with it, and receives signed webhooks for a booked visit and a paid invoice, with a retried failed delivery.

*Status:* missing — gap: integrations sign in as invited people; no tokens or webhooks.

#### API-003 — Zapier and Crank apps.
Published Zapier and Crank apps expose Glove's triggers and actions (create request, create customer, new paid invoice) for cross-app automation.

*Acceptance:* each app's own test suite runs its triggers and actions against a running installation.

*Status:* missing — gap: no published apps.

#### API-004 — CompanyCam photos.
Photos taken in CompanyCam for a job's address appear on the Glove job, and Glove job photos can be sent to the CompanyCam project.

*Acceptance:* a flow test links a CompanyCam project (fake) and checks photos flow both ways once.

*Status:* missing — gap: no CompanyCam connection.

#### API-005 — Workflow rules.
The owner sets rules of the form "when this happens, do that" on Glove's own events (when a job with the "commercial" tag completes, assign the invoice to a named office person; when a quote over $5,000 is approved, notify the owner; when a request comes from Angi, apply its lead cost), each with a run log and an on/off switch; a rule can do only what its creator's role can.

*Acceptance:* a flow test creates two rules, triggers each, checks the run log and effect, and checks a rule created by an office person cannot book a visit.

*Status:* missing — gap: no automation rules.

### Data, privacy and operations

#### DATA-001 — Customer privacy requests and erasure.
On a customer's request the owner exports everything Glove holds about them, or erases their personal data (name, contacts, addresses, messages, recordings, photos of people), keeping invoices and payment records the business must retain for tax with the person's details removed; each request is recorded with its outcome.

*Acceptance:* a flow test exports one customer's data, erases them, checks every personal field and file is gone while invoice totals and tax records remain, and checks a restored older backup cannot bring them back.

*Status:* missing — gap: no customer erasure.

#### DATA-002 — Every change, message and payment recorded.
Every command, message, call, payment, sync and agent action is on the timeline with who (or which agent or provider), when and what changed, readable in Activity and exportable.

*Acceptance:* a flow test performs one of each and finds them in Activity and the business export.

*Status:* partial — evidence `src/ui/activity.tsx`, `tests/api/records.test.mjs`; gap: every command is recorded; messages, calls, payments and syncs do not exist yet.

#### DATA-003 — Hosted on the owner's own Cloudflare account.
`rer deploy` puts Glove on the owner's Cloudflare account with their domain, backups and the provider secrets above, and the hosted installation passes the same acceptance flows as a local one.

*Acceptance:* a hosted deployment runs the API flow suite against its own URL and a restore from its backup.

*Status:* partial — evidence `wrangler.jsonc`, `deploy.json`; gap: Glove runs locally; no hosted deployment has been accepted.

#### DATA-004 — Free, open source and run on the owner's own computer.
Glove is MIT-licensed with no per-technician fee; `rer install`, `rer setup` and `rer dev` run a complete installation on the owner's own computer from a fresh checkout, and the owner keeps every record.

*Acceptance:* the browser journeys run real `rer setup` and `rer dev` in a fresh copy and complete the owner, dispatcher, technician and office journey.

*Status:* done — evidence `LICENSE`, `tests/browser/run.mjs`, `tests/browser/journey.spec.ts`.

## Push further

Agents run the front office and chase the unfinished job, beyond today's receptionist and scheduling agents. Each clause names what the agent does, on which data, and under what human control. Every agent works as an invited sign-in with the Agent role through the public commands (`GLOVE-10`); what it may do on its own is only what the owner granted under `AGENT-009`, and every action is on the timeline.

### Agents that run the job

#### AGENT-001 — AI front office for calls and texts.
*What the agent does:* answers the business's calls and texts 24/7 (always, after hours or on overflow, by owner setting), speaks and writes like the business, identifies the caller and their property, qualifies the problem, quotes flat-rate prices from the price book, and books into a real open slot (`BOOK-002`, `DISP-006`), then texts the confirmation; every call and thread gets a written summary, and the lead's details (name, address, problem, equipment, urgency) are extracted onto the request.

*Data:* the price book, technician capacity, skills and areas, the customer's history and equipment, and the owner's call script and policies.

*Human control:* the owner sets what it may book and quote, and the price limits; anything outside goes to a person as a prepared request; emergencies the owner names (gas smell, flooding, no heat in freezing weather) transfer to the on-call person at once; callers hear that they are speaking with an automated assistant and can reach a person.

*Acceptance:* a scripted-call journey (telephony and model fakes) books a tune-up into the right slot, refuses an out-of-policy price and hands it to the office, and transfers a gas-smell call within the owner's limit. An inbound text thread is answered by the agent and books a slot, with the confirmation text sent. With the mode set to after hours, a call inside business hours rings the office and the agent does not answer; with overflow, the agent answers only a call the office leaves ringing past the owner's limit. Every call transcript and text thread opens with the automated-assistant disclosure; saying or texting "talk to a person" transfers the call, or hands the thread to the office inbox. The request carries the extracted name, address, problem and urgency, and the call, transcript, thread, summary and booking are on the customer timeline.

*Status:* missing — gap: no telephony or answering agent.

#### AGENT-002 — Ready-to-dispatch check the day before.
*What the agent does:* for each next-day visit, confirms access (gate codes, pets, who will be home) with the customer by text, checks the parts the job needs are on the van or at the supplier (`STOCK-*`), and that permits, deposits and equipment history are in place; marks each visit ready or not ready with the reason.

*Data:* tomorrow's visits, customer threads, van stock, purchase orders and the job's quote lines.

*Human control:* the agent texts only from owner-approved templates; anything not ready goes to the dispatcher with the agent's proposed fix; the agent books and cancels nothing.

*Acceptance:* a flow test with five next-day visits (provider fakes) gets one access confirmation, one missing part and one unanswered customer, and checks the ready board and the three proposals.

*Status:* missing — gap: no messaging, stock or readiness checks.

#### AGENT-003 — Rebook around delays.
*What the agent does:* watches the day (technician locations, running timers, supplier delays, cancellations) and when a visit is likely to be missed, prepares a feasible reschedule that respects windows and skills, with options to offer the customer.

*Data:* the dispatch board, `DISP-005` locations, `COST-001` timers, purchase orders and customer preferences.

*Human control:* the dispatcher approves moved appointments (`GLOVE-07` review applies); the customer confirms a changed window by reply; with an `AGENT-009` grant, the agent may move a visit within the same day and window and text the customer itself.

*Acceptance:* a flow test runs a job long, the agent proposes moving the next visit to another technician, the dispatcher approves, and the customer's confirmation reply lands on the visit.

*Status:* partial — evidence `src/glove/commands/dispatch.ts`, `tests/api/flows.test.mjs`; gap: an agent can prepare a dispatch proposal a person approves; it cannot watch the day, predict a miss or talk to the customer.

#### AGENT-004 — Chase every invoice until paid and reconciled.
*What the agent does:* compares accepted scope, technician evidence, invoices, payments and the books; prepares invoices for completed unbilled work, sends payment nudges within the reminder policy, and prepares specific fixes for anything that does not reconcile (a payment in Stripe but not in QuickBooks, a refund without a credit).

*Data:* jobs, invoices, payments, payouts and `LEDGER-*` sync state.

*Human control:* the office approves every invoice and every credit or refund; nudges follow owner-approved templates and stop at zero; the agent never posts to the books or moves money.

*Acceptance:* a flow test with an unbilled job, an overdue invoice and an unreconciled payment checks one invoice draft, the reminder sequence and one reconciliation proposal, and that nothing posts without approval.

*Status:* partial — evidence `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`; gap: an agent can prepare invoice drafts; no chasing, payments or reconciliation.

#### AGENT-005 — Quote writer from the request.
*What the agent does:* from a request's description, photos, call transcript and the property's equipment age and history, drafts a good, better and best quote from the price book with the reasoning for each option.

*Data:* the request, photos, equipment, past jobs at the property and the price book.

*Human control:* a person approves each option's price (`GLOVE-03`); the agent never sends a quote.

*Acceptance:* a flow test drafts a quote for a 15-year-old furnace request (model fake) and checks three options from the price book with reasons, held as a draft until approved.

*Status:* partial — evidence `src/glove/commands/quotes.ts`, `tests/api/flows.test.mjs`; gap: an agent can draft quotes through the public command; nothing drafts them from the request's evidence.

#### AGENT-006 — Repeat-callback diagnosis.
*What the agent does:* when a property calls back about equipment serviced recently, gathers the equipment history, earlier photos, readings, materials and the manufacturer's manual, and prepares a diagnosis checklist and parts plan for the technician.

*Data:* equipment records, form results, photos and materials at the property.

*Human control:* advisory only; the licensed technician diagnoses and decides the work, and the agent never certifies safety.

*Acceptance:* a flow test raises a callback on a condenser with two prior visits and checks the prepared checklist cites both visits' readings.

*Status:* missing — gap: no equipment records or callback detection.

#### AGENT-007 — Keep every maintenance agreement fulfilled.
*What the agent does:* tracks agreements' due visits and entitlements, offers customers booking slots for due visits, chases unanswered ones, checks the promised maintenance was actually recorded, and prepares renewal outreach for agreements nearing their end.

*Data:* agreements, due visits, capacity, completed forms and customer threads.

*Human control:* the owner sets booking and renewal policy; customers choose their slots; technicians record completion; the agent changes no price or term.

*Acceptance:* a flow test with 20 due visits checks offers sent, 12 booked by customer reply, chases for the rest, and a flag on a completed visit with no maintenance form.

*Status:* missing — gap: no agreements.

#### AGENT-008 — Morning brief and margin watch.
*What the agent does:* each morning gives the owner a short brief: jobs at risk today, unbilled completed work, jobs over their cost estimate, overdue invoices, agreements due and leads waiting too long, each with one proposed next action.

*Data:* `REPORT-*`, `COST-*`, `PAY-*` and `BOOK-*` records.

*Human control:* read-only; each proposed action opens the normal screen for a person to act.

*Acceptance:* a flow test with a fixture day checks every item in the brief matches its records and links to its action.

*Status:* missing — gap: no reports or costing.

#### AGENT-009 — Agent policy and autonomy grants.
*What the agent does:* nothing on its own; this clause is the owner's control. The owner grants named actions to a named agent (for example send reminder texts from a template, book into open slots for listed services under a price limit, move a visit within its window), with a daily budget and quiet hours; every granted action records the grant it used; one switch pauses every agent.

*Data:* the grant register and the timeline.

*Human control:* only the owner grants and revokes; a revoked grant applies to the next command; an agent can never grant itself anything or approve its own preparation.

*Acceptance:* a flow test grants an agent "book tune-ups under $200", checks a booking succeeds and records the grant, a $250 booking is refused, revocation refuses the next one, and the pause switch stops all agents.

*Status:* done — evidence `src/glove/commands/grants.ts`, `src/glove/api.ts`, `src/ui/agent-grants.tsx`, `tests/api/grants.test.mjs`, `tests/api/security.test.mjs`.

## Honest boundaries

Glove does not do these, and this is how a US buyer gets them.

| Glove does not | How buyers get it |
| --- | --- |
| Act as a telecom carrier, register numbers itself or run a full business phone system | Twilio (or another provider) holds the numbers, A2P 10DLC registration and delivery; RingCentral, Dialpad or the owner's system keeps extensions and IVR; Glove records consent and opt-outs and answers on its own numbers (`COMM-002`, `COMM-009`) |
| Process raw card numbers, underwrite credit or lend | Stripe holds card and bank data under its PCI scope, and saved cards move from the old processor to Stripe directly (`MOVE-006`); Wisetack decides and funds financing; Glove records provider-confirmed outcomes (`PAY-*`) |
| Keep the general ledger, file sales tax or run payroll | QuickBooks Online, Xero or Pantry keep the books; Avalara or the owner's accountant files sales tax; Gusto, ADP RUN or QuickBooks Payroll pay people and file W-2 and 1099 forms (`LEDGER-*`, `MONEY-001`, `COST-002`) |
| Operate maps, GPS hardware or lead marketplaces | Google Maps and routing providers, Linxup, Samsara or Verizon Connect for fleet GPS, Google, Angi, Thumbtack and Yelp for leads (`DISP-002`, `DISP-005`, `BOOK-004`) |
| Replace trade licensing, diagnosis or safe-work judgment | Agents are advisory on technical work; the licensed technician remains responsible for the work and equipment release (`AGENT-006`) |
| Give legal advice on consumer, auto-renewal, surcharging or recording-consent law | Glove carries the notices, consents and settings; the owner sets the wording their state requires |
| Run route optimization or media processing unbounded inside a request | Bounded background jobs and external providers (`DISP-003`, `FIELD-006`) |
| Become a marketing suite or a construction project manager | Mango or Mailchimp for campaigns; Plinth or Buildertrend for multi-month builds |

Physical receipt, completed repair, safe equipment and accepted work require human evidence; a database state, a provider acknowledgment or a restore is not that evidence. A real owner export from each incumbent has not yet been reconciled; each move-in kit is proven against documented-shape fixtures until one is. "Glove" is the working name.

## Homepage claims

Every capability the approved homepage states (desk-built CLAIMS.md, 17 October 2026) maps to a clause above. Status is judged from the clauses' statuses at the judged commit: `done` when every backing clause is done, `missing` when none has started, otherwise `partial`. A claim ahead of the code stays on the page; its clauses are what the build rounds deliver.

| # | Claim | Clauses | Status |
| ---: | --- | --- | --- |
| 1 | Every call becomes a paid job. | `GLOVE-03`, `GLOVE-05`, `GLOVE-09`, `BOOK-005`, `AGENT-001`, `PAY-002` | partial |
| 2 | Glove answers your calls and texts | `AGENT-001`, `COMM-002`, `COMM-009` | missing |
| 3 | books the job | `GLOVE-05`, `BOOK-002`, `BOOK-005` | partial |
| 4 | sends the tech | `GLOVE-05` | done |
| 5 | takes payment on site | `PAY-003` | missing |
| 6 | keeps every maintenance plan on schedule | `PLAN-004`, `AGENT-007` | missing |
| 7 | 100% free, open source alternative to Jobber, Housecall Pro and ServiceTitan | `DATA-004` | done |
| 8 | Hero card: New call · Leaking water heater · Booked 11:00 am | `AGENT-001`, `GLOVE-05` | partial |
| 9 | Hero card: Dispatch · Luis · Van 3 · ETA 10:52 am (with a map) | `GLOVE-05`, `DISP-002`, `DISP-005` | partial |
| 10 | Hero card: Quote $1,850 · Accepted | `GLOVE-04` | done |
| 11 | Hero card: Part on backorder · Rebooked · Customer texted | `AGENT-003`, `STOCK-002`, `COMM-003` | partial |
| 12 | Hero card: Paid on site · $412.00 · card | `PAY-003` | missing |
| 13 | Hero card: Maintenance plan · 1 visit left · next Apr 3 | `PLAN-002` | missing |
| 14 | Glove picks up calls and texts 24/7, answers like your best dispatcher | `AGENT-001` | missing |
| 15 | books the job into a real open slot on a tech's calendar | `BOOK-002`, `DISP-006`, `AGENT-001` | missing |
| 16 | Marcus fully booked · Priya assigned, confirmation texted | `DISP-006`, `COMM-003` | missing |
| 17 | Requests from your website, Google and texts become quotes | `GLOVE-03`, `BOOK-001`, `BOOK-004`, `COMM-005` | partial |
| 18 | with good, better and best options | `QUOTE-001` | missing |
| 19 | Glove follows up until the customer says yes | `QUOTE-004` | missing |
| 20 | $500 deposit paid | `QUOTE-003` | missing |
| 21 | Signed Oct 19 · 2:14 pm | `QUOTE-002` | partial |
| 22 | Drag jobs on a live map board | `DISP-001`, `DISP-002` | partial |
| 23 | Glove routes every van, shows where each tech is | `DISP-003`, `DISP-005` | missing |
| 24 | reshuffles the day when a job runs long (on-my-way text sent) | `AGENT-003`, `COMM-004` | partial |
| 25 | Techs get the job, the history and the photos on their phone | `GLOVE-06`, `FIELD-001`, `CUST-001` | partial |
| 26 | take signatures on site | `GLOVE-08` | done |
| 27 | take payment on site (tap to pay) | `PAY-003` | missing |
| 28 | keep working with no signal | `GLOVE-06`, `FIELD-001` | partial |
| 29 | Technician card: checklist items done, Photos · 6, Customer signature | `GLOVE-06`, `GLOVE-08` | done |
| 30 | Van 2 stocked · parts for all 5 jobs on board | `STOCK-001`, `AGENT-002` | partial |
| 31 | Card, ACH and tap to pay through Stripe | `PAY-002`, `PAY-003` | missing |
| 32 | deposits on quotes and financing on big jobs | `QUOTE-003`, `PAY-006` | missing |
| 33 | Reminders stop when the balance hits zero | `PAY-005` | missing |
| 34 | it all syncs to QuickBooks Online | `LEDGER-001`, `LEDGER-004` | missing |
| 35 | Invoice INV-2207 timeline: sent, card declined, ACH link texted, paid by ACH | `PAY-001`, `PAY-002`, `PAY-005` | partial |
| 36 | Job margin 46% · estimated 41% | `COST-004` | done |
| 37 | Sell yearly HVAC and plumbing plans. Glove books every visit, bills on renewal and reminds members | `PLAN-002`, `PLAN-003`, `PLAN-004` | missing |
| 38 | Comfort Club members, tune-ups, auto-pay renewal, card update link texted | `PLAN-002`, `PLAN-003`, `PAY-008` | missing |
| 39 | The job agent confirms parts and access the day before | `AGENT-002` | missing |
| 40 | rebooks around delays | `AGENT-003` | partial |
| 41 | chases every invoice until it is paid and reconciled | `AGENT-004` | partial |
| 42 | Job #8840 timeline: reserved, confirmed by text, supplier delay, moved, paid and reconciled | `DATA-002`, `AGENT-002`, `AGENT-003`, `AGENT-004` | partial |
| 43 | Move from Jobber | `MOVE-001` | missing |
| 44 | Housecall Pro or ServiceTitan | `MOVE-002`, `MOVE-003` | missing |
| 45 | with your customers, jobs, quotes and open balances | `GLOVE-11`, `MOVE-005` | partial |
| 46 | 9 customers share a phone number · merge review | `CUST-005` | done |
| 47 | Run Glove on your own computer | `DATA-004` | done |
| 48 | or server | `DATA-003` | partial |
| 49 | keep every customer, job and payment. Export everything, any time | `GLOVE-12`, `DATA-001`, `PAY-004` | partial |
| 50 | Review requests: A five-star ask after every paid job | `COMM-008` | missing |
| 51 | Time tracking: Clock-ins tied to every job and visit | `COST-001` | done |
| 52 | Job costing: Estimate against actual, job by job | `COST-004` | done |
| 53 | Customer hub: Quotes, invoices and visits in one link | `COMM-006` | missing |
| 54 | Price book: Your parts and labor rates, ready to quote | `GLOVE-01`, `GLOVE-03` | done |
| 55 | Activity log: Every call, change and payment, recorded | `DATA-002` | partial |
| 56 | Every job, done and paid. | `GLOVE-08`, `GLOVE-09`, `PAY-002` | partial |
| 57 | Open source field service software for plumbing, HVAC, electrical and home service pros / Free and open source, MIT licensed | `DATA-004` | done |
| 58 | Closing cards: 31 jobs done, Paid today · $14,820 | `REPORT-001`, `PAY-002` | partial |

## Status

Judged from the code and tests at commit `94eec23cbcf97e6c8531839db1b1261037c3e7b4` (17 October 2026).

`done` means the behavior ships and a cited test exercises it; `partial` means some of it ships and the Gap says what is missing; `missing` means there is no implementation. Status is a build-planning judgment, not acceptance; [ACCEPTANCE.md](ACCEPTANCE.md) decides acceptance.

| Clauses | Done | Partial | Missing | Total |
| --- | ---: | ---: | ---: | ---: |
| Published | 13 | 0 | 0 | 13 |
| Target and push further | 18 | 18 | 65 | 101 |
| All | 31 | 18 | 65 | 114 |

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
| `GLOVE-10` | Agent prepares, person approves | published | done | `tests/api/flows.test.mjs`, `tests/api/security.test.mjs` |  |
| `GLOVE-11` | Move in from ServiceM8 with dry run, journal and undo | published | done | `tests/api/flows.test.mjs`, `tests/api/movein.test.mjs` |  |
| `GLOVE-12` | The whole timeline, exported and restorable | published | done | `tests/api/flows.test.mjs`, `tests/api/records.test.mjs`, `tests/portable.mjs` |  |
| `HTTP-001` | Foundation HTTP routing | published | done | `tests/runtime.mjs` |  |
| `MONEY-001` | US dollars and sales tax | target | missing |  | money is fixed to AUD with one 10% GST rate (`src/glove/money.ts`) |
| `MONEY-002` | US business identity on every document | target | partial | `src/glove/commands/setup.ts` | the business record holds name, ABN, phone and address only; no EIN, license numbers, logo or branded documents |
| `MONEY-003` | Price book with costs, markup and flat rates | target | done | `src/glove/pricebook.ts`, `src/glove/commands/pricebook.ts`, `src/ui/price-book.tsx`, `tests/api/pricebook.test.mjs` |  |
| `CUST-001` | Customer and property history in one place | target | done | `src/glove/commands/setup.ts`, `src/glove/history.ts`, `src/ui/customers.tsx`, `src/ui/property-history.tsx`, `tests/api/customers.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `CUST-002` | Installed equipment and warranties | target | done | `src/glove/commands/equipment.ts`, `src/glove/equipment.ts`, `src/ui/equipment.tsx`, `tests/api/equipment.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `CUST-003` | Customer CSV import and export | target | done | `src/glove/movein/csv.ts`, `src/glove/movein/kit.ts`, `src/ui/csv-import.tsx`, `tests/api/csv.test.mjs` |  |
| `CUST-004` | Tags, custom fields and segments | target | missing |  | no custom fields, tags or segments |
| `CUST-005` | Duplicate detection and merge review | target | done | `src/glove/duplicates.ts`, `src/glove/commands/merge.ts`, `src/ui/duplicates.tsx`, `src/glove/movein/kit.ts`, `tests/api/merge.test.mjs`, `tests/api/csv.test.mjs` |  |
| `BOOK-001` | Request form on the business website | target | missing |  | requests are entered by staff only (`enquiry.create`) |
| `BOOK-002` | Online booking into real availability | target | missing |  | no customer-facing booking |
| `BOOK-003` | Lead sources and the request pipeline | target | done | `src/glove/pipeline.ts`, `src/glove/commands/quotes.ts`, `src/ui/quotes.tsx`, `tests/api/pipeline.test.mjs` |  |
| `BOOK-004` | Leads from Google, Angi, Thumbtack and Yelp | target | missing |  | no lead-source connectors |
| `BOOK-005` | Service calls booked without a quote | target | partial | `src/glove/commands/dispatch.ts`, `src/glove/commands/invoices.ts` | `job.create` refuses a job without an accepted quote (`NOT_ACCEPTED`); booking, on-site materials and invoice preparation exist only for quoted jobs; technicians cannot add priced lines |
| `BOOK-006` | Assessment visits on a request | target | missing |  | requests carry no visits; only jobs made from accepted quotes are booked (`src/glove/commands/dispatch.ts`) |
| `QUOTE-001` | Good, better and best options and add-ons | target | missing |  | a quote is one set of lines per revision |
| `QUOTE-002` | Online approval with e-signature | target | partial | `src/glove/commands/quotes.ts`, `tests/api/flows.test.mjs` | staff record the customer's answer, including "signed"; there is no customer-facing quote link or e-signature |
| `QUOTE-003` | Deposits on approval | target | missing |  | no payments |
| `QUOTE-004` | Automatic quote follow-up | target | missing |  | Glove sends nothing |
| `QUOTE-005` | Branded quote, invoice and report documents | target | missing |  | documents exist only as desk screens and the invoice CSV |
| `QUOTE-006` | Field quotes and change orders, offline | target | missing |  | technicians cannot see prices or create quotes |
| `QUOTE-007` | Discounts on quotes and invoices | target | missing |  | no discounts; a quote line is a price-book or custom line at its price (`src/glove/commands/quotes.ts`) |
| `DISP-001` | Drag-and-drop dispatch board | target | partial | `src/ui/dispatch.tsx`, `src/glove/commands/dispatch.ts` | a day board with booking forms; no drag-and-drop, week or month views or unscheduled list |
| `DISP-002` | Map board and travel time | target | missing |  | no map, travel time or drawn zones |
| `DISP-003` | Route optimization | target | missing |  | no routing |
| `DISP-004` | Skills, availability, time off and service areas | target | partial | `src/glove/eligibility.ts`, `src/glove/calendar.ts`, `src/glove/commands/calendar.ts`, `src/ui/availability.tsx`, `tests/api/eligibility.test.mjs` | availability not read from Lanyard (no Lanyard read door yet) |
| `DISP-005` | Live technician location and ETA | target | missing |  | no location |
| `DISP-006` | Arrival windows and automatic assignment | target | missing |  | visits are a technician's start and end time chosen by the dispatcher |
| `DISP-007` | Multi-day jobs, crews and subcontractors | target | partial | `src/glove/commands/dispatch.ts` | a job can hold several visits; no crews, subcontractor role or 1099 totals |
| `DISP-008` | Google Calendar and Outlook sync | target | missing |  | no calendar connection |
| `COMM-001` | Customer email with delivery status | target | missing |  | the mail module serves sign-in links only; Glove records sends but sends no customer email |
| `COMM-002` | Texts from a registered US number | target | missing |  | no SMS |
| `COMM-003` | Appointment confirmations and reminders | target | missing |  | Glove sends nothing |
| `COMM-004` | On-my-way and job status texts | target | missing |  | no customer notices |
| `COMM-005` | Two-way texting inbox | target | missing |  | no messaging |
| `COMM-006` | Customer hub | target | missing |  | no customer-facing portal |
| `COMM-007` | One conversation history per customer | target | partial | `src/ui/jobs.tsx`, `src/ui/activity.tsx` | every command is on the job timeline; no messages or calls exist to record |
| `COMM-008` | Review requests after paid jobs | target | missing |  | no review requests |
| `COMM-009` | Calls on the business number | target | missing |  | no telephony |
| `FIELD-001` | Offline day of jobs that survives a reload | target | partial | `src/ui/outbox.ts`, `src/ui/technician.tsx`, `tests/browser/journey.spec.ts` | queued captures survive an interruption in an open page; the day's jobs are not cached across a reload |
| `FIELD-002` | Custom forms and inspections | target | done | `src/glove/forms.ts`, `src/glove/commands/forms.ts`, `src/glove/commands/field.ts`, `src/ui/forms.tsx`, `tests/api/forms.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `FIELD-003` | Shareable service report | target | partial | `src/glove/commands/field.ts`, `tests/api/flows.test.mjs` | completion records a summary and signature; no customer-facing report |
| `FIELD-004` | Installable technician app with push | target | missing |  | the phone screen is a web page with no manifest or push |
| `FIELD-005` | Native iOS and Android apps | target | missing |  | no native apps |
| `FIELD-006` | Equipment nameplate capture | target | missing |  | no equipment records or nameplate reading |
| `FIELD-007` | Refrigerant tracking for HVAC | target | done | `src/glove/commands/field.ts`, `src/glove/equipment.ts`, `src/ui/equipment.tsx`, `tests/api/equipment.test.mjs` |  |
| `FIELD-008` | The whole office on the owner's phone | target | partial | `tests/browser/journey.spec.ts` | the first-release desk journey (team, customers, request to accepted quote, job and booking, invoice preparation and export) runs at 390 px; nothing is sent or paid, there is no inbox or dashboard, and no horizontal-scroll check |
| `COST-001` | Clock-ins and job timers | target | done | `src/glove/commands/time.ts`, `src/ui/clock.tsx`, `src/glove/dashboard.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs` |  |
| `COST-002` | Timesheets and payroll export | target | missing |  | no timesheets |
| `COST-003` | Job expenses and receipts | target | done | `src/glove/commands/expenses.ts`, `src/glove/commands/invoices.ts`, `src/ui/expenses.tsx`, `tests/api/expenses.test.mjs` |  |
| `COST-004` | Estimate versus actual job costing | target | done | `src/glove/costing.ts`, `src/glove/api.ts`, `src/glove/view.ts`, `src/ui/costing.tsx`, `tests/api/costing.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `COST-005` | Live margin warnings | target | done | `src/glove/margins.ts`, `src/glove/api.ts`, `src/glove/view.ts`, `src/ui/costing.tsx`, `src/ui/team.tsx`, `tests/api/margins.test.mjs` |  |
| `PAY-001` | USD invoices sent from Glove | target | partial | `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` | invoices are prepared, approved, exported and corrected; nothing is sent, presented or paid |
| `PAY-002` | Card, ACH and wallet payments through Stripe | target | missing |  | no payments |
| `PAY-003` | Tap to Pay and card readers on site | target | missing |  | no payments or native app |
| `PAY-004` | Partial payments, balances, refunds and credits | target | missing |  | no balances or payments |
| `PAY-005` | Payment reminders that stop at zero | target | missing |  | Glove sends nothing |
| `PAY-006` | Consumer financing through Wisetack | target | missing |  | no financing |
| `PAY-007` | Payouts and reconciliation | target | missing |  | no payments |
| `PAY-008` | Saved payment methods and autopay with consent | target | missing |  | no payments |
| `PAY-009` | Office charges a card by phone or on file | target | missing |  | no payments; the Office role records invoices only up to approval and export (`src/glove/commands/invoices.ts`) |
| `LEDGER-001` | QuickBooks Online sync | target | missing |  | no QuickBooks connection |
| `LEDGER-002` | Xero sync | target | partial | `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` | a CSV in Xero's sales-invoice import columns; no live connection or payment sync |
| `LEDGER-003` | Pantry sync | target | missing |  | no Pantry connection |
| `LEDGER-004` | First QuickBooks connection linked to existing records | target | missing |  | no QuickBooks connection; the ServiceM8 kit keeps source IDs but no accounting references (`src/glove/movein/servicem8.ts`) |
| `PLAN-001` | Recurring jobs | target | missing |  | no recurring jobs |
| `PLAN-002` | Maintenance agreements and memberships | target | missing |  | no agreements |
| `PLAN-003` | Recurring billing and renewals | target | missing |  | no recurring billing |
| `PLAN-004` | Due-visit scheduling until done or declined | target | missing |  | no agreements |
| `PLAN-005` | Invoicing rules for recurring jobs | target | missing |  | no recurring jobs or recurring invoicing |
| `STOCK-001` | Van and warehouse stock | target | done | `src/glove/stock.ts`, `src/glove/commands/stock.ts`, `src/glove/commands/field.ts`, `src/ui/stock.tsx`, `tests/api/stock.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `STOCK-002` | Purchase orders to suppliers | target | missing |  | no purchasing |
| `TEAM-001` | Custom roles and permissions | target | done | `src/glove/access.ts`, `src/glove/commands/setup.ts`, `src/ui/custom-roles.tsx`, `tests/api/security.test.mjs` |  |
| `TEAM-002` | Branches | target | missing |  | one business, one time zone |
| `TEAM-003` | Technician commissions and bonuses | target | missing |  | no commissions |
| `REPORT-001` | Owner dashboard | target | done | `src/glove/dashboard.ts`, `src/glove/api.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs` |  |
| `REPORT-002` | Job, revenue, technician and lead reports | target | missing |  | no reports |
| `REPORT-003` | Receivables aging | target | missing |  | no balances |
| `MOVE-001` | Move in from Jobber | target | missing |  | the only kit is ServiceM8 (`src/glove/movein/servicem8.ts`) |
| `MOVE-002` | Move in from Housecall Pro | target | missing |  | no Housecall Pro kit |
| `MOVE-003` | Move in from ServiceTitan | target | missing |  | no ServiceTitan kit |
| `MOVE-004` | Move in from FieldPulse and Workiz | target | missing |  | no FieldPulse or Workiz kit |
| `MOVE-005` | Open balances, agreements and equipment carried over | target | partial | `src/glove/movein/servicem8.ts`, `tests/api/movein.test.mjs` | the ServiceM8 kit brings customers, jobs, quotes, visits, materials and files; no balances, agreements, equipment or cutover checklist |
| `MOVE-006` | Saved cards and autopay carried over | target | missing |  | no saved payment methods or autopay; the ServiceM8 kit carries no payment data (`src/glove/movein/servicem8.ts`) |
| `API-001` | Documented HTTP API | target | done | `API.md`, `tests/api/flows.test.mjs` |  |
| `API-002` | Webhooks and integration tokens | target | missing |  | integrations sign in as invited people; no tokens or webhooks |
| `API-003` | Zapier and Crank apps | target | missing |  | no published apps |
| `API-004` | CompanyCam photos | target | missing |  | no CompanyCam connection |
| `API-005` | Workflow rules | target | missing |  | no automation rules |
| `DATA-001` | Customer privacy requests and erasure | target | missing |  | no customer erasure |
| `DATA-002` | Every change, message and payment recorded | target | partial | `src/ui/activity.tsx`, `tests/api/records.test.mjs` | every command is recorded; messages, calls, payments and syncs do not exist yet |
| `DATA-003` | Hosted on the owner's own Cloudflare account | target | partial | `wrangler.jsonc`, `deploy.json` | Glove runs locally; no hosted deployment has been accepted |
| `DATA-004` | Free, open source and run on the owner's own computer | target | done | `LICENSE`, `tests/browser/run.mjs`, `tests/browser/journey.spec.ts` |  |
| `AGENT-001` | AI front office for calls and texts | push-further | missing |  | no telephony or answering agent |
| `AGENT-002` | Ready-to-dispatch check the day before | push-further | missing |  | no messaging, stock or readiness checks |
| `AGENT-003` | Rebook around delays | push-further | partial | `src/glove/commands/dispatch.ts`, `tests/api/flows.test.mjs` | an agent can prepare a dispatch proposal a person approves; it cannot watch the day, predict a miss or talk to the customer |
| `AGENT-004` | Chase every invoice until paid and reconciled | push-further | partial | `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` | an agent can prepare invoice drafts; no chasing, payments or reconciliation |
| `AGENT-005` | Quote writer from the request | push-further | partial | `src/glove/commands/quotes.ts`, `tests/api/flows.test.mjs` | an agent can draft quotes through the public command; nothing drafts them from the request's evidence |
| `AGENT-006` | Repeat-callback diagnosis | push-further | missing |  | no equipment records or callback detection |
| `AGENT-007` | Keep every maintenance agreement fulfilled | push-further | missing |  | no agreements |
| `AGENT-008` | Morning brief and margin watch | push-further | missing |  | no reports or costing |
| `AGENT-009` | Agent policy and autonomy grants | push-further | done | `src/glove/commands/grants.ts`, `src/glove/api.ts`, `src/ui/agent-grants.tsx`, `tests/api/grants.test.mjs`, `tests/api/security.test.mjs` |  |
