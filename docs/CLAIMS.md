# Glove claims

Generated from CONTRACT.md. Change the source and regenerate.

Every capability the homepage states (the design desk's page-s1 structure, owner-approved 17 October 2026: one job, Ellen Brooks's water heater, from the call to a year of Comfort Club) maps to a clause above. Status is judged from the clauses' statuses at the judged commit: `done` when every backing clause is done, `missing` when none has started, otherwise `partial`. Code names the path that backs the claim today, "partly" with what exists, or "contract, not yet in code". A claim ahead of the code stays on the page; its clauses are what the build rounds deliver.

| # | Claim | Clauses | Status | Code |
| ---: | --- | --- | --- | --- |
| 1 | Every call becomes a paid job. | `GLOVE-03`, `GLOVE-05`, `GLOVE-09`, `BOOK-005`, `AGENT-001`, `PAY-002` | partial | partly: request to quote to job to invoice in `src/glove/commands/quotes.ts`, `dispatch.ts`, `invoices.ts`; no calls or payments |
| 2 | Glove answers your calls and texts | `AGENT-001`, `COMM-002`, `COMM-009` | missing | contract, not yet in code |
| 3 | books the job | `GLOVE-05`, `BOOK-002`, `BOOK-005` | partial | partly: `src/glove/commands/dispatch.ts` (`job.create`, `visit.book`) |
| 4 | sends the tech | `GLOVE-05` | done | `src/glove/commands/dispatch.ts`, `src/ui/technician.tsx` |
| 5 | takes payment on site | `PAY-003` | missing | contract, not yet in code |
| 6 | keeps every maintenance plan on schedule | `PLAN-004`, `AGENT-007` | partial | partly: due visits, Office batches, recorded declines and booking links emailed with provider delivery (`PLAN-004` partial, `src/glove/booking-offers.ts`, `src/glove/mail.ts`); internal maintenance-form checks ship under `AGENT-007`; agent outreach remains held |
| 7 | 100% free, open source alternative to Jobber, Housecall Pro and ServiceTitan | `DATA-004` | done | `LICENSE` |
| 8 | Hero cards: New call 7:42 am · Booked 11:00 am; Dispatch · Luis · Van 3 · ETA 10:52 am; Quote $1,850 · Accepted; Part on backorder · Rebooked Thu, Oct 22 · Customer texted; Paid on site · $412.00 · card; Maintenance plan · 1 visit left · next Apr 3 | `AGENT-001`, `GLOVE-05`, `DISP-005`, `GLOVE-04`, `AGENT-003`, `STOCK-002`, `COMM-003`, `PAY-003`, `PLAN-002` | partial | partly: booking, assignment, the accepted quote, the backorder flag and the rebooked visit (`src/glove/commands/dispatch.ts`, `quotes.ts`, `src/glove/delays.ts`); the plan's visits left and next due (`src/glove/agreements.ts`); calls, ETA, texts and payments are contract, not yet in code |
| 9 | 7:42 am · Front office: answers the first ring, says it is an automated assistant, asks what a good dispatcher would ask and books a real open slot | `AGENT-001`, `BOOK-002` | missing | contract, not yet in code |
| 10 | Booked job #4417 with the confirmation text ("You're booked for 11:00") | `GLOVE-05`, `COMM-003` | partial | partly: the booked visit (`src/glove/commands/dispatch.ts`); no texts |
| 11 | 8:05 am · Dispatch: the day board, 6 techs and 31 jobs on an 8 am-2 pm grid | `DISP-001` | done | `src/ui/dispatch.tsx`, `src/ui/dispatch-board.tsx` |
| 12 | The route-map strip over the board | `DISP-002` | done | `src/ui/dispatch-map.tsx`, `src/glove/maps.ts` |
| 13 | 8:05 am · Parts check · Van 3: every part job #4417 needs is on board (drain valve and anode), the shutoff from the 7:42 call is on the job, and the on-my-way text goes when Luis leaves Ortiz | `STOCK-001`, `AGENT-001`, `COMM-004` | partial | partly: the day's parts check in `src/glove/stock.ts`; calls and texts contract, not yet in code |
| 14 | 10:52 am · Tech app: photos, checklist, options and signature on the tech's phone, with or without signal | `FIELD-001`, `FIELD-002`, `GLOVE-06`, `GLOVE-08` | done | `src/ui/offline-day.ts`, `src/ui/outbox.ts`, `src/glove/commands/forms.ts`, `src/ui/technician.tsx` |
| 15 | The data plate read as MFG 2014 · 50 GAL · NAT GAS | `FIELD-006` | done | `src/glove/commands/nameplates.ts`, `src/ui/nameplates.tsx` |
| 16 | Good, better and best for the replacement; Better accepted | `QUOTE-001`, `GLOVE-04` | done | `src/glove/commands/quotes.ts`, `src/ui/options.tsx` |
| 17 | Paid on site · $412.00; $500 deposit paid | `PAY-003`, `QUOTE-003` | missing | contract, not yet in code |
| 18 | 12:40 pm · Job agent: rebooked before anyone called; finds stock at a branch and a new slot, Maya in dispatch taps Send, Ellen confirms by reply | `AGENT-003`, `STOCK-002`, `GLOVE-07`, `COMM-003` | partial | partly: the delay watch flags a visit whose purchase order is not fully received and prepares a move a dispatcher approves with conflict review (`src/glove/delays.ts`, `src/glove/commands/dispatch.ts`); purchasing in `src/glove/commands/purchasing.ts`; no customer texts |
| 19 | Interlude: Van 3 · Ellen's heater delivered · parts for all 5 jobs | `STOCK-001`, `STOCK-002` | done | the purchase order received to Van 3 (`src/glove/commands/purchasing.ts`) and the day's parts check (`src/glove/stock.ts`, `src/ui/stock.tsx`) |
| 20 | Thursday 10:05 am · Payments: card, tap to pay, ACH or financing on site | `PAY-002`, `PAY-003`, `PAY-006` | partial | partly: test-mode Stripe invoice foundation (`src/glove/payments.ts`); customer payment controls, tap to pay and financing remain |
| 21 | Each payment lands in QuickBooks Online | `LEDGER-001` | missing | contract, not yet in code |
| 22 | The job shows its real margin: job costing for #4417 + #4418, estimate against actual | `COST-004` | done | code: `src/glove/costing.ts`, `src/ui/costing.tsx` |
| 23 | Review request · goes out 6:00 pm | `COMM-008` | partial | explicit owner-triggered email is implemented; automatic scheduled requests remain unbuilt |
| 24 | Next 12 months · Maintenance plans: Comfort Club at $19/mo, 2 visits a year, 1 visit left, billed monthly, renews | `PLAN-002`, `PLAN-003` | partial | partly: plans, agreements with visits left and next due, and the member discount (`src/glove/agreements.ts`, `src/ui/agreements.tsx`); monthly billing and renewal are `PLAN-003`, not yet in code |
| 25 | A declined card fixed by an update link | `PAY-008` | partial | partly: consent-bound explicit test charges; update links remain unbuilt |
| 26 | Moving in: customers, jobs, quotes, recurring jobs and open balances from a source system in one import | `MOVE-001` | partial | Jobber clients, contact channels, properties, requests, staff, visits, CSV products, source quotes, job notes and attachments, and reconciled multi-job opening balances ship through the reviewed journal; separate contact people and future rule activation remain |
| 27 | Onto your office computer or your own server | `DATA-004`, `DATA-003` | partial | partly: runs on the owner's computer (`LICENSE`, `tests/browser/run.mjs`); a hosted deployment is not yet accepted |
| 28 | 9 customers share a phone number · review merge | `CUST-005` | done | `src/glove/duplicates.ts`, `src/glove/commands/merge.ts` |
| 29 | git clone, then `rer install`, `rer setup`, `rer dev` | `DATA-004` | done | `package.json` scripts (`deps`, `setup`, `dev`), `RUN-LOCALLY.md` |
| 30 | What it doesn't do: payroll, GPS hardware or marketing campaigns | Honest boundaries | done | `docs/limits.md` |
| 31 | Every job, done and paid. / Open source field service software for plumbing, HVAC, electrical and home service pros / Free and open source, MIT licensed | `GLOVE-08`, `GLOVE-09`, `PAY-002`, `DATA-004` | partial | partly: completion evidence and invoices (`src/glove/commands/field.ts`, `invoices.ts`); no payments |
| 32 | Closing cards: 31 jobs done, Paid today · $14,820 | `REPORT-001`, `PAY-002` | partial | partly: the owner dashboard with Stripe test-mode paid-today totals (`src/glove/dashboard.ts`, `src/ui/today.tsx`); live/customer payment controls remain |
