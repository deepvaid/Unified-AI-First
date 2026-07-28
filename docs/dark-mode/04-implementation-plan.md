# 04 — Dark-mode implementation plan

**Sources:** `01-repository-discovery.md`, `02-design-system-audit.md`, `03-accessibility-audit.md`, and the canonical token/theme files named in the brief.  
**Method:** Static planning from the verified audits and source. No rendered claim is made here. Contrast ratios below use the audit's WCAG method and paired surfaces.  
**Date:** 2026-07-28

## 1. Contradiction check / planning gate

### Input agreement

The three input documents do not contradict one another:

- `01` establishes the source graph and confirms the runtime mutation, duplicate CSS layers, route inventory, and runnable checks.
- `02` assigns design-system severity and recommends the same root fixes: preserve `tokens.json` as the source of truth, stop the accent mutation, use the dark chart tokens, and retire the parallel CSS color sources.
- `03` quantifies the same defects. Its note that dark chart tokens exist but are unused does not imply that every existing dark series token is safe: `series1` is 8.11:1, while the current darkest entries still need replacement. This plan therefore consumes and completes the dark chart palette rather than wiring every current value unchanged.
- `02` found no structural overlay defect; `03` did not render overlays. WP-10 is therefore a verification and semantic-surface migration package, not an assertion that every overlay is currently broken.

### Canonical palette decision

`src/design-tokens/tokens.json` remains the only authored color source. The existing warm-charcoal dark family is retained:

- canvas `#1A1714`
- primary surface `#222019`
- secondary surface `#2E2B25`
- overlay surface `#333028`

These are warm charcoals, not pure black and not a brown-black redesign target. Changing them would invalidate all audited contrast pairings without solving a documented defect. Surface distinction will come from named tiers, AA-visible borders, and paired shadows.

The competing layers are resolved as follows:

- `src/styles/mb-foundation.tokens.css`: remove from `app-styles.ts` and delete after `CommerceCloudLanding.vue` is migrated to generated/semantic tokens. Do not retain a dark navy compatibility block.
- `src/styles/marobase-tokens.css`: remove from `app-styles.ts` and delete. Its only confirmed live non-color dependency, `--v-theme-surface-light` in `DvRefineDialog.vue` and `DvExpandDialog.vue`, is first moved into `tokens.json` and `maropostTheme.ts`. Vuetify remains the sole owner of `--v-theme-*`.
- `src/styles/sidebar-dark.css`: retain. DS-18 establishes it as an orthogonal navigation-skin system, not a competing app palette.
- `src/styles/tokens.scss`: retire after Vite and Storybook switch their SCSS `additionalData` to generated `_variables.scss`; do not carry its separate sidebar/shadow values forward.

### Coverage gate

Every major area has a work package: foundation (WP-01), Vuetify/accent bridge (WP-02), global surfaces and duplicate-layer retirement (WP-03), navigation (WP-04), type/icons (WP-05), borders and interaction states (WP-06), forms (WP-07), cards/widgets/feedback (WP-08), charts (WP-09), overlays (WP-10), AI surfaces (WP-11), remaining states/routes/hardcoded sweep (WP-12), Storybook (WP-13), and documentation/cleanup (WP-14).

The route-family and fixed-look coverage ledger in §5 prevents full-page and preview surfaces from disappearing between packages.

### Light-mode protection

The default light palette is protected by all of these mechanisms:

1. `color.light.background`, surfaces, text, feedback colors, containers, borders, and `maropostLight.colors` remain value-identical.
2. Dark value changes live only under `color.dark.*` and `.v-theme--maropostDark` / `[data-theme='dark']`.
3. `accent-presets.css` gets separate light and dark selectors; no selector combines both themes.
4. Default cyan has no `data-accent` attribute, so neither mode's canonical theme is patched at boot.
5. Existing light chart arrays move into tokens byte-for-byte; only dark arrays are retuned.
6. Generated files are regenerated, never hand-edited.

There are exactly two deliberate light-state corrections:

- The optional purple accent default changes from `#8B5CF6` to `#7C3AED`; white on the old fill is 4.23:1, while white on the replacement is 5.70:1. This is the light-side completion of A1/DS-01's theme-blind accent-pair defect. The hue identity is unchanged.
- Focus rings use an opaque per-accent `focusRing` color instead of low-alpha compositing. This is the A2 correction; geometry remains 2px or 3px with the existing offsets.

No layout, IA, dimensions, spacing, base light palette, or default cyan light value changes.

## 2. Semantic token structure

### 2.1 Naming and generation rules

- Source names use the existing `color.light.*`, `color.dark.*`, `color.chart.*`, and `shadow.*` structures.
- Generated names remain `mp_color_dark_surfaceRaised`, `--mp-color-dark-surfaceRaised`, and `$mp-color-dark-surfaceRaised`.
- Public CSS semantics use the existing alias layer and extend it with `--surface-*`, `--text-*`, `--icon-*`, `--border-*`, `--accent-*`, and `--elevation-*`. No component creates its own theme branch.
- `build.mjs` additionally emits a derived RGB custom property for each hex color, named `--mp-rgb-<normal-css-token-path>`. Example: `color.dark.accent.blue.default: #60A5FA` emits `--mp-rgb-color-dark-accent-blue-default: 96, 165, 250`. Alias values are resolved through the existing token index before RGB conversion. RGB values are generated, never authored twice.
- Because dark shadows add one nested level, the Tokens Studio shadow exporter must recurse and emit `dark.sm`, `dark.md`, and `dark.lg`; the normal CSS/SCSS/TS flattener already supports this shape. Existing `shadow.sm/md/lg` names stay unchanged.
- Values marked “alias” below are token references in `tokens.json`, not repeated literals.

### 2.2 Canvas, surfaces, interaction, and scrim

| Role | Source token | Dark value | CSS alias | Pairing / target |
|---|---|---:|---|---|
| App canvas | keep `color.dark.background` | `#1A1714` | `--surface-canvas` | text primary 15.11:1 |
| Primary surface | keep `color.dark.surface` | `#222019` | `--surface-primary` | text primary 13.79:1 |
| Secondary/nested surface | keep `color.dark.surfaceVariant` | `#2E2B25` | `--surface-secondary` | text primary 11.94:1; boundary uses `--border-subtle` |
| Raised surface | add `color.dark.surfaceRaised` | `#2A2820` | `--surface-raised` | paired with L2 border/shadow |
| Overlay surface | keep `color.dark.surfaceBright`; add alias `surfaceOverlay` | `#333028` | `--surface-overlay` | text primary 11.15:1 |
| Sunken/well | add `color.dark.surfaceSunken` alias to background | `#1A1714` | `--surface-sunken` | boundary uses `--border-subtle` |
| Legacy `surface-light` | add `color.dark.surfaceLight` | `#2A2820` | Vuetify `surface-light` | preserves legacy rendered value |
| Interactive default | add `color.dark.interactiveDefault` alias to surface | `#222019` | `--surface-interactive` | label/icon carries contrast |
| Interactive hover | add `color.dark.interactiveHover` alias to surfaceVariant | `#2E2B25` | `--surface-interactive-hover` | 1.16:1 surface shift plus text/icon |
| Interactive active | add `color.dark.interactiveActive` alias to surfaceBright | `#333028` | `--surface-interactive-active` | 1.24:1 surface shift plus text/icon |
| Interactive selected | alias active accent's `selectedBackground` | default cyan `#243A3E` | `--surface-interactive-selected` | 1.36:1 fill shift; always pair with 2px accent keyline (8.11:1) and `aria-selected` |
| Disabled surface | add `color.dark.interactiveDisabled` alias to surfaceVariant | `#2E2B25` | `--surface-interactive-disabled` | pair with disabled text 4.72:1 and disabled semantics |
| Backdrop/scrim | add `color.dark.scrim` | `rgba(6, 8, 10, 0.64)` | `--scrim-overlay` | backdrop, not foreground content |

