# 01 — Overlay Component Audit

**Phase:** 1 (repository audit only — no production code changes)
**Date:** 2026-07-29
**Method:** Static source inspection (`rg` counts, file reads). Counts are opening tags / file hits in `src/**/*.vue`, not runtime instances.
**Architecture decision (locked):** **2A — theme + token layer.** Polish all Vuetify selects, menus, dialogs, tooltips, and snackbars via semantic tokens, `maropostDefaults`, and `global.scss`. Thin Mp wrappers only where behaviour already diverges or house rules require them. Do **not** create `MpSelect` / `MpSnackbar` / `MpTooltip` and migrate every consumer.

---

## Executive summary

Marobase overlays are almost entirely **Vuetify primitives** plus a small set of **Mp\*** wrappers and domain dialogs. Global overlay chrome already exists (WP-10 dark-mode work): `--surface-overlay`, `--scrim-overlay`, `--elevation-overlay` / `--elevation-modal`, and menu/dialog rules in [`src/styles/global.scss`](../../src/styles/global.scss).

| Signal | Finding |
|--------|---------|
| Highest volume | `v-select` (~223 openings / 90 files), `v-snackbar` (~197 / 96 files), `v-tooltip` (~119 / 30 files), `v-menu` (~115 / 41 files) |
| Shared overlays | `MpFormDrawer`, `MpConfirmDialog`, `MpRowActionsMenu`, folder trio, `MpDateRangeSelect`, `MpBuilderPreviewDialog` |
| Biggest consistency gap | ~96 per-view snackbars; no shared toast API (copilot has `DvToastStack` only) |
| Biggest anti-pattern residue | ~11 view-level raw `v-dialog`s (confirms, mini-forms, previews) that bypass Mp\* house rules |
| Token gap | Light L2/L3 collapse to same white; L3/L4 share one surface; z-index `dropdown`/`modal` are docs-only |
| Vuetify defaults gap | No `maropostDefaults` for `VDialog`, `VMenu`, `VTooltip`, `VSnackbar`, `VOverlay` |
| Storybook | Strong for Mp\* overlays; missing for PLG dialogs, RBAC drawers, JourneyAddStepMenu, layering stories |
| Command menu | Exists as AppBar universal search (`cmd-palette`) — not a separate Mp\* component |
| Bottom sheets | Unused (`v-bottom-sheet`: 0) |

**Phase 2+ direction (preview):** tokens → Vuetify defaults → central overlay CSS → polish existing Mp\* → hotspot migrations (raw confirm dialogs → `MpConfirmDialog`; stray kebabs → `MpRowActionsMenu`) → Storybook matrices → independent audit.

---

## 1. Inventory — shared Mp\* overlays

| Component | Path | Primitive | Role | Consumers (approx.) |
|-----------|------|-----------|------|---------------------|
| **MpFormDrawer** | [`src/components/MpFormDrawer.vue`](../../src/components/MpFormDrawer.vue) | `Teleport` + `v-navigation-drawer` (right, default 480) | Create/edit forms; focus trap; Escape; optional `guarded` close | ~56 Vue files |
| **MpConfirmDialog** | [`src/components/MpConfirmDialog.vue`](../../src/components/MpConfirmDialog.vue) | `v-dialog` max-width 440 | Confirm / destructive prompts; labelled + described | ~86 Vue files |
| **MpRowActionsMenu** | [`src/components/MpRowActionsMenu.vue`](../../src/components/MpRowActionsMenu.vue) | `v-menu` + kebab | Table/list row actions; required `ariaLabel` | ~45 list views |
| **MpFolderSelect** | [`src/components/MpFolderSelect.vue`](../../src/components/MpFolderSelect.vue) | `v-menu` + list | Folder filter above foldered lists | Marketing/content lists |
| **MpMoveToFolderDialog** | [`src/components/MpMoveToFolderDialog.vue`](../../src/components/MpMoveToFolderDialog.vue) | `v-dialog` | Move item to folder | Foldered list views |
| **MpManageFoldersDrawer** | [`src/components/MpManageFoldersDrawer.vue`](../../src/components/MpManageFoldersDrawer.vue) | composes MpFormDrawer + MpConfirmDialog | Folder CRUD | Foldered list views |
| **MpDateRangeSelect** | [`src/components/MpDateRangeSelect.vue`](../../src/components/MpDateRangeSelect.vue) | `v-menu` | Analytics date-range presets + custom | Analytics reports |
| **MpBuilderPreviewDialog** | [`src/components/MpBuilderPreviewDialog.vue`](../../src/components/MpBuilderPreviewDialog.vue) | `v-dialog` | Large builder preview | Builder shells |
| **MpDataTableToolbar** | [`src/components/MpDataTableToolbar.vue`](../../src/components/MpDataTableToolbar.vue) | `v-menu` (columns) + MpFormDrawer (filters) | List toolbar overlays | Data tables |
| **MpSectionRail** | [`src/components/MpSectionRail.vue`](../../src/components/MpSectionRail.vue) | optional `v-menu` | Workspace switcher | Store editor / settings shells |

