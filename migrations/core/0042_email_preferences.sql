-- Bearers remain private and are excluded from installation archives.
CREATE TABLE glove_email_stop_secrets (
  hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  address_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose='quotes'),
  expires_at TEXT NOT NULL
);
