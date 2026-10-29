# CTI quarantine manifest

Quarantined originals are preserved on the unpublished branch `cti-unpublished-quarantine`. The website's active paths remain unchanged. The `backup-audit/` directory is excluded from the GitHub Pages deployment.

| Removed path from main | Retained canonical file | Reason | Removal commit |
|---|---|---|---|
| `assets/archive/originals/cti-1972-salem-news-golden-anniversary-original.jpg` | `assets/heritage/CTI-014/CTI-014-ORG-1.jpg` | Identical Git blob; no static references found; original verified on quarantine branch | `c6e2ca9fd14b3f43f999cc2aaa51032fde2520fe` |

| `assets/archive/originals/cti-1992-in-search-of-a-home-stitched.jpg` | `assets/heritage/CTI-020/CTI-020-ORG-1.jpg` | Identical Git blob; no static references found; original verified on quarantine branch | `ad07ce004d32f7a0a28cdffcea9e97b616d545ef` |
| `assets/archive/originals/cti-ladies-auxiliary-officers-original.jpg` | `assets/heritage/CTI-013/CTI-013-ORG-1.jpg` | Identical Git blob; no static references found; original verified on quarantine branch | `eb5cd0466259bae4a80399311534c197f5ffbf76` |

| `assets/archive/unreviewed/fixed2.png` | `assets/images/meldados/fixed2.png` | Identical Git blob; no static references found; original verified on quarantine branch | `0e3d10bc1bb7c7554f3cdc30b05e2b2f274a7d99` |
| `assets/images/gallery/cti-1994-pikelny-recognition.jpg` | `assets/biographies/CTI-BIO-028/CTI-BIO-028-ORG-1.jpg` | Identical Git blob; no static references found; original verified on quarantine branch | `4932719fcabfea9a1fb9e7be0489053cae8bfb51` |
| `assets/images/gallery/cti-2006-kitchen-dedication-photo.png` | `assets/heritage/CTI-007/CTI-007-ORG-1.png` | Identical Git blob; no static references found; original verified on quarantine branch | `ab6059c268c861dd57da3fa321204bc48a598fda` |
| `assets/images/anniversaries/1997-75th-anniversary-cover.jpg` | `assets/heritage/CTI-022/CTI-022-ORG-1.jpg` | Identical Git blob; no static references found; original verified on quarantine branch | `8ed5abbf7765d12ca59388e4d9f0aaab63670e42` |

| `assets/images/gallery/cti-ladies-auxiliary-officers-colorized.png` | `assets/heritage/CTI-013/CTI-013-COL-1.png` | Identical content; no static references; recovery copy verified | `2edc6438ab95e992dc758b991fa439cce3b89c26` |
| `assets/images/gallery/peabody-hebrew-school-menorah-1958.png` | `assets/heritage/CTI-021/CTI-021-DOC-1.png` | Identical content; no static references; recovery copy verified | `ffe64b54fc0bcf37b91d56ebe6c73418a4b48e14` |

Restore with `git restore --source=origin/cti-unpublished-quarantine -- <original-path>` and commit to `main`. Do not delete the quarantine branch without another verified backup. Static reference analysis does not rule out every dynamic reference.
