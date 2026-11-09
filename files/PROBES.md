Runtime probes: FIELD-010

All probes run through the production HTTP Worker, native authentication and D1, with only provider transport and the existing boundary clock faked. The focused registration is loaded by the existing Verify API glob.

PROBE FIELD-010 1: dispatcher commands, crew, owner job-created rule, recurring series, scheduled horizon pass, explicitly granted agent, public booking choice, and move-in undo -> independently expected generic line per affected technician per subscribed phone; unchanged and ended visits and no-visit commands send nothing.
PROBE FIELD-010 2: decrypt every captured request with the receiving phone's keys -> only title, generic line and a single-job opaque id (null for aggregate); another phone cannot decrypt it.
PROBE FIELD-010 3: verify every captured ES256 token and encrypted record -> correct origin audience, business-mail subject or installation-origin fallback, at most twelve hours, 86400-second TTL, one final record; replay, repeated scheduled passes and actual Worker restart add no attempts.
PROBE FIELD-010 4: provider edge answers 201, 500, 404 and 410 and a transport-boundary unreachable host -> exact readable phone outcomes and attributable status facts; only unknown subscriptions removed, no retries.
PROBE FIELD-010 5: Technician subscribes, removes and resubscribes a phone -> only current subscribed phones receive later changes; another person's removal has no effect; signed-out sessions cannot resubscribe; erasure and replay cannot revive a visit or send its deleted id; Activity and export contain attributable outcomes without endpoints or keys.

Reproductions before repair:
- A billed weekly series initially generated one occurrence and two pushes. The next day's actual Worker scheduled pass generated its next occurrence but left the push count at two, expected four.
- A later ServiceM8 batch created a future visit. After the owner linked its imported technician to an existing subscribed person, a successful undo removed the visit but sent zero pushes, expected one.
- A later ServiceM8 commit that includes a technician already edited to link a person is refused by the existing native-edit guard. This guard is retained. The successful committed removal door is qualified; no guard bypass is claimed.

The existing harness maps rejected outbound callbacks to HTTP 500. The focused journey uses its existing workerPlugins seam to reject fetch for the unreachable synthetic host. It changes no shared harness or phone-key fixture and fakes only the network boundary; the other statuses use pushes.status.
