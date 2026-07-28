# 02 — Design-System Audit (Dark Mode)

**Agent:** Design-System Audit Agent (model: `claude-sonnet-5-thinking-max`, read-only)
**Method:** Static source read of the theme/token pipeline plus representative components in every requested category. No rendering performed — findings are source-level; render-dependent claims are labeled as such. Findings carry stable IDs (`DS-##`) for cross-reference from `04-implementation-plan.md` and later audits.
**Severity scale:** Critical (breaks the dark-mode value prop or a whole route) · High (visibly wrong on common surfaces) · Medium (visible but contained) · Low (latent/inconsistency, no active symptom).

---

## Top issues (ranked)

1. **DS-01** [Critical] Runtime accent bridge silently overwrites the tuned dark `primary`/`info`/containers with light-mode hex — happens for the **default cyan accent too**, on every page load.
2. **DS-02** [Critical] `ChartThemesView.vue` is a fully hardcoded white page with zero dark adaptation, routed and reachable.
3. **DS-03** [High] Two structurally different dark palettes (`tokens.json` warm charcoal vs. `mb-foundation.tokens.css` cool navy) bind to the same CSS selectors; `CommerceCloudLanding.vue` renders entirely from the navy one.
4. **DS-04** [High] Chart series/axis colors and tooltip chrome never switch to dark; dark chart tokens exist but are unused.
5. **DS-05** [High] Global scrollbar thumb is fixed near-black, low-visibility on dark surfaces.
6. **DS-06** [High] `maropostDark` omits 15 color keys `maropostLight` defines, including four unauthored auto-synthesized `on-*` semantic pairs.
7. **DS-07** [Medium] `--pos`/`--neg` semantic aliases (trend/currency +/-) have no dark override across 9 consumer files.
8. **DS-08** [Medium] `marobase-tokens.css` hand-duplicates Vuetify's own `--v-theme-*` custom properties in parallel with Vuetify's injected stylesheet.
9. **DS-09** [Medium] AppBar assistant-pill hover and command-menu "Ask" icon use fixed hex gradients instead of the `aiAccent`/`--dv-*` token family.
10. **DS-10** [Medium] `StorefrontPreview.vue`'s `--sf-on-brand` is pinned to the light `onPrimary` token while every sibling variable in the same block is theme-reactive.

---

## Findings by area

### Application backgrounds / canvas

**DS-11** [Low] `inkPanel.bg`/`fg`/`accent` are byte-identical between `color.light.inkPanel` and `color.dark.inkPanel` (`tokens.json:366-373` vs `570-577`) — the one surface designed to read as an "inverted, always-dark" panel loses its distinguishing contrast against the canvas once the canvas itself goes dark.
- **Existing behavior:** Same `#1a1814` bg / `#f7f5f2` fg in both themes.
- **Recommended direction:** Give dark-mode `inkPanel` a value distinct from `color.dark.background`/`surface` (e.g., a touch lighter, or keep it as the one deliberately-bold panel) so it still reads as "inverted" once the surrounding canvas is also dark.
- **Token/component:** `tokens.json` `color.dark.inkPanel.*`.
- **Accessibility:** Reduced panel-to-canvas separation, not a text-contrast failure.

### Primary / secondary surfaces & elevated surfaces (cards, popovers, raised elements)

**DS-03** [High] Two competing dark palettes bound to identical selectors.
- **Location:** `src/styles/mb-foundation.tokens.css:139-149` (`--mb-color-background:#0c1a2b`, `--mb-color-surface:#12253d`, `--mb-color-primary:#59c2ff`) vs `tokens.json` `color.dark.background:#1a1714`/`surface:#222019`, both scoped to `[data-theme='dark']`/`.v-theme--maropostDark`.
- **Existing behavior:** `CommerceCloudLanding.vue` (34 `var(--mb-color-*)` references) renders navy while every neighboring Commerce page renders warm charcoal.
- **Recommended direction:** Pick the `tokens.json` warm-neutral family as canonical (it is the documented SSOT); migrate `CommerceCloudLanding.vue` to `--mp-*`/`--v-theme-*`/semantic aliases, then remove or fully alias-through `mb-foundation.tokens.css`'s dark color block so it cannot reintroduce a second palette.
- **Token/component:** `tokens.json` `color.dark.*` (canonical); `mb-foundation.tokens.css` (to reconcile); `CommerceCloudLanding.vue` (to migrate).
- **Accessibility:** Two independently-authored palettes means two independent, unreconciled contrast reviews — not itself a failure, but removes any single audit trail.

