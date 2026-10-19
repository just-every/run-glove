-- CUST-004: the owner's Mango integration credential or Mailchimp API key is a
-- credential. It lives here, never in glove_records, so state, the business
-- export and the installation archive (excludeTables) never carry it.
CREATE TABLE glove_provider_keys (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
