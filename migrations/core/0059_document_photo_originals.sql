-- Larger customer document originals retain the existing immutable file identity.
-- Existing inline originals are copied unchanged; overflow stays below D1's row ceiling.
CREATE TABLE glove_files_next (
  id TEXT PRIMARY KEY, capture_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK(media_type IN ('image/jpeg','image/png','image/webp')),
  size INTEGER NOT NULL CHECK(size>0 AND size<=10000000), sha256 TEXT NOT NULL,
  bytes BLOB NOT NULL CHECK(length(bytes)<=1500000), created_at TEXT NOT NULL
);
INSERT INTO glove_files_next SELECT * FROM glove_files;
DROP TABLE glove_files;
ALTER TABLE glove_files_next RENAME TO glove_files;
CREATE TRIGGER glove_files_no_update BEFORE UPDATE ON glove_files BEGIN SELECT RAISE(ABORT,'immutable_file'); END;
CREATE TABLE glove_file_chunks (
  file_id TEXT NOT NULL REFERENCES glove_files(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL, bytes BLOB NOT NULL CHECK(length(bytes)<=1500000),
  PRIMARY KEY(file_id,ordinal)
);
CREATE TRIGGER glove_file_chunks_no_update BEFORE UPDATE ON glove_file_chunks BEGIN SELECT RAISE(ABORT,'immutable_file'); END;
CREATE TRIGGER glove_file_chunks_delete AFTER DELETE ON glove_files BEGIN DELETE FROM glove_file_chunks WHERE file_id=OLD.id; END;
