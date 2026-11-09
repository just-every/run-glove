# BOOK-017 qualification — sx-glove-c-f208

Repository: just-every/run-glove
Branch: cloud/sx-glove-c-f208
Candidate: 629d11606d056eb44d3a95305e106a99ff5e84d8
Integrated main: 727418aa08e130579dd3a91f6586161b57b26b08
PR: none; Verify has a push entry point for this branch.

CLAIM BOOK-017 DONE points=1,2,3,4,5,6,7,8 tests=tests/api/lead-matching.test.mjs#BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart; tests/browser/journey.spec.ts#BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017 Reserve with Google request intake and external-send attestation at 1440 and 390

All eight native acceptance points are qualified by an extension of the existing BOOK-014 registration. No product repair was needed. Only the test and its regenerated source-lock entry changed. Existing BOOK-014 assertions are preserved byte for byte; tests/api/merge.test.mjs and the recorded fixture file are unchanged. No acceptance or Status cells changed. The lander decides the actual PARTIAL → DONE transition after its gate.

Counts on integrated main and candidate: 40 DONE, 194 PARTIAL, 29 MISSING, 263 total (unchanged by this round). The initial checkout had 39 DONE and 195 PARTIAL; the integrated FIELD-010 landing accounts for that upstream change. Test inventory was 199 at the initial checkout and is now 200 of 200 after preserving main's schedule-push registration. This round adds zero registrations. If the fleet accepts BOOK-017 alone, its judgment would move one PARTIAL to DONE; this cloud has not written that judgment.

## Plan and result

The complete original execution plan is PLAN.md. The work followed its seven steps: read the target and existing proof, extend one existing public-door journey, qualify all requested outcomes, run touched checks and screens, generate and restore contract views then lock last, integrate main and push the named branch, and publish separate non-secret evidence. The only plan row proposed for change is BOOK-017, acceptance points 1–8 qualified and ready for the round's independent gate. No other clause is claimed. No plan was rebuilt.

Development iterations corrected assertions newly written in this round: token last-use metadata was initialized before the refusal snapshot, event detail was read from the export rather than Activity's intentionally smaller projection, and the unordered request statuses were sorted before comparison. These were test-authoring corrections, not production fixes or CI repair rounds. No existing assertion was removed, weakened, skipped or moved behind a condition.

## Frozen acceptance rubric

One row per acceptance sentence. All runtime checks use the real production Worker doors on fresh D1; provider behavior is faked only at the existing network edge. The fixture's time is pinned while constructing the existing recorded shape, and the Worker has its own explicit receipt clock.

