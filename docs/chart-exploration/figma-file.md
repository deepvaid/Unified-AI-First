# Figma exploration file

- **File**: "Maropost — Chart Visual System Exploration — Aug 2026"
- **URL**: https://www.figma.com/design/olj3jdXnCXlKUTcS2di7LD
- **fileKey**: `olj3jdXnCXlKUTcS2di7LD`
- **Plan**: Maropost (team::933394882561163950), created 2026-08-07 in drafts
- The production Design Kit (`RyWEOafKLPhvZCltyQicOm`) is untouched by this work.

## Page map

| Page | Root node | Content |
|---|---|---|
| 📦 Assets (source captures) | 0:1 | staging: 92 uploaded frames (source of every image fill) |
| 🏠 Cover | 3:2 | title, four palette previews, how-to-read, live links |
| 00 — Existing Dashboard | 3:50 | baseline fold + 4 widgets + why-we're-exploring bullets |
| 01 — Research | 5:2 | 25-ref citation grid + 8 pattern takeaways |
| 02 — Option A — Restrained Blue | 4:2 | Mood Board / Palette & Tokens / Chart Examples / Full Dashboard |
| 03 — Option B — Sophisticated Multi-Color | 4:110 | same sections |
| 04 — Option C — Maropost Blue · Teal · Green | 4:221 | same sections |
| 05 — Option D — Modern Gradient | 4:325 | same sections |
| 06 — Side-by-Side Comparison | 3:62 | exec page: 4 folds, same-chart row, specimen grid, choose cards |

## Ops log

- 2026-08-07: file created (create_new_file, drafts, Maropost plan).
- 2026-08-07: 9 pages created; 67 assets uploaded (66 batch + 1 test) as frames on 📦 Assets.
- 2026-08-07: Cover/00/06 built (3 parallel use_figma), then 02–05 (4 parallel), then 01.
- 2026-08-07: **Lesson — Figma accepts .webp uploads but does not RENDER webp image fills.**
  All 25 Mobbin refs re-converted to PNG (`sips`), re-uploaded, and 53 rectangles across
  pages 01–05 repainted old-hash→new-hash. Verified rendering via get_screenshot.
- Palette swatches on 02–05 and Cover are native rectangles (eyedropper-able), hexes from
  `scripts/chart-exploration/option-palettes.mjs`.
- Full-page dashboard captures are NOT in Figma (over the 4096px downsample cap) — they
  live in `docs/chart-exploration/**/dashboard-full*` and the deck.

- 2026-08-07 (P12+P13, one pass): 34 refreshed PNGs uploaded. Swapped dashboard-fold
  (baseline + A–D), widget-area (A–D) and specimen-grid to the multi-colour-comparison
  + new-widget captures; recoloured the native **comparison swatch** rect + hex caption
  on 02–05 (A #6E93AE→#1B4F7A, B #828E9A→#C2622E, C #5E93AA→#2E9E6B, D #7C8CA3→#C264C9);
  rewrote the "What changed vs today" text from copy.json; inserted a
  **NEW WIDGETS — SHOPIFY-STYLE SET** row (Customers over time / Sessions by country /
  Sales by product name / Sessions by device type) before FULL DASHBOARD on 00 and 02–05.
  Note: option pages have **no tokens screenshot** — the palette is native swatch
  rectangles, so only 2 image swaps per option page is correct.
  `widget-line` images on 06 are deliberately unchanged (no comparison series, no new widget).

## Re-run instructions

Screenshots come from `docs/chart-exploration/` (manifest.json). To refresh after a
re-capture: upload the changed PNG(s), then swap the imageHash on the matching
rectangles (see ops-log pattern above — find rects by old hash, repaint). Refs must be
PNG, not webp.
