CREATE TABLE glove_calendar_work (
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,
 id TEXT NOT NULL UNIQUE,
 command_id TEXT NOT NULL,
 technician_id TEXT NOT NULL,
 connection_id TEXT NOT NULL,
 visit_id TEXT NOT NULL,
 state TEXT NOT NULL,
 action TEXT,
 at TEXT
);
CREATE TABLE glove_calendar_events (
 connection_id TEXT NOT NULL,
 visit_id TEXT NOT NULL,
 event_id TEXT NOT NULL,
 PRIMARY KEY(connection_id,visit_id)
);
CREATE TABLE glove_calendar_credentials (
 provider TEXT PRIMARY KEY,
 value TEXT NOT NULL,
 set_by TEXT NOT NULL,
 set_at TEXT NOT NULL
);
