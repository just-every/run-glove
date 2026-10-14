-- Glove field service. Records are versioned JSON documents per kind; the
-- installation version advances once per committed command. The timeline is
-- append-only; files hold photo and signature bytes captured in the field.
CREATE TABLE glove_meta (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL);
INSERT INTO glove_meta VALUES(1,0);
-- A guard row must be ok=1 or its whole batch rolls back.
CREATE TABLE glove_guard (id TEXT PRIMARY KEY, ok INTEGER NOT NULL CHECK(ok=1));
-- revision is the move-in journal's applied revision while a record is exactly as
-- imported; any later change in Glove clears it, so undo sees the edit.
CREATE TABLE glove_records (kind TEXT NOT NULL, id TEXT NOT NULL, version INTEGER NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)), revision TEXT, PRIMARY KEY(kind,id));
CREATE TABLE glove_roles (operator_id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('owner','dispatcher','technician','office','agent','viewer')), assigned_by TEXT NOT NULL, assigned_at TEXT NOT NULL);
CREATE TABLE glove_commands (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, type TEXT NOT NULL, digest TEXT NOT NULL, result TEXT NOT NULL CHECK(json_valid(result)), created_at TEXT NOT NULL);
CREATE TABLE glove_events (id TEXT PRIMARY KEY, sequence INTEGER NOT NULL UNIQUE, at TEXT NOT NULL, actor_id TEXT NOT NULL, actor_name TEXT NOT NULL, actor_role TEXT NOT NULL, command_id TEXT NOT NULL, job_id TEXT, subject_kind TEXT NOT NULL, subject_id TEXT NOT NULL, kind TEXT NOT NULL, summary TEXT NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)));
CREATE INDEX glove_events_job ON glove_events(job_id, sequence);
CREATE TRIGGER glove_events_no_update BEFORE UPDATE ON glove_events BEGIN SELECT RAISE(ABORT,'append_only_timeline'); END;
CREATE TRIGGER glove_events_no_delete BEFORE DELETE ON glove_events BEGIN SELECT RAISE(ABORT,'append_only_timeline'); END;
CREATE TABLE glove_files (id TEXT PRIMARY KEY, capture_id TEXT NOT NULL, media_type TEXT NOT NULL CHECK(media_type IN ('image/jpeg','image/png','image/webp')), size INTEGER NOT NULL CHECK(size>0 AND size<=1500000), sha256 TEXT NOT NULL, bytes BLOB NOT NULL, created_at TEXT NOT NULL);
CREATE TRIGGER glove_files_no_update BEFORE UPDATE ON glove_files BEGIN SELECT RAISE(ABORT,'immutable_file'); END;
