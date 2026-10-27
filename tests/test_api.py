#!/usr/bin/env python3
"""Read-only production API smoke checks. Never creates subscriptions or sends email."""
import json
import sys
import urllib.error
import urllib.request

ROOT = "https://cti-admin-api.bluetallitot.workers.dev"
failures = []

def get(path):
    req = urllib.request.Request(ROOT + path, headers={"User-Agent": "CTI-api-smoke/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.status, response.read(20000)
    except urllib.error.HTTPError as error:
        return error.code, error.read(20000)
    except Exception as error:
        failures.append(f"{path}: request error: {error}")
        return 0, b""

status, body = get("/health")
try:
    payload = json.loads(body)
except (ValueError, UnicodeDecodeError):
    payload = {}
if status != 200 or payload.get("ok") is not True:
    failures.append(f"/health: expected 200 and ok=true; got {status}")
print(f"/health: {status}")

status, body = get("/session")
if status not in (401, 403):
    failures.append(f"/session: expected unauthorized 401/403; got {status}")
print(f"/session without credentials: {status}")

for problem in failures:
    print("FAIL " + problem)
print(f"CTI API smoke audit: {len(failures)} issue(s)")
sys.exit(bool(failures))
