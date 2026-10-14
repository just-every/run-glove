**Invoices** is where the office prepares invoices and exports them to the business's own accounting system. Glove prepares invoices; it does not take payments.

## Prepare an invoice

Completed jobs wait under **Completed jobs to invoice**. **Prepare invoice** starts a draft from the job's accepted lines plus the materials recorded on site, priced from your price book. If the technician recorded a material that is not in the price book, Glove asks you to price it first (**Prepare invoice with these lines**).

You can revise a draft's lines with a reason before it is approved.

## Approve and export

A person approves one exact revision. An agent can prepare or revise a draft but never approve it, even if its sign-in is later given another role.

**Export N approved** writes every approved invoice once into a CSV in Xero's sales-invoice import columns, with account 200 and the tax types "GST on Income" and "GST Free Income". Invoice numbers run `INV-0001`, `INV-0002`…, and payment is due after your payment terms (14 days unless you change it). **Download CSV** keeps every export available. Check the file against your own accounting settings before importing it.

## Correct an exported invoice

An exported invoice is never changed. **Record a correction** makes a new revision that names the revision and export it corrects. Once approved it exports as its own row with a new number, for example `INV-0001-R2`, and the original number is never exported again. The correction trail on the invoice shows every revision.
