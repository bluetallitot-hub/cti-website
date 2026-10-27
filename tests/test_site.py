#!/usr/bin/env python3
"""Read-only CTI public website regression crawl; excludes historical work in progress."""
import csv
import json
import sys
import urllib.error
import urllib.request
from collections import deque
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urldefrag

BASE = "https://bluetallitot-hub.github.io/cti-website/"
MAX_PAGES = 150
EXCLUDED_NAMES = ("history", "gallery", "archive", "timeline", "meldados")
EXCLUDED_PATHS = ("admin/",)
class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        for attr in ("href", "src"):
            if attributes.get(attr):
                self.refs.append((tag, attr, attributes[attr]))

def excluded(url):
    relative = urlsplit(url).path.removeprefix(urlsplit(BASE).path).lower()
    return relative.startswith(EXCLUDED_PATHS) or any(
        term in relative.split("/")[-1] for term in EXCLUDED_NAMES
    )

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "CTI-regression/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.status, response.headers.get("Content-Type", ""), response.read(4_000_000), ""
    except urllib.error.HTTPError as error:
        return error.code, "", b"", str(error)
    except Exception as error:
        return 0, "", b"", str(error)

def main():
    queue = deque([BASE])
    visited = set()
    checked = {}
    rows = []
    while queue and len(visited) < MAX_PAGES:
        page = queue.popleft()
        if page in visited or excluded(page):
            continue
        visited.add(page)
        status, content_type, body, error = fetch(page)
        rows.append({"source": "PAGE", "url": page, "status": status,
                     "result": "PASS" if 200 <= status < 400 else "FAIL", "detail": error})
        if status != 200 or "html" not in content_type:
            continue
        parser = References()
        parser.feed(body.decode("utf-8", "replace"))
        for tag, attr, raw in parser.refs:
            if raw.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
                continue
            url = urldefrag(urljoin(page, raw))[0]
            if not url.startswith(BASE) or excluded(url):
                continue
            if url not in checked:
                code, kind, data, detail = fetch(url)
                result = "PASS" if 200 <= code < 400 else "FAIL"
                if result == "PASS" and ("json" in kind or urlsplit(url).path.endswith(".json")):
                    try:
                        json.loads(data)
                    except Exception as exc:
                        result, detail = "FAIL", "Invalid JSON: " + str(exc)
                checked[url] = (code, result, detail)
                rows.append({"source": page, "url": url, "status": code,
                             "result": result, "detail": detail})
            path = urlsplit(url).path.lower()
            if (path.endswith(".html") or path.endswith("/")) and url not in visited and url not in queue:
                queue.append(url)
    with open("cti-test-results.json", "w", encoding="utf-8") as output:
        json.dump({"base": BASE, "pages_visited": len(visited), "checks": rows}, output, indent=2)
    with open("cti-test-results.csv", "w", newline="", encoding="utf-8") as output:
        writer = csv.DictWriter(output, fieldnames=["source", "url", "status", "result", "detail"])
        writer.writeheader()
        writer.writerows(rows)
    failures = [row for row in rows if row["result"] == "FAIL"]
    print(f"Checked {len(rows)} URLs/references across {len(visited)} pages; failures: {len(failures)}")
    for row in failures:
        print(f"FAIL {row['status']} {row['url']} ({row['source']}): {row['detail']}")
    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())
