-- FIELD-003 bearer credentials are deliberately separate from portable domain
-- records. Export/restore excludes this table; restored links need re-issuing.
-- Only a SHA-256 hash is kept. Snapshot and revocation metadata live in the
-- normal authority-guarded glove_records transaction and Activity timeline.
CREATE TABLE glove_report_secrets (
  link_id TEXT PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE
);
