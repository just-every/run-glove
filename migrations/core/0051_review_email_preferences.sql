ALTER TABLE glove_email_stop_secrets RENAME TO glove_email_stop_secrets_old;
CREATE TABLE glove_email_stop_secrets (
 hash TEXT PRIMARY KEY, customer_id TEXT NOT NULL, address_hash TEXT NOT NULL,
 purpose TEXT NOT NULL CHECK(purpose IN ('quotes','reviews')), expires_at TEXT NOT NULL
);
INSERT INTO glove_email_stop_secrets SELECT * FROM glove_email_stop_secrets_old;
DROP TABLE glove_email_stop_secrets_old;
