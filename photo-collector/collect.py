#!/usr/bin/env python3
"""Private CTI photo collector. No website publishing, no image transformations."""
import argparse
import datetime as dt
import hashlib
import io
import json
import os
import re
import socket
import sys
from urllib.parse import urlparse

import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2 import service_account
import requests
from PIL import Image, UnidentifiedImageError

SHEET_ID = "1ve2v3XZQDXR7vWYFf-DAnciSQ9OhYofdjHbYjpXbv00"
FOLDER_ID = "14XQDDeJW_3W_qXYiVPovwLff-e_FnJqA"
SCOPES = ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"]
URL_RE = re.compile(r"https?://[^\\s<>\\\"']+")
EXT = {"JPEG": ".jpg", "PNG": ".png", "GIF": ".gif", "WEBP": ".webp", "TIFF": ".tif", "BMP": ".bmp"}
MIME = {"JPEG": "image/jpeg", "PNG": "image/png", "GIF": "image/gif", "WEBP": "image/webp", "TIFF": "image/tiff", "BMP": "image/bmp"}
MAX_BYTES = 40 * 1024 * 1024

def credentials():
    raw = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    if raw:
        return service_account.Credentials.from_service_account_info(json.loads(raw), scopes=SCOPES)
    return google.auth.default(scopes=SCOPES)[0]

def is_public_image_url(url):
    p = urlparse(url)
    if p.scheme != "https" or not p.hostname or p.username or p.password:
        return False
    if p.hostname.lower() in ("localhost", "127.0.0.1") or p.hostname.lower().endswith((".local", ".internal")):
        return False
    # Never fetch Drive documents or GitHub HTML as if they were original images.
    if p.hostname.lower() in ("drive.google.com", "docs.google.com", "github.com"):
        return False
    return True

def download(url):
    # URL originates in a private sheet; reject local/private network destinations and redirects.
    from ipaddress import ip_address
    from urllib.parse import urljoin
    session = requests.Session()
    session.trust_env = False
    current = url
    for _ in range(6):
        if not is_public_image_url(current):
            raise ValueError("not an eligible public HTTPS image URL")
        host = urlparse(current).hostname
        addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        if not addresses or any(not ip_address(a[4][0]).is_global for a in addresses):
            raise ValueError("host resolves to a non-public address")
        # requests performs its own DNS resolution; this guard is best-effort, not a hardened SSRF boundary.
        with session.get(current, timeout=(8, 25), stream=True, allow_redirects=False,
                         headers={"User-Agent": "CTI-Private-Photo-Collector/1.0"}) as resp:
            if resp.status_code in (301, 302, 303, 307, 308):
                current = urljoin(current, resp.headers.get("Location", ""))
                continue
            resp.raise_for_status()
            data = bytearray()
            for chunk in resp.iter_content(65536):
                data.extend(chunk)
                if len(data) > MAX_BYTES:
                    raise ValueError("image exceeds 40 MiB limit")
            with Image.open(io.BytesIO(data)) as im:
                fmt = im.format
                dimensions = im.size
                im.verify()
            if fmt not in EXT or dimensions[0] < 200 or dimensions[1] < 200:
                raise ValueError("unsupported format or too small to verify as original")
            return bytes(data), fmt, dimensions, current
    raise ValueError("too many redirects")

def list_pending(drive):
    found = []
    token = None
    while True:
        result = drive.files().list(q=f"'{FOLDER_ID}' in parents and trashed = false",
            fields="nextPageToken,files(id,name,mimeType,size,md5Checksum,webViewLink,description)",
            page_size=1000, page_token=token).execute()
        found.extend(result.get("files", []))
        token = result.get("nextPageToken")
        if not token:
            return found

def rows_for_sheet(sheets):
    return sheets.spreadsheets().values().get(spreadsheetId=SHEET_ID,
        range="'Obituary Research'!A1:Z1000").execute().get("values", [])

def cell(row, index):
    return str(row[index]) if len(row) > index and row[index] is not None else ""

