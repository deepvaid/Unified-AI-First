# Design System & Storybook Handover — July 2026

Prepared 2026-07-18 for the Monday stakeholder showcase and engineering handover.
Branch: `refactor/storybook-cleanup`. All changes verified with `npm run type-check`, `npm run build`, and `npm run build-storybook` at every step.

## Executive summary

The Storybook previously merged two competing component systems into one sidebar: the app's actively-used **Mp\*** design system and the dormant, Storybook-only **`packages/marobase-ui`** (Mb\*) library. A full usage audit (every component grepped across `src/`) found **zero dead Mp\* components** — all 90 are referenced by live app code — and **zero app usage of any Mb\* component**. The cleanup removed the parallel Mb\* system and all archive material, consolidated the one true duplicate component pair, migrated the highest-confidence convention violations in views, filled the biggest story-coverage gaps, and restructured the sidebar into a single coherent taxonomy.

The design system of record is **Mp\*** (`src/components/`), documented in `CLAUDE.md` and `docs/design-system/`. Tokens live in `src/design-tokens/tokens.json` (`npm run tokens:build`).

## Render parity with the design sandbox

A follow-up audit found Storybook was loading only 6 of the app's 15 stylesheets — form fields, the sidebar/app-bar shell skins, source-cloud chip colors, and voice-orb/retail-widget styling all rendered as raw Vuetify in stories while the docs described the app look. Fixed by **`src/styles/app-styles.ts`**: a single ordered stylesheet manifest imported by both `src/main.ts` and `.storybook/preview.ts`. Storybook now renders identically to the app, and any stylesheet added to the manifest reaches both automatically — never add global CSS imports directly to `main.ts` or `preview.ts` again.

Verified in-browser after the fix: form fields show the app chrome (10px radius, surface tint, focus ring, working `settings-grid` layout), AppSidebar/AppBar stories render the real shell skins, and MpSourceCloudChip shows per-cloud colors.

Two pattern galleries deleted with the archive were rebuilt sandbox-faithful:
- **`Foundations/Buttons`** (`src/stories/Foundation/Buttons.stories.ts`) — VBtn exactly as the app styles it (flat default, no text-transform, Lucide icons), with the CTA/secondary/tertiary/destructive hierarchy.
- **`Patterns/Data Table`** (`src/stories/DataTablePattern.stories.ts`) — the full canonical list-view composition (MpFilterTabs → card → MpDataTableToolbar → v-data-table with MpStatusChip + MpRowActionsMenu → MpEmptyState → MpFloatingBulkBar), cribbed from `SalesOrders.vue`, with Default/Empty/Loading/WithSelection states. This is the reference to copy when building a new list view.

## Drawer shell + drawer audit (2026-07-18, follow-up pass)

`MpFormDrawer` now opens as a **floating rounded surface** matching the copilot drawer and content frame: 16px radius (`--mp-component-dialog-radius-default`), 1px `--mp-border-subtle` border, `--mp-shadow-md`, 12px gutters top/right/bottom. Implementation note: it keeps Vuetify's inline `top`/`bottom` and overrides only `height: auto`, so the geometry self-corrects between app-bar and full-page routes with no hardcoded offsets. On ≤640px viewports the drawer becomes a full-bleed sheet clamped to `100vw` — this also fixes the long-standing bug where the 480px default overflowed a 375px screen. Every drawer inherits automatically (all overlay drawers compose MpFormDrawer).

Drawer audit fixes shipped with it:
- **Filters drawer** (MpDataTableToolbar): default subtitle "Changes apply immediately" (filters apply live — "Done" only dismisses), full-size footer buttons in a `Clear all · spacer · Done(primary)` layout.
- **Filter-select convention**: outlined filter selects take `placeholder="All"` + `persistent-placeholder` so a null filter reads "All" instead of an empty-looking box. Reference implementations: `SalesOrders.vue`, `AllContacts.vue`, `Inventory.vue` (which also lost a redundant inner "Filter by" heading). **Follow-up:** apply to the remaining ~27 views with filter selects.
- **MpManageFoldersDrawer**: "Done" is now flat primary; the raw delete-confirm `v-dialog` was replaced with `MpConfirmDialog` (wording preserved).
- **rbac drawers**: footer gaps normalized to `ga-2`.
- **DvHistoryDrawer** (copilot): gained full dialog semantics in overlay mode — `role="dialog"`, `aria-modal`, `aria-labelledby`, ESC-to-close, focus in/restore, Tab trap (inert in rail mode).
- **Storybook**: new `FilterDrawer` story mirrors the real Filters drawer; MpFormDrawer width defaults corrected to 480; shell + mobile + filter-select conventions documented in the component docs.

