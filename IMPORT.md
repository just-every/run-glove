# Moving in from ServiceM8

Glove's first move-in kit reads what ServiceM8's REST API returns for its object lists. It runs on Base's import kit (`src/modules/import-kit`, D1 port): a dry-run preview, a durable journal with the exact received files, and undo.

## What to bring

Save each list from your own ServiceM8 API access as a JSON file named for the object, exactly as the API returned it (a JSON array):

| File | ServiceM8 object | Becomes in Glove |
| --- | --- | --- |
| `company.json` | Company (client) | Customer; `active: 0` clients are kept as archived |
| `companycontact.json` | CompanyContact | Merged into its customer (primary contact first; the rest listed) |
| `staff.json` | Staff | Technician (not yet linked to a sign-in) |
| `job.json` | Job | `Work Order` → open job; `Completed` → completed job (or invoiced, if `invoice_sent` is 1); `Quote` → quote draft needing price approval; `Unsuccessful` → declined quote. Its `job_address` becomes a site of that customer (one site per customer and address). |
| `jobmaterial.json` | JobMaterial | Price lines of its job or quote (`price` is ex tax; GST 10% applied) |
| `jobactivity.json` | JobActivity | Visits of its job, at the activity's local time in your business timezone; done if the job is completed or the activity was recorded. No arrival or sign-off is claimed. |
| `attachment.json` | Attachment | Listed on its job; the file itself is kept only if you add it |
| `attachments/<uuid>` | the attachment's downloaded file | Kept byte for byte in the move-in journal |

Any file you leave out simply contributes nothing; a record whose parent is missing (a job whose client is not in `company.json`) is rejected and reported, not guessed. Together the files may be up to 1.4 MB per move-in; split larger histories into batches (customers and staff first, then jobs by year).

## Preview, commit, undo

1. **Preview** (`import.stage {label?, files:[{name, text}|{name: "attachments/<uuid>", base64}]}`): nothing but the preview is written. It shows, per ServiceM8 list, how many records become Glove records, are merged, or are rejected (with file and item number); which attachment files are missing; the ServiceM8 fields Glove does not use; and how many were already moved in by an earlier batch. Its fingerprint names exactly this plan.
2. **Commit** (`import.commit {batchId, version, fingerprint}`): applies exactly the reviewed preview. If Glove's records changed so the plan would differ, it refuses (`IMPORT_STALE`) and you preview again. Batches of 50 records commit atomically with their source identities, provenance and journal; a lost answer is recovered by sending the same commit again. Every Glove record keeps its ServiceM8 UUID (`source.id`) and moved-in IDs start with `sm8-`.
3. **Undo** (`import.undo {batchId, version, reason}`): removes exactly what this move-in wrote. It refuses while Glove work refers to a moved-in record (`IMPORT_DEPENDENTS`, listing them), and stops at any moved-in record edited in Glove since (`NATIVE_EDIT_CONFLICT`), keeping the edit. A reference anywhere in a record counts, including a visit's assignment history. A large move-in is undone in passes: the first answers `IMPORT_INCOMPLETE` and marks the move-in `undoing`; until the same undo is sent again and finishes, its remaining records cannot be edited or used in new work (`IMPORT_UNDOING`).

Moving in the same unchanged records again writes nothing (the kit reuses the earlier result). A record that changed in ServiceM8 since it was moved in is refused rather than overwritten.

## Proof and limits

The kit is proven against the authored fixture in `tests/fixtures/servicem8-small-hvac` (documented API field names, not a real export): `tests/api/flows.test.mjs` clause 11 and `tests/api/movein.test.mjs`. A real owner export has not yet been reconciled; until it is, treat the mapping as untested against your account's data, and compare the preview's counts with ServiceM8 before committing.

## Customers from a CSV (CUST-003)

The owner imports customers, their other contacts and their properties from one CSV file (up to 2 MB and 5,000 rows) through the same kit journal: preview, commit, undo (`import.stage {format: "csv", label?, files:[{name, text}], mapping?}`, then `import.commit` and `import.undo` as above).

- **Columns.** `mapping` names the file's column for each Glove field (`customerId`, `name`, `kind`, `abn`, `email`, `phone`, `contact`, `billingAddress`, `billingContact`, `apEmail`, `requirePo`, `contactName`, `contactRole`, `contactPhone`, `contactEmail`, `siteAddress`, `siteZip`, `siteAccessNotes`, `siteContact`, `siteContactPhone`, `siteContactEmail`), in any column order. Without one, Glove uses the mapping of the last committed CSV when every column it names is in the file, else columns headed like Glove's own export (`Customer ID`, `Name`, ...). A name column is required (`IMPORT_MAPPING`). Committing a CSV remembers its mapping.
- **Rows.** Rows sharing a Customer ID, or without one carrying identical customer details, are one customer; each row may add one site and one other contact. `Kind` is residential or business (blank: residential); `Requires PO` is yes/no/true/false/1/0 (blank: no). A cell an earlier spreadsheet guarded with a leading `'` (before `= + - @`) loses exactly that `'`.
- **Preview.** Every data row is counted once as new, matched or rejected (`preview.rows`), with each rejected row's spreadsheet row number and reason (a field refused as `customer.save` or `site.save` would refuse it, more cells than the header, a row repeating an earlier row exactly, details differing from the first row with the same Customer ID). `new` lists the customers to be created; `possibleDuplicates` flags those sharing a phone, email or address with a Glove customer or another new one (CUST-005), for merge review after commit.
- **Matched.** A row is matched when its Customer ID is a Glove customer's ID, or it repeats a customer an earlier CSV import created. Glove keeps a matched customer's details and contacts as they are and lists which file values differ (`matched[].differs`); only site addresses the customer lacks are added. A Customer ID of a customer merged into another is rejected.
- **Export.** `GET /api/glove/customers.csv` (owner, office, or a role with `export.read`) writes every live customer: one row per site or other contact (at least one), the customer's details and ID on each. A cell starting with `= + - @` (or a `'` before one) gets a leading `'` so a spreadsheet does not run it. Re-importing this export matches every row and writes nothing.

