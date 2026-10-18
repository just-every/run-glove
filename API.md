# Glove API

People and agents use the same doors. Sign in with a native session (an agent is an invited person with the Agent role); every door checks the session and the current role on each request.

## Reads

- `GET /api/glove/state` — everything this role may see: `{version, actor:{id,name,role}, business, customers, sites, services, technicians, enquiries, quotes, jobs, visits, captures, invoices, exports, proposals, approvals, imports, events, operators}`. A technician gets only visits ever assigned to them and those jobs' customers, sites and evidence, without prices, and only the field side of their jobs' timelines (no quote, proposal or invoice entries). `events` is the newest 500 timeline entries, for Activity; `operators` is filled for the owner only.
- `GET /api/glove/jobs/<id>/timeline` — `{events}`: every timeline entry of one job, oldest first, however busy the business is (404 for a job this person cannot see).
- `GET /api/glove/files/<id>` — photo or signature bytes, for people allowed to see that job.
- `GET /api/glove/exports/<id>.csv` — an invoice export (owner, office).
- `GET /api/glove/equipment/<id>` — one unit: `{equipment, site, warranty:{manufacturer, labor}, history, refrigerant}`. Each warranty is `{until, state: none|active|expiring|expired, daysLeft}` (expiring within 90 days, in the business timezone); `history` lists every job that named the unit or recorded a field item against it, with its visits and those items; `refrigerant` is the unit's log `{entries, byType, added, recovered}`. A technician reads only units at their visits' sites, with only their jobs.
- `GET /api/glove/reports/warranties` — `{asOf, expiringDays, expiring, expired}`: every manufacturer or labor warranty ending within 90 days or already ended (not technicians).
- `GET /api/glove/reports/refrigerant?from=YYYY-MM-DD&to=YYYY-MM-DD` — refrigerant added and recovered in the period (by the phone's local date): `{entries, byType, byEquipment, added, recovered}`, each entry with the technician and EPA 608 number (not technicians).
- `GET /api/glove/reports/sources` — the request pipeline and conversion by source: `{sources:[{source, requests, contacted, quoted, won, lost, conversion, wonValue, invoiced}], total, pipeline:[{stage, requests:[{id, customer, description, source, since, ageDays, lostReason}]}]}`. `conversion` is won ÷ requests as a percentage to one decimal; `wonValue` sums accepted quote totals and `invoiced` the latest approved invoice revision of each won job (not technicians).
- `GET /api/glove/export` — the whole business as JSON, with the complete timeline and file list (owner, office).

## Commands

`POST /api/glove/commands` with `{"commandId": "<new uuid>", "type": "...", "payload": {...}}` from the installation's own origin. Answers `{ok:true, result, version}` or `{ok:false, error:{code, message, details}}` (400 input, 401 session, 403 role or origin, 404 missing, 409 conflict). Send the same `commandId` and payload again to recover a lost answer; a different payload or person with that id is refused (`IDEMPOTENCY`). Money and quantities are decimal strings (`"189.00"`, `"0.5"`). Records carry `version`; send the version you saw where a payload names one, or get `STALE` with the current record.

| Type | Payload | Who |
| --- | --- | --- |
| `business.save` | `{name, abn?, timezone, email?, phone?, address?, paymentTermsDays?, version?}` | owner |
| `role.set` | `{operatorId, role: dispatcher\|technician\|office\|agent\|viewer\|owner}` | owner |
| `service.save` | `{id?, version?, code, name, unit?, unitPrice, tax: GST\|FREE, checklist?: [{label, required}]}` | owner |
| `technician.save` | `{id?, version?, name, operatorId?, phone?, epa608?, active?}` (`epa608`: the EPA Section 608 certification number refrigerant records carry) | owner |
| `customer.save` | `{id?, version?, name, abn?, contact?, email?, phone?, billingAddress?}` | owner, dispatcher, office |
| `site.save` | `{id?, version?, customerId, address, accessNotes?}` | owner, dispatcher, office |
| `equipment.save` | `{id?, version?, siteId \| visitId, type, make?, model?, serial?, installedOn?, refrigerant?, location?, manufacturerWarrantyUntil?, laborWarrantyUntil?, photo?:{mediaType, base64}}` (dates YYYY-MM-DD; a photo is added to the unit's photos). A technician sends `visitId` of a visit assigned to them and the unit lands at (or must already be at) that visit's site | owner, dispatcher, office, the assigned technician |
| `enquiry.create` | `{customerId, siteId?, description, source?: website\|google\|phone\|text\|angi\|thumbtack\|yelp\|referral\|repeat customer\|marketing campaign\|email\|in person}` (default phone) → stage `new` | desk, agent |
| `enquiry.contact` / `enquiry.close` | `{enquiryId, version, note?}` → stage `contacted` / `{enquiryId, version, reason}` → stage `lost` with the reason; drafting a quote moves a request to `quoted` and the customer's acceptance to `won` | desk |
| `quote.draft` | `{enquiryId? \| customerId, siteId, title, lines:[{description, quantity, unitPrice, tax?, serviceId?}], notes?}` | owner, dispatcher, agent |
| `quote.revise` | `{quoteId, version, lines, title?, notes?}` → new revision, needs approval | owner, dispatcher, agent |
| `quote.approve` | `{quoteId, version, revision}` (the current revision; never by the agent that prepared it) | owner, dispatcher |
| `quote.markSent` | `{quoteId, version, channel: email\|printed\|in person\|phone, note?}` — a record, not delivery | owner, dispatcher, office |
| `quote.accept` / `quote.decline` | `{quoteId, version, revision, method: signed\|email reply\|phone\|in person, customerName, note?}` | owner, dispatcher |
| `job.create` | `{quoteId, checklist?, equipmentIds?}` (units at the quote's site the job is for) | owner, dispatcher |
| `visit.book` | `{jobId, technicianId, date: YYYY-MM-DD, start: HH:MM, end: HH:MM, reason?, acknowledge?: [codes]}` | owner, dispatcher |
| `visit.change` | `{visitId, version, technicianId?, date?, start?, end?, reason, acknowledge?}` | owner, dispatcher |
| `visit.cancel` / `visit.reviewLateEvidence` | `{visitId, version, reason}` / `{visitId, version, note?}` | owner, dispatcher |
| `proposal.prepare` | `{kind: "dispatch", plan:{jobId, technicianId, date, start, end}, rationale, evidence?: [text]}` | agent, owner, dispatcher |
| `proposal.approve` / `proposal.decline` | `{proposalId, version, acknowledge?}` / `{proposalId, version, reason}`; never by the preparer | owner, dispatcher |
| `visit.arrive` | `{visitId, deviceTime}` | the assigned technician |
| `visit.capture` | `{visitId, deviceTime, kind: checklist\|note\|photo\|material, …}`: checklist `{itemId, result: done\|not applicable, note}` (note required for not applicable); note `{text}`; photo `{photo:{mediaType: image/jpeg\|png\|webp, base64}, caption?}` (≤1.5 MB); material `{serviceId? , description?, quantity, unit?}`; refrigerant `{equipmentId, refrigerant?, added?, recovered?, certification?}` (pounds; type defaults to the unit's refrigerant, certification to the technician's `epa608`). Any kind takes `equipmentId` for a unit at the job's site | the assigned technician |
| `visit.complete` | `{visitId, deviceTime, summary, jobComplete?: true, signoff: {customerName, signature:{mediaType, base64}} \| {absentReason}}` | the assigned technician |
| `invoice.prepare` | `{jobId, lines?}` (default: accepted lines plus priced materials) | owner, office, agent |
| `invoice.revise` / `invoice.correct` | `{invoiceId, version, reason, lines}` (revise before export, correct after; a revised correction still corrects the exported revision and exports as `INV-0001-R<n>`) | owner, office (agent may revise) |
| `invoice.approve` | `{invoiceId, version, revision}` (never by the agent that prepared it) | owner, office |
| `invoice.export` | `{}` — every approved revision, once | owner, office |
| `import.stage` / `import.commit` / `import.undo` | see [IMPORT.md](IMPORT.md) | owner |

## Conflicts a dispatcher reviews

`visit.book`, `visit.change` and `proposal.approve` answer `CONFLICT_REVIEW` with `details.conflicts: [{code, message}]` when the booking overlaps another visit for that technician (`overlap:<visitId>`) or the technician has already recorded evidence on the visit (`evidence`). Send the same command again with `acknowledge` listing those exact codes to confirm; the reviewed conflicts are kept on the visit's assignment record.

## For an agent

Read `GET /api/glove/state`, then prepare: `enquiry.create`, `quote.draft`, `quote.revise`, `proposal.prepare` (dispatch) and `invoice.prepare` / `invoice.revise`. Everything you prepare is marked with your name and role and waits for a person; `approvals` in state shows each decision. You cannot approve, record a customer's answer, book, export, move in or change roles.
