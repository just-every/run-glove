-- COMM-001: the owner's customer-email provider key and event-signing key stay
-- out of records, exports and archives like every other provider key.
CREATE TABLE glove_provider_keys_next (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp','model','vapid','companycam','stripe-tax','avatax','mail','mail-events')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
INSERT INTO glove_provider_keys_next(provider,value,set_by,set_at) SELECT provider,value,set_by,set_at FROM glove_provider_keys;
DROP TABLE glove_provider_keys;
ALTER TABLE glove_provider_keys_next RENAME TO glove_provider_keys;

-- Base mail verified delivery-event intake (src/modules/mail/src/events/d1-schema.sql):
-- each signed provider event is kept once with its fingerprint, and each
-- message recipient's delivery state follows Base's terminal-state order.
CREATE TABLE IF NOT EXISTS rer_mail_event_receipts (
  provider TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  event_namespace TEXT NOT NULL,
  event_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  event_json TEXT NOT NULL,
  commit_token TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  conflict INTEGER NOT NULL DEFAULT 0 CONSTRAINT rer_mail_event_identity_conflict CHECK (conflict = 0),
  PRIMARY KEY (provider, tenant_id, event_namespace, event_id)
);
CREATE TABLE IF NOT EXISTS rer_mail_event_states (
  provider TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  event_namespace TEXT NOT NULL,
  provider_message_id TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  event_id TEXT NOT NULL,
  terminal INTEGER NOT NULL CHECK (terminal IN (0, 1)),
  PRIMARY KEY (provider, tenant_id, event_namespace, provider_message_id, recipient)
);