Proof: `tests/api/csv.test.mjs` (500 rows with bad rows and duplicates, commit, undo, export round trip).

## FieldPulse, Workiz and ServiceTitan saved exports

Choose the source under **Move-in source**. These adapters read files saved by the owner; they never sign in to the old system or fetch an attachment URL. Use detailed API responses, with all pages saved as `jobs.json`, `jobs-2.json`, and so on. Arrays and the provider's response envelope are accepted. Each source object's original ID, exact file bytes and SHA-256 are journaled with its native records. Unknown fields and rejected rows are named in the preview. A missing or rejected parent also rejects its dependent records. Staff never receive a Glove sign-in or the old system's role.

- **Workiz v2:** `clients.json`, `users.json`, `items.json`, `leads.json`, detailed `jobs.json`, `estimates.json` and `invoices.json`, using the [Workiz CRM v2 response fields](https://developer.workiz.com/v2/). Jobs include their service addresses, team, line items, notes and attachment descriptors. `amountDue` is the invoice's remaining balance, independently of its original total. Download attachment bytes yourself and name them `attachment-ID.ext` in the screen, or `attachments/ID` in the command. A missing file is reported as missing, never as retained.
- **FieldPulse:** `customers.json`, `locations.json`, `users.json`, `items.json`, `jobs.json`, `estimates.json`, `invoices.json` and `comments.json`, using the [FieldPulse Open API fields](https://help.fieldpulse.com/api-reference/overview). Jobs preserve their exported visits and `recurring_parent_id`; invoice/estimate line components keep their prices and quantities. Attachment IDs in line components use downloaded `attachment-ID.ext` files. Also export the [invoice raw-data report](https://help.fieldpulse.com/reporting/raw-data/invoice-reports) as `invoice-balances.csv`, with `#ID,Invoice Total,Amount Due,Invoiced Date,Due Date,Tax,Pre-Tax Subtotal`. The report's `#ID` must equal the detailed invoice's ID; a missing match is rejected, never guessed from a name or status. Dates are YYYY-MM-DD and amounts are plain USD decimals.
- **ServiceTitan v2:** `customers.json`, `contacts.json`, `locations.json`, `technicians.json`, `services.json`, `materials.json`, `leads.json`, `jobs.json`, `appointments.json`, `appointment-assignments.json`, `estimates.json`, `invoices.json`, `equipment.json`, `membership-types.json`, `invoice-templates.json`, `memberships.json`, `recurring-services.json` and `recurring-service-events.json`. These are the saved [ServiceTitan V2 resource responses](https://developer.servicetitan.io/api-details/). Save each job's notes as `job-notes-JOBID.json` and attachment descriptors as `job-attachments-JOBID.json`; notes without IDs use the parent and content hash for identity. Attachment descriptors name `fileName`; add that downloaded file with the same filename. Locations and equipment retain their source references and warranties. A membership stays one agreement, including an ongoing term and multiple locations; each exported recurring-service event keeps its due date, location and completed/closed state. Billing template totals and billing frequency are labelled as source terms, never as a new sale or charge authority. The included service SKU comes from the source recurring-service invoice template. Missing required templates, unknown statuses and unsupported amounts are explicit rejections.

### Balances, recurring work and undo

Set **Balances as of** to the source balance snapshot date (default: today's business-local date). Imported invoices are labelled **Imported** with their opening balance; they are not new sales, approved Glove invoices, charge permissions or accounting postings. Aging includes the remaining amount from that date onward and never substitutes the original invoice total for a partially paid balance. Approval, revision and export cannot turn this history into a new posting. When re-importing unchanged files, keep the same snapshot date. Payment allocation and processor migration remain the PAY and MOVE-006 clauses' work.

The import keeps existing exported visits and recurring-job references. ServiceTitan recurrence definitions are retained for review on the job; the import does not silently start a new rolling schedule or charge. Use the existing **Make this job repeat** action after reviewing the source schedule and current dispatch conflicts. Workiz's public v2 response does not provide a recurrence definition; only its already generated jobs/visits are available in those saved responses. Do not assume future occurrences have been migrated.

The same reviewed-fingerprint commit, source identity reuse, resumable journal and guarded undo apply to every source. An unchanged repeat writes no duplicate. Later native work prevents a destructive undo; an edited record is preserved. The installation archive retains all mapped records, source custody and original bytes, and undo still works after restore. The customer privacy door scopes source identities by provider and kind, so two providers' numeric customer ID `1` never becomes the same person.

The fixtures in `tests/fixtures/fieldpulse-movein`, `workiz-movein` and `servicetitan-movein` are synthetic documented-shape data, not real account exports or provider receipts. ServiceTitan field spellings were also checked against a public OpenAPI-generated client; no live ServiceTitan account has been reconciled. Check the preview against the source before committing a real move-in.
