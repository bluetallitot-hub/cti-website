#!/usr/bin/env python3
"""Read-only CTI launch data checks; excludes historical/Meldados databases."""
import datetime
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
issues = []
def check_file(name, key):
    path = ROOT / name
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        issues.append(f"{name}: unreadable/invalid JSON: {exc}")
        return []
    if not isinstance(data, dict) or not isinstance(data.get(key), list):
        issues.append(f"{name}: expected array '{key}'")
        return []
    return data[key]

def check_date(value, context):
    if not isinstance(value, str) or not re.fullmatch(r"20\d{2}-\d{2}-\d{2}", value):
        issues.append(f"{context}: invalid date {value!r}")
        return
    try:
        datetime.date.fromisoformat(value)
    except ValueError:
        issues.append(f"{context}: impossible date {value!r}")

for kind, filename, key in (
    ("service", "content/services.json", "services"),
    ("event", "content/events.json", "events"),
):
    seen = set()
    for index, record in enumerate(check_file(filename, key)):
        context = f"{filename}[{index}]"
        if not isinstance(record, dict):
            issues.append(f"{context}: expected object")
            continue
        check_date(record.get("date"), context)
        if kind == "event":
            identifier = record.get("id")
            if not identifier or identifier in seen:
                issues.append(f"{context}: missing/duplicate event ID {identifier!r}")
            seen.add(identifier)
            title = str(record.get("title", ""))
            if re.search(r"\bTEST ONLY\b|\bAdmin Test\b", title, re.I):
                issues.append(f"{context}: test event in production data: {title!r}")

torah = check_file("content/dvar-torah/index.json", "items")
for index, record in enumerate(torah):
    if not isinstance(record, dict):
        issues.append(f"content/dvar-torah/index.json[{index}]: expected object")
    elif record.get("date"):
        check_date(record["date"], f"content/dvar-torah/index.json[{index}]")

print(f"CTI content audit: {len(issues)} issue(s)")
for issue in issues:
    print("FAIL " + issue)
sys.exit(1 if issues else 0)
