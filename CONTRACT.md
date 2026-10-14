# Glove product contract

Glove is for the owner or dispatcher of an Australian trade business with 2–10 technicians (HVAC, plumbing, electrical or recurring commercial service). Its job: turn a customer-approved quote into a booked and assigned field visit, keep the technician's evidence through a lost signal, and prepare an invoice export for the business's own accounting system, with every step and every person on the record.

The buyer is the company doing the work for paying customers. Glove is not a service marketplace. The twelve first-release clauses below are the product's promise; [ACCEPTANCE.md](ACCEPTANCE.md) records how each is proven and its current status. A named test is a target, not evidence, until its result is recorded there.

## Operating rules

- A new installation starts empty: no customers, prices, technicians or jobs. The owner enters real business data or moves it in.
- One business, one operating timezone. Visits are booked as local date and time in that timezone and stored as exact instants; a time that does not exist (a daylight-saving gap) is refused.
- Money is Australian dollars as exact decimal text (cents); quantities to three decimal places. GST is 10% of the taxable subtotal, rounded half up once per document. No floating point.
- Every change is a command with an identity. Sending the same identity and content again returns the first outcome; the same identity with different content, or from another person, is refused.
- Every command handler and every read door checks the signed-in person's live session and current role itself; the change then commits in one D1 batch that re-checks that session and role first. Screens hiding a button is never the control.
- Records carry versions. A change made against an older version than the current one is refused with the current record, so nobody overwrites what they did not see.
- The timeline is append-only. Captured photos and signatures are immutable.
- Glove never claims what it has no evidence for: a quote "recorded as sent" is a person's statement of what they did, not delivery; a technician has arrived only when their phone recorded it; a visit moved in from another system has no arrival or sign-off unless the source had it.

## People and authority

