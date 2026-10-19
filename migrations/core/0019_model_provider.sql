-- FIELD-006 and AGENT-006: the owner's model provider key joins the marketing
-- keys. SQLite cannot change a CHECK, so the table is rebuilt with its rows.
CREATE TABLE glove_provider_keys_next (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp','model')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
INSERT INTO glove_provider_keys_next(provider,value,set_by,set_at) SELECT provider,value,set_by,set_at FROM glove_provider_keys;
DROP TABLE glove_provider_keys;
ALTER TABLE glove_provider_keys_next RENAME TO glove_provider_keys;