House rules ([`docs/design-system/vuetify-mapping.md`](../design-system/vuetify-mapping.md)): forms → **MpFormDrawer**; confirms → **MpConfirmDialog**; row kebabs → **MpRowActionsMenu**. Never raw `v-dialog` for forms.

---

## 2. Inventory — domain overlays

| Component | Path | Primitive | Story? | Notes |
|-----------|------|-----------|--------|-------|
| **AppBar** menus | [`src/components/layout/AppBar.vue`](../../src/components/layout/AppBar.vue) | `v-menu` ×4 (search/cmd palette, create, assistant, user), fullscreen `v-dialog` (mobile search), `v-snackbar` | Yes (9) | Command palette is the product’s command menu |
| **AppSidebar** | [`src/components/layout/AppSidebar.vue`](../../src/components/layout/AppSidebar.vue) | `v-menu` flyouts, many `v-tooltip`, `Teleport` toggle pill | Yes (7) | Custom flyout chrome; z-index tokens for flyout/pill |
| **DashboardFormDialog** | [`src/components/dashboards/DashboardFormDialog.vue`](../../src/components/dashboards/DashboardFormDialog.vue) | `v-dialog` | Yes (3) | Create/edit dashboard — form-in-dialog exception |
| **DashboardWidgetActionMenu** | [`src/components/dashboards/DashboardWidgetActionMenu.vue`](../../src/components/dashboards/DashboardWidgetActionMenu.vue) | `v-menu` | Yes (3) | Widget kebab (domain, not MpRowActionsMenu) |
| **WidgetWizardDrawer** | [`src/components/dashboards/WidgetWizardDrawer.vue`](../../src/components/dashboards/WidgetWizardDrawer.vue) | MpFormDrawer + MpConfirmDialog | Yes (3) | Correct composition |
| **DvExpandDialog** / **DvRefineDialog** | `src/components/copilot/` | `v-dialog` | Yes (2 each) | Copilot expand/refine |
| **DvHistoryDrawer** | `src/components/copilot/DvHistoryDrawer.vue` | Custom panel + `v-menu` overflow (not `v-navigation-drawer`) | Yes (3) | Divergent drawer implementation |
| **DvToastStack** | `src/components/copilot/DvToastStack.vue` | `Teleport to="body"` fixed stack | Yes (2) | Uses `--mp-zIndex-toast` (10000) |
| **InviteUsersDrawer** / **UserAccessDrawer** | `src/components/rbac/` | MpFormDrawer | **No** | Correct composition; stories missing |
| **Plg3dsDialog** / **PlgTalkToSalesDialog** | `src/components/plg/` | `v-dialog` | **No** | PLG flows |
| **PlgTrialChip** | `src/components/plg/PlgTrialChip.vue` | `v-menu` as info popover | **No** | Popover pattern |
| **AddSectionDialog** | `src/components/saleschannels/AddSectionDialog.vue` | `v-dialog` | Yes (2) | Store editor |
| **JourneyAddStepMenu** | `src/components/marketing/JourneyAddStepMenu.vue` | `v-menu` | **No** | Journey builder |
| **JourneyFlowColumn** | `src/components/marketing/JourneyFlowColumn.vue` | `v-menu` node actions | Partial (column stories) | Overflow-hidden risk |
| Landing colour menus | `LandingBlockSettings.vue`, `LandingPageStylePanel.vue`, `LandingInsertionPoint.vue` | `v-menu` + `v-color-picker` | No dedicated stories | Colour picker overlays |

Shell drawers: [`src/App.vue`](../../src/App.vue) + AppSidebar use `v-navigation-drawer` for nav / copilot shell (not form drawers).

---

## 3. Primitive usage map (full repo)

