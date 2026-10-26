-- OAuth app settings, tokens and one-use state share the archive-excluded provider store.
CREATE TABLE glove_provider_keys_qbo_oauth (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp','model','vapid','companycam','stripe-tax','avatax','mail','mail-events','maps','leads-google','leads-yelp','turnstile','stripe-payments','stripe-webhook','wisetack','sms','quickbooks','xero','field-invoices','quickbooks-oauth')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
INSERT INTO glove_provider_keys_qbo_oauth(provider,value,set_by,set_at) SELECT provider,value,set_by,set_at FROM glove_provider_keys;
DROP TABLE glove_provider_keys;
ALTER TABLE glove_provider_keys_qbo_oauth RENAME TO glove_provider_keys;
