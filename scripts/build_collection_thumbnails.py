#!/usr/bin/env python3
"""Build standardized CTI collection thumbnails from existing tracked images.

Preserves source images; updates only thumbnailImage and its version manifest.
"""
from pathlib import Path
from io import BytesIO
import json
from PIL import Image, ImageOps, ImageFilter, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "content/collection-records.json"
OUT = ROOT / "assets/collections"
OUT.mkdir(parents=True, exist_ok=True)
data = json.loads(DB.read_text(encoding="utf-8"))
results = []
for record in data["items"]:
    rid = record["id"]
    source = record.get("indexImage") or record.get("archiveImage")
    if not source:
        results.append({"id": rid, "status": "no-index-image"})
        continue
    src = ROOT / source
    if not src.is_file():
        results.append({"id": rid, "status": "source-not-found", "source": source})
        continue
    target = OUT / f"{rid}-THM-1.png"
    try:
        with Image.open(src) as opened:
            im = ImageOps.exif_transpose(opened).convert("RGB")
        # Keep the entire index picture visible. Use a softly blurred,
        # neutralized background instead of cropping archival details.
        backdrop = ImageOps.fit(im, (800, 600), method=Image.Resampling.LANCZOS)
        backdrop = ImageEnhance.Color(backdrop).enhance(0.35)
        backdrop = backdrop.filter(ImageFilter.GaussianBlur(28))
        backdrop = Image.blend(backdrop, Image.new("RGB", (800, 600), (226, 224, 219)), 0.58)
        foreground = ImageOps.contain(im, (800, 600), method=Image.Resampling.LANCZOS)
        backdrop.paste(foreground, ((800-foreground.width)//2, (600-foreground.height)//2))
        backdrop.save(target, "PNG", optimize=True)
        rel = target.relative_to(ROOT).as_posix()
        record["thumbnailImage"] = rel
        versions = record.setdefault("imageVersions", [])
        if not any(v.get("path") == rel for v in versions if isinstance(v, dict)):
            versions.append({"type": "THM", "version": 1, "path": rel, "derivedFrom": source, "method": "full-image contain with softened background"})
        results.append({"id": rid, "status": "generated", "source": source, "thumbnail": rel})
    except Exception as exc:
        results.append({"id": rid, "status": "error", "source": source, "message": str(exc)})
DB.write_text(json.dumps(data, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
(ROOT / "content/thumbnail-build-manifest.json").write_text(json.dumps({"items":results}, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
print(json.dumps({"generated":sum(x["status"]=="generated" for x in results),"skipped":[x for x in results if x["status"]!="generated"]},indent=2))
