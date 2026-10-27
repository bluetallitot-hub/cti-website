# CTI Archive and Gallery — Supporting Documents Specification

## Gallery attachments

Gallery records may have zero or more supporting documents, without requiring separate Archive records. Such documents may include invitations, programs, clippings, correspondence, or other contextual sources.

- Assign each attached document a stable filename `CTI-###-DOC-N.ext`, where `###` is the parent Gallery record number and `N` starts at 1.
- Preserve the authentic source file, its provenance, and the relationship to the Gallery record.
- Store attachment metadata in `supportingDocuments`, including an identifier, filename, type, title, source location, and visibility.
- **Default visibility: hidden.** Attached documents are not displayed on the public Gallery page, Gallery index, or photo viewer unless the editor explicitly marks an attachment as public.
- Hidden attachments remain accessible to authorized administration and editorial workflows; do not expose their links or raw file paths in public page markup or public JSON payloads where access restriction is required.
- Public attachments, when explicitly enabled, appear as labeled document links in the Gallery detail view, not as additional Gallery photographs.
- Attachment presence does not change a Gallery record into an Archive record.
- Do not delete source documents when changing public visibility.
- The public rendering system must honor the visibility flag, rather than automatically displaying all `supportingDocuments`.

Example:

```json
{
  "id": "CTI-007-DOC-1",
  "fileName": "CTI-007-DOC-1.jpg",
  "type": "invitation",
  "title": "Kitchen Dedication Invitation",
  "visibility": "hidden"
}
```

Note: `visibility: "hidden"` is a presentation setting, not access control for an otherwise publicly hosted file.
