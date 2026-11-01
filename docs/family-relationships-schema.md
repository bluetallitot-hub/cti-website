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
