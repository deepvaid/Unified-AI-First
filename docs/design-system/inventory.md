# Component Inventory (2026-07-05)

<!-- Artifact of the Component Inventory agent (design-system program, Phase 1). -->
<!-- Used-by counts are grep-based; the cleanup agent re-verifies with proof before acting. -->

## Totals
- **Total components**: 69 Vue files
- **Top-level (root)**: 18 components
- **copilot/**: 17 components (+8 in copilot/voice/)
- **dashboards/**: 9 components (+5 in widgets/, +4 in wizard/)
- **layout/**: 2 · **marketing/**: 2 · **merchandising/**: 1 · **settings/**: 3
- **Stories**: 31 Storybook files (.stories.ts)
- **Story gap**: 38 components without stories

## Inventory

| Component | Dir | Props | Emits | Slots | Used by | Notable Consumers | Story | Tier |
|-----------|-----|-------|-------|-------|---------|-------------------|-------|------|
| MpPageHeader | . | 1 | 0 | 2 | 200 | Fulfillments, DraftOrders, SettingsPlaceholder | Yes | P0 |
| MpStatusChip | . | 1 | 0 | 0 | 102 | Fulfillments, DraftOrders, Coupons | Yes | P0 |
| MpEmptyState | . | 1 | 1 | 0 | 92 | DashboardGrid, Fulfillments, Coupons | Yes | P0 |
| MpDataTableToolbar | . | 1 | 1 | 3 | 114 | Fulfillments, DraftOrders, Coupons | Yes | P0 |
| MpFloatingBulkBar | . | 1 | 1 | 1 | 30 | views | Yes | P0 |
| MpFormDrawer | . | 1 | 0 | 2 | 37 | DvActionCard, DvCampaignCard | Yes | P0 |
| MpKpiCard | . | 1 | 0 | 2 | 27 | copilot cards | Yes | P0 |
| MpFilterTabs | . | 1 | 0 | 0 | 20 | Fulfillments, Commerce views | Yes | P0 |
| MpTableSkeleton | . | 1 | 0 | 0 | 16 | DashboardTableWidget | Yes | P0 |
| MpErrorState | . | 1 | 1 | 0 | 8 | DvHistoryDrawer, DvToastStack | Yes | P0 |
| MpFolderSelect | . | 1 | 1 | 0 | 2 | MpMoveToFolderDialog | Yes | P0 |
| MpManageFoldersDrawer | . | 1 | 1 | 0 | 2 | AppBar | Yes | P0 |
| MpMoveToFolderDialog | . | 1 | 1 | 0 | 3 | views | Yes | P0 |
| MpSectionHeader | . | 1 | 0 | 1 | 5 | settings | Yes | P0 |
| MpSourceCloudChip | . | 1 | 0 | 0 | 4 | DashboardListCard | Yes | P0 |
| ModuleLandingPage | . | 0 | 0 | 0 | 4 | views | No | P0 |
| MpOverviewChart | . | 1 | 0 | 0 | 0 | (none) | Yes | P0 |
| MpDaVinciBot | . | 0 | 0 | 0 | 4 | App.vue, MpDaVinciBot.stories | Yes | P1 |
| DvLandingHero | copilot | 2 | 1 | 0 | 4 | MpDaVinciBot | Yes | P1 |
| DvInsightCard | copilot | 1 | 1 | 0 | 4 | MpDaVinciBot | Yes | P1 |
| DvHistoryDrawer | copilot | 1 | 1 | 0 | 4 | MpDaVinciBot | Yes | P1 |
| DvToastStack | copilot | 0 | 0 | 0 | 4 | MpDaVinciBot | No | P1 |
| DvWidgetDraftCard | copilot | 1 | 1 | 0 | 4 | MpDaVinciBot | No | P1 |
| DvSegmentCard | copilot | 1 | 1 | 0 | 2 | DvDraftPreview | Yes | P1 |
| DvCampaignCard | copilot | 1 | 1 | 0 | 2 | DvDraftPreview | Yes | P1 |
| DvChartCard | copilot | 1 | 0 | 0 | 2 | DvDraftPreview | Yes | P1 |
| DvContentCard | copilot | 1 | 1 | 0 | 2 | DvDraftPreview | Yes | P1 |
| DvKpiRow | copilot | 1 | 0 | 0 | 2 | DvDraftPreview | Yes | P1 |
| DvDraftPreview | copilot | 1 | 0 | 0 | 6 | DvExpandDialog | No | P1 |
| DvExpandDialog | copilot | 1 | 1 | 0 | 2 | DvWidgetDraftCard | No | P1 |
| DvRefineDialog | copilot | 1 | 1 | 0 | 2 | MpDaVinciBot | No | P1 |
| DvDataTable | copilot | 1 | 0 | 0 | 0 | (none) | Yes | P1 |
| DvActionCard | copilot | 1 | 1 | 0 | 0 | (none) | Yes | P1 |
| DvDialogShell | copilot | 1 | 1 | 2 | 0 | (none) | No | P1 |
| DvJourneyCard | copilot | 1 | 1 | 0 | 0 | (none) | Yes | P1 |
| DvOrbCanvas | copilot/voice | 2 | 1 | 0 | 3 | DvOrbitOrb | No | P1 |
| DvIntentCardList | copilot/voice | 1 | 1 | 0 | 4 | MpDaVinciBot | Yes | P1 |
| DvOrbitOrb | copilot/voice | 2 | 0 | 0 | 18 | DvOrbitVoiceSurface | No | P1 |
| DvOrbitVoiceSurface | copilot/voice | 2 | 0 | 0 | 2 | MpDaVinciBot | No | P1 |
| DvOrbitMicBar | copilot/voice | 2 | 1 | 0 | 2 | DvOrbitVoiceSurface | No | P1 |
| DvOrbitWaveBars | copilot/voice | 2 | 0 | 0 | 4 | DvOrbitMicBar | No | P1 |
| DvOrbitStatusPill | copilot/voice | 1 | 0 | 0 | 3 | DvOrbitVoiceSurface | No | P1 |
| DvVoiceStatePill | copilot/voice | 2 | 0 | 0 | 0 | (none) | Yes | P1 |
| CreateDashboardDialog | dashboards | 1 | 1 | 0 | 4 | views | No | P1 |
| DashboardGrid | dashboards | 1 | 1 | 0 | 2 | DashboardSetupGuide | No | P1 |
| DashboardSetupGuide | dashboards | 1 | 1 | 0 | 3 | views | No | P1 |
| DashboardWidgetActionMenu | dashboards | 1 | 1 | 0 | 3 | DashboardWidgetCard | No | P1 |
| EditDashboardDialog | dashboards | 1 | 1 | 0 | 4 | views | No | P1 |
| WidgetWizardDrawer | dashboards | 1 | 0 | 0 | 2 | views | No | P1 |
| DashboardListCard | dashboards | 1 | 1 | 0 | 0 | (none) | No | P1 |
| DashboardListTable | dashboards | 1 | 1 | 0 | 0 | (none) | No | P1 |
| DashboardWidgetCard | dashboards | 1 | 1 | 0 | 9 | DashboardGrid | No | P1 |
| DashboardActivityWidget | dashboards/widgets | 1 | 0 | 0 | 2 | DashboardWidgetCard | No | P1 |
| DashboardChartWidget | dashboards/widgets | 1 | 0 | 0 | 2 | DashboardWidgetCard | No | P1 |
| DashboardKpiWidget | dashboards/widgets | 1 | 1 | 0 | 2 | DashboardWidgetCard | No | P1 |
| DashboardPieWidget | dashboards/widgets | 1 | 0 | 0 | 2 | DashboardWidgetCard | No | P1 |
| DashboardTableWidget | dashboards/widgets | 1 | 0 | 0 | 2 | DashboardWidgetCard | No | P1 |
| WidgetEditStep | dashboards/wizard | 1 | 1 | 0 | 2 | WidgetWizardDrawer | No | P1 |
| WidgetLibraryStep | dashboards/wizard | 0 | 1 | 0 | 2 | WidgetWizardDrawer | No | P1 |
| WidgetWizardManualSteps | dashboards/wizard | 1 | 1 | 0 | 0 | (none) | No | P1 |
| WidgetWizardModeChooser | dashboards/wizard | 0 | 1 | 0 | 0 | (none) | No | P1 |
| AppBar | layout | 0 | 0 | 0 | 2 | App.vue | Yes | P0 |
| AppSidebar | layout | 1 | 1 | 0 | 2 | App.vue | Yes | P0 |
| JourneyFlowColumn | marketing | 1 | 1 | 0 | 2 | JourneyBuilder view | No | P1 |
| JourneyMiniPreview | marketing | 1 | 0 | 0 | 6 | views | No | P1 |
| MerchProductCard | merchandising | 1 | 1 | 0 | 7 | Commerce views | No | P1 |
| SettingsSection | settings | 1 | 0 | 2 | 25 | settings | No | P1 |
| SettingsSidebar | settings | 0 | 0 | 0 | 2 | App.vue | No | P1 |
| SettingsPlaceholder | settings | 1 | 0 | 0 | 16 | settings views | No | P1 |

## Store Coupling

Components importing Pinia stores or composables with side effects (need mocks/decorators in Storybook):

- MpDaVinciBot → useAccounts, useCopilot, useDashboards, dashboards/metricCatalog, dashboards/types
- MpFolderSelect / MpManageFoldersDrawer / MpMoveToFolderDialog → useFolders
- DvWidgetDraftCard, DvExpandDialog, DvRefineDialog → useDashboards / dashboards/types
- DvIntentCardList → useDaVinciIntents (side effects)
- DvVoiceStatePill → useDaVinciVoice (side effects)
- DvHistoryDrawer → useDaVinciHistory, useDaVinciToasts (side effects)
- DvToastStack → useDaVinciToasts (side effects)
- CreateDashboardDialog / EditDashboardDialog / WidgetWizardDrawer / WidgetWizardManualSteps → useDashboards, dashboards/metricCatalog
- DashboardWidgetCard → dashboards/metricCatalog, useWidgetData (side effects)
- DashboardChartWidget → useAppTheme · DashboardKpiWidget → useRelativeTime
- WidgetLibraryStep → dashboards/widgetLibrary
- AppBar → useAccounts, useCopilot, useUserProfile, useAppTheme · AppSidebar → useAccounts
- JourneyFlowColumn / JourneyMiniPreview → journeyFlowData, useFlowTree
- MerchProductCard → useMerchandising

Note: `dashboards/types` is type re-exports, not a store — no mock needed for it alone.

## Browser API Coupling

- MpDaVinciBot → localStorage
- DvHistoryDrawer → window
- DvOrbCanvas, DvOrbitOrb → window (requestAnimationFrame)
- AppSidebar → window (event handling)
- DashboardChartWidget → window (viewport/theme detection)

## Zero-Usage & Story-Only List

**Grep-zero components (cleanup agent MUST re-verify — several are likely rendered
dynamically via `component :is` maps, e.g. DvIntentCardList/DvDraftPreview card maps and
the widget wizard steps):**
- MpOverviewChart (has story)
- DvActionCard (has story)
- DvDataTable (has story)
- DvDialogShell (no story)
- DvJourneyCard (has story)
- DvVoiceStatePill (has story — story-only)
- DashboardListCard (no story)
- DashboardListTable (no story)
- WidgetWizardManualSteps (no story)
- WidgetWizardModeChooser (no story)

## Data Files in Component Dirs

- **dashboards/dashboardOptions.ts** — dashboard accent color mappings
- **dashboards/widgetSizePresets.ts** — widget grid size presets by type
- **dashboards/wizard/buildPreviewWidget.ts** — widget preview builder for wizard
- **settings/settingsMenu.ts** — settings navigation structure
- **copilot/voice/orbit.ts** — orbital voice UI state/animation helpers

## Anomalies

- No views imported by components (good separation); no circular imports detected.
- Nested dirs fully explored: copilot/voice/ (8), dashboards/widgets/ (5), dashboards/wizard/ (4).
- Config .ts files live in component dirs but are not components (see above).
- No direct SpeechRecognition/ResizeObserver usage in .vue files (voice APIs live in composables).
