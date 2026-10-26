Glove keeps your records in your own installation. Data leaves it only through the providers below, each one you (the owner) connect with your own account and key. Keys are kept as installation secrets: never in your records, the business export, logs or a backup archive.

## Sign-in email

The mail provider you set up sends sign-in and invitation links to the person's email address. Customer email is separate, below.

## A technician's calendar

When a technician connects their calendar's secret iCal address, Glove reads that feed to see when they are busy. Nothing is sent to the calendar.

## Mango or Mailchimp

When the owner or office pushes a segment, each member's name, email and tag names, and the segment's name, go to the provider you connected. Members without an email or tagged "do not contact" are skipped, and nobody is subscribed.

## Phone notifications

When the owner turns on phone notifications (More → Team → **Phone notifications**) and a technician turns them on for a phone, the phone's browser gives Glove the address of its push service (Apple, Google or Mozilla, chosen by the phone) and the phone's encryption keys. Glove keeps them only while that person stays signed in on that phone as a Technician, and never in your records, the business export or a backup archive. Each push that goes to that service is encrypted for the phone and holds only a generic line such as "Visit moved" and the job's opaque id: never the customer, address, time or notes. The key Glove signs pushes with is kept as an installation secret.

## Your model provider

Nameplate reading, the callback checklist and quote drafting use the model provider the owner connects under More → Team → **Model provider** (any OpenAI-compatible address, a model and your key). Each request asks the provider not to store it.

- **Nameplate reading.** Only the nameplate photo the technician takes is sent. No customer, site or job details go with it. What comes back is shown to the technician as read by the model, and nothing is saved until they confirm it.
- **Callback checklist.** The unit's details (type, make, model, serial, install and manufacture dates, refrigerant, where it is) and what was recorded at its earlier visits (dates, technician names, work summaries, form readings with their ranges, refrigerant, notes, materials and photo captions) are sent. No photos, and never the customer's name, contacts or address. The checklist that comes back is advisory: the technician diagnoses and decides the work.
- **Quote drafting.** The request's description and source; the site's equipment (type, make, model, install and manufacture dates, age, refrigerant) with its earlier visits' dates and work summaries; the property's past job titles and their completion summaries; and your active price book (code, name, the description customers see, unit and price, never costs). Never the customer's name, contacts or address, technician names, serial numbers or photos. What comes back is a draft quote labelled as drafted by the model; a person approves its prices before it is sent.

## Customer email

The owner connects SendGrid, Resend, Postmark or Amazon SES under Team with their own API key, the webhook verification key and a from-address on a domain that provider has verified. When someone at the desk emails a quote, an invoice, a purchase order or a booking link, Glove sends the provider the recipient's address, the from-address and name, the business email as the reply address, the subject and the plain-text body: the quote's or invoice's lines and total, the order's lines, or the booking link with its offered times and address. A booking link in an email works like the shown-once link: whoever holds it can choose one offered time. Glove keeps who sent what to whom and the provider's message reference, never the body. The provider posts delivery events (delivered, bounced, spam complaint) back to Glove; Glove authenticates callbacks before delivery parsing or message lookup: provider signatures, Postmark's generated Basic credential (only its hash kept), or SNS v1/v2 against a pinned regional certificate endpoint. SES receives the configured configuration-set name and an encoded opaque delivery-ID tag. Certificate fetches and authenticated subscription confirmations go only to the pinned regional AWS SNS host, without redirects; subscription tokens are never kept in Activity or exports. Authenticated unmatched events are acknowledged without effect. Callback credentials/hashes and provider keys are excluded from archives and must be reconnected after restore. Glove keeps matched authenticated delivery events with recipient and status; rejected events write no business record.

## CompanyCam job photos

The owner connects CompanyCam with their own access token under Team. The token stays an installation secret and must be reconnected after restore. The owner or dispatcher explicitly links a job to an existing CompanyCam project; Glove reads that project's id, name and address to compare the recorded address with the job site. Import reads that project's photos, plain-text captions, capture times, original image URLs and provider ids, and downloads the original image bytes without sending the token to the image host. Photos are labelled CompanyCam, never technician arrival or sign-off.

