# CTI Archive & Gallery — Collection Completion and Publication Workflow

Scope: all 34 current collection records.

## Sequence (mandatory)
1. **Finish all 34 records first.** Verify historical facts, dates, source provenance, authentic headlines and subtitles where present, editorial timeline titles, transcriptions, captions, document attachments, links between records, and image selections. Assign final standardized filenames. Resolve all record-level data issues before moving on.
2. **Audit and stage all assets.** Ensure the Google Drive staging area contains the exact originals, enhancements, thumbnails, and supporting documents required by the completed records. Preserve originals; label AI-derived versions. Produce a definitive upload manifest.
3. **User performs one coordinated upload** of the prepared files to the designated website repository folder(s). Do not require individual GitHub image uploads while reviewing records.
4. **Only after data and asset upload, build the renderers** for Archive, Gallery, expanded photograph/document view, and timeline. Renderers use the completed database rather than hand-authored record-specific markup.
5. **Verify and publish** all presentation views, links, original images, attached documents, and desktop/mobile layouts.

## Record-level completion
`data-complete` means the record itself needs no further routine historical or metadata editing. It does **not** require the public renderer to exist or the assets to have been uploaded to the website.

`staging-complete` means all required named files are present in the staging folder and the record's asset references match the upload manifest.

`published-complete` means files are uploaded, renderers work, and the entry is visually and functionally verified.

Prior `complete-pending-upload` status denotes editorial approval, but requires the final record/asset audit before being treated as `data-complete`.

## Required data checklist
- Identity, dates, historical facts, uncertainties and source/provenance checked
- Archive headline preserved; authentic subtitle when present; timelineTitle if needed
- Transcriptions and captions finalized; no invented source text
- Original scans preserved, derivative images identified, approved thumbnails chosen
- Standardized filenames `CTI-###-ORG-N`, `ENH-N`, `THM-N`, `DOC-N` etc. assigned
- Supporting document titles, captions, visibility and source relationships recorded
- Gallery/Archive cross-links consistent; no accidental self-links
- No outstanding record-level metadata or historical work

## Renderer rules
- Build the public presentation only after the 34 records and the asset upload are complete.
- Gallery index shows photographic thumbnails and captions; expanded Gallery shows approved image, original photograph link (ORG-1 where specified), and supporting document links with appropriate visibility.
- Archive details preserve headline and genuine subheadline, transcription and provenance; timeline uses `timelineTitle || title`.
- Avoid per-record special cases where general database fields can express the requirement.

Later newly discovered historical evidence may still warrant corrections, but ordinary cleanup should not be deferred.
