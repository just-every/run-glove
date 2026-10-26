-- Field invoice grants remain in installation-private custody, excluded from archives.
CREATE TABLE glove_provider_keys_field_invoices (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp','model','vapid','companycam','stripe-tax','avatax','mail','mail-events','maps','leads-google','leads-yelp','turnstile','stripe-payments','stripe-webhook','wisetack','sms','quickbooks','xero','field-invoices')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
INSERT INTO glove_provider_keys_field_invoices(provider,value,set_by,set_at) SELECT provider,value,set_by,set_at FROM glove_provider_keys;
DROP TABLE glove_provider_keys;
ALTER TABLE glove_provider_keys_field_invoices RENAME TO glove_provider_keys;
