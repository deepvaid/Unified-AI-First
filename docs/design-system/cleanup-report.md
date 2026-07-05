# Cleanup & Extraction Report (P2)

<!-- Artifact of the Cleanup & Extraction agent (design-system program, Phase 2). -->
<!-- Every verdict below carries repo-wide grep proof and a dedicated commit. -->
<!-- Verification per candidate: `npm run type-check` + `npm run build-storybook` green; preview smoke on account 2000290. -->

## Summary

| # | Candidate | Verdict | Commit(s) |
|---|-----------|---------|-----------|
| 1 | Selectable option card | **extracted → MpOptionCard** (+story), 3 views swapped | `d230167` |
| 2 | Status switch + label cell | **extracted → MpStatusToggle** (+story), 2 views swapped | `ca0c847` |
| 3 | Wizard step chips | **extracted → MpWizardSteps** (+story), CreateJourney swapped; EngineEditor kept its own (incompatible) | `fda29fe` |
| 4 | Confirm dialog | **extracted → MpConfirmDialog** (+story), JourneyBuilder swapped; MpMoveToFolderDialog kept (form dialog) | `ee50c8b` |
| 5 | Add-step menu ×2 internal | **deduped → marketing/JourneyAddStepMenu** (internal, no story) | `d6e3296` |
| 6 | Kebab row-actions menu | **extracted → MpRowActionsMenu** (+story), 2 closest views swapped; other variants left | `012496b` |
| 7 | MpEmptyState vs MpErrorState | **kept separate** — merge rejected as higher-risk (see below) | — (no code change) |
| 8 | ModuleLandingPage | **keep — story in P3** (used by 2 views) | — (no code change) |
| 9 | Grep-zero components (10) | **all 10 deleted** (proof below) | `62f26d4` `09048a2` `fb9c2b8` `28dd311` `ecc8599` `826049a` `c2c14d1` `c70d568` `a4b9ffb` `cf57ffd` |

**Net effect:** 10 components deleted (5 with stories), 6 new components extracted
(5 `Mp*` with stories, 1 internal marketing helper), 69 → 65 component files,
story files 31 − 5 + 5 = 31. Story gap: 38 → 34 (33 actionable — JourneyAddStepMenu
is an internal helper, n/a), and 10 of the old "gaps" were dead code.

---

## 1. MpOptionCard — extracted

**Sources:** `src/views/Marketing/CreateJourney.vue` (`.cj-card`), `src/views/Marketing/CreateCampaign.vue`
(template + audience cards), `src/views/Marketing/DataJourneys.vue` (`.dj-template` drawer cards).

**Evidence:** all three re-implemented the same selectable card: cursor + hover border
`rgba(primary,.5)`, selected = primary border + 1px ring + `circle-check`, avatar/title header,
description, optional preview area.

