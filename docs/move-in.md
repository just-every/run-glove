Glove's first move-in kit brings customers, staff and job history from ServiceM8. Nothing is written until you commit a preview you have checked, and a move-in can be undone.

## What to bring

From your own ServiceM8 API access, save each list as a JSON file named for the object, exactly as the API returned it:

| File | Becomes in Glove |
| --- | --- |
| `company.json` | Customers; inactive clients are kept as archived |
| `companycontact.json` | Contacts of their customer |
| `staff.json` | Technicians, not yet linked to a sign-in |
| `job.json` | Jobs (open, completed or invoiced), quote drafts and declined quotes; each job address becomes a site |
| `jobmaterial.json` | Price lines of their job or quote |
| `jobactivity.json` | Visits of their job |
| `attachment.json` | Attachments listed on their job |

Add any attachment files you downloaded; their file names keep the attachment ID. A file you leave out contributes nothing. Together the files may be up to 1.4 MB per move-in, so split a large history into batches: customers and staff first, then jobs by year.

## Preview

Under **More → Move in**, choose the files under **Export files**, name the move-in if you like and choose **Preview**. The preview shows, for each ServiceM8 list, how many records become Glove records, are merged or are rejected (with the file and item number), which attachment files are missing, the ServiceM8 fields Glove does not use, and how many records an earlier move-in already brought in.

Compare the counts with ServiceM8 before you commit.

## Commit exactly this preview

**Commit exactly this preview** applies the plan you reviewed and nothing else. If Glove's records changed so the plan would now differ, it refuses and asks you to preview again. Every record keeps its ServiceM8 ID, and moved-in records are marked as such. Moving in the same unchanged records again writes nothing.

Moved-in visits carry no arrival or sign-off unless ServiceM8 had them.

## Undo

Give a reason and choose **Undo move-in** to remove exactly what that move-in wrote. Undo refuses while later Glove work refers to a moved-in record (a quote, job, visit or assignment), and stops at any moved-in record edited in Glove since, keeping the edit.

A large move-in is undone in passes. If the first pass stops part-way, the move-in shows **Undo part-way**: until you choose **Finish the undo**, its remaining records cannot be edited or used in new work.

## Limits

The kit is proven against an authored set of files with ServiceM8's documented field names, not yet against a real account's export. Check the preview carefully on your first move-in.

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
