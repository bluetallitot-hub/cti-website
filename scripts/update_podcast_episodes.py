#!/usr/bin/env python3
"""Refresh the public Blue Thread episode catalog from its canonical RSS feed."""
import json
import os
import pathlib
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "content/podcast-episodes.json"
FEED = "https://media.rss.com/the-blue-thread/feed.xml"
req = urllib.request.Request(FEED, headers={"User-Agent": "CTI-Website-Podcast-Catalog/1.0"})
with urllib.request.urlopen(req, timeout=35) as response:
    root = ET.fromstring(response.read())
episodes = []
for item in root.findall("./channel/item"):
    title = (item.findtext("title") or "").strip()
    url = (item.findtext("link") or "").strip()
    description = (item.findtext("description") or "").strip()
    published = (item.findtext("pubDate") or "").strip()
    if title and url.startswith("https://"):
        episodes.append({"title": title, "url": url, "description": description, "published": published})
if not episodes:
    raise RuntimeError("RSS feed contained no usable episodes; keeping previous catalog")
data = {"source": FEED, "episodes": episodes}
rendered = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
if not DEST.exists() or DEST.read_text(encoding="utf-8") != rendered:
    DEST.write_text(rendered, encoding="utf-8")
    print(f"Updated podcast catalog with {len(episodes)} episodes")
else:
    print(f"Podcast catalog unchanged ({len(episodes)} episodes)")