Low-contrast hover/selected fills are intentionally supplemental cues. They never carry state alone; text, icon, keyline, and programmatic state remain present.

### 2.3 Text and icons

| Role | Source token | Value | CSS alias | Ratio on `#222019` |
|---|---|---:|---|---:|
| Primary text | keep `color.dark.textPrimary` | `#ECECEC` | `--text-primary`, compatibility `--ink` | 13.79:1 |
| Secondary text | add `color.dark.textSecondary` | `#C9C4BA` | `--text-secondary` | 9.38:1 |
| Muted/helper text | keep `color.dark.textMuted` | `#B3AA97` | `--text-muted`, compatibility `--muted` | 7.07:1 |
| Disabled text | add `color.dark.textDisabled` | `#8B8A87` | `--text-disabled` | 4.72:1 |
| On default brand | keep `color.dark.onPrimary` | `#06212C` | `--accent-on` | 8.28:1 on `#2CC4FF` |
| Primary icon | add `color.dark.iconPrimary` alias to textPrimary | `#ECECEC` | `--icon-primary` | 13.79:1 |
| Secondary icon | add `color.dark.iconSecondary` alias to textMuted | `#B3AA97` | `--icon-secondary` | 7.07:1 |
| Disabled icon | add `color.dark.iconDisabled` alias to textDisabled | `#8B8A87` | `--icon-disabled` | 4.72:1 |

Do not apply another opacity multiplier to `textDisabled` or `iconDisabled`; the token already contains the intended visual weakening.

### 2.4 Borders, dividers, and focus

Opaque values are used so contrast is stable across canvas, card, raised, and overlay surfaces.

| Role | Source token | Value | CSS alias | Minimum ratio across `#1A1714`, `#222019`, `#2E2B25`, `#333028` |
|---|---|---:|---|---:|
| Subtle boundary/hairline | change `color.dark.borderSubtle` | `#7E7B75` | `--border-subtle`; compatibility `--hairline`, `--mp-border-subtle` | 3.12:1 |
| Default control/card border | change `color.dark.border` | `#878683` | `--border-default` | 3.62:1 |
| Strong boundary | add `color.dark.borderStrong`; change `outline` to alias it | `#9B9A98` | `--border-strong` | 4.69:1 |
| Outline variant | change `color.dark.outlineVariant` to alias borderSubtle | `#7E7B75` | Vuetify `outline-variant` | 3.12:1 |
| Hover border | add `color.dark.borderHover` alias to border | `#878683` | `--border-hover`, compatibility `--mp-border-subtle-hover` | 3.62:1 |
| Table row | change `color.dark.borderTableRow` to alias borderSubtle | `#7E7B75` | `--mp-border-table-row` | 3.12:1 |
| Table header | change `color.dark.borderTableHeader` to alias border | `#878683` | `--mp-border-table-header` | 3.62:1 |
| Table footer/divider | change `borderTableFooterDivider` and `borderDividerMuted` to alias borderSubtle | `#7E7B75` | existing table aliases / `--border-divider` | 3.12:1 |
| Default focus ring | add `color.dark.focusRing` alias to cyan accent focusRing | `#2CC4FF` | `--focus-ring` | 8.11:1 on primary surface; 6.55:1 on overlay |

`maropostDark.variables` must set Vuetify's generic border color to `#7E7B75` at opacity `1`; individual decorative separators may opt out only when they are not an essential boundary.

### 2.5 Brand accent roles

The source structure is `color.<mode>.accent.<key>.<role>`. Full values and ratios are in §4. The public aliases are:

- `--accent-default`
- `--accent-hover`
- `--accent-active`
- `--accent-selected-bg`
- `--accent-subtle-bg`
- `--accent-focus-ring`
- `--accent-on`
- `--accent-container`
- `--accent-on-container`

Compatibility aliases remain for one release:

- `--accent` → `--accent-default`
- `--accent-fg` → `--accent-on`
- `--accent-ink` → `--accent-active`
- `--accent-soft` → `--accent-subtle-bg`

### 2.6 Success, warning, danger, and information

| Role | Source token | Dark value | Pairing / ratio |
|---|---|---:|---|
| Success fill / tonal text | keep `color.dark.success` | `#4CC28A` | 7.29:1 on surface; 5.67:1 on success container |
| Success active | add `color.dark.successDarken` | `#36A874` | 5.44:1 on surface; 5.14:1 with on-success |
| On success fill | add `color.dark.onSuccess` | `#0B2A1E` | 6.88:1 on fill |
| Success container | keep `color.dark.successContainer` | `#0F3A28` | on-container 9.34:1 |
| On success container | keep `color.dark.onSuccessContainer` | `#BFE6D2` | 9.34:1 |
| Warning fill / tonal text | keep `color.dark.warning` | `#E1A04A` | 7.24:1 on surface; 5.32:1 on warning container |
| Warning active | add `color.dark.warningDarken` | `#C78A36` | 5.52:1 on surface; 5.48:1 with on-warning |
| On warning fill | add `color.dark.onWarning` | `#2F1D05` | 7.18:1 on fill |
| Warning container | keep `color.dark.warningContainer` | `#4A3210` | on-container 9.02:1 |
| On warning container | keep `color.dark.onWarningContainer` | `#F7DCB1` | 9.02:1 |
| Danger fill / tonal text | change `color.dark.error` | `#EF8176` | 6.26:1 on surface; 5.06:1 on raised `#333028` (fixes A6) |
| Danger active | add `color.dark.errorDarken` | `#D96C61` | 4.86:1 on surface; 5.09:1 with on-error |
| On danger fill | add `color.dark.onError` | `#35100D` | 6.56:1 on fill |
| Danger container | keep `color.dark.errorContainer` | `#4A1F19` | on-container 9.32:1 |
| On danger container | keep `color.dark.onErrorContainer` | `#F7C8C1` | 9.32:1 |
| Information fill / tonal text | keep `color.dark.info` as cyan default alias | `#2CC4FF` | 8.11:1 on surface |
| On information fill | add `color.dark.onInfo` alias to onPrimary | `#06212C` | 8.28:1 |
| Information container | add `color.dark.infoContainer` alias to primaryContainer | `#04324D` | on-container 11.71:1 |
| On information container | add `color.dark.onInfoContainer` alias to onPrimaryContainer | `#DEF3FF` | 11.71:1 |
| On secondary | add `color.dark.onSecondary` | `#1A1814` | 10.20:1 on `#C9C4BA` |

`--pos` becomes `rgb(var(--v-theme-success))` and `--neg` becomes `rgb(var(--v-theme-error))` inside the dark selector. Their dark text contrasts become 7.29:1 and 6.26:1 on `#222019`. `--pos-soft` and `--neg-soft` map to the success/error containers. Light definitions remain unchanged.

For the remaining dark/light key parity in DS-06, add these dark tokens and map them in `maropostDark.colors`:

- `surfaceTint #2CC4FF`
- `blue50 #04141B`, `blue100 #04324D`, `blue200 #064F74`, `blue700 #75D6FF`, `blue900 #DEF3FF`
- `neutral100 #2E2B25`, `neutral200 #4A443A`

These keys are dormant today, but authored parity prevents Vuetify or future callers from falling back to light-only values.

### 2.7 Charts

Move the current light literals into tokens without changing values:

