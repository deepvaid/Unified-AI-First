# Component Library Tracker

<!-- STATE FILE for the design-system program (docs/design-system/program-prompt.md). -->
<!-- The ONLY memory between sessions. Update after every phase/batch/commit. -->
<!-- Status: pending | in-progress | done | n/a. Tier: P0 (full docs) | P1 (standard story). -->

## Phase checklist

| Phase | Scope | Status |
|-------|-------|--------|
| P0 | Scaffold (this file + program prompt) | done |
| P1 | Recon: token audit + inventory (artifacts: audit.md, inventory.md) | done |
| P2 | Cleanup & extraction (candidates → cleanup-report.md) | done |
| P3 | Story coverage (5 batches) | in-progress (batches A–C done: dashboards, copilot+voice, settings/marketing/merchandising) |
| P4 | A11y QA (a11y-checklist.md) | pending |
| P5 | Foundations + docs + handoff + CLAUDE.md refresh | pending |

## Component table

<!-- Seeded from kickoff ls; the P1 inventory agent corrects/expands (nested dirs!) and adds used-by counts. -->

### Top level (tier P0)

| Component | Story | Cleanup verdict | Status |
|-----------|-------|-----------------|--------|
| ModuleLandingPage | ✓ | #8: keep (used by ContentLanding + MarketingLanding) | done (standard; P0 doc upgrade pending) |
| MpConfirmDialog *(new, P2)* | ✓ | #4: extracted from JourneyBuilder (`ee50c8b`) | pending (P0 doc upgrade) |
| MpDaVinciBot | ✓ | | pending (P0 doc upgrade) |
| MpDataTableToolbar | ✓ | | pending (P0 doc upgrade) |
| MpEmptyState | ✓ | #7: kept separate (merge rejected — see cleanup report) | pending (P0 doc upgrade) |
| MpErrorState | ✓ | #7: kept separate (merge rejected — see cleanup report) | pending (P0 doc upgrade) |
| MpFilterTabs | ✓ | | pending (P0 doc upgrade) |
| MpFloatingBulkBar | ✓ | | pending (P0 doc upgrade) |
| MpFolderSelect | ✓ | | pending (P0 doc upgrade) |
| MpFormDrawer | ✓ | | pending (P0 doc upgrade) |
| MpKpiCard | ✓ | | pending (P0 doc upgrade) |
| MpManageFoldersDrawer | ✓ | | pending (P0 doc upgrade) |
| MpMoveToFolderDialog | ✓ | #4: kept (form dialog, not a confirm prompt) | pending (P0 doc upgrade) |
| MpOptionCard *(new, P2)* | ✓ | #1: extracted from CreateJourney/CreateCampaign/DataJourneys (`d230167`) | pending (P0 doc upgrade) |
| ~~MpOverviewChart~~ | — | #9: deleted — unused (`62f26d4`) | done (deleted) |
| MpPageHeader | ✓ | | pending (P0 doc upgrade) |
| MpRowActionsMenu *(new, P2)* | ✓ | #6: extracted from Journeys/DataJourneys (`012496b`) | pending (P0 doc upgrade) |
| MpSectionHeader | ✓ | | pending (P0 doc upgrade) |
| MpSourceCloudChip | ✓ | | pending (P0 doc upgrade) |
| MpStatusChip | ✓ | | pending (P0 doc upgrade) |
| MpStatusToggle *(new, P2)* | ✓ | #2: extracted from Journeys/DataJourneys (`ca0c847`) | pending (P0 doc upgrade) |
| MpTableSkeleton | ✓ | | pending (P0 doc upgrade) |
| MpWizardSteps *(new, P2)* | ✓ | #3: extracted from CreateJourney; EngineEditor kept its own (`fda29fe`) | pending (P0 doc upgrade) |

### layout/ (tier P0)

| Component | Story | Status |
|-----------|-------|--------|
| AppBar | ✓ | pending (P0 doc upgrade) |
| AppSidebar | ✓ | pending (P0 doc upgrade) |

### copilot/ (tier P1)

| Component | Story | Status |
|-----------|-------|--------|
| ~~DvActionCard~~ | — | deleted in P2 — unused (`09048a2`) |
| DvCampaignCard | ✓ | done (standard) |
| DvChartCard | ✓ | done (standard) |
| DvContentCard | ✓ | done (standard) |
| ~~DvDataTable~~ | — | deleted in P2 — unused (`fb9c2b8`) |
| ~~DvDialogShell~~ | — | deleted in P2 — unused (`28dd311`) |
| DvDraftPreview | ✓ | done (standard) |
| DvExpandDialog | ✓ | done (standard) |
| DvHistoryDrawer | — | pending |
| DvInsightCard | ✓ | done (standard) |
| ~~DvJourneyCard~~ | — | deleted in P2 — unused (`ecc8599`) |
| DvKpiRow | ✓ | done (standard) |
| DvLandingHero | ✓ | done (standard) |
| DvRefineDialog | ✓ | done (standard) |
| DvSegmentCard | ✓ | done (standard) |
| DvToastStack | ✓ | done (standard) |
| DvWidgetDraftCard | ✓ | done (standard) |
| voice/DvOrbCanvas | ✓ | done (standard) |
| voice/DvIntentCardList | ✓ | done (standard) |
| voice/DvOrbitOrb | ✓ | done (standard) |
| voice/DvOrbitVoiceSurface | ✓ | done (standard) |
| voice/DvOrbitMicBar | ✓ | done (standard) |
| voice/DvOrbitWaveBars | ✓ | done (standard) |
| voice/DvOrbitStatusPill | ✓ | done (standard) |
| ~~voice/DvVoiceStatePill~~ | — | deleted in P2 — unused, story-only (`826049a`) |

