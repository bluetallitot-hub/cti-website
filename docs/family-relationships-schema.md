# CTI Family Relationships — Research Schema (Future Family Tree)

This document defines the data contract for family relationships discovered through Meldathos, CTI newsletters, historical archives, and obituaries. This is a **schema specification**, not a populated database or public family tree.

## Principles
- Preserve CTI's existing canonical memorial names. Never replace them with obituary spellings or aliases.
- Record relationships separately from memorial dedications (`rememberedBy`). Kinship is not evidence of a memorial dedication.
- Preserve evidence and provenance for every asserted relationship; do not infer kinship from shared surnames.
- Link to permanent PersonIDs when established; leave IDs null until identity is verified. Do not assign fabricated IDs.
- Avoid publishing private information about living people. Store contact details only in a private, access-controlled database, not in this public repository.
- Intake should be idempotent: duplicate newsletter processing must not duplicate relationships.

## Proposed private relationship record
`relationshipId`: stable identifier assigned on creation.
`personAId`, `personBId`: nullable permanent PersonIDs.
`personAName`, `personBName`: sourced names retained pending identity matching.
`relationshipType`: parent_of | spouse_of | sibling_of | other.
`sourceType`: cti_newsletter | obituary | archival_document | family_submission | other.
`sourceReference`: issue/page, URL, or archival record ID.
`sourceQuote`: exact relevant source wording, where permitted.
`verificationStatus`: confirmed | probable | unverified.
`reviewNotes`: identity ambiguities and evidence limitations.

Store directional parent-child links as parent_of. A relationship may have multiple independent sources. Only verified, appropriate-for-publication links should appear in a future public family tree.

## Intake process
1. Extract explicitly stated relationships and supporting source details.
2. Match people to existing permanent identities, without automatic fuzzy merges.
3. Save new evidence or update an existing relationship's sources without duplication.
4. Keep obituary-derived relatives out of Remembered by; only CTI-authoritative memorial acknowledgments update that field.
5. Flag uncertain identity matches for human review.

## Unified identity and legacy ID compatibility
Use one permanent PersonID for each person, living or deceased. A memorial is a separate record that references a person; it is not a second person identity.

Proposed new ID namespaces (examples only; do not assign until records are created):
- PersonID: `CTI-P-000001`
- MeldathoID (new namespace): `CTI-M-000001`
- HouseholdID: `CTI-H-000001`
- RelationshipID: `CTI-R-000001`
- MemorialAcknowledgmentID: `CTI-A-000001`

Keep existing `content/meldados.json` record IDs unchanged as immutable legacy IDs; never silently replace or renumber them. When migrating, add a distinct new `meldathoId` and nullable `personId`, with a one-to-one legacy-ID mapping and uniqueness constraints. A PersonID can exist without a Meldatho. Memorial acknowledgments link `meldathoId` to `personId` when the remembering person's identity is confirmed; otherwise retain the historical text and source without guessing an ID. All new identifiers are opaque keys, not name/date encodings. Preserve referential integrity, subscription references, and redirects during any eventual migration.
