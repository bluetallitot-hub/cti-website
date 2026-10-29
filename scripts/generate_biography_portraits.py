#!/usr/bin/env python3
"""Generate portrait THMs for staged CTI biographies with conservative face detection.
Never overwrite originals; skip images with no reliable single face or insufficient framing.
"""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageOps
ROOT=Path(__file__).resolve().parents[1]
dbpath=ROOT/"content/leaders.json"
db=json.loads(dbpath.read_text())
report=[]
cascade=cv2.CascadeClassifier(cv2.data.haarcascades+"haarcascade_frontalface_default.xml")
for person in db["leaders"]:
    originals=person.get("photoOriginals") or []
    if not originals or person.get("activeOriginal"):
        continue
    original=originals[-1]
    source=ROOT/original["path"]
    if not source.is_file():
        report.append({"id":person["ctiId"],"status":"missing-original"});continue
    with Image.open(source) as im:
        im=ImageOps.exif_transpose(im).convert("RGB")
        image=np.asarray(im)
    h,w=image.shape[:2]
    gray=cv2.cvtColor(image,cv2.COLOR_RGB2GRAY)
    faces=cascade.detectMultiScale(gray,scaleFactor=1.08,minNeighbors=6,minSize=(max(30,w//14),max(30,h//14)))
    if len(faces)!=1:
        report.append({"id":person["ctiId"],"status":"manual-review","reason":f"{len(faces)} faces detected"});continue
    x,y,fw,fh=map(int,faces[0])
    # Keep full head: substantial margin above detected face and shoulders below.
    target_w=max(fw*3.1,fh*2.6)
    target_h=target_w*4/3
    center_x=x+fw/2
    top=y-fh*0.85
    left=center_x-target_w/2
    # If crop cannot fit within original, leave for background extension/manual review.
    if left<0 or top<0 or left+target_w>w or top+target_h>h:
        report.append({"id":person["ctiId"],"status":"manual-review","reason":"portrait requires background extension or different crop"});continue
    crop=im.crop((round(left),round(top),round(left+target_w),round(top+target_h)))
    dest=ROOT/"assets/biographies"/person["ctiId"]/"THM.jpg"
    dest.parent.mkdir(parents=True,exist_ok=True)
    crop.resize((600,800),Image.Resampling.LANCZOS).save(dest,quality=93,subsampling=0)
    person["photo"]=dest.relative_to(ROOT).as_posix()
    person["activeOriginal"]=original["number"]
    person["thumbnailStatus"]="generated-needs-visual-review"
    person["thumbnailSpecification"]={"width":600,"height":800,"aspectRatio":"3:4","format":"jpeg","padding":False,"source":original["path"],"crop":[round(left),round(top),round(left+target_w),round(top+target_h)]}
    report.append({"id":person["ctiId"],"status":"generated-needs-visual-review","source":original["path"]})
dbpath.write_text(json.dumps(db,indent=2,ensure_ascii=False)+"\n")
out=ROOT/"assets/biographies/portrait-review-report.json"
out.write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps({"generated":sum(r["status"]=="generated-needs-visual-review" for r in report),"manual_review":sum(r["status"]=="manual-review" for r in report)},indent=2))
