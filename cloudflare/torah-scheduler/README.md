# CTI Reader Edition publication scheduler — implementation contract

**Not deployed:** this is the implementation specification. No automatic release is active.

## Active scope
- **Reader Edition website publication only.** Do not implement, display, or activate a live Email or Class Edition delivery scheduler.
- Email and Class editions may be drafted, previewed, and approved, but must not be automatically sent or surfaced.
- **Approving a Reader Edition automatically creates or updates its pending scheduled release.** No separate Add to Scheduler action is required. Approval is the explicit editorial authorization to schedule; saving a draft is not. Re-approval updates the existing pending release rather than creating duplicates.
- Fridays with evening services: **9:30 PM America/New_York**. Fridays without evening services: **3:00 PM America/New_York**. Use canonical `content/services.json` including overrides. Require manual confirmation if service status cannot be verified.
- Until the scheduled instant, the Reader content must not be visible through the public website or public GitHub Pages URLs. Public GitHub Markdown files are not protected draft storage.
- Before release, the server fetches the canonical **The Blue Thread** RSS feed (or a freshly refreshed trusted RSS-derived catalog), and attempts to match by parasha, year, and episode metadata. Prefer an exact, unambiguous match. Do not invent a podcast URL or attach an uncertain episode. If no match is found or the feed is unavailable, publish the Reader on time with no podcast button; record the lookup result. A later confident match can be attached separately.\n- At the scheduled instant, the server publishes the approved Reader Markdown, writes any confidently matched podcast URL into the index, and then marks the public index entry published. Prevent duplicate releases. Show pending, published, failed, and cancelled states; permit editing and cancellation.
- Use protected server-side storage, Rabbi-only authenticated endpoints, a durable queue/database, and a Cloudflare Cron Trigger. Preserve the existing `cloudflare/cti-admin-api.js` Worker.
- The existing immediate **Publish Reader Now** control is a temporary legacy/manual action and should be replaced by **Approve & Schedule Reader** once the backend is operational. Do not allow it to bypass the embargo accidentally.
- Do not claim a live scheduler exists until deployed and verified end to end.

## Deferred
No email scheduling or email delivery until verified sender services and subscriber infrastructure are connected. Do not bundle email delivery with Reader release. Class Edition scheduling is also deferred.
