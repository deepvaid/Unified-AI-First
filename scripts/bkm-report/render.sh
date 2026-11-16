#!/bin/zsh
# render.sh [dir]: renders each NN-*.html infographic page to a 2x PNG (1920px wide) with headless Google Chrome.
# Two passes per page: measure the figure height, then screenshot at exactly that height. Default dir: output/bkm-figs
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="${1:-$(cd "$(dirname "$0")/../.." && pwd)/output/bkm-figs}"
for f in "$DIR"/[0-9][0-9]-*.html; do
  h=$("$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=960,2000 --virtual-time-budget=6000 --dump-dom "file://$f" 2>/dev/null | grep -o '<title>H=[0-9]*' | grep -o '[0-9]*$')
  [[ -z "$h" ]] && { echo "no height for $f"; continue; }
  "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=960,$h --virtual-time-budget=6000 --screenshot="${f%.html}.png" "file://$f" >/dev/null 2>&1
  echo "$(basename ${f%.html}).png 960x$h"
done