Sending is explicit, one selected original Glove photo at a time: project id, photo bytes and caption only. No customer identity, contacts, address fields, financial fields or other job records are sent. A caption or image can itself contain whatever its author photographed or wrote. Provider references and honest outcomes stay on the job. An uncertain upload is never resent; the owner can reconcile an existing same-project photo by matching its exact original bytes. Only its bytes are downloaded for that check. Unsupported/oversized/unready imports show a photo-specific error.

## Optional Stripe Tax address lookup

Only the owner connects a Stripe Tax secret key and requests a lookup. Stripe receives service street, city, state, ZIP and US country, plus two $100 sample classifications: general tangible goods and the owner-selected service classification. No customer name, contact, Glove customer ID, exemption certificate or job records are sent. The key stays an installation secret excluded from archives and must be reconnected after restore. The response keeps the calculation references, HTTP outcomes, rate text and taxability reasons; no rate is automatically adopted. No active registration, unsupported or partial treatment is labelled unavailable for automatic application, never a zero rate or an exemption. Glove neither verifies certificates nor files returns.

## Optional Avalara AvaTax address lookup

Only the owner connects an AvaTax account ID, license key, company code and environment (production or sandbox) and requests a lookup. Avalara receives one uncommitted `SalesOrder` (never recorded in AvaTax) with the company code, today's date, the fixed customer code `glove-address-rate-lookup`, USD, the service street, city, state, ZIP and US country, and two $100 sample lines: `P0000000` general tangible goods and the AvaTax tax code the owner enters for the service. No customer name, contact, Glove customer or site ID, exemption certificate or job records are sent. The credentials stay one installation secret excluded from state, archives and exports and must be reconnected after restore. Glove keeps the transaction code, HTTP outcome, each jurisdiction's name, rate and taxability; no rate is automatically adopted. No nexus, zero, mixed, partial or refused answers are labelled unavailable for automatic application, never a zero rate or an exemption.

## Shared service reports

The owner, dispatcher or office explicitly copies a seven-day report link for manual sharing with the customer. The page contains the completed visit's frozen work summary, findings, form answers and flagged readings, photos, materials, customer sign-off and recommendations; the technician is named by first name only. Anyone holding that link can read only this snapshot and its named original files until expiry or revocation. The credential is in a browser fragment and request header, never a URL query, log, business export or archive. Only its hash is stored, separately from the report; restoring requires fresh links. No email or text is sent by this action.

## Google Maps

The owner connects Google Maps Platform under Team with their own API key (Geocoding, Routes and Maps Static APIs). The key stays an installation secret and must be entered again after a restore.

- **Placing a site.** When a site is saved, or someone at the desk chooses **Place on the map**, Glove sends Google the site's street address and keeps the latitude and longitude Google returns on the site.
- **Drive times.** For the map board and automatic assignment, Glove sends Google the latitude and longitude of consecutive stops only: no address, customer, job or technician.
- **The map image.** The base map is requested by its center and zoom; Glove draws its own pins, routes and zones over it, so no stop is marked on Google's side.

Directions on a technician's phone open the site's address in the navigation app they choose (Apple Maps, Google Maps or Waze); Glove sends nothing itself.

## Lead sources

The owner connects Google Local Services, Angi, Thumbtack and Yelp under Team. Angi and Thumbtack send each lead to Glove; Yelp tells Glove which leads are new and Glove reads them from Yelp with your Leads API key; Glove reads Google's Local Services leads from the Google Ads API with your OAuth credentials and developer token every 15 minutes. Nothing about your other customers goes to these providers. A lead's name, phone, email, address and request become a request in Glove, matched to an existing customer only by the same phone or email. Acknowledgments are queued as a desk task and never sent automatically. For Yelp, the unscoped owner can explicitly approve one acknowledgment through the lead's unexpired masked email address. Only that acknowledgment text goes to the connected email provider, then through Yelp's masked-email channel. A changed customer email never changes this destination. The mail provider's acceptance or delivery does not confirm receipt in the Yelp conversation. No automatic retry occurs; other providers still need a reply outside Glove.

Reserve with Google request intake accepts an integration-relayed REST Booking record through a separate owner-connected Basic-password door. It retains the booking ID, merchant/service IDs, requested slot and source status, and uses the given/family name, phone and email for the same customer matching. It does not treat the user address as a service location, retain payment details, book a visit, or call Google. Acknowledgments remain a person’s task; recording an external send is an attestation, not delivery confirmation. See [formats and live-integration limits](/docs/lead-sources).