- `color.chart.light.axis1` through `axis5`: `#064F74`, `#0073AB`, `#0092D4`, `#2CC4FF`, `#75D6FF`.
- `color.chart.light.indigo.series1` through `series6`: `#3D4EDC`, `#7CC7F8`, `#4E7CF0`, `#2E3DB4`, `#5FA9F5`, `#4A63E4`; `axis1` through `axis5`: `#2E3DB4`, `#3D4EDC`, `#4E7CF0`, `#5FA9F5`, `#7CC7F8`.
- `color.chart.light.ocean.series1` through `series6`: `#0077C8`, `#2BC5B4`, `#0092D4`, `#0A4FA8`, `#00ACC8`, `#1361B8`; `axis1` through `axis5`: `#0A4FA8`, `#0077C8`, `#0092D4`, `#00ACC8`, `#2BC5B4`.
- `color.chart.light.aurora.series1` through `series6`: `#4A55E8`, `#B87CEE`, `#6E5FF0`, `#2440C9`, `#9A6CF2`, `#5D3FD3`; `axis1` through `axis5`: `#2440C9`, `#4A55E8`, `#6E5FF0`, `#9A6CF2`, `#B87CEE`.

The dark default series become:

| Token | Value | Ratio on `#222019` |
|---|---:|---:|
| `color.chart.dark.series1` | `#2CC4FF` | 8.11:1 |
| `series2` | `#B6E8FF` | 12.40:1 |
| `series3` | `#0092D4` | 4.70:1 |
| `series4` | `#75D6FF` | 9.95:1 |
| `series5` | `#0073AB` | 3.14:1 |
| `series6` | `#DEF3FF` | 14.26:1 |
| `series7` | `#00ADF1` | 6.40:1 |
| `series8` | `#5ABEE8` | 7.73:1 |
| `series9` | `#0084BD` | 3.91:1 |

Add exact dark alternatives under `color.chart.dark.<palette>.seriesN`:

- `indigo`: `#7389FF` (5.24), `#7CC7F8` (8.83), `#91A5FF` (7.01), `#6075F2` (4.13), `#5FA9F5` (6.58), `#8395FA` (5.93).
- `ocean`: `#45A9F0` (6.35), `#4ED6C6` (9.12), `#2CC4FF` (8.11), `#3D99E8` (5.37), `#33C4D5` (7.76), `#559FE8` (5.83).
- `aurora`: `#7D87FF` (5.26), `#CE98F5` (7.32), `#9B8CFF` (5.89), `#6A7AEF` (4.38), `#BC8CF7` (6.39), `#9877EC` (4.80).

Parenthesized values are contrast ratios on `#222019`; every mark clears 3:1. Add these exact axis tokens:

- `color.chart.dark.axis1` through `axis5`: `#0073AB`, `#0084BD`, `#0092D4`, `#00ADF1`, `#2CC4FF`
- `color.chart.dark.indigo.axis1` through `axis5`: `#6075F2`, `#7389FF`, `#8395FA`, `#91A5FF`, `#7CC7F8`
- `color.chart.dark.ocean.axis1` through `axis5`: `#3D99E8`, `#559FE8`, `#2CC4FF`, `#33C4D5`, `#4ED6C6`
- `color.chart.dark.aurora.axis1` through `axis5`: `#6A7AEF`, `#9877EC`, `#7D87FF`, `#9B8CFF`, `#CE98F5`

Add chart chrome tokens:

| Token | Value | Target |
|---|---:|---|
| `color.chart.dark.axisLabel` | `rgba(236, 236, 236, 0.60)` | 5.80:1 on surface |
| `color.chart.dark.legendLabel` | `rgba(236, 236, 236, 0.72)` | 7.76:1 |
| `color.chart.dark.grid` | `#7E7B75` | 3.86:1 on surface |
| `color.chart.dark.tooltipBackground` | `#333028` | overlay tier |
| `color.chart.dark.tooltipText` | `#ECECEC` | 11.15:1 |
| `color.chart.dark.tooltipBorder` | `#878683` | 3.62:1 on tooltip |

Legends and dashed/marker differentiation remain mandatory so series identity does not depend on hue alone.

### 2.8 Shadows and elevation pairing

Keep `shadow.sm/md/lg` as the light values. Add:

- `shadow.dark.sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.32)`
- `shadow.dark.md`: `0 8px 24px -10px rgba(0, 0, 0, 0.48)`
- `shadow.dark.lg`: `0 18px 48px -16px rgba(0, 0, 0, 0.56)`

Expose:

- `--elevation-raised`: dark `shadow.dark.sm`
- `--elevation-overlay`: dark `shadow.dark.md`
- `--elevation-modal`: dark `shadow.dark.lg`

Elevation never substitutes for a boundary: L2/L3/L4 surfaces also receive the border assigned in §3.

### 2.9 AI and ink-panel corrections

- Change `color.dark.aiAccent.border` from `#2E3D69` to `#5B73A8`; contrast on `aiAccent.soft #1B2440` becomes 3.25:1.
- Add `color.light.aiAccent.actionGradientFrom #7C3AED`, `actionGradientMid #2563EB`, `actionGradientTo #0E7490`, `actionOnGradient #FFFFFF`. White contrast is 5.70:1, 5.17:1, and 5.36:1 across the stops.
- Add `color.dark.aiAccent.actionGradientFrom #60A5FA`, `actionGradientMid #4388F7`, `actionGradientTo #22D3EE`, and `actionOnGradient #0B1530`; dark ink contrast is 7.10:1, 5.24:1, and 9.98:1 across the stops.
- Add `color.light.aiAccent.orbitOnFill #FFFFFF` and `color.dark.aiAccent.orbitOnFill #FFFFFF`; this tokenizes DS-15 without changing its current appearance.
- Change `color.dark.inkPanel.bg` to `#3A352D`, `border` to `#878683`; keep `fg #F7F5F2`, `mutedFg rgba(247,245,242,0.64)`, and `accent #2CC4FF`. Foreground/muted/accent/border contrast on the new panel is 11.17:1 / 5.63:1 / 6.05:1 / 3.34:1.

## 3. Surface hierarchy

| Level | Surface assignment | Token | Border | Shadow |
|---|---|---|---|---|
| L0 | App canvas, route background, sunken wells, kanban/group wells | `--surface-canvas` / `--surface-sunken` (`#1A1714`) | `--border-subtle` when a well boundary is essential | none |
| L1 | Main content surface, standard cards, tables, AppBar | `--surface-primary` (`#222019`) | standard cards/tables use `--border-subtle` | none |
| L1 nested | Nested/inset cards, table headers, grouped controls | `--surface-secondary` (`#2E2B25`) | `--border-subtle` | none |
| L2 | Raised cards, sticky toolbars, floating bulk bar | `--surface-raised` (`#2A2820`) | `--border-subtle` | `--elevation-raised` |
| L3 | Dropdowns, menus, popovers, tooltips | `--surface-overlay` (`#333028`) | `--border-default` | `--elevation-overlay` |
| L4 | Modals, confirm dialogs, drawers | `--surface-overlay` (`#333028`) over `--scrim-overlay` | `--border-default` | `--elevation-modal` |
| AI L1 | Assistant/copilot outer panel | `--dv-muted` (`#181A23`) | `--dv-border` (`#5B73A8`) | none/drawer elevation |
| AI L2 | AI rationale/cards and interactive panels | `--dv-accent-soft` (`#1B2440`) | `--dv-border` | raised only when floating |
| Branded ink | Floating bulk bar / editorial callout | `--ink-panel-bg` (`#3A352D`) | `--ink-panel-border` (`#878683`) | L2 only |

Navigation is intentionally separate:

- The interior of `AppSidebar` continues to use the selected `data-sidebar` skin (`white`, `gray`, or `dark`).
- App dark mode does not recolor those skin tokens.
- The seam against the canvas uses the skin's own border; all six sidebar-skin × app-theme combinations remain supported and are represented in Storybook.
- `MpSectionRail` is in-content navigation, not a global skin; it uses L1/L1-nested app surfaces.

Preview exceptions are scoped, not inherited:

- Storefront/email/landing-page preview canvases may show customer-authored colors, while their editor chrome uses this hierarchy.
- The POS terminal simulation, presentation deck, showcase, reel cards, and external map tiles retain their content-specific look as enumerated in §5; surrounding controls still use semantic app surfaces.

