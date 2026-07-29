# UI System Repository Discovery

> Single-pass audit of design-system consolidation scope: z-index usage, hard-coded colors, chart theming, overlay patterns, dead components, and toast/snackbar standardization.

## Prior Discovery

Two comprehensive discovery docs exist — do not duplicate:

- **`docs/overlay-audit/01-overlay-component-audit.md`** — Full overlay/primitive inventory, decision tree 2A, Vuetify default z-index reference
- **`docs/dark-mode/01-repository-discovery.md` & `docs/dark-mode/06-theme-architecture.md`** — Token architecture, variable strategy, light/dark theme split

## 1. Z-Index Inventory

Grep of all `z-index` declarations in src/components, src/views, and src/styles (excluding showcase surfaces: Deck/, Reel/, Showcase*, PosPreview.vue, scripts/trailer/).

| File | Line | Value | Classification | Note / Suggested Token |
|------|------|-------|-----------------|------------------------|
| src/App.vue | 238 | `1000` | (b) Raw literal | Should migrate to `var(--mp-zIndex-modal)` (2400) or new token if 1000 is intentional for app-level overlay |
| src/components/copilot/DvHistoryDrawer.vue | 225 | `40` | (b) Raw literal | Relative stacking inside drawer; justifiable local context but undocumented |
| src/components/copilot/DvHistoryDrawer.vue | 408 | `auto` | (a) Token-aware | Reset; acceptable |
| src/components/copilot/DvToastStack.vue | 46 | `var(--mp-zIndex-toast)` | (a) Uses token | ✓ Correct; 10000 ensures toast always on top |
| src/components/dashboards/DashboardGrid.vue | 315 | `3` | (c) Local relative | Justified; grid widget hover state within card |
| src/components/dashboards/DashboardGrid.vue | 342 | `4` | (c) Local relative | Justified; drag overlay above hover |
| src/components/dashboards/DashboardWidgetCard.vue | 375 | `2` | (c) Local relative | Justified; action menu within card |
| src/components/dashboards/widgets/DashboardTableWidget.vue | 203 | `1` | (a) Uses token (stickyHeader) | ✓ Correct; `var(--mp-zIndex-stickyHeader)` |
| src/components/layout/AppSidebar.vue | 1048 | `2` | (c) Local relative | Sidebar-internal relative stacking |
| src/components/layout/AppSidebar.vue | 1157 | `var(--mp-zIndex-navSidebarFlyout)` | (a) Uses token | ✓ Correct; 1005 |
| src/components/layout/AppSidebar.vue | 1442 | `var(--mp-zIndex-navSidebarTogglePill)` | (a) Uses token | ✓ Correct; 1010 |
| src/components/layout/AppSidebar.vue | 1466 | `1` | (c) Local relative | Justified; stacking within sidebar rail menu |
| src/components/marketing/landing/LandingBlockView.vue | 167 | `1` | (c) Local relative | Justified; relative stacking within hero block overlay |
| src/components/marketing/landing/LandingBlockView.vue | 184 | `1` | (c) Local relative | Justified; insertion point overlay |
| src/components/marketing/landing/LandingInsertionPoint.vue | 100 | `1` | (c) Local relative | Justified; insertion target within block preview |
| src/components/saleschannels/StorefrontPreview.vue | 582 | `1` | (c) Local relative | Justified; relative stacking in iframe preview context |
| src/components/saleschannels/StorefrontPreview.vue | 603 | `1` | (c) Local relative | Justified; relative stacking in iframe preview context |
| src/styles/global.scss | 421 | `var(--mp-zIndex-bulkActionBar)` | (a) Uses token | ✓ Correct; 100 |
| src/styles/settings-form.scss | 241 | `2` | (c) Local relative | Settings form field stacking; localized, acceptable |
| src/views/Analytics/LiveView.vue | 769 | `0` | (c) Local relative | Explicit reset in overlay context |
| src/views/Analytics/LiveView.vue | 796 | `1` | (c) Local relative | Relative stacking within chart overlay |
| src/views/Commerce/OrderDetail.vue | 558 | `1` | (c) Local relative | Detail view relative stacking |
| src/views/Contacts/ContactDetail.vue | 938 | `1` | (c) Local relative | Detail view relative stacking |
| src/views/DaVinci/DaVinciExperience.vue | 997 | `6` | (c) Local relative | Relative stacking within experience shell |
| src/views/DaVinci/DaVinciExperience.vue | 1020 | `9999` | (b) Raw literal | **CRITICAL**: Hardcoded 9999 should be documented or migrated to token. Intent unclear — may conflict with modal/toast layers. Recommend audit. |
| src/views/DaVinci/DaVinciExperience.vue | 1035 | `0` | (c) Local relative | Explicit reset |
| src/views/DaVinci/DaVinciExperience.vue | 1087 | `1` | (c) Local relative | Relative stacking within shell |
| src/views/Marketing/FormBuilder.vue | 843 | `1` | (c) Local relative | Form editor overlay within builder |
| src/views/Marketing/FormBuilder.vue | 848 | `2` | (c) Local relative | Form builder toolbar/panel stacking |
| src/views/Marketing/ImageLibrary.vue | 118 | `2` | (c) Local relative | Image library modal toolbar |
| src/views/Marketing/JourneyBuilder.vue | 826 | `4` | (c) Local relative | Journey builder canvas relative stacking |
| src/views/Marketing/JourneyBuilder.vue | 833 | `5` | (c) Local relative | Journey builder overlay on top of canvas |
| src/views/Plg/CheckoutView.vue | 326 | `var(--mp-zIndex-modal)` | (a) Uses token | ✓ Correct; 2400 |
| src/views/SalesChannels/StoreThemeBuilder.vue | 1280 | `5` | (c) Local relative | Theme editor relative stacking |

