# 04 — Implementation Plan (UI System Consolidation)

**Author:** Architecture/planning phase (Fable 5), 2026-07-30
**Inputs:** `00-reference-research.md`, `01-repository-discovery.md`, `02-ux-design-system-audit.md`, `03-accessibility-audit.md`, `docs/overlay-audit/01-overlay-component-audit.md`, `docs/dark-mode/06-theme-architecture.md` + `07-final-verification.md`
**Branch:** `feature/ui-system-consolidation`
**Execution log:** every WP appends to `docs/ui-system-audit/05-execution-log.md` (create on first WP).

This plan is written so a coding agent can execute each work package **without making new visual or architectural decisions**. Where a value requires computation (contrast math), the acceptance criterion states the target and the agent computes the value; it does not choose the target.

---

## Locked decisions (do not re-litigate)

| # | Decision | Source |
|---|---|---|
| D1 | **2A architecture**: improve Vuetify primitives via semantic tokens + `maropostDefaults` + `global.scss`; edit existing Mp*/domain components; **no new wrapper components** | `docs/overlay-audit/01` + user confirmation |
| D2 | **One exception to D1**: a shared toast API (`useToast` + `MpToastStack`) replacing 179 per-view `v-snackbar`s | User confirmation |
| D3 | Dark mode is **done** — only the 4 open lows (AUD-L01/L02/L03/L05) are in scope | `docs/dark-mode/07` + user confirmation |
| D4 | Never override Vuetify's internal overlay z-index (`--mp-zIndex-dropdown/modal` stay reference-only) | `docs/overlay-audit/01` §4 |
| D5 | Light-mode token leaves stay byte-identical **except** the changes explicitly listed in WP-F1 | Plan constraint |
| D6 | Showcase surfaces are out of scope: `src/views/Deck/`, `src/views/Reel/`, `src/views/Showcase*`, `src/views/Retail/PosPreview.vue`, `scripts/trailer/` | Plan constraint |
| D7 | Cyan accent identity (`#2CC4FF` dark primary, light `#1A56DB`/accent presets) untouched | Prompt non-negotiable |
| D8 | User check-ins: after Phase 3 (foundation), then after each Phase 4 family; hard gates before Phase 6 verification and Phase 7 page-polish | User confirmation |
| D9 | Do **not** build ahead of need: no vertical `MpWizardSteps`, no shortcuts modal, no type-to-confirm tier, no Da Vinci config/preview split (research §4/§5/§7/§9 flags) | `00-reference-research.md` |

**Per-WP protocol:** one commit per WP (`[fix]:`/`[feat]:`/`[chore]:` per repo conventions); run `npm run type-check` + `npm run build` before committing; append to the execution log (work done, files, tokens changed, tests, deviations); screenshot light+dark on the WP's representative screen when the change is visual.

---

## Phase 3 — Foundation packages (sequential)

### WP-F1 — Light-mode token corrections (the only light token changes in this program)

**Files:** `src/design-tokens/tokens.json`, `npm run tokens:build`, `src/styles/mp-theme-aliases.css`

1. **A11Y-003** — darken `color.light.onSurfaceVariant` (currently `#737373`) to a neutral-cool grey that computes **≥4.5:1 on all three tiers**: `#ececec` (surfaceVariant), `#f4f6fa` (background), `#ffffff` (surface). Audit suggests `#5f5f5f` clears; prefer a slightly cool step (e.g. `#5C6066`-family) but the contrast target governs — compute and verify all three ratios, record them in the execution log.
2. **Author explicit light overlay tokens** instead of alias-invented values: add `color.light.surfaceOverlay = #FFFFFF` and `color.light.scrim` matching the value the alias currently synthesizes (read `mp-theme-aliases.css` for the current computed scrim; keep it visually identical). Wire `--surface-overlay`/`--scrim-overlay` light branches to the new tokens. **This is a refactor, not a visual change** — light menus stay white and separate via border+shadow, exactly like Linear/Notion menus (research §1); do NOT introduce an off-white menu surface.
3. **AUD-L05** — apply the deferred dark error-text ratio bump exactly as specified in `docs/dark-mode/06-independent-audit.md` AUD-L05 (single dark token step; verify ≥ the plan ratio on `surfaceOverlay`).

