# CTI Historical Collection — Data Contract (Stabilization Phase 1)

Status: design contract; not a completed data migration.
Existing master: `content/collection-records.json` (schemaVersion 2).
Preserve all legacy fields until every reader, editor, and backend write path is migrated and tested.

## Record identity and visibility
- `id`: immutable canonical CTI identifier. One historical item = one record; multiple associated assets do not create new records.
- `status`: existing publication gate. Only `active` records are public. `draft`, `unapproved`, and `inactive` remain available for administration.
- `duplicateOf`: optional canonical record reference; never delete an inactive duplicate before reconciliation.
- `collection`: legacy presentation category; does not require separate canonical records.

## Proposed additive canonical fields
- `acknowledgment`: optional free-form verbatim text. Never prepend or append thanks automatically. Legacy `archiveAcknowledgment` and `providedBy` remain readable during migration; do not blindly convert a provider name into a full sentence.
- `assets`: array of distinct asset objects: `id` (stable within record), `role` (source-document, original-photo, restored-photo, display-photo, thumbnail, supporting-document), `path` or `driveFileId`, optional `caption`, `attribution`, `source`, `derivedFromAssetId`, `reviewStatus`. The same physical file can serve several roles via references; never duplicate it as separate physical assets.
- `archivePresentation`: optional object referencing source image/document asset IDs, transcription, publication metadata, and related gallery photo asset IDs.
- `galleryPresentations`: optional array of gallery photo presentations, each with its own stable ID, display asset reference, original asset reference, caption and optional linked archive record ID. A record can have several distinct photographs.
- `componentReviews`: keyed by stable component ID (asset IDs, `transcription`, `caption`, `date`, `attribution`, `acknowledgment`, etc.); each entry has `status` of `unreviewed`, `needs-correction`, or `approved`, optionally `note` and `reviewedAt`. Approval is independent of record publication.

## Compatibility and migration rules
1. Inventory all actual fields and references before writing a migration.
2. Retain `originalImage`, `archiveItemImage`, `archiveImage`, `indexImage`, `restoredImage`, `thumbnailImage`, `imageVersions`, `assetInventory`, `photoAlbumImage`, `pdf`, `files`, `googleDriveSourceFiles`, `articleHtml`, `transcript`, `archiveAcknowledgment`, and `providedBy` until readers and writers are updated.
3. Deduplicate asset entries by verified file identity, not by display filename alone. Never conflate a newspaper scan with an extracted photograph.
4. Never infer missing captions, attribution, acknowledgment, provenance, or approval.
5. Validate reference integrity, distinct gallery presentations, public status filtering, and round-trip persistence through the admin backend before switching schemaVersion.
6. Test CTI-017 (canonical 1981 item), CTI-023 (2001 article plus Gibely family photograph), CTI-016 (12-page PDF), and inactive CTI-002.
7. Keep existing public pages working throughout migration; no destructive field removal or bulk status changes.

## Observed baseline (2026-10-22)
37 records: 26 active, 9 unapproved, 1 draft, 1 inactive. `archiveAcknowledgment` appears in 17 records; `providedBy` in 12. No consistent `componentReviews` field was found across records. These counts describe the baseline, not a completed migration.