| Role | Can do |
| --- | --- |
| Owner | Everything at the desk: business settings, roles, move-in, approvals, invoices. Cannot record field evidence (only a technician can). |
| Dispatcher | Customers and sites, enquiries, quotes (draft, revise, approve the price, record sent and the customer's answer), jobs, booking and changing visits, reviewing conflicts and late evidence, deciding agent proposals. |
| Office | Customers and sites, enquiries, record a quote as sent, invoice preparation, approval, export and correction. |
| Technician | Sees only visits ever assigned to them (with those jobs' customers, sites and evidence, no prices); records arrival, checklist, notes, photos, materials and completion on those visits. |
| Agent | Reads the desk's records; prepares enquiries, quote drafts and revisions, dispatch proposals and invoice drafts. Never approves, sends, records a customer's answer, books, exports or changes roles. |
| Viewer | Reads the desk's records. |

The native installation owner is always Owner. Every other person is invited and given one role by the owner; a person without a Glove role is a Viewer. Nobody can change their own role.

## First release: twelve clauses

1. **GLOVE-01 Set up the business and its people.** The owner records the business (name, ABN, booking timezone, payment terms), a price book of services with prices ex GST and their job checklists (items marked required or not), and the technicians; invites people and gives each one role; links a technician to the person who signs in. Each role can do only what the table above says, through any door.
2. **GLOVE-02 Customers and sites.** The desk records customers (contact, email, billing address) and the sites where work happens, with access notes. Edits apply only to the version the person saw.
3. **GLOVE-03 Enquiry to an approved quote.** An enquiry becomes a quote of priced lines (from the price book or custom) with GST computed exactly. A person approves one exact revision's price. Any price change is a new revision that needs its own approval; earlier revisions and approvals stay on the record.
4. **GLOVE-04 The customer's answer, recorded honestly.** A person records how the approved quote went out (email, printed, in person, phone) without any delivery claim, and records the customer's acceptance or decline of the current revision: who answered, how (signed, email reply, phone, in person) and who recorded it. An accepted quote is frozen.
5. **GLOVE-05 Book and assign the visit.** An accepted quote becomes one job carrying the accepted lines and the checklist from its services. The dispatcher books visits for a technician at local times in the business timezone. A booking that overlaps another visit for that technician is refused until the dispatcher reviews those exact conflicts and confirms.
6. **GLOVE-06 Field capture through a connectivity interruption.** On a phone, the assigned technician records arrival, checklist results (done, or not applicable with a reason), notes, photos and materials. Each item is kept on the phone with its capture time until the server confirms it; resending after a lost signal lands it exactly once. Photos are stored as received and readable only by people allowed to see that job.
7. **GLOVE-07 Dispatch change with conflict review.** The dispatcher changes a visit's technician, date or time with a reason. The change is refused if the visit changed since they opened it, and must be reviewed when it overlaps another visit or the technician has already recorded evidence on it. Evidence that arrives from a technician after the visit moved on is kept, flagged on the visit, and reviewed by the dispatcher. Every change keeps its before and after on the record. A new technician records their own arrival; the earlier arrival stays as evidence.
8. **GLOVE-08 Customer completion evidence.** The technician completes a visit only after recording their arrival, and completes the job only when every required checklist item is done or not applicable with a reason. Completion carries a work summary and either the customer's name and drawn signature or why the customer could not sign.
9. **GLOVE-09 Invoice preparation, export and correction trail.** For a completed job, the office prepares an invoice from the accepted lines plus the recorded materials priced from the price book (unpriced materials must be priced explicitly), approves one exact revision, and exports every approved revision once in a CSV in Xero's sales-invoice import columns. An exported invoice is never changed: a correction is a new revision that names the revision and export it corrects, is approved, and exports as its own numbered row.
10. **GLOVE-10 Agent prepares, person approves.** An agent prepares quote drafts, dispatch proposals (job, technician, time, rationale, evidence) and invoice drafts through the same public commands. A person approves or declines each one; the approval record names what was prepared, by whom, who decided and when. An agent can never decide its own preparation or perform a person's step.
11. **GLOVE-11 Move in from ServiceM8 with dry run, journal and undo.** The owner previews a move-in from ServiceM8's API lists (clients and contacts, staff, jobs, activities, materials, attachments): what each source record becomes, what is merged, rejected (with the reason and location) or not used, and which attachment files are missing. Committing applies exactly the reviewed preview through Base's import kit journal, keeping every ServiceM8 ID and the exact received files. An unchanged repeat writes nothing; undo removes exactly what the move-in wrote, and refuses while later Glove work refers to it or a moved-in record was edited since.
12. **GLOVE-12 The whole timeline, exported and restorable.** Every job shows its timeline: each step, who did it in which role, with which command. The owner or office downloads the business as JSON. `rer export` and `rer import` move the complete installation (records, timeline, photos and signatures, command outcomes, move-in journal and originals) into a fresh checkout, which keeps working; a session from the old installation does not open it.

HTTP-001 from the foundation stays: Hono serves `/health` and owns `/api` and `/api/*`; Start serves documents; unknown routes return 404.

## Decided defaults

- First buyer: one Australian trade business, one operating timezone (default `Australia/Sydney`, chosen at setup), AUD, GST 10% with GST-free lines available.
- Quote and invoice pricing is human-approved per exact revision; no price changes without a new approval.
- Invoice preparation, not invoicing: Glove exports to the business's accounting system. The first export format is Xero's sales-invoice CSV columns with account code 200 and tax types "GST on Income" / "GST Free Income"; the owner checks it against their own Xero settings. Invoice numbers are `INV-0001`…; a correction exports as `INV-0001-R2`.
- Payment terms default to 14 days from the export date.
- The first move-in kit is ServiceM8 (Australian, unlimited-user pricing, the closest incumbent for the first buyer). Its input is the JSON from ServiceM8's REST API object lists, which the owner saves with their own API access; CSV reports are not used because ServiceM8 documents that they omit job detail and files.
- Photos are shrunk on the phone to at most 1600 px JPEG and stored up to 1.5 MB each in D1.
- Agents work as invited people with the Agent role and the same public commands; no model account is embedded.

## Out of the first release

Route optimisation and maps, live technician location, SMS or email delivery, card payments, full accounting or a tax engine, payroll and timesheets, stock and purchasing, recurring service agreements, customer portal, a labour marketplace and enterprise service-trade parity. Integrations for maps, SMS, accounting and payments are separate commissioning items. A real owner ServiceM8 export has not been reconciled yet: the move-in kit is proven against documented-shape fixtures only. Hosted deployment, provider delivery and legal name clearance are separate evidence boundaries. "Glove" is the working name.