### dashboards/ (tier P1)

| Component | Story | Status |
|-----------|-------|--------|
| CreateDashboardDialog | ✓ | done (standard) |
| DashboardGrid | ✓ | done (standard) |
| ~~DashboardListCard~~ | — | deleted in P2 — unused (`c2c14d1`) |
| ~~DashboardListTable~~ | — | deleted in P2 — unused (`c70d568`) |
| DashboardSetupGuide | ✓ | done (standard) |
| DashboardWidgetActionMenu | ✓ | done (standard) |
| DashboardWidgetCard | ✓ | done (standard) |
| EditDashboardDialog | ✓ | done (standard) |
| WidgetWizardDrawer | ✓ | done (standard) |
| widgets/DashboardActivityWidget | ✓ | done (standard) |
| widgets/DashboardChartWidget | ✓ | done (standard) |
| widgets/DashboardKpiWidget | ✓ | done (standard) |
| widgets/DashboardPieWidget | ✓ | done (standard) |
| widgets/DashboardTableWidget | ✓ | done (standard) |
| wizard/WidgetEditStep | ✓ | done (standard) |
| wizard/WidgetLibraryStep | ✓ | done (standard) |
| ~~wizard/WidgetWizardManualSteps~~ | — | deleted in P2 — unused (`a4b9ffb`) |
| ~~wizard/WidgetWizardModeChooser~~ | — | deleted in P2 — unused (`cf57ffd`) |

### marketing/ · merchandising/ · settings/ (tier P1)

| Component | Story | Status |
|-----------|-------|--------|
| JourneyAddStepMenu *(new, P2)* | — | n/a story (internal dedup helper, `d6e3296`) |
| JourneyFlowColumn | ✓ | done (standard) |
| JourneyMiniPreview | ✓ | done (standard) |
| MerchProductCard | ✓ | done (standard) |
| SettingsPlaceholder | ✓ | done (standard) |
| SettingsSection | ✓ | done (standard) |
| SettingsSidebar | ✓ | done (standard) |

## Cleanup candidates (P2)

| # | Candidate | Sources | Proposal | Verdict | Commit |
|---|-----------|---------|----------|---------|--------|
| 1 | Selectable option card | CreateJourney .cj-card, CreateCampaign template+audience cards, DataJourneys .dj-template | new MpOptionCard | extracted + 3 views swapped (CreateCampaign converges on ring style) | `d230167` |
| 2 | Status switch + label cell | Journeys.vue, DataJourneys.vue | new MpStatusToggle | extracted + 2 views swapped | `ca0c847` |
| 3 | Wizard step chips | CreateJourney .cj-step, EngineEditor steps | new MpWizardSteps | extracted; CreateJourney swapped, EngineEditor kept (clickable pill navigator, incompatible) | `fda29fe` |
| 4 | Confirm dialog | JourneyBuilder delete-split dialog, MpMoveToFolderDialog pattern | new MpConfirmDialog | extracted; JourneyBuilder swapped, MpMoveToFolderDialog kept (form dialog) | `ee50c8b` |
| 5 | Add-step menu ×2 internal | JourneyFlowColumn.vue | internal dedup | deduped → marketing/JourneyAddStepMenu, no visual change | `d6e3296` |
| 6 | Kebab row-actions menu | ~17 list views | evaluate MpRowActionsMenu | extracted (slot-based); swapped the 2 identical views (Journeys, DataJourneys); heterogeneous variants left | `012496b` |
| 7 | Empty vs Error state | MpEmptyState, MpErrorState | evaluate merge as variants | kept separate — merge is higher-risk (role="alert"/error semantics, 8 usages) for zero visual gain | — |
| 8 | ModuleLandingPage | used by 2 views (ContentLanding, MarketingLanding) | keep + story | keep — story in P3 | — |
| 9 | Grep-zero components | MpOverviewChart, DvActionCard, DvDataTable, DvDialogShell, DvJourneyCard, DvVoiceStatePill, DashboardListCard, DashboardListTable, WidgetWizardManualSteps, WidgetWizardModeChooser | re-verify (dynamic `component :is` maps!) → delete or keep+story per proof | all 10 deleted — no static refs, no dynamic-map refs (proof in cleanup-report.md §9) | `62f26d4`…`cf57ffd` (one each) |

## Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Token & theme audit | docs/design-system/audit.md | done |
| Component inventory | docs/design-system/inventory.md | done |
| Cleanup report | docs/design-system/cleanup-report.md | done |
| Storybook structure | docs/design-system/storybook-structure.md | pending |
| Vuetify mapping | docs/design-system/vuetify-mapping.md | pending |
| Token sync plan | docs/design-system/token-sync-plan.md | pending |
| A11y checklist | docs/design-system/a11y-checklist.md | pending |
| Handoff notes | docs/design-system/handoff.md | pending |

## Progress log

- 2026-07-05 — Program scaffolded: prompt + tracker seeded (52+ components, 29 stories at kickoff; nested dirs copilot/voice, dashboards/widgets, dashboards/wizard pending inventory). Decisions locked: full scope + extractions, full cleanup authority under safety rails, tiered docs, repo-based handoff.
- 2026-07-05 — P1 recon done. Corrected totals: **69 components, 31 stories, 38 gaps**. Audit highlights: token pipeline healthy (3 drift values), Storybook preview already registers Vuetify+Pinia+Router with theme toolbar, a11y addon missing, 33 components with px font-size literals, dark-mode scrollbar bug, tokens.scss deprecation candidate. Inventory adds 10 grep-zero components as cleanup candidate #9 (dynamic-usage re-verification required).
- 2026-07-06 — P2 cleanup done. All 9 candidates resolved (16 code commits + this docs commit): 5 extractions (MpOptionCard, MpStatusToggle, MpWizardSteps, MpConfirmDialog, MpRowActionsMenu — all with stories; + internal JourneyAddStepMenu), 10 unused components deleted with grep + dynamic-map proof, #7 kept separate, #8 kept for a P3 story. New totals: **65 components, 31 stories, 34 gaps (33 actionable)**. type-check + build-storybook green throughout; preview smokes on account 2000290.
- 2026-07-06 — P3 batch A (dashboards) done. 14 CSF3 stories added under `Dashboards/` (+`Widgets/`, `Wizard/` subgroups), 40 stories total across the batch: dialogs/drawer rendered open with re-open buttons, grid populated/edit/empty, widget card across all 6 data kinds + editable/preview, widget renderers with mock `Dashboard*Data` payloads, wizard steps with interactive draft wiring. Store-coupled stories use seeded account 2000290 (Pinia registered in preview.ts). No components modified; none skipped. New totals: **45 stories, 20 gaps (19 actionable)**. type-check + build-storybook green.
- 2026-07-06 — P3 batch C (settings + marketing + merchandising + ModuleLandingPage) done. 7 CSF3 story files, 27 story exports: SettingsSidebar registers stub routes for the settingsMenu route names story-side (the preview router only ships a catch-all) and navigates to a named route so the active item + aria-current render; JourneyFlowColumn/JourneyMiniPreview build graphs from the template gallery via `buildSegments` (abandoned-cart linear slice, welcome YES/NO rejoin, lapsed-buyer nested A/B split, advocacy empty branch, selectedId ring with click-to-select wiring, `catalog` swap to dataNodeCatalog over a Salesforce data-journey flow); MerchProductCard uses store-shaped mock products (picsum seeds) with stateful pin/select wiring + collection-grid composition; ModuleLandingPage seeded with the MarketingLanding config (Default / Minimal / SetupComplete). Note: ModuleLandingPage DOES take a full props API — the kickoff "no props" assumption was wrong; story renders it prop-driven, no route-meta wrapper needed. No components modified; none skipped. New totals: **63 stories, 2 gaps (1 actionable: DvHistoryDrawer)**. type-check + build-storybook green; dev-Storybook smokes (sidebar active route, nested split branch chips, data palette add-menu, merch grid ranks/sale price, landing sections).
- 2026-07-06 — P3 batch B (copilot + voice) done. 11 CSF3 story files added under `Copilot/` + `Copilot/Voice/`, 47 story exports: toast stack drives the `useDaVinciToasts` singleton from story setup (queue reset + long-lived seeds + transient-push button, docs in isolated iframes); widget draft card runs the full add→refine→commit flow against the seeded dashboards store (account 2000290, dashboard `2000290-home`); draft preview covers all 7 render kinds + densities; refine/expand dialogs open in tall decorators with re-open buttons; voice surface staged in a 420×640 drawer frame across all 7 `OrbitState`s; DvOrbCanvas renders the live WebGL engine on a fixed dark stage with synthetic `OrbAudioFrame` sources (built-in CSS fallback covers static builds); orbit mark/mic bar/wave bars/status pill pinned to their per-state size/speed combos. Voice stories import `@/styles/dv-orbit.css` story-side (app loads it via main.ts; preview.ts doesn't). No components modified; none skipped. New totals: **56 stories, 9 gaps (8 actionable)**. type-check + build-storybook green; preview smokes on the dev Storybook (draft add flow, teleported toasts, WebGL ready flag, keyframe resolution).