**Summary:** 34 total z-index declarations. 4 use tokens correctly (11%), 1 critical raw literal (9999), 1 questionable raw literal (1000), 28 justified local/relative stacking. **ACTION:** Audit DaVinciExperience 9999 intent; consider documenting local-stacking convention.

---

## 2. Hard-Coded Hex Inventory

Grep of all `#[0-9a-fA-F]{3,8}` patterns in src/components and src/views (excluding .stories.ts, showcase surfaces).

**High-hit files (5+ occurrences):**

| File | Count | Sample Hex Values | Location | Token Candidate |
|------|-------|-------------------|----------|-----------------|
| src/components/ModuleLandingPage.vue | 16 | `#2563eb`, `#7c3aed`, `#e11d48`, `#16a34a`, `#f59e0b`, `#0891b2`, `#4f46e5`, `#0d9488`, `#60a5fa`, `#a78bfa`, `#fb7185`, `#4ade80`, `#fbbf24`, `#22d3ee`, `#818cf8`, `#2dd4bf` | `<style scoped>` tint palette classes | Use `--mp-color-accent-*` semantic palette or define tint token scale in tokens.json |
| src/views/Service/ChatbotBuilder.vue | 8 | `#1F2933`, `#2563EB`, `#6D28D9`, `#7CB9D6`, `#7BC67B`, `#E9C74A`, `#DD7A3B`, `#C0559A`, `#fff` | Template (color swatches), styles (text color on brand) | Move swatch array to store/composable; use `--mp-color-onPrimary` for white-on-brand |
| src/views/Marketing/FormBuilder.vue | 7 | `#1A1A2E` (dark preset), `#FFFFFF` (light preset), `#1A56DB` (brand preset), `#ff5f56`, `#ffbd2e`, `#27c93f` (macOS traffic lights), `#fff` | Template (form previews), styles (text color) | Move preset palette to tokens/design; macOS lights are OK as static reference but should be commentedas intentional |
| src/views/Retail/Registers.vue | 5 | `#22c55e` (online), `#ef4444` (offline), `#f59e0b` (syncing) | Styles only; `color-mix()` blend mode | Map to semantic tokens: `--mp-color-success`, `--mp-color-error`, `--mp-color-warning` |
| src/views/Marketing/LandingPageTemplates.vue | 5 | `#F5F5F5`, `#D4D4D4`, `#121212`, `#2CC4FF`, `#C0392B`, `#F59E0B` | Template (landing page design presets) | Define landing template palette in tokens.json under new `landingPageThemes` group |
| src/views/DaVinci/DaVinciAI.vue | 4 | `#ede9fe`, `#dbeafe`, `#cffafe`, `#e0e7ff` | Styles (gradient backgrounds) | Use Vuetify color lightening or define `--dv-feature-gradient-*` tokens |
| src/components/copilot/voice/DvOrbitOrb.vue | 4 | `#16181d` (ink), `#000` (mask), `#94a3b8` (border gray) | Styles (canvas mask, text color) | `#16181d` → `--mp-color-onSurface`; `#94a3b8` → `--mp-color-outline` or new `--dv-color-border` |
| src/components/copilot/voice/DvOrbCanvas.vue | 4 | `#0092D4` (accent default), `#5EEAD4` (cyan glow), `#93C5FD` (blue glow), `#A78BFA` (violet glow) | Styles (canvas 2D rendering defaults) | Define `--dv-orb-accent`, `--dv-orb-glowC1/C2/C3` tokens for theme parameterization |
| src/views/Marketing/AcquisitionForms.vue | 3 | `#1A1A2E` (dark bg), `#fff` (text on brand), rgba rgba(0, 0, 0, 0.25) (shadow) | Template + styles | Move form preview palette to design tokens |
| src/components/marketing/landing/LandingBlockView.vue | 2 | `#0073AB` (default accent), `#fff` (text) | Styles | Use `--mp-color-primary`, `--mp-color-onPrimary` |
| src/components/copilot/DvDocsAssistant.vue | 1 | `#2563eb`, `#7e3af2` (gradient) | Styles (hero gradient) | Define `--dv-hero-grad` token or use Vuetify primary + secondary blend |

