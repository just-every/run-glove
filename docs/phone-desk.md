# Phone desk and visit status texts

The desk uses the same commands on a phone and a computer. Owner and Office
can record checks and cash on an approved invoice. Owner and Office can also
explicitly charge a registered, authorized saved Stripe test card. The amount,
brand and last four digits appear before confirmation. Stripe's initial answer
never means paid: only its authenticated confirmation changes the balance.
An unresolved attempt blocks another charge, including after a lost response.

Under an invoice's **Manage saved-card authorization**, the unscoped owner
records an existing test customer and method reference from Stripe, plus the
customer's authorization source, wording and scope. The Stripe customer must
carry `glove_customer_id` metadata naming that Glove customer; Glove verifies
the attached method through Stripe. An authorization for autopay alone cannot
be used for a discretionary charge. Withdrawal applies to the next request.
No card number is entered into this slice. Keyed cards, live mode, bank methods,
other charge subjects and customer payment-link activation remain separate
contract gaps. Reconnecting Stripe invalidates the old connection's methods.

The public commands are:

- `payment.savedCardRegister`: owner only; current `customerId` and `version`,
  `stripeCustomerId`, `stripeMethodId`, `scope` (`business` or `autopay`),
  `source`, `wording`, and explicit `confirmed: true`.
- `payment.savedCardRevoke`: owner only; current `customerId` and `version`,
  `cardId` and `reason`.
- `payment.savedCardCharge`: signed-in Owner or Office; current `invoiceId`
  and `version`, `cardId`, `amount`, and explicit `confirmed: true`.

The owner enables incoming text retention under **Team → Text inbox**,
separately from enabling the registered business number. It starts off. Only a
unique customer with current visit-text consent has incoming text retained,
limited to 1,200 characters. Ambiguous shared numbers keep only the generic
received event and cannot be answered. Bodies are shown only to signed-in
Owner, Dispatcher and Office people; Activity contains metadata, never the
body. Turning retention off stops new bodies and replies; existing message
records remain until customer erasure.

In **Text inbox**, a desk person takes a conversation, explicitly links an
incoming text to that customer's job, and sends a typed or canned reply.
Current-number visit consent, STOP and customer-zone quiet hours are checked
again before the provider attempt. The displayed outcome distinguishes provider
acceptance from delivery. Customer and job Conversation show the same messages.

- `sms.inboxConfigure`: unscoped owner; current business `version`, `enabled`
  and explicit `approved: true` when enabling retention.
- `sms.assign`: native desk person; current `messageId` and `version`, with
  optional `release: true`; otherwise assigns the conversation to that person.
- `sms.thread`: native desk person; current `messageId` and `version`, plus
  `jobId` or null. A different customer's job is refused.
- `sms.reply`: native desk person; current `messageId` and `version`, and `text`.

Under **Team → Visit status texts**, the owner previews and explicitly approves
each template and notice setting. Both start off. The on-my-way template must
include `{{technician}}` and `{{eta}}`; business identity and STOP wording are
added. The technician must be assigned, clocked in, consented to location and
running this visit's travel timer. **On my way** is online only and uses a fresh
position and a Maps driving estimate. No route history or coordinates go to the
customer. Missing location or a refused route sends nothing.

An enabled completed-report setting issues the frozen report's seven-day link
only when consent, quiet hours and the configuring owner's current authority
permit it. Only the token hash is retained. The bearer is handed to the provider
in one attempt; it never appears in state, Activity or business export.
Completion still succeeds if its notice is suppressed. A replay never resends.

- `visitNotice.preview`: owner only; `templates` containing `onMyWay` and
  `reportReady` plain text. Nothing is enabled or sent.
- `visitNotice.configure`: unscoped owner; current business `version`, both
  templates, `onMyWay` and `reportReady` booleans, and `approved: true`.
- `visit.onMyWay`: assigned signed-in technician; current `visitId` and `version`.

These conservative authorization, retention, customer ETA and report-sharing
defaults await ct approval. FIELD-008, COMM-004, COMM-005 and PAY-009 remain
partial. Native apps, technician arbitrary texting, visit-specific delay replies,
technician photos, arrival notices and detected departure keep their named gaps.
