#!/usr/bin/env python3
"""Read-only RSS sync for CTI's public podcast; never edits sermon records."""
import json
import pathlib
import urllib.request
import xml.etree.ElementTree as ET

FEED = "https://media.rss.com/the-blue-thread/feed.xml"
OUT = pathlib.Path("content/podcast-episodes.json")
req = urllib.request.Request(FEED, headers={"User-Agent": "CTI-Website-Podcast-Sync/1.0"})
with urllib.request.urlopen(req, timeout=25) as response:
    root = ET.fromstring(response.read())
channel = root.find("channel")
if channel is None or "The Blue Thread" not in (channel.findtext("title") or ""):
    raise ValueError("Unexpected RSS channel; refusing to overwrite podcast index")
episodes = []
for item in channel.findall("item"):
    title = (item.findtext("title") or "").strip()
    link = (item.findtext("link") or "").strip()
    if title and link.startswith("https://rss.com/podcasts/the-blue-thread/"):
        episodes.append({"title": title, "url": link, "description": (item.findtext("description") or "")[:4000]})
if not episodes:
    raise ValueError("RSS returned no valid episodes")
data = {"source": FEED, "episodes": episodes}
OUT.parent.mkdir(parents=True, exist_ok=True)
new = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
if not OUT.exists() or OUT.read_text(encoding="utf-8") != new:
    OUT.write_text(new, encoding="utf-8")
    print(f"Updated {len(episodes)} podcast episodes")
else:
    print("No podcast changes")
