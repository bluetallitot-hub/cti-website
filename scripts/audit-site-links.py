#!/usr/bin/env python3
"""Phase 3: audit local site links, media and structured archive references.

Runs without network access; keeps legacy archives intact until verified.
"""
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

root = Path(__file__).resolve().parent.parent
issues = []
checked = 0
pages = sorted(root.rglob("*.html"))
skip_dirs = {".git", "node_modules", "backup-audit", "assets/possible-duplicates"}

def inspect(target, source, field, base=None):
    global checked
    if not target or target.startswith(("#", "mailto:", "tel:", "data:", "javascript:", "//")):
        return
    parsed = urlsplit(target)
    if parsed.scheme or parsed.netloc:
        return
    rel = unquote(parsed.path)
    if not rel:
        return
    if base and rel == "../":\n        return  # HTML <base href="../"> is a valid base declaration, not a resource\n    checked += 1\n    if rel.startswith("/"):
        candidate = root / rel.lstrip("/")
    elif base:
        candidate = root / rel
    else:
        candidate = source.parent / rel
    resolved = candidate.resolve()
    if not resolved.is_relative_to(root.resolve()) or not resolved.exists():
        issues.append({"source": str(source.relative_to(root)), "field": field, "target": target})

for page in pages:
    if any(str(page.relative_to(root)).startswith(p) for p in skip_dirs):
        continue
    html = page.read_text(encoding="utf-8")
    base_match = re.search(r'<base\s+href=["\']([^"\']+)["\']', html, re.I)
    base = base_match and base_match.group(1) == "../"
    for match in re.finditer(r'\b(?:src|href)=["\']([^"\']+)["\']', html, re.I):
        inspect(match.group(1), page, "html", base=base)

for name in ("content/gallery.json", "content/archives/index.json", "content/biography-directory.json"):
    path = root / name
    if not path.is_file():
        continue
    data = json.loads(path.read_text(encoding="utf-8"))
    def walk(node):
        if isinstance(node, dict):
            for k, v in node.items():
                if isinstance(v, str) and (v.startswith("assets/") or v.startswith("content/")):
                    inspect(v, path, k, base=True)
                else:
                    walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)
    walk(data)

report = {"html_pages": len(pages), "local_references_checked": checked, "missing_references": issues}
print(json.dumps(report, indent=2))
sys.exit(1 if issues else 0)
