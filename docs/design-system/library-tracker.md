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
| P3 | Story coverage (5 batches) | done (A: dashboards · B: copilot+voice · C: settings/marketing/merchandising · D1+D2: P0 doc upgrades + DvHistoryDrawer) |
| P4 | A11y QA (a11y-checklist.md) | done (13 fix commits + addon-a11y; checklist written by orchestrator after agent stall) |
| P5 | Foundations + docs + handoff + CLAUDE.md refresh | done — **program closed** |

## Component table

<!-- Seeded from kickoff ls; the P1 inventory agent corrects/expands (nested dirs!) and adds used-by counts. -->

### Top level (tier P0)

| Component | Story | Cleanup verdict | Status |
|-----------|-------|-----------------|--------|
| ModuleLandingPage | ✓ | #8: keep (used by ContentLanding + MarketingLanding) | done (P0 full) |
| MpConfirmDialog *(new, P2)* | ✓ | #4: extracted from JourneyBuilder (`ee50c8b`) | done (P0 full) |
| MpDaVinciBot | ✓ | | done (standard — tier P1 per inventory: app surface, not a primitive) |
| MpDataTableToolbar | ✓ | | done (P0 full) |
| MpEmptyState | ✓ | #7: kept separate (merge rejected — see cleanup report) | done (P0 full) |
| MpErrorState | ✓ | #7: kept separate (merge rejected — see cleanup report) | done (P0 full) |
| MpFilterTabs | ✓ | | done (P0 full) |
| MpFloatingBulkBar | ✓ | | done (P0 full) |
| MpFolderSelect | ✓ | | done (P0 full) |
| MpFormDrawer | ✓ | | done (P0 full) |
| MpKpiCard | ✓ | | done (P0 full) |
| MpManageFoldersDrawer | ✓ | | done (P0 full) |
| MpMoveToFolderDialog | ✓ | #4: kept (form dialog, not a confirm prompt) | done (P0 full) |
| MpOptionCard *(new, P2)* | ✓ | #1: extracted from CreateJourney/CreateCampaign/DataJourneys (`d230167`) | done (P0 full) |
| ~~MpOverviewChart~~ | — | #9: deleted — unused (`62f26d4`) | done (deleted) |
| MpPageHeader | ✓ | | done (P0 full) |
| MpRowActionsMenu *(new, P2)* | ✓ | #6: extracted from Journeys/DataJourneys (`012496b`) | done (P0 full) |
| MpSectionHeader | ✓ | | done (P0 full) |
| MpSourceCloudChip | ✓ | | done (P0 full) |
| MpStatusChip | ✓ | | done (P0 full) |
| MpStatusToggle *(new, P2)* | ✓ | #2: extracted from Journeys/DataJourneys (`ca0c847`) | done (P0 full) |
| MpTableSkeleton | ✓ | | done (P0 full) |
| MpWizardSteps *(new, P2)* | ✓ | #3: extracted from CreateJourney; EngineEditor kept its own (`fda29fe`) | done (P0 full) |

### layout/ (tier P0)

| Component | Story | Status |
|-----------|-------|--------|
| AppBar | ✓ | done (P0 full) |
| AppSidebar | ✓ | done (P0 full) |

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
| DvHistoryDrawer | ✓ | done (standard) |
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
| Storybook structure | docs/design-system/storybook-structure.md | done |
| Vuetify mapping | docs/design-system/vuetify-mapping.md | done |
| Token sync plan | docs/design-system/token-sync-plan.md | done |
| A11y checklist | docs/design-system/a11y-checklist.md | done |
| Handoff notes | docs/design-system/handoff.md | done |

## Progress log

- 2026-07-06 — Theme builder gained a categorized + variant Add Section dialog, blocks-within-sections (layer tree, canvas, settings), and an Edit Code mock IDE; new files `AddSectionDialog.vue`, `themeCodeData.ts`, `useThemeCode.ts`, `StoreThemeCode.vue`; commits `e039600` through `24807b5`; marotools builder still automation-blocked so built from screenshots.
- 2026-07-06 — Da Vinci theme-builder flow hardened after a two-lens adversarial review (correctness hand-trace + live app-driving). 7 findings fixed across 3 commits (`c0c8176` generator: \b word boundaries, prompt-order, headline-to-nearest, apostrophe-safe quotes, bundle dedupe, unambiguous chip · `7545ba2` store: insert above trailing footer · `f8d05ac` builder: per-template chat/undo, cross-theme reset, dark-mode note contrast, canvas aria-labels, placeholder clip). Re-verification (both lenses) passed clean — 0 regressions, 0 residual.

