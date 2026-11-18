#!/usr/bin/env python3
"""Collect rights-cleared CTI memorial photographs into the existing public repository.

This repository is PUBLIC. Never place unverified, restricted, or private
contact information in the manifest or in repository files.
"""
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import socket
from urllib.parse import urljoin, urlparse

import requests

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "content" / "photo-collector-manifest.json"
OUTPUT = ROOT / "assets" / "meldados" / "collected"
MAX_BYTES = 15 * 1024 * 1024
MIMES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
HEADERS = {"User-Agent": "CTI-Memorial-Photo-Collector/1.0"}

def public_https(url):
    p = urlparse(url)
    if p.scheme != "https" or not p.hostname or p.username or p.password:
        raise ValueError("URL must be public HTTPS")
    if p.hostname.lower() == "localhost" or p.hostname.lower().endswith((".local", ".internal")):
        raise ValueError("private hostname")
    for entry in socket.getaddrinfo(p.hostname, 443, type=socket.SOCK_STREAM):
        if not ipaddress.ip_address(entry[4][0]).is_global:
            raise ValueError("non-public IP address")

def get_image(url):
    session = requests.Session()
    session.trust_env = False
    for _ in range(5):
        public_https(url)
        with session.get(url, headers=HEADERS, timeout=(10, 35), stream=True, allow_redirects=False) as response:
            if response.status_code in (301, 302, 303, 307, 308):
                url = urljoin(url, response.headers.get("Location", ""))
                continue
            response.raise_for_status()
            mime = response.headers.get("Content-Type", "").split(";")[0].lower().strip()
            if mime not in MIMES:
                raise ValueError("not a supported original image")
            buf = bytearray()
            for chunk in response.iter_content(65536):
                buf.extend(chunk)
                if len(buf) > MAX_BYTES:
                    raise ValueError("file exceeds 15 MB")
            data = bytes(buf)
            signatures = {
                "image/jpeg": data.startswith(bytes.fromhex("ffd8ff")),
                "image/png": data.startswith(bytes.fromhex("89504e470d0a1a0a")),
                "image/webp": data.startswith(b"RIFF") and data[8:12] == b"WEBP",
            }
            if not signatures[mime]:
                raise ValueError("invalid image signature")
            return data, mime, url
    raise ValueError("too many redirects")

def main():
    manifest = json.loads(MANIFEST.read_text())
    if manifest.get("schema_version") != 1:
        raise ValueError("unsupported manifest version")
    dry_run = os.getenv("COLLECTOR_WRITE", "false").lower() != "true"
    results = []
    for item in manifest.get("images", [])[:30]:
        memorial_id = item["memorial_id"]
        if not re.fullmatch(r"[a-zA-Z0-9_-]{3,110}", memorial_id):
            raise ValueError("invalid memorial ID")
        if item.get("identity_status") != "verified" or item.get("publication_rights") != "cleared":
            results.append("SKIPPED: identity or publication rights not cleared")
            continue
        url = item["original_image_url"]
        try:
            data, mime, final_url = get_image(url)
            digest = hashlib.sha256(data).hexdigest()
            path = OUTPUT / (memorial_id + "__" + digest[:16] + "." + MIMES[mime])
            if path.exists():
                results.append("EXISTS: " + path.name)
                continue
            if dry_run:
                results.append("DRY RUN: " + path.name + " (" + str(len(data)) + " bytes)")
                continue
            OUTPUT.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
                raise RuntimeError("file verification failed")
            results.append("SAVED: " + path.name)
        except Exception as exc:
            results.append("UNSAVED: " + memorial_id + " (" + str(exc)[:120] + ")")
    summary = {"dry_run": dry_run, "manifest_entries": len(manifest.get("images", [])), "results": results}
    print(json.dumps(summary, indent=2))
    if os.getenv("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as output:
            output.write("## CTI public-safe photo collector\\n\\n")
            output.write("Mode: " + ("dry run" if dry_run else "write") + "\\n\\n")
            output.write("\\n".join("- " + r for r in results) + "\\n")

if __name__ == "__main__":
    main()
