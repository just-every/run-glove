# Synthetic Jobber saved responses

Authored data, never an owner export or a live provider receipt. Object fields
follow [Jobber's public object reference](https://developer.getjobber.com/docs/):
Client, Property, User, Request, Job and Visit. Connections use nodes and
pageInfo; files are named for the root query selection. Retain every saved page.
Products use the documented CSV columns in
[Products & Services List](https://help.getjobber.com/en/articles/products-services-list/).
The CSV has no provider item ID: its exact Name is the source identity, and a
later changed definition is refused by the journal rather than overwriting work.

Two scheduled visits of one recurring job retain their exact instants and one
completed state. A third visit has no date and stays explicitly unscheduled on the job without reserving capacity. Source schedule fields are retained; the synthetic rule value claims no provider cadence encoding. Invoice lines retain exact quantities, prices, source IDs and tax flags; their amounts reconcile with the report. One balance links two jobs, including closed source work. A priced quote retains a document discount and terms as read-only source history, and a job-owned note retains its source timestamp. Client contact channels retain their source references. A downloaded job attachment is checked against its descriptor and retained byte for byte; omission is disclosed. Client, request, quote and invoice notes stay on their own imported records, with original timestamps. Linked upstream notes and attachment descriptors repeat in downstream responses to prove they are deduplicated against the explicitly exported owner, rather than copied into field evidence. The MOVE-001 journeys supply client-attachment.txt as downloaded bytes for the private client attachment; quote and invoice files are deliberately absent and disclosed. No future rule, separate contact-person record or optional quote line mapping is claimed by this slice. Original received files remain in the journal.

Invoice balances use the documented Invoices Report columns, joined to the
exact unique invoice number and consistent issue and due dates. A partially
paid $216.50 invoice retains its $76.50 remaining balance as opening history.

Line and amount field spellings were cross-checked against the public saved
[Jobber introspection result](https://github.com/max-is-loud/jobber-servicetitan-migration/blob/master/introspection_results.json).
The [saved object reference](https://github.com/max-is-loud/jobber-servicetitan-migration/blob/master/docs/jobber-graphql-schema-reference.md)
records the job-note union and JobNote message and time selection. The
[provider object reference](https://developer.getjobber.com/docs/) remains the
source for the parent relationships and complete connections. These are schema
references, not live-provider proof.

Job attachment field selections follow the public [saved provider query](https://github.com/max-is-loud/jobber-servicetitan-migration/blob/master/src/clients/jobber_client.py). Downloaded bytes are synthetic.

Source schedule field selections follow the public [connector query](https://github.com/amp-labs/connectors/blob/main/providers/jobber/graphql/query_job.graphql); no interpretation of calendarRule is asserted.

Non-job note parents follow the [provider object reference](https://developer.getjobber.com/docs/). Their linked-note ownership follows [Notes and Attachments](https://help.getjobber.com/en/articles/notes-and-attachments/); note type membership follows the saved introspection already linked above. The saved note and file selections are required explicitly; the adapter does not invent parent fields for inherited notes.
