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
