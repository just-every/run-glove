-- Timeline facts remain append-only except for the owner-authorized erasure
-- batch, which removes personal values and leaves the fact and its sequence.
CREATE TABLE glove_privacy_guard (id INTEGER PRIMARY KEY CHECK(id=1));
DROP TRIGGER glove_events_no_update;
CREATE TRIGGER glove_events_no_update BEFORE UPDATE ON glove_events
 WHEN NOT EXISTS(SELECT 1 FROM glove_privacy_guard WHERE id=1)
 BEGIN SELECT RAISE(ABORT,'append_only_timeline'); END;
