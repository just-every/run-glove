-- Shift-bound view permissions are transient and excluded from archives.
CREATE TABLE glove_location_delegates (
 technician_id TEXT NOT NULL, shift_id TEXT NOT NULL, operator_id TEXT NOT NULL,
 role TEXT NOT NULL, owner_id TEXT NOT NULL, owner_branch_revision INTEGER NOT NULL,
 PRIMARY KEY(technician_id, operator_id)
);
