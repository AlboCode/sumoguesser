#!/usr/bin/env python3
"""Render what the quiz actually shows of each portrait, as contact sheets.

The quiz reveals only the top of a portrait so the kesho-mawashi — which on some
wrestlers carries their own shikona in embroidery — stays out of frame. Run this
after a banzuke refresh and read the sheets: any wrestler whose name or stable is
legible needs an entry in PORTRAIT_ZOOM in scrape.py (a higher zoom shows less).

    python3 scripts/audit_crops.py            # writes audit/sheet-N.png
    python3 scripts/audit_crops.py --open 3594  # one wrestler, enlarged

Needs Pillow.
"""
import json
import os
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "rikishi.json")
OUT = os.path.join(ROOT, "audit")

BASE_CROP = 0.44   # must match --portrait-crop in styles.css
COLUMNS, PER_SHEET, TILE = 6, 12, 250


def visible(rikishi):
    """The fraction of the portrait the quiz shows for this wrestler."""
    return BASE_CROP / (rikishi.get("portraitZoom") or 1)


def quiz_view(rikishi, width):
    """The portrait as the quiz frames it, drawn at `width` pixels."""
    image = Image.open(os.path.join(ROOT, rikishi["image"]))
    slice_height = int(image.height * visible(rikishi))
    height = int(width * (image.height / image.width) * BASE_CROP)
    return image.crop((0, 0, image.width, slice_height)).resize((width, height), Image.LANCZOS)


def main():
    wrestlers = json.load(open(DATA, encoding="utf-8"))["wrestlers"]

    if "--open" in sys.argv:
        wanted = sys.argv[sys.argv.index("--open") + 1]
        match = next((r for r in wrestlers if r["id"] == wanted or r["name"] == wanted), None)
        if not match:
            sys.exit("no rikishi with id or name %r" % wanted)
        os.makedirs(OUT, exist_ok=True)
        path = os.path.join(OUT, "%s.png" % match["id"])
        quiz_view(match, 810).save(path)
        print("%s (%s) at %.1f%% -> %s" % (match["name"], match["id"], visible(match) * 100, path))
        return

    os.makedirs(OUT, exist_ok=True)
    tile_height = int(TILE * (474 / 270) * BASE_CROP)
    sheets = (len(wrestlers) + PER_SHEET - 1) // PER_SHEET

    for index in range(sheets):
        batch = wrestlers[index * PER_SHEET:(index + 1) * PER_SHEET]
        rows = (len(batch) + COLUMNS - 1) // COLUMNS
        sheet = Image.new("RGB", (TILE * COLUMNS, (tile_height + 16) * rows), "#222222")
        pen = ImageDraw.Draw(sheet)
        for i, rikishi in enumerate(batch):
            x, y = (i % COLUMNS) * TILE, (i // COLUMNS) * (tile_height + 16)
            sheet.paste(quiz_view(rikishi, TILE), (x, y))
            label = rikishi["name"]
            if rikishi.get("portraitZoom", 1) != 1:
                label += " (zoom %.2f)" % rikishi["portraitZoom"]
            pen.text((x + 4, y + tile_height + 3), label, fill="#ffffff")
        sheet.save(os.path.join(OUT, "sheet-%d.png" % index))

    print("wrote %d sheets to %s" % (sheets, OUT))
    tightened = [r["name"] for r in wrestlers if r.get("portraitZoom", 1) != 1]
    print("tightened: %s" % (", ".join(tightened) or "none"))


if __name__ == "__main__":
    main()