| Primitive | Files | Openings | Notes |
|-----------|------:|---------:|-------|
| `v-select` | 90 | ~223 | Dominant selector; field chrome via `maropostDefaults` + `settings-form.scss` |
| `v-autocomplete` | 4 | ~8 | Rare searchable select |
| `v-combobox` | 9 | ~10 | Sparse (e.g. InviteUsersDrawer) |
| `v-menu` | 41 | ~115 | Shared Mp\* + AppBar/sidebar/domain |
| `v-dialog` | 21 | ~48 | Prefer MpConfirmDialog / domain dialogs |
| `v-navigation-drawer` | 5 | ~16 | AppSidebar, MpFormDrawer, App.vue (+ demo) |
| `v-tooltip` | 30 | ~119 | Heavy in AppSidebar / AppBar |
| `v-snackbar` | 96 | ~197 | Per-view “Saved” pattern; no MpSnackbar |
| `v-bottom-sheet` | 0 | 0 | Unused — mobile fallback not implemented |
| `v-overlay` (direct) | 0 UI | 5 refs | Only `.closest('.v-overlay')` guards in click handlers |
| `<Teleport>` | 3 | 3 | MpFormDrawer, DvToastStack, AppSidebar |
| `v-color-picker` | 4 files | several | Chatbot, FormBuilder, landing style panels |
| `multiple chips` on selects | — | ~19 | Multi-select pattern via raw props |

---

## 4. Cross-cutting: design tokens

**Source:** [`src/design-tokens/tokens.json`](../../src/design-tokens/tokens.json)
**Aliases:** [`src/styles/mp-theme-aliases.css`](../../src/styles/mp-theme-aliases.css)
**Architecture doc:** [`docs/dark-mode/06-theme-architecture.md`](../dark-mode/06-theme-architecture.md)

### Surfaces (L0–L4)

| Layer | Role | Alias / token | Light | Dark |
|-------|------|---------------|-------|------|
| L0 | Canvas / sunken | `--surface-canvas`, `--surface-sunken` | authored | authored |
| L1 | Cards / tables | `--surface-primary` | surface | surface |
| L1 nested | Insets | `--surface-secondary` | surfaceVariant | surfaceVariant |
| L2 | Raised chrome | `--surface-raised` + `--elevation-raised` | **same white as L1** (`surfaceBright`) | `#24272C` (`surfaceRaised`) |
| L3 | Menus / popovers | `--surface-overlay` + `--elevation-overlay` | **same white as L1/L2** | `surfaceBright` via `surfaceOverlay` |
| L4 | Modals / drawers | same `--surface-overlay` + scrim + `--elevation-modal` | shared with L3 | shared with L3 |

**Gaps vs prompt’s semantic overlay token list:**

- No distinct L4 surface (modal vs menu distinction is scrim + shadow only).
- Light mode has no authored `color.light.surfaceOverlay` / `scrim` — aliases invent equivalents.
- Light L2/L3 collapse → menus rely on border + shadow for separation (fragile on white cards).
- Missing dedicated semantic roles called out in the prompt (selected/hover/pressed overlay surfaces, tooltip surface, nested surface) — some exist as interactive tokens in dark only; not wired as overlay-specific aliases.
- Spacing/shape for overlays mostly **hardcoded** in CSS (`4px` menu padding, `8px` item radius) rather than tokens.
- `component.dialog.radius.default` = `16px` — used by dialog CSS; docs claim `VDialog rounded="xl"` but that default is **not** in `maropostDefaults` (stale docs).

### Elevation

| Alias | Maps to |
|-------|---------|
| `--elevation-overlay` | `shadow.md` / `shadow.dark.md` |
| `--elevation-modal` | `shadow.lg` / `shadow.dark.lg` |

Three shadow steps only. No separate tooltip/dropdown/drawer shadow tokens beyond these aliases.

### z-index (`tokens.json` → `--mp-zIndex-*`)

| Token | Value | Status |
|-------|------:|--------|
| `base` | 0 | Used implicitly |
| `stickyHeader` | 1 | Documented (e.g. dashboard table widgets) |
| `bulkActionBar` | 100 | Used by MpFloatingBulkBar |
| `navSidebarFlyout` | 1005 | AppSidebar expanded flyout |
| `navSidebarTogglePill` | 1010 | AppSidebar toggle pill |
| `dropdown` | 2000 | **Reference only** — Vuetify VMenu/VTooltip default; must not override |
| `modal` | 2400 | **Reference only** — Vuetify VDialog default; must not override |
| `toast` | 10000 | DvToastStack |

**Missing layer keys (for future token work, still respecting Vuetify ownership):** sticky content (beyond header), navigation shell, popover (vs dropdown), tooltip (vs menu), drawer, critical overlay. Do not invent arbitrary component-level z-index CSS.

### Layout / component tokens relevant to overlays

- `layout.drawerWidth` = `480px` (MpFormDrawer default)
- `component.dialog.radius.default` = `16px`

---

## 5. Cross-cutting: Vuetify defaults & global CSS

### [`maropostTheme.ts`](../../src/plugins/maropostTheme.ts) — `maropostDefaults`

