-- Value-free fences let an earlier assignee remove erased visit copies on
-- their next successful sync. They expose no customer name, address or bytes.
CREATE TABLE glove_privacy_client_fences (
 operator_id TEXT NOT NULL, visit_id TEXT NOT NULL, job_id TEXT NOT NULL,
 PRIMARY KEY(operator_id,visit_id)
);
