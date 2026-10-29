# Glove API

People and agents use the same doors. Sign in with a native session (an agent is an invited person with the Agent role), or send `Authorization: Bearer <token>` with an owner-issued integration token (API-002), which acts as its role and branch; every door checks the session or token and the current role on each request.

## Reads

- `GET /api/glove/field-quotes?visitId=<id>` — online field pricing for an active signed-in technician with an owner grant bound to that sign-in and the visit’s current assignment. Returns the selling-price catalogue, their owner-set bounds and only their own quotes from that visit; costs and margins are omitted. A cancelled visit, erased customer, closed job, changed assignment or withdrawn grant refuses access. Completed assessments remain eligible. The ordinary state and offline day keep no prices.
- `GET /api/glove/state` — everything this role may see: `{version, actor:{id,name,role,roleName,commands,reads}, business, customers, sites, services, technicians, enquiries, quotes, jobs, visits, captures, invoices, exports, proposals, approvals, imports, roles, times, forms, events, operators, grantable?}`. `forms` are the owner's form definitions (empty for a technician, who fills the copies on their jobs: `visit.capture {kind: "form", formId, answers: {questionId: value}}`, one per copy; readings out of range are `flagged`). `times` are clock-in shifts and travel and on-job timers `{technicianId, kind: shift|travel|job, visitId, jobId, startAt, endAt, original, corrections}` (a technician gets only their own). `stock` are van and warehouse locations with `counts` and `pars` by material id in integer thousandths of the unit, and `stockMoves` every count, restock, transfer and use (a technician gets only their own van's). `warnings` are COST-005 margin warnings `{jobId, number, kind: cost|margin, setting, estimate, actual, projectedMargin}`, for the owner and dispatchers only. `actor.commands` and `actor.reads` are the commands and read doors (`state`, `file`, `reports`, `export`) this person holds; `roles` are the owner's custom roles and `grantable` (owner only) the named permissions a custom role may hold. A technician gets only visits ever assigned to them and those jobs' customers, sites and evidence, without prices, and only the field side of their jobs' timelines (no quote, proposal or invoice entries). `events` is the newest 500 timeline entries, for Activity; `operators` is filled for the owner only. A custom role reads the desk's records; without `reports.read` it gets no expenses (or their timeline entries) and is refused the cost and report doors, and without `export.read` the export doors.
- `GET /api/glove/jobs/<id>/timeline` — `{events}`: every timeline entry of one job, oldest first, however busy the business is (404 for a job this person cannot see).
- `GET /api/glove/files/<id>` — photo or signature bytes, for people allowed to see that job.
- `GET /api/glove/exports/<id>.csv` — an invoice export (owner, office).
- `GET /api/glove/pricebook.csv` — the price book as CSV with costs, categories, markups, part numbers and task contents (owner, office); it re-imports through `pricebook.import` unchanged. A custom role with `export.read` but without `reports.read` gets the same catalogue without the Unit cost column.
- `GET /api/glove/technicians/<id>/calendar` — `{url, setAt}` or `{url: null}`: the secret calendar address, for the owner and that technician only (403 otherwise).
- `GET /api/glove/map?date=YYYY-MM-DD&branch=<id>|main` — the day's map board (desk only; 403 for field roles): `{connected, view:{center:{lat,lng}, zoom, width, height}|null, technicians:[{id, name, zones:[{id, name, points}], stops:[{visitId, number, start, end, status, siteId, address, location}], legs:[{from, to, seconds, meters}]}], unlocated:[{siteId, address, problem}]}`; drive times come from Google's Routes API with the owner's key. `GET /api/glove/map.png?…` is the base map image for that view (Static Maps, no markers); 404 until Google Maps is connected (DISP-002).
- `POST /api/glove/leads/<angi|thumbtack|yelp|reserve-google>` — a connected lead source posts a lead (Thumbtack's v4 `NegotiationCreatedV4` body, Angi's lead delivery, or Yelp's notice of new leads) with HTTPS Basic user `glove` and the source's password; `200 {ok: true}`, or one generic 401 (429 after 20 rejections a minute) that writes nothing; 404 when the source is not connected (BOOK-004).
- `GET /api/glove/customers.csv` — every live customer with its contacts and sites as CSV (owner, office); it re-imports through `import.stage {format: "csv"}` unchanged ([IMPORT.md](IMPORT.md)).
- `GET /api/glove/jobs/<id>/cost` — the job's expenses `{expenses:[{vendor, category, amount, billable, markupPercent, billed, invoiceId, receipt}], totals:{expenses, billable, nonBillable, billed}, costing:{revenue, estimate:{cost, margin, uncostedLines}, actual:{labor, materials, expenses, subcontractors, cost, margin, laborEntries, materialEntries, uncostedMaterials, unratedTime}, difference:{cost, margin}}}` (COST-004; not technicians, nor custom roles without `reports.read`).
- `GET /api/glove/reports/costing?from=YYYY-MM-DD&to=YYYY-MM-DD` — jobs completed in the period: `{total, byJobType:[{type, jobs, revenue, estimatedCost, actualCost, estimatedMargin, actualMargin}], byTechnician:[{technicianId, technician, minutes, laborCost, …}]}` (not technicians).
- `GET /api/glove/reports/<revenue|technicians|sources|quotes|margins|tax>.(json|csv)?from=YYYY-MM-DD&to=YYYY-MM-DD` with one filter (`jobType` for revenue and margins, `technicianId` for technicians, `source` for sources and quotes) — REPORT-002's reports as JSON or CSV of the same figures (roles that read reports). Technician rows also include `fieldQuotesAccepted`, `fieldQuotesAnswered` and `fieldQuoteCloseRate` (one decimal percent, null without answers), counted by the business-local response date; unanswered field drafts are excluded.
- `GET /api/glove/customers/<id>/duplicates` — the merge review (desk only): `{candidates:[{id,name,matches: phone|email|address}], records:[{customer, holds:{sites,enquiries,quotes,jobs,invoices}}]}`. `customer.save` also answers `duplicates` in its result. A move-in or customer CSV preview (`import.stage`) lists `preview.possibleDuplicates`: incoming customers that share a phone, email or address with a Glove customer (or, in a CSV, with another incoming one).
- `GET /api/glove/sites/<id>/history` — one property's history, newest first: `{site, entries:[{at, kind: request|quote|job|visit|arrival|form|note|photo|material|refrigerant|completion|invoice|equipment, id, jobId, label, status}]}` from what this role may see (a technician: only the field side of sites on their visits).
- `GET /api/glove/equipment/<id>` — one unit: `{equipment, site, warranty:{manufacturer, labor}, history, refrigerant}`. Each warranty is `{until, state: none|active|expiring|expired, daysLeft}` (expiring within 90 days, in the business timezone); `history` lists every job that named the unit or recorded a field item against it, with its visits and those items; `refrigerant` is the unit's log `{entries, byType, added, recovered}`. A technician reads only units at their visits' sites, with only their jobs.
- `GET /api/glove/jobs/<id>/callback` — `{callback, pack, diagnoses}`: whether the job is a callback, the unit history gathered for it (visits and readings with references) and the advisory checklists prepared, for whoever sees the job.
- `GET /api/glove/timesheets?week=YYYY-MM-DD` — COST-002: one workweek (starting on the owner's week-start day) per technician the reader sees: `{weekStart, weekEnd, settings, timesheets:[{technicianId, name, payrollId, subcontractor, status, onTheClock, overtimeFlag, approval, days:[{date, hours:{worked, job, travel, regular, overtime, doubleTime}}], minutes, hours}]}`; a technician reads only their own, a subcontractor is refused.
- `GET /api/glove/reports/payroll.json|payroll-gusto.csv|payroll-adp-run.csv|payroll-quickbooks.csv?from=YYYY-MM-DD&to=YYYY-MM-DD` — COST-002: approved, unchanged hours of W-2 people for 1 to 6 whole workweeks, with everyone left out and why (owner and office). The ADP RUN file needs the owner's company code first. TEAM-003: each person's `commission` (`sold`, `completed`, `agreements`, `total` and the credited `items` with date, kind, rate and amount) joins the files: Gusto's `commission` column per workweek, an ADP RUN row with the commission earnings code and Dollars, and QuickBooks `Commission` lines with an Amount by date.
- `GET /api/glove/conversation?customerId=<id>` or `?jobId=<id>` — COMM-007: one ordered conversation stream (oldest first by the moment Glove recorded each entry): logged calls and notes, requests, request follow-ups, quotes recorded as sent and the customer's recorded answer, purchase orders recorded as sent for the job, Web Push notices about the job with the push service's answer, and agent actions; each entry has `direction` (inbound, outbound, internal), `channel`, `author`, `to`, `recordedBy`, `text` and `delivery`. Desk roles and viewers; technicians and subcontractors are refused.
- `GET /api/glove/agreements?customerId=<id>` — PLAN-002: agreements (all, or one customer's) with `active` and `entitlements` (`included`, `used`, `booked`, `left`, `next` due date, every `due` date). Desk roles and viewers. `GET /api/glove/reports/agreements.json|csv?from&to` counts agreements sold, active at the period's end and churned.
- `GET /api/glove/reports/warranties` — `{asOf, expiringDays, expiring, expired}`: every manufacturer or labor warranty ending within 90 days or already ended (not technicians).
- `GET /api/glove/reports/refrigerant?from=YYYY-MM-DD&to=YYYY-MM-DD` — refrigerant added and recovered in the period (by the phone's local date): `{entries, byType, byEquipment, added, recovered}`, each entry with the technician and EPA 608 number (not technicians).
- `GET /api/glove/parts?date=YYYY-MM-DD&technicianId=<id>` — the day's parts check (STOCK-001): `{date, technicianId, van, jobs:[{jobId, number, title, start, ready, parts:[{serviceId, code, name, unit, needed, onVan, onBoard}]}]}` in visit order; a part is on board when the van holds enough for this job and the earlier ones that day. A technician always gets their own day.
- `GET /api/glove/dashboard` — the owner's Today (REPORT-001) for the business's local date: `{date, timezone, jobs:{count, states:{open, completed, invoiced}, list:[{id, number, title, customer, status, visits:[{id, start, end, technician, status}]}]}, booked:{count, total, quotes}, openQuotes:{count, total}, onClock:{count, list:[{technicianId, technician, since, timer:{kind, job}|null}]}, unbilled:{count, list:[{id, number, customer, invoiceId}]}}`. Today's jobs have a visit, not canceled, starting that date; `booked` sums the accepted revision's total of quotes accepted that date; open quotes are draft, approved or sent, at their latest revision's total; `onClock` lists technicians clocked in and not out; `unbilled` lists completed jobs whose invoice is not exported (not technicians).
- `GET /api/glove/reports/sources` — the request pipeline and conversion by source: `{sources:[{source, requests, contacted, quoted, won, lost, conversion, wonValue, invoiced}], total, pipeline:[{stage, requests:[{id, customer, description, source, since, ageDays, lostReason}]}]}`. `conversion` is won ÷ requests as a percentage to one decimal; `wonValue` sums accepted quote totals and `invoiced` the latest approved invoice revision of each won job (not technicians).
- `GET /api/glove/delays?at=<UTC time>` — AGENT-003's delay watch (desk and agents, not field roles): `{at, risks:[{visitId, version, jobId, number, technicianId, startAt, reasons, options:[{technicianId, date, start, end, customer: unchanged|"customer not yet asked", note}]}]}`. Move one with `proposal.prepare {kind: "move", visitId, plan: {technicianId, date?, start, end}, rationale, evidence?}`; `proposal.approve` applies it with conflict review.
- `GET /api/glove/export` — the whole business as JSON, with the complete timeline and file list (owner, office). Custom roles require `export.read`; records, unit costs and margin-event visibility follow their current `reports.read` permission, as in state.

- `GET /api/glove/push` — `{publicKey, devices}`: the installation's VAPID public key (null when disabled) and only the signed-in person's subscribed phones, with device name, this-session flag and last outcome; never endpoints or private keys. Uses the state-read permission; desk roles receive no devices.
- `GET /api/glove/reports/1099.json?year=YYYY` or `/api/glove/reports/1099.csv?year=YYYY` — subcontractor totals for the calendar year, dated by received completion in the business time zone. JSON is `{year, label, rows:[{technicianId, payeeName, tinLast4, visits, total, atOrOver600}]}`. Owner/Office or a custom role with `export.read`, within branch scope. Label: "Totals for your filing, not a filed 1099".
- `GET /api/glove/brief?at=<UTC time>` — the owner's morning brief (AGENT-008); `at` is an optional ISO UTC timestamp, default now. Returns `{date, timezone, at, preparedBy, sections:{atRisk, unbilled, overEstimate, leads, agreements}, notTracked, emailed}` with action links and the morning email's provider state. Other roles are refused; reading creates no action.

Reserve with Google intake accepts a relayed REST `Booking` record, not a live Google booking-server call. It returns only the Glove intake receipt and queues a person’s task; it never confirms a booking. See [lead source formats and limits](docs/lead-sources.md).

## Integration tokens (API-002)

- `token.issue {name, role: dispatcher|office|agent|viewer|custom:<id>, branchId?: <branch id>|"main"}` (owner) answers `{id, name, role, branchId, createdAt, token}`. `token` appears only in this first answer; a replay of the same `commandId` returns the rest without it.
- `token.revoke {tokenId}` (owner): the token is refused (401 `AUTH`) from its next request.
- `GET /api/glove/state` gives the owner `integrationTokens: [{id, name, role, branchId, createdAt, lastUsedAt, revokedAt}]` (empty for everyone else).
- A token call needs no Origin header. A token is refused every owner command and never sends `token.*`, `role.*`, `grant.*`, `agents.pause`, `branch.limit`, `*.connect`, `push.setup` or `technician.calendar`.

## QuickBooks company review

The signed-in Owner without branch limits runs `qbo.discover {}` to read the complete company. Its first response includes a transient `review` JSON string with matched, ambiguous and unmatched proposals, matching rules, candidate identities and customer-facing comparison fields, name clashes, and provider-only records left untouched. The response contains no access token, provider sync token or raw provider payload. Review content stays in screen memory; it is absent from saved command outcomes, Activity and business export.

The Team and settings review verifies proposed or manually selected records through `qbo.map`. An unmatched customer's explicit creation approval uses `qbo.createCustomer` with the current customer version and review fingerprint. Changes refresh the review. `qbo.confirmLinks` retains the confirming Owner on each link and refuses missing pre-existing links; provider writes remain behind their existing explicit approvals. The review creates no sales items or invoices. Linked opening balances expose their existing accounting status and later payment sync without offering a new invoice post.

## Progress and field invoices

`invoice.prepare` accepts an optional `progress: {name, final}` with explicit priced `lines` for an accepted quoted job. The first stage freezes the accepted gross contract amount. Each distinct stage needs its own existing human approval; a final stage needs completed work and exactly the remaining contract amount. Drafts and corrections cannot exceed the cap. These are invoice proposals, never automatic charges or inferred allocations.

`invoice.fieldConfigure {technicianId, version, enabled}` is restricted to the signed-in Owner without branch limits. Its separate, attributable, off-by-default permission binds one active technician sign-in. `invoice.fieldPrepare {visitId, deviceTime}` is technician-only and checks that permission, current visit assignment and completed job. It creates only a draft and returns its identity without prices. The ordered phone outbox reuses its command identity on reconnect; execution and replay recheck live authority. It sends no customer message.

A permitted technician's state includes only approved customer-facing invoice revisions for current assigned jobs, with no draft prices, costs, credentials or payment balances. This bounded presentation joins the existing kept offline day and shows its kept time and approval basis. Reconnect requires a fresh read before presenting a kept invoice. The new field permission and offline invoice custody are adopted defaults pending CT approval; the PAY-002 customer-side ruling continues to hold external payment links and customer collection.

## Native call preparation

The signed-in Owner without branch limits uses `voice.configure` with the current business `version`, `enabled`, explicit `approved:true`, ordered `phones` and optional `forward`. The existing Twilio connection supplies the business number and private callback key. Connecting SMS never enables voice. Recording requests are refused.

Configure the Twilio number's incoming voice URL as `/api/glove/voice/inbound` using POST. Glove returns TwiML dialing each destination in order; each leg's signed action goes to `/api/glove/voice/dial`. Only one unambiguous current customer is accepted in this preparatory slice. Call records appear in the Owner's state, customer Conversation, Activity and business export. Other roles, limited Owners and integration tokens receive no native call metadata or routing configuration. No recording, unknown-caller intake, caller-disconnect callback or live number activation is supplied.

An Owner explicitly invokes `voice.textBack {callId, version, offerId, token}` for an unreplied missed call. The token must be the original credential of that Owner's current booking offer for the same customer; it is not retained in the result or timeline. Enable the registered text channel separately and record `sms.consent` with `purpose:"missedCalls"`, the customer's current number, source, wording and customer time zone. Existing visit or quote consent supplies no missed-call permission. Quiet hours, STOP, changed-number refusal, one durable attempt, no automatic retry and signed delivery outcomes apply. A webhook never creates a booking offer or sends a text. Browser controls and automatic execution remain COMM-009 gaps.

## Commands

`POST /api/glove/commands` with `{"commandId": "<new uuid>", "type": "...", "payload": {...}}` from the installation's own origin. Answers `{ok:true, result, version}` or `{ok:false, error:{code, message, details}}` (400 input, 401 session, 403 role or origin, 404 missing, 409 conflict). Send the same `commandId` and payload again to recover a lost answer; a different payload or person with that id is refused (`IDEMPOTENCY`). Command outcomes, their saved replays and error records exclude unit costs and loaded cost rates without `reports.read`. Purchase-order writes (`po.save`, `po.send`, `po.receive`) and desk expense writes (`expense.record`, `expense.price`) return only `{id, version}` to a custom role without `reports.read`; full results, saved replays and stale-version error records follow the current report permission. Money and quantities are decimal strings (`"189.00"`, `"0.5"`). Records carry `version`; send the version you saw where a payload names one, or get `STALE` with the current record.

| Type | Payload | Who |
| --- | --- | --- |
| `business.save` | `{name, abn? (the EIN), legalName?, dba?, licenses?: [{trade, state, number}], insurance?: {carrier, policy, expires} \| null, logo?: {mediaType, base64} \| null, timezone, email?, phone?, address?, paymentTermsDays?, eligibility?: {skills, availability, area: refuse\|warn}, version?}` (`eligibility` defaults to refuse, refuse, warn and is kept when left out; `marginWatch?: {costPercent?, marginFloor?}` sets COST-005's margin warnings, blank for off, kept when left out) | owner |
| `role.save` | `{id?, version?, name, permissions: [...]}`: a custom role built from named permissions (`grantable` in state: desk commands other than the owner's, move-in and field capture, plus `reports.read` and `export.read`). A change applies to the holders' very next request | owner |
| `role.set` | `{operatorId, role: dispatcher\|technician\|office\|agent\|viewer\|owner\|custom:<role id>}` | owner |
| `grant.create` | `{agentId, action: visit.book\|visit.change, serviceIds?: [ids], maxSubtotal?, dailyLimit?: 1-500 (default 20), quietHours?: {start, end}}`: lets a person holding the Agent role send that command itself, for jobs whose lines are all those services and whose subtotal before tax is within the limit, into open slots only (any conflict waits for a person), a move only within the visit's day for the same technician, at most `dailyLimit` times a business day, never in quiet hours. One active grant per agent and action | owner |
| `grant.revoke` | `{grantId, version}` (applies to the agent's next command) | owner |
| `agents.pause` | `{paused: true\|false}`: while paused every agent command is refused `PAUSED` | owner |
| `service.save` | `{id?, version?, code, name, kind?: service\|material\|task\|discount (QUOTE-007: a fixed negative price), category?, unit?, unitCost?, pricing?: fixed\|markup, unitPrice (fixed), tax: GST\|FREE, description?, parts?: [{supplier, partNumber}], components?: [{serviceId, quantity}] (task), image?: {mediaType, base64}, checklist?: [{label, required}], requiredSkills?: [names]}`: a task's cost is its contents' costs; a markup price is cost × (100 + the category's markup) / 100, rounded half up | owner |
| `pricebook.category` | `{name, markupPercent}`: sets a category's markup and reprices its markup items | owner |
| `pricebook.adjust` | `{category, percent}`: multiplies every fixed price in the category by (100 + percent) / 100, rounded half up to the cent | owner |
| `pricebook.import` | `{file: {name, text}, mapping?, fingerprint?}`: without `fingerprint`, the preview (`rows: {total, new, updated, unchanged, rejected}`, `changes`, `rejected`, `categories`, `fingerprint`); with the preview's fingerprint, commits exactly it (`IMPORT_STALE` otherwise). Rows match by Code | owner |
| `technician.save` | `{id?, version?, name, operatorId?, phone?, epa608?, active?, skills?: [names], hours?: [{day: sun..sat, start, end}], timeOff?: [{from, to, reason?}], zips?: [5-digit]}` (skills, hours, time off and ZIP codes left out keep their current values; no hours means any time, no ZIP codes means everywhere) (`epa608`: the EPA Section 608 certification number refrigerant records carry) `costRate?` is the loaded cost per hour (COST-004), read only by roles that read reports. | owner |
| `lead.connect` | `{provider: google\|reserve-google\|angi\|thumbtack\|yelp, respondWithinMinutes?: 5–1440 (60), acknowledgment?: text with {business}, apiKey (Yelp), customerId, developerToken, clientId, clientSecret, refreshToken (Google)}` or `{provider, disconnect: true}`: connects a lead source; Reserve with Google intake, Angi, Thumbtack and Yelp answer `callback: {url, user: "glove"}` and the door `password`, shown only in this response (BOOK-004) | owner |
| `lead.pull` | `{provider: "google"}`: reads Google Local Services leads from the last week now, landing the new ones `{landed: [request ids]}` (the scheduled run also does every 15 minutes) | owner, dispatcher, office |
| `enquiry.cost` | `{enquiryId, version, amount}`: sets or corrects a request's lead cost (`leadCost: {amount, by: provider\|rule\|person}`) | owner, office |
| `enquiry.reply` | `{enquiryId, version, confirm: true}`: explicitly approves one Yelp acknowledgment to the lead's unexpired masked email address through connected customer email; retries never resend. `acknowledgment.messageId` reads the existing `messageStates`; mail acceptance is not confirmed receipt in Yelp. Conservative authority default awaits ct confirmation (BOOK-004). | unscoped owner, person only |
| `enquiry.acknowledged` | `{enquiryId, version, how?}`: records a person’s attestation that the queued acknowledgment was sent outside Glove; no provider-confirmed delivery or response-window proof | owner, dispatcher, office |
| `technician.zones` | `{technicianId, version, zones: [{id?, name, points: [{lat, lng}] (3–100)}] (at most 20)}`: replaces the technician's drawn service-area zones; their service area is their ZIP codes and zones together, and booking applies the area rule to a site outside both (DISP-002) | owner |
| `maps.connect` | `{key \| null}`: saves or removes the owner's Google Maps Platform key (an installation secret); saved sites are then placed on the map, and automatic assignment adds each technician's drive from their previous visit (DISP-002) | owner |
| `site.locate` | `{siteIds: [1–50 ids]}`: places each site on the map from its address (`location: {lat, lng, placeId, formatted, at}` or `locateError`) | owner, dispatcher, office |
| `technician.calendar` | `{technicianId, url: https iCal address \| null}`: connects or disconnects the technician's calendar; the address is stored as a secret (never in state, timeline, results or exports) | owner, or that technician |
| `technician.calendarRead` | `{technicianId}`: reads the calendar and stores busy spans for the next 90 days (`calendar: {connected, readAt, busy: [{start, end}], unexpanded}`); booking applies the availability rule to them | owner, dispatcher, or that technician |
| `customer.save` | `{id?, version?, name, kind?: residential\|business, abn?, contact?, email?, phone?, billingAddress?, billingContact?, apEmail?, requirePo?, contacts?: [{name, role?, phone?, email?}]}`. A business customer's billing contact and accounts-payable email stay apart from each site's contact; the invoice CSV goes to `apEmail` when set. `contacts` left out keeps the current list | owner, dispatcher, office |
| `customer.merge` | `{survivorId, mergedIds: [ids], versions: {customerId: version}, values?: {field: customerId}}`: moves the merged customers' sites, requests, quotes, jobs and invoices to the survivor, takes each named field from the named customer and keeps the merged customers (with `mergedInto`) and their contact people as contacts; one `merges` record keeps what moved | owner, dispatcher, office |
| `customer.unmerge` | `{mergeId, version}`: puts everything back; refused `CHANGED_SINCE` while a record it touched has changed since | owner, dispatcher, office |
| `site.save` | `{id?, version?, customerId, address, zip?, accessNotes?, contact?, contactPhone?, contactEmail?}` (`zip` defaults to the last ZIP code in the address) (the site contact) | owner, dispatcher, office |
| `equipment.save` | `{id?, version?, siteId \| visitId, type, make?, model?, serial?, installedOn?, refrigerant?, location?, manufacturerWarrantyUntil?, laborWarrantyUntil?, photo?:{mediaType, base64}}` (dates YYYY-MM-DD; a photo is added to the unit's photos). A technician sends `visitId` of a visit assigned to them and the unit lands at (or must already be at) that visit's site | owner, dispatcher, office, the assigned technician |
| `model.connect` | `{url, model, key}` (an OpenAI-compatible https address) or `{key: null}` to disconnect; the key is kept as a secret | owner |
| `manual.save` | `{id?, version?, make, model, title, url}`: the manual library a confirmed nameplate draws from | owner, dispatcher, office |
| `nameplate.read` | `{visitId, equipmentId?, photo:{mediaType, base64}}`: the model's proposed make, model, serial and manufacture date, saved nowhere until confirmed | technician (on their visit) |
| `nameplate.confirm` | `{readingId, version, make, model, serial, manufactured, type? (new unit), location?}`: writes the unit, attaching a library manual | the technician who read it |
| `nameplate.discard` | `{readingId, version}` | the technician who read it |
| `callback.prepare` | `{jobId}` on a callback job: an advisory checklist and parts plan citing the recorded readings | agent, owner, dispatcher |
| `enquiry.create` | `{customerId, siteId?, description, source?: website\|google\|phone\|text\|angi\|thumbtack\|yelp\|referral\|repeat customer\|marketing campaign\|email\|in person}` (default phone) → stage `new` | desk, agent |
| `enquiry.contact` / `enquiry.close` | `{enquiryId, version, note?}` → stage `contacted` / `{enquiryId, version, reason}` → stage `lost` with the reason; drafting a quote moves a request to `quoted` and the customer's acceptance to `won` | desk |
| `conversation.log` | `{customerId, jobId?, kind, direction?, outcome?, minutes?, text}`: kind `call` or `note`; a call needs direction (`inbound`, `outbound`) and outcome (`answered`, `voicemail`, `no answer`), with optional whole minutes and text; a note needs text → logged on the customer and, when given, one of their jobs (COMM-007) | desk |
| `plan.save` | `{id?, version?, name, price, termMonths, includedVisits, visitServiceId, repairDiscountPercent?, priorityBooking?, formIds?, archived?}` → a maintenance plan (PLAN-002) | owner |
| `agreement.prepare` | `{agreementId}` → retained internal maintenance check of completed visits against each job's frozen form copies and attributable accepted captures. Reuses unchanged preparation; later evidence needs a fresh inspection. Current role, branch and Agent pause apply to new requests and replay. No sending, booking or term change. Results, Activity and business export follow customer erasure. | Agent, Owner, Dispatcher |
| `agreement.sell` / `agreement.end` | `{planId, customerId, siteId, via, quoteId?, startDate?, soldByTechnicianId?}`: via `phone`, `in person` or `quote` (an accepted quote of that customer) → an agreement with a copy of the plan, credited to the named technician for TEAM-003 spiffs / `{agreementId, version, reason}` → ended. A service call (`job.create` without `quoteId`) with `agreementId` books one of its included visits at $0.00 | desk |
| `fieldQuote.configure` | `{technicianId, version, enabled, minPercent, maxPercent}`: enables or withdraws field pricing for the technician's currently linked sign-in. Bounds are whole percentages from 0 to 1000 inclusive, lower no greater than upper. Configuration and actor are audited. | signed-in unscoped owner only |
| `fieldQuote.apply` | `{quoteId, version, jobVersion}`: explicitly append the current desk-approved, accepted and QUOTE-002-signed field change order to its open source job once. Requires matching customer, site and frozen tax; refuses assessment jobs, existing invoices, recurring billing, discounts, deposits and combined tax rounding differences. Preserves the signed-copy hash and audited actor and time; invoice preparation carries the lines but does not approve them. Replays return the receipt. Owner-only application was approved by ct on 24 October 2026 at 16:35Z; scoped owners, non-owners, unsigned and desk-unapproved changes refuse, and signing alone never amends a job. Offline signing and broader application remain unbuilt. | signed-in unscoped owner only; no integration token |
| `fieldQuote.draft` | `{visitId, title, notes?, changeOrder?, options:[{name?, lines:[{serviceId, quantity, unitPrice?}]}]}`: 1 to 5 options with 1 to 100 active price-book lines each; absent prices use today's catalogue. Tax and descriptions come from the catalogue; new discounts are refused. An explicit `changeOrder: true` binds additions to the source job and is refused for assessments; otherwise this remains a new quote. Records a normal quote draft with source visit and technician, the bound snapshot and an `outsideRange` flag. A completed assessment carries its notes, photos and form results. Every draft requires ordinary desk approval; no signing, send or job amendment occurs. The receipt holds only id, version, number, draft status, range flag and `deskApprovalRequired`; replay never returns prices. | owner-enabled technician on their current visit; no token or agent |
| `quote.draft` | `{enquiryId? \| customerId, siteId, title, lines:[{description, quantity, unitPrice, tax?, serviceId?}] \| options:[{name?, lines, discount?}] (1–5), addOns?:[{name, lines}] (≤10), discount?, notes?, terms?}`, or `{…, templateId}` to start from a template at today's prices (QUOTE-001). QUOTE-007: a line with a negative `unitPrice` is a discount line; `discount` is `{kind: percent\|amount, value, reason}` and the totals carry its `discount` allocation (`amount`, `nonTaxable`, `taxable`, `lines:[{line, amount}]`) | owner, dispatcher, agent |
| `quote.revise` | `{quoteId, version, lines \| options, addOns?, title?, notes?, terms?}` → new revision, needs approval | owner, dispatcher, agent |
| `quote.approve` | `{quoteId, version, revision}` (the current revision; never by the agent that prepared it) | owner, dispatcher |
| `quote.markSent` | `{quoteId, version, channel: email\|printed\|in person\|phone, note?}` — a record, not delivery | owner, dispatcher, office |
| `quote.accept` / `quote.decline` | `{quoteId, version, revision, method: signed\|email reply\|phone\|in person, customerName, note?, choice?: {optionId, addOnIds}, soldByTechnicianId?}`; acceptance needs `choice` when the revision has several options or any add-ons, and records the chosen `lines` and `totals` the job carries (QUOTE-001), and the technician credited with its sold revenue (TEAM-003) | owner, dispatcher |
| `job.create` | `{quoteId, checklist?, equipmentIds?}` (units at the quote's site the job is for), or a service call without a quote (BOOK-005): `{enquiryId? \| customerId, siteId, title, lines?}` | owner, dispatcher; office for a service call only |
| `visit.book` | `{jobId, technicianId (or "auto": the conflict-free technician with the fewest booked minutes that day, DISP-006), date: YYYY-MM-DD, start: HH:MM, end: HH:MM, window?: {start: HH:MM, end: HH:MM}, reason?, acknowledge?: [codes]}` (DISP-006: the arrival window holds the planned start, both ends included, else `WINDOW`) | owner, dispatcher; Office for included agreement visits (PLAN-004); agent under a grant |
| `visit.change` | `{visitId, version, technicianId?, date?, start?, end?, window?: {start, end}|null, reason, acknowledge?}` (the arrival window is kept unless named; null removes it) | owner, dispatcher |
| `assessment.book` | `{enquiryId, technicianId, date, start, end, window?, instructions?, formIds?, title?, acknowledge?}`: an assessment visit on a request (BOOK-006), booked with conflict review; its job has `kind: assessment` and becomes `assessed` when its visit completes; a quote drafted from the request carries `assessment` (notes, photos, forms) | owner, dispatcher |
| `series.create` | `{jobId, version, date, rule: {unit: week\|month, interval?, months?: [1-12], day?, nth?: 1-4\|-1, weekday?}, start, end, technicianId, until?, horizonDays?: 7-730, acknowledge?}`: makes an open job repeat (PLAN-001) and books its visits through the earlier of `until` and today + `horizonDays` (365); refused `SERIES_EXISTS` when it already repeats | owner, dispatcher |
| `series.change` | `{jobId, version, from, reason, rule?, start?, end?, technicianId?, until?, horizonDays?, acknowledge?}`: a new rule revision from `from`; booked, untouched visits from that date are replaced, the rest stay. Skipping or moving one visit is `visit.cancel` / `visit.change` | owner, dispatcher |
| `visit.cancel` / `visit.reviewLateEvidence` | `{visitId, version, reason}` / `{visitId, version, note?}` | owner, dispatcher |
| `proposal.prepare` | `{kind: "dispatch", plan:{jobId, technicianId, date, start, end}, rationale, evidence?: [text]}` | agent, owner, dispatcher |
| `proposal.approve` / `proposal.decline` | `{proposalId, version, acknowledge?}` / `{proposalId, version, reason}`; never by the preparer | owner, dispatcher |
| `visit.arrive` | `{visitId, deviceTime}` | the assigned technician |
| `visit.capture` | `{visitId, deviceTime, kind: checklist\|note\|photo\|material\|refrigerant\|form\|line, …}` (line, on a service call only: `{serviceId, quantity, approval:{customerName, method: signed\|verbal}}`): checklist `{itemId, result: done\|not applicable, note}` (note required for not applicable); note `{text}`; photo `{photo:{mediaType: image/jpeg\|png\|webp, base64}, caption?}` (≤1.5 MB); material `{serviceId? , description?, quantity, unit?}`; refrigerant `{equipmentId, refrigerant?, added?, recovered?, certification?}` (pounds; type defaults to the unit's refrigerant, certification to the technician's `epa608`). Any kind takes `equipmentId` for a unit at the job's site | the assigned technician |
| `form.save` | `{id?, version?, name, questions:[{id?, label, type: yesno\|choice\|number\|reading\|photo\|signature\|notes, required?, options? (choice), unit? (number, reading), min?, max? (reading), showIf?: {questionId, equals}}], serviceIds?, equipmentTypes?, archived?}` (FIELD-002); a new job copies each form that applies into `job.forms` | owner |
| `stock.location` | `{id?, version?, kind: van\|warehouse, name, technicianId (van), pars?: [{serviceId, par}], archived?}` (STOCK-001; one van per technician) | owner, office |
| `stock.count` | `{locationId, serviceId, quantity, reason?}`: a stocktake count of a price-book material | owner, office |
| `stock.restock` | `{locationId, serviceId, quantity, note?}` | owner, office |
| `stock.transfer` | `{fromId, toId, serviceId, quantity}`, refused (`STOCK`) beyond what the source holds | owner, office |
| `po.save` | `{id?, version?, supplier, supplierEmail?, locationId, jobId?, lines: [{serviceId, quantity, unitCost?}], note?}`: a purchase order of price-book materials (STOCK-002), `unitCost` defaulting to the price book's; refused (`PO_STATE`) once sent | owner, office |
| `po.send` | `{poId, version, method: email\|portal\|phone\|in person, reference?}`: records how the person sent it; Glove sends nothing itself | owner, office |
| `po.receive` | `{poId, version, lines: [{lineId, quantity}], note?}`: one part into the order's location; refused (`PO_STATE`) before it is sent or once received, (`OVER`) beyond what is still due | owner, office |
| `rule.save` | `{id?, version?, name, trigger: enquiry.created\|quote.approved\|job.created\|job.completed, condition?: {source?, tag?, over?}, action: {kind: notify, to: owner\|dispatcher\|office\|person:<operator id>, message} \| {kind: leadCost, amount} (enquiry.created only: applies the amount to a request with no cost yet, BOOK-004) | {kind: book, technicianId, afterDays, start, end} (job.created only) \| {kind: assign, personId} (job.completed only: the owner or an office person prepares its invoice), enabled?}`: a workflow rule (API-005); each run acts as its creator's current role and is logged in `ruleRuns`; a rule's creator or the owner changes it | owner, office |
| `field.save` | `{id?, version?, record: customers\|sites\|jobs\|equipment, label, type: text\|number\|date\|yes/no\|choice, choices?, archived?}`: a custom field (CUST-004) | owner |
| `record.custom` | `{record, id, version, values: {fieldId: value\|null}}` | owner, dispatcher, office |
| `customer.tags` | `{customerId, version, tags: [≤20]}` | owner, dispatcher, office |
| `segment.save` | `{id?, version?, name, filter: {tagsAll?, tagsNone?, fields?: [{fieldId, op: is\|over\|under\|set\|unset, value?}], equipmentOlderThanYears?, noAgreement?}}`; members at `GET /api/glove/segments/<id>` (desk) and `.csv` (owner, office) | owner, dispatcher, office |
| `marketing.connect` | `{provider: mango, url, key}` or `{provider: mailchimp, key, listId}`, or `{provider, key: null}` to disconnect; the key is kept as a secret | owner |
| `segment.push` | `{segmentId, provider}`: each member with an email to the provider, never subscribed; recorded in `pushes` | owner, office |
| `template.save` | `{id?, version?, name, options:[{name?, lines:[{serviceId?, description?, quantity?, unitPrice?, tax?}]}], addOns?, notes?, terms?}` (QUOTE-001): a price-book line without `unitPrice` follows the price book | owner |
| `clock.in`, `clock.out` | `{deviceTime}`: the technician's shift; clocking out stops a running timer (COST-001) | the technician |
| `timer.start` | `{visitId, kind: travel\|job, deviceTime}`: one timer at a time, while clocked in, on a visit currently theirs; starting one stops the running one | the assigned technician |
| `timer.stop` | `{visitId, deviceTime}` (completing the visit also stops its timer) | the assigned technician |
| `payroll.settings` | `{weekStart?, dailyOvertime?: {afterHours, doubleAfterHours} \| null, adp?: {companyCode, payFrequency: W\|B\|S\|M, regular?, overtime?, doubleTime?, commission?} \| null, commissions?: {from?, soldPercent?, completedPercent?, agreementSpiff?}}`: COST-002 workweek (fixed once a week is approved), state daily-overtime rule and ADP RUN codes; TEAM-003 commission rules from a date (today unless given) | owner |
| `timesheet.approve` | `{technicianId, weekStart}`: approve a technician's workweek once no shift in it is open; approving a week changed since approval approves it again | owner |
| `time.correct` | `{id, version, start:{date, time}, end:{date, time}, reason}`: a stopped entry's times in the business timezone; the entry keeps `original` and every correction | owner, dispatcher, office |
| `visit.complete` | `{visitId, deviceTime, summary, jobComplete?: true, signoff: {customerName, signature:{mediaType, base64}} \| {absentReason}}` | the assigned technician |
| `expense.record` | `{jobId \| visitId, category: supply-house purchase\|permit\|equipment rental\|subcontractor bill\|other, vendor, description?, amount, billable?, markupPercent?, receipt?:{mediaType, base64}}`. A technician sends `visitId` of a visit assigned to them and no markup | owner, office, the assigned technician |
| `expense.price` | `{expenseId, version, billable, markupPercent?}` (blank or 0 bills at cost; refused once the expense is on an invoice) | owner, office |
| `invoice.prepare` | `{jobId, lines?, discount?}` (default: the job's accepted discount and accepted lines, priced materials and each billable expense not yet invoiced at cost plus markup) | owner, office, agent |
| `invoice.prepareBatch` | `{jobIds}`: 1–50 distinct completed job IDs; `{results}` keeps input order with each `{jobId, ok, invoice}` or `{jobId, ok: false, error}`; same pricing and draft approval boundary as `invoice.prepare`, per-job refusals leave no partial writes | same `invoice.prepare` permission (owner, office, agent or custom role); branch checked per job |
| `invoice.revise` / `invoice.correct` | `{invoiceId, version, reason, lines, discount?}` (the last revision's discount unless set; `null` removes it) (revise before export, correct after; a revised correction still corrects the exported revision and exports as `INV-0001-R<n>`) | owner, office (agent may revise) |
| `invoice.approve` | `{invoiceId, version, revision, poNumber?}` (never by the agent that prepared it). A customer with `requirePo` is refused `PO_REQUIRED` without a purchase-order number; the number goes into the CSV Reference | owner, office |
| `invoice.export` | `{}` — every approved revision, once | owner, office |
| `import.stage` / `import.commit` / `import.undo` | see [IMPORT.md](IMPORT.md) | owner |
| `crew.save` | `{id?, version?, name, memberIds}`: creates or updates a named crew of 2–10 distinct active technicians/subcontractors in one branch. Names are unique without regard to case; an update changes later bookings only. Returns the crew record. | owner |
| `visit.agree` | `{visitId, version, amount: decimal string \| null}`: sets or clears a subcontractor visit's agreed amount for 1099 totals; refuses a canceled visit or a technician who is not a subcontractor. Returns the updated visit; no payment or filing occurs. | owner |
| `push.setup` | `{}` generates a new VAPID key pair and removes existing subscriptions (phones subscribe again); `{off: true}` also deletes the private key and disables notifications. Returns updated business settings with the public key only. | owner |
| `push.subscribe` | `{endpoint, keys:{p256dh, auth}, device?}`: after owner setup, subscribes this signed-in technician's phone/session using the browser PushSubscription's HTTPS endpoint and base64url keys; device defaults to Phone. Returns `{id, device}`; a repeated endpoint replaces its subscription. | technician |
| `push.unsubscribe` | `{id}` or `{endpoint}`: removes only this person's matching phone subscription, including an already absent one; returns `{removed: true}`. | technician |
| `quote.suggest` | `{enquiryId}`: asks the connected model for Good/Better/Best on a new/contacted request with a site and an active price book. Sends only the evidence permitted by AGENT-005 (no customer identity, addresses, costs or photos), with store off. Requires exactly a title and three reason/line options with active price-book codes and positive decimal quantities; any invalid answer is refused whole without repair or retry. Returns a labelled draft quote with reasons at price-book prices; a person must approve each price before any send. Office and field roles are refused. | owner, dispatcher, agent; custom role with this permission |

## Conflicts a dispatcher reviews

`visit.book`, `visit.change`, `series.create`, `series.change` and `proposal.approve` answer `CONFLICT_REVIEW` with `details.conflicts: [{code, message}]` when the booking overlaps another visit for that technician (`overlap:<visitId>`) or the technician has already recorded evidence on the visit (`evidence`), and for each eligibility rule the owner set to warn: a skill the job's services require that the technician lacks (`skill:<names>`), time off (`off:<date>`) or working hours (`hours:<date>`), and a site ZIP outside the technician's service area (`area:<zip>`). A rule set to refuse answers `ELIGIBILITY` with `details.refused` instead. Send the same command again with `acknowledge` listing those exact codes to confirm; the reviewed conflicts are kept on the visit's assignment record.

## For an agent

Read `GET /api/glove/state`, then prepare: `enquiry.create`, `quote.draft`, `quote.revise`, `proposal.prepare` (dispatch) and `invoice.prepare` / `invoice.revise`. Everything you prepare is marked with your name and role and waits for a person; `approvals` in state shows each decision. You cannot approve, record a customer's answer, book, export, move in or change roles, except `visit.book` and `visit.change` under the owner's grant (`grants` in state): the visit's assignment records the `grantId`, and the grant's `uses` list each use. A command outside the grant is refused `GRANT_SCOPE`, over its daily budget `BUDGET`, in its quiet hours `QUIET_HOURS`, and anything while the owner has paused agents `PAUSED`.

### TEAM-002 branch settings

The owner sends `branch.save {id?, version?, name, timezone, prefix, zips}`. Prefixes are unique letters/digits starting with a letter, fixed after their first numbered record. `site.save` accepts `branchId` for new sites (the site keeps it); `technician.save` accepts `branchId`, kept on edit when omitted, and refuses a branch change while the technician has open visits. Omit/null uses the original main business branch. Quotes/jobs/invoices inherit the site branch and its counters. Visit booking/moves use the technician branch zone, require the job branch to match, and store `local.timezone`. Existing visits keep their instants and zone. Branch service ZIP codes follow the existing area warning/refusal rule. Branch-limited people read and write only their branch-rooted operational records under their current role, including files, exports, command replays and workflow actions; shared reference records retain role-based reads. Every report accepts the branch filter described below. Per-branch US tax settings follow MONEY-001. A customer’s first site assigns their branch, all their sites stay in it, and crews never mix branches. The revenue JSON/CSV report takes `branchId=<id>|main` and includes `byBranch` rows; dates are local to each invoice’s branch.

### DISP-007 crews and subcontractors

`technician.save` also accepts `subcontractor: {payeeName, tinLast4}` or null to clear it; omission keeps the existing value. The TIN must be exactly four digits; Glove never accepts a full TIN. A subcontractor is linked to a person with the Subcontractor role and sees only currently assigned visits, without prices, time clocks or other people's captures.

`visit.book` accepts `crewId` instead of `technicianId`, creating one visit per crew member with a shared crew-booking id. Repeat `visit.book` with each date for a multi-day job. The result is `{id, crewId, visits}`, where `id` is the group id and each visit keeps `crew: {crewId, name, groupId}`. Each member is checked for branch, skill, availability and conflicts. Changing one member visit moves the group's open visits, with each member's conflict checks; a crew move cannot change its technician. Canceling a member visit cancels its group only while every member's status is booked (the capture-before-arrival gap remains recorded under DISP-007). Crew membership edits affect future bookings only. `visit.agree` records the owner's amount separately on each subcontractor visit; only completed visits count in the 1099 totals read door above.

### API-004 CompanyCam photos

Owner: `companycam.connect {key}` (or `{key:null}` to disconnect). Owner/dispatcher: `companycam.link {jobId,version,projectId}`, `companycam.pull {jobId,version}`, `companycam.send {jobId,version,captureId}`. Owner: `companycam.reconcile {jobId,version,captureId,photoId}`. The role matrix and job visibility apply through every door; custom desk permissions follow TEAM-001. GET `/api/glove/jobs/<id>/companycam` gives the allowed desk person's upload outcomes and provider references. State's `companycamConfigured` reflects the live secret, including after restore.

Linking checks the provider's recorded address against the site, ignoring case, whitespace and punctuation. Pull reads every cursor page, keeps immutable originals and provider capture times, and returns `{imported,errors,at}`; each error names its photo. Glove's existing image types and 1.5 MB limit apply. Captions are plain text labelled CompanyCam, never technician sign-off. Send posts one selected original's bytes, then its caption, recording each outcome. The durable reservation prevents repeated posts, even after a lost response or optimistic commit race; an unknown outcome is never retried. Reconcile checks an existing same-project photo's original-byte SHA-256 and preserves the honest caption outcome. No customer/contact/financial fields are sent. GET business export and the installation archive retain upload references/reservations; the token is excluded. Restore requires reconnecting it.

Protocol: [CompanyCam Public API v1](https://developers.companycam.com/openapi/public_api_v1.yaml), [official API index](https://developers.companycam.com/llms.txt). Base `https://api.companycam.com/public_api/v1`, Bearer token, `{data,errors,meta}` envelopes, cursor pagination, direct multipart `photo[photo_data]`, then the photo-description endpoint. No undocumented provider idempotency is assumed.

### DATA-002 Activity and provider facts

GET `/api/glove/activity?before=<event-sequence>` reads older events, newest first, with `{events,next}`; omit `before` for the latest page. Every page rechecks the live role and job visibility. State, timeline and Activity rows carry `recordChanges` metadata (record ids, versions and changed field names only) filtered to that reader’s underlying record visibility; owner reads all. Activity can load earlier pages and inspect changed records. A changed reader or installation change version discards loaded history.

A committed Glove command must have its own explicit timeline event. Rule events name the actual rule creator. Provider response facts for the current model, audience, CompanyCam and Web Push doors are append-only and keep their provider and actual outcome even if the final command cannot commit. No key, push endpoint or request body is put into provider events. Web Push facts keep subscription/technician/job ids and generic HTTP status (0 = unconfirmed), including removed subscriptions. The full business export keeps every event. New communication, payment and accounting doors inherit this trail under DATA-002 before shipping.

TEAM-002: every report accepts `branchId` (including `main`) in JSON and CSV. Branch-limited people read and write only their branch-rooted operational records through all doors; shared reference records retain their role-based read permissions. Limits apply to files, exports, Activity, command replay and workflow actions as well as state.

## USD sales tax (MONEY-001)

`GET /api/glove/brief[?at=<UTC time>]` (AGENT-008, owner only) returns the read-only morning brief for the business's local date: `sections.atRisk`, `unbilled`, `overEstimate` and `leads`, each item `{kind, id, text, action:{label, href}}`, plus `notTracked` for sections whose records do not exist yet. `business.save {discountLimits?: {<role or custom:id>: percent}}` (QUOTE-007) sets each role's maximum discount as a percent of a document's gross subtotal (discount lines plus the document discount); the owner is unlimited and an unlisted role gives none (`DISCOUNT_LIMIT`). `business.save` defaults a new business to USD (`currency: "AUD"` starts an Australian installation); later saves keep its saved currency. `taxSettings` on the business and each `branch.save` contains `jurisdictions: [{id,name,rate,zips,taxLabor}]` and optional `defaultJurisdictionId`. Rate is exact decimal percent text (four decimal places). The service address ZIP selects a jurisdiction unless `site.save.taxJurisdictionId` chooses one explicitly. Item tax is `TAXABLE` or `FREE`; existing `GST` codes retain their taxable meaning, and saved AUD business settings retain 10% GST.

`customer.save.taxExemption` is `{certificateNumber,expires}` or null. `customer.certificate {customerId,version,file:{mediaType,base64}}` (owner/dispatcher/office, subject to branch scope) adds a private original PDF/JPEG/PNG up to 10 MB; the expiry and actual certificate are both required for exemption. `GET /api/glove/files/<id>` downloads it only for that customer's full desk readers. Certificate metadata and bytes archive with the customer; replacement retains originals and physical customer deletion removes them. DATA-001 inherits public erasure/restore-fence proof.

USD revision totals keep currency, exact jurisdiction/branch breakdown and frozen `taxContext`; settings edited afterward never silently change an accepted choice or invoice. The USD CSV records jurisdiction, rate, taxable amount and document tax once per invoice. AUD exports retain their existing Xero shape. `GET /api/glove/invoices/<id>/quickbooks.json?customerRef=...&itemRef=...&taxCodeRef=...` requires export authority and explicit existing QuickBooks IDs. It returns an inspection payload from the latest approved USD revision; it never sends or syncs. LEDGER-001/004 carry actual provider assertions and first-connection linkage.

`tax.connect {key}` or `{key:null}` is owner-only and stores/deletes the optional Stripe Tax credential as a secret. `tax.lookup {siteId,address:{line1,city,state,postal_code},serviceTaxCode}` is owner-only, with US country fixed. Service classification is one of `txcd_20080007`, `txcd_20020010`, `txcd_20020018`, `txcd_20030000`. The real Stripe Tax calculations API receives only this address and two fixed $100 sample lines. A compatible standard-rate/service-exempt result returns a proposal for explicit owner application. Unregistered/unsupported/partial outcomes return no automatic proposal and keep honest provider reasons. No certificates or customer identity are sent. With `provider:"avatax"`, `tax.connect {provider:"avatax",key:{accountId,licenseKey,companyCode,environment:"production"|"sandbox"}}` (or `key:null`) seals the AvaTax credentials, and `tax.lookup {provider:"avatax",siteId,address,serviceTaxCode}` takes the owner's AvaTax tax code (2-25 capital letters or digits) and creates one uncommitted AvaTax SalesOrder with the address and two $100 sample lines (`P0000000` and that code); the answer has the same `parts`/`labor`/`proposal`/`label` shape, and only a fully taxable positive parts rate with the service taxed at that rate or wholly non-taxable becomes a proposal.

## Receivables aging (REPORT-003)

`GET /api/glove/reports/receivables.(json|csv)?asOf=YYYY-MM-DD&branchId=<id>|main` reads the aging report with the existing reports permission and live branch scope. `asOf` defaults to the business-local today. JSON returns `{asOf,basis,customers:[{customerId,customer,currency,buckets,total,invoices}],totals:[{currency,buckets,total}]}`. Buckets are `current`, `1-30`, `31-60`, `61-90`, `over90`; each invoice has its id/number/revision, issuedOn/dueOn/termsDays/date basis, positive open balance, daysPastDue, reminderState and `#invoices/<id>` link. The first human approval freezes dates; CSV and mapped QuickBooks inspection use them too. Legacy dates explicitly say they are computed using current terms. Latest approved revisions on or before asOf count, never an unapproved correction. No payments are recorded yet and no reminders scheduled; PAY-002/004/005 inherit those states before shipping.

## Service reports (FIELD-003)

`visit.complete` additionally accepts optional `findings` (4000 characters) and up to 20 `recommendations:[{title,description?,serviceId?,quantity?}]`. Completion freezes a customer-facing report, visible to the desk in `serviceReports`; `serviceReportLinks` contains expiry and revocation metadata only. `report.link {reportId}` (owner, dispatcher or office) returns a seven-day bearer in `result.token` once; `report.revoke {linkId,version}` uses the same roles. `report.quote {reportId,recommendationId,unitPrice?}` (owner or dispatcher) drafts from a current price-book item or explicit price, with normal human approval and a `serviceReport` provenance link. Every command follows live role and branch controls.

The customer opens `/report#token=<bearer>` (shared by staff, or emailed by the explicit owner `report.link` action with `email:true`). `GET /api/glove/public/reports` and `/api/glove/public/reports/files/<snapshot-file-id>` accept only `Authorization: Bearer <glr_...>`, reject URL queries, and recheck expiry and revocation on every read. The credential reaches no other door. Responses are private, no-store and no-referrer; the snapshot has only the technician's first name. The raw token never enters saved results, Activity, export or logs. Its hash table is excluded from archives; restored links need reissuing. Automatic notices, hub and branded PDF are carried by COMM-003/004, COMM-006 and QUOTE-005.

### PLAN-004 booking offers and due included visits

- `agreement.offer {agreementId, index, slots:[{technicianId,date,start,end,window?}], email?: true}` (desk): offers 1–10 open future slots for the included visit, creating its job if needed. Result has metadata and a `token` shown once only. Share `/book#token=TOKEN` outside Glove, or pass `email: true` to have Glove email it to the customer's address (COMM-001); the result's `emailed.messageId` names the message whose delivery state `GET /api/glove/state` reports. Hash only, 14-day expiry, revoked on use or by staff; credential excluded from archives like FIELD-003.
- `agreement.offerSent {offerId, version, method}` records a staff send outside Glove, never provider delivery. `agreement.offerRevoke {offerId, version}` revokes it. Both are desk commands and audited.
- `GET /api/glove/public/booking` with `Authorization: Bearer TOKEN` reads only that visit's service, address and open offered slots. `POST` to the same path, same-origin JSON `{slotId}`, books exactly one of them under the offering person's current active role/branch, with GLOVE-05 checks. A taken slot answers `SLOT_TAKEN` and `error.details.offer` with remaining slots; it never reveals other customers' conflict details. Success revokes the bearer atomically. No cookie or token in a query string. All answers are private/no-store.
- Office may `visit.book` only jobs with a matching `agreementId`, after the ordinary exact-conflict review; never `visit.change`/`visit.cancel`. The dispatcher keeps other bookings; Office workflow rules retain API-005’s automatic-booking prohibition. Only an emailed link's provider report claims delivery.

`GET /api/glove/due-visits?from=YYYY-MM-DD&through=YYYY-MM-DD&area=ZIP`

The response also contains maintenance checks for completed entitlements in the current branch, with frozen copy identities, accepted capture references and the retained preparation status. Unprepared or changed evidence requires explicit preparation before the desk presents a current flag. Imported completion without native attributable evidence stays unavailable.
uses the existing desk state-read authority and branch scope. Both date bounds
are inclusive; through defaults to the business local today. Omit from for all
outstanding earlier visits; omit area for every ZIP. Each row has its agreement
ID and ordinal, due date, customer/site, job/visit IDs and completion/booking
state. Booking and term end never remove an outstanding entitlement.

`job.create` with `agreementId` optionally accepts `agreementVisitIndex`, a
zero-based unclaimed included-visit ordinal. Omission takes the first available
ordinal. Dispatch batches use existing job.create and visit.book commands and
permissions, with independent outcomes and ordinary conflict refusals.

`agreement.decline {agreementId, version, index, method, customerName, reason}`
(desk) records the customer's explicit decline of one included visit; method is
`phone`, `email reply`, `text reply` or `in person`. It is refused (`BOOKED`)
while that visit has a live booking, and (`ENTITLEMENT`) when it is completed,
already declined or outside the plan. The agreement returns with `declines`
appended; the visit leaves the due list and `entitlements.declined` counts it.
No customer booking link is supplied by this slice.

### COMM-001 customer email

- `mail.connect {provider: 'sendgrid'|'resend'|'postmark'|'ses', apiKey, eventKey, fromEmail, fromName?}` (owner): connects customer email through Base's mail adapter. `eventKey` is SendGrid's Signed Event Webhook public key (base64) or Resend's `whsec_` signing secret. Both keys are installation secrets, never returned, exported or archived. Postmark generates `callbackPassword` (Basic user `glove`) shown once in the first command response; only its SHA-256 hash is kept. SES uses `apiKey` as JSON `{accessKeyId,secretAccessKey,sessionToken?}` and requires `sns: {region,topicArn,configurationSet}`; set SNS signature version 2 and raw-message delivery off. `{provider: null}` disconnects and revokes callback credentials.
- `mail.morning {enabled, time?: 'HH:MM'}` (owner; email connected first): turns the owner's morning brief email on or off and sets the business-local time (default 07:00). `GET /api/glove/brief` adds `emailed`, the day's delivery state from the provider's facts.
- `email.send {kind: 'quote'|'invoice'|'purchaseOrder', id, version, to?}`: emails an approved quote's current revision to the customer's email (owner, dispatcher, office; the quote becomes sent), an approved or exported invoice to the accounts-payable address, else the customer's email (owner, office), or a draft purchase order to its supplier's address or `to` (owner, office; the order becomes sent). The result is the message record (kind, subject, recipient, sender, provider; never the body). Glove makes one send attempt after the command commits; nothing is retried.
- `mail.callback {action: 'rotate'|'revokePrevious'|'allowlist', enabled?}` (owner, Postmark only): rotate shows a new `callbackPassword` once and retains the old hash for 24 hours; revokePrevious ends that overlap immediately. `allowlist` requires `enabled` and sets the optional dated, source-pinned IP allowlist (off by default); Basic authentication remains required.
- `POST /api/glove/mail/events` authenticates SendGrid's signed event webhook, Resend's Svix signature, Postmark Basic or SES's signed SNS envelope before decoding delivery payloads, matching messages or applying effects. Generic 401 and no durable write on refusal; 404 disconnected; 429 after 20 rejected requests from one IP within a minute, shared across Worker isolates by a transient actor with no durable counter. Verified traffic bypasses that rejection allowance. Authenticated unmatched events return 200 and consume no ID; a wrong recipient for a known message refuses the entire batch. Postmark age is at most 7 days; SNS pins the region, topic, configuration set, delivery tag, certificate URL and confirmation URL, accepts signature versions 1 and 2 and timestamps up to 1 hour old or 5 minutes ahead, and refuses raw delivery. See COMM-001 in CONTRACT.md for the complete binding rules.
- `GET /api/glove/state` (desk roles) adds `messages`, `messageStates` (`{status, text, next, at}` per message: queued, accepted, deferred, delivered, bounced, complained, failed, rejected, rate_limited or uncertain, with what to do next), `emailWarnings` (per customer whose latest finished email to an address on their record bounced or was marked as spam) and `mailConnected`. The owner also receives `mailCallbacks: {verifiedAt,previousUntil,warning}` without credentials or hashes. Every send answer and provider event is a provider fact in Activity and the export (`email.accepted`, `email.delivered`, `email.bounced`, …) with the provider's reference and no key.

## QUOTE-002 customer revision links and signed approval

`quote.validity {days}` is owner-only and changes the default calendar-day validity for later revisions (1–3650; initial default 30). `quote.draft` and `quote.revise` take optional `validUntil: YYYY-MM-DD`; each revision freezes its branch/business zone and includes that whole date.

A signed-in person with `quote.link` and `quote.markSent` issues `quote.link {quoteId,version,email?}` for a current price-approved revision. Reissue revokes the old link. Its `glq_` token is returned once, never in a saved replay or export. Share `/quote#token=…` outside Glove or set `email:true` to queue to the customer email on record through COMM-001, which records the actual provider outcome. `quote.linkRevoke {linkId,version}` revokes it. Integration tokens cannot issue/revoke links.

The unscoped signed-in owner enables signing with `quote.consent {version: business.version, text, accept: true}`. There is no supplied disclosure or environment bypass. Each accepted concrete text has a version, SHA-256 and owner/time history; `{version, disable:true}` closes signing. Changing or disabling the disclosure refuses signatures prepared under the old version. This records the owner's acceptance and the customer's affirmation; Glove makes no legal-validity claim.

Public `GET /api/glove/public/quote` requires `Authorization: Bearer <glq_token>`, no query string. `POST` uses the same bearer, same-installation Origin and JSON. `changes` (message required), `decline` and `update` (once per revision) take a claimed `name`, optional `capacity` and message. `choose` takes `choice:{optionId,addOnIds}` and returns the exact chosen document and canonical `selection.hash`. `approve` takes that choice, claimed name/capacity, `documentHash`, `selectionHash`, `consent:{version,hash,affirmed:true}`, and either `signature:{kind:"typed",text}` or `{kind:"drawn",width:600,height:200,strokes:[[[x,y],…],…]}`. The typed option is always available; drawing is bounded to 40 strokes/3000 points. Approval rechecks disclosure, hashes, issuer role/branch, revision, price approval and validity; one staff or public decision wins atomically. The signed decision freezes the chosen document, signature, claimed identity/capacity, authentication basis, link ID, time, IP header (or explicit unavailable), browser and consent version/text/hash. A replay changes nothing and sends no second confirmation.

`GET /api/glove/public/quote/signed` uses the same live bearer and returns the frozen self-contained HTML attachment, verified against its recorded SHA-256. Desk people allowed to see the quote can read the same bytes at `GET /api/glove/quotes/<id>/signed`; field roles are refused. It embeds the original document images and signature, carries no bearer, and cannot be updated. Customer erasure removes its chunks with the quote under DATA-001. If a peer-owned immutable signed copy contains the subject’s typed identifier, the erasure preview names that copy and affected peer before confirmation. Erasure withdraws that original and signature evidence, redacts the identifier from the retained peer quote, and leaves the quote accepted. Both signed-copy routes then refuse the download; customer and desk views explain the withdrawal. Unaffected peer originals remain byte-exact and available. A connected COMM-001 provider sends the exact winning HTML copy and a text copy to the on-record customer email after commit, recording actual provider outcomes; it makes no delivery or identity claim beyond those facts. An expired revision permits only update requests and remains readable until its link expires. Requests and answers appear in Quotes, Activity, property history, COMM-007 and business export. Restore retains records, hashes and exact signed-copy bytes but requires newly issued read-only links for a decided quote.


### Customer privacy (DATA-001)

Only a signed-in owner without branch limits may `privacy.export {customerId, version}` or
`privacy.preview {customerId, version}` or
`privacy.erase {customerId, version, fingerprint, confirm: "ERASE"}`. Integration tokens and
custom roles cannot hold these commands. Preview names affected stores, withdrawn originals, affected peers and any retired Undo. Confirmation repeats its fingerprint; any intervening change requires a fresh preview. Export and erasure record a request receipt and
include every merged customer identity. Export returns a show-once `download`
JSON string with related records, timeline and original bytes in base64; shared import files are projected to this customer’s source rows/objects, with explicit omissions for mixed-ownership source records; it is
not saved in command outcomes. Erasure removes personal copies, bearer secrets,
files and certificates. The kit tombstones affected import records and preserves peer Undo. Only a kit refusal or an exact subject identifier in a custody header retires a whole batch, named in the preview. Peers keep their native records and per-record sources; later exports name unavailable byte-exact originals as omissions, while retaining anonymous
invoice amounts, dates and tax totals. The receipt lists each merged ID.
Erased records cannot be edited or unmerged. Keep the latest post-erasure
installation backup; supply it with `rer import --journal <latest-backup>`
when restoring an older offline backup. Base refuses the older checkpoint
against that trusted later journal or an existing destination fence. Value-free erasure fences remove earlier assignees’ cached day, cached originals and queued captures on their next successful state refresh; ordinary assignment loss retains late evidence. Disconnected devices observe the fence only after reconnecting.


### Branded documents (QUOTE-005)

Commands: `document.template`, `document.photo`.

`document.template {kind,version,heading,terms,footer}` edits the owner’s plain-text
quote/invoice/report/agreement template at the business version. `document.photo
{kind,id,version,photo,caption}` explicitly attaches a customer-facing original
image to a quote, invoice or agreement; service reports stay immutable. Both
commands are signed-in-owner only. Desk readers open `/api/glove/documents/invoice/<id>`
or `/api/glove/documents/agreement/<id>` within their current branch. The quote
bearer’s `/api/glove/public/quote/files/<id>` reads only the frozen document’s
listed original images, under the same live issuer/revision gates as its page.
Print / Save PDF uses the browser’s print renderer and includes the complete
customer document. No upload or outbound send happens by printing.

### Saved-export move-in sources

`import.stage` accepts `format: "servicem8" | "fieldpulse" | "workiz" | "servicetitan" | "jobber" | "housecallpro"` (omitted: ServiceM8), optional `balanceAsOf: "YYYY-MM-DD"`, and the existing `files` array and `label`. See IMPORT.md for filenames, provider response shapes and required balance and template joins. The response includes per-kind counts, named rejections and unmapped fields, attachment omissions, original file sizes and hashes and the exact reviewed fingerprint. Existing `import.commit`/`import.undo` commands and owner-only authorization apply unchanged. Source-only invoice histories cannot be approved, revised or exported as new sales.

For a ServiceTitan or FieldPulse job with `importedRecurrence.proposal`, `series.create` accepts `importedRule: true` instead of `rule`. Choose a first date matching that exact rule strictly after all exported source events, retain the source `until`, and provide the technician and start/end times. This explicitly activates future work; importing itself creates no generator or new booking. Unsupported recurrence shapes are listed in the move-in preview and retained in originals.

FieldPulse also accepts `recurring-jobs.csv` with the documented Recurring Jobs report columns in IMPORT.md. A source group becomes one inactive job proposal, joined by `recurring_parent_id`; last generated and all exported occurrences bound activation. Unsupported frequencies stay named in preview and retained for review.

### Route optimization (DISP-003)

`route.optimize {date,branchId?,technicianId?}` queues a bounded background proposal for a signed-in owner or dispatcher. The existing cron processes one queued day per pass. `route.accept {routeId,version,reason}` rechecks the day, authority, eligibility and fresh driving times and atomically applies the saved placements; `route.discard {routeId,version}` leaves visits unchanged. Read `state.routes` for progress, original/proposed slots, driving comparison or a concrete failure. No background pass moves visits. Google Maps must be connected and all sites placed.

### Recurring invoicing rules (PLAN-005 draft/reminder slice)

The signed-in owner supplies `billing` to `series.create/change` or calls `series.billing {jobId,version,from,billing,reason}`. `billing.mode` is per-visit, fixed-monthly, fixed-after-visit, on-close or as-needed; fixed modes take explicit `lines`, optional `paused` and explicit owner `autoApprove`. Dates apply forward and keep earlier invoices unchanged. `series.billingRun {}` is Owner/Office; the actual Worker cron also prepares due drafts/reminders. `GET /api/glove/recurring-billing` returns `{missed:[...]}` under current branch scope. Each invoice has an immutable recurring occurrence key; draft invoices do not count as approved/sent and never charge. Fixed-monthly approval freezes period-end issuance, a separate approval time and due=max(periodEnd,approvalLocalDate)+terms. Autopay/receipt/dunning remain unimplemented.

### Website service requests (BOOK-001 partial)

The unscoped signed-in owner configures `intake.configure {version:business.version,enabled,siteKey,secret?,allowedOrigins:["https://host"]}`. Omit `secret` to retain the installation-private key; disabling removes it. Credentials never enter business state, exports or archives. Reconnect after restore. This grants only the fixed anonymous request receiver; it grants no generic command access.

Link `/request` or embed `<script src="https://your-installation/glove-request.js" data-source="website" defer></script>`. The iframe reads no parent-page contact fields or storage. `GET /api/glove/public/intake` returns only the business name, public site key and challenge action while configured. `POST` takes `{submissionId:UUID,turnstileToken,consent:true,name,phone?,email?,address,zip?,service,description,preferredTimes,source?,photos:[{mediaType,base64,caption?}]}`. It accepts up to two JPEG/PNG/WebP originals under 1.5 MB each, validates Siteverify before persistence, and responds only `{ok:true,receipt}`. Reuse the submission UUID to recover a confirmed receipt without a duplicate. A failed/uncertain challenge admits nothing. Customer matching reveals nothing publicly. Desk file reads remain authenticated and branch-scoped.

The office receives an in-app notice and reviews the queue; no booking or reply is automatic. The off-by-default photo switch takes `modelPhotosEnabled`, `photoProviderName`, `noTrainingTerms` and `confirmNoTraining:true` in `intake.configure`, under signed-in unscoped-owner authority. Enter the applicable agreed training prohibition and affirm it binds that provider account. Each save or provider reconnection invalidates earlier permission. While enabled for the current connection, public configuration includes `photoDisclosure` with its identity, recipient name/hostname and exact consent text; private provider terms are excluded. An optional `photoConsent:{accepted:true,disclosureId}` on submission separately authorizes that request’s photos. Without it, the office still receives the request but no photos join model evidence. Stale disclosure refuses without persistence. Quote drafting sends server-stripped JPEG/PNG/WebP copies only, never captions or customer identity/contact/address fields; unsupported or malformed copies refuse. Originals remain private. The authorization batch immediately before each attempt rechecks exact request/business versions, caller and configuring owner authority; photo requests cannot follow redirects. Store-off alone never establishes the training prohibition. The owner-affirmed provider qualification and owner-recorded withdrawal are adopted conservative defaults awaiting ct confirmation, so BOOK-001 remains PARTIAL. Cloudflare verification follows its [official server-side validation contract](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

`intake.withdrawPhotos {enquiryId,version,senderRequested:true,reason}` records a sender withdrawal under the signed-in unscoped owner. It removes that request’s photo permission from later model attempts while retaining office originals. No anonymous withdrawal credential or customer account is created.

### Stripe invoice payment foundation (PAY-002 partial)

The signed-in unscoped owner connects `payment.connect {version:business.version,mode:"test",key,webhookSecret}`; `key:null` disconnects. Credentials are private and omitted from archives; a restored installation must reconnect before requesting Checkout. Live activation is closed; Stripe’s balance API must confirm the key is in test mode before the connection is saved, and live Checkout responses are never returned. `payment.preferences {version:business.version,tipChoices:["0.00","15.00"]}` sets 1–20 distinct fixed-dollar choices, including zero, for future requests (zero only by default); only the signed-in unscoped owner may change them. It keeps the connection and existing reservations. `payment.checkout {invoiceId,version,method:"card"|"ach",tip?:"0.00"}` accepts approved USD Glove invoices only. Its first response may contain `checkoutUrl`; keep this bearer private. A replay returns the reservation without that URL or another provider attempt. Checkout session references stay private; public checkout facts contain only their hash. Unresolved/uncertain reservations block duplicate requests; inspect Stripe rather than attempting another charge. No request accepts card or bank numbers. The public `/payment-return` acknowledgement never treats a redirect or its query parameters as payment confirmation.

Stripe posts signed events to `POST /api/glove/payments/events`; verification precedes parsing and effects. Glove retrieves the current intent with the owner's key and checks connection, identity, currency, amount and test mode. Provider-confirmed settlement reduces balances; pending does not; failed charges/returns reverse confirmed effects. `GET /api/glove/payments/<id>/timeline` requires report access and current branch scope and includes receipt delivery facts. `payment.receipt {paymentId,version}` is an explicit Owner/Office transactional email to the record's email through COMM-001. The payment controls, deposits/agreements, wallet verification, customer tip selection, surcharge, reconciliation and full archive/restore proof remain unbuilt; this is not a completed payment product.

### Payment balances and original-method refunds

`GET /api/glove/balances` requires the reports permission and preserves branch scope. It returns per-invoice due/credit and per-customer/currency totals. `payment.checkout` takes optional `amount` (positive, no more than unpaid), retaining PAY-002’s signed-in unscoped-owner test-only boundary.

Signed-in office/owner: `payment.record {invoiceId,version,method: cash|check,amount,reference}`; `payment.allocate {invoiceId,version,sourceInvoiceId,sourceVersion,amount}` moves available same-customer/currency/branch credit. Owner: `payment.credit {invoiceId,version,amount,reference}` (reference is the reason); `payment.refund {invoiceId,version,paymentId,paymentVersion,amount,reason}` records a cash/check return or reserves one original-method Stripe test refund. A pending provider refund can be inspected with `payment.refundRefresh {refundId,version}`. Unknown reservations require inspection in Stripe and are never resent by replay. Each refund is a separate record linked by `paymentId`; only confirmed refunds affect balances. Receipts use `payment.receipt` for the confirmed payment or refund record. No raw card data is accepted.

`service.deposit {serviceId,version,deposit}` and `quote.deposit {quoteId,version,deposit}` require the signed-in unscoped owner; `deposit` is null or `{kind: amount|percent,value}`. The quote door accepts only an unapproved draft. Rules freeze in signed revisions. `payment.depositCheckout {quoteId,version,method: card|ach}` requires that owner and the exact winning signed current revision and its created job. It returns test Checkout once, never on replay. Confirmed funds stay job-held until invoice preparation assigns the invoice; pending funds have no balance effect. No customer bearer receives payment authority. Before invoice preparation, `payment.refund` omits `invoiceId` and uses the job version in `version` for a held deposit; `paymentId`/`paymentVersion` still identify the original payment.

### Payouts and provider financing

The signed-in unscoped owner uses `payout.reconcile {providerId}` to inspect a Stripe test payout and its unmatched sources. Automatic payouts use Stripe's source transactions. For a manual payout, `payout.allocate {providerId,paymentIds}` explicitly reviews the books allocation (no Stripe source attribution is claimed). `payout.feeSchedule {version,basisPoints,minimum,source}` records the owner's account-specific pricing; Glove does not verify it. `payout.instantPreview {amount,destination,paymentIds}` checks an existing eligible debit card, available test balance, and source net equal to amount plus calculated fee. `payout.instantConfirm {payoutId,version,confirmAmount,confirmFee}` rechecks and reserves one request; an unknown response never causes an automatic repeat. Actual fee differences remain unmatched. Signed-in office/owner: `payment.depositBatch {paymentIds,reference}`, 1–100 confirmed same-currency/branch cash/check payments not already deposited.

`financing.connect {version,mode:test,merchantId,minimumAmount,authToken}` is signed-in unscoped-owner only; `authToken:null` disconnects. The token is private and excluded from records/exports/archives/browser storage. Only the fixed test endpoint `https://api.wisetack-sec.us/api` is enabled, using its documented Basic auth and merchant transaction protocol (https://wisetack-sec.us/api/index.html). On an owner-issued current quote link, POST `/api/glove/public/quote` with `{action:financing,choice,serviceCompletedOn,financingConsent:true}` reserves an application before one provider attempt. Only amount, date, generic service purpose and an opaque purchase ID are sent. The one response may contain `financingUrl`, never saved or replayed. The owner uses `financing.refresh {financingId,version}` for provider decision/offer/funding; funding must match the exact signed choice and job. Job-held financing allocates when its invoice is prepared. PAY-004 refunds a funded payment through Wisetack's documented original-method refund endpoint with a separate durable record and no automatic resend. Unknown outcomes require provider inspection. No underwriting, lending or live activation is supplied by this test slice.

PAY-004 refunds accept optional `tip` separately from invoice-principal `amount`. Each is capped by the unrefunded original component including pending reservations. `amount:0.00` with a positive remaining tip returns only that tip. Stripe receives their summed gross cents, while invoice/tax and technician tip/payroll effects remain separate. A later provider return does not reverse an already refunded tip twice.


## Automatic customer notices (partial)

The normal command endpoint accepts `reminder.preview`, `reminder.configure`,
`reminder.consent` and `invoice.dispute` only from the signed-in owner without
branch limits. Integration tokens and agents cannot call them. Team settings
contains the template editor, exact previews, schedules and explicit approval.

- Preview takes `templates`, with plain-text entries `confirmation`, `moved`,
  `cancelled`, `visitReminder`, `paymentReminder`, `quoteFollowup` and optional
  `reportReady`. Supported
  fields are `{{customer}}`, `{{date}}`, `{{time}}`, `{{number}}`, `{{amount}}` and
  `{{title}}`. The returned preview includes the mandatory business and stop footer.
- Configure takes the current business `version`, `enabled`, and, when enabling,
  `approved: true`, every template, `visitHours` (1 to 168 hours before the visit),
  `paymentDays` (-30 to 90 calendar days from invoice due date), and `quoteDays`
  (1 to 90 elapsed days after the revision was recorded sent). Each list has at
  most six distinct integer offsets; an empty list disables that sequence.
  `quoteTextDays` and `quoteCallDays` accept the same elapsed-day offsets. A call
  step creates an internal task, never a call. `enabled: false` stops all
  automatic customer notices and pending call tasks.
- Consent takes `customerId`, current `version`, `purpose` (`visits`, `payments`
  or `quotes`), `enabled` and a required customer consent or withdrawal `reference`.
  Payment consent binds the recorded accounts-payable address, falling back to
  the customer email; the other purposes bind the recorded customer email.
- Dispute takes `invoiceId`, current `version`, `disputed` and `reason`. An active
  dispute pauses its payment reminders. A zero balance also stops them.

The scheduled Worker runs the sequences. It enforces 18:00 to 08:00 quiet hours
in the record branch zone and sends through the connected customer email provider
once per claimed step. Message history records the provider outcome and reference,
never a reusable Checkout or customer quote bearer. Unknown outcomes are not retried.
The quote and invoice email sections show reserved steps and provider outcomes;
aging includes each invoice's current reminder state. Quote emails require the
business postal address and carry a separate explicit withdrawal link; reading
that link changes nothing and stopping it affects quote follow-up email only.
Customer pay links and COMM-001's remaining provider matrix stay separate gaps.


`quote.followupComplete {quoteId,version,key}` completes an open internal task
through the desk's current permissions. The task records its actor and time;
it never claims a call occurred. Answers, revision changes, closure, expiry or
disabled automation stop pending tasks.

`sms.connect {version,provider:twilio,accountSid,authToken,fromNumber,
registration:a2p10dlc|tollFree,registered:true,live:true}` connects an already
live registered US number, recording the owner's affirmation. It always starts
disabled; `{version,provider:null}` disconnects. `sms.configure
{version,enabled,approved:true}` explicitly enables the channel. These commands
require the signed-in unscoped owner, with no integration token or custom role.
The secret is private and excluded from archives; restore requires reconnecting.

`sms.consent {customerId,version,purpose:visits|quotes,enabled,address,source,
wording,timezone}` records the exact current E.164 number's purpose consent or
withdrawal with its source, wording and customer zone. Customer settings exposes
both purposes separately. Texts use 08:00–18:00 in that recorded zone; STOP
withdraws both, START only clears the number block, and HELP is recorded while
Twilio sends its configured standard response. Signed callback doors are
`POST /api/glove/sms/events` and `POST /api/glove/sms/inbound`. The exact external
URL and full form participate in the signature; no body or credentials enter
Activity. One durable attempt per text and authenticated delivery facts join
the customer and job Conversation and export. See `docs/sms-channel.md` for the
bounded protocol and remaining number-ordering and delay-agent gaps.

`visit.replyLink {visitId,version}` explicitly emails a future booked visit's
response link, using current visit-email consent and the configured provider.
Only its hash persists; the raw credential appears only in the email. The owner
receives message metadata and expiry, never the credential. `/visit#token=...`
reads and explicitly answers `GET` or `POST /api/glove/public/visit-response`
with a Bearer header. The first confirm or reschedule wins; reschedule opens a
request on the job without moving or cancelling it. The page reveals only the
business, title and window, never address or customer contact. Reissue, schedule
change, withdrawal, lost issuing-owner authority, erasure or expiry closes it.

`report.link {reportId,email:true}` explicitly emails a completed report through
the owner's provider using the approved report-ready template and visit-email
consent. It returns message metadata without the report credential; provider
acceptance and delivery read in the usual message state and job timeline.
Manual `report.link` sharing remains available under its existing permissions.

The conservative owner-only, consent, quiet-hours, minimal response-credential
and explicit report-email defaults remain pending ct approval. Future COMM-004
and COMM-008 notices inherit explicit template approval and immutable business
and opt-out wording before shipping.

### Technician visit calendars

The signed-in unscoped owner uses `calendar.connect` with `technicianId`,
`provider` (`google` or `microsoft`), `calendarId`, `clientId`, `clientSecret`,
`refreshToken` and explicit `confirm: true`. Delegated OAuth permission must
allow calendar event reads and writes. `details` defaults to false; true sends
only customer name and service address. No attendee invitations are created.
Credentials are never returned and must be supplied again after archive restore.
Use `calendar.read {technicianId}` to refresh busy instants for 90 days.
Booking and movement also refresh busy time; an unreadable provider refuses the
booking. Visit writes are queued atomically with the committed visit and drained
on commands and the existing scheduled pass. Replaying a command does not
repeat the write. Uncertain writes stop that connection's queue and remain
visible in Team; inspect the provider before reconnecting. The owner disconnects
with `calendar.connect {technicianId, disconnect: true}`. Existing provider events
remain on disconnect; remove those events there before reconnecting. Provider
calendar edits never change a Glove visit.


### Consented on-clock location

`location.consent {enabled}` is the technician's own explicit person action.
`location.phone {lat,lng,observedAt}` accepts only fresh positions during that
technician's shift and current assigned visit timer. Never queue this command.
`GET /api/glove/location` reads only that technician's sharing preference.

The unscoped owner connects one documented Samsara vehicle with
`location.fleetConnect {technicianId,vehicleId,key}` (use `key:null` to disconnect)
and explicitly reads it with `location.fleetRead {technicianId}`. The technician's
consent and active work are required before a provider request. Keys are private
installation credentials; set them again after restore. Integration tokens and
custom roles cannot call these doors. The map board exposes current positions
and driving ETA only to the owner within the selected branch scope.
Other existing map readers retain stops and route legs without live positions.
The delay watch adds location evidence for the same owner-only audience;
it changes no proposal or promised-window authority. ct approval is pending.

### Phone desk and explicit visit status texts

The saved-card, shared inbox and technician status commands are documented in
[Phone desk and visit status texts](docs/phone-desk.md). They retain the existing
public command, branch, session, version and provider-outcome boundaries. Their
adopted policy defaults remain pending ct approval; no live activation is added.


### Shift position views and review email

`location.delegate {technicianId, shiftId, operatorId, enabled}` is restricted to the unscoped signed-in owner. The selected active Dispatcher or named agent gets only that technician’s current open shift. The phone’s existing `GET /api/glove/location` status names active viewers. The existing map door audits every delegated read without coordinates. Grants are transient, excluded from archives and never inherited by another shift.

`review.configure {version, enabled, approved, trigger, periodDays, template, url, postalAddress?}` records the owner’s uniform review request, Google review link and customer-wide period. The optional postalAddress updates the business postal address used in mandatory email footers. Team and settings contains the manual review editor, separate current-email permission and withdrawal, eligible completed-and-paid job selection and explicit send with provider outcomes. Owner state includes reviewJobs with workReady and the current send refusal reason, using the same gates as the command; other roles and scoped credentials receive no such projection. The trigger is `completion` or `payment` for owner review; automatic execution is not implemented. `review.consent {customerId, version, enabled, reference, address?}` records separate consent bound to the current email address; a supplied address must still match when permission is recorded. The browser binds permission confirmation to the displayed customer revision and email; changing customer details requires fresh confirmation even if an earlier email address is restored. It invalidates send confirmation after the customer or saved business settings change. Failed review attempts show that the shared customer period is consumed and that Glove will not retry. `review.request {jobId, confirmation: {businessVersion, customerVersion, address}}` is an explicit owner act and sends only after all noncancelled visits are complete and every approved invoice is paid. The confirmation must match the current business and customer versions and email at the command boundary; a missing or stale confirmation refuses without creating a message or consuming the period. Existing opt-outs win. One attempt consumes the customer’s period even when the provider outcome is uncertain. The existing email-preference door stops the review purpose independently of quote follow-up email. Text requests and Google Business Profile review retrieval are not implemented.


### Preparatory service booking links (BOOK-002)

`booking.offer {jobId, slots: [{date, start, end, window: {start, end}}]}`
requires a signed-in unscoped Owner. The job must be an open service call for
one price-book service, without an agreement or live visit. Supply 1 to 10
future planned times and arrival windows in the booking zone. The response
adds a show-once `token`; share the installation's `/book#token=<token>`
address with that customer outside Glove. Replays omit the token.

Instead of explicit slots, supply `generate: {date, start, end, durationMinutes, stepMinutes}`.
This generates up to ten chronological windows within one local day, excluding
candidates with no currently eligible technician. Duration and step are whole
minutes from 15 to 480; a complete visit must fit the range. Each window starts
at its planned start and ends at its planned end. An empty range is refused
without issuing a link. Explicit slots and generation cannot be combined.
Generation applies skills, service area, working hours, time off, calendar
blocks and existing visits through the existing assignment door. It does not
reserve capacity. Generation, public availability and final automatic assignment
also check both adjacent noncancelled visits on that technician's local day.
The preceding visit must leave enough time to reach this site, and this visit
must leave enough time to reach the following site. Exact route-duration
boundaries are included without rounding down fractional seconds. Different
sites require available locations and directed Google Maps route answers;
a missing connection, location, route or failed provider response makes that
technician unavailable. The same site needs no relocation, and a day without
adjacent visits needs no inter-visit drive. Another eligible technician may
serve a window that one technician cannot reach. Current schedule and Owner
authority are fenced again at the atomic booking commit. Customer service
selection and priority treatment remain gaps.

The existing public booking endpoint rechecks real capacity and assigns an
eligible technician automatically at choice. It returns no technician ID or
competing work. The link expires after 14 days, is consumed on use, and the
issuing owner can revoke it with `agreement.offerRevoke {offerId, version}`.
The owner can record an outside send with `agreement.offerSent`.
Customer service selection, automatic confirmation delivery, deposits,
customer cancellation and fees are not available on this preparatory door.
Booking adds an internal desk confirmation task, never an automatic charge
or send. BOOK-002 stays partial; see its exact remaining Gap in CONTRACT.md.

## QuickBooks sandbox sync

These commands require a signed-in unscoped Owner. The owner connects a sandbox company and explicitly verifies existing records before the first post. Nothing sends automatically. Production OAuth and account activation remain unfinished.

- `qbo.connect {realmId, mode: "sandbox", key}` stores an installation-private access token. `{key: null}` disconnects. Reconnecting the same company preserves its link identity.
- `qbo.discover {}` reads the full paginated customer, item and invoice lists without provider writes. The response includes a transient JSON string `review` with a fingerprint, local record proposals (matching rule, candidates, ambiguity or no match, and name clashes) and untouched provider records. Names are not retained in business settings or the saved command result; a replay retains only read counts and the fingerprint. Read again for a current review.
- `qbo.createCustomer {id, version, reviewFingerprint, confirm: true}` explicitly approves one unmatched customer from that exact current review. It refuses matches, name clashes, stale review and unresolved sends. Creation is durably reserved before the network write; replay never creates another customer. A definite refusal permits explicit repair and a new approval; uncertainty requires `qbo.reconcile`, never another creation attempt. No automatic creation or retry runs. These two command doors do not yet have owner browser controls.
- `qbo.map {kind: "customer" | "site" | "service" | "invoice", id, remoteId}` verifies an existing provider record. A dependent post locks its accounting link; unresolved sends must be reconciled first. Properties must be sub-customers billed through their mapped parent; an invoice must match its customer, document number and total.
- `qbo.confirmLinks {confirm: true}` confirms the verified links for records present at connection and records the confirming actor and time on each link. Posting refuses until this succeeds.
- `qbo.configure {taxCodeRef, classRef?, departmentRef?}` verifies the transaction tax code and optional accounting dimensions. Sales items retain their mapped income accounts.
- `qbo.sync {kind: "customer" | "service" | "invoice" | "payment", id}` explicitly syncs one record. Payments include confirmed full-invoice refunds. Outcomes are `complete`, `rejected` or `unknown`; provider references and errors remain on the record. Replay creates no second provider record. Repair a definite rejection before retrying. Unknown or interrupted sends cannot be retried here.
- `qbo.reconcile {kind, id, remoteId}` reads an existing provider reference after an uncertain result. It completes only when every sent field matches the reserved content and the local record has not changed. It creates no new provider record. An interrupted in-flight operation still requires operator recovery.
- `qbo.pull {remoteId}` reads a QuickBooks payment and applies its exact invoice allocations. Repeated readback and Glove-origin echoes never duplicate money. Changed imported payments and imported refunds require accounting reconciliation.

The owner controls are under Team and on approved invoices. The original downloadable inspection payload remains available independently. Keys never enter command recovery storage, state, Activity, business export or archives. Provider outcomes and references remain attributable in Activity, property history and business export.

### Preparatory recurring-card and hub inspection commands

Only a current signed-in unscoped Owner may use these commands; application
tokens, custom roles and branch-scoped Owners are refused.

- `payment.autopayAuthorize`: `jobId`, `version`, `cardId`, `maxAmount`,
  `source`, `wording`, `confirmed: true`. Records customer permission for the
  current unpaused fixed-monthly rule and an already verified test saved card
  with autopay scope. Existing active permission must be withdrawn first.
  Each replacement creates a distinct permission in Owner-only history,
  retaining the original wording, source, recording Owner and time, card,
  customer, monthly cadence, rule identity and revision, and maximum.
  Withdrawal retains its Owner, time and reason. Billing edits keep that
  history but require fresh permission for the new rule.
- `payment.autopayRevoke`: `jobId`, `version`, `reason`. Withdraws future
  requests without removing the original authorization evidence.
- `payment.autopayCharge`: `invoiceId`, `version`, `cardId`, `amount`,
  `confirmed: true`. Explicitly requests one full unpaid approved invoice
  charge within the current rule and consent maximum. An invoice with any
  paid balance is refused with “The invoice must be fully unpaid”, with no
  provider request or balance change. Billing and cron never
  call this command. Changed rules, pauses, revoked cards or permission and
  unresolved prior attempts refuse another request. Only authenticated Stripe
  confirmation pays the invoice. There is no automatic receipt or update link.
- `customer.hubPreview`: `customerId` only. A signed-in Owner without branch
  limits explicitly inspects that customer's proposed content from Customers.
  The response contains permitted quotes, approved invoices, confirmed-payment
  summaries, visits, completed-report summaries, equipment and agreements.
  Quotes retain the permitted alternatives and optional additions; accepted
  quotes show the chosen work and its accepted total instead of the first option.
  Drafts, private notes, access notes, conversations, authorization evidence,
  credentials and report originals are excluded. Current authority also governs
  replay. A refused inspection reads “An Owner without branch limits must sign
  in to inspect this customer preview”; an erased, merged or missing customer
  reads “Customer preview unavailable”. All customer actions remain disabled;
  inspection creates no credential, customer access, send or payment.

These are PARTIAL preparatory boundaries under the 26 October 2026 CT
approval with riders for PAY-008 and COMM-006, preserving their full original
acceptance. Business export and restore retain permitted history, exclude
payment credentials and execution reservations, and never resume collection.
Reconnecting Stripe requires a newly verified card and fresh permission;
each invoice still requires its own explicit confirmation.


## Invoice collection groundwork

- `GET /api/glove/customers/<id>/statement.json?asOf=YYYY-MM-DD` and the corresponding `.csv` door require existing report authority and current branch access. They return that customer's approved invoice balances through the selected date, confirmed net payments, separate credits and per-currency totals. Defaults to the current business-local date. No credential or payment link is issued. Customers offers the CSV download.
- `invoice.chase {invoiceId, version}` (Owner, Office, Agent) requests only currently due steps from the existing owner-approved payment reminder sequence. Consent, quiet hours, disputes, current owner authority, prior reservations and zero balances keep their existing force. The answer describes a request, never a claim of sending or delivery; message provider facts record the actual outcome. A replay does not request another pass.
- `reconciliation.prepare {paymentId, version}` (Owner, Office, Agent) compares a confirmed provider payment or refund with retained invoice, scope, field-evidence and accounting outcomes. Returns an inspection proposal, without a provider request or financial effect. An unresolved accounting operation is explicitly for inspection, never resend.
- `reconciliation.decide {proposalId, version, decision: approved|declined, reason}` (signed-in Owner or Office, other than the preparer) records the human inspection decision. Approval rechecks payment version and retained accounting connection and phase. Neither decision posts to books, grants a credit or requests a refund. Those effects require their existing separately authorized commands. The dispatch proposal door refuses reconciliation proposals.

Completed jobs still awaiting invoice preparation or approval receive one internal Activity reminder per branch-local day on the first scheduled pass at or after 08:00. Concurrent passes deduplicate, and approved invoices and erased jobs receive no new reminder. This creates no external email or text.

### Preparatory payout and Xero inspection

The existing command endpoint accepts `reconciliation.prepare` with `payoutId` and `version` for an unscoped signed-in Owner. It compares retained payout facts and current books outcomes, creates an inspection proposal only, and requires a different Owner for `reconciliation.decide`. It neither reads a provider nor posts or moves money. Existing payment-specific preparation retains its prior role rules.

`xero.connect` takes the current business `version`, a tenant identifier and OAuth access token; `token: null` disconnects. Supply credentials only in a private command request; never retain them in browser storage. `xero.inspect` takes `customerId` and returns immediate whitelisted company contact, item and sales-invoice summaries in `result.review`. Both require an unscoped signed-in Owner. Inspection is read-only, refuses potentially incomplete lists, and grants no matching, posting or payment authority. The separate xero.discover, xero.map and xero.confirmLinks commands support bounded paginated discovery and explicit local contact and sales-item review, as documented in [XERO.md](XERO.md); they grant no posting or payment authority. Credentials are installation-private and must be reconnected after restore.

Xero existing-invoice links extend the same `xero.map` door with
`kind: "invoice"`, the local invoice identity and version, existing remote
identity and `confirm: true`. The provider sales invoice must match the linked
billing contact, original number, approved USD total and authorized/paid state.
Current `xero.confirmLinks` still requires the business version, explicit consent
and discovery fingerprint, and revalidates every link before retaining the
confirming Owner and time. Billing-contact replacement invalidates dependent
invoice links. These local links authorize no posting or money movement.

### Conditional Xero company policy

Company action policy, 27 October 2026: Every Xero provider write, consequential link review, reconciliation and payment-readback effect carries the risk class provider-write through one installation-owned company policy hook. The company policy chooses allow, review, approve or block. An absent policy is not allowed; review and approve request a policy decision and execute no effect. Only allow permits the existing separately authorized command. There is no new product confirmation gate. Policy is scoped to the local business and connection, excluded from archives, and checked again immediately before provider writes. Audit records the class, action and decision. Default inspection and fingerprint-bound local link review retain their read-only authority; neither grants accounting or payment authority. The reviewed fake journeys explicitly install an allow policy for their own company. This is conditional local proof, not a change to the retained CT inspection ruling or live provider proof. LEDGER-002 stays PARTIAL.

See [XERO.md](XERO.md) for conditional explicit sync, reconciliation and payment
readback commands and their remaining provider boundaries.

## Company agent door

The shared MCP and company-policy door is documented in
[Company agent door](docs/agent-door.md). Price-book reads expose the native `businessRevision` for category and bulk-price
preconditions, and service `version` for item preconditions. The declared scope currently covers
internal price-book inspection and updates, category markup and bulk price
adjustment, using the sponsor's current native authority. Customer, provider,
payment and coordinator-week work is not yet registered. Native integration
tokens retain the API-002 door and its original purpose; no email match turns
one into a Business sponsor. `/agents` is the signed-in person's policy,
Pause, review and audit door.
