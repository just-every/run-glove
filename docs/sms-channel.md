# Bounded SMS channel

`src/glove/sms-channel.ts` supplies the Twilio network boundary for visit notices
and quote follow-ups. This facade re-exports settings from `sms-settings.ts`,
delivery and state folding from `sms-delivery.ts`, callback handling from
`sms-events.ts`, and the shared rules from `sms-shared.ts`.
Migration `0040_sms_channel.sql` was chosen after checking
that the latest existing migration was 0039; 0041 belongs to visit responses.
This module does not order numbers, port them, claim provider registration,
provide a settings screen, or enable a scheduled sequence on its own.

## Command integration

Register `smsCommands` in the command families. Register these three commands as
owner-only, forbidden to integration tokens and custom roles, and unavailable to
branch-limited actors. The handler independently enforces those restrictions.

- `sms.connect`: `{version, provider:'twilio', accountSid, authToken,
  fromNumber, registration:'a2p10dlc'|'tollFree', registered:true, live:true}`.
  The number must already be a live registered US number. This records the
  owner's affirmation, without claiming a provider verification request. The
  connection always starts disabled. `{version, provider:null}` disconnects.
- `sms.configure`: `{version, enabled, approved:true}`. Explicit approval is
  required when enabling. This enables only the channel; the caller must still
  approve its own templates and schedule through its existing command door.
- `sms.consent`: `{customerId, version, purpose:'visits'|'quotes', enabled,
  address, source, wording, timezone}`. Address must exactly match the customer's
  current E.164 phone. Source, consent wording, time, author and customer time
  zone remain on the customer. Changing the phone invalidates consent.

Pass the installation's origin in `c.origin`; HTTPS is required except a
loopback origin with `c.local`. The auth token is held only in the existing
installation-private `glove_provider_keys` row named `sms`. Existing archive
exclusion of that table applies. Never reveal the token in an outcome or log.
After restoring an archive the owner must reconnect and enable SMS again.

## Sending integration

`queueSms(c, {kind, subjectKind, subjectId, customerId, jobId, to, text, label})`
reserves a `State.messages` row. Kinds are `confirmation`, `moved`, `cancelled`,
`visitReminder` and `quoteFollowup`; subjects are the corresponding visit or
quote. `label` is accepted for caller compatibility and is not copied into the
timeline. SMS rows have `channel:'sms'`, `direction:'outbound'`,
`provider:'twilio'`, actor and reference metadata. Bodies live in a WeakMap keyed
by Context and never enter domain records, saved outcomes or archives. Do not
reuse old message records as a resend source.

Call `await deliverSms(db, c)` only after the command commits, including after a
scheduled reminder reservation. It consumes the transient queue once, reloads
the connection, customer, subject and current authority, and durably claims an
attempt before its single Twilio request. A changed address, withdrawn consent,
STOP, erasure, changed visit, answered or expired quote, disabled channel or
lost owner authority prevents the attempt. A network timeout stays uncertain;
the module never retries. An accepted HTTP response is not delivery evidence.
Calls already authorized and in flight cannot be recalled from the provider.

Every text gets the current business name and immutable STOP, HELP and START
instructions. Every send requires address-bound purpose consent and occurs
between 08:00 inclusive and 18:00 exclusive in the recorded customer's time
zone. No branch time zone is inferred. The parent sequence must prevent
duplicate schedule steps and require explicit owner approval of wording.

The current email message-state fold must filter out SMS rows. Merge the map
from `await smsMessageStates(db, messages)` into the response map. It folds
terminal delivery facts ahead of queued or accepted facts. Provider facts and generic failure codes reference the message
and job and pass through the existing Activity and business export.

## Callbacks and inbound replies

Call `smsEvents(request, db, optionalReplyHandler)` before session-protected API
dispatch. It owns `POST /api/glove/sms/events` and
`POST /api/glove/sms/inbound`, returning null for other paths. Configure the
inbound URL on the Twilio number. Outgoing requests set their own status URL.
The exact external Request URL must survive the proxy; forwarded headers never
choose the signature URL. Do not preparse or trim the request body.

The module validates HMAC-SHA1 against the exact URL and every decoded form
field with a constant-time comparison. It rejects duplicate form names,
non-form content and bodies over 64 KiB. Account identity and business number
are checked before customer or message lookup. Status callbacks also match the
outgoing recipient, connection and single provider attempt. Receipts and
provider facts are committed atomically and replays have no additional effect.

STOP and its standard synonyms disable both purpose consents and block the
number on every live customer sharing it. START clears only that block; it does
not restore purpose consent. HELP is recorded. Twilio handles its standard
keyword response; Glove returns empty TwiML to avoid a duplicate reply. Configure
the provider's actual help text before live use. Advanced Opt-Out's signed
`OptOutType` is also honored. Unrecognized incoming text is represented only by
the `other` action; its raw body is not retained.

`SmsReplyHandler` is optional. Recognized CONFIRM or YES, RESCHEDULE, and NO or
DECLINE call it only for a unique live customer at the authenticated From
number. Its input is `{customerId,messageId,providerMessageId,action,at}`.
Return `{guards?:[{sql,params}], statements:D1PreparedStatement[]}`; those
statements and guards join the same receipt transaction. Prepare effects only;
never execute writes or network calls in the handler. The parent must bind the
reply to a single current visit and its exact sent schedule, and append its
visit/job event and office notice in those statements. This module itself
records the incoming response without claiming the visit was confirmed.

`customer.smsOptOut.blocked` must also exclude the customer from segment pushes
before claiming the full COMM-002 clause. The new private attempt and receipt
tables hold only opaque message/provider references and fingerprints, never
numbers, raw text or keys. SMS metadata and consent use existing customer and
message records so DATA-001 includes them. Parent verification must cover
erasure during an in-flight send and callback, archive credential exclusion,
and the reply handler's additional stores.

DATA-001 cleanup must delete both `glove_sms_attempts` and
`glove_sms_receipts` by `message_id`, using the erased scope's message IDs.
For each table the predicate is `message_id IN (SELECT value FROM json_each(?))`,
with the JSON array bound as a parameter. The receipt table now has an indexed
`message_id` specifically for this cleanup. Provider response writes require
the original message and recipient to still exist; completion also removes
orphaned private attempts and receipts before recording a guarded outcome.

## Protocol references and fixture

Protocol consulted on 25 October 2026:
[message creation and status callbacks](https://www.twilio.com/docs/messaging/api/message-resource),
[signature construction](https://www.twilio.com/docs/usage/security), and
[Advanced Opt-Out](https://www.twilio.com/docs/messaging/tutorials/advanced-opt-out).

`tests/fixtures/twilio.mjs` exports `twilioEdge`, `twilioCallback` and
`twilioSignature`. The edge exposes `answer(Request)`, captured `calls`,
`messages`, `delivery(sid,status,extra)` and `inbound(origin,from,body,extra)`.
Only its fixed Twilio origin is intercepted. Set `status` or `unavailable` to
exercise refusals and uncertain outcomes. Credential defaults and provider
references are derived at runtime from hashed synthetic strings; no literal
provider-shaped credentials are stored in the fixture.
The parent owns the real API and scheduler flow tests.