**DS-08** [Medium] Duplicate `--v-theme-*` source.
- **Location:** `src/styles/marobase-tokens.css:1-127` hand-sets `--v-theme-background`, `--v-theme-surface`, etc. as literal hex at `:root`/`[data-theme="dark"]`, in parallel with Vuetify's own runtime `<style id="vuetify-theme-stylesheet">` injection driven by `maropostTheme.ts`.
- **Existing behavior:** Dark values currently match `tokens.json` by coincidence of manual duplication, not by reference; light values already show minor independent drift. Cascade winner depends on DOM insertion order at runtime (not verifiable statically).
- **Recommended direction:** Retire `marobase-tokens.css` as a color source (it predates the `design-tokens/` pipeline per its own "Design Kit" comment header); if any of its non-color values are still needed, keep only those.
- **Token/component:** `src/styles/marobase-tokens.css`.
- **Accessibility:** Maintainability/drift risk that can silently produce a future contrast regression when only one of the two sources gets updated.

**DS-12** [Low] `DashboardChartWidget.vue` marker stroke uses a redundant runtime ternary (`vuetifyTheme.global.current.value.dark ? 'rgb(var(--v-theme-surface))' : '#ffffff'`) instead of always referencing the token, since `--v-theme-surface` already resolves to white in light mode.
- **Recommended direction:** Always use `rgb(var(--v-theme-surface))`. Cosmetic/consistency only — no visible defect today.

### Panels, drawers, modals; overlays

No project-level `v-menu`/`v-dialog`/`v-snackbar` color overrides were found in `maropostDefaults` (`maropostTheme.ts:172-250`), so native overlays inherit Vuetify's theme-driven surface colors by default. `MpFormDrawer.vue` and `MpConfirmDialog.vue` — the two design-system overlay components — source colors from `rgb(var(--v-theme-*))`/`var(--mp-*)` with no bypasses found.

**DS-13** [Recommendation, not a defect] This is a coverage gap in verification, not a known bug: no representative usage of a raw `v-menu`/`v-tooltip`/`v-snackbar` was checked at the call site for a component-level override. The independent audit (`06`) should spot-check at least one of each in dark mode.

### Cards & widgets

**DS-14** [Medium] Two KPI-card implementations use two different color systems for the same semantic (trend up/down).
- **Location:** `MpKpiCard.vue` uses Vuetify's theme-paired `success`/`error` colors; `DashboardKpiWidget.vue:341-349` uses `var(--pos)`/`var(--neg)` (see DS-07) for the visually-identical trend pill.
- **Recommended direction:** Standardize both on the same semantic source once DS-07 gives `--pos`/`--neg` proper dark pairing (or alias them to `success`/`error` outright).
- **Token/component:** `MpKpiCard.vue` (reference-correct), `DashboardKpiWidget.vue` (to align).
- **Accessibility:** Inconsistent contrast tuning between two widgets a user will visually equate.

Confirmed sound on static read: `MpFormDrawer`, `MpEmptyState`, `MpTableSkeleton`, `MpConfirmDialog`, `MpStatusChip` (default `variant="tonal"`, verified `MpStatusChip.vue:15`), `AppSidebar.vue` active/hover state classes — all source color from `rgb(var(--v-theme-*))` / `var(--mp-*)` / Vuetify semantic props.

### Borders & dividers

**DS-05** [High] Global scrollbar thumb fixed near-black.
- **Location:** `src/styles/global.scss:596-599` — `::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); }`, hover `rgba(0,0,0,0.28)`.
- **Existing behavior:** Over dark surfaces (`#222019`/`#1a1714`), a black-alpha overlay yields very low luminance separation — the thumb becomes hard to see, affecting every scrollable list/table/drawer in the product.
- **Recommended direction:** Swap to an on-surface-relative value, e.g. `rgba(var(--v-theme-on-surface), 0.18)` resting / `0.30` hover, mirroring the pattern `MpTableSkeleton.vue` already uses correctly.
- **Token/component:** Global `::-webkit-scrollbar-thumb` rule; every scrollable region.
- **Accessibility:** WCAG 1.4.11 (non-text contrast) at global scale.

