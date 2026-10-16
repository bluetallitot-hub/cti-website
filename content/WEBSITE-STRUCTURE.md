# CTI website directory plan

## Root
Keep `index.html` and the primary navigation entry pages at root for stable URLs and simple GitHub Pages hosting.

## Collections
- `biographies/`: standardized lay-leadership and board-member biography pages, slugged `first-last.html`. **This collection explicitly excludes the rabbi.**
- `rabbi-bio.html` and `rabbi.html`: separate rabbinic biography and rabbi-facing pages. Retain their distinct content, presentation, and URLs; do not convert them to the leadership biography template.
- `content/biography-directory.json`: authoritative **lay-leadership** biography URL, name, role and photo index; it must not include the rabbi.
- `content/leadership-bios.json`: current approved **lay-leadership** biography text; do not fabricate missing details. The rabbi's biography is maintained independently.
- `assets/`: published media and archival originals, identified through `content/asset-registry.json`.
- `backup-audit/`: inventory and verification reports; administrative, not public navigation.
- Future migration: `archives/`, `sermons/`, `press/`, `resources/` for their corresponding content pages.

## URL compatibility
Do not delete or move existing root pages without preserving their URLs using redirects or forwarding pages and verifying all internal references. Existing root biography pages remain accessible while links from the leadership page transition to `biographies/`. Preserve founder and president chronological galleries and their original ordering.

## Intake
All new media must follow `content/ASSET-INTAKE-PROCEDURE.md` and receive a permanent asset registry ID before publication.

## Biography separation — enforced editorial rule
The rabbi's biography is a distinct editorial and page type, not a member of the lay-leadership biography collection. Do not include Rabbi Phillip Blue in `content/leadership-bios.json` or `content/biography-directory.json`, and do not generate a `biographies/phillip-blue.html` page. Preserve `rabbi-bio.html` and `rabbi.html` and their separate formatting, wording, and navigation. The Leadership Team page may display a rabbi card but must link that card directly to `rabbi-bio.html`.

## Root cleanup sequence
After link audits, replace obsolete root-level individual lay-leadership biographies with compatibility forwarding pages to `biographies/<person>.html`. Do not redirect or move the rabbi's pages. Move historical and sermon content only after all relative asset links and inbound references are mapped and tested.
