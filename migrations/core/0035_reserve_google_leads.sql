-- Extend the lead door allowlist without changing or losing existing hashes.
CREATE TABLE glove_lead_secrets_next (
  provider TEXT PRIMARY KEY CHECK(provider IN ('google','reserve-google','angi','thumbtack','yelp')),
  hash TEXT NOT NULL,
  set_by TEXT NOT NULL,
  set_at TEXT NOT NULL
);
INSERT INTO glove_lead_secrets_next (provider,hash,set_by,set_at)
  SELECT provider,hash,set_by,set_at FROM glove_lead_secrets;
DROP TABLE glove_lead_secrets;
ALTER TABLE glove_lead_secrets_next RENAME TO glove_lead_secrets;