**Medium-hit files (1–4 occurrences):** 9 files total. Most are justified (theme showcase, form builder config, chart swatches). No immediate action except note locations for future migration.

**Hex in Template vs. Style:**
- **Template (user-configurable):** FormBuilder.vue, LandingPageTemplates.vue, ChatbotBuilder.vue, LandingBlockSettings.vue, LandingPageStylePanel.vue (v-color-picker integration) — these are intentional UI controls; acceptable.
- **Style (design system):** Most others; should migrate to tokens.

**ACTION:** Migrate tint palette in ModuleLandingPage.vue to tokens.json; audit Registers.vue color-mix() blends for semantic mapping; define landing page & DV Orb canvas tokens.

---

## 3. Chart Theming

Chart library usage, series colors, and token integration.

| Component/File | Chart Library | Color Source | Token Usage | Theme Parameterized |
|---|---|---|---|---|
| src/components/dashboards/widgets/DashboardChartWidget.vue | ApexCharts (vue3-apexcharts) | `useChartTheme()` composable → `src/plugins/chartPalette.ts` | ✓ Via `CHART_PALETTES` record | ✓ Yes; palette via `?chart=` URL param |
| src/components/dashboards/widgets/DashboardPieWidget.vue | ApexCharts (vue3-apexcharts) | `useChartTheme()` composable → `src/plugins/chartPalette.ts` | ✓ Via `CHART_PALETTES` record | ✓ Yes; palette-aware |
| src/components/dashboards/widgets/DashboardKpiWidget.vue | (No chart; sparkline data only) | `CHART_PALETTE_OVERRIDE` or `useChartTheme()` | ✓ Token-aware | ✓ Passthrough |
| src/components/copilot/DvChartCard.vue | ApexCharts (lazy-loaded) | `useChartTheme()` composable | ✓ Via `CHART_PALETTES` record | ✓ Yes; inherits dashboard theme |
| src/views/Analytics/LiveView.vue | ApexCharts (ApexOptions config inline) | Hard-coded `#ffffff` for text color; uses ApexOptions defaults for chart palette | (a) Partial; text color hardcoded | ~ Partial; chart colors come from ApexCharts default, not tokens |
| src/views/ChartThemes/ChartThemesView.vue | ApexCharts (demo/showcase) | `CHART_THEMES` enum from `chartPalette.ts` | ✓ Via theme constants | ✓ Yes; theme switcher demo |
| src/plugins/chartPalette.ts | — | Palette definitions: 6 named palettes (indigo/ocean/aurora/forest/sunset/monochrome) | ✓ CHART_PALETTES record with hard-coded hex arrays | ✓ Yes; `applyChartPalette()` switches globally |
| src/styles/charts.css | Global stylesheet | Vuetify CSS variable defaults (--v-theme-*) | ✓ References Vuetify theme variables | ✓ Yes; light/dark mode aware |

