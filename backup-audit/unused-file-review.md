# CTI file audit — site reachability and duplicate content

**Review only; nothing deleted.** Starting at index.html, this audit follows discovered local HTML links and static asset references, including references in linked CSS, JS and JSON. Dynamic URL construction, external bookmarks, and references from other sites require manual verification.

## Summary
- Tracked files: 191
- Reachable through detected references: 131
- Unreachable HTML: 10
- Unreachable assets: 35
- Identical-content groups: 2

## Unreachable HTML pages
- \`admin/archive-add.html\`
- \`admin/archives.html\`
- \`admin/dvar-torah.html\`
- \`admin/gallery.html\`
- \`admin/index.html\`
- \`admin/leadership.html\`
- \`admin/newsletter.html\`
- \`admin/schedule.html\`
- \`archive-2022-jewish-journal-centennial.html\`
- \`dvar-torah-2026-10-noach-who-belongs-inside-your-ark.html\`

## Unreachable assets (candidates for removal from published site)
- \`assets/archive/originals/I-581-01-15-006-web.jpg\`
- \`assets/archive/originals/I-581-01-15-007-web.jpg\`
- \`assets/archive/originals/I-581-01-15-026-web.jpg\`
- \`assets/archive/originals/Vintage Synagogue Bat Mitzvah Clipping.png\`
- \`assets/archive/originals/article.heic\`
- \`assets/archive/originals/cti-1972-50th-anniversary-clippings-ticket.jpg\`
- \`assets/archive/originals/cti-1972-50th-anniversary-clippings.jpg\`
- \`assets/archive/originals/cti-1992-origins-peabody-sephardic-congregation-2.jpg\`
- \`assets/archive/originals/cti-1997-program-timeline-photos-original-blue.jpg\`
- \`assets/archive/originals/cti-2022-centennial-article.jpg\`
- \`assets/archive/originals/cti-early-religious-leaders-original.jpg\`
- \`assets/archive/originals/cti-elliot-hershoff-obituary-display.jpg\`
- \`assets/archive/originals/cti-leadership-profile-images (1).zip\`
- \`assets/archive/originals/cti-october-1994-original-blue.jpg\`
- \`assets/archive/originals/cti-presidents-plaque-original.jpeg\`
- \`assets/archive/originals/cti-sephardic-temple-honors-patriarch-clipping.jpg\`
- \`assets/archive/originals/cti-september-1983-original-blue.jpg\`
- \`assets/images/anniversaries/cti-1972-anniversary-celebration-photos-2.jpg\`
- \`assets/images/anniversaries/cti-1997-75th-anniversary-program-cover.jpg\`
- \`assets/images/anniversaries/cti-2012-90th-anniversary-program.jpg\`
- \`assets/images/branding/CTI-logo-modern-transparent.png\`
- \`assets/images/founders/Congregation Tifereth Israel Founders Plaque.png\`
- \`assets/images/gallery/Joseph Gibely Reading in the Sanctuary.png\`
- \`assets/images/gallery/cti-1976-joseph-gibely-photo-enhanced.jpg\`
- \`assets/images/gallery/cti-2006-kitchen-dedication-invitation.jpg\`
- \`assets/images/gallery/cti-2024-ladies-auxiliary-temple-emanu-el-brunch.jpg\`
- \`assets/images/gallery/cti-community-members-photo-2006.jpg\`
- \`assets/images/leadership/2012 Shofar Gift Group Portrait.png\`
- \`assets/images/leadership/a_crisp_warmly_lit_professional_portrait_photo_i.png\`
- \`assets/images/leadership/cti-joseph-gibely-ii-1979-portrait.jpg\`
- \`assets/images/leadership/rabbi-blue-family.jpg\`
- \`assets/images/presidents/cti-presidents-plaque-enhanced.png\`
- \`assets/images/presidents/cti-presidents-plaque.jpg\`
- \`assets/resources/newsletters/2026/cti-newsletter-may-2026.pdf\`
- \`assets/resources/newsletters/2026/cti-newsletter-september-2026.pdf\`

## Identical-content duplicate groups
- \`DSP-SH.pdf\`, \`assets/resources/siddurim/DSP-SH.pdf\` (21,416,776 bytes each)
- \`content/archive-additions.json\`, \`content/dvar-additions.json\` (18 bytes each)

## Other unreachable tracked files
- \`.github/workflows/audit-unused-files.yml\`
- \`.github/workflows/pages.yml\`
- \`.github/workflows/preserve-legacy-newsletter.yml\`
- \`.github/workflows/reorganize-assets-once.yml\`
- \`.github/workflows/selective-backup.yml\`
- \`DSP-SH.pdf\`
- \`README.md\`
- \`admin/config.yml\`
- \`admin/reorganize-assets-once.py\`
- \`assets/new/README.md\`
- \`backup-audit/2026-10-15-github-drive-inventory.csv\`
- \`backup-audit/2026-10-15-reorganization-map.json\`
- \`backup-audit/README.md\`
- \`backup-audit/unused-file-review.md\`
- \`content/README.md\`

## Audit limits

Unreachable means not discovered from the home page by static parsing. Pages may be linked from outside CTI or constructed dynamically. Administrative files and historical originals can be unlinked yet intentional. This report is a deletion proposal input, not authorization to delete.
