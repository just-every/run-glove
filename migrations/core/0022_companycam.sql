-- API-004: credentials remain excluded from state and portable archives.
CREATE TABLE glove_provider_keys_next (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp','model','vapid','companycam')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
INSERT INTO glove_provider_keys_next(provider,value,set_by,set_at) SELECT provider,value,set_by,set_at FROM glove_provider_keys;
DROP TABLE glove_provider_keys;
ALTER TABLE glove_provider_keys_next RENAME TO glove_provider_keys;

-- A reservation is durable before any upload. An uncertain attempt never
-- sends again; the owner reconciles the provider's photo by its exact bytes.
CREATE TABLE glove_companycam_uploads (
 id TEXT PRIMARY KEY, job_id TEXT NOT NULL, project_id TEXT NOT NULL,
 capture_id TEXT NOT NULL, sha256 TEXT NOT NULL, phase TEXT NOT NULL,
 remote_id TEXT, caption_state TEXT NOT NULL DEFAULT 'not sent',
 actor_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 UNIQUE(job_id,project_id,capture_id)
);
