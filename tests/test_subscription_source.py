#!/usr/bin/env python3
"""Read-only consistency audit for CTI public subscription workflows."""
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
worker = (root / "cloudflare/cti-admin-api.js").read_text()
confirm = (root / "assets/subscribe-confirm.js").read_text()
torah = (root / "assets/subscribe-torah.js").read_text()
newsletter = (root / "subscribe-newsletter.html").read_text()
torah_page = (root / "subscribe-torah.html").read_text()
issues = []
for kind, page, source in (("torah", torah_page, torah), ("newsletter", newsletter, newsletter)):
    if "/subscriptions/request" not in source:
        issues.append(kind + ": form is not connected to Worker")
    if "kind:'" + kind + "'" not in source:
        issues.append(kind + ": missing list selection")
    if "assets/subscribe-confirm.js" not in page:
        issues.append(kind + ": missing confirmation handler")
    if "id=\"subscribe-form\"" not in page or "id=\"status\"" not in page:
        issues.append(kind + ": missing form/status elements")
for endpoint in ("/subscriptions/request", "/subscriptions/confirm"):
    if endpoint not in worker:
        issues.append("Worker missing " + endpoint)
if "/subscriptions/confirm" not in confirm:
    issues.append("Confirmation handler missing Worker endpoint")
if "const ALLOWED_ORIGIN=new URL(ORIGIN).origin" not in worker:
    issues.append("Worker CORS must compare browser origin without site path")
if "origin!==ALLOWED_ORIGIN" not in worker:
    issues.append("Worker origin check does not use normalized origin")
if "const enabled=false" not in worker:
    issues.append("Bulk email safety lock unexpectedly changed")
if "await store.delete('unsubscribed:'+pending.email)" in worker:
    issues.append("Confirmation bypasses global unsubscribe")
unsubscribe = worker.split("if(url.pathname==='/unsubscribe/request'", 1)[-1].split("if(url.pathname==='/mailing-list'", 1)[0]
if "['congregation','torah']" not in unsubscribe:
    issues.append('Unsubscribe request must check both email lists')
if "await env.CTI_MAILING_LISTS.put('unsubscribed:'+email" not in unsubscribe:
    issues.append('Unsubscribe confirmation must persist global suppression')
for issue in issues:
    print("FAIL " + issue)
print(f"CTI subscription source audit: {len(issues)} issue(s)")
sys.exit(bool(issues))
