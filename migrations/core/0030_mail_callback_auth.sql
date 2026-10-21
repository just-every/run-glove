-- COMM-001: callback secrets never enter business records, command outcomes,
-- exports or archives. Old Postmark passwords survive rotation for 24 hours.
CREATE TABLE glove_mail_callback_auth (
  namespace TEXT PRIMARY KEY,
  current_hash TEXT,
  previous_hash TEXT,
  previous_until TEXT,
  verified_at TEXT
);
CREATE TABLE glove_mail_sns_receipts (
  namespace TEXT NOT NULL,
  message_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  PRIMARY KEY(namespace, message_id)
);
