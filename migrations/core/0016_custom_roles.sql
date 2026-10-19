-- TEAM-001: a person may hold a custom role the owner built, stored as
-- custom:<role id>; its permissions are a versioned 'roles' record.
CREATE TABLE glove_roles_next (operator_id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('owner','dispatcher','technician','office','agent','viewer') OR role GLOB 'custom:?*'), assigned_by TEXT NOT NULL, assigned_at TEXT NOT NULL);
INSERT INTO glove_roles_next(operator_id,role,assigned_by,assigned_at) SELECT operator_id,role,assigned_by,assigned_at FROM glove_roles;
DROP TABLE glove_roles;
ALTER TABLE glove_roles_next RENAME TO glove_roles;