| Component | Overlay-relevant defaults |
|-----------|---------------------------|
| `VSelect` / `VAutocomplete` / `VCombobox` | Field only: `outlined`, `comfortable`, `hideDetails: auto`, `color: primary` — **no menu props** |
| `VNavigationDrawer` | `elevation: 0` |
| `VList` | `elevation: 0`, `border`, `rounded: 'lg'` |
| `VDialog`, `VMenu`, `VTooltip`, `VOverlay`, `VSnackbar` | **None** |

### [`global.scss`](../../src/styles/global.scss) — overlay chrome (WP-10)

- `.v-overlay__content > .v-card|.v-sheet|.v-stepper` → `--surface-overlay`
- `.v-overlay__scrim` → `--scrim-overlay`, `opacity: 1`
- `.v-overlay.v-tooltip` → transparent root
- `.v-menu > .v-overlay__content > …` → overlay fill, `--border-default`, `--elevation-overlay`, `border-radius: var(--mp-borderRadius-md)`, list padding `4px`, item radius `8px !important`
- `.v-dialog > .v-overlay__content > …` → dialog radius token, overlay fill, `--elevation-modal`
- Teleported divider colours use theme-class + raw `--mp-color-{light|dark}-borderDividerMuted` (theme-scope workaround)

**Issues:** literal spacing/radii; heavy `!important`; divider theme workaround; MpFormDrawer also applies overlay surface + modal elevation in component styles (duplicates global intent).

### Field baseline (select triggers)

[`src/styles/settings-form.scss`](../../src/styles/settings-form.scss) + Storybook [`src/stories/FormFields.stories.ts`](../../src/stories/FormFields.stories.ts): outlined fields share 10px radius, 40px min height, surface fill, hairline border, primary focus border. Applies to select triggers; **menu panels** are styled by `global.scss` menu rules.

---

## 6. Cross-cutting: portal / teleport / clipping / stacking

| Mechanism | Where | Risk |
|-----------|-------|------|
| Vuetify overlay portal | Menus, dialogs, tooltips, snackbars | Teleported outside `.v-application` — theme aliases historically missed dark scope (mitigated with `.v-theme--maropostDark` / raw token vars in WP-10) |
| `Teleport to="body"` | MpFormDrawer, DvToastStack, AppSidebar | Escapes `transform` / `overflow` containing blocks — correct pattern |
| `overflow: hidden` | Dashboard widgets, journey canvas, cards, builders | Can clip **non-teleported** content; Apex chart tooltips still clip (dark-mode audit M2) |
| Nested stacking | Sidebar flyout (1005) vs Vuetify menus (2000) | Flyout below Vuetify menus by design; toast above everything |
| Docs-only z-index | `dropdown` / `modal` | Safe if unused in CSS; risk if someone “fixes” stacking by overriding Vuetify |

**Known from dark-mode audits:** Apex tooltip clipping when widgets use `overflow: hidden`; pie tooltip contrast when series colour fills rows; overlay-container theme alias edge cases historically.

---

## 7. Component families

### 7.1 Select / autocomplete / combobox

**Variants:** single `v-select`; `multiple chips closable-chips` (~19); rare `v-autocomplete` / `v-combobox`.

**Relevant files:** ~90 view/component files; defaults in `maropostTheme.ts`; field chrome in `settings-form.scss`; menu chrome in `global.scss`.

**Issues:**
- No dedicated searchable/multi Mp wrappers (acceptable under 2A).
- Inconsistent density (`comfortable` vs `compact` on filters).
- Menu item height/padding partially global, not tokenised.
- Long option lists depend on Vuetify defaults for max-height/scroll.

**Duplicates:** None — all raw Vuetify under shared theme.

**A11y risks:** Rely on Vuetify field labelling; custom `#item` slots may drop accessible names if not careful; multi-select chip clear buttons need visible focus.

**Layering risks:** Select menus teleport via VMenu — generally OK; clipped only if someone disables teleport or nests incorrectly.

**Storybook:** [`Forms/Form Fields`](../../src/stories/FormFields.stories.ts) (7 stories) covers VSelect/VAutocomplete/VCombobox baseline — not a full state matrix (empty/loading/error/long content/many options).

**Recommended shared approach (2A):** Keep raw `v-select` / `v-autocomplete` / `v-combobox`. Extend `maropostDefaults` + semantic tokens + `global.scss` for menu panels. Expand Form Fields stories for select menu states.

**Migration:** No wholesale component migration. Optionally document “use `v-autocomplete` when searchable” in design-system docs.

---

### 7.2 Dropdown / action / context / kebab menus

