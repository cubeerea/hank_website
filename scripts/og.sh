#!/usr/bin/env bash
#
# Regenerates public/assets/og-preview.png (1200x630) from scripts/og-render.html.
#
# Why a browser and not a static export: the card is set in IBM Plex Serif and
# Mono, which the site self-hosts but does not install system-wide. Chromium
# loading the same @fontsource files the site loads is the only rasterizer
# guaranteed to agree with the page — same reasoning as scripts/favicons.sh.
#
# Usage: npm run dev   # in another shell
#        bash scripts/og.sh [port]
#
set -euo pipefail

PORT="${1:-5173}"
BROWSE="${BROWSE:-$HOME/.claude/skills/gstack/browse/dist/browse}"
OUT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/assets"
# Under /private/tmp specifically: the browse binary refuses to write outside
# /private/tmp and the project root, and macOS's default mktemp lands in
# /var/folders, which is neither.
TMP="$(mktemp -d /private/tmp/og.XXXXXX)"
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

"$BROWSE" goto "http://localhost:$PORT/scripts/og-render.html"
"$BROWSE" wait --networkidle
"$BROWSE" screenshot '#card' "$TMP/og-preview.png"

mv "$TMP/og-preview.png" "$OUT/"
echo "wrote og-preview.png to $OUT"
