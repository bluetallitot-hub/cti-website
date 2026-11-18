#!/usr/bin/env python3
"""Private CTI photo collector. Never publishes images to the public website."""
import hashlib, ipaddress, json, os, re, socket, sys, time
from datetime import datetime, timezone
from urllib.parse import urlparse
import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaInMemoryUpload

SHEET_ID = "1ve2v3XZQDXR7vWYFf-DAnciSQ9OhYofdjHbYjpXbv00"
FOLDER_ID = "14XQDDeJW_3W_qXYiVPovwLff-e_FnJqA"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
MAX_BYTES = 15 * 1024 * 1024
MAX_FILES = 12
HEADERS = {"User-Agent": "CTI-private-memorial-photo-collector/1.0 (contact CTI website administrator)"}
# Public web URLs only. Private addresses and redirects to private hosts are blocked.
def safe_url(url):
    p = urlparse(url)
    if p.scheme != "https" or not p.hostname or p.username or p.password:
        return False
    if p.hostname.lower() in ("localhost",) or p.hostname.lower().endswith((".local", ".internal")):
        return False
    try:
        for item in socket.getaddrinfo(p.hostname, 443, type=socket.SOCK_STREAM):
            if not ipaddress.ip_address(item[4][0]).is_global:
                return False
    except OSError:
        return False
    return True

def download(url):
    if not safe_url(url):
        raise ValueError("unsafe or unresolvable URL")
    session = requests.Session()
    session.trust_env = False
    for _ in range(4):
        with session.get(url, headers=HEADERS, timeout=(10, 25), stream=True, allow_redirects=False) as r:
            if r.status_code in (301, 302, 303, 307, 308):
                from urllib.parse import urljoin
                url = urljoin(url, r.headers.get("Location", ""))
                if not safe_url(url):
                    raise ValueError("unsafe redirect")
                continue
            r.raise_for_status()
            ctype = r.headers.get("Content-Type", "").split(";")[0].strip().lower()
            if ctype not in ("image/jpeg", "image/png", "image/webp", "image/gif"):
                raise ValueError("not a supported original image: " + ctype)
            data = bytearray()
            for chunk in r.iter_content(65536):
                data.extend(chunk)
                if len(data) > MAX_BYTES:
                    raise ValueError("image exceeds 15 MB")
            if len(data) < 100 or not signature(bytes(data), ctype):
                raise ValueError("invalid image signature")
            return bytes(data), ctype, url
    raise ValueError("too many redirects")

def signature(data, mime):
    return (mime == "image/jpeg" and data.startswith(b"\\xff\\xd8\\xff")) or (mime == "image/png" and data.startswith(b"\\x89PNG\\r\\n\\x1a\\n")) or (mime == "image/gif" and data[:6] in (b"GIF87a", b"GIF89a")) or (mime == "image/webp" and data[:4] == b"RIFF" and data[8:12] == b"WEBP")

def main():
    creds = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
    auth = service_account.Credentials.from_service_account_info(creds, scopes=SCOPES)
    sheets = build("sheets", "v4", credentials=auth, cache_discovery=False)
    drive = build("drive", "v3", credentials=auth, cache_discovery=False)
    values = sheets.spreadsheets().values().get(spreadsheetId=SHEET_ID, range="'Obituary Research'!A1:Z400").execute().get("values", [])
    if not values or values[0][0] != "Meldatho ID":
        raise RuntimeError("Unexpected sheet schema")
    folder = drive.files().list(q=f"'{FOLDER_ID}' in parents and trashed = false",fields="nextPageToken,files(id,name,description)",page_size=1000).execute()
    existing = folder.get("files", [])
    known = {f.get("name") for f in existing}
    seen_urls = set()
    for f in existing:
        try:
            seen_urls.add(json.loads(f.get("description") or "{}").get("source_url"))
        except ValueError:
            pass
    dry_run = os.getenv("COLLECTOR_WRITE", "false").lower() != "true"
    reviewed = saved = 0
    results = []
    # Column O contains leads, W and X track identity and storage.
    for rowno, row in enumerate(values[1:], start=2):
        if saved >= MAX_FILES:
            break
        row = row + [""] * (26 - len(row))
        memorial_id, name, leads, identity, stored = row[0], row[1], row[14], row[22], row[23]
        # Only explicitly reviewed image links. Do not collect unverified obituary-page images.
        if not leads or not ("verified" in identity.lower() or "caption" in identity.lower()):
            continue
        for url in re.findall(r"https://[^\\s<>]+", leads):
            url = url.rstrip("),.;")
            if url in seen_urls or not re.search(r"\\.(jpg|jpeg|png|webp|gif)(?:[?#]|$)", url, re.I):
                continue
            reviewed += 1
            try:
                data, mime, final_url = download(url)
                digest = hashlib.sha256(data).hexdigest()
                ext = {"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"}[mime]
                clean = re.sub(r"[^a-zA-Z0-9_-]+", "-", memorial_id)[:90]
                filename = f"{clean}__PENDING-{digest[:16]}.{ext}"
                if filename in known:
                    results.append(f"SKIP already stored: {name} {filename}")
                    continue
                if dry_run:
                    results.append(f"DRY RUN: {name} {filename} {len(data)} bytes")
                    continue
                description = json.dumps({"source_url":url,"final_url":final_url,"sha256":digest,"memorial_id":memorial_id,"identity_status":identity,"rights":"NOT CLEARED — private review only","collected_utc":datetime.now(timezone.utc).isoformat()})
                media = MediaInMemoryUpload(data,mimetype=mime,resumable=False)
                file = drive.files().create(body={"name":filename,"parents":[FOLDER_ID],"description":description},media_body=media,fields="id,name,parents,size").execute()
                if FOLDER_ID not in file.get("parents", []) or int(file.get("size", -1)) != len(data):
                    raise RuntimeError("upload metadata verification failed")
                note = f"PRIVATE PENDING | {filename} | https://drive.google.com/file/d/{file['id']}/view | SHA256 {digest} | {url} | rights NOT CLEARED"
                # Append to X and Z, preserving previous data. Never alter website/public database.
                sheets.spreadsheets().values().batchUpdate(spreadsheetId=SHEET_ID,body={"valueInputOption":"RAW","data":[{"range":f"'Obituary Research'!X{rowno}","values":[[(stored+"\\n"+note).strip()]]},{"range":f"'Obituary Research'!Z{rowno}","values":[[(row[25]+"\\n"+note).strip()]]}]}).execute()
                check = sheets.spreadsheets().values().get(spreadsheetId=SHEET_ID,range=f"'Obituary Research'!Z{rowno}").execute().get("values",[])
                if not check or filename not in check[0][0]:
                    raise RuntimeError("tracker readback failed")
                known.add(filename); seen_urls.add(url); saved += 1
                results.append(f"SAVED: {name} {filename}")
            except Exception as exc:
                results.append(f"UNSAVED: {name} {url} — {str(exc)[:180]}")
    report = {"dry_run":dry_run,"reviewed_direct_urls":reviewed,"new_files_saved":saved,"existing_folder_files":len(existing),"results":results}
    print(json.dumps({k:v for k,v in report.items() if k != "results"},indent=2))
    with open(os.environ.get("GITHUB_STEP_SUMMARY", "/tmp/cti-photo-summary.txt"),"a") as out:
        out.write(f"## CTI private photo collector\\n\\nReviewed URLs: {reviewed}; new private files: {saved}; dry run: {dry_run}. Individual names and URLs are intentionally omitted from public Actions logs.\\n")

if __name__ == "__main__":
    main()
