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
