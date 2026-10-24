# Synthetic Housecall Pro saved responses

Authored documented-shape data, never an account export or provider receipt.
Primary reference: https://docs.housecallpro.com/ . The public OpenAPI capture at
https://github.com/ToDucThanh/housecallpro-mcp/blob/main/housecall_v1.yaml
was read through the GitHub API, without cloning. Its Customer, Address, Employee,
Job, Schedule, Note, Attachment, Material, PricebookService, JobInvoice and
InvoiceItem, InvoiceDiscount and Lead models supply the field names. Monetary integers are cents; invoice
quantities are integer hundredths. Price-book identities use uuid.

Save per-job invoice responses with the job ID in the filename; the invoice
model has no job reference. The fixture has a partially paid invoice, two source
occurrences, both price-book kinds, a source admin without a Glove sign-in,
and owner-downloaded attachment bytes supplied by the shared fixture loader.
No service-plan schema was found in this public capture. Plans, estimates,
separate contacts and future-rule activation remain explicit gaps.

The provider service-plan reporting article at
https://help.housecallpro.com/en/articles/7068257-service-plan-reporting
documents aggregate metrics, not a per-customer export encoding with stable
plan identity and included service terms. A complete saved response or export
with field definitions is needed before a plan adapter can be implemented.

The lead fixture follows the documented Lead model, including customer and
address references, status, pipeline status and referral source. Its stage time
is unknown. The invoice includes a source discount and retains its partially
paid balance independently from its discounted total.
