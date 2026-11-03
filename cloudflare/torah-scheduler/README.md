# CTI Reader Edition scheduler — deployment and verification

## Code status (November 3, 2026)
The scheduler implementation has been committed to `cloudflare/cti-admin-api.js` and the publisher interface. **It is not live until the updated Worker is deployed with its private KV binding and a Cron Trigger, then tested.**

## Required Cloudflare configuration
1. Create a dedicated **Workers KV namespace** for CTI Reader drafts and publication queue. Bind it to the existing Worker as **`CTI_TORAH_QUEUE`**. Never expose this namespace to the browser.
2. Add a **Cron Trigger** for the existing Worker: `*/5 * * * *` (UTC, every five minutes). The Worker also handles Meldatho reminders in its scheduled handler; preserve those existing triggers.
3. Deploy the updated `cloudflare/cti-admin-api.js` Worker. No actual credentials, unpublished Markdown, or KV namespace IDs should be committed to public GitHub.
4. Verify `GITHUB_REPOSITORY`, `GITHUB_TOKEN`, `SITE_ORIGIN`, and role authentication in the deployed environment.
5. The public GitHub repository already has historical `content/dvar-torah/editorial-drafts/` files; **audit and remove any unpublished drafts there and their Git history as a separate security task**. New drafts are written to private KV, not public GitHub.

## Behavior
- The Rabbi uses **Approve & Schedule Reader**. Draft text is saved to private KV and approval creates a pending publication automatically.
- Release date must be Friday; the backend checks `content/services.json` and monthly-service logic. Default Eastern time: **9:30 PM** for service Fridays, **3:00 PM** otherwise. The administrator can override the time.
- The private KV queue is scanned by Cloudflare Cron; due Reader Markdown is committed to GitHub, then the public index is marked published.
- A conservative unique podcast match is sought from the RSS-derived `content/podcast-episodes.json` catalog; no match means publication proceeds without a podcast button.
- Admin can inspect, reschedule, or cancel pending publications. Failed publications are visible for correction/retry.
- No Email or Class Edition scheduler is activated.
- GitHub Pages may deploy later than the scheduled commit; Cron runs at five-minute intervals and can be delayed.
- The one-time Chayei Sarah workflow for November 6 remains independent. **Do not schedule the same release twice.**

## Deployment acceptance checks
1. Check the existing Worker still handles login, Meldathos, and other routes.
2. Open the publisher with Rabbi authorization and approve a test Reader scheduled in the future.
3. Confirm `/torah/schedule` reports `pending`, and that the Reader is **not accessible at any public Markdown or index URL**.
4. Reschedule and cancel a test release; confirm no publication.
5. Create another test release and allow Cron to run. Confirm the Markdown appears, the public index switches to published, and the queue reports published.
6. Verify both service and non-service Friday defaults against the public service calendar.
7. Verify RSS failure and no-match both publish without an unrelated podcast.
8. Confirm Email Edition is neither sent nor scheduled.

## Limitations and follow-up
- KV is eventually consistent, so concurrent edits/releases require operational monitoring; GitHub SHA checks protect writes, but strict transactional exactly-once delivery would require a Durable Object or D1 transaction.
- RSS catalog is refreshed separately; consider live RSS lookup and robust episode metadata matching after the basic scheduler is deployed and tested.
- Existing one-time GitHub Actions releases must be retired after permanent scheduling is verified, to avoid duplicate jobs.
