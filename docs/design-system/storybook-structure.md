# Storybook Structure (P5, as-built)

<!-- Artifact of the Docs & Handoff agent (design-system program, Phase 5). -->
<!-- Counts generated from dist-storybook/index.json after the foundations commit. -->

## Sidebar taxonomy

Sort order is pinned in `.storybook/preview.ts` (`storySort`): Introduction → Foundations →
component groups → feature groups → Archive. Two sources feed one sidebar: the app
(`src/**/*.stories.ts`) and the `@marobase/ui` package (`packages/marobase-ui/src/**`).

### App (`src/`) — 347 story exports across 87 files

| Group | Files | Stories | Contents |
|-------|-------|---------|----------|
| Introduction | 1 | 1 | MaroBase overview page |
| Foundations | 5 | 15 | Colors · Typography · Spacing · Radius & Shadows · Icons — all rendered from `design-tokens/generated/tokens.ts` (P5) |
| Design System | 2 | 9 | ModuleLandingPage + Form Fields gallery |
| Data Display | 5 | 42 | MpDataTableToolbar, MpFolderSelect, MpKpiCard, MpSourceCloudChip, MpStatusChip |
| Feedback | 4 | 18 | MpEmptyState, MpErrorState, MpFloatingBulkBar, MpTableSkeleton |
| Forms | 4 | 17 | MpManageFoldersDrawer, MpMoveToFolderDialog, MpOptionCard, MpStatusToggle |
| Layout | 4 | 17 | AppBar, AppSidebar, MpPageHeader, MpSectionHeader |
| Navigation | 2 | 9 | MpFilterTabs, MpWizardSteps |
| Overlays | 3 | 11 | MpConfirmDialog, MpFormDrawer, MpRowActionsMenu |
| AI | 1 | 3 | MpDaVinciBot (app surface, tier P1) |
| Copilot (+`/Voice`) | 20 | 70 | 13 Dv* cards/dialogs + 7 voice components |
| Dashboards (+`/Widgets`, `/Wizard`) | 14 | 40 | 7 containers + 5 widget renderers + 2 wizard steps |
| Marketing | 2 | 10 | JourneyFlowColumn, JourneyMiniPreview |
| Settings | 3 | 8 | SettingsPlaceholder, SettingsSection, SettingsSidebar |
| Merchandising | 1 | 6 | MerchProductCard |
| Archive/Legacy Base | 16 | 71 | Pre-program Vuetify galleries (Buttons, Cards, …) — reference only |

### Package (`@marobase/ui`) — 161 story exports

Components (49) · Forms (46) · Overlays (10) · Navigation (5) · Patterns (3) · Data Display (1)
· Archive (47). Owned by the marobase-ui workstream; not covered by this program.

**Build total: 508 story exports.** Component story files for the 65-component library: 64
(JourneyAddStepMenu is an internal helper, n/a by design).

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
