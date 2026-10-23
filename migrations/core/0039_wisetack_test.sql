CREATE TABLE glove_provider_keys_financing (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp','model','vapid','companycam','stripe-tax','avatax','mail','mail-events','maps','leads-google','leads-yelp','turnstile','stripe-payments','stripe-webhook','wisetack')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
INSERT INTO glove_provider_keys_financing SELECT * FROM glove_provider_keys;
DROP TABLE glove_provider_keys;
ALTER TABLE glove_provider_keys_financing RENAME TO glove_provider_keys;
