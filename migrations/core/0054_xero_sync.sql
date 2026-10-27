-- Durable outbound reservations contain identities and hashes, never customer payloads.
CREATE TABLE glove_xero_operations (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  record_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  phase TEXT NOT NULL CHECK(phase IN ('reserved','sending','complete','rejected','unknown')),
  remote_id TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX glove_xero_outstanding ON glove_xero_operations(connection_id,record_id) WHERE phase IN ('reserved','sending','unknown');
