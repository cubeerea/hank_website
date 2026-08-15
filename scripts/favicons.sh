#!/usr/bin/env bash
#
# Regenerates the PNG favicon fallbacks from public/favicon.svg.
#
# Why a browser and not rsvg-convert/ImageMagick: the mark is set in IBM Plex
# Mono, which the site self-hosts but does not install system-wide, so a
# fontconfig-based rasterizer silently substitutes another mono face and the
# PNGs stop matching the SVG. Chromium loading the same @fontsource file the
# site loads is the only rasterizer guaranteed to agree with it.
#
# Artwork lives in two places on purpose — public/favicon.svg is what ships,
# scripts/favicon-render.html inlines the same shapes so the page's webfont
# reaches them (an SVG inside an <img> can't see it). Edit both together.
#
# Usage: npm run dev   # in another shell
#        bash scripts/favicons.sh [port]
#
set -euo pipefail

PORT="${1:-5173}"
BROWSE="${BROWSE:-$HOME/.claude/skills/gstack/browse/dist/browse}"
OUT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [ ! -x "$BROWSE" ]; then
  echo "error: browse binary not found at $BROWSE" >&2
  echo "       set BROWSE=/path/to/browse and retry" >&2
  exit 1
fi

if ! curl -sfo /dev/null "http://localhost:$PORT/"; then
  echo "error: no dev server on port $PORT — run 'npm run dev' first" >&2
  exit 1
fi

"$BROWSE" goto "http://localhost:$PORT/scripts/favicon-render.html"
"$BROWSE" wait --networkidle

# id in the rig -> filename in public/
"$BROWSE" screenshot '#s32'  "$TMP/favicon-32.png"
"$BROWSE" screenshot '#s192' "$TMP/favicon-192.png"
"$BROWSE" screenshot '#s180' "$TMP/apple-touch-icon.png"

mv "$TMP"/favicon-32.png "$TMP"/favicon-192.png "$TMP"/apple-touch-icon.png "$OUT/"
echo "wrote favicon-32.png, favicon-192.png, apple-touch-icon.png to $OUT"
