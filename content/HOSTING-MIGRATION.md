# CTI hosting and ownership migration register

Status: planning only. No synagogue-owned GitHub account exists yet. Current repository: `bluetallitot-hub/cti-website`.

## Central configuration

- `assets/repository-config.js` is the canonical configuration for GitHub administration links and the leadership editor API. Change `CTI_REPO.repository` to the future synagogue-owned `owner/repository` when that repository is ready.
- Administrative links are represented by `data-repo-path` attributes in `admin/*.html`, not embedded owner/repository strings.
- The website uses relative links for normal site navigation and locally stored media. These should survive a change of host or base URL.

## Necessary provider-specific configuration (migration checklist)

1. `assets/repository-config.js`: temporary GitHub owner/repository, branch, and derived GitHub URL. This is the intentional runtime hardcoding point.
2. `.github/workflows/*.yml`: GitHub Actions and GitHub Pages deployment definitions are provider-specific; review before switching host or moving ownership. Do not discard historical maintenance workflows without reviewing them.
3. GitHub Pages site URL, repository settings, and DNS/custom-domain settings: configure when the destination is known. Do not invent a future organization, hostname, or domain.
4. External third-party links (Apple Podcasts, Google Docs, historic source sites, email and telephone links) are content references, not GitHub-hosting dependencies. Retain and verify independently.
5. Backup branch `backup/pre-reorganization-2026-10-15`: preserve the complete Git history and this protected backup during transfer.

## Migration procedure (when authorized)

1. Create a CTI-controlled GitHub organization or repository; grant appropriate administrators and set recovery/2FA.
2. Transfer the repository or mirror the complete Git history including tags and backup branches.
3. Update `CTI_REPO.repository`, confirm admin links and authenticated GitHub API editing, and check workflow permissions.
4. Configure GitHub Pages or an alternative static host, then test relative paths, media, catalogs, and administration links at its final URL.
5. Switch DNS/public entry points only after testing; keep a rollback path and verify archival preservation.

No transfer has been performed.


## Detailed transition register — updated 2026-11-03

**Rule:** Keep current accounts running until the new accounts pass end-to-end tests. Never commit passwords, API keys, subscriber data, or Worker tokens to GitHub. Mark each item `pending`, `verified`, or `switched` as the migration proceeds.

### GitHub — new synagogue-owned repository
- [ ] Create CTI-owned organization/repository, two administrators, recovery methods and 2FA.
- [ ] Preserve complete Git history, tags, and `backup/pre-reorganization-2026-10-15`; verify branches and asset files after transfer.
- [ ] Change `assets/repository-config.js` → `CTI_REPO.repository` (currently `bluetallitot-hub/cti-website`); keep `branch: 'main'` unless intentionally changed.
- [ ] Set GitHub Pages source to GitHub Actions; validate `.github/workflows/pages.yml`, `github-pages` environment, Pages URL, custom domain, HTTPS, and `CNAME` if used.
- [ ] Enable Actions and set **Workflow permissions: Read and write** for workflows that commit catalog/content. Verify scheduled workflows run on the new default branch.
- [ ] Audit all `.github/workflows/*.yml` for legacy owner, write permissions, secrets, and one-time jobs; disable stale migrations, retain active maintenance.
- [ ] Reconfigure GitHub Actions repository variable `CTI_EMAIL_ENABLED` (keep false until verified) and secrets `RESEND_API_KEY`, `CTI_FAMILY_RECIPIENTS`, `CTI_CONGREGATION_RECIPIENTS` only where still required. Review whether recipient lists belong in secure service storage instead.
- [ ] Verify `.github/workflows/refresh-podcast-episodes.yml` RSS refresh and Reader publishing workflow. Replace one-off `release-chayei-sarah-2026.yml` with durable general scheduling before relying on it for later weeks.
- [ ] Verify `content/dvar-torah/index.json`, Reader Markdown paths, `content/meldados.json`, newsletters, archive/gallery, and images after transfer.

