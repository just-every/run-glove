-- Scheduled passes and polls ask the records for a few narrow things (jobs that
-- are completed, routes that are waiting, jobs with standing billing, quotes with
-- an open call task, an invoice's job). These indexes answer each from the rows
-- that match, so the cost follows the work in hand, never the history behind it.
-- Queries name them (INDEXED BY): with no table statistics SQLite would otherwise
-- scan the whole kind.
CREATE INDEX glove_jobs_status ON glove_records(json_extract(data,'$.status')) WHERE kind='jobs';
CREATE INDEX glove_jobs_standing_billing ON glove_records(id) WHERE kind='jobs' AND json_extract(data,'$.series.billing') IS NOT NULL;
CREATE INDEX glove_routes_status ON glove_records(json_extract(data,'$.status')) WHERE kind='routes';
CREATE INDEX glove_quotes_open_calls ON glove_records(id) WHERE kind='quotes' AND data LIKE '%"followupTasks"%"status":"open"%';
CREATE INDEX glove_invoices_job ON glove_records(json_extract(data,'$.jobId')) WHERE kind='invoices';
-- Pending calendar writes, in order, without reading the finished ones.
CREATE INDEX glove_calendar_work_pending ON glove_calendar_work(sequence) WHERE state='pending';
-- Provider facts (delivery states) by subject kind, without reading the owner's and agents' events.
CREATE INDEX glove_events_provider ON glove_events(subject_kind, sequence) WHERE actor_role='provider';