| Item | Result | Named journey and lines | Observed outcome |
| --- | --- | --- | --- |
| P1 | MET; push Verify 42597679105 in_progress | `tests/api/lead-matching.test.mjs:233`–263, `BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart` → `BOOK-017 point 1:` | The documented Booking with Slot and UserInformation returns only {ok:true}, creates one source-linked new request and the exact customer identity; wrong password, other username and missing Basic authentication return the same 401 LEAD body and change no state. The disconnected receiver returns 404 and changes no state. |
| P2 | MET; push Verify 42597679105 in_progress | `tests/api/lead-matching.test.mjs:265`–293, `BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart` → `BOOK-017 point 2:` | A signed-in unscoped Owner connects. Office, Dispatcher, branch-limited Owner and custom role receive FORBIDDEN with unchanged state; signed-out and integration-token attempts return 401 and 403 and no result. The issued credential stays usable. Request and Activity facts claim no Google server or BookingNotification. The existing browser journey shows the explicit relay-only boundary. |
| P3 | MET; push Verify 42597679105 in_progress | `tests/api/lead-matching.test.mjs:295`–309, `BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart` → `BOOK-017 point 3:` | Exact booking identity, merchant and service, five-day-ahead slot, 3600-second duration and CONFIRMED status survive disposal and recreation of the actual Worker. No job, visit, service address, message, calendar call or push appears. Outbound attempts and customer-email count are unchanged. |
| P4 | MET; push Verify 42597679105 in_progress | `tests/api/lead-matching.test.mjs:312`–334, `BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart` → `BOOK-017 point 4:` | CONFIRMED and PENDING_MERCHANT_CONFIRMATION produce requests without leadCost. Numeric slot and user facts become no cost; Activity has no cost event and exported lead.received detail has cost:null. |
| P5 | MET; push Verify 42597679105 in_progress | `tests/api/lead-matching.test.mjs:336`–349, `BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart` → `BOOK-017 point 5:` | CANCELED, CANCELLED, DECLINED, PENDING, STATUS_UNSPECIFIED and empty statuses are rejected with no changes, including cancellation of an admitted ID. A valid changed merchant, service, slot, duration and status for an admitted ID is acknowledged as intake but leaves the first request identical. |
| P6 | MET; push Verify 42597679105 in_progress | `tests/api/lead-matching.test.mjs:351`–372, `BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart` → `BOOK-017 point 6:` | Two simultaneous deliveries of a fresh booking ID return 200 and create exactly one request and one lead.received fact. Serial retry, restart retry and changed-duration replay preserve the first request and all state, including Activity and export receipt counts; no outbound attempt occurs. |
| P7 | MET; push Verify 42597679105 in_progress | `tests/api/lead-matching.test.mjs:374`–386, `BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart` → `BOOK-017 point 7:` | With receipt pinned at 2030-03-10 12:00 UTC and slot at 2030-03-15 12:00 UTC, every request has createdAt=receivedAt=receipt and dueBy=2030-03-10 12:37 UTC under the 37-minute connection. providerTime is null and acknowledgment remains queued. |
| P8 | MET; push Verify 42597679105 in_progress | `tests/api/lead-matching.test.mjs:388`–422, `BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart` → `BOOK-017 point 8:` | Activity attributes every receipt to lead:reserve-google, Reserve with Google lead feed, provider. Business export retains the same actor, command, time, request and booking facts and excludes the password. Rotation refuses the old password, erasure followed by restart and replay resurrects nothing, and disconnect closes the receiver. The browser journey and inspected lead-source documentation disclose no live activation. |

The screen and documentation part of P8 is also covered by the existing browser journey `tests/browser/journey.spec.ts:1233`, with the lead panel at 1272–1281 and built documentation at 1320–1327. `src/ui/lead-connections.tsx:29` and `docs/lead-sources.md:32` are inspected for the relay-only, unsupported-live-integration boundary. There is no new static-copy pin test. Screenshots are retained for both 1440 and 390. The connection password is dismissed before any screenshot.

| Inherited duty | Result | Proof |
| --- | --- | --- |
| BASE-DATA-004 outbound flows | PASS locally | Existing citation at CONTRACT.md:611; API points 1, 3, 4 and 6 check unchanged outbound attempts, zero customer mail, no calendar writes, jobs, visits, messages or pushes. Point 8 checks attributable Activity and export plus erasure replay. |

## DONE-RIDERS

| Row | Result | Proof |
| --- | --- | --- |
| 1 | MET locally; exact-head Verify pending | All eight rows above; public production HTTP and command doors; existing browser journey at lines 1233–1334. |
| 2 | PASS | Points 1, 2, 4, 5, 6 and 8 use real seeded data, unsafe refusals, exact state preservation, no invented cost and erasure replay. |
| 3 | PENDING CI | Verify 42597679105 event=push status=in_progress conclusion=None; verification.json API glob includes the existing registration and the browser shard runs the existing journey. |
| 4 | PASS | Final local API and browser receipts are bound to 629d11606d056eb44d3a95305e106a99ff5e84d8. No relevant byte changes after these runs. |
| 5 | PASS | CONTRACT.md:611 already cites BASE-DATA-004. Points 2, 3 and 8 state the request-intake and no-outbound boundary. |
| 6 | PASS mechanical; judgment bookkeeping reserved | Generator write and check run with --clauses BOOK-017; generated views restored whole from main. Status, Gap, Evidence and source counts are unchanged by this round; the lander owns the copied family Gap and final evidence. |
| 7 | PASS | No acceptance, requirement, citation or policy text changed. CONTRACT.md diff is empty; all 263 Status rows are retained. |
| 8 | PASS | Point 2 covers current Owner success and every requested excluded actor. Points 1 and 8 cover wrong, rotated and disconnected credentials without business writes. |
| 9 | PASS | Only local recorded-shape intake is claimed. No live Google account, booking server, feed publication, BookingNotification, updates, cancellations or provider reply is claimed. BOOK-004 retains its separate held requirements. |
| 10 | PASS: inapplicable | No policy default adopted; existing native Owner and relay policy are unchanged. Shipped rulings and rider index reviewed. |
| 11 | PENDING GUARDED LANDER | Integrated main is 727418aa08e130579dd3a91f6586161b57b26b08, not candidate. Full-history publication scan and exact-main Run site are not run in this cloud. The fleet must scan and land after exact-head Verify. |

