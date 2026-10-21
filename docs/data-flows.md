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
