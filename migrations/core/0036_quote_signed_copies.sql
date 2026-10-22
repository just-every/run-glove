-- Exact customer-approved copies survive document edits, downloads and restore.
-- Only DATA-001's atomic, owner-confirmed privacy batch may remove them.
CREATE TABLE glove_quote_signed_chunks (
  quote_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  ordinal INTEGER NOT NULL,
  bytes BLOB NOT NULL,
  PRIMARY KEY (quote_id,revision,ordinal)
);
CREATE TRIGGER glove_quote_signed_no_update BEFORE UPDATE ON glove_quote_signed_chunks
 BEGIN SELECT RAISE(ABORT,'immutable_signed_quote'); END;
CREATE TRIGGER glove_quote_signed_no_delete BEFORE DELETE ON glove_quote_signed_chunks
 WHEN NOT EXISTS(SELECT 1 FROM glove_privacy_guard WHERE id=1)
 BEGIN SELECT RAISE(ABORT,'immutable_signed_quote'); END;
