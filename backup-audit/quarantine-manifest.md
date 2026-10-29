# CTI quarantine manifest

Quarantined originals are preserved on the unpublished branch `cti-unpublished-quarantine`. The website's active paths remain unchanged. The `backup-audit/` directory is excluded from the GitHub Pages deployment.

| Removed path from main | Retained canonical file | Reason | Removal commit |
|---|---|---|---|
| `assets/archive/originals/cti-1972-salem-news-golden-anniversary-original.jpg` | `assets/heritage/CTI-014/CTI-014-ORG-1.jpg` | Identical Git blob; no static references found; original verified on quarantine branch | `c6e2ca9fd14b3f43f999cc2aaa51032fde2520fe` |

| `assets/archive/originals/cti-1992-in-search-of-a-home-stitched.jpg` | `assets/heritage/CTI-020/CTI-020-ORG-1.jpg` | Identical Git blob; no static references found; original verified on quarantine branch | `ad07ce004d32f7a0a28cdffcea9e97b616d545ef` |
| `assets/archive/originals/cti-ladies-auxiliary-officers-original.jpg` | `assets/heritage/CTI-013/CTI-013-ORG-1.jpg` | Identical Git blob; no static references found; original verified on quarantine branch | `eb5cd0466259bae4a80399311534c197f5ffbf76` |

Restore with `git restore --source=origin/cti-unpublished-quarantine -- <original-path>` and commit to `main`. Do not delete the quarantine branch without another verified backup. Static reference analysis does not rule out every dynamic reference.
