-- PLAN-004 credentials follow FIELD-003: only hashes, never portable.
CREATE TABLE glove_booking_secrets (
  link_id TEXT PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE
);
