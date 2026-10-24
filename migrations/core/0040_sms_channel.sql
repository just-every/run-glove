-- Installation-private SMS credentials follow existing provider custody.
CREATE TABLE glove_provider_keys_next (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp','model','vapid','companycam','stripe-tax','avatax','mail','mail-events','maps','leads-google','leads-yelp','turnstile','stripe-payments','stripe-webhook','wisetack','sms')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
INSERT INTO glove_provider_keys_next(provider,value,set_by,set_at) SELECT provider,value,set_by,set_at FROM glove_provider_keys;
DROP TABLE glove_provider_keys;
ALTER TABLE glove_provider_keys_next RENAME TO glove_provider_keys;

-- These contain opaque references only: no numbers, text or credentials.
CREATE TABLE glove_sms_attempts (message_id TEXT PRIMARY KEY, connection_id TEXT NOT NULL, provider_message_id TEXT UNIQUE, attempted_at TEXT NOT NULL);
CREATE TABLE glove_sms_receipts (receipt_id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, message_id TEXT NOT NULL);
CREATE INDEX glove_sms_receipts_message ON glove_sms_receipts(message_id);
