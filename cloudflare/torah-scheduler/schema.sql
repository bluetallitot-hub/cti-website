-- Staging only: do not run until the Worker D1 binding CTI_TORAH_DB is configured.
CREATE TABLE IF NOT EXISTS torah_releases (
 id TEXT PRIMARY KEY,
 record_id TEXT NOT NULL,
 source_path TEXT NOT NULL,
 reader_source_sha TEXT NOT NULL,
 reader_markdown TEXT NOT NULL,
 email_subject TEXT NOT NULL,
 email_html TEXT NOT NULL,
 email_text TEXT NOT NULL,
 publish_at_utc TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending','publishing','awaiting_deploy','reader_live','failed','cancelled')),
 published_sha TEXT,
 lease_until_utc TEXT,
 last_error TEXT,
 created_at_utc TEXT NOT NULL,
 updated_at_utc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS torah_releases_due ON torah_releases(status,publish_at_utc);