## 4. Accent colour treatment

### 4.1 Source token values

Each value lives in `color.<mode>.accent.<accent>.<role>`.

#### Light

| Accent | Default | Hover | Active | Selected bg | Subtle bg | Focus ring | On accent | Container / on-container |
|---|---|---|---|---|---|---|---|---|
| cyan | `#0073AB` | `#005E8A` | `#004A6D` | `#DEF3FF` | `#EFF9FF` | `#0073AB` | `#FFFFFF` | `#DEF3FF` / `#04324D` |
| blue | `#2D63E8` | `#1E449B` | `#173777` | `#EBF0FF` | `#F4F6FF` | `#2D63E8` | `#FFFFFF` | `#EBF0FF` / `#1E449B` |
| gray | `#4B5563` | `#374151` | `#1F2937` | `#E5E7EB` | `#F3F4F6` | `#4B5563` | `#FFFFFF` | `#E5E7EB` / `#1F2937` |
| purple | `#7C3AED` | `#6D28D9` | `#5B21B6` | `#EDE9FE` | `#F5F3FF` | `#7C3AED` | `#FFFFFF` | `#EDE9FE` / `#4C1D95` |

Light contrast, in the same row order:

- Default/on-accent: cyan 5.20:1, blue 5.17:1, gray 7.56:1, purple 5.70:1.
- Hover/on-accent: 7.08:1, 8.92:1, 10.31:1, 7.10:1.
- Active/on-accent: 9.54:1, 11.36:1, 14.68:1, 8.98:1.
- Container/on-container: 11.71:1, 7.83:1, 11.86:1, 9.23:1.
- Selected/subtle fills separate from white by only 1.14/1.07, 1.14/1.08, 1.24/1.10, and 1.19/1.10. They therefore require the accent keyline and selected icon; they are not sole state cues.

#### Dark

| Accent | Default | Hover | Active | Selected bg | Subtle bg | Focus ring | On accent | Container / on-container |
|---|---|---|---|---|---|---|---|---|
| cyan | `#2CC4FF` | `#59D1FF` | `#00ADF1` | `#243A3E` | `#233030` | `#2CC4FF` | `#06212C` | `#04324D` / `#DEF3FF` |
| blue | `#60A5FA` | `#7CB6FB` | `#4388F7` | `#2C353D` | `#282D30` | `#60A5FA` | `#0B1530` | `#172A52` / `#DCE7FF` |
| gray | `#94A3B8` | `#B0BCCB` | `#7C8A9D` | `#343532` | `#2D2D29` | `#94A3B8` | `#111827` | `#303743` / `#E8ECF2` |
| purple | `#C084FC` | `#D0A3FF` | `#AA63F5` | `#3B303D` | `#322A30` | `#C084FC` | `#24103D` | `#321B52` / `#F0E5FF` |

Dark contrast, in the same row order:

- Default on `#222019`: cyan 8.11:1, blue 6.41:1, gray 6.36:1, purple 6.17:1.
- On-accent/default: 8.28:1, 7.10:1, 6.92:1, 6.53:1.
- On-accent/hover: 9.50:1, 8.54:1, 9.21:1, 8.52:1.
- On-accent/active: 6.54:1, 5.24:1, 5.05:1, 4.78:1.
- Container/on-container: 11.71:1, 11.36:1, 10.10:1, 12.27:1.
- Focus rings equal the opaque defaults; all clear 6.17:1 on the primary surface and 4.99:1 on the brightest overlay.
- Selected/subtle fills separate from the primary surface by 1.36/1.19, 1.31/1.17, 1.32/1.18, and 1.30/1.17. They always ship with an opaque accent keyline and selected icon.

### 4.2 Runtime and CSS structure

`ACCENT_DEFS` becomes a generated-token-backed structure:

```ts
type AccentModeDef = {
  default: string
  hover: string
  active: string
  selectedBackground: string
  subtleBackground: string
  focusRing: string
  onAccent: string
  container: string
  onContainer: string
}

type AccentDef = Record<ThemeMode, AccentModeDef>
```

No hex or RGB literal remains in `useAppTheme.ts`.

`setAccent` must only update reactive state, `data-accent`, and storage. `setMode` must only update state, `data-theme`, storage, and the Vuetify theme name. Neither function may mutate `vuetifyTheme.themes.value[*].colors`.

`accentHex` becomes a computed value of `ACCENT_DEFS[accent.value][mode.value].default`. This preserves JavaScript consumers without mutating Vuetify.

`accent-presets.css` becomes the only non-default accent bridge, but all values reference generated properties:

- separate `[data-accent] .v-theme--maropostLight` and `[data-accent] .v-theme--maropostDark` blocks;
- set `--v-theme-primary`, `--v-theme-info`, `--v-theme-on-primary`, `--v-theme-primary-container`, and `--v-theme-on-primary-container` from generated RGB properties;
- set all `--accent-*` aliases from generated hex properties;
- do not override `--v-theme-secondary`;
- do not define a cyan block. Removing `data-accent` restores the untouched canonical theme.

The unconditional `App.vue` boot calls become harmless and may remain. Storybook uses the same generated CSS bridge via `data-theme` and `data-accent`; it must not call `useAppTheme`.

## 5. Migration approach

### 5.1 Tokens to add or change

Add/change the exact tokens specified in §§2–4. The implementation checklist is:

- surface roles: `surfaceRaised`, `surfaceOverlay`, `surfaceSunken`, `surfaceLight`, `interactiveDefault/Hover/Active/Disabled`, `scrim`;
- text/icon roles: `textSecondary`, `textDisabled`, `iconPrimary/Secondary/Disabled`;
- boundary roles: `borderStrong`, `borderHover`, `focusRing`, and the revised border/table values;
- all `accent.<key>.<role>` values in both modes;
- feedback on-fill, active, info-container, surface-tint, dark blue/neutral parity keys;
- revised dark `error`, `aiAccent.border`, `inkPanel.bg/border`;
- dark chart palettes/chrome;
- dark shadows.

Change `build.mjs` only to emit derived RGB CSS variables from resolved hex color tokens and to recurse nested shadow groups in the optional Tokens Studio export. Do not alter the normal token flattener, alias semantics, existing TS constant names, or generated-file locations.

### 5.2 Renames and compatibility aliases

No destructive `tokens.json` rename occurs in this release; Vuetify-facing `surfaceVariant`, `surfaceBright`, `primaryDarken`, and container names remain.

CSS alias migration:

- `--surface-0` → `--surface-canvas`
- `--surface-1` → `--surface-primary`
- `--surface-2` → `--surface-secondary`
- `--ink` → `--text-primary`
- `--muted` → `--text-muted`
- `--hairline` → `--border-subtle`
- `--accent` → `--accent-default`
- `--accent-fg` → `--accent-on`
- `--accent-ink` → `--accent-active`
- `--accent-soft` → `--accent-subtle-bg`

Old aliases remain as one-release references to the new names. New code must not use them.

### 5.3 Deprecations and removals

- Remove `mb-foundation.tokens.css` immediately after its sole production consumer migrates.
- Remove `marobase-tokens.css` immediately after `surface-light` and elevation ownership move to canonical tokens/theme.
- Remove `styles/tokens.scss` after both Vite and Storybook inject generated `_variables.scss`.
- Keep `color.light.daVinci.*` / `color.dark.daVinci.*` as deprecated aliases to `aiAccent` for one release; do not add consumers.
- Keep numbered surface and short text/accent CSS aliases for one release, documented as deprecated.
- Keep sidebar skin CSS. It is not deprecated.

### 5.4 Hardcoded values to remove

