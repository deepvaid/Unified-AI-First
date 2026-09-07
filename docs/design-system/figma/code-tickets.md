# Code tickets raised by the Marobase Figma build

Findings from reverse-engineering the app into the Figma design system (Sept 2026). Each item is a place where
the Figma system deliberately does **not** copy the code because the code contradicts itself, its own tokens, or
an accessibility floor. Figma holds the intended value; these are the fixes the code side owes.

Source: `docs/design-system/figma/variable-plan.json` (conflicts list), the approved plan
(`~/.claude/plans/you-are-a-principal-purrfect-avalanche.md` §1–§3) and the three audit sweeps that fed it.

## Token / theme conflicts

| # | Finding | Where | Figma decision | Fix |
|---|---|---|---|---|
| T1 | `layout.appbarHeight` = 60 but the bar renders 56 (`v-app-bar height="56"`) | `tokens.json`, `layout/AppBar.vue` | `layout/appbar` = 56 | Set the token to 56 and consume it in AppBar |
| T2 | `component.builder.panelWidth` = 380 defined; `MpBuilderShell` uses prop literals 220 / 300 | `tokens.json`, `MpBuilderShell.vue` | `layout/builder-left` 220, `layout/builder-right` 300 | Replace the token with `builder.leftWidth` / `rightWidth` (220 / 300) and consume them |
| T3 | `--focus-ring` and `--surface-interactive-selected` are pinned to cyan in `mp-theme-aliases.css`; `accent-presets.css` never overrides them → blue/gray/purple accounts get cyan focus rings | `src/styles/mp-theme-aliases.css`, `accent-presets.css` | `accent/focus-ring`, `accent/selected-bg` live in the accent group | Rebind both to `--accent-focus-ring` / `--accent-selected-bg` in the preset blocks |
| T4 | 14 colour keys exist only in dark (`borderStrong`, `borderHover`, `focusRing`, `infoContainer`, `onInfo`, `onInfoContainer`, `surfaceLight`, dark `blue.*`/`neutral.*` overrides…), 3 only in light (`navIconStudio`, `navSurfaceGray`, `dv.experienceBg`) | `tokens.json` color.light / color.dark | Every variable has an explicit value in both modes (light info container = primaryContainer, as the theme does) | Declare the missing side explicitly so the two themes have the same key set |
| T5 | Two AI gradient systems: `dv.grad*` vs `aiAccent.actionGradient*`, and `dv.heroGrad*` dark stops (`#A78BFA / #60A5FA / #22D3EE`) differ from `dv.grad*` dark (`#8B5CF6 / #3B82F6 / #06B6D4`) | `tokens.json` aiAccent / dv | `ai/gradient/*` (identity) + `ai/action-gradient/*` (buttons); Hero paint style reuses `ai/gradient/*` | Decide one identity gradient; alias heroGrad to grad or document why dark differs |
| T6 | Dark shadows differ in **geometry**, not just alpha (md `0 8 24 -6` vs light `0 2 16 -8`; lg `0 18 48 -12` vs `0 8 32 -12`) | `tokens.json` shadow.dark.* | Separate `Elevation/Dark/*` effect styles, tints bound to `color/shadow/*` | Unify geometry so one style per level serves both modes; vary only the tint |
| T7 | Non-standard Inter weights 450 / 550 / 650 / 750 (21 uses) — Inter static has no such faces | `tokens.json` text.*, component styles | Mapped to Regular / Medium / Semi Bold / Bold; true number kept in style descriptions | Standardise on 400 / 500 / 600 / 700 (or ship Inter Variable and document it) |
| T8 | `text.eyebrow` ≡ `text.metaLabel` (11 / 600 / +0.06em / uppercase) | `tokens.json` | One `Body/Eyebrow` style | Retire `metaLabel`, alias to `eyebrow` |
| T9 | Studio frame background is a `#f9f9f9` literal | `App.vue` `.mp-content-frame` | Not tokenised in Figma either — uses `surface/canvas` | Add a `surface.frame` token or reuse `neutral.50` |
| T10 | `radius.20` has one consumer; `component.chart.height` one consumer; `menu.railWidth`, `cloud.retail.link*`, `dv.fogTint` single-use | `tokens.json` | Excluded from the Figma set | Remove or fold into the consumer |
| T11 | `moduleTile.*` hues have no alias-layer name; components reach for raw `--mp-color-light-moduleTile-*` (theme-specific) | `ModuleLandingPage.vue` | `hue/<hue>/{accent,ink}` with the raw name as code syntax | Add `--hue-<hue>` / `--hue-<hue>-ink` aliases in `mp-theme-aliases.css` (both themes) |
| T12 | `cloud.*` colours duplicate `moduleTile.*` hues by value (commerce = green, marketing = violet, analytics = blue, contacts = cyan, service = indigo, retail = teal); `neto` and `merchandising` data sources have no colour tokens | `tokens.json`, `source-cloud-colors.css`, `MpSourceCloudChip.vue` | `cloud/*` kept as its own group (chip identity); 6 clouds | Alias `cloud.*` to `hue.*`; add `neto` and `merchandising` tokens or map them explicitly |
| T13 | `dv.orbit.*` — 56 voice-surface tokens form a parallel semantic ramp (ink / slate / body / mist / surface / line…) | `dv-tokens.css`, `DvOrbitVoiceSurface.vue` | Not variables; Voice Surface page binds the app’s `surface/text/border` roles | Migrate the voice surface onto the shared roles and delete the parallel ramp |
| T14 | Chart palettes: `grayBlue` is the only shipping palette; `ocean / grayBlueGold / social` + 4 gradient twins and the 9-series “default” ramp are `?chart=` demo overrides | `chartPalette.ts`, `App.vue` | `chart/*` = grayBlue only | Move demo palettes behind a flag or delete; keep the token file to one palette |
| T15 | Accent presets blue / gray / purple exist at runtime (`[data-accent]`) while Marobase declares one accent | `accent-presets.css`, `useAppTheme.ts` | Cyan only; a future 4-mode Accent collection is documented | Product decision: keep as an account setting (then build the Accent collection) or remove |
| T16 | JetBrains Mono is declared but not available to designers; Fira Code (the declared fallback) is | `tokens.json` fontFamily.mono | `Code/Mono` uses Fira Code | Confirm the mono stack or install JetBrains Mono for design |