Vuetify's own `border-color`/`border-opacity` theme variables (`#000000`@0.12 light / `#FFFFFF`@0.12 dark, library defaults) are left un-overridden by either `maropostLight` or `maropostDark` (`maropostTheme.ts` defines no `variables` block) — generic `v-divider`/outlined-field borders already adapt correctly. See `03-accessibility-audit.md` for whether the *authored* `outline`/`borderSubtle` tokens meet non-text contrast, which is a distinct question from this structural finding.

### Text hierarchy (primary, secondary, muted, disabled)

Dark `textPrimary` (`#ececec`), `textMuted`/`onSurfaceVariant` (`#b3aa97`) are both defined with dedicated dark values (`tokens.json:530-537`) — not pure white, already aligned with the "avoid pure-white text" design direction. `on-primary` for dark (`#06212c`, near-black on the bright `#2CC4FF`) is a deliberate ink choice, also aligned with "avoid pure white" but on the *other* side of the pairing.

**DS-10** [Medium] `StorefrontPreview.vue` one hardcoded light-only token among theme-reactive siblings.
- **Location:** `src/components/saleschannels/StorefrontPreview.vue:333` — `--sf-on-brand: var(--mp-color-light-onPrimary);` inside a block where `--sf-brand`, `--sf-bg`, `--sf-text` all correctly alias `--accent`/`--surface-1`/`--ink` (theme-reactive).
- **Existing behavior:** Consumed as `color` at lines 527, 538, 706 — text/icon drawn on brand-colored fills inside the storefront-preview widget always uses the light `onPrimary`, even when the admin shell is in dark mode.
- **Recommended direction:** Change to `var(--accent-fg)` (already defined and theme-paired in `mp-theme-aliases.css`) to match its sibling variables' pattern.
- **Token/component:** `StorefrontPreview.vue:333`; compare `--accent-fg` in `mp-theme-aliases.css`.
- **Accessibility:** If light/dark `onPrimary` differ enough, the three consuming sites risk a contrast failure in whichever theme wasn't the authoring default — quantified in `03-accessibility-audit.md`.

### Icons

**DS-15** [Low] Hardcoded white icon fills in two AI voice components (`DvOrbitVoiceSurface.vue` `.dv-orbit__success-check-icon{color:#ffffff}`, `DvOrbitMicBar.vue` mic/slash icons `background/color:#ffffff`).
- **Existing behavior:** Currently sits on theme-aware gradient/solid backgrounds designed to keep white legible; no confirmed failure from source alone.
- **Recommended direction:** Introduce a semantic `--dv-orbit-on-fill` token (even if its value is white in both themes today) so future palette tuning can't silently break it.
- **Token/component:** `DvOrbitVoiceSurface.vue`, `DvOrbitMicBar.vue`.
- **Accessibility:** No confirmed failure; flagged for lack of a semantic seam.

### Inputs & form controls