**Variants:**
- **MpRowActionsMenu** — canonical table kebab
- **DashboardWidgetActionMenu** — widget kebab
- **AppBar** create / user / assistant menus
- **JourneyAddStepMenu**, JourneyFlowColumn node menus
- **MpDataTableToolbar** column picker menu
- Ad-hoc `v-menu` + `more-vertical` in some views (Merchandising, Settings Users, Tickets, DashboardsList, etc.)

**Issues:**
- Parallel kebab implementations without `MpRowActionsMenu` (missing enforced `ariaLabel`).
- Inconsistent min-width, destructive styling (`text-error` + divider convention exists in MpRowActionsMenu slot docs but not enforced).
- Nested menus rare / unstandardised.

**Duplicates:** Widget action menu vs MpRowActionsMenu (similar anatomy, different domains — OK to keep both if chrome matches).

**A11y:** MpRowActionsMenu requires `ariaLabel` — good. Ad-hoc kebabs may lack accessible names. AppBar command palette has listbox semantics + `aria-activedescendant` — good reference.

**Layering:** VMenu teleport — OK. Sidebar flyout is separate custom layer.

**Storybook:** MpRowActionsMenu (4), DashboardWidgetActionMenu (3), AppBar (9). **Missing:** JourneyAddStepMenu.

**Recommended (2A):** Theme/CSS for all `v-menu` lists. Migrate hotspot kebabs → MpRowActionsMenu. Keep domain menus that aren’t row actions. Do not create MpDropdownMenu unless a second behavioural API appears.

**Migration:** Grep `more-vertical` / `ellipsis` outside MpRowActionsMenu; convert list-row cases first.

---

### 7.3 Folder / date / product-style selectors

**Variants:** MpFolderSelect, MpDateRangeSelect, MpMoveToFolderDialog, MpManageFoldersDrawer; product/account selectors are raw `v-select` in forms (no dedicated MpAccountSelect / MpProductSelect).

**Issues:** Custom menu UIs are solid; date range is analytics-specific. No shared “searchable entity picker” beyond autocomplete.

**Duplicates:** Low — folder system is centralised.

**A11y:** Folder/date menus should keep trigger `aria-expanded` via Vuetify activator props (verify in Phase 4).

**Storybook:** MpFolderSelect (4), MpDateRangeSelect (7), MoveToFolder (4), ManageFolders (4) — present; taxonomy splits Forms vs Data Display vs Overlays.

**Recommended (2A):** Keep Mp\* selectors. Polish via tokens. No new entity-picker Mp\* unless a repeated interaction pattern emerges beyond `v-autocomplete`.

---

### 7.4 Popovers / hover cards

**Variants:** No `MpPopover`. Patterns use `v-menu` with `:close-on-content-click="false"`:
- PlgTrialChip (320px info panel)
- AppBar create / assistant menus
- AppSidebar flyouts (custom + Teleport)

**Issues:** Popover vs menu vs tooltip boundaries unclear; no shared max-width / padding tokens; PlgTrialChip unstoryed.

**A11y:** Interactive popovers need focus management; hover-only content inaccessible to keyboard unless also openable on focus/click.

**Recommended (2A):** Do **not** introduce MpPopover yet. Document “interactive content → `v-menu`; ephemeral hint → `v-tooltip`”. Tokenise menu-as-popover chrome via global menu rules. Add PlgTrialChip story under PLG / Feedback.

---

### 7.5 Tooltips

**Variants:** Raw `v-tooltip` (~119 openings); AppSidebar custom tooltip chrome; chart tooltips (Apex via `charts.css`).

**Issues:**
- No `maropostDefaults` for VTooltip (delay, location).
- Chart tooltips: clipping (overflow), pie series-colour contrast issues (dark-mode independent audit).
- Keyboard trigger coverage uneven.

**Storybook:** No dedicated Foundations/Tooltip gallery; tooltips appear incidentally in AppSidebar/AppBar stories.

**Recommended (2A):** Add VTooltip defaults (open/close delay) + semantic tooltip surface/text tokens if distinct from menu. Expand Storybook tooltip placements. Fix chart tooltip behaviour in chart package (not per-dashboard).

---

### 7.6 Confirmation dialogs

**Canonical:** MpConfirmDialog (~86 consumers) — max-width 440, danger variant, aria-labelledby/describedby.

**Raw confirm-like `v-dialog` still in views:**
- [`Fulfillments.vue`](../../src/views/Commerce/Fulfillments.vue) — ship confirm
- Possibly others with confirm copy but custom bodies (OrderDetail refund mixes form + confirm)

**Issues:** Parallel hand-rolled confirms break danger/icon/a11y consistency.

**Storybook:** MpConfirmDialog — Default, Danger, etc. (4) — missing long message / mobile.

**Recommended (2A):** Hotspot migrate raw confirms → MpConfirmDialog. Extend stories (destructive, long content). Keep MpConfirmDialog as the only confirm API.