**Key Findings:**
- **Centralized theming:** `chartPalette.ts` is the source of truth; palettes are hard-coded hex arrays, not design tokens.
- **Grid/axis styling:** `charts.css` provides global ApexCharts overrides (text color, border, etc.) via Vuetify CSS vars.
- **Tooltip & legend:** Inherited from ApexCharts defaults + Vuetify theme colors; no custom styling in codebase.
- **LiveView outlier:** Uses inline ApexOptions with `#ffffff` hardcoded; should migrate to token or theme-aware getter.

**ACTION:** Consider migrating `CHART_PALETTES` hex arrays to tokens.json under new `chartPalettes` group for single-source maintenance; audit LiveView.vue for theme awareness.

---

## 4. Date/Color-Picker Overlays

Vuetify overlay component usage and attachment patterns.

| File | Component | Count | Attachment Pattern | Note |
|---|---|---|---|---|
| src/components/marketing/landing/LandingBlockSettings.vue | `v-color-picker` | 1 | Inline in form drawer | Modal; no explicit z-index override; uses Vuetify default modal layer (2400) |
| src/components/marketing/landing/LandingPageStylePanel.vue | `v-color-picker` | 2 | Inline in collapsible panel | Modal; nested in form; Vuetify handles stacking |
| src/views/Marketing/FormBuilder.vue | `v-color-picker` | 4 | Inline in form builder toolbar | Modal; nested in builder; Vuetify handles stacking |
| src/views/Service/ChatbotBuilder.vue | `v-color-picker` | 1 | Inline in chatbot config panel | Modal; Vuetify default stacking |
| — | `v-date-picker` | 0 | N/A | **No v-date-picker found in active codebase** |

**Overlay Behavior:**
- All `v-color-picker` instances are modal (default Vuetify behavior).
- No custom `z-index` applied; rely on Vuetify's VDialog stacking (2400).
- No attachment edge-case issues observed (e.g., overflowing off-screen).

**ACTION:** None; patterns are correct. Document that date-picker gaps indicate potential future UX — no current date-range picker overlay exists (MpDateRangeSelect.vue is non-modal input with dropdown).

---

## 5. Dead/Duplicate Components

Audit of unused components and near-duplicate implementations.