## Pre-ready self-check

1. Each named native outcome is reached through the receiver, command door, Activity, business export or existing built browser journey. Exact-head CI: Verify 42597679105 event=push status=in_progress conclusion=None.
2. No original assertion removed, narrowed, skipped or conditionally hidden; previous BOOK-014 test prefix matches main byte for byte. Merge test unchanged.
3. Rotation rejects the old credential, disconnect rejects intake, and erased-person replay after a real Worker restart preserves the tombstone and all state (P8).
4. No screen code touched. The existing lead panel has text controls rather than icon-only controls and full rounded borders; screenshots show its existing layout at both requested widths. No new tooltip, typography or placement change was introduced.
5. Source lock fresh, generated views proved and restored, inventory at cap. Exact-head Verify is reported above. Publication scan, main equality and Run site remain fleet duties, without a fabricated receipt.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node scripts/contract-docs.mjs write --clauses BOOK-017 then check --clauses BOOK-017 exit=0; ledger=none exit=0

Publication scan on 629d11606d056eb44d3a95305e106a99ff5e84d8: complete=UNESTABLISHED; historyScanned=UNESTABLISHED; findings=UNESTABLISHED. Not run in cloud under the explicit branch-only adaptation. The clone has full history. Main equality=false; Run site on candidate=not run (main-only workflow). No release, main push, live integration or provider activation was attempted.

## Runtime probes

PROBE BOOK-017 1: recorded Booking POST with correct Basic credential → 200 and one request; wrong password, another user or missing credential → identical 401 LEAD and unchanged state; disconnected → 404 unchanged.
PROBE BOOK-017 2: Owner lead.connect → one relay credential; Office, Dispatcher, scoped Owner, custom role, signed-out and integration token → refusal without changing business state or issuing a credential.
PROBE BOOK-017 3: accepted Booking, then actual Worker restart → exact source facts retained; zero visit, job, message, calendar call or push and unchanged outbound counters.
PROBE BOOK-017 4: confirmed and pending-merchant records → no leadCost, no cost event, exported receipt cost null.
PROBE BOOK-017 5: canceled and unsupported statuses → 401 unchanged; changed-slot update for an admitted ID → 200 intake receipt with original state unchanged.
PROBE BOOK-017 6: two concurrent posts, serial retry and restart replay → one request and one lead.received fact, first facts retained.
PROBE BOOK-017 7: slot five days ahead with receipt at 12:00 and 37-minute window → creation at receipt and due at 12:37, never at slot start.
PROBE BOOK-017 8: Activity and export reads → attributable Reserve feed receipt without password; Owner screen and built docs → explicit relay-only and no-live-activation disclosure; rotation, disconnect and erased-capture replay refuse or preserve state.

## Custody and limitations

Verify 42597679105 event=push status=in_progress conclusion=None

The packet includes actual local receipts, full final API and browser logs, source-integrity check output, inventory and all relevant screenshots. Product custody and evidence publication are separate. This report claims native BOOK-017 intake only; BOOK-004's provider reply and Google programme-gated remainder is unchanged. No new account, key, ruling or Base change is needed for BOOK-017. Publication scan and landing are external fleet gates, not claimed results. No product blocker found. The first report-only upload returned Git exit 1 with no HTTP status supplied. Refreshing the fleet bundle and reinstalling its Git helper recovered the transfer on attempt 2. The 29-file snapshot at d394cc5bec28e3dee7b35fd45961c83db87ebd10 was fetched back with every manifest and file hash verified; EVIDENCE-RETURN.json records that actual prior-snapshot receipt. The final publication may advance the same evidence ref with updated CI and report receipts, without changing any product byte.