### Cloudflare — new account
- [ ] Create CTI-owned Cloudflare account and Worker; copy the Worker source `cloudflare/cti-admin-api.js`; record the new Worker name, route/hostname, zone and deploy procedure.
- [ ] Update `admin/cti-auth.js` Worker API base (currently `https://cti-admin-api.bluetallitot.workers.dev`).
- [ ] Configure Worker secrets/variables: `ADMIN_PASSWORD`, `SECRETARY_PASSWORD`, `BOARD_PASSWORD`, `CONGREGATION_PASSWORD`, `MELDADOS_PASSWORD`, `SESSION_SECRET`, `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, `SITE_ORIGIN`, `RESEND_API_KEY`, `CTI_ANNOUNCE_EMAIL_FROM`, `CTI_MELDATHO_EMAIL_FROM`, `CTI_MAILING_LISTS`, `CTI_MELDATHO_SUBSCRIPTIONS`, `CONGREGATION_ZOOM_LINK`, `CTI_ZOOM_LINK`. Determine which are plaintext configuration vs secrets; migrate sensitive lists privately.
- [ ] Set `GITHUB_REPOSITORY` to new owner/repo; issue a narrowly scoped GitHub token with necessary content write permissions; rotate credentials after cutover.
- [ ] Set `SITE_ORIGIN` to final public origin; inspect CORS, redirects and hardcoded old site URLs in Worker (including services link).
- [ ] Preserve and test Worker scheduled handler / cron triggers for Meldathos; avoid duplicate sends while old/new Workers overlap. Check any storage bindings and notification ledgers.
- [ ] Verify login/roles, draft/approve/publish, Meldathos editor, Zoom gate, service admin, newsletter ingestion, and email endpoints before retiring old Worker.

### Resend — new account
- [ ] Create CTI-owned account, verify sending domain and DNS records (SPF, DKIM and applicable DMARC), then issue new API key.
- [ ] Record approved sender addresses; planned roles include `info@ctipeabody.org`, `meldados@ctipeabody.org`, and `rabbi@ctipeabody.org`. Do not assume domain/mailboxes are live until verified.
- [ ] Set new `RESEND_API_KEY` in Worker and any active GitHub Actions secrets; set `CTI_ANNOUNCE_EMAIL_FROM` and `CTI_MELDATHO_EMAIL_FROM` to verified senders.
- [ ] Test one authorized delivery and failure handling; inspect subscriber storage, unsubscribe/bounce policies, duplicates, and delivery audit ledger `cloudflare/email-delivery-ledger.md`.
- [ ] Keep email scheduler disabled until sender authentication, subscriber lists, and sending tests pass.

### DNS, paths, and cutover
- [ ] Obtain DNS ownership/control for `ctipeabody.org`; map apex/www, GitHub Pages verification records, and mail authentication records; lower TTL before change if appropriate.
- [ ] Search source for `bluetallitot-hub`, `workers.dev`, old Pages URL, hardcoded absolute paths, and OAuth allowlists; record each occurrence and update intentionally. Preserve external historical source URLs.
- [ ] Verify Google Drive editorial access and Google OAuth client restrictions/authorized origins in `admin/torah-publisher.js`; update if domain changes.
- [ ] Confirm backups, export subscriber/contacts securely, test a staging environment, and prepare rollback DNS and old account retention.
- [ ] Cut over GitHub Pages → Worker → email carefully; test public pages, authenticated editors, scheduled Reader release, RSS podcast matching, Meldathos, newsletters, and email separately.
- [ ] Only after validation: revoke old tokens, disable old scheduled jobs, remove old domain routes, and archive old account credentials securely.

### Outstanding unknowns to resolve
- Final GitHub organization/repository name and GitHub Pages URL.
- Final Cloudflare Worker hostname, bindings, cron trigger configuration, and deployment method.
- Final domain DNS authority, mailboxes, Resend verified domain and sender identities.
- Any external Google OAuth redirect/authorized-origin settings and legacy hardcoded links not yet audited.
- Durable general Reader scheduler (the current Friday workflow is a one-time release, not the general approval-to-scheduler implementation).