Known follow-ups from this pass: sweep the remaining filter-select views; MpFormDrawer title is bespoke 17px (works, but not on the type scale — token-alignment candidate).

## Removed

| Item | Scale | Why safe |
| --- | --- | --- |
| `packages/marobase-ui` (Mb\* library) | ~200 files: 44 components, ~90 story files | Used nowhere in `src/`; dormant since 2026-07-10; retirement already planned in `docs/ui-improvement-roadmap.md`. Its foundation token CSS was relocated to `src/styles/mb-foundation.tokens.css` (still imported by `main.ts`). |
| `Archive/Visual Parity` stories (47) | Generated Mb\* Figma-parity galleries | Deleted with the package; produced by orphaned tooling no npm script invoked. |
| `scripts/visual/` parity tooling | 4 files | Orphaned — zero references in `package.json` scripts or CI. |
| `Archive/Legacy Base` galleries (16) | Raw-Vuetify reference stories in `src/stories/` | Pre-program reference material; superseded by Mp\* component stories. |
| `Archive/Legacy Foundation/DesignSystemDemo` story | 1 file | The underlying page `src/views/Settings/DesignSystemDemo.vue` is routed in-app and was **kept**; only its archive story was removed. |
| `@storybook/addon-themes` | 1 dev dependency | Declared but unused — theming is implemented by a custom decorator in `.storybook/preview.ts`. |
| `visualParity` decorator + `.mp-visual-*` CSS in `preview.ts` | — | Dead after parity-story removal. |
| `MbButton.mdx` (Meta-less MDX) | 1 file | Deleted with the package; it was a latent `build-storybook` breakage risk and contained stale guidance (mdi icons, pnpm). |

## Consolidated / replaced

| Before | After | Notes |
| --- | --- | --- |
| `CreateDashboardDialog.vue` + `EditDashboardDialog.vue` (~85% identical) | `src/components/dashboards/DashboardFormDialog.vue` | Props `accountId`, `dashboard?` (null = create mode); single `saved` emit. All mode-specific behavior preserved (reset vs hydrate, labels, avatar, autofocus/enter-submit). Call sites updated: `DashboardView.vue`, `Dashboards/DashboardsList.vue`. Merged story: `Dashboards/DashboardFormDialog`. |
| 6 raw `<v-dialog>` confirm/delete dialogs | `MpConfirmDialog` | `DashboardView`, `DashboardsList`, `DefaultMerchandising`, `PinningEditor`, `RuleEditor`, `RecommendationEngines`. Wording, labels, and danger styling preserved. Known delta: two of these were `persistent`; MpConfirmDialog allows backdrop/Esc dismiss (standard confirm behavior). |

## Deprecated (kept, exit path documented)

- **`--mb-*` CSS-variable bridge** in `src/styles/global.scss` and **`src/styles/mb-foundation.tokens.css`** — the last remnants of marobase-ui. Kept because `src/views/Commerce/CommerceCloudLanding.vue` consumes 22 distinct `--mb-*` variables (60 references). **Next step:** migrate that view to `--mp-*` tokens, then delete both the bridge and the token file. Does not block the demo or handover.
- **`src/styles/tokens.scss`** (legacy `$mp-*` SCSS vars) — one view holdout: `Marketing/AcquisitionForms.vue`. Migrate it to `src/design-tokens/` values, then retire the file. Does not block.

## New Storybook structure

Single story source: `src/**/*.stories.@(ts|tsx)`. Sidebar order (pinned in `preview.ts` storySort):

**Introduction** → **Foundations** (Colors, Typography, Spacing, Radius & Shadows, Icons) → **Layout** → **Navigation** → **Forms** → **Data Display** → **Feedback** → **Overlays** → **Patterns** → **AI** → **Copilot** → **Dashboards** → **Marketing** → **Merchandising** → **RBAC** → **Sales Channels** → **Settings**

Story additions this pass: new `Data Display/MpDateRangeSelect` (was the only heavily-used component with no story — 14 usage sites); `MpFormDrawer` ValidationErrors + Submitting states; `MpStatusToggle` disabled-interaction proof; `MpSectionRail` full argTypes + autodocs.

## Deliberate non-changes (audited, decided against)

