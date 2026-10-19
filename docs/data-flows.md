Glove keeps your records in your own installation. Data leaves it only through the providers below, each one you (the owner) connect with your own account and key. Keys are kept as installation secrets: never in your records, the business export, logs or a backup archive.

## Sign-in email

The mail provider you set up sends sign-in and invitation links to the person's email address. No customer receives email from Glove.

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

## CompanyCam job photos

The owner connects CompanyCam with their own access token under Team. The token stays an installation secret and must be reconnected after restore. The owner or dispatcher explicitly links a job to an existing CompanyCam project; Glove reads that project's id, name and address to compare the recorded address with the job site. Import reads that project's photos, plain-text captions, capture times, original image URLs and provider ids, and downloads the original image bytes without sending the token to the image host. Photos are labelled CompanyCam, never technician arrival or sign-off.

Sending is explicit, one selected original Glove photo at a time: project id, photo bytes and caption only. No customer identity, contacts, address fields, financial fields or other job records are sent. A caption or image can itself contain whatever its author photographed or wrote. Provider references and honest outcomes stay on the job. An uncertain upload is never resent; the owner can reconcile an existing same-project photo by matching its exact original bytes. Only its bytes are downloaded for that check. Unsupported/oversized/unready imports show a photo-specific error.
