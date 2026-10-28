Old reference: `bdf030cca561a4d9e0c78ded585b71768a538a41`.

| Clause | Point | Outcome | Asserting test | Result |
| --- | --- | --- | --- | --- |
| GLOVE-01 | 1.1 — The business name, tax identifier, booking zone and payment terms survive reload. | The business name | none | none |
| GLOVE-01 | 1.2 — The business name, tax identifier, booking zone and payment terms survive reload. | tax identifier | none | none |
| GLOVE-01 | 1.3 — The business name, tax identifier, booking zone and payment terms survive reload. | booking zone and payment terms survive reload. | none | none |
| GLOVE-01 | 2.1 — Services keep before-tax prices and required or optional checklist items; technicians reta. | Services keep before-tax prices and required or optional checklist items | `tests/api/flows.test.mjs:77` | asserted |
| GLOVE-01 | 2.2 — Services keep before-tax prices and required or optional checklist items; technicians reta. | technicians retain their linked sign-in. | none | none |
| GLOVE-01 | 3.1 — An invited person has the role the owner assigned. | An invited person has the role the owner assigned. | none | none |
| GLOVE-02 | 1.1 — A customer retains contact, email and billing address, with several sites and their access. | A customer retains contact | none | none |
| GLOVE-02 | 1.2 — A customer retains contact, email and billing address, with several sites and their access. | email and billing address | none | none |
| GLOVE-02 | 1.3 — A customer retains contact, email and billing address, with several sites and their access. | with several sites | `tests/api/flows.test.mjs:41` | asserted |
| GLOVE-02 | 1.4 — A customer retains contact, email and billing address, with several sites and their access. | their access notes. | none | none |
| GLOVE-02 | 2.1 — A stale edit cannot replace a newer version. | A stale edit cannot replace a newer version. | none | none |
| GLOVE-03 | 1.1 — A request produces priced lines from the price book or custom work, with exact tax. | A request produces priced lines from the price book or custom work | none | none |
| GLOVE-03 | 1.2 — A request produces priced lines from the price book or custom work, with exact tax. | with exact tax. | `tests/api/flows.test.mjs:52` | asserted |
| GLOVE-03 | 2.1 — The approved price belongs to one exact revision; a price edit requires a new approval and. | The approved price belongs to one exact revision | none | none |
| GLOVE-03 | 2.2 — The approved price belongs to one exact revision; a price edit requires a new approval and. | a price edit requires a new approval | `tests/api/flows.test.mjs:55` | asserted |
| GLOVE-03 | 2.3 — The approved price belongs to one exact revision; a price edit requires a new approval and. | keeps the earlier revision and decision. | `tests/api/flows.test.mjs:60` | asserted |
| GLOVE-04 | 1.1 — The recorded send retains its method and recorder without claiming delivery. | The recorded send retains its method and recorder without claiming delivery. | none | none |
| GLOVE-04 | 2.1 — The customer answer retains the current revision, claimed customer, answer method and actu. | The customer answer retains the current revision | none | none |
| GLOVE-04 | 2.2 — The customer answer retains the current revision, claimed customer, answer method and actu. | claimed customer | none | none |
| GLOVE-04 | 2.3 — The customer answer retains the current revision, claimed customer, answer method and actu. | answer method and actual recorder. | `tests/api/flows.test.mjs:71` | asserted |
| GLOVE-04 | 3.1 — An accepted revision is frozen and cannot be decided again. | An accepted revision is frozen and cannot be decided again. | none | none |
| GLOVE-05 | 1.1 — An accepted quote creates one job with exactly its accepted lines and service checklist. | An accepted quote creates one job with exactly its accepted lines and service checklist. | none | none |
| GLOVE-05 | 2.1 — A technician booking retains the chosen local date and time in the business zone. | A technician booking retains the chosen local date and time in the business zone. | `tests/api/flows.test.mjs:81` | asserted |
| GLOVE-05 | 3.1 — An overlap is refused until the dispatcher confirms the exact conflicts reviewed. | An overlap is refused until the dispatcher confirms the exact conflicts reviewed. | `tests/api/flows.test.mjs:85`; `tests/api/flows.test.mjs:87` | asserted |
| GLOVE-06 | 1.1 — The assigned technician captures arrival, checklist results, notes, photos and materials w. | The assigned technician captures arrival | `tests/api/flows.test.mjs:148` | asserted |
| GLOVE-06 | 1.2 — The assigned technician captures arrival, checklist results, notes, photos and materials w. | checklist results | none | none |
| GLOVE-06 | 1.3 — The assigned technician captures arrival, checklist results, notes, photos and materials w. | notes | none | none |
| GLOVE-06 | 1.4 — The assigned technician captures arrival, checklist results, notes, photos and materials w. | photos and materials with their capture times. | none | none |
| GLOVE-06 | 2.1 — A resend after a lost response returns the recorded outcome and produces one copy of each. | A resend after a lost response returns the recorded outcome and produces one copy of each capture. | `tests/api/flows.test.mjs:109`; `tests/api/flows.test.mjs:111` | asserted |
| GLOVE-06 | 3.1 — Original photo bytes remain readable by the assigned technician and unavailable to an unre. | Original photo bytes remain readable by the assigned technician and unavailable to an unrelated technician. | `tests/api/flows.test.mjs:116`; `tests/api/flows.test.mjs:117` | asserted |
| GLOVE-07 | 1.1 — A move retains technician, date, time, reason and before/after assignment history. | A move retains technician | `tests/api/flows.test.mjs:128` | asserted |
| GLOVE-07 | 1.2 — A move retains technician, date, time, reason and before/after assignment history. | date | none | none |
| GLOVE-07 | 1.3 — A move retains technician, date, time, reason and before/after assignment history. | time | none | none |
| GLOVE-07 | 1.4 — A move retains technician, date, time, reason and before/after assignment history. | reason and before/after assignment history. | none | none |
| GLOVE-07 | 2.1 — A stale move is refused; overlapping work or existing field evidence requires review of th. | A stale move is refused | none | none |
| GLOVE-07 | 2.2 — A stale move is refused; overlapping work or existing field evidence requires review of th. | overlapping work or existing field evidence requires review of the exact conflicts. | `tests/api/flows.test.mjs:126` | asserted |
| GLOVE-07 | 3.1 — Evidence arriving after reassignment is retained and flagged for review; a new assignee re. | Evidence arriving after reassignment is retained and flagged for review | `tests/api/flows.test.mjs:134`; `tests/api/flows.test.mjs:135` | asserted |
| GLOVE-07 | 3.2 — Evidence arriving after reassignment is retained and flagged for review; a new assignee re. | a new assignee records a new arrival without replacing the earlier one. | `tests/api/flows.test.mjs:148` | asserted |
| GLOVE-08 | 1.1 — Completion refuses a missing arrival or an unanswered required checklist item. | Completion refuses a missing arrival or an unanswered required checklist item. | none | none |
| GLOVE-08 | 2.1 — A completed job retains its work summary and the customer name and drawn signature, or the. | A completed job retains its work summary | none | none |
| GLOVE-08 | 2.2 — A completed job retains its work summary and the customer name and drawn signature, or the. | the customer name and drawn signature | `tests/api/flows.test.mjs:156`; `tests/api/flows.test.mjs:158` | asserted |
| GLOVE-08 | 2.3 — A completed job retains its work summary and the customer name and drawn signature, or the. | or the recorded reason for a missing signature. | none | none |
| GLOVE-09 | 1.1 — The draft includes accepted lines, priced materials and explicitly priced unpriced materia. | The draft includes accepted lines | `tests/api/flows.test.mjs:164` | asserted |
| GLOVE-09 | 1.2 — The draft includes accepted lines, priced materials and explicitly priced unpriced materia. | priced materials and explicitly priced unpriced materials. | none | none |
| GLOVE-09 | 2.1 — The office approves one exact revision and exports each approved revision once in the acco. | The office approves one exact revision | none | none |
| GLOVE-09 | 2.2 — The office approves one exact revision and exports each approved revision once in the acco. | exports each approved revision once in the accounting import format. | `tests/api/flows.test.mjs:170`; `tests/api/flows.test.mjs:175`; `tests/api/flows.test.mjs:185` | asserted |
| GLOVE-09 | 3.1 — A correction retains the earlier export and revision, receives its own approval and export. | A correction retains the earlier export and revision | `tests/api/flows.test.mjs:180`; `tests/api/flows.test.mjs:187` | asserted |
| GLOVE-09 | 3.2 — A correction retains the earlier export and revision, receives its own approval and export. | receives its own approval | none | none |
| GLOVE-09 | 3.3 — A correction retains the earlier export and revision, receives its own approval and export. | exports as its own numbered row | `tests/api/flows.test.mjs:183` | asserted |
| GLOVE-09 | 3.4 — A correction retains the earlier export and revision, receives its own approval and export. | including when revised before approval. | none | none |
| GLOVE-09 | 4.1 — Fixed-monthly invoices retain the issue, approval and due-date basis governed by PLAN-013. | Fixed-monthly invoices retain the issue | none | none |
| GLOVE-09 | 4.2 — Fixed-monthly invoices retain the issue, approval and due-date basis governed by PLAN-013. | approval and due-date basis governed by PLAN-013. | none | none |
| GLOVE-10 | 1.1 — Under the held company policy, the agent prepares quotes, dispatch and invoices; the perso. | Under the held company policy | none | none |
| GLOVE-10 | 1.2 — Under the held company policy, the agent prepares quotes, dispatch and invoices; the perso. | the agent prepares quotes | `tests/api/flows.test.mjs:192` | asserted |
| GLOVE-10 | 1.3 — Under the held company policy, the agent prepares quotes, dispatch and invoices; the perso. | dispatch and invoices | none | none |
| GLOVE-10 | 1.4 — Under the held company policy, the agent prepares quotes, dispatch and invoices; the perso. | the person the policy names decides the saved revision | none | none |
| GLOVE-10 | 1.5 — Under the held company policy, the agent prepares quotes, dispatch and invoices; the perso. | the record distinguishes preparation from decision. | none | none |
| GLOVE-11 | 1.1 — The preview identifies each source record’s destination, merge, rejection with location an. | The preview identifies each source record’s destination | none | none |
| GLOVE-11 | 1.2 — The preview identifies each source record’s destination, merge, rejection with location an. | merge | none | none |
| GLOVE-11 | 1.3 — The preview identifies each source record’s destination, merge, rejection with location an. | rejection with location and reason | none | none |
| GLOVE-11 | 1.4 — The preview identifies each source record’s destination, merge, rejection with location an. | unused record and missing attachment. | none | none |
| GLOVE-11 | 2.1 — Commit applies the reviewed preview with source identifiers and exact received files. | Commit applies the reviewed preview with source identifiers and exact received files. | none | none |
| GLOVE-11 | 3.1 — An unchanged repeat writes nothing; undo removes exactly the imported effects and refuses. | An unchanged repeat writes nothing | none | none |
| GLOVE-11 | 3.2 — An unchanged repeat writes nothing; undo removes exactly the imported effects and refuses. | undo removes exactly the imported effects | none | none |
| GLOVE-11 | 3.3 — An unchanged repeat writes nothing; undo removes exactly the imported effects and refuses. | refuses changed records or later dependent work. | none | none |
| GLOVE-12 | 1.1 — The job timeline retains every step, actual person, role and command, including after hund. | The job timeline retains every step | `tests/api/flows.test.mjs:249` | asserted |
| GLOVE-12 | 1.2 — The job timeline retains every step, actual person, role and command, including after hund. | actual person | `tests/api/flows.test.mjs:250` | asserted |
| GLOVE-12 | 1.3 — The job timeline retains every step, actual person, role and command, including after hund. | role and command | `tests/api/flows.test.mjs:250` | asserted |
| GLOVE-12 | 1.4 — The job timeline retains every step, actual person, role and command, including after hund. | including after hundreds of later events. | none | none |
| GLOVE-12 | 2.1 — The business download includes that timeline. | The business download includes that timeline. | `tests/api/flows.test.mjs:253` | asserted |
| GLOVE-12 | 3.1 — Restoring the installation preserves the service records, captures, signatures, command ou. | Restoring the installation preserves the service records | `tests/portable.mjs:226` | asserted |
| GLOVE-12 | 3.2 — Restoring the installation preserves the service records, captures, signatures, command ou. | captures | `tests/portable.mjs:226` | asserted |
| GLOVE-12 | 3.3 — Restoring the installation preserves the service records, captures, signatures, command ou. | signatures | `tests/portable.mjs:244` | asserted |
| GLOVE-12 | 3.4 — Restoring the installation preserves the service records, captures, signatures, command ou. | command outcomes | none | none |
| GLOVE-12 | 3.5 — Restoring the installation preserves the service records, captures, signatures, command ou. | move-in journal and original bytes | none | none |
| GLOVE-12 | 3.6 — Restoring the installation preserves the service records, captures, signatures, command ou. | the service journey works there. | none | none |
| GLOVE-12 | 4.1 — A session from the old installation cannot open the restored one. | A session from the old installation cannot open the restored one. | `tests/portable.mjs:214` | asserted |
| HTTP-001 | 1.1 — Health, product API and document requests reach their declared handlers; an unknown route. | Health | `tests/runtime.mjs:29` | asserted |
| HTTP-001 | 1.2 — Health, product API and document requests reach their declared handlers; an unknown route. | product API and document requests reach their declared handlers | none | none |
| HTTP-001 | 1.3 — Health, product API and document requests reach their declared handlers; an unknown route. | an unknown route returns a missing-page response. | `tests/runtime.mjs:37` | asserted |
| MONEY-001 | 1.1 — A fixture sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites i. | A fixture sets two jurisdictions | none | none |
| MONEY-001 | 1.2 — A fixture sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites i. | a labor-exempt rule | none | none |
| MONEY-001 | 1.3 — A fixture sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites i. | quotes the same lines at sites in each and for an exempt customer | `tests/api/money.test.mjs:50` | asserted |
| MONEY-001 | 1.4 — A fixture sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites i. | checks exact cents | `tests/api/money.test.mjs:50` | asserted |
| MONEY-001 | 1.5 — A fixture sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites i. | the per-jurisdiction breakdown on the quote | `tests/api/money.test.mjs:50` | asserted |
| MONEY-001 | 1.6 — A fixture sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites i. | invoice | `tests/api/money.test.mjs:69` | asserted |
| MONEY-001 | 1.7 — A fixture sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites i. | export and explicitly mapped downloadable QuickBooks Online inspection payload (no sync) | `tests/api/money.test.mjs:131`; `tests/api/money.test.mjs:77` | asserted |
| MONEY-001 | 1.11 — A fixture sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites i. | LEDGER-007 and LEDGER-004 carry the actual transport and provider-fake assertion | none | none |
| MONEY-001 | 1.12 — A fixture sets two jurisdictions and a labor-exempt rule, quotes the same lines at sites i. | the REPORT-002, REPORT-004 sales-tax report matches the invoices' tax by jurisdiction to the cent. | `tests/api/money.test.mjs:138` | asserted |
| MONEY-001 | 2.1 — The scenario sets different branch tax jurisdictions, checks each branch’s quote/invoice/e. | The scenario sets different branch tax jurisdictions | none | none |
| MONEY-001 | 2.2 — The scenario sets different branch tax jurisdictions, checks each branch’s quote/invoice/e. | checks each branch’s quote/invoice/export/provider tax | `tests/api/money.test.mjs:69`; `tests/api/money.test.mjs:131`; `tests/api/money.test.mjs:77` | asserted |
| MONEY-001 | 2.3 — The scenario sets different branch tax jurisdictions, checks each branch’s quote/invoice/e. | narrows the REPORT-002 | none | none |
| MONEY-001 | 2.4 — The scenario sets different branch tax jurisdictions, checks each branch’s quote/invoice/e. | REPORT-004 tax rows to one branch. | `tests/api/money.test.mjs:141` | asserted |
| MONEY-001 | 3.1 — New installations default to USD and unsaved booking zones to America/Chicago; an existing. | New installations default to USD and unsaved booking zones to America/Chicago | `tests/api/money.test.mjs:13`; `tests/browser/money.spec.ts:70` | asserted |
| MONEY-001 | 3.2 — New installations default to USD and unsaved booking zones to America/Chicago; an existing. | an existing business retains its saved currency | none | none |
| MONEY-001 | 3.3 — New installations default to USD and unsaved booking zones to America/Chicago; an existing. | tax and time zone. | none | none |
| MONEY-001 | 4.1 — A jurisdiction is the owner's named combined rate, decimal percent to four places, with ZI. | A jurisdiction is the owner's named combined rate | none | none |
| MONEY-001 | 4.2 — A jurisdiction is the owner's named combined rate, decimal percent to four places, with ZI. | decimal percent to four places | none | none |
| MONEY-001 | 4.3 — A jurisdiction is the owner's named combined rate, decimal percent to four places, with ZI. | with ZIP matches | `tests/browser/money.spec.ts:83` | asserted |
| MONEY-001 | 4.4 — A jurisdiction is the owner's named combined rate, decimal percent to four places, with ZI. | an optional default. | none | none |
| MONEY-001 | 5.1 — A site can choose explicitly; overlapping ZIP matches require that choice, and an unmatche. | A site can choose explicitly | none | none |
| MONEY-001 | 5.2 — A site can choose explicitly; overlapping ZIP matches require that choice, and an unmatche. | overlapping ZIP matches require that choice | none | none |
| MONEY-001 | 5.3 — A site can choose explicitly; overlapping ZIP matches require that choice, and an unmatche. | an unmatched configured address without a default is refused. | none | none |
| MONEY-001 | 6.1 — Branch settings override business settings. | Branch settings override business settings. | none | none |
| MONEY-001 | 7.1 — FREE items are not taxed; TAXABLE items (and legacy GST codes) follow the jurisdiction, wh. | FREE items are not taxed | none | none |
| MONEY-001 | 7.2 — FREE items are not taxed; TAXABLE items (and legacy GST codes) follow the jurisdiction, wh. | TAXABLE items (and legacy GST codes) follow the jurisdiction | none | none |
| MONEY-001 | 7.3 — FREE items are not taxed; TAXABLE items (and legacy GST codes) follow the jurisdiction, wh. | whose service-labor switch applies to service items. | none | none |
| MONEY-001 | 8.1 — Quantities are thousandths, line multiplication and tax use integer arithmetic, rounding h. | Quantities are thousandths | none | none |
| MONEY-001 | 8.2 — Quantities are thousandths, line multiplication and tax use integer arithmetic, rounding h. | line multiplication and tax use integer arithmetic | none | none |
| MONEY-001 | 8.3 — Quantities are thousandths, line multiplication and tax use integer arithmetic, rounding h. | rounding half up per line and once on the document's combined taxable cents. | none | none |
| MONEY-004 | 1.1 — The revision freezes currency, jurisdiction, rate, labor classification and exemption evid. | The revision freezes currency | none | none |
| MONEY-004 | 1.2 — The revision freezes currency, jurisdiction, rate, labor classification and exemption evid. | jurisdiction | none | none |
| MONEY-004 | 1.3 — The revision freezes currency, jurisdiction, rate, labor classification and exemption evid. | rate | none | none |
| MONEY-004 | 1.4 — The revision freezes currency, jurisdiction, rate, labor classification and exemption evid. | labor classification and exemption evidence | none | none |
| MONEY-004 | 1.5 — The revision freezes currency, jurisdiction, rate, labor classification and exemption evid. | accepting options/add-ons and preparing/correcting the invoice retains that snapshot. | `tests/api/money.test.mjs:62`; `tests/api/money.test.mjs:64`; `tests/api/money.test.mjs:69` | asserted |
| MONEY-004 | 2.1 — Certificate evidence is private to the customer's full desk readers, including branch limi. | Certificate evidence is private to the customer's full desk readers | `tests/api/money.test.mjs:86`; `tests/api/money.test.mjs:89` | asserted |
| MONEY-004 | 2.2 — Certificate evidence is private to the customer's full desk readers, including branch limi. | including branch limits | `tests/api/money.test.mjs:86`; `tests/api/money.test.mjs:89` | asserted |
| MONEY-004 | 2.3 — Certificate evidence is private to the customer's full desk readers, including branch limi. | stored in original chunks | `tests/portable.mjs:256` | asserted |
| MONEY-004 | 2.4 — Certificate evidence is private to the customer's full desk readers, including branch limi. | archived with the customer | none | none |
| MONEY-004 | 2.5 — Certificate evidence is private to the customer's full desk readers, including branch limi. | retained when replaced | none | none |
| MONEY-004 | 2.6 — Certificate evidence is private to the customer's full desk readers, including branch limi. | exemption expiry is inclusive in the branch's local date. | none | none |
| MONEY-004 | 3.1 — Any physical customer removal deletes its originals and chunks; DATA-001, DATA-005, DATA-0. | Any physical customer removal deletes its originals and chunks | none | none |
| MONEY-004 | 3.6 — Any physical customer removal deletes its originals and chunks; DATA-001, DATA-005, DATA-0. | DATA-008 carries the customer erasure door | none | none |
| MONEY-004 | 3.7 — Any physical customer removal deletes its originals and chunks; DATA-001, DATA-005, DATA-0. | restore-fence assertion before shipping. | none | none |
| MONEY-004 | 4.1 — US exports keep approved jurisdiction, rate, taxable basis, tax and total; legacy AUD expo. | US exports keep approved jurisdiction | `tests/api/money.test.mjs:131` | asserted |
| MONEY-004 | 4.2 — US exports keep approved jurisdiction, rate, taxable basis, tax and total; legacy AUD expo. | rate | `tests/api/money.test.mjs:131` | asserted |
| MONEY-004 | 4.3 — US exports keep approved jurisdiction, rate, taxable basis, tax and total; legacy AUD expo. | taxable basis | `tests/api/money.test.mjs:131` | asserted |
| MONEY-004 | 4.4 — US exports keep approved jurisdiction, rate, taxable basis, tax and total; legacy AUD expo. | tax and total | `tests/api/money.test.mjs:131` | asserted |
| MONEY-004 | 4.5 — US exports keep approved jurisdiction, rate, taxable basis, tax and total; legacy AUD expo. | legacy AUD exports retain Xero columns. | none | none |
| MONEY-004 | 5.1 — Tax reports use each invoice's first approval local date (inclusive period bounds), groupi. | Tax reports use each invoice's first approval local date (inclusive period bounds) | none | none |
| MONEY-004 | 5.2 — Tax reports use each invoice's first approval local date (inclusive period bounds), groupi. | grouping the latest approved tax snapshot by branch and jurisdiction. | none | none |
| MONEY-004 | 6.1 — Before payments ship, the report honestly says tax on approved invoices; PAY-002, PAY-017. | Before payments ship | none | none |
| MONEY-004 | 6.2 — Before payments ship, the report honestly says tax on approved invoices; PAY-002, PAY-017. | the report honestly says tax on approved invoices | none | none |
| MONEY-004 | 6.7 — Before payments ship, the report honestly says tax on approved invoices; PAY-002, PAY-017. | PAY-020 carries collected tax. | none | none |
| MONEY-004 | 7.1 — The mapped QuickBooks JSON is an inspection document only; LEDGER-001, LEDGER-005, LEDGER-. | The mapped QuickBooks JSON is an inspection document only | none | none |
| MONEY-004 | 7.5 — The mapped QuickBooks JSON is an inspection document only; LEDGER-001, LEDGER-005, LEDGER-. | LEDGER-007/004 carry live posting | none | none |
| MONEY-004 | 7.6 — The mapped QuickBooks JSON is an inspection document only; LEDGER-001, LEDGER-005, LEDGER-. | matching and provider assertions. | none | none |
| MONEY-005 | 1.1 — The optional Avalara AvaTax and Stripe Tax lookups (provider fakes at their network edges). | The optional Avalara AvaTax and Stripe Tax lookups (provider fakes at their network edges) each return an owner-applied proposal | `tests/api/money.test.mjs:169` | asserted |
| MONEY-005 | 1.2 — The optional Avalara AvaTax and Stripe Tax lookups (provider fakes at their network edges). | an unregistered or rateless answer reads "rate unavailable" | `tests/api/money.test.mjs:196` | asserted |
| MONEY-005 | 1.3 — The optional Avalara AvaTax and Stripe Tax lookups (provider fakes at their network edges). | never 0%. | `tests/api/money.test.mjs:197` | asserted |
| MONEY-005 | 2.1 — Stripe lookup sends only service address and two fixed sample classifications, never ident. | Stripe lookup sends only service address and two fixed sample classifications | none | none |
| MONEY-005 | 2.2 — Stripe lookup sends only service address and two fixed sample classifications, never ident. | never identity or certificates | `tests/api/money.test.mjs:107` | asserted |
| MONEY-005 | 2.3 — Stripe lookup sends only service address and two fixed sample classifications, never ident. | the owner selects the service classification | none | none |
| MONEY-005 | 2.4 — Stripe lookup sends only service address and two fixed sample classifications, never ident. | reviews the response and applies settings. | none | none |
| MONEY-005 | 3.1 — Unsupported, partial or unregistered treatment is unavailable for automatic application, n. | Unsupported | none | none |
| MONEY-005 | 3.2 — Unsupported, partial or unregistered treatment is unavailable for automatic application, n. | partial or unregistered treatment is unavailable for automatic application | none | none |
| MONEY-005 | 3.3 — Unsupported, partial or unregistered treatment is unavailable for automatic application, n. | never inferred as zero tax or exemption. | none | none |
| MONEY-005 | 4.1 — Every new lookup/certificate event appears in Activity and business export without credent. | Every new lookup/certificate event appears in Activity and business export without credentials. | `tests/api/money.test.mjs:113`; `tests/api/money.test.mjs:116` | asserted |
| MONEY-005 | 5.1 — The Avalara AvaTax lookup follows the same rules as Stripe : the owner alone connects it. | The Avalara AvaTax lookup follows the same rules as Stripe : the owner alone connects it | none | none |
| MONEY-005 | 5.2 — The Avalara AvaTax lookup follows the same rules as Stripe : the owner alone connects it. | the account ID | none | none |
| MONEY-005 | 5.3 — The Avalara AvaTax lookup follows the same rules as Stripe : the owner alone connects it. | license key | none | none |
| MONEY-005 | 5.4 — The Avalara AvaTax lookup follows the same rules as Stripe : the owner alone connects it. | company code and production/sandbox choice are one sealed secret excluded from state | none | none |
| MONEY-005 | 5.5 — The Avalara AvaTax lookup follows the same rules as Stripe : the owner alone connects it. | archives | none | none |
| MONEY-005 | 5.6 — The Avalara AvaTax lookup follows the same rules as Stripe : the owner alone connects it. | export. | none | none |
| MONEY-005 | 6.1 — A lookup creates one uncommitted AvaTax SalesOrder (never recorded in AvaTax) at the servi. | A lookup creates one uncommitted AvaTax SalesOrder (never recorded in AvaTax) at the service address with the fixed customer code glove-address-rate-lookup and two $100 sample lines: the provider’s parts classification for general tangible goods | `tests/api/money.test.mjs:175`; `tests/api/money.test.mjs:177` | asserted |
| MONEY-005 | 6.2 — A lookup creates one uncommitted AvaTax SalesOrder (never recorded in AvaTax) at the servi. | the AvaTax tax code the owner enters for the service. | none | none |
| MONEY-005 | 7.1 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | It is a proposal only when every parts jurisdiction is fully taxable | none | none |
| MONEY-005 | 7.2 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | their rates | none | none |
| MONEY-005 | 7.3 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | summed in millionths | none | none |
| MONEY-005 | 7.4 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | shown as a percent to four places | none | none |
| MONEY-005 | 7.5 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | exceed zero | `tests/api/money.test.mjs:197` | asserted |
| MONEY-005 | 7.6 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | the service is either fully taxable at that same combined rate (labor taxed) or wholly non-taxable (labor exempt) | `tests/api/money.test.mjs:182` | asserted |
| MONEY-005 | 7.7 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | no nexus | none | none |
| MONEY-005 | 7.8 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | zero | none | none |
| MONEY-005 | 7.9 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | mixed | `tests/api/money.test.mjs:196` | asserted |
| MONEY-005 | 7.10 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | partial | `tests/api/money.test.mjs:196` | asserted |
| MONEY-005 | 7.11 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | exempt or refused answers read "rate unavailable" | `tests/api/money.test.mjs:196` | asserted |
| MONEY-005 | 7.12 — It is a proposal only when every parts jurisdiction is fully taxable and their rates, summ. | never 0%. | `tests/api/money.test.mjs:197` | asserted |
| MONEY-005 | 8.1 — The owner applies a proposal through the ordinary jurisdiction settings. | The owner applies a proposal through the ordinary jurisdiction settings. | `tests/api/money.test.mjs:184` | asserted |
| MONEY-002 | 1.1 — The business retains its EIN, two license numbers and logo after reload; the customer reta. | The business retains its EIN | none | none |
| MONEY-002 | 1.2 — The business retains its EIN, two license numbers and logo after reload; the customer reta. | two license numbers and logo after reload | none | none |
| MONEY-002 | 1.3 — The business retains its EIN, two license numbers and logo after reload; the customer reta. | the customer retains separate billing and service addresses through edit | none | none |
| MONEY-002 | 1.4 — The business retains its EIN, two license numbers and logo after reload; the customer reta. | export. | none | none |
| MONEY-002 | 2.1 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | The business record keeps its legal name | none | none |
| MONEY-002 | 2.2 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | DBA | none | none |
| MONEY-002 | 2.3 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | EIN (its tax ID field | none | none |
| MONEY-002 | 2.4 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | kept from the first release) | none | none |
| MONEY-002 | 2.5 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | up to 20 contractor licenses (trade | none | none |
| MONEY-002 | 2.6 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | two-letter state | none | none |
| MONEY-002 | 2.7 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | number) | none | none |
| MONEY-002 | 2.8 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | insurance (carrier | none | none |
| MONEY-002 | 2.9 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | policy number | none | none |
| MONEY-002 | 2.10 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | expiry date) | none | none |
| MONEY-002 | 2.11 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | a logo image in its own format (PNG | none | none |
| MONEY-002 | 2.12 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | JPEG or WebP | none | none |
| MONEY-002 | 2.13 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | at most 1.5 MB) | none | none |
| MONEY-002 | 2.14 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | each kept when a save leaves it out | none | none |
| MONEY-002 | 2.15 — The business record keeps its legal name, DBA, EIN (its tax ID field, kept from the first. | every signed-in role can open the logo. | none | none |
| MONEY-002 | 3.1 — Customers keep a billing address apart from each site's service address, and a business cu. | Customers keep a billing address apart from each site's service address | none | none |
| MONEY-002 | 3.2 — Customers keep a billing address apart from each site's service address, and a business cu. | a business customer's tax ID | none | none |
| MONEY-002 | 3.3 — Customers keep a billing address apart from each site's service address, and a business cu. | the customer export carries both addresses in their own columns. | none | none |
| MONEY-002 | 4.1 — Printing these on quotes, invoices, service reports and agreements, with US address, phone. | Printing these on quotes | none | none |
| MONEY-002 | 4.2 — Printing these on quotes, invoices, service reports and agreements, with US address, phone. | invoices | none | none |
| MONEY-002 | 4.3 — Printing these on quotes, invoices, service reports and agreements, with US address, phone. | service reports and agreements | none | none |
| MONEY-002 | 4.4 — Printing these on quotes, invoices, service reports and agreements, with US address, phone. | with US address | none | none |
| MONEY-002 | 4.5 — Printing these on quotes, invoices, service reports and agreements, with US address, phone. | phone and date formats | none | none |
| MONEY-002 | 4.6 — Printing these on quotes, invoices, service reports and agreements, with US address, phone. | is QUOTE-005, QUOTE-015's. | none | none |
| MONEY-003 | 1.1 — A fixture imports a 200-line price book CSV with costs and markups, raises one category by. | A fixture imports a 200-line price book CSV with costs and markups | `tests/api/pricebook.test.mjs:31` | asserted |
| MONEY-003 | 1.2 — A fixture imports a 200-line price book CSV with costs and markups, raises one category by. | raises one category by 5% | `tests/api/pricebook.test.mjs:51` | asserted |
| MONEY-003 | 1.3 — A fixture imports a 200-line price book CSV with costs and markups, raises one category by. | quotes a flat-rate task | `tests/api/pricebook.test.mjs:69` | asserted |
| MONEY-003 | 1.4 — A fixture imports a 200-line price book CSV with costs and markups, raises one category by. | a time-and-materials line | `tests/api/pricebook.test.mjs:69` | asserted |
| MONEY-003 | 1.5 — A fixture imports a 200-line price book CSV with costs and markups, raises one category by. | checks prices | `tests/api/pricebook.test.mjs:69` | asserted |
| MONEY-003 | 1.6 — A fixture imports a 200-line price book CSV with costs and markups, raises one category by. | costs | none | none |
| MONEY-003 | 1.7 — A fixture imports a 200-line price book CSV with costs and markups, raises one category by. | the round-trip export. | none | none |
| MONEY-003 | 2.1 — An item is a service, a material or a flat-rate task. | An item is a service | `tests/api/pricebook.test.mjs:44` | asserted |
| MONEY-003 | 2.2 — An item is a service, a material or a flat-rate task. | a material or a flat-rate task. | none | none |
| MONEY-003 | 3.1 — Its price is fixed, or follows its category's markup: unit cost × (100 + markup) / 100, ro. | Its price is fixed | `tests/api/pricebook.test.mjs:41` | asserted |
| MONEY-003 | 3.2 — Its price is fixed, or follows its category's markup: unit cost × (100 + markup) / 100, ro. | or follows its category's markup: unit cost × (100 + markup) / 100 | none | none |
| MONEY-003 | 3.3 — Its price is fixed, or follows its category's markup: unit cost × (100 + markup) / 100, ro. | rounded half up to the cent | `tests/api/pricebook.test.mjs:41` | asserted |
| MONEY-003 | 3.4 — Its price is fixed, or follows its category's markup: unit cost × (100 + markup) / 100, ro. | recomputed whenever the cost or the markup changes. | none | none |
| MONEY-003 | 4.1 — A task's cost is the sum of its contents' costs at their quantities (each rounded half up. | A task's cost is the sum of its contents' costs at their quantities (each rounded half up to the cent) | `tests/api/pricebook.test.mjs:44` | asserted |
| MONEY-003 | 4.2 — A task's cost is the sum of its contents' costs at their quantities (each rounded half up. | its contents are services and materials | none | none |
| MONEY-003 | 4.3 — A task's cost is the sum of its contents' costs at their quantities (each rounded half up. | never other tasks. | none | none |
| MONEY-003 | 5.1 — A bulk change multiplies each fixed price in one category by (100 + percent) / 100, rounde. | A bulk change multiplies each fixed price in one category by (100 + percent) / 100 | `tests/api/pricebook.test.mjs:51` | asserted |
| MONEY-003 | 5.2 — A bulk change multiplies each fixed price in one category by (100 + percent) / 100, rounde. | rounded half up to the cent | `tests/api/pricebook.test.mjs:51` | asserted |
| MONEY-003 | 5.3 — A bulk change multiplies each fixed price in one category by (100 + percent) / 100, rounde. | markup prices follow cost instead. | none | none |
| MONEY-003 | 6.1 — A price-book quote line keeps the item's unit cost when it was priced. | A price-book quote line keeps the item's unit cost when it was priced. | `tests/api/pricebook.test.mjs:69` | asserted |
| MONEY-003 | 7.1 — The customer-facing description is stored on the item; the doors that show customers docum. | The customer-facing description is stored on the item | none | none |
| MONEY-003 | 7.2 — The customer-facing description is stored on the item; the doors that show customers docum. | the doors that show customers documents (QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 | none | none |
| MONEY-003 | 7.4 — The customer-facing description is stored on the item; the doors that show customers docum. | COMM-006, COMM-022, COMM-023, COMM-024, COMM-025) print it when they ship. | none | none |
| MONEY-006 | 1.1 — Costs are margin figures: technicians never read them, and a custom role reads them only w. | Costs are margin figures: technicians never read them | `tests/api/pricebook.test.mjs:72` | asserted |
| MONEY-006 | 1.2 — Costs are margin figures: technicians never read them, and a custom role reads them only w. | a custom role reads them only with report-reading permission. | none | none |
| MONEY-006 | 2.1 — The price-book CSV matches rows by Code (new, updated with the fields that change, unchang. | The price-book CSV matches rows by Code (new | none | none |
| MONEY-006 | 2.2 — The price-book CSV matches rows by Code (new, updated with the fields that change, unchang. | updated with the fields that change | none | none |
| MONEY-006 | 2.3 — The price-book CSV matches rows by Code (new, updated with the fields that change, unchang. | unchanged | none | none |
| MONEY-006 | 2.4 — The price-book CSV matches rows by Code (new, updated with the fields that change, unchang. | or rejected with its reason) | none | none |
| MONEY-006 | 2.5 — The price-book CSV matches rows by Code (new, updated with the fields that change, unchang. | is committed only as the exact preview | none | none |
| MONEY-006 | 2.6 — The price-book CSV matches rows by Code (new, updated with the fields that change, unchang. | keeps checklists | none | none |
| MONEY-006 | 2.7 — The price-book CSV matches rows by Code (new, updated with the fields that change, unchang. | skills and images | none | none |
| MONEY-006 | 2.8 — The price-book CSV matches rows by Code (new, updated with the fields that change, unchang. | ignores a markup row's Price | none | none |
| MONEY-006 | 2.9 — The price-book CSV matches rows by Code (new, updated with the fields that change, unchang. | re-importing the export changes nothing. | `tests/api/pricebook.test.mjs:79` | asserted |
| CUST-001 | 1.1 — A fixture opens a customer with two properties and finds each property's full history of e. | A fixture opens a customer with two properties | none | none |
| CUST-001 | 1.2 — A fixture opens a customer with two properties and finds each property's full history of e. | finds each property's full history of every kept record kind: requests | none | none |
| CUST-001 | 1.3 — A fixture opens a customer with two properties and finds each property's full history of e. | quotes | none | none |
| CUST-001 | 1.4 — A fixture opens a customer with two properties and finds each property's full history of e. | jobs | none | none |
| CUST-001 | 1.5 — A fixture opens a customer with two properties and finds each property's full history of e. | visits | none | none |
| CUST-001 | 1.6 — A fixture opens a customer with two properties and finds each property's full history of e. | photos | none | none |
| CUST-001 | 1.7 — A fixture opens a customer with two properties and finds each property's full history of e. | checklist forms | none | none |
| CUST-001 | 1.8 — A fixture opens a customer with two properties and finds each property's full history of e. | notes | none | none |
| CUST-001 | 1.9 — A fixture opens a customer with two properties and finds each property's full history of e. | materials | none | none |
| CUST-001 | 1.10 — A fixture opens a customer with two properties and finds each property's full history of e. | refrigerant | none | none |
| CUST-001 | 1.11 — A fixture opens a customer with two properties and finds each property's full history of e. | completion | none | none |
| CUST-001 | 1.12 — A fixture opens a customer with two properties and finds each property's full history of e. | invoices and equipment | none | none |
| CUST-001 | 1.13 — A fixture opens a customer with two properties and finds each property's full history of e. | a search by a phone fragment and by a street name finds them | none | none |
| CUST-001 | 1.14 — A fixture opens a customer with two properties and finds each property's full history of e. | a business customer's billing contact and accounts-payable email stay apart from its site contacts. | `tests/api/customers.test.mjs:18` | asserted |
| CUST-001 | 2.1 — Require a PO for that customer, refuse invoice approval without it, then add the PO, appro. | Require a PO for that customer | none | none |
| CUST-001 | 2.2 — Require a PO for that customer, refuse invoice approval without it, then add the PO, appro. | refuse invoice approval without it | none | none |
| CUST-001 | 2.3 — Require a PO for that customer, refuse invoice approval without it, then add the PO, appro. | then add the PO | none | none |
| CUST-001 | 2.4 — Require a PO for that customer, refuse invoice approval without it, then add the PO, appro. | approve and verify it travels in the invoice CSV Reference. | `tests/api/customers.test.mjs:44` | asserted |
| CUST-001 | 3.1 — Each PAY-* payment, PLAN-* agreement and COMM-* message clause must prove its entries appe. | Each PAY-* payment | none | none |
| CUST-001 | 3.2 — Each PAY-* payment, PLAN-* agreement and COMM-* message clause must prove its entries appe. | PLAN-* agreement and COMM-* message clause must prove its entries appear in the property history | none | none |
| CUST-001 | 3.3 — Each PAY-* payment, PLAN-* agreement and COMM-* message clause must prove its entries appe. | these remain standing obligations of those clauses. | none | none |
| CUST-002 | 1.1 — A fixture adds a furnace and an AC condenser to a site, records a visit against the conden. | A fixture adds a furnace | none | none |
| CUST-002 | 1.2 — A fixture adds a furnace and an AC condenser to a site, records a visit against the conden. | an AC condenser to a site | none | none |
| CUST-002 | 1.3 — A fixture adds a furnace and an AC condenser to a site, records a visit against the conden. | records a visit against the condenser | none | none |
| CUST-002 | 1.4 — A fixture adds a furnace and an AC condenser to a site, records a visit against the conden. | reads the condenser's service history and warranty state | `tests/api/equipment.test.mjs:60`; `tests/api/equipment.test.mjs:62` | asserted |
| CUST-002 | 1.5 — A fixture adds a furnace and an AC condenser to a site, records a visit against the conden. | the technician's phone shows them offline. | none | none |
| CUST-003 | 1.1 — A fixture previews and commits a 500-row CSV with bad rows and duplicates, undoes it, and. | A fixture previews and commits a 500-row CSV with bad rows and duplicates | `tests/api/csv.test.mjs:49` | asserted |
| CUST-003 | 1.2 — A fixture previews and commits a 500-row CSV with bad rows and duplicates, undoes it, and. | undoes it | `tests/api/csv.test.mjs:97`; `tests/api/csv.test.mjs:98` | asserted |
| CUST-003 | 1.3 — A fixture previews and commits a 500-row CSV with bad rows and duplicates, undoes it, and. | exports a CSV that re-imports unchanged. | `tests/api/csv.test.mjs:86`; `tests/api/csv.test.mjs:90` | asserted |
| CUST-003 | 2.1 — Rows sharing a Customer ID, or without one carrying identical customer details, are one cu. | Rows sharing a Customer ID | none | none |
| CUST-003 | 2.2 — Rows sharing a Customer ID, or without one carrying identical customer details, are one cu. | or without one carrying identical customer details | none | none |
| CUST-003 | 2.3 — Rows sharing a Customer ID, or without one carrying identical customer details, are one cu. | are one customer | none | none |
| CUST-003 | 2.4 — Rows sharing a Customer ID, or without one carrying identical customer details, are one cu. | each row adding one site and one other contact. | `tests/api/csv.test.mjs:69` | asserted |
| CUST-003 | 3.1 — A row is *matched* when its Customer ID is a Glove customer's ID or it repeats a customer. | A row is *matched* when its Customer ID is a Glove customer's ID or it repeats a customer an earlier CSV import created | none | none |
| CUST-003 | 3.2 — A row is *matched* when its Customer ID is a Glove customer's ID or it repeats a customer. | Glove keeps a matched customer's details and contacts as they are | none | none |
| CUST-003 | 3.3 — A row is *matched* when its Customer ID is a Glove customer's ID or it repeats a customer. | lists which file values differ | none | none |
| CUST-003 | 3.4 — A row is *matched* when its Customer ID is a Glove customer's ID or it repeats a customer. | adds only the site addresses it lacks. | none | none |
| CUST-003 | 4.1 — A row is , with its spreadsheet row number and reason, when a field fails the rule custome. | A row is | none | none |
| CUST-003 | 4.2 — A row is , with its spreadsheet row number and reason, when a field fails the rule custome. | with its spreadsheet row number and reason | `tests/api/csv.test.mjs:60` | asserted |
| CUST-003 | 4.3 — A row is , with its spreadsheet row number and reason, when a field fails the rule custome. | when a field fails the rule customer save action or site save action applies | `tests/api/csv.test.mjs:55` | asserted |
| CUST-003 | 4.4 — A row is , with its spreadsheet row number and reason, when a field fails the rule custome. | it has more cells than the header | `tests/api/csv.test.mjs:59` | asserted |
| CUST-003 | 4.5 — A row is , with its spreadsheet row number and reason, when a field fails the rule custome. | it repeats an earlier row exactly | `tests/api/csv.test.mjs:54` | asserted |
| CUST-003 | 4.6 — A row is , with its spreadsheet row number and reason, when a field fails the rule custome. | or its details differ from the first row with the same Customer ID | none | none |
| CUST-003 | 4.7 — A row is , with its spreadsheet row number and reason, when a field fails the rule custome. | every other row is *new*. | none | none |
| CUST-003 | 5.1 — Without a chosen mapping Glove uses the last committed CSV's mapping when every column it. | Without a chosen mapping Glove uses the last committed CSV's mapping when every column it names is in the file | `tests/api/csv.test.mjs:74` | asserted |
| CUST-003 | 5.2 — Without a chosen mapping Glove uses the last committed CSV's mapping when every column it. | else columns headed like Glove's own export. | none | none |
| CUST-003 | 6.1 — The export writes every live (unmerged) customer, one row per site or other contact, and p. | The export writes every live (unmerged) customer | none | none |
| CUST-003 | 6.2 — The export writes every live (unmerged) customer, one row per site or other contact, and p. | one row per site or other contact | none | none |
| CUST-003 | 6.3 — The export writes every live (unmerged) customer, one row per site or other contact, and p. | puts a ' before a cell a spreadsheet would run as a formula (import takes exactly one off) | `tests/api/csv.test.mjs:83` | asserted |
| CUST-003 | 6.4 — The export writes every live (unmerged) customer, one row per site or other contact, and p. | so re-importing it matches every row and writes nothing. | `tests/api/csv.test.mjs:90` | asserted |
| CUST-004 | 1.1 — A fixture defines two custom fields and a segment, and checks that the segment's members m. | A fixture defines two custom fields | none | none |
| CUST-004 | 1.2 — A fixture defines two custom fields and a segment, and checks that the segment's members m. | a segment | none | none |
| CUST-004 | 1.3 — A fixture defines two custom fields and a segment, and checks that the segment's members m. | checks that the segment's members match the filter and that the export | `tests/api/segments.test.mjs:38` | asserted |
| CUST-004 | 1.4 — A fixture defines two custom fields and a segment, and checks that the segment's members m. | the Mango push (provider fake) carry exactly them | `tests/api/segments.test.mjs:50` | asserted |
| CUST-004 | 1.5 — A fixture defines two custom fields and a segment, and checks that the segment's members m. | a workflow rule conditioned on the "commercial" tag runs only for a tagged customer's job (API-005). | none | none |
| CUST-004 | 2.1 — The owner defines custom fields on customers, sites, jobs or equipment (text, number, date. | The owner defines custom fields on customers | none | none |
| CUST-004 | 2.2 — The owner defines custom fields on customers, sites, jobs or equipment (text, number, date. | sites | none | none |
| CUST-004 | 2.3 — The owner defines custom fields on customers, sites, jobs or equipment (text, number, date. | jobs or equipment (text | none | none |
| CUST-004 | 2.4 — The owner defines custom fields on customers, sites, jobs or equipment (text, number, date. | number | none | none |
| CUST-004 | 2.5 — The owner defines custom fields on customers, sites, jobs or equipment (text, number, date. | date | none | none |
| CUST-004 | 2.6 — The owner defines custom fields on customers, sites, jobs or equipment (text, number, date. | yes/no | none | none |
| CUST-004 | 2.7 — The owner defines custom fields on customers, sites, jobs or equipment (text, number, date. | or a choice of 2–20 values) | none | none |
| CUST-004 | 2.8 — The owner defines custom fields on customers, sites, jobs or equipment (text, number, date. | a field keeps its record and type. | none | none |
| CUST-004 | 3.1 — The owner, dispatchers and the office set field values and a customer's tags (up to 20, ea. | The owner | none | none |
| CUST-004 | 3.2 — The owner, dispatchers and the office set field values and a customer's tags (up to 20, ea. | dispatchers | none | none |
| CUST-004 | 3.3 — The owner, dispatchers and the office set field values and a customer's tags (up to 20, ea. | the office set field values | none | none |
| CUST-004 | 3.4 — The owner, dispatchers and the office set field values and a customer's tags (up to 20, ea. | a customer's tags (up to 20 | none | none |
| CUST-004 | 3.5 — The owner, dispatchers and the office set field values and a customer's tags (up to 20, ea. | each up to 40 characters | none | none |
| CUST-004 | 3.6 — The owner, dispatchers and the office set field values and a customer's tags (up to 20, ea. | kept once whatever the case) and save segments. | `tests/api/segments.test.mjs:31` | asserted |
| CUST-004 | 4.1 — A technician sees the values on the sites, jobs and equipment of visits assigned to them. | A technician sees the values on the sites | none | none |
| CUST-004 | 4.2 — A technician sees the values on the sites, jobs and equipment of visits assigned to them. | jobs and equipment of visits assigned to them | none | none |
| CUST-004 | 4.3 — A technician sees the values on the sites, jobs and equipment of visits assigned to them. | never a customer's tags or customer fields. | none | none |
| CUST-004 | 5.1 — A segment's members are the live customers (never merged-away ones) that have all of its ". | A segment's members are the live customers (never merged-away ones) that have all of its "has" tags and none of its "has none" tags (compared without case) | none | none |
| CUST-004 | 5.2 — A segment's members are the live customers (never merged-away ones) that have all of its ". | meet every field condition (is | none | none |
| CUST-004 | 5.3 — A segment's members are the live customers (never merged-away ones) that have all of its ". | over | none | none |
| CUST-004 | 5.4 — A segment's members are the live customers (never merged-away ones) that have all of its ". | under | none | none |
| CUST-004 | 5.5 — A segment's members are the live customers (never merged-away ones) that have all of its ". | set | none | none |
| CUST-004 | 5.6 — A segment's members are the live customers (never merged-away ones) that have all of its ". | unset | none | none |
| CUST-004 | 5.7 — A segment's members are the live customers (never merged-away ones) that have all of its ". | a site field holds when any of the customer's sites meets it) and | none | none |
| CUST-004 | 5.8 — A segment's members are the live customers (never merged-away ones) that have all of its ". | when set | none | none |
| CUST-004 | 5.9 — A segment's members are the live customers (never merged-away ones) that have all of its ". | have equipment at one of their sites installed at least N years before today's local date. "No agreement" holds for every customer until agreements exist | none | none |
| CUST-004 | 5.10 — A segment's members are the live customers (never merged-away ones) that have all of its ". | PLAN-002 carries it in its text and acceptance. | none | none |
| CUST-004 | 6.1 — The members list reads for the desk; the members CSV (name, email, phone, tags, customer f. | The members list reads for the desk | none | none |
| CUST-004 | 6.2 — The members list reads for the desk; the members CSV (name, email, phone, tags, customer f. | the members CSV (name | `tests/api/segments.test.mjs:41` | asserted |
| CUST-004 | 6.3 — The members list reads for the desk; the members CSV (name, email, phone, tags, customer f. | email | none | none |
| CUST-004 | 6.4 — The members list reads for the desk; the members CSV (name, email, phone, tags, customer f. | phone | none | none |
| CUST-004 | 6.5 — The members list reads for the desk; the members CSV (name, email, phone, tags, customer f. | tags | none | none |
| CUST-004 | 6.6 — The members list reads for the desk; the members CSV (name, email, phone, tags, customer f. | customer fields) for the owner and office | none | none |
| CUST-004 | 6.7 — The members list reads for the desk; the members CSV (name, email, phone, tags, customer f. | like the customer CSV. | `tests/api/segments.test.mjs:41` | asserted |
| CUST-004 | 7.1 — A tag is a condition of a workflow rule (API-005). | A tag is a condition of a workflow rule (API-005). | `tests/api/segments.test.mjs:71` | asserted |
| CUST-006 | 1.1 — The owner connects Mango (its integration address and a contacts:write credential) or Mail. | The owner connects Mango (its integration address | none | none |
| CUST-006 | 1.2 — The owner connects Mango (its integration address and a contacts:write credential) or Mail. | a contacts:write credential) or Mailchimp (an API key and audience ID) | none | none |
| CUST-006 | 1.3 — The owner connects Mango (its integration address and a contacts:write credential) or Mail. | the key is kept as a secret | none | none |
| CUST-006 | 1.4 — The owner connects Mango (its integration address and a contacts:write credential) or Mail. | never in records | none | none |
| CUST-006 | 1.5 — The owner connects Mango (its integration address and a contacts:write credential) or Mail. | exports | none | none |
| CUST-006 | 1.6 — The owner connects Mango (its integration address and a contacts:write credential) or Mail. | logs or the archive. | none | none |
| CUST-006 | 2.1 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | The owner and office push a segment: Glove holds no marketing consent | none | none |
| CUST-006 | 2.2 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | so a push never subscribes anyone: Mango receives each member with an email (email | none | none |
| CUST-006 | 2.3 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | name | none | none |
| CUST-006 | 2.4 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | tags | none | none |
| CUST-006 | 2.5 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | the segment as its list | none | none |
| CUST-006 | 2.6 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | without subscribe) | none | none |
| CUST-006 | 2.7 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | Mailchimp adds new members as transactional and tags them with the segment | `tests/api/segments.test.mjs:57` | asserted |
| CUST-006 | 2.8 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | their tags | none | none |
| CUST-006 | 2.9 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | members without an email or tagged "do not contact" are skipped | `tests/api/segments.test.mjs:79` | asserted |
| CUST-006 | 2.10 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | counted (customers who opted out are excluded with COMM-002's consent record | none | none |
| CUST-006 | 2.11 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | which carries it in its text and acceptance) | none | none |
| CUST-006 | 2.12 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | each push is recorded with its counts | none | none |
| CUST-006 | 2.13 — The owner and office push a segment: Glove holds no marketing consent, so a push never sub. | the provider's refusals. | none | none |
| CUST-005 | 1.1 — A fixture creates nine customers sharing a phone number, reviews and merges them, checks e. | A fixture creates nine customers sharing a phone number | `tests/api/merge.test.mjs:20` | asserted |
| CUST-005 | 1.2 — A fixture creates nine customers sharing a phone number, reviews and merges them, checks e. | reviews and merges them | `tests/api/merge.test.mjs:37` | asserted |
| CUST-005 | 1.3 — A fixture creates nine customers sharing a phone number, reviews and merges them, checks e. | checks every job and invoice now hangs off the survivor | `tests/api/merge.test.mjs:37` | asserted |
| CUST-005 | 1.4 — A fixture creates nine customers sharing a phone number, reviews and merges them, checks e. | undoes the merge. | `tests/api/merge.test.mjs:47`; `tests/api/merge.test.mjs:48` | asserted |
| BOOK-003 | 1.1 — A fixture creates requests from four sources, quotes and wins two, loses one with a reason. | A fixture creates requests from four sources | `tests/api/pipeline.test.mjs:55` | asserted |
| BOOK-003 | 1.2 — A fixture creates requests from four sources, quotes and wins two, loses one with a reason. | quotes and wins two | `tests/api/pipeline.test.mjs:60` | asserted |
| BOOK-003 | 1.3 — A fixture creates requests from four sources, quotes and wins two, loses one with a reason. | loses one with a reason | `tests/api/pipeline.test.mjs:37` | asserted |
| BOOK-003 | 1.4 — A fixture creates requests from four sources, quotes and wins two, loses one with a reason. | checks the pipeline | `tests/api/pipeline.test.mjs:62` | asserted |
| BOOK-003 | 1.5 — A fixture creates requests from four sources, quotes and wins two, loses one with a reason. | the conversion-by-source report. | `tests/api/pipeline.test.mjs:60` | asserted |
| BOOK-005 | 1.1 — A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89. | A fixture takes a phoned-in request for a leaking water heater | none | none |
| BOOK-005 | 1.2 — A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89. | creates a job with an $89.00 diagnostic fee from the price book | `tests/api/servicecall.test.mjs:24` | asserted |
| BOOK-005 | 1.3 — A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89. | books it for today | none | none |
| BOOK-005 | 1.4 — A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89. | the technician adds a flat-rate valve replacement and 1.5 hours of labor on site with the customer's approval | none | none |
| BOOK-005 | 1.5 — A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89. | the invoice draft carries exactly the fee | `tests/api/servicecall.test.mjs:71` | asserted |
| BOOK-005 | 1.6 — A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89. | both lines | none | none |
| BOOK-005 | 1.7 — A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89. | the recorded materials | none | none |
| BOOK-005 | 1.8 — A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89. | is approved and invoiced | none | none |
| BOOK-005 | 1.9 — A fixture takes a phoned-in request for a leaking water heater, creates a job with an $89. | a browser journey creates the same kind of job from the customer record. | none | none |
| BOOK-005 | 2.1 — The dispatcher, the office or the owner makes a service call (job create action without a. | The dispatcher | none | none |
| BOOK-005 | 2.2 — The dispatcher, the office or the owner makes a service call (job create action without a. | the office or the owner makes a service call (job create action without a quote) from a request (which is then won) or from the customer record | none | none |
| BOOK-005 | 2.3 — The dispatcher, the office or the owner makes a service call (job create action without a. | at one of that customer's sites | none | none |
| BOOK-005 | 2.4 — The dispatcher, the office or the owner makes a service call (job create action without a. | with zero or more lines from the price book or custom | none | none |
| BOOK-005 | 2.5 — The dispatcher, the office or the owner makes a service call (job create action without a. | its checklist and forms come from those lines as for a quoted job. | none | none |
| BOOK-005 | 3.1 — Its timeline says it was made without a quote, its screen shows no accepted price, and its. | Its timeline says it was made without a quote | `tests/api/servicecall.test.mjs:28` | asserted |
| BOOK-005 | 3.2 — Its timeline says it was made without a quote, its screen shows no accepted price, and its. | its screen shows no accepted price | none | none |
| BOOK-005 | 3.3 — Its timeline says it was made without a quote, its screen shows no accepted price, and its. | its booking | none | none |
| BOOK-005 | 3.4 — Its timeline says it was made without a quote, its screen shows no accepted price, and its. | field capture and completion are any job's. | none | none |
| BOOK-005 | 4.1 — On site the assigned technician adds work only on a service call (on a quoted job that is. | On site the assigned technician adds work only on a service call (on a quoted job that is a change order | none | none |
| BOOK-005 | 4.2 — On site the assigned technician adds work only on a service call (on a quoted job that is. | QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018): a price-book item other than a material | none | none |
| BOOK-005 | 4.3 — On site the assigned technician adds work only on a service call (on a quoted job that is. | a quantity | none | none |
| BOOK-005 | 4.4 — On site the assigned technician adds work only on a service call (on a quoted job that is. | the customer's approval (their name | none | none |
| BOOK-005 | 4.5 — On site the assigned technician adds work only on a service call (on a quoted job that is. | signed on the phone or told in person) | none | none |
| BOOK-005 | 4.6 — On site the assigned technician adds work only on a service call (on a quoted job that is. | queued through the phone's outbox | none | none |
| BOOK-005 | 4.7 — On site the assigned technician adds work only on a service call (on a quoted job that is. | the technician sees no prices. | `tests/api/servicecall.test.mjs:54` | asserted |
| BOOK-005 | 5.1 — The invoice draft carries the job's lines, then the added work and the recorded price-book. | The invoice draft carries the job's lines | `tests/api/servicecall.test.mjs:71` | asserted |
| BOOK-005 | 5.2 — The invoice draft carries the job's lines, then the added work and the recorded price-book. | then the added work | none | none |
| BOOK-005 | 5.3 — The invoice draft carries the job's lines, then the added work and the recorded price-book. | the recorded price-book materials at today's price-book prices | none | none |
| BOOK-005 | 5.4 — The invoice draft carries the job's lines, then the added work and the recorded price-book. | so the office prices them by preparing | none | none |
| BOOK-005 | 5.5 — The invoice draft carries the job's lines, then the added work and the recorded price-book. | revising and approving the invoice under GLOVE-09 | none | none |
| BOOK-005 | 5.6 — The invoice draft carries the job's lines, then the added work and the recorded price-book. | until that approval none of the job's prices counts as approved. | `tests/api/servicecall.test.mjs:70` | asserted |
| BOOK-005 | 6.1 — A service call's arrival window comes with DISP-006, the customer's confirmation with C. | A service call's arrival window comes with DISP-006 | none | none |
| BOOK-005 | 6.2 — A service call's arrival window comes with DISP-006, the customer's confirmation with C. | the customer's confirmation with COMM-003, COMM-019, COMM-020 | none | none |
| BOOK-005 | 6.3 — A service call's arrival window comes with DISP-006, the customer's confirmation with C. | technicians pricing their own added work where the owner allows with QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018. | none | none |
| BOOK-005 | 7.1 — The office makes service calls only: a job from an accepted quote stays the dispatcher's o. | The office makes service calls only: a job from an accepted quote stays the dispatcher's or the owner's (GLOVE-05). | none | none |
| BOOK-006 | 1.1 — A fixture books an assessment on a water-heater replacement request, checks it blocks an o. | A fixture books an assessment on a water-heater replacement request | none | none |
| BOOK-006 | 1.2 — A fixture books an assessment on a water-heater replacement request, checks it blocks an o. | checks it blocks an overlapping booking for that technician until reviewed | none | none |
| BOOK-006 | 1.3 — A fixture books an assessment on a water-heater replacement request, checks it blocks an o. | records two photos | none | none |
| BOOK-006 | 1.4 — A fixture books an assessment on a water-heater replacement request, checks it blocks an o. | a form on the phone | none | none |
| BOOK-006 | 1.5 — A fixture books an assessment on a water-heater replacement request, checks it blocks an o. | completes it | none | none |
| BOOK-006 | 1.6 — A fixture books an assessment on a water-heater replacement request, checks it blocks an o. | converts the request into a quote draft carrying the photos | `tests/api/assessments.test.mjs:43` | asserted |
| BOOK-006 | 1.7 — A fixture books an assessment on a water-heater replacement request, checks it blocks an o. | notes and form results | `tests/api/assessments.test.mjs:43` | asserted |
| BOOK-006 | 1.8 — A fixture books an assessment on a water-heater replacement request, checks it blocks an o. | the assessment shows on the request | none | none |
| BOOK-006 | 1.9 — A fixture books an assessment on a water-heater replacement request, checks it blocks an o. | the quote | none | none |
| BOOK-006 | 1.10 — A fixture books an assessment on a water-heater replacement request, checks it blocks an o. | the customer history. | none | none |
| BOOK-006 | 2.1 — The dispatcher or owner books an assessment on an open request (assessment book action): t. | The dispatcher or owner books an assessment on an open request (assessment book action): the technician | none | none |
| BOOK-006 | 2.2 — The dispatcher or owner books an assessment on an open request (assessment book action): t. | local date | none | none |
| BOOK-006 | 2.3 — The dispatcher or owner books an assessment on an open request (assessment book action): t. | start and end | none | none |
| BOOK-006 | 2.4 — The dispatcher or owner books an assessment on an open request (assessment book action): t. | instructions and up to 10 of the owner's forms (FIELD-002) | none | none |
| BOOK-006 | 2.5 — The dispatcher or owner books an assessment on an open request (assessment book action): t. | one open assessment per request. | none | none |
| BOOK-006 | 3.1 — It is a job of kind assessment with no lines or price, linked to the request, whose visit. | It is a job of kind assessment with no lines or price | `tests/api/assessments.test.mjs:24` | asserted |
| BOOK-006 | 3.2 — It is a job of kind assessment with no lines or price, linked to the request, whose visit. | linked to the request | none | none |
| BOOK-006 | 3.3 — It is a job of kind assessment with no lines or price, linked to the request, whose visit. | whose visit is booked under GLOVE-05's conflict review | none | none |
| BOOK-006 | 3.4 — It is a job of kind assessment with no lines or price, linked to the request, whose visit. | so it sits on the board | none | none |
| BOOK-006 | 3.5 — It is a job of kind assessment with no lines or price, linked to the request, whose visit. | the assessor's phone and blocks that time like any visit | none | none |
| BOOK-006 | 3.6 — It is a job of kind assessment with no lines or price, linked to the request, whose visit. | takes the same field capture (arrival | none | none |
| BOOK-006 | 3.7 — It is a job of kind assessment with no lines or price, linked to the request, whose visit. | notes | none | none |
| BOOK-006 | 3.8 — It is a job of kind assessment with no lines or price, linked to the request, whose visit. | photos | none | none |
| BOOK-006 | 3.9 — It is a job of kind assessment with no lines or price, linked to the request, whose visit. | forms | none | none |
| BOOK-006 | 3.10 — It is a job of kind assessment with no lines or price, linked to the request, whose visit. | through the outbox). | none | none |
| BOOK-006 | 4.1 — Completing its visit marks it assessed (never "completed, not invoiced" and never invoiced. | Completing its visit marks it assessed (never "completed | `tests/api/assessments.test.mjs:38` | asserted |
| BOOK-006 | 4.2 — Completing its visit marks it assessed (never "completed, not invoiced" and never invoiced. | not invoiced" | none | none |
| BOOK-006 | 4.3 — Completing its visit marks it assessed (never "completed, not invoiced" and never invoiced. | never invoiced). | none | none |
| BOOK-006 | 5.1 — A quote drafted from that request carries the assessment's notes, photos and form results. | A quote drafted from that request carries the assessment's notes | `tests/api/assessments.test.mjs:43` | asserted |
| BOOK-006 | 5.2 — A quote drafted from that request carries the assessment's notes, photos and form results. | photos and form results | none | none |
| BOOK-006 | 5.3 — A quote drafted from that request carries the assessment's notes, photos and form results. | its link | none | none |
| BOOK-006 | 5.4 — A quote drafted from that request carries the assessment's notes, photos and form results. | the request names its assessment | `tests/api/assessments.test.mjs:48` | asserted |
| BOOK-006 | 5.5 — A quote drafted from that request carries the assessment's notes, photos and form results. | the assessment | none | none |
| BOOK-006 | 5.6 — A quote drafted from that request carries the assessment's notes, photos and form results. | the request | none | none |
| BOOK-006 | 5.7 — A quote drafted from that request carries the assessment's notes, photos and form results. | the quote show on the property history (CUST-001). | none | none |
| BOOK-006 | 6.1 — The arrival window comes with DISP-006, the customer's confirmation and reminders with . | The arrival window comes with DISP-006 | none | none |
| BOOK-006 | 6.2 — The arrival window comes with DISP-006, the customer's confirmation and reminders with . | the customer's confirmation and reminders with COMM-003, COMM-019, COMM-020 | none | none |
| BOOK-006 | 6.3 — The arrival window comes with DISP-006, the customer's confirmation and reminders with . | turning it into a field quote on the phone with QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018 | none | none |
| BOOK-006 | 6.4 — The arrival window comes with DISP-006, the customer's confirmation and reminders with . | each carrying it in its text and acceptance. | none | none |
| QUOTE-001 | 1.1 — A fixture drafts three options with two add-ons, records the customer's choice of the midd. | A fixture drafts three options with two add-ons | none | none |
| QUOTE-001 | 1.2 — A fixture drafts three options with two add-ons, records the customer's choice of the midd. | records the customer's choice of the middle option and one add-on (choosing online through the quote link is QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013's acceptance) | none | none |
| QUOTE-001 | 1.3 — A fixture drafts three options with two add-ons, records the customer's choice of the midd. | the job's lines and total equal exactly that choice. | none | none |
| QUOTE-001 | 2.1 — The owner saves those options as a template, raises one price-book price, and starts a sec. | The owner saves those options as a template | none | none |
| QUOTE-001 | 2.2 — The owner saves those options as a template, raises one price-book price, and starts a sec. | raises one price-book price | none | none |
| QUOTE-001 | 2.3 — The owner saves those options as a template, raises one price-book price, and starts a sec. | starts a second quote from the template: it carries the three options and add-ons with the raised price | none | none |
| QUOTE-001 | 2.4 — The owner saves those options as a template, raises one price-book price, and starts a sec. | editing the template afterwards leaves the second quote unchanged. | none | none |
| QUOTE-001 | 3.1 — A revision holds one to five options (each its own lines and total, tax computed per optio. | A revision holds one to five options (each its own lines and total | none | none |
| QUOTE-001 | 3.2 — A revision holds one to five options (each its own lines and total, tax computed per optio. | tax computed per option) and up to ten named add-ons. | none | none |
| QUOTE-001 | 4.1 — Approving a revision approves every option's and add-on's price under GLOVE-03; a change. | Approving a revision approves every option's and add-on's price under GLOVE-03 | none | none |
| QUOTE-001 | 4.2 — Approving a revision approves every option's and add-on's price under GLOVE-03; a change. | a changed price is a new revision. | none | none |
| QUOTE-001 | 5.1 — The customer's answer records their choice — exactly one option and any of the add-ons — b. | The customer's answer records their choice — exactly one option and any of the add-ons — by the person taking it under GLOVE-04 (online under QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013) | none | none |
| QUOTE-001 | 5.2 — The customer's answer records their choice — exactly one option and any of the add-ons — b. | a revision with more than one option or any add-on cannot be accepted without a choice. | none | none |
| QUOTE-001 | 6.1 — The accepted lines are the chosen option's followed by the chosen add-ons', with tax compu. | The accepted lines are the chosen option's followed by the chosen add-ons' | none | none |
| QUOTE-001 | 6.2 — The accepted lines are the chosen option's followed by the chosen add-ons', with tax compu. | with tax computed once on that document | none | none |
| QUOTE-001 | 6.3 — The accepted lines are the chosen option's followed by the chosen add-ons', with tax compu. | the job carries exactly those lines and that total | none | none |
| QUOTE-001 | 6.4 — The accepted lines are the chosen option's followed by the chosen add-ons', with tax compu. | booked-today and won-value figures (REPORT-001 | none | none |
| QUOTE-001 | 6.5 — The accepted lines are the chosen option's followed by the chosen add-ons', with tax compu. | BOOK-003) count the chosen total. | none | none |
| QUOTE-001 | 7.1 — The owner saves named templates of options, add-ons, notes and terms; a price-book line in. | The owner saves named templates of options | none | none |
| QUOTE-001 | 7.2 — The owner saves named templates of options, add-ons, notes and terms; a price-book line in. | add-ons | none | none |
| QUOTE-001 | 7.3 — The owner saves named templates of options, add-ons, notes and terms; a price-book line in. | notes and terms | none | none |
| QUOTE-001 | 7.4 — The owner saves named templates of options, add-ons, notes and terms; a price-book line in. | a price-book line in a template follows the price book unless the template fixes its price | none | none |
| QUOTE-001 | 7.5 — The owner saves named templates of options, add-ons, notes and terms; a price-book line in. | a custom line always fixes it. | none | none |
| QUOTE-001 | 8.1 — A quote started from a template copies it at today's prices and records which template it. | A quote started from a template copies it at today's prices | none | none |
| QUOTE-001 | 8.2 — A quote started from a template copies it at today's prices and records which template it. | records which template it came from | none | none |
| QUOTE-001 | 8.3 — A quote started from a template copies it at today's prices and records which template it. | editing a template never changes a quote already made from it. | none | none |
| QUOTE-002 | 1.1 — A fixture opens a sent quote link, finds each price-book line's customer-facing descriptio. | A fixture opens a sent quote link | none | none |
| QUOTE-002 | 1.2 — A fixture opens a sent quote link, finds each price-book line's customer-facing descriptio. | finds each price-book line's customer-facing description (MONEY-003, MONEY-006) | none | none |
| QUOTE-002 | 1.3 — A fixture opens a sent quote link, finds each price-book line's customer-facing descriptio. | chooses the middle of three options and one add-on (QUOTE-001 | none | none |
| QUOTE-002 | 1.4 — A fixture opens a sent quote link, finds each price-book line's customer-facing descriptio. | the job then carrying exactly that choice) | none | none |
| QUOTE-002 | 1.5 — A fixture opens a sent quote link, finds each price-book line's customer-facing descriptio. | requests a change | none | none |
| QUOTE-002 | 1.6 — A fixture opens a sent quote link, finds each price-book line's customer-facing descriptio. | approves the revised quote with a drawn signature | none | none |
| QUOTE-002 | 1.7 — A fixture opens a sent quote link, finds each price-book line's customer-facing descriptio. | checks the signature record and that a stale revision's link cannot be approved. | none | none |
| QUOTE-002 | 2.1 — A second quote with a 30-day validity date is opened on day 31: approval is refused, and ". | A second quote with a 30-day validity date is opened on day 31: approval is refused | none | none |
| QUOTE-002 | 2.2 — A second quote with a 30-day validity date is opened on day 31: approval is refused, and ". | "ask for an updated quote" puts a notice in the office queue and reopens the request. | none | none |
| QUOTE-002 | 3.1 — A bearer delegates read, option choice, change request, decline, update request and signed. | A bearer delegates read | none | none |
| QUOTE-002 | 3.2 — A bearer delegates read, option choice, change request, decline, update request and signed. | option choice | none | none |
| QUOTE-002 | 3.3 — A bearer delegates read, option choice, change request, decline, update request and signed. | change request | none | none |
| QUOTE-002 | 3.4 — A bearer delegates read, option choice, change request, decline, update request and signed. | decline | none | none |
| QUOTE-002 | 3.5 — A bearer delegates read, option choice, change request, decline, update request and signed. | update request and signed approval for one price-approved revision. | none | none |
| QUOTE-002 | 4.1 — Only a signed-in person issues it; one live link per revision, and reissue revokes the pre. | Only a signed-in person issues it | none | none |
| QUOTE-002 | 4.2 — Only a signed-in person issues it; one live link per revision, and reissue revokes the pre. | one live link per revision | none | none |
| QUOTE-002 | 4.3 — Only a signed-in person issues it; one live link per revision, and reissue revokes the pre. | reissue revokes the previous one. | none | none |
| QUOTE-002 | 5.1 — The page reveals only that revision and its service site. | The page reveals only that revision | none | none |
| QUOTE-002 | 5.2 — The page reveals only that revision and its service site. | its service site. | none | none |
| QUOTE-002 | 6.1 — A forwarded link can be used; name and capacity are CLAIMED, never verified, with authenti. | A forwarded link can be used | none | none |
| QUOTE-002 | 6.2 — A forwarded link can be used; name and capacity are CLAIMED, never verified, with authenti. | name and capacity are CLAIMED | none | none |
| QUOTE-002 | 6.3 — A forwarded link can be used; name and capacity are CLAIMED, never verified, with authenti. | never verified | none | none |
| QUOTE-002 | 6.4 — A forwarded link can be used; name and capacity are CLAIMED, never verified, with authenti. | with authentication basis recorded as a link sent by Glove to the address on record or handed out by staff to an unverified recipient. | none | none |
| QUOTE-002 | 7.1 — A decision rechecks the issuer's live role and branch; job creation rechecks price approva. | A decision rechecks the issuer's live role and branch | none | none |
| QUOTE-002 | 7.2 — A decision rechecks the issuer's live role and branch; job creation rechecks price approva. | job creation rechecks price approval. | none | none |
| QUOTE-002 | 8.1 — One decision per revision wins between staff and online and freezes it; replay changes not. | One decision per revision wins between staff and online and freezes it | none | none |
| QUOTE-002 | 8.2 — One decision per revision wins between staff and online and freezes it; replay changes not. | replay changes nothing. | none | none |
| QUOTE-008 | 1.1 — Requesting changes keeps the link live. | Requesting changes keeps the link live. | none | none |
| QUOTE-009 | 1.1 — The token is shown once, hashed separately at rest, sent in the URL fragment and Authoriza. | The token is shown once | none | none |
| QUOTE-009 | 1.2 — The token is shown once, hashed separately at rest, sent in the URL fragment and Authoriza. | hashed separately at rest | none | none |
| QUOTE-009 | 1.3 — The token is shown once, hashed separately at rest, sent in the URL fragment and Authoriza. | sent in the URL fragment and Authorization header only | none | none |
| QUOTE-009 | 1.4 — The token is shown once, hashed separately at rest, sent in the URL fragment and Authoriza. | absent from queries | none | none |
| QUOTE-009 | 1.5 — The token is shown once, hashed separately at rest, sent in the URL fragment and Authoriza. | logs | none | none |
| QUOTE-009 | 1.6 — The token is shown once, hashed separately at rest, sent in the URL fragment and Authoriza. | saved command outcomes | none | none |
| QUOTE-009 | 1.7 — The token is shown once, hashed separately at rest, sent in the URL fragment and Authoriza. | Activity | none | none |
| QUOTE-009 | 1.8 — The token is shown once, hashed separately at rest, sent in the URL fragment and Authoriza. | business exports and installation archives. | none | none |
| QUOTE-009 | 2.1 — An older revision's link shows only “a newer revision was sent” and refuses decisions. | An older revision's link shows only “a newer revision was sent” | none | none |
| QUOTE-009 | 2.2 — An older revision's link shows only “a newer revision was sent” and refuses decisions. | refuses decisions. | none | none |
| QUOTE-009 | 3.1 — An expired quote remains readable and offers an update request once per revision until the. | An expired quote remains readable and offers an update request once per revision until the link expires 90 days after validity. | none | none |
| QUOTE-009 | 4.1 — Restore retains records and document hashes but requires new links; erasure follows DATA-0. | Restore retains records and document hashes but requires new links | none | none |
| QUOTE-009 | 4.2 — Restore retains records and document hashes but requires new links; erasure follows DATA-0. | erasure follows DATA-001 | none | none |
| QUOTE-009 | 4.6 — Restore retains records and document hashes but requires new links; erasure follows DATA-0. | DATA-008. | none | none |
| QUOTE-009 | 5.1 — The quote-validity setting is owner-only, 1–3650 calendar days, default 30 for new revisio. | The quote-validity setting is owner-only | none | none |
| QUOTE-009 | 5.2 — The quote-validity setting is owner-only, 1–3650 calendar days, default 30 for new revisio. | 1–3650 calendar days | none | none |
| QUOTE-009 | 5.3 — The quote-validity setting is owner-only, 1–3650 calendar days, default 30 for new revisio. | default 30 for new revisions. | none | none |
| QUOTE-009 | 6.1 — Drafts and revisions take an optional real validUntil date; validity includes that date in. | Drafts and revisions take an optional real validUntil date | none | none |
| QUOTE-009 | 6.2 — Drafts and revisions take an optional real validUntil date; validity includes that date in. | validity includes that date in the frozen branch/business zone | none | none |
| QUOTE-009 | 6.3 — Drafts and revisions take an optional real validUntil date; validity includes that date in. | the link expires at local midnight starting the day after validity plus 90 calendar days. | none | none |
| QUOTE-009 | 7.1 — Defaults change later revisions only. | Defaults change later revisions only. | none | none |
| QUOTE-009 | 8.1 — Legacy revisions without validity must be revised and price-approved before a link can be. | Legacy revisions without validity must be revised and price-approved before a link can be issued. | none | none |
| QUOTE-010 | 1.1 — The final signing capability must record an affirmed versioned consent disclosure and its. | The final signing capability must record an affirmed versioned consent disclosure | none | none |
| QUOTE-010 | 1.2 — The final signing capability must record an affirmed versioned consent disclosure and its. | its hash | none | none |
| QUOTE-010 | 1.3 — The final signing capability must record an affirmed versioned consent disclosure and its. | revision document hash | none | none |
| QUOTE-010 | 1.4 — The final signing capability must record an affirmed versioned consent disclosure and its. | drawn or typed signature | none | none |
| QUOTE-010 | 1.5 — The final signing capability must record an affirmed versioned consent disclosure and its. | signer and claimed capacity | none | none |
| QUOTE-010 | 1.6 — The final signing capability must record an affirmed versioned consent disclosure and its. | authentication basis | none | none |
| QUOTE-010 | 1.7 — The final signing capability must record an affirmed versioned consent disclosure and its. | link ID | none | none |
| QUOTE-010 | 1.8 — The final signing capability must record an affirmed versioned consent disclosure and its. | time | none | none |
| QUOTE-010 | 1.9 — The final signing capability must record an affirmed versioned consent disclosure and its. | IP address and browser | none | none |
| QUOTE-010 | 1.10 — The final signing capability must record an affirmed versioned consent disclosure and its. | then freeze the signed copy | none | none |
| QUOTE-010 | 1.11 — The final signing capability must record an affirmed versioned consent disclosure and its. | its hash | none | none |
| QUOTE-010 | 1.12 — The final signing capability must record an affirmed versioned consent disclosure and its. | send a confirmation copy to the on-record email when COMM-001 | none | none |
| QUOTE-010 | 1.21 — The final signing capability must record an affirmed versioned consent disclosure and its. | COMM-018 is connected. | none | none |
| QUOTE-010 | 2.1 — The signing flow follows BASE-ACCESSIBILITY-001 and always offers a typed signature. | The signing flow follows BASE-ACCESSIBILITY-001 and always offers a typed signature. | none | none |
| QUOTE-010 | 3.1 — Production signing waits for the owner's accepted concrete consent disclosure; no ESIGN, U. | Production signing waits for the owner's accepted concrete consent disclosure | none | none |
| QUOTE-010 | 3.2 — Production signing waits for the owner's accepted concrete consent disclosure; no ESIGN, U. | no ESIGN | none | none |
| QUOTE-010 | 3.3 — Production signing waits for the owner's accepted concrete consent disclosure; no ESIGN, U. | UETA or eIDAS validity is claimed. | none | none |
| QUOTE-010 | 4.1 — A signed-in unscoped owner uses the signing-consent setting to enter and explicitly accept. | A signed-in unscoped owner uses the signing-consent setting to enter and explicitly accept concrete disclosure | none | none |
| QUOTE-010 | 4.2 — A signed-in unscoped owner uses the signing-consent setting to enter and explicitly accept. | no default text or environment bypass is supplied. | none | none |
| QUOTE-010 | 5.1 — Each accepted disclosure has a numbered version, hash and owner/time history; changing it. | Each accepted disclosure has a numbered version | none | none |
| QUOTE-010 | 5.2 — Each accepted disclosure has a numbered version, hash and owner/time history; changing it. | hash and owner/time history | none | none |
| QUOTE-010 | 5.3 — Each accepted disclosure has a numbered version, hash and owner/time history; changing it. | changing it or disabling signing refuses signatures prepared under the old disclosure. | none | none |
| QUOTE-010 | 6.1 — The customer reviews a server-hashed chosen document, affirms that disclosure and signs wi. | The customer reviews a server-hashed chosen document | none | none |
| QUOTE-010 | 6.2 — The customer reviews a server-hashed chosen document, affirms that disclosure and signs wi. | affirms that disclosure and signs with bounded drawn strokes or a typed signature. | none | none |
| QUOTE-010 | 7.1 — Approval uses the ordinary exact chosen option/add-on calculation and first-decision freez. | Approval uses the ordinary exact chosen option/add-on calculation and first-decision freeze. | none | none |
| QUOTE-010 | 8.1 — The winning record contains claimed name/capacity, authentication basis, link ID, time, IP. | The winning record contains claimed name/capacity | none | none |
| QUOTE-010 | 8.2 — The winning record contains claimed name/capacity, authentication basis, link ID, time, IP. | authentication basis | none | none |
| QUOTE-010 | 8.3 — The winning record contains claimed name/capacity, authentication basis, link ID, time, IP. | link ID | none | none |
| QUOTE-010 | 8.4 — The winning record contains claimed name/capacity, authentication basis, link ID, time, IP. | time | none | none |
| QUOTE-010 | 8.5 — The winning record contains claimed name/capacity, authentication basis, link ID, time, IP. | IP (or explicit unavailable) | none | none |
| QUOTE-010 | 8.6 — The winning record contains claimed name/capacity, authentication basis, link ID, time, IP. | browser | none | none |
| QUOTE-010 | 8.7 — The winning record contains claimed name/capacity, authentication basis, link ID, time, IP. | signature | none | none |
| QUOTE-010 | 8.8 — The winning record contains claimed name/capacity, authentication basis, link ID, time, IP. | disclosure version/text/hash and both revision/chosen document hashes. | none | none |
| QUOTE-011 | 1.1 — The immutable self-contained HTML copy embeds its original images and signature and is sto. | The immutable self-contained HTML copy embeds its original images and signature and is stored with a verified SHA-256 | none | none |
| QUOTE-011 | 1.2 — The immutable self-contained HTML copy embeds its original images and signature and is sto. | desk and live customer-link doors return those same bytes. | none | none |
| QUOTE-012 | 1.1 — Issuing a quote link and revoking a quote link require a signed-in person allowed to recor. | Issuing a quote link and revoking a quote link require a signed-in person allowed to record that quote as sent | none | none |
| QUOTE-012 | 1.2 — Issuing a quote link and revoking a quote link require a signed-in person allowed to recor. | never an integration token. | none | none |
| QUOTE-012 | 2.1 — A link freezes a customer-only document and canonical SHA-256, with price-book customer de. | A link freezes a customer-only document and canonical SHA-256 | none | none |
| QUOTE-012 | 2.2 — A link freezes a customer-only document and canonical SHA-256, with price-book customer de. | with price-book customer descriptions captured when priced | none | none |
| QUOTE-012 | 2.3 — A link freezes a customer-only document and canonical SHA-256, with price-book customer de. | costs | none | none |
| QUOTE-012 | 2.4 — A link freezes a customer-only document and canonical SHA-256, with price-book customer de. | internal evidence and unrelated customer details are excluded. | none | none |
| QUOTE-012 | 3.1 — The desk shares it outside Glove, labelled recipient unverified, or queues it to the custo. | The desk shares it outside Glove | none | none |
| QUOTE-012 | 3.2 — The desk shares it outside Glove, labelled recipient unverified, or queues it to the custo. | labelled recipient unverified | none | none |
| QUOTE-012 | 3.3 — The desk shares it outside Glove, labelled recipient unverified, or queues it to the custo. | or queues it to the customer's on-record address through COMM-001 | none | none |
| QUOTE-012 | 3.12 — The desk shares it outside Glove, labelled recipient unverified, or queues it to the custo. | COMM-018 with the actual provider outcome. | none | none |
| QUOTE-012 | 4.1 — A customer response records “link sent by Glove to the address on record” only once a prov. | A customer response records “link sent by Glove to the address on record” only once a provider fact confirms the provider took the email | none | none |
| QUOTE-012 | 4.2 — A customer response records “link sent by Glove to the address on record” only once a prov. | a refused or unconfirmed send retains the staff-handed | none | none |
| QUOTE-012 | 4.3 — A customer response records “link sent by Glove to the address on record” only once a prov. | recipient-unverified basis. | none | none |
| QUOTE-012 | 5.1 — The customer quote door reads only that revision; same-origin JSON responses can request c. | The customer quote door reads only that revision | none | none |
| QUOTE-012 | 5.2 — The customer quote door reads only that revision; same-origin JSON responses can request c. | same-origin JSON responses can request changes | none | none |
| QUOTE-012 | 5.3 — The customer quote door reads only that revision; same-origin JSON responses can request c. | decline with a claimed name and capacity | none | none |
| QUOTE-012 | 5.4 — The customer quote door reads only that revision; same-origin JSON responses can request c. | or request an update once per revision. | none | none |
| QUOTE-012 | 6.1 — Changes and updates enter the office queue, Activity, property history, COMM-007 stream an. | Changes and updates enter the office queue | none | none |
| QUOTE-012 | 6.2 — Changes and updates enter the office queue, Activity, property history, COMM-007 stream an. | Activity | none | none |
| QUOTE-012 | 6.3 — Changes and updates enter the office queue, Activity, property history, COMM-007 stream an. | property history | none | none |
| QUOTE-012 | 6.4 — Changes and updates enter the office queue, Activity, property history, COMM-007 stream an. | COMM-007 stream and business export | none | none |
| QUOTE-012 | 6.5 — Changes and updates enter the office queue, Activity, property history, COMM-007 stream an. | an update reopens the originating request as contacted. | none | none |
| QUOTE-012 | 7.1 — A decline competes atomically with staff decisions and makes the revision read-only. | A decline competes atomically with staff decisions and makes the revision read-only. | none | none |
| QUOTE-012 | 8.1 — Issuer role removal, branch restriction, revocation and expiry are enforced again in the c. | Issuer role removal | none | none |
| QUOTE-012 | 8.2 — Issuer role removal, branch restriction, revocation and expiry are enforced again in the c. | branch restriction | none | none |
| QUOTE-012 | 8.3 — Issuer role removal, branch restriction, revocation and expiry are enforced again in the c. | revocation and expiry are enforced again in the commit batch. | none | none |
| QUOTE-013 | 1.1 — A connected COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016. | A connected COMM-001 | none | none |
| QUOTE-013 | 1.10 — A connected COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016. | COMM-018 provider receives the winning HTML and text confirmation once after commit to the on-record email | none | none |
| QUOTE-013 | 1.11 — A connected COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016. | actual provider outcomes remain separate from signing. | none | none |
| QUOTE-013 | 2.1 — A refused confirmation does not undo the signature or claim delivery. | A refused confirmation does not undo the signature or claim delivery. | none | none |
| QUOTE-013 | 3.1 — Reissue for an accepted/declined quote is read-only and preserves the frozen revision. | Reissue for an accepted/declined quote is read-only and preserves the frozen revision. | none | none |
| QUOTE-013 | 4.5 — DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 removes signed-copy chunks and signature. | DATA-008 removes signed-copy chunks and signature evidence | none | none |
| QUOTE-013 | 4.6 — DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 removes signed-copy chunks and signature. | rer export/import preserves their exact bytes while excluding bearer credentials. | none | none |
| QUOTE-013 | 5.1 — Typed signing is always available by keyboard at 390 px, disclosure text and consent contr. | Typed signing is always available by keyboard at 390 px | none | none |
| QUOTE-013 | 5.2 — Typed signing is always available by keyboard at 390 px, disclosure text and consent contr. | disclosure text and consent controls retain labels/focus | none | none |
| QUOTE-013 | 5.3 — Typed signing is always available by keyboard at 390 px, disclosure text and consent contr. | the signing page reflows without sideways scroll. | none | none |
| QUOTE-013 | 6.1 — No verified-identity or ESIGN/UETA/eIDAS validity claim is made. | No verified-identity or ESIGN/UETA/eIDAS validity claim is made. | none | none |
| QUOTE-005 | 1.1 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds lo. | A fixture edits the quote template | none | none |
| QUOTE-005 | 1.2 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds lo. | opens a quote as a customer and as a PDF | none | none |
| QUOTE-005 | 1.3 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds lo. | finds logo | none | none |
| QUOTE-005 | 1.4 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds lo. | license number | none | none |
| QUOTE-005 | 1.5 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds lo. | terms | none | none |
| QUOTE-005 | 1.6 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds lo. | an attached photo | none | none |
| QUOTE-005 | 1.7 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds lo. | each price-book line's customer-facing description (MONEY-003, MONEY-006) in both | none | none |
| QUOTE-005 | 1.8 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds lo. | it then opens an invoice | none | none |
| QUOTE-005 | 1.9 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds lo. | a service report | none | none |
| QUOTE-005 | 1.10 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds lo. | finds the EIN | none | none |
| QUOTE-005 | 1.11 — A fixture edits the quote template, opens a quote as a customer and as a PDF, and finds lo. | two license numbers and logo set under MONEY-002 printed on each. | none | none |
| QUOTE-005 | 2.1 — The signed-in owner edits plain-text heading, terms and footer per document kind, and expl. | The signed-in owner edits plain-text heading | none | none |
| QUOTE-005 | 2.2 — The signed-in owner edits plain-text heading, terms and footer per document kind, and expl. | terms and footer per document kind | none | none |
| QUOTE-005 | 2.3 — The signed-in owner edits plain-text heading, terms and footer per document kind, and expl. | explicitly attaches customer-facing photos. | none | none |
| QUOTE-005 | 3.1 — Issuing a quote link freezes the business identity, template, line descriptions/images and. | Issuing a quote link freezes the business identity | none | none |
| QUOTE-005 | 3.2 — Issuing a quote link freezes the business identity, template, line descriptions/images and. | template | none | none |
| QUOTE-005 | 3.3 — Issuing a quote link freezes the business identity, template, line descriptions/images and. | line descriptions/images and attachments in its hashed customer document | none | none |
| QUOTE-005 | 3.4 — Issuing a quote link freezes the business identity, template, line descriptions/images and. | completing a report freezes the same identity/template with every report field. | none | none |
| QUOTE-005 | 4.1 — Later edits never change those snapshots. | Later edits never change those snapshots. | none | none |
| QUOTE-005 | 5.1 — Invoices and agreements use their current desk-authorized projection and current template. | Invoices and agreements use their current desk-authorized projection and current template | none | none |
| QUOTE-005 | 5.2 — Invoices and agreements use their current desk-authorized projection and current template. | invoice lines retain the approved job’s customer descriptions/images. | none | none |
| QUOTE-015 | 1.1 — Existing role, branch, revision and original-file guards apply. | Existing role | none | none |
| QUOTE-015 | 1.2 — Existing role, branch, revision and original-file guards apply. | branch | none | none |
| QUOTE-015 | 1.3 — Existing role, branch, revision and original-file guards apply. | revision and original-file guards apply. | none | none |
| QUOTE-015 | 2.1 — Dates use US calendar presentation and ten-digit phones use US punctuation; saved legacy a. | Dates use US calendar presentation and ten-digit phones use US punctuation | none | none |
| QUOTE-015 | 2.2 — Dates use US calendar presentation and ten-digit phones use US punctuation; saved legacy a. | saved legacy addresses and time zones remain as recorded. | none | none |
| QUOTE-015 | 3.1 — Print / Save PDF invokes the browser’s print renderer after removing a bearer fragment, re. | Print / Save PDF invokes the browser’s print renderer after removing a bearer fragment | none | none |
| QUOTE-015 | 3.2 — Print / Save PDF invokes the browser’s print renderer after removing a bearer fragment, re. | restores the link after printing | none | none |
| QUOTE-015 | 3.3 — Print / Save PDF invokes the browser’s print renderer after removing a bearer fragment, re. | includes the whole document and hides response controls. | none | none |
| QUOTE-015 | 4.1 — No signing, send or delivery claim is added; QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, Q. | No signing | none | none |
| QUOTE-015 | 4.2 — No signing, send or delivery claim is added; QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, Q. | send or delivery claim is added | none | none |
| QUOTE-015 | 4.9 — No signing, send or delivery claim is added; QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, Q. | QUOTE-013/006 retain their owner-disclosure gate and COMM-006 | none | none |
| QUOTE-015 | 4.13 — No signing, send or delivery claim is added; QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, Q. | COMM-025 inherits the same document and original-file restrictions. | none | none |
| QUOTE-007 | 1.1 — A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) wi. | A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) with a $50.00 non-taxable first-time-customer discount line | none | none |
| QUOTE-007 | 1.2 — A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) wi. | a 10% document discount | none | none |
| QUOTE-007 | 1.3 — A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) wi. | checks subtotal $650.00 | none | none |
| QUOTE-007 | 1.4 — A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) wi. | discount $65.00 taken from labor | none | none |
| QUOTE-007 | 1.5 — A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) wi. | tax $33.00 and total $618.00 | none | none |
| QUOTE-007 | 1.6 — A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) wi. | a 50% document discount on the same lines spills $75.00 onto the parts and gives tax $26.81 and total $351.81 | none | none |
| QUOTE-007 | 1.7 — A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) wi. | the accepted figures are identical to the cent on the job | none | none |
| QUOTE-007 | 1.8 — A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) wi. | the invoice | none | none |
| QUOTE-007 | 1.9 — A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) wi. | the CSV | none | none |
| QUOTE-007 | 1.10 — A fixture quotes parts of $400.00 (taxable at 8.25%) and labor of $300.00 (non-taxable) wi. | the explicitly mapped QuickBooks inspection payload. | none | none |
| QUOTE-007 | 2.1 — A discount line is a line whose unit price is negative (-50.00), custom or from a price-bo. | A discount line is a line whose unit price is negative (-50.00) | none | none |
| QUOTE-007 | 2.2 — A discount line is a line whose unit price is negative (-50.00), custom or from a price-bo. | custom or from a price-book item of kind discount (a fixed negative price | none | none |
| QUOTE-007 | 2.3 — A discount line is a line whose unit price is negative (-50.00), custom or from a price-bo. | no cost) | none | none |
| QUOTE-007 | 2.4 — A discount line is a line whose unit price is negative (-50.00), custom or from a price-bo. | its line total rounds half a cent away from zero. | none | none |
| QUOTE-007 | 3.1 — Each line is taxable or non-taxable as MONEY-001, MONEY-004, MONEY-005 decides (item fla. | Each line is taxable or non-taxable as MONEY-001, MONEY-004, MONEY-005 decides (item flag | none | none |
| QUOTE-007 | 3.2 — Each line is taxable or non-taxable as MONEY-001, MONEY-004, MONEY-005 decides (item fla. | labor rule | none | none |
| QUOTE-007 | 3.3 — Each line is taxable or non-taxable as MONEY-001, MONEY-004, MONEY-005 decides (item fla. | exemption) | none | none |
| QUOTE-007 | 3.4 — Each line is taxable or non-taxable as MONEY-001, MONEY-004, MONEY-005 decides (item fla. | discount lines may not take either pool below zero. | none | none |
| QUOTE-007 | 4.1 — The document discount is a percent of the subtotal (above 0 to 100, two places, amount rou. | The document discount is a percent of the subtotal (above 0 to 100 | none | none |
| QUOTE-007 | 4.2 — The document discount is a percent of the subtotal (above 0 to 100, two places, amount rou. | two places | none | none |
| QUOTE-007 | 4.3 — The document discount is a percent of the subtotal (above 0 to 100, two places, amount rou. | amount rounded half up to the cent) or a fixed dollar amount | none | none |
| QUOTE-007 | 4.4 — The document discount is a percent of the subtotal (above 0 to 100, two places, amount rou. | never above the subtotal | none | none |
| QUOTE-007 | 4.5 — The document discount is a percent of the subtotal (above 0 to 100, two places, amount rou. | with a reason up to 100 characters. | none | none |
| QUOTE-007 | 5.1 — It comes off the non-taxable lines first (line order, each line at most its own amount), t. | It comes off the non-taxable lines first (line order | none | none |
| QUOTE-007 | 5.2 — It comes off the non-taxable lines first (line order, each line at most its own amount), t. | each line at most its own amount) | none | none |
| QUOTE-007 | 5.3 — It comes off the non-taxable lines first (line order, each line at most its own amount), t. | then taxable lines in line order | none | none |
| QUOTE-007 | 5.4 — It comes off the non-taxable lines first (line order, each line at most its own amount), t. | tax is the jurisdiction rate on the remaining taxable cents | none | none |
| QUOTE-007 | 5.5 — It comes off the non-taxable lines first (line order, each line at most its own amount), t. | rounded half up once | none | none |
| QUOTE-007 | 5.6 — It comes off the non-taxable lines first (line order, each line at most its own amount), t. | the total is subtotal − discount + tax. | none | none |
| QUOTE-007 | 6.1 — Each quote option carries its own discount; add-ons take discount lines only; on acceptanc. | Each quote option carries its own discount | none | none |
| QUOTE-007 | 6.2 — Each quote option carries its own discount; add-ons take discount lines only; on acceptanc. | add-ons take discount lines only | none | none |
| QUOTE-007 | 6.3 — Each quote option carries its own discount; add-ons take discount lines only; on acceptanc. | on acceptance the chosen option's discount applies to the accepted lines (a percent re-applies to their subtotal | none | none |
| QUOTE-007 | 6.4 — Each quote option carries its own discount; add-ons take discount lines only; on acceptanc. | an amount stays fixed). | none | none |
| QUOTE-007 | 7.1 — The job and invoice carry it; an invoice revision or correction keeps it unless the payloa. | The job and invoice carry it | none | none |
| QUOTE-007 | 7.2 — The job and invoice carry it; an invoice revision or correction keeps it unless the payloa. | an invoice revision or correction keeps it unless the payload sets another. | none | none |
| QUOTE-007 | 8.1 — The CSV writes the discount as up to two rows (non-taxable and taxable amounts); the Quick. | The CSV writes the discount as up to two rows (non-taxable and taxable amounts) | none | none |
| QUOTE-007 | 8.2 — The CSV writes the discount as up to two rows (non-taxable and taxable amounts); the Quick. | the QuickBooks inspection payload writes a DiscountLineDetail with tax after discount and both amounts in its description | none | none |
| QUOTE-007 | 8.3 — The CSV writes the discount as up to two rows (non-taxable and taxable amounts); the Quick. | revenue reports and job costing use subtotal less discount. | none | none |
| QUOTE-019 | 1.1 — Limits: the owner is unlimited; business save action discountLimits gives each built-in or. | Limits: the owner is unlimited | none | none |
| QUOTE-019 | 1.2 — Limits: the owner is unlimited; business save action discountLimits gives each built-in or. | business save action discountLimits gives each built-in or custom role a maximum percent of the document's gross (positive-line) subtotal | none | none |
| QUOTE-019 | 1.3 — Limits: the owner is unlimited; business save action discountLimits gives each built-in or. | counting discount lines | none | none |
| QUOTE-019 | 1.4 — Limits: the owner is unlimited; business save action discountLimits gives each built-in or. | the document discount together | none | none |
| QUOTE-019 | 1.5 — Limits: the owner is unlimited; business save action discountLimits gives each built-in or. | an unlisted role gives none | none | none |
| QUOTE-019 | 1.6 — Limits: the owner is unlimited; business save action discountLimits gives each built-in or. | checked on person and agent quote drafts and revisions and invoice preparations | none | none |
| QUOTE-019 | 1.7 — Limits: the owner is unlimited; business save action discountLimits gives each built-in or. | revisions and corrections | none | none |
| QUOTE-019 | 1.8 — Limits: the owner is unlimited; business save action discountLimits gives each built-in or. | carrying an accepted quote's discount unchanged is not giving one | none | none |
| QUOTE-019 | 1.9 — Limits: the owner is unlimited; business save action discountLimits gives each built-in or. | A binding price decision carries commitment when an agent makes it | none | none |
| QUOTE-019 | 1.10 — Limits: the owner is unlimited; business save action discountLimits gives each built-in or. | the company’s policy decides that call | none | none |
| QUOTE-019 | 1.11 — Limits: the owner is unlimited; business save action discountLimits gives each built-in or. | a person’s own price approval remains their own act. | none | none |
| DISP-001 | 1.1 — A fixture at 1440 px drags an unscheduled job onto a technician, moves it to another day. | A fixture at 1440 px drags an unscheduled job onto a technician | none | none |
| DISP-001 | 1.2 — A fixture at 1440 px drags an unscheduled job onto a technician, moves it to another day. | moves it to another day | none | none |
| DISP-001 | 1.3 — A fixture at 1440 px drags an unscheduled job onto a technician, moves it to another day. | triggers and confirms a conflict review | none | none |
| DISP-001 | 1.4 — A fixture at 1440 px drags an unscheduled job onto a technician, moves it to another day. | repeats the move with the keyboard. | none | none |
| DISP-001 | 2.1 — The board shows a day (one row per technician across the hours), a week (Sunday to Saturda. | The board shows a day (one row per technician across the hours) | none | none |
| DISP-001 | 2.2 — The board shows a day (one row per technician across the hours), a week (Sunday to Saturda. | a week (Sunday to Saturday | none | none |
| DISP-001 | 2.3 — The board shows a day (one row per technician across the hours), a week (Sunday to Saturda. | technicians by day) or a month (weeks of days | none | none |
| DISP-001 | 2.4 — The board shows a day (one row per technician across the hours), a week (Sunday to Saturda. | all technicians or one) | none | none |
| DISP-001 | 2.5 — The board shows a day (one row per technician across the hours), a week (Sunday to Saturda. | in the business time zone | none | none |
| DISP-001 | 2.6 — The board shows a day (one row per technician across the hours), a week (Sunday to Saturda. | inactive technicians show only where they have visits in the shown range. | none | none |
| DISP-001 | 3.1 — The unscheduled list is the "Waiting to book" card: accepted quotes still to become jobs a. | The unscheduled list is the "Waiting to book" card: accepted quotes still to become jobs and open jobs with no booked or started visit. | none | none |
| DISP-001 | 4.1 — Dragging an unscheduled job onto a technician books it (visit book action) for one hour at. | Dragging an unscheduled job onto a technician books it (visit book action) for one hour at the dropped quarter hour in the day | none | none |
| DISP-001 | 4.2 — Dragging an unscheduled job onto a technician books it (visit book action) for one hour at. | or at 9:00 on the dropped day in the week and month (in the month for the chosen technician | none | none |
| DISP-001 | 4.3 — Dragging an unscheduled job onto a technician books it (visit book action) for one hour at. | else the first active one). | none | none |
| DISP-001 | 5.1 — Dragging a booked or started visit moves it to the dropped quarter hour, day and technicia. | Dragging a booked or started visit moves it to the dropped quarter hour | none | none |
| DISP-001 | 5.2 — Dragging a booked or started visit moves it to the dropped quarter hour, day and technicia. | day and technician keeping its length | none | none |
| DISP-001 | 5.3 — Dragging a booked or started visit moves it to the dropped quarter hour, day and technicia. | dragging its right edge in the day changes its end | none | none |
| DISP-001 | 5.4 — Dragging a booked or started visit moves it to the dropped quarter hour, day and technicia. | each drop asks for the reason and is a GLOVE-07 change (visit change action) with its conflict review. | none | none |
| DISP-001 | 6.1 — The keyboard path on a focused visit: left and right move it a quarter hour in the day and. | The keyboard path on a focused visit: left and right move it a quarter hour in the day | none | none |
| DISP-001 | 6.2 — The keyboard path on a focused visit: left and right move it a quarter hour in the day and. | a day in the week and month | none | none |
| DISP-001 | 6.3 — The keyboard path on a focused visit: left and right move it a quarter hour in the day and. | up and down change technician (a week in the month) | none | none |
| DISP-001 | 6.4 — The keyboard path on a focused visit: left and right move it a quarter hour in the day and. | Shift with left or right changes its end by a quarter hour in the day | none | none |
| DISP-001 | 6.5 — The keyboard path on a focused visit: left and right move it a quarter hour in the day and. | Enter reviews the change and Escape drops it | none | none |
| DISP-001 | 6.6 — The keyboard path on a focused visit: left and right move it a quarter hour in the day and. | booking by keyboard is the "Book a visit" form. | none | none |
| DISP-001 | 7.1 — Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by j. | Visits are colored by status (booked | none | none |
| DISP-001 | 7.2 — Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by j. | arrived | none | none |
| DISP-001 | 7.3 — Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by j. | completed | none | none |
| DISP-001 | 7.4 — Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by j. | late evidence | none | none |
| DISP-001 | 7.5 — Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by j. | conflict) or by job type (the category of the job's first price-book line | none | none |
| DISP-001 | 7.6 — Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by j. | else Uncategorized | none | none |
| DISP-001 | 7.7 — Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by j. | as in COST-004) | none | none |
| DISP-001 | 7.8 — Visits are colored by status (booked, arrived, completed, late evidence, conflict) or by j. | with a legend. | none | none |
| DISP-001 | 8.1 — Views by crew are DISP-007, DISP-013, DISP-014's Rows choice on the same board. | Views by crew are DISP-007, DISP-013, DISP-014's Rows choice on the same board. | none | none |
| DISP-002 | 1.1 — A fixture opens the map board with a fixture day, sees pins and drive times (provider fake. | A fixture opens the map board with a fixture day | none | none |
| DISP-002 | 1.2 — A fixture opens the map board with a fixture day, sees pins and drive times (provider fake. | sees pins and drive times (provider fake) | none | none |
| DISP-002 | 1.3 — A fixture opens the map board with a fixture day, sees pins and drive times (provider fake. | the technician's phone offers a directions link with the site's address | none | none |
| DISP-002 | 1.4 — A fixture opens the map board with a fixture day, sees pins and drive times (provider fake. | a flow test draws a zone for a technician | none | none |
| DISP-002 | 1.5 — A fixture opens the map board with a fixture day, sees pins and drive times (provider fake. | checks a booking at a site outside it gets the area warning. | none | none |
| DISP-002 | 2.1 — Only the owner connects Google Maps Platform with their own key, kept as an installation s. | Only the owner connects Google Maps Platform with their own key | none | none |
| DISP-002 | 2.2 — Only the owner connects Google Maps Platform with their own key, kept as an installation s. | kept as an installation secret (never in state | none | none |
| DISP-002 | 2.3 — Only the owner connects Google Maps Platform with their own key, kept as an installation s. | Activity | none | none |
| DISP-002 | 2.4 — Only the owner connects Google Maps Platform with their own key, kept as an installation s. | a command result | none | none |
| DISP-002 | 2.5 — Only the owner connects Google Maps Platform with their own key, kept as an installation s. | the business export | none | none |
| DISP-002 | 2.6 — Only the owner connects Google Maps Platform with their own key, kept as an installation s. | the installation archive or a log | none | none |
| DISP-002 | 2.7 — Only the owner connects Google Maps Platform with their own key, kept as an installation s. | a restored installation needs it entered again). | none | none |
| DISP-002 | 3.1 — While it is connected, saving a site with a new or changed address places it with Google's. | While it is connected | none | none |
| DISP-002 | 3.2 — While it is connected, saving a site with a new or changed address places it with Google's. | saving a site with a new or changed address places it with Google's Geocoding API (the street address only goes to Google) | none | none |
| DISP-002 | 3.3 — While it is connected, saving a site with a new or changed address places it with Google's. | keeps its latitude and longitude on the site | none | none |
| DISP-002 | 3.4 — While it is connected, saving a site with a new or changed address places it with Google's. | or says Google found no such place | none | none |
| DISP-002 | 3.5 — While it is connected, saving a site with a new or changed address places it with Google's. | the desk places listed sites again with site locate action. | none | none |
| DISP-002 | 4.1 — The day board shows a route map over the board (the day map, desk roles only): Google's ba. | The day board shows a route map over the board (the day map | none | none |
| DISP-002 | 4.2 — The day board shows a route map over the board (the day map, desk roles only): Google's ba. | desk roles only): Google's base map (Static Maps API | none | none |
| DISP-002 | 4.3 — The day board shows a route map over the board (the day map, desk roles only): Google's ba. | asked for by center and zoom only) under Glove's own numbered pins for each technician's stops in order | none | none |
| DISP-002 | 4.4 — The day board shows a route map over the board (the day map, desk roles only): Google's ba. | the legs between consecutive stops with the drive time and distance from Google's Routes API (driving | none | none |
| DISP-002 | 4.5 — The day board shows a route map over the board (the day map, desk roles only): Google's ba. | traffic-unaware | none | none |
| DISP-002 | 4.6 — The day board shows a route map over the board (the day map, desk roles only): Google's ba. | only the stops' coordinates go to Google) | none | none |
| DISP-002 | 4.7 — The day board shows a route map over the board (the day map, desk roles only): Google's ba. | the zones drawn for each technician | none | none |
| DISP-002 | 4.8 — The day board shows a route map over the board (the day map, desk roles only): Google's ba. | a stop whose site is not on the map is listed with **Place on the map**. | none | none |
| DISP-002 | 5.1 — On the technician's phone each visit offers directions to the site's address in Apple Maps. | On the technician's phone each visit offers directions to the site's address in Apple Maps | none | none |
| DISP-002 | 5.2 — On the technician's phone each visit offers directions to the site's address in Apple Maps. | Google Maps or Waze. | none | none |
| DISP-002 | 6.1 — The owner draws a technician's zones on the map (technician zones action: up to 20 named p. | The owner draws a technician's zones on the map (technician zones action: up to 20 named polygons of 3 to 100 corners | none | none |
| DISP-002 | 6.2 — The owner draws a technician's zones on the map (technician zones action: up to 20 named p. | by clicking corners or typing them). | none | none |
| DISP-002 | 7.1 — A technician's service area is their ZIP codes and drawn zones together: with zones drawn. | A technician's service area is their ZIP codes and drawn zones together: with zones drawn | none | none |
| DISP-002 | 7.2 — A technician's service area is their ZIP codes and drawn zones together: with zones drawn. | a site whose ZIP is not listed and which is not inside any zone (a site not on the map is inside none) falls under the owner's area rule | none | none |
| DISP-002 | 7.3 — A technician's service area is their ZIP codes and drawn zones together: with zones drawn. | warned for review or refused | none | none |
| DISP-002 | 7.4 — A technician's service area is their ZIP codes and drawn zones together: with zones drawn. | exactly as DISP-004's ZIP rule. | none | none |
| DISP-010 | 1.1 — travel time from the previous visit joins the automatic-assignment ranking. | travel time from the previous visit joins the automatic-assignment ranking. | none | none |
| DISP-010 | 2.1 — With Google Maps connected, DISP-006's automatic assignment adds to each candidate's boo. | With Google Maps connected | none | none |
| DISP-010 | 2.2 — With Google Maps connected, DISP-006's automatic assignment adds to each candidate's boo. | DISP-006's automatic assignment adds to each candidate's booked minutes their drive minutes from their previous visit that day (the latest ending by the new start | none | none |
| DISP-010 | 2.3 — With Google Maps connected, DISP-006's automatic assignment adds to each candidate's boo. | none | none | none |
| DISP-010 | 2.4 — With Google Maps connected, DISP-006's automatic assignment adds to each candidate's boo. | no drive) to the job's site | none | none |
| DISP-010 | 2.5 — With Google Maps connected, DISP-006's automatic assignment adds to each candidate's boo. | picks the fewest booked-plus-drive minutes | none | none |
| DISP-010 | 2.6 — With Google Maps connected, DISP-006's automatic assignment adds to each candidate's boo. | then by name | none | none |
| DISP-010 | 2.7 — With Google Maps connected, DISP-006's automatic assignment adds to each candidate's boo. | naming each one's booked and drive minutes in the ranking | none | none |
| DISP-010 | 2.8 — With Google Maps connected, DISP-006's automatic assignment adds to each candidate's boo. | a site Google cannot place | none | none |
| DISP-010 | 2.9 — With Google Maps connected, DISP-006's automatic assignment adds to each candidate's boo. | or a drive with no route | none | none |
| DISP-010 | 2.10 — With Google Maps connected, DISP-006's automatic assignment adds to each candidate's boo. | refuses the automatic booking so the dispatcher chooses. | none | none |
| DISP-010 | 3.1 — Live technician positions are DISP-005, DISP-012's, and route optimization DISP-003, DI. | Live technician positions are DISP-005, DISP-012's | none | none |
| DISP-010 | 3.2 — Live technician positions are DISP-005, DISP-012's, and route optimization DISP-003, DI. | route optimization DISP-003, DISP-011's | none | none |
| DISP-010 | 3.3 — Live technician positions are DISP-005, DISP-012's, and route optimization DISP-003, DI. | each carrying the map board in its text and acceptance. | none | none |
| DISP-003 | 1.1 — A fixture optimizes a fixture day of 12 visits for 3 technicians (routing provider fake). | A fixture optimizes a fixture day of 12 visits for 3 technicians (routing provider fake) | none | none |
| DISP-003 | 1.2 — A fixture optimizes a fixture day of 12 visits for 3 technicians (routing provider fake). | checks no arrival window or skill is broken | none | none |
| DISP-003 | 1.3 — A fixture optimizes a fixture day of 12 visits for 3 technicians (routing provider fake). | the drive time falls | none | none |
| DISP-003 | 1.4 — A fixture optimizes a fixture day of 12 visits for 3 technicians (routing provider fake). | checks nothing moves until accepted. | none | none |
| DISP-003 | 2.1 — A signed-in owner or dispatcher requests a day or one technician with route optimize actio. | A signed-in owner or dispatcher requests a day or one technician with route optimize action | none | none |
| DISP-003 | 2.2 — A signed-in owner or dispatcher requests a day or one technician with route optimize actio. | the existing 15-minute Worker cron claims one durable job per pass. | none | none |
| DISP-003 | 3.1 — A job covers 2–20 visits and up to 8 assigned technicians. | A job covers 2–20 visits and up to 8 assigned technicians. | none | none |
| DISP-003 | 4.1 — It requests coordinate-only, traffic-unaware Google Routes driving times with a ten-second. | It requests coordinate-only | none | none |
| DISP-003 | 4.2 — It requests coordinate-only, traffic-unaware Google Routes driving times with a ten-second. | traffic-unaware Google Routes driving times with a ten-second abort | none | none |
| DISP-003 | 4.3 — It requests coordinate-only, traffic-unaware Google Routes driving times with a ten-second. | then performs at most 1 | none | none |
| DISP-003 | 4.4 — It requests coordinate-only, traffic-unaware Google Routes driving times with a ten-second. | 200 appointment exchanges within twenty seconds. | none | none |
| DISP-003 | 5.1 — It retains appointment duration and arrival windows, validates skills, working availabilit. | It retains appointment duration and arrival windows | none | none |
| DISP-003 | 5.2 — It retains appointment duration and arrival windows, validates skills, working availabilit. | validates skills | none | none |
| DISP-003 | 5.3 — It retains appointment duration and arrival windows, validates skills, working availabilit. | working availability | none | none |
| DISP-003 | 5.4 — It retains appointment duration and arrival windows, validates skills, working availabilit. | service areas | none | none |
| DISP-003 | 5.5 — It retains appointment duration and arrival windows, validates skills, working availabilit. | overlaps and driving time against the whole proposed schedule | none | none |
| DISP-003 | 5.6 — It retains appointment duration and arrival windows, validates skills, working availabilit. | keeps crews and visits with field evidence fixed. | none | none |
| DISP-003 | 6.1 — It saves the original and proposed slots and driving comparison; no visit moves in the bac. | It saves the original and proposed slots and driving comparison | none | none |
| DISP-003 | 6.2 — It saves the original and proposed slots and driving comparison; no visit moves in the bac. | no visit moves in the background. | none | none |
| DISP-003 | 7.1 — The board shows the proposal and time saved. | The board shows the proposal and time saved. | none | none |
| DISP-003 | 8.1 — The comparison measures driving between visits, with no depot legs; the bounded improvemen. | The comparison measures driving between visits | none | none |
| DISP-003 | 8.2 — The comparison measures driving between visits, with no depot legs; the bounded improvemen. | with no depot legs | none | none |
| DISP-003 | 8.3 — The comparison measures driving between visits, with no depot legs; the bounded improvemen. | the bounded improvement search does not claim a global optimum. | none | none |
| DISP-011 | 1.1 — Route accept action requires a person's reason, fresh live dispatch/branch authority, unch. | Route accept action requires a person's reason | none | none |
| DISP-011 | 1.2 — Route accept action requires a person's reason, fresh live dispatch/branch authority, unch. | fresh live dispatch/branch authority | none | none |
| DISP-011 | 1.3 — Route accept action requires a person's reason, fresh live dispatch/branch authority, unch. | unchanged day/eligibility dependencies | none | none |
| DISP-011 | 1.4 — Route accept action requires a person's reason, fresh live dispatch/branch authority, unch. | a fresh provider matrix | none | none |
| DISP-011 | 1.5 — Route accept action requires a person's reason, fresh live dispatch/branch authority, unch. | then commits every move and assignment history together. | none | none |
| DISP-011 | 2.1 — Discard, provider refusal, expiration and stale proposals move nothing. | Discard | none | none |
| DISP-011 | 2.2 — Discard, provider refusal, expiration and stale proposals move nothing. | provider refusal | none | none |
| DISP-011 | 2.3 — Discard, provider refusal, expiration and stale proposals move nothing. | expiration and stale proposals move nothing. | none | none |
| DISP-011 | 3.1 — Restore retains proposal metadata but requires Google Maps to be reconnected; customer era. | Restore retains proposal metadata but requires Google Maps to be reconnected | none | none |
| DISP-011 | 3.2 — Restore retains proposal metadata but requires Google Maps to be reconnected; customer era. | customer erasure discards affected undecided proposals and redacts their erased references. | none | none |
| DISP-005 | 1.1 — A fixture posts phone locations and a fleet-provider feed (fake), checks positions and ETA. | A fixture posts phone locations | none | none |
| DISP-005 | 1.2 — A fixture posts phone locations and a fleet-provider feed (fake), checks positions and ETA. | a fleet-provider feed (fake) | none | none |
| DISP-005 | 1.3 — A fixture posts phone locations and a fleet-provider feed (fake), checks positions and ETA. | checks positions and ETAs on the board | none | none |
| DISP-005 | 1.4 — A fixture posts phone locations and a fleet-provider feed (fake), checks positions and ETA. | checks no location is recorded after clock-out. | none | none |
| DISP-005 | 2.1 — Location sharing starts off. | Location sharing starts off. | none | none |
| DISP-005 | 3.1 — Only the technician's current person session can record or withdraw their explicit consent. | Only the technician's current person session can record or withdraw their explicit consent | none | none |
| DISP-005 | 3.2 — Only the technician's current person session can record or withdraw their explicit consent. | the phone requests browser permission and captures only while visible | none | none |
| DISP-005 | 3.3 — Only the technician's current person session can record or withdraw their explicit consent. | online | none | none |
| DISP-005 | 3.4 — Only the technician's current person session can record or withdraw their explicit consent. | clocked in and running a travel or job timer on its current assigned visit. | none | none |
| DISP-005 | 4.1 — Locations never enter the offline outbox. | Locations never enter the offline outbox. | none | none |
| DISP-005 | 5.1 — The owner can explicitly connect one Samsara vehicle per technician and request its curren. | The owner can explicitly connect one Samsara vehicle per technician and request its current GPS snapshot from the fixed documented host | none | none |
| DISP-005 | 5.2 — The owner can explicitly connect one Samsara vehicle per technician and request its curren. | that read requires the same consent | none | none |
| DISP-005 | 5.3 — The owner can explicitly connect one Samsara vehicle per technician and request its curren. | shift and visit checks. | none | none |
| DISP-005 | 6.1 — Coordinates captured before the shift or timer, more than two minutes ago, in the future b. | Coordinates captured before the shift or timer | none | none |
| DISP-005 | 6.2 — Coordinates captured before the shift or timer, more than two minutes ago, in the future b. | more than two minutes ago | none | none |
| DISP-005 | 6.3 — Coordinates captured before the shift or timer, more than two minutes ago, in the future b. | in the future beyond ten seconds | none | none |
| DISP-005 | 6.4 — Coordinates captured before the shift or timer, more than two minutes ago, in the future b. | or after assignment | none | none |
| DISP-005 | 6.5 — Coordinates captured before the shift or timer, more than two minutes ago, in the future b. | consent or sign-in withdrawal are refused. | none | none |
| DISP-005 | 7.1 — The most recent position replaces the previous one in transient storage; it is hidden afte. | The most recent position replaces the previous one in transient storage | none | none |
| DISP-005 | 7.2 — The most recent position replaces the previous one in transient storage; it is hidden afte. | it is hidden after two minutes and removed by the next product command | none | none |
| DISP-005 | 7.3 — The most recent position replaces the previous one in transient storage; it is hidden afte. | clock-out | none | none |
| DISP-005 | 7.4 — The most recent position replaces the previous one in transient storage; it is hidden afte. | timer stop | none | none |
| DISP-005 | 7.5 — The most recent position replaces the previous one in transient storage; it is hidden afte. | reassignment or consent withdrawal. | none | none |
| DISP-005 | 8.1 — Consent changes and generic capture outcomes are audited without coordinates. | Consent changes and generic capture outcomes are audited without coordinates. | none | none |
| DISP-012 | 1.1 — the delay watch adds a late technician's position and ETA to its at-risk reasons and same-. | the delay watch adds a late technician's position and ETA to its at-risk reasons and same-time options. | none | none |
| DISP-012 | 2.1 — A current position goes only to the owner within their branch scope, and its coordinates g. | A current position goes only to the owner within their branch scope | none | none |
| DISP-012 | 2.2 — A current position goes only to the owner within their branch scope, and its coordinates g. | its coordinates go to the already-connected Google Routes API for a traffic-unaware driving estimate to the next booked visit. | none | none |
| DISP-012 | 3.1 — This is a driving estimate from the moment of reading, not a departure promise; the delay. | This is a driving estimate from the moment of reading | none | none |
| DISP-012 | 3.2 — This is a driving estimate from the moment of reading, not a departure promise; the delay. | not a departure promise | none | none |
| DISP-012 | 3.3 — This is a driving estimate from the moment of reading, not a departure promise; the delay. | the delay watch retains its existing overrun and promised-window rules. | none | none |
| DISP-012 | 4.1 — Missing routes and stale positions never invent an ETA. | Missing routes and stale positions never invent an ETA. | none | none |
| DISP-012 | 5.1 — Coordinates and fleet keys are absent from state, Activity values, command results, busine. | Coordinates and fleet keys are absent from state | none | none |
| DISP-012 | 5.2 — Coordinates and fleet keys are absent from state, Activity values, command results, busine. | Activity values | none | none |
| DISP-012 | 5.3 — Coordinates and fleet keys are absent from state, Activity values, command results, busine. | command results | none | none |
| DISP-012 | 5.4 — Coordinates and fleet keys are absent from state, Activity values, command results, busine. | business exports and installation archives. | none | none |
| DISP-012 | 6.1 — Delegated Dispatcher and named-agent location views follow DISP-009’s current-shift grants. | Delegated Dispatcher and named-agent location views follow DISP-009’s current-shift grants. | none | none |
| DISP-012 | 7.1 — An agent’s location call carries standard and the company’s policy decides it within that. | An agent’s location call carries standard | none | none |
| DISP-012 | 7.2 — An agent’s location call carries standard and the company’s policy decides it within that. | the company’s policy decides it within that authority. | none | none |
| DISP-012 | 8.1 — COMM-004, COMM-021 inherits customer notices and FIELD-005 inherits native background. | COMM-004, COMM-021 inherits customer notices and FIELD-005 inherits native background capture before those capabilities ship. | none | none |
| DISP-006 | 1.1 — A fixture books three online requests and checks each lands on an eligible technician insi. | A fixture books three online requests | none | none |
| DISP-006 | 1.2 — A fixture books three online requests and checks each lands on an eligible technician insi. | checks each lands on an eligible technician inside its window | `tests/api/assessments.test.mjs:98`; `tests/api/assessments.test.mjs:99` | asserted |
| DISP-006 | 1.3 — A fixture books three online requests and checks each lands on an eligible technician insi. | then the dispatcher reassigns one with a GLOVE-07 review | none | none |
| DISP-006 | 1.4 — A fixture books three online requests and checks each lands on an eligible technician insi. | an assessment on a request is booked with its arrival window. | none | none |
| DISP-006 | 2.1 — Visit book action, crew bookings, BOOK-005 service-call visits, BOOK-006 assessment bo. | Visit book action | none | none |
| DISP-006 | 2.2 — Visit book action, crew bookings, BOOK-005 service-call visits, BOOK-006 assessment bo. | crew bookings | none | none |
| DISP-006 | 2.3 — Visit book action, crew bookings, BOOK-005 service-call visits, BOOK-006 assessment bo. | BOOK-005 service-call visits | none | none |
| DISP-006 | 2.4 — Visit book action, crew bookings, BOOK-005 service-call visits, BOOK-006 assessment bo. | BOOK-006 assessment book action | none | none |
| DISP-006 | 2.5 — Visit book action, crew bookings, BOOK-005 service-call visits, BOOK-006 assessment bo. | approved dispatch proposals take an optional an arrival window: wall-clock HH:MM on the visit's local date in its booking zone | none | none |
| DISP-006 | 2.6 — Visit book action, crew bookings, BOOK-005 service-call visits, BOOK-006 assessment bo. | start before end | none | none |
| DISP-006 | 2.7 — Visit book action, crew bookings, BOOK-005 service-call visits, BOOK-006 assessment bo. | kept on the visit as the arrival window beside the planned start and end. | `tests/api/assessments.test.mjs:63` | asserted |
| DISP-006 | 3.1 — The planned start must fall inside the window, both ends included; otherwise the booking i. | The planned start must fall inside the window | none | none |
| DISP-006 | 3.2 — The planned start must fall inside the window, both ends included; otherwise the booking i. | both ends included | none | none |
| DISP-006 | 3.3 — The planned start must fall inside the window, both ends included; otherwise the booking i. | otherwise the booking is refused. | none | none |
| DISP-006 | 4.1 — Visit change action keeps the visit's window unless it names a new one, and removing the w. | Visit change action keeps the visit's window unless it names a new one | `tests/api/assessments.test.mjs:70` | asserted |
| DISP-006 | 4.2 — Visit change action keeps the visit's window unless it names a new one, and removing the w. | removing the window removes it | `tests/api/assessments.test.mjs:75` | asserted |
| DISP-006 | 4.3 — Visit change action keeps the visit's window unless it names a new one, and removing the w. | a move whose planned start leaves the kept window is refused. | none | none |
| DISP-006 | 5.1 — The window shows in the booking event ("9:00 AM – 10:30 AM (arrival window 8:00 AM – 10:00. | The window shows in the booking event ("9:00 AM – 10:30 AM (arrival window 8:00 AM – 10:00 AM)") | `tests/api/assessments.test.mjs:64` | asserted |
| DISP-006 | 5.2 — The window shows in the booking event ("9:00 AM – 10:30 AM (arrival window 8:00 AM – 10:00. | on the dispatcher's visit panel and on the technician's phone. | `tests/api/assessments.test.mjs:66` | asserted |
| DISP-006 | 6.1 — Recurring series occurrences (PLAN-001, PLAN-006) carry no window. | Recurring series occurrences (PLAN-001, PLAN-006) carry no window. | none | none |
| DISP-006 | 7.1 — Visit book action (service calls included) and assessment book action also take automatic. | Visit book action (service calls included) and assessment book action also take automatic technician selection: Glove picks | none | none |
| DISP-006 | 7.2 — Visit book action (service calls included) and assessment book action also take automatic. | among active technicians in the job's branch with no conflict at that time (skills | none | none |
| DISP-006 | 7.3 — Visit book action (service calls included) and assessment book action also take automatic. | areas | none | none |
| DISP-006 | 7.4 — Visit book action (service calls included) and assessment book action also take automatic. | time off | none | none |
| DISP-006 | 7.5 — Visit book action (service calls included) and assessment book action also take automatic. | calendars | none | none |
| DISP-006 | 7.6 — Visit book action (service calls included) and assessment book action also take automatic. | other visits | none | none |
| DISP-006 | 7.7 — Visit book action (service calls included) and assessment book action also take automatic. | the owner's warn/refuse rules | none | none |
| DISP-006 | 7.8 — Visit book action (service calls included) and assessment book action also take automatic. | an out-of-area warning is a conflict | none | none |
| DISP-006 | 7.9 — Visit book action (service calls included) and assessment book action also take automatic. | so every candidate is in-area) | none | none |
| DISP-006 | 7.10 — Visit book action (service calls included) and assessment book action also take automatic. | the one with the fewest booked minutes on that local date | `tests/api/assessments.test.mjs:98` | asserted |
| DISP-006 | 7.11 — Visit book action (service calls included) and assessment book action also take automatic. | then by name | none | none |
| DISP-006 | 7.12 — Visit book action (service calls included) and assessment book action also take automatic. | the assignment records "Assigned automatically" with the ranking | `tests/api/assessments.test.mjs:100` | asserted |
| DISP-006 | 7.13 — Visit book action (service calls included) and assessment book action also take automatic. | the documented refusal answers when nobody is free | none | none |
| DISP-006 | 7.14 — Visit book action (service calls included) and assessment book action also take automatic. | the dispatcher overrides with visit change action under GLOVE-07 review. | `tests/api/assessments.test.mjs:109` | asserted |
| DISP-006 | 8.1 — With Google Maps connected, each candidate's drive from their previous visit that day join. | With Google Maps connected | none | none |
| DISP-006 | 8.2 — With Google Maps connected, each candidate's drive from their previous visit that day join. | each candidate's drive from their previous visit that day joins their booked minutes (DISP-002, DISP-010's semantics) | none | none |
| DISP-006 | 8.3 — With Google Maps connected, each candidate's drive from their previous visit that day join. | online bookings (BOOK-002, BOOK-011, BOOK-012, BOOK-013) | none | none |
| DISP-006 | 8.4 — With Google Maps connected, each candidate's drive from their previous visit that day join. | the front office (AGENT-001) call this assignment | none | none |
| DISP-006 | 8.5 — With Google Maps connected, each candidate's drive from their previous visit that day join. | each naming DISP-006 in its text and acceptance. | none | none |
| DISP-007 | 1.1 — A fixture books a three-day install for a two-person crew and a subcontractor, checks each. | A fixture books a three-day install for a two-person crew | none | none |
| DISP-007 | 1.2 — A fixture books a three-day install for a two-person crew and a subcontractor, checks each. | a subcontractor | none | none |
| DISP-007 | 1.3 — A fixture books a three-day install for a two-person crew and a subcontractor, checks each. | checks each sees only their visits | none | none |
| DISP-007 | 1.4 — A fixture books a three-day install for a two-person crew and a subcontractor, checks each. | checks the subcontractor's total in the 1099 export | none | none |
| DISP-007 | 1.5 — A fixture books a three-day install for a two-person crew and a subcontractor, checks each. | a browser journey drags the crew's visit to another day on the DISP-001 week board by crew. | none | none |
| DISP-007 | 2.1 — A job holds any number of visits over any days. | A job holds any number of visits over any days. | none | none |
| DISP-007 | 3.1 — The owner (acting for "admin") names crews of 2 to 10 active technicians or subcontractors. | The owner (acting for "admin") names crews of 2 to 10 active technicians or subcontractors | none | none |
| DISP-007 | 3.2 — The owner (acting for "admin") names crews of 2 to 10 active technicians or subcontractors. | changing a crew changes only later bookings. | none | none |
| DISP-007 | 4.1 — Booking a crew books one visit per member at the same date and times in one command, after. | Booking a crew books one visit per member at the same date and times in one command | none | none |
| DISP-007 | 4.2 — Booking a crew books one visit per member at the same date and times in one command, after. | after one review of every member's conflicts. | none | none |
| DISP-007 | 5.1 — Moving any visit of that booking moves every member's visit in it that is not completed or. | Moving any visit of that booking moves every member's visit in it that is not completed or canceled to the same date and times | none | none |
| DISP-007 | 5.2 — Moving any visit of that booking moves every member's visit in it that is not completed or. | never to another technician | none | none |
| DISP-007 | 5.3 — Moving any visit of that booking moves every member's visit in it that is not completed or. | after one review. | none | none |
| DISP-007 | 6.1 — Canceling cancels them all, and is refused while a member has recorded evidence on theirs. | Canceling cancels them all | none | none |
| DISP-007 | 6.2 — Canceling cancels them all, and is refused while a member has recorded evidence on theirs. | is refused while a member has recorded evidence on theirs. | none | none |
| DISP-007 | 7.1 — The dispatch board's Rows choice shows crews instead of technicians in the day, week and m. | The dispatch board's Rows choice shows crews instead of technicians in the day | none | none |
| DISP-007 | 7.2 — The dispatch board's Rows choice shows crews instead of technicians in the day, week and m. | week and month | none | none |
| DISP-007 | 7.3 — The dispatch board's Rows choice shows crews instead of technicians in the day, week and m. | one chip per crew booking | none | none |
| DISP-007 | 7.4 — The dispatch board's Rows choice shows crews instead of technicians in the day, week and m. | dragged or moved by keyboard as one. | none | none |
| DISP-013 | 1.1 — Subcontractor is a built-in role, invited and signed in like staff. | Subcontractor is a built-in role | none | none |
| DISP-013 | 1.2 — Subcontractor is a built-in role, invited and signed in like staff. | invited and signed in like staff. | none | none |
| DISP-013 | 2.1 — A subcontractor sees only the visits now assigned to them and, for those, the job title, c. | A subcontractor sees only the visits now assigned to them and | none | none |
| DISP-013 | 2.2 — A subcontractor sees only the visits now assigned to them and, for those, the job title, c. | for those | none | none |
| DISP-013 | 2.3 — A subcontractor sees only the visits now assigned to them and, for those, the job title, c. | the job title | none | none |
| DISP-013 | 2.4 — A subcontractor sees only the visits now assigned to them and, for those, the job title, c. | checklist and forms | none | none |
| DISP-013 | 2.5 — A subcontractor sees only the visits now assigned to them and, for those, the job title, c. | the site's address and access notes | none | none |
| DISP-013 | 2.6 — A subcontractor sees only the visits now assigned to them and, for those, the job title, c. | the customer's name and phone | none | none |
| DISP-013 | 2.7 — A subcontractor sees only the visits now assigned to them and, for those, the job title, c. | their own captures. | none | none |
| DISP-013 | 3.1 — They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, o. | They never see prices | none | none |
| DISP-013 | 3.2 — They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, o. | costs | none | none |
| DISP-013 | 3.3 — They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, o. | quotes | none | none |
| DISP-013 | 3.4 — They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, o. | invoices | none | none |
| DISP-013 | 3.5 — They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, o. | the price book | none | none |
| DISP-013 | 3.6 — They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, o. | equipment | none | none |
| DISP-013 | 3.7 — They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, o. | the timeline | none | none |
| DISP-013 | 3.8 — They never see prices, costs, quotes, invoices, the price book, equipment, the timeline, o. | other people's work or other visits. | none | none |
| DISP-013 | 4.1 — They record arrival, checklist items, notes, photos, materials by description, forms and c. | They record arrival | none | none |
| DISP-013 | 4.2 — They record arrival, checklist items, notes, photos, materials by description, forms and c. | checklist items | none | none |
| DISP-013 | 4.3 — They record arrival, checklist items, notes, photos, materials by description, forms and c. | notes | none | none |
| DISP-013 | 4.4 — They record arrival, checklist items, notes, photos, materials by description, forms and c. | photos | none | none |
| DISP-013 | 4.5 — They record arrival, checklist items, notes, photos, materials by description, forms and c. | materials by description | none | none |
| DISP-013 | 4.6 — They record arrival, checklist items, notes, photos, materials by description, forms and c. | forms and completion on their visits. | none | none |
| DISP-013 | 5.1 — They cannot clock in, run timers, record refrigerant or expenses, or add priced work, and. | They cannot clock in | none | none |
| DISP-013 | 5.2 — They cannot clock in, run timers, record refrigerant or expenses, or add priced work, and. | run timers | none | none |
| DISP-013 | 5.3 — They cannot clock in, run timers, record refrigerant or expenses, or add priced work, and. | record refrigerant or expenses | none | none |
| DISP-013 | 5.4 — They cannot clock in, run timers, record refrigerant or expenses, or add priced work, and. | or add priced work | none | none |
| DISP-013 | 5.5 — They cannot clock in, run timers, record refrigerant or expenses, or add priced work, and. | their phone keeps no offline day and gets no pushes (FIELD-001 and FIELD-004, FIELD-009, FIELD-010 are the Technician's). | none | none |
| DISP-014 | 1.1 — The owner marks a technician record as a subcontractor with a 1099 payee name and the last. | The owner marks a technician record as a subcontractor with a 1099 payee name | none | none |
| DISP-014 | 1.2 — The owner marks a technician record as a subcontractor with a 1099 payee name and the last. | the last 4 digits of the TIN | none | none |
| DISP-014 | 1.3 — The owner marks a technician record as a subcontractor with a 1099 payee name and the last. | a full TIN is refused | none | none |
| DISP-014 | 1.4 — The owner marks a technician record as a subcontractor with a 1099 payee name and the last. | never stored. | none | none |
| DISP-014 | 2.1 — The owner sets an agreed amount on each of their visits. | The owner sets an agreed amount on each of their visits. | none | none |
| DISP-014 | 3.1 — The 1099-NEC totals for a calendar year, which the owner and office read as JSON or CSV, s. | The 1099-NEC totals for a calendar year | none | none |
| DISP-014 | 3.2 — The 1099-NEC totals for a calendar year, which the owner and office read as JSON or CSV, s. | which the owner and office read as JSON or CSV | none | none |
| DISP-014 | 3.3 — The 1099-NEC totals for a calendar year, which the owner and office read as JSON or CSV, s. | sum each subcontractor's agreed amounts on their visits completed that year (dated by the completion Glove received | none | none |
| DISP-014 | 3.4 — The 1099-NEC totals for a calendar year, which the owner and office read as JSON or CSV, s. | in the business time zone) | none | none |
| DISP-014 | 3.5 — The 1099-NEC totals for a calendar year, which the owner and office read as JSON or CSV, s. | with the visit count and whether the total is $600 or more. | none | none |
| DISP-014 | 4.1 — They are labelled "Totals for your filing, not a filed 1099"; Glove files nothing. | They are labelled "Totals for your filing | none | none |
| DISP-014 | 4.2 — They are labelled "Totals for your filing, not a filed 1099"; Glove files nothing. | not a filed 1099" | none | none |
| DISP-014 | 4.3 — They are labelled "Totals for your filing, not a filed 1099"; Glove files nothing. | Glove files nothing. | none | none |
| DISP-014 | 5.1 — Timesheets and payroll exports stay COST-002, COST-006, COST-007's. | Timesheets and payroll exports stay COST-002, COST-006, COST-007's. | none | none |
| DISP-008 | 1.1 — A fixture books, moves and cancels a visit and checks the calendar provider fake receives. | A fixture books | none | none |
| DISP-008 | 1.2 — A fixture books, moves and cancels a visit and checks the calendar provider fake receives. | moves and cancels a visit | none | none |
| DISP-008 | 1.3 — A fixture books, moves and cancels a visit and checks the calendar provider fake receives. | checks the calendar provider fake receives create | none | none |
| DISP-008 | 1.4 — A fixture books, moves and cancels a visit and checks the calendar provider fake receives. | update and delete | none | none |
| DISP-008 | 1.5 — A fixture books, moves and cancels a visit and checks the calendar provider fake receives. | that a busy block refuses an overlapping booking. | none | none |
| DISP-008 | 2.1 — The unscoped owner explicitly connects one delegated Google or Microsoft calendar per tech. | The unscoped owner explicitly connects one delegated Google or Microsoft calendar per technician | none | none |
| DISP-008 | 2.2 — The unscoped owner explicitly connects one delegated Google or Microsoft calendar per tech. | approves one-way visit writes. | none | none |
| DISP-008 | 3.1 — Customer details default to hidden; the owner may include customer name and service addres. | Customer details default to hidden | none | none |
| DISP-008 | 3.2 — Customer details default to hidden; the owner may include customer name and service addres. | the owner may include customer name and service address only. | none | none |
| DISP-008 | 4.1 — No attendees or contact channels are sent. | No attendees or contact channels are sent. | none | none |
| DISP-008 | 5.1 — Credentials, pending delivery work and event mappings are excluded from archives; restore. | Credentials | none | none |
| DISP-008 | 5.2 — Credentials, pending delivery work and event mappings are excluded from archives; restore. | pending delivery work and event mappings are excluded from archives | none | none |
| DISP-008 | 5.3 — Credentials, pending delivery work and event mappings are excluded from archives; restore. | restore requires explicit reconnection. | none | none |
| DISP-008 | 6.1 — Booking refreshes busy time and refuses an unreadable provider; only busy instants are ret. | Booking refreshes busy time | none | none |
| DISP-008 | 6.2 — Booking refreshes busy time and refuses an unreadable provider; only busy instants are ret. | refuses an unreadable provider | none | none |
| DISP-008 | 6.3 — Booking refreshes busy time and refuses an unreadable provider; only busy instants are ret. | only busy instants are retained. | none | none |
| DISP-008 | 7.1 — The existing private iCal connection remains independent. | The existing private iCal connection remains independent. | none | none |
| DISP-015 | 1.1 — All committed visit changes enqueue provider work, including technician reassignment. | All committed visit changes enqueue provider work | none | none |
| DISP-015 | 1.2 — All committed visit changes enqueue provider work, including technician reassignment. | including technician reassignment. | none | none |
| DISP-015 | 2.1 — Uncertain writes remain visible and stop later work on that connection, without automatic. | Uncertain writes remain visible and stop later work on that connection | none | none |
| DISP-015 | 2.2 — Uncertain writes remain visible and stop later work on that connection, without automatic. | without automatic replay. | none | none |
| DISP-015 | 3.1 — Disconnect stops writes and retains existing provider events for owner review. | Disconnect stops writes | none | none |
| DISP-015 | 3.2 — Disconnect stops writes and retains existing provider events for owner review. | retains existing provider events for owner review. | none | none |
| DISP-009 | 1.1 — The owner grants a named dispatcher or agent the current-shift position view for named tec. | The owner grants a named dispatcher or agent the current-shift position view for named technicians | none | none |
| DISP-009 | 1.2 — The owner grants a named dispatcher or agent the current-shift position view for named tec. | the record retains the grant. | none | none |
| DISP-009 | 2.1 — The granted view reveals only fresh current positions and estimates; expiry, revocation, c. | The granted view reveals only fresh current positions and estimates | none | none |
| DISP-009 | 2.2 — The granted view reveals only fresh current positions and estimates; expiry, revocation, c. | expiry | none | none |
| DISP-009 | 2.3 — The granted view reveals only fresh current positions and estimates; expiry, revocation, c. | revocation | none | none |
| DISP-009 | 2.4 — The granted view reveals only fresh current positions and estimates; expiry, revocation, c. | clock-out and consent withdrawal end that view. | none | none |
| DISP-009 | 3.1 — An agent’s granted position read carries standard and follows the company’s policy. | An agent’s granted position read carries standard and follows the company’s policy. | none | none |
| COMM-001 | 1.1 — A fixture sends a quote, an invoice and a purchase order to its supplier (provider fake). | A fixture sends a quote | none | none |
| COMM-001 | 1.2 — A fixture sends a quote, an invoice and a purchase order to its supplier (provider fake). | an invoice | none | none |
| COMM-001 | 1.3 — A fixture sends a quote, an invoice and a purchase order to its supplier (provider fake). | a purchase order to its supplier (provider fake) | none | none |
| COMM-001 | 1.4 — A fixture sends a quote, an invoice and a purchase order to its supplier (provider fake). | replays delivered and bounced events | none | none |
| COMM-001 | 1.5 — A fixture sends a quote, an invoice and a purchase order to its supplier (provider fake). | checks each message's state on the timeline | none | none |
| COMM-001 | 1.6 — A fixture sends a quote, an invoice and a purchase order to its supplier (provider fake). | the bounce warning on the customer. | none | none |
| COMM-001 | 2.1 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | The journey records each new DATA-002 | none | none |
| COMM-001 | 2.3 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | DATA-010 event in Activity | none | none |
| COMM-001 | 2.4 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | the business export | none | none |
| COMM-001 | 2.5 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | including provider outcomes and references without secrets. | none | none |
| COMM-001 | 3.1 — The owner connects customer email (mail connect action): SendGrid or Resend through Base's. | The owner connects customer email (mail connect action): SendGrid or Resend through Base's mail adapter | none | none |
| COMM-001 | 3.2 — The owner connects customer email (mail connect action): SendGrid or Resend through Base's. | or Postmark or Amazon SES through fixed provider endpoints | none | none |
| COMM-001 | 3.3 — The owner connects customer email (mail connect action): SendGrid or Resend through Base's. | a from-address and optional name | none | none |
| COMM-001 | 3.4 — The owner connects customer email (mail connect action): SendGrid or Resend through Base's. | the provider API key and | none | none |
| COMM-001 | 3.5 — The owner connects customer email (mail connect action): SendGrid or Resend through Base's. | for SendGrid/Resend | none | none |
| COMM-001 | 3.6 — The owner connects customer email (mail connect action): SendGrid or Resend through Base's. | its event-webhook verification key (SendGrid's Signed Event Webhook public key or Resend's whsec_ signing secret) | none | none |
| COMM-001 | 3.7 — The owner connects customer email (mail connect action): SendGrid or Resend through Base's. | kept as installation secrets that are never shown again | none | none |
| COMM-001 | 3.8 — The owner connects customer email (mail connect action): SendGrid or Resend through Base's. | exported or archived | none | none |
| COMM-001 | 3.9 — The owner connects customer email (mail connect action): SendGrid or Resend through Base's. | {provider: null} disconnects. | none | none |
| COMM-001 | 4.1 — Glove does not check the sending domain itself: the provider refuses mail from a domain it. | Glove does not check the sending domain itself: the provider refuses mail from a domain it has not verified | none | none |
| COMM-001 | 4.2 — Glove does not check the sending domain itself: the provider refuses mail from a domain it. | that refusal shows on the message. | none | none |
| COMM-001 | 5.1 — The desk emails what each person may already record as sent (email send action): an approv. | The desk emails what each person may already record as sent (email send action): an approved quote's current revision to the customer's email (owner | none | none |
| COMM-001 | 5.2 — The desk emails what each person may already record as sent (email send action): an approv. | dispatcher | none | none |
| COMM-001 | 5.3 — The desk emails what each person may already record as sent (email send action): an approv. | office | none | none |
| COMM-001 | 5.4 — The desk emails what each person may already record as sent (email send action): an approv. | the quote is then sent | none | none |
| COMM-001 | 5.5 — The desk emails what each person may already record as sent (email send action): an approv. | naming the email) | none | none |
| COMM-001 | 5.6 — The desk emails what each person may already record as sent (email send action): an approv. | an approved or exported invoice to the customer's accounts-payable address | none | none |
| COMM-001 | 5.7 — The desk emails what each person may already record as sent (email send action): an approv. | else their email (owner | none | none |
| COMM-001 | 5.8 — The desk emails what each person may already record as sent (email send action): an approv. | office) | none | none |
| COMM-001 | 5.9 — The desk emails what each person may already record as sent (email send action): an approv. | a draft purchase order to its supplier's address (owner | none | none |
| COMM-001 | 5.10 — The desk emails what each person may already record as sent (email send action): an approv. | office | none | none |
| COMM-001 | 5.11 — The desk emails what each person may already record as sent (email send action): an approv. | the order is then sent) | none | none |
| COMM-001 | 5.12 — The desk emails what each person may already record as sent (email send action): an approv. | agreement offer action with email: true emails a PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 booking link to the customer's own email address. | none | none |
| COMM-001 | 6.1 — Every email Glove sends today is transactional; no marketing email is sent. | Every email Glove sends today is transactional | none | none |
| COMM-001 | 6.2 — Every email Glove sends today is transactional; no marketing email is sent. | no marketing email is sent. | none | none |
| COMM-001 | 7.1 — Replies go to the business email when one is set. | Replies go to the business email when one is set. | none | none |
| COMM-010 | 1.1 — A message record keeps its kind, subject, recipient, from-address, provider and who sent i. | A message record keeps its kind | none | none |
| COMM-010 | 1.2 — A message record keeps its kind, subject, recipient, from-address, provider and who sent i. | subject | none | none |
| COMM-010 | 1.3 — A message record keeps its kind, subject, recipient, from-address, provider and who sent i. | recipient | none | none |
| COMM-010 | 1.4 — A message record keeps its kind, subject, recipient, from-address, provider and who sent i. | from-address | none | none |
| COMM-010 | 1.5 — A message record keeps its kind, subject, recipient, from-address, provider and who sent i. | provider and who sent it | none | none |
| COMM-010 | 1.6 — A message record keeps its kind, subject, recipient, from-address, provider and who sent i. | never the body | none | none |
| COMM-010 | 1.7 — A message record keeps its kind, subject, recipient, from-address, provider and who sent i. | so a booking link's bearer exists only in the email | none | none |
| COMM-010 | 1.8 — A message record keeps its kind, subject, recipient, from-address, provider and who sent i. | the one-time command response. | none | none |
| COMM-010 | 2.1 — After the command commits, Glove makes one send attempt with the message id as the deliver. | After the command commits | none | none |
| COMM-010 | 2.2 — After the command commits, Glove makes one send attempt with the message id as the deliver. | Glove makes one send attempt with the message id as the delivery id. | none | none |
| COMM-010 | 3.1 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | The provider's answer (accepted | none | none |
| COMM-010 | 3.2 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | refused | none | none |
| COMM-010 | 3.3 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | rate limited or not confirmed) | none | none |
| COMM-010 | 3.4 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | every authenticated event the provider posts to the mail callback (delivered | none | none |
| COMM-010 | 3.5 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | deferred | none | none |
| COMM-010 | 3.6 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | bounced | none | none |
| COMM-010 | 3.7 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | complained | none | none |
| COMM-010 | 3.8 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | failed | none | none |
| COMM-010 | 3.9 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | rejected) are provider facts on the message's timeline | none | none |
| COMM-010 | 3.10 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | in Activity and in the business export with the provider's reference | none | none |
| COMM-010 | 3.11 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | Glove authenticates each callback under the rules below (using Base's verifier for SendGrid/Resend) | none | none |
| COMM-010 | 3.12 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | Base's durable store keeps each matched event once | none | none |
| COMM-010 | 3.13 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | applies an event only to a message Glove sent through that provider to exactly that recipient | none | none |
| COMM-010 | 3.14 — The provider's answer (accepted, refused, rate limited or not confirmed) and every authent. | authenticated unmatched events return 200 without effect. | none | none |
| COMM-010 | 4.1 — A message's state is the latest of its facts in Base's order: a final fact (delivered, bou. | A message's state is the latest of its facts in Base's order: a final fact (delivered | none | none |
| COMM-010 | 4.2 — A message's state is the latest of its facts in Base's order: a final fact (delivered, bou. | bounced | none | none |
| COMM-010 | 4.3 — A message's state is the latest of its facts in Base's order: a final fact (delivered, bou. | complained | none | none |
| COMM-010 | 4.4 — A message's state is the latest of its facts in Base's order: a final fact (delivered, bou. | failed | none | none |
| COMM-010 | 4.5 — A message's state is the latest of its facts in Base's order: a final fact (delivered, bou. | rejected) is never replaced by a non-final one | none | none |
| COMM-010 | 4.6 — A message's state is the latest of its facts in Base's order: a final fact (delivered, bou. | a later final fact (a complaint after delivery) replaces an earlier one. "Delivered" means the recipient's mail server accepted it | none | none |
| COMM-010 | 4.7 — A message's state is the latest of its facts in Base's order: a final fact (delivered, bou. | as the provider reported | none | none |
| COMM-010 | 4.8 — A message's state is the latest of its facts in Base's order: a final fact (delivered, bou. | Glove never claims a person read it. | none | none |
| COMM-010 | 5.1 — Each failure shows on the message with what to do next. | Each failure shows on the message with what to do next. | none | none |
| COMM-010 | 6.1 — A customer whose latest finished email to an address on their record bounced or was marked. | A customer whose latest finished email to an address on their record bounced or was marked as spam carries that warning | none | none |
| COMM-010 | 6.2 — A customer whose latest finished email to an address on their record bounced or was marked. | with what to do next | none | none |
| COMM-010 | 6.3 — A customer whose latest finished email to an address on their record bounced or was marked. | until a later email to that address finishes delivered or the address changes. | none | none |
| COMM-010 | 7.1 — Each email is in the COMM-007 stream as an outbound email with its author, recipient and. | Each email is in the COMM-007 stream as an outbound email with its author | none | none |
| COMM-010 | 7.2 — Each email is in the COMM-007 stream as an outbound email with its author, recipient and. | recipient and state. | none | none |
| COMM-010 | 8.1 — Nothing is retried automatically: the desk sends again, or for a booking link revokes it a. | Nothing is retried automatically: the desk sends again | none | none |
| COMM-010 | 8.2 — Nothing is retried automatically: the desk sends again, or for a booking link revokes it a. | or for a booking link revokes it and makes a new offer. | none | none |
| COMM-011 | 1.1 — Inheritance : receipts join with PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 and PAY-00. | Inheritance : receipts join with PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 and PAY-004, PAY-021, PAY-022, PAY-023 | none | none |
| COMM-011 | 1.2 — Inheritance : receipts join with PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 and PAY-00. | appointment confirmations with COMM-003, COMM-019, COMM-020 (which also carries FIELD-003 report links) | none | none |
| COMM-011 | 1.3 — Inheritance : receipts join with PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 and PAY-00. | review requests with COMM-008, COMM-026, COMM-027 | none | none |
| COMM-011 | 1.4 — Inheritance : receipts join with PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 and PAY-00. | each emails through this door with the same provider outcomes | none | none |
| COMM-011 | 1.5 — Inheritance : receipts join with PAY-002, PAY-017, PAY-018, PAY-019, PAY-020 and PAY-00. | any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address. | none | none |
| COMM-012 | 1.1 — It also delivers the owner's AGENT-008, AGENT-016 brief in the morning and asserts the p. | It also delivers the owner's AGENT-008, AGENT-016 brief in the morning and asserts the provider delivery outcome without a duplicate delivery for that business-local date. | none | none |
| COMM-012 | 2.1 — Only the owner turns it on or off (mail morning action, with customer email connected firs. | Only the owner turns it on or off (mail morning action | none | none |
| COMM-012 | 2.2 — Only the owner turns it on or off (mail morning action, with customer email connected firs. | with customer email connected first | none | none |
| COMM-012 | 2.3 — Only the owner turns it on or off (mail morning action, with customer email connected firs. | time is a business-local the documented refusal | none | none |
| COMM-012 | 2.4 — Only the owner turns it on or off (mail morning action, with customer email connected firs. | 07:00 by default) | none | none |
| COMM-012 | 2.5 — Only the owner turns it on or off (mail morning action, with customer email connected firs. | it is off until then | none | none |
| COMM-012 | 2.6 — Only the owner turns it on or off (mail morning action, with customer email connected firs. | opening the brief never sends anything. | none | none |
| COMM-012 | 3.1 — Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in th. | Glove's cron trigger runs every 15 minutes | none | none |
| COMM-012 | 3.2 — Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in th. | the first run whose business-local time (in the business time zone) is at or past time on a local date emails that date's brief | none | none |
| COMM-012 | 3.3 — Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in th. | as AGENT-008, AGENT-016 prepares it for that instant | none | none |
| COMM-012 | 3.4 — Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in th. | to the owner's active sign-in address (the owner account's email | none | none |
| COMM-012 | 3.5 — Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in th. | not the business email) through the connected provider | none | none |
| COMM-012 | 3.6 — Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in th. | a business-local date gets at most one send | none | none |
| COMM-012 | 3.7 — Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in th. | claimed once as a queued fact in the timeline before the provider is called | none | none |
| COMM-012 | 3.8 — Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in th. | so a repeated or simultaneous run sends nothing more | none | none |
| COMM-012 | 3.9 — Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in th. | a crash between claim | none | none |
| COMM-012 | 3.10 — Glove's cron trigger runs every 15 minutes; the first run whose business-local time (in th. | send loses that date's email rather than sending it twice. | none | none |
| COMM-012 | 4.1 — A run before time, with email off or disconnected, or without an active owner address send. | A run before time | none | none |
| COMM-012 | 4.2 — A run before time, with email off or disconnected, or without an active owner address send. | with email off or disconnected | none | none |
| COMM-012 | 4.3 — A run before time, with email off or disconnected, or without an active owner address send. | or without an active owner address sends nothing. | none | none |
| COMM-012 | 5.1 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | The provider's answer (accepted | none | none |
| COMM-012 | 5.2 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | refused | none | none |
| COMM-012 | 5.3 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | rate limited or not confirmed) | none | none |
| COMM-012 | 5.4 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | its signed delivery events (the mail callback | none | none |
| COMM-012 | 5.5 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | accepted only for that recipient and that date's delivery id) are provider facts on that date in Activity | none | none |
| COMM-012 | 5.6 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | the business export | none | none |
| COMM-012 | 5.7 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | with the provider's reference | none | none |
| COMM-012 | 5.8 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | no key or brief body | none | none |
| COMM-012 | 5.9 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | the Today screen | none | none |
| COMM-012 | 5.10 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | the owner brief (emailed) show the date's state exactly as those facts fold | none | none |
| COMM-012 | 5.11 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | with what to do next | none | none |
| COMM-012 | 5.12 — The provider's answer (accepted, refused, rate limited or not confirmed) and its signed de. | "delivered" means the recipient's mail server accepted it. | none | none |
| COMM-012 | 6.1 — Nothing is retried: a failed date stays failed and the next local date sends its own brief. | Nothing is retried: a failed date stays failed | none | none |
| COMM-012 | 6.2 — Nothing is retried: a failed date stays failed and the next local date sends its own brief. | the next local date sends its own brief. | none | none |
| COMM-012 | 7.1 — The email carries the brief's own text and, being a transactional notice to the owner of t. | The email carries the brief's own text and | none | none |
| COMM-012 | 7.2 — The email carries the brief's own text and, being a transactional notice to the owner of t. | being a transactional notice to the owner of their own records | none | none |
| COMM-012 | 7.3 — The email carries the brief's own text and, being a transactional notice to the owner of t. | no marketing content. | none | none |
| COMM-013 | 1.1 — Authentication precedes delivery-payload parsing, message lookup, database writes and outb. | Authentication precedes delivery-payload parsing | none | none |
| COMM-013 | 1.2 — Authentication precedes delivery-payload parsing, message lookup, database writes and outb. | message lookup | none | none |
| COMM-013 | 1.3 — Authentication precedes delivery-payload parsing, message lookup, database writes and outb. | database writes and outbound effects. | none | none |
| COMM-013 | 2.1 — SNS necessarily decodes its bounded signed envelope and fetches only its pinned certificat. | SNS necessarily decodes its bounded signed envelope and fetches only its pinned certificate to verify the signature | none | none |
| COMM-013 | 2.2 — SNS necessarily decodes its bounded signed envelope and fetches only its pinned certificat. | its SES Message remains unparsed until verification. | none | none |
| COMM-013 | 3.1 — Disconnected email returns 404. | Disconnected email returns 404. | none | none |
| COMM-013 | 4.1 — Every failed authentication/schema/recipient check returns the same generic 401 body, writ. | Every failed authentication/schema/recipient check returns the same generic 401 body | none | none |
| COMM-013 | 4.2 — Every failed authentication/schema/recipient check returns the same generic 401 body, writ. | writes no Activity | none | none |
| COMM-013 | 4.3 — Every failed authentication/schema/recipient check returns the same generic 401 body, writ. | durable counter | none | none |
| COMM-013 | 4.4 — Every failed authentication/schema/recipient check returns the same generic 401 body, writ. | receipt/event ID or other business record | none | none |
| COMM-013 | 4.5 — Every failed authentication/schema/recipient check returns the same generic 401 body, writ. | logs only a generic Worker warning without secrets. | none | none |
| COMM-013 | 5.1 — After 20 rejections from one IP in a minute, further rejected requests return 429; verifie. | After 20 rejections from one IP in a minute | none | none |
| COMM-013 | 5.2 — After 20 rejections from one IP in a minute, further rejected requests return 429; verifie. | further rejected requests return 429 | none | none |
| COMM-013 | 5.3 — After 20 rejections from one IP in a minute, further rejected requests return 429; verifie. | verified traffic is never counted or refused by that rejection allowance. | none | none |
| COMM-013 | 6.1 — Authenticated events for messages Glove did not send through that provider return the same. | Authenticated events for messages Glove did not send through that provider return the same opaque 200 acknowledgement as matched events | none | none |
| COMM-013 | 6.2 — Authenticated events for messages Glove did not send through that provider return the same. | with no effect | none | none |
| COMM-013 | 6.3 — Authenticated events for messages Glove did not send through that provider return the same. | no consumed event ID | none | none |
| COMM-013 | 6.4 — Authenticated events for messages Glove did not send through that provider return the same. | a wrong recipient for a known message refuses the entire batch. | none | none |
| COMM-013 | 7.1 — The owner's email settings show the last verified matched event time and any SNS cancellat. | The owner's email settings show the last verified matched event time and any SNS cancellation warning. | none | none |
| COMM-013 | 8.1 — Unauthenticated and unmatched events never change delivery state, bounce/spam warnings, su. | Unauthenticated and unmatched events never change delivery state | none | none |
| COMM-013 | 8.2 — Unauthenticated and unmatched events never change delivery state, bounce/spam warnings, su. | bounce/spam warnings | none | none |
| COMM-013 | 8.3 — Unauthenticated and unmatched events never change delivery state, bounce/spam warnings, su. | suppression/opt-outs | none | none |
| COMM-013 | 8.4 — Unauthenticated and unmatched events never change delivery state, bounce/spam warnings, su. | subscriptions or inbound email | none | none |
| COMM-013 | 8.5 — Unauthenticated and unmatched events never change delivery state, bounce/spam warnings, su. | request | none | none |
| COMM-013 | 8.6 — Unauthenticated and unmatched events never change delivery state, bounce/spam warnings, su. | conversation or customer records | none | none |
| COMM-013 | 8.7 — Unauthenticated and unmatched events never change delivery state, bounce/spam warnings, su. | never write Activity/export or reveal message/customer/recipient existence. | none | none |
| COMM-014 | 1.1 — Every future inbound-email receiver inherits this authentication before shipping. | Every future inbound-email receiver inherits this authentication before shipping. | none | none |
| COMM-014 | 2.1 — Rejection accounting uses a shared transient actor keyed by a hashed source address, with. | Rejection accounting uses a shared transient actor keyed by a hashed source address | none | none |
| COMM-014 | 2.2 — Rejection accounting uses a shared transient actor keyed by a hashed source address, with. | with no durable counter or business write. | none | none |
| COMM-015 | 1.1 — Postmark: HTTPS Basic user glove, with a per-installation password generated from 32 rando. | Postmark: HTTPS Basic user glove | none | none |
| COMM-015 | 1.2 — Postmark: HTTPS Basic user glove, with a per-installation password generated from 32 rando. | with a per-installation password generated from 32 random bytes | none | none |
| COMM-015 | 1.3 — Postmark: HTTPS Basic user glove, with a per-installation password generated from 32 rando. | shown only in the first owner response. | none | none |
| COMM-015 | 2.1 — Store only its SHA-256 hash and compare in constant time. | Store only its SHA-256 hash and compare in constant time. | none | none |
| COMM-015 | 3.1 — Mail callback action keeps the previous hash valid for exactly 24 hours (exclusive expiry). | Mail callback action keeps the previous hash valid for exactly 24 hours (exclusive expiry) | none | none |
| COMM-015 | 3.2 — Mail callback action keeps the previous hash valid for exactly 24 hours (exclusive expiry). | revokePrevious ends that overlap immediately | none | none |
| COMM-015 | 3.3 — Mail callback action keeps the previous hash valid for exactly 24 hours (exclusive expiry). | disconnect revokes both. | none | none |
| COMM-015 | 4.1 — Rotation, revocation and allowlist changes are Activity facts without secrets. | Rotation | none | none |
| COMM-015 | 4.2 — Rotation, revocation and allowlist changes are Activity facts without secrets. | revocation and allowlist changes are Activity facts without secrets. | none | none |
| COMM-015 | 5.1 — The optional source-IP allowlist is off by default, pinned in source with a dated provider. | The optional source-IP allowlist is off by default | none | none |
| COMM-015 | 5.2 — The optional source-IP allowlist is off by default, pinned in source with a dated provider. | pinned in source with a dated provider reference | none | none |
| COMM-015 | 5.3 — The optional source-IP allowlist is off by default, pinned in source with a dated provider. | fails closed when on | none | none |
| COMM-015 | 5.4 — The optional source-IP allowlist is off by default, pinned in source with a dated provider. | never replaces Basic authentication | none | none |
| COMM-015 | 5.5 — The optional source-IP allowlist is off by default, pinned in source with a dated provider. | reconnecting credentials preserves this owner option unless explicitly changed. | none | none |
| COMM-015 | 6.1 — Plain-HTTP Postmark callbacks are refused without writes. | Plain-HTTP Postmark callbacks are refused without writes. | none | none |
| COMM-015 | 7.1 — Replay identity is event type plus Postmark ID, or message ID + type + recipient + time wh. | Replay identity is event type plus Postmark ID | none | none |
| COMM-015 | 7.2 — Replay identity is event type plus Postmark ID, or message ID + type + recipient + time wh. | or message ID + type + recipient + time when no ID exists | none | none |
| COMM-015 | 7.3 — Replay identity is event type plus Postmark ID, or message ID + type + recipient + time wh. | refuse events over 7 days old. | none | none |
| COMM-015 | 8.1 — Sends include Glove's delivery ID in Postmark metadata. | Sends include Glove's delivery ID in Postmark metadata. | none | none |
| COMM-016 | 1.1 — Delivery maps to delivered, hard bounce to bounced, soft bounce to deferred or failed when. | Delivery maps to delivered | none | none |
| COMM-016 | 1.2 — Delivery maps to delivered, hard bounce to bounced, soft bounce to deferred or failed when. | hard bounce to bounced | none | none |
| COMM-016 | 1.3 — Delivery maps to delivered, hard bounce to bounced, soft bounce to deferred or failed when. | soft bounce to deferred or failed when final | none | none |
| COMM-016 | 1.4 — Delivery maps to delivered, hard bounce to bounced, soft bounce to deferred or failed when. | SpamComplaint to complained. | none | none |
| COMM-017 | 1.1 — Amazon SES via SNS: pin region, TopicArn and configuration set to the owner's connection. | Amazon SES via SNS: pin region | none | none |
| COMM-017 | 1.2 — Amazon SES via SNS: pin region, TopicArn and configuration set to the owner's connection. | TopicArn and configuration set to the owner's connection. | none | none |
| COMM-017 | 2.1 — Require the message-type header to equal the envelope Type, accept SNS signature versions. | Require the message-type header to equal the envelope Type | none | none |
| COMM-017 | 2.2 — Require the message-type header to equal the envelope Type, accept SNS signature versions. | accept SNS signature versions 1 and 2 (setup asks for version 2) | none | none |
| COMM-017 | 2.3 — Require the message-type header to equal the envelope Type, accept SNS signature versions. | require the signing certificate at the documented product door with no query | none | none |
| COMM-017 | 2.4 — Require the message-type header to equal the envelope Type, accept SNS signature versions. | credentials | none | none |
| COMM-017 | 2.5 — Require the message-type header to equal the envelope Type, accept SNS signature versions. | fragment | none | none |
| COMM-017 | 2.6 — Require the message-type header to equal the envelope Type, accept SNS signature versions. | alternate port or redirects | none | none |
| COMM-017 | 2.7 — Require the message-type header to equal the envelope Type, accept SNS signature versions. | cache the certificate within its validity for at most one hour. | none | none |
| COMM-017 | 3.1 — SNS timestamps are at most 1 hour old and at most 5 minutes ahead. | SNS timestamps are at most 1 hour old and at most 5 minutes ahead. | none | none |
| COMM-017 | 4.1 — Require a signed SNS envelope (raw delivery off), the pinned SES configuration set and Glo. | Require a signed SNS envelope (raw delivery off) | none | none |
| COMM-017 | 4.2 — Require a signed SNS envelope (raw delivery off), the pinned SES configuration set and Glo. | the pinned SES configuration set and Glove delivery tag on each SES event | none | none |
| COMM-017 | 4.3 — Require a signed SNS envelope (raw delivery off), the pinned SES configuration set and Glo. | sends carry the configuration set | none | none |
| COMM-017 | 4.4 — Require a signed SNS envelope (raw delivery off), the pinned SES configuration set and Glo. | a base64url-encoded delivery ID tag. | none | none |
| COMM-017 | 5.1 — Deduplicate SNS MessageId and the SES event. | Deduplicate SNS MessageId | none | none |
| COMM-017 | 5.2 — Deduplicate SNS MessageId and the SES event. | the SES event. | none | none |
| COMM-017 | 6.1 — A SubscriptionConfirmation URL is fetched only after all source, URL, timestamp and signat. | A SubscriptionConfirmation URL is fetched only after all source | none | none |
| COMM-017 | 6.2 — A SubscriptionConfirmation URL is fetched only after all source, URL, timestamp and signat. | URL | none | none |
| COMM-017 | 6.3 — A SubscriptionConfirmation URL is fetched only after all source, URL, timestamp and signat. | timestamp and signature checks | none | none |
| COMM-017 | 6.4 — A SubscriptionConfirmation URL is fetched only after all source, URL, timestamp and signat. | require HTTPS on the same pinned regional SNS host with the exact ConfirmSubscription action | none | none |
| COMM-017 | 6.5 — A SubscriptionConfirmation URL is fetched only after all source, URL, timestamp and signat. | TopicArn and Token | none | none |
| COMM-017 | 6.6 — A SubscriptionConfirmation URL is fetched only after all source, URL, timestamp and signat. | follow no redirects. | none | none |
| COMM-017 | 7.1 — An UnsubscribeConfirmation warns the owner and never fetches its URL. | An UnsubscribeConfirmation warns the owner | none | none |
| COMM-017 | 7.2 — An UnsubscribeConfirmation warns the owner and never fetches its URL. | never fetches its URL. | none | none |
| COMM-017 | 8.1 — Delivery maps to delivered; Permanent bounce to bounced; Transient bounce to failed; Deliv. | Delivery maps to delivered | none | none |
| COMM-017 | 8.2 — Delivery maps to delivered; Permanent bounce to bounced; Transient bounce to failed; Deliv. | Permanent bounce to bounced | none | none |
| COMM-017 | 8.3 — Delivery maps to delivered; Permanent bounce to bounced; Transient bounce to failed; Deliv. | Transient bounce to failed | none | none |
| COMM-017 | 8.4 — Delivery maps to delivered; Permanent bounce to bounced; Transient bounce to failed; Deliv. | DeliveryDelay to deferred | none | none |
| COMM-017 | 8.5 — Delivery maps to delivered; Permanent bounce to bounced; Transient bounce to failed; Deliv. | Complaint to complained | none | none |
| COMM-017 | 8.6 — Delivery maps to delivered; Permanent bounce to bounced; Transient bounce to failed; Deliv. | Reject and RenderingFailure (including AWS's Rendering Failure spelling) to rejected. | none | none |
| COMM-018 | 1.1 — Document email, morning brief, callback outcomes and restored connections are proven again. | Document email | none | none |
| COMM-018 | 1.2 — Document email, morning brief, callback outcomes and restored connections are proven again. | morning brief | none | none |
| COMM-018 | 1.3 — Document email, morning brief, callback outcomes and restored connections are proven again. | callback outcomes | none | none |
| COMM-018 | 1.4 — Document email, morning brief, callback outcomes and restored connections are proven again. | restored connections are proven against the configured provider’s network edge. | none | none |
| COMM-007 | 1.1 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | A fixture logs a call | none | none |
| COMM-007 | 1.2 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | a note on one job | none | none |
| COMM-007 | 1.3 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | reads them with today's real sends (a request | none | none |
| COMM-007 | 1.4 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | its follow-up | none | none |
| COMM-007 | 1.5 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | a quote recorded as sent | none | none |
| COMM-007 | 1.6 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | its signed acceptance | none | none |
| COMM-007 | 1.7 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | a purchase order recorded as sent | none | none |
| COMM-007 | 1.8 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | a delivered | none | none |
| COMM-007 | 1.9 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | a refused Web Push notice) | none | none |
| COMM-007 | 1.10 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | an agent's quote draft | none | none |
| COMM-007 | 1.11 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | in order | none | none |
| COMM-007 | 1.12 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | from the customer and job streams with direction | none | none |
| COMM-007 | 1.13 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | channel | none | none |
| COMM-007 | 1.14 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | author and delivery | none | none |
| COMM-007 | 1.15 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | field roles cannot read or log | none | none |
| COMM-007 | 1.16 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | agent log calls use their sponsor’s role and grant under the company’s policy | none | none |
| COMM-007 | 1.17 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | a merged customer's entries read on the survivor | none | none |
| COMM-007 | 1.18 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | the logged call and note are in Activity | none | none |
| COMM-007 | 1.19 — A fixture logs a call and a note on one job, reads them with today's real sends (a request. | the business export. | none | none |
| FIELD-001 | 1.1 — A fixture loads the day, goes offline, reloads the app, completes a visit with photos and. | A fixture loads the day | none | none |
| FIELD-001 | 1.2 — A fixture loads the day, goes offline, reloads the app, completes a visit with photos and. | goes offline | none | none |
| FIELD-001 | 1.3 — A fixture loads the day, goes offline, reloads the app, completes a visit with photos and. | reloads the app | none | none |
| FIELD-001 | 1.4 — A fixture loads the day, goes offline, reloads the app, completes a visit with photos and. | completes a visit with photos | none | none |
| FIELD-001 | 1.5 — A fixture loads the day, goes offline, reloads the app, completes a visit with photos and. | a form | none | none |
| FIELD-001 | 1.6 — A fixture loads the day, goes offline, reloads the app, completes a visit with photos and. | reconnects | none | none |
| FIELD-001 | 1.7 — A fixture loads the day, goes offline, reloads the app, completes a visit with photos and. | checks everything landed once | none | none |
| FIELD-001 | 1.8 — A fixture loads the day, goes offline, reloads the app, completes a visit with photos and. | a visit moved at the desk meanwhile shows the late-evidence review. | none | none |
| FIELD-001 | 2.1 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits. | Only a signed-in Technician's phone keeps the day: that technician's own view (the visits ever assigned to them with those jobs' customers | none | none |
| FIELD-001 | 2.2 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits. | sites | none | none |
| FIELD-001 | 2.3 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits. | access notes | none | none |
| FIELD-001 | 2.4 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits. | equipment | none | none |
| FIELD-001 | 2.5 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits. | history | none | none |
| FIELD-001 | 2.6 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits. | checklists | none | none |
| FIELD-001 | 2.7 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits. | forms and captures | none | none |
| FIELD-001 | 2.8 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits. | never prices) | none | none |
| FIELD-001 | 2.9 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits. | replaced on every successful refresh | none | none |
| FIELD-001 | 2.10 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits. | kept in this browser's storage | none | none |
| FIELD-001 | 2.11 — Only a signed-in Technician's phone keeps the day: that technician's own view (the visits. | cleared on sign-out and whenever a different person or a desk role signs in on it. | none | none |
| FIELD-001 | 3.1 — A service worker keeps the app shell this phone loaded and that technician's photos, answe. | A service worker keeps the app shell this phone loaded and that technician's photos | none | none |
| FIELD-001 | 3.2 — A service worker keeps the app shell this phone loaded and that technician's photos, answe. | answering from them only when the network fails | none | none |
| FIELD-001 | 3.3 — A service worker keeps the app shell this phone loaded and that technician's photos, answe. | it never keeps records or other the documented product door or the documented product door answers | none | none |
| FIELD-001 | 3.4 — A service worker keeps the app shell this phone loaded and that technician's photos, answe. | desk roles never keep records. | none | none |
| FIELD-001 | 4.1 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | With no signal the app opens | none | none |
| FIELD-001 | 4.2 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | reloads and works from the kept day | none | none |
| FIELD-001 | 4.3 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | saying how old it is | none | none |
| FIELD-001 | 4.4 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | everything recorded (arrival | none | none |
| FIELD-001 | 4.5 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | checklist | none | none |
| FIELD-001 | 4.6 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | forms | none | none |
| FIELD-001 | 4.7 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | notes | none | none |
| FIELD-001 | 4.8 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | photos | none | none |
| FIELD-001 | 4.9 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | materials | none | none |
| FIELD-001 | 4.10 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | completion) waits in the phone's outbox | none | none |
| FIELD-001 | 4.11 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | in order | none | none |
| FIELD-001 | 4.12 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | tied to the person who recorded it (another sign-in never sends or shows it) | none | none |
| FIELD-001 | 4.13 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | sends exactly once on reconnect under GLOVE-06 | none | none |
| FIELD-001 | 4.14 — With no signal the app opens, reloads and works from the kept day, saying how old it is; e. | a visit can be completed once its arrival is waiting to send. | none | none |
| FIELD-001 | 5.1 — Evidence for a visit the desk moved to someone else meanwhile is kept, flagged and reviewe. | Evidence for a visit the desk moved to someone else meanwhile is kept | none | none |
| FIELD-001 | 5.2 — Evidence for a visit the desk moved to someone else meanwhile is kept, flagged and reviewe. | flagged and reviewed under GLOVE-07 | none | none |
| FIELD-001 | 5.3 — Evidence for a visit the desk moved to someone else meanwhile is kept, flagged and reviewe. | never silently overwritten. | none | none |
| FIELD-002 | 1.1 — A fixture builds an HVAC inspection form with a conditional question and a reading range. | A fixture builds an HVAC inspection form with a conditional question | none | none |
| FIELD-002 | 1.2 — A fixture builds an HVAC inspection form with a conditional question and a reading range. | a reading range | none | none |
| FIELD-002 | 1.3 — A fixture builds an HVAC inspection form with a conditional question and a reading range. | fills it on a visit with one out-of-range reading | none | none |
| FIELD-002 | 1.4 — A fixture builds an HVAC inspection form with a conditional question and a reading range. | finds the flagged reading on the job | none | none |
| FIELD-002 | 1.5 — A fixture builds an HVAC inspection form with a conditional question and a reading range. | the equipment. | none | none |
| FIELD-002 | 2.1 — The owner builds a form of up to 60 questions (yes/no, choice, number with an optional uni. | The owner builds a form of up to 60 questions (yes/no | none | none |
| FIELD-002 | 2.2 — The owner builds a form of up to 60 questions (yes/no, choice, number with an optional uni. | choice | none | none |
| FIELD-002 | 2.3 — The owner builds a form of up to 60 questions (yes/no, choice, number with an optional uni. | number with an optional unit | none | none |
| FIELD-002 | 2.4 — The owner builds a form of up to 60 questions (yes/no, choice, number with an optional uni. | reading with a unit | none | none |
| FIELD-002 | 2.5 — The owner builds a form of up to 60 questions (yes/no, choice, number with an optional uni. | an inclusive range | none | none |
| FIELD-002 | 2.6 — The owner builds a form of up to 60 questions (yes/no, choice, number with an optional uni. | photo | none | none |
| FIELD-002 | 2.7 — The owner builds a form of up to 60 questions (yes/no, choice, number with an optional uni. | signature | none | none |
| FIELD-002 | 2.8 — The owner builds a form of up to 60 questions (yes/no, choice, number with an optional uni. | notes) | none | none |
| FIELD-002 | 2.9 — The owner builds a form of up to 60 questions (yes/no, choice, number with an optional uni. | a question can be asked only when an earlier yes/no or choice question has a given answer. | none | none |
| FIELD-002 | 3.1 — A form attaches to price-book services and to equipment types (matched without regard to c. | A form attaches to price-book services and to equipment types (matched without regard to case). | none | none |
| FIELD-002 | 4.1 — A new job takes a copy of each form that applies: one per unit the job names whose type th. | A new job takes a copy of each form that applies: one per unit the job names whose type the form lists | none | none |
| FIELD-002 | 4.2 — A new job takes a copy of each form that applies: one per unit the job names whose type th. | otherwise one for the job when a quoted service lists it | none | none |
| FIELD-002 | 4.3 — A new job takes a copy of each form that applies: one per unit the job names whose type th. | editing or archiving the form never changes a job's copy | none | none |
| FIELD-002 | 4.4 — A new job takes a copy of each form that applies: one per unit the job names whose type th. | the per-service checklists stay as they are. | none | none |
| FIELD-002 | 5.1 — The technician fills each copy once on the phone, through the outbox, so it works without. | The technician fills each copy once on the phone | none | none |
| FIELD-002 | 5.2 — The technician fills each copy once on the phone, through the outbox, so it works without. | through the outbox | none | none |
| FIELD-002 | 5.3 — The technician fills each copy once on the phone, through the outbox, so it works without. | so it works without signal (GLOVE-06): every question asked and required must be answered | none | none |
| FIELD-002 | 5.4 — The technician fills each copy once on the phone, through the outbox, so it works without. | a question not asked must be left empty | none | none |
| FIELD-002 | 5.5 — The technician fills each copy once on the phone, through the outbox, so it works without. | a reading below its lowest or above its highest value is flagged. | none | none |
| FIELD-002 | 6.1 — The filled form is a field record on the job and its timeline (naming how many readings ar. | The filled form is a field record on the job | none | none |
| FIELD-002 | 6.2 — The filled form is a field record on the job and its timeline (naming how many readings ar. | its timeline (naming how many readings are out of range) | none | none |
| FIELD-002 | 6.3 — The filled form is a field record on the job and its timeline (naming how many readings ar. | on the unit's service history when the copy is for a unit | none | none |
| FIELD-002 | 6.4 — The filled form is a field record on the job and its timeline (naming how many readings ar. | in the property history. | none | none |
| FIELD-002 | 7.1 — Agreements carry forms when PLAN-002 ships, and the customer's report prints form result. | Agreements carry forms when PLAN-002 ships | none | none |
| FIELD-002 | 7.2 — Agreements carry forms when PLAN-002 ships, and the customer's report prints form result. | the customer's report prints form results under FIELD-003. | none | none |
| FIELD-003 | 1.1 — Completing a visit freezes the customer report’s fields, form readings and flags, with onl. | Completing a visit freezes the customer report’s fields | none | none |
| FIELD-003 | 1.2 — Completing a visit freezes the customer report’s fields, form readings and flags, with onl. | form readings and flags | none | none |
| FIELD-003 | 1.3 — Completing a visit freezes the customer report’s fields, form readings and flags, with onl. | with only the technician’s first name. | none | none |
| FIELD-003 | 2.1 — A report link reads exactly that snapshot and its originals; another record or unrelated o. | A report link reads exactly that snapshot | none | none |
| FIELD-003 | 2.2 — A report link reads exactly that snapshot and its originals; another record or unrelated o. | its originals | none | none |
| FIELD-003 | 2.3 — A report link reads exactly that snapshot and its originals; another record or unrelated o. | another record or unrelated original remains unavailable. | none | none |
| FIELD-003 | 3.1 — Revocation, expiry or loss of the issuer’s current branch authority closes the link. | Revocation | none | none |
| FIELD-003 | 3.2 — Revocation, expiry or loss of the issuer’s current branch authority closes the link. | expiry or loss of the issuer’s current branch authority closes the link. | none | none |
| FIELD-003 | 4.1 — A recommended item creates one quote draft under ordinary price approval. | A recommended item creates one quote draft under ordinary price approval. | none | none |
| FIELD-003 | 5.1 — Report creation, sharing and recommendation outcomes appear in Activity, property history. | Report creation | none | none |
| FIELD-003 | 5.2 — Report creation, sharing and recommendation outcomes appear in Activity, property history. | sharing and recommendation outcomes appear in Activity | none | none |
| FIELD-003 | 5.3 — Report creation, sharing and recommendation outcomes appear in Activity, property history. | property history and business export. | none | none |
| FIELD-003 | 6.1 — Restore preserves exact snapshot bytes and link metadata, while requiring a newly issued b. | Restore preserves exact snapshot bytes and link metadata | none | none |
| FIELD-003 | 6.2 — Restore preserves exact snapshot bytes and link metadata, while requiring a newly issued b. | while requiring a newly issued bearer. | none | none |
| FIELD-004 | 1.1 — A fixture installs the app manifest, subscribes to push, and receives a notification (push. | A fixture installs the app manifest | none | none |
| FIELD-004 | 1.2 — A fixture installs the app manifest, subscribes to push, and receives a notification (push. | subscribes to push | none | none |
| FIELD-004 | 1.3 — A fixture installs the app manifest, subscribes to push, and receives a notification (push. | receives a notification (push service fake) when the dispatcher moves the visit | none | none |
| FIELD-004 | 1.4 — A fixture installs the app manifest, subscribes to push, and receives a notification (push. | from the visit | none | none |
| FIELD-004 | 1.5 — A fixture installs the app manifest, subscribes to push, and receives a notification (push. | tap-to-call opens a tel: link to the customer's number and tap-to-navigate a maps link to the site's address. | none | none |
| FIELD-004 | 2.1 — The documented product door installs to the home screen from its web app manifest (Glove. | The documented product door installs to the home screen from its web app manifest (Glove | none | none |
| FIELD-004 | 2.2 — The documented product door installs to the home screen from its web app manifest (Glove. | starting at the documented product door | none | none |
| FIELD-004 | 2.3 — The documented product door installs to the home screen from its web app manifest (Glove. | standalone | none | none |
| FIELD-004 | 2.4 — The documented product door installs to the home screen from its web app manifest (Glove. | 192 and 512 px icons) | none | none |
| FIELD-004 | 2.5 — The documented product door installs to the home screen from its web app manifest (Glove. | the home-screen tags iPhone reads | none | none |
| FIELD-004 | 2.6 — The documented product door installs to the home screen from its web app manifest (Glove. | an iPhone shows web pushes only once Glove is added to its Home Screen (iOS 16.4 and later) | none | none |
| FIELD-004 | 2.7 — The documented product door installs to the home screen from its web app manifest (Glove. | which the phone screen says. | none | none |
| FIELD-004 | 3.1 — Field photos open the rear camera directly. | Field photos open the rear camera directly. | none | none |
| FIELD-004 | 4.1 — Tapping a notification opens the signed-in app on that job's visit. | Tapping a notification opens the signed-in app on that job's visit. | none | none |
| FIELD-004 | 5.1 — On a visit, Call customer opens a tel: link to the customer's phone (its digits and a lead. | On a visit | none | none |
| FIELD-004 | 5.2 — On a visit, Call customer opens a tel: link to the customer's phone (its digits and a lead. | Call customer opens a tel: link to the customer's phone (its digits | none | none |
| FIELD-004 | 5.3 — On a visit, Call customer opens a tel: link to the customer's phone (its digits and a lead. | a leading +) and Navigate to site opens Google Maps directions to the site's address (the Maps app where installed). | none | none |
| FIELD-004 | 6.1 — A local installation served from this computer also accepts a push service on this compute. | A local installation served from this computer also accepts a push service on this computer (the documented product door or localhost) | none | none |
| FIELD-004 | 6.2 — A local installation served from this computer also accepts a push service on this compute. | so its own browser journey can run one | none | none |
| FIELD-004 | 6.3 — A local installation served from this computer also accepts a push service on this compute. | a hosted installation accepts only https push services. | none | none |
| FIELD-004 | 7.1 — FIELD-005's native apps carry push in their own text. | FIELD-005's native apps carry push in their own text. | none | none |
| FIELD-009 | 1.1 — The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair who. | The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair whose private key is an owner-only installation secret (never in records | none | none |
| FIELD-009 | 1.2 — The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair who. | state | none | none |
| FIELD-009 | 1.3 — The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair who. | exports | none | none |
| FIELD-009 | 1.4 — The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair who. | logs or the archive) | none | none |
| FIELD-009 | 1.5 — The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair who. | turning them on again replaces the key | none | none |
| FIELD-009 | 1.6 — The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair who. | turning them off deletes the key | none | none |
| FIELD-009 | 1.7 — The owner turns phone notifications on under More → Team: Glove makes a VAPID key pair who. | every subscription. | none | none |
| FIELD-009 | 2.1 — A Technician turns notifications on for each phone. | A Technician turns notifications on for each phone. | none | none |
| FIELD-009 | 3.1 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | A subscription (the push service address | none | none |
| FIELD-009 | 3.2 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | the phone's keys) belongs to that person | none | none |
| FIELD-009 | 3.3 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | that device and that signed-in session | none | none |
| FIELD-009 | 3.4 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | only that person reads it back | none | none |
| FIELD-009 | 3.5 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | as their list of phones (a label | none | none |
| FIELD-009 | 3.6 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | the last outcome and when | none | none |
| FIELD-009 | 3.7 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | never the address or keys) | none | none |
| FIELD-009 | 3.8 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | and it is deleted when they remove it | none | none |
| FIELD-009 | 3.9 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | sign out on that phone | none | none |
| FIELD-009 | 3.10 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | the session is ended elsewhere or expires | none | none |
| FIELD-009 | 3.11 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | they stop being an active Technician (a role change or deactivation) | none | none |
| FIELD-009 | 3.12 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | the push service no longer knows it (HTTP 404 or 410) | none | none |
| FIELD-009 | 3.13 — A subscription (the push service address and the phone's keys) belongs to that person, tha. | or the owner turns notifications off. | none | none |
| FIELD-009 | 4.1 — It is never in records, exports or the archive, so a restored installation needs fresh sub. | It is never in records | none | none |
| FIELD-009 | 4.2 — It is never in records, exports or the archive, so a restored installation needs fresh sub. | exports or the archive | none | none |
| FIELD-009 | 4.3 — It is never in records, exports or the archive, so a restored installation needs fresh sub. | so a restored installation needs fresh subscriptions. | none | none |
| FIELD-010 | 1.1 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | After every committed change | none | none |
| FIELD-010 | 1.2 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | whoever or whatever made it (a person | none | none |
| FIELD-010 | 1.3 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | a rule | none | none |
| FIELD-010 | 1.4 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | a recurring series | none | none |
| FIELD-010 | 1.5 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | an agent under the owner's grant | none | none |
| FIELD-010 | 1.6 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | a move-in) | none | none |
| FIELD-010 | 1.7 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | each technician with a visit that has not ended and was booked to them | none | none |
| FIELD-010 | 1.8 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | moved (its start or end changed) | none | none |
| FIELD-010 | 1.9 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | canceled | none | none |
| FIELD-010 | 1.10 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | or handed to another technician gets one push on each subscribed phone: "New visit on your schedule" (also for the technician who receives a handed-over visit) | none | none |
| FIELD-010 | 1.11 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | "Visit moved" | none | none |
| FIELD-010 | 1.12 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | "Visit canceled" or "Visit moved off your schedule" | none | none |
| FIELD-010 | 1.13 — After every committed change, whoever or whatever made it (a person, a rule, a recurring s. | or "N changes to your schedule" when one change touches several of their visits. | none | none |
| FIELD-010 | 2.1 — A push carries only that line and, when one visit changed, the job's opaque id; never the. | A push carries only that line and | none | none |
| FIELD-010 | 2.2 — A push carries only that line and, when one visit changed, the job's opaque id; never the. | when one visit changed | none | none |
| FIELD-010 | 2.3 — A push carries only that line and, when one visit changed, the job's opaque id; never the. | the job's opaque id | none | none |
| FIELD-010 | 2.4 — A push carries only that line and, when one visit changed, the job's opaque id; never the. | never the customer | none | none |
| FIELD-010 | 2.5 — A push carries only that line and, when one visit changed, the job's opaque id; never the. | site | none | none |
| FIELD-010 | 2.6 — A push carries only that line and, when one visit changed, the job's opaque id; never the. | time or a note. | none | none |
| FIELD-010 | 3.1 — Each push is encrypted for the phone (RFC 8291, aes128gcm) and signed with the VAPID key (. | Each push is encrypted for the phone (RFC 8291 | none | none |
| FIELD-010 | 3.2 — Each push is encrypted for the phone (RFC 8291, aes128gcm) and signed with the VAPID key (. | aes128gcm) and signed with the VAPID key (RFC 8292: a 12-hour token naming the business email | none | none |
| FIELD-010 | 3.3 — Each push is encrypted for the phone (RFC 8291, aes128gcm) and signed with the VAPID key (. | else the installation address) | none | none |
| FIELD-010 | 3.4 — Each push is encrypted for the phone (RFC 8291, aes128gcm) and signed with the VAPID key (. | kept by the push service for at most a day | none | none |
| FIELD-010 | 3.5 — Each push is encrypted for the phone (RFC 8291, aes128gcm) and signed with the VAPID key (. | sent once | none | none |
| FIELD-010 | 3.6 — Each push is encrypted for the phone (RFC 8291, aes128gcm) and signed with the VAPID key (. | never retried. | none | none |
| FIELD-010 | 4.1 — The phone list says "Handed to the push service" (not "delivered", which Glove cannot see). | The phone list says "Handed to the push service" (not "delivered" | none | none |
| FIELD-010 | 4.2 — The phone list says "Handed to the push service" (not "delivered", which Glove cannot see). | which Glove cannot see) | none | none |
| FIELD-010 | 4.3 — The phone list says "Handed to the push service" (not "delivered", which Glove cannot see). | "Not sent: the push service answered HTTP <status>" or "Not sent: the push service could not be reached". | none | none |
| FIELD-006 | 1.1 — A fixture submits three fixture nameplate photos (model provider fake), checks the propose. | A fixture submits three fixture nameplate photos (model provider fake) | none | none |
| FIELD-006 | 1.2 — A fixture submits three fixture nameplate photos (model provider fake), checks the propose. | checks the proposed fields and | none | none |
| FIELD-006 | 1.3 — A fixture submits three fixture nameplate photos (model provider fake), checks the propose. | under the held company policy | none | none |
| FIELD-006 | 1.4 — A fixture submits three fixture nameplate photos (model provider fake), checks the propose. | checks nothing is saved until the technician confirms. | none | none |
| FIELD-006 | 2.1 — The model provider is the owner's own: an OpenAI-compatible chat-completions address (http. | The model provider is the owner's own: an OpenAI-compatible chat-completions address (https) | none | none |
| FIELD-006 | 2.2 — The model provider is the owner's own: an OpenAI-compatible chat-completions address (http. | one model id | none | none |
| FIELD-006 | 2.3 — The model provider is the owner's own: an OpenAI-compatible chat-completions address (http. | the owner's key | none | none |
| FIELD-006 | 2.4 — The model provider is the owner's own: an OpenAI-compatible chat-completions address (http. | connected by the owner only and kept like the marketing keys (never in records | none | none |
| FIELD-006 | 2.5 — The model provider is the owner's own: an OpenAI-compatible chat-completions address (http. | exports | none | none |
| FIELD-006 | 2.6 — The model provider is the owner's own: an OpenAI-compatible chat-completions address (http. | logs or the archive) | none | none |
| FIELD-006 | 2.7 — The model provider is the owner's own: an OpenAI-compatible chat-completions address (http. | without it nothing is read. | none | none |
| FIELD-006 | 3.1 — The technician reads a nameplate on a visit they are working, for a unit already at the si. | The technician reads a nameplate on a visit they are working | none | none |
| FIELD-006 | 3.2 — The technician reads a nameplate on a visit they are working, for a unit already at the si. | for a unit already at the site or one not recorded yet | none | none |
| FIELD-006 | 3.3 — The technician reads a nameplate on a visit they are working, for a unit already at the si. | only the photo goes to the provider (no customer | none | none |
| FIELD-006 | 3.4 — The technician reads a nameplate on a visit they are working, for a unit already at the si. | site or job details) | none | none |
| FIELD-006 | 3.5 — The technician reads a nameplate on a visit they are working, for a unit already at the si. | asking for JSON with storage off. | none | none |
| FIELD-006 | 4.1 — The reading is labelled as read by the model and carries its evidence and uncertainty. | The reading is labelled as read by the model and carries its evidence and uncertainty. | none | none |
| FIELD-006 | 5.1 — The company’s policy decides whether the standard-class reading fills the equipment fields. | The company’s policy decides whether the standard-class reading fills the equipment fields or waits for the technician. | none | none |
| FIELD-006 | 6.1 — Under the held policy the technician who took it confirms or corrects the fields or discar. | Under the held policy the technician who took it confirms or corrects the fields or discards the reading | none | none |
| FIELD-006 | 6.2 — Under the held policy the technician who took it confirms or corrects the fields or discar. | keeping the proposed and corrected fields distinct. | none | none |
| FIELD-011 | 1.1 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anyt. | A manufacture date is kept as printed to its precision (YYYY | none | none |
| FIELD-011 | 1.2 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anyt. | YYYY-MM or YYYY-MM-DD) | none | none |
| FIELD-011 | 1.3 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anyt. | anything else is left unread | none | none |
| FIELD-011 | 1.4 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anyt. | as is any field the model returns empty. "Where one is available" means the manual library the desk keeps (make | none | none |
| FIELD-011 | 1.5 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anyt. | model | none | none |
| FIELD-011 | 1.6 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anyt. | title | none | none |
| FIELD-011 | 1.7 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anyt. | https address): on confirmation the manual whose make and model match | none | none |
| FIELD-011 | 1.8 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anyt. | ignoring case and surrounding spaces | none | none |
| FIELD-011 | 1.9 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anyt. | is attached | none | none |
| FIELD-011 | 1.10 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anyt. | Glove never invents | none | none |
| FIELD-011 | 1.11 — A manufacture date is kept as printed to its precision (YYYY, YYYY-MM or YYYY-MM-DD); anyt. | searches for or fetches a manual. | none | none |
| FIELD-011 | 2.1 — Reading needs a signal; the confirmed unit and its manual are then in the phone's offline. | Reading needs a signal | none | none |
| FIELD-011 | 2.2 — Reading needs a signal; the confirmed unit and its manual are then in the phone's offline. | the confirmed unit | none | none |
| FIELD-011 | 2.3 — Reading needs a signal; the confirmed unit and its manual are then in the phone's offline. | its manual are then in the phone's offline day (FIELD-001). | none | none |
| FIELD-007 | 1.1 — A fixture records refrigerant added and recovered on two visits to one condenser and reads. | A fixture records refrigerant added and recovered on two visits to one condenser | `tests/api/equipment.test.mjs:91` | asserted |
| FIELD-007 | 1.2 — A fixture records refrigerant added and recovered on two visits to one condenser and reads. | reads the equipment log | `tests/api/equipment.test.mjs:91` | asserted |
| FIELD-007 | 1.3 — A fixture records refrigerant added and recovered on two visits to one condenser and reads. | the period total. | `tests/api/equipment.test.mjs:98` | asserted |
| COST-001 | 1.1 — A fixture clocks in, starts travel and job timers on two visits with one offline stretch. | A fixture clocks in | none | none |
| COST-001 | 1.2 — A fixture clocks in, starts travel and job timers on two visits with one offline stretch. | starts travel and job timers on two visits with one offline stretch | none | none |
| COST-001 | 1.3 — A fixture clocks in, starts travel and job timers on two visits with one offline stretch. | clocks out | none | none |
| COST-001 | 1.4 — A fixture clocks in, starts travel and job timers on two visits with one offline stretch. | checks the time on each job | none | none |
| COST-001 | 1.5 — A fixture clocks in, starts travel and job timers on two visits with one offline stretch. | a desk correction keeps the original | none | none |
| COST-001 | 1.6 — A fixture clocks in, starts travel and job timers on two visits with one offline stretch. | the REPORT-001 on-the-clock tile lists exactly the technicians clocked in at each step. | none | none |
| COST-001 | 2.1 — A technician clocks in and out on the phone and, only while clocked in, runs one timer at. | A technician clocks in and out on the phone and | none | none |
| COST-001 | 2.2 — A technician clocks in and out on the phone and, only while clocked in, runs one timer at. | only while clocked in | none | none |
| COST-001 | 2.3 — A technician clocks in and out on the phone and, only while clocked in, runs one timer at. | runs one timer at a time | none | none |
| COST-001 | 2.4 — A technician clocks in and out on the phone and, only while clocked in, runs one timer at. | travel or on the job | none | none |
| COST-001 | 2.5 — A technician clocks in and out on the phone and, only while clocked in, runs one timer at. | on a visit currently assigned to them | none | none |
| COST-001 | 2.6 — A technician clocks in and out on the phone and, only while clocked in, runs one timer at. | starting a timer stops the running one at the same phone time | none | none |
| COST-001 | 2.7 — A technician clocks in and out on the phone and, only while clocked in, runs one timer at. | clocking out or completing the visit stops it too. | none | none |
| COST-001 | 3.1 — Every start and stop carries the phone's clock time and goes through the phone's outbox wi. | Every start and stop carries the phone's clock time and goes through the phone's outbox with the identity it was given | none | none |
| COST-001 | 3.2 — Every start and stop carries the phone's clock time and goes through the phone's outbox wi. | so it works without signal | none | none |
| COST-001 | 3.3 — Every start and stop carries the phone's clock time and goes through the phone's outbox wi. | a resend lands once (GLOVE-06). | none | none |
| COST-001 | 4.1 — An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of. | An entry counts end − start in whole minutes | none | none |
| COST-001 | 4.2 — An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of. | rounded half up | none | none |
| COST-001 | 4.3 — An entry counts end − start in whole minutes, rounded half up; a job's time is the sum of. | a job's time is the sum of its entries per kind. | none | none |
| COST-001 | 5.1 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local da. | The desk (owner | none | none |
| COST-001 | 5.2 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local da. | dispatcher | none | none |
| COST-001 | 5.3 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local da. | office) corrects a stopped entry's start and end | none | none |
| COST-001 | 5.4 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local da. | as local dates and times in the business timezone | none | none |
| COST-001 | 5.5 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local da. | with a reason | none | none |
| COST-001 | 5.6 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local da. | the entry keeps the phone's original times | none | none |
| COST-001 | 5.7 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local da. | every correction (who | none | none |
| COST-001 | 5.8 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local da. | when | none | none |
| COST-001 | 5.9 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local da. | reason | none | none |
| COST-001 | 5.10 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local da. | from and to) | none | none |
| COST-001 | 5.11 — The desk (owner, dispatcher, office) corrects a stopped entry's start and end, as local da. | the job's timeline records it. | none | none |
| COST-001 | 6.1 — Technicians read only their own entries. | Technicians read only their own entries. | none | none |
| COST-001 | 7.1 — The REPORT-001 on-the-clock tile lists the technicians with a shift clocked in and not o. | The REPORT-001 on-the-clock tile lists the technicians with a shift clocked in and not out | none | none |
| COST-001 | 7.2 — The REPORT-001 on-the-clock tile lists the technicians with a shift clocked in and not o. | with the timer each is running. | none | none |
| COST-002 | 1.1 — A fixture builds a 44-hour week, approves it, and checks the overtime split and the Gusto. | A fixture builds a 44-hour week | none | none |
| COST-002 | 1.2 — A fixture builds a 44-hour week, approves it, and checks the overtime split and the Gusto. | approves it | none | none |
| COST-002 | 1.3 — A fixture builds a 44-hour week, approves it, and checks the overtime split and the Gusto. | checks the overtime split | none | none |
| COST-002 | 1.4 — A fixture builds a 44-hour week, approves it, and checks the overtime split and the Gusto. | the Gusto and QuickBooks Payroll exports | none | none |
| COST-002 | 1.5 — A fixture builds a 44-hour week, approves it, and checks the overtime split and the Gusto. | a subcontractor's total appears only in the 1099 export. | none | none |
| COST-002 | 2.1 — A workweek is seven local days in the business time zone from the owner's week-start day (. | A workweek is seven local days in the business time zone from the owner's week-start day (Monday unless the owner sets another | none | none |
| COST-002 | 2.2 — A workweek is seven local days in the business time zone from the owner's week-start day (. | fixed once any timesheet is approved). | none | none |
| COST-002 | 3.1 — Each closed shift counts its whole minutes (COST-001 rounding) on the local day it start. | Each closed shift counts its whole minutes (COST-001 rounding) on the local day it started | none | none |
| COST-002 | 3.2 — Each closed shift counts its whole minutes (COST-001 rounding) on the local day it start. | including a shift that runs past midnight | none | none |
| COST-002 | 3.3 — Each closed shift counts its whole minutes (COST-001 rounding) on the local day it start. | job and travel timer minutes are shown beside it | none | none |
| COST-002 | 3.4 — Each closed shift counts its whole minutes (COST-001 rounding) on the local day it start. | paid hours are the shift (clock) time. | none | none |
| COST-002 | 4.1 — When the owner sets a state rule, minutes past the "after" hours in a day are overtime and. | When the owner sets a state rule | none | none |
| COST-002 | 4.2 — When the owner sets a state rule, minutes past the "after" hours in a day are overtime and. | minutes past the "after" hours in a day are overtime and minutes past the optional "double after" hours are double time (quarter-hour settings | none | none |
| COST-002 | 4.3 — When the owner sets a state rule, minutes past the "after" hours in a day are overtime and. | double after overtime) | none | none |
| COST-002 | 4.4 — When the owner sets a state rule, minutes past the "after" hours in a day are overtime and. | then | none | none |
| COST-002 | 4.5 — When the owner sets a state rule, minutes past the "after" hours in a day are overtime and. | day by day in order | none | none |
| COST-002 | 4.6 — When the owner sets a state rule, minutes past the "after" hours in a day are overtime and. | regular minutes beyond 40 hours in the workweek become overtime. | none | none |
| COST-002 | 5.1 — Seventh-day and other state rules are not applied. | Seventh-day and other state rules are not applied. | none | none |
| COST-002 | 6.1 — Hours are each bucket's minutes / 60, rounded half up to two decimals, so rounded buckets. | Hours are each bucket's minutes / 60 | none | none |
| COST-002 | 6.2 — Hours are each bucket's minutes / 60, rounded half up to two decimals, so rounded buckets. | rounded half up to two decimals | none | none |
| COST-002 | 6.3 — Hours are each bucket's minutes / 60, rounded half up to two decimals, so rounded buckets. | so rounded buckets can differ from the rounded total by 0.01. | none | none |
| COST-002 | 7.1 — A timesheet is flagged when it holds any overtime or double time. | A timesheet is flagged when it holds any overtime or double time. | none | none |
| COST-002 | 8.1 — Whoever reads time entries reads the week's timesheets (a technician only their own; a sub. | Whoever reads time entries reads the week's timesheets (a technician only their own | none | none |
| COST-002 | 8.2 — Whoever reads time entries reads the week's timesheets (a technician only their own; a sub. | a subcontractor none). | none | none |
| COST-006 | 1.1 — Only the owner (acting for "admin") approves a week, and only once no shift in it is still. | Only the owner (acting for "admin") approves a week | none | none |
| COST-006 | 1.2 — Only the owner (acting for "admin") approves a week, and only once no shift in it is still. | only once no shift in it is still open | none | none |
| COST-006 | 1.3 — Only the owner (acting for "admin") approves a week, and only once no shift in it is still. | an approval stands while the week's entries | none | none |
| COST-006 | 1.4 — Only the owner (acting for "admin") approves a week, and only once no shift in it is still. | their split are unchanged. | none | none |
| COST-006 | 2.1 — A later correction, late entry or overtime-rule change marks it "changed since approval" u. | A later correction | none | none |
| COST-006 | 2.2 — A later correction, late entry or overtime-rule change marks it "changed since approval" u. | late entry or overtime-rule change marks it "changed since approval" until the owner approves it again. | none | none |
| COST-006 | 3.1 — The payroll files are for a pay period of 1 to 6 whole workweeks, read by the owner and of. | The payroll files are for a pay period of 1 to 6 whole workweeks | none | none |
| COST-006 | 3.2 — The payroll files are for a pay period of 1 to 6 whole workweeks, read by the owner and of. | read by the owner and office like the other exports. | none | none |
| COST-006 | 4.1 — They hold only people whose every week with time in the period is approved and unchanged. | They hold only people whose every week with time in the period is approved and unchanged | none | none |
| COST-006 | 4.2 — They hold only people whose every week with time in the period is approved and unchanged. | they list everyone left out with the reason. | none | none |
| COST-006 | 5.1 — A technician record marked as a 1099 subcontractor (DISP-007, DISP-013, DISP-014) is nev. | A technician record marked as a 1099 subcontractor (DISP-007, DISP-013, DISP-014) is never in the payroll files or approvable | none | none |
| COST-006 | 5.2 — A technician record marked as a 1099 subcontractor (DISP-007, DISP-013, DISP-014) is nev. | their agreed-amount totals are only in the 1099-NEC export. | none | none |
| COST-006 | 6.1 — The files follow what each provider publishes, checked against the provider's own help on. | The files follow what each provider publishes | none | none |
| COST-006 | 6.2 — The files follow what each provider publishes, checked against the provider's own help on. | checked against the provider's own help on 21 October 2026. | none | none |
| COST-006 | 7.1 — The employee ID is the payroll ID the owner keeps on each technician record. | The employee ID is the payroll ID the owner keeps on each technician record. | none | none |
| COST-006 | 8.1 — None of these files has yet been uploaded to a live Gusto, ADP RUN or QuickBooks account. | None of these files has yet been uploaded to a live Gusto | none | none |
| COST-006 | 8.2 — None of these files has yet been uploaded to a live Gusto, ADP RUN or QuickBooks account. | ADP RUN or QuickBooks account | none | none |
| COST-006 | 8.3 — None of these files has yet been uploaded to a live Gusto, ADP RUN or QuickBooks account. | Glove pays no one and files nothing. | none | none |
| COST-007 | 1.1 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418A) defines the layout | none | none |
| COST-007 | 1.2 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | the file follows it exactly: a the documented refusal version row | none | none |
| COST-007 | 1.3 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | the column titles IID | none | none |
| COST-007 | 1.4 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | Pay Frequency | none | none |
| COST-007 | 1.5 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | Pay Period Start Date | none | none |
| COST-007 | 1.6 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | Pay Period End Date | none | none |
| COST-007 | 1.7 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | Employee ID | none | none |
| COST-007 | 1.8 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | Earnings Code | none | none |
| COST-007 | 1.9 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | Pay Hours | none | none |
| COST-007 | 1.10 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | Dollars | none | none |
| COST-007 | 1.11 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | Separate Check | none | none |
| COST-007 | 1.12 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | Worked In Dept and Rate Code | none | none |
| COST-007 | 1.13 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | then one row per person and earnings code with the owner's company code (up to 10 letters and digits) | none | none |
| COST-007 | 1.14 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | pay frequency | none | none |
| COST-007 | 1.15 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | the period's start and end as MM/DD/YYYY | none | none |
| COST-007 | 1.16 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | the hours to two decimals | none | none |
| COST-007 | 1.17 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | Separate Check 0 (the regular check) and Rate Code BASE (the first pay rate on the employee) | none | none |
| COST-007 | 1.18 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | with the owner's earnings codes | none | none |
| COST-007 | 1.19 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | by default REG | none | none |
| COST-007 | 1.20 — RUN Powered by ADP: ADP's own "Time Sheet Import and RUN Powered by ADP" guide (GTSG V0418. | OTP and DBL. | none | none |
| COST-007 | 2.1 — Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is. | Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is downloaded inside Gusto | none | none |
| COST-007 | 2.2 — Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is. | its Smart Import matches columns on upload) | none | none |
| COST-007 | 2.3 — Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is. | Glove's column names (last name | none | none |
| COST-007 | 2.4 — Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is. | first name | none | none |
| COST-007 | 2.5 — Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is. | Gusto employee ID | none | none |
| COST-007 | 2.6 — Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is. | regular | none | none |
| COST-007 | 2.7 — Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is. | overtime and double-overtime hours | none | none |
| COST-007 | 2.8 — Gusto: Gusto publishes no fixed employee hours layout outside an account (its template is. | the first word of the technician's name is the first name) are therefore not confirmed against a Gusto-published layout. | none | none |
| COST-007 | 3.1 — The one column Gusto's help names, workweeks, is followed: one row per person and approved. | The one column Gusto's help names | none | none |
| COST-007 | 3.2 — The one column Gusto's help names, workweeks, is followed: one row per person and approved. | workweeks | none | none |
| COST-007 | 3.3 — The one column Gusto's help names, workweeks, is followed: one row per person and approved. | is followed: one row per person | none | none |
| COST-007 | 3.4 — The one column Gusto's help names, workweeks, is followed: one row per person and approved. | approved workweek | none | none |
| COST-007 | 3.5 — The one column Gusto's help names, workweeks, is followed: one row per person and approved. | holding that week's date range as the documented refusal beside that week's hours | none | none |
| COST-007 | 3.6 — The one column Gusto's help names, workweeks, is followed: one row per person and approved. | so Gusto places overtime in the right workweek. | none | none |
| COST-007 | 4.1 — Glove keeps no SSN and writes no SSN column. | Glove keeps no SSN and writes no SSN column. | none | none |
| COST-007 | 5.1 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom uplo. | QuickBooks Payroll: Intuit publishes no fixed timesheet columns | none | none |
| COST-007 | 5.2 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom uplo. | only that the custom upload takes one entry per line with the employee | none | none |
| COST-007 | 5.3 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom uplo. | a date plus units | none | none |
| COST-007 | 5.4 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom uplo. | the date format | none | none |
| COST-007 | 5.5 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom uplo. | each column's meaning chosen on upload | none | none |
| COST-007 | 5.6 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom uplo. | Glove's date-and-units file (employee display name | none | none |
| COST-007 | 5.7 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom uplo. | MM/DD/YYYY date | none | none |
| COST-007 | 5.8 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom uplo. | pay item Regular | none | none |
| COST-007 | 5.9 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom uplo. | Overtime or Double time | none | none |
| COST-007 | 5.10 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom uplo. | hours) is a file the owner maps on upload | none | none |
| COST-007 | 5.11 — QuickBooks Payroll: Intuit publishes no fixed timesheet columns, only that the custom uplo. | not a confirmed Intuit layout. | none | none |
| COST-003 | 1.1 — A fixture records a supply-house receipt as billable with 20% markup and a permit fee as n. | A fixture records a supply-house receipt as billable with 20% markup | `tests/api/expenses.test.mjs:42` | asserted |
| COST-003 | 1.2 — A fixture records a supply-house receipt as billable with 20% markup and a permit fee as n. | a permit fee as non-billable | `tests/api/expenses.test.mjs:42` | asserted |
| COST-003 | 1.3 — A fixture records a supply-house receipt as billable with 20% markup and a permit fee as n. | checks the invoice draft and job cost. | `tests/api/expenses.test.mjs:28`; `tests/api/expenses.test.mjs:41` | asserted |
| COST-004 | 1.1 — A fixture runs a job quoted at $1,850 with estimated 41% margin through recorded time, mat. | A fixture runs a job quoted at $1 | none | none |
| COST-004 | 1.2 — A fixture runs a job quoted at $1,850 with estimated 41% margin through recorded time, mat. | 850 with estimated 41% margin through recorded time | `tests/api/costing.test.mjs:24` | asserted |
| COST-004 | 1.3 — A fixture runs a job quoted at $1,850 with estimated 41% margin through recorded time, mat. | materials | none | none |
| COST-004 | 1.4 — A fixture runs a job quoted at $1,850 with estimated 41% margin through recorded time, mat. | an expense | none | none |
| COST-004 | 1.5 — A fixture runs a job quoted at $1,850 with estimated 41% margin through recorded time, mat. | checks actual cost | `tests/api/costing.test.mjs:42` | asserted |
| COST-004 | 1.6 — A fixture runs a job quoted at $1,850 with estimated 41% margin through recorded time, mat. | a 46% margin to the cent. | `tests/api/costing.test.mjs:42` | asserted |
| COST-004 | 2.1 — Revenue is the latest person-approved invoice revision's subtotal before tax, else the acc. | Revenue is the latest person-approved invoice revision's subtotal before tax | none | none |
| COST-004 | 2.2 — Revenue is the latest person-approved invoice revision's subtotal before tax, else the acc. | else the accepted quote's subtotal. | none | none |
| COST-004 | 3.1 — The estimated cost is each accepted line's unit cost (kept when the line was priced from t. | The estimated cost is each accepted line's unit cost (kept when the line was priced from the price book | none | none |
| COST-004 | 3.2 — The estimated cost is each accepted line's unit cost (kept when the line was priced from t. | MONEY-003, MONEY-006) × its quantity | none | none |
| COST-004 | 3.3 — The estimated cost is each accepted line's unit cost (kept when the line was priced from t. | a line without one counts at $0.00 and is named. | `tests/api/costing.test.mjs:27` | asserted |
| COST-004 | 4.1 — Actual labor is every travel and on-job entry (COST-001) at its whole minutes × that tec. | Actual labor is every travel and on-job entry (COST-001) at its whole minutes × that technician's loaded cost per hour ÷ 60 | `tests/api/costing.test.mjs:43` | asserted |
| COST-004 | 4.2 — Actual labor is every travel and on-job entry (COST-001) at its whole minutes × that tec. | materials are the price-book materials recorded on the job at the item's unit cost now | none | none |
| COST-004 | 4.3 — Actual labor is every travel and on-job entry (COST-001) at its whole minutes × that tec. | beyond what the job's own purchase orders received (STOCK-002) | none | none |
| COST-004 | 4.4 — Actual labor is every travel and on-job entry (COST-001) at its whole minutes × that tec. | whose received lines count at the order's unit cost | none | none |
| COST-004 | 4.5 — Actual labor is every travel and on-job entry (COST-001) at its whole minutes × that tec. | expenses and subcontractors are COST-003's amounts | `tests/api/costing.test.mjs:42` | asserted |
| COST-004 | 4.6 — Actual labor is every travel and on-job entry (COST-001) at its whole minutes × that tec. | subcontractor bills apart. | none | none |
| COST-004 | 5.1 — Each product is rounded half up to the cent; a margin is (revenue − cost) ÷ revenue as a p. | Each product is rounded half up to the cent | none | none |
| COST-004 | 5.2 — Each product is rounded half up to the cent; a margin is (revenue − cost) ÷ revenue as a p. | a margin is (revenue − cost) ÷ revenue as a percentage to one decimal | none | none |
| COST-004 | 5.3 — Each product is rounded half up to the cent; a margin is (revenue − cost) ÷ revenue as a p. | rounded half up | none | none |
| COST-004 | 5.4 — Each product is rounded half up to the cent; a margin is (revenue − cost) ÷ revenue as a p. | the difference from estimate is in dollars and margin points. | `tests/api/costing.test.mjs:44` | asserted |
| COST-004 | 6.1 — The owner sets each technician's loaded cost per hour; like every cost it is a margin figu. | The owner sets each technician's loaded cost per hour | `tests/api/costing.test.mjs:16` | asserted |
| COST-004 | 6.2 — The owner sets each technician's loaded cost per hour; like every cost it is a margin figu. | like every cost it is a margin figure | none | none |
| COST-004 | 6.3 — The owner sets each technician's loaded cost per hour; like every cost it is a margin figu. | read only by roles that read reports (MONEY-003, MONEY-006). | none | none |
| COST-004 | 7.1 — Reports take the jobs completed in a period (by local completion date, bounds inclusive) a. | Reports take the jobs completed in a period (by local completion date | none | none |
| COST-004 | 7.2 — Reports take the jobs completed in a period (by local completion date, bounds inclusive) a. | bounds inclusive) and roll them up by job type (the category of the job's first price-book line | `tests/api/costing.test.mjs:48` | asserted |
| COST-004 | 7.3 — Reports take the jobs completed in a period (by local completion date, bounds inclusive) a. | else Uncategorized) and by technician (their minutes | `tests/api/costing.test.mjs:49` | asserted |
| COST-004 | 7.4 — Reports take the jobs completed in a period (by local completion date, bounds inclusive) a. | labor cost | none | none |
| COST-004 | 7.5 — Reports take the jobs completed in a period (by local completion date, bounds inclusive) a. | the jobs they recorded time on). | none | none |
| COST-005 | 1.1 — A fixture records time past the threshold and checks one warning to each of the two people. | A fixture records time past the threshold | none | none |
| COST-005 | 1.2 — A fixture records time past the threshold and checks one warning to each of the two people. | checks one warning to each of the two people | `tests/api/margins.test.mjs:35` | asserted |
| COST-005 | 1.3 — A fixture records time past the threshold and checks one warning to each of the two people. | no repeat for the same crossing. | `tests/api/margins.test.mjs:42` | asserted |
| COST-005 | 2.1 — The owner sets, on the business, a cost threshold (warn when actual cost reaches this perc. | The owner sets | none | none |
| COST-005 | 2.2 — The owner sets, on the business, a cost threshold (warn when actual cost reaches this perc. | on the business | none | none |
| COST-005 | 2.3 — The owner sets, on the business, a cost threshold (warn when actual cost reaches this perc. | a cost threshold (warn when actual cost reaches this percentage of the estimate) | none | none |
| COST-005 | 2.4 — The owner sets, on the business, a cost threshold (warn when actual cost reaches this perc. | a margin floor (warn when projected margin falls below this percentage) | none | none |
| COST-005 | 2.5 — The owner sets, on the business, a cost threshold (warn when actual cost reaches this perc. | either can be blank | none | none |
| COST-005 | 2.6 — The owner sets, on the business, a cost threshold (warn when actual cost reaches this perc. | meaning off. | none | none |
| COST-005 | 3.1 — After every command, each open job is checked with COST-004's figures; its projected cos. | After every command | none | none |
| COST-005 | 3.2 — After every command, each open job is checked with COST-004's figures; its projected cos. | each open job is checked with COST-004's figures | none | none |
| COST-005 | 3.3 — After every command, each open job is checked with COST-004's figures; its projected cos. | its projected cost is the larger of actual and estimated cost | `tests/api/margins.test.mjs:38` | asserted |
| COST-005 | 3.4 — After every command, each open job is checked with COST-004's figures; its projected cos. | a job with no estimated cost never crosses the threshold. | none | none |
| COST-005 | 4.1 — A crossing is one warning shown in Glove to the owner and to every dispatcher, on their de. | A crossing is one warning shown in Glove to the owner and to every dispatcher | `tests/api/margins.test.mjs:35` | asserted |
| COST-005 | 4.2 — A crossing is one warning shown in Glove to the owner and to every dispatcher, on their de. | on their desk screens and on the job's timeline | none | none |
| COST-005 | 4.3 — A crossing is one warning shown in Glove to the owner and to every dispatcher, on their de. | nothing is sent (no email or text). | none | none |
| COST-005 | 5.1 — A warning is kept once per job, kind and setting, so the same crossing never repeats; chan. | A warning is kept once per job | none | none |
| COST-005 | 5.2 — A warning is kept once per job, kind and setting, so the same crossing never repeats; chan. | kind and setting | none | none |
| COST-005 | 5.3 — A warning is kept once per job, kind and setting, so the same crossing never repeats; chan. | so the same crossing never repeats | none | none |
| COST-005 | 5.4 — A warning is kept once per job, kind and setting, so the same crossing never repeats; chan. | changing a setting can warn again. | none | none |
| COST-005 | 6.1 — Like every cost, warnings are read only by the owner and dispatchers they are addressed to. | Like every cost | none | none |
| COST-005 | 6.2 — Like every cost, warnings are read only by the owner and dispatchers they are addressed to. | warnings are read only by the owner and dispatchers they are addressed to | `tests/api/margins.test.mjs:35`; `tests/api/margins.test.mjs:36` | asserted |
| COST-005 | 6.3 — Like every cost, warnings are read only by the owner and dispatchers they are addressed to. | their timeline entries only by roles that read reports. | none | none |
| PAY-004 | 1.1 — A fixture pays an invoice in three parts (one by check), refunds $50 to the card (Stripe f. | A fixture pays an invoice in three parts (one by check) | none | none |
| PAY-004 | 1.2 — A fixture pays an invoice in three parts (one by check), refunds $50 to the card (Stripe f. | refunds $50 to the card (Stripe fake) | none | none |
| PAY-004 | 1.3 — A fixture pays an invoice in three parts (one by check), refunds $50 to the card (Stripe f. | checks the invoice | none | none |
| PAY-004 | 1.4 — A fixture pays an invoice in three parts (one by check), refunds $50 to the card (Stripe f. | customer balance and refund record | none | none |
| PAY-004 | 1.5 — A fixture pays an invoice in three parts (one by check), refunds $50 to the card (Stripe f. | that the REPORT-001 receivables tile equals the open balances after each step. | none | none |
| PAY-004 | 2.1 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | The journey records each new DATA-002 | none | none |
| PAY-004 | 2.3 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | DATA-010 event in Activity | none | none |
| PAY-004 | 2.4 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | the business export | none | none |
| PAY-004 | 2.5 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | including provider outcomes and references without secrets. | none | none |
| PAY-004 | 3.1 — Any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link an. | Any email that is not strictly transactional also carries the CAN-SPAM unsubscribe link and postal address. | none | none |
| PAY-021 | 1.1 — Payment checkout action accepts an optional positive installment amount up to the invoice’. | Payment checkout action accepts an optional positive installment amount up to the invoice’s unpaid balance | none | none |
| PAY-021 | 1.2 — Payment checkout action accepts an optional positive installment amount up to the invoice’. | the owner-only | none | none |
| PAY-021 | 1.3 — Payment checkout action accepts an optional positive installment amount up to the invoice’. | show-once test Checkout boundary of PAY-002 | none | none |
| PAY-021 | 1.7 — Payment checkout action accepts an optional positive installment amount up to the invoice’. | PAY-020 remains. | none | none |
| PAY-021 | 2.1 — The signed-in office or owner records cash/check receipts (payment record action) with a r. | The signed-in office or owner records cash/check receipts (payment record action) with a reference | none | none |
| PAY-021 | 2.2 — The signed-in office or owner records cash/check receipts (payment record action) with a r. | these are staff records | none | none |
| PAY-021 | 2.3 — The signed-in office or owner records cash/check receipts (payment record action) with a r. | never provider-confirmed claims. | none | none |
| PAY-021 | 3.1 — Overpayments remain customer credit on their invoice. | Overpayments remain customer credit on their invoice. | none | none |
| PAY-021 | 4.1 — Payment allocate action explicitly moves available credit to an unpaid invoice of the same. | Payment allocate action explicitly moves available credit to an unpaid invoice of the same customer | none | none |
| PAY-021 | 4.2 — Payment allocate action explicitly moves available credit to an unpaid invoice of the same. | currency and branch | none | none |
| PAY-021 | 4.3 — Payment allocate action explicitly moves available credit to an unpaid invoice of the same. | it never transfers money. | none | none |
| PAY-021 | 5.1 — The owner records a reasoned non-cash credit (payment credit action). | The owner records a reasoned non-cash credit (payment credit action). | none | none |
| PAY-021 | 6.1 — Invoice/customer balances (customer and invoice balances), aging, Today’s receivables and. | Invoice/customer balances (customer and invoice balances) | none | none |
| PAY-021 | 6.2 — Invoice/customer balances (customer and invoice balances), aging, Today’s receivables and. | aging | none | none |
| PAY-021 | 6.3 — Invoice/customer balances (customer and invoice balances), aging, Today’s receivables and. | Today’s receivables | none | none |
| PAY-021 | 6.4 — Invoice/customer balances (customer and invoice balances), aging, Today’s receivables and. | the owner’s linked overdue brief use the same cent ledger. | none | none |
| PAY-021 | 7.1 — Stripe test revenue/tips remain separate from office cash/check records. | Stripe test revenue/tips remain separate from office cash/check records. | none | none |
| PAY-021 | 8.1 — Transactional receipts for payments and refunds use COMM-001, COMM-010, COMM-011, COMM-012. | Transactional receipts for payments and refunds use COMM-001 | none | none |
| PAY-021 | 8.10 — Transactional receipts for payments and refunds use COMM-001, COMM-010, COMM-011, COMM-012. | COMM-018 with actual delivery facts. | none | none |
| PAY-022 | 1.2 — QUOTE-003, QUOTE-014 inherits job-held deposits and final-invoice allocation; PAY-009 inhe. | QUOTE-014 inherits job-held deposits and final-invoice allocation | none | none |
| PAY-022 | 1.3 — QUOTE-003, QUOTE-014 inherits job-held deposits and final-invoice allocation; PAY-009 inhe. | PAY-009 inherits keyed/saved-method entry without bypassing these allocation/refund rules. | none | none |
| PAY-023 | 1.1 — Only the signed-in owner refunds (payment refund action), at most the original confirmed a. | Only the signed-in owner refunds (payment refund action) | none | none |
| PAY-023 | 1.2 — Only the signed-in owner refunds (payment refund action), at most the original confirmed a. | at most the original confirmed amount less earlier confirmed or unresolved refunds | none | none |
| PAY-023 | 1.3 — Only the signed-in owner refunds (payment refund action), at most the original confirmed a. | using the original method. | none | none |
| PAY-023 | 2.1 — Refund amount is invoice principal and optional tip is separately bounded by the remaining. | Refund amount is invoice principal and optional tip is separately bounded by the remaining original tip | none | none |
| PAY-023 | 2.2 — Refund amount is invoice principal and optional tip is separately bounded by the remaining. | a tip-only refund changes tips/payroll | none | none |
| PAY-023 | 2.3 — Refund amount is invoice principal and optional tip is separately bounded by the remaining. | never invoice balance or tax. | none | none |
| PAY-023 | 3.1 — A subsequent return reverses only the remaining principal/tip, not a second copy of a prio. | A subsequent return reverses only the remaining principal/tip | none | none |
| PAY-023 | 3.2 — A subsequent return reverses only the remaining principal/tip, not a second copy of a prio. | not a second copy of a prior refund. | none | none |
| PAY-023 | 4.1 — Cash/check refunds record money already returned; Stripe refunds reserve durably before on. | Cash/check refunds record money already returned | none | none |
| PAY-023 | 4.2 — Cash/check refunds record money already returned; Stripe refunds reserve durably before on. | Stripe refunds reserve durably before one provider attempt with an idempotency key. | none | none |
| PAY-023 | 5.1 — Each refund has its own payment-linked record; pending/unknown refunds have no balance eff. | Each refund has its own payment-linked record | none | none |
| PAY-023 | 5.2 — Each refund has its own payment-linked record; pending/unknown refunds have no balance eff. | pending/unknown refunds have no balance effect and are never automatically resent. | none | none |
| PAY-023 | 6.1 — A pending provider reference can be read again (payment refund refresh action); only provi. | A pending provider reference can be read again (payment refund refresh action) | none | none |
| PAY-023 | 6.2 — A pending provider reference can be read again (payment refund refresh action); only provi. | only provider-confirmed success reopens a balance. | none | none |
| PAY-007 | 1.1 — A fixture replays a payout of six payments, one refund and fees (Stripe fake) and checks t. | A fixture replays a payout of six payments | none | none |
| PAY-007 | 1.2 — A fixture replays a payout of six payments, one refund and fees (Stripe fake) and checks t. | one refund and fees (Stripe fake) | none | none |
| PAY-007 | 1.3 — A fixture replays a payout of six payments, one refund and fees (Stripe fake) and checks t. | checks the payout reconciles to the cent | none | none |
| PAY-007 | 1.4 — A fixture replays a payout of six payments, one refund and fees (Stripe fake) and checks t. | with a deliberately missing payment listed as unmatched | none | none |
| PAY-007 | 1.5 — A fixture replays a payout of six payments, one refund and fees (Stripe fake) and checks t. | an instant payout (Stripe fake) with its fee reconciles the same way. | none | none |
| PAY-007 | 2.1 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | The journey records each new DATA-002 | none | none |
| PAY-007 | 2.3 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | DATA-010 event in Activity | none | none |
| PAY-007 | 2.4 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | the business export | none | none |
| PAY-007 | 2.5 — The journey records each new DATA-002, DATA-009, DATA-010 event in Activity and the busine. | including provider outcomes and references without secrets. | none | none |
| PAY-007 | 3.1 — The owner inspects a USD Stripe test payout (payout reconcile action). | The owner inspects a USD Stripe test payout (payout reconcile action). | none | none |
| PAY-007 | 4.1 — Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longe. | Automatic payouts use Stripe's paginated source balance transactions (up to 1 | none | none |
| PAY-007 | 4.2 — Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longe. | 000 | none | none |
| PAY-007 | 4.3 — Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longe. | a longer/incomplete list refuses reconciliation) and match confirmed payment/refund references | none | none |
| PAY-007 | 4.4 — Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longe. | gross cents and fees | none | none |
| PAY-007 | 4.5 — Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longe. | missing | none | none |
| PAY-007 | 4.6 — Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longe. | unconfirmed | none | none |
| PAY-007 | 4.7 — Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longe. | wrong-amount | none | none |
| PAY-007 | 4.8 — Automatic payouts use Stripe's paginated source balance transactions (up to 1,000; a longe. | wrong-fee/currency and unsupported sources are named. | none | none |
| PAY-007 | 5.1 — Bank amount plus any payout fee must equal source net exactly, and only provider-paid payo. | Bank amount plus any payout fee must equal source net exactly | none | none |
| PAY-007 | 5.2 — Bank amount plus any payout fee must equal source net exactly, and only provider-paid payo. | only provider-paid payouts reconcile. | none | none |
| PAY-007 | 6.1 — An unavailable payout fee refuses reconciliation; zero is never inferred. | An unavailable payout fee refuses reconciliation | none | none |
| PAY-007 | 6.2 — An unavailable payout fee refuses reconciliation; zero is never inferred. | zero is never inferred. | none | none |
| PAY-007 | 7.1 — Stripe does not attribute source payments to manual payouts. | Stripe does not attribute source payments to manual payouts. | none | none |
| PAY-007 | 8.1 — Those require an explicit owner-reviewed books allocation (payout allocate action), never. | Those require an explicit owner-reviewed books allocation (payout allocate action) | none | none |
| PAY-007 | 8.2 — Those require an explicit owner-reviewed books allocation (payout allocate action), never. | never claimed as Stripe source attribution | none | none |
| PAY-007 | 8.3 — Those require an explicit owner-reviewed books allocation (payout allocate action), never. | unreviewed sources remain unmatched. | none | none |
| PAY-025 | 1.1 — Cash/check deposits (payment deposit batch action) group 1–100 confirmed same-currency/bra. | Cash/check deposits (payment deposit batch action) group 1–100 confirmed same-currency/branch records once | none | none |
| PAY-025 | 1.2 — Cash/check deposits (payment deposit batch action) group 1–100 confirmed same-currency/bra. | net of prior recorded refunds | none | none |
| PAY-025 | 1.3 — Cash/check deposits (payment deposit batch action) group 1–100 confirmed same-currency/bra. | as staff-recorded deposits without a bank-confirmation claim. | none | none |
| PAY-025 | 2.1 — Only the owner reads provider-wide payout and fee records; the office sees its branch's ca. | Only the owner reads provider-wide payout and fee records | none | none |
| PAY-025 | 2.2 — Only the owner reads provider-wide payout and fee records; the office sees its branch's ca. | the office sees its branch's cash/check batches. | none | none |
| PAY-025 | 3.5 — DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 removes erased customer references from s. | DATA-008 removes erased customer references from shared payout source detail while retaining anonymous aggregate bank history. | none | none |
| PAY-026 | 1.1 — For Instant Payouts, the owner records their account-specific fee schedule (basis points a. | For Instant Payouts | none | none |
| PAY-026 | 1.2 — For Instant Payouts, the owner records their account-specific fee schedule (basis points a. | the owner records their account-specific fee schedule (basis points and minimum | none | none |
| PAY-026 | 1.3 — For Instant Payouts, the owner records their account-specific fee schedule (basis points a. | labelled owner-recorded and not verified by Glove) | none | none |
| PAY-026 | 1.4 — For Instant Payouts, the owner records their account-specific fee schedule (basis points a. | a preview checks an existing Stripe debit card's instant eligibility and funds | none | none |
| PAY-026 | 1.5 — For Instant Payouts, the owner records their account-specific fee schedule (basis points a. | computes the half-up fee | none | none |
| PAY-026 | 1.6 — For Instant Payouts, the owner records their account-specific fee schedule (basis points a. | requires selected source net to equal the proposed bank amount plus that fee. | none | none |
| PAY-026 | 2.1 — The owner explicitly confirms both displayed amounts within ten minutes; source availabili. | The owner explicitly confirms both displayed amounts within ten minutes | none | none |
| PAY-026 | 2.2 — The owner explicitly confirms both displayed amounts within ten minutes; source availabili. | source availability | none | none |
| PAY-026 | 2.3 — The owner explicitly confirms both displayed amounts within ten minutes; source availabili. | current connection | none | none |
| PAY-026 | 2.4 — The owner explicitly confirms both displayed amounts within ten minutes; source availabili. | schedule | none | none |
| PAY-026 | 2.5 — The owner explicitly confirms both displayed amounts within ten minutes; source availabili. | eligibility and funds are checked again. | none | none |
| PAY-026 | 3.1 — A durable reservation and Stripe idempotency key precede one request. | A durable reservation and Stripe idempotency key precede one request. | none | none |
| PAY-026 | 4.1 — Replay never resends an unknown outcome. | Replay never resends an unknown outcome. | none | none |
| PAY-026 | 5.1 — Sources cannot be allocated to another payout. | Sources cannot be allocated to another payout. | none | none |
| PAY-026 | 6.1 — Reconciliation checks the actual payout debit, source allocation and actual fee against th. | Reconciliation checks the actual payout debit | none | none |
| PAY-026 | 6.2 — Reconciliation checks the actual payout debit, source allocation and actual fee against th. | source allocation and actual fee against the confirmed preview | none | none |
| PAY-026 | 6.3 — Reconciliation checks the actual payout debit, source allocation and actual fee against th. | a difference stays unmatched. | none | none |
| PLAN-001 | 1.1 — A fixture creates a quarterly series, skips one visit, moves another, changes the rule fro. | A fixture creates a quarterly series | none | none |
| PLAN-001 | 1.2 — A fixture creates a quarterly series, skips one visit, moves another, changes the rule fro. | skips one visit | none | none |
| PLAN-001 | 1.3 — A fixture creates a quarterly series, skips one visit, moves another, changes the rule fro. | moves another | none | none |
| PLAN-001 | 1.4 — A fixture creates a quarterly series, skips one visit, moves another, changes the rule fro. | changes the rule from a date | none | none |
| PLAN-001 | 1.5 — A fixture creates a quarterly series, skips one visit, moves another, changes the rule fro. | checks every generated visit. | none | none |
| PLAN-001 | 2.1 — The dispatcher or owner makes an open job repeat (series create action) from a first local. | The dispatcher or owner makes an open job repeat (series create action) from a first local date | none | none |
| PLAN-001 | 2.2 — The dispatcher or owner makes an open job repeat (series create action) from a first local. | at a visit start and end time with one technician | none | none |
| PLAN-001 | 2.3 — The dispatcher or owner makes an open job repeat (series create action) from a first local. | on a rule: every 1–52 weeks (on the first date's weekday) | none | none |
| PLAN-001 | 2.4 — The dispatcher or owner makes an open job repeat (series create action) from a first local. | or every 1–52 months | none | none |
| PLAN-001 | 2.5 — The dispatcher or owner makes an open job repeat (series create action) from a first local. | or every year in named months | none | none |
| PLAN-001 | 2.6 — The dispatcher or owner makes an open job repeat (series create action) from a first local. | on a day of the month (the first date's unless given | none | none |
| PLAN-001 | 2.7 — The dispatcher or owner makes an open job repeat (series create action) from a first local. | a day the month lacks becomes its last day) or on the first to fourth or last given weekday of the month | none | none |
| PLAN-001 | 2.8 — The dispatcher or owner makes an open job repeat (series create action) from a first local. | intervals count from the rule's first date. | none | none |
| PLAN-001 | 3.1 — Dates are local dates in the business time zone. | Dates are local dates in the business time zone. | none | none |
| PLAN-001 | 4.1 — The series may end on a date (inclusive). | The series may end on a date (inclusive). | none | none |
| PLAN-001 | 5.1 — Visits are booked for every occurrence through the earlier of that end and today plus the. | Visits are booked for every occurrence through the earlier of that end and today plus the series' rolling horizon (7–730 days | none | none |
| PLAN-001 | 5.2 — Visits are booked for every occurrence through the earlier of that end and today plus the. | 365 by default): at create | none | none |
| PLAN-001 | 5.3 — Visits are booked for every occurrence through the earlier of that end and today plus the. | change | none | none |
| PLAN-001 | 5.4 — Visits are booked for every occurrence through the earlier of that end and today plus the. | conflicts are reviewed under GLOVE-05 as for one booking | none | none |
| PLAN-001 | 5.5 — Visits are booked for every occurrence through the earlier of that end and today plus the. | after every later command the horizon rolls forward | none | none |
| PLAN-001 | 5.6 — Visits are booked for every occurrence through the earlier of that end and today plus the. | the newly booked visits carry their conflicts unreviewed | none | none |
| PLAN-001 | 5.7 — Visits are booked for every occurrence through the earlier of that end and today plus the. | named on the job timeline for review on Dispatch | none | none |
| PLAN-001 | 5.8 — Visits are booked for every occurrence through the earlier of that end and today plus the. | an occurrence that cannot be booked (for example an inactive technician) is recorded once on the series and named on the timeline. | none | none |
| PLAN-006 | 1.1 — Each visit is an ordinary visit carrying its rule revision and occurrence date: moving it. | Each visit is an ordinary visit carrying its rule revision and occurrence date: moving it (visit change action) or skipping it (visit cancel action | none | none |
| PLAN-006 | 1.2 — Each visit is an ordinary visit carrying its rule revision and occurrence date: moving it. | labelled skipped) leaves the series unchanged | none | none |
| PLAN-006 | 1.3 — Each visit is an ordinary visit carrying its rule revision and occurrence date: moving it. | an occurrence that has a visit is never booked again. | none | none |
| PLAN-006 | 2.1 — Changing the series from a date (series change action, with a reason, not before its first. | Changing the series from a date (series change action | none | none |
| PLAN-006 | 2.2 — Changing the series from a date (series change action, with a reason, not before its first. | with a reason | none | none |
| PLAN-006 | 2.3 — Changing the series from a date (series change action, with a reason, not before its first. | not before its first date) starts a new rule revision there: visits on or after that date that are still booked and untouched (no arrival | none | none |
| PLAN-006 | 2.4 — Changing the series from a date (series change action, with a reason, not before its first. | never moved) are canceled with that reason and booked again under the new revision | none | none |
| PLAN-006 | 2.5 — Changing the series from a date (series change action, with a reason, not before its first. | earlier visits and moved | none | none |
| PLAN-006 | 2.6 — Changing the series from a date (series change action, with a reason, not before its first. | skipped | none | none |
| PLAN-006 | 2.7 — Changing the series from a date (series change action, with a reason, not before its first. | started or completed ones stay as they are. | none | none |
| PLAN-006 | 3.1 — Completing one visit leaves a recurring job open; a visit completes the job only once the. | Completing one visit leaves a recurring job open | none | none |
| PLAN-006 | 3.2 — Completing one visit leaves a recurring job open; a visit completes the job only once the. | a visit completes the job only once the series has an end date | none | none |
| PLAN-006 | 3.3 — Completing one visit leaves a recurring job open; a visit completes the job only once the. | has booked through it | none | none |
| PLAN-006 | 3.4 — Completing one visit leaves a recurring job open; a visit completes the job only once the. | no other visit of the job is booked. | none | none |
| PLAN-006 | 4.1 — The series' invoicing rule comes with PLAN-005, PLAN-012, PLAN-013, which carries it in. | The series' invoicing rule comes with PLAN-005, PLAN-012, PLAN-013 | none | none |
| PLAN-006 | 4.2 — The series' invoicing rule comes with PLAN-005, PLAN-012, PLAN-013, which carries it in. | which carries it in its text and acceptance | none | none |
| PLAN-006 | 4.3 — The series' invoicing rule comes with PLAN-005, PLAN-012, PLAN-013, which carries it in. | until then a recurring job is invoiced as one job under GLOVE-09. | none | none |
| PLAN-002 | 1.1 — A fixture sells a plan with two included tune-ups and 15% repair discount, books and compl. | A fixture sells a plan with two included tune-ups and 15% repair discount | none | none |
| PLAN-002 | 1.2 — A fixture sells a plan with two included tune-ups and 15% repair discount, books and compl. | books and completes one tune-up | none | none |
| PLAN-002 | 1.3 — A fixture sells a plan with two included tune-ups and 15% repair discount, books and compl. | quotes a repair | none | none |
| PLAN-002 | 1.4 — A fixture sells a plan with two included tune-ups and 15% repair discount, books and compl. | checks the entitlement count | none | none |
| PLAN-002 | 1.5 — A fixture sells a plan with two included tune-ups and 15% repair discount, books and compl. | the discount | none | none |
| PLAN-002 | 1.6 — A fixture sells a plan with two included tune-ups and 15% repair discount, books and compl. | that the completed tune-up's job carried the plan's inspection form | none | none |
| PLAN-002 | 1.7 — A fixture sells a plan with two included tune-ups and 15% repair discount, books and compl. | that the REPORT-001 agreements-due tile counts the agreement while its second tune-up is due | none | none |
| PLAN-002 | 1.8 — A fixture sells a plan with two included tune-ups and 15% repair discount, books and compl. | that the REPORT-002, REPORT-004 agreement report counts the sold agreement | none | none |
| PLAN-002 | 1.9 — A fixture sells a plan with two included tune-ups and 15% repair discount, books and compl. | no churn | none | none |
| PLAN-002 | 1.10 — A fixture sells a plan with two included tune-ups and 15% repair discount, books and compl. | that a CUST-004, CUST-006 "no agreement" segment excludes the customer. | none | none |
| PLAN-004 | 1.1 — A fixture generates 40 due visits, batch-books 30 by area, sends links for 8, records 2 de. | A fixture generates 40 due visits | none | none |
| PLAN-004 | 1.2 — A fixture generates 40 due visits, batch-books 30 by area, sends links for 8, records 2 de. | batch-books 30 by area | none | none |
| PLAN-004 | 1.3 — A fixture generates 40 due visits, batch-books 30 by area, sends links for 8, records 2 de. | sends links for 8 | none | none |
| PLAN-004 | 1.4 — A fixture generates 40 due visits, batch-books 30 by area, sends links for 8, records 2 de. | records 2 declines | none | none |
| PLAN-004 | 1.5 — A fixture generates 40 due visits, batch-books 30 by area, sends links for 8, records 2 de. | checks the due list shows exactly the remainder | none | none |
| PLAN-004 | 1.6 — A fixture generates 40 due visits, batch-books 30 by area, sends links for 8, records 2 de. | the REPORT-001 agreements-due tile the same number of due visits. | none | none |
| PLAN-004 | 2.1 — The due-visit list lists each included visit separately, identified by agreement and zero-. | The due-visit list lists each included visit separately | none | none |
| PLAN-004 | 2.2 — The due-visit list lists each included visit separately, identified by agreement and zero-. | identified by agreement and zero-based ordinal | none | none |
| PLAN-004 | 2.3 — The due-visit list lists each included visit separately, identified by agreement and zero-. | with its PLAN-002 due date | none | none |
| PLAN-004 | 2.4 — The due-visit list lists each included visit separately, identified by agreement and zero-. | customer | none | none |
| PLAN-004 | 2.5 — The due-visit list lists each included visit separately, identified by agreement and zero-. | site | none | none |
| PLAN-004 | 2.6 — The due-visit list lists each included visit separately, identified by agreement and zero-. | ZIP | none | none |
| PLAN-004 | 2.7 — The due-visit list lists each included visit separately, identified by agreement and zero-. | linked job and booking state. | none | none |
| PLAN-004 | 3.1 — Through defaults to the business's local today; optional from and through bounds include b. | Through defaults to the business's local today | none | none |
| PLAN-004 | 3.2 — Through defaults to the business's local today; optional from and through bounds include b. | optional from and through bounds include both ends | none | none |
| PLAN-004 | 3.3 — Through defaults to the business's local today; optional from and through bounds include b. | area matches the site's exact ZIP. | none | none |
| PLAN-004 | 4.1 — Completion removes only that entitlement, even if visits finish out of order. | Completion removes only that entitlement | none | none |
| PLAN-004 | 4.2 — Completion removes only that entitlement, even if visits finish out of order. | even if visits finish out of order. | none | none |
| PLAN-004 | 5.1 — Booking, cancellation, term expiry and ending an agreement do not silently remove outstand. | Booking | none | none |
| PLAN-004 | 5.2 — Booking, cancellation, term expiry and ending an agreement do not silently remove outstand. | cancellation | none | none |
| PLAN-004 | 5.3 — Booking, cancellation, term expiry and ending an agreement do not silently remove outstand. | term expiry and ending an agreement do not silently remove outstanding work. | none | none |
| PLAN-004 | 6.1 — New included jobs keep agreementVisitIndex; older jobs take the first unclaimed ordinal in. | New included jobs keep agreementVisitIndex | none | none |
| PLAN-004 | 6.2 — New included jobs keep agreementVisitIndex; older jobs take the first unclaimed ordinal in. | older jobs take the first unclaimed ordinal in stored order. | none | none |
| PLAN-004 | 7.1 — An existing job is retained when its booking is cancelled, so the desk can rebook it. | An existing job is retained when its booking is cancelled | none | none |
| PLAN-004 | 7.2 — An existing job is retained when its booking is cancelled, so the desk can rebook it. | so the desk can rebook it. | none | none |
| PLAN-007 | 1.1 — Today counts outstanding due visits, including those booked, and the owner morning brief l. | Today counts outstanding due visits | none | none |
| PLAN-007 | 1.2 — Today counts outstanding due visits, including those booked, and the owner morning brief l. | including those booked | none | none |
| PLAN-007 | 1.3 — Today counts outstanding due visits, including those booked, and the owner morning brief l. | the owner morning brief links each one to its customer's agreement and Dispatch. | none | none |
| PLAN-008 | 1.1 — Dispatch offers consecutive-slot batches through the existing job create action and visit. | Dispatch offers consecutive-slot batches through the existing job create action and visit book action doors | none | none |
| PLAN-008 | 1.2 — Dispatch offers consecutive-slot batches through the existing job create action and visit. | with their current authority and conflicts: each success | none | none |
| PLAN-008 | 1.3 — Dispatch offers consecutive-slot batches through the existing job create action and visit. | refusal is shown | none | none |
| PLAN-008 | 1.4 — Dispatch offers consecutive-slot batches through the existing job create action and visit. | a refused or interrupted booking remains due. | none | none |
| PLAN-008 | 2.1 — The Office may now book only jobs linked to an agreement under the approved booking semant. | The Office may now book only jobs linked to an agreement under the approved booking semantics below. | none | none |
| PLAN-008 | 3.1 — Customer links and the Office booking authority follow the approved semantics below. | Customer links | none | none |
| PLAN-008 | 3.2 — Customer links and the Office booking authority follow the approved semantics below. | the Office booking authority follow the approved semantics below. | none | none |
| PLAN-008 | 4.1 — The Office may visit book action only a job with an agreementId linking that job's custome. | The Office may visit book action only a job with an agreementId linking that job's customer and site | none | none |
| PLAN-008 | 4.2 — The Office may visit book action only a job with an agreementId linking that job's custome. | with the normal exact-conflict review | none | none |
| PLAN-008 | 4.3 — The Office may visit book action only a job with an agreementId linking that job's custome. | may neither visit change action nor visit cancel action | none | none |
| PLAN-008 | 4.4 — The Office may visit book action only a job with an agreementId linking that job's custome. | the dispatcher keeps every other booking. | none | none |
| PLAN-008 | 5.1 — Direct HTTP calls enforce these restrictions; Office workflow rules retain API-005’s exist. | Direct HTTP calls enforce these restrictions | none | none |
| PLAN-008 | 5.2 — Direct HTTP calls enforce these restrictions; Office workflow rules retain API-005’s exist. | Office workflow rules retain API-005’s existing prohibition on automatic booking. | none | none |
| PLAN-009 | 1.1 — A decline is the customer's own explicit answer, recorded by a person as GLOVE-04 record. | A decline is the customer's own explicit answer | none | none |
| PLAN-009 | 1.2 — A decline is the customer's own explicit answer, recorded by a person as GLOVE-04 record. | recorded by a person as GLOVE-04 records a quote's answer: the desk (owner | none | none |
| PLAN-009 | 1.3 — A decline is the customer's own explicit answer, recorded by a person as GLOVE-04 record. | dispatcher | none | none |
| PLAN-009 | 1.4 — A decline is the customer's own explicit answer, recorded by a person as GLOVE-04 record. | office) records it for one included visit of an agreement (agreement decline action: agreement version | none | none |
| PLAN-009 | 1.5 — A decline is the customer's own explicit answer, recorded by a person as GLOVE-04 record. | zero-based ordinal | none | none |
| PLAN-009 | 1.6 — A decline is the customer's own explicit answer, recorded by a person as GLOVE-04 record. | who declined | none | none |
| PLAN-009 | 1.7 — A decline is the customer's own explicit answer, recorded by a person as GLOVE-04 record. | how — phone | none | none |
| PLAN-009 | 1.8 — A decline is the customer's own explicit answer, recorded by a person as GLOVE-04 record. | email reply | none | none |
| PLAN-009 | 1.9 — A decline is the customer's own explicit answer, recorded by a person as GLOVE-04 record. | text reply or in person — | none | none |
| PLAN-009 | 1.10 — A decline is the customer's own explicit answer, recorded by a person as GLOVE-04 record. | their reason). | none | none |
| PLAN-009 | 2.1 — Glove never infers a decline from silence, a cancelled booking, term expiry or agreement e. | Glove never infers a decline from silence | none | none |
| PLAN-009 | 2.2 — Glove never infers a decline from silence, a cancelled booking, term expiry or agreement e. | a cancelled booking | none | none |
| PLAN-009 | 2.3 — Glove never infers a decline from silence, a cancelled booking, term expiry or agreement e. | term expiry or agreement end action. | none | none |
| PLAN-009 | 3.1 — It is refused for a completed or already declined visit, and while that visit has a live b. | It is refused for a completed or already declined visit | none | none |
| PLAN-009 | 3.2 — It is refused for a completed or already declined visit, and while that visit has a live b. | while that visit has a live booking (cancel the booking first | none | none |
| PLAN-009 | 3.3 — It is refused for a completed or already declined visit, and while that visit has a live b. | under GLOVE-07). | none | none |
| PLAN-009 | 4.1 — The decline keeps the visit's due date, the recorder's name and role and the time, is appe. | The decline keeps the visit's due date | none | none |
| PLAN-009 | 4.2 — The decline keeps the visit's due date, the recorder's name and role and the time, is appe. | the recorder's name and role | none | none |
| PLAN-009 | 4.3 — The decline keeps the visit's due date, the recorder's name and role and the time, is appe. | the time | none | none |
| PLAN-009 | 4.4 — The decline keeps the visit's due date, the recorder's name and role and the time, is appe. | is appended to the agreement (never edited) | none | none |
| PLAN-009 | 4.5 — The decline keeps the visit's due date, the recorder's name and role and the time, is appe. | is named on the Activity timeline (agreement visit declined action) and travels in the export. | none | none |
| PLAN-009 | 5.1 — A declined visit leaves the due list, the REPORT-001 agreements-due tile and the AGENT-. | A declined visit leaves the due list | none | none |
| PLAN-009 | 5.2 — A declined visit leaves the due list, the REPORT-001 agreements-due tile and the AGENT-. | the REPORT-001 agreements-due tile | none | none |
| PLAN-009 | 5.3 — A declined visit leaves the due list, the REPORT-001 agreements-due tile and the AGENT-. | the AGENT-008, AGENT-016 brief | none | none |
| PLAN-009 | 5.4 — A declined visit leaves the due list, the REPORT-001 agreements-due tile and the AGENT-. | it is no longer "left" under PLAN-002 | none | none |
| PLAN-009 | 5.5 — A declined visit leaves the due list, the REPORT-001 agreements-due tile and the AGENT-. | no included job can be made for it. | none | none |
| PLAN-009 | 6.1 — The decline joins the site's property history (CUST-001) as an agreement decline row. | The decline joins the site's property history (CUST-001) as an agreement decline row. | none | none |
| PLAN-010 | 1.1 — The desk offers 1 to 10 future, currently conflict-free slots for one outstanding included. | The desk offers 1 to 10 future | none | none |
| PLAN-010 | 1.2 — The desk offers 1 to 10 future, currently conflict-free slots for one outstanding included. | currently conflict-free slots for one outstanding included visit (agreement offer action) | none | none |
| PLAN-010 | 1.3 — The desk offers 1 to 10 future, currently conflict-free slots for one outstanding included. | retaining or creating its included job. | none | none |
| PLAN-010 | 2.1 — The revocable bearer link is shown once, stores only its hash separately from portable dom. | The revocable bearer link is shown once | none | none |
| PLAN-010 | 2.2 — The revocable bearer link is shown once, stores only its hash separately from portable dom. | stores only its hash separately from portable domain records | none | none |
| PLAN-010 | 2.3 — The revocable bearer link is shown once, stores only its hash separately from portable dom. | expires exactly 14 days after creation | none | none |
| PLAN-010 | 2.4 — The revocable bearer link is shown once, stores only its hash separately from portable dom. | is revoked atomically when used or by staff (agreement offer revoke action). | none | none |
| PLAN-010 | 3.1 — Like FIELD-003, restoring an archive retains offer metadata but requires a new link; old b. | Like FIELD-003 | none | none |
| PLAN-010 | 3.2 — Like FIELD-003, restoring an archive retains offer metadata but requires a new link; old b. | restoring an archive retains offer metadata but requires a new link | none | none |
| PLAN-010 | 3.3 — Like FIELD-003, restoring an archive retains offer metadata but requires a new link; old b. | old bearers are not restored. | none | none |
| PLAN-010 | 4.1 — The customer page offers only that included visit's service, site and slots, with each slo. | The customer page offers only that included visit's service | none | none |
| PLAN-010 | 4.2 — The customer page offers only that included visit's service, site and slots, with each slo. | site and slots | none | none |
| PLAN-010 | 4.3 — The customer page offers only that included visit's service, site and slots, with each slo. | with each slot's booking time zone | none | none |
| PLAN-010 | 4.4 — The customer page offers only that included visit's service, site and slots, with each slo. | it grants no account access. | none | none |
| PLAN-010 | 5.1 — The customer chooses one offered slot, under the offering person's current active role and. | The customer chooses one offered slot | none | none |
| PLAN-010 | 5.2 — The customer chooses one offered slot, under the offering person's current active role and. | under the offering person's current active role and branch authority. | none | none |
| PLAN-010 | 6.1 — Every choice repeats GLOVE-05 eligibility and overlap checks; the public choice never ac. | Every choice repeats GLOVE-05 eligibility and overlap checks | none | none |
| PLAN-010 | 6.2 — Every choice repeats GLOVE-05 eligibility and overlap checks; the public choice never ac. | the public choice never acknowledges new conflicts. | none | none |
| PLAN-010 | 7.1 — A slot taken meanwhile is refused, showing only remaining open offers without other custom. | A slot taken meanwhile is refused | none | none |
| PLAN-010 | 7.2 — A slot taken meanwhile is refused, showing only remaining open offers without other custom. | showing only remaining open offers without other customers' conflict details. | none | none |
| PLAN-010 | 8.1 — No open offers means contact the office; the visit stays due. | No open offers means contact the office | none | none |
| PLAN-010 | 8.2 — No open offers means contact the office; the visit stays due. | the visit stays due. | none | none |
| PLAN-011 | 1.1 — Created, used, revoked and staff-recorded outside-send events name the person and time in. | Created | none | none |
| PLAN-011 | 1.2 — Created, used, revoked and staff-recorded outside-send events name the person and time in. | used | none | none |
| PLAN-011 | 1.3 — Created, used, revoked and staff-recorded outside-send events name the person and time in. | revoked and staff-recorded outside-send events name the person and time in Activity | none | none |
| PLAN-011 | 1.4 — Created, used, revoked and staff-recorded outside-send events name the person and time in. | the business export | none | none |
| PLAN-011 | 1.5 — Created, used, revoked and staff-recorded outside-send events name the person and time in. | without the bearer. | none | none |
| PLAN-011 | 2.1 — Agreement offer action with email: true emails the link through COMM-001, COMM-010, COMM-. | Agreement offer action with email: true emails the link through COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 to the customer's own email address on record (the link is still shown once in the response) | none | none |
| PLAN-011 | 2.2 — Agreement offer action with email: true emails the link through COMM-001, COMM-010, COMM-. | the offer shows its provider-reported delivery state | none | none |
| PLAN-011 | 2.3 — Agreement offer action with email: true emails the link through COMM-001, COMM-010, COMM-. | agreement offer sent action still records a send staff made outside Glove | none | none |
| PLAN-011 | 2.4 — Agreement offer action with email: true emails the link through COMM-001, COMM-010, COMM-. | labelled with the method and recorder and “delivery not verified” | none | none |
| PLAN-011 | 2.5 — Agreement offer action with email: true emails the link through COMM-001, COMM-010, COMM-. | with no delivery claimed. | none | none |
| PLAN-011 | 3.1 — The offer, its outside-send record and its use or revocation are booking link rows in the. | The offer | none | none |
| PLAN-011 | 3.2 — The offer, its outside-send record and its use or revocation are booking link rows in the. | its outside-send record | none | none |
| PLAN-011 | 3.3 — The offer, its outside-send record and its use or revocation are booking link rows in the. | its use or revocation are booking link rows in the site's property history (CUST-001) | none | none |
| PLAN-011 | 3.4 — The offer, its outside-send record and its use or revocation are booking link rows in the. | an emailed link also appears there as a message row with its provider-reported state (COMM-007). | none | none |
| PLAN-005 | 1.1 — A fixture runs two series for three months: a per-visit series with one visit in month 1. | A fixture runs two series for three months: a per-visit series with one visit in month 1 | none | none |
| PLAN-005 | 1.2 — A fixture runs two series for three months: a per-visit series with one visit in month 1. | two in month 2 (a third skipped) and none in month 3 | none | none |
| PLAN-005 | 1.3 — A fixture runs two series for three months: a per-visit series with one visit in month 1. | a quarterly commercial PM job billed $240.00 fixed monthly | none | none |
| PLAN-005 | 1.4 — A fixture runs two series for three months: a per-visit series with one visit in month 1. | it checks exactly three per-visit invoices with each visit's lines | none | none |
| PLAN-005 | 1.5 — A fixture runs two series for three months: a per-visit series with one visit in month 1. | exactly three $240.00 invoices dated the last day of each month | none | none |
| PLAN-005 | 1.6 — A fixture runs two series for three months: a per-visit series with one visit in month 1. | an on-close series invoices once when the job closes. | none | none |
| PLAN-005 | 2.1 — The signed-in owner sets a billing rule with a series at creation/change or series billing. | The signed-in owner sets a billing rule with a series at creation/change or series billing action. | none | none |
| PLAN-005 | 3.1 — Its numbered revisions apply from a current/future local date and retain earlier billing. | Its numbered revisions apply from a current/future local date | none | none |
| PLAN-005 | 3.2 — Its numbered revisions apply from a current/future local date and retain earlier billing. | retain earlier billing. | none | none |
| PLAN-005 | 4.1 — Modes are per-visit, fixed-monthly, fixed-after-visit, on-close and as-needed (one month-e. | Modes are per-visit | none | none |
| PLAN-005 | 4.2 — Modes are per-visit, fixed-monthly, fixed-after-visit, on-close and as-needed (one month-e. | fixed-monthly | none | none |
| PLAN-005 | 4.3 — Modes are per-visit, fixed-monthly, fixed-after-visit, on-close and as-needed (one month-e. | fixed-after-visit | none | none |
| PLAN-005 | 4.4 — Modes are per-visit, fixed-monthly, fixed-after-visit, on-close and as-needed (one month-e. | on-close and as-needed (one month-end office reminder | none | none |
| PLAN-005 | 4.5 — Modes are per-visit, fixed-monthly, fixed-after-visit, on-close and as-needed (one month-e. | no invoice). | none | none |
| PLAN-005 | 5.1 — Fixed rules keep their explicit priced lines; per-visit drafts carry only that visit's wor. | Fixed rules keep their explicit priced lines | none | none |
| PLAN-005 | 5.2 — Fixed rules keep their explicit priced lines; per-visit drafts carry only that visit's wor. | per-visit drafts carry only that visit's work/materials and unbilled visit expenses. | none | none |
| PLAN-005 | 6.1 — Skipped/canceled visits do not bill; paused periods do not bill; monthly fixed billing doe. | Skipped/canceled visits do not bill | none | none |
| PLAN-005 | 6.2 — Skipped/canceled visits do not bill; paused periods do not bill; monthly fixed billing doe. | paused periods do not bill | none | none |
| PLAN-005 | 6.3 — Skipped/canceled visits do not bill; paused periods do not bill; monthly fixed billing doe. | monthly fixed billing does not depend on whether visits ran. | none | none |
| PLAN-005 | 7.1 — Stable job/visit/month/close identities commit with the invoice or reminder, so replay, co. | Stable job/visit/month/close identities commit with the invoice or reminder | none | none |
| PLAN-005 | 7.2 — Stable job/visit/month/close identities commit with the invoice or reminder, so replay, co. | so replay | none | none |
| PLAN-005 | 7.3 — Stable job/visit/month/close identities commit with the invoice or reminder, so replay, co. | concurrent commands and cron runs cannot duplicate them. | none | none |
| PLAN-005 | 8.1 — A capture already claimed by one invoice is not billed again after a forward rule change. | A capture already claimed by one invoice is not billed again after a forward rule change. | none | none |
| PLAN-012 | 1.1 — The Worker cron and ordinary mutations generate due drafts; opening state is read-only. | The Worker cron and ordinary mutations generate due drafts | none | none |
| PLAN-012 | 1.2 — The Worker cron and ordinary mutations generate due drafts; opening state is read-only. | opening state is read-only. | none | none |
| PLAN-012 | 2.1 — The office can run series billing run action and reads the documented product door for dat. | The office can run series billing run action | none | none |
| PLAN-012 | 2.2 — The office can run series billing run action and reads the documented product door for dat. | reads the documented product door for dates without an invoice/reminder | none | none |
| PLAN-012 | 2.3 — The office can run series billing run action and reads the documented product door for dat. | the concrete missing-price/PO problem. | none | none |
| PLAN-012 | 3.1 — Existing series retain their old job-wide workflow until the owner explicitly configures a. | Existing series retain their old job-wide workflow until the owner explicitly configures a rule. | none | none |
| PLAN-012 | 4.1 — The owner may explicitly authorize automatic approval only for a rule's fixed invoices. | The owner may explicitly authorize automatic approval only for a rule's fixed invoices. | none | none |
| PLAN-012 | 5.1 — The pass rechecks the configuring owner's current active Owner role and branch scope at co. | The pass rechecks the configuring owner's current active Owner role and branch scope at commit | none | none |
| PLAN-012 | 5.2 — The pass rechecks the configuring owner's current active Owner role and branch scope at co. | no other person's rule or a later edited draft borrows that grant. | none | none |
| PLAN-012 | 6.1 — Otherwise normal GLOVE-09 approval applies. | Otherwise normal GLOVE-09 approval applies. | none | none |
| PLAN-012 | 7.1 — Drafts say “Proposed — not approved, not sent” and count nowhere in aging, revenue, tax, e. | Drafts say “Proposed — not approved | none | none |
| PLAN-012 | 7.2 — Drafts say “Proposed — not approved, not sent” and count nowhere in aging, revenue, tax, e. | not sent” | none | none |
| PLAN-012 | 7.3 — Drafts say “Proposed — not approved, not sent” and count nowhere in aging, revenue, tax, e. | count nowhere in aging | none | none |
| PLAN-012 | 7.4 — Drafts say “Proposed — not approved, not sent” and count nowhere in aging, revenue, tax, e. | revenue | none | none |
| PLAN-012 | 7.5 — Drafts say “Proposed — not approved, not sent” and count nowhere in aging, revenue, tax, e. | tax | none | none |
| PLAN-012 | 7.6 — Drafts say “Proposed — not approved, not sent” and count nowhere in aging, revenue, tax, e. | exports or QuickBooks. | none | none |
| PLAN-013 | 1.1 — For newly generated fixed-monthly invoices only, approval on/after period end freezes issu. | For newly generated fixed-monthly invoices only | none | none |
| PLAN-013 | 1.2 — For newly generated fixed-monthly invoices only, approval on/after period end freezes issu. | approval on/after period end freezes issueDate at that period end | none | none |
| PLAN-013 | 1.3 — For newly generated fixed-monthly invoices only, approval on/after period end freezes issu. | records approvalAt | none | none |
| PLAN-013 | 1.4 — For newly generated fixed-monthly invoices only, approval on/after period end freezes issu. | approver separately | none | none |
| PLAN-013 | 1.5 — For newly generated fixed-monthly invoices only, approval on/after period end freezes issu. | freezes dueDate = max(periodEnd | none | none |
| PLAN-013 | 1.6 — For newly generated fixed-monthly invoices only, approval on/after period end freezes issu. | approvalLocalDate) + terms. | none | none |
| PLAN-013 | 2.1 — Late approvals are labelled; aging begins only after approval and ages from that frozen du. | Late approvals are labelled | none | none |
| PLAN-013 | 2.2 — Late approvals are labelled; aging begins only after approval and ages from that frozen du. | aging begins only after approval and ages from that frozen due date. | none | none |
| PLAN-013 | 3.1 — Revenue/tax/CSV/QuickBooks use the frozen issue date. | Revenue/tax/CSV/QuickBooks use the frozen issue date. | none | none |
| PLAN-013 | 4.1 — Terms changes, correction and later export do not move those dates; preexisting documents. | Terms changes | none | none |
| PLAN-013 | 4.2 — Terms changes, correction and later export do not move those dates; preexisting documents. | correction and later export do not move those dates | none | none |
| PLAN-013 | 4.3 — Terms changes, correction and later export do not move those dates; preexisting documents. | preexisting documents and outputs are unchanged. | none | none |
| PLAN-013 | 5.1 — No charge, receipt or dunning is added by this slice; PAY-008, PAY-027, PAY-028, PAY-029. | No charge | none | none |
| PLAN-013 | 5.2 — No charge, receipt or dunning is added by this slice; PAY-008, PAY-027, PAY-028, PAY-029. | receipt or dunning is added by this slice | none | none |
| PLAN-013 | 5.8 — No charge, receipt or dunning is added by this slice; PAY-008, PAY-027, PAY-028, PAY-029. | PLAN-003 and COMM-001 | none | none |
| PLAN-013 | 5.17 — No charge, receipt or dunning is added by this slice; PAY-008, PAY-027, PAY-028, PAY-029. | COMM-018 carry those remaining acceptance obligations before autopay ships. | none | none |
| STOCK-001 | 1.1 — A fixture sets van stock, records materials used on two visits, transfers from the warehou. | A fixture sets van stock | none | none |
| STOCK-001 | 1.2 — A fixture sets van stock, records materials used on two visits, transfers from the warehou. | records materials used on two visits | none | none |
| STOCK-001 | 1.3 — A fixture sets van stock, records materials used on two visits, transfers from the warehou. | transfers from the warehouse | none | none |
| STOCK-001 | 1.4 — A fixture sets van stock, records materials used on two visits, transfers from the warehou. | checks counts | `tests/api/stock.test.mjs:43` | asserted |
| STOCK-001 | 1.5 — A fixture sets van stock, records materials used on two visits, transfers from the warehou. | a low-stock flag | none | none |
| STOCK-001 | 1.6 — A fixture sets van stock, records materials used on two visits, transfers from the warehou. | the parts-on-board check for tomorrow's jobs. | `tests/api/stock.test.mjs:53` | asserted |
| STOCK-001 | 2.1 — The owner and office keep stock locations (a van per technician, and warehouses) holding p. | The owner and office keep stock locations (a van per technician | none | none |
| STOCK-001 | 2.2 — The owner and office keep stock locations (a van per technician, and warehouses) holding p. | warehouses) holding price-book materials only | none | none |
| STOCK-001 | 2.3 — The owner and office keep stock locations (a van per technician, and warehouses) holding p. | counted in the material's unit to a thousandth | none | none |
| STOCK-001 | 2.4 — The owner and office keep stock locations (a van per technician, and warehouses) holding p. | par levels are set per location and material. | none | none |
| STOCK-001 | 3.1 — A stocktake sets a count, a restock adds, a transfer moves between two locations and is re. | A stocktake sets a count | none | none |
| STOCK-001 | 3.2 — A stocktake sets a count, a restock adds, a transfer moves between two locations and is re. | a restock adds | none | none |
| STOCK-001 | 3.3 — A stocktake sets a count, a restock adds, a transfer moves between two locations and is re. | a transfer moves between two locations and is refused when the source holds less | none | none |
| STOCK-001 | 3.4 — A stocktake sets a count, a restock adds, a transfer moves between two locations and is re. | a material from the price book that a technician records on a visit (GLOVE-06 | none | none |
| STOCK-001 | 3.5 — A stocktake sets a count, a restock adds, a transfer moves between two locations and is re. | so also offline) comes off that technician's van | none | none |
| STOCK-001 | 3.6 — A stocktake sets a count, a restock adds, a transfer moves between two locations and is re. | a count may go below zero | none | none |
| STOCK-001 | 3.7 — A stocktake sets a count, a restock adds, a transfer moves between two locations and is re. | shown as such. | none | none |
| STOCK-001 | 4.1 — Every movement is a stock-move record with who, when, the change and the count after, and. | Every movement is a stock-move record with who | `tests/api/stock.test.mjs:45` | asserted |
| STOCK-001 | 4.2 — Every movement is a stock-move record with who, when, the change and the count after, and. | when | none | none |
| STOCK-001 | 4.3 — Every movement is a stock-move record with who, when, the change and the count after, and. | the change | none | none |
| STOCK-001 | 4.4 — Every movement is a stock-move record with who, when, the change and the count after, and. | the count after | none | none |
| STOCK-001 | 4.5 — Every movement is a stock-move record with who, when, the change and the count after, and. | a timeline entry. | none | none |
| STOCK-001 | 5.1 — An item is low when its count is at or below its par. | An item is low when its count is at or below its par. | `tests/api/stock.test.mjs:59` | asserted |
| STOCK-001 | 6.1 — The parts a job needs are its lines' materials, and a task line's material contents, at th. | The parts a job needs are its lines' materials | none | none |
| STOCK-001 | 6.2 — The parts a job needs are its lines' materials, and a task line's material contents, at th. | a task line's material contents | none | none |
| STOCK-001 | 6.3 — The parts a job needs are its lines' materials, and a task line's material contents, at th. | at their quantity times the line's quantity | none | none |
| STOCK-001 | 6.4 — The parts a job needs are its lines' materials, and a task line's material contents, at th. | the day's parts check walks one technician's visits on a local date in start order | none | none |
| STOCK-001 | 6.5 — The parts a job needs are its lines' materials, and a task line's material contents, at th. | a part is on board for a job when the van holds enough for that job | `tests/api/stock.test.mjs:53` | asserted |
| STOCK-001 | 6.6 — The parts a job needs are its lines' materials, and a task line's material contents, at th. | every earlier job that day. | none | none |
| STOCK-001 | 7.1 — A technician reads only their own van and their own day. | A technician reads only their own van | `tests/api/stock.test.mjs:69` | asserted |
| STOCK-001 | 7.2 — A technician reads only their own van and their own day. | their own day. | `tests/api/stock.test.mjs:67` | asserted |
| STOCK-002 | 1.1 — A fixture raises a PO for a job, receives it in two parts, and checks stock and job cost. | A fixture raises a PO for a job | none | none |
| STOCK-002 | 1.2 — A fixture raises a PO for a job, receives it in two parts, and checks stock and job cost. | receives it in two parts | `tests/api/purchasing.test.mjs:41` | asserted |
| STOCK-002 | 1.3 — A fixture raises a PO for a job, receives it in two parts, and checks stock and job cost. | checks stock and job cost. | `tests/api/purchasing.test.mjs:54` | asserted |
| STOCK-002 | 2.1 — The owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (wit. | The owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (with an optional email) of 1 to 50 price-book materials | `tests/api/purchasing.test.mjs:25` | asserted |
| STOCK-002 | 2.2 — The owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (wit. | each at a quantity to a thousandth of its unit | none | none |
| STOCK-002 | 2.3 — The owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (wit. | the supplier's unit cost (the item's price-book cost unless given) | `tests/api/purchasing.test.mjs:25` | asserted |
| STOCK-002 | 2.4 — The owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (wit. | delivered to one van or warehouse (STOCK-001) | none | none |
| STOCK-002 | 2.5 — The owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (wit. | for stock or for one job | none | none |
| STOCK-002 | 2.6 — The owner and office raise a purchase order (numbered PO-0001 on) to a named supplier (wit. | it changes only while a draft. | none | none |
| STOCK-002 | 3.1 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | A draft order goes to the supplier in one of two ways | none | none |
| STOCK-002 | 3.2 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | the record and timeline say which: the owner or office emails it from Glove to the order's supplier address | none | none |
| STOCK-002 | 3.3 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | or another address the person names | none | none |
| STOCK-002 | 3.4 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | through the owner's connected email (COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 email send action with kind purchaseOrder | none | none |
| STOCK-002 | 3.5 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | the order then reads sent | none | none |
| STOCK-002 | 3.6 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | naming the email | none | none |
| STOCK-002 | 3.7 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | with the provider's reported outcome | none | none |
| STOCK-002 | 3.8 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | where delivered means only that the supplier's mail server accepted it) | none | none |
| STOCK-002 | 3.9 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | or the person sends it outside Glove by email | none | none |
| STOCK-002 | 3.10 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | the supplier's portal | none | none |
| STOCK-002 | 3.11 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | phone or in person | none | none |
| STOCK-002 | 3.12 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | records that method with the supplier's reference | `tests/api/purchasing.test.mjs:30` | asserted |
| STOCK-002 | 3.13 — A draft order goes to the supplier in one of two ways, and the record and timeline say whi. | which is recorded as sent with no delivery claim. | none | none |
| STOCK-002 | 4.1 — Glove has no supplier-portal connection. | Glove has no supplier-portal connection. | none | none |
| STOCK-002 | 5.1 — Only a sent order is received, in one or more parts, each line at most what is still due. | Only a sent order is received | none | none |
| STOCK-002 | 5.2 — Only a sent order is received, in one or more parts, each line at most what is still due. | in one or more parts | none | none |
| STOCK-002 | 5.3 — Only a sent order is received, in one or more parts, each line at most what is still due. | each line at most what is still due | none | none |
| STOCK-002 | 5.4 — Only a sent order is received, in one or more parts, each line at most what is still due. | each part adds to the delivery location's stock as a stock move naming the order (and its job) | none | none |
| STOCK-002 | 5.5 — Only a sent order is received, in one or more parts, each line at most what is still due. | the order reads partly received until every line arrives. | `tests/api/purchasing.test.mjs:38` | asserted |
| STOCK-002 | 6.1 — A job's received lines count to its actual cost (COST-004) at the order's unit cost; a p. | A job's received lines count to its actual cost (COST-004) at the order's unit cost | none | none |
| STOCK-002 | 6.2 — A job's received lines count to its actual cost (COST-004) at the order's unit cost; a p. | a price-book material recorded on that job counts at its price-book cost only beyond the quantity the job's orders received of it | none | none |
| STOCK-002 | 6.3 — A job's received lines count to its actual cost (COST-004) at the order's unit cost; a p. | so nothing is costed twice. | `tests/api/purchasing.test.mjs:60` | asserted |
| STOCK-002 | 7.1 — A job order shows on the property history (CUST-001). | A job order shows on the property history (CUST-001). | `tests/api/purchasing.test.mjs:64` | asserted |
| STOCK-002 | 8.1 — Unit costs are margin figures (MONEY-003, MONEY-006): purchase orders are read only by r. | Unit costs are margin figures (MONEY-003, MONEY-006): purchase orders are read only by roles that read reports | none | none |
| STOCK-002 | 8.2 — Unit costs are margin figures (MONEY-003, MONEY-006): purchase orders are read only by r. | never by technicians. | `tests/api/purchasing.test.mjs:65` | asserted |
| TEAM-001 | 1.1 — A custom customer-service role is refused each command outside its named permissions throu. | A custom customer-service role is refused each command outside its named permissions through every product door. | none | none |
| TEAM-002 | 1.1 — A fixture sets two branches in different time zones, books in each, and checks a branch-li. | A fixture sets two branches in different time zones | none | none |
| TEAM-002 | 1.2 — A fixture sets two branches in different time zones, books in each, and checks a branch-li. | books in each | none | none |
| TEAM-002 | 1.3 — A fixture sets two branches in different time zones, books in each, and checks a branch-li. | checks a branch-limited dispatcher sees only theirs | none | none |
| TEAM-002 | 1.4 — A fixture sets two branches in different time zones, books in each, and checks a branch-li. | and the REPORT-002, REPORT-004 revenue report by branch | none | none |
| TEAM-002 | 1.5 — A fixture sets two branches in different time zones, books in each, and checks a branch-li. | filtered to one branch | none | none |
| TEAM-002 | 1.6 — A fixture sets two branches in different time zones, books in each, and checks a branch-li. | narrows to that branch's invoices. | none | none |
| TEAM-002 | 2.1 — The owner creates branches with an IANA booking zone, a unique alphanumeric number prefix. | The owner creates branches with an IANA booking zone | none | none |
| TEAM-002 | 2.2 — The owner creates branches with an IANA booking zone, a unique alphanumeric number prefix. | a unique alphanumeric number prefix and service ZIP codes. | none | none |
| TEAM-002 | 3.1 — New sites choose their branch and keep it; the first site assigns its customer to that bra. | New sites choose their branch and keep it | none | none |
| TEAM-002 | 3.2 — New sites choose their branch and keep it; the first site assigns its customer to that bra. | the first site assigns its customer to that branch | none | none |
| TEAM-002 | 3.3 — New sites choose their branch and keep it; the first site assigns its customer to that bra. | all of that customer’s sites stay in it. | none | none |
| TEAM-002 | 4.1 — Technicians belong to a branch; crews never mix branches. | Technicians belong to a branch | none | none |
| TEAM-002 | 4.2 — Technicians belong to a branch; crews never mix branches. | crews never mix branches. | none | none |
| TEAM-002 | 5.1 — Quotes, service calls, assessments and their jobs and invoices inherit the site’s branch. | Quotes | none | none |
| TEAM-002 | 5.2 — Quotes, service calls, assessments and their jobs and invoices inherit the site’s branch. | service calls | none | none |
| TEAM-002 | 5.3 — Quotes, service calls, assessments and their jobs and invoices inherit the site’s branch. | assessments | none | none |
| TEAM-002 | 5.4 — Quotes, service calls, assessments and their jobs and invoices inherit the site’s branch. | their jobs and invoices inherit the site’s branch | none | none |
| TEAM-002 | 5.5 — Quotes, service calls, assessments and their jobs and invoices inherit the site’s branch. | with independent per-kind counters (for example RAL-J-1001 and RAL-INV-0001). | none | none |
| TEAM-002 | 6.1 — The prefix is fixed after the first number. | The prefix is fixed after the first number. | none | none |
| TEAM-002 | 7.1 — Legacy sites, technicians and documents remain in the main business branch with their orig. | Legacy sites | none | none |
| TEAM-002 | 7.2 — Legacy sites, technicians and documents remain in the main business branch with their orig. | technicians and documents remain in the main business branch with their original numbers and business zone. | none | none |
| TEAM-002 | 8.1 — A visit records its booking zone and exact instants; later branch-zone edits affect new bo. | A visit records its booking zone and exact instants | none | none |
| TEAM-002 | 8.2 — A visit records its booking zone and exact instants; later branch-zone edits affect new bo. | later branch-zone edits affect new bookings and moves | none | none |
| TEAM-002 | 8.3 — A visit records its booking zone and exact instants; later branch-zone edits affect new bo. | never rewrite existing visits. | none | none |
| TEAM-004 | 1.1 — A technician must belong to the job’s branch; the existing area warning/refusal rule also. | A technician must belong to the job’s branch | none | none |
| TEAM-004 | 1.2 — A technician must belong to the job’s branch; the existing area warning/refusal rule also. | the existing area warning/refusal rule also applies to its branch ZIP codes. | none | none |
| TEAM-004 | 2.1 — The Dispatch branch choice shows its own technicians, work and local zone. | The Dispatch branch choice shows its own technicians | none | none |
| TEAM-004 | 2.2 — The Dispatch branch choice shows its own technicians, work and local zone. | work and local zone. | none | none |
| TEAM-004 | 3.1 — Actual per-branch US tax settings and the REPORT-002, REPORT-004 tax-jurisdiction rows shi. | Actual per-branch US tax settings | none | none |
| TEAM-004 | 3.2 — Actual per-branch US tax settings and the REPORT-002, REPORT-004 tax-jurisdiction rows shi. | the REPORT-002 | none | none |
| TEAM-004 | 3.3 — Actual per-branch US tax settings and the REPORT-002, REPORT-004 tax-jurisdiction rows shi. | REPORT-004 tax-jurisdiction rows ship with MONEY-001 | none | none |
| TEAM-004 | 3.6 — Actual per-branch US tax settings and the REPORT-002, REPORT-004 tax-jurisdiction rows shi. | which carries them in its text and acceptance. | none | none |
| TEAM-004 | 4.1 — Revenue reports include branch rows and a branch filter in JSON and CSV, dating each invoi. | Revenue reports include branch rows | none | none |
| TEAM-004 | 4.2 — Revenue reports include branch rows and a branch filter in JSON and CSV, dating each invoi. | a branch filter in JSON and CSV | none | none |
| TEAM-004 | 4.3 — Revenue reports include branch rows and a branch filter in JSON and CSV, dating each invoi. | dating each invoice by its branch’s local first-approval date (both period ends included). | none | none |
| TEAM-004 | 5.1 — Customers cannot merge across branches. | Customers cannot merge across branches. | none | none |
| TEAM-004 | 6.1 — Every existing report accepts the branch filter in JSON and CSV; future record kinds, read. | Every existing report accepts the branch filter in JSON and CSV | none | none |
| TEAM-004 | 6.2 — Every existing report accepts the branch filter in JSON and CSV; future record kinds, read. | future record kinds | none | none |
| TEAM-004 | 6.3 — Every existing report accepts the branch filter in JSON and CSV; future record kinds, read. | read doors and reports inherit the same scope before shipping (API-002 | none | none |
| TEAM-004 | 6.5 — Every existing report accepts the branch filter in JSON and CSV; future record kinds, read. | API-007/003 | none | none |
| TEAM-004 | 6.15 — Every existing report accepts the branch filter in JSON and CSV; future record kinds, read. | COMM-018..009 | none | none |
| TEAM-004 | 6.23 — Every existing report accepts the branch filter in JSON and CSV; future record kinds, read. | PAY-016..009 | none | none |
| TEAM-004 | 6.27 — Every existing report accepts the branch filter in JSON and CSV; future record kinds, read. | LEDGER-007..004 | none | none |
| TEAM-004 | 6.28 — Every existing report accepts the branch filter in JSON and CSV; future record kinds, read. | PLAN-002..005 | none | none |
| TEAM-004 | 6.30 — Every existing report accepts the branch filter in JSON and CSV; future record kinds, read. | MOVE-007..006). | none | none |
| TEAM-005 | 1.1 — The owner limits a person to a named branch or the main business branch, or removes that l. | The owner limits a person to a named branch or the main business branch | none | none |
| TEAM-005 | 1.2 — The owner limits a person to a named branch or the main business branch, or removes that l. | or removes that limit. | none | none |
| TEAM-005 | 2.1 — The installation owner retains all-branch access. | The installation owner retains all-branch access. | none | none |
| TEAM-005 | 3.1 — Limits apply to every current read and command door, including files, Activity, history, r. | Limits apply to every current read and command door | none | none |
| TEAM-005 | 3.2 — Limits apply to every current read and command door, including files, Activity, history, r. | including files | none | none |
| TEAM-005 | 3.3 — Limits apply to every current read and command door, including files, Activity, history, r. | Activity | none | none |
| TEAM-005 | 3.4 — Limits apply to every current read and command door, including files, Activity, history, r. | history | none | none |
| TEAM-005 | 3.5 — Limits apply to every current read and command door, including files, Activity, history, r. | reports | none | none |
| TEAM-005 | 3.6 — Limits apply to every current read and command door, including files, Activity, history, r. | business/CSV exports | none | none |
| TEAM-005 | 3.7 — Limits apply to every current read and command door, including files, Activity, history, r. | saved command outcomes and workflow actions under their creator’s live scope | none | none |
| TEAM-005 | 3.8 — Limits apply to every current read and command door, including files, Activity, history, r. | a changed limit is rechecked in the commit guard. | none | none |
| TEAM-005 | 4.1 — Scoped people read and change only operational records rooted in their branch; shared busi. | Scoped people read | none | none |
| TEAM-005 | 4.2 — Scoped people read and change only operational records rooted in their branch; shared busi. | change only operational records rooted in their branch | none | none |
| TEAM-005 | 4.3 — Scoped people read and change only operational records rooted in their branch; shared busi. | shared business reference data remains readable under their existing role and is read-only for them. | none | none |
| TEAM-005 | 5.1 — New operational records created by a scoped person belong to their branch. | New operational records created by a scoped person belong to their branch. | none | none |
| TEAM-003 | 1.1 — A fixture applies a 5% sold-revenue rule and a $25 agreement spiff over a period and check. | A fixture applies a 5% sold-revenue rule | none | none |
| TEAM-003 | 1.2 — A fixture applies a 5% sold-revenue rule and a $25 agreement spiff over a period and check. | a $25 agreement spiff over a period | none | none |
| TEAM-003 | 1.3 — A fixture applies a 5% sold-revenue rule and a $25 agreement spiff over a period and check. | checks the totals in the payroll export. | none | none |
| TEAM-003 | 2.1 — The owner alone (acting for "admin") sets commission rules in payroll settings: a percent. | The owner alone (acting for "admin") sets commission rules in payroll settings: a percent of sold revenue | none | none |
| TEAM-003 | 2.2 — The owner alone (acting for "admin") sets commission rules in payroll settings: a percent. | a percent of completed revenue | none | none |
| TEAM-003 | 2.3 — The owner alone (acting for "admin") sets commission rules in payroll settings: a percent. | a fixed spiff per agreement sold | none | none |
| TEAM-003 | 2.4 — The owner alone (acting for "admin") sets commission rules in payroll settings: a percent. | each optional (percents from 0 to 99.99 with up to two decimals | none | none |
| TEAM-003 | 2.5 — The owner alone (acting for "admin") sets commission rules in payroll settings: a percent. | the spiff in USD). | none | none |
| TEAM-003 | 3.1 — Each save is a rule version applying from a local date (today unless the owner gives one). | Each save is a rule version applying from a local date (today unless the owner gives one) | none | none |
| TEAM-003 | 3.2 — Each save is a rule version applying from a local date (today unless the owner gives one). | replacing any version from that same date | none | none |
| TEAM-003 | 3.3 — Each save is a rule version applying from a local date (today unless the owner gives one). | a credited sale takes the version in force on its local date in the business time zone | none | none |
| TEAM-003 | 3.4 — Each save is a rule version applying from a local date (today unless the owner gives one). | so a later change never alters earlier earnings. | none | none |
| TEAM-003 | 4.1 — Rules apply to every technician. | Rules apply to every technician. | none | none |
| TEAM-003 | 5.1 — Sold revenue is an accepted quote's accepted total before tax (the chosen option and add-o. | Sold revenue is an accepted quote's accepted total before tax (the chosen option and add-ons after any QUOTE-007, QUOTE-019 discount) | none | none |
| TEAM-003 | 5.2 — Sold revenue is an accepted quote's accepted total before tax (the chosen option and add-o. | credited to the technician the desk names as its seller when recording the acceptance | none | none |
| TEAM-003 | 5.3 — Sold revenue is an accepted quote's accepted total before tax (the chosen option and add-o. | on the local date the acceptance was recorded | none | none |
| TEAM-003 | 5.4 — Sold revenue is an accepted quote's accepted total before tax (the chosen option and add-o. | a quote accepted with no seller credits nobody. | none | none |
| TEAM-003 | 6.1 — Completed revenue is REPORT-002, REPORT-004's technician revenue: an invoice's latest ap. | Completed revenue is REPORT-002, REPORT-004's technician revenue: an invoice's latest approved revision before tax | none | none |
| TEAM-003 | 6.2 — Completed revenue is REPORT-002, REPORT-004's technician revenue: an invoice's latest ap. | split equally among the technicians who completed the job's visits (the cent remainder to the first by name) | none | none |
| TEAM-003 | 6.3 — Completed revenue is REPORT-002, REPORT-004's technician revenue: an invoice's latest ap. | on the local date of its first approval. | none | none |
| TEAM-003 | 7.1 — A spiff is credited to the technician the desk names when selling a PLAN-002 agreement. | A spiff is credited to the technician the desk names when selling a PLAN-002 agreement | none | none |
| TEAM-003 | 7.2 — A spiff is credited to the technician the desk names when selling a PLAN-002 agreement. | on the local date it was sold. | none | none |
| TEAM-003 | 8.1 — Each credited sale's commission is its base × percent, rounded half up to the cent; totals. | Each credited sale's commission is its base × percent | none | none |
| TEAM-003 | 8.2 — Each credited sale's commission is its base × percent, rounded half up to the cent; totals. | rounded half up to the cent | none | none |
| TEAM-003 | 8.3 — Each credited sale's commission is its base × percent, rounded half up to the cent; totals. | totals are sums of those amounts. | none | none |
| TEAM-006 | 1.1 — Earnings are computed for the pay period when the payroll files are read, and the owner's. | Earnings are computed for the pay period when the payroll files are read | none | none |
| TEAM-006 | 1.2 — Earnings are computed for the pay period when the payroll files are read, and the owner's. | the owner's timesheet approval covers hours only. | none | none |
| TEAM-006 | 2.1 — They join COST-002, COST-006, COST-007's payroll files for the same people: Gusto's comm. | They join COST-002, COST-006, COST-007's payroll files for the same people: Gusto's commission column on each workweek's row (a workweek with commissions but no time gets its own row with zero hours) | none | none |
| TEAM-006 | 2.2 — They join COST-002, COST-006, COST-007's payroll files for the same people: Gusto's comm. | one ADP RUN row per person with the owner's commission earnings code (default COMM | none | none |
| TEAM-006 | 2.3 — They join COST-002, COST-006, COST-007's payroll files for the same people: Gusto's comm. | set to the code the owner's RUN earnings report shows) | none | none |
| TEAM-006 | 2.4 — They join COST-002, COST-006, COST-007's payroll files for the same people: Gusto's comm. | blank Pay Hours | none | none |
| TEAM-006 | 2.5 — They join COST-002, COST-006, COST-007's payroll files for the same people: Gusto's comm. | the total in Dollars | none | none |
| TEAM-006 | 2.6 — They join COST-002, COST-006, COST-007's payroll files for the same people: Gusto's comm. | one QuickBooks Payroll Commission line per person and local date with the amount in an Amount column. | none | none |
| TEAM-006 | 3.1 — A technician with commissions but no approved time in the period is left out of the files. | A technician with commissions but no approved time in the period is left out of the files with that reason | none | none |
| TEAM-006 | 3.2 — A technician with commissions but no approved time in the period is left out of the files. | a 1099 subcontractor is never in them. | none | none |
| TEAM-006 | 4.1 — The payroll JSON gives each person's sold, completed and agreement amounts and every credi. | The payroll JSON gives each person's sold | none | none |
| TEAM-006 | 4.2 — The payroll JSON gives each person's sold, completed and agreement amounts and every credi. | completed and agreement amounts | none | none |
| TEAM-006 | 4.3 — The payroll JSON gives each person's sold, completed and agreement amounts and every credi. | every credited sale. | none | none |
| TEAM-006 | 5.1 — Commission columns, like the hour columns, are not confirmed against a live Gusto, ADP RUN. | Commission columns | none | none |
| TEAM-006 | 5.2 — Commission columns, like the hour columns, are not confirmed against a live Gusto, ADP RUN. | like the hour columns | none | none |
| TEAM-006 | 5.3 — Commission columns, like the hour columns, are not confirmed against a live Gusto, ADP RUN. | are not confirmed against a live Gusto | none | none |
| TEAM-006 | 5.4 — Commission columns, like the hour columns, are not confirmed against a live Gusto, ADP RUN. | ADP RUN or QuickBooks account | none | none |
| TEAM-006 | 5.5 — Commission columns, like the hour columns, are not confirmed against a live Gusto, ADP RUN. | Glove pays no one. | none | none |
| REPORT-001 | 1.1 — A fixture with a fixture day checks every figure against the records it summarizes (today'. | A fixture with a fixture day checks every figure against the records it summarizes (today's tiles | none | none |
| REPORT-001 | 1.2 — A fixture with a fixture day checks every figure against the records it summarizes (today'. | each later tile is checked by its own clause's acceptance). | none | none |
| REPORT-001 | 2.3 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date | none | none |
| REPORT-001 | 2.4 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | separate approval time | none | none |
| REPORT-001 | 2.5 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | later-of-period/approval due-date basis | none | none |
| REPORT-001 | 2.6 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | approval-gated aging and frozen report/export dates | none | none |
| REPORT-001 | 2.7 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | preexisting documents keep their original basis. | none | none |
| REPORT-002 | 1.1 — A fixture builds a fixture month and checks each report's totals against the records and t. | A fixture builds a fixture month | none | none |
| REPORT-002 | 1.2 — A fixture builds a fixture month and checks each report's totals against the records and t. | checks each report's totals against the records | none | none |
| REPORT-002 | 1.3 — A fixture builds a fixture month and checks each report's totals against the records and t. | the CSV export | none | none |
| REPORT-002 | 1.4 — A fixture builds a fixture month and checks each report's totals against the records and t. | one filter per report (period | none | none |
| REPORT-002 | 1.5 — A fixture builds a fixture month and checks each report's totals against the records and t. | branch | none | none |
| REPORT-002 | 1.6 — A fixture builds a fixture month and checks each report's totals against the records and t. | technician | none | none |
| REPORT-002 | 1.7 — A fixture builds a fixture month and checks each report's totals against the records and t. | job type | none | none |
| REPORT-002 | 1.8 — A fixture builds a fixture month and checks each report's totals against the records and t. | source) narrows its totals correctly | none | none |
| REPORT-002 | 1.9 — A fixture builds a fixture month and checks each report's totals against the records and t. | the sales-tax-collected report matches the invoices' tax by jurisdiction to the cent. | none | none |
| REPORT-002 | 2.1 — Every report takes a period of local dates in the business time zone, both ends included. | Every report takes a period of local dates in the business time zone | none | none |
| REPORT-002 | 2.2 — Every report takes a period of local dates in the business time zone, both ends included. | both ends included | none | none |
| REPORT-002 | 2.3 — Every report takes a period of local dates in the business time zone, both ends included. | one filter | none | none |
| REPORT-002 | 2.4 — Every report takes a period of local dates in the business time zone, both ends included. | answers as JSON or as a CSV of the same figures | none | none |
| REPORT-002 | 2.5 — Every report takes a period of local dates in the business time zone, both ends included. | read by the roles that read reports. | none | none |
| REPORT-002 | 3.1 — Revenue is an invoice's latest person-approved revision subtotal before tax, counted once. | Revenue is an invoice's latest person-approved revision subtotal before tax | none | none |
| REPORT-002 | 3.2 — Revenue is an invoice's latest person-approved revision subtotal before tax, counted once. | counted once and dated by the invoice's first approval | none | none |
| REPORT-002 | 3.3 — Revenue is an invoice's latest person-approved revision subtotal before tax, counted once. | the revenue report gives it by month and by job type (the category of the job's first price-book line | none | none |
| REPORT-002 | 3.4 — Revenue is an invoice's latest person-approved revision subtotal before tax, counted once. | else Uncategorized | none | none |
| REPORT-002 | 3.5 — Revenue is an invoice's latest person-approved revision subtotal before tax, counted once. | as in COST-004) | none | none |
| REPORT-002 | 3.6 — Revenue is an invoice's latest person-approved revision subtotal before tax, counted once. | filtered by job type. | none | none |
| REPORT-002 | 4.1 — The technician report gives each technician's revenue (each such job's revenue split equal. | The technician report gives each technician's revenue (each such job's revenue split equally among the technicians who completed its visits | none | none |
| REPORT-002 | 4.2 — The technician report gives each technician's revenue (each such job's revenue split equal. | the cent remainder to the first by name) | none | none |
| REPORT-002 | 4.3 — The technician report gives each technician's revenue (each such job's revenue split equal. | visits completed in the period | none | none |
| REPORT-002 | 4.4 — The technician report gives each technician's revenue (each such job's revenue split equal. | callbacks (a completed visit followed within 30 days by a new job at the same site) | none | none |
| REPORT-002 | 4.5 — The technician report gives each technician's revenue (each such job's revenue split equal. | their rate | none | none |
| REPORT-002 | 4.6 — The technician report gives each technician's revenue (each such job's revenue split equal. | hours (their clocked shifts that began in the period | none | none |
| REPORT-002 | 4.7 — The technician report gives each technician's revenue (each such job's revenue split equal. | to a tenth of an hour) | none | none |
| REPORT-002 | 4.8 — The technician report gives each technician's revenue (each such job's revenue split equal. | filtered by technician. | none | none |
| REPORT-002 | 5.1 — Lead-source conversion counts the requests made in the period by source (BOOK-003's figu. | Lead-source conversion counts the requests made in the period by source (BOOK-003's figures) | none | none |
| REPORT-002 | 5.2 — Lead-source conversion counts the requests made in the period by source (BOOK-003's figu. | filtered by source | none | none |
| REPORT-002 | 5.3 — Lead-source conversion counts the requests made in the period by source (BOOK-003's figu. | the quote win rate is quotes accepted ÷ quotes answered (accepted or declined) in the period | none | none |
| REPORT-002 | 5.4 — Lead-source conversion counts the requests made in the period by source (BOOK-003's figu. | with the won value | none | none |
| REPORT-002 | 5.5 — Lead-source conversion counts the requests made in the period by source (BOOK-003's figu. | filtered by the request's source | none | none |
| REPORT-002 | 5.6 — Lead-source conversion counts the requests made in the period by source (BOOK-003's figu. | job margins are COST-004's period roll-up | none | none |
| REPORT-002 | 5.7 — Lead-source conversion counts the requests made in the period by source (BOOK-003's figu. | filtered by job type. | none | none |
| REPORT-002 | 6.1 — The sales-tax report sums the tax on approved invoices by month in one row per branch and. | The sales-tax report sums the tax on approved invoices by month in one row per branch and jurisdiction | none | none |
| REPORT-002 | 6.2 — The sales-tax report sums the tax on approved invoices by month in one row per branch and. | from each invoice's frozen MONEY-001, MONEY-004, MONEY-005 tax breakdown (an invoice approved before MONEY-001, MONEY-004, MONEY-005 | none | none |
| REPORT-002 | 6.3 — The sales-tax report sums the tax on approved invoices by month in one row per branch and. | which has no breakdown | none | none |
| REPORT-002 | 6.4 — The sales-tax report sums the tax on approved invoices by month in one row per branch and. | reports its tax under the business's former single jurisdiction) | none | none |
| REPORT-002 | 6.5 — The sales-tax report sums the tax on approved invoices by month in one row per branch and. | says its basis: tax on approved invoices | none | none |
| REPORT-002 | 6.6 — The sales-tax report sums the tax on approved invoices by month in one row per branch and. | because Glove records no payments yet. | none | none |
| REPORT-002 | 7.1 — Percentages are to one decimal, rounded half up. | Percentages are to one decimal | none | none |
| REPORT-002 | 7.2 — Percentages are to one decimal, rounded half up. | rounded half up. | none | none |
| REPORT-002 | 8.1 — The branch filter (TEAM-002, TEAM-004, TEAM-005) narrows every report to one branch's re. | The branch filter (TEAM-002, TEAM-004, TEAM-005) narrows every report to one branch's records | none | none |
| REPORT-002 | 8.2 — The branch filter (TEAM-002, TEAM-004, TEAM-005) narrows every report to one branch's re. | the revenue report also gives revenue by branch | none | none |
| REPORT-002 | 8.3 — The branch filter (TEAM-002, TEAM-004, TEAM-005) narrows every report to one branch's re. | the agreements report is PLAN-002's (agreements sold in the period by plan with their value | none | none |
| REPORT-002 | 8.4 — The branch filter (TEAM-002, TEAM-004, TEAM-005) narrows every report to one branch's re. | those active on the period's last day | none | none |
| REPORT-002 | 8.5 — The branch filter (TEAM-002, TEAM-004, TEAM-005) narrows every report to one branch's re. | churn). | none | none |
| REPORT-004 | 1.1 — Technician close rate from field quotes (QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018) and. | Technician close rate from field quotes (QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018) and tax collected from payments (PAY-002, PAY-017, PAY-018, PAY-019, PAY-020) come with those clauses | none | none |
| REPORT-004 | 1.2 — Technician close rate from field quotes (QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018) and. | which carry them in their text and acceptance. | none | none |
| REPORT-004 | 2.3 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date | none | none |
| REPORT-004 | 2.4 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | separate approval time | none | none |
| REPORT-004 | 2.5 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | later-of-period/approval due-date basis | none | none |
| REPORT-004 | 2.6 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | approval-gated aging and frozen report/export dates | none | none |
| REPORT-004 | 2.7 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | preexisting documents keep their original basis. | none | none |
| REPORT-003 | 1.1 — Invoices at every aging boundary fall into the exact customer and currency bucket, with a. | Invoices at every aging boundary fall into the exact customer and currency bucket | none | none |
| REPORT-003 | 1.2 — Invoices at every aging boundary fall into the exact customer and currency bucket, with a. | with a link to each open invoice. | none | none |
| REPORT-003 | 2.1 — Terms edits, export and approved corrections preserve frozen dates; an unapproved correcti. | Terms edits | none | none |
| REPORT-003 | 2.2 — Terms edits, export and approved corrections preserve frozen dates; an unapproved correcti. | export | none | none |
| REPORT-003 | 2.3 — Terms edits, export and approved corrections preserve frozen dates; an unapproved correcti. | approved corrections preserve frozen dates | none | none |
| REPORT-003 | 2.4 — Terms edits, export and approved corrections preserve frozen dates; an unapproved correcti. | an unapproved correction changes no balance. | none | none |
| REPORT-003 | 3.1 — The report’s JSON and CSV agree; invalid dates and forbidden branch reads are refused. | The report’s JSON and CSV agree | none | none |
| REPORT-003 | 3.2 — The report’s JSON and CSV agree; invalid dates and forbidden branch reads are refused. | invalid dates and forbidden branch reads are refused. | none | none |
| REPORT-003 | 4.1 — Payment and reminder labels show their actual recorded basis. | Payment and reminder labels show their actual recorded basis. | none | none |
| REPORT-003 | 5.1 — The report opens at both widths and follows an exact invoice. | The report opens at both widths and follows an exact invoice. | none | none |
| REPORT-003 | 6.1 — Payment, allocation, credit and refund effects follow PAY-018 and PAY-021; reminder state. | Payment | none | none |
| REPORT-003 | 6.2 — Payment, allocation, credit and refund effects follow PAY-018 and PAY-021; reminder state. | allocation | none | none |
| REPORT-003 | 6.3 — Payment, allocation, credit and refund effects follow PAY-018 and PAY-021; reminder state. | credit and refund effects follow PAY-018 and PAY-021 | none | none |
| REPORT-003 | 6.4 — Payment, allocation, credit and refund effects follow PAY-018 and PAY-021; reminder state. | reminder state follows PAY-005. | none | none |
| REPORT-003 | 7.1 — Fixed-monthly invoice dates follow PLAN-013. | Fixed-monthly invoice dates follow PLAN-013. | none | none |
| MOVE-003 | 1.1 — A documented-shape ServiceTitan fixture follows the complete client-and-property move-in j. | A documented-shape ServiceTitan fixture follows the complete client-and-property move-in journey. | none | none |
| MOVE-003 | 2.1 — The owner loads saved V2 response files from the location-and-membership source system and. | The owner loads saved V2 response files from the location-and-membership source system and downloaded attachments through the existing move-in dry run | none | none |
| MOVE-003 | 2.2 — The owner loads saved V2 response files from the location-and-membership source system and. | reviewed fingerprint | none | none |
| MOVE-003 | 2.3 — The owner loads saved V2 response files from the location-and-membership source system and. | journal and guarded undo. | none | none |
| MOVE-003 | 3.1 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assig. | Source IDs | none | none |
| MOVE-003 | 3.2 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assig. | locations | none | none |
| MOVE-003 | 3.3 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assig. | contacts | none | none |
| MOVE-003 | 3.4 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assig. | requests | none | none |
| MOVE-003 | 3.5 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assig. | quotes | none | none |
| MOVE-003 | 3.6 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assig. | jobs | none | none |
| MOVE-003 | 3.7 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assig. | appointments and technician assignments | none | none |
| MOVE-003 | 3.8 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assig. | service and material price-book entries | none | none |
| MOVE-003 | 3.9 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assig. | notes | none | none |
| MOVE-003 | 3.10 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assig. | attachment bytes | none | none |
| MOVE-003 | 3.11 — Source IDs, locations, contacts, requests, quotes, jobs, appointments and technician assig. | equipment and warranties remain linked. | none | none |
| MOVE-003 | 4.1 — Invoice remaining balances are dated opening balances, never a new sale or an approved inv. | Invoice remaining balances are dated opening balances | none | none |
| MOVE-003 | 4.2 — Invoice remaining balances are dated opening balances, never a new sale or an approved inv. | never a new sale or an approved invoice to repost. | none | none |
| MOVE-003 | 5.1 — Nothing is scheduled, emailed or charged by importing. | Nothing is scheduled | none | none |
| MOVE-003 | 5.2 — Nothing is scheduled, emailed or charged by importing. | emailed or charged by importing. | none | none |
| MOVE-003 | 6.1 — A shape without an exact native rule, an unknown field, missing bytes or a rejected parent. | A shape without an exact native rule | none | none |
| MOVE-003 | 6.2 — A shape without an exact native rule, an unknown field, missing bytes or a rejected parent. | an unknown field | none | none |
| MOVE-003 | 6.3 — A shape without an exact native rule, an unknown field, missing bytes or a rejected parent. | missing bytes or a rejected parent is named in the preview | none | none |
| MOVE-003 | 6.4 — A shape without an exact native rule, an unknown field, missing bytes or a rejected parent. | its source is retained | none | none |
| MOVE-003 | 6.5 — A shape without an exact native rule, an unknown field, missing bytes or a rejected parent. | as MOVE-001, MOVE-007 requires. | none | none |
| MOVE-003 | 7.1 — MOVE-005 retains carried QuickBooks references and the cutover checklist; MOVE-006 ret. | MOVE-005 retains carried QuickBooks references | none | none |
| MOVE-003 | 7.2 — MOVE-005 retains carried QuickBooks references and the cutover checklist; MOVE-006 ret. | the cutover checklist | none | none |
| MOVE-003 | 7.3 — MOVE-005 retains carried QuickBooks references and the cutover checklist; MOVE-006 ret. | MOVE-006 retains saved methods | none | none |
| MOVE-003 | 7.4 — MOVE-005 retains carried QuickBooks references and the cutover checklist; MOVE-006 ret. | autopay and processor authorization | none | none |
| MOVE-003 | 7.5 — MOVE-005 retains carried QuickBooks references and the cutover checklist; MOVE-006 ret. | a real owner-export journey is recorded when available (MOVE-001, MOVE-007). | none | none |
| MOVE-009 | 1.1 — One source membership remains one agreement, including ongoing or multiple-location terms. | One source membership remains one agreement | none | none |
| MOVE-009 | 1.2 — One source membership remains one agreement, including ongoing or multiple-location terms. | including ongoing or multiple-location terms | none | none |
| MOVE-009 | 1.3 — One source membership remains one agreement, including ongoing or multiple-location terms. | each source recurring-service event keeps its own site | none | none |
| MOVE-009 | 1.4 — One source membership remains one agreement, including ongoing or multiple-location terms. | template SKUs | none | none |
| MOVE-009 | 1.5 — One source membership remains one agreement, including ongoing or multiple-location terms. | quantities | none | none |
| MOVE-009 | 1.6 — One source membership remains one agreement, including ongoing or multiple-location terms. | exact due date and completed or source-closed state. | none | none |
| MOVE-009 | 2.1 — Its source billing template is labelled separately from charge permission, and unavailable. | Its source billing template is labelled separately from charge permission | none | none |
| MOVE-009 | 2.2 — Its source billing template is labelled separately from charge permission, and unavailable. | unavailable member benefits are named. | none | none |
| MOVE-009 | 3.1 — Monthly rules with one day and weekly rules with one weekday matching their anchor map to. | Monthly rules with one day and weekly rules with one weekday matching their anchor map to inactive native proposals | none | none |
| MOVE-009 | 3.2 — Monthly rules with one day and weekly rules with one weekday matching their anchor map to. | a person explicitly chooses a technician and times before activating a mapped rule strictly after exported events | none | none |
| MOVE-009 | 3.3 — Monthly rules with one day and weekly rules with one weekday matching their anchor map to. | with its original end date. | none | none |
| API-001 | 1.1 — Each documented service-work read and command can be called through the HTTP door with the. | Each documented service-work read and command can be called through the HTTP door with the same product outcome as its screen. | none | none |
| API-004 | 1.1 — A fixture links a CompanyCam project (fake) and checks photos flow both ways once. | A fixture links a CompanyCam project (fake) | none | none |
| API-004 | 1.2 — A fixture links a CompanyCam project (fake) and checks photos flow both ways once. | checks photos flow both ways once. | none | none |
| API-004 | 2.1 — The owner saves or disconnects a CompanyCam Public API access token as an installation sec. | The owner saves or disconnects a CompanyCam Public API access token as an installation secret | none | none |
| API-004 | 2.2 — The owner saves or disconnects a CompanyCam Public API access token as an installation sec. | excluded from state | none | none |
| API-004 | 2.3 — The owner saves or disconnects a CompanyCam Public API access token as an installation sec. | exports | none | none |
| API-004 | 2.4 — The owner saves or disconnects a CompanyCam Public API access token as an installation sec. | logs and archives. | none | none |
| API-004 | 3.1 — Saving it is labelled unverified. | Saving it is labelled unverified. | none | none |
| API-004 | 4.1 — The owner or dispatcher links a job to an existing project by numeric id; its recorded add. | The owner or dispatcher links a job to an existing project by numeric id | none | none |
| API-004 | 4.2 — The owner or dispatcher links a job to an existing project by numeric id; its recorded add. | its recorded address must match the site's address after case | none | none |
| API-004 | 4.3 — The owner or dispatcher links a job to an existing project by numeric id; its recorded add. | whitespace and punctuation normalization | none | none |
| API-004 | 4.4 — The owner or dispatcher links a job to an existing project by numeric id; its recorded add. | without claiming postal validation. | none | none |
| API-004 | 5.1 — Imports and exports are explicit actions on that job. | Imports | none | none |
| API-004 | 5.2 — Imports and exports are explicit actions on that job. | exports are explicit actions on that job. | none | none |
| API-004 | 6.1 — Imports consume every cursor page, retain provider photo ids and capture times, and show o. | Imports consume every cursor page | none | none |
| API-004 | 6.2 — Imports consume every cursor page, retain provider photo ids and capture times, and show o. | retain provider photo ids and capture times | none | none |
| API-004 | 6.3 — Imports consume every cursor page, retain provider photo ids and capture times, and show o. | show original photos with captions labelled CompanyCam | none | none |
| API-004 | 6.4 — Imports consume every cursor page, retain provider photo ids and capture times, and show o. | never as technician arrival or sign-off. | none | none |
| API-004 | 7.1 — The existing Glove JPEG/PNG/WebP and 1.5 MB photo limits apply, with a visible error for e. | The existing Glove JPEG/PNG/WebP and 1.5 MB photo limits apply | none | none |
| API-004 | 7.2 — The existing Glove JPEG/PNG/WebP and 1.5 MB photo limits apply, with a visible error for e. | with a visible error for every unsupported | none | none |
| API-004 | 7.3 — The existing Glove JPEG/PNG/WebP and 1.5 MB photo limits apply, with a visible error for e. | oversized or unready photo | none | none |
| API-004 | 7.4 — The existing Glove JPEG/PNG/WebP and 1.5 MB photo limits apply, with a visible error for e. | none is silently skipped. | none | none |
| API-004 | 8.1 — Repeating an import creates no second copy. | Repeating an import creates no second copy. | none | none |
| API-008 | 1.1 — A selected original Glove photo sends only its bytes and caption to that project; no custo. | A selected original Glove photo sends only its bytes and caption to that project | none | none |
| API-008 | 1.2 — A selected original Glove photo sends only its bytes and caption to that project; no custo. | no customer identity | none | none |
| API-008 | 1.3 — A selected original Glove photo sends only its bytes and caption to that project; no custo. | contacts | none | none |
| API-008 | 1.4 — A selected original Glove photo sends only its bytes and caption to that project; no custo. | job prices or other fields are sent. | none | none |
| API-008 | 2.1 — A durable, current-authority-checked reservation precedes the upload. | A durable | none | none |
| API-008 | 2.2 — A durable, current-authority-checked reservation precedes the upload. | current-authority-checked reservation precedes the upload. | none | none |
| API-008 | 3.1 — Its provider photo id and caption outcome are kept; repeating a send never sends that phot. | Its provider photo id and caption outcome are kept | none | none |
| API-008 | 3.2 — Its provider photo id and caption outcome are kept; repeating a send never sends that phot. | repeating a send never sends that photo again. | none | none |
| API-008 | 4.1 — An uncertain upload is labelled “outcome unknown; check CompanyCam” and is never resent. | An uncertain upload is labelled “outcome unknown | none | none |
| API-008 | 4.2 — An uncertain upload is labelled “outcome unknown; check CompanyCam” and is never resent. | check CompanyCam” and is never resent. | none | none |
| API-008 | 5.1 — The owner can reconcile it to an existing photo in the same project only after its origina. | The owner can reconcile it to an existing photo in the same project only after its original-byte SHA-256 matches | none | none |
| API-008 | 5.2 — The owner can reconcile it to an existing photo in the same project only after its origina. | this confirms the photo without claiming any unconfirmed caption. | none | none |
| API-008 | 6.1 — Exported photos do not loop back into the job; a photo matching an uncertain upload is hel. | Exported photos do not loop back into the job | none | none |
| API-008 | 6.2 — Exported photos do not loop back into the job; a photo matching an uncertain upload is hel. | a photo matching an uncertain upload is held with a visible reconciliation error. | none | none |
| API-008 | 7.1 — Link, import and export outcomes and provider ids are audited on the job; whole-business e. | Link | none | none |
| API-008 | 7.2 — Link, import and export outcomes and provider ids are audited on the job; whole-business e. | import | none | none |
| API-008 | 7.3 — Link, import and export outcomes and provider ids are audited on the job; whole-business e. | export outcomes and provider ids are audited on the job | none | none |
| API-008 | 7.4 — Link, import and export outcomes and provider ids are audited on the job; whole-business e. | whole-business export | none | none |
| API-008 | 7.5 — Link, import and export outcomes and provider ids are audited on the job; whole-business e. | the portable archive retain references and upload reservations | none | none |
| API-008 | 7.6 — Link, import and export outcomes and provider ids are audited on the job; whole-business e. | never the token. | none | none |
| API-005 | 1.1 — A fixture creates two rules, triggers each, checks the run log and effect, and checks a ru. | A fixture creates two rules | none | none |
| API-005 | 1.2 — A fixture creates two rules, triggers each, checks the run log and effect, and checks a ru. | triggers each | none | none |
| API-005 | 1.3 — A fixture creates two rules, triggers each, checks the run log and effect, and checks a ru. | checks the run log and effect | none | none |
| API-005 | 1.4 — A fixture creates two rules, triggers each, checks the run log and effect, and checks a ru. | checks a rule created by an office person cannot book a visit. | none | none |
| API-005 | 2.1 — The owner and the office make rules (rule save action); a rule's creator or the owner chan. | The owner | none | none |
| API-005 | 2.2 — The owner and the office make rules (rule save action); a rule's creator or the owner chan. | the office make rules (rule save action) | none | none |
| API-005 | 2.3 — The owner and the office make rules (rule save action); a rule's creator or the owner chan. | a rule's creator or the owner changes it or turns it off. | none | none |
| API-005 | 3.1 — A rule has a trigger among Glove's own events (a request created, a quote's price approved. | A rule has a trigger among Glove's own events (a request created | none | none |
| API-005 | 3.2 — A rule has a trigger among Glove's own events (a request created, a quote's price approved. | a quote's price approved | none | none |
| API-005 | 3.3 — A rule has a trigger among Glove's own events (a request created, a quote's price approved. | a job created | none | none |
| API-005 | 3.4 — A rule has a trigger among Glove's own events (a request created, a quote's price approved. | a job completed) | none | none |
| API-005 | 3.5 — A rule has a trigger among Glove's own events (a request created, a quote's price approved. | an optional condition (the request's source | none | none |
| API-005 | 3.6 — A rule has a trigger among Glove's own events (a request created, a quote's price approved. | the quote's or job's total over an amount | none | none |
| API-005 | 3.7 — A rule has a trigger among Glove's own events (a request created, a quote's price approved. | tax included) and one action: an in-app notice to a desk role or to one named person who holds a desk role | none | none |
| API-005 | 3.8 — A rule has a trigger among Glove's own events (a request created, a quote's price approved. | booking a job just created with a technician a number of days later at set times | none | none |
| API-005 | 3.9 — A rule has a trigger among Glove's own events (a request created, a quote's price approved. | or assigning a job just completed's invoice preparation to one named person who prepares invoices (the owner or an office person) | none | none |
| API-005 | 3.10 — A rule has a trigger among Glove's own events (a request created, a quote's price approved. | shown on the job with a notice to them. | none | none |
| API-005 | 4.1 — After every command, each enabled rule whose trigger that command raised runs once, as its. | After every command | none | none |
| API-005 | 4.2 — After every command, each enabled rule whose trigger that command raised runs once, as its. | each enabled rule whose trigger that command raised runs once | none | none |
| API-005 | 4.3 — After every command, each enabled rule whose trigger that command raised runs once, as its. | as its creator's current role checked at run time through the same command checks: an action that role cannot take is logged "not allowed" and does nothing | none | none |
| API-005 | 4.4 — After every command, each enabled rule whose trigger that command raised runs once, as its. | a booking with a conflict is logged "refused" (a rule never confirms a conflict review). | none | none |
| API-005 | 5.1 — Every run is logged with the rule and its version, the triggering record, the outcome and. | Every run is logged with the rule | none | none |
| API-005 | 5.2 — Every run is logged with the rule and its version, the triggering record, the outcome and. | its version | none | none |
| API-005 | 5.3 — Every run is logged with the rule and its version, the triggering record, the outcome and. | the triggering record | none | none |
| API-005 | 5.4 — Every run is logged with the rule and its version, the triggering record, the outcome and. | the outcome and why | none | none |
| API-005 | 5.5 — Every run is logged with the rule and its version, the triggering record, the outcome and. | is shown with the rules on the Rules screen | none | none |
| API-005 | 5.6 — Every run is logged with the rule and its version, the triggering record, the outcome and. | what a rule does never triggers another rule. | none | none |
| API-005 | 6.1 — A customer-tag condition comes with CUST-004, CUST-006, and applying a lead cost (leadCo. | A customer-tag condition comes with CUST-004, CUST-006 | none | none |
| API-005 | 6.2 — A customer-tag condition comes with CUST-004, CUST-006, and applying a lead cost (leadCo. | applying a lead cost (leadCost | none | none |
| API-005 | 6.3 — A customer-tag condition comes with CUST-004, CUST-006, and applying a lead cost (leadCo. | on enquiry created action) with BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017 | none | none |
| API-005 | 6.4 — A customer-tag condition comes with CUST-004, CUST-006, and applying a lead cost (leadCo. | which carry them in their text and acceptance. | none | none |
| DATA-001 | 1.1 — A fixture exports one customer's data, erases them, checks every personal field and file i. | A fixture exports one customer's data | none | none |
| DATA-001 | 1.2 — A fixture exports one customer's data, erases them, checks every personal field and file i. | erases them | none | none |
| DATA-001 | 1.3 — A fixture exports one customer's data, erases them, checks every personal field and file i. | checks every personal field and file is gone while invoice totals and tax records remain | none | none |
| DATA-001 | 1.4 — A fixture exports one customer's data, erases them, checks every personal field and file i. | checks a restored older backup cannot bring them back. | none | none |
| DATA-001 | 2.1 — Only a signed-in owner without branch limits, never an integration token or custom role, r. | Only a signed-in owner without branch limits | none | none |
| DATA-001 | 2.2 — Only a signed-in owner without branch limits, never an integration token or custom role, r. | never an integration token or custom role | none | none |
| DATA-001 | 2.3 — Only a signed-in owner without branch limits, never an integration token or custom role, r. | requests whole-customer export or explicitly confirms erasure. | none | none |
| DATA-001 | 3.1 — The request closes over every merged identity and its receipt lists every merged ID. | The request closes over every merged identity | none | none |
| DATA-001 | 3.2 — The request closes over every merged identity and its receipt lists every merged ID. | its receipt lists every merged ID. | none | none |
| DATA-001 | 4.1 — Export includes related records, full timeline and base64 original files/certificates; sha. | Export includes related records | none | none |
| DATA-001 | 4.2 — Export includes related records, full timeline and base64 original files/certificates; sha. | full timeline and base64 original files/certificates | none | none |
| DATA-001 | 4.3 — Export includes related records, full timeline and base64 original files/certificates; sha. | shared CSV/ServiceM8 sources are projected to this customer’s complete source rows/objects | none | none |
| DATA-001 | 4.4 — Export includes related records, full timeline and base64 original files/certificates; sha. | never peer records | none | none |
| DATA-001 | 4.5 — Export includes related records, full timeline and base64 original files/certificates; sha. | with any mixed-ownership source omission explicitly named | none | none |
| DATA-001 | 4.6 — Export includes related records, full timeline and base64 original files/certificates; sha. | its download is shown only in that response | none | none |
| DATA-001 | 4.7 — Export includes related records, full timeline and base64 original files/certificates; sha. | never in saved command outcomes. | none | none |
| DATA-001 | 5.1 — Erasure removes personal operational records, attached originals and certificate chunks/ev. | Erasure removes personal operational records | none | none |
| DATA-001 | 5.2 — Erasure removes personal operational records, attached originals and certificate chunks/ev. | attached originals and certificate chunks/evidence | none | none |
| DATA-001 | 5.3 — Erasure removes personal operational records, attached originals and certificate chunks/ev. | customer-link credentials | none | none |
| DATA-001 | 5.4 — Erasure removes personal operational records, attached originals and certificate chunks/ev. | delivery-recipient/event copies | none | none |
| DATA-001 | 5.5 — Erasure removes personal operational records, attached originals and certificate chunks/ev. | personal timeline text and command results. | none | none |
| DATA-001 | 6.1 — Anonymous customer/site/job placeholders, invoice amounts/dates/classifications, job costs. | Anonymous customer/site/job placeholders | none | none |
| DATA-001 | 6.2 — Anonymous customer/site/job placeholders, invoice amounts/dates/classifications, job costs. | invoice amounts/dates/classifications | none | none |
| DATA-001 | 6.3 — Anonymous customer/site/job placeholders, invoice amounts/dates/classifications, job costs. | job costs and tax totals remain | none | none |
| DATA-001 | 6.4 — Anonymous customer/site/job placeholders, invoice amounts/dates/classifications, job costs. | erased records cannot be edited or unmerged. | none | none |
| DATA-001 | 7.1 — The Base redaction checkpoint and transfer invalidation commit atomically with the erasure. | The Base redaction checkpoint and transfer invalidation commit atomically with the erasure | none | none |
| DATA-001 | 7.2 — The Base redaction checkpoint and transfer invalidation commit atomically with the erasure. | the destination fence or a trusted later post-erasure backup supplied as the import journal refuses an older checkpoint. | none | none |
| DATA-001 | 8.1 — A fresh offline destination cannot discover an erasure without that trusted later journal. | A fresh offline destination cannot discover an erasure without that trusted later journal | none | none |
| DATA-001 | 8.2 — A fresh offline destination cannot discover an erasure without that trusted later journal. | the owner is told to keep it. | none | none |
| DATA-005 | 1.2 — QUOTE-005, QUOTE-015 proves its snapshot/attachment erasure in the document flow; future M. | QUOTE-015 proves its snapshot/attachment erasure in the document flow | none | none |
| DATA-005 | 1.3 — QUOTE-005, QUOTE-015 proves its snapshot/attachment erasure in the document flow; future M. | future MOVE-001 | none | none |
| DATA-005 | 1.4 — QUOTE-005, QUOTE-015 proves its snapshot/attachment erasure in the document flow; future M. | MOVE-007..006 | none | none |
| DATA-005 | 1.9 — QUOTE-005, QUOTE-015 proves its snapshot/attachment erasure in the document flow; future M. | COMM-002/005/006/009 | none | none |
| DATA-005 | 1.14 — QUOTE-005, QUOTE-015 proves its snapshot/attachment erasure in the document flow; future M. | PAY-020/004/007/008/009 and LEDGER-001 | none | none |
| DATA-005 | 1.17 — QUOTE-005, QUOTE-015 proves its snapshot/attachment erasure in the document flow; future M. | LEDGER-007..004 inherit their additional personal stores before shipping. | none | none |
| DATA-005 | 2.1 — Outside copies and holds are DATA-005. | Outside copies and holds are DATA-005. | none | none |
| DATA-006 | 1.1 — An import source can hold one person's customer and site in one record and several people'. | An import source can hold one person's customer and site in one record and several people's originals in one artifact. | none | none |
| DATA-006 | 2.1 — Erasure first produces a preview bound to the customer group's current version. | Erasure first produces a preview bound to the customer group's current version. | none | none |
| DATA-006 | 3.1 — The preview gives counts per store and names: each import batch whose Undo/resume will be. | The preview gives counts per store and names: each import batch whose Undo/resume will be retired and why | none | none |
| DATA-006 | 3.2 — The preview gives counts per store and names: each import batch whose Undo/resume will be. | each shared original artifact that will be withdrawn | none | none |
| DATA-006 | 3.3 — The preview gives counts per store and names: each import batch whose Undo/resume will be. | the number of peer customers whose source file becomes unavailable. | none | none |
| DATA-006 | 4.1 — Confirmation repeats the preview's fingerprint, and a stale preview is refused. | Confirmation repeats the preview's fingerprint | none | none |
| DATA-006 | 4.2 — Confirmation repeats the preview's fingerprint, and a stale preview is refused. | a stale preview is refused. | none | none |
| DATA-006 | 5.1 — The subject's records in every affected batch become zero-effect tombstones, so peers' Und. | The subject's records in every affected batch become zero-effect tombstones | none | none |
| DATA-006 | 5.2 — The subject's records in every affected batch become zero-effect tombstones, so peers' Und. | so peers' Undo and resume keep working. | none | none |
| DATA-006 | 6.1 — A batch's whole Undo/source custody is retired only when the import kit cannot tombstone t. | A batch's whole Undo/source custody is retired only when the import kit cannot tombstone the record or a batch header holds the subject's exact value | none | none |
| DATA-006 | 6.2 — A batch's whole Undo/source custody is retired only when the import kit cannot tombstone t. | its source is then labelled withdrawn. | none | none |
| DATA-006 | 7.1 — A withdrawn shared artifact is removed whole. | A withdrawn shared artifact is removed whole. | none | none |
| DATA-006 | 8.1 — Peers keep their per-record source payloads and their exports name the byte-exact file as. | Peers keep their per-record source payloads | none | none |
| DATA-006 | 8.2 — Peers keep their per-record source payloads and their exports name the byte-exact file as. | their exports name the byte-exact file as an omission. | none | none |
| DATA-007 | 1.1 — Subject values are the group's exact typed identifiers (name, email, phone, address, conta. | Subject values are the group's exact typed identifiers (name | none | none |
| DATA-007 | 1.2 — Subject values are the group's exact typed identifiers (name, email, phone, address, conta. | email | none | none |
| DATA-007 | 1.3 — Subject values are the group's exact typed identifiers (name, email, phone, address, conta. | phone | none | none |
| DATA-007 | 1.4 — Subject values are the group's exact typed identifiers (name, email, phone, address, conta. | address | none | none |
| DATA-007 | 1.5 — Subject values are the group's exact typed identifiers (name, email, phone, address, conta. | contact name/phone/email | none | none |
| DATA-007 | 1.6 — Subject values are the group's exact typed identifiers (name, email, phone, address, conta. | certificate number). | none | none |
| DATA-007 | 2.1 — Peer-owned records that mention them have only those values redacted and are never deleted. | Peer-owned records that mention them have only those values redacted and are never deleted. | none | none |
| DATA-007 | 3.1 — Rewritten identifiers are keyed or random, never a plain hash of a personal value. | Rewritten identifiers are keyed or random | none | none |
| DATA-007 | 3.2 — Rewritten identifiers are keyed or random, never a plain hash of a personal value. | never a plain hash of a personal value. | none | none |
| DATA-007 | 4.1 — No send or remote deletion happens. | No send or remote deletion happens. | none | none |
| DATA-007 | 5.1 — At the next successful device refresh, value-free fences remove the earlier assignee's cac. | At the next successful device refresh | none | none |
| DATA-007 | 5.2 — At the next successful device refresh, value-free fences remove the earlier assignee's cac. | value-free fences remove the earlier assignee's cached day | none | none |
| DATA-007 | 5.3 — At the next successful device refresh, value-free fences remove the earlier assignee's cac. | photo cache and queued captures for erased visits | none | none |
| DATA-007 | 5.4 — At the next successful device refresh, value-free fences remove the earlier assignee's cac. | losing an assignment alone never discards late evidence. | none | none |
| DATA-007 | 6.1 — A disconnected device cannot observe erasure until it reconnects. | A disconnected device cannot observe erasure until it reconnects. | none | none |
| DATA-008 | 1.1 — Only a signed-in owner without branch limits confirms today. | Only a signed-in owner without branch limits confirms today. | none | none |
| DATA-008 | 2.1 — A TEAM-001 privacy permission may later delegate the door. | A TEAM-001 privacy permission may later delegate the door. | none | none |
| DATA-008 | 3.1 — Agents may prepare a request for a person's decision under GLOVE-10/AGENT-009. | Agents may prepare a request for a person's decision under GLOVE-10/AGENT-009. | none | none |
| DATA-008 | 4.1 — A token or agent never records a person’s confirmation. | A token or agent never records a person’s confirmation. | none | none |
| DATA-008 | 5.1 — An agent’s own erasure act carries destructive and sensitive, with the company’s policy de. | An agent’s own erasure act carries destructive and sensitive | none | none |
| DATA-008 | 5.2 — An agent’s own erasure act carries destructive and sensitive, with the company’s policy de. | with the company’s policy deciding the call under its sponsor’s authority. | none | none |
| DATA-002 | 1.1 — Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule a. | Named DATA-002 | none | none |
| DATA-002 | 1.3 — Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule a. | DATA-010 flows perform human and agent commands | none | none |
| DATA-002 | 1.4 — Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule a. | workflow rule actions | none | none |
| DATA-002 | 1.5 — Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule a. | calendar reads | none | none |
| DATA-002 | 1.6 — Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule a. | audience pushes | none | none |
| DATA-002 | 1.7 — Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule a. | model responses | none | none |
| DATA-002 | 1.8 — Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule a. | CompanyCam photo syncs and Web Push setup/subscription/removal/outcomes | none | none |
| DATA-002 | 1.9 — Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule a. | find each current kind with who | none | none |
| DATA-002 | 1.10 — Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule a. | when and what changed in Activity | none | none |
| DATA-002 | 1.11 — Named DATA-002, DATA-009, DATA-010 flows perform human and agent commands, workflow rule a. | the business export. | none | none |
| DATA-002 | 2.1 — The browser journey loads an older provider outcome in Activity at 1440 and 390. | The browser journey loads an older provider outcome in Activity at 1440 and 390. | none | none |
| DATA-002 | 3.1 — Future communication, payment and accounting flows assert their new kinds before shipping. | Future communication | none | none |
| DATA-002 | 3.2 — Future communication, payment and accounting flows assert their new kinds before shipping. | payment and accounting flows assert their new kinds before shipping under the carriers below. | none | none |
| DATA-002 | 4.1 — DONE covers every current capability. | DONE covers every current capability. | none | none |
| DATA-002 | 5.1 — Every committed Glove command must supply an explicit timeline event; an eventless command. | Every committed Glove command must supply an explicit timeline event | none | none |
| DATA-002 | 5.2 — Every committed Glove command must supply an explicit timeline event; an eventless command. | an eventless command is refused before its changes commit. | none | none |
| DATA-002 | 6.1 — An event keeps its actual person/agent/rule-creator identity, time, command id, subject an. | An event keeps its actual person/agent/rule-creator identity | none | none |
| DATA-002 | 6.2 — An event keeps its actual person/agent/rule-creator identity, time, command id, subject an. | time | none | none |
| DATA-002 | 6.3 — An event keeps its actual person/agent/rule-creator identity, time, command id, subject an. | command id | none | none |
| DATA-002 | 6.4 — An event keeps its actual person/agent/rule-creator identity, time, command id, subject an. | subject and effect. | none | none |
| DATA-002 | 7.1 — The command's first event also keeps the ids, before/after versions and changed field name. | The command's first event also keeps the ids | none | none |
| DATA-002 | 7.2 — The command's first event also keeps the ids, before/after versions and changed field name. | before/after versions | none | none |
| DATA-002 | 7.3 — The command's first event also keeps the ids, before/after versions and changed field name. | changed field names of its changed records | none | none |
| DATA-002 | 7.4 — The command's first event also keeps the ids, before/after versions and changed field name. | without copying private field values. | none | none |
| DATA-009 | 1.1 — Activity's changed-record details follow the same current visibility as the underlying rec. | Activity's changed-record details follow the same current visibility as the underlying records. | none | none |
| DATA-009 | 2.1 — Provider response facts identify the provider and a generic outcome, never credentials, en. | Provider response facts identify the provider | none | none |
| DATA-009 | 2.2 — Provider response facts identify the provider and a generic outcome, never credentials, en. | a generic outcome | none | none |
| DATA-009 | 2.3 — Provider response facts identify the provider and a generic outcome, never credentials, en. | never credentials | none | none |
| DATA-009 | 2.4 — Provider response facts identify the provider and a generic outcome, never credentials, en. | endpoints | none | none |
| DATA-009 | 2.5 — Provider response facts identify the provider and a generic outcome, never credentials, en. | keys or payloads | none | none |
| DATA-009 | 2.6 — Provider response facts identify the provider and a generic outcome, never credentials, en. | current model | none | none |
| DATA-009 | 2.7 — Provider response facts identify the provider and a generic outcome, never credentials, en. | audience | none | none |
| DATA-009 | 2.8 — Provider response facts identify the provider and a generic outcome, never credentials, en. | CompanyCam and Web Push outcomes are recorded separately so the fact survives a lost final command commit. | none | none |
| DATA-009 | 3.1 — Web Push records subscription/technician/job ids and HTTP status only, including 404/410 a. | Web Push records subscription/technician/job ids and HTTP status only | none | none |
| DATA-009 | 3.2 — Web Push records subscription/technician/job ids and HTTP status only, including 404/410 a. | including 404/410 and unreachable services | none | none |
| DATA-009 | 3.3 — Web Push records subscription/technician/job ids and HTTP status only, including 404/410 a. | it never claims delivery to the phone. | none | none |
| DATA-009 | 4.1 — Subscription setup/removal, marketing disconnects, custom-field/tag/segment edits, stock l. | Subscription setup/removal | none | none |
| DATA-009 | 4.2 — Subscription setup/removal, marketing disconnects, custom-field/tag/segment edits, stock l. | marketing disconnects | none | none |
| DATA-009 | 4.3 — Subscription setup/removal, marketing disconnects, custom-field/tag/segment edits, stock l. | custom-field/tag/segment edits | none | none |
| DATA-009 | 4.4 — Subscription setup/removal, marketing disconnects, custom-field/tag/segment edits, stock l. | stock locations | none | none |
| DATA-009 | 4.5 — Subscription setup/removal, marketing disconnects, custom-field/tag/segment edits, stock l. | purchase-order revisions and rule changes/runs have their own explicit events. | none | none |
| DATA-009 | 5.1 — Activity loads older events by sequence, with current role/job checks on every page; its l. | Activity loads older events by sequence | none | none |
| DATA-009 | 5.2 — Activity loads older events by sequence, with current role/job checks on every page; its l. | with current role/job checks on every page | none | none |
| DATA-009 | 5.3 — Activity loads older events by sequence, with current role/job checks on every page; its l. | its loaded history is discarded when the installation change version or reader changes. | none | none |
| DATA-010 | 1.1 — Every future clause adding a capability, provider, record kind or door inherits this oblig. | Every future clause adding a capability | none | none |
| DATA-010 | 1.2 — Every future clause adding a capability, provider, record kind or door inherits this oblig. | provider | none | none |
| DATA-010 | 1.3 — Every future clause adding a capability, provider, record kind or door inherits this oblig. | record kind or door inherits this obligation. | none | none |
| DATA-010 | 2.1 — The absent customer-message/call/portal kinds are carried by COMM-001, COMM-010, COMM-011. | The absent customer-message/call/portal kinds are carried by COMM-001 | none | none |
| DATA-010 | 2.10 — The absent customer-message/call/portal kinds are carried by COMM-001, COMM-010, COMM-011. | COMM-018/002/005/006/009 | none | none |
| DATA-010 | 2.11 — The absent customer-message/call/portal kinds are carried by COMM-001, COMM-010, COMM-011. | payments/refunds/payouts/office charges by PAY-002 | none | none |
| DATA-010 | 2.15 — The absent customer-message/call/portal kinds are carried by COMM-001, COMM-010, COMM-011. | PAY-020/004/007/009 | none | none |
| DATA-010 | 2.16 — The absent customer-message/call/portal kinds are carried by COMM-001, COMM-010, COMM-011. | accounting syncs by LEDGER-001 | none | none |
| DATA-010 | 2.19 — The absent customer-message/call/portal kinds are carried by COMM-001, COMM-010, COMM-011. | LEDGER-007/002/003/004 | none | none |
| DATA-010 | 2.20 — The absent customer-message/call/portal kinds are carried by COMM-001, COMM-010, COMM-011. | each named in its text and acceptance. | none | none |
| DATA-010 | 3.3 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date | none | none |
| DATA-010 | 3.4 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | separate approval time | none | none |
| DATA-010 | 3.5 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | later-of-period/approval due-date basis | none | none |
| DATA-010 | 3.6 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | approval-gated aging and frozen report/export dates | none | none |
| DATA-010 | 3.7 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | preexisting documents keep their original basis. | none | none |
| DATA-004 | 1.1 — In a fresh local installation, the owner, dispatcher, technician and office complete the s. | In a fresh local installation | none | none |
| DATA-004 | 1.2 — In a fresh local installation, the owner, dispatcher, technician and office complete the s. | the owner | none | none |
| DATA-004 | 1.3 — In a fresh local installation, the owner, dispatcher, technician and office complete the s. | dispatcher | none | none |
| DATA-004 | 1.4 — In a fresh local installation, the owner, dispatcher, technician and office complete the s. | technician and office complete the service-work journey. | none | none |
| AGENT-003 | 1.1 — Under the held company policy, a long-running job leads the agent to prepare a move of the. | Under the held company policy | none | none |
| AGENT-003 | 1.2 — Under the held company policy, a long-running job leads the agent to prepare a move of the. | a long-running job leads the agent to prepare a move of the next visit to another technician | none | none |
| AGENT-003 | 1.3 — Under the held company policy, a long-running job leads the agent to prepare a move of the. | the dispatcher approves that exact move | none | none |
| AGENT-003 | 1.4 — Under the held company policy, a long-running job leads the agent to prepare a move of the. | the customer’s confirmation reply lands on the visit. | none | none |
| AGENT-003 | 2.1 — The delay watch (the desk and agents; never field roles) watches today's signals that exis. | The delay watch (the desk and agents | none | none |
| AGENT-003 | 2.2 — The delay watch (the desk and agents; never field roles) watches today's signals that exis. | never field roles) watches today's signals that exist. | none | none |
| AGENT-003 | 3.1 — A booked visit not yet arrived is at risk when its technician is still on an earlier visit. | A booked visit not yet arrived is at risk when its technician is still on an earlier visit that day after that visit's booked end (a running COST-001 job timer | none | none |
| AGENT-003 | 3.2 — A booked visit not yet arrived is at risk when its technician is still on an earlier visit. | or arrival without completion): Glove expects them free at the moment of reading plus the overrun so far | none | none |
| AGENT-003 | 3.3 — A booked visit not yet arrived is at risk when its technician is still on an earlier visit. | at least 15 minutes | none | none |
| AGENT-003 | 3.4 — A booked visit not yet arrived is at risk when its technician is still on an earlier visit. | flags their later visits that day starting before then. | none | none |
| AGENT-003 | 4.1 — A visit is also at risk while a purchase order for its job (STOCK-002) is not fully rece. | A visit is also at risk while a purchase order for its job (STOCK-002) is not fully received. | none | none |
| AGENT-003 | 5.1 — For an overrun, the watch offers each other active technician free at the same planned tim. | For an overrun | none | none |
| AGENT-003 | 5.2 — For an overrun, the watch offers each other active technician free at the same planned tim. | the watch offers each other active technician free at the same planned time (same branch | none | none |
| AGENT-003 | 5.3 — For an overrun, the watch offers each other active technician free at the same planned tim. | skills | none | none |
| AGENT-003 | 5.4 — For an overrun, the watch offers each other active technician free at the same planned tim. | areas | none | none |
| AGENT-003 | 5.5 — For an overrun, the watch offers each other active technician free at the same planned tim. | time off | none | none |
| AGENT-003 | 5.6 — For an overrun, the watch offers each other active technician free at the same planned tim. | calendars and other visits checked | none | none |
| AGENT-003 | 5.7 — For an overrun, the watch offers each other active technician free at the same planned tim. | cancelled visits free their slots) | none | none |
| AGENT-003 | 5.8 — For an overrun, the watch offers each other active technician free at the same planned tim. | then the same technician at the expected free time rounded up to 15 minutes. | none | none |
| AGENT-003 | 6.1 — The agent (or the owner or a dispatcher) prepares a move as a proposal (proposal prepare a. | The agent (or the owner or a dispatcher) prepares a move as a proposal (proposal prepare action) | none | none |
| AGENT-003 | 6.2 — The agent (or the owner or a dispatcher) prepares a move as a proposal (proposal prepare a. | under the held company policy | none | none |
| AGENT-003 | 6.3 — The agent (or the owner or a dispatcher) prepares a move as a proposal (proposal prepare a. | someone other than the preparer approves the exact move with GLOVE-07 conflict review | none | none |
| AGENT-003 | 6.4 — The agent (or the owner or a dispatcher) prepares a move as a proposal (proposal prepare a. | a visit changed since preparation needs a new proposal. | none | none |
| AGENT-003 | 7.1 — A move that keeps the planned time, or keeps the start inside the visit's arrival window (. | A move that keeps the planned time | none | none |
| AGENT-003 | 7.2 — A move that keeps the planned time, or keeps the start inside the visit's arrival window (. | or keeps the start inside the visit's arrival window (DISP-006) on the same day | none | none |
| AGENT-003 | 7.3 — A move that keeps the planned time, or keeps the start inside the visit's arrival window (. | keeps that window | none | none |
| AGENT-003 | 7.4 — A move that keeps the planned time, or keeps the start inside the visit's arrival window (. | any other move drops it and is labelled "customer not yet asked". | none | none |
| AGENT-010 | 1.1 — Within the AGENT-009 resource and action grant, the same-day, same-technician move keeps i. | Within the AGENT-009 resource and action grant | none | none |
| AGENT-010 | 1.2 — Within the AGENT-009 resource and action grant, the same-day, same-technician move keeps i. | the same-day | none | none |
| AGENT-010 | 1.3 — Within the AGENT-009 resource and action grant, the same-day, same-technician move keeps i. | same-technician move keeps its arrival window | none | none |
| AGENT-010 | 1.4 — Within the AGENT-009 resource and action grant, the same-day, same-technician move keeps i. | its start inside it | none | none |
| AGENT-010 | 1.5 — Within the AGENT-009 resource and action grant, the same-day, same-technician move keeps i. | the company’s policy decides the standard-class call. | none | none |
| AGENT-010 | 2.1 — A changed window is a distinct action with its own authority and computed facts. | A changed window is a distinct action with its own authority and computed facts. | none | none |
| AGENT-010 | 3.1 — The customer's confirmation by reply and the agent's text are carried by COMM-002 and C. | The customer's confirmation by reply | none | none |
| AGENT-010 | 3.2 — The customer's confirmation by reply and the agent's text are carried by COMM-002 and C. | the agent's text are carried by COMM-002 and COMM-005 | none | none |
| AGENT-010 | 3.3 — The customer's confirmation by reply and the agent's text are carried by COMM-002 and C. | technician locations by DISP-005, DISP-012 | none | none |
| AGENT-010 | 3.4 — The customer's confirmation by reply and the agent's text are carried by COMM-002 and C. | each naming AGENT-003, AGENT-010 in its text and acceptance | none | none |
| AGENT-010 | 3.5 — The customer's confirmation by reply and the agent's text are carried by COMM-002 and C. | customer preferences join when a clause records them. | none | none |
| AGENT-005 | 1.1 — A fixture drafts a quote for a 15-year-old furnace request (model fake) and checks three o. | A fixture drafts a quote for a 15-year-old furnace request (model fake) | none | none |
| AGENT-005 | 1.2 — A fixture drafts a quote for a 15-year-old furnace request (model fake) and checks three o. | checks three options from the price book with reasons | none | none |
| AGENT-005 | 1.3 — A fixture drafts a quote for a 15-year-old furnace request (model fake) and checks three o. | under the held company policy | none | none |
| AGENT-005 | 1.4 — A fixture drafts a quote for a 15-year-old furnace request (model fake) and checks three o. | held as a draft until the named person approves. | none | none |
| AGENT-005 | 2.1 — The agent, the owner or a dispatcher asks for a draft on a new or contacted request that n. | The agent | none | none |
| AGENT-005 | 2.2 — The agent, the owner or a dispatcher asks for a draft on a new or contacted request that n. | the owner or a dispatcher asks for a draft on a new or contacted request that names its site | none | none |
| AGENT-005 | 2.3 — The agent, the owner or a dispatcher asks for a draft on a new or contacted request that n. | once the owner has connected the model provider (FIELD-006, FIELD-011). | none | none |
| AGENT-005 | 3.1 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | The owner's provider receives | none | none |
| AGENT-005 | 3.2 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | with store off | none | none |
| AGENT-005 | 3.3 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | a strict answer schema | none | none |
| AGENT-005 | 3.4 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | exactly: the request's description as entered | none | none |
| AGENT-005 | 3.5 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | its source | none | none |
| AGENT-005 | 3.6 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | the site's equipment (type | none | none |
| AGENT-005 | 3.7 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | make | none | none |
| AGENT-005 | 3.8 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | model | none | none |
| AGENT-005 | 3.9 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | install and manufacture dates | none | none |
| AGENT-005 | 3.10 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | age in whole years from the install date | none | none |
| AGENT-005 | 3.11 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | else the manufacture date | none | none |
| AGENT-005 | 3.12 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | to today in the business time zone | none | none |
| AGENT-005 | 3.13 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | refrigerant) with each unit's earlier completed visits' dates and work summaries | none | none |
| AGENT-005 | 3.14 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | the property's past job titles with their completed visits' summaries | none | none |
| AGENT-005 | 3.15 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | and the active price book (code | none | none |
| AGENT-005 | 3.16 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | name | none | none |
| AGENT-005 | 3.17 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | the description customers see | none | none |
| AGENT-005 | 3.18 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | unit | none | none |
| AGENT-005 | 3.19 — The owner's provider receives, with store off and a strict answer schema, exactly: the req. | price before tax). | none | none |
| AGENT-005 | 4.1 — Never costs or markups, the customer's name, contacts, billing or site address, technician. | Never costs or markups | none | none |
| AGENT-005 | 4.2 — Never costs or markups, the customer's name, contacts, billing or site address, technician. | the customer's name | none | none |
| AGENT-005 | 4.3 — Never costs or markups, the customer's name, contacts, billing or site address, technician. | contacts | none | none |
| AGENT-005 | 4.4 — Never costs or markups, the customer's name, contacts, billing or site address, technician. | billing or site address | none | none |
| AGENT-005 | 4.5 — Never costs or markups, the customer's name, contacts, billing or site address, technician. | technician names or serial numbers. | none | none |
| AGENT-005 | 5.1 — Request photos are added separately only under BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOO. | Request photos are added separately only under BOOK-001 | none | none |
| AGENT-005 | 5.5 — Request photos are added separately only under BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOO. | BOOK-010’s consent | none | none |
| AGENT-005 | 5.6 — Request photos are added separately only under BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOO. | owner | none | none |
| AGENT-005 | 5.7 — Request photos are added separately only under BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOO. | metadata | none | none |
| AGENT-005 | 5.8 — Request photos are added separately only under BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOO. | training and withdrawal controls. | none | none |
| AGENT-005 | 6.1 — The answer is a job title and three options, Good, Better and Best, each one to 20 lines o. | The answer is a job title and three options | none | none |
| AGENT-005 | 6.2 — The answer is a job title and three options, Good, Better and Best, each one to 20 lines o. | Good | none | none |
| AGENT-005 | 6.3 — The answer is a job title and three options, Good, Better and Best, each one to 20 lines o. | Better and Best | none | none |
| AGENT-005 | 6.4 — The answer is a job title and three options, Good, Better and Best, each one to 20 lines o. | each one to 20 lines of an active price-book code | none | none |
| AGENT-005 | 6.5 — The answer is a job title and three options, Good, Better and Best, each one to 20 lines o. | a quantity (more than 0 | none | none |
| AGENT-005 | 6.6 — The answer is a job title and three options, Good, Better and Best, each one to 20 lines o. | up to three decimals) | none | none |
| AGENT-005 | 6.7 — The answer is a job title and three options, Good, Better and Best, each one to 20 lines o. | a reason. | none | none |
| AGENT-005 | 7.1 — Any other code, quantity or shape refuses the whole answer, with nothing saved, repaired o. | Any other code | none | none |
| AGENT-005 | 7.2 — Any other code, quantity or shape refuses the whole answer, with nothing saved, repaired o. | quantity or shape refuses the whole answer | none | none |
| AGENT-005 | 7.3 — Any other code, quantity or shape refuses the whole answer, with nothing saved, repaired o. | with nothing saved | none | none |
| AGENT-005 | 7.4 — Any other code, quantity or shape refuses the whole answer, with nothing saved, repaired o. | repaired or retried. | none | none |
| AGENT-005 | 8.1 — Glove saves it as a draft quote on the request (the request becomes quoted) at the price b. | Glove saves it as a draft quote on the request (the request becomes quoted) at the price book's prices | none | none |
| AGENT-005 | 8.2 — Glove saves it as a draft quote on the request (the request becomes quoted) at the price b. | with each option's reason | none | none |
| AGENT-005 | 8.3 — Glove saves it as a draft quote on the request (the request becomes quoted) at the price b. | the label "Drafted by the model from the request. | none | none |
| AGENT-014 | 1.1 — Under the held company policy, a person approves each option’s price before sending. | Under the held company policy | none | none |
| AGENT-014 | 1.2 — Under the held company policy, a person approves each option’s price before sending. | a person approves each option’s price before sending. | none | none |
| AGENT-014 | 2.1 — An agent’s binding price decision carries commitment, and sending carries external; the co. | An agent’s binding price decision carries commitment | none | none |
| AGENT-014 | 2.2 — An agent’s binding price decision carries commitment, and sending carries external; the co. | sending carries external | none | none |
| AGENT-014 | 2.3 — An agent’s binding price decision carries commitment, and sending carries external; the co. | the company’s policy decides these calls | none | none |
| AGENT-014 | 2.4 — An agent’s binding price decision carries commitment, and sending carries external; the co. | with truthful attribution. | none | none |
| AGENT-014 | 3.1 — Quote evidence includes separately consented sanitized request photos under BOOK-008, BOOK. | Quote evidence includes separately consented sanitized request photos under BOOK-008 | none | none |
| AGENT-014 | 3.2 — Quote evidence includes separately consented sanitized request photos under BOOK-008, BOOK. | BOOK-009 and BOOK-010 | none | none |
| AGENT-014 | 3.3 — Quote evidence includes separately consented sanitized request photos under BOOK-008, BOOK. | the front-office call transcript under AGENT-001 | none | none |
| AGENT-014 | 3.4 — Quote evidence includes separately consented sanitized request photos under BOOK-008, BOOK. | preserving each source’s disclosure limits. | none | none |
| AGENT-006 | 1.1 — A fixture raises a callback on a condenser with two prior visits and checks the prepared c. | A fixture raises a callback on a condenser with two prior visits | `tests/api/callbacks.test.mjs:69` | asserted |
| AGENT-006 | 1.2 — A fixture raises a callback on a condenser with two prior visits and checks the prepared c. | checks the prepared checklist cites both visits' readings. | `tests/api/callbacks.test.mjs:69` | asserted |
| AGENT-006 | 2.1 — A new job (from a quote or a service call, which can name the site's equipment) is a callb. | A new job (from a quote or a service call | none | none |
| AGENT-006 | 2.2 — A new job (from a quote or a service call, which can name the site's equipment) is a callb. | which can name the site's equipment) is a callback when a unit it names had a visit on another job completed within the 30 days before the job was made | `tests/api/callbacks.test.mjs:39` | asserted |
| AGENT-006 | 2.3 — A new job (from a quote or a service call, which can name the site's equipment) is a callb. | counted on the server's received completion time | none | none |
| AGENT-006 | 2.4 — A new job (from a quote or a service call, which can name the site's equipment) is a callb. | the window REPORT-002, REPORT-004 counts callbacks in | none | none |
| AGENT-006 | 2.5 — A new job (from a quote or a service call, which can name the site's equipment) is a callb. | the job carries that flag | none | none |
| AGENT-006 | 2.6 — A new job (from a quote or a service call, which can name the site's equipment) is a callb. | its timeline says so. | `tests/api/callbacks.test.mjs:42` | asserted |
| AGENT-006 | 3.1 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | The agent (or the owner or a dispatcher) prepares the checklist with the owner's model provider (FIELD-006, FIELD-011's connection): Glove gathers the unit's record | none | none |
| AGENT-006 | 3.2 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | manual | none | none |
| AGENT-006 | 3.3 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | photos | none | none |
| AGENT-006 | 3.4 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | every earlier completed visit on it (form readings with their ranges and out-of-range flags | `tests/api/callbacks.test.mjs:44` | asserted |
| AGENT-006 | 3.5 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | refrigerant | `tests/api/callbacks.test.mjs:48` | asserted |
| AGENT-006 | 3.6 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | notes | none | none |
| AGENT-006 | 3.7 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | materials) | none | none |
| AGENT-006 | 3.8 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | oldest first | none | none |
| AGENT-006 | 3.9 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | each visit | none | none |
| AGENT-006 | 3.10 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | reading with a reference | none | none |
| AGENT-006 | 3.11 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | the model gets the equipment and visit evidence and photo captions only | none | none |
| AGENT-006 | 3.12 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | never customer names | `tests/api/callbacks.test.mjs:62` | asserted |
| AGENT-006 | 3.13 — The agent (or the owner or a dispatcher) prepares the checklist with the owner's model pro. | contacts or addresses. | `tests/api/callbacks.test.mjs:62` | asserted |
| AGENT-006 | 4.1 — Every checklist step and part must cite references the pack holds, and Glove resolves each. | Every checklist step and part must cite references the pack holds | none | none |
| AGENT-006 | 4.2 — Every checklist step and part must cite references the pack holds, and Glove resolves each. | Glove resolves each citation to the recorded reading | `tests/api/callbacks.test.mjs:63` | asserted |
| AGENT-006 | 4.3 — Every checklist step and part must cite references the pack holds, and Glove resolves each. | an answer that cites nothing or anything else is refused and nothing is kept. | none | none |
| AGENT-006 | 5.1 — The prepared checklist is labelled advisory (the licensed technician diagnoses and decides. | The prepared checklist is labelled advisory (the licensed technician diagnoses and decides the work | `tests/api/callbacks.test.mjs:71` | asserted |
| AGENT-006 | 5.2 — The prepared checklist is labelled advisory (the licensed technician diagnoses and decides. | it is not a safety certification) | `tests/api/callbacks.test.mjs:71` | asserted |
| AGENT-006 | 5.3 — The prepared checklist is labelled advisory (the licensed technician diagnoses and decides. | decides no work | none | none |
| AGENT-006 | 5.4 — The prepared checklist is labelled advisory (the licensed technician diagnoses and decides. | is read by the desk | none | none |
| AGENT-006 | 5.5 — The prepared checklist is labelled advisory (the licensed technician diagnoses and decides. | the technicians assigned to the callback job. | none | none |
| AGENT-008 | 1.1 — A fixture with a fixture day checks every item in the brief matches its records and links. | A fixture with a fixture day checks every item in the brief matches its records and links to its action | none | none |
| AGENT-008 | 1.2 — A fixture with a fixture day checks every item in the brief matches its records and links. | opening it sends no email or push. | `tests/api/morning-brief.test.mjs:66`; `tests/api/morning-brief.test.mjs:67` | asserted |
| AGENT-008 | 2.1 — A fixture opens Glove and reads the brief. | A fixture opens Glove | none | none |
| AGENT-008 | 2.2 — A fixture opens Glove and reads the brief. | reads the brief. | none | none |
| AGENT-008 | 3.1 — COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017. | COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 inherits morning email delivery with a provider-outcome assertion. | none | none |
| AGENT-008 | 4.1 — Glove prepares the brief itself from its records (no model), for the owner only, at the ow. | Glove prepares the brief itself from its records (no model) | none | none |
| AGENT-008 | 4.2 — Glove prepares the brief itself from its records (no model), for the owner only, at the ow. | for the owner only | none | none |
| AGENT-008 | 4.3 — Glove prepares the brief itself from its records (no model), for the owner only, at the ow. | at the owner brief and on the owner's Today screen | none | none |
| AGENT-008 | 4.4 — Glove prepares the brief itself from its records (no model), for the owner only, at the ow. | for the business's local date at the moment it is read (at= reads it as of another UTC moment) | none | none |
| AGENT-008 | 4.5 — Glove prepares the brief itself from its records (no model), for the owner only, at the ow. | it writes nothing. | none | none |
| AGENT-008 | 5.1 — At risk today: visits on that local date, not cancelled or completed, with no technician. | At risk today: visits on that local date | none | none |
| AGENT-008 | 5.2 — At risk today: visits on that local date, not cancelled or completed, with no technician. | not cancelled or completed | none | none |
| AGENT-008 | 5.3 — At risk today: visits on that local date, not cancelled or completed, with no technician. | with no technician | none | none |
| AGENT-008 | 5.4 — At risk today: visits on that local date, not cancelled or completed, with no technician. | not arrived 15 minutes after their start | none | none |
| AGENT-008 | 5.5 — At risk today: visits on that local date, not cancelled or completed, with no technician. | or arrived and still open at or after their planned end (action: Dispatch). | none | none |
| AGENT-008 | 6.1 — Unbilled: completed jobs whose invoice is missing (Prepare invoice) or still a draft (Appr. | Unbilled: completed jobs whose invoice is missing (Prepare invoice) or still a draft (Approve invoice). | none | none |
| AGENT-008 | 7.1 — Over estimate: open jobs whose actual cost exceeds a non-zero estimated cost as COST-004. | Over estimate: open jobs whose actual cost exceeds a non-zero estimated cost as COST-004 computes them (Review job costs) | none | none |
| AGENT-008 | 7.2 — Over estimate: open jobs whose actual cost exceeds a non-zero estimated cost as COST-004. | COST-005 margin warnings stay the live watch. | none | none |
| AGENT-008 | 8.1 — Leads waiting: requests still new or contacted 24 hours or more after entering that stage. | Leads waiting: requests still new or contacted 24 hours or more after entering that stage (Contact the customer / Quote the request). | none | none |
| AGENT-016 | 1.1 — The brief is shown when the owner opens Glove and sends nothing by being opened; COMM-001. | The brief is shown when the owner opens Glove | none | none |
| AGENT-016 | 1.2 — The brief is shown when the owner opens Glove and sends nothing by being opened; COMM-001. | sends nothing by being opened | `tests/api/morning-brief.test.mjs:66`; `tests/api/morning-brief.test.mjs:67` | asserted |
| AGENT-016 | 1.3 — The brief is shown when the owner opens Glove and sends nothing by being opened; COMM-001. | COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 emails it to the owner once per business-local date only when the owner turns that on (mail morning action | none | none |
| AGENT-016 | 1.4 — The brief is shown when the owner opens Glove and sends nothing by being opened; COMM-001. | off by default) | none | none |
| AGENT-016 | 1.5 — The brief is shown when the owner opens Glove and sends nothing by being opened; COMM-001. | with the delivery outcome asserted in its flow | none | none |
| AGENT-016 | 1.6 — The brief is shown when the owner opens Glove and sends nothing by being opened; COMM-001. | nothing is pushed. | `tests/api/morning-brief.test.mjs:66`; `tests/api/morning-brief.test.mjs:67` | asserted |
| AGENT-016 | 2.1 — The brief lists overdue invoices with their invoice links and proposed collection action u. | The brief lists overdue invoices with their invoice links and proposed collection action under PAY-004 | none | none |
| AGENT-016 | 2.4 — The brief lists overdue invoices with their invoice links and proposed collection action u. | PAY-023’s balance rules. | none | none |
| AGENT-016 | 3.6 — PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 now lists outstanding due inclu. | PLAN-011 now lists outstanding due included visits with their agreement and Dispatch links | none | none |
| AGENT-016 | 3.7 — PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 now lists outstanding due inclu. | asserted in its named flow. | none | none |
| AGENT-016 | 4.3 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | PLAN-013 fixed-monthly invoices inherit its ct-approved period-end issue date | none | none |
| AGENT-016 | 4.4 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | separate approval time | none | none |
| AGENT-016 | 4.5 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | later-of-period/approval due-date basis | none | none |
| AGENT-016 | 4.6 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | approval-gated aging and frozen report/export dates | none | none |
| AGENT-016 | 4.7 — PLAN-005, PLAN-012, PLAN-013 fixed-monthly invoices inherit its ct-approved period-end iss. | preexisting documents keep their original basis. | none | none |
| AGENT-009 | 1.1 — Under a company policy that permits the named coordinator’s tune-up bookings below $200 an. | Under a company policy that permits the named coordinator’s tune-up bookings below $200 and blocks higher values | none | none |
| AGENT-009 | 1.2 — Under a company policy that permits the named coordinator’s tune-up bookings below $200 an. | a permitted booking records its grant and policy | none | none |
| AGENT-009 | 1.3 — Under a company policy that permits the named coordinator’s tune-up bookings below $200 an. | a $250 booking is refused | none | none |
| AGENT-009 | 1.4 — Under a company policy that permits the named coordinator’s tune-up bookings below $200 an. | revocation stops the next booking | none | none |
| AGENT-009 | 1.5 — Under a company policy that permits the named coordinator’s tune-up bookings below $200 an. | the person’s Pause stops every agent. | none | none |
| MONEY-004 | moved.1 — QUOTE-007, QUOTE-019 carries discount allocation through this same tax calculation before. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| QUOTE-005 | moved.1 — FIELD-003 inheritance: render the immutable service report as the branded PDF with every s. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| COMM-001 | moved.1 — COMM-007 inheritance: its sent and received messages (or agent conversations) appear in th. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| COMM-011 | moved.1 — QUOTE-002, QUOTE-008, QUOTE-009, QUOTE-010, QUOTE-011, QUOTE-012, QUOTE-013 inherits a con. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| COMM-007 | moved.1 — Inheritance: COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-0. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| COST-007 | moved.1 — Inheritance: TEAM-003, TEAM-006 commissions and spiffs and PAY-002, PAY-017, PAY-018, P. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| PAY-004 | moved.1 — COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| PAY-004 | moved.1 — AGENT-008, AGENT-016 inheritance: the morning brief lists overdue invoices (due date passe. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| PAY-004 | moved.1 — REPORT-003 inheritance: allocations, credits, overpayments and refunds update the aging re. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| PAY-004 | moved.1 — COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| PLAN-002 | moved.1 — QUOTE-007, QUOTE-019 inheritance: the member repair discount is a QUOTE-007, QUOTE-019 doc. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| PLAN-004 | moved.1 — AGENT-008, AGENT-016 inheritance: the morning brief lists agreements with visits due, with. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| TEAM-006 | moved.1 — Inheritance: technician tips do not exist today; PAY-002, PAY-017, PAY-018, PAY-019, PAY-. | Owning-capability pointer or proof boundary moved into the Requirement. | Requirement. | moved |
| FIELD-010 | 5.1 — A technician manages the phone’s own subscription; committed visit changes trigger the bou. | A technician manages the phone’s own subscription. | none | none |
| FIELD-010 | 5.2 — A technician manages the phone’s own subscription; committed visit changes trigger the bou. | Committed visit changes trigger the bounded schedule-notification connector. | none | none |
