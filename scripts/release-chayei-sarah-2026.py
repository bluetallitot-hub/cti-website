#!/usr/bin/env python3
"""One-time CTI Chayei Sarah Reader release; no email is sent."""
import datetime as dt
import json
import os
import pathlib
import re
import subprocess
import urllib.request
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

ROOT=pathlib.Path(__file__).resolve().parents[1]
INDEX=ROOT/"content/dvar-torah/index.json"
READER=ROOT/"content/dvar-torah/Genesis/1-05-26-Reader (Chayei Sarah).md"
RELEASE=dt.datetime(2026,11,6,15,0,tzinfo=ZoneInfo("America/New_York"))
NOW=dt.datetime.now(ZoneInfo("America/New_York"))
if NOW < RELEASE:
    print("Not due yet",NOW.isoformat())
    raise SystemExit(0)
if NOW.date()!=RELEASE.date():
    print("One-time release date passed; refusing unexpected publication",NOW.isoformat())
    raise SystemExit(0)
data=json.loads(INDEX.read_text())
items=[x for x in data["items"] if x.get("name")=="Chayei Sarah" and x.get("year")==2026]
if len(items)!=1: raise SystemExit("Expected exactly one Chayei Sarah 2026 entry")
item=items[0]
if item.get("status")=="published":
    print("Already published; no changes")
    raise SystemExit(0)
if READER.exists(): raise SystemExit("Reader unexpectedly exists before scheduled release")
# Retrieve exact approved Reader from the last public commit, without exposing it early.
previous=subprocess.check_output(["git","show","eaccfd829e3c58c0df1c495f2dfb1372c6e530dd^:content/dvar-torah/Genesis/1-05-26-Reader (Chayei Sarah).md"],cwd=ROOT)
if len(previous)<300: raise SystemExit("Approved Reader source too short")
# Read live RSS; only link a uniquely matched episode explicitly mentioning Chayei Sarah.
feed="https://media.rss.com/the-blue-thread/feed.xml"
try:
    request=urllib.request.Request(feed,headers={"User-Agent":"CTI-Torah-Release/1.0"})
    with urllib.request.urlopen(request,timeout=15) as response:
        xml=response.read(3_000_000)
    channel=ET.fromstring(xml)
    matches=[]
    for ep in channel.findall("./channel/item"):
        title=ep.findtext("title") or ""
        description=re.sub("<[^>]*>"," ",ep.findtext("description") or "")
        text=(title+" "+description).lower()
        if re.search(r"chayei[ -]?sarah|chaye[ -]?sarah|life of sarah",text):
            url=ep.findtext("link") or ""
            if url.startswith("https://rss.com/podcasts/the-blue-thread/"):
                matches.append((title,url))
    if len(matches)==1:
        item["podcast"]=matches[0][1]
        print("Matched podcast",matches[0])
    else:
        print("No unique Chayei Sarah podcast match; Reader will publish without podcast",len(matches))
except Exception as e:
    print("RSS lookup unavailable; publishing Reader without podcast:",str(e))
READER.parent.mkdir(parents=True,exist_ok=True)
READER.write_bytes(previous)
item["status"]="published"
item["published"]=True
INDEX.write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n")
print("Reader staged for GitHub Pages publication")
