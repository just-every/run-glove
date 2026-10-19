-- Private exemption documents are archived with the customer. Each chunk
-- stays below D1's row-size ceiling while the document may be up to 10 MiB.
CREATE TABLE glove_tax_certificates (
  id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, media_type TEXT NOT NULL,
  size INTEGER NOT NULL CHECK(size>0 AND size<=10485760), sha256 TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE glove_tax_certificate_chunks (
  file_id TEXT NOT NULL REFERENCES glove_tax_certificates(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL, bytes BLOB NOT NULL, PRIMARY KEY(file_id,ordinal)
);
-- The optional rate-lookup credential follows existing provider-secret custody.
CREATE TABLE glove_provider_keys_next (provider TEXT PRIMARY KEY CHECK(provider IN ('mango','mailchimp','model','vapid','companycam','stripe-tax')), value TEXT NOT NULL, set_by TEXT NOT NULL, set_at TEXT NOT NULL);
INSERT INTO glove_provider_keys_next(provider,value,set_by,set_at) SELECT provider,value,set_by,set_at FROM glove_provider_keys;
DROP TABLE glove_provider_keys;
ALTER TABLE glove_provider_keys_next RENAME TO glove_provider_keys;
-- Any customer removal removes all of its certificate originals and chunks.
CREATE TRIGGER glove_customer_certificates_delete AFTER DELETE ON glove_records
WHEN OLD.kind='customers'
BEGIN DELETE FROM glove_tax_certificates WHERE customer_id=OLD.id; END;
