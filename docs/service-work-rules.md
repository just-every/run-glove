The contract owns acceptance text and status. This guide records field formats, calculations, provider shapes and custody details; historical test receipts belong in the changelog.

## GLOVE-01 operating rules

The owner records the business (name, tax identifier, booking time zone, payment terms), a price book of services with prices before tax and their job checklists (items marked required or not), and the technicians; invites people and gives each one role; links a technician to the person who signs in.  US identifiers and US sales tax are `MONEY-001` and `MONEY-002`.

## GLOVE-02 operating rules

The desk records customers (contact, email, billing address) and the sites where work happens, with access notes. Edits apply only to the version the person saw.

## GLOVE-03 operating rules

A request becomes a quote of priced lines (from the price book or custom) with tax computed exactly. A person approves one exact revision's price. Any price change is a new revision that needs its own approval; earlier revisions and approvals stay on the record.

## GLOVE-04 operating rules

A person records how the approved quote went out (email, printed, in person, phone) without any delivery claim, and records the customer's acceptance or decline of the current revision: who answered, how (signed, email reply, phone, in person) and who recorded it. An accepted quote is frozen. The customer-link door in `QUOTE-002` shares the first-decision-wins revision freeze; online signing remains gated on the owner’s accepted consent disclosure.

## GLOVE-05 operating rules

An accepted quote becomes one job carrying the accepted lines and the checklist from its services. The dispatcher books visits for a technician at local times in the business time zone. A booking that overlaps another visit for that technician is refused until the dispatcher reviews those exact conflicts and confirms.

## GLOVE-06 operating rules

On a phone, the assigned technician records arrival, checklist results (done, or not applicable with a reason), notes, photos and materials. Each item is kept on the phone with its capture time until the server confirms it; resending after a lost signal lands it exactly once. Photos are stored as received and readable only by people allowed to see that job.

## GLOVE-07 operating rules

The dispatcher changes a visit's technician, date or time with a reason. The change is refused if the visit changed since they opened it, and must be reviewed when it overlaps another visit or the technician has already recorded evidence on it. Evidence that arrives from a technician after the visit moved on is kept, flagged on the visit, and reviewed by the dispatcher. Every change keeps its before and after on the record. A new technician records their own arrival; the earlier arrival stays as evidence.

## GLOVE-08 operating rules

The technician completes a visit only after recording their arrival, and completes the job only when every required checklist item is done or not applicable with a reason. Completion carries a work summary and either the customer's name and drawn signature or why the customer could not sign.

## GLOVE-09 operating rules

For a completed job, the office prepares an invoice from the accepted lines plus the recorded materials priced from the price book (unpriced materials must be priced explicitly), approves one exact revision, and exports every approved revision once in a CSV in Xero's sales-invoice import columns. An exported invoice is never changed: a correction is a new revision that names the revision and export it corrects, is approved, and exports as its own numbered row. Sending, payment and live sync are `PAY-001` and `LEDGER-*`.

## GLOVE-10 operating rules

An agent prepares quote drafts, dispatch proposals (job, technician, time, rationale, evidence) and invoice drafts through the same public commands. Quote preparation and reversible dispatch or invoice drafting carry standard; binding quote or invoice decisions carry commitment, customer disclosures carry external and collection carries money. The company’s policy decides those calls. After a person decides an agent-prepared action, the record identifies that person’s decision and the agent’s preparation separately.

## GLOVE-11 operating rules

The owner previews a move-in from the first source system's API lists (clients and contacts, staff, jobs, activities, materials, attachments): what each source record becomes, what is merged, rejected (with the reason and location) or not used, and which attachment files are missing. Committing applies exactly the reviewed preview through Base's import kit journal, keeping every source ID and the exact received files. An unchanged repeat writes nothing; undo removes exactly what the move-in wrote, and refuses while later Glove work refers to it or a moved-in record was edited since. Every other move-in kit (`MOVE-*`) follows this clause.

## GLOVE-12 operating rules

Every job shows its timeline: each step, who did it in which role, with which command. The owner or office downloads the business as JSON. `rer export` and `rer import` move the complete installation (records, timeline, photos and signatures, command outcomes, move-in journal and originals) into a fresh checkout, which keeps working; a session from the old installation does not open it.

## HTTP-001 operating rules

Hono serves `/health` and owns `/api` and `/api/*`; Start serves documents; unknown routes return 404.

## MONEY-001 operating rules

A US installation prices in USD. The owner sets sales-tax rates by jurisdiction (state, county, city and special district combined), and each site's address selects its rate; each price-book item is taxable or not, so a state that taxes parts but not labor is expressible; a customer can be tax-exempt with a private PDF/JPEG/PNG exemption certificate (up to 10 MB), its number and expiry on file; quotes and invoices show tax per jurisdiction. Optional Avalara AvaTax or Stripe Tax rate lookup proposes a combined rate and service treatment by address for the owner to review and apply; Glove calculates and records tax, it does not file returns; discounts reduce the taxable amount in the order `QUOTE-007` states. The `REPORT-002` sales-tax report then splits tax by these jurisdictions.

For branches (TEAM-002), each branch keeps its own US tax settings; the quote and invoice use the job’s branch jurisdiction, and the REPORT-002 sales-tax report includes branch and jurisdiction rows with a branch filter before this capability ships.

new installations default to USD and unsaved booking zones to America/Chicago; an existing business retains its saved currency, tax and time zone.

A jurisdiction is the owner's named combined rate, decimal percent to four places, with ZIP matches and an optional default.

A site can choose explicitly; overlapping ZIP matches require that choice, and an unmatched configured address without a default is refused.

Branch settings override business settings.

FREE items are not taxed; TAXABLE items (and legacy GST codes) follow the jurisdiction, whose service-labor switch applies to service items.

Quantities are thousandths, line multiplication and tax use integer arithmetic, rounding half up per line and once on the document's combined taxable cents.

The revision freezes currency, jurisdiction, rate, labor classification and exemption evidence; accepting options/add-ons and preparing/correcting the invoice retains that snapshot.

Certificate evidence is private to the customer's full desk readers, including branch limits, stored in original chunks, archived with the customer and retained when replaced; exemption expiry is inclusive in the branch's local date.

Any physical customer removal deletes its originals and chunks; DATA-001 carries the customer erasure door and restore-fence assertion before shipping.

US exports keep approved jurisdiction, rate, taxable basis, tax and total; legacy AUD exports retain Xero columns.

Tax reports use each invoice's first approval local date (inclusive period bounds), grouping the latest approved tax snapshot by branch and jurisdiction.

Before payments ship, the report honestly says tax on approved invoices; PAY-002 carries collected tax.

The mapped QuickBooks JSON is an inspection document only; LEDGER-001/004 carry live posting, matching and provider assertions.

QUOTE-007 carries discount allocation through this same tax calculation before discounts ship.

Stripe lookup sends only service address and two fixed sample classifications, never identity or certificates; the owner selects the service classification, reviews the response and applies settings.

Unsupported, partial or unregistered treatment is unavailable for automatic application, never inferred as zero tax or exemption.

Every new lookup/certificate event appears in Activity and business export without credentials.

The Avalara AvaTax lookup follows the same rules as Stripe (ct WORDING AUDIT 24, 19 October 2026): the owner alone connects it, and the account ID, license key, company code and production/sandbox choice are one sealed secret excluded from state, archives and export.

A lookup creates one uncommitted AvaTax `SalesOrder` (never recorded in AvaTax) at the service address with the fixed customer code `glove-address-rate-lookup` and two $100 sample lines: `P0000000` general tangible goods and the AvaTax tax code the owner enters for the service.

It is a proposal only when every parts jurisdiction is fully taxable and their rates, summed in millionths and shown as a percent to four places, exceed zero, and the service is either fully taxable at that same combined rate (labor taxed) or wholly non-taxable (labor exempt); no nexus, zero, mixed, partial, exempt or refused answers read "rate unavailable", never 0%.

The owner applies a proposal through the ordinary jurisdiction settings.

## MONEY-002 operating rules

The business records its legal name, DBA, EIN, state contractor license numbers (by trade and state), insurance details and logo; quotes, invoices, service reports and agreements print the license numbers and terms a state requires, US address and phone formats, and US date formats. Customers record a billing and service address separately and a business customer's tax ID.

the business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first release), up to 20 contractor licenses (trade, two-letter state, number), insurance (carrier, policy number, expiry date) and a logo image in its own format (PNG, JPEG or WebP, at most 1.5 MB), each kept when a save leaves it out; every signed-in role can open the logo.

Customers keep a billing address apart from each site's service address, and a business customer's tax ID; the customer export carries both addresses in their own columns.

Printing these on quotes, invoices, service reports and agreements, with US address, phone and date formats, is `QUOTE-005`'s.

## MONEY-003 operating rules

Every service and material carries a unit cost, a price and an optional markup rule by category, supplier part numbers, images and a description customers see; flat-rate task pricing (one price for the task, labor and parts inside) sits beside time-and-materials; the owner bulk-imports and exports the price book by CSV and updates prices in bulk by percentage.

an item is a service, a material or a flat-rate task.

Its price is fixed, or follows its category's markup: unit cost × (100 + markup) / 100, rounded half up to the cent, recomputed whenever the cost or the markup changes.

A task's cost is the sum of its contents' costs at their quantities (each rounded half up to the cent); its contents are services and materials, never other tasks.

A bulk change multiplies each fixed price in one category by (100 + percent) / 100, rounded half up to the cent; markup prices follow cost instead.

A price-book quote line keeps the item's unit cost when it was priced.

Costs are margin figures: technicians never read them, and a custom role reads them only with `reports.read`.

The price-book CSV matches rows by Code (new, updated with the fields that change, unchanged, or rejected with its reason), is committed only as the exact preview, keeps checklists, skills and images, and ignores a markup row's Price; re-importing the export changes nothing.

The customer-facing description is stored on the item; the doors that show customers documents (`QUOTE-002`, `QUOTE-005`, `COMM-006`) print it when they ship.

## CUST-001 operating rules

A customer has several contacts and properties; each property's history shows every record kind Glove keeps: requests, quotes, jobs, visits, photos, checklist forms, notes, materials, refrigerant, completion, invoices and equipment ever recorded there, newest first. Payments (PAY-*), agreements (PLAN-*) and messages (COMM-*) join the property history as standing obligations of their own clauses; each such clause must add its entries to the property history before it ships. Search across customers covers name, phone, email and address; a business customer keeps a billing contact and an accounts-payable email apart from the site contact, and can require a purchase-order number on its invoices. The PO requirement is enforced at invoice approval and the PO travels in the invoice CSV Reference.

## CUST-002 operating rules

Each property lists installed equipment (type, make, model, serial, install date, refrigerant, location in the building, photos) with manufacturer and labor warranty dates; technicians add or update equipment from the phone; every job and form links to the equipment it touched; expiring warranties appear on the property and in reports.

## CUST-003 operating rules

The owner imports customers, contacts and properties from a CSV (any column order, mapped once and remembered), sees a preview of new, matched and rejected rows with reasons, and commits through the import kit journal with undo; the same records export as CSV at any time.

rows sharing a Customer ID, or without one carrying identical customer details, are one customer, each row adding one site and one other contact.

A row is *matched* when its Customer ID is a Glove customer's ID or it repeats a customer an earlier CSV import created; Glove keeps a matched customer's details and contacts as they are, lists which file values differ, and adds only the site addresses it lacks.

A row is *rejected*, with its spreadsheet row number and reason, when a field fails the rule `customer.save` or `site.save` applies, it has more cells than the header, it repeats an earlier row exactly, or its details differ from the first row with the same Customer ID; every other row is *new*.

Without a chosen mapping Glove uses the last committed CSV's mapping when every column it names is in the file, else columns headed like Glove's own export.

The export writes every live (unmerged) customer, one row per site or other contact, and puts a `'` before a cell a spreadsheet would run as a formula (import takes exactly one off), so re-importing it matches every row and writes nothing.

## CUST-004 operating rules

The owner adds custom fields to customers, properties, jobs and equipment, tags customers (for example "commercial", "VIP", "do not service"), and saves segments (customers with equipment older than ten years and no agreement); a segment can be exported or pushed to Mango or Mailchimp as an audience. Glove does not send marketing campaigns; Mango or Mailchimp sends them. A tag is also a condition of a workflow rule (`API-005`).

the owner defines custom fields on customers, sites, jobs or equipment (text, number, date, yes/no, or a choice of 2–20 values); a field keeps its record and type.

The owner, dispatchers and the office set field values and a customer's tags (up to 20, each up to 40 characters, kept once whatever the case) and save segments.

A technician sees the values on the sites, jobs and equipment of visits assigned to them, never a customer's tags or customer fields.

A segment's members are the live customers (never merged-away ones) that have all of its "has" tags and none of its "has none" tags (compared without case), meet every field condition (is, over, under, set, unset; a site field holds when any of the customer's sites meets it) and, when set, have equipment at one of their sites installed at least N years before today's local date. "No agreement" holds for every customer until agreements exist; `PLAN-002` carries it in its text and acceptance.

The members list reads for the desk; the members CSV (name, email, phone, tags, customer fields) for the owner and office, like the customer CSV.

The owner connects Mango (its integration address and a contacts:write credential) or Mailchimp (an API key and audience ID); the key is kept as a secret, never in records, exports, logs or the archive.

