# Synthetic Housecall Pro saved responses

Authored documented-shape data, never an account export or provider receipt.
Primary reference: https://docs.housecallpro.com/ . The public OpenAPI capture at
https://github.com/ToDucThanh/housecallpro-mcp/blob/main/housecall_v1.yaml
was read through the GitHub API, without cloning. Its Customer, Address, Employee,
Job, Schedule, Note, Attachment, Material, PricebookService, JobInvoice and
InvoiceItem models supply the field names. Monetary integers are cents; invoice
quantities are integer hundredths. Price-book identities use uuid.

Save per-job invoice responses with the job ID in the filename; the invoice
model has no job reference. The fixture has a partially paid invoice, two source
occurrences, both price-book kinds, a source admin without a Glove sign-in,
and owner-downloaded attachment bytes supplied by the shared fixture loader.
No service-plan schema was found in this public capture. Plans, estimates,
requests, separate contacts and future-rule activation remain explicit gaps.
