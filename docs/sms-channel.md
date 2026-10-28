# Customer notice channel

The unscoped signed-in owner connects an already live registered US Twilio
number in Team settings, explicitly affirms its registration and separately
approves enabling texts. Connecting always starts disabled. This slice does
not order, host or port numbers. Those remain COMM-002 gaps.

`reminder.configure` approves plain-text templates and schedules. The Settings
editor previews the same renderer used for sends. Every text adds the business
name and STOP, HELP and START instructions; visit notices also add CONFIRM and
RESCHEDULE instructions. Template edits cannot remove that footer. The owner
records separate visit and quote purpose consent for the exact current number,
including source, wording, time and customer time zone. Changing the number
invalidates consent. No consent is inferred from an email preference.

Automatic texts run only from 08:00 inclusive until 18:00 exclusive in that
recorded customer zone. Email uses the record's branch zone. Visit creation,
move, cancellation and reminders share the existing scheduled notice path,
including assessments. Quote sequences can contain email, text and internal
call-task steps; no call is placed. Answer, closure, revision change or expiry
stops further steps and pending call tasks. The desk explicitly completes a
call task without claiming a call occurred.

SMS bodies exist transiently for one send and are not retained in messages,
Activity, command results or archives. A durable attempt precedes the single
Twilio request. The sender reloads current consent, number, STOP state,
authority, policy and source schedule or quote revision before dispatch.
Unknown outcomes remain unknown and never automatically retry. In-flight
provider requests cannot be recalled; completion after customer erasure cannot
recreate recipient records.

Signed callbacks use HMAC-SHA1 over the exact external URL and every form field.
Duplicate fields, oversized bodies, wrong accounts, wrong numbers or unmatched
attempts refuse before business writes. Receipts and effects commit atomically;
replays have no additional effect. Provider acceptance never claims delivery.
STOP blocks every live customer at that number and withdraws both purposes.
START only removes that block; it does not restore purpose consent. HELP is
recorded and Twilio supplies its configured standard response. Raw incoming
text is not retained. CONFIRM and RESCHEDULE bind only to a unique current
future visit whose exact schedule was texted. A reschedule reply opens an
ordinary request and office notice; it never changes a booking. Ambiguous
replies never pick a visit. Messages and actual provider outcomes join the
customer and job Conversation, timeline, Activity and business export.

`visit.replyLink` is an explicit owner action that emails a minimal response
link through configured customer email. The hash-only credential expires no
later than the visit start or seven days; a moved schedule, withdrawal, lost
owner authority, reissue or erasure closes it. The customer sees the business,
visit title and window, without contact or address. The first confirmation or
reschedule request wins; the page makes no identity claim and never moves a
booking. Automatic email notices still direct replies to the office. A
completed service report is emailed only by explicit owner `report.link` with
`email:true`, using the approved report template and the existing provider.

Quote follow-up emails require the business postal address and include a
separate hash-only, expiring withdrawal credential. Reading it changes nothing;
an explicit same-origin POST stops only quote follow-up email for its original
current address. It reveals no customer identity and grants no document access.
Future COMM-004, COMM-021 and COMM-008, COMM-026, COMM-027 notice kinds inherit template approval and the
immutable footer before shipping.

Twilio credentials and all response credentials remain installation-private,
excluded from archives. Restore requires reconnecting the text channel and
reissuing public links. DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erasure removes related attempts, receipts and
response credentials. The conservative owner, consent, quiet-hour, response-link
and explicit report-email defaults await ct approval; these clauses stay PARTIAL.

Protocol consulted on 25 October 2026:
[message creation and callbacks](https://www.twilio.com/docs/messaging/api/message-resource),
[signature construction](https://www.twilio.com/docs/usage/security), and
[Advanced Opt-Out](https://www.twilio.com/docs/messaging/tutorials/advanced-opt-out).
The provider fake is `tests/fixtures/twilio.mjs`; the real Worker flow is
`tests/api/reminders.test.mjs`, with owner and customer screens in
`tests/browser/reminders.spec.ts` and archive proof in `tests/portable.mjs`.