The owner and office push a segment: Glove holds no marketing consent, so a push never subscribes anyone: Mango receives each member with an email (email, name, tags, the segment as its list, without `subscribe`), Mailchimp adds new members as transactional and tags them with the segment and their tags; members without an email or tagged "do not contact" are skipped and counted (customers who opted out are excluded with `COMM-002`'s consent record, which carries it in its text and acceptance), and each push is recorded with its counts and the provider's refusals.

A tag is a condition of a workflow rule (`API-005`).

## CUST-005 operating rules

Glove flags customers that share a phone number, email or normalized address, on entry, on CSV import and on move-in, and offers a merge review: what each record holds, which values win, and what moves (properties, jobs, invoices, messages); a merge is one journaled change that can be undone.

## BOOK-001 operating rules

An embeddable request form (a script tag or link for Pane, WordPress, Squarespace or any site) takes the service wanted, address, contact, photos and preferred times; Cloudflare Turnstile blocks spam; the request lands in the queue with its source, creates or matches the customer, and the office is notified. The request's photos join `AGENT-005`'s quote-drafting evidence only under the ct-approved photo rules below.

a signed-in owner without branch limits explicitly configures Turnstile and enables website requests.

The public `/request` page can be linked or embedded with `/glove-request.js`; additional direct-post origins must be explicitly listed.

The installation-private Turnstile key is excluded from state, exports and archives and must be reconnected after restore.

Siteverify receives only its key and challenge token; success must match this form’s action and browser hostname within the token’s validity.

Failed, uncertain or mismatched verification writes no customer, site, request, file, notice or command result.

Verified consented requests carry service, contact, service address, preferred times and up to two original images.

An exact unique phone or email match reuses the live customer without changing its stored identity; ambiguity refuses without exposing candidates.

New customer/site/request records, private originals and an owner/office in-app notice commit together under the configuring owner’s still-current role, branch and exact configuration.

The anonymous response is only an opaque receipt, and replay cannot duplicate the request.

A request never books or sends a reply.

The desk reads the source, preferred times and photos in the request pipeline; field and public file doors cannot read these originals.

DATA-001 export/erase includes the contact, request and original bytes.

AGENT-005’s approved text evidence stays unchanged; the separate photo authorization below controls when sanitized model copies may be added.

the switch is off by default and only a signed-in owner without branch limits may change it.

Each request requires the sender’s separate explicit consent naming that its photos go to the configured model provider.

Only the photos are added to model calls, never contact, address or customer identity; EXIF and location metadata are stripped from the sent copy.

The provider is barred from training on the photos.

Withdrawal excludes the photos from later calls.

Originals remain private to the office.

Office-contact consent never authorizes model sharing.

the signed-in unscoped owner may enable `modelPhotosEnabled` in `intake.configure` only with a configured provider, its sender-facing name and explicit affirmation of the entered account-specific terms prohibiting training.

The setting starts off; each save creates a new disclosure, and reconnecting or changing the provider invalidates earlier permission.

The public form offers a separate unchecked optional consent naming that provider and its actual hostname; it binds that request’s exact photos to the disclosure text, time and recipient.

Declining still submits the request to the office.

Old or mismatched disclosure refuses the whole submission without persistence.

`quote.suggest` adds only transient image data, never filenames, captions, file references, contact, address or customer identity fields.

JPEG metadata across scans, PNG ancillary metadata and WebP metadata are removed server-side; malformed or animated copies refuse instead of transmitting originals.

Office originals remain unchanged behind the existing private file door.

Immediately before each photo attempt, one D1 authorization batch checks the caller, exact business/request versions and configuring owner’s active unscoped authority, then records the disclosure and derivative hashes in Activity/export.

Photo attempts cannot follow provider redirects and retain store-off.

A switch/provider/role change or recorded withdrawal wins before later authorization; an already authorized in-flight call cannot be recalled from a provider.

`intake.withdrawPhotos` requires the unscoped owner to affirm the sender requested withdrawal and record how; later calls exclude those photos while originals stay private until DATA-001 erasure.

Under RL-101, qualification requires the unscoped owner’s recorded account-specific no-training agreement and explicit affirmation; store-off alone is insufficient.

Missing or changed applicable terms hold photo sharing.

The owner records a sender-requested withdrawal and its reason; it excludes every later model attempt while private originals remain subject to erasure.

The record is an attestation and agreement reference, never provider verification or a legal determination.

## BOOK-002 operating rules

A customer chooses a service and sees arrival windows computed from real technician capacity: skills, service area, working hours, time off, existing visits and travel; the owner decides per service whether a booking is confirmed instantly or waits for approval, and whether a deposit is taken (`QUOTE-003`); the booked visit is assigned under `DISP-006` and confirmed under `COMM-003`. The owner sets per service a cancellation window, a late-cancellation fee and a no-show fee. The booking page states the policy before the customer confirms, and where a deposit or fee applies the customer saves a card with the `PAY-008` consent that names the fee. A customer canceling (from the confirmation link or the hub, `COMM-006`) inside the window, or a visit the dispatcher marks as a no-show, puts the fee on the visit as a proposal the office charges to the saved card under `PAY-009` or waives with a reason; a cancellation outside the window charges nothing and refunds any deposit under `PAY-004`. Visits booked by the AI front office (`AGENT-001`) carry the same policy, read out on the call or texted with the confirmation.

`booking.offer` is an explicit signed-in unscoped Owner command for an existing open, single-service call without an agreement or live visit.

The Owner selects the service and offers 1 to 10 future planned times with arrival windows; this is not customer service selection or generated-window booking.

A cryptographically random bearer is shown once, stored as a hash, expires 14 days after issuance, is explicitly revocable, and permits at most one successfully committed booking.

Possession grants only this offer’s read and choice operations; it does not verify customer identity, property authority, a signature or payment consent.

Reads disclose only the business name, offered service, this site address, expiry, and currently available offered dates, planned times, time zone and arrival windows.

They disclose no customer account, contact or access notes, prices, technician identifiers, competing work or other records.

The holder may submit only an offered slot identifier, not choose another customer, site, service, technician or arbitrary time, or override conflicts.

Current issuer authority and eligibility are rechecked on use; expired, revoked, used or currently unauthorized links refuse access.

DISP-006 recomputes eligible automatic assignment at booking, retains the arrival window and records the assignment reason; availability displayed earlier reserves no capacity.

A successful service booking creates an internal desk confirmation task only.

It does not itself establish an outbound send, provider acceptance, delivery, arrival or completion.

The Owner shares this service link outside Glove; this extension adds no automatic customer send.

Deposits, payments, saved-card consent, fees, cancellation and rescheduling are unavailable through this bearer.

These approved defaults do not narrow the full BOOK-002 target or acceptance, amend PLAN-004’s existing authority, or resolve pending payment or communication rulings.

Implemented capacity slice, 27 October 2026: The existing signed-in unscoped Owner may supply a single date, a same-day range, duration and step to generate at most ten chronological service-booking windows.

Each candidate uses the existing live automatic-assignment eligibility door: service skills, area, working hours, time off, calendar busy time and existing visits.

Generated windows remain restricted to the existing service call and bearer authority; reads and choices recheck current capacity.

Each arrival window spans its planned visit.

Generation grants no customer catalogue, priority, payment, sending or cancellation authority.

Travel currently participates only in existing DISP-006 assignment ranking, not a proved travel-feasibility boundary.

## BOOK-003 operating rules

Every request carries its source (website, Google, phone, text, Angi, Thumbtack, Yelp, referral, repeat customer, marketing campaign) and moves through a pipeline (new, contacted, quoted, won, lost with a reason); the office sees an aging pipeline board, and reports show conversion and revenue by source.

## BOOK-004 operating rules

Glove connects Google Local Services Ads and Reserve with Google, Angi, Thumbtack and Yelp lead feeds (each by the provider's own API or webhook, under the provider's eligibility rules), lands each lead as a request with its source and cost, matches existing customers, and replies within the provider's response window through `COMM-002` or the provider's message channel. Applying a lead's cost is also a workflow rule action (`API-005`).

only the owner connects a lead source (`lead.connect`), with how many minutes the business has to acknowledge its leads (5 to 1,440, default 60) and the acknowledgment text.

Angi and Thumbtack post each lead (Thumbtack's Partner API v4 `NegotiationCreatedV4` body; Angi's CRM lead delivery) to `POST /api/glove/leads/<angi|thumbtack>`, and Yelp posts a notice naming new leads to `POST /api/glove/leads/yelp`, which Glove reads from Yelp's Leads API with the owner's key; Google Local Services has no push, so Glove reads the last week's leads from the Google Ads API (`local_services_lead`) with the owner's OAuth credentials and developer token on every scheduled run (every 15 minutes) and when the desk chooses **Read new leads** (`lead.pull`), and a failed scheduled read is a provider fact in Activity.

Google reads every response page with the same query and the provider's next-page token; repeated tokens, malformed rows or a failed later page refuse that entire read before requests are written.

Scheduled and desk retries retain one request per provider lead ID.

The posting doors authenticate before reading the body, as `COMM-001`'s unsigned callbacks do: HTTPS Basic user `glove` with a per-source password of 32 random bytes shown only in the connecting owner's response and kept as its SHA-256 hash (compared in constant time; reconnecting replaces it at once); every credential or form failure answers the same 401 body, writes nothing, and after 20 rejections from one address in a minute 429; a lead older than 7 days is refused, and a lead already landed (by provider and provider lead ID) lands nothing again.

Basic door passwords are stored only as SHA-256 hashes; provider keys are installation-local values in `glove_provider_keys`, with no sealed or encrypted storage claim.

Both stay out of records, Activity, command outcomes, the export and the archive.

A lead becomes a request with its provider as source and its provider lead ID, for the one existing customer whose phone (last ten digits) or email equals the lead's, else for a new customer (and site, when the lead names an address) that `CUST-005` flags if it resembles another.

A cost the provider reports (Thumbtack's `leadPrice`) is the request's lead cost; a workflow rule on `enquiry.created` with the action `leadCost` (`API-005`) applies its amount to a request from its source that has no cost yet (a provider-reported cost is kept and the run says so), and the owner or office sets or corrects a cost (`enquiry.cost`).

Each lead's acknowledgment is queued with its text and due time (received + the source's minutes) on the request; it is never sent automatically: the desk records it sent outside Glove (`enquiry.acknowledged`), noting when that was after the window.

The `sent` state is that person’s external-send attestation, not provider-confirmed delivery or proof of meeting the provider’s response window.

The 60-minute default and 5–1,440-minute range are product choices.

Under ct's approval on 24 October 2026 at 05:58Z, only an unscoped owner acting as a person explicitly approves each Yelp acknowledgment (`enquiry.reply`, `confirm: true`).

It uses the unexpired masked reply address from that lead, never a subsequently edited customer address, through the connected customer email provider.

The command commits one message before sending, and replay or a second command never resends that acknowledgment.

Provider mail acceptance or delivery is shown from the existing mail receipts; neither confirms receipt in the Yelp conversation or meeting Yelp's response window.

No acknowledgment is sent automatically.

Reserve with Google records use the documented REST `Booking` shape at `POST /api/glove/leads/reserve-google`, under the same per-source Basic password gate.

An owner-connected integration relays a record; this is request intake, not a Google booking server or an inbound Google `BookingNotification` webhook (that API sends updates to Google).

The source booking ID, merchant and service IDs, slot time and duration and source status remain on the request, without scheduling a visit or sending a reply.

A booking price is not a lead cost; no cost is invented.

Only confirmed or pending-merchant-confirmation source records are admitted; updates and cancellations are unsupported.

The first record for a booking ID wins, including concurrent retries.

The slot start is not a creation timestamp; the acknowledgment due time starts at Glove receipt.

No live integration is claimed; see [lead source formats](docs/lead-sources.md).

## BOOK-005 operating rules

The dispatcher or office creates a job straight from a request, a call or the customer record with zero or more lines (for example a diagnostic or trip fee from the price book), books its visit under `GLOVE-05`'s conflict review with an arrival window (`DISP-006`), and the customer gets the confirmation of `COMM-003`. On site the technician adds flat-rate or time-and-materials lines from the price book (with prices where the owner allows under `QUOTE-006`, otherwise priced by the office), and the customer's approval of the added work is recorded on the phone; the fee, the added lines and the recorded materials flow to the invoice draft under `GLOVE-09`. A job made without a quote says so on its timeline, and none of its prices counts as approved until its invoice revision is approved.

the dispatcher, the office or the owner makes a service call (`job.create` without a quote) from a request (which is then won) or from the customer record, at one of that customer's sites, with zero or more lines from the price book or custom; its checklist and forms come from those lines as for a quoted job.

Its timeline says it was made without a quote, its screen shows no accepted price, and its booking, field capture and completion are any job's.

On site the assigned technician adds work only on a service call (on a quoted job that is a change order, `QUOTE-006`): a price-book item other than a material, a quantity, and the customer's approval (their name, and signed on the phone or told in person), queued through the phone's outbox; the technician sees no prices.

The invoice draft carries the job's lines, then the added work and the recorded price-book materials at today's price-book prices, so the office prices them by preparing, revising and approving the invoice under `GLOVE-09`; until that approval none of the job's prices counts as approved.

A service call's arrival window comes with `DISP-006`, the customer's confirmation with `COMM-003`, and technicians pricing their own added work where the owner allows with `QUOTE-006`.

The office makes service calls only: a job from an accepted quote stays the dispatcher's or the owner's (`GLOVE-05`).

## BOOK-006 operating rules

A request can carry a scheduled assessment (an on-site estimate): the technician or salesperson, date, time, arrival window and instructions. It sits on the dispatch board and the assessor's phone like any visit, blocks that calendar time (`GLOVE-07` conflict review applies), sends the customer's confirmation and reminders (`COMM-003`), and lets the assessor record notes, photos, measurements and a custom form (`FIELD-002`) before any quote exists. Completing the assessment turns the request into a quote draft carrying those notes, photos and form results, or into a field quote under `QUOTE-006`; the assessment, the request and the quote stay linked on the customer and property history (`CUST-001`).

the dispatcher or owner books an assessment on an open request (`assessment.book`): the technician, local date, start and end, instructions and up to 10 of the owner's forms (`FIELD-002`); one open assessment per request.

It is a job of kind assessment with no lines or price, linked to the request, whose visit is booked under `GLOVE-05`'s conflict review, so it sits on the board and the assessor's phone and blocks that time like any visit, and takes the same field capture (arrival, notes, photos, forms, through the outbox).

Completing its visit marks it assessed (never "completed, not invoiced" and never invoiced).

A quote drafted from that request carries the assessment's notes, photos and form results and its link; the request names its assessment; the assessment, the request and the quote show on the property history (`CUST-001`).

The arrival window comes with `DISP-006`, the customer's confirmation and reminders with `COMM-003`, and turning it into a field quote on the phone with `QUOTE-006`, each carrying it in its text and acceptance.

## QUOTE-001 operating rules

A quote holds up to five options, each its own set of lines and total, plus optional add-ons the customer can tick; the customer chooses one option and any add-ons, and the job carries exactly the chosen lines. Each option's price is approved under `GLOVE-03`. The owner keeps reusable quote templates beside the price book (`MONEY-003`): named bundles of options, add-ons, lines from the price book, notes and terms. A quote started from a template takes the current price-book prices unless the template fixes a price, and editing a template never changes a quote already made from it.

a revision holds one to five options (each its own lines and total, tax computed per option) and up to ten named add-ons.

Approving a revision approves every option's and add-on's price under `GLOVE-03`; a changed price is a new revision.

The customer's answer records their choice — exactly one option and any of the add-ons — by the person taking it under `GLOVE-04` (online under `QUOTE-002`); a revision with more than one option or any add-on cannot be accepted without a choice.

The accepted lines are the chosen option's followed by the chosen add-ons', with tax computed once on that document, and the job carries exactly those lines and that total; booked-today and won-value figures (`REPORT-001`, `BOOK-003`) count the chosen total.

The owner saves named templates of options, add-ons, notes and terms; a price-book line in a template follows the price book unless the template fixes its price, and a custom line always fixes it.

A quote started from a template copies it at today's prices and records which template it came from; editing a template never changes a quote already made from it.

## QUOTE-002 operating rules

The customer opens the quote from a link, reads its terms and each line with the customer-facing description its price-book item carries (`MONEY-003`), chooses one option and any add-ons (`QUOTE-001`), requests changes or approves with a drawn or typed signature; Glove records the signer, time, IP address, the exact revision and the ESIGN/UETA consent text they accepted, and freezes the quote under `GLOVE-04`. Every quote carries a validity date (an owner default per business, editable per quote and printed on the quote); after that date the link shows the quote as expired, refuses approval and offers "ask for an updated quote", which notifies the office and reopens the request for a new revision with its own validity date.

a bearer delegates read, option choice, change request, decline, update request and signed approval for one price-approved revision.

Only a signed-in person issues it; one live link per revision, and reissue revokes the previous one.

The token is shown once, hashed separately at rest, sent in the URL fragment and Authorization header only, and absent from queries, logs, saved command outcomes, Activity, business exports and installation archives.

The page reveals only that revision and its service site.

A forwarded link can be used; name and capacity are CLAIMED, never verified, with authentication basis recorded as a link sent by Glove to the address on record or handed out by staff to an unverified recipient.

A decision rechecks the issuer's live role and branch; job creation rechecks price approval.

One decision per revision wins between staff and online and freezes it; replay changes nothing.

Requesting changes keeps the link live.

An older revision's link shows only “a newer revision was sent” and refuses decisions.

An expired quote remains readable and offers an update request once per revision until the link expires 90 days after validity.

Restore retains records and document hashes but requires new links; erasure follows DATA-001.

The final signing capability must record an affirmed versioned consent disclosure and its hash, revision document hash, drawn or typed signature, signer and claimed capacity, authentication basis, link ID, time, IP address and browser, then freeze the signed copy and its hash and send a confirmation copy to the on-record email when COMM-001 is connected.

The signing flow follows BASE-ACCESSIBILITY-001 and always offers a typed signature.

Production signing waits for the owner's accepted concrete consent disclosure; no ESIGN, UETA or eIDAS validity is claimed.

`quote.validity {days}` is owner-only, 1–3650 calendar days, default 30 for new revisions.

Drafts and revisions take an optional real `validUntil` date; validity includes that date in the frozen branch/business zone, and the link expires at local midnight starting the day after validity plus 90 calendar days.

Defaults change later revisions only.

Legacy revisions without validity must be revised and price-approved before a link can be issued.

`quote.link {quoteId, version, email?}` and `quote.linkRevoke {linkId, version}` require a signed-in person allowed to record that quote as sent, never an integration token.

A link freezes a customer-only document and canonical SHA-256, with price-book customer descriptions captured when priced; costs, internal evidence and unrelated customer details are excluded.

The desk shares it outside Glove, labelled recipient unverified, or queues it to the customer's on-record address through COMM-001 with the actual provider outcome.

A customer response records “link sent by Glove to the address on record” only once a provider fact confirms the provider took the email; a refused or unconfirmed send retains the staff-handed, recipient-unverified basis.

`GET/POST /api/glove/public/quote` reads only that revision; same-origin JSON responses can request changes, decline with a claimed name and capacity, or request an update once per revision.

Changes and updates enter the office queue, Activity, property history, COMM-007 stream and business export; an update reopens the originating request as contacted.

A decline competes atomically with staff decisions and makes the revision read-only.

Issuer role removal, branch restriction, revocation and expiry are enforced again in the commit batch.

A signed-in unscoped owner uses `quote.consent` to enter and explicitly accept concrete disclosure; no default text or environment bypass is supplied.

Each accepted disclosure has a numbered version, hash and owner/time history; changing it or disabling signing refuses signatures prepared under the old disclosure.

The customer reviews a server-hashed chosen document, affirms that disclosure and signs with bounded drawn strokes or a typed signature.

Approval uses the ordinary exact chosen option/add-on calculation and first-decision freeze.

The winning record contains claimed name/capacity, authentication basis, link ID, time, IP (or explicit unavailable), browser, signature, disclosure version/text/hash and both revision/chosen document hashes.

The immutable self-contained HTML copy embeds its original images and signature and is stored with a verified SHA-256; desk and live customer-link doors return those same bytes.

A connected COMM-001 provider receives the winning HTML and text confirmation once after commit to the on-record email; actual provider outcomes remain separate from signing.

A refused confirmation does not undo the signature or claim delivery.

Reissue for an accepted/declined quote is read-only and preserves the frozen revision.

DATA-001 removes signed-copy chunks and signature evidence; rer export/import preserves their exact bytes while excluding bearer credentials.

Typed signing is always available by keyboard at 390 px, disclosure text and consent controls retain labels/focus, and the signing page reflows without sideways scroll.

No verified-identity or ESIGN/UETA/eIDAS validity claim is made.

## QUOTE-003 operating rules

QUOTE-002 inheritance: charge only against the winning frozen revision and chosen total; the signing/consent gate and price approval still apply.
The owner sets a deposit per quote or per service (an amount or a percentage); approval online takes the deposit by card or ACH through `PAY-002`, the deposit is held against the job and applied to its invoice, and a refund of a deposit follows `PAY-004`.

only the signed-in unscoped owner sets `service.deposit` for future quote revisions or `quote.deposit` on an unapproved draft: an amount or a percentage above zero and at most 100, with half-up cent rounding against the eventual chosen total.

The rule is frozen in the linked revision, chosen-document hash and signed copy; approved/accepted revisions cannot change it.

After the winning current price-approved revision is signed under QUOTE-002 and its exact job exists, that owner alone can prepare test card/ACH Checkout (`payment.depositCheckout`).

Customer quote bearers cannot invoke a payment door or initiate a charge.

A confirmed deposit stays on that job; invoice preparation links it and any prior original-method refund to the final invoice once, and only net confirmed funds reduce the balance.

Pending ACH remains pending.

Original-method refunds use PAY-004, including before invoice preparation.

No public customer Checkout or automatic charge on signing is enabled.

## QUOTE-004 operating rules

QUOTE-002 inheritance: stop on the winning staff or customer-link decision and the frozen validity date; an update request notifies the office and needs a newly approved revision.
The owner sets a follow-up sequence (for example day 2 text, day 5 email, day 10 call task); Glove sends it through `COMM-001`/`COMM-002` for every unanswered quote, stops the moment the customer answers, the quote is closed or it reaches its validity date (`QUOTE-002`), and shows which step each open quote is on.

## QUOTE-005 operating rules

Quotes, invoices, service reports and agreements render as branded pages and PDFs with the business identity of `MONEY-002` (logo, legal name and DBA, EIN, the license numbers and insurance a state requires, US address, phone and date formats), terms, photos, and each line's image and the customer-facing description its price-book item carries (`MONEY-003`), from templates the owner edits.

the signed-in owner edits plain-text heading, terms and footer per document kind, and explicitly attaches customer-facing photos.

Issuing a quote link freezes the business identity, template, line descriptions/images and attachments in its hashed customer document; completing a report freezes the same identity/template with every report field.

Later edits never change those snapshots.

Invoices and agreements use their current desk-authorized projection and current template; invoice lines retain the approved job’s customer descriptions/images.

Existing role, branch, revision and original-file guards apply.

Dates use US calendar presentation and ten-digit phones use US punctuation; saved legacy addresses and time zones remain as recorded.

Print / Save PDF invokes the browser’s print renderer after removing a bearer fragment, restores the link after printing, includes the whole document and hides response controls.

No signing, send or delivery claim is added; QUOTE-002/006 retain their owner-disclosure gate and COMM-006 inherits the same document and original-file restrictions.

## QUOTE-006 operating rules

QUOTE-002 inheritance: field signatures retain claimed signer/capacity, versioned affirmed consent and document hashes, first-decision-wins freeze and the owner disclosure gate; no verified-identity or legal-validity claim.
A technician the owner allows builds a quote or a change order on the phone from the price book, including options, and prices the work they add on a `BOOK-005` service call, with or without signal; the customer signs on the phone; the change order adds its lines to the job and invoice; offline drafts send exactly once on reconnect under `GLOVE-06`. Prices outside the owner's allowed range wait for desk approval. A technician's close rate in the `REPORT-002` technician report is their field quotes accepted ÷ answered. A completed `BOOK-006` assessment can become a field quote on the phone, carrying its notes, photos and form results.

the unscoped signed-in owner explicitly enables online field pricing per technician, bound to that technician’s current sign-in.

The technician reads selling prices and their own field quotes only while currently assigned to an open job or completed assessment.

The ordinary state and offline day remain unpriced.

Options use active price-book items, authoritative tax and descriptions, and the owner’s inclusive per-line unit-price bounds expressed as whole percentages of the current price-book price.

A price outside those bounds is flagged for the desk; every draft remains subject to ordinary desk price approval.

Drafting from a completed assessment retains its notes, photos and form results.

Command replay returns only a receipt and never another copy of the priced document.

Revocation and reassignment close the read and new-draft doors; sign-in relinking requires a fresh owner grant.

A grant never approves a customer-facing price or creates a customer decision, signature, send or job amendment.

The technician report counts accepted field quotes divided by accepted or declined field quotes answered in its inclusive business-local date period, to one decimal percent; unanswered drafts are excluded and an empty denominator is unavailable.

Its JSON and CSV carry accepted and answered counts.

A desk-recorded acceptance defaults its commission seller to the originating technician, retaining the existing explicit desk override.

The remaining phone, signing and change-order work retains QUOTE-002, GLOVE-06, TEAM-003 and DATA-001 obligations before it ships.

a technician explicitly drafts additions with `fieldQuote.draft {changeOrder: true}`; an assessment can only produce a new quote.

The signed-in unscoped owner explicitly invokes `fieldQuote.apply` with the current quote and source-job versions.

The current revision needs its desk price approval, winning customer acceptance and frozen QUOTE-002 signature, disclosure and signed-copy evidence.

The selected lines append once to the same open source job, with their applicable checklists and forms; its ordinary completion and invoice preparation carry those lines while invoice approval remains separate.

A field change order cannot create another job.

Replays return the receipt only.

Activity and export retain the quote revision, signed-copy hash and application actor and time.

Existing invoices, recurring billing, discounts, deposits, mismatched frozen tax or a combined rounding difference refuse for explicit desk reconciliation; they are named engineering gaps, never silently repriced.

Field drafts without the explicit change-order flag retain the ordinary new-job path.

Authority approved by ct 24 October 2026 16:35Z: explicit signed-in unscoped owner application only; scoped or non-owner sessions and unsigned or desk-unapproved changes refuse, and signing alone never amends a job.

## QUOTE-007 operating rules

A quote option and an invoice take a document discount (a percentage of the subtotal or a fixed dollar amount, with a reason such as senior, military or first-time customer) shown below the subtotal, and discount lines (negative-price lines, from the price book or custom, each marked taxable or non-taxable). Discount lines count in the subtotal under their own taxable flag. The document discount is allocated to non-taxable lines first, then to taxable lines in line order, and the allocation is shown; tax under `MONEY-001` is then computed on the discounted taxable amount and rounded half up once per document. A discount is part of the priced revision approved under `GLOVE-03`, carries unchanged from the accepted quote to the job and the invoice, and appears in the invoice CSV, the `LEDGER-*` payload (as the provider's discount line with its taxable and non-taxable amounts) and reports. The owner limits who may give a discount and its maximum (`TEAM-001`). `PLAN-002`'s member discount follows the same rule.

a discount line is a line whose unit price is negative (`-50.00`), custom or from a price-book item of kind `discount` (a fixed negative price, no cost); its line total rounds half a cent away from zero.

Each line is taxable or non-taxable as `MONEY-001` decides (item flag, labor rule, exemption); discount lines may not take either pool below zero.

The document discount is a percent of the subtotal (above 0 to 100, two places, amount rounded half up to the cent) or a fixed dollar amount, never above the subtotal, with a reason up to 100 characters.

It comes off the non-taxable lines first (line order, each line at most its own amount), then taxable lines in line order; tax is the jurisdiction rate on the remaining taxable cents, rounded half up once, and the total is subtotal − discount + tax.

Each quote option carries its own discount; add-ons take discount lines only; on acceptance the chosen option's discount applies to the accepted lines (a percent re-applies to their subtotal, an amount stays fixed).

The job and invoice carry it; an invoice revision or correction keeps it unless the payload sets another.

The CSV writes the discount as up to two rows (non-taxable and taxable amounts); the QuickBooks inspection payload writes a `DiscountLineDetail` with tax after discount and both amounts in its description; revenue reports and job costing use subtotal less discount.

Limits: the owner is unlimited; `business.save` `discountLimits` gives each built-in or custom role a maximum percent of the document's gross (positive-line) subtotal, counting discount lines and the document discount together; an unlisted role gives none (`DISCOUNT_LIMIT`), checked on person and agent quote drafts and revisions and invoice preparations, revisions and corrections; carrying an accepted quote's discount unchanged is not giving one; A binding price decision carries commitment when an agent makes it, and the company’s policy decides that call; a person’s own price approval remains their own act.

## DISP-001 operating rules

Day, week and month views by technician and by crew, an unscheduled-jobs list, drag-and-drop to book, move, reassign or resize a visit (each drop is a `GLOVE-07` change with conflict review), color by job type or status, and a keyboard path for every drag.

the board shows a day (one row per technician across the hours), a week (Sunday to Saturday, technicians by day) or a month (weeks of days, all technicians or one), in the business time zone; inactive technicians show only where they have visits in the shown range.

The unscheduled list is the "Waiting to book" card: accepted quotes still to become jobs and open jobs with no booked or started visit.

Dragging an unscheduled job onto a technician books it (`visit.book`) for one hour at the dropped quarter hour in the day, or at 9:00 on the dropped day in the week and month (in the month for the chosen technician, else the first active one).

Dragging a booked or started visit moves it to the dropped quarter hour, day and technician keeping its length, and dragging its right edge in the day changes its end; each drop asks for the reason and is a `GLOVE-07` change (`visit.change`) with its conflict review.

The keyboard path on a focused visit: left and right move it a quarter hour in the day and a day in the week and month, up and down change technician (a week in the month), Shift with left or right changes its end by a quarter hour in the day, Enter reviews the change and Escape drops it; booking by keyboard is the "Book a visit" form.

Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by job type (the category of the job's first price-book line, else Uncategorized, as in `COST-004`), with a legend.

Views by crew are `DISP-007`'s Rows choice on the same board.

## DISP-002 operating rules

The dispatch board shows today's visits and technicians on a map (Google Maps), drive time between consecutive visits from a routing provider, and a directions handoff to the technician's navigation app (Apple Maps, Google Maps, Waze). With the map and site coordinates, the owner draws service-area zones for technicians beside their ZIP codes (`DISP-004`), and booking applies the same warn-or-refuse area rule to a site outside every zone the technician serves (moved here from `DISP-004`, ct 19 October 2026).

only the owner connects Google Maps Platform with their own key, kept as an installation secret (never in state, Activity, a command result, the business export, the installation archive or a log; a restored installation needs it entered again).

While it is connected, saving a site with a new or changed address places it with Google's Geocoding API (the street address only goes to Google) and keeps its latitude and longitude on the site, or says Google found no such place; the desk places listed sites again with `site.locate`.

The day board shows a route map over the board (`GET /api/glove/map?date=`, desk roles only): Google's base map (Static Maps API, asked for by center and zoom only) under Glove's own numbered pins for each technician's stops in order, the legs between consecutive stops with the drive time and distance from Google's Routes API (driving, traffic-unaware; only the stops' coordinates go to Google), and the zones drawn for each technician; a stop whose site is not on the map is listed with **Place on the map**.

On the technician's phone each visit offers directions to the site's address in Apple Maps, Google Maps or Waze.

The owner draws a technician's zones on the map (`technician.zones`: up to 20 named polygons of 3 to 100 corners, by clicking corners or typing them).

A technician's service area is their ZIP codes and drawn zones together: with zones drawn, a site whose ZIP is not listed and which is not inside any zone (a site not on the map is inside none) falls under the owner's area rule, warned for review or refused, exactly as `DISP-004`'s ZIP rule.

With Google Maps connected, `DISP-006`'s automatic assignment adds to each candidate's booked minutes their drive minutes from their previous visit that day (the latest ending by the new start; none, no drive) to the job's site, and picks the fewest booked-plus-drive minutes, then by name, naming each one's booked and drive minutes in the ranking; a site Google cannot place, or a drive with no route, refuses the automatic booking so the dispatcher chooses.

Live technician positions are `DISP-005`'s, and route optimization `DISP-003`'s, each carrying the map board in its text and acceptance.

## DISP-003 operating rules

For a day or a technician, Glove proposes the visit order and assignment that respects arrival windows, skills and service areas and minimizes drive time, shows the time saved, and applies it only when the dispatcher accepts; it runs as a bounded background job.

a signed-in owner or dispatcher requests a day or one technician with `route.optimize`; the existing 15-minute Worker cron claims one durable job per pass.

A job covers 2–20 visits and up to 8 assigned technicians.

It requests coordinate-only, traffic-unaware Google Routes driving times with a ten-second abort, then performs at most 1,200 appointment exchanges within twenty seconds.

It retains appointment duration and arrival windows, validates skills, working availability, service areas, overlaps and driving time against the whole proposed schedule, and keeps crews and visits with field evidence fixed.

It saves the original and proposed slots and driving comparison; no visit moves in the background.

The board shows the proposal and time saved.

`route.accept` requires a person's reason, fresh live dispatch/branch authority, unchanged day/eligibility dependencies and a fresh provider matrix, then commits every move and assignment history together.

Discard, provider refusal, expiration and stale proposals move nothing.

The comparison measures driving between visits, with no depot legs; the bounded improvement search does not claim a global optimum.

Restore retains proposal metadata but requires Google Maps to be reconnected; customer erasure discards affected undecided proposals and redacts their erased references.

## DISP-004 operating rules

Technicians carry skills and certifications (for example EPA 608, licensed electrician), working hours, time off and service areas (ZIP codes; drawn zones arrive with the map under `DISP-002`); booking warns or refuses (by owner setting) when the technician lacks a required skill, is off or outside the area; availability can be read from Lanyard or Google Calendar.

calendar availability is read from the calendar's secret iCal address (Google Calendar, Outlook and most calendars publish one). The address is a credential: the owner or that technician sets it, it is stored apart from Glove's records (`glove_secrets`), only they can read it back, and it never appears in state, the timeline, a command result, the business export, the installation archive or a log; a restored installation needs it entered again. Reading it keeps only busy spans (start and end, no titles) for the next 90 days with the time they were read; an event marked free or cancelled is not busy; UTC and TZID times are exact; floating times and all-day dates are read in the business time zone; DAILY and WEEKLY repeats are expanded and other repeats are read at their first occurrence only and counted. A booking overlapping a busy span falls under the owner's availability rule (warn or refuse) and names when the calendar was read.

only the owner connects Lanyard, one technician at a time, by entering that technician's Lanyard staff ID explicitly (Glove never matches staff by name or email) and a Lanyard bearer key. The key is sealed as an installation secret, apart from Glove's records, and never appears in state, Activity, a command result, the business export, the installation archive or a log; a restored installation needs it entered again. Glove only sends GET requests to Lanyard's fixed availability path for that staff ID, refuses redirects, and sends nothing about customers, sites or jobs. From the answer it keeps only that staff member's normalized availability windows and the start and end instants of their approved leave for the next 90 days, with the time they were read; recurring patterns keep Lanyard's own semantics, and pending or declined leave is ignored. Glove never keeps names, payroll, preferences, leave reasons or any other staff member's data. A booking outside an availability window or over approved leave falls under the owner's existing availability rule (warn or refuse) and names when Lanyard was read. A failed read shows a generic message, keeps the last snapshot and labels it with the time it was read; disconnecting clears the key and the snapshot; an expired key shows Reconnect Lanyard to the owner.

*Egress (DISP-004, ct's EGRESS RULE):* the Lanyard origin is entered by the owner, so Glove accepts only an https origin on a public host (no IP literal, private, loopback, link-local or local name) with no username, password or key in the URL; redirects are refused, and the key travels only in the request's Authorization header. This read is Glove's declared outbound connection to Lanyard under its privacy and outbound rules (Operating rules: provider credentials are installation secrets that never travel in an export). It ships only once Glove adopts Base's egress door, which checks the host on its resolved address with no DNS-rebinding gap (gr-base-285).

## DISP-005 operating rules

While clocked in and on the job, a technician's phone shares location (with their consent, never off the clock), or Glove reads a fleet GPS provider (Linxup, Samsara, Verizon Connect); the board shows each technician's position and an ETA to the next visit, which feeds `COMM-004`. Glove reads fleet GPS providers; it does not operate GPS hardware.

location sharing starts off.

Only the technician's current person session can record or withdraw their explicit consent; the phone requests browser permission and captures only while visible, online, clocked in and running a travel or job timer on its current assigned visit.

Locations never enter the offline outbox.

The owner can explicitly connect one Samsara vehicle per technician and request its current GPS snapshot from the fixed documented host; that read requires the same consent, shift and visit checks.

Coordinates captured before the shift or timer, more than two minutes ago, in the future beyond ten seconds, or after assignment, consent or sign-in withdrawal are refused.

A current position goes only to the owner within their branch scope, and its coordinates go to the already-connected Google Routes API for a traffic-unaware driving estimate to the next booked visit.

This is a driving estimate from the moment of reading, not a departure promise; the delay watch retains its existing overrun and promised-window rules.

Missing routes and stale positions never invent an ETA.

The most recent position replaces the previous one in transient storage; it is hidden after two minutes and removed by the next product command, clock-out, timer stop, reassignment or consent withdrawal.

Coordinates and fleet keys are absent from state, Activity values, command results, business exports and installation archives.

Consent changes and generic capture outcomes are audited without coordinates.

Delegated Dispatcher and named-agent location views follow DISP-009’s current-shift grants.

An agent’s location call carries standard and the company’s policy decides it within that authority.

`COMM-004` inherits customer notices and `FIELD-005` inherits native background capture before those capabilities ship.

## DISP-006 operating rules

Visits, `BOOK-005` service calls' included, are booked with a customer arrival window (for example 8–10 am) separate from the planned time; when a booking comes from `BOOK-002` or `AGENT-001`, Glove assigns the best eligible technician (skills, area, load, travel) under the owner's rules, and the dispatcher can override. `BOOK-006` assessments are booked with an arrival window too.

`visit.book`, crew bookings, `BOOK-005` service-call visits, `BOOK-006` `assessment.book` and approved dispatch proposals take an optional `window {start, end}`: wall-clock HH:MM on the visit's local date in its booking zone, start before end, kept on the visit as `arrivalWindow` beside the planned start and end.

The planned start must fall inside the window, both ends included; otherwise the booking is refused (`WINDOW`).

`visit.change` keeps the visit's window unless it names a new one, and `window: null` removes it; a move whose planned start leaves the kept window is refused.

The window shows in the booking event ("9:00 AM – 10:30 AM (arrival window 8:00 AM – 10:00 AM)"), on the dispatcher's visit panel and on the technician's phone.

Recurring series occurrences (`PLAN-001`) carry no window.

`visit.book` (service calls included) and `assessment.book` also take `technicianId: "auto"`: Glove picks, among active technicians in the job's branch with no conflict at that time (skills, areas, time off, calendars, other visits and the owner's warn/refuse rules; an out-of-area warning is a conflict, so every candidate is in-area), the one with the fewest booked minutes on that local date, then by name; the assignment records "Assigned automatically" with the ranking, `NO_TECHNICIAN` answers when nobody is free, and the dispatcher overrides with `visit.change` under `GLOVE-07` review.

With Google Maps connected, each candidate's drive from their previous visit that day joins their booked minutes (`DISP-002`'s semantics), and online bookings (`BOOK-002`) and the front office (`AGENT-001`) call this assignment, each naming `DISP-006` in its text and acceptance (ct approved as pattern-1 DONE, 20 October).

## DISP-007 operating rules

A job can span several days and several technicians at once; a crew is booked as one, and the `DISP-001` board shows its day, week and month by crew, a crew dragged as one; subcontractors sign in with their own limited role, see only their visits, and their 1099 totals are kept (`COST-002`).

a job holds any number of visits over any days.

The owner (acting for "admin") names crews of 2 to 10 active technicians or subcontractors; changing a crew changes only later bookings.

Booking a crew books one visit per member at the same date and times in one command, after one review of every member's conflicts.

Moving any visit of that booking moves every member's visit in it that is not completed or canceled to the same date and times, never to another technician, after one review.

Canceling cancels them all, and is refused while a member has recorded evidence on theirs.

The dispatch board's Rows choice shows crews instead of technicians in the day, week and month, one chip per crew booking, dragged or moved by keyboard as one.

Subcontractor is a built-in role, invited and signed in like staff.

A subcontractor sees only the visits now assigned to them and, for those, the job title, checklist and forms, the site's address and access notes, the customer's name and phone, and their own captures.

They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, other people's work or other visits.

They record arrival, checklist items, notes, photos, materials by description, forms and completion on their visits.

They cannot clock in, run timers, record refrigerant or expenses, or add priced work, and their phone keeps no offline day and gets no pushes (`FIELD-001` and `FIELD-004` are the Technician's).

The owner marks a technician record as a subcontractor with a 1099 payee name and the last 4 digits of the TIN; a full TIN is refused and never stored.

The owner sets an agreed amount on each of their visits.

The 1099-NEC totals for a calendar year, which the owner and office read as JSON or CSV, sum each subcontractor's agreed amounts on their visits completed that year (dated by the completion Glove received, in the business time zone), with the visit count and whether the total is $600 or more.

They are labelled "Totals for your filing, not a filed 1099"; Glove files nothing.

Timesheets and payroll exports stay `COST-002`'s.

## DISP-008 operating rules

Each technician's visits appear in their Google or Microsoft 365 calendar (one way, updated on change, customer details limited by owner setting), and busy blocks from that calendar count against availability.

the unscoped owner explicitly connects one delegated Google or Microsoft calendar per technician and approves one-way visit writes.

Customer details default to hidden; the owner may include customer name and service address only.

No attendees or contact channels are sent.

Credentials, pending delivery work and event mappings are excluded from archives; restore requires explicit reconnection.

All committed visit changes enqueue provider work, including technician reassignment.

Booking refreshes busy time and refuses an unreadable provider; only busy instants are retained.

Uncertain writes remain visible and stop later work on that connection, without automatic replay.

Disconnect stops writes and retains existing provider events for owner review.

The existing private iCal connection remains independent.

## DISP-009 operating rules

The owner may grant a Dispatcher position view per technician and shift. The technician is told the view is on, every read is audited, and custody remains latest-only. Agent reads remain denied unless the owner grants the same view to a named agent. This is ct's 25 October 2026 rider to `DISP-005`, assigned the next free numeric ID.

The unscoped owner explicitly grants an active Dispatcher or named agent a view of one technician’s exact open shift. The phone status names viewers. Current recipient authority, owner authority and branch scope are rechecked on reads. Every delegated map read commits a coordinate-free audit before returning data. Revocation and shift closure stop access; another shift never inherits it. The grant table is transient and excluded from archives. Latest-only position custody and the existing owner-only delay explanation remain unchanged.

## COMM-001 operating rules

Quotes, invoices, receipts, confirmations, reports and purchase orders to suppliers (`STOCK-002`) are emailed from Glove through the owner's provider (SendGrid, Postmark, Amazon SES or the Base mail adapter) from the business's verified domain; each message records queued, delivered, bounced or complained from provider events, and a failure shows on the record with what to do next. CAN-SPAM rules apply to anything not strictly transactional. This clause also inherits morning email delivery of the owner's `AGENT-008` brief; it is off until the owner turns it on, and nothing is ever pushed.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

the owner connects customer email (`mail.connect`): SendGrid or Resend through Base's mail adapter, or Postmark or Amazon SES through fixed provider endpoints, a from-address and optional name, the provider API key and, for SendGrid/Resend, its event-webhook verification key (SendGrid's Signed Event Webhook public key or Resend's `whsec_` signing secret), kept as installation secrets that are never shown again, exported or archived; `{provider: null}` disconnects.

Glove does not check the sending domain itself: the provider refuses mail from a domain it has not verified, and that refusal shows on the message.

The desk emails what each person may already record as sent (`email.send`): an approved quote's current revision to the customer's email (owner, dispatcher, office; the quote is then sent, naming the email), an approved or exported invoice to the customer's accounts-payable address, else their email (owner, office), and a draft purchase order to its supplier's address (owner, office; the order is then sent); `agreement.offer` with `email: true` emails a `PLAN-004` booking link to the customer's own email address.

Every email Glove sends today is transactional; no marketing email is sent.

Replies go to the business email when one is set.

A message record keeps its kind, subject, recipient, from-address, provider and who sent it, never the body, so a booking link's bearer exists only in the email and the one-time command response.

After the command commits, Glove makes one send attempt with the message id as the delivery id.

The provider's answer (accepted, refused, rate limited or not confirmed) and every authenticated event the provider posts to `POST /api/glove/mail/events` (delivered, deferred, bounced, complained, failed, rejected) are provider facts on the message's timeline, in Activity and in the business export with the provider's reference; Glove authenticates each callback under the rules below (using Base's verifier for SendGrid/Resend), and Base's durable store keeps each matched event once, and applies an event only to a message Glove sent through that provider to exactly that recipient; authenticated unmatched events return 200 without effect.

A message's state is the latest of its facts in Base's order: a final fact (delivered, bounced, complained, failed, rejected) is never replaced by a non-final one, and a later final fact (a complaint after delivery) replaces an earlier one. "Delivered" means the recipient's mail server accepted it, as the provider reported; Glove never claims a person read it.

Each failure shows on the message with what to do next.

A customer whose latest finished email to an address on their record bounced or was marked as spam carries that warning, with what to do next, until a later email to that address finishes delivered or the address changes.

Each email is in the `COMM-007` stream as an outbound email with its author, recipient and state.

Nothing is retried automatically: the desk sends again, or for a booking link revokes it and makes a new offer.

QUOTE-002 inherits a confirmation copy of the winning signed revision to the on-record email, with the same provider outcomes, before online signing ships.

Inheritance (pattern 1): receipts join with `PAY-002` and `PAY-004`, appointment confirmations with `COMM-003` (which also carries `FIELD-003` report links), and review requests with `COMM-008`; each emails through this door with the same provider outcomes before it ships, and any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address.

only the owner turns it on or off (`mail.morning {enabled, time}`, with customer email connected first; `time` is a business-local `HH:MM`, 07:00 by default); it is off until then, and opening the brief never sends anything.

Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in the business time zone) is at or past `time` on a local date emails that date's brief, as `AGENT-008` prepares it for that instant, to the owner's active sign-in address (the owner account's email, not the business email) through the connected provider; a business-local date gets at most one send, claimed once as a `queued` fact in the timeline before the provider is called, so a repeated or simultaneous run sends nothing more and a crash between claim and send loses that date's email rather than sending it twice.

A run before `time`, with email off or disconnected, or without an active owner address sends nothing.

The provider's answer (accepted, refused, rate limited or not confirmed) and its signed delivery events (`POST /api/glove/mail/events`, accepted only for that recipient and that date's delivery id) are provider facts on that date in Activity and the business export, with the provider's reference and no key or brief body; the Today screen and `GET /api/glove/brief` (`emailed`) show the date's state exactly as those facts fold, with what to do next, and "delivered" means the recipient's mail server accepted it.

Nothing is retried: a failed date stays failed and the next local date sends its own brief.

The email carries the brief's own text and, being a transactional notice to the owner of their own records, no marketing content.

authentication precedes delivery-payload parsing, message lookup, database writes and outbound effects.

SNS necessarily decodes its bounded signed envelope and fetches only its pinned certificate to verify the signature; its SES Message remains unparsed until verification.

Disconnected email returns 404.

Every failed authentication/schema/recipient check returns the same generic 401 body, writes no Activity, durable counter, receipt/event ID or other business record, and logs only a generic Worker warning without secrets.

After 20 rejections from one IP in a minute, further rejected requests return 429; verified traffic is never counted or refused by that rejection allowance.

Authenticated events for messages Glove did not send through that provider return the same opaque 200 acknowledgement as matched events, with no effect and no consumed event ID; a wrong recipient for a known message refuses the entire batch.

The owner's email settings show the last verified matched event time and any SNS cancellation warning.

Unauthenticated and unmatched events never change delivery state, bounce/spam warnings, suppression/opt-outs, subscriptions or inbound email, request, conversation or customer records; never write Activity/export or reveal message/customer/recipient existence.

Every future inbound-email receiver inherits this authentication before shipping.

Postmark: HTTPS Basic user `glove`, with a per-installation password generated from 32 random bytes and shown only in the first owner response.

Store only its SHA-256 hash and compare in constant time.

`mail.callback {action: rotate}` keeps the previous hash valid for exactly 24 hours (exclusive expiry), `revokePrevious` ends that overlap immediately, and disconnect revokes both.

Rotation, revocation and allowlist changes are Activity facts without secrets.

The optional source-IP allowlist is off by default, pinned in source with a dated provider reference, fails closed when on and never replaces Basic authentication; reconnecting credentials preserves this owner option unless explicitly changed.

Plain-HTTP Postmark callbacks are refused without writes.

Replay identity is event type plus Postmark ID, or message ID + type + recipient + time when no ID exists; refuse events over 7 days old.

Sends include Glove's delivery ID in Postmark metadata.

Delivery maps to delivered, hard bounce to bounced, soft bounce to deferred or failed when final, and SpamComplaint to complained.

Amazon SES via SNS: pin region, TopicArn and configuration set to the owner's connection.

Require the message-type header to equal the envelope Type, accept SNS signature versions 1 and 2 (setup asks for version 2), and require the signing certificate at `https://sns.<region>.amazonaws.com/SimpleNotificationService-*.pem` with no query, credentials, fragment, alternate port or redirects; cache the certificate within its validity for at most one hour.

SNS timestamps are at most 1 hour old and at most 5 minutes ahead.

Require a signed SNS envelope (raw delivery off), the pinned SES configuration set and Glove delivery tag on each SES event; sends carry the configuration set and a base64url-encoded delivery ID tag.

Deduplicate SNS MessageId and the SES event.

A SubscriptionConfirmation URL is fetched only after all source, URL, timestamp and signature checks; require HTTPS on the same pinned regional SNS host with the exact ConfirmSubscription action, TopicArn and Token, and follow no redirects.

An UnsubscribeConfirmation warns the owner and never fetches its URL.

Delivery maps to delivered; Permanent bounce to bounced; Transient bounce to failed; DeliveryDelay to deferred; Complaint to complained; Reject and RenderingFailure (including AWS's `Rendering Failure` spelling) to rejected.

SendGrid and Resend retain their signatures, with the same shared no-effect unmatched rule.

Callback credentials, hashes and AWS/API keys are excluded from exports and archives, and restored email must be reconnected.

## COMM-002 operating rules

The owner connects Twilio (or another provider) with a US number registered for A2P 10DLC or toll-free verification; Glove records each customer's SMS consent (source, time, wording), honors STOP, HELP and START in every thread, keeps quiet hours by the customer's time zone, and records sent, delivered and failed per message. The owner keeps their existing business number: it is ported to Twilio, or text-enabled in place as a hosted number while voice stays with the current carrier, with the port or hosting status shown until it is live; a new number is the owner's choice, never the only path. A customer's recorded opt-out also keeps them out of every `CUST-004` segment push.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

## COMM-003 operating rules

Booking, moving or canceling a visit (a `BOOK-005` service call's included) sends the customer a confirmation by text and email (by preference); reminders go at owner-set times before the window (for example 24 hours and 2 hours); the customer can confirm or ask to reschedule from the message. The wording of every automated message (confirmations, reminders, on-my-way, quote follow-ups under `QUOTE-004`, payment reminders under `PAY-005`, review requests) is an owner-edited template with merge fields and a preview; the opt-out wording and business name cannot be removed. An assessment visit (`BOOK-006`) sends the same confirmation and reminders. Under RL-102, an explicitly owner-issued expiring visit-response link reveals only the title and window, records the first confirm or reschedule request, changes no booking and verifies no identity. Report email is an explicit approved disclosure; ordinary reminder templates confer no implicit link authority. Customer-payment bearer authority belongs to PAY-002 under RL-106.

the owner previews plain-text templates through `reminder.preview`, then explicitly approves templates and the schedule through `reminder.configure`.

The immutable footer adds the business name and office-handled stop instructions.

No links or markup are accepted in templates.

The owner records consent or withdrawal separately for visits, invoices and quotes through `reminder.consent`; changing the recorded recipient address invalidates consent.

Automatic email is off by default.

The scheduled Worker sends only between 08:00 inclusive and 18:00 exclusive in the record branch zone, rechecking current owner authority, connection, consent and business state.

Due steps are claimed durably before one provider attempt; retries and concurrent passes never resend a claimed step.

Unknown outcomes remain unknown.

Historical messages are never a resend source.

A changed visit supersedes its unsent notice and old reminder times; cancelled visits have no later visit reminder.

Every visit creation door uses the shared commit path, including assessments and recurring or customer-booked visits.

The pass reserves at most 50 messages.

PAY-005 uses frozen invoice due dates and current confirmed balances, stops on disputes and zero, and exposes actual state in aging.

QUOTE-004 uses elapsed 24-hour days after the revision was recorded sent and stops on any current-revision customer response, closure or the frozen expiry instant.

Erasure removes recipient consent, visit intent and message records through DATA-001.

The subsequent bounded text channel, explicit customer response and report-link doors, and quote-purpose unsubscribe are described in `docs/sms-channel.md`.

Future notice kinds inherit D-1 before shipping.

## COMM-004 operating rules

The technician taps "on my way" (or Glove detects departure under `DISP-005`) and the customer gets a text with the technician's name, photo and ETA; arrival, completion and report-ready notices follow by owner setting. Under RL-103, notices disclose only the assigned visit’s bounded content. Employee-photo consent is separate and revocable, no coordinates or location history are disclosed, and stale offline arrival creates no misleading notice. Owner-enabled completion shares only the immutable report for seven days, with revocation and erasure fences.

All three notice settings start off.

The unscoped owner previews and explicitly approves exact plain-text templates and each setting, including seven-day report sharing; the business name and STOP wording cannot be removed.

Only the current assigned technician explicitly taps on my way, online, with a consented on-clock travel timer and fresh position for that visit.

The server privately derives a driving estimate; the customer receives the technician’s first name and ETA plus a two-hour link to their photo, never coordinates or a movement history.

Only the technician can upload their own photo and explicitly consent; metadata is stripped, replacement or withdrawal deletes the original and links even after profile deactivation, and expiry, assignment change, customer consent withdrawal or changed owner authority closes public reads.

The photo bearer is hash-only in transient storage, omitted from archives, and grants only first name and sanitized image.

The tap implements the clause’s explicit-departure alternative; no detected-departure send is added.

Arrival follows its separate exact owner-approved template only when the assigned technician’s fresh arrival reaches the server within two minutes; stale offline evidence still records arrival without a misleading text.

Completion can issue the immutable report’s seven-day link only under the approved report setting, current customer consent, quiet hours and current configuring-owner authority.

Only a hash persists; the bearer exists in the one provider attempt.

Replay never resends, uncertain delivery is not called delivered, and revoked or expired report links stop reading.

COMM-002, COMM-003 and COMM-005 retain their existing consent and channel obligations; DISP-009 retains delegated location views.

## COMM-005 operating rules

Replies land in a shared inbox, threaded by customer and linked to the open job, with assignment, unread state and canned replies; technicians text customers from the job through the business number, never their personal number.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. Under RL-104, the owner separately opts into retained shared-inbox text; native desk users explicitly reply through D-1, and retained text follows customer erasure.

## COMM-006 operating rules

A customer opens their hub from a sign-in link sent to their email or phone and sees their quotes (approve and sign; each price-book line shows the customer-facing description its item carries, `MONEY-003`), upcoming visits (confirm, reschedule within policy), invoices and receipts (pay), service reports, equipment, agreements (renew, update card) and can request new work; they see only their own records.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. Hub financing follows PAY-006’s customer-choice and minimal-disclosure outcome under RL-107.

Only a signed-in Owner without branch limits may explicitly inspect one customer’s proposed customer-facing content.

The projection includes customer document fields of sent or decided quotes, customer-facing price-book descriptions, approved invoices, confirmed-payment summaries, visits, completed-report summaries, equipment and agreements.

It shows proposed customer communications content, not proof that any content was sent, received or read.

Exclude draft documents, private notes, access notes, internal conversations, credentials, payment authorization evidence and report files.

Report summaries provide no original-file access.

Existing document, customer, record and original-file restrictions remain binding.

The projection does not authenticate a customer, assert control of their email or phone, issue a credential or link, grant customer access, approve or sign a quote, request work, change a visit or agreement, send a message, update a payment method or authorize a payment.

Enforce the Owner restriction at the command boundary.

Signed-out people, branch-limited Owners, other staff roles, custom roles, integration tokens and agents gain no projection access through this policy.

Refusal reads “An Owner without branch limits must sign in to inspect this customer preview” and reveals no customer content.

An unavailable customer reads “Customer preview unavailable” without exposing another customer’s records.

Each successful inspection records the actual Owner, time, selected customer reference and inspection effect in Activity and business export, without copying the projection body, private fields or credentials into the trail.

Inspection creates no communication or payment effect.

Restore reconstructs the projection only from permitted restored records under current authority; it restores no session, customer credential, link or sending or payment authority.

DATA-001 erasure removes underlying personal content and personal saved outcomes or timeline copies, and the projection must not reconstruct erased content.

The trusted later erasure journal prevents an older backup from reviving erased content; an offline destination cannot discover a later erasure without that journal.

Preserve the complete customer-hub target and every original acceptance point.

Gaps include customer sign-in and credential issuance, expiry and revocation; customer-facing screens and cross-customer isolation; quote approval and signing; invoice payment and receipts; work requests; visit confirmation and policy-bound rescheduling; report discovery, reading and original-file isolation; agreement renewal and card updates; and COMM-007 portal communications.

Existing staff send, receive, delivery-outcome and conversation-history targets remain with their owning communication clauses.

Complete customer browser acceptance at 1440 and 390 remains required.

This inspection policy proves no customer authentication, delivery, payment authority or legal compliance.

## COMM-007 operating rules

Calls, texts, emails, notes, portal actions and agent conversations appear on the customer and job timeline in one stream with their direction, channel, author and delivery state.

the stream is read from `GET /api/glove/conversation?customerId=` or `?jobId=` and shown as Conversation on the customer and on the job. The desk (owner, dispatcher, office) logs a call (inbound or outbound; answered, voicemail or no answer; optional whole minutes from 0 to 600 and what was said) or a note (text required) on a customer and, optionally, one of that customer's jobs (`conversation.log`); a merged-away customer takes no new entries. Every message Glove sends or receives today is in the stream, each with its direction (inbound, outbound or internal), channel, author, recipient, who recorded it and its delivery outcome: requests as they arrived (channel = the request's source), request follow-ups, quotes recorded as sent and the customer's recorded acceptance or decline (`GLOVE-04`), purchase orders recorded as sent to the supplier for the job (`STOCK-002`), Web Push visit notices to technicians about the job with the push service's answer (`FIELD-004`), and every agent action on the customer's records (`GLOVE-10`, `AGENT-*`). A send made outside Glove reads "Not confirmed: sent outside Glove"; a push the service accepted reads "Handed to the push service (HTTP n); arrival on the phone is not confirmed"; a note reads "Internal note: not sent to the customer"; Glove claims no delivery a provider did not report. Entries are ordered oldest first by the moment Glove recorded them (UTC, millisecond); entries recorded in the same millisecond keep a fixed order. The customer's stream holds every entry for the customer, their jobs and any customer merged into them; a job's stream holds the entries on that job, its quote and the request the quote answered. Viewers and agents read the stream like the desk; technicians and subcontractors do not. Sign-in emails to staff and segment pushes to Mango or Mailchimp are not customer messages and are not in the stream. A property's history (`CUST-001`, `GET /api/glove/sites/<id>/history`) carries the same entries as `message` rows for the desk roles and viewers, newest first with the rest of that history: those on the jobs at the property and on the requests and quotes made for it; a call or note logged on the customer without a job belongs to no property and stays in the customer's Conversation; field roles read no message there. Inheritance: texts, emails, calls on the business number, portal actions and agent conversations join the stream as `COMM-001`, `COMM-002`, `COMM-005`, `COMM-006`, `COMM-009` and `AGENT-001` ship; each carries that obligation in its own acceptance.

## COMM-008 operating rules

After a job is complete and paid (owner chooses the trigger), Glove asks the customer for a Google review by text or email, at most once per owner-set period per customer, never asks a customer who opted out, and records the request and any review that the Google Business Profile connection reports. Every customer gets the same request: Glove never filters requests by sentiment.

## COMM-009 operating rules

Inbound calls to the business's Glove number ring the office and on-call phones in order, forward to the owner's existing phone system if set, play a recording notice where the owner records calls, text back a missed caller with a booking link, and log every call (caller, duration, recording, outcome) on the customer; once the existing number is ported (`COMM-002`), it is the business number.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

## FIELD-001 operating rules

The technician's phone keeps the day's assigned visits (customer, site, access notes, equipment, history, checklists, forms, photos already taken) cached, so the app opens, reloads and works with no signal; everything captured offline sends exactly once on reconnect under `GLOVE-06`, and a conflict with a desk change is shown, never silently overwritten.

only a signed-in Technician's phone keeps the day: that technician's own view (the visits ever assigned to them with those jobs' customers, sites, access notes, equipment, history, checklists, forms and captures; never prices), replaced on every successful refresh, kept in this browser's storage, and cleared on sign-out and whenever a different person or a desk role signs in on it.

A service worker keeps the app shell this phone loaded and that technician's photos, answering from them only when the network fails; it never keeps records or other `/api/` or `/auth/` answers, and desk roles never keep records.

With no signal the app opens, reloads and works from the kept day, saying how old it is; everything recorded (arrival, checklist, forms, notes, photos, materials, completion) waits in the phone's outbox, in order, tied to the person who recorded it (another sign-in never sends or shows it), and sends exactly once on reconnect under `GLOVE-06`; a visit can be completed once its arrival is waiting to send.

Evidence for a visit the desk moved to someone else meanwhile is kept, flagged and reviewed under `GLOVE-07`, never silently overwritten.

## FIELD-002 operating rules

The owner builds forms (yes/no, choice, number with units, reading with range, photo, signature, notes, conditional questions) and attaches them to services, equipment types or agreements; technicians fill them offline; results appear on the job, the report and the equipment history.

the owner builds a form of up to 60 questions (yes/no, choice, number with an optional unit, reading with a unit and an inclusive range, photo, signature, notes); a question can be asked only when an earlier yes/no or choice question has a given answer.

A form attaches to price-book services and to equipment types (matched without regard to case).

A new job takes a copy of each form that applies: one per unit the job names whose type the form lists, otherwise one for the job when a quoted service lists it; editing or archiving the form never changes a job's copy, and the per-service checklists stay as they are.

The technician fills each copy once on the phone, through the outbox, so it works without signal (`GLOVE-06`): every question asked and required must be answered, a question not asked must be left empty, and a reading below its lowest or above its highest value is flagged.

The filled form is a field record on the job and its timeline (naming how many readings are out of range), on the unit's service history when the copy is for a unit, and in the property history.

Agreements carry forms when `PLAN-002` ships, and the customer's report prints form results under `FIELD-003`.

## FIELD-003 operating rules

Completing a visit produces an immutable service report: work summary, findings, `FIELD-002` form results with out-of-range readings marked, photos, materials, customer signature (or the recorded reason it is absent), and recommendations. The owner, dispatcher or office creates a seven-day link with **Copy report link** and shares it with the customer by hand today; Glove makes no delivery claim. Recommendations become a quote draft in one step under ordinary human price approval. COMM-003/004 inherit customer notices, COMM-006 the hub, and QUOTE-005 branded PDF documents, in their text and acceptance before shipping.

the exact customer-facing snapshot is frozen in the same guarded transaction as completion, with only the completing technician's first name. A link contains 32 random bytes, shown once, with only its SHA-256 retained separately from domain records; the bearer stays in the page fragment and request header, never a URL query, record, saved command result, export or log. The same desk roles revoke links. Each read rechecks expiry and revocation and permits only that report and the original files it named when frozen; other records and later evidence remain private. Link secrets are excluded from the installation archive, so a restored installation issues new links. Branch limits apply to creating/revoking a link and drafting a recommendation. A technician records findings and recommendations through the normal offline completion outbox; the owner or dispatcher prices a recommendation into an ordinary quote draft, linked to the source report and still requiring human price approval. Reports appear in Activity, property history and business export without link secrets. Existing completed or imported visits without a snapshot do not claim a report was issued.

## FIELD-004 operating rules

The technician app installs to the home screen on iPhone and Android, uses the camera directly, sends push notifications for new, moved and canceled visits, and offers tap-to-call and tap-to-navigate.

`/app` installs to the home screen from its web app manifest (Glove, starting at `/app`, standalone, 192 and 512 px icons) and the home-screen tags iPhone reads; an iPhone shows web pushes only once Glove is added to its Home Screen (iOS 16.4 and later), which the phone screen says.

Field photos open the rear camera directly.

The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair whose private key is an owner-only installation secret (never in records, state, exports, logs or the archive); turning them on again replaces the key, and turning them off deletes the key and every subscription.

A Technician turns notifications on for each phone.

A subscription (the push service address and the phone's keys) belongs to that person, that device and that signed-in session; only that person reads it back, as their list of phones (a label, the last outcome and when, never the address or keys); and it is deleted when they remove it, sign out on that phone, the session is ended elsewhere or expires, they stop being an active Technician (a role change or deactivation), the push service no longer knows it (HTTP 404 or 410), or the owner turns notifications off.

It is never in records, exports or the archive, so a restored installation needs fresh subscriptions.

After every committed change, whoever or whatever made it (a person, a rule, a recurring series, an agent under the owner's grant, a move-in), each technician with a visit that has not ended and was booked to them, moved (its start or end changed), canceled, or handed to another technician gets one push on each subscribed phone: "New visit on your schedule" (also for the technician who receives a handed-over visit), "Visit moved", "Visit canceled" or "Visit moved off your schedule", or "N changes to your schedule" when one change touches several of their visits.

A push carries only that line and, when one visit changed, the job's opaque id; never the customer, site, time or a note.

Each push is encrypted for the phone (RFC 8291, aes128gcm) and signed with the VAPID key (RFC 8292: a 12-hour token naming the business email, else the installation address), kept by the push service for at most a day, and sent once, never retried.

The phone list says "Handed to the push service" (not "delivered", which Glove cannot see), "Not sent: the push service answered HTTP <status>" or "Not sent: the push service could not be reached".

Only a Technician subscribes, and no role, agent included, has a door that sends a push.

Tapping a notification opens the signed-in app on that job's visit.

On a visit, Call customer opens a `tel:` link to the customer's phone (its digits and a leading +) and Navigate to site opens Google Maps directions to the site's address (the Maps app where installed).

A local installation served from this computer also accepts a push service on this computer (`http://127.0.0.1` or `localhost`), so its own browser journey can run one; a hosted installation accepts only https push services.

`FIELD-005`'s native apps carry push in their own text.

## FIELD-005 operating rules

Glove ships technician apps in the App Store and Google Play, signed in to the owner's installation, with the offline cache of `FIELD-001`, background photo upload, push, location under `DISP-005` and Tap to Pay under `PAY-003`.

## FIELD-006 operating rules

The technician photographs an equipment nameplate; Glove reads make, model, serial and manufacture date with their evidence; the company’s policy decides whether those standard-class readings fill the equipment fields or wait for the technician, and attaches the manufacturer's manual where one is available.

the model provider is the owner's own: an OpenAI-compatible chat-completions address (https), one model id and the owner's key, connected by the owner only and kept like the marketing keys (never in records, exports, logs or the archive); without it nothing is read.

The technician reads a nameplate on a visit they are working, for a unit already at the site or one not recorded yet; only the photo goes to the provider (no customer, site or job details), asking for JSON with storage off.

The reading is labelled as read by the model and carries its evidence and uncertainty.

The company’s policy decides whether the standard-class reading fills the equipment fields or waits for the technician.

Under the held policy the technician who took it confirms or corrects the fields or discards the reading, keeping the proposed and corrected fields distinct.

A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anything else is left unread, as is any field the model returns empty. "Where one is available" means the manual library the desk keeps (make, model, title, https address): on confirmation the manual whose make and model match, ignoring case and surrounding spaces, is attached; Glove never invents, searches for or fetches a manual.

Reading needs a signal; the confirmed unit and its manual are then in the phone's offline day (`FIELD-001`).

The provider flow and exactly these fields (and `AGENT-006`'s) are listed in the declared data flows, the docs page `docs/data-flows.md`.

## FIELD-007 operating rules

On HVAC visits the technician records refrigerant type and the amounts added and recovered per equipment item, with their EPA Section 608 certification number; the owner gets a per-equipment and per-period refrigerant log for their own recordkeeping.

## FIELD-008 operating rules

Every desk role does its daily work from a phone, 390 px wide and up, in the installable app (`FIELD-004`) and the native apps (`FIELD-005`), under the same role checks as the desk: create a request, a customer or a job (`BOOK-005`), build, approve and send a quote, book or move a visit with conflict review, prepare, approve and send an invoice, take a payment (key in a card read out on the phone or charge a saved one under `PAY-009`, or record a check or cash), answer a text in the inbox (`COMM-005`) and read the `REPORT-001` dashboard. No screen scrolls sideways, and every action is the same public command as at the desk. Saved-card authorization follows PAY-009 and inbox custody follows COMM-005 (RL-104); native publisher and device proof remain FIELD-005’s delivery obligations.

## COST-001 operating rules

Technicians clock in and out for the day and run travel and on-job timers per visit, with or without signal; time is attached to the job; the desk sees who is on the clock (the `REPORT-001` dashboard's on-the-clock tile) and corrects time with a reason.

a technician clocks in and out on the phone and, only while clocked in, runs one timer at a time, travel or on the job, on a visit currently assigned to them; starting a timer stops the running one at the same phone time, and clocking out or completing the visit stops it too.

Every start and stop carries the phone's clock time and goes through the phone's outbox with the identity it was given, so it works without signal and a resend lands once (`GLOVE-06`).

An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of its entries per kind.

The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local dates and times in the business timezone, with a reason; the entry keeps the phone's original times and every correction (who, when, reason, from and to), and the job's timeline records it.

Technicians read only their own entries.

The `REPORT-001` on-the-clock tile lists the technicians with a shift clocked in and not out, with the timer each is running.

## COST-002 operating rules

Weekly timesheets per person roll up clock and job time, flag overtime past 40 hours a week (and daily overtime where the owner sets a state rule), are approved by the owner, and export in the import shape of Gusto, ADP RUN and QuickBooks Payroll; W-2 employees and 1099 subcontractors are kept apart, with subcontractor payment totals for 1099-NEC.

a workweek is seven local days in the business time zone from the owner's week-start day (Monday unless the owner sets another; fixed once any timesheet is approved).

Each closed shift counts its whole minutes (`COST-001` rounding) on the local day it started, including a shift that runs past midnight; job and travel timer minutes are shown beside it, and paid hours are the shift (clock) time.

When the owner sets a state rule, minutes past the "after" hours in a day are overtime and minutes past the optional "double after" hours are double time (quarter-hour settings, double after overtime); then, day by day in order, regular minutes beyond 40 hours in the workweek become overtime.

Seventh-day and other state rules are not applied.

Hours are each bucket's minutes / 60, rounded half up to two decimals, so rounded buckets can differ from the rounded total by 0.01.

A timesheet is flagged when it holds any overtime or double time.

Whoever reads time entries reads the week's timesheets (a technician only their own; a subcontractor none).

Only the owner (acting for "admin") approves a week, and only once no shift in it is still open; an approval stands while the week's entries and their split are unchanged.

A later correction, late entry or overtime-rule change marks it "changed since approval" until the owner approves it again.

The payroll files are for a pay period of 1 to 6 whole workweeks, read by the owner and office like the other exports.

They hold only people whose every week with time in the period is approved and unchanged, and they list everyone left out with the reason.

A technician record marked as a 1099 subcontractor (`DISP-007`) is never in the payroll files or approvable; their agreed-amount totals are only in the 1099-NEC export.

The files follow what each provider publishes, checked against the provider's own help on 21 October 2026.

RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418A) defines the layout, and the file follows it exactly: a `##GENERIC## V1.0` version row, the column titles IID, Pay Frequency, Pay Period Start Date, Pay Period End Date, Employee ID, Earnings Code, Pay Hours, Dollars, Separate Check, Worked In Dept and Rate Code, then one row per person and earnings code with the owner's company code (up to 10 letters and digits), pay frequency, the period's start and end as MM/DD/YYYY, the hours to two decimals, Separate Check `0` (the regular check) and Rate Code `BASE` (the first pay rate on the employee), with the owner's earnings codes, by default REG, OTP and DBL.

Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is downloaded inside Gusto, and its Smart Import matches columns on upload); Glove's column names (last name, first name, Gusto employee ID, regular, overtime and double-overtime hours; the first word of the technician's name is the first name) are therefore not confirmed against a Gusto-published layout.

The one column Gusto's help names, `workweeks`, is followed: one row per person and approved workweek, holding that week's date range as `YYYY-MM-DD - YYYY-MM-DD` beside that week's hours, so Gusto places overtime in the right workweek.

Glove keeps no SSN and writes no SSN column.

QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom upload takes one entry per line with the employee and a date plus units, the date format and each column's meaning chosen on upload; Glove's date-and-units file (employee display name, MM/DD/YYYY date, pay item Regular, Overtime or Double time, hours) is a file the owner maps on upload, not a confirmed Intuit layout.

The employee ID is the payroll ID the owner keeps on each technician record.

None of these files has yet been uploaded to a live Gusto, ADP RUN or QuickBooks account; Glove pays no one and files nothing.

Inheritance: `TEAM-003` commissions and spiffs and `PAY-002` technician tips add their amounts to the same payroll files (Gusto's commission and paycheck-tips columns, an ADP RUN earnings code with dollars) for the same approved weeks before either ships.

## COST-003 operating rules

Technicians and the office record expenses on a job (supply-house purchases, permits, equipment rental, subcontractor bills) with a receipt photo, vendor, amount and whether it is billable; billable expenses can be added to the invoice at cost or with markup.

## COST-004 operating rules

Every job shows its quoted price and estimated cost against actual labor (time × each person's loaded cost rate), materials at cost, expenses and subcontractors, giving actual margin and the difference from estimate; reports roll this up by job type, technician and period.

revenue is the latest person-approved invoice revision's subtotal before tax, else the accepted quote's subtotal.

The estimated cost is each accepted line's unit cost (kept when the line was priced from the price book, `MONEY-003`) × its quantity; a line without one counts at $0.00 and is named.

Actual labor is every travel and on-job entry (`COST-001`) at its whole minutes × that technician's loaded cost per hour ÷ 60; materials are the price-book materials recorded on the job at the item's unit cost now, beyond what the job's own purchase orders received (`STOCK-002`), whose received lines count at the order's unit cost; expenses and subcontractors are `COST-003`'s amounts, subcontractor bills apart.

Each product is rounded half up to the cent; a margin is (revenue − cost) ÷ revenue as a percentage to one decimal, rounded half up, and the difference from estimate is in dollars and margin points.

The owner sets each technician's loaded cost per hour; like every cost it is a margin figure, read only by roles that read reports (`MONEY-003`).

Reports take the jobs completed in a period (by local completion date, bounds inclusive) and roll them up by job type (the category of the job's first price-book line, else Uncategorized) and by technician (their minutes, labor cost and the jobs they recorded time on).

## COST-005 operating rules

When actual cost on an open job crosses an owner-set threshold of its estimate, or projected margin falls below a floor, Glove warns the dispatcher and the owner while the job is still open.

the owner sets, on the business, a cost threshold (warn when actual cost reaches this percentage of the estimate) and a margin floor (warn when projected margin falls below this percentage); either can be blank, meaning off.

After every command, each open job is checked with `COST-004`'s figures; its projected cost is the larger of actual and estimated cost, and a job with no estimated cost never crosses the threshold.

A crossing is one warning shown in Glove to the owner and to every dispatcher, on their desk screens and on the job's timeline; nothing is sent (no email or text).

A warning is kept once per job, kind and setting, so the same crossing never repeats; changing a setting can warn again.

Like every cost, warnings are read only by the owner and dispatchers they are addressed to, and their timeline entries only by roles that read reports.

## PAY-001 operating rules

An approved invoice is sent by email and text with a pay link, or presented on the technician's phone on site; a technician the owner allows prepares the invoice on the phone, offline if needed, and it sends exactly once on reconnect; invoices support net terms and due dates, progress invoicing on long jobs, batch invoicing of completed jobs, and statements per customer; completed jobs not yet invoiced are listed and the office is reminded daily; `GLOVE-09`'s revision and correction trail applies to every one; an invoice carries the customer's PO number (approval is refused when the customer requires one and it is missing) and goes to the customer's billing contact and accounts-payable address.

the existing invoice-preparation permission also prepares selected completed jobs together (`invoice.prepareBatch`, 1–50 distinct job IDs).

Each job uses the same accepted lines, priced materials, billable expenses, discount and tax rules as a single preparation and produces a draft requiring its own existing approval.

Results stay in selection order and name each prepared invoice or refusal; a refused item consumes no invoice number or expense and does not prevent the other items.

Branch limits apply to each job; an out-of-branch job returns no record details.

Replaying the same command returns the same result; a fresh request for an already invoiced job refuses it rather than duplicating it.

Activity and business export retain the individual preparations and the batch counts.

The Invoices screen offers selection, each result and links to review drafts.

the desk's existing report authority opens a customer's dated statement as JSON or downloads it as CSV from Customers.

Statements include only that customer's approved revisions and retained opening balances through the chosen date, subtract confirmed payment effects through each record's branch-local date, and keep currencies separate.

Unapproved corrections and pending, failed or returned payments do not reduce a balance; tips and fees are excluded.

Credits stay separate until explicitly allocated.

Dates remain frozen under GLOVE-09 and PLAN-005.

Branch scope, customer erasure and existing report permissions apply at the HTTP boundary.

Statements issue no payment credential and send no message.

A scheduled internal Activity reminder records completed work still awaiting invoice preparation or approval once per job and branch-local date, on the first pass at or after 08:00; approval and erasure are rechecked atomically.

This reminder sends no customer or office email.

existing invoice preparers explicitly name each stage and enter its priced lines for an accepted quoted job.

Every stage is a distinct draft under the existing exact-revision human approval, PO, terms, tax and correction controls.

Earlier stages require approval before the next stage; names are unique within the job.

The first stage freezes the accepted gross contract cap.

Drafts and corrections reserve their current gross amounts within that cap, and a final stage requires a completed job and exactly the remaining amount including tax.

Only a final stage export finishes invoicing the completed job.

No percentage, material, expense, discount allocation or charge is inferred; the preparer reconciles the explicit stage lines, including agreed discounts, against the accepted scope.

Job-held deposits attach only to the final stage.

Changed scope and automatic allocations remain separate unfinished work.

a signed-in Owner without branch limits explicitly allows or withdraws invoice preparation and approved invoice presentation for one active technician linked to their current sign-in.

This separate permission is off by default and grants no field price-book authority, approval, sending, payment, custom-role or integration-token authority.

A technician requests a draft only for their currently assigned, uncancelled visit on a completed job.

The phone's existing ordered outbox keeps the visit, capture time, actor and command identity through offline reload and a lost response; reconnection prepares one office-review draft without an external message.

Current authority and assignment are rechecked on execution and replay.

An unapproved draft reveals no prices to the technician.

With that permission, the technician state and kept offline day include only the customer-facing fields of an exact approved invoice revision on their current assigned job: document identity, lines, approved totals, PO, issue and due dates and approval basis.

Costs, credentials, private accounting details and payment balances stay excluded.

An unapproved replacement does not replace the last approved revision.

The phone labels the kept time and inability to discover later changes while disconnected; reconnection hides a kept presentation until a fresh authority and approval read.

Sign-out, changed identity, withdrawal on fresh read and DATA-001's received erasure fences clear retained access through the existing offline custody.

An offline destination cannot discover a later withdrawal or erasure without reconnecting to trusted current state.

Restore supplies no session or permission to a different identity.

This field permission permits preparation and presentation of the exact approved customer-facing revision, with FIELD-001’s common retention and reconnect fences; it supplies no approval, sending or collection authority.

Customer-payment bearer authority follows PAY-002 under RL-106.

PLAN-005 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

## PAY-002 operating rules

The owner connects their own Stripe account; customers pay invoices, deposits and agreements by card, Apple Pay, Google Pay or ACH bank debit; Glove records each payment only when Stripe confirms it (ACH as pending until settled), shows fees, and never touches raw card numbers. Card surcharging is off by default and, if the owner turns it on, carries the disclosure they configure. A customer can add a tip when paying online or on the `PAY-003` screen (owner-set choices); each tip is recorded against the payment and the visit's technicians, kept out of revenue and sales tax, and carried to the payroll export (`COST-002`, `TEAM-003`). The `REPORT-001` dashboard's "Paid today" tile sums the payments Stripe confirmed on the business's local today, tips apart; an ACH payment counts on the day it settles. The `REPORT-002` sales-tax report then counts tax collected from payments (until then its basis is tax on approved invoices, labelled so).

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. Under RL-106, an authorized preparer explicitly issues a customer-scoped hosted payment link for one approved invoice, deposit or agreement and intended customer. Its bearer exposes only that payment’s necessary approved facts and provider-hosted entry, with no other customer records or general login. Creation is show-once; current revision and amount, expiry and revocation, secret exclusion, one outstanding uncertain attempt and provider-confirmed settlement remain binding. A redirect infers no charge or receipt; customer-selected tips and every original payment method remain required.

the signed-in unscoped owner connects Stripe test mode with `payment.connect`, which requires Stripe’s balance API to confirm the key is not live; `payment.checkout` reserves an approved USD invoice payment before one fixed-endpoint Stripe Checkout attempt.

Card-hosted entry and ACH never pass account or card numbers to Glove.

A returned hosted URL is bearer material, shown only in the first response, excluded from records, saved outcomes and archives; a replay recovers the reservation without another attempt.

The public `/payment-return` acknowledgement never treats a redirect or its query parameters as payment confirmation.

Restored installations must reconnect their excluded private keys before another reservation is allowed.

Checkout facts expose only an irreversible reference hash; the provider session reference stays in the private archive-excluded attempt store.

Unresolved requests block a second request for that invoice.

`payment.receipt` is an explicit Owner/Office transactional email to the on-record accounts-payable or customer address through COMM-001.

Webhooks verify the raw-body Stripe signature and five-minute freshness before parsing; current intent retrieval verifies the connection, currency, gross amount, payment identity and test mode.

Confirmed effects reduce aging and feed paid-today and collected-tax totals, with tips apart; a failed charge or ACH return reverses them.

Each tip splits equally in exact cents among the completed visits’ distinct technicians (ID order receives remainder cents), and joins approved payroll weeks only.

Test mode is named in payment facts, receipts, aging and collected-tax basis; these are not live funds.

Provider outcomes and receipts read on the payment timeline, Activity, conversation stream and business export.

Property history includes each payment and its current provider state.

Duplicate-customer merge and undo carry payment ownership with the invoice.

After erasure, anonymous financial effects remain and provider/session references are removed.

The owner sets 1–20 distinct fixed-dollar tip choices, including zero, with `payment.preferences`; new connections default to zero only.

Preference edits affect future requests and keep existing reservations unchanged.

A rejected receipt leaves the payment confirmed; replay never sends again, and the office can explicitly send a new receipt after correction.

RL-106 replaces owner-only consumption with the customer-scoped payment door; the existing owner-only test slice does not complete that target.

## PAY-003 operating rules

Technicians take card-present payments on the phone (Tap to Pay on iPhone and Android through Stripe Terminal) or a paired Stripe reader, with the tip choices of `PAY-002`, the receipt texted or emailed and the payment on the job before they leave.

## PAY-004 operating rules

An invoice accepts several payments (deposit, progress, final, check and cash recorded by the office, cards the office keys in or charges on file under `PAY-009`); balances, overpayments and credits carry on the customer; the owner refunds all or part through the original method, and every refund is its own record linked to the payment. The `REPORT-001` dashboard's receivables tile is the sum of every invoice's unpaid balance.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

`payment.checkout` accepts an optional positive installment amount up to the invoice’s unpaid balance; the owner-only, show-once test Checkout boundary of PAY-002 remains.

The signed-in office or owner records cash/check receipts (`payment.record`) with a reference; these are staff records, never provider-confirmed claims.

Overpayments remain customer credit on their invoice.

`payment.allocate` explicitly moves available credit to an unpaid invoice of the same customer, currency and branch; it never transfers money.

The owner records a reasoned non-cash credit (`payment.credit`).

Only the signed-in owner refunds (`payment.refund`), at most the original confirmed amount less earlier confirmed or unresolved refunds, using the original method.

Refund `amount` is invoice principal and optional `tip` is separately bounded by the remaining original tip; a tip-only refund changes tips/payroll, never invoice balance or tax.

A subsequent return reverses only the remaining principal/tip, not a second copy of a prior refund.

Cash/check refunds record money already returned; Stripe refunds reserve durably before one provider attempt with an idempotency key.

Each refund has its own payment-linked record; pending/unknown refunds have no balance effect and are never automatically resent.

A pending provider reference can be read again (`payment.refundRefresh`); only provider-confirmed success reopens a balance.

Invoice/customer balances (`GET /api/glove/balances`), aging, Today’s receivables and the owner’s linked overdue brief use the same cent ledger.

Stripe test revenue/tips remain separate from office cash/check records.

Transactional receipts for payments and refunds use COMM-001 with actual delivery facts.

QUOTE-003 inherits job-held deposits and final-invoice allocation; PAY-009 inherits keyed/saved-method entry without bypassing these allocation/refund rules.

## PAY-005 operating rules

The owner sets a reminder schedule (before due, on due, after due); Glove sends it by text and email with the pay link, stops the moment the balance is zero or the invoice is disputed, and shows each invoice's reminder state. Customer-payment links follow PAY-002’s customer-scoped authority under RL-106.

## PAY-006 operating rules

On quotes above an owner-set amount, the customer can apply for financing through Wisetack from the quote or hub; Glove shows the provider's decision and offer, and records the payout when the provider funds; Glove never underwrites or lends. Under RL-107, the customer explicitly chooses financing from the exact owner-issued approved quote. Application approval is not payment: provider-reported funding must match the exact signed work before allocation. An uncertain application is not repeated automatically; Glove does not underwrite or handle customer credit credentials.

the signed-in unscoped owner configures only Wisetack's fixed test endpoint (`financing.connect`), an owner-only private auth token, merchant reference and minimum amount.

For a current price-approved owner-issued quote link, the customer chooses the exact work, enters an expected completion date and explicitly consents before requesting an application.

Glove sends only the chosen USD amount, completion date, generic service purpose and opaque purchase reference to Wisetack; no name, contact, address, SSN, income or other credit data is forwarded.

The provider-hosted application link is returned once, never retained in records, saved outcomes, logs, exports or archives; personal and credit information is entered only on Wisetack.

A durable reservation precedes the one provider request; an unknown outcome is never automatically resent.

The owner explicitly refreshes from Wisetack's authenticated transaction read door; the quote shows only its own provider status and reported APR/month ranges, labelled provider facts with final terms on Wisetack.

Approval is not money.

Funding is allocated only when the full provider-reported amount matches the winning signed chosen-document hash and exact job; it is held on that job until its invoice is prepared.

Duplicate reads create no duplicate payment.

Wisetack's fee stays separate; original-method refunds use PAY-004's reservation and separate linked refund record.

Activity, property history and export keep only whitelisted outcomes and references; DATA-001 erases the application and retains anonymous financial totals.

Glove never underwrites or lends.

COMM-006 inherits the same isolation, explicit consent, minimal data and provider-outcome rules before financing appears in the hub.

Production activation remains disabled; a live merchant account is needed only to activate a future live connection.

## PAY-007 operating rules

Each Stripe payout is matched to the payments, refunds and fees inside it; checks and cash are grouped into deposit batches; anything unmatched is listed with the reason, so the bank deposit, Glove and the books agree. Where Stripe offers Instant Payouts on the owner's account, the owner requests one to an eligible debit card with Stripe's fee shown before confirming, and it reconciles the same way.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

the owner inspects a USD Stripe test payout (`payout.reconcile`).

Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longer/incomplete list refuses reconciliation) and match confirmed payment/refund references, gross cents and fees; missing, unconfirmed, wrong-amount, wrong-fee/currency and unsupported sources are named.

Bank amount plus any payout fee must equal source net exactly, and only provider-paid payouts reconcile.

An unavailable payout fee refuses reconciliation; zero is never inferred.

Stripe does not attribute source payments to manual payouts.

Those require an explicit owner-reviewed books allocation (`payout.allocate`), never claimed as Stripe source attribution; unreviewed sources remain unmatched.

Cash/check deposits (`payment.depositBatch`) group 1–100 confirmed same-currency/branch records once, net of prior recorded refunds, as staff-recorded deposits without a bank-confirmation claim.

For Instant Payouts, the owner records their account-specific fee schedule (basis points and minimum, labelled owner-recorded and not verified by Glove); a preview checks an existing Stripe debit card's instant eligibility and funds, computes the half-up fee, and requires selected source net to equal the proposed bank amount plus that fee.

The owner explicitly confirms both displayed amounts within ten minutes; source availability, current connection, schedule, eligibility and funds are checked again.

A durable reservation and Stripe idempotency key precede one request.

Replay never resends an unknown outcome.

Sources cannot be allocated to another payout.

Reconciliation checks the actual payout debit, source allocation and actual fee against the confirmed preview; a difference stays unmatched.

Only the owner reads provider-wide payout and fee records; the office sees its branch's cash/check batches.

DATA-001 removes erased customer references from shared payout source detail while retaining anonymous aggregate bank history.

## PAY-008 operating rules

A customer saves a card or bank account in the hub or on site, with the authorization text and time recorded (for ACH, the recurring debit authorization the Nacha rules require); saved methods pay agreements and approved invoices automatically when the customer chose autopay, the office charges them on demand under `PAY-009` when the recorded authorization covers charges the business starts, and a failed charge sends an update link.

Only a signed-in Owner without branch limits may record customer permission or explicitly execute this preparatory payment flow.

Permission is an Owner-recorded account of the customer’s consent, not customer authentication or proof of consent obtained through Glove.

Retain its source, exact authorization wording, recorded time, recording Owner, customer, verified saved test-card reference, fixed-monthly rule identity and revision, cadence, maximum USD amount, and active or withdrawn state.

A replacement permission creates a distinct version and does not overwrite the earlier record; withdrawal remains attributable and timed.

The permission covers only the named card and fixed-monthly rule revision within the stated maximum.

Each full unpaid approved invoice requires the Owner’s explicit confirmation of its displayed invoice, card and USD amount.

Confirmation does not authorize another invoice or a retry.

An agent’s charge carries money, and the company’s policy decides it; restored state grants no new charge authority.

Provider requests are test mode only; live charges are refused.

Recheck current Owner authority, customer and card association, provider-verified card attachment, active permission, exact rule revision, running billing state, invoice approval, unpaid amount and cap before reserving one provider attempt.

Existing durable reservation, idempotency and authenticated settlement boundaries apply.

An unknown attempt blocks a further attempt; a decline does not trigger an automatic retry.

Withdrawal, paused billing or a changed card, rule revision, cadence or maximum refuses further requests until fresh permission is recorded.

Withdrawal does not erase the actual outcome of an already-authorized request in flight.

Refusals identify the required correction without exposing credentials or another customer’s records: “Owner access required”; “Test mode only; live charges are unavailable”; “Fresh customer permission is required for this card and billing rule”; “Billing is paused; no charge was requested”; “Approve the invoice before charging”; “The invoice must be fully unpaid”; “The invoice exceeds the authorized USD maximum”; or “A prior payment attempt is unresolved; no further charge was requested”, as applicable.

A refused request makes no payment-provider request and changes no invoice balance.

Record permission versions, withdrawal, explicit execution and provider outcomes with actor, time, permitted references and actual effect in Activity and business export.

Keep authorization evidence Owner-only and exclude raw payment data and credentials.

Customer erasure covers personal consent evidence, saved-method associations, personal command results and timeline copies under DATA-001 while preserving required anonymous financial totals.

Restore retains permitted business history but imports no provider credentials, creates no payment authority and resumes no charge.

Reconnection alone does not replace current permission or explicit invoice confirmation.

The trusted later erasure journal prevents an older backup from reviving erased evidence; an offline destination cannot discover a later erasure without that journal.

All original acceptance and PLAN-005 inheritance remain binding.

Gaps include customer-side card collection and consent, bank authorization, automatic agreement renewals and recurring collection, retries, PLAN-003 dunning and recovery, receipts, failed-charge update links and card updates, per-visit and on-close collection proof, and complete customer-facing journeys at 1440 and 390.

This policy establishes no payment-network or legal compliance.

## PAY-009 operating rules

The Owner, the Office role and any custom role granted "take card payments" (`TEAM-001`) open an invoice, a deposit (`QUOTE-003`), a cancellation fee (`BOOK-002`) or an agreement charge and press **Charge card**. They either key in the card the customer reads out on the phone, or pick one of the customer's saved methods (`PAY-008`) and charge it at once.
- **Keyed cards never touch Glove.** The card number, expiry and security code are typed into Stripe's own card-entry element inside Glove's page and go straight to Stripe; Glove's server, records, logs and exports never hold them. A keyed card is sent as a mail or telephone order (MOTO) where the owner's Stripe account allows it. Where Stripe demands customer authentication instead, Glove texts or emails the customer a pay link for the same amount.
- **Saved methods follow their authorization.** A saved card is charged on demand only when its `PAY-008` authorization covers charges the business starts; a saved bank account is debited only under an authorization that covers it (a Nacha recurring or single-entry authorization). Otherwise Glove refuses and offers the pay link. While keying a card, the office can save it for later charges only after reading the customer the consent text, which is stored with the method as its `PAY-008` authorization.
- **Paid only on Stripe's word.** Before confirming, the screen shows the amount, the card brand and last four digits, any surcharge under `PAY-002`'s settings and an optional tip. The payment is recorded only when Stripe confirms it, and lands on the invoice, the customer balance and the timeline with who charged it. A decline leaves the balance open and shows Stripe's decline reason.
- **Desk and phone alike.** The same command runs at the desk and on a phone 390 px wide (`FIELD-008`), under the same role checks. Anyone without collection permission is refused; an agent uses the sponsor’s collection role and grant, and its money-class call takes the company’s policy; a technician takes card-present payments on their own visits under `PAY-003`.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail. Under RL-104, attaching a saved card is not debit consent. Each charge needs matching current customer authorization and the caller’s collection role, with one reservation; an unknown charge prevents another attempt until reconciliation.

## LEDGER-001 operating rules

The owner connects QuickBooks Online; the first connection to a company that already holds records links them under `LEDGER-004` before anything posts. Glove keeps customers, items, invoices, payments, refunds, Stripe fees and deposits in sync, maps income accounts, tax codes and classes or locations once, and reads back payments recorded in QuickBooks; every sync error is shown on the record with the QuickBooks message and can be retried after a fix; nothing is posted twice. A customer with many properties (a property manager or landlord) can be mapped as a QuickBooks parent customer with a sub-customer per property: each property's invoices post to its sub-customer, the parent's statement rolls them up, and payments the parent makes against several properties are applied to each sub-customer's invoices.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

MONEY-001 inheritance: before this capability ships, post the frozen USD jurisdiction/tax snapshot with explicit existing-record mappings and assert the provider receives it to the cent; the current downloadable payload is inspection only, never a sync.

QUOTE-007 inheritance: before this capability ships, post each QUOTE-007 discount as the provider's discount line (tax after discount) with its non-taxable and taxable amounts and assert the provider fake receives the accepted figures to the cent.

only a signed-in unscoped Owner explicitly connects a QuickBooks sandbox company, verifies existing record IDs, confirms the pre-existing links, posts one record or reads one provider payment.

The access token is an installation secret, excluded from browser command storage, domain state, Activity, business exports and archives.

Same-company token replacement retains link identities; another company requires fresh links and confirmation.

Each mapped sales item retains its existing income account; optional class and department references and the transaction tax code are verified against that company.

Parent-billed properties must be actual sub-customers of their mapped parent.

An existing invoice number refuses creation until the owner links the matching customer, number and total.

A durable reservation precedes each provider write; replay retains the provider identity, a definite rejection permits explicit retry after repair, and an uncertain or interrupted operation blocks another send.

The owner may reconcile an uncertain result only to an existing record whose returned fields match the exact reserved content; this performs no new post.

The provider-confirmed tax and total must equal the frozen approved cents; a mismatch retains its reference for reconciliation.

Readback applies only exact, fully allocated USD payments to their mapped invoices and never counts Glove-origin payments twice.

Each allocation retains its invoice tax snapshot.

Provider effects already authorized in flight remain recorded if the initiating person loses authority; this grants no later send authority.

Full-invoice refunds preserve the approved tax and discount snapshot.

There is no automatic sync or retry, production connection, new customer payment authority or live-provider proof.

These preparatory semantics do not narrow LEDGER-001 or LEDGER-004.

## LEDGER-002 operating rules

The same as `LEDGER-001` for Xero; the existing sales-invoice CSV remains for owners who import by file.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

Xero inspection is off by default.

Only a signed-in Owner without branch limits explicitly connects and reads the fixed Xero Accounting API.

Custom roles and integration tokens are refused.

The tenant identifier and OAuth access token remain installation secrets, outside domain state, Activity, business export and archives.

The connection is verified with a read; replacement for the same tenant retains its local connection identity.

Inspection returns only whitelisted contact, item and sales-invoice summaries in the immediate response, not saved command outcomes or Activity bodies.

Provider errors refuse inspection, redirects are refused, and potentially incomplete lists refuse rather than claiming company-wide discovery.

Disconnect removes credentials; restored domain history grants no read or write access.

Inspection itself grants no posting, automatic execution, mapping confirmation or customer payment authority.

Xero has no QuickBooks-style sub-customer; this preparatory slice makes no property allocation claim.

CT approved preparatory default: Owner-only read inspection; the future connector must review an explicit parent-contact and property representation before any post, preserving all inherited allocation obligations.

CT scope ruling, 26 October 2026: Owner-only Xero inspection is approved as a preparatory default, with no posting, mapping confirmation, payment allocation or money-movement authority.

The complete inherited LEDGER-001 target and Xero-fake acceptance remain binding, including existing-record review, two property invoices, the parent roll-up and one parent remittance allocated to both invoices.

The product representation uses one reviewed Xero billing contact and distinct Glove properties, with each property invoice linked to its property and that contact.

A documented supported invoice reference or tracking dimension identifies the property without discarding the purchase-order reference; no QuickBooks-style contact hierarchy is assumed.

One parent remittance retains explicit invoice allocations; the proposed transport uses invoice-linked Xero payment applications grouped locally under that remittance, with provider identities and exact allocated cents, subject to official capability verification.

Readback must preserve each property’s balance and frozen tax and discount amounts without duplicate cash or payment echoes.

Existing branch, role, reviewed-link, approval, replay, uncertainty, audit, export, archive and erasure obligations continue to apply.

This representation supplies neither provider proof nor new write authority and does not narrow the target to read-only.

Gap retained after CT ruling: Owner-only inspection and CSV do not prove verified mapping, complete paginated discovery and first-post review, customer and item sync, frozen invoice, tax, discount and monthly-date transport, payment and refund sync and readback, durable replay, correction and uncertain-send recovery, fees and deposits, inherited parent and property allocations, owner screens at 1440 and 390, OAuth refresh or live connection acceptance.

Xero’s contact, property-reference, multi-invoice remittance and reconciliation capabilities require official primary-source verification; this ruling supplies no provider proof.

A separate explicit Owner command now verifies and records existing billing-contact and sales-item links, and a fresh fingerprint-bound command records their local review.

Neither command authorizes a provider write, first post or customer payment.

Provider identifiers are Owner-only on current reads, command outcomes and error records.

Credentials remain installation-private; customer erasure removes customer links and personal outcomes.

See [XERO.md](XERO.md) for the supported commands and retrieval limits.

Company action policy, 27 October 2026: Every Xero provider write, consequential link review, reconciliation and payment-readback effect carries the risk class provider-write through one installation-owned company policy hook.

The company policy chooses allow, review, approve or block.

An absent policy is not allowed; review and approve request a policy decision and execute no effect.

Only allow permits the existing separately authorized command.

There is no new product confirmation gate.

Policy is scoped to the local business and connection, excluded from archives, and checked again immediately before provider writes.

Audit records the class, action and decision.

Default inspection and fingerprint-bound local link review retain their read-only authority; neither grants accounting or payment authority.

The reviewed fake journeys explicitly install an allow policy for their own company.

This is conditional local proof, not a change to the retained CT inspection ruling or live provider proof.

## LEDGER-003 operating rules

For an owner who keeps their books in Pantry, Run Edit Run's accounting product, Glove posts the same records through Pantry's API with the same error and retry behavior.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

## LEDGER-004 operating rules

An owner moving in usually connects a QuickBooks Online company that already holds their customers, products and services and years of invoices, synced there by Jobber or Housecall Pro. On that first connection Glove posts nothing until the owner has reviewed and confirmed a link plan.
- **Proposed links.** Glove reads the company's customers (with sub-customers), items and open and recent invoices, and proposes a link for each Glove customer, price-book item and moved-in invoice. Customers match first by the QuickBooks customer ID the move-in carried where the source kept one (`MOVE-005`), then by display name together with email or phone. Items match by SKU, then by name. Moved-in invoices match by the carried QuickBooks ID, then by invoice number with the same customer and total.
- **Owner review.** The review lists four groups: matched (with the rule that matched), ambiguous (two or more candidates; the owner picks one or none), Glove records with no match (the owner approves creating each in QuickBooks or links it by hand), and QuickBooks records with no Glove counterpart (left alone, or brought into Glove through the `CUST-003` review). A QuickBooks name clash ("another customer already uses this name") appears in the review before anything posts, never as a sync error afterwards.
- **Only confirmed writes.** Confirming writes only the confirmed links and the new records the owner approved. A linked moved-in invoice is never posted again; later payments and refunds on it post against the QuickBooks invoice it links to. Each link records who confirmed it and can be changed until the first post that uses it. Reconnecting the same company keeps the links; connecting a different company starts a new review.

DATA-002 inheritance: before this capability ships, every new command, communication, payment or sync action and provider outcome keeps its actor/provider, time, references and actual effect in Activity and the business export; credentials and secret payloads never enter the trail.

MONEY-001 inheritance: before this capability ships, post the frozen USD jurisdiction/tax snapshot with explicit existing-record mappings and assert the provider receives it to the cent; the current downloadable payload is inspection only, never a sync.

QUOTE-007 inheritance: before this capability ships, post each QUOTE-007 discount as the provider's discount line (tax after discount) with its non-taxable and taxable amounts and assert the provider fake receives the accepted figures to the cent.

*Current command semantics (26 October 2026):* discovery reads every paginated customer (including inactive records and sub-customers), sales item and invoice, refusing an invalid or overlapping page or a company beyond 100,000 records per kind rather than offering a partial plan. Matching folds case and whitespace for names and emails and removes phone punctuation; it never matches on name alone. Existing verified same-company customer and item choices take precedence. Item SKU precedes name; an invoice uses its original imported number, linked customer and original total, not its remaining balance. Remote review names are returned transiently; Activity retains the read fingerprint, local and provider references and matching rules. An explicit customer creation must name the current review fingerprint, customer version and affirmative approval; it refuses matches, name clashes and unresolved earlier sends. Its durable reservation and provider reference use the existing sync custody and reconciliation. Confirmation records the actor on each link. A dependent reserved or completed post prevents reassignment of its accounting identities. The owner review uses these same commands. Carried source-ID matching remains unbuilt because the documented source shapes do not define those accounting fields.

*Owner review semantics (26 October 2026):* Team and settings groups matched records with their rules, ambiguous choices, unmatched Glove records and untouched provider-only records. Candidate customer names and contact fields, item names and SKUs, and invoice numbers and original totals are transient whitelisted comparison data. They stay in screen memory and are excluded from retained command results and audit bodies. Verifying matched groups uses each existing verified-link command and creates no provider record. Choosing none leaves an ambiguity unresolved; manual linking remains available. Each unmatched customer needs its own affirmative creation checkbox and the current review fingerprint. A visible name clash prevents creation, and the command rechecks the same boundary. Refresh follows each change. Final link confirmation refuses any unresolved pre-existing records and retains the confirming actor. Linked imported balances expose later payment sync without allowing the old invoice to be posted again.

## PLAN-001 operating rules

A job can repeat on a rule (every 3 months, the first Monday, twice a year in April and October), generating visits over a rolling horizon; one visit can be skipped or moved without changing the series; changing the series from a date forward keeps the past; each series carries the invoicing rule of `PLAN-005`.

the dispatcher or owner makes an open job repeat (`series.create`) from a first local date, at a visit start and end time with one technician, on a rule: every 1–52 weeks (on the first date's weekday), or every 1–52 months, or every year in named months, on a day of the month (the first date's unless given; a day the month lacks becomes its last day) or on the first to fourth or last given weekday of the month; intervals count from the rule's first date.

Dates are local dates in the business time zone.

The series may end on a date (inclusive).

Visits are booked for every occurrence through the earlier of that end and today plus the series' rolling horizon (7–730 days, 365 by default): at create and change, conflicts are reviewed under `GLOVE-05` as for one booking; after every later command the horizon rolls forward and the newly booked visits carry their conflicts unreviewed, named on the job timeline for review on Dispatch, and an occurrence that cannot be booked (for example an inactive technician) is recorded once on the series and named on the timeline.

Each visit is an ordinary visit carrying its rule revision and occurrence date: moving it (`visit.change`) or skipping it (`visit.cancel`, labelled skipped) leaves the series unchanged, and an occurrence that has a visit is never booked again.

Changing the series from a date (`series.change`, with a reason, not before its first date) starts a new rule revision there: visits on or after that date that are still booked and untouched (no arrival, never moved) are canceled with that reason and booked again under the new revision; earlier visits and moved, skipped, started or completed ones stay as they are.

Completing one visit leaves a recurring job open; a visit completes the job only once the series has an end date, has booked through it and no other visit of the job is booked.

The series' invoicing rule comes with `PLAN-005`, which carries it in its text and acceptance; until then a recurring job is invoiced as one job under `GLOVE-09`.

## PLAN-002 operating rules

The owner defines plans (for example a yearly HVAC "Comfort Club": price, term, included visits, member discount on repairs, priority booking); a plan is sold on a quote, in the hub or by phone; each agreement tracks entitlements used and left ("1 visit left, next April 3") and applies the member discount automatically. A plan can carry `FIELD-002` forms; each visit booked under the agreement takes a copy, as a job does for a service's forms. The `REPORT-001` dashboard's agreements-due tile counts the agreements with an included visit due and not yet completed or declined (`PLAN-004`). The `REPORT-002` reports gain the agreement count and churn (agreements ended or not renewed in the period) with this clause. A `CUST-004` segment's "no agreement" filter then excludes customers with an active agreement.

the owner defines a plan (`plan.save`: name, price in USD, a term of 1 to 60 whole months, 0 to 24 included visits of one price-book service, a member repair discount of 0 to 99.99%, priority booking on or off, and inspection forms). The desk (owner, dispatcher, office) sells it to a customer at one of their sites (`agreement.sell`), recorded as sold by phone, in person or on a quote that customer accepted; the agreement keeps a copy of the plan as sold, and one site holds at most one agreement in a term. Selling from the customer hub is `COMM-006`'s, which inherits this obligation before it ships. A term runs from the start date for the plan's months; its last day is the day before the same date that many months later (local dates in the business time zone, both ends included; a 31st becomes the month's last day). The k-th of n included visits (k from 0) is due on the start date plus floor(k × months ÷ n) months. An included visit is booked as a service call under the agreement (`job.create` with `agreementId`) at $0.00 for the plan's service, while the visits completed plus those booked and not yet completed are fewer than the included visits; it is used when a visit on that job is completed; the job takes the plan's forms besides its service's. `GET /api/glove/agreements` shows each agreement's included, used, booked and left visits and the next due date ("1 of 2 visits left, next Apr 3, 2027"). While an agreement is active (today inside its term and not ended by `agreement.end`), every quote option and service call for that customer drafted without an explicit discount takes the member discount as a `QUOTE-007` percent document discount named "<plan> member", which no role's discount limit refuses; an explicit discount replaces it and is held to the limit; included visits take none. The agreement, and its end, appear in the site's property history (`CUST-001`) as `agreement` rows, newest first. Priority booking is shown on the plan and on the member's agreement for the desk booking by hand; `BOOK-002` and `AGENT-001` inherit it and state and assert how they prefer a priority member before either ships. The `REPORT-001` agreements-due tile now counts each outstanding included visit due today or earlier under `PLAN-004`, including booked visits and outstanding work after term end, until completed or explicitly declined under `PLAN-004`. The `REPORT-002` agreements report (`/api/glove/reports/agreements.json|csv`) counts agreements sold in the period by the local date sold, by plan with their value, those active on the period's last day, and churn: agreements ended in the period or whose term ended in it (until `PLAN-003` renewals exist, an ended term is not renewed). A `CUST-004` segment's "no agreement" filter leaves out customers with an agreement active today, including on the Customers screen, where it is now a choice rather than always on.

## PLAN-003 operating rules

Agreements bill monthly or yearly through saved payment methods (`PAY-008`); renewal notices go out ahead of the term end with the terms state auto-renewal laws require the owner to show; customers can cancel or update their card in the hub; a failed charge follows the dunning schedule and the agreement shows its state.

## PLAN-004 operating rules

Every included visit due in a period appears in a due list until it is completed or the customer explicitly declines; the office books them in batches (by area and season) and sends booking links; nothing due is ever silently dropped. The due list's remaining visits are the `REPORT-001` agreements-due tile's visit count.

`GET /api/glove/due-visits` lists each included visit separately, identified by agreement and zero-based ordinal, with its PLAN-002 due date, customer, site, ZIP, linked job and booking state.

`through` defaults to the business's local today; optional `from` and `through` bounds include both ends; `area` matches the site's exact ZIP.

Completion removes only that entitlement, even if visits finish out of order.

Booking, cancellation, term expiry and ending an agreement do not silently remove outstanding work.

New included jobs keep `agreementVisitIndex`; older jobs take the first unclaimed ordinal in stored order.

An existing job is retained when its booking is cancelled, so the desk can rebook it.

Dispatch offers consecutive-slot batches through the existing `job.create` and `visit.book` doors, with their current authority and conflicts: each success and refusal is shown, and a refused or interrupted booking remains due.

The Office may now book only jobs linked to an agreement under the approved booking semantics below.

Today counts outstanding due visits, including those booked, and the owner morning brief links each one to its customer's agreement and Dispatch.

a decline is the customer's own explicit answer, recorded by a person as `GLOVE-04` records a quote's answer: the desk (owner, dispatcher, office) records it for one included visit of an agreement (`agreement.decline`: agreement version, zero-based ordinal, who declined, how — phone, email reply, text reply or in person — and their reason).

Glove never infers a decline from silence, a cancelled booking, term expiry or `agreement.end`.

It is refused for a completed or already declined visit, and while that visit has a live booking (cancel the booking first, under `GLOVE-07`).

The decline keeps the visit's due date, the recorder's name and role and the time, is appended to the agreement (never edited), is named on the Activity timeline (`agreement.visitDeclined`) and travels in the export.

A declined visit leaves the due list, the `REPORT-001` agreements-due tile and the `AGENT-008` brief; it is no longer "left" under `PLAN-002`, and no included job can be made for it.

The decline joins the site's property history (`CUST-001`) as an `agreement decline` row.

Customer links and the Office booking authority follow the approved semantics below.

the desk offers 1 to 10 future, currently conflict-free slots for one outstanding included visit (`agreement.offer`), retaining or creating its included job.

The revocable bearer link is shown once, stores only its hash separately from portable domain records, expires exactly 14 days after creation, and is revoked atomically when used or by staff (`agreement.offerRevoke`).

Like FIELD-003, restoring an archive retains offer metadata but requires a new link; old bearers are not restored.

The customer page offers only that included visit's service, site and slots, with each slot's booking time zone; it grants no account access.

The customer chooses one offered slot, under the offering person's current active role and branch authority.

Every choice repeats `GLOVE-05` eligibility and overlap checks; the public choice never acknowledges new conflicts.

A slot taken meanwhile is refused, showing only remaining open offers without other customers' conflict details.

No open offers means contact the office; the visit stays due.

The Office may `visit.book` only a job with an `agreementId` linking that job's customer and site, with the normal exact-conflict review, and may neither `visit.change` nor `visit.cancel`; the dispatcher keeps every other booking.

Direct HTTP calls enforce these restrictions; Office workflow rules retain API-005’s existing prohibition on automatic booking.

Created, used, revoked and staff-recorded outside-send events name the person and time in Activity and the business export, without the bearer.

`agreement.offer` with `email: true` emails the link through `COMM-001` to the customer's own email address on record (the link is still shown once in the response), and the offer shows its provider-reported delivery state; `agreement.offerSent` still records a send staff made outside Glove, labelled with the method and recorder and “delivery not verified”, with no delivery claimed.

The offer, its outside-send record and its use or revocation are `booking link` rows in the site's property history (`CUST-001`); an emailed link also appears there as a `message` row with its provider-reported state (`COMM-007`).

## PLAN-005 operating rules

Every recurring job (`PLAN-001`) has an invoicing rule, set when it is created and changeable from a date forward: per visit (each completed visit's lines and materials invoice on completion, or in a daily batch), a fixed price per period (the same amount on the last day of each month, or after each visit, whatever the visit count), once on close, or as needed (a reminder to the office, no draft). Glove generates the invoice drafts or reminders on that schedule and lists any recurring job whose billing date passed without an invoice. Autopay, receipts and failed-charge dunning are carried by `PAY-008` and `PLAN-003` under the ct carve of 22 October 2026 22:10Z. A skipped or canceled visit never bills a per-visit job; a fixed-price job bills whether or not its visits ran unless the owner pauses it. Drafts are approved under `GLOVE-09` unless the owner auto-approves a series' fixed invoices.

the signed-in owner sets a billing rule with a series at creation/change or `series.billing {jobId,version,from,billing,reason}`.

Its numbered revisions apply from a current/future local date and retain earlier billing.

Modes are per-visit, fixed-monthly, fixed-after-visit, on-close and as-needed (one month-end office reminder, no invoice).

Fixed rules keep their explicit priced lines; per-visit drafts carry only that visit's work/materials and unbilled visit expenses.

Skipped/canceled visits do not bill; paused periods do not bill; monthly fixed billing does not depend on whether visits ran.

Stable job/visit/month/close identities commit with the invoice or reminder, so replay, concurrent commands and cron runs cannot duplicate them.

A capture already claimed by one invoice is not billed again after a forward rule change.

The Worker cron and ordinary mutations generate due drafts; opening state is read-only.

The office can run `series.billingRun` and reads `/api/glove/recurring-billing` for dates without an invoice/reminder and the concrete missing-price/PO problem.

Existing series retain their old job-wide workflow until the owner explicitly configures a rule.

The owner may explicitly authorize automatic approval only for a rule's fixed invoices.

The pass rechecks the configuring owner's current active Owner role and branch scope at commit; no other person's rule or a later edited draft borrows that grant.

Otherwise normal GLOVE-09 approval applies.

Drafts say “Proposed — not approved, not sent” and count nowhere in aging, revenue, tax, exports or QuickBooks.

For newly generated fixed-monthly invoices only, approval on/after period end freezes issueDate at that period end, records approvalAt and approver separately, and freezes dueDate = max(periodEnd, approvalLocalDate) + terms.

Late approvals are labelled; aging begins only after approval and ages from that frozen due date.

Revenue/tax/CSV/QuickBooks use the frozen issue date.

Terms changes, correction and later export do not move those dates; preexisting documents and outputs are unchanged.

No charge, receipt or dunning is added by this slice; PAY-008, PLAN-003 and COMM-001 carry those remaining acceptance obligations before autopay ships.

## STOCK-001 operating rules

Each van and warehouse holds stock of price-book materials with counts; materials used on a visit come off that technician's van; transfers and restocks are recorded; low stock against a par level shows on the van; the day's jobs list the parts they need and whether the van has them.

the owner and office keep stock locations (a van per technician, and warehouses) holding price-book materials only, counted in the material's unit to a thousandth; par levels are set per location and material.

A stocktake sets a count, a restock adds, a transfer moves between two locations and is refused when the source holds less; a material from the price book that a technician records on a visit (`GLOVE-06`, so also offline) comes off that technician's van, and a count may go below zero, shown as such.

Every movement is a stock-move record with who, when, the change and the count after, and a timeline entry.

An item is low when its count is at or below its par.

The parts a job needs are its lines' materials, and a task line's material contents, at their quantity times the line's quantity; the day's parts check walks one technician's visits on a local date in start order, and a part is on board for a job when the van holds enough for that job and every earlier job that day.

A technician reads only their own van and their own day.

## STOCK-002 operating rules

The office raises purchase orders to suppliers (by email or supplier portal), receives them fully or partly into a van or warehouse, and links job-specific orders to the job's cost.

the owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (with an optional email) of 1 to 50 price-book materials, each at a quantity to a thousandth of its unit and the supplier's unit cost (the item's price-book cost unless given), delivered to one van or warehouse (`STOCK-001`), for stock or for one job; it changes only while a draft.

A draft order goes to the supplier in one of two ways, and the record and timeline say which: the owner or office emails it from Glove to the order's supplier address, or another address the person names, through the owner's connected email (`COMM-001` `email.send` with kind `purchaseOrder`; the order then reads sent, naming the email, with the provider's reported outcome, where delivered means only that the supplier's mail server accepted it), or the person sends it outside Glove by email, the supplier's portal, phone or in person and records that method with the supplier's reference, which is recorded as sent with no delivery claim.

Glove has no supplier-portal connection.

Only a sent order is received, in one or more parts, each line at most what is still due; each part adds to the delivery location's stock as a stock move naming the order (and its job), and the order reads partly received until every line arrives.

A job's received lines count to its actual cost (`COST-004`) at the order's unit cost; a price-book material recorded on that job counts at its price-book cost only beyond the quantity the job's orders received of it, so nothing is costed twice.

A job order shows on the property history (`CUST-001`).

Unit costs are margin figures (`MONEY-003`): purchase orders are read only by roles that read reports, never by technicians.

## TEAM-001 operating rules

The owner builds roles from named permissions (for example a CSR who books and takes card payments under `PAY-009` but cannot see margins or refund, a lead technician who can approve field quotes), each enforced by every command handler and read door as the built-in roles are.

## TEAM-002 operating rules

A business with several locations keeps branches with their own time zone, technicians, service areas, tax settings, numbering and reports, under one owner; people can be limited to their branch. Each branch carries its revenue rows and a branch filter in the `REPORT-002` reports.

the owner creates branches with an IANA booking zone, a unique alphanumeric number prefix and service ZIP codes.

New sites choose their branch and keep it; the first site assigns its customer to that branch, and all of that customer’s sites stay in it.

Technicians belong to a branch; crews never mix branches.

Quotes, service calls, assessments and their jobs and invoices inherit the site’s branch, with independent per-kind counters (for example RAL-J-1001 and RAL-INV-0001).

The prefix is fixed after the first number.

Legacy sites, technicians and documents remain in the main business branch with their original numbers and business zone.

A visit records its booking zone and exact instants; later branch-zone edits affect new bookings and moves, never rewrite existing visits.

A technician must belong to the job’s branch; the existing area warning/refusal rule also applies to its branch ZIP codes.

The Dispatch branch choice shows its own technicians, work and local zone.

Actual per-branch US tax settings and the REPORT-002 tax-jurisdiction rows ship with MONEY-001, which carries them in its text and acceptance.

Revenue reports include branch rows and a branch filter in JSON and CSV, dating each invoice by its branch’s local first-approval date (both period ends included).

The owner limits a person to a named branch or the main business branch, or removes that limit.

The installation owner retains all-branch access.

Limits apply to every current read and command door, including files, Activity, history, reports, business/CSV exports, saved command outcomes and workflow actions under their creator’s live scope; a changed limit is rechecked in the commit guard.

Scoped people read and change only operational records rooted in their branch; shared business reference data remains readable under their existing role and is read-only for them.

New operational records created by a scoped person belong to their branch.

Customers cannot merge across branches.

Every existing report accepts the branch filter in JSON and CSV; future record kinds, read doors and reports inherit the same scope before shipping (API-002/003, COMM-001..009, PAY-001..009, LEDGER-001..004, PLAN-002..005, MOVE-001..006).

## TEAM-003 operating rules

The owner sets commission rules (percentage of sold or completed revenue, per-agreement spiffs) and Glove computes each technician's earnings per pay period for the payroll export, alongside each technician's tips (`PAY-002`).

the owner alone (acting for "admin") sets commission rules in payroll settings: a percent of sold revenue, a percent of completed revenue and a fixed spiff per agreement sold, each optional (percents from 0 to 99.99 with up to two decimals; the spiff in USD).

Each save is a rule version applying from a local date (today unless the owner gives one), replacing any version from that same date; a credited sale takes the version in force on its local date in the business time zone, so a later change never alters earlier earnings.

Rules apply to every technician.

Sold revenue is an accepted quote's accepted total before tax (the chosen option and add-ons after any `QUOTE-007` discount), credited to the technician the desk names as its seller when recording the acceptance, on the local date the acceptance was recorded; a quote accepted with no seller credits nobody.

Completed revenue is `REPORT-002`'s technician revenue: an invoice's latest approved revision before tax, split equally among the technicians who completed the job's visits (the cent remainder to the first by name), on the local date of its first approval.

A spiff is credited to the technician the desk names when selling a `PLAN-002` agreement, on the local date it was sold.

Each credited sale's commission is its base × percent, rounded half up to the cent; totals are sums of those amounts.

Earnings are computed for the pay period when the payroll files are read, and the owner's timesheet approval covers hours only.

They join `COST-002`'s payroll files for the same people: Gusto's `commission` column on each workweek's row (a workweek with commissions but no time gets its own row with zero hours), one ADP RUN row per person with the owner's commission earnings code (default `COMM`, set to the code the owner's RUN earnings report shows), blank Pay Hours and the total in Dollars, and one QuickBooks Payroll `Commission` line per person and local date with the amount in an Amount column.

A technician with commissions but no approved time in the period is left out of the files with that reason; a 1099 subcontractor is never in them.

The payroll JSON gives each person's sold, completed and agreement amounts and every credited sale.

Commission columns, like the hour columns, are not confirmed against a live Gusto, ADP RUN or QuickBooks account; Glove pays no one.

Inheritance: technician tips do not exist today; `PAY-002` adds each technician's tips to the same files for the same approved weeks before it ships, and `QUOTE-006` field quotes and `COMM-006` hub sales credit their selling technician under these rules before they ship.

## REPORT-001 operating rules

The owner's home shows today's jobs and their state, technicians on the clock, revenue booked and paid today, open quotes, unbilled completed jobs, receivables and agreements due.

the owner's home is Today, read from `GET /api/glove/dashboard` by every role that reads reports (never a technician). "Today" is the business's local date in its timezone. Today's jobs are the jobs with a visit, not canceled, starting on that date, each with the job's own state (open, completed, invoiced). Booked today sums the accepted total, tax included (the chosen option and add-ons under `QUOTE-001`), of each quote whose acceptance was recorded that date. Open quotes are draft, approved and sent quotes, valued at their latest revision's first option's total. Completed, not invoiced counts completed jobs whose invoice has not been exported. On the clock lists the technicians with a shift clocked in and not out (`COST-001`). The other tiles ship with the clauses that keep their records, each carrying its tile in its text and acceptance: paid today with `PAY-002`, receivables with `PAY-004`, agreements due with `PLAN-002` and `PLAN-004`; until a tile's clause ships, Today shows no such tile rather than a zero.

## REPORT-002 operating rules

Reports for revenue by period, job type and branch; technician revenue, close rate, callbacks and hours; lead source conversion; quote win rate; agreement count and churn; job margin (`COST-004`); and sales tax collected by jurisdiction and period, so the owner can file between accounting syncs; each filterable and exportable as CSV.

every report takes a period of local dates in the business time zone, both ends included, and one filter, and answers as JSON or as a CSV of the same figures, read by the roles that read reports.

Revenue is an invoice's latest person-approved revision subtotal before tax, counted once and dated by the invoice's first approval; the revenue report gives it by month and by job type (the category of the job's first price-book line, else Uncategorized, as in `COST-004`), filtered by job type.

The technician report gives each technician's revenue (each such job's revenue split equally among the technicians who completed its visits, the cent remainder to the first by name), visits completed in the period, callbacks (a completed visit followed within 30 days by a new job at the same site) and their rate, and hours (their clocked shifts that began in the period, to a tenth of an hour), filtered by technician.

Lead-source conversion counts the requests made in the period by source (`BOOK-003`'s figures), filtered by source; the quote win rate is quotes accepted ÷ quotes answered (accepted or declined) in the period, with the won value, filtered by the request's source; job margins are `COST-004`'s period roll-up, filtered by job type.

The sales-tax report sums the tax on approved invoices by month in one row per branch and jurisdiction, from each invoice's frozen `MONEY-001` tax breakdown (an invoice approved before `MONEY-001`, which has no breakdown, reports its tax under the business's former single jurisdiction), and says its basis: tax on approved invoices, because Glove records no payments yet.

Percentages are to one decimal, rounded half up.

The branch filter (`TEAM-002`) narrows every report to one branch's records and the revenue report also gives revenue by branch; the agreements report is `PLAN-002`'s (agreements sold in the period by plan with their value, those active on the period's last day, and churn).

Technician close rate from field quotes (`QUOTE-006`) and tax collected from payments (`PAY-002`) come with those clauses, which carry them in their text and acceptance.

PLAN-005 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

## REPORT-003 operating rules

An aging report (current, 1–30, 31–60, 61–90, over 90 days) by customer with links to each open invoice and its reminder state.

the first human approval freezes the invoice's issue date in its branch's local zone, business payment terms in calendar days and due date. Export, corrections and later business settings never move these dates. Legacy invoices without retained terms use their first approval date plus current business terms, labelled "due date computed from first approval and current terms". The report uses the latest approved revision on or before its chosen `asOf` local date; an unapproved draft or correction contributes nothing new. With no payments recorded yet, a positive approved total is the open balance. Each customer's invoices and total are split into current (due today or later), 1–30, 31–60, 61–90 and over 90 calendar days past due, boundaries inclusive, in exact cents and separately by currency; every invoice links to its normal invoice screen. The report states "No payments recorded yet" and "No reminders scheduled". PAY-002 and PAY-004 inherit confirmed payment, allocation, credit and refund effects on these balances, and PAY-005 inherits actual reminder state, each in its text and acceptance before shipping. The existing reports permission and branch filters apply to JSON and CSV alike. PAY-dependent homepage claims stay partial.

## MOVE-001 operating rules

The owner moves in from the client-and-property source system (clients, properties, contacts, requests, quotes, jobs and visits, recurring jobs, invoices with open balances, the price book of products and services, notes and attachments) through the source API with the owner's own access, or its CSV exports (including the products and services export), under `GLOVE-11`'s dry run, journal and undo; source IDs are kept; what does not map is listed.

imported source quotes retain their source status, terms and cent-reconciled lines as read-only history; a source approval creates no Glove approval, signature, send or new job.

New customer decisions use a new native quote.

Imported invoice lines reconcile with the source amounts and balance report, including document discounts; every job belongs to the same source client, and a multi-job balance counts once.

Closed source jobs stay archived.

Job-owned notes retain source time, and downloaded job attachments retain exact bytes without fetching source URLs.

An unscheduled source visit is explicit pending history on its job, with no invented time or capacity reservation; the dispatcher books native work explicitly.

Source recurrence definitions stay visible but inactive until an exact rule mapping exists.

Unsupported shapes remain named in preview.

## MOVE-002 operating rules

The same as `MOVE-001` for the service-plan source system, including service plans and price book.

saved Housecall Pro public API responses use the existing owner-only dry run, reviewed fingerprint, source journal and guarded Undo.

Price-book monetary integers are cents; invoice quantities are hundredths.

Imported invoices retain dated remaining balances and cannot become new sales.

Existing source visits arrive without starting future schedules.

Source roles grant no sign-in.

Unknown fields and unsupported rules are named; nothing sends or charges.

Housecall Pro leads retain source identity, customer and optional site, source and pipeline labels, and open, won or lost state; unknown source stage times stay unknown.

Invoice discounts are non-negative source cents represented as negative lines, with each item amount, gross subtotal, discounts, tax and final total reconciled before import.

## MOVE-003 operating rules

The same as `MOVE-001` for the location-and-membership source system, including locations, equipment, memberships and their recurring services.

the owner loads saved V2 response files from the location-and-membership source system and downloaded attachments through the existing move-in dry run, reviewed fingerprint, journal and guarded undo.

Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assignments, service and material price-book entries, notes, attachment bytes, equipment and warranties remain linked.

Invoice remaining balances are dated opening balances, never a new sale or an approved invoice to repost.

One source membership remains one agreement, including ongoing or multiple-location terms; each source recurring-service event keeps its own site, template SKUs, quantities, exact due date and completed or source-closed state.

Its source billing template is labelled separately from charge permission, and unavailable member benefits are named.

Monthly rules with one day and weekly rules with one weekday matching their anchor map to inactive native proposals; a person explicitly chooses a technician and times before activating a mapped rule strictly after exported events, with its original end date.

Nothing is scheduled, emailed or charged by importing.

A shape without an exact native rule, an unknown field, missing bytes or a rejected parent is named in the preview and its source is retained, as `MOVE-001` requires.

`MOVE-005` retains carried QuickBooks references and the cutover checklist; `MOVE-006` retains saved methods, autopay and processor authorization; a real owner-export journey is recorded when available (`MOVE-001`).

## MOVE-004 operating rules

The same as `MOVE-001` for the recurring-report source system and the additional job source system.

FieldPulse saved job responses may be accompanied by its documented Recurring Jobs CSV report.

The report's Recurring Job ID joins only exact `recurring_parent_id` values, never customer names; conflicting or absent customer/site parents are rejected.

One definition remains one inactive job proposal with source frequency, anchor and end condition retained.

The report's last generated occurrence and every exported occurrence, including later exceptions, bound explicit activation under the existing `series.create` guard.

Exactly matching weekly weekday wording maps to a native weekly proposal; other frequencies are named as unmapped and retained without guessing (FieldPulse's absent-month-date skip must not become Glove's last-day clamp).

A person must choose a technician and times and explicitly confirm activation after all exported work, retaining the source end condition.

No import schedules, charges or sends anything.

Workiz remains partial until its future-rule source encoding is available.

MOVE-005 retains accounting references, agreements/equipment and cutover; MOVE-006 retains saved methods, autopay and processor authorization.

## MOVE-005 operating rules

Every kit carries open invoice balances (as opening balances that `LEDGER-*` does not post twice), every accounting reference the source kept (the QuickBooks Online customer, item and invoice IDs its sync wrote, used by `LEDGER-004` to link rather than re-post), active agreements with remaining entitlements and renewal dates, installed equipment, and saved cards, bank accounts and autopay authorizations (`MOVE-006`); a guided cutover checklist tells the owner what to switch off in the old system and when, including the payment processor's export request and its freeze window.

## MOVE-006 operating rules

Each kit carries every moved-in customer's autopay: the agreements and recurring jobs that charged a saved card or bank account. Card and bank numbers move processor to processor, never through Glove: the `MOVE-005` cutover checklist tells the owner to request the old processor's export to Stripe (Stripe's PAN import, about 10 business days) and names the freeze window between export and import, in which card updates made in the old system are lost and must be collected again. When Stripe completes the import, the owner loads Stripe's mapping file (old customer and card IDs to new Stripe customer and payment-method IDs); Glove attaches each imported method to its moved-in customer and to the agreements or recurring jobs it paid, keeping the original authorization reference, consent date and source as the `PAY-008` authorization record. Glove lists every autopay agreement or recurring job with no migrated method, sends those customers a tracked card-update link (`COMM-001`, `COMM-002`) before their next charge, and shows who has updated. A renewal or recurring charge with no method is held as "needs payment method" with a reminder, never charged and never counted as a failed payment for dunning.

## API-001 operating rules

Every read and command people use is a documented HTTP door ([API.md](https://github.com/just-every/run-glove/blob/main/API.md)) that agents and integrations call under the same roles and checks.

## API-002 operating rules

The owner issues scoped tokens for integrations, each acting as one role, revocable; webhooks fire signed events (request created, quote approved, visit booked, job completed, invoice paid) with retries and a delivery log.

only the owner issues (`token.issue {name, role, branchId?}`) and revokes (`token.revoke`) integration tokens.

A token acts as one role: Dispatcher, Office, Agent, Viewer or one of the owner's custom roles, never Owner, Technician or Subcontractor (field roles act for a person on their own visits).

Without `branchId` it reaches every branch; with a branch id, or `main` for the main business, it is limited like a branch-limited person (`TEAM-002`).

The token (`glv_` and 43 base64url characters from 32 random bytes) appears once, in the issuing response; Glove keeps only its SHA-256, never in records, the saved command outcome a replay returns, Activity, exports or the portable archive (restored installations issue new tokens).

A request with `Authorization: Bearer <token>` acts as that role through every read and command door, without the same-origin check sessions need.

Each request checks the token is unrevoked, and each commit re-checks in its atomic batch that the token is unrevoked, still holds its role, and that a custom role's permissions are unchanged; a revoked token is refused (401) from its next request.

Agent-token changes to other tokens, roles, assignments, grants or branch limits carry access; provider-key or calendar-credential changes carry security.

The company’s policy decides within the sponsor’s current authority.

A call never widens its own authority or changes policy or Pause.

What a token changes is in Activity under "<name> (integration token)" with its role; the owner's token list shows each token's role, branch, issue time, last use (every request) and revocation, never the token or its hash.

A workflow rule a token created runs as that token's current role and branch, and is logged "not allowed" once the token is revoked.

Signed webhooks, the other half of this clause, are not built yet: the delivery host must be checked on its resolved address with no DNS-rebinding gap, which waits on the Base egress door (gr-base-285); `invoice.paid` is carried by `PAY-002`/`PAY-004`.

## API-003 operating rules

Published Zapier and Crank apps expose Glove's triggers and actions (create request, create customer, new paid invoice) for cross-app automation.

## API-004 operating rules

Photos taken in CompanyCam for a job's address appear on the Glove job, and Glove job photos can be sent to the CompanyCam project.

the owner saves or disconnects a CompanyCam Public API access token as an installation secret, excluded from state, exports, logs and archives.

Saving it is labelled unverified.

The owner or dispatcher links a job to an existing project by numeric id; its recorded address must match the site's address after case, whitespace and punctuation normalization, without claiming postal validation.

Imports and exports are explicit actions on that job.

Imports consume every cursor page, retain provider photo ids and capture times, and show original photos with captions labelled CompanyCam, never as technician arrival or sign-off.

The existing Glove JPEG/PNG/WebP and 1.5 MB photo limits apply, with a visible error for every unsupported, oversized or unready photo; none is silently skipped.

Repeating an import creates no second copy.

A selected original Glove photo sends only its bytes and caption to that project; no customer identity, contacts, job prices or other fields are sent.

A durable, current-authority-checked reservation precedes the upload.

Its provider photo id and caption outcome are kept; repeating a send never sends that photo again.

An uncertain upload is labelled “outcome unknown; check CompanyCam” and is never resent.

The owner can reconcile it to an existing photo in the same project only after its original-byte SHA-256 matches; this confirms the photo without claiming any unconfirmed caption.

Exported photos do not loop back into the job; a photo matching an uncertain upload is held with a visible reconciliation error.

Link, import and export outcomes and provider ids are audited on the job; whole-business export and the portable archive retain references and upload reservations, never the token.

Every command and read door checks the current role and job visibility.

## API-005 operating rules

The owner sets rules of the form "when this happens, do that" on Glove's own events (when a job with the "commercial" tag completes, assign the invoice to a named office person; when a quote over $5,000 is approved, notify the owner; when a request comes from Angi, apply its lead cost), each with a run log and an on/off switch; a rule can do only what its creator's role can.

the owner and the office make rules (`rule.save`); a rule's creator or the owner changes it or turns it off.

A rule has a trigger among Glove's own events (a request created, a quote's price approved, a job created, a job completed), an optional condition (the request's source; the quote's or job's total over an amount, tax included) and one action: an in-app notice to a desk role or to one named person who holds a desk role , booking a job just created with a technician a number of days later at set times, or assigning a job just completed's invoice preparation to one named person who prepares invoices (the owner or an office person), shown on the job with a notice to them.

After every command, each enabled rule whose trigger that command raised runs once, as its creator's current role checked at run time through the same command checks: an action that role cannot take is logged "not allowed" and does nothing, and a booking with a conflict is logged "refused" (a rule never confirms a conflict review).

Every run is logged with the rule and its version, the triggering record, the outcome and why, and is shown with the rules on the Rules screen; what a rule does never triggers another rule.

A customer-tag condition comes with `CUST-004`, and applying a lead cost (`leadCost`, on `enquiry.created`) with `BOOK-004`, which carry them in their text and acceptance.

## DATA-001 operating rules

On a customer's request the owner exports everything Glove holds about them, or erases their personal data (name, contacts, addresses, messages, recordings, photos of people), keeping invoices and payment records the business must retain for tax with the person's details removed; each request is recorded with its outcome.

MONEY-001 inheritance: erasure removes every private exemption-certificate original/chunk and its evidence metadata, and the restore fence prevents an older backup from reviving them; assert this through the customer erasure door before shipping.

only a signed-in owner without branch limits, never an integration token or custom role, requests whole-customer export or explicitly confirms erasure.

The request closes over every merged identity and its receipt lists every merged ID.

Export includes related records, full timeline and base64 original files/certificates; shared CSV/ServiceM8 sources are projected to this customer’s complete source rows/objects, never peer records, with any mixed-ownership source omission explicitly named; its download is shown only in that response, never in saved command outcomes.

Erasure removes personal operational records, attached originals and certificate chunks/evidence, customer-link credentials, delivery-recipient/event copies, personal timeline text and command results.

Anonymous customer/site/job placeholders, invoice amounts/dates/classifications, job costs and tax totals remain; erased records cannot be edited or unmerged.

The Base redaction checkpoint and transfer invalidation commit atomically with the erasure; the destination fence or a trusted later post-erasure backup supplied as the import journal refuses an older checkpoint.

A fresh offline destination cannot discover an erasure without that trusted later journal; the owner is told to keep it.

an import source can hold one person's customer and site in one record and several people's originals in one artifact.

Erasure first produces a preview bound to the customer group's current version.

The preview gives counts per store and names: each import batch whose Undo/resume will be retired and why, each shared original artifact that will be withdrawn, and the number of peer customers whose source file becomes unavailable.

Confirmation repeats the preview's fingerprint, and a stale preview is refused.

The subject's records in every affected batch become zero-effect tombstones, so peers' Undo and resume keep working.

A batch's whole Undo/source custody is retired only when the import kit cannot tombstone the record or a batch header holds the subject's exact value; its source is then labelled withdrawn.

A withdrawn shared artifact is removed whole.

Peers keep their per-record source payloads and their exports name the byte-exact file as an omission.

Subject values are the group's exact typed identifiers (name, email, phone, address, contact name/phone/email, certificate number).

Peer-owned records that mention them have only those values redacted and are never deleted.

Rewritten identifiers are keyed or random, never a plain hash of a personal value.

No send or remote deletion happens.

At the next successful device refresh, value-free fences remove the earlier assignee's cached day, photo cache and queued captures for erased visits; losing an assignment alone never discards late evidence.

A disconnected device cannot observe erasure until it reconnects.

Only a signed-in owner without branch limits confirms today.

A TEAM-001 privacy permission may later delegate the door.

Agents may prepare a request for a person's decision under GLOVE-10/AGENT-009.

A token or agent never records a person’s confirmation.

An agent’s own erasure act carries destructive and sensitive, with the company’s policy deciding the call under its sponsor’s authority.

QUOTE-005 proves its snapshot/attachment erasure in the document flow; future MOVE-001..006, QUOTE-006, COMM-002/005/006/009, PAY-002/004/007/008/009 and LEDGER-001..004 inherit their additional personal stores before shipping.

Outside copies and holds are DATA-005.

## DATA-002 operating rules

Every command, message, call, payment, sync and agent action is on the timeline with who (or which agent or provider), when and what changed, readable in Activity and exportable.

DONE covers every current capability.

Every committed Glove command must supply an explicit timeline event; an eventless command is refused before its changes commit.

An event keeps its actual person/agent/rule-creator identity, time, command id, subject and effect.

The command's first event also keeps the ids, before/after versions and changed field names of its changed records, without copying private field values.

Activity's changed-record details follow the same current visibility as the underlying records.

Provider response facts identify the provider and a generic outcome, never credentials, endpoints, keys or payloads; current model, audience, CompanyCam and Web Push outcomes are recorded separately so the fact survives a lost final command commit.

Web Push records subscription/technician/job ids and HTTP status only, including 404/410 and unreachable services; it never claims delivery to the phone.

Subscription setup/removal, marketing disconnects, custom-field/tag/segment edits, stock locations, purchase-order revisions and rule changes/runs have their own explicit events.

Activity loads older events by sequence, with current role/job checks on every page; its loaded history is discarded when the installation change version or reader changes.

Export keeps the whole append-only timeline and provider references.

Every future clause adding a capability, provider, record kind or door inherits this obligation before it ships.

The absent customer-message/call/portal kinds are carried by COMM-001/002/005/006/009, payments/refunds/payouts/office charges by PAY-002/004/007/009, and accounting syncs by LEDGER-001/002/003/004, each named in its text and acceptance.

Homepage claim 55 includes those missing call/message/payment capabilities and stays partial.

PLAN-005 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

## DATA-003 operating rules

`rer deploy` puts Glove on the owner's Cloudflare account with their domain, backups and the provider secrets above, and the hosted installation passes the same acceptance flows as a local one.

## DATA-004 operating rules

Glove is MIT-licensed with no per-technician fee; `rer install`, `rer setup` and `rer dev` run a complete installation on the owner's own computer from a fresh checkout, and the owner keeps every record.

## AGENT-001 operating rules

answers the business's calls and texts 24/7 (always, after hours or on overflow, by owner setting), speaks and writes like the business, identifies the caller and their property, qualifies the problem, quotes flat-rate prices from the price book, and books into a real open slot (`BOOK-002`, `DISP-006`), then texts the confirmation; every call and thread gets a written summary, and the lead's details (name, address, problem, equipment, urgency) are extracted onto the request. Its data is the price book, technician capacity, skills and areas, the customer's history and equipment, and the owner's call script and policies. Internal intake and reversible booking carry standard; customer replies and confirmations carry external, charges carry money and binding offers carry commitment. The company’s policy decides what runs or needs a person. A provider step requiring a person carries gated.

## AGENT-002 operating rules

for each next-day visit, confirms access (gate codes, pets, who will be home) with the customer by text, checks the parts the job needs are on the van or at the supplier (`STOCK-*`), and that permits, deposits and equipment history are in place; marks each visit ready or not ready with the reason. Its data is tomorrow's visits, customer threads, van stock, purchase orders and the job's quote lines. Readiness preparation is standard; outside access or parts requests carry external and a binding supplier order carries commitment. The company’s policy decides every such call.

## AGENT-003 operating rules

watches the day (technician locations, running timers, supplier delays, cancellations) and when a visit is likely to be missed, prepares a feasible reschedule that respects windows and skills, with options to offer the customer. Its data is the dispatch board, `DISP-005` locations, `COST-001` timers, purchase orders and customer preferences. A reversible visit move is standard and its customer text is external; the company’s policy decides whether the move and send run, enter review, wait for approval or are off. A recorded customer reply remains that customer’s response.

`GET /api/glove/delays?at=` (the desk and agents; never field roles) watches today's signals that exist.

A booked visit not yet arrived is at risk when its technician is still on an earlier visit that day after that visit's booked end (a running `COST-001` job timer, or arrival without completion): Glove expects them free at the moment of reading plus the overrun so far, at least 15 minutes, and flags their later visits that day starting before then.

A visit is also at risk while a purchase order for its job (`STOCK-002`) is not fully received.

For an overrun, the watch offers each other active technician free at the same planned time (same branch, skills, areas, time off, calendars and other visits checked; cancelled visits free their slots), then the same technician at the expected free time rounded up to 15 minutes.

The agent (or the owner or a dispatcher) prepares a move as a proposal (`proposal.prepare {kind: "move", visitId, plan}`); under the held company policy, someone other than the preparer approves the exact move with GLOVE-07 conflict review; a visit changed since preparation needs a new proposal.

A move that keeps the planned time, or keeps the start inside the visit's arrival window (`DISP-006`) on the same day, keeps that window; any other move drops it and is labelled "customer not yet asked".

Within the AGENT-009 resource and action grant, the same-day, same-technician move keeps its arrival window and its start inside it; the company’s policy decides the standard-class call.

A changed window is a distinct action with its own authority and computed facts.

The customer's confirmation by reply and the agent's text are carried by `COMM-002` and `COMM-005`, technician locations by `DISP-005`, each naming `AGENT-003` in its text and acceptance; customer preferences join when a clause records them.

## AGENT-004 operating rules

compares accepted scope, technician evidence, invoices, payments and the books; prepares invoices for completed unbilled work, sends payment nudges within the reminder policy, and prepares specific fixes for anything that does not reconcile (a payment in Stripe but not in QuickBooks, a refund without a credit). Its data is jobs, invoices, payments, payouts and `LEDGER-*` sync state. Invoice or reconciliation preparation is standard; a binding invoice decision is commitment, contact is external and a charge, refund or accounting post is money. The company’s policy decides each call. Provider-wide payout inspection retains the current-books and authority boundaries in its evidence Gap until the future agent authority design is proved.

an agent, owner or office person explicitly requests an invoice chase through the existing owner-approved PAY-005 email sequence.

It cannot change wording or schedules, create a payment link, bypass consent, disputes or quiet hours, repeat a reserved step, or continue after zero balance.

Owner authority and consent are rechecked by the same scheduler that handles ordinary reminders.

Each request records its actual initiator.

Reconciliation preparation compares a confirmed provider payment or refund with its approved invoice, accepted job total, field-evidence references and retained accounting outcome.

It proposes verification of an unrecorded payment or inspection of a refund's possible missing credit; it never claims a fresh provider lookup or infers that a credit is absent.

An uncertain accounting operation explicitly requires inspection, never resending.

A separate signed-in Owner or Office person records approval or decline of the inspection proposal; the preparer cannot decide it.

Even approval posts nothing, creates no credit and moves no money.

Existing separately authorized accounting, credit and refund commands retain their human boundaries.

Proposals follow existing branch, Activity, export and personal erasure custody.

an unscoped signed-in Owner may use `reconciliation.prepare` with a payout reference to compare its retained automatic payout snapshot or staff-recorded deposit batch against current source amounts, fees, invoice postings and payment outcomes.

PAY-007 provider-wide visibility remains Owner-only; agents, tokens, custom roles and branch-limited people receive no payout inspection authority.

A missing retained deposit or fee posting is an inspection question, never proof of a missing bank entry.

No provider read or write occurs.

Repeated current preparation reuses the proposal, changed records require a new comparison, a different Owner reviews it, and even approval has no accounting or payment effect.

Customer erasure removes personal aggregate proposals.

CT scope ruling, 26 October 2026: The adopted provider-wide payout comparison is inspection by a signed-in Owner without branch limits.

Provider-wide payout facts require a separately scoped authority design; the present retained inspection boundary and its proof limits are recorded in the Gap and RL-1.

Existing payment-specific preparation retains its current role and branch limits.

Comparing retained snapshots is not fresh provider verification.

A recorded inspection decision grants no posting, credit, refund, allocation, provider connection or money-movement authority.

Existing consequential commands retain their separate authorizations and approvals.

The complete invoice, reminder and reconciliation target remains binding; this ruling does not authorize future agent reads or reduce that target to Owner inspection.

## AGENT-005 operating rules

from a request's description, photos, call transcript and the property's equipment age and history, drafts a good, better and best quote from the price book with the reasoning for each option. Its data is the request, photos, equipment, past jobs at the property and the price book. Drafting is standard; sending the quote or authorized request photos is external, and a binding price decision is commitment. The company’s policy decides those calls. Photo use follows BOOK-001 under RL-101.

the agent, the owner or a dispatcher asks for a draft on a new or contacted request that names its site, once the owner has connected the model provider (`FIELD-006`).

The owner's provider receives, with store off and a strict answer schema, exactly: the request's description as entered and its source; the site's equipment (type, make, model, install and manufacture dates, age in whole years from the install date, else the manufacture date, to today in the business time zone, refrigerant) with each unit's earlier completed visits' dates and work summaries; the property's past job titles with their completed visits' summaries; and the active price book (code, name, the description customers see, unit, price before tax).

Never costs or markups, the customer's name, contacts, billing or site address, technician names or serial numbers.

Request photos are added separately only under BOOK-001’s consent, owner, metadata, training and withdrawal controls.

The answer is a job title and three options, Good, Better and Best, each one to 20 lines of an active price-book code and a quantity (more than 0, up to three decimals) and a reason.

Any other code, quantity or shape refuses the whole answer, with nothing saved, repaired or retried.

Glove saves it as a draft quote on the request (the request becomes quoted) at the price book's prices, with each option's reason and the label "Drafted by the model from the request.

Under the held company policy, a person approves each option’s price before sending.

An agent’s binding price decision carries commitment, and sending carries external; the company’s policy decides these calls, with truthful attribution.

Requests may retain private office photos under BOOK-001’s partial intake slice, but only its separately consented sanitized copies join model evidence today; no call transcripts join: `BOOK-001` (request photos under its ct-approved consent, owner, metadata, training and withdrawal rules) and `AGENT-001` (the call transcript) add them to this evidence before they ship, in their text and acceptance.

## AGENT-006 operating rules

when a property calls back about equipment serviced recently, gathers the equipment history, earlier photos, readings, materials and the manufacturer's manual, and prepares a diagnosis checklist and parts plan for the technician. Its data is equipment records, form results, photos and materials at the property. Evidence gathering and an advisory checklist are standard, with external added for provider-bound disclosure; the company’s policy decides those calls. The licensed technician’s diagnosis and actual certification are recorded as their own acts.

a new job (from a quote or a service call, which can name the site's equipment) is a callback when a unit it names had a visit on another job completed within the 30 days before the job was made, counted on the server's received completion time, the window `REPORT-002` counts callbacks in; the job carries that flag and its timeline says so.

The agent (or the owner or a dispatcher) prepares the checklist with the owner's model provider (`FIELD-006`'s connection): Glove gathers the unit's record, manual, photos and every earlier completed visit on it (form readings with their ranges and out-of-range flags, refrigerant, notes, materials), oldest first, each visit and reading with a reference; the model gets the equipment and visit evidence and photo captions only, never customer names, contacts or addresses.

Every checklist step and part must cite references the pack holds, and Glove resolves each citation to the recorded reading; an answer that cites nothing or anything else is refused and nothing is kept.

The prepared checklist is labelled advisory (the licensed technician diagnoses and decides the work; it is not a safety certification), decides no work, and is read by the desk and the technicians assigned to the callback job.

## AGENT-007 operating rules

tracks agreements' due visits and entitlements, offers customers booking slots for due visits, chases unanswered ones, checks the promised maintenance was actually recorded, and prepares renewal outreach for agreements nearing their end. Its data is agreements, due visits, capacity, completed forms and customer threads. Internal due-work preparation is standard, customer outreach is external, changed binding terms are commitment and renewal charges are money. The company’s policy decides those calls; a customer’s actual slot choice and a technician’s actual completion remain attributed to them.

## AGENT-008 operating rules

shows the owner a short morning brief when they open Glove: jobs at risk today, unbilled completed work, jobs over their cost estimate, overdue invoices, agreements due and leads waiting too long, each with one proposed next action. Nothing is pushed; the brief is emailed only when the owner turns on `COMM-001`'s morning email, which is off by default. Its data is `REPORT-*`, `COST-*`, `PAY-*` and `BOOK-*` records. Reading the brief and preparing next-action drafts are standard; sending a brief outside its internal view is external. The company’s policy decides agent calls on the proposed actions.

Glove prepares the brief itself from its records (no model), for the owner only, at `GET /api/glove/brief` and on the owner's Today screen, for the business's local date at the moment it is read (`at=` reads it as of another UTC moment); it writes nothing.

At risk today: visits on that local date, not cancelled or completed, with no technician, not arrived 15 minutes after their start, or arrived and still open at or after their planned end (action: Dispatch).

Unbilled: completed jobs whose invoice is missing (Prepare invoice) or still a draft (Approve invoice).

Over estimate: open jobs whose actual cost exceeds a non-zero estimated cost as `COST-004` computes them (Review job costs); `COST-005` margin warnings stay the live watch.

Leads waiting: requests still new or contacted 24 hours or more after entering that stage (Contact the customer / Quote the request).

The brief is shown when the owner opens Glove and sends nothing by being opened; `COMM-001` emails it to the owner once per business-local date only when the owner turns that on (`mail.morning`, off by default), with the delivery outcome asserted in its flow, and nothing is pushed.

The brief says overdue invoices are not tracked until `PAY-004` adds them; PAY-004 adds its linked section and assertion before it ships.

PLAN-004 now lists outstanding due included visits with their agreement and Dispatch links, asserted in its named flow.

PLAN-005 fixed-monthly invoices inherit its ct-approved period-end issue date, separate approval time, later-of-period/approval due-date basis, approval-gated aging and frozen report/export dates; preexisting documents keep their original basis.

## AGENT-009 operating rules

nothing on its own; this clause is the owner's control. The owner grants named actions to a named agent (for example send reminder texts from a template, book into open slots for listed services under a price limit, move a visit within its window), with a daily budget and quiet hours; every granted action records the grant it used; one switch pauses every agent. Its data is the grant register and the timeline. People set the company’s policy and Pause. An agent may draft policy questions; a person confirms the change. Other named-agent grants carry access with their direction, and the calling agent never widens its own authority. Business thresholds and provider-spend caps are the company’s choices.
