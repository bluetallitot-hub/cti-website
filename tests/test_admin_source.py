#!/usr/bin/env python3
"""Read-only source checks for CTI administration access gates."""
import pathlib
import re
import sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
PAGES = {
    "admin/index.html": None,
    "admin/schedule.html": None,
    "admin/events.html": None,
    "admin/email.html": None,
    "admin/mailing-list.html": None,
    "admin/leadership.html": None,
    "admin/torah-studio.html": "admin/torah-publisher.js",
    "admin/meldados-add.html": "admin/meldados-add.js",
    "admin/meldatho-notifications.html": None,
}
failures = []
for page, companion in PAGES.items():
    try:
        html = (ROOT / page).read_text(encoding="utf-8")
        js = (ROOT / companion).read_text(encoding="utf-8") if companion else ""
    except OSError as exc:
        failures.append(f"{page}: missing source: {exc}")
        continue
    if not re.search(r'<script[^>]+src=["\']cti-auth\.js(?:\?[^"\']*)?["\']', html):
        failures.append(f"{page}: missing shared authentication script")
    if "CTIAuth.requireRole(true)" not in html + js:
        failures.append(f"{page}: missing administrator session guard")
    print(f"CHECK {page}: {'companion script ' + companion if companion else 'inline guard'}")
print(f"Admin source audit: {len(PAGES)} pages checked, {len(failures)} issue(s)")
for issue in failures:
    print("FAIL " + issue)
sys.exit(1 if failures else 0)