---

### 7.7 Modals / form dialogs (exceptions to drawer rule)

| Dialog | Purpose | Should be drawer? |
|--------|---------|-------------------|
| MpMoveToFolderDialog | Short folder pick | Borderline — already dialog; OK |
| MpBuilderPreviewDialog | Large preview | Dialog OK |
| DashboardFormDialog | Create/edit dashboard | **Form** — house rule prefers MpFormDrawer |
| DvExpandDialog / DvRefineDialog | Copilot AI flows | Dialog OK (focused task) |
| Plg3dsDialog / PlgTalkToSalesDialog | PLG | Dialog OK |
| AddSectionDialog | Store section | Dialog OK |
| AppBar mobile search | Fullscreen search | Dialog OK |
| AcquisitionForms choose/preview/embed | Template gallery + preview | Dialog OK |
| ChatbotList create / ChatbotBuilder publish | Create/publish | Prefer drawer for create |
| CampaignTags import | Import form | Prefer drawer |
| CreateDraftOrder payment link | Success/info | Dialog OK |
| OrderDetail refund | Form fields | Prefer drawer or MpConfirm if simple |
| PosPreview discount/customer | POS mini-forms | Context-specific |
| SalesChannelDetail preview | Large preview | Dialog OK |
| RolesPermissionsPage upsell | Marketing upsell | Dialog OK |
| DashboardView expanded widget | Large expand | Dialog OK |

**Issues:** Form-in-dialog exceptions dilute house rule; inconsistent widths/padding; docs claim VDialog default rounded xl — not wired.

**Storybook:** Domain dialogs partially covered; PLG dialogs missing; no layering stories (menu over modal).

**Recommended (2A):** Token + global dialog chrome for all `v-dialog`. Document allowed exceptions (preview, PLG, expand). Migrate clear create forms (ChatbotList, CampaignTags import, DashboardFormDialog) → MpFormDrawer when touching those files. Do not invent MpModal unless needed for size variants beyond confirm/preview.

---

### 7.8 Drawers / side panels

| Implementation | Pattern |
|----------------|---------|
| MpFormDrawer | Canonical form drawer (Teleport + temporary nav drawer + focus trap) |
| WidgetWizardDrawer, InviteUsersDrawer, UserAccessDrawer | Compose MpFormDrawer |
| DvHistoryDrawer | **Custom** overlay/rail panel — divergent |
| App shell | AppSidebar / App.vue navigation drawers |

**Issues:** DvHistoryDrawer bypasses MpFormDrawer a11y (role/dialog/focus) patterns; mobile full-screen fallback not standardised (`v-bottom-sheet` unused); width often hardcoded beyond token.

**Storybook:** MpFormDrawer strong (9 incl. validation/submitting); WidgetWizardDrawer (3); DvHistoryDrawer (3); **RBAC drawers missing**.

**Recommended (2A):** Keep MpFormDrawer as sole form drawer. Evaluate aligning DvHistoryDrawer visuals/a11y with MpFormDrawer or documenting as intentional shell panel. Add RBAC drawer stories. Tokenise widths (narrow/default/wide) if needed.

---

### 7.9 Toasts / notifications

| Pattern | Volume | Notes |
|---------|-------:|-------|
| Per-view `v-snackbar` | ~96 files / ~197 openings | Typically “Saved” / success; location/color/timeout inconsistent (`bottom center` vs `bottom right`, `success` vs `surface`, pill vs default) |
| AppBar snackbar | 1 | Appbar notices |
| DvToastStack | Copilot only | Teleported stack, z-index toast token |

**Issues:** Two toast systems; no shared API; Storybook doesn’t document the app-wide snackbar pattern.

**Recommended (2A):** **Do not** migrate all snackbars to MpSnackbar. Instead:
1. Add `maropostDefaults` for `VSnackbar` (location, timeout, rounded, color).
2. Optionally add a tiny composable `useNotice()` later if duplication hurts — out of Phase 1 scope.
3. Keep DvToastStack for multi-toast / rich copilot notices; document when to use which.

---

### 7.10 Chart / colour / calendar overlays

**Charts:** Apex tooltips styled in [`src/styles/charts.css`](../../src/styles/charts.css) from `color.chart.*.tooltip*` tokens. Known clipping + pie contrast issues (dark-mode audits).

**Colour pickers:** `v-color-picker` in ChatbotBuilder, FormBuilder, LandingBlockSettings, LandingPageStylePanel — often inside `v-menu`. No shared MpColorPicker.

**Date/calendar:** MpDateRangeSelect for analytics presets; no `v-date-picker` widespread as a shared overlay component (range is menu-based).

