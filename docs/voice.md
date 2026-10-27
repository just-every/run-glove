# Business-number calls

The current preparatory flow uses an existing registered Twilio connection.
Voice routing starts off. A signed-in Owner without branch limits explicitly
approves the ordered office and on-call phones, plus an optional final phone
system destination through the native call commands documented in `API.md`.
The Owner configures Twilio's incoming voice URL to the installation origin
with the path `/api/glove/voice/inbound`, using POST.

Glove authenticates the exact external URL and decoded form fields with the
Twilio signature and checks the connected account and called number. Only a
unique current customer number is accepted. A TwiML Dial action rings each
approved destination for 20 seconds before the next, ending on an answered
leg or after all destinations. The final configured destination can be the
Owner's existing phone system. A stale configuration or withdrawn configuring
Owner authority closes further routing. Signed callback replays preserve one
call record and one set of outcomes. Calls show their provider references,
caller, duration and actual answered or missed outcome in the Owner's customer
Conversation, Activity and business export.

Recording is unavailable. Glove requests no recording, stores no recording
URL and makes no claim about recording outside Glove. Unknown or shared
numbers and caller-disconnect status callbacks remain unbuilt. There is no
claim that the current slice logs every call or supplies recording notice.

Missed-call webhooks send nothing automatically. The Owner can explicitly
request one booking text for a missed call using their existing, unexpired,
unrevoked offer for that same customer. Separate missed-call consent must
retain the current number, source, exact wording, time and customer zone.
Visit consent does not grant this permission. Texts obey quiet hours and STOP,
include the business identity and opt-out instructions, reserve one provider
attempt and never automatically retry. A provider acceptance is not delivery;
only an authenticated callback supplies the latter. The booking bearer and
text body are transient and never enter call logs or archives.

Only the unscoped Owner receives native call metadata or routing configuration.
Customer erasure removes related calls, messages, saved outcomes and personal
history. An opaque saved callback identity remains as an inert tombstone; a
replay cannot revive an erased call even after the phone number is reused. Existing archive rules exclude Twilio
keys, send reservations and booking credentials. Restored history is inert
until reconnection and explicit fresh actions; the new connection identity
cannot accept the old callback context. Complete restoration proof remains a
Gap. Browser configuration and reply controls, recording, automatic texts,
unknown callers and number activation remain COMM-009 work. The adopted
preparatory authority, custody and explicit reply defaults await ct approval;
COMM-009 stays PARTIAL.

Protocol references consulted on 27 October 2026:
[Twilio Dial](https://www.twilio.com/docs/voice/twiml/dial) and
[request validation](https://www.twilio.com/docs/usage/security).
The provider-edge fake is in `tests/fixtures/twilio.mjs`; the public-door flow
is in `tests/api/voice-flow.mjs`, registered by `tests/api/reminders.test.mjs`.