## Website service requests

The sender explicitly asks the business to contact them about the submitted work. Service, description, supplied contact, service address, preferred times and up to two originals stay in the installation for its authenticated desk. The anonymous receipt discloses no existing-customer match or identifier. The office receives an in-app notice; nothing books or sends automatically. Cloudflare’s Turnstile widget runs on the request page; server verification sends only the private verification key and challenge token. The key stays in installation-private provider custody and is excluded from archives and exports. A failed challenge writes nothing. Customer privacy export and erasure include the request metadata and originals.

Request photos join quote drafting only if the unscoped owner enables the separate switch and the sender explicitly opts in for that request, naming the configured model provider and its hostname. The switch starts off. The owner must enter the applicable agreed terms prohibiting training and affirm they bind that account; store-off alone is insufficient. Saving a new disclosure or reconnecting the provider invalidates earlier permission. Only image copies are added: EXIF/location, text/XMP and other metadata are stripped on the server, and no caption, file reference, contact, address or customer identity fields accompany them. The existing approved text evidence is unchanged. Originals stay private to the office. Before each attempt, the authorization batch rechecks the exact request/settings and live authority; no photo request follows a redirect. The owner can record the sender’s explicit withdrawal, excluding photos from later calls while retaining office originals. An already authorized in-flight request cannot be recalled. Provider qualification by the owner’s account-specific terms/affirmation and owner-recorded withdrawal are conservative defaults awaiting ct confirmation; BOOK-001 stays partial.

A signed quote confirmation additionally sends its exact frozen HTML copy, including chosen work, claimed signer, signature and disclosure, to the connected email provider and on-record recipient, alongside plain text. Delivery state comes from the real provider outcome; exported or emailed outside copies fall under DATA-005.

## Stripe-hosted invoice payment foundation

The signed-in owner explicitly requests a test-mode Checkout for an approved USD invoice. Stripe receives the invoice number, amount, optional fixed tip, opaque payment/connection IDs and installation return addresses. Customer card, wallet and bank entry takes place on Stripe's own hosted page, never through Glove. The hosted URL is a show-once bearer and is excluded from records, replays and archives. The API key and webhook secret are installation secrets excluded from archives. Signed callbacks trigger a fixed-endpoint current-intent read; only verified amount, currency, connection, payment ID and test-mode results change the financial records. Glove keeps references, amount, fee, tip, provider status and financial effects; it does not retain the provider's raw payload. Receipts are explicit transactional emails through the owner's customer-email connection, carrying invoice number, confirmed amount, tip and provider reference. No automatic receipt or charge is enabled. Reconnect after restore. Custody/authority defaults await ct confirmation; the clause stays partial.

PAY-004 original-method Stripe test refunds send only the retained payment-intent reference, refund amount and Glove refund ID to Stripe’s fixed `/v1/refunds` endpoint. A status refresh reads the retained refund reference. Provider outcome/reference is recorded; credentials, Checkout URLs and raw provider error bodies are excluded from Activity and exports. Cash/check receipts and refunds are staff records and cause no provider call.

PAY-007 reads the owner's Stripe test payouts, source balance transactions, eligible connected debit-card references and available balance. Explicit owner-confirmed Instant Payouts send amount, currency, existing destination reference and opaque Glove payout ID. The owner records the account-specific fee schedule; no provider-price verification is claimed. Automatic payouts use provider source membership; manual payouts use explicitly reviewed books allocations, labelled accordingly. No card numbers are handled.

PAY-006 conservative default awaiting ct: the customer explicitly consents on a current owner-issued quote link before Glove sends only chosen amount, expected completion date, generic service purpose and opaque purchase reference to Wisetack's fixed test endpoint. Customer identity, contact, address, SSN, income, images and credit data are not sent. Wisetack's application link is shown once and never stored. The provider's transaction read supplies only whitelisted status, offer ranges, funded amount and fee; raw consumer fields are discarded. An owner-initiated original-method refund sends only the retained transaction reference and refund amount; the returned refund reference/amount is recorded without customer data. Provider auth is private and absent from records, exports, archives, Activity and browser storage. Production activation is disabled.


### Automatic email consent and schedules

