# CTI Website — Backup and recovery checkpoint (2026-10-15)

## Authoritative source
GitHub repository: `bluetallitot-hub/cti-website`, branch `main`.
Frozen pre-reorganization snapshot: branch `backup/pre-reorganization-2026-10-15`, commit `49022bdf5a85c96a47c2f031a9c0acc7df81e82f`.

**Do not delete this branch.** This is a Git recovery checkpoint, **not** proof of a complete Google Drive backup.

## Drive reconciliation audit
Snapshot inventory: [2026-10-15-github-drive-inventory.csv](2026-10-15-github-drive-inventory.csv).

Compared GitHub files against the current website-build folder in Google Drive and its direct `assets` child. This is not a recursive comparison of every other Drive folder.

- 181 GitHub files in the snapshot; 211,229,923 total bytes.
- 47 same-name files with equal byte counts (not checksum verified).
- 34 same-name files with differing byte counts.
- 100 GitHub files not found at matching paths.
- 4 Drive files with no matching GitHub path in the inspected folders.

**No Drive reconciliation or byte transfer has been completed.** Some Drive files share names but are different sizes, including historical scans; preserve them until reviewed. Do not delete or overwrite extra Drive files without review.

## Complete backup procedure
1. Download the frozen snapshot ZIP from GitHub: `https://github.com/bluetallitot-hub/cti-website/archive/49022bdf5a85c96a47c2f031a9c0acc7df81e82f.zip`.
2. Upload the **unchanged ZIP** to the CTI website backup folder in Google Drive, using a name identifying the commit. Retain the ZIP as an immutable recovery copy.
3. Record its Drive file ID, byte count, and SHA-256 checksum. Verify by downloading from Drive and recalculating the checksum; compare against the original ZIP checksum. An extracted directory alone is not sufficient without full-path and hash verification.
4. For a browseable mirror, extract the ZIP while retaining directory paths, then compare all 181 paths, sizes, and preferably SHA-256 file hashes. Git blob SHAs in the CSV are Git object hashes, **not** direct file SHA-256 hashes.
5. Keep Drive-only archival materials in a separate preservation area; do not remove them during reconciliation.

## Restore after a broken rename
To restore **all** site files to the checkpoint (destructive to changes since checkpoint), use GitHub's branch restore workflow with a reviewed pull request, or locally:
```sh
git fetch origin
git switch main
git switch -c restore/pre-reorganization
git restore --source=origin/backup/pre-reorganization-2026-10-15 --staged --worktree .
git commit -m "Restore CTI website to pre-reorganization snapshot"
git push -u origin restore/pre-reorganization
```
Then open and review a pull request from `restore/pre-reorganization` into `main`. **Note:** `git restore` alone does not delete newly added files; remove unwanted post-checkpoint additions only after review.

For one broken path, restore just that file:
```sh
git restore --source=origin/backup/pre-reorganization-2026-10-15 -- path/to/file
```
Review references and GitHub Pages deployment after restoring.

## Safe migration rules
Do not start renaming until Drive backup is independently verified. Move files in small batches; update all references, test pages, and commit each batch separately. Never discard original archival scans or Drive-only items solely because they differ from GitHub.