- 2026-07-06 — Da Vinci in-builder section generator shipped for the store theme builder — `useThemeGenerator` composable, `ThemeDaVinciPanel` (+ CSF3 story, title `Sales Channels/ThemeDaVinciPanel`), Generate-with-AI picker entry, batch `addSections`/`removeSections` store actions, `pendingIds` review highlight + per-turn undo; commits `349a66c`…(this one). Marotools builder internals remain un-crawlable (automation-blocked) — flow built from user screenshots; a future re-crawl could refine catalog fidelity.
- 2026-07-06 — Post-program addition (store theme-builder slice): new reusable `src/components/saleschannels/StorefrontPreview.vue` (+ CSF3 story, title `Sales Channels/StorefrontPreview`) extracted from SalesChannelDetail's inline mock and reused as the theme-builder canvas; new `src/views/SalesChannels/StoreThemeBuilder.vue` (page view, no story per convention). SalesChannelDetail polished to use `MpKpiCard` + a `StorefrontPreview` preview dialog; CreateSalesChannel adopted `MpWizardSteps`. Additive to the closed program; totals unaffected (66 components incl. StorefrontPreview, still 0 story gaps). Commits `c1c4ce2`, `d8ae059`…`2effb00`, `d9bfb18`. type-check + build-storybook green.
- 2026-07-06 — **P5 done — PROGRAM CLOSED.** Foundations rebuilt tokens-driven in place at `src/stories/Foundation/` (Colors light+dark+scales+charts, Typography ramps+display+semantic composites, Spacing+layout bars at real token width, Radius & Shadows merges the old Radius+Elevation pages, Icons = searchable catalog of all 1934 bridge-resolvable Lucide names + exported MDI_TO_LUCIDE alias grid) — `b9b66a8`. Four handoff artifacts written from the P1–P4 artifacts (`fcca0ec`); CLAUDE.md component inventory + file-structure block refreshed to the 22-component P0 set with a docs/design-system pointer (`33d27c2`); tracker closed (this commit). **Program totals: 65 components, 0 story gaps — 64 component story files + 5 foundations pages (347 story exports across 87 src story files; 508 in the full build incl. Archive + @marobase/ui), 43 commits (`8437dc6`…close-out), all 8 artifacts done.** Final gates green: `npm run type-check` + `npm run build-storybook`.
- 2026-07-05 — Program scaffolded: prompt + tracker seeded (52+ components, 29 stories at kickoff; nested dirs copilot/voice, dashboards/widgets, dashboards/wizard pending inventory). Decisions locked: full scope + extractions, full cleanup authority under safety rails, tiered docs, repo-based handoff.
- 2026-07-05 — P1 recon done. Corrected totals: **69 components, 31 stories, 38 gaps**. Audit highlights: token pipeline healthy (3 drift values), Storybook preview already registers Vuetify+Pinia+Router with theme toolbar, a11y addon missing, 33 components with px font-size literals, dark-mode scrollbar bug, tokens.scss deprecation candidate. Inventory adds 10 grep-zero components as cleanup candidate #9 (dynamic-usage re-verification required).
- 2026-07-06 — P4 a11y QA done. 13 fix commits (`46a4f6d`…`9e9a06e`, one per component/cluster): MpOptionCard made keyboard-operable (role=button, tabindex, Enter/Space, focus-visible — verified live in the wizard), heading semantics for 4 div-title components, aria-controls on MpFilterTabs, switch-label association on MpStatusToggle, dialog labelling ×3, focus-trap fix on MpFormDrawer, named landmarks/status regions, DvHistoryDrawer labelled search + MpConfirmDialog dogfooding. `@storybook/addon-a11y` installed + registered (`5cfa0ac`). Agent stalled post-fixes; orchestrator re-ran gates (green), verified MpOptionCard live, and wrote a11y-checklist.md. Deferred items recorded in the checklist backlog.
- 2026-07-06 — P3 batch D2 done (12 interactive/overlay/layout P0 stories upgraded to full treatment: MpDataTableToolbar, MpFloatingBulkBar, MpFormDrawer, MpFolderSelect, MpManageFoldersDrawer, MpMoveToFolderDialog, MpConfirmDialog, MpRowActionsMenu, MpStatusToggle, MpWizardSteps, AppBar, AppSidebar). The batch agent hit a session limit before committing; orchestrator verified the 12 edited story files (type-check + build-storybook green, quality skim, title taxonomy consistent) and landed them. MpDaVinciBot confirmed tier P1 (standard story sufficient). **P3 complete: 0 story gaps across 65 components.** A11y gaps for P4 documented per story (worst: MpOptionCard not keyboard-operable; div-based headings; MpEmptyState no live region; DvHistoryDrawer unlabeled search + window.confirm).
- 2026-07-06 — P2 cleanup done. All 9 candidates resolved (16 code commits + this docs commit): 5 extractions (MpOptionCard, MpStatusToggle, MpWizardSteps, MpConfirmDialog, MpRowActionsMenu — all with stories; + internal JourneyAddStepMenu), 10 unused components deleted with grep + dynamic-map proof, #7 kept separate, #8 kept for a P3 story. New totals: **65 components, 31 stories, 34 gaps (33 actionable)**. type-check + build-storybook green throughout; preview smokes on account 2000290.
- 2026-07-06 — P3 batch A (dashboards) done. 14 CSF3 stories added under `Dashboards/` (+`Widgets/`, `Wizard/` subgroups), 40 stories total across the batch: dialogs/drawer rendered open with re-open buttons, grid populated/edit/empty, widget card across all 6 data kinds + editable/preview, widget renderers with mock `Dashboard*Data` payloads, wizard steps with interactive draft wiring. Store-coupled stories use seeded account 2000290 (Pinia registered in preview.ts). No components modified; none skipped. New totals: **45 stories, 20 gaps (19 actionable)**. type-check + build-storybook green.
- 2026-07-06 — P3 batch C (settings + marketing + merchandising + ModuleLandingPage) done. 7 CSF3 story files, 27 story exports: SettingsSidebar registers stub routes for the settingsMenu route names story-side (the preview router only ships a catch-all) and navigates to a named route so the active item + aria-current render; JourneyFlowColumn/JourneyMiniPreview build graphs from the template gallery via `buildSegments` (abandoned-cart linear slice, welcome YES/NO rejoin, lapsed-buyer nested A/B split, advocacy empty branch, selectedId ring with click-to-select wiring, `catalog` swap to dataNodeCatalog over a Salesforce data-journey flow); MerchProductCard uses store-shaped mock products (picsum seeds) with stateful pin/select wiring + collection-grid composition; ModuleLandingPage seeded with the MarketingLanding config (Default / Minimal / SetupComplete). Note: ModuleLandingPage DOES take a full props API — the kickoff "no props" assumption was wrong; story renders it prop-driven, no route-meta wrapper needed. No components modified; none skipped. New totals: **63 stories, 2 gaps (1 actionable: DvHistoryDrawer)**. type-check + build-storybook green; dev-Storybook smokes (sidebar active route, nested split branch chips, data palette add-menu, merch grid ranks/sale price, landing sections).
- 2026-07-06 — P3 batch D1 (P0 doc upgrades part 1 of 2 + DvHistoryDrawer) done. 11 display/feedback P0 stories upgraded in place to full treatment — Use-when/Don't-use bullets, Usage snippets, explicit A11y sections (provides / consumer must / gaps), argTypes descriptions for every prop + slots/events, and state-matrix stories: MpStatusChip full status × type matrix (all 10 tone maps + neutral fallback) + sizes × variants, MpKpiCard trend up/down/flat + all 13 icon tones (loading unsupported — documented), MpEmptyState/MpErrorState long-copy + with/without action, MpTableSkeleton in-card composition, MpSourceCloudChip all-8-sources + size matrix, MpPageHeader backTo + long-title, MpFilterTabs docs added (stories already covered counts/no-counts/overflow), MpSectionHeader/MpOptionCard/ModuleLandingPage docs completed. MpKpiCard + MpSourceCloudChip stories import `@/styles/source-cloud-colors.css` story-side (app loads it via main.ts; preview.ts doesn't — Batch B convention). NEW DvHistoryDrawer standard story (overlay/rail/empty in a 380×560 panel frame; seeds+re-dates the useDaVinciHistory singleton for deterministic Today/Yesterday/Last-7-days/Older groups). Existing story ids/names untouched. A11y gaps flagged for P4: **MpOptionCard not keyboard-operable** (div root, no tabindex/role/focus ring, invalid aria-pressed), MpSectionHeader + empty/error-state titles are divs not headings, MpEmptyState has no live region, MpSourceCloudChip is a role-less span with aria-label, MpFilterTabs lacks aria-controls, ModuleLandingPage section eyebrows aren't headings, DvHistoryDrawer search input has no label + clear-all uses window.confirm. New totals: **64 stories, 1 gap (0 actionable — JourneyAddStepMenu is n/a)**. type-check + build-storybook green; preview smokes on dev Storybook (drawer overlay/rail/empty, status matrix tones, cloud-accent KPI tiles, back-link focus rule, autodocs sections + args table).
- 2026-07-06 — P3 batch B (copilot + voice) done. 11 CSF3 story files added under `Copilot/` + `Copilot/Voice/`, 47 story exports: toast stack drives the `useDaVinciToasts` singleton from story setup (queue reset + long-lived seeds + transient-push button, docs in isolated iframes); widget draft card runs the full add→refine→commit flow against the seeded dashboards store (account 2000290, dashboard `2000290-home`); draft preview covers all 7 render kinds + densities; refine/expand dialogs open in tall decorators with re-open buttons; voice surface staged in a 420×640 drawer frame across all 7 `OrbitState`s; DvOrbCanvas renders the live WebGL engine on a fixed dark stage with synthetic `OrbAudioFrame` sources (built-in CSS fallback covers static builds); orbit mark/mic bar/wave bars/status pill pinned to their per-state size/speed combos. Voice stories import `@/styles/dv-orbit.css` story-side (app loads it via main.ts; preview.ts doesn't). No components modified; none skipped. New totals: **56 stories, 9 gaps (8 actionable)**. type-check + build-storybook green; preview smokes on the dev Storybook (draft add flow, teleported toasts, WebGL ready flag, keyframe resolution).
