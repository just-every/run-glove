-- Private, archive-excluded credentials for an explicitly issued visit response.
CREATE TABLE glove_visit_reply_secrets (
  link_id TEXT PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  visit_id TEXT NOT NULL,
  notice_key TEXT NOT NULL,
  issuer_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