- `AppBar.vue:899-907`: fixed assistant hover gradient and white foreground → `--dv-action-gradient` / `--dv-action-on-gradient`.
- `AppBar.vue:919-922, 974-977, 1423-1426, 1566-1569, 1727-1730, 1775-1778`: low-alpha focus rings → `--accent-focus-ring`.
- `AppBar.vue:1443-1447`: primary→secondary gradient and `#fff` → AI action gradient/foreground.
- `global.scss:243-246`: primary at 0.36 → `--accent-focus-ring`.
- `global.scss:596-599`: black scrollbar alpha → semantic border tokens.
- `settings-form.scss:69-70` and error-ring counterpart: 0.12 alpha rings → focus/error focus tokens.
- `chartPalette.ts:51, 54-71, 125`: hardcoded chart arrays/axis and light tooltip → generated light/dark tokens and reactive mode.
- `ChartThemesView.vue:185-366`: all 14 hex literals → semantic surfaces/text/borders/accent.
- `DashboardChartWidget.vue` marker stroke ternary → `rgb(var(--v-theme-surface))`.
- `StorefrontPreview.vue:333`: light on-primary → `--accent-on`.
- `DvOrbitVoiceSurface.vue:438`, `DvOrbitMicBar.vue:103/113`, and `DvOrbitOrb.vue:127`: white fills → `--dv-orbit-on-fill`.
- `mp-theme-aliases.css:27,40-43,80,87-88,97`: hardcoded hover, pos/neg, tint/sidebar values → generated/Vuetify semantics.
- `CommerceCloudLanding.vue:190-486`: all `--mb-color-*` references → semantic aliases.

Intentional fixed-look literals listed in §5.9 are not part of this removal list.

### 5.5 Components and views grouped by package

- WP-03: `App.vue`, `DvRefineDialog.vue`, `DvExpandDialog.vue`, and the complete `CommerceCloudLanding.vue` migration. WP-12 only verifies that route.
- WP-04: `AppBar.vue`, `AppSidebar.vue`, `MpSectionRail.vue`, `SettingsSidebar.vue`, `SettingsLayout.vue`, `MerchandisingLayout.vue`, `StoreEditorLayout.vue`, `StoreEditorSidebar.vue`, and the three sidebar skin files.
- WP-05/06: `MpPageHeader.vue`, `MpSectionHeader.vue`, `MpDataTableToolbar.vue`, `MpFilterTabs.vue`, `MpFloatingBulkBar.vue`, `MpRowActionsMenu.vue`, `MpStatusToggle.vue`, `MpOptionCard.vue`, `JourneyFlowColumn.vue`, and global/settings styles.
- WP-07: `MpFormDrawer.vue`, `MpDateRangeSelect.vue`, `MpFolderSelect.vue`, `MpManageFoldersDrawer.vue`, `MpMoveToFolderDialog.vue`, `MpBuilderShell.vue`, `WidgetEditStep.vue`, `RolePicker.vue`, `PermissionMatrix.vue`, `InviteUsersDrawer.vue`, `UserAccessDrawer.vue`; routed builder/settings/PLG forms are verification scope.
- WP-08: `MpKpiCard.vue`, all 13 `components/dashboards/**/*.vue` files, `DashboardView.vue`, `retail-widgets.scss`, `Retail/Transactions.vue`, `Retail/Locations.vue`, `SalesChannelDetail.vue`, and the `--pos`/`--neg` use in `AppBar.vue`.
- WP-09: `chartPalette.ts`, `DashboardChartWidget.vue`, `DashboardPieWidget.vue`, `DvChartCard.vue`, `LiveView.vue`, `ChartThemesView.vue`, `PaletteScope.vue`.
- WP-10: `MpFormDrawer.vue`, `MpConfirmDialog.vue`, `MpRowActionsMenu.vue`, `MpBuilderPreviewDialog.vue`, `DashboardFormDialog.vue`, `WidgetWizardDrawer.vue`, `AddSectionDialog.vue`, `UserAccessDrawer.vue`, `InviteUsersDrawer.vue`, `Plg3dsDialog.vue`, `PlgTalkToSalesDialog.vue`, `DvHistoryDrawer.vue`, `DvRefineDialog.vue`, `DvExpandDialog.vue`; representative raw overlay call sites are `JourneyBuilder.vue`, `SQLQueries.vue`, `CampaignReports.vue`, and `DashboardView.vue`.
- WP-11: `MpDaVinciBot.vue`, `AppBar.vue`, `dv-tokens.css`, `dv-orbit.css`, all 23 `components/copilot/**/*.vue` files, and `DaVinciAI.vue`, `DaVinciCopilot.vue`, `DaVinciExperience.vue`.
- WP-12: `MpEmptyState.vue`, `MpErrorState.vue`, `MpTableSkeleton.vue`, `MpStatusChip.vue`, `MpUsageMeter.vue`, `ModuleLandingPage.vue`, `MpFloatingBulkBar.vue`, `CommerceCloudLanding.vue`, `StorefrontPreview.vue`, `ChartThemesView.vue`, and `global.scss`.

Files in verification scope do not have to change when they already resolve through the corrected semantic layer.

### 5.6 Storybook updates

- Add an `accent` global toolbar (`cyan`, `blue`, `gray`, `purple`) in `.storybook/preview.ts`.
- The decorator sets `data-theme` and `data-accent` only; it does not mutate Vuetify themes.
- Add pinned dark stories for AppBar, AppSidebar (six skin×mode combinations), outlined forms, KPI cards, status chips, empty/error/loading states, drawers/dialogs, all chart widgets, StorefrontPreview, and the AI assistant/voice surfaces.
- Update `Foundation/Colors.stories.ts` for new semantic/accent/chart tokens and `Foundation/RadiusShadows.stories.ts` for dark shadow roles.
- Update the relevant co-located stories whenever their component changes; do not create Storybook-only colors.

### 5.7 Chart migration

Refactor `chartPalette.ts` to expose a `useChartTheme()` composable that calls `useTheme()` once in setup and selects `CHART_THEMES[palette][mode]`. Consumers migrate from module-global light arrays to the composable. `applyChartTheme` is returned from that composable and emits:

- mode-correct series and axis arrays;
- `tooltip.theme: 'dark' | 'light'`;
- semantic label, legend, grid, tooltip background/text/border;
- unchanged font, spacing, markers, dash patterns, and gradient behavior.

Do not use `document.dataset` as chart reactivity and do not duplicate theme state in a chart-only ref.

### 5.8 Verification, implementation order, and rollback

The only automated checks required are:

- `npm run type-check`
- `npm run build`
- `npm run build-storybook`
- `npm run audit:ui`

`npm run tokens:build` is a generation step, not a test. No lint, unit-test, or visual-regression command may be claimed; those scripts do not exist or are stale.

Order is mandatory: tokens and generated outputs → theme/accent mapping → aliases/duplicate retirement → component categories → Storybook/docs. Reversing that order would create temporary component-level colors and duplicate decisions.

Each WP lands as one checkpoint commit including its generated outputs and story changes. Rollback means `git revert <that-WP-commit>`; never use a hard reset. WP-01 token changes are additive/superseding, so reverting the single WP-01 commit restores both source and generated files. If a later package depends on a reverted package, revert dependents in reverse order.

### 5.9 Route/component coverage ledger and intentional exceptions

| Reachable category | Package |
|---|---|
| Dashboard/Get Started/Dashboard list | WP-08, WP-09, WP-12 |
| All Analytics routes | WP-08/09/12; `LiveView` chrome adapts |
| Contacts/Audience routes | WP-05/06/07/10/12 through shared data/form components |
| Products and Commerce routes | WP-05/06/07/08/10/12 |
| Merchandising shell and all child routes | WP-04/05/06/07/08/09/10/12 |
| Retail routes | WP-05/06/07/08/10/12 |
| Sales Channels/store editor routes | WP-04/05/06/07/08/10/12 |
| Marketing builders/lists/content routes | WP-05/06/07/08/10/12 |
| Service routes | WP-05/06/07/10/12 |
| Da Vinci routes | WP-11 |
| App Store/Integrations | WP-05/06/08/12 |
| Settings, Billing, Plans, Signup, Checkout | WP-04/05/06/07/10/12 |
| Design-system demo | WP-12/13 |
| Commerce Cloud landing | WP-12; must migrate, not exempt |
| Chart Themes | WP-09/12; must migrate, not exempt |