def append_log(sheets, entries):
    if not entries:
        return
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    values = [[stamp, *item] for item in entries]
    sheets.spreadsheets().values().append(spreadsheetId=SHEET_ID,
        range="'Photo Collection Log'!A:D", valueInputOption="RAW",
        insertDataOption="INSERT_ROWS", body={"values": values}).execute()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true", help="Enable writes; default is read-only dry run")
    parser.add_argument("--approvals", default="photo-collector/approved-sources.json")
    args = parser.parse_args()
    with open(args.approvals, encoding="utf-8") as f:
        approvals = json.load(f)
    # Approval entries are exact source URLs, with rights evidence and permitted use.
    allowed = {a["url"]: a for a in approvals.get("sources", [])
               if a.get("private_collection_approved") is True and a.get("rights_evidence")}
    creds = credentials()
    drive = build("drive", "v3", credentials=creds, cache_discovery=False)
    sheets = build("sheets", "v4", credentials=creds, cache_discovery=False)
    pending = list_pending(drive)
    rows = rows_for_sheet(sheets)
    existing_names = {f["name"] for f in pending}
    existing_md5 = {f.get("md5Checksum") for f in pending if f.get("md5Checksum")}
    existing_urls = set()
    for f in pending:
        desc = f.get("description", "")
        existing_urls.update(URL_RE.findall(desc))
    for row in rows[1:]:
        # Z may include previously verified file provenance; do not treat a candidate URL as saved.
        provenance = cell(row, 25)
        if "drive.google.com/file/d/" in provenance:
            existing_urls.update(URL_RE.findall(provenance))
    seen = set()
    log = []
    counts = {"pending_existing": len(pending), "urls_inspected": 0, "saved": 0,
              "already_stored": 0, "blocked": 0, "needs_review": 0}
    updates = []
    for row_no, row in enumerate(rows[1:], 2):
        candidate = cell(row, 14)
        for url in URL_RE.findall(candidate):
            url = url.rstrip(".,);")
            if url in seen:
                continue
            seen.add(url)
            counts["urls_inspected"] += 1
            name = cell(row, 1)
            status = cell(row, 23)
            if url in existing_urls or ("saved privately" in status.lower() and "drive.google.com" in candidate):
                counts["already_stored"] += 1
                log.append([str(row_no), url, "ALREADY STORED / verify existing provenance"])
                continue
            if not is_public_image_url(url):
                counts["needs_review"] += 1
                log.append([str(row_no), url, "NEEDS REVIEW — page or Drive link, not original image URL"])
                continue
            if url not in allowed:
                counts["blocked"] += 1
                log.append([str(row_no), url, "RIGHTS RESTRICTED — no explicit private-collection approval"])
                continue
            try:
                data, fmt, dims, final_url = download(url)
                digest = hashlib.md5(data).hexdigest()
                sha = hashlib.sha256(data).hexdigest()
                filename = "cti-pending-" + sha[:20] + EXT[fmt]
                if filename in existing_names or digest in existing_md5:
                    counts["already_stored"] += 1
                    log.append([str(row_no), url, "ALREADY STORED — filename or byte checksum"])
                    continue
                if not args.execute:
                    log.append([str(row_no), url, f"DRY RUN — verified {fmt} {dims[0]}x{dims[1]}, {len(data)} bytes"])
                    continue
                description = json.dumps({"source_url": url, "resolved_url": final_url,
                    "source_row": row_no, "sha256": sha, "rights_evidence": allowed[url]["rights_evidence"]})
                media = MediaIoBaseUpload(io.BytesIO(data), mimetype=MIME[fmt], resumable=True)
                result = drive.files().create(body={"name": filename, "parents": [FOLDER_ID],
                    "description": description}, media_body=media,
                    fields="id,name,size,mimeType,md5Checksum,webViewLink,parents").execute()
                check = drive.files().get(fileId=result["id"],
                    fields="id,name,size,mimeType,md5Checksum,webViewLink,parents").execute()
                if (check.get("md5Checksum") != digest or int(check.get("size", 0)) != len(data)
                        or FOLDER_ID not in check.get("parents", [])):
                    raise RuntimeError("Drive upload readback mismatch; manual review required")
                link = check.get("webViewLink") or "https://drive.google.com/file/d/" + check["id"] + "/view"
                # Only update storage status (X) and append to existing provenance (Z).
                # Do not alter candidate, rights, identity, or research-history fields.
                updates.extend([
                    {"range": f"'Obituary Research'!X{row_no}",
                     "values": [[f"SAVED — original {fmt} {dims[0]}x{dims[1]}; {len(data)} bytes; SHA256 {sha}"]]},
                    {"range": f"'Obituary Research'!Z{row_no}",
                     "values": [[(cell(row,25) + "\\n" if cell(row,25) else "") +
                       f"{filename} | {link} | original source: {url} | SHA256: {sha}"]]}
                ])
                counts["saved"] += 1
                existing_names.add(filename)
                existing_md5.add(digest)
                log.append([str(row_no), url, f"SAVED — {filename} — {link}"])
            except Exception as exc:
                counts["blocked"] += 1
                log.append([str(row_no), url, f"UNSAVED / TOOL LIMITATION — {type(exc).__name__}: {str(exc)[:180]}"])
    if args.execute:
        if updates:
            sheets.spreadsheets().values().batchUpdate(spreadsheetId=SHEET_ID,
                body={"valueInputOption": "RAW", "data": updates}).execute()
            readback = rows_for_sheet(sheets)
            for change in updates:
                match = re.search(r"!([XZ])(\\d+)$", change["range"])
                col, row_no = match.group(1), int(match.group(2))
                idx = 23 if col == "X" else 25
                if cell(readback[row_no-1], idx) != change["values"][0][0]:
                    raise RuntimeError(f"Tracker readback mismatch at {col}{row_no}")
        # The log tab must be created once during setup. Never overwrite an existing log.
        append_log(sheets, log)
    print(json.dumps({"mode": "execute" if args.execute else "dry-run", "counts": counts,
                      "entries": log}, indent=2))

if __name__ == "__main__":
    main()
