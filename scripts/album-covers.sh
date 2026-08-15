#!/usr/bin/env bash
# Fetch Spotify album cover art and self-host it as WebP.
#
# Covers are served from our own origin rather than hot-linked, so no visitor
# data reaches Spotify on page load — the same reason the fonts are self-hosted
# (see the note at the top of src/style.css).
#
# Usage:
#   scripts/album-covers.sh <slug> <spotify-album-url> [<slug> <url> ...]
#
# Example:
#   scripts/album-covers.sh \
#     ken-carson-a-great-chaos https://open.spotify.com/album/4xiIKP6gQ01PNFR6idFM5q
#
# Writes public/assets/albums/<slug>.webp and prints the <a> markup to paste
# into the .albums grid in index.html.

set -euo pipefail

cd "$(dirname "$0")/.."
OUT_DIR="public/assets/albums"
mkdir -p "$OUT_DIR"

if [ $# -eq 0 ] || [ $(($# % 2)) -ne 0 ]; then
  echo "usage: $0 <slug> <spotify-album-url> [<slug> <url> ...]" >&2
  exit 1
fi

command -v cwebp >/dev/null || { echo "cwebp not found (brew install webp)" >&2; exit 1; }

while [ $# -gt 0 ]; do
  slug="$1"; url="$2"; shift 2

  meta=$(curl -fsS "https://open.spotify.com/oembed?url=${url}")
  title=$(printf '%s' "$meta" | python3 -c 'import sys,json; print(json.load(sys.stdin)["title"])')
  thumb=$(printf '%s' "$meta" | python3 -c 'import sys,json; print(json.load(sys.stdin)["thumbnail_url"])')

  # oEmbed hands back the 300px variant (ab67616d00001e02...). Spotify encodes
  # the size in that path segment, so swapping it for b273 gets the 640px
  # original — enough for a 2x render of the grid tile.
  big="${thumb/ab67616d00001e02/ab67616d0000b273}"

  tmp=$(mktemp -t cover).jpg
  curl -fsS "$big" -o "$tmp"
  # Tiles render ~175px wide, so 400px covers a 2x display with headroom.
  # Shipping the full 640px roughly tripled the weight of detailed artwork for
  # resolution no screen resolves.
  cwebp -quiet -q 80 -resize 400 0 "$tmp" -o "${OUT_DIR}/${slug}.webp"
  rm -f "$tmp"

  bytes=$(wc -c < "${OUT_DIR}/${slug}.webp" | tr -d ' ')
  echo "  ${slug}.webp  ${bytes} bytes  <- ${title}" >&2

  printf '<a class="album" href="%s" target="_blank" rel="noopener noreferrer" title="%s on Spotify">\n' "$url" "$title"
  printf '    <img src="/assets/albums/%s.webp" alt="%s album cover" width="400" height="400" loading="lazy" decoding="async">\n' "$slug" "$title"
  printf '</a>\n'
done