**New component:** `src/components/MpOptionCard.vue` — props `{ selected: boolean; title: string; description?: string; icon?: string }`,
default slot (extra body: chips, inset previews), `#media` slot (full-bleed footer with top border +
background, used by CreateJourney's flow preview), click/dblclick via native fallthrough.
Story: `MpOptionCard.stories.ts` (Unselected / Selected / WithMedia / SelectionGroup).

**Deliberate standardization (component-owned chrome):**
- CreateCampaign template cards previously used a filled-primary "elevated" selected state with a
  centered big-icon layout; they now use the standard ring + header-row style (consistent with the
  flagship CreateJourney gallery). Audience cards moved from tonal-fill selection to the ring.
- DataJourneys drawer cards: avatar 30→34, check 18 (unchanged), body bottom padding identical.
- Orphaned per-view CSS removed in the same commit (`.cj-card*` chrome, `.dj-template*`,
  `.template-card`, `.border-primary`).

**Verification:** type-check + build-storybook green; preview smoke `/accounts/2000290/journeys/new`
(gallery renders, click selects, ring `box-shadow 0 0 0 1px rgb(0,115,171)` confirmed via inspect).

**Commit:** `d230167` — files: `src/components/MpOptionCard.vue`, `src/components/MpOptionCard.stories.ts`,
`src/views/Marketing/CreateJourney.vue`, `src/views/Marketing/CreateCampaign.vue`, `src/views/Marketing/DataJourneys.vue`.

## 2. MpStatusToggle — extracted

**Sources:** `src/views/Marketing/Journeys.vue`, `src/views/Marketing/DataJourneys.vue` — the status
cell (success v-switch + colored caption label, disabled on Draft) was duplicated verbatim.

**New component:** `src/components/MpStatusToggle.vue` — props `{ status: 'Active' | 'Paused' | 'Draft' }`
(matches `JourneyStatus`/`DataJourneyStatus` unions), emits `toggle`, switch disabled for Draft,
adds an `aria-label` (Pause/Activate) the inline versions lacked. Story: Active / Paused / Draft.

**Verification:** type-check + build-storybook green; preview smoke `/accounts/2000290/journeys`.

**Commit:** `ca0c847` — files: `src/components/MpStatusToggle.vue`, `.stories.ts`, `Journeys.vue`, `DataJourneys.vue`.

## 3. MpWizardSteps — extracted (CreateJourney only)

**Sources:** `CreateJourney.vue` `.cj-step` chips; `EngineEditor.vue` `.engine-step` indicator.

**New component:** `src/components/MpWizardSteps.vue` — props `{ steps: string[]; current: number }`
(1-based), renders the `.cj-step` visual exactly: numbered 22px circles, done = check in tonal primary,
1.5px rail separators, <700px collapse to numbers only. Adds `aria-current="step"`.
Story: TwoSteps / TwoStepsOnSettings / FourStepsMidProgress.

**EngineEditor verdict: NOT swapped.** Its indicator is visually and behaviorally different:
`<button>` pills with tonal background on the active step, success-colored done checks,
click-to-navigate with `stepValid` gating and disabled states, flexible `v-divider` rails.
Forcing it onto the passive MpWizardSteps would remove navigation behavior. Left intact.

**Verification:** type-check + build-storybook green; preview inspect of active step circle
(22px, primary bg, on-primary text).

**Commit:** `fda29fe` — files: `src/components/MpWizardSteps.vue`, `.stories.ts`, `CreateJourney.vue`.

## 4. MpConfirmDialog — extracted

**Source:** `src/views/Marketing/JourneyBuilder.vue` inline delete-split `v-dialog`.

**New component:** `src/components/MpConfirmDialog.vue` — props `{ modelValue, title, message, confirmLabel?, danger? }`,
emits `update:modelValue` + `confirm`; closes on Cancel/Escape/backdrop and after confirm; `danger`
switches to `triangle-alert` + error confirm button. Story: Default + Danger.

**MpMoveToFolderDialog verdict: left as-is.** It is a form dialog (folder select + create-folder flow
via `useFolders`), not a confirm prompt — different component class, no merge.

**Verification:** type-check + build-storybook green; preview smoke: opened journey 1 builder,
triggered Delete on the "Opened welcome email?" split — dialog renders identically (icon, message
with quoted node title, red "Delete split"), cancelled cleanly.

**Commit:** `ee50c8b` — files: `src/components/MpConfirmDialog.vue`, `.stories.ts`, `JourneyBuilder.vue`.

## 5. JourneyAddStepMenu — internal dedup

**Source:** `src/components/marketing/JourneyFlowColumn.vue` repeated the add-step `v-menu`
(220px card, "Add step" header, addable-catalog list) twice: node edge + empty branch.

**New component:** `src/components/marketing/JourneyAddStepMenu.vue` — props `{ items: CatalogItem[] }`,
emits `pick: [item]`, typed scoped default slot for the activator. Both call sites swapped; the
`categoryColor` map is duplicated between the two files (JourneyFlowColumn still needs it for node
headers/chips) — acceptable, both derive from `NodeCategory`. Orphaned `.border-b` rule removed from
JourneyFlowColumn. No story (internal helper), no visual change.

**Verification:** type-check + build-storybook green; preview smoke: add-step menu opens on node
edge with the full 16-item catalog.

**Commit:** `d6e3296` — files: `marketing/JourneyAddStepMenu.vue`, `marketing/JourneyFlowColumn.vue`.

## 6. MpRowActionsMenu — extracted, scoped swap

**Instances read:** `Journeys.vue`, `DataJourneys.vue`, `EmailCampaigns.vue`, `Tickets.vue`
(pattern exists in ~17 views).

**Evaluation:** the core shape is shared (kebab `more-vertical` text button + menu + compact list,
min-width 180, destructive action last behind a divider) but containers diverge: EmailCampaigns wraps
the list in a bordered `v-card` with `size="small"` trigger and explicit `#prepend` icons; Tickets is a
detail-header menu (`location="bottom end"`, `nav` list). Items themselves are always view-specific.
A slot-based wrapper is worth it for the identical pair; forcing the divergent ones would change visuals.

**New component:** `src/components/MpRowActionsMenu.vue` — props `{ ariaLabel: string }` (required —
enforces an accessible name), default slot for `v-list-item`s. Swapped the two structurally identical
views: `Journeys.vue`, `DataJourneys.vue`. Note: use camelCase `ariaLabel=` in templates — kebab
`aria-label` is treated as an ARIA attribute (not the prop) by vue-tsc. Story: Default.

**Verification:** type-check + build-storybook green; preview smoke: Journeys row kebab opens with
View analytics / Duplicate / Pause journey / Delete.

**Commit:** `012496b` — files: `src/components/MpRowActionsMenu.vue`, `.stories.ts`, `Journeys.vue`, `DataJourneys.vue`.

## 7. MpEmptyState vs MpErrorState — kept separate

**Evidence:** both render icon-bubble + title + description + action button with near-identical
layout (~55 lines each). Differences are semantic, not incidental: MpErrorState has `role="alert"`,
error-colored icon in an error-tinted bubble, and recovery defaults (`alert-triangle`,
"Something went wrong", "Try again"); MpEmptyState has an optional neutral icon and required title.

**Verdict: keep separate (lower-risk option).** A merge would add a `variant` prop + conditional
classes/roles to a P0 component, migrate 8 MpErrorState usages (incl. DvHistoryDrawer, DvToastStack)
and rewrite two story files — all for zero visual gain and a wider blast radius in the phase that P3–P5
build on. The duplicated markup is small, stable, and each component's API is already the correct
minimal one for its meaning. Recommendation for P5 docs: cross-link the two in their story docs
("empty = nothing to show; error = something failed").

**Commit:** none (no code change).

## 8. ModuleLandingPage — keep, story in P3

**Proof:**
```
$ grep -rn "ModuleLandingPage" src/ --include="*.vue" --include="*.ts" | grep -v "^src/components/ModuleLandingPage.vue"
src/views/Marketing/ContentLanding.vue:4:import ModuleLandingPage from '@/components/ModuleLandingPage.vue'
src/views/Marketing/ContentLanding.vue:12:} from '@/components/ModuleLandingPage.vue'
src/views/Marketing/ContentLanding.vue:123:  <ModuleLandingPage
src/views/Marketing/MarketingLanding.vue:4:import ModuleLandingPage from '@/components/ModuleLandingPage.vue'
src/views/Marketing/MarketingLanding.vue:12:} from '@/components/ModuleLandingPage.vue'
src/views/Marketing/MarketingLanding.vue:108:  <ModuleLandingPage
```
Used by 2 views (inventory's "4" counted import + template lines). **Verdict: keep — story in P3.**
No code change; tracker row updated.

## 9. Grep-zero components — all 10 deleted

**Method (applied to each):** repo-wide
`grep -rn "<Name>" src/ --include="*.vue" --include="*.ts"` → only self + own story hits.
Dynamic-usage check: the only `component :is` usages in the repo are HTML-tag switches
(MpPageHeader h1/h2, ModuleLandingPage link/span/a/button); every card/step map imports components
by literal name — verified imports of `DvIntentCardList.vue` (6 Dv cards), `DvDraftPreview.vue`
(renders internally, imports none), `MpDaVinciBot.vue` (8 Dv components), `WidgetWizardDrawer.vue`
(WidgetLibraryStep + WidgetEditStep only), `stores/dashboards/widgetLibrary.ts` (types only),
`dashboards/wizard/buildPreviewWidget.ts` (presets + types only). No `import.meta.glob` /
`resolveComponent` component resolution anywhere. Cross-story usage checked: no foreign
`.stories.ts` imports any of the 10. `npm run type-check` after every deletion;
`npm run build-storybook` after every story-bearing deletion + after the final one.

| Component | Story deleted too | Commit |
|-----------|-------------------|--------|
| MpOverviewChart | yes | `62f26d4` |
| copilot/DvActionCard | yes | `09048a2` |
| copilot/DvDataTable | yes | `fb9c2b8` |
| copilot/DvDialogShell | (none) | `28dd311` |
| copilot/DvJourneyCard | yes | `ecc8599` |
| copilot/voice/DvVoiceStatePill | yes | `826049a` |
| dashboards/DashboardListCard | (none) | `c2c14d1` |
| dashboards/DashboardListTable | (none) | `c70d568` |
| dashboards/wizard/WidgetWizardManualSteps | (none) | `a4b9ffb` |
| dashboards/wizard/WidgetWizardModeChooser | (none) | `cf57ffd` |

**Side note for P3:** deleting DashboardListCard removed one MpSourceCloudChip consumer;
MpSourceCloudChip remains used by DashboardWidgetCard and DashboardKpiWidget.

---

## Follow-ups handed to later phases

- **P3:** stories for ModuleLandingPage (candidate #8) and the remaining gap list (now 33 actionable).
- **P4/P5:** clickable-card keyboard access (MpOptionCard inherits the pre-existing pattern of
  click-only cards; kept parity by design), EngineEditor's stepper stays bespoke — document it as a
  navigational variant in the pattern docs.
- Remaining kebab-menu views (EmailCampaigns, Tickets, Merchandising list views) can adopt
  MpRowActionsMenu opportunistically when they are next touched; not forced in P2 to avoid visual drift.