**Recommended (2A):** Theme colour-picker menus via global menu rules; chart tooltip fixes in charts.css / chart composable; keep MpDateRangeSelect.

---

### 7.11 Command menu

**Exists:** AppBar universal search — keyboard-driven command palette (`cmd-palette` in AppBar.vue): `v-menu` + listbox + section labels + Ask/Da Vinci footer; mobile fullscreen `v-dialog`.

**Does not exist:** Separate `MpCommandMenu` or cmdk package.

**Recommended (2A):** Treat AppBar palette as the product command menu. Extract only if a second surface needs the same behaviour. Expand AppBar stories for palette keyboard states. **Defer** a standalone MpCommandMenu.

---

## 8. Accessibility snapshot

| Area | Status |
|------|--------|
| MpConfirmDialog labelling | Good (`aria-labelledby` / `aria-describedby`) |
| MpFormDrawer | Good (`role="dialog"`, `aria-modal`, focus trap, Escape, restore focus, Teleport) |
| MpRowActionsMenu | Good (required `ariaLabel`) |
| AppBar command palette | Good (listbox, activedescendant, keyboard nav) |
| Raw view dialogs | Mixed — often missing labelledby/describedby |
| Ad-hoc kebabs | Risk of missing accessible names |
| Tooltips | Keyboard exposure incomplete |
| Focus outlines | Must preserve (house rule); Form Fields docs note primary border focus on fields |
| Touch targets | Vuetify comfortable density helps; x-small kebab buttons are tight |
| Reduced motion | Motion tokens exist; overlay transitions not audited against `prefers-reduced-motion` |
| Live regions | Snackbars provide announcements; no shared pattern for async select loading |

---

## 9. Responsive / mobile

| Pattern | Behaviour |
|---------|-----------|
| AppBar search | Desktop menu → mobile fullscreen dialog |
| MpFormDrawer | Fixed 480 (default); no bottom-sheet fallback |
| Dialogs | max-width + viewport calc in some places; inconsistent |
| `v-bottom-sheet` | Unused |
| Command palette | `max-width: calc(100vw - 32px)` |

**Gap:** No shared responsive overlay rules (large select → sheet, complex modal → fullscreen). Phase 8 should define token/CSS rules rather than one-off view fixes.

---

## 10. Storybook coverage matrix

| Family / component | Group | Stories | Coverage | Gap |
|--------------------|-------|--------:|----------|-----|
| MpConfirmDialog | Overlays | 4 | Open / danger | Long content, mobile |
| MpFormDrawer | Overlays | 9 | Strong (incl. validation/submitting) | Mobile fullscreen, layering |
| MpRowActionsMenu | Overlays | 4 | Basic | Destructive, disabled, nested, scroll |
| MpBuilderPreviewDialog | Overlays | 1 | Minimal | Sizes, mobile |
| MpFolderSelect | Data Display | 4 | Good | Empty/loading |
| MpDateRangeSelect | Data Display | 7 | Good | Edge viewport |
| MpMoveToFolderDialog | Forms | 4 | Good | — |
| MpManageFoldersDrawer | Forms | 4 | Good | — |
| Form Fields (VSelect etc.) | Forms | 7 | Field baseline | Menu open states, multi, searchable matrix |
| AppBar (incl. palette) | Layout | 9 | Present | Dedicated palette keyboard story |
| AppSidebar (tooltips/menus) | Layout | 7 | Present | — |
| DashboardFormDialog | Dashboards | 3 | Present | — |
| DashboardWidgetActionMenu | Dashboards | 3 | Present | — |
| WidgetWizardDrawer | Dashboards | 3 | Present | — |
| DvExpand / Refine / History / Toast | Copilot | 2–3 each | Present | — |
| AddSectionDialog | Sales Channels | 2 | Present | — |
| JourneyAddStepMenu | — | **0** | Missing | Add P1 stories |
| InviteUsersDrawer / UserAccessDrawer | — | **0** | Missing | Add P1 stories |
| Plg3ds / TalkToSales / TrialChip | — | **0** | Missing | Add P1 stories |
| Dedicated Tooltip gallery | — | **0** | Missing | Placements, keyboard, dark |
| Dedicated Snackbar / toast pattern | — | **0** | Missing | Document VSnackbar defaults |
| Layering stories (menu over card/table/sticky/modal/drawer) | — | **0** | Missing | Required by prompt Phase 9 |

Storybook loads production styles via [`src/styles/app-styles.ts`](../../src/styles/app-styles.ts) — **keep that sync**; no Storybook-only tokens.

