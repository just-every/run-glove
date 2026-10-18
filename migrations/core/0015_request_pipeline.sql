-- BOOK-003: requests carry a source and a pipeline stage. First-release
-- requests recorded a channel and open/quoted/closed; they become sources and
-- stages (a closed request was lost, its close reason the lost reason).
UPDATE glove_records SET data=json_set(json_remove(data,'$.channel','$.closedReason','$.closedAt'),
  '$.source', CASE json_extract(data,'$.channel') WHEN 'web form' THEN 'website' WHEN 'email' THEN 'email' WHEN 'in person' THEN 'in person' ELSE 'phone' END,
  '$.status', CASE json_extract(data,'$.status') WHEN 'open' THEN 'new' WHEN 'closed' THEN 'lost' ELSE json_extract(data,'$.status') END,
  '$.stageAt', COALESCE(json_extract(data,'$.closedAt'), json_extract(data,'$.createdAt')),
  '$.contacts', json('[]'),
  '$.lostReason', json_extract(data,'$.closedReason'),
  '$.lostAt', json_extract(data,'$.closedAt'))
WHERE kind='enquiries' AND json_extract(data,'$.source') IS NULL;
