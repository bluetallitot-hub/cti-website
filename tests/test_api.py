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


# Real browser preflight: does not create a subscription or send mail.
origin = "https://bluetallitot-hub.github.io"
preflight = urllib.request.Request(
    ROOT + "/subscriptions/request",
    method="OPTIONS",
    headers={
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    },
)
try:
    with urllib.request.urlopen(preflight, timeout=15) as response:
        code = response.status
        allowed_origin = response.headers.get("Access-Control-Allow-Origin")
        methods = response.headers.get("Access-Control-Allow-Methods", "")
        allowed_headers = response.headers.get("Access-Control-Allow-Headers", "")
        if code != 204 or allowed_origin != origin or "POST" not in methods or "content-type" not in allowed_headers.lower():
            failures.append(f"Subscription CORS preflight: status={code}, origin={allowed_origin!r}, methods={methods!r}, headers={allowed_headers!r}")
        print(f"Subscription browser CORS preflight: {code}, origin={allowed_origin}")
except Exception as error:
    failures.append(f"Subscription browser CORS preflight failed: {error}")

# Invalid request is intentionally rejected before any KV write or email send.
invalid = urllib.request.Request(
    ROOT + "/subscriptions/request",
    data=json.dumps({"kind": "torah", "name": "", "email": "invalid", "consent": False}).encode(),
    method="POST",
    headers={"Origin": origin, "Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(invalid, timeout=15) as response:
        code = response.status
        allowed_origin = response.headers.get("Access-Control-Allow-Origin")
except urllib.error.HTTPError as error:
    code = error.code
    allowed_origin = error.headers.get("Access-Control-Allow-Origin")
except Exception as error:
    code, allowed_origin = 0, None
    failures.append(f"Invalid subscription request could not be tested: {error}")
if code != 400 or allowed_origin != origin:
    failures.append(f"Invalid subscription request: expected HTTP 400 with browser CORS, got {code}, origin={allowed_origin!r}")
print(f"Invalid subscription rejected: {code}, origin={allowed_origin}")

for problem in failures:
    print("FAIL " + problem)
print(f"CTI API smoke audit: {len(failures)} issue(s)")
sys.exit(bool(failures))