**Acceptance:** token diff touches only the leaves named above; `git diff` on generated files shows no other light values changed; contrast numbers logged; dashboard + contacts screenshots show no perceptible light-mode shift except secondary-text darkening.

### WP-F2 — Field boundary contrast (A11Y-001 High, A11Y-002)

**Files:** `src/styles/global.scss` (alongside existing `.v-field` transition rule ~:271-280), `src/components/MpDataTableToolbar.vue`

1. Global rule: raise the **resting** outlined-field border so the composited color reaches **≥3:1** against both `#ffffff` and `#f4f6fa`. Implementation: set `--v-field-border-opacity` for `.v-field--variant-outlined:not(.v-field--focused):not(:hover) .v-field__outline` (or bind the outline color to `var(--border-strong)`); compute the resulting ratio and log it. Hover/focus states unchanged (already compliant).
2. `MpDataTableToolbar` ghost search (`:257-259`, opacity 0.16): keep the ghost look by **switching the boundary cue to a fill** — resting state gets `background: var(--surface-secondary)` (or existing hover-tint token) with the border override removed, so the field's extent is conveyed by fill, not a sub-3:1 border. Focused state unchanged.
3. Dark mode: verify the same rules against dark surfaces (dark `border`/`borderStrong` tokens were AA'd in the dark program — confirm the new binding uses the semantic var so dark inherits correctly).

**Acceptance:** computed resting border ≥3:1 light (log the number); toolbar search visibly bounded at rest via fill; no dark regression on the contacts toolbar screenshot; every settings form field shows the stronger resting border.

### WP-F3 — Overlay defaults + z-index hygiene + selected checkmark

**Files:** `src/plugins/maropostTheme.ts` (`maropostDefaults`), `src/styles/global.scss`, `src/App.vue`, `src/views/DaVinci/DaVinciExperience.vue`, `src/components/copilot/DvHistoryDrawer.vue`

1. Add `maropostDefaults` entries (fill the documented gap, respecting D4 — props only, no z-index):
   - `VDialog: { rounded: 'xl' }` — makes the docs' claimed default real (`component.dialog.radius.default` 16px = Vuetify `xl`? **verify**: Vuetify `rounded="xl"` = 24px — if so, keep dialogs on the existing global.scss radius rule instead and add only `VDialog: {}` entries that are true; do not change dialog radius visually).
   - `VMenu: { offset: 4 }` (research §1: menus sit 4-8px below trigger; current default 0).
   - `VTooltip: { location: 'top', openDelay: 150, closeDelay: 0 }` — one consistent timing app-wide.
   - `VSnackbar: { timeout: 2500, location: 'bottom center' }` — codifies the observed majority default until WP-C1 replaces call sites.
2. Tokenize the literal menu chrome in `global.scss` menu rules: `4px` list padding → `var(--mp-spacing-1)`, `8px` item radius → `var(--mp-borderRadius-md)`; remove `!important` where specificity allows (test in Storybook before/after).
3. **UX-008 selected checkmark**: add a global rule scoped to select/menu overlays (`.v-overlay .v-list-item--active[aria-selected="true"]` — scope so nav lists/AppSidebar are excluded) appending a trailing check via `::after` with a masked Lucide-check data-URI, `background-color: rgb(var(--v-theme-primary))`, right-aligned per research §1 anatomy ("checkmark hugs the menu's right edge"). Keep the existing active tint (checkmark composes with it).
4. Z-index hygiene: `App.vue:238` literal `1000` → nearest correct token (inspect intent first; if it's an app-level overlay under the sidebar flyout, use a documented comment + token); `DaVinciExperience.vue:1020` literal `9999` → inspect intent — if it must sit above modals use `var(--mp-zIndex-toast)` with a comment, otherwise the correct lower token; `DvHistoryDrawer.vue:225` (`40`) gets a one-line comment documenting the local stacking context. No other z-index changes (28 local literals are classified justified).

**Acceptance:** menus open 4px offset with tokenized padding/radius; selected option in Settings → Industry select shows trailing primary checkmark in both themes; AppSidebar nav active items show **no** checkmark; zero raw z-index literals classified (b) remain; dialogs look identical before/after (radius unchanged unless verified equal).

### WP-F4 — Chart foundation (UX-003 High + LiveView outlier + AUD-L03)

**Files:** `src/plugins/chartPalette.ts`, `src/views/Analytics/LiveView.vue`

1. In the shared `xaxis` base (`chartPalette.ts:398-402`): add `tickAmount: 6` and `labels: { hideOverlappingLabels: true, rotate: 0 }`. Do **not** switch to `type: 'datetime'` globally (labels are strings from mock data; category+decimation is the non-breaking fix). Verify the widget-wizard preview ("Revenue over time") renders ≤8 legible labels at ~480px and the dashboard card stays legible.
2. LiveView.vue: replace the inline hardcoded `#ffffff` text color with the theme-aware equivalent used by `charts.css`/`useChartTheme()`.
3. **AUD-L03**: delete the deprecated `chartPalette` export (discovery confirms no production consumer; grep first, log the grep).

**Acceptance:** wizard preview x-axis legible at 480px (screenshot); dashboard revenue chart unchanged in palette; `grep -rn "chartPalette\b" src` shows only the new API; LiveView renders correctly in both themes.

### WP-F5 — Dark-mode low closure (AUD-L01) + compat alias retirement

**Files:** wherever `--surface-1`, `--surface-2`, `--hairline`, `--ink` still appear (grep), `src/styles/mp-theme-aliases.css`

Mechanical rename to the semantic equivalents (`--surface-primary/secondary`, `--border-subtle`, ink-panel tokens) per AUD-L01's note ("mechanical rename before removal"), then delete the alias definitions. Grep-zero acceptance: `grep -rn "\-\-surface-1\|\-\-surface-2\|\-\-hairline\|--ink[^-]" src` → only intentional matches (verify `--ink` doesn't collide with `inkPanel` names before the sweep — adjust the pattern).

**Acceptance:** aliases deleted from `mp-theme-aliases.css`; app + Storybook build clean; dark + light spot screenshots on a section-rail page and settings unchanged.

**→ GATE 2: user review of Phase 3 (screenshots light+dark before/after per WP).**

---

## Phase 4 — Component families (one at a time, check-in after each)

### WP-C1 — Shared toast system (D2 exception) — *largest package*

**New files:** `src/composables/useToast.ts`, `src/components/MpToastStack.vue` (+ story). **Mount:** once in `src/App.vue`.

API (locked, research §6 + a11y §3):
```ts
const toast = useToast()
toast.show(message, { title?, type?: 'success'|'error'|'info', action?: { label, onClick }, durationMs? })
// sugar: toast.success(msg, opts?) / toast.error(msg, opts?) / toast.info(msg, opts?)
```
Behaviour requirements (all mandatory):
- Bottom-right fixed stack (`Teleport to="body"`, `z-index: var(--mp-zIndex-toast)`), stacks upward, narrow fixed width ~320px, flat bordered card (`flat border rounded="lg"`), Lucide icon per type (`check`/`triangle-alert`/`info`), one-line title optional + message, **max one action**, always a close ×.
- Defaults: success/info auto-dismiss 4500ms; **errors persist until dismissed**.
- A11y (from `03` §3): ONE persistent `aria-live="polite"` container mounted at all times (never mount/unmount the region itself); `role="status"` for success/info, `role="alert"` for error; type conveyed by icon+text, never color alone; **pause timer on hover/focus-within, resume on leave/blur**; CSS-transition entrance/exit so the global reduced-motion rule applies.
- Pattern-follow `DvToastStack.vue` for stack mechanics; **do not** modify or replace `DvToastStack` in this WP — add a short "why Da Vinci toasts stay separate for now" note in the component doc comment (renders inside copilot context), and separately apply the A11Y-009 pause-on-hover fix to `useDaVinciToasts.ts` (its own commit).

Migration (haiku agents, one module per agent, sequential batches, no file overlap — module census in `01` §6): Layout(2) → Settings(17) → Commerce(16) → Contacts(20) → Analytics(28) → Marketing(31) → Merchandising(26) → Products(12) → Retail(6) → SalesChannels(8) → Service(6) → Billing/PLG/components(5). Each batch: replace `v-snackbar` + its `ref`/state with `toast.success(...)` calls preserving the exact message text; delete orphaned state; type-check; commit per batch. Odd timeouts (700ms Marketing transactional saves) normalize to the default — flag any call site where that seems wrong in the log rather than silently keeping bespoke timing.

**Acceptance:** `grep -c "v-snackbar" src/views src/components` → 0 outside `DvToastStack`-adjacent code; story shows all types/states; VoiceOver-style checklist from `03` §3 items 1-6 all demonstrably met in code; per-batch commits.

### WP-C2 — Dialog hygiene + graded confirms

**Files:** `src/components/dashboards/DashboardFormDialog.vue`, `src/components/copilot/DvExpandDialog.vue`, `src/components/MpMoveToFolderDialog.vue`, `src/components/MpConfirmDialog.vue`, + the ~11 raw `v-dialog` views (list in `docs/overlay-audit/01` §2)

1. **A11Y-005**: `useId()` title + `:aria-labelledby` on both unnamed dialogs (copy the exact `MpConfirmDialog.vue:26-36` pattern).
2. **A11Y-006**: wire `MpMoveToFolderDialog`'s `v-list` with `select-strategy="single-independent"` + `v-model:selected` so it renders `listbox`/`option` (keep visual identical).
3. **`consequences?: string[]`** prop on `MpConfirmDialog` (research §5): renders a bullet list between message and actions inside existing `v-card-text` styling; purely additive; story added. Do NOT add type-to-confirm (D9).
4. Raw `v-dialog` migration: from the overlay audit's §2 list, migrate the confirm-shaped ones to `MpConfirmDialog` and form-shaped ones to `MpFormDrawer`; **documented exceptions stay**: `DashboardFormDialog` (form-in-dialog exception), builder previews (`MpBuilderPreviewDialog`, `AddSectionDialog`), PLG dialogs (3DS flow is modal by nature — keep, but apply item 1's labelling pattern if unnamed). Log each keep-vs-migrate decision.

