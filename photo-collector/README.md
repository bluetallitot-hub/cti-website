# CTI private photo collector

This is **collection only**. It never publishes images to GitHub or the CTI website, never changes identity decisions, and never modifies or resizes source image bytes.

## Setup

1. Create a dedicated Google Cloud service account with the Drive and Sheets APIs enabled. Grant it Editor access to the **existing** tracker spreadsheet and the **existing** Pending Photos folder. Confirm the account can create files in that folder; if Drive storage policy blocks service accounts, use an authorized delegated identity or OAuth implementation instead.
2. Add its JSON credential as GitHub Actions secret `CTI_PHOTO_GOOGLE_SERVICE_ACCOUNT_JSON`. Never commit credentials or image bytes.
3. In GitHub Actions, select **CTI private photo collector** and run with `execute=false` first.
4. Add **only explicitly cleared** exact HTTPS original-image URLs to `approved-sources.json`. Each entry must have `url`, `private_collection_approved: true`, and a nonempty `rights_evidence` describing permission or a defensible preservation basis. Unclear rights are **not** approval.
5. Inspect the preview. Then run manually with `execute=true`. Do not schedule until a real upload, checksum verification, and tracker readback have succeeded.

Example approval (illustrative URL, do not enable without rights):
```json
{"sources":[{"url":"https://example.org/original.jpg","private_collection_approved":true,"rights_evidence":"Written permission, dated YYYY-MM-DD, on file"}]}
```

## Behavior

- Reads the existing **Obituary Research** tab and inventories the Pending Photos folder on every run.
- Deduplicates exact source URLs; checks previously stored links, filenames, and downloaded-byte MD5 against Drive inventory.
- Rejects Google Drive links, GitHub HTML, non-image responses, small image previews, non-public network addresses, redirects to unsupported destinations, and downloads over 40 MiB.
- Only explicitly approved sources are downloaded; the collector does **not** scrape obituary landing pages for embedded images.
- Uploads the unmodified bytes via Google Drive API (not the ChatGPT connector `upload_file`), retaining image format and resolution.
- Verifies uploaded Drive size, checksum, and folder membership before writing **X** (storage status) and appending provenance in **Z** of the *same* row. Leaves research history and all identity/rights columns untouched.
- Appends dated entries to a separate **Photo Collection Log** tab on execute. Dry runs print JSON to Actions logs and make no Sheet or Drive changes.
- Does not retry a failing source aggressively or bypass site access restrictions.

## Limitations and safeguards

A source image URL is not a license. Rights review is required even for public photographs. A pending image is not an identified portrait and is never published automatically. Obituary/article/PDF landing pages remain NEEDS REVIEW until a permitted original-image URL is obtained. Existing 13 pending files are preserved.

The source host is resolved and checked before fetching, but DNS rebinding is not completely prevented by the HTTP library; run only against reviewed source URLs. A real source that uses anti-bot protection or a dead hostname may remain blocked. No successful external-to-Drive transfer is claimed until an actual Actions run verifies it.

The current implementation uses service-account JSON. For longer-term security, migrate to GitHub OIDC/Google Workload Identity Federation once permissions and identity setup are confirmed.
