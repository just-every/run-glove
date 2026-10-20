-- API-002: integration tokens. Only the SHA-256 of a token is kept; the token
-- itself is shown once. Tokens are credentials, excluded from portable archives.
CREATE TABLE glove_tokens (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, branch_id TEXT,
 hash TEXT NOT NULL UNIQUE, created_by TEXT NOT NULL, created_at TEXT NOT NULL,
 revoked_at TEXT, revoked_by TEXT, last_used_at TEXT
);
