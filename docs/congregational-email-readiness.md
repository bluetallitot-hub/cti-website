# CTI Congregational Email — Deployment and Acceptance Checklist

Updated: 2026-10-26

## Architecture
- Static administration UI: `admin/email.html`
- Worker: `cloudflare/cti-admin-api.js`
- Private subscriber storage: Cloudflare KV `CTI_MAILING_LISTS`
- Sending provider: Resend, via Worker (never from browser)
- Canonical public website origin: Worker `SITE_ORIGIN`
- Current public site is GitHub Pages; hosting migration must not require changes to the email content model.

## Implemented but requiring deployed tests
- Shabbat, newsletter, special event, and custom draft/preview
- Browser-local draft saving
- HTML export and plain-text content
- Subscriber count and Do Not Send filtering in `/congregational-email` preflight
- Confirmation and suppression logic in proposed send endpoint
- Public unsubscribe request/confirmation, requiring real email delivery to test

## Current blocking issues
1. Worker version must be deployed to enable readiness checks. **Do not enable sending.**
2. Verify HTML exported from all four types in browser and email client.
3. Verify current SITE_ORIGIN and CTI_ANNOUNCE_EMAIL_FROM configuration.
4. Sender DNS (SPF, DKIM and provider domain verification) and real CTI email address are pending.
5. A durable, atomic idempotency mechanism (e.g. Durable Object / D1) and resumable delivery queue are required before enabling mass sending. KV is not a concurrency-safe lock.
6. Replace legacy hard-coded GitHub Pages URLs in newsletter and announcement sending, unsubscribe and other mail paths with a configured site origin.
7. Confirm all outgoing email types honor Do Not Send and never expose other subscribers in To/Cc.
8. Confirm newsletter upload refreshes the main editor's internal issue data, not just the dropdown.
9. Verify unsubscribe confirmation token, record retention, and suppression end-to-end.
10. Run browser tests and provider sandbox/real-address tests before release.

## Acceptance tests — no actual delivery
- [ ] Sign in as administrator and open email sender
- [ ] Preview each of the four email types
- [ ] Export each type and inspect branding, links, and plain-text output
- [ ] Run readiness check; validate total, suppressed and eligible counts
- [ ] Confirm Send button remains locked
- [ ] Edit message after preflight; verify readiness is invalidated
- [ ] Verify no unverified sender credentials appear in browser code
- [ ] Test both desktop and mobile layouts

## Acceptance tests — after DNS and real addresses
- [ ] Verify domain with Resend and configure sender
- [ ] Test a controlled single-recipient send
- [ ] Test suppression, unsubscribe, and confirmation
- [ ] Test repeat clicks and concurrent send requests
- [ ] Test partial failure, retry, and provider rejection
- [ ] Validate delivery logs and audit records
- [ ] Enable production sending only after all checks pass

## Hosting migration rule
Use configured public site origin for absolute email links. Do not couple the email database or provider API to the GitHub Pages hostname. Changing hosting should only require configuration and DNS updates, with URL migration/redirect testing.
