# CTI Content Architecture — Canonical Principle

**Separate content, metadata, original sources, and presentation.** A shared reader displays a collection's records; records are not authored as standalone HTML pages.

## Collections

1. **D'var Torah:** `content/dvar-torah/index.json`, individual Markdown texts, `dvar-torah.html` reader. Published CTI editions only.
2. **Historical archives:** `content/archives/index.json`, one text transcription per item, original scans retained under `assets/archive/originals/`, one `archive-record.html` reader. Each record requires a stable ID, title, source citation, original asset paths, transcription status, and transcription path. Preserve verbatim text; no silent corrections.
3. **Lay leadership:** `content/leadership-bios.json` is the existing biography source; `content/biography-directory.json` is the person/photo/role directory. Use one generic lay biography reader and stable person IDs. Do not create separate HTML templates per person.
4. **Rabbi:** `rabbi-bio.html` and `rabbi.html` remain distinct. Neither is part of the generic lay biography collection.

## Editorial constraints
- Google Drive is canonical for historical source documents; GitHub is the published mirror.
- Never overwrite an original scan with an edited derivative or transcription.
- Preserve uncertain dates, bylines, spellings, and provenance as documented; flag uncertainty explicitly.
- Founders and presidents galleries retain their curated ordering, including entries without photographs.
- Existing approved content must be compared before retiring its HTML rendering.
- Source/record identity is independent of asset registry identity.
- A shared renderer must safely display text, Hebrew, and nikkud without interpreting embedded scripts.
- Navigation and cards are generated from indexes, not individually hand-edited HTML links.
- Change templates globally, but allow collection-specific presentation (e.g. side-by-side archival scan/transcription).
- Rabbi biography is explicitly exempt from the generic architecture.

## Implementation sequence
1. Inventory historical pages and their source scans, transcriptions, captions, and citations.
2. Extract archival transcriptions into separate text files; generate metadata index and generic archival reader.
3. Compare transcriptions with original page bodies and confirm all scans still load.
4. Convert the 11 lay biographies to a single reader driven by existing structured biography content.
5. Update navigation and links; delete redundant content HTML only after verification. Unlike D'var Torah URLs, archive and leadership legacy URLs should be preserved until explicitly approved for removal.

## Phase 3 status — 2026-10-16

**Do not remove the eight `archives/archive-*.html` historical article pages.** The shared `historical-record.html` reader is not yet a feature-equivalent replacement. The curated legacy pages preserve source-specific photo captions, original document links, layouts, and program details; `press.html` intentionally points to them again after the October 2026 regression. The 2019 article now displays a temporary photograph placeholder while awaiting new CTI photographs; do not restore an externally hosted image or substitute an unverified one.

The original 1979 page includes the circa-1980 building photograph `assets/archive/originals/I-581-01-15-006-web.jpg`. The 1997 page preserves the 75th anniversary program, timeline, and historic 1983/1994 photographs. The 2018 page includes its newspaper clipping. Keep the 2022 Weekly News and Jewish Journal articles separate, with separate scans and transcripts.

**Safe cleanup criteria:** compare each source page against the replacement for article identity, full text, scan, all supplemental photographs, captions, links, attribution, and responsive layout; test the published page; only then remove the superseded file. An index reference to an asset is not proof that it renders. Keep the immutable pre-reorganization backup branch `backup/pre-reorganization-2026-10-15`.

**Current publishing:** `press.html` is the chronological curated index; the eight original archive pages are the authoritative public presentation. `content/archives/index.json` and `historical-record.html` remain preparatory structured data and a secondary reader, not grounds for deleting source-specific pages. The 11 lay biographies use `leader-profile.html` and the structured directory; `leader-bio.html` remains a distinct legacy reader until its references are checked. `archive-record.html` reads `content/archive-additions.json` and is not interchangeable with `historical-record.html`.