When the unscoped owner explicitly enables automatic email, a scheduled Worker
sends approved visit, unpaid-invoice and unanswered-quote text to the customer's
recorded address through the existing customer email provider. Separate consent
records bind each purpose to that address and retain the owner's reference and
time. Templates have no links or markup. The business name and office-handled
stop instructions are added by Glove. Quiet hours are 18:00 to 08:00 in the
record branch. Visit intents contain no recipient address or message body.
History retains recipient, subject, owner, step and provider outcomes for audit;
DATA-001 erases those personal records with the customer. No Checkout session or
customer quote bearer is stored or reused by the scheduler. The consent and quiet
hours default awaits ct approval; promotional unsubscribe handling remains unbuilt.


## Technician visit calendars (DISP-008)

The owner explicitly enables a technician's delegated Google Calendar or
Microsoft 365 connection. OAuth client credentials and refresh tokens stay in
private local credential storage and are excluded from business exports and
installation archives. Google and Microsoft receive visit start and end, an
opaque visit reference, and the title “Glove visit”. Customer details default
to hidden; the owner's explicit option adds customer name and service address
only. No contact channels, notes, prices or attendees are sent. Busy reads retain
only interval start and end, never event titles or descriptions. Provider changes
do not modify Glove bookings. Disconnect stops further writes and retains the
provider's existing events. Restored installations must reconnect explicitly.


## On-clock technician location (DISP-005, ct approval pending)

The technician explicitly permits foreground phone or fleet position sharing.
Collection needs their open shift and a travel or job timer on a current visit.
The phone uses browser geolocation without an offline queue or background watch.
The owner explicitly connects a Samsara vehicle and requests its GPS snapshot:
GET `https://api.samsara.com/fleet/vehicles/stats` with `vehicleIds` and `types=gps`.
The adapter follows the [Samsara snapshot reference](https://developers.samsara.com/reference/getvehiclestats).
Only the vehicle ID and an installation-secret Authorization header leave for
Samsara. The adapter retains only that vehicle's latitude, longitude and GPS time;
redirects, missing records, stale timestamps and failed reads are refused.

Only the owner reads current positions within the selected branch scope.
The already-connected Google Routes API receives only origin and destination
coordinates, with no technician, customer or job identity, for a traffic-unaware
driving estimate. No automatic customer notice or visit change follows.
Dispatchers and agents retain their existing delay proposals and receive no position data.
`COMM-004` carries customer notices; `FIELD-005` carries native background capture.

Only the latest position is stored. Positions become unavailable after two
minutes; the next product command removes expired entries. Clock-out, timer stop,
reassignment and consent withdrawal remove ineligible entries atomically.
Coordinates never enter business records, command results, Activity values,
business exports, offline storage or installation archives. Fleet credentials
also stay out of those doors. Generic capture and consent events remain audited.
The conservative consent, audience, custody and outbound defaults await ct.

## QuickBooks Online sandbox

Only the signed-in unscoped owner connects a sandbox company and explicitly verifies links, confirms them, sends a record or reads a payment. The sandbox receives customer names, billing addresses, email and phone for explicitly approved customer creation, and names, billing addresses and email for customer updates; sales-item codes, descriptions and prices for item updates; and approved invoice numbers, dates, billing and service addresses, line descriptions, mapped item and customer references, tax and discount amounts for invoice posts. Payments send their amount, reference and invoice allocations. Full-invoice refunds send the frozen invoice lines and tax snapshot. Optional mapped classes and departments are included when configured. Payment readback receives only the requested provider payment and validates all linked invoice allocations before changing balances.

The access token stays in the existing installation secret store, outside browser recovery storage, domain state, audit, business export and backup archives. Provider calls use fixed Intuit hosts without redirects. A definite refusal retains its provider message; uncertainty retains its operation identity and blocks another send. Customer erasure removes related operation metadata, and an in-flight result cannot restore the erased personal details. The owner can verify an existing provider reference against the exact reserved content without sending again. No live activation, production OAuth, automatic send or retry is provided.

The owner can explicitly read paginated company customers (including sub-customers and inactive records), items and invoices to review link proposals. Provider names are returned for that review only, outside saved command results and business settings; Activity and business export retain read counts, the review fingerprint, matching rules and local and provider IDs. Creating an unmatched customer requires affirmative approval bound to that current review and record version. Existing matches, name clashes and unresolved earlier sends refuse creation; nothing is created automatically. The original imported invoice number and total are retained for linking, distinct from its remaining opening balance.
