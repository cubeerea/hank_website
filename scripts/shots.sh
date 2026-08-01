#!/usr/bin/env bash
#
# Regenerates the cropped project screenshots in public/assets/projects/.
#
# Each entry captures a hand-picked REGION of the live site rather than the
# whole page: a full-page shot scaled into a 320x180 card is an illegible
# smudge, while a tight crop of the most distinctive UI still reads.
#
# Captures at deviceScaleFactor 2 so the image stays crisp on retina, then
# stores it at 640x360 for the 320x180 CSS slot.
#
# Usage: npm run shots
#
set -euo pipefail

BROWSE="${BROWSE:-$HOME/.claude/skills/gstack/browse/dist/browse}"
OUT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/assets/projects"

if [ ! -x "$BROWSE" ]; then
  echo "error: browse binary not found at $BROWSE" >&2
  echo "       set BROWSE=/path/to/browse and retry" >&2
  exit 1
fi

mkdir -p "$OUT"

# --- Live sites we can point a browser at -----------------------------------
# name | url | clip (x,y,w,h in CSS px) | settle seconds
SHOTS=(
  "biotech-engine|https://biotech-catalyst-engine-black.vercel.app/|72,45,640,360|4"
)

# --- Projects with no reachable live URL ------------------------------------
# Nexus is a hackathon build with no deploy, and the Devpost page itself is
# white-chrome LinkedIn-style boilerplate — the only real artifact is the
# gallery image the team uploaded. Fetch it and crop from the TOP so the app
# header ("ProjectNexus · 331 people · 398 connections") survives the crop.
#
# name | image url | crop anchor (top|center)
FETCHES=(
  "project-nexus|https://d112y698adiu2z.cloudfront.net/photos/production/software_photos/004/363/978/datas/gallery.jpg|top"
)

# --- Papers we host ourselves -----------------------------------------------
# Rasterize page 1 and crop the title block. A whole page shrunk into a 320x180
# slot is gray noise; the title block is the one region that stays readable and
# it says "this is a paper" at a glance.
#
# name | pdf (relative to public/) | crop x,y,w,h in a 1700px-wide render
PAPERS=(
  "pid-steering|assets/global-pid-steering.pdf|260,290,1200,675"
)

if [ ${#SHOTS[@]} -gt 0 ]; then
  "$BROWSE" viewport 1280x800 --scale 2 >/dev/null
fi

for entry in "${SHOTS[@]}"; do
  IFS='|' read -r name url clip settle <<< "$entry"
  echo "capturing $name ..."
  "$BROWSE" goto "$url" >/dev/null
  sleep "$settle"                       # let client-side data land before capture
  "$BROWSE" screenshot --clip "$clip" "$OUT/$name.png" >/dev/null
  sips -z 360 640 "$OUT/$name.png" >/dev/null
  echo "  -> $OUT/$name.png"
done

for entry in "${FETCHES[@]}"; do
  IFS='|' read -r name url anchor <<< "$entry"
  echo "fetching $name ..."
  tmp="$(mktemp -t shots).img"
  curl -sfL -o "$tmp" "$url"
  OUT="$OUT" NAME="$name" SRC="$tmp" ANCHOR="$anchor" python3 - <<'PY'
import os
from PIL import Image

im = Image.open(os.environ["SRC"]).convert("RGB")
w, h = im.size
target = round(w * 9 / 16)                      # 16:9 to match the 320x180 slot
top = 0 if os.environ["ANCHOR"] == "top" else max(0, (h - target) // 2)
box = im.crop((0, top, w, min(h, top + target)))
box.resize((640, 360), Image.LANCZOS).save(
    os.path.join(os.environ["OUT"], os.environ["NAME"] + ".jpg"),
    quality=72, optimize=True, progressive=True)
PY
  rm -f "$tmp"
  echo "  -> $OUT/$name.jpg"
done

PUBLIC="$(dirname "$OUT")/.."

for entry in "${PAPERS[@]}"; do
  IFS='|' read -r name pdf crop <<< "$entry"
  echo "rendering $name ..."
  tmp="$(mktemp -t shots).png"
  # sips rasterizes page 1 only, which is the page we want.
  sips -s format png --resampleWidth 1700 "$PUBLIC/$pdf" --out "$tmp" >/dev/null
  OUT="$OUT" NAME="$name" SRC="$tmp" CROP="$crop" python3 - <<'PY'
import os
from PIL import Image

src = Image.open(os.environ["SRC"])
# sips renders PDFs with a transparent background; flatten onto white first or
# every glyph lands on black.
page = Image.new("RGB", src.size, "white")
page.paste(src, mask=src.split()[-1] if src.mode == "RGBA" else None)

x, y, w, h = (int(v) for v in os.environ["CROP"].split(","))
page.crop((x, y, x + w, y + h)).resize((640, 360), Image.LANCZOS).save(
    os.path.join(os.environ["OUT"], os.environ["NAME"] + ".jpg"),
    quality=78, optimize=True, progressive=True)
PY
  rm -f "$tmp"
  echo "  -> $OUT/$name.jpg"
done

echo "done. Review the crops before committing — layouts drift."
