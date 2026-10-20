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
| Payroll, tax withholding and W-2/1099 filing | [Envelope](https://github.com/just-every/run-envelope) (or Gusto, ADP RUN, QuickBooks Payroll) | Approved timesheets and subcontractor totals exported in the payroll provider's import shape (`COST-002`) |
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

- A new US installation must use USD, the US time zone chosen at setup and the sales-tax settings of `MONEY-001`; the current implementation gap is recorded under that clause. Installations set up before 17 October 2026 retain their recorded settings, including AUD, 10% GST and `Australia/Sydney` where configured.
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
| Office | Customers and sites, requests, service calls without a quote (`BOOK-005`), record a quote as sent, invoice preparation, approval, sending, export and correction, recording payments, taking card payments by phone or on a saved card (`PAY-009`), customer messages. |
| Technician | Sees only visits ever assigned to them (with those jobs' customers, sites, equipment and evidence, without prices unless the owner allows field quoting under `QUOTE-006`); records arrival, time, checklist and forms, notes, photos, materials and completion on those visits, and takes payment on site under `PAY-003`. |
| Subcontractor | Sees only the visits now assigned to them, with the job title, checklist and forms, the site's address and access notes, the customer's name and phone and their own captures; records arrival, checklist and forms, notes, photos, materials by description and completion on those visits (`DISP-007`). No money, time clock or other people's work. |
| Agent | Reads the desk's records; prepares requests, quote drafts and revisions, dispatch proposals, messages and invoice drafts. Never approves, sends, records a customer's answer, books, exports, refunds or changes roles, except actions the owner granted under `AGENT-009`. |
| Viewer | Reads the desk's records. |

Target roles: custom roles built from these permissions (`TEAM-001`) and the customer, who signs in to the customer hub by a link sent to their own email or phone and sees only their own records (`COMM-006`).

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
A US installation prices in USD. The owner sets sales-tax rates by jurisdiction (state, county, city and special district combined), and each site's address selects its rate; each price-book item is taxable or not, so a state that taxes parts but not labor is expressible; a customer can be tax-exempt with a private PDF/JPEG/PNG exemption certificate (up to 10 MB), its number and expiry on file; quotes and invoices show tax per jurisdiction. Optional Avalara AvaTax or Stripe Tax rate lookup proposes a combined rate and service treatment by address for the owner to review and apply; Glove calculates and records tax, it does not file returns; discounts reduce the taxable amount in the order `QUOTE-007` states. The `REPORT-002` sales-tax report then splits tax by these jurisdictions.

For branches (TEAM-002), each branch keeps its own US tax settings; the quote and invoice use the job’s branch jurisdiction, and the REPORT-002 sales-tax report includes branch and jurisdiction rows with a branch filter before this capability ships.

*Acceptance:* a flow test sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites in each and for an exempt customer, and checks exact cents and the per-jurisdiction breakdown on the quote, invoice, export and explicitly mapped downloadable QuickBooks Online inspection payload (no sync); LEDGER-001 and LEDGER-004 carry the actual transport and provider-fake assertion before they ship; the `REPORT-002` sales-tax report matches the invoices' tax by jurisdiction to the cent. The optional Avalara AvaTax and Stripe Tax lookups (provider fakes at their network edges) each return an owner-applied proposal, and an unregistered or rateless answer reads "rate unavailable", never 0%.

The flow also sets different branch tax jurisdictions, checks each branch’s quote/invoice/export/provider tax, and narrows the REPORT-002 tax rows to one branch.

*Semantics (MONEY-001, 19 October 2026; ct 16:15Z and 16:25Z):* new installations default to USD and unsaved booking zones to America/Chicago; an existing business retains its saved currency, tax and time zone. A jurisdiction is the owner's named combined rate, decimal percent to four places, with ZIP matches and an optional default. A site can choose explicitly; overlapping ZIP matches require that choice, and an unmatched configured address without a default is refused. Branch settings override business settings. FREE items are not taxed; TAXABLE items (and legacy GST codes) follow the jurisdiction, whose service-labor switch applies to service items. Quantities are thousandths, line multiplication and tax use integer arithmetic, rounding half up per line and once on the document's combined taxable cents. The revision freezes currency, jurisdiction, rate, labor classification and exemption evidence; accepting options/add-ons and preparing/correcting the invoice retains that snapshot. Certificate evidence is private to the customer's full desk readers, including branch limits, stored in original chunks, archived with the customer and retained when replaced; exemption expiry is inclusive in the branch's local date. Any physical customer removal deletes its originals and chunks; DATA-001 carries the customer erasure door and restore-fence assertion before shipping. US exports keep approved jurisdiction, rate, taxable basis, tax and total; legacy AUD exports retain Xero columns. Tax reports use each invoice's first approval local date (inclusive period bounds), grouping the latest approved tax snapshot by branch and jurisdiction. Before payments ship, the report honestly says tax on approved invoices; PAY-002 carries collected tax. The mapped QuickBooks JSON is an inspection document only; LEDGER-001/004 carry live posting, matching and provider assertions. QUOTE-007 carries discount allocation through this same tax calculation before discounts ship. Stripe lookup sends only service address and two fixed sample classifications, never identity or certificates; the owner selects the service classification, reviews the response and applies settings. Unsupported, partial or unregistered treatment is unavailable for automatic application, never inferred as zero tax or exemption. Every new lookup/certificate event appears in Activity and business export without credentials. The Avalara AvaTax lookup follows the same rules as Stripe (ct WORDING AUDIT 24, 19 October 2026): the owner alone connects it, and the account ID, license key, company code and production/sandbox choice are one sealed secret excluded from state, archives and export. A lookup creates one uncommitted AvaTax `SalesOrder` (never recorded in AvaTax) at the service address with the fixed customer code `glove-address-rate-lookup` and two $100 sample lines: `P0000000` general tangible goods and the AvaTax tax code the owner enters for the service. It is a proposal only when every parts jurisdiction is fully taxable and their rates, summed in millionths and shown as a percent to four places, exceed zero, and the service is either fully taxable at that same combined rate (labor taxed) or wholly non-taxable (labor exempt); no nexus, zero, mixed, partial, exempt or refused answers read "rate unavailable", never 0%. The owner applies a proposal through the ordinary jurisdiction settings.

*Status:* done — evidence `src/glove/sales-tax.ts`, `src/glove/qbo-invoice.ts`, `src/glove/commands/tax-certificates.ts`, `src/glove/commands/tax-lookup.ts`, `src/glove/commands/invoices.ts`, `src/ui/tax-settings.tsx`, `tests/api/money.test.mjs`, `tests/portable.mjs`, `tests/browser/money.spec.ts`, `src/glove/avatax.ts`.


#### MONEY-002 — US business identity on every document.
The business records its legal name, DBA, EIN, state contractor license numbers (by trade and state), insurance details and logo; quotes, invoices, service reports and agreements print the license numbers and terms a state requires, US address and phone formats, and US date formats. Customers record a billing and service address separately and a business customer's tax ID.

*Acceptance:* a browser journey sets EIN, two license numbers and a logo and finds them on the business record after a reload (opening a quote, an invoice and a service report and finding each printed is `QUOTE-005`'s acceptance); the customer record keeps separate billing and service addresses through edit and export.

*Semantics (MONEY-002, 19 October 2026):* the business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first release), up to 20 contractor licenses (trade, two-letter state, number), insurance (carrier, policy number, expiry date) and a logo image in its own format (PNG, JPEG or WebP, at most 1.5 MB), each kept when a save leaves it out; every signed-in role can open the logo. Customers keep a billing address apart from each site's service address, and a business customer's tax ID; the customer export carries both addresses in their own columns. Printing these on quotes, invoices, service reports and agreements, with US address, phone and date formats, is `QUOTE-005`'s.

*Status:* done — evidence `src/glove/commands/setup.ts`, `src/glove/api.ts`, `src/ui/identity.tsx`, `src/ui/team.tsx`, `tests/browser/journey.spec.ts`.

#### MONEY-003 — Price book with costs, markup and flat rates.
Every service and material carries a unit cost, a price and an optional markup rule by category, supplier part numbers, images and a description customers see; flat-rate task pricing (one price for the task, labor and parts inside) sits beside time-and-materials; the owner bulk-imports and exports the price book by CSV and updates prices in bulk by percentage.

*Acceptance:* a flow test imports a 200-line price book CSV with costs and markups, raises one category by 5%, quotes a flat-rate task and a time-and-materials line, and checks prices, costs and the round-trip export.

*Semantics (MONEY-003, 19 October 2026):* an item is a service, a material or a flat-rate task. Its price is fixed, or follows its category's markup: unit cost × (100 + markup) / 100, rounded half up to the cent, recomputed whenever the cost or the markup changes. A task's cost is the sum of its contents' costs at their quantities (each rounded half up to the cent); its contents are services and materials, never other tasks. A bulk change multiplies each fixed price in one category by (100 + percent) / 100, rounded half up to the cent; markup prices follow cost instead. A price-book quote line keeps the item's unit cost when it was priced. Costs are margin figures: technicians never read them, and a custom role reads them only with `reports.read`. The price-book CSV matches rows by Code (new, updated with the fields that change, unchanged, or rejected with its reason), is committed only as the exact preview, keeps checklists, skills and images, and ignores a markup row's Price; re-importing the export changes nothing. The customer-facing description is stored on the item; the doors that show customers documents (`QUOTE-002`, `QUOTE-005`, `COMM-006`) print it when they ship.

*Status:* done — evidence `src/glove/pricebook.ts`, `src/glove/commands/pricebook.ts`, `src/glove/commands/setup.ts`, `src/ui/price-book.tsx`, `tests/api/pricebook.test.mjs`.

### Customers, properties and equipment

#### CUST-001 — Customer and property history in one place.
A customer has several contacts and properties; each property's history shows every record kind Glove keeps: requests, quotes, jobs, visits, photos, checklist forms, notes, materials, refrigerant, completion, invoices and equipment ever recorded there, newest first. Payments (PAY-*), agreements (PLAN-*) and messages (COMM-*) join the property history as standing obligations of their own clauses; each such clause must add its entries to the property history before it ships. Search across customers covers name, phone, email and address; a business customer keeps a billing contact and an accounts-payable email apart from the site contact, and can require a purchase-order number on its invoices. The PO requirement is enforced at invoice approval and the PO travels in the invoice CSV Reference.

*Acceptance:* a browser journey opens a customer with two properties and finds each property's full history of every kept record kind: requests, quotes, jobs, visits, photos, checklist forms, notes, materials, refrigerant, completion, invoices and equipment; a search by a phone fragment and by a street name finds them; a business customer's billing contact and accounts-payable email stay apart from its site contacts. Require a PO for that customer, refuse invoice approval without it, then add the PO, approve and verify it travels in the invoice CSV Reference. Each PAY-* payment, PLAN-* agreement and COMM-* message clause must prove its entries appear in the property history before it ships; these remain standing obligations of those clauses.

*Status:* done — evidence `src/glove/commands/setup.ts`, `src/glove/history.ts`, `src/ui/customers.tsx`, `src/ui/property-history.tsx`, `tests/api/customers.test.mjs`, `tests/browser/journey.spec.ts`. A job's purchase orders joined it with `STOCK-002`; payments, agreements and messages join the property history as `PAY-*`, `PLAN-*` and `COMM-*` land.

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
The owner adds custom fields to customers, properties, jobs and equipment, tags customers (for example "commercial", "VIP", "do not service"), and saves segments (customers with equipment older than ten years and no agreement); a segment can be exported or pushed to Mango or Mailchimp as an audience. A tag is also a condition of a workflow rule (`API-005`).

*Acceptance:* a flow test defines two custom fields and a segment, and checks that the segment's members match the filter and that the export and the Mango push (provider fake) carry exactly them; a workflow rule conditioned on the "commercial" tag runs only for a tagged customer's job (`API-005`).

*Semantics (CUST-004, 19 October 2026):* the owner defines custom fields on customers, sites, jobs or equipment (text, number, date, yes/no, or a choice of 2–20 values); a field keeps its record and type. The owner, dispatchers and the office set field values and a customer's tags (up to 20, each up to 40 characters, kept once whatever the case) and save segments. A technician sees the values on the sites, jobs and equipment of visits assigned to them, never a customer's tags or customer fields. A segment's members are the live customers (never merged-away ones) that have all of its "has" tags and none of its "has none" tags (compared without case), meet every field condition (is, over, under, set, unset; a site field holds when any of the customer's sites meets it) and, when set, have equipment at one of their sites installed at least N years before today's local date. "No agreement" holds for every customer until agreements exist; `PLAN-002` carries it in its text and acceptance. The members list reads for the desk; the members CSV (name, email, phone, tags, customer fields) for the owner and office, like the customer CSV. The owner connects Mango (its integration address and a contacts:write credential) or Mailchimp (an API key and audience ID); the key is kept as a secret, never in records, exports, logs or the archive. The owner and office push a segment: Glove holds no marketing consent, so a push never subscribes anyone: Mango receives each member with an email (email, name, tags, the segment as its list, without `subscribe`), Mailchimp adds new members as transactional and tags them with the segment and their tags; members without an email or tagged "do not contact" are skipped and counted (customers who opted out are excluded with `COMM-002`'s consent record, which carries it in its text and acceptance), and each push is recorded with its counts and the provider's refusals. A tag is a condition of a workflow rule (`API-005`).

*Status:* done — evidence `src/glove/segments.ts`, `src/glove/commands/segments.ts`, `src/glove/commands/marketing.ts`, `src/glove/rules.ts`, `src/ui/custom-fields.tsx`, `tests/api/segments.test.mjs`.

#### CUST-005 — Duplicate detection and merge review.
Glove flags customers that share a phone number, email or normalized address, on entry, on CSV import and on move-in, and offers a merge review: what each record holds, which values win, and what moves (properties, jobs, invoices, messages); a merge is one journaled change that can be undone.

*Acceptance:* a flow test creates nine customers sharing a phone number, reviews and merges them, checks every job and invoice now hangs off the survivor, and undoes the merge.

*Status:* done — evidence `src/glove/duplicates.ts`, `src/glove/commands/merge.ts`, `src/ui/duplicates.tsx`, `src/glove/movein/kit.ts`, `src/glove/movein/csv.ts`, `tests/api/merge.test.mjs`, `tests/api/csv.test.mjs`. Customers sharing a phone, email or address are flagged on entry, in the move-in preview and in the CSV preview (against Glove customers and each other), reviewed and merged as one undoable change. Messages join what a merge moves when `COMM-*` lands them.

### Requests and online booking

#### BOOK-001 — Request form on the business website.
An embeddable request form (a script tag or link for Pane, WordPress, Squarespace or any site) takes the service wanted, address, contact, photos and preferred times; Cloudflare Turnstile blocks spam; the request lands in the queue with its source, creates or matches the customer, and the office is notified. The request's photos join `AGENT-005`'s quote-drafting evidence only while an owner switch is on, whose privacy ct rules on before this ships.

*Acceptance:* a browser journey submits the embedded form from a fixture page with two photos, finds the request in the queue matched to an existing customer by phone, and checks that a submission failing Turnstile writes nothing; a flow test drafts an `AGENT-005` quote from that request (model fake) and finds its photos sent only with the owner's switch on.

*Status:* missing — gap: requests are entered by staff only (`enquiry.create`).

#### BOOK-002 — Online booking into real availability.
A customer chooses a service and sees arrival windows computed from real technician capacity: skills, service area, working hours, time off, existing visits and travel; the owner decides per service whether a booking is confirmed instantly or waits for approval, and whether a deposit is taken (`QUOTE-003`); the booked visit is assigned under `DISP-006` and confirmed under `COMM-003`. The owner sets per service a cancellation window, a late-cancellation fee and a no-show fee. The booking page states the policy before the customer confirms, and where a deposit or fee applies the customer saves a card with the `PAY-008` consent that names the fee. A customer canceling (from the confirmation link or the hub, `COMM-006`) inside the window, or a visit the dispatcher marks as a no-show, puts the fee on the visit as a proposal the office charges to the saved card under `PAY-009` or waives with a reason; a cancellation outside the window charges nothing and refunds any deposit under `PAY-004`. Visits booked by the AI front office (`AGENT-001`) carry the same policy, read out on the call or texted with the confirmation.

*Acceptance:* a browser journey books a tune-up through the public booking page, sees a full day refused and a window offered on a technician with the right skill, and finds the visit on the dispatch board with its confirmation queued. A second booking for a service with a $50.00 deposit takes it (Stripe fake), and the deposit shows on the job. With a 24-hour window and a $75.00 late-cancellation fee, a booking the customer cancels 3 hours ahead puts the $75.00 fee on the visit, and the office charges it to the saved card; a booking canceled 3 days ahead charges nothing and refunds its $50.00 deposit; and a visit marked as a no-show proposes the no-show fee, which the office waives with a reason on the timeline. It also carries `DISP-006`: each online booking is assigned with `technicianId: "auto"` and lands on an eligible technician inside its window.

