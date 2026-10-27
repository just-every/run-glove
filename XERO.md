# Xero connection and local review

Glove currently supports an Owner's read-only Xero connection, bounded company
discovery and explicit local links to existing billing contacts, sales items and invoices.
The sales-invoice CSV remains available. Native accounting writes, payment
applications, refunds and bank reconciliation are not available yet.

Only a signed-in Owner without branch limits can use these commands. A custom
role, agent or integration token cannot use them. Credentials remain installation
secrets; exports and restored domain records never recreate provider access.

## Review existing records

1. Send xero.connect with the current business version, tenant and access token
   in a private command request. Never save the token in browser storage.
2. Send xero.discover with an existing customerId. Its immediate result.review
   contains whitelisted contacts, items, sales invoices and a linkReview. The
   response body is not retained as a saved command outcome. The customer selects
   the local review context; it does not limit the Owner's company-wide read.
3. Send xero.map with kind customer, service or invoice, the local id and current version,
   the selected existing remoteId and confirm true. Customer links use one active
   billing contact; properties remain separate Glove properties. A sales item
   must be sold, have an active income account, and use an active tax type that
   applies to revenue. Missing or duplicate remote links are refused. The command
   retains only the selected identity and mapping references, actor and time.
4. Discover again and inspect linkReview.links and linkReview.missing. After
   every current customer, sales item and invoice has a verified link, send
   xero.confirmLinks with the current business version, the displayed fingerprint
   and confirm true. The command reads the provider again; a changed local
   record, billing identity, account or tax mapping requires a fresh review.

Confirmation records local review only. It does not enable posting, create a
customer, approve an invoice or apply a payment. Existing USD invoice links must match their reviewed billing contact, original
number and original total, and retain their distinct Glove property. Changing a
customer mapping clears dependent invoice links. Confirmation does not authorize
a first post. Same-tenant credential replacement
retains connection-scoped links and clears the prior review. Another tenant,
disconnect or a restored installation needs a fresh connection and review.
Customer erasure removes the customer's and invoices' links and its personal saved outcomes.
Other staff cannot read the links through records, command responses, stale
record errors, Activity or business exports.

## Discovery boundaries

The [official contacts documentation](https://developer.xero.com/documentation/api/accounting/contacts)
and [invoice documentation](https://developer.xero.com/documentation/api/accounting/invoices)
define page and pageSize. Glove reads successive pages of 100, including the
terminal page when no pagination totals are supplied. Duplicate identities,
missing identities, inconsistent pagination totals, failed later pages and the
bounded page limit refuse the entire discovery. No partial review is returned.
The [items documentation](https://developer.xero.com/documentation/api/accounting/items)
defines a whole-list read, without paging parameters. Accounts and tax rates
also use their documented whole-list reads. Those reads are bounded separately.
The older xero.inspect command remains a small-list inspection door and refuses
a potentially truncated list rather than asserting completeness.

These are bounded reads, not a transactionally frozen Xero snapshot. Concurrent
provider changes can require repeating discovery. Provider transport is read
only, redirects are refused, and errors never trigger automatic writes or retries.

## Remaining connector work

LEDGER-002 still requires property-reference transport, relevant
accounting dimensions, complete first-post review, customer and item updates,
frozen invoice amounts and dates, payment and refund transport and readback,
durable replay and uncertain-write recovery, fees and deposits, and owner
screens. OAuth authorization and refresh and live connection acceptance remain
unproved.

The approved property representation retains one reviewed billing contact, one
invoice per Glove property, a supported property reference alongside the purchase
order, and one parent remittance with exact invoice allocations. The corresponding
Xero payment applications must represent one actual receipt and its bank
reconciliation without duplicate cash. That transport and the official provider
capability verification remain future work; local contact links do not prove it.