## Accessibility findings (from the audit sweep — fix in code, never reproduce)

| # | Finding | Count / where | System rule |
|---|---|---|---|
| A1 | Data tables have no accessible name; `show-select` tables have unlabelled row checkboxes | 112 / 112 `v-data-table`; 24 with `show-select` | Data Table pattern: `aria-labelledby` from the toolbar title; labelled select-all header; row checkbox labels |
| A2 | Status conveyed by colour alone — three `status-dot` systems and ~54 bare `text-error/success/warning` spans | `Retail/Registers.vue`, `SalesChannelDetail.vue`, `Billing.vue`, `Inventory.vue` | Status Chip = text + tone (+ icon); dot only with an adjacent label |
| A3 | `outline: none` with no `:focus-visible` replacement | `DvHistoryDrawer.vue:221`, `Plg/SignupView.vue:800`, `StoreContentEditor.vue:316`, `PosPreview.vue:3839` | Every interactive set ships a focus state: 2px `accent/focus-ring`, 2px offset |
| A4 | `size="x-small"` (~20px) interactive controls in row chrome | 111 sites | Minimum interactive size 32 (sm) / 40 (md); 24×24 target is the floor |
| A5 | `v-card @click` with no `role` / `tabindex` / keyboard handler | 5 | Option Card is the only selectable card |
| A6 | Field validation without live announcement (`error-messages` 65 vs `aria-live` 13) | forms app-wide | Field error state + Form Error Summary (`role="alert"`) |
| A7 | Two `h1` on one page (`MpPageHeader` + raw `<h1>`) | `SalesChannelDetail.vue` | Page Header owns the single h1; Section Header owns h2/h3 |
| A8 | Outlined-button border ≈ 1.23:1 (open finding P5.5-15) | `.v-btn--variant-outlined` | Outline button uses `border/strong` (3:1 control boundary) — a design decision to confirm |
| A9 | Local disabled opacity overrides | `PosPreview.vue:4043`, `AddSectionDialog.vue:354` | `text/disabled` stays visible; no opacity tricks |
| A10 | Icon button without `aria-label`; `<v-icon @click>` not focusable | `CreateAbCampaign.vue:427`, `AudienceView.vue:95` | Icon Button always has a name; never bind click to `v-icon` |

## Duplicates the Figma system merged (code should follow)

Chat bubble ×5 → Chat Bubble · prompt composer ×4 (+2 mic) → AI/Prompt Composer + AI/Mic Control · suggestion chip ×7 → AI/Suggestion Chip · AI insight card ×5 → AI/Insight Card · provenance chip ×3 → AI/Provenance Chip · toast stack ×2 → Toast · shimmer ×4 → AI/Generating Skeleton · disclaimer wording ×3 → AI/Disclaimer Caption · section heading systems ×3 → Section Header · KPI tile systems ×5 (incl. `DvKpiRow`) → KPI Card · nav-item styles ×8 → Nav Item · avatar sizes ×15 → Avatar (24/32/40/56) · `.summary-line` ×2 → Summary List · `DashboardView` ↔ `DashboardGradientView` 96 % identical (route meta, not a second view).
