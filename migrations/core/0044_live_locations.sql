-- Latest transient position only; no route history or archive custody.
CREATE TABLE glove_live_locations (
 technician_id TEXT PRIMARY KEY, visit_id TEXT NOT NULL, source TEXT NOT NULL,
 lat REAL NOT NULL, lng REAL NOT NULL, observed_at TEXT NOT NULL, received_at TEXT NOT NULL
);
CREATE TABLE glove_fleet_credentials (
 technician_id TEXT PRIMARY KEY, value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL
);