*Status:* missing — gap: no customer-facing booking.

#### BOOK-003 — Lead sources and the request pipeline.
Every request carries its source (website, Google, phone, text, Angi, Thumbtack, Yelp, referral, repeat customer, marketing campaign) and moves through a pipeline (new, contacted, quoted, won, lost with a reason); the office sees an aging pipeline board, and reports show conversion and revenue by source.

*Acceptance:* a flow test creates requests from four sources, quotes and wins two, loses one with a reason, and checks the pipeline and the conversion-by-source report.

*Status:* done — evidence `src/glove/pipeline.ts`, `src/glove/commands/quotes.ts`, `src/ui/quotes.tsx`, `tests/api/pipeline.test.mjs`.

#### BOOK-004 — Leads from Google, Angi, Thumbtack and Yelp.
Glove connects Google Local Services Ads and Reserve with Google, Angi, Thumbtack and Yelp lead feeds (each by the provider's own API or webhook, under the provider's eligibility rules), lands each lead as a request with its source and cost, matches existing customers, and replies within the provider's response window through `COMM-002` or the provider's message channel. Applying a lead's cost is also a workflow rule action (`API-005`).

*Acceptance:* a flow test posts a recorded lead payload from each provider (provider fakes), finds four requests with sources and lead costs, one matched to an existing customer, and an acknowledgment queued for each; a workflow rule on requests from Angi applies its lead cost (`API-005`).

*Status:* missing — gap: no lead-source connectors.

#### BOOK-005 — Service calls booked without a quote.
The dispatcher or office creates a job straight from a request, a call or the customer record with zero or more lines (for example a diagnostic or trip fee from the price book), books its visit under `GLOVE-05`'s conflict review with an arrival window (`DISP-006`), and the customer gets the confirmation of `COMM-003`. On site the technician adds flat-rate or time-and-materials lines from the price book (with prices where the owner allows under `QUOTE-006`, otherwise priced by the office), and the customer's approval of the added work is recorded on the phone; the fee, the added lines and the recorded materials flow to the invoice draft under `GLOVE-09`. A job made without a quote says so on its timeline, and none of its prices counts as approved until its invoice revision is approved.

*Acceptance:* a flow test takes a phoned-in request for a leaking water heater, creates a job with an $89.00 diagnostic fee from the price book, books it for today, and the technician adds a flat-rate valve replacement and 1.5 hours of labor on site with the customer's approval; the invoice draft carries exactly the fee, both lines and the recorded materials, and is approved and invoiced; a browser journey creates the same kind of job from the customer record.

*Semantics (BOOK-005, 19 October 2026):* the dispatcher, the office or the owner makes a service call (`job.create` without a quote) from a request (which is then won) or from the customer record, at one of that customer's sites, with zero or more lines from the price book or custom; its checklist and forms come from those lines as for a quoted job. Its timeline says it was made without a quote, its screen shows no accepted price, and its booking, field capture and completion are any job's. On site the assigned technician adds work only on a service call (on a quoted job that is a change order, `QUOTE-006`): a price-book item other than a material, a quantity, and the customer's approval (their name, and signed on the phone or told in person), queued through the phone's outbox; the technician sees no prices. The invoice draft carries the job's lines, then the added work and the recorded price-book materials at today's price-book prices, so the office prices them by preparing, revising and approving the invoice under `GLOVE-09`; until that approval none of the job's prices counts as approved. A service call's arrival window comes with `DISP-006`, the customer's confirmation with `COMM-003`, and technicians pricing their own added work where the owner allows with `QUOTE-006`. The office makes service calls only: a job from an accepted quote stays the dispatcher's or the owner's (`GLOVE-05`).

*Status:* done — evidence `src/glove/commands/dispatch.ts`, `src/glove/commands/field.ts`, `src/glove/commands/invoices.ts`, `src/ui/service-call.tsx`, `tests/api/servicecall.test.mjs`, `tests/browser/journey.spec.ts`.

#### BOOK-006 — Assessment visits on a request.
A request can carry a scheduled assessment (an on-site estimate): the technician or salesperson, date, time, arrival window and instructions. It sits on the dispatch board and the assessor's phone like any visit, blocks that calendar time (`GLOVE-07` conflict review applies), sends the customer's confirmation and reminders (`COMM-003`), and lets the assessor record notes, photos, measurements and a custom form (`FIELD-002`) before any quote exists. Completing the assessment turns the request into a quote draft carrying those notes, photos and form results, or into a field quote under `QUOTE-006`; the assessment, the request and the quote stay linked on the customer and property history (`CUST-001`).

*Acceptance:* a flow test books an assessment on a water-heater replacement request, checks it blocks an overlapping booking for that technician until reviewed, records two photos and a form on the phone, completes it, and converts the request into a quote draft carrying the photos, notes and form results; the assessment shows on the request, the quote and the customer history.

*Semantics (BOOK-006, 19 October 2026):* the dispatcher or owner books an assessment on an open request (`assessment.book`): the technician, local date, start and end, instructions and up to 10 of the owner's forms (`FIELD-002`); one open assessment per request. It is a job of kind assessment with no lines or price, linked to the request, whose visit is booked under `GLOVE-05`'s conflict review, so it sits on the board and the assessor's phone and blocks that time like any visit, and takes the same field capture (arrival, notes, photos, forms, through the outbox). Completing its visit marks it assessed (never "completed, not invoiced" and never invoiced). A quote drafted from that request carries the assessment's notes, photos and form results and its link; the request names its assessment; the assessment, the request and the quote show on the property history (`CUST-001`). The arrival window comes with `DISP-006`, the customer's confirmation and reminders with `COMM-003`, and turning it into a field quote on the phone with `QUOTE-006`, each carrying it in its text and acceptance.

*Status:* done — evidence `src/glove/commands/assessments.ts`, `src/glove/commands/quotes.ts`, `src/glove/commands/field.ts`, `src/ui/assessment.tsx`, `tests/api/assessments.test.mjs`.

### Quotes and approval

#### QUOTE-001 — Good, better and best options and add-ons.
A quote holds up to five options, each its own set of lines and total, plus optional add-ons the customer can tick; the customer chooses one option and any add-ons, and the job carries exactly the chosen lines. Each option's price is approved under `GLOVE-03`. The owner keeps reusable quote templates beside the price book (`MONEY-003`): named bundles of options, add-ons, lines from the price book, notes and terms. A quote started from a template takes the current price-book prices unless the template fixes a price, and editing a template never changes a quote already made from it.

*Acceptance:* a flow test drafts three options with two add-ons, records the customer's choice of the middle option and one add-on (choosing online through the quote link is `QUOTE-002`'s acceptance), and the job's lines and total equal exactly that choice. The owner saves those options as a template, raises one price-book price, and starts a second quote from the template: it carries the three options and add-ons with the raised price, and editing the template afterwards leaves the second quote unchanged.

*Semantics (QUOTE-001, 19 October 2026):* a revision holds one to five options (each its own lines and total, tax computed per option) and up to ten named add-ons. Approving a revision approves every option's and add-on's price under `GLOVE-03`; a changed price is a new revision. The customer's answer records their choice — exactly one option and any of the add-ons — by the person taking it under `GLOVE-04` (online under `QUOTE-002`); a revision with more than one option or any add-on cannot be accepted without a choice. The accepted lines are the chosen option's followed by the chosen add-ons', with tax computed once on that document, and the job carries exactly those lines and that total; booked-today and won-value figures (`REPORT-001`, `BOOK-003`) count the chosen total. The owner saves named templates of options, add-ons, notes and terms; a price-book line in a template follows the price book unless the template fixes its price, and a custom line always fixes it. A quote started from a template copies it at today's prices and records which template it came from; editing a template never changes a quote already made from it.

*Status:* done — evidence `src/glove/commands/quotes.ts`, `src/glove/commands/dispatch.ts`, `src/ui/options.tsx`, `src/ui/quotes.tsx`, `tests/api/options.test.mjs`, `tests/browser/journey.spec.ts`.

#### QUOTE-002 — Online approval with e-signature.
The customer opens the quote from a link, reads its terms and each line with the customer-facing description its price-book item carries (`MONEY-003`), chooses one option and any add-ons (`QUOTE-001`), requests changes or approves with a drawn or typed signature; Glove records the signer, time, IP address, the exact revision and the ESIGN/UETA consent text they accepted, and freezes the quote under `GLOVE-04`. Every quote carries a validity date (an owner default per business, editable per quote and printed on the quote); after that date the link shows the quote as expired, refuses approval and offers "ask for an updated quote", which notifies the office and reopens the request for a new revision with its own validity date.

*Acceptance:* a browser journey opens a sent quote link, finds each price-book line's customer-facing description (`MONEY-003`), chooses the middle of three options and one add-on (`QUOTE-001`, the job then carrying exactly that choice), requests a change, approves the revised quote with a drawn signature, and checks the signature record and that a stale revision's link cannot be approved. A second quote with a 30-day validity date is opened on day 31: approval is refused, and "ask for an updated quote" puts a notice in the office queue and reopens the request.

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
Quotes, invoices, service reports and agreements render as branded pages and PDFs with the business identity of `MONEY-002` (logo, legal name and DBA, EIN, the license numbers and insurance a state requires, US address, phone and date formats), terms, photos, and each line's image and the customer-facing description its price-book item carries (`MONEY-003`), from templates the owner edits.

*Acceptance:* a browser journey edits the quote template, opens a quote as a customer and as a PDF, and finds logo, license number, terms, an attached photo and each price-book line's customer-facing description (`MONEY-003`) in both; it then opens an invoice and a service report and finds the EIN, two license numbers and logo set under `MONEY-002` printed on each.

FIELD-003 inheritance: before this capability ships, render the immutable service report as the branded PDF with every snapshot field and flagged form reading, asserted in the document journey.

*Status:* missing — gap: documents exist only as desk screens and the invoice CSV.

#### QUOTE-006 — Field quotes and change orders, offline.
A technician the owner allows builds a quote or a change order on the phone from the price book, including options, and prices the work they add on a `BOOK-005` service call, with or without signal; the customer signs on the phone; the change order adds its lines to the job and invoice; offline drafts send exactly once on reconnect under `GLOVE-06`. Prices outside the owner's allowed range wait for desk approval. A technician's close rate in the `REPORT-002` technician report is their field quotes accepted ÷ answered. A completed `BOOK-006` assessment can become a field quote on the phone, carrying its notes, photos and form results.

*Acceptance:* a browser journey with the network off builds a two-option field quote, captures the customer's signature, reconnects, and finds the approved change order on the job and its lines on the invoice draft; an out-of-range price waits for approval; and the `REPORT-002` technician report shows that technician's close rate from their field quotes; a completed assessment becomes a field quote carrying its photos.

*Status:* missing — gap: technicians cannot see prices or create quotes.

#### QUOTE-007 — Discounts on quotes and invoices.
A quote option and an invoice take a document discount (a percentage of the subtotal or a fixed dollar amount, with a reason such as senior, military or first-time customer) shown below the subtotal, and discount lines (negative-price lines, from the price book or custom, each marked taxable or non-taxable). Discount lines count in the subtotal under their own taxable flag. The document discount is allocated to non-taxable lines first, then to taxable lines in line order, and the allocation is shown; tax under `MONEY-001` is then computed on the discounted taxable amount and rounded half up once per document. A discount is part of the priced revision approved under `GLOVE-03`, carries unchanged from the accepted quote to the job and the invoice, and appears in the invoice CSV, the `LEDGER-*` payload (as the provider's discount line with its taxable and non-taxable amounts) and reports. The owner limits who may give a discount and its maximum (`TEAM-001`). `PLAN-002`'s member discount follows the same rule.

*Acceptance:* a flow test quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) with a $50.00 non-taxable first-time-customer discount line and a 10% document discount, and checks subtotal $650.00, discount $65.00 taken from labor, tax $33.00 and total $618.00; a 50% document discount on the same lines spills $75.00 onto the parts and gives tax $26.81 and total $351.81; the accepted figures are identical to the cent on the job, the invoice, the CSV and the explicitly mapped QuickBooks inspection payload (LEDGER-001 and LEDGER-004 carry the provider-fake assertion before they ship, pattern 1).

*Semantics (QUOTE-007, 19 October 2026; ct approved 18:39Z):* a discount line is a line whose unit price is negative (`-50.00`), custom or from a price-book item of kind `discount` (a fixed negative price, no cost); its line total rounds half a cent away from zero. Each line is taxable or non-taxable as `MONEY-001` decides (item flag, labor rule, exemption); discount lines may not take either pool below zero. The document discount is a percent of the subtotal (above 0 to 100, two places, amount rounded half up to the cent) or a fixed dollar amount, never above the subtotal, with a reason up to 100 characters. It comes off the non-taxable lines first (line order, each line at most its own amount), then taxable lines in line order; tax is the jurisdiction rate on the remaining taxable cents, rounded half up once, and the total is subtotal − discount + tax. Each quote option carries its own discount; add-ons take discount lines only; on acceptance the chosen option's discount applies to the accepted lines (a percent re-applies to their subtotal, an amount stays fixed). The job and invoice carry it; an invoice revision or correction keeps it unless the payload sets another. The CSV writes the discount as up to two rows (non-taxable and taxable amounts); the QuickBooks inspection payload writes a `DiscountLineDetail` with tax after discount and both amounts in its description; revenue reports and job costing use subtotal less discount. Limits: the owner is unlimited; `business.save` `discountLimits` gives each built-in or custom role a maximum percent of the document's gross (positive-line) subtotal, counting discount lines and the document discount together; an unlisted role gives none (`DISCOUNT_LIMIT`), checked on person and agent quote drafts and revisions and invoice preparations, revisions and corrections; carrying an accepted quote's discount unchanged is not giving one; GLOVE-03 approval still decides every price.

*Status:* done — evidence `src/glove/money.ts`, `src/glove/sales-tax.ts`, `src/glove/discounts.ts`, `src/glove/commands/quotes.ts`, `src/glove/commands/invoices.ts`, `src/glove/qbo-invoice.ts`, `src/ui/discount.tsx`, `tests/api/discounts.test.mjs`, `tests/browser/discounts.spec.ts`.

### Scheduling and dispatch

#### DISP-001 — Drag-and-drop dispatch board.
Day, week and month views by technician and by crew, an unscheduled-jobs list, drag-and-drop to book, move, reassign or resize a visit (each drop is a `GLOVE-07` change with conflict review), color by job type or status, and a keyboard path for every drag.

*Acceptance:* a browser journey at 1440 px drags an unscheduled job onto a technician, moves it to another day, triggers and confirms a conflict review, and repeats the move with the keyboard.