Reviewed `settings-form.scss` (the documented single owner of field chrome per `maropostTheme.ts:190-191`'s own comment) and the global focus ring. Contrast-specific findings (hairline/outline strength, placeholder opacity, focus-ring alpha) are quantified with computed ratios in `03-accessibility-audit.md` — this document covers the token-architecture angle:

**DS-16** [Medium] Field borders/hairlines source from `borderSubtle`/`outline`/`outlineVariant` tokens that are visibly *authored* per-theme (not hardcoded), but the dark values were tuned toward "soft/recede" without a documented contrast check against `03`'s findings. This is a token-value tuning issue, not a missing-token or bypass issue — flag for `04` to resolve jointly with the accessibility findings rather than treating as a separate architectural gap.

### Buttons

**DS-09** [Medium] AppBar duplicates the AI gradient outside its token family.
- **Location:** `src/components/layout/AppBar.vue:899-904` (`.assistant-pill:hover`) — literal `linear-gradient(125deg, #4f8ef5 0%, #7c5cff 45%, #9a5cff 72%, #5b44d6 100%)` + fixed `color:#ffffff`, regardless of theme. Comment says it intentionally mirrors "the landing Da Vinci button," but the canonical `--dv-grad` token (`dv-tokens.css`) is not referenced even for the light-mode value.
- **Recommended direction:** Replace with `var(--dv-grad)` (or equivalent) so future AI-accent tuning (including any dark-specific tuning) propagates automatically.
- **Token/component:** `AppBar.vue:899-904`; canonical `--dv-grad` in `dv-tokens.css`.
- **Accessibility:** No confirmed failure in isolation; the issue is duplication/drift risk.

**DS-17** [Medium] Command-menu "Ask" icon gradient risks low contrast in dark mode.
- **Location:** `AppBar.vue:1443-1447` — `background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary))); color:#fff;`.
- **Existing behavior:** Dark `secondary` (`#c9c4ba`, a light warm tan) sits at one end of the gradient; fixed white text/icon color on that light end is a plausible contrast risk, quantified in `03-accessibility-audit.md`.
- **Recommended direction:** Use a semantic on-color instead of literal `#fff`, or constrain the gradient to two stops close enough in lightness that a single fixed foreground stays safe in both themes.
- **Token/component:** `AppBar.vue:1443-1447`.

Confirmed sound: `settings-form.scss` hover/focus color-mix patterns and the global `:focus-visible` ring *mechanism* (both theme-aware by construction) — see `03` for whether the *values* clear non-text-contrast thresholds.

### Navigation

**DS-18** [Medium, conditional] Dark sidebar skin (`data-sidebar="dark"`) uses a deliberately-authored navy palette (`sidebar-dark.css:6-19`, `--sidebar-bg:#22304b`) independent of the app-wide light/dark toggle. Sidebar skin and app theme are orthogonal (`AppSidebar` reads `data-sidebar`; app dark mode reads `data-theme`), so "dark sidebar + dark app theme" juxtaposes navy against warm charcoal at the sidebar/canvas seam, and "white/gray sidebar + dark app theme" is also reachable.
- **Recommended direction:** This is a product-scope question, not a pure bug — `04` should either explicitly bless all sidebar-skin × theme combinations as intentionally supported (Maropost's real product does offer independent chrome skins) or note a constraint. Do not silently change this behavior without a decision.
- **Token/component:** `sidebar-dark.css`/`sidebar-white.css`/`sidebar-gray.css`, gated by `data-sidebar`.
- **Accessibility:** None inherent — each skin has adequate internal self-contrast — this is a visual-cohesion question, not a contrast failure.

`AppSidebar.vue` active/hover nav-item states consistently use `var(--sidebar-*)` custom properties (verified ~lines 1315-1409) — state logic itself correctly delegates to whichever skin is active.

### Hover / active / selected / focus / disabled states

Covered per-component above (DS-09, DS-16, DS-17) and quantitatively in `03-accessibility-audit.md` (focus-ring and hairline contrast math). No additional structural/token-architecture findings beyond those already listed — Vuetify's own `disabled-opacity` variable is left at library default (unoverridden), so disabled-state token architecture is sound; whether the resulting *value* is legible enough is an accessibility question addressed in `03`.

### Loading / empty / error states

`MpTableSkeleton.vue`, `MpEmptyState.vue`, `MpErrorState.vue` (per component inventory) source color from theme-aware tokens on static read — no bypass found. No dedicated dark-mode override was found for Vuetify's native `v-progress-circular`/`v-progress-linear`, but neither is one needed: `maropostTheme.ts` defines no custom `variables` block, so these inherit Vuetify's own theme-aware progress-indicator colors by default. **DS-13 applies here too** — no live spinner usage was checked at the call site to rule out a component-level hex override; flag for the independent audit's rendered pass.

### Feedback colors (success / warning / danger / information)

**DS-06** [High] `maropostDark` missing 15 keys, including 4 unauthored `on-*` pairs.
- **Location:** `maropostTheme.ts:82-133` (`maropostLight.colors`) vs `136-169` (`maropostDark.colors`). Missing in dark: `on-secondary`, `on-success`, `on-error`, `on-warning`, `surface-tint`, `success-darken-1`, `warning-darken-1`, `error-darken-1`, `blue-50/100/200/700/900`, `neutral-100/200`.
- **Existing behavior:** Vuetify's `genOnColors()` auto-synthesizes the four `on-*` keys via luminance whenever a `color="success"` (etc.) flat-variant component renders in dark mode — live any time that pattern is used, but never authored/reviewed the way light mode's four `on-*` values were (light mode even carries a hand-written AA-guidance comment at `maropostTheme.ts:85-87` that has no dark counterpart and, per DS-06 itself, cannot apply in dark mode because `blue-*` doesn't exist there). The `-darken-1`/`blue-*`/`neutral-*` keys have no auto-fill and are simply absent; a targeted search for live consumers of those specific keys found none today (dormant, not an active bug).
- **Recommended direction:** Author explicit, reviewed `on-secondary`/`on-success`/`on-error`/`on-warning` values for `maropostDark` in `tokens.json` (matching light mode's rigor) rather than relying on the auto-generated fallback. Decide per dormant key whether to backfill for future-proofing or formally document as light-only.
- **Token/component:** `tokens.json` (author dark `onSuccess`/`onWarning`/`onError` — `onSecondary` already effectively covered by `textPrimary`/`textMuted` pairing, confirm during planning); `maropostTheme.ts:136-169`.
- **Accessibility:** Auto-generated `on-*` colors are a plausible, unreviewed WCAG risk — quantified with the actual fill colors in `03-accessibility-audit.md`.

**DS-07** [Medium] `--pos`/`--neg` theme-blind semantic pair.
- **Location:** Definition `mp-theme-aliases.css:40-43` (static OKLCH literals). Consumers (9 files, verified): `AppBar.vue`, `DashboardKpiWidget.vue`, `DashboardSetupGuide.vue`, `DashboardView.vue`, `retail-widgets.scss`, `Retail/Transactions.vue`, `Retail/Locations.vue`, `Retail/PosPreview.vue`, `SalesChannels/SalesChannelDetail.vue`.
- **Existing behavior:** Identical raw OKLCH color used for "positive/negative" semantics in both themes, independent of the properly-dark-paired Vuetify `success`/`error` tokens used elsewhere (see DS-14).
- **Recommended direction:** Either alias `--pos`/`--neg` to `rgb(var(--v-theme-success))`/`rgb(var(--v-theme-error))`, or add explicit `.v-theme--maropostDark` overrides for all four, mirroring how `--mp-surface-tint` is already correctly overridden in the same file (`mp-theme-aliases.css:80`).
- **Token/component:** `mp-theme-aliases.css:40-43` + the 9 consumer files (component-level changes limited to swapping the var reference, not re-authoring each file's logic).
- **Accessibility:** OKLCH mid-lightness (0.5–0.55) is a known pitfall for serving both a near-white and a near-black background from one fixed value — quantified in `03`.

Source-cloud accent chips (`source-cloud-colors.css:18-28`) correctly lift *text* colors for dark mode but leave *accent* hues unchanged — flagged as **DS-19** [Low] since these accents are used as chip fills/icons (generally AA-safe by design as non-text UI), not as body text; `03` should confirm no body/link-text usage exists.

### Charts & visualizations

**DS-04** [High] Chart series/tooltip frozen to light regardless of app theme.
- **Location:** `chartPalette.ts:4-11,40-51` (`CHART_THEMES.blue` sources only `*_light_series*`), `54-71` (`indigo`/`ocean`/`aurora` hardcoded, no dark variant), `125` (`chartTooltipTheme = 'light' as const`), `173` (fed into every chart's `tooltip.theme`).
- **Existing behavior:** Every chart's line/bar/donut colors are identical in light and dark mode; ApexCharts renders its tooltip using its own light theme's chrome (white popover, dark text) regardless of the app's dark canvas — the tooltip is a first-class Apex light/dark switch that is pinned off.
- **Recommended direction:** Make `chartTooltipTheme` reactive to `vuetifyTheme.global.current.value.dark`; wire `mp_color_chart_dark_*` into `CHART_THEMES.blue`'s dark case; decide (in `04`) whether `indigo`/`ocean`/`aurora` get authored dark variants or are documented as light-only demo palettes (they are reachable via `?chart=` query override per `App.vue:70-80`, and via the `/chart-themes` compare page, but are not the product default).
- **Token/component:** `chartPalette.ts`; `tokens.json` `color.chart.dark.*` (already exists, unused).
- **Accessibility:** Every chart tooltip in the product would render as a bright white popover directly on the dark canvas on ordinary hover — high-frequency, high-visibility defect since charts appear on most dashboard/analytics pages. Series-color contrast against the dark canvas is quantified in `03`.

**DS-02** [Critical] `ChartThemesView.vue` fully hardcoded.
- **Location:** `<style>` block, e.g. `.ct-reference{background:#ffffff;border:1px solid #e5e7eb}`, `.ct-panel{background:#ffffff;...}`, `.ct-eyebrow{color:#1a56db}`, `.ct-lede{color:#4b5563}` — 14 hex literals total, none reference `--v-theme-*`/`--mp-*`.
- **Existing behavior:** Routed and reachable at `/chart-themes` (`router/index.ts:288`, `meta:{fullPage:true}`) — a real page any user navigating there in dark mode sees as a bright white rectangle in an otherwise-dark shell.
- **Recommended direction:** Replace hardcoded surfaces/text/borders with the same semantic tokens used elsewhere (`rgb(var(--v-theme-surface))`, `var(--mp-border-subtle)`, `var(--ink)`/`var(--muted)`), unless `04` determines this page is an internal-only palette-comparison tool intended to stay light-only — that determination should be explicit, not silent.
- **Token/component:** `src/views/ChartThemes/ChartThemesView.vue`.
- **Accessibility:** Severe luminance shock switching into this route while the rest of the app is dark.

### AI assistant panel (Da Vinci / copilot)

`tokens.json`'s `aiAccent` group has full, distinct, purpose-built light **and** dark variants (verified `tokens.json:334-347` / `538-550`) — this is the one AI-adjacent token group that already does dark mode correctly end-to-end. The gaps are in components that bypass it: DS-09 (AppBar assistant pill), DS-17 (Ask icon), DS-15 (voice icon white). No further architectural gap found in `MpDaVinciBot.vue`, `DvHistoryDrawer.vue`, `DvRefineDialog.vue` on static read — they consume `--dv-*` tokens correctly.

### Storybook dark-mode coverage

- The theme toolbar + `syncDocumentTheme()` mechanism (`.storybook/preview.ts:55-131`) is sound and theme-correct.
- **DS-20** [Medium] Storybook does not invoke `useAppTheme`'s `setAccent`/`setMode`, so today it shows the *correct, unpatched* dark primary while the running app shows the DS-01-affected value. Fixing DS-01 removes this divergence; until then, Storybook is not a reliable preview of the live app's dark mode for anything accent-related.
- **DS-21** [Low] No dedicated dark-mode story/parameter found for chart widgets (`DashboardChartWidget.stories.ts` and peers) — dark chart appearance is only reachable by manually toggling the global toolbar, not a documented/pinned story state.
- No hardcoded light backgrounds were found fighting the dark toolbar in a sample of story files reviewed.

---

## Coverage gaps / unresolved questions for later phases

- Rendered-DOM cascade winner between `marobase-tokens.css` and Vuetify's injected stylesheet (DS-08) — needs a runtime check.
- Whether `PosPreview.vue`, `Deck/*`, `Showcase/*` are intentionally fixed-look and exempt from dark-mode work — needs a product decision, captured in `04`.
- Whether all `data-sidebar` × `data-theme` combinations are intentionally supported (DS-18) — needs a product decision.
- No representative native `v-menu`/`v-tooltip`/`v-snackbar`/`v-progress-*` call site was checked for a component-level override (DS-13) — deferred to the independent audit's rendered pass.

## Explicit protections carried into planning

- No finding in this document proposes changing light-mode token values, layout, dimensions, spacing, or the brand accent hue itself. Every recommendation is additive/semantic-direction only (swap a hardcoded or theme-blind value for an existing-or-new token).