Explicit fixed-look exceptions:

1. `Retail/PosPreview.vue`: the simulated POS terminal screen is deliberately theme-independent. Its 114 fixed-color occurrences remain. Any route-level close/back control outside the simulated terminal must use app tokens. Confirm this product decision before implementation; absent confirmation, migrate it in WP-12 rather than silently excluding it.
2. `Deck/DeckView.vue`, `Deck/DeckSlide.vue`, and all 16 files in `Deck/slides/` (`S01Title`, `S02Agenda`, `S03Morning`, `S03Problem`, `S04ReelCue`, `S05WhatThisIs`, `S06LiveStats`, `S07TourMap`, `S08LayerModel`, `S09StorybookContract`, `S10ThemeFlip`, `S11Workflow`, `S12Convergence`, `S13Asks`, `S14Faq`, `S15Closer`): fixed stakeholder presentation artboards; no app-theme adaptation.
3. `Showcase/ShowcaseView.vue` and `Showcase/sections/{ShowcaseHero,ShowcaseStatsBar,ShowcaseWall,ShowcaseRecipes}.vue`: fixed branded showcase composition; no app-theme adaptation.
4. `Reel/ReelView.vue`, `Reel/ReelFlyView.vue`, and `Reel/cards/{ReelWordmarkCard,ReelChaosCard,ReelTypeCard,ReelStatsCard}.vue`: fixed motion/title-card artwork; no app-theme adaptation.
5. `Analytics/LiveView.vue` OpenStreetMap tile imagery: external tiles remain light; map controls, legends, popovers, and surrounding cards adapt in WP-09/10.
6. Customer content inside `StorefrontPreview.vue`, `StoreThemeBuilder.vue`, `EmailContentEditor.vue`, and `LandingPageEditor.vue`: the preview content follows the customer-authored theme; editor chrome adapts. `StorefrontPreview`'s default `--sf-on-brand` defect is still fixed.
7. `dv-tokens.css` WebGL orb/ring literal stops: fixed brand-rendering inputs remain; assistant action gradients and UI text do not qualify for this exception.
8. Sidebar `white`/`gray`/`dark` skins: intentional independent chrome choices, tested in both app modes.

## 6. Work packages

### WP-01 — Foundation and semantic tokens

**Scope:** Add the complete semantic structure and exact values in §§2–4 to `tokens.json`, update the generator to emit derived RGB custom properties for hex colors, and regenerate all outputs. This package contains no component or theme mapping.

**Files likely to change:**

- `src/design-tokens/tokens.json`
- `src/design-tokens/build.mjs`
- `src/design-tokens/generated/_variables.scss`
- `src/design-tokens/generated/variables.css`
- `src/design-tokens/generated/tokens.ts`

**Acceptance criteria:**

- Every named token/value in §§2–4 exists exactly once in `tokens.json`.
- Generated hex, RGB, SCSS, and TS names follow the existing path convention.
- Existing generated token names remain present.
- No generated file is hand-edited.
- Default light surface/text values are byte-identical; only the explicit purple/focus additions differ.
- Dark border minimums, text pairings, accent pairs, and chart series equal the ratios listed in this plan.

**Dependencies:** None.

**Tests to run:** generation step `npm run tokens:build`; then `npm run type-check`, `npm run build`.

**Expected visual effect:** None yet; this creates the authoritative vocabulary downstream packages consume.

### WP-02 — Vuetify mapping and accent runtime bridge

**Scope:** Map every authored dark semantic key into Vuetify and remove all runtime theme-bucket mutation. Make accent definitions mode-aware and generated-token-backed; make non-default accent CSS theme-specific. This is the A1 fix.

**Files likely to change:**

- `src/plugins/maropostTheme.ts`
- `src/composables/useAppTheme.ts`
- `src/styles/accent-presets.css`
- `src/App.vue` only if boot comments/calls need clarification

**Acceptance criteria:**

- `maropostDark.colors` has explicit parity for all 15 previously missing keys.
- `on-success`, `on-warning`, `on-error`, `on-secondary`, and `on-info` use authored deep inks.
- No assignment to `bucket.colors` remains in `useAppTheme.ts`.
- No hex/RGB literal remains in `ACCENT_DEFS`.
- Default cyan dark remains `#2CC4FF/#06212C` after `setAccent('cyan')`, `setMode('dark')`, and app boot.
- Non-default dark accents use the exact §4 values; their text pairs are all at least 4.5:1.
- `accent-presets.css` has no selector combining light and dark and does not override `secondary`.
- The base `maropostLight.colors` values do not change.

**Dependencies:** WP-01.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run audit:ui`.

**Expected visual effect:** Dark primary buttons, links, chips, and focus accents become bright enough to read while preserving each selected accent's hue; the app and Storybook stop disagreeing.

### WP-03 — Global surfaces, aliases, and duplicate-layer retirement

**Scope:** Install the semantic alias layer, surface/elevation roles, and single ownership of Vuetify variables. Remove the two duplicate CSS color systems and preserve their only legitimate dependencies through canonical tokens.

**Files likely to change:**

- `src/styles/mp-theme-aliases.css`
- `src/styles/app-styles.ts`
- `src/styles/mb-foundation.tokens.css` (delete)
- `src/styles/marobase-tokens.css` (delete)
- `src/plugins/maropostTheme.ts`
- `src/components/copilot/DvRefineDialog.vue`
- `src/components/copilot/DvExpandDialog.vue`
- `src/views/Commerce/CommerceCloudLanding.vue`

**Acceptance criteria:**

- `app-styles.ts` no longer imports either duplicate file.
- No hand-authored `--v-theme-*` source remains outside Vuetify's theme generation and accent bridge.
- All new aliases exist for both modes and teleported `.v-theme--maropostDark` roots.
- `surface-light` preserves `#FAFAFA` light / `#2A2820` dark through canonical theme mapping.
- `CommerceCloudLanding.vue` has zero `--mb-*` references before `mb-foundation.tokens.css` is deleted.
- Legacy aliases resolve to the new names without value drift.
- Dark L0–L4 assignments match §3; no component-level surface hex is introduced.
- Light selectors retain their existing surface values.

**Dependencies:** WP-01, WP-02.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** All app routes share one warm-charcoal depth model; teleported content and ordinary cards no longer depend on stylesheet insertion order.

### WP-04 — Navigation

**Scope:** Apply app surfaces to AppBar/in-content rails while preserving the independent sidebar skin architecture. Verify all six app-mode × sidebar-skin combinations and remove any app-dark selector that leaks into a skin.

**Files likely to change:**

- `src/components/layout/AppBar.vue`
- `src/components/layout/AppSidebar.vue`
- `src/components/layout/AppBar.stories.ts`
- `src/components/layout/AppSidebar.stories.ts`
- `src/components/MpSectionRail.vue`
- `src/components/MpSectionRail.stories.ts`
- `src/components/settings/SettingsSidebar.vue`
- `src/components/saleschannels/StoreEditorSidebar.vue`
- `src/views/Settings/SettingsLayout.vue`
- `src/views/Merchandising/MerchandisingLayout.vue`
- `src/views/SalesChannels/StoreEditorLayout.vue`
- `src/styles/sidebar-dark.css`
- `src/styles/sidebar-white.css`
- `src/styles/sidebar-gray.css`
- `src/styles/shell-variants.css`

**Acceptance criteria:**

