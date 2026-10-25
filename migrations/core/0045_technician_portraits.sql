-- Short-lived customer photo credentials are excluded from installation archives.
-- The current portrait and consent remain in the technician's ordinary record.
CREATE TABLE glove_status_photo_links (
  message_id TEXT PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  technician_id TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status_approved_at TEXT NOT NULL,
  assignment_count INTEGER NOT NULL
);
CREATE INDEX glove_status_photo_links_technician ON glove_status_photo_links(technician_id);
