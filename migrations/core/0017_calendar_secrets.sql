-- DISP-004: a technician's secret calendar (iCal) address is a credential. It
-- lives here, never in glove_records, so state, the business export and the
-- installation archive (excludeTables) never carry it.
CREATE TABLE glove_secrets (technician_id TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('ical')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL, PRIMARY KEY (technician_id, kind));