### Dead Components
**Result:** None found. All 85 .vue components under src/components/ are imported and used across src/views/, src/App.vue, or Storybook. Every design-system component (Mp*, Dv*, Dashboard*, Modal landing/*, etc.) has at least one consumer.

### Near-Duplicate Implementations

| Pattern | Files | Observation |
|---|---|---|
| **Row actions / kebab menus** | `MpRowActionsMenu.vue` (1 shared) + 100+ inline `v-menu` + `v-list-item` patterns | Shared component exists but 111 raw `v-menu` instances in views suggest inconsistency. Most are table row menus (e.g., Coupons, Fulfillments, AllContacts). MpRowActionsMenu wraps `v-menu` with aria-label; inline patterns manually implement accessibility. **FLAG:** Consider standardizing all row menus to use MpRowActionsMenu. |
| **Toast notifications** | `DvToastStack.vue` (da Vinci only, 1) + 179 `v-snackbar` instances across views | Two independent toast systems. DvToastStack is custom (uses `useDaVinciToasts` composable), optimized for AI responses. v-snackbar instances are per-view, time-limited (2–3s), various colors (success, surface). **FLAG:** Consolidation opportunity; see Section 6 for snackbar audit. |
| **Buttons / call-to-actions** | Vuetify `v-btn` throughout; no custom button wrapper component | Expected; no duplication. |
| **Dialogs** | `MpConfirmDialog.vue` (1 shared), `MpFormDrawer.vue` (1 shared), `MpManageFoldersDrawer.vue` (derived), inline `v-dialog` (rare) + builder-specific modals (FormBuilder, ImageLibrary dialogs) | Minimal duplication. Shared confirm and form patterns exist; builders use specialized overlays (justified). No redundancy detected. |

**ACTION:** Standardize row actions menu usage; plan snackbar consolidation (Section 6).

---

## 6. Snackbar Sites

All `v-snackbar` usage, grouped by module directory.

| Module | File Count | Total v-snackbar Instances | Timeout Range | Notable Patterns |
|---|---|---|---|---|
| **Layout** | 2 | 2 | 2400–2600ms | AppBar (notice), DashboardView (notice) — used for system-level notifications |
| **Components** | 1 | 2 | 3000–3200ms | PlgTalkToSalesDialog (confirmation) |
| **Analytics** | 13 | 28 | 2500ms (standard) | High volume; all success/pill notifications from copy/export actions across 13 report views |
| **Commerce** | 7 | 16 | 2500ms (standard) | Fulfillments, OrderDetail, Coupons, DraftOrders, SalesOrders, PurchasableGiftCards, CustomGiftCards — all success confirmations |
| **Contacts** | 10 | 20 | 2500ms (standard) | AllContacts, ContactDetail, ContactLists, ContactFields, ContactTags, WebTracking, RelationalTables, Segments, SecureLists, SQLQueries — all success confirmations |
| **Merchandising** | 9 | 26 | 2000–2500ms | High volume; mix of success + generic snackbars; longer timeout on some views |
| **Marketing** | 14 | 31 | 700–2500ms | Highest volume; mixed timeout (short 700ms for transactional saves, 2500ms for bulk ops); Journeys, Forms, Campaigns, Email, Landing, Preference Pages, etc. |
| **Products** | 5 | 12 | 2500ms (standard) | ProductsList, Inventory, Collections, ProductRecommendations, TaxCategories, Reservations — all success confirmations |
| **Retail** | 3 | 6 | 2000ms | RetailHome, Registers, Staff — all generic location-bottom snackbars |
| **SalesChannels** | 3 | 8 | 2400–2500ms | StoreAssets, StoreThemeBuilder, StoreThemeCode, SalesChannelDetail — mix of success + notice |
| **Service** | 2 | 6 | 2200–2500ms | ChatbotBuilder (success), Tickets (success + bulk) — success confirmations |
| **Settings** | 11 | 17 | 2000–2400ms | 11 settings pages; mostly success confirmations; 1 generic + 1 copy API key snack |
| **Billing** | 1 | 1 | 2600ms | BillingView — generic snackbar |
| **PLG** | 1 | 2 | 3000ms | PlansView — rounded pill on dark background |

**Totals:**
- **179 v-snackbar instances** across 75 files
- **Timeout distribution:** 700ms (1), 1600–2400ms (majority), 2500ms (most common), 2600ms (2), 3000–3200ms (3)
- **Location:** Overwhelming majority `location="bottom center"` (pill style); few use `location="bottom right"` or `location="bottom"` (system notices)
- **Color:** Mostly `color="success"` (green); surface/notice color in layout components; no error/warning snackbars observed
- **Accessibility:** No `role="alert"` or `aria-live` on v-snackbar; implicit from Vuetify component

**Consolidation Opportunity:** All are fire-and-forget success notifications. Candidate for unified toast/snackbar API similar to DvToastStack. Migration path:
1. Create composable `useAppNotification()` wrapping a centralized snackbar stack (or integrate into DvToastStack)
2. Replace 179 v-snackbar declarations with composable calls
3. Define timeout/color defaults per module or globally

**ACTION:** Plan snackbar consolidation; DvToastStack.vue is existing prior art (see Section 5).

---

## Summary Stats

| Audit Section | Count | Key Findings |
|---|---|---|
| **Z-Index** | 34 total | 4 token-aware (11%), 1 critical raw (9999), 28 local/relative (82%) |
| **Hard-Coded Hex** | 18 files with hex | ModuleLandingPage (16), ChatbotBuilder (8), FormBuilder (7) leading hits |
| **Chart Theming** | 6 components + 1 plugin + 1 stylesheet | Centralized via chartPalette.ts; 1 outlier (LiveView.vue hardcoded #ffffff) |
| **Color-Pickers** | 4 files, 1 v-date-picker pattern | 0 date-pickers found; 4 color-pickers all modal, Vuetify-stacked |
| **Dead Components** | 0 | All 85 components in use |
| **Toast Systems** | 2 independent | DvToastStack (1) + v-snackbar (179 instances) |
| **Snackbars** | 179 instances | 75 files; 2500ms standard timeout; 82% bottom-center pill style |

---

## References

- Design tokens: `src/design-tokens/tokens.json` (z-index, color, spacing)
- Z-index token reference: `src/design-tokens/generated/variables.css` (auto-generated)
- Chart theming: `src/plugins/chartPalette.ts`, `src/styles/charts.css`
- Toast prior art: `src/components/copilot/DvToastStack.vue`, `src/composables/useDaVinciToasts.ts`
- Global style manifest: `src/styles/app-styles.ts`