Taxonomy note: Overlays group currently lists MpBuilderPreviewDialog, MpConfirmDialog, MpFormDrawer, MpRowActionsMenu ([`storybook-structure.md`](../design-system/storybook-structure.md)). Selectors live under Forms/Data Display — acceptable if documented.

---

## 11. Duplicate implementations & anti-patterns

| Issue | Severity | Action (later phases) |
|-------|----------|------------------------|
| Raw confirm `v-dialog` vs MpConfirmDialog | High | Migrate hotspots (e.g. Fulfillments ship) |
| Form `v-dialog` vs MpFormDrawer (ChatbotList create, CampaignTags import, DashboardFormDialog) | Medium–High | Migrate when touched; document exceptions |
| Ad-hoc kebab `v-menu` vs MpRowActionsMenu | Medium | Migrate list-row cases |
| DvHistoryDrawer vs MpFormDrawer | Medium | Align a11y/visual or document as shell panel |
| ~96 `v-snackbar` copies vs DvToastStack | Medium | Theme defaults first; optional composable later |
| Docs: VDialog `rounded="xl"` in vuetify-mapping vs no default | Low | Fix docs or add default |
| Light L2/L3 same fill | Medium | Token work — overlay separation via border+shadow fragile |
| Hardcoded menu padding/radii in global.scss | Low–Medium | Tokenise |
| Apex tooltip clip / contrast | High (charts) | Fix in charts package |

---

## 12. Recommended shared architecture (2A — locked)

Avoid nearly identical Mp wrappers. Use this decision tree:

```
Need confirm?           → MpConfirmDialog
Need create/edit form?  → MpFormDrawer
Need table row kebab?   → MpRowActionsMenu
Need folder filter?     → MpFolderSelect (+ manage/move)
Need analytics range?   → MpDateRangeSelect
Need large preview?     → MpBuilderPreviewDialog (or domain preview dialog)
Need field select?      → v-select / v-autocomplete / v-combobox (themed)
Need ephemeral hint?    → v-tooltip (themed)
Need interactive panel? → v-menu (themed); domain component if complex
Need toast?             → v-snackbar (themed defaults); DvToastStack for copilot stacks
Need command menu?      → AppBar palette (extract only if reused)
Need bottom sheet?      → Introduce only with shared responsive rules (currently unused)
```

**Do not create:** MpSelect, MpSearchableSelect, MpMultiSelect, MpSnackbar, MpTooltip, MpPopover, MpCommandMenu — unless a later audit proves theme-level polish is insufficient for a *behavioural* gap.

---

## 13. Proposed Phase 2+ package order

Small, independently testable packages (execution log to be created as `02-overlay-execution-log.md` when work starts):

1. **Semantic overlay tokens** — light `surfaceOverlay` / `scrim`; optional L4 surface; overlay spacing/radius; layer token docs (without overriding Vuetify z-index)
2. **Layer / z-index documentation** — complete the scale (drawer, tooltip, toast already partially present); keep Vuetify layers reference-only
3. **`maropostDefaults`** — VMenu, VDialog, VTooltip, VSnackbar (+ select menu props if available)
4. **Central overlay CSS** — replace literals in `global.scss` with tokens; reduce duplication with MpFormDrawer styles
5. **Polish Mp\* overlays** — visual consistency, sticky footers, empty/loading where missing
6. **Selector field + menu polish** — Form Fields + menu item states via theme/CSS
7. **Hotspot migrations** — raw confirms → MpConfirmDialog; list kebabs → MpRowActionsMenu; clear form dialogs → MpFormDrawer
8. **Storybook** — state matrices, tooltip gallery, snackbar pattern, **layering stories**, missing domain stories
9. **A11y + responsive corrections** — focus, reduced motion, mobile rules
10. **Duplicate cleanup** — remove migrated raw dialogs
11. **Independent audit** → `03-independent-overlay-audit.md` (blocker/high/medium must pass)

---

## 14. Phase 1 success checklist

- [x] Every overlay family documented with files, issues, Storybook, 2A recommendation
- [x] Primitive counts captured
- [x] Token / z-index / defaults / global CSS gaps listed
- [x] Duplicates and anti-patterns listed
- [x] Storybook coverage matrix included
- [x] Recommendations follow theme/token-first (2A), not full MpSelect wrapping
- [x] No production code, tokens, or stories changed in this phase

---

## 15. Hard-stop

**Phase 1 complete.** Awaiting human review before any Phase 2 token, CSS, component, or Storybook work.

Review questions for stakeholders:
1. Approve 2A decision tree (§12)?
2. Priority for first implementation package — tokens, Vuetify defaults, or hotspot confirm migrations?
3. Are DashboardFormDialog / Chatbot create dialogs approved exceptions, or should they move to MpFormDrawer?
