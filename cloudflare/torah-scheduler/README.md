# CTI scheduled D'var Torah publishing — implementation contract

This directory is an integration plan, **not a deployed scheduler**. Preserve the existing `cloudflare/cti-admin-api.js` Worker and its routes. Do not describe scheduling as active until the backend, cron trigger, and end-to-end test are deployed and verified.

## Required release rules

- The **Reader**, **Congregational Email**, and **Class** PhilPath editions are independently approved editorial artifacts.
- Approval, saving a Markdown file, or uploading an edition must **never automatically enqueue a release**.
- The Rabbi must explicitly click **Add to Scheduler** and confirm the selected edition(s), Friday date, service status, and release time. A scheduled release may be edited or cancelled before it fires.
- All scheduling uses `America/New_York` (DST-aware).
- **Friday with an evening service:** release at **9:30 PM Eastern**.
- **Friday without an evening service:** release at **3:00 PM Eastern**.
- Determine whether there is a service from the canonical `content/services.json` schedule (including overrides), not an inferred alternating-week pattern. Permit an explicit administrator override, visibly labeled.
- A scheduled Reader must remain unpublished on the public D'var Torah index and inaccessible via public links until the due time. A scheduled Email must not be sent until the due time. A scheduled Class edition must not be surfaced or delivered until its own due time.
- Do not expose pending Class content by committing it to a public GitHub Pages path before the release. Keep unreleased drafts in protected storage or a private repository; the existing public GitHub repo is **not** private draft storage.
- Publishing and sending are separate, idempotent operations; prevent duplicate sends across retries and deployment delays.
- If no service status can be verified, do **not** silently assume 3:00 PM: require manual confirmation before scheduling.
- Scheduler must operate server-side. Browser timers or hiding already-public HTML do not provide a reliable embargo.

## Backend and deployment requirements

Implement authenticated schedule/create, list, update and cancel routes with Rabbi authorization; durable release records; a Cloudflare Cron Trigger or equivalent queue; deployment verification before emailing; audit trail and retry policy. Ensure all release and delivery statuses are visible in the admin scheduler.

One release can coordinate Reader publication and Email delivery, with independently selected Class delivery. Require explicit user action to schedule each selected edition. The scheduler must respect the publication status of every edition, including Class.

The existing Worker source must be integrated rather than replaced. Do not deploy or enable sending without configured storage, sender credentials, cron, and successful staging tests.
