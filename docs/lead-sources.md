Reserve with Google has a bounded **request intake** adapter at
`POST /api/glove/leads/reserve-google`. The owner connects it with
`lead.connect {provider: "reserve-google"}`. An integration the owner controls
can relay a saved Google Actions Center REST `Booking` record using Basic user
`glove` and the password shown once. This password is stored as a SHA-256 hash;
other provider keys are installation-local values, not claimed encrypted.

The format follows Google's [Booking](https://developers.google.com/actions-center/verticals/reservations/e2e/reference/booking-server-api-rest/e2e-definitions/booking-definition),
[Slot](https://developers.google.com/actions-center/verticals/reservations/e2e/reference/booking-server-api-rest/e2e-definitions/slot-definition)
and [UserInformation](https://developers.google.com/actions-center/verticals/reservations/e2e/reference/booking-server-api-rest/e2e-definitions/user-definition)
definitions (checked 22 October 2026):

- `booking_id` is the request's source identity. The first record wins; retries
  do not duplicate customers or requests, including concurrent deliveries.
- `slot.merchant_id`, `slot.service_id`, `slot.start_sec` (UTC Unix seconds) and
  `slot.duration_sec` remain source facts. Positive integral seconds may be JSON
  numbers or decimal strings. A slot is not a notification creation time.
- `user_information` supplies `user_id`, `given_name`, `family_name`, `telephone`
  and `email`. Name, phone and email become the matched or new customer; the
  user's address is not assumed to be the service location.
- `status` must be `CONFIRMED` or `PENDING_MERCHANT_CONFIRMATION`. This is the
  source's status only. The Glove request remains new, with no booked visit.
- Payment information, offers and other optional fields are not retained. A
  booking price is not a lead cost. A person or workflow can set a lead cost.

The generic `200 {ok: true}` response is only a Glove intake receipt. A person’s
acknowledgment task is queued from Glove receipt time (default 60 minutes,
owner-set 5–1,440 minutes); it sends nothing. `enquiry.acknowledged` records
that person's external-send attestation, not confirmed delivery or proof of a
provider response window.

## Integration boundary

Google's [BookingNotification](https://developers.google.com/actions-center/verticals/reservations/e2e/integration-steps/real-time-updates-ready/bookingnotification-ready)
is an **outbound update to Google**, not an inbound lead webhook. This adapter
is not that API, a CreateBooking endpoint, or a complete Google booking server.
Do not configure it as one: it cannot confirm availability or a booking.
Booking-server methods, feeds, updates/cancellations, provider eligibility and
live activation remain unproved/unbuilt. The synthetic fixture in
`tests/fixtures/leads.mjs` proves only this local schema adapter through the
production HTTP door, with no live-provider claim. BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017 stays PARTIAL;
Replies for the remaining providers remain required.

## Google Local Services pagination

Google reads follow the documented [Google Ads paging protocol](https://developers.google.com/google-ads/api/docs/reporting/paging).
Every page uses the original query and the returned `nextPageToken` as
`pageToken`. Both the desk command and scheduled run finish reading and
validating the pages before landing any request. A repeated token, malformed
lead or failed page reports a provider error and writes no partial lead set.
A later successful read reuses provider lead identities, so previously imported
leads stay single requests. This intake improvement does not send a reply.

## Explicit Yelp acknowledgment

Yelp's [partner integration guide](https://docs.developer.yelp.com/docs/partner-integration-guide)
documents plain-text email to its masked address as a reply channel. Glove keeps
the lead's original reply address and expiry. Only an unscoped owner can check
**I approve this Yelp reply** and choose **Email Yelp acknowledgment**, or call
`enquiry.reply` with `confirm: true`. The existing customer mail connection sends
that one acknowledgment after the command commits. The recipient comes from the
lead, never from a later edit to the customer. Expired addresses refuse a send.
Command replay and a second send do not duplicate it; there is no automatic retry.

The request shows the mail provider's actual acceptance or delivery state.
Glove does not claim that Yelp displayed the message or that a response deadline
was met. The synthetic network-edge flow is not a live Yelp receipt. The
unscoped-owner-only, explicit per-send approval default awaits ct confirmation;
BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017 remains PARTIAL with the other provider replies and Reserve integration.
