-- BOOK-004: each connected lead source. A posting provider's door password is kept
-- only as its SHA-256 hash ('-' for Google, which Glove reads and which never posts).
-- Yelp's Leads API key and Google's Ads API credentials follow provider-secret custody.
CREATE TABLE glove_lead_secrets (provider TEXT PRIMARY KEY CHECK(provider IN ('google','angi','thumbtack','yelp')), hash TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
CREATE TABLE glove_provider_keys_next (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp','model','vapid','companycam','stripe-tax','avatax','mail','mail-events','maps','leads-google','leads-yelp')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
INSERT INTO glove_provider_keys_next(provider,value,set_by,set_at) SELECT provider,value,set_by,set_at FROM glove_provider_keys;
DROP TABLE glove_provider_keys;
ALTER TABLE glove_provider_keys_next RENAME TO glove_provider_keys;
