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
