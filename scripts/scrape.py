#!/usr/bin/env python3
"""Scrape the current sekitori banzuke (Makuuchi + Juryo) from the Japan Sumo
Association official site, in English and Japanese, plus each rikishi's portrait.

Sources
  https://www.sumo.or.jp/EnSumoDataRikishi/search/   (English banzuke + profiles)
  https://www.sumo.or.jp/ResultRikishiData/profile/  (Japanese profiles)

Outputs
  data/rikishi.json        bilingual records
  assets/rikishi/<id>.jpg  270x474 portraits
"""
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

BASE = "https://www.sumo.or.jp"
SEARCH_EN = BASE + "/EnSumoDataRikishi/search/"
PROFILE_EN = BASE + "/EnSumoDataRikishi/profile/%s/"
PROFILE_JA = BASE + "/ResultRikishiData/profile/%s/"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "assets", "rikishi")
DATA_FILE = os.path.join(ROOT, "data", "rikishi.json")

DIVISIONS = [(1, "Makuuchi", "幕内"), (2, "Juryo", "十両")]

# Award images on the profile page, keyed by the gif basename.
AWARDS = [
    ("prize01", "Makuuchi Championships", "幕内優勝"),
    ("prize02", "Juryo Championships", "十両優勝"),
    ("prize03", "Makushita Championships", "幕下優勝"),
    ("prize04", "Sandanme Championships", "三段目優勝"),
    ("prize05", "Jonidan Championships", "序二段優勝"),
    ("prize06", "Jonokuchi Championships", "序ノ口優勝"),
    ("prize07", "Outstanding Performance", "殊勲賞"),
    ("prize08", "Fighting Spirit", "敢闘賞"),
    ("prize09", "Technique", "技能賞"),
    ("prize10", "Kinboshi", "金星"),
]


def save_portrait(raw, dest):
    """Write the portrait, re-encoding to strip the ~80KB of camera metadata the
    JSA images carry. Falls back to the original bytes when Pillow is missing."""
    try:
        import io

        from PIL import Image
    except ImportError:
        with open(dest, "wb") as fh:
            fh.write(raw)
        return
    src = Image.open(io.BytesIO(raw)).convert("RGB")
    stripped = Image.new("RGB", src.size)
    stripped.paste(src)
    stripped.save(dest, "JPEG", quality=82, optimize=True, progressive=True)


def get(url, data=None, binary=False):
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read()
            return raw if binary else raw.decode("utf-8", "replace")
        except Exception as exc:  # noqa: BLE001 - retry any transport error
            if attempt == 3:
                raise
            print("  retry %d (%s)" % (attempt + 1, exc), file=sys.stderr)
            time.sleep(2 ** attempt)


def text(fragment):
    fragment = fragment.replace("&emsp;", " ").replace("<br>", " ")
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


def flatten(page):
    return re.sub(r"\s+", " ", page)


def table_fields(flat):
    """Every <th>label</th><td>value</td> pair in the profile's info table."""
    pairs = re.findall(r"<th>(.*?)</th>\s*<td>(.*?)</(?:td|dd)>", flat, re.S)
    return {text(th): text(td) for th, td in pairs}


def parse_awards(flat):
    counts = {}
    for gif, en, ja in AWARDS:
        hit = re.search(r"%s\.gif\"[^>]*>\s*</dt>\s*<dd>\s*(\d+)\s*</dd>" % gif, flat)
        if hit and int(hit.group(1)) > 0:
            counts[gif] = {"en": en, "ja": ja, "count": int(hit.group(1))}
    return counts


def current_shikona(history, fallback):
    """`Ring Name` lists the full shikona history ("Kiribayama > Kirishima")."""
    parts = [p.strip() for p in re.split(r"[→>＞]", history or "") if p.strip()]
    return parts[-1] if parts else fallback


def list_division(kakuzuke_id):
    """[(banzuke rank, rikishi id, ring name)] for one division of the current banzuke."""
    body = urllib.parse.urlencode({"kakuzuke_id": kakuzuke_id, "pref_id": ""}).encode()
    page = get(SEARCH_EN, data=body)
    entries = []
    for row in re.findall(r"<tr>(.*?)</tr>", page, re.S):
        profile = re.search(r"/EnSumoDataRikishi/profile/(\d+)/\">([^<]+)</a>", row)
        if not profile:
            continue
        rank = re.search(r"hoshitori/[^\"]*\">([^<]+)</a>", row)
        entries.append((text(rank.group(1)) if rank else "", profile.group(1),
                        text(profile.group(2))))
    return entries


