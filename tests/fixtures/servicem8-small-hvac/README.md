# ServiceM8 move-in fixture: small HVAC business

Authored test input in the shape of ServiceM8's REST API list responses
(field names from developer.servicem8.com: Company, CompanyContact, Staff,
Job, JobActivity, JobMaterial, Attachment). It is not a real owner export and
does not verify one.

Cases it carries on purpose:

- a completed and invoiced job with materials, a scheduled activity and two
  attachments, one with its file (`attachment-<uuid>.jpg`) and one without;
- an open work order at the same address (one site, two jobs);
- a quote with a price line (becomes a Glove quote draft, not a job);
- an archived client (imported as archived, history kept);
- a job whose client is not in `company.json` (rejected and reported);
- fields Glove does not use (`website`, `lat`, `travel_time_in_seconds`, ...)
  reported as unmapped.
