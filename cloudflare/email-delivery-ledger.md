# CTI Email Delivery Ledger

The next release uses a Cloudflare D1 binding named `CTI_EMAIL_DB` for campaign-level duplicate protection and per-recipient delivery tracking. Do not enable live sending until the database is provisioned and tested.

Migration SQL:

```sql
CREATE TABLE IF NOT EXISTS campaigns (id TEXT PRIMARY KEY, draft_hash TEXT NOT NULL UNIQUE, category TEXT NOT NULL, subject TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS deliveries (campaign_id TEXT NOT NULL, recipient_hash TEXT NOT NULL, status TEXT NOT NULL, provider_id TEXT, error TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (campaign_id, recipient_hash));
```

Use a single transactional insert for campaign creation; a duplicate hash must return a conflict. Mark uncertain provider responses as unknown and never retry them automatically. Keep the production email lock until D1 integration, DNS verification, and controlled delivery tests pass.