*Semantics (DISP-001, 19 October 2026):* the board shows a day (one row per technician across the hours), a week (Sunday to Saturday, technicians by day) or a month (weeks of days, all technicians or one), in the business time zone; inactive technicians show only where they have visits in the shown range. The unscheduled list is the "Waiting to book" card: accepted quotes still to become jobs and open jobs with no booked or started visit. Dragging an unscheduled job onto a technician books it (`visit.book`) for one hour at the dropped quarter hour in the day, or at 9:00 on the dropped day in the week and month (in the month for the chosen technician, else the first active one). Dragging a booked or started visit moves it to the dropped quarter hour, day and technician keeping its length, and dragging its right edge in the day changes its end; each drop asks for the reason and is a `GLOVE-07` change (`visit.change`) with its conflict review. The keyboard path on a focused visit: left and right move it a quarter hour in the day and a day in the week and month, up and down change technician (a week in the month), Shift with left or right changes its end by a quarter hour in the day, Enter reviews the change and Escape drops it; booking by keyboard is the "Book a visit" form. Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by job type (the category of the job's first price-book line, else Uncategorized, as in `COST-004`), with a legend. Views by crew are `DISP-007`'s Rows choice on the same board.

*Status:* done — evidence `src/ui/dispatch.tsx`, `src/ui/dispatch-board.tsx`, `src/glove/commands/dispatch.ts`, `tests/browser/journey.spec.ts`.

#### DISP-002 — Map board and travel time.
The dispatch board shows today's visits and technicians on a map (Google Maps), drive time between consecutive visits from a routing provider, and a directions handoff to the technician's navigation app (Apple Maps, Google Maps, Waze). With the map and site coordinates, the owner draws service-area zones for technicians beside their ZIP codes (`DISP-004`), and booking applies the same warn-or-refuse area rule to a site outside every zone the technician serves (moved here from `DISP-004`, ct 19 October 2026).

*Acceptance:* a browser journey opens the map board with a fixture day, sees pins and drive times (provider fake), and the technician's phone offers a directions link with the site's address; a flow test draws a zone for a technician and checks a booking at a site outside it gets the area warning. It also carries `DISP-006`: travel time from the previous visit joins the automatic-assignment ranking.

*Status:* missing — gap: no map or travel time.

#### DISP-003 — Route optimization.
For a day or a technician, Glove proposes the visit order and assignment that respects arrival windows, skills and service areas and minimizes drive time, shows the time saved, and applies it only when the dispatcher accepts; it runs as a bounded background job.

*Acceptance:* a flow test optimizes a fixture day of 12 visits for 3 technicians (routing provider fake), checks no arrival window or skill is broken and the drive time falls, and checks nothing moves until accepted.

*Status:* missing — gap: no routing.

#### DISP-004 — Skills, availability, time off and service areas.
Technicians carry skills and certifications (for example EPA 608, licensed electrician), working hours, time off and service areas (ZIP codes; drawn zones arrive with the map under `DISP-002`); booking warns or refuses (by owner setting) when the technician lacks a required skill, is off or outside the area; availability can be read from Lanyard or Google Calendar.

*Semantics (DISP-004, 19 October 2026):* calendar availability is read from the calendar's secret iCal address (Google Calendar, Outlook and most calendars publish one). The address is a credential: the owner or that technician sets it, it is stored apart from Glove's records (`glove_secrets`), only they can read it back, and it never appears in state, the timeline, a command result, the business export, the installation archive or a log; a restored installation needs it entered again. Reading it keeps only busy spans (start and end, no titles) for the next 90 days with the time they were read; an event marked free or cancelled is not busy; UTC and TZID times are exact; floating times and all-day dates are read in the business time zone; DAILY and WEEKLY repeats are expanded and other repeats are read at their first occurrence only and counted. A booking overlapping a busy span falls under the owner's availability rule (warn or refuse) and names when the calendar was read.

*Semantics (DISP-004 Lanyard availability, 19 October 2026; ct approved 23:45Z and 23:58Z):* only the owner connects Lanyard, one technician at a time, by entering that technician's Lanyard staff ID explicitly (Glove never matches staff by name or email) and a Lanyard bearer key. The key is sealed as an installation secret, apart from Glove's records, and never appears in state, Activity, a command result, the business export, the installation archive or a log; a restored installation needs it entered again. Glove only sends GET requests to Lanyard's fixed availability path for that staff ID, refuses redirects, and sends nothing about customers, sites or jobs. From the answer it keeps only that staff member's normalized availability windows and the start and end instants of their approved leave for the next 90 days, with the time they were read; recurring patterns keep Lanyard's own semantics, and pending or declined leave is ignored. Glove never keeps names, payroll, preferences, leave reasons or any other staff member's data. A booking outside an availability window or over approved leave falls under the owner's existing availability rule (warn or refuse) and names when Lanyard was read. A failed read shows a generic message, keeps the last snapshot and labels it with the time it was read; disconnecting clears the key and the snapshot; an expired key shows Reconnect Lanyard to the owner.

*Egress (DISP-004, ct's EGRESS RULE):* the Lanyard origin is entered by the owner, so Glove accepts only an https origin on a public host (no IP literal, private, loopback, link-local or local name) with no username, password or key in the URL; redirects are refused, and the key travels only in the request's Authorization header. This read is Glove's declared outbound connection to Lanyard under its privacy and outbound rules (Operating rules: provider credentials are installation secrets that never travel in an export). It ships only once Glove adopts Base's egress door, which checks the host on its resolved address with no DNS-rebinding gap (gr-base-285).

*Acceptance:* a flow test books a gas job for a technician without the gas skill (refused), on their day off (refused) and outside their area (warning), then books it for an eligible technician; a flow test reads a technician's calendar (provider fake), refuses a booking over a busy span and books a free one, and checks the address is readable only by the owner and that technician and absent from state, timeline, command results and export. A flow test (Lanyard fake) has the owner connect a technician with an explicit staff ID and key, checks the key is absent from state, Activity, command results, the export and the archive, checks Glove sent only GETs to the fixed availability path with nothing about customers or jobs and refused a redirect, checks only that staff member's availability windows and approved-leave instants for the next 90 days are kept (Lanyard's recurring patterns as Lanyard defines them; pending and declined leave ignored; no names, payroll, preferences, reasons or other staff), warns or refuses a booking by the owner's setting, keeps and labels the last snapshot with its read time after a failed read with a generic message, clears it on disconnect, shows reconnect for an expired key, and refuses an http, non-public-host or credential-bearing origin.

*Status:* partial — evidence `src/glove/eligibility.ts`, `src/glove/calendar.ts`, `src/glove/commands/calendar.ts`, `src/glove/commands/dispatch.ts`, `src/ui/availability.tsx`, `tests/api/eligibility.test.mjs`, `tests/portable.mjs`; gap: availability is not read from Lanyard (Lanyard has no read door for availability yet); Base egress door: `DISP-004` stays partial until Glove adopts Base's egress door for the owner-entered Lanyard origin (gr-base-285).

#### DISP-005 — Live technician location and ETA.
While clocked in and on the job, a technician's phone shares location (with their consent, never off the clock), or Glove reads a fleet GPS provider (Linxup, Samsara, Verizon Connect); the board shows each technician's position and an ETA to the next visit, which feeds `COMM-004`.

*Acceptance:* a flow test posts phone locations and a fleet-provider feed (fake), checks positions and ETAs on the board, and checks no location is recorded after clock-out. It also carries `AGENT-003`: the delay watch adds a late technician's position and ETA to its at-risk reasons and same-time options.

*Status:* missing — gap: no location.

#### DISP-006 — Arrival windows and automatic assignment.
Visits, `BOOK-005` service calls' included, are booked with a customer arrival window (for example 8–10 am) separate from the planned time; when a booking comes from `BOOK-002` or `AGENT-001`, Glove assigns the best eligible technician (skills, area, load, travel) under the owner's rules, and the dispatcher can override. `BOOK-006` assessments are booked with an arrival window too.

*Acceptance:* a flow test books three online requests and checks each lands on an eligible technician inside its window, then the dispatcher reassigns one with a `GLOVE-07` review; an assessment on a request is booked with its arrival window.

*Semantics (DISP-006 arrival windows, 20 October 2026):* `visit.book`, crew bookings, `BOOK-005` service-call visits, `BOOK-006` `assessment.book` and approved dispatch proposals take an optional `window {start, end}`: wall-clock HH:MM on the visit's local date in its booking zone, start before end, kept on the visit as `arrivalWindow` beside the planned start and end. The planned start must fall inside the window, both ends included; otherwise the booking is refused (`WINDOW`). `visit.change` keeps the visit's window unless it names a new one, and `window: null` removes it; a move whose planned start leaves the kept window is refused. The window shows in the booking event ("9:00 AM – 10:30 AM (arrival window 8:00 AM – 10:00 AM)"), on the dispatcher's visit panel and on the technician's phone. Recurring series occurrences (`PLAN-001`) carry no window. `visit.book` (service calls included) and `assessment.book` also take `technicianId: "auto"`: Glove picks, among active technicians in the job's branch with no conflict at that time (skills, areas, time off, calendars, other visits and the owner's warn/refuse rules; an out-of-area warning is a conflict, so every candidate is in-area), the one with the fewest booked minutes on that local date, then by name; the assignment records "Assigned automatically" with the ranking, `NO_TECHNICIAN` answers when nobody is free, and the dispatcher overrides with `visit.change` under `GLOVE-07` review. Travel time joins the ranking with `DISP-002`, and online bookings (`BOOK-002`) and the front office (`AGENT-001`) call this assignment, each naming `DISP-006` in its text and acceptance (ct approved as pattern-1 DONE, 20 October).

*Status:* done — evidence `src/glove/commands/dispatch.ts`, `src/glove/commands/assessments.ts`, `src/ui/dispatch-cards.tsx`, `src/ui/assessment.tsx`, `src/ui/visit-panel.tsx`, `tests/api/assessments.test.mjs`.

#### DISP-007 — Multi-day jobs, crews and subcontractors.
A job can span several days and several technicians at once; a crew is booked as one, and the `DISP-001` board shows its day, week and month by crew, a crew dragged as one; subcontractors sign in with their own limited role, see only their visits, and their 1099 totals are kept (`COST-002`).

*Acceptance:* a flow test books a three-day install for a two-person crew and a subcontractor, checks each sees only their visits, and checks the subcontractor's total in the 1099 export; a browser journey drags the crew's visit to another day on the `DISP-001` week board by crew.

*Semantics (DISP-007, 19 October 2026; the role, crews and 1099 totals as ct approved 19 October 11:36Z):* a job holds any number of visits over any days. The owner (acting for "admin") names crews of 2 to 10 active technicians or subcontractors; changing a crew changes only later bookings. Booking a crew books one visit per member at the same date and times in one command, after one review of every member's conflicts. Moving any visit of that booking moves every member's visit in it that is not completed or canceled to the same date and times, never to another technician, after one review. Canceling cancels them all, and is refused while a member has recorded evidence on theirs. The dispatch board's Rows choice shows crews instead of technicians in the day, week and month, one chip per crew booking, dragged or moved by keyboard as one. Subcontractor is a built-in role, invited and signed in like staff. A subcontractor sees only the visits now assigned to them and, for those, the job title, checklist and forms, the site's address and access notes, the customer's name and phone, and their own captures. They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, other people's work or other visits. They record arrival, checklist items, notes, photos, materials by description, forms and completion on their visits. They cannot clock in, run timers, record refrigerant or expenses, or add priced work, and their phone keeps no offline day and gets no pushes (`FIELD-001` and `FIELD-004` are the Technician's). The owner marks a technician record as a subcontractor with a 1099 payee name and the last 4 digits of the TIN; a full TIN is refused and never stored. The owner sets an agreed amount on each of their visits. The 1099-NEC totals for a calendar year, which the owner and office read as JSON or CSV, sum each subcontractor's agreed amounts on their visits completed that year (dated by the completion Glove received, in the business time zone), with the visit count and whether the total is $600 or more. They are labelled "Totals for your filing, not a filed 1099"; Glove files nothing. Timesheets and payroll exports stay `COST-002`'s.

*Status:* done — evidence `src/glove/commands/dispatch.ts`, `src/glove/subcontract.ts`, `src/glove/view.ts`, `src/ui/dispatch.tsx`, `src/ui/subcontract.tsx`, `tests/api/subcontract.test.mjs`, `tests/browser/journey.spec.ts`.

#### DISP-008 — Google Calendar and Outlook sync.
Each technician's visits appear in their Google or Microsoft 365 calendar (one way, updated on change, customer details limited by owner setting), and busy blocks from that calendar count against availability.

*Acceptance:* a flow test books, moves and cancels a visit and checks the calendar provider fake receives create, update and delete, and that a busy block refuses an overlapping booking.

*Status:* missing — gap: no calendar connection.

### Customer communication

#### COMM-001 — Customer email with delivery status.
Quotes, invoices, receipts, confirmations, reports and purchase orders to suppliers (`STOCK-002`) are emailed from Glove through the owner's provider (SendGrid, Postmark, Amazon SES or the Base mail adapter) from the business's verified domain; each message records queued, delivered, bounced or complained from provider events, and a failure shows on the record with what to do next. CAN-SPAM rules apply to anything not strictly transactional. This clause also inherits morning email delivery of the owner's `AGENT-008` brief; until it ships, the brief is shown only when the owner opens Glove, with nothing pushed or emailed.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

*Acceptance:* a flow test sends a quote, an invoice and a purchase order to its supplier (provider fake), replays delivered and bounced events, and checks each message's state on the timeline and the bounce warning on the customer. It also delivers the owner's `AGENT-008` brief in the morning and asserts the provider delivery outcome without a duplicate delivery for that business-local date.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

*Status:* missing — gap: the mail module serves sign-in links only; Glove records sends but sends no customer email.

#### COMM-002 — Texts from a registered US number.
The owner connects Twilio (or another provider) with a US number registered for A2P 10DLC or toll-free verification; Glove records each customer's SMS consent (source, time, wording), honors STOP, HELP and START in every thread, keeps quiet hours by the customer's time zone, and records sent, delivered and failed per message. The owner keeps their existing business number: it is ported to Twilio, or text-enabled in place as a hosted number while voice stays with the current carrier, with the port or hosting status shown until it is live; a new number is the owner's choice, never the only path. A customer's recorded opt-out also keeps them out of every `CUST-004` segment push.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

*Acceptance:* a flow test texts a consenting customer (provider fake), replays delivered and failed callbacks, receives STOP and checks the next send is refused with the reason, and checks no automated text is sent in quiet hours; a hosted-number order and a port request (provider fake) show their status until the number is live, and sends then use it; a customer who replied STOP is left out of a `CUST-004` segment push. It also carries `AGENT-003`: a texted customer's reply confirming or refusing a visit moved around a delay lands on that visit, replacing "customer not yet asked", and an `AGENT-009`-granted agent move texts the customer.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

*Status:* missing — gap: no SMS.

#### COMM-003 — Appointment confirmations and reminders.
Booking, moving or canceling a visit (a `BOOK-005` service call's included) sends the customer a confirmation by text and email (by preference); reminders go at owner-set times before the window (for example 24 hours and 2 hours); the customer can confirm or ask to reschedule from the message. The wording of every automated message (confirmations, reminders, on-my-way, quote follow-ups under `QUOTE-004`, payment reminders under `PAY-005`, review requests) is an owner-edited template with merge fields and a preview; the opt-out wording and business name cannot be removed. An assessment visit (`BOOK-006`) sends the same confirmation and reminders.

*Acceptance:* a flow test books, moves and cancels a visit and checks the exact messages and their timing, and a reply "reschedule" opens a request on the job; an owner-edited reminder template with merge fields is exactly what the customer receives, and its opt-out wording cannot be removed; booking an assessment on a request sends its confirmation.

FIELD-003 inheritance: before this capability ships, the customer receives its service-report link through the configured notice channel with the provider outcome asserted.

*Status:* missing — gap: Glove sends nothing.

#### COMM-004 — On-my-way and job status texts.
The technician taps "on my way" (or Glove detects departure under `DISP-005`) and the customer gets a text with the technician's name, photo and ETA; arrival, completion and report-ready notices follow by owner setting.

*Acceptance:* a browser journey taps on-my-way on the phone and checks the customer text (provider fake) carries name and ETA; completion sends the report link.

FIELD-003 inheritance: before this capability ships, the report-ready notice carries its exact service-report link, with the provider delivery outcome asserted.

*Status:* missing — gap: no customer notices.

#### COMM-005 — Two-way texting inbox.
Replies land in a shared inbox, threaded by customer and linked to the open job, with assignment, unread state and canned replies; technicians text customers from the job through the business number, never their personal number.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

*Acceptance:* a browser journey receives a customer reply (provider fake), assigns it, answers with a canned reply, and finds the thread on the customer and the job. It also carries `AGENT-003`: a customer's confirmation reply to a moved visit is threaded on the customer, the job and that visit.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

*Status:* missing — gap: no messaging.

#### COMM-006 — Customer hub.
A customer opens their hub from a sign-in link sent to their email or phone and sees their quotes (approve and sign; each price-book line shows the customer-facing description its item carries, `MONEY-003`), upcoming visits (confirm, reschedule within policy), invoices and receipts (pay), service reports, equipment, agreements (renew, update card) and can request new work; they see only their own records.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

*Acceptance:* a browser journey signs a customer in by a link, finds a quote's price-book line with its item's customer-facing description (`MONEY-003`), approves the quote, pays an invoice (Stripe fake), requests work, and checks another customer's link reads none of it.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

FIELD-003 inheritance: before this capability ships, the customer finds and reads their service reports in the hub, with report/file isolation asserted.

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

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

*Acceptance:* a flow test replays Twilio voice webhooks (fake) for an answered call and a missed call, checks the call log, the recording notice and the missed-call text.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

*Status:* missing — gap: no telephony.

### Field work on the phone

#### FIELD-001 — Offline day of jobs that survives a reload.
The technician's phone keeps the day's assigned visits (customer, site, access notes, equipment, history, checklists, forms, photos already taken) cached, so the app opens, reloads and works with no signal; everything captured offline sends exactly once on reconnect under `GLOVE-06`, and a conflict with a desk change is shown, never silently overwritten.

*Acceptance:* a browser journey loads the day, goes offline, reloads the app, completes a visit with photos and a form, reconnects, and checks everything landed once; a visit moved at the desk meanwhile shows the late-evidence review.

*Semantics (FIELD-001, 19 October 2026, data at rest as ct approved):* only a signed-in Technician's phone keeps the day: that technician's own view (the visits ever assigned to them with those jobs' customers, sites, access notes, equipment, history, checklists, forms and captures; never prices), replaced on every successful refresh, kept in this browser's storage, and cleared on sign-out and whenever a different person or a desk role signs in on it. A service worker keeps the app shell this phone loaded and that technician's photos, answering from them only when the network fails; it never keeps records or other `/api/` or `/auth/` answers, and desk roles never keep records. With no signal the app opens, reloads and works from the kept day, saying how old it is; everything recorded (arrival, checklist, forms, notes, photos, materials, completion) waits in the phone's outbox, in order, tied to the person who recorded it (another sign-in never sends or shows it), and sends exactly once on reconnect under `GLOVE-06`; a visit can be completed once its arrival is waiting to send. Evidence for a visit the desk moved to someone else meanwhile is kept, flagged and reviewed under `GLOVE-07`, never silently overwritten.

*Status:* done — evidence `src/ui/offline-day.ts`, `public/glove-sw.js`, `src/ui/api.ts`, `src/ui/outbox.ts`, `src/ui/technician.tsx`, `tests/browser/journey.spec.ts`.

#### FIELD-002 — Custom forms and inspections.
The owner builds forms (yes/no, choice, number with units, reading with range, photo, signature, notes, conditional questions) and attaches them to services, equipment types or agreements; technicians fill them offline; results appear on the job, the report and the equipment history.

*Acceptance:* a flow test builds an HVAC inspection form with a conditional question and a reading range, fills it on a visit with one out-of-range reading, and finds the flagged reading on the job and the equipment.

*Semantics (FIELD-002, 19 October 2026):* the owner builds a form of up to 60 questions (yes/no, choice, number with an optional unit, reading with a unit and an inclusive range, photo, signature, notes); a question can be asked only when an earlier yes/no or choice question has a given answer. A form attaches to price-book services and to equipment types (matched without regard to case). A new job takes a copy of each form that applies: one per unit the job names whose type the form lists, otherwise one for the job when a quoted service lists it; editing or archiving the form never changes a job's copy, and the per-service checklists stay as they are. The technician fills each copy once on the phone, through the outbox, so it works without signal (`GLOVE-06`): every question asked and required must be answered, a question not asked must be left empty, and a reading below its lowest or above its highest value is flagged. The filled form is a field record on the job and its timeline (naming how many readings are out of range), on the unit's service history when the copy is for a unit, and in the property history. Agreements carry forms when `PLAN-002` ships, and the customer's report prints form results under `FIELD-003`.

*Status:* done — evidence `src/glove/forms.ts`, `src/glove/commands/forms.ts`, `src/glove/commands/field.ts`, `src/ui/forms.tsx`, `tests/api/forms.test.mjs`, `tests/browser/journey.spec.ts`.

#### FIELD-003 — Shareable service report.
Completing a visit produces an immutable service report: work summary, findings, `FIELD-002` form results with out-of-range readings marked, photos, materials, customer signature (or the recorded reason it is absent), and recommendations. The owner, dispatcher or office creates a seven-day link with **Copy report link** and shares it with the customer by hand today; Glove makes no delivery claim. Recommendations become a quote draft in one step under ordinary human price approval. COMM-003/004 inherit customer notices, COMM-006 the hub, and QUOTE-005 branded PDF documents, in their text and acceptance before shipping.

*Semantics (20 October 2026, ct approved 23:58Z, pattern 1/3):* the exact customer-facing snapshot is frozen in the same guarded transaction as completion, with only the completing technician's first name. A link contains 32 random bytes, shown once, with only its SHA-256 retained separately from domain records; the bearer stays in the page fragment and request header, never a URL query, record, saved command result, export or log. The same desk roles revoke links. Each read rechecks expiry and revocation and permits only that report and the original files it named when frozen; other records and later evidence remain private. Link secrets are excluded from the installation archive, so a restored installation issues new links. Branch limits apply to creating/revoking a link and drafting a recommendation. A technician records findings and recommendations through the normal offline completion outbox; the owner or dispatcher prices a recommendation into an ordinary quote draft, linked to the source report and still requiring human price approval. Reports appear in Activity, property history and business export without link secrets. Existing completed or imported visits without a snapshot do not claim a report was issued.

*Acceptance:* `tests/api/service-reports.test.mjs` › `FIELD-003 / FIELD-002 / DATA-002 …` completes a visit, opens its customer report and every original with only the bearer, asserts all fields and marked readings, first-name-only technician, immutable contents, other-record/file refusal, one-step recommendation draft with normal price approval, expiry/revocation and live role/branch refusal, Activity/property history/export without secrets. `tests/browser/service-reports.spec.ts` completes from the technician screen, previews, copies, reads, drafts a recommendation and revokes at 1440/390. `tests/portable.mjs` restores exact snapshot/link metadata while refusing the old bearer and accepting a newly issued link. COMM-003/004 assert the actual report notice and delivery outcome, COMM-006 hub discovery, and QUOTE-005 branded PDF rendering before they ship.

*Status:* done — evidence `src/glove/service-reports.ts`, `src/glove/commands/service-reports.ts`, `src/glove/commands/field.ts`, `src/ui/service-report.tsx`, `src/ui/service-report-links.tsx`, `tests/api/service-reports.test.mjs`, `tests/browser/service-reports.spec.ts`.

#### FIELD-004 — Installable technician app with push.
The technician app installs to the home screen on iPhone and Android, uses the camera directly, sends push notifications for new, moved and canceled visits, and offers tap-to-call and tap-to-navigate.

*Acceptance:* a browser journey installs the app manifest, subscribes to push, and receives a notification (push service fake) when the dispatcher moves the visit; from the visit, tap-to-call opens a `tel:` link to the customer's number and tap-to-navigate a maps link to the site's address.

*Semantics (FIELD-004, 19 October 2026; privacy and security as ct approved 19 October 10:50Z):* `/app` installs to the home screen from its web app manifest (Glove, starting at `/app`, standalone, 192 and 512 px icons) and the home-screen tags iPhone reads; an iPhone shows web pushes only once Glove is added to its Home Screen (iOS 16.4 and later), which the phone screen says. Field photos open the rear camera directly. The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair whose private key is an owner-only installation secret (never in records, state, exports, logs or the archive); turning them on again replaces the key, and turning them off deletes the key and every subscription. A Technician turns notifications on for each phone. A subscription (the push service address and the phone's keys) belongs to that person, that device and that signed-in session; only that person reads it back, as their list of phones (a label, the last outcome and when, never the address or keys); and it is deleted when they remove it, sign out on that phone, the session is ended elsewhere or expires, they stop being an active Technician (a role change or deactivation), the push service no longer knows it (HTTP 404 or 410), or the owner turns notifications off. It is never in records, exports or the archive, so a restored installation needs fresh subscriptions. After every committed change, whoever or whatever made it (a person, a rule, a recurring series, an agent under the owner's grant, a move-in), each technician with a visit that has not ended and was booked to them, moved (its start or end changed), canceled, or handed to another technician gets one push on each subscribed phone: "New visit on your schedule" (also for the technician who receives a handed-over visit), "Visit moved", "Visit canceled" or "Visit moved off your schedule", or "N changes to your schedule" when one change touches several of their visits. A push carries only that line and, when one visit changed, the job's opaque id; never the customer, site, time or a note. Each push is encrypted for the phone (RFC 8291, aes128gcm) and signed with the VAPID key (RFC 8292: a 12-hour token naming the business email, else the installation address), kept by the push service for at most a day, and sent once, never retried. The phone list says "Handed to the push service" (not "delivered", which Glove cannot see), "Not sent: the push service answered HTTP <status>" or "Not sent: the push service could not be reached". Only a Technician subscribes, and no role, agent included, has a door that sends a push. Tapping a notification opens the signed-in app on that job's visit. On a visit, Call customer opens a `tel:` link to the customer's phone (its digits and a leading +) and Navigate to site opens Google Maps directions to the site's address (the Maps app where installed). A local installation served from this computer also accepts a push service on this computer (`http://127.0.0.1` or `localhost`), so its own browser journey can run one; a hosted installation accepts only https push services. `FIELD-005`'s native apps carry push in their own text.

*Status:* done — evidence `src/glove/push.ts`, `src/glove/commands/push.ts`, `src/ui/push.tsx`, `public/manifest.webmanifest`, `public/glove-sw.js`, `tests/api/push.test.mjs`, `tests/browser/journey.spec.ts`.

#### FIELD-005 — Native iOS and Android apps.
Glove ships technician apps in the App Store and Google Play, signed in to the owner's installation, with the offline cache of `FIELD-001`, background photo upload, push, location under `DISP-005` and Tap to Pay under `PAY-003`.

*Acceptance:* a device-farm journey on a current iPhone and Android phone completes a visit offline, reconnects and takes a Tap to Pay test payment (Stripe test mode).

*Status:* missing — gap: no native apps.

#### FIELD-006 — Equipment nameplate capture.
The technician photographs an equipment nameplate; Glove reads make, model, serial and manufacture date into the equipment record for the technician to confirm, and attaches the manufacturer's manual where one is available.

*Acceptance:* a flow test submits three fixture nameplate photos (model provider fake), checks the proposed fields, and checks nothing is saved until the technician confirms.

*Semantics (FIELD-006, 19 October 2026):* the model provider is the owner's own: an OpenAI-compatible chat-completions address (https), one model id and the owner's key, connected by the owner only and kept like the marketing keys (never in records, exports, logs or the archive); without it nothing is read. The technician reads a nameplate on a visit they are working, for a unit already at the site or one not recorded yet; only the photo goes to the provider (no customer, site or job details), asking for JSON with storage off. The reading is a proposal on the visit, labelled as read by the model: no equipment record changes until the technician who took it confirms the fields, correcting any first (the reading keeps the proposal and the corrected fields), or discards it. A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anything else is left unread, as is any field the model returns empty. "Where one is available" means the manual library the desk keeps (make, model, title, https address): on confirmation the manual whose make and model match, ignoring case and surrounding spaces, is attached; Glove never invents, searches for or fetches a manual. Reading needs a signal; the confirmed unit and its manual are then in the phone's offline day (`FIELD-001`). The provider flow and exactly these fields (and `AGENT-006`'s) are listed in the declared data flows, the docs page `docs/data-flows.md`.

*Status:* done — evidence `src/glove/commands/nameplates.ts`, `src/glove/provider.ts`, `src/ui/nameplates.tsx`, `tests/api/nameplates.test.mjs`.

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

*Semantics (COST-002, 20 October 2026):* a workweek is seven local days in the business time zone from the owner's week-start day (Monday unless the owner sets another; fixed once any timesheet is approved). Each closed shift counts its whole minutes (`COST-001` rounding) on the local day it started, including a shift that runs past midnight; job and travel timer minutes are shown beside it, and paid hours are the shift (clock) time. When the owner sets a state rule, minutes past the "after" hours in a day are overtime and minutes past the optional "double after" hours are double time (quarter-hour settings, double after overtime); then, day by day in order, regular minutes beyond 40 hours in the workweek become overtime. Seventh-day and other state rules are not applied. Hours are each bucket's minutes / 60, rounded half up to two decimals, so rounded buckets can differ from the rounded total by 0.01. A timesheet is flagged when it holds any overtime or double time. Whoever reads time entries reads the week's timesheets (a technician only their own; a subcontractor none). Only the owner (acting for "admin") approves a week, and only once no shift in it is still open; an approval stands while the week's entries and their split are unchanged. A later correction, late entry or overtime-rule change marks it "changed since approval" until the owner approves it again. The payroll files are for a pay period of 1 to 6 whole workweeks, read by the owner and office like the other exports. They hold only people whose every week with time in the period is approved and unchanged, and they list everyone left out with the reason. A technician record marked as a 1099 subcontractor (`DISP-007`) is never in the payroll files or approvable; their agreed-amount totals are only in the 1099-NEC export. The files follow what each provider publishes, checked against the provider's own help on 21 October 2026. RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418A) defines the layout, and the file follows it exactly: a `##GENERIC## V1.0` version row, the column titles IID, Pay Frequency, Pay Period Start Date, Pay Period End Date, Employee ID, Earnings Code, Pay Hours, Dollars, Separate Check, Worked In Dept and Rate Code, then one row per person and earnings code with the owner's company code (up to 10 letters and digits), pay frequency, the period's start and end as MM/DD/YYYY, the hours to two decimals, Separate Check `0` (the regular check) and Rate Code `BASE` (the first pay rate on the employee), with the owner's earnings codes, by default REG, OTP and DBL. Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is downloaded inside Gusto, and its Smart Import matches columns on upload); Glove's column names (last name, first name, Gusto employee ID, regular, overtime and double-overtime hours; the first word of the technician's name is the first name) are therefore not confirmed against a Gusto-published layout. The one column Gusto's help names, `workweeks`, is followed: one row per person and approved workweek, holding that week's date range as `YYYY-MM-DD - YYYY-MM-DD` beside that week's hours, so Gusto places overtime in the right workweek. Glove keeps no SSN and writes no SSN column. QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom upload takes one entry per line with the employee and a date plus units, the date format and each column's meaning chosen on upload; Glove's date-and-units file (employee display name, MM/DD/YYYY date, pay item Regular, Overtime or Double time, hours) is a file the owner maps on upload, not a confirmed Intuit layout. The employee ID is the payroll ID the owner keeps on each technician record. None of these files has yet been uploaded to a live Gusto, ADP RUN or QuickBooks account; Glove pays no one and files nothing. Inheritance: `TEAM-003` commissions and spiffs and `PAY-002` technician tips add their amounts to the same payroll files (Gusto's commission and paycheck-tips columns, an ADP RUN earnings code with dollars) for the same approved weeks before either ships.

*Status:* done — evidence `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `src/glove/api.ts`, `tests/api/payroll.test.mjs`, `tests/api/security.test.mjs`.

#### COST-003 — Job expenses and receipts.
Technicians and the office record expenses on a job (supply-house purchases, permits, equipment rental, subcontractor bills) with a receipt photo, vendor, amount and whether it is billable; billable expenses can be added to the invoice at cost or with markup.

*Acceptance:* a flow test records a supply-house receipt as billable with 20% markup and a permit fee as non-billable, and checks the invoice draft and job cost.

*Status:* done — evidence `src/glove/commands/expenses.ts`, `src/glove/commands/invoices.ts`, `src/ui/expenses.tsx`, `tests/api/expenses.test.mjs`.

#### COST-004 — Estimate versus actual job costing.
Every job shows its quoted price and estimated cost against actual labor (time × each person's loaded cost rate), materials at cost, expenses and subcontractors, giving actual margin and the difference from estimate; reports roll this up by job type, technician and period.

*Acceptance:* a flow test runs a job quoted at $1,850 with estimated 41% margin through recorded time, materials and an expense, and checks actual cost and a 46% margin to the cent.

*Semantics (COST-004, 19 October 2026):* revenue is the latest person-approved invoice revision's subtotal before tax, else the accepted quote's subtotal. The estimated cost is each accepted line's unit cost (kept when the line was priced from the price book, `MONEY-003`) × its quantity; a line without one counts at $0.00 and is named. Actual labor is every travel and on-job entry (`COST-001`) at its whole minutes × that technician's loaded cost per hour ÷ 60; materials are the price-book materials recorded on the job at the item's unit cost now, beyond what the job's own purchase orders received (`STOCK-002`), whose received lines count at the order's unit cost; expenses and subcontractors are `COST-003`'s amounts, subcontractor bills apart. Each product is rounded half up to the cent; a margin is (revenue − cost) ÷ revenue as a percentage to one decimal, rounded half up, and the difference from estimate is in dollars and margin points. The owner sets each technician's loaded cost per hour; like every cost it is a margin figure, read only by roles that read reports (`MONEY-003`). Reports take the jobs completed in a period (by local completion date, bounds inclusive) and roll them up by job type (the category of the job's first price-book line, else Uncategorized) and by technician (their minutes, labor cost and the jobs they recorded time on).

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
The owner connects their own Stripe account; customers pay invoices, deposits and agreements by card, Apple Pay, Google Pay or ACH bank debit; Glove records each payment only when Stripe confirms it (ACH as pending until settled), shows fees, and never touches raw card numbers. Card surcharging is off by default and, if the owner turns it on, carries the disclosure they configure. A customer can add a tip when paying online or on the `PAY-003` screen (owner-set choices); each tip is recorded against the payment and the visit's technicians, kept out of revenue and sales tax, and carried to the payroll export (`COST-002`, `TEAM-003`). The `REPORT-001` dashboard's "Paid today" tile sums the payments Stripe confirmed on the business's local today, tips apart; an ACH payment counts on the day it settles. The `REPORT-002` sales-tax report then counts tax collected from payments (until then its basis is tax on approved invoices, labelled so).

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

*Acceptance:* a flow test pays one invoice by card and one by ACH (Stripe fake with webhooks), checks the card payment is paid at once, the ACH payment pending until the settlement event, and a failed ACH return reopens the balance; a card payment with a $15.00 tip records the tip for the visit's technician, untaxed, and the tip appears in the payroll export; the `REPORT-001` "Paid today" tile counts the card payment at once and the ACH payment only after its settlement event; the `REPORT-002` sales-tax report counts the tax on the two paid invoices as collected.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

REPORT-003 inheritance: confirmed payments update the aging report's open balances before this capability ships; assert the exact bucket/customer totals and invoice links in its flow.

*Status:* missing — gap: no payments.

#### PAY-003 — Tap to Pay and card readers on site.
Technicians take card-present payments on the phone (Tap to Pay on iPhone and Android through Stripe Terminal) or a paired Stripe reader, with the tip choices of `PAY-002`, the receipt texted or emailed and the payment on the job before they leave.

*Acceptance:* the `FIELD-005` device journey takes a Tap to Pay test payment on a $412.00 invoice with an 18% tip chosen on the phone's tip screen and the receipt sent by text, then a second test payment with no tip and the receipt by email. It finds both payments on the job, the $74.16 tip recorded for the visit's technician outside revenue and sales tax, and each receipt on the timeline with the channel the customer chose and the provider's delivery outcome.

*Status:* missing — gap: no payments or native app.

#### PAY-004 — Partial payments, balances, refunds and credits.
An invoice accepts several payments (deposit, progress, final, check and cash recorded by the office, cards the office keys in or charges on file under `PAY-009`); balances, overpayments and credits carry on the customer; the owner refunds all or part through the original method, and every refund is its own record linked to the payment. The `REPORT-001` dashboard's receivables tile is the sum of every invoice's unpaid balance.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

*Acceptance:* a flow test pays an invoice in three parts (one by check), refunds $50 to the card (Stripe fake), and checks the invoice, customer balance and refund record, and that the `REPORT-001` receivables tile equals the open balances after each step.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

AGENT-008 inheritance: before this capability ships, the morning brief lists overdue invoices (due date passed, balance unpaid) with their invoice link and a proposed action, asserted in the AGENT-008 flow.

REPORT-003 inheritance: allocations, credits, overpayments and refunds update the aging report's open balances before this capability ships; assert the exact bucket/customer totals and invoice links in its flow.

*Status:* missing — gap: no balances or payments.

#### PAY-005 — Payment reminders that stop at zero.
The owner sets a reminder schedule (before due, on due, after due); Glove sends it by text and email with the pay link, stops the moment the balance is zero or the invoice is disputed, and shows each invoice's reminder state.

*Acceptance:* a flow test advances a clock through the schedule for two invoices, pays one after the first reminder, and checks it received nothing more.

REPORT-003 inheritance: each invoice in the aging report displays its actual reminder state before this capability ships, asserted in the reminder flow.

*Status:* missing — gap: Glove sends nothing.

#### PAY-006 — Consumer financing through Wisetack.
On quotes above an owner-set amount, the customer can apply for financing through Wisetack from the quote or hub; Glove shows the provider's decision and offer, and records the payout when the provider funds; Glove never underwrites or lends.

*Acceptance:* a flow test applies for financing on a $9,800 quote (provider fake), approves, funds, and checks the invoice is paid by the financing payout.

*Status:* missing — gap: no financing.

#### PAY-007 — Payouts and reconciliation.
Each Stripe payout is matched to the payments, refunds and fees inside it; checks and cash are grouped into deposit batches; anything unmatched is listed with the reason, so the bank deposit, Glove and the books agree. Where Stripe offers Instant Payouts on the owner's account, the owner requests one to an eligible debit card with Stripe's fee shown before confirming, and it reconciles the same way.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

*Acceptance:* a flow test replays a payout of six payments, one refund and fees (Stripe fake) and checks the payout reconciles to the cent, with a deliberately missing payment listed as unmatched; an instant payout (Stripe fake) with its fee reconciles the same way.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

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

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

*Acceptance:* a flow test (Stripe fake with webhooks) signs in as Office and charges a keyed card against a $412.00 invoice and a saved card against a $500.00 deposit. Each payment is recorded only on Stripe's confirmation event, with the Office person on the timeline. A declined keyed card leaves the $412.00 balance open with the decline reason. A saved card whose authorization covers only autopay is refused, with the pay link offered. A Technician, a Dispatcher and an Agent are refused the charge through the command and through HTTP. No request body, record, log line or business export contains a card number. A browser journey at 390 px signed in as Owner charges a saved card on an invoice from the phone with no horizontal scroll.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

*Status:* missing — gap: no payments; the Office role records invoices only up to approval and export (`src/glove/commands/invoices.ts`).

### Accounting sync

#### LEDGER-001 — QuickBooks Online sync.
The owner connects QuickBooks Online; the first connection to a company that already holds records links them under `LEDGER-004` before anything posts. Glove keeps customers, items, invoices, payments, refunds, Stripe fees and deposits in sync, maps income accounts, tax codes and classes or locations once, and reads back payments recorded in QuickBooks; every sync error is shown on the record with the QuickBooks message and can be retried after a fix; nothing is posted twice. A customer with many properties (a property manager or landlord) can be mapped as a QuickBooks parent customer with a sub-customer per property: each property's invoices post to its sub-customer, the parent's statement rolls them up, and payments the parent makes against several properties are applied to each sub-customer's invoices.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

MONEY-001 inheritance: before this capability ships, post the frozen USD jurisdiction/tax snapshot with explicit existing-record mappings and assert the provider receives it to the cent; the current downloadable payload is inspection only, never a sync.

QUOTE-007 inheritance: before this capability ships, post each QUOTE-007 discount as the provider's discount line (tax after discount) with its non-taxable and taxable amounts and assert the provider fake receives the accepted figures to the cent.

*Acceptance:* a flow test syncs a customer, invoice, payment and refund (QuickBooks fake), replays the same sync without duplicates, receives a rejected item with its message, fixes and retries it, and reads a payment entered in QuickBooks back onto the invoice. A property manager with two properties mapped as sub-customers posts each property's invoice to its own sub-customer under the parent, and one payment covering both is applied to both invoices.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

*Status:* missing — gap: no QuickBooks connection.

#### LEDGER-002 — Xero sync.
The same as `LEDGER-001` for Xero; the existing sales-invoice CSV remains for owners who import by file.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

*Acceptance:* the `LEDGER-001` flow against a Xero fake.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

*Status:* partial — evidence `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs`; gap: a CSV in Xero's sales-invoice import columns; no live connection or payment sync.

#### LEDGER-003 — Pantry sync.
For an owner who keeps their books in Pantry, Run Edit Run's accounting product, Glove posts the same records through Pantry's API with the same error and retry behavior.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

*Acceptance:* the `LEDGER-001` flow against Pantry's documented API (fake).

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

*Status:* missing — gap: no Pantry connection.

#### LEDGER-004 — First QuickBooks connection linked to existing records.
An owner moving in usually connects a QuickBooks Online company that already holds their customers, products and services and years of invoices, synced there by Jobber or Housecall Pro. On that first connection Glove posts nothing until the owner has reviewed and confirmed a link plan.
- **Proposed links.** Glove reads the company's customers (with sub-customers), items and open and recent invoices, and proposes a link for each Glove customer, price-book item and moved-in invoice. Customers match first by the QuickBooks customer ID the move-in carried where the source kept one (`MOVE-005`), then by display name together with email or phone. Items match by SKU, then by name. Moved-in invoices match by the carried QuickBooks ID, then by invoice number with the same customer and total.
- **Owner review.** The review lists four groups: matched (with the rule that matched), ambiguous (two or more candidates; the owner picks one or none), Glove records with no match (the owner approves creating each in QuickBooks or links it by hand), and QuickBooks records with no Glove counterpart (left alone, or brought into Glove through the `CUST-003` review). A QuickBooks name clash ("another customer already uses this name") appears in the review before anything posts, never as a sync error afterwards.
- **Only confirmed writes.** Confirming writes only the confirmed links and the new records the owner approved. A linked moved-in invoice is never posted again; later payments and refunds on it post against the QuickBooks invoice it links to. Each link records who confirmed it and can be changed until the first post that uses it. Reconnecting the same company keeps the links; connecting a different company starts a new review.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

MONEY-001 inheritance: before this capability ships, post the frozen USD jurisdiction/tax snapshot with explicit existing-record mappings and assert the provider receives it to the cent; the current downloadable payload is inspection only, never a sync.

QUOTE-007 inheritance: before this capability ships, post each QUOTE-007 discount as the provider's discount line (tax after discount) with its non-taxable and taxable amounts and assert the provider fake receives the accepted figures to the cent.

*Acceptance:* a flow test moves in a Jobber fixture (`MOVE-001`) with 50 customers, 20 price-book items and their open invoices, then connects a QuickBooks fake that already holds 48 of those customers (10 matched by the carried QuickBooks ID, 37 by name with email or phone, and one name with two QuickBooks candidates), all 20 items and the open invoices. The review lists exactly 47 matched customers, one ambiguous pair, two Glove customers with no match and 20 matched items, and the fake receives no write before confirmation. After the owner picks the ambiguous match and approves creating the two unmatched customers, the fake holds no duplicate customer or item, the two new customers exist once each, the moved-in invoices are linked and not re-created, a payment on one of them posts against its existing QuickBooks invoice, and the next new Glove invoice posts against the linked customer.

The flow also asserts each new DATA-002 event in Activity and the business export, including provider outcomes and references without secrets.

*Status:* missing — gap: no QuickBooks connection; the ServiceM8 kit keeps source IDs but no accounting references (`src/glove/movein/servicem8.ts`).

### Recurring service and maintenance agreements

#### PLAN-001 — Recurring jobs.
A job can repeat on a rule (every 3 months, the first Monday, twice a year in April and October), generating visits over a rolling horizon; one visit can be skipped or moved without changing the series; changing the series from a date forward keeps the past; each series carries the invoicing rule of `PLAN-005`.

*Acceptance:* a flow test creates a quarterly series, skips one visit, moves another, changes the rule from a date, and checks every generated visit.

*Semantics (PLAN-001, 19 October 2026):* the dispatcher or owner makes an open job repeat (`series.create`) from a first local date, at a visit start and end time with one technician, on a rule: every 1–52 weeks (on the first date's weekday), or every 1–52 months, or every year in named months, on a day of the month (the first date's unless given; a day the month lacks becomes its last day) or on the first to fourth or last given weekday of the month; intervals count from the rule's first date. Dates are local dates in the business time zone. The series may end on a date (inclusive). Visits are booked for every occurrence through the earlier of that end and today plus the series' rolling horizon (7–730 days, 365 by default): at create and change, conflicts are reviewed under `GLOVE-05` as for one booking; after every later command the horizon rolls forward and the newly booked visits carry their conflicts unreviewed, named on the job timeline for review on Dispatch, and an occurrence that cannot be booked (for example an inactive technician) is recorded once on the series and named on the timeline. Each visit is an ordinary visit carrying its rule revision and occurrence date: moving it (`visit.change`) or skipping it (`visit.cancel`, labelled skipped) leaves the series unchanged, and an occurrence that has a visit is never booked again. Changing the series from a date (`series.change`, with a reason, not before its first date) starts a new rule revision there: visits on or after that date that are still booked and untouched (no arrival, never moved) are canceled with that reason and booked again under the new revision; earlier visits and moved, skipped, started or completed ones stay as they are. Completing one visit leaves a recurring job open; a visit completes the job only once the series has an end date, has booked through it and no other visit of the job is booked. The series' invoicing rule comes with `PLAN-005`, which carries it in its text and acceptance; until then a recurring job is invoiced as one job under `GLOVE-09`.

*Status:* done — evidence `src/glove/recurrence.ts`, `src/glove/commands/series.ts`, `src/glove/commands/field.ts`, `src/ui/series.tsx`, `tests/api/series.test.mjs`.

#### PLAN-002 — Maintenance agreements and memberships.
The owner defines plans (for example a yearly HVAC "Comfort Club": price, term, included visits, member discount on repairs, priority booking); a plan is sold on a quote, in the hub or by phone; each agreement tracks entitlements used and left ("1 visit left, next April 3") and applies the member discount automatically. A plan can carry `FIELD-002` forms; each visit booked under the agreement takes a copy, as a job does for a service's forms. The `REPORT-001` dashboard's agreements-due tile counts the agreements with an included visit due and not yet completed or declined (`PLAN-004`). The `REPORT-002` reports gain the agreement count and churn (agreements ended or not renewed in the period) with this clause. A `CUST-004` segment's "no agreement" filter then excludes customers with an active agreement.

*Acceptance:* a flow test sells a plan with two included tune-ups and 15% repair discount, books and completes one tune-up, quotes a repair, and checks the entitlement count and the discount, that the completed tune-up's job carried the plan's inspection form, and that the `REPORT-001` agreements-due tile counts the agreement while its second tune-up is due, and that the `REPORT-002` agreement report counts the sold agreement and no churn, and that a `CUST-004` "no agreement" segment excludes the customer.

QUOTE-007 inheritance: before this capability ships, the member repair discount is a QUOTE-007 document discount or discount line, allocated non-taxable first and taxed after discount, carried quote → job → invoice, and asserted on the CSV, the QuickBooks payload and reports.

*Status:* missing — gap: no agreements.

#### PLAN-003 — Recurring billing and renewals.
Agreements bill monthly or yearly through saved payment methods (`PAY-008`); renewal notices go out ahead of the term end with the terms state auto-renewal laws require the owner to show; customers can cancel or update their card in the hub; a failed charge follows the dunning schedule and the agreement shows its state.

*Acceptance:* a flow test runs a monthly agreement through three charges, one failed and recovered, then a renewal notice and an auto-renewal, and a cancellation from the hub.

*Status:* missing — gap: no recurring billing.

#### PLAN-004 — Due-visit scheduling until done or declined.
Every included visit due in a period appears in a due list until it is completed or the customer explicitly declines; the office books them in batches (by area and season) and sends booking links; nothing due is ever silently dropped. The due list's remaining visits are the `REPORT-001` agreements-due tile's visit count.

*Acceptance:* a flow test generates 40 due visits, batch-books 30 by area, sends links for 8, records 2 declines, and checks the due list shows exactly the remainder, and the `REPORT-001` agreements-due tile the same number of due visits.

AGENT-008 inheritance: before this capability ships, the morning brief lists agreements with visits due, with their agreement link and a proposed action, asserted in the AGENT-008 flow.

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

*Semantics (STOCK-002, 19 October 2026):* the owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (with an optional email) of 1 to 50 price-book materials, each at a quantity to a thousandth of its unit and the supplier's unit cost (the item's price-book cost unless given), delivered to one van or warehouse (`STOCK-001`), for stock or for one job; it changes only while a draft. Glove sends nothing itself: the person sends it to the supplier by email, the supplier's portal, phone or in person and records that method with the supplier's reference, and the record and timeline say so (emailing it from Glove comes with `COMM-001`). Only a sent order is received, in one or more parts, each line at most what is still due; each part adds to the delivery location's stock as a stock move naming the order (and its job), and the order reads partly received until every line arrives. A job's received lines count to its actual cost (`COST-004`) at the order's unit cost; a price-book material recorded on that job counts at its price-book cost only beyond the quantity the job's orders received of it, so nothing is costed twice. A job order shows on the property history (`CUST-001`). Unit costs are margin figures (`MONEY-003`): purchase orders are read only by roles that read reports, never by technicians.

*Status:* done — evidence `src/glove/commands/purchasing.ts`, `src/glove/costing.ts`, `src/ui/purchasing.tsx`, `tests/api/purchasing.test.mjs`.

### Team and permissions

#### TEAM-001 — Custom roles and permissions.
The owner builds roles from named permissions (for example a CSR who books and takes card payments under `PAY-009` but cannot see margins or refund, a lead technician who can approve field quotes), each enforced by every command handler and read door as the built-in roles are.

*Acceptance:* the security matrix in `tests/api/security.test.mjs` extended with a custom CSR role: every command it lacks is refused through every door.

*Status:* done — evidence `src/glove/access.ts`, `src/glove/commands/setup.ts`, `src/ui/custom-roles.tsx`, `tests/api/security.test.mjs`.

#### TEAM-002 — Branches.
A business with several locations keeps branches with their own time zone, technicians, service areas, tax settings, numbering and reports, under one owner; people can be limited to their branch. Each branch carries its revenue rows and a branch filter in the `REPORT-002` reports.

*Acceptance:* a flow test sets two branches in different time zones, books in each, and checks a branch-limited dispatcher sees only theirs; and the `REPORT-002` revenue report by branch, filtered to one branch, narrows to that branch's invoices.

*Semantics (TEAM-002, 19 October 2026; ct approved 12:43Z):* the owner creates branches with an IANA booking zone, a unique alphanumeric number prefix and service ZIP codes. New sites choose their branch and keep it; the first site assigns its customer to that branch, and all of that customer’s sites stay in it. Technicians belong to a branch; crews never mix branches. Quotes, service calls, assessments and their jobs and invoices inherit the site’s branch, with independent per-kind counters (for example RAL-J-1001 and RAL-INV-0001). The prefix is fixed after the first number. Legacy sites, technicians and documents remain in the main business branch with their original numbers and business zone. A visit records its booking zone and exact instants; later branch-zone edits affect new bookings and moves, never rewrite existing visits. A technician must belong to the job’s branch; the existing area warning/refusal rule also applies to its branch ZIP codes. The Dispatch branch choice shows its own technicians, work and local zone. Actual per-branch US tax settings and the REPORT-002 tax-jurisdiction rows ship with MONEY-001, which carries them in its text and acceptance. Revenue reports include branch rows and a branch filter in JSON and CSV, dating each invoice by its branch’s local first-approval date (both period ends included). The owner limits a person to a named branch or the main business branch, or removes that limit. The installation owner retains all-branch access. Limits apply to every current read and command door, including files, Activity, history, reports, business/CSV exports, saved command outcomes and workflow actions under their creator’s live scope; a changed limit is rechecked in the commit guard. Scoped people read and change only operational records rooted in their branch; shared business reference data remains readable under their existing role and is read-only for them. New operational records created by a scoped person belong to their branch. Customers cannot merge across branches. Every existing report accepts the branch filter in JSON and CSV; future record kinds, read doors and reports inherit the same scope before shipping (API-002/003, COMM-001..009, PAY-001..009, LEDGER-001..004, PLAN-002..005, MOVE-001..006).

*Status:* done — evidence `src/glove/branches.ts`, `src/glove/branch-access.ts`, `src/glove/access.ts`, `src/glove/api.ts`, `src/glove/reports.ts`, `src/glove/commands/branches.ts`, `src/ui/branches.tsx`, `src/ui/team.tsx`, `tests/api/branches.test.mjs`, `tests/browser/branches.spec.ts`.

#### TEAM-003 — Technician commissions and bonuses.
The owner sets commission rules (percentage of sold or completed revenue, per-agreement spiffs) and Glove computes each technician's earnings per pay period for the payroll export, alongside each technician's tips (`PAY-002`).

*Acceptance:* a flow test applies a 5% sold-revenue rule and a $25 agreement spiff over a period and checks the totals in the payroll export.

*Status:* missing — gap: no commissions.

### Reporting

#### REPORT-001 — Owner dashboard.
The owner's home shows today's jobs and their state, technicians on the clock, revenue booked and paid today, open quotes, unbilled completed jobs, receivables and agreements due.

*Semantics (REPORT-001, 19 October 2026):* the owner's home is Today, read from `GET /api/glove/dashboard` by every role that reads reports (never a technician). "Today" is the business's local date in its timezone. Today's jobs are the jobs with a visit, not canceled, starting on that date, each with the job's own state (open, completed, invoiced). Booked today sums the accepted total, tax included (the chosen option and add-ons under `QUOTE-001`), of each quote whose acceptance was recorded that date. Open quotes are draft, approved and sent quotes, valued at their latest revision's first option's total. Completed, not invoiced counts completed jobs whose invoice has not been exported. On the clock lists the technicians with a shift clocked in and not out (`COST-001`). The other tiles ship with the clauses that keep their records, each carrying its tile in its text and acceptance: paid today with `PAY-002`, receivables with `PAY-004`, agreements due with `PLAN-002` and `PLAN-004`; until a tile's clause ships, Today shows no such tile rather than a zero.

*Acceptance:* a browser journey with a fixture day checks every figure against the records it summarizes (today's tiles; each later tile is checked by its own clause's acceptance).

*Status:* done — evidence `src/glove/dashboard.ts`, `src/glove/api.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs`. The on-the-clock tile shipped with `COST-001`; the paid-today, receivables and agreements-due tiles arrive with `PAY-002`, `PAY-004`, `PLAN-002` and `PLAN-004`.

#### REPORT-002 — Job, revenue, technician and lead reports.
Reports for revenue by period, job type and branch; technician revenue, close rate, callbacks and hours; lead source conversion; quote win rate; agreement count and churn; job margin (`COST-004`); and sales tax collected by jurisdiction and period, so the owner can file between accounting syncs; each filterable and exportable as CSV.

*Acceptance:* a flow test builds a fixture month and checks each report's totals against the records and the CSV export; one filter per report (period, branch, technician, job type, source) narrows its totals correctly, and the sales-tax-collected report matches the invoices' tax by jurisdiction to the cent.

*Semantics (REPORT-002, 19 October 2026):* every report takes a period of local dates in the business time zone, both ends included, and one filter, and answers as JSON or as a CSV of the same figures, read by the roles that read reports. Revenue is an invoice's latest person-approved revision subtotal before tax, counted once and dated by the invoice's first approval; the revenue report gives it by month and by job type (the category of the job's first price-book line, else Uncategorized, as in `COST-004`), filtered by job type. The technician report gives each technician's revenue (each such job's revenue split equally among the technicians who completed its visits, the cent remainder to the first by name), visits completed in the period, callbacks (a completed visit followed within 30 days by a new job at the same site) and their rate, and hours (their clocked shifts that began in the period, to a tenth of an hour), filtered by technician. Lead-source conversion counts the requests made in the period by source (`BOOK-003`'s figures), filtered by source; the quote win rate is quotes accepted ÷ quotes answered (accepted or declined) in the period, with the won value, filtered by the request's source; job margins are `COST-004`'s period roll-up, filtered by job type. The sales-tax report sums the tax on approved invoices by month for the business's one tax jurisdiction and says that basis, because Glove records no payments yet. Percentages are to one decimal, rounded half up. Branches (`TEAM-002`), technician close rate from field quotes (`QUOTE-006`), agreement count and churn (`PLAN-002`), tax by jurisdiction (`MONEY-001`) and tax collected from payments (`PAY-002`) come with those clauses, which carry them in their text and acceptance.

*Status:* done — evidence `src/glove/reports.ts`, `src/glove/api.ts`, `src/ui/reports.tsx`, `tests/api/reports.test.mjs`.

#### REPORT-003 — Receivables aging.
An aging report (current, 1–30, 31–60, 61–90, over 90 days) by customer with links to each open invoice and its reminder state.

*Semantics (20 October 2026, ct approved 23:58Z, pattern 1):* the first human approval freezes the invoice's issue date in its branch's local zone, business payment terms in calendar days and due date. Export, corrections and later business settings never move these dates. Legacy invoices without retained terms use their first approval date plus current business terms, labelled "due date computed from first approval and current terms". The report uses the latest approved revision on or before its chosen `asOf` local date; an unapproved draft or correction contributes nothing new. With no payments recorded yet, a positive approved total is the open balance. Each customer's invoices and total are split into current (due today or later), 1–30, 31–60, 61–90 and over 90 calendar days past due, boundaries inclusive, in exact cents and separately by currency; every invoice links to its normal invoice screen. The report states "No payments recorded yet" and "No reminders scheduled". PAY-002 and PAY-004 inherit confirmed payment, allocation, credit and refund effects on these balances, and PAY-005 inherits actual reminder state, each in its text and acceptance before shipping. The existing reports permission and branch filters apply to JSON and CSV alike. PAY-dependent homepage claims stay partial.

*Acceptance:* `tests/api/reports.test.mjs` › `REPORT-003 aging …` creates invoices at every bucket boundary, checks exact customer/currency totals and every invoice link, frozen dates through terms edits, export and approved corrections, unapproved corrections excluded, honest reminder/payment labels, JSON/CSV agreement, invalid dates and role/branch refusal. `tests/browser/receivables.spec.ts` opens the report and follows an exact invoice at 1440/390. PAY-002/004 assert payment/credit/refund effects and PAY-005 the actual reminder state in this report before shipping.

*Status:* done — evidence `src/glove/receivables.ts`, `src/glove/commands/invoices.ts`, `src/glove/api.ts`, `src/ui/receivables.tsx`, `tests/api/reports.test.mjs`, `tests/browser/receivables.spec.ts`.

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

*Semantics (API-002 tokens, 19 October 2026; ct approved 19:01Z):* only the owner issues (`token.issue {name, role, branchId?}`) and revokes (`token.revoke`) integration tokens. A token acts as one role: Dispatcher, Office, Agent, Viewer or one of the owner's custom roles, never Owner, Technician or Subcontractor (field roles act for a person on their own visits). Without `branchId` it reaches every branch; with a branch id, or `main` for the main business, it is limited like a branch-limited person (`TEAM-002`). The token (`glv_` and 43 base64url characters from 32 random bytes) appears once, in the issuing response; Glove keeps only its SHA-256, never in records, the saved command outcome a replay returns, Activity, exports or the portable archive (restored installations issue new tokens). A request with `Authorization: Bearer <token>` acts as that role through every read and command door, without the same-origin check sessions need. Each request checks the token is unrevoked, and each commit re-checks in its atomic batch that the token is unrevoked, still holds its role, and that a custom role's permissions are unchanged; a revoked token is refused (401) from its next request. A token never manages tokens, roles, role assignments, agent grants, branch limits, provider keys or calendar addresses, whatever its role. What a token changes is in Activity under "<name> (integration token)" with its role; the owner's token list shows each token's role, branch, issue time, last use (every request) and revocation, never the token or its hash. A workflow rule a token created runs as that token's current role and branch, and is logged "not allowed" once the token is revoked. Signed webhooks, the other half of this clause, are not built yet: the delivery host must be checked on its resolved address with no DNS-rebinding gap, which waits on the Base egress door (gr-base-285); `invoice.paid` is carried by `PAY-002`/`PAY-004`.

*Status:* partial — evidence `src/glove/tokens.ts`, `src/glove/access.ts`, `src/ui/integration-tokens.tsx`, `tests/api/tokens.test.mjs`, `tests/api/security.test.mjs`; gap: signed webhooks (owner-only, id-only payloads, Glove-Signature t/v1, commit-time outbox, 5 retries then failed, delivery log and redeliver) wait on the Base egress door with the resolved-address private-range check (gr-base-285).

#### API-003 — Zapier and Crank apps.
Published Zapier and Crank apps expose Glove's triggers and actions (create request, create customer, new paid invoice) for cross-app automation.

*Acceptance:* each app's own test suite runs its triggers and actions against a running installation.

*Status:* missing — gap: no published apps.

#### API-004 — CompanyCam photos.
Photos taken in CompanyCam for a job's address appear on the Glove job, and Glove job photos can be sent to the CompanyCam project.

*Acceptance:* a flow test links a CompanyCam project (fake) and checks photos flow both ways once.

*Semantics (API-004, 19 October 2026; ct approved 12:43Z):* the owner saves or disconnects a CompanyCam Public API access token as an installation secret, excluded from state, exports, logs and archives. Saving it is labelled unverified. The owner or dispatcher links a job to an existing project by numeric id; its recorded address must match the site's address after case, whitespace and punctuation normalization, without claiming postal validation. Imports and exports are explicit actions on that job. Imports consume every cursor page, retain provider photo ids and capture times, and show original photos with captions labelled CompanyCam, never as technician arrival or sign-off. The existing Glove JPEG/PNG/WebP and 1.5 MB photo limits apply, with a visible error for every unsupported, oversized or unready photo; none is silently skipped. Repeating an import creates no second copy. A selected original Glove photo sends only its bytes and caption to that project; no customer identity, contacts, job prices or other fields are sent. A durable, current-authority-checked reservation precedes the upload. Its provider photo id and caption outcome are kept; repeating a send never sends that photo again. An uncertain upload is labelled “outcome unknown; check CompanyCam” and is never resent. The owner can reconcile it to an existing photo in the same project only after its original-byte SHA-256 matches; this confirms the photo without claiming any unconfirmed caption. Exported photos do not loop back into the job; a photo matching an uncertain upload is held with a visible reconciliation error. Link, import and export outcomes and provider ids are audited on the job; whole-business export and the portable archive retain references and upload reservations, never the token. Every command and read door checks the current role and job visibility.

*Status:* done — evidence `src/glove/commands/companycam.ts`, `src/glove/companycam/client.ts`, `src/glove/companycam/uploads.ts`, `src/ui/companycam.tsx`, `tests/api/companycam.test.mjs`, `tests/browser/companycam.spec.ts`.

#### API-005 — Workflow rules.
The owner sets rules of the form "when this happens, do that" on Glove's own events (when a job with the "commercial" tag completes, assign the invoice to a named office person; when a quote over $5,000 is approved, notify the owner; when a request comes from Angi, apply its lead cost), each with a run log and an on/off switch; a rule can do only what its creator's role can.

*Acceptance:* a flow test creates two rules, triggers each, checks the run log and effect, and checks a rule created by an office person cannot book a visit.

*Semantics (API-005, 19 October 2026):* the owner and the office make rules (`rule.save`); a rule's creator or the owner changes it or turns it off. A rule has a trigger among Glove's own events (a request created, a quote's price approved, a job created, a job completed), an optional condition (the request's source; the quote's or job's total over an amount, tax included) and one action: an in-app notice to a desk role or to one named person who holds a desk role , booking a job just created with a technician a number of days later at set times, or assigning a job just completed's invoice preparation to one named person who prepares invoices (the owner or an office person), shown on the job with a notice to them. After every command, each enabled rule whose trigger that command raised runs once, as its creator's current role checked at run time through the same command checks: an action that role cannot take is logged "not allowed" and does nothing, and a booking with a conflict is logged "refused" (a rule never confirms a conflict review). Every run is logged with the rule and its version, the triggering record, the outcome and why, and is shown with the rules on the Rules screen; what a rule does never triggers another rule. A customer-tag condition comes with `CUST-004` and applying a lead cost with `BOOK-004`, which carry them in their text and acceptance.

*Status:* done — evidence `src/glove/rules.ts`, `src/glove/api.ts`, `src/ui/rules.tsx`, `tests/api/rules.test.mjs`.

### Data, privacy and operations

#### DATA-001 — Customer privacy requests and erasure.
On a customer's request the owner exports everything Glove holds about them, or erases their personal data (name, contacts, addresses, messages, recordings, photos of people), keeping invoices and payment records the business must retain for tax with the person's details removed; each request is recorded with its outcome.

MONEY-001 inheritance: erasure removes every private exemption-certificate original/chunk and its evidence metadata, and the restore fence prevents an older backup from reviving them; assert this through the customer erasure door before shipping.

*Acceptance:* a flow test exports one customer's data, erases them, checks every personal field and file is gone while invoice totals and tax records remain, and checks a restored older backup cannot bring them back.

*Status:* missing — gap: no customer erasure.

#### DATA-002 — Every change, message and payment recorded.
Every command, message, call, payment, sync and agent action is on the timeline with who (or which agent or provider), when and what changed, readable in Activity and exportable.

*Acceptance:* named DATA-002 flows perform human and agent commands, workflow rule actions, calendar reads, audience pushes, model responses, CompanyCam photo syncs and Web Push setup/subscription/removal/outcomes, and find each current kind with who, when and what changed in Activity and the business export. A history beyond the latest window remains readable through Activity’s older-page door under the same role checks. The browser journey loads an older provider outcome in Activity at 1440 and 390. Future communication, payment and accounting flows assert their new kinds before shipping under the carriers below.

*Semantics (DATA-002, 19 October 2026; ct approved 13:06Z):* DONE covers every current capability. Every committed Glove command must supply an explicit timeline event; an eventless command is refused before its changes commit. An event keeps its actual person/agent/rule-creator identity, time, command id, subject and effect. The command's first event also keeps the ids, before/after versions and changed field names of its changed records, without copying private field values. Activity's changed-record details follow the same current visibility as the underlying records. Provider response facts identify the provider and a generic outcome, never credentials, endpoints, keys or payloads; current model, audience, CompanyCam and Web Push outcomes are recorded separately so the fact survives a lost final command commit. Web Push records subscription/technician/job ids and HTTP status only, including 404/410 and unreachable services; it never claims delivery to the phone. Subscription setup/removal, marketing disconnects, custom-field/tag/segment edits, stock locations, purchase-order revisions and rule changes/runs have their own explicit events. Activity loads older events by sequence, with current role/job checks on every page; its loaded history is discarded when the installation change version or reader changes. Export keeps the whole append-only timeline and provider references.

Every future clause adding a capability, provider, record kind or door inherits this obligation before it ships. The absent customer-message/call/portal kinds are carried by COMM-001/002/005/006/009, payments/refunds/payouts/office charges by PAY-002/004/007/009, and accounting syncs by LEDGER-001/002/003/004, each named in its text and acceptance. Homepage claim 55 includes those missing call/message/payment capabilities and stays partial.

*Status:* done — evidence `src/glove/storage.ts`, `src/glove/timeline.ts`, `src/glove/activity.ts`, `src/ui/activity.tsx`, `tests/api/records.test.mjs`, `tests/api/segments.test.mjs`, `tests/api/push.test.mjs`, `tests/api/eligibility.test.mjs`, `tests/api/suggest.test.mjs`, `tests/api/companycam.test.mjs`, `tests/api/rules.test.mjs`, `tests/api/stock.test.mjs`, `tests/api/purchasing.test.mjs`, `tests/browser/companycam.spec.ts`.

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

*Acceptance:* a scripted-call journey (telephony and model fakes) books a tune-up into the right slot, refuses an out-of-policy price and hands it to the office, and transfers a gas-smell call within the owner's limit. An inbound text thread is answered by the agent and books a slot, with the confirmation text sent. With the mode set to after hours, a call inside business hours rings the office and the agent does not answer; with overflow, the agent answers only a call the office leaves ringing past the owner's limit. Every call transcript and text thread opens with the automated-assistant disclosure; saying or texting "talk to a person" transfers the call, or hands the thread to the office inbox. The request carries the extracted name, address, problem and urgency, and the call, transcript, thread, summary and booking are on the customer timeline. `AGENT-005` drafts a quote from a request the agent took with the call's transcript in its evidence (model fake). It also carries `DISP-006`: a booking the front office makes is assigned automatically.

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

*Semantics (AGENT-003, 20 October 2026; ct approved as pattern-1 DONE):* `GET /api/glove/delays?at=` (the desk and agents; never field roles) watches today's signals that exist. A booked visit not yet arrived is at risk when its technician is still on an earlier visit that day after that visit's booked end (a running `COST-001` job timer, or arrival without completion): Glove expects them free at the moment of reading plus the overrun so far, at least 15 minutes, and flags their later visits that day starting before then. A visit is also at risk while a purchase order for its job (`STOCK-002`) is not fully received. For an overrun, the watch offers each other active technician free at the same planned time (same branch, skills, areas, time off, calendars and other visits checked; cancelled visits free their slots), then the same technician at the expected free time rounded up to 15 minutes. The agent (or the owner or a dispatcher) prepares a move as a proposal (`proposal.prepare {kind: "move", visitId, plan}`); someone other than the preparer approves it with `GLOVE-07` conflict review, and a visit changed since preparation needs a new proposal. A move that keeps the planned time, or keeps the start inside the visit's arrival window (`DISP-006`) on the same day, keeps that window; any other move drops it and is labelled "customer not yet asked". Under an `AGENT-009` grant the agent moves a visit itself only within its day, for the same technician, with the start inside its arrival window, and never changes the window. The customer's confirmation by reply and the agent's text are carried by `COMM-002` and `COMM-005`, technician locations by `DISP-005`, each naming `AGENT-003` in its text and acceptance; customer preferences join when a clause records them.

*Status:* done — evidence `src/glove/delays.ts`, `src/glove/commands/dispatch.ts`, `src/glove/commands/grants.ts`, `src/ui/dispatch-cards.tsx`, `tests/api/delays.test.mjs`.

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

*Semantics (AGENT-005, 19 October 2026; data flow as ct approved 19 October 11:36Z):* the agent, the owner or a dispatcher asks for a draft on a new or contacted request that names its site, once the owner has connected the model provider (`FIELD-006`). The owner's provider receives, with store off and a strict answer schema, exactly: the request's description as entered and its source; the site's equipment (type, make, model, install and manufacture dates, age in whole years from the install date, else the manufacture date, to today in the business time zone, refrigerant) with each unit's earlier completed visits' dates and work summaries; the property's past job titles with their completed visits' summaries; and the active price book (code, name, the description customers see, unit, price before tax). Never costs or markups, the customer's name, contacts, billing or site address, technician names, serial numbers or photos. The answer is a job title and three options, Good, Better and Best, each one to 20 lines of an active price-book code and a quantity (more than 0, up to three decimals) and a reason. Any other code, quantity or shape refuses the whole answer, with nothing saved, repaired or retried. Glove saves it as a draft quote on the request (the request becomes quoted) at the price book's prices, with each option's reason and the label "Drafted by the model from the request. A person approves each option's price before it is sent." A person approves the prices (`GLOVE-03`), and the agent can neither approve nor record a send. Requests carry no photos or call transcripts today: `BOOK-001` (request photos, behind an owner switch whose privacy ct rules on first) and `AGENT-001` (the call transcript) add them to this evidence before they ship, in their text and acceptance.

*Status:* done — evidence `src/glove/commands/suggest.ts`, `src/ui/quotes.tsx`, `tests/api/suggest.test.mjs`.

#### AGENT-006 — Repeat-callback diagnosis.
*What the agent does:* when a property calls back about equipment serviced recently, gathers the equipment history, earlier photos, readings, materials and the manufacturer's manual, and prepares a diagnosis checklist and parts plan for the technician.

*Data:* equipment records, form results, photos and materials at the property.

*Human control:* advisory only; the licensed technician diagnoses and decides the work, and the agent never certifies safety.

*Acceptance:* a flow test raises a callback on a condenser with two prior visits and checks the prepared checklist cites both visits' readings.

*Semantics (AGENT-006, 19 October 2026):* a new job (from a quote or a service call, which can name the site's equipment) is a callback when a unit it names had a visit on another job completed within the 30 days before the job was made, counted on the server's received completion time, the window `REPORT-002` counts callbacks in; the job carries that flag and its timeline says so. The agent (or the owner or a dispatcher) prepares the checklist with the owner's model provider (`FIELD-006`'s connection): Glove gathers the unit's record, manual, photos and every earlier completed visit on it (form readings with their ranges and out-of-range flags, refrigerant, notes, materials), oldest first, each visit and reading with a reference; the model gets the equipment and visit evidence and photo captions only, never customer names, contacts or addresses. Every checklist step and part must cite references the pack holds, and Glove resolves each citation to the recorded reading; an answer that cites nothing or anything else is refused and nothing is kept. The prepared checklist is labelled advisory (the licensed technician diagnoses and decides the work; it is not a safety certification), decides no work, and is read by the desk and the technicians assigned to the callback job.

*Status:* done — evidence `src/glove/callbacks.ts`, `src/glove/commands/callbacks.ts`, `src/glove/provider.ts`, `src/ui/nameplates.tsx`, `tests/api/callbacks.test.mjs`.

#### AGENT-007 — Keep every maintenance agreement fulfilled.
*What the agent does:* tracks agreements' due visits and entitlements, offers customers booking slots for due visits, chases unanswered ones, checks the promised maintenance was actually recorded, and prepares renewal outreach for agreements nearing their end.

*Data:* agreements, due visits, capacity, completed forms and customer threads.

*Human control:* the owner sets booking and renewal policy; customers choose their slots; technicians record completion; the agent changes no price or term.

*Acceptance:* a flow test with 20 due visits checks offers sent, 12 booked by customer reply, chases for the rest, and a flag on a completed visit with no maintenance form.

*Status:* missing — gap: no agreements.

#### AGENT-008 — Morning brief and margin watch.
*What the agent does:* shows the owner a short morning brief when they open Glove: jobs at risk today, unbilled completed work, jobs over their cost estimate, overdue invoices, agreements due and leads waiting too long, each with one proposed next action. Nothing is pushed or emailed today; `COMM-001` inherits morning email delivery.

*Data:* `REPORT-*`, `COST-*`, `PAY-*` and `BOOK-*` records.

*Human control:* read-only; each proposed action opens the normal screen for a person to act.

*Acceptance:* a flow test with a fixture day checks every item in the brief matches its records and links to its action, and opening it sends no email or push. A browser journey opens Glove and reads the brief. `COMM-001` inherits morning email delivery with a provider-outcome assertion.

*Semantics (AGENT-008, 20 October 2026):* Glove prepares the brief itself from its records (no model), for the owner only, at `GET /api/glove/brief` and on the owner's Today screen, for the business's local date at the moment it is read (`at=` reads it as of another UTC moment); it writes nothing. At risk today: visits on that local date, not cancelled or completed, with no technician, not arrived 15 minutes after their start, or arrived and still open at or after their planned end (action: Dispatch). Unbilled: completed jobs whose invoice is missing (Prepare invoice) or still a draft (Approve invoice). Over estimate: open jobs whose actual cost exceeds a non-zero estimated cost as `COST-004` computes them (Review job costs); `COST-005` margin warnings stay the live watch. Leads waiting: requests still new or contacted 24 hours or more after entering that stage (Contact the customer / Quote the request). The brief is shown when the owner opens Glove, with no scheduled delivery or push today. `COMM-001` inherits morning email delivery of this owner brief, including a delivery-outcome assertion in its acceptance before it ships. The brief says overdue invoices and agreements due are not tracked until `PAY-004` and `PLAN-004` add those records; each of those clauses adds its section (with its record link and action) and its assertion to this flow before it ships (pattern 1).

*Status:* done — evidence `src/glove/morning-brief.ts`, `src/ui/morning-brief.tsx`, `tests/api/morning-brief.test.mjs`, `tests/browser/morning-brief.spec.ts`.

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
| Keep the general ledger, file sales tax or run payroll | QuickBooks Online, Xero or Pantry keep the books; Avalara or the owner's accountant files sales tax; [Envelope](https://github.com/just-every/run-envelope), Gusto, ADP RUN or QuickBooks Payroll pay people and file W-2 and 1099 forms (`LEDGER-*`, `MONEY-001`, `COST-002`) |
| Operate maps, GPS hardware or lead marketplaces | Google Maps and routing providers, Linxup, Samsara or Verizon Connect for fleet GPS, Google, Angi, Thumbtack and Yelp for leads (`DISP-002`, `DISP-005`, `BOOK-004`) |
| Replace trade licensing, diagnosis or safe-work judgment | Agents are advisory on technical work; the licensed technician remains responsible for the work and equipment release (`AGENT-006`) |
| Give legal advice on consumer, auto-renewal, surcharging or recording-consent law | Glove carries the notices, consents and settings; the owner sets the wording their state requires |
| Run route optimization or media processing unbounded inside a request | Bounded background jobs and external providers (`DISP-003`, `FIELD-006`) |
| Become a marketing suite or a construction project manager | Mango or Mailchimp for campaigns; Plinth or Buildertrend for multi-month builds |

Physical receipt, completed repair, safe equipment and accepted work require human evidence; a database state, a provider acknowledgment or a restore is not that evidence. A real owner export from each incumbent has not yet been reconciled; each move-in kit is proven against documented-shape fixtures until one is. "Glove" is the working name.

## Homepage claims

Every capability the homepage states (the design desk's page-s1 structure, owner-approved 17 October 2026: one job, Ellen Brooks's water heater, from the call to a year of Comfort Club) maps to a clause above. Status is judged from the clauses' statuses at the judged commit: `done` when every backing clause is done, `missing` when none has started, otherwise `partial`. Code names the path that backs the claim today, "partly" with what exists, or "contract, not yet in code". A claim ahead of the code stays on the page; its clauses are what the build rounds deliver.

| # | Claim | Clauses | Status | Code |
| ---: | --- | --- | --- | --- |
| 1 | Every call becomes a paid job. | `GLOVE-03`, `GLOVE-05`, `GLOVE-09`, `BOOK-005`, `AGENT-001`, `PAY-002` | partial | partly: request to quote to job to invoice in `src/glove/commands/quotes.ts`, `dispatch.ts`, `invoices.ts`; no calls or payments |
| 2 | Glove answers your calls and texts | `AGENT-001`, `COMM-002`, `COMM-009` | missing | contract, not yet in code |
| 3 | books the job | `GLOVE-05`, `BOOK-002`, `BOOK-005` | partial | partly: `src/glove/commands/dispatch.ts` (`job.create`, `visit.book`) |
| 4 | sends the tech | `GLOVE-05` | done | `src/glove/commands/dispatch.ts`, `src/ui/technician.tsx` |
| 5 | takes payment on site | `PAY-003` | missing | contract, not yet in code |
| 6 | keeps every maintenance plan on schedule | `PLAN-004`, `AGENT-007` | missing | contract, not yet in code |
| 7 | 100% free, open source alternative to Jobber, Housecall Pro and ServiceTitan | `DATA-004` | done | `LICENSE` |
| 8 | Hero cards: New call 7:42 am · Booked 11:00 am; Dispatch · Luis · Van 3 · ETA 10:52 am; Quote $1,850 · Accepted; Part on backorder · Rebooked Thu, Oct 22 · Customer texted; Paid on site · $412.00 · card; Maintenance plan · 1 visit left · next Apr 3 | `AGENT-001`, `GLOVE-05`, `DISP-005`, `GLOVE-04`, `AGENT-003`, `STOCK-002`, `COMM-003`, `PAY-003`, `PLAN-002` | partial | partly: booking, assignment, the accepted quote, the backorder flag and the rebooked visit (`src/glove/commands/dispatch.ts`, `quotes.ts`, `src/glove/delays.ts`); calls, ETA, texts, payments and plans are contract, not yet in code |
| 9 | 7:42 am · Front office: answers the first ring, says it is an automated assistant, asks what a good dispatcher would ask and books a real open slot | `AGENT-001`, `BOOK-002` | missing | contract, not yet in code |
| 10 | Booked job #4417 with the confirmation text ("You're booked for 11:00") | `GLOVE-05`, `COMM-003` | partial | partly: the booked visit (`src/glove/commands/dispatch.ts`); no texts |
| 11 | 8:05 am · Dispatch: the day board, 6 techs and 31 jobs on an 8 am-2 pm grid | `DISP-001` | done | `src/ui/dispatch.tsx`, `src/ui/dispatch-board.tsx` |
| 12 | The route-map strip over the board | `DISP-002` | missing | contract, not yet in code |
| 13 | 8:05 am · Parts check · Van 3: every part job #4417 needs is on board (drain valve and anode), the shutoff from the 7:42 call is on the job, and the on-my-way text goes when Luis leaves Ortiz | `STOCK-001`, `AGENT-001`, `COMM-004` | partial | partly: the day's parts check in `src/glove/stock.ts`; calls and texts contract, not yet in code |
| 14 | 10:52 am · Tech app: photos, checklist, options and signature on the tech's phone, with or without signal | `FIELD-001`, `FIELD-002`, `GLOVE-06`, `GLOVE-08` | done | `src/ui/offline-day.ts`, `src/ui/outbox.ts`, `src/glove/commands/forms.ts`, `src/ui/technician.tsx` |
| 15 | The data plate read as MFG 2014 · 50 GAL · NAT GAS | `FIELD-006` | done | `src/glove/commands/nameplates.ts`, `src/ui/nameplates.tsx` |
| 16 | Good, better and best for the replacement; Better accepted | `QUOTE-001`, `GLOVE-04` | done | `src/glove/commands/quotes.ts`, `src/ui/options.tsx` |
| 17 | Paid on site · $412.00; $500 deposit paid | `PAY-003`, `QUOTE-003` | missing | contract, not yet in code |
| 18 | 12:40 pm · Job agent: rebooked before anyone called; finds stock at a branch and a new slot, Maya in dispatch taps Send, Ellen confirms by reply | `AGENT-003`, `STOCK-002`, `GLOVE-07`, `COMM-003` | partial | partly: the delay watch flags a visit whose purchase order is not fully received and prepares a move a dispatcher approves with conflict review (`src/glove/delays.ts`, `src/glove/commands/dispatch.ts`); purchasing in `src/glove/commands/purchasing.ts`; no customer texts |
| 19 | Interlude: Van 3 · Ellen's heater delivered · parts for all 5 jobs | `STOCK-001`, `STOCK-002` | done | the purchase order received to Van 3 (`src/glove/commands/purchasing.ts`) and the day's parts check (`src/glove/stock.ts`, `src/ui/stock.tsx`) |
| 20 | Thursday 10:05 am · Payments: card, tap to pay, ACH or financing on site | `PAY-002`, `PAY-003`, `PAY-006` | missing | contract, not yet in code |
| 21 | Each payment lands in QuickBooks Online | `LEDGER-001` | missing | contract, not yet in code |
| 22 | The job shows its real margin: job costing for #4417 + #4418, estimate against actual | `COST-004` | done | `src/glove/costing.ts`, `src/ui/costing.tsx` |
| 23 | Review request · goes out 6:00 pm | `COMM-008` | missing | contract, not yet in code |
| 24 | Next 12 months · Maintenance plans: Comfort Club at $19/mo, 2 visits a year, 1 visit left, billed monthly, renews | `PLAN-002`, `PLAN-003` | missing | contract, not yet in code |
| 25 | A declined card fixed by an update link | `PAY-008` | missing | contract, not yet in code |
| 26 | Moving in: customers, jobs, quotes, recurring jobs and open balances from Jobber in one import | `MOVE-001` | missing | contract, not yet in code (the shipped kit is ServiceM8, `src/glove/movein/servicem8.ts`) |
| 27 | Onto your office computer or your own server | `DATA-004`, `DATA-003` | partial | partly: runs on the owner's computer (`LICENSE`, `tests/browser/run.mjs`); a hosted deployment is not yet accepted |
| 28 | 9 customers share a phone number · review merge | `CUST-005` | done | `src/glove/duplicates.ts`, `src/glove/commands/merge.ts` |
| 29 | git clone, then `rer install`, `rer setup`, `rer dev` | `DATA-004` | done | `package.json` scripts (`deps`, `setup`, `dev`), `RUN-LOCALLY.md` |
| 30 | What it doesn't do: payroll, GPS hardware or marketing campaigns | Honest boundaries | done | `docs/limits.md` |
| 31 | Every job, done and paid. / Open source field service software for plumbing, HVAC, electrical and home service pros / Free and open source, MIT licensed | `GLOVE-08`, `GLOVE-09`, `PAY-002`, `DATA-004` | partial | partly: completion evidence and invoices (`src/glove/commands/field.ts`, `invoices.ts`); no payments |
| 32 | Closing cards: 31 jobs done, Paid today · $14,820 | `REPORT-001`, `PAY-002` | partial | partly: the owner dashboard (`src/glove/dashboard.ts`, `src/ui/today.tsx`); no payments |

## Status

Judged from the code and tests at commit `94eec23cbcf97e6c8531839db1b1261037c3e7b4` (17 October 2026).

`done` means the behavior ships and a cited test exercises it; `partial` means some of it ships and the Gap says what is missing; `missing` means there is no implementation. Status is a build-planning judgment, not acceptance; [ACCEPTANCE.md](ACCEPTANCE.md) decides acceptance.

| Clauses | Done | Partial | Missing | Total |
| --- | ---: | ---: | ---: | ---: |
| Published | 13 | 0 | 0 | 13 |
| Target and push further | 45 | 10 | 46 | 101 |
| All | 58 | 10 | 46 | 114 |

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
| `MONEY-001` | US dollars and sales tax | target | done | `src/glove/sales-tax.ts`, `src/glove/avatax.ts`, `src/glove/qbo-invoice.ts`, `tests/api/money.test.mjs`, `tests/portable.mjs`, `tests/browser/money.spec.ts` |  |
| `MONEY-002` | US business identity on every document | target | done | `src/glove/commands/setup.ts`, `src/glove/api.ts`, `src/ui/identity.tsx`, `src/ui/team.tsx`, `tests/browser/journey.spec.ts` |  |
| `MONEY-003` | Price book with costs, markup and flat rates | target | done | `src/glove/pricebook.ts`, `src/glove/commands/pricebook.ts`, `src/ui/price-book.tsx`, `tests/api/pricebook.test.mjs` |  |
| `CUST-001` | Customer and property history in one place | target | done | `src/glove/commands/setup.ts`, `src/glove/history.ts`, `src/ui/customers.tsx`, `src/ui/property-history.tsx`, `tests/api/customers.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `CUST-002` | Installed equipment and warranties | target | done | `src/glove/commands/equipment.ts`, `src/glove/equipment.ts`, `src/ui/equipment.tsx`, `tests/api/equipment.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `CUST-003` | Customer CSV import and export | target | done | `src/glove/movein/csv.ts`, `src/glove/movein/kit.ts`, `src/ui/csv-import.tsx`, `tests/api/csv.test.mjs` |  |
| `CUST-004` | Tags, custom fields and segments | target | done | `src/glove/segments.ts`, `src/glove/commands/segments.ts`, `src/glove/commands/marketing.ts`, `src/glove/rules.ts`, `src/ui/custom-fields.tsx`, `tests/api/segments.test.mjs` |  |
| `CUST-005` | Duplicate detection and merge review | target | done | `src/glove/duplicates.ts`, `src/glove/commands/merge.ts`, `src/ui/duplicates.tsx`, `src/glove/movein/kit.ts`, `tests/api/merge.test.mjs`, `tests/api/csv.test.mjs` |  |
| `BOOK-001` | Request form on the business website | target | missing |  | requests are entered by staff only (`enquiry.create`) |
| `BOOK-002` | Online booking into real availability | target | missing |  | no customer-facing booking |
| `BOOK-003` | Lead sources and the request pipeline | target | done | `src/glove/pipeline.ts`, `src/glove/commands/quotes.ts`, `src/ui/quotes.tsx`, `tests/api/pipeline.test.mjs` |  |
| `BOOK-004` | Leads from Google, Angi, Thumbtack and Yelp | target | missing |  | no lead-source connectors |
| `BOOK-005` | Service calls booked without a quote | target | done | `src/glove/commands/dispatch.ts`, `src/glove/commands/field.ts`, `src/glove/commands/invoices.ts`, `src/ui/service-call.tsx`, `tests/api/servicecall.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `BOOK-006` | Assessment visits on a request | target | done | `src/glove/commands/assessments.ts`, `src/glove/commands/quotes.ts`, `src/glove/commands/field.ts`, `src/ui/assessment.tsx`, `tests/api/assessments.test.mjs` |  |
| `QUOTE-001` | Good, better and best options and add-ons | target | done | `src/glove/commands/quotes.ts`, `src/glove/commands/dispatch.ts`, `src/ui/options.tsx`, `src/ui/quotes.tsx`, `tests/api/options.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `QUOTE-002` | Online approval with e-signature | target | partial | `src/glove/commands/quotes.ts`, `tests/api/flows.test.mjs` | staff record the customer's answer, including "signed"; there is no customer-facing quote link or e-signature |
| `QUOTE-003` | Deposits on approval | target | missing |  | no payments |
| `QUOTE-004` | Automatic quote follow-up | target | missing |  | Glove sends nothing |
| `QUOTE-005` | Branded quote, invoice and report documents | target | missing |  | documents exist only as desk screens and the invoice CSV |
| `QUOTE-006` | Field quotes and change orders, offline | target | missing |  | technicians cannot see prices or create quotes |
| `QUOTE-007` | Discounts on quotes and invoices | target | done | `src/glove/sales-tax.ts`, `src/glove/discounts.ts`, `tests/api/discounts.test.mjs`, `tests/browser/discounts.spec.ts` |  |
| `DISP-001` | Drag-and-drop dispatch board | target | done | `src/ui/dispatch.tsx`, `src/ui/dispatch-board.tsx`, `src/glove/commands/dispatch.ts`, `tests/browser/journey.spec.ts` |  |
| `DISP-002` | Map board and travel time | target | missing |  | no map, travel time or drawn zones |
| `DISP-003` | Route optimization | target | missing |  | no routing |
| `DISP-004` | Skills, availability, time off and service areas | target | partial | `src/glove/eligibility.ts`, `src/glove/calendar.ts`, `src/glove/commands/calendar.ts`, `src/ui/availability.tsx`, `tests/api/eligibility.test.mjs` | availability not read from Lanyard (no Lanyard read door yet); Base egress door: partial until Glove adopts Base's egress door for the owner-entered Lanyard origin (gr-base-285) |
| `DISP-005` | Live technician location and ETA | target | missing |  | no location |
| `DISP-006` | Arrival windows and automatic assignment | target | done | `src/glove/commands/dispatch.ts`, `src/glove/commands/assessments.ts`, `src/ui/dispatch-cards.tsx`, `src/ui/assessment.tsx`, `src/ui/visit-panel.tsx`, `tests/api/assessments.test.mjs` |  |
| `DISP-007` | Multi-day jobs, crews and subcontractors | target | done | `src/glove/commands/dispatch.ts`, `src/glove/subcontract.ts`, `src/glove/view.ts`, `src/ui/dispatch.tsx`, `src/ui/subcontract.tsx`, `tests/api/subcontract.test.mjs`, `tests/browser/journey.spec.ts` |  |
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
| `FIELD-001` | Offline day of jobs that survives a reload | target | done | `src/ui/offline-day.ts`, `public/glove-sw.js`, `src/ui/api.ts`, `src/ui/outbox.ts`, `src/ui/technician.tsx`, `tests/browser/journey.spec.ts` |  |
| `FIELD-002` | Custom forms and inspections | target | done | `src/glove/forms.ts`, `src/glove/commands/forms.ts`, `src/glove/commands/field.ts`, `src/ui/forms.tsx`, `tests/api/forms.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `FIELD-003` | Shareable service report | target | done | `src/glove/service-reports.ts`, `src/glove/commands/service-reports.ts`, `src/ui/service-report.tsx`, `tests/api/service-reports.test.mjs`, `tests/browser/service-reports.spec.ts` |  |
| `FIELD-004` | Installable technician app with push | target | done | `src/glove/push.ts`, `src/glove/commands/push.ts`, `src/ui/push.tsx`, `public/manifest.webmanifest`, `public/glove-sw.js`, `tests/api/push.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `FIELD-005` | Native iOS and Android apps | target | missing |  | no native apps |
| `FIELD-006` | Equipment nameplate capture | target | done | `src/glove/commands/nameplates.ts`, `src/glove/provider.ts`, `src/ui/nameplates.tsx`, `tests/api/nameplates.test.mjs` |  |
| `FIELD-007` | Refrigerant tracking for HVAC | target | done | `src/glove/commands/field.ts`, `src/glove/equipment.ts`, `src/ui/equipment.tsx`, `tests/api/equipment.test.mjs` |  |
| `FIELD-008` | The whole office on the owner's phone | target | partial | `tests/browser/journey.spec.ts` | the first-release desk journey (team, customers, request to accepted quote, job and booking, invoice preparation and export) runs at 390 px; nothing is sent or paid, there is no inbox or dashboard, and no horizontal-scroll check |
| `COST-001` | Clock-ins and job timers | target | done | `src/glove/commands/time.ts`, `src/ui/clock.tsx`, `src/glove/dashboard.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs` |  |
| `COST-002` | Timesheets and payroll export | target | done | `src/glove/payroll.ts`, `src/ui/timesheets.tsx`, `tests/api/payroll.test.mjs` |  |
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
| `PLAN-001` | Recurring jobs | target | done | `src/glove/recurrence.ts`, `src/glove/commands/series.ts`, `src/glove/commands/field.ts`, `src/ui/series.tsx`, `tests/api/series.test.mjs` |  |
| `PLAN-002` | Maintenance agreements and memberships | target | missing |  | no agreements |
| `PLAN-003` | Recurring billing and renewals | target | missing |  | no recurring billing |
| `PLAN-004` | Due-visit scheduling until done or declined | target | missing |  | no agreements |
| `PLAN-005` | Invoicing rules for recurring jobs | target | missing |  | no recurring jobs or recurring invoicing |
| `STOCK-001` | Van and warehouse stock | target | done | `src/glove/stock.ts`, `src/glove/commands/stock.ts`, `src/glove/commands/field.ts`, `src/ui/stock.tsx`, `tests/api/stock.test.mjs`, `tests/browser/journey.spec.ts` |  |
| `STOCK-002` | Purchase orders to suppliers | target | done | `src/glove/commands/purchasing.ts`, `src/glove/costing.ts`, `src/ui/purchasing.tsx`, `tests/api/purchasing.test.mjs` |  |
| `TEAM-001` | Custom roles and permissions | target | done | `src/glove/access.ts`, `src/glove/commands/setup.ts`, `src/ui/custom-roles.tsx`, `tests/api/security.test.mjs` |  |
| `TEAM-002` | Branches | target | done | `src/glove/branches.ts`, `src/glove/commands/branches.ts`, `src/ui/branches.tsx`, `tests/api/branches.test.mjs` |  |
| `TEAM-003` | Technician commissions and bonuses | target | missing |  | no commissions |
| `REPORT-001` | Owner dashboard | target | done | `src/glove/dashboard.ts`, `src/glove/api.ts`, `src/ui/today.tsx`, `tests/browser/journey.spec.ts`, `tests/api/security.test.mjs` |  |
| `REPORT-002` | Job, revenue, technician and lead reports | target | done | `src/glove/reports.ts`, `src/glove/api.ts`, `src/ui/reports.tsx`, `tests/api/reports.test.mjs` |  |
| `REPORT-003` | Receivables aging | target | done | `src/glove/receivables.ts`, `tests/api/reports.test.mjs`, `tests/browser/receivables.spec.ts` |  |
| `MOVE-001` | Move in from Jobber | target | missing |  | the only kit is ServiceM8 (`src/glove/movein/servicem8.ts`) |
| `MOVE-002` | Move in from Housecall Pro | target | missing |  | no Housecall Pro kit |
| `MOVE-003` | Move in from ServiceTitan | target | missing |  | no ServiceTitan kit |
| `MOVE-004` | Move in from FieldPulse and Workiz | target | missing |  | no FieldPulse or Workiz kit |
| `MOVE-005` | Open balances, agreements and equipment carried over | target | partial | `src/glove/movein/servicem8.ts`, `tests/api/movein.test.mjs` | the ServiceM8 kit brings customers, jobs, quotes, visits, materials and files; no balances, agreements, equipment or cutover checklist |
| `MOVE-006` | Saved cards and autopay carried over | target | missing |  | no saved payment methods or autopay; the ServiceM8 kit carries no payment data (`src/glove/movein/servicem8.ts`) |
| `API-001` | Documented HTTP API | target | done | `API.md`, `tests/api/flows.test.mjs` |  |
| `API-002` | Webhooks and integration tokens | target | partial | `src/glove/tokens.ts`, `src/glove/access.ts`, `src/ui/integration-tokens.tsx`, `tests/api/tokens.test.mjs`, `tests/api/security.test.mjs` | signed webhooks wait on the Base egress door with the resolved-address check (gr-base-285) |
| `API-003` | Zapier and Crank apps | target | missing |  | no published apps |
| `API-004` | CompanyCam photos | target | done | `src/glove/commands/companycam.ts`, `src/glove/companycam/client.ts`, `src/glove/companycam/uploads.ts`, `src/ui/companycam.tsx`, `tests/api/companycam.test.mjs`, `tests/browser/companycam.spec.ts` |  |
| `API-005` | Workflow rules | target | done | `src/glove/rules.ts`, `src/glove/api.ts`, `src/ui/rules.tsx`, `tests/api/rules.test.mjs` |  |
| `DATA-001` | Customer privacy requests and erasure | target | missing |  | no customer erasure |
| `DATA-002` | Every change, message and payment recorded | target | done | `src/glove/storage.ts`, `src/glove/timeline.ts`, `src/glove/activity.ts`, `src/ui/activity.tsx`, `tests/api/records.test.mjs`, `tests/api/segments.test.mjs`, `tests/api/push.test.mjs`, `tests/api/eligibility.test.mjs`, `tests/api/suggest.test.mjs`, `tests/api/companycam.test.mjs`, `tests/api/rules.test.mjs`, `tests/api/stock.test.mjs`, `tests/api/purchasing.test.mjs`, `tests/browser/companycam.spec.ts` |  |
| `DATA-003` | Hosted on the owner's own Cloudflare account | target | partial | `wrangler.jsonc`, `deploy.json` | Glove runs locally; no hosted deployment has been accepted |
| `DATA-004` | Free, open source and run on the owner's own computer | target | done | `LICENSE`, `tests/browser/run.mjs`, `tests/browser/journey.spec.ts` |  |
| `AGENT-001` | AI front office for calls and texts | push-further | missing |  | no telephony or answering agent |
| `AGENT-002` | Ready-to-dispatch check the day before | push-further | missing |  | no messaging, stock or readiness checks |
| `AGENT-003` | Rebook around delays | push-further | done | `src/glove/delays.ts`, `src/glove/commands/dispatch.ts`, `src/glove/commands/grants.ts`, `src/ui/dispatch-cards.tsx`, `tests/api/delays.test.mjs` |  |
| `AGENT-004` | Chase every invoice until paid and reconciled | push-further | partial | `src/glove/commands/invoices.ts`, `tests/api/flows.test.mjs` | an agent can prepare invoice drafts; no chasing, payments or reconciliation |
| `AGENT-005` | Quote writer from the request | push-further | done | `src/glove/commands/suggest.ts`, `src/ui/quotes.tsx`, `tests/api/suggest.test.mjs` |  |
| `AGENT-006` | Repeat-callback diagnosis | push-further | done | `src/glove/callbacks.ts`, `src/glove/commands/callbacks.ts`, `src/glove/provider.ts`, `src/ui/nameplates.tsx`, `tests/api/callbacks.test.mjs` |  |
| `AGENT-007` | Keep every maintenance agreement fulfilled | push-further | missing |  | no agreements |
| `AGENT-008` | Morning brief and margin watch | push-further | done | `src/glove/morning-brief.ts`, `tests/api/morning-brief.test.mjs`, `tests/browser/morning-brief.spec.ts` |  |
| `AGENT-009` | Agent policy and autonomy grants | push-further | done | `src/glove/commands/grants.ts`, `src/glove/api.ts`, `src/ui/agent-grants.tsx`, `tests/api/grants.test.mjs`, `tests/api/security.test.mjs` |  |
