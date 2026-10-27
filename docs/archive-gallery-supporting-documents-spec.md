# CTI Archive and Gallery — Supporting Documents Specification

## Gallery attachments

Gallery records may have zero or more supporting documents without requiring separate Archive records. These can be invitations, programs, clippings, correspondence, and other contextual sources.

- Assign each document a stable filename `CTI-###-DOC-N.ext`, where `###` is the parent record and `N` starts at 1.
- Preserve the authentic source, provenance, and parent-record association.
- Record each document under `supportingDocuments` with its ID, filename, title, type, source location, and visibility.
- The Gallery **index** displays photographs and captions, never attached documents.
- In the **expanded Gallery entry**, show an **Original Photograph** link and, for public attachments, descriptive links such as **View Kitchen Dedication Invitation** below the photograph and caption.
- Default attachment visibility is `expanded`: visible only in the expanded Gallery entry, not in the Gallery index.
- `hidden` means do not render a public link; `expanded` means render in the expanded entry. Additional visibility options may be added later.
- Attachments are links to documents, not additional Gallery photographs or separate Archive records.
- The public Gallery renderer must honor visibility; changing the database alone does not implement this behavior.
- A hidden link is not a security mechanism. Files hosted publicly may still be accessible by direct URL. Use protected storage if an attachment must truly be private.

Example:

```json
{
  "id": "CTI-007-DOC-1",
  "fileName": "CTI-007-DOC-1.jpg",
  "type": "invitation",
  "title": "Kitchen Dedication Invitation",
  "visibility": "expanded",
  "linkLabel": "View Kitchen Dedication Invitation"
}
```

## Archive titles and timeline display

- Every Archive record retains its historically accurate `title` (the source headline).
- An optional `subtitle` stores only a verified original subheadline, not an editorial line break or shortened title.
- An optional `timelineTitle` provides a concise editorial label for timeline cards (target approximately 45 characters, not a hard limit).
- Timeline rendering uses `timelineTitle || title`; Archive detail pages use `title` and display `subtitle` only when actually recorded.
- Existing static timeline markup must be migrated or explicitly updated to honor `timelineTitle`; storing the field alone does not change static headings.