- AppBar uses L1; dropdown surfaces are deferred to WP-10 but already inherit L3.
- AppSidebar interiors still use only `--sidebar-*`.
- White, gray, and dark skins remain selectable in both app modes.
- Skin textFaint remains tertiary/decorative; no essential body copy uses the 3.80:1 pairing identified in A3's context risks.
- `MpSectionRail` uses app semantic surfaces because it is content navigation.
- No sidebar dimension, rail behavior, active logic, or brand mark changes.
- All navigation text/icon/control boundaries meet the §2 targets.

**Dependencies:** WP-03.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** Navigation feels coherent at the canvas seam without erasing Maropost's user-selectable sidebar personalities.

### WP-05 — Typography and icons

**Scope:** Replace mode-dependent text/icon opacity stacks and fixed icon colors with the text/icon hierarchy. Confirm source-cloud accents remain chip/icon-only and do not become body text.

**Files likely to change:**

- `src/styles/global.scss`
- `src/styles/source-cloud-colors.css`
- `src/components/MpPageHeader.vue`
- `src/components/MpSectionHeader.vue`
- `src/components/MpDataTableToolbar.vue`
- `src/components/MpFilterTabs.vue`
- `src/components/MpIllustration.vue`
- `src/components/MpUsageMeter.vue`
- their co-located stories

**Acceptance criteria:**

- Body/heading text uses `--text-primary`; helper/meta text uses secondary or muted; disabled text uses `--text-disabled` without added opacity.
- Icons use the matching icon aliases or semantic feedback/accent colors.
- Essential text is at least 4.5:1; essential icons at least 3:1.
- No `color="medium-emphasis"` prop remains where the intent is Vuetify's `text-medium-emphasis` class.
- Source-cloud colors remain paired with labels and are not used as body/link text.
- Typography sizes, weights, spacing, and copy remain unchanged.

**Dependencies:** WP-03.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** Dark text hierarchy becomes clear without pure-white glare or washed-out helper copy.

### WP-06 — Borders and interaction states

**Scope:** Fix A2/A3 globally: visible borders, dividers, focus, hover, active, selected, and disabled states. Centralize state styling so controls do not re-author alpha values.

**Files likely to change:**

- `src/styles/mp-theme-aliases.css`
- `src/styles/global.scss`
- `src/styles/settings-form.scss`
- `src/components/layout/AppBar.vue`
- `src/components/MpDataTableToolbar.vue`
- `src/components/MpFilterTabs.vue`
- `src/components/MpOptionCard.vue`
- `src/components/MpStatusToggle.vue`
- `src/components/marketing/JourneyFlowColumn.vue`
- corresponding stories

**Acceptance criteria:**

- Resting/hover/strong boundaries use `#7E7B75/#878683/#9B9A98` and clear 3:1 on every assigned surface.
- Global focus, field focus, AppBar pills/results/create controls, and command rows use the active accent's opaque focus token; no 0.12/0.18/0.36/0.45 focus mix remains.
- Selected backgrounds are never the only cue: keyline/icon and ARIA/current state remain.
- Disabled text is 4.72:1 on the primary surface; disabled controls remain operably disabled.
- Hover/active geometry and component dimensions do not change.
- Light values change only for the documented focus correction.

**Dependencies:** WP-02, WP-03, WP-05.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** Cards and controls regain calm, visible edges; keyboard focus is obvious without becoming larger or more saturated.

### WP-07 — Forms and controls

**Scope:** Apply the corrected state tokens to all design-system forms, drawers' form content, builders, settings, RBAC, and PLG controls. Do not redesign forms.

**Files likely to change:**

- `src/styles/settings-form.scss`
- `src/components/MpFormDrawer.vue`
- `src/components/MpDateRangeSelect.vue`
- `src/components/MpFolderSelect.vue`
- `src/components/MpManageFoldersDrawer.vue`
- `src/components/MpMoveToFolderDialog.vue`
- `src/components/MpBuilderShell.vue`
- `src/components/dashboards/wizard/WidgetEditStep.vue`
- `src/components/rbac/RolePicker.vue`
- `src/components/rbac/PermissionMatrix.vue`
- `src/components/rbac/InviteUsersDrawer.vue`
- `src/components/rbac/UserAccessDrawer.vue`
- `src/components/plg/Plg3dsDialog.vue`
- `src/components/plg/PlgTalkToSalesDialog.vue`
- related stories and routed settings/builder/PLG views only where they bypass shared chrome

**Acceptance criteria:**

- Outlined fields use visible resting/hover/focus/error borders and rings from semantic tokens.
- Placeholder/helper/error/disabled text meets the assigned hierarchy; error text on L3/L4 uses `#EF8176` and is 5.06:1.
- Checkbox, radio, switch, date, select, autocomplete, combobox, and textarea controls have a 3:1 essential boundary/focus indicator.
- Form drawers remain drawers; no dialog/layout/density/spacing changes.
- No form component creates its own dark selector or color literal.

**Dependencies:** WP-06.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** Inputs are legible and clearly interactive in dark mode while retaining their current size and quiet styling.

### WP-08 — Cards, dashboard widgets, and feedback states

**Scope:** Apply surface/elevation/feedback roles to cards and dashboards, fix `--pos`/`--neg`, and reconcile the two KPI implementations on one semantic trend source without merging their APIs.

**Files likely to change:**

- `src/components/MpKpiCard.vue`
- all 13 `src/components/dashboards/**/*.vue` files
- `src/views/DashboardView.vue`
- `src/styles/retail-widgets.scss`
- `src/views/Retail/Transactions.vue`
- `src/views/Retail/Locations.vue`
- `src/views/SalesChannels/SalesChannelDetail.vue`
- `src/components/layout/AppBar.vue`
- related stories

**Acceptance criteria:**

- `MpKpiCard` and `DashboardKpiWidget` both resolve positive/negative trend text through the same success/error semantics.
- Dark `--pos/#4CC28A` and `--neg/#EF8176` are 7.29:1 and 6.26:1 on L1.
- Currency text no longer uses `#007A3A/#CC272E` in dark mode.
- Major cards use L1 + subtle border; raised widgets use L2 + paired elevation; no heavy shadow is introduced.
- Flat feedback fills use authored deep on-colors; tonal status chips retain label+color and at least 4.5:1.
- No KPI/chart/card layout, metric copy, or spacing changes.

**Dependencies:** WP-03, WP-05, WP-06.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** Metrics remain visually dominant, trend signals become readable, and widget depth is consistent rather than shadow-heavy.

### WP-09 — Charts and data visualization

**Scope:** Make all Apex chart palettes, axis marks, labels, legends, grid, and tooltip chrome mode-aware. Migrate the routed Chart Themes page and preserve non-color series cues.

**Files likely to change:**

- `src/plugins/chartPalette.ts`
- `src/components/dashboards/widgets/DashboardChartWidget.vue`
- `src/components/dashboards/widgets/DashboardPieWidget.vue`
- `src/components/copilot/DvChartCard.vue`
- `src/views/Analytics/LiveView.vue`
- `src/views/ChartThemes/ChartThemesView.vue`
- `src/views/ChartThemes/PaletteScope.vue`
- their stories

**Acceptance criteria:**

- No dark chart uses a light series array or `tooltip.theme: 'light'`.
- Every dark series/axis mark uses the exact arrays in §2.7 and clears 3:1 on L1.
- Labels/legend text clear 4.5:1; shown grid lines clear 3:1.
- Tooltip uses dark chrome and 11.15:1 text, with a 3.62:1 border.
- `ChartThemesView.vue` has zero hex literals and follows L0–L3 surfaces in both modes.
- `DashboardChartWidget` marker stroke always uses themed surface.
- Legends, dashes, markers, and labels remain; no series is identified by hue alone.
- OSM tiles remain the declared exception; controls/popovers adapt.

**Dependencies:** WP-01, WP-02, WP-03, WP-08.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** Charts stop looking pasted from a light page; marks remain distinguishable and tooltips become calm dark overlays.