def parse_en(page):
    flat = flatten(page)
    fields = table_fields(flat)
    full = re.search(r'<td colspan="2" class="fntXL">(.*?)</td>', flat, re.S)
    image = re.search(r'<img src="(/img/sumo_data/rikishi/[^"]+)"', flat)
    return {
        "fields": fields,
        "fullName": text(full.group(1)) if full else "",
        "awards": parse_awards(flat),
        "image": image.group(1) if image else None,
    }


def parse_ja(page):
    flat = flatten(page)
    fields = table_fields(flat)
    header = re.search(r'<span class="fntXL"[^>]*>(.*?)</span>\s*<br>\s*\((.*?)\)', flat, re.S)
    name_kanji, reading, rank = "", "", ""
    if header:
        # "高安 晃&emsp;&emsp;&emsp;西前頭七枚目" -> real name, then rank; then the kana reading.
        chunks = [text(c) for c in header.group(1).split("&emsp;") if text(c)]
        name_kanji = chunks[0] if chunks else ""
        rank = chunks[-1] if len(chunks) > 1 else ""
        reading = text(header.group(2))
    return {"fields": fields, "realNameKanji": name_kanji, "reading": reading, "rank": rank}


def main():
    os.makedirs(IMG_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    wrestlers, skipped = [], []

    for kakuzuke_id, div_en, div_ja in DIVISIONS:
        entries = list_division(kakuzuke_id)
        print("%s (%s): %d rikishi" % (div_en, div_ja, len(entries)))
        for rank_en, rid, listed_name in entries:
            en = parse_en(get(PROFILE_EN % rid))
            if not en["image"]:
                skipped.append({"id": rid, "name": listed_name, "reason": "no portrait"})
                print("  - %-14s SKIP (no portrait)" % listed_name)
                continue
            ja = parse_ja(get(PROFILE_JA % rid))
            ef, jf = en["fields"], ja["fields"]

            dest = os.path.join(IMG_DIR, "%s.jpg" % rid)
            if not os.path.exists(dest):
                save_portrait(get(BASE + en["image"], binary=True), dest)

            shikona_ja = current_shikona(jf.get("しこ名履歴", ""), "")
            wrestlers.append({
                "id": rid,
                "name": current_shikona(ef.get("Ring Name", ""), listed_name),
                "nameJa": shikona_ja,
                "reading": ja["reading"],
                "fullName": en["fullName"],
                "realName": ef.get("Name", ""),
                "realNameJa": jf.get("本名", ""),
                "division": div_en,
                "divisionJa": div_ja,
                "rank": ef.get("Current Rank", ""),
                "rankJa": ja["rank"],
                "banzukeRank": rank_en,
                "highestRankJa": jf.get("最高位", ""),
                "stable": ef.get("Stable", ""),
                "stableJa": jf.get("所属部屋", ""),
                "birthday": ef.get("Birthday", ""),
                "birthdayJa": jf.get("生年月日", ""),
                "birthplace": ef.get("Birthplace", ""),
                "birthplaceJa": jf.get("出身地", ""),
                "height": ef.get("Height", ""),
                "weight": ef.get("Weight", ""),
                "technique": ef.get("Signature Maneuver", ""),
                "techniqueJa": jf.get("得意技", ""),
                "debutJa": jf.get("初土俵", ""),
                "awards": en["awards"],
                "image": "assets/rikishi/%s.jpg" % rid,
                "profileUrl": PROFILE_EN % rid,
                "profileUrlJa": PROFILE_JA % rid,
            })
            print("  + %-14s %-20s %s" % (wrestlers[-1]["name"], rank_en, shikona_ja))
            time.sleep(0.3)

    payload = {
        "source": "Japan Sumo Association (https://www.sumo.or.jp/)",
        "count": len(wrestlers),
        "wrestlers": wrestlers,
    }
    with open(DATA_FILE, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print("\nwrote %d wrestlers to %s" % (len(wrestlers), DATA_FILE))
    if skipped:
        print("skipped: %s" % skipped)


if __name__ == "__main__":
    main()
