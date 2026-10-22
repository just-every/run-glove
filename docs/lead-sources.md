# Lead source formats

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
production HTTP door, with no live-provider claim. BOOK-004 stays PARTIAL;
COMM-002/provider-channel replies remain required.