**Acceptance:** axe-style name check: every `v-dialog` in src has `aria-labelledby` or `aria-label`; folder dialog announces selection (role chain verified in rendered DOM via Storybook); consumers of `consequences` render bullets; migration decisions logged.

### WP-C3 — Selectors, row menus, command palette

**Files:** `src/components/MpRowActionsMenu.vue` + top consumers, `src/components/layout/AppBar.vue`

1. **UX-004**: add optional `itemLabel?: string` prop to `MpRowActionsMenu` → computed accessible name `` `${ariaLabel} for ${itemLabel}` `` (match `DashboardWidgetActionMenu`'s pattern). Thread it through the highest-traffic list views: AllContacts, SalesOrders, ProductsList, Campaigns/Journeys lists, Tickets (row identity = name/number column). Remaining ~25 views adopt incrementally in Phase 7 page polish — note this handoff in the log + page-tracker notes column.
2. **Command palette** (research §2): add a type-tab row above results in `AppBar.vue` sourced from existing `searchSources` categories (All + per-source), narrowing without retyping; label the empty-query fallback list "Suggested"; keep the single footer hint row. Keyboard: tabs reachable via Tab, arrow keys stay on results (APG combobox pattern already in place — don't regress `aria-activedescendant`).

**Acceptance:** contacts row kebabs announce per-row names (rendered aria-label check); palette shows tabs + "Suggested" header, existing keyboard behaviour intact (manual keyboard pass logged); AppBar stories updated.

### WP-C4 — Tooltips, icon labels, touch targets

**Files:** `src/views/Marketing/JourneyBuilder.vue`, `src/components/layout/AppBar.vue`, `src/components/MpDataTableToolbar.vue`, `src/components/copilot/DvChartCard.vue`, `src/components/layout/AppSidebar.vue`, `src/views/SalesChannels/StoreThemeBuilder.vue`, `StoreThemeCode.vue`

1. UX-005/006/007: wrap the named bare icon buttons in `v-tooltip` matching each file's existing sibling pattern; tooltip text **equals** the `aria-label` (research §7 rule).
2. A11Y-004: `aria-label="Save"/"Download"/"Enlarge"` + tooltips on DvChartCard's three buttons.
3. A11Y-010: fix the 20×20px targets — `size="x-small" density="comfortable"` → `size="small" density="comfortable"` (28×28) on StoreThemeBuilder section controls, StoreThemeCode, AppSidebar apps-toggle; verify the section rows still fit (screenshot).
4. Sweep: grep icon-only `v-btn`s app-wide for missing `aria-label`; fix stragglers (log the list; skip showcase surfaces).

**Acceptance:** the three audited clusters have 100% tooltip coverage; all icon-only buttons have accessible names (grep + spot render); theme-builder rows fit at 28px (screenshot).

### WP-C5 — Widget library grouping (UX-002) + KPI meta

**Files:** `src/components/dashboards/wizard/WidgetLibraryStep.vue`, `src/components/MpKpiCard.vue`

1. When `activeCategory === 'all'`, group `filteredEntries` under muted section headers reusing the existing `CATEGORIES` labels, styled like `JourneyAddStepMenu`'s "Common"/"Actions" headers (same app, copy that pattern); headers as real headings/`role="group"` for SR landmarks. Selected-state treatment unchanged (already correct per research §3).
2. `MpKpiCard`: optional `updatedAt?: string` prop → smallest muted caption at card bottom (research §8); purely additive; story variant.

**Acceptance:** "All" view shows 5 labeled groups; filter chips still work; keyboard order follows groups; KPI story shows `updatedAt`.

### WP-C6 — Dashboard widget narrow-container fixes (UX-001 High)

**Files:** `src/components/dashboards/widgets/DashboardKpiWidget.vue`, `DashboardChartWidget.vue`

1. Add a container-query breakpoint (~`max-width: 220px`) to the KPI footer mirroring the existing 260px icon-hide rule: "Updated …" truncates with ellipsis (full string in `title` attr) or drops to source-chip-only.
2. Chart legend at the same container width: cap legend item width with ellipsis (Apex `legend.formatter`/CSS), donut % labels non-overlapping (reduce/disable dataLabels below the breakpoint).
3. Add pinned ~200px-wide stories for both widgets.

**Acceptance:** with Da Vinci panel open (196px cards), footer `scrollWidth ≤ clientWidth` (measure via browser tool); legend legible; stories pinned.

### WP-C7 — Table overflow affordance (UX-009 High)

**Files:** `src/styles/global.scss`

Systemic option (a): trailing-edge scroll-shadow on `.v-table__wrapper` when content overflows — CSS-only using `background-attachment: local` gradient technique or a masked sticky gradient, token-colored (`--scrim`-derived, both themes). No per-view changes; no column-priority work now (option (b) deferred to Phase 7 per-page polish where a specific table warrants it — note in log).

**Acceptance:** contacts at 375px shows a visible trailing fade that disappears when scrolled to the end (screenshots at both scroll positions, both themes); no shadow on non-overflowing tables at desktop.

### WP-C8 — Remaining a11y state fixes

**Files:** `src/components/copilot/DvHistoryDrawer.vue`, `src/components/MpFloatingBulkBar.vue`

1. A11Y-007: `:aria-current` on active conversation rows.
2. A11Y-008: keep the bulk-bar wrapper always mounted (`v-show` or inner `v-if`) so the live region persists; verify the auto-hide animation still works.

**Acceptance:** both attribute changes verified in rendered DOM; bulk bar behaviour visually unchanged (0→1→0 selection cycle screenshot/interaction).

### WP-C9 — Hard-coded value migration (+ AUD-L02)

**Files (from `01` §2 style-block offenders):** `ModuleLandingPage.vue` (16 tints → tokens.json group, e.g. `color.{light,dark}.moduleTile.*`, closing AUD-L02 by documenting the ledger in the token `$description`s), `Registers.vue` (status colors → `--mp-color-success/error/warning` semantic vars incl. the `color-mix()` blends), `DvOrbitOrb.vue`/`DvOrbCanvas.vue` (`--dv-orb-*` tokens), `LandingBlockView.vue` (primary/onPrimary vars), `DvDocsAssistant.vue`, `DaVinciAI.vue` gradient tints.
**Explicitly keep** (user-facing configurable palettes, documented with a one-line comment): FormBuilder presets + traffic lights, ChatbotBuilder swatch array, LandingPageTemplates presets, LandingPageStylePanel/LandingBlockSettings picker values.

**Acceptance:** hex grep on the migrated files → 0 style-block hits (template/config hits documented); tokens built; ModuleLandingPage visually identical both themes (screenshot); AUD-L02 marked closed in the execution log with a pointer.

---

## Phase 5 — Storybook sync (after C-family APIs stable; parallelizable)

1. **New stories:** `InviteUsersDrawer`, `UserAccessDrawer` (rbac), `Plg3dsDialog`, `PlgTalkToSalesDialog`, `PlgTrialChip`, `JourneyAddStepMenu`, landing color-picker menus (one representative), `MpToastStack` (done in C1 — extend to full matrix).
2. **State matrices:** Form Fields stories gain open-menu states (selected-with-checkmark, grouped, long labels, many options w/ scroll, disabled item); MpConfirmDialog gains `consequences` + destructive variants; MpRowActionsMenu gains `itemLabel`; tooltip timing story.
3. **Layering demos:** one story file rendering a menu, tooltip, and dialog over: a card grid, a data table with sticky header, a scroll container, and inside MpFormDrawer — pinned light + dark.
4. All via production components + `src/styles/app-styles.ts` manifest — no Storybook-only styles (`.claude/rules/global-styles.md`).

**Acceptance:** `npm run build-storybook` clean; every changed/added component from Phase 4 has current stories; layering stories render correctly in both pinned themes.

---

## Phase 6 — Independent audit → remediation → final verification

Per the approved orchestration plan: fresh read-only sonnet audit (→ `06-independent-audit.md`, greps + rendered checks + light-regression-vs-master screenshots + the `03` "needs live validation" table), remediation of all Blocker/High/Medium, fresh verifier (→ `07-final-verification.md`: type-check, build, build-storybook, `npm run audit:ui`, accent-identity check, light-token byte-diff vs the WP-F1 allowlist). **GATE 3** before Phase 7.

## Phase 7 — Page polish absorption

Run `polish-module` skill per module on `docs/ui-improvement/page-tracker.md`; the tracker's notes column inherits two standing items from this program: adopt `MpRowActionsMenu.itemLabel` per view, and consider per-table mobile column priority (UX-009 option b) where a table is phone-critical.

---

## Rollback strategy

Each WP is one commit (toast migration: one commit per module batch) on `feature/ui-system-consolidation`; revert = `git revert <sha>`. Token changes are the riskiest — WP-F1/F5 must be individually revertable without touching component commits. No WP mixes token changes with component changes except where the WP text says so.

## Testing gates

- Every WP: `npm run type-check` && `npm run build`.
- End of Phase 3 + each Phase 4 family: dev-server visual pass (light+dark) on that WP's representative screen; `npm run audit:ui` at Phase gates.
- Phase 5 end: `npm run build-storybook`.
- Phase 6: full checklist as above.