### WP-10 — Menus, popovers, modals, and drawers

**Scope:** Apply L3/L4 surfaces, borders, scrim, and elevation to design-system overlays and representative raw Vuetify overlays. This closes DS-13's verification gap without replacing overlay components or form patterns.

**Files likely to change:**

- `src/components/MpFormDrawer.vue`
- `src/components/MpConfirmDialog.vue`
- `src/components/MpRowActionsMenu.vue`
- `src/components/MpBuilderPreviewDialog.vue`
- `src/components/dashboards/DashboardFormDialog.vue`
- `src/components/dashboards/WidgetWizardDrawer.vue`
- `src/components/saleschannels/AddSectionDialog.vue`
- `src/components/rbac/UserAccessDrawer.vue`
- `src/components/rbac/InviteUsersDrawer.vue`
- `src/components/plg/Plg3dsDialog.vue`
- `src/components/plg/PlgTalkToSalesDialog.vue`
- `src/components/copilot/DvHistoryDrawer.vue`
- `src/components/copilot/DvRefineDialog.vue`
- `src/components/copilot/DvExpandDialog.vue`
- representative call sites `JourneyBuilder.vue`, `SQLQueries.vue`, `CampaignReports.vue`, `DashboardView.vue`
- related stories

**Acceptance criteria:**

- Menus/popovers/tooltips use L3; modals/drawers use L4 and semantic scrim.
- Teleported roots receive dark aliases without component-level theme selectors.
- Overlay boundaries clear 3:1; text and controls keep their §2 ratios.
- Snackbar/progress/tooltip/menu representative call sites contain no overriding light surface.
- Drawer widths, modal dimensions, placement, and behavior remain unchanged.
- Forms remain in `MpFormDrawer`; confirmation remains in `MpConfirmDialog`.

**Dependencies:** WP-03, WP-06, WP-07.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** Floating UI reads as a deliberate layer above the canvas instead of a bright or borderless patch.

### WP-11 — AI assistant surfaces

**Scope:** Route the two AppBar failures and voice on-fill literals through the existing AI family, strengthen the AI border, and verify every copilot/voice/Da Vinci route. Preserve fixed WebGL brand inputs.

**Files likely to change:**

- `src/styles/dv-tokens.css`
- `src/styles/dv-orbit.css`
- `src/components/layout/AppBar.vue`
- `src/components/MpDaVinciBot.vue`
- all 23 `src/components/copilot/**/*.vue` files
- `src/views/DaVinci/DaVinciAI.vue`
- `src/views/DaVinci/DaVinciCopilot.vue`
- `src/views/DaVinci/DaVinciExperience.vue`
- relevant stories

**Acceptance criteria:**

- AppBar assistant hover and Ask icon use `--dv-action-gradient` and `--dv-action-on-gradient`; no fixed white or primary→secondary gradient remains.
- All action-gradient stops meet 4.5:1 with their foreground in both modes.
- Dark AI border is `#5B73A8` and 3.25:1 on `#1B2440`.
- Voice success/mic/inverse fills use `--dv-orbit-on-fill`.
- Existing AI text remains at least 7.8:1 where audited.
- WebGL orb/ring literals remain only in the declared fixed-rendering token block.
- No AI layout, conversation behavior, or animation is redesigned.

**Dependencies:** WP-01, WP-03, WP-05, WP-06.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** AI controls retain their blue/violet identity, but labels and icons remain readable across every gradient and dark panel.

### WP-12 — Remaining states, route sweep, and fixed-look boundaries

**Scope:** Finish the product-wide sweep: empty/loading/error/disabled states, Commerce Cloud, StorefrontPreview, scrollbars, ink panels, Chart Themes backstop, and every route-family/exception in §5.9.

**Files likely to change:**

- `src/components/MpEmptyState.vue`
- `src/components/MpErrorState.vue`
- `src/components/MpTableSkeleton.vue`
- `src/components/MpStatusChip.vue`
- `src/components/MpUsageMeter.vue`
- `src/components/ModuleLandingPage.vue`
- `src/components/MpFloatingBulkBar.vue`
- `src/views/Commerce/CommerceCloudLanding.vue`
- `src/components/saleschannels/StorefrontPreview.vue`
- `src/views/ChartThemes/ChartThemesView.vue`
- `src/styles/global.scss`
- routed files named in §5.9 only when the sweep finds an audited bypass
- related stories

**Acceptance criteria:**

- Commerce Cloud has zero `--mb-*` references and uses the canonical warm-charcoal system.
- StorefrontPreview default `--sf-on-brand` is `--accent-on`; customer-authored preview colors remain scoped.
- Scrollbar resting/hover uses subtle/default border tokens and clears 3:1 on all app surfaces.
- Dark ink panel uses `#3A352D/#878683` and retains the listed text ratios.
- Empty/loading/error/disabled states always explain state; no blank card is introduced.
- `ChartThemesView.vue` remains hex-free.
- Every route family in §5.9 is checked; every exception is either confirmed or migrated. No new silent exception is allowed.
- `audit:ui` findings for hardcoded colors are either removed or annotated in the fixed-look ledger.

**Dependencies:** WP-04 through WP-11.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** Dark mode becomes product-wide, including uncommon routes, without recoloring simulated customer/POS/presentation content.

### WP-13 — Storybook parity and coverage

**Scope:** Make Storybook reproduce app theme/accent behavior and document dark states. Do not introduce Storybook-only tokens or mutate Vuetify themes.

**Files likely to change:**

- `.storybook/preview.ts`
- `.storybook/main.ts`
- `src/stories/Foundation/Colors.stories.ts`
- `src/stories/Foundation/RadiusShadows.stories.ts`
- all co-located stories changed by WP-04 through WP-12, especially AppBar, AppSidebar, forms, KPI/status/feedback, chart, overlay, StorefrontPreview, and copilot/voice stories

**Acceptance criteria:**

- Theme and accent toolbar combinations resolve through the same CSS/token path as the app.
- Default cyan dark renders `#2CC4FF`, matching the app.
- Pinned dark stories exist for every critical component category and all chart widgets.
- Six sidebar-skin × mode stories exist.
- Foundation stories show the new surface, text, border, accent, feedback, chart, and elevation roles.
- Story canvas uses theme background and contains no fixed light backdrop.
- No story defines a private color token.

**Dependencies:** WP-02 through WP-12.

**Tests to run:** `npm run type-check`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** Storybook becomes a trustworthy dark-mode contract rather than a preview that happens to avoid the app's runtime bug.

### WP-14 — Documentation and cleanup

**Scope:** Document ownership, migration aliases, route exceptions, contrast contracts, and remove the final legacy SCSS injection. Record the one-release deprecations and their removal condition.

**Files likely to change:**

- `docs/design-system.md` and/or the existing `docs/design-system/` color/theme reference
- `docs/development.md`
- `CLAUDE.md`
- `AGENTS.md`
- `vite.config.ts`
- `.storybook/main.ts`
- `src/styles/tokens.scss` (delete)
- `src/styles/app-styles.ts`

**Acceptance criteria:**

- Vite and Storybook inject generated `_variables.scss`, not `styles/tokens.scss`.
- `styles/tokens.scss`, `mb-foundation.tokens.css`, and `marobase-tokens.css` are absent.
- Documentation identifies `tokens.json` as the only color source and explains generated RGB properties.
- The light-protection rule, surface hierarchy, accent bridge, sidebar independence, fixed-look exceptions, and chart contracts are documented.
- Deprecated alias names and one-release removal timing are explicit.
- No docs instruct contributors to add component-level dark hexes or Storybook-only tokens.

**Dependencies:** WP-13.

**Tests to run:** `npm run type-check`, `npm run build`, `npm run build-storybook`, `npm run audit:ui`.

**Expected visual effect:** None; future contributors get one unambiguous dark-mode architecture and the duplicate systems cannot return accidentally.
