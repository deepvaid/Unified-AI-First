# Storybook Structure (as-built)

<!-- Artifact of the Docs & Handoff agent (design-system program). -->
<!-- Counts regenerated 2026-08-17 from dist-storybook/index.json after `npm run build-storybook`
     (the index is the authority — it counts what Storybook actually loads, not what grep finds). -->

## Sidebar taxonomy

Sort order is pinned in `.storybook/preview.ts` (`storySort`): Introduction → Foundations →
component groups → feature groups → `*` (catch-all). **Single source feeds the sidebar** —
one glob, `../src/**/*.stories.@(ts|tsx)` (`.storybook/main.ts`). There is no second package
contributing stories: `packages/marobase-ui` (the `@marobase/ui` library) was deleted; its
foundation token CSS was relocated to `src/styles/mb-foundation.tokens.css`.

**Render parity:** Storybook loads the app's full stylesheet set via `src/styles/app-styles.ts`,
the ordered manifest imported by both `src/main.ts` and `.storybook/preview.ts`. Components
render identically in stories and in the app. Add new global stylesheets to the manifest —
never directly to `main.ts` or `preview.ts`.

### `src/` — 571 story exports across 122 files

| Group | Files | Stories | Contents |
|-------|-------|---------|----------|
| Introduction | 1 | 1 | Overview page |
| Foundations | 7 | 41 | Colors · Typography · Spacing · Radius & Shadows · Icons — all rendered from `design-tokens/generated/tokens.ts` — plus Buttons (VBtn as styled by app defaults + global.scss) and Tooltips |
| Layout | 5 | 37 | AppBar, AppSidebar, MpBuilderShell, MpPageHeader, MpSectionHeader |
| Navigation | 3 | 16 | MpFilterTabs, MpSectionRail, MpWizardSteps |
| Forms | 5 | 37 | Form Fields gallery, MpManageFoldersDrawer, MpMoveToFolderDialog, MpOptionCard, MpStatusToggle |
| Data Display | 7 | 64 | MpDataTableToolbar, MpDateRangeSelect, MpFolderSelect, MpKpiCard, MpSourceCloudChip, MpStatusChip, MpUsageMeter |
| Feedback | 7 | 40 | MpComingSoonTiles, MpEmptyState, MpErrorState, MpFloatingBulkBar, MpIllustration, MpTableSkeleton, MpToastStack |
| Overlays | 4 | 24 | MpBuilderPreviewDialog, MpConfirmDialog, MpFormDrawer, MpRowActionsMenu |
| Patterns | 3 | 18 | ModuleLandingPage · Data Table (canonical list-view composition: MpFilterTabs → MpDataTableToolbar → v-data-table → MpEmptyState → MpFloatingBulkBar) |
| AI | 1 | 5 | MpDaVinciBot (app surface, tier P1) |
| Copilot (+`/Voice`) | 25 | 92 | Dv* cards/dialogs incl. DvOnboardingCardShell + voice components |
| Dashboards (+`/Widgets`, `/Wizard`, `/Dotted`) | 28 | 88 | Dashboard containers, 17 widget renderers, wizard steps, and the dotted chart primitives (DtDottedBar, DtGauge, DtLegendList) |
| Marketing | 9 | 39 | JourneyFlowColumn, JourneyMiniPreview, and the 6 landing-page editor components |
| Merchandising | 1 | 6 | MerchProductCard |
| PLG | 4 | 15 | Plg3dsDialog, PlgTalkToSalesDialog, PlgTrialBanner, PlgTrialChip |
| RBAC | 4 | 19 | PermissionMatrix, RolePicker, and the rbac drawers |
| Sales Channels | 5 | 21 | AddSectionDialog, MenuPreviewCard, StoreEditorSidebar, StorefrontPreview, ThemeDaVinciPanel |
| Settings | 3 | 8 | SettingsPlaceholder, SettingsSection, SettingsSidebar |

**Build total: 339 story exports across 84 files.** No Archive/Legacy Base section and no
generated Visual Parity stories remain — both were deleted in the Storybook cleanup, along
with `scripts/visual/` (the orphaned parity tooling that generated them) and
`@storybook/addon-themes` (declared but unused).

## Tiering

- **P0 — full treatment** (top-level `Mp*`, ModuleLandingPage, `layout/`): docs block with
  Overview, *Use when / Don't use when*, Usage snippet, Do's/Don'ts/Best practices, an explicit
  **A11y** section (Provides / Consumer must / Gaps), `argTypes` descriptions for every prop,
  slot and emit, and state-matrix stories per component type (controls: default/hover/focus/
  disabled/loading/error · data containers: default/loading/empty/error/selection · overlays:
  open/long-content/mobile · status components: full status × type matrix).
- **P1 — standard** (copilot, dashboards, marketing, settings, merchandising, MpDaVinciBot):
  key states + wired controls; docs prose optional.
- Global axes on everything: light/dark via the theme toolbar (synced in the preview decorator),
  desktop/mobile via the viewport tool — no per-story theme forks.

## Conventions for adding a story

1. Co-locate `<Name>.stories.ts` next to the component; CSF3 with `tags: ['autodocs']`.
2. `title:` = group from the table above + component name (`'Forms/MpNewThing'`). New feature
   dirs get their own top-level group; extend `storySort` in `.storybook/preview.ts` if order matters.
3. Pinia/router/Vuetify are pre-registered in `preview.ts`. Store-coupled stories seed account
   `2000290` (see `DvWidgetDraftCard.stories.ts` for the pattern). Styles the app loads via
   `main.ts` (e.g. `dv-orbit.css`, `source-cloud-colors.css`) must be imported story-side.
4. Tokens only — import from `@/design-tokens/generated/tokens` (see `src/stories/Foundation/`);
   lucide kebab-case icon names; never `mdi-*`.
5. Gates before commit: `npm run type-check` + `npm run build-storybook` green; check the a11y
   addon panel on new stories.
