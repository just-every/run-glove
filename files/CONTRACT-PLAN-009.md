Candidate: 0fbef999d60de59a2f2ca77c044b0014770baf71

#### PLAN-009 — Customer explicit entitlement decline

*Tier:* Core · *From:* PLAN-004 · *Cites:* BASE-AUDIT-001, BASE-ROLE-001

**Requirement.** Customer explicit entitlement decline supports the service business with the outcomes below. The [operating rules](docs/service-work-rules.md#plan-004-operating-rules) retain the record formats and calculations.

**Acceptance.**
1. A decline is the customer's own explicit answer, recorded by a person as `GLOVE-04` records a quote's answer: the desk (owner, dispatcher, office) records it for one included visit of an agreement (agreement decline action: agreement version, zero-based ordinal, who declined, how — phone, email reply, text reply or in person — and their reason).
2. Glove never infers a decline from silence, a cancelled booking, term expiry or agreement end action.
3. It is refused for a completed or already declined visit, and while that visit has a live booking (cancel the booking first, under `GLOVE-07`).
4. The decline keeps the visit's due date, the recorder's name and role and the time, is appended to the agreement (never edited), is named on the Activity timeline (agreement visit declined action) and travels in the export.
5. A declined visit leaves the due list, the `REPORT-001` agreements-due tile and the `AGENT-008, AGENT-016` brief; it is no longer "left" under `PLAN-002`, and no included job can be made for it.
6. The decline joins the site's property history (`CUST-001`) as an agreement decline row.


Status row from the same candidate:

| `PLAN-009` | Customer explicit entitlement decline | target | done | `src/glove/agreement-due.ts`, `src/glove/agreements.ts`, `src/glove/booking-offers.ts`, `src/glove/public-booking.ts`, `src/glove/access.ts`, `src/glove/commands/dispatch.ts`, `src/ui/due-visits.tsx`, `src/ui/booking-offers.tsx`, `src/ui/customer-booking.tsx`, `src/ui/decline-visit.tsx`, `src/glove/mail.ts`, `tests/api/agreements.test.mjs`, `tests/api/security.test.mjs`, `tests/browser/due-visits.spec.ts`, `tests/portable.mjs`, `src/glove/history.ts`; `tests/api/agreements.test.mjs` › “Forty due entitlements and exact owner projections survive bookings, cancellations, completion, declines, delivery and restart” (recordedDeclineAnswers) proves points 1–6: all desk roles and recorded methods, explicit-answer refusals and retention, exact due projections and entitlements, refused included jobs, and attributable property history after Worker restart | |
