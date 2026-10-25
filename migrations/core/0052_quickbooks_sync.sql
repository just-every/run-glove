-- Installation-private SMS credentials follow existing provider custody.
CREATE TABLE glove_provider_keys_next (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp','model','vapid','companycam','stripe-tax','avatax','mail','mail-events','maps','leads-google','leads-yelp','turnstile','stripe-payments','stripe-webhook','wisetack','sms','quickbooks')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
INSERT INTO glove_provider_keys_next(provider,value,set_by,set_at) SELECT provider,value,set_by,set_at FROM glove_provider_keys;
DROP TABLE glove_provider_keys;
ALTER TABLE glove_provider_keys_next RENAME TO glove_provider_keys;

CREATE TABLE glove_qbo_operations (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  record_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('reserved','sending','complete','rejected','unknown')),
  remote_id TEXT,
  message TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX glove_qbo_once ON glove_qbo_operations(fingerprint) WHERE phase <> 'rejected';
