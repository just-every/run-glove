-- FIELD-004: Web Push to the technician app. The VAPID private key joins the
-- owner's provider keys (SQLite cannot change a CHECK, so that table is
-- rebuilt with its rows). Each subscription belongs to one person on one
-- device and one signed-in session; like the keys it lives outside
-- glove_records, so state, the business export and the installation archive
-- (excludeTables) never carry it, and a restore needs fresh subscriptions.
CREATE TABLE glove_provider_keys_next (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp','model','vapid')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
INSERT INTO glove_provider_keys_next(provider,value,set_by,set_at) SELECT provider,value,set_by,set_at FROM glove_provider_keys;
DROP TABLE glove_provider_keys;
ALTER TABLE glove_provider_keys_next RENAME TO glove_provider_keys;
CREATE TABLE glove_push_subscriptions (id TEXT PRIMARY KEY, operator_id TEXT NOT NULL, session_id TEXT NOT NULL, device TEXT NOT NULL, endpoint TEXT NOT NULL UNIQUE, p256dh TEXT NOT NULL, auth TEXT NOT NULL, created_at TEXT NOT NULL, last_at TEXT, last_outcome TEXT);
CREATE INDEX glove_push_subscriptions_operator ON glove_push_subscriptions(operator_id);
