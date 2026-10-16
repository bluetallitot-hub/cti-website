# CTI Asset Registry and File Intake — Version 1

## Authority and scope
`content/asset-registry.json` is the central inventory for published website media, quarantined media and archival source files held in GitHub. Google Drive remains canonical for historical originals. A registry entry identifies the *asset*, not its position in a gallery or a page.

## IDs and names
Permanent identifiers use collection prefixes `ARC`, `GAL`, `PRE`, `FND`, `LDR`, `RES` followed by four digits. Numbers are assigned once and never reused. Existing records are initially assigned stable IDs without renaming live paths. One asset may be used in multiple collections: record those usages rather than duplicate the file.

Published filename pattern: `<ID>-<short-lowercase-kebab-description>.<extension>`, for example `GAL-0042-cti-2024-ladies-auxiliary-brunch.jpg`. The registry preserves `original_filename`, `source_reference` (including JHC identifiers such as I-581-01-15-026), and `legacy_paths`. Source archival filenames and citations must not be overwritten or discarded. Keep original image/scan separate from edited display derivative.

## Intake procedure
1. **Receive:** Place incoming files in a staging area, not directly into a public gallery. Record who supplied them, received date, original filename, source/citation, date of creation/publication (or unknown), rights/reuse restrictions and intended use.
2. **Fingerprint and compare:** Compute SHA-256; check the registry for identical hashes, similar titles, historical source IDs and visually similar images. Never treat matching titles as proof of duplication.
3. **Classify:** Choose collection and whether the file is an original, enhanced derivative, transcription, or website display image. Identify its relation to any existing asset.
4. **Register:** Allocate the next unused ID in its collection. If it is an exact duplicate, link to the existing ID rather than minting another. Preserve source provenance.
5. **Preserve:** Save the untouched archival original to the canonical Drive archive and record its Drive file ID when known. For large files, retain only an optimized derivative on the published website after preservation is verified.
6. **Prepare:** Name the published derivative using its permanent ID and a concise descriptive slug; use correct extension and web-friendly format. Avoid spaces, generic names, and names that imply unverified identities.
7. **Publish:** Upload the file, update the registry and gallery/archive index or page together. Verify every local path exists and links render correctly. Do not change existing public paths until references are migrated.
8. **Close:** Set status to `published`, `preserved-unpublished`, `quarantined`, or `pending-review`; record review notes and any legacy redirects/references.

## Minimum registry fields
`id`, `collection`, `title`, `path`, `original_filename`, `source_reference`, `sha256`, `bytes`, `status`, `roles`, `source_drive_id`, `legacy_paths`, `notes`. Unknown information is represented by null or an empty list, never guessed.

## Guardrails
- No deletion solely because a file is unlinked.
- Never overwrite a historical original with an enhanced or compressed version.
- Quarantined assets remain protected until archival and visual review.
- Rename live files only with an atomic reference migration and validation.
- Intake editors must not publish unregistered filenames.
- Run a link and registry audit before merging changes.

## Operational intake (Phase 2)
Use `intake/` as a temporary staging directory on a local checkout. Staged files must not be linked from public pages. To preview an intake record:

```sh
python3 scripts/asset-intake.py --file intake/photo.jpg --collection GAL --title "Descriptive verified title" --source "Donor or archive citation"
```

Review duplicate matches before continuing. For a nonduplicate file, run the same command with `--apply` to allocate its permanent ID, move it to the appropriate asset folder, and create a `pending-review` registry record. Commit the file and registry together. **Do not publish a pending-review file**: first verify Drive preservation, rights, caption, provenance, and historical identities; then set the record to `published` and add the public gallery/archive reference in the same reviewed change. Use `python3 scripts/validate-assets.py` to check registry integrity.

The existing browser-only gallery/archive editors are not authoritative intake tools and cannot safely allocate IDs or perform repository-wide SHA-256 checks. Their manual upload paths must be treated as legacy workflows pending replacement by an authenticated intake interface. Never upload a new image directly through them without registration. The registry build workflow inventories existing files, but must not be used as a substitute for this controlled intake process.

The 27 quarantined assets remain preserved pending visual review. A matching SHA-256 indicates exact bytes, not necessarily a historically identical photograph; visually similar images require human review.