- **`MpErrorState` was NOT merged into `MpEmptyState`** despite near-identical markup. This is a documented semantic decision (CLAUDE.md): *error = something failed* (`role="alert"`, recovery defaults) vs *empty = nothing to show*. Keep both.
- **`DvKpiRow` vs `MpKpiCard`** — intentional divergence (inline comment in DvKpiRow explains the copilot flex-column height constraint). Not duplicates.
- **`SettingsPlaceholder`** — purpose-narrow "coming soon" page wrapper; overlaps the simplest empty state but composes page chrome. Left as-is.
- **13 remaining raw `v-dialog` uses in views** — all are form or rich-content dialogs (e.g. plan-tier upsell in `RolesPermissionsPage`, POS preview dialogs, acquisition-form editors). Converting them to `MpFormDrawer` changes interaction patterns — deferred as intentional follow-up work, not done under demo deadline.

## Remaining inconsistencies (documented, with recommended next steps)

| Issue | Where | Recommended next step | Blocks Monday? |
| --- | --- | --- | --- |
| 4 views keep local status-chip color maps | `Commerce/StoreSetup`, `Service/ChatbotList`, `Service/ChatbotBuilder`, `Analytics/CustomReports` | Each renders statuses MpStatusChip's maps can't color correctly today (`Disconnected`→red, `Pending Auth`→warning, `Disabled`→warning, `Indexing`→info + spinner, `Ready`/`Running`/`Scheduled`). Extend MpStatusChip's `connection` map and add a `report`/`bot` type as a deliberate DS decision, then migrate. | No |
| 3 ad-hoc status ternaries | `AudienceView`, `Marketing/EmailCampaigns`, `Marketing/LandingPageEditor` | Fold into the same MpStatusChip map-extension pass. | No |
| ~22 views use raw `v-menu` kebabs | e.g. `Service/Tickets`, `Merchandising/*`, `Settings/Users` | Case-by-case migration to `MpRowActionsMenu` (many are legitimately non-row menus — do not bulk-convert). | No |
| 14 feature components have no stories | `marketing/landing/` (6), `plg/` (4), `rbac/` drawers (2), `StoreEditorSidebar`, `JourneyAddStepMenu` | Add stories as those features stabilize; all are wired into live flows so none are dead code. | No |
| Missing argTypes in some stories | `MpBuilderPreviewDialog`, `MpDaVinciBot`, `DvToastStack`, `DvIntentCardList`, `AppBar`, `PermissionMatrix`, `RolePicker`, `SettingsSidebar` | Add argTypes for a complete Controls tab. | No |
| Component states not expressible without API changes | `MpConfirmDialog` has no loading/pending-confirm prop; `MpKpiCard` has no loading/empty prop (by documented design — pair with `MpTableSkeleton`); `MpFilterTabs` items have no `disabled`; `MpOptionCard` disabled unsupported (by documented design — filter options out) | The first two are the only genuine candidates: consider `loading` on MpConfirmDialog for async confirms. The others are documented design positions. | No |
| Transitively-alive component clusters | `Dv*` intent cards reachable only via `DvIntentCardList`; dashboard widget renderers only via `DashboardWidgetCard`/`DashboardGrid` | Nothing to do now — but if those single parents are ever removed, the whole cluster becomes dead. Noted for future audits. | No |

## Risks / notes for Monday

- **No blockers.** Type-check, app build, and Storybook build are green on the final tree.
- The two migrated dashboard confirm dialogs are no longer `persistent` (backdrop/Esc now cancels). This matches standard confirm-dialog behavior; flag it only if someone relies on forced-choice dialogs.
- `CommerceCloudLanding.vue` styling depends on the relocated `mb-foundation.tokens.css` + bridge — verified working, but don't delete either file before migrating that view.
- The Supernova sync (`supernova:storybook:build-and-sync`) builds the whole Storybook; it will simply import the smaller, cleaner build. Note `supernova-config.json` was already retired in an earlier commit — verify Supernova credentials/config before the next sync run.

## For the engineering team

- **Component reference:** `CLAUDE.md` (component inventory + conventions), `docs/design-system/` (structure, Vuetify mapping, tokens), Storybook autodocs (`npm run storybook`, port 6006).
- **Conventions to hold the line on:** Lucide icons only (no `mdi-*`); cards `flat border rounded="lg"`; `MpFormDrawer` for forms, `MpConfirmDialog` for confirms (never raw `v-dialog`); `MpStatusChip` for status columns; `MpEmptyState` on every table; tokens only via `src/design-tokens/tokens.json`.
- **All work is on `refactor/storybook-cleanup`** in single-purpose commits — each phase reverts surgically if needed.
