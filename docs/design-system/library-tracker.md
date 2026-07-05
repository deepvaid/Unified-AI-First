# Component Library Tracker

<!-- STATE FILE for the design-system program (docs/design-system/program-prompt.md). -->
<!-- The ONLY memory between sessions. Update after every phase/batch/commit. -->
<!-- Status: pending | in-progress | done | n/a. Tier: P0 (full docs) | P1 (standard story). -->

## Phase checklist

| Phase | Scope | Status |
|-------|-------|--------|
| P0 | Scaffold (this file + program prompt) | in-progress |
| P1 | Recon: token audit + inventory (artifacts: audit.md, inventory.md) | pending |
| P2 | Cleanup & extraction (8 candidates → cleanup-report.md) | pending |
| P3 | Story coverage (5 batches) | pending |
| P4 | A11y QA (a11y-checklist.md) | pending |
| P5 | Foundations + docs + handoff + CLAUDE.md refresh | pending |

## Component table

<!-- Seeded from kickoff ls; the P1 inventory agent corrects/expands (nested dirs!) and adds used-by counts. -->

### Top level (tier P0)

| Component | Story | Cleanup verdict | Status |
|-----------|-------|-----------------|--------|
| ModuleLandingPage | — | candidate #8 (usage check) | pending |
| MpDaVinciBot | ✓ | | pending (P0 doc upgrade) |
| MpDataTableToolbar | ✓ | | pending (P0 doc upgrade) |
| MpEmptyState | ✓ | candidate #7 (merge eval) | pending |
| MpErrorState | ✓ | candidate #7 (merge eval) | pending |
| MpFilterTabs | ✓ | | pending (P0 doc upgrade) |
| MpFloatingBulkBar | ✓ | | pending (P0 doc upgrade) |
| MpFolderSelect | ✓ | | pending (P0 doc upgrade) |
| MpFormDrawer | ✓ | | pending (P0 doc upgrade) |
| MpKpiCard | ✓ | | pending (P0 doc upgrade) |
| MpManageFoldersDrawer | ✓ | | pending (P0 doc upgrade) |
| MpMoveToFolderDialog | ✓ | candidate #4 (confirm-dialog dedup) | pending |
| MpOverviewChart | ✓ | | pending (P0 doc upgrade) |
| MpPageHeader | ✓ | | pending (P0 doc upgrade) |
| MpSectionHeader | ✓ | | pending (P0 doc upgrade) |
| MpSourceCloudChip | ✓ | | pending (P0 doc upgrade) |
| MpStatusChip | ✓ | | pending (P0 doc upgrade) |
| MpTableSkeleton | ✓ | | pending (P0 doc upgrade) |

### layout/ (tier P0)

| Component | Story | Status |
|-----------|-------|--------|
| AppBar | ✓ | pending (P0 doc upgrade) |
| AppSidebar | ✓ | pending (P0 doc upgrade) |

### copilot/ (tier P1)

| Component | Story | Status |
|-----------|-------|--------|
| DvActionCard | ✓ | done (standard) |
| DvCampaignCard | ✓ | done (standard) |
| DvChartCard | ✓ | done (standard) |
| DvContentCard | ✓ | done (standard) |
| DvDataTable | ✓ | done (standard) |
| DvDialogShell | — | pending |
| DvDraftPreview | — | pending |
| DvExpandDialog | — | pending |
| DvHistoryDrawer | — | pending |
| DvInsightCard | ✓ | done (standard) |
| DvJourneyCard | ✓ | done (standard) |
| DvKpiRow | ✓ | done (standard) |
| DvLandingHero | ✓ | done (standard) |
| DvRefineDialog | — | pending |
| DvSegmentCard | ✓ | done (standard) |
| DvToastStack | — | pending |
| DvWidgetDraftCard | — | pending |
| voice/* (inventory pending) | — | pending |

### dashboards/ (tier P1)

| Component | Story | Status |
|-----------|-------|--------|
| CreateDashboardDialog | — | pending |
| DashboardGrid | — | pending |
| DashboardListCard | — | pending |
| DashboardListTable | — | pending |
| DashboardSetupGuide | — | pending |
| DashboardWidgetActionMenu | — | pending |
| DashboardWidgetCard | — | pending |
| EditDashboardDialog | — | pending |
| WidgetWizardDrawer | — | pending |
| widgets/* (inventory pending) | — | pending |
| wizard/* (inventory pending) | — | pending |

### marketing/ · merchandising/ · settings/ (tier P1)

| Component | Story | Status |
|-----------|-------|--------|
| JourneyFlowColumn | — | pending |
| JourneyMiniPreview | — | pending |
| MerchProductCard | — | pending |
| SettingsPlaceholder | — | pending |
| SettingsSection | — | pending |
| SettingsSidebar | — | pending |

## Cleanup candidates (P2)

| # | Candidate | Sources | Proposal | Verdict | Commit |
|---|-----------|---------|----------|---------|--------|
| 1 | Selectable option card | CreateJourney .cj-card, CreateCampaign template+audience cards, DataJourneys .dj-template | new MpOptionCard | pending | |
| 2 | Status switch + label cell | Journeys.vue, DataJourneys.vue | new MpStatusToggle | pending | |
| 3 | Wizard step chips | CreateJourney .cj-step, EngineEditor steps | new MpWizardSteps | pending | |
| 4 | Confirm dialog | JourneyBuilder delete-split dialog, MpMoveToFolderDialog pattern | new MpConfirmDialog | pending | |
| 5 | Add-step menu ×2 internal | JourneyFlowColumn.vue | internal dedup | pending | |
| 6 | Kebab row-actions menu | ~10 list views | evaluate MpRowActionsMenu | pending | |
| 7 | Empty vs Error state | MpEmptyState, MpErrorState | evaluate merge as variants | pending | |
| 8 | ModuleLandingPage | usage unknown | delete if unused, else story | pending | |

## Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Token & theme audit | docs/design-system/audit.md | pending |
| Component inventory | docs/design-system/inventory.md | pending |
| Cleanup report | docs/design-system/cleanup-report.md | pending |
| Storybook structure | docs/design-system/storybook-structure.md | pending |
| Vuetify mapping | docs/design-system/vuetify-mapping.md | pending |
| Token sync plan | docs/design-system/token-sync-plan.md | pending |
| A11y checklist | docs/design-system/a11y-checklist.md | pending |
| Handoff notes | docs/design-system/handoff.md | pending |

## Progress log

- 2026-07-05 — Program scaffolded: prompt + tracker seeded (52+ components, 29 stories at kickoff; nested dirs copilot/voice, dashboards/widgets, dashboards/wizard pending inventory). Decisions locked: full scope + extractions, full cleanup authority under safety rails, tiered docs, repo-based handoff.
