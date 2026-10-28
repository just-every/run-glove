# Xero connection and local review

Glove currently supports an Owner's read-only Xero connection, bounded company
discovery and explicit local links to existing billing contacts, sales items and sales invoices.
The sales-invoice CSV remains available. The default company policy permits no accounting writes or payment effects.
Conditional fake-tested sync is described below; refunds and full bank
reconciliation remain unavailable.

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
   checks that a sales invoice matches the linked billing contact, original
   number, approved USD total and authorized/paid state. Changing the billing
   contact invalidates dependent invoice links. The command retains only the selected identity and mapping references, actor and time.
4. Discover again and inspect linkReview.links and linkReview.missing. After
   every current customer, sales item and invoice has a verified link, send
   xero.confirmLinks with the current business version, the displayed fingerprint
   and confirm true. The command reads the provider again; a changed local
   record, billing identity, account or tax mapping requires a fresh review.

Confirmation records local review only. It does not enable posting, create a
customer, approve an invoice or apply a payment. It does not authorize a first post. Same-tenant credential replacement
retains connection-scoped links and clears the prior review. Another tenant,
disconnect or a restored installation needs a fresh connection and review.
Customer erasure removes the customer's link and its personal saved outcomes.
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

## Conditional company policy

Company action policy, 27 October 2026: Every Xero provider write, consequential link review, reconciliation and payment-readback effect carries the risk class provider-write through one installation-owned company policy hook. The company policy chooses allow, review, approve or block. An absent policy is not allowed; review and approve request a policy decision and execute no effect. Only allow permits the existing separately authorized command. There is no new product confirmation gate. Policy is scoped to the local business and connection, excluded from archives, and checked again immediately before provider writes. Audit records the class, action and decision. Default inspection and fingerprint-bound local link review retain their read-only authority; neither grants accounting or payment authority. The reviewed fake journeys explicitly install an allow policy for their own company. This is conditional local proof, not a change to the retained CT inspection ruling or live provider proof. LEDGER-002 stays PARTIAL.

The installation administrator supplies rows in glove_company_action_policy,
keyed by company_id, connection_id and risk_class. There is no product default
authorization and no policy is imported from an archive. The decision column
accepts allow, review, approve and block; only allow authorizes an attempt.
An absent or non-allow decision returns allowed false and the decision, records
an audit event, and leaves balances and provider records unchanged.

With an allow policy, xero.map also verifies existing invoice links and
xero.confirmLinks reviews preexisting customers, items and invoices.
xero.sync reserves one explicit existing contact or item update or one current
approved USD invoice post. xero.reconcile reads the exact reserved content
without another send. xero.pull selects existing authorized payment applications
by identity, reference and total cents, preserving the receipt calendar date,
property balances and frozen tax. No automatic send or retry is introduced.

Conditional company-policy evidence: tests/api/xero.test.mjs, “Xero company policy defaults to no effects and isolates allow, review, approve and block decisions”; tests/api/quickbooks.test.mjs, “Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts” and “Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations”; tests/browser/quickbooks.spec.ts, “Xero remittance shows each property invoice allocation and refuses unsupported refund controls”. Additional Xero tests retain concurrent reservation, authority withdrawal and in-flight erasure assertions. The conditional fake proves exact frozen cents, current approved drafts, receipt-date tax allocation, two-property readback and replay; it does not prove live accounting or bank settlement.

Current Gap: Accounting dimensions, complete company first-post review, outbound payment and refund sync, refund readback, Glove-origin payment echo handling, full monthly-date transport, posted corrections and interrupted-send recovery, fees and deposits, complete owner connection screens, OAuth refresh and live acceptance remain unproved. Official contact roll-up, property-reference and purchase-order coexistence, multi-invoice remittance and bank-reconciliation capabilities remain unverified. Default policy supplies no write or payment authority. Bounded reads do not prove a transactionally frozen snapshot. LEDGER-002 remains PARTIAL.


## Record a confirmed receipt

Under an installation company policy that allows provider writes, the signed-in
Owner can send xero.sync with kind payment, the confirmed payment id and current
version, and an explicit bankAccountId. This records money already received; it
never charges the customer. The existing USD payment account must be active and
must be a bank account or have payments enabled. The invoice must already be
reviewed in this Xero company, belong to the billing contact, and have sufficient
unpaid USD balance in Xero.

The present outbound door supports one positive invoice allocation without tips.
It refuses pending payments, imported Xero receipts, credits, refunds and grouped
allocations. Those cases retain their original contract obligations. The receipt
uses its original branch-local confirmation date, exact cents and reference. It
is created as unreconciled: posting it does not establish a bank match, a deposit
or a provider fee. The invoice's frozen tax, discounts and dates are unchanged.

Every send has a durable reservation and idempotency identity. An explicit retry
is possible after a definite provider refusal. Unknown or interrupted sends block
another send and block readback against that invoice until the Owner reconciles
the exact existing payment using xero.reconcile with the same payment, account
and returned remoteId. Reconciliation makes no provider write. An account later
being archived does not erase an earlier receipt or prevent its inspection.
Completed receipts cannot be sent again with another account or amount.

Reading a completed Glove-origin payment through xero.pull returns the existing
receipt without changing balances. Changed, deleted or mixed applications are
refused. Provider references follow the existing Owner-only custody and customer
erasure rules, including durable reservations and saved command results.

The [official Xero payment schema](https://developer.xero.com/documentation/api/accounting/payments)
defines invoice-linked payment creation, existing account references, receipt
dates, amounts and reconciliation state. The implementation uses the Payments
collection write and paged payment reads. This schema establishes the supported
transport shape; the network-edge journey is not a live accounting receipt.

Conditional receipt evidence: tests/api/xero.test.mjs, “Xero company policy defaults
to no effects and isolates allow, review, approve and block decisions” now also
runs a confirmed receipt through rejection, repair, replay, uncertain-response
reconciliation and echo readback. It checks the receivables balance, unchanged
invoice revisions, denied company policy, wrong account and customer refusals,
restricted staff reads, Activity, export and customer erasure. Grouped outbound
receipts, refund transport and readback, fees and deposits, OAuth refresh and
live account acceptance remain open. LEDGER-002 remains PARTIAL.
